import { compareCodePoint, digestCanonical, withDerivedId } from "./canonical.js";
import type {
  AnalysisReport,
  Evidence,
  EvidenceCompleteness,
  EvidenceMode,
  EvidenceReference,
  Finding,
  FindingStatus,
  IdentityMapping,
  IdentityStatus,
} from "./contracts.js";
import type { ExternalEvaluation } from "./contracts.js";
import type { LoadedBundle } from "./evidence.js";
import { sanitizeText } from "./security/sanitize.js";

const TOOLKIT_VERSION = "0.0.0" as const;
const RULE_VERSION = "1.0.0" as const;
const RULE_IMPLEMENTATION_VERSION = "1.0.0" as const;
const RULE_IDS = ["DART-OPS-001", "DART-OPS-002", "DART-OPS-003"] as const;

function evidenceReference(evidence: Evidence): EvidenceReference {
  return { evidence_id: evidence.id, sha256: evidence.content.sha256 };
}

function implementationDigest(ruleId: (typeof RULE_IDS)[number]): string {
  return `sha256:${digestCanonical({
    rule_id: ruleId,
    rule_version: RULE_VERSION,
    implementation: "phase3-evidence-replay-prototype",
    implementation_version: RULE_IMPLEMENTATION_VERSION,
  })}`;
}

function fingerprint(
  ruleId: Finding["rule_id"],
  target: Finding["target"],
  subIdentity: string,
): string {
  return `sha256:${digestCanonical({
    rule_id: ruleId,
    rule_version: RULE_VERSION,
    evidence_mode: target.kind,
    target,
    sub_identity: subIdentity,
  })}`;
}

function fallbackTarget(mapping: IdentityMapping): Finding["target"] {
  return {
    kind: mapping.relation === "SOURCE_TO_BUILD" ? "ARTIFACT" : "DEPLOYMENT",
    identity: sanitizeText(mapping.to),
  };
}

function dimensionsCompatible(left: Evidence, right: Evidence): boolean {
  return left.target.locale === right.target.locale && left.target.version === right.target.version;
}

function mappingIdentityStatus(
  mapping: IdentityMapping,
  from: Evidence | undefined,
  to: Evidence | undefined,
): IdentityStatus {
  if (!from || !to) {
    return "IDENTITY_UNVERIFIED";
  }
  if (!dimensionsCompatible(from, to)) {
    return "IDENTITY_INCOMPATIBLE";
  }
  if (
    mapping.relation === "BUILD_TO_EXPECTED_LIVE" &&
    to.provenance.deployment_id?.trust === "USER_ASSERTED"
  ) {
    return "IDENTITY_UNVERIFIED";
  }
  return mapping.declared_trust === "USER_ASSERTED" ? "IDENTITY_ASSERTED" : "IDENTITY_ESTABLISHED";
}

function sourceBuildFinding(
  mapping: IdentityMapping,
  from: Evidence | undefined,
  to: Evidence | undefined,
): Finding {
  const evidence = [from, to].filter((item): item is Evidence => Boolean(item));
  const identityStatus = mappingIdentityStatus(mapping, from, to);
  let status: FindingStatus = "PASS";
  let fact = `Explicit mapping ${mapping.id} references present SOURCE and BUILD evidence.`;
  let boundary: EvidenceMode | null = null;
  if (!from && !to) {
    status = "UNAVAILABLE";
    fact = `Explicit mapping ${mapping.id} references no captured SOURCE or BUILD evidence.`;
    boundary = "SOURCE";
  } else if (!from) {
    status = "FAIL";
    fact = `BUILD evidence is present but mapped SOURCE evidence ${mapping.from} is absent.`;
    boundary = "SOURCE";
  } else if (!to) {
    status = "FAIL";
    fact = `SOURCE evidence is present but mapped BUILD evidence ${mapping.to} is absent.`;
    boundary = "BUILD";
  } else if (identityStatus === "IDENTITY_INCOMPATIBLE") {
    status = "FAIL";
    fact = `Mapped SOURCE and BUILD locale or version dimensions are incompatible.`;
    boundary = "BUILD";
  }
  const target = to?.target ?? fallbackTarget(mapping);
  const refs = evidence.map(evidenceReference);
  return {
    rule_id: "DART-OPS-001",
    rule_version: RULE_VERSION,
    implementation_digest: implementationDigest("DART-OPS-001"),
    category: "operational-readiness",
    severity: "high",
    status,
    title: "Explicit source-to-build identity",
    deterministic_fact: sanitizeText(fact),
    target,
    sub_identity: mapping.id,
    evidence_mode: boundary ?? "BUILD",
    responsible_boundary: boundary,
    identity_status: identityStatus,
    evidence: refs,
    observed_value: {
      source_present: Boolean(from),
      build_present: Boolean(to),
      mapping_trust: mapping.declared_trust,
    },
    expected_value: { source_present: true, build_present: true },
    likely_causes:
      status === "FAIL"
        ? [
            {
              text:
                boundary === "SOURCE"
                  ? "The source inventory or explicit mapping may be incomplete."
                  : "The build may have omitted the declared source page.",
              confidence: "medium",
              evidence_refs: refs,
            },
          ]
        : [],
    recommended_fix:
      status === "PASS"
        ? "No remediation required."
        : "Review the explicit mapping and the missing evidence boundary.",
    validation_method: "Recreate the bundle and replay DART-OPS-001.",
    regression_test_suggestion: "Keep this mapping as a source-to-build fixture.",
    fingerprint: fingerprint("DART-OPS-001", target, mapping.id),
  };
}

