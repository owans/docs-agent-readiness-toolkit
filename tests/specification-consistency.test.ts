import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const normativeDocuments = [
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "ROADMAP.md",
  "SECURITY.md",
  "SUPPORT.md",
  "docs/README.md",
  "docs/agent-readiness/agent-readiness-methodology.md",
  "docs/agent-readiness/agent-readiness-phase2-decision-log.md",
  "docs/agent-readiness/agent-readiness-rule-catalog.md",
  "docs/agent-readiness/agent-readiness-tool-prd.md",
  "docs/phase3/README.md",
  "docs/phase3/live-acquisition-security-gate.md",
  "docs/phase3/practitioner-validation-protocol.md",
  "docs/phase3/practitioner-validation-results.md",
  "docs/releasing.md",
];

describe("specification consistency", () => {
  it("contains no obsolete canonical regression states in normative documents", async () => {
    const obsoleteStates = [["PASS", "TO", "FAIL"].join("_"), ["FAIL", "TO", "PASS"].join("_")];
    for (const relativePath of normativeDocuments) {
      const content = await readFile(path.join(process.cwd(), relativePath), "utf8");
      for (const obsoleteState of obsoleteStates) {
        expect(content, `${relativePath} contains ${obsoleteState}`).not.toContain(obsoleteState);
      }
    }
  });
});
