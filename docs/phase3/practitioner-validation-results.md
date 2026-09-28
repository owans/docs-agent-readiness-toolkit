# Practitioner Validation Results

This document records the practitioner sessions run against the evidence and replay
prototype. It reports what participants did and said, then separates facilitator
inference and product recommendations from those observations.

Sessions are grouped into session sets. The first set is the pilot. A later set follows
in its own section and does not modify the pilot record.

## Status

Three pilot sessions were run with the three roles the protocol requires. Those sessions
covered only the minimal Quick Start example. A second set began after the pilot
remediation and stopped at a blocker. A third set then ran the full fixture walkthrough
with all three required roles. A fourth set re-ran the corrected walkthrough with all
three required roles after the reporting-layer and writer-facing fixes.

Current result: `PROTOCOL_COMPLETE`. The three required roles completed the reporting-fix
re-run. The approved thresholds are met with the recorded blinding caveat. This document
does not claim production readiness, prove the product hypothesis, or replace a
controlled comparison study.

## First session set: pilot

The pilot sessions and their outcomes are recorded in the sections that follow, through
to the pilot's product recommendations.

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

## Second session set: stopped at a blocker

This set began after the pilot remediation added runnable scenarios. It produced no task
outcomes, so it upgrades no success criterion.

| Participant | Role | Date | Duration | Quick Start completed | Walkthrough completed |
| --- | --- | --- | --- | --- | --- |
| P4 | Documentation engineer | 2026-09-27 | About 1 minute before the blocker | Yes | No |

### Observed progress

The participant completed the Quick Start and confirmed the pilot fixes: file output was
named on the command line, and no redundant standalone build step was required.

Reports were then generated successfully for `clean-mapping`, `source-defect`,
`build-defect`, `live-drift`, `asserted-provenance`, `external-defect`, and both the
regression baseline and regression current runs.

### Observed blocker

Attempting a Markdown comparison report returned `Unknown option: --markdown`. The
walkthrough documented only JSON output for `compare`, while the protocol asked for
Markdown-first evaluation and included a Markdown-only evidence-citation criterion. The
participant stopped rather than devising a workaround, as the protocol instructs.

### Tasks not evaluated

Because the session stopped before report evaluation, these produced no outcome:

- regression comparison inspection;
- incompatible-baseline execution;
- the advisory CI run;
- the blocking CI run;
- the ten-task evaluation;
- evidence-based diagnosis across all eight scenarios.

### Facilitator inference on the blocker

This section is interpretation, not observed session data.

The protocol and the CLI described different evaluation paths, and the participant was
correct to treat that as a blocker. A second defect sat behind the reported one: the
Markdown regression section printed state counts and `CHANGED` transitions but never the
compatibility reason, so `RULE_VERSION_CHANGED` could not be read from Markdown even
through `ci`. Protocol task 6 and the success criterion about incompatible baselines both
depend on that reason, so neither could have been assessed from Markdown as written.

### Corrections applied

`compare` now accepts `--markdown` and renders the current report with its regression
section. The regression section names the compared report identities, whether the
comparison was compatible, and the reason for every `INCOMPATIBLE` entry. The protocol
now names the three Markdown reports that cover its tasks, and the walkthrough passes
`--markdown` at both comparison steps.

## Third session set: full fixture rerun

This set ran after `compare --markdown` landed. All three required roles completed the
Quick Start and the full fixture walkthrough. Observed results stay in the sections
below. Facilitator inference and later corrections are labeled separately.

### Second-iteration participants

| Participant | Role | Date | Duration | Quick Start completed | Walkthrough completed |
| --- | --- | --- | --- | --- | --- |
| P5 | Technical writer working in docs as code | 2026-09-27 | About 28 minutes | Yes | Yes |
| P6 | Documentation engineer, five or more years | 2026-09-27 | About 2 minutes of command time | Yes | Yes |
| P7 | Senior platform engineer owning developer tooling and CI policy | 2026-09-27 | About 25 minutes including report reading | Yes | Yes |

No participant recording, employer repository content, or private environment
information was collected. Facilitator interventions during P5's diagnosis: none.

### Second-iteration prototype revision

P6 and P7 ran revision `5f5ecfc`. P5 identified the revision from the compatibility
block in generated canonical JSON. Those fields are not present in the Markdown
reports.

- report schema version `1.0`
- toolkit version `0.0.0`
- identity algorithm version `1.0.0`
- parser `evidence-bundle-parser@1.0.0`
- canonicalizer `json-canonicalize@3.0.1`
- rule set digest `sha256:0350791c2e89ae65009fca9c642cf41981752c5f188990c30a3d6d46b580385e`

P7 confirmed three independent replays of the same bundle produced byte-identical
canonical JSON.

### Writer fixture order

P5 read the public README, ran the documented Quick Start, then followed the scenario
walkthrough in this order.

1. Quick Start / `examples/minimal`
2. `clean-mapping`
3. `source-defect`
4. `build-defect`
5. `live-drift` analyze, then advisory `ci`
6. `asserted-provenance`
7. `external-defect`
8. `regression` baseline, current, `compare`, then blocking `ci`
9. `incompatible-baseline` `compare`

Diagnosis used the three Markdown reports first. Canonical JSON was opened only after
those answers were written, and only for the session-record revision fields.

### Writer understand answers

After the README, and before the walkthrough, P5 stated:

