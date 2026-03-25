export interface XmlCleanupOptions {
  trimTextNodes: boolean;
  removeComments: boolean;
  removeEmptyNodes: boolean;
  sortAttributes: boolean;
  sortTags: boolean;
  sortNodes: boolean;
  sortNodePath: string;
}

export const defaultXmlCleanupOptions: XmlCleanupOptions = {
  trimTextNodes: false,
  removeComments: false,
  removeEmptyNodes: false,
  sortAttributes: false,
  sortTags: false,
  sortNodes: false,
  sortNodePath: "",
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttribute(text: string): string {
  return escapeXml(text)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isIgnorableTextNode(node: ChildNode): boolean {
  return node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").trim();
}

function sortElementAttributes(element: Element): void {
  if (element.attributes.length < 2) {
    return;
  }

  const attributes = Array.from(element.attributes)
    .map((attribute) => ({
      name: attribute.name,
      value: attribute.value,
      namespaceURI: attribute.namespaceURI,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const attribute of Array.from(element.attributes)) {
    element.removeAttributeNode(attribute);
  }

  for (const attribute of attributes) {
    if (attribute.namespaceURI) {
      element.setAttributeNS(
        attribute.namespaceURI,
        attribute.name,
        attribute.value,
      );
    } else {
      element.setAttribute(attribute.name, attribute.value);
    }
  }
}

function getElementSortKey(element: Element): string {
  const serializer = new XMLSerializer();
  return `${element.tagName}\u0000${serializer.serializeToString(element)}`;
}

function parsePathSegments(path: string): string[] {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function parseSortNodePaths(value: string): string[][] {
  return value
    .split(",")
    .map((path) => parsePathSegments(path))
    .filter((segments) => segments.length >= 3);
}

function arraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function getNestedElementText(
  element: Element,
  pathSegments: string[],
): string {
  let currentElement: Element | null = element;

  for (const segment of pathSegments) {
    currentElement =
      Array.from(currentElement.children).find(
        (child) => child.tagName === segment,
      ) ?? null;

    if (!currentElement) {
      return "";
    }
  }

  return currentElement.textContent?.trim() ?? "";
}

function sortNodesByPath(
  element: Element,
  currentPath: string[],
  options: XmlCleanupOptions,
): void {
  if (!options.sortNodes) {
    return;
  }

  for (const pathSegments of parseSortNodePaths(options.sortNodePath)) {
    const parentPath = pathSegments.slice(0, -2);
    const nodeTag = pathSegments[pathSegments.length - 2];
    const keyPath = pathSegments.slice(pathSegments.length - 1);

    if (!arraysEqual(currentPath, parentPath)) {
      continue;
    }

    const childNodes = Array.from(element.childNodes);
    const matchingElements = childNodes.filter(
      (child): child is Element =>
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).tagName === nodeTag,
    );

    if (matchingElements.length < 2) {
      continue;
    }

    const lastMatchingIndex = childNodes.reduce(
      (lastIndex, child, index) =>
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).tagName === nodeTag
          ? index
          : lastIndex,
      -1,
    );
    const anchorNode =
      lastMatchingIndex >= 0 ? childNodes[lastMatchingIndex + 1] ?? null : null;

    const sortedElements = matchingElements
      .slice()
      .sort((left, right) => {
        const leftKey = getNestedElementText(left, keyPath);
        const rightKey = getNestedElementText(right, keyPath);
        const keyDiff = leftKey.localeCompare(rightKey);

        if (keyDiff !== 0) {
          return keyDiff;
        }

        return getElementSortKey(left).localeCompare(getElementSortKey(right));
      });

    for (const matchingElement of matchingElements) {
      element.removeChild(matchingElement);
    }

    for (const sortedElement of sortedElements) {
      element.insertBefore(sortedElement, anchorNode);
    }
  }
}

function isElementEmpty(element: Element): boolean {
  return (
    element.attributes.length === 0 &&
    Array.from(element.childNodes).every((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        return false;
      }

      if (child.nodeType === Node.TEXT_NODE) {
        return !(child.textContent ?? "").trim();
      }

      return true;
    })
  );
}

function normalizeElement(
  element: Element,
  options: XmlCleanupOptions,
  currentPath: string[],
): void {
  if (options.sortAttributes) {
    sortElementAttributes(element);
  }

  for (const child of Array.from(element.childNodes)) {
    if (options.removeComments && child.nodeType === Node.COMMENT_NODE) {
      element.removeChild(child);
      continue;
    }

    if (child.nodeType === Node.TEXT_NODE) {
      if (options.trimTextNodes && child.textContent) {
        child.textContent = child.textContent.trim();
      }

      if (!(child.textContent ?? "").trim()) {
        element.removeChild(child);
      }
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as Element;
      normalizeElement(childElement, options, [
        ...currentPath,
        childElement.tagName,
      ]);

      if (options.removeEmptyNodes && isElementEmpty(childElement)) {
        element.removeChild(childElement);
      }
    }
  }

  sortNodesByPath(element, currentPath, options);

  if (!options.sortTags) {
    return;
  }

  const significantChildren = Array.from(element.childNodes).filter(
    (child) =>
      !isIgnorableTextNode(child) && child.nodeType !== Node.COMMENT_NODE,
  );

  if (
    significantChildren.length < 2 ||
    significantChildren.some((child) => child.nodeType !== Node.ELEMENT_NODE)
  ) {
    return;
  }

  const sortedChildren = significantChildren
    .slice()
    .sort((left, right) =>
      getElementSortKey(left as Element).localeCompare(
        getElementSortKey(right as Element),
      ),
    );

  for (const child of sortedChildren) {
    element.appendChild(child);
  }
}

function formatXmlElement(
  element: Element,
  indent: number,
  level: number,
): string {
  const indentation = " ".repeat(indent * level);
  const childIndentation = " ".repeat(indent * (level + 1));
  let result = `${indentation}<${element.tagName}`;

  for (const attribute of Array.from(element.attributes)) {
    result += ` ${attribute.name}="${escapeXmlAttribute(attribute.value)}"`;
  }

  const childElements = Array.from(element.children);
  const textNodes = Array.from(element.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent ?? "")
    .filter((text) => text.trim().length > 0);

  if (childElements.length === 0 && textNodes.length === 0) {
    return `${result} />`;
  }

  if (childElements.length === 0 && textNodes.length > 0) {
    const textValue = textNodes.join("\n");
    if (!textValue.includes("\n")) {
      return `${result}>${escapeXml(textValue)}</${element.tagName}>`;
    }

    result += ">\n";
    for (const line of textValue.split("\n")) {
      result += `${childIndentation}${escapeXml(line)}\n`;
    }
    result += `${indentation}</${element.tagName}>`;
    return result;
  }

  result += ">\n";

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += `${formatXmlElement(child as Element, indent, level + 1)}\n`;
      continue;
    }

    if (child.nodeType === Node.TEXT_NODE) {
      const textValue = child.textContent ?? "";
      if (!textValue.trim()) {
        continue;
      }

      for (const line of textValue.split("\n")) {
        result += `${childIndentation}${escapeXml(line)}\n`;
      }
    }
  }

  result += `${indentation}</${element.tagName}>`;
  return result;
}

export function formatXmlWithCleanup(
  xml: string,
  indent: number,
  options: XmlCleanupOptions = defaultXmlCleanupOptions,
): { formatted: string; error: string | null } {
  if (!xml.trim()) {
    return { formatted: "", error: null };
  }

  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(xml, "text/xml");
    const parserError = documentNode.querySelector("parsererror");
    if (parserError) {
      return {
        formatted: "",
        error: parserError.textContent || "Invalid XML.",
      };
    }

    const rootElement = documentNode.documentElement;
    normalizeElement(rootElement, options, [rootElement.tagName]);

    return {
      formatted: formatXmlElement(rootElement, indent, 0),
      error: null,
    };
  } catch (error) {
    return {
      formatted: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
