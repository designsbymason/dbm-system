import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { createPortal } from "react-dom";
import { FileIcon, FolderIcon } from "@dbm-system/icons";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tree } from "./Tree";
import type { TreeController, TreeNode, TreeProps, TreeRowState } from "./Tree.types";

afterEach(() => {
  vi.restoreAllMocks();
});

const files: TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: FolderIcon,
    children: [
      { id: "app", label: "App.tsx", icon: FileIcon },
      { id: "lib", label: "lib", children: [{ id: "util", label: "util.ts" }, { id: "math", label: "math.ts", disabled: true }] },
      { id: "index", label: "index.ts" },
    ],
  },
  { id: "docs", label: "docs", children: [{ id: "guide", label: "guide.md" }] },
  { id: "readme", label: "README.md", description: "Start here", trailing: <span>2 KB</span> },
];

function Basic(props: Partial<TreeProps>) {
  return <Tree aria-label="Files" nodes={files} {...props} />;
}

const item = (name: string | RegExp) => screen.getByRole("treeitem", { name });
const names = () => screen.queryAllByRole("treeitem").map((row) => row.textContent);

describe("Tree — structure", () => {
  it("draws a named tree of treeitems, only the top level while everything is closed", () => {
    render(<Basic />);
    const tree = screen.getByRole("tree", { name: "Files" });
    const rows = within(tree).getAllByRole("treeitem");
    expect(rows.map((row) => row.getAttribute("aria-level"))).toEqual(["1", "1", "1"]);
    expect(rows.map((row) => row.getAttribute("aria-posinset"))).toEqual(["1", "2", "3"]);
    expect(rows.map((row) => row.getAttribute("aria-setsize"))).toEqual(["3", "3", "3"]);
  });

  it("marks a row with children aria-expanded and a leaf with none", () => {
    render(<Basic />);
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
    expect(item(/README/)).not.toHaveAttribute("aria-expanded");
  });

  it("draws the description and trailing content in the row", () => {
    render(<Basic />);
    expect(item(/README/)).toHaveTextContent("README.mdStart here2 KB");
  });

  it("starts with every row that has children open under defaultExpandAll", () => {
    render(<Basic defaultExpandAll />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(9);
    expect(item("util.ts")).toHaveAttribute("aria-level", "3");
  });

  it("starts with the given rows open under defaultExpandedIds", () => {
    render(<Basic defaultExpandedIds={["docs"]} />);
    expect(names()).toEqual(["src", "docs", "guide.md", "README.mdStart here2 KB"]);
  });

  it("forwards the ref to the element with the tree role and the id and test id too, putting className and style on the box that scrolls", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Tree ref={ref} aria-label="Files" nodes={files} id="t" data-testid="tree" className="mine" style={{ margin: 3 }} />);
    expect(ref.current).toBe(screen.getByRole("tree"));
    expect(screen.getByRole("tree")).toHaveAttribute("id", "t");
    expect(screen.getByTestId("tree")).toBe(screen.getByRole("tree"));
    const frame = screen.getByRole("tree").parentElement as HTMLElement;
    expect(frame).toHaveClass("mine");
    expect(frame.style.margin).toBe("3px");
  });

  it("limits the height of the box that scrolls with maxHeight", () => {
    render(<Basic maxHeight={120} />);
    expect((screen.getByRole("tree").parentElement as HTMLElement).style.maxBlockSize).toBe("120px");
  });

  it("draws the empty message in a group, and nothing with empty={false}", () => {
    const { rerender } = render(<Tree aria-label="Files" nodes={[]} />);
    expect(screen.queryByRole("tree")).toBeNull();
    expect(screen.getByRole("group")).toHaveTextContent("No items");
    rerender(<Tree aria-label="Files" nodes={[]} empty={<p>Nothing here</p>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    rerender(<Tree aria-label="Files" nodes={[]} empty={false} />);
    expect(screen.getByRole("group")).toBeEmptyDOMElement();
  });

  it("translates the empty message", () => {
    render(<Tree aria-label="Files" nodes={[]} labels={{ empty: "Vide" }} />);
    expect(screen.getByText("Vide")).toBeInTheDocument();
  });

  it("warns once when there is no name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Tree nodes={files} />);
    rerender(<Tree nodes={files} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("no accessible name");
  });

  it("draws a node's icon, and gives a custom label the row's state", () => {
    const renderLabel = vi.fn((node: TreeNode, _state: TreeRowState) => <b>{node.label.toUpperCase()}</b>);
    const { container } = render(<Basic renderLabel={renderLabel} defaultExpandedIds={["src"]} />);
    expect(screen.getByText("SRC")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(2);
    const call = renderLabel.mock.calls.find(([node]) => node.id === "src");
    expect(call?.[1]).toMatchObject({ level: 1, expanded: true, hasChildren: true, selected: false, checked: false, disabled: false });
  });

  it("marks the text that matches highlightQuery", () => {
    const { container } = render(<Basic highlightQuery="app" defaultExpandedIds={["src"]} />);
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("App");
  });
});

describe("Tree — expansion", () => {
  it("opens and closes a row with a click on its arrow", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Basic onExpandedChange={onExpandedChange} />);
    const arrow = item("src").querySelector("[data-tree-part=chevron]") as HTMLElement;
    await user.click(arrow);
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src"]);
    await user.click(arrow);
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
  });

  it("does not open a row when its label is clicked", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByText("src"));
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a row with a double click, and reports it as an activation when there is a handler", async () => {
    const user = userEvent.setup();
    const onItemActivate = vi.fn();
    const { unmount } = render(<Basic />);
    await user.dblClick(screen.getByText("src"));
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    unmount();
    render(<Basic onItemActivate={onItemActivate} />);
    await user.dblClick(screen.getByText("src"));
    expect(onItemActivate).toHaveBeenCalledWith("src");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("only asks when expandedIds is given: the rows change when the prop does (wired to state)", async () => {
    const user = userEvent.setup();
    function Wired() {
      const [open, setOpen] = useState<string[]>([]);
      return <Basic expandedIds={open} onExpandedChange={setOpen} />;
    }
    render(<Wired />);
    await user.click(item("src").querySelector("[data-tree-part=chevron]") as HTMLElement);
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(names()).toContain("App.tsx");
  });

  it("keeps the rows as they are when a controlled tree's owner does not apply the change", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Basic expandedIds={[]} onExpandedChange={onExpandedChange} />);
    await user.click(item("src").querySelector("[data-tree-part=chevron]") as HTMLElement);
    expect(onExpandedChange).toHaveBeenCalledWith(["src"]);
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("warns when it changes from uncontrolled to controlled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Basic />);
    rerender(<Basic expandedIds={[]} />);
    expect(warn.mock.calls.some(([text]) => String(text).includes("expandedIds"))).toBe(true);
  });

  it("shows a spinner and aria-busy while a row's children load, and announces them when they arrive", () => {
    const lazy: TreeNode[] = [{ id: "remote", label: "remote", hasChildren: true }];
    const { rerender } = render(<Tree aria-label="Files" nodes={lazy} defaultExpandedIds={["remote"]} loadingIds={["remote"]} />);
    expect(item("remote")).toHaveAttribute("aria-busy", "true");
    expect(item("remote")).toHaveAttribute("aria-expanded", "true");
    vi.useFakeTimers();
    rerender(
      <Tree
        aria-label="Files"
        nodes={[{ id: "remote", label: "remote", children: [{ id: "a", label: "a" }, { id: "b", label: "b" }] }]}
        defaultExpandedIds={["remote"]}
        loadingIds={[]}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("status")).toHaveTextContent("2 items loaded");
    vi.useRealTimers();
    expect(item("remote")).not.toHaveAttribute("aria-busy");
    expect(names()).toEqual(["remote", "a", "b"]);
  });

  it("lets a row that hasChildren be opened before its children exist", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={[{ id: "remote", label: "remote", hasChildren: true }]} onExpandedChange={onExpandedChange} />);
    await user.click(item("remote").querySelector("[data-tree-part=chevron]") as HTMLElement);
    expect(onExpandedChange).toHaveBeenCalledWith(["remote"]);
  });
});

