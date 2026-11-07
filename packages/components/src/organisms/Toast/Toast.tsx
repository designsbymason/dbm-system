import {
  CheckCircleIcon,
  InfoIcon,
  NoteIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@dbm-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import type { Responsive } from "@dbm-system/utils";
import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize, IconTone } from "../../atoms/Icon";
import { Portal } from "../../atoms/Portal";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import styles from "./Toast.module.css";
import type {
  ToastActionOptions,
  ToastActionProps,
  ToastActionVariant,
  ToastApi,
  ToastDescriptionProps,
  ToastLabels,
  ToastOpenChangeReason,
  ToastOptions,
  ToastPlacement,
  ToastPromiseOptions,
  ToastProps,
  ToastProviderProps,
  ToastRole,
  ToastSize,
  ToastStack,
  ToastTitleProps,
  ToastTone,
  Toaster,
  ToastVariant,
} from "./Toast.types";
import { ToastStore } from "./ToastStore";
import type { ToastEntry } from "./ToastStore";
import { useDirection } from "../../atoms/DirectionProvider";

const toneClass: Record<ToastTone, string | undefined> = {
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  neutral: styles.toneNeutral,
};

const variantClass: Record<ToastVariant, string | undefined> = {
  subtle: styles.variantSubtle,
  outlined: styles.variantOutlined,
  solid: styles.variantSolid,
};

const sizeClass: Record<ToastSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const actionVariantClass: Record<ToastActionVariant, string | undefined> = {
  primary: styles.actionPrimary,
  secondary: styles.actionSecondary,
  tertiary: styles.actionTertiary,
};

// The icons of the tone scale. `Alert` keeps the same five; this is the second consumer, and the rule is to extract a
// shared module at the third (`05-component-api-conventions.md` §1).
const toneIcon: Record<ToastTone, PhosphorIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: WarningOctagonIcon,
  neutral: NoteIcon,
};

// The icon colour: the tone's own on a light or tinted background, the "on" colour on a solid fill.
const iconTone: Record<ToastTone, IconTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "default",
};
const solidIconTone: Record<ToastTone, IconTone> = {
  info: "on-info",
  success: "on-success",
  warning: "on-warning",
  danger: "on-danger",
  neutral: "on-neutral",
};

const iconSizeForSize: Record<ToastSize, IconSize> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
const spinnerSizeForSize: Record<ToastSize, SpinnerSize> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
const dismissIconSizeForSize: Record<ToastSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// A toast that needs attention now interrupts; one that is only news waits for a pause.
const defaultRole: Record<ToastTone, ToastRole> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
  neutral: "status",
};

const defaultLabels: ToastLabels = {
  dismiss: "Dismiss",
  viewport: "Notifications ({hotkey})",
  notification: "Notification",
  clearAll: "Clear all",
  repeated: (count) => `×${count}`,
};

// `useLayoutEffect` on the client, `useEffect` on the server — avoids React's "does nothing on the server" warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const DEFAULT_LIMIT = 3;
const DEFAULT_DURATION = 5000;
const DEFAULT_PLACEMENT: ToastPlacement = "top-end";

/** What a toast reads from the provider around it. */
interface ToastSystemValue {
  store: ToastStore;
  variant: ToastVariant;
  size: ToastSize;
  labels: ToastLabels;
  api: ToastApi;
  /** The way a swipe closes a toast, which the provider tells Radix and each toast writes back (see `ToastRoot`). */
  swipeDirection: "up" | "down" | "left" | "right";
}
const ToastSystemContext = createContext<ToastSystemValue | null>(null);

/** What a toast's own parts read from it: the colours they draw with, the size, and a way to say why it closed. */
interface ToastItemValue {
  variant: ToastVariant;
  size: ToastSize;
  markReason: (reason: ToastOpenChangeReason | null) => void;
  /** Holds the toast open (no timeout, dismiss, swipe or Escape) while its action's promise runs. */
  setBusy: (busy: boolean) => void;
  /** Closes the toast from inside it, for an action that finished. */
  close: (reason: ToastOpenChangeReason) => void;
}
const ToastItemContext = createContext<ToastItemValue | null>(null);

