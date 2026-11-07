import { CircleIcon, HeartIcon, SmileyIcon, ThumbsUpIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Fragment, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Link } from "../../atoms/Link";
import { send } from "../CodeBlock/browserProtocol";
import { FormField } from "../FormField";
import { RatingInput } from "./RatingInput";
import { ratingInputPlaygroundSnippet, ratingInputSnippets } from "./RatingInput.snippets";

const valueNames = ["Poor", "Fair", "Good", "Great", "Excellent"];
// A rating's icon is chosen by name in the Playground; the control hands back the key, and `mapping` the component.
const iconChoices = { Heart: HeartIcon, Thumb: ThumbsUpIcon, Smiley: SmileyIcon, Circle: CircleIcon };

const meta: Meta<typeof RatingInput> = {
  title: "Molecules/Inputs/RatingInput",
  component: RatingInput,
  parameters: { layout: "padded" },
  // `defaultValue` only sets where an uncontrolled rating starts, so changing its control would do nothing to a rating
  // that is already on screen. Keying the story by it starts the rating again at the new value.
  decorators: [
    (Story, context) => (
      <Fragment key={String(context.args.defaultValue)}>
        <Story />
      </Fragment>
    ),
  ],
  // Content-ish props first (max, value), then the look, then behaviour and state, then the escape hatches last
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    max: {
      control: { type: "number", min: 1, max: 10 },
      description: "The number of icons.",
      table: { defaultValue: { summary: "5" } },
    },
    value: {
      control: false,
      description:
        "The controlled value: 0 for no rating, up to max. Pair with onValueChange. A read-only rating draws any value exactly.",
    },
    defaultValue: {
      control: { type: "number", min: 0, max: 10, step: 0.5 },
      description: "The initial value when uncontrolled.",
      table: { defaultValue: { summary: "0" } },
    },
    onValueChange: {
      control: false,
      description: "Called with the new value when a person chooses one: 0 when a rating is cleared.",
    },
    precision: {
      control: "select",
      options: [1, 0.5],
      description: "The smallest step: 1 for whole icons, 0.5 for halves (two choices for each icon).",
      table: { defaultValue: { summary: "1" } },
    },
    roundTo: {
      control: "select",
      options: [1, 0.5],
      // Only a read-only rating can be drawn rounded, so the control is offered only while `readOnly` is on.
      if: { arg: "readOnly" },
      description:
        "Draws a read-only rating's icons to the nearest 1 or 0.5 instead of exactly (3.3 draws three and a half). The number, the text alternative and the submitted value keep the exact value. Ignored, with a development warning, on a rating a person can change.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The icon's box, on the shared size scale. At whole steps every choice is a target of at least 24px; at half steps each half is half an icon's width.",
      table: { defaultValue: { summary: "md" } },
    },
    tone: {
      control: "select",
      options: ["brand", "highlight", "warning", "success", "info", "danger"],
      description: "The colour of the filled icons.",
      table: { defaultValue: { summary: "brand" } },
    },
    icon: {
      control: "select",
      options: Object.keys(iconChoices),
      mapping: iconChoices,
      description:
        "The icon to draw, a Phosphor component reference (a heart, a thumb). Filled for the chosen part, an outline for the rest. A star by default.",
      table: { defaultValue: { summary: "A star" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Shows the value without letting it be changed, drawn exactly (4.3 fills a third of the fifth icon), as one image with a text alternative.",
      table: { defaultValue: { summary: "false" } },
    },
    clearable: {
      control: "boolean",
      description: "Lets a person take their rating back: pressing the chosen value again, or Backspace, Delete or Escape, sets it to 0.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description: "Marks the rating as invalid, visually and with aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every choice.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Makes a rating required for form validation.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "The direction the rating reads in. rtl puts the first icon at the right, fills from the right and turns the arrow keys round, with the number, the count and the link in the same order. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    showValue: {
      control: "boolean",
      description:
        "Writes the rating as a number before the icons (4.2), on the same row: the chosen value, or the one under the pointer. One decimal by default; the space for the widest value is kept.",
      table: { defaultValue: { summary: "false" } },
    },
    valueNames: {
      control: false,
      description:
        'A name for each whole value, from 1 to max, such as "Poor" to "Excellent". Added to that choice\'s accessible name and, with showValueName, written beside the icons.',
    },
    showValueName: {
      control: "boolean",
      description:
        "Writes the name of the value under the pointer, or of the chosen one, beside the icons. Needs valueNames. The space for the longest name is kept.",
      table: { defaultValue: { summary: "false" } },
    },
    count: {
      control: { type: "number", min: 0 },
      // Only a read-only rating draws a count, so the control is offered only while `readOnly` is on.
      if: { arg: "readOnly" },
      description:
        'How many ratings the value is made of, written after the icons as (124) and added to the text alternative in words ("124 reviews"). For a read-only summary: ignored, with a development warning, on a rating a person can change.',
    },
    suffix: {
      control: false,
      description:
        'Anything to put after the icons and the count on the same row, such as a "Read reviews" Link or Button. For a read-only summary, like count. A real control that keeps its own role, focus and name.',
    },
    name: {
      control: "text",
      description: "The name the value is submitted under in a surrounding form, as a number.",
    },
    formatValue: {
      control: false,
      // A function default is too long for the Default column, which would stretch the whole table, so it is
      // stated in the description instead and the column shows a dash.
      description:
        "Writes the number showValue draws. Receives the plain number between 0 and max, and 0 when there is no rating, so it decides what that reads as. By default one decimal (4.0, 4.2), and a dash for no rating.",
      // Overrides the function source docgen would otherwise read out of the component.
      table: { defaultValue: { summary: "" } },
    },
    formatNumber: {
      control: false,
      description: "Turns a number into the text shown or announced, for a locale's own numerals. Used by the default labels.",
      table: { defaultValue: { summary: "String" } },
    },
    labels: {
      control: false,
      description:
        'Text this component writes itself, for translation: `itemLabel`, `valueText`, `notRated`, `count` and `countText`. Each function receives the plain numbers. Defaults: "3 out of 5", "Rated 4.3 out of 5", "Not rated", "(124)", "124 reviews".',
    },
    "aria-label": {
      control: "text",
      description: "The accessible name of the rating when there is no visible label.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of the element that names the rating.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of the helper or error text that describes the rating.",
    },
    id: {
      control: false,
      description: "The id of the element that carries the role.",
    },
    className: {
      control: false,
      description: "Extra classes, on the outermost box.",
    },
    style: {
      control: false,
      description: "Inline styles, on the outermost box.",
    },
    "data-testid": {
      control: false,
      description: "A test identifier, on the element that carries the role.",
    },
  },
  // Every controllable prop has an explicit value here, matching its real default
  // (07-storybook-and-documentation-standards.md §5).
  args: {
    max: 5,
    defaultValue: 3,
    precision: 1,
    size: "md",
    tone: "brand",
    readOnly: false,
    clearable: false,
    hasError: false,
    disabled: false,
    required: false,
    dir: "ltr",
    showValue: false,
    showValueName: false,
    valueNames,
    name: "",
    "aria-label": "Rating",
    onValueChange: fn(),
  },
  render: (args) => <RatingInput {...args} />,
};

export default meta;

type Story = StoryObj<typeof RatingInput>;

const builtSnippet = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => ratingInputPlaygroundSnippet(context.args),
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: builtSnippet } },
  // A count and a link are for a read-only summary: the component ignores them otherwise, so they are only passed on
  // (and their controls only offered) while `readOnly` is on.
  render: ({ count, suffix, roundTo, ...args }) => (
    <RatingInput
      {...args}
      count={args.readOnly ? count : undefined}
      suffix={args.readOnly ? suffix : undefined}
      roundTo={args.readOnly ? roundTo : undefined}
    />
  ),
  // "Star" is the default, not a value to choose, so it is a Playground-only choice that leaves the prop out.
  argTypes: {
    icon: { control: "select", options: ["Star", ...Object.keys(iconChoices)], mapping: { Star: undefined, ...iconChoices } },
    // "Exact" is the default (no rounding), not a value to choose, so it is a Playground-only choice.
    roundTo: { control: "select", options: ["Exact", 1, 0.5], mapping: { Exact: undefined }, if: { arg: "readOnly" } },
    // A link to pass as `suffix`, a Playground-only choice (the prop takes any node).
    suffix: {
      control: "select",
      options: ["None", "Read reviews link"],
      mapping: { None: undefined, "Read reviews link": <Link href="#reviews">Read reviews</Link> },
      if: { arg: "readOnly" },
    },
  },
  // `defaultValue` is the prop's real default (no rating) here, like every other control's value in this story.
  args: { icon: "Star" as never, count: 124, suffix: "None" as never, roundTo: "Exact" as never, defaultValue: 0 },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: ratingInputSnippets.allSizes } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <RatingInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: ratingInputSnippets.tones } } },
  argTypes: { tone: { control: false } },
  args: { defaultValue: 4 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["brand", "highlight", "warning", "success", "info", "danger"] as const).map((tone) => (
        <RatingInput key={tone} {...args} tone={tone} aria-label={`Tone ${tone}`} />
      ))}
    </div>
  ),
};

