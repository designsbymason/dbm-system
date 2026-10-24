import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { Menu } from "../Menu";
import { ContextMenu, useContextMenuController } from "./ContextMenu";
import type { ContextMenuController } from "./ContextMenu.types";
import { matchesKeyCombo } from "./ContextMenuContext";

function Basic({
  root,
  content,
  trigger,
  children,
}: {
  root?: Omit<React.ComponentProps<typeof ContextMenu>, "children">;
  content?: Omit<React.ComponentProps<typeof ContextMenu.Content>, "children">;
  trigger?: Omit<React.ComponentProps<typeof ContextMenu.Trigger>, "children">;
  children?: React.ReactNode;
}) {
  return (
    <ContextMenu {...root}>
      <ContextMenu.Trigger data-testid="area" {...trigger}>
        Right-click me
      </ContextMenu.Trigger>
      <ContextMenu.Content {...content}>
        {children ?? (
          <>
            <ContextMenu.Item>Edit</ContextMenu.Item>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
            <ContextMenu.Item>Archive</ContextMenu.Item>
          </>
        )}
      </ContextMenu.Content>
    </ContextMenu>
  );
}

const noRegion = { rules: { region: { enabled: false } } };
const area = () => screen.getByTestId("area");
const openByRightClick = () => fireEvent.contextMenu(area(), { clientX: 40, clientY: 30 });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ContextMenu", () => {
  describe("opening and closing", () => {
    it("renders only the area while closed", () => {
      render(<Basic />);
      expect(area()).toHaveTextContent("Right-click me");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(area()).toHaveAttribute("data-state", "closed");
    });

    it("opens on a right-click as a menu with its items, and marks the area open", async () => {
      render(<Basic />);
      openByRightClick();
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("data-state", "open");
      expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
      expect(area()).toHaveAttribute("data-state", "open");
    });

    it("opens on a long press with a finger", async () => {
      vi.useFakeTimers();
      render(<Basic />);
      fireEvent.pointerDown(area(), { pointerType: "touch", clientX: 10, clientY: 10, button: 0 });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("does not open for a press that ends early", async () => {
      vi.useFakeTimers();
      render(<Basic />);
      fireEvent.pointerDown(area(), { pointerType: "touch", clientX: 10, clientY: 10, button: 0 });
      fireEvent.pointerUp(area(), { pointerType: "touch" });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("opens from the keyboard on a focusable area with the context-menu event the key sends", async () => {
      render(<Basic trigger={{ tabIndex: 0 }} />);
      area().focus();
      fireEvent.contextMenu(area());
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("closes on Escape and returns focus to the element that had it", async () => {
      const user = userEvent.setup();
      render(<Basic trigger={{ tabIndex: 0 }} />);
      area().focus();
      fireEvent.contextMenu(area());
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      await waitFor(() => expect(area()).toHaveFocus());
    });

    it("closes on a press outside", async () => {
      render(
        <>
          <button type="button">Elsewhere</button>
          <Basic />
        </>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      // A modal menu makes the page inert, so a real pointer can't be aimed at it: a press is sent to the body.
      fireEvent.pointerDown(document.body);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("does not open when the area is disabled, so the browser's own menu shows", () => {
      render(<Basic trigger={{ disabled: true }} />);
      const notPrevented = fireEvent.contextMenu(area());
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(notPrevented).toBe(true);
    });

    it("prevents the browser's own menu when it opens", () => {
      render(<Basic />);
      expect(fireEvent.contextMenu(area())).toBe(false);
    });
  });

  describe("the controller", () => {
    it("opens at a point through controllerRef, as a right-click there would", async () => {
      const controllerRef = createRef<ContextMenuController>();
      const seen: Array<[number, number, boolean]> = [];
      document.addEventListener("contextmenu", (event) => seen.push([event.clientX, event.clientY, event.defaultPrevented]), { once: true });
      render(<Basic root={{ controllerRef }} />);
      let opened = false;
      act(() => {
        opened = controllerRef.current?.openAt({ x: 120, y: 80 }) ?? false;
      });
      expect(opened).toBe(true);
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(controllerRef.current?.open).toBe(true);
      // the event bubbles to the page like a real one, with the point it was given
      expect(seen[0]?.slice(0, 2)).toEqual([120, 80]);
    });

    it("opens from an element at its bottom corner on the start side, the other side in right-to-left text", async () => {
      const controllerRef = createRef<ContextMenuController>();
      const points: Array<[number, number]> = [];
      document.addEventListener("contextmenu", (event) => points.push([event.clientX, event.clientY]));
      render(
        <>
          <button type="button" data-testid="anchor">
            Anchor
          </button>
          <Basic root={{ controllerRef, dir: "rtl" }} />
        </>,
      );
      const anchor = screen.getByTestId("anchor");
      vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({ left: 10, right: 90, top: 20, bottom: 50, width: 80, height: 30, x: 10, y: 20, toJSON: () => ({}) });
      act(() => {
        controllerRef.current?.openFrom(anchor);
      });
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(points.at(-1)).toEqual([90, 50]);
    });

    it("closes the menu", async () => {
      const controllerRef = createRef<ContextMenuController>();
      render(<Basic root={{ controllerRef }} />);
      act(() => {
        controllerRef.current?.openAt({ x: 1, y: 1 });
      });
      await screen.findByRole("menu");
      act(() => controllerRef.current?.close());
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(controllerRef.current?.open).toBe(false);
    });

    it("does nothing, and says so, with a disabled area", () => {
      const controllerRef = createRef<ContextMenuController>();
      render(<Basic root={{ controllerRef }} trigger={{ disabled: true }} />);
      expect(controllerRef.current?.openAt({ x: 1, y: 1 })).toBe(false);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("is the same object, kept for the life of the menu, inside it through useContextMenuController", () => {
      const controllerRef = createRef<ContextMenuController>();
      const inside: ContextMenuController[] = [];
      function Probe() {
        inside.push(useContextMenuController());
        return null;
      }
      const { rerender } = render(
        <ContextMenu controllerRef={controllerRef}>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <Probe />
        </ContextMenu>,
      );
      rerender(
        <ContextMenu controllerRef={controllerRef} modal={false}>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <Probe />
        </ContextMenu>,
      );
      expect(new Set(inside).size).toBe(1);
      expect(inside[0]).toBe(controllerRef.current);
    });

    it("controls nothing outside a ContextMenu, and warns in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const results: boolean[] = [];
      function Lost() {
        results.push(useContextMenuController().openAt({ x: 1, y: 1 }));
        return null;
      }
      render(<Lost />);
      expect(results).toEqual([false]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("useContextMenuController: called outside a <ContextMenu>"));
    });

    it("opens a menu from a button inside the menu's own tree", async () => {
      const user = userEvent.setup();
      function Actions() {
        const menu = useContextMenuController();
        return (
          <button type="button" onClick={(event) => menu.openFrom(event.currentTarget)}>
            Actions
          </button>
        );
      }
      render(
        <ContextMenu>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <Actions />
          <ContextMenu.Content>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );
      await user.click(screen.getByRole("button", { name: "Actions" }));
      expect(await screen.findByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
    });
  });

  describe("opening from extra keys", () => {
    it("opens under the focused element on a key it was given, and returns focus there on Escape", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenu.Trigger asChild openOnKeys={["Alt+ArrowDown"]}>
            <div data-testid="area">
              <button type="button">Inside</button>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );
      const inside = screen.getByRole("button", { name: "Inside" });
      const rect = vi.spyOn(inside, "getBoundingClientRect").mockReturnValue({ left: 30, right: 70, top: 10, bottom: 40, width: 40, height: 30, x: 30, y: 10, toJSON: () => ({}) });
      const points: Array<[number, number]> = [];
      document.addEventListener("contextmenu", (event) => points.push([event.clientX, event.clientY]));
      inside.focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(rect).toHaveBeenCalled();
      expect(points.at(-1)).toEqual([30, 40]);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      await waitFor(() => expect(inside).toHaveFocus());
    });

    it("needs exactly the modifiers it names, and does nothing without openOnKeys", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Basic trigger={{ openOnKeys: ["Alt+ArrowDown"], tabIndex: 0 }} />);
      area().focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Shift>}{Alt>}{ArrowDown}{/Alt}{/Shift}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      rerender(<Basic trigger={{ tabIndex: 0 }} />);
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("leaves a key alone that another handler already took", async () => {
      const user = userEvent.setup();
      render(<Basic trigger={{ openOnKeys: ["Enter"], tabIndex: 0, onKeyDown: (event) => event.preventDefault() }} />);
      area().focus();
      await user.keyboard("{Enter}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("matchesKeyCombo", () => {
    const press = (key: string, modifiers: Partial<Record<"ctrlKey" | "altKey" | "shiftKey" | "metaKey", boolean>> = {}) => ({
      key,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      ...modifiers,
    });
    it.each([
      ["Enter", press("Enter"), true],
      ["enter", press("Enter"), true],
      ["Alt+ArrowDown", press("ArrowDown", { altKey: true }), true],
      ["Option+ArrowDown", press("ArrowDown", { altKey: true }), true],
      ["Control+Enter", press("Enter", { ctrlKey: true }), true],
      ["Cmd+k", press("K", { metaKey: true }), true],
      ["Enter", press("Enter", { shiftKey: true }), false],
      ["Alt+ArrowDown", press("ArrowDown"), false],
      ["Hyper+x", press("x"), false],
      ["", press("x"), false],
    ] as const)("%j against %j is %s", (combo, event, expected) => {
      expect(matchesKeyCombo(event, combo)).toBe(expected);
    });
  });

  describe("controlled and uncontrolled", () => {
    it("starts open with defaultOpen", async () => {
      render(<Basic root={{ defaultOpen: true }} />);
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("reports every change through onOpenChange", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic root={{ onOpenChange }} />);
      openByRightClick();
      await screen.findByRole("menu");
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    });

    it("follows open and leaves it to the caller to change", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Open it
            </button>
            <Basic root={{ open, onOpenChange: setOpen }} />
          </>
        );
      }
      render(<Controlled />);
      await user.click(screen.getByRole("button", { name: "Open it" }));
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("stays shut under a controlled open={false}", () => {
      const onOpenChange = vi.fn();
      render(<Basic root={{ open: false, onOpenChange }} />);
      openByRightClick();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("reports when it has finished opening and closing", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn();
      render(<Basic root={{ onOpenChangeComplete }} trigger={{ tabIndex: 0 }} />);
      area().focus();
      fireEvent.contextMenu(area());
      await screen.findByRole("menu");
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false));
    });
  });

  describe("items", () => {
    it("moves with the arrow keys, Home and End, and skips a disabled item", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <ContextMenu.Item>One</ContextMenu.Item>
          <ContextMenu.Item disabled>Two</ContextMenu.Item>
          <ContextMenu.Item>Three</ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "One" })).toHaveFocus());
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Three" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("menuitem", { name: "One" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("menuitem", { name: "Three" })).toHaveFocus();
    });

    it("jumps by typeahead", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("a");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus());
    });

    it("runs onSelect and closes the menu on a click", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <ContextMenu.Item onSelect={onSelect}>Edit</ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("chooses with Enter and with Space", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <ContextMenu.Item onSelect={onSelect}>Edit</ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{ArrowDown}{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("keeps the menu open when onSelect prevents the default", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <ContextMenu.Item onSelect={(event) => event.preventDefault()}>Edit</ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("shows an icon, description, trailing content and a shortcut hint", async () => {
      render(
        <Basic>
          <ContextMenu.Item description="Plan and invoices" trailing="New" shortcut="⌘B">
            Billing
          </ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      const item = await screen.findByRole("menuitem", { name: /Billing/ });
      expect(item).toHaveTextContent("Plan and invoices");
      expect(item).toHaveTextContent("New");
      expect(item.querySelector("kbd")).toHaveTextContent("⌘B");
    });

    it("keeps the menu open and busy while an action's promise is pending, then closes", async () => {
      const user = userEvent.setup();
      let finish: () => void = () => undefined;
      const pending = new Promise<void>((resolve) => {
        finish = resolve;
      });
      render(
        <Basic>
          <ContextMenu.Item onSelect={() => pending}>Export</ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("menuitem", { name: "Export" }));
      expect(screen.getByRole("menuitem", { name: "Export" })).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await act(async () => {
        finish();
        await pending;
      });
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("keeps a disabled item with a reason focusable and says why", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <ContextMenu.Item disabled disabledReason="Admins only">
            Delete
          </ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      const item = await screen.findByRole("menuitem", { name: "Delete" });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).not.toHaveAttribute("data-radix-collection-item", "disabled");
      await user.keyboard("{ArrowDown}");
      expect(item).toHaveFocus();
      expect(item).toHaveAccessibleDescription("Admins only");
    });

    it("flips a checkbox item and keeps the menu open", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Basic>
          <ContextMenu.CheckboxItem onCheckedChange={onCheckedChange}>Show grid</ContextMenu.CheckboxItem>
        </Basic>,
      );
      openByRightClick();
      const item = await screen.findByRole("menuitemcheckbox", { name: "Show grid" });
      expect(item).toHaveAttribute("aria-checked", "false");
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole("menuitemcheckbox", { name: "Show grid" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("chooses one radio item in a group", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Basic>
          <ContextMenu.RadioGroup defaultValue="name" onValueChange={onValueChange} aria-label="Sort by">
            <ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="date">Date</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </Basic>,
      );
      openByRightClick();
      expect(await screen.findByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "true");
      await user.click(screen.getByRole("menuitemradio", { name: "Date" }));
      expect(onValueChange).toHaveBeenCalledWith("date");
      expect(screen.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("group", { name: "Sort by" })).toBeInTheDocument();
    });

    it("names a group after its label", async () => {
      render(
        <Basic>
          <ContextMenu.Group>
            <ContextMenu.Label>Edit</ContextMenu.Label>
            <ContextMenu.Item>Copy</ContextMenu.Item>
          </ContextMenu.Group>
        </Basic>,
      );
      openByRightClick();
      expect(await screen.findByRole("group", { name: "Edit" })).toBeInTheDocument();
    });

    it("makes a link item with asChild", async () => {
      render(
        <Basic>
          <ContextMenu.Item asChild>
            <a href="/files">Open</a>
          </ContextMenu.Item>
        </Basic>,
      );
      openByRightClick();
      expect(await screen.findByRole("menuitem", { name: "Open" })).toHaveAttribute("href", "/files");
    });
  });

  describe("submenus", () => {
    it("opens a submenu with ArrowRight and closes it with ArrowLeft", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </Basic>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{ArrowDown}");
      const trigger = await screen.findByRole("menuitem", { name: "Share" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.keyboard("{ArrowRight}");
      expect(await screen.findByRole("menuitem", { name: "Email" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Share" })).toHaveAttribute("aria-expanded", "true");
      await user.keyboard("{ArrowLeft}");
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Email" })).not.toBeInTheDocument());
    });

    it("opens a submenu with ArrowLeft in right-to-left text", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ dir: "rtl" }}>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </Basic>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{ArrowDown}{ArrowLeft}");
      expect(await screen.findByRole("menuitem", { name: "Email" })).toBeInTheDocument();
    });
  });

  describe("parts forward what a consumer passes", () => {
    it("forwards refs, className, style, id and data-testid on the area and the panel", () => {
      const trigger = createRef<HTMLSpanElement>();
      const content = createRef<HTMLDivElement>();
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger ref={trigger} className="c-t" style={{ color: "red" }} id="i-t" data-testid="t">
            Area
          </ContextMenu.Trigger>
          <ContextMenu.Content ref={content} className="c-c" style={{ color: "red" }} id="i-c" data-testid="c">
            <ContextMenu.Item>Edit</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );
      expect(trigger.current).toBe(screen.getByTestId("t"));
      expect(content.current).toBe(screen.getByTestId("c"));
      for (const id of ["t", "c"]) {
        expect(screen.getByTestId(id)).toHaveClass(`c-${id}`);
        expect(screen.getByTestId(id)).toHaveStyle({ color: "rgb(255, 0, 0)" });
        expect(screen.getByTestId(id)).toHaveAttribute("id", `i-${id}`);
      }
    });

    it("puts the area's behaviour on its own child with asChild", () => {
      render(
        <ContextMenu>
          <ContextMenu.Trigger asChild>
            <li data-testid="row">File</li>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Edit</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );
      const row = screen.getByTestId("row");
      expect(row.tagName).toBe("LI");
      fireEvent.contextMenu(row);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("keeps its own role and aria attributes on the panel when a consumer passes the same names", () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content role="listbox" aria-orientation="horizontal" data-testid="content">
            <ContextMenu.Item role="option" data-testid="item">
              Edit
            </ContextMenu.Item>
            <ContextMenu.CheckboxItem role="option" checked aria-checked="false" data-testid="checkbox">
              Grid
            </ContextMenu.CheckboxItem>
            <ContextMenu.Separator role="presentation" data-testid="separator" />
          </ContextMenu.Content>
        </ContextMenu>,
      );
      expect(screen.getByTestId("content")).toHaveAttribute("role", "menu");
      expect(screen.getByTestId("content")).toHaveAttribute("aria-orientation", "vertical");
      expect(screen.getByTestId("item")).toHaveAttribute("role", "menuitem");
      expect(screen.getByTestId("checkbox")).toHaveAttribute("role", "menuitemcheckbox");
      expect(screen.getByTestId("checkbox")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByTestId("separator")).toHaveAttribute("role", "separator");
    });

    it("names the panel with aria-label", async () => {
      render(<Basic content={{ "aria-label": "File actions" }} />);
      openByRightClick();
      expect(await screen.findByRole("menu", { name: "File actions" })).toBeInTheDocument();
    });

    it("sets the row size for every item", async () => {
      render(<Basic content={{ size: "lg" }} />);
      openByRightClick();
      const menu = await screen.findByRole("menu");
      expect(menu.className).toMatch(/sizeLg/);
    });
  });

  describe("inside other overlays", () => {
    it("opens from inside a Dialog and choosing an item leaves the dialog open", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Files">
            <Dialog.Body>
              <ContextMenu>
                <ContextMenu.Trigger data-testid="area">Right-click me</ContextMenu.Trigger>
                <ContextMenu.Content>
                  <ContextMenu.Item onSelect={onSelect}>Edit</ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog", { name: "Files" })).toBeInTheDocument();
    });

    it("closes the menu and not the dialog on one Escape", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Files">
            <Dialog.Body>
              <Basic />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("returns focus to the area when a dialog an item opened closes", async () => {
      const user = userEvent.setup();
      function Flow() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <ContextMenu>
              <ContextMenu.Trigger data-testid="area" tabIndex={0}>
                Right-click me
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item onSelect={() => setOpen(true)}>Delete</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu>
            <Dialog open={open} onOpenChange={setOpen}>
              <Dialog.Content aria-label="Confirm">
                <Dialog.Body>Sure?</Dialog.Body>
              </Dialog.Content>
            </Dialog>
          </>
        );
      }
      render(<Flow />);
      area().focus();
      fireEvent.contextMenu(area());
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      await screen.findByRole("dialog", { name: "Confirm" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(area()).toHaveFocus());
    });
  });

  describe("together with a Menu", () => {
    it("a row can hold both a context menu and a Menu of its own", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenu.Trigger asChild>
            <div data-testid="row">
              <Menu>
                <Menu.Trigger>More</Menu.Trigger>
                <Menu.Content>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.CheckboxItem>Pinned</Menu.CheckboxItem>
                </Menu.Content>
              </Menu>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );
      await user.click(screen.getByRole("button", { name: "More" }));
      expect(await screen.findByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Pinned" })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      fireEvent.contextMenu(screen.getByTestId("row"));
      expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    });

    it("a Menu can be opened from inside the panel", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <Menu>
            <Menu.Trigger>Inner</Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Inside</Menu.Item>
            </Menu.Content>
          </Menu>
        </Basic>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("button", { name: "Inner", hidden: true }));
      expect(await screen.findByRole("menuitem", { name: "Inside" })).toBeInTheDocument();
    });
  });

  describe("as a sheet", () => {
    it("is drawn as a sheet with a scrim, wherever the press was", async () => {
      render(<Basic root={{ presentation: "sheet" }} />);
      openByRightClick();
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("data-presentation", "sheet");
      expect(document.querySelector("[data-menu-scrim]")).not.toBeNull();
    });

    it("is a floating menu by default, with no scrim", async () => {
      render(<Basic />);
      openByRightClick();
      expect(await screen.findByRole("menu")).not.toHaveAttribute("data-presentation");
      expect(document.querySelector("[data-menu-scrim]")).toBeNull();
    });

    it("opens a submenu over the menu with a Back row, which returns to it, in the label it is given", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ presentation: "sheet", labels: { back: "Zurück" } }}>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </Basic>,
      );
      openByRightClick();
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      const sub = (await screen.findAllByRole("menu"))[1] as HTMLElement;
      expect(within(sub).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Zurück", "Email"]);
      await user.click(within(sub).getByRole("menuitem", { name: "Zurück" }));
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Email" })).not.toBeInTheDocument());
    });

    it("opens from code as a sheet too", async () => {
      const controllerRef = createRef<ContextMenuController>();
      render(<Basic root={{ presentation: "sheet", controllerRef }} />);
      act(() => {
        controllerRef.current?.openAt({ x: 5, y: 5 });
      });
      expect(await screen.findByRole("menu")).toHaveAttribute("data-presentation", "sheet");
    });
  });

  describe("StrictMode", () => {
    it("opens, moves and chooses under StrictMode", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <StrictMode>
          <Basic>
            <ContextMenu.Item onSelect={onSelect}>Edit</ContextMenu.Item>
          </Basic>
        </StrictMode>,
      );
      openByRightClick();
      await screen.findByRole("menu");
      await user.keyboard("{ArrowDown}{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has no axe violations closed", async () => {
      const { container } = render(<Basic trigger={{ tabIndex: 0, "aria-label": "Files" }} />);
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no axe violations open, with every kind of part", async () => {
      render(
        <Basic root={{ defaultOpen: true }} content={{ "aria-label": "File actions" }}>
          <ContextMenu.Group>
            <ContextMenu.Label>Edit</ContextMenu.Label>
            <ContextMenu.Item shortcut="⌘C" description="Copies the file">
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item disabled disabledReason="Admins only">
              Delete
            </ContextMenu.Item>
          </ContextMenu.Group>
          <ContextMenu.Separator />
          <ContextMenu.CheckboxItem defaultChecked>Show grid</ContextMenu.CheckboxItem>
          <ContextMenu.RadioGroup defaultValue="a" aria-label="Sort by">
            <ContextMenu.RadioItem value="a">Name</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Inside</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </Basic>,
      );
      await screen.findByRole("menu");
      expect((await axe(document.body, noRegion)).violations).toHaveLength(0);
    });
  });
});
