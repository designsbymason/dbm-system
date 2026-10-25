import { GlobeIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Popover } from "../../molecules/Popover";
import { TagsInput } from "../../molecules/TagsInput";
import { Dialog } from "../Dialog";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectSize } from "./MultiSelect.types";
import { countries, manyOptions, people } from "./MultiSelectStoryKit";

// Real-browser checks for what jsdom can't evaluate: where the list is drawn, a real mouse inside a Dialog and a
// Popover, windowing, the cascade, forced colours and the layout of the field. Hidden from the sidebar and the Docs
// page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/MultiSelect/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
const field = () => body().getByRole("combobox") as HTMLInputElement;
const option = (name: string | RegExp) => body().findByRole("option", { name });
const chips = () => {
  const chosen = body().queryByRole("list", { name: "Selected options" });
  return chosen ? within(chosen).queryAllByRole("listitem").map((item) => item.textContent) : [];
};
const boxOf = (entry: HTMLElement) => entry.closest("[class*=box]") as HTMLElement;

// A measurement taken while the list is still fading in is wrong by the easing's distance.
const settled = async (list: HTMLElement) => {
  await nextFrame();
  const panel = list.closest("[data-radix-popper-content-wrapper]")?.firstElementChild as HTMLElement | null;
  await Promise.all((panel?.getAnimations() ?? []).map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const panelOf = (list: HTMLElement) => list.closest("[data-radix-popper-content-wrapper]") as HTMLElement;

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which a layer
// that disables the pointer outside it (a Dialog) never meets. The test page scales its iframe, so a point inside
// the story is mapped to the page it is drawn on.
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

// The same, as a press that moves: down on `from`, a few steps, up at `to`, with a pause between so a layout that
// follows the pointer has settled. `during` runs while the button is still down.
async function realDrag(from: Element, to: { x: number; y: number }, during?: () => Promise<void> | void) {
  const rect = from.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const at = (x: number, y: number) => ({ x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale });
  const start = at(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const end = at(to.x, to.y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...start });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...start, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    const x = start.x + ((end.x - start.x) * step) / 6;
    const y = start.y + ((end.y - start.y) * step) / 6;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 });
    await nextFrame();
  }
  await during?.();
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...end, button: "left", clickCount: 1 });
  await nextFrame();
}

// The page's own button: somewhere neutral for the pointer to rest between checks.
const aside = (
  <Button variant="secondary" data-testid="aside">
    Elsewhere
  </Button>
);

function Page({ children, width = "26rem" }: { children: React.ReactNode; width?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)", maxWidth: width, minHeight: "30rem" }}>
      {aside}
      {children}
    </div>
  );
}

export const ListSitsUnderTheField: Story = {
  name: "The list sits under the whole field, as wide as it, and above everything on the page",
  render: () => (
    <Page>
      <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca", "us", "uy", "jp", "no"]} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = await body().findByRole("listbox");
    await settled(list);
    // the anchor is the whole field, however many lines of chips it has
    const anchor = field().closest("[dir]") as HTMLElement;
    const a = anchor.getBoundingClientRect();
    const p = list.parentElement?.getBoundingClientRect() as DOMRect;
    await expect(Math.abs(p.left - a.left)).toBeLessThan(1.5);
    await expect(Math.abs(p.width - a.width)).toBeLessThan(1.5);
    await expect(p.top - a.bottom).toBeGreaterThanOrEqual(2);
    await expect(p.top - a.bottom).toBeLessThanOrEqual(8);
    const first = await option("Argentina");
    const r = first.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + 4, r.top + 4)).toBe(first);
    await expect(getComputedStyle(panelOf(list).firstElementChild as HTMLElement).fontFamily).toBe(getComputedStyle(field()).fontFamily);
  },
};

