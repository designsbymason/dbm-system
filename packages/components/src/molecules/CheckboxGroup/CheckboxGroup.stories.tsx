import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Checkbox } from "../../atoms/Checkbox";
import { FieldError } from "../../atoms/FieldError";
import { CheckboxGroup } from "./CheckboxGroup";
import { checkboxGroupPlaygroundSnippet, checkboxGroupSnippets } from "./CheckboxGroup.snippets";

const meta: Meta<typeof CheckboxGroup> = {
  title: "Components/CheckboxGroup",
  id: "molecules-inputs-checkboxgroup",
  component: CheckboxGroup,
  parameters: { layout: "padded" },
  // Keys below are ordered to match the component's own `CheckboxGroupProps`
  // declaration order — same sequencing principle as every other
  // component's stories file (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    // Not a meaningful live-editable control for a group managing
    // structured Checkbox children — every story hardcodes its own
    // children in `render` (same reasoning as RadioGroup's own `children`
    // argType).
    children: { control: false, description: "The Checkbox elements this group manages." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size every Checkbox in this group inherits, unless it sets its own.",
    },
    // Deliberately excluded — same reasoning as RadioGroup's own `value`:
    // driving it from Controls without a real `onValueChange` wired back
    // would freeze the group.
    value: { control: false, description: "The controlled array of checked values." },
    // Deliberately excluded from the live Playground panel — it's a
    // string[], and this repo's own custom PlaygroundControls block (see
    // .storybook/blocks/PlaygroundControls.tsx) has no multi-select widget,
    // only boolean/select/number/text; a plain text Input bound to an array
    // prop would silently send the wrong type through onChange. Still
    // driven per-story below (Playground itself, States, SizeCascade,
    // etc.), just not from this panel.
    defaultValue: {
      control: false,
      description: "The initial checked values when uncontrolled.",
    },
    onValueChange: {
      description: "Called with the full, newly-updated array of checked values whenever any item's checked state changes.",
    },
    hasError: {
      description: "Marks the group as invalid — a visual-only signal (role=group doesn't support aria-invalid).",
    },
    disabled: {
      description: "Disables every Checkbox in the group at once.",
    },
    name: {
      control: "text",
      description: "Form field name shared by every Checkbox in the group that doesn't set its own.",
    },
    form: {
      control: false,
      description: "Associates the group with a <form> by id, for use outside that form's own DOM subtree.",
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Purely visual layout direction — no keyboard-navigation behavior attached.",
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the group — every role=group benefits from one.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of an existing, already-visible element to use as the group's accessible name instead.",
    },
    id: {
      control: false,
      description: "Standard DOM id. Rarely needed directly.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    size: "md",
    defaultValue: ["sports"],
    hasError: false,
    disabled: false,
    name: "",
    orientation: "vertical",
    "aria-label": "Interests",
    onValueChange: fn(),
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="sports">Sports</Checkbox>
      <Checkbox value="music">Music</Checkbox>
      <Checkbox value="travel">Travel</Checkbox>
    </CheckboxGroup>
  ),
};

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => checkboxGroupPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Orientation: Story = {
  name: "Vertical vs. horizontal",
  parameters: { docs: { source: { code: checkboxGroupSnippets.orientation } } },
  // `orientation` is the whole point of this comparison, fixed per
  // instance — every other prop stays live via `{...args}`.
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <CheckboxGroup {...args} aria-label="Interests (vertical)" orientation="vertical">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
        <Checkbox value="travel">Travel</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="Interests (horizontal)" orientation="horizontal">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
        <Checkbox value="travel">Travel</Checkbox>
      </CheckboxGroup>
    </div>
  ),
};

