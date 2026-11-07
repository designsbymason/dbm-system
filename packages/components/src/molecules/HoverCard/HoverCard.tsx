import { cx, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { CSSProperties } from "react";
import { forwardRef, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { OverlayArrow } from "../../internal/OverlayArrow/OverlayArrow";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import styles from "./HoverCard.module.css";
import type {
  HoverCardContentProps,
  HoverCardMediaProps,
  HoverCardProps,
  HoverCardTriggerProps,
} from "./HoverCard.types";
import { HoverCardProviderContext } from "./HoverCardProviderContext";
import { useProvidedDirection } from "../../atoms/DirectionProvider/DirectionProvider";

// Radix's arrow is 10 x 5 unless told otherwise, and it adds the arrow's height to
// `sideOffset` when it places the card, so the gap to bridge is the two together.
const ARROW_WIDTH = 10;
const ARROW_HEIGHT = 5;

/** `:focus-visible` is the browser's own guess at "this focus came from the keyboard". */
function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    // A browser too old to know the selector: keep Radix's own behaviour, open on any focus.
    return true;
  }
}

/**
 * A rich preview that opens when the pointer rests on a trigger (or
 * keyboard focus lands on it) and closes when it leaves — a profile card on
 * a username, a summary on a link — built on Radix HoverCard. Unlike
 * `Popover`, nothing is clicked: the card is *supplementary*. It is for
 * sighted pointer and keyboard users only: it never opens on a touch screen,
 * and it is not reachable by a screen reader's own navigation (Radix takes
 * every focusable element inside it out of the tab order). So the trigger
 * must lead somewhere on its own (a real link), and the card must never be
 * the only way to reach anything. For content that has to be interactive or
 * dependable, use `Popover`; for a short plain-text hint, `Tooltip`.
 *
 * A compound component: compose `HoverCard.Trigger` and `HoverCard.Content`
 * inside `HoverCard` itself, with an optional `HoverCard.Media` for an image
 * across the top of the content. Wrap a run of cards in one
 * `HoverCardProvider` so the next opens at once while another is open.
 * `disabled` keeps a card shut without unmounting it. `HoverCard` renders no DOM element of its own —
 * a plain context provider, matching Radix's own `HoverCard.Root` — so it
 * takes no `ref`/`className`/`style`/`id`/`data-testid`; those apply to
 * `HoverCard.Trigger` and `HoverCard.Content`, each of which forwards its ref.
 *
 * Does not expose Radix's `forceMount`, `sticky`, `arrowPadding` or
 * `updatePositionStrategy`, matching `Popover`'s own scope.
 *
 * @example
 * ```tsx
 * <HoverCard>
 *   <HoverCard.Trigger asChild>
 *     <Link href="/people/jane">@jane</Link>
 *   </HoverCard.Trigger>
 *   <HoverCard.Content>
 *     <Text weight="semibold">Jane Doe</Text>
 *     <Text size="sm">Design systems engineer.</Text>
 *   </HoverCard.Content>
 * </HoverCard>
 * ```
 */
function HoverCardRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay,
  closeDelay,
  disabled = false,
}: HoverCardProps) {
  const provider = useContext(HoverCardProviderContext);
  const id = useId();
  // The open state is held here, not in Radix, so that a disabled card can stay
  // shut and a provider can close this one when another opens. Radix still gets
  // a controlled `open`, which it handles as well as its own.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = (isControlled ? openProp : uncontrolledOpen) && !disabled;

  // Radix runs its own close timer after a trigger is left, even when the provider
  // has already closed this card, and reports that as a change again. Only a real
  // change is passed on.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const request = useCallback(
    (next: boolean) => {
      if (next && disabled) return;
      if (next === openRef.current) return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [disabled, isControlled, onOpenChange],
  );
  // The provider's `close` has to stay one function while this card is open.
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const controls = provider?.controls;
  useEffect(() => {
    if (!controls || !open) return;
    controls.reportOpen(id, () => requestRef.current(false));
    return () => controls.reportClosed(id);
  }, [controls, id, open]);

  // A card opens at once while the provider is warm: another is open, or one
  // closed a moment ago.
  const effectiveOpenDelay = provider?.isWarm ? 0 : (openDelay ?? provider?.openDelay ?? 300);
  const effectiveCloseDelay = closeDelay ?? provider?.closeDelay ?? 300;

  return (
    <HoverCardPrimitive.Root
      open={open}
      onOpenChange={request}
      openDelay={effectiveOpenDelay}
      closeDelay={effectiveCloseDelay}
    >
      {children}
    </HoverCardPrimitive.Root>
  );
}

