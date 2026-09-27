# Scenario examples

These directories turn the acceptance fixtures into material that the documented
commands accept directly. Each one holds its input files and a `collector.json` whose
evidence roots resolve relative to that file.

Run them with the scenario walkthrough in `docs/phase3/README.md`.

| Directory | Demonstrates |
| --- | --- |
| `clean-mapping` | An explicit mapping that passes and stays `IDENTITY_ASSERTED` |
| `source-defect` | A `DART-OPS-001` failure localized to the SOURCE boundary |
| `build-defect` | A `DART-OPS-001` failure localized to the BUILD boundary |
| `live-drift` | A `DART-OPS-002` failure localized to the LIVE boundary, plus an advisory policy |
| `asserted-provenance` | Asserted deployment provenance that remains unverified |
| `external-defect` | A recorded AFDocs failure kept outside internal findings |
| `regression` | A compatible `CHANGED` transition, a reviewed baseline, and a blocking policy |
| `incompatible-baseline` | An `INCOMPATIBLE` comparison with `RULE_VERSION_CHANGED` |

A `.gitkeep` file marks an evidence root that is intentionally empty, which is how the
source and build boundary defects are represented.

The committed reports under `incompatible-baseline` and `regression/trusted-base` are
generated from these inputs. `tests/example-scenarios.test.ts` fails if a scenario stops
reproducing the behavior its fixture defines.
