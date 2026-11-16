import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Skeleton } from "./Skeleton";
import { skeletonPlaygroundSnippet, skeletonSnippets } from "./Skeleton.snippets";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  id: "atoms-data-display-skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  // Ordered to match SkeletonProps' own declaration order (variant, width,
  // height, animation), then the inherited native escape-hatch props last —
  // same sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
      description:
        "Shape of the placeholder. `text` sits at 1em tall for inline text lines, `circular` for avatars/icons, `rectangular` for images/cards/blocks — always with a soft corner radius (house style), no sharp-cornered option.",
    },
    width: {
      // Explicit `control: "text"` — a `string | number` union isn't a
      // type Storybook can infer a control for automatically, so without
      // this it renders as an inert "-" instead of a live text input
      // (confirmed empirically, same reasoning as Avatar's `src`).
      control: "text",
      description:
        "Width — any valid CSS width value (e.g. '100%', '4rem', or a bare number of pixels like 120).",
    },
    height: {
      control: "text",
      description:
        "Height — any valid CSS height value. Overrides the variant's own default height when set.",
    },
    animation: {
      control: "select",
      options: ["pulse", "wave", "none"],
      description:
        "Loading animation style. `none` always renders statically — same effect as the automatic prefers-reduced-motion override, but chosen deliberately (e.g. a dense table where many simultaneous animations would be distracting).",
    },
    // `control: false` (className/style/id/data-testid) — values that only
    // mean something wired up in real consuming code, not in an isolated
    // Storybook canvas. Matches Avatar/Badge's established precedent.
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
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
  // string" placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5). `width`/
  // `height` have no true component default (both fall back to CSS —
  // block-level 100% width, variant-driven height); empty string keeps
  // their text control interactive while behaving exactly like the prop
  // being unset (an empty inline-style value is treated as absent).
  args: {
    variant: "text",
    width: "",
    height: "",
    animation: "pulse",
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => skeletonPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Text: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => skeletonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { variant: "text", width: "12rem" },
};

export const Circular: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => skeletonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { variant: "circular", width: 48, height: 48 },
};

export const Rectangular: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => skeletonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { variant: "rectangular", width: "16rem", height: "var(--dbm-space-32)" },
};

export const DefaultSizes: Story = {
  name: "Default sizes (no width/height passed)",
  parameters: { docs: { source: { code: skeletonSnippets.defaultSizes } } },
  // `variant`/`width`/`height` are all central to what this story
  // demonstrates (two different variants, deliberately with no width/height
  // passed to either) — no single control value could represent them
  // without contradicting the story's own point, so they're suppressed here
  // the same way Badge's `AllSizes` suppresses its own axis prop. `animation`
  // isn't part of that axis — it applies uniformly to both instances — so it
  // stays wired through `args` rather than hardcoded.
  argTypes: {
    variant: { control: false },
    width: { control: false },
    height: { control: false },
  },
  render: (args) => (
    // Column-direction flex so the rectangular skeleton stretches to fill
    // the container width by default (cross-axis stretch) — demonstrates
    // the same "full width, token-driven height" default it gets in a
    // normal block-level layout, without a flex *row*'s shrink-to-fit
    // sizing hiding it.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-4)",
        maxWidth: "16rem",
      }}
    >
      <Skeleton variant="circular" animation={args.animation} />
      <Skeleton variant="rectangular" animation={args.animation} />
    </div>
  ),
};

export const WaveAnimation: Story = {
  name: "Wave animation",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => skeletonPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    variant: "rectangular",
    width: "16rem",
    height: "var(--dbm-space-32)",
    animation: "wave",
  },
};

export const CardPlaceholder: Story = {
  name: "Composed: card loading placeholder",
  parameters: { docs: { source: { code: skeletonSnippets.cardPlaceholder } } },
  // Same reasoning as DefaultSizes above: `variant`/`width`/`height` are
  // each fixed per-instance by the composition itself (an avatar-shaped
  // circle plus two differently-sized text lines), so no single control
  // value applies — suppressed rather than left silently broken.
  // `animation` is uniform across all three instances, so it stays wired.
  argTypes: {
    variant: { control: false },
    width: { control: false },
    height: { control: false },
  },
  render: (args) => (
    <Stack direction="row" gap={3} style={{ maxWidth: "20rem" }}>
      <Skeleton variant="circular" width={40} height={40} animation={args.animation} />
      <Stack gap={2} style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" animation={args.animation} />
        <Skeleton variant="text" width="90%" animation={args.animation} />
      </Stack>
    </Stack>
  ),
};
