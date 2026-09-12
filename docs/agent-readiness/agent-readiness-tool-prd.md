# Docs Agent Readiness Toolkit Product Requirements Document

## Document control

- **Product:** Docs Agent Readiness Toolkit
- **Internal product slug:** `docs-agent-readiness-toolkit`
- **Repository:** `owans/docs-agent-readiness-toolkit`
- **License:** MIT
- **Phase:** Phase 2 Generalisation
- **Status:** Authoritative specification with a tiny implemented Phase 3 subset; see
  `docs/phase3/README.md`
- **Research date:** 2026-09-10

The working description is:

> An open-source engineering toolkit for making documentation discoverable,
> retrievable, machine-readable, and maintainable for AI agents.

`DART` is internal shorthand and a provisional rule-document prefix only. It is not a
frozen public package or executable name. Those names remain `DECISION_REQUIRED`.

## 1. Product thesis

Documentation teams need an engineering control loop around agent accessibility:

`DISCOVER -> DIAGNOSE -> FIX -> VALIDATE -> ENFORCE -> TRACK`

Existing evaluators can identify live-site readiness symptoms. Generators can emit
`llms.txt` and Markdown. Generic site scanners can find broken links. The product
differentiator is content-addressed evidence capture, evidence trust labels,
source/build/live correlation, compatible finding-level diffs, policy provenance, and
framework-aware diagnosis. Broad live scoring remains delegated to existing evaluators.

The deterministic core must remain useful without AFDocs, Fern, Rootstock, an LLM, a
documentation platform, or hosted SaaS.

## 2. Problem statement

Teams can add an index or run a score, but still struggle to answer:

- Which artifact or deployed route failed?
- Did the failure originate in source, build generation, or delivery?
- Which source revision and deployment produced the observation?
- Is the result a new regression or an incompatible comparison?
- What is the deterministic fact, and what is only a likely cause?
- How should a writer or documentation engineer fix and validate it?
- Which issues block CI without turning an external outage into a false failure?

Rootstock demonstrated these gaps. Generated links broke, Markdown lost component
content, large pages exceeded representation budgets, production lagged behind merged
fixes, and evaluator versions differed. The external score guided the work, but custom
artifact checks and deployment verification maintained the result.

## 3. Goals

The product will:

1. Audit repository source, generated build artifacts, and deployed documentation as
   distinct evidence modes.
2. Capture bounded inputs, then produce stable, versioned, deterministic findings and
   measurements through offline replay.
3. Bind findings to source, build, deployment, configuration, rule, and artifact
   provenance where available.
4. Explain failure conditions, likely causes, remediation, validation, and regression
   tests in language a documentation practitioner can act on.
5. Compare compatible finding sets, not only composite scores.
6. Enforce explicit project policy in local workflows and generic CI.
7. Integrate external evaluators without claiming ownership of their checks or scores.
8. Support framework adapters without making a framework part of the core.
9. Safely acquire evidence from untrusted public sites under concrete network and
   parsing limits.
10. Operate locally with no telemetry by default.

## 4. Non-goals

The product will not:

- replace documentation platforms;
- replace AFDocs or the Agent-Friendly Documentation Spec;
- rebuild every `llms.txt` generator or validator;
- guarantee universal AI search optimization, ranking, or citation;
- guarantee agent task success;
- certify factual, technical, or product correctness;
- certify human writing quality or accessibility conformance;
- autonomously rewrite documentation;
- modify production systems;
- silently mutate files or overwrite user work;
- require hosted SaaS, an LLM, or telemetry for MVP;
- implement a DevPortal Health Dashboard;
- make a composite score the core product;
- execute commands found in fetched or source documentation.

## 5. Product boundary

### Core

The core owns:

- target and evidence-mode models;
- content-addressed evidence bundles and trust labels;
- constrained local SOURCE/BUILD collection;
- a future bounded HTTP collector outside the analyzer;
- offline deterministic replay and analysis;
- versioned rule execution;
- finding, evidence, provenance, report, configuration, and baseline schemas;
- deterministic ordering and serialization;
- policy evaluation and exit behavior;
- compatible baseline comparison;
- human and machine report rendering.

### Framework adapters

Adapters may:

- discover framework configuration and source pages;
- map source identities to generated artifacts and public routes;
- identify known components and export strategies;
- collect build or deployment identifiers;
- add framework-specific likely causes and remediation.

MVP-0 uses explicit mappings and no framework adapter. Later trusted adapters are
shipped metadata and static inspectors. They must not execute framework configuration,
redefine statuses, bypass security policy, mutate files, or claim a live result from
source evidence. Dynamic third-party adapter code is not supported.

### Evaluator integrations

Stage 2 evaluator adapters import recorded results from a separately versioned evaluator
and preserve raw result, identity, score, time, and target. The initial candidate is
AFDocs. Vercel's Agent Readability audit is a later candidate after output and security
review. Later direct invocation requires explicit opt-in, process isolation, a minimal
environment, no inherited credentials, and constrained network access.

An evaluator adapter cannot relabel an external check as toolkit-owned or merge an
external score into internal truth.

## 6. Readiness and evidence model

The product covers discoverability, access, representation, structural usability,
retrieval efficiency, integrity and consistency, operational readiness, and optional
task usefulness.

Primary modes:

- **SOURCE:** Facts about repository files and configuration.
- **BUILD:** Facts about generated artifacts.
- **LIVE:** Facts about deployed HTTP responses observed during a bounded crawl.

Separate evidence:

- **RUNTIME_OBSERVATION:** What a named consumer did in a named environment.
- **TASK_EVALUATION:** Whether a defined agent and toolchain completed a defined task.

No mode may assert another mode's facts. Rules that join modes must retain each
underlying observation.

Acquisition and analysis are distinct. Live acquisition is time-bound and mutable.
Deterministic analysis replays a content-addressed evidence bundle without refetching.
Each provenance value is labeled `OBSERVED_BY_COLLECTOR`,
`DETERMINISTICALLY_DERIVED`, `USER_ASSERTED`, or `EXTERNALLY_ATTESTED`.

