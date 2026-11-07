import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode } from "react";
import type { ButtonProps } from "../../atoms/Button";

/**
 * What the message is about, on the standard tone scale (`05-component-api-conventions.md` §2): `"info"` (the
 * default) is neutral news, `"success"` something that worked, `"warning"` something that needs attention, `"danger"`
 * something that went wrong, and `"neutral"` a plain notice with no meaning attached. The status colours are fixed;
 * they don't change with the brand.
 */
export type ToastTone = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * How the toasts sit in the region.
 *
 * - `"list"` (the default) — each toast in full, one under another.
 * - `"fan"` — the newest toast in full at the edge with the older ones peeking out behind it, up to three layers,
 *   spread out into the list while the pointer is over the toasts or focus is inside them. For an app whose toasts
 *   would otherwise take a good share of a small screen.
 */
export type ToastStack = "list" | "fan";

/**
 * How a toast is drawn, with the same names `Alert` uses for the same three treatments.
 *
 * - `"subtle"` (the default) — a soft tint of the tone's colour with a faint border.
 * - `"outlined"` — the page's own surface with a border in the tone's colour.
 * - `"solid"` — the tone's full colour, with light or dark text to suit.
 */
export type ToastVariant = "subtle" | "outlined" | "solid";

/**
 * Padding and type size, on the standard 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale.
 */
export type ToastSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The corner or edge of the screen the toasts stack against. `"start"` and `"end"` are logical: the inline start and
 * end, which are the left and right in left-to-right text and swap in right-to-left, so a toast in the `"bottom-end"`
 * corner is in the same corner as the page's own end. `"top"` and `"bottom"` are centred. In the list the newest toast
 * is at the top and "Clear all" at the bottom, whichever edge it is against; a fan puts the newest in front, at the
 * edge.
 */
export type ToastPlacement = "top-start" | "top" | "top-end" | "bottom-start" | "bottom" | "bottom-end";

/**
 * How a toast is announced to assistive technology.
 *
 * - `"alert"` — interrupts: read at once, even mid-sentence. For something that needs attention now.
 * - `"status"` — waits for a pause. For news that can wait a moment.
 *
 * Left out, it follows the tone: `"alert"` for `"danger"` and `"warning"`, `"status"` for the rest. A toast is always
 * news, so there is no `"none"`, as there is on `Alert`: if it should not be announced, it is not a toast.
 */
export type ToastRole = "alert" | "status";

/**
 * What closed a toast, given as the second argument of `onOpenChange`.
 * - `"timeout"`: its time ran out.
 * - `"dismiss"`: the built-in dismiss button.
 * - `"action"`: its action button was pressed.
 * - `"swipe"`: a touch, pen or mouse drag of it toward the edge.
 * - `"escape"`: the Escape key.
 * - `"programmatic"`: `dismiss()` or `dismissAll()` from `useToast`, or the provider removing it.
 */
export type ToastOpenChangeReason = "timeout" | "dismiss" | "action" | "swipe" | "escape" | "programmatic";

/** The second argument of `onOpenChange`. */
export interface ToastOpenChangeDetails {
  /** What caused the change — see {@link ToastOpenChangeReason}. */
  reason: ToastOpenChangeReason;
}

/**
 * The text the toast system supplies itself, translatable through the `labels` prop on `Toast.Provider` (`ADR-0021`).
 * Nothing here needs a number, so there is no `formatNumber`.
 */
export interface ToastLabels {
  /** The accessible name of the dismiss button. @default 'Dismiss' */
  dismiss: string;
  /**
   * The name of the region the toasts live in, for a screen reader reading the page's landmarks. `{hotkey}` is
   * replaced by the shortcut that moves focus there.
   * @default 'Notifications ({hotkey})'
   */
  viewport: string;
  /**
   * Read before each toast's text, so a screen reader user knows an interruption is a notification.
   * @default 'Notification'
   */
  notification: string;
  /**
   * The label of the button that closes every toast, drawn once more than one is showing.
   * @default 'Clear all'
   */
  clearAll: string;
  /**
   * What is drawn after a message that was raised again while it was still showing, from how many times it has been
   * raised. Gets the plain number: write it with `formatNumber` yourself, as the default does.
   * @default (count) => `×${formatNumber(count)}`
   */
  repeated: (count: number) => string;
}

