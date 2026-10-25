import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { GearIcon } from "@dbm-system/icons";
import { StrictMode, createRef, useState } from "react";
import type { Ref } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { CommandPalette, useCommandPaletteController } from "./CommandPalette";
import type { CommandItem, CommandPaletteController, CommandPaletteProps } from "./CommandPalette.types";

const commands: CommandItem[] = [
  { value: "new-file", label: "New file", group: "File", shortcut: ["Ctrl", "N"] },
  { value: "open-file", label: "Open file", group: "File", description: "From disk" },
  { value: "settings", label: "Open settings", group: "App", icon: GearIcon, keywords: ["preferences"] },
  { value: "locked", label: "Publish", group: "App", disabled: "Needs a connection" },
  {
    value: "theme",
    label: "Change theme",
    group: "App",
    items: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },
];

// A page-level run sees the dialog portaled outside any landmark, which says nothing about the component.
const noLandmarks = { rules: { region: { enabled: false } } };
const input = () => screen.getByRole("combobox") as HTMLInputElement;
const dialog = () => screen.queryByRole("dialog");
const labelsOf = () => screen.getAllByRole("option").map((option) => option.querySelector('[class*="optionLabel"]')?.textContent ?? option.textContent);
const highlightedLabel = () => document.getElementById(input().getAttribute("aria-activedescendant") ?? "")?.textContent;

