import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Breakpoint } from "@dbm-system/utils";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";
import type { TooltipSide } from "../Tooltip/Tooltip.types";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../Button/Button.types";

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  // `aria-label`: redeclared below as required, not optional.
  // `aria-pressed`: fully owned by the `pressed`/`defaultPressed`/
  // `onPressedChange` trio below — computed automatically, not a raw
  // passthrough, so it's removed from the native extends entirely rather
  // than risk a consumer's direct `aria-pressed` colliding with (and being
  // silently erased by) this component's own computed value.
  "aria-label" | "aria-pressed"
> {
  /** The icon to render — a component reference, not a string name. Drawn inside the slotted element with `asChild`. */
  icon: PhosphorIcon;
  /**
   * Visual style, signaling emphasis/hierarchy: `primary` for the one main action, down to `ghost` for the quietest, and
   * `destructive` for an action that deletes or can't be undone. The same five styles `Button` has.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * The colour family: `brand` (the default) or `neutral`, a grey look for a control that shouldn't draw the eye to the brand
   * colour. The same two tones `Button` has; every variant but `destructive` follows it, and `destructive` ignores it and stays
   * danger-coloured.
   * @default 'brand'
   */
  tone?: ButtonTone;
  /**
   * The button's box, on the shared 5-step size scale. Its height and width match a `Button` of the same step, so an
   * `IconButton` sits flush beside one; the icon scales with it.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * A short caption under the icon, so the icon and the caption are one control: hover, pressed, focus and a click all cover
   * both. The box is taller and as wide as the caption needs, never narrower than the plain square of its `size`; a pressed
   * toggle draws the caption bold without changing the box's width. Keep it to a word or two (one line, never wrapped).
   * `aria-label` stays required, since without the caption (below `hideLabelBelow`) the button is icon-only, and in
   * development a warning fires if the caption isn't part of it (WCAG 2.5.3). With `asChild` it is drawn inside the slotted
   * element, unless that element has content of its own; `rounded` is ignored while it shows; both warn in development. The caption is a `text.*` colour,
   * following the variant and `tone` as `Button`'s label does.
   */
  label?: string;
  /**
   * The width below which the caption is left out and the button is the plain icon-only square, a breakpoint step, so a bar
   * can drop its captions on a phone. Left out, the caption shows at every width. Decided by the stylesheet, so a server
   * render is right at first paint. Has no effect without `label`.
   */
  hideLabelBelow?: Exclude<Breakpoint, "base">;
  /**
   * Shows a spinner in place of the icon and disables interaction while
   * `true`. When `asChild` is also set, the spinner is drawn inside the
   * slotted element (unless it has content of its own), and since that
   * element can't take a native `disabled` attribute, this applies
   * `aria-disabled` plus matching dimmed styling and blocks its click handler.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Overrides `aria-label` while `isLoading` is `true` (e.g. "Deleting…")
   * — there's no visible text to swap the way `Button`'s `loadingText`
   * does, and `aria-busy` alone isn't reliably announced by every screen
   * reader. Falls back to `aria-label` when omitted.
   */
  loadingLabel?: string;
  /**
   * Renders as a circle instead of the standard rounded-corner shape —
   * common for floating-action-button-style triggers.
   * @default false
   */
  rounded?: boolean;
  /**
   * Whether the button is in a "pressed"/active toggle state (e.g. a
   * favorited/starred icon button) — controlled. Pair with
   * `onPressedChange`. Setting either `pressed` or `defaultPressed` opts
   * the button into toggle-button semantics: `aria-pressed` is computed
   * and set automatically, and the pressed visual treatment applies while
   * `true`. Omit both entirely for a plain, non-toggle button (the common
   * case, and this component's own default) — `aria-pressed` is only ever
   * rendered when the button is genuinely a toggle. Naming mirrors Radix
   * `Toggle`'s own `pressed`/`defaultPressed`/`onPressedChange` trio,
   * consistent with this system's "mirror Radix's own pattern" convention
   * for controlled/uncontrolled state (`05-component-api-conventions.md`
   * §3), even though this component doesn't wrap Radix `Toggle` directly.
   */
  pressed?: boolean;
  /**
   * Initial pressed state for an *uncontrolled* toggle button. Ignored
   * once `pressed` is also provided.
   * @default false
   */
  defaultPressed?: boolean;
  /**
   * Fires when the pressed state changes — a click (or Space/Enter via the
   * native button) toggles it. Receives the new pressed value. Required
   * for a controlled toggle (`pressed`) to actually change; optional for
   * an uncontrolled one, where the component tracks its own state.
   */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`), for a link that looks like an icon button:
   * `<IconButton asChild icon={…} aria-label="Name"><a href="…" aria-label="Name" /></IconButton>`
   * (the same name on the link satisfies lint rules that check a link for content).
   * The icon (and the spinner and caption) are drawn inside that element. If
   * the element has content of its own, that content is used as it is and
   * `icon` and `label` are not drawn.
   * @default false
   */
  asChild?: boolean;
  /**
   * The native button behavior: `submit` submits the nearest `<form>`,
   * `reset` resets it, `button` (the default) does neither. Only relevant
   * for a real `<button>` element — ignored in `asChild` mode, since the
   * slotted element supplies its own semantics.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
  /**
   * Disables the button natively. When `asChild` is also set, the slotted
   * element can't take a native `disabled` attribute, so this instead
   * applies `aria-disabled` plus matching dimmed styling and blocks its
   * click handler — the same mechanism `isLoading` uses.
   * @default false
   */
  disabled?: boolean;
  /** Fires on click, unless `disabled`/`isLoading` blocks it. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /**
   * Shows a tooltip on hover and keyboard focus, so a sighted user can read what an icon means. `true` uses the
   * button's own `aria-label` as the text; any other content (a string, or a node such as a label with its shortcut)
   * is shown instead. Left out, or `false`, there is no tooltip. The button is still named by `aria-label`, so the
   * tooltip is a convenience for sighted users, never the only name. A tooltip doesn't open on a disabled or
   * loading button (it can't be hovered or focused), and is built on `Tooltip`.
   * @default false
   */
  tooltip?: ReactNode;
  /**
   * Which side of the button the tooltip opens on, before it flips to fit. Has no effect without `tooltip`.
   * @default 'top'
   */
  tooltipSide?: TooltipSide;
  /**
   * Required — an icon-only button has no visible text, so an accessible
   * name must be supplied explicitly.
   */
  "aria-label": string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — e.g. a heading the button sits next to
   * whose text already says what the button does. Use instead of
   * `aria-label` when that visible element's text is the better accessible
   * name; use `aria-label` when no such element exists.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * button, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
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
