import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";
import { containerPlaygroundSnippet, containerSnippets } from "./Container.snippets";

const meta: Meta<typeof Container> = {
  title: "Components/Container",
  id: "atoms-layout-container",
  component: Container,
  parameters: { layout: "fullscreen" },
  // Ordered to match ContainerProps' own declaration order (as, size,
  // paddingInline, children), then the inherited native escape-hatch props
  // last — same sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    as: {
      control: "select",
      options: ["div", "span", "section", "article", "aside", "header", "footer", "nav", "main"],
      description: "The HTML element (or component) to render as.",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "full"],
      description: "Max-width breakpoint step. 'full' removes the max-width constraint.",
    },
    paddingInline: {
      // A `select` of the single-value form — `Responsive<SpaceValue>` (a
      // number, or a breakpoint-keyed map) has no single control shape
      // Storybook can represent, so the Playground demonstrates the common
      // single-value case; the responsive-map form gets its own dedicated
      // static-reference story below instead (same reasoning as Bleed's
      // `inset`, which shares this exact prop shape).
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Horizontal padding (padding-inline), as a spacing token step (shown here) or a mobile-first responsive map keyed by breakpoint (e.g. { base: 2, lg: 8 }).",
    },
    children: {
      // Container's real content is always a styled demo block (so its
      // max-width/centering effect actually reads visually) — not
      // representable as a plain string control, same reasoning as
      // Affix's own children exclusion.
      control: false,
      description: "The content to center and constrain.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
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
  // string"/"Set object" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md
  // §5).
  args: {
    as: "div",
    size: "xl",
    paddingInline: 4,
  },
};

export default meta;

type Story = StoryObj<typeof Container>;

const demoContent = (
  <div
    style={{
      background: "var(--dbm-bg-brand-subtle)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-primary)",
      padding: "var(--dbm-space-4)",
    }}
  >
    This content is centered and constrained by the Container&apos;s `size`.
  </div>
);

/**
 * Drive every prop live — the demo content itself stays fixed (a styled
 * block, so the max-width/centering effect is actually visible) while
 * as/size/paddingInline are all live.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => containerPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => containerPlaygroundSnippet(context.args),
      },
    },
  },
  // `as`/`paddingInline` aren't the point of this story — a static
  // reference showing the true defaults at whichever `size` you pick — so
  // both are suppressed here, leaving `size` as the one live axis (same
  // reasoning as Skeleton's own Default/Playground split).
  argTypes: { as: { control: false }, paddingInline: { control: false } },
  args: { size: "xl" },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};

export const AllSizes: Story = {
  name: "All sizes stacked",
  parameters: { docs: { source: { code: containerSnippets.allSizes } } },
  argTypes: {
    as: { control: false },
    size: { control: false },
    paddingInline: { control: false },
  },
  render: () => (
    <>
      {(["sm", "md", "lg", "xl", "2xl", "3xl", "full"] as const).map((size) => (
        <Container
          key={size}
          size={size}
          style={{ marginBlockEnd: "var(--dbm-space-4)" }}
        >
          <div
            style={{
              background: "var(--dbm-bg-brand-subtle)",
              borderRadius: "var(--dbm-radius-md)",
              color: "var(--dbm-text-primary)",
              padding: "var(--dbm-space-3)",
            }}
          >
            size=&quot;{size}&quot;
          </div>
        </Container>
      ))}
    </>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (padding never disappears)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => containerPlaygroundSnippet(context.args),
      },
    },
  },
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  argTypes: { as: { control: false }, paddingInline: { control: false } },
  args: { size: "xl" },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};

export const ResponsivePadding: Story = {
  name: "Responsive paddingInline (tight on mobile, roomy from lg up)",
  parameters: { docs: { source: { code: containerSnippets.responsivePadding } } },
  // `parameters.chromatic` removed (2026-08-29) — see NarrowViewport above,
  // same file, for why.
  argTypes: {
    as: { control: false },
    size: { control: false },
    paddingInline: { control: false },
  },
  render: () => (
    <Container size="xl" paddingInline={{ base: 2, lg: 8 }}>
      {demoContent}
    </Container>
  ),
};

export const AsMain: Story = {
  name: 'Polymorphic: as="main" (real landmark element, Container layout behavior)',
  parameters: { docs: { source: { code: containerSnippets.asMain } } },
  argTypes: {
    as: { control: false },
    size: { control: false },
    paddingInline: { control: false },
  },
  render: () => (
    <Container as="main" size="lg">
      {demoContent}
    </Container>
  ),
};
