import path from "node:path";
import type {
  AnalysisReport,
  ComparisonReport,
  Policy,
  PolicyEffect,
  PolicyResult,
  Regression,
} from "./contracts.js";
import { validateSchema } from "./schema.js";
import { normalizeRelativePath, readSafeFile, resolveSafeFile } from "./security/paths.js";

const EFFECT_RANK: Record<PolicyEffect, number> = {
  INFORMATIONAL: 0,
  ADVISORY: 1,
  BLOCKING: 2,
};

export class PolicyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyConfigurationError";
  }
}

function ruleId(regression: Regression): string | undefined {
  return (
    regression.current?.rule_id ??
    regression.baseline?.rule_id ??
    (regression.external_producer && regression.external_check_id
      ? `external.${regression.external_producer}::${regression.external_check_id}`
      : undefined)
  );
}

/** Writer-readable identity for a regression row. Fingerprints stay off the scan line. */
export function describeRegression(regression: Regression): string {
  if (regression.fingerprint === "*") {
    return "whole comparison";
  }
  const finding = regression.current ?? regression.baseline;
  if (!finding) {
    return regression.fingerprint;
  }
  return `${finding.rule_id} ${finding.sub_identity} on declared target ${finding.target.identity}`;
}

function strongest(effects: PolicyEffect[]): PolicyEffect {
  return effects.reduce(
    (current, effect) => (EFFECT_RANK[effect] > EFFECT_RANK[current] ? effect : current),
    "INFORMATIONAL",
  );
}

export function evaluatePolicy(
  report: AnalysisReport,
  comparison: ComparisonReport | undefined,
  policy: Policy,
): PolicyResult {
  const effects: PolicyEffect[] = [];
  const reasons: string[] = [];

  for (const finding of report.findings) {
    const matches = policy.rules.filter(
      (rule) =>
        rule.regression_state === undefined &&
        (rule.rule_id === undefined || rule.rule_id === finding.rule_id) &&
        (rule.finding_status === undefined || rule.finding_status === finding.status),
    );
    const effect = strongest(matches.map((rule) => rule.effect));
    effects.push(effect);
    if (effect !== "INFORMATIONAL") {
      reasons.push(`${effect}: ${finding.rule_id} ${finding.status} ${finding.target.identity}`);
    }
  }

  for (const regression of comparison?.regressions ?? []) {
    const matches = policy.rules.filter(
      (rule) =>
        rule.regression_state !== undefined &&
        rule.regression_state === regression.state &&
        (rule.rule_id === undefined || rule.rule_id === ruleId(regression)),
    );
    const effect = strongest(matches.map((rule) => rule.effect));
    effects.push(effect);
    if (effect !== "INFORMATIONAL") {
      const transition =
        regression.previous_status && regression.current_status
          ? ` ${regression.previous_status} -> ${regression.current_status}`
          : "";
      reasons.push(
        `${effect}: regression ${regression.state} ${describeRegression(regression)}${transition}`,
      );
    }
  }

  for (const [mode, required] of Object.entries(policy.required_completeness ?? {})) {
    const actual =
      report.evidence_completeness[mode as keyof AnalysisReport["evidence_completeness"]];
    if (actual !== required) {
      effects.push("BLOCKING");
      reasons.push(`BLOCKING: ${mode} evidence is ${actual}; policy requires ${required}`);
    }
  }

  const afdocsAvailable = report.external_evaluations.some(
    (evaluation) =>
      evaluation.producer === "afdocs" &&
      evaluation.status === "AVAILABLE" &&
      (policy.external_afdocs_authenticity !== "ATTESTED" ||
        evaluation.authenticity === "ATTESTED"),
  );
  const incompatible = comparison?.regressions.some(
    (regression) => regression.state === "INCOMPATIBLE",
  );
  const blocking = effects.filter((effect) => effect === "BLOCKING").length;
  const advisory = effects.filter((effect) => effect === "ADVISORY").length;
  const informational = effects.filter((effect) => effect === "INFORMATIONAL").length;
  const exitCode: PolicyResult["exit_code"] =
    policy.external_afdocs_required && !afdocsAvailable
      ? 4
      : incompatible && policy.incompatible_baseline === "ERROR"
        ? 5
        : blocking > 0
          ? 1
          : 0;
  // Exits 4 and 5 are configured outcomes rather than rule effects, so they carry no
  // blocking count. Record them explicitly or the result cannot explain its own exit.
  if (exitCode === 4) {
    reasons.push("EXIT 4: policy requires parseable AFDocs evidence and none is available");
  }
  if (exitCode === 5) {
    reasons.push(
      "EXIT 5: baseline comparison is incompatible and policy sets incompatible_baseline to ERROR",
    );
  }
  return {
    effect: blocking > 0 ? "BLOCKING" : advisory > 0 ? "ADVISORY" : "INFORMATIONAL",
    blocking,
    advisory,
    informational,
    reasons: reasons.sort(),
    exit_code: exitCode,
  };
}

export interface TrustedPolicy {
  policy: Policy;
  policyPath: string;
  baselinePath?: string;
  baselineRelativePath?: string;
}

export async function loadTrustedPolicy(trustedBaseRoot: string): Promise<TrustedPolicy> {
  const policyPath = await resolveSafeFile(trustedBaseRoot, ".docs-agent-readiness/policy.json");
  let value: unknown;
  try {
    value = JSON.parse(
      (await readSafeFile(trustedBaseRoot, ".docs-agent-readiness/policy.json")).toString("utf8"),
    ) as unknown;
    await validateSchema("policy", value);
  } catch (error) {
    throw new PolicyConfigurationError(
      error instanceof Error ? error.message : "Trusted policy is invalid",
    );
  }
  const policy = value as Policy;
  if (!policy.baseline_path) {
    return { policy, policyPath };
  }
  let baselineRelative: string;
  try {
    baselineRelative = normalizeRelativePath(policy.baseline_path);
  } catch (error) {
    throw new PolicyConfigurationError(
      error instanceof Error ? error.message : "Baseline path is invalid",
    );
  }
  const baselinePath = await resolveSafeFile(path.resolve(trustedBaseRoot), baselineRelative);
  return { policy, policyPath, baselinePath, baselineRelativePath: baselineRelative };
}