describe("Tree — keyboard", () => {
  it("is one tab stop: the first row, then focus leaves the tree", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Basic defaultExpandAll />
        <button type="button">after</button>
      </>,
    );
    expect(screen.getAllByRole("treeitem").filter((row) => row.tabIndex === 0)).toHaveLength(1);
    await user.tab();
    await user.tab();
    expect(item("src")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("moves between visible rows with Up, Down, Home and End, and moves the tab stop with focus", async () => {
    const user = userEvent.setup();
    render(<Basic defaultExpandedIds={["src"]} />);
    item("src").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("App.tsx")).toHaveFocus();
    expect(item("App.tsx")).toHaveAttribute("tabindex", "0");
    expect(item("src")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{End}");
    expect(item(/README/)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item(/README/)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("src")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("src")).toHaveFocus();
  });

  it("opens a closed row with Right, then steps into it, and closes it with Left, then steps out to its parent", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    item("src").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(item("src")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("App.tsx")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("App.tsx")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item("src")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("swaps Left and Right in a right-to-left tree and mirrors the arrow", async () => {
    const user = userEvent.setup();
    const { container } = render(<Basic dir="rtl" />);
    item("src").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowLeft}");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
  });

  it("moves the tab stop to the closed row when the row that held it is hidden", async () => {
    const user = userEvent.setup();
    render(<Basic defaultExpandedIds={["src"]} />);
    item("App.tsx").focus();
    await user.click(item("src").querySelector("[data-tree-part=chevron]") as HTMLElement);
    expect(item("src")).toHaveAttribute("tabindex", "0");
  });

  it("opens every row beside the focused one with *", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    item("src").focus();
    await user.keyboard("*");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(item("docs")).toHaveAttribute("aria-expanded", "true");
  });

  it("jumps to the row that starts with what is typed, and cycles on a repeated letter", async () => {
    const user = userEvent.setup();
    render(<Basic defaultExpandedIds={["src", "docs"]} />);
    item("src").focus();
    await user.keyboard("g");
    expect(item("guide.md")).toHaveFocus();
    await user.keyboard("{Home}");
    await user.keyboard("in");
    expect(item("index.ts")).toHaveFocus();
    await user.keyboard("{Home}");
    await new Promise((resolve) => setTimeout(resolve, 650));
    await user.keyboard("d");
    expect(item("docs")).toHaveFocus();
  });

  it("activates with Enter, or opens the row when nothing handles it", async () => {
    const user = userEvent.setup();
    const onItemActivate = vi.fn();
    const { unmount } = render(<Basic />);
    item("src").focus();
    await user.keyboard("{Enter}");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    unmount();
    render(<Basic onItemActivate={onItemActivate} />);
    item(/README/).focus();
    await user.keyboard("{Enter}");
    expect(onItemActivate).toHaveBeenCalledWith("readme");
  });

  it("does not react to keys with Ctrl, ⌘ or Alt held, other than select-all", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    item("src").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("leaves a key a handler has already used alone", async () => {
    const user = userEvent.setup();
    render(<Basic onKeyDown={(event) => event.preventDefault()} />);
    item("src").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Tree — selection", () => {
  it("has no aria-selected without a selection mode", () => {
    render(<Basic />);
    expect(item("src")).not.toHaveAttribute("aria-selected");
    expect(screen.getByRole("tree")).not.toHaveAttribute("aria-multiselectable");
  });

  it("selects one row at a time in single mode, on a click and on Space", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="single" onValueChange={onValueChange} />);
    await user.click(screen.getByText("src"));
    expect(item("src")).toHaveAttribute("aria-selected", "true");
    expect(item("docs")).toHaveAttribute("aria-selected", "false");
    await user.click(screen.getByText("docs"));
    expect(onValueChange).toHaveBeenLastCalledWith(["docs"]);
    expect(item("src")).toHaveAttribute("aria-selected", "false");
    item(/README/).focus();
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith(["readme"]);
  });

  it("does not report a click on the row that is already the selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="single" defaultValue={["src"]} onValueChange={onValueChange} />);
    await user.click(screen.getByText("src"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears the selection in single mode with Ctrl and a click on the selected row", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="single" defaultValue={["src"]} onValueChange={onValueChange} />);
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("src"));
    await user.keyboard("{/Control}");
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it("makes the tree aria-multiselectable in multiple mode and adds and removes rows with Ctrl and Space", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="multiple" onValueChange={onValueChange} />);
    expect(screen.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
    await user.click(screen.getByText("src"));
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("docs"));
    await user.keyboard("{/Control}");
    expect(onValueChange).toHaveBeenLastCalledWith(["src", "docs"]);
    item("docs").focus();
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith(["src"]);
  });

  it("extends the selection with Shift and a click, and with Shift and the arrow keys, skipping disabled rows", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="multiple" defaultExpandAll onValueChange={onValueChange} />);
    await user.click(screen.getByText("App.tsx"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("util.ts"));
    await user.keyboard("{/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(["app", "lib", "util"]);
    await user.click(screen.getByText("util.ts"));
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(["util", "index"]);
  });

  it("selects every row that is not disabled with Ctrl+A", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="multiple" defaultExpandedIds={["src", "lib"]} onValueChange={onValueChange} />);
    item("src").focus();
    await user.keyboard("{Control>}a{/Control}");
    expect(onValueChange).toHaveBeenLastCalledWith(["src", "app", "lib", "util", "index", "docs", "readme"]);
  });

  it("is controlled when value is given, changing only when the prop does", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Basic selectionMode="single" value={[]} onValueChange={onValueChange} />);
    await user.click(screen.getByText("src"));
    expect(onValueChange).toHaveBeenCalledWith(["src"]);
    expect(item("src")).toHaveAttribute("aria-selected", "false");
    rerender(<Basic selectionMode="single" value={["src"]} onValueChange={onValueChange} />);
    expect(item("src")).toHaveAttribute("aria-selected", "true");
  });

  it("gives the tab stop to the selected row when focus has not moved", () => {
    render(<Basic selectionMode="single" defaultValue={["docs"]} />);
    expect(item("docs")).toHaveAttribute("tabindex", "0");
  });

  it("does not select a disabled row, by a click or Space", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic selectionMode="single" defaultExpandedIds={["src", "lib"]} onValueChange={onValueChange} />);
    await user.click(screen.getByText("math.ts"));
    item("math.ts").focus();
    await user.keyboard(" ");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item("math.ts")).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps a disabled row in the arrow-key order", async () => {
    const user = userEvent.setup();
    render(<Basic defaultExpandedIds={["src", "lib"]} />);
    item("util.ts").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("math.ts")).toHaveFocus();
  });
});

