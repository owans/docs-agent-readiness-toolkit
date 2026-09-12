import { appendFile, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeBundle } from "../src/analyze.js";
import { canonicalJson } from "../src/canonical.js";
import { runCli } from "../src/cli.js";
import type { CollectorConfiguration } from "../src/contracts.js";
import { collectEvidenceBundle, loadEvidenceBundle } from "../src/evidence.js";
import { markdownText, sanitizeText } from "../src/security/sanitize.js";
import {
  assertSafeOutputRoot,
  MAX_FILE_BYTES,
  normalizeRelativePath,
  resolveSafeFile,
} from "../src/security/paths.js";
import { materializeRun, readScenario, type RunDefinition } from "./helpers.js";

interface Scenario extends RunDefinition {
  expected: Record<string, unknown>;
}

describe("offline filesystem boundary", () => {
  it.each(["../secret", "/etc/passwd", "nested\\..\\secret", "\0bad"])(
    "rejects unsafe path %j",
    (value) => {
      expect(() => normalizeRelativePath(value)).toThrow();
    },
  );

  it("rejects symlinks in evidence paths", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-security-"));
    try {
      const outside = path.join(root, "outside.txt");
      const evidenceRoot = path.join(root, "evidence");
      await mkdir(evidenceRoot);
      await writeFile(outside, "secret", "utf8");
      await symlink(outside, path.join(evidenceRoot, "link.txt"));
      await expect(resolveSafeFile(evidenceRoot, "link.txt")).rejects.toThrow(
        "Symlinks are not allowed",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects output inside an evidence root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-security-"));
    try {
      await expect(assertSafeOutputRoot(path.join(root, "output"), [root])).rejects.toThrow(
        "Output root",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects oversized evidence before writing a bundle", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-security-"));
    try {
      const source = path.join(root, "source");
      const build = path.join(root, "build");
      await mkdir(source);
      await mkdir(build);
      const large = path.join(source, "large.md");
      await writeFile(large, Buffer.alloc(MAX_FILE_BYTES + 1));
      const config: CollectorConfiguration = {
        schema_version: "1.0",
        roots: { SOURCE: "./source", BUILD: "./build" },
        requested_modes: ["SOURCE", "BUILD"],
        inputs: [
          {
            id: "source:large",
            mode: "SOURCE",
            root: "SOURCE",
            path: "large.md",
            media_type: "text/markdown",
            acquisition: { kind: "COLLECTED", collector: "test" },
            target: { kind: "DOCUMENT", identity: "large" },
          },
        ],
        mappings: [],
      };
      const configPath = path.join(root, "config.json");
      await writeFile(configPath, JSON.stringify(config), "utf8");
      await expect(collectEvidenceBundle(configPath, path.join(root, "bundle"))).rejects.toThrow(
        "exceeds",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects digest tampering", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const manifest = JSON.parse(
        await readFile(path.join(run.bundlePath, "bundle.json"), "utf8"),
      ) as { evidence: Array<{ content: { blob: string } }> };
      const blob = manifest.evidence[0]?.content.blob;
      expect(blob).toBeDefined();
      await appendFile(path.join(run.bundlePath, blob as string), "tampered");
      await expect(loadEvidenceBundle(run.bundlePath)).rejects.toThrow("Integrity mismatch");
    } finally {
      await run.cleanup();
    }
  });

  it("rejects undeclared blobs", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      await writeFile(path.join(run.bundlePath, "blobs", "extra"), "unexpected", "utf8");
      await expect(loadEvidenceBundle(run.bundlePath)).rejects.toThrow("Undeclared or unsafe blob");
    } finally {
      await run.cleanup();
    }
  });

  it("rejects duplicate evidence identities and inconsistent integrity metadata", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const duplicateRun = await materializeRun(scenario);
    try {
      const manifestPath = path.join(duplicateRun.bundlePath, "bundle.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        evidence: unknown[];
      };
      manifest.evidence.push(manifest.evidence[0]);
      await writeFile(manifestPath, canonicalJson(manifest), "utf8");
      await expect(loadEvidenceBundle(duplicateRun.bundlePath)).rejects.toThrow(
        "Duplicate evidence id",
      );
    } finally {
      await duplicateRun.cleanup();
    }

    const integrityRun = await materializeRun(scenario);
    try {
      const manifestPath = path.join(integrityRun.bundlePath, "bundle.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        evidence: Array<{ properties: { integrity: { digest: string } } }>;
      };
      const first = manifest.evidence[0];
      expect(first).toBeDefined();
      (first as { properties: { integrity: { digest: string } } }).properties.integrity.digest =
        "0".repeat(64);
      await writeFile(manifestPath, canonicalJson(manifest), "utf8");
      await expect(loadEvidenceBundle(integrityRun.bundlePath)).rejects.toThrow(
        "Inconsistent integrity metadata",
      );
    } finally {
      await integrityRun.cleanup();
    }
  });

  it("rejects malformed configuration without partial output", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "dart-security-"));
    try {
      const configPath = path.join(root, "config.json");
      await writeFile(configPath, '{"schema_version":"1.0","__proto__":{}}', "utf8");
      await expect(collectEvidenceBundle(configPath, path.join(root, "bundle"))).rejects.toThrow(
        "validation failed",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects incompatible root/mode combinations and stronger mapping trust claims", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const wrongMode = structuredClone(scenario);
    const firstInput = wrongMode.configuration.inputs[0];
    if (!firstInput) {
      throw new Error("Fixture must include one input");
    }
    firstInput.mode = "LIVE";
    await expect(materializeRun(wrongMode)).rejects.toThrow(
      "Evidence root and mode are incompatible",
    );

    const strongerMapping = structuredClone(scenario);
    const firstMapping = strongerMapping.configuration.mappings[0];
    if (!firstMapping) {
      throw new Error("Fixture must include one mapping");
    }
    firstMapping.declared_trust = "EXTERNALLY_ATTESTED";
    await expect(materializeRun(strongerMapping)).rejects.toThrow("stronger trust is unsupported");
  });

  it("rejects hand-authored bundles that self-assert attestation", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    try {
      const manifestPath = path.join(run.bundlePath, "bundle.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        evidence: Array<{
          acquisition: { kind: string };
          properties: { authenticity: string };
        }>;
      };
      const first = manifest.evidence[0];
      if (!first) {
        throw new Error("Fixture must include one evidence record");
      }
      first.acquisition.kind = "ATTESTED";
      first.properties.authenticity = "ATTESTED";
      await writeFile(manifestPath, canonicalJson(manifest), "utf8");
      await expect(loadEvidenceBundle(run.bundlePath)).rejects.toThrow("unsupported verifier");
    } finally {
      await run.cleanup();
    }
  });

  it("normalizes Unicode identities consistently", () => {
    expect(normalizeRelativePath("café/page.md")).toBe(normalizeRelativePath("cafe\u0301/page.md"));
  });
});

