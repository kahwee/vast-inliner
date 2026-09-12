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

function ensureChild(parent: Element, tagName: string, before?: Element): Element {
  const existing = children(parent, tagName)[0];
  if (existing) return existing;
  const ownerDocument = parent.ownerDocument;
  if (!ownerDocument) throw new Error("Cannot modify a detached XML element");
  const element = ownerDocument.createElement(tagName);
  parent.insertBefore(element, before ?? null);
  return element;
}

function mergeContainer(
  targetParent: Element,
  sourceParent: Element,
  containerName: string,
  childNames: string[],
  before?: Element,
): void {
  const sources = children(sourceParent, containerName);
  if (sources.length === 0) return;
  const target = ensureChild(targetParent, containerName, before);
  for (const source of sources) {
    copyBefore(
      target,
      childNames.flatMap((name) => children(source, name)),
      undefined,
    );
  }
}

function mergeLinearCreative(inline: Element, wrapper: Element): void {
  const targetLinear = descendantsAtPath(inline, ["Creatives", "Creative", "Linear"])[0];
  if (!targetLinear) return;
  const sourceLinears = descendantsAtPath(wrapper, ["Creatives", "Creative", "Linear"]);
  for (const sourceLinear of sourceLinears) {
    mergeContainer(
      targetLinear,
      sourceLinear,
      "TrackingEvents",
      ["Tracking"],
      children(targetLinear, "VideoClicks")[0] ?? children(targetLinear, "Icons")[0],
    );
    mergeContainer(
      targetLinear,
      sourceLinear,
      "VideoClicks",
      ["ClickTracking", "CustomClick"],
      children(targetLinear, "Icons")[0],
    );
  }
}

function mergeCreativeTracking(inline: Element, wrapper: Element): void {
  const targetIcons = descendantsAtPath(inline, [
    "Creatives",
    "Creative",
    "Linear",
    "Icons",
    "Icon",
  ]);
  const sourceIcons = descendantsAtPath(wrapper, [
    "Creatives",
    "Creative",
    "Linear",
    "Icons",
    "Icon",
  ]);
  sourceIcons.forEach((source, index) => {
    const program = source.getAttribute("program");
    const target =
      (program
        ? targetIcons.find((icon) => icon.getAttribute("program") === program)
        : undefined) ??
      targetIcons[index] ??
      targetIcons[0];
    if (target) {
      const sourceClicks = children(source, "IconClicks")[0];
      if (sourceClicks) {
        mergeContainer(target, source, "IconClicks", ["IconClickTracking"]);
      }
    }
  });

  const targetNonLinears = descendantsAtPath(inline, [
    "Creatives",
    "Creative",
    "NonLinearAds",
    "NonLinear",
  ]);
  const sourceNonLinears = descendantsAtPath(wrapper, [
    "Creatives",
    "Creative",
    "NonLinearAds",
    "NonLinear",
  ]);
  sourceNonLinears.forEach((source, index) => {
    const id = source.getAttribute("id");
    const target =
      (id ? targetNonLinears.find((creative) => creative.getAttribute("id") === id) : undefined) ??
      targetNonLinears[index] ??
      targetNonLinears[0];
    if (target) {
      copyBefore(
        target,
        children(source, "NonLinearClickTracking"),
        children(target, "NonLinearClickThrough")[0],
      );
    }
  });

  const targetCompanions = descendantsAtPath(inline, [
    "Creatives",
    "Creative",
    "CompanionAds",
    "Companion",
  ]);
  const sourceCompanions = descendantsAtPath(wrapper, [
    "Creatives",
    "Creative",
    "CompanionAds",
    "Companion",
  ]);
  sourceCompanions.forEach((source, index) => {
    const id = source.getAttribute("id");
    const target =
      (id
        ? targetCompanions.find((companion) => companion.getAttribute("id") === id)
        : undefined) ??
      targetCompanions[index] ??
      targetCompanions[0];
    if (target) {
      copyBefore(
        target,
        children(source, "CompanionClickTracking"),
        children(target, "TrackingEvents")[0],
      );
    }
  });
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
      const creatives = children(inline, "Creatives")[0];
      copyBefore(inline, children(wrapperElement, "Error"), creatives);
      copyBefore(inline, children(wrapperElement, "Impression"), creatives);
      mergeContainer(
        inline,
        wrapperElement,
        "ViewableImpression",
        ["Viewable", "NotViewable", "ViewUndetermined"],
        creatives,
      );
      mergeContainer(inline, wrapperElement, "AdVerifications", ["Verification"], creatives);
      mergeContainer(inline, wrapperElement, "Extensions", ["Extension"], creatives);
      mergeLinearCreative(inline, wrapperElement);
      mergeCreativeTracking(inline, wrapperElement);
    }

    return output;
  }
}
