import * as MenubarPrimitive from "@radix-ui/react-menubar";
import {
  Children,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  DEFAULT_MENU_LABELS,
  MenuRootContext,
} from "../../internal/menu/MenuContext";
import {
  MORE_MENU,
  MenubarContext,
  MenubarMenuContext,
} from "./MenubarContext";
import { MenubarContent } from "./MenubarContent";
import { MenubarTrigger } from "./MenubarTrigger";
import type {
  MenubarMenuProps,
  MenubarSize,
  MenubarTriggerProps,
} from "./Menubar.types";

/**
 * One menu of the bar: a `Menubar.Trigger` and the `Menubar.Content` it opens. `value` names it, and is what the bar's
 * own `value` holds while it is open. It renders no element of its own, so it takes no `ref`, `className` or `style`.
 */
export function MenubarMenu({ value, children }: MenubarMenuProps) {
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
  const isMore = value === MORE_MENU;
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
