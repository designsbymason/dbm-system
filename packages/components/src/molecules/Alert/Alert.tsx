import {
  CheckCircleIcon,
  InfoIcon,
  NoteIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@dbm-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import { Presence } from "@radix-ui/react-presence";
import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AnimationEvent, FocusEvent, ReactNode } from "react";
import { Affix } from "../../atoms/Affix";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize, IconTone } from "../../atoms/Icon";
import styles from "./Alert.module.css";
import { hasPageSettled } from "./pageSettled";
import type {
  AlertActionProps,
  AlertActionVariant,
  AlertActionsPlacement,
  AlertActionsProps,
  AlertAlign,
  AlertDescriptionProps,
  AlertLabels,
  AlertProps,
  AlertRole,
  AlertSize,
  AlertTitleProps,
  AlertTone,
  AlertVariant,
} from "./Alert.types";
import { useProvidedDirection } from "../../atoms/DirectionProvider/DirectionProvider";

const toneClass: Record<AlertTone, string | undefined> = {
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  neutral: styles.toneNeutral,
};

const variantClass: Record<AlertVariant, string | undefined> = {
  subtle: styles.variantSubtle,
  outlined: styles.variantOutlined,
  solid: styles.variantSolid,
};

const sizeClass: Record<AlertSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneIcon: Record<AlertTone, PhosphorIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: WarningOctagonIcon,
  neutral: NoteIcon,
};

// The icon colour: the tone's own on a light or tinted background, the "on" colour on a solid fill.
const iconTone: Record<AlertTone, IconTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "default",
};
const solidIconTone: Record<AlertTone, IconTone> = {
  info: "on-info",
  success: "on-success",
  warning: "on-warning",
  danger: "on-danger",
  neutral: "on-neutral",
};

const iconSizeForSize: Record<AlertSize, IconSize> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
const dismissIconSizeForSize: Record<AlertSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// An alert that needs attention now interrupts; one that is only news waits for a pause.
const defaultRole: Record<AlertTone, AlertRole> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
  neutral: "status",
};

// What an `Alert.Action` needs from the alert around it: the colours it draws with, and the size it takes.
interface AlertContextValue {
  variant: AlertVariant;
  size: AlertSize;
}
const AlertContext = createContext<AlertContextValue>({ variant: "subtle", size: "md" });

// The icon, handed to the first line of the message when the content is centred, so it sits inline at the start of that line
// (and so centres, and wraps, together with its words) instead of stranded beside the widest line of the whole message.
const LeadingIconContext = createContext<ReactNode>(null);

const actionVariantClass: Record<AlertActionVariant, string | undefined> = {
  primary: styles.actionPrimary,
  secondary: styles.actionSecondary,
  tertiary: styles.actionTertiary,
};

// `useLayoutEffect` on the client, `useEffect` on the server — avoids React's "does nothing on the server" warning, the same
// as `Pagination` and `Breadcrumb`.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultLabels: AlertLabels = { dismiss: "Dismiss" };

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * The nearest thing outside `root` that can take focus — the next one in the page, else the one before — so that when
 * the alert goes away with focus inside it, the reader lands somewhere sensible instead of at the top of the document.
 */
function findNextFocusable(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const candidates = Array.from(root.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !root.contains(element) && (typeof element.checkVisibility !== "function" || element.checkVisibility()),
  );
  const after = candidates.find((element) => root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  return after ?? candidates[candidates.length - 1] ?? null;
}

/**
 * The headline of the message, in a few words — a `<p>`, or with `asChild` your own element (a heading, where the
 * message belongs in the page's outline).
 */
const AlertTitle = forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const Component = asChild ? Slot : "p";
    const leadingIcon = useContext(LeadingIconContext);
    return (
      <Component {...props} ref={ref} className={cx(styles.title, className)}>
        {asChild ? (
          // `Slot` takes exactly one child, so nothing can be put beside it: the alert keeps the icon out of a title like this.
          children
        ) : (
          <>
            {/* The alert's icon, when it is centred and this is the first line: inline, before the words. */}
            {leadingIcon && <span className={styles.inlineIcon}>{leadingIcon}</span>}
            {children}
          </>
        )}
      </Component>
    );
  },
);
AlertTitle.displayName = "Alert.Title";

/** The message itself — text, or anything a message can hold, such as a link. */
const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(({ className, children, ...props }, ref) => {
  const leadingIcon = useContext(LeadingIconContext);
  return (
    <div {...props} ref={ref} className={cx(styles.description, className)}>
      {leadingIcon && <span className={styles.inlineIcon}>{leadingIcon}</span>}
      {children}
    </div>
  );
});
AlertDescription.displayName = "Alert.Description";

/** What the reader can do about it — usually one or two buttons or links, wrapping onto more lines when short of room. */
const AlertActions = forwardRef<HTMLDivElement, AlertActionsProps>(({ className, children, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.actions, className)}>
    {children}
  </div>
));
AlertActions.displayName = "Alert.Actions";