export const SizeCascade: Story = {
  name: "Size cascade, with a per-item override",
  parameters: { docs: { source: { code: checkboxGroupSnippets.sizeCascade } } },
  // `size` is the whole point of this comparison, fixed per instance —
  // every other prop stays live via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <CheckboxGroup {...args} aria-label="Small" size="sm">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="Large" size="lg">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="Large group, one option overridden to xs" size="lg">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music" size="xs">
          Music (overridden to xs)
        </Checkbox>
      </CheckboxGroup>
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: checkboxGroupSnippets.states } } },
  // Each row demonstrates a specific, fixed state combination — same
  // reasoning as RadioGroup's own States story.
  argTypes: {
    disabled: { control: false },
    hasError: { control: false },
    defaultValue: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <CheckboxGroup {...args} aria-label="No selection" defaultValue={[]} disabled={false} hasError={false}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="Default" defaultValue={["sports"]} disabled={false} hasError={false}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="Disabled" defaultValue={["sports"]} disabled hasError={false}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup {...args} aria-label="One option individually disabled" defaultValue={["sports"]} disabled={false} hasError={false}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music" disabled>
          Music (unavailable)
        </Checkbox>
      </CheckboxGroup>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        {/*
          hasError is a visual-only left-border accent — role="group" has
          no ARIA-valid way to flag itself invalid (see the component's own
          JSDoc and the Docs page's Usage guidelines), so this row would
          look identical to "Default" without a paired FieldError. Pairing
          it is also the actual documented, correct real-world usage, not
          just a demo workaround.
        */}
        <CheckboxGroup {...args} aria-label="Error state" defaultValue={[]} disabled={false} hasError>
          <Checkbox value="sports">Sports</Checkbox>
          <Checkbox value="music">Music</Checkbox>
        </CheckboxGroup>
        <FieldError>Please choose at least one interest</FieldError>
      </div>
    </div>
  ),
};

export const ControlledSelectionSummary: Story = {
  name: "Controlled, with a live selection summary",
  parameters: { docs: { source: { code: checkboxGroupSnippets.controlled } } },
  // `value`/`onValueChange`/`children`/`defaultValue` are all driven by
  // this story's own local state (the whole point of the demo), so those
  // are excluded from the live controls — every other prop stays live via
  // `{...args}`.
  argTypes: {
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    children: { control: false },
  },
  render: function ControlledSelectionSummaryStory(args) {
    const [value, setValue] = useState<string[]>(["sports"]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
        <CheckboxGroup {...args} value={value} onValueChange={setValue}>
          <Checkbox value="sports">Sports</Checkbox>
          <Checkbox value="music">Music</Checkbox>
          <Checkbox value="travel">Travel</Checkbox>
        </CheckboxGroup>
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-sm)" }}>
          Selected: {value.length > 0 ? value.join(", ") : "none"}
        </span>
      </div>
    );
  },
};

export const ToggleInteraction: Story = {
  name: "Interaction: toggles items independently on click",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const sports = canvas.getByRole("checkbox", { name: "Sports" });
    const music = canvas.getByRole("checkbox", { name: "Music" });
    await expect(sports).toHaveAttribute("aria-checked", "true");
    await expect(music).toHaveAttribute("aria-checked", "false");

    await userEvent.click(music);
    await expect(music).toHaveAttribute("aria-checked", "true");
    await expect(sports).toHaveAttribute("aria-checked", "true");
    await expect(args.onValueChange).toHaveBeenCalledWith(["sports", "music"]);

    await userEvent.click(sports);
    await expect(sports).toHaveAttribute("aria-checked", "false");
    await expect(music).toHaveAttribute("aria-checked", "true");
    await expect(args.onValueChange).toHaveBeenCalledWith(["music"]);
  },
};

export const TabOrderInteraction: Story = {
  name: "Interaction: each option keeps its own tab stop",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sports = canvas.getByRole("checkbox", { name: "Sports" });
    const music = canvas.getByRole("checkbox", { name: "Music" });
    const travel = canvas.getByRole("checkbox", { name: "Travel" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — same pattern as RadioGroup's own interaction
    // stories.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await userEvent.tab();
    await expect(sports).toHaveFocus();
    await pause(500);

    await userEvent.tab();
    await expect(music).toHaveFocus();
    await pause(500);

    await userEvent.tab();
    await expect(travel).toHaveFocus();
    await pause(500);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks every option",
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    for (const checkbox of canvas.getAllByRole("checkbox")) {
      await expect(checkbox).toBeDisabled();
    }
    await userEvent.click(canvas.getByRole("checkbox", { name: "Music" }));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};
