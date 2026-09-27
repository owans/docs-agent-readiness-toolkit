# Docs Agent Readiness Toolkit

An open-source engineering toolkit for analyzing, comparing, and enforcing documentation
evidence for machine consumers.

Documentation can look correct to a human while remaining difficult for automated
systems to discover, retrieve, parse, or use reliably. The toolkit helps writers,
documentation engineers, DevEx teams, and platform engineers inspect those conditions
using explicit evidence, deterministic analysis, baseline comparison, and CI policy.

## What it does

The current implementation provides a local evidence and analysis workflow:

- collects explicit local source and build files;
- imports recorded evidence, including captured live bytes;
- stores content-addressed evidence bundles;
- analyzes bundles deterministically without network access;
- validates explicit source-to-build and build-to-recorded-live mappings;
- emits canonical JSON and concise Markdown reports;
- records evidence completeness by mode;
- compares compatible reports using stable finding identities;
- applies trusted-base policy for CI;
- imports recorded AFDocs 0.18.7 results without executing AFDocs.

## Current scope

The toolkit focuses on deterministic analysis of local and recorded evidence. It does
not crawl live websites, perform live HTTP acquisition, execute documentation builds,
run browsers, load dynamic plugins, call an LLM, evaluate agent tasks, apply automatic
fixes, or provide hosted monitoring.

It is an early implementation, not a complete agent-readiness auditor or a
production-readiness claim. It does not claim universal agent success, factual
correctness, workflow completion, live-site coverage, or complete framework coverage.

## Why it exists

Documentation defects can occur in source, generated output, a captured deployment, a
runtime observation, or a task evaluation. Treating those states as interchangeable
creates false confidence and poor remediation.

The toolkit supports this engineering lifecycle:

`DISCOVER -> DIAGNOSE -> FIX -> VALIDATE -> ENFORCE -> TRACK`

Its current focus is evidence and diagnosis: preserve what was observed, identify the
responsible boundary, replay analysis offline, and compare compatible findings over
time.

## Core model

The toolkit keeps evidence, trust, identity, findings, and policy separate so that one
signal does not stand in for another. Evidence modes remain distinct:

- `SOURCE`
- `BUILD`
- `LIVE`
- `RUNTIME_OBSERVATION`
- `TASK_EVALUATION`

Acquisition records how evidence entered a bundle:

- `COLLECTED`
- `IMPORTED`
- `ASSERTED`
- `ATTESTED`

Each evidence record separates integrity, provenance, authenticity, and freshness. A
SHA-256 match establishes byte integrity only. It does not authenticate origin or prove
lineage.

Cross-mode relationships are explicit. Identity results are
`IDENTITY_ESTABLISHED`, `IDENTITY_ASSERTED`, `IDENTITY_UNVERIFIED`, or
`IDENTITY_INCOMPATIBLE`. The core does not infer framework lineage from paths.

Finding status is separate from policy:

- `PASS`, `WARN`, `FAIL`, `SKIP`, `NOT_APPLICABLE`, `UNAVAILABLE`
- policy effects: `BLOCKING`, `ADVISORY`, `INFORMATIONAL`

Compatible baseline comparisons produce:

- `NEW`
- `RESOLVED`
- `CHANGED`
- `UNCHANGED`
- `INCOMPATIBLE`

`CHANGED` retains previous and current status. Missing evidence is not treated as proof
of resolution.

Evidence completeness is recorded independently for each mode and external evidence as
`COMPLETE`, `PARTIAL`, `UNAVAILABLE`, or `NOT_REQUESTED`.

## Quick start

Install Node.js 22.12.0 or later and npm, then create and analyze a bundle from the
included minimal example. `npm run check` ends in a build, so no separate build step is
needed:

```bash
npm ci
npm run check

node dist/cli.js bundle create \
  --config examples/minimal/collector.json \
  --output .artifacts/example-bundle

node dist/cli.js analyze \
  --bundle .artifacts/example-bundle \
  --json .artifacts/report.json \
  --markdown .artifacts/report.md
```

