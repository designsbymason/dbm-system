import { GlobeIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Popover } from "../../molecules/Popover";
import { Dialog } from "../Dialog";
import { Combobox } from "./Combobox";
import type { ComboboxSize } from "./Combobox.types";
import { countries, manyOptions } from "./ComboboxStoryKit";

// Real-browser checks for what jsdom can't evaluate: where the list is drawn, a real mouse inside a Dialog and a
// Popover, windowing, the cascade, forced colours and the layout of the field. Hidden from the sidebar and the Docs
// page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/Combobox/Checks",
  id: "organisms-inputs-combobox-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
const field = () => body().getByRole("combobox") as HTMLInputElement;
const option = (name: string | RegExp) => body().findByRole("option", { name });

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

// The page's own button: somewhere neutral for the pointer to rest between checks.
const aside = (
  <Button variant="secondary" data-testid="aside">
    Elsewhere
  </Button>
);

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "30rem" }}>
      {aside}
      {children}
    </div>
  );
}

export const ListSitsUnderTheField: Story = {
  name: "The list sits under the field, as wide as it, and above everything on the page",
  render: () => (
    <Page>
      <Combobox aria-label="Country" options={countries} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = await body().findByRole("listbox");
    await settled(list);
    const anchor = field().closest("[dir]") as HTMLElement;
    const a = anchor.getBoundingClientRect();
    const p = list.parentElement?.getBoundingClientRect() as DOMRect;
    await expect(Math.abs(p.left - a.left)).toBeLessThan(1.5);
    await expect(Math.abs(p.width - a.width)).toBeLessThan(1.5);
    await expect(p.top - a.bottom).toBeGreaterThanOrEqual(2);
    await expect(p.top - a.bottom).toBeLessThanOrEqual(8);
    // the list takes the pointer: the option is the top element at its own point
    const first = await option("Argentina");
    const r = first.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + 4, r.top + 4)).toBe(first);
    // the panel brings its own font, as it is drawn outside the field
    await expect(getComputedStyle(panelOf(list).firstElementChild as HTMLElement).fontFamily).toBe(getComputedStyle(field()).fontFamily);
    await expect(getComputedStyle(panelOf(list).firstElementChild as HTMLElement).zIndex).not.toBe("auto");
  },
};

export const PointerPicksAnOptionInADialog: Story = {
  name: "An option chosen with a real mouse in a Combobox inside a Dialog, which stays open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a combobox">
        <Dialog.Body>
          <Combobox aria-label="Country" options={countries} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("combobox"));
    const target = await option("Brazil");
    await nextFrame();
    const r = target.getBoundingClientRect();
    // the list is above the dialog's scrim and takes the pointer
    await expect(document.elementFromPoint(r.left + 4, r.top + 4)).toBe(target);
    await realClick(target);
    await waitFor(() => expect(field()).toHaveValue("Brazil"));
    // the list fades out before it leaves
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(body().getByRole("dialog", { name: "With a combobox" })).toBeInTheDocument();
    await expect(field()).toHaveFocus();
  },
};

