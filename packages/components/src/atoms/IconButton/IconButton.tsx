import { cx } from "@dbm-system/utils";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { forwardRef, isValidElement, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button.types";
import { useButtonGroup } from "../Button/buttonGroupContext";
import { Icon } from "../Icon";
import { Tooltip } from "../Tooltip";
import styles from "./IconButton.module.css";
import type { IconButtonProps } from "./IconButton.types";

const variantClass: Record<ButtonVariant, string | undefined> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  tertiary: styles.variantTertiary,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
};

const hideLabelBelowClass: Record<NonNullable<IconButtonProps["hideLabelBelow"]>, string | undefined> = {
  sm: styles.hideLabelBelowSm,
  md: styles.hideLabelBelowMd,
  lg: styles.hideLabelBelowLg,
  xl: styles.hideLabelBelowXl,
  "2xl": styles.hideLabelBelow2xl,
  "3xl": styles.hideLabelBelow3xl,
};

const sizeClass: Record<ButtonSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/** The words of some text: lower case, with punctuation and spacing as the only separators, as a speech-control tool and an accessibility checker read it. */
function wordsOf(text: string): string[] {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
}

/** Whether an accessible name holds a visible label: its words, whole and in order (WCAG 2.5.3, Label in Name). */
function nameHoldsLabel(name: string, label: string): boolean {
  const nameWords = wordsOf(name);
  const labelWords = wordsOf(label);
  if (labelWords.length === 0) return true;
  return nameWords.some((_, start) => labelWords.every((word, offset) => nameWords[start + offset] === word));
}

