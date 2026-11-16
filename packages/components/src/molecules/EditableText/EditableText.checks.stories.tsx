import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Textarea } from "../../atoms/Textarea";
import { send } from "../CodeBlock/browserProtocol";
import { Table } from "../Table";
import { EditableText } from "./EditableText";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout and measurement, focus, text
// direction and forced colours — measured in Chromium.
const meta: Meta = {
  title: "Components/EditableText/Checks",
  id: "molecules-inputs-editabletext-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const box = (element: Element) => element.getBoundingClientRect();

export const SameHeightAsTheFieldAtEverySize: Story = {
  name: "At every size the text is exactly as tall as the field it becomes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", maxWidth: "20rem" }}>
      {sizes.map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <div data-testid={`single-${size}`}>
            <EditableText size={size} aria-label={`single-${size}`} defaultValue="Apollo" />
          </div>
          <div data-testid={`input-${size}`}>
            <Input size={size} aria-label={`input-${size}`} defaultValue="Apollo" />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const single = canvas.getByTestId(`single-${size}`);
      const wrapperHeight = () => box(single).height;
      const displayHeight = wrapperHeight();
      // The text is the field's own height (an Input of the same size) …
      await expect(Math.abs(displayHeight - box(canvas.getByTestId(`input-${size}`)).height)).toBeLessThan(1);
      // … so opening it changes nothing around it.
      await userEvent.click(within(single).getByRole("button"));
      await expect(Math.abs(wrapperHeight() - displayHeight)).toBeLessThan(1);
      await userEvent.keyboard("{Escape}");
    }
  },
};

export const MultilineSameHeightAsTheTextarea: Story = {
  name: "At every size a multi-line text is exactly as tall as the textarea it becomes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", maxWidth: "20rem" }}>
      {sizes.map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <div data-testid={`multi-${size}`}>
            <EditableText size={size} multiline aria-label={`multi-${size}`} defaultValue="Apollo" />
          </div>
          <div data-testid={`area-${size}`}>
            <Textarea size={size} rows={1} autoResize aria-label={`area-${size}`} defaultValue="Apollo" />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const multi = canvas.getByTestId(`multi-${size}`);
      const multiHeight = box(multi).height;
      await expect(Math.abs(multiHeight - box(canvas.getByTestId(`area-${size}`)).height)).toBeLessThan(1);
      await userEvent.click(within(multi).getByRole("button"));
      await expect(Math.abs(box(multi).height - multiHeight)).toBeLessThan(1);
      await userEvent.keyboard("{Escape}");
    }
  },
};

export const FullWidthInBothModes: Story = {
  name: "The text and the field take the same width, so the row beside it never shifts",
  render: () => (
    <div data-testid="frame" style={{ display: "flex", gap: "var(--dbm-space-3)", width: "24rem", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }} data-testid="cell">
        <EditableText aria-label="Name" defaultValue="Apollo" />
      </div>
      <span data-testid="neighbour">Neighbour</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const neighbour = canvas.getByTestId("neighbour");
    const before = box(neighbour).left;
    const cellWidth = box(canvas.getByTestId("cell")).width;
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    await expect(box(neighbour).left).toBe(before);
    // The field's own box (`Input`'s wrapper), not the native input inside its border and padding.
    const fieldBox = (canvas.getByRole("textbox") as HTMLElement).parentElement as HTMLElement;
    await expect(Math.abs(box(fieldBox).width - cellWidth)).toBeLessThan(1);
  },
};

export const LongValueStaysOnOneLine: Story = {
  name: "A long single-line value ends in an ellipsis and keeps the field's height",
  render: () => (
    <div data-testid="frame" style={{ width: "12rem" }}>
      <EditableText aria-label="Name" defaultValue="A very long project name that cannot possibly fit in a narrow column" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByRole("button").querySelector("span") as HTMLElement;
    await expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    const frame = canvas.getByTestId("frame");
    await expect(box(frame).height).toBeLessThan(60);
  },
};

export const FocusAndSelection: Story = {
  name: "Opening focuses the field with the value selected; a keyboard exit puts focus back",
  render: () => <EditableText aria-label="Name" defaultValue="Apollo" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    const field = canvas.getByRole("textbox") as HTMLInputElement;
    await expect(document.activeElement).toBe(field);
    await expect(field.selectionStart).toBe(0);
    await expect(field.selectionEnd).toBe(field.value.length);
    await userEvent.keyboard("{Enter}");
    await expect(document.activeElement).toBe(canvas.getByRole("button", { name: /Name/ }));
    await expect(document.activeElement?.matches(":focus-visible")).toBe(true);
  },
};

export const ControlPressKeepsTheEdit: Story = {
  name: "Pressing confirm or cancel is read as a press, not as leaving the field first",
  render: () => <EditableText aria-label="Name" defaultValue="Apollo" showControls blurBehavior="cancel" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    await userEvent.keyboard("Gemini");
    // `blurBehavior="cancel"`: were the press taken as a blur, the edit would be thrown away before Save read it.
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: /Gemini/ })).toBeInTheDocument());
  },
};