export const EscapeClosesTheListThenTheDialog: Story = {
  name: "Escape closes the list first, and a second Escape closes the Dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a combobox">
        <Dialog.Body>
          <Combobox aria-label="Country" options={countries} defaultValue="ca" />
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

export const PointerPicksAnOptionInAPopover: Story = {
  name: "An option chosen with a real mouse in a Combobox inside a Popover, which stays open",
  render: () => (
    <Page>
      <Popover defaultOpen>
        <Popover.Trigger asChild>
          <Button>Filters</Button>
        </Popover.Trigger>
        <Popover.Content aria-label="Filters">
          <Combobox aria-label="Country" options={countries} />
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
    await waitFor(() => expect(field()).toHaveValue("Chile"));
    await expect(body().getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  },
};

export const PressesInAndOutOfTheField: Story = {
  name: "A press on the field keeps the list open; a press elsewhere closes it and puts back the last choice",
  render: () => (
    <Page>
      <Combobox aria-label="Country" options={countries} defaultValue="ca" />
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
    await expect(field()).toHaveValue("Canada");
  },
};

export const InsertedTextAtOnce: Story = {
  name: "Text inserted all at once, as a phone or a paste sends it, narrows the list",
  render: () => (
    <Page>
      <Combobox aria-label="Country" options={countries} />
    </Page>
  ),
  play: async () => {
    field().focus();
    await send("Input.insertText", { text: "uru" });
    await waitFor(() => expect(field()).toHaveValue("uru"));
    const list = await body().findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    await expect(within(list).getByRole("option")).toHaveTextContent("Uruguay");
    await send("Input.insertText", { text: "xx" });
    await expect(await body().findByRole("option", { name: "No results" })).toBeInTheDocument();
  },
};

export const KeyboardEndToEnd: Story = {
  name: "The keyboard picks, leaves and returns, with one tab stop",
  render: () => (
    <Page>
      <Combobox aria-label="Country" options={countries} clearable defaultValue="ca" />
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
    await expect(field()).toHaveValue("Chile");
    // the caret and clear buttons are not tab stops
    await userEvent.tab();
    await expect(body().getByTestId("after")).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(field()).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(body().getByTestId("aside")).toHaveFocus();
  },
};

export const LongListIsWindowed: Story = {
  name: "A list of two thousand options draws a window of rows, scrolls true, and keeps the highlighted option in view",
  render: () => (
    <Page>
      <Combobox aria-label="Item" options={manyOptions} />
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
    // the scrollbar is true to the whole list
    await expect(list.scrollHeight).toBeGreaterThan(rowHeight * 1999);
    await expect(list.scrollHeight).toBeLessThan(rowHeight * 2001 + 4);
    // ArrowUp from the top wraps to the last option and brings it into view
    await userEvent.keyboard("{ArrowUp}");
    const last = await option("Item 2000");
    await waitFor(() => expect(field()).toHaveAttribute("aria-activedescendant", last.id));
    const listBox = list.getBoundingClientRect();
    const row = last.getBoundingClientRect();
    await expect(row.top).toBeGreaterThanOrEqual(listBox.top - 1);
    await expect(row.bottom).toBeLessThanOrEqual(listBox.bottom + 1);
    // the rows are still a fixed height after the jump
    await expect(Math.abs(row.height - rowHeight)).toBeLessThan(0.5);
    // typing narrows to a short list that is drawn whole
    await userEvent.keyboard("{Control>}a{/Control}1999");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
  },
};

export const LongGroupedListNamesItsGroups: Story = {
  name: "In a long grouped list each option is read with its group's name, and the heading rows stay out of the way",
  render: () => (
    <Page>
      <Combobox
        aria-label="Item"
        options={Array.from({ length: 300 }, (_, index) => ({
          value: `v${index}`,
          label: `Item ${index + 1}`,
          group: index < 150 ? "Alpha" : "Beta",
        }))}
      />
    </Page>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = await body().findByRole("listbox");
    await settled(list);
    await expect(within(list).queryAllByRole("group")).toHaveLength(0);
    const first = await option(/^Item 1\s*,\s*Alpha$/);
    await expect(first).toHaveAccessibleName(/^Item 1\s*,\s*Alpha$/);
    await expect(within(list).getAllByRole("option").length).toBeLessThan(60);
  },
};

export const IconlessRowsLineUp: Story = {
  name: "Labels line up when only some options have an icon",
  render: () => (
    <Page>
      <Combobox
        aria-label="Plan"
        defaultOpen
        options={[
          { value: "a", label: "With an icon", icon: GlobeIcon },
          { value: "b", label: "Without one" },
        ]}
      />
    </Page>
  ),
  play: async () => {
    const withIcon = await option("With an icon");
    const without = await option("Without one");
    const left = (row: HTMLElement) => (row.querySelector("[class*=optionLabel]") as HTMLElement).getBoundingClientRect().left;
    await expect(Math.abs(left(withIcon) - left(without))).toBeLessThan(1);
  },
};

export const ChosenOptionFarDownIsInView: Story = {
  name: "Opening a long list on a chosen option far down shows that option",
  render: () => (
    <Page>
      <Combobox aria-label="Item" options={manyOptions} defaultValue="item-1500" />
    </Page>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    const chosen = await option("Item 1500");
    await waitFor(() => {
      const box = list.getBoundingClientRect();
      const row = chosen.getBoundingClientRect();
      expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
    await expect(field()).toHaveAttribute("aria-activedescendant", chosen.id);
  },
};

export const ListFitsTheScreen: Story = {
  name: "On a phone the list stays inside the screen and scrolls inside it",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <Combobox aria-label="Item" options={manyOptions} />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(500);
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    const box = list.parentElement?.getBoundingClientRect() as DOMRect;
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  },
};

export const FullWidthOnAPhone: Story = {
  name: "A full-width list spans the screen a gap in from each edge, above or below the field",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)", minHeight: "40rem" }}>
      <Combobox aria-label="Item" options={manyOptions} presentation={{ base: "full-width", sm: "anchored" }} />
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
    // a press on a row still chooses it
    await realClick(await option("Item 3"));
    await waitFor(() => expect(field()).toHaveValue("Item 3"));
  },
};

export const FullWidthOpensAboveNearTheBottom: Story = {
  name: "A full-width list opens above a field that is near the bottom of the screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)", paddingTop: "calc(100vh - 6rem)", minHeight: "100vh" }}>
      <Combobox aria-label="Item" options={manyOptions} presentation="full-width" />
    </div>
  ),
  play: async () => {
    await userEvent.click(field());
    const list = (await body().findByRole("listbox")) as HTMLElement;
    await settled(list);
    const anchor = (field().closest("[dir]") as HTMLElement).getBoundingClientRect();
    await waitFor(() => {
      const box = (list.parentElement as HTMLElement).getBoundingClientRect();
      expect(box.bottom).toBeLessThanOrEqual(anchor.top + 1);
      expect(box.top).toBeGreaterThanOrEqual(-0.5);
    });
  },
};

