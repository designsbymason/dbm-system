import { SidebarSimpleIcon } from "@dbm-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { mergeDefined, mergeRefs } from "@dbm-system/utils";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, MutableRefObject } from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../atoms/Button";
import { IconButton } from "../atoms/IconButton";

const defaultLabels = { open: "Show details" };

/** The props of an aside's toggle, as `AppShell.AsideToggle` and `PageShell.AsideToggle` document them. */
export interface AsideToggleButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  icon?: PhosphorIcon;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  labels?: Partial<typeof defaultLabels>;
  /** Whether the aside's drawer is open: the button's `aria-expanded`. */
  asideOpen: boolean;
  /** Asks for the drawer to open (a press that a handler has not cancelled). */
  onAsideOpen: () => void;
  /** The shell's reference to the toggle, which the drawer gives focus back to when it closes: set to the button that was pressed. */
  toggleRef: MutableRefObject<HTMLElement | null>;
}

/**
 * The button that opens an aside's drawer, which `AppShell` and `PageShell` share: an `IconButton` that says it opens a dialog and whether it is
 * open, and tells the shell which button opened the drawer so focus can be returned to it. Each shell hides it with its own stylesheet until
 * its aside is a drawer.
 */
export const AsideToggleButton = forwardRef<HTMLButtonElement, AsideToggleButtonProps>(
  ({ icon = SidebarSimpleIcon, variant = "ghost", tone, size = "md", labels: labelsProp, asideOpen, onAsideOpen, toggleRef, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const labels = mergeDefined(defaultLabels, labelsProp);
    return (
      <IconButton
        {...props}
        ref={mergeRefs(toggleRef as MutableRefObject<HTMLButtonElement | null>, ref)}
        icon={icon}
        variant={variant}
        tone={tone}
        size={size}
        aria-label={ariaLabel ?? labels.open}
        aria-haspopup="dialog"
        aria-expanded={asideOpen}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          toggleRef.current = event.currentTarget;
          onAsideOpen();
        }}
      />
    );
  },
);
AsideToggleButton.displayName = "AsideToggleButton";
