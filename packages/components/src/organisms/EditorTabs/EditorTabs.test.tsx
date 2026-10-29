import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { ContextMenu } from "../ContextMenu";
import { EditorTabs } from "./EditorTabs";
import type { EditorTab, EditorTabsController, EditorTabsProps } from "./EditorTabs.types";

const FILES: EditorTab[] = [
  { id: "a", label: "index.ts" },
  { id: "b", label: "app.ts", dirty: true },
  { id: "c", label: "util.ts" },
  { id: "d", label: "readme.md" },
];

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
};

type HarnessProps = Partial<EditorTabsProps<EditorTab>> & { initial?: EditorTab[]; initialValue?: string; panels?: ReactNode };

/** A strip whose owner applies what it asks for, the way an app would. */
function Harness({ initial = FILES, initialValue = "a", panels, onClose, onReorder, onAdd, onValueChange, ...rest }: HarnessProps) {
  const [tabs, setTabs] = useState(initial);
  const [value, setValue] = useState<string | null>(initialValue);
  return (
    <EditorTabs
      tabs={tabs}
      value={value}
      onValueChange={(id) => {
        setValue(id);
        onValueChange?.(id);
      }}
      onClose={(tab, via) => {
        onClose?.(tab, via);
        setTabs((all) => all.filter((candidate) => candidate.id !== tab.id));
      }}
      onReorder={(from, to, via) => {
        onReorder?.(from, to, via);
        setTabs((all) => move(all, from, to));
      }}
      onAdd={
        onAdd
          ? () => {
              onAdd();
              setTabs((all) => [...all, { id: `new-${all.length}`, label: "untitled" }]);
            }
          : undefined
      }
      {...rest}
    >
      {panels}
    </EditorTabs>
  );
}

const names = () => screen.getAllByRole("tab").map((tab) => tab.textContent?.replace(/ \(.*\)$/, ""));

afterEach(() => vi.restoreAllMocks());

describe("EditorTabs — structure", () => {
  it("draws a named tablist of the tabs, in order, with the selected one marked", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Open tabs" })).toBeInTheDocument();
    expect(names()).toEqual(["index.ts", "app.ts", "util.ts", "readme.md"]);
    expect(screen.getByRole("tab", { name: /index\.ts/ })).toHaveAttribute("aria-selected", "true");
  });

  it("names the list from aria-label, or aria-labelledby, over the default", () => {
    const { unmount } = render(<Harness aria-label="Files" />);
    expect(screen.getByRole("tablist", { name: "Files" })).toBeInTheDocument();
    unmount();
    render(
      <>
        <span id="heading">Project files</span>
        <Harness aria-labelledby="heading" />
      </>,
    );
    expect(screen.getByRole("tablist", { name: "Project files" })).toBeInTheDocument();
  });

  it("takes className, style, id, data-testid and a ref on the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<EditorTabs ref={ref} tabs={FILES} value="a" className="mine" style={{ color: "red" }} id="strip" data-testid="strip" />);
    const root = screen.getByTestId("strip");
    expect(ref.current).toBe(root);
    expect(root).toHaveClass("mine");
    expect(root).toHaveAttribute("id", "strip");
    expect(root.style.color).toBe("red");
  });

  it("has no tab selected for a null value", () => {
    render(<EditorTabs tabs={FILES} value={null} />);
    for (const tab of screen.getAllByRole("tab")) expect(tab).toHaveAttribute("aria-selected", "false");
  });

  it("shows an icon, and a pin for a pinned tab without one", () => {
    const { container } = render(
      <EditorTabs
        tabs={[
          { id: "a", label: "Home", icon: HouseIcon },
          { id: "b", label: "Pinned", pinned: true },
        ]}
        value="a"
      />,
    );
    expect(container.querySelectorAll("svg").length).toBe(2);
  });

  it("names a dirty and a pinned tab by those words after the label", () => {
    render(<EditorTabs tabs={[{ id: "a", label: "app.ts", dirty: true }, { id: "b", label: "pin", pinned: true }]} value="a" />);
    expect(screen.getByRole("tab", { name: "app.ts (unsaved changes)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "pin (pinned)" })).toBeInTheDocument();
  });

  it("keeps an aria-label and adds the status after it", () => {
    render(<EditorTabs tabs={[{ id: "a", label: <b>x</b>, "aria-label": "Settings", dirty: true }]} value="a" />);
    expect(screen.getByRole("tab", { name: "Settings (unsaved changes)" })).toBeInTheDocument();
  });
});

describe("EditorTabs — selection", () => {
  it("reports a selected tab, controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: /util\.ts/ }));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveAttribute("aria-selected", "true");
  });

  it("holds its own selection when uncontrolled", async () => {
    const user = userEvent.setup();
    render(<EditorTabs tabs={FILES} defaultValue="a" />);
    await user.click(screen.getByRole("tab", { name: /util\.ts/ }));
    expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveAttribute("aria-selected", "true");
  });

  it("is one tab stop, moved with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole("tab", { name: /index\.ts/ })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /app\.ts/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("tab", { name: /app\.ts/ })).not.toHaveFocus();
  });

  it("draws a panel for the selected tab, and keeps one mounted with forceMount", () => {
    render(
      <Harness
        panels={
          <>
            <EditorTabs.Panel value="a">Panel A</EditorTabs.Panel>
            <EditorTabs.Panel value="b" forceMount>
              Panel B
            </EditorTabs.Panel>
          </>
        }
      />,
    );
    expect(screen.getByText("Panel A")).toBeVisible();
    expect(screen.getByText("Panel B", { selector: "div" })).not.toBeVisible();
  });
});

