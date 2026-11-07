import type * as DialogPrimitive from "@radix-ui/react-dialog";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";
import type { HeadingLevel, HeadingSize } from "../../atoms/Heading/Heading.types";

type DialogPrimitiveContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

/**
 * The panel's extent along the axis it opens on, on the standard 5-step scale (`05-component-api-conventions.md`
 * §2): its width for a `start` or `end` drawer, and the most height it may take for a `top` or `bottom` one. Each
 * step maps to a `drawer.size.*` component token; on a viewport narrower (or shorter) than the step, the panel
 * leaves a sliver of the page showing instead, so there is always something to press to close it.
 */
export type DrawerSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What `size` takes: a step of the scale, or, for the one drawer that needs a width the scale doesn't have, a CSS
 * length (`"22rem"`, `"min(90vw, 40rem)"`) or a number of pixels. A value that isn't a step is the same extent,
 * on the same axis, with the same sliver of the page left showing on a smaller viewport.
 */
export type DrawerSizeValue = DrawerSize | (string & Record<never, never>) | number;

/**
 * The edge of the viewport the panel is attached to. `"start"` and `"end"` are logical: the inline start and end,
 * which are the left and right edges in left-to-right text and swap in right-to-left, so a navigation drawer opens
 * from the side a reader expects. `"top"` and `"bottom"` span the full width, and `"bottom"` is the usual shape of
 * a sheet on a phone.
 */
export type DrawerSide = "start" | "end" | "top" | "bottom";

/**
 * What closed (or opened) the drawer, given as the second argument of `onOpenChange`.
 * - `"trigger"`: a click on `Drawer.Trigger`.
 * - `"escape"`: the Escape key.
 * - `"outside"`: a press on the scrim, or, in a non-modal drawer, focus moving out of it.
 * - `"close-button"`: the built-in close button in the panel's corner.
 * - `"close"`: a `Drawer.Close` element, usually a Cancel or Done button in the footer.
 * - `"swipe"`: a touch or pen drag of the panel toward its edge (see `swipeToDismiss`).
 */
export type DrawerOpenChangeReason = "trigger" | "escape" | "outside" | "close-button" | "close" | "swipe";

/** The second argument of `onOpenChange`. */
export interface DrawerOpenChangeDetails {
  /** What caused the change — see {@link DrawerOpenChangeReason}. */
  reason: DrawerOpenChangeReason;
}

/** Where the buttons in a `Drawer.Footer` sit along its row. */
export type DrawerFooterAlign = "start" | "end" | "between" | "stretch";

/**
 * The text `Drawer` supplies itself, translatable through the `labels` prop on `Drawer.Content`. Nothing here needs
 * a number, so there is no `formatNumber`.
 */
export interface DrawerLabels {
  /** The accessible name of the built-in close button. @default 'Close' */
  close: string;
}

export interface DrawerProps {
  /** `Drawer.Trigger` and `Drawer.Content`. */
  children?: ReactNode;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the drawer manage its own open state. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes — a trigger click, Escape, a press on the scrim, a
   * `Drawer.Close`, or the built-in close button. The second argument says which of them it was, so a form with
   * unsaved changes can confirm on the scrim and not on its own "Cancel", and analytics can tell them apart.
   */
  onOpenChange?: (open: boolean, details: DrawerOpenChangeDetails) => void;
  /**
   * Called with `true` once the drawer has finished opening (its entrance has finished) and with `false` once it has
   * finished closing and is out of the page. `onOpenChange` says a change *started*; this says it is *over*: the place
   * to reset a form or release something heavy without guessing the animation's length.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the drawer is modal. A modal drawer dims the page behind it with a scrim, locks the page's scroll,
   * traps focus inside it and makes the rest of the page inert to assistive technology. Set `false` for a docked
   * tool panel that coexists with the page: no scrim, no scroll lock, and the page stays usable behind it.
   * @default true
   */
  modal?: boolean;
}

