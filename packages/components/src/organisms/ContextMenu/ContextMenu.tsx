import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { registerMenuInvoker } from "../../internal/overlay/menuInvokers";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import menuStyles from "../Menu/Menu.module.css";
import { menuSharedParts, menuSizeClass, MenuViewport } from "../Menu/Menu";
import {
  DEFAULT_MENU_LABELS,
  MenuPrimitiveContext,
  MenuRootContext,
  MenuSizeContext,
  useControllableState,
  type MenuPrimitiveKit,
} from "../Menu/MenuContext";
import styles from "./ContextMenu.module.css";
import {
  ContextMenuControllerContext,
  ContextMenuTriggerNodeContext,
  INERT_CONTROLLER,
  matchesKeyCombo,
} from "./ContextMenuContext";
import type {
  ContextMenuContentProps,
  ContextMenuController,
  ContextMenuProps,
  ContextMenuTriggerProps,
} from "./ContextMenu.types";

// Radix ContextMenu's item, group and submenu parts, which the shared parts draw with inside a `ContextMenu`'s panel.
const primitiveKit: MenuPrimitiveKit = ContextMenuPrimitive;

/**
 * A menu of actions that opens where the pointer is pressed, built on Radix ContextMenu: the arrow keys, typeahead,
 * Home/End, Escape and focus return, `role="menu"` with `menuitem`s, the long press on a touch screen and the
 * context-menu key are Radix's. Reach for it for actions on the thing under the pointer (a file, a row, a card, a
 * point on a canvas); a menu opened from a button is `Menu`.
 *
 * A context menu is a shortcut and never the only way to an action: it can't be found by someone who doesn't know to
 * look, and a touch screen needs a long press. Every action in it should also be reachable from a visible control.
 *
 * A compound component: `ContextMenu.Trigger` (the area) and `ContextMenu.Content` go inside `ContextMenu`, and the
 * content holds `ContextMenu.Item`, `ContextMenu.CheckboxItem`, `ContextMenu.RadioGroup` and `ContextMenu.RadioItem`,
 * `ContextMenu.Label`, `ContextMenu.Group`, `ContextMenu.Separator` and `ContextMenu.Sub` (with
 * `ContextMenu.SubTrigger` and `ContextMenu.SubContent`). The item parts are `Menu`'s, drawn the same.
 *
 * `ContextMenu` itself renders no DOM element, so it takes no `ref`, `className`, `style`, `id` or `data-testid`;
 * those apply to the parts, each of which forwards its own ref.
 *
 * It is modal by default, as a native menu is: the page behind is inert while it is open and a press outside only
 * closes it. The panel is portaled to the page and sits above a `Dialog` it was opened from.
 *
 * Code opens it too: `controllerRef` (or `useContextMenuController()` inside) gives `openAt({ x, y })`, `openFrom(element)`
 * and `close()`, and the trigger's `openOnKeys` names keys that open it from the focused element (macOS has no
 * context-menu key).
 *
 * @example
 * ```tsx
 * <ContextMenu>
 *   <ContextMenu.Trigger asChild tabIndex={0}>
 *     <li>quarterly-report.pdf</li>
 *   </ContextMenu.Trigger>
 *   <ContextMenu.Content>
 *     <ContextMenu.Item icon={PencilIcon} shortcut="F2" onSelect={rename}>Rename</ContextMenu.Item>
 *     <ContextMenu.Item icon={CopyIcon} onSelect={duplicate}>Duplicate</ContextMenu.Item>
 *     <ContextMenu.Separator />
 *     <ContextMenu.Item icon={TrashIcon} tone="danger" onSelect={remove}>Delete</ContextMenu.Item>
 *   </ContextMenu.Content>
 * </ContextMenu>
 * ```
 */
function ContextMenuRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
  dir = "ltr",
  presentation = "menu",
  labels: labelOverrides,
  controllerRef,
}: ContextMenuProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const sheet = useResolvedResponsiveValue(presentation, "menu") === "sheet";
  const labels = useMemo(() => mergeDefined(DEFAULT_MENU_LABELS, labelOverrides), [labelOverrides]);
  const inputRef = useRef<"pointer" | "keyboard" | null>(null);
  const focusLastRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const latest = useRef({ open: isOpen, onOpenChangeComplete });
  useEffect(() => {
    latest.current = { open: isOpen, onOpenChangeComplete };
  });
  const close = useCallback(() => {
    // An async item can resolve after the menu was dismissed another way; it has nothing left to close.
    if (latest.current.open) setOpen(false);
  }, [setOpen]);
  const reportClosed = useCallback(() => latest.current.onOpenChangeComplete?.(false), []);
  const reportOpened = useCallback(() => latest.current.onOpenChangeComplete?.(true), []);
  // A context menu has no trigger button to press ArrowUp on, so there is nothing to open it onto its last item.
  const openToLast = useCallback(() => undefined, []);
  const value = useMemo(
    () => ({ open: isOpen, dir, openToLast, focusLastRef, inputRef, triggerRef, close, reportClosed, reportOpened, sheet, labels }),
    [isOpen, dir, openToLast, close, reportClosed, reportOpened, sheet, labels],
  );
  // The controller's methods read the latest state, so its identity never changes and a caller can keep it.
  const triggerNodeRef = useRef<HTMLElement | null>(null);
  const latestDir = useRef(dir);
  useEffect(() => {
    latestDir.current = dir;
  });
  const controller = useMemo<ContextMenuController>(() => {
    // Radix opens the menu from a `contextmenu` event on its trigger, at the event's own coordinates, so asking for
    // a point is sending it that event. It bubbles, as a real one does, because React listens at the root.
    const openAt: ContextMenuController["openAt"] = ({ x, y }) => {
      const node = triggerNodeRef.current;
      if (!node || node.hasAttribute("data-disabled")) return false;
      node.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
      return true;
    };
    return {
      openAt,
      openFrom: (element) => {
        const rect = element.getBoundingClientRect();
        return openAt({ x: latestDir.current === "rtl" ? rect.right : rect.left, y: rect.bottom });
      },
      close,
      get open() {
        return latest.current.open;
      },
    };
  }, [close]);
  useImperativeHandle(controllerRef, () => controller, [controller]);
  return (
    <MenuRootContext.Provider value={value}>
      <ContextMenuControllerContext.Provider value={controller}>
        <ContextMenuTriggerNodeContext.Provider value={triggerNodeRef}>
          <ContextMenuPrimitive.Root open={isOpen} onOpenChange={setOpen} modal={modal} dir={dir}>
            {children}
          </ContextMenuPrimitive.Root>
        </ContextMenuTriggerNodeContext.Provider>
      </ContextMenuControllerContext.Provider>
    </MenuRootContext.Provider>
  );
}

/**
 * The area a right-click, a long press or the context-menu key opens the menu from. Renders a block `<span>` by
 * default; pass `asChild` to put the behaviour on a row, a card or a canvas of your own. While the menu is open it
 * carries `data-state="open"`, so the thing it was opened on can show it.
 */
const ContextMenuTrigger = forwardRef<HTMLSpanElement, ContextMenuTriggerProps>(
  ({ asChild = false, className, openOnKeys, onPointerDown, onKeyDown, onContextMenu, ...props }, ref) => {
    const { inputRef, triggerRef } = useContext(MenuRootContext);
    const controller = useContext(ContextMenuControllerContext) ?? INERT_CONTROLLER;
    const nodeRef = useContext(ContextMenuTriggerNodeContext);
    const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref, nodeRef]);
    return (
      <ContextMenuPrimitive.Trigger
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
          if (event.defaultPrevented || !openOnKeys?.some((combo) => matchesKeyCombo(event.nativeEvent, combo))) return;
          // Under the element that has focus, which may be a cell or a button inside the area.
          event.preventDefault();
          controller.openFrom(event.target as Element);
        }}
        onContextMenu={(event) => {
          onContextMenu?.(event);
          // Where focus is as the menu opens is where it goes back to: Radix returns it only to a trigger it can focus.
          const active = document.activeElement;
          triggerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
        }}
      />
    );
  },
);
ContextMenuTrigger.displayName = "ContextMenu.Trigger";

