import { cx, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, useEffect } from "react";
import { CloseButton } from "../../atoms/CloseButton";
import { OverlayArrow } from "../../internal/OverlayArrow/OverlayArrow";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import styles from "./Popover.module.css";
import type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from "./Popover.types";
import { useProvidedDirection } from "../../internal/useProvidedDirection";

/**
 * A floating panel of arbitrary content anchored to a trigger, built on
 * Radix Popover. Unlike `Tooltip` (a short, non-interactive hint), a
 * popover's own content is fully interactive — forms, buttons, richer
 * layouts — and stays open until the user dismisses it (outside click,
 * Escape, or an explicit `Popover.Close`), not just while hovering.
 *
 * A compound component: compose `Popover.Trigger` and `Popover.Content`
 * inside `Popover` itself. This is the first component in this system
 * exposing real Radix-mirroring sub-parts (`Root`/`Trigger`/`Content`, not
 * a single-prop API) — deliberately, since later organisms (`Menu`,
 * `Combobox`, `DatePicker`) reuse this same positioning/dismissal
 * mechanism for their own dropdowns.
 *
 * `Popover` itself renders no DOM element of its own — a plain context
 * provider around its sub-parts, matching Radix's own `Popover.Root` — so
 * it takes no `ref`/`className`/`style`/`id`/`data-testid` of its own;
 * those apply to `Popover.Trigger`/`Popover.Content`/`Popover.Close`
 * instead, each of which does forward its own ref.
 *
 * Does **not** expose `Popover.Anchor` (Radix's own sub-part for anchoring
 * the content to an element other than the trigger) — live-verified
 * (2026-09-16, reproduced with raw `@radix-ui/react-popover` primitives,
 * no code of this component's own involved) that the installed version
 * (`@radix-ui/react-popover@1.1.23` + `@radix-ui/react-popper@1.3.7`)
 * silently ignores a custom anchor and positions the content at the
 * viewport's own top-left corner instead — a real upstream bug in how
 * `Popover.Trigger`'s own implicit self-anchoring interacts with a
 * separately-provided `Popover.Anchor` (a render-vs-effect timing issue in
 * Radix's own `hasCustomAnchor` mechanism), not an `asChild`/Slot issue on
 * either side. Revisit once a newer Radix release fixes this — see
 * `guidelines/component-reviews/Popover.md` for the full investigation and
 * `guidelines/adr/0017` for the decision record.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <Popover.Trigger asChild>
 *     <Button>Open</Button>
 *   </Popover.Trigger>
 *   <Popover.Content>
 *     <Text>Popover content</Text>
 *   </Popover.Content>
 * </Popover>
 *
 * <Popover modal>
 *   <Popover.Trigger asChild>
 *     <IconButton icon={GearIcon} aria-label="Settings" />
 *   </Popover.Trigger>
 *   <Popover.Content showCloseButton side="bottom" align="end">
 *     <SettingsForm />
 *   </Popover.Content>
 * </Popover>
 * ```
 */
function PopoverRoot({ children, open, defaultOpen, onOpenChange, modal = false }: PopoverProps) {
  return (
    <PopoverPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </PopoverPrimitive.Root>
  );
}

/**
 * The element that opens/closes the popover on click. Renders an unstyled
 * native `<button>` by default — pass `asChild` to use one of this
 * system's own interactive components (`Button`, `IconButton`) instead.
 */
const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild = false, className, ...props }, ref) => (
    <PopoverPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      className={asChild ? className : cx(styles.trigger, className)}
      {...props}
    />
  ),
);
PopoverTrigger.displayName = "Popover.Trigger";

/**
 * The floating panel itself — Radix renders it in a `Portal` appended to
 * `document.body` by default, outside the trigger's own tree.
 */
const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      side = "bottom",
      align = "center",
      sideOffset = 8,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      hideArrow = false,
      showCloseButton = false,
      container,
      className,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    // Radix's own `side` needs one concrete value per render — it drives a
    // real positioning computation, not a CSS cascade, so a
    // `Responsive<PopoverSide>` map (side/left→top/bottom across a
    // breakpoint) has to resolve to a single value in JS before reaching
    // it, unlike a purely CSS-driven responsive prop.
    const resolvedSide = useResolvedResponsiveValue(side, "bottom");

    // A dev-mode warning, not a render-time read — the "haven't warned yet"
    // check reads/writes a ref's `.current`, which `eslint-plugin-react-
    // hooks`'s newer `react-hooks/refs` rule (added since Slider's own
    // identical-looking warning was written) no longer allows during
    // render itself; deferred to an effect instead, still firing at most
    // once per mounted instance.
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        'Popover.Content: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible heading inside the content, so assistive tech has something to announce for this role="dialog" element. Content with no accessible name is invisible to screen reader users.',
      );
      // Intentionally runs once per mount, not on every `ariaLabel`/
      // `ariaLabelledBy` change — an empty dependency array would miss a
      // later prop change, but re-warning on every content re-render
      // whenever neither is set would be noisy for no benefit; the point
      // is catching the omission at least once per real usage.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(styles.content, showCloseButton && styles.contentWithCloseButton, className)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          {...props}
          dir={props.dir ?? providedDir}
        >
          {showCloseButton && (
            <PopoverPrimitive.Close asChild className={styles.closeButton}>
              <CloseButton size="xs" aria-label="Close" />
            </PopoverPrimitive.Close>
          )}
          <ButtonGroupReset>{children}</ButtonGroupReset>
          {!hideArrow && (
            <PopoverPrimitive.Arrow asChild>
              <OverlayArrow />
            </PopoverPrimitive.Arrow>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = "Popover.Content";

/** An element that closes the popover on click, placed anywhere inside `Popover.Content`. */
const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ asChild = false, className, ...props }, ref) => (
    <PopoverPrimitive.Close ref={ref} asChild={asChild} className={className} {...props} />
  ),
);
PopoverClose.displayName = "Popover.Close";

type PopoverComponent = typeof PopoverRoot & {
  Trigger: typeof PopoverTrigger;
  Content: typeof PopoverContent;
  Close: typeof PopoverClose;
};

export const Popover: PopoverComponent = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
});
