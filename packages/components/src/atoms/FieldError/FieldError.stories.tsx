import { HeartIcon, StarIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { FieldError } from "./FieldError";
import { fieldErrorPlaygroundSnippet, fieldErrorSnippets } from "./FieldError.snippets";
import type { FieldErrorProps } from "./FieldError.types";

// The Controls panel can't natively drive an arbitrary component reference
// or a boolean-or-component union, so this maps a small curated set onto
// string keys via `argTypes.mapping` (same pattern as Checkbox's `icon`).
// "Default" maps to `true` (the built-in warning glyph), "Hidden" to
// `false`.
const iconMapping = {
  Default: true,
  Hidden: false,
  Star: StarIcon,
  Heart: HeartIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const meta: Meta<typeof FieldError> = {
  title: "Components/FieldError",
  id: "atoms-inputs-fielderror",
  component: FieldError,
  parameters: { layout: "padded" },
  // Ordered content prop first, then core visual/behavioral props, then
  // advanced/escape-hatch props last — the same sequencing principle the
  // future Properties table will use (guidelines/
  // 07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The error message content.",
    },
    icon: {
      ...iconControl,
      description:
        "Shows a small warning icon before the message. Select 'Hidden' to omit it, or a named icon to override the glyph — override sparingly, see the component's own JSDoc for the consistency caveat.",
    },
    disabled: {
      control: "boolean",
      description:
        "Dims the text (and icon, via currentColor) to match a disabled field control.",
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
    children: "Enter a valid email address",
    // Cast, same as Checkbox's own `icon` default args — this is the
    // Controls-panel select's option key, not `FieldErrorProps["icon"]`
    // itself, hence the cast.
    icon: "Default" as unknown as FieldErrorProps["icon"],
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof FieldError>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldErrorPlaygroundSnippet(context.args),
      },
    },
  },
};

export const WithoutIcon: Story = {
  name: "Without icon",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldErrorPlaygroundSnippet(context.args),
      },
    },
  },
  args: { icon: "Hidden" as unknown as FieldErrorProps["icon"] },
};

export const CustomIcon: Story = {
  name: "Custom icon",
  parameters: { docs: { source: { code: fieldErrorSnippets.customIcon } } },
  // `icon` is the whole point here, fixed per instance so the comparison
  // against the default glyph is visible side by side — `disabled` still
  // stays live via `{...args}`.
  argTypes: { icon: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      <FieldError {...args}>Default warning icon</FieldError>
      <FieldError {...args} icon={StarIcon}>
        Custom icon (Star)
      </FieldError>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  // text.disabled measures 2.32:1 against bg.surface, below the 4.5:1 AA
  // text floor — but this is the already-decided, WCAG-exempt
  // disabled-state pairing computed in 03-token-system-spec.md's Phase 17
  // (WCAG 2.1 excludes inactive/disabled UI components from 1.4.3), the
  // same token FieldLabel's and FieldHelperText's own "Disabled" stories
  // already carry this identical annotation for, not a new defect. axe has
  // no way to know that on its own. See guidelines/01-vision-and-goals.md
  // §12.
  parameters: {
    a11y: { test: "todo" },
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldErrorPlaygroundSnippet(context.args),
      },
    },
  },
};
