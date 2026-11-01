import { FileIcon } from "@dbm-system/icons";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Menu } from "../Menu";
import { Menubar, useMenubarController } from "./Menubar";
import type { MenubarController, MenubarProps } from "./Menubar.types";

function Bar({
  root,
  children,
}: {
  root?: Omit<MenubarProps, "children">;
  children?: React.ReactNode;
}) {
  return (
    <Menubar aria-label="Application menu" {...root}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item shortcut="mod+s">Save</Menubar.Item>
          <Menubar.Item>Open</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      {children}
    </Menubar>
  );
}

const item = (name: string | RegExp) => screen.getByRole("menuitem", { name });
const noRegion = { rules: { region: { enabled: false } } };

// jsdom has neither observer; a tooltip (a trigger with a reason) and a sticky bar read them.
class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// A resize observer a test can fire, for what a container's resize reports.
const resizeCallbacks = new Set<() => void>();
class FiringResizeObserver {
  callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
  }
  observe() {
    resizeCallbacks.add(this.callback);
  }
  unobserve() {}
  disconnect() {
    resizeCallbacks.delete(this.callback);
  }
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FiringResizeObserver);
  vi.stubGlobal("IntersectionObserver", Observer);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Menubar controller", () => {
  it("opens a menu by name with focus on its first item, and closes it", async () => {
    const ref = createRef<MenubarController>();
    render(<Bar root={{ controllerRef: ref }} />);
    expect(ref.current?.value).toBe("");
    let opened = false;
    act(() => {
      opened = ref.current?.open("edit") ?? false;
    });
    expect(opened).toBe(true);
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Undo" })).toHaveFocus(),
    );
    expect(ref.current?.value).toBe("edit");
    act(() => ref.current?.close());
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(ref.current?.value).toBe("");
  });

  it("says it did nothing for a menu that is not there, an action, or a trigger disabled with a reason", () => {
    const ref = createRef<MenubarController>();
    render(
      <Bar root={{ controllerRef: ref }}>
        <Menubar.Action>Run</Menubar.Action>
        <Menubar.Menu value="view">
          <Menubar.Trigger disabled disabledReason="Nothing to view">
            View
          </Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>Zoom</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Bar>,
    );
    expect(ref.current?.open("missing")).toBe(false);
    expect(ref.current?.open("view")).toBe(false);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps one object for the life of the bar", () => {
    const ref = createRef<MenubarController>();
    const { rerender } = render(<Bar root={{ controllerRef: ref }} />);
    const first = ref.current;
    rerender(<Bar root={{ controllerRef: ref, size: "lg" }} />);
    expect(ref.current).toBe(first);
  });

  it("is the same object a part inside the bar gets from useMenubarController", async () => {
    const user = userEvent.setup();
    function Inside() {
      const bar = useMenubarController();
      return <button onClick={() => bar.open("file")}>open file</button>;
    }
    render(
      <>
        <Bar>
          <Menubar.Action asChild>
            <span />
          </Menubar.Action>
        </Bar>
        <Menubar aria-label="Other">
          <Inside />
          <Menubar.Menu value="file">
            <Menubar.Trigger>File</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>New</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </>,
    );
    await user.click(
      screen.getAllByRole("button", { name: "open file" })[0] as HTMLElement,
    );
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "New" })).toHaveFocus(),
    );
  });

  it("controls nothing, and warns, outside a bar", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    function Outside() {
      const bar = useMenubarController();
      const [opened, setOpened] = useState("not asked");
      return (
        <button onClick={() => setOpened(String(bar.open("file")))}>
          {opened}
        </button>
      );
    }
    render(<Outside />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "false" })).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("useMenubarController"),
    );
  });
});

