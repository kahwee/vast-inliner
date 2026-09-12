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

  it("rejects oversized responses", async () => {
    await expect(
      fetchXml("https://ads.test/large.xml", {
        fetch: mockFetch({ "https://ads.test/large.xml": inline }),
        maxResponseBytes: 10,
      }),
    ).rejects.toThrow("maxResponseBytes");
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

  it("ignores VASTAdTagURI outside a Wrapper", async () => {
    const inlineWithExtension = inline.replace(
      "</InLine>",
      "<Extensions><VASTAdTagURI>trap.xml</VASTAdTagURI></Extensions></InLine>",
    );
    const fetch = mockFetch({ "https://ads.test/inline.xml": inlineWithExtension });
    await expect(fetchVastChain("https://ads.test/inline.xml", { fetch })).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("detects cycles hidden by redirects", async () => {
    const fetch = vi.fn(async (input: string | URL | Request) => {
      const requested = String(input);
      const response = new Response(wrapper("https://ads.test/canonical.xml"));
      Object.defineProperty(response, "url", {
        value: requested.endsWith("start.xml")
          ? "https://ads.test/canonical.xml"
          : "https://ads.test/other.xml",
      });
      return response;
    }) as unknown as typeof globalThis.fetch;
    await expect(fetchVastChain("https://ads.test/start.xml", { fetch })).rejects.toThrow("cycle");
  });

  it("honors followAdditionalWrappers=false", async () => {
    const restrictive = wrapper("next.xml").replace(
      "<Wrapper>",
      '<Wrapper followAdditionalWrappers="false">',
    );
    const fetch = mockFetch({
      "https://ads.test/root.xml": restrictive,
      "https://ads.test/next.xml": wrapper("inline.xml"),
    });
    await expect(fetchVastChain("https://ads.test/root.xml", { fetch })).rejects.toThrow(
      "disallowed",
    );
  });

  it("rejects XML that is not VAST", async () => {
    const fetch = mockFetch({ "https://ads.test/not-vast.xml": "<response/>" });
    await expect(fetchVastChain("https://ads.test/not-vast.xml", { fetch })).rejects.toThrow(
      "Expected a VAST document",
    );
  });

  it("rejects wrappers without a destination", async () => {
    const fetch = mockFetch({
      "https://ads.test/broken-wrapper.xml": "<VAST><Ad><Wrapper/></Ad></VAST>",
    });
    await expect(fetchVastChain("https://ads.test/broken-wrapper.xml", { fetch })).rejects.toThrow(
      "missing VASTAdTagURI",
    );
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
    const inlineChildren = Array.from(
      { length: output.getElementsByTagName("InLine").item(0)?.childNodes.length ?? 0 },
      (_, index) => output.getElementsByTagName("InLine").item(0)?.childNodes.item(index)?.nodeName,
    );
    expect(inlineChildren.lastIndexOf("Impression")).toBeLessThan(
      inlineChildren.indexOf("Creatives"),
    );
  });

  it("requires an inline ad", () => {
    expect(() => new Combiner([parseXml(wrapper("next.xml"))]).execute()).toThrow("InLine");
  });

  it("merges VAST 4 wrapper measurement and click-tracking surfaces", () => {
    const modernInline = parseXml(`<VAST version="4.3"><Ad><InLine><Creatives>
      <Creative><Linear><Duration>00:00:10</Duration><MediaFiles/><Icons><Icon program="adChoices"><IconClicks><IconClickThrough>inline-icon</IconClickThrough></IconClicks></Icon></Icons></Linear></Creative>
      <Creative><NonLinearAds><NonLinear><NonLinearClickThrough>inline-nonlinear</NonLinearClickThrough></NonLinear></NonLinearAds></Creative>
      <Creative><CompanionAds><Companion id="companion"><CompanionClickThrough>inline-companion</CompanionClickThrough></Companion></CompanionAds></Creative>
    </Creatives></InLine></Ad></VAST>`);
    const modernWrapper = parseXml(`<VAST version="4.3"><Ad><Wrapper>
      <VASTAdTagURI>next.xml</VASTAdTagURI>
      <ViewableImpression><Viewable>viewable</Viewable><NotViewable>not-viewable</NotViewable></ViewableImpression>
      <AdVerifications><Verification vendor="example"><JavaScriptResource>verify.js</JavaScriptResource></Verification></AdVerifications>
      <Extensions><Extension type="example">metadata</Extension></Extensions>
      <Creatives>
        <Creative><Linear><TrackingEvents><Tracking event="start">start</Tracking></TrackingEvents><VideoClicks><ClickThrough>must-not-replace-inline</ClickThrough><ClickTracking>click</ClickTracking><CustomClick>custom</CustomClick></VideoClicks><Icons><Icon program="adChoices"><IconClicks><IconClickTracking>icon-click</IconClickTracking></IconClicks></Icon></Icons></Linear></Creative>
        <Creative><NonLinearAds><NonLinear><NonLinearClickTracking>nonlinear-click</NonLinearClickTracking></NonLinear></NonLinearAds></Creative>
        <Creative><CompanionAds><Companion id="companion"><CompanionClickTracking>companion-click</CompanionClickTracking></Companion></CompanionAds></Creative>
      </Creatives>
    </Wrapper></Ad></VAST>`);

    const output = new Combiner([modernInline, modernWrapper]).execute();
    expect(output.getElementsByTagName("Verification").length).toBe(1);
    expect(output.getElementsByTagName("Viewable").length).toBe(1);
    expect(output.getElementsByTagName("Extension").length).toBe(1);
    expect(output.getElementsByTagName("ClickTracking").length).toBe(1);
    expect(output.getElementsByTagName("CustomClick").length).toBe(1);
    expect(output.getElementsByTagName("ClickThrough").length).toBe(0);
    expect(output.getElementsByTagName("IconClickTracking").length).toBe(1);
    expect(output.getElementsByTagName("NonLinearClickTracking").length).toBe(1);
    expect(output.getElementsByTagName("CompanionClickTracking").length).toBe(1);
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
