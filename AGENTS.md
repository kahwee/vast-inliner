# VAST Inliner

- Use Bun 1.4.4 and keep `bun.lock` committed; frozen installs use `bun ci`.
- Support Node 24 only (`>=24 <25`); use `.nvmrc`, the Node 24 types line, and
  the Node 24 build target. Node 22, 25, and 26 are outside the v3 support contract.
- Run `bun run check` before committing.
- Preserve the default export and both ESM/CommonJS package entry points.
- Test wrapper traversal, XML merging, and every new failure mode.
- Inject `fetch` in tests; never call live ad servers.
- For greenkeeping, check `bun outdated` and `bun audit` before changing
  dependencies. Prefer compatible upgrades, keep the Bun version in
  `package.json` aligned with CI, and include the lockfile update.
- Keep dependency updates focused. Do not combine a major runtime dependency
  upgrade with unrelated refactoring, and run the full `bun run check` gate.
- Preserve decoded UTF-8 byte-limit, abort, timeout, and stream cleanup semantics.
  Add injected-stream tests for boundary behavior; never contact real ad servers.
- Keep independent source checks parallel, then build and validate the package.
  Build artifacts must finish before `publint`, `attw`, and isolated packed-package
  ESM/CommonJS/runtime/declaration checks.
- Publishing is not active. The proposal in `.github/release-proposals/` requires
  separate workflow and registry-trust approval; see [publishing](docs/actions-publishing.md).
  Do not create tags, releases, or registry publications as maintenance tests.
