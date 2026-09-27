# Practitioner Validation Results

This document records the first practitioner sessions run against the evidence and
replay prototype. It reports what participants did and said, then separates facilitator
inference and product recommendations from those observations.

## Status

Three sessions were run with the three roles the protocol requires. The sessions covered
only the minimal Quick Start example, so the full fixture set defined in
[`practitioner-validation-protocol.md`](practitioner-validation-protocol.md) was not
exercised.

Current result: `PILOT_COMPLETE`. The full protocol remains unexecuted, four of the six
success criteria remain `NOT_EVALUATED`, and this document is not evidence that the
prototype passed practitioner validation.

## Sessions

Each participant read the public README, ran the documented Quick Start, and then
answered the protocol's questions from the generated output.

| Participant | Role | Date | Duration | Quick Start completed |
| --- | --- | --- | --- | --- |
| P1 | Technical writer working in docs as code | 2026-09-27 | 1 minute 28 seconds | Yes |
| P2 | Senior DevEx and platform engineer owning CI policy | 2026-09-27 | About 2 minutes | Yes |
| P3 | Documentation engineer owning generation and deployment | 2026-09-27 | About 47 seconds | Yes |

No participant recording, employer repository content, or private environment
information was collected.

## Prototype revision

The revision under test is identified by the compatibility block the participants
produced rather than by a local path, so the run can be reproduced from the report
alone.

- report schema version `1.0`
- toolkit version `0.0.0`
- identity algorithm version `1.0.0`
- parser `evidence-bundle-parser@1.0.0`
- canonicalizer `json-canonicalize@3.0.1`
- rule set digest `sha256:0350791c2e89ae65009fca9c642cf41981752c5f188990c30a3d6d46b580385e`

## Fixture coverage

The protocol names seven materials. Only one was reachable through documented commands,
because the remaining fixtures exist as test scenarios rather than runnable collector
configurations.

| Material | Exercised |
| --- | --- |
| Clean explicit source-to-build mapping | Yes |
| Source-boundary defect | No |
| Build-boundary defect | No |
| Captured-live drift | No |
| Imported AFDocs failure | No |
| Compatible `CHANGED` regression | No |
| Incompatible baseline | No |

## Observed task outcomes

The protocol defines ten tasks. Outcomes below record only what participants produced
during the session.

| Task | Outcome |
| --- | --- |
| 1. Identify what failed and the affected target | Not applicable. The example contained no failure. All three named the three passing findings and their targets correctly. |
| 2. Identify the responsible evidence boundary | Not evaluated. No boundary was responsible. |
| 3. Point to the evidence establishing the deterministic fact | Completed by all three, but only after opening the canonical JSON, the bundle manifest, and the collector configuration. |
| 4. Separate deterministic fact from likely cause | Not evaluated. Passing findings carry no likely cause. |
| 5. State the lineage identity result | Completed correctly by all three. Each identified the mapping as `IDENTITY_ASSERTED` with `USER_ASSERTED` trust, and individual evidence as `IDENTITY_UNVERIFIED`. |
| 6. Explain the baseline transition and policy effect | Not evaluated. The Quick Start produced no baseline comparison and no policy result. |
| 7. Choose the next safe remediation and validation action | Completed. All three proposed verifying authenticity, freshness, and actual build lineage before relying on the build. |
| 8. Explain whether the report proves deployed state or task success | Completed correctly by all three. Each stated that it proves neither. |
| 9. Replay the bundle offline and compare report identity | Not evaluated. The walkthrough stops after a single analysis. |
| 10. Distinguish imported evaluator output and target identity from authenticity | Partially completed. The identity and authenticity distinction was stated correctly. No external import was present to distinguish. |

## Success criteria outcome

The protocol lists six criteria. Two produced a result, one produced a split result, and
three could not be assessed with the material participants could reach.

