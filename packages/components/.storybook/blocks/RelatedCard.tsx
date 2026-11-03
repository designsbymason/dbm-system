import type { ReactNode } from "react";

/**
 * Docs-page-only "Related components" card — a small live rendering of the
 * related component (passed as `children`) plus its name/description/link,
 * instead of a plain list of markdown links. The whole card is the link: the
 * one `<a>` keeps the name and description, and a stretched `::after` covers
 * the card (the preview is `inert`, so it cannot take a press), and the border
 * changes colour on hover. Not part of the published package.
 */
export function RelatedCard({
  name,
  description,
  href,
  children,
}: {
  name: string;
  description: string;
  href: string;
  children: ReactNode;
}) {
  return (
    // The whole card used to be a single `<a>` wrapping both the preview
    // slot and the name/description — but the preview slot renders a real
    // live component (per this block's own doc comment above), and several
    // of those previews are themselves interactive elements (`IconButton`,
    // `CloseButton`, a removable `Tag`, `Link`) or contain one. Nesting a
    // real `<a>`/`<button>` inside another `<a>` is invalid HTML —
    // confirmed live as a React hydration warning on Button.mdx's "Link"
    // card, where the previewed `<Link>` renders its own `<a>` directly
    // inside this card's outer `<a>`. Splitting the link down to just the
    // name/description keeps a real, fully keyboard-accessible navigation
    // link (native `<a>`, not a hand-rolled ARIA button) while leaving the
    // preview slot a plain, non-interactive container that any live
    // component's own interactive elements can render into safely. The
    // link's `::after` (docs.css) stretches over the whole card, so the card
    // is still one click target without nesting an anchor in an anchor.
    <div className="dbm-related-card">
      {/* Explicit reactive `color` (2026-08-10) — some previewed
          components (e.g. `CloseButton`) deliberately have no color of
          their own, inheriting `currentColor` from context by design (see
          that component's own doc comment). This card's outer element only
          sets `color: inherit`, which — confirmed live, not assumed —
          resolves to a fixed black here: nothing between this slot and
          the document root sets an explicit `color` for `inherit` to
          actually pick up: the reactive text colors seen elsewhere on
          this page come from `docs.css` rules scoped to specific tags
          (`.sbdocs-content p`/`li`/etc.), not from any ambient color
          cascading down from the Docs wrapper's theme. Giving this slot
          its own explicit `text.primary` gives any `currentColor`-based
          child something reactive to actually inherit. */}
      {/* `sb-unstyled` (found live, 2026-08-29 — FieldHelperText.mdx's own
          FieldError preview rendering text.secondary gray instead of
          text.danger red): this is Storybook's own internal marker class
          for "live rendered story content, exempt me from the Docs page's
          base MDX typography" — its own base stylesheet already carries
          `:not(.sb-unstyled, .sb-unstyled p)` on its default `<p>` color
          rule, confirmed live via the DOM (same "verify Storybook's real
          class names, don't guess" methodology this file's other rules
          already use for `.sbdocs-content`/`.sbdocs-preview`). A real
          `<Canvas>` block already carries this class for free (its own
          `.sbdocs-preview` wrapper is *also* `sb-unstyled`, confirmed live)
          — this preview slot never was one, since it's a plain div, not
          Storybook's own story-rendering mechanism, so it never got that
          exemption automatically. Reusing the same marker here — rather
          than inventing a parallel one — also means docs.css's own
          markdown-prose rule (below) only needs a single, shared exclusion
          for both cases. */}
      {/* `height` (fixed), not `minHeight` — with only a floor, a preview
          taller than it (a `Button`, measured live at ~68px even at its
          own `size="sm"`, vs. the ~48px most other previews render at)
          still grew the slot to fit, so the name/description directly
          below started at a different Y position card to card in the
          same row (confirmed live via `getBoundingClientRect` across
          several Docs pages before picking this value — 48px is the
          actual height nearly everything else already renders at,
          `space-20` the first scale step that comfortably fits the
          tallest real instance found, `Button size="sm"`, with room to
          spare). `overflow: hidden` is a safety net, not the intended
          normal case — every preview here is meant to fit inside this
          box, not be clipped by it. */}
      {/* `inert` (found live, 2026-09-07 — Link.mdx's own Text/Button cards,
          user-reported): a preview can itself render a real interactive
          element with a real destination (a `Link` with a working `href`,
          a `Button asChild` wrapping a real anchor) — clicking straight into
          it navigates the whole Docs page to that (usually nonexistent)
          route, "blank page," bypassing this card's own name/description
          link entirely. `pointer-events: none` alone doesn't fully solve
          this: it blocks mouse clicks but not Tab-to-focus-then-Enter, which
          activates a native `<a>`/`<button>` without going through
          pointer-events at all. `inert` blocks both — pointer and keyboard
          — and also removes the subtree from the accessibility tree's
          normal tab order, matching the actual intent ("a small live
          rendering," not something meant to be interacted with on its own;
          the card's own link at the bottom is the only real navigation
          affordance a preview should offer). */}
      <div
        className="sb-unstyled"
        inert
        style={{
          alignItems: "center",
          color: "var(--dbm-text-primary)",
          display: "flex",
          height: "var(--dbm-space-20)",
          justifyContent: "center",
          marginBlockEnd: "var(--dbm-space-3)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <a
        className="dbm-related-card__link"
        href={href}
        style={{ color: "inherit", display: "block", textDecoration: "none" }}
      >
        <div style={{ color: "var(--dbm-text-primary)", fontWeight: "var(--dbm-font-weight-semibold)" }}>
          {name}
        </div>
        <div
          style={{
            color: "var(--dbm-text-tertiary)",
            fontSize: "var(--dbm-font-size-sm)",
          }}
        >
          {description}
        </div>
      </a>
    </div>
  );
}
