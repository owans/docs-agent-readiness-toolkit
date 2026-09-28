# Changelog

Notable user-facing changes will be recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and future
released software will use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

This section records changes that have not yet been included in a public release.

### Added

The unreleased work introduces the following public project material and prototype
capabilities.

- Public methodology, specifications, rule catalog, and decision record.
- Phase 3 evidence, deterministic replay, baseline comparison, policy, and reporting
  prototype.
- Recorded AFDocs 0.18.7 import boundary.
- Generic canary, localization, golden, and offline security tests.
- Public contribution, security, support, maintenance, and release documentation.
- Runnable scenario examples under `examples/scenarios/` that reproduce the acceptance
  fixtures through the documented commands, including reviewed baselines and advisory
  and blocking trusted policies.
- Anonymized practitioner validation results for the first pilot, with proposed
  acceptance thresholds recorded as `STAKEHOLDER_REQUIRED`.
- A scenario walkthrough covering failure localization, baseline comparison, an
  incompatible baseline, and both CI policy outcomes.
- A `--markdown` option on `compare`, so regression states and compatibility reasons can
  be read without opening canonical JSON.
- An optional `--bundle` on `compare`, so Markdown comparisons can render evidence
  locations and locator trust.
- A second regression trusted base whose policy treats the same findings as advisory,
  so one bundle can demonstrate both CI outcomes.
- Anonymized practitioner validation results for the second-iteration technical
  writer, documentation engineer, and senior platform engineer sessions.
- Anonymized practitioner validation results for the reporting-fix re-run with all
  three required roles.
- Walkthrough commands for `clean-mapping`, `asserted-provenance`, and
  `external-defect`.
- A trusted base under `incompatible-baseline` and a walkthrough `ci` command that
  produce exit 5 with the Policy-section reason.

### Changed

The unreleased work changes the organization of public and private project material and
the detail the human-readable report carries.

- Separated the public reusable toolkit from the private case-study and research
  workspace.
- The Markdown report now describes every finding, including passing findings, with
  observed and expected values, evidence locations and their locator trust, and the
  authenticity and freshness qualifiers behind a passing status.
- `bundle create`, `analyze`, and `ci` now confirm the bundle and reports they wrote
  instead of completing silently.
- The `DART-OPS-001` deterministic fact names the declared source-to-build relation
  rather than repeating the word mapping, which changes `report_id` for affected
  reports without changing any compatibility digest.
- The Markdown regression section now reports the compared report identities, whether the
  comparison was compatible, and the reason for every `INCOMPATIBLE` entry.
- The `DART-OPS-001` and `DART-OPS-002` titles name declared mappings rather than
  identity, so a passing `IDENTITY_ASSERTED` result is not read as established identity.
  Titles are not fingerprint inputs, but `report_id` changes for affected reports.
- Finding headings include the sub-identity so repeated `DART-OPS-003` sections remain
  unique.
- The evidence-completeness table always renders in canonical mode order.
- The Policy section lists matched-rule reasons and names the configured cause of
  exits 4 and 5.
- The walkthrough evaluates one regression bundle under both trusted policies and
  documents `baseline create`.
- The practitioner protocol defines a correct evidence citation and scopes the
  terminology threshold to unresolved problems carried over from a prior session.
- The repository owner approved the practitioner threshold table on 2026-09-27. The
  reporting-fix re-run used that table as the bar and is recorded as
  `PROTOCOL_COMPLETE`, with the recorded blinding caveat.
- Markdown `CHANGED`, `UNCHANGED`, and finding-level `INCOMPATIBLE` lines name the
  rule, sub-identity, and declared target instead of a finding hash. Policy regression
  reasons use the same labels.
- `baseline create` prints the output path and a labeled report identity.
- Policy Markdown keeps the toolkit ` -> ` status arrow readable after sanitization.
- Incompatible compare Markdown states the owner next action: review the reason, then
  stop or re-baseline after approval.
- Passing findings no longer recommend `No remediation required`. The Findings section
  states that `PASS` is a check status, not approval.

### Deprecated

No features or interfaces are currently deprecated.

- Nothing.

### Removed

No features or interfaces are currently removed.

- Nothing.

### Fixed

The unreleased work corrects documentation and reporting problems the first practitioner
pilot recorded.

- Removed the redundant `npm run build` step from the documented setup, because
  `npm run check` already ends in a build.
- Documented that output paths are never overwritten and that a passing finding
  deliberately carries no responsible boundary and no likely cause.
- Resolved the disagreement between the Markdown-first validation protocol and a
  JSON-only `compare` command, which blocked a practitioner session. The protocol now
  names the three Markdown reports that cover its tasks.
- The Policy section no longer prints `Result: BLOCKED` next to `Blocking: 0` without
  naming baseline incompatibility or unavailable required evaluator evidence.
- `bundle create` labels the bundle digest, pluralizes the evidence-record count, and
  names an existing output path instead of surfacing a raw `EEXIST` error.

### Security

The unreleased security documentation clarifies the prototype's operating boundary.

- Documented the network-free analyzer boundary and the blocking live-acquisition
  security gate.

[Unreleased]: https://github.com/owans/docs-agent-readiness-toolkit/commits/main
