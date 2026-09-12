# Docs Agent Readiness Toolkit: Agent Readiness Engineering Methodology

## Document status

This Phase 2 methodology for `docs-agent-readiness-toolkit` defines a reusable,
framework-neutral way to assess and maintain documentation for machine consumers. It
uses the Rootstock DevPortal journey as a case study, not as a universal architecture.

Evidence labels use `CONFIRMED`, `PARTIALLY_CONFIRMED`, `UNVERIFIED`,
`INTERNAL_CONTEXT`, `FUTURE`, `OUT_OF_SCOPE`, and `SOURCE_REQUIRED`.

The frozen history records Rootstock checkpoints of 71/100 with 14 of 22 checks passed,
90/100 with 17 of 23 passed, and 100/100 with 22 of 23 passed, zero warnings, and zero
failures. `CONFIRMED`: the final result does not mean all 23 checks passed.
`UNVERIFIED`: the exact Fern presentation of the skipped or omitted 23rd check is not
available in the copied evidence. The score proves only the named evaluator result at
that checkpoint.

## 1. Purpose

The method helps a documentation team move from an existing documentation system to a measured and maintained agent-readiness practice:

`existing documentation -> baseline -> diagnosis -> remediation -> validation -> CI -> regression tracking`

The recurring product loop is:

`DISCOVER -> DIAGNOSE -> FIX -> VALIDATE -> ENFORCE -> TRACK`

The method applies to repository source, generated static or server artifacts, and deployed sites. Teams can adopt one evidence mode at a time, but they must not transfer claims between modes.

## 2. Definitions

**Agent readiness** is the degree to which a defined documentation surface can be
discovered, accessed, retrieved, represented, structurally consumed, and maintained for
specified machine consumers.

**Target** is a repository path, build directory, URL, route set, locale, or version in
scope for a run.

**Rule** is a versioned deterministic test with declared inputs, applicability,
evidence, result status, remediation, and validation.

**Finding** is the result of applying one rule to one normalized target in one
environment.

**Evidence mode** identifies where an observation came from: source, build, live,
runtime observation, or task evaluation.

**Evidence bundle** is a content-addressed capture of bounded inputs and collector
metadata. Deterministic analysis operates on the bundle and can replay it without
refetching mutable live content.

**Baseline** is a content-addressed result set selected for compatible comparison with
a current run. Local storage does not make it tamper-proof. Signed CI attestations may
provide a stronger trust level.

**Evidence trust** records how a value was obtained: `OBSERVED_BY_COLLECTOR`,
`DETERMINISTICALLY_DERIVED`, `USER_ASSERTED`, or `EXTERNALLY_ATTESTED`.

**External evaluator** is a separately versioned product, such as AFDocs, whose raw
results and scores remain external evidence.

### Frozen evidence vocabulary

Evidence mode and acquisition are independent:

- Modes are `SOURCE`, `BUILD`, `LIVE`, `RUNTIME_OBSERVATION`, and
  `TASK_EVALUATION`.
- Acquisition kinds are `COLLECTED`, `IMPORTED`, `ASSERTED`, and `ATTESTED`.

`COLLECTED` means the toolkit acquired the bytes. `IMPORTED` means another producer
created them and the toolkit imported them. `ASSERTED` means the caller supplied the
content or identity claim. `ATTESTED` means an explicit external authenticity
mechanism accompanies the evidence. A hash alone is not attestation.

Trust labels apply to individual values. A local import can make the imported bytes
`OBSERVED_BY_COLLECTOR` while the claim that AFDocs produced them remains
`USER_ASSERTED`. A successfully checked attestation may make a specific origin claim
`EXTERNALLY_ATTESTED`. Analyzer outputs are
`DETERMINISTICALLY_DERIVED`.

Every evidence item keeps four properties separate:

- **Integrity:** whether captured bytes still match their content hash.
- **Provenance:** where the evidence claims to come from and how it was acquired.
- **Authenticity:** whether an explicit trust mechanism supports the claimed origin.
- **Freshness:** when the content was observed or generated and whose clock supplied
  that time.

No `sha256` or `verified: true` field establishes authenticity by itself.

### Identity mapping

The core compares identities it can establish. It does not manufacture lineage.

Generic source-to-build and build-to-recorded-live mappings are supplied explicitly.
The core validates referenced evidence and dimensions, but does not infer framework
relationships from similar paths. Identity results are
`IDENTITY_ESTABLISHED`, `IDENTITY_ASSERTED`, `IDENTITY_UNVERIFIED`, or
`IDENTITY_INCOMPATIBLE`. A caller-supplied deployment ID remains asserted unless an
independent attestation establishes it.

### Canonical implementation sequence

- **MVP-0:** source and build evidence bundles, deterministic replay, provenance and
  trust, canonical findings, one explicit source-to-build join, expected-live identity
  representation without live acquisition, JSON, and golden fixtures.
- **MVP-1:** baselines, compatibility, normalized diff, five regression states, trusted
  policy, exit codes, and a concise PR-oriented report.
- **Stage 2:** recorded external evaluator import, initially AFDocs.
- **Stage 3:** bounded live acquisition after its security gate passes.
- **Later:** framework adapters, task evaluation, advisory AI, and broader integrations.

MVP-0 and MVP-1 form the core prototype. The authorized Phase 3 slice also includes
Stage 2 recorded AFDocs import. It does not include a crawler.

## 3. What agent readiness means

Agent readiness covers technical properties that influence machine consumption:

- machine consumers can locate the documentation and its intended entry points;
- allowed consumers can fetch useful representations without an unexpected barrier;
- responses use parseable formats and preserve important source meaning;
- structure supports bounded extraction and retrieval;
- indexes, routes, sitemaps, representations, and deployment identity remain aligned;
- teams can detect, explain, validate, and prevent regressions.

Readiness is contextual. A pass applies to a declared target, mode, configuration, rule
version, time, and environment. It is not a timeless certification.

## 4. What agent readiness does not mean

Agent readiness is not the same as content quality.

By default, this method does not certify that documentation is:

- factually correct;
- technically or product correct;
- well written for every audience;
- complete for every user goal;
- useful to every human;
- successfully retrieved by every model;
- cited correctly;
- sufficient for an agent to complete a task;
- safe instructions for autonomous execution.

Those claims require separate evidence. Semantic review, subject-matter approval,
runtime observation, and task evaluation may complement readiness checks, but they must
not be inferred from a technical readiness score.

## 5. Readiness layers

The model has eight layers. A failure in an earlier layer can prevent evidence at a
later layer, but a pass in an earlier layer does not prove later success.

| Layer | Question | Representative evidence |
| --- | --- | --- |
| Discoverability | Can a consumer find the relevant documentation and entry points? | Index, sitemap, link relations, discoverable routes |
| Access | Can the intended consumer retrieve it under the declared policy? | HTTP status, auth behavior, robots policy, alternative access |
| Representation | Is a suitable machine-readable form available? | Markdown route, negotiation, content type, generated artifact |
| Structural usability | Does that form preserve navigable content and code structure? | Headings, order, fences, serialized components |
| Retrieval efficiency | Can useful content be obtained within bounded fetch and context budgets? | Payload measurements, content-start position, split topology |
| Integrity and consistency | Do related artifacts and routes agree? | Link resolution, parity, canonical, locale and version consistency |
| Operational readiness | Can a team reproduce, enforce, and track the state? | Provenance, CI result, baseline diff, deployment identity |
| Task usefulness | Can a defined consumer complete a defined task with the documentation? | Task fixture, model/runtime version, trace, outcome |

No single score proves all eight layers.

## 6. Assessment workflow

Use the same loop for a first audit and ongoing maintenance:

1. Define consumers, targets, evidence modes, exclusions, budgets, and policy.
2. Inventory documentation surfaces and deployment variants.
3. Acquire bounded source, build, live, runtime, or evaluator inputs into an evidence
   bundle.
4. Analyze the captured bundle deterministically and retain the collector record.
5. Capture a baseline before broad remediation.
6. Group symptoms by likely shared cause without presenting the cause as fact.
7. Prioritize blockers in discovery, access, and representation before cosmetic work.
8. Apply the smallest reviewable remediation.
9. Acquire fresh compatible evidence and re-run analysis.
10. Validate build and live state separately when deployment is involved.
11. Establish a reviewed baseline and CI policy.
12. Track finding-level regressions and operational drift.
13. Use optional external evaluators and task tests as separate evidence sources.

## 7. Baseline establishment

A baseline is not simply the latest score. It is a selected result set with enough
provenance to support a future comparison.

Record:

- baseline identifier and creation time;
- source revision and repository state when source mode is used;
- build identifier and relevant artifact digests in build mode;
- deployment URL, deployment identifier, and crawl time in live mode;
- toolkit, rule, configuration, report-schema, and adapter versions;
- evaluator name, version, raw result digest, and evaluation time for external data;
- target inventory, locale, version, sampling strategy, and exclusions;
- human approval or replacement reason.

Do not compare incompatible modes as if they were the same target. Do not silently
migrate a baseline when a rule, threshold, formula, evaluator, or site topology changes.
For 0.x evaluators, compatibility requires the exact evaluator version unless a
reviewed mapping proves equivalence. Record the specification version, adapter mapping
version, rule implementation digest, parser and canonicalizer versions, rule-specific
configuration, target inventory identity, and evidence mode.

## 8. Discovery

Discovery assessment asks how a consumer learns what documentation exists.

Inspect:

- `llms.txt` and other declared machine-readable entry points;
- sitemap declarations and sitemap indexes;
- links from pages to discovery resources;
- HTTP link relations and equivalent page metadata;
- navigation and generated index pages where they form part of the published set;
- locale and version entry points;
- robots policy as an access signal, not as proof of indexing behavior.

Existence is only the first test. Parseability, scope, URL resolution, coverage,
freshness, size, and representation preference are independent properties.

## 9. Access

Access assessment verifies whether the intended consumer can retrieve the target.

Check public status behavior, redirects, authentication gates, bot restrictions,
content-type behavior, and documented alternative access. Authentication is not
automatically a defect. An unexpected or undisclosed barrier is a finding. A deliberate
gate can be `NOT_APPLICABLE` or pass a policy rule only when its applicability and
alternative-access requirements are explicit.

Never authenticate a crawler unless the user explicitly configures a safe credential
path in a future implementation. Reports must not echo credentials.

## 10. Machine representation

A machine representation may be source Markdown, generated Markdown, negotiated
Markdown, structured API descriptions, or another declared format. The method does not
mandate Markdown for every system.

For each public page in scope, establish:

- whether a machine representation exists;
- how it is discovered;
- whether its URL and content type are stable;
- whether it represents the intended canonical page;
- whether it preserves important content;
- whether locale and version semantics are retained.

A source `.md` file does not prove a deployed Markdown route. A negotiated response
does not prove that the source file is preserved unchanged.

## 11. Structural consumption

Structural checks determine whether a parser can recover the intended information
hierarchy.

Assess heading order, content order, code fences, lists, tables, repeated navigation,
tabs, accordions, filters, card grids, generated indexes, and other interactive
components. For each component, choose a declared strategy:

1. Serialize all meaningful states.
2. Replace the component with a concise machine representation.
3. Split the content into linked pages.
4. Exclude human-only chrome while retaining the underlying information.
5. Mark the target unavailable when no faithful representation exists.

Exclusion must not hide unique content merely to pass parity or size checks.

## 12. Retrieval efficiency