describe("Tree — rows that cannot be selected", () => {
  const picker: TreeNode[] = [
    { id: "dir", label: "dir", selectable: false, children: [{ id: "a", label: "a.ts" }, { id: "b", label: "b.ts" }] },
    { id: "c", label: "c.ts" },
  ];

  it("has no aria-selected on a row with selectable false, and has it on the rest", () => {
    render(<Tree aria-label="Files" nodes={picker} selectionMode="multiple" defaultExpandAll />);
    expect(item("dir")).not.toHaveAttribute("aria-selected");
    expect(item("a.ts")).toHaveAttribute("aria-selected", "false");
  });

  it("is not selected by a click, Space, a Shift range or Ctrl+A, but stays in the order and is skipped by a range", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tree aria-label="Files" nodes={picker} selectionMode="multiple" defaultExpandAll onValueChange={onValueChange} />);
    await user.click(screen.getByText("dir"));
    expect(onValueChange).not.toHaveBeenCalled();
    item("dir").focus();
    await user.keyboard(" ");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}");
    expect(item("a.ts")).toHaveFocus();
    await user.keyboard("{Control>}a{/Control}");
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
    await user.click(screen.getByText("c.ts"));
    expect(onValueChange).toHaveBeenLastCalledWith(["c"]);
    await user.keyboard("{Shift>}{ArrowUp}{ArrowUp}{ArrowUp}{/Shift}");
    expect(item("dir")).toHaveFocus();
    // the range ran up to the folder, which it passed over
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
  });

  it("can still be opened, checked and focused", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={picker} selectionMode="single" checkable onCheckedChange={onCheckedChange} />);
    item("dir").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("dir")).toHaveAttribute("aria-expanded", "true");
    await user.click(item("dir").querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenLastCalledWith(["a", "b"]);
  });
});

describe("Tree — selection that opens and follows", () => {
  const nested: TreeNode[] = [
    { id: "a", label: "alpha", children: [{ id: "a1", label: "apple" }, { id: "a2", label: "avocado" }] },
    { id: "b", label: "beta", selectable: false },
    { id: "c", label: "gamma" },
  ];

  it("opens and closes a row with a plain click when expandOnClick is on, and selects it too", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tree aria-label="T" nodes={nested} selectionMode="single" expandOnClick onValueChange={onValueChange} />);
    await user.click(screen.getByText("alpha"));
    expect(item("alpha")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
    await user.click(screen.getByText("alpha"));
    expect(item("alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not open it for a click with a modifier held, a disabled row, or a row with nothing under it, and it works on a row that cannot be selected", async () => {
    const user = userEvent.setup();
    render(
      <Tree
        aria-label="T"
        nodes={[...nested, { id: "d", label: "delta", disabled: true, children: [{ id: "d1", label: "d1" }] }, { id: "e", label: "folder", selectable: false, children: [{ id: "e1", label: "e1" }] }]}
        selectionMode="single"
        expandOnClick
      />,
    );
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("alpha"));
    await user.keyboard("{/Control}");
    expect(item("alpha")).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByText("delta"));
    expect(item("delta")).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByText("gamma"));
    expect(item("gamma")).not.toHaveAttribute("aria-expanded");
    await user.click(screen.getByText("folder"));
    expect(item("folder")).toHaveAttribute("aria-expanded", "true");
  });

  it("does not open it by a click when expandOnClick is off, and a double click does not undo the two clicks when it is on", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Tree aria-label="T" nodes={nested} selectionMode="single" />);
    await user.click(screen.getByText("alpha"));
    expect(item("alpha")).toHaveAttribute("aria-expanded", "false");
    unmount();
    render(<Tree aria-label="T" nodes={nested} selectionMode="single" expandOnClick />);
    await user.dblClick(screen.getByText("alpha"));
    expect(item("alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("selects the row focus lands on with selectOnFocus in single mode: arrows, Home, End, parent, child and a typed letter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tree aria-label="T" nodes={nested} selectionMode="single" selectOnFocus defaultExpandAll onValueChange={onValueChange} />);
    item("alpha").focus();
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith(["a1"]);
    await user.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(["c"]);
    await user.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(["a"]);
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(["a1"]);
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(["a"]);
    await user.keyboard("g");
    expect(onValueChange).toHaveBeenLastCalledWith(["c"]);
  });

  it("keeps the selection when focus lands on a row that cannot be selected, and ignores selectOnFocus outside single mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { unmount } = render(<Tree aria-label="T" nodes={nested} selectionMode="single" selectOnFocus defaultValue={["a"]} onValueChange={onValueChange} />);
    item("alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("beta")).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    unmount();
    render(<Tree aria-label="T" nodes={nested} selectionMode="multiple" selectOnFocus onValueChange={onValueChange} />);
    item("alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Tree — more keys and a count", () => {
  const many: TreeNode[] = Array.from({ length: 30 }, (_, position) => ({ id: `n${position}`, label: `Row ${position}` }));

  it("moves a page at a time with Page Up and Page Down, from the rows that fit, and stops at the ends", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.className.includes("frame") ? 36 * 6 : 0;
    });
    render(<Tree aria-label="Many" nodes={many} />);
    item("Row 0").focus();
    await user.keyboard("{PageDown}");
    expect(item("Row 5")).toHaveFocus();
    await user.keyboard("{PageDown}{PageDown}{PageDown}{PageDown}{PageDown}");
    expect(item("Row 29")).toHaveFocus();
    await user.keyboard("{PageUp}");
    expect(item("Row 24")).toHaveFocus();
  });

  it("moves ten rows when the tree has no measured height", async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Many" nodes={many} />);
    item("Row 0").focus();
    await user.keyboard("{PageDown}");
    expect(item("Row 10")).toHaveFocus();
  });

  it("extends a selection a page with Shift and Page Down in multiple mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tree aria-label="Many" nodes={many} selectionMode="multiple" onValueChange={onValueChange} />);
    await user.click(screen.getByText("Row 0"));
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(many.slice(0, 11).map((node) => node.id));
  });

  it("says how many rows are selected after a change in multiple mode, and not in single mode", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<Tree aria-label="Many" nodes={many} selectionMode="multiple" />);
    item("Row 0").focus();
    await user.keyboard("{Control>}a{/Control}");
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("30 selected");
    await user.keyboard("{Control>}a{/Control}");
    unmount();
    render(<Tree aria-label="Many" nodes={many} selectionMode="single" />);
    await user.click(screen.getByText("Row 1"));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it("says None selected when the last row is cleared, and says it in labels.selectedCount's words", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Tree aria-label="Many" nodes={many} selectionMode="multiple" defaultValue={["n0"]} labels={{ selectedCount: (count) => `${count} choisis` }} />);
    item("Row 0").focus();
    await user.keyboard(" ");
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("0 choisis");
    vi.useRealTimers();
  });

  it("ignores a key that is part of an input method's composition", () => {
    render(<Tree aria-label="Many" nodes={[{ id: "a", label: "apple" }, { id: "b", label: "banana" }]} />);
    item("apple").focus();
    fireEvent.keyDown(item("apple"), { key: "b", isComposing: true });
    expect(item("apple")).toHaveFocus();
    fireEvent.keyDown(item("apple"), { key: "b" });
    expect(item("banana")).toHaveFocus();
  });
});

