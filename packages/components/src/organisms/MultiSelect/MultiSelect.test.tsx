import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { GlobeIcon } from "@dbm-system/icons";
import { StrictMode, createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../../molecules/FormField";
import { Form } from "../Form";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectController, MultiSelectOption, MultiSelectProps } from "./MultiSelect.types";

const countries: MultiSelectOption[] = [
  { value: "ca", label: "Canada" },
  { value: "cu", label: "Curaçao" },
  { value: "mx", label: "Mexico", disabled: "Not shipping there yet" },
  { value: "us", label: "United States" },
  { value: "uy", label: "Uruguay" },
];

// A page-level run sees the list portaled outside any landmark, which says nothing about the component.
const noLandmarks = { rules: { region: { enabled: false } } };
const field = () => screen.getByRole("combobox") as HTMLInputElement;
const list = () => screen.queryByRole("listbox");
const labelsOf = () => screen.getAllByRole("option").map((option) => option.textContent?.replace(/, .*/, ""));
// The chips: the items of the list of chosen options, without the hidden one that holds the row's height.
const chips = () => {
  const chosen = screen.queryByRole("list", { name: "Selected options" });
  return chosen ? within(chosen).queryAllByRole("listitem").map((item) => item.textContent) : [];
};
const hiddenValues = (form: HTMLElement) => new FormData(form as HTMLFormElement).getAll("country");

function setup(props: Partial<MultiSelectProps> = {}) {
  return render(<MultiSelect aria-label="Countries" options={countries} {...props} />);
}

