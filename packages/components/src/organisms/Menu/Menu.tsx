import { CaretRightIcon, CheckIcon, CircleIcon, MinusIcon } from "@dbm-system/icons";
import { cx, mergeRefs, useResolvedResponsiveValue, useScrollEdges } from "@dbm-system/utils";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Icon } from "../../atoms/Icon";
import { Spinner } from "../../atoms/Spinner";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import type { IconSize, IconTone } from "../../atoms/Icon/Icon.types";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import styles from "./Menu.module.css";
import type {
  MenuCheckboxItemProps,
  MenuContentProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
  MenuSize,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
  MenuTriggerProps,
} from "./Menu.types";
import {
  MenuGroupContext,
  MenuPrimitiveContext,
  MenuRadioValueContext,
  MenuRootContext,
  MenuSizeContext,
  MenuSubContext,
  useControllableState,
  type MenuGroupContextValue,
} from "./MenuContext";

const sizeClass: Record<MenuSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// Each step's icon takes the same `icon-size` step `Select`'s in-field icons do at that size.
const iconSizeFor: Record<MenuSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
// The radio's dot is the filled circle glyph, which fills most of its box, so it takes a step less.
const dotSizeFor: Record<MenuSize, IconSize> = { xs: "xs", sm: "xs", md: "xs", lg: "sm", xl: "sm" };

/**
 * A floating list of actions opened from a trigger, built on Radix DropdownMenu: the arrow keys, typeahead,
 * Home/End, Escape and focus return, and `role="menu"` with `menuitem`s are Radix's. Reach for it for actions on
 * one thing (Edit, Duplicate, Delete) or for a few choices that act at once (a sort order, a view); it is not a
 * form field that picks a value (`Select`) and not a panel of arbitrary content (`Popover`).
 *
 * A compound component: `Menu.Trigger` and `Menu.Content` go inside `Menu`, and the content holds `Menu.Item`,
 * `Menu.CheckboxItem`, `Menu.RadioGroup` and `Menu.RadioItem`, `Menu.Label`, `Menu.Group`, `Menu.Separator` and
 * `Menu.Sub` (with `Menu.SubTrigger` and `Menu.SubContent`).
 *
 * `Menu` itself renders no DOM element, so it takes no `ref`, `className`, `style`, `id` or `data-testid`; those
 * apply to the parts, each of which forwards its own ref.
 *
 * It is modal by default, as a native menu is: the page behind is inert while it is open and a press outside only
 * closes it. The panel is portaled to the page and sits above a `Dialog` it was opened from.
 *
 * @example
 * ```tsx
 * <Menu>
 *   <Menu.Trigger asChild>
 *     <IconButton icon={DotsThreeIcon} aria-label="Row actions" />
 *   </Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Item icon={PencilIcon} shortcut="⌘E" onSelect={edit}>Edit</Menu.Item>
 *     <Menu.Item icon={CopyIcon} onSelect={duplicate}>Duplicate</Menu.Item>
 *     <Menu.Separator />
 *     <Menu.Item icon={TrashIcon} tone="danger" onSelect={remove}>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 * ```
 */
function MenuRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
  dir = "ltr",
}: MenuProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const focusLastRef = useRef(false);
  const inputRef = useRef<"pointer" | "keyboard" | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const latest = useRef({ open: isOpen, onOpenChangeComplete });
  useEffect(() => {
    latest.current = { open: isOpen, onOpenChangeComplete };
  });
  const openToLast = useCallback(() => {
    focusLastRef.current = true;
    setOpen(true);
  }, [setOpen]);
  const close = useCallback(() => {
    // An async item can resolve after the menu was dismissed another way; it has nothing left to close.
    if (latest.current.open) setOpen(false);
  }, [setOpen]);
  const reportClosed = useCallback(() => latest.current.onOpenChangeComplete?.(false), []);
  const reportOpened = useCallback(() => latest.current.onOpenChangeComplete?.(true), []);
  const value = useMemo(
    () => ({
      open: isOpen,
      dir,
      openToLast,
      focusLastRef,
      inputRef,
      triggerRef,
      close,
      reportClosed,
      reportOpened,
    }),
    [isOpen, dir, openToLast, close, reportClosed, reportOpened],
  );
  return (
    <MenuRootContext.Provider value={value}>
      <MenuPrimitive.Root open={isOpen} onOpenChange={setOpen} modal={modal} dir={dir}>
        {children}
      </MenuPrimitive.Root>
    </MenuRootContext.Provider>
  );
}

