# vast-inliner

[![CI](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml/badge.svg)](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml)

Resolve a chain of VAST wrappers into one inline VAST document. The package
preserves wrapper impressions, errors, tracking, viewability, verification
resources, and extensions so a player can act on the complete result.

## Install and use

This checkout prepares v3.0.0; npm publication is separate. The registry may
still serve an older release until v3 is published.

```sh
bun add vast-inliner
```

Version 3 supports **Node.js 24 only** (`>=24 <25`). It provides ESM, CommonJS,
and TypeScript declarations. See [migration to v3](docs/migration-v3.md).

```ts
import vastInliner from 'vast-inliner';

const document = await vastInliner('https://ads.example/vast.xml', {
  timeout: 5_000,
  maxDepth: 8,
});

// Return XML text instead of a DOM Document:
const xml = await vastInliner('https://ads.example/vast.xml', {
  serialize: true,
});
```

`VASTAdTagURI` values resolve relative to the response URL. Cycles, malformed
XML, HTTP failures, timeouts, oversized responses, and excessive depth reject
with an error.

See the [local fixture example](docs/examples.md) to follow a wrapper without
contacting an ad server. Injecting `fetch` makes traversal and merging reproducible.

## Options

| Option              | Purpose                                 |
| ------------------- | --------------------------------------- |
| `serialize`         | Return XML text instead of a `Document` |
| `timeout`           | Per-request timeout in milliseconds     |
| `maxDepth`          | Maximum wrapper depth (default: 10)     |
| `maxResponseBytes`  | Decoded response limit (default: 5 MB)  |
| `withCredentials`   | Send cross-origin browser credentials   |
| `headers`, `signal` | Fetch request controls                  |
| `fetch`             | Inject a Fetch-compatible function      |

The decoded response limit is enforced while reading the body, including when
`Content-Length` is absent or too small. Reading stops and the stream is canceled
as soon as the limit is exceeded. UTF-8 characters split across chunks are preserved.

## Boundaries

The inliner combines applicable wrapper data with the inline ad. It preserves
the inline creative's media and click-through, and enforces
`followAdditionalWrappers`.

The caller still chooses media, ads in a pod, fallback behavior, category
blocking, macro expansion, and when to send tracking or error requests. The
package does not execute OMID/SIMID resources or validate VAST against an XSD.

For the XML contract, see the [VAST 4.3 specification](https://github.com/InteractiveAdvertisingBureau/VAST4.x/blob/main/4.3.md)
and [official samples](https://github.com/InteractiveAdvertisingBureau/VAST_Samples).

## Develop

Use Node.js 24.22.1 from `.nvmrc` and Bun 1.4.4, matching CI.

```sh
bun install --frozen-lockfile
bun run check
```

The check covers formatting, types, tests with coverage, ESM/CommonJS
builds, package exports, and dependency audit.

## CI maintenance

[GitHub Actions maintenance](.github/ACTIONS.md) covers workflows, parallel checks, action versions, and weekly updates.

Bun 1.4.4 owns formatting (`bun run format`, `bun run format:check`) and type checking
(`bun run typecheck`). Biome has been removed. Bun formatting is not a replacement
for Biome’s semantic lint rules; tests, strict type checks, and package builds remain
the verification gates. TypeScript remains installed for editor/tooling consistency. Bun checks semantics;
the bundler uses its Oxc emitter for the explicitly typed declaration API.

`bun run check:source` runs formatting, Bun type checking, and tests in parallel.
`bun run check` waits for those checks before building package artifacts.

On the session’s Linux executor, the median of three project-check runs was
0.164s with Bun versus 0.718s with `bun x --no-install tsc --noEmit`.
These include command startup and describe this checkout, not a CI speed guarantee.

See [build performance](docs/build-performance.md) for the Bun-hosted build,
measured artifact timings, output verification, and benchmark scope.

Standalone `bun run build` checks types before writing artifacts. `build:artifacts`
uses the fast declaration emitter and requires a successful source gate first.
See [declaration benchmarks](docs/build-performance.md#isolated-declaration-emission).
