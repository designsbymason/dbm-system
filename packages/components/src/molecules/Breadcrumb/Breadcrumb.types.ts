import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { LinkProps } from "../../atoms/Link";

/**
 * The size of the trail's text, icons and gaps, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — the same steps as `Button`.
 */
export type BreadcrumbSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Whether the trail collapses to a single "back to the parent page" link — the item just above the current
 * page, with a back arrow before it.
 *
 * - `"never"` (the default) — the full trail at every width.
 * - `"auto"` — the full trail from the `sm` breakpoint up, and the single link on a phone-width screen.
 * - `"always"` — the single link at every width.
 *
 * A trail of one item has no parent, so it always shows in full. The compact form takes the place of every
 * other item, `maxItems` included.
 */
export type BreadcrumbCompact = "never" | "auto" | "always";

/**
 * The colour of the trail's links, on the tone scale (`05-component-api-conventions.md` §2) — the three that
 * make sense for a link.
 *
 * - `"info"` (the default) — the standard link colour (`text.link`), the same blue as a `Link` everywhere else.
 * - `"brand"` — the active brand theme's accent text colour (`text.brand`).
 * - `"neutral"` — quiet secondary text (`text.secondary`) that darkens to the primary text colour on hover.
 *
 * The current page is always primary text, whatever the tone. Place `"info"` and `"brand"` links on
 * `bg.surface` (or another background they were measured against), not on `bg.canvas`, where they fall under the
 * 4.5:1 text contrast floor; a `"neutral"` trail is safe on either.
 */
export type BreadcrumbTone = "neutral" | "brand" | "info";

/**
 * What sits between two items. `"chevron"` (the default) is a small arrow
 * pointing along the reading direction (it flips under right-to-left text);
 * `"slash"` is a `/`. Anything else is drawn as given — a short string
 * (`"›"`, `"•"`) or an element (an icon). It is always hidden from assistive
 * technology: the list already tells a screen reader how many items there are
 * and which one it is on.
 */
export type BreadcrumbSeparator = "chevron" | "slash" | ReactNode;

/**
 * The text `Breadcrumb` supplies itself, translatable through the `labels`
 * prop (`ADR-0021`). A label that needs a number is a function of the plain
 * number.
 */
export interface BreadcrumbLabels {
  /** The `<nav>`'s accessible name. @default 'Breadcrumb' */
  navigation: string;
  /**
   * The accessible name of the button that stands in for collapsed items,
   * given how many are hidden. It is a button showing only "…", so this is its
   * whole name. @default (count) => `Show ${count} hidden page(s)`
   */
  expand: (hiddenCount: number) => string;
}

export interface BreadcrumbProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "className" | "style" | "id"> {
  /**
   * The trail, in order from the top of the site down to the current page: one
   * `Breadcrumb.Item` per level, the last holding `Breadcrumb.Page`. Only
   * `Breadcrumb.Item` elements are rendered — a fragment or plain text among
   * them is ignored (with a warning in development).
   */
  children: ReactNode;
  /**
   * The size of the text, icons and gaps.
   * @default 'md'
   */
  size?: BreadcrumbSize;
  /**
   * The colour of the links — see {@link BreadcrumbTone}. Set once here, so every link in the trail matches.
   * @default 'info'
   */
  tone?: BreadcrumbTone;
  /**
   * Underlines every link all the time. Left `false`, a link is underlined only while hovered — either way
   * the underline is in the link's own colour. Turn it on where a link's colour alone is a weak cue, such as
   * a trail set next to body text.
   * @default false
   */
  underline?: boolean;
  /**
   * What sits between two items — see {@link BreadcrumbSeparator}.
   * @default 'chevron'
   */
  separator?: BreadcrumbSeparator;
  /**
   * Collapses a long trail: the items in the middle are replaced by a "…" button that shows them all
   * when used. A number collapses once there are more items than that; `"container"` collapses only as
   * many as it takes for the trail to fit its own width, measured in the browser (so a server-rendered
   * page shows the full trail until it loads), and again whenever that width changes. Left out, the trail
   * never collapses and simply wraps onto more lines when it is too wide.
   */
  maxItems?: number | "container";
  /**
   * Whether the trail collapses to a single "back to the parent page" link — see
   * {@link BreadcrumbCompact}.
   * @default 'never'
   */
  compact?: BreadcrumbCompact;
  /**
   * Keeps the trail on one line and cuts a label that doesn't fit short with an ellipsis, the longest
   * labels first. The full text stays in the page for screen readers, and as a tooltip (`title`) when the
   * label is plain text. With `maxItems="container"`, items collapse first and labels are cut short only
   * once the trail can collapse no further. Off, a long trail wraps onto more lines, which shows every
   * word and is the easier one to read — use `truncate` where a trail must stay on one line.
   * @default false
   */
  truncate?: boolean;
  /**
   * How many items stay visible at the start of a collapsed trail, before the
   * "…" button. Has no effect without `maxItems`.
   * @default 1
   */
  itemsBeforeCollapse?: number;
  /**
   * How many items stay visible at the end of a collapsed trail, after the
   * "…" button — always at least 1, since the last item is the current page.
   * Has no effect without `maxItems`.
   * @default 2
   */
  itemsAfterCollapse?: number;
  /** The text the component supplies itself, each part replaceable. See {@link BreadcrumbLabels}. */
  labels?: Partial<BreadcrumbLabels>;
  /**
   * The `<nav>`'s accessible name, overriding `labels.navigation`. Give each
   * breadcrumb a distinct name when a page holds more than one.
   */
  "aria-label"?: string;
  /** The id of a visible element that names the `<nav>`, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /**
   * Text direction, a native attribute: `"rtl"` mirrors the trail — the first item sits at the right, and the
   * chevron and the compact form's back arrow point the other way. Left out, it follows the nearest `DirectionProvider`; with none, it is inherited from the page.
   */
  dir?: "ltr" | "rtl" | "auto";
  /** Standard DOM id, on the `<nav>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface BreadcrumbItemProps
  extends Omit<ComponentPropsWithoutRef<"li">, "className" | "style" | "id"> {
  /** A `Breadcrumb.Link` for a page above the current one, or `Breadcrumb.Page` for the current one. */
  children?: ReactNode;
  /** Standard DOM id, on the `<li>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

export interface BreadcrumbLinkProps extends Omit<LinkProps, "underline"> {
  /**
   * An icon shown before the text — a component reference from
   * `@dbm-system/icons`, not a string name. Decorative, so the link
   * still needs text (or an `aria-label`). Not drawn with `asChild`, since the
   * slotted element owns its own content; put the icon inside it instead.
   */
  icon?: PhosphorIcon;
}

export interface BreadcrumbPageProps extends Omit<ComponentPropsWithoutRef<"span">, "className" | "style" | "id"> {
  /** The current page's name. */
  children?: ReactNode;
  /**
   * An icon shown before the text — a component reference from
   * `@dbm-system/icons`, not a string name. Decorative.
   */
  icon?: PhosphorIcon;
  /** Standard DOM id, on the `<span>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}