describe("EditorTabs — closing", () => {
  it("has no close button without onClose", () => {
    render(<EditorTabs tabs={FILES} value="a" />);
    expect(screen.queryByRole("button", { name: /Close/, hidden: true })).toBeNull();
  });

  it("asks for a close from the button, and leaves the list alone until the owner changes it", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditorTabs tabs={FILES} value="a" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close util.ts", hidden: true }));
    expect(onClose).toHaveBeenCalledWith(FILES[2], "button");
    expect(names()).toHaveLength(4);
  });

  it("closes the focused tab with Delete", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await user.tab();
    await user.keyboard("{ArrowRight}{Delete}");
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }), "keyboard");
    expect(names()).toEqual(["index.ts", "util.ts", "readme.md"]);
  });

  it("closes a tab with a middle click", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent(screen.getByRole("tab", { name: /util\.ts/ }), new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }));
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ id: "c" }), "middle-click");
  });

  it("selects the next tab when the selected one closes, and the previous when it was last", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="b" />);
    await user.click(screen.getByRole("button", { name: "Close app.ts", hidden: true }));
    expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: /readme\.md/ }));
    await user.click(screen.getByRole("button", { name: "Close readme.md", hidden: true }));
    expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveAttribute("aria-selected", "true");
  });

  it("does not change the selection when a tab other than the selected one closes", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="a" />);
    await user.click(screen.getByRole("button", { name: "Close util.ts", hidden: true }));
    expect(screen.getByRole("tab", { name: /index\.ts/ })).toHaveAttribute("aria-selected", "true");
  });

  it("leaves the selection to the owner with closeSelects none", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness initialValue="b" closeSelects="none" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Close app.ts", hidden: true }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not choose a neighbour while the owner has not closed the tab", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<EditorTabs tabs={FILES} value="b" onClose={() => {}} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Close app.ts", hidden: true }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("hands focus to the neighbour after a keyboard close", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard("{ArrowRight}{Delete}");
    await waitFor(() => expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveFocus());
  });

  it("leaves focus alone when it was somewhere else", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">elsewhere</button>
        <Harness />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    await user.click(screen.getByRole("button", { name: "Close util.ts", hidden: true }));
    expect(screen.getByRole("button", { name: "elsewhere" })).toHaveFocus();
  });

  it("does not offer to close a pinned tab, unless it says closable", () => {
    render(
      <EditorTabs
        tabs={[
          { id: "a", label: "Pinned", pinned: true },
          { id: "b", label: "Pinned closable", pinned: true, closable: true },
          { id: "c", label: "Plain", disabled: true },
        ]}
        value="a"
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Close Pinned", hidden: true })).toBeNull();
    expect(screen.getByRole("button", { name: "Close Pinned closable", hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close Plain", hidden: true })).toBeNull();
  });

  it("keeps the close button out of the tab order and out of the accessibility tree", () => {
    render(<Harness />);
    const close = screen.getByRole("button", { name: "Close util.ts", hidden: true });
    expect(close).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("button", { name: "Close util.ts" })).toBeNull();
  });

  it("announces a closed tab", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Harness />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Close util.ts", hidden: true }));
      });
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("util.ts closed");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("EditorTabs — adding", () => {
  it("shows the add button only with onAdd, and asks for a tab", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const { unmount } = render(<EditorTabs tabs={FILES} value="a" />);
    expect(screen.queryByRole("button", { name: "New tab" })).toBeNull();
    unmount();
    render(<Harness onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: "New tab" }));
    expect(onAdd).toHaveBeenCalled();
    expect(names()).toHaveLength(5);
  });
});

