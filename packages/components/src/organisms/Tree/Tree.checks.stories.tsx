import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Tree } from "./Tree";
import { allSizes, Demo, manyNodes, RenameDemo, RowMenuDemo } from "./TreeStoryKit";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of the
// sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus rings,
// target sizes and a window of rows over a long tree — measured in Chromium.
const meta: Meta = {
  title: "Organisms/Data Display/Tree/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (element: Element) => element.getBoundingClientRect();
const colour = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};
/** A length token such as `2.25rem` in pixels. */
const tokenPx = (name: string): number => {
  const probe = document.createElement("div");
  probe.style.blockSize = `var(${name})`;
  probe.style.position = "absolute";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
};
async function realRightClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "right", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "right", clickCount: 1 });
}
const rowOf = (name: string | RegExp) => body.getByRole("treeitem", { name });
const part = (row: HTMLElement, name: string) => row.querySelector<HTMLElement>(`[data-tree-part="${name}"]`) as HTMLElement;

export const RowsAreTheHeightOfTheirToken: Story = {
  name: "Every row is the height of its token at every size, selected or not, with check boxes or without",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} aria-label={`Size ${size}`} selectionMode="multiple" defaultValue={["app"]} defaultExpandAll />
      ))}
      {allSizes.map((size) => (
        <Demo key={size} size={size} aria-label={`Boxes ${size}`} checkable defaultExpandAll />
      ))}
    </div>
  ),
  play: async () => {
    for (const label of ["Size", "Boxes"]) {
      for (const size of allSizes) {
        const expected = tokenPx(`--dbm-tree-row-height-${size}`);
        await expect(expected).toBeGreaterThanOrEqual(24);
        const rows = within(body.getByRole("tree", { name: `${label} ${size}` })).getAllByRole("treeitem");
        for (const row of rows) await expect(Math.abs(box(row).height - expected)).toBeLessThan(0.5);
      }
    }
  },
};

export const ArrowsAndBoxesAreTargets: Story = {
  name: "The arrow and the check box are hit on a box at least 24 pixels tall, at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} aria-label={`Targets ${size}`} checkable defaultExpandAll />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of allSizes) {
      const tree = body.getByRole("tree", { name: `Targets ${size}` });
      const row = within(tree).getByRole("treeitem", { name: "src" });
      // elementFromPoint sees only what is in the viewport.
      row.scrollIntoView({ block: "center" });
      for (const name of ["chevron", "check"]) {
        const target = part(row, name);
        const rect = box(target);
        // The hit area is the element's own box plus room to the minimum height above and below: points 11px above and below
        // the centre, and just inside each side, all land on the target.
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const reach = Math.min(11, box(row).height / 2 - 1);
        for (const [x, y] of [[cx, cy - reach], [cx, cy + reach], [rect.left + 1, cy], [rect.right - 1, cy]] as const) {
          const hit = document.elementFromPoint(x, y);
          await expect(hit === target || target.contains(hit), `${size} ${name} at ${Math.round(x)},${Math.round(y)} hit ${(hit as HTMLElement | null)?.outerHTML.slice(0, 80)}`).toBe(true);
        }
      }
    }
  },
};

export const LongTreeDrawsAWindow: Story = {
  name: "A long tree draws a window, keeps the scrollbar true and reaches the end from the keyboard",
  render: () => <Tree aria-label="Long" nodes={manyNodes(500, 0).map((node) => ({ ...node, children: undefined }))} maxHeight="20rem" windowed />,
  play: async () => {
    const tree = body.getByRole("tree", { name: "Long" });
    const frame = tree.parentElement as HTMLElement;
    await waitFor(() => expect(within(tree).getAllByRole("treeitem").length).toBeGreaterThan(5));
    await expect(within(tree).getAllByRole("treeitem").length).toBeLessThan(80);
    const rowPx = tokenPx("--dbm-tree-row-height-md");
    await waitFor(() => expect(Math.abs(frame.scrollHeight - 500 * rowPx)).toBeLessThan(rowPx * 2));
    await userEvent.tab();
    await expect(within(tree).getAllByRole("treeitem")[0]).toHaveFocus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(within(tree).getByRole("treeitem", { name: "Folder 500" })).toHaveFocus());
    await expect(within(tree).getAllByRole("treeitem").length).toBeLessThan(80);
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(within(tree).getByRole("treeitem", { name: "Folder 1" })).toHaveFocus());
  },
};

