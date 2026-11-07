import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Navbar } from "../../organisms/Navbar";
import { DirectionProvider } from "./DirectionProvider";
import { directionProviderPlaygroundSnippet, directionProviderSnippets } from "./DirectionProvider.snippets";

const meta: Meta<typeof DirectionProvider> = {
  title: "Atoms/Utility/DirectionProvider",
  component: DirectionProvider,
  parameters: { layout: "padded" },
  argTypes: {
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction for everything inside. A direction-aware component given no `dir` of its own uses this one; a `dir` on the component itself still wins.",
    },
    children: { control: false, description: "What the direction applies to. The provider draws no element of its own." },
  },
  args: { dir: "ltr" },
};

export default meta;

type Story = StoryObj<typeof DirectionProvider>;

function Brand({ rtl }: { rtl?: boolean }) {
  return (
    <Navbar.Brand href="/">
      {rtl ? "أكمي" : "Acme"}
    </Navbar.Brand>
  );
}

/** Change `dir` and the navbar below mirrors with it: it was given no `dir` of its own. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        transform: (_code: string, context: StoryContext) => directionProviderPlaygroundSnippet(context.args as { dir?: "ltr" | "rtl" }),
      },
    },
  },
  render: ({ dir }) => (
    <DirectionProvider dir={dir}>
      <Navbar>
        <Brand rtl={dir === "rtl"} />
      </Navbar>
    </DirectionProvider>
  ),
};

/** One provider near the root sets the direction for every direction-aware component inside. */
export const WholeApp: Story = {
  parameters: { docs: { source: { code: directionProviderSnippets.wholeApp } } },
  argTypes: { dir: { control: false } },
  render: () => (
    <DirectionProvider dir="rtl">
      <Navbar>
        <Brand rtl />
      </Navbar>
    </DirectionProvider>
  ),
};

/** A `dir` on the component itself wins, for one island that reads the other way. */
export const OwnDirWins: Story = {
  name: "A component's own dir wins",
  parameters: { docs: { source: { code: directionProviderSnippets.ownWins } } },
  argTypes: { dir: { control: false } },
  render: () => (
    <DirectionProvider dir="rtl">
      <Navbar>
        <Brand rtl />
      </Navbar>
      <section aria-label="English island">
        <Navbar dir="ltr">
          <Brand />
        </Navbar>
      </section>
    </DirectionProvider>
  ),
};
