import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { FieldLabel } from "./FieldLabel";
import { fieldLabelPlaygroundSnippet, fieldLabelSnippets } from "./FieldLabel.snippets";

const meta: Meta<typeof FieldLabel> = {
  title: "Components/FieldLabel",
  id: "atoms-inputs-fieldlabel",
  component: FieldLabel,
  parameters: { layout: "padded" },
  // Ordered content prop first, then the field-association prop, then
  // core visual/behavioral props — the same sequencing principle the
  // future Properties table will use (guidelines/
  // 07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The label text.",
    },
    htmlFor: {
      control: "text",
      description:
        "The id of the field control this label describes — pairs via the native label/control association (or wrap the control as a child instead).",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Font size, matching the size scale of the field control it labels (Input, Textarea, Select, etc.).",
    },
    required: {
      control: "boolean",
      description:
        "Shows a decorative required-indicator asterisk after the label text. Purely visual — hidden from assistive tech.",
    },
    disabled: {
      control: "boolean",
      description: "Dims the label to match a disabled field control.",
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
    children: "Email address",
    htmlFor: "email",
    size: "md",
    required: false,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof FieldLabel>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldLabelPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Required: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldLabelPlaygroundSnippet(context.args),
      },
    },
  },
  args: { required: true },
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
        transform: (_code: string, context: StoryContext) => fieldLabelPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: fieldLabelSnippets.allSizes } } },
  // `size`/`children`/`htmlFor` are the whole point of this grid — each
  // instance intentionally varies size (the size name doubles as its own
  // label) and needs a unique `htmlFor` for a valid per-instance
  // association, so no single control value could represent them.
  // `required`/`disabled` still stay live and shared via `{...args}`.
  // Previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op.
  argTypes: {
    size: { control: false },
    children: { control: false },
    htmlFor: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <FieldLabel key={size} {...args} htmlFor={`field-${size}`} size={size}>
          Size {size}
        </FieldLabel>
      ))}
    </div>
  ),
};
