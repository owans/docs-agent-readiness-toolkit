# Roadmap

This roadmap records maturity and gates. It is not a release-date commitment.

## Phase 1: Historical reconstruction

Status: complete.

The project reconstructed a documentation-readiness case study and separated its
general lessons from framework-specific implementation details.

## Phase 2: Generalisation

Status: complete.

- reusable engineering methodology;
- toolkit product requirements;
- rule and evidence contracts;
- architecture and product decisions.

## Phase 3: Toolkit implementation and CI

Status: current.

- Evidence kernel: complete for the prototype.
- Deterministic offline replay: complete for the prototype.
- Cross-mode canaries and localization: complete for the prototype.
- Baseline comparison and CI policy: complete for the prototype.
- Recorded AFDocs import: complete for the evidenced 0.18.7 shape.
- Practitioner validation: next, status `NOT_RUN`.
- Bounded live acquisition: gated and not implemented.
- Framework adapters: future and demand-led.

## Phase 4: Continuous maintenance

Status: future.

Potential work depends on practitioner evidence and an explicit scope decision. The
roadmap does not authorize hosted monitoring, telemetry, broad rule expansion, AI,
task evaluation, automatic fixes, live acquisition, or framework adapters.

## Current gate

Run real practitioner sessions with:

1. a technical writer working in docs as code;
2. a documentation engineer responsible for generation or deployment;
3. a DevEx or platform engineer responsible for CI policy.

Do not represent simulated sessions as human validation. Do not begin live acquisition
until its security matrix is executable and approved.