Acquisition kind is separately frozen as `COLLECTED`, `IMPORTED`, `ASSERTED`, or
`ATTESTED`. Mode says what state the evidence represents. Acquisition says how it
entered the bundle. Trust labels apply to particular values. For example, imported
AFDocs bytes are observed by the importer, while the producer claim remains user
asserted unless an attestation is verified.

Every evidence record separates:

- integrity, established by content-address verification;
- provenance, established by acquisition and lineage metadata;
- authenticity, established only by an explicit trust mechanism;
- freshness, established by observed/generated timestamps and their trust labels.

A hash does not establish authenticity. `verified: true` is not an authenticity
mechanism.

The core compares identities it can establish. It does not manufacture lineage.
Generic mappings are explicitly supplied. Results are `IDENTITY_ESTABLISHED`,
`IDENTITY_ASSERTED`, `IDENTITY_UNVERIFIED`, or `IDENTITY_INCOMPATIBLE`.
Identity status describes the strength of a declared relationship between targets.
Authenticity describes the strength of evidence's claimed origin. DART-OPS-001 and
DART-OPS-002 own relationship findings; DART-OPS-003 reports evidence properties and
does not derive lineage from authenticity.

The Rootstock final checkpoint was 100/100 with 22 of 23 checks passed, one skipped,
zero warnings, and zero failures. `CONFIRMED`: it was not 23 of 23. `UNVERIFIED`: the
exact Fern presentation of the 23rd check is not present in the copied evidence.

## 7. Personas

### Technical Writer

- **Problem:** A check reports a technical symptom without showing which page or what
  editorial action is safe.
- **Workflow:** Run or open a report, filter to owned pages, inspect evidence and likely
  causes, apply a reviewed content fix, run validation.
- **Desired outcome:** A concise repair queue with clear evidence and no requirement to
  understand crawler internals.
- **Barriers:** Noisy terminology, framework details, false certainty, and broad scores.
- **Success criteria:** Can identify what failed, where, why it matters, what to change,
  and how to verify it.

### Documentation Engineer

- **Problem:** Source and generated machine representations diverge.
- **Workflow:** Audit source and build, group failures by component or generator cause,
  change export configuration, verify artifacts and live routes.
- **Desired outcome:** Reproducible diagnostics across the build pipeline.
- **Barriers:** Generated pages, MDX components, locale/version routing, and opaque
  platform behavior.
- **Success criteria:** A systemic fix clears target findings without losing human
  content.

### Developer Experience Engineer

- **Problem:** Documentation is technically present but agents retrieve incomplete or
  expensive context.
- **Workflow:** Measure discovery and representation, define bounded consumer profiles,
  coordinate remediation, and add task evaluation separately.
- **Desired outcome:** Reliable retrieval surfaces with explicit proof boundaries.
- **Barriers:** Conflated content quality and readiness claims.
- **Success criteria:** Deterministic readiness improves and task outcomes are measured
  through a separate approved harness.

### Documentation Platform Owner

- **Problem:** Platform changes can break many sites or routes at once.
- **Workflow:** Run build and live audits over fixtures, inspect grouped adapter causes,
  release a fix, and compare compatible baselines.
- **Desired outcome:** Framework-wide prevention and explainable exceptions.
- **Barriers:** Multiple deployment providers and customized themes.
- **Success criteria:** Stable generated artifacts and no new blocking regressions.

### Open-source Maintainer

- **Problem:** Limited time and infrastructure make hosted or AI-dependent tools costly.
- **Workflow:** Run a local audit, commit a reviewed configuration and baseline, then
  use generic CI.
- **Desired outcome:** Small configuration, deterministic output, and actionable fixes.
- **Barriers:** Dependency weight, unstable scores, and maintenance burden.
- **Success criteria:** Useful results without credentials, telemetry, or SaaS.

### CI and Platform Engineer

- **Problem:** CI needs stable exit behavior, bounded network activity, and low-noise
  annotations.
- **Workflow:** Pin versions, provide explicit targets, enforce regression policy, retain
  JSON artifacts, and separate post-deploy checks.
- **Desired outcome:** Reproducible gates with distinct policy, tool, and unavailable
  states.
- **Barriers:** Flaky networks, unsafe URLs, external outages, and schema drift.
- **Success criteria:** CI fails only for configured policy or tool errors, with clear
  exit codes and audit evidence.

## 8. Core user journeys

### A. Audit a public documentation site

This is a Stage 3 journey. It is not implemented by the current prototype.

- **Input:** Allowed HTTP or HTTPS origin, optional path scope, limits, and live rules.
- **Processing:** Validate target addresses, discover within bounds, fetch inert content,
  run live rules, sanitize evidence.
- **Result:** Findings, measurements, provenance, and incomplete-crawl reasons.
- **Exit:** Policy result, distinct from tool or configuration error.
- **Artifacts:** JSON plus optional human or Markdown report.
- **Failure modes:** Blocked target, redirect escape, timeout, byte limit, auth wall,
  malformed content, or partial crawl. None becomes pass.

### B. Audit a local documentation repository

- **Input:** Repository root, configuration, optional framework adapter.
- **Processing:** Read allowed files, respect exclusions, inventory source, run source
  rules, collect revision and working-tree state.
- **Result:** Source-only findings and adapter-informed likely causes.
- **Exit:** Configured source policy.
- **Artifacts:** JSON and human report.
- **Failure modes:** Unsupported adapter, unreadable path, symlink escape, missing
  revision, or malformed config.

### C. Validate generated build artifacts

- **Input:** Explicit build root, optional route manifest, source revision and build ID.
- **Processing:** Prevent path escape, inventory files, parse indexes and representations,
  run size, structure, link, parity, and provenance rules.
- **Result:** Build-only findings and measurements.
- **Exit:** Configured build policy.
- **Artifacts:** JSON, human report, evidence digest list.
- **Failure modes:** Missing build, incomplete route map, unsafe symlink, parser limit,
  or stale artifact. No live claim is made.

### D. Validate a deployed site

The implemented path replays captured deployment evidence. Stage 3 later adds HTTP
collection.

- **Prototype input:** BUILD evidence, recorded LIVE bytes, explicit identity mapping,
  and provenance/trust metadata.
- **Prototype processing:** Compare captured evidence offline and preserve uncertain
  lineage.