/**
 * The element that opens and closes the menu. Renders an unstyled native `<button>` by default; pass `asChild` to
 * use `Button` or `IconButton` instead. Enter, Space and ArrowDown open it, ArrowDown or ArrowUp placing focus on
 * the first or last item.
 */
const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild = false, className, onKeyDown, onPointerDown, ...props }, ref) => {
    const { open, openToLast, inputRef, triggerRef } = useContext(MenuRootContext);
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
    return (
      <MenuPrimitive.Trigger
        ref={mergedRef}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        {...props}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          inputRef.current = "pointer";
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          inputRef.current = "keyboard";
          // ArrowDown, Enter and Space are Radix's. ArrowUp opens too, onto the last item, as the menu-button
          // pattern allows and a person who came from the bottom of a list expects.
          if (event.defaultPrevented || event.key !== "ArrowUp" || props.disabled) return;
          event.preventDefault();
          openToLast();
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      />
    );
  },
);
MenuTrigger.displayName = "Menu.Trigger";

/**
 * What scrolls inside the panel, with a fade at each end that has more behind it. The panel keeps its border, surface and
 * rounded corners still while the items move; the fades say there is more (and which way), where a scrollbar that only
 * shows on scrolling does not. Rendered inside the panel, so it mounts and unmounts with it.
 */
function MenuViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { overflowStart, overflowEnd } = useScrollEdges(ref, "vertical");
  return (
    <>
      <div className={cx(styles.fade, styles.fadeStart)} data-visible={overflowStart || undefined} aria-hidden="true" />
      <div ref={ref} className={styles.viewport} data-scrollport="">
        {children}
      </div>
      <div className={cx(styles.fade, styles.fadeEnd)} data-visible={overflowEnd || undefined} aria-hidden="true" />
    </>
  );
}

/** The gap in pixels between a menu's trigger and its panel along `side`, when `sideOffset` is not given. Shared with `Sidebar`, whose rail menus measure from the rail's edge. */
export const MENU_SIDE_OFFSET = 4;

/**
 * The floating panel, rendered in a portal on the document body. It scrolls when taller than the room there is, is
 * named after its trigger, and takes the row size for every item inside it.
 */