Retrieval efficiency measures the representation a consumer actually receives.

Track distinct measurements for:

- wire-compressed and decompressed response bytes;
- raw HTML bytes;
- rendered or extracted HTML text size;
- Markdown bytes or characters;
- agent-consumed representation size;
- location of the first meaningful content;
- number and depth of requests needed to retrieve a topic.

Do not collapse these into one generic size value. Budgets depend on consumer limits,
transport, parsing, and site shape. Default thresholds require independent evidence.

## 13. URL integrity

URL checks cover:

- broken links and fragments;
- redirect chain length and destination;
- soft 404 behavior;
- canonical identity;
- unexpected host changes;
- route stability;
- trailing-slash and suffix behavior;
- locale and version preservation;
- stale or environment-specific hosts in generated artifacts.

Follow redirects only within the configured security policy. Validate every redirect
target before connection.

## 14. Index and sitemap integrity

Indexes and sitemaps describe overlapping but not always identical sets.

Normalize URLs before comparison, then report:

- URLs in the declared documentation set;
- URLs in each index or sitemap;
- missing, extra, duplicate, redirected, and excluded URLs;
- exclusion reason and policy owner;
- locale and version dimensions;
- observed coverage as a measurement, not an automatic pass threshold.

Coverage policy must be configurable. Rootstock's 95 percent policy is case-study
evidence, not a neutral default.

## 15. Component serialization

Interactive source components create a common source-to-representation failure.
Assessment should compare semantic content, not raw markup.

For a component type:

1. Identify visible and conditional states in source or rendered output.
2. Declare which states must appear in the machine representation.
3. Compare normalized headings, prose, code, links, and key values.
4. Report missing or duplicated semantic blocks.
5. Name the component only when source or adapter evidence establishes it.
6. Recommend framework-specific serialization through an adapter, not the core.

A parity symptom is a deterministic fact. "The Tabs serializer failed" is a likely
cause unless source/build evidence proves it.

## 16. Authentication and accessibility

The method distinguishes intended access policy from accidental access loss.

Record whether content is public, gated, partially gated, or available through an
approved alternative. A live unauthenticated crawl can prove only what that client
observed. It cannot prove behavior for all networks, identities, bot user agents, or
regions.

Accessibility for machine consumers does not replace human accessibility conformance.
The toolkit should not claim WCAG compliance unless a separate evaluator provides that
evidence.

## 17. Operational readiness and observability

Operational readiness requires reproducible evidence over time.

Store content-addressed run snapshots rather than overwrite one current score. Keep:

- rule and measurement results;
- status, severity, target, and evidence mode;
- observed and expected values;
- timestamps and environment;
- source, build, deployment, configuration, and artifact identities;
- unavailable evidence and collection errors;
- external raw results plus normalization records;
- baseline comparison and compatibility decisions.

Unavailable must remain unavailable. It must never become a pass through normalization.
For every provenance value, record whether it was observed, derived, user asserted, or
externally attested. Metadata completeness is not authenticity.

## 18. Source, build, and live validation

The three primary evidence modes answer different questions.

| Mode | Can establish | Cannot establish alone |
| --- | --- | --- |
| Source | Files, configuration, declared routes, component use, intended generation | Generated output, deployed behavior, task success |
| Build | Emitted files, sizes, links within artifacts, generated representations | Production routing, headers, caches, auth, task success |
| Live | Responses observed during a bounded crawl, redirects, headers, public content | Source revision without provenance, full runtime behavior, task success |
| Runtime observation | What a named consumer fetched or did in a named environment | Universal consumer behavior or correctness |
| Task evaluation | Outcome for a defined task, agent, tools, model, and fixture | General documentation quality or all-agent success |

Rules must declare one required mode or a defined cross-mode join. A cross-mode finding
must retain the individual observations used to derive it.

Live acquisition is time-bound and mutable. It is not deterministic merely because the
collector is deterministic. The reproducible unit is offline analysis of the same
content-addressed evidence bundle.

