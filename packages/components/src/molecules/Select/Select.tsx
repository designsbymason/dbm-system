import { CaretDownIcon, CheckIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeRefs } from "@dbm-system/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cloneElement, forwardRef, isValidElement, useId, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import styles from "./Select.module.css";
import type { SelectOptionProps, SelectProps, SelectSize } from "./Select.types";
import { useProvidedDirection } from "../../internal/useProvidedDirection";

const sizeClass: Record<SelectSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The clear and caret icons are the same step as Select's own `size`, the
// identical mapping to `Input`'s own `clearIconSizeForInputSize` — Select's
// sizes match Input's pixel for pixel (see the size-parity fix in this
// component's own review).
const clearIconSizeForSelectSize: Record<SelectSize, "xs" | "sm" | "md" | "lg" | "xl"> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

const clearSizeClass: Record<SelectSize, string | undefined> = {
  xs: styles.clearXs,
  sm: styles.clearSm,
  md: styles.clearMd,
  lg: styles.clearLg,
  xl: styles.clearXl,
};

// Reserves extra room in the trigger's own `padding-inline-end` for the
// clear button, which replaces the caret in this state — matching
// `Select.module.css`'s own `.clearX`/`.sizeX` size steps exactly (see that
// file's comment for the full reasoning).
const clearablePaddingClass: Record<SelectSize, string | undefined> = {
  xs: styles.sizeXsClearable,
  sm: styles.sizeSmClearable,
  md: styles.sizeMdClearable,
  lg: styles.sizeLgClearable,
  xl: styles.sizeXlClearable,
};

/**
 * A single-value select built on Radix Select, styled to match `Input`'s
 * resting/focus/error chrome so the two read as the same form-field
 * family. Accepts both controlled (`value`/`onValueChange`) and
 * uncontrolled (`defaultValue`) usage, mirroring Radix's own pattern.
 * Options are declared as children via `Select.Option`, not a flat
 * `options` array — matches Radix's own compositional idiom and leaves
 * room for grouped options later without a breaking API change. `ref`
 * forwards to the underlying `<button>` trigger; all other native button
 * attributes (`aria-label`, `data-testid`, etc.) pass through to it too.
 *
 * @example
 * ```tsx
 * <Select aria-label="Variant" placeholder="Choose a variant" value={variant} onValueChange={setVariant}>
 *   <Select.Option value="primary">Primary</Select.Option>
 *   <Select.Option value="secondary">Secondary</Select.Option>
 * </Select>
 * <Select aria-label="Size" defaultValue="md" size="sm" hasError>
 *   <Select.Option value="sm">Small</Select.Option>
 *   <Select.Option value="md">Medium</Select.Option>
 * </Select>
 * <Select aria-label="Variant" asChild trigger={<button type="button">Custom trigger</button>}>
 *   <Select.Option value="primary">Primary</Select.Option>
 * </Select>
 * <Select aria-label="Variant" defaultValue="primary" onClear={() => {}}>
 *   <Select.Option value="primary">Primary</Select.Option>
 * </Select>
 * ```
 */
