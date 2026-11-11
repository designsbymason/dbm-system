import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarketingPage } from "./MarketingPageStoryKit";
import type { MarketingPageProps } from "./MarketingPageStoryKit";
import { marketingPageSnippets } from "./MarketingPage.snippets";

// A page-level template is a whole page, so every story fills the window (`layout: "fullscreen"`, `fullBleed`). On a Docs page the page sits in a
// frame instead (see MarketingPage.mdx). It is a story-only example: there is no component and no props list to document, so the Controls are
// the demo's own (how many feature cards the page has, and whether it has a strip of figures).

/** The demo's controls: they change what the page holds, not how it is built. */
type DemoArgs = Pick<MarketingPageProps, "features" | "proof">;

const noControls = { features: { control: false }, proof: { control: false } } as const;

const meta: Meta<DemoArgs> = {
  title: "Templates/Data pages/Marketing Page",
  // A story-only example page, not a component: the Getting started page marks it with an asterisk (the tag reaches its Docs entry).
  tags: ["example-page"],
  parameters: { layout: "fullscreen", fullBleed: true },
  args: { features: 3, proof: true },
  argTypes: {
    features: {
      control: { type: "number", min: 1, max: 3, step: 1 },
      description: "How many of the demo's three feature cards the page has. The cards reflow from three columns to one.",
    },
    proof: {
      control: "boolean",
      description: "Whether the strip of figures sits between the features and the call to action. It is the page's full-width section.",
    },
  },
};

export default meta;

type Story = StoryObj<DemoArgs>;

export const Default: Story = {
  name: "Default",
  parameters: { docs: { source: { code: marketingPageSnippets.default } } },
  render: (args, context) => <MarketingPage {...args} framed={context.viewMode === "docs"} />,
};

export const ShortPage: Story = {
  name: "A short page",
  parameters: { docs: { source: { code: marketingPageSnippets.shortPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <MarketingPage features={1} proof={false} framed={context.viewMode === "docs"} />,
};