describe("MultiSelect", () => {
  describe("structure and naming", () => {
    it("is a named combobox that points at a multi-selectable listbox only while open", async () => {
      const user = userEvent.setup();
      setup();
      expect(field()).toHaveAccessibleName("Countries");
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(field()).toHaveAttribute("aria-autocomplete", "list");
      expect(field()).toHaveAttribute("aria-haspopup", "listbox");
      expect(field()).not.toHaveAttribute("aria-controls");
      expect(list()).toBeNull();
      await user.click(field());
      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(field()).toHaveAttribute("aria-controls", list()?.id);
      expect(list()).toHaveAccessibleName("Countries");
      expect(list()).toHaveAttribute("aria-multiselectable", "true");
    });

    it("names the list from a visible label when there is no aria-label", async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="c">Ships to</label>
          <MultiSelect id="c" options={countries} />
        </>,
      );
      expect(field()).toHaveAccessibleName("Ships to");
      await user.click(field());
      expect(list()).toHaveAccessibleName("Ships to");
    });

    it("puts ref, id and data-testid on the entry, and className and style on the outer box", () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <MultiSelect ref={ref} id="entry" data-testid="entry" aria-label="Countries" className="mine" style={{ marginBlock: 3 }} />,
      );
      expect(ref.current).toBe(field());
      expect(field()).toHaveAttribute("id", "entry");
      expect(field()).toHaveAttribute("data-testid", "entry");
      const outer = container.firstElementChild as HTMLElement;
      expect(outer).toHaveClass("mine");
      expect(outer.style.marginBlock).toBe("3px");
      expect(outer).not.toContainElement(null);
    });

    it("lets the computed attributes win over a same-named prop", () => {
      setup({ ...({ role: "textbox", "aria-expanded": true, "aria-haspopup": "menu" } as object) });
      expect(field()).toHaveAttribute("role", "combobox");
    });

    it("shows the placeholder only while nothing is chosen", () => {
      const { rerender } = setup({ placeholder: "Pick countries", value: [] });
      expect(field()).toHaveAttribute("placeholder", "Pick countries");
      rerender(<MultiSelect aria-label="Countries" options={countries} placeholder="Pick countries" value={["ca"]} />);
      expect(field()).not.toHaveAttribute("placeholder");
    });

    it("draws a chip for each chosen value, in order, with its option's label", () => {
      setup({ defaultValue: ["us", "ca"] });
      expect(chips()).toEqual(["United States", "Canada"]);
    });

    it("shows the value itself for a chosen value that has no option", () => {
      setup({ defaultValue: ["zz"] });
      expect(chips()).toEqual(["zz"]);
    });

    it("keeps a chip's label after its option leaves the list", () => {
      const { rerender } = setup({ defaultValue: ["ca"] });
      expect(chips()).toEqual(["Canada"]);
      rerender(<MultiSelect aria-label="Countries" options={[]} defaultValue={["ca"]} />);
      expect(chips()).toEqual(["Canada"]);
    });

    it("renders a value that isn't an array as empty", () => {
      setup({ value: undefined as unknown as string[], ...({ defaultValue: "ca" } as object) });
      expect(chips()).toEqual([]);
    });
  });

  describe("opening and choosing with the pointer", () => {
    it("opens on a click, lists every option and marks the chosen ones", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["us"] });
      await user.click(field());
      expect(labelsOf()).toEqual(["Canada", "Curaçao", "Mexico", "United States", "Uruguay"]);
      expect(screen.getByRole("option", { name: "United States" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("option", { name: "Canada" })).toHaveAttribute("aria-selected", "false");
    });

    it("chooses an option, adds its chip, and keeps the list open for the next", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(chips()).toEqual(["Canada", "Uruguay"]);
      expect(list()).not.toBeNull();
      expect(onValueChange).toHaveBeenLastCalledWith(
        ["ca", "uy"],
        expect.objectContaining({ source: "select", option: expect.objectContaining({ value: "uy" }) }),
      );
      expect(field()).toHaveFocus();
    });

    it("removes a chosen option when it is chosen again", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ defaultValue: ["ca", "us"], onValueChange });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(chips()).toEqual(["United States"]);
      expect(onValueChange).toHaveBeenCalledWith(["us"], expect.objectContaining({ source: "deselect" }));
    });

    it("closes the list after a choice with closeOnSelect", async () => {
      const user = userEvent.setup();
      setup({ closeOnSelect: true });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(list()).toBeNull();
      expect(chips()).toEqual(["Canada"]);
    });

    it("does not choose a disabled option, and gives its reason", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(field());
      const mexico = screen.getByRole("option", { name: /Mexico/ });
      expect(mexico).toHaveAttribute("aria-disabled", "true");
      expect(mexico).toHaveAttribute("title", "Not shipping there yet");
      expect(mexico).toHaveAccessibleName(/Not shipping there yet/);
      await user.click(mexico);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("opens from the caret button and from a press on the box, and closes from the caret", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Toggle options" }));
      expect(list()).not.toBeNull();
      expect(field()).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Toggle options" }));
      expect(list()).toBeNull();
    });

    it("does not open the list for a press on a chip, which may be the start of a drag, but hands the typing back to the entry", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca"] });
      await user.click(screen.getByText("Canada"));
      expect(list()).toBeNull();
      expect(field()).toHaveFocus();
    });

    it("keeps the two adornment buttons out of the tab order", () => {
      setup({ defaultValue: ["ca"] });
      expect(screen.getByRole("button", { name: "Toggle options" })).toHaveAttribute("tabindex", "-1");
      expect(screen.getByRole("button", { name: "Clear all" })).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("typing and filtering", () => {
    it("narrows the list as the person types, and highlights the first match", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "u");
      expect(labelsOf()).toEqual(["Curaçao", "United States", "Uruguay"]);
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Curaçao" }).id);
    });

    it("matches every word, in any order, ignoring case and accents", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "states UNITED");
      expect(labelsOf()).toEqual(["United States"]);
      await user.clear(field());
      await user.type(field(), "curacao");
      expect(labelsOf()).toEqual(["Curaçao"]);
    });

    it("clears the typed text when an option is chosen, and the list shows every option again", async () => {
      const user = userEvent.setup();
      const onInputValueChange = vi.fn();
      setup({ onInputValueChange });
      await user.type(field(), "ur");
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(field()).toHaveValue("");
      expect(onInputValueChange).toHaveBeenLastCalledWith("", "select");
      expect(labelsOf()).toHaveLength(5);
    });

    it("says there are no results, and what to do with no options at all", async () => {
      const user = userEvent.setup();
      const { rerender } = setup();
      await user.type(field(), "zzz");
      expect(screen.getByRole("option", { name: "No results" })).toBeInTheDocument();
      rerender(<MultiSelect aria-label="Countries" options={[]} />);
      await user.clear(field());
      expect(screen.getByRole("option", { name: "Type to search" })).toBeInTheDocument();
    });

    it("shows every option whatever is typed with filter={false}", async () => {
      const user = userEvent.setup();
      setup({ filter: false });
      await user.type(field(), "zzz");
      expect(labelsOf()).toHaveLength(5);
    });

    it("uses a filter function of its own", async () => {
      const user = userEvent.setup();
      setup({ filter: (option, text) => option.value === text });
      await user.type(field(), "uy");
      expect(labelsOf()).toEqual(["Uruguay"]);
    });

    it("matches keywords that are never shown", async () => {
      const user = userEvent.setup();
      setup({ options: [{ value: "gb", label: "United Kingdom", keywords: ["UK"] }, ...countries] });
      await user.type(field(), "uk");
      expect(labelsOf()).toEqual(["United Kingdom"]);
    });

    it("lists options under their group's heading", async () => {
      const user = userEvent.setup();
      setup({ options: countries.map((option, index) => ({ ...option, group: index < 2 ? "North" : "South" })) });
      await user.click(field());
      expect(screen.getAllByRole("group")).toHaveLength(2);
      expect(screen.getByRole("group", { name: "North" })).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("opens with the arrow keys and moves the highlight, skipping disabled options", async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard("{ArrowDown}");
      expect(list()).not.toBeNull();
      const active = () => document.getElementById(field().getAttribute("aria-activedescendant") ?? "")?.textContent;
      expect(active()).toBe("Canada");
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe("Curaçao");
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe("United States");
      await user.keyboard("{ArrowUp}");
      expect(active()).toBe("Curaçao");
    });

    it("chooses the highlighted option with Enter and keeps the highlight where it was", async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(chips()).toEqual(["Canada"]);
      expect(list()).not.toBeNull();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(chips()).toEqual(["Canada", "Curaçao"]);
      await user.keyboard("{ArrowUp}{Enter}");
      expect(chips()).toEqual(["Curaçao"]);
    });

    it("chooses the first match with Enter after typing", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "uru{Enter}");
      expect(chips()).toEqual(["Uruguay"]);
      expect(field()).toHaveValue("");
    });

    it("closes with Escape, and clears the typed text on a second press", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "ur");
      await user.keyboard("{Escape}");
      expect(list()).toBeNull();
      expect(field()).toHaveValue("ur");
      await user.keyboard("{Escape}");
      expect(field()).toHaveValue("");
    });

    it("opens and closes with Alt+ArrowDown and Alt+ArrowUp", async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(list()).not.toBeNull();
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(list()).toBeNull();
    });

    it("moves the highlight by pages", async () => {
      const user = userEvent.setup();
      const many = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Option ${index}` }));
      setup({ options: many });
      field().focus();
      await user.keyboard("{ArrowDown}{PageDown}");
      const active = () => document.getElementById(field().getAttribute("aria-activedescendant") ?? "")?.textContent;
      expect(active()).toBe("Option 10");
      await user.keyboard("{PageUp}");
      expect(active()).toBe("Option 0");
    });

    it("moves focus to the last chip on Backspace in an empty entry, and removes it on a second press", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ defaultValue: ["ca", "us"], onValueChange });
      field().focus();
      await user.keyboard("{Backspace}");
      expect(chips()).toEqual(["Canada", "United States"]);
      expect(screen.getByRole("button", { name: "Remove United States" })).toHaveFocus();
      await user.keyboard("{Backspace}");
      expect(chips()).toEqual(["Canada"]);
      expect(onValueChange).toHaveBeenLastCalledWith(["ca"], expect.objectContaining({ source: "remove" }));
      expect(screen.getByRole("button", { name: "Remove Canada" })).toHaveFocus();
    });

    it("deletes characters with Backspace while there is text", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca"] });
      await user.type(field(), "ab");
      await user.keyboard("{Backspace}");
      expect(field()).toHaveValue("a");
      expect(chips()).toEqual(["Canada"]);
    });

    it("moves among the chips with the arrow keys from the start of the entry", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca", "us", "uy"] });
      field().focus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove Uruguay" })).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove United States" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("button", { name: "Remove Canada" })).toHaveFocus();
      await user.keyboard("{End}{ArrowRight}");
      expect(field()).toHaveFocus();
    });

    it("does not leave the entry on the left arrow while the caret is inside typed text", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca"] });
      await user.type(field(), "ab");
      await user.keyboard("{ArrowLeft}");
      expect(field()).toHaveFocus();
    });

    it("removes the focused chip with Delete and keeps the place along the row", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca", "us", "uy"] });
      field().focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}{Delete}");
      expect(chips()).toEqual(["Canada", "Uruguay"]);
      expect(screen.getByRole("button", { name: "Remove Uruguay" })).toHaveFocus();
    });

    it("returns to the entry with Escape from a chip", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca"] });
      field().focus();
      await user.keyboard("{ArrowLeft}{Escape}");
      expect(field()).toHaveFocus();
    });

    it("keeps the chips out of the tab order: Tab from the entry leaves the field", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca", "us"]} />
          <button type="button">After</button>
        </>,
      );
      screen.getByRole("button", { name: "Before" }).focus();
      await user.tab();
      expect(field()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(field()).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
    });

    it("hands the arrow key the other way round in right-to-left", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca", "us"], dir: "rtl" });
      field().focus();
      await user.keyboard("{ArrowLeft}");
      expect(field()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Remove United States" })).toHaveFocus();
    });

    it("ignores keys that arrive while an input method is composing", () => {
      setup();
      field().focus();
      fireEvent.keyDown(field(), { key: "ArrowDown", isComposing: true, keyCode: 229 });
      expect(list()).toBeNull();
    });
  });

  describe("removing", () => {
    it("removes a chip with its button and puts focus in the entry", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ defaultValue: ["ca", "us"], onValueChange });
      await user.click(screen.getByRole("button", { name: "Remove Canada" }));
      expect(chips()).toEqual(["United States"]);
      expect(onValueChange).toHaveBeenCalledWith(["us"], expect.objectContaining({ source: "remove" }));
    });

    it("clears everything with the clear button, and tells the owner", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onClear = vi.fn();
      setup({ defaultValue: ["ca", "us"], onValueChange, onClear });
      await user.type(field(), "x");
      await user.click(screen.getByRole("button", { name: "Clear all" }));
      expect(chips()).toEqual([]);
      expect(field()).toHaveValue("");
      expect(onValueChange).toHaveBeenCalledWith([], expect.objectContaining({ source: "clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(field()).toHaveFocus();
    });

    it("shows no clear button when there is nothing to clear, or with clearable off", () => {
      const { rerender } = setup();
      expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
      rerender(<MultiSelect aria-label="Countries" options={countries} defaultValue={["ca"]} clearable={false} />);
      expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    });
  });

  describe("leaving the field", () => {
    it("drops the typed text and closes the list when focus leaves, but not when it moves to a chip", async () => {
      const user = userEvent.setup();
      render(
        <>
          <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca"]} />
          <button type="button">Elsewhere</button>
        </>,
      );
      await user.type(field(), "ur");
      await user.keyboard("{Backspace}{Backspace}{ArrowLeft}");
      expect(list()).toBeNull();
      field().focus();
      await user.type(field(), "ur");
      expect(list()).not.toBeNull();
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(field()).toHaveValue("");
      expect(list()).toBeNull();
    });

    it("keeps the list open while a press lands on an option", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(field()).toHaveFocus();
      expect(list()).not.toBeNull();
    });

    it("opens when focused with openOnFocus", () => {
      setup({ openOnFocus: true });
      act(() => field().focus());
      expect(list()).not.toBeNull();
    });
  });

  describe("controlled and uncontrolled", () => {
    it("keeps the chips it is given until the owner changes them", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ value: ["ca"], onValueChange });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(onValueChange).toHaveBeenCalledWith(["ca", "uy"], expect.anything());
      expect(chips()).toEqual(["Canada"]);
    });

    it("follows the owner's state when it is wired to a setter", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [value, setValue] = useState<string[]>([]);
        return (
          <>
            <MultiSelect aria-label="Countries" options={countries} value={value} onValueChange={setValue} />
            <output>{value.join(",")}</output>
          </>
        );
      }
      render(<Wired />);
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(document.querySelector("output")).toHaveTextContent("ca,uy");
      await user.click(screen.getByRole("button", { name: "Remove Canada" }));
      expect(document.querySelector("output")).toHaveTextContent("uy");
    });

    it("controls the typed text and the open state", async () => {
      const user = userEvent.setup();
      const onInputValueChange = vi.fn();
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <MultiSelect aria-label="Countries" options={countries} inputValue="" open={false} onInputValueChange={onInputValueChange} onOpenChange={onOpenChange} />,
      );
      await user.type(field(), "u");
      expect(onInputValueChange).toHaveBeenCalledWith("u", "input");
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(field()).toHaveValue("");
      expect(list()).toBeNull();
      rerender(<MultiSelect aria-label="Countries" options={countries} inputValue="ur" open />);
      expect(field()).toHaveValue("ur");
      expect(labelsOf()).toEqual(["Curaçao", "Uruguay"]);
    });

    it("starts open and with text from the defaults", () => {
      setup({ defaultOpen: true, defaultInputValue: "can" });
      expect(labelsOf()).toEqual(["Canada"]);
    });
  });

  describe("limits", () => {
    it("disables the options not chosen once maxSelected is reached, with the reason", async () => {
      const user = userEvent.setup();
      setup({ maxSelected: 2, defaultValue: ["ca", "us"] });
      await user.click(field());
      const uruguay = screen.getByRole("option", { name: /Uruguay/ });
      expect(uruguay).toHaveAttribute("aria-disabled", "true");
      expect(uruguay).toHaveAccessibleName(/No more than 2 can be selected/);
      expect(screen.getByRole("option", { name: "Canada" })).not.toHaveAttribute("aria-disabled");
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(screen.getByRole("option", { name: "Uruguay" })).not.toHaveAttribute("aria-disabled");
    });

    it("refuses a choice made with the keyboard at the limit and says so", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ maxSelected: 1, defaultValue: ["ca"], onValueChange });
      await user.type(field(), "uru");
      await user.keyboard("{Enter}");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("refuses a form when fewer than minSelected are chosen", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" minSelected={2} />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      expect(field().validationMessage).toBe("Choose at least 2");
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(form.checkValidity()).toBe(false);
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(form.checkValidity()).toBe(true);
    });

    it("warns when minSelected is greater than maxSelected", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      setup({ minSelected: 5, maxSelected: 2 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`minSelected` is greater than `maxSelected`"));
      warn.mockRestore();
    });
  });

  describe("select all", () => {
    it("adds a first row that chooses every enabled option, and again removes them", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ selectAll: true, onValueChange });
      await user.click(field());
      expect(labelsOf()[0]).toBe("Select all");
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(chips()).toEqual(["Canada", "Curaçao", "United States", "Uruguay"]);
      expect(onValueChange).toHaveBeenLastCalledWith(["ca", "cu", "us", "uy"], { source: "selectAll", option: undefined });
      expect(screen.getByRole("option", { name: "Deselect all" })).toHaveAttribute("aria-selected", "true");
      await user.click(screen.getByRole("option", { name: "Deselect all" }));
      expect(chips()).toEqual([]);
    });

    it("covers only the matches while text is typed, and Enter still chooses the first match", async () => {
      const user = userEvent.setup();
      setup({ selectAll: true });
      await user.type(field(), "u");
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Curaçao" }).id);
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(chips()).toEqual(["Curaçao", "United States", "Uruguay"]);
    });

    it("stops at maxSelected", async () => {
      const user = userEvent.setup();
      setup({ selectAll: true, maxSelected: 2 });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(chips()).toEqual(["Canada", "Curaçao"]);
    });

    it("leaves the row out when no option can be chosen", async () => {
      const user = userEvent.setup();
      setup({ selectAll: true, options: [{ value: "x", label: "X", disabled: true }] });
      await user.click(field());
      expect(labelsOf()).toEqual(["X"]);
    });
  });

  describe("creating an option", () => {
    it("offers a Create row for text that names no option, and chooses what the owner returns", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onCreate = vi.fn((text: string) => ({ value: text.toLowerCase(), label: text }));
      setup({ onCreate, onValueChange });
      await user.type(field(), "Atlantis");
      await user.click(screen.getByRole("option", { name: "Create “Atlantis”" }));
      expect(onCreate).toHaveBeenCalledWith("Atlantis");
      expect(chips()).toEqual(["Atlantis"]);
      expect(onValueChange).toHaveBeenCalledWith(["atlantis"], expect.objectContaining({ source: "create" }));
      expect(field()).toHaveValue("");
    });

    it("waits for a promise, with the row disabled meanwhile", async () => {
      const user = userEvent.setup();
      let resolve: (option: MultiSelectOption) => void = () => undefined;
      const onCreate = vi.fn(() => new Promise<MultiSelectOption>((done) => (resolve = done)));
      setup({ onCreate });
      await user.type(field(), "Atlantis");
      await user.click(screen.getByRole("option", { name: "Create “Atlantis”" }));
      expect(screen.getByRole("option", { name: "Create “Atlantis”" })).toHaveAttribute("aria-disabled", "true");
      await act(async () => resolve({ value: "atl", label: "Atlantis" }));
      expect(chips()).toEqual(["Atlantis"]);
    });

    it("does not offer a Create row for text that is an option's label", async () => {
      const user = userEvent.setup();
      setup({ onCreate: () => undefined });
      await user.type(field(), "canada");
      expect(screen.queryByRole("option", { name: /Create/ })).toBeNull();
    });
  });

  describe("states", () => {
    it("is inert when disabled: no list, no remove buttons, nothing submitted", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" disabled defaultValue={["ca"]} />
        </form>,
      );
      expect(field()).toBeDisabled();
      await user.click(field());
      expect(list()).toBeNull();
      expect(screen.queryByRole("button", { name: "Remove Canada" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Toggle options" })).toBeNull();
      expect(hiddenValues(screen.getByTestId("form"))).toEqual([]);
    });

    it("keeps the chips readable but locked when read-only", async () => {
      const user = userEvent.setup();
      setup({ readOnly: true, defaultValue: ["ca", "us"] });
      await user.click(field());
      expect(list()).toBeNull();
      expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
      field().focus();
      await user.keyboard("{ArrowDown}");
      expect(list()).toBeNull();
    });

    it("still submits the values of a read-only field", () => {
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" readOnly defaultValue={["ca", "us"]} />
        </form>,
      );
      expect(hiddenValues(screen.getByTestId("form"))).toEqual(["ca", "us"]);
    });

    it("marks an error", () => {
      setup({ hasError: true });
      expect(field()).toHaveAttribute("aria-invalid", "true");
    });

    it("shows a spinner and a message while loading, and an error note", async () => {
      const user = userEvent.setup();
      const { rerender } = setup({ options: [], loading: true });
      await user.click(field());
      expect(screen.getByRole("option", { name: "Loading…" })).toBeInTheDocument();
      expect(list()).toHaveAttribute("aria-busy", "true");
      rerender(<MultiSelect aria-label="Countries" options={countries} loading error />);
      expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    });

    it("shows content of the owner's for an empty result", async () => {
      const user = userEvent.setup();
      setup({ emptyContent: "Nobody ships there" });
      await user.type(field(), "zzz");
      expect(screen.getByRole("option", { name: "Nobody ships there" })).toBeInTheDocument();
    });

    it("draws an option with renderOption", async () => {
      const user = userEvent.setup();
      setup({ renderOption: (option, state) => <span>{`${option.label}${state.selected ? " ✓" : ""}`}</span>, defaultValue: ["ca"] });
      await user.click(field());
      expect(screen.getByRole("option", { name: "Canada ✓" })).toBeInTheDocument();
    });
  });

  describe("announcements", () => {
    const status = () => screen.getAllByRole("status").map((node) => node.textContent).join(" ");

    it("announces a choice and a removal with the count", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      await waitFor(() => expect(status()).toContain("Canada selected, 1 selected"));
      await user.click(screen.getByRole("button", { name: "Remove Canada" }));
      await waitFor(() => expect(status()).toContain("Canada removed, 0 selected"));
    });

    it("announces the number of matches as the person types, but not when the list merely opens", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      expect(status()).toBe("");
      await user.type(field(), "u");
      await waitFor(() => expect(status()).toContain("3 results available"));
      await user.type(field(), "zz");
      await waitFor(() => expect(status()).toContain("No results"));
    });

    it("writes numbers with formatNumber", async () => {
      const user = userEvent.setup();
      setup({ formatNumber: (n) => `#${n}` });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      await waitFor(() => expect(status()).toContain("Canada selected, #1 selected"));
    });

    it("replaces only the labels it is given, even when one is undefined", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: ["ca"], labels: { clear: "Empty it", remove: undefined } });
      expect(screen.getByRole("button", { name: "Empty it" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Canada" })).toBeInTheDocument();
      await user.click(field());
    });
  });

  describe("forms", () => {
    it("submits each chosen value as its own entry under the name", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" defaultValue={["us"]} />
        </form>,
      );
      const form = screen.getByTestId("form");
      expect(hiddenValues(form)).toEqual(["us"]);
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(hiddenValues(form)).toEqual(["us", "uy"]);
      expect(field()).not.toHaveAttribute("name");
    });

    it("refuses a required field with nothing chosen", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" required />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      expect(field().validationMessage).toBe("Choose at least one option");
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(form.checkValidity()).toBe(true);
      expect(field()).toHaveAttribute("aria-required", "true");
    });

    it("makes the entry itself the field's constraint, so the browser focuses it", () => {
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" required />
        </form>,
      );
      expect(field().validity.customError).toBe(true);
      expect(field().willValidate).toBe(true);
      expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });

    it("keeps the name in the form's controls when nothing is chosen, without submitting anything", () => {
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.elements.namedItem("country")).not.toBeNull();
      expect(hiddenValues(form)).toEqual([]);
    });

    it("submits the values of a field outside its form through form=", () => {
      render(
        <>
          <form id="f" data-testid="form" />
          <MultiSelect aria-label="Countries" options={countries} name="country" form="f" defaultValue={["ca", "us"]} />
        </>,
      );
      expect(hiddenValues(screen.getByTestId("form"))).toEqual(["ca", "us"]);
    });

    const inForm = (props: Partial<MultiSelectProps> = {}) =>
      render(
        <Form onSubmit={() => undefined}>
          <FormField name="country" label="Countries" helperText="Where it ships" required>
            {(fieldProps) => <MultiSelect {...fieldProps} name="country" options={countries} {...props} />}
          </FormField>
          <Form.Submit>Send</Form.Submit>
        </Form>,
      );

    it("is refused empty by a Form, which shows its message and focuses the entry", async () => {
      const user = userEvent.setup();
      inForm();
      await user.click(screen.getByRole("button", { name: "Send" }));
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Choose at least one option");
      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-invalid", "true");
      expect(field().getAttribute("aria-describedby")).toContain(alert.id);
    });

    it("is named by the FormField's label, and a press on the label focuses the entry", async () => {
      const user = userEvent.setup();
      inForm();
      expect(field()).toHaveAccessibleName(/Countries/);
      await user.click(screen.getByText("Countries"));
      expect(field()).toHaveFocus();
    });

    it("sends the chosen values when the Form submits", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <FormField name="country" label="Countries" required>
            {(fieldProps) => <MultiSelect {...fieldProps} name="country" options={countries} />}
          </FormField>
          <Form.Submit>Send</Form.Submit>
        </Form>,
      );
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      await user.click(screen.getByRole("option", { name: "Canada" }));
      await user.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(JSON.stringify(onSubmit.mock.calls[0]?.[0])).toContain("uy");
    });
  });

  describe("the look of a chip", () => {
    const toned: MultiSelectOption[] = [
      { value: "ok", label: "Done", tone: "success", chipIcon: GlobeIcon },
      { value: "bad", label: "Blocked", tone: "danger" },
      { value: "plain", label: "Open" },
    ];

    it("draws a chip in its option's own tone and icon, and the field's tone for the rest", () => {
      setup({ options: toned, defaultValue: ["ok", "bad", "plain"], tone: "info" });
      const chip = (label: string) => screen.getByText(label).closest("span[class*=root]") as HTMLElement;
      expect(chip("Done").className).toMatch(/Success/);
      expect(chip("Blocked").className).toMatch(/Danger/);
      expect(chip("Open").className).toMatch(/Info/);
      expect(chip("Done").querySelector("svg")).not.toBeNull();
      expect(chip("Open").querySelectorAll("svg")).toHaveLength(1);
    });

    it("keeps the list's own icon out of the chip", async () => {
      const user = userEvent.setup();
      setup({ options: [{ value: "a", label: "Alpha", icon: GlobeIcon }], defaultValue: ["a"] });
      expect(screen.getByText("Alpha").closest("span[class*=root]")?.querySelectorAll("svg")).toHaveLength(1);
      await user.click(field());
      expect(screen.getByRole("option", { name: "Alpha" }).querySelectorAll("svg").length).toBeGreaterThan(0);
    });

    it("draws what renderValue returns in place of the text, with the label still naming the chip", () => {
      setup({
        options: toned,
        defaultValue: ["ok", "zz"],
        renderValue: (option, chosen) => <b data-testid={`value-${chosen}`}>{option ? `${option.label}!` : `?${chosen}`}</b>,
      });
      expect(screen.getByTestId("value-ok")).toHaveTextContent("Done!");
      expect(screen.getByTestId("value-zz")).toHaveTextContent("?zz");
      expect(screen.getByRole("button", { name: "Remove Done" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove zz" })).toBeInTheDocument();
    });

    it("keeps the tone and icon of a chosen value whose option has left the list", () => {
      const { rerender } = setup({ options: toned, value: ["ok"] });
      rerender(<MultiSelect aria-label="Countries" options={[]} value={["ok"]} />);
      expect(screen.getByText("Done").closest("span[class*=root]")?.className).toMatch(/Success/);
    });
  });

  describe("reordering the chips", () => {
    const three = ["ca", "us", "uy"];
    const reorderable = (props: Partial<MultiSelectProps> = {}) => setup({ reorderable: true, defaultValue: three, ...props });

    it("picks a chip up with Space, moves it with the arrow keys and drops it with Space", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      reorderable({ onValueChange });
      field().focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove United States" })).toHaveFocus();
      await user.keyboard(" ");
      expect(screen.getByText("United States").closest("li")).toHaveAttribute("data-lifted", "true");
      await user.keyboard("{ArrowRight}");
      expect(chips()).toEqual(["Canada", "Uruguay", "United States"]);
      expect(onValueChange).toHaveBeenLastCalledWith(["ca", "uy", "us"], expect.objectContaining({ source: "reorder" }));
      // the chip kept its element, so focus stayed with it
      expect(screen.getByRole("button", { name: "Remove United States" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(chips()).toEqual(["United States", "Canada", "Uruguay"]);
      await user.keyboard(" ");
      expect(screen.getByText("United States").closest("li")).not.toHaveAttribute("data-lifted");
      expect(chips()).toEqual(["United States", "Canada", "Uruguay"]);
    });

    it("puts the chip back with Escape, and leaves the field's own Escape alone", async () => {
      const user = userEvent.setup();
      reorderable();
      field().focus();
      await user.keyboard("{ArrowLeft} {ArrowLeft}{ArrowLeft}");
      expect(chips()).toEqual(["Uruguay", "Canada", "United States"]);
      await user.keyboard("{Escape}");
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
      expect(screen.getByRole("button", { name: "Remove Uruguay" })).toHaveFocus();
    });

    it("moves a chip one place with Alt and an arrow key, without picking it up", async () => {
      const user = userEvent.setup();
      reorderable();
      field().focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}{Alt>}{ArrowLeft}{/Alt}");
      expect(chips()).toEqual(["United States", "Canada", "Uruguay"]);
      expect(screen.getByText("United States").closest("li")).not.toHaveAttribute("data-lifted");
    });

    it("does not remove the chip when Space picks it up, and Enter drops it rather than removing it", async () => {
      const user = userEvent.setup();
      reorderable();
      field().focus();
      await user.keyboard("{ArrowLeft} ");
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
      await user.keyboard("{Enter}");
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
      // with nothing picked up, Enter still removes
      await user.keyboard("{Enter}");
      expect(chips()).toEqual(["Canada", "United States"]);
    });

    it("removes a picked-up chip with Delete, and drops it first", async () => {
      const user = userEvent.setup();
      reorderable();
      field().focus();
      await user.keyboard("{ArrowLeft} {Delete}");
      expect(chips()).toEqual(["Canada", "United States"]);
      expect(document.querySelector("[data-lifted]")).toBeNull();
    });

    it("announces the pick-up, each move, the drop and a cancel with the place", async () => {
      const user = userEvent.setup();
      reorderable();
      const status = () => screen.getAllByRole("status").map((node) => node.textContent).join(" ");
      field().focus();
      await user.keyboard("{ArrowLeft} ");
      await waitFor(() => expect(status()).toContain("Uruguay, position 3 of 3. Use the arrow keys to move it, Space to drop it, Escape to cancel"));
      await user.keyboard("{ArrowLeft}");
      await waitFor(() => expect(status()).toContain("Uruguay moved to position 2 of 3"));
      await user.keyboard(" ");
      await waitFor(() => expect(status()).toContain("Uruguay dropped at position 2 of 3"));
      await user.keyboard(" {ArrowLeft}{Escape}");
      await waitFor(() => expect(status()).toContain("Uruguay moved back to position 2 of 3"));
    });

    it("drops a picked-up chip where it is when focus leaves", async () => {
      const user = userEvent.setup();
      reorderable();
      field().focus();
      await user.keyboard("{ArrowLeft} ");
      expect(document.querySelector("[data-lifted]")).not.toBeNull();
      act(() => field().focus());
      expect(document.querySelector("[data-lifted]")).toBeNull();
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
    });

    it("moves nothing when it is not reorderable, disabled or read-only", async () => {
      const user = userEvent.setup();
      const { rerender } = setup({ defaultValue: three });
      field().focus();
      await user.keyboard("{ArrowLeft}{Alt>}{ArrowLeft}{/Alt}");
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
      expect(document.querySelector("[data-sortable-index]")).toBeNull();
      rerender(<MultiSelect aria-label="Countries" options={countries} reorderable readOnly defaultValue={three} />);
      expect(document.querySelector("[data-sortable-index]")).toBeNull();
    });

    it("submits the values in the new order", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" reorderable defaultValue={three} />
        </form>,
      );
      field().focus();
      await user.keyboard("{ArrowLeft}{Alt>}{ArrowLeft}{ArrowLeft}{/Alt}");
      expect(hiddenValues(screen.getByTestId("form"))).toEqual(["uy", "ca", "us"]);
    });

    it("asks for a move on a drop with the pointer, and keeps the controlled order until the value changes", () => {
      const onValueChange = vi.fn();
      render(<MultiSelect aria-label="Countries" options={countries} reorderable value={three} onValueChange={onValueChange} />);
      const items = [...document.querySelectorAll<HTMLElement>("[data-sortable-index]")];
      items.forEach((item, index) => {
        item.getBoundingClientRect = () => ({ left: index * 100, right: index * 100 + 100, top: 0, bottom: 30, width: 100, height: 30, x: index * 100, y: 0, toJSON: () => ({}) }) as DOMRect;
      });
      fireEvent.pointerDown(items[0] as HTMLElement, { clientX: 50, clientY: 10, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
      act(() => {
        fireEvent(window, new MouseEvent("pointermove", { clientX: 270, clientY: 10 }));
      });
      expect(items[0]).toHaveAttribute("data-dragging", "true");
      act(() => {
        fireEvent(window, new MouseEvent("pointerup", { clientX: 270, clientY: 10 }));
      });
      expect(onValueChange).toHaveBeenCalledWith(["us", "uy", "ca"], expect.objectContaining({ source: "reorder" }));
      expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
    });

    it("keeps a chip's element when its place changes, and copes with the same value twice", () => {
      const { rerender } = render(<MultiSelect aria-label="Countries" options={countries} value={["ca", "us"]} />);
      const before = screen.getByRole("button", { name: "Remove Canada" });
      rerender(<MultiSelect aria-label="Countries" options={countries} value={["us", "ca"]} />);
      expect(screen.getByRole("button", { name: "Remove Canada" })).toBe(before);
      rerender(<MultiSelect aria-label="Countries" options={countries} value={["ca", "ca"]} />);
      expect(chips()).toEqual(["Canada", "Canada"]);
    });
  });

  describe("select all from the page", () => {
    it("asks onSelectAll for the options, waits for a promise, and adds what it returns", async () => {
      const user = userEvent.setup();
      let resolve: (options: MultiSelectOption[]) => void = () => undefined;
      const onSelectAll = vi.fn(() => new Promise<MultiSelectOption[]>((done) => (resolve = done)));
      const onValueChange = vi.fn();
      setup({ selectAll: true, onSelectAll, onValueChange });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(onSelectAll).toHaveBeenCalledWith({ text: "", options: countries.filter((country) => !country.disabled) });
      expect(screen.getByRole("option", { name: "Select all" })).toHaveAttribute("aria-disabled", "true");
      await act(async () => resolve([{ value: "zz", label: "Zedland", tone: "success" }, { value: "yy", label: "Yland" }]));
      expect(chips()).toEqual(["Zedland", "Yland"]);
      expect(onValueChange).toHaveBeenCalledWith(["zz", "yy"], { source: "selectAll", option: undefined });
      // the row still says Select all: it only ever adds
      expect(screen.getByRole("option", { name: "Select all" })).toHaveAttribute("aria-selected", "false");
    });

    it("takes values as strings too, skips what is chosen, and stops at the limit", async () => {
      const user = userEvent.setup();
      setup({ selectAll: true, onSelectAll: () => ["ca", "x1", "x2", "x3"], maxSelected: 3, defaultValue: ["ca"] });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: /Select all/ }));
      expect(chips()).toEqual(["Canada", "x1", "x2"]);
    });

    it("covers the typed text, and says so to onSelectAll", async () => {
      const user = userEvent.setup();
      const onSelectAll = vi.fn(() => []);
      setup({ selectAll: true, onSelectAll });
      await user.type(field(), "uru");
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(onSelectAll).toHaveBeenCalledWith({ text: "uru", options: [countries[4]] });
    });

    it("announces an error and re-enables the row when the promise rejects or the callback throws", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { rerender } = setup({ selectAll: true, onSelectAll: () => Promise.reject(new Error("no")) });
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Select all" }));
      await waitFor(() => expect(screen.getByRole("option", { name: "Select all" })).not.toHaveAttribute("aria-disabled"));
      rerender(<MultiSelect aria-label="Countries" options={countries} selectAll onSelectAll={() => { throw new Error("boom"); }} />);
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`onSelectAll` threw"));
      expect(chips()).toEqual([]);
      warn.mockRestore();
    });

    it("is not offered before there is anything to search or load", async () => {
      const user = userEvent.setup();
      setup({ selectAll: true, onSelectAll: () => [], options: [] });
      await user.click(field());
      expect(screen.queryByRole("option", { name: "Select all" })).toBeNull();
      await user.type(field(), "x");
      expect(screen.getByRole("option", { name: "Select all" })).toBeInTheDocument();
    });
  });

  describe("select all in a group", () => {
    const grouped: MultiSelectOption[] = [
      { value: "a1", label: "Apple", group: "Fruit" },
      { value: "a2", label: "Apricot", group: "Fruit" },
      { value: "a3", label: "Avocado", group: "Fruit", disabled: true },
      { value: "c1", label: "Carrot", group: "Veg" },
      { value: "loose", label: "Salt" },
    ];

    it("puts a row under each group's heading that chooses its enabled options, and removes them again", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ options: grouped, selectGroups: true, onValueChange });
      await user.click(field());
      expect(labelsOf()).toEqual(["Select all in Fruit", "Apple", "Apricot", "Avocado", "Select all in Veg", "Carrot", "Salt"]);
      await user.click(screen.getByRole("option", { name: "Select all in Fruit" }));
      expect(chips()).toEqual(["Apple", "Apricot"]);
      expect(onValueChange).toHaveBeenLastCalledWith(["a1", "a2"], { source: "selectAll", option: undefined });
      expect(screen.getByRole("option", { name: "Deselect all in Fruit" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("option", { name: "Select all in Veg" })).toHaveAttribute("aria-selected", "false");
      await user.click(screen.getByRole("option", { name: "Deselect all in Fruit" }));
      expect(chips()).toEqual([]);
    });

    it("covers only the matches while text is typed, and Enter still chooses the first option", async () => {
      const user = userEvent.setup();
      setup({ options: grouped, selectGroups: true });
      await user.type(field(), "ap");
      expect(labelsOf()).toEqual(["Select all in Fruit", "Apple", "Apricot"]);
      await user.keyboard("{Enter}");
      expect(chips()).toEqual(["Apple"]);
    });

    it("stops at the limit, and can be used from the keyboard", async () => {
      const user = userEvent.setup();
      setup({ options: grouped, selectGroups: true, maxSelected: 1 });
      field().focus();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(chips()).toEqual(["Apple"]);
    });

    it("leaves ungrouped options and a group with nothing to choose without a row", async () => {
      const user = userEvent.setup();
      setup({ options: [{ value: "x", label: "X", group: "Off", disabled: true }, { value: "y", label: "Y" }], selectGroups: true });
      await user.click(field());
      expect(labelsOf()).toEqual(["X", "Y"]);
    });

    it("writes the group's name in its own words with labels", async () => {
      const user = userEvent.setup();
      setup({ options: grouped, selectGroups: true, labels: { selectGroup: (group) => `Todo ${group}` } });
      await user.click(field());
      expect(screen.getByRole("option", { name: "Todo Fruit" })).toBeInTheDocument();
    });
  });

  describe("typed values as chips", () => {
    const custom = (props: Partial<MultiSelectProps> = {}) => setup({ allowCustomValue: true, ...props });

    it("makes a chip of what was typed on Enter, and does not highlight the first match while typing", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      custom({ onValueChange });
      await user.type(field(), "Atlantis");
      expect(field()).not.toHaveAttribute("aria-activedescendant");
      await user.keyboard("{Enter}");
      expect(chips()).toEqual(["Atlantis"]);
      expect(field()).toHaveValue("");
      expect(onValueChange).toHaveBeenCalledWith(["Atlantis"], { source: "custom", option: undefined });
    });

    it("chooses an option when the text is exactly its label, whatever the case", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      custom({ onValueChange });
      await user.type(field(), "canada{Enter}");
      expect(chips()).toEqual(["Canada"]);
      expect(onValueChange).toHaveBeenCalledWith(["ca"], expect.objectContaining({ source: "select", option: expect.objectContaining({ value: "ca" }) }));
    });

    it("chooses the highlighted option instead when one was moved to", async () => {
      const user = userEvent.setup();
      custom();
      await user.type(field(), "uni");
      await user.keyboard("{ArrowDown}{Enter}");
      expect(chips()).toEqual(["United States"]);
    });

    it("makes chips at a separator, keeping what follows it in the entry", async () => {
      const user = userEvent.setup();
      custom();
      await user.type(field(), "red,green,bl");
      expect(chips()).toEqual(["red", "green"]);
      expect(field()).toHaveValue("bl");
    });

    it("splits a paste at the separators and line breaks", async () => {
      const user = userEvent.setup();
      custom({ separators: [",", ";"] });
      field().focus();
      await user.paste("a, b;c\nd");
      expect(chips()).toEqual(["a", "b", "c", "d"]);
      expect(field()).toHaveValue("");
    });

    it("makes a chip of the text when the field is left, but not for an empty entry", async () => {
      const user = userEvent.setup();
      render(
        <>
          <MultiSelect aria-label="Countries" options={countries} allowCustomValue />
          <button type="button">Elsewhere</button>
        </>,
      );
      await user.type(field(), "later");
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(chips()).toEqual(["later"]);
      await user.click(field());
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(chips()).toEqual(["later"]);
    });

    it("refuses a value that is already chosen, with a message that is shown and announced", async () => {
      const user = userEvent.setup();
      custom({ defaultValue: ["red"] });
      await user.type(field(), "red{Enter}");
      expect(chips()).toEqual(["red"]);
      expect(await screen.findByText("red is already chosen")).toBeInTheDocument();
      expect(field()).toHaveAttribute("aria-invalid", "true");
      expect(field().getAttribute("aria-describedby")).toContain(screen.getByText("red is already chosen").id);
      expect(field()).toHaveValue("red");
      await user.type(field(), "x");
      expect(screen.queryByText("red is already chosen")).toBeNull();
    });

    it("refuses a value validate rejects, and one that throws is accepted with a warning", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { rerender } = custom({ validate: (text) => (text.includes("@") ? undefined : "Not an email address") });
      await user.type(field(), "nope{Enter}");
      expect(chips()).toEqual([]);
      expect(screen.getByText("Not an email address")).toBeInTheDocument();
      await user.clear(field());
      await user.type(field(), "me@example.com{Enter}");
      expect(chips()).toEqual(["me@example.com"]);
      rerender(<MultiSelect aria-label="Countries" options={countries} allowCustomValue validate={() => { throw new Error("x"); }} />);
      await user.type(field(), "fine{Enter}");
      expect(chips()).toEqual(["me@example.com", "fine"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`validate` threw"));
      warn.mockRestore();
    });

    it("refuses a value past the limit, and the text of a disabled option", async () => {
      const user = userEvent.setup();
      custom({ maxSelected: 1, defaultValue: ["a"] });
      await user.type(field(), "b{Enter}");
      expect(chips()).toEqual(["a"]);
      expect(screen.getByText("No more than 1 can be selected")).toBeInTheDocument();
      await user.clear(field());
      await user.type(field(), "mexico{Enter}");
      expect(chips()).toEqual(["a"]);
    });

    it("gives the disabled option's own reason", async () => {
      const user = userEvent.setup();
      custom();
      await user.type(field(), "Mexico{Enter}");
      expect(chips()).toEqual([]);
      expect(screen.getByText("Not shipping there yet")).toBeInTheDocument();
    });

    it("submits a typed value as it was typed, and clears the message with Escape", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" allowCustomValue defaultValue={["x"]} />
        </form>,
      );
      await user.type(field(), "free text{Enter}");
      expect(hiddenValues(screen.getByTestId("form"))).toEqual(["x", "free text"]);
      await user.type(field(), "x{Enter}");
      expect(screen.getByText("x is already chosen")).toBeInTheDocument();
      await user.keyboard("{Escape}{Escape}");
      expect(screen.queryByText("x is already chosen")).toBeNull();
    });

    it("does nothing with Enter on empty text, and leaves the field alone without allowCustomValue", async () => {
      const user = userEvent.setup();
      const { rerender } = custom();
      await user.type(field(), "{Enter}");
      expect(chips()).toEqual([]);
      rerender(<MultiSelect aria-label="Countries" options={countries} />);
      await user.type(field(), "zzz,{Enter}");
      expect(chips()).toEqual([]);
    });

    it("works with the Create row too: Enter commits the text, and the row is still there to choose", async () => {
      const user = userEvent.setup();
      custom({ onCreate: (text) => ({ value: `made-${text}`, label: `Made ${text}` }) });
      await user.type(field(), "foo");
      await user.click(screen.getByRole("option", { name: "Create “foo”" }));
      expect(chips()).toEqual(["Made foo"]);
      await user.type(field(), "bar{Enter}");
      expect(chips()).toEqual(["Made foo", "bar"]);
    });

    it("leaves the first match highlighted while typing when autoHighlight is asked for", async () => {
      const user = userEvent.setup();
      custom({ autoHighlight: true });
      await user.type(field(), "uru{Enter}");
      expect(chips()).toEqual(["Uruguay"]);
    });
  });

  describe("collapsing the chips", () => {
    it("collapses to maxVisible chips and a +N more button while the field is not in use", async () => {
      const user = userEvent.setup();
      setup({ maxVisible: 2, defaultValue: ["ca", "cu", "us", "uy"] });
      expect(chips()).toEqual(["Canada", "Curaçao"]);
      const more = screen.getByRole("button", { name: "+2 more" });
      expect(more).toHaveAttribute("aria-expanded", "false");
      await user.click(more);
      expect(chips()).toHaveLength(4);
      expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
    });

    it("shows every chip while the entry has focus, and collapses again when it leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <MultiSelect aria-label="Countries" options={countries} maxVisible={1} defaultValue={["ca", "cu", "us"]} />
          <button type="button">Elsewhere</button>
        </>,
      );
      await user.click(field());
      expect(chips()).toHaveLength(3);
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(chips()).toEqual(["Canada"]);
    });

    it("submits every value even while chips are hidden", () => {
      render(
        <form data-testid="form">
          <MultiSelect aria-label="Countries" options={countries} name="country" maxVisible={1} defaultValue={["ca", "cu", "us"]} />
        </form>,
      );
      expect(hiddenValues(screen.getByTestId("form"))).toEqual(["ca", "cu", "us"]);
    });

    it("draws an unseen copy of every chip to measure in collapse mode", () => {
      const { container } = setup({ overflow: "collapse", defaultValue: ["ca", "us"] });
      expect(container.querySelector('[aria-hidden="true"] > div')).not.toBeNull();
    });
  });

  describe("the controller", () => {
    it("opens, closes, clears and focuses from code, and says whether it did anything", () => {
      const controllerRef = createRef<MultiSelectController>();
      setup({ controllerRef, defaultValue: ["ca"] });
      const controller = controllerRef.current as MultiSelectController;
      expect(controller.close()).toBe(false);
      act(() => {
        expect(controller.open()).toBe(true);
      });
      expect(list()).not.toBeNull();
      expect(controllerRef.current).toBe(controller);
      expect(controller.open()).toBe(false);
      act(() => {
        expect(controller.focus()).toBe(true);
      });
      expect(field()).toHaveFocus();
      act(() => {
        expect(controller.clear()).toBe(true);
      });
      expect(chips()).toEqual([]);
      expect(controller.clear()).toBe(false);
      act(() => {
        expect(controller.close()).toBe(true);
      });
      expect(list()).toBeNull();
    });

    it("does nothing while the field is disabled", () => {
      const controllerRef = createRef<MultiSelectController>();
      setup({ controllerRef, disabled: true, defaultValue: ["ca"] });
      expect(controllerRef.current?.open()).toBe(false);
      expect(controllerRef.current?.clear()).toBe(false);
      expect(controllerRef.current?.focus()).toBe(false);
    });
  });

  describe("accessibility", () => {
    it("has no axe violations closed, open, with chips, groups and in each state", async () => {
      const user = userEvent.setup();
      const { container, rerender } = setup({ name: "country", required: true, defaultValue: ["ca"], selectAll: true });
      expect(await axe(container)).toHaveNoViolations();
      await user.click(field());
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
      rerender(
        <MultiSelect
          aria-label="Countries"
          options={countries.map((option) => ({ ...option, group: "North" }))}
          loading
          error
          maxVisible={1}
          defaultValue={["ca", "us"]}
        />,
      );
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
      rerender(<MultiSelect aria-label="Countries" options={[]} disabled />);
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
    });

    it("gives every chip's remove button a name that holds the chip's text", () => {
      setup({ defaultValue: ["ca", "us"] });
      for (const text of ["Canada", "United States"]) {
        expect(screen.getByRole("button", { name: `Remove ${text}` })).toHaveAccessibleName(new RegExp(text));
      }
    });

    it("describes the entry with how to reach the chips once there are some", () => {
      const { rerender } = setup({ value: [] });
      expect(field()).not.toHaveAttribute("aria-describedby");
      rerender(<MultiSelect aria-label="Countries" options={countries} value={["ca"]} aria-describedby="help" />);
      const describedBy = field().getAttribute("aria-describedby") ?? "";
      expect(describedBy).toContain("help");
      const hint = document.getElementById(describedBy.split(" ").at(-1) ?? "");
      expect(hint).toHaveTextContent("Use the left arrow key to move to the chosen options");
    });

    it("states list roles outright for Safari", () => {
      setup({ defaultValue: ["ca"] });
      const chosen = screen.getByRole("list", { name: "Selected options" });
      expect(chosen).toHaveAttribute("role", "list");
      expect(within(chosen).getAllByRole("listitem")).toHaveLength(1);
    });
  });

  describe("robustness", () => {
    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <MultiSelect aria-label="Countries" options={countries} onValueChange={onValueChange} />
        </StrictMode>,
      );
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(chips()).toEqual(["Canada"]);
    });

    it("works under StrictMode in collapse mode", () => {
      render(
        <StrictMode>
          <MultiSelect aria-label="Countries" options={countries} overflow="collapse" defaultValue={["ca", "us"]} />
        </StrictMode>,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("copes with options that change while open and with no options at all", async () => {
      const user = userEvent.setup();
      const { rerender } = setup({ options: undefined });
      await user.click(field());
      expect(screen.getByRole("option", { name: "Type to search" })).toBeInTheDocument();
      rerender(<MultiSelect aria-label="Countries" options={countries} />);
      expect(labelsOf()).toHaveLength(5);
    });
  });

  describe("development warnings", () => {
    it("warns once about a field with no accessible name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<MultiSelect options={countries} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("MultiSelect: no accessible name"));
      warn.mockRestore();
    });

    it("warns about two options with one value, and about value with defaultValue", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      setup({ options: [...countries, { value: "ca", label: "Again" }], value: ["ca"], defaultValue: ["us"] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('more than one option has the value "ca"'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("both `value` and `defaultValue`"));
      warn.mockRestore();
    });
  });

  describe("the container", () => {
    it("draws the list inside the element it is given", async () => {
      const user = userEvent.setup();
      const host = document.createElement("div");
      document.body.appendChild(host);
      setup({ container: host });
      await user.click(field());
      expect(host).toContainElement(list());
      host.remove();
    });
  });
});