export const HalfSteps: Story = {
  name: "Half steps",
  parameters: { docs: { source: { code: ratingInputSnippets.halfSteps } } },
  argTypes: { precision: { control: false } },
  args: { precision: 0.5, defaultValue: 3.5 },
};

export const ReadOnly: Story = {
  name: "Read-only average",
  parameters: { docs: { source: { code: ratingInputSnippets.readOnly } } },
  // A read-only rating ignores `precision` (a step for choosing); `roundTo` is what snaps it.
  argTypes: {
    readOnly: { control: false },
    defaultValue: { control: false },
    precision: { control: false },
    roundTo: { control: "select", options: ["Exact", 1, 0.5], mapping: { Exact: undefined } },
  },
  args: { readOnly: true, defaultValue: undefined, "aria-label": "Average rating", roundTo: "Exact" as never },
  render: (args) => <RatingInput {...args} value={4.3} />,
};

export const ShowValue: Story = {
  name: "With the value",
  parameters: { docs: { source: { code: ratingInputSnippets.showValue } } },
  argTypes: { showValue: { control: false }, precision: { control: false }, defaultValue: { control: false } },
  args: { showValue: true, precision: 0.5, defaultValue: 3.5 },
};

export const ReviewSummary: Story = {
  name: "Review summary",
  parameters: { docs: { source: { code: ratingInputSnippets.reviewSummary } } },
  argTypes: {
    readOnly: { control: false },
    showValue: { control: false },
    count: { control: false },
    defaultValue: { control: false },
    // A read-only rating ignores `precision`; `roundTo` is what snaps it.
    precision: { control: false },
    roundTo: { control: "select", options: ["Exact", 1, 0.5], mapping: { Exact: undefined } },
  },
  args: { readOnly: true, showValue: true, count: 124, defaultValue: undefined, "aria-label": "Average rating", roundTo: "Exact" as never },
  render: ({ count, ...args }) => (
    <RatingInput {...args} value={4.2} count={count} suffix={<Link href="#reviews">Read reviews</Link>} />
  ),
};

