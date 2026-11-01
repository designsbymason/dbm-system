import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuViewport,
  menuSharedParts,
  sizeClass,
} from "../../internal/menu/menuParts";
import styles from "../../internal/menu/menu.module.css";
import type {
  MenuContentProps,
  MenuProps,
  MenuTriggerProps,
} from "./Menu.types";
import {
  DEFAULT_MENU_LABELS,
  MenuRootContext,
  MenuSizeContext,
  useControllableState,
} from "../../internal/menu/MenuContext";

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
  presentation = "menu",
  labels: labelOverrides,
}: MenuProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  // Which presentation applies is a width question, answered in JS since it chooses what is drawn, not only how.
  const sheet = useResolvedResponsiveValue(presentation, "menu") === "sheet";
  const labels = useMemo(() => mergeDefined(DEFAULT_MENU_LABELS, labelOverrides), [labelOverrides]);
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
      sheet,
      labels,
    }),
    [isOpen, dir, openToLast, close, reportClosed, reportOpened, sheet, labels],
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
    const { open, focusLastRef, inputRef, triggerRef, reportClosed, reportOpened, sheet } = useContext(MenuRootContext);
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
          className={cx(styles.content, sheet && styles.sheet, sizeClass[size], className)}
          {...props}
          data-presentation={sheet ? "sheet" : undefined}
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
          {/* The page behind a sheet is dimmed; a press on it is a press outside the panel, which closes the menu. */}
          {sheet && <Backdrop open data-menu-scrim="" />}
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

export { MenuViewport, menuSharedParts, sizeClass as menuSizeClass };
