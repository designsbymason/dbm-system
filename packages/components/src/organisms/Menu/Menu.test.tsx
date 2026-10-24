import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyIcon } from "@dbm-system/icons";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { Dialog } from "../Dialog";
import { Menu } from "./Menu";
import styles from "./Menu.module.css";

function Basic({
  root,
  content,
  children,
}: {
  root?: Omit<React.ComponentProps<typeof Menu>, "children">;
  content?: Omit<React.ComponentProps<typeof Menu.Content>, "children">;
  children?: React.ReactNode;
}) {
  return (
    <Menu {...root}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content {...content}>
        {children ?? (
          <>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
            <Menu.Item>Archive</Menu.Item>
          </>
        )}
      </Menu.Content>
    </Menu>
  );
}

// `hidden`: while a modal menu is open Radix hides everything outside it from assistive technology, the trigger too.
// A menu is portaled to the body, outside any landmark of the test page, which is what `region` flags.
const noRegion = { rules: { region: { enabled: false } } };

const trigger = () => screen.getByRole("button", { name: "Actions", hidden: true });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Menu", () => {
  describe("opening and closing", () => {
    it("renders only the trigger while closed", () => {
      render(<Basic />);
      expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("opens on a click as a menu named after its trigger", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(trigger());
      const menu = await screen.findByRole("menu", { name: "Actions" });
      expect(menu).toHaveAttribute("data-state", "open");
      expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });

    it.each([["{Enter}"], [" "], ["{ArrowDown}"]])("opens from the keyboard with %j", async (key) => {
      const user = userEvent.setup();
      render(<Basic />);
      trigger().focus();
      await user.keyboard(key);
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("puts focus on the first item for ArrowDown and the last for ArrowUp", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      trigger().focus();
      await user.keyboard("{ArrowUp}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus());
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(trigger());
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(trigger()).toHaveFocus();
    });

    it("starts open with defaultOpen", () => {
      render(<Basic root={{ defaultOpen: true }} />);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("reports changes from an uncontrolled menu", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic root={{ onOpenChange }} />);
      await user.click(trigger());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it("leaves a controlled open state alone until the prop changes", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic root={{ open: true, onOpenChange }} />);
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("works wired to state, the usual controlled shape", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [open, setOpen] = useState(false);
        return (
          <Basic root={{ open, onOpenChange: setOpen }}>
            <Menu.Item>Edit</Menu.Item>
          </Basic>
        );
      }
      render(<Wired />);
      await user.click(trigger());
      await screen.findByRole("menu");
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("does not open from a disabled trigger", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <Menu.Trigger disabled>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
          </Menu.Content>
        </Menu>,
      );
      await user.click(trigger());
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("composes with Button through asChild", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
          </Menu.Content>
        </Menu>,
      );
      await user.click(trigger());
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    });
  });

  describe("items", () => {
    it("runs onSelect and closes the menu", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <Menu.Item onSelect={onSelect}>Edit</Menu.Item>
        </Basic>,
      );
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("keeps the menu open when onSelect calls preventDefault", async () => {
      const user = userEvent.setup();
      render(
        <Basic>
          <Menu.Item onSelect={(event) => event.preventDefault()}>Edit</Menu.Item>
        </Basic>,
      );
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("chooses the focused item with Enter and with Space", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <Menu.Item onSelect={onSelect}>Edit</Menu.Item>
        </Basic>,
      );
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("skips a disabled item with the arrow keys and never selects it", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item disabled onSelect={onSelect}>
            Duplicate
          </Menu.Item>
          <Menu.Item>Archive</Menu.Item>
        </Basic>,
      );
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
      const disabled = screen.getByRole("menuitem", { name: "Duplicate" });
      expect(disabled).toHaveAttribute("aria-disabled", "true");
      expect(disabled).toHaveAttribute("data-disabled");
      await user.click(disabled);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("moves to the item that starts with the typed letters", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("ar");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus());
    });

    it("marks the panel with the last kind of input, and still calls the consumer's handlers", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      const onPointerMove = vi.fn();
      render(<Basic root={{ defaultOpen: true }} content={{ onKeyDown, onPointerMove }} />);
      const menu = screen.getByRole("menu");
      expect(menu).not.toHaveAttribute("data-input");
      await user.hover(screen.getByRole("menuitem", { name: "Edit" }));
      expect(menu).toHaveAttribute("data-input", "pointer");
      expect(onPointerMove).toHaveBeenCalled();
      await user.keyboard("{ArrowDown}");
      expect(menu).toHaveAttribute("data-input", "keyboard");
      expect(onKeyDown).toHaveBeenCalled();
    });

    it("keeps focus in the menu on Tab", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{Tab}");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    });

    it("moves with Home and End, and wraps only with loop", async () => {
      const user = userEvent.setup();
      render(<Basic content={{ loop: true }} />);
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{End}");
      expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    });

    it("draws an icon and a shortcut hint, the hint as a kbd", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item icon={CopyIcon} shortcut="⌘D">
            Duplicate
          </Menu.Item>
        </Basic>,
      );
      const item = screen.getByRole("menuitem");
      expect(item.querySelector("svg")).toBeInTheDocument();
      expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(item.querySelector("kbd")).toHaveTextContent("⌘D");
      expect(item).toHaveTextContent("Duplicate");
    });

    it("styles a danger item differently", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item tone="danger">Delete</Menu.Item>
          <Menu.Item>Edit</Menu.Item>
        </Basic>,
      );
      expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass(styles.danger as string);
      expect(screen.getByRole("menuitem", { name: "Edit" })).not.toHaveClass(styles.danger as string);
    });

    it("makes a link an item through asChild", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item asChild>
            <a href="#docs">Docs</a>
          </Menu.Item>
        </Basic>,
      );
      const link = screen.getByRole("menuitem", { name: "Docs" });
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "#docs");
      expect(link).toHaveClass(styles.item as string);
      await user.click(link);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("warns that icon and shortcut are not drawn in asChild mode", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item asChild icon={CopyIcon}>
            <a href="#docs">Docs</a>
          </Menu.Item>
        </Basic>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("have no effect when `asChild` is set"));
      expect(screen.getByRole("menuitem").querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("checkbox items", () => {
    it("toggles its own state when uncontrolled and reports it", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Basic>
          <Menu.CheckboxItem defaultChecked onCheckedChange={onCheckedChange} onSelect={(event) => event.preventDefault()}>
            Show grid
          </Menu.CheckboxItem>
        </Basic>,
      );
      await user.click(trigger());
      const item = await screen.findByRole("menuitemcheckbox", { name: "Show grid" });
      expect(item).toHaveAttribute("aria-checked", "true");
      expect(item).toHaveAttribute("data-state", "checked");
      await user.click(item);
      expect(onCheckedChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "false");
    });

    it("leaves a controlled value alone until the prop changes", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Basic>
          <Menu.CheckboxItem checked={false} onCheckedChange={onCheckedChange} onSelect={(event) => event.preventDefault()}>
            Show grid
          </Menu.CheckboxItem>
        </Basic>,
      );
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitemcheckbox"));
      expect(onCheckedChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "false");
    });

    it("announces a mixed state", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.CheckboxItem checked="indeterminate">Some columns</Menu.CheckboxItem>
        </Basic>,
      );
      expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "mixed");
      expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("data-state", "indeterminate");
    });

    it("reports a mixed item chosen as checked", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.CheckboxItem checked="indeterminate" onCheckedChange={onCheckedChange}>
            Some columns
          </Menu.CheckboxItem>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitemcheckbox"));
      expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    });
  });

  describe("radio groups", () => {
    it("keeps its own value when uncontrolled and reports changes", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Basic>
          <Menu.RadioGroup defaultValue="name" onValueChange={onValueChange} aria-label="Sort by">
            <Menu.RadioItem value="name" onSelect={(event) => event.preventDefault()}>
              Name
            </Menu.RadioItem>
            <Menu.RadioItem value="date" onSelect={(event) => event.preventDefault()}>
              Date
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Basic>,
      );
      await user.click(trigger());
      expect(await screen.findByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "true");
      await user.click(screen.getByRole("menuitemradio", { name: "Date" }));
      expect(onValueChange).toHaveBeenLastCalledWith("date");
      expect(screen.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "false");
    });

    it("leaves a controlled value alone until the prop changes", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.RadioGroup value="name" onValueChange={onValueChange} aria-label="Sort by">
            <Menu.RadioItem value="name">Name</Menu.RadioItem>
            <Menu.RadioItem value="date" onSelect={(event) => event.preventDefault()}>
              Date
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitemradio", { name: "Date" }));
      expect(onValueChange).toHaveBeenLastCalledWith("date");
      expect(screen.getByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("closeOnSelect", () => {
    it("keeps a checkbox and a radio item open by default, and closes them with closeOnSelect", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.CheckboxItem>Show grid</Menu.CheckboxItem>
          <Menu.CheckboxItem closeOnSelect>Show rulers</Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="a" aria-label="Sort by">
            <Menu.RadioItem value="a">Name</Menu.RadioItem>
            <Menu.RadioItem value="b">Date</Menu.RadioItem>
          </Menu.RadioGroup>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Show grid" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Show grid" })).toHaveAttribute("aria-checked", "true");
      await user.click(screen.getByRole("menuitemradio", { name: "Date" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Show rulers" }));
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("keeps an action open with closeOnSelect={false}, and still reports the choice", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item closeOnSelect={false} onSelect={onSelect}>
            Refresh
          </Menu.Item>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitem", { name: "Refresh" }));
      await user.click(screen.getByRole("menuitem", { name: "Refresh" }));
      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  });

  describe("an action that takes time", () => {
    it("is busy while its promise is pending, ignores presses, and closes the menu when it resolves", async () => {
      const user = userEvent.setup();
      let finish!: () => void;
      const onSelect = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item onSelect={onSelect}>Export</Menu.Item>
        </Basic>,
      );
      const item = screen.getByRole("menuitem", { name: "Export" });
      await user.click(item);
      expect(item).toHaveAttribute("aria-busy", "true");
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await user.click(item);
      expect(onSelect).toHaveBeenCalledTimes(1);
      finish();
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("stays open and stops being busy when the promise rejects, handing the error over", async () => {
      const user = userEvent.setup();
      const error = new Error("no connection");
      const onSelectError = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item onSelect={() => Promise.reject(error)} onSelectError={onSelectError}>
            Export
          </Menu.Item>
        </Basic>,
      );
      const item = screen.getByRole("menuitem", { name: "Export" });
      await user.click(item);
      await waitFor(() => expect(onSelectError).toHaveBeenCalledWith(error));
      expect(item).not.toHaveAttribute("aria-busy");
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("stays open after resolving when the handler prevented the close", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item
            onSelect={(event) => {
              event.preventDefault();
              return Promise.resolve();
            }}
          >
            Sync now
          </Menu.Item>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitem", { name: "Sync now" }));
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Sync now" })).not.toHaveAttribute("aria-busy"));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  });

  describe("a disabled item with a reason", () => {
    it("stays focusable, is described by its reason and can't be chosen", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item disabled disabledReason="You need the admin role" onSelect={onSelect}>
            Delete
          </Menu.Item>
        </Basic>,
      );
      const item = screen.getByRole("menuitem", { name: "Delete" });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).toHaveAccessibleDescription("You need the admin role");
      screen.getByRole("menuitem", { name: "Edit" }).focus();
      await user.keyboard("{ArrowDown}");
      expect(item).toHaveFocus();
      await user.keyboard("{Enter}");
      await user.click(item);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("is still skipped without a reason", async () => {
      const user = userEvent.setup();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item disabled>Delete</Menu.Item>
          <Menu.Item>Archive</Menu.Item>
        </Basic>,
      );
      screen.getByRole("menuitem", { name: "Edit" }).focus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
    });

    it("does not flip a disabled checkbox item that has a reason", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.CheckboxItem disabled disabledReason="Locked by an admin" onCheckedChange={onCheckedChange}>
            Show grid
          </Menu.CheckboxItem>
        </Basic>,
      );
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Show grid" }));
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("a reason in the wrong place", () => {
    it("does not point aria-describedby at a hidden reason an asChild item never draws", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item asChild disabled disabledReason="Admins only">
            <a href="#delete">Delete</a>
          </Menu.Item>
        </Basic>,
      );
      const link = screen.getByRole("menuitem", { name: "Delete" });
      expect(link).not.toHaveAttribute("aria-describedby");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("not announced as the item's description"));
    });

    it("warns, once per item, that a reason without disabled does nothing", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item disabledReason="Admins only">Delete</Menu.Item>
        </Basic>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`disabledReason` has no effect on an item that is not `disabled`"));
      expect(screen.getByRole("menuitem", { name: "Delete" })).not.toHaveAttribute("aria-disabled");
    });

    it("passes aria-keyshortcuts through to the item", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item shortcut="⌘E" aria-keyshortcuts="Meta+E">
            Edit
          </Menu.Item>
        </Basic>,
      );
      expect(screen.getByRole("menuitem", { name: /Edit/ })).toHaveAttribute("aria-keyshortcuts", "Meta+E");
    });
  });

  describe("a description and trailing content", () => {
    it("draws a second line that describes the item without becoming its name", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item description="Plan and invoices" trailing={<span data-testid="badge">New</span>}>
            Billing
          </Menu.Item>
        </Basic>,
      );
      // the trailing content is part of the name; the description line is not
      const item = screen.getByRole("menuitem", { name: "Billing New" });
      expect(item).toHaveAccessibleDescription("Plan and invoices");
      expect(item).toHaveTextContent("Plan and invoices");
      expect(within(item).getByTestId("badge")).toBeInTheDocument();
    });

    it("works on a checkbox and a radio item, and keeps the consumer's aria-describedby", () => {
      render(
        <>
          <span id="extra">Extra note</span>
          <Basic root={{ defaultOpen: true }}>
            <Menu.CheckboxItem description="Shows guides" aria-describedby="extra">
              Grid
            </Menu.CheckboxItem>
            <Menu.RadioGroup value="a" aria-label="Mode">
              <Menu.RadioItem value="a" description="The default view">
                Standard
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Basic>
        </>,
      );
      expect(screen.getByRole("menuitemcheckbox", { name: "Grid" })).toHaveAccessibleDescription("Extra note Shows guides");
      expect(screen.getByRole("menuitemradio", { name: "Standard" })).toHaveAccessibleDescription("The default view");
    });
  });

  describe("after the menu has closed", () => {
    it("reports open and close completion, with focus already on the trigger", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn((open: boolean) => (open ? undefined : document.activeElement));
      render(<Basic root={{ onOpenChangeComplete }} />);
      await user.click(trigger());
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(false));
      const closed = onOpenChangeComplete.mock.results[onOpenChangeComplete.mock.results.length - 1]?.value;
      expect(closed).toBe(trigger());
    });
  });

  describe("labels and groups", () => {
    it("names a group after the label inside it", async () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Group>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item>Profile</Menu.Item>
          </Menu.Group>
        </Basic>,
      );
      await waitFor(() => expect(screen.getByRole("group", { name: "Account" })).toBeInTheDocument());
    });

    it("names a radio group after its label too", async () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.RadioGroup value="a">
            <Menu.Label>Sort by</Menu.Label>
            <Menu.RadioItem value="a">Name</Menu.RadioItem>
          </Menu.RadioGroup>
        </Basic>,
      );
      await waitFor(() => expect(screen.getByRole("group", { name: "Sort by" })).toBeInTheDocument());
    });

    it("lets an explicit aria-labelledby on the group win", async () => {
      render(
        <>
          <span id="outside">Outside name</span>
          <Basic root={{ defaultOpen: true }}>
            <Menu.Group aria-labelledby="outside">
              <Menu.Label>Account</Menu.Label>
              <Menu.Item>Profile</Menu.Item>
            </Menu.Group>
          </Basic>
        </>,
      );
      await waitFor(() => expect(screen.getByRole("group", { name: "Outside name" })).toBeInTheDocument());
    });

    it("leaves a group with no label unnamed, without a dangling reference", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Group>
            <Menu.Item>Profile</Menu.Item>
          </Menu.Group>
        </Basic>,
      );
      expect(screen.getByRole("group")).not.toHaveAttribute("aria-labelledby");
    });

    it("draws a separator", () => {
      render(
        <Basic root={{ defaultOpen: true }}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Delete</Menu.Item>
        </Basic>,
      );
      expect(screen.getByRole("separator")).toBeInTheDocument();
    });
  });

  describe("submenus", () => {
    function WithSub({ dir }: { dir?: "ltr" | "rtl" }) {
      return (
        <Menu dir={dir}>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Sub>
              <Menu.SubTrigger>Share</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Email</Menu.Item>
                <Menu.Sub>
                  <Menu.SubTrigger>Social</Menu.SubTrigger>
                  <Menu.SubContent>
                    <Menu.Item>Post</Menu.Item>
                  </Menu.SubContent>
                </Menu.Sub>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>
      );
    }

    it("opens with ArrowRight and closes with ArrowLeft", async () => {
      const user = userEvent.setup();
      render(<WithSub />);
      trigger().focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      const subTrigger = screen.getByRole("menuitem", { name: "Share" });
      await waitFor(() => expect(subTrigger).toHaveFocus());
      expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
      expect(subTrigger).toHaveAttribute("aria-expanded", "false");
      await user.keyboard("{ArrowRight}");
      expect(await screen.findByRole("menuitem", { name: "Email" })).toBeInTheDocument();
      expect(subTrigger).toHaveAttribute("aria-expanded", "true");
      await user.keyboard("{ArrowLeft}");
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Email" })).not.toBeInTheDocument());
      expect(subTrigger).toHaveFocus();
    });

    it("swaps the keys in right-to-left", async () => {
      const user = userEvent.setup();
      render(<WithSub dir="rtl" />);
      trigger().focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus());
      await user.keyboard("{ArrowRight}");
      expect(screen.queryByRole("menuitem", { name: "Email" })).not.toBeInTheDocument();
      await user.keyboard("{ArrowLeft}");
      expect(await screen.findByRole("menuitem", { name: "Email" })).toBeInTheDocument();
    });

    it("nests a submenu inside a submenu", async () => {
      const user = userEvent.setup();
      render(<WithSub />);
      trigger().focus();
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
      await screen.findByRole("menuitem", { name: "Email" });
      await user.keyboard("{ArrowDown}{ArrowRight}");
      expect(await screen.findByRole("menuitem", { name: "Post" })).toBeInTheDocument();
      expect(screen.getAllByRole("menu")).toHaveLength(3);
    });

    it("closes everything when a submenu item is chosen", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Menu defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Sub open>
              <Menu.SubTrigger>Share</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item onSelect={onSelect}>Email</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      await user.click(await screen.findByRole("menuitem", { name: "Email" }));
      expect(onSelect).toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });
  });

  describe("size and position", () => {
    it("defaults to md and takes any step", () => {
      const { unmount } = render(<Basic root={{ defaultOpen: true }} />);
      expect(screen.getByRole("menu")).toHaveClass(styles.sizeMd as string);
      unmount();
      render(<Basic root={{ defaultOpen: true }} content={{ size: "xl" }} />);
      expect(screen.getByRole("menu")).toHaveClass(styles.sizeXl as string);
    });

    it("gives a submenu its parent's size unless it sets its own", () => {
      render(
        <Menu defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content size="lg">
            <Menu.Sub open>
              <Menu.SubTrigger>Share</Menu.SubTrigger>
              <Menu.SubContent data-testid="inherits">
                <Menu.Item>Email</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
            <Menu.Sub open>
              <Menu.SubTrigger>Move</Menu.SubTrigger>
              <Menu.SubContent size="xs" data-testid="own">
                <Menu.Item>Inbox</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      expect(screen.getByTestId("inherits")).toHaveClass(styles.sizeLg as string);
      expect(screen.getByTestId("own")).toHaveClass(styles.sizeXs as string);
    });

    it("opens on the side asked for, and resolves a responsive map", () => {
      const { unmount } = render(<Basic root={{ defaultOpen: true }} content={{ side: "top" }} />);
      expect(screen.getByRole("menu")).toHaveAttribute("data-side", "top");
      unmount();
      render(<Basic root={{ defaultOpen: true }} content={{ side: { base: "left", lg: "right" } }} />);
      expect(screen.getByRole("menu")).toHaveAttribute("data-side", "left");
    });

    it("is modal by default, making the page inert, and not when modal is false", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Basic />);
      await user.click(trigger());
      await screen.findByRole("menu");
      expect(document.body.style.pointerEvents).toBe("none");
      unmount();
      await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
      render(<Basic root={{ modal: false }} />);
      await user.click(trigger());
      await screen.findByRole("menu");
      expect(document.body.style.pointerEvents).not.toBe("none");
    });
  });

  describe("parts forward what a consumer passes", () => {
    it("forwards refs, className, style, id and data-testid on every part", () => {
      const refs = {
        trigger: createRef<HTMLButtonElement>(),
        content: createRef<HTMLDivElement>(),
        item: createRef<HTMLDivElement>(),
        checkbox: createRef<HTMLDivElement>(),
        radio: createRef<HTMLDivElement>(),
        radioGroup: createRef<HTMLDivElement>(),
        label: createRef<HTMLDivElement>(),
        group: createRef<HTMLDivElement>(),
        separator: createRef<HTMLDivElement>(),
        subTrigger: createRef<HTMLDivElement>(),
        subContent: createRef<HTMLDivElement>(),
      };
      const shared = (name: string) => ({ className: `custom-${name}`, style: { color: "red" }, id: `id-${name}`, "data-testid": `t-${name}` });
      render(
        <Menu defaultOpen>
          <Menu.Trigger ref={refs.trigger} {...shared("trigger")}>
            Actions
          </Menu.Trigger>
          <Menu.Content ref={refs.content} {...shared("content")}>
            <Menu.Item ref={refs.item} {...shared("item")}>
              Edit
            </Menu.Item>
            <Menu.CheckboxItem ref={refs.checkbox} {...shared("checkbox")}>
              Grid
            </Menu.CheckboxItem>
            <Menu.RadioGroup ref={refs.radioGroup} {...shared("radioGroup")} value="a">
              <Menu.RadioItem ref={refs.radio} value="a" {...shared("radio")}>
                A
              </Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.Group ref={refs.group} {...shared("group")}>
              <Menu.Label ref={refs.label} {...shared("label")}>
                Heading
              </Menu.Label>
            </Menu.Group>
            <Menu.Separator ref={refs.separator} {...shared("separator")} />
            <Menu.Sub open>
              <Menu.SubTrigger ref={refs.subTrigger} {...shared("subTrigger")}>
                More
              </Menu.SubTrigger>
              <Menu.SubContent ref={refs.subContent} {...shared("subContent")}>
                <Menu.Item>Inside</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      for (const [name, ref] of Object.entries(refs)) {
        const element = screen.getByTestId(`t-${name}`);
        expect(ref.current, name).toBe(element);
        expect(element, name).toHaveClass(`custom-${name}`);
        expect(element, name).toHaveStyle({ color: "rgb(255, 0, 0)" });
        // a label's id is the one a group points at, and a custom one replaces the generated id
        expect(element, name).toHaveAttribute("id", `id-${name}`);
      }
    });

    it("keeps its own role and aria attributes when a consumer passes the same names", () => {
      render(
        <Menu defaultOpen>
          <Menu.Trigger role="tab" aria-haspopup="dialog" aria-expanded={false} data-testid="trigger">
            Actions
          </Menu.Trigger>
          <Menu.Content role="listbox" aria-orientation="horizontal" data-testid="content">
            <Menu.Item role="option" aria-disabled={false} disabled data-testid="item">
              Edit
            </Menu.Item>
            <Menu.CheckboxItem role="option" checked aria-checked="false" data-testid="checkbox">
              Grid
            </Menu.CheckboxItem>
            <Menu.RadioGroup role="list" value="a" data-testid="radioGroup">
              <Menu.RadioItem value="a" role="option" aria-checked="false" data-testid="radio">
                A
              </Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.Group role="list" data-testid="group">
              <Menu.Item>Inside</Menu.Item>
            </Menu.Group>
            <Menu.Separator role="presentation" data-testid="separator" />
            <Menu.Sub open>
              <Menu.SubTrigger role="button" aria-haspopup="dialog" aria-expanded data-testid="subTrigger">
                More
              </Menu.SubTrigger>
              <Menu.SubContent role="listbox" aria-orientation="horizontal" data-testid="subContent">
                <Menu.Item>Inside</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      expect(screen.getByTestId("trigger")).toHaveAttribute("aria-haspopup", "menu");
      expect(screen.getByTestId("trigger")).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("content")).toHaveAttribute("role", "menu");
      expect(screen.getByTestId("content")).toHaveAttribute("aria-orientation", "vertical");
      expect(screen.getByTestId("item")).toHaveAttribute("role", "menuitem");
      expect(screen.getByTestId("item")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByTestId("checkbox")).toHaveAttribute("role", "menuitemcheckbox");
      expect(screen.getByTestId("checkbox")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByTestId("radioGroup")).toHaveAttribute("role", "group");
      expect(screen.getByTestId("radio")).toHaveAttribute("role", "menuitemradio");
      expect(screen.getByTestId("radio")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByTestId("group")).toHaveAttribute("role", "group");
      expect(screen.getByTestId("subTrigger")).toHaveAttribute("role", "menuitem");
      expect(screen.getByTestId("subTrigger")).toHaveAttribute("aria-haspopup", "menu");
      expect(screen.getByTestId("subTrigger")).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("subContent")).toHaveAttribute("role", "menu");
      expect(screen.getByTestId("subContent")).toHaveAttribute("aria-orientation", "vertical");
      expect(screen.getByTestId("separator")).toHaveAttribute("role", "separator");
      expect(screen.getByTestId("separator")).toHaveAttribute("aria-orientation", "horizontal");
    });
  });

  describe("inside other overlays", () => {
    it("returns focus to the trigger when a dialog an item opened closes, with nothing more asked of the caller", async () => {
      const user = userEvent.setup();
      function Flow() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <Menu>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Content>
                <Menu.Item onSelect={() => setOpen(true)}>Delete</Menu.Item>
              </Menu.Content>
            </Menu>
            <Dialog open={open} onOpenChange={setOpen}>
              <Dialog.Content aria-label="Confirm">
                <Dialog.Body>Sure?</Dialog.Body>
              </Dialog.Content>
            </Dialog>
          </>
        );
      }
      render(<Flow />);
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      await screen.findByRole("dialog", { name: "Confirm" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it("opens from inside a Dialog and choosing an item leaves the dialog open", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Settings">
            <Dialog.Body>
              <Menu>
                <Menu.Trigger>Actions</Menu.Trigger>
                <Menu.Content>
                  <Menu.Item onSelect={onSelect}>Edit</Menu.Item>
                </Menu.Content>
              </Menu>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    });

    it("closes the menu and not the dialog on one Escape", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Settings">
            <Dialog.Body>
              <Menu>
                <Menu.Trigger>Actions</Menu.Trigger>
                <Menu.Content>
                  <Menu.Item>Edit</Menu.Item>
                </Menu.Content>
              </Menu>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(trigger());
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("as a sheet", () => {
    const sheetTree = (root: Omit<React.ComponentProps<typeof Menu>, "children"> = {}) => (
      <Menu presentation="sheet" {...root}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Sub>
            <Menu.SubTrigger>Share</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Email</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    );

    it("marks the panel as a sheet and dims the page behind it", async () => {
      const user = userEvent.setup();
      render(sheetTree());
      await user.click(trigger());
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("data-presentation", "sheet");
      expect(menu.className).toMatch(/sheet/);
      expect(document.querySelector("[data-menu-scrim]")).not.toBeNull();
    });

    it("draws the floating menu by default, with no scrim", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(trigger());
      const menu = await screen.findByRole("menu");
      expect(menu).not.toHaveAttribute("data-presentation");
      expect(document.querySelector("[data-menu-scrim]")).toBeNull();
    });

    it("keeps its keys: arrows move, Enter chooses, Escape closes", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Menu presentation="sheet">
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={onSelect}>Edit</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
          </Menu.Content>
        </Menu>,
      );
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
      await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("opens a submenu over the menu with a Back row first, and Back returns to the menu", async () => {
      const user = userEvent.setup();
      render(sheetTree());
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      const menus = await screen.findAllByRole("menu");
      const sub = menus[1] as HTMLElement;
      expect(sub).toHaveAttribute("data-presentation", "sheet");
      const items = within(sub).getAllByRole("menuitem");
      expect(items.map((item) => item.textContent)).toEqual(["Back", "Email"]);
      await user.click(within(sub).getByRole("menuitem", { name: "Back" }));
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Email" })).not.toBeInTheDocument());
      expect(screen.getByRole("menuitem", { name: "Share" })).toHaveAttribute("aria-expanded", "false");
      // Back steps out of the submenu; it doesn't close the menu the way choosing an item does
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("takes the menu under a sheet's submenu out of reach while it is open, and gives it back", async () => {
      const user = userEvent.setup();
      render(sheetTree());
      await user.click(trigger());
      const menu = await screen.findByRole("menu");
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      const sub = (await screen.findAllByRole("menu"))[1] as HTMLElement;
      await waitFor(() => expect(menu).toHaveAttribute("inert"));
      expect(sub).not.toHaveAttribute("inert");
      // focus was moved into the submenu before the menu was made inert
      await waitFor(() => expect(sub.contains(document.activeElement)).toBe(true));
      await user.click(within(sub).getByRole("menuitem", { name: "Back" }));
      // (focus returning to the trigger is asserted in a real browser, which moves it the way a person's input does)
      await waitFor(() => expect(menu).not.toHaveAttribute("inert"));
    });

    it("leaves a floating menu's parent alone while its submenu is open", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Sub>
              <Menu.SubTrigger>Share</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Email</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      await user.click(trigger());
      const menu = await screen.findByRole("menu");
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      await screen.findByRole("menuitem", { name: "Email" });
      expect(menu).not.toHaveAttribute("inert");
    });

    it("takes the Back row's text from labels", async () => {
      const user = userEvent.setup();
      render(sheetTree({ labels: { back: "Zurück" } }));
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      expect(await screen.findByRole("menuitem", { name: "Zurück" })).toBeInTheDocument();
    });

    it("keeps its default Back text when a label is passed as undefined", async () => {
      const user = userEvent.setup();
      render(sheetTree({ labels: { back: undefined } }));
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      expect(await screen.findByRole("menuitem", { name: "Back" })).toBeInTheDocument();
    });

    it("draws no Back row in a floating menu's submenu", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Sub>
              <Menu.SubTrigger>Share</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Email</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      await user.click(trigger());
      await user.click(await screen.findByRole("menuitem", { name: "Share" }));
      await screen.findByRole("menuitem", { name: "Email" });
      expect(screen.queryByRole("menuitem", { name: "Back" })).not.toBeInTheDocument();
    });

    it("is a sheet below the width a responsive map names and a menu from it up", async () => {
      const user = userEvent.setup();
      const matchMedia = vi.fn((query: string) => ({
        matches: query === "(min-width: 768px)",
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        onchange: null,
        dispatchEvent: () => false,
      }));
      vi.stubGlobal("matchMedia", matchMedia);
      try {
        const { unmount } = render(sheetTree({ presentation: { base: "sheet", md: "menu" } }));
        await user.click(trigger());
        expect(await screen.findByRole("menu")).not.toHaveAttribute("data-presentation");
        unmount();
        matchMedia.mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          onchange: null,
          dispatchEvent: () => false,
        }));
        render(sheetTree({ presentation: { base: "sheet", md: "menu" } }));
        await user.click(trigger());
        expect(await screen.findByRole("menu")).toHaveAttribute("data-presentation", "sheet");
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("has no axe violations open as a sheet", async () => {
      const user = userEvent.setup();
      render(sheetTree());
      await user.click(trigger());
      await screen.findByRole("menu");
      expect((await axe(document.body, noRegion)).violations).toHaveLength(0);
    });
  });

  describe("StrictMode", () => {
    it("opens, moves and chooses under StrictMode", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <StrictMode>
          <Basic>
            <Menu.Item onSelect={onSelect}>Edit</Menu.Item>
            <Menu.Group>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item>Profile</Menu.Item>
            </Menu.Group>
          </Basic>
        </StrictMode>,
      );
      await user.click(trigger());
      await waitFor(() => expect(screen.getByRole("group", { name: "Account" })).toBeInTheDocument());
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has no axe violations closed", async () => {
      const { container } = render(<Basic />);
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no axe violations open, with every kind of part", async () => {
      render(
        <Menu defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Group>
              <Menu.Label>Edit</Menu.Label>
              <Menu.Item icon={CopyIcon} shortcut="⌘C">
                Copy
              </Menu.Item>
              <Menu.Item disabled>Paste</Menu.Item>
            </Menu.Group>
            <Menu.Separator />
            <Menu.CheckboxItem checked>Show grid</Menu.CheckboxItem>
            <Menu.RadioGroup value="a" aria-label="Sort by">
              <Menu.RadioItem value="a">Name</Menu.RadioItem>
              <Menu.RadioItem value="b">Date</Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.Sub>
              <Menu.SubTrigger>More</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Inside</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
            <Menu.Item tone="danger">Delete</Menu.Item>
            <Menu.Item asChild>
              <a href="#docs">Docs</a>
            </Menu.Item>
          </Menu.Content>
        </Menu>,
      );
      await screen.findByRole("menu");
      expect((await axe(document.body, noRegion)).violations).toHaveLength(0);
    });

    it("has no axe violations with an icon-only trigger and a submenu open", async () => {
      render(
        <Menu defaultOpen>
          <Menu.Trigger asChild>
            <Button aria-label="Row actions">⋯</Button>
          </Menu.Trigger>
          <Menu.Content size="sm">
            <Menu.Sub open>
              <Menu.SubTrigger>More</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Inside</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu>,
      );
      await screen.findAllByRole("menu");
      expect((await axe(document.body, noRegion)).violations).toHaveLength(0);
    });
  });
});