## 19. Deployment validation

After a deploy:

1. Identify the expected source revision and build.
2. Obtain deployment identity from a trusted deployment signal where available.
3. Fetch a bounded set of high-value routes and discovery artifacts.
4. Compare artifact digests or stable content measurements where possible.
5. Inspect headers, content type, redirect behavior, and cache signals.
6. Distinguish a stale deployment from a failed source or build change.
7. Record when deployment identity cannot be proven.

A merge is not deployment evidence. A successful build is not production evidence.

## 20. Evidence capture

Evidence must be bound to observable inputs.

Each evidence item should include:

- evidence type and mode;
- target and normalized identity;
- observation or measurement;
- collection timestamp;
- collector and rule version;
- content digest where safe and useful;
- source revision, build, and deployment references where available;
- bounded excerpt or location, with secret redaction;
- retrieval error if evidence could not be collected.

A field such as `verified: true` is an assertion, not proof. Reports should minimize
source snippets by default and state that secret redaction is best effort.
User-supplied revisions, build IDs, deployment IDs, and timestamps remain
`USER_ASSERTED` unless the collector observes or an external trust boundary attests
them.

## 21. Remediation

Every actionable rule should present three separate statements:

**DETERMINISTIC FACT:** What the rule observed and how.

**LIKELY CAUSE:** One or more bounded hypotheses, each tied to available source, build,
or framework evidence.

**RECOMMENDED FIX:** A reviewable action, expected outcome, validation step, and
regression test suggestion.

Prioritize remediation in this order:

1. blocked discovery or access;
2. missing or incorrect representations;
3. broken URL and index integrity;
4. lost component content and malformed structure;
5. retrieval-budget problems;
6. operational and provenance gaps;
7. optional semantic or task evaluation.

Automatic mutation is not part of the default method. Future fix modes may create an
explicit local patch, but never silently edit files or production.

## 22. Before-and-after measurement

Use the same target, mode, exact 0.x evaluator version, specification version, adapter
mapping version, rule implementation digest, parser and canonicalizer versions,
rule-specific configuration, and sampling method when measuring a fix. If any changes,
classify the comparison as incompatible unless a reviewed migration proves equivalent
semantics.

Compare:

- individual finding transitions;
- measurements and target-set changes;
- evidence availability;
- rule and evaluator version changes;
- source, build, and deployment identity.

Do not use a composite score as the only before-and-after measure.

Run-level evidence completeness is separate from findings and scoring. Each requested
mode is `COMPLETE`, `PARTIAL`, `UNAVAILABLE`, or `NOT_REQUESTED`. Zero findings and
zero failures never imply complete evidence. CI policy can distinguish a complete
non-blocking run, an incomplete non-blocking run, a blocking finding, and unavailable
required evidence.

## 23. Regression prevention

Normalize current and baseline findings by stable fingerprint, then classify:

- `NEW`: current finding has no compatible baseline identity;
- `RESOLVED`: a prior issue has an explicit compatible current `PASS`;
- `CHANGED`: same identity with a materially different status or measurement;
- `UNCHANGED`: same identity and equivalent result;
- `INCOMPATIBLE`: required comparison inputs or semantics differ.

`CHANGED` records `previous_status` and `current_status`. Human reports may render
`PASS -> FAIL`, but that phrase is not a separate machine state. Target removal, rule
removal, skipped evidence, and unavailable evidence must not be misclassified as
resolved.

Compatibility metadata reports the actual changed dimension. Parser, canonicalizer,
and identity-algorithm changes use `PARSER_VERSION_CHANGED`,
`CANONICALIZER_VERSION_CHANGED`, and `IDENTITY_ALGORITHM_CHANGED` respectively. One
reason must not stand in for another dimension.

## 24. CI enforcement

CI policy is separate from finding severity.

