# AGENTS.md

- Use Bun and keep `bun.lock` committed.
- Run `bun run check` before committing.
- Preserve the default export and both ESM/CommonJS package entry points.
- Test wrapper traversal, XML merging, and every new failure mode.
- Inject `fetch` in tests; never call live ad servers.