- The toolkit inspects already-collected documentation files and recorded captures. It
  writes a report, can compare two reports, and can apply a CI policy. It does not
  crawl a live site or run a documentation build.
- It is for writers, documentation engineers, and platform or DevEx engineers who need
  to know whether docs are usable by automated systems, not only by humans.
- The problem is false confidence: a page can look fine to a person while the defect
  sits in source, the generated build, a captured deployment, or an external evaluator
  result.
- The evidence is local source and build files the caller lists, imported recorded
  bytes including captured live content, and imported AFDocs 0.18.7 results.

### Second-iteration fixture coverage

| Material | Exercised |
| --- | --- |
| Clean explicit source-to-build mapping | Yes |
| Source-boundary defect | Yes |
| Build-boundary defect | Yes |
| Captured-live drift | Yes |
| Imported AFDocs failure | Yes |
| Compatible `CHANGED` regression | Yes |
| Incompatible baseline | Yes |
| Advisory and blocking CI on the same finding model | Yes |

P7 also ran two controlled cross-policy evaluations of the `regression-current` bundle
that the walkthrough did not document.

### Second-iteration observed task outcomes

The protocol defines ten tasks. Outcomes below record only what the three participants
produced.

| Task | Outcome |
| --- | --- |
| 1. Identify what failed and the affected target | Completed by all three from Markdown. P5 named `DART-OPS-001` FAIL on the source and build defects, `DART-OPS-002` FAIL on live drift, and `llms-txt-exists` FAIL under External evaluations. |
| 2. Identify the responsible evidence boundary | Completed by all three for SOURCE, BUILD, LIVE, and EXTERNAL. |
| 3. Point to the evidence establishing the deterministic fact | Completed from analyze Markdown by all three. P5 and P7 could not cite locations from `compare --markdown` because that renderer omitted locators. |
| 4. Separate deterministic fact from likely cause | Completed by all three. Labeling was reported as clear. |
| 5. State the lineage identity result | Completed by all three for `IDENTITY_ASSERTED` and `IDENTITY_UNVERIFIED`. Nothing in the eight scenarios reached `IDENTITY_ESTABLISHED`. |
| 6. Explain the baseline transition and policy effect | Completed for `CHANGED`, `UNCHANGED`, and `INCOMPATIBLE` from `compare` by all three. Advisory CI exited 0; blocking CI exited 1. No `NEW`, `RESOLVED`, or `EXTERNAL_CHECK_UNAVAILABLE` scenario was supplied. P5 could not join `CHANGED` hashes to finding headings. P7 could not explain the `ci` incompatible-baseline outcome from the Policy section. |
| 7. Choose the next safe remediation and validation action | Completed for internal findings. Weaker for the imported AFDocs failure, which has no check-specific recommended action. |
| 8. Explain whether the report proves deployed state or task success | Completed correctly by all three. Each stated that it proves neither. |
| 9. Replay the bundle offline and compare report identity | Completed. P5 re-analyzed `source-defect-bundle` to a new path and reproduced report ID `sha256:31d836ee31c8c0fe1e580e3448ac848910ee7ab019e926f2da236b654bd082f5`. P6 reproduced the source-defect report identity. P7 reproduced byte-identical canonical JSON across three runs. |
| 10. Distinguish imported evaluator output and target identity from authenticity | Completed by all three. P5 almost stopped at Findings `PASS: 1` before noticing External evaluations. P7 noted that headline finding counts hide the imported failure. |

### Writer diagnosis from Markdown

P5 answered the four defect boundaries from Markdown as follows.

Source defect: `DART-OPS-001` FAIL, boundary SOURCE. Build exists at
`BUILD:page/index.html`; mapped `source:page` is absent. Completeness: SOURCE
`UNAVAILABLE`, LIVE `NOT_REQUESTED`. Next: add the source file or fix the mapping, then
replay.

Build defect: same rule, boundary BUILD. Source exists at `SOURCE:docs/page.md`; mapped
build is absent. Next: inspect why the build omitted the page.

Live drift: `DART-OPS-002` FAIL, boundary LIVE. Different `build_sha256` and
`live_sha256`. Offline, no network. Next: verify the recorded deployment before
changing source.

External defect: Findings showed `PASS: 1`. The failure sat under External evaluations:
`llms-txt-exists: FAIL`, producer `afdocs 0.18.7`. P5 almost stopped at the PASS count.

Asserted provenance: `DART-OPS-003` PASS with authenticity `ASSERTED`, identity
`IDENTITY_UNVERIFIED`, and recommended action `No remediation required`. P5 would still
obtain a collected or imported capture before relying on the claim.

### Writer compare notes

Compatible regression: `CHANGED` `PASS` to `FAIL` and `PASS` to `UNAVAILABLE`; one
`UNCHANGED`; zero `RESOLVED` or `NEW`. Missing build evidence was not treated as
resolved. P5 would require a current `PASS` plus recaptured BUILD bytes before calling
it fixed.

Incompatible baseline: `Compatible: false`, `INCOMPATIBLE *: RULE_VERSION_CHANGED`,
zero new, resolved, or changed. The current findings in that same report were all
`PASS`. P5 did not read that as a successful comparison. The `*` was unexplained.

The `CHANGED` lines identified findings only by SHA-256, and those hashes do not appear
on the finding headings.

### Writer evidence and trust

A hash established byte integrity only. Authenticity stayed `UNVERIFIED` or `ASSERTED`.
A passing mapping was `IDENTITY_ASSERTED` (`USER_ASSERTED`), not established.
`UNAVAILABLE` versus `NOT_REQUESTED` was clear in the completeness table.

