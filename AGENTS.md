# AGENTS.md

- Use Bun and keep `bun.lock` committed.
- Run `bun run check` before committing.
- Preserve the default export and both ESM/CommonJS package entry points.
- Test wrapper traversal, XML merging, and every new failure mode.
- Inject `fetch` in tests; never call live ad servers.
- For greenkeeping, check `bun outdated` and `bun audit` before changing
  dependencies. Prefer compatible upgrades, keep the Bun version in
  `package.json` aligned with CI, and include the lockfile update.
- Keep dependency updates focused. Do not combine a major runtime dependency
  upgrade with unrelated refactoring, and run the full `bun run check` gate.