- `BLOCKING`: selected findings or regressions produce a nonzero policy exit.
- `ADVISORY`: reported but do not fail the job.
- `INFORMATIONAL`: retained for evidence or trend analysis.

Run source checks before build and build checks after generation. After Stage 3
approval, run live checks only against an explicitly allowed preview or deployed
target. On untrusted pull requests,
load policy and baseline from the trusted base revision, require separate approval for
policy changes, and disable network and external evaluator execution. After Stage 3
approval, run live checks post-deploy or on a trusted schedule. Emit stable JSON and a concise human report.
Optional PR annotations must sanitize paths, URLs, control characters, and source
snippets.

An unavailable external evaluator must not fail CI unless the project explicitly marks
that evaluator as required. Configuration or tool errors must use a distinct exit path
from policy failures.

## 25. External evaluator use

External evaluators add independent or ecosystem-standard signals.

For each run, preserve:

- evaluator name and version;
- evaluator timestamp and target;
- raw result or content digest;
- raw check IDs, statuses, and score;
- adapter version;
- normalized mappings and any information loss;
- availability or execution error.

Do not merge an AFDocs or Fern score into a toolkit score. Do not convert evaluator
unavailability into pass. For 0.x evaluators, pin the exact version when using results
in a baseline.

External checks remain separate from toolkit findings. When a baseline external check
has no corresponding current imported observation, classify that check comparison as
`INCOMPATIBLE` with `EXTERNAL_CHECK_UNAVAILABLE`. The missing observation cannot prove
resolution.

## 26. Limitations

Deterministic checks can produce false positives when applicability is incomplete.
Sampling can miss rare page defects. Live crawls observe one network and time. Parity
algorithms approximate semantic equivalence. Secret redaction cannot guarantee removal
of every sensitive value. Robots declarations do not prove crawler behavior. A safe
network design reduces risk but does not make hostile content trustworthy.

Human review remains required for policy, exceptions, remediation, and claims about
content correctness.

## 27. Recommended operating model

Assign clear ownership:

- Technical writers own source intent, content structure, exceptions, and remediation
  review.
- Documentation engineers own build representations, adapters, and artifact validation.
- Platform owners own deployment identity, routing, cache, and access behavior.
- CI owners own policy placement, credentials boundaries, and result retention.
- Product and support stakeholders define task evaluations separately.

The default writer view should show new findings on owned pages, the observed fact, one
safe next action, and one validation command. Platform owners, not writers, configure
evidence modes, network policy, rule packs, and baseline compatibility.

Use a risk-based cadence:

- source checks on documentation changes;
- build checks after generation;
- after Stage 3 approval, targeted live checks on previews;
- after Stage 3 approval, bounded production checks after deployment and on a schedule;
- baseline review when rules, thresholds, evaluators, or site topology change;
- task evaluation for a small set of defined user outcomes, outside the deterministic
  readiness gate unless independently approved.

## Phase 3 prototype canaries

The prototype uses exactly six acceptance fixtures:

1. Source page present and mapped build artifact absent. The result localizes
   source-to-build drift at the build boundary.
2. Build representation A and captured live representation B. Offline replay reports
   build-to-live drift without HTTP acquisition.
3. Source and build paths differ but an explicit mapping references both. Identity is
   valid for comparison, remains `IDENTITY_ASSERTED`, and the finding passes.
4. A caller asserts deployment ID `abc123`. Acquisition is `ASSERTED`, trust is
   `USER_ASSERTED`, and lineage remains `IDENTITY_UNVERIFIED`.
5. A compatible baseline is `PASS` and current is `FAIL`. Regression is `CHANGED`,
   previous and current statuses are retained, and blocking policy exits nonzero.
6. A required version or configuration dimension differs. Regression is
   `INCOMPATIBLE`, never `NEW` or `RESOLVED`.

