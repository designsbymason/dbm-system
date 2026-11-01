import {
  cx,
  mergeRefs,
  useResolvedResponsiveValue,
  useScrollEdges,
} from "@dbm-system/utils";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import styles from "./Menubar.module.css";
import menuStyles from "../../internal/menu/menu.module.css";
import {
  MenuViewport,
  menuSharedParts,
  sizeClass as menuSizeClass,
} from "../../internal/menu/menuParts";
import {
  DEFAULT_MENU_LABELS,
  MenuPrimitiveContext,
  MenuRootContext,
  MenuSizeContext,
  useControllableState,
  type MenuPrimitiveKit,
} from "../../internal/menu/MenuContext";
import { MenubarContext, MenubarMenuValueContext } from "./MenubarContext";
import type {
  MenubarContentProps,
  MenubarMenuProps,
  MenubarProps,
  MenubarSize,
  MenubarSurface,
  MenubarTriggerProps,
} from "./Menubar.types";

// Radix Menubar's item, group and submenu parts, which the shared parts draw with inside a `Menubar`'s panels.
const primitiveKit: MenuPrimitiveKit = MenubarPrimitive;

const sizeClass: Record<MenubarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const surfaceClass: Record<MenubarSurface, string | undefined> = {
  ghost: styles.ghost,
  outlined: styles.outlined,
  filled: styles.filled,
};

/**
 * A desktop-style bar of menus (File, Edit, View) built on Radix Menubar: one tab stop, the arrow keys moving between
 * triggers, a menu that opens onto its first item, and a hover or arrow that moves from one open menu to the next are
 * Radix's. Reach for it for the commands of an application window or an editor; a site's navigation is
 * `NavigationMenu` and `Navbar`, a button of actions is `Menu`, and a row of buttons is `Toolbar`.
 *
 * A compound component: `Menubar.Menu` (named by its `value`) holds a `Menubar.Trigger` and a `Menubar.Content`, and the
 * content holds `Menubar.Item`, `Menubar.CheckboxItem`, `Menubar.RadioGroup` and `Menubar.RadioItem`, `Menubar.Label`,
 * `Menubar.Group`, `Menubar.Separator` and `Menubar.Sub` (with `Menubar.SubTrigger` and `Menubar.SubContent`). The item
 * parts are `Menu`'s, drawn the same, so an item takes an icon, a description, a shortcut hint and a promise.
 *
 * The menus leave the page behind them usable, as a native menu bar does. A shortcut hint on an item is a label and
 * binds no key: the app wires the key, and can open a menu from code with the bar's `value`.
 *
 * A bar wider than its container scrolls sideways, with a fade at each end that has more behind it, and keeps the
 * trigger that has focus in view.
 *
 * @example
 * ```tsx
 * <Menubar aria-label="Application menu">
 *   <Menubar.Menu value="file">
 *     <Menubar.Trigger>File</Menubar.Trigger>
 *     <Menubar.Content>
 *       <Menubar.Item shortcut="⌘N" onSelect={newFile}>New</Menubar.Item>
 *       <Menubar.Item shortcut="⌘S" onSelect={save}>Save</Menubar.Item>
 *       <Menubar.Separator />
 *       <Menubar.Item tone="danger" onSelect={close}>Close window</Menubar.Item>
 *     </Menubar.Content>
 *   </Menubar.Menu>
 * </Menubar>
 * ```
 */
const MenubarRoot = forwardRef<HTMLDivElement, MenubarProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue = "",
      onValueChange,
      onOpenChangeComplete,
      size = "md",
      surface = "ghost",
      loop = true,
      dir = "ltr",
      className,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange,
    );
    const barRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, barRef), [ref]);
    const { overflowStart, overflowEnd } = useScrollEdges(barRef, "horizontal");
    const latest = useRef(onOpenChangeComplete);
    useEffect(() => {
      latest.current = onOpenChangeComplete;
    });
    const reportComplete = useCallback(
      (menu: string, open: boolean) => latest.current?.(menu, open),
      [],
    );
    const context = useMemo(
      () => ({ value, setValue, size, dir, reportComplete }),
      [value, setValue, size, dir, reportComplete],
    );
    return (
      <MenubarContext.Provider value={context}>
        <MenubarPrimitive.Root
          ref={mergedRef}
          value={value}
          onValueChange={setValue}
          loop={loop}
          dir={dir}
          className={cx(
            styles.root,
            sizeClass[size],
            surfaceClass[surface],
            className,
          )}
          {...props}
          // A trigger that is only partly in view is not scrolled to by the browser, which acts on one that is wholly
          // hidden, so it is revealed here, clear of the fade, once the browser has had its say.
          onFocus={(event) => {
            onFocus?.(event);
            const target = event.target;
            requestAnimationFrame(() => revealInBar(barRef.current, target));
          }}
          role="menubar"
          data-overflow-start={overflowStart || undefined}
          data-overflow-end={overflowEnd || undefined}
        >
          {children}
        </MenubarPrimitive.Root>
      </MenubarContext.Provider>
    );
  },
);
MenubarRoot.displayName = "Menubar";