describe("EditorTabs — reordering with the keyboard", () => {
  it("moves the focused tab one place with Alt and an arrow key, and keeps focus on it", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<Harness onReorder={onReorder} />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(onReorder).toHaveBeenCalledWith(0, 1, "keyboard");
    expect(names()).toEqual(["app.ts", "index.ts", "util.ts", "readme.md"]);
    await waitFor(() => expect(screen.getByRole("tab", { name: /index\.ts/ })).toHaveFocus());
  });

  it("picks a tab up with Space, moves it with the arrows and drops it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard(" ");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(names()).toEqual(["app.ts", "util.ts", "index.ts", "readme.md"]);
    await user.keyboard(" ");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /readme\.md/ })).toHaveFocus();
  });

  it("puts a picked-up tab back with Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard(" {ArrowRight}{Escape}");
    expect(names()).toEqual(["index.ts", "app.ts", "util.ts", "readme.md"]);
  });

  it("does not select the tab when Space picks it up", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} initialValue="b" />);
    await user.tab();
    expect(screen.getByRole("tab", { name: /app\.ts/ })).toHaveFocus();
    await user.keyboard(" ");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("is off without onReorder", async () => {
    const user = userEvent.setup();
    render(<EditorTabs tabs={FILES} value="a" />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(screen.getByRole("tab", { name: /index\.ts/ })).toHaveFocus();
  });

  it("flips the arrow keys right to left", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<Harness dir="rtl" onReorder={onReorder} />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(onReorder).toHaveBeenCalledWith(0, 1, "keyboard");
  });

  it("reports positions in the whole list, with pinned tabs first and not movable", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(
      <Harness
        initial={[
          { id: "p", label: "Pinned", pinned: true },
          { id: "x", label: "X" },
          { id: "y", label: "Y" },
        ]}
        initialValue="x"
        onReorder={onReorder}
      />,
    );
    await user.click(screen.getByRole("tab", { name: "X" }));
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(onReorder).toHaveBeenCalledWith(1, 2, "keyboard");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(onReorder).toHaveBeenLastCalledWith(2, 1, "keyboard");
    onReorder.mockClear();
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("does not move a pinned tab with the keyboard", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(
      <Harness
        initial={[
          { id: "p", label: "Pinned", pinned: true },
          { id: "x", label: "X" },
          { id: "y", label: "Y" },
        ]}
        initialValue="p"
        onReorder={onReorder}
      />,
    );
    await user.tab();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("announces a pick up and a move", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Harness />);
      const tab = screen.getByRole("tab", { name: /index\.ts/ });
      act(() => tab.focus());
      await act(async () => {
        fireEvent.keyDown(tab, { key: " " });
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("index.ts, picked up. Position 1 of 4.");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("EditorTabs — dragging", () => {
  it("ignores a touch press, which scrolls the strip", () => {
    const onReorder = vi.fn();
    render(<Harness onReorder={onReorder} />);
    const tab = screen.getByRole("tab", { name: /index\.ts/ });
    fireEvent.pointerDown(tab, { clientX: 10, clientY: 10, pointerId: 1, isPrimary: true, pointerType: "touch", button: 0 });
    act(() => {
      fireEvent(window, new MouseEvent("pointermove", { clientX: 400, clientY: 10, bubbles: true }));
      fireEvent(window, new MouseEvent("pointerup", { clientX: 400, clientY: 10, bubbles: true }));
    });
    expect(onReorder).not.toHaveBeenCalled();
  });
});

describe("EditorTabs — overflow menu", () => {
  it("lists every tab and selects the one chosen", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness overflow="menu" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "All tabs" }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitemradio", { name: "readme.md" }));
    expect(onValueChange).toHaveBeenCalledWith("d");
  });

  it("is absent by default", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "All tabs" })).toBeNull();
  });
});

describe("EditorTabs — tab context menu", () => {
  it("opens a menu on a tab with the items the owner draws, told the tab", async () => {
    const tabContextMenu = vi.fn(({ tab, close }) => (
      <ContextMenu.Item onSelect={() => close()}>Close {String(tab.label)}</ContextMenu.Item>
    ));
    render(<Harness tabContextMenu={tabContextMenu} />);
    fireEvent.contextMenu(screen.getByRole("tab", { name: /util\.ts/ }));
    const item = await screen.findByRole("menuitem", { name: "Close util.ts" });
    expect(tabContextMenu).toHaveBeenCalledWith(expect.objectContaining({ index: 2, count: 4, tab: expect.objectContaining({ id: "c" }) }));
    await userEvent.click(item);
    await waitFor(() => expect(names()).toEqual(["index.ts", "app.ts", "readme.md"]));
  });
});

