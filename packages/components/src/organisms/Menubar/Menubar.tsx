import { DotsThreeIcon } from "@dbm-system/icons";
import {
  cx,
  mergeDefined,
  mergeRefs,
  useResolvedResponsiveValue,
  useScrollEdges,
} from "@dbm-system/utils";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { Affix } from "../../atoms/Affix";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { Icon } from "../../atoms/Icon";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  isApplePlatform,
  matchesHotkey,
  parseHotkey,
} from "../../internal/hotkey/hotkey";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import { warnOnce } from "../../internal/warnOnce";
import styles from "./Menubar.module.css";
import menuStyles from "../../internal/menu/menu.module.css";
import {
  MenuViewport,
  iconSizeFor,
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
import {
  INERT_CONTROLLER,
  MenubarContext,
  MenubarControllerContext,
  MenubarMenuContext,
  type MenubarEntry,
  type MenubarItemInfo,
} from "./MenubarContext";
import {
  useIsomorphicLayoutEffect,
  useMenubarOverflow,
} from "./useMenubarOverflow";
import type {
  MenubarActionProps,
  MenubarContentProps,
  MenubarController,
  MenubarLabels,
  MenubarMenuProps,
  MenubarProps,
  MenubarSize,
  MenubarSurface,
  MenubarTone,
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

const toneClass: Record<MenubarTone, string | undefined> = {
  neutral: styles.toneNeutral,
  brand: styles.toneBrand,
};

const surfaceClass: Record<MenubarSurface, string | undefined> = {
  ghost: styles.ghost,
  outlined: styles.outlined,
  filled: styles.filled,
};

const DEFAULT_LABELS: MenubarLabels = { more: "More" };

// The name of the menu that holds what does not fit.
const MORE = "__menubar-more";

/**
 * A desktop-style bar of menus (File, Edit, View) built on Radix Menubar: one tab stop, the arrow keys moving between
 * triggers, a menu that opens onto its first item, and a hover or arrow that moves from one open menu to the next are
 * Radix's. Reach for it for the commands of an application window or an editor; a site's navigation is
 * `NavigationMenu` and `Navbar`, a button of actions is `Menu`, and a row of buttons is `Toolbar`.
 *
 * A compound component: `Menubar.Menu` (named by its `value`) holds a `Menubar.Trigger` and a `Menubar.Content`, and the
 * content holds `Menubar.Item`, `Menubar.CheckboxItem`, `Menubar.RadioGroup` and `Menubar.RadioItem`, `Menubar.Label`,
 * `Menubar.Group`, `Menubar.Separator` and `Menubar.Sub` (with `Menubar.SubTrigger` and `Menubar.SubContent`). The item
 * parts are `Menu`'s, drawn the same, so an item takes an icon, a description, a shortcut hint and a promise. A
 * `Menubar.Action` is a button in the bar that opens no menu ("Run", "Help").
 *
 * The menus leave the page behind them usable, as a native menu bar does. A shortcut hint on an item is a label and
 * binds no key (write it with `mod`, `"mod+s"`, to have it drawn as ⌘S or Ctrl+S): the app wires the key, or gives the bar
 * `hotkeys` to open a menu from one, or opens a menu from code with its `value` or `controllerRef`.
 *
 * A bar wider than its container scrolls sideways, with a fade at each end that has more behind it, and keeps the
 * trigger that has focus in view; with `overflow="menu"` the menus that do not fit move into a "More" menu instead.
 *
 * @example
 * ```tsx
 * <Menubar aria-label="Application menu" hotkeys={{ file: "alt+f" }}>
 *   <Menubar.Menu value="file">
 *     <Menubar.Trigger>File</Menubar.Trigger>
 *     <Menubar.Content>
 *       <Menubar.Item shortcut="mod+n" onSelect={newFile}>New</Menubar.Item>
 *       <Menubar.Item shortcut="mod+s" onSelect={save}>Save</Menubar.Item>
 *       <Menubar.Separator />
 *       <Menubar.Item tone="danger" onSelect={close}>Close window</Menubar.Item>
 *     </Menubar.Content>
 *   </Menubar.Menu>
 *   <Menubar.Action onSelect={run}>Run</Menubar.Action>
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
      tone = "brand",
      overflow = "scroll",
      hotkeys,
      controllerRef,
      labels: labelOverrides,
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      loop = true,
      dir = "ltr",
      className,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [value, setValueRaw] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange,
    );
    const labels = useMemo(
      () => mergeDefined(DEFAULT_LABELS, labelOverrides),
      [labelOverrides],
    );
    const barRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, barRef), [ref]);
    const { overflowStart, overflowEnd } = useScrollEdges(barRef, "horizontal");
    const latest = useRef({ onOpenChangeComplete, value, setValueRaw });
    useEffect(() => {
      latest.current = { onOpenChangeComplete, value, setValueRaw };
    });
    const reportComplete = useCallback(
      (menu: string, open: boolean) =>
        latest.current.onOpenChangeComplete?.(menu, open),
      [],
    );

    // What is in the bar, so a menu can be opened from code and a press on what can't open is not taken for an open.
    const registry = useRef(new Map<string, MenubarEntry>());
    const handoff = useRef(false);
    const takeFocusHandoff = useCallback(() => {
      const had = handoff.current;
      handoff.current = false;
      return had;
    }, []);
    const register = useCallback((name: string, entry: MenubarEntry) => {
      registry.current.set(name, entry);
      return () => {
        if (registry.current.get(name) === entry) registry.current.delete(name);
      };
    }, []);
    // Radix opens by name, and it would "open" an action (a hover or an arrow key reaching it while a menu is open) or
    // a trigger disabled with a reason. An action closes the open menu and takes focus; the other is ignored.
    const setValue = useCallback((next: string) => {
      const entry = next === "" ? undefined : registry.current.get(next);
      if (entry && (entry.kind === "action" || entry.blocked())) {
        if (entry.kind === "action") {
          // The menu that closes would give focus back to its own trigger, so it is told to leave it.
          if (latest.current.value !== "") {
            handoff.current = true;
            latest.current.setValueRaw("");
          }
          entry.trigger()?.focus();
        }
        return;
      }
      latest.current.setValueRaw(next);
    }, []);
    const openFromCode = useCallback((name: string): boolean => {
      const entry = registry.current.get(name);
      if (!entry || entry.kind !== "menu" || entry.blocked()) return false;
      if (entry.focusFirstRef) entry.focusFirstRef.current = true;
      entry.trigger()?.focus();
      latest.current.setValueRaw(name);
      return true;
    }, []);

    // The controller's methods read the latest state, so its identity never changes and a caller can keep it.
    const controller = useMemo<MenubarController>(
      () => ({
        open: openFromCode,
        close: () => {
          if (latest.current.value !== "") latest.current.setValueRaw("");
        },
        get value() {
          return latest.current.value;
        },
      }),
      [openFromCode],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // `hotkeys` is an object an app writes inline, so what is bound is read from its content, not its identity.
    const hotkeysKey = hotkeys ? JSON.stringify(hotkeys) : "";
    useEffect(() => {
      if (!hotkeysKey) return undefined;
      const bindings = Object.entries(
        JSON.parse(hotkeysKey) as Record<string, string | false>,
      ).flatMap(([menu, combo]) => {
        if (combo === false) return [];
        const parsed = parseHotkey(combo);
        if (!parsed) {
          warnOnce(
            `Menubar: the hotkey "${combo}" for "${menu}" is not a key combination (modifiers and a key joined by +, such as "alt+f"), so it binds nothing.`,
          );
          return [];
        }
        return [[menu, parsed] as const];
      });
      if (bindings.length === 0) return undefined;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.repeat || event.isComposing) return;
        const apple = isApplePlatform();
        const hit = bindings.find(([, parsed]) =>
          matchesHotkey(event, parsed, apple),
        );
        if (!hit) return;
        // A key for a menu that is not in the bar (it moved into "More", or is not mounted) is left to the browser.
        if (openFromCode(hit[0])) event.preventDefault();
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [hotkeysKey, openFromCode]);

    // `overflow="menu"`: each menu and action tells the bar what it is as it mounts (so they can sit inside a component of
    // the app's own), the bar puts them in the order they are drawn in, and what does not fit is drawn in "More".
    const overflowMenu = overflow === "menu";
    const infos = useRef(new Map<string, MenubarItemInfo>());
    const [version, bumpVersion] = useReducer((count: number) => count + 1, 0);
    const [ordered, setOrdered] = useState<
      Array<{ id: string; info: MenubarItemInfo }>
    >([]);
    const registerItem = useCallback((id: string, info: MenubarItemInfo) => {
      infos.current.set(id, info);
      bumpVersion();
    }, []);
    const unregisterItem = useCallback((id: string) => {
      if (infos.current.delete(id)) bumpVersion();
    }, []);
    useIsomorphicLayoutEffect(() => {
      if (!overflowMenu) {
        setOrdered((current) => (current.length === 0 ? current : []));
        return;
      }
      const position = (info: MenubarItemInfo) => info.slot();
      const entries = [...infos.current.entries()].map(([id, info]) => ({
        id,
        info,
      }));
      entries.sort((a, b) => {
        const first = position(a.info);
        const second = position(b.info);
        if (!first || !second) return first ? -1 : second ? 1 : 0;
        return first.compareDocumentPosition(second) &
          Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1;
      });
      setOrdered(entries);
    }, [version, overflowMenu]);
    const signature = `${size}|${dir}|${labels.more}|${ordered.map(({ id, info }) => `${id}:${typeof info.label === "string" ? info.label : ""}`).join("|")}`;
    const shown = useMenubarOverflow({
      enabled: overflowMenu,
      barRef,
      count: ordered.length,
      signature,
    });
    const hidden = useMemo(() => ordered.slice(shown), [ordered, shown]);
    const hiddenIds = useMemo<ReadonlySet<string>>(
      () => new Set(hidden.map(({ id }) => id)),
      [hidden],
    );
    // A menu that has moved into "More" can't stay open under its own name.
    const hiddenNames = hidden.map(({ info }) => info.value ?? "").join("|");
    useEffect(() => {
      if (hiddenNames && value !== "" && hiddenNames.split("|").includes(value))
        latest.current.setValueRaw("");
    }, [hiddenNames, value]);

    const context = useMemo(
      () => ({
        value,
        setValue,
        size,
        dir,
        reportComplete,
        register,
        takeFocusHandoff,
        overflowMenu,
        hiddenIds,
        registerItem,
        unregisterItem,
      }),
      [
        value,
        setValue,
        size,
        dir,
        reportComplete,
        register,
        takeFocusHandoff,
        overflowMenu,
        hiddenIds,
        registerItem,
        unregisterItem,
      ],
    );
    // Radix takes `dir` for its keys and does not put it on the element, so the bar draws its own element with it (a
    // right-to-left bar lays its triggers out from the right), which Radix then gives its role and focus handling to.
    const bar = (
      <MenubarPrimitive.Root
        asChild
        value={value}
        onValueChange={setValue}
        loop={loop}
        dir={dir}
      >
        <div
          ref={mergedRef}
          className={cx(
            styles.root,
            sizeClass[size],
            surfaceClass[surface],
            toneClass[tone],
            sticky && styles.sticky,
            className,
          )}
          {...props}
          dir={dir}
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
          {overflowMenu && hidden.length > 0 && (
            <MoreMenu
              hidden={hidden.map(({ info }) => info)}
              label={labels.more}
            />
          )}
        </div>
      </MenubarPrimitive.Root>
    );
    return (
      <MenubarContext.Provider value={context}>
        <MenubarControllerContext.Provider value={controller}>
          {sticky ? (
            <Affix
              asChild
              offset={stickyOffset}
              scrollContainerRef={scrollContainerRef}
            >
              {bar}
            </Affix>
          ) : (
            bar
          )}
        </MenubarControllerContext.Provider>
      </MenubarContext.Provider>
    );
  },
);
MenubarRoot.displayName = "Menubar";

/** The menu that holds the menus and actions that did not fit: each menu is a submenu, each action an item. */
function MoreMenu({
  hidden,
  label,
}: {
  hidden: MenubarItemInfo[];
  label: string;
}) {
  return (
    <MenubarMenu value={MORE}>
      <MenubarTrigger
        icon={DotsThreeIcon}
        data-menubar-more=""
        aria-label={label}
        title={label}
      />
      <MenubarContent>
        {hidden.map((item, index) =>
          item.kind === "menu" ? (
            <menuSharedParts.Sub key={item.value ?? index}>
              <menuSharedParts.SubTrigger
                icon={item.icon}
                disabled={item.disabled}
              >
                {item.label}
              </menuSharedParts.SubTrigger>
              <menuSharedParts.SubContent size={item.contentSize}>
                {item.content}
              </menuSharedParts.SubContent>
            </menuSharedParts.Sub>
          ) : (
            <menuSharedParts.Item
              key={index}
              icon={item.icon}
              disabled={item.disabled}
              onSelect={(event) =>
                item.onSelect?.(event as unknown as SyntheticEvent)
              }
            >
              {item.label}
            </menuSharedParts.Item>
          ),
        )}
      </MenubarContent>
    </MenubarMenu>
  );
}

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
  const register = bar?.register;
  const overflowMenu = bar?.overflowMenu ?? false;
  const registerItem = bar?.registerItem;
  const unregisterItem = bar?.unregisterItem;
  const id = useId();
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const isMore = value === MORE;
  const hidden = bar?.hiddenIds.has(id) ?? false;
  const hiddenRef = useRef(hidden);
  useEffect(() => {
    hiddenRef.current = hidden;
  });
  const dir = bar?.dir ?? "ltr";
  const reportComplete = bar?.reportComplete;
  const focusLastRef = useRef(false);
  const focusFirstRef = useRef(false);
  const blockedRef = useRef(false);
  const inputRef = useRef<"pointer" | "keyboard" | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const latestOpen = useRef(open);
  useEffect(() => {
    latestOpen.current = open;
  });
  useEffect(
    () =>
      register?.(value, {
        kind: "menu",
        trigger: () => triggerRef.current,
        blocked: () => blockedRef.current || hiddenRef.current,
        focusFirstRef,
      }),
    [register, value],
  );
  // What the "More" menu needs to draw this menu as a submenu: its label, icon and items, read from its own children.
  useEffect(() => {
    if (!overflowMenu || isMore || !registerItem) return;
    const inside = Children.toArray(children).filter(
      isValidElement,
    ) as ReactElement<Record<string, unknown>>[];
    const trigger = inside.find((node) => node.type === MenubarTrigger);
    const panel = inside.find((node) => node.type === MenubarContent);
    registerItem(id, {
      kind: "menu",
      value,
      label: (trigger?.props.children as ReactNode) ?? null,
      icon: trigger?.props.icon as MenubarTriggerProps["icon"],
      disabled: Boolean(trigger?.props.disabled),
      content: panel?.props.children as ReactNode,
      contentSize: panel?.props.size as MenubarSize | undefined,
      slot: () => slotRef.current,
    });
  }, [overflowMenu, isMore, registerItem, id, value, children]);
  useEffect(() => () => unregisterItem?.(id), [unregisterItem, id]);
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
  const setBlocked = useCallback((blocked: boolean) => {
    blockedRef.current = blocked;
  }, []);
  const takeFocusFirst = useCallback(() => {
    const had = focusFirstRef.current;
    focusFirstRef.current = false;
    return had;
  }, []);
  const menu = useMemo(
    () => ({ value, setBlocked, takeFocusFirst }),
    [value, setBlocked, takeFocusFirst],
  );
  return (
    <>
      {overflowMenu && !isMore && (
        <span hidden ref={slotRef} data-menubar-slot="" />
      )}
      {hidden ? null : (
        <MenubarMenuContext.Provider value={menu}>
          <MenuRootContext.Provider value={context}>
            <MenubarPrimitive.Menu value={value}>
              {children}
            </MenubarPrimitive.Menu>
          </MenuRootContext.Provider>
        </MenubarMenuContext.Provider>
      )}
    </>
  );
}
MenubarMenu.displayName = "Menubar.Menu";

/** What a trigger or an action draws inside its button: an optional icon, the label, optional trailing content and the reason, hidden, that describes it. */
function TriggerBody({
  icon,
  trailing,
  reason,
  reasonId,
  children,
}: {
  icon: MenubarTriggerProps["icon"];
  trailing: ReactNode;
  reason: ReactNode;
  reasonId: string;
  children: ReactNode;
}) {
  const bar = useContext(MenubarContext);
  const size = bar?.size ?? "md";
  const hasLabel =
    children !== undefined && children !== null && children !== false;
  return (
    <>
      {icon && (
        <span className={styles.icon}>
          <Icon icon={icon} size={iconSizeFor[size]} tone="default" />
        </span>
      )}
      {hasLabel && <span className={styles.label}>{children}</span>}
      {trailing !== undefined && trailing !== null && (
        <span className={styles.trailing}>{trailing}</span>
      )}
      {reason !== undefined && reason !== null && (
        <VisuallyHidden id={reasonId} aria-hidden="true">
          {reason}
        </VisuallyHidden>
      )}
    </>
  );
}

/**
 * The bar's button that opens a menu: "File", "Edit". Renders a native `<button>` with `role="menuitem"`. Enter, Space,
 * ArrowDown and ArrowUp open its menu, the last two placing focus on the first or the last item, and Left and Right
 * move to the next trigger. A disabled trigger opens nothing; with a `disabledReason` it stays focusable and says why.
 */
const MenubarTrigger = forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  (
    {
      asChild = false,
      icon,
      trailing,
      disabled = false,
      disabledReason,
      className,
      children,
      onKeyDown,
      onPointerDown,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const { open, openToLast, inputRef, triggerRef } =
      useContext(MenuRootContext);
    const menu = useContext(MenubarMenuContext);
    const reasonId = useId();
    const mergedRef = useMemo(
      () => mergeRefs(ref, triggerRef),
      [ref, triggerRef],
    );
    const hasReason =
      disabled && disabledReason !== undefined && disabledReason !== null;
    const reasonWithoutDisabled =
      !disabled && disabledReason !== undefined && disabledReason !== null;
    const setBlocked = menu?.setBlocked;
    // A trigger with a reason is not disabled to Radix (it would leave the tab order and the arrow keys): the bar
    // refuses to open it instead, and it says it is unavailable itself.
    useEffect(() => {
      if (!setBlocked) return undefined;
      setBlocked(hasReason);
      return () => setBlocked(false);
    }, [setBlocked, hasReason]);
    useEffect(() => {
      if (reasonWithoutDisabled) {
        warnOnce(
          "Menubar.Trigger: `disabledReason` has no effect on a trigger that is not `disabled` — it explains why a trigger can't be opened. Add `disabled`, or remove `disabledReason`.",
        );
      }
    }, [reasonWithoutDisabled]);
    const trigger = (
      <MenubarPrimitive.Trigger
        ref={mergedRef}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        data-menubar-item=""
        {...props}
        disabled={disabled && !hasReason}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          inputRef.current = "pointer";
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          inputRef.current = "keyboard";
          // ArrowDown, Enter and Space are Radix's. ArrowUp opens too, onto the last item, as the menu-button pattern
          // allows.
          if (event.defaultPrevented || event.key !== "ArrowUp" || disabled)
            return;
          event.preventDefault();
          openToLast();
        }}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-describedby={
          [ariaDescribedBy, hasReason ? reasonId : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...(hasReason ? { "aria-disabled": true, "data-disabled": "" } : {})}
      >
        {asChild ? (
          children
        ) : (
          <TriggerBody
            icon={icon}
            trailing={trailing}
            reason={hasReason ? disabledReason : undefined}
            reasonId={reasonId}
          >
            {children}
          </TriggerBody>
        )}
      </MenubarPrimitive.Trigger>
    );
    return hasReason ? (
      <Tooltip content={disabledReason} side="bottom">
        {trigger}
      </Tooltip>
    ) : (
      trigger
    );
  },
);
MenubarTrigger.displayName = "Menubar.Trigger";