- **Prototype result:** Build-to-recorded-live drift finding with evidence completeness.
- **Stage 3 input:** Explicit deployment URL and approved network policy.
- **Stage 3 processing:** A bounded HTTP collector creates LIVE evidence for later
  offline analysis.
- **Failure modes:** Unverified deployment identity, missing recorded evidence, or, in
  Stage 3 only, network policy and collection limits.

### E. Run in CI

- **Input:** Pinned toolkit, checked-in config, source/build/live stage, optional
  baseline.
- **Processing:** Validate config, run deterministic checks, compare baseline, evaluate
  policy, render stable outputs.
- **Result:** A concise console summary and retained reports.
- **Exit:** Defined exit-code contract.
- **Artifacts:** JSON, Markdown, optional SARIF or provider annotations.
- **Failure modes:** Policy failure, invalid config, tool failure, unavailable optional
  evaluator, or incompatible baseline.

### F. Compare with a baseline

- **Input:** Current report and reviewed content-addressed baseline report.
- **Processing:** Validate schemas, modes, rules, configurations, target identities, and
  adapters; join by stable fingerprints.
- **Result:** `NEW`, `RESOLVED`, `CHANGED`, `UNCHANGED`, or `INCOMPATIBLE`.
  `CHANGED` retains previous and current finding status.
- **Exit:** Regression policy, not aggregate score delta.
- **Artifacts:** Machine and human comparison reports.
- **Failure modes:** Schema incompatibility, changed rule semantics, changed scope,
  threshold drift, or corrupt baseline.

### G. Integrate an external evaluator

- **Input:** Adapter configuration and evaluator target or raw result.
- **Processing:** Stage 2 imports and parses recorded output safely. Evaluator invocation
  is deferred.
- **Result:** External findings and score in a separate namespace.
- **Exit:** Optional outage is advisory unless explicitly required.
- **Artifacts:** Raw result reference, normalized adapter report, provenance.
- **Failure modes:** Evaluator unavailable, output schema changed, version missing, or
  mapping loss.

## 9. Functional requirements

### Target inventory

The product must use explicit roots and origins. It must normalize target identities
without losing locale, version, suffix, host, or evidence mode. Exclusions require a
reason and configuration location.

### Rule execution

Rules must declare applicability before detection. Rule output must be deterministic for
the same captured evidence bundle, versions, and configuration. Live acquisition itself
is not deterministic because DNS, caches, deployment state, and responses can change.
Concurrency must not affect analysis ordering.

### Acquisition

Prototype collectors read explicit local SOURCE/BUILD files or recorded imports and
write bounded bytes, digests, and trust metadata into a content-addressed bundle. The
future Stage 3 HTTP collector will add request metadata and limit events. Analysis
receives neither ambient network nor filesystem access.

### Diagnosis

The report must separate:

- `DETERMINISTIC FACT`;
- `LIKELY CAUSE`;
- `RECOMMENDED FIX`;
- validation;
- regression test suggestion.

Framework-specific causes require adapter evidence. A generic live symptom cannot
assert a source cause.

### Reporting

All renderers derive from one machine result. Human wording may improve without
changing finding identity. Machine output must not contain terminal color codes.

## 10. Finding contract

### Required fields

Run-wide schema, tool, time, environment, configuration, acquisition, and provenance
metadata belongs in a shared run envelope. Each finding references that envelope and
supports:

- `schema_version`;
- `rule_id` and `rule_version`;
- `category`, `severity`, `status`, `title`, and `description`;
- `target` with mode and normalized identity;
- `evidence`;
- `observed_value` and `expected_value`;
- `likely_causes`;
- `remediation` and `validation`;
- `documentation_reference`;
- `framework`;
- `evaluator` when external;
- `tool_version` and `timestamp`;
- `environment`;
- `provenance`;
- `fingerprint`.

The comparison report, not the finding, contains regression state. Allowed states are
`NEW`, `RESOLVED`, `CHANGED`, `UNCHANGED`, and
`INCOMPATIBLE`. A `CHANGED` record contains `previous_status` and `current_status`;
human output may render `PASS -> FAIL`.

The run envelope contains `evidence_completeness` for `SOURCE`, `BUILD`, `LIVE`,
`RUNTIME_OBSERVATION`, `TASK_EVALUATION`, and `EXTERNAL`. Each value is
`COMPLETE`, `PARTIAL`, `UNAVAILABLE`, or `NOT_REQUESTED`. This is not a score. Zero
findings or failures never implies complete evidence.

Example shape:

```json
{
  "schema_version": "1.0",
  "rule_id": "DART-DISC-003",
  "rule_version": "1.0.0",
  "category": "discovery",
  "severity": "high",
  "status": "FAIL",
  "target": {
    "mode": "live",
    "identity": "https://docs.example.test/guide.md"
  },
  "evidence": [],
  "observed_value": {"http_status": 404},
  "expected_value": {"http_status": 200},
  "likely_causes": [],
  "remediation": [],
  "validation": [],
  "provenance": {},
  "fingerprint": "sha256:..."
}
```

`DART-*` IDs are provisional Phase 2 identifiers. Phase 3 must freeze or migrate the
public rule namespace before a stable report schema.

### Stable statuses

Statuses are `PASS`, `WARN`, `FAIL`, `SKIP`, `NOT_APPLICABLE`, and `UNAVAILABLE`.

- `SKIP` is an intentional execution decision.
- `NOT_APPLICABLE` follows declared applicability logic.
- `UNAVAILABLE` means required evidence could not be collected.

The choice aligns with common test and evaluator concepts while preserving distinctions
that CI and evidence review need. Adapters retain raw external status names.

### Identity and fingerprint

Finding identity and compatibility are based on:

- internal or namespaced external rule ID;
- exact evaluator version for 0.x evaluators;
- specification and adapter mapping version;
- rule implementation digest;
- parser and canonicalizer version;
- rule-specific configuration and thresholds;
- normalized target identity;
- evidence mode;
- stable sub-identity such as link, component, or header key.

Fingerprints use a canonical serialized tuple and declared hash algorithm. They exclude
message text, timestamps, ordering, volatile measurements, and absolute local paths.
A rule must version any identity-algorithm change.

