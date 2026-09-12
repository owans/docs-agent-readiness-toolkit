import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/canonical.js";
import { renderMarkdownReport } from "../src/report.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface Scenario extends RunDefinition {
  expected: Record<string, unknown>;
}

describe("evidence and deterministic replay", () => {
  it("creates content-addressed SOURCE and BUILD evidence", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const source = run.report.findings.find(
        (finding) => finding.rule_id === "DART-OPS-003" && finding.evidence_mode === "SOURCE",
      );
      const build = run.report.findings.find(
        (finding) => finding.rule_id === "DART-OPS-003" && finding.evidence_mode === "BUILD",
      );
      expect(source?.evidence[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(build?.evidence[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(source?.identity_status).toBe("IDENTITY_UNVERIFIED");
      expect(build?.identity_status).toBe("IDENTITY_UNVERIFIED");
      expect(source?.observed_value).toMatchObject({ authenticity: "UNVERIFIED" });
      expect(build?.observed_value).toMatchObject({ authenticity: "UNVERIFIED" });
      const mapping = run.report.findings.find((finding) => finding.rule_id === "DART-OPS-001");
      expect(mapping).toMatchObject({
        identity_status: "IDENTITY_ASSERTED",
        evidence: [
          { evidence_id: "source:getting-started" },
          { evidence_id: "build:getting-started" },
        ],
      });
      expect(run.report.bundle_id).toMatch(/^sha256:[a-f0-9]{64}$/);
    } finally {
      await run.cleanup();
    }
  });

  it("changes content and bundle hashes when captured content changes", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const changed: Scenario = {
      ...scenario,
      files: {
        ...scenario.files,
        "source/docs/getting-started.md": "# Changed\n",
      },
    };
    const first = await materializeRun(scenario);
    const second = await materializeRun(changed);
    try {
      expect(first.report.bundle_id).not.toBe(second.report.bundle_id);
      const firstSource = first.report.findings.find(
        (finding) => finding.sub_identity === "source:getting-started",
      );
      const secondSource = second.report.findings.find(
        (finding) => finding.sub_identity === "source:getting-started",
      );
      expect(firstSource?.evidence[0]?.sha256).not.toBe(secondSource?.evidence[0]?.sha256);
    } finally {
      await first.cleanup();
      await second.cleanup();
    }
  });

  it("produces byte-equivalent reports from identical evidence and config", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const first = await materializeRun(scenario);
    const second = await materializeRun(scenario);
    try {
      expect(canonicalJson(first.report)).toBe(canonicalJson(second.report));
      expect(renderMarkdownReport(first.report)).toBe(renderMarkdownReport(second.report));
    } finally {
      await first.cleanup();
      await second.cleanup();
    }
  });

  it("matches canonical JSON and Markdown golden outputs", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      await expect(canonicalJson(run.report)).toMatchFileSnapshot("./golden/canary-03-report.json");
      await expect(renderMarkdownReport(run.report)).toMatchFileSnapshot(
        "./golden/canary-03-report.md",
      );
    } finally {
      await run.cleanup();
    }
  });
});
