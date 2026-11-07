import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { CSSProperties, ReactNode } from "react";
import { HouseIcon, KeyboardIcon } from "@dbm-system/icons";
import { Text } from "../../atoms/Text";
import { Breadcrumb } from "./Breadcrumb";
import { breadcrumbPlaygroundSnippet, breadcrumbSnippets } from "./Breadcrumb.snippets";
import type {
  BreadcrumbCompact,
  BreadcrumbProps,
  BreadcrumbSeparator,
  BreadcrumbSize,
  BreadcrumbTone,
} from "./Breadcrumb.types";

// `Breadcrumb.Item`, `Breadcrumb.Link` and `Breadcrumb.Page` each get their own
// Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  size: BreadcrumbSize;
  tone: BreadcrumbTone;
  underline: boolean;
  separator: string;
  // A select: "off" leaves `maxItems` out (the trail never collapses), a number collapses past that many items,
  // and "container" collapses to fit the width.
  maxItems: string;
  compact: BreadcrumbCompact;
  truncate: boolean;
  itemsBeforeCollapse: number;
  itemsAfterCollapse: number;
  "aria-label": string;
  dir: "ltr" | "rtl";
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  labels: BreadcrumbProps["labels"];
  children: BreadcrumbProps["children"];
}

const demoContainerStyle = { maxWidth: "48rem" } as const;

const trailItems = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Keyboards", "/products/keyboards"],
  ["Mechanical", "/products/keyboards/mechanical"],
  ["Switches", "/products/keyboards/mechanical/switches"],
  ["Linear", "/products/keyboards/mechanical/switches/linear"],
] as const;

type DemoTrailProps = Omit<BreadcrumbProps, "children"> & { count?: number };

/**
 * A box whose width can be dragged, for watching a component respond to the room it has. `resize` only works on a box whose
 * `overflow` isn't `visible`, and such a box clips anything drawn outside it — including a focus ring, which reaches 6px beyond a
 * control (a 4px offset and a 2px line). So the box has padding to hold a ring at its edge.
 */
const ResizeBox = ({ children, maxWidth, ...props }: { children: ReactNode; maxWidth: string; "data-testid"?: string }) => (
  <div style={{ maxWidth, resize: "horizontal", overflow: "auto", padding: "var(--dbm-space-2)" }} {...props}>
    {children}
  </div>
);

/**
 * That the focus ring of `control` (which must have keyboard focus) is not cut off: it fits inside every ancestor that clips its
 * overflow. Measured from the ring's real width and offset, not assumed.
 */
const expectRingUnclipped = async (control: HTMLElement) => {
  const style = getComputedStyle(control);
  await expect(style.outlineStyle, "the control shows a focus ring").toBe("solid");
  const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
  const box = control.getBoundingClientRect();
  for (let element = control.parentElement; element && element !== document.documentElement; element = element.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(element);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const rect = element.getBoundingClientRect();
    const left = rect.left + element.clientLeft;
    const top = rect.top + element.clientTop;
    await expect(box.left - reach, `${element.tagName} clips the ring on the left`).toBeGreaterThanOrEqual(left - 0.5);
    await expect(box.top - reach, `${element.tagName} clips the ring on the top`).toBeGreaterThanOrEqual(top - 0.5);
    await expect(box.right + reach, `${element.tagName} clips the ring on the right`).toBeLessThanOrEqual(left + element.clientWidth + 0.5);
    await expect(box.bottom + reach, `${element.tagName} clips the ring at the bottom`).toBeLessThanOrEqual(top + element.clientHeight + 0.5);
  }
};

