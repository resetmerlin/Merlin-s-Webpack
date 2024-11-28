/**
 * Creates a virtual DOM element representation.
 *
 * This function mimics the behavior of React's createElement, but for a custom virtual DOM system.
 * It constructs an object that represents a node in the virtual DOM, including its type (tag),
 * attributes (props), and children.
 *
 * @param {string} type - The type of the element (e.g., 'div', 'span').
 * @param {Object} attr - An object containing key-value pairs of attributes.
 * @param {...any} children - Child elements or text. Can be an array of children, a single child, or even nested children.
 * @returns {Object} - An object representing a virtual DOM node.
 */
export const createElement = (type, attr, ...children) => {
  if (!attr) attr = {};

  return { type, attr, children };
};
