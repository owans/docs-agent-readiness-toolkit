import { describe, expect, it } from "vitest";
import { importRecordedAfdocs } from "../src/afdocs.js";
import { analyzeBundle } from "../src/analyze.js";
import { canonicalJson } from "../src/canonical.js";
import { loadEvidenceBundle } from "../src/evidence.js";
import { renderMarkdownReport } from "../src/report.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface Scenario extends RunDefinition {
  expected: Record<string, unknown>;
}

describe("diagnostic localization", () => {
  it.each([
    ["localization/source-defect", "SOURCE"],
    ["canaries/01-source-omission", "BUILD"],
    ["canaries/02-build-live-drift", "LIVE"],
  ] as const)("localizes %s to %s", async (fixture, boundary) => {
    const scenario = await readScenario<Scenario>(fixture);
    const run = await materializeRun(scenario);
    try {
      expect(
        run.report.findings.some(
          (finding) => finding.status === "FAIL" && finding.responsible_boundary === boundary,
        ),
      ).toBe(true);
      const loaded = await loadEvidenceBundle(run.bundlePath);
      expect(canonicalJson(analyzeBundle(loaded))).toBe(canonicalJson(analyzeBundle(loaded)));
    } finally {
      await run.cleanup();
    }
  });

  it("keeps an imported AFDocs failure at the EXTERNAL boundary", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const run = await materializeRun(scenario);
    try {
      const bundle = await loadEvidenceBundle(run.bundlePath);
      const external = await importRecordedAfdocs(bundle);
      const report = analyzeBundle(bundle, external);
      expect(report.external_evaluations[0]).toMatchObject({
        producer: "afdocs",
        acquisition: "IMPORTED",
        status: "AVAILABLE",
        checks: [{ raw_status: "fail", normalized_status: "FAIL" }],
      });
      expect(report.findings.some((finding) => String(finding.rule_id) === "llms-txt-exists")).toBe(
        false,
      );
      expect(report.evidence_completeness.EXTERNAL).toBe("COMPLETE");
      expect(renderMarkdownReport(report)).toContain("Evidence boundary: EXTERNAL");
    } finally {
      await run.cleanup();
    }
  });
});
