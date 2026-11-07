import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListPage } from "./DataTableListPageStoryKit";
import type { ListPageProps } from "./DataTableListPageStoryKit";
import { listPageSnippets } from "./DataTableListPage.snippets";

// A page-level template is a whole page, so every story fills the window (`layout: "fullscreen"`, `fullBleed`). On a Docs page the shell
// sits in a frame instead (see DataTableListPage.mdx). It is a story-only example: there is no component and no props list to document,
// so the Controls are the demo's own (how many people the "server" holds, how long a request takes, whether it fails).

/** The demo's controls: they change what the simulated request answers, not how the page is built. */
type DemoArgs = Pick<ListPageProps, "total" | "latency" | "fail">;

const noControls = {
  total: { control: false },
  latency: { control: false },
  fail: { control: false },
} as const;

const meta: Meta<DemoArgs> = {
  title: "Templates/Data pages/Data table list page",
  parameters: { layout: "fullscreen", fullBleed: true },
  args: { total: 137, latency: 400, fail: false },
  argTypes: {
    total: {
      control: { type: "number", min: 0, max: 1000, step: 1 },
      description: "How many people the simulated server holds. 0 shows the page with nothing on it yet.",
    },
    latency: {
      control: { type: "number", min: 0, max: 5000, step: 100 },
      description: "How long a request takes, in milliseconds: a search, a sort, a page or a removal.",
    },
    fail: {
      control: "boolean",
      description: "Makes the request fail. Turn it off and press Try again to see the list come back.",
    },
  },
};

export default meta;

type Story = StoryObj<DemoArgs>;

export const Default: Story = {
  name: "Default",
  parameters: { docs: { source: { code: listPageSnippets.default } } },
  render: (args, context) => <ListPage {...args} framed={context.viewMode === "docs"} />,
};

export const WithFilters: Story = {
  name: "With filters in force",
  parameters: { docs: { source: { code: listPageSnippets.filtered } } },
  argTypes: { ...noControls },
  render: (_args, context) => <ListPage latency={0} initialStatuses={["invited"]} initialDepartments={["design"]} framed={context.viewMode === "docs"} />,
};

export const WithSelection: Story = {
  name: "With rows chosen",
  parameters: { docs: { source: { code: listPageSnippets.selection } } },
  argTypes: { ...noControls },
  render: (_args, context) => <ListPage latency={0} initialSelection={["p1", "p2", "p3"]} framed={context.viewMode === "docs"} />,
};

export const Loading: Story = {
  name: "Loading",
  parameters: { docs: { source: { code: listPageSnippets.loading } } },
  argTypes: { ...noControls },
  // A request that never answers, so the placeholder rows stay.
  render: (_args, context) => <ListPage latency={3_600_000} framed={context.viewMode === "docs"} />,
};

export const NothingYet: Story = {
  name: "Nothing yet",
  parameters: { docs: { source: { code: listPageSnippets.empty } } },
  argTypes: { ...noControls },
  render: (_args, context) => <ListPage latency={0} total={0} framed={context.viewMode === "docs"} />,
};

export const NoResults: Story = {
  name: "No results",
  parameters: { docs: { source: { code: listPageSnippets.noResults } } },
  argTypes: { ...noControls },
  render: (_args, context) => <ListPage latency={0} initialQuery="zzzz" framed={context.viewMode === "docs"} />,
};

export const Failed: Story = {
  name: "The request failed",
  parameters: { docs: { source: { code: listPageSnippets.error } } },
  argTypes: { ...noControls },
  render: (_args, context) => <ListPage latency={0} fail framed={context.viewMode === "docs"} />,
};
