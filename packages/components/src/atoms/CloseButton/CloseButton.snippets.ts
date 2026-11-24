// The code shown under each story's "Show code" button on CloseButton's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`disabled={false}`, `rounded={false}`,
// `hasBackground={false}`, `type="button"`), a no-op `onClick={() => {}}`, and the
// story's demo wrapper — for "over unpredictable content", a gradient-filled `div`.
// Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks
// that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const closeButtonSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<CloseButton aria-label="Close" size="lg" />`,

  tones: `{/* tone: "neutral" (default) | "brand" */}
<CloseButton aria-label="Close" />
<CloseButton aria-label="Close" tone="brand" />`,

  onBusyBackground: `{/* hasBackground gives the button a backing fill of its own, so it stays legible over content you
    don't control — an image, a gradient */}
<CloseButton aria-label="Close" hasBackground />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CloseButtonPlaygroundSnippetArgs {
  size?: string;
  tone?: string;
  rounded?: boolean;
  hasBackground?: boolean;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A close button has no visible text, so the `aria-label`
 * is always written. Also serves the rounded and disabled stories.
 */
export function closeButtonPlaygroundSnippet(args: CloseButtonPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Close"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.hasBackground) attributes.push("hasBackground");
  if (args.type && args.type !== "button") attributes.push(`type="${args.type}"`);
  if (args.disabled) attributes.push("disabled");
  return `<CloseButton ${attributes.join(" ")} />`;
}
