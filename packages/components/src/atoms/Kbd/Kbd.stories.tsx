import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Kbd } from "./Kbd";
import { kbdPlaygroundSnippet, kbdSnippets } from "./Kbd.snippets";

const meta: Meta<typeof Kbd> = {
  title: "Atoms/Typography/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
  // Ordered to match KbdProps' own declaration order (children, aria-label),
  // then the inherited native escape-hatch props last — same sequencing
  // principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: 'The key name or symbol to display (e.g. "Esc", "K", "⌘").',
    },
    keys: {
      control: "text",
      description:
        'A key combination to draw for the platform instead of children: modifiers and a key joined by + ("mod+k", "mod+shift+p"), or an array of keys. mod is ⌘ on an Apple platform and Ctrl elsewhere; ctrl, alt, shift and meta are drawn for the platform too. Each key is its own keycap, named for a screen reader unless aria-label is set. It displays the combination and binds nothing.',
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible label for symbol-only content. Unicode key glyphs (⌘, ⇧, ⌥, ⌃) aren't reliably announced by screen readers on their own — pass a plain-language name so assistive tech announces something meaningful.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
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
  args: {
    children: "Esc",
    keys: "",
  },
};

export default meta;

type Story = StoryObj<typeof Kbd>;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) =>
          kbdPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    "aria-label": "Escape",
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) =>
          kbdPlaygroundSnippet(context.args),
      },
    },
  },
  // "Esc" is already a readable word and doesn't need an aria-label — kept
  // as a non-nullish "" rather than left undefined, so the control itself
  // stays live/interactive instead of rendering as an inert placeholder
  // (guidelines/06-engineering-standards.md §9's "arg left undefined"
  // bullet), while still accurately reflecting "no aria-label set" here.
  args: {
    "aria-label": "",
  },
  argTypes: {
    children: { control: false },
  },
};

export const Chord: Story = {
  name: "A keyboard chord",
  parameters: { docs: { source: { code: kbdSnippets.chord } } },
  // Both Kbds' children and aria-label are fixed, literal values in the
  // render below (one instance even differs from the other — the ⌘ key
  // has an aria-label, the K key doesn't) — no single control value could
  // represent either prop here, so both are disabled rather than wired to
  // an args value that wouldn't actually drive the canvas.
  argTypes: {
    children: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Text as="span">
      <Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> to open the command
      palette
    </Text>
  ),
};

export const Platform: Story = {
  name: "A combination drawn for the platform",
  parameters: { docs: { source: { code: kbdSnippets.platform } } },
  // The combination is fixed in the render, so neither the key nor its label can be driven from here.
  argTypes: {
    children: { control: false },
    keys: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Text as="span">
      <Kbd keys="mod+shift+p" /> opens the command palette
    </Text>
  ),
};
