import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import type { Breakpoint, Responsive } from "@dbm-system/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Backdrop } from "../../atoms/Backdrop";
import { CloseButton } from "../../atoms/CloseButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { OverlayContentContext } from "../../internal/overlay/overlayContext";
import { useReturnFocus } from "../../internal/overlay/useReturnFocus";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import { OverlayBody, OverlayDescription, OverlayFooter, OverlayHeader, OverlayTitle } from "../../internal/overlay/OverlayParts";
import { useKeepMounted } from "../../internal/overlay/useKeepMounted";
import {
  describedByProps,
  overlayCloseButtonClassName,
  overlayPanelClassName,
  overlaySlotClassName,
  overlayTriggerClassName,
  useOverlayPanel,
} from "../../internal/overlay/useOverlayPanel";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import styles from "./Drawer.module.css";
import { DrawerSwipe } from "./DrawerSwipe";
import type {
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerLabels,
  DrawerOpenChangeReason,
  DrawerSide,
  DrawerProps,
  DrawerSize,
  DrawerTitleProps,
  DrawerTriggerProps,
} from "./Drawer.types";
import { useProvidedDirection } from "../../atoms/DirectionProvider/DirectionProvider";

const defaultLabels: DrawerLabels = { close: "Close" };

const sizeClass: Record<DrawerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One class per breakpoint and side, each setting every custom property the panel's geometry reads (see
// Drawer.module.css), so a responsive `side` is just several classes, applied mobile-first.
const sideClass: Record<Breakpoint, Record<DrawerSide, string | undefined>> = {
  base: { start: styles.sideStartBase, end: styles.sideEndBase, top: styles.sideTopBase, bottom: styles.sideBottomBase },
  sm: { start: styles.sideStartSm, end: styles.sideEndSm, top: styles.sideTopSm, bottom: styles.sideBottomSm },
  md: { start: styles.sideStartMd, end: styles.sideEndMd, top: styles.sideTopMd, bottom: styles.sideBottomMd },
  lg: { start: styles.sideStartLg, end: styles.sideEndLg, top: styles.sideTopLg, bottom: styles.sideBottomLg },
  xl: { start: styles.sideStartXl, end: styles.sideEndXl, top: styles.sideTopXl, bottom: styles.sideBottomXl },
  "2xl": {
    start: styles.sideStart2xl,
    end: styles.sideEnd2xl,
    top: styles.sideTop2xl,
    bottom: styles.sideBottom2xl,
  },
  "3xl": {
    start: styles.sideStart3xl,
    end: styles.sideEnd3xl,
    top: styles.sideTop3xl,
    bottom: styles.sideBottom3xl,
  },
};

function sideClasses(side: Responsive<DrawerSide>): string {
  if (typeof side === "string") return sideClass.base[side] ?? "";
  const classes: string[] = [];
  for (const breakpoint of Object.keys(side) as Breakpoint[]) {
    const value = side[breakpoint];
    const name = value === undefined ? undefined : sideClass[breakpoint]?.[value];
    if (name) classes.push(name);
  }
  return classes.join(" ");
}