const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  (
    {
      size = "md",
      side = "bottom",
      align = "start",
      sideOffset = MENU_SIDE_OFFSET,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      container,
      className,
      children,
      onPointerMove,
      onPointerDown,
      onKeyDown,
      onPointerDownOutside,
      onCloseAutoFocus,
      ...props
    },
    ref,
  ) => {
    const { open, focusLastRef, inputRef, triggerRef, reportClosed, reportOpened } = useContext(MenuRootContext);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
    // Opened with ArrowUp: once Radix has put focus on its first item, move it to the last one that can have it.
    // Radix gives a dropdown no hook for where focus lands as it opens, so this waits one frame for it to settle.
    useEffect(() => {
      if (!open || !focusLastRef.current) return undefined;
      focusLastRef.current = false;
      const frame = requestAnimationFrame(() => {
        const items = contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
        );
        [...(items ?? [])].reverse().find((item) => !item.hasAttribute("data-disabled"))?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }, [open, focusLastRef]);
    // Radix's `side` is one concrete value per render: it drives a computed position, not a CSS cascade, so a
    // responsive map is resolved to a single value in JS first.
    const resolvedSide = useResolvedResponsiveValue(side, "bottom");
    return (
      <MenuPrimitive.Portal container={container}>
        <MenuPrimitive.Content
          ref={mergedRef}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(styles.content, sizeClass[size], className)}
          {...props}
          // Which kind of input was used last is recorded on the panel (`data-input`, read by the stylesheet to hold
          // the focus ring back while it is `"pointer"`) and on the root (read as the panel closes, below). Radix
          // focuses an item as the pointer passes over it, which a browser may count as keyboard-style focus.
          onPointerMove={(event) => {
            onPointerMove?.(event);
            event.currentTarget.dataset.input = "pointer";
            inputRef.current = "pointer";
          }}
          onPointerDown={(event) => {
            onPointerDown?.(event);
            event.currentTarget.dataset.input = "pointer";
            inputRef.current = "pointer";
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            event.currentTarget.dataset.input = "keyboard";
            inputRef.current = "keyboard";
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            inputRef.current = "pointer";
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            // Radix hands focus back to the trigger with a plain `focus()`, which a browser may draw a ring for even
            // though the person only used a pointer. After a pointer, give it back without the ring; after the
            // keyboard, leave Radix's own focus (and the ring that tells the keyboard where it is).
            if (!event.defaultPrevented && inputRef.current === "pointer") {
              event.preventDefault();
              triggerRef.current?.focus({ focusVisible: false } as FocusOptions);
            }
            // The menu has closed and focus is going back to the trigger (Radix does it after this handler returns,
            // so report from a microtask): the moment `onOpenChangeComplete` is waiting for. A close that React's
            // StrictMode only simulates happens while still open, and is skipped.
            if (!open) queueMicrotask(reportClosed);
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <OverlayLifecycle
            open={open}
            panelRef={contentRef}
            // Only the entrance is read from the lifecycle: its close report fires when the panel unmounts, which
            // can be before Radix has put focus back, so the close is reported from `onCloseAutoFocus` above.
            onOpenChangeComplete={(done) => {
              if (done) reportOpened();
            }}
          />
          <MenuSizeContext.Provider value={size}>
            <MenuViewport>
              <ButtonGroupReset>{children}</ButtonGroupReset>
            </MenuViewport>
          </MenuSizeContext.Provider>
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    );
  },
);
MenuContent.displayName = "Menu.Content";

interface ItemBodyProps {
  icon: MenuItemProps["icon"];
  shortcut: MenuItemProps["shortcut"];
  description?: MenuItemProps["description"];
  descriptionId?: string;
  trailing?: MenuItemProps["trailing"];
  busy?: boolean;
  size: MenuSize;
  iconTone: IconTone;
  children: ReactNode;
}

// The spinner's step for each menu size: the same `icon-size` step an item's icon is drawn at.
const spinnerSizeFor = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" } as const;

/**
 * What every item draws: an optional leading icon, the label with an optional second line, and at the end optional
 * trailing content and a shortcut hint. A spinner shows while the item's action is pending, without moving the rest.
 */
function ItemBody({
  icon,
  shortcut,
  description,
  descriptionId,
  trailing,
  busy = false,
  size,
  iconTone,
  children,
}: ItemBodyProps) {
  const hasDescription = description !== undefined && description !== null;
  // A pending item shows its spinner without moving anything: in the place of its icon when it has one, and otherwise
  // over the end of the row, where the trailing content and shortcut stay (hidden, still taking their room) so the row
  // and the panel it widens keep their size.
  const spinnerAtEnd = busy && !icon;
  return (
    <>
      {icon && (
        // A box of the icon's size, so the spinner (a pixel or so off the icon's own size) takes its place exactly.
        <span className={styles.iconSlot}>
          {busy ? (
            <Spinner size={spinnerSizeFor[size]} />
          ) : (
            <Icon icon={icon} size={iconSizeFor[size]} tone={iconTone} />
          )}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.label}>{children}</span>
        {hasDescription && (
          // Hidden from the item's name and read as its description (`aria-describedby` on the item), so the label
          // stays what the item is called and typeahead and a screen reader's list stay short.
          <span id={descriptionId} className={styles.description} aria-hidden="true">
            {description}
          </span>
        )}
      </span>
      {trailing !== undefined && trailing !== null && (
        <span className={cx(styles.trailing, spinnerAtEnd && styles.underSpinner)}>{trailing}</span>
      )}
      {shortcut !== undefined && shortcut !== null && (
        <kbd className={cx(styles.shortcut, spinnerAtEnd && styles.underSpinner)}>{shortcut}</kbd>
      )}
      {spinnerAtEnd && <Spinner size={spinnerSizeFor[size]} className={styles.spinnerAtEnd} />}
    </>
  );
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as { then?: unknown } | null | undefined)?.then === "function";
}

/**
 * What choosing an item does, shared by every kind of item: the action may return a promise (the item is busy and the
 * menu waits), `closeOnSelect` decides whether the menu closes, and an item that can't be chosen (disabled with a reason, or busy) swallows the press.
 */
function useItemSelect({
  onSelect,
  closeOnSelect,
  onSelectError,
  inert,
}: {
  onSelect: ((event: Event) => void | Promise<unknown>) | undefined;
  closeOnSelect: boolean;
  onSelectError: ((error: unknown) => void) | undefined;
  inert: boolean;
}) {
  const { close } = useContext(MenuRootContext);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const handleSelect = (event: Event) => {
    if (inert || pending.current) {
      event.preventDefault();
      return;
    }
    const result = onSelect?.(event);
    const staysOpen = event.defaultPrevented || !closeOnSelect;
    if (isThenable(result)) {
      // The menu waits for the action: it stays open, and closes when the promise resolves.
      event.preventDefault();
      pending.current = true;
      setBusy(true);
      void result.then(
        () => {
          pending.current = false;
          if (alive.current) setBusy(false);
          if (!staysOpen) close();
        },
        (error: unknown) => {
          pending.current = false;
          if (alive.current) setBusy(false);
          // The menu stays open. With a handler the caller has it; without one the rejection is left unhandled, so
          // it surfaces where the caller can see it instead of being lost.
          if (onSelectError) onSelectError(error);
          else throw error;
        },
      );
      return;
    }
    if (staysOpen) event.preventDefault();
  };

  return { busy, handleSelect };
}

/**
 * The parts of an item beyond its own element, shared by every kind: its pending state and select handler, the
 * description and the reason that assistive technology reads, and the tooltip a reason is shown in.
 */
function useItemChrome({
  disabled,
  disabledReason,
  description,
  ariaDescribedBy,
  describesInside,
  onSelect,
  closeOnSelect,
  onSelectError,
}: {
  disabled: boolean;
  disabledReason: ReactNode;
  description: ReactNode;
  ariaDescribedBy: string | undefined;
  /** False for an `asChild` item, which draws none of its own content, so there is no description to point at. */
  describesInside: boolean;
  onSelect: ((event: Event) => void | Promise<unknown>) | undefined;
  closeOnSelect: boolean;
  onSelectError: ((error: unknown) => void) | undefined;
}) {
  const { dir } = useContext(MenuRootContext);
  const descriptionId = useId();
  const reasonId = useId();
  // A disabled item with a reason stays reachable (focusable, `aria-disabled`) so the reason can be heard and seen;
  // with no reason it is Radix's own skipped-and-dimmed.
  const hasReason = disabled && disabledReason !== undefined && disabledReason !== null;
  // The reason is announced through a hidden element the item draws itself, which an `asChild` item doesn't.
  const announcesReason = hasReason && describesInside;
  const reasonWithoutDisabled = !disabled && disabledReason !== undefined && disabledReason !== null;
  const reasonNotAnnounced = hasReason && !describesInside;
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (reasonWithoutDisabled) {
      console.warn(
        "Menu: `disabledReason` has no effect on an item that is not `disabled` — it explains why an item can't be chosen. Add `disabled`, or remove `disabledReason`.",
      );
    }
    if (reasonNotAnnounced) {
      console.warn(
        "Menu.Item: with `asChild`, `disabledReason` is shown in a tooltip but not announced as the item's description, since the item draws none of its own content. Put the reason in the child (and `aria-describedby`), or remove `asChild`.",
      );
    }
  }, [reasonWithoutDisabled, reasonNotAnnounced]);
  const { busy, handleSelect } = useItemSelect({ onSelect, closeOnSelect, onSelectError, inert: disabled });
  const hasDescription = description !== undefined && description !== null;
  const describedBy =
    [ariaDescribedBy, hasDescription && describesInside ? descriptionId : undefined, announcesReason ? reasonId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const reason = announcesReason ? (
    <VisuallyHidden id={reasonId} aria-hidden="true">
      {disabledReason}
    </VisuallyHidden>
  ) : null;
  const withReason = (item: ReactElement) =>
    hasReason ? (
      <Tooltip content={disabledReason} side={dir === "rtl" ? "left" : "right"}>
        {item}
      </Tooltip>
    ) : (
      item
    );
  return { busy, handleSelect, descriptionId, hasReason, describedBy, reason, withReason };
}

