import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import type { Breakpoint, Responsive } from "@dbm-system/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createContext, forwardRef, useCallback, useContext, useMemo, useRef, useState } from "react";
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
import styles from "./Dialog.module.css";
import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogLabels,
  DialogOpenChangeReason,
  DialogPlacement,
  DialogProps,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
} from "./Dialog.types";
import { useProvidedDirection } from "../../atoms/DirectionProvider/DirectionProvider";

const defaultLabels: DialogLabels = { close: "Close" };

const sizeClass: Record<DialogSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One class per breakpoint and value, each setting the custom properties the panel's layout reads (see
// Dialog.module.css), so a responsive `fullScreen` is just several classes, applied mobile-first.
const fullScreenClass: Record<Breakpoint, Record<"true" | "false", string | undefined>> = {
  base: { true: styles.fullBase, false: undefined },
  sm: { true: styles.fullSm, false: styles.windowedSm },
  md: { true: styles.fullMd, false: styles.windowedMd },
  lg: { true: styles.fullLg, false: styles.windowedLg },
  xl: { true: styles.fullXl, false: styles.windowedXl },
  "2xl": { true: styles.full2xl, false: styles.windowed2xl },
  "3xl": { true: styles.full3xl, false: styles.windowed3xl },
};

function fullScreenClasses(fullScreen: Responsive<boolean>): string {
  if (typeof fullScreen === "boolean") return fullScreenClass.base[String(fullScreen) as "true" | "false"] ?? "";
  const classes: string[] = [];
  for (const breakpoint of Object.keys(fullScreen) as Breakpoint[]) {
    const value = fullScreen[breakpoint];
    const name = value === undefined ? undefined : fullScreenClass[breakpoint]?.[String(value) as "true" | "false"];
    if (name) classes.push(name);
  }
  return classes.join(" ");
}

const placementClass: Record<DialogPlacement, string | undefined> = {
  center: undefined,
  top: styles.placementTop,
};

