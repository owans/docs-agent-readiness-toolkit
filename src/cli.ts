#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { importRecordedAfdocs } from "./afdocs.js";
import { analyzeBundle } from "./analyze.js";
import { canonicalJson } from "./canonical.js";
import { compareReports } from "./compare.js";
import {
  collectEvidenceBundle,
  CollectorConfigurationError,
  loadEvidenceBundle,
} from "./evidence.js";
import { evaluatePolicy, loadTrustedPolicy, PolicyConfigurationError } from "./policy.js";
import {
  loadAnalysisReport,
  loadAnalysisReportFromRoot,
  renderMarkdownReport,
  writeCanonicalJson,
} from "./report.js";
import { SchemaValidationError, validateSchema } from "./schema.js";
import { sanitizeText } from "./security/sanitize.js";

class UsageError extends Error {}

interface Output {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const processOutput: Output = {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
};

function parseOptions(args: string[]): Map<string, string> {
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new UsageError(`Expected --option value, received: ${args.slice(index).join(" ")}`);
    }
    if (options.has(key)) {
      throw new UsageError(`Duplicate option: ${key}`);
    }
    options.set(key, value);
  }
  return options;
}

function required(options: Map<string, string>, name: string): string {
  const value = options.get(name);
  if (!value) {
    throw new UsageError(`Missing required option: ${name}`);
  }
  return value;
}

function rejectUnknown(options: Map<string, string>, allowed: string[]): void {
  for (const key of options.keys()) {
    if (!allowed.includes(key)) {
      throw new UsageError(`Unknown option: ${key}`);
    }
  }
}

async function emit(
  value: unknown,
  jsonPath: string | undefined,
  markdown: string | undefined,
  markdownPath: string | undefined,
  output: Output,
): Promise<void> {
  if (jsonPath) {
    await writeCanonicalJson(jsonPath, value);
  } else {
    output.stdout(canonicalJson(value));
  }
  if (markdown && markdownPath) {
    await writeFile(markdownPath, markdown, { encoding: "utf8", flag: "wx" });
  }
}

async function runBundle(args: string[], output: Output): Promise<number> {
  const action = args[0];
  const options = parseOptions(args.slice(1));
  if (action === "create") {
    rejectUnknown(options, ["--config", "--output"]);
    const result = await collectEvidenceBundle(
      required(options, "--config"),
      required(options, "--output"),
    );
    output.stdout(`${result.bundleId}\n`);
    return 0;
  }
  if (action === "verify") {
    rejectUnknown(options, ["--bundle"]);
    const bundle = await loadEvidenceBundle(required(options, "--bundle"));
    output.stdout(`${bundle.bundleId}\n`);
    return 0;
  }
  throw new UsageError("Usage: bundle create|verify");
}

async function analyzeFromPath(bundlePath: string) {
  const bundle = await loadEvidenceBundle(bundlePath);
  const external = await importRecordedAfdocs(bundle);
  const report = analyzeBundle(bundle, external);
  await validateSchema("analysis-report", report);
  return report;
}

async function runAnalyze(args: string[], output: Output): Promise<number> {
  const options = parseOptions(args);
  rejectUnknown(options, ["--bundle", "--json", "--markdown"]);
  const report = await analyzeFromPath(required(options, "--bundle"));
  await emit(
    report,
    options.get("--json"),
    renderMarkdownReport(report),
    options.get("--markdown"),
    output,
  );
  return 0;
}

async function runCompare(args: string[], output: Output): Promise<number> {
  const options = parseOptions(args);
  rejectUnknown(options, ["--baseline", "--current", "--json"]);
  const baseline = await loadAnalysisReport(required(options, "--baseline"));
  const current = await loadAnalysisReport(required(options, "--current"));
  const comparison = compareReports(baseline, current);
  await validateSchema("comparison-report", comparison);
  await emit(comparison, options.get("--json"), undefined, undefined, output);
  return comparison.compatible ? 0 : 5;
}

async function runBaseline(args: string[], output: Output): Promise<number> {
  if (args[0] !== "create") {
    throw new UsageError("Usage: baseline create --report report.json --output baseline.json");
  }
  const options = parseOptions(args.slice(1));
  rejectUnknown(options, ["--report", "--output"]);
  const report = await loadAnalysisReport(required(options, "--report"));
  await writeCanonicalJson(required(options, "--output"), report);
  output.stdout(`${report.report_id}\n`);
  return 0;
}

async function runCi(args: string[], output: Output): Promise<number> {
  const options = parseOptions(args);
  rejectUnknown(options, ["--bundle", "--trusted-base-root", "--json", "--markdown"]);
  const report = await analyzeFromPath(required(options, "--bundle"));
  const trusted = await loadTrustedPolicy(required(options, "--trusted-base-root"));
  const comparison = trusted.baselineRelativePath
    ? compareReports(
        await loadAnalysisReportFromRoot(
          required(options, "--trusted-base-root"),
          trusted.baselineRelativePath,
        ),
        report,
      )
    : undefined;
  const result = evaluatePolicy(report, comparison, trusted.policy);
  await emit(
    { report, ...(comparison ? { comparison } : {}), policy: result },
    options.get("--json"),
    renderMarkdownReport(report, comparison, result),
    options.get("--markdown"),
    output,
  );
  return result.exit_code;
}

async function dispatch(args: string[], output: Output): Promise<number> {
  const command = args[0];
  if (!command) {
    throw new UsageError("A command is required");
  }
  switch (command) {
    case "bundle":
      return runBundle(args.slice(1), output);
    case "analyze":
      return runAnalyze(args.slice(1), output);
    case "compare":
      return runCompare(args.slice(1), output);
    case "baseline":
      return runBaseline(args.slice(1), output);
    case "ci":
      return runCi(args.slice(1), output);
    default:
      throw new UsageError(`Unknown command: ${command}`);
  }
}

export async function runCli(args: string[], output: Output = processOutput): Promise<number> {
  try {
    return await dispatch(args, output);
  } catch (error) {
    output.stderr(`${sanitizeText(error instanceof Error ? error.message : "Unknown error")}\n`);
    if (error instanceof UsageError) {
      return 2;
    }
    if (
      error instanceof CollectorConfigurationError ||
      (error instanceof SchemaValidationError && args[0] === "bundle" && args[1] === "create")
    ) {
      return 2;
    }
    if (error instanceof PolicyConfigurationError) {
      return 2;
    }
    return 3;
  }
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