What the evidence did not establish: origin, freshness, live-site state, task success,
or that source actually produced the build.

Strongest overread for P5: `DART-OPS-003` `PASS` with `No remediation required` beside
`authenticity: ASSERTED` or `UNVERIFIED`. The fields are visible. The word `PASS` still
sounds like approval.

### Writer CI notes

Same evidence model, two policies: the live-drift FAIL stayed FAIL and CI exited 0
(`ADVISORY` / `ALLOWED`). Regression CI exited 1 (`BLOCKING` / `BLOCKED`). A finding is
the check result. A policy decision is whether that result, or a regression state,
fails CI.

P5 would know to investigate. P5 would not know which three items made `Blocking: 3`.

### Second-iteration success criteria

These rows do not close the protocol's 3-of-3 thresholds. The threshold table was
approved on 2026-09-27. Approval is not a claim that this set met those bars.

| Criterion | Result after this set |
| --- | --- |
| Participants correctly localize source, build, captured-live, and external defects | Pass for P5, P6, and P7 from Markdown alone. The walkthrough table names the expected boundary, so this is not a fully blinded result. |
| No participant treats a hash as proof of authenticity | Pass for all three, reinforced across all eight scenarios |
| Imported evaluator results remain distinguishable from internal findings | Pass with a counts caveat. All three kept the AFDocs failure outside internal findings. P5 almost stopped at Findings `PASS: 1`. P7 warned that `FAIL: 0` above a failing external check invites a scan-read error |
| Incompatible baselines are not read as new or resolved findings | Pass for `compare` for all three. Fail for `ci` on P7, who read `Effect: INFORMATIONAL`, `Blocking: 0`, `Exit code: 5`, and `Result: BLOCKED` as a contradictory Policy section |
| The report supplies enough evidence to reproduce the diagnosis offline | Pass for analyze Markdown and replay identity. Fail or partial for `compare --markdown`, which dropped locations, and for CI Markdown, which named `Blocking: 3` without listing the items |
| Terminology problems are documented and corrected before adding features | Partial. Pilot fact wording was fixed. The `DART-OPS-001` title still overclaimed. New wording issues were recorded, including `PASS` sounding like approval |

These results do not close practitioner validation. Two criteria failed on a documented
command path for at least one role.

### Second-iteration terminology problems

Participants raised wording and presentation problems that the sixth criterion requires
to be recorded.

- P7 found `Evidence mode` redundant with `Evidence boundary` and misleading when a
  SOURCE-boundary finding cited only BUILD evidence. P5 found `Evidence mode: LIVE` on
  an `EXTERNAL_EVALUATION` target confusing.
- Schema fields `evidence_mode` and `responsible_boundary` had no descriptions.
- The `Target:` label named the present evidence on a failure, so a source-boundary
  defect read as `Target: build:page`.
- The heading `DART-OPS-001: Explicit source-to-build identity` over a `PASS` at
  `IDENTITY_ASSERTED` still read as established identity. P2 raised this in the pilot.
- The `*` identifier on `INCOMPATIBLE` lines was undefined. P5 recorded
  `INCOMPATIBLE *: RULE_VERSION_CHANGED`.
- Headline finding counts omitted imported evaluator failures. P5 almost stopped at
  `PASS: 1`.
- Three identical `### DART-OPS-003: Evidence provenance and trust` headings broke
  anchors. P5 noted the scan depends on sub-identity.
- `CHANGED` lines identify findings only by SHA-256, which does not appear on finding
  headings.
- CI `Blocking: 3` does not name the three blocking results.
- `PASS` next to `authenticity: UNVERIFIED` or `ASSERTED`, plus `No remediation
  required`, remains the strongest overreading risk for P5.
- `DART-OPS-001` and `DART-OPS-003` still read as internal codes, not writer language.
- `Evidence boundary: none` on passing findings is clearer than `null`, but still
  reads like a missing field until the reader remembers the passing-finding note.

### Second-iteration missing evidence

P5 looked for information that the human-readable reports did not contain.

- A human-readable finding name on each `CHANGED` line.
- Evidence file locations in the compare Markdown.
- Which policy rule produced each of the three blocking CI results.
- A baseline example that shows `EXTERNAL_CHECK_UNAVAILABLE`.
- The compatibility / prototype revision block in Markdown.
- A locator more specific than `at afdocs` for the imported evaluator file.

### Second-iteration execution friction

Documented commands succeeded. `compare --markdown` worked for this set. Incompatible
compare exited 5. Advisory CI exited 0. Blocking CI exited 1. The following points
caused hesitation and are recorded as reported.

- P6 and P7 both found that the documented advisory and blocking CI runs used different
  bundles, so the walkthrough did not isolate policy as the one variable.
- `bundle create` printed a bare digest before the human-readable line.
- Five scenarios printed `Collected 1 evidence records`.
- Re-running into an existing path returned a raw `EEXIST` error instead of telling the
  reader to choose a new output path.
- `baseline create` existed in the CLI and was absent from the walkthrough.
- After `compare` exited 5, the Markdown named `Compatible: false` but not the exit
  code or the next action.
- The Policy section listed `Blocking: 3` without naming the three results.
- Scenario directory names such as `source-defect` reveal the expected boundary before
  diagnosis.
- P5 noted that `npm run check` runs the full test suite and took about 23 seconds
  before the example.