interface DrawerContextValue {
  /** The drawer's current open state, held here so the scrim can follow it (see `DrawerContent`). */
  open: boolean;
  modal: boolean;
  /** Told when the drawer has finished opening and when it has finished closing. */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  /** Records what is about to close or open the drawer, for `onOpenChange`'s second argument. */
  setReason: (reason: DrawerOpenChangeReason) => void;
  /** Closes the drawer from inside it (a swipe), reporting `reason`. */
  close: (reason: DrawerOpenChangeReason) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

/** Whether a touch can take hold of the panel's header and handle: the swipe is on and the drawer isn't busy. */
const DrawerGestureContext = createContext(false);

/**
 * A panel attached to one edge of the viewport that slides in over the page, for work that belongs beside the
 * page and not in a window over it: a set of filters, a settings or detail panel, a navigation menu on a phone, a
 * form that doesn't deserve a dialog. Built on Radix Dialog, so by default it is **modal**: the page behind is
 * dimmed by a scrim, can't be scrolled, clicked or reached with the keyboard, and focus is held inside until the
 * drawer closes, when it returns to whatever opened it. (`modal={false}` makes a docked panel that leaves the page
 * usable.)
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Drawer.Trigger`,
 * `Drawer.Content`, and inside it `Drawer.Header` (holding `Drawer.Title` and `Drawer.Description`),
 * `Drawer.Body` (which scrolls while the header and footer stay put), `Drawer.Footer`, and `Drawer.Close`.
 *
 * `Drawer` itself renders no DOM element of its own: a plain context provider around its sub-parts, matching
 * Radix's `Dialog.Root`, so it takes no `ref`/`className`/`style`/`id`/`data-testid` of its own; those apply to the
 * sub-parts instead, each of which forwards its own ref.
 *
 * Give every drawer a `Drawer.Title`: it names the drawer for screen readers (wrap it in `VisuallyHidden` if the
 * design has no visible heading). Radix reports a missing one in development.
 *
 * Does not cover a window for a form or a detail view (`Dialog`), an alert that needs an explicit answer
 * (`AlertDialog`), a confirmation (`ConfirmDialog`), or a persistent navigation column (`Sidebar`, which uses this
 * one for its phone layout).
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <Drawer.Trigger asChild>
 *     <Button>Filters</Button>
 *   </Drawer.Trigger>
 *   <Drawer.Content side="end">
 *     <Drawer.Header>
 *       <Drawer.Title>Filters</Drawer.Title>
 *       <Drawer.Description>Narrow the list.</Drawer.Description>
 *     </Drawer.Header>
 *     <Drawer.Body>
 *       <Checkbox>In stock</Checkbox>
 *     </Drawer.Body>
 *     <Drawer.Footer>
 *       <Drawer.Close asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </Drawer.Close>
 *       <Button>Apply</Button>
 *     </Drawer.Footer>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
function DrawerRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
}: DrawerProps) {
  // The open state is kept here, not left to Radix, because the scrim (`Backdrop`) draws its own fade from an
  // `open` prop and a scrim that isn't told the drawer is closing would vanish with no fade-out.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  // What is about to change the state is noted by the part that was pressed (the trigger, Escape, the scrim, a
  // close element) just before Radix calls `onOpenChange`, which on its own doesn't say.
  const reasonRef = useRef<DrawerOpenChangeReason | null>(null);
  const setReason = useCallback((reason: DrawerOpenChangeReason) => {
    reasonRef.current = reason;
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      const reason = reasonRef.current ?? (next ? "trigger" : "close");
      reasonRef.current = null;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, { reason });
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback(
    (reason: DrawerOpenChangeReason) => {
      reasonRef.current = reason;
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  const value = useMemo(
    () => ({ open, modal, onOpenChangeComplete, setReason, close }),
    [open, modal, onOpenChangeComplete, setReason, close],
  );

  return (
    <DrawerContext.Provider value={value}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={modal}>
        {children}
      </DialogPrimitive.Root>
    </DrawerContext.Provider>
  );
}

/**
 * The element that opens the drawer on click. Renders an unstyled native `<button>` by default — pass `asChild`
 * to use one of this system's own interactive components (`Button`, `IconButton`) instead.
 */
const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ asChild = false, className, onClick, ...props }, ref) => {
    const drawer = useContext(DrawerContext);
    return (
      <DialogPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(overlayTriggerClassName, className)}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) drawer?.setReason("trigger");
        }}
      />
    );
  },
);
DrawerTrigger.displayName = "Drawer.Trigger";

/**
 * The drawer panel itself, with its scrim. Radix renders it in a portal appended to `document.body` by default,
 * outside the trigger's own tree. A press on the scrim, Escape and the built-in close button all close it; see
 * `closeOnOutsideClick` and `closeOnEscape` to take any of them away.
 */
