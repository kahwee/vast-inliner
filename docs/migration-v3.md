# Migrating to v3

Version 3 supports **Node.js 24 only**. The package declares `>=24 <25`, builds
for Node 24, and verifies Node 24.22.1 in CI. Node 22 is no longer supported;
Node 25 and 26 are not supported by this major release either.

Use Node 24 before installing or deploying. If you must stay on another Node
major, do not upgrade to v3. Older prepared v2 Git versions are not necessarily
published on npm; check the registry rather than assuming a v2 install exists.

The resolver API and ESM/CommonJS entry points are unchanged from the prepared
v2 API:

```js
import vastInliner from 'vast-inliner'
```

```js
const { default: vastInliner } = require('vast-inliner')
```

The package still resolves VAST wrappers with standards-based `fetch`, enforces
abort/timeouts and streamed decoded-UTF-8 size limits, and preserves tracking
metadata without sending tracking requests. Applications choose media, playback,
and tracking behavior. See [local injected-fetch examples](examples.md).

For upgrades from the public npm v1 line, review the [v2 API changes](../CHANGELOG.md)
as well as this runtime restriction. This change prepares v3; it does not by
itself publish a package, create a tag, or activate registry authentication.