### Ordering

Machine output sorts by mode, normalized target, rule ID, sub-identity, then evidence
location. Maps use documented canonical key ordering where serialization requires it.
Parallel execution must produce byte-stable golden output after volatile run metadata is
normalized.

### Versioning and compatibility

Additive optional fields may appear in a backward-compatible minor schema release.
Removing fields or changing meaning requires a major schema version. Readers must reject
unknown major versions and preserve unknown fields when round-tripping where practical.

## 11. Provenance model

The report must answer: "Which source, build, and deployment produced this result?"
It must also state how each identity was obtained. Complete metadata does not prove
authenticity.

### Source provenance

- repository identifier;
- revision;
- clean, dirty, or unknown working-tree state;
- optional safe diff digest, not diff content;
- source root and configured target-set digest.

### Build provenance

- build identifier and timestamp;
- producing source revision;
- build command identifier when supplied;
- artifact-root identity;
- relevant artifact digests;
- adapter and generator versions when available.

### Live provenance

- requested and final deployment URL;
- deployment identifier where independently available;
- crawl start and end;
- resolved public addresses as security audit metadata, subject to privacy policy;
- response digest and selected sanitized headers;
- expected source/build identity and whether it could be verified.

### Evaluation provenance

- toolkit and rule versions;
- configuration digest;
- sampling and limit configuration;
- evaluator and adapter versions;
- evaluator timestamp;
- raw result digest and location.

`verified: true` is not proof. A claim must bind to an observable input, trusted
identity source, or content digest.

Trust labels:

- `OBSERVED_BY_COLLECTOR`: the collector directly read or received the value;
- `DETERMINISTICALLY_DERIVED`: the analyzer computed it from captured evidence;
- `USER_ASSERTED`: configuration or caller supplied it without independent proof;
- `EXTERNALLY_ATTESTED`: a named trust boundary signed or otherwise attested it.

## 12. Baseline and regression model

A baseline is a content-addressed snapshot after approval. Replacement creates a new
identifier and records the reason. Local content addressing detects accidental change
but does not prove who created the snapshot. Reserve tamper-evident claims for signed CI
attestations or an equivalent trust boundary.

Compatibility requires:

- compatible report schema;
- matching evidence mode and normalized target policy;
- compatible rule ID and version;
- exact 0.x evaluator version where applicable;
- matching specification, adapter mapping, rule implementation, parser, and
  canonicalizer versions;
- equivalent rule-specific threshold and applicability configuration;
- explainable target-set changes.

The comparison report names the changed dimension precisely. Parser, canonicalizer,
and identity-algorithm changes emit `PARSER_VERSION_CHANGED`,
`CANONICALIZER_VERSION_CHANGED`, and `IDENTITY_ALGORITHM_CHANGED` respectively.
Schema, rule, configuration, target inventory, and evaluator changes retain their own
reason codes.

When rules, evaluator versions, thresholds, or site topology change:

1. compare only compatible findings;
2. mark others `INCOMPATIBLE`, not new or resolved;
3. provide a migration only if semantics are provably preserved;
4. retain both original reports;
5. require review before selecting a replacement baseline.

Composite score changes never substitute for finding-level comparison.

Imported external checks remain in an external namespace. If a baseline external check
has no corresponding current imported observation, emit item-level `INCOMPATIBLE` with
`EXTERNAL_CHECK_UNAVAILABLE`. Do not infer `RESOLVED` from absence.

## 13. CI policy and exit codes

Findings have severity. CI policy has `BLOCKING`, `ADVISORY`, or `INFORMATIONAL`
behavior. Configuration maps rule, category, target, baseline transition, and severity
to policy.

Pull-request CI loads policy, exclusions, and baseline from the trusted base revision.
Changes to those controls require separate review. Untrusted forks run source/build
analysis without network or external evaluator execution. After Stage 3 approval, live
acquisition runs only post-deploy or on a trusted schedule. Incomplete acquisition
remains distinct from a documentation failure.

Policy distinguishes: no blocking findings with complete evidence; no blocking
findings with incomplete evidence; blocking findings; and unavailable required
evidence. The JSON report, not the process exit alone, is the audit record.

Proposed process exits:

| Exit | Meaning |
| ---: | --- |
| 0 | Run completed and no blocking policy failed |
| 1 | One or more blocking findings or regressions |
| 2 | Invalid configuration or command usage |
| 3 | Tool, parser, filesystem, or required input failure |
| 4 | Required external evaluator unavailable or invalid |
| 5 | Baseline or schema incompatibility configured as an error |

Signals must also be represented in JSON. Shell exit codes alone are not an audit
record.

External evaluator unavailability is advisory by default. Users may explicitly require
it, which permits exit 4.

## 14. Reports

### Human report

Answers what failed, where, why it matters, evidence, likely causes, how to fix, and how
to validate. Groups systemic causes without hiding page-level findings.

The default writer view shows new findings on owned pages, one deterministic
observation, one safe next action, and one validation command. Run provenance stays in
the audit view.

### Machine report

Versioned JSON with deterministic ordering, complete statuses, provenance, policy
results, and sanitized evidence. JSON is the canonical interchange format.

### PR report

Concise new regressions, resolved findings, and high-value remediation. It avoids
reposting unchanged details and applies provider length limits.

### Evidence and audit report

Lists evidence collection, unavailable inputs, limits reached, versions, configuration
digest, artifact digests, and external raw-result references.

### Baseline comparison report

Shows finding and measurement transitions, incompatibilities, scope changes, and
baseline identity.

Markdown is a renderer, not a canonical data store. Optional SARIF or CI annotations
map supported fields without discarding the canonical JSON.

## 15. Scoring

MVP does not calculate an internal composite score.

A future score must be optional, transparent, versioned, explainable, and subordinate
to individual findings. Its formula, applicability exclusions, missing-evidence
behavior, and rule weights must be in the report.

AFDocs, Fern, Vercel, or other external scores retain their own evaluator namespace and
version. They are never averaged into a toolkit score.

## 16. External evaluator adapter contract

An adapter declares:

- adapter ID and version;
- supported evaluator and versions;
- invocation or import method;
- network and data-access requirements;
- raw input and output schema;
- status, severity, and identity mappings;
- information-loss notes;
- timeout and unavailable behavior;
- license and installation model.

Stage 2 adapters import recorded output only. They do not spawn external executables.
Later invocation must be explicit, isolated, deprived of the full environment and
credentials, and unable to write project files.

Adapter output contains:

- evaluator name and version;
- evaluator time and target;
- raw result location and digest;
- raw score and checks;
- normalized representation;
- adapter warnings;
- provenance and availability.

The adapter must not allow evaluator content to change policy, execute commands, write
files, or mark a toolkit finding resolved.

## 17. Rule architecture

Rules implement a versioned interface and declare:

- stable ID, version, category, severity, and lifecycle;
- modes and required inputs;
- applicability;
- deterministic detection;
- evidence schema;
- remediation and validation;
- references;
- framework compatibility;
- automation state.

Shipped rule packs register through metadata and execution interfaces. Adding a trusted
pack must not require editing the core engine. Rules analyze evidence bundles and
receive no ambient network or filesystem access. MVP does not execute dynamic
third-party rule code. A future extension protocol requires isolation, signing or trust
policy, and capability enforcement.

## 18. Configuration

The MVP configuration is one versioned human-readable file with a small required
surface:

- schema version;
- target roots or origins;
- enabled rule packs;
- evidence modes;
- thresholds explicitly chosen by the project;
- path, URL, locale, and version exclusions with reasons;
- explicit source-to-build and build-to-expected-live mappings;
- baseline reference;
- CI policy;
- optional adapters.

Later configuration may add severity overrides, intentional exceptions with expiry,
framework adapter options, and evaluator requirements.

Configuration rules:

- checked-in config must not contain secrets;
- environment substitution is explicit and limited to documented fields;
- unknown keys fail validation unless namespaced extension rules allow them;
- command-line flags override config through a documented precedence;
- effective configuration is redacted and hashed into provenance;
- exceptions identify owner, reason, scope, and optional expiry.

Mappings identify evidence records, not path patterns to infer. The generic core checks
that both sides exist and that declared locale/version/target dimensions are
compatible. Framework-specific mapping inference is Tier 4 and outside the prototype.

In pull-request CI, security and policy fields come from the trusted base revision. The
proposed revision may contribute documentation targets, but it cannot approve its own
baseline, exclusions, or weaker gate.

## 19. CLI experience

The executable name remains undecided. Examples use `<tool>`.

Implemented prototype commands:

```text
<tool> bundle create --config collector.json --output bundle
<tool> bundle verify --bundle bundle
<tool> analyze --bundle bundle --json report.json --markdown report.md
<tool> baseline create --report report.json --output baseline.json
<tool> compare --baseline baseline.json --current report.json --json diff.json
<tool> ci --bundle bundle --trusted-base-root trusted-base
```

These names remain prototype interfaces, not a frozen public CLI.

### Arguments and defaults

- No public crawl or URL input exists in the prototype.
- Source defaults to the current directory only when source mode is explicit.
- Build root is always explicit.
- Future Stage 3 network limits require the approved security gate.
- Output defaults to a human summary on stdout.
- Machine JSON goes to an explicit file or stdout with human logs on stderr.
- Color is disabled when stdout is not a terminal.
- Non-deterministic sampling is never a CI default.

### Namespace decision

Do not adopt `dart`, `dar`, or crowded `AgentDocs`/`AgentReady` naming without registry,
executable, domain, repository, and trademark checks. Product and repository names are
frozen for this phase; package and executable names are not.

## 20. Network security

The analyzer never touches the network. The future HTTP collector is a separate
security-sensitive acquisition subsystem. Stage 3 stays blocked until the documented
network, resource, parser, filesystem, and execution matrix is executable and approved.

### Required Stage 3 controls

- Allow only HTTP and HTTPS.
- Reject URL user information and ambiguous host syntax.
- Normalize hosts and ports before policy evaluation.
- Block localhost, loopback, RFC1918, carrier-grade NAT, link-local, multicast,
  unspecified, reserved, documentation-only, and other non-routable destinations for
  IPv4 and IPv6.
- Block cloud metadata hosts and addresses, including well-known link-local endpoints.
- Resolve DNS before connection and validate every returned address.
- Pin or revalidate the connected address to defend against DNS rebinding.
- Disable automatic redirect following. Validate every redirect target and address
  before the next request.
- Cap redirect count, URLs, sitemap children, crawl depth, concurrency, requests per
  host, total time, connect time, and response time.
- Cap compressed bytes, decompressed bytes, and expansion ratio.
- Stream and stop at limits instead of buffering unbounded bodies.
- Use a clear user agent and honor `Retry-After` within the run budget.
- Apply rate limits and backoff.
- Parse HTML, Markdown, XML, and headers as inert untrusted data.
- Disable scripts, active content, external XML entities, and document-provided
  instructions.
- Sanitize control characters and markup in terminal, Markdown, JSON, SARIF, and CI
  annotations.
- Prevent fetched URLs or content from selecting files, commands, configuration, rules,
  credentials, or new crawl origins.

### Filesystem controls

- Resolve and enforce explicit source and build roots.
- Reject path traversal and symlink escape.
- Do not scan `.env`, credential, key, or ignored private-context patterns by default.
- Cap file count, file bytes, nesting, and parse time.
- Never execute repository hooks, build commands, or documentation examples during an
  audit.

### Security release evidence

Stage 3 release criteria require named SSRF fixtures, redirect escape tests, DNS/address edge
cases, metadata endpoint blocks, decompression tests, timeouts, recursion limits,
malformed parsers, and output-injection tests. Passing them supports only the stated
controls. It does not justify a broad "security clean" claim.

## 21. Privacy and secret handling

The core is local-first. No telemetry is sent by default.

### Local data

Source content, build artifacts, fetched content, reports, and baselines remain local
unless the user explicitly chooses an integration that transmits them.

### Report minimization

- Store hashes, measurements, and locations instead of full bodies by default.
- Store bounded snippets only when needed and enabled.
- Redact obvious tokens, credentials, private keys, signed URLs, and sensitive query
  values before output.