export const FieldMatchesInput: Story = {
  name: "The field is as tall as an Input at every size, with or without its buttons",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as ComboboxSize[]).map((size) => (
        <div key={size} data-size={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Input aria-label={`Input ${size}`} size={size} defaultValue="x" />
          <Combobox aria-label={`Plain ${size}`} size={size} options={countries} />
          <Combobox aria-label={`Full ${size}`} size={size} options={countries} defaultValue="ca" clearable loading />
        </div>
      ))}
    </Page>
  ),
  play: async () => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const input = body().getByRole("textbox", { name: `Input ${size}` });
      const reference = (input.parentElement as HTMLElement).getBoundingClientRect().height;
      for (const name of ["Plain", "Full"]) {
        const combo = body().getByRole("combobox", { name: `${name} ${size}` });
        const height = (combo.parentElement as HTMLElement).getBoundingClientRect().height;
        await expect(Math.abs(height - reference)).toBeLessThan(1);
      }
    }
  },
};

export const ButtonsAreBigEnough: Story = {
  name: "The caret and clear buttons are at least 24 by 24 pixels at every size, and rows are tall enough to press",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as ComboboxSize[]).map((size) => (
        <Combobox key={size} aria-label={`Field ${size}`} size={size} options={countries} defaultValue="ca" clearable defaultOpen={size === "xs"} />
      ))}
    </Page>
  ),
  play: async () => {
    for (const button of [...document.querySelectorAll<HTMLElement>("button[aria-label='Clear'], button[aria-label='Toggle options']")]) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(23.5);
      await expect(r.height).toBeGreaterThanOrEqual(23.5);
    }
    for (const row of await body().findAllByRole("option")) {
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const ArrowsInRightToLeft: Story = {
  name: "In a right-to-left page the list lines up with the field's start edge",
  render: () => (
    <div dir="rtl" style={{ padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "26rem" }}>
      <Combobox aria-label="Country" options={countries} dir="rtl" />
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
  },
};

export const ForcedColours: Story = {
  name: "In forced colours the highlighted row is outlined, the list keeps its border, and a chosen row is readable",
  render: () => (
    <Page>
      <Combobox aria-label="Country" options={countries} defaultValue="ca" />
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
      // opened on the chosen option: it is both selected and highlighted
      const chosen = list.querySelector<HTMLElement>("[data-selected][data-highlighted]") as HTMLElement;
      await expect(chosen).not.toBeNull();
      await expect(getComputedStyle(chosen).forcedColorAdjust).not.toBe("none");
      // the browser paints the fill, so the authored light fill of a highlighted row is not what is drawn: the text
      // (the page's) and the fill it sits on must be told apart
      const style = getComputedStyle(chosen);
      await expect(contrast(style.color, style.backgroundColor === "rgba(0, 0, 0, 0)" ? "rgb(0, 0, 0)" : style.backgroundColor)).toBeGreaterThanOrEqual(7);
      await userEvent.keyboard("{ArrowDown}");
      const target = list.querySelector<HTMLElement>("[data-highlighted]") as HTMLElement;
      await waitFor(() => expect(getComputedStyle(target).outlineStyle).toBe("solid"));
      await expect(getComputedStyle(panelOf(list).firstElementChild as HTMLElement).borderTopStyle).toBe("solid");
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

export const TextOnTheHighlightedRowMeetsAA: Story = {
  name: "Text on the highlighted row has at least 4.5:1 against its fill, in every theme",
  render: () => (
    <Page>
      <Combobox
        aria-label="Plan"
        defaultValue="a"
        options={[
          { value: "a", label: "Alpha", description: "The first letter" },
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
      for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
        root.dataset.theme = theme;
        await nextFrame();
        // opened on the chosen option, so the highlighted row is a chosen one (text.brand) with a description
        const row = list.querySelector<HTMLElement>("[data-selected][data-highlighted]") as HTMLElement;
        const fill = getComputedStyle(row).backgroundColor;
        const label = getComputedStyle(row.querySelector("[class*=optionLabel]") as HTMLElement).color;
        const description = getComputedStyle(row.querySelector("[class*=optionDescription]") as HTMLElement).color;
        await expect(contrast(label, fill), `${theme}: label on the highlighted row`).toBeGreaterThanOrEqual(4.5);
        await expect(contrast(description, fill), `${theme}: description on the highlighted row`).toBeGreaterThanOrEqual(4.5);
      }
    } finally {
      if (original === undefined) delete root.dataset.theme;
      else root.dataset.theme = original;
    }
  },
};

export const FormRefusesAnUnchosenField: Story = {
  name: "A form refuses a required field with nothing chosen, and sends focus to the field you can see",
  render: () => (
    <Page>
      <form data-testid="form" onSubmit={(event) => event.preventDefault()}>
        <Combobox aria-label="Country" options={countries} name="country" required />
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
    await expect(form.checkValidity()).toBe(true);
    await expect(new FormData(form).get("country")).toBe("jp");
  },
};

export const OutsideScrollDoesNotMoveTheList: Story = {
  name: "The list follows the field when the page scrolls",
  render: () => (
    <div style={{ height: "60rem", padding: "var(--dbm-space-6)" }}>
      <div style={{ height: "20rem" }} />
      <Combobox aria-label="Country" options={countries} />
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
        <Combobox aria-label="Country" options={countries} open={open} onOpenChange={setOpen} />
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