/**
 * A button in the bar that opens no menu ("Run", "Help"). It takes its place in the bar's arrow-key order beside the
 * triggers and runs `onSelect` on a click, Enter or Space; choosing it closes any menu that is open, and so does moving
 * onto it. With `asChild` it is the element you give it, such as a link.
 */
const MenubarAction = forwardRef<HTMLButtonElement, MenubarActionProps>(
  (
    {
      asChild = false,
      icon,
      trailing,
      disabled = false,
      disabledReason,
      onSelect,
      className,
      children,
      onClick,
      onKeyDown,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const bar = useContext(MenubarContext);
    const name = useId();
    const reasonId = useId();
    const elementRef = useRef<HTMLButtonElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, elementRef), [ref]);
    const register = bar?.register;
    const overflowMenu = bar?.overflowMenu ?? false;
    const registerItem = bar?.registerItem;
    const unregisterItem = bar?.unregisterItem;
    const slotRef = useRef<HTMLSpanElement | null>(null);
    const hidden = bar?.hiddenIds.has(name) ?? false;
    useEffect(
      () =>
        register?.(name, {
          kind: "action",
          trigger: () => elementRef.current,
          blocked: () => true,
        }),
      [register, name],
    );
    // What the "More" menu needs to draw this action as an item.
    useEffect(() => {
      if (!overflowMenu || !registerItem) return;
      registerItem(name, {
        kind: "action",
        label: children,
        icon,
        disabled,
        onSelect,
        slot: () => slotRef.current,
      });
    }, [overflowMenu, registerItem, name, children, icon, disabled, onSelect]);
    useEffect(() => () => unregisterItem?.(name), [unregisterItem, name]);
    const hasReason =
      disabled && disabledReason !== undefined && disabledReason !== null;
    const unavailable = disabled || hasReason;
    const action = (
      <MenubarPrimitive.Trigger
        ref={mergedRef}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        data-menubar-item=""
        {...props}
        disabled={disabled && !hasReason}
        onClick={(event) => {
          onClick?.(event);
          // A click a key made (detail 0) was handled on the key itself.
          if (event.defaultPrevented || event.detail === 0 || unavailable)
            return;
          onSelect?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter" || event.key === " ") {
            // Radix would open the "menu" this stands in for.
            event.preventDefault();
            if (!unavailable) onSelect?.(event);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
          }
        }}
        role="menuitem"
        aria-haspopup={undefined}
        aria-expanded={undefined}
        aria-controls={undefined}
        aria-describedby={
          [ariaDescribedBy, hasReason ? reasonId : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...(hasReason ? { "aria-disabled": true, "data-disabled": "" } : {})}
      >
        {asChild ? (
          children
        ) : (
          <TriggerBody
            icon={icon}
            trailing={trailing}
            reason={hasReason ? disabledReason : undefined}
            reasonId={reasonId}
          >
            {children}
          </TriggerBody>
        )}
      </MenubarPrimitive.Trigger>
    );
    return (
      <>
        {overflowMenu && <span hidden ref={slotRef} data-menubar-slot="" />}
        {hidden ? null : (
          <MenubarPrimitive.Menu value={name}>
            {hasReason ? (
              <Tooltip content={disabledReason} side="bottom">
                {action}
              </Tooltip>
            ) : (
              action
            )}
          </MenubarPrimitive.Menu>
        )}
      </>
    );
  },
);
MenubarAction.displayName = "Menubar.Action";

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
    const menu = useContext(MenubarMenuContext);
    // Opened by a key of the app's own (`hotkeys`, or the controller): put focus on the first item that can have it,
    // as the key on the trigger would.
    useEffect(() => {
      if (!open || !menu?.takeFocusFirst()) return undefined;
      const frame = requestAnimationFrame(() => {
        const items = contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
        );
        [...(items ?? [])]
          .find((item) => !item.hasAttribute("data-disabled"))
          ?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }, [open, menu]);
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
            // Focus went to an action beside the triggers, which the closing menu must not take back.
            if (!open && bar?.takeFocusHandoff()) {
              outsideRef.current = false;
              event.preventDefault();
              queueMicrotask(reportClosed);
              return;
            }
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
  Action: typeof MenubarAction;
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
  Action: MenubarAction,
  Content: MenubarContent,
  ...menuSharedParts,
});

/**
 * The controls of the nearest `Menubar` (the same object `controllerRef` hands out), for a part rendered inside it:
 * open a menu by its `value`, and close it. Outside a `Menubar` it controls nothing and warns in development.
 *
 * @example
 * ```tsx
 * function FileButton() {
 *   const bar = useMenubarController();
 *   return <Button onClick={() => bar.open("file")}>File…</Button>;
 * }
 * ```
 */
export function useMenubarController(): MenubarController {
  const controller = useContext(MenubarControllerContext);
  const outside = controller === null;
  useEffect(() => {
    if (outside)
      warnOnce(
        "useMenubarController: called outside a <Menubar>, so it controls nothing. Call it from a component rendered inside the bar.",
      );
  }, [outside]);
  return controller ?? INERT_CONTROLLER;
}