export const TextArrivingAllAtOnce: Story = {
  name: "Text inserted in one go (a phone keyboard, autofill, a paste) is kept whole",
  render: () => <EditableText aria-label="Name" defaultValue="" placeholder="Add a name" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    await send("Input.insertText", { text: "Grace Brewster Hopper" });
    await expect((canvas.getByRole("textbox") as HTMLInputElement).value).toBe("Grace Brewster Hopper");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("button", { name: /Grace Brewster Hopper/ })).toBeInTheDocument();
  },
};

export const TargetSizes: Story = {
  name: "The text, the buttons and the field are at least 24 × 24 pixels at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "20rem" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`}>
          <EditableText size={size} showControls aria-label={`Name ${size}`} defaultValue="A" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = within(canvas.getByTestId(`row-${size}`));
      const text = row.getByRole("button");
      await expect(box(text).height).toBeGreaterThanOrEqual(24);
      await userEvent.click(text);
      for (const name of ["Save", "Cancel"]) {
        const button = row.getByRole("button", { name });
        await expect(box(button).width).toBeGreaterThanOrEqual(24);
        await expect(box(button).height).toBeGreaterThanOrEqual(24);
      }
      await userEvent.keyboard("{Escape}");
    }
  },
};

export const RightToLeft: Story = {
  name: "In a right-to-left page the text starts at the right and the pencil sits at the left",
  render: () => (
    <div dir="rtl" style={{ width: "20rem" }}>
      <EditableText aria-label="Name" defaultValue="أبولو" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    const text = button.querySelector("span") as HTMLElement;
    const icon = button.querySelector("svg") as SVGElement;
    await expect(getComputedStyle(button).direction).toBe("rtl");
    await expect(box(icon).right).toBeLessThan(box(text).left + 1);
    await expect(Math.abs(box(button).right - box(text).right)).toBeLessThan(box(button).width);
    await expect(box(text).right).toBeGreaterThan(box(icon).right);
  },
};

// A real pointer stays where an earlier check left it, and over the button the forced-colours rule draws the box (`ButtonText`), so a
// check of the box at rest first moves the pointer off the page, as the Button checks do.
async function pointAway() {
  const frame = window.frameElement?.getBoundingClientRect();
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (frame?.left ?? 0) - 10, y: (frame?.top ?? 0) - 10 });
}

export const ForcedColors: Story = {
  name: "In forced colours the box is drawn with a system colour when the text can be pressed",
  render: () => <EditableText aria-label="Name" defaultValue="Apollo" />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const button = within(canvasElement).getByRole("button");
    await pointAway();
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      const probe = document.createElement("span");
      probe.style.color = "Canvas";
      document.body.appendChild(probe);
      const canvasColour = getComputedStyle(probe).color;
      probe.remove();
      // At rest the box is hidden in the page's own colour rather than drawn as a solid line (once the
      // border-colour transition from `transparent` has settled) …
      await waitFor(() => expect(getComputedStyle(button).borderTopColor).toBe(canvasColour));
      // … and focus keeps a visible outline.
      button.focus();
      await userEvent.tab({ shift: true });
      await userEvent.tab();
      await expect(getComputedStyle(button).outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const EditIconWhereThereIsNoHover: Story = {
  name: "The pencil is always shown where there is no hover (a rule exists for it)",
  render: () => <EditableText aria-label="Name" defaultValue="Apollo" />,
  play: async () => {
    const rules: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList;
      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("hover: none")) rules.push(rule.cssText);
      }
    }
    await expect(rules.some((text) => text.includes("icon") && text.includes("opacity: 1"))).toBe(true);
  },
};

