import { Badge } from "../../src/atoms/Badge";
import type { BadgeTone } from "../../src/atoms/Badge";

export type ComponentTier = "Atom" | "Molecule" | "Organism" | "Template";

/**
 * Each tier gets its own badge colour, so a reader can tell where a component
 * sits in the atomic hierarchy at a glance. The colours here are categorical
 * labels, not status signals — the badge's own text ("Atom", "Molecule", …) is
 * always the primary cue, so colour is never the only way the tier is conveyed.
 * `Template` takes `brand` rather than `danger`, since a red badge would read as
 * an error rather than a category.
 */
export const toneForTier: Record<ComponentTier, BadgeTone> = {
  Atom: "info",
  Molecule: "warning",
  Organism: "success",
  Template: "brand",
};

/**
 * Docs-page-only header: the component's name plus a tier badge, reusing
 * our own `Badge` atom rather than plain markdown — the docs pages
 * themselves are a chance to show the system in use, not just describe it.
 * Not part of the published package; lives under `.storybook/` alongside
 * the other Docs-page-only building blocks.
 */
export function ComponentHeader({
  title,
  tier = "Atom",
}: {
  title: string;
  tier?: ComponentTier;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--dbm-space-3)",
      }}
    >
      {/*
       * `overflowWrap: "break-word"` (found live, mobile-width check on
       * FieldHelperText.mdx — 15 characters, longer than every previously
       * tested title, e.g. ProgressBar's 11): without it, a title long
       * enough that its single unbroken word alone exceeds the viewport
       * doesn't wrap at all — flex items default to `min-width: auto`,
       * which floors their shrink at the *unbreakable* content width, and
       * a CamelCase component name has no natural break point (no spaces)
       * for the browser to wrap on. `flexWrap` above (the earlier,
       * 2026-08-22 fix) only solves title+badge wrapping onto two lines;
       * it does nothing once the title alone is already wider than the
       * viewport. Same property, same root cause, and the same fix
       * already applied to `.sbdocs-content p`/`li` in docs.css for
       * markdown prose containing an unbreakable run of text — just not
       * previously needed here since no title had hit this length yet.
       */}
      <h1 style={{ margin: 0, minWidth: 0, overflowWrap: "break-word" }}>{title}</h1>
      <Badge tone={toneForTier[tier]} variant="subtle">
        {tier}
      </Badge>
    </div>
  );
}