/** Scrolls the bar just far enough to bring `target` fully into view, clear of its `scroll-padding`. */
function revealInBar(bar: HTMLElement | null, target: EventTarget) {
  if (!bar || !(target instanceof HTMLElement) || !bar.contains(target)) return;
  if (bar.scrollWidth <= bar.clientWidth) return;
  const barRect = bar.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const padding =
    Number.parseFloat(getComputedStyle(bar).scrollPaddingInlineStart) || 0;
  if (rect.left < barRect.left + padding)
    bar.scrollBy({ left: rect.left - barRect.left - padding });
  else if (rect.right > barRect.right - padding)
    bar.scrollBy({ left: rect.right - barRect.right + padding });
}

/**
 * One menu of the bar: a `Menubar.Trigger` and the `Menubar.Content` it opens. `value` names it, and is what the bar's
 * own `value` holds while it is open. It renders no element of its own, so it takes no `ref`, `className` or `style`.
 */
function MenubarMenu({ value, children }: MenubarMenuProps) {
  const bar = useContext(MenubarContext);
  if (bar === null && process.env.NODE_ENV !== "production") {
    console.warn(
      "Menubar.Menu: rendered outside a <Menubar>, so it has no bar to open from.",
    );
  }
  const open = bar !== null && bar.value === value;
  const setValue = bar?.setValue;
  const dir = bar?.dir ?? "ltr";
  const reportComplete = bar?.reportComplete;
  const focusLastRef = useRef(false);
  const inputRef = useRef<"pointer" | "keyboard" | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const latestOpen = useRef(open);
  useEffect(() => {
    latestOpen.current = open;
  });
  const openToLast = useCallback(() => {
    focusLastRef.current = true;
    setValue?.(value);
  }, [setValue, value]);
  const close = useCallback(() => {
    // An async item can resolve after the menu was dismissed another way; it has nothing left to close.
    if (latestOpen.current) setValue?.("");
  }, [setValue]);
  const reportClosed = useCallback(
    () => reportComplete?.(value, false),
    [reportComplete, value],
  );
  const reportOpened = useCallback(
    () => reportComplete?.(value, true),
    [reportComplete, value],
  );
  const context = useMemo(
    () => ({
      open,
      dir,
      openToLast,
      focusLastRef,
      inputRef,
      triggerRef,
      close,
      reportClosed,
      reportOpened,
      // A menu bar is a desktop pattern: its panels are never a sheet.
      sheet: false,
      labels: DEFAULT_MENU_LABELS,
    }),
    [open, dir, openToLast, close, reportClosed, reportOpened],
  );
  return (
    <MenubarMenuValueContext.Provider value={value}>
      <MenuRootContext.Provider value={context}>
        <MenubarPrimitive.Menu value={value}>{children}</MenubarPrimitive.Menu>
      </MenuRootContext.Provider>
    </MenubarMenuValueContext.Provider>
  );
}
MenubarMenu.displayName = "Menubar.Menu";

/**
 * The bar's button that opens a menu: "File", "Edit". Renders a native `<button>` with `role="menuitem"`. Enter, Space,
 * ArrowDown and ArrowUp open its menu, the last two placing focus on the first or the last item, and Left and Right
 * move to the next trigger.
 */
const MenubarTrigger = forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  ({ asChild = false, className, onKeyDown, onPointerDown, ...props }, ref) => {
    const { open, openToLast, inputRef, triggerRef } =
      useContext(MenuRootContext);
    const mergedRef = useMemo(
      () => mergeRefs(ref, triggerRef),
      [ref, triggerRef],
    );
    return (
      <MenubarPrimitive.Trigger
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
          // ArrowDown, Enter and Space are Radix's. ArrowUp opens too, onto the last item, as the menu-button pattern
          // allows.
          if (
            event.defaultPrevented ||
            event.key !== "ArrowUp" ||
            props.disabled
          )
            return;
          event.preventDefault();
          openToLast();
        }}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
      />
    );
  },
);
MenubarTrigger.displayName = "Menubar.Trigger";

