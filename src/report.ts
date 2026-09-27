import { writeFile } from "node:fs/promises";
import { canonicalJson, compareCodePoint, derivedId } from "./canonical.js";
import type {
  AnalysisReport,
  ComparisonReport,
  FindingStatus,
  PolicyResult,
  RegressionState,
} from "./contracts.js";
import type { Finding, TrustedValue } from "./contracts.js";
import { describeRegression } from "./policy.js";
import { validateSchema } from "./schema.js";
import { readBoundedFile, readSafeFile } from "./security/paths.js";
import { markdownText } from "./security/sanitize.js";

/**
 * Recorded evidence locators keyed by evidence ID. The renderer never reads the
 * filesystem; callers supply locators from a loaded bundle manifest.
 */
export type EvidenceLocators = Record<string, TrustedValue>;

/**
 * Fixed render order. A report parsed from canonical JSON has alphabetically sorted
 * keys, so relying on key order would make the same report render differently
 * depending on where it came from.
 */
const COMPLETENESS_ORDER: (keyof AnalysisReport["evidence_completeness"])[] = [
  "SOURCE",
  "BUILD",
  "LIVE",
  "RUNTIME_OBSERVATION",
  "TASK_EVALUATION",
  "EXTERNAL",
];

export async function writeCanonicalJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, canonicalJson(value), { encoding: "utf8", flag: "wx" });
}

async function parseAnalysisReport(bytes: Uint8Array, source: string): Promise<AnalysisReport> {
  const value = JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  await validateSchema("analysis-report", value);
  const report = value as AnalysisReport;
  const expected = derivedId(report as unknown as Record<string, unknown>, "report_id");
  if (report.report_id !== expected) {
    throw new Error(`Analysis report integrity mismatch: ${source}`);
  }
  return report;
}

export async function loadAnalysisReport(path: string): Promise<AnalysisReport> {
  return parseAnalysisReport(await readBoundedFile(path, 10 * 1024 * 1024), path);
}

export async function loadAnalysisReportFromRoot(
  root: string,
  relativePath: string,
): Promise<AnalysisReport> {
  return parseAnalysisReport(await readSafeFile(root, relativePath), relativePath);
}

function countBy<T extends string>(values: T[], keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(
    keys.map((key) => [key, values.filter((value) => value === key).length]),
  ) as Record<T, number>;
}

function scalarText(value: unknown): string {
  if (value === null || value === undefined) {
    return "none";
  }
  if (typeof value === "string") {
    return markdownText(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return markdownText(JSON.stringify(value));
}

function valueLines(label: string, value: unknown): string[] {
  if (value === null || value === undefined) {
    return [`- ${label}: none`];
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return [`- ${label}: ${scalarText(value)}`];
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, entry]): [string, unknown] => [key, entry])
    .sort(([left], [right]) => compareCodePoint(left, right))
    .map(([key, entry]) => `- ${label} ${markdownText(key)}: ${scalarText(entry)}`);
}

function exitCodeExplanation(policy: PolicyResult): string {
  switch (policy.exit_code) {
    case 0:
      return "no blocking policy result";
    case 1:
      return `${policy.blocking} blocking policy result${policy.blocking === 1 ? "" : "s"}`;
    case 4:
      return "required recorded evaluator evidence is unavailable, which is configured as an error";
    default:
      return "the baseline comparison is incompatible, which is configured as an error";
  }
}

function findingLines(finding: Finding, locators: EvidenceLocators): string[] {
  const lines = [
    "",
    `### ${markdownText(finding.rule_id)} ${markdownText(finding.sub_identity)}: ${markdownText(finding.title)}`,
    "",
    `- Status: ${finding.status}`,
    `- Severity: ${finding.severity}`,
    `- Declared target: \`${markdownText(finding.target.identity)}\` (${finding.target.kind})`,
    `- Sub-identity: \`${markdownText(finding.sub_identity)}\``,
    `- Evidence boundary: ${finding.responsible_boundary ?? "none"}`,
    `- Identity: ${finding.identity_status}`,
    `- Fact: ${markdownText(finding.deterministic_fact)}`,
    ...valueLines("Observed", finding.observed_value),
    ...valueLines("Expected", finding.expected_value),
  ];

  for (const item of finding.evidence) {
    const locator = locators[item.evidence_id];
    const location = locator
      ? ` at \`${markdownText(locator.value)}\` (locator trust ${locator.trust})`
      : "";
    lines.push(
      `- Evidence \`${markdownText(item.evidence_id)}\`${location}, sha256 ${item.sha256}`,
    );
  }
  if (finding.evidence.length === 0) {
    lines.push("- Evidence: none captured");
  }

  for (const cause of finding.likely_causes) {
    lines.push(`- Likely cause (${cause.confidence}): ${markdownText(cause.text)}`);
  }
  if (finding.likely_causes.length === 0) {
    lines.push("- Likely cause: none inferred");
  }

  lines.push(
    `- Recommended action: ${markdownText(finding.recommended_fix)}`,
    `- Validation: ${markdownText(finding.validation_method)}`,
  );
  return lines;
}