describe("Tree — checking", () => {
  it("gives every row a check state, and works a parent's out from the leaves under it", () => {
    render(<Basic checkable defaultExpandAll defaultCheckedIds={["app", "util"]} />);
    expect(item("src")).toHaveAttribute("aria-checked", "mixed");
    expect(item("App.tsx")).toHaveAttribute("aria-checked", "true");
    expect(item("index.ts")).toHaveAttribute("aria-checked", "false");
    // a disabled leaf is not counted: the one leaf a person can change under "lib" is checked
    expect(item("lib")).toHaveAttribute("aria-checked", "true");
    expect(item("docs")).toHaveAttribute("aria-checked", "false");
  });

  it("checks every leaf under a row from its box, and clears them again", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Basic checkable defaultExpandAll onCheckedChange={onCheckedChange} />);
    const box = item("docs").querySelector("[data-tree-part=check]") as HTMLElement;
    await user.click(box);
    expect(onCheckedChange).toHaveBeenLastCalledWith(["guide"]);
    expect(item("docs")).toHaveAttribute("aria-checked", "true");
    await user.click(box);
    expect(onCheckedChange).toHaveBeenLastCalledWith([]);
    expect(item("docs")).toHaveAttribute("aria-checked", "false");
  });

  it("leaves a disabled leaf as it was when its parent is checked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Basic checkable defaultExpandAll onCheckedChange={onCheckedChange} />);
    await user.click(item("lib").querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenLastCalledWith(["util"]);
    expect(item("lib")).toHaveAttribute("aria-checked", "true");
    await user.click(item("lib").querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenLastCalledWith([]);
  });

  it("checks with Space, and with a click on the label when nothing can be selected", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Basic checkable onCheckedChange={onCheckedChange} />);
    item(/README/).focus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenLastCalledWith(["readme"]);
    await user.click(screen.getByText("README.md"));
    expect(onCheckedChange).toHaveBeenLastCalledWith([]);
  });

  it("keeps selecting and checking apart when both are on", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Basic checkable selectionMode="single" onValueChange={onValueChange} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByText("README.md"));
    expect(onValueChange).toHaveBeenCalledWith(["readme"]);
    expect(onCheckedChange).not.toHaveBeenCalled();
    await user.click(item(/README/).querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenCalledWith(["readme"]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("is controlled when checkedIds is given", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Basic checkable checkedIds={[]} onCheckedChange={onCheckedChange} />);
    await user.click(item(/README/).querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenCalledWith(["readme"]);
    expect(item(/README/)).toHaveAttribute("aria-checked", "false");
  });

  it("has no aria-checked when it is not checkable", () => {
    render(<Basic />);
    expect(item("src")).not.toHaveAttribute("aria-checked");
  });
});

describe("Tree — a row whose children failed to load", () => {
  const remote: TreeNode[] = [{ id: "remote", label: "remote", hasChildren: true }, { id: "other", label: "other" }];

  it("shows a warning mark and the words, in place of the arrow and the description", () => {
    render(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} errorIds={["remote"]} />);
    const row = item(/remote/);
    expect(row).toHaveTextContent("remoteCouldn't load. Press Enter to try again.");
    expect(row.querySelector("[data-tree-part=retry]")).not.toBeNull();
    expect(row.querySelector("[data-tree-part=chevron]")).toBeNull();
    expect(screen.getAllByRole("treeitem")).toHaveLength(2);
  });

  it("says it with the words of labels.loadFailed, and tells a screen reader when it is added", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} labels={{ loadFailed: "Échec" }} />);
    rerender(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} labels={{ loadFailed: "Échec" }} errorIds={["remote"]} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("status")).toHaveTextContent("remote. Échec");
    vi.useRealTimers();
    expect(item(/remote/)).toHaveTextContent("Échec");
  });

  it("asks to try again from the mark, Right and Enter when the row is open, and not when it is closed", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onExpandedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} errorIds={["remote"]} onRetry={onRetry} onExpandedChange={onExpandedChange} />);
    await user.click(item(/remote/).querySelector("[data-tree-part=retry]") as HTMLElement);
    expect(onRetry).toHaveBeenCalledTimes(1);
    item(/remote/).focus();
    await user.keyboard("{ArrowRight}");
    expect(onRetry).toHaveBeenCalledTimes(2);
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledWith("remote");
    expect(onExpandedChange).not.toHaveBeenCalled();
    // Left closes it as for any row, and opening it again is an ordinary opening, whose fetch the caller makes
    await user.keyboard("{ArrowLeft}");
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
  });

  it("opens a closed row that failed the ordinary way, calling onExpandedChange and not onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onExpandedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={remote} errorIds={["remote"]} onRetry={onRetry} onExpandedChange={onExpandedChange} />);
    await user.click(item(/remote/).querySelector("[data-tree-part=retry]") as HTMLElement);
    expect(onExpandedChange).toHaveBeenCalledWith(["remote"]);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("shows the spinner, not the mark, while it loads again", () => {
    render(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} errorIds={["remote"]} loadingIds={["remote"]} />);
    expect(item(/remote/).querySelector("[data-tree-part=retry]")).toBeNull();
    expect(item(/remote/)).not.toHaveTextContent("Couldn't load");
    expect(item(/remote/)).toHaveAttribute("aria-busy", "true");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Tree aria-label="Files" nodes={remote} defaultExpandedIds={["remote"]} errorIds={["remote"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tree — an open row that loaded nothing", () => {
  const fetched: TreeNode[] = [{ id: "dir", label: "dir", hasChildren: true, children: [] }, { id: "after", label: "after" }];

  it("draws an Empty row under it, one level down, disabled and with no selection or check state", () => {
    render(<Tree aria-label="Files" nodes={fetched} selectionMode="multiple" checkable defaultExpandedIds={["dir"]} />);
    const empty = item("Empty");
    expect(empty).toHaveAttribute("aria-level", "2");
    expect(empty).toHaveAttribute("aria-setsize", "1");
    expect(empty).toHaveAttribute("aria-disabled", "true");
    // it can never be selected, which a selectable tree says by marking it not selected; it has no check state at all
    expect(empty).toHaveAttribute("aria-selected", "false");
    expect(empty).not.toHaveAttribute("aria-checked");
    expect(empty.querySelector("[data-tree-part]")).toBeNull();
    expect(names()).toEqual(["dir", "Empty", "after"]);
  });

  it("draws nothing while the row is closed", () => {
    render(<Tree aria-label="Files" nodes={fetched} />);
    expect(screen.queryByRole("treeitem", { name: "Empty" })).toBeNull();
  });

  it("draws nothing while the row is loading again", () => {
    render(<Tree aria-label="Files" nodes={fetched} defaultExpandedIds={["dir"]} loadingIds={["dir"]} />);
    expect(screen.queryByRole("treeitem", { name: "Empty" })).toBeNull();
    expect(names()).toEqual(["dir", "after"]);
  });

  it("says what labels.emptyFolder says", () => {
    render(<Tree aria-label="Files" nodes={fetched} defaultExpandedIds={["dir"]} labels={{ emptyFolder: "Vide" }} />);
    expect(item("Vide")).toBeInTheDocument();
  });

  it("is in the arrow-key order, cannot be selected or checked, and hands the tab stop back when its row closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={fetched} selectionMode="single" checkable defaultExpandedIds={["dir"]} onValueChange={onValueChange} onCheckedChange={onCheckedChange} />);
    item("dir").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Empty")).toHaveFocus();
    await user.keyboard(" ");
    await user.click(screen.getByText("Empty"));
    await user.dblClick(screen.getByText("Empty"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onCheckedChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowLeft}");
    expect(item("dir")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.queryByRole("treeitem", { name: "Empty" })).toBeNull();
    expect(item("dir")).toHaveAttribute("tabindex", "0");
  });

  it("is not drawn for a row with an empty children list that was never lazy", () => {
    render(<Tree aria-label="Files" nodes={[{ id: "x", label: "x", children: [] }]} defaultExpandedIds={["x"]} />);
    expect(names()).toEqual(["x"]);
  });

  it("is not counted among the leaves a parent's check state comes from", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Tree aria-label="Files" nodes={[{ id: "p", label: "p", children: [{ id: "q", label: "q", hasChildren: true, children: [] }, { id: "r", label: "r" }] }]} checkable defaultExpandAll onCheckedChange={onCheckedChange} />);
    await user.click(item("p").querySelector("[data-tree-part=check]") as HTMLElement);
    expect(onCheckedChange).toHaveBeenLastCalledWith(["q", "r"]);
    expect(item("p")).toHaveAttribute("aria-checked", "true");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Tree aria-label="Files" nodes={fetched} defaultExpandedIds={["dir"]} selectionMode="multiple" checkable />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tree — the controller", () => {
  it("expands and collapses from outside, saying whether it did anything", () => {
    const controllerRef = createRef<TreeController>();
    render(<Basic controllerRef={controllerRef} />);
    const controller = controllerRef.current as TreeController;
    act(() => {
      expect(controller.expandAll()).toBe(true);
    });
    expect(screen.getAllByRole("treeitem")).toHaveLength(9);
    act(() => {
      expect(controller.expandAll()).toBe(false);
      expect(controller.collapse("lib")).toBe(true);
      expect(controller.collapse("lib")).toBe(false);
    });
    expect(screen.queryByRole("treeitem", { name: "util.ts" })).toBeNull();
    act(() => {
      expect(controller.expand("lib")).toBe(true);
      expect(controller.expand("readme")).toBe(false);
      expect(controller.expand("missing")).toBe(false);
    });
    expect(item("util.ts")).toBeInTheDocument();
    act(() => {
      expect(controller.collapseAll()).toBe(true);
      expect(controller.collapseAll()).toBe(false);
    });
    expect(names()).toHaveLength(3);
  });

  it("is the same object for the tree's life", () => {
    const controllerRef = createRef<TreeController>();
    const { rerender } = render(<Basic controllerRef={controllerRef} />);
    const first = controllerRef.current;
    rerender(<Basic controllerRef={controllerRef} size="lg" />);
    expect(controllerRef.current).toBe(first);
  });

  it("opens the rows above a row and moves the tab stop to it with scrollToNode, without taking focus", () => {
    const controllerRef = createRef<TreeController>();
    render(<Basic controllerRef={controllerRef} />);
    act(() => {
      expect(controllerRef.current?.scrollToNode("util")).toBe(true);
      expect(controllerRef.current?.scrollToNode("missing")).toBe(false);
    });
    expect(item("util.ts")).toHaveAttribute("tabindex", "0");
    expect(item("util.ts")).not.toHaveFocus();
  });

  it("warns once when a controlled tree does not open the rows above the row it was asked to show", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controllerRef = createRef<TreeController>();
    render(<Basic controllerRef={controllerRef} expandedIds={[]} onExpandedChange={() => undefined} />);
    act(() => {
      controllerRef.current?.scrollToNode("util");
    });
    act(() => {
      controllerRef.current?.scrollToNode("app");
    });
    const warnings = warn.mock.calls.filter(([text]) => String(text).includes("scrollToNode"));
    expect(warnings).toHaveLength(1);
    expect(String(warnings[0]?.[0])).toContain("expandedIds");
  });

  it("does not warn when the owner of a controlled tree opens them", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controllerRef = createRef<TreeController>();
    function Wired() {
      const [open, setOpen] = useState<string[]>([]);
      return <Basic controllerRef={controllerRef} expandedIds={open} onExpandedChange={setOpen} />;
    }
    render(<Wired />);
    act(() => {
      controllerRef.current?.scrollToNode("util");
    });
    expect(screen.getByRole("treeitem", { name: "util.ts" })).toBeInTheDocument();
    expect(warn.mock.calls.filter(([text]) => String(text).includes("scrollToNode"))).toHaveLength(0);
  });

  it("asks a controlled tree rather than changing it", () => {
    const onExpandedChange = vi.fn();
    const controllerRef = createRef<TreeController>();
    render(<Basic controllerRef={controllerRef} expandedIds={[]} onExpandedChange={onExpandedChange} />);
    act(() => {
      controllerRef.current?.expandAll();
    });
    expect(onExpandedChange).toHaveBeenCalledWith(["src", "lib", "docs"]);
    expect(names()).toHaveLength(3);
  });
});