describe("EditorTabs — controller", () => {
  it("selects, closes, adds, moves and focuses from outside", async () => {
    const controller = createRef<EditorTabsController>();
    const onClose = vi.fn();
    const onAdd = vi.fn();
    render(<Harness controllerRef={controller} onClose={onClose} onAdd={onAdd} />);
    const handle = controller.current!;
    act(() => {
      expect(handle.select("c")).toBe(true);
      expect(handle.select("missing")).toBe(false);
    });
    expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveAttribute("aria-selected", "true");
    act(() => {
      expect(handle.move("a", 2)).toBe(true);
    });
    expect(names()).toEqual(["app.ts", "util.ts", "index.ts", "readme.md"]);
    act(() => {
      expect(handle.close("d")).toBe(true);
      expect(handle.add()).toBe(true);
    });
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ id: "d" }), "controller");
    expect(onAdd).toHaveBeenCalled();
    act(() => {
      expect(handle.focus("b")).toBe(true);
    });
    expect(screen.getByRole("tab", { name: /app\.ts/ })).toHaveFocus();
    expect(controller.current).toBe(handle);
  });

  it("says no when there is nothing to do", () => {
    const controller = createRef<EditorTabsController>();
    render(<EditorTabs tabs={FILES} value="a" controllerRef={controller} />);
    expect(controller.current!.close("a")).toBe(false);
    expect(controller.current!.add()).toBe(false);
    expect(controller.current!.move("a", 2)).toBe(false);
  });

  it("keeps a pinned tab's move inside the pinned group", () => {
    const controller = createRef<EditorTabsController>();
    const onReorder = vi.fn();
    render(
      <EditorTabs
        tabs={[
          { id: "p1", label: "P1", pinned: true },
          { id: "p2", label: "P2", pinned: true },
          { id: "x", label: "X" },
        ]}
        value="x"
        onReorder={onReorder}
        controllerRef={controller}
      />,
    );
    expect(controller.current!.move("p1", 2)).toBe(true);
    expect(onReorder).toHaveBeenCalledWith(0, 1, "controller");
    // The only unpinned tab is already first of its group, so moving it to the start changes nothing.
    expect(controller.current!.move("x", 0)).toBe(false);
    expect(onReorder).toHaveBeenCalledTimes(1);
  });
});

describe("EditorTabs — text", () => {
  it("takes translated labels, and keeps the default where one is undefined", () => {
    render(<EditorTabs tabs={FILES} value="a" onClose={() => {}} onAdd={() => {}} labels={{ addTab: "Nouvel onglet", closeTab: undefined }} />);
    expect(screen.getByRole("button", { name: "Nouvel onglet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close util.ts", hidden: true })).toBeInTheDocument();
  });

  it("writes numbers with formatNumber", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Harness formatNumber={(n) => `#${n}`} />);
      const tab = screen.getByRole("tab", { name: /index\.ts/ });
      act(() => tab.focus());
      await act(async () => {
        fireEvent.keyDown(tab, { key: " " });
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Position #1 of #4");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("EditorTabs — dev warnings and strict mode", () => {
  it("warns about a repeated id and a pinned tab out of place", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<EditorTabs tabs={[{ id: "a", label: "A" }, { id: "a", label: "B" }]} value="a" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('share the id "a"'));
    warn.mockClear();
    render(<EditorTabs tabs={[{ id: "x", label: "X" }, { id: "y", label: "Y", pinned: true }]} value="x" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("pinned tab comes after"));
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}{Delete}");
    await waitFor(() => expect(screen.getByRole("tab", { name: /util\.ts/ })).toHaveFocus());
    expect(names()).toEqual(["index.ts", "util.ts", "readme.md"]);
  });
});

describe("EditorTabs — accessibility (jest-axe)", () => {
  it("has no violations by default", async () => {
    const { container } = render(<Harness onAdd={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(["underline", "subtle", "outlined", "solid"] as const)("has no violations in the %s variant", async (variant) => {
    const { container } = render(<Harness variant={variant} rounded />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with pinned, dirty and icon tabs, panels and the menu", async () => {
    const { container } = render(
      <Harness
        overflow="menu"
        initial={[
          { id: "p", label: "Home", pinned: true, icon: HouseIcon },
          { id: "d", label: "Draft", dirty: true },
          { id: "x", label: "Locked", disabled: true },
        ]}
        initialValue="p"
        panels={<EditorTabs.Panel value="p">Home panel</EditorTabs.Panel>}
        dir="rtl"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
