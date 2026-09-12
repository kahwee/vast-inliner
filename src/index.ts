import { Combiner } from "./combiner";
import { fetchVastChain, type FetchVastChainOptions } from "./fetch-vast-chain";
import { serializeXml, type XmlDocument } from "./xml";

export interface VastInlinerOptions extends FetchVastChainOptions {
  /** Return serialized XML instead of an xmldom `Document`. */
  serialize?: boolean;
}

/** Resolve a remote wrapper chain into one inline VAST document. */
export async function vastInliner(
  uri: string,
  options: VastInlinerOptions & { serialize: true },
): Promise<string>;
export async function vastInliner(
  uri: string,
  options?: VastInlinerOptions & { serialize?: false },
): Promise<XmlDocument>;
export async function vastInliner(
  uri: string,
  options: VastInlinerOptions,
): Promise<XmlDocument | string>;
export async function vastInliner(
  uri: string,
  options: VastInlinerOptions = {},
): Promise<XmlDocument | string> {
  const chain = await fetchVastChain(uri, options);
  const document = new Combiner(chain.map((item) => item.document)).execute();
  return options.serialize ? serializeXml(document) : document;
}

export { Combiner } from "./combiner";
export { fetchVastChain } from "./fetch-vast-chain";
export type { FetchVastChainOptions, VastChainItem } from "./fetch-vast-chain";
export { fetchXml } from "./fetch-xml";
export type { FetchXmlOptions, XmlResponse } from "./fetch-xml";
export { parseXml, serializeXml } from "./xml";
export type { XmlDocument } from "./xml";
export default vastInliner;
