import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013). This resolves `Toast.Provider`'s own argTypes for its Properties table: the
// Playground's meta carries the provider's props and a toast's in one render, so a table built from it would mix
// the two. A compound sub-part's `component: Parent.Sub` is a property access docgen can't trace, so every row
// is declared here with its own description and default.
const meta: Meta<typeof Toast.Provider> = {
  title: "Organisms/Feedback/Toast/Provider",
  component: Toast.Provider,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The part of the page the toasts are for — usually the whole app — and any declarative Toast. The provider draws nothing of its own here: the toasts are drawn in a region at the end of the page.",
    },
    placement: {
      control: "select",
      options: ["top-end", "top", "top-start", "bottom-end", "bottom", "bottom-start"],
      description:
        "The corner or edge the toasts stack against. start and end are logical: the left and right in left-to-right text, swapped in right-to-left. A mobile-first map such as { base: \"bottom\", md: \"top-end\" } switches it at a breakpoint. Below the sm breakpoint a toast spans the screen less a gutter, so only top versus bottom matters there.",
      table: { defaultValue: { summary: '"top-end"' } },
    },
    stack: {
      control: "select",
      options: ["list", "fan"],
      description:
        "How the toasts sit in the region. list shows each in full, one under another; fan shows the newest in full with the older ones peeking out behind it, up to three layers, spread out into the list while the pointer is over the toasts or focus is inside them and folded back a moment after both go. A mobile-first map such as { base: \"fan\", md: \"list\" } switches it at a breakpoint.",
      table: { defaultValue: { summary: '"list"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size of every toast, unless one says otherwise.",
      table: { defaultValue: { summary: '"md"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description: "How every toast is drawn, unless one says otherwise.",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    limit: {
      control: "number",
      description:
        "The most toasts showing at once. Those past it wait, and appear as room is made, each starting its own time when it appears.",
      table: { defaultValue: { summary: "3" } },
    },
    duration: {
      control: false,
      description:
        "How long a toast stays, in milliseconds, unless it says otherwise. null keeps toasts until they are dismissed. Paused while the pointer is over the toasts or focus is inside them, and while the window is in the background.",
      table: { defaultValue: { summary: "5000" } },
    },
    clearAll: {
      control: "boolean",
      description:
        "Draws a button that closes every toast, and drops the ones waiting, once more than one is showing. It is in the region's tab order. labels.clearAll renames it.",
      table: { defaultValue: { summary: "true" } },
    },
    mergeDuplicates: {
      control: "boolean",
      description:
        "Raising a plain message again while it is still showing (the same tone, title and description, with no id) shows it once, with a count, and starts its time again, instead of stacking copies. An action and callbacks must be the very same functions to merge; a handler written inline at each call is a different function and keeps the toasts apart.",
      table: { defaultValue: { summary: "true" } },
    },
    hotkey: {
      control: false,
      description:
        "The keys that move focus into the toasts' region, held together, as KeyboardEvent property or code names (altKey, KeyT). The region's accessible name says which.",
      table: { defaultValue: { summary: '["F8"]' } },
    },
    swipeThreshold: {
      control: { type: "number", min: 10, max: 300 },
      description:
        "How far, in pixels, a toast has to be dragged toward the edge before letting go closes it. A shorter drag springs back. Raise it where toasts sit under a thumb that scrolls, lower it for an easier swipe.",
      table: { defaultValue: { summary: "50" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction, which sets which way a swipe closes a toast. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    formatNumber: {
      control: false,
      description:
        "Writes the numbers the toasts show: the count of a repeated message. Defaults to String, never to the browser's locale.",
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself, each part replaceable: dismiss (the dismiss button's name), viewport (the region's name, {hotkey} replaced by the shortcut), notification (read before each toast), clearAll (the Clear all button) and repeated (a function of the plain count, written with formatNumber by default).",
    },
    toaster: {
      control: false,
      description:
        "A queue made with createToaster(), so toasts can be raised from outside React (an API client, a service module). The provider makes its own when left out. One provider per toaster.",
    },
    container: {
      control: false,
      description:
        "The element the toasts' region is drawn into: the page's body when left out. For a demo that has to stay inside a box, give it an element that is a containing block for position: fixed.",
    },
    id: {
      control: false,
      description: "Standard DOM id, on the list the toasts are in.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the list the toasts are in.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute on the list the toasts are in.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Toast.Provider>;

export const Default: Story = {
  render: (args) => <Toast.Provider {...args} />,
};