/** What `Toast.Action` is told and given by a toast. */
export type ToastActionVariant = "primary" | "secondary" | "tertiary";

/** One thing the person can do about a toast, in the options of `toast()`. */
export interface ToastActionOptions {
  /** The button's label. */
  label: ReactNode;
  /**
   * How to do the same thing without the toast, for a screen reader user or a keyboard user who will not reach it in
   * time ("Undo from the Edit menu", "Open Settings to change this"). It is read out with the toast, in place of
   * the button, and **required**: a toast goes away by itself, so the action must never be the only way.
   */
  altText: string;
  /**
   * Called when the button is pressed. Returning nothing closes the toast at once. Returning a promise holds it open
   * while it runs: the button shows a spinner and is pressed no more than once, the toast does not time out, and it
   * closes (with the reason `"action"`) when the promise resolves. A rejection keeps it open and the button
   * available again, and goes to `onError` — or, with none, is rethrown so it surfaces as an unhandled rejection
   * rather than being dropped. The toast says nothing about the failure itself: update it with `update()` from
   * `onError` if it should.
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  /** Called with what a promise returned by `onClick` rejected with. */
  onError?: (error: unknown) => void;
  /**
   * How prominent it is.
   * @default 'primary'
   */
  variant?: ToastActionVariant;
}

/**
 * The options of `toast()` — everything a toast can be, as data. The same thing as the `Toast` component with its
 * parts, for a message raised from code.
 */
export interface ToastOptions {
  /**
   * An identifier. Calling `toast()` with the id of a toast that is still showing or waiting updates it in place
   * instead of adding another, which is how a repeated message is kept to one. Made up when left out.
   */
  id?: string;
  /** The headline, in a few words. */
  title?: ReactNode;
  /** The message itself. */
  description?: ReactNode;
  /**
   * What the message is about — see {@link ToastTone}. A loading toast with no tone is `"neutral"`.
   * @default 'info'
   */
  tone?: ToastTone;
  /** How it is drawn. The provider's `variant` when left out. */
  variant?: ToastVariant;
  /** Padding and type size. The provider's `size` when left out. */
  size?: ToastSize;
  /**
   * The icon before the message — a component reference from `@dbm-system/icons`, not a string name. Each tone
   * has its own; pass another to replace it, or `false` for none. Decorative: the tone is not conveyed by the icon
   * alone, so put what matters in the text.
   */
  icon?: PhosphorIcon | false;
  /**
   * Shows a spinner in place of the icon and keeps the toast open until it is updated. What `toast.promise` uses
   * for its pending state.
   * @default false
   */
  loading?: boolean;
  /** One thing the person can do about it. See {@link ToastActionOptions}. */
  action?: ToastActionOptions;
  /**
   * How long it stays, in milliseconds, before it closes by itself — paused while the pointer is over the toasts or
   * focus is inside them, and while the window is in the background. `null` keeps it until it is dismissed. Left
   * out, the provider's `duration` applies. Changing it on an update starts the time again.
   */
  duration?: number | null;
  /**
   * How it is announced — see {@link ToastRole}. Follows the tone when left out.
   */
  role?: ToastRole;
  /**
   * Adds a button that dismisses it.
   * @default true
   */
  dismissible?: boolean;
  /**
   * Called with `false` when it closes, and the reason. It never calls with `true`: a toast that is shown is
   * already open.
   */
  onOpenChange?: (open: boolean, details: ToastOpenChangeDetails) => void;
  /**
   * Called with `true` once it has finished arriving and with `false` once it has finished leaving and is out of the
   * page. `onOpenChange` says a change *started*; this says it is *over* (`ADR-0062`).
   */
  onOpenChangeComplete?: (open: boolean) => void;
}

/** What `toast.promise` shows for each state of the promise. */
export interface ToastPromiseOptions<Value> {
  /** Shown while the promise is pending: a toast with a spinner, kept until the promise settles. */
  loading: string | ToastOptions;
  /** Shown when it resolves, in place of the loading toast. A function gets the resolved value. */
  success: string | ToastOptions | ((value: Value) => string | ToastOptions);
  /** Shown when it rejects, in place of the loading toast. A function gets the rejection. */
  error: string | ToastOptions | ((reason: unknown) => string | ToastOptions);
  /** The id the toast takes. Made up when left out. */
  id?: string;
}

