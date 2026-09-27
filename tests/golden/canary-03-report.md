# Documentation Readiness Run

Report: `sha256:b4d7d9b5ce697fd092366a05fca4aa623d8b1a9a90594a84b4113697103ad1f5`
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

Counts summarize status only. A status is not a policy decision. PASS is a check
status, not approval of origin, freshness, lineage, or deployment. Imported
evaluator results are counted separately under external evaluations and never
appear here.

A declared target names the endpoint the rule evaluated, which on a failure is the
evidence that was present. The fact line names the side that is absent.

- PASS: 3
- WARN: 0
- FAIL: 0
- SKIP: 0
- NOT_APPLICABLE: 0
- UNAVAILABLE: 0

### DART-OPS-001 mapping:getting-started: Explicit source-to-build mapping

- Status: PASS
- Severity: high
- Declared target: `getting-started` (ARTIFACT)
- Sub-identity: `mapping:getting-started`
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
- Recommended action: No defect was observed. Authenticity, freshness, and lineage remain as recorded; this status is not an approval.
- Validation: Recreate the bundle and replay DART-OPS-001.

### DART-OPS-003 build:getting-started: Evidence provenance and trust

- Status: PASS
- Severity: medium
- Declared target: `getting-started` (ARTIFACT)
- Sub-identity: `build:getting-started`
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
- Recommended action: No defect was observed. Authenticity, freshness, and lineage remain as recorded; this status is not an approval.
- Validation: Verify the bundle and inspect trust labels.

### DART-OPS-003 source:getting-started: Evidence provenance and trust

- Status: PASS
- Severity: medium
- Declared target: `getting-started` (DOCUMENT)
- Sub-identity: `source:getting-started`
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
- Recommended action: No defect was observed. Authenticity, freshness, and lineage remain as recorded; this status is not an approval.
- Validation: Verify the bundle and inspect trust labels.