Additional seeded fixtures localize defects to source, build, captured live/deployment,
or imported external-evaluator evidence. Acceptance requires the correct boundary and
evidence references, fact/inference separation, preserved uncertainty, correct
regression state, and enough information for offline reproduction.

Identity status describes a declared relationship between targets. Authenticity
describes the strength of evidence's claimed origin. DART-OPS-001 and DART-OPS-002 own
relationship findings. DART-OPS-003 reports evidence properties without manufacturing
lineage and therefore leaves its required `identity_status` as
`IDENTITY_UNVERIFIED`.

## Security gate before live acquisition

The prototype uses local collectors, imported/asserted recorded evidence, and an offline
analyzer. The analyzer never needs network access and never executes repository code,
hooks, examples, build commands, or dynamic adapters.

Stage 3 remains blocked until an executable and reviewed matrix covers SSRF, private
and non-routable addresses, metadata endpoints, redirect validation, DNS rebinding,
IPv4/IPv6 edge cases, request and response limits, decompression abuse, recursion,
malformed parsers, hostile sitemap content, filesystem escape, output injection, and
execution boundaries. The future HTTP collector collects evidence safely. It does not
analyze readiness.

## Rootstock implementation generalisation

This table separates historical implementation from reusable engineering principles
and states whether standardization is justified.

| Rootstock implementation | Generalized principle | Optional pattern | Toolkit implication | Standardization |
| --- | --- | --- | --- | --- |
| Docusaurus `docusaurus-plugin-llms` plus custom post-build logic | Discovery indexes are generated artifacts that need independent validation | Generator plugin followed by deterministic normalization | Inspect declared generator in an adapter; validate output in the core | Standardize the evidence contract, not the plugin |
| 49K Markdown trim | Agent representations need explicit consumer budgets | Trim, split, summarize, or exclude human-only chrome | Measure distinct payloads; make budget project policy | Do not standardize 49K |
| 50K `llms.txt` guard | Discovery indexes need bounded fetch size | CI size budget | Expose a configurable measurement and policy, not a universal 50K default | Do not standardize 50K |
| 95 percent sitemap coverage | Published sets and discovery indexes must be compared | Coverage threshold with documented exclusions | Report set differences; let projects choose policy | Standardize set evidence, not 95 percent |
| Vercel middleware and rewrites | Deployed representation routing needs live validation | Edge content negotiation | Future collector captures HTTP; offline core analyzes it | Standardize observable HTTP behavior only |
| Markdown source and locale plugins | Source representation must preserve locale and version semantics | Generator-specific export plugin | Adapters inspect configuration; core validates emitted routes | Standardize identity dimensions, not plugins |
| Custom MDX serializer | Interactive components need a deliberate machine representation | AST serialization per component | Detect parity symptoms; adapters identify component causes | Standardize outcomes, not component code |
| Page-specific content-start and fence fixes | Systemic tooling does not remove every page-level defect | Focused source edits after global fixes | Group findings, then retain target-level remediation | Standardize finding and validation records |
| RPC hub splitting | Large references can preserve human detail while offering bounded machine paths | Compact hub plus linked reference parts | Recommend topology changes without deleting source content | Keep topology optional |
| Post-build transformations | Generator output may require deterministic finalization | Rewrite links and emit generated hubs | Validate both preconditions and final artifacts | Standardize final-artifact evidence |
| GitHub Actions artifact checks | Readiness invariants belong after the relevant build step | Path-filtered workflow | Specify generic CI behavior; do not require GitHub Actions | Standardize exits and reports, not CI vendor |
| Production retrigger after deployment lag | Repository state and production state can diverge | Post-deploy identity and smoke check | Model deployment provenance and drift | Standardize trust labels and drift evidence |

Rootstock used Docusaurus, Vercel, custom plugin names, a 49K trim point, a 50K index
guard, and 95 percent coverage. None is a toolkit default.

