# Docs Agent Readiness Toolkit Rule Catalog

## Document status

This Phase 2 catalog for `docs-agent-readiness-toolkit` specifies the wider rule
inventory. The prototype implements only its Tier 0 subset. `DART-*` rule IDs remain
provisional until a stable schema freezes or migrates the public namespace.

The catalog separates three sets:

1. Deterministic rules the toolkit should build because they support source, build,
   live, or cross-mode engineering diagnosis.
2. External evaluator rules the toolkit should integrate and preserve as external
   results.
3. Checks the toolkit should not rebuild because established tools own them or because
   the evidence does not justify deterministic MVP scope.

## Rule contract

Every implemented rule must declare:

- stable `rule_id` and independent `rule_version`;
- category and default severity;
- purpose and applicability;
- required evidence mode and inputs;
- deterministic detection logic;
- evidence and observed or expected measurements;
- failure condition;
- likely causes, labeled as inference;
- remediation and validation;
- documentation references;
- framework dependence and compatibility;
- automation state: detect, advise, patch, or external;
- implementation tier and lifecycle status.

Trusted shipped rules and rule packs register through a versioned interface without
core engine changes. MVP does not execute dynamic third-party code. A future extension
protocol requires process isolation and capability enforcement.

## Finding status and severity

Rule outcome and policy effect are separate.

| Status | Meaning |
| --- | --- |
| `PASS` | Required evidence was available and satisfied the rule |
| `WARN` | Evidence shows a non-blocking concern under the rule |
| `FAIL` | Evidence violates the configured expectation |
| `SKIP` | The rule was intentionally not executed, with a recorded reason |
| `NOT_APPLICABLE` | The rule does not apply to this target under declared logic |
| `UNAVAILABLE` | Required evidence could not be obtained |

`UNAVAILABLE`, `SKIP`, and `NOT_APPLICABLE` must never normalize to `PASS`.