Each command prints the bundle or report it wrote. Output paths are never overwritten,
so use a new path or remove the previous file before repeating a step.

The minimal example contains no defect, so every finding passes. Work through the
[scenario walkthrough](docs/phase3/README.md#scenario-walkthrough) to see a localized
failure, a baseline comparison, an incompatible baseline, and both advisory and blocking
CI outcomes.

The collector reads only the files declared in the configuration. The analyzer replays
the resulting bundle without HTTP, DNS, browser, or arbitrary command execution.

See the [implementation guide](docs/phase3/README.md) for bundle, report, baseline,
policy, and exit-code details. Versioned contracts are under [`schemas/v1/`](schemas/v1/).
The checked-in policy example is
[`.docs-agent-readiness/policy.json`](.docs-agent-readiness/policy.json).

## Repository structure

The repository separates implementation, versioned contracts, deterministic fixtures,
tests, examples, and public documentation:

```text
docs/                    Public specifications and prototype documentation
src/                     Offline evidence, analysis, comparison, policy, and reports
schemas/v1/              Versioned JSON Schemas
fixtures/                Generic deterministic canaries and localization scenarios
tests/                   Unit, fixture, golden, replay, policy, and security tests
examples/minimal/        Minimal local collection example
.docs-agent-readiness/   Example trusted policy
.github/                 Contribution and CI configuration
```

The public distribution uses generalized examples and deterministic fixtures. Private
case-study evidence and captured artifacts are not included. Case-study implementation
details and thresholds are not toolkit defaults.

## AFDocs

[AFDocs](https://github.com/agent-ecosystem/afdocs) implements the
[Agent-Friendly Documentation Spec](https://github.com/agent-ecosystem/agent-docs-spec).
This toolkit does not replace or reimplement it.

The prototype imports a recorded AFDocs result as external evidence. It preserves the
external producer and version rather than relabeling external checks as toolkit-owned
findings. AFDocs results do not prove factual correctness, workflow completion, or
universal agent success.

## Security

The analyzer is network-free and treats imported content as untrusted data. The
implemented tests cover schema, filesystem, integrity, output sanitization, trusted
policy, and no-network boundaries. They do not establish the security of a future HTTP
collector or provide an operating-system sandbox.

Report vulnerabilities through the process in [`SECURITY.md`](SECURITY.md). Do not post
sensitive vulnerability details in a public issue.

## Documentation and roadmap

Use these documents for the technical model, product requirements, current boundaries,
contribution process, and planned direction:

- [Documentation index](docs/README.md)
- [Methodology](docs/agent-readiness/agent-readiness-methodology.md)
- [Product requirements](docs/agent-readiness/agent-readiness-tool-prd.md)
- [Rule catalog](docs/agent-readiness/agent-readiness-rule-catalog.md)
- [Decision log](docs/agent-readiness/agent-readiness-phase2-decision-log.md)
- [Practitioner validation protocol](docs/phase3/practitioner-validation-protocol.md)
- [Practitioner validation results](docs/phase3/practitioner-validation-results.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Contributing and support

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing a change. The current product
boundary deliberately excludes live acquisition, framework adapters, broad rule
expansion, AI or task evaluation, automatic fixes, and hosted monitoring.

Use [`SUPPORT.md`](SUPPORT.md) to choose the appropriate issue or support channel.

## Package and releases

The npm package is private and remains at version `0.0.0`. No public npm package,
release, or stable executable name is implied. See [`docs/releasing.md`](docs/releasing.md)
for the future manual pre-release process.

## License and repository

The toolkit is available under the MIT License in its canonical GitHub repository:

- Repository:
  [owans/docs-agent-readiness-toolkit](https://github.com/owans/docs-agent-readiness-toolkit)
- License: [MIT](LICENSE)
