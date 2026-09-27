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
import { validateSchema } from "./schema.js";
import { readBoundedFile, readSafeFile } from "./security/paths.js";
import { markdownText } from "./security/sanitize.js";

/**
 * Recorded evidence locators keyed by evidence ID. The renderer never reads the
 * filesystem; callers supply locators from a loaded bundle manifest.
 */
export type EvidenceLocators = Record<string, TrustedValue>;

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

function findingLines(finding: Finding, locators: EvidenceLocators): string[] {
  const lines = [
    "",
    `### ${markdownText(finding.rule_id)}: ${markdownText(finding.title)}`,
    "",
    `- Status: ${finding.status}`,
    `- Severity: ${finding.severity}`,
    `- Target: \`${markdownText(finding.target.identity)}\` (${finding.target.kind})`,
    `- Sub-identity: \`${markdownText(finding.sub_identity)}\``,
    `- Evidence mode: ${finding.evidence_mode}`,
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
    ...Object.entries(report.evidence_completeness).map(
      ([mode, state]) => `| ${markdownText(mode)} | ${markdownText(state)} |`,
    ),
    "",
    "## Findings",
    "",
    "Counts summarize status only. A status is not a policy decision, and a passing",
    "status does not establish authenticity, freshness, or lineage.",
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
          `- CHANGED ${markdownText(regression.fingerprint)}: ${regression.previous_status} -> ${regression.current_status}`,
        );
      }
      if (regression.state === "INCOMPATIBLE") {
        lines.push(
          `- INCOMPATIBLE ${markdownText(regression.fingerprint)}: ${regression.reason ?? "unspecified"}`,
        );
      }
    }
  }

  if (policy) {
    lines.push(
      "",
      "## Policy",
      "",
      `- Effect: ${policy.effect}`,
      `- Blocking: ${policy.blocking}`,
      `- Advisory: ${policy.advisory}`,
      `- Informational: ${policy.informational}`,
      `- Exit code: ${policy.exit_code}`,
      "",
      `Result: ${policy.exit_code === 0 ? "ALLOWED" : "BLOCKED"}`,
    );
  }
  return `${lines.join("\n")}\n`;
}
