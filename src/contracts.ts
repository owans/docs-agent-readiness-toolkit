export const EVIDENCE_MODES = [
  "SOURCE",
  "BUILD",
  "LIVE",
  "RUNTIME_OBSERVATION",
  "TASK_EVALUATION",
] as const;
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];

export const ACQUISITION_KINDS = ["COLLECTED", "IMPORTED", "ASSERTED", "ATTESTED"] as const;
export type AcquisitionKind = (typeof ACQUISITION_KINDS)[number];

export const TRUST_LABELS = [
  "OBSERVED_BY_COLLECTOR",
  "DETERMINISTICALLY_DERIVED",
  "USER_ASSERTED",
  "EXTERNALLY_ATTESTED",
] as const;
export type TrustLabel = (typeof TRUST_LABELS)[number];

export const FINDING_STATUSES = [
  "PASS",
  "WARN",
  "FAIL",
  "SKIP",
  "NOT_APPLICABLE",
  "UNAVAILABLE",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const IDENTITY_STATUSES = [
  "IDENTITY_ESTABLISHED",
  "IDENTITY_ASSERTED",
  "IDENTITY_UNVERIFIED",
  "IDENTITY_INCOMPATIBLE",
] as const;
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

export const REGRESSION_STATES = [
  "NEW",
  "RESOLVED",
  "CHANGED",
  "UNCHANGED",
  "INCOMPATIBLE",
] as const;
export type RegressionState = (typeof REGRESSION_STATES)[number];

export const COMPLETENESS_STATES = ["COMPLETE", "PARTIAL", "UNAVAILABLE", "NOT_REQUESTED"] as const;
export type CompletenessState = (typeof COMPLETENESS_STATES)[number];

export const POLICY_EFFECTS = ["BLOCKING", "ADVISORY", "INFORMATIONAL"] as const;
export type PolicyEffect = (typeof POLICY_EFFECTS)[number];

export interface TrustedValue {
  value: string;
  trust: TrustLabel;
}

export interface TargetIdentity {
  kind: "DOCUMENT" | "ARTIFACT" | "DEPLOYMENT" | "EXTERNAL_EVALUATION";
  identity: string;
  locale?: string;
  version?: string;
}

export interface Acquisition {
  kind: AcquisitionKind;
  collector?: string;
  producer?: string;
}

export interface EvidenceProperties {
  integrity: {
    algorithm: "sha256";
    digest: string;
    status: "MATCHED";
  };
  provenance: "PRESENT" | "PARTIAL" | "ABSENT";
  authenticity: "UNVERIFIED" | "ASSERTED" | "ATTESTED";
  freshness: {
    status: "KNOWN" | "UNKNOWN";
    observed_at?: TrustedValue;
    generated_at?: TrustedValue;
  };
}

export interface Evidence {
  id: string;
  mode: EvidenceMode;
  acquisition: Acquisition;
  target: TargetIdentity;
  content: {
    blob: string;
    sha256: string;
    bytes: number;
    media_type: string;
  };
  provenance: {
    source?: TrustedValue;
    deployment_id?: TrustedValue;
  };
  properties: EvidenceProperties;
}

export interface IdentityMapping {
  id: string;
  from: string;
  to: string;
  relation: "SOURCE_TO_BUILD" | "BUILD_TO_EXPECTED_LIVE";
  declared_trust: TrustLabel;
}

export interface EvidenceBundleManifest {
  schema_version: "1.0";
  bundle_version: "1.0";
  requested_modes: EvidenceMode[];
  requested_external: boolean;
  evidence: Evidence[];
  mappings: IdentityMapping[];
}

export interface CollectorInput {
  id: string;
  mode: EvidenceMode;
  root: "SOURCE" | "BUILD" | "IMPORT";
  path: string;
  media_type: string;
  acquisition: Acquisition;
  target: TargetIdentity;
  provenance?: {
    source?: TrustedValue;
    deployment_id?: TrustedValue;
    observed_at?: TrustedValue;
    generated_at?: TrustedValue;
    authenticity?: "UNVERIFIED" | "ASSERTED" | "ATTESTED";
  };
}

export interface CollectorConfiguration {
  schema_version: "1.0";
  roots: {
    SOURCE?: string;
    BUILD?: string;
    IMPORT?: string;
  };
  requested_modes: EvidenceMode[];
  requested_external?: boolean;
  inputs: CollectorInput[];
  mappings: IdentityMapping[];
}

export interface EvidenceReference {
  evidence_id: string;
  sha256: string;
}

export interface LikelyCause {
  text: string;
  confidence: "low" | "medium" | "high";
  evidence_refs: EvidenceReference[];
}

export interface Finding {
  rule_id: "DART-OPS-001" | "DART-OPS-002" | "DART-OPS-003";
  rule_version: "1.0.0";
  implementation_digest: string;
  category: "operational-readiness";
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: FindingStatus;
  title: string;
  deterministic_fact: string;
  target: TargetIdentity;
  sub_identity: string;
  evidence_mode: EvidenceMode;
  responsible_boundary: EvidenceMode | "EXTERNAL" | null;
  identity_status: IdentityStatus;
  evidence: EvidenceReference[];
  observed_value: unknown;
  expected_value: unknown;
  likely_causes: LikelyCause[];
  recommended_fix: string;
  validation_method: string;
  regression_test_suggestion: string;
  fingerprint: string;
}

export interface ExternalEvaluation {
  producer: "afdocs";
  evaluator_version: string;
  adapter_version: "1.0.0";
  acquisition: "IMPORTED";
  authenticity: "UNVERIFIED" | "ASSERTED" | "ATTESTED";
  evidence_ref: EvidenceReference;
  status: "AVAILABLE" | "UNAVAILABLE";
  reason?: string;
  target?: string;
  measured_at?: string;
  raw_score?: number;
  raw_grade?: string;
  checks?: Array<{
    id: string;
    category: string;
    raw_status: string;
    normalized_status: FindingStatus;
    message: string;
  }>;
}

export interface EvidenceCompleteness {
  SOURCE: CompletenessState;
  BUILD: CompletenessState;
  LIVE: CompletenessState;
  RUNTIME_OBSERVATION: CompletenessState;
  TASK_EVALUATION: CompletenessState;
  EXTERNAL: CompletenessState;
}

export interface CompatibilityMetadata {
  report_schema_version: "1.0";
  toolkit_version: "0.0.0";
  parser_version: "evidence-bundle-parser@1.0.0";
  canonicalizer_version: "json-canonicalize@3.0.1";
  identity_algorithm_version: "1.0.0";
  rule_set_digest: string;
  configuration_digest: string;
  target_inventory_digest: string;
  external_adapter_versions: Record<string, string>;
  external_evaluator_versions: Record<string, string>;
}

export interface AnalysisReport {
  schema_version: "1.0";
  report_id: string;
  bundle_id: string;
  compatibility: CompatibilityMetadata;
  evidence_completeness: EvidenceCompleteness;
  findings: Finding[];
  external_evaluations: ExternalEvaluation[];
}

export interface Regression {
  state: RegressionState;
  fingerprint: string;
  previous_status?: FindingStatus;
  current_status?: FindingStatus;
  reason?:
    | "RULE_VERSION_CHANGED"
    | "SCHEMA_INCOMPATIBLE"
    | "CONFIGURATION_CHANGED"
    | "TARGET_IDENTITY_CHANGED"
    | "CANONICALIZER_VERSION_CHANGED"
    | "IDENTITY_ALGORITHM_CHANGED"
    | "PARSER_VERSION_CHANGED"
    | "EVALUATOR_VERSION_CHANGED"
    | "EXTERNAL_CHECK_UNAVAILABLE";
  baseline?: Finding;
  current?: Finding;
  external_producer?: string;
  external_check_id?: string;
}

export interface ComparisonReport {
  schema_version: "1.0";
  baseline_report_id: string;
  current_report_id: string;
  compatible: boolean;
  regressions: Regression[];
}

export interface PolicyRule {
  rule_id?: string;
  finding_status?: FindingStatus;
  regression_state?: RegressionState;
  effect: PolicyEffect;
}

export interface Policy {
  schema_version: "1.0";
  incompatible_baseline: "ERROR" | "ADVISORY";
  baseline_path?: string;
  required_completeness?: Partial<Record<keyof EvidenceCompleteness, CompletenessState>>;
  external_afdocs_required: boolean;
  external_afdocs_authenticity?: "ANY" | "ATTESTED";
  rules: PolicyRule[];
}

export interface PolicyResult {
  effect: PolicyEffect;
  blocking: number;
  advisory: number;
  informational: number;
  reasons: string[];
  exit_code: 0 | 1 | 4 | 5;
}
