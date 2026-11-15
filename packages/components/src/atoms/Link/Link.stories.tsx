import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Link } from "./Link";
import { linkPlaygroundSnippet, linkSnippets } from "./Link.snippets";

const meta: Meta<typeof Link> = {
  title: "Atoms/Typography/Link",
  component: Link,
  parameters: { layout: "padded" },
  // Ordered to match LinkProps' own declaration order, content/destination
  // props first, then behavioral props, then advanced/escape-hatch props
  // last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    href: {
      control: "text",
      description: "The link destination.",
    },
    children: {
      control: "text",
      description: "The link text/content.",
    },
    external: {
      control: "boolean",
      description:
        "Applies external-link affordances: opens in a new tab, sets rel=\"noopener noreferrer\", appends a trailing icon, and adds a visually-hidden \"(opens in a new tab)\" cue. Auto-detected from href when not set explicitly.",
    },
    underline: {
      control: "radio",
      options: ["always", "hover", "none"],
      description: "Controls when the underline is visible.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description:
        "The link's font size, on the same scale as Text and Heading, replacing the size it would take from the text around it (and, with none around it, from its nearest ancestor that sets one). Left out, the link inherits. The external-link icon is the size of the text, however the size is set.",
      table: { defaultValue: { summary: "inherited" } },
    },
    asChild: {
      control: false,
      description:
        "Merge props onto the single child element instead of rendering an <a> (via Radix Slot). See the \"asChild (composes with a custom element)\" story.",
    },
    disabled: {
      control: "boolean",
      description:
        "Disables the link: applies aria-disabled, blocks click/keyboard activation, and dims the visual treatment. The link stays focusable and its href stays present (no native disabled attribute on <a>).",
    },
    target: {
      control: false,
      description:
        'Native anchor target. Defaults to "_blank" when the link is external; pass explicitly to override.',
    },
    rel: {
      control: false,
      description:
        'Native anchor rel. Defaults to "noopener noreferrer" when the link is external; pass explicitly to override or extend.',
    },
    download: {
      control: false,
      description:
        "Native anchor download — prompts a file download instead of navigating, optionally with a suggested filename.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name override. Needed when children isn't readable text on its own (an icon-only link, a link wrapping an image).",
    },
    "aria-labelledby": {
      control: false,
      description: "References the id of an element that labels this link, as an alternative to aria-label.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    href: "/docs",
    children: "Documentation",
    external: false,
    underline: "always",
    size: undefined,
    disabled: false,
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

/** Drive every prop live. */
export const Playground: Story = {
  // "inherit" is the Playground's own choice for "leave size out", not a value the prop takes (07 §4.1), so it lives here and not on the meta.
  argTypes: {
    size: {
      control: "select",
      options: ["inherit", "xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      mapping: { inherit: undefined },
    },
  },
  args: { size: "inherit" as never },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => linkPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Internal: Story = {
  parameters: { docs: { source: { code: linkSnippets.internal } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => <Link href="/docs">Internal link</Link>,
};

export const External: Story = {
  name: "External (auto-detected, shows icon)",
  parameters: { docs: { source: { code: linkSnippets.external } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => <Link href="https://example.com">External link</Link>,
};

export const ForcedExternal: Story = {
  name: "Forced external via explicit prop",
  parameters: { docs: { source: { code: linkSnippets.forcedExternal } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Link href="/download" external>
      Forced external affordance
    </Link>
  ),
};

export const AsChild: Story = {
  name: "asChild (composes with a custom element)",
  parameters: { docs: { source: { code: linkSnippets.asChild } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  // A real <a>, not a <button> — asChild's real-world use is composing onto
  // a router's own Link component (which itself renders an <a>), so the
  // demo target should be something href/an anchor-like element actually
  // means something on. A previous version of this story used a <button>,
  // which doesn't have href semantics at all — technically harmless (the
  // browser just ignores the unrecognized attribute) but a misleading
  // example of what asChild is actually for.
  render: () => (
    <Link asChild href="/docs" underline="none">
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- this anchor
      intentionally has no literal href in source; Radix Slot merges the
      outer Link's own href onto it at render time (verified in
      Link.test.tsx's own "merging href onto a real anchor" test) — adding
      a hardcoded href here would fight that merge and misrepresent what
      asChild actually does. */}
      <a style={{ fontWeight: "var(--dbm-font-weight-semibold)" }}>
        Rendered as a real Link, styling merged onto this anchor
      </a>
    </Link>
  ),
};

export const AsChildExternal: Story = {
  name: "asChild, external (icon and cue inside your element)",
  parameters: { docs: { source: { code: linkSnippets.asChildExternal } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  // The external-link icon and the visually hidden "(opens in a new tab)" cue are drawn inside the slotted anchor,
  // after its own text, so a router's link that leaves the site keeps both.
  render: () => (
    <Link asChild href="https://example.com/changelog">
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- Radix Slot merges the outer Link's own href onto this anchor at render time (see the AsChild story). */}
      <a>Read the changelog</a>
    </Link>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: /^Read the changelog ?\(opens in a new tab\)$/ });
    await expect(link).toHaveAttribute("href", "https://example.com/changelog");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link.querySelectorAll("svg")).toHaveLength(1);
  },
};

export const Disabled: Story = {
  name: "Disabled (aria-disabled, click blocked)",
  parameters: { docs: { source: { code: linkSnippets.disabled } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Link href="/unavailable" disabled>
      Unavailable right now
    </Link>
  ),
};

export const InParagraph: Story = {
  name: "Inline within body text",
  parameters: { docs: { source: { code: linkSnippets.inParagraph } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      Read the <Link href="/docs">documentation</Link> or check the{" "}
      <Link href="https://example.com">external reference</Link> for more detail.
    </p>
  ),
};

export const UnderlineVariants: Story = {
  name: "underline variants (always / hover / none)",
  parameters: { docs: { source: { code: linkSnippets.underlineVariants } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      <Link href="/docs" underline="always">
        underline=&quot;always&quot; (default, safe for body text)
      </Link>
      <br />
      <Link href="/docs" underline="hover">
        underline=&quot;hover&quot; (hover to reveal — for non-body-text use only)
      </Link>
      <br />
      <Link href="/docs" underline="none">
        underline=&quot;none&quot; (e.g. navigation, where color+weight distinguish it)
      </Link>
    </p>
  ),
};

export const Sizes: Story = {
  name: "size (the default inherits)",
  parameters: { docs: { source: { code: linkSnippets.sizes } } },
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    size: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", color: "var(--dbm-text-primary)" }}>
      <p style={{ margin: 0, fontSize: "var(--dbm-font-size-sm)" }}>
        Small text with a <Link href="https://example.com/a">link that inherits it</Link> and a{" "}
        <Link href="https://example.com/b" size="lg">
          link set to lg
        </Link>
        .
      </p>
      <p style={{ margin: 0, fontSize: "var(--dbm-font-size-xl)" }}>
        Large text with a <Link href="https://example.com/c">link that inherits it</Link> and a{" "}
        <Link href="https://example.com/d" size="sm">
          link set to sm
        </Link>
        .
      </p>
      {(["xs", "sm", "base", "md", "lg", "xl", "2xl"] as const).map((size) => (
        <div key={size}>
          <Link href="https://example.com/e" size={size}>
            size=&quot;{size}&quot;
          </Link>
        </div>
      ))}
    </div>
  ),
};

/** Hidden twin of "size": a link inherits the text around it unless `size` is set, and its icon is the size of the text. */
export const SizesInteraction: Story = {
  ...Sizes,
  name: "size — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fontSize = (element: Element) => Number.parseFloat(getComputedStyle(element).fontSize);
    const tokenSize = (name: string) => {
      const probe = document.createElement("span");
      probe.style.fontSize = `var(--dbm-font-size-${name})`;
      canvasElement.append(probe);
      const size = fontSize(probe);
      probe.remove();
      return size;
    };
    // each unsized link takes its own paragraph's size (sm, then xl); an `lg` or `sm` link takes that token whatever the paragraph is
    for (const link of canvas.getAllByRole("link", { name: /link that inherits it/ })) {
      expect(fontSize(link)).toBe(fontSize(link.parentElement!));
    }
    const [small, large] = canvas.getAllByRole("link", { name: /link that inherits it/ }) as [HTMLElement, HTMLElement];
    expect(fontSize(large)).toBeGreaterThan(fontSize(small));
    expect(fontSize(canvas.getByRole("link", { name: /link set to lg/ }))).toBe(tokenSize("lg"));
    expect(fontSize(canvas.getByRole("link", { name: /link set to sm/ }))).toBe(tokenSize("sm"));
    // every external link's icon is the size of its own text, inherited or set
    for (const link of canvas.getAllByRole("link")) {
      const icon = link.querySelector("svg");
      if (!icon) continue;
      // the drawn box, not the icon's font size: the box is what a reader sees
      const ratio = icon.getBoundingClientRect().width / fontSize(link);
      expect(Math.abs(ratio - 1)).toBeLessThan(0.02);
      expect(Math.abs(icon.getBoundingClientRect().height / fontSize(link) - 1)).toBeLessThan(0.02);
    }
  },
};