function buildLiveFinding(
  mapping: IdentityMapping,
  from: Evidence | undefined,
  to: Evidence | undefined,
): Finding {
  const evidence = [from, to].filter((item): item is Evidence => Boolean(item));
  const identityStatus = mappingIdentityStatus(mapping, from, to);
  let status: FindingStatus = "PASS";
  let fact = `Captured BUILD and LIVE representations match for ${mapping.id}.`;
  let boundary: EvidenceMode | null = null;
  if (!from || !to) {
    status = "UNAVAILABLE";
    fact = `Build-to-live comparison ${mapping.id} lacks required captured evidence.`;
    boundary = !from ? "BUILD" : "LIVE";
  } else if (identityStatus === "IDENTITY_INCOMPATIBLE") {
    status = "FAIL";
    fact = `Captured BUILD and LIVE identity dimensions are incompatible.`;
    boundary = "LIVE";
  } else if (from.content.sha256 !== to.content.sha256) {
    status = "FAIL";
    fact = `Captured LIVE representation differs from the expected BUILD representation.`;
    boundary = "LIVE";
  } else if (identityStatus === "IDENTITY_UNVERIFIED") {
    status = "WARN";
    fact = `Representations match, but asserted deployment lineage remains unverified.`;
  }
  const target = to?.target ?? from?.target ?? fallbackTarget(mapping);
  const refs = evidence.map(evidenceReference);
  return {
    rule_id: "DART-OPS-002",
    rule_version: RULE_VERSION,
    implementation_digest: implementationDigest("DART-OPS-002"),
    category: "operational-readiness",
    severity: "critical",
    status,
    title: "Build-to-recorded-live identity",
    deterministic_fact: sanitizeText(fact),
    target,
    sub_identity: mapping.id,
    evidence_mode: "LIVE",
    responsible_boundary: boundary,
    identity_status: identityStatus,
    evidence: refs,
    observed_value: {
      build_sha256: from?.content.sha256 ?? null,
      live_sha256: to?.content.sha256 ?? null,
    },
    expected_value: { representations_match: true },
    likely_causes:
      status === "FAIL"
        ? [
            {
              text: "The recorded deployment may be stale or may not contain the expected build.",
              confidence: "medium",
              evidence_refs: refs,
            },
          ]
        : [],
    recommended_fix:
      status === "FAIL"
        ? "Verify deployment identity and recorded content before changing source."
        : "No content remediation required.",
    validation_method: "Import a new LIVE capture and replay without network access.",
    regression_test_suggestion: "Retain paired BUILD and LIVE blobs as a drift canary.",
    fingerprint: fingerprint("DART-OPS-002", target, mapping.id),
  };
}