The primary case-study archive contains the Rootstock build history, timeline,
implementation snapshots, dashboard lessons, and source manifest. It is retained
outside the public repository. The table above publishes generalized lessons rather
than the underlying corpus or Rootstock implementation files.

Open evidence gaps:

- `SOURCE_REQUIRED`: April, June, and September Fern screenshots are not in the copied
  repository evidence.
- `UNVERIFIED`: Exact Fern labeling of the skipped or omitted 23rd check.
- `UNVERIFIED`: Why Fern displayed AFDocs 0.10.7 while local remediation used 0.18.7.
- `PARTIALLY_CONFIRMED`: PR #511 and #567 were important contributors, but exclusive
  causation for score changes is not proven.
- `DECISION_REQUIRED`: Neutral thresholds for page size, index size, and coverage.
- `STAKEHOLDER_REQUIRED`: Which evidence mode provides the best first workflow.
- `FUTURE`: Task-success evidence and optional AI remediation.
- `OUT_OF_SCOPE`: Health Dashboard implementation.

## Rootstock lessons mapped to generalized requirements

| Rootstock lesson | Generalized problem | Engineering principle | Product requirement | Evidence | Standardization |
| --- | --- | --- | --- | --- | --- |
| Broken `llms.txt` links | Generated index did not match served routes | Validate promises against observable targets | Check source/build/live link integrity separately | `CONFIRMED`: frozen baseline and URL-fix snapshots | Standardize evidence, not Rootstock paths |
| Missing `llms.txt` directive | Deep pages did not advertise the index | Entry points need page-level discovery signals | Check declared discovery relations in HTML and Markdown | `CONFIRMED`: named baseline failure and directive snapshots | Follow external standards where stable |
| Markdown parity loss | Machine view omitted or changed visible content | Representation must preserve intended semantics | Compare normalized HTML and Markdown evidence | `CONFIRMED`: PR #548/#564 history and serializer snapshots | Standardize output evidence, not one algorithm |
| MDX component serialization | Interactive states disappeared in export | Components need serialize, replace, split, or explicit exclusion strategy | Framework adapters map component evidence to likely causes | `CONFIRMED`: serializer and `MarkdownIgnore` snapshots | Keep implementation adapter-specific |
| Oversized RPC pages | One representation exceeded consumer budgets | Preserve corpus while changing machine retrieval shape | Separate size measurements and configurable budgets | `CONFIRMED`: PR #567 changes; exclusive score causation not claimed | Do not standardize Rootstock sizes |
| Late content start | Useful content followed excessive chrome | Retrieval budget includes content position | Measure first meaningful content independently of total size | `CONFIRMED`: April baseline and targeted fixes | Version the algorithm; keep policy configurable |
| Sitemap and `llms.txt` mismatch | Discovery artifacts described different sets | Compare normalized sets with explicit exclusions | Emit missing, extra, duplicate, and coverage measurements | `CONFIRMED`: baseline freshness finding and audit snapshot | Standardize set outputs, not coverage threshold |
| Production deployment lag | Merged fix was not live | Deployment is an independent evidence boundary | Bind live results to deployment identity or report unavailable | `PARTIALLY_CONFIRMED`: PR #568 intent and chronology | Standardize trust labels, not provider mechanism |
| Local artifact drift | Stored result differed from current external state | Snapshots need time, version, target, and digest | Preserve content-addressed provenance and supersession | `CONFIRMED`: timeline caveat and score artifact | Standardize provenance fields |
| CI artifact validation | Build regressions could recur | Enforce invariants at the stage that produces them | Support source/build/live CI stages and policy levels | `CONFIRMED`: verify workflow and scripts | Standardize reports and exits, not CI vendor |
| Evaluator version differences | Results changed under different evaluator contexts | Version every external result and reject naive comparison | Adapter retains version, raw result, mappings, and compatibility | `CONFIRMED`: Fern 0.10.7 display versus local AFDocs 0.18.7 | Standardize adapter contract, not external semantics |