export const RoundedAverage: Story = {
  name: "Rounded average",
  parameters: { docs: { source: { code: ratingInputSnippets.rounded } } },
  argTypes: {
    readOnly: { control: false },
    defaultValue: { control: false },
    precision: { control: false },
    roundTo: { control: "select", options: [1, 0.5] },
  },
  args: { readOnly: true, showValue: true, roundTo: 0.5, defaultValue: undefined, "aria-label": "Average rating" },
  render: (args) => <RatingInput {...args} value={3.3} />,
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: ratingInputSnippets.rightToLeft } } },
  argTypes: { dir: { control: false }, precision: { control: false } },
  args: { dir: "rtl", precision: 0.5, defaultValue: 3.5, showValue: true },
};

export const ValueNames: Story = {
  name: "With the value named",
  parameters: { docs: { source: { code: ratingInputSnippets.valueNames } } },
  argTypes: { showValueName: { control: false }, valueNames: { control: false } },
  args: { showValueName: true, defaultValue: 0 },
};

export const Clearable: Story = {
  name: "Clearable",
  parameters: { docs: { source: { code: ratingInputSnippets.clearable } } },
  argTypes: { clearable: { control: false } },
  args: { clearable: true },
};

export const CustomIcon: Story = {
  name: "Another icon",
  parameters: { docs: { source: { code: ratingInputSnippets.customIcon } } },
  argTypes: { icon: { control: false }, tone: { control: false } },
  args: { tone: "danger" },
  render: (args) => <RatingInput {...args} icon={HeartIcon} />,
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: builtSnippet } },
  args: { hasError: true, defaultValue: 0 },
};

