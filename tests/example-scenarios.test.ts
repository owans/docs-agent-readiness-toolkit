import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importRecordedAfdocs } from "../src/afdocs.js";
import { analyzeBundle } from "../src/analyze.js";
import { canonicalJson } from "../src/canonical.js";
import { runCli } from "../src/cli.js";
import { compareReports } from "../src/compare.js";
import type { AnalysisReport } from "../src/contracts.js";
import { collectEvidenceBundle, loadEvidenceBundle } from "../src/evidence.js";
import { evaluatePolicy, loadTrustedPolicy } from "../src/policy.js";
import {
  type EvidenceLocators,
  loadAnalysisReport,
  loadAnalysisReportFromRoot,
  renderMarkdownReport,
  writeCanonicalJson,
} from "../src/report.js";

const scenarioRoot = path.join(process.cwd(), "examples", "scenarios");

async function runScenario(
  relativePath: string,
  options: { external?: boolean } = {},
): Promise<{ report: AnalysisReport; locators: EvidenceLocators }> {
  const output = await mkdtemp(path.join(os.tmpdir(), "dart-example-"));
  try {
    const bundlePath = path.join(output, "bundle");
    await collectEvidenceBundle(
      path.join(scenarioRoot, relativePath, "collector.json"),
      bundlePath,
    );
    const bundle = await loadEvidenceBundle(bundlePath);
    const external = options.external ? await importRecordedAfdocs(bundle) : undefined;
    const locators: EvidenceLocators = Object.fromEntries(
      bundle.manifest.evidence.flatMap((evidence) =>
        evidence.provenance.source ? [[evidence.id, evidence.provenance.source] as const] : [],
      ),
    );
    return { report: analyzeBundle(bundle, external), locators };
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

async function analyzeScenario(
  relativePath: string,
  options: { external?: boolean } = {},
): Promise<AnalysisReport> {
  return (await runScenario(relativePath, options)).report;
}

const cliSink = { stdout: () => undefined, stderr: () => undefined };

async function analyzeScenarioToFile(
  root: string,
  relativePath: string,
  name: string,
): Promise<string> {
  const bundlePath = path.join(root, `${name}-bundle`);
  const reportPath = path.join(root, `${name}.json`);
  await runCli(
    [
      "bundle",
      "create",
      "--config",
      path.join(scenarioRoot, relativePath, "collector.json"),
      "--output",
      bundlePath,
    ],
    cliSink,
  );
  await runCli(["analyze", "--bundle", bundlePath, "--json", reportPath], cliSink);
  return reportPath;
}

describe("committed practitioner scenarios", () => {
  it.each([
    ["source-defect", "DART-OPS-001", "SOURCE"],
    ["build-defect", "DART-OPS-001", "BUILD"],
    ["live-drift", "DART-OPS-002", "LIVE"],
  ] as const)("localizes %s to the %s boundary", async (scenario, ruleId, boundary) => {
    const report = await analyzeScenario(scenario);
    expect(
      report.findings.some(
        (finding) =>
          finding.rule_id === ruleId &&
          finding.status === "FAIL" &&
          finding.responsible_boundary === boundary,
      ),
    ).toBe(true);
  });

  it("keeps a clean explicit mapping asserted rather than established", async () => {
    const report = await analyzeScenario("clean-mapping");
    const finding = report.findings.find((item) => item.rule_id === "DART-OPS-001");
    expect(finding).toMatchObject({
      status: "PASS",
      identity_status: "IDENTITY_ASSERTED",
      responsible_boundary: null,
    });
    expect(finding?.recommended_fix).toContain("this status is not an approval");
    expect(finding?.recommended_fix).not.toContain("No remediation required");
  });

  it("preserves asserted deployment provenance as unverified", async () => {
    const report = await analyzeScenario("asserted-provenance");
    const finding = report.findings.find((item) => item.sub_identity === "live:asserted");
    expect(finding).toMatchObject({
      status: "PASS",
      identity_status: "IDENTITY_UNVERIFIED",
      observed_value: {
        acquisition: "ASSERTED",
        authenticity: "ASSERTED",
        deployment_trust: "USER_ASSERTED",
      },
    });
  });

  it("keeps an imported evaluator failure outside internal findings", async () => {
    const report = await analyzeScenario("external-defect", { external: true });
    expect(report.external_evaluations[0]).toMatchObject({
      producer: "afdocs",
      acquisition: "IMPORTED",
      status: "AVAILABLE",
      checks: [{ raw_status: "fail", normalized_status: "FAIL" }],
    });
    expect(report.findings.some((finding) => String(finding.rule_id) === "llms-txt-exists")).toBe(
      false,
    );
  });

  it("classifies the regression pair as a compatible CHANGED transition", async () => {
    const baseline = await analyzeScenario("regression/baseline");
    const current = await analyzeScenario("regression/current");
    expect(baseline.findings.map((finding) => finding.fingerprint)).toEqual([
      "sha256:e0aab5ae9e28cdfd77833d3f98dce8e9484cea5a6b5ea7017470d1d45f23698e",
      "sha256:c16be0a31d56a663ce66e29fc98236e71fa91c495ba703c901af200e870d8cb8",
      "sha256:c19e673699d0ba1a1a913302b8121ad20d9c9923e1440a37f217ee5d9580ae3a",
    ]);
    const comparison = compareReports(baseline, current);
    expect(comparison.compatible).toBe(true);
    expect(
      comparison.regressions.find(
        (item) => item.state === "CHANGED" && item.current?.rule_id === "DART-OPS-001",
      ),
    ).toMatchObject({
      state: "CHANGED",
      previous_status: "PASS",
      current_status: "FAIL",
    });
  });

  it("treats a recorded live drift as advisory under the committed advisory policy", async () => {
    const trustedRoot = path.join(scenarioRoot, "live-drift", "trusted-base");
    const trusted = await loadTrustedPolicy(trustedRoot);
    const report = await analyzeScenario("live-drift");
    expect(trusted.baselineRelativePath).toBeUndefined();
    expect(evaluatePolicy(report, undefined, trusted.policy)).toMatchObject({
      effect: "ADVISORY",
      blocking: 0,
      exit_code: 0,
    });
  });

  it("blocks the regression scenario under the committed trusted baseline and policy", async () => {
    const trustedRoot = path.join(scenarioRoot, "regression", "trusted-base");
    const trusted = await loadTrustedPolicy(trustedRoot);
    expect(trusted.baselineRelativePath).toBe("baseline-report.json");
    const baseline = await loadAnalysisReportFromRoot(
      trustedRoot,
      String(trusted.baselineRelativePath),
    );
    const current = await analyzeScenario("regression/current");
    const comparison = compareReports(baseline, current);
    expect(comparison.compatible).toBe(true);
    expect(evaluatePolicy(current, comparison, trusted.policy)).toMatchObject({
      effect: "BLOCKING",
      exit_code: 1,
    });
  });

  it("renders passing findings with their locations and trust qualifiers", async () => {
    const { report, locators } = await runScenario("clean-mapping");
    const markdown = renderMarkdownReport(report, undefined, undefined, locators);
    expect(markdown).toContain(
      "### DART-OPS-001 mapping:getting-started: Explicit source-to-build mapping",
    );
    expect(markdown).toContain("- Status: PASS");
    expect(markdown).toContain("- Identity: IDENTITY_ASSERTED");
    expect(markdown).toContain("not approval of origin, freshness, lineage, or deployment");
    expect(markdown).not.toContain("No remediation required");
    expect(markdown).toContain("- Observed authenticity: UNVERIFIED");
    expect(markdown).toContain("- Observed freshness: UNKNOWN");
    expect(markdown).toContain("- Expected integrity: MATCHED");
    expect(markdown).toContain(
      "at `SOURCE:docs/getting-started.md` (locator trust OBSERVED_BY_COLLECTOR)",
    );
    expect(markdown).not.toContain("readiness score");
  });

  it("writes a Markdown comparison for a compatible regression pair", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-compare-md-"));
    try {
      const baseline = await analyzeScenarioToFile(root, "regression/baseline", "baseline");
      const current = await analyzeScenarioToFile(root, "regression/current", "current");
      const markdownPath = path.join(root, "comparison.md");
      const code = await runCli(
        [
          "compare",
          "--baseline",
          baseline,
          "--current",
          current,
          "--json",
          path.join(root, "comparison.json"),
          "--markdown",
          markdownPath,
        ],
        cliSink,
      );
      expect(code).toBe(0);
      const markdown = await readFile(markdownPath, "utf8");
      expect(markdown).toContain("## Regression");
      expect(markdown).toContain("- Compatible: true");
      expect(markdown).toContain("- CHANGED: 2");
      expect(markdown).toContain(
        "CHANGED DART-OPS-001 mapping:page on declared target build:page: PASS -> FAIL",
      );
      expect(markdown).not.toMatch(/CHANGED sha256:/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("names the incompatibility reason in the Markdown comparison", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-compare-md-"));
    try {
      const current = await analyzeScenarioToFile(root, "incompatible-baseline", "current");
      const markdownPath = path.join(root, "comparison.md");
      const code = await runCli(
        [
          "compare",
          "--baseline",
          path.join(scenarioRoot, "incompatible-baseline", "incompatible-baseline.json"),
          "--current",
          current,
          "--json",
          path.join(root, "comparison.json"),
          "--markdown",
          markdownPath,
        ],
        cliSink,
      );
      expect(code).toBe(5);
      const markdown = await readFile(markdownPath, "utf8");
      expect(markdown).toContain("- Compatible: false");
      expect(markdown).toContain("- INCOMPATIBLE: 1");
      expect(markdown).toContain("RULE_VERSION_CHANGED");
      expect(markdown).not.toContain("- NEW: 1");
      expect(markdown).not.toContain("- RESOLVED: 1");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("renders compare Markdown locations when a bundle is supplied", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-compare-bundle-"));
    try {
      const baseline = await analyzeScenarioToFile(root, "regression/baseline", "baseline");
      const current = await analyzeScenarioToFile(root, "regression/current", "current");
      const markdownPath = path.join(root, "comparison.md");
      const code = await runCli(
        [
          "compare",
          "--baseline",
          baseline,
          "--current",
          current,
          "--bundle",
          path.join(root, "current-bundle"),
          "--markdown",
          markdownPath,
        ],
        cliSink,
      );
      expect(code).toBe(0);
      const markdown = await readFile(markdownPath, "utf8");
      expect(markdown).toContain("at `SOURCE:docs/page.md` (locator trust OBSERVED_BY_COLLECTOR)");
      expect(markdown).toContain("| SOURCE |");
      expect(markdown).toContain("| BUILD |");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("renders the completeness table in the same order from memory and parsed JSON", async () => {
    const report = await analyzeScenario("clean-mapping");
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-completeness-"));
    try {
      const reportPath = path.join(root, "report.json");
      await writeCanonicalJson(reportPath, report);
      const fromMemory = renderMarkdownReport(report);
      const fromParsed = renderMarkdownReport(await loadAnalysisReport(reportPath));
      const table = (markdown: string): string => {
        const start = markdown.indexOf("| Evidence | Completeness |");
        const end = markdown.indexOf("## Findings");
        return markdown.slice(start, end);
      };
      expect(canonicalJson(report)).toBe(canonicalJson(await loadAnalysisReport(reportPath)));
      expect(table(fromMemory)).toBe(table(fromParsed));
      expect(table(fromMemory)).toContain(
        [
          "| SOURCE | COMPLETE |",
          "| BUILD | COMPLETE |",
          "| LIVE | NOT_REQUESTED |",
          "| RUNTIME_OBSERVATION | NOT_REQUESTED |",
          "| TASK_EVALUATION | NOT_REQUESTED |",
          "| EXTERNAL | NOT_REQUESTED |",
        ].join("\n"),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps one regression bundle advisory or blocking by trusted policy only", async () => {
    const current = await analyzeScenario("regression/current");
    const advisoryRoot = path.join(scenarioRoot, "regression", "trusted-base-advisory");
    const blockingRoot = path.join(scenarioRoot, "regression", "trusted-base");
    const advisory = await loadTrustedPolicy(advisoryRoot);
    const blocking = await loadTrustedPolicy(blockingRoot);
    const advisoryBaseline = await loadAnalysisReportFromRoot(
      advisoryRoot,
      String(advisory.baselineRelativePath),
    );
    const blockingBaseline = await loadAnalysisReportFromRoot(
      blockingRoot,
      String(blocking.baselineRelativePath),
    );
    const advisoryComparison = compareReports(advisoryBaseline, current);
    const blockingComparison = compareReports(blockingBaseline, current);
    expect(advisoryComparison.compatible).toBe(true);
    expect(blockingComparison.compatible).toBe(true);
    expect(advisoryComparison.current_report_id).toBe(blockingComparison.current_report_id);
    expect(evaluatePolicy(current, advisoryComparison, advisory.policy)).toMatchObject({
      effect: "ADVISORY",
      exit_code: 0,
    });
    const blockingResult = evaluatePolicy(current, blockingComparison, blocking.policy);
    expect(blockingResult).toMatchObject({
      effect: "BLOCKING",
      exit_code: 1,
    });
    expect(blockingResult.reasons.some((reason) => /sha256:[a-f0-9]{64}/u.test(reason))).toBe(
      false,
    );
    expect(
      blockingResult.reasons.some((reason) =>
        reason.includes(
          "BLOCKING: regression CHANGED DART-OPS-001 mapping:page on declared target build:page PASS -> FAIL",
        ),
      ),
    ).toBe(true);
  });

  it("labels the bundle digest and pluralizes a single evidence record", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-bundle-msg-"));
    try {
      let stdout = "";
      const code = await runCli(
        [
          "bundle",
          "create",
          "--config",
          path.join(scenarioRoot, "source-defect", "collector.json"),
          "--output",
          path.join(root, "bundle"),
        ],
        {
          stdout: (value) => {
            stdout += value;
          },
          stderr: () => undefined,
        },
      );
      expect(code).toBe(0);
      expect(stdout).toMatch(/^Bundle ID: sha256:[a-f0-9]{64}\n/u);
      expect(stdout).toContain("Collected 1 evidence record into");
      expect(stdout).not.toContain("Collected 1 evidence records");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("names an existing output path instead of surfacing a raw EEXIST error", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-eexist-"));
    try {
      const reportPath = path.join(root, "report.json");
      const bundlePath = path.join(root, "bundle");
      await runCli(
        [
          "bundle",
          "create",
          "--config",
          path.join(scenarioRoot, "clean-mapping", "collector.json"),
          "--output",
          bundlePath,
        ],
        cliSink,
      );
      expect(await runCli(["analyze", "--bundle", bundlePath, "--json", reportPath], cliSink)).toBe(
        0,
      );
      let stderr = "";
      const code = await runCli(["analyze", "--bundle", bundlePath, "--json", reportPath], {
        stdout: () => undefined,
        stderr: (value) => {
          stderr += value;
        },
      });
      expect(code).toBe(3);
      expect(stderr).toContain(`Refusing to overwrite an existing output file: ${reportPath}`);
      expect(stderr).toContain("Choose a new output path or remove the existing file.");
      expect(stderr).not.toContain("EEXIST");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("classifies the committed incompatible baseline without inventing state", async () => {
    const baseline = await loadAnalysisReport(
      path.join(scenarioRoot, "incompatible-baseline", "incompatible-baseline.json"),
    );
    const current = await analyzeScenario("incompatible-baseline");
    const comparison = compareReports(baseline, current);
    expect(comparison.compatible).toBe(false);
    expect(comparison.regressions).toEqual([
      { state: "INCOMPATIBLE", fingerprint: "*", reason: "RULE_VERSION_CHANGED" },
    ]);
  });
});
