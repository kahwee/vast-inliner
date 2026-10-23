# Build performance

The artifact build runs its existing tools under Bun 1.4.4. This changes the build
host, while preserving the package's exports and output formats. Tests and
coverage retain their existing runtime; source checks still finish before builds.

On the Linux x64 executor (Node v26.11.1, Bun 1.4.4), the median artifact-build time
changed from **3.282s to 2.371s**, a **27.8% reduction** for this phase.

| Build host             | Median |        Range |
| ---------------------- | -----: | -----------: |
| Node tool shebangs     | 3.282s | 2.927–3.634s |
| Bun-hosted build tools | 2.371s | 2.273–2.847s |

Both cases used the same updated dependencies and included declaration emission.
One warm-up per case preceded three alternating measured runs. All emitted files,
including declarations and source maps, had identical SHA-256 fingerprints across
the measured cases. Dependency and OS caches were warm. No other build or test
workload ran during this comparison. This excludes dependency installation, source
checks, tests, Storybook, and CI setup; it is not a whole-CI speedup measurement.

[Raw samples](benchmarks/build-runtime-2026-10-22.json) retain the baseline commit,
tool versions, individual timings, file counts, fingerprints, and candidate command.
The recorded commands refer to the baseline scripts before explicit Bun invocations
were added. Current package scripts select the measured Bun-hosted path directly.

To time the current build, install pinned dependencies with `bun ci`, finish the
source checks, then run `bun run build` repeatedly on an otherwise idle machine.
Compare medians and emitted files; do not combine this phase result with historical
checker improvements to claim a multiplied whole-build gain.

## Isolated declaration emission

The explicitly annotated public API can use tsdown's Oxc declaration generator.
`bun run build` now gates emission on Bun's full semantic check; `bun run check`
and CI call `build:artifacts` only after their existing source gates succeed.
New public exports must support isolated declaration generation. TypeScript remains
available for editors, and the package/consumer checks remain enabled.

On 2026-10-23, with Bun 1.4.4 hosting both cases, median artifact generation changed
from **1.716s to 0.697s** (59.4% less time). One warm-up per case preceded three
alternating samples, with the same dependencies and no competing build/test work.
All six files, including ESM/CommonJS declarations and source maps, matched exactly.
Both measured cases exclude the shared semantic source gate. This is not a full-CI
measurement, and it must not be multiplied by the earlier host-runtime result.

[Raw samples and configurations](benchmarks/isolated-declarations-2026-10-23.json)
retain individual timings, fingerprints, and both emitter configurations. To compare
emitters, finish the source checks first, then use those configurations with
`bun --bun tsdown --config <file>`. The current `build:artifacts` script selects Oxc.