export const Disabled: Story = {
  parameters: { docs: { source: builtSnippet } },
  args: { disabled: true, defaultValue: 2 },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: ratingInputSnippets.inFormField } } },
  argTypes: Object.fromEntries(
    ["max", "defaultValue", "precision", "size", "tone", "icon", "readOnly", "clearable", "hasError", "disabled", "required", "showValue", "showValueName", "count", "name", "aria-label"].map((key) => [key, { control: false }]),
  ),
  render: () => (
    <FormField label="How was it?" helperText="Choose a rating from 1 to 5." required>
      {(fieldProps) => <RatingInput {...fieldProps} name="rating" />}
    </FormField>
  ),
};

export const Controlled: Story = {
  name: "Controlled",
  parameters: { docs: { source: { code: ratingInputSnippets.controlled } } },
  argTypes: { defaultValue: { control: false } },
  args: { defaultValue: undefined },
  render: function ControlledStory(args) {
    const [rating, setRating] = useState(2);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }}>
        <RatingInput {...args} value={rating} onValueChange={setRating} />
        <Button variant="tertiary" size="xs" onClick={() => setRating(0)}>
          Reset
        </Button>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// Hidden stories: interaction and real-browser checks. They run as tests and appear in neither the sidebar nor the
// Docs page.
// ---------------------------------------------------------------------------------------------------------------------

const items = (canvasElement: HTMLElement) => Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-fill]"));
const fills = (canvasElement: HTMLElement) => items(canvasElement).map((item) => Number(item.dataset.fill));
const previews = (canvasElement: HTMLElement) =>
  items(canvasElement).map((item) => (item.dataset.preview === undefined ? undefined : Number(item.dataset.preview)));
// The colour a token resolves to, by reading it back from an element.
const resolved = (property: "color" | "backgroundColor", value: string) => {
  const probe = document.createElement("span");
  probe.style[property] = value;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe)[property];
  probe.remove();
  return colour;
};
const checkedValue = (canvasElement: HTMLElement) =>
  (Array.from(canvasElement.querySelectorAll<HTMLInputElement>("input[type=radio]")).find((radio) => radio.checked) ?? { value: "" }).value;

export const ChooseInteraction: Story = {
  name: "Pressing an icon chooses it, and the arrow keys move the choice — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 0, onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");
    await userEvent.click(radios[3] as HTMLElement);
    await expect(checkedValue(canvasElement)).toBe("4");
    await expect(args.onValueChange).toHaveBeenCalledWith(4);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(checkedValue(canvasElement)).toBe("3");
    await expect(fills(canvasElement)).toEqual([1, 1, 1, 0, 0]);
  },
};

export const HoverPreviewCheck: Story = {
  name: "Hovering previews a rating without choosing it — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 1 },
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");
    await userEvent.hover(radios[3] as HTMLElement);
    // The chosen star stays solid; the stars the pointer would add are the preview.
    await waitFor(() => expect(previews(canvasElement)).toEqual([1, 1, 1, 1, 0]));
    await expect(fills(canvasElement)).toEqual([1, 0, 0, 0, 0]);
    await expect(checkedValue(canvasElement)).toBe("1");
    await userEvent.unhover(radios[3] as HTMLElement);
    await waitFor(() => expect(fills(canvasElement)).toEqual([1, 0, 0, 0, 0]));
    await expect(previews(canvasElement)).toEqual([undefined, undefined, undefined, undefined, undefined]);
  },
};

