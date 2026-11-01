// The code shown under each story's "Show code" button on Kbd's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground printed
// `aria-label="Escape"`, Default printed an empty `aria-label=""`, and "A keyboard chord" showed the
// story object itself with a seven-line development note about its controls inside it. Each
// snippet here is the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, quote } from "../../snippetHelpers";

export const kbdSnippets = {
  chord: `{/* A chord is one Kbd per key. aria-label gives a symbol key a name a screen reader can say; a key
    that already reads as a word or letter (K) needs none. */}
<Text as="span">
  <Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> to open the command palette
</Text>`,

  platform: `{/* keys draws a combination for the platform: mod is ⌘ on an Apple platform and Ctrl elsewhere, and
    each key is its own keycap. It is named for a screen reader ("Command Shift P") and binds nothing. */}
<Text as="span">
  <Kbd keys="mod+shift+p" /> opens the command palette
</Text>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface KbdPlaygroundSnippetArgs {
  children?: unknown;
  keys?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: the key, and an `aria-label` only
 * when there is one (an empty one is the same as none). Also serves the "Default" story.
 */
export function kbdPlaygroundSnippet(args: KbdPlaygroundSnippetArgs): string {
  const label = args["aria-label"]
    ? ` aria-label=${quote(args["aria-label"])}`
    : "";
  // `keys` replaces the key you spell yourself, and an empty one is the same as none.
  if (args.keys) return `<Kbd keys=${quote(args.keys)}${label} />`;
  return `<Kbd${label}>${escapeJsxText(String(args.children ?? "Esc"))}</Kbd>`;
}
