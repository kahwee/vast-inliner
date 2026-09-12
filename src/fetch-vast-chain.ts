import { fetchXml, type FetchXmlOptions, type XmlResponse } from "./fetch-xml";

export interface FetchVastChainOptions extends FetchXmlOptions {
  maxDepth?: number;
}

export interface VastChainItem extends XmlResponse {
  vastAdTagUri?: string;
}

function wrapperDetails(document: XmlResponse["document"]):
  | {
      followAdditionalWrappers: boolean;
      uri?: string;
    }
  | undefined {
  const wrapper = document.getElementsByTagName("Wrapper").item(0);
  if (!wrapper) return undefined;
  const node = Array.from({ length: wrapper.childNodes.length }, (_, index) =>
    wrapper.childNodes.item(index),
  ).find((child) => child?.nodeType === 1 && child.nodeName === "VASTAdTagURI");
  const value = node?.textContent?.trim();
  return {
    followAdditionalWrappers:
      wrapper.getAttribute("followAdditionalWrappers")?.toLowerCase() !== "false",
    ...(value ? { uri: value } : {}),
  };
}

export async function fetchVastChain(
  initialUri: string,
  options: FetchVastChainOptions = {},
): Promise<VastChainItem[]> {
  const maxDepth = options.maxDepth ?? 10;
  if (!Number.isInteger(maxDepth) || maxDepth < 0) {
    throw new RangeError("maxDepth must be a non-negative integer");
  }

  const chain: VastChainItem[] = [];
  const visited = new Set<string>();
  let uri = initialUri;
  let mayFollowAnotherWrapper = true;

  for (let depth = 0; ; depth += 1) {
    if (visited.has(uri)) throw new Error(`VAST wrapper cycle detected at ${uri}`);
    visited.add(uri);

    const response = await fetchXml(uri, options);
    if (response.document.documentElement?.nodeName !== "VAST") {
      throw new Error(`Expected a VAST document from ${response.url}`);
    }
    if (response.url !== uri) {
      if (visited.has(response.url)) {
        throw new Error(`VAST wrapper cycle detected after redirect to ${response.url}`);
      }
      visited.add(response.url);
    }
    const wrapper = wrapperDetails(response.document);
    if (wrapper && !mayFollowAnotherWrapper) {
      throw new Error("A VAST wrapper disallowed following the additional downstream wrapper");
    }
    const vastAdTagUri = wrapper?.uri;
    if (wrapper && !vastAdTagUri) throw new Error("VAST Wrapper is missing VASTAdTagURI");
    chain.unshift({ ...response, ...(vastAdTagUri ? { vastAdTagUri } : {}) });
    if (!vastAdTagUri) return chain;
    if (depth >= maxDepth) throw new Error(`VAST wrapper depth exceeds maxDepth (${maxDepth})`);

    mayFollowAnotherWrapper = wrapper?.followAdditionalWrappers ?? true;
    try {
      uri = new URL(vastAdTagUri, response.url).href;
    } catch {
      throw new Error(`Invalid VASTAdTagURI: ${vastAdTagUri}`);
    }
  }
}
