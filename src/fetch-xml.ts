import { parseXml, type XmlDocument } from "./xml";

export interface FetchXmlOptions {
  /** Fetch implementation to use. Injection keeps tests and non-browser runtimes deterministic. */
  fetch?: typeof globalThis.fetch;
  /** Headers forwarded to every request in the wrapper chain. */
  headers?: HeadersInit;
  /** Maximum UTF-8 response size. Defaults to 5 MB. */
  maxResponseBytes?: number;
  /** Caller-controlled cancellation signal. */
  signal?: AbortSignal;
  /** Per-request timeout in milliseconds. */
  timeout?: number;
  /** Include cross-origin credentials in browser requests. */
  withCredentials?: boolean;
}

export interface XmlResponse {
  document: XmlDocument;
  headers: Headers;
  status: number;
  url: string;
}

async function readLimitedText(response: Response, maxResponseBytes: number): Promise<string> {
  if (!response.body) return response.text();
  if (response.bodyUsed) throw new TypeError("Response body has already been consumed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let decodedBytes = 0;

  const append = (text: string): void => {
    // Match Response.text() followed by UTF-8 encoding, including BOM removal and
    // replacement characters for malformed bytes, rather than counting wire bytes.
    decodedBytes += encoder.encode(text).byteLength;
    if (decodedBytes > maxResponseBytes) {
      throw new Error(`VAST response exceeds maxResponseBytes (${maxResponseBytes})`);
    }
    if (text) parts.push(text);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (
        !ArrayBuffer.isView(value) ||
        Object.prototype.toString.call(value) !== "[object Uint8Array]"
      ) {
        throw new TypeError("Response body must contain Uint8Array chunks");
      }
      // A custom fetch may supply a large single chunk. Decode bounded slices so
      // that rejecting it does not first allocate an equally large text string.
      for (let offset = 0; offset < value.byteLength; offset += 16_384) {
        append(decoder.decode(value.subarray(offset, offset + 16_384), { stream: true }));
      }
    }
    append(decoder.decode());
    return parts.join("");
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** Fetch and parse one XML document with bounded size, cancellation, and HTTP validation. */
export async function fetchXml(uri: string, options: FetchXmlOptions = {}): Promise<XmlResponse> {
  const fetcher = options.fetch ?? globalThis.fetch;
  if (!fetcher) throw new Error("No fetch implementation is available");
  if (
    options.timeout !== undefined &&
    (!Number.isFinite(options.timeout) || options.timeout <= 0)
  ) {
    throw new RangeError("timeout must be a positive number");
  }
  const maxResponseBytes = options.maxResponseBytes ?? 5_000_000;
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) {
    throw new RangeError("maxResponseBytes must be a positive safe integer");
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
    await response.body?.cancel().catch(() => {});
    throw new Error(`VAST request failed with HTTP ${response.status} for ${response.url || uri}`);
  }
  // Content-Length allows an early rejection; the encoded-size check below remains authoritative
  // because servers can omit or misreport the header.
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
    await response.body?.cancel().catch(() => {});
    throw new Error(`VAST response exceeds maxResponseBytes (${maxResponseBytes})`);
  }
  const xml = await readLimitedText(response, maxResponseBytes);

  return {
    document: parseXml(xml),
    headers: response.headers,
    status: response.status,
    url: response.url || uri,
  };
}
