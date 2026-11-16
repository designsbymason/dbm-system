import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Blockquote } from "./Blockquote";
import { blockquotePlaygroundSnippet } from "./Blockquote.snippets";

const meta: Meta<typeof Blockquote> = {
  title: "Components/Blockquote",
  id: "atoms-typography-blockquote",
  component: Blockquote,
  parameters: { layout: "padded" },
  // Ordered to match BlockquoteProps' own declaration order (children,
  // variant, attribution, cite), then the inherited native escape-hatch
  // props last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The quoted text content.",
    },
    variant: {
      control: "select",
      options: ["default", "pull-quote"],
      description:
        "Visual treatment — default is a left-bordered inline quote sized for body copy; pull-quote is a larger, centered treatment with a decorative quote mark, for a standalone editorial callout.",
    },
    attribution: {
      control: "text",
      description:
        "Attribution rendered below the quote in a footer/cite (e.g. 'Jane Doe, CEO of Acme'), the semantic HTML pattern for quote attribution.",
    },
    cite: {
      control: "text",
      description:
        "URL of the source the quote is from — the native blockquote cite attribute. Not rendered visibly by browsers; pass attribution too for a visible citation.",
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
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string" placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children:
      "Design is not just what it looks like and feels like. Design is how it works.",
    variant: "default",
    attribution: "Steve Jobs",
    cite: "https://en.wikiquote.org/wiki/Steve_Jobs",
  },
};

export default meta;

type Story = StoryObj<typeof Blockquote>;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    variant: { control: false },
    attribution: { control: false },
    cite: { control: false },
  },
  args: {
    attribution: undefined,
    cite: undefined,
  },
};

export const WithAttribution: Story = {
  name: "With attribution",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    variant: { control: false },
    attribution: { control: false },
    cite: { control: false },
  },
};

export const PullQuote: Story = {
  name: "Pull quote",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    variant: { control: false },
    attribution: { control: false },
    cite: { control: false },
  },
  args: {
    variant: "pull-quote",
    attribution: undefined,
    cite: undefined,
  },
};

export const PullQuoteWithAttribution: Story = {
  name: "Pull quote with attribution",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    variant: { control: false },
    attribution: { control: false },
    cite: { control: false },
  },
  args: {
    variant: "pull-quote",
  },
};

export const LongQuote: Story = {
  name: "Long quote (wrapping)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => blockquotePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    variant: { control: false },
    attribution: { control: false },
    cite: { control: false },
  },
  args: {
    children:
      "Good design is as little design as possible. Less, but better — because it concentrates on the essential aspects, and the products are not burdened with non-essentials. Back to purity, back to simplicity.",
    attribution: "Dieter Rams",
    cite: undefined,
  },
};