function provenanceFinding(evidence: Evidence): Finding {
  const deploymentTrust = evidence.provenance.deployment_id?.trust;
  const asserted = deploymentTrust === "USER_ASSERTED" || evidence.acquisition.kind === "ASSERTED";
  const complete =
    evidence.properties.integrity.status === "MATCHED" &&
    evidence.properties.provenance !== "ABSENT";
  const ref = evidenceReference(evidence);
  const status: FindingStatus = complete ? "PASS" : "WARN";
  return {
    rule_id: "DART-OPS-003",
    rule_version: RULE_VERSION,
    implementation_digest: implementationDigest("DART-OPS-003"),
    category: "operational-readiness",
    severity: "medium",
    status,
    title: "Evidence provenance and trust",
    deterministic_fact: sanitizeText(
      asserted
        ? "The deployment identity is caller asserted and remains unverified."
        : "Evidence integrity, acquisition, provenance, authenticity, and freshness remain distinct.",
    ),
    target: evidence.target,
    sub_identity: evidence.id,
    evidence_mode: evidence.mode,
    responsible_boundary: null,
    identity_status: "IDENTITY_UNVERIFIED",
    evidence: [ref],
    observed_value: {
      acquisition: evidence.acquisition.kind,
      integrity: evidence.properties.integrity.status,
      provenance: evidence.properties.provenance,
      authenticity: evidence.properties.authenticity,
      freshness: evidence.properties.freshness.status,
      deployment_trust: deploymentTrust ?? null,
    },
    expected_value: { integrity: "MATCHED", provenance_recorded: true },
    likely_causes: [],
    recommended_fix: complete
      ? "No remediation required."
      : "Supply provenance metadata without upgrading its trust.",
    validation_method: "Verify the bundle and inspect trust labels.",
    regression_test_suggestion: "Keep asserted and attested provenance fixtures separate.",
    fingerprint: fingerprint("DART-OPS-003", evidence.target, evidence.id),
  };
}

function missingEvidenceFinding(evidenceId: string, mode: "SOURCE" | "BUILD" | "LIVE"): Finding {
  const target = {
    kind:
      mode === "SOURCE"
        ? ("DOCUMENT" as const)
        : mode === "BUILD"
          ? ("ARTIFACT" as const)
          : ("DEPLOYMENT" as const),
    identity: sanitizeText(evidenceId),
  };
  return {
    rule_id: "DART-OPS-003",
    rule_version: RULE_VERSION,
    implementation_digest: implementationDigest("DART-OPS-003"),
    category: "operational-readiness",
    severity: "medium",
    status: "UNAVAILABLE",
    title: "Evidence provenance and trust",
    deterministic_fact: `Mapped ${mode} evidence ${sanitizeText(evidenceId)} is unavailable.`,
    target,
    sub_identity: evidenceId,
    evidence_mode: mode,
    responsible_boundary: mode,
    identity_status: "IDENTITY_UNVERIFIED",
    evidence: [],
    observed_value: {
      acquisition: null,
      integrity: null,
      provenance: "ABSENT",
      authenticity: "UNVERIFIED",
      freshness: "UNKNOWN",
      deployment_trust: null,
    },
    expected_value: { integrity: "MATCHED", provenance_recorded: true },
    likely_causes: [
      {
        text: "The declared mapping references evidence that was not captured.",
        confidence: "high",
        evidence_refs: [],
      },
    ],
    recommended_fix: "Capture the declared evidence or correct the explicit mapping.",
    validation_method: "Recreate the bundle and replay DART-OPS-003.",
    regression_test_suggestion: "Keep missing mapped evidence as a completeness fixture.",
    fingerprint: fingerprint("DART-OPS-003", target, evidenceId),
  };
}

function completeness(
  bundle: LoadedBundle,
  externalEvaluations: ExternalEvaluation[],
): EvidenceCompleteness {
  const result = {} as EvidenceCompleteness;
  for (const mode of [
    "SOURCE",
    "BUILD",
    "LIVE",
    "RUNTIME_OBSERVATION",
    "TASK_EVALUATION",
  ] as const) {
    if (!bundle.manifest.requested_modes.includes(mode)) {
      result[mode] = "NOT_REQUESTED";
      continue;
    }
    const count = bundle.manifest.evidence.filter((item) => item.mode === mode).length;
    const missingMappingReference = bundle.manifest.mappings.some((mapping) => {
      const referencedId =
        mode === "SOURCE"
          ? mapping.relation === "SOURCE_TO_BUILD"
            ? mapping.from
            : ""
          : mode === "BUILD"
            ? mapping.relation === "SOURCE_TO_BUILD"
              ? mapping.to
              : mapping.from
            : mode === "LIVE" && mapping.relation === "BUILD_TO_EXPECTED_LIVE"
              ? mapping.to
              : "";
      return (
        referencedId !== "" && !bundle.manifest.evidence.some((item) => item.id === referencedId)
      );
    });
    result[mode] = count === 0 ? "UNAVAILABLE" : missingMappingReference ? "PARTIAL" : "COMPLETE";
  }
  const availableExternal = externalEvaluations.filter(
    (item) => item.status === "AVAILABLE",
  ).length;
  result.EXTERNAL = !bundle.manifest.requested_external
    ? "NOT_REQUESTED"
    : availableExternal === 0
      ? "UNAVAILABLE"
      : availableExternal === externalEvaluations.length
        ? "COMPLETE"
        : "PARTIAL";
  return result;
}

