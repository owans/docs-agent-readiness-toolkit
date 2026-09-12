import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, withDerivedId } from "../src/canonical.js";
import { runCli } from "../src/cli.js";
import { compareReports } from "../src/compare.js";
import type { AnalysisReport, Finding, Policy } from "../src/contracts.js";
import { evaluatePolicy, loadTrustedPolicy } from "../src/policy.js";
import {
  loadAnalysisReport,
  loadAnalysisReportFromRoot,
  renderMarkdownReport,
} from "../src/report.js";
import { validateSchema } from "../src/schema.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface Scenario extends RunDefinition {
  expected: Record<string, unknown>;
}

function reportWithFinding(report: AnalysisReport, finding: Finding): AnalysisReport {
  return { ...report, findings: [finding] };
}

function reportWithCompatibilityVersion(
  report: AnalysisReport,
  field: "parser_version" | "canonicalizer_version" | "identity_algorithm_version",
  value: string,
): AnalysisReport {
  return {
    ...report,
    compatibility: { ...report.compatibility, [field]: value },
  } as AnalysisReport;
}

const noBlockPolicy: Policy = {
  schema_version: "1.0",
  incompatible_baseline: "ADVISORY",
  external_afdocs_required: false,
  rules: [],
};

describe("baseline comparison", () => {
  it("emits UNCHANGED for an identical compatible finding", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const comparison = compareReports(run.report, run.report);
      expect(comparison.compatible).toBe(true);
      expect(comparison.regressions.every((item) => item.state === "UNCHANGED")).toBe(true);
      await validateSchema("comparison-report", comparison);
    } finally {
      await run.cleanup();
    }
  });

  it("emits NEW for a current-only finding", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const currentFinding = run.report.findings[0];
      expect(currentFinding).toBeDefined();
      const baseline = { ...run.report, findings: [] };
      const comparison = compareReports(baseline, run.report);
      expect(comparison.regressions).toContainEqual(
        expect.objectContaining({ state: "NEW", fingerprint: currentFinding?.fingerprint }),
      );
    } finally {
      await run.cleanup();
    }
  });

  it("emits RESOLVED only for an explicit compatible issue-to-pass transition", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const passing = run.report.findings.find((item) => item.rule_id === "DART-OPS-001");
      expect(passing).toBeDefined();
      const failing = { ...passing, status: "FAIL" as const } as Finding;
      const comparison = compareReports(
        reportWithFinding(run.report, failing),
        reportWithFinding(run.report, passing as Finding),
      );
      expect(comparison.regressions).toEqual([
        expect.objectContaining({
          state: "RESOLVED",
          previous_status: "FAIL",
          current_status: "PASS",
        }),
      ]);
    } finally {
      await run.cleanup();
    }
  });

  it("does not infer resolution from a missing prior issue", async () => {
    const scenario = await readScenario<Scenario>("canaries/01-source-omission");
    const run = await materializeRun(scenario);
    try {
      const failing = run.report.findings.find((item) => item.status === "FAIL");
      expect(failing).toBeDefined();
      const comparison = compareReports(reportWithFinding(run.report, failing as Finding), {
        ...run.report,
        findings: [],
      });
      expect(comparison.regressions[0]).toMatchObject({
        state: "INCOMPATIBLE",
        reason: "TARGET_IDENTITY_CHANGED",
      });
    } finally {
      await run.cleanup();
    }
  });

  it("reports a removed PASS target as incompatible scope", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const passing = run.report.findings.find((item) => item.status === "PASS");
      expect(passing).toBeDefined();
      const comparison = compareReports(reportWithFinding(run.report, passing as Finding), {
        ...run.report,
        findings: [],
      });
      expect(comparison.regressions[0]).toMatchObject({
        state: "INCOMPATIBLE",
        reason: "TARGET_IDENTITY_CHANGED",
      });
    } finally {
      await run.cleanup();
    }
  });

  it.each([
    ["parser_version", "PARSER_VERSION_CHANGED"],
    ["canonicalizer_version", "CANONICALIZER_VERSION_CHANGED"],
    ["identity_algorithm_version", "IDENTITY_ALGORITHM_CHANGED"],
  ] as const)("emits the reason for a %s change only", async (field, expectedReason) => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const baseline = reportWithCompatibilityVersion(run.report, field, "changed-for-test");
      expect(compareReports(baseline, run.report)).toMatchObject({
        compatible: false,
        regressions: [
          {
            state: "INCOMPATIBLE",
            fingerprint: "*",
            reason: expectedReason,
          },
        ],
      });
    } finally {
      await run.cleanup();
    }
  });
});

