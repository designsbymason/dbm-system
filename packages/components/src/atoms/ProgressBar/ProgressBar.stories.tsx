import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./ProgressBar";
import { progressBarPlaygroundSnippet, progressBarSnippets } from "./ProgressBar.snippets";
import type { ProgressBarProps } from "./ProgressBar.types";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
  id: "atoms-feedback-progressbar",
  component: ProgressBar,
  parameters: { layout: "padded" },
  // Ordered to match ProgressBarProps' own declaration order (value, max,
  // size, tone, label) — same sequencing principle the future Properties
  // table will use (guidelines/07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
      description:
        "Current progress. Omit for an indeterminate bar (an animated sliding fill) when progress can't be measured yet.",
    },
    max: {
      control: "number",
      description: "The value that represents 100% completion.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Track/fill height, one step on the shared size scale.",
    },
    tone: {
      control: "select",
      options: ["brand", "info", "success", "warning", "danger"],
      description: "Feedback-type coloring for the fill.",
    },
    label: {
      control: "text",
      description:
        'Accessible label (e.g. "Uploading file.zip"). Required, along with `aria-labelledby`, for the bar to have an accessible name — development mode warns once if neither is set.',
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
        "Shows the rounded percentage as text next to the bar. Has no effect while indeterminate.",
    },
    // A function prop can't be meaningfully driven from a generic
    // Storybook control (same reasoning as event-handler props elsewhere
    // in this codebase) — demoed via the "With aria-valuetext" story below
    // instead, which sets it directly.
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
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this progress bar.",
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
    value: 40,
    max: 100,
    size: "md",
    tone: "brand",
    label: "Uploading file.zip",
    "aria-valuetext": "",
    showValueLabel: false,
  },
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

// `indeterminate` is a Playground-only Controls axis, not a real ProgressBar
// prop — the component's actual trigger for indeterminate mode is omitting
// `value` entirely, which a `range` control can't represent on its own
// (there's no "empty" position on a slider). This synthetic toggle composes
// that into a single, correctly-behaving control instead, the same pattern
// Tag's own Playground already uses for its "Interaction mode" select.
// Defaults to off, so the Playground's initial render matches `value`'s own
// live default (40) rather than starting in indeterminate mode.
interface PlaygroundArgs extends ProgressBarProps {
  indeterminate: boolean;
}

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressBarPlaygroundSnippet(context.args),
      },
    },
  },
  args: { indeterminate: false } as ProgressBarProps,
  argTypes: {
    indeterminate: {
      name: "Indeterminate",
      control: "boolean",
      description:
        "Playground-only control (not a real ProgressBar prop). Toggles whether `value` is passed through at all — indeterminate mode is triggered by omitting `value` entirely, not by any particular value.",
    },
  } as NonNullable<Meta<typeof ProgressBar>["argTypes"]>,
  render: (args) => {
    const { indeterminate, ...rest } = args as PlaygroundArgs;
    return (
      <div style={{ maxWidth: "24rem" }}>
        <ProgressBar {...rest} value={indeterminate ? undefined : rest.value} />
      </div>
    );
  },
};

export const WithValueLabel: Story = {
  name: "With value label",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressBarPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showValueLabel: true },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const WithValueText: Story = {
  name: "With aria-valuetext",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressBarPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    value: 3,
    max: 5,
    label: "Uploading files",
    "aria-valuetext": "3 of 5 files uploaded",
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const WithCustomValueLabel: Story = {
  name: "With custom value label",
  parameters: { docs: { source: { code: progressBarSnippets.withCustomValueLabel } } },
  // Pairs the two ways this component describes a non-percentage unit of
  // progress: `aria-valuetext` for screen readers, `formatValueLabel` for
  // the matching visible text — same "3 of 5 files" story, both channels.
  args: {
    value: 3,
    max: 5,
    label: "Uploading files",
    "aria-valuetext": "3 of 5 files uploaded",
    showValueLabel: true,
    formatValueLabel: (value: number, max: number) => `${value} of ${max} files`,
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const Indeterminate: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => progressBarPlaygroundSnippet(context.args),
      },
    },
  },
  args: { value: undefined, label: "Loading" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  parameters: { docs: { source: { code: progressBarSnippets.allTones } } },
  // `tone`/`label` are the whole point of this grid — each instance
  // intentionally varies both together (a distinct accessible label per
  // tone), so no single control value could represent them. Every other
  // prop (`value`, `max`, `size`) stays live and shared via `{...args}`,
  // matching Badge's own AllSizes precedent — previously this story used a
  // bare `render: () => (...)` that ignored args entirely, making every
  // control here a silent no-op (found in review).
  argTypes: { tone: { control: false }, label: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "24rem",
      }}
    >
      {(["brand", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <ProgressBar key={tone} {...args} tone={tone} label={tone} />
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: progressBarSnippets.allSizes } } },
  // `size`/`label` are the whole point of this grid, same reasoning as
  // AllTones above. Every other prop (`value`, `max`, `tone`) stays live
  // and shared via `{...args}`.
  argTypes: { size: { control: false }, label: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "24rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ProgressBar key={size} {...args} size={size} label={`Size ${size}`} />
      ))}
    </div>
  ),
};
