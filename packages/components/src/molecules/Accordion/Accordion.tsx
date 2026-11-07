import { CaretDownIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { createContext, forwardRef, useContext, useRef } from "react";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { Icon } from "../../atoms/Icon";
import styles from "./Accordion.module.css";
import type {
  AccordionContentProps,
  AccordionHeadingLevel,
  AccordionItemProps,
  AccordionProps,
  AccordionSize,
  AccordionTriggerProps,
} from "./Accordion.types";
import type { IconSize } from "../../atoms/Icon";
import { useProvidedDirection } from "../../internal/useProvidedDirection";

type AccordionPrimitiveRootProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

const AccordionHeadingLevelContext = createContext<AccordionHeadingLevel>(3);
const AccordionSizeContext = createContext<AccordionSize>("md");

const elementForHeadingLevel: Record<AccordionHeadingLevel, string> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

// The disclosure icon renders one size step down from the accordion's own
// `size` at the small end, matching the established step-down convention
// elsewhere in this system (`Input`'s/`Select`'s own clear-icon sizing) —
// `Icon`'s scale (xs-3xl) is wider than Accordion's own (xs-xl), so this
// maps onto it rather than reusing the same step names 1:1.
const iconSizeForAccordionSize: Record<AccordionSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const triggerSizeClass: Record<AccordionSize, string | undefined> = {
  xs: styles.triggerXs,
  sm: styles.triggerSm,
  md: styles.triggerMd,
  lg: styles.triggerLg,
  xl: styles.triggerXl,
};

const contentSizeClass: Record<AccordionSize, string | undefined> = {
  xs: styles.contentInnerXs,
  sm: styles.contentInnerSm,
  md: styles.contentInnerMd,
  lg: styles.contentInnerLg,
  xl: styles.contentInnerXl,
};

/**
 * A vertically-stacked set of expand/collapse disclosure panels, built on
 * Radix Accordion — one item open at a time (`type="single"`, the default)
 * or several independently (`type="multiple"`). A compound component:
 * compose `Accordion.Item`, `Accordion.Trigger`, and `Accordion.Content`
 * inside `Accordion` itself, mirroring `Popover`'s own Radix-shaped
 * sub-parts.
 *
 * Wraps Radix Accordion's `Root`/`Item`/`Header`/`Trigger`/`Content` fully,
 * end to end — `Accordion.Trigger` folds Radix's own separate `Header`
 * wrapper in rather than exposing it as a fourth sub-part, since it carries
 * no visual styling of its own beyond correct heading semantics (see
 * `headingLevel`). Does not reuse the `Collapse` atom's own React component
 * for `Accordion.Content`'s animation: `Accordion.Trigger`/`Accordion.Content`
 * read from the same Radix `Item` context to track open state, so swapping
 * one half for a different primitive's Content would either duplicate that
 * wiring for no benefit or require re-deriving it by hand — see
 * `guidelines/adr/0018` for the full reasoning. The animation technique
 * itself (a measured-height CSS custom property driving a slide keyframe)
 * is the same one `Collapse` uses, just against Radix Accordion's own copy
 * of that mechanism instead of Radix Collapsible's.
 *
 * `ref` forwards to the root `<div>`.
 *
 * @example
 * ```tsx
 * <Accordion>
 *   <Accordion.Item value="shipping">
 *     <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
 *     <Accordion.Content>3-5 business days for standard shipping.</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="returns">
 *     <Accordion.Trigger>What's your return policy?</Accordion.Trigger>
 *     <Accordion.Content>Returns accepted within 30 days.</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 *
 * <Accordion type="multiple" defaultValue={["shipping"]}>
 *   <Accordion.Item value="shipping" disabled>
 *     <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
 *     <Accordion.Content>3-5 business days for standard shipping.</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 * ```
 */
const AccordionRoot = forwardRef<HTMLDivElement, AccordionProps>((props, ref) => {
  const {
    children,
    disabled = false,
    variant = "bordered",
    size = "md",
    orientation = "vertical",
    dir: dirProp,
    headingLevel = 3,
    className,
    style,
    id,
    "data-testid": dataTestId,
    // Destructured out (rather than left in `...rest`) purely so `rest`
    // below holds only genuine native `<div>` passthrough (`onClick`,
    // `aria-*`, `role`, etc.) — each of these five is already handled
    // explicitly via `rootProps` below, computed from `props` directly
    // (not from these locals, which exist only to keep them out of `rest`).
    // Unused by design; `collapsible` is typed `never` on the `"multiple"`
    // arm specifically so this still destructures cleanly across both arms
    // of the union at once.
    type: _type,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    collapsible: _collapsible,
    ...rest
  } = props;
  const providedDir = useProvidedDirection();
  const dir = dirProp ?? providedDir;

  const hasWarnedCollapsibleUnderMultipleRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (
      props.type === "multiple" &&
      "collapsible" in props &&
      props.collapsible !== undefined &&
      !hasWarnedCollapsibleUnderMultipleRef.current
    ) {
      hasWarnedCollapsibleUnderMultipleRef.current = true;
      console.warn(
        "Accordion: `collapsible` has no effect under `type=\"multiple\"` — it only governs whether `type=\"single\"` can reach \"nothing open.\" Remove `collapsible`, or remove `type=\"multiple\"`.",
      );
    }
  }

  // Two distinct object literals, each satisfying exactly one arm of
  // Radix's own discriminated `type`/`value`/`onValueChange` union — not
  // merged into one shape, since `collapsible` only exists on the
  // `"single"` arm and the `value`/`onValueChange` types genuinely differ
  // between the two. Assigning both branches to one `AccordionPrimitiveRootProps`-
  // typed variable keeps this fully type-checked with no `any`/cast needed.
  const rootProps: AccordionPrimitiveRootProps =
    props.type === "multiple"
      ? {
          type: "multiple",
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
        }
      : {
          type: "single",
          collapsible: props.collapsible ?? true,
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
        };

  return (
    <AccordionPrimitive.Root
      {...rest}
      {...rootProps}
      ref={ref}
      disabled={disabled}
      orientation={orientation}
      dir={dir}
      id={id}
      style={style}
      data-testid={dataTestId}
      className={cx(styles.root, variant === "ghost" && styles.ghost, className)}
    >
      <AccordionHeadingLevelContext.Provider value={headingLevel}>
        <AccordionSizeContext.Provider value={size}>{children}</AccordionSizeContext.Provider>
      </AccordionHeadingLevelContext.Provider>
    </AccordionPrimitive.Root>
  );
});