| Criterion | Result |
| --- | --- |
| Participants correctly localize source, build, captured-live, and external defects | `NOT_EVALUATED` |
| No participant treats a hash as proof of authenticity | Pass in all three sessions |
| Imported evaluator results remain distinguishable from internal findings | `NOT_EVALUATED` |
| Incompatible baselines are not read as new or resolved findings | `NOT_EVALUATED` |
| The report supplies enough evidence to reproduce the diagnosis offline | Pass for canonical JSON, fail for Markdown |
| Terminology problems are documented and corrected before adding features | Documented here, correction outstanding |

## Terminology and interpretation problems

Participants raised specific wording and presentation problems. These are recorded
because the sixth success criterion requires their correction before feature work.

- The Markdown report presented only evidence completeness and status counts, so
  participants could not identify rules, targets, observed values, or next actions from
  it.
- A `PASS` reported next to `authenticity: UNVERIFIED` and `freshness: UNKNOWN` was
  identified by all three as the strongest overreading risk in the output.
- P2 noted that the finding title `Explicit source-to-build identity` sounds stronger
  than its `IDENTITY_ASSERTED` result.
- P3 noted that the fact text `Explicit mapping mapping:getting-started` repeats the
  word mapping.
- P3 read `responsible_boundary: null` and an empty `likely_causes` on a passing finding
  as missing information rather than as a deliberate absence.
- P1 observed that three passing findings could suggest more confidence than this narrow
  example supports.

## Evidence participants expected but could not find

Each participant looked for information that the human-readable report did not contain.

- File locations for the reported evidence. The logical paths exist in the bundle
  manifest, but not in the report.
- Observed and expected values per finding.
- Evidence trust properties alongside a passing result.
- A baseline comparison and any regression state.
- A policy decision and its CI consequence.

## Execution friction

All documented commands succeeded. The following points caused hesitation and are
recorded as reported.

- `npm run check` already ends in a build, and the Quick Start then asks for
  `npm run build` again. All three participants noticed this.
- Bundle creation prints only a digest.
- Analysis with file output prints nothing, so participants were unsure whether it had
  succeeded and what to do next.
- The Quick Start stops after analysis, so P2 and P3 were unsure whether comparison and
  policy steps were expected.
- Runs produced only ignored output under `.artifacts`. No tracked file changed.

## Facilitator inference

This section is interpretation, not observed session data.

The three sessions converged on the same narrow test because the Quick Start was the only
runnable path, and it is the single material in the protocol that contains no defect.
That is a gap in the protocol's materials rather than participant error.

The report presentation problem is broader than the shallow example. The renderer emits
per-finding detail only for findings that do not pass, and even then it omits observed
and expected values and the evidence trust properties. A failing example would therefore
still have produced an incomplete diagnosis surface.

The most durable positive result is the authenticity criterion. Every participant
refused to treat a digest as proof of origin and correctly separated integrity,
provenance, authenticity, and freshness. That distinction held in the canonical JSON
without facilitator prompting.

## Product recommendations

These recommendations follow from the sessions and are recorded for review rather than
as agreed scope.

1. Make the existing defect fixtures runnable through documented commands so the full
   protocol can be executed as written.
2. Render every finding in Markdown with its target, location, observed and expected
   values, and evidence trust properties, including for passing findings.
3. Extend the documented walkthrough through baseline creation, comparison, and a policy
   decision that shows both advisory and blocking outcomes.
4. Remove the duplicated build step, confirm file output on the command line, and
   correct the wording problems listed above.
5. Document why a passing finding carries no responsible boundary and no likely cause.

## Next round

The protocol defers numeric thresholds until a pilot establishes a baseline. This pilot
provides that baseline, so proposed thresholds can now be drafted for owner approval and
remain `STAKEHOLDER_REQUIRED` until approved.

Re-run the full protocol with the complete fixture set and the same three roles after the
recorded terminology and reporting problems are corrected. The controlled comparison
study described in the protocol remains future work.
