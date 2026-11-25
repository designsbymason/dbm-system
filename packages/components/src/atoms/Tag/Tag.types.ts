import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. `brand` and `highlight` are the non-status tones — the system's own identity color, and its general highlight and accent color — matching Badge's own tone scale (which Tag otherwise mirrors) rather than a status. */
export type TagTone = "brand" | "neutral" | "info" | "success" | "warning" | "highlight" | "danger";
export type TagVariant = "subtle" | "solid" | "outlined";
export type TagSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TagProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * Feedback-type coloring, independent of `variant`. `brand` and
   * `highlight` are the system's own identity color and its general
   * highlight and accent color, rather than statuses.
   * @default 'brand'
   */
  tone?: TagTone;
  /**
   * Low-emphasis subtle-background style, high-emphasis solid-fill, or
   * `outlined` — a bordered style with no background of its own (one not
   * shared with Badge, whose own variant scale is subtle/solid only).
   * A selected `outlined` tag converges toward `solid`'s own look — full
   * tone fill with on-color text — while keeping the same border it had
   * unselected, rather than an offset-halo ring, since its own border
   * already frames it.
   * @default 'subtle'
   */
  variant?: TagVariant;
  /**
   * Padding and font-size together as one step on the shared size
   * scale — also controls the leading icon's and remove button's own
   * sizing.
   * @default 'md'
   */
  size?: TagSize;
  /** Leading icon — a component reference, not a string name. */
  leadingIcon?: PhosphorIcon;
  /** Trailing icon — a component reference, not a string name. */
  trailingIcon?: PhosphorIcon;
  /**
   * Shows a trailing remove ("×") affordance, calling `onRemove` when
   * activated. Actually removing the tag (e.g. from a filter list) is the
   * caller's responsibility. Normally a real, independently focusable
   * button — but when the tag is *also* clickable/selectable (`onClick`,
   * `selected`, `defaultSelected`, or `onSelectedChange`), a second nested
   * focusable control would be an ARIA violation (confirmed via axe's
   * "nested-interactive" rule), so it renders as a decorative,
   * mouse-clickable-only glyph instead, with Delete/Backspace on the tag
   * itself (already focused, since interactive) as the keyboard path.
   * @default false
   */
  removable?: boolean;
  /**
   * Called when the remove button is clicked. Has no effect unless
   * `removable` is set.
   */
  onRemove?: () => void;
  /**
   * Accessible label for the remove button. Left out or empty, it is
   * "Remove" followed by the plain text of `children` (the pieces of
   * `Status: {value}` and the text inside an element are joined), or just
   * "Remove" when there is none.
   * @default `Remove ${children}`
   */
  removeLabel?: string;
  /**
   * Whether the remove button is a tab stop. Turn it off for a parent that
   * manages focus among several tags itself (a field of removable chips
   * reached with the arrow keys): the button then has `tabindex="-1"`, so it
   * is still focusable by script and by a press, and still named and read by
   * assistive tech, but Tab passes over it. Only the real remove button is
   * affected; a clickable or selectable tag's decorative remove glyph was
   * never a tab stop.
   * @default true
   */
  removeTabStop?: boolean;
  /**
   * Called when the tag itself is clicked, or activated via Enter/Space
   * while focused. Passing this — or any of `selected`/`defaultSelected`/
   * `onSelectedChange` — makes the whole tag focusable and keyboard-
   * activatable (`role="button"`), not just visually clickable. Applies
   * no "active" visual treatment on its own; pair with `selected` for
   * that. Coexists with `removable`: clicking the remove button never
   * also triggers this.
   */
  onClick?: () => void;
  /**
   * Controlled selected/active state, for a toggleable filter-style tag —
   * pairs with `onSelectedChange`. Applies `aria-pressed` and a built-in
   * selected visual treatment, and (like `onClick`) makes the whole tag
   * focusable/keyboard-activatable. Omit both this and `defaultSelected`
   * for a tag with no toggle state at all.
   */
  selected?: boolean;
  /**
   * Initial selected state for uncontrolled usage — ignored once
   * `selected` is provided.
   * @default false
   */
  defaultSelected?: boolean;
  /**
   * Called with the next selected state whenever the tag is toggled
   * (click, or Enter/Space while focused). Required for `selected`
   * (controlled) to actually update; optional with `defaultSelected`
   * (uncontrolled), which tracks state internally regardless.
   */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * Tag content — usually a short label. A label wider than the room the tag
   * is in is shortened with an ellipsis; the tag never grows past its
   * container.
   */
  children?: ReactNode;
  /**
   * Disables interaction — blocks `onClick`, selection toggling, and (when
   * the tag is also removable) the decorative remove glyph, applying
   * `aria-disabled`. Only meaningful once the tag is interactive (any of
   * `onClick`/`selected`/`defaultSelected`/`onSelectedChange`) — a plain,
   * read-only tag has nothing to disable in the first place, and neither
   * does a merely `removable`-but-not-otherwise-interactive tag: its
   * remove control has no disabled concept of its own either, by the same
   * "only meaningful once interactive" scoping. Tag warns once in
   * development if `disabled` is set without one of those. The tag's own
   * element is always a `<span>`, never a native
   * `<button>`, so this applies `aria-disabled` plus blocked handlers
   * rather than a native `disabled` attribute — mirrors `Avatar`'s own
   * `disabled` scoping for non-`button` `as` values.
   * @default false
   */
  disabled?: boolean;
  /**
   * A ref to the element that holds the label, for a caller that needs to
   * measure it: whether the text is cut by the container (its `scrollWidth`
   * is wider than its `clientWidth`), to show the whole text in a tooltip
   * only then. `null` when the tag has no label (an icon-only tag).
   */
  labelRef?: Ref<HTMLSpanElement>;
  /**
   * Explicit accessible-name override for the tag's interactive role,
   * once it has one (`onClick`/`selected`/`defaultSelected`/
   * `onSelectedChange`). Rarely needed — the visible `children` already
   * provide the accessible name in the common case — but useful when
   * `children` alone doesn't read as a complete name (e.g. an
   * icon-accompanied abbreviation).
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — same role as `aria-label` above.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * tag.
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