function setup(props: Partial<CommandPaletteProps> & { ref?: Ref<HTMLDivElement> } = {}) {
  return render(<CommandPalette defaultOpen commands={commands} {...props} />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CommandPalette", () => {
  describe("structure and naming", () => {
    it("is a dialog named by its title, holding a combobox that points at a listbox", async () => {
      setup();
      expect(await screen.findByRole("dialog")).toHaveAccessibleName("Command palette");
      expect(input()).toHaveAccessibleName("Search commands");
      expect(input()).toHaveAttribute("aria-expanded", "true");
      expect(input()).toHaveAttribute("aria-autocomplete", "list");
      expect(input()).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
      expect(screen.getByRole("listbox")).toHaveAccessibleName("Command palette");
    });

    it("takes focus in the search field when it opens", async () => {
      setup();
      await screen.findByRole("dialog");
      await waitFor(() => expect(input()).toHaveFocus());
    });

    it("lists the commands under group headings, with a description, an icon and a shortcut", async () => {
      setup();
      await screen.findByRole("dialog");
      expect(screen.getAllByRole("group").map((group) => group.getAttribute("aria-labelledby"))).toHaveLength(2);
      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("From disk")).toBeInTheDocument();
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(document.querySelector('[role="option"] svg')).not.toBeNull();
    });

    it("names the dialog from aria-label or aria-labelledby when given", async () => {
      const { unmount } = setup({ "aria-label": "Jump to" });
      expect(await screen.findByRole("dialog")).toHaveAccessibleName("Jump to");
      unmount();
      render(
        <>
          <span id="heading">Quick actions</span>
          <CommandPalette defaultOpen commands={commands} aria-labelledby="heading" />
        </>,
      );
      expect(await screen.findByRole("dialog")).toHaveAccessibleName("Quick actions");
    });

    it("puts id, className, style and data-testid on the dialog panel, and forwards the ref there", async () => {
      const ref = createRef<HTMLDivElement>();
      setup({ id: "palette", className: "mine", style: { opacity: 0.99 }, "data-testid": "panel", ref });
      const panel = await screen.findByTestId("panel");
      expect(panel).toBe(ref.current);
      expect(panel).toBe(dialog());
      expect(panel).toHaveAttribute("id", "palette");
      expect(panel).toHaveClass("mine");
      expect(panel.style.opacity).toBe("0.99");
    });

    it("keeps its computed role over a same-named prop", async () => {
      setup({ ...({ role: "alert" } as object) });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("renders an empty list note for no commands", async () => {
      setup({ commands: [] });
      await screen.findByRole("dialog");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
    });

    it("has no accessibility violations", async () => {
      setup();
      await screen.findByRole("dialog");
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
    });

    it("has no accessibility violations on a sub-list or with nothing found", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.click(screen.getByText("Change theme"));
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
      await user.type(input(), "zzzz");
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
    });
  });

  describe("opening", () => {
    it("opens from its trigger and returns focus to it on close", async () => {
      const user = userEvent.setup();
      render(<CommandPalette trigger={<Button>Search</Button>} commands={commands} />);
      expect(dialog()).toBeNull();
      await user.click(screen.getByRole("button", { name: "Search" }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).toBeNull());
      expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
    });

    it("reports why it opened and closed", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<CommandPalette trigger={<Button>Search</Button>} commands={commands} onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Search" }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: "trigger" });
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
    });

    it("follows a controlled open and asks to change it rather than changing it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<CommandPalette open commands={commands} onOpenChange={onOpenChange} />);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
      expect(dialog()).toBeInTheDocument();
    });

    it("closes on a press on the scrim", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      setup({ onOpenChange });
      const panel = await screen.findByRole("dialog");
      await user.click(panel.parentElement as HTMLElement);
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "outside" }));
    });

    it("tells when it has finished opening and closing", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn();
      setup({ onOpenChangeComplete });
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(false));
    });

    it("starts afresh every time it opens", async () => {
      const user = userEvent.setup();
      render(<CommandPalette trigger={<Button>Search</Button>} commands={commands} />);
      await user.click(screen.getByRole("button", { name: "Search" }));
      await user.type(input(), "file");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).toBeNull());
      await user.click(screen.getByRole("button", { name: "Search" }));
      await screen.findByRole("dialog");
      expect(input()).toHaveValue("");
    });
  });

  describe("the hotkey", () => {
    it("opens and closes from anywhere with Ctrl+K off an Apple platform", async () => {
      const onOpenChange = vi.fn();
      render(<CommandPalette commands={commands} onOpenChange={onOpenChange} />);
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: "hotkey" });
      fireEvent.keyDown(input(), { key: "k", code: "KeyK", ctrlKey: true });
      await waitFor(() => expect(dialog()).toBeNull());
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "hotkey" });
    });

    it("stops the browser from acting on the combination, and ignores other keys", async () => {
      render(<CommandPalette commands={commands} />);
      const other = new KeyboardEvent("keydown", { key: "j", code: "KeyJ", ctrlKey: true, cancelable: true, bubbles: true });
      document.body.dispatchEvent(other);
      expect(other.defaultPrevented).toBe(false);
      const event = new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true, cancelable: true, bubbles: true });
      document.body.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("ignores a held key and one already handled", async () => {
      render(<CommandPalette commands={commands} />);
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true, repeat: true });
      expect(dialog()).toBeNull();
    });

    it("uses another combination, or none", async () => {
      const { unmount } = render(<CommandPalette commands={commands} hotkey="alt+shift+p" />);
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      expect(dialog()).toBeNull();
      fireEvent.keyDown(document.body, { key: "P", code: "KeyP", altKey: true, shiftKey: true });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      unmount();
      render(<CommandPalette commands={commands} hotkey={false} controllerRef={createRef()} />);
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      expect(dialog()).toBeNull();
    });

    it("warns about a combination it can't read and about a palette nothing can open", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<CommandPalette commands={commands} hotkey="hyper+k" />);
      expect(warn.mock.calls.map((call) => String(call[0])).join("\n")).toContain('"hyper+k" is not a key combination');
      expect(warn.mock.calls.map((call) => String(call[0])).join("\n")).toContain("nothing can open it");
    });

    it("stops listening when it unmounts", () => {
      const onOpenChange = vi.fn();
      const { unmount } = render(<CommandPalette commands={commands} onOpenChange={onOpenChange} />);
      unmount();
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("searching", () => {
    it("narrows the list to commands holding every word, in any order", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "file open");
      expect(labelsOf()).toEqual(["Open file"]);
    });

    it("matches a keyword the row never shows", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "prefer");
      expect(labelsOf()).toEqual(["Open settings"]);
    });

    it("lists the best match first and marks what matched", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "op");
      expect(labelsOf()).toEqual(["Open file", "Open settings"]);
      const marked = [...document.querySelectorAll('[role="option"] [class*="match"]')].map((node) => node.textContent);
      expect(marked).toEqual(["Op", "Op"]);
    });

    it("says so when nothing matches, and announces the count as it changes", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "file");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 results available"), { timeout: 2000 });
      await user.type(input(), "zzz");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No results"), { timeout: 2000 });
    });

    it("does not announce the list on first appearance", async () => {
      setup();
      await screen.findByRole("dialog");
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("can be controlled, and reports typing", async () => {
      const user = userEvent.setup();
      const onQueryChange = vi.fn();
      function Controlled() {
        const [query, setQuery] = useState("sett");
        return (
          <CommandPalette
            defaultOpen
            commands={commands}
            query={query}
            onQueryChange={(next) => {
              onQueryChange(next);
              setQuery(next);
            }}
          />
        );
      }
      render(<Controlled />);
      await screen.findByRole("dialog");
      expect(input()).toHaveValue("sett");
      expect(labelsOf()).toEqual(["Open settings"]);
      await user.type(input(), "i");
      expect(onQueryChange).toHaveBeenLastCalledWith("setti");
    });

    it("starts from defaultQuery", async () => {
      setup({ defaultQuery: "theme", searchNested: false });
      await screen.findByRole("dialog");
      expect(labelsOf()).toEqual(["Change theme"]);
    });

    it("leaves the list to the caller with filter={false}", async () => {
      const user = userEvent.setup();
      setup({ filter: false });
      await screen.findByRole("dialog");
      await user.type(input(), "zzz");
      expect(labelsOf()).toHaveLength(5);
    });

    it("keeps or drops with a filter function and leaves the order", async () => {
      const user = userEvent.setup();
      setup({ filter: (item, text) => item.value.startsWith(text) && text !== "" });
      await screen.findByRole("dialog");
      await user.type(input(), "o");
      expect(labelsOf()).toEqual(["Open file"]);
    });

    it("lists recent commands first while nothing is typed, once each", async () => {
      const user = userEvent.setup();
      setup({ recent: ["settings", "open-file", "nope"] });
      await screen.findByRole("dialog");
      expect(labelsOf()).toEqual(["Open settings", "Open file", "New file", "Publish", "Change theme"]);
      expect(screen.getByText("Recent")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(5);
      await user.type(input(), "o");
      expect(screen.queryByText("Recent")).toBeNull();
    });

    it("shows loading, and an error note", async () => {
      const { rerender } = setup({ commands: [], loading: true });
      await screen.findByRole("dialog");
      expect(screen.getByRole("option")).toHaveTextContent("Loading…");
      expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
      rerender(<CommandPalette defaultOpen commands={commands} error />);
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    });

    it("shows its own empty content", async () => {
      const user = userEvent.setup();
      setup({ emptyContent: "Nothing like that" });
      await screen.findByRole("dialog");
      await user.type(input(), "zzz");
      expect(screen.getByRole("option")).toHaveTextContent("Nothing like that");
    });
  });

  describe("keys", () => {
    it("highlights the first command and moves with the arrow keys, wrapping and skipping disabled ones", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      expect(highlightedLabel()).toContain("New file");
      await user.keyboard("{ArrowDown}");
      expect(highlightedLabel()).toContain("Open file");
      await user.keyboard("{ArrowDown}{ArrowDown}");
      // "Publish" is disabled and skipped.
      expect(highlightedLabel()).toContain("Change theme");
      await user.keyboard("{ArrowDown}");
      expect(highlightedLabel()).toContain("New file");
      await user.keyboard("{ArrowUp}");
      expect(highlightedLabel()).toContain("Change theme");
    });

    it("moves a page at a time with Page Down and Page Up", async () => {
      const many = Array.from({ length: 30 }, (_, index) => ({ value: `c${index}`, label: `Command ${index}` }));
      const user = userEvent.setup();
      setup({ commands: many });
      await screen.findByRole("dialog");
      await user.keyboard("{PageDown}");
      expect(highlightedLabel()).toContain("Command 10");
      await user.keyboard("{PageUp}{PageUp}");
      expect(highlightedLabel()).toContain("Command 0");
    });

    it("runs the highlighted command with Enter and closes", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onOpenChange = vi.fn();
      const withHandlers = commands.map((command) => (command.value === "open-file" ? { ...command, onSelect } : command));
      setup({ commands: withHandlers, onOpenChange });
      await screen.findByRole("dialog");
      await user.keyboard("{ArrowDown}{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ value: "open-file" });
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "select" });
      await waitFor(() => expect(dialog()).toBeNull());
    });

    it("runs a command with a click, and tells the palette's onSelect what was typed", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setup({ onSelect });
      await screen.findByRole("dialog");
      await user.type(input(), "file");
      await user.click(screen.getByRole("option", { name: /Open file/ }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "open-file" }), { query: "file" });
    });

    it("moves the highlight under the pointer and runs that one", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setup({ onSelect });
      await screen.findByRole("dialog");
      await user.hover(screen.getByRole("option", { name: /Open settings/ }));
      expect(highlightedLabel()).toContain("Open settings");
      await user.keyboard("{Enter}");
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "settings" }), { query: "" });
    });

    it("does nothing for Enter on an empty result, and ignores keys while composing", async () => {
      const onSelect = vi.fn();
      setup({ onSelect });
      await screen.findByRole("dialog");
      fireEvent.change(input(), { target: { value: "zzz" } });
      fireEvent.keyDown(input(), { key: "Enter" });
      expect(onSelect).not.toHaveBeenCalled();
      fireEvent.change(input(), { target: { value: "" } });
      fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("keeps focus in the search field when a row is pressed", async () => {
      const user = userEvent.setup();
      setup({ commands: commands.map((command) => ({ ...command, closeOnSelect: false })) });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /New file/ }));
      expect(input()).toHaveFocus();
    });
  });

  describe("running commands", () => {
    it("does not run a disabled command, and gives its reason", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setup({ commands: commands.map((c) => (c.value === "locked" ? { ...c, onSelect } : c)) });
      await screen.findByRole("dialog");
      const row = screen.getByRole("option", { name: /Publish/ });
      expect(row).toHaveAttribute("aria-disabled", "true");
      expect(row).toHaveAttribute("title", "Needs a connection");
      expect(row).toHaveTextContent("Needs a connection");
      await user.click(row);
      expect(onSelect).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it("stays open for a command with closeOnSelect false", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setup({ commands: [{ value: "toggle", label: "Toggle", closeOnSelect: false, onSelect }] });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: "Toggle" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(dialog()).toBeInTheDocument();
    });

    it("waits for a promise: a spinner, a busy palette that can't be dismissed, then closes", async () => {
      const user = userEvent.setup();
      let finish!: () => void;
      const onSelect = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      );
      const onOpenChange = vi.fn();
      setup({ commands: [{ value: "slow", label: "Slow thing", onSelect }, { value: "other", label: "Other", onSelect: vi.fn() }], onOpenChange });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Slow thing/ }));
      expect(dialog()).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("option", { name: /Slow thing/ }).querySelector('[class*="trailing"]')).not.toBeNull();
      await user.keyboard("{Escape}");
      expect(onOpenChange).not.toHaveBeenCalled();
      await user.click(screen.getByRole("option", { name: /Other/ }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await act(async () => finish());
      await waitFor(() => expect(dialog()).toBeNull());
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "select" });
    });

    it("stays open and reports a rejection to onSelectError", async () => {
      const user = userEvent.setup();
      const failure = new Error("nope");
      const onSelectError = vi.fn();
      const item: CommandItem = { value: "bad", label: "Bad one", onSelect: () => Promise.reject(failure) };
      setup({ commands: [item], onSelectError });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Bad one/ }));
      await waitFor(() => expect(onSelectError).toHaveBeenCalledWith(failure, expect.objectContaining({ value: "bad" })));
      expect(dialog()).toBeInTheDocument();
      expect(dialog()).not.toHaveAttribute("aria-busy");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("That didn’t work. Try again."), { timeout: 2000 });
    });

    it("lets a rejection with no handler surface as unhandled", async () => {
      const user = userEvent.setup();
      const unhandled = vi.fn();
      process.on("unhandledRejection", unhandled);
      const item: CommandItem = { value: "bad", label: "Bad one", onSelect: () => Promise.reject(new Error("loud")) };
      setup({ commands: [item] });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Bad one/ }));
      await waitFor(() => expect(unhandled).toHaveBeenCalled());
      process.off("unhandledRejection", unhandled);
    });

    it("is not left busy if the palette is unmounted while a command works", async () => {
      const user = userEvent.setup();
      let finish!: () => void;
      const item: CommandItem = { value: "slow", label: "Slow", onSelect: () => new Promise<void>((resolve) => (finish = resolve)) };
      const { unmount } = setup({ commands: [item] });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Slow/ }));
      unmount();
      await act(async () => finish());
    });
  });

  describe("lists of commands", () => {
    it("opens a command's items under a Back button, clears the search and names the list", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setup({ onSelect });
      await screen.findByRole("dialog");
      await user.type(input(), "theme");
      expect(within(screen.getByRole("option", { name: /Change theme/ })).queryByText("Ctrl")).toBeNull();
      await user.click(screen.getByRole("option", { name: /Change theme/ }));
      expect(input()).toHaveValue("");
      expect(input()).toHaveFocus();
      expect(labelsOf()).toEqual(["Light", "Dark"]);
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
      expect(screen.getByText("Change theme")).toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("searches only the list on show", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Change theme/ }));
      await user.type(input(), "file");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
      await user.clear(input());
      await user.type(input(), "dar");
      expect(labelsOf()).toEqual(["Dark"]);
    });

    it("goes back with the Back button and with Backspace on an empty search", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Change theme/ }));
      await user.click(screen.getByRole("button", { name: "Back" }));
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      expect(labelsOf()).toContain("New file");
      expect(input()).toHaveFocus();
      await user.click(screen.getByRole("option", { name: /Change theme/ }));
      await user.type(input(), "d");
      await user.keyboard("{Backspace}");
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
      await user.keyboard("{Backspace}");
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    });

    it("closes from inside a list with Escape, and runs a command in it", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const nested = [{ value: "theme", label: "Theme", items: [{ value: "dark", label: "Dark", onSelect }] }];
      setup({ commands: nested });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Theme/ }));
      await user.click(screen.getByRole("option", { name: /Dark/ }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(dialog()).toBeNull());
    });

    it("ignores the items of a command inside a list, with a warning", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const onSelect = vi.fn();
      const nested = [{ value: "a", label: "A", items: [{ value: "b", label: "B", onSelect, items: [{ value: "c", label: "C" }] }] }];
      setup({ commands: nested });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /A/ }));
      expect(warn.mock.calls.map((call) => String(call[0])).join("\n")).toContain("One level of lists is supported");
      await user.click(screen.getByRole("option", { name: /^B/ }));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("marks a command that opens a list", async () => {
      setup();
      await screen.findByRole("dialog");
      const row = screen.getByRole("option", { name: /Change theme/ });
      expect(row.querySelector("svg")).not.toBeNull();
    });
  });

  describe("drawing", () => {
    it("draws a row itself with renderItem", async () => {
      setup({ renderItem: (item, state) => <span data-testid="custom">{`${item.label}:${state.highlighted}`}</span> });
      await screen.findByRole("dialog");
      expect(screen.getAllByTestId("custom")[0]).toHaveTextContent("New file:true");
    });

    it("shows or hides the key hints, and adds a footer", async () => {
      const { rerender } = setup({ footer: <a href="/help">Help</a> });
      await screen.findByRole("dialog");
      expect(screen.getByText("Navigate")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Help" })).toBeInTheDocument();
      rerender(<CommandPalette defaultOpen commands={commands} showHints={false} />);
      expect(screen.queryByText("Navigate")).toBeNull();
    });

    it("takes its words from labels, keeping the default for one left undefined", async () => {
      setup({ labels: { placeholder: "Aller à…", title: undefined, noResults: "Rien" } });
      const panel = await screen.findByRole("dialog");
      expect(panel).toHaveAccessibleName("Command palette");
      expect(input()).toHaveAttribute("placeholder", "Aller à…");
    });

    it("writes the count with formatNumber", async () => {
      const user = userEvent.setup();
      setup({ formatNumber: (value) => `#${value}` });
      await screen.findByRole("dialog");
      await user.type(input(), "file");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("#2 results available"), { timeout: 2000 });
    });

    it("mirrors into right-to-left", async () => {
      setup({ dir: "rtl" });
      expect(await screen.findByRole("dialog")).toHaveAttribute("dir", "rtl");
    });
  });

  describe("the controller", () => {
    it("opens, closes and toggles from code, saying whether it had anything to do", async () => {
      const controllerRef = createRef<CommandPaletteController>();
      const onOpenChange = vi.fn();
      render(<CommandPalette commands={commands} controllerRef={controllerRef} onOpenChange={onOpenChange} />);
      const controller = controllerRef.current as CommandPaletteController;
      expect(controller.isOpen).toBe(false);
      expect(controller.close()).toBe(false);
      act(() => {
        expect(controller.open()).toBe(true);
      });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(controller.isOpen).toBe(true);
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: "controller" });
      expect(controller.open()).toBe(false);
      act(() => {
        expect(controller.toggle()).toBe(true);
      });
      await waitFor(() => expect(dialog()).toBeNull());
      expect(controllerRef.current).toBe(controller);
    });

    it("can't close while a command works", async () => {
      const user = userEvent.setup();
      const controllerRef = createRef<CommandPaletteController>();
      const item: CommandItem = { value: "slow", label: "Slow", onSelect: () => new Promise<void>(() => undefined) };
      render(<CommandPalette defaultOpen commands={[item]} controllerRef={controllerRef} />);
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Slow/ }));
      expect(controllerRef.current?.close()).toBe(false);
      expect(dialog()).toBeInTheDocument();
    });

    it("is the same object inside the palette, which an inert one outside it never is", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      let inside: CommandPaletteController | undefined;
      let outside: CommandPaletteController | undefined;
      function Inside() {
        inside = useCommandPaletteController();
        return <span>footer</span>;
      }
      function Outside() {
        outside = useCommandPaletteController();
        return null;
      }
      const controllerRef = createRef<CommandPaletteController>();
      render(
        <>
          <CommandPalette defaultOpen commands={commands} footer={<Inside />} controllerRef={controllerRef} />
          <Outside />
        </>,
      );
      await screen.findByRole("dialog");
      expect(inside).toBe(controllerRef.current);
      expect(outside?.open()).toBe(false);
      expect(warn.mock.calls.map((call) => String(call[0])).join("\n")).toContain("called outside a <CommandPalette>");
    });
  });

  describe("React StrictMode", () => {
    it("works the same: the hotkey, searching and running a command", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <StrictMode>
          <CommandPalette commands={commands.map((c) => (c.value === "new-file" ? { ...c, onSelect } : c))} />
        </StrictMode>,
      );
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      await screen.findByRole("dialog");
      await user.type(input(), "new");
      await user.keyboard("{Enter}");
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(dialog()).toBeNull());
      fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("searching the commands inside lists", () => {
    it("finds a command inside a list from the top level, under its parent's label, and runs it", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const nested = [
        { value: "theme", label: "Change theme", group: "App", items: [{ value: "dark", label: "Dark mode", onSelect }, { value: "light", label: "Light mode" }] },
        { value: "dark", label: "Dark corners", group: "App" },
      ];
      setup({ commands: nested });
      await screen.findByRole("dialog");
      await user.type(input(), "dark");
      // A top-level command and a nested one can share a value.
      expect(labelsOf()).toEqual(["Dark corners", "Dark mode"]);
      expect(screen.getByText("Change theme", { selector: '[role="presentation"]' })).toBeInTheDocument();
      expect(screen.getAllByRole("group")).toHaveLength(2);
      await user.click(screen.getByRole("option", { name: /Dark mode/ }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "dark", label: "Dark mode" }));
      await waitFor(() => expect(dialog()).toBeNull());
    });

    it("finds a nested command by its parent's name, and has no marker for opening a list on it", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "theme");
      expect(labelsOf()).toEqual(["Change theme", "Light", "Dark"]);
      const light = screen.getByRole("option", { name: /Light/ });
      expect(light.querySelector('[class*="chevron"]')).toBeNull();
      expect(light.querySelector('[class*="matchHint"]')).toBeNull();
    });

    it("does not look inside a list for a disabled parent, with searchNested off, inside a list, or with filter={false}", async () => {
      const user = userEvent.setup();
      const locked = [{ value: "a", label: "Locked", disabled: "No", items: [{ value: "b", label: "Hidden child" }] }];
      const { unmount } = setup({ commands: locked });
      await screen.findByRole("dialog");
      await user.type(input(), "hidden");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
      unmount();

      const open = [{ value: "a", label: "Parent", items: [{ value: "b", label: "Child" }] }];
      const off = setup({ commands: open, searchNested: false });
      await screen.findByRole("dialog");
      await user.type(input(), "child");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
      off.unmount();

      const byCaller = setup({ commands: open, filter: false });
      await screen.findByRole("dialog");
      await user.type(input(), "child");
      expect(labelsOf()).toEqual(["Parent"]);
      byCaller.unmount();

      setup({ commands: open });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Parent/ }));
      await user.type(input(), "par");
      expect(screen.getByRole("option")).toHaveTextContent("No results");
    });

    it("hands a filter function the original commands, and counts nested hits", async () => {
      const user = userEvent.setup();
      const filter = vi.fn((item: CommandItem, text: string) => item.label.toLowerCase().includes(text.toLowerCase()));
      setup({ filter });
      await screen.findByRole("dialog");
      await user.type(input(), "light");
      expect(labelsOf()).toEqual(["Light"]);
      expect(filter.mock.calls.every(([item]) => !item.value.includes("\u0001"))).toBe(true);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 result available"), { timeout: 2000 });
    });
  });

  describe("saying why a command matched", () => {
    it("shows the keyword a row was found through when its label doesn't hold the word", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      await user.type(input(), "prefer");
      const row = screen.getByRole("option", { name: /Open settings/ });
      expect(row.querySelector('[class*="matchHint"]')).toHaveTextContent("“preferences”");
      expect(row).toHaveAccessibleName(/Open settings.*preferences/);
    });

    it("shows nothing when the label holds every word, and nothing without a search", async () => {
      const user = userEvent.setup();
      setup();
      await screen.findByRole("dialog");
      expect(document.querySelector('[class*="matchHint"]')).toBeNull();
      await user.type(input(), "settings");
      expect(document.querySelector('[class*="matchHint"]')).toBeNull();
    });
  });

  describe("a list's own placeholder and empty note", () => {
    const withPage: CommandItem[] = [
      { value: "theme", label: "Change theme", placeholder: "Search themes…", emptyContent: "No such theme", items: [{ value: "dark", label: "Dark" }] },
    ];

    it("uses them inside the list, and the palette's own outside it", async () => {
      const user = userEvent.setup();
      setup({ commands: withPage });
      await screen.findByRole("dialog");
      expect(input()).toHaveAttribute("placeholder", "Type a command or search…");
      expect(input()).toHaveAccessibleName("Search commands");
      expect(screen.getByRole("listbox")).toHaveAccessibleName("Command palette");
      await user.click(screen.getByRole("option", { name: /Change theme/ }));
      expect(input()).toHaveAttribute("placeholder", "Search themes…");
      expect(input()).toHaveAccessibleName("Search Change theme");
      expect(screen.getByRole("listbox")).toHaveAccessibleName("Change theme");
      await user.type(input(), "zzz");
      expect(screen.getByRole("option")).toHaveTextContent("No such theme");
      await user.clear(input());
      await user.keyboard("{Backspace}");
      expect(input()).toHaveAttribute("placeholder", "Type a command or search…");
    });

    it("falls back to the palette's words when the list sets none, and takes searchIn from labels", async () => {
      const user = userEvent.setup();
      setup({ commands: [{ value: "theme", label: "Theme", items: [{ value: "dark", label: "Dark" }] }], emptyContent: "Nothing", labels: { searchIn: (label) => `Cherche ${label}` } });
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("option", { name: /Theme/ }));
      expect(input()).toHaveAttribute("placeholder", "Type a command or search…");
      expect(input()).toHaveAccessibleName("Cherche Theme");
      await user.type(input(), "zzz");
      expect(screen.getByRole("option")).toHaveTextContent("Nothing");
    });
  });
});