export const FocusRingIsInsideTheRow: Story = {
  name: "The focus ring is drawn inside the row, inside the box that scrolls",
  render: () => <Demo aria-label="Ring" maxHeight="9rem" defaultExpandAll />,
  play: async () => {
    const tree = body.getByRole("tree", { name: "Ring" });
    await userEvent.tab();
    const row = within(tree).getAllByRole("treeitem")[0] as HTMLElement;
    await expect(row).toHaveFocus();
    const style = getComputedStyle(row);
    await expect(style.outlineStyle).toBe("solid");
    await expect(Number.parseFloat(style.outlineOffset)).toBeLessThan(0);
    const frame = (tree.parentElement as HTMLElement).getBoundingClientRect();
    await expect(box(row).left).toBeGreaterThanOrEqual(frame.left);
    await expect(box(row).right).toBeLessThanOrEqual(frame.right + 0.5);
  },
};

export const RightToLeftMirrorsTheTree: Story = {
  name: "Right to left indents from the right, mirrors the arrow and swaps the arrow keys",
  render: () => <Demo aria-label="Mirrored" dir="rtl" defaultExpandedIds={["src"]} />,
  play: async () => {
    const tree = body.getByRole("tree", { name: "Mirrored" });
    const parent = within(tree).getByRole("treeitem", { name: "src" });
    const child = within(tree).getByRole("treeitem", { name: /App\.tsx/ });
    const frame = box(tree);
    // The child sits nearer the left than the parent: the indent grows leftwards, away from the right-hand edge.
    const slot = (row: HTMLElement) => box(row.firstElementChild as Element);
    await expect(slot(child).right).toBeLessThan(slot(parent).right);
    await expect(frame.right - slot(parent).right).toBeLessThan(frame.right - slot(child).right);
    await userEvent.tab();
    // Right closes an open row here: in a right-to-left tree it is the key that goes back, and Left goes forward.
    await userEvent.keyboard("{ArrowRight}");
    await expect(parent).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(parent).toHaveAttribute("aria-expanded", "true");
    const arrow = part(parent, "chevron").querySelector("svg") as SVGElement;
    await waitFor(() => expect(getComputedStyle(arrow).transform).not.toBe("none"));
  },
};

export const PointerOpensChecksAndSelects: Story = {
  name: "A real pointer opens from the arrow, checks from the box and selects from the label",
  render: () => <Demo aria-label="Pointer" selectionMode="single" checkable />,
  play: async () => {
    const parent = rowOf("src");
    await userEvent.click(part(parent, "chevron"));
    await expect(parent).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(part(parent, "check"));
    await expect(parent).toHaveAttribute("aria-checked", "true");
    await expect(parent).toHaveAttribute("aria-selected", "false");
    await userEvent.click(within(parent).getByText("src"));
    await expect(parent).toHaveAttribute("aria-selected", "true");
    await userEvent.dblClick(within(rowOf(/^docs/)).getByText("docs"));
    await expect(rowOf(/^docs/)).toHaveAttribute("aria-expanded", "true");
  },
};