export const PointerPicksSeveralInADialog: Story = {
  name: "Options chosen with a real mouse in a MultiSelect inside a Dialog, which stays open with the list",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a multi-select">
        <Dialog.Body>
          <MultiSelect aria-label="Countries" options={countries} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("combobox"));
    const brazil = await option("Brazil");
    await nextFrame();
    const r = brazil.getBoundingClientRect();
    // the list is above the dialog's scrim and takes the pointer
    await expect(document.elementFromPoint(r.left + 4, r.top + 4)).toBe(brazil);
    await realClick(brazil);
    await realClick(await option("Chile"));
    await waitFor(() => expect(chips()).toEqual(["Brazil", "Chile"]));
    await expect(body().getByRole("listbox")).toBeInTheDocument();
    await expect(body().getByRole("dialog", { name: "With a multi-select" })).toBeInTheDocument();
    await expect(field()).toHaveFocus();
    // a chip's remove button works with a real mouse too, and hands the typing back to the entry
    await realClick(body().getByRole("button", { name: "Remove Brazil" }));
    await waitFor(() => expect(chips()).toEqual(["Chile"]));
    await expect(field()).toHaveFocus();
  },
};

export const EscapeClosesTheListThenTheDialog: Story = {
  name: "Escape closes the list first, and a second Escape closes the Dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a multi-select">
        <Dialog.Body>
          <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca"]} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await userEvent.click(await body().findByRole("combobox"));
    await body().findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(body().getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

export const PointerPicksInAPopover: Story = {
  name: "Options chosen with a real mouse in a MultiSelect inside a Popover, which stays open",
  render: () => (
    <Page>
      <Popover defaultOpen>
        <Popover.Trigger asChild>
          <Button>Filters</Button>
        </Popover.Trigger>
        <Popover.Content aria-label="Filters">
          <MultiSelect aria-label="Countries" options={countries} />
        </Popover.Content>
      </Popover>
    </Page>
  ),
  play: async () => {
    await realClick(await body().findByRole("combobox"));
    const target = await option("Chile");
    await nextFrame();
    const r = target.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + 4, r.top + 4)).toBe(target);
    await realClick(target);
    await waitFor(() => expect(chips()).toEqual(["Chile"]));
    await expect(body().getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  },
};

export const PressesInAndOutOfTheField: Story = {
  name: "A press on the field keeps the list open; a press elsewhere closes it and drops the typed text",
  render: () => (
    <Page>
      <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca"]} />
    </Page>
  ),
  play: async () => {
    await realClick(field());
    await body().findByRole("listbox");
    await userEvent.keyboard("zz");
    await realClick(field());
    await expect(body().getByRole("listbox")).toBeInTheDocument();
    await realClick(body().getByTestId("aside"));
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(field()).toHaveValue("");
    await expect(chips()).toEqual(["Canada"]);
  },
};

export const InsertedTextAtOnce: Story = {
  name: "Text inserted all at once, as a phone or a paste sends it, narrows the list",
  render: () => (
    <Page>
      <MultiSelect aria-label="Countries" options={countries} />
    </Page>
  ),
  play: async () => {
    field().focus();
    await send("Input.insertText", { text: "uru" });
    await waitFor(() => expect(field()).toHaveValue("uru"));
    const list = await body().findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    await expect(within(list).getByRole("option")).toHaveTextContent("Uruguay");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(chips()).toEqual(["Uruguay"]));
    await send("Input.insertText", { text: "xx" });
    await expect(await body().findByRole("option", { name: "No results" })).toBeInTheDocument();
  },
};

