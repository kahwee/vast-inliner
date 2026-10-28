# GitHub Actions

## Verification

[`ci.yml`](workflows/ci.yml) runs on pushes and pull requests to `main`.
It tests release metadata guards, installs Bun from `package.json`, caches
packages, and performs a frozen `bun ci` installation.

Formatting, Bun type checking, coverage, and dependency audit run in parallel.
All must pass before the package build and ESM/CommonJS declaration checks.
Parallel steps share a workspace; do not overlap artifact generation with checks
that read `dist`. The workflow retains read-only contents access and cancels
superseded verification runs.

## Stable immutable pins

| Action                                                                        | Release | Commit                                     |
| ----------------------------------------------------------------------------- | ------- | ------------------------------------------ |
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.1)   | v7.0.1  | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/cache](https://github.com/actions/cache/releases/tag/v6.1.0)         | v6.1.0  | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` |
| [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun/releases/tag/v2.2.0) | v2.2.0  | `0c5077e51419868618aeaa5fe8019c62421857d6` |

[Dependabot](dependabot.yml) checks Actions weekly. Verify upstream release
commits and runner requirements, preserve every gate and workflow permission,
and read back CI for the exact pushed commit. Existing pins were reverified on
2026-10-28; no action version change was required.

## Local checks and publishing

`bun run check` runs parallel source checks, builds artifacts, validates package
exports with publint/ATTW, and audits dependencies. Bun formatting does not
replace semantic lint rules; retain type, test, declaration, and package gates.
Standalone `build` checks types first; `build:artifacts` requires a successful
source gate. See [build performance](../docs/build-performance.md) for historical
measurements, not a CI speed guarantee.

There is no active publisher. The [release proposal](release-proposals/publish.yml)
and its setup-node pin remain outside `.github/workflows`. Activation and npm
registry trust require separate approval; see [publishing](../docs/actions-publishing.md).
Package checks and dry runs do not establish registry authentication.