/**
 * An icon-only button. Shares Button's variant/size scale and loading
 * behavior, but always requires `aria-label` since there's no visible text
 * to derive an accessible name from.
 *
 * @example
 * ```tsx
 * <IconButton icon={TrashIcon} aria-label="Delete item" variant="destructive" />
 * <IconButton icon={TrashIcon} aria-label="Delete" isLoading loadingLabel="Deleting…" />
 * <IconButton icon={PlusIcon} aria-label="Add" rounded />
 * <IconButton icon={HeartIcon} aria-label="Favorite" variant="ghost" pressed={isFavorited} onPressedChange={setIsFavorited} />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant: variantProp,
      tone: toneProp,
      size: sizeProp,
      label,
      hideLabelBelow,
      isLoading = false,
      loadingLabel,
      rounded: roundedProp,
      pressed,
      defaultPressed,
      onPressedChange,
      tooltip,
      tooltipSide = "top",
      asChild = false,
      disabled,
      className,
      children,
      type = "button",
      onClick,
      onClickCapture,
      "aria-label": ariaLabel,
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
    // With `asChild` the icon, the spinner and the caption are drawn inside the slotted element (Radix `Slottable`), unless
    // that element brings content of its own: then its content is used as it is, so code that put the icon in the link
    // itself (the only way before) still draws one icon, not two.
    const slottedHasContent = asChild && isValidElement<{ children?: ReactNode }>(children) && hasContent(children.props.children);
    const drawsContent = !slottedHasContent;
    // A pill or circle has no shape for a caption, so with one `rounded` has no effect.
    const hasLabel = label !== undefined && label !== "";
    const labelled = hasLabel && drawsContent;
    const rounded = (roundedProp ?? group?.rounded ?? false) && !labelled;
    // Naming/shape mirrors Radix `Toggle`'s own `pressed`/`defaultPressed`/
    // `onPressedChange` (this system's established convention for
    // controlled/uncontrolled state, `05-component-api-conventions.md`
    // §3) — a plain button (the common case) has neither prop set, so
    // `isToggle` stays `false` and `aria-pressed` is never rendered at
    // all, not even as `"false"`.
    const isToggle =
      pressed !== undefined ||
      defaultPressed !== undefined ||
      onPressedChange !== undefined;
    const [uncontrolledPressed, setUncontrolledPressed] = useState(
      defaultPressed ?? false,
    );
    const isPressed = pressed !== undefined ? pressed : uncontrolledPressed;
    // `||`, not `??` — `isLoading` must disable the button even when a
    // consumer explicitly passes `disabled={false}`; `??` would let that
    // explicit `false` win and leave a "loading" button fully clickable.
    // Same fix as Button's identical bug.
    const isDisabled = disabled || group?.disabled || isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead. Same rationale as
    // Button's identical fix.
    const slottedDisabled = asChild && isDisabled;
    // `||`, not `??` — an explicit `loadingLabel=""` must still fall back
    // to `aria-label` while loading; `??` would let that empty string win
    // and leave the button with no accessible name at all. Same bug and
    // fix as Button's own `loadingText ?? children`.
    const effectiveAriaLabel = isLoading ? loadingLabel || ariaLabel : ariaLabel;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedAsChildPressedRef = useRef(false);
    const hasWarnedLabelIgnoredRef = useRef(false);
    const hasWarnedLabelNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !ariaLabel &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "IconButton: no accessible name — pass `aria-label` or `aria-labelledby` so assistive tech has something to announce. An icon-only button with no label is invisible to screen reader users.",
        );
      }
      if (hasLabel && !hasWarnedLabelIgnoredRef.current) {
        const ignored =
          slottedHasContent
            ? "`label` has no effect when the `asChild` element has content of its own — that content is used as it is. Leave the element empty to have the icon and the caption drawn inside it, or remove `label`."
            : roundedProp ?? group?.rounded
              ? "`rounded` has no effect while a `label` is shown — a pill or circle has no shape for an icon over a caption. Remove `rounded`, or `label`."
              : tooltip !== undefined && tooltip !== false && hideLabelBelow === undefined
                ? "`tooltip` repeats the visible `label`, which shows at every width. Remove `tooltip`, or set `hideLabelBelow` so the tooltip serves the icon-only state."
                : undefined;
        if (ignored) {
          hasWarnedLabelIgnoredRef.current = true;
          console.warn(`IconButton: ${ignored}`);
        }
      }
      if (label && ariaLabel && !nameHoldsLabel(ariaLabel, label) && !hasWarnedLabelNameRef.current) {
        hasWarnedLabelNameRef.current = true;
        console.warn(
          "IconButton: the visible `label` isn't part of the accessible name (`aria-label`) — a speech-control user says what they see, so the name must contain it as whole words, in order (WCAG 2.5.3: \"Fav\" is not in \"Favorite\"). Make `aria-label` contain the `label` text.",
        );
      }
      if (asChild && isToggle && !hasWarnedAsChildPressedRef.current) {
        hasWarnedAsChildPressedRef.current = true;
        console.warn(
          "IconButton: `aria-pressed` is not applied when `asChild` is combined with a toggle prop (`pressed`/`defaultPressed`/`onPressedChange`) — `aria-pressed` is only a valid ARIA attribute on elements whose role supports it (e.g. `button`), and `Slot` can render any element a consumer slots in, including ones that don't (e.g. a native `<a>`, whose `link` role doesn't allow it — setting it there is a real `aria-allowed-attr` violation, not just unnecessary). The pressed visual treatment (fill-weight icon, tone-specific background) still applies either way; if the slotted element itself needs `aria-pressed`, set it directly on that element instead.",
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

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isToggle) {
        const nextPressed = !isPressed;
        // Only track internal state when uncontrolled — a controlled
        // `pressed` consumer owns the value entirely; this component just
        // reports the intended next value via `onPressedChange`.
        if (pressed === undefined) {
          setUncontrolledPressed(nextPressed);
        }
        onPressedChange?.(nextPressed);
      }
      onClick?.(event);
    };

    // `true` says what the accessible name says; any other content stands in for it. `false`, `null`, an empty
    // string and `undefined` all mean no tooltip.
    const tooltipContent = tooltip === true ? effectiveAriaLabel : tooltip;
    const hasTooltip = tooltipContent !== undefined && tooltipContent !== null && tooltipContent !== false && tooltipContent !== "";

    const content = (
      <>
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <Icon icon={icon} size={size} weight={isToggle && isPressed ? "fill" : "bold"} />
        )}
        {labelled && (
          // For the eye only: the button's own name says it. `data-label` is read by the stylesheet to reserve the
          // width of the bold form a pressed toggle draws, so the box doesn't change size when it is pressed. It stays
          // while loading, so the box doesn't shrink to the square.
          <span className={styles.label} data-label={label} aria-hidden="true">
            {label}
          </span>
        )}
      </>
    );

    const button = (
      <Component
        ref={ref}
        {...props}
        // These are always applied last (after `...props`) so they can
        // never be silently overridden by a same-named prop the caller
        // passes — including `aria-disabled`/`aria-busy`, which
        // TypeScript's JSX checker permits on any component regardless of
        // whether they're declared in its prop type (same ordering bug
        // already found and fixed on Skeleton/ProgressBar/ProgressCircle/
        // Spinner/Button — `aria-busy={false}` or `aria-disabled={false}`
        // from a caller would have silently won over this component's own
        // computed loading/disabled state).
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={slottedDisabled || undefined}
        aria-busy={isLoading || undefined}
        // Lets a `ButtonGroup`'s stylesheet draw the right separator for this variant; absent outside a group.
        data-variant={group ? variant : undefined}
        data-tone={group && neutral ? "neutral" : undefined}
        // Not applied in `asChild` mode — see the dev-mode warning above:
        // `aria-pressed` is only valid on roles that support it, and `Slot`
        // can render onto an element (e.g. a native `<a>`) that doesn't.
        // The `.pressed` visual class below is unaffected — it's a pure
        // style concern, independent of this ARIA-validity constraint.
        aria-pressed={isToggle && !asChild ? isPressed : undefined}
        aria-label={effectiveAriaLabel}
        onClick={handleClick}
        onClickCapture={handleClickCapture}
        className={cx(
          styles.root,
          variantClass[variant],
          neutral && styles.toneNeutral,
          sizeClass[size],
          labelled && styles.hasLabel,
          labelled && (hideLabelBelow ? hideLabelBelowClass[hideLabelBelow] : styles.labelAlways),
          rounded && styles.rounded,
          isToggle && isPressed && styles.pressed,
          slottedDisabled && styles.disabled,
          className,
        )}
      >
        {asChild ? (
          // `Slottable`'s render form clones the slotted element with what it returns as its content, so the icon and the
          // caption land inside the link (or whatever element was given), and that element is still the one rendered.
          <Slottable child={children}>{(own: ReactNode) => (drawsContent ? content : own)}</Slottable>
        ) : (
          content
        )}
      </Component>
    );

    return hasTooltip ? (
      <Tooltip content={tooltipContent} side={tooltipSide}>
        {button}
      </Tooltip>
    ) : (
      button
    );
  },
);

IconButton.displayName = "IconButton";

/** Whether a slotted element's own children draw anything (an empty string, `false` and `null` do not). */
function hasContent(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasContent);
  return node !== undefined && node !== null && node !== false && node !== true && node !== "";
}