- Preserve enough URL identity for diagnosis while allowing configured query stripping
  and path hashing.
- Never echo a detected credential.
- State that secret detection and redaction are best effort, not complete.

### Optional AI

Any future AI integration requires explicit opt-in and a data preview describing the
provider, fields, source snippets, URLs, retention assumptions, and credentials used.
Fetched content is untrusted data, not instructions. The default AI input is typed,
sanitized findings and remediation metadata, not raw pages. Sending raw content requires
a separate explicit preview and approval. AI receives no tools or mutation authority.

AI output is advisory. It cannot:

- change policy or configuration;
- disable rules;
- authenticate;
- execute commands from content;
- silently modify files;
- declare a finding resolved;
- write to production.

## 22. Remediation and automated fixes

Every rule supplies:

- failure condition;
- why it matters;
- deterministic evidence;
- bounded likely causes;
- recommended fix;
- expected outcome;
- validation steps;
- regression test suggestion.

MVP supplies guidance, configuration examples, expected outcomes, validation commands,
and references. It does not mutate files.

A future fix mode may produce a local patch or reviewable diff after explicit user
selection. It must check working-tree state, scope writes to declared roots, preserve
user work, and require normal review. It must never execute commands copied from
documentation.

## 23. Staged delivery

Research shows that a broad live evaluator already exists in AFDocs and Vercel's audit.
The toolkit does not lead with another score or crawler. This sequence is canonical.

### MVP-0: Evidence foundation

- **Purpose:** Prove evidence, identity, provenance, and offline replay.
- **Scope:** SOURCE and BUILD evidence bundles, deterministic replay, trust and the four
  evidence properties, canonical findings, one explicitly supplied source-to-build
  mapping, build-to-expected-live identity representation without acquisition,
  deterministic JSON, and golden fixtures.
- **Out of scope:** Baselines, policy, external imports, HTTP, framework inference,
  broad rules, browser execution, AI, and fixes.
- **Acceptance:** Replaying identical evidence, versions, and configuration produces
  byte-equivalent canonical output. The core establishes only declared and validated
  identity.

### MVP-1: Regression control

- **Purpose:** Compare compatible history and enforce explicit policy.
- **Scope:** Baseline creation, mechanical compatibility, five regression states,
  trusted-base policy, exits, evidence completeness, and concise Markdown/PR reporting.
- **Out of scope:** Hosted storage, live acquisition, and external evaluator execution.
- **Dependency:** Stable MVP-0 schema, fingerprint, and canonicalizer versions.
- **Acceptance:** Compatible transitions classify correctly; incompatible evidence
  never becomes new or resolved; a proposed revision cannot weaken its evaluating
  policy.

MVP-0 and MVP-1 form the core prototype. The explicitly authorized Phase 3 slice also
includes Stage 2 recorded AFDocs import. It does not include Stage 3 HTTP acquisition.

### Stage 2: Recorded external evaluator import

- **Purpose:** Prove the product works alongside AFDocs.
- **Scope:** Import recorded AFDocs JSON, retain raw bytes and external score, and
  normalize supported versions under an independently versioned adapter.
- **Out of scope:** Installing, spawning, or reimplementing AFDocs.

### Stage 3: Bounded live acquisition

- **Purpose:** Collect live evidence for offline analysis.
- **Scope:** A separate HTTP collector only after the security matrix is executable and
  approved.
- **Out of scope:** Analysis inside the collector.

### Later stages

Framework adapters, task evaluation, advisory AI, broader integrations, hosted
monitoring, and automatic fixes remain deferred until the prototype and practitioner
validation support further investment.

## 24. Test strategy

### Unit tests

- Parsers and size limits.
- URL normalization, identity, redirects, and policy.
- Configuration validation and precedence.
- Finding fingerprint and canonical ordering.
- Schema serialization and compatibility.
- Set coverage, parity normalization, and baseline joins.
- Output sanitization and redaction.

### Fixtures

- Valid, missing, and malformed `llms.txt`.
- Malformed and nested sitemaps.
- Broken, duplicate, relative, and hostile links.
- Missing or HTML-returning Markdown routes.
- HTML/Markdown parity loss.
- Tabs, accordions, filters, generated hubs, and duplicated content.
- Oversized HTML, extracted text, Markdown, and indexes.
- Late content and ambiguous content roots.
- Redirect loops and cross-host redirects.
- Soft 404 pages.
- Auth walls and approved alternative access.
- Locale/version loss.
- Malformed HTML, Markdown, XML, and headers.

### Integration tests

- In-process hostile HTTP fixture server.
- Local build-artifact trees with symlinks and path escapes.
- Source/build/live identity joins.
- Framework adapter fixtures when adapters exist.
- External evaluator recorded fixtures without live service dependency.

### Security tests

- Localhost and private network forms for IPv4 and IPv6.
- Link-local and metadata targets.
- Redirect from public to private.
- Multiple DNS answers and address-family edge cases.
- DNS rebinding simulation and connected-address mismatch.
- Encoded, decimal, octal, IPv4-mapped IPv6, and trailing-dot hosts.
- Oversized compressed and decompressed responses.
- Slow headers, slow body, timeout, recursion, and crawl explosion.
- XML entity expansion and poisoned sitemap links.
- Malicious terminal escapes, Markdown, JSON, and CI annotation content.
- Prompt injection against any optional AI boundary.

### Regression tests

- Baseline/current transitions.
- Rule and schema version changes.
- Threshold and configuration changes.
- Evaluator and adapter version changes.
- Site structure, locale, and version changes.
- Removed targets and unavailable evidence.

### Golden outputs

Stable JSON, human text, Markdown, baseline diff, and annotation fixtures. Golden tests
normalize only declared volatile run fields.

### Six canonical prototype canaries

1. SOURCE page present and mapped BUILD artifact absent produces source-to-build drift.
2. BUILD representation A and captured LIVE representation B produces build-to-live
   drift through offline replay only.
3. Different source/build paths joined by an explicit valid mapping produce
   `IDENTITY_ASSERTED` and `PASS`; existence is validated without upgrading the
   caller-supplied relationship.
