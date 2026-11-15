// The code shown under each story's "Show code" button on Link's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground printed
// `aria-label="" disabled={false} external={false} underline="always"`, and the seven gallery
// panels showed the story object itself, each with a six-entry `argTypes` block of
// `control: false` — "asChild" also with a development note and an `eslint-disable` comment
// that belong in the story file, not in what a reader pastes. Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, quote } from "../../snippetHelpers";
import type { LinkSize, LinkUnderline } from "./Link.types";

export const linkSnippets = {
  internal: `<Link href="/docs">Internal link</Link>`,

  external: `{/* An absolute http(s) URL is detected as external: the link opens in a new tab and gets an icon
    and a screen-reader cue saying so. */}
<Link href="https://example.com">External link</Link>`,

  forcedExternal: `{/* external forces that treatment on a link that doesn't look like a URL, such as a path that
    serves a download */}
<Link href="/download" external>
  Forced external affordance
</Link>`,

  asChild: `{/* asChild puts Link's styling and behavior on your own element — a router's Link component, say —
    instead of rendering an <a>. Link passes its href on to that element. */}
<Link asChild href="/docs" underline="none">
  <a>Rendered as a real Link, styling merged onto this anchor</a>
</Link>`,

  asChildExternal: `{/* With asChild, an external link's icon and its "(opens in a new tab)" cue are drawn inside your
    element, after its own text. */}
<Link asChild href="https://example.com/changelog">
  <a>Read the changelog</a>
</Link>`,

  disabled: `{/* disabled sets aria-disabled, blocks clicks and keyboard activation, and dims the link */}
<Link href="/unavailable" disabled>
  Unavailable right now
</Link>`,

  inParagraph: `<p>
  Read the <Link href="/docs">documentation</Link> or check the{" "}
  <Link href="https://example.com">external reference</Link> for more detail.
</p>`,

  sizes: `{/* With no size, a link takes the font size of the text around it (or, with none around it, of its nearest ancestor that
    sets one). size sets it on the scale Text and Heading use: "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" … "6xl". The
    external-link icon is the size of the text, however the size is set. */}
<p>
  Read the <Link href="https://example.com">reference</Link> or the{" "}
  <Link href="https://example.com/guide" size="lg">
    guide
  </Link>
  .
</p>`,

  underlineVariants: `{/* underline: "always" (default, and the safe choice inside body text) | "hover" | "none" (for
    navigation, where color and weight already set a link apart) */}
<Link href="/docs" underline="hover">
  Underlined on hover
</Link>`,
} as const;

// A path or URL the component treats as external without being told (`external` left unset).
const externalHref = /^(https?:)?\/\//i;

/** The Playground's live controls, as far as the snippet cares. */
export interface LinkPlaygroundSnippetArgs {
  href?: string;
  children?: unknown;
  external?: boolean;
  underline?: LinkUnderline;
  size?: LinkSize | "inherit";
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: `href` always, everything else only
 * when it differs from the defaults. `external` is auto-detected from the `href`, so it's written
 * only where it changes that: `external` for a link that doesn't look external, `external={false}`
 * for one that does.
 */
export function linkPlaygroundSnippet(args: LinkPlaygroundSnippetArgs): string {
  const href = args.href ?? "/docs";
  const attributes = [`href=${quote(href)}`];
  if (args.external === true && !externalHref.test(href)) attributes.push("external");
  if (args.external === false && externalHref.test(href)) attributes.push("external={false}");
  if (args.underline && args.underline !== "always") attributes.push(`underline="${args.underline}"`);
  if (args.size && args.size !== "inherit") attributes.push(`size="${args.size}"`);
  if (args.disabled) attributes.push("disabled");
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return `<Link ${attributes.join(" ")}>${escapeJsxText(String(args.children ?? "Documentation"))}</Link>`;
}
