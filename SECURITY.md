# Security Policy

This policy describes the prototype's support status, reporting process, and security
boundaries.

## Supported versions

The project has no public software release and no formally supported version line. The
current `main` branch is a pre-validation prototype. Security fixes are evaluated
against the current public source until a version-support policy is established.

## Reporting a vulnerability

Use GitHub
[private vulnerability reporting](https://github.com/owans/docs-agent-readiness-toolkit/security/advisories/new).
Do not disclose sensitive vulnerability details in a public issue, discussion, pull
request, or commit.

Include:

- the affected revision and component;
- reproduction steps or a minimal proof of concept;
- expected and observed behavior;
- likely impact;
- suggested mitigation, if known.

The maintainer will acknowledge, investigate, coordinate remediation, and agree on
disclosure with the reporter. No fixed response or resolution time is promised.

## Security-sensitive areas

Security review should focus on the trust boundaries and input surfaces listed below.

- evidence and configuration parsing;
- filesystem path resolution and symlink handling;
- evidence integrity and content addressing;
- output and terminal sanitization;
- trusted-base policy and baseline loading;
- external evaluator import;
- CI permissions and dependency supply chain;
- the blocked future live-acquisition boundary.

The analyzer must remain network-free and must not execute repository code, build
commands, hooks, examples, or dynamic plugins.

## Coordinated disclosure

Please allow time for investigation and a fix before public disclosure. If a report is
accepted, the maintainer will coordinate the advisory and credit according to the
reporter's preference.

## Out of scope

The following are not vulnerabilities by themselves:

- the absence of a live collector or framework adapter;
- documentation-quality disagreement without a security impact;
- an unavailable external evaluator;
- a hash not proving authenticity, which is an explicit model limitation;
- attacks requiring a previously compromised local account with unrestricted access,
  unless they cross a documented trust boundary.

These exclusions do not prevent reporting a concrete security impact.

## Current limitations

The implemented offline controls do not establish future HTTP collector security. The
[live-acquisition security gate](docs/phase3/live-acquisition-security-gate.md) remains
blocking. The prototype is not an operating-system sandbox, and secret detection or
redaction cannot guarantee complete removal of sensitive data.
