# Local wrapper example

Start with [installation and options](../README.md).

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

