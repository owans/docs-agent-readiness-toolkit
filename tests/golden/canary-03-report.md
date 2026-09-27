# Documentation Readiness Run

Report: `sha256:c722c79e33829e29a842987dcaa66543a16e74b898b93732e872d7c45f8e91b8`
Evidence bundle: `sha256:d246e4ba45a149923e6e2ff3e6d63f4a3fa7b885e1eb0349b87a0c22b1c9959b`
Replay: offline

## Evidence completeness

| Evidence | Completeness |
| --- | --- |
| SOURCE | COMPLETE |
| BUILD | COMPLETE |
| LIVE | NOT_REQUESTED |
| RUNTIME_OBSERVATION | NOT_REQUESTED |
| TASK_EVALUATION | NOT_REQUESTED |
| EXTERNAL | NOT_REQUESTED |

## Findings

Counts summarize status only. A status is not a policy decision, and a passing
status does not establish authenticity, freshness, or lineage.

- PASS: 3
- WARN: 0
- FAIL: 0
- SKIP: 0
- NOT_APPLICABLE: 0
- UNAVAILABLE: 0

### DART-OPS-001: Explicit source-to-build identity

- Status: PASS
- Severity: high
- Target: `getting-started` (ARTIFACT)
- Sub-identity: `mapping:getting-started`
- Evidence mode: BUILD
- Evidence boundary: none
- Identity: IDENTITY_ASSERTED
- Fact: Declared source-to-build relation mapping:getting-started references present SOURCE and BUILD evidence.
- Observed build_present: true
- Observed mapping_trust: USER_ASSERTED
- Observed source_present: true
- Expected build_present: true
- Expected source_present: true
- Evidence `source:getting-started`, sha256 b1466d181438eea69b489cd6f48b0cc494d615e919f0d9deea4b0e588ffd61b6
- Evidence `build:getting-started`, sha256 e5f5ffe0a7d4a93ad3baacf7c825780cd6a3d7db1fb40ced6dbc5b3448aff8b9
- Likely cause: none inferred
- Recommended action: No remediation required.
- Validation: Recreate the bundle and replay DART-OPS-001.

### DART-OPS-003: Evidence provenance and trust

- Status: PASS
- Severity: medium
- Target: `getting-started` (ARTIFACT)
- Sub-identity: `build:getting-started`
- Evidence mode: BUILD
- Evidence boundary: none
- Identity: IDENTITY_UNVERIFIED
- Fact: Evidence integrity, acquisition, provenance, authenticity, and freshness remain distinct.
- Observed acquisition: COLLECTED
- Observed authenticity: UNVERIFIED
- Observed deployment_trust: none
- Observed freshness: UNKNOWN
- Observed integrity: MATCHED
- Observed provenance: PRESENT
- Expected integrity: MATCHED
- Expected provenance_recorded: true
- Evidence `build:getting-started`, sha256 e5f5ffe0a7d4a93ad3baacf7c825780cd6a3d7db1fb40ced6dbc5b3448aff8b9
- Likely cause: none inferred
- Recommended action: No remediation required.
- Validation: Verify the bundle and inspect trust labels.

### DART-OPS-003: Evidence provenance and trust

- Status: PASS
- Severity: medium
- Target: `getting-started` (DOCUMENT)
- Sub-identity: `source:getting-started`
- Evidence mode: SOURCE
- Evidence boundary: none
- Identity: IDENTITY_UNVERIFIED
- Fact: Evidence integrity, acquisition, provenance, authenticity, and freshness remain distinct.
- Observed acquisition: COLLECTED
- Observed authenticity: UNVERIFIED
- Observed deployment_trust: none
- Observed freshness: UNKNOWN
- Observed integrity: MATCHED
- Observed provenance: PRESENT
- Expected integrity: MATCHED
- Expected provenance_recorded: true
- Evidence `source:getting-started`, sha256 b1466d181438eea69b489cd6f48b0cc494d615e919f0d9deea4b0e588ffd61b6
- Likely cause: none inferred
- Recommended action: No remediation required.
- Validation: Verify the bundle and inspect trust labels.