/** What `useToast()` gives back to raise and manage toasts from code. */
export interface ToastApi {
  /**
   * Shows a toast, or updates the one with the same `id`, and returns its id. A string is the same as
   * `{ title: string }`. It is queued if the provider's `limit` of toasts are already showing.
   */
  toast: ((options: string | ToastOptions) => string) & {
    /**
     * Shows a loading toast, then replaces it with the success or error toast when the promise settles, and returns
     * the promise itself, so it can still be awaited. A rejection is still the caller's to handle: it is only
     * reported on screen, not caught.
     */
    promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
  };
  /** Changes a toast that is showing or waiting. An id that is not there is ignored. */
  update: (id: string, options: Partial<ToastOptions>) => void;
  /** Closes the toast with this id, with the exit animation. An id that is not there is ignored. */
  dismiss: (id: string) => void;
  /** Closes every toast, and drops the ones still waiting their turn. */
  dismissAll: () => void;
}

/**
 * A queue of toasts made outside React, for code that has no component to call `useToast()` from (an API client's error
 * handler, a service module). It is the same `{ toast, update, dismiss, dismissAll }` as `useToast()` gives, and does
 * nothing visible until it is handed to one `Toast.Provider` as its `toaster`; toasts raised before then wait in it.
 * Give each toaster to one provider only.
 */
export interface Toaster extends ToastApi {
  /** Marks it as made by `createToaster()`. */
  readonly isToaster: true;
}