describe("offline analyzer and output boundary", () => {
  it("analyzes successfully when fetch is disabled", async () => {
    const scenario = await readScenario<Scenario>("canaries/03-representation-mapping");
    const run = await materializeRun(scenario);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network forbidden");
    }) as typeof fetch;
    try {
      const bundle = await loadEvidenceBundle(run.bundlePath);
      expect(analyzeBundle(bundle).findings).not.toHaveLength(0);
    } finally {
      globalThis.fetch = originalFetch;
      await run.cleanup();
    }
  });

  it("contains no analyzer imports for network or arbitrary execution modules", async () => {
    const files = [
      "afdocs.ts",
      "analyze.ts",
      "canonical.ts",
      "cli.ts",
      "compare.ts",
      "contracts.ts",
      "evidence.ts",
      "policy.ts",
      "report.ts",
      "schema.ts",
      "security/paths.ts",
      "security/sanitize.ts",
    ];
    const forbidden =
      /["'](?:node:)?(?:http|https|net|tls|dns|child_process|worker_threads)(?:\/[^"']*)?["']|\bfetch\s*\(/u;
    for (const file of files) {
      expect(await readFile(path.join(process.cwd(), "src", file), "utf8")).not.toMatch(forbidden);
    }
  });

  it("removes terminal escapes and bidirectional controls", () => {
    const hostile = "\u001b[31mFAIL\u001b[0m\u202eevil";
    const sanitized = sanitizeText(hostile);
    expect(sanitized).not.toContain("\u001b");
    expect(sanitized).not.toContain("\u202e");
    expect(sanitized).toContain("FAIL");
  });

  it("keeps hostile content inside one escaped Markdown field", () => {
    const sanitized = markdownText("name\n## injected | [link](x)");
    expect(sanitized).not.toContain("\n");
    expect(sanitized).toContain("\\|");
    expect(sanitized).toContain("\\[link\\]");
  });

  it("sanitizes hostile command errors before writing stderr", async () => {
    let stderr = "";
    const code = await runCli(["bad\u001b[31m\u202e"], {
      stdout: () => undefined,
      stderr: (value) => {
        stderr += value;
      },
    });
    expect(code).toBe(2);
    expect(stderr).not.toContain("\u001b");
    expect(stderr).not.toContain("\u202e");
  });
});