// `toast.promise` and friends do nothing outside a provider; `useToast()` warns about it, once for each component that
// calls it there.
const noop = () => undefined;
const noopToast = Object.assign(() => "", {
  promise: <Value,>(promise: Promise<Value>) => promise,
});
const noopApi: ToastApi = { toast: noopToast, update: noop, dismiss: noop, dismissAll: noop };

function normalise(options: string | ToastOptions): ToastOptions {
  return typeof options === "string" ? { title: options } : options;
}

function createApi(store: ToastStore): ToastApi {
  const toast = Object.assign((options: string | ToastOptions) => store.raise(normalise(options)), {
    promise: <Value,>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => {
      const loading = normalise(options.loading);
      const id = store.add({
        tone: "neutral",
        duration: null,
        ...loading,
        id: options.id ?? loading.id,
        loading: true,
      });
      void promise.then(
        (value) => {
          const next = typeof options.success === "function" ? options.success(value) : options.success;
          store.add({ tone: "success", ...normalise(next), id, loading: false });
        },
        (reason: unknown) => {
          const next = typeof options.error === "function" ? options.error(reason) : options.error;
          store.add({ tone: "danger", ...normalise(next), id, loading: false });
        },
      );
      return promise;
    },
  });
  return {
    toast,
    update: (id, options) => store.update(id, options),
    dismiss: (id) => {
      store.close(id, "programmatic");
    },
    dismissAll: () => store.closeAll(),
  };
}

const toasterStores = new WeakMap<object, ToastStore>();

/**
 * Makes a queue of toasts outside React, for code that has no component to call `useToast()` from: an API client's
 * error handler, a service module. Give it to one `Toast.Provider` as its `toaster`; what is raised before the
 * provider mounts waits in it and shows then. It holds its own state, so nothing is shared between two of them.
 *
 * @example
 * ```tsx
 * export const toaster = createToaster();
 * // anywhere: toaster.toast({ tone: "danger", title: "Could not reach the server" });
 * // once:     <Toast.Provider toaster={toaster}><App /></Toast.Provider>
 * ```
 */
export function createToaster(): Toaster {
  const store = new ToastStore();
  const toaster: Toaster = { ...createApi(store), isToaster: true };
  toasterStores.set(toaster, store);
  return toaster;
}

/**
 * Raises and manages toasts from code. Must be used inside a `Toast.Provider`; outside one it warns in development
 * and does nothing.
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 * toast({ tone: "success", title: "Saved", action: { label: "Undo", altText: "Undo from the Edit menu", onClick: undo } });
 * ```
 */
export function useToast(): ToastApi {
  const system = useContext(ToastSystemContext);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !system) {
      console.warn("useToast: no `Toast.Provider` above this component, so toasts raised from it show nothing. Wrap the app in one.");
    }
  }, [system]);
  return system?.api ?? noopApi;
}

/** The headline of the message, in a few words. */
const ToastTitle = forwardRef<HTMLDivElement, ToastTitleProps>(({ className, children, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.title, className)}>
    {children}
  </div>
));
ToastTitle.displayName = "Toast.Title";

/** The message itself — text, or anything a message can hold, such as a link. */
const ToastDescription = forwardRef<HTMLDivElement, ToastDescriptionProps>(({ className, children, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.description, className)}>
    {children}
  </div>
));
ToastDescription.displayName = "Toast.Description";

/**
 * One thing the person can do about the message — a `Button` that takes its colours (and its size) from the toast
 * around it, so it reads against any tone and variant. Pressing it closes the toast after its own `onClick` has run;
 * if `onClick` returns a promise the toast stays open, with a spinner on the button, until it resolves, and a
 * rejection keeps it open and goes to `onClickError`. `altText` is required: a toast goes away by itself, so say how
 * to do the same thing without it.
 */
