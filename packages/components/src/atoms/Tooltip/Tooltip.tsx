import { cx } from "@dbm-system/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useContext } from "react";
import { TooltipProviderPresenceContext } from "./TooltipProviderContext";
import { ButtonGroupReset } from "../Button/buttonGroupContext";
import styles from "./Tooltip.module.css";
import type { TooltipProps } from "./Tooltip.types";
import { useProvidedDirection } from "../DirectionProvider/DirectionProvider";

/**
 * A short, non-interactive hint shown on hover/focus of its trigger, built
 * on Radix Tooltip. Wraps its own `Provider` by default, so no app-level
 * setup is needed — wrap a subtree in `TooltipProvider` instead when it has
 * more than one `Tooltip` and moving between them should share one timing
 * (see that component). Unlike most of this system's components, `Tooltip`
 * has no single root DOM node of its own to forward a ref to — its trigger
 * is an arbitrary child element and its content renders in a portal — so it
 * takes no `ref` prop, matching Radix's own `Tooltip.Root`. `className`/
 * `style`/`id`/`data-testid`/other native `<div>` attributes apply to the
 * tooltip's content element instead.
 *
 * @example
 * ```tsx
 * <Tooltip content="Save your changes">
 *   <Button>Save</Button>
 * </Tooltip>
 * <Tooltip content="Delete" side="bottom">
 *   <IconButton icon={TrashIcon} aria-label="Delete" />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration,
  disableHoverableContent,
  hideArrow = false,
  open,
  defaultOpen,
  onOpenChange,
  className,
  ...props
}: TooltipProps) {
  const providedDir = useProvidedDirection();
  // Whether an ambient `TooltipProvider` already wraps this subtree — when
  // it does, skip rendering our own isolated `Provider` below and rely on
  // the shared one instead (see `TooltipProviderContext` for why this is
  // the only way `skipDelayDuration` can work across separate `Tooltip`
  // instances). `delayDuration`/`disableHoverableContent` are passed to
  // `Root` exactly as received (possibly `undefined`) either way — Radix's
  // own `Root` already falls back to whichever `Provider` is in scope for
  // an unset value, ambient or our own below.
  const hasAmbientProvider = useContext(TooltipProviderPresenceContext);

  const root = (
    <TooltipPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          // Radix's `sideOffset` is a JS pixel number, not CSS — it can't
          // reference a custom property directly. 8 matches
          // `--dbm-space-2` (0.5rem), keeping the gap token-consistent
          // even though this one value can't be a literal var().
          sideOffset={8}
          className={cx(styles.content, className)}
          {...props}
          dir={props.dir ?? providedDir}
        >
          <ButtonGroupReset>{content}</ButtonGroupReset>
          {!hideArrow && <TooltipPrimitive.Arrow className={styles.arrow} />}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );

  if (hasAmbientProvider) {
    return root;
  }

  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration ?? 400}
      disableHoverableContent={disableHoverableContent ?? false}
    >
      {root}
    </TooltipPrimitive.Provider>
  );
}
