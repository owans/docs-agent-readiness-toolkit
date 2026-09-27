# Practitioner Validation Protocol

This protocol defines how practitioners will evaluate the prototype's evidence,
localization, and replay claims.

## Status

This protocol defines practitioner validation for the evidence/replay prototype. A first
pilot has been run and is recorded in
[`practitioner-validation-results.md`](practitioner-validation-results.md). The full
fixture set was not exercised, and acceptance thresholds remain
`STAKEHOLDER_REQUIRED`.

The product hypothesis is:

> A documentation engineer can localize and act on a source, build, captured
> deployment, or external-evaluator defect faster and with less false confidence than
> when using an evaluator result plus existing build tooling alone.

The protocol does not assume that the hypothesis is true.

## Participants

Recruit at least one participant from each group:

1. Technical writer who works in a docs-as-code repository.
2. Documentation engineer who owns generation or deployment.
3. DevEx or platform engineer who owns CI policy.

Record role and relevant experience. Do not collect employer-confidential repository
content. Obtain consent before recording a session or publishing anonymized results.

## Materials

Use the committed fixture set:

- source-boundary defect;
- build-boundary defect;
- captured-live drift;
- imported AFDocs failure;
- compatible `CHANGED` regression from `PASS` to `FAIL`;
- incompatible baseline;
- clean explicit source-to-build mapping.

Give participants the concise Markdown report first. Make canonical JSON and fixture
files available on request. Do not explain the expected boundary in advance.

## Tasks

Ask each participant to:

1. Identify what failed and the affected target.
2. Identify the responsible evidence boundary.
3. Point to the evidence that establishes the deterministic fact.
4. Separate the deterministic fact from the likely cause.
5. State whether source-to-build or build-to-live lineage is
   `IDENTITY_ESTABLISHED`, `IDENTITY_ASSERTED`, `IDENTITY_UNVERIFIED`, or
   `IDENTITY_INCOMPATIBLE`.
6. Explain the baseline transition, including unavailable external-check evidence, and
   the policy effect.
7. Choose the next safe remediation and validation action.
8. Explain whether the report proves deployed state or task success.
9. Replay the supplied bundle offline and compare its canonical report identity.
10. Distinguish imported AFDocs output from toolkit-collected evidence, and target
    identity from evidence authenticity.

## Measures

Record:

- task completion;
- correct responsible-boundary localization;
- correct evidence citation;
- time to first correct diagnosis;
- time to identify the likely cause;
- time to choose a valid next action;
- time to validate the correction;
- incorrect authenticity or lineage claims;
- confusion between finding status, regression state, and policy effect;
- confusion between unavailable and not-requested evidence;
- terminology questions;
- evidence participants expected but could not find;
- whether offline replay changed confidence in the result.

Do not convert these measures into a readiness score.

## Comparison

For a later controlled study, give equivalent defects to a comparison group using the
recorded AFDocs result and ordinary build output without the toolkit report. Compare
localization accuracy and time-to-correct-action. Control for participant experience and
fixture order.

## Success criteria

Prototype validation can support further investment only if:

- participants correctly localize source, build, captured-live, and external defects;
- no participant treats a hash as proof of authenticity after reading the report;
- imported evaluator results remain distinguishable from internal findings;
- incompatible baselines are not interpreted as new or resolved findings;
- the report supplies enough evidence to reproduce the diagnosis offline;
- terminology problems are documented and corrected before adding features.

Numeric thresholds must be set after pilot sessions establish a baseline. Until then,
all criteria requiring human performance remain `STAKEHOLDER_REQUIRED`.

### Proposed thresholds

The first pilot established a baseline, so the following thresholds are proposed for
owner approval. They are not agreed acceptance criteria and remain
`STAKEHOLDER_REQUIRED` until approved and recorded as such.

| Measure | Proposed threshold |
| --- | --- |
| Correct responsible-boundary localization | 3 of 3 participants per defect fixture |
| Incorrect authenticity or lineage claims | 0 across all participants |
| Imported evaluator results read as internal findings | 0 across all participants |
| Incompatible baseline read as new or resolved | 0 across all participants |
| Correct evidence citation from the Markdown report alone | 3 of 3 participants |
| Time to first correct diagnosis | Recorded per fixture, no threshold until a second pilot |
| Unresolved terminology problems at session end | 0 before further feature work |

Do not convert an approved threshold set into a readiness score.

## Session record

For each session, record:

- anonymized participant ID and role;
- date and prototype revision;
- fixture order;
- task-level outcomes and timings;
- interpretation errors;
- participant comments;
- facilitator interventions;
- missing evidence;
- follow-up changes.

Store no credentials, private source, or full environment information.

## Reporting

Publish an anonymized synthesis only after consent and review. Separate observed session
results from facilitator inference and product recommendations.

Current result: `PILOT_COMPLETE`. The first pilot is recorded in
[`practitioner-validation-results.md`](practitioner-validation-results.md). Four of the
six success criteria remain `NOT_EVALUATED`, so this document and that record are not
evidence that the prototype passed practitioner validation.
