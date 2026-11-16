import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Container } from "../Container";
import { Text } from "../Text";
import { Bleed } from "./Bleed";
import { bleedPlaygroundSnippet, bleedSnippets } from "./Bleed.snippets";

const meta: Meta<typeof Bleed> = {
  title: "Components/Bleed",
  id: "atoms-layout-bleed",
  component: Bleed,
  parameters: { layout: "padded" },
  // Ordered to match BleedProps' own declaration order (inset, side,
  // children), then the inherited native escape-hatch props last — same
  // sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    inset: {
      // A `select` of the single-value form — `Responsive<SpaceValue>`
      // (a number, or a breakpoint-keyed map) has no single control shape
      // Storybook can represent, so the Playground demonstrates the common
      // single-value case; the responsive-map form gets its own dedicated
      // static-reference story below instead (same reasoning as Affix's
      // `offset`).
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "How far to bleed — matching the parent's own padding you're counteracting. Accepts a single spacing step (shown here) or a mobile-first responsive map keyed by breakpoint (e.g. { base: 4, lg: 8 }), matching Container's own paddingInline.",
    },
    side: {
      control: "select",
      options: ["inline", "block", "all"],
      description: "Which axis to bleed on.",
    },
    children: {
      control: "text",
      description: "The content to bleed out of the parent's padding.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles. Applied via the standard CSS cascade — a caller's own margin longhand (matching whichever ones side computes) wins over the bleed margin if both target the same property.",
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
  // Every controllable prop gets an explicit value here, matching a
  // sensible real-world default — an arg left `undefined` renders as an
  // inert "Set string"/"Set object" placeholder instead of a live,
  // interactive control (see 07-storybook-and-documentation-standards.md
  // §5). `inset` has no true component default (it's a required prop, by
  // design — see Bleed.types.ts), so this is a representative demo value,
  // not an actual default.
  args: {
    inset: 6,
    side: "inline",
    children: "Full-width content placeholder",
  },
};

export default meta;

type Story = StoryObj<typeof Bleed>;

/**
 * Drive every prop live. The dashed-border "padded article" chrome around
 * the canvas is Storybook-only demo context (so the bleed is visible
 * against something) — not part of the component itself.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => bleedPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <div
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        maxWidth: "28rem",
        paddingInline: "var(--dbm-space-6)",
        paddingBlock: "var(--dbm-space-4)",
      }}
    >
      <Text>Padded article copy sits inside the dashed border.</Text>
      <Bleed
        {...args}
        style={{
          background: "var(--dbm-bg-canvas)",
          color: "var(--dbm-text-secondary)",
          marginBlock: "var(--dbm-space-4)",
          padding: "var(--dbm-space-4)",
        }}
      />
      <Text>This text stays padded, unaffected by the bleed.</Text>
    </div>
  ),
};

export const Default: Story = {
  name: "Bleeds a full-width block out of a padded article",
  parameters: { docs: { source: { code: bleedSnippets.default } } },
  // `inset`/`side`/`children` are the whole point of this story — a static
  // reference showing one exact, deliberately-chosen combination — so no
  // single control value could represent it without contradicting the
  // story's own point (same reasoning as Skeleton's `DefaultSizes`).
  argTypes: {
    inset: { control: false },
    side: { control: false },
    children: { control: false },
  },
  render: () => (
    <div
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        maxWidth: "28rem",
        paddingInline: "var(--dbm-space-6)",
        paddingBlock: "var(--dbm-space-4)",
      }}
    >
      <Text>Padded article copy sits inside the dashed border.</Text>
      <Bleed inset={6} style={{ marginBlock: "var(--dbm-space-4)" }}>
        <div
          style={{ background: "var(--dbm-bg-canvas)", height: "10rem", width: "100%" }}
        />
      </Bleed>
      <Text>
        The block bleeds all the way to the dashed edge; this text stays
        padded.
      </Text>
    </div>
  ),
};

export const Block: Story = {
  name: 'side="block" (bleeds vertically, stays inset horizontally)',
  parameters: { docs: { source: { code: bleedSnippets.block } } },
  argTypes: {
    inset: { control: false },
    side: { control: false },
    children: { control: false },
  },
  render: () => (
    <div
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        maxWidth: "20rem",
        paddingBlock: "var(--dbm-space-6)",
        paddingInline: "var(--dbm-space-4)",
      }}
    >
      <Bleed inset={6} side="block">
        <div
          style={{
            alignItems: "center",
            background: "var(--dbm-bg-canvas)",
            color: "var(--dbm-text-secondary)",
            display: "flex",
            justifyContent: "center",
            paddingBlock: "var(--dbm-space-4)",
          }}
        >
          Bleeds top/bottom only
        </div>
      </Bleed>
    </div>
  ),
};

export const All: Story = {
  name: 'side="all" (bleeds on every edge)',
  parameters: { docs: { source: { code: bleedSnippets.all } } },
  argTypes: {
    inset: { control: false },
    side: { control: false },
    children: { control: false },
  },
  render: () => (
    <div
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        maxWidth: "20rem",
        padding: "var(--dbm-space-6)",
      }}
    >
      <Bleed inset={6} side="all">
        <div
          style={{
            alignItems: "center",
            background: "var(--dbm-bg-canvas)",
            color: "var(--dbm-text-secondary)",
            display: "flex",
            height: "8rem",
            justifyContent: "center",
          }}
        >
          Bleeds every edge
        </div>
      </Bleed>
    </div>
  ),
};

export const ResponsiveInset: Story = {
  name: "Responsive inset, paired with Container's own responsive padding",
  parameters: { docs: { source: { code: bleedSnippets.responsiveInset } } },
  argTypes: {
    inset: { control: false },
    side: { control: false },
    children: { control: false },
  },
  render: () => (
    <Container
      size="md"
      paddingInline={{ base: 4, lg: 8 }}
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        paddingBlock: "var(--dbm-space-4)",
      }}
    >
      <Text>
        Container&apos;s paddingInline is 4 below the lg breakpoint, 8 from lg
        up — resize the viewport (toolbar above) to see both stay in sync.
      </Text>
      <Bleed
        inset={{ base: 4, lg: 8 }}
        style={{
          background: "var(--dbm-bg-canvas)",
          color: "var(--dbm-text-secondary)",
          marginBlock: "var(--dbm-space-4)",
          padding: "var(--dbm-space-4)",
        }}
      >
        Always bleeds exactly to Container&apos;s own edge, at every width.
      </Bleed>
      <Text>This text stays padded at every width.</Text>
    </Container>
  ),
};