export function renderMarkdownReport(
  report: AnalysisReport,
  comparison?: ComparisonReport,
  policy?: PolicyResult,
  locators: EvidenceLocators = {},
): string {
  const findingStatuses: FindingStatus[] = [
    "PASS",
    "WARN",
    "FAIL",
    "SKIP",
    "NOT_APPLICABLE",
    "UNAVAILABLE",
  ];
  const regressionStates: RegressionState[] = [
    "NEW",
    "RESOLVED",
    "CHANGED",
    "UNCHANGED",
    "INCOMPATIBLE",
  ];
  const findingCounts = countBy(
    report.findings.map((finding) => finding.status),
    findingStatuses,
  );
  const regressionCounts = countBy(
    comparison?.regressions.map((regression) => regression.state) ?? [],
    regressionStates,
  );
  const lines = [
    "# Documentation Readiness Run",
    "",
    `Report: \`${markdownText(report.report_id)}\``,
    `Evidence bundle: \`${markdownText(report.bundle_id)}\``,
    "Replay: offline",
    "",
    "## Evidence completeness",
    "",
    "| Evidence | Completeness |",
    "| --- | --- |",
    ...COMPLETENESS_ORDER.map(
      (mode) =>
        `| ${mode} | ${markdownText(report.evidence_completeness[mode] ?? "NOT_REQUESTED")} |`,
    ),
    "",
    "## Findings",
    "",
    "Counts summarize status only. A status is not a policy decision. PASS is a check",
    "status, not approval of origin, freshness, lineage, or deployment. Imported",
    "evaluator results are counted separately under external evaluations and never",
    "appear here.",
    "",
    "A declared target names the endpoint the rule evaluated, which on a failure is the",
    "evidence that was present. The fact line names the side that is absent.",
    "",
    ...findingStatuses.map((status) => `- ${status}: ${findingCounts[status]}`),
  ];

  for (const finding of report.findings) {
    lines.push(...findingLines(finding, locators));
  }

  if (report.external_evaluations.length > 0) {
    lines.push("", "## External evaluations");
    for (const evaluation of report.external_evaluations) {
      lines.push(
        "",
        `### ${markdownText(evaluation.producer)} ${markdownText(evaluation.evaluator_version)}`,
        "",
        `- Evidence boundary: EXTERNAL`,
        `- Acquisition: ${evaluation.acquisition}`,
        `- Adapter status: ${evaluation.status}`,
        `- Raw score: ${evaluation.raw_score ?? "unavailable"}`,
      );
      if (evaluation.reason) {
        lines.push(`- Reason: ${markdownText(evaluation.reason)}`);
      }
      for (const check of evaluation.checks?.filter((item) => item.normalized_status !== "PASS") ??
        []) {
        lines.push(
          `- ${markdownText(check.id)}: ${check.normalized_status} (raw ${markdownText(check.raw_status)})`,
        );
      }
    }
  }

  if (comparison) {
    lines.push(
      "",
      "## Regression",
      "",
      "A regression state describes change against a compatible baseline. It is neither a",
      "finding status nor a policy decision.",
      "",
      `- Baseline report: \`${markdownText(comparison.baseline_report_id)}\``,
      `- Current report: \`${markdownText(comparison.current_report_id)}\``,
      `- Compatible: ${comparison.compatible}`,
      "",
      ...regressionStates.map((state) => `- ${state}: ${regressionCounts[state]}`),
    );
    for (const regression of comparison.regressions) {
      if (regression.state === "CHANGED") {
        lines.push(
          `- CHANGED ${markdownText(describeRegression(regression))}: ${regression.previous_status} -> ${regression.current_status}`,
        );
      }
      if (regression.state === "INCOMPATIBLE") {
        lines.push(
          `- INCOMPATIBLE (${markdownText(describeRegression(regression))}): ${regression.reason ?? "unspecified"}`,
        );
      }
    }
  }

  if (policy) {
    lines.push(
      "",
      "## Policy",
      "",
      "Policy turns findings and regression states into a CI outcome. The effect and the",
      "counts below describe matched rules only.",
      "",
      `- Effect: ${policy.effect}`,
      `- Blocking: ${policy.blocking}`,
      `- Advisory: ${policy.advisory}`,
      `- Informational: ${policy.informational}`,
      `- Exit code: ${policy.exit_code}`,
    );
    if (policy.reasons.length > 0) {
      lines.push("", "Reasons:", "");
      for (const reason of policy.reasons) {
        lines.push(`- ${markdownText(reason)}`);
      }
    }
    lines.push(
      "",
      `Result: ${policy.exit_code === 0 ? "ALLOWED" : "BLOCKED"} (${exitCodeExplanation(policy)})`,
    );
  }
  return `${lines.join("\n")}\n`;
}
