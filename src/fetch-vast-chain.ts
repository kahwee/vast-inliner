import { fetchXml, type FetchXmlOptions, type XmlResponse } from "./fetch-xml";

export interface FetchVastChainOptions extends FetchXmlOptions {
  maxDepth?: number;
}

export interface VastChainItem extends XmlResponse {
  vastAdTagUri?: string;
}

function wrapperUri(document: XmlResponse["document"]): string | undefined {
  const node = document.getElementsByTagName("VASTAdTagURI").item(0);
  const value = node?.textContent?.trim();
  return value || undefined;
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

  for (let depth = 0; ; depth += 1) {
    if (visited.has(uri)) throw new Error(`VAST wrapper cycle detected at ${uri}`);
    visited.add(uri);

    const response = await fetchXml(uri, options);
    const vastAdTagUri = wrapperUri(response.document);
    chain.unshift({ ...response, ...(vastAdTagUri ? { vastAdTagUri } : {}) });
    if (!vastAdTagUri) return chain;
    if (depth >= maxDepth) throw new Error(`VAST wrapper depth exceeds maxDepth (${maxDepth})`);

    try {
      uri = new URL(vastAdTagUri, response.url).href;
    } catch {
      throw new Error(`Invalid VASTAdTagURI: ${vastAdTagUri}`);
    }
  }
}
