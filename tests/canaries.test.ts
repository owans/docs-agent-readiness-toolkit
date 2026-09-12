import { describe, expect, it } from "vitest";
import { compareReports } from "../src/compare.js";
import type { AnalysisReport, Policy } from "../src/contracts.js";
import { evaluatePolicy } from "../src/policy.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface SingleScenario extends RunDefinition {
  expected: Record<string, unknown>;
}

interface PairedScenario {
  baseline: RunDefinition;
  current: RunDefinition;
  expected: Record<string, unknown>;
}

describe("six canonical canaries", () => {
  it("1: localizes a source omission to the BUILD boundary", async () => {
    const scenario = await readScenario<SingleScenario>("canaries/01-source-omission");
    const run = await materializeRun(scenario);
    try {
      const finding = run.report.findings.find((item) => item.rule_id === "DART-OPS-001");
      expect(finding).toMatchObject({
        status: "FAIL",
        responsible_boundary: "BUILD",
        identity_status: "IDENTITY_UNVERIFIED",
      });
      expect(finding?.evidence.map((item) => item.evidence_id)).toEqual(["source:page"]);
      expect(run.report.evidence_completeness.BUILD).toBe("UNAVAILABLE");
    } finally {
      await run.cleanup();
    }
  });

  it("2: detects captured build/live drift without network access", async () => {
    const scenario = await readScenario<SingleScenario>("canaries/02-build-live-drift");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access is forbidden");
    }) as typeof fetch;
    const run = await materializeRun(scenario);
    try {
      const finding = run.report.findings.find((item) => item.rule_id === "DART-OPS-002");
      expect(finding).toMatchObject({
        status: "FAIL",
        responsible_boundary: "LIVE",
        identity_status: "IDENTITY_UNVERIFIED",
      });
      expect(finding?.evidence).toHaveLength(2);
    } finally {
      globalThis.fetch = originalFetch;
      await run.cleanup();
    }
  });

  it("3: establishes an explicit mapping across different paths", async () => {
    const scenario = await readScenario<SingleScenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const finding = run.report.findings.find((item) => item.rule_id === "DART-OPS-001");
      expect(finding).toMatchObject({
        status: "PASS",
        identity_status: "IDENTITY_ASSERTED",
        responsible_boundary: null,
      });
      expect(finding?.observed_value).toMatchObject({
        source_present: true,
        build_present: true,
      });
    } finally {
      await run.cleanup();
    }
  });

  it("4: preserves asserted deployment provenance as unverified", async () => {
    const scenario = await readScenario<SingleScenario>("canaries/04-provenance-uncertainty");
    const run = await materializeRun(scenario);
    try {
      const finding = run.report.findings.find(
        (item) => item.rule_id === "DART-OPS-003" && item.sub_identity === "live:asserted",
      );
      expect(finding).toMatchObject({
        status: "PASS",
        identity_status: "IDENTITY_UNVERIFIED",
        observed_value: {
          acquisition: "ASSERTED",
          deployment_trust: "USER_ASSERTED",
          authenticity: "ASSERTED",
        },
      });
    } finally {
      await run.cleanup();
    }
  });

  it("5: classifies PASS to FAIL as CHANGED and blocks policy", async () => {
    const scenario = await readScenario<PairedScenario>("canaries/05-regression");
    const baseline = await materializeRun(scenario.baseline);
    const current = await materializeRun(scenario.current);
    try {
      const comparison = compareReports(baseline.report, current.report);
      const changed = comparison.regressions.find(
        (item) => item.state === "CHANGED" && item.current?.rule_id === "DART-OPS-001",
      );
      expect(changed).toMatchObject({
        state: "CHANGED",
        previous_status: "PASS",
        current_status: "FAIL",
      });
      const policy: Policy = {
        schema_version: "1.0",
        incompatible_baseline: "ERROR",
        external_afdocs_required: false,
        rules: [{ regression_state: "CHANGED", effect: "BLOCKING" }],
      };
      expect(evaluatePolicy(current.report, comparison, policy)).toMatchObject({
        effect: "BLOCKING",
        exit_code: 1,
      });
    } finally {
      await baseline.cleanup();
      await current.cleanup();
    }
  });

  it("6: classifies incompatible reports without inventing new or resolved state", async () => {
    const scenario = await readScenario<
      SingleScenario & { incompatibility: { baseline_value: string } }
    >("canaries/06-incompatible-baseline");
    const baseline = await materializeRun(scenario);
    const current = await materializeRun(scenario);
    try {
      const incompatibleBaseline: AnalysisReport = {
        ...baseline.report,
        compatibility: {
          ...baseline.report.compatibility,
          rule_set_digest: scenario.incompatibility.baseline_value,
        },
      };
      const comparison = compareReports(incompatibleBaseline, current.report);
      expect(comparison.compatible).toBe(false);
      expect(comparison.regressions).toEqual([
        {
          state: "INCOMPATIBLE",
          fingerprint: "*",
          reason: "RULE_VERSION_CHANGED",
        },
      ]);
      expect(comparison.regressions.map((item) => item.state)).not.toContain("NEW");
      expect(comparison.regressions.map((item) => item.state)).not.toContain("RESOLVED");
    } finally {
      await baseline.cleanup();
      await current.cleanup();
    }
  });
});
