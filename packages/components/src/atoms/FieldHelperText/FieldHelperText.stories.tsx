import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { FieldHelperText } from "./FieldHelperText";
import { fieldHelperTextPlaygroundSnippet } from "./FieldHelperText.snippets";

const meta: Meta<typeof FieldHelperText> = {
  title: "Components/FieldHelperText",
  id: "atoms-inputs-fieldhelpertext",
  component: FieldHelperText,
  parameters: { layout: "padded" },
  // Ordered content prop first, then behavioral/state props, then
  // advanced/escape-hatch props last — the same sequencing principle the
  // future Properties table will use (guidelines/
  // 07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The helper/hint text content.",
    },
    disabled: {
      control: "boolean",
      description: "Dims the text to match a disabled field control.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set.
    id: { control: false, description: "Standard DOM id." },
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
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md
  // §5).
  args: {
    children: "At least 8 characters, including a number",
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof FieldHelperText>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldHelperTextPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  // Known finding (2026-08-16, adding @storybook/addon-vitest): text.disabled
  // measures 2.32:1 against bg.surface, below the 4.5:1 AA text floor — but
  // this is the already-decided, WCAG-exempt disabled-state pairing
  // computed in 03-token-system-spec.md's Phase 17 (WCAG 2.1 excludes
  // inactive/disabled UI components from 1.4.3), not a new defect. axe has
  // no way to know that on its own. Deferred to this component's own
  // future review pass rather than annotated permanently here — see
  // guidelines/01-vision-and-goals.md §12.
  parameters: {
    a11y: { test: "todo" },
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldHelperTextPlaygroundSnippet(context.args),
      },
    },
  },
};