export const KeyboardEndToEnd: Story = {
  name: "The keyboard picks, reaches the chips, leaves and returns, with one tab stop",
  render: () => (
    <Page>
      <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca", "us"]} />
      <Button variant="secondary" data-testid="after">
        After
      </Button>
    </Page>
  ),
  play: async () => {
    body().getByTestId("aside").focus();
    await userEvent.tab();
    await expect(field()).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await body().findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(chips()).toEqual(["Canada", "United States", "Australia"]));
    // the chips, the caret and the clear buttons are not tab stops
    await userEvent.tab();
    await expect(body().getByTestId("after")).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(field()).toHaveFocus();
    // the left arrow reaches the chips, and Backspace there removes one and keeps the place
    await userEvent.keyboard("{Escape}{ArrowLeft}");
    await expect(body().getByRole("button", { name: "Remove Australia" })).toHaveFocus();
    await userEvent.keyboard("{Backspace}");
    await waitFor(() => expect(chips()).toEqual(["Canada", "United States"]));
    await expect(body().getByRole("button", { name: "Remove United States" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(field()).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(body().getByTestId("aside")).toHaveFocus();
  },
};

export const LongListIsWindowed: Story = {
  name: "A list of two thousand options draws a window of rows, scrolls true, and keeps the highlighted option in view",
  render: () => (
    <Page>
      <MultiSelect aria-label="Items" options={manyOptions} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    const rowHeight = parseFloat(getComputedStyle(await option("Item 1")).blockSize);
    const drawn = within(list).getAllByRole("option").length;
    await expect(drawn).toBeLessThan(60);
    await expect(drawn).toBeGreaterThan(5);
    await expect(list.scrollHeight).toBeGreaterThan(rowHeight * 1999);
    await expect(list.scrollHeight).toBeLessThan(rowHeight * 2001 + 4);
    // ArrowUp from nothing highlighted wraps to the last option and brings it into view
    await userEvent.keyboard("{ArrowUp}");
    const last = await option("Item 2000");
    await waitFor(() => expect(field()).toHaveAttribute("aria-activedescendant", last.id));
    const listBox = list.getBoundingClientRect();
    const row = last.getBoundingClientRect();
    await expect(row.top).toBeGreaterThanOrEqual(listBox.top - 1);
    await expect(row.bottom).toBeLessThanOrEqual(listBox.bottom + 1);
    // choosing it leaves the list open and the highlight where it was
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(chips()).toEqual(["Item 2000"]));
    await expect(body().getByRole("listbox")).toBeInTheDocument();
    await expect(field()).toHaveAttribute("aria-activedescendant", last.id);
  },
};

export const FieldMatchesTagsInput: Story = {
  name: "The box is as tall as a TagsInput at every size, with or without chips and buttons",
  render: () => (
    <Page width="36rem">
      {(["xs", "sm", "md", "lg", "xl"] as MultiSelectSize[]).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <TagsInput aria-label={`Tags empty ${size}`} size={size} />
          <MultiSelect aria-label={`Empty ${size}`} size={size} options={countries} />
          <TagsInput aria-label={`Tags chips ${size}`} size={size} defaultValue={["Canada"]} />
          <MultiSelect aria-label={`Chips ${size}`} size={size} options={countries} defaultValue={["ca"]} loading />
        </div>
      ))}
    </Page>
  ),
  play: async () => {
    const outer = (element: HTMLElement) => boxOf(element).getBoundingClientRect().height;
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const emptyReference = outer(body().getByRole("group", { name: `Tags empty ${size}` }));
      await expect(Math.abs(outer(body().getByRole("combobox", { name: `Empty ${size}` })) - emptyReference)).toBeLessThan(1.5);
      const chipsReference = outer(body().getByRole("group", { name: `Tags chips ${size}` }));
      await expect(Math.abs(outer(body().getByRole("combobox", { name: `Chips ${size}` })) - chipsReference)).toBeLessThan(1.5);
    }
  },
};

export const ButtonsStayCentred: Story = {
  name: "The caret and clear buttons are 24 by 24 pixels or more, and stay centred on a box of several lines",
  render: () => (
    <Page width="20rem">
      {(["xs", "sm", "md", "lg", "xl"] as MultiSelectSize[]).map((size) => (
        <MultiSelect key={size} aria-label={`Field ${size}`} size={size} options={people} defaultValue={["ada", "grace", "alan", "katherine"]} />
      ))}
    </Page>
  ),
  play: async () => {
    for (const entry of body().getAllByRole("combobox")) {
      const box = boxOf(entry).getBoundingClientRect();
      const root = entry.closest("[dir]") as HTMLElement;
      for (const name of ["Clear all", "Toggle options"]) {
        const button = within(root).getByRole("button", { name }).getBoundingClientRect();
        await expect(button.width).toBeGreaterThanOrEqual(23.5);
        await expect(button.height).toBeGreaterThanOrEqual(23.5);
        await expect(Math.abs(button.top + button.height / 2 - (box.top + box.height / 2))).toBeLessThan(1.5);
        // inside the box, at its end
        await expect(button.right).toBeLessThanOrEqual(box.right + 0.5);
      }
    }
    // a chip's remove button is a 24px target through its hit area
    const remove = body().getAllByRole("button", { name: "Remove Ada Lovelace" })[0] as HTMLElement;
    const r = remove.getBoundingClientRect();
    for (const dx of [-11, 11]) {
      const hit = document.elementFromPoint(r.left + r.width / 2 + dx, r.top + r.height / 2);
      await expect(hit === remove || remove.contains(hit)).toBe(true);
    }
  },
};

