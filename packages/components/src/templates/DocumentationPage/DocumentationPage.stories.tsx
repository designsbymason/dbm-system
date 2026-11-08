import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentationPage } from "./DocumentationPageStoryKit";
import type { DocumentationPageProps } from "./DocumentationPageStoryKit";
import { documentationPageSnippets } from "./DocumentationPage.snippets";

// A page-level template is a whole page, so every story fills the window (`layout: "fullscreen"`, `fullBleed`). On a Docs page the page sits in a
// frame instead (see DocumentationPage.mdx). It is a story-only example: there is no component and no props list to document, so the Controls are
// the demo's own (how long the page is, and whether it has a contents list).

/** The demo's controls: they change what the page holds, not how it is built. */
type DemoArgs = Pick<DocumentationPageProps, "sections" | "contents">;

const noControls = { sections: { control: false }, contents: { control: false } } as const;

const meta: Meta<DemoArgs> = {
  title: "Templates/Application shells/Documentation Page",
  // A story-only example page, not a component: the Getting started page marks it with an asterisk (the tag reaches its Docs entry).
  tags: ["example-page"],
  parameters: { layout: "fullscreen", fullBleed: true },
  args: { sections: 6, contents: true },
  argTypes: {
    sections: {
      control: { type: "number", min: 1, max: 6, step: 1 },
      description: "How many of the demo's six sections the page has. A short page keeps its footer at the bottom of the window.",
    },
    contents: {
      control: "boolean",
      description: "Whether the end column holds a table of contents. Without it the page takes the room.",
    },
  },
};

export default meta;

type Story = StoryObj<DemoArgs>;

export const Default: Story = {
  name: "Default",
  parameters: { docs: { source: { code: documentationPageSnippets.default } } },
  render: (args, context) => <DocumentationPage {...args} framed={context.viewMode === "docs"} />,
};

export const ShortPage: Story = {
  name: "A short page",
  parameters: { docs: { source: { code: documentationPageSnippets.shortPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DocumentationPage sections={2} framed={context.viewMode === "docs"} />,
};

export const WithoutContents: Story = {
  name: "Without a table of contents",
  parameters: { docs: { source: { code: documentationPageSnippets.withoutContents } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DocumentationPage contents={false} framed={context.viewMode === "docs"} />,
};