export const SingleTabStop: Story = {
  name: "The tree is one tab stop, and the stop follows the arrow keys",
  render: () => (
    <div>
      <button type="button">before</button>
      <Demo aria-label="Stop" defaultExpandAll />
      <button type="button">after</button>
    </div>
  ),
  play: async () => {
    await userEvent.tab();
    await userEvent.tab();
    await expect(rowOf("src")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(document.activeElement).toBe(within(body.getByRole("tree", { name: "Stop" })).getAllByRole("treeitem")[2]);
    await userEvent.tab();
    await expect(body.getByRole("button", { name: "after" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(document.activeElement).toBe(within(body.getByRole("tree", { name: "Stop" })).getAllByRole("treeitem")[2]);
  },
};

export const SelectedRowIsMarkedBeyondItsFill: Story = {
  name: "A selected row has a coloured bar, so forced colours keep it",
  render: () => <Demo aria-label="Forced" selectionMode="single" defaultValue={["docs"]} checkable defaultCheckedIds={["logo"]} defaultExpandAll />,
  play: async () => {
    const selected = rowOf(/^docs/);
    const other = rowOf("README.md");
    await expect(Number.parseFloat(getComputedStyle(selected).borderInlineStartWidth)).toBeGreaterThan(0);
    await expect(getComputedStyle(selected).borderInlineStartWidth).toBe(getComputedStyle(other).borderInlineStartWidth);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      await expect(getComputedStyle(selected).borderInlineStartColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(other).borderInlineStartColor).toBe(colour("Canvas"));
      const checked = part(rowOf("logo.png"), "check");
      await expect(getComputedStyle(checked).backgroundColor).toBe(colour("Highlight"));
    } finally {
      await emulate("none");
    }
  },
};

export const LabelsAreCutWithAnEllipsis: Story = {
  name: "A label that does not fit is cut with an ellipsis instead of changing the row's height",
  render: () => (
    <div style={{ inlineSize: "10rem" }}>
      <Tree
        aria-label="Cut"
        nodes={[{ id: "a", label: "A very long name that cannot possibly fit in ten rem of width", description: "and a long description", trailing: "3 KB" }]}
      />
    </div>
  ),
  play: async () => {
    const row = body.getByRole("treeitem");
    const label = row.querySelector<HTMLElement>("span:nth-of-type(2)") as HTMLElement;
    await expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(box(row).height).toBeCloseTo(tokenPx("--dbm-tree-row-height-md"), 0);
  },
};

export const DisabledRowStaysInTheArrowOrder: Story = {
  name: "A disabled row is dimmed, cannot be hit and is still reached by the arrow keys",
  render: () => <Demo aria-label="Disabled" selectionMode="single" defaultExpandedIds={["src", "components"]} />,
  play: async () => {
    const disabled = rowOf(/Legacy/);
    await expect(Number.parseFloat(getComputedStyle(disabled).opacity)).toBeLessThan(1);
    await userEvent.click(within(disabled).getByText("Legacy.tsx"));
    await expect(disabled).toHaveAttribute("aria-selected", "false");
    rowOf(/Card/).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(disabled).toHaveFocus();
  },
};

export const FailedAndEmptyRowsKeepTheRowHeight: Story = {
  name: "A row that failed to load and the Empty row are the height of their token, with the words in danger and quiet colours",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {allSizes.map((size) => (
        <Tree
          key={size}
          aria-label={`Lazy ${size}`}
          size={size}
          defaultExpandedIds={["bad", "none"]}
          errorIds={["bad"]}
          nodes={[
            { id: "bad", label: "bad", hasChildren: true },
            { id: "none", label: "none", hasChildren: true, children: [] },
          ]}
        />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of allSizes) {
      const expected = tokenPx(`--dbm-tree-row-height-${size}`);
      const rows = within(body.getByRole("tree", { name: `Lazy ${size}` })).getAllByRole("treeitem");
      await expect(rows.length).toBe(3);
      for (const row of rows) await expect(Math.abs(box(row).height - expected)).toBeLessThan(0.5);
    }
    const tree = body.getByRole("tree", { name: "Lazy md" });
    const failed = within(tree).getByRole("treeitem", { name: /bad/ });
    await expect(getComputedStyle(failed.querySelector("[class*=failure]") as Element).color).toBe(colour("var(--dbm-text-danger)"));
    const empty = within(tree).getByRole("treeitem", { name: "Empty" });
    await expect(getComputedStyle(empty).color).toBe(colour("var(--dbm-text-secondary)"));
    // a real pointer over the Empty row does not fill it as it does a row (the synthetic hover of the test library sets no :hover)
    const pointOver = async (element: Element) => {
      element.scrollIntoView({ block: "center" });
      const rect = box(element);
      // The pointer is placed in the page that holds the test iframe, so the frame's own offset and scale are added.
      const frame = window.frameElement?.getBoundingClientRect();
      const scale = frame ? frame.width / window.innerWidth : 1;
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale, y: (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale });
    };
    await pointOver(failed);
    await waitFor(() => expect(getComputedStyle(failed).backgroundColor).not.toBe("rgba(0, 0, 0, 0)"));
    await pointOver(empty);
    await expect(getComputedStyle(empty).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const RetryMarkIsATarget: Story = {
  name: "The mark on a row that failed to load is hit on a box at least 24 pixels tall, and a click on it asks to try again",
  render: () => {
    const Retrying = () => {
      const [tries, setTries] = useState(0);
      return (
        <div>
          <p data-testid="tries">{tries}</p>
          <Tree aria-label="Retry" defaultExpandedIds={["bad"]} errorIds={["bad"]} onRetry={() => setTries((count) => count + 1)} nodes={[{ id: "bad", label: "bad", hasChildren: true }]} />
        </div>
      );
    };
    return <Retrying />;
  },
  play: async () => {
    const row = rowOf(/bad/);
    const mark = part(row, "retry");
    const rect = box(mark);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (const dy of [-11, 11]) {
      const hit = document.elementFromPoint(cx, cy + dy);
      await expect(hit === mark || mark.contains(hit)).toBe(true);
    }
    await userEvent.click(mark);
    await expect(body.getByTestId("tries")).toHaveTextContent("1");
    row.focus();
    await userEvent.keyboard("{Enter}");
    await expect(body.getByTestId("tries")).toHaveTextContent("2");
  },
};

export const RowMenuOpensFromAClickAndAKey: Story = {
  name: "A real right-click and the context-menu key each open the menu for the row, and Escape gives the focus back to it",
  render: () => <RowMenuDemo />,
  play: async () => {
    const row = rowOf(/App\.tsx/);
    row.scrollIntoView({ block: "center" });
    await realRightClick(row);
    const menu = await body.findByRole("menu");
    await expect(within(menu).getByText("App.tsx")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(rowOf(/App\.tsx/)).toHaveFocus());
    const other = rowOf(/index\.ts/);
    other.focus();
    await userEvent.keyboard("{ContextMenu}");
    const second = await body.findByRole("menu");
    await expect(within(second).getByText("index.ts")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(rowOf(/index\.ts/)).toHaveFocus());
  },
};

export const RenameFieldFitsTheRow: Story = {
  name: "While a row is renamed it keeps its height at every size, the field fits inside it and its ring is drawn inside the field",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} aria-label={`Rename ${size}`} renamable />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of allSizes) {
      const tree = body.getByRole("tree", { name: `Rename ${size}` });
      const row = within(tree).getByRole("treeitem", { name: "README.md" });
      row.scrollIntoView({ block: "center" });
      row.focus();
      await userEvent.keyboard("{F2}");
      const field = within(tree).getByRole("textbox");
      await expect(field).toHaveFocus();
      const expected = tokenPx(`--dbm-tree-row-height-${size}`);
      await expect(Math.abs(box(row).height - expected)).toBeLessThan(0.5);
      await expect(box(field).height).toBeLessThanOrEqual(expected + 0.5);
      await expect(box(field).height).toBeGreaterThanOrEqual(24);
      await expect(box(field).top).toBeGreaterThanOrEqual(box(row).top);
      await expect(box(field).bottom).toBeLessThanOrEqual(box(row).bottom);
      const style = getComputedStyle(field);
      await expect(style.outlineStyle).toBe("solid");
      await expect(Number.parseFloat(style.outlineOffset)).toBeLessThan(0);
      await userEvent.keyboard("{Escape}");
    }
  },
};

export const RenameFlowInTheStory: Story = {
  name: "Renaming from F2 and from a button changes the label, and a taken name stays in the field with its message",
  render: () => <RenameDemo />,
  play: async () => {
    const row = rowOf(/Button\.tsx/);
    row.focus();
    await userEvent.keyboard("{F2}{Control>}a{/Control}Card.tsx{Enter}");
    await expect(body.getByRole("alert")).toHaveTextContent("already exists");
    await userEvent.keyboard("{Control>}a{/Control}Chip.tsx{Enter}");
    await expect(body.getByTestId("renamed")).toHaveTextContent("Renamed to Chip.tsx");
    await expect(rowOf(/Chip\.tsx/)).toHaveFocus();
    await userEvent.click(body.getByRole("button", { name: "Rename Card.tsx" }));
    await expect(body.getByRole("textbox")).toHaveValue("Card.tsx");
    await expect(body.getByRole("textbox")).toHaveFocus();
  },
};

export const LoadingRowsKeepTheRowHeight: Story = {
  name: "Placeholder rows are the height of a row at every size and cannot be pointed at",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {allSizes.map((size) => (
        <Tree key={size} aria-label={`Loading ${size}`} size={size} nodes={[]} loading />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of allSizes) {
      const group = body.getByRole("group", { name: `Loading ${size}` });
      const placeholders = [...group.querySelectorAll<HTMLElement>('[aria-hidden="true"][class*="skeletonRow"]')];
      await expect(placeholders.length).toBe(3);
      const expected = tokenPx(`--dbm-tree-row-height-${size}`);
      for (const placeholder of placeholders) {
        await expect(Math.abs(box(placeholder).height - expected)).toBeLessThan(0.5);
        await expect(getComputedStyle(placeholder).pointerEvents).toBe("none");
      }
    }
  },
};
