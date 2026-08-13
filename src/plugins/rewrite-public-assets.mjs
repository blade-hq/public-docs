function rewrite(value, base) {
  if (typeof value !== 'string') return value;
  return value.replace(/(?:\.\.\/)+(images|downloads)\//g, `${base}$1/`);
}

function visit(node, base) {
  if (!node || typeof node !== 'object') return;

  if (node.properties) {
    for (const property of ['src', 'href', 'poster']) {
      node.properties[property] = rewrite(node.properties[property], base);
    }
  }

  // Raw HTML in Markdown and JSX attributes in MDX do not use HAST properties.
  if (typeof node.value === 'string' && (node.type === 'raw' || node.type === 'html')) {
    node.value = rewrite(node.value, base);
  }
  if (Array.isArray(node.attributes)) {
    for (const attribute of node.attributes) {
      if (attribute && ['src', 'href', 'poster'].includes(attribute.name)) {
        attribute.value = rewrite(attribute.value, base);
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child, base);
  }
}

export default function rewritePublicAssets(options = {}) {
  const configuredBase = options.base || '/';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

  return (tree) => visit(tree, base);
}