const ToastAction = forwardRef<HTMLButtonElement, ToastActionProps>(
  ({ variant = "primary", altText, asChild = false, className, onClick, onClickError, onClickCapture, children, ...props }, ref) => {
    const item = useContext(ToastItemContext);
    const known = variant in actionVariantClass;
    const resolved: ToastActionVariant = known ? variant : "primary";
    const [busy, setBusy] = useState(false);
    // A ref as well as the state, so a second press in the same tick is ignored before the state has updated.
    const busyRef = useRef(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && !known) {
        console.warn(
          `Toast.Action: \`variant\` must be "primary", "secondary" or "tertiary", but got ${JSON.stringify(variant)} — it is treated as "primary".`,
        );
      }
    }, [known, variant]);

    // `Button` writes `aria-busy` and `aria-disabled` itself, after the props it is given, and from `isLoading`, which also
    // sets the native `disabled` and would drop the focus of the person who just pressed it. They are set on the element.
    useEffect(() => {
      const node = buttonRef.current;
      if (!node) return;
      if (busy) {
        node.setAttribute("aria-busy", "true");
        node.setAttribute("aria-disabled", "true");
      } else {
        node.removeAttribute("aria-busy");
        node.removeAttribute("aria-disabled");
      }
    }, [busy]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (busyRef.current) {
        event.preventDefault();
        return;
      }
      const result = onClick?.(event);
      if (!result || typeof (result as Promise<unknown>).then !== "function") return;
      // A promise: not closing at once is what keeps the toast open, so the close Radix attaches to the press is cancelled
      // (and the reason the press marked is taken back, or a later timeout would be read as the action).
      event.preventDefault();
      item?.markReason(null);
      busyRef.current = true;
      setBusy(true);
      item?.setBusy(true);
      const settle = () => {
        busyRef.current = false;
        item?.setBusy(false);
        if (mounted.current) setBusy(false);
      };
      (result as Promise<unknown>).then(
        () => {
          settle();
          item?.close("action");
        },
        (error: unknown) => {
          settle();
          // Never dropped (`06` §3): the caller's handler, or left unhandled so it surfaces where it can be seen.
          if (onClickError) onClickError(error);
          else throw error;
        },
      );
    };

    return (
      <ToastPrimitive.Action asChild altText={altText}>
        <Button
          {...props}
          asChild={asChild}
          ref={mergeRefs(ref, buttonRef)}
          // After `...props`: the size is the toast's, and the variant is one of ours, whatever a caller passes.
          variant={resolved}
          size={item?.size ?? "md"}
          className={cx(styles.action, actionVariantClass[resolved], className)}
          onClick={handleClick}
          onClickCapture={(event) => {
            if (!busyRef.current) item?.markReason("action");
            onClickCapture?.(event);
          }}
        >
          {/* `asChild` slots onto the one element it is given, so there is nothing to put a spinner beside: a busy action
              says so with `aria-busy` and `aria-disabled` alone. */}
          {asChild ? (
            children
          ) : (
            <>
              {busy && <Spinner size="xs" />}
              {children}
            </>
          )}
        </Button>
      </ToastPrimitive.Action>
    );
  },
);
ToastAction.displayName = "Toast.Action";

/**
 * One toast, drawn as parts: `Toast.Title`, `Toast.Description` and `Toast.Action` in any order. Use it inside a
 * `Toast.Provider` for a message that belongs to your own state; for one raised from an event or a request, call
 * `toast()` from `useToast()`, which draws the same thing from data.
 *
 * It is a non-blocking, transient message: it never takes focus, closes by itself after `duration` (paused while the
 * pointer is over it or focus is inside it), and can be swiped toward the screen edge or dismissed with Escape. It is
 * announced as a live region, following the tone (`"alert"` for `danger` and `warning`, `"status"` otherwise).
 *
 * @example
 * ```tsx
 * <Toast.Provider>
 *   <Toast tone="success" open={saved} onOpenChange={(open) => setSaved(open)}>
 *     <Toast.Title>Saved</Toast.Title>
 *     <Toast.Description>Your changes are live.</Toast.Description>
 *   </Toast>
 * </Toast.Provider>
 * ```
 */