const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  (
    {
      size = "md",
      side = "end",
      swipeToDismiss = true,
      showHandle = true,
      divided = "auto",
      busy = false,
      keepMounted = false,
      initialFocus,
      scrimOpacity,
      scrimBlur = false,
      showCloseButton = true,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      labels: labelOverrides,
      container,
      className,
      style,
      children,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onInteractOutside,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const drawer = useContext(DrawerContext);
    const open = drawer?.open ?? true;
    const modal = drawer?.modal ?? true;
    const labels: DrawerLabels = mergeDefined(defaultLabels, labelOverrides);

    const { contentContext, titleCount, descriptionCount, edges } = useOverlayPanel({ divided, busy });
    const returnFocus = useReturnFocus();
    const { host, portalContent, attachHost } = useKeepMounted({ keepMounted, open });
    const describedBy = describedByProps(ariaDescribedBy, descriptionCount);
    const panelRef = useRef<HTMLDivElement | null>(null);

    // A step of the scale is a class; anything else is a length the panel reads through its own custom property.
    const isStep = typeof size === "string" && Object.prototype.hasOwnProperty.call(sizeClass, size);
    const customSize = isStep ? undefined : typeof size === "number" ? `${size}px` : size;
    const sizeWarned = useRef(false);
    useEffect(() => {
      if (
        process.env.NODE_ENV !== "production" &&
        customSize !== undefined &&
        !sizeWarned.current &&
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        !CSS.supports("width", customSize)
      ) {
        sizeWarned.current = true;
        console.warn(
          `Drawer: \`size\` is "${customSize}", which is neither a step (xs, sm, md, lg, xl) nor a CSS length, so the drawer keeps its default size.`,
        );
      }
    }, [customSize]);

    const swipeable = swipeToDismiss && !busy;
    const inner = (
      <DrawerGestureContext.Provider value={swipeable}>
        <OverlayContentContext.Provider value={contentContext}>
          <ButtonGroupReset>{children}</ButtonGroupReset>
        </OverlayContentContext.Provider>
      </DrawerGestureContext.Provider>
    );

    const content = (
      <DialogPrimitive.Content
        ref={mergeRefs(ref, attachHost, panelRef)}
        {...props}
        dir={props.dir ?? providedDir}
        {...describedBy}
        aria-label={ariaLabel}
        // The attributes below are computed from the drawer's own state, so they come after `{...props}`: a
        // same-named consumer prop must not replace the role or the state the exit animation is keyed to.
        role="dialog"
        data-state={open ? "open" : "closed"}
        aria-modal={modal ? true : undefined}
        aria-busy={busy || undefined}
        style={customSize === undefined ? style : { ["--drawer-size" as string]: customSize, ...style }}
        data-overflow-start={edges.start || undefined}
        data-overflow-end={edges.end || undefined}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          returnFocus.restore(event);
        }}
        onOpenAutoFocus={(event) => {
          returnFocus.remember();
          onOpenAutoFocus?.(event);
          const target = initialFocus?.current;
          if (!event.defaultPrevented && target) {
            event.preventDefault();
            target.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!closeOnEscape || busy) event.preventDefault();
          if (!event.defaultPrevented) drawer?.setReason("escape");
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          if (!closeOnOutsideClick || busy) event.preventDefault();
          if (!event.defaultPrevented) drawer?.setReason("outside");
        }}
        className={cx(
          styles.content,
          isStep ? sizeClass[size as DrawerSize] : undefined,
          sideClasses(side),
          overlayPanelClassName({ divided, showCloseButton }),
          !modal && styles.nonModal,
          className,
        )}
      >
        <OverlayLifecycle open={open} panelRef={panelRef} onOpenChangeComplete={drawer?.onOpenChangeComplete} />
        <DrawerSwipe
          panelRef={panelRef}
          enabled={swipeable}
          onDismiss={() => drawer?.close("swipe")}
        />
        {showHandle && (
          <span
            aria-hidden="true"
            className={styles.handle}
            data-drawer-handle=""
            {...(swipeable ? { "data-drawer-grab": "", "data-swipeable": "" } : {})}
          />
        )}
        {ariaLabel && titleCount === 0 && (
          <DialogPrimitive.Title asChild>
            <VisuallyHidden>{ariaLabel}</VisuallyHidden>
          </DialogPrimitive.Title>
        )}
        {!keepMounted && <div className={overlaySlotClassName}>{inner}</div>}
        {showCloseButton && (
          // After the content in the DOM, so Tab reaches the drawer's own controls first. It is placed in the
          // corner by CSS, not by order.
          <DialogPrimitive.Close asChild>
            <CloseButton
              size="sm"
              aria-label={labels.close}
              className={overlayCloseButtonClassName}
              {...(busy ? { "aria-disabled": true } : {})}
              onClick={(event) => {
                // A busy drawer can't be left: stopping the event is what stops Radix closing it. The button
                // stays in the tab order, so focus on it isn't lost when `busy` turns on.
                if (busy) event.preventDefault();
                else drawer?.setReason("close-button");
              }}
            />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    );

    return (
      <>
        {portalContent && host ? createPortal(inner, host) : null}
        <DialogPrimitive.Portal container={container}>
          {modal ? (
            <DialogPrimitive.Overlay asChild>
              <Backdrop inPortal={false} open={open} opacity={scrimOpacity} blur={scrimBlur}>
                {content}
              </Backdrop>
            </DialogPrimitive.Overlay>
          ) : (
            content
          )}
        </DialogPrimitive.Portal>
      </>
    );
  },
);
DrawerContent.displayName = "Drawer.Content";

