import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Box } from "./Box";
import { boxPlaygroundSnippet, boxSnippets } from "./Box.snippets";

const meta: Meta<typeof Box> = {
  title: "Components/Box",
  id: "atoms-layout-box",
  component: Box,
  // No `tags: ["autodocs"]` — Box.mdx is a hand-authored Docs page (see
  // guidelines/07-storybook-and-documentation-standards.md §4) that embeds
  // this file's stories via `<Meta of={BoxStories} />`; autodocs would
  // generate a second, competing, auto-generated Docs entry alongside it.
  parameters: { layout: "padded" },
  argTypes: {
    as: {
      control: "select",
      options: ["div", "span", "section", "article", "aside", "header", "footer", "nav", "main"],
      description: "The HTML element (or component) to render as.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    children: { control: "text" },
    style: {
      control: false,
      description:
        "Inline styles — the primary way to visually style a Box, since it has no CSS module of its own. Should still reference semantic tokens (`var(--dbm-*)`), not raw values.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    as: "div",
    children: "A Box, rendered as a div.",
    style: {
      background: "var(--dbm-bg-brand-subtle)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-primary)",
      padding: "var(--dbm-space-4)",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Box>;

/**
 * Drive every prop live — switch `as` to see the rendered tag change in the
 * DOM (inspect via your browser devtools) while the component itself never
 * re-renders its own markup, only the underlying element.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => boxPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AsSection: Story = {
  name: 'Polymorphic: as="section"',
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => boxPlaygroundSnippet(context.args),
      },
    },
  },
  args: { as: "section", children: 'Rendered as a <section> element via the `as` prop.' },
};

export const AsButton: Story = {
  name: 'Polymorphic: as="button" (native button props type-check)',
  parameters: { docs: { source: { code: boxSnippets.asButton } } },
  // Fixed render — doesn't read `args`, so `as`/`children` would otherwise
  // show as live-looking controls that silently do nothing (07-storybook-
  // and-documentation-standards.md §5's own "inert controls" convention).
  argTypes: { as: { control: false }, children: { control: false } },
  render: () => (
    <Box
      as="button"
      type="button"
      style={{
        background: "var(--dbm-bg-brand-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-primary)",
        padding: "var(--dbm-space-4)",
        border: "none",
        cursor: "pointer",
      }}
    >
      Rendered as a &lt;button&gt; — `type=&quot;button&quot;` is a real, type-checked native
      prop.
    </Box>
  ),
};

interface CustomLabelProps extends ComponentPropsWithoutRef<"span"> {
  label: string;
}

const CustomLabel = forwardRef<HTMLSpanElement, CustomLabelProps>(
  ({ label, children, ...props }, ref) => (
    <span ref={ref} {...props}>
      <strong>{label}: </strong>
      {children}
    </span>
  ),
);
CustomLabel.displayName = "CustomLabel";

export const AsCustomComponent: Story = {
  name: "Polymorphic: as={CustomComponent} (renders another React component, not just a tag)",
  parameters: { docs: { source: { code: boxSnippets.asCustomComponent } } },
  // Fixed render — doesn't read `args`; see AsButton's own comment above.
  argTypes: { as: { control: false }, children: { control: false } },
  render: () => (
    <Box
      as={CustomLabel}
      label="Status"
      style={{
        background: "var(--dbm-bg-brand-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-primary)",
        padding: "var(--dbm-space-4)",
      }}
    >
      Rendered via a custom React component passed to `as` — not just an intrinsic HTML tag.
    </Box>
  ),
};

/**
 * Verifies the polymorphic `as` prop produces a genuinely interactive,
 * clickable, keyboard-focusable native `<button>` — not just a styled
 * `<div>` — since that's the entire point of `as` over a fixed element.
 */
export const ClickableAsButton: Story = {
  name: "Interaction: clickable when as=\"button\"",
  args: {
    as: "button",
    onClick: fn(),
    children: "Click me",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.tab();
    button.focus();
    await expect(button).toHaveFocus();
  },
};
