import { canonicalJson, compareCodePoint, digestCanonical } from "./canonical.js";
import type {
  AnalysisReport,
  ComparisonReport,
  Finding,
  Regression,
  RegressionState,
} from "./contracts.js";

function incompatibilityReason(
  baseline: AnalysisReport,
  current: AnalysisReport,
): Regression["reason"] | undefined {
  if (
    baseline.compatibility.report_schema_version !== current.compatibility.report_schema_version
  ) {
    return "SCHEMA_INCOMPATIBLE";
  }
  if (baseline.compatibility.parser_version !== current.compatibility.parser_version) {
    return "PARSER_VERSION_CHANGED";
  }
  if (
    baseline.compatibility.canonicalizer_version !== current.compatibility.canonicalizer_version
  ) {
    return "CANONICALIZER_VERSION_CHANGED";
  }
  if (
    baseline.compatibility.identity_algorithm_version !==
    current.compatibility.identity_algorithm_version
  ) {
    return "IDENTITY_ALGORITHM_CHANGED";
  }
  if (baseline.compatibility.rule_set_digest !== current.compatibility.rule_set_digest) {
    return "RULE_VERSION_CHANGED";
  }
  if (baseline.compatibility.configuration_digest !== current.compatibility.configuration_digest) {
    return "CONFIGURATION_CHANGED";
  }
  if (
    baseline.compatibility.target_inventory_digest !== current.compatibility.target_inventory_digest
  ) {
    return "TARGET_IDENTITY_CHANGED";
  }
  if (
    canonicalJson(baseline.compatibility.external_adapter_versions) !==
      canonicalJson(current.compatibility.external_adapter_versions) ||
    canonicalJson(baseline.compatibility.external_evaluator_versions) !==
      canonicalJson(current.compatibility.external_evaluator_versions)
  ) {
    return "EVALUATOR_VERSION_CHANGED";
  }
  return undefined;
}

interface ExternalCheck {
  producer: string;
  checkId: string;
  status: Finding["status"];
  fingerprint: string;
}

function externalChecks(report: AnalysisReport): Map<string, ExternalCheck> {
  const checks = new Map<string, ExternalCheck>();
  for (const evaluation of report.external_evaluations) {
    if (evaluation.status !== "AVAILABLE") {
      continue;
    }
    for (const check of evaluation.checks ?? []) {
      const fingerprint = `sha256:${digestCanonical({
        namespace: "external",
        producer: evaluation.producer,
        evaluator_version: evaluation.evaluator_version,
        target: evaluation.target ?? "",
        check_id: check.id,
      })}`;
      checks.set(fingerprint, {
        producer: evaluation.producer,
        checkId: check.id,
        status: check.normalized_status,
        fingerprint,
      });
    }
  }
  return checks;
}

function issueStatus(status: Finding["status"]): boolean {
  return status === "FAIL" || status === "WARN" || status === "UNAVAILABLE";
}

function sameFindingResult(left: Finding, right: Finding): boolean {
  return (
    left.status === right.status &&
    canonicalJson(left.observed_value) === canonicalJson(right.observed_value) &&
    left.identity_status === right.identity_status
  );
}

function regressionForPair(baseline: Finding, current: Finding): Regression {
  let state: RegressionState;
  if (issueStatus(baseline.status) && current.status === "PASS") {
    state = "RESOLVED";
  } else if (sameFindingResult(baseline, current)) {
    state = "UNCHANGED";
  } else {
    state = "CHANGED";
  }
  return {
    state,
    fingerprint: current.fingerprint,
    previous_status: baseline.status,
    current_status: current.status,
    baseline,
    current,
  };
}

export function compareReports(
  baseline: AnalysisReport,
  current: AnalysisReport,
): ComparisonReport {
  const reason = incompatibilityReason(baseline, current);
  if (reason) {
    return {
      schema_version: "1.0",
      baseline_report_id: baseline.report_id,
      current_report_id: current.report_id,
      compatible: false,
      regressions: [{ state: "INCOMPATIBLE", fingerprint: "*", reason }],
    };
  }

  const baselineByFingerprint = new Map(
    baseline.findings.map((finding) => [finding.fingerprint, finding]),
  );
  const currentByFingerprint = new Map(
    current.findings.map((finding) => [finding.fingerprint, finding]),
  );
  const fingerprints = [
    ...new Set([...baselineByFingerprint.keys(), ...currentByFingerprint.keys()]),
  ].sort(compareCodePoint);
  const regressions: Regression[] = [];
  for (const fingerprint of fingerprints) {
    const previous = baselineByFingerprint.get(fingerprint);
    const next = currentByFingerprint.get(fingerprint);
    if (previous && next) {
      regressions.push(regressionForPair(previous, next));
    } else if (next) {
      regressions.push({
        state: "NEW",
        fingerprint,
        current_status: next.status,
        current: next,
      });
    } else {
      if (!previous) {
        throw new Error(`Comparison invariant failed for ${fingerprint}`);
      }
      regressions.push({
        state: "INCOMPATIBLE",
        fingerprint,
        previous_status: previous.status,
        reason: "TARGET_IDENTITY_CHANGED",
        baseline: previous,
      });
    }
  }

  const baselineExternal = externalChecks(baseline);
  const currentExternal = externalChecks(current);
  const externalFingerprints = [
    ...new Set([...baselineExternal.keys(), ...currentExternal.keys()]),
  ].sort(compareCodePoint);
  for (const fingerprint of externalFingerprints) {
    const previous = baselineExternal.get(fingerprint);
    const next = currentExternal.get(fingerprint);
    if (previous && next) {
      regressions.push({
        state:
          issueStatus(previous.status) && next.status === "PASS"
            ? "RESOLVED"
            : previous.status === next.status
              ? "UNCHANGED"
              : "CHANGED",
        fingerprint,
        previous_status: previous.status,
        current_status: next.status,
        external_producer: next.producer,
        external_check_id: next.checkId,
      });
    } else if (next) {
      regressions.push({
        state: "NEW",
        fingerprint,
        current_status: next.status,
        external_producer: next.producer,
        external_check_id: next.checkId,
      });
    } else {
      if (!previous) {
        throw new Error(`External comparison invariant failed for ${fingerprint}`);
      }
      regressions.push({
        state: "INCOMPATIBLE",
        fingerprint,
        previous_status: previous.status,
        reason: "EXTERNAL_CHECK_UNAVAILABLE",
        external_producer: previous.producer,
        external_check_id: previous.checkId,
      });
    }
  }

  return {
    schema_version: "1.0",
    baseline_report_id: baseline.report_id,
    current_report_id: current.report_id,
    compatible: true,
    regressions,
  };
}