export interface ToastProviderProps
  extends Omit<ComponentPropsWithoutRef<"ol">, "className" | "style" | "id" | "children" | "dir"> {
  /**
   * The part of the page the toasts are for — usually the whole app — and any declarative `Toast`s. The provider
   * renders nothing of its own here; the toasts are drawn in a region of their own, at the end of the page.
   */
  children?: ReactNode;
  /**
   * The corner or edge the toasts stack against — see {@link ToastPlacement}. A responsive map, mobile-first, gives
   * a phone one placement and a desktop another. Below the `sm` breakpoint a toast spans the screen less a
   * gutter whatever the horizontal placement, so only whether it is at the top or the bottom matters there.
   * @default 'top-end'
   */
  placement?: Responsive<ToastPlacement>;
  /**
   * How the toasts sit in the region — see {@link ToastStack}. A responsive map, mobile-first, gives a phone a fan and
   * a desktop the list. Time is held and the stack is spread out while the toasts are being read, as it is in the list.
   * @default 'list'
   */
  stack?: Responsive<ToastStack>;
  /**
   * The most toasts showing at once. Those past it wait, and appear as room is made, each starting its own time when
   * it appears.
   * @default 3
   */
  limit?: number;
  /**
   * How long a toast stays, in milliseconds, unless it says otherwise. `null` keeps toasts until they are dismissed.
   * Paused while the pointer is over the toasts or focus is inside them, and while the window is in the background.
   * @default 5000
   */
  duration?: number | null;
  /**
   * Padding and type size of every toast, unless one says otherwise.
   * @default 'md'
   */
  size?: ToastSize;
  /**
   * How every toast is drawn, unless one says otherwise — see {@link ToastVariant}.
   * @default 'subtle'
   */
  variant?: ToastVariant;
  /**
   * Draws a button that closes every toast (and drops the ones waiting) once more than one is showing.
   * @default true
   */
  clearAll?: boolean;
  /**
   * Raising a plain message again while it is still showing (the same tone, title and description, with no `id`) shows
   * it once, with a count, and starts its time again, instead of stacking copies. An action and callbacks must be the
   * very same functions to merge, since a second call's own would be lost: a handler written inline at each call is a
   * different function and keeps the toasts apart.
   * @default true
   */
  mergeDuplicates?: boolean;
  /**
   * Writes the numbers the toasts show (the count of a repeated message). Defaults to `String`, never to the browser's
   * locale (`05-component-api-conventions.md` §3, ADR-0021).
   */
  formatNumber?: (value: number) => string;
  /**
   * A queue made with `createToaster()`, so toasts can be raised from outside React. The provider makes its own when
   * left out. One provider per toaster.
   */
  toaster?: Toaster;
  /**
   * The keys that move focus to the toasts, held together, as `KeyboardEvent` property or `code` names
   * (`["altKey", "KeyT"]`). The region's accessible name names it.
   * @default ['F8']
   */
  hotkey?: string[];
  /**
   * How far, in pixels, a toast has to be dragged toward the edge before letting go closes it. A shorter drag springs
   * back. Raise it where toasts sit under a thumb that scrolls, lower it for an easier swipe.
   * @default 50
   */
  swipeThreshold?: number;
  /**
   * Text direction, which sets which way a swipe closes a toast. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * The element the toasts' region is drawn into. The page's body when left out. For a demo that has to stay inside
   * a box (a Docs page, a preview pane): give it an element that is a containing block for `position: fixed`.
   */
  container?: HTMLElement | null;
  /** The text the component supplies itself, each part replaceable. See {@link ToastLabels}. */
  labels?: Partial<ToastLabels>;
  /** Standard DOM id, on the list the toasts are in. */
  id?: string;
  /** Additional CSS classes for customization, on the list the toasts are in. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface ToastProps extends Omit<ComponentPropsWithoutRef<"li">, "className" | "style" | "id" | "role" | "children" | "onPause" | "onResume"> {
  /**
   * The message: `Toast.Title`, `Toast.Description` and `Toast.Action` in any order, any of them optional.
   */
  children?: ReactNode;
  /**
   * What the message is about — see {@link ToastTone}.
   * @default 'info'
   */
  tone?: ToastTone;
  /**
   * How it is drawn. The provider's `variant` when left out.
   */
  variant?: ToastVariant;
  /**
   * Padding and type size. The provider's `size` when left out.
   */
  size?: ToastSize;
  /**
   * The icon before the message — a component reference from `@dbm-system/icons`. Each tone has its own;
   * pass another to replace it, or `false` for none.
   */
  icon?: PhosphorIcon | false;
  /**
   * Shows a spinner in place of the icon.
   * @default false
   */
  loading?: boolean;
  /**
   * Adds a button that dismisses it.
   * @default true
   */
  dismissible?: boolean;
  /**
   * How long it stays, in milliseconds. `null` keeps it until it is dismissed. The provider's `duration` when left
   * out.
   */
  duration?: number | null;
  /** Whether it is showing, when controlled. Pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether it starts out showing, when uncontrolled.
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Called with `false` when it closes, and the reason (`details.reason`). It never calls with `true`: nothing inside
   * it can reopen it.
   */
  onOpenChange?: (open: boolean, details: ToastOpenChangeDetails) => void;
  /**
   * Called with `true` once it has finished arriving and with `false` once it has finished leaving and is out of the
   * page (`ADR-0062`).
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * How it is announced — see {@link ToastRole}. Follows the tone when left out.
   */
  role?: ToastRole;
  /** The accessible name of the dismiss button, for this toast only. The provider's `labels.dismiss` when left out. */
  dismissLabel?: string;
  /** The id of an element that names the toast. */
  "aria-labelledby"?: string;
  /** The id of an element that describes it. */
  "aria-describedby"?: string;
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

export interface ToastTitleProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "id"> {
  /** The headline of the message — a few words. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

export interface ToastDescriptionProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "id"> {
  /** The message itself — text, or anything a message can hold, such as a link. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

export interface ToastActionProps extends Omit<ButtonProps, "variant" | "size" | "onClick"> {
  /** The action's label (or, with `asChild`, the element it is drawn onto). */
  children?: ButtonProps["children"];
  /**
   * How to do the same thing without the toast — **required**. A toast goes away by itself, and a screen reader user
   * or a keyboard user may never reach it in time, so this is read out with the toast in place of the button
   * ("Undo from the Edit menu"). The action must never be the only way.
   */
  altText: string;
  /**
   * How prominent it is, using the names `Button` uses for the same three treatments. How each looks depends on the
   * toast it sits in — its tone and variant — so that it always reads against it.
   * @default 'primary'
   */
  variant?: ToastActionVariant;
  /**
   * Called when it is pressed, and then the toast closes. Returning a promise holds the toast open while it runs
   * (a spinner on the button, no second press, no timeout) and closes it when it resolves; a rejection keeps it open
   * and goes to `onClickError`.
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  /**
   * Called with what a promise returned by `onClick` rejected with. With none, the rejection is rethrown so it
   * surfaces as an unhandled rejection rather than being dropped.
   */
  onClickError?: (error: unknown) => void;
}