/** A small, real trail the gallery stories vary: links, then the current page last. */
const DemoTrail = ({ count = 4, ...props }: DemoTrailProps) => (
  <Breadcrumb {...props}>
    {trailItems.slice(0, count).map(([label, href], index) => (
      <Breadcrumb.Item key={href}>
        {index === count - 1 ? (
          <Breadcrumb.Page>{label}</Breadcrumb.Page>
        ) : (
          <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>
        )}
      </Breadcrumb.Item>
    ))}
  </Breadcrumb>
);

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const noControls = {
  size: { control: false },
  tone: { control: false },
  underline: { control: false },
  separator: { control: false },
  maxItems: { control: false },
  compact: { control: false },
  truncate: { control: false },
  itemsBeforeCollapse: { control: false },
  itemsAfterCollapse: { control: false },
  "aria-label": { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Navigation/Breadcrumb",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The trail, in order from the top of the site down: one Breadcrumb.Item per level, the last holding Breadcrumb.Page.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the text, icons and gaps.",
      table: { defaultValue: { summary: '"md"' } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info"],
      description:
        "The colour of the links: info (the standard link colour, text.link), brand (the brand theme's accent text) or neutral (quiet secondary text that darkens on hover). The current page is always primary text. Place info and brand links on a surface, not on the canvas.",
      table: { defaultValue: { summary: '"info"' } },
    },
    underline: {
      control: "boolean",
      description:
        "Underlines every link all the time. Left false, a link is underlined only while hovered — in the link's own colour either way.",
      table: { defaultValue: { summary: "false" } },
    },
    separator: {
      control: "select",
      options: ["chevron", "slash", "›", "•"],
      description:
        'What sits between two items: "chevron" (the default, flips under right-to-left text), "slash", or any string or element. Always hidden from assistive technology.',
      table: { defaultValue: { summary: '"chevron"' } },
    },
    maxItems: {
      control: "select",
      // The values a real caller can pass: a number of items, or "container". (Leaving the prop out is the default.)
      options: [3, 4, 5, "container"],
      description:
        'Collapses a long trail: the middle is replaced by a "…" button that shows them all when used. A number collapses once there are more items than that; "container" collapses only as many as it takes to fit the trail\'s own width, measured in the browser. Left out, the trail never collapses and wraps instead.',
    },
    compact: {
      control: "select",
      options: ["never", "auto", "always"],
      description:
        'Collapses the trail to a single "back to the parent page" link — the item above the current page, with a back arrow: never (the default), auto (on a phone-width screen) or always.',
      table: { defaultValue: { summary: '"never"' } },
    },
    truncate: {
      control: "boolean",
      description:
        "Keeps the trail on one line and cuts a label that doesn't fit short with an ellipsis, the longest first. The full text stays in the page for screen readers, and as a tooltip for plain-text labels. Off, a long trail wraps.",
      table: { defaultValue: { summary: "false" } },
    },
    itemsBeforeCollapse: {
      control: "number",
      description: 'How many items stay visible at the start of a collapsed trail, before the "…" button.',
      table: { defaultValue: { summary: "1" } },
    },
    itemsAfterCollapse: {
      control: "number",
      description:
        'How many items stay visible at the end of a collapsed trail, after the "…" button — always at least 1, since the last item is the current page.',
      table: { defaultValue: { summary: "2" } },
    },
    labels: {
      control: false,
      description:
        'The text the component supplies itself, each part replaceable: navigation (the nav\'s accessible name, "Breadcrumb") and expand (a function of how many items are hidden, naming the "…" button).',
    },
    "aria-label": {
      control: "text",
      description:
        "The nav's accessible name, overriding labels.navigation. Give each breadcrumb a distinct name when a page holds more than one.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of a visible element that names the nav, in place of aria-label.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute passed to the nav: mirrors the trail and flips the chevron. Left out, the nearest DirectionProvider's; with none, inherited from the page.",
    },
    id: {
      control: false,
      description: "Standard DOM id, on the nav.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    tone: "info",
    underline: false,
    separator: "chevron",
    maxItems: "off",
    compact: "never",
    truncate: false,
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 2,
    "aria-label": "Breadcrumb",
    dir: "ltr",
  },
  render: (args) => {
    const maxItems = args.maxItems === "off" ? undefined : args.maxItems === "container" ? "container" : Number(args.maxItems);
    const collapsing = maxItems !== undefined;
    return (
      // Resizable, so `maxItems="container"` and `truncate` can be watched as the width changes.
      <ResizeBox maxWidth="48rem">
        <DemoTrail
          // Keyed by what changes the collapse, so a trail the reader expanded starts over when a control changes.
          key={`${String(collapsing)}-${String(maxItems)}-${args.itemsBeforeCollapse}-${args.itemsAfterCollapse}`}
          count={collapsing ? 6 : 4}
          size={args.size}
          tone={args.tone}
          underline={args.underline}
          separator={args.separator as BreadcrumbSeparator}
          maxItems={maxItems}
          compact={args.compact}
          truncate={args.truncate}
          itemsBeforeCollapse={args.itemsBeforeCollapse}
          itemsAfterCollapse={args.itemsAfterCollapse}
          aria-label={args["aria-label"]}
          dir={args.dir}
        />
      </ResizeBox>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The Playground's own control adds "off", the way to leave `maxItems` out — not a value the prop takes, so it stays
  // out of the meta-level argType the Properties table reads.
  argTypes: {
    maxItems: {
      control: "select",
      options: ["off", "3", "4", "5", "container"],
      description:
        'Collapses a long trail: the middle is replaced by a "…" button that shows them all when used. A number collapses once there are more items than that; "container" collapses only as many as it takes to fit the trail\'s own width. "off" leaves the prop out, so the trail never collapses and wraps instead.',
    },
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => breadcrumbPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            size=&quot;{size}&quot;
          </Text>
          <DemoTrail size={size} aria-label={`Breadcrumb (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.tones } } },
  render: () => (
    <div
      data-testid="tones"
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}
    >
      {(["info", "brand", "neutral"] as const).map((tone) => (
        <div key={tone}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            tone=&quot;{tone}&quot;{tone === "info" ? " (default)" : ""}
          </Text>
          <DemoTrail tone={tone} aria-label={`Breadcrumb (${tone})`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes. Each tone's links resolve to that tone's own token.
    const resolve = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      canvasElement.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    };
    const expected = {
      info: resolve("--dbm-text-link"),
      brand: resolve("--dbm-text-brand"),
      neutral: resolve("--dbm-text-secondary"),
    } as const;
    const primary = resolve("--dbm-text-primary");
    for (const tone of ["info", "brand", "neutral"] as const) {
      const nav = within(canvasElement).getByRole("navigation", { name: `Breadcrumb (${tone})` });
      const link = within(nav).getByRole("link", { name: "Home" });
      await expect(getComputedStyle(link).color).toBe(expected[tone]);
      // The current page is primary text, whatever the tone.
      await expect(getComputedStyle(within(nav).getByText("Mechanical")).color).toBe(primary);
    }
    await expect(new Set(Object.values(expected)).size).toBe(3);
  },
};

export const Underline: Story = {
  name: "Underlined links",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.underline } } },
  render: () => (
    <div
      data-testid="underline"
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}
    >
      {[false, true].map((underline) => (
        <div key={String(underline)}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            underline={String(underline)}
            {underline ? "" : " (default)"}
          </Text>
          <DemoTrail underline={underline} aria-label={`Breadcrumb (underline ${String(underline)})`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = (name: string) =>
      within(within(canvasElement).getByRole("navigation", { name })).getByRole("link", { name: "Home" });
    const resting = link("Breadcrumb (underline false)");
    const always = link("Breadcrumb (underline true)");
    // Off, the underline is invisible until hover; on, it is drawn in the link's own colour.
    await expect(getComputedStyle(resting).textDecorationColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(always).textDecorationColor).toBe(getComputedStyle(always).color);
    await expect(getComputedStyle(always).textDecorationLine).toBe("underline");
  },
};

export const Separators: Story = {
  name: "Separators",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.separators } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(
        [
          ["chevron", "chevron"],
          ["slash", "slash"],
          ["›", "›"],
          ["•", "•"],
        ] as const
      ).map(([label, separator]) => (
        <div key={label}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            separator=&quot;{label}&quot;
          </Text>
          <DemoTrail separator={separator} aria-label={`Breadcrumb (${label})`} />
        </div>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.icons } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/" icon={HouseIcon}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/products">Products</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/products/keyboards">Keyboards</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page icon={KeyboardIcon}>Mechanical</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const Collapsed: Story = {
  name: "Collapsed with maxItems",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.collapsed } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} />
    </div>
  ),
};

export const ContainerCollapse: Story = {
  name: "Collapsing to fit the width",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.container } } },
  render: () => (
    <ResizeBox maxWidth="48rem" data-testid="container-box">
      <DemoTrail count={6} maxItems="container" />
    </ResizeBox>
  ),
};

export const CollapseWindow: Story = {
  name: "Choosing what stays visible",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.collapseWindow } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} itemsBeforeCollapse={2} itemsAfterCollapse={1} />
    </div>
  ),
};

export const Compact: Story = {
  name: "Compact — back to the parent",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.compact } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["always", "auto", "never"] as const).map((compact) => (
        <div key={compact}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            compact=&quot;{compact}&quot;{compact === "never" ? " (default)" : ""}
          </Text>
          <DemoTrail count={5} compact={compact} aria-label={`Breadcrumb (compact ${compact})`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes. At a wide viewport `always` is one link, `auto` and `never` the whole trail.
    await expect(window.innerWidth).toBeGreaterThanOrEqual(640);
    const links = (name: string) =>
      within(within(canvasElement).getByRole("navigation", { name })).queryAllByRole("link");
    await expect(links("Breadcrumb (compact always)").map((link) => link.textContent)).toEqual(["Mechanical"]);
    await expect(links("Breadcrumb (compact auto)")).toHaveLength(4);
    await expect(links("Breadcrumb (compact never)")).toHaveLength(4);
  },
};

export const CompactOnAPhone: Story = {
  name: "Compact on a phone",
  argTypes: noControls,
  // Opened on its own, this story is shown at a phone's width (and it is in the test run); on the Docs page it
  // sits in the wide page like every other story.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { source: { code: breadcrumbSnippets.compact } } },
  render: () => (
    <div data-testid="phone" style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["auto", "never"] as const).map((compact) => (
        <DemoTrail key={compact} count={5} compact={compact} aria-label={`Breadcrumb (compact ${compact})`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const visibleLinks = (name: string) =>
      within(within(canvasElement).getByRole("navigation", { name })).queryAllByRole("link");
    // `auto` shows only the parent; `never` still shows the whole trail.
    await expect(visibleLinks("Breadcrumb (compact auto)").map((link) => link.textContent)).toEqual(["Mechanical"]);
    await expect(visibleLinks("Breadcrumb (compact never)")).toHaveLength(4);
  },
};

export const Truncated: Story = {
  name: "Truncated labels",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.truncate } } },
  render: () => (
    <ResizeBox maxWidth="36rem" data-testid="truncated-box">
      <Breadcrumb truncate>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing">Enterprise software licensing and procurement</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Renewal terms and conditions for the current financial year</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </ResizeBox>
  ),
};

export const AsRouterLink: Story = {
  name: "With a router's link (asChild)",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.router } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/">
            {/* Stands in for a router's own link component. */}
            <a href="/" onClick={(event) => event.preventDefault()}>
              Home
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Products</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const DisabledLink: Story = {
  name: "A disabled link",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.disabledLink } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/archive" disabled>
            Archive
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Issue 42</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const ExternalLink: Story = {
  name: "An external link",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.externalLink } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="https://example.com/docs">Docs</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Getting started</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const LongLabels: Story = {
  name: "Long labels wrap",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.longLabels } } },
  render: () => (
    <ResizeBox maxWidth="24rem" data-testid="long-labels">
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing">Enterprise software licensing and procurement</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing/volume">
            Volume agreements for education and non-profit organisations
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Renewal terms and conditions for the current financial year</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </ResizeBox>
  ),
};

export const NamedNav: Story = {
  name: "Naming the navigation",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.namedNav } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail aria-label="Product path" />
    </div>
  ),
};

export const Translated: Story = {
  name: "Translated text",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.translated } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail
        count={6}
        maxItems={4}
        labels={{ navigation: "Fil d'Ariane", expand: (count) => `Afficher ${count} pages masquées` }}
      />
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.rightToLeft } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail dir="rtl" data-testid="rtl-trail" />
    </div>
  ),
};

// --- Real-browser tests: what jsdom can't evaluate. Hidden from the sidebar and
// the Docs page (`!dev`); each renders what it needs itself. ---

export const CollapseInteraction: Story = {
  name: "Collapsing — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expand = canvas.getByRole("button", { name: "Show 3 hidden pages" });
    await userEvent.tab(); // Home
    await userEvent.tab(); // the "…" button
    await expect(expand).toHaveFocus();
    await expect(expand).toHaveStyle({ outlineStyle: "solid" });
    await userEvent.keyboard("{Enter}");
    // Focus moves to the first item it revealed instead of dropping to the top of the document.
    await waitFor(() => expect(canvas.getByRole("link", { name: "Products" })).toHaveFocus());
    await expect(canvas.getAllByRole("listitem")).toHaveLength(6);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail dir="rtl" data-testid="rtl-trail" />
      <DemoTrail data-testid="ltr-trail" aria-label="Breadcrumb (ltr)" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const first = (id: string) => {
      const nav = within(canvasElement).getByTestId(id);
      return { nav, item: within(nav).getAllByRole("listitem")[0]!, chevron: nav.querySelector("li > span svg")! };
    };
    const rtl = first("rtl-trail");
    const ltr = first("ltr-trail");
    // The first item sits at the right in right-to-left text, and at the left otherwise.
    await expect(rtl.item.getBoundingClientRect().right).toBeGreaterThan(rtl.nav.getBoundingClientRect().left + rtl.nav.getBoundingClientRect().width / 2);
    await expect(ltr.item.getBoundingClientRect().left).toBeLessThan(ltr.nav.getBoundingClientRect().left + 8);
    // The chevron is mirrored only in right-to-left text.
    await expect(getComputedStyle(rtl.chevron).transform).not.toBe("none");
    await expect(getComputedStyle(ltr.chevron).transform).toBe("none");
  },
};

export const WrapInteraction: Story = {
  name: "Wrapping — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="narrow" style={{ width: "16rem" }}>
      <DemoTrail count={6} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("narrow");
    const nav = within(box).getByRole("navigation");
    // Wraps onto more lines rather than overflowing its container.
    await expect(nav.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const tops = new Set(within(box).getAllByRole("listitem").map((item) => Math.round(item.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
  },
};

export const ColourInteraction: Story = {
  name: "Colours — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Home" });
    const page = canvas.getByText("Mechanical");
    // Links take the tone's colour (info by default), so they differ from the current page, which is primary text.
    await expect(getComputedStyle(link).color).not.toBe(getComputedStyle(page).color);
    await expect(getComputedStyle(link).textDecorationColor).toBe("rgba(0, 0, 0, 0)");
    // (The hover colour isn't asserted: Storybook's userEvent sends synthetic events, which never
    // match `:hover`.)
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await expect(Number(getComputedStyle(page).fontWeight)).toBeGreaterThan(Number(getComputedStyle(link).fontWeight));
  },
};

export const TruncateInteraction: Story = {
  name: "Truncating — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="narrow" style={{ width: "24rem" }}>
      <Breadcrumb truncate>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing">Enterprise software licensing and procurement</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Renewal terms and conditions for the current financial year</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("narrow");
    const nav = within(box).getByRole("navigation");
    // One line, inside its box.
    const tops = new Set(within(box).getAllByRole("listitem").map((item) => Math.round(item.getBoundingClientRect().top)));
    await expect(tops.size).toBe(1);
    await expect(nav.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    // The long labels are cut short with an ellipsis, and the full text is still in the page.
    const long = within(box).getByText("Enterprise software licensing and procurement");
    const page = within(box).getByText("Renewal terms and conditions for the current financial year");
    for (const label of [long, page]) {
      await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      await expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    }
    await expect(within(box).getByRole("link", { name: "Home" })).toHaveAttribute("title", "Home");
    // A keyboard reader still gets a focus ring on a link in a truncated trail.
    await userEvent.tab();
    await expect(within(box).getByRole("link", { name: "Home" })).toHaveFocus();
    await expect(getComputedStyle(within(box).getByRole("link", { name: "Home" })).outlineStyle).toBe("solid");
    await expect(page.closest("[aria-current]")).toHaveAttribute("title", "Renewal terms and conditions for the current financial year");
  },
};

export const ContainerInteraction: Story = {
  name: "Collapsing to fit — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // One trail per width, each measured when it mounts — real layout, without depending on a resize observation.
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      {["60rem", "34rem", "26rem", "20rem", "14rem"].map((width) => (
        <div key={width} data-testid={`box-${width}`} style={{ width }}>
          <DemoTrail count={6} maxItems="container" aria-label={`Breadcrumb ${width}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const measure = (width: string) => {
      const box = canvas.getByTestId(`box-${width}`);
      const nav = within(box).getByRole("navigation");
      return { items: within(box).getAllByRole("listitem").length, fits: nav.scrollWidth <= box.clientWidth, nav };
    };
    const widths = ["60rem", "34rem", "26rem", "20rem", "14rem"];
    await waitFor(() => expect(measure("20rem").fits).toBe(true));
    const results = widths.map(measure);
    // Wide: the whole trail. Each narrower box hides at least as many items, never more than it takes.
    await expect(results[0]!.items).toBe(6);
    for (let index = 1; index < results.length; index++) {
      await expect(results[index]!.items).toBeLessThanOrEqual(results[index - 1]!.items);
    }
    await expect(results[2]!.items).toBeLessThan(6);
    // Everything that could collapse enough to fit does, and none is wider than its box.
    for (const width of ["60rem", "34rem", "26rem", "20rem"]) await expect(measure(width).fits).toBe(true);
    // The narrowest can't get below the first item, the "…" and the last two: past that it wraps rather than overflowing.
    await expect(results[4]!.items).toBe(4);
    await expect(results[4]!.fits).toBe(true);
    await expect(results[4]!.nav.className).not.toMatch(/measuring/);
  },
};

export const ContainerFocusInteraction: Story = {
  name: "Collapsing to fit — keyboard focus is not dropped",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="box" style={{ width: "60rem" }}>
      <DemoTrail count={6} maxItems="container" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("box");
    const links = () => within(box).queryAllByRole("link");
    await userEvent.tab(); // Home
    await userEvent.tab(); // Products — a middle item, which narrowing the box would hide
    const products = within(box).getByRole("link", { name: "Products" });
    await expect(products).toHaveFocus();
    box.style.width = "20rem";
    // Held back: the focused link stays in the page, with focus, however narrow the box gets.
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(within(box).getByRole("link", { name: "Products" })).toBe(products);
    await expect(products).toHaveFocus();
    // Once focus has moved on (to a link that stays), the trail collapses.
    await userEvent.tab(); // Keyboards — also a middle item; keep going until the focus is on a link that stays
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(links().length).toBeLessThan(5));
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const FocusRingInteraction: Story = {
  name: "Focus ring in a resizable box — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // The wrapper the Playground and the other resizable stories use: its `overflow` must not cut a link's focus ring short.
  render: () => (
    <ResizeBox maxWidth="48rem">
      <DemoTrail count={4} />
    </ResizeBox>
  ),
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await expectRingUnclipped(link);
    }
  },
};
