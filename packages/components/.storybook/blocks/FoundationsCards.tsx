import { RelatedCard } from "./RelatedCard";

/* The small mini-icon pictograms inside each card below (widths/heights of
    2–28px) are intentionally NOT mapped to `space.*` tokens — the spacing
    scale's granularity (4px steps from 4px, jumping to 8/12/16/20/24/32)
    doesn't cover this range densely enough to represent a tiny illustrative
    glyph without visibly distorting it. Colors/radii/borders inside these
    pictograms ARE tokenized (`var(--dbm-*)`); only the literal pixel
    dimensions are a deliberate exception, audited and confirmed 2026-08-08. */

/**
 * Docs-page-only "What's covered here" cards: one per Foundations page, each with a tiny pictogram of what the page
 * shows. Shared by the Foundations overview and the Getting started page so the two cannot drift. Not part of the
 * published package.
 */
export function FoundationsCards() {
  return (
    <div className="dbm-card-grid">
    <RelatedCard name="Color" description="Primitive scales + semantic bg/text/border/icon tokens, per theme" href="/?path=/docs/foundations-color--docs">
      <div style={{ display: "flex", gap: "var(--dbm-space-1)" }}>
        <div style={{ width: 20, height: 20, borderRadius: "var(--dbm-radius-xs)", background: "var(--dbm-bg-brand)" }} />
        <div style={{ width: 20, height: 20, borderRadius: "var(--dbm-radius-xs)", background: "var(--dbm-bg-danger)" }} />
        <div style={{ width: 20, height: 20, borderRadius: "var(--dbm-radius-xs)", background: "var(--dbm-bg-success)" }} />
      </div>
    </RelatedCard>
    <RelatedCard name="Typography" description="Font families, weights, the fluid type scale" href="/?path=/docs/foundations-typography--docs">
      <span style={{ color: "var(--dbm-text-brand)", fontFamily: "var(--dbm-font-family-primary)", fontSize: "var(--dbm-font-size-xl)", fontWeight: "var(--dbm-font-weight-bold)" }}>Aa</span>
    </RelatedCard>
    <RelatedCard name="Spacing" description="The 4px-base spacing scale" href="/?path=/docs/foundations-spacing--docs">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
        <div style={{ width: 6, height: 8, background: "var(--dbm-bg-brand)" }} />
        <div style={{ width: 6, height: 16, background: "var(--dbm-bg-brand)" }} />
        <div style={{ width: 6, height: 24, background: "var(--dbm-bg-brand)" }} />
      </div>
    </RelatedCard>
    <RelatedCard name="Radius" description="Corner-rounding scale, none through fully round" href="/?path=/docs/foundations-radius--docs">
      <div style={{ width: 28, height: 28, background: "var(--dbm-bg-brand-subtle)", border: "var(--dbm-border-width-2) solid var(--dbm-border-focus)", borderRadius: "var(--dbm-radius-lg)" }} />
    </RelatedCard>
    <RelatedCard name="Shadows" description="Elevation scale, separate light/dark values" href="/?path=/docs/foundations-shadows--docs">
      <div className="dbm-overview-shadow-icon" style={{ width: 28, height: 28, background: "var(--dbm-bg-surface)", borderRadius: "var(--dbm-radius-md)" }} />
    </RelatedCard>
    <RelatedCard name="Motion" description="Duration + easing scale, with live demos" href="/?path=/docs/foundations-motion--docs">
      <div style={{ width: 28, height: 12, background: "var(--dbm-bg-neutral-subtle)", borderRadius: "var(--dbm-radius-full)", position: "relative" }}>
        <div style={{ width: 12, height: 12, background: "var(--dbm-bg-brand)", borderRadius: "var(--dbm-radius-full)", position: "absolute", left: 8 }} />
      </div>
    </RelatedCard>
    <RelatedCard name="Icon sizes" description="The 7-step icon size scale" href="/?path=/docs/foundations-iconsizes--docs">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        <div style={{ width: 8, height: 8, background: "var(--dbm-icon-brand)", borderRadius: "var(--dbm-radius-full)" }} />
        <div style={{ width: 14, height: 14, background: "var(--dbm-icon-brand)", borderRadius: "var(--dbm-radius-full)" }} />
        <div style={{ width: 20, height: 20, background: "var(--dbm-icon-brand)", borderRadius: "var(--dbm-radius-full)" }} />
      </div>
    </RelatedCard>
    <RelatedCard name="Borders, opacity & z-index" description="Border widths, the opacity scale, layering order" href="/?path=/docs/foundations-miscellaneous--docs">
      <div style={{ width: 28, height: 28, border: "var(--dbm-border-width-4) solid var(--dbm-border-neutral)", borderRadius: "var(--dbm-radius-sm)" }} />
    </RelatedCard>
    <RelatedCard name="Breakpoints" description="The responsive layout scale" href="/?path=/docs/foundations-breakpoints--docs">
      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ width: 6, height: 20, background: "var(--dbm-bg-brand-subtle)", borderRadius: 1 }} />
        <div style={{ width: 10, height: 20, background: "var(--dbm-bg-brand-subtle)", borderRadius: 1 }} />
        <div style={{ width: 16, height: 20, background: "var(--dbm-bg-brand)", borderRadius: 1 }} />
      </div>
    </RelatedCard>
    </div>
  );
}