interface DialogContextValue {
  /** The dialog's current open state, held here so the scrim can follow it (see `DialogContent`). */
  open: boolean;
  modal: boolean;
  /** Told when the dialog has finished opening and when it has finished closing. */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  /** Records what is about to close or open the dialog, for `onOpenChange`'s second argument. */
  setReason: (reason: DialogOpenChangeReason) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * A window that interrupts the page for focused work — a form, a detail view, a confirmation — built on Radix
 * Dialog. By default it is **modal**: the page behind is dimmed by a scrim, can't be scrolled, clicked or reached
 * with the keyboard, and focus is held inside until the dialog closes, when it returns to whatever opened it.
 * (`modal={false}` makes a docked panel that leaves the page usable.) Some libraries call this component a "modal".
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Dialog.Trigger`,
 * `Dialog.Content`, and inside it `Dialog.Header` (holding `Dialog.Title` and `Dialog.Description`),
 * `Dialog.Body` (which scrolls while the header and footer stay put), `Dialog.Footer`, and `Dialog.Close`.
 *
 * `Dialog` itself renders no DOM element of its own — a plain context provider around its sub-parts, matching
 * Radix's `Dialog.Root` — so it takes no `ref`/`className`/`style`/`id`/`data-testid` of its own; those apply to
 * the sub-parts instead, each of which forwards its own ref.
 *
 * Give every dialog a `Dialog.Title`: it names the dialog for screen readers (wrap it in `VisuallyHidden` if the
 * design has no visible heading). Radix reports a missing one in development.
 *
 * Does not cover an alert that needs an explicit answer (`AlertDialog`), a side panel (`Drawer`) or a
 * confirm-and-continue pattern (`ConfirmDialog`) — those are separate components.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <Dialog.Trigger asChild>
 *     <Button>Edit profile</Button>
 *   </Dialog.Trigger>
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Edit profile</Dialog.Title>
 *       <Dialog.Description>Changes are saved to your account.</Dialog.Description>
 *     </Dialog.Header>
 *     <Dialog.Body>
 *       <Input aria-label="Name" />
 *     </Dialog.Body>
 *     <Dialog.Footer>
 *       <Dialog.Close asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </Dialog.Close>
 *       <Button>Save</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
function DialogRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
}: DialogProps) {
  // The open state is kept here, not left to Radix, because the scrim (`Backdrop`) draws its own fade from an
  // `open` prop and a scrim that isn't told the dialog is closing would vanish with no fade-out.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  // What is about to change the state is noted by the part that was pressed (the trigger, Escape, the scrim, a
  // close element) just before Radix calls `onOpenChange`, which on its own doesn't say.
  const reasonRef = useRef<DialogOpenChangeReason | null>(null);
  const setReason = useCallback((reason: DialogOpenChangeReason) => {
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

  const value = useMemo(
    () => ({ open, modal, onOpenChangeComplete, setReason }),
    [open, modal, onOpenChangeComplete, setReason],
  );

  return (
    <DialogContext.Provider value={value}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={modal}>
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

/**
 * The element that opens the dialog on click. Renders an unstyled native `<button>` by default — pass `asChild`
 * to use one of this system's own interactive components (`Button`, `IconButton`) instead.
 */
const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, className, onClick, ...props }, ref) => {
    const dialog = useContext(DialogContext);
    return (
      <DialogPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(overlayTriggerClassName, className)}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) dialog?.setReason("trigger");
        }}
      />
    );
  },
);
DialogTrigger.displayName = "Dialog.Trigger";

/**
 * The dialog panel itself, with its scrim. Radix renders it in a portal appended to `document.body` by default,
 * outside the trigger's own tree. A press on the scrim, Escape and the built-in close button all close it; see
 * `closeOnOutsideClick` and `closeOnEscape` to take any of them away.
 */
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      size = "md",
      fullScreen = false,
      divided = "auto",
      placement = "center",
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
    const dialog = useContext(DialogContext);
    const open = dialog?.open ?? true;
    const modal = dialog?.modal ?? true;
    const labels: DialogLabels = mergeDefined(defaultLabels, labelOverrides);

    const { contentContext, titleCount, descriptionCount, edges } = useOverlayPanel({ divided, busy });
    const returnFocus = useReturnFocus();
    const { host, portalContent, attachHost } = useKeepMounted({ keepMounted, open });
    const describedBy = describedByProps(ariaDescribedBy, descriptionCount);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const inner = (
      <OverlayContentContext.Provider value={contentContext}>
        <ButtonGroupReset>{children}</ButtonGroupReset>
      </OverlayContentContext.Provider>
    );

    const content = (
      <DialogPrimitive.Content
        ref={mergeRefs(ref, attachHost, panelRef)}
        {...props}
        dir={props.dir ?? providedDir}
        {...describedBy}
        aria-label={ariaLabel}
        // The attributes below are computed from the dialog's own state, so they come after `{...props}`: a
        // same-named consumer prop must not replace the role or the state the exit animation is keyed to.
        role="dialog"
        data-state={open ? "open" : "closed"}
        aria-modal={modal ? true : undefined}
        aria-busy={busy || undefined}
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
          if (!event.defaultPrevented) dialog?.setReason("escape");
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          if (!closeOnOutsideClick || busy) event.preventDefault();
          if (!event.defaultPrevented) dialog?.setReason("outside");
        }}
        className={cx(
          styles.content,
          sizeClass[size],
          fullScreenClasses(fullScreen),
          placementClass[placement],
          overlayPanelClassName({ divided, showCloseButton }),
          !modal && styles.nonModal,
          className,
        )}
      >
        <OverlayLifecycle open={open} panelRef={panelRef} onOpenChangeComplete={dialog?.onOpenChangeComplete} />
        {ariaLabel && titleCount === 0 && (
          <DialogPrimitive.Title asChild>
            <VisuallyHidden>{ariaLabel}</VisuallyHidden>
          </DialogPrimitive.Title>
        )}
        {!keepMounted && <div className={overlaySlotClassName}>{inner}</div>}
        {showCloseButton && (
          // After the content in the DOM, so Tab reaches the dialog's own controls first. It is placed in the
          // corner by CSS, not by order.
          <DialogPrimitive.Close asChild>
            <CloseButton
              size="sm"
              aria-label={labels.close}
              className={overlayCloseButtonClassName}
              {...(busy ? { "aria-disabled": true } : {})}
              onClick={(event) => {
                // A busy dialog can't be left: stopping the event is what stops Radix closing it. The button
                // stays in the tab order, so focus on it isn't lost when `busy` turns on.
                if (busy) event.preventDefault();
                else dialog?.setReason("close-button");
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
DialogContent.displayName = "Dialog.Content";

/** The top section of the dialog: usually a `Dialog.Title` and optionally a `Dialog.Description`. */
const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>((props, ref) => <OverlayHeader ref={ref} {...props} />);
DialogHeader.displayName = "Dialog.Header";

/**
 * The dialog's name, announced when it opens, rendered as a heading. Every dialog should have one; use
 * `VisuallyHidden` around it when the design shows no heading.
 */
const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>((props, ref) => (
  <OverlayTitle ref={ref} {...props} />
));
DialogTitle.displayName = "Dialog.Title";

/** A sentence or two on what the dialog is for, read out after its title when it opens. */
const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>((props, ref) => (
  <OverlayDescription ref={ref} {...props} />
));
DialogDescription.displayName = "Dialog.Description";

/**
 * The main content, a scroll region that takes whatever height is left between the header and the footer, so
 * long content scrolls inside the dialog while they stay in view.
 */
const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>((props, ref) => <OverlayBody ref={ref} {...props} />);
DialogBody.displayName = "Dialog.Body";

/** The bottom section of the dialog: its actions, usually `Button`s. */
const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>((props, ref) => (
  <OverlayFooter ref={ref} {...props} />
));
DialogFooter.displayName = "Dialog.Footer";

/** An element that closes the dialog on click, placed anywhere inside `Dialog.Content`. */
const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, className, onClick, ...props }, ref) => {
    const dialog = useContext(DialogContext);
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
          // A busy dialog can't be left: stopping the event here is what stops Radix closing it.
          if (busy) event.preventDefault();
          else if (!event.defaultPrevented) dialog?.setReason("close");
        }}
      />
    );
  },
);
DialogClose.displayName = "Dialog.Close";

type DialogComponent = typeof DialogRoot & {
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Close: typeof DialogClose;
};

export const Dialog: DialogComponent = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
});
