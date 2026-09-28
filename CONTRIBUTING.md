# Contributing

Thank you for helping improve the Docs Agent Readiness Toolkit. The current repository
is an evidence and replay prototype. Practitioner validation for that slice is
complete with recorded caveats. Changes should strengthen the evidence and replay
model without expanding the product boundary prematurely.

## Development setup

Local development requires the supported Node.js runtime and locked dependencies.

Requirements:

- Node.js 22 or newer;
- npm and the committed lockfile.

```bash
npm ci
npm run check
npm audit
```

Use `npm run format` to format supported source and data files. `npm run check` verifies
formatting, lint, strict TypeScript, tests, documentation, and the build.

## Change expectations

Contributions must stay within the current prototype scope and preserve its safety
properties.

- Keep the analyzer network-free and deterministic.
- Do not execute repository code, builds, hooks, documentation examples, or dynamic
  plugins from the analyzer.
- Keep evidence modes, acquisition, trust, integrity, provenance, authenticity,
  freshness, identity, finding status, regression state, completeness, and policy
  effect distinct.
- Do not introduce framework-specific assumptions into core behavior.
- Keep AFDocs and other evaluators in an external namespace.
- Use generic, publishable examples and fixtures.
- Never add private research, Rootstock evidence, participant data, credentials, local
  paths, or internal workspace files.

Changes involving filesystem access, parsers, sanitization, policy, or future network
boundaries require focused security tests. Report a vulnerability through
[`SECURITY.md`](SECURITY.md), not a public issue.

## Contracts and compatibility

Schema, rule, identity, canonicalization, parser, evaluator, and baseline changes can
invalidate comparisons.

- Explain compatibility impact in the pull request.
- Update TypeScript contracts, JSON Schemas, tests, fixtures, and documentation
  together.
- Refresh golden files only after reviewing the semantic change.
- Do not reuse a rule ID or compatibility reason for different semantics.
- Add a changelog entry for notable user-facing changes.

## Documentation

Use direct, evidence-backed language. Do not claim production readiness, complete
security, universal agent success, live coverage, or that the product hypothesis is
proven. Practitioner validation for the evidence and replay prototype is
`PROTOCOL_COMPLETE`. The approved thresholds are met with the recorded blinding
caveat. The recorded results are not a production-readiness claim.

Local documentation links must resolve. Official external links that reject automated
clients may be documented rather than replaced when they are valid in a browser.

## Commits and pull requests

Submitted changes must remain reviewable, attributable to the human contributor, and
limited in scope.

- Use your own configured human Git identity.
- Do not use an AI or bot identity as author, committer, or co-author.
- Do not add generated-by or AI co-author trailers.
- Keep commits coherent and messages concise.
- Complete the pull request template, including public/private and compatibility
  checks.
- Do not include unrelated cleanup or deferred product capabilities.

Contributors remain responsible for all submitted work, including work created with
automated assistance. Describe material automated assistance in the pull request when
it affects review, while keeping authorship and accountability with the human
contributor.

## Releases

Maintainers control versions, tags, and releases. Do not publish the private npm
package. See [`docs/releasing.md`](docs/releasing.md) for the future manual process.
