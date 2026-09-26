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

## Try it without an ad server

Inject `fetch` to resolve fixtures locally. This complete example follows one
wrapper to its inline document and returns serialized XML:

```ts
import vastInliner from 'vast-inliner';

const fixtures: Record<string, string> = {
  'https://ads.example/wrapper.xml': `
    <VAST version="4.3"><Ad><Wrapper>
      <AdSystem>Example</AdSystem>
      <VASTAdTagURI>inline.xml</VASTAdTagURI>
      <Impression>https://tracking.example/wrapper</Impression>
      <Creatives />
    </Wrapper></Ad></VAST>`,
  'https://ads.example/inline.xml': `
    <VAST version="4.3"><Ad><InLine>
      <AdSystem>Example</AdSystem><AdTitle>Local example</AdTitle>
      <Impression>https://tracking.example/inline</Impression>
      <Creatives />
    </InLine></Ad></VAST>`,
};

const xml = await vastInliner('https://ads.example/wrapper.xml', {
  serialize: true,
  fetch: async (input) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = fixtures[url];
    return new Response(body ?? 'Not found', {
      status: body === undefined ? 404 : 200,
      headers: { 'content-type': 'application/xml' },
    });
  },
});

console.log(xml); // Inline XML containing both impression URLs.
```

These minimal fixtures demonstrate traversal and merging; they contain no media
creative. Resolving an impression URL into the XML does not send a tracking request.

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