/** The top section of the drawer: usually a `Drawer.Title` and optionally a `Drawer.Description`. */
const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>((props, ref) => {
  // The header is where a touch can take hold of the panel to swipe it away (see `swipeToDismiss`), and says so only
  // while the gesture is available.
  const grabbable = useContext(DrawerGestureContext);
  return <OverlayHeader ref={ref} {...props} {...(grabbable ? { "data-drawer-grab": "" } : {})} />;
});
DrawerHeader.displayName = "Drawer.Header";

/**
 * The drawer's name, announced when it opens, rendered as a heading. Every drawer should have one; use
 * `VisuallyHidden` around it when the design shows no heading.
 */
const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>((props, ref) => (
  <OverlayTitle ref={ref} {...props} />
));
DrawerTitle.displayName = "Drawer.Title";

/** A sentence or two on what the drawer is for, read out after its title when it opens. */
const DrawerDescription = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>((props, ref) => (
  <OverlayDescription ref={ref} {...props} />
));
DrawerDescription.displayName = "Drawer.Description";

/**
 * The main content, a scroll region that takes whatever height is left between the header and the footer, so
 * long content scrolls inside the drawer while they stay in view.
 */
const DrawerBody = forwardRef<HTMLDivElement, DrawerBodyProps>((props, ref) => <OverlayBody ref={ref} {...props} />);
DrawerBody.displayName = "Drawer.Body";

/** The bottom section of the drawer: its actions, usually `Button`s. */
const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>((props, ref) => (
  <OverlayFooter ref={ref} {...props} />
));
DrawerFooter.displayName = "Drawer.Footer";

/** An element that closes the drawer on click, placed anywhere inside `Drawer.Content`. */
const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ asChild = false, className, onClick, ...props }, ref) => {
    const drawer = useContext(DrawerContext);
    const busy = useContext(OverlayContentContext)?.busy ?? false;
    return (
      <DialogPrimitive.Close
        ref={ref}
        asChild={asChild}
        className={className}
        {...props}
        {...(busy ? { "aria-disabled": true } : {})}
        onClick={(event) => {
          onClick?.(event);
          // A busy drawer can't be left: stopping the event here is what stops Radix closing it.
          if (busy) event.preventDefault();
          else if (!event.defaultPrevented) drawer?.setReason("close");
        }}
      />
    );
  },
);
DrawerClose.displayName = "Drawer.Close";

type DrawerComponent = typeof DrawerRoot & {
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Header: typeof DrawerHeader;
  Title: typeof DrawerTitle;
  Description: typeof DrawerDescription;
  Body: typeof DrawerBody;
  Footer: typeof DrawerFooter;
  Close: typeof DrawerClose;
};

export const Drawer: DrawerComponent = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
});
