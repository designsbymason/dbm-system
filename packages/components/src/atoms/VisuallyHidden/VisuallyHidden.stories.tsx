import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { XIcon } from "@dbm-system/icons";
import { IconButton } from "../IconButton";
import { VisuallyHidden } from "./VisuallyHidden";
import { visuallyHiddenPlaygroundSnippet, visuallyHiddenSnippets } from "./VisuallyHidden.snippets";

const meta: Meta<typeof VisuallyHidden> = {
  title: "Components/VisuallyHidden",
  id: "atoms-utility-visuallyhidden",
  component: VisuallyHidden,
  parameters: { layout: "padded" },
  // Ordered to match VisuallyHiddenProps' own declaration order (children,
  // focusable, asChild), then the inherited native escape-hatch props last —
  // same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The content to visually hide (while keeping it in the accessibility tree).",
    },
    focusable: {
      control: "boolean",
      description:
        "Keeps the content visually hidden by default, but reveals it in normal document flow when it (or a focusable descendant) receives focus — the classic skip-link pattern.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      // Same reasoning as Portal's/FocusTrap's own `asChild` — the control
      // is real and correctly wired, but the wrapper it removes carries no
      // styling of its own, so toggling it produces no visible difference
      // in a live Playground. Demonstrated directly instead in the Variants
      // section (the skip link story already uses `asChild`).
      control: false,
      description:
        "Merge props onto the single child element instead of rendering a <span>. Applies the hidden styling directly to the child.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal hidden styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children: "Screen-reader-only text",
    focusable: false,
  },
};

export default meta;

type Story = StoryObj<typeof VisuallyHidden>;

/**
 * Drive every prop live. `children` renders as plain text here so its own
 * control is meaningful — inspect the DOM (or toggle `focusable` and press
 * Tab into the canvas) to see the actual effect, since hidden content is,
 * by definition, not visible on its own.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => visuallyHiddenPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p style={{ marginTop: 0 }}>
        Press Tab into this canvas — with <code>focusable</code> on, the content below reveals
        itself the moment it receives focus. Otherwise, inspect the DOM (browser devtools) to
        confirm it&apos;s present but visually hidden.
      </p>
      <VisuallyHidden {...args} tabIndex={0} />
    </div>
  ),
};

// `children` is the whole point of each named demo below — a static
// reference showing one exact, deliberately-chosen combination — so no
// single control value could represent it without contradicting the
// story's own point (same reasoning as Skeleton's `DefaultSizes`).
const disableAllAxes = {
  children: { control: false },
  focusable: { control: false },
} as const;

export const IconOnlyButtonLabel: Story = {
  name: "Icon-only button label",
  parameters: { docs: { source: { code: visuallyHiddenSnippets.iconOnlyButtonLabel } } },
  argTypes: disableAllAxes,
  render: () => (
    <>
      <VisuallyHidden id="icon-only-button-label-demo">Close dialog</VisuallyHidden>
      {/* IconButton never renders `children` outside `asChild` mode (and
          `asChild` always logs a dev warning that `icon` goes unused), so
          the VisuallyHidden text above lives as a sibling instead —
          `aria-labelledby` wins over `aria-label` per the accname spec, so
          it's genuinely what gets announced. `aria-label` stays as the
          type's required fallback in case the referenced element is ever
          removed. */}
      <IconButton
        icon={XIcon}
        variant="ghost"
        aria-label="Close dialog"
        aria-labelledby="icon-only-button-label-demo"
      />
    </>
  ),
};

export const InlineWithinText: Story = {
  name: "Inline within visible text",
  parameters: { docs: { source: { code: visuallyHiddenSnippets.inlineWithinText } } },
  argTypes: disableAllAxes,
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      This paragraph has{" "}
      <VisuallyHidden>text that only a screen reader announces, </VisuallyHidden>
      extra content hidden in the middle of otherwise normal text.
    </p>
  ),
};

export const SkipLink: Story = {
  name: "focusable (skip link pattern)",
  parameters: { docs: { source: { code: visuallyHiddenSnippets.skipLink } } },
  argTypes: disableAllAxes,
  render: () => (
    <div>
      <p style={{ color: "var(--dbm-text-primary)", marginTop: 0 }}>
        Click into this preview and press Tab — the skip link below is invisible until it
        receives keyboard focus, then reveals itself in place.
      </p>
      <VisuallyHidden asChild focusable>
        <a
          href="#storybook-root"
          style={{
            background: "var(--dbm-bg-surface)",
            border: "var(--dbm-border-width-1) solid var(--dbm-border-focus)",
            borderRadius: "var(--dbm-radius-sm)",
            color: "var(--dbm-text-link)",
            display: "inline-block",
            padding: "var(--dbm-space-2) var(--dbm-space-3)",
          }}
        >
          Skip to main content
        </a>
      </VisuallyHidden>
    </div>
  ),
};
