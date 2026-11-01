import { cx, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { forwardRef, useContext, useEffect, useMemo, useRef } from "react";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import menuStyles from "../../internal/menu/menu.module.css";
import {
  MenuViewport,
  sizeClass as menuSizeClass,
} from "../../internal/menu/menuParts";
import {
  MenuPrimitiveContext,
  MenuRootContext,
  MenuSizeContext,
  type MenuPrimitiveKit,
} from "../../internal/menu/MenuContext";
import { MenubarContext, MenubarMenuContext } from "./MenubarContext";
import type { MenubarContentProps } from "./Menubar.types";

// Radix Menubar's item, group and submenu parts, which the shared parts draw with inside a `Menubar`'s panels.
const primitiveKit: MenuPrimitiveKit = MenubarPrimitive;

/**
 * The floating panel of a menu, rendered in a portal on the document body and placed under its trigger. It scrolls
 * when taller than the room there is, and takes the row size for every item inside it (by default the bar's).
 */
export const MenubarContent = forwardRef<HTMLDivElement, MenubarContentProps>(
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