/**
 * An action. `onSelect` runs when it is chosen, by a click, Enter or Space, and the menu closes afterwards unless
 * the handler calls `event.preventDefault()` or `closeOnSelect` is `false`. Return a promise from `onSelect` for an
 * action that takes time. Pass `asChild` with a link to make a navigation item.
 */
const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      asChild = false,
      icon,
      shortcut,
      description,
      trailing,
      tone = "neutral",
      disabled = false,
      disabledReason,
      closeOnSelect = true,
      onSelect,
      onSelectError,
      textValue,
      className,
      children,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const size = useContext(MenuSizeContext);
    const ignoresContent = asChild && Boolean(icon || shortcut || description || trailing);
    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !ignoresContent) return;
      console.warn(
        "Menu.Item: `icon`, `shortcut`, `description` and `trailing` have no effect when `asChild` is set — the item draws none of its own content in that mode, since Radix `Slot` requires exactly one child. Put them inside the child, or remove `asChild`.",
      );
    }, [ignoresContent]);
    const chrome = useItemChrome({
      disabled,
      disabledReason,
      description,
      ariaDescribedBy,
      describesInside: !asChild,
      onSelect,
      closeOnSelect,
      onSelectError,
    });
    const iconTone: IconTone = disabled ? "disabled" : tone === "danger" ? "danger" : "default";
    return chrome.withReason(
      <Primitive.Item
        ref={ref}
        asChild={asChild}
        disabled={disabled && !chrome.hasReason}
        textValue={textValue ?? (typeof children === "string" ? children : undefined)}
        onSelect={chrome.handleSelect}
        className={cx(styles.item, tone === "danger" && styles.danger, className)}
        {...props}
        data-disabled={disabled ? "" : undefined}
        role="menuitem"
        aria-disabled={disabled || chrome.busy || undefined}
        aria-busy={chrome.busy || undefined}
        aria-describedby={chrome.describedBy}
      >
        {asChild ? (
          children
        ) : (
          <>
            <ItemBody
              icon={icon}
              shortcut={shortcut}
              description={description}
              descriptionId={chrome.descriptionId}
              trailing={trailing}
              busy={chrome.busy}
              size={size}
              iconTone={iconTone}
            >
              {children}
            </ItemBody>
            {chrome.reason}
          </>
        )}
      </Primitive.Item>,
    );
  },
);
MenuItem.displayName = "Menu.Item";

