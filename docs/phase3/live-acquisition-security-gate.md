# Live Acquisition Security Gate

## Status

This is the blocking security specification for Stage 3 of
`docs-agent-readiness-toolkit`. The current prototype has no HTTP collector. The
offline analyzer must not use network, DNS, socket, browser, child-process, repository
hook, or dynamic-plugin capabilities.

Stage 3 cannot start until this matrix is executable, reviewed, and explicitly
approved. Passing it will support only the named controls. It will not establish a
general "security clean" claim.

## Architecture invariant

```text
LOCAL COLLECTORS
        |
        v
EVIDENCE BUNDLE
        |
        v
OFFLINE ANALYZER
        |
        v
FINDINGS
```

The future path is:

```text
BOUNDED HTTP COLLECTOR
        |
        v
EVIDENCE BUNDLE
        |
        v
OFFLINE ANALYZER
```

Collectors collect evidence. The analyzer evaluates captured evidence. The analyzer
never touches the network.

## Gate conditions

Before implementation:

1. Every row below has an executable fixture and expected result.
2. Address validation behavior is defined for every supported runtime and proxy mode.
3. Limits have conservative defaults and hard maximums.
4. Redirect and DNS validation occur before every connection.
5. Compressed and decompressed byte accounting is tested.
6. Output sanitization is tested for every renderer.
7. A security review records residual risk and supported deployment assumptions.

## Required matrix

| Area | Threat or failure | Required control | Required test | Current status |
| --- | --- | --- | --- | --- |
| Network | Localhost SSRF | Reject names and all loopback addresses | IPv4, IPv6, aliases, encoded forms | BLOCKING_NOT_IMPLEMENTED |
| Network | RFC1918/private target | Reject private IPv4 and IPv6 ranges | Direct URL and resolved address | BLOCKING_NOT_IMPLEMENTED |
| Network | Link-local target | Reject link-local ranges | IPv4 and IPv6 fixtures | BLOCKING_NOT_IMPLEMENTED |
| Network | Cloud metadata | Reject known names and link-local addresses | Direct and redirected metadata target | BLOCKING_NOT_IMPLEMENTED |
| Network | Redirect to blocked target | Disable automatic redirects and revalidate | Public-to-private and public-to-metadata | BLOCKING_NOT_IMPLEMENTED |
| Network | Redirect chain | Cap hops and detect loops | Over-limit and cyclic chains | BLOCKING_NOT_IMPLEMENTED |
| Network | DNS rebinding | Pin or revalidate connected address | Changing answer and connection mismatch | BLOCKING_NOT_IMPLEMENTED |
| Network | Non-routable address | Reject unspecified, multicast, reserved, and documentation ranges | Address-family matrix | BLOCKING_NOT_IMPLEMENTED |
| Network | IPv4/IPv6 edge cases | Normalize before policy evaluation | Mapped IPv6, decimal, trailing dot, mixed forms | BLOCKING_NOT_IMPLEMENTED |
| Resource | Excessive crawl depth | Hard depth limit | Over-depth graph | BLOCKING_NOT_IMPLEMENTED |
| Resource | Excessive URL count | Hard run and per-origin limits | Expanding sitemap/navigation fixture | BLOCKING_NOT_IMPLEMENTED |
| Resource | Excessive concurrency | Central semaphore and hard maximum | Attempted configuration bypass | BLOCKING_NOT_IMPLEMENTED |
| Resource | Request timeout | Connect and header deadlines | Slow connection and slow headers | BLOCKING_NOT_IMPLEMENTED |
| Resource | Response timeout | Body and total-run deadlines | Slow body fixture | BLOCKING_NOT_IMPLEMENTED |
| Resource | Oversized response | Stream and stop before buffering limit | Content-Length and chunked bodies | BLOCKING_NOT_IMPLEMENTED |
| Resource | Oversized decompressed content | Separate compressed/decompressed limits | Small compressed bomb fixture | BLOCKING_NOT_IMPLEMENTED |
| Resource | Compression abuse | Expansion-ratio and encoding-depth limits | Nested and extreme-ratio fixtures | BLOCKING_NOT_IMPLEMENTED |
| Resource | Recursive/cyclic discovery | Visited-set and canonical URL bounds | Sitemap and redirect cycles | BLOCKING_NOT_IMPLEMENTED |
| Parser | Malformed HTML | Inert bounded parser | Truncated and deeply nested markup | BLOCKING_NOT_IMPLEMENTED |
| Parser | Malformed Markdown | Inert bounded parser | Unclosed fences and hostile links | BLOCKING_NOT_IMPLEMENTED |
| Parser | Hostile attributes | No event/script execution | Event handlers and dangerous URLs | BLOCKING_NOT_IMPLEMENTED |
| Parser | Output injection | Context-specific sanitization | ANSI, CI annotation, Markdown, JSON controls | BLOCKING_NOT_IMPLEMENTED |
| Parser | Script content | Treat scripts as data or omit them | Embedded commands and prompt text | BLOCKING_NOT_IMPLEMENTED |
| Parser | External entities | Disable external entity resolution | XXE and expansion fixtures | BLOCKING_NOT_IMPLEMENTED |
| Parser | Hostile sitemap | Bound and validate every discovered URL | Private URLs, recursion, malformed XML | BLOCKING_NOT_IMPLEMENTED |
| Filesystem | Path traversal | Root-relative normalized paths only | Dot segments and encoded separators | COVERED_OFFLINE |
| Filesystem | Symlink escape | Reject symlinked roots and path segments | File and parent symlink fixtures | COVERED_OFFLINE |
| Filesystem | Output escape | Separate explicit output root | Output inside or above evidence roots | COVERED_OFFLINE |
| Filesystem | Untrusted filename | Normalize Unicode and reject collisions/control characters | NFC collision and control fixtures | PARTIAL_OFFLINE |
| Execution | Arbitrary build command | No command field or child-process capability | Schema and import restriction tests | COVERED_OFFLINE |
| Execution | Repository hooks | Never invoke Git or package hooks | Static import and behavior tests | COVERED_OFFLINE |
| Execution | Documentation examples | Parse as inert bytes only | Shell-like content fixture | COVERED_OFFLINE |
| Execution | Dynamic third-party adapter | Fixed built-in registry only | Unknown adapter and import restriction | COVERED_OFFLINE |

## Current offline security evidence

The prototype test suite covers local path containment, symlink rejection, output-root
separation, input size, manifest and blob integrity, undeclared blobs, malformed
configuration, Unicode normalization, output control characters, trusted-policy
containment, and analyzer import restrictions.

These tests do not exercise network controls because no network collector exists.

## Approval record

`DECISION_REQUIRED`: Name the security reviewer, supported runtime, approved limits,
proxy assumptions, fixture results, and residual risks before changing any
`BLOCKING_NOT_IMPLEMENTED` row to approved.
