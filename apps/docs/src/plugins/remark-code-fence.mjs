// Turns every fenced code block in the site's MDX into `<CodeFence code="…" lang="…" />`, which renders DBM's
// `CodeBlock` (highlighting and a copy button) instead of a plain `<pre>`. The pages stay plain Markdown, so their
// Markdown copies for agents need no conversion.
export default function remarkCodeFence() {
  const visit = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type !== "code") {
        visit(child);
        return child;
      }
      const attributes = [{ type: "mdxJsxAttribute", name: "code", value: child.value }];
      if (child.lang) attributes.push({ type: "mdxJsxAttribute", name: "lang", value: child.lang });
      return { type: "mdxJsxFlowElement", name: "CodeFence", attributes, children: [] };
    });
  };
  return (tree) => visit(tree);
}
