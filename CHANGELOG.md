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

### Security

The unreleased security documentation clarifies the prototype's operating boundary.

- Documented the network-free analyzer boundary and the blocking live-acquisition
  security gate.

[Unreleased]: https://github.com/owans/docs-agent-readiness-toolkit/commits/main
