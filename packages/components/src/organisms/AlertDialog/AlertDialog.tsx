import {
  InfoIcon,
  NoteIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@dbm-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { cx, mergeRefs } from "@dbm-system/utils";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Icon } from "../../atoms/Icon";
import type { IconTone } from "../../atoms/Icon/Icon.types";
import { Text } from "../../atoms/Text";
import { useReturnFocus } from "../../internal/overlay/useReturnFocus";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import { OverlayBody, OverlayFooter } from "../../internal/overlay/OverlayParts";
import dialogStyles from "../Dialog/Dialog.module.css";
import sections from "../../internal/overlay/OverlaySections.module.css";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import styles from "./AlertDialog.module.css";
import type {
  AlertDialogActionProps,
  AlertDialogBodyProps,
  AlertDialogCancelProps,
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogFooterProps,
  AlertDialogHeaderProps,
  AlertDialogOpenChangeReason,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTone,
  AlertDialogTriggerProps,
} from "./AlertDialog.types";
import { useProvidedDirection } from "../../internal/useProvidedDirection";

// The panel and its sections are drawn with `Dialog`'s stylesheet: the two must look the same and change
// together, as `RangeSlider` draws with `Slider`'s. This file's own module holds only what an alert adds (the tone
// medallion, the stacked footer).
const sizeClass = {
  xs: dialogStyles.sizeXs,
  sm: undefined,
  md: undefined,
  lg: dialogStyles.sizeLg,
} as const;

// Every tone has an icon, as `Alert`'s do (its neutral one is the same note); `icon={false}` removes it.
const toneIcon: Record<AlertDialogTone, PhosphorIcon> = {
  neutral: NoteIcon,
  info: InfoIcon,
  warning: WarningIcon,
  danger: WarningOctagonIcon,
};

const toneIconColour: Record<AlertDialogTone, IconTone> = {
  neutral: "default",
  info: "info",
  warning: "warning",
  danger: "danger",
};

const toneClass: Record<AlertDialogTone, string | undefined> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

interface AlertDialogContextValue {
  open: boolean;
  /** Told when the alert has finished opening and when it has finished closing. */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  /** Records what is about to close or open the dialog, for `onOpenChange`'s second argument. */
  setReason: (reason: AlertDialogOpenChangeReason, value?: string) => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

interface AlertDialogContentContextValue {
  tone: AlertDialogTone;
  icon: PhosphorIcon | false | undefined;
  busy: boolean;
}

const AlertDialogContentContext = createContext<AlertDialogContentContextValue | null>(null);

/**
 * Marks a button `aria-disabled` while the alert is busy, so it dims and is announced as unavailable yet stays in
 * the tab order (focus isn't dropped from it). `Button` computes `aria-disabled` itself, after the props it is
 * given, and for a native button only ever as the native `disabled` attribute, which would take it out of the tab
 * order; so the attribute is set on the element instead.
 */
function useBusyAttribute(ref: RefObject<HTMLButtonElement | null>, busy: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (busy) element.setAttribute("aria-disabled", "true");
    else element.removeAttribute("aria-disabled");
  }, [ref, busy]);
}

/**
 * A modal that interrupts for something that has to be answered: a destructive action to confirm, an error to
 * acknowledge, a decision that can't be left half made. It is `role="alertdialog"`: the page behind is dimmed,
 * locked and inert as for a `Dialog`, but a press on the scrim does nothing, there is no corner close button,
 * and focus starts on the safest choice (`AlertDialog.Cancel`, or `AlertDialog.Action` when there is none).
 *
 * A compound component: `AlertDialog.Trigger`, then `AlertDialog.Content` holding `Header` (with a `Title` and a
 * `Description`, both of which an alert needs), an optional `Body`, and a `Footer` with `Cancel` and `Action`.
 * `AlertDialog` itself renders no DOM element, so it takes no `ref`, `className`, `style`, `id` or
 * `data-testid`; those apply to the sub-parts, each of which forwards its own ref.
 *
 * Not a general-purpose window (that is `Dialog`) and not the prop-driven confirmation pattern (`ConfirmDialog`,
 * built on this).
 *
 * @example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialog.Trigger asChild>
 *     <Button variant="destructive">Delete project</Button>
 *   </AlertDialog.Trigger>
 *   <AlertDialog.Content tone="danger">
 *     <AlertDialog.Header>
 *       <AlertDialog.Title>Delete project?</AlertDialog.Title>
 *       <AlertDialog.Description>This removes it and all of its files for good.</AlertDialog.Description>
 *     </AlertDialog.Header>
 *     <AlertDialog.Footer>
 *       <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
 *       <AlertDialog.Action>Delete</AlertDialog.Action>
 *     </AlertDialog.Footer>
 *   </AlertDialog.Content>
 * </AlertDialog>
 * ```
 */
function AlertDialogRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
}: AlertDialogProps) {
  // The open state is held here so the scrim (`Backdrop`) can draw its own fade from it, as in `Dialog`.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const reasonRef = useRef<{ reason: AlertDialogOpenChangeReason; value?: string } | null>(null);
  const setReason = useCallback((reason: AlertDialogOpenChangeReason, value?: string) => {
    reasonRef.current = { reason, value };
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      const noted = reasonRef.current ?? { reason: next ? ("trigger" as const) : ("cancel" as const) };
      reasonRef.current = null;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, noted.value === undefined ? { reason: noted.reason } : noted);
    },
    [isControlled, onOpenChange],
  );

  const value = useMemo(
    () => ({ open, onOpenChangeComplete, setReason }),
    [open, onOpenChangeComplete, setReason],
  );

  return (
    <AlertDialogContext.Provider value={value}>
      <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {children}
      </AlertDialogPrimitive.Root>
    </AlertDialogContext.Provider>
  );
}

/** The element that opens the alert on click. Unstyled by default; pass `asChild` to use a `Button`. */
const AlertDialogTrigger = forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ asChild = false, className, onClick, ...props }, ref) => {
    const dialog = useContext(AlertDialogContext);
    return (
      <AlertDialogPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(sections.trigger, className)}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) dialog?.setReason("trigger");
        }}
      />
    );
  },
);
AlertDialogTrigger.displayName = "AlertDialog.Trigger";

/**
 * The alert panel with its scrim, portaled to `document.body` by default. Escape answers it as a cancel; a
 * press on the scrim does nothing.
 */
const AlertDialogContent = forwardRef<HTMLDivElement, AlertDialogContentProps>(
  (
    {
      tone = "neutral",
      icon,
      size = "sm",
      busy = false,
      closeOnEscape = true,
      nudge = true,
      initialFocus,
      scrimOpacity,
      scrimBlur = false,
      container,
      className,
      children,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const dialog = useContext(AlertDialogContext);
    const open = dialog?.open ?? true;
    const contentRef = useRef<HTMLDivElement | null>(null);
    const returnFocus = useReturnFocus();
    // A pulse when something tries to dismiss the alert and can't. Two identical animations under two names:
    // switching the class restarts it even when it is pressed again before the last pulse has finished.
    const [pulses, setPulses] = useState(0);
    // The component stays mounted while the alert is closed, so the class would still be on the panel when it
    // reopens and its pulse would replace the entrance. Back to none once it has closed.
    if (!open && pulses !== 0) setPulses(0);
    const pulse = useCallback(() => {
      if (nudge) setPulses((count) => count + 1);
    }, [nudge]);
    const context = useMemo(() => ({ tone, icon, busy }), [tone, icon, busy]);

    const content = (
      <AlertDialogPrimitive.Content
        ref={mergeRefs(ref, contentRef)}
        {...props}
        dir={props.dir ?? providedDir}
        // Computed from the dialog's own state, so after `{...props}`: a same-named consumer prop must not
        // replace the role or the state the exit animation is keyed to.
        role="alertdialog"
        data-state={open ? "open" : "closed"}
        aria-modal
        aria-busy={busy || undefined}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          returnFocus.restore(event);
        }}
        onOpenAutoFocus={(event) => {
          returnFocus.remember();
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          const root = contentRef.current;
          const target =
            initialFocus?.current ??
            // Radix focuses the Cancel. With none, the Action is the next safest thing to land on.
            (root?.querySelector("[data-alert-dialog-cancel]")
              ? null
              : root?.querySelector<HTMLElement>("[data-alert-dialog-action]"));
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!closeOnEscape || busy) event.preventDefault();
          if (event.defaultPrevented) pulse();
          else dialog?.setReason("escape");
        }}
        className={cx(
          dialogStyles.content,
          styles.root,
          sizeClass[size],
          toneClass[tone],
          pulses > 0 && (pulses % 2 === 1 ? styles.nudgeA : styles.nudgeB),
          className,
        )}
      >
        <OverlayLifecycle open={open} panelRef={contentRef} onOpenChangeComplete={dialog?.onOpenChangeComplete} />
        <AlertDialogContentContext.Provider value={context}>
          <div className={sections.slot}>
            <ButtonGroupReset>{children}</ButtonGroupReset>
          </div>
        </AlertDialogContentContext.Provider>
      </AlertDialogPrimitive.Content>
    );

    return (
      <AlertDialogPrimitive.Portal container={container}>
        <AlertDialogPrimitive.Overlay asChild>
          <Backdrop
            inPortal={false}
            open={open}
            opacity={scrimOpacity}
            blur={scrimBlur}
            // Radix keeps an alert from being dismissed by a press outside and gives no hook for one, so the
            // press is read on the scrim itself (not on the panel, which is its child).
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) pulse();
            }}
          >
            {content}
          </Backdrop>
        </AlertDialogPrimitive.Overlay>
      </AlertDialogPrimitive.Portal>
    );
  },
);
AlertDialogContent.displayName = "AlertDialog.Content";

