import { UserIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Icon } from "../Icon";
import { Image } from "./Image";
import { imagePlaygroundSnippet, imageSnippets } from "./Image.snippets";

// A real photo (1000×667, ~3:2 landscape), served from `.storybook/public/`
// via Storybook's `staticDirs` config (see `.storybook/main.ts`) — used
// across every story that needs a real, loadable image. The broken-src
// stories below deliberately keep an invalid URL instead, since their whole
// point is demonstrating the fallback.
const PLACEHOLDER_IMAGE_URL = "/placeholder-img.png";

const radiusOptions = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "full",
] as const;

const objectFitOptions = [
  "cover",
  "contain",
  "fill",
  "none",
  "scale-down",
] as const;

const positionOptions = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  id: "atoms-media-image",
  component: Image,
  parameters: { layout: "padded" },
  // Ordered to match ImageProps' own declaration order (src, alt, fallback,
  // width, height, aspectRatio, objectFit, position, radius, loading,
  // onError, other native img escape hatches, then the wrapper escape
  // hatches last) — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    src: {
      control: "text",
      description: "The image URL. Omit (or leave empty) to show `fallback` immediately.",
    },
    alt: {
      control: "text",
      description:
        "Accessible description — required. Pass \"\" for a purely decorative image.",
    },
    fallback: {
      // A ReactNode, not representable as a plain control — and a
      // non-primitive resolved arg value breaks Storybook's own "Show
      // code" panel for any story relying on {...args} (found during
      // Icon's own review, 2026-09-03) — left unset in this meta's own
      // `args` for that reason too, not just because it's uncontrollable.
      control: false,
      description: "Rendered in place of the image when src is missing or fails to load.",
    },
    width: {
      control: "number",
      description: "Sizes the wrapper directly (also stays on the <img> as a native attribute) — alone, with height, or with aspectRatio.",
    },
    height: {
      control: "number",
      description: "Sizes the wrapper directly (also stays on the <img> as a native attribute) — alone, with width, or with aspectRatio.",
    },
    aspectRatio: {
      control: "number",
      description: "Locks the image to a ratio (e.g. 16/9), like the CSS aspect-ratio property.",
    },
    objectFit: {
      control: "select",
      options: objectFitOptions,
      description: "How the image fills its box once aspectRatio (or an explicit height) constrains it.",
    },
    position: {
      control: "select",
      options: positionOptions,
      description: "Where the image anchors when cropped (objectFit=\"cover\"/\"none\") — sets CSS object-position, not layout position.",
    },
    radius: {
      control: "select",
      options: radiusOptions,
      description: "Corner radius, matching the primitive radius token scale.",
    },
    loading: {
      control: "select",
      options: ["lazy", "eager"],
      description: "Native browser loading strategy.",
    },
    onError: {
      control: false,
      description: "Fired when src fails to load, after Image has already switched to its own fallback.",
    },
    srcSet: { control: false, description: "A set of image candidates for responsive loading." },
    sizes: { control: false, description: "Paired with srcSet — the viewport-width conditions each candidate applies at." },
    decoding: { control: false, description: "Hints the browser's own image-decoding strategy." },
    id: {
      control: false,
      description:
        "DOM id, applied to the outer wrapper so it survives the fallback swap. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization — applied to the outer wrapper.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the wrapper's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing, applied to the outer wrapper so it survives the fallback swap.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set object" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md
  // §5). `fallback` is deliberately left unset — see its own argTypes
  // entry above.
  args: {
    src: PLACEHOLDER_IMAGE_URL,
    alt: "Placeholder image",
    // `aspectRatio` has no true default (undefined = the image's own
    // natural ratio) — given a sensible non-blank demo value here so its
    // Playground control starts as a live, editable number input instead
    // of an inert "Set number" placeholder (see
    // guidelines/07-storybook-and-documentation-standards.md §5).
    aspectRatio: 4 / 3,
    objectFit: "cover",
    position: "center",
    radius: "none",
    loading: "lazy",
  },
};

export default meta;

type Story = StoryObj<typeof Image>;

