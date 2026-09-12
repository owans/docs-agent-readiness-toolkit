# Docs Agent Readiness Toolkit Agent Guide

This guide defines the repository boundaries and contribution safeguards for agents.

## Scope

This guide applies to contributors and coding agents working in the public repository.
Read [`README.md`](README.md), [`CONTRIBUTING.md`](CONTRIBUTING.md), and the
[Phase 3 guide](docs/phase3/README.md) before changing implementation behavior.

The current implementation is a pre-validation evidence, replay, baseline, and policy
prototype. Do not expand it into live acquisition, framework adapters, broad rules, AI
or task evaluation, automatic fixes, telemetry, or hosted monitoring without an
explicitly reviewed scope change.

## Public and private material

Public contributions must preserve the boundary between publishable toolkit material
and private evidence.

- Never add private research, non-public project material, captured deployment material,
  participant data, local agent workspaces, credentials, or private Rootstock evidence.
- Rootstock may be discussed as a historical case study. Do not treat its framework,
  plugins, paths, thresholds, or evaluator behavior as neutral defaults.
- Do not publish absolute local paths, environment contents, tokens, cookies, keys, or
  service-account files.
- Do not modify frozen historical evidence to make a generic quality gate pass.

## Evidence and compatibility

Changes must preserve the evidence model and its explicit compatibility semantics.

- Keep `SOURCE`, `BUILD`, `LIVE`, `RUNTIME_OBSERVATION`, and `TASK_EVALUATION`
  distinct.
- Keep acquisition, trust, integrity, provenance, authenticity, freshness, and identity
  distinct. A hash does not establish authenticity.
- Require explicit source/build and build/recorded-live mappings. Do not infer
  framework lineage.
- Keep deterministic facts separate from inferred causes and remediation advice.
- Preserve the five regression states and compatibility reasons. Do not redefine
  baseline semantics casually.
- Keep external evaluator checks in their producer namespace. AFDocs remains an
  optional recorded-result import and is not executed by the toolkit.

## Security boundaries

Implementation work must maintain the prototype's offline and non-executing security
boundary.

- The analyzer must remain network-free and must not execute repository code, build
  commands, hooks, examples, or dynamic plugins.
- Treat all imported Markdown, HTML, JSON, paths, and report fields as untrusted.
- Do not weaken path, schema, size, integrity, sanitization, trusted-policy, or
  no-network controls.
- Live acquisition remains blocked by
  [`docs/phase3/live-acquisition-security-gate.md`](docs/phase3/live-acquisition-security-gate.md).

## Changes and validation

Validation should match the affected contracts and remain reproducible from public
material.

- Update schemas, tests, fixtures, goldens, documentation, and changelog entries when a
  user-visible contract changes.
- Add only generic, publishable fixtures. Never make a public test depend on private
  evidence.
- Run `npm run check` and `npm audit` before handing off a change.
- Run Markdown, local-link, workflow-YAML, and `git diff --check` validation when
  applicable.
- Do not hide new failures behind exclusions intended for private or frozen material.

## Git and attribution

Repository history must retain human ownership and require explicit authorization for
publication actions.

- Commits must use the human contributor's configured identity.
- Do not use an AI or bot identity as author, committer, or co-author.
- Do not add AI attribution trailers or generated-by notices.
- Do not create pull requests, tags, releases, or pushes automatically unless the human
  owner explicitly authorizes that action.
- Never rewrite public history or force-push without explicit owner review.

When implementation reality contradicts this guide, update the guide in the same
reviewed change.
