import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";
import { spinnerPlaygroundSnippet, spinnerSnippets } from "./Spinner.snippets";

const meta: Meta<typeof Spinner> = {
  title: "Components/Spinner",
  id: "atoms-feedback-spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  // Ordered to match SpinnerProps' own declaration order (size, tone,
  // label, id, className, style, data-testid) — same sequencing principle
  // the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Ring diameter, one step on the shared icon-size scale.",
    },
    // Same 4-option scope as Icon's own tone select (Icon.stories.tsx) —
    // the remaining IconTone members (danger/warning/success/info and the
    // on-* family) are meant for specific contextual composition, not
    // general-purpose Playground browsing.
    tone: {
      control: "select",
      options: ["default", "secondary", "brand", "disabled"],
      description:
        "Color, from the same scale Icon's tone uses. Leave unset to inherit currentColor from context (e.g. a colored button or banner) instead of a fixed tone.",
    },
    label: {
      control: "text",
      description:
        'Accessible label announced to assistive tech (e.g. "Loading"). Decorative (aria-hidden) and silent to screen readers when omitted — pair with a visible loading message elsewhere, or set this, so the loading state isn\'t invisible to assistive tech.',
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other component's established precedent for this same set of four.
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but useful when another element needs to reference this spinner (e.g. via aria-describedby).",
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
  // component default (`size`) or, where there's no true default (`tone`
  // deliberately has none, to inherit currentColor), a sensible non-blank
  // demo value instead — an arg left `undefined` renders as an inert "Set
  // string" placeholder rather than a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    size: "md",
    tone: "brand",
    label: "",
  },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => spinnerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: spinnerSnippets.allSizes } } },
  // `size` is the whole point of this grid — each instance intentionally
  // varies it, so no single control value could represent them all. `tone`
  // and `label` stay live and shared via `{...args}`, matching
  // ProgressBar/ProgressCircle's own AllSizes precedent — previously this
  // story used a bare `render: () => (...)` that ignored args entirely,
  // making every control here a silent no-op (found in review).
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  parameters: { docs: { source: { code: spinnerSnippets.allTones } } },
  // `tone` is the whole point of this grid, same reasoning as AllSizes
  // above. `size` and `label` stay live and shared via `{...args}`.
  argTypes: { tone: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["default", "secondary", "brand", "disabled"] as const).map((tone) => (
        <Spinner key={tone} {...args} tone={tone} />
      ))}
    </div>
  ),
};

export const Labeled: Story = {
  name: "With an accessible label",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => spinnerPlaygroundSnippet(context.args),
      },
    },
  },
  args: { tone: "brand", label: "Loading" },
};
