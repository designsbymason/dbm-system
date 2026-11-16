import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { ProgressCircle } from "./ProgressCircle";
import { progressCirclePlaygroundSnippet, progressCircleSnippets } from "./ProgressCircle.snippets";
import type { ProgressCircleProps } from "./ProgressCircle.types";

const meta: Meta<typeof ProgressCircle> = {
  title: "Components/ProgressCircle",
  id: "atoms-feedback-progresscircle",
  component: ProgressCircle,
  parameters: { layout: "padded" },
  // Ordered to match ProgressCircleProps' own declaration order (value,
  // max, size, tone, label, showValueLabel) — same sequencing principle
  // the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
      description:
        "Current progress. Omit for an indeterminate ring (a continuously spinning arc) when progress can't be measured yet.",
    },
    max: {
      control: "number",
      description: "The value that represents 100% completion.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Ring diameter, one step on the shared size scale.",
    },
    tone: {
      control: "select",
      options: ["brand", "info", "success", "warning", "danger"],
      description: "Feedback-type coloring for the fill.",
    },
    label: {
      control: "text",
      description:
        'Accessible label (e.g. "Uploading file.zip"). Required, along with `aria-labelledby`, for the ring to have an accessible name — development mode warns once if neither is set.',
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead of `label`.",
    },
    "aria-valuetext": {
      control: "text",
      description:
        'A human-readable description of the current value, announced instead of the numeric percentage (e.g. "3 of 5 files uploaded"). Most useful when the raw percentage alone doesn\'t convey the real unit of progress.',
    },
    showValueLabel: {
      control: "boolean",
      description:
        "Shows the rounded percentage as text in the center. Has no effect while indeterminate.",
    },
    // A function prop can't be meaningfully driven from a generic
    // Storybook control (same reasoning as event-handler props elsewhere
    // in this codebase) — demoed via the "With custom value label" story
    // below instead, which sets it directly.
    formatValueLabel: {
      control: false,
      description:
        'Customizes the value label\'s content when `showValueLabel` is set — receives `(value, max)`, returns the content to render. Defaults to the rounded percentage. Has no effect unless `showValueLabel` is also set.',
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other component's established precedent for this same set of four.
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this progress ring.",
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
    value: 65,
    max: 100,
    size: "md",
    tone: "brand",
    label: "Uploading file.zip",
    "aria-valuetext": "",
    showValueLabel: false,
  },
};

export default meta;

type Story = StoryObj<typeof ProgressCircle>;

// `indeterminate` is a Playground-only Controls axis, not a real
// ProgressCircle prop — the component's actual trigger for indeterminate
// mode is omitting `value` entirely, which a `range` control can't
// represent on its own (there's no "empty" position on a slider). This
// synthetic toggle composes that into a single, correctly-behaving control
// instead, the same pattern ProgressBar's own Playground already uses.
// Defaults to off, so the Playground's initial render matches `value`'s own
// live default (65) rather than starting in indeterminate mode.
interface PlaygroundArgs extends ProgressCircleProps {
  indeterminate: boolean;
}

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressCirclePlaygroundSnippet(context.args),
      },
    },
  },
  args: { indeterminate: false } as ProgressCircleProps,
  argTypes: {
    indeterminate: {
      name: "Indeterminate",
      control: "boolean",
      description:
        "Playground-only control (not a real ProgressCircle prop). Toggles whether `value` is passed through at all — indeterminate mode is triggered by omitting `value` entirely, not by any particular value.",
    },
  } as NonNullable<Meta<typeof ProgressCircle>["argTypes"]>,
  render: (args) => {
    const { indeterminate, ...rest } = args as PlaygroundArgs;
    return (
      <ProgressCircle {...rest} value={indeterminate ? undefined : rest.value} />
    );
  },
};

export const WithValueLabel: Story = {
  name: "With value label",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressCirclePlaygroundSnippet(context.args),
      },
    },
  },
  args: { showValueLabel: true },
};

export const WithValueText: Story = {
  name: "With aria-valuetext",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressCirclePlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    value: 3,
    max: 5,
    label: "Uploading files",
    "aria-valuetext": "3 of 5 files uploaded",
  },
};

export const WithCustomValueLabel: Story = {
  name: "With custom value label",
  parameters: { docs: { source: { code: progressCircleSnippets.withCustomValueLabel } } },
  args: {
    value: 3,
    max: 5,
    label: "Uploading files",
    "aria-valuetext": "3 of 5 files uploaded",
    showValueLabel: true,
    formatValueLabel: (value: number, max: number) => `${value}/${max}`,
  },
};

export const Indeterminate: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressCirclePlaygroundSnippet(context.args),
      },
    },
  },
  args: { value: undefined, label: "Loading" },
};

export const AllTones: Story = {
  name: "All tones",
  parameters: { docs: { source: { code: progressCircleSnippets.allTones } } },
  // `tone`/`label` are the whole point of this grid — each instance
  // intentionally varies both together (a distinct accessible label per
  // tone), so no single control value could represent them. Every other
  // prop (`value`, `max`, `size`, `showValueLabel`) stays live and shared
  // via `{...args}`, matching ProgressBar's own AllTones precedent —
  // previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op (found in
  // review).
  argTypes: { tone: { control: false }, label: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["brand", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <ProgressCircle key={tone} {...args} tone={tone} label={tone} />
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: progressCircleSnippets.allSizes } } },
  // `size`/`label` are the whole point of this grid, same reasoning as
  // AllTones above. Every other prop (`value`, `max`, `tone`,
  // `showValueLabel`) stays live and shared via `{...args}`.
  argTypes: { size: { control: false }, label: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ProgressCircle
          key={size}
          {...args}
          size={size}
          label={`Size ${size}`}
        />
      ))}
    </div>
  ),
};