4. An asserted deployment ID remains `USER_ASSERTED` and
   `IDENTITY_UNVERIFIED`.
5. Compatible baseline `PASS` to current `FAIL` produces `CHANGED`, preserves both
   statuses, applies `BLOCKING`, and exits 1.
6. Incompatible schema/rule/evaluator/configuration metadata produces
   `INCOMPATIBLE`, never `NEW` or `RESOLVED`.

Each canary asserts evidence references, identity status, finding status, provenance
and trust, evidence completeness, and deterministic replay.

### Diagnostic-localization acceptance

Seed defects at source, build, captured live/deployment, and imported external-evaluator
boundaries. The prototype passes only when it localizes the responsible boundary, cites
the correct evidence, separates facts from likely causes, preserves lineage
uncertainty, classifies regression correctly, and gives enough information to reproduce
the diagnosis offline.

## 25. Threat and failure matrix

| Failure | Detection | Evidence | Severity | User impact | Remediation | CI behavior | Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing `llms.txt` | Candidate path rule | Path/status | High | Poor discovery | Enable existing generator or route | Policy-based | Missing fixture |
| Malformed `llms.txt` | Versioned parser | Issue location/digest | High | Index unreadable | Correct format or generator | Blocking candidate | Parser fixtures |
| Broken links | Artifact/live resolution | URL/status/final URL | High | Retrieval stops | Fix generated path or redirect | Blocking candidate | 404 fixture |
| Incomplete coverage | Set comparison | Missing/extra sets | Medium | Pages undiscovered | Correct scope/exclusion | Threshold policy | Coverage fixtures |
| Oversized index | Separate size rule | Bytes/chars/budget | Medium | Truncation | Partition or curate | Project policy | Boundary sizes |
| Missing Markdown | Route/artifact map | Missing target | High | HTML-only retrieval | Enable export or alternative | Blocking candidate | Missing route |
| Parity loss | Normalized comparison | Missing block fingerprints | High | Content omitted | Serialize or split | Advisory until tuned | Component fixtures |
| Missing serialized component content | State comparison | Component/state evidence | High | Hidden instructions | Define export strategy | Adapter policy | Tabs/accordion |
| Oversized page | Separate payload rules | Size by representation | Medium | Context truncation | Split or bounded alternative | Project policy | Oversize fixtures |
| Late content | Content-root algorithm | Offset/percentage | Medium | Budget wasted | Clean representation or lead | Advisory | Chrome fixture |
| Redirect problem | Manual bounded redirect | Hop chain | High | Failed or unsafe retrieval | Correct routing | Blocking candidate | Loop/private redirect |
| Soft 404 | Invalid-path probes | Status/signature | High | Misleading content | Correct error response | Blocking candidate | SPA fallback |
| Auth wall | Access classifier | Status/form/redirect | Medium | Content unavailable | Confirm policy or alternative | Policy-based | Auth fixture |
| Sitemap mismatch | Set comparison | URL differences | Medium | Drifted discovery | Regenerate or exclude | Project policy | Set fixture |
| Deployment drift | Build/live canary | Digests/deploy ID | Critical | Fix not in production | Correct deployment lineage | Blocking if provable | Stale deployment |
| Evaluator unavailable | Adapter status | Version/error/time | Info default | Missing benchmark | Retry or use local core | Advisory unless required | Outage fixture |
| Malicious content | Inert parsers and sanitizer | Limit/security event | High | Injection or output corruption | Block and report | Tool/security error | Escape fixtures |
| SSRF attempt | Address and redirect policy | Block reason, no body | Critical | Internal network access | Reject target | Tool/security error | Address matrix |
| Excessive response size | Streaming byte limits | Limit and observed bytes | High | Resource exhaustion | Stop and narrow scope | Unavailable/fail by rule | Compression bomb |
| Tool configuration error | Schema validation | Safe config location | High | Invalid run | Correct configuration | Exit 2 | Invalid config |

## 26. Open-source governance

### License and dependencies

The project remains MIT. Dependency adoption requires:

- direct and transitive license review;
- notice and attribution requirements;
- maintenance and vulnerability review;
- lockfile and release provenance;
- replacement or removal plan.

MIT project licensing does not prove dependency compatibility.

### Contribution model

- Public contribution guide and code of conduct before accepting implementation PRs.
- Design changes begin with an issue or proposal for schema, rule, or adapter behavior.
- Tests and documentation are required with behavior changes.
- Maintainers disclose generated or AI-assisted contributions under project policy.

### Security policy

Publish supported versions, private reporting channel, response expectations, and scope.
Network, parser, filesystem, output, and optional AI boundaries receive named owners.

### CODEOWNERS

Before Phase 3 release, assign owners for:

- core and schemas;
- security-sensitive network and parser code;
- rule catalog;
- framework adapters;
- evaluator adapters;
- release workflows and dependency updates.

### Releases and compatibility

Use semantic versioning for the toolkit. Publish checksums, release notes, migration
notes, supported runtimes, and known risks. Do not call a release production-ready
without acceptance, tests, operational behavior, and unresolved-risk disclosure.

### Rule and adapter governance

Each rule and adapter has lifecycle status, owner, compatibility range, fixtures, and
deprecation plan. External projects do not automatically control toolkit release
timing. An evaluator change starts a new compatibility record.

### Deprecation

Stable schema and rule removals require advance notice and at least one supported
migration path where feasible. Historical reports must remain readable through a
documented compatibility library or schema archive.

### Specification evolution

Major behavior decisions are recorded in the decision log. Normative schemas require
review, examples, golden fixtures, and version updates. Rootstock evidence remains a
case study and cannot silently become a universal default.

## 27. Independent versioning

Version these independently:

- toolkit executable and library;
- rule implementation and rule catalog;
- finding/report schema;
- configuration schema;
- baseline comparison schema or algorithm;
- framework adapters;
- external evaluator adapters;
- optional score formula.

Historical external results preserve evaluator version even when the adapter changes.
A current evaluator cannot reinterpret an old raw result without recording the new
normalization.

## 28. Risks and mitigations

### Product overlap

AFDocs and Vercel already provide broad live audits. Mitigation: cut duplicate scoring
and focus MVP on evidence lineage, cross-mode checks, diagnosis, and regressions.