describe("Tree — a long tree", () => {
  const many: TreeNode[] = Array.from({ length: 1000 }, (_, position) => ({ id: `n${position}`, label: `Row ${position}` }));

  it("draws a window of the rows, each saying where it is", () => {
    render(<Tree aria-label="Many" nodes={many} windowed maxHeight={300} />);
    const rows = screen.getAllByRole("treeitem");
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(100);
    expect(rows[0]).toHaveAttribute("aria-posinset", "1");
    expect(rows[0]).toHaveAttribute("aria-setsize", "1000");
  });

  it("draws every row under windowed={false}, and the window only from 200 rows with a maxHeight under 'auto'", () => {
    const { rerender } = render(<Tree aria-label="Many" nodes={many} windowed={false} maxHeight={300} />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(1000);
    rerender(<Tree aria-label="Many" nodes={many} maxHeight={300} />);
    expect(screen.getAllByRole("treeitem").length).toBeLessThan(100);
    rerender(<Tree aria-label="Many" nodes={many} />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(1000);
    rerender(<Tree aria-label="Few" nodes={many.slice(0, 50)} maxHeight={300} />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(50);
  });

  it("leaves room for the rows it does not draw", () => {
    render(<Tree aria-label="Many" nodes={many} windowed maxHeight={300} />);
    const tree = screen.getByRole("tree");
    expect(Number.parseFloat(tree.style.paddingBlockEnd)).toBeGreaterThan(1000);
  });

  it("scrolls a row into the window with scrollToNode and gives it the tab stop", () => {
    const controllerRef = createRef<TreeController>();
    render(<Tree aria-label="Many" nodes={many} windowed maxHeight={300} controllerRef={controllerRef} />);
    expect(screen.queryByRole("treeitem", { name: "Row 900" })).toBeNull();
    act(() => {
      controllerRef.current?.scrollToNode("n900");
    });
    expect(screen.getByRole("treeitem", { name: "Row 900" })).toHaveAttribute("tabindex", "0");
    expect(screen.queryByRole("treeitem", { name: "Row 0" })).toBeNull();
  });

  it("makes the tree itself the tab stop while the row that holds it is outside the window", () => {
    const controllerRef = createRef<TreeController>();
    render(<Tree aria-label="Many" nodes={many} windowed maxHeight={300} controllerRef={controllerRef} />);
    act(() => {
      controllerRef.current?.scrollToNode("n900");
    });
    act(() => {
      (screen.getByRole("tree").parentElement as HTMLElement).scrollTop = 0;
      screen.getByRole("tree").parentElement?.dispatchEvent(new Event("scroll"));
    });
    expect(screen.queryByRole("treeitem", { name: "Row 900" })).toBeNull();
    expect(screen.getByRole("tree")).toHaveAttribute("tabindex", "0");
  });
});

describe("Tree — renaming", () => {
  const field = () => screen.getByRole("textbox");

  it("turns the label into a field with the text selected on F2, when the tree is renamable", async () => {
    const user = userEvent.setup();
    render(<Basic renamable />);
    item("docs").focus();
    await user.keyboard("{F2}");
    expect(field()).toHaveValue("docs");
    expect(field()).toHaveFocus();
    expect(field()).toHaveAccessibleName("Rename docs");
    expect((field() as HTMLInputElement).selectionStart).toBe(0);
    expect((field() as HTMLInputElement).selectionEnd).toBe(4);
  });

  it("does nothing on F2 without renamable, on a disabled row, or for a row the function refuses", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic />);
    item("docs").focus();
    await user.keyboard("{F2}");
    expect(screen.queryByRole("textbox")).toBeNull();
    unmount();
    render(<Basic renamable={(node) => node.id !== "docs"} defaultExpandedIds={["src", "lib"]} />);
    item("docs").focus();
    await user.keyboard("{F2}");
    expect(screen.queryByRole("textbox")).toBeNull();
    item("math.ts").focus();
    await user.keyboard("{F2}");
    expect(screen.queryByRole("textbox")).toBeNull();
    item("src").focus();
    await user.keyboard("{F2}");
    expect(field()).toHaveValue("src");
  });

  it("asks with the trimmed text on Enter and gives the focus back to the row, leaving the label for the caller to change", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic renamable onRename={onRename} />);
    item("docs").focus();
    await user.keyboard("{F2}");
    await user.keyboard("{Control>}a{/Control}  manuals  {Enter}");
    expect(onRename).toHaveBeenCalledWith("docs", "manuals");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(item("docs")).toHaveFocus();
    expect(item("docs")).toHaveTextContent("docs");
  });

  it("does not ask when the text is the same, or only differs in the spaces round it", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic renamable onRename={onRename} />);
    item("docs").focus();
    await user.keyboard("{F2}{End} {Enter}");
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("cancels on Escape, with the focus back on the row", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic renamable onRename={onRename} />);
    item("docs").focus();
    await user.keyboard("{F2}changed{Escape}");
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(item("docs")).toHaveFocus();
  });

  it("commits when the field is left, and drops a refused name instead of holding the person in it", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(
      <>
        <Basic renamable onRename={onRename} />
        <button type="button">elsewhere</button>
      </>,
    );
    item("docs").focus();
    await user.keyboard("{F2}{Control>}a{/Control}manuals");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(onRename).toHaveBeenCalledWith("docs", "manuals");
    expect(screen.getByRole("button", { name: "elsewhere" })).toHaveFocus();
    item("src").focus();
    await user.keyboard("{F2}{Control>}a{/Control}{Backspace}");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("refuses an empty name, and a name validateRename refuses, keeping the field open with the message", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const validateRename = vi.fn((_id: string, label: string) => (label === "readme" ? "That name is taken" : undefined));
    render(<Basic renamable onRename={onRename} validateRename={validateRename} />);
    item("docs").focus();
    await user.keyboard("{F2}{Control>}a{/Control}{Backspace}{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a name");
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(field()).toHaveAccessibleDescription("Enter a name");
    await user.keyboard("readme{Enter}");
    expect(validateRename).toHaveBeenCalledWith("docs", "readme");
    expect(screen.getByRole("alert")).toHaveTextContent("That name is taken");
    expect(onRename).not.toHaveBeenCalled();
    await user.keyboard("{Backspace}{Enter}");
    expect(onRename).toHaveBeenCalledWith("docs", "readm");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("clears the message as soon as the text changes, and says labels.nameRequired in the caller's words", async () => {
    const user = userEvent.setup();
    render(<Basic renamable labels={{ nameRequired: "Un nom", rename: (label) => `Renommer ${label}` }} />);
    item("docs").focus();
    await user.keyboard("{F2}{Backspace}{Backspace}{Backspace}{Backspace}{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Un nom");
    expect(field()).toHaveAccessibleName("Renommer docs");
    await user.keyboard("x");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the keys typed in the field away from the tree: arrows, Space, letters and F2 itself", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic renamable selectionMode="single" onValueChange={onValueChange} defaultExpandedIds={["docs"]} />);
    item("docs").focus();
    await user.keyboard("{F2}{End}{ArrowDown} a{ArrowLeft}{ArrowRight}{Home}{End}{F2}");
    expect(field()).toHaveValue("docs a");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole("treeitem")[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("does not select, open or activate the row on a click or a double click in the field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onItemActivate = vi.fn();
    render(<Basic renamable selectionMode="single" onValueChange={onValueChange} onItemActivate={onItemActivate} />);
    item("docs").focus();
    await user.keyboard("{F2}");
    await user.click(field());
    await user.dblClick(field());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
    expect(field()).toBeInTheDocument();
  });

  it("is started from the controller, which opens the rows above the row and reports whether it could", () => {
    const controllerRef = createRef<TreeController>();
    render(<Basic renamable={(node) => node.id !== "docs"} controllerRef={controllerRef} />);
    act(() => {
      expect(controllerRef.current?.rename("util")).toBe(true);
      expect(controllerRef.current?.rename("docs")).toBe(false);
      expect(controllerRef.current?.rename("missing")).toBe(false);
    });
    expect(field()).toHaveValue("util.ts");
    expect(screen.getByRole("treeitem", { name: "src" })).toHaveAttribute("aria-expanded", "true");
  });

  it("does not rename from the controller when the tree is not renamable", () => {
    const controllerRef = createRef<TreeController>();
    render(<Basic controllerRef={controllerRef} />);
    act(() => {
      expect(controllerRef.current?.rename("src")).toBe(false);
    });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("drops the field when the row it is in closes under it", async () => {
    const user = userEvent.setup();
    const controllerRef = createRef<TreeController>();
    render(<Basic renamable controllerRef={controllerRef} defaultExpandedIds={["src"]} />);
    item("App.tsx").focus();
    await user.keyboard("{F2}");
    expect(field()).toBeInTheDocument();
    act(() => {
      controllerRef.current?.collapse("src");
    });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("does not end twice: Enter and the blur it causes are one commit", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic renamable onRename={onRename} />);
    item("docs").focus();
    await user.keyboard("{F2}x{Enter}");
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations while a row is being renamed, with and without a message", async () => {
    const user = userEvent.setup();
    const { container } = render(<Basic renamable />);
    item("docs").focus();
    await user.keyboard("{F2}");
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}{Enter}");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tree — a row's menu", () => {
  it("tells the caller which row a right-click was on and where, leaving the browser's menu to whoever opens one", () => {
    const onItemContextMenu = vi.fn();
    render(<Basic onItemContextMenu={onItemContextMenu} defaultExpandedIds={["src"]} />);
    const row = item("App.tsx");
    const notPrevented = fireEvent.contextMenu(screen.getByText("App.tsx"), { clientX: 41, clientY: 52 });
    expect(notPrevented).toBe(true);
    expect(onItemContextMenu).toHaveBeenCalledTimes(1);
    expect(onItemContextMenu).toHaveBeenCalledWith({ id: "app", element: row, via: "pointer", point: { x: 41, y: 52 }, event: expect.any(Event) });
    expect(row).toHaveFocus();
  });

  it("counts a contextmenu event that follows its own key press as that press, and not as a second request", async () => {
    const user = userEvent.setup();
    const onItemContextMenu = vi.fn();
    render(<Basic onItemContextMenu={onItemContextMenu} />);
    item("docs").focus();
    await user.keyboard("{ContextMenu}");
    fireEvent.contextMenu(screen.getByText("docs"));
    expect(onItemContextMenu).toHaveBeenCalledTimes(1);
  });

  it("leaves the browser's own menu alone when there is no handler", () => {
    render(<Basic />);
    expect(fireEvent.contextMenu(screen.getByText("src"))).toBe(true);
  });

  it("does not ask for a disabled row, the Empty row or the tree's own padding", () => {
    const onItemContextMenu = vi.fn();
    render(
      <Tree
        aria-label="Files"
        onItemContextMenu={onItemContextMenu}
        defaultExpandedIds={["dir"]}
        nodes={[{ id: "dir", label: "dir", hasChildren: true, children: [] }, { id: "off", label: "off", disabled: true }]}
      />,
    );
    expect(fireEvent.contextMenu(screen.getByText("off"))).toBe(true);
    expect(fireEvent.contextMenu(screen.getByText("Empty"))).toBe(true);
    expect(fireEvent.contextMenu(screen.getByRole("tree"))).toBe(true);
    expect(onItemContextMenu).not.toHaveBeenCalled();
  });

  it("asks from the context-menu key and from Shift+F10, for the focused row, with the row's element", async () => {
    const user = userEvent.setup();
    const onItemContextMenu = vi.fn();
    render(<Basic onItemContextMenu={onItemContextMenu} />);
    item("docs").focus();
    await user.keyboard("{ContextMenu}");
    expect(onItemContextMenu).toHaveBeenLastCalledWith(expect.objectContaining({ id: "docs", via: "keyboard", element: item("docs") }));
    expect(onItemContextMenu.mock.calls[0]?.[0].point).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(onItemContextMenu).toHaveBeenCalledTimes(2);
    await user.keyboard("{F10}");
    expect(onItemContextMenu).toHaveBeenCalledTimes(2);
  });

  it("does not ask for a disabled row from the keyboard, or without a handler", async () => {
    const user = userEvent.setup();
    const onItemContextMenu = vi.fn();
    const { unmount } = render(<Basic onItemContextMenu={onItemContextMenu} defaultExpandedIds={["src", "lib"]} />);
    item("math.ts").focus();
    await user.keyboard("{ContextMenu}");
    expect(onItemContextMenu).not.toHaveBeenCalled();
    unmount();
    render(<Basic />);
    item("src").focus();
    await user.keyboard("{ContextMenu}");
    expect(item("src")).toHaveFocus();
  });

  it("still runs the caller's own onContextMenu, and respects one that prevents the default", () => {
    const own = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const onItemContextMenu = vi.fn();
    render(<Basic onItemContextMenu={onItemContextMenu} onContextMenu={own} />);
    fireEvent.contextMenu(screen.getByText("src"));
    expect(own).toHaveBeenCalledTimes(1);
    expect(onItemContextMenu).not.toHaveBeenCalled();
  });

  it.each([
    ["ltr", 10],
    ["rtl", 90],
  ] as const)("puts the key's point under the start of the label in a %s tree", async (dir, x) => {
    const user = userEvent.setup();
    const onItemContextMenu = vi.fn();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const label = (this as HTMLElement).dataset.treePart === "label";
      const rect = label ? { left: 10, right: 90, top: 4, bottom: 24 } : { left: 0, right: 100, top: 0, bottom: 30 };
      return { ...rect, width: rect.right - rect.left, height: rect.bottom - rect.top, x: rect.left, y: rect.top, toJSON: () => ({}) } as DOMRect;
    });
    render(<Basic dir={dir} onItemContextMenu={onItemContextMenu} />);
    item("src").focus();
    await user.keyboard("{ContextMenu}");
    expect(onItemContextMenu.mock.calls[0]?.[0].point).toEqual({ x, y: 30 });
  });
});

describe("Tree — loading the rows", () => {
  const placeholders = (container: HTMLElement) => container.querySelectorAll('[aria-hidden="true"][class*="skeletonRow"]');

  it("stands placeholder rows in for a tree with no rows yet, in a busy group that says it is loading, with no empty message", () => {
    const { container } = render(<Tree aria-label="Files" nodes={[]} loading />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("tree")).toBeNull();
    expect(group).toHaveTextContent("Loading");
    expect(group).not.toHaveTextContent("No items");
    expect(placeholders(container)).toHaveLength(3);
  });

  it("adds the placeholders after the last row of a tree that has rows, and marks the tree busy", () => {
    const { container } = render(<Basic loading loadingCount={2} />);
    expect(screen.getByRole("tree")).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
    expect(placeholders(container)).toHaveLength(2);
    const last = screen.getAllByRole("treeitem").at(-1) as HTMLElement;
    expect(last.compareDocumentPosition(placeholders(container)[0] as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws none, and is not busy, when it is not loading", () => {
    const { container } = render(<Basic />);
    expect(placeholders(container)).toHaveLength(0);
    expect(screen.getByRole("tree")).not.toHaveAttribute("aria-busy");
  });

  it.each([
    [0, 0],
    [-4, 0],
    [2.9, 2],
    [99, 20],
    [Number.POSITIVE_INFINITY, 3],
    [Number.NaN, 3],
  ])("holds loadingCount=%s to %s placeholders", (count, expected) => {
    const { container } = render(<Basic loading loadingCount={count} />);
    expect(placeholders(container)).toHaveLength(expected);
  });

  it("says what labels.loading says, and leaves the placeholders out of the tree's focus order and names", () => {
    const { container } = render(<Tree aria-label="Files" nodes={[]} loading labels={{ loading: "Chargement" }} />);
    expect(screen.getByRole("group")).toHaveTextContent("Chargement");
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(screen.queryAllByRole("treeitem")).toHaveLength(0);
  });

  it("draws the placeholders only with the last window of a long tree", () => {
    const many: TreeNode[] = Array.from({ length: 1000 }, (_, position) => ({ id: `n${position}`, label: `Row ${position}` }));
    const controllerRef = createRef<TreeController>();
    const { container } = render(<Tree aria-label="Many" nodes={many} windowed maxHeight={300} loading controllerRef={controllerRef} />);
    expect(placeholders(container)).toHaveLength(0);
    act(() => {
      controllerRef.current?.scrollToNode("n999");
    });
    expect(screen.getByRole("treeitem", { name: "Row 999" })).toBeInTheDocument();
    expect(placeholders(container)).toHaveLength(3);
  });

  it("has no axe violations, with and without rows", async () => {
    const { container, rerender } = render(<Tree aria-label="Files" nodes={[]} loading />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Basic loading defaultExpandAll />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tree — keys when a tree can select and check", () => {
  it("selects with Shift+Space and checks with Space when both are on", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Basic checkable selectionMode="single" onValueChange={onValueChange} onCheckedChange={onCheckedChange} />);
    item(/README/).focus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(["readme"]);
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{Shift>} {/Shift}");
    expect(onValueChange).toHaveBeenCalledWith(["readme"]);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it("adds and removes rows with Shift+Space in multiple mode, and still checks with Shift+Space when nothing can be selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    const { unmount } = render(<Basic checkable selectionMode="multiple" defaultValue={["docs"]} onValueChange={onValueChange} />);
    item(/README/).focus();
    await user.keyboard("{Shift>} {/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(["docs", "readme"]);
    await user.keyboard("{Shift>} {/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(["docs"]);
    unmount();
    render(<Basic checkable onCheckedChange={onCheckedChange} />);
    item(/README/).focus();
    await user.keyboard("{Shift>} {/Shift}");
    expect(onCheckedChange).toHaveBeenCalledWith(["readme"]);
  });
});

describe("Tree — data that is not what the type says", () => {
  it.each([undefined, null, "text", 5, {}])("draws %s as an empty tree and says so once, however often it re-renders", (bad) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Tree aria-label="T" nodes={bad as unknown as TreeNode[]} />);
    rerender(<Tree aria-label="T" nodes={bad as unknown as TreeNode[]} />);
    expect(screen.getByRole("group")).toHaveTextContent("No items");
    const said = warn.mock.calls.filter(([text]) => String(text).includes("draws what it can"));
    expect(said).toHaveLength(1);
  });

  it("drops a node with no string id, draws a label that is not text, and ignores children that are not a list", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Tree aria-label="T" nodes={[{ id: "a", label: "alpha" }, null, { label: "no id" }, { id: "n", label: 7 }, { id: "c", label: "kids", children: "oops" }] as unknown as TreeNode[]} />);
    expect(names()).toEqual(["alpha", "7", "kids"]);
    expect(item("kids")).not.toHaveAttribute("aria-expanded");
    expect(warn.mock.calls.some(([text]) => String(text).includes("not an object with a string `id`"))).toBe(true);
  });

  it("types ahead and selects past a node whose label is missing", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Tree aria-label="T" nodes={[{ id: "x" } as unknown as TreeNode, { id: "y", label: "yes" }]} />);
    item("yes").focus();
    await user.keyboard("{Home}y");
    expect(item("yes")).toHaveFocus();
  });
});

describe("Tree — one warning for one problem", () => {
  it("warns about a repeated id once across renders with a fresh array each time, and again for a different one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const dup = (id: string) => [{ id, label: "1" }, { id, label: "2" }];
    const { rerender } = render(<Tree aria-label="T" nodes={dup("d")} />);
    for (let pass = 0; pass < 4; pass += 1) rerender(<Tree aria-label="T" nodes={dup("d")} />);
    const said = () => warn.mock.calls.filter(([text]) => String(text).includes("more than one node"));
    expect(said()).toHaveLength(1);
    expect(String(said()[0]?.[0])).toContain('"d"');
    rerender(<Tree aria-label="T" nodes={dup("e")} />);
    expect(said()).toHaveLength(2);
  });

  it("warns once when a single-mode value holds more than one id, and shows only the first selected", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Basic selectionMode="single" value={["src", "docs"]} />);
    rerender(<Basic selectionMode="single" value={["src", "docs"]} />);
    expect(screen.getAllByRole("treeitem").map((row) => row.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(warn.mock.calls.filter(([text]) => String(text).includes('selectionMode="single"'))).toHaveLength(1);
  });
});

describe("Tree — expand all and rows still to be fetched", () => {
  const mixed: TreeNode[] = [{ id: "loaded", label: "loaded", children: [{ id: "l1", label: "l1" }] }, { id: "later", label: "later", hasChildren: true }];

  it("opens the rows that have rows to show and leaves a row still to be fetched closed, asking for nothing", () => {
    const onExpandedChange = vi.fn();
    render(<Tree aria-label="T" nodes={mixed} defaultExpandAll onExpandedChange={onExpandedChange} />);
    expect(item("loaded")).toHaveAttribute("aria-expanded", "true");
    expect(item("later")).toHaveAttribute("aria-expanded", "false");
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it("has expandAll() do the same, and report nothing to do when only a row still to be fetched is left", () => {
    const controllerRef = createRef<TreeController>();
    render(<Tree aria-label="T" nodes={mixed} controllerRef={controllerRef} />);
    act(() => {
      expect(controllerRef.current?.expandAll()).toBe(true);
      expect(controllerRef.current?.expandAll()).toBe(false);
    });
    expect(item("later")).toHaveAttribute("aria-expanded", "false");
    act(() => {
      expect(controllerRef.current?.expand("later")).toBe(true);
    });
    expect(item("later")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Tree — a press inside a portal a row draws", () => {
  it("is not a press on the row: no selection, no opening, no activation, no change of the tab stop", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const onValueChange = vi.fn();
    const onItemActivate = vi.fn();
    const onExpandedChange = vi.fn();
    render(
      <Tree
        aria-label="T"
        selectionMode="single"
        expandOnClick
        onValueChange={onValueChange}
        onItemActivate={onItemActivate}
        onExpandedChange={onExpandedChange}
        nodes={[{ id: "p", label: "pal", children: [{ id: "q", label: "q" }], trailing: createPortal(<button type="button">in a portal</button>, target) }, { id: "z", label: "zed" }]}
      />,
    );
    const inside = screen.getByRole("button", { name: "in a portal" });
    fireEvent.click(inside);
    fireEvent.doubleClick(inside);
    fireEvent.focus(inside);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(item(/pal/)).toHaveAttribute("tabindex", "0");
    fireEvent.click(screen.getByText("pal"));
    expect(onValueChange).toHaveBeenCalledWith(["p"]);
    target.remove();
  });
});

describe("Tree — under StrictMode", () => {
  it("announces loaded children, and a failed fetch, once each", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender } = render(
      <StrictMode>
        <Tree aria-label="T" nodes={[{ id: "r", label: "remote", hasChildren: true }]} defaultExpandedIds={["r"]} loadingIds={["r"]} />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Tree aria-label="T" nodes={[{ id: "r", label: "remote", children: [{ id: "c", label: "c" }] }]} defaultExpandedIds={["r"]} loadingIds={[]} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("1 item loaded");
    rerender(
      <StrictMode>
        <Tree aria-label="T" nodes={[{ id: "r", label: "remote", hasChildren: true }]} defaultExpandedIds={["r"]} errorIds={["r"]} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("remote. Couldn't load");
    vi.useRealTimers();
  });

  it("does not announce a failure that is there from the first render", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <StrictMode>
        <Tree aria-label="T" nodes={[{ id: "r", label: "remote", hasChildren: true }]} defaultExpandedIds={["r"]} errorIds={["r"]} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it("puts the focus and the selection in the rename field, and commits once", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(
      <StrictMode>
        <Basic renamable onRename={onRename} />
      </StrictMode>,
    );
    item("docs").focus();
    await user.keyboard("{F2}");
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect((screen.getByRole("textbox") as HTMLInputElement).selectionEnd).toBe(4);
    await user.keyboard("x{Enter}");
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("keeps typeahead working, and clears the word after a pause", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Tree aria-label="T" nodes={[{ id: "a", label: "apple" }, { id: "b", label: "banana" }, { id: "c", label: "blueberry" }]} />
      </StrictMode>,
    );
    item("apple").focus();
    await user.keyboard("bl");
    expect(item("blueberry")).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 650));
    await user.keyboard("a");
    expect(item("apple")).toHaveFocus();
  });

  it("says how many are selected in multiple mode", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StrictMode>
        <Basic selectionMode="multiple" />
      </StrictMode>,
    );
    item("src").focus();
    await user.keyboard("{Control>}a{/Control}");
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("3 selected");
    vi.useRealTimers();
  });
});

describe("Tree — text the caller supplies", () => {
  it("keeps the English default for a label whose override is undefined", () => {
    const { rerender } = render(<Tree aria-label="T" nodes={[]} labels={{ empty: undefined }} />);
    expect(screen.getByRole("group")).toHaveTextContent("No items");
    rerender(<Tree aria-label="T" nodes={[{ id: "r", label: "remote", hasChildren: true }]} defaultExpandedIds={["r"]} errorIds={["r"]} labels={{ loadFailed: undefined, emptyFolder: undefined, loading: undefined, rename: undefined, nameRequired: undefined, selectedCount: undefined, childrenLoaded: undefined }} />);
    expect(item(/remote/)).toHaveTextContent("Couldn't load. Press Enter to try again.");
  });

  it("takes text that arrives in one input event, as a phone or a paste sends it, in the rename field", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic renamable onRename={onRename} />);
    item("docs").focus();
    await user.keyboard("{F2}");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "manuals and guides" } });
    await user.keyboard("{Enter}");
    expect(onRename).toHaveBeenCalledWith("docs", "manuals and guides");
  });
});

describe("Tree — accessibility", () => {
  it("has no axe violations, closed, open, selectable and checkable", async () => {
    const { container, rerender } = render(<Basic />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Basic defaultExpandAll selectionMode="multiple" checkable defaultCheckedIds={["util"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations when empty, and in a right-to-left tree", async () => {
    const { container, rerender } = render(<Tree aria-label="Files" nodes={[]} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Basic dir="rtl" defaultExpandAll />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("hides the arrow and check box from assistive technology, leaving the label as the name", () => {
    const { container } = render(<Basic checkable />);
    expect(container.querySelector("[data-tree-part=chevron]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-tree-part=check]")).toHaveAttribute("aria-hidden", "true");
    expect(item("src")).toBeInTheDocument();
  });
});