AccordionRoot.displayName = "Accordion";

/** A single disclosure section within an `Accordion` — an `Accordion.Trigger` and `Accordion.Content` pair. */
const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, disabled, asChild = false, className, children, ...props }, ref) => (
    <AccordionPrimitive.Item
      {...props}
      ref={ref}
      value={value}
      disabled={disabled}
      asChild={asChild}
      className={cx(styles.item, className)}
    >
      {children}
    </AccordionPrimitive.Item>
  ),
);
AccordionItem.displayName = "Accordion.Item";

/**
 * The clickable header that toggles its item's own open state. Renders a
 * heading element (per the accordion's own `headingLevel`) wrapping the real
 * interactive button, matching Radix's own `Header`+`Trigger` pairing —
 * `Header` is folded in here rather than exposed as its own sub-part, since
 * it's a semantic-only wrapper with no visible styling of its own.
 */
const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  (triggerProps, ref) => {
    const { asChild = false, icon = CaretDownIcon, hideIcon = false, className, children, ...props } = triggerProps;
    const headingLevel = useContext(AccordionHeadingLevelContext);
    const HeadingTag = elementForHeadingLevel[headingLevel] as ElementType;
    const size = useContext(AccordionSizeContext);

    const hasWarnedIconIgnoredWithAsChildRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        asChild &&
        (triggerProps.icon !== undefined || triggerProps.hideIcon !== undefined) &&
        !hasWarnedIconIgnoredWithAsChildRef.current
      ) {
        hasWarnedIconIgnoredWithAsChildRef.current = true;
        console.warn(
          "Accordion.Trigger: `icon`/`hideIcon` have no effect when `asChild` is set — the slotted child is responsible for rendering its own disclosure indicator, if any. Render the icon as part of the slotted child instead.",
        );
      }
    }

    return (
      <AccordionPrimitive.Header asChild>
        <HeadingTag className={styles.header}>
          <AccordionPrimitive.Trigger
            {...props}
            ref={ref}
            asChild={asChild}
            className={asChild ? className : cx(styles.trigger, triggerSizeClass[size], className)}
          >
            {asChild ? (
              children
            ) : (
              <>
                <span className={styles.triggerLabel}>{children}</span>
                {!hideIcon && (
                  <Icon icon={icon} size={iconSizeForAccordionSize[size]} className={styles.triggerIcon} />
                )}
              </>
            )}
          </AccordionPrimitive.Trigger>
        </HeadingTag>
      </AccordionPrimitive.Header>
    );
  },
);
AccordionTrigger.displayName = "Accordion.Trigger";

/** The panel revealed/hidden as its item's own open state toggles. */
const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const size = useContext(AccordionSizeContext);
    return (
      <AccordionPrimitive.Content {...props} ref={ref} className={cx(styles.content, className)}>
        <div className={cx(styles.contentInner, contentSizeClass[size])}>{children}</div>
      </AccordionPrimitive.Content>
    );
  },
);
AccordionContent.displayName = "Accordion.Content";

type AccordionComponent = typeof AccordionRoot & {
  Item: typeof AccordionItem;
  Trigger: typeof AccordionTrigger;
  Content: typeof AccordionContent;
};

export const Accordion: AccordionComponent = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