/**
 * The element the card is a preview of. Renders a native `<a>` by default
 * (Radix's own element) — pass `asChild` to use this system's `Link`
 * instead. Give it an `href`: an `<a>` without one is not focusable, so the
 * card could not be opened from the keyboard.
 */
const HoverCardTrigger = forwardRef<HTMLAnchorElement, HoverCardTriggerProps>(
  ({ asChild = false, className, href, tabIndex, onTouchStart, onFocus, ...props }, ref) => {
    // `asChild` can't be checked: the child may already be focusable.
    const isUnreachable = !asChild && href === undefined && tabIndex === undefined;
    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !isUnreachable) return;
      console.warn(
        "HoverCard.Trigger: an <a> with no `href` or `tabIndex` can't be focused, so a keyboard user could never open the card. Pass an `href` (the card previews where it leads), or use `asChild` with a focusable element.",
      );
    }, [isUnreachable]);

    return (
      <HoverCardPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        href={href}
        tabIndex={tabIndex}
        onTouchStart={(event) => {
          onTouchStart?.(event);
          // Radix's trigger ends its own `onTouchStart` with `event.preventDefault()`,
          // but React listens for `touchstart` passively, so the browser ignores the
          // call and logs "Unable to preventDefault inside passive event listener" on
          // every touch (a tap still follows the link). Radix runs its handler only
          // while `event.defaultPrevented` is false, so marking the event handled
          // here skips it without ever calling `preventDefault()`. Nothing is lost:
          // the call never did anything, and a touch never opens a card.
          (event as { defaultPrevented: boolean }).defaultPrevented = true;
        }}
        onFocus={(event) => {
          onFocus?.(event);
          // Radix opens the card on any focus, and a click or a tap focuses a link too.
          // On a touch screen that is the one way left to open it (a tap that doesn't
          // navigate), and with a mouse it is only the focus the click leaves behind.
          // Only keyboard focus (`:focus-visible`) should open it, and Radix runs its
          // handler only while `event.defaultPrevented` is false (see `onTouchStart`).
          if (!isFocusVisible(event.currentTarget)) (event as { defaultPrevented: boolean }).defaultPrevented = true;
        }}
        {...props}
      />
    );
  },
);
HoverCardTrigger.displayName = "HoverCard.Trigger";

/**
 * The floating card itself — Radix renders it in a `Portal` appended to
 * `document.body` by default, outside the trigger's own tree. It has no
 * `role` and no accessible name: it is a preview, not a dialog.
 */
const HoverCardContent = forwardRef<HTMLDivElement, HoverCardContentProps>(
  (
    {
      side = "top",
      align = "center",
      sideOffset = 8,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      hideArrow = false,
      size = "md",
      container,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    // Radix's `side` drives a real positioning computation, not a CSS
    // cascade, so a responsive map has to resolve to one value in JS first.
    const resolvedSide = useResolvedResponsiveValue(side, "top");

    return (
      <HoverCardPrimitive.Portal container={container}>
        <HoverCardPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(styles.content, styles[size], className)}
          // The bridge across the gap (see `.content::before`) is exactly as long as the gap:
          // the offset, plus the arrow when there is one.
          style={{ "--hover-card-side-offset": `${sideOffset + (hideArrow ? 0 : ARROW_HEIGHT)}px`, ...style } as CSSProperties}
          {...props}
          dir={props.dir ?? providedDir}
        >
          <ButtonGroupReset>{children}</ButtonGroupReset>
          {!hideArrow && (
            <HoverCardPrimitive.Arrow asChild width={ARROW_WIDTH} height={ARROW_HEIGHT}>
              <OverlayArrow />
            </HoverCardPrimitive.Arrow>
          )}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    );
  },
);
HoverCardContent.displayName = "HoverCard.Content";

/**
 * An image or video at the top of the card, filling its width: it bleeds out
 * through the content's padding to the card's edges and takes the card's
 * rounded top corners. Put it first inside `HoverCard.Content`.
 */
const HoverCardMedia = forwardRef<HTMLDivElement, HoverCardMediaProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx(styles.media, className)} {...props} />
));
HoverCardMedia.displayName = "HoverCard.Media";

type HoverCardComponent = typeof HoverCardRoot & {
  Trigger: typeof HoverCardTrigger;
  Content: typeof HoverCardContent;
  Media: typeof HoverCardMedia;
};

export const HoverCard: HoverCardComponent = Object.assign(HoverCardRoot, {
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
  Media: HoverCardMedia,
});