const ToastRoot = forwardRef<HTMLLIElement, ToastProps>(
  (
    {
      children,
      tone = "info",
      variant: variantProp,
      size: sizeProp,
      icon,
      loading = false,
      dismissible = true,
      duration: durationProp,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      onOpenChangeComplete,
      role,
      dismissLabel,
      className,
      ...props
    },
    ref,
  ) => {
    const system = useContext(ToastSystemContext);
    const variant = variantProp ?? system?.variant ?? "subtle";
    const size = sizeProp ?? system?.size ?? "md";
    const labels = system?.labels ?? defaultLabels;

    const isControlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = isControlled ? openProp : uncontrolledOpen;
    const panelRef = useRef<HTMLLIElement | null>(null);
    const reason = useRef<ToastOpenChangeReason | null>(null);

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && isControlled && defaultOpen === false) {
        console.warn("Toast: both `open` and `defaultOpen` were given. `open` makes it controlled, so `defaultOpen` is ignored — remove one.");
      }
    }, [isControlled, defaultOpen]);

    const busy = useRef(false);
    const markReason = useCallback((next: ToastOpenChangeReason | null) => {
      reason.current = next;
    }, []);

    // What Radix reports is only that it closed; the reason was written down by whatever caused it, and a close nothing
    // marked is the timer. While an action's promise runs nothing closes it but that action finishing.
    const handleOpenChange = (next: boolean) => {
      const why = reason.current ?? "timeout";
      reason.current = null;
      if (!next && busy.current && why !== "action") return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, { reason: why });
    };
    const latestClose = useRef(handleOpenChange);
    useEffect(() => {
      latestClose.current = handleOpenChange;
    });
    const setBusy = useCallback((next: boolean) => {
      busy.current = next;
    }, []);
    const close = useCallback((why: ToastOpenChangeReason) => {
      reason.current = why;
      latestClose.current(false);
    }, []);
    const contextValue = useMemo<ToastItemValue>(
      () => ({ variant, size, markReason, setBusy, close }),
      [variant, size, markReason, setBusy, close],
    );

    useKeepHeight(panelRef, open);

    const resolvedRole = role ?? (loading ? "status" : defaultRole[tone]);
    const glyph = icon === false ? undefined : (icon ?? toneIcon[tone]);
    const iconColour = variant === "solid" ? solidIconTone[tone] : iconTone[tone];
    let leading: ReactNode = null;
    if (loading) leading = <Spinner size={spinnerSizeForSize[size]} tone={iconColour} />;
    else if (glyph) leading = <Icon icon={glyph} size={iconSizeForSize[size]} tone={iconColour} />;

    // `null` means "until dismissed", which Radix spells `Infinity`; a number is its own, and left out the provider's.
    const duration = durationProp === null ? Infinity : durationProp;

    return (
      <ToastPrimitive.Root
        {...props}
        ref={mergeRefs(ref, panelRef)}
        type={resolvedRole === "alert" ? "foreground" : "background"}
        duration={duration}
        open={open}
        onOpenChange={handleOpenChange}
        onEscapeKeyDown={() => markReason("escape")}
        onSwipeEnd={() => markReason("swipe")}
        // After `...props`, and again here, since Radix writes these itself *before* it spreads the props it is given: a
        // same-named prop would otherwise win, and a `data-state` of the caller's would stop the exit from ever ending.
        data-state={open ? "open" : "closed"}
        data-swipe-direction={system?.swipeDirection ?? "right"}
        tabIndex={0}
        className={cx(styles.root, toneClass[tone], variantClass[variant], sizeClass[size], className)}
      >
        <ToastItemContext.Provider value={contextValue}>
          {leading && <span className={styles.icon}>{leading}</span>}
          <div className={styles.body}>{children}</div>
          {dismissible && (
            <ToastPrimitive.Close asChild>
              <button
                type="button"
                className={styles.dismiss}
                aria-label={dismissLabel ?? labels.dismiss}
                onClickCapture={() => markReason("dismiss")}
              >
                <Icon icon={XIcon} size={dismissIconSizeForSize[size]} />
              </button>
            </ToastPrimitive.Close>
          )}
        </ToastItemContext.Provider>
        <OverlayLifecycle open={open} panelRef={panelRef} onOpenChangeComplete={onOpenChangeComplete} />
      </ToastPrimitive.Root>
    );
  },
);
ToastRoot.displayName = "Toast";

