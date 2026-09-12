import { DOMParser, type Document, XMLSerializer } from "@xmldom/xmldom";

export type XmlDocument = Document;

export function parseXml(xml: string): XmlDocument {
  const errors: string[] = [];
  let document: XmlDocument;
  try {
    document = new DOMParser({
      onError: (level, message) => {
        if (level !== "warning") errors.push(message);
      },
    }).parseFromString(xml, "application/xml");
  } catch (error) {
    const message = error instanceof Error ? error.message : "parse failed";
    throw new SyntaxError(`Invalid XML: ${message}`, { cause: error });
  }

  if (errors.length > 0 || document.documentElement?.nodeName === "parsererror") {
    throw new SyntaxError(`Invalid XML: ${errors[0] ?? "parse failed"}`);
  }

  return document;
}

export function serializeXml(document: XmlDocument): string {
  return new XMLSerializer().serializeToString(document);
}
