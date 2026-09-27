import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importRecordedAfdocs } from "../src/afdocs.js";
import { analyzeBundle } from "../src/analyze.js";
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
    expect(markdown).toContain("### DART-OPS-001: Explicit source-to-build identity");
    expect(markdown).toContain("- Status: PASS");
    expect(markdown).toContain("- Identity: IDENTITY_ASSERTED");
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
      expect(markdown).toContain("PASS -> FAIL");
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