/**
 * The floating panel, rendered in a portal on the document body and placed at the point that was pressed. It scrolls
 * when taller than the room there is, and takes the row size for every item inside it.
 */
const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(
  (
    {
      size = "md",
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
    const { open, inputRef, triggerRef, reportClosed, reportOpened, sheet } = useContext(MenuRootContext);
    const contentRef = useRef<HTMLDivElement | null>(null);
    // A dialog an item opens gives focus back to the element the menu was opened on, which it finds from the panel.
    // The panel mounts a render after the root opens (the portal waits for its first commit), so this is a ref callback.
    const registerInvoker = useCallback(
      (panel: HTMLDivElement | null) => {
        if (panel && triggerRef.current) registerMenuInvoker(panel, triggerRef.current);
      },
      [triggerRef],
    );
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef, registerInvoker), [ref, registerInvoker]);
    return (
      <ContextMenuPrimitive.Portal container={container}>
        <ContextMenuPrimitive.Content
          ref={mergedRef}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(menuStyles.content, sheet && menuStyles.sheet, menuSizeClass[size], className)}
          {...props}
          data-presentation={sheet ? "sheet" : undefined}
          // Which kind of input was used last is recorded on the panel (`data-input`, read by Menu's stylesheet to hold
          // the focus ring back while it is `"pointer"`) and on the root (read as the panel closes, below).
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
            // What had focus as the menu opened (found by the trigger), which focus goes back to.
            const target = triggerRef.current;
            triggerRef.current = null;
            // After a pointer, give focus back without the ring a plain `focus()` can draw; after the keyboard, leave
            // Radix's own return and the ring that tells the keyboard where it is.
            if (!event.defaultPrevented && inputRef.current === "pointer" && target?.isConnected) {
              event.preventDefault();
              target.focus({ focusVisible: false } as FocusOptions);
            }
            // The menu has closed and focus is going back (Radix does it after this handler returns, so report from a
            // microtask). A close that React's StrictMode only simulates happens while still open, and is skipped.
            if (!open) queueMicrotask(reportClosed);
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <OverlayLifecycle
            open={open}
            panelRef={contentRef}
            // Only the entrance is read from the lifecycle: its close report fires when the panel unmounts, which can
            // be before focus has been put back, so the close is reported from `onCloseAutoFocus` above.
            onOpenChangeComplete={(done) => {
              if (done) reportOpened();
            }}
          />
          {/* The page behind a sheet is dimmed; a press on it is a press outside the panel, which closes the menu. */}
          {sheet && <Backdrop open data-menu-scrim="" />}
          <MenuSizeContext.Provider value={size}>
            <MenuViewport>
              {/* The kit is provided here, not at the root: the items inside the panel draw with the context menu's
                  parts, while a `Menu` in the trigger area (a row with its own "more" button) keeps the dropdown's. */}
              <MenuPrimitiveContext.Provider value={primitiveKit}>
                <ButtonGroupReset>{children}</ButtonGroupReset>
              </MenuPrimitiveContext.Provider>
            </MenuViewport>
          </MenuSizeContext.Provider>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    );
  },
);
ContextMenuContent.displayName = "ContextMenu.Content";

type ContextMenuComponent = typeof ContextMenuRoot & {
  Trigger: typeof ContextMenuTrigger;
  Content: typeof ContextMenuContent;
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

export const ContextMenu: ContextMenuComponent = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  ...menuSharedParts,
});

/**
 * The controls of the nearest `ContextMenu`, for a part rendered inside it (the same object `controllerRef` hands out):
 * open it where you like, from an element, and close it. Outside a `ContextMenu` it controls nothing and warns in
 * development.
 *
 * @example
 * ```tsx
 * function ActionsButton() {
 *   const menu = useContextMenuController();
 *   return <Button onClick={(event) => menu.openFrom(event.currentTarget)}>Actions</Button>;
 * }
 * ```
 */
export function useContextMenuController(): ContextMenuController {
  const controller = useContext(ContextMenuControllerContext);
  const outside = controller === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outside) {
      console.warn("useContextMenuController: called outside a <ContextMenu>, so it controls nothing. Call it from a component rendered inside the menu.");
    }
  }, [outside]);
  return controller ?? INERT_CONTROLLER;
}
