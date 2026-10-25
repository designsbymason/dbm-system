import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../atoms/Input";
import { Textarea } from "../atoms/Textarea";
import { NumberInput } from "../molecules/NumberInput";
import { PasswordInput } from "../molecules/PasswordInput";
import { PinInput } from "../molecules/PinInput";
import { SearchInput } from "../molecules/SearchInput";
import { Select } from "../molecules/Select";
import { TagsInput } from "../molecules/TagsInput";
import { TimePicker } from "../molecules/TimePicker";
import { DatePicker } from "../organisms/DatePicker";
import { MultiSelect } from "../organisms/MultiSelect";

// One rule for every field that draws its own box (`05-component-api-conventions.md` §6): the focus ring is on the
// box's own edge, with no gap, and the box does not change shape or size when it is focused; an invalid field keeps
// the ring in the danger colour. Checked in a real browser, since jsdom resolves no stylesheet. Hidden from the
// sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Foundations/Checks/Field focus ring",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const colourOf = (token: string) => {
  const probe = document.createElement("span");
  probe.style.borderColor = `var(--dbm-${token})`;
  probe.style.borderStyle = "solid";
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).borderColor;
  probe.remove();
  return colour;
};

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A field eases its border colour, so a reading taken at once is part way between the two colours.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

/** The element the ring is drawn on: the focused element or its nearest ancestor with a visible outline. */
function ringElement(selector?: string): HTMLElement {
  if (selector) {
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`no element matches ${selector}`);
    return found;
  }
  let element: HTMLElement | null = document.activeElement as HTMLElement | null;
  while (element && element !== document.body) {
    const style = getComputedStyle(element);
    if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) return element;
    element = element.parentElement;
  }
  throw new Error("nothing around the focused element draws an outline");
}

interface Case {
  name: string;
  field: (invalid: boolean) => ReactNode;
  /** For a field whose ring is on an element that doesn't contain the focused one (the active cell of a code field). */
  ring?: string;
}

const cases: Case[] = [
  { name: "Input", field: (invalid) => <Input aria-label="Name" hasError={invalid} placeholder="Jane Doe" /> },
  { name: "Textarea", field: (invalid) => <Textarea aria-label="Notes" hasError={invalid} /> },
  { name: "NumberInput", field: (invalid) => <NumberInput aria-label="Quantity" hasError={invalid} /> },
  { name: "PasswordInput", field: (invalid) => <PasswordInput aria-label="Password" hasError={invalid} /> },
  { name: "SearchInput", field: () => <SearchInput aria-label="Search" /> },
  {
    name: "Select",
    field: (invalid) => (
      <Select aria-label="Size" hasError={invalid} defaultValue="md">
        <Select.Option value="sm">Small</Select.Option>
        <Select.Option value="md">Medium</Select.Option>
      </Select>
    ),
  },
  { name: "TagsInput", field: (invalid) => <TagsInput aria-label="Labels" hasError={invalid} defaultValue={["a"]} /> },
  { name: "TimePicker", field: (invalid) => <TimePicker aria-label="Start" hasError={invalid} defaultValue="09:30" /> },
  {
    name: "PinInput",
    field: (invalid) => <PinInput aria-label="Code" hasError={invalid} length={4} />,
    ring: '[data-active="true"]',
  },
  { name: "DatePicker", field: (invalid) => <DatePicker aria-label="Start" hasError={invalid} defaultValue="2026-10-03" /> },
  {
    name: "MultiSelect",
    field: (invalid) => (
      <MultiSelect
        aria-label="Countries"
        hasError={invalid}
        defaultValue={["ca"]}
        options={[
          { value: "ca", label: "Canada" },
          { value: "mx", label: "Mexico" },
        ]}
      />
    ),
  },
];

function Harness({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)", maxInlineSize: "24rem", padding: "var(--dbm-space-6)" }}>
      <button type="button">Before</button>
      {children}
    </div>
  );
}

async function measure(root: HTMLElement, spec: Case, invalid: boolean) {
  const before = within(root).getByRole("button", { name: "Before" });
  before.focus();
  await userEvent.tab();
  await waitFor(() => expect(document.activeElement).not.toBe(before));
  await nextFrame();
  const ring = ringElement(spec.ring);
  await settled(ring);
  const focused = getComputedStyle(ring);
  const box = ring.getBoundingClientRect();
  const found = {
    width: parseFloat(focused.outlineWidth),
    offset: parseFloat(focused.outlineOffset),
    radius: focused.borderTopLeftRadius,
    outlineColour: focused.outlineColor,
    borderColour: focused.borderTopColor,
    borderWidth: parseFloat(focused.borderTopWidth),
    box: [box.top, box.left, box.width, box.height].map((value) => Math.round(value * 10) / 10),
  };
  (document.activeElement as HTMLElement).blur();
  await settled(ring);
  const resting = getComputedStyle(ring);
  const restingBox = ring.getBoundingClientRect();
  return {
    ...found,
    restingRadius: resting.borderTopLeftRadius,
    restingBox: [restingBox.top, restingBox.left, restingBox.width, restingBox.height].map(
      (value) => Math.round(value * 10) / 10,
    ),
    invalid,
  };
}

function story(spec: Case, invalid: boolean): Story {
  return {
    name: `${spec.name}${invalid ? " (invalid)" : ""}: the ring sits on the border, the box keeps its shape and size`,
    render: () => <Harness>{spec.field(invalid)}</Harness>,
    play: async ({ canvasElement }) => {
      const result = await measure(canvasElement, spec, invalid);
      // two pixels, pulled in by its own width: over the border and the pixel beside it, so no gap and nothing
      // drawn outside the box
      await expect(result.width).toBe(2);
      await expect(result.offset).toBe(-2);
      // the box's own corners and place do not change when it takes focus
      await expect(result.radius).toBe(result.restingRadius);
      await expect(result.box).toEqual(result.restingBox);
      // border and ring are one colour: the focus colour, or the danger colour while it is invalid
      await expect(result.outlineColour).toBe(result.borderColour);
      const focus = colourOf("border-focus");
      const danger = colourOf("border-danger");
      await expect(result.outlineColour).toBe(invalid ? danger : focus);
    },
  };
}

// One story per field, and a second for its invalid state where it has one.
export const Input_: Story = story(cases[0] as Case, false);
export const InputInvalid: Story = story(cases[0] as Case, true);
export const Textarea_: Story = story(cases[1] as Case, false);
export const TextareaInvalid: Story = story(cases[1] as Case, true);
export const NumberInput_: Story = story(cases[2] as Case, false);
export const PasswordInput_: Story = story(cases[3] as Case, false);
export const SearchInput_: Story = story(cases[4] as Case, false);
export const Select_: Story = story(cases[5] as Case, false);
export const SelectInvalid: Story = story(cases[5] as Case, true);
export const TagsInput_: Story = story(cases[6] as Case, false);
export const TagsInputInvalid: Story = story(cases[6] as Case, true);
export const TimePicker_: Story = story(cases[7] as Case, false);
export const TimePickerInvalid: Story = story(cases[7] as Case, true);
export const PinInput_: Story = story(cases[8] as Case, false);
export const PinInputInvalid: Story = story(cases[8] as Case, true);
export const DatePicker_: Story = story(cases[9] as Case, false);
export const DatePickerInvalid: Story = story(cases[9] as Case, true);
export const MultiSelect_: Story = story(cases[10] as Case, false);
export const MultiSelectInvalid: Story = story(cases[10] as Case, true);