describe("policy and reports", () => {
  it("keeps advisory findings non-blocking", async () => {
    const scenario = await readScenario<Scenario>("canaries/01-source-omission");
    const run = await materializeRun(scenario);
    try {
      const result = evaluatePolicy(run.report, undefined, {
        ...noBlockPolicy,
        rules: [{ finding_status: "FAIL", effect: "ADVISORY" }],
      });
      expect(result).toMatchObject({ effect: "ADVISORY", exit_code: 0 });
    } finally {
      await run.cleanup();
    }
  });

  it("uses exit 4 when required AFDocs evidence is unavailable", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      expect(
        evaluatePolicy(run.report, undefined, {
          ...noBlockPolicy,
          external_afdocs_required: true,
        }).exit_code,
      ).toBe(4);
    } finally {
      await run.cleanup();
    }
  });

  it("uses exit 5 when incompatibility is configured as an error", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const comparison = {
        schema_version: "1.0" as const,
        baseline_report_id: run.report.report_id,
        current_report_id: run.report.report_id,
        compatible: false,
        regressions: [
          {
            state: "INCOMPATIBLE" as const,
            fingerprint: "*",
            reason: "RULE_VERSION_CHANGED" as const,
          },
        ],
      };
      expect(
        evaluatePolicy(run.report, comparison, {
          ...noBlockPolicy,
          incompatible_baseline: "ERROR",
        }).exit_code,
      ).toBe(5);
    } finally {
      await run.cleanup();
    }
  });

  it("does not equate zero failures with complete evidence", async () => {
    const scenario = await readScenario<Scenario>("canaries/04-provenance-uncertainty");
    const run = await materializeRun(scenario);
    try {
      const result = evaluatePolicy(run.report, undefined, {
        ...noBlockPolicy,
        required_completeness: { SOURCE: "COMPLETE" },
      });
      expect(run.report.findings.filter((item) => item.status === "FAIL")).toHaveLength(0);
      expect(run.report.evidence_completeness.SOURCE).toBe("NOT_REQUESTED");
      expect(result).toMatchObject({ effect: "BLOCKING", exit_code: 1 });
    } finally {
      await run.cleanup();
    }
  });

  it("renders deterministic JSON and concise Markdown", async () => {
    const scenario = await readScenario<Scenario>("canaries/01-source-omission");
    const run = await materializeRun(scenario);
    try {
      expect(canonicalJson(run.report)).toBe(canonicalJson(run.report));
      await validateSchema("analysis-report", run.report);
      const markdown = renderMarkdownReport(run.report);
      expect(markdown).toContain("Evidence completeness");
      expect(markdown).toContain("Evidence boundary: BUILD");
      expect(markdown).not.toContain("readiness score");
    } finally {
      await run.cleanup();
    }
  });

  it("rejects a report whose content no longer matches its report id", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const tampered = {
        ...run.report,
        findings: run.report.findings.map((finding, index) =>
          index === 0 ? { ...finding, deterministic_fact: "tampered" } : finding,
        ),
      };
      const path = `${run.root}/tampered-report.json`;
      await writeFile(path, canonicalJson(tampered), "utf8");
      await expect(loadAnalysisReport(path)).rejects.toThrow("Analysis report integrity mismatch");
    } finally {
      await run.cleanup();
    }
  });

  it("rejects a malformed report even when its report id is recomputed", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const malformed = structuredClone(run.report) as unknown as Record<string, unknown>;
      const findings = malformed.findings as Array<Record<string, unknown>>;
      delete findings[0]?.recommended_fix;
      const reidentified = withDerivedId(malformed, "report_id");
      const path = `${run.root}/malformed-report.json`;
      await writeFile(path, canonicalJson(reidentified), "utf8");
      await expect(loadAnalysisReport(path)).rejects.toThrow("validation failed");
    } finally {
      await run.cleanup();
    }
  });
});