/**
 * The floating panel of a menu, rendered in a portal on the document body and placed under its trigger. It scrolls
 * when taller than the room there is, and takes the row size for every item inside it (by default the bar's).
 */
const MenubarContent = forwardRef<HTMLDivElement, MenubarContentProps>(
  (
    {
      size: sizeProp,
      align = "start",
      side = "bottom",
      sideOffset = 4,
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
      onInteractOutside,
      onCloseAutoFocus,
      ...props
    },
    ref,
  ) => {
    const bar = useContext(MenubarContext);
    const {
      open,
      focusLastRef,
      inputRef,
      triggerRef,
      reportClosed,
      reportOpened,
    } = useContext(MenuRootContext);
    const size = sizeProp ?? bar?.size ?? "md";
    const contentRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
    // Whether the menu was closed by a press elsewhere on the page, which leaves focus where that press put it.
    const outsideRef = useRef(false);
    // Opened with ArrowUp: once Radix has put focus on its first item, move it to the last one that can have it.
    useEffect(() => {
      if (!open || !focusLastRef.current) return undefined;
      focusLastRef.current = false;
      const frame = requestAnimationFrame(() => {
        const items = contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
        );
        [...(items ?? [])]
          .reverse()
          .find((item) => !item.hasAttribute("data-disabled"))
          ?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }, [open, focusLastRef]);
    const resolvedSide = useResolvedResponsiveValue(side, "bottom");
    return (
      <MenubarPrimitive.Portal container={container}>
        <MenubarPrimitive.Content
          ref={mergedRef}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(menuStyles.content, menuSizeClass[size], className)}
          {...props}
          // The last input is recorded on the panel (`data-input`, read by Menu's stylesheet to hold the focus ring
          // back while it is `"pointer"`) and on the menu (read as the panel closes, below).
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
            outsideRef.current = true;
          }}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            // A menu that is playing its exit while another opens still hears the press or the focus that moved to the
            // new one, and Radix would take it as a dismissal of the whole bar (it closes by name, not by menu).
            if (!open) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            const outside = outsideRef.current;
            outsideRef.current = false;
            // Radix hands focus back to the trigger with a plain `focus()`, which a browser may draw a ring for even
            // though the person only used a pointer. After a pointer on the menu itself, give it back without the ring;
            // after the keyboard, leave Radix's own focus (and the ring that tells the keyboard where it is). A press
            // elsewhere on the page keeps the focus it gave.
            if (
              !event.defaultPrevented &&
              !outside &&
              inputRef.current === "pointer"
            ) {
              event.preventDefault();
              triggerRef.current?.focus({
                focusVisible: false,
              } as FocusOptions);
            }
            if (!open) queueMicrotask(reportClosed);
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <OverlayLifecycle
            open={open}
            panelRef={contentRef}
            // Only the entrance is read from the lifecycle: its close report fires when the panel unmounts, which can be
            // before Radix has put focus back, so the close is reported from `onCloseAutoFocus` above.
            onOpenChangeComplete={(done) => {
              if (done) reportOpened();
            }}
          />
          <MenuSizeContext.Provider value={size}>
            <MenuViewport>
              {/* The kit is provided here, so the items inside the panel draw with the bar's parts, while a `Menu` in a
                  panel's own content keeps the dropdown's. */}
              <MenuPrimitiveContext.Provider value={primitiveKit}>
                <ButtonGroupReset>{children}</ButtonGroupReset>
              </MenuPrimitiveContext.Provider>
            </MenuViewport>
          </MenuSizeContext.Provider>
        </MenubarPrimitive.Content>
      </MenubarPrimitive.Portal>
    );
  },
);
MenubarContent.displayName = "Menubar.Content";

type MenubarComponent = typeof MenubarRoot & {
  Menu: typeof MenubarMenu;
  Trigger: typeof MenubarTrigger;
  Content: typeof MenubarContent;
  Item: typeof menuSharedParts.Item;
  CheckboxItem: typeof menuSharedParts.CheckboxItem;
  RadioGroup: typeof menuSharedParts.RadioGroup;
  RadioItem: typeof menuSharedParts.RadioItem;
  Label: typeof menuSharedParts.Label;
  Group: typeof menuSharedParts.Group;
  Separator: typeof menuSharedParts.Separator;
  Sub: typeof menuSharedParts.Sub;
  SubTrigger: typeof menuSharedParts.SubTrigger;
  SubContent: typeof menuSharedParts.SubContent;
};

export const Menubar: MenubarComponent = Object.assign(MenubarRoot, {
  Menu: MenubarMenu,
  Trigger: MenubarTrigger,
  Content: MenubarContent,
  ...menuSharedParts,
});
