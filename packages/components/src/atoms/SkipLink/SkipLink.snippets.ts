// The code shown under each story's "Show code" button on SkipLink's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's explanatory paragraph and its demo
// target instead of the link beside a page. Each snippet here is the smallest real usage of what its story shows, using only exports of the
// package; `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.
import { escapeJsxText } from "../../snippetHelpers";

export const skipLinkSnippets = {
  withATarget: `{/* Put the link first on the page, so it is the first tab stop, and give its target tabIndex={-1} so focus lands in it. It is a plain
    hash link: nothing moves focus by script. */}
<SkipLink />
<header>…</header>
<main id="main" tabIndex={-1}>
  …
</main>`,

  yourWords: `{/* labels holds the words the link supplies itself, in your language; children replace them */}
<SkipLink labels={{ skipToContent: "Aller au contenu" }} />`,

  anotherTarget: `{/* href names the id of the element to land in */}
<SkipLink href="#content">Skip to the article</SkipLink>
<main>
  <article id="content" tabIndex={-1}>…</article>
</main>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SkipLinkPlaygroundSnippetArgs {
  children?: unknown;
  href?: string;
}

/** The Playground's snippet, built from its current controls: only what differs from the defaults, beside the page it skips to. */
export function skipLinkPlaygroundSnippet(args: SkipLinkPlaygroundSnippetArgs): string {
  const href = args.href === undefined || args.href === "#main" ? "" : ` href=${/["&\\]/.test(args.href) ? `{${JSON.stringify(args.href)}}` : `"${args.href}"`}`;
  // The default words are the link's own, so they are not written out.
  const text = typeof args.children === "string" && args.children !== "" && args.children !== "Skip to content" ? args.children : undefined;
  const link = text === undefined ? `<SkipLink${href} />` : `<SkipLink${href}>${escapeJsxText(text)}</SkipLink>`;
  const target = (args.href ?? "#main").replace(/^#/, "") || "main";
  return `${link}\n<main id="${target}" tabIndex={-1}>…</main>`;
}
