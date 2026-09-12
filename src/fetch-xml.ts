import { parseXml, type XmlDocument } from "./xml";

export interface FetchXmlOptions {
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeout?: number;
  withCredentials?: boolean;
}

export interface XmlResponse {
  document: XmlDocument;
  headers: Headers;
  status: number;
  url: string;
}

export async function fetchXml(uri: string, options: FetchXmlOptions = {}): Promise<XmlResponse> {
  const fetcher = options.fetch ?? globalThis.fetch;
  if (!fetcher) throw new Error("No fetch implementation is available");
  if (
    options.timeout !== undefined &&
    (!Number.isFinite(options.timeout) || options.timeout <= 0)
  ) {
    throw new RangeError("timeout must be a positive number");
  }

  const timeoutSignal = options.timeout ? AbortSignal.timeout(options.timeout) : undefined;
  const signal =
    options.signal && timeoutSignal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : (options.signal ?? timeoutSignal);
  const response = await fetcher(uri, {
    credentials: options.withCredentials ? "include" : "same-origin",
    ...(options.headers ? { headers: options.headers } : {}),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`VAST request failed with HTTP ${response.status} for ${response.url || uri}`);
  }

  return {
    document: parseXml(await response.text()),
    headers: response.headers,
    status: response.status,
    url: response.url || uri,
  };
}
