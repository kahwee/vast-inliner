import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import vastInliner, { Combiner, fetchVastChain, fetchXml, parseXml } from "../src";

const inline = `<VAST><Ad><InLine><Impression>inline</Impression><Creatives><Creative><Linear><TrackingEvents><Tracking event="start">inline-start</Tracking></TrackingEvents></Linear></Creative></Creatives></InLine></Ad></VAST>`;
const wrapper = (next: string) =>
  `<VAST><Error>root-error</Error><Ad><Wrapper><VASTAdTagURI>${next}</VASTAdTagURI><Impression>wrapper</Impression><Error>wrapper-error</Error><Creatives><Creative><Linear><TrackingEvents><Tracking event="complete">wrapper-complete</Tracking></TrackingEvents></Linear></Creative><Creative><CompanionAds><Companion><TrackingEvents><Tracking event="creativeView">companion</Tracking></TrackingEvents></Companion></CompanionAds></Creative></Creatives></Wrapper></Ad></VAST>`;

function mockFetch(documents: Record<string, string>): typeof fetch {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const body = documents[url];
    const response = new Response(body ?? "missing", { status: body ? 200 : 404 });
    Object.defineProperty(response, "url", { value: url });
    return response;
  }) as unknown as typeof fetch;
}

describe("fetchXml", () => {
  it("parses successful XML responses", async () => {
    const result = await fetchXml("https://ads.test/inline.xml", {
      fetch: mockFetch({ "https://ads.test/inline.xml": inline }),
    });
    expect(result.document.getElementsByTagName("InLine").length).toBe(1);
  });

  it("rejects HTTP errors and malformed XML", async () => {
    await expect(
      fetchXml("https://ads.test/missing.xml", { fetch: mockFetch({}) }),
    ).rejects.toThrow("HTTP 404");
    await expect(
      fetchXml("https://ads.test/broken.xml", {
        fetch: mockFetch({ "https://ads.test/broken.xml": "<VAST><broken></VAST>" }),
      }),
    ).rejects.toThrow("Invalid XML");
  });
});

describe("fetchVastChain", () => {
  it("follows relative URLs and returns inline-first order", async () => {
    const fetch = mockFetch({
      "https://ads.test/root.xml": wrapper("./nested/inline.xml"),
      "https://ads.test/nested/inline.xml": inline,
    });
    const chain = await fetchVastChain("https://ads.test/root.xml", { fetch });
    expect(chain).toHaveLength(2);
    expect(chain[0]?.document.getElementsByTagName("InLine").length).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects cycles and excessive depth", async () => {
    const cycle = mockFetch({
      "https://ads.test/a.xml": wrapper("b.xml"),
      "https://ads.test/b.xml": wrapper("a.xml"),
    });
    await expect(fetchVastChain("https://ads.test/a.xml", { fetch: cycle })).rejects.toThrow(
      "cycle",
    );
    const deep = mockFetch({
      "https://ads.test/a.xml": wrapper("b.xml"),
      "https://ads.test/b.xml": inline,
    });
    await expect(
      fetchVastChain("https://ads.test/a.xml", { fetch: deep, maxDepth: 0 }),
    ).rejects.toThrow("maxDepth");
  });
});

describe("Combiner", () => {
  it("copies wrapper data without mutating inputs", () => {
    const source = parseXml(inline);
    const output = new Combiner([source, parseXml(wrapper("inline.xml"))]).execute();
    expect(output.getElementsByTagName("Wrapper").length).toBe(0);
    expect(output.getElementsByTagName("Tracking").length).toBe(2);
    expect(output.getElementsByTagName("Impression").length).toBe(2);
    expect(output.getElementsByTagName("Error").length).toBe(1);
    expect(source.getElementsByTagName("Tracking").length).toBe(1);
  });

  it("requires an inline ad", () => {
    expect(() => new Combiner([parseXml(wrapper("next.xml"))]).execute()).toThrow("InLine");
  });
});

describe("vastInliner", () => {
  it("returns DOM and serialized output", async () => {
    const fetch = mockFetch({
      "https://ads.test/root.xml": wrapper("inline.xml"),
      "https://ads.test/inline.xml": inline,
    });
    const document = await vastInliner("https://ads.test/root.xml", { fetch });
    expect(document.getElementsByTagName("Wrapper").length).toBe(0);
    await expect(
      vastInliner("https://ads.test/root.xml", { fetch, serialize: true }),
    ).resolves.toContain("wrapper-complete");
  });

  it("resolves the original two-wrapper fixture chain", async () => {
    const fixture = (name: string) =>
      readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
    const fetch = mockFetch({
      "https://ads.test/wrapper-2.xml": fixture("wrapper-2.xml"),
      "https://ads.test/base/tests/fixtures/wrapper-1.xml": fixture("wrapper-1.xml"),
      "https://ads.test/base/tests/fixtures/simple.xml": fixture("simple.xml"),
    });
    const document = await vastInliner("https://ads.test/wrapper-2.xml", { fetch });
    expect(document.getElementsByTagName("Wrapper").length).toBe(0);
    expect(document.getElementsByTagName("Impression").length).toBe(7);
    expect(document.getElementsByTagName("Error").length).toBe(4);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