/**
 * An item that toggles something on or off and shows it with a check mark in its leading column. It is
 * uncontrolled with `defaultChecked`, or controlled with `checked`; `"indeterminate"` draws a dash for a mixed state.
 */
const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      icon,
      shortcut,
      description,
      trailing,
      disabled = false,
      disabledReason,
      closeOnSelect = false,
      onSelect,
      onSelectError,
      textValue,
      className,
      children,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const size = useContext(MenuSizeContext);
    const [value, setValue] = useControllableState<boolean | "indeterminate">(checked, defaultChecked, (next) =>
      onCheckedChange?.(next === true),
    );
    const chrome = useItemChrome({
      disabled,
      disabledReason,
      description,
      ariaDescribedBy,
      describesInside: true,
      onSelect,
      closeOnSelect,
      onSelectError,
    });
    return chrome.withReason(
      <Primitive.CheckboxItem
        ref={ref}
        checked={value}
        // An item that can't be chosen (disabled with a reason, or busy) must not flip either.
        onCheckedChange={(next) => {
          if (!disabled && !chrome.busy) setValue(next);
        }}
        disabled={disabled && !chrome.hasReason}
        textValue={textValue ?? (typeof children === "string" ? children : undefined)}
        onSelect={chrome.handleSelect}
        className={cx(styles.item, styles.indicated, className)}
        {...props}
        data-disabled={disabled ? "" : undefined}
        role="menuitemcheckbox"
        aria-checked={value === "indeterminate" ? "mixed" : value}
        aria-disabled={disabled || chrome.busy || undefined}
        aria-busy={chrome.busy || undefined}
        aria-describedby={chrome.describedBy}
      >
        <Primitive.ItemIndicator className={styles.indicator}>
          <Icon icon={value === "indeterminate" ? MinusIcon : CheckIcon} size={iconSizeFor[size]} tone="brand" />
        </Primitive.ItemIndicator>
        <ItemBody
          icon={icon}
          shortcut={shortcut}
          description={description}
          descriptionId={chrome.descriptionId}
          trailing={trailing}
          busy={chrome.busy}
          size={size}
          iconTone={disabled ? "disabled" : "default"}
        >
          {children}
        </ItemBody>
        {chrome.reason}
      </Primitive.CheckboxItem>,
    );
  },
);
MenuCheckboxItem.displayName = "Menu.CheckboxItem";