describe("Menubar hotkeys", () => {
  it("binds nothing by default", () => {
    render(<Bar />);
    fireEvent.keyDown(document, { key: "f", code: "KeyF", altKey: true });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens a menu from a key anywhere on the page, onto its first item, and keeps the press from the browser", async () => {
    render(<Bar root={{ hotkeys: { file: "alt+f", edit: "alt+e" } }} />);
    const event = new KeyboardEvent("keydown", {
      key: "f",
      code: "KeyF",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    await waitFor(() => expect(item(/^Save/)).toHaveFocus());
    fireEvent.keyDown(document, { key: "e", code: "KeyE", altKey: true });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Undo" })).toHaveFocus(),
    );
  });

  it("is turned off per menu with false, and leaves a key it does not own alone", () => {
    render(<Bar root={{ hotkeys: { file: false, edit: "alt+e" } }} />);
    fireEvent.keyDown(document, { key: "f", code: "KeyF", altKey: true });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const other = new KeyboardEvent("keydown", {
      key: "x",
      code: "KeyX",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(other);
    });
    expect(other.defaultPrevented).toBe(false);
  });

  it("warns once about a combination it can't read", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Bar root={{ hotkeys: { file: "hyper+q" } }} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"hyper+q"'));
  });

  it("stops listening when the bar goes", () => {
    const { unmount } = render(<Bar root={{ hotkeys: { file: "alt+f" } }} />);
    unmount();
    const event = new KeyboardEvent("keydown", {
      key: "f",
      code: "KeyF",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("Menubar.Action", () => {
  it("is a menuitem in the bar that is not a popup", () => {
    render(
      <Bar>
        <Menubar.Action>Run</Menubar.Action>
      </Bar>,
    );
    const run = item("Run");
    expect(run).not.toHaveAttribute("aria-haspopup");
    expect(run).not.toHaveAttribute("aria-expanded");
  });

  it("runs onSelect on a click, Enter and Space, and opens no menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Bar>
        <Menubar.Action onSelect={onSelect}>Run</Menubar.Action>
      </Bar>,
    );
    await user.click(item("Run"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    item("Run").focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(2);
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("joins the arrow-key order beside the triggers", async () => {
    const user = userEvent.setup();
    render(
      <Bar>
        <Menubar.Action>Run</Menubar.Action>
      </Bar>,
    );
    item("Edit").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("Run")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("File")).toHaveFocus();
  });

  it("closes an open menu when an arrow key or the pointer reaches it, and takes focus", async () => {
    const user = userEvent.setup();
    render(
      <Bar>
        <Menubar.Action>Run</Menubar.Action>
      </Bar>,
    );
    await user.click(item("Edit"));
    await screen.findByRole("menu");
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(item("Run")).toHaveFocus();
    await user.click(item("File"));
    await screen.findByRole("menu");
    await user.hover(item("Run"));
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("is skipped when disabled, and runs nothing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Bar>
        <Menubar.Action disabled onSelect={onSelect}>
          Run
        </Menubar.Action>
      </Bar>,
    );
    await user.click(item("Run"));
    expect(onSelect).not.toHaveBeenCalled();
    item("Edit").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("File")).toHaveFocus();
  });

  it("is the element it is given with asChild, such as a link", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Bar>
        <Menubar.Action asChild onSelect={onSelect}>
          <a href="#help">Help</a>
        </Menubar.Action>
      </Bar>,
    );
    const help = item("Help");
    expect(help.tagName).toBe("A");
    await user.click(help);
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("a trigger or an action disabled with a reason", () => {
  it("stays focusable, says it is unavailable, and opens nothing", async () => {
    const user = userEvent.setup();
    render(
      <Bar>
        <Menubar.Menu value="view">
          <Menubar.Trigger disabled disabledReason="Nothing to view">
            View
          </Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>Zoom</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Bar>,
    );
    const view = item("View");
    expect(view).not.toBeDisabled();
    expect(view).toHaveAttribute("aria-disabled", "true");
    expect(view).toHaveAccessibleDescription("Nothing to view");
    item("Edit").focus();
    await user.keyboard("{ArrowRight}");
    expect(view).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await user.click(view);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not run an action with a reason", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Bar>
        <Menubar.Action
          disabled
          disabledReason="Nothing to run"
          onSelect={onSelect}
        >
          Run
        </Menubar.Action>
      </Bar>,
    );
    expect(item("Run")).toHaveAttribute("aria-disabled", "true");
    await user.click(item("Run"));
    item("Run").focus();
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("warns when a reason is given to a trigger that is not disabled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Menubar aria-label="x">
        <Menubar.Menu value="reason-without-disabled">
          <Menubar.Trigger disabledReason="Why">A</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>One</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("disabledReason"),
    );
  });
});

describe("trigger icon and trailing content", () => {
  it("draws an icon before the label and trailing content after it, without changing the name", () => {
    render(
      <Bar>
        <Menubar.Action
          icon={FileIcon}
          trailing={<span data-testid="count">3</span>}
        >
          Inbox
        </Menubar.Action>
      </Bar>,
    );
    const inbox = screen.getByRole("menuitem", { name: /Inbox/ });
    expect(inbox.querySelector("svg")).not.toBeNull();
    expect(screen.getByTestId("count")).toBeInTheDocument();
  });
});

describe("shortcut hints written with mod", () => {
  it("are drawn for the platform in a menubar", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.click(item("File"));
    await waitFor(() => expect(screen.getByText("Ctrl+S")).toBeInTheDocument());
    expect(screen.queryByText("mod+s")).not.toBeInTheDocument();
  });

  it("are drawn the same in a Menu", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item shortcut="mod+s">Save</Menu.Item>
        </Menu.Content>
      </Menu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByText("Ctrl+S")).toBeInTheDocument();
  });

  it("use the command key on an Apple platform", async () => {
    vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel" });
    const user = userEvent.setup();
    render(<Bar />);
    await user.click(item("File"));
    await waitFor(() => expect(screen.getByText("⌘S")).toBeInTheDocument());
  });
});

describe("sticky", () => {
  it("puts the bar in an Affix, and keeps its role and name", () => {
    render(<Bar root={{ sticky: true, stickyOffset: 4 }} />);
    const bar = screen.getByRole("menubar", { name: "Application menu" });
    expect(bar.previousElementSibling).not.toBeNull();
  });
});

describe("overflow menu", () => {
  // jsdom lays out nothing, so the widths the bar reads are given: each item is 100px, the "More" trigger 40px, and the
  // container 200px.
  function stubWidths(room: { current: number }) {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.hasAttribute("data-menubar-more")
          ? 40
          : this.hasAttribute("data-menubar-item")
            ? 100
            : this.dataset.room !== undefined
              ? room.current
              : 0;
        return {
          width,
          height: 24,
          top: 0,
          left: 0,
          right: width,
          bottom: 24,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      },
    );
  }
  const FourMenus = (props: Omit<MenubarProps, "children">) => (
    <div data-room="">
      <Menubar aria-label="Application menu" overflow="menu" {...props}>
        {["file", "edit", "view", "window"].map((name) => (
          <Menubar.Menu key={name} value={name}>
            <Menubar.Trigger>{name}</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>{`${name} item`}</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
        ))}
      </Menubar>
    </div>
  );

  it("moves the menus that do not fit into a More menu, each as a submenu", async () => {
    stubWidths({ current: 200 });
    const user = userEvent.setup();
    render(<FourMenus />);
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
    expect(item("file")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "edit" }),
    ).not.toBeInTheDocument();
    await user.click(item("More"));
    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(
      await screen.findByRole("menuitem", { name: "edit" }),
    ).toHaveAttribute("aria-haspopup", "menu");
    expect(
      screen.getByRole("menuitem", { name: "window" }),
    ).toBeInTheDocument();
  });

  it("brings every menu back when there is room, and draws all of them when nothing is measured", async () => {
    const room = { current: 200 };
    stubWidths(room);
    render(<FourMenus />);
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
    room.current = 500;
    // the container's resize is what reports the new room
    await act(async () => {
      resizeCallbacks.forEach((callback) => callback());
    });
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(4),
    );
    expect(
      screen.queryByRole("menuitem", { name: "More" }),
    ).not.toBeInTheDocument();
  });

  it("works with menus and actions inside a component of the app's own", async () => {
    stubWidths({ current: 200 });
    const user = userEvent.setup();
    function Menus() {
      return (
        <>
          {["file", "edit", "view"].map((name) => (
            <Menubar.Menu key={name} value={name}>
              <Menubar.Trigger>{name}</Menubar.Trigger>
              <Menubar.Content>
                <Menubar.Item>{`${name} item`}</Menubar.Item>
              </Menubar.Content>
            </Menubar.Menu>
          ))}
          <Menubar.Action>Help</Menubar.Action>
        </>
      );
    }
    render(
      <div data-room="">
        <Menubar aria-label="Application menu" overflow="menu">
          <Menus />
        </Menubar>
      </div>,
    );
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
    expect(item("file")).toBeInTheDocument();
    await user.click(item("More"));
    expect(
      await screen.findByRole("menuitem", { name: "edit" }),
    ).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByRole("menuitem", { name: "view" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Help" })).toBeInTheDocument();
  });

  describe("a menu that moves into More", () => {
    function Panels({ controlled }: { controlled: boolean }) {
      const [grid, setGrid] = useState(false);
      return (
        <div data-room="">
          <Menubar aria-label="Application menu" overflow="menu">
            {["file", "edit"].map((name) => (
              <Menubar.Menu key={name} value={name}>
                <Menubar.Trigger>{name}</Menubar.Trigger>
                <Menubar.Content>
                  <Menubar.Item>{`${name} item`}</Menubar.Item>
                </Menubar.Content>
              </Menubar.Menu>
            ))}
            <Menubar.Menu value="view">
              <Menubar.Trigger>view</Menubar.Trigger>
              <Menubar.Content>
                {controlled ? (
                  <Menubar.CheckboxItem
                    checked={grid}
                    onCheckedChange={setGrid}
                  >
                    Grid
                  </Menubar.CheckboxItem>
                ) : (
                  <Menubar.CheckboxItem>Grid</Menubar.CheckboxItem>
                )}
              </Menubar.Content>
            </Menubar.Menu>
          </Menubar>
        </div>
      );
    }

    async function chooseGridThenShrink(
      user: ReturnType<typeof userEvent.setup>,
      room: { current: number },
    ) {
      await user.click(item("view"));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "Grid" }),
      );
      // a checkbox item leaves its menu open
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
      // the trigger has focus after the menu closes, and a trigger with focus is held in the bar
      await act(async () => (document.activeElement as HTMLElement).blur());
      room.current = 200;
      await act(async () => {
        resizeCallbacks.forEach((callback) => callback());
      });
      await waitFor(() =>
        expect(
          screen.queryByRole("menuitem", { name: "view" }),
        ).not.toBeInTheDocument(),
      );
      await user.click(item("More"));
      await user.click(await screen.findByRole("menuitem", { name: "view" }));
      return screen.findByRole("menuitemcheckbox", { name: "Grid" });
    }

    it("keeps a controlled checkbox item's state", async () => {
      const room = { current: 500 };
      stubWidths(room);
      render(<Panels controlled />);
      const grid = await chooseGridThenShrink(userEvent.setup(), room);
      expect(grid).toHaveAttribute("aria-checked", "true");
    });

    it("starts an uncontrolled checkbox item over, so a bar that can overflow holds its checked state itself", async () => {
      const room = { current: 500 };
      stubWidths(room);
      render(<Panels controlled={false} />);
      const grid = await chooseGridThenShrink(userEvent.setup(), room);
      expect(grid).toHaveAttribute("aria-checked", "false");
    });
  });

  it("names the More menu from labels", async () => {
    stubWidths({ current: 200 });
    render(<FourMenus labels={{ more: "Mehr" }} />);
    expect(
      await screen.findByRole("menuitem", { name: "Mehr" }),
    ).toBeInTheDocument();
  });

  it("draws every menu without overflow='menu', whatever the room", () => {
    stubWidths({ current: 100 });
    render(
      <div data-room="">
        <Bar />
      </div>,
    );
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("has no accessibility violations with a menu moved into More", async () => {
    stubWidths({ current: 200 });
    const { container } = render(<FourMenus />);
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
    expect(await axe(container, noRegion)).toHaveNoViolations();
  });
});

describe("the bar's name", () => {
  it("warns once when a bar has neither aria-label nor aria-labelledby, and not when it has one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { unmount } = render(
      <Menubar aria-label="Named">
        <Menubar.Menu value="x">
          <Menubar.Trigger>x</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>One</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>,
    );
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining("accessible name"),
    );
    unmount();
    render(
      <Menubar>
        <Menubar.Menu value="y">
          <Menubar.Trigger>y</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>One</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("accessible name"),
    );
  });
});

