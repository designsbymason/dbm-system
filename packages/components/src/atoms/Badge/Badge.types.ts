import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. `brand` and `highlight` are the non-status tones — the system's own identity color, and its general highlight and accent color, for things like "New"/"Beta" labels or a featured marker rather than a status. */
export type BadgeTone = "brand" | "neutral" | "info" | "success" | "warning" | "highlight" | "danger";
export type BadgeVariant = "subtle" | "solid";
export type BadgeSize = "xs" | "sm" | "md" | "lg" | "xl";
/** Which corner of `anchor` the badge overlaps. Only relevant when `anchor` is set. */
export type BadgePosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";
/** The shape of `anchor`, so the badge can tuck in appropriately. Only relevant when `anchor` is set. */
export type BadgeOverlap = "rectangular" | "circular";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * The colour family: one of the status tones (`info`, `success`, `warning`, `danger`), `neutral`, or one of the two identity tones
   * (`brand`, `highlight`).
   * @default 'danger'
   */
  tone?: BadgeTone;
  /**
   * Controls padding, font-size, and gap together as one step on the
   * shared size scale (and, in `dot` mode, the dot's own diameter). `md`
   * matches Badge's original, pre-`size`-prop appearance exactly, so
   * existing usage without this prop is unaffected.
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Has no effect when `dot` is set — a dot always uses its own
   * contrast-verified fill (see `dot`'s own doc) regardless of `variant`.
   * @default 'solid'
   */
  variant?: BadgeVariant;
  /**
   * When `children` is a number greater than `max`, displays `${max}+`
   * instead — e.g. `max={99}` renders "99+" for a count of 100. Has no
   * effect when `children` isn't a number, or `dot` is set.
   */
  max?: number;
  /**
   * Renders nothing at all (just `anchor`, if set) when `children` is
   * exactly the number `0` — for a live count that shouldn't show an empty
   * "0" once it drops back to none. Has no effect when `dot` is set (a dot
   * has no `children` to be zero), or when `children` isn't the number `0`
   * (a string `"0"`, or any other value, still renders normally). Off by
   * default so existing
   * `<Badge>{0}</Badge>` usage is unaffected unless you opt in.
   * @default false
   */
  hideZero?: boolean;
  /**
   * Renders as a minimal dot with no visible text or count — for a plain
   * "has updates" indicator, typically placed next to an already-labeled
   * element (e.g. an icon). Decorative (`aria-hidden`) unless an explicit
   * `aria-label`/`aria-labelledby` is supplied. Always uses its own
   * dedicated, contrast-verified fill per `tone` (ignoring `variant`) —
   * the `subtle` variant's pastel background is only verified as a host
   * for text sitting on top of it, not as a small standalone graphic, and
   * measures well under WCAG 1.4.11's 3:1 non-text floor on its own.
   * @default false
   */
  dot?: boolean;
  /**
   * Renders the badge overlapping the corner of this element instead of
   * as a standalone inline label — the "notification dot on a bell icon"
   * pattern (e.g. `<Badge anchor={<BellIcon />} dot tone="danger" />`).
   * `tone`/`variant`/`size`/`max`/`dot` continue to control the badge's
   * own appearance and content exactly as in standalone mode; `anchor`
   * only changes where it's positioned. Adds a `bg.surface`-colored ring
   * around the badge so it visually separates from whatever it overlaps.
   * For a count/text badge (i.e. `dot` unset), avoid overriding to
   * `variant="subtle"` here — that pale fill is meant to sit on a card/
   * page background, and reads as barely visible floating over arbitrary
   * anchor content with no guaranteed contrasting surface behind it.
   * `dot` mode is unaffected either way, since it always ignores
   * `variant` and uses its own indicator fill regardless.
   */
  anchor?: ReactNode;
  /**
   * Which corner of `anchor` the badge overlaps. Has no effect unless
   * `anchor` is set. Intentionally a physical corner, not a logical one —
   * `top-right` stays at the visual top-right in both LTR and RTL rather
   * than mirroring, since `anchor` is arbitrary visual content (an icon,
   * an avatar) rather than something tied to reading-flow direction.
   * @default 'top-right'
   */
  position?: BadgePosition;
  /**
   * `circular` tucks the badge in slightly further than `rectangular`, so
   * it doesn't visually overhang past a round anchor's own silhouette
   * (e.g. an Avatar) the way it can on a rectangular one (e.g. an
   * IconButton). Has no effect unless `anchor` is set.
   * @default 'rectangular'
   */
  overlap?: BadgeOverlap;
  /**
   * Accessible label announced by assistive tech. Required when `dot` is
   * set and the dot needs to convey meaning (e.g. "3 unread notifications")
   * rather than being purely decorative — an unlabeled `dot` renders
   * `aria-hidden` instead. Not needed for a text/count badge, since its
   * visible `children` already provide the accessible name.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — same `dot`-labeling role as `aria-label`
   * above, for when a nearby visible element already says what the badge
   * means.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * badge.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
