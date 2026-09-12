# Phase 3 Evidence Replay Prototype

This guide describes the implemented prototype, its deterministic contracts, and its
deliberately limited scope.

## Status

The repository contains a deliberately small TypeScript prototype. It proves the
evidence, identity, replay, baseline, policy, and recorded-result import flow. It is not
a complete agent-readiness auditor or a published npm package.

Implemented:

- constrained local SOURCE and BUILD collection from explicit files;
- imported or asserted recorded evidence, including captured LIVE bytes;
- content-addressed evidence bundles;
- separate acquisition, trust, integrity, provenance, authenticity, and freshness;
- explicit source-to-build and build-to-recorded-live mappings;
- deterministic offline Tier 0 rules;
- canonical JSON and concise Markdown reports;
- evidence completeness by mode;
- compatible baseline comparison with five regression states;
- trusted-base policy loading and exits 0 through 5;
- AFDocs 0.18.7 recorded-result import;
- six canaries, localization fixtures, golden outputs, and offline security tests.

## Architecture

The prototype moves explicit local or recorded inputs through an offline evidence and
analysis pipeline.

```text
EXPLICIT LOCAL COLLECTOR OR RECORDED IMPORT
                    |
                    v
        CONTENT-ADDRESSED EVIDENCE
                    |
                    v
          OFFLINE DETERMINISTIC CORE
                    |
                    v
              CANONICAL FINDINGS
                    |
          +---------+---------+
          |                   |
          v                   v
    BASELINE/DIFF        POLICY/REPORTS
```

The analyzer does not use HTTP, DNS, sockets, browsers, child processes, repository
hooks, build commands, documentation examples, or dynamic adapters.

## Toolchain

The prototype uses a small, pinned TypeScript toolchain for deterministic development
and verification.

- Node.js 22 or newer
- TypeScript with strict checking
- npm with a committed lockfile
- Ajv for JSON Schema validation
- `json-canonicalize` for deterministic JSON
- Vitest for unit, fixture, security, and golden tests
- Biome for formatting and lint

The package is private and named `docs-agent-readiness-toolkit-prototype`. This does not
freeze a public package or executable name.

## Install and verify

Install the locked dependencies and run the repository's prototype checks with these
commands.

```bash
npm ci
npm run check
```

`npm run check` runs formatting verification, lint, strict type checking, tests, and a
TypeScript build.

## Minimal local example

The following commands create and analyze a bundle using only the committed local
example inputs.

```bash
npm run build

node dist/cli.js bundle create \
  --config examples/minimal/collector.json \
  --output .artifacts/example-bundle

node dist/cli.js analyze \
  --bundle .artifacts/example-bundle \
  --json .artifacts/report.json \
  --markdown .artifacts/report.md
```

The collector reads only the explicit entries in `collector.json`. It does not run a
documentation build.

## Evidence model

Evidence modes:

- `SOURCE`
- `BUILD`
- `LIVE`
- `RUNTIME_OBSERVATION`
- `TASK_EVALUATION`

Acquisition kinds:

- `COLLECTED`
- `IMPORTED`
- `ASSERTED`
- `ATTESTED`

Field trust:

- `OBSERVED_BY_COLLECTOR`
- `DETERMINISTICALLY_DERIVED`
- `USER_ASSERTED`
- `EXTERNALLY_ATTESTED`

Every evidence record separates integrity, provenance, authenticity, and freshness. A
SHA-256 digest proves only whether the captured bytes changed. It does not authenticate
their origin.

The schema reserves `ATTESTED` and `EXTERNALLY_ATTESTED`, but the prototype has no
attestation verifier. The local collector rejects self-asserted attestation labels.

## Bundle model

A bundle directory contains:

```text
bundle.json
blobs/
  <sha256>
```

The loader rejects absolute paths, traversal, symlinks, undeclared files, digest or byte
count mismatches, oversized inputs, unknown schema versions, and normalized input
collisions. The bundle ID is derived from the canonical manifest. It is not stored
inside the hashed manifest.

## Identity model

The core compares identities it can establish. It does not manufacture lineage.

Source-to-build and build-to-recorded-live mappings name evidence IDs explicitly.
Framework path inference is not implemented. Identity results are:

- `IDENTITY_ESTABLISHED`
- `IDENTITY_ASSERTED`
- `IDENTITY_UNVERIFIED`
- `IDENTITY_INCOMPATIBLE`

## Replay and findings

Tier 0 implements:

- `DART-OPS-001`: explicit source-to-build mapping;
- `DART-OPS-002`: build-to-recorded-live comparison;
- `DART-OPS-003`: provenance, trust, and evidence-property completeness without making
  a target-lineage claim.

Identity status describes the strength of a declared relationship between targets.
Authenticity describes the strength of evidence's claimed origin. `DART-OPS-001` and
`DART-OPS-002` evaluate target relationships. `DART-OPS-003` leaves
`identity_status` as `IDENTITY_UNVERIFIED` and reports the evidence properties
separately.

The same bundle, versions, and configuration produce byte-equivalent canonical output.
The report contains no current clock, machine path, hostname, or environment value.