/**
 * One thing the reader can do about the message — a `Button` that takes its colours (and its size) from the alert around it,
 * so it reads against any tone and variant, including a solid one where a brand-coloured button would disappear. Takes
 * everything `Button` takes (`asChild` for a link, `onClick`, `disabled`, `isLoading`, icons…) except its own `variant` and
 * `size`. `variant` is how prominent it is: `"primary"` (the default), `"secondary"` or `"tertiary"`.
 */
const AlertAction = forwardRef<HTMLButtonElement, AlertActionProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    const { size } = useContext(AlertContext);
    // Only these three are drawn to read against the alert; anything else (a `Button` variant, say) is not one of them.
    const known = variant in actionVariantClass;
    const resolved: AlertActionVariant = known ? variant : "primary";
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && !known) {
        console.warn(
          `Alert.Action: \`variant\` must be "primary", "secondary" or "tertiary", but got ${JSON.stringify(variant)} — it is treated as "primary".`,
        );
      }
    }, [known, variant]);
    return (
      <Button
        {...props}
        ref={ref}
        // After `...props`: the size is the alert's, and the variant is one of ours, whatever a caller passes.
        variant={resolved}
        size={size}
        className={cx(styles.action, actionVariantClass[resolved], className)}
      />
    );
  },
);
AlertAction.displayName = "Alert.Action";

/**
 * A message that stays in the page: something the reader should know, or do something about — a saved form, a failed
 * upload, a plan about to expire. A compound component: put `Alert.Title`, `Alert.Description` and `Alert.Actions` inside
 * it in any order, or just plain text for the shortest alert. Put `Alert.Action`s in `Alert.Actions`: they take the alert's
 * colours and size, so they read against every tone and variant.
 *
 * Five `tone`s (each with its own icon), three `variant`s, five `size`s. `banner` makes it edge to edge for a whole page
 * or section, and `sticky` keeps it at the top as the page scrolls (built on `Affix`). `dismissible` adds a button that
 * closes it, with a short exit animation; it is `open`/`defaultOpen`/`onOpenChange`, like other disclosure components, so
 * pair it with `usePersistentDismiss` to remember the dismissal across visits. When it goes away with keyboard focus inside
 * it, focus moves to the nearest focusable thing outside rather than dropping to the top of the page.
 *
 * It is announced as a live region, following the tone (`role="alert"` for `danger` and `warning`, `role="status"`
 * otherwise); pass `role="none"` for a message that is already on the page when it loads. `ref` forwards to the element
 * that carries the role.
 *
 * @example
 * ```tsx
 * <Alert tone="danger" dismissible>
 *   <Alert.Title>Payment failed</Alert.Title>
 *   <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
 *   <Alert.Actions><Alert.Action>Update card</Alert.Action></Alert.Actions>
 * </Alert>
 * ```
 */