- `clean-mapping`, `asserted-provenance`, and `external-defect` appear in the
  walkthrough table without copy-paste commands. P5 reused the localize-a-failure
  pattern rather than stopping.

### Writer interpretation errors

- No hash was treated as authenticity or lineage.
- `UNAVAILABLE` was not treated as `RESOLVED`.
- `INCOMPATIBLE` was not treated as `NEW` or `RESOLVED`.
- The near-miss: the external-defect Findings count was almost read as a clean run
  before the External evaluations section was noticed.
- The walkthrough table disclosed the expected boundary, so localization accuracy is
  not a fully blinded result.

### Writer comments

Usability: analyze Markdown now shows status, boundary, locations, observed values, and
a next action. Hardest: opaque `CHANGED` hashes, `PASS` that still means unverified,
and unnamed blocking CI items. P5 hesitated at `asserted-provenance` and at the
external-defect PASS count.

Diagnosis: yes for what failed, where, why, and a reasonable next action on the four
defect boundaries.

Evidence: analyze Markdown was enough. P5 could separate observed facts, inferred
likely causes, and imported AFDocs rows. The toolkit still claims more than the
evidence when `PASS` says no remediation is required.

Regression and policy: finding, regression, and policy stayed separable. The five
regression states made sense. Missing evidence was not read as resolved.

Would P5 trust it: yes, to decide what to investigate. No, to decide that something is
fine or resolved.

P5's most important improvement: name the finding on every `CHANGED` / `INCOMPATIBLE`
line and every blocking CI result, in writer language, not only a hash or
`Blocking: 3`.

P5 stated that the documentation-engineer and DevEx sessions were still required
before the protocol could be treated as complete. That comment is recorded here as
said. Those sessions are P6 and P7 in this set.

### Threshold review

The proposed thresholds in
[`practitioner-validation-protocol.md`](practitioner-validation-protocol.md) were
reviewed by P5 and earlier by P6 and P7. The repository owner approved the table on
2026-09-27. That approval does not close any 3-of-3 measure for the recorded sessions.
P5 supplies one-role times to first correct diagnosis.

### Ranked follow-ups from the sessions

P7 ranked the follow-ups. P5's named-finding request is recorded with them. Deferred
items stay open and are not treated as implemented in this record.

1. Make the Policy section explain its own exit code, including exit 5 from baseline
   incompatibility.
2. Restore evidence locations and locator trust on `compare --markdown`.
3. Define or remove the `*` identifier on `INCOMPATIBLE` lines.
4. Note in the counts block that external evaluations are counted separately.
5. Collapse `Evidence mode` into `Evidence boundary` or describe both in the schema.
6. Document `baseline create`.
7. Switch the walkthrough CI runs to the same bundle under both policies.
8. Cosmetic sweep: pluralization, labeled bundle digest, unique `DART-OPS-003`
   headings, and an actionable existing-output message.
9. Name the finding on every `CHANGED` / `INCOMPATIBLE` line and every blocking CI
   result, in writer language, not only a hash or `Blocking: 3`.
10. Keep `PASS` from sounding like approval when authenticity is `UNVERIFIED` or
    `ASSERTED` and the recommended action is `No remediation required`.
11. Give `clean-mapping`, `asserted-provenance`, and `external-defect` the same
    copy-paste commands the other scenarios have.

Deferred and still open:

- scenarios that demonstrate `NEW`, `RESOLVED`, and `EXTERNAL_CHECK_UNAVAILABLE`;
- neutral scenario identifiers that do not reveal the expected boundary;
- check-specific remediation for imported AFDocs failures.

### Facilitator inference on the second iteration

This section is interpretation, not observed session data.

The three complete walkthroughs confirm that the diagnosis surface added after the
pilot is usable for the four defect boundaries the protocol names. The remaining
blockers were reporting and documentation defects, not evidence-model defects. The P4
blocker is closed for this set: `compare --markdown` ran, and `RULE_VERSION_CHANGED`
was readable without JSON.

P7 independently demonstrated the policy claim the walkthrough stated incorrectly: the
same `regression-current` bundle is `ADVISORY` with exit 0 under one trusted policy and
`BLOCKING` with exit 1 under the other.

The `ci` incompatible-baseline failure is a presentation bug in a shipped default. All
three committed policy files set `incompatible_baseline` to `ERROR`, so the first rule
set change in a real pipeline reaches `Effect: INFORMATIONAL` next to `Result: BLOCKED`.

P5 asked for the other two roles before treating the protocol as complete. Those
sessions already exist in this set as P6 and P7. Completeness of the three roles does
not close the protocol, because two criteria still failed on a documented command path
and the reporting-layer restatements below have not been re-run by practitioners.

The walkthrough table and the protocol are in tension. The protocol asks not to
explain the expected boundary in advance. The table does exactly that.

`DART-OPS-003` `PASS` remains a product-language problem more than a missing-field
problem. The fields are visible. The status word still does the work of approval.

### Second-iteration product recommendations

These recommendations follow from the sessions and are recorded for review rather than
as agreed scope.

1. Make the Policy section name the results and configured outcomes that produced its
   exit code.
2. Give `compare --markdown` locator parity with `analyze` and `ci`.
3. Pair one bundle with both trusted policies in the walkthrough and document
   `baseline create`.
4. Correct the terminology and cosmetic problems listed above without changing finding
   fingerprints.
5. Print the rule ID, target, and previous-to-current status on each `CHANGED` and
   `INCOMPATIBLE` Markdown line, not only a finding hash.