export const CollapsedRowIsOneLine: Story = {
  name: "A collapsed field is one line with a +N more button, and shows every chip while it has focus",
  render: () => (
    <Page width="22rem">
      <MultiSelect aria-label="Assignees" options={people} overflow="collapse" defaultValue={["ada", "grace", "alan", "katherine", "margaret"]} />
      <MultiSelect aria-label="Reference" options={people} defaultValue={["ada"]} />
    </Page>
  ),
  play: async () => {
    const collapsed = body().getByRole("combobox", { name: "Assignees" });
    const reference = body().getByRole("combobox", { name: "Reference" });
    const box = boxOf(collapsed);
    await waitFor(() => expect(within(box).getByRole("button", { name: /^\+\d+ more$/ })).toBeInTheDocument());
    // one line: as tall as a field holding one chip
    await expect(Math.abs(box.getBoundingClientRect().height - boxOf(reference).getBoundingClientRect().height)).toBeLessThan(1.5);
    // nothing is cut off the end of the row
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
    // with the keyboard in it, every chip is there, and the chip with focus keeps it
    collapsed.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(within(box).getByRole("button", { name: "Remove Margaret Hamilton" })).toHaveFocus();
    await expect(within(box).getAllByRole("listitem").filter((item) => item.textContent).length).toBe(5);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(within(box).getByRole("button", { name: "Remove Katherine Johnson" })).toHaveFocus();
    // leaving collapses it again
    body().getByTestId("aside")?.focus();
    reference.focus();
    await waitFor(() => expect(within(box).queryByRole("button", { name: "Remove Katherine Johnson" })).toBeNull());
  },
};

export const FullWidthOnAPhone: Story = {
  name: "A full-width list spans the screen a gap in from each edge, above or below the field",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)", minHeight: "40rem" }}>
      <MultiSelect aria-label="Items" options={manyOptions} presentation={{ base: "full-width", sm: "anchored" }} />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(500);
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    await waitFor(() => {
      const box = (list.parentElement as HTMLElement).getBoundingClientRect();
      expect(Math.abs(box.left - 8)).toBeLessThan(1.5);
      expect(Math.abs(window.innerWidth - box.right - 8)).toBeLessThan(1.5);
    });
    const box = (list.parentElement as HTMLElement).getBoundingClientRect();
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await realClick(await option("Item 3"));
    await waitFor(() => expect(chips()).toEqual(["Item 3"]));
  },
};

export const FieldFitsAPhone: Story = {
  name: "On a phone chips and the entry stay inside the box, and the list stays inside the screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <MultiSelect
        aria-label="Assignees"
        options={[{ value: "long", label: "Someone with a very long name that will not fit on one line of a phone" }, ...people]}
        defaultValue={["long", "ada"]}
      />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(500);
    const box = boxOf(field());
    const frame = box.getBoundingClientRect();
    for (const chip of within(box).getAllByRole("listitem")) {
      const r = chip.getBoundingClientRect();
      if (r.width === 0) continue;
      await expect(r.left).toBeGreaterThanOrEqual(frame.left - 0.5);
      await expect(r.right).toBeLessThanOrEqual(frame.right + 0.5);
    }
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    const panel = list.parentElement?.getBoundingClientRect() as DOMRect;
    await expect(panel.left).toBeGreaterThanOrEqual(0);
    await expect(panel.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
  },
};

export const InRightToLeft: Story = {
  name: "In a right-to-left page the list lines up with the field's start edge, and the arrow keys are flipped",
  render: () => (
    <div dir="rtl" style={{ padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "26rem" }}>
      <MultiSelect aria-label="Countries" options={countries} dir="rtl" defaultValue={["ca", "us"]} />
    </div>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = await body().findByRole("listbox");
    await settled(list);
    const anchor = (field().closest("[dir]") as HTMLElement).getBoundingClientRect();
    const panel = (list.parentElement as HTMLElement).getBoundingClientRect();
    await expect(Math.abs(panel.right - anchor.right)).toBeLessThan(1.5);
    await expect(getComputedStyle(list).direction).toBe("rtl");
    // the first chip is at the right edge, the buttons at the left
    const box = boxOf(field()).getBoundingClientRect();
    const first = body().getAllByRole("listitem")[1]?.getBoundingClientRect() as DOMRect;
    await expect(box.right - first.right).toBeLessThan(box.width / 2);
    const caret = body().getByRole("button", { name: "Toggle options" }).getBoundingClientRect();
    await expect(caret.left - box.left).toBeLessThan(box.width / 4);
    // the arrow toward the chips is the right one
    await userEvent.keyboard("{Escape}{ArrowLeft}");
    await expect(field()).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(body().getByRole("button", { name: "Remove United States" })).toHaveFocus();
  },
};

