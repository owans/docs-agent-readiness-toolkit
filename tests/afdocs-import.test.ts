import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importRecordedAfdocs } from "../src/afdocs.js";
import { analyzeBundle } from "../src/analyze.js";
import { compareReports } from "../src/compare.js";
import { loadEvidenceBundle } from "../src/evidence.js";
import { evaluatePolicy } from "../src/policy.js";
import { validateSchema } from "../src/schema.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface Scenario extends RunDefinition {
  expected: Record<string, unknown>;
}

describe("recorded AFDocs 0.18.7 import", () => {
  it("preserves the external score and maps skip without making it pass", async () => {
    const source = await readFile(
      path.join(process.cwd(), "fixtures/external/afdocs-0.18.7-skip.json"),
      "utf8",
    );
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const run = await materializeRun({
      ...scenario,
      files: { "import/afdocs.json": source },
    });
    try {
      const imported = await importRecordedAfdocs(await loadEvidenceBundle(run.bundlePath));
      expect(imported[0]).toMatchObject({
        producer: "afdocs",
        evaluator_version: "0.18.7",
        acquisition: "IMPORTED",
        status: "AVAILABLE",
        raw_score: 100,
        raw_grade: "A+",
      });
      const skipped = imported[0]?.checks?.find((check) => check.id === "auth-alternative-access");
      expect(skipped).toMatchObject({ raw_status: "skip", normalized_status: "SKIP" });
    } finally {
      await run.cleanup();
    }
  });

  it("retains an unsupported 0.x version as unavailable", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const original = scenario.files["import/afdocs.json"];
    expect(original).toBeDefined();
    const run = await materializeRun({
      ...scenario,
      files: {
        "import/afdocs.json": (original as string).replace('"0.18.7"', '"0.19.0"'),
      },
    });
    try {
      const imported = await importRecordedAfdocs(await loadEvidenceBundle(run.bundlePath));
      expect(imported[0]).toMatchObject({
        evaluator_version: "0.19.0",
        status: "UNAVAILABLE",
        reason: "Unsupported AFDocs 0.x version: 0.19.0",
      });
    } finally {
      await run.cleanup();
    }
  });

  it("does not satisfy an attested-evaluator policy with unauthenticated import", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const run = await materializeRun(scenario);
    try {
      const bundle = await loadEvidenceBundle(run.bundlePath);
      const report = analyzeBundle(bundle, await importRecordedAfdocs(bundle));
      expect(
        evaluatePolicy(report, undefined, {
          schema_version: "1.0",
          incompatible_baseline: "ADVISORY",
          external_afdocs_required: true,
          external_afdocs_authenticity: "ATTESTED",
          rules: [],
        }).exit_code,
      ).toBe(4);
    } finally {
      await run.cleanup();
    }
  });

  it("fails malformed recorded output safely", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const run = await materializeRun({
      ...scenario,
      files: { "import/afdocs.json": "{not-json" },
    });
    try {
      const imported = await importRecordedAfdocs(await loadEvidenceBundle(run.bundlePath));
      expect(imported[0]).toMatchObject({
        status: "UNAVAILABLE",
        reason: "Recorded AFDocs JSON is malformed",
      });
    } finally {
      await run.cleanup();
    }
  });

  it("compares external checks without turning them into toolkit findings", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const failed = scenario.files["import/afdocs.json"];
    expect(failed).toBeDefined();
    const passed = (failed as string)
      .replace('"status":"fail"', '"status":"pass"')
      .replace('"checksPassed":0', '"checksPassed":1')
      .replace('"checksFailed":1', '"checksFailed":0');
    const baseline = await materializeRun({
      ...scenario,
      files: { "import/afdocs.json": passed },
    });
    const current = await materializeRun(scenario);
    try {
      const baselineBundle = await loadEvidenceBundle(baseline.bundlePath);
      const currentBundle = await loadEvidenceBundle(current.bundlePath);
      const baselineReport = analyzeBundle(
        baselineBundle,
        await importRecordedAfdocs(baselineBundle),
      );
      const currentReport = analyzeBundle(currentBundle, await importRecordedAfdocs(currentBundle));
      const comparison = compareReports(baselineReport, currentReport);
      expect(comparison.regressions).toContainEqual(
        expect.objectContaining({
          state: "CHANGED",
          previous_status: "PASS",
          current_status: "FAIL",
          external_producer: "afdocs",
          external_check_id: "llms-txt-exists",
        }),
      );
    } finally {
      await baseline.cleanup();
      await current.cleanup();
    }
  });

  it("treats a missing current external check as unavailable comparison evidence", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const run = await materializeRun(scenario);
    try {
      const bundle = await loadEvidenceBundle(run.bundlePath);
      const baselineReport = analyzeBundle(bundle, await importRecordedAfdocs(bundle));
      const currentReport = {
        ...baselineReport,
        external_evaluations: baselineReport.external_evaluations.map((evaluation) => ({
          ...evaluation,
          checks: (evaluation.checks ?? []).filter((check) => check.id !== "llms-txt-exists"),
        })),
      };
      const comparison = compareReports(baselineReport, currentReport);
      await validateSchema("comparison-report", comparison);
      expect(comparison.compatible).toBe(true);
      expect(comparison.regressions).toContainEqual(
        expect.objectContaining({
          state: "INCOMPATIBLE",
          previous_status: "FAIL",
          reason: "EXTERNAL_CHECK_UNAVAILABLE",
          external_producer: "afdocs",
          external_check_id: "llms-txt-exists",
        }),
      );
      expect(
        comparison.regressions.find(
          (item) =>
            item.external_producer === "afdocs" && item.external_check_id === "llms-txt-exists",
        )?.state,
      ).not.toBe("RESOLVED");
    } finally {
      await run.cleanup();
    }
  });

  it("marks different AFDocs 0.x versions incompatible", async () => {
    const scenario = await readScenario<Scenario>("localization/external-defect");
    const original = scenario.files["import/afdocs.json"];
    expect(original).toBeDefined();
    const unsupported = await materializeRun({
      ...scenario,
      files: {
        "import/afdocs.json": (original as string).replace('"0.18.7"', '"0.19.0"'),
      },
    });
    const supported = await materializeRun(scenario);
    try {
      const unsupportedBundle = await loadEvidenceBundle(unsupported.bundlePath);
      const supportedBundle = await loadEvidenceBundle(supported.bundlePath);
      const comparison = compareReports(
        analyzeBundle(unsupportedBundle, await importRecordedAfdocs(unsupportedBundle)),
        analyzeBundle(supportedBundle, await importRecordedAfdocs(supportedBundle)),
      );
      expect(comparison).toMatchObject({
        compatible: false,
        regressions: [{ state: "INCOMPATIBLE", reason: "EVALUATOR_VERSION_CHANGED" }],
      });
    } finally {
      await unsupported.cleanup();
      await supported.cleanup();
    }
  });
});