6. Keep `PASS` from implying approval when authenticity is `UNVERIFIED` or `ASSERTED`.
7. Give `clean-mapping`, `asserted-provenance`, and `external-defect` copy-paste
   commands.
8. Keep `NEW`, `RESOLVED`, `EXTERNAL_CHECK_UNAVAILABLE`, neutral identifiers, and
   AFDocs check-specific remediation as later work.

### Corrections applied after the second iteration

The reporting-layer change that follows this record addresses the in-scope items from
P6 and P7, and some of the overlap with P5. It does not close practitioner validation
and does not implement P5's remaining writer-facing requests.

- `evaluatePolicy` now records exit 4 and exit 5 in `reasons`, and the Policy section
  renders those reasons and names the exit-code cause.
- `compare` accepts an optional `--bundle` so Markdown comparisons can render evidence
  locations and locator trust.
- The completeness table uses a fixed canonical mode order.
- The walkthrough evaluates the single `regression-current` bundle against advisory and
  blocking trusted bases and documents `baseline create`.
- The redundant `Evidence mode` line is removed. Schema descriptions distinguish
  `evidence_mode` from `responsible_boundary`. `INCOMPATIBLE *` is labeled as the whole
  comparison. Finding counts note that imported evaluator results are counted
  separately. `Target:` is labeled as the declared mapping endpoint. `DART-OPS-001` is
  retitled so `IDENTITY_ASSERTED` is not read as established identity. `DART-OPS-003`
  headings include the sub-identity.
- `bundle create` labels the bundle digest, pluralizes the evidence-record count, and
  names an existing output path instead of surfacing a raw `EEXIST` error.

P5's request to name the finding on every `CHANGED` line and every blocking CI result
is now covered in the renderer and policy reasons. Passing findings no longer say
`No remediation required`. The walkthrough now includes copy-paste commands for
`clean-mapping`, `asserted-provenance`, and `external-defect`. Those restatements are
not a practitioner re-run.

After those corrections, the two criteria that failed in this set are re-stated as
code and documentation fixes only:

- incompatible baselines remain classified as `INCOMPATIBLE` with a named reason in
  `compare`, and `ci` now explains an exit 5 in the Policy section rather than printing
  `Blocking: 0` next to `Result: BLOCKED`;
- `compare --bundle --markdown` can now render the same locations and locator trust as
  `analyze` and `ci`.

Neither restatement is a practitioner re-run. Both criteria remain open until the
three required roles execute the corrected walkthrough.

## Fourth session set: reporting-fix re-run

This set was run after the reporting-layer and writer-facing fixes recorded above. It
does not modify the pilot, the blocked second set, or the second-iteration
three-role record.

### Fourth-set sessions

| Participant | Role | Date | Duration | Commit | Quick Start completed | Walkthrough completed |
| --- | --- | --- | --- | --- | --- | --- |
| P8 | Technical writer working in docs as code | 2026-09-27 | About 22 minutes | `86d954ba5868e68e9d8c612e1c07c342a51dd423` | Yes | Yes |
| P9 | Documentation engineer, five or more years | 2026-09-27 to 2026-09-28 | About 2 minutes of command time after reading the walkthrough | `5240261a92c50dbd94c4e384fa2a985688c9b84d` | Yes | Yes |
| P10 | DevEx and platform engineer owning developer tooling and CI policy | 2026-09-28 | About 20 minutes | `5240261a92c50dbd94c4e384fa2a985688c9b84d` | Yes | Yes |

No participant recording, employer repository content, or private environment
information was collected. Facilitator interventions during diagnosis: none. P10 also
ran an undocumented `ci` pairing to inspect the Policy-section exit-5 wording.

### Fourth-set prototype revision

P8 ran commit `86d954ba5868e68e9d8c612e1c07c342a51dd423`. P9 and P10 ran commit
`5240261a92c50dbd94c4e384fa2a985688c9b84d`. Both commits are the reporting-layer
revision. The compatibility block below was read from generated canonical JSON after
the Markdown answers were written. Those fields are not present in the Markdown
reports.

- report schema version `1.0`
- toolkit version `0.0.0`
- identity algorithm version `1.0.0`
- parser `evidence-bundle-parser@1.0.0`
- canonicalizer `json-canonicalize@3.0.1`
- rule set digest `sha256:0350791c2e89ae65009fca9c642cf41981752c5f188990c30a3d6d46b580385e`

### Fourth-set fixture order

The participants read the public README, ran the documented Quick Start to new output
paths, then followed the walkthrough in this order.

1. Quick Start / `examples/minimal`
2. `source-defect`, `build-defect`, `live-drift`
3. `clean-mapping`, `asserted-provenance`, `external-defect`
4. Regression baseline, current, `compare --bundle --markdown`
5. Incompatible baseline `compare --bundle --markdown` (exit 5)
6. The same `regression-current` bundle under `trusted-base-advisory` (exit 0) and
   `trusted-base` (exit 1)
7. Optional live-drift advisory CI (exit 0)
8. Optional `baseline create`

The walkthrough table still names the expected boundary. That remains a protocol
caveat: localization was not fully blinded.

Diagnosis used the three Markdown reports first. Canonical JSON was opened only for
session-record revision fields.

### Fourth-set understand answers