Default severities are `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, and `INFO`. Projects map
severities and regression states to `BLOCKING`, `ADVISORY`, or `INFORMATIONAL` CI
policy. A severity override changes policy metadata, not the observed fact.

Headings and rule cards use title-case display names. Machine output serializes
categories as documented lowercase identifiers such as `discovery`,
`representation`, and `operational-readiness`.

## Common evidence requirements

All findings include target identity, evidence mode, observation time, rule version,
tool version, configuration hash, and safe evidence locations. Live findings include
the requested URL, final URL, status, relevant sanitized headers, and crawl timestamp.
Build findings include artifact path and digest. Source findings include repository
revision and repository-relative location where available.

Reports should not store full response bodies or source snippets by default. Redaction
is best effort and cannot guarantee that every secret is detected.

Evidence values are labeled `OBSERVED_BY_COLLECTOR`,
`DETERMINISTICALLY_DERIVED`, `USER_ASSERTED`, or `EXTERNALLY_ATTESTED`. Live
acquisition writes a content-addressed evidence bundle. Rules analyze that bundle
offline and do not fetch additional content.

Acquisition kind is independently `COLLECTED`, `IMPORTED`, `ASSERTED`, or
`ATTESTED`. Evidence records keep integrity, provenance, authenticity, and freshness
separate. A hash proves integrity only.

## Canonical implementation tiers

This table, not the size or order of the catalog, defines implementation priority.

| Tier | Scope | Catalog items |
| --- | --- | --- |
| Tier 0: Core MVP | Evidence, explicit identity, provenance, replay, comparison, regression, policy | DART-OPS-001, DART-OPS-002 using captured evidence, DART-OPS-003, DART-OPS-005 |
| Tier 1: Evidence enrichment | Representation, locale/version, canonical/host, additional mappings | DART-DISC-004, DART-REPR-001, DART-URL-003, DART-URL-004 |
| Tier 2: Live acquisition | Any network-dependent collection or rule | DISC/ACCESS/live REPR/SIZE/URL/OPS rules |
| Tier 3: External integrations | AFDocs, Vercel, and narrow validators | Recorded imports first; execution remains deferred |
| Tier 4: Framework diagnosis | Docusaurus, Mintlify, Fern, and other adapters | Source inference and component diagnosis |
| Tier 5: Task evaluation | Agent task outcomes | DART-TASK-001 |

MVP-0 implements the Tier 0 evidence foundation and explicit source-to-build identity
join. MVP-1 adds DART-OPS-005 and policy. Stage 2 imports AFDocs results. Stage 3 adds
bounded HTTP only after its security gate. Tier 1 through Tier 5 items are not
implemented merely because they are specified.

## Proposed deterministic rule inventory

### DART-DISC-001: Discovery index availability

- **Category and severity:** Discovery, `HIGH`.
- **Purpose:** Determine whether a configured machine-readable index is present.
- **Input and applicability:** Source declarations, build root, or allowed live origin;
  applies when `llms.txt` support is in project policy.
- **Detection:** Resolve configured candidate paths and verify a readable, non-empty
  artifact or successful bounded response.
- **Evidence:** Candidate path, mode, status, content type, and digest or size.
- **Failure:** No declared candidate is available.
- **Likely causes:** Generation disabled, wrong output path, stale deploy, or routing
  failure.
- **Remediation:** Enable an existing platform or generator feature, correct the route,
  then validate in build and live modes.
- **Validation:** Re-run in the failed mode and, after deployment, live mode.
- **Framework dependence:** Core rule; adapters supply candidate paths.
- **Tier and automation:** Tier 3 delegated integration, detect and advise.
- **AFDocs overlap:** Maps to `llms-txt-exists`; do not claim AFDocs conformance.
- **Notes:** Existence does not prove parseability, coverage, or usefulness.

### DART-DISC-002: Discovery index parseability

- **Category and severity:** Discovery, `HIGH`.
- **Purpose:** Verify that a declared index conforms to its configured format.
- **Input and applicability:** Index bytes plus selected format/version.
- **Detection:** Parse under a versioned grammar and report stable syntax issues.
- **Evidence:** Digest, parser version, issue code, line and column where safe.
- **Failure:** Required structure or links cannot be parsed.
- **Likely causes:** Hand-edit error, generator defect, unsupported proposal version.
- **Remediation:** Use the normative format or a compatible focused validator.
- **Validation:** Parse the same artifact and test its deployed representation.
- **Framework dependence:** Core parser or delegated validator.
- **Tier and automation:** Tier 3 delegated parser integration.
- **AFDocs overlap:** Maps to `llms-txt-valid`.
- **Notes:** Prefer integration if a candidate parser meets security and stability needs.

### DART-DISC-003: Discovery link resolution

- **Category and severity:** Discovery, `HIGH`.
- **Purpose:** Verify that same-scope index links resolve to usable targets.
- **Input and applicability:** Parsed index plus build route map or allowed live origin.
- **Detection:** Normalize links, apply scope and security policy, then test artifact
  existence or bounded HTTP response.
- **Evidence:** Source link location, normalized target, status, final URL, content type.
- **Failure:** Target is missing, blocked by policy, empty, or returns an error.
- **Likely causes:** Path rewrite, stale index, moved page, host mismatch.
- **Remediation:** Correct generation or redirects instead of hand-patching generated
  output unless the index is intentionally maintained.
- **Validation:** Re-run build and live checks.
- **Framework dependence:** Core; adapter may explain route mapping.
- **Tier and automation:** Tier 3 validator integration.
- **AFDocs overlap:** Maps to `llms-txt-links-resolve`.
- **Notes:** Cross-origin links need explicit scope and cannot bypass network controls.

### DART-DISC-004: Discovery set coverage

- **Category and severity:** Discovery, `MEDIUM`.
- **Purpose:** Compare the declared documentation set with index membership.
- **Input and applicability:** Normalized source/build/live route set, index links, and
  exclusions.
- **Detection:** Compute missing, extra, duplicate, and excluded URL sets.
- **Evidence:** Counts, bounded URL details, coverage measurement, exclusion reasons.
- **Failure:** Configured project policy is not met.
- **Likely causes:** Generator scope, missing generated hubs, locale exclusion, stale
  artifact.
- **Remediation:** Fix scope or document an intentional exception.
- **Validation:** Compare the same compatible sets.
- **Framework dependence:** Core set comparison; adapters discover source/build routes.
- **Tier and automation:** Tier 1 evidence enrichment.
- **AFDocs overlap:** Related to `llms-txt-coverage`.
- **Notes:** No universal coverage threshold. Rootstock's 95 percent was local policy.

### DART-DISC-005: Page discovery signal

- **Category and severity:** Discovery, `MEDIUM`.
- **Purpose:** Determine whether a page advertises a relevant index or machine form.
- **Input and applicability:** Build HTML/Markdown or live responses.
- **Detection:** Inspect configured HTML link elements, HTTP `Link` headers, and
  Markdown directives without executing content.
- **Evidence:** Relation, target URL, safe location, and response mode.
- **Failure:** Required signal is missing or points to an invalid target.
- **Likely causes:** Template omission, post-build injection error, stale response.
- **Remediation:** Use platform support or a reviewed template-level signal.
- **Validation:** Check HTML and Markdown independently.
- **Framework dependence:** Core detection; adapter remediation.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Maps to HTML and Markdown `llms-txt-directive` checks.
- **Notes:** An in-body mention is not automatically equivalent to a declared relation.

### DART-DISC-006: Sitemap availability and parseability

- **Category and severity:** Discovery, `MEDIUM`.
- **Purpose:** Establish a usable declared sitemap set.
- **Input and applicability:** Build artifact or allowed live URL.
- **Detection:** Parse bounded XML sitemap or sitemap index without external entity
  resolution.
- **Evidence:** URL, digest, item count, parse issues, child sitemap count.
- **Failure:** Required sitemap is missing, malformed, over limits, or unsafe to parse.
- **Likely causes:** Generator configuration or deployment routing.
- **Remediation:** Repair generation and declare scoped alternatives.
- **Validation:** Re-parse build output and deployed response.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 3 delegated parser integration.
- **AFDocs overlap:** Supports AFDocs freshness and coverage checks but is not a direct
  duplicate.
- **Notes:** Use hardened XML parsing and strict resource limits.

### DART-DISC-007: Robots and discovery interaction

- **Category and severity:** Access, `MEDIUM`.
- **Purpose:** Detect obvious conflicts between declared discovery resources and robots
  policy.
- **Input and applicability:** `robots.txt`, target user-agent policy, and index URLs.
- **Detection:** Parse applicable groups and identify disallowed machine resources.
- **Evidence:** Sanitized directive, agent group, affected path.
- **Failure:** Project policy requires access but the declared resource is disallowed.
- **Likely causes:** Broad deny rule or environment-specific robots file.
- **Remediation:** Review access intent. Do not weaken a deliberate privacy policy only
  to improve a readiness result.
- **Validation:** Re-evaluate policy and fetch behavior.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Adjacent to discoverability; narrower validators also overlap.
- **Notes:** Robots policy does not prove indexing or compliance by agents.

### DART-ACCESS-001: Public accessibility

- **Category and severity:** Access, `HIGH`.
- **Purpose:** Determine whether targets declared public are reachable without an
  unexpected authentication or challenge barrier.
- **Input and applicability:** Allowed live targets and explicit access policy.
- **Detection:** Inspect bounded status, redirects, headers, and inert login/challenge
  signatures with a versioned classifier.
- **Evidence:** Requested/final URL, status, redirect class, and safe signature.
- **Failure:** A public target is gated or returns an access challenge.
- **Likely causes:** SSO middleware, bot challenge, environment protection, or policy
  mismatch.
- **Remediation:** Confirm access intent before changing controls. Correct accidental
  gates or publish an approved machine-access alternative.
- **Validation:** Repeat an unauthenticated request profile from the declared
  environment.
- **Framework dependence:** Core live symptom; hosting adapter may identify cause.
- **Tier and automation:** Tier 2 after classifier fixtures.
- **AFDocs overlap:** Maps to `auth-gate-detection`.
- **Notes:** One successful client does not prove access from every network or agent.

### DART-ACCESS-002: Alternative access declaration

- **Category and severity:** Access, `MEDIUM`.
- **Purpose:** Verify a declared machine-access path when primary documentation is
  intentionally gated.
- **Input and applicability:** Access policy and configured alternative target; applies
  only when a gate is intentional.
- **Detection:** Validate that the alternative is declared, in scope, safe to request,
  and usable under its stated mechanism.
- **Evidence:** Policy reference, alternative identity, mode, and observed availability.
- **Failure:** A required alternative is absent, invalid, or unavailable.
- **Likely causes:** Stale public mirror, missing export, or undocumented access design.
- **Remediation:** Publish or repair an approved alternative without weakening
  deliberate access controls.
- **Validation:** Audit the alternative in its declared mode.
- **Framework dependence:** Core policy rule.
- **Tier and automation:** Tier 2 after access-policy usability research.
- **AFDocs overlap:** Maps to `auth-alternative-access`.
- **Notes:** Returns `NOT_APPLICABLE` for intentionally public sites with no gate.

### DART-REPR-001: Markdown artifact availability

- **Category and severity:** Representation, `HIGH`.
- **Purpose:** Verify a declared machine representation for each target route.
- **Input and applicability:** Route inventory and build artifacts or live endpoints.
- **Detection:** Apply configured route mapping and verify non-empty Markdown content.
- **Evidence:** Page identity, artifact or URL, content type, digest, size.
- **Failure:** Required counterpart is absent or unusable.
- **Likely causes:** Export scope, generated page omission, route mapping.
- **Remediation:** Enable platform export or add adapter-specific generation guidance.
- **Validation:** Re-run build and live mapping.
- **Framework dependence:** Core check with adapter route mapping.
- **Tier and automation:** Tier 1 evidence enrichment.
- **AFDocs overlap:** Related to `markdown-url-support`.
- **Notes:** Source Markdown is not proof of build or live availability.

### DART-REPR-002: Markdown suffix route

- **Category and severity:** Representation, `MEDIUM`.
- **Purpose:** Verify configured `.md` route behavior.
- **Input and applicability:** Allowed live page URLs or build route map.
- **Detection:** Derive configured suffix candidate and inspect response or artifact.
- **Evidence:** Request, final URL, status, content type, size.
- **Failure:** Required route is missing, redirects incorrectly, or serves HTML.
- **Likely causes:** Hosting rewrite, suffix mapping, stale deployment.
- **Remediation:** Use platform routing support and canonical headers.
- **Validation:** Fetch the exact deployed route.
- **Framework dependence:** Core with hosting guidance adapter.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Maps to `markdown-url-support`.
- **Notes:** A suffix route is optional if project policy uses another stable mechanism.

### DART-REPR-003: Content negotiation

- **Category and severity:** Representation, `MEDIUM`.
- **Purpose:** Verify that an explicit Markdown `Accept` request receives the declared
  representation without breaking default HTML.
- **Input and applicability:** Allowed live page URL.
- **Detection:** Compare bounded default and negotiated requests, content types, and
  `Vary` behavior.
- **Evidence:** Request headers, sanitized response headers, digests and final URLs.
- **Failure:** Required negotiation is ignored, misrouted, or cache-unsafe.
- **Likely causes:** Middleware ordering, host rewrite, cache configuration.
- **Remediation:** Configure request negotiation and `Vary` through the platform.
- **Validation:** Test both representations through deployed delivery.
- **Framework dependence:** Core live rule; hosting adapters advise.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Maps to `content-negotiation`.
- **Notes:** Do not rely only on user-agent detection.

### DART-REPR-004: Representation content type

- **Category and severity:** Representation, `HIGH`.
- **Purpose:** Detect HTML shells or other content served from machine routes.
- **Input and applicability:** Build metadata or live response.
- **Detection:** Compare declared route type, response header, and bounded content
  signature.
- **Evidence:** Content type, first safe structural tokens, size, final URL.
- **Failure:** Representation does not match its declared type.
- **Likely causes:** fallback routing, soft 404, CDN error page.
- **Remediation:** Correct routing and error behavior.
- **Validation:** Fetch with cache-bypass policy where safe and compare expected type.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Partial overlap across Markdown and status checks.
- **Notes:** Never execute returned scripts.

### DART-REPR-005: HTML and machine-representation parity

- **Category and severity:** Representation, `HIGH`.
- **Purpose:** Detect material missing or duplicated semantic content.
- **Input and applicability:** Paired HTML and machine representation from the same
  compatible build or live deployment.
- **Detection:** Normalize visible headings, prose, links, code, and configured semantic
  blocks; report differences and algorithm version.
- **Evidence:** Bounded missing/extra block fingerprints and aggregate measurements.
- **Failure:** Configured parity tolerance is exceeded.
- **Likely causes:** component serialization, stale output, selective exclusion.
- **Remediation:** Serialize, replace, split, or intentionally exclude with review.
- **Validation:** Compare paired outputs again and inspect affected blocks.
- **Framework dependence:** Core comparison; adapter improves cause diagnosis.
- **Tier and automation:** Tier 1 or later, conservative advisory default.
- **AFDocs overlap:** Maps to `markdown-content-parity`.
- **Notes:** Approximation cannot establish semantic equivalence or factual correctness.

### DART-REPR-006: Component representation declaration

- **Category and severity:** Structure, `MEDIUM`.
- **Purpose:** Identify source components that require a declared export strategy.
- **Input and applicability:** Source mode through a framework adapter.
- **Detection:** Match adapter-known component types and verify configured strategy.
- **Evidence:** Repository-relative location and component identifier.
- **Failure:** A known lossy component has no strategy.
- **Likely causes:** New component or incomplete adapter configuration.
- **Remediation:** Serialize, replace, split, or explicitly exclude.
- **Validation:** Build then run parity checks.
- **Framework dependence:** Adapter rule only.
- **Tier and automation:** Tier 4, detect and advise.
- **AFDocs overlap:** AFDocs detects some live serialization effects, not source cause.
- **Notes:** Not in initial MVP core.

### DART-SIZE-001: Raw HTML response size

- **Category and severity:** Retrieval efficiency, `LOW`.
- **Purpose:** Measure the HTML bytes delivered before extraction or rendering.
- **Input and applicability:** Build HTML or live response.
- **Detection:** Count bounded bytes and compare configured policy.
- **Evidence:** Compressed and decompressed bytes when available.
- **Failure:** Project budget exceeded.
- **Likely causes:** embedded data, bundles, navigation, duplicated content.
- **Remediation:** Reduce delivery overhead or offer a better machine representation.
- **Validation:** Re-measure the same mode.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 measurement pack.
- **AFDocs overlap:** Partial `page-size-html`.
- **Notes:** Raw HTML size must not stand in for extracted content size.

### DART-SIZE-002: Extracted HTML content size

- **Category and severity:** Retrieval efficiency, `MEDIUM`.
- **Purpose:** Measure the text representation derived from HTML.
- **Input and applicability:** Bounded static or rendered HTML under configured parser.
- **Detection:** Extract inert content and count bytes, characters, or estimated tokens.
- **Evidence:** Parser version and measurement.
- **Failure:** Configured budget exceeded.
- **Likely causes:** long reference page or duplicated hidden states.
- **Remediation:** Split content or improve machine route.
- **Validation:** Re-run with the same parser version.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 for captured HTML; browser rendering is later.
- **AFDocs overlap:** Partial `page-size-html`.
- **Notes:** Rendered browser mode has a larger attack and resource surface.

### DART-SIZE-003: Markdown size

- **Category and severity:** Retrieval efficiency, `MEDIUM`.
- **Purpose:** Measure a Markdown artifact or response independently.
- **Input and applicability:** Build or live Markdown.
- **Detection:** Count bytes and characters; optional token estimate is separately
  versioned.
- **Evidence:** Digest, byte and character counts, configured budget.
- **Failure:** Project budget exceeded.
- **Likely causes:** oversized topic, duplicated component states, concatenated index.
- **Remediation:** Split by user intent, deduplicate, or provide layered indexes.
- **Validation:** Re-measure and check link integrity.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 measurement pack.
- **AFDocs overlap:** Maps to `page-size-markdown`.
- **Notes:** Rootstock's 49K trim is not a default.

### DART-SIZE-004: Agent-consumed representation size

- **Category and severity:** Retrieval efficiency, `MEDIUM`.
- **Purpose:** Measure the representation selected by a declared consumer profile.
- **Input and applicability:** Runtime observation or deterministic request profile.
- **Detection:** Record selected route, content type, transformations, and final size.
- **Evidence:** Consumer profile version and response lineage.
- **Failure:** Configured consumer budget exceeded.
- **Likely causes:** negotiation miss or representation-selection error.
- **Remediation:** Correct selection or publish a bounded alternative.
- **Validation:** Repeat the same profile.
- **Framework dependence:** Core profile plus optional adapter.
- **Tier and automation:** Tier 2 or later.
- **AFDocs overlap:** Partial.
- **Notes:** Deterministic request simulation is not proof of every actual agent.

### DART-SIZE-005: Content-start position

- **Category and severity:** Retrieval efficiency, `MEDIUM`.
- **Purpose:** Measure how much representation precedes meaningful page content.
- **Input and applicability:** HTML extraction or Markdown.
- **Detection:** Apply a versioned content-root and boilerplate algorithm.
- **Evidence:** Offset, percentage, selected content root, parser version.
- **Failure:** Configured policy exceeded.
- **Likely causes:** navigation chrome, banner, metadata, weak lead structure.
- **Remediation:** expose a cleaner representation or lead with substantive content.
- **Validation:** Re-run and review the selected content root.
- **Framework dependence:** Core; adapters identify layout causes.
- **Tier and automation:** Tier 2 or later, advisory initially.
- **AFDocs overlap:** Maps to `content-start-position`.
- **Notes:** Algorithm changes make baselines incompatible unless migrated.

### DART-SIZE-006: Discovery index size

- **Category and severity:** Retrieval efficiency, `MEDIUM`.
- **Purpose:** Measure each index separately from page payloads.
- **Input and applicability:** Build or live index.
- **Detection:** Count bytes and characters against configured project budgets.
- **Evidence:** Index identity, digest, measurements, policy.
- **Failure:** Budget exceeded.
- **Likely causes:** flat index growth, verbose descriptions, duplicates.
- **Remediation:** Curate, partition, or use hierarchical indexes supported by consumers.
- **Validation:** Parse, resolve, and coverage-check the revised indexes.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 measurement pack.
- **AFDocs overlap:** Maps to `llms-txt-size`.
- **Notes:** Rootstock's 50K guard is not a default.

### DART-STR-001: Heading structure

- **Category and severity:** Structure, `LOW`.
- **Purpose:** Detect missing primary headings, invalid jumps, and empty sections.
- **Input and applicability:** Source, build Markdown, or inert HTML.
- **Detection:** Parse headings under a versioned format-specific algorithm.
- **Evidence:** Heading path and safe location.
- **Failure:** Configured structural constraints fail.
- **Likely causes:** component output or source hierarchy.
- **Remediation:** Correct hierarchy without adding meaningless headings.
- **Validation:** Re-parse and inspect navigation.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 3 delegated lint integration.
- **AFDocs overlap:** Partial `section-header-quality`.
- **Notes:** A heading count is not writing-quality evidence.

### DART-STR-002: Code-fence validity

- **Category and severity:** Structure, `MEDIUM`.
- **Purpose:** Ensure Markdown code fences are balanced and parseable.
- **Input and applicability:** Source or generated Markdown.
- **Detection:** Parse fences and report unclosed or conflicting delimiters.
- **Evidence:** Repository-relative or artifact-relative line.
- **Failure:** Parser identifies malformed fences.
- **Likely causes:** embedded examples or serializer output.
- **Remediation:** Repair source or serialization.
- **Validation:** Parse source and generated output.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 3 delegated lint integration.
- **AFDocs overlap:** Maps to `markdown-code-fence-validity`.
- **Notes:** Delegate generic Markdown parsing where possible.

### DART-STR-003: Hidden-state serialization

- **Category and severity:** Structure, `HIGH`.
- **Purpose:** Detect missing or explosively duplicated tab and accordion content.
- **Input and applicability:** Paired HTML/Markdown, optionally adapter source evidence.
- **Detection:** Compare configured state labels and semantic blocks.
- **Evidence:** Missing/extra state fingerprints and affected target.
- **Failure:** Required states are absent or duplication exceeds policy.
- **Likely causes:** serializer or rendered-DOM extraction behavior.
- **Remediation:** serialize states once with headings or split them.
- **Validation:** Parity and size checks.
- **Framework dependence:** Core symptom, adapter cause.
- **Tier and automation:** Tier 1 advisory; Tier 4 source diagnosis.
- **AFDocs overlap:** Maps to `tabbed-content-serialization`.
- **Notes:** Accordions and tabs remain separate evidence even if one policy covers both.

### DART-STR-004: Content order, duplication, and omission

- **Category and severity:** Structure, `MEDIUM`.
- **Purpose:** Detect material reordering, duplication, or omission in a paired machine
  representation.
- **Input and applicability:** Compatible HTML and Markdown semantic block sequences.
- **Detection:** Compare versioned block fingerprints and order while ignoring declared
  chrome.
- **Evidence:** Bounded missing, repeated, and moved block identities.
- **Failure:** Configured structural tolerance is exceeded.
- **Likely causes:** component expansion, repeated generated navigation, or post-build
  transformation.
- **Remediation:** Correct serialization or declare a reviewed non-semantic difference.
- **Validation:** Re-run parity, order, and size checks on the same pair.
- **Framework dependence:** Core symptom; adapter likely-cause guidance.
- **Tier and automation:** Tier 1 or later as advisory.
- **AFDocs overlap:** Partial overlap with parity and tabbed-content checks.
- **Notes:** This rule does not judge prose quality.

### DART-URL-001: Redirect integrity

- **Category and severity:** URL integrity, `HIGH`.
- **Purpose:** Detect loops, excessive hops, disallowed host changes, and unsafe targets.
- **Input and applicability:** Allowed live URL set.
- **Detection:** Validate DNS/address before each bounded redirect and record chain.
- **Evidence:** Sanitized hop sequence, status, final canonical target.
- **Failure:** Policy or safety limit violated.
- **Likely causes:** host migration, rewrite chain, stale canonical.
- **Remediation:** collapse or correct redirects.
- **Validation:** Re-fetch from a clean client.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Maps to `redirect-behavior`.
- **Notes:** Safety validation precedes request execution.

### DART-URL-002: Soft 404

- **Category and severity:** URL integrity, `HIGH`.
- **Purpose:** Detect error content returned with a success status.
- **Input and applicability:** Known invalid probes and live page responses.
- **Detection:** Compare status, canonical behavior, and bounded error signatures using a
  versioned algorithm.
- **Evidence:** Probe path class, status, title or safe signature.
- **Failure:** Invalid route returns misleading success content.
- **Likely causes:** single-page fallback or hosting rewrite.
- **Remediation:** return correct 404 or 410 response for missing machine and HTML routes.
- **Validation:** Probe representative invalid paths.
- **Framework dependence:** Core; adapter guidance.
- **Tier and automation:** Tier 2 after classifier fixtures.
- **AFDocs overlap:** Maps to `http-status-codes`.
- **Notes:** Probes must be harmless and bounded.

### DART-URL-003: Canonical and host identity

- **Category and severity:** URL integrity, `MEDIUM`.
- **Purpose:** Keep requested, final, canonical, index, and sitemap hosts consistent with
  policy.
- **Input and applicability:** Build metadata or live response set.
- **Detection:** Normalize and compare identities, including Markdown canonical headers.
- **Evidence:** Requested, final, and declared canonical URLs.
- **Failure:** Disallowed host drift or contradictory canonicals.
- **Likely causes:** preview host leak, migration, base URL configuration.
- **Remediation:** correct base URLs, redirects, and canonical declarations.
- **Validation:** Rebuild and re-crawl.
- **Framework dependence:** Core; adapters locate config.
- **Tier and automation:** Tier 1 evidence enrichment.
- **AFDocs overlap:** Partial redirect and discovery overlap.
- **Notes:** Intentional cross-host content requires an explicit exception.

### DART-URL-004: Locale and version preservation

- **Category and severity:** URL integrity, `MEDIUM`.
- **Purpose:** Detect routing that loses declared locale or version identity.
- **Input and applicability:** Route inventory, paired representations, redirect chains.
- **Detection:** Compare configured locale/version dimensions through route transitions.
- **Evidence:** Input and output dimensions plus route.
- **Failure:** Required dimension is dropped or mapped incorrectly.
- **Likely causes:** generic rewrite, default locale fallback, stale index.
- **Remediation:** correct route mapping and regenerate indexes.
- **Validation:** Matrix test selected locales and versions.
- **Framework dependence:** Core dimension model; adapter discovery.
- **Tier and automation:** Tier 1; Tier 4 adapters may enrich mappings.
- **AFDocs overlap:** AFDocs 0.19.0 added locale handling; preserve external mapping.
- **Notes:** Missing translations and routing loss are different findings.

### DART-URL-005: Markdown link integrity

- **Category and severity:** URL integrity, `HIGH`.
- **Purpose:** Validate links embedded in machine representations, independently of
  discovery-index links.
- **Input and applicability:** Source or build Markdown and allowed live targets.
- **Detection:** Parse links, normalize relative references in context, verify local
  artifacts or bounded live responses, and preserve fragment checks separately.
- **Evidence:** Safe source location, normalized target, status, final URL, and fragment
  outcome.
- **Failure:** Required link or fragment is missing, unsafe, or resolves to an unusable
  representation.
- **Likely causes:** moved page, generated route mismatch, anchor change, or locale loss.
- **Remediation:** Correct the source link, redirect, route mapping, or generated
  representation as appropriate to the failed mode.
- **Validation:** Re-run in source/build and live modes as applicable.
- **Framework dependence:** Core parser and resolver.
- **Tier and automation:** Tier 3 delegated/scoped link integration.
- **AFDocs overlap:** AFDocs tests sampled index-linked pages, not a generic full
  Markdown link inventory.
- **Notes:** A full-site crawler should be delegated; this rule checks declared scoped
  representations.

### DART-URL-006: Route stability against baseline

- **Category and severity:** URL integrity, `MEDIUM`.
- **Purpose:** Detect removed or changed canonical routes across compatible inventories.
- **Input and applicability:** Current and baseline route sets with locale/version
  dimensions.
- **Detection:** Compare normalized identities and approved redirects.
- **Evidence:** Previous route, current state, redirect/canonical target, baseline ID.
- **Failure:** A previously supported route disappears or changes outside policy.
- **Likely causes:** information architecture change, slug generation, or version
  retirement.
- **Remediation:** Restore the route, add an approved redirect, or record a reviewed
  deprecation.
- **Validation:** Run baseline comparison and live redirect checks.
- **Framework dependence:** Core comparison; adapter route discovery.
- **Tier and automation:** Tier 1 after MVP-1.
- **AFDocs overlap:** Partial URL-stability overlap without historical baseline.
- **Notes:** Site structure changes require compatibility review, not automatic failure.

### DART-OPS-001: Source-to-build inventory drift

- **Category and severity:** Operational readiness, `HIGH`.
- **Purpose:** Identify intended source pages that do not produce expected artifacts.
- **Input and applicability:** Compatible source and build inventories.
- **Detection:** Validate an explicitly supplied source-to-build mapping and both
  referenced evidence records. The generic core does not infer paths.
- **Evidence:** Source location, expected route/artifact, observed build state.
- **Failure:** Required artifact is missing, duplicated, or unexpectedly changed.
- **Likely causes:** draft state, generator exclusion, build plugin failure.
- **Remediation:** correct configuration or declare an exception.
- **Validation:** Rebuild from recorded revision.
- **Framework dependence:** None for explicit mappings; Tier 4 adapters may infer later.
- **Tier and automation:** Tier 0, MVP-0.
- **AFDocs overlap:** None; AFDocs is live-oriented.
- **Notes:** This is a key toolkit differentiator.

### DART-OPS-002: Build-to-live drift

- **Category and severity:** Operational readiness, `CRITICAL`.
- **Purpose:** Detect when deployed content does not match the expected build.
- **Input and applicability:** Selected build artifacts and captured LIVE evidence with
  an explicit identity relationship. No HTTP is performed.
- **Detection:** Compare stable digests or normalized representations for configured
  canary targets.
- **Evidence:** Build digest, live digest, deploy ID, target, timestamp, and trust label
  for every supplied identity.
- **Failure:** Compatible expected and observed outputs differ beyond policy.
- **Likely causes:** stale deployment, wrong artifact, cache, environment rewrite.
- **Remediation:** inspect deployment lineage and routing before changing documentation.
- **Validation:** Redeploy or correct identity, then re-check.
- **Framework dependence:** None for captured evidence; Tier 4 adapters may enrich it.
- **Tier and automation:** Tier 0 canary using recorded LIVE evidence.
- **AFDocs overlap:** None.
- **Notes:** Report `UNAVAILABLE` when the join cannot be established. A user-asserted
  deployment ID is not verified lineage.

### DART-OPS-003: Provenance metadata and trust completeness

- **Category and severity:** Operational readiness, `HIGH`.
- **Purpose:** Ensure a run records available input lineage and how each identity was
  obtained.
- **Input and applicability:** Run metadata and evidence records.
- **Detection:** Validate acquisition kind, required provenance/trust fields, the four
  evidence properties, and run-level evidence completeness by requested mode.
- **Evidence:** Missing-field list and available identifiers.
- **Failure:** Required lineage is absent.
- **Likely causes:** CI integration or adapter does not expose identity.
- **Remediation:** configure revision, build, deployment, and artifact metadata.
- **Validation:** Validate report schema.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 0, MVP-0.
- **AFDocs overlap:** None; adapter augments raw results.
- **Notes:** Metadata completeness does not prove authenticity. Self-asserted
  verification flags are not evidence. Identity status describes a relationship
  between targets, while authenticity describes evidence's claimed origin.
  DART-OPS-003 does not establish a relationship and keeps its required
  `identity_status` as `IDENTITY_UNVERIFIED`; DART-OPS-001 and DART-OPS-002 own
  relationship findings.

### DART-OPS-004: Cache and representation variance

- **Category and severity:** Integrity and consistency, `MEDIUM`.
- **Purpose:** Detect cache behavior that can serve the wrong representation.
- **Input and applicability:** Live HTML and negotiated responses.
- **Detection:** Inspect relevant cache and `Vary` headers and compare repeated bounded
  requests where configured.
- **Evidence:** Sanitized headers, request profile, response digest.
- **Failure:** Configured negotiation cache policy is violated.
- **Likely causes:** missing `Vary`, CDN rule, stale edge object.
- **Remediation:** correct platform cache configuration.
- **Validation:** Repeat both request profiles after cache turnover.
- **Framework dependence:** Core detection; hosting adapter remediation.
- **Tier and automation:** Tier 2 live acquisition.
- **AFDocs overlap:** Maps to `cache-header-hygiene`.
- **Notes:** Header presence alone cannot prove all cache behavior.

## Regression and later-stage rules

### DART-OPS-005: Baseline regression

- **Category and severity:** Operational readiness, policy-derived.
- **Purpose:** Classify compatible finding and measurement changes.
- **Input and applicability:** Current and selected baseline reports.
- **Detection:** Validate compatibility, join stable fingerprints, then emit `NEW`,
  `RESOLVED`, `CHANGED`, `UNCHANGED`, or `INCOMPATIBLE`. `CHANGED` records
  previous and current status.
- **Evidence:** Both finding identities, versions, and comparison rationale.
- **Failure:** Configured regression policy is violated.
- **Likely causes:** Underlying documentation change or rule/config change.
- **Remediation:** Fix the defect, approve an exception, or establish a new baseline
  through review.
- **Validation:** Recompare compatible reports.
- **Framework dependence:** Core.
- **Tier and automation:** Tier 0, MVP-1.
- **AFDocs overlap:** None.
- **Notes:** Compatibility includes exact 0.x evaluator version, specification version,
  adapter mapping version, rule implementation digest, parser/canonicalizer version,
  rule-specific configuration, target inventory, and evidence mode. Removed targets and
  unavailable evidence are not automatically resolved. Parser, canonicalizer, and
  identity-algorithm changes emit `PARSER_VERSION_CHANGED`,
  `CANONICALIZER_VERSION_CHANGED`, and `IDENTITY_ALGORITHM_CHANGED` respectively.
  A baseline external check absent from current imported evidence is `INCOMPATIBLE`
  with `EXTERNAL_CHECK_UNAVAILABLE`, not `RESOLVED`.

### DART-OPS-006: External evaluator availability

- **Category and severity:** Operational readiness, `INFO` by default.
- **Purpose:** Preserve evaluator outage or execution failure as evidence.
- **Input and applicability:** Configured evaluator adapter.
- **Detection:** Validate the recorded-result import contract. Invocation is deferred.
- **Evidence:** Adapter/evaluator version, timestamp, sanitized error.
- **Failure:** Only blocking when explicitly configured as required.
- **Likely causes:** outage, version mismatch, network, invalid configuration.
- **Remediation:** restore evaluator or run local deterministic checks.
- **Validation:** Successful version-bound recorded import.
- **Framework dependence:** Evaluator adapter.
- **Tier and automation:** Tier 3.
- **AFDocs overlap:** Adapter operational rule, not an AFDocs check.
- **Notes:** Never convert outage to pass.

### DART-TASK-001: Defined task completion

- **Category and severity:** Task usefulness, project-defined.
- **Purpose:** Record whether a named agent completes a defined task.
- **Input and applicability:** Approved fixture, agent/runtime, model, tools, and success
  oracle.
- **Detection:** Separate task harness outside deterministic readiness core.
- **Evidence:** Versioned fixture, trace reference, outcome, cost and time where allowed.
- **Failure:** Task oracle not met.
- **Likely causes:** Documentation, model, tools, environment, or task design.
- **Remediation:** Requires human diagnosis.
- **Validation:** Repeat controlled evaluation.
- **Framework dependence:** Optional evaluator.
- **Tier and automation:** Tier 5.
- **AFDocs overlap:** None.
- **Notes:** Never infer universal task success.

## External evaluator rules to integrate

AFDocs remains the initial evaluator candidate. The adapter preserves evaluator name,
version, target, time, raw output, score, check IDs, statuses, fix suggestions, and an
adapter-owned normalized mapping. It does not reissue AFDocs findings under `DART-*`
identities unless a distinct toolkit rule independently observes the fact.

| External check | Integration treatment | Related toolkit evidence |
| --- | --- | --- |
| `llms-txt-exists` | Preserve raw; correlate, do not replace | DART-DISC-001 |
| `llms-txt-valid` | Preserve raw; parser may be delegated | DART-DISC-002 |
| `llms-txt-size` | Preserve score threshold separately | DART-SIZE-006 measurement |
| `llms-txt-links-resolve` | Preserve sample and version | DART-DISC-003 |
| `llms-txt-links-markdown` | Preserve raw representation preference | DART-REPR-001/002 |
| `llms-txt-directive-html` | Preserve sampled page result | DART-DISC-005 |
| `llms-txt-directive-md` | Preserve sampled page result | DART-DISC-005 |
| `markdown-url-support` | Preserve sampled live result | DART-REPR-002 |
| `content-negotiation` | Preserve sampled live result | DART-REPR-003 |
| `rendering-strategy` | Preserve raw; no source inference | DART-SIZE-002 context |
| `page-size-markdown` | Preserve evaluator threshold | DART-SIZE-003 measurement |
| `page-size-html` | Preserve evaluator algorithm/version | DART-SIZE-001/002 |
| `content-start-position` | Preserve algorithm/version | DART-SIZE-005 |
| `tabbed-content-serialization` | Preserve symptom | DART-STR-003 |
| `section-header-quality` | Preserve raw and applicability | DART-STR-001 partial |
| `markdown-code-fence-validity` | Preserve raw | DART-STR-002 |
| `http-status-codes` | Preserve probes | DART-URL-002 |
| `redirect-behavior` | Preserve chains and policy | DART-URL-001 |
| `llms-txt-coverage` | Preserve discovered sets and threshold | DART-DISC-004 |
| `llms-txt-freshness` | Preserve historical raw ID when emitted by that evaluator version | DART-DISC-004 |
| `markdown-content-parity` | Preserve algorithm/version | DART-REPR-005 |
| `cache-header-hygiene` | Preserve raw headers safely | DART-OPS-004 |
| `auth-gate-detection` | Preserve sampled unauthenticated observation | DART-ACCESS-001 |
| `auth-alternative-access` | Preserve `SKIP` or applicability | DART-ACCESS-002 |

The exact external list and semantics must be read from the recorded evaluator version.
The table reflects AFDocs evidence available on 2026-09-10 and is not a permanent
compatibility promise.

## Checks not to rebuild

| Capability | Owner or integration path | Reason not to rebuild |
| --- | --- | --- |
| Agent-Friendly Documentation Spec score | AFDocs | Existing reference implementation and scoring model |
| General `llms.txt` generation | Platforms and generator plugins | Generation is framework/product work, not toolkit core |
| Generic Markdown style lint | markdownlint, Vale, or project tool | Mature problem outside readiness-specific evidence |
| Generic full-site broken-link crawler | Existing link checkers | Integrate results or use bounded target checks |
| OpenAPI correctness | Spectral, Redocly, platform validators | Distinct specification and mature tool ecosystem |
| Factual and product correctness | Human and domain evaluators | Not deterministically inferable from delivery artifacts |
| Writing quality | Human review or optional evaluator | Separate from agent accessibility |
| Universal citation or ranking | No deterministic owner | Cannot be guaranteed by site checks |
| Autonomous documentation rewriting | Future opt-in patch workflow | High mutation and correctness risk |
| Agent task execution | Separate task harness | Different evidence mode and dependencies |
| Hosted monitoring dashboard | Existing observability products | Not required for a local-first MVP |

## Framework strategy

Core rules parse captured generic files, route inventories, and HTTP responses.
Trusted shipped adapters may statically inspect configuration without loading or
executing it. Adapters may:

- discover Docusaurus, Mintlify, Fern, static Markdown, or custom framework config;
- map source identities to output artifacts and routes;
- identify framework components associated with a parity symptom;
- supply likely causes and configuration-specific remediation;
- collect build or deployment identity through a documented interface.

Adapters must not change core status semantics, bypass network policy, inherit
credentials, execute framework configuration, or mark findings resolved. MVP does not
load dynamic third-party adapter code. A missing adapter reduces diagnosis depth but
must not prevent recorded evidence analysis.

## Rule lifecycle

Rule lifecycle states are `EXPERIMENTAL`, `STABLE`, `DEPRECATED`, and `REMOVED`.

- Experimental rules may change identity before a stable release and are advisory.
- Stable rule detection semantics change only with a new `rule_version`.
- Deprecated rules remain readable for at least one documented compatibility window.
- Removed rules remain representable in historical reports.

Threshold changes require a configuration change or rule-version change. Severity
changes are policy metadata and must still be recorded. A rule ID must never be reused
for different detection semantics.

## Open questions

- `DECISION_REQUIRED`: Which `DART-*` prefix should become the public stable namespace
  if the executable uses another name?
- `SOURCE_REQUIRED`: Which focused parser can be safely reused after dependency and
  hostile-input review?
- `DECISION_REQUIRED`: Which MVP rules default to advisory during the first stable
  release?
- `STAKEHOLDER_REQUIRED`: Which target inventories and exclusions writers can maintain
  without platform support?
- `FUTURE`: Whether browser-rendered evidence belongs in the core or an isolated
  adapter.
- `OUT_OF_SCOPE`: Universal semantic quality, factual certification, and autonomous
  execution.