export const HoverPreviewColoursCheck: Story = {
  name: "A previewed star is a pale tone fill under a tone-coloured outline — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 0 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["brand", "highlight", "warning", "success", "info", "danger"] as const).map((tone) => (
        <RatingInput key={tone} {...args} tone={tone} aria-label={`Tone ${tone}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const tone of ["brand", "highlight", "warning", "success", "info", "danger"]) {
      const group = within(canvasElement).getByRole("radiogroup", { name: `Tone ${tone}` });
      const radio = within(group).getAllByRole("radio")[2] as HTMLElement;
      await userEvent.hover(radio);
      await waitFor(() => expect(group.querySelector("[data-preview='1']")).not.toBeNull());
      const item = group.querySelector("[data-preview='1']") as HTMLElement;
      const fill = getComputedStyle(item.querySelector("[class*='previewFill']") as HTMLElement).color;
      const stroke = getComputedStyle(item.querySelector("[class*='previewStroke']") as HTMLElement).color;
      await expect(fill).toBe(resolved("color", `var(--dbm-bg-${tone}-subtle)`));
      await expect(stroke).toBe(resolved("color", `var(--dbm-border-${tone})`));
      await userEvent.unhover(radio);
    }
  },
};

export const ReviewSummaryRowCheck: Story = {
  name: "The value, icons, count and link sit on one row, in order and level — interaction test",
  tags: ["!dev"],
  args: { readOnly: true, showValue: true, count: 124, defaultValue: undefined, "aria-label": "Average rating" },
  render: ({ count, ...args }) => (
    <RatingInput {...args} value={4.2} count={count} suffix={<Link href="#reviews">Read reviews</Link>} />
  ),
  play: async ({ canvasElement }) => {
    const value = canvasElement.querySelector("[class*='value']:not([class*='valueName'])") as HTMLElement;
    const group = within(canvasElement).getByRole("img");
    const count = canvasElement.querySelector("[class*='count']") as HTMLElement;
    const link = within(canvasElement).getByRole("link", { name: "Read reviews" });
    const parts = [value, group, count, link].map((part) => part.getBoundingClientRect());
    // Left to right, in that order, without overlapping.
    for (let index = 1; index < parts.length; index += 1) {
      await expect(parts[index]!.left).toBeGreaterThanOrEqual(parts[index - 1]!.right - 0.5);
    }
    // On one row: every centre sits within a few pixels of the icons' centre.
    const middle = parts[1]!.top + parts[1]!.height / 2;
    for (const part of parts) {
      await expect(Math.abs(part.top + part.height / 2 - middle)).toBeLessThan(4);
    }
  },
};

export const ValueNeverMovesIconsCheck: Story = {
  name: "A changing value never moves the icons — interaction test",
  tags: ["!dev"],
  args: { showValue: true, precision: 0.5, defaultValue: 0, max: 10 },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("radiogroup");
    const radios = within(canvasElement).getAllByRole("radio");
    const left = group.getBoundingClientRect().left;
    for (const radio of [radios[0], radios[9], radios[19]]) {
      await userEvent.hover(radio as HTMLElement);
      await waitFor(() => expect(canvasElement.querySelector("[data-preview]")).not.toBeNull());
      await expect(group.getBoundingClientRect().left).toBe(left);
    }
  },
};

export const SummaryWrapsCheck: Story = {
  name: "The count and link wrap below the icons in a narrow container — interaction test",
  tags: ["!dev"],
  args: { readOnly: true, showValue: true, count: 1240, defaultValue: undefined, "aria-label": "Average rating" },
  render: ({ count, ...args }) => (
    <div data-box="" style={{ inlineSize: "16rem" }}>
      <RatingInput {...args} value={4.2} count={count} suffix={<Link href="#reviews">Read reviews</Link>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-box]") as HTMLElement;
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    // The number stays with the icons.
    const value = (canvasElement.querySelector("[class*='value']:not([class*='valueName'])") as HTMLElement).getBoundingClientRect();
    const group = within(canvasElement).getByRole("img").getBoundingClientRect();
    await expect(Math.abs(value.top + value.height / 2 - (group.top + group.height / 2))).toBeLessThan(4);
  },
};

export const LongScaleWrapsCheck: Story = {
  name: "Ten icons wrap onto a second row on a narrow screen instead of overflowing — interaction test",
  tags: ["!dev"],
  args: { max: 10, size: "lg", showValue: true, readOnly: true, defaultValue: undefined, "aria-label": "Average rating" },
  render: (args) => (
    <div data-box="" style={{ inlineSize: "20rem" }}>
      <RatingInput {...args} value={4.2} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-box]") as HTMLElement;
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const rows = new Set(items(canvasElement).map((item) => Math.round(item.getBoundingClientRect().top)));
    await expect(rows.size).toBeGreaterThan(1);
    // Every icon is still inside the box.
    for (const item of items(canvasElement)) {
      await expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right + 0.5);
    }
  },
};

export const HalfClickCheck: Story = {
  name: "The left half of an icon chooses the half, the right half the whole — interaction test",
  tags: ["!dev"],
  args: { precision: 0.5, defaultValue: 0 },
  play: async ({ canvasElement }) => {
    const third = items(canvasElement)[2] as HTMLElement;
    const box = third.getBoundingClientRect();
    // The element under each point is what a real press lands on, so the test presses that.
    const press = async (fraction: number) => {
      const clientX = box.left + box.width * fraction;
      const clientY = box.top + box.height / 2;
      await userEvent.pointer({ keys: "[MouseLeft]", target: document.elementFromPoint(clientX, clientY) as Element, coords: { clientX, clientY } });
    };
    await press(0.25);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("2.5"));
    await press(0.75);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("3"));
  },
};

export const TargetSizeCheck: Story = {
  name: "Every icon is a target of at least 24px at every size (a half step is half of one) — interaction test",
  tags: ["!dev"],
  args: { precision: 0.5 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <RatingInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const radio of canvasElement.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
      const box = radio.getBoundingClientRect();
      // A half step is half an item wide, so the item itself must be 24px: the two halves together.
      await expect(box.height).toBeGreaterThanOrEqual(24);
    }
    for (const item of items(canvasElement)) {
      const box = item.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const FillClipCheck: Story = {
  name: "A read-only value fills exactly that part of the icon — interaction test",
  tags: ["!dev"],
  args: { readOnly: true, defaultValue: undefined },
  render: (args) => <RatingInput {...args} value={3.3} />,
  play: async ({ canvasElement }) => {
    const clip = (item: HTMLElement) => getComputedStyle(item.querySelector("[class*='filled']") as HTMLElement).clipPath;
    const [first, , , fourth, fifth] = items(canvasElement) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    // inset(0 <right> 0 0): none cut off, 70% cut off, everything cut off.
    await expect(clip(first)).toMatch(/inset\(0(px)?\s+0(px|%)?\s+0(px)?\s+0(px)?\)/);
    await expect(clip(fourth)).toContain("70%");
    await expect(clip(fifth)).toContain("100%");
  },
};

export const ValueNameStaysPutCheck: Story = {
  name: "Writing a value's name never moves the icons or resizes the rating — interaction test",
  tags: ["!dev"],
  args: { showValueName: true, defaultValue: 0 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[dir='ltr']") as HTMLElement;
    const group = within(canvasElement).getByRole("radiogroup");
    const radios = within(canvasElement).getAllByRole("radio");
    const before = { root: root.getBoundingClientRect().width, group: group.getBoundingClientRect().left };
    for (const radio of radios) {
      await userEvent.hover(radio);
      await waitFor(() => expect(canvasElement.querySelector("[data-active='true']")).not.toBeNull());
      await expect(root.getBoundingClientRect().width).toBe(before.root);
      await expect(group.getBoundingClientRect().left).toBe(before.group);
    }
  },
};

export const KeyboardRingCheck: Story = {
  name: "Tabbing in shows a focus ring around the icon — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const focused = document.activeElement as HTMLElement;
    await expect(focused).toBe(within(canvasElement).getAllByRole("radio")[1]);
    const item = focused.closest("[data-fill]") as HTMLElement;
    await expect(getComputedStyle(item).outlineStyle).toBe("solid");
    await expect(parseFloat(getComputedStyle(item).outlineWidth)).toBeGreaterThan(0);
  },
};

export const ForcedColorsCheck: Story = {
  name: "The focus ring and the filled shape survive forced colours — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await userEvent.tab();
      const item = (document.activeElement as HTMLElement).closest("[data-fill]") as HTMLElement;
      await expect(getComputedStyle(item).outlineStyle).toBe("solid");
      // Filled and outline icons are told apart by their shape, since every colour becomes the same system colour.
      const svgs = Array.from(items(canvasElement)[0]!.querySelectorAll("svg")) as SVGElement[];
      const [outline, , , filled] = svgs;
      await expect(outline!.innerHTML).not.toBe(filled!.innerHTML);
      // A previewed star is an outline with the page's own colour inside, not a solid star like the chosen ones.
      const radios = within(canvasElement).getAllByRole("radio");
      await userEvent.hover(radios[4] as HTMLElement);
      await waitFor(() => expect(items(canvasElement)[4]!.dataset.preview).toBe("1"));
      const preview = items(canvasElement)[4]!;
      await expect(getComputedStyle(preview.querySelector("[class*='previewFill']") as HTMLElement).color).toBe(resolved("color", "Canvas"));
      await expect(getComputedStyle(preview.querySelector("[class*='previewStroke']") as HTMLElement).color).toBe(resolved("color", "CanvasText"));
    } finally {
      await emulate("none");
    }
  },
};

export const RightToLeftCheck: Story = {
  name: "dir=rtl: first icon at the right, filled from the right, arrow keys turned round — interaction test",
  tags: ["!dev"],
  args: { dir: "rtl", precision: 0.5, defaultValue: 2, showValue: true },
  play: async ({ canvasElement }) => {
    const [first, , , , last] = items(canvasElement) as HTMLElement[];
    // The first icon is at the right, and the number is before the icons, so at the right of them.
    await expect(first!.getBoundingClientRect().left).toBeGreaterThan(last!.getBoundingClientRect().left);
    const value = canvasElement.querySelector("[class*='value']:not([class*='valueName'])") as HTMLElement;
    await expect(value.getBoundingClientRect().left).toBeGreaterThan(first!.getBoundingClientRect().left);
    // The filled part starts at the right edge: a full icon is not cut, and the clip for a part comes from the left.
    const clip = (item: HTMLElement) => getComputedStyle(item.querySelector("[class*='filled']") as HTMLElement).clipPath;
    await expect(clip(first!)).toMatch(/inset\(0(px)?\s+0(px)?\s+0(px)?\s+0(px|%)?\)/);
    const radios = within(canvasElement).getAllByRole("radio");
    // The right half of an icon is the first half, whatever the scale's direction.
    const third = items(canvasElement)[2] as HTMLElement;
    const box = third.getBoundingClientRect();
    const press = async (fraction: number) => {
      const clientX = box.left + box.width * fraction;
      const clientY = box.top + box.height / 2;
      await userEvent.pointer({ keys: "[MouseLeft]", target: document.elementFromPoint(clientX, clientY) as Element, coords: { clientX, clientY } });
    };
    await press(0.75);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("2.5"));
    await press(0.25);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("3"));
    // Arrow keys follow the picture: the next icon is to the left.
    ((radios as HTMLInputElement[]).find((radio) => radio.checked) as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(checkedValue(canvasElement)).toBe("3.5");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(checkedValue(canvasElement)).toBe("2.5");
  },
};

export const RightToLeftFillCheck: Story = {
  name: "dir=rtl: a read-only value fills from the right — interaction test",
  tags: ["!dev"],
  args: { dir: "rtl", readOnly: true, defaultValue: undefined, "aria-label": "Average rating" },
  render: (args) => <RatingInput {...args} value={3.3} />,
  play: async ({ canvasElement }) => {
    const clip = (item: HTMLElement) => getComputedStyle(item.querySelector("[class*='filled']") as HTMLElement).clipPath;
    const fourth = items(canvasElement)[3] as HTMLElement;
    // Cut from the left: 70% of the width is left off, so the filled part is at the right.
    await expect(clip(fourth)).toMatch(/inset\(0(px)?\s+0(px)?\s+0(px)?\s+70%\)/);
  },
};

export const RoundedAverageCheck: Story = {
  name: "roundTo snaps the drawing and leaves the number exact — interaction test",
  tags: ["!dev"],
  args: { readOnly: true, showValue: true, roundTo: 0.5, defaultValue: undefined, "aria-label": "Average rating" },
  render: (args) => <RatingInput {...args} value={3.3} />,
  play: async ({ canvasElement }) => {
    const clip = (item: HTMLElement) => getComputedStyle(item.querySelector("[class*='filled']") as HTMLElement).clipPath;
    // Three and a half icons: the fourth is cut at its middle.
    await expect(clip(items(canvasElement)[3] as HTMLElement)).toContain("50%");
    await expect(canvasElement.querySelector("[class*='value']:not([class*='valueName'])")).toHaveTextContent("3.3");
  },
};

export const LeftToRightCheck: Story = {
  name: "Stays left to right in a right-to-left page — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  render: (args) => (
    <div dir="rtl">
      <RatingInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [first, , , , last] = items(canvasElement) as HTMLElement[];
    await expect(first!.getBoundingClientRect().left).toBeLessThan(last!.getBoundingClientRect().left);
    await expect(fills(canvasElement)).toEqual([1, 1, 0, 0, 0]);
  },
};

export const NarrowContainerCheck: Story = {
  name: "A value name wraps below the icons in a narrow container — interaction test",
  tags: ["!dev"],
  args: { showValueName: true, defaultValue: 4 },
  render: (args) => (
    <div data-box="" style={{ inlineSize: "13rem" }}>
      <RatingInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-box]") as HTMLElement;
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const group = within(canvasElement).getByRole("radiogroup").getBoundingClientRect();
    const name = (canvasElement.querySelector("[class*='valueName']") as HTMLElement).getBoundingClientRect();
    await expect(name.top).toBeGreaterThanOrEqual(group.bottom - 1);
  },
};
