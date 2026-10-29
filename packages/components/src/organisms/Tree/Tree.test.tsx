import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
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
