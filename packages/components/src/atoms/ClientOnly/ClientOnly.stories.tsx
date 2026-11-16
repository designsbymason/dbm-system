import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "../Skeleton";
import { Text } from "../Text";
import { ClientOnly } from "./ClientOnly";
import { clientOnlyPlaygroundSnippet, clientOnlySnippets } from "./ClientOnly.snippets";

const meta: Meta<typeof ClientOnly> = {
  title: "Components/ClientOnly",
  id: "atoms-utility-clientonly",
  component: ClientOnly,
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: "text",
      description: "Rendered once mounted on the client.",
    },
    fallback: {
      control: "text",
      // Storybook's own preview is a plain client-only render (no
      // server-rendered HTML behind it), and `ClientOnly` only ever shows
      // `fallback` while hydrating real server HTML — so this control is
      // genuinely wired to the real prop, but editing it never changes
      // what's on the canvas here. See the Docs page's Playground section
      // for the full explanation, and ClientOnly.test.tsx for a test that
      // does exercise the real hydration path.
      description:
        "Rendered during SSR / while hydrating it. Never visible in this Storybook preview — see the Docs page.",
      table: { defaultValue: { summary: "null" } },
    },
  },
  args: {
    children: "Rendered once mounted on the client.",
    fallback: "Loading…",
  },
};

export default meta;

type Story = StoryObj<typeof ClientOnly>;

/**
 * Drive every prop live. `fallback` never actually renders in this canvas —
 * Storybook previews are plain client-only renders with no server HTML to
 * hydrate, so there's no hydration mismatch for `ClientOnly` to guard
 * against here, and `children` render immediately. See the Docs page for
 * the full explanation and a real, verified example of the fallback phase.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => clientOnlyPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <ClientOnly fallback={<Text color="secondary">{args.fallback}</Text>}>
      <Text>{args.children}</Text>
    </ClientOnly>
  ),
};

export const Default: Story = {
  argTypes: { fallback: { control: false } },
  args: { fallback: undefined },
  render: (args) => (
    <ClientOnly>
      <Text>{args.children}</Text>
    </ClientOnly>
  ),
};

export const WithFallback: Story = {
  name: "With a loading fallback",
  parameters: { docs: { source: { code: clientOnlySnippets.withFallback } } },
  argTypes: { children: { control: false } },
  args: { children: "Content that depends on a browser-only API." },
  render: (args) => (
    <ClientOnly fallback={<Skeleton variant="text" width="16rem" />}>
      <Text>{args.children}</Text>
    </ClientOnly>
  ),
};
