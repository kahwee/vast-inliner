## 2.0.3 (unreleased)

## Unreleased

- Use isolated Oxc declaration emission for the explicit public API; gate standalone builds with Bun checking and retain package validation. Record a 59.4% artifact-phase reduction with identical emitted files.

- Host existing artifact-build tools under Bun; preserve emitted package formats and declarations. Record three-run build benchmarks and identical-output fingerprints.
- Refresh compatible dependencies, including available toolchain security patches.

- Run independent source checks in parallel with Bun; keep build and package validation after successful checks.

- Use Bun 1.4.4 for formatting and type checking; remove Biome. Keep TypeScript for declaration output.
- Pin GitHub Actions to verified stable release commits and use `bun ci` for frozen installs.

- Refresh tsdown to 0.23.1 and align Vitest/V8 coverage on 5.0.5; preserve Node 22 compatibility and both ESM/CommonJS entry points.

## 2.0.2 (unreleased)

- Update compatible development tooling and refresh dependency security fixes.

- Update the locked source-map-js development dependency to 1.2.2 to address its denial-of-service advisory.
- Align Vitest and V8 coverage on 5.0.2.
- Add a self-contained fetch-injection example for local wrapper resolution.

# v2.0.1 -- 2026-09-12

- Expand the maintainer story and package metadata with KahWee Teng's DSP and SSP background.
- Document public APIs and the non-obvious invariants behind safe wrapper traversal and merging.
- Move the repository's default branch and CI target from `master` to `main`.

# v2.0.0 -- 2026-09-12

- Replace the legacy Babel, Webpack, Karma, and Travis toolchain with TypeScript, tsdown, Vitest, Biome, and GitHub Actions.
- Use standards-based `fetch` with timeout, cancellation, relative URL, HTTP error, cycle, and wrapper-depth handling.
- Publish ESM, CommonJS, and TypeScript declaration entry points.
- Support VAST 4 wrapper viewability, verification, extension, linear, icon, nonlinear, and companion tracking inheritance.
- Enforce wrapper controls, VAST roots, response-size limits, and schema-aware merge placement.

# v1.1.0 -- 2017-06-13

- Use webpack instead of browserify

# v1.0.4 -- 2016-02-08

- Remove header specification

# v1.0.3 -- 2016-02-05

- Added valid options and `timeout` and `withCredentials`

# v1.0.2 -- 2016-02-04

- Messed up publishing.

# v1.0.1 -- 2016-02-04

- Add `lib` directory to store compiled ES2015 files.
