import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeBundle } from "../src/analyze.js";
import type { AnalysisReport, CollectorConfiguration } from "../src/contracts.js";
import { collectEvidenceBundle, loadEvidenceBundle } from "../src/evidence.js";

export interface RunDefinition {
  files: Record<string, string>;
  configuration: CollectorConfiguration;
}

export interface MaterializedRun {
  root: string;
  bundlePath: string;
  report: AnalysisReport;
  cleanup: () => Promise<void>;
}

export async function readScenario<T>(relativePath: string): Promise<T> {
  const file = path.join(process.cwd(), "fixtures", relativePath, "scenario.json");
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function materializeRun(definition: RunDefinition): Promise<MaterializedRun> {
  const root = await mkdtemp(path.join(os.tmpdir(), "dart-prototype-"));
  try {
    for (const configuredRoot of Object.values(definition.configuration.roots)) {
      await mkdir(path.join(root, configuredRoot), { recursive: true });
    }
    for (const [relativePath, content] of Object.entries(definition.files)) {
      const target = path.join(root, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
    }
    const configPath = path.join(root, "config.json");
    await writeFile(configPath, JSON.stringify(definition.configuration), "utf8");
    const bundlePath = path.join(root, "bundle");
    await collectEvidenceBundle(configPath, bundlePath);
    const bundle = await loadEvidenceBundle(bundlePath);
    return {
      root,
      bundlePath,
      report: analyzeBundle(bundle),
      cleanup: () => rm(root, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}