describe("trusted base and command exits", () => {
  it("enforces the checked-in trusted baseline and policy", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const trusted = await loadTrustedPolicy(process.cwd());
      expect(trusted.baselineRelativePath).toBeDefined();
      const baseline = await loadAnalysisReportFromRoot(
        process.cwd(),
        trusted.baselineRelativePath as string,
      );
      const comparison = compareReports(baseline, run.report);
      expect(comparison.compatible).toBe(true);
      expect(evaluatePolicy(run.report, comparison, trusted.policy).exit_code).toBe(0);
    } finally {
      await run.cleanup();
    }
  });

  it("loads policy only from the explicit trusted base root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-trusted-"));
    try {
      await mkdir(path.join(root, ".docs-agent-readiness"), { recursive: true });
      await writeFile(
        path.join(root, ".docs-agent-readiness", "policy.json"),
        JSON.stringify(noBlockPolicy),
        "utf8",
      );
      const loaded = await loadTrustedPolicy(root);
      expect(loaded.policy).toEqual(noBlockPolicy);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a symlinked trusted policy", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-trusted-"));
    try {
      await mkdir(path.join(root, ".docs-agent-readiness"), { recursive: true });
      const outside = path.join(root, "outside.json");
      await writeFile(outside, JSON.stringify(noBlockPolicy), "utf8");
      await symlink(outside, path.join(root, ".docs-agent-readiness", "policy.json"));
      await expect(loadTrustedPolicy(root)).rejects.toThrow("Symlinks are not allowed");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns exit 2 for invalid usage and exit 3 for required input failure", async () => {
    const sink = { stdout: () => undefined, stderr: () => undefined };
    await expect(runCli(["unknown"], sink)).resolves.toBe(2);
    await expect(runCli(["analyze", "--bundle", "/definitely/not/present"], sink)).resolves.toBe(3);
  });

  it("returns exit 2 for malformed collector configuration", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-config-"));
    try {
      const config = path.join(root, "config.json");
      await writeFile(config, "{not-json", "utf8");
      const sink = { stdout: () => undefined, stderr: () => undefined };
      await expect(
        runCli(
          ["bundle", "create", "--config", config, "--output", path.join(root, "bundle")],
          sink,
        ),
      ).resolves.toBe(2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns exit 2 for invalid trusted policy configuration", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    const trusted = await mkdtemp(path.join(os.tmpdir(), "dart-trusted-"));
    try {
      await mkdir(path.join(trusted, ".docs-agent-readiness"), { recursive: true });
      await writeFile(
        path.join(trusted, ".docs-agent-readiness", "policy.json"),
        '{"schema_version":"1.0"}',
        "utf8",
      );
      const sink = { stdout: () => undefined, stderr: () => undefined };
      await expect(
        runCli(["ci", "--bundle", run.bundlePath, "--trusted-base-root", trusted], sink),
      ).resolves.toBe(2);
    } finally {
      await run.cleanup();
      await rm(trusted, { recursive: true, force: true });
    }
  });

  it("returns exit 2 for a trusted policy with an escaping baseline path", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    const trusted = await mkdtemp(path.join(os.tmpdir(), "dart-trusted-"));
    try {
      await mkdir(path.join(trusted, ".docs-agent-readiness"), { recursive: true });
      await writeFile(
        path.join(trusted, ".docs-agent-readiness", "policy.json"),
        JSON.stringify({ ...noBlockPolicy, baseline_path: "../escape.json" }),
        "utf8",
      );
      const sink = { stdout: () => undefined, stderr: () => undefined };
      await expect(
        runCli(["ci", "--bundle", run.bundlePath, "--trusted-base-root", trusted], sink),
      ).resolves.toBe(2);
    } finally {
      await run.cleanup();
      await rm(trusted, { recursive: true, force: true });
    }
  });
});