After the README, and before the walkthrough, the three participants stated the same
narrow model: the toolkit freezes named source, build, and recorded-live files into a
content-addressed bundle, analyzes them offline, compares compatible reports, and
applies a separately owned CI policy. It is for writers, documentation engineers, and
platform or DevEx engineers. The problem is false confidence when a page looks fine
while source, build, captured live, or an imported evaluator result are not the same
thing. The evidence is collected local files, imported or asserted recorded live
bytes, and recorded AFDocs 0.18.7 results kept outside internal findings.

P10 added that the setup surface is still a hand-written `collector.json`, and that
`RUNTIME_OBSERVATION` and `TASK_EVALUATION` exist in the model but never appear in the
shipped examples.

### Fourth-set fixture coverage

| Material | Exercised |
| --- | --- |
| Clean explicit source-to-build mapping | Yes |
| Source-boundary defect | Yes |
| Build-boundary defect | Yes |
| Captured-live drift | Yes |
| Imported AFDocs failure | Yes |
| Compatible `CHANGED` regression | Yes |
| Incompatible baseline | Yes |
| Advisory and blocking CI on the same bundle | Yes |
| `baseline create` | Yes |
| `ci` against an incompatible baseline | P10 extra probe only. Not in the walkthrough. |

### Fourth-set task outcomes

The protocol defines ten tasks. Outcomes below record only what the three participants
produced from Markdown.

| Task | Outcome |
| --- | --- |
| 1. Identify what failed and the affected target | Completed by all three. Source and build: `DART-OPS-001` FAIL on declared target `build:page`. Live: `DART-OPS-002` FAIL. External: `llms-txt-exists` FAIL under External evaluations. Findings `FAIL: 0` was not read as the imported check passing. |
| 2. Identify the responsible evidence boundary | Completed by all three for SOURCE, BUILD, LIVE, and EXTERNAL. The walkthrough table and directory names disclosed the expected boundary. |
| 3. Point to the evidence establishing the deterministic fact | Completed by all three from analyze and from `compare --bundle`. Citations included evidence ID, locator, locator trust, and digest. The imported AFDocs locator remained `at afdocs` with trust `USER_ASSERTED`. |
| 4. Separate deterministic fact from likely cause | Completed by all three. Facts named missing mapped evidence or differing SHA-256 values. Likely causes stayed labeled inferred. |
| 5. State the lineage identity result | Completed by all three for `IDENTITY_ASSERTED` and `IDENTITY_UNVERIFIED`. Nothing in the eight scenarios reached `IDENTITY_ESTABLISHED` or `IDENTITY_INCOMPATIBLE` on a mapping. |
| 6. Explain the baseline transition and policy effect | Completed for `CHANGED` (`PASS` to `FAIL`, `PASS` to `UNAVAILABLE`), `UNCHANGED`, and `INCOMPATIBLE` / `RULE_VERSION_CHANGED`. Advisory CI exited 0; blocking CI exited 1. No `NEW`, `RESOLVED`, or `EXTERNAL_CHECK_UNAVAILABLE` fixture was supplied. P8 and P9 did not run `ci` against an incompatible baseline. P10 confirmed the Policy-section exit-5 wording on an extra probe. |
| 7. Choose the next safe remediation and validation action | Completed for internal findings. Weak for the imported AFDocs row, which has no check-specific recommended action. |
| 8. Explain whether the report proves deployed state or task success | Completed correctly by all three. Each stated that it proves neither. |
| 9. Replay the bundle offline and compare report identity | Completed. Re-analyzing the source-defect bundle reproduced report ID `sha256:32d307788b7e335f4073e8526d42b430d45223c428618340d0ddf320337e9fba`. The same `regression-current` bundle kept `sha256:0fba755ccd7ee15866ecab0dc33f7b5c6e3cb44d520ff279acf80af2ab03f10d` under both policies. |
| 10. Distinguish imported evaluator output and target identity from authenticity | Completed by all three. AFDocs stayed under External evaluations. Integrity `MATCHED` was not read as authenticity. |

P8 recorded times to first correct diagnosis of about 60 seconds for source, 40 seconds
for build, and 45 seconds for live. P9 and P10 recorded overall session time and did
not supply per-fixture diagnosis times. There is no numeric time bar.

### Fourth-set handoff confirmation

| Confirmation | P8 | P9 | P10 |
| --- | --- | --- | --- |
| Localize SOURCE, BUILD, LIVE, and imported AFDocs from Markdown | Pass | Pass, with the naming caveat | Pass, with the naming caveat |
| A hash is not proof of authenticity or lineage | Pass | Pass | Pass |
| External AFDocs rows stay outside Findings counts; `FAIL: 0` is not the imported check | Pass | Pass | Pass |
| Incompatible compare is `INCOMPATIBLE` / `RULE_VERSION_CHANGED`, not new or resolved | Pass | Pass | Pass |
| `ci` against an incompatible baseline names exit 5 | Not run. The walkthrough does not document that command. | Not run. The walkthrough does not document that command. | Pass on an extra probe. The documented incompatible step is compare-only. |
| `compare --bundle --markdown` shows file locations and locator trust | Pass | Pass | Pass |
| `CHANGED` lines name the finding in words | Pass | Pass | Pass |
| Blocking CI names the results, not only `Blocking: 3` | Pass | Pass | Pass |
| `PASS` next to `authenticity: UNVERIFIED` or `ASSERTED` does not read as "this is fine" | Pass | Pass | Pass |
| Replay of the same bundle produces the same report identity | Pass | Pass | Pass |

### Fourth-set threshold outcome