function useGroupLabelling(ariaLabelledBy: string | undefined) {
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const context = useMemo<MenuGroupContextValue>(() => ({ setLabelId }), []);
  return { context, labelledBy: ariaLabelledBy ?? labelId };
}

/**
 * A set of items that go together, named by a `Menu.Label` inside it (wired automatically) or by `aria-label`.
 */
const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ className, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const { context, labelledBy } = useGroupLabelling(ariaLabelledBy);
    return (
      <MenuGroupContext.Provider value={context}>
        <Primitive.Group
          ref={ref}
          className={className}
          {...props}
          role="group"
          aria-labelledby={labelledBy}
        />
      </MenuGroupContext.Provider>
    );
  },
);
MenuGroup.displayName = "Menu.Group";

/**
 * A set of `Menu.RadioItem`s of which one is chosen, named by a `Menu.Label` inside it or by `aria-label`. It is
 * uncontrolled with `defaultValue`, or controlled with `value` and `onValueChange`.
 */
const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  ({ value, defaultValue = "", onValueChange, className, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const { context, labelledBy } = useGroupLabelling(ariaLabelledBy);
    const [current, setCurrent] = useControllableState<string>(value, defaultValue, onValueChange);
    return (
      <MenuGroupContext.Provider value={context}>
        <MenuRadioValueContext.Provider value={current}>
          <Primitive.RadioGroup
            ref={ref}
            value={current}
            onValueChange={setCurrent}
            className={className}
            {...props}
            role="group"
            aria-labelledby={labelledBy}
          />
        </MenuRadioValueContext.Provider>
      </MenuGroupContext.Provider>
    );
  },
);
MenuRadioGroup.displayName = "Menu.RadioGroup";

