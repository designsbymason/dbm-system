import { cx, mergeDefined, mergeRefs, useScrollEdges } from "@dbm-system/utils";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Affix } from "../../atoms/Affix";
import { warnOnce } from "../../internal/warnOnce";
import styles from "./Menubar.module.css";
import { menuSharedParts } from "../../internal/menu/menuParts";
import { useControllableState } from "../../internal/menu/MenuContext";
import {
  INERT_CONTROLLER,
  MenubarContext,
  MenubarControllerContext,
  type MenubarEntry,
  type MenubarItemInfo,
} from "./MenubarContext";
import { MenubarContent } from "./MenubarContent";
import { MenubarMenu } from "./MenubarMenu";
import { MenubarMoreMenu } from "./MenubarMoreMenu";
import { MenubarAction, MenubarTrigger } from "./MenubarTrigger";
import {
  useIsomorphicLayoutEffect,
  useMenubarOverflow,
} from "./useMenubarOverflow";
import { useMenubarHotkeys } from "./useMenubarHotkeys";
import { useDirection } from "../../atoms/DirectionProvider";
import type {
  MenubarController,
  MenubarLabels,
  MenubarProps,
  MenubarSize,
  MenubarSurface,
  MenubarTone,
} from "./Menubar.types";

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
      dir: dirProp,
      className,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
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

    // A menubar is a landmark-like widget a page may hold more than one of, so it needs a name to be told apart.
    const named = Boolean(props["aria-label"] || props["aria-labelledby"]);
    useEffect(() => {
      if (!named) {
        warnOnce(
          'Menubar: give it an accessible name with `aria-label` ("Application menu") or `aria-labelledby`, so a screen reader can tell it from any other menu bar on the page.',
        );
      }
    }, [named]);

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
      // Whatever was handed to an action has been dealt with once another menu opens.
      if (next !== "") handoff.current = false;
      latest.current.setValueRaw(next);
    }, []);
    const openFromCode = useCallback((name: string): boolean => {
      const entry = registry.current.get(name);
      if (!entry || entry.kind !== "menu" || entry.blocked()) return false;
      if (entry.focusFirstRef) entry.focusFirstRef.current = true;
      entry.trigger()?.focus();
      handoff.current = false;
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

    useMenubarHotkeys(hotkeys, openFromCode);

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
            <MenubarMoreMenu
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