The repository owner approved the threshold table on 2026-09-27. These rows are the
reporting-fix re-run against that bar.

| Measure | Approved threshold | This set |
| --- | --- | --- |
| Correct responsible-boundary localization | 3 of 3 participants per defect fixture | Met. All three localized SOURCE, BUILD, LIVE, and EXTERNAL. The measure is not blinded: directory names and the walkthrough table disclose the expected boundary. |
| Incorrect authenticity or lineage claims | 0 across all participants | Met. 0. |
| Imported evaluator results read as internal findings | 0 across all participants | Met. 0. Findings `FAIL: 0` was not treated as a passing imported check. |
| Incompatible baseline read as new or resolved | 0 across all participants | Met. 0 on `compare`. P10 also did not read the extra-probe `ci` exit 5 as new or resolved. |
| Correct evidence citation from the three Markdown reports alone | 3 of 3 participants | Met when `--bundle` is passed to `compare`. |
| Time to first correct diagnosis | Recorded per fixture, no numeric threshold | Recorded for P8. P9 and P10 recorded session duration only. |
| Unresolved terminology problems carried over from a prior session | 0 before further feature work | Met. The second-iteration blockers did not recur. New residuals are recorded below and are not carried-over blockers. |

### Fourth-set diagnosis

Source defect: `DART-OPS-001` FAIL, boundary SOURCE. Build exists at
`BUILD:page/index.html`; mapped `source:page` is absent. Completeness: SOURCE
`UNAVAILABLE`, LIVE `NOT_REQUESTED`. Next: add the source file or fix the mapping,
then replay.

Build defect: same rule, boundary BUILD. Source exists at `SOURCE:docs/page.md`;
mapped build is absent. Next: inspect why the build omitted the page.

Live drift: `DART-OPS-002` FAIL, boundary LIVE. Different `build_sha256` and
`live_sha256`. Offline. Next: verify the recorded deployment before changing source.

External defect: Findings `FAIL: 0` with a note that imported results are counted
separately. The failure sat under External evaluations: `llms-txt-exists: FAIL`,
producer `afdocs 0.18.7`. Next: treat it as a recorded external result. There is still
no check-specific remediation.

Asserted provenance: `DART-OPS-003` PASS with authenticity `ASSERTED` and recommended
action that the status is not an approval. All three would still obtain a collected or
imported capture before relying on the claim.

P9 paused once on source-defect because the declared target is `build:page` while the
missing side is SOURCE. The explainer under Findings resolved that without opening
JSON. P10 no longer misread that label as "the build is the defect."

### Fourth-set compare and policy

Compatible regression: `CHANGED` `PASS` to `FAIL` and `PASS` to `UNAVAILABLE`; one
`UNCHANGED`; zero `RESOLVED` or `NEW`. Missing BUILD evidence was not treated as
resolved. `compare --bundle` printed evidence locations and locator trust. P9 and P10
noted that the unchanged finding is counted but not named; P9 inferred it is
`DART-OPS-003` `source:page`.

Incompatible baseline: `Compatible: false`, `INCOMPATIBLE (whole comparison):
RULE_VERSION_CHANGED`. The current findings in that report were all PASS. Nobody read
that as a successful baseline comparison or as a new or resolved finding.

Advisory and blocking CI used the same `regression-current` bundle and produced the
same report identity. Advisory: effect `ADVISORY`, exit 0, `Result: ALLOWED`, with
three named advisory reasons. Blocking: effect `BLOCKING`, exit 1, `Result: BLOCKED
(3 blocking policy results)`, with the same three items named as `BLOCKING`. A finding
is the check result. A regression is a transition. A policy decision is whether that
result fails CI.

`baseline create` succeeded. P10 recorded that it wrote `sha256:ea04f995…`, matching
the regression baseline `report_id`. P9 and P10 noted that the command prints a digest
and no "wrote" sentence.

P10's extra probe paired the live-drift bundle with the regression trusted base and
read this Policy section: `Effect: INFORMATIONAL`, `Blocking: 0`, `Exit code: 5`,
`EXIT 5: baseline comparison is incompatible and policy sets incompatible_baseline to
ERROR`, and `Result: BLOCKED`. That is the previous contradiction, fixed. Pairing the
incompatible bundle with the regression trusted base exited 0, because that evidence
matches the reviewed baseline. The confirmation the handoff asked for is not reachable
from the copy-paste walkthrough.

### Fourth-set terminology and leftover friction

Second-iteration blockers that this revision targeted did not recur: contradictory
Policy section, `INCOMPATIBLE *`, hash-only `CHANGED` lines, unnamed `Blocking: 3`,
`No remediation required` beside PASS, `Evidence mode` versus boundary, unlabeled
bundle digest, raw `EEXIST`, and missing copy-paste for three scenarios.

New residuals recorded in this set:

- Scenario directory names still disclose the expected boundary.
- `DART-OPS-001` and `DART-OPS-003` still read as internal codes.
- The imported AFDocs locator remains `at afdocs`.
- Imported AFDocs failures still have no check-specific next action.
- The walkthrough does not include `ci` against an incompatible baseline.
- No fixture demonstrated `NEW`, `RESOLVED`, or `EXTERNAL_CHECK_UNAVAILABLE`.
- The unchanged finding is counted but not named.
- `baseline create` prints a bare digest.
- Policy reason lines escape the arrow as `PASS -\> FAIL`.

### Fourth-set interpretation errors

