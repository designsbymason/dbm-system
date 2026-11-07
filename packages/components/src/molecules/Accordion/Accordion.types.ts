import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

type AccordionPrimitiveContentProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

/** Which heading level `Accordion.Trigger` renders as, for correct page-outline placement. */
export type AccordionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Which dimension keyboard arrow navigation moves along between triggers —
 * mirrors `RadioGroup`'s own `orientation` convention. Purely a keyboard/
 * `data-orientation` concern: switching to `"horizontal"` does **not** by
 * itself lay items out side by side (see Best practices on the Docs page) —
 * pair it with your own `className` override if a genuinely horizontal
 * layout is needed.
 */
export type AccordionOrientation = "horizontal" | "vertical";

/**
 * `"bordered"` (the default) draws an outer border and rounded corners
 * around the whole group, with a hairline divider between items — a
 * self-contained group meant to stand on its own. `"ghost"` removes the
 * outer border/corners (keeping the between-item dividers) for embedding
 * inside a container that already provides its own boundary, e.g. a `Card`.
 */
export type AccordionVariant = "bordered" | "ghost";

/**
 * Trigger padding/typography and the disclosure icon's own size, on the
 * standard 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale. `Accordion.Content`'s own inline padding tracks
 * the same step, so its text stays aligned under the trigger's own label at
 * every size.
 */
export type AccordionSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AccordionSharedProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "dir" | "defaultValue" | "onChange" | "children" | "id" | "className" | "style"
  > {
  /** One or more `Accordion.Item` elements. */
  children: ReactNode;
  /** Disables every item in the accordion at once — each item still accepts its own additional `disabled` on top of this. */
  disabled?: boolean;
  /**
   * The group's own visual treatment — a self-contained bordered group, or
   * a borderless treatment for embedding inside an already-bordered
   * container.
   * @default 'bordered'
   */
  variant?: AccordionVariant;
  /**
   * Trigger padding/typography and the disclosure icon's own size.
   * @default 'md'
   */
  size?: AccordionSize;
  /**
   * Which arrow-key pair moves roving focus between triggers: `Up`/`Down`
   * when `"vertical"`, `Left`/`Right` when `"horizontal"`.
   * @default 'vertical'
   */
  orientation?: AccordionOrientation;
  /**
   * Text direction, passed through to Radix Accordion — flips which
   * physical arrow key moves focus forward versus back in `"horizontal"`
   * orientation. Left out, it follows the nearest `DirectionProvider`, then a Radix `DirectionProvider` if the app has one, else left-to-right; it is not read from the page.
   */
  dir?: "ltr" | "rtl";
  /**
   * The heading level every `Accordion.Trigger` in this accordion renders
   * as (e.g. `2` for an `<h2>`) — set to match this accordion's real
   * position in the surrounding page's own heading outline, the same
   * concern `Heading`'s own `level` prop addresses. Applies to every
   * `Accordion.Trigger` inside this `Accordion`; there is no per-item
   * override, since every item in one accordion sits at the same outline
   * depth.
   * @default 3
   */
  headingLevel?: AccordionHeadingLevel;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * accordion, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface AccordionSingleProps extends AccordionSharedProps {
  /**
   * At most one item open at a time.
   * @default 'single'
   */
  type?: "single";
  /** The controlled open item's `value`. Pass `""` to represent "nothing open" in controlled usage. */
  value?: string;
  /** The initial open item's `value` when uncontrolled. */
  defaultValue?: string;
  /** Called with the newly-open item's `value` (or `""` when closed) whenever the open item changes. */
  onValueChange?: (value: string) => void;
  /**
   * Whether the open item can be closed by activating its own trigger again
   * — leaving every item closed at once. When `false`, exactly one item is
   * always open (activating a closed item's trigger still switches which
   * one, it just can never reach "none open").
   * @default true
   */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionSharedProps {
  /** Any number of items open at once, independently. */
  type: "multiple";
  /** The controlled set of open items' `value`s. */
  value?: string[];
  /** The initial set of open items' `value`s when uncontrolled. */
  defaultValue?: string[];
  /** Called with the full set of currently-open items' `value`s whenever it changes. */
  onValueChange?: (value: string[]) => void;
  /**
   * Not applicable under `type="multiple"` — `collapsible` only governs
   * whether `type="single"` can reach "nothing open." Declared as `never`
   * (rather than omitted) purely so this discriminated union stays
   * destructure-friendly across both arms at once, matching a standard
   * TypeScript idiom for this exact case.
   */
  collapsible?: never;
}

/**
 * `type="single"` (the default) accepts a single string `value`; switching
 * to `type="multiple"` accepts a `string[]` instead — the value shape
 * always matches which `type` is active, mirroring Radix's own discriminated
 * `Accordion` props.
 */
export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export interface AccordionItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * This item's unique identifier within the accordion — what `value`/
   * `defaultValue`/`onValueChange` above refer to, and what a controlled
   * `Accordion` compares against to know whether this item is open.
   */
  value: string;
  /** Disables this item's own trigger, on top of any accordion-wide `disabled`. */
  disabled?: boolean;
  /**
   * Renders the item's own root behavior onto a single provided child (via
   * Radix `Slot`) instead of wrapping it in its own `<div>` — for a host
   * element that can't have an extra wrapper around it, matching `Collapse`'s
   * identical `asChild` use case.
   * @default false
   */
  asChild?: boolean;
  /** An `Accordion.Trigger` followed by an `Accordion.Content`. */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * item, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface AccordionTriggerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /** The trigger's own visible label. */
  children: ReactNode;
  /**
   * The disclosure indicator icon, rotated 180° when this item is open. Pass
   * a different Phosphor icon reference to replace the default caret.
   * @default CaretDownIcon
   */
  icon?: PhosphorIcon;
  /** Hides the disclosure indicator icon entirely. */
  hideIcon?: boolean;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead
   * of the built-in label+icon row — for a fully custom trigger row (e.g.
   * one with a leading icon or a secondary line of text). The child is
   * responsible for its own disclosure indicator in this mode; `icon`/
   * `hideIcon` have no effect.
   * @default false
   */
  asChild?: boolean;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * trigger, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface AccordionContentProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The panel's own content, revealed when this item is open. */
  children?: ReactNode;
  /**
   * Forces the panel to stay mounted (rather than removed from the DOM
   * while closed) — for a case where an external animation library needs
   * to control its own mount/unmount timing directly instead of relying on
   * this component's own CSS-driven exit. Leave unset for the common case.
   */
  forceMount?: AccordionPrimitiveContentProps["forceMount"];
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * panel, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
