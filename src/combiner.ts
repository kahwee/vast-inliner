import type { Element } from "@xmldom/xmldom";
import type { XmlDocument } from "./xml";

function first(document: XmlDocument, tagName: string): Element | undefined {
  return document.getElementsByTagName(tagName).item(0) ?? undefined;
}

function children(element: Element, tagName: string): Element[] {
  const matches: Element[] = [];
  for (let index = 0; index < element.childNodes.length; index += 1) {
    const node = element.childNodes.item(index);
    if (node?.nodeType === 1 && node.nodeName === tagName) matches.push(node as Element);
  }
  return matches;
}

function descendantsAtPath(root: Element, path: string[]): Element[] {
  return path.reduce<Element[]>(
    (parents, tagName) => parents.flatMap((parent) => children(parent, tagName)),
    [root],
  );
}

function copyBefore(target: Element, nodes: Element[], reference: Element | undefined): void {
  const ownerDocument = target.ownerDocument;
  if (!ownerDocument) throw new Error("Cannot merge into a detached XML element");
  for (const node of nodes) {
    target.insertBefore(ownerDocument.importNode(node, true), reference ?? null);
  }
}

export class Combiner {
  #vastDocuments: XmlDocument[] = [];

  constructor(documents: XmlDocument[] = []) {
    this.#vastDocuments = documents;
  }

  unshift(document: XmlDocument): void {
    this.#vastDocuments.unshift(document);
  }

  setVastDocs(documents: XmlDocument[]): void {
    this.#vastDocuments = documents;
  }

  execute(): XmlDocument {
    const [inlineDocument, ...wrappers] = this.#vastDocuments;
    if (!inlineDocument || !first(inlineDocument, "InLine")) {
      throw new Error("The VAST chain does not end in an InLine ad");
    }

    const output = inlineDocument.cloneNode(true) as XmlDocument;
    const inline = first(output, "InLine");
    if (!inline) throw new Error("The VAST chain does not end in an InLine ad");

    for (const wrapper of wrappers) {
      const wrapperElement = first(wrapper, "Wrapper");
      if (!wrapperElement) throw new Error("A non-final VAST document must contain a Wrapper");
      const trackingEvents = descendantsAtPath(inline, [
        "Creatives",
        "Creative",
        "Linear",
        "TrackingEvents",
      ])[0];
      if (trackingEvents) {
        copyBefore(
          trackingEvents,
          descendantsAtPath(wrapperElement, [
            "Creatives",
            "Creative",
            "Linear",
            "TrackingEvents",
            "Tracking",
          ]),
          undefined,
        );
      }
      const creatives = children(inline, "Creatives")[0];
      copyBefore(inline, children(wrapperElement, "Error"), creatives);
      copyBefore(inline, children(wrapperElement, "Impression"), creatives);
    }

    return output;
  }
}
