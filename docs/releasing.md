# Release Process

This document records the current release status and the owner-controlled pre-release
procedure.

## Current state

The package is private, versioned `0.0.0`, and has no public release, tag, or npm
distribution. Practitioner validation has completed a first pilot only, and four of its
six success criteria remain unevaluated. A stable release is not appropriate at the
current maturity level.

Release automation is deliberately deferred until the project has a demonstrated
release cadence and a reviewed distribution model.

## Future manual pre-release

If the owner approves a public prototype release, use a semantic pre-release such as
`v0.1.0-alpha.1`.

1. Confirm the public file boundary and package contents.
2. Update the package version and curate [`CHANGELOG.md`](../CHANGELOG.md).
3. Run `npm ci`, `npm run check`, and `npm audit`.
4. Review security, schema, baseline, and compatibility changes.
5. Create a signed release commit with the human owner's identity.
6. Create a signed or annotated immutable tag according to repository policy.
7. Push the reviewed commit and tag.
8. Have the owner create a GitHub pre-release and review its claims.
9. Verify any published assets, checksums, and provenance.

Do not reuse or move a published tag. Correct a defective release with a new version.
Do not publish to npm until the public package name, CLI interface, package contents,
and trusted publishing process are independently approved.

## Required pre-release limitations

Release notes for the current prototype must state that:

- practitioner validation has completed a first pilot only, with four of six success
  criteria unevaluated;
- live acquisition remains blocked;
- framework adapters and broad readiness rules are deferred;
- AI and task evaluation are deferred;
- the release demonstrates evidence, replay, baseline, policy, and recorded external
  evaluator import;
- it is not a universal agent-readiness audit or a production-readiness claim.