const SelectRoot = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      size = "md",
      hasError = false,
      disabled,
      placeholder,
      side = "bottom",
      align = "start",
      asChild = false,
      trigger,
      className,
      children,
      value,
      defaultValue,
      onValueChange,
      onClear,
      name,
      required,
      open,
      defaultOpen,
      onOpenChange,
      dir: dirProp,
      form,
      autoComplete,
      id,
      ...triggerProps
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const dir = dirProp ?? providedDir;
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Shadows Radix's own controlled/uncontrolled value so `onClear` can
    // fully reset an uncontrolled selection too (see `onClear`'s own doc)
    // — only engaged when `onClear` is actually provided (below), so a
    // `Select` that doesn't use `onClear` keeps passing `value`/
    // `defaultValue` straight through to Radix exactly as before, with no
    // behavior change.
    //
    // `""`, never `undefined`, is used as the "nothing selected" sentinel
    // here — found live, 2026-09-14: passing `undefined` made Radix's own
    // `value` genuinely flip between controlled and uncontrolled from its
    // own perspective every time a selection was made vs. cleared (Radix's
    // own `useControllableState` computes `isControlled` fresh each render
    // as `prop !== undefined`), which is exactly the anti-pattern Radix's
    // own dev warning exists to catch ("Select is changing from
    // uncontrolled to controlled..."). Confirmed live: this made Radix
    // silently fall back to a *stale* internal value on every clear (it
    // was "uncontrolled" the moment a real selection was first made, so it
    // cached that value internally, and resurfaced the exact same stale
    // value the next time `value` went back to `undefined`) — the trigger
    // kept showing the just-cleared label instead of the placeholder.
    // `""` keeps Radix permanently controlled (`"" !== undefined`) from
    // the first render onward whenever `onClear` is used, so its own
    // internal uncontrolled fallback is never engaged at all.
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(() => defaultValue ?? "");
    const effectiveValue = isControlled ? (value ?? "") : uncontrolledValue;

    const handleValueChange = (newValue: string) => {
      if (!isControlled) setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    };

    const showClear = Boolean(onClear) && !asChild && !disabled && Boolean(effectiveValue);

    const handleClear = () => {
      if (!isControlled) setUncontrolledValue("");
      onClear?.();
      triggerRef.current?.focus();
    };

    const hasWarnedTriggerWithoutAsChildRef = useRef(false);
    const hasWarnedAsChildWithoutTriggerRef = useRef(false);
    const hasWarnedAsChildIgnoredPlaceholderRef = useRef(false);
    const hasWarnedAsChildIgnoredOnClearRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (trigger && !asChild && !hasWarnedTriggerWithoutAsChildRef.current) {
        hasWarnedTriggerWithoutAsChildRef.current = true;
        console.warn(
          "Select: `trigger` has no effect without `asChild` — the built-in value/caret display renders instead. Pass `asChild`, or remove `trigger`.",
        );
      }
      if (asChild && !trigger && !hasWarnedAsChildWithoutTriggerRef.current) {
        hasWarnedAsChildWithoutTriggerRef.current = true;
        console.warn(
          "Select: `asChild` requires `trigger` — Radix `Slot` needs exactly one child element to merge the trigger's behavior onto. Pass `trigger`, or remove `asChild`.",
        );
      }
      if (asChild && placeholder && !hasWarnedAsChildIgnoredPlaceholderRef.current) {
        hasWarnedAsChildIgnoredPlaceholderRef.current = true;
        console.warn(
          "Select: `placeholder` has no effect when `asChild` is set — the built-in value display isn't rendered in that mode. Remove `asChild`/`trigger`, or remove `placeholder`.",
        );
      }
      if (asChild && onClear && !hasWarnedAsChildIgnoredOnClearRef.current) {
        hasWarnedAsChildIgnoredOnClearRef.current = true;
        console.warn(
          "Select: `onClear` has no effect when `asChild` is set — a custom `trigger` has no built-in caret slot for a clear button to take over. Remove `asChild`/`trigger`, or remove `onClear`.",
        );
      }
    }

    // Only `Select`s actually using `onClear` are handed the shadowed
    // `effectiveValue`/`handleValueChange` above — every other `Select`
    // passes `value`/`defaultValue`/`onValueChange` straight through to
    // Radix exactly as before, unaffected by this feature's existence.
    const needsClearWrapper = Boolean(onClear) && !asChild;

    const triggerElement = (
      <SelectPrimitive.Trigger
        asChild={asChild}
        // `{...triggerProps}` spread first so none of the attributes below
        // can be silently overridden by a same-named prop the caller
        // passes — including `aria-invalid`, which isn't excluded from
        // `SelectProps`' own native-attribute passthrough and TypeScript's
        // JSX checker permits regardless (found and fixed 2026-09-13: this
        // was previously spread *last*, letting a stray consumer-supplied
        // `aria-invalid` silently win over this component's own
        // `hasError`-computed value — the same ordering bug already fixed
        // on Button/Skeleton/ProgressBar/FieldError/List, see
        // `05-component-api-conventions.md` §3).
        {...triggerProps}
        ref={mergeRefs(ref, triggerRef)}
        id={selectId}
        aria-invalid={hasError || undefined}
        // The built-in trigger chrome (`styles.trigger`/size/error) only
        // applies to the default `<button>` below. When `asChild` is set,
        // `trigger` is a fully custom, already-styled element (e.g. this
        // system's own `Button`) — merging Select's own background/
        // border/color classes onto it via Radix `Slot`'s className
        // concatenation fights the custom element's own styling, and since
        // both are equal-specificity single-class CSS-Modules selectors,
        // the winner depends on unpredictable stylesheet load order rather
        // than intent (found live, 2026-09-14: `Select.module.css`'s
        // `.trigger` rules were winning over `Button`'s own `variantPrimary`
        // background/border/color, rendering the `CustomTrigger` story's
        // primary button as plain/outlined). Only the consumer's own
        // `className` passthrough still applies in `asChild` mode — the
        // custom element brings its own full chrome.
        className={
          asChild
            ? className
            : cx(
                styles.trigger,
                sizeClass[size],
                hasError && styles.error,
                // Reserves room for the clear button, which replaces the
                // caret below in this state — see `Select.module.css`'s own
                // comment for the full per-size math.
                showClear && clearablePaddingClass[size],
                className,
              )
        }
      >
        {asChild ? (
          trigger
        ) : (
          <>
            <SelectPrimitive.Value placeholder={placeholder} />
            {/* The caret and the clear button share the same corner —
                showing both at once would need them to compete for the
                same reserved space for no benefit, since the whole trigger
                is already clickable to open the dropdown with or without a
                visible caret. */}
            {!showClear && (
              <SelectPrimitive.Icon className={styles.icon} asChild>
                <Icon icon={CaretDownIcon} size={clearIconSizeForSelectSize[size]} />
              </SelectPrimitive.Icon>
            )}
          </>
        )}
      </SelectPrimitive.Trigger>
    );

    return (
      <SelectPrimitive.Root
        value={onClear ? effectiveValue : value}
        defaultValue={onClear ? undefined : defaultValue}
        onValueChange={onClear ? handleValueChange : onValueChange}
        disabled={disabled}
        name={name}
        required={required}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        dir={dir}
        form={form}
        autoComplete={autoComplete}
      >
        {needsClearWrapper ? (
          // A stable wrapper regardless of whether a value is currently
          // selected (`showClear`'s own truthiness) — keeping the DOM
          // shape constant across selecting/clearing avoids remounting
          // (and defocusing) the trigger every time `showClear` flips.
          <span className={styles.triggerContainer}>
            {triggerElement}
            {showClear && (
              <button
                type="button"
                aria-label="Clear"
                className={cx(styles.clear, clearSizeClass[size])}
                onClick={handleClear}
              >
                <Icon icon={XIcon} size={clearIconSizeForSelectSize[size]} tone="default" />
              </button>
            )}
          </span>
        ) : (
          triggerElement
        )}
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            side={side}
            align={align}
            sideOffset={4}
            className={styles.content}
          >
            <SelectPrimitive.ScrollUpButton className={styles.scrollButton}>
              <Icon icon={CaretDownIcon} size="xs" className={styles.scrollUpIcon} />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className={styles.viewport}>
              {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className={styles.scrollButton}>
              <Icon icon={CaretDownIcon} size="xs" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);

SelectRoot.displayName = "Select";

/** A single selectable option inside a `<Select>`. */
const SelectOption = forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ className, style, children, value, disabled, textValue, id, asChild = false, ...props }, ref) => {
    const hasWarnedAsChildWithoutTextValueRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (asChild && !textValue && !hasWarnedAsChildWithoutTextValueRef.current) {
        hasWarnedAsChildWithoutTextValueRef.current = true;
        console.warn(
          "Select.Option: `asChild` needs `textValue` — without a plain-text value, the trigger has nothing to show once this option is selected (Radix's own selected-label projection needs a plain string, not the custom row itself). Pass `textValue`, or remove `asChild`.",
        );
      }
    }

    // Radix's own selected-label mechanism works by projecting `ItemText`'s
    // own children into the trigger once this item is selected — it needs
    // that to be a plain string, not an arbitrary custom row. So in
    // `asChild` mode, the custom row (`children`) renders as provided, with
    // an extra, hidden `ItemText` appended (sourced from `textValue`)
    // purely to give Radix's own projection something sane to show in the
    // trigger. Hidden via a wrapping `<span>`, not a `style`/`className`
    // prop on `ItemText` itself — confirmed live, 2026-09-14: Radix's own
    // `SelectItemText` destructures `style`/`className` out of its props
    // and never actually applies either to its rendered node, so they're
    // silently dropped (a real Radix quirk, not a typo on this side) —
    // without this wrapper, the "hidden" text rendered fully visible,
    // duplicating every custom row's own label right below it. The wrapper
    // has no effect on the portal Radix uses to project this into the
    // trigger once selected: `ReactDOM.createPortal` moves that content to
    // a completely different DOM location (the trigger's own node), which
    // isn't a descendant of this hidden wrapper and so isn't hidden by it.
    const optionContent =
      asChild && isValidElement(children)
        ? cloneElement(children as ReactElement<{ children?: ReactNode }>, undefined, (
            <>
              {(children as ReactElement<{ children?: ReactNode }>).props.children}
              <span style={{ display: "none" }}>
                <SelectPrimitive.ItemText>{textValue}</SelectPrimitive.ItemText>
              </span>
            </>
          ))
        : children;

    return (
      <SelectPrimitive.Item
        // `{...props}` spread first — same "own computed/passed attributes
        // must win, not be silently overridable" ordering as `SelectRoot`
        // above, applied consistently to this sub-part too.
        {...props}
        ref={ref}
        id={id}
        value={value}
        disabled={disabled}
        textValue={textValue}
        asChild={asChild}
        // Unlike `SelectRoot`'s own trigger `asChild` case, `styles.option`
        // (padding, hover/highlight background, outline reset, etc.) is
        // always applied here, asChild or not — a custom row's content
        // brings its own internal layout, not its own chrome, so it still
        // needs to look and behave like every other option. `styles.
        // optionRow` (the built-in single-line flex layout) is the one
        // piece withheld in asChild mode, since it would otherwise force a
        // custom row's own layout (e.g. a label/description column) into a
        // horizontal, space-between arrangement it doesn't want. See
        // `Select.module.css`'s own comment on `.option`/`.optionRow` for
        // the full reasoning and the bug this fixes.
        className={cx(styles.option, !asChild && styles.optionRow, className)}
        style={style}
      >
        {asChild ? (
          optionContent
        ) : (
          <>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className={styles.optionIndicator}>
              <Icon icon={CheckIcon} size="xs" />
            </SelectPrimitive.ItemIndicator>
          </>
        )}
      </SelectPrimitive.Item>
    );
  },
);

SelectOption.displayName = "Select.Option";

type SelectComponent = typeof SelectRoot & { Option: typeof SelectOption };

export const Select: SelectComponent = Object.assign(SelectRoot, { Option: SelectOption });