describe("Menubar.Action attributes", () => {
  it("keeps its role, and stays a non-popup, when the same props are passed", () => {
    render(
      <Bar>
        <Menubar.Action
          role="button"
          aria-haspopup="dialog"
          aria-expanded={true}
          aria-label="Run it"
        >
          Run
        </Menubar.Action>
      </Bar>,
    );
    const run = screen.getByRole("menuitem", { name: "Run it" });
    expect(run).not.toHaveAttribute("aria-haspopup");
    expect(run).not.toHaveAttribute("aria-expanded");
  });

  it("takes aria-label, aria-labelledby and aria-describedby, and adds its reason to the description", () => {
    render(
      <Bar>
        <span id="note">Extra note</span>
        <Menubar.Action
          disabled
          disabledReason="Not yet"
          aria-describedby="note"
        >
          Run
        </Menubar.Action>
      </Bar>,
    );
    expect(item("Run")).toHaveAccessibleDescription("Extra note Not yet");
  });
});

describe("the arrow keys, Home and End", () => {
  it("move focus to the first and last trigger", async () => {
    const user = userEvent.setup();
    render(
      <Bar>
        <Menubar.Action>Run</Menubar.Action>
      </Bar>,
    );
    item("Edit").focus();
    await user.keyboard("{End}");
    expect(item("Run")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("File")).toHaveFocus();
  });
});

