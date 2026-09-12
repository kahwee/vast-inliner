# vast-inliner

[![CI](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml/badge.svg)](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml)

Resolve a chain of VAST wrappers into one inline VAST document. Wrapper impressions, errors, and linear tracking events are copied into the final inline ad.

## Install

```sh
bun add vast-inliner
```

Node.js 22 or newer is supported. The package includes ESM, CommonJS, and TypeScript declarations.

## Use

```ts
import vastInliner from "vast-inliner";

const document = await vastInliner("https://ads.example/vast.xml", {
  timeout: 5_000,
  maxDepth: 8,
});
```

Request serialized XML when a DOM document is not convenient:

```ts
const xml = await vastInliner("https://ads.example/vast.xml", {
  serialize: true,
});
```

## Options

- `serialize`: return XML text instead of a `Document`.
- `timeout`: abort each request after this many milliseconds.
- `maxDepth`: maximum number of wrappers to follow; defaults to 10.
- `withCredentials`: send cross-origin credentials in browsers.
- `headers`, `signal`: standard Fetch API request controls.
- `fetch`: inject a Fetch-compatible implementation for tests or custom runtimes.

Relative `VASTAdTagURI` values resolve against the response URL. Cycles, malformed XML, HTTP errors, timeouts, and excessive wrapper depth reject with an error.

## Development

```sh
bun install
bun run check
```

The complete check formats and lints with Biome, type-checks, runs tests with coverage, builds both package formats, and audits dependencies.