/** Drive every prop live — wrapped in a fixed-width demo container so radius/objectFit/position/aspectRatio/width/height all read visually. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => imagePlaygroundSnippet(context.args),
      },
    },
  },
  // `width`/`height` default here (not at the meta level) specifically so
  // AspectRatio169/Rounded below — which inherit meta args and only
  // override `aspectRatio`/`radius` locally — aren't affected. Chosen to
  // exactly match the meta-level `aspectRatio: 4/3` default (200/150 =
  // 4/3), so the Playground opens with all three genuinely consistent
  // (no dev-mode warning on first load) — try changing any one of them to
  // see the `width`/`height`-wins-and-warns behavior.
  args: { width: 200, height: 150 },
  render: (args) => (
    <div style={{ width: "16rem" }}>
      <Image {...args} />
    </div>
  ),
};

const disableAllAxes = {
  src: { control: false },
  alt: { control: false },
  width: { control: false },
  height: { control: false },
  aspectRatio: { control: false },
  objectFit: { control: false },
  position: { control: false },
  radius: { control: false },
  loading: { control: false },
} as const;

export const Default: Story = {
  parameters: { docs: { source: { code: imageSnippets.default } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ width: "16rem" }}>
      <Image src={PLACEHOLDER_IMAGE_URL} alt="Placeholder image" />
    </div>
  ),
};

export const AllRadii: Story = {
  name: "All radii",
  parameters: { docs: { source: { code: imageSnippets.allRadii } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
      {radiusOptions.map((radius) => (
        <div key={radius} style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
          <div style={{ width: "var(--dbm-space-16)" }}>
            <Image src={PLACEHOLDER_IMAGE_URL} alt="" radius={radius} aspectRatio={1} />
          </div>
          <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
            {radius}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const AllObjectFit: Story = {
  name: "All objectFit modes",
  parameters: { docs: { source: { code: imageSnippets.allObjectFit } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
      {objectFitOptions.map((objectFit) => (
        <div key={objectFit} style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
          <div
            style={{
              background: "var(--dbm-bg-neutral-subtle)",
              height: "var(--dbm-space-16)",
              width: "var(--dbm-space-16)",
            }}
          >
            <Image src={PLACEHOLDER_IMAGE_URL} alt="" objectFit={objectFit} style={{ height: "100%", width: "100%" }} />
          </div>
          <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
            {objectFit}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const AllPositions: Story = {
  name: "All positions (objectFit=\"cover\")",
  parameters: { docs: { source: { code: imageSnippets.allPositions } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
      {positionOptions.map((position) => (
        <div key={position} style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
          <div style={{ width: "var(--dbm-space-16)" }}>
            <Image
              src={PLACEHOLDER_IMAGE_URL}
              alt=""
              aspectRatio={1}
              objectFit="cover"
              position={position}
            />
          </div>
          <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
            {position}
          </span>
        </div>
      ))}
    </div>
  ),
};

// `width`/`height` are deliberately left out of `disableAllAxes` above (that
// object also disables `aspectRatio`/`radius`, the very props these two
// stories exist to demonstrate) — suppressed locally here instead. Left
// live, they'd have no default value (an inert "Set number" placeholder,
// the same bug this fix addresses elsewhere) and, if a visitor set both,
// would silently override the exact `aspectRatio`/`radius` behavior the
// story is showing — that interaction already has its own dedicated
// `SizingPrecedence` story.
const disableWidthHeight = {
  width: { control: false },
  height: { control: false },
} as const;

export const AspectRatio169: Story = {
  name: "Locked aspect ratio (16:9)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => imagePlaygroundSnippet(context.args, "20rem"),
      },
    },
  },
  argTypes: disableWidthHeight,
  args: { aspectRatio: 16 / 9 },
  render: (args) => (
    <div style={{ width: "20rem" }}>
      <Image {...args} />
    </div>
  ),
};

export const Rounded: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => imagePlaygroundSnippet(context.args, "8rem"),
      },
    },
  },
  argTypes: disableWidthHeight,
  args: { radius: "full", aspectRatio: 1 },
  render: (args) => (
    <div style={{ width: "var(--dbm-space-32)" }}>
      <Image {...args} />
    </div>
  ),
};

export const SizingPrecedence: Story = {
  name: "Sizing precedence (width/height vs aspectRatio)",
  parameters: { docs: { source: { code: imageSnippets.sizingPrecedence } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
        <Image src={PLACEHOLDER_IMAGE_URL} alt="" width={160} height={80} aspectRatio={1} />
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
          width=160 height=80 aspectRatio=1 (width/height win)
        </span>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
        <Image src={PLACEHOLDER_IMAGE_URL} alt="" width={160} aspectRatio={2} />
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
          width=160 aspectRatio=2 (height computed)
        </span>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
        <Image src={PLACEHOLDER_IMAGE_URL} alt="" height={80} aspectRatio={2} />
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
          height=80 aspectRatio=2 (width computed)
        </span>
      </div>
    </div>
  ),
};

export const BrokenDefaultFallback: Story = {
  name: "Broken src, default fallback",
  parameters: { docs: { source: { code: imageSnippets.brokenDefaultFallback } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ width: "12rem" }}>
      <Image
        src="https://broken.invalid/not-found.jpg"
        alt="Placeholder image"
        aspectRatio={1}
        radius="md"
      />
    </div>
  ),
};

export const BrokenCustomFallback: Story = {
  name: "Broken src, custom fallback (overrides the default)",
  parameters: { docs: { source: { code: imageSnippets.brokenCustomFallback } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ width: "12rem" }}>
      <Image
        src="https://broken.invalid/not-found.jpg"
        alt="Placeholder image"
        aspectRatio={1}
        radius="md"
        fallback={<Icon icon={UserIcon} size="lg" />}
      />
    </div>
  ),
};

export const Decorative: Story = {
  name: 'Decorative (alt="") — hidden from the accessibility tree either way',
  parameters: { docs: { source: { code: imageSnippets.decorative } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      <div style={{ width: "8rem" }}>
        <Image src={PLACEHOLDER_IMAGE_URL} alt="" />
      </div>
      <div style={{ width: "8rem" }}>
        <Image alt="" />
      </div>
    </div>
  ),
};