/** The top section: the tone's icon beside a `Title` and a `Description`. */
const AlertDialogHeader = forwardRef<HTMLDivElement, AlertDialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const context = useContext(AlertDialogContentContext);
    const tone = context?.tone ?? "neutral";
    const glyph = context?.icon === false ? undefined : (context?.icon ?? toneIcon[tone]);
    return (
      <div
        ref={ref}
        className={cx(sections.header, glyph && styles.withMedallion, className)}
        {...props}
      >
        {glyph && (
          <span className={styles.medallion} aria-hidden="true">
            <Icon icon={glyph} size="md" tone={toneIconColour[tone]} />
          </span>
        )}
        {glyph ? <div className={styles.headerText}>{children}</div> : children}
      </div>
    );
  },
);
AlertDialogHeader.displayName = "AlertDialog.Header";

/** The alert's question or statement, rendered as a heading. It names the dialog. */
const AlertDialogTitle = forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ level = 2, size = "xl", className, children, ...props }, ref) => (
    <AlertDialogPrimitive.Title asChild>
      <Heading ref={ref} level={level} size={size} className={cx(sections.title, className)} {...props}>
        {children}
      </Heading>
    </AlertDialogPrimitive.Title>
  ),
);
AlertDialogTitle.displayName = "AlertDialog.Title";

/** What the choice will do, and what can't be undone. Read out after the title when the alert opens. */
const AlertDialogDescription = forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <AlertDialogPrimitive.Description asChild>
      <Text ref={ref} size="base" className={cx(sections.description, className)} {...props}>
        {children}
      </Text>
    </AlertDialogPrimitive.Description>
  ),
);
AlertDialogDescription.displayName = "AlertDialog.Description";

/** Content between the header and the footer: a list of what is affected, say. It scrolls on its own. */
const AlertDialogBody = forwardRef<HTMLDivElement, AlertDialogBodyProps>((props, ref) => (
  <OverlayBody ref={ref} {...props} />
));
AlertDialogBody.displayName = "AlertDialog.Body";

/** The bottom section holding `Cancel` and `Action`; below `sm` its buttons stack full width, Action on top. */
const AlertDialogFooter = forwardRef<HTMLDivElement, AlertDialogFooterProps>(({ className, ...props }, ref) => (
  <OverlayFooter ref={ref} className={cx(styles.footer, className)} {...props} />
));
AlertDialogFooter.displayName = "AlertDialog.Footer";

/**
 * The choice the alert exists to ask for. Closes the alert after `onClick` unless that calls
 * `event.preventDefault()`. Its look follows the content's `tone` (`danger` is destructive); `variant` overrides.
 */
const AlertDialogAction = forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ variant, value, onClick, children, ...props }, ref) => {
    const dialog = useContext(AlertDialogContext);
    const context = useContext(AlertDialogContentContext);
    const busy = context?.busy ?? false;
    const resolved = variant ?? (context?.tone === "danger" ? "destructive" : "primary");
    const elementRef = useRef<HTMLButtonElement | null>(null);
    useBusyAttribute(elementRef, busy);
    return (
      <AlertDialogPrimitive.Action asChild>
        <Button
          ref={mergeRefs(ref, elementRef)}
          variant={resolved}
          {...props}
          data-alert-dialog-action=""
          onClick={(event) => {
            // A busy alert can't be answered again: the press does nothing, so the caller's handler isn't run for
            // it, and stopping the event is what stops Radix closing the alert.
            if (busy) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
            if (!event.defaultPrevented) dialog?.setReason("action", value);
          }}
        >
          {children}
        </Button>
      </AlertDialogPrimitive.Action>
    );
  },
);
AlertDialogAction.displayName = "AlertDialog.Action";

/** The safe way out. It takes focus when the alert opens, and closes the alert as a cancel. */
const AlertDialogCancel = forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ variant = "secondary", value, onClick, children, ...props }, ref) => {
    const dialog = useContext(AlertDialogContext);
    const busy = useContext(AlertDialogContentContext)?.busy ?? false;
    const elementRef = useRef<HTMLButtonElement | null>(null);
    useBusyAttribute(elementRef, busy);
    return (
      <AlertDialogPrimitive.Cancel asChild>
        <Button
          ref={mergeRefs(ref, elementRef)}
          variant={variant}
          {...props}
          data-alert-dialog-cancel=""
          onClick={(event) => {
            // As for the Action: a busy alert's Cancel does nothing, and the caller's handler isn't run.
            if (busy) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
            if (!event.defaultPrevented) dialog?.setReason("cancel", value);
          }}
        >
          {children}
        </Button>
      </AlertDialogPrimitive.Cancel>
    );
  },
);
AlertDialogCancel.displayName = "AlertDialog.Cancel";

type AlertDialogComponent = typeof AlertDialogRoot & {
  Trigger: typeof AlertDialogTrigger;
  Content: typeof AlertDialogContent;
  Header: typeof AlertDialogHeader;
  Title: typeof AlertDialogTitle;
  Description: typeof AlertDialogDescription;
  Body: typeof AlertDialogBody;
  Footer: typeof AlertDialogFooter;
  Action: typeof AlertDialogAction;
  Cancel: typeof AlertDialogCancel;
};

export const AlertDialog: AlertDialogComponent = Object.assign(AlertDialogRoot, {
  Trigger: AlertDialogTrigger,
  Content: AlertDialogContent,
  Header: AlertDialogHeader,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Body: AlertDialogBody,
  Footer: AlertDialogFooter,
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
});