- No hash was treated as authenticity or lineage.
- `UNAVAILABLE` was not treated as `RESOLVED`.
- `INCOMPATIBLE` was not treated as `NEW` or `RESOLVED`.
- Findings `FAIL: 0` was not treated as a passing imported AFDocs check.
- Localization was aided by scenario names.
- P9 hesitated at declared target `build:page` on a SOURCE-boundary failure until the
  explainer was read.
- P10 hesitated after incompatible compare because the report names the reason but not
  an owner next action.

### Fourth-set participant comments

All three would trust the report to decide what to investigate. None would trust a
`PASS` or missing evidence, by itself, to decide that something is resolved, authentic,
or ready for an agent.

P8: the reporting fixes landed for this role. The most important remaining improvement
is a check-specific next action for imported AFDocs failures, or moving that row where
it cannot be missed if the Findings disclaimer is skipped.

P9: Policy is isolated correctly. The most important remaining improvement is neutral
scenario identifiers, so localization can be measured without hinting. The remaining
gap is protocol validity, not the Markdown diagnosis of the defects that were shown.

P10: second-iteration reporting blockers are closed on the documented paths. The most
important remaining improvement is a copy-paste `ci` pairing that produces exit 5 so
an on-call engineer can see the Policy reason without inventing a cross-scenario
trusted-base combination.

### Fourth-set facilitator inference

This section is interpretation, not observed session data.

The two criteria that failed after the second iteration now pass on the documented
Markdown paths. `compare --bundle` restores locations. `CHANGED` lines and blocking CI
reasons name the finding. Incompatible compare is readable as
`INCOMPATIBLE` / `RULE_VERSION_CHANGED`. Nobody treated a hash as authenticity, an
imported evaluator as an internal finding, or an incompatible baseline as new or
resolved.

Policy-section exit 5 was confirmed by P10 on a pairing that is not in the walkthrough.
P8 and P9 correctly treated that handoff item as not run. That is a documentation
hole, not a remaining reporting bug. The owner close-out that follows this record adds
a shipped `ci` pairing under `incompatible-baseline/trusted-base`. Practitioners did
not run that exact command.

The approved thresholds are met with the blinding caveat. The protocol as written is
complete for the evidence and replay prototype. Completeness does not mean production
ready, does not prove the product hypothesis, and does not replace the controlled
comparison study. Task 6 remains only partly answerable because no fixture shows
`NEW`, `RESOLVED`, or `EXTERNAL_CHECK_UNAVAILABLE`.

Remaining residuals are later work, not another practitioner loop: those missing
fixtures, neutral scenario identifiers, AFDocs check-specific remediation, naming the
unchanged finding, labeling `baseline create`, and unescaping the Policy arrow.

### Fourth-set product recommendations

These recommendations follow from the sessions and are recorded for review rather than
as agreed scope.

1. Add a documented `ci` walkthrough step that produces exit 5 against a shipped
   trusted base. That is the owner close-out in this change. It is not a new
   practitioner re-run.
2. Keep `NEW`, `RESOLVED`, `EXTERNAL_CHECK_UNAVAILABLE`, neutral scenario identifiers,
   and AFDocs check-specific remediation as later work.
3. Do not treat this close as authorization for live acquisition, adapters, AI, or
   more rules.

### Fourth-set session records

- Anonymized participant IDs and roles: P8 technical writer; P9 documentation
  engineer; P10 DevEx and platform engineer.
- Dates and revisions: P8 on 2026-09-27 at `86d954ba5868e68e9d8c612e1c07c342a51dd423`;
  P9 on 2026-09-27 to 2026-09-28 and P10 on 2026-09-28 at
  `5240261a92c50dbd94c4e384fa2a985688c9b84d`.
- Fixture order: listed above.
- Task-level outcomes and timings: listed above.
- Interpretation errors: listed above.
- Participant comments: listed above.
- Facilitator interventions: none during diagnosis.
- Missing evidence: `NEW`, `RESOLVED`, `EXTERNAL_CHECK_UNAVAILABLE`, and a documented
  incompatible-baseline `ci` path at session time.
- Follow-up changes: none applied during the sessions. The walkthrough `ci` pairing
  is an owner close-out after this record.

## Protocol close

The repository owner approved the threshold table on 2026-09-27. The reporting-fix
re-run used that table as the bar. Current result: `PROTOCOL_COMPLETE`.

That result means the protocol as written was executed by the three required roles,
the previously failed criteria now pass on the documented Markdown paths, and the
approved thresholds are met with the blinding caveat. It does not mean production
ready, security clean, or that the product hypothesis is proven.

Later work remains: `NEW`, `RESOLVED`, and `EXTERNAL_CHECK_UNAVAILABLE` scenarios,
neutral scenario identifiers, AFDocs check-specific remediation, and the controlled
comparison study. Live acquisition remains blocked by its security gate. Do not edit
this session set or earlier records when those later items are added.

## Owner residual close-out

After the protocol close, the owner addressed four fourth-set residuals that did not
require another practitioner loop. Session records above are unchanged.

- Compare Markdown now names each `UNCHANGED` finding the same way it names `CHANGED`.
- `baseline create` prints the output path and a labeled report identity.
- Policy Markdown restores the toolkit ` -> ` arrow after sanitization, matching
  compare lines.
- An incompatible comparison now states the owner next action: do not treat it as a
  regression; review the named reason; then stop, or create a new reviewed baseline
  after explicit approval.

This close-out does not claim production readiness.