/**
 * One choice in a `Menu.RadioGroup`, shown with a dot in its leading column while it is the chosen one.
 */
const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(
  (
    {
      icon,
      shortcut,
      description,
      trailing,
      disabled = false,
      disabledReason,
      closeOnSelect = false,
      onSelect,
      onSelectError,
      textValue,
      className,
      children,
      value,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const size = useContext(MenuSizeContext);
    const chosen = useContext(MenuRadioValueContext);
    const chrome = useItemChrome({
      disabled,
      disabledReason,
      description,
      ariaDescribedBy,
      describesInside: true,
      onSelect,
      closeOnSelect,
      onSelectError,
    });
    return chrome.withReason(
      <Primitive.RadioItem
        ref={ref}
        value={value}
        disabled={disabled && !chrome.hasReason}
        textValue={textValue ?? (typeof children === "string" ? children : undefined)}
        onSelect={chrome.handleSelect}
        className={cx(styles.item, styles.indicated, className)}
        {...props}
        data-disabled={disabled ? "" : undefined}
        role="menuitemradio"
        aria-checked={chosen === value}
        aria-disabled={disabled || chrome.busy || undefined}
        aria-busy={chrome.busy || undefined}
        aria-describedby={chrome.describedBy}
      >
        <Primitive.ItemIndicator className={styles.indicator}>
          <Icon icon={CircleIcon} weight="fill" size={dotSizeFor[size]} tone="brand" />
        </Primitive.ItemIndicator>
        <ItemBody
          icon={icon}
          shortcut={shortcut}
          description={description}
          descriptionId={chrome.descriptionId}
          trailing={trailing}
          busy={chrome.busy}
          size={size}
          iconTone={disabled ? "disabled" : "default"}
        >
          {children}
        </ItemBody>
        {chrome.reason}
      </Primitive.RadioItem>,
    );
  },
);
MenuRadioItem.displayName = "Menu.RadioItem";

/**
 * A heading for a group of items. Inside a `Menu.Group` or `Menu.RadioGroup` it names that group for assistive
 * technology; it is not itself an item and can't be focused.
 */
const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(({ className, id, ...props }, ref) => {
  const Primitive = useContext(MenuPrimitiveContext);
  const group = useContext(MenuGroupContext);
  const generatedId = useId();
  const labelId = id ?? generatedId;
  useEffect(() => {
    group?.setLabelId(labelId);
    return () => group?.setLabelId(undefined);
  }, [group, labelId]);
  return <Primitive.Label ref={ref} className={cx(styles.heading, className)} {...props} id={labelId} />;
});
MenuLabel.displayName = "Menu.Label";

/** A line between two sets of items. */
const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(({ className, ...props }, ref) => {
  const Primitive = useContext(MenuPrimitiveContext);
  // Radix sets the role and orientation first and spreads what it is given after, so a same-named consumer prop would
  // replace them: they are stated again here, after `{...props}` (05-component-api-conventions.md §3).
  return (
    <Primitive.Separator
      ref={ref}
      className={cx(styles.separator, className)}
      {...props}
      role="separator"
      aria-orientation="horizontal"
    />
  );
});
MenuSeparator.displayName = "Menu.Separator";

/**
 * The root of a submenu: a `Menu.SubTrigger` item that opens a `Menu.SubContent` beside it. A submenu may hold
 * submenus of its own.
 */
function MenuSub({ children, open, onOpenChange }: MenuSubProps) {
  const Primitive = useContext(MenuPrimitiveContext);
  const [isOpen, setOpen] = useControllableState(open, false, onOpenChange);
  const value = useMemo(() => ({ open: isOpen }), [isOpen]);
  return (
    <MenuSubContext.Provider value={value}>
      <Primitive.Sub open={isOpen} onOpenChange={setOpen}>
        {children}
      </Primitive.Sub>
    </MenuSubContext.Provider>
  );
}

/**
 * The item that opens a submenu, drawn with a caret at its end that points the way the submenu will open.
 * ArrowRight (ArrowLeft in right-to-left text) opens it; the opposite key closes it again.
 */
const MenuSubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(
  ({ icon, disabled = false, className, children, ...props }, ref) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const size = useContext(MenuSizeContext);
    const { dir } = useContext(MenuRootContext);
    const sub = useContext(MenuSubContext);
    return (
      <Primitive.SubTrigger
        ref={ref}
        disabled={disabled}
        className={cx(styles.item, className)}
        {...props}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={sub?.open ?? false}
        aria-disabled={disabled || undefined}
      >
        <ItemBody icon={icon} shortcut={undefined} size={size} iconTone={disabled ? "disabled" : "default"}>
          {children}
        </ItemBody>
        <Icon
          icon={CaretRightIcon}
          size={iconSizeFor[size]}
          tone={disabled ? "disabled" : "default"}
          mirrored={dir === "rtl"}
          className={styles.caret}
        />
      </Primitive.SubTrigger>
    );
  },
);
MenuSubTrigger.displayName = "Menu.SubTrigger";