### MVP size

Evidence, identity, schemas, and baselines are substantial. Mitigation: MVP-0 contains
only local bundles, explicit mapping, replay, and canonical findings. MVP-1 follows only
after stable identity.

### False confidence

A polished report may look like certification. Mitigation: mode labels, limitations,
unavailable states, evidence links, and no core score.

### Crawler risk

Hostile targets can cause SSRF or resource exhaustion. Mitigation: no HTTP collector in
the prototype. Stage 3 remains blocked by the executable security matrix.

### Adapter maintenance

Framework and evaluator APIs change. Mitigation: adapters are optional, versioned,
owned, fixture-tested, and independently deprecated.

### Remediation correctness

Likely causes can be wrong. Mitigation: label inference, rank alternatives, bind source
evidence, and require validation.

### Baseline misuse

Users may bless existing defects or compare incompatible runs. Mitigation: reviewed
content-addressed baselines, trust labels, compatibility checks, and explicit scope
changes.

## 29. Success measures

MVP success is not a score. Measure:

- percentage of findings with reproducible evidence and validation;
- deterministic repeatability on golden fixtures;
- correct localization of seeded source, build, captured-live, and external defects;
- preservation of asserted or unverified lineage without promotion;
- proportion of baseline changes classified without incompatibility;
- time for a practitioner to locate and validate a failure in usability studies;
- false-positive and exception rates per rule version;
- CI completion within declared resource budgets;
- security fixture coverage;
- adoption alongside, not instead of, AFDocs or existing platform tooling.

`STAKEHOLDER_REQUIRED`: Set numeric product targets after user research and prototype
measurement.

## 30. Open questions

- `DECISION_REQUIRED`: Final package and executable names.
- `DECISION_REQUIRED`: Implementation language and supported runtimes.
- `DECISION_REQUIRED`: Exact post-prototype Tier 1 rule cut.
- `SOURCE_REQUIRED`: Dependency and parser licenses, security posture, and maintenance.
- `STAKEHOLDER_REQUIRED`: Whether source, build, or live is the most valuable first
  workflow for target users.
- `STAKEHOLDER_REQUIRED`: Default CI policy and exception ownership.
- `SOURCE_REQUIRED`: Stable AFDocs raw-output versions and programmatic invocation
  compatibility.
- `SOURCE_REQUIRED`: Vercel audit output and adapter feasibility.
- `SOURCE_REQUIRED`: April, June, and September Fern screenshots are not in the copied
  repository evidence.
- `UNVERIFIED`: Exact Fern labeling of the skipped or omitted 23rd check.
- `UNVERIFIED`: Why Fern displayed AFDocs 0.10.7 while local remediation used 0.18.7.
- `PARTIALLY_CONFIRMED`: Rootstock PRs #511 and #567 contributed to improvements, but
  exclusive score causation is not proven.
- `UNVERIFIED`: Which deployment providers expose trustworthy artifact identity.
- `FUTURE`: Browser-rendered mode.
- `FUTURE`: Task-evaluation adapter.
- `FUTURE`: Optional AI remediation and patch generation.
- `OUT_OF_SCOPE`: Hosted SaaS, production deployment, and dashboard implementation in
  Phase 2.

## Rootstock lessons mapped to product requirements

| Rootstock lesson | Generalized problem | Engineering principle | Product requirement | Evidence | Standardization |
| --- | --- | --- | --- | --- | --- |
| Broken `llms.txt` links | Build index promised routes that did not resolve | Validate generated promises in their actual mode | Source/build/live link rules with retained target evidence | `CONFIRMED`: reviewed private case-study history and URL-fix snapshots | Standardize evidence, not paths |
| `llms.txt` directive discoverability | Deep pages did not advertise the index | Discovery needs entry points beyond root convention | Page-level discovery-signal rule for HTML and Markdown | `CONFIRMED`: named baseline failure and directive snapshot | Follow external relations where stable |
| Markdown parity | Machine representation lost visible content | Representation is a build and live artifact | Versioned parity rule with bounded semantic evidence | `CONFIRMED`: PR #548/#564 chronology and parity utilities | Standardize evidence contract, not one algorithm |
| MDX component serialization | Interactive states disappeared during export | Framework components need explicit export strategies | Adapter source diagnosis plus generic live parity symptoms | `CONFIRMED`: serializer and `MarkdownIgnore` snapshots | Keep implementation adapter-specific |
| Oversized RPC pages | One large reference exceeded consumer budgets | Preserve detail while changing retrieval topology | Separate HTML, extracted, Markdown, and consumed-size rules with project budgets | `CONFIRMED`: PR #567 changes; exclusive score causation not claimed | Do not standardize Rootstock sizes |
| Content-start position | Useful content appeared after excessive chrome | Position consumes retrieval budget independently of total size | Versioned content-root measurement | `CONFIRMED`: April baseline and targeted fixes | Version algorithm; configure policy |
| Sitemap and `llms.txt` mismatch | Discovery artifacts represented different sets | Normalize and compare published inventories | Missing, extra, duplicate, excluded, and coverage outputs | `CONFIRMED`: baseline and coverage-audit snapshot | Standardize set outputs, not threshold |
| Production deployment lag | Merged and built changes were not live | Deployment is a distinct proof boundary | Expected build/live canary comparison and deployment provenance | `PARTIALLY_CONFIRMED`: PR #568 intent and chronology | Standardize trust labels, not provider |
| Local artifact drift | Stored score did not always match current evaluated state | Results need content-addressed time and version identity | Raw result digest, supersession, evaluator version, and timestamp | `CONFIRMED`: timeline caveat and score artifact | Standardize provenance fields |
| CI artifact validation | Machine outputs could regress as docs changed | Enforce invariants after their producing stage | Generic CI policy with build reports and stable exits | `CONFIRMED`: Rootstock verify workflow and scripts | Standardize exits, not CI vendor |
| Evaluator version differences | Fern and local AFDocs versions differed | External results remain version-bound | Versioned evaluator adapter, raw output, and incompatible comparison handling | `CONFIRMED`: Fern 0.10.7 display versus local AFDocs 0.18.7 | Standardize adapter contract only |
