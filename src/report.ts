import { writeFile } from "node:fs/promises";
import { canonicalJson, derivedId } from "./canonical.js";
import type {
  AnalysisReport,
  ComparisonReport,
  FindingStatus,
  PolicyResult,
  RegressionState,
} from "./contracts.js";
import { validateSchema } from "./schema.js";
import { readBoundedFile, readSafeFile } from "./security/paths.js";
import { markdownText } from "./security/sanitize.js";

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

export function renderMarkdownReport(
  report: AnalysisReport,
  comparison?: ComparisonReport,
  policy?: PolicyResult,
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
    ...findingStatuses.map((status) => `- ${status}: ${findingCounts[status]}`),
  ];

  for (const finding of report.findings.filter((item) => item.status !== "PASS")) {
    lines.push(
      "",
      `### ${markdownText(finding.rule_id)}: ${markdownText(finding.title)}`,
      "",
      `- Status: ${finding.status}`,
      `- Target: \`${markdownText(finding.target.identity)}\``,
      `- Evidence boundary: ${finding.responsible_boundary ?? "none"}`,
      `- Identity: ${finding.identity_status}`,
      `- Fact: ${markdownText(finding.deterministic_fact)}`,
      `- Recommended action: ${markdownText(finding.recommended_fix)}`,
      `- Validation: ${markdownText(finding.validation_method)}`,
      `- Evidence: ${finding.evidence
        .map((item) => `${markdownText(item.evidence_id)} (${item.sha256})`)
        .join(", ")}`,
    );
    for (const cause of finding.likely_causes) {
      lines.push(`- Likely cause (${cause.confidence}): ${markdownText(cause.text)}`);
    }
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
      ...regressionStates.map((state) => `- ${state}: ${regressionCounts[state]}`),
    );
    for (const regression of comparison.regressions.filter((item) => item.state === "CHANGED")) {
      lines.push(
        `- CHANGED ${markdownText(regression.fingerprint)}: ${regression.previous_status} -> ${regression.current_status}`,
      );
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