/**
 * The submenu's panel, portaled and positioned beside its trigger on the side the reading direction opens to.
 */
const MenuSubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(
  (
    {
      size,
      alignOffset = -5,
      collisionPadding = 8,
      container,
      className,
      children,
      onPointerMove,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const Primitive = useContext(MenuPrimitiveContext);
    const parentSize = useContext(MenuSizeContext);
    const { inputRef } = useContext(MenuRootContext);
    const resolved = size ?? parentSize;
    return (
      <Primitive.Portal container={container}>
        <Primitive.SubContent
          ref={ref}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
          className={cx(styles.content, sizeClass[resolved], className)}
          {...props}
          // Which kind of input was used last is recorded on the panel (`data-input`, read by the stylesheet to hold
          // the focus ring back while it is `"pointer"`) and on the root (read as the panel closes, below). Radix
          // focuses an item as the pointer passes over it, which a browser may count as keyboard-style focus.
          onPointerMove={(event) => {
            onPointerMove?.(event);
            event.currentTarget.dataset.input = "pointer";
            inputRef.current = "pointer";
          }}
          onPointerDown={(event) => {
            onPointerDown?.(event);
            event.currentTarget.dataset.input = "pointer";
            inputRef.current = "pointer";
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            event.currentTarget.dataset.input = "keyboard";
            inputRef.current = "keyboard";
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <MenuSizeContext.Provider value={resolved}>
            <MenuViewport>
              <ButtonGroupReset>{children}</ButtonGroupReset>
            </MenuViewport>
          </MenuSizeContext.Provider>
        </Primitive.SubContent>
      </Primitive.Portal>
    );
  },
);
MenuSubContent.displayName = "Menu.SubContent";

type MenuComponent = typeof MenuRoot & {
  Trigger: typeof MenuTrigger;
  Content: typeof MenuContent;
  Item: typeof MenuItem;
  CheckboxItem: typeof MenuCheckboxItem;
  RadioGroup: typeof MenuRadioGroup;
  RadioItem: typeof MenuRadioItem;
  Label: typeof MenuLabel;
  Group: typeof MenuGroup;
  Separator: typeof MenuSeparator;
  Sub: typeof MenuSub;
  SubTrigger: typeof MenuSubTrigger;
  SubContent: typeof MenuSubContent;
};

export const Menu: MenuComponent = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
});

/**
 * The parts `ContextMenu` shares with `Menu`: the same items, labels, groups and submenu parts, drawn with the Radix
 * parts the nearest `MenuPrimitiveContext` supplies (the dropdown's unless a `ContextMenu` provides its own).
 */
export const menuSharedParts = {
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
};

export { MenuViewport, sizeClass as menuSizeClass };