const AlertRoot = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      children,
      tone = "info",
      variant = "subtle",
      size = "md",
      icon,
      banner = false,
      actionsPlacement = "below" as AlertActionsPlacement,
      align = "start" as AlertAlign,
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      dismissible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      role,
      labels: labelOverrides,
      className,
      onFocus,
      onBlur,
      dir: dirProp,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const dir = dirProp ?? providedDir;
    const isControlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = isControlled ? openProp : uncontrolledOpen;
    const rootRef = useRef<HTMLDivElement>(null);
    const focusWithin = useRef(false);
    const focusTarget = useRef<HTMLElement | null>(null);
    // Whether it is animating in. Decided before the first paint (so there is no flash of the finished alert first), and only
    // for an alert that *appears*: one that mounts after the page has settled, or that is reopened. One already in the page
    // when it loads just is; and the server renders it not entering, so hydration matches.
    const [entering, setEntering] = useState(false);
    const previousOpen = useRef<boolean | null>(null);
    useIsomorphicLayoutEffect(() => {
      const first = previousOpen.current === null;
      if (open && (first ? hasPageSettled() : previousOpen.current === false)) setEntering(true);
      if (!open) setEntering(false);
      previousOpen.current = open;
    }, [open]);

    const labels: AlertLabels = mergeDefined(defaultLabels, labelOverrides);
    // `Alert.Actions` is set apart from the message, so it can sit beside it or below it.
    const parts = Children.toArray(children);
    const isActions = (child: unknown) => isValidElement(child) && child.type === AlertActions;
    const actionChildren = parts.filter(isActions);
    const textChildren = parts.filter((child) => !isActions(child));
    // When centred, the icon belongs at the start of the first line of the message — a title, or a description — where it
    // centres with that line's words; anything else that comes first (plain text, a title drawn onto your own element) can't
    // hold it, and the icon then sits before the whole message as it does when the content is at the start.
    const firstText = textChildren[0];
    const iconGoesInLine =
      align === "center" &&
      isValidElement<{ asChild?: boolean }>(firstText) &&
      ((firstText.type === AlertTitle && !firstText.props.asChild) || firstText.type === AlertDescription);
    const resolvedRole = role ?? defaultRole[tone];
    const glyph = icon === false ? undefined : (icon ?? toneIcon[tone]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (isControlled && defaultOpen === false) {
        console.warn("Alert: both `open` and `defaultOpen` were given. `open` makes it controlled, so `defaultOpen` is ignored — remove one.");
      }
    }, [isControlled, defaultOpen]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && dismissible && isControlled && !onOpenChange) {
        console.warn(
          "Alert: `dismissible` on a controlled alert (`open` is set) needs `onOpenChange`, or the dismiss button changes nothing. Set `open` to false in `onOpenChange`.",
        );
      }
    }, [dismissible, isControlled, onOpenChange]);

    // Where focus goes when the alert leaves with focus inside it (the dismiss button, or an action that closes it):
    // worked out while focus is still there, since by the time it is gone there is nothing to measure from.
    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      focusWithin.current = true;
      focusTarget.current = findNextFocusable(rootRef.current);
      onFocus?.(event);
    };
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      // Focus moving somewhere outside. Focus leaving because the element was removed has no `relatedTarget`.
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
        focusWithin.current = false;
      }
      onBlur?.(event);
    };
    useEffect(() => {
      if (open || !focusWithin.current) return;
      focusWithin.current = false;
      const target = focusTarget.current;
      if (target?.isConnected) target.focus();
    }, [open]);

    const dismiss = () => {
      if (!isControlled) setUncontrolledOpen(false);
      onOpenChange?.(false);
    };

    const contextValue = useMemo(() => ({ variant, size }), [variant, size]);
    const iconElement = glyph ? (
      <Icon icon={glyph} size={iconSizeForSize[size]} tone={variant === "solid" ? solidIconTone[tone] : iconTone[tone]} />
    ) : null;

    const alert = (
      <div
        className={cx(styles.wrapper, sticky && styles.sticky)}
        data-state={open ? "open" : "closed"}
        data-enter={entering && open ? "" : undefined}
        onAnimationEnd={(event: AnimationEvent<HTMLDivElement>) => {
          // The entrance ending (not an animation of something inside it): the wrapper stops clipping.
          if (event.target === event.currentTarget) setEntering(false);
        }}
      >
        <div className={styles.inner}>
          <div
            {...props}
            dir={dir}
            ref={mergeRefs(ref, rootRef)}
            // After `...props`, so a caller's own `role` can't replace the one the tone (or `role`) resolves to.
            role={resolvedRole === "none" ? undefined : resolvedRole}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cx(
              styles.root,
              toneClass[tone],
              variantClass[variant],
              sizeClass[size],
              banner && styles.banner,
              actionsPlacement === "inline" && styles.actionsInline,
              align === "center" && styles.alignCenter,
              dismissible && styles.hasDismiss,
              className,
            )}
          >
            {glyph && !iconGoesInLine && <span className={styles.icon}>{iconElement}</span>}
            <div className={styles.body}>
              <AlertContext.Provider value={contextValue}>
                {textChildren.length > 0 && (
                  <div className={styles.text}>
                    {iconGoesInLine && glyph ? (
                      <>
                        <LeadingIconContext.Provider value={iconElement}>{firstText}</LeadingIconContext.Provider>
                        <LeadingIconContext.Provider value={null}>{textChildren.slice(1)}</LeadingIconContext.Provider>
                      </>
                    ) : (
                      // Reset, so an alert nested inside another's first line doesn't inherit that alert's icon.
                      <LeadingIconContext.Provider value={null}>{textChildren}</LeadingIconContext.Provider>
                    )}
                  </div>
                )}
                {actionChildren}
              </AlertContext.Provider>
            </div>
            {dismissible && (
              <button type="button" className={styles.dismiss} aria-label={labels.dismiss} onClick={dismiss}>
                <Icon icon={XIcon} size={dismissIconSizeForSize[size]} />
              </button>
            )}
          </div>
        </div>
      </div>
    );

    return (
      // `Presence` keeps it in the page for the length of its exit animation. When sticky, the outermost element — the
      // one `position: sticky` is on — is the wrapper itself (`asChild`): anything around it would become the box it
      // sticks within, and it would never stick.
      <Presence present={open}>
        {sticky ? (
          <Affix asChild offset={stickyOffset} scrollContainerRef={scrollContainerRef}>
            {alert}
          </Affix>
        ) : (
          alert
        )}
      </Presence>
    );
  },
);
AlertRoot.displayName = "Alert";

type AlertComponent = typeof AlertRoot & {
  Title: typeof AlertTitle;
  Description: typeof AlertDescription;
  Actions: typeof AlertActions;
  Action: typeof AlertAction;
};

export const Alert: AlertComponent = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
  Actions: AlertActions,
  Action: AlertAction,
});
