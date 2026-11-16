import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Divider } from "../Divider";
import { Stack } from "./Stack";
import { stackPlaygroundSnippet, stackSnippets } from "./Stack.snippets";

const meta: Meta<typeof Stack> = {
  title: "Components/Stack",
  id: "atoms-layout-stack",
  component: Stack,
  parameters: { layout: "padded" },
  // Ordered to match StackProps' own declaration order (as, direction, gap,
  // align, justify, wrap, divider, children), then the inherited native
  // escape-hatch props last — same sequencing principle the Properties
  // table uses (guidelines/07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    as: {
      control: "select",
      options: ["div", "ul", "ol", "nav", "section", "span"],
      description: "The HTML element (or component) to render as.",
    },
    direction: {
      control: "radio",
      options: ["row", "column", "row-reverse", "column-reverse"],
      description:
        "Flex direction of the stack (single value, or a mobile-first responsive map keyed by breakpoint).",
    },
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Gap between children, as a spacing token step (single value, or a mobile-first responsive map keyed by breakpoint).",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description:
        "align-items along the cross axis (single value, or a mobile-first responsive map keyed by breakpoint).",
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
      description:
        "justify-content along the main axis (single value, or a mobile-first responsive map keyed by breakpoint).",
    },
    wrap: {
      control: "boolean",
      description:
        "Whether children wrap onto new lines when they overflow the main axis (single value, or a mobile-first responsive map keyed by breakpoint).",
    },
    divider: {
      control: false,
      description:
        "An element (typically a Divider) automatically inserted between every child.",
    },
    children: {
      // Stack's real content is always a set of styled demo swatches (so
      // the layout behavior actually reads visually) — not representable
      // as a plain string control, same reasoning as Container's own
      // `children` exclusion.
      control: false,
      description: "The content to stack.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    as: "div",
    direction: "column",
    gap: 0,
    align: "stretch",
    justify: "start",
    wrap: false,
  },
};

export default meta;

type Story = StoryObj<typeof Stack>;

const swatchStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-3)",
};

const Swatches = () => (
  <>
    <div style={swatchStyle}>One</div>
    <div style={swatchStyle}>Two</div>
    <div style={swatchStyle}>Three</div>
  </>
);

const disableAllAxes = {
  as: { control: false },
  direction: { control: false },
  gap: { control: false },
  align: { control: false },
  justify: { control: false },
  wrap: { control: false },
} as const;

/**
 * Drive every prop live — the demo content itself stays fixed (a set of
 * styled swatches, so the layout effect is actually visible) while
 * as/direction/gap/align/justify/wrap are all live.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => stackPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <Stack {...args}>
      <Swatches />
    </Stack>
  ),
};

export const Row: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => stackPlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: disableAllAxes,
  args: { direction: "row", gap: 4 },
  render: (args) => (
    <Stack {...args}>
      <Swatches />
    </Stack>
  ),
};

export const AlignAndJustify: Story = {
  name: "Align + justify",
  parameters: { docs: { source: { code: stackSnippets.alignAndJustify } } },
  argTypes: disableAllAxes,
  args: { direction: "row", gap: 4, align: "center", justify: "between" },
  render: (args) => (
    <Stack
      {...args}
      style={{
        background: "var(--dbm-bg-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        height: "var(--dbm-space-24)",
        padding: "var(--dbm-space-3)",
      }}
    >
      <Swatches />
    </Stack>
  ),
};

export const ReversedDirection: Story = {
  name: "Reversed direction (row-reverse / column-reverse)",
  parameters: { docs: { source: { code: stackSnippets.reversedDirection } } },
  argTypes: disableAllAxes,
  render: () => (
    <Stack gap={8}>
      <Stack direction="row-reverse" gap={4} align="center">
        <Swatches />
      </Stack>
      <Stack direction="column-reverse" gap={4} align="center">
        <Swatches />
      </Stack>
    </Stack>
  ),
};

export const AllGapSteps: Story = {
  name: "All gap steps",
  parameters: { docs: { source: { code: stackSnippets.allGapSteps } } },
  argTypes: disableAllAxes,
  render: () => (
    <Stack gap={6}>
      {([0, 1, 2, 4, 8, 16, 32] as const).map((gap) => (
        <Stack key={gap} direction="row" gap={gap} align="center">
          <span style={{ color: "var(--dbm-text-secondary)", width: "var(--dbm-space-16)" }}>
            gap={gap}
          </span>
          <Swatches />
        </Stack>
      ))}
    </Stack>
  ),
};

export const Wrapping: Story = {
  name: "Wrapping row at narrow widths",
  parameters: { docs: { source: { code: stackSnippets.wrapping } } },
  argTypes: disableAllAxes,
  args: { direction: "row", gap: 2, wrap: true },
  render: (args) => (
    <Stack {...args} style={{ maxWidth: "16rem" }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={swatchStyle}>
          Item {i + 1}
        </div>
      ))}
    </Stack>
  ),
};

export const ResponsiveDirection: Story = {
  name: "Responsive direction (column on mobile, row from md up)",
  parameters: { docs: { source: { code: stackSnippets.responsiveDirection } } },
  argTypes: disableAllAxes,
  render: () => (
    <Stack direction={{ base: "column", md: "row" }} gap={4}>
      <Swatches />
    </Stack>
  ),
};

export const ResponsiveEverything: Story = {
  name: "Responsive gap, align, justify, and wrap together",
  parameters: { docs: { source: { code: stackSnippets.responsiveEverything } } },
  argTypes: disableAllAxes,
  render: () => (
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={{ base: 2, md: 6 }}
      align={{ base: "stretch", md: "center" }}
      justify={{ base: "start", md: "between" }}
      wrap={{ base: false, md: true }}
      style={{
        background: "var(--dbm-bg-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-3)",
      }}
    >
      <Swatches />
    </Stack>
  ),
};

export const AsUnorderedList: Story = {
  name: 'Polymorphic: as="ul" (real semantic list, Stack layout behavior)',
  parameters: { docs: { source: { code: stackSnippets.asUnorderedList } } },
  argTypes: disableAllAxes,
  render: () => (
    <Stack
      as="ul"
      direction="row"
      gap={3}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      <li style={swatchStyle}>One</li>
      <li style={swatchStyle}>Two</li>
      <li style={swatchStyle}>Three</li>
    </Stack>
  ),
};

export const WithDivider: Story = {
  name: "divider (auto-inserted between children)",
  parameters: { docs: { source: { code: stackSnippets.withDivider } } },
  argTypes: disableAllAxes,
  render: () => (
    // `height`, not `minHeight` — a vertical Divider's own `height: 100%`
    // doesn't resolve against a `min-height`-only ancestor, so it collapses
    // to the divider's own 1px content height instead of stretching to fill
    // the row (see Divider.stories.tsx's own ResponsiveOrientation story for
    // the same fix, and Divider.mdx's Accessibility/Don't notes for why).
    <Stack
      direction="row"
      align="center"
      style={{ color: "var(--dbm-text-primary)", height: "var(--dbm-space-10)" }}
      divider={<Divider orientation="vertical" />}
    >
      <span style={{ padding: "var(--dbm-space-2)" }}>One</span>
      <span style={{ padding: "var(--dbm-space-2)" }}>Two</span>
      <span style={{ padding: "var(--dbm-space-2)" }}>Three</span>
    </Stack>
  ),
};
