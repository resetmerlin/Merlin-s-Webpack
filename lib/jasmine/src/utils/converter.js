import { createElement } from "./createElements";

/**
 * Converts a DOM node into a format suitable for the `createElement` function.
 *
 * @param {Node} node - A DOM node to convert.
 * @returns {string | object} - A string for text nodes, or an object representing the element.
 */
const convertNodeToCreateElement = (node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.trim() ?? "";
  }

  const tag = node.tagName.toLowerCase();

  const props = Array.from(node.attributes).reduce((acc, attr) => {
    acc[attr.name] = attr.value;
    return acc;
  }, {});

  const children = Array.from(node.childNodes)
    .map(convertNodeToCreateElement)
    .filter((child) => child !== "");

  return createElement(tag, props, ...children);
};

/**
 * Converts an HTML string to a format suitable for the `createElement` function by first parsing the string into a DOM structure.
 *
 * @param {string} htmlString - The HTML string to convert.
 * @returns {object | string} - The result of converting the first child of the parsed HTML document body.
 */
export const convertHTMLToCreateElement = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const firstChild = doc.body.firstChild;

  if (!firstChild) {
    throw new Error("HTML string did not parse correctly.");
  }

  return convertNodeToCreateElement(firstChild);
};
