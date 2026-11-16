import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Indicators } from "./Indicators";
import { indicatorsPlaygroundSnippet, indicatorsSnippets } from "./Indicators.snippets";

const meta: Meta<typeof Indicators> = {
  title: "Components/Indicators",
  id: "atoms-media-indicators",
  component: Indicators,
  parameters: { layout: "padded" },
  // Ordered to match IndicatorsProps' own declaration order (count, size,
  // activeIndex, onIndexChange, getLabel, aria-label, then the shared
  // escape-hatch props last) — same sequencing principle the future
  // Properties table will use (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    count: {
      control: { type: "number", min: 1 },
      description: "Total number of slides/steps.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Dot diameter. The active dot's pill width scales with it (a fixed 3x multiple at every step).",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Layout axis. horizontal uses Left/Right arrow keys (the default); vertical uses Up/Down instead. Home/End are unaffected.",
    },
    variant: {
      control: "select",
      options: ["dots", "outlined", "bars"],
      description:
        "Visual style. dots (solid fill, the default), outlined (hollow ring when inactive), or bars (same-length segments — active at full thickness, inactive at half).",
    },
    // Driving `activeIndex` directly from a Controls-panel field without a
    // real click/keyboard-driven `onIndexChange` wired back into it would
    // freeze the widget — same reasoning as Switch's own `checked` control.
    // This Playground wires the pair through local state instead (see
    // `render` below), so clicking/arrow-keying a dot in the canvas is what
    // actually drives the position, matching real usage.
    activeIndex: {
      control: false,
      description: "The controlled active index.",
    },
    onIndexChange: {
      control: false,
      description:
        "Called when a dot is activated — by click, or Arrow/Home/End keys.",
    },
    // A function prop can't be meaningfully driven from a generic
    // Storybook control (same reasoning as `formatValueLabel` elsewhere in
    // this codebase).
    getLabel: {
      control: false,
      description: "Accessible label per dot.",
    },
    showLabel: {
      control: "boolean",
      description:
        'Shows a text progress label (e.g. "3/5") next to the dots.',
    },
    // Same reasoning as `getLabel`/`formatValueLabel` above — a function
    // prop isn't a control Storybook can meaningfully drive.
    formatLabel: {
      control: false,
      description: "Customizes the progress label's content.",
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the whole group of dots.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other component's established precedent for this same set of four.
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // number"/"Set string" placeholder instead of a live, interactive control
  // (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    count: 5,
    size: "md",
    orientation: "horizontal",
    variant: "dots",
    showLabel: false,
    "aria-label": "Slide navigation",
    onIndexChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Indicators>;

/**
 * Drive every prop live via the Controls panel below; click a dot, or use
 * the arrow/Home/End keys once one is focused, to move the active index.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => indicatorsPlaygroundSnippet(context.args),
      },
    },
  },
  render: function PlaygroundStory(args) {
    const [index, setIndex] = useState(0);
    const clampedIndex = Math.min(index, Math.max(args.count - 1, 0));
    return (
      <Indicators
        {...args}
        activeIndex={clampedIndex}
        onIndexChange={(next) => {
          setIndex(next);
          args.onIndexChange?.(next);
        }}
      />
    );
  },
};

export const ManySlides: Story = {
  name: "Many slides with custom labels",
  parameters: { docs: { source: { code: indicatorsSnippets.manySlides } } },
  args: {
    count: 10,
    "aria-label": "Gallery navigation",
  },
  render: function ManySlidesStory(args) {
    const [index, setIndex] = useState(3);
    const clampedIndex = Math.min(index, Math.max(args.count - 1, 0));
    return (
      <Indicators
        {...args}
        getLabel={(i) => `Photo ${i + 1} of ${args.count}`}
        activeIndex={clampedIndex}
        onIndexChange={(next) => {
          setIndex(next);
          args.onIndexChange?.(next);
        }}
      />
    );
  },
};

export const Vertical: Story = {
  name: "Vertical orientation",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => indicatorsPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    orientation: "vertical",
    "aria-label": "Side gallery navigation",
  },
  render: function VerticalStory(args) {
    const [index, setIndex] = useState(1);
    const clampedIndex = Math.min(index, Math.max(args.count - 1, 0));
    return (
      <Indicators
        {...args}
        activeIndex={clampedIndex}
        onIndexChange={(next) => {
          setIndex(next);
          args.onIndexChange?.(next);
        }}
      />
    );
  },
};

export const WithProgressLabel: Story = {
  name: "With progress label",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => indicatorsPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    showLabel: true,
  },
  render: function WithProgressLabelStory(args) {
    const [index, setIndex] = useState(2);
    const clampedIndex = Math.min(index, Math.max(args.count - 1, 0));
    return (
      <Indicators
        {...args}
        activeIndex={clampedIndex}
        onIndexChange={(next) => {
          setIndex(next);
          args.onIndexChange?.(next);
        }}
      />
    );
  },
};

export const AllVariants: Story = {
  name: "All variants",
  parameters: { docs: { source: { code: indicatorsSnippets.allVariants } } },
  // `variant` is the whole point of this grid — every other shared prop
  // stays wired through `args` and controllable (07-storybook-and-
  // documentation-standards.md §5), only this one axis is fixed per row.
  argTypes: { variant: { control: false } },
  render: function AllVariantsStory(args) {
    const variants = ["dots", "outlined", "bars"] as const;
    const [indices, setIndices] = useState<number[]>(variants.map(() => 1));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {variants.map((variant, row) => (
          <Indicators
            key={variant}
            {...args}
            variant={variant}
            activeIndex={indices[row] ?? 0}
            onIndexChange={(next) => {
              setIndices((prev) =>
                prev.map((value, i) => (i === row ? next : value)),
              );
              args.onIndexChange?.(next);
            }}
          />
        ))}
      </div>
    );
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: indicatorsSnippets.allSizes } } },
  // `size` is the whole point of this grid — every other shared prop stays
  // wired through `args` and controllable (07-storybook-and-documentation-
  // standards.md §5), only this one axis is fixed per row.
  argTypes: { size: { control: false } },
  render: function AllSizesStory(args) {
    const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
    const [indices, setIndices] = useState<number[]>(sizes.map(() => 1));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sizes.map((size, row) => (
          <Indicators
            key={size}
            {...args}
            size={size}
            activeIndex={indices[row] ?? 0}
            onIndexChange={(next) => {
              setIndices((prev) =>
                prev.map((value, i) => (i === row ? next : value)),
              );
              args.onIndexChange?.(next);
            }}
          />
        ))}
      </div>
    );
  },
};

export const KeyboardInteraction: Story = {
  name: "Interaction: click and arrow-key navigation",
  render: function KeyboardInteractionStory(args) {
    const [index, setIndex] = useState(0);
    return (
      <Indicators
        {...args}
        activeIndex={index}
        onIndexChange={(next) => {
          setIndex(next);
          args.onIndexChange?.(next);
        }}
      />
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "Go to slide 1" });
    const third = canvas.getByRole("button", { name: "Go to slide 3" });

    await expect(first).toHaveAttribute("aria-current", "true");

    // Click a non-adjacent dot directly.
    await userEvent.click(third);
    await expect(third).toHaveAttribute("aria-current", "true");
    await expect(args.onIndexChange).toHaveBeenCalledWith(2);

    // Roving tabindex: only the now-active dot is a Tab stop.
    await expect(first).toHaveAttribute("tabIndex", "-1");
    await expect(third).toHaveAttribute("tabIndex", "0");

    // Arrow-key navigation from the newly active dot, with focus following.
    third.focus();
    await userEvent.keyboard("{ArrowRight}");
    const fourth = canvas.getByRole("button", { name: "Go to slide 4" });
    await expect(fourth).toHaveAttribute("aria-current", "true");
    await expect(fourth).toHaveFocus();
  },
};
