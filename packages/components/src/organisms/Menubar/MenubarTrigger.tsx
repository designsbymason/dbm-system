import { cx, mergeRefs } from "@dbm-system/utils";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import {
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Icon } from "../../atoms/Icon";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { warnOnce } from "../../internal/warnOnce";
import styles from "./Menubar.module.css";
import { iconSizeFor } from "../../internal/menu/menuParts";
import { MenuRootContext } from "../../internal/menu/MenuContext";
import { MenubarContext, MenubarMenuContext } from "./MenubarContext";
import type { MenubarActionProps, MenubarTriggerProps } from "./Menubar.types";

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
export const MenubarTrigger = forwardRef<
  HTMLButtonElement,
  MenubarTriggerProps
>(
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
export const MenubarAction = forwardRef<HTMLButtonElement, MenubarActionProps>(
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
