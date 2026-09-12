# vast-inliner

[![CI](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml/badge.svg)](https://github.com/kahwee/vast-inliner/actions/workflows/ci.yml)
[![Maintained by KahWee Teng](https://img.shields.io/badge/maintainer-KahWee_Teng-1f6feb)](https://kahwee.com)

Resolve a chain of VAST wrappers into one inline VAST document. Wrapper impressions, errors, and linear tracking events are copied into the final inline ad.

## Why I built this

I’m [KahWee Teng](https://kahwee.com). I have worked on both sides of programmatic advertising:
at a demand-side platform (DSP), where advertisers buy inventory, and at a supply-side platform
(SSP), where publishers make inventory available and protect its value.

That experience made VAST wrappers feel less like abstract XML and more like the connective tissue
between companies that have different responsibilities but must agree on one playback outcome.
A single ad request may pass through buyers, exchanges, sellers, verification vendors, and creative
hosts before reaching a player. Each wrapper can add measurement, errors, viewability signals, and
commercial accountability. Dropping one layer can mean missing attribution, incorrect billing,
lost publisher revenue, or a player that simply fails to render an ad.

I originally created `vast-inliner` to make those wrapper chains inspectable and usable as one
document. The modern version keeps that narrow role: resolve the chain safely, preserve the signals
that accumulated along the way, and leave playback and business-policy decisions to the caller.
It reflects a practical lesson from working across DSP and SSP systems: interoperability is not
just parsing XML; it is preserving everyone’s intent without hiding failure.

## VAST today

VAST—the Video Ad Serving Template—is an XML contract between an ad server and a video or
audio player. It describes the creative, media candidates, tracking endpoints, click behavior,
verification resources, and wrapper redirects. It does not play the ad or define the player API.

As of September 2026, [VAST 4.3](https://github.com/InteractiveAdvertisingBureau/VAST4.x/blob/main/4.3.md)
is the latest published IAB Tech Lab specification (December 2022). The repository also contains
a [VAST 4.4 draft](https://github.com/InteractiveAdvertisingBureau/VAST4.x/blob/main/4.4.md),
but that document still lists its publication date as TBD. Treat 4.4 features as draft until IAB
Tech Lab publishes them.

What matters most in a current implementation:

- **Wrappers are cumulative.** A player must preserve applicable tracking, errors, impressions,
  viewability, and verification resources from every wrapper—not merely fetch the final inline ad.
- **Bound wrapper traversal.** Detect cycles, impose depth/time/size limits, resolve relative URLs,
  honor `followAdditionalWrappers`, and report failures through the applicable VAST error URLs.
- **Use real media files.** VAST 4 separates executable behavior from `<MediaFile>`. Prefer suitable
  codec, bitrate, dimensions, and delivery method; retain a high-quality mezzanine for SSAI.
- **VPAID is retired.** Use OMID/OM SDK for measurement and verification, and SIMID for secure
  interactivity. Do not treat a VPAID JavaScript media file as the modern path.
- **Identity and measurement matter.** Preserve `UniversalAdId`, `AdServingId`,
  `<AdVerifications>`, and `<ViewableImpression>` so deduplication, attribution, and verification
  remain possible.
- **Macros are a separate living registry.** Expand tracking and request macros at dispatch time,
  with the correct encoding and unavailable-value rules; do not blindly string-replace XML.
- **Pods and scheduling are player policy.** VAST can describe sequenced ads, but VMAP or another
  scheduling layer determines when breaks occur. Wrapper flattening must not silently choose among
  multiple ads.
- **CTV is evolving.** The 4.4 draft adds CTV Ad Portfolio non-linear formats and standardized QR
  code signaling. Build this behind explicit capability checks rather than assuming universal
  support.

Primary references:

- [IAB Tech Lab VAST repository and schemas](https://github.com/InteractiveAdvertisingBureau/VAST)
- [VAST 4.3 specification](https://github.com/InteractiveAdvertisingBureau/VAST4.x/blob/main/4.3.md)
- [VAST 4 macro registry](https://github.com/InteractiveAdvertisingBureau/VAST/tree/master/vast4macros)
- [Official VAST samples](https://github.com/InteractiveAdvertisingBureau/VAST_Samples)

## Scope of this package

`vast-inliner` handles the transport and deterministic inheritance part of wrapper processing. It
does not select media, fire tracking pixels, expand macros, execute OMID/SIMID resources, validate
against an XSD, choose ads from a pod, enforce blocked categories, or implement fallback policy.
Those decisions require player capabilities and request context and should remain visible to the
caller.

| Wrapper data | Behavior |
| --- | --- |
| Impressions and errors | Preserved on the inline ad |
| Linear tracking events | Added to the inline linear creative |
| Linear click/custom tracking | Preserved; inline click-through is never replaced |
| Icon, nonlinear, and companion click tracking | Matched by program, ID, or stable position |
| Viewable-impression URLs | Combined into the inline viewability container |
| Ad verification resources | Combined for downstream OMID/verification handling |
| Extensions | Preserved without interpreting vendor-specific payloads |
| Media, interactive files, click-throughs, and ad parameters | Kept from the inline creative |

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
- `maxResponseBytes`: maximum decoded response size; defaults to 5 MB.
- `withCredentials`: send cross-origin credentials in browsers.
- `headers`, `signal`: standard Fetch API request controls.
- `fetch`: inject a Fetch-compatible implementation for tests or custom runtimes.

Relative `VASTAdTagURI` values resolve against the response URL. Cycles, malformed XML, HTTP errors, timeouts, and excessive wrapper depth reject with an error.

The `followAdditionalWrappers` control is enforced. `allowMultipleAds`, `fallbackOnNoAd`, ad-pod
selection, blocked-category evaluation, macro expansion, and error-pixel dispatch remain caller
policy; flattening them without playback context would be incorrect.

## Development

```sh
bun install
bun run check
```

The complete check formats and lints with Biome, type-checks, runs tests with coverage, builds both package formats, and audits dependencies.
