# Pull Request

Use this template to explain the change, its validation, and its effect on toolkit
boundaries.

## Summary

Summarize the change and its user-visible outcome.

## Motivation and scope

Explain why the change is needed and what remains outside its scope.

## Validation

Record the checks completed for this change and leave inapplicable checks unselected.

- [ ] `npm run check`
- [ ] `npm audit`
- [ ] Documentation and local links checked when applicable
- [ ] Security-focused tests added or updated when applicable

## Impact review

Confirm the change preserves the repository's compatibility, security, and publication
boundaries.

- [ ] I documented user-visible behavior in `CHANGELOG.md`, or this change has no changelog impact.
- [ ] I reviewed schema, rule, identity, parser, canonicalizer, evaluator, baseline, and regression compatibility.
- [ ] I reviewed network, arbitrary-execution, filesystem, parser, output, and supply-chain impact.
- [ ] I did not add live acquisition or weaken its security gate.
- [ ] I did not mix external evaluator results with toolkit-owned findings.
- [ ] I preserved the distinction between integrity, provenance, authenticity, freshness, and identity.
- [ ] I added no private research, Rootstock evidence, secrets, internal paths, or participant data.

## Evidence semantics

Describe any changed evidence mode, trust label, identity relationship, completeness
state, finding status, or regression behavior. Write `None` when not applicable.
