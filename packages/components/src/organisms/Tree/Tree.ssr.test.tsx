import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tree } from "./Tree";
import type { TreeNode } from "./Tree.types";

// A server render must not touch `window` or `document`, and the first client render must match it: the row height, which
// only the browser can read from its token, arrives after hydration.
const nodes: TreeNode[] = [
  { id: "a", label: "Alpha", children: [{ id: "a1", label: "One" }] },
  { id: "b", label: "Beta", hasChildren: true },
];

const tree = <Tree aria-label="Letters" nodes={nodes} defaultExpandAll selectionMode="multiple" checkable defaultValue={["a1"]} highlightQuery="one" />;
const longTree = (
  <Tree
    aria-label="Many"
    windowed
    maxHeight={200}
    dir="rtl"
    nodes={Array.from({ length: 500 }, (_, position) => ({ id: `n${position}`, label: `Row ${position}` }))}
  />
);

const featureTree = (
  <Tree
    aria-label="Letters"
    nodes={nodes}
    defaultExpandAll
    loading
    renamable
    onRename={() => undefined}
    validateRename={() => undefined}
    onItemContextMenu={() => undefined}
    errorIds={["b"]}
  />
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Tree — server render and hydration", () => {
  it("renders to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(tree);
    expect(html).toContain('role="tree"');
    expect(html).toContain('aria-multiselectable="true"');
    expect(html).toContain("Alpha");
  });

  it("hydrates the same markup with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
  });

  it("renders a windowed right-to-left tree to a string with no window or document, drawing only the first rows", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(longTree);
    expect(html).toContain('dir="rtl"');
    expect(html.match(/role="treeitem"/g)?.length).toBeLessThan(100);
  });

  it("hydrates that tree with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(longTree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, longTree, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
  });

  it("renders loading placeholders, a failed row and the renaming props to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(featureTree);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Couldn&#x27;t load");
    expect(renderToString(<Tree aria-label="None" nodes={[]} loading />)).toContain("Loading");
  });

  it("hydrates that tree with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(featureTree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, featureTree, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
  });

  it("renders an empty tree to a string", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(renderToString(<Tree aria-label="None" nodes={[]} />)).toContain("No items");
  });
});