export interface DrawerTriggerProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot` composition) instead of the built-in, unstyled
   * native `<button>`. Reach for this to use one of this system's own interactive components (`Button`,
   * `IconButton`) as the visible trigger.
   * @default false
   */
  asChild?: boolean;
  /** The trigger's own content — a single element when `asChild` is set. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role"> {
  /** The drawer's content: usually `Drawer.Header`, `Drawer.Body` and `Drawer.Footer`, any of them optional. */
  children?: ReactNode;
  /**
   * The edge the panel is attached to — see {@link DrawerSide}. A mobile-first responsive map switches it at a
   * breakpoint, e.g. `{ base: "bottom", md: "end" }` for a sheet on a phone that becomes a side panel from `md` up.
   * @default 'end'
   */
  side?: Responsive<DrawerSide>;
  /**
   * The panel's extent — see {@link DrawerSize}: its width for `start` and `end`, the most height it takes for `top`
   * and `bottom`. On a viewport smaller than the step the panel leaves a sliver of the page showing. Takes a step of
   * the scale, or a CSS length or a number of pixels for a size the scale doesn't have; prefer a step, which every
   * drawer in an app then shares.
   * @default 'md'
   */
  size?: DrawerSizeValue;
  /**
   * Lets a touch or a pen drag the panel toward its edge to dismiss it, by its handle or its header: a short drag
   * settles back, and a long or quick one closes it with the reason `"swipe"`. A mouse is given it from the handle
   * only (a `top` or `bottom` drawer's grab handle, which has no text to select), never the header. Off while
   * `busy`. The close button, Escape and the scrim remain, so nothing needs the gesture.
   * @default true
   */
  swipeToDismiss?: boolean;
  /**
   * Draws a small grab handle on the inner edge of a `top` or `bottom` drawer, the usual cue that a sheet can be
   * dragged away, by a mouse as well as a touch. Decorative, and not drawn for a `start` or `end` drawer, which has
   * none. Dragging the header (touch and pen) works with or without it.
   * @default true
   */
  showHandle?: boolean;
  /**
   * Draws a line between the header and the body and between the body and the footer, so a body that scrolls
   * reads as running under them. Same name and meaning as `Card`'s `divided`. `"auto"` draws each line only while
   * there is content scrolled out of view on that side (the header's line once the body has scrolled, the
   * footer's while more is below), so a drawer that fits gets no lines and a long one does; nothing moves when a
   * line appears. `true` draws both always, and `false` draws neither.
   * @default 'auto'
   */
  divided?: boolean | "auto";
  /**
   * Marks the drawer as working on something (a form being submitted): it can't be dismissed by Escape, the scrim,
   * the close button or a `Drawer.Close` until it is `false` again, the close button is `aria-disabled` (dimmed, but still focusable), and the panel is
   * `aria-busy`. Sets what `closeOnEscape`, `closeOnOutsideClick` and `showCloseButton` would, in one place and
   * reversibly, and doesn't change those props. Show your own progress indicator: this adds none.
   * @default false
   */
  busy?: boolean;
  /**
   * Keeps what is inside the drawer mounted while it is closed, so a half-filled form, a scroll position or a
   * tab someone chose is still there when it reopens. Off, the content is removed on close and starts fresh.
   * Content is first rendered the first time the drawer opens, then kept; while closed it is out of the page
   * (not displayed and not reachable), but its effects still run. For a drawer that should reset every time, leave
   * this off.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * An element to focus when the drawer opens, instead of the first focusable element in the panel — usually the
   * field the person came to fill in, or a primary action. Ignored if `onOpenAutoFocus` calls
   * `event.preventDefault()`, and if the element isn't there yet when the drawer opens.
   */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * How opaque the scrim behind a modal drawer is, from the opacity token scale. Has no effect while
   * `modal={false}`.
   * @default 60
   */
  scrimOpacity?: BackdropOpacity;
  /**
   * Blurs the page behind the scrim as well as dimming it. Has no effect while `modal={false}`.
   * @default false
   */
  scrimBlur?: boolean;
  /**
   * Shows a `CloseButton` in the panel's top-end corner. Unlike `Popover`'s, it is on by default: a modal needs a
   * visible way out. Turn it off only when the footer carries its own close action, and keep Escape available.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Whether a press outside the panel (on the scrim) closes the drawer. Set `false` for a form with unsaved
   * changes, where a stray click shouldn't throw the work away. Also stops a focus move outside from closing a
   * non-modal drawer. For finer control, use `onInteractOutside` and call `event.preventDefault()`.
   * @default true
   */
  closeOnOutsideClick?: boolean;
  /**
   * Whether Escape closes the drawer. Set `false` only when closing has to go through an explicit choice; for
   * finer control use `onEscapeKeyDown` and call `event.preventDefault()`.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * The text the component supplies itself, each part replaceable — see {@link DrawerLabels}. A part left
   * `undefined` keeps its English default.
   */
  labels?: Partial<DrawerLabels>;
  /**
   * Renders the drawer into a different DOM node than `document.body` (Radix's own default) — for a specific
   * stacking-context requirement, or to keep an embedded demo inside its own box. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Called when focus moves into the drawer on open. Call `event.preventDefault()` inside to choose the element to
   * focus yourself instead of the default, the first focusable element in the panel.
   */
  onOpenAutoFocus?: DialogPrimitiveContentProps["onOpenAutoFocus"];
  /**
   * Called when focus is about to return on close: to the trigger, or, for one opened from state with no trigger, to
   * the element that had focus when it opened. Call `event.preventDefault()` inside to send focus elsewhere instead.
   */
  onCloseAutoFocus?: DialogPrimitiveContentProps["onCloseAutoFocus"];
  /**
   * Called when Escape is pressed while open. Call `event.preventDefault()` inside to keep the drawer open (e.g.
   * while a nested confirmation is showing). Runs before `closeOnEscape` is applied.
   */
  onEscapeKeyDown?: DialogPrimitiveContentProps["onEscapeKeyDown"];
  /**
   * Called on a pointer-down outside the panel. Call `event.preventDefault()` inside to keep the drawer open.
   */
  onPointerDownOutside?: DialogPrimitiveContentProps["onPointerDownOutside"];
  /**
   * Called when focus moves outside the panel. Only a non-modal drawer can lose focus this way. Call
   * `event.preventDefault()` inside to keep the drawer open.
   */
  onFocusOutside?: DialogPrimitiveContentProps["onFocusOutside"];
  /**
   * Called on any interaction outside the panel — a pointer-down or a focus move. Call `event.preventDefault()`
   * inside to keep the drawer open. Fires alongside `onPointerDownOutside`/`onFocusOutside`, not instead of them.
   */
  onInteractOutside?: DialogPrimitiveContentProps["onInteractOutside"];
  /**
   * Accessible name for the drawer, used when it has no visible title. A `Drawer.Title` is the preferred name
   * (wrapped in `VisuallyHidden` if the design has no visible heading), and is wired in automatically.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing element to use as the accessible name instead of a `Drawer.Title`. Rarely
   * needed: `Drawer.Title` is wired in automatically.
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of an existing element that describes the drawer. `Drawer.Description` is wired in
   * automatically, so this is only for a description that isn't one.
   */
  "aria-describedby"?: string;
  /** Standard DOM id, applied to the drawer element. */
  id?: string;
  /**
   * Additional CSS classes for customization, on the drawer panel itself.
   */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerHeaderProps extends ComponentPropsWithoutRef<"div"> {
  /** The header's content, usually a `Drawer.Title` and optionally a `Drawer.Description`. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/**
 * `Drawer.Title` and `Drawer.Description` take no `id`: the drawer generates both and points its own
 * `aria-labelledby` and `aria-describedby` at them, and a replaced id would leave those pointing at nothing.
 */
export interface DrawerTitleProps extends Omit<ComponentPropsWithoutRef<"h2">, "color" | "id"> {
  /** The title text. It names the drawer for assistive technology, so every drawer should have one. */
  children?: ReactNode;
  /**
   * The heading level it is rendered as (`h1`–`h6`). Pick the level that fits the page's outline; it doesn't
   * change the size.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * The text size, from `Heading`'s scale.
   * @default 'xl'
   */
  size?: HeadingSize;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerDescriptionProps extends Omit<ComponentPropsWithoutRef<"p">, "color" | "id"> {
  /** One or two sentences saying what the drawer is for. Read out after the title when the drawer opens. */
  children?: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerBodyProps extends ComponentPropsWithoutRef<"div"> {
  /** The main content. It scrolls inside the panel while the header and footer stay put. */
  children?: ReactNode;
  /**
   * Text direction of the scroll region, which decides the side the scrollbar sits on. Left out, it follows the
   * nearest `DirectionProvider`, else left-to-right.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Accessible name for the scroll region, read when keyboard focus lands on a body that scrolls. Optional: a
   * body with neither this nor `aria-labelledby` is still focusable and scrollable.
   */
  "aria-label"?: string;
  /** Points to the `id` of an existing element that names the scroll region. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization, on the scroll region's outer frame. */
  className?: string;
  /** Inline styles, merged onto the scroll region's outer frame. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerFooterProps extends ComponentPropsWithoutRef<"div"> {
  /** The footer's actions, usually `Button`s, one of them a `Drawer.Close`. */
  children?: ReactNode;
  /**
   * Where the actions sit along the row. `"stretch"` makes each one fill an equal share, which suits a phone.
   * Below `sm` the actions of any other alignment stack, each as wide as the footer; `"stretch"` stays a row.
   * @default 'end'
   */
  align?: DrawerFooterAlign;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DrawerCloseProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot` composition) instead of the built-in, unstyled
   * native `<button>` — for a `Button` reading "Cancel" or "Done" that should still close the drawer on click.
   * @default false
   */
  asChild?: boolean;
  /** The close control's own content — a single element when `asChild` is set. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