function sortFindings(findings: Finding[]): Finding[] {
  return findings.sort(
    (left, right) =>
      [
        compareCodePoint(left.evidence_mode, right.evidence_mode),
        compareCodePoint(left.target.identity, right.target.identity),
        compareCodePoint(left.rule_id, right.rule_id),
        compareCodePoint(left.sub_identity, right.sub_identity),
      ].find((result) => result !== 0) ?? 0,
  );
}

export function analyzeBundle(
  bundle: LoadedBundle,
  externalEvaluations: ExternalEvaluation[] = [],
): AnalysisReport {
  const byId = new Map(bundle.manifest.evidence.map((evidence) => [evidence.id, evidence]));
  const findings: Finding[] = [];
  for (const mapping of bundle.manifest.mappings) {
    const from = byId.get(mapping.from);
    const to = byId.get(mapping.to);
    findings.push(
      mapping.relation === "SOURCE_TO_BUILD"
        ? sourceBuildFinding(mapping, from, to)
        : buildLiveFinding(mapping, from, to),
    );
  }
  for (const evidence of bundle.manifest.evidence) {
    findings.push(provenanceFinding(evidence));
  }
  const missingEvidence = new Set<string>();
  for (const mapping of bundle.manifest.mappings) {
    const endpoints: Array<[string, "SOURCE" | "BUILD" | "LIVE"]> =
      mapping.relation === "SOURCE_TO_BUILD"
        ? [
            [mapping.from, "SOURCE"],
            [mapping.to, "BUILD"],
          ]
        : [
            [mapping.from, "BUILD"],
            [mapping.to, "LIVE"],
          ];
    for (const [evidenceId, mode] of endpoints) {
      if (!byId.has(evidenceId) && !missingEvidence.has(evidenceId)) {
        findings.push(missingEvidenceFinding(evidenceId, mode));
        missingEvidence.add(evidenceId);
      }
    }
  }

  const compatibility = {
    report_schema_version: "1.0" as const,
    toolkit_version: TOOLKIT_VERSION,
    parser_version: "evidence-bundle-parser@1.0.0" as const,
    canonicalizer_version: "json-canonicalize@3.0.1" as const,
    identity_algorithm_version: "1.0.0" as const,
    rule_set_digest: `sha256:${digestCanonical(
      RULE_IDS.map((ruleId) => ({
        rule_id: ruleId,
        rule_version: RULE_VERSION,
        implementation_digest: implementationDigest(ruleId),
      })),
    )}`,
    configuration_digest: `sha256:${digestCanonical({
      requested_modes: bundle.manifest.requested_modes,
      requested_external: bundle.manifest.requested_external,
      mappings: bundle.manifest.mappings,
    })}`,
    target_inventory_digest: `sha256:${digestCanonical(
      bundle.manifest.mappings.map((mapping) => ({
        from: mapping.from,
        to: mapping.to,
        relation: mapping.relation,
      })),
    )}`,
    external_adapter_versions: Object.fromEntries(
      externalEvaluations.map((item) => [item.producer, item.adapter_version]),
    ),
    external_evaluator_versions: Object.fromEntries(
      externalEvaluations.map((item) => [item.producer, item.evaluator_version]),
    ),
  };
  const withoutId = {
    schema_version: "1.0" as const,
    report_id: "",
    bundle_id: bundle.bundleId,
    compatibility,
    evidence_completeness: completeness(bundle, externalEvaluations),
    findings: sortFindings(findings),
    external_evaluations: externalEvaluations,
  };
  return withDerivedId(withoutId, "report_id") as unknown as AnalysisReport;
}