export const OnAPhone: Story = {
  name: "On a phone the text, the field and the controls fit the width",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="frame" style={{ width: "100%" }}>
      <EditableText aria-label="Name" defaultValue="Apollo mission control" showControls defaultEditing />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(640);
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

export const SavingDoesNotMoveAnything: Story = {
  name: "Saving puts a spinner in place without changing the height, or squeezing a long value's field",
  render: function SavingStory() {
    const [saving, setSaving] = useState(false);
    return (
      <div style={{ width: "16rem" }}>
        <button type="button" data-testid="toggle" onClick={() => setSaving((current) => !current)}>
          Toggle
        </button>
        <div data-testid="frame">
          <EditableText
            aria-label="Name"
            defaultValue="A very long project name that cannot possibly fit in this column"
            isLoading={saving}
            showControls
            editing
            onEditingChange={() => {}}
          />
        </div>
        <div data-testid="resting">
          <EditableText aria-label="Other" defaultValue="Apollo" isLoading={saving} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    const resting = canvas.getByTestId("resting");
    const heights = [box(frame).height, box(resting).height];
    const fieldWidth = box(canvas.getByRole("textbox")).width;
    await userEvent.click(canvas.getByTestId("toggle"));
    await waitFor(() => expect(canvas.getByRole("textbox")).toHaveAttribute("aria-busy", "true"));
    await expect(Math.abs(box(frame).height - (heights[0] as number))).toBeLessThan(1);
    await expect(Math.abs(box(resting).height - (heights[1] as number))).toBeLessThan(1);
    // The spinner takes its own room; the field gives way, but the column does not overflow.
    await expect(box(canvas.getByRole("textbox")).width).toBeLessThanOrEqual(fieldWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    const spinner = frame.querySelector("[class*='spinner']") as HTMLElement;
    await expect(spinner).not.toBeNull();
    await expect(box(spinner).width).toBeGreaterThanOrEqual(8);
  },
};

export const FocusNotTakenAfterASlowSave: Story = {
  name: "A save that finishes after the person has moved on does not pull focus back",
  render: function SlowSaveStory() {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState("Apollo");
    const pending = useState({ current: false })[0];
    return (
      <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "flex-start", maxWidth: "24rem" }}>
        <div style={{ flex: "1 1 auto" }}>
          <EditableText
            aria-label="Name"
            value={value}
            editing={editing}
            isLoading={saving}
            onEditingChange={(next) => {
              if (!next && pending.current) return;
              setEditing(next);
            }}
            onValueChange={(next) => {
              pending.current = true;
              setSaving(true);
              setTimeout(() => {
                pending.current = false;
                setValue(next);
                setSaving(false);
                setEditing(false);
              }, 400);
            }}
          />
        </div>
        <Button variant="secondary" size="sm">
          Elsewhere
        </Button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    await userEvent.keyboard("Gemini{Enter}");
    // The person moves on while the save is in flight.
    const elsewhere = canvas.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    await waitFor(() => expect(canvas.getByRole("button", { name: /Gemini/ })).toBeInTheDocument(), { timeout: 2000 });
    await expect(document.activeElement).toBe(elsewhere);
  },
};

export const FocusReturnsAfterASlowSaveWhenItStayed: Story = {
  name: "A save that finishes while focus is still there puts focus back on the text",
  render: function StayedStory() {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState("Apollo");
    const pending = useState({ current: false })[0];
    return (
      <EditableText
        aria-label="Name"
        value={value}
        editing={editing}
        isLoading={saving}
        onEditingChange={(next) => {
          if (!next && pending.current) return;
          setEditing(next);
        }}
        onValueChange={(next) => {
          pending.current = true;
          setSaving(true);
          setTimeout(() => {
            pending.current = false;
            setValue(next);
            setSaving(false);
            setEditing(false);
          }, 300);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Name/ }));
    await userEvent.keyboard("Gemini{Enter}");
    await waitFor(() => expect(canvas.getByRole("button", { name: /Gemini/ })).toHaveFocus(), { timeout: 2000 });
  },
};

export const FocusRingInsideATable: Story = {
  name: "In a table cell, at every table size, the focus ring is not cut off by the scroll frame",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", maxWidth: "24rem" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`table-${size}`}>
          <Table size={size} aria-label={`Projects ${size}`}>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <EditableText aria-label={`Name ${size}`} size="xs" defaultValue="Apollo" />
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const holder = canvas.getByTestId(`table-${size}`);
      const trigger = within(holder).getByRole("button");
      // Keyboard focus, so `:focus-visible` applies.
      await userEvent.tab();
      await expect(document.activeElement).toBe(trigger);
      await expect(trigger.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(trigger);
      const offset = parseFloat(style.outlineOffset);
      const width = parseFloat(style.outlineWidth);
      const reach = Math.max(0, offset) + width;
      const ring = box(trigger);
      // Whichever ancestor clips (the table's scroll frame) must hold the ring: the outline reaches `reach`
      // outside the button on every side when the offset is positive, and none when it is drawn inside.
      let frame: HTMLElement | null = trigger.parentElement;
      while (frame && frame !== holder && !["auto", "scroll", "hidden"].includes(getComputedStyle(frame).overflowX)) {
        frame = frame.parentElement;
      }
      await expect(frame).not.toBeNull();
      const edge = box(frame as HTMLElement);
      await expect(ring.top - reach).toBeGreaterThanOrEqual(edge.top - 0.5);
      await expect(ring.bottom + reach).toBeLessThanOrEqual(edge.bottom + 0.5);
      await expect(ring.left - reach).toBeGreaterThanOrEqual(edge.left - 0.5);
      await expect(ring.right + reach).toBeLessThanOrEqual(edge.right + 0.5);
    }
  },
};

export const OpenFieldIsNotThePlaceFormsAreChecked: Story = {
  name: "An open, empty required field does not stop the surrounding form submitting its committed value",
  render: () => (
    <form data-testid="form">
      <EditableText aria-label="Name" defaultValue="Apollo" name="project" required defaultEditing />
      <button type="submit" data-testid="submit">
        Submit
      </button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    let submitted: string | null = null;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = String(new FormData(form).get("project"));
    });
    const field = canvas.getByRole("textbox") as HTMLInputElement;
    await userEvent.clear(field);
    // The open field is a draft, not a member of the form: its own `required` isn't the form's to enforce.
    await expect(field.form).toBeNull();
    form.requestSubmit();
    await expect(submitted).toBe("Apollo");
  },
};