describe("an action that is chosen from More", () => {
  it("runs onSelect with an event that can be prevented", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.hasAttribute("data-menubar-more")
          ? 40
          : this.hasAttribute("data-menubar-item")
            ? 100
            : this.dataset.room !== undefined
              ? 150
              : 0;
        return {
          width,
          height: 24,
          top: 0,
          left: 0,
          right: width,
          bottom: 24,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      },
    );
    render(
      <div data-room="">
        <Menubar aria-label="Application menu" overflow="menu">
          <Menubar.Menu value="file">
            <Menubar.Trigger>file</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>New</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Action onSelect={onSelect}>Run</Menubar.Action>
        </Menubar>
      </div>,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: "Run" }),
      ).not.toBeInTheDocument(),
    );
    await user.click(item("More"));
    await user.click(await screen.findByRole("menuitem", { name: "Run" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(typeof onSelect.mock.calls[0]?.[0].preventDefault).toBe("function");
  });
});

describe("focus handed to an action", () => {
  it("is not held for the next menu: a later close gives focus back to that menu's trigger", async () => {
    const user = userEvent.setup();
    render(
      <Bar>
        <Menubar.Action>Run</Menubar.Action>
      </Bar>,
    );
    await user.click(item("File"));
    await screen.findByRole("menu");
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(item("Run")).toHaveFocus());
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await user.click(item("Edit"));
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(item("Edit")).toHaveFocus();
  });
});