/**
 * Keeps an element's height in a custom property while it is open, so that leaving can collapse the room it took by
 * exactly that much and the toasts beside it close the gap instead of jumping (Toast.module.css, `toastOut`).
 */
function useKeepHeight(ref: RefObject<HTMLElement | null>, open: boolean) {
  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node || !open) return undefined;
    const write = () => node.style.setProperty("--toast-height", `${node.offsetHeight}px`);
    write();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(write);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, open]);
}

/** A toast the provider holds, drawn from its options. */
function ToastEntryView({ entry }: { entry: ToastEntry }) {
  const system = useContext(ToastSystemContext);
  const store = system?.store;
  const { id, options, open } = entry;
  const shown = useRef(false);
  const told = useRef(false);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const handleOpenChange = (next: boolean, details: { reason: ToastOpenChangeReason }) => {
    if (next || !store) return;
    told.current = true;
    store.close(id, details.reason);
    store.takeReason(id);
    latest.current.onOpenChange?.(false, details);
  };

  // A close the person didn't cause (`dismiss()`, `dismissAll()`, a replacement from the provider) is reported here,
  // once the toast's own state has changed.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      if (!told.current) latest.current.onOpenChange?.(false, { reason: store?.takeReason(id) ?? "programmatic" });
    }
    if (open) told.current = false;
    wasOpen.current = open;
  }, [open, id, store]);

  // A toast that was closed before it was ever drawn has no exit to wait for.
  useEffect(() => {
    if (!open && !shown.current) store?.remove(id);
  }, [open, id, store]);

  const action: ToastActionOptions | undefined = options.action;
  const labels = system?.labels ?? defaultLabels;
  const repeated = entry.count > 1 ? <span className={styles.count}>{labels.repeated(entry.count)}</span> : null;
  return (
    <ToastRoot
      // Drawn afresh when it is replaced or raised again: its time starts again and it is read again.
      key={entry.revision}
      data-revised={entry.revision > 0 ? "" : undefined}
      ref={(node) => {
        if (node) shown.current = true;
      }}
      tone={options.tone}
      variant={options.variant}
      size={options.size}
      icon={options.icon}
      loading={options.loading}
      dismissible={options.dismissible}
      duration={options.duration === undefined && options.loading ? null : options.duration}
      role={options.role}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(next) => {
        latest.current.onOpenChangeComplete?.(next);
        if (!next) store?.remove(id);
      }}
    >
      {options.title !== undefined && (
        <ToastTitle>
          {options.title}
          {repeated}
        </ToastTitle>
      )}
      {options.description !== undefined && (
        <ToastDescription>
          {options.description}
          {options.title === undefined && repeated}
        </ToastDescription>
      )}
      {action && (
        <ToastAction altText={action.altText} variant={action.variant} onClick={action.onClick} onClickError={action.onError}>
          {action.label}
        </ToastAction>
      )}
    </ToastRoot>
  );
}

/** A CSS duration token (`"200ms"`, `"0.2s"`) as milliseconds, read from the element it is inherited by. */
function tokenDuration(element: Element, token: string): number {
  const raw = getComputedStyle(element).getPropertyValue(token).trim();
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return 0;
  return raw.endsWith("ms") ? value : value * 1000;
}

