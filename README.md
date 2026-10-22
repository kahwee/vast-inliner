# vast-inliner

[![CI](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml/badge.svg)](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml)

Resolve a chain of VAST wrappers into one inline VAST document. The package
preserves wrapper impressions, errors, tracking, viewability, verification
resources, and extensions so a player can act on the complete result.

## Install and use

```sh
bun add vast-inliner
```

Node.js 22+ is supported. The package provides ESM, CommonJS, and TypeScript
declarations.

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

Use Bun 1.4.4, matching `package.json` and CI.

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
the verification gates. TypeScript remains installed for declaration generation.

`bun run check:source` runs formatting, Bun type checking, and tests in parallel.
`bun run check` waits for those checks before building package artifacts.

On the session’s Linux executor, the median of three project-check runs was
0.164s with Bun versus 0.718s with `bun x --no-install tsc --noEmit`.
These include command startup and describe this checkout, not a CI speed guarantee.