describe("in StrictMode", () => {
  it("opens from a hotkey and from a controller, and takes an action's focus", async () => {
    const user = userEvent.setup();
    const ref = createRef<MenubarController>();
    render(
      <StrictMode>
        <Bar root={{ hotkeys: { file: "alt+f" }, controllerRef: ref }}>
          <Menubar.Action>Run</Menubar.Action>
        </Bar>
      </StrictMode>,
    );
    fireEvent.keyDown(document, { key: "f", code: "KeyF", altKey: true });
    await waitFor(() => expect(item(/^Save/)).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    act(() => {
      ref.current?.open("edit");
    });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Undo" })).toHaveFocus(),
    );
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(item("Run")).toHaveFocus());
  });

  it("registers its menus for the More menu once, and moves them as the room changes", async () => {
    const room = { current: 200 };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.hasAttribute("data-menubar-more")
          ? 40
          : this.hasAttribute("data-menubar-item")
            ? 100
            : this.dataset.room !== undefined
              ? room.current
              : 0;
        return {
          width,
          height: 24,
          top: 0,
          left: 0,
          right: width,
          bottom: 24,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      },
    );
    render(
      <StrictMode>
        <div data-room="">
          <Menubar aria-label="Application menu" overflow="menu">
            {["file", "edit", "view"].map((name) => (
              <Menubar.Menu key={name} value={name}>
                <Menubar.Trigger>{name}</Menubar.Trigger>
                <Menubar.Content>
                  <Menubar.Item>{`${name} item`}</Menubar.Item>
                </Menubar.Content>
              </Menubar.Menu>
            ))}
          </Menubar>
        </div>
      </StrictMode>,
    );
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
    room.current = 500;
    await act(async () => {
      resizeCallbacks.forEach((callback) => callback());
    });
    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(3),
    );
  });
});