/**
 * What a fanned stack needs from the toasts' real positions: each open toast's depth behind the front one, and how far
 * it has to move to sit on it. Written as custom properties on the toasts (`--toast-depth`, `--toast-fan-delta`,
 * `--toast-layer`), which the stylesheet turns into a `translate` and a `scale`, so the list's own layout, its exit
 * collapse and the tab order are untouched. The front toast is the one nearest the edge the list is against, which is
 * the last open one in the document, whichever way the list runs.
 *
 * It measures after every change to the list's children or to a toast's state, and on every frame while one is on its
 * way out (the list is still reflowing as it collapses, and a transition would lag the positions it has to follow), when
 * the region says it is settling so the stylesheet turns the transitions off.
 */
function useFanLayout(list: HTMLOListElement | null, enabled: boolean, atTop: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!list || !enabled) return undefined;
    let frame = 0;
    const measure = () => {
      const items = Array.from(list.children).filter(
        (node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "LI" && !node.hasAttribute("data-clear-all"),
      );
      const open = items.filter((item) => item.getAttribute("data-state") === "open");
      const front = open[open.length - 1];
      if (front) {
        const frontEdge = atTop ? front.offsetTop : front.offsetTop + front.offsetHeight;
        open.forEach((item, index) => {
          const depth = open.length - 1 - index;
          const edge = atTop ? item.offsetTop : item.offsetTop + item.offsetHeight;
          // At most three layers: a deeper one is drawn on the third's place.
          item.style.setProperty("--toast-depth", String(Math.min(depth, 2)));
          item.style.setProperty("--toast-fan-delta", `${frontEdge - edge}px`);
          item.style.setProperty("--toast-layer", String(open.length - depth));
        });
      }
      const leaving = items.some((item) => item.getAttribute("data-state") !== "open");
      if (leaving) list.setAttribute("data-settling", "");
      else list.removeAttribute("data-settling");
      if (leaving) frame = requestAnimationFrame(measure);
    };
    measure();
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      measure();
    });
    mutations.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
    const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    Array.from(list.children).forEach((child) => sizes?.observe(child));
    const watchNew = new MutationObserver(() => {
      sizes?.disconnect();
      Array.from(list.children).forEach((child) => sizes?.observe(child));
    });
    watchNew.observe(list, { childList: true });
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      watchNew.disconnect();
      sizes?.disconnect();
      list.removeAttribute("data-settling");
    };
  }, [list, enabled, atTop]);
}

/**
 * The "Clear all" button, drawn once more than one toast is open. It is a toast of its own as far as Radix is concerned
 * (so it is in the region's tab order and F8 reaches it, which a plain button among the list's children would not be),
 * kept open by the count and not by a timer, and put last in the stack, at the bottom, by CSS `order`.
 */
function ToastClearAll({ show }: { show: boolean }) {
  const system = useContext(ToastSystemContext);
  const ref = useRef<HTMLLIElement | null>(null);
  useKeepHeight(ref, show);
  // The bar goes when there are fewer than two toasts. If focus is on it then, it would drop to the top of the page: it
  // moves to the toast that is left, the one right above the bar, and to the list when none is.
  useEffect(() => {
    if (show) return;
    const bar = ref.current;
    if (!bar || !bar.contains(document.activeElement)) return;
    const list = bar.parentElement;
    const remaining = list?.querySelector<HTMLElement>('li[data-state="open"]:not([data-clear-all])');
    (remaining ?? list)?.focus();
  }, [show]);
  return (
    <ToastPrimitive.Root
      ref={ref}
      open={show}
      duration={Infinity}
      type="background"
      // Nothing closes it but there being fewer than two toasts: Escape or a swipe on it are ignored.
      onOpenChange={noop}
      className={styles.clearAll}
      data-clear-all=""
      data-state={show ? "open" : "closed"}
      data-swipe-direction={system?.swipeDirection ?? "right"}
    >
      <div className={styles.clearAllInner}>
        <Button variant="ghost" size="sm" className={styles.clearAllButton} onClick={() => system?.api.dismissAll()}>
          {system?.labels.clearAll}
        </Button>
      </div>
    </ToastPrimitive.Root>
  );
}

