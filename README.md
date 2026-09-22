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

## Options

| Option | Purpose |
| --- | --- |
| `serialize` | Return XML text instead of a `Document` |
| `timeout` | Per-request timeout in milliseconds |
| `maxDepth` | Maximum wrapper depth (default: 10) |
| `maxResponseBytes` | Decoded response limit (default: 5 MB) |
| `withCredentials` | Send cross-origin browser credentials |
| `headers`, `signal` | Fetch request controls |
| `fetch` | Inject a Fetch-compatible function |

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

```sh
bun install --frozen-lockfile
bun run check
```

The check covers formatting, lint, types, tests with coverage, ESM/CommonJS
builds, package exports, and dependency audit.