Findings keep deterministic fact, likely cause, recommended fix, validation method, and
regression test suggestion separate. Likely-cause confidence is qualitative and tied to
evidence references.

## Baseline and regression

Canonical states are:

- `NEW`
- `RESOLVED`
- `CHANGED`
- `UNCHANGED`
- `INCOMPATIBLE`

`CHANGED` retains previous and current finding status. A previous issue is `RESOLVED`
only when a compatible current finding explicitly passes. Missing evidence does not
prove resolution.

Compatibility reasons identify the dimension that changed:
`SCHEMA_INCOMPATIBLE`, `PARSER_VERSION_CHANGED`,
`CANONICALIZER_VERSION_CHANGED`, `IDENTITY_ALGORITHM_CHANGED`,
`RULE_VERSION_CHANGED`, `CONFIGURATION_CHANGED`, `TARGET_IDENTITY_CHANGED`, and
`EVALUATOR_VERSION_CHANGED`.

External checks stay in their producer namespace. If a baseline external check has no
corresponding current imported observation, its comparison is `INCOMPATIBLE` with
`EXTERNAL_CHECK_UNAVAILABLE`. Absence is unavailable comparison evidence, not proof
that the external issue was resolved.

## Evidence completeness

Each mode and `EXTERNAL` is:

- `COMPLETE`
- `PARTIAL`
- `UNAVAILABLE`
- `NOT_REQUESTED`

Completeness is not a score. Zero failures does not imply complete evidence.

## Policy and CI

Finding status is separate from `BLOCKING`, `ADVISORY`, and `INFORMATIONAL` policy.

The CI command accepts `--trusted-base-root`. It reads only
`.docs-agent-readiness/policy.json` and an optional baseline beneath that root. It does
not invoke Git. The example workflow checks out the trusted base separately so the
proposed revision cannot weaken the policy that evaluates it.

Exit codes:

| Code | Meaning |
| ---: | --- |
| 0 | No blocking policy result |
| 1 | Blocking finding or compatible regression |
| 2 | Invalid command or configuration |
| 3 | Bundle, parser, filesystem, or required-input failure |
| 4 | Required recorded evaluator evidence unavailable or invalid |
| 5 | Baseline or schema incompatibility configured as an error |

The canonical JSON, not the exit code, is the audit record.

## AFDocs recorded-result import

The adapter supports the evidenced AFDocs 0.18.7 result shape. It preserves raw bytes by
bundle digest, external score, raw status, target, measured time, and adapter version.
It maps `skip` to `SKIP`, never `PASS`.

The prototype does not install, spawn, or reimplement AFDocs. Unsupported 0.x versions
remain recorded evidence with adapter status `UNAVAILABLE`.

Policy can require a parseable AFDocs import and can separately require `ATTESTED`
authenticity. Availability alone does not authenticate the producer claim.

## Six canaries

The acceptance set fixes six behaviors across evidence boundaries, identity, and
baseline comparison.

1. SOURCE present and BUILD absent localizes a BUILD boundary defect.
2. BUILD A and captured LIVE B localize drift to LIVE without HTTP.
3. Different source/build paths pass through an explicit valid mapping while the
   caller-supplied relationship remains `IDENTITY_ASSERTED`.
4. Asserted deployment ID remains user asserted and unverified.
5. A compatible status change from `PASS` to `FAIL` becomes `CHANGED`, retains
   `previous_status` and `current_status`, and blocks policy.
6. Incompatible metadata becomes `INCOMPATIBLE`, not new or resolved.

Separate localization fixtures cover source, build, captured live, and imported external
evaluator boundaries.

## Deliberately deferred

The following capabilities remain outside the authorized prototype scope.

- live HTTP acquisition and crawling;
- framework adapters;
- broad readiness rules;
- generic `llms.txt`, link, lint, parity, auth, or soft-404 checks;
- AFDocs or Vercel execution;
- browser or JavaScript execution;
- AI diagnosis;
- task evaluation;
- automatic fixes;
- hosted monitoring;
- telemetry;
- composite readiness scores;
- dynamic third-party plugins;
- arbitrary build or repository commands.

## Security and limitations

The offline tests cover the implemented filesystem, schema, integrity, output, policy,
and no-network boundaries. They do not prove future HTTP collector security.

The prototype uses descriptor-based reads and repeat identity checks, but it is not an
OS sandbox. A hostile local process can still race file growth or replacement, and
transitive dependencies are not prevented from opening sockets by an operating-system
policy. Current no-network/no-execution tests combine disabled `fetch`, source import
restrictions, and dependency review. Treat those as prototype controls, not a complete
process-isolation guarantee.

[Live Acquisition Security Gate](./live-acquisition-security-gate.md) lists the blocking
requirements for Stage 3. [Practitioner Validation Protocol](./practitioner-validation-protocol.md)
defines human evaluation, which remains `NOT_RUN`.

The prototype does not establish universal agent success, complete readiness auditing,
live-site coverage, framework coverage, content correctness, or production readiness.

## Next validation step

Run the practitioner protocol with the three intended roles before adding live
acquisition or more rules.