// The way a swipe closes a toast: toward the edge it sits against. Radix's directions are physical.
function swipeDirectionFor(placement: ToastPlacement, dir: "ltr" | "rtl"): "up" | "down" | "left" | "right" {
  if (placement === "top") return "up";
  if (placement === "bottom") return "down";
  const towardEnd = placement.endsWith("-end");
  return towardEnd === (dir === "ltr") ? "right" : "left";
}

/**
 * Holds the toasts and draws their region: place it once, near the root of the app, around everything that may raise a
 * toast. Children use `useToast()` to raise them, or draw a `Toast` of their own.
 *
 * The region is a landmark at the end of the page, named "Notifications (F8)" (the key moves focus into it). It is
 * drawn in the page's body (or `container`), above dialogs, so it is never clipped or stacked under the app.
 *
 * @example
 * ```tsx
 * <Toast.Provider placement="top-end" limit={3}>
 *   <App />
 * </Toast.Provider>
 * ```
 */
const ToastProvider = forwardRef<HTMLOListElement, ToastProviderProps>(
  (
    {
      children,
      placement = DEFAULT_PLACEMENT,
      stack = "list" as Responsive<ToastStack>,
      limit = DEFAULT_LIMIT,
      duration = DEFAULT_DURATION,
      size = "md",
      variant = "subtle",
      clearAll = true,
      mergeDuplicates = true,
      formatNumber = String,
      toaster,
      hotkey,
      swipeThreshold,
      dir: dirProp,
      container,
      labels: labelOverrides,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const viewportRef = useRef<HTMLOListElement | null>(null);
    const [ownStore] = useState(() => new ToastStore());
    // A toaster made with `createToaster()` brings its own store, and is the api `useToast()` hands out.
    const givenStore = toaster ? toasterStores.get(toaster) : undefined;
    const store = givenStore ?? ownStore;

    const entries = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
    const showing = Math.max(1, Math.floor(limit));
    const visible = entries.slice(0, showing);
    // The store is told how many are on screen, for `dismissAll()` to know which are showing and which are waiting.
    useEffect(() => {
      store.setShowing(showing);
    }, [store, showing]);
    useEffect(() => {
      store.setMerging(mergeDuplicates);
    }, [store, mergeDuplicates]);

    const api = useMemo<ToastApi>(() => (givenStore && toaster ? toaster : createApi(store)), [store, givenStore, toaster]);
    // The count is written with `formatNumber`, not the browser's locale (ADR-0021).
    const labels: ToastLabels = mergeDefined(
      { ...defaultLabels, repeated: (count: number) => `×${formatNumber(count)}` },
      labelOverrides,
    );
    const resolvedPlacement = useResolvedResponsiveValue<ToastPlacement>(placement, DEFAULT_PLACEMENT);
    const swipeDirection = swipeDirectionFor(resolvedPlacement, dir);
    const value = useMemo<ToastSystemValue>(
      () => ({ store, variant, size, labels, api, swipeDirection }),
      // `labels` is rebuilt every render; its pieces are what matter.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [store, variant, size, labels.dismiss, labels.viewport, labels.notification, labels.clearAll, labels.repeated, api, swipeDirection],
    );

    // Focus. A toast never takes it, but a person can move into the region (the hotkey, Tab) and press its action;
    // when the toasts are gone by then, focus goes back to where they came from rather than dropping to the top of the
    // page. Worked out while focus is still there, since by the time it is gone there is nothing to ask.
    const focusWithin = useRef(false);
    const returnTarget = useRef<HTMLElement | null>(null);
    const resolvedStack = useResolvedResponsiveValue<ToastStack>(stack, "list");
    const fan = resolvedStack === "fan";
    // The person is reading the toasts (the pointer over them, or focus in them): the same condition that holds their
    // time. A fan spreads out while it holds, and folds back a moment after it stops, so crossing the gap between two
    // toasts doesn't make it flicker.
    const [expanded, setExpanded] = useState(false);
    // The list is drawn in a portal after the first render, so it is held as state for the layout hook to find.
    const [listElement, setListElement] = useState<HTMLOListElement | null>(null);
    useFanLayout(listElement, fan, resolvedPlacement.startsWith("top"));

    // Native listeners on the list, not React's: the toasts are drawn into it through a portal, so their events bubble
    // through the React tree to the provider and never pass through the list's own props.
    useEffect(() => {
      const list = listElement;
      if (!list) return undefined;
      // Spread at once when being read starts; folded back a moment (a motion duration) after both stop.
      let hovering = false;
      let focusing = false;
      let timer = 0;
      const settle = () => {
        window.clearTimeout(timer);
        if (hovering || focusing) setExpanded(true);
        else timer = window.setTimeout(() => setExpanded(false), tokenDuration(list, "--dbm-motion-duration-base"));
      };
      const over = () => {
        hovering = true;
        settle();
      };
      const out = (event: PointerEvent) => {
        if (event.relatedTarget instanceof Node && list.contains(event.relatedTarget)) return;
        hovering = false;
        settle();
      };
      const focusIn = (event: FocusEvent) => {
        focusing = true;
        settle();
        const from = event.relatedTarget;
        if (!focusWithin.current && from instanceof HTMLElement && from !== document.body && !list.contains(from)) {
          returnTarget.current = from;
        }
        focusWithin.current = true;
      };
      const focusOut = (event: FocusEvent) => {
        const next = event.relatedTarget;
        if (next instanceof Node && list.contains(next)) return;
        focusing = false;
        settle();
        // Focus moving somewhere outside. Focus leaving because the element was removed has no `relatedTarget`.
        if (next instanceof Node) focusWithin.current = false;
      };
      list.addEventListener("pointerover", over);
      list.addEventListener("pointerout", out);
      list.addEventListener("focusin", focusIn);
      list.addEventListener("focusout", focusOut);
      return () => {
        window.clearTimeout(timer);
        list.removeEventListener("pointerover", over);
        list.removeEventListener("pointerout", out);
        list.removeEventListener("focusin", focusIn);
        list.removeEventListener("focusout", focusOut);
      };
    }, [listElement]);
    const openCount = entries.filter((entry) => entry.open).length;
    const empty = entries.length === 0;
    useEffect(() => {
      if (!empty || !focusWithin.current) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== viewportRef.current) return;
      focusWithin.current = false;
      const target = returnTarget.current;
      returnTarget.current = null;
      if (target?.isConnected) target.focus();
    }, [empty]);

    return (
      <ToastSystemContext.Provider value={value}>
        <ToastPrimitive.Provider
          label={labels.notification}
          duration={duration === null ? Infinity : duration}
          swipeDirection={swipeDirection}
          swipeThreshold={swipeThreshold}
        >
          {children}
          {visible.map((entry) => (
            <ToastEntryView key={entry.id} entry={entry} />
          ))}
          {clearAll && <ToastClearAll show={openCount >= 2 && (!fan || expanded)} />}
          <Portal container={container}>
            <ToastPrimitive.Viewport
              {...props}
              ref={mergeRefs(ref, viewportRef, setListElement)}
              label={labels.viewport}
              hotkey={hotkey}
              // After `...props`: the direction and the placement are the ones in effect, whatever a caller passes.
              dir={dir}
              data-placement={resolvedPlacement}
              data-stack={resolvedStack}
              data-expanded={fan && expanded ? "" : undefined}
              onFocus={onFocus}
              onBlur={onBlur}
              className={cx(styles.viewport, className)}
            />
          </Portal>
        </ToastPrimitive.Provider>
      </ToastSystemContext.Provider>
    );
  },
);
ToastProvider.displayName = "Toast.Provider";

type ToastComponent = typeof ToastRoot & {
  Provider: typeof ToastProvider;
  Title: typeof ToastTitle;
  Description: typeof ToastDescription;
  Action: typeof ToastAction;
};

export const Toast: ToastComponent = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
});
