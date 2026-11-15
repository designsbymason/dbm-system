import { cx } from "@dbm-system/utils";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { forwardRef, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Icon } from "../Icon";
import type { IconTone } from "../Icon";
import styles from "./Button.module.css";
import type { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types";
import { useButtonGroup } from "./buttonGroupContext";

const variantClass: Record<ButtonVariant, string | undefined> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  tertiary: styles.variantTertiary,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
};

// Every variant's icon gets its own explicit tone rather than ever relying
// on `currentColor` inheritance from its label — `text.*` tokens are for
// text, not icons, so even where a variant's label color would otherwise
// produce the "right" icon color as an inheritance side effect (e.g.
// `secondary`/`tertiary`/`ghost`'s shared text.brand/icon.brand pairing),
// making it explicit keeps the two concerns independently adjustable and
// documents the intent directly instead of leaning on a CSS accident.
const iconToneForVariant: Record<ButtonVariant, IconTone> = {
  primary: "on-brand",
  secondary: "brand",
  tertiary: "brand",
  ghost: "brand",
  destructive: "on-danger",
};

// The neutral tone's icons: the `primary` fill is `bg.neutral`, so its icon is `on-neutral`; the rest sit on the surface or a pale
// neutral tint, in the default icon colour.
const iconToneForNeutralVariant: Record<ButtonVariant, IconTone> = {
  primary: "on-neutral",
  secondary: "default",
  tertiary: "default",
  ghost: "default",
  destructive: "on-danger",
};

const sizeClass: Record<ButtonSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForButtonSize: Record<ButtonSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

/**
 * The primary interactive action element. Five variants (`primary` is the
 * default, high-emphasis action; `destructive` for irreversible/dangerous
 * actions), five sizes, optional leading/trailing icons, a loading state
 * with an optional `loadingText`, `fullWidth` for stretching to the
 * container, and `asChild` for composing with other elements (e.g. a
 * router link styled as a button).
 *
 * @example
 * ```tsx
 * <Button>Save</Button>
 * <Button variant="destructive" leadingIcon={TrashIcon}>Delete</Button>
 * <Button isLoading loadingText="Saving…">Save</Button>
 * <Button fullWidth>Continue</Button>
 * <Button rounded>Get started</Button>
 * <Button asChild><a href="/next">Continue</a></Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant: variantProp,
      tone: toneProp,
      size: sizeProp,
      rounded: roundedProp,
      leadingIcon,
      trailingIcon,
      isLoading = false,
      loadingText,
      asChild = false,
      fullWidth = false,
      disabled,
      className,
      children,
      type = "button",
      onClick,
      onClickCapture,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    // Inside a `ButtonGroup` its variant, size and rounded are defaults for this button (its own props win), and
    // a disabled group disables it. Outside one `group` is `null` and nothing here changes.
    const group = useButtonGroup();
    const variant = variantProp ?? group?.variant ?? "primary";
    // `destructive` is always danger-coloured, so the tone (its own or the group's) has no effect on it.
    const neutral = (toneProp ?? group?.tone ?? "brand") === "neutral" && variant !== "destructive";
    const size = sizeProp ?? group?.size ?? "md";
    const rounded = roundedProp ?? group?.rounded ?? false;
    const iconSize = iconSizeForButtonSize[size];
    const iconTone = (neutral ? iconToneForNeutralVariant : iconToneForVariant)[variant];
    // `||`, not `??` — `isLoading` must disable the button even when a
    // consumer explicitly passes `disabled={false}`; `??` would let that
    // explicit `false` win and leave a "loading" button fully clickable.
    const isDisabled = disabled || group?.disabled || isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead.
    const slottedDisabled = asChild && isDisabled;
    // In `asChild` mode the label is the slotted element's own content, regardless of `loadingText`; the icons and the
    // spinner are still drawn, inside that element (see the render below).
    const effectiveLabel = !asChild && isLoading ? loadingText || children : children;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !effectiveLabel &&
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Button: no accessible name — pass visible text as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. An icon-only button with no label is invisible to screen reader users.",
        );
      }
    }

    // Capture-phase, not `onClick`: this has to run before any bubble-phase handler, including the slotted
    // child's own. Radix `Slot` runs the child's own `onClick` first and this component's second, so a
    // bubble-phase guard blocked only this component's own handler and let a link's own (a router's
    // navigation, say) run on a disabled or loading button. Same fix as `Link`'s
    // (05-component-api-conventions.md §3). `onClickCapture` from the caller still runs when not blocked.
    const handleClickCapture = (event: MouseEvent<HTMLButtonElement>) => {
      if (slottedDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClickCapture?.(event);
    };

    const decorate = (label: ReactNode) => (
      <>
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          leadingIcon && <Icon icon={leadingIcon} size={iconSize} tone={iconTone} />
        )}
        {label}
        {!isLoading && trailingIcon && <Icon icon={trailingIcon} size={iconSize} tone={iconTone} />}
      </>
    );

    return (
      <Component
        ref={ref}
        {...props}
        // These are always applied last (after `...props`) so they can
        // never be silently overridden by a same-named prop the caller
        // passes — including `aria-disabled`/`aria-busy`, which
        // TypeScript's JSX checker permits on any component regardless of
        // whether they're declared in its prop type (found and fixed on
        // Skeleton/ProgressBar/ProgressCircle/Spinner first — the same
        // ordering bug existed here too: `aria-busy={false}` or
        // `aria-disabled={false}` from a caller would have silently won
        // over Button's own computed loading/disabled state).
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={slottedDisabled || undefined}
        aria-busy={isLoading || undefined}
        // Lets a `ButtonGroup`'s stylesheet draw the right separator for this variant; absent outside a group.
        data-variant={group ? variant : undefined}
        data-tone={group && neutral ? "neutral" : undefined}
        onClick={onClick}
        onClickCapture={handleClickCapture}
        className={cx(
          styles.root,
          variantClass[variant],
          neutral && styles.toneNeutral,
          sizeClass[size],
          rounded && styles.rounded,
          fullWidth && styles.fullWidth,
          slottedDisabled && styles.disabled,
          className,
        )}
      >
        {asChild ? (
          // `Slottable`'s render form clones the slotted element with what it returns as its content: the icons (or the
          // spinner) are drawn around the element's own content, inside it, and the element is still the one rendered.
          <Slottable child={children}>{decorate}</Slottable>
        ) : (
          decorate(effectiveLabel)
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
