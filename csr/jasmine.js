class Jasmine {
  constructor() {}

  init(container, oldNode, newNode) {
    container.appendChild(oldNode);
    this.patch(oldNode, newNode);
  }

  patch(oldNode, newNode) {
    const renderedNewNode = this.render(newNode);

    if (!oldNode && newNode) {
      oldNode.parentNode.appendChild(renderedNewNode);
    }

    if (oldNode.isEqualNode(renderedNewNode)) return;

    if (oldNode.nodeName !== renderedNewNode.nodeName) {
      oldNode.parentNode?.replaceChild(renderedNewNode, oldNode);
    }

    if (
      oldNode &&
      renderedNewNode &&
      oldNode.attributes.length !== renderedNewNode.attributes.length
    ) {
      for (const attr of renderedNewNode.attributes) {
        oldNode.setAttribute(attr.name, attr.value);
      }
    }

    if (!oldNode.childNodes.length && renderedNewNode.childNodes.length) {
      oldNode.parentNode?.replaceChild(renderedNewNode, oldNode);
    } else if (oldNode.childNodes.length && renderedNewNode.childNodes.length) {
      if (oldNode.childNodes.length < newNode.children.length) {
        for (let i = 0; i < newNode.children.length; i++) {
          if (oldNode.childNodes[i] && newNode.children[i]) {
            this.patch(oldNode.childNodes[i], newNode.children[i]);
          } else if (!oldNode.childNodes[i] && newNode.children[i]) {
            oldNode.appendChild(this.render(newNode.children[i]));
          }
        }
      } else {
        for (let i = 0; i < oldNode.childNodes.length; i++) {
          if (oldNode.childNodes[i] && newNode.children[i]) {
            this.patch(oldNode.childNodes[i], newNode.children[i]);
          } else if (oldNode.childNodes[i] && !newNode.children[i]) {
            oldNode.removeChild(oldNode.childNodes[i]);
          }
        }
      }
    } else if (
      oldNode.childNodes.length &&
      !renderedNewNode.childNodes.length
    ) {
      for (let i = 0; i < oldNode.childNodes.length; i++) {
        if (oldNode.childNodes[i] && !newNode.children[i]) {
          oldNode.removeChild(oldNode.childNodes[i]);
        }
      }
    }
  }

  render(component) {
    if (!component) return;

    if (typeof component === "string") {
      return document.createTextNode(component);
    }

    const { type, attr, children } = component;
    const $component = document.createElement(type);

    for (const [key, value] of Object.entries(attr)) {
      $component.setAttribute(key, value);
    }

    children.forEach((child) => {
      $component.appendChild(this.render(child));
    });

    return $component;
  }

  reRender(oldDom, newDom) {
    this.patch(oldDom, newDom);
  }

  useState(initialValue) {
    let _val = initialValue;

    const state = () => _val;
    const setState = (newVal) => {
      _val = newVal;
      // renderFunction();
    };

    return [state, setState];
  }
}

export default Jasmine;