export const ForcedColours: Story = {
  name: "In forced colours the highlighted row is outlined, the list keeps its border, and a chosen row is readable",
  render: () => (
    <Page>
      <MultiSelect aria-label="Countries" options={countries} defaultValue={["ca"]} />
    </Page>
  ),
  play: async () => {
    // A dark scheme as well: forced colours on a dark page is where a row that keeps its authored light fill and is
    // drawn in the page's light text colour becomes unreadable.
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", {
        features: [
          { name: "forced-colors", value },
          { name: "prefers-color-scheme", value: value === "active" ? "dark" : "light" },
        ],
      });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      await userEvent.click(field());
      const list = await body().findByRole("listbox");
      await settled(list);
      // move the highlight onto the chosen option: it is then both selected and highlighted
      await userEvent.keyboard("{ArrowDown}");
      const chosen = list.querySelector<HTMLElement>("[data-selected]") as HTMLElement;
      await userEvent.hover(chosen);
      await waitFor(() => expect(chosen).toHaveAttribute("data-highlighted"));
      await expect(getComputedStyle(chosen).forcedColorAdjust).not.toBe("none");
      const style = getComputedStyle(chosen);
      await expect(contrast(style.color, style.backgroundColor === "rgba(0, 0, 0, 0)" ? "rgb(0, 0, 0)" : style.backgroundColor)).toBeGreaterThanOrEqual(7);
      await waitFor(() => expect(getComputedStyle(chosen).outlineStyle).toBe("solid"));
      await expect(getComputedStyle(panelOf(list).firstElementChild as HTMLElement).borderTopStyle).toBe("solid");
      // the box keeps a visible border and the chip is drawn
      await expect(getComputedStyle(boxOf(field())).borderTopStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

// WCAG relative luminance and contrast of two CSS `rgb()` colours, as the browser reports them.
const channels = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as [number, number, number];
const luminance = (css: string) => {
  const [r, g, b] = channels(css).map((value) => {
    const unit = value / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const TextOnTheChosenHighlightedRowMeetsAA: Story = {
  name: "Text on a chosen, highlighted row has at least 4.5:1 against its fill, in every theme",
  render: () => (
    <Page>
      <MultiSelect
        aria-label="Plans"
        defaultValue={["a"]}
        options={[
          { value: "a", label: "Alpha", description: "The first letter", icon: GlobeIcon },
          { value: "b", label: "Beta", description: "The second letter" },
        ]}
      />
    </Page>
  ),
  play: async () => {
    const root = document.documentElement;
    const original = root.dataset.theme;
    try {
      await userEvent.click(field());
      const list = await body().findByRole("listbox");
      await settled(list);
      await userEvent.keyboard("{ArrowDown}");
      for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
        root.dataset.theme = theme;
        await nextFrame();
        const row = list.querySelector<HTMLElement>("[data-selected][data-highlighted]") as HTMLElement;
        const fill = getComputedStyle(row).backgroundColor;
        const label = getComputedStyle(row.querySelector("[class*=optionLabel]") as HTMLElement).color;
        const description = getComputedStyle(row.querySelector("[class*=optionDescription]") as HTMLElement).color;
        await expect(contrast(label, fill), `${theme}: label on the chosen, highlighted row`).toBeGreaterThanOrEqual(4.5);
        await expect(contrast(description, fill), `${theme}: description on the chosen, highlighted row`).toBeGreaterThanOrEqual(4.5);
      }
    } finally {
      if (original === undefined) delete root.dataset.theme;
      else root.dataset.theme = original;
    }
  },
};

export const FormRefusesAnEmptyField: Story = {
  name: "A form refuses a required field with nothing chosen, focuses the entry, and submits each value",
  render: () => (
    <Page>
      <form data-testid="form" onSubmit={(event) => event.preventDefault()}>
        <MultiSelect aria-label="Countries" options={countries} name="country" required />
        <Button type="submit">Send</Button>
      </form>
    </Page>
  ),
  play: async () => {
    const form = body().getByTestId("form") as HTMLFormElement;
    await expect(form.checkValidity()).toBe(false);
    await userEvent.click(body().getByRole("button", { name: "Send" }));
    await waitFor(() => expect(field()).toHaveFocus());
    await userEvent.click(field());
    await userEvent.click(await option("Japan"));
    await userEvent.click(await option("Norway"));
    await expect(form.checkValidity()).toBe(true);
    await expect(new FormData(form).getAll("country")).toEqual(["jp", "no"]);
  },
};

export const ListFollowsThePage: Story = {
  name: "The list follows the field when the page scrolls",
  render: () => (
    <div style={{ height: "60rem", padding: "var(--dbm-space-6)" }}>
      <div style={{ height: "20rem" }} />
      <MultiSelect aria-label="Countries" options={countries} />
    </div>
  ),
  play: async () => {
    field().scrollIntoView({ block: "center" });
    await userEvent.click(field());
    const list = await body().findByRole("listbox");
    await settled(list);
    window.scrollBy(0, 40);
    await nextFrame();
    await nextFrame();
    const anchor = (field().closest("[dir]") as HTMLElement).getBoundingClientRect();
    const panel = (list.parentElement as HTMLElement).getBoundingClientRect();
    await expect(Math.abs(panel.top - anchor.bottom - 4)).toBeLessThan(3);
  },
};

export const ControlledOpenStaysPut: Story = {
  name: "A list opened from state follows the state",
  render: function Controlled() {
    const [open, setOpen] = useState(false);
    return (
      <Page>
        <MultiSelect aria-label="Countries" options={countries} open={open} onOpenChange={setOpen} />
        <output data-testid="open">{String(open)}</output>
      </Page>
    );
  },
  play: async () => {
    await userEvent.click(field());
    await waitFor(() => expect(body().getByTestId("open")).toHaveTextContent("true"));
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await waitFor(() => expect(body().getByTestId("open")).toHaveTextContent("false"));
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
  },
};

const itemOf = (label: string) => body().getByText(label).closest("li") as HTMLElement;
const centreOf = (element: Element) => {
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

export const ChipsAreDraggedAcrossLines: Story = {
  name: "A chip is dragged with a real mouse across the lines of a wrapped row, with a marker where it will land",
  render: () => (
    <Page width="18rem">
      <MultiSelect
        aria-label="Columns"
        options={[
          { value: "a", label: "Alpha chip" },
          { value: "b", label: "Beta chip" },
          { value: "c", label: "Gamma chip" },
          { value: "d", label: "Delta chip" },
          { value: "e", label: "Epsilon chip" },
        ]}
        reorderable
        defaultValue={["a", "b", "c", "d", "e"]}
      />
    </Page>
  ),
  play: async () => {
    const order = () => chips().join("|");
    await expect(order()).toBe("Alpha chip|Beta chip|Gamma chip|Delta chip|Epsilon chip");
    // the chips are drawn on more than one line, and take no touch gestures of their own
    await expect(itemOf("Epsilon chip").getBoundingClientRect().top).toBeGreaterThan(itemOf("Alpha chip").getBoundingClientRect().bottom - 1);
    await expect(getComputedStyle(itemOf("Alpha chip")).touchAction).toBe("none");
    // drag the first chip to just after the last, which is on the second line
    const last = centreOf(itemOf("Epsilon chip"));
    await realDrag(itemOf("Alpha chip"), { x: last.r.right - 4, y: last.y }, () => {
      const marked = document.querySelector<HTMLElement>("[data-drop]") as HTMLElement;
      expect(marked).toBe(itemOf("Epsilon chip"));
      expect(marked).toHaveAttribute("data-drop", "after");
      expect(itemOf("Alpha chip")).toHaveAttribute("data-dragging", "true");
      // the marker is drawn: a bar two pixels wide, beside the chip
      const bar = getComputedStyle(marked, "::before");
      expect(parseFloat(bar.width)).toBeGreaterThanOrEqual(2);
      expect(bar.position).toBe("absolute");
      // the dragged chip is dimmed, and the pointer is a grabbing hand
      expect(parseFloat(getComputedStyle(itemOf("Alpha chip")).opacity)).toBeLessThan(1);
      expect(getComputedStyle(itemOf("Alpha chip")).cursor).toBe("grabbing");
    });
    await waitFor(() => expect(order()).toBe("Beta chip|Gamma chip|Delta chip|Epsilon chip|Alpha chip"));
    // the press that ended the drag was not a click on a remove button
    await expect(chips()).toHaveLength(5);
    await expect(document.querySelector("[data-drop], [data-dragging]")).toBeNull();
    // and back: the last chip to the very start
    const first = centreOf(itemOf("Beta chip"));
    await realDrag(itemOf("Alpha chip"), { x: first.r.left + 2, y: first.y });
    await waitFor(() => expect(order()).toBe("Alpha chip|Beta chip|Gamma chip|Delta chip|Epsilon chip"));
  },
};

export const DroppingWhereItStartedChangesNothing: Story = {
  name: "A press on a chip's remove button still removes it, and a drag that ends where it started changes nothing",
  render: () => (
    <Page>
      <MultiSelect aria-label="Columns" options={countries} reorderable defaultValue={["ca", "us", "uy"]} />
    </Page>
  ),
  play: async () => {
    const mid = centreOf(itemOf("United States"));
    await realDrag(itemOf("United States"), { x: mid.x + 3, y: mid.y });
    await expect(chips()).toEqual(["Canada", "United States", "Uruguay"]);
    await realClick(body().getByRole("button", { name: "Remove United States" }));
    await waitFor(() => expect(chips()).toEqual(["Canada", "Uruguay"]));
  },
};

export const ChipsAreDraggedInRightToLeft: Story = {
  name: "In a right-to-left page a chip dropped on the left half of its neighbour lands after it",
  render: () => (
    <div dir="rtl" style={{ padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "20rem" }}>
      <MultiSelect aria-label="Columns" options={countries} dir="rtl" reorderable defaultValue={["ca", "us", "uy"]} />
    </div>
  ),
  play: async () => {
    // reading order runs right to left: Canada is rightmost. Dropping it on the left half of the next chip puts it after.
    const next = centreOf(itemOf("United States"));
    await realDrag(itemOf("Canada"), { x: next.r.left + 3, y: next.y }, () => {
      expect(itemOf("United States")).toHaveAttribute("data-drop", "after");
    });
    await waitFor(() => expect(chips()).toEqual(["United States", "Canada", "Uruguay"]));
  },
};

export const KeyboardLiftShowsARing: Story = {
  name: "A chip picked up with the keyboard has a 2px ring in the focus colour, and moves with the arrow keys",
  render: () => (
    <Page>
      <MultiSelect aria-label="Columns" options={countries} reorderable defaultValue={["ca", "us", "uy"]} />
    </Page>
  ),
  play: async () => {
    field().focus();
    await userEvent.keyboard("{ArrowLeft} ");
    const lifted = itemOf("Uruguay");
    await waitFor(() => expect(lifted).toHaveAttribute("data-lifted", "true"));
    const ring = getComputedStyle(lifted);
    await expect(ring.outlineStyle).toBe("solid");
    await expect(parseFloat(ring.outlineWidth)).toBe(2);
    const probe = document.createElement("span");
    probe.style.outlineColor = "var(--dbm-border-focus)";
    probe.style.outlineStyle = "solid";
    document.body.appendChild(probe);
    await expect(ring.outlineColor).toBe(getComputedStyle(probe).outlineColor);
    probe.remove();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect(chips()).toEqual(["Uruguay", "Canada", "United States"]);
    // the chip kept its element, so the keyboard is still on it
    await expect(body().getByRole("button", { name: "Remove Uruguay" })).toHaveFocus();
    await userEvent.keyboard(" ");
    await waitFor(() => expect(lifted).not.toHaveAttribute("data-lifted"));
  },
};

export const CustomValuesTypedAtOnce: Story = {
  name: "Values inserted all at once with separators in them become chips, and the rest stays in the entry",
  render: () => (
    <Page>
      <MultiSelect aria-label="Recipients" options={countries} allowCustomValue />
    </Page>
  ),
  play: async () => {
    field().focus();
    await send("Input.insertText", { text: "one,two,thr" });
    await waitFor(() => expect(chips()).toEqual(["one", "two"]));
    await expect(field()).toHaveValue("thr");
    await userEvent.keyboard("ee{Enter}");
    await waitFor(() => expect(chips()).toEqual(["one", "two", "three"]));
  },
};

export const GroupRowsLineUp: Story = {
  name: "A group's Select all row lines its text up with the options under it",
  render: () => (
    <Page>
      <MultiSelect
        aria-label="Ingredients"
        selectGroups
        defaultOpen
        options={[
          { value: "a", label: "Apple", group: "Fruit" },
          { value: "b", label: "Carrot", group: "Veg" },
        ]}
      />
    </Page>
  ),
  play: async () => {
    const left = (row: HTMLElement) => (row.querySelector("[class*=optionLabel]") as HTMLElement).getBoundingClientRect().left;
    const group = await option("Select all in Fruit");
    const apple = await option("Apple");
    await expect(Math.abs(left(group) - left(apple))).toBeLessThan(1);
  },
};

export const FooterSitsUnderTheListOnAPhone: Story = {
  name: "On a phone the footer sits under a list that still scrolls, its buttons are 24px or more, and Done closes the list",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)", minHeight: "40rem" }}>
      <MultiSelect aria-label="Items" options={manyOptions} footer presentation={{ base: "full-width", sm: "anchored" }} defaultValue={["item-1"]} />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(500);
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    const done = body().getByRole("button", { name: "Done" });
    const clear = body().getByRole("button", { name: "Clear" });
    for (const button of [done, clear]) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(23.5);
      await expect(r.height).toBeGreaterThanOrEqual(23.5);
    }
    // under the list, inside the panel, and the whole panel is on the screen
    const panel = (list.parentElement as HTMLElement).getBoundingClientRect();
    await expect(done.getBoundingClientRect().top).toBeGreaterThanOrEqual(list.getBoundingClientRect().bottom - 0.5);
    await expect(done.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.bottom + 0.5);
    await expect(panel.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    // a real press on Clear empties the field and keeps the list; on Done closes it
    await realClick(clear);
    await waitFor(() => expect(chips()).toEqual([]));
    await expect(body().getByRole("listbox")).toBeInTheDocument();
    await realClick(done);
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(field()).toHaveFocus();
  },
};

export const SummaryIsOneLine: Story = {
  name: "A count in place of the chips is one line, as tall as a field holding one chip, at every size",
  render: () => (
    <Page width="36rem">
      {(["xs", "sm", "md", "lg", "xl"] as MultiSelectSize[]).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <MultiSelect aria-label={`Summary ${size}`} size={size} options={people} overflow="summary" defaultValue={["ada", "grace", "alan", "katherine", "margaret"]} />
          <MultiSelect aria-label={`One chip ${size}`} size={size} options={people} defaultValue={["ada"]} />
        </div>
      ))}
    </Page>
  ),
  play: async () => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const summary = boxOf(body().getByRole("combobox", { name: `Summary ${size}` }));
      const one = boxOf(body().getByRole("combobox", { name: `One chip ${size}` }));
      await expect(Math.abs(summary.getBoundingClientRect().height - one.getBoundingClientRect().height)).toBeLessThan(1.5);
      await expect(within(summary).getByText("5 selected")).toBeInTheDocument();
      await expect(within(summary).queryAllByRole("button", { name: /^Remove / })).toHaveLength(0);
    }
  },
};

export const LockedChipIsTheSameHeight: Story = {
  name: "A chip with no remove button is as tall as one with, and the field is as tall as with all chips removable",
  render: () => (
    <Page>
      <MultiSelect
        aria-label="Locked"
        options={[
          { value: "a", label: "Alpha", disabled: "Fixed" },
          { value: "b", label: "Beta", disabled: "Fixed" },
        ]}
        defaultValue={["a", "b"]}
      />
      <MultiSelect
        aria-label="Free"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        defaultValue={["a", "b"]}
      />
    </Page>
  ),
  play: async () => {
    const locked = boxOf(body().getByRole("combobox", { name: "Locked" }));
    const free = boxOf(body().getByRole("combobox", { name: "Free" }));
    await expect(Math.abs(locked.getBoundingClientRect().height - free.getBoundingClientRect().height)).toBeLessThan(1.5);
    await expect(within(locked).queryAllByRole("button", { name: /^Remove / })).toHaveLength(0);
    await expect(within(free).getAllByRole("button", { name: /^Remove / })).toHaveLength(2);
    // the reason is read after the chip, and is not drawn
    await expect(within(locked).getByText("Alpha").closest("li")).toHaveTextContent("Alpha, Fixed");
  },
};
