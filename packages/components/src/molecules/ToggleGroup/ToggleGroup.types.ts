import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * How the chosen item is marked. `"outlined"` (the default) gives every item a border — brand-coloured, with a soft
 * tint, on the chosen one — so the group reads as one control and nothing moves when the choice does. `"subtle"` has
 * no borders: the chosen item takes a soft brand tint. `"solid"` keeps the borders and fills the chosen item with the
 * brand colour, for the strongest emphasis. `subtle`, `outlined` and `solid` are the variant names `Tabs` and `Tag`
 * use too.
 */
export type ToggleGroupVariant = "subtle" | "outlined" | "solid";

/**
 * Item height, padding and type size, on the standard 5-step scale. An item's minimum height matches `Button`'s and
 * `IconButton`'s at the same step, so a group sits flush beside them.
 */
export type ToggleGroupSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Whether the items run in a row or a column; also which arrow-key pair moves between them. */
export type ToggleGroupOrientation = "horizontal" | "vertical";

/** `"single"`: at most one item is chosen, as in a segmented control. `"multiple"`: any number are, as in text-style toggles. */
export type ToggleGroupType = "single" | "multiple";

interface ToggleGroupBaseProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "dir" | "defaultValue" | "onChange" | "children" | "id" | "className" | "style" | "role"
  > {
  /** The `ToggleGroup.Item`s, one per choice. */
  children: ReactNode;
  /**
   * How the chosen item is marked. See {@link ToggleGroupVariant}.
   * @default 'outlined'
   */
  variant?: ToggleGroupVariant;
  /**
   * Item height, padding and type size, on the shared 5-step scale.
   * @default 'md'
   */
  size?: ToggleGroupSize;
  /**
   * Fully rounded ends, a pill: the outer corners of the first and last item are circular, and, attached, the corners
   * where items meet stay square.
   * @default false
   */
  rounded?: boolean;
  /**
   * Fuses the items into one segmented control: square corners where they meet, no gap. `false` keeps them apart, spaced
   * by a gap, and lets a horizontal group wrap onto more lines when it doesn't fit.
   * @default true
   */
  attached?: boolean;
  /**
   * Lays the items out in a row or a column, which is also which arrow-key pair moves between them (`Left`/`Right`, or
   * `Up`/`Down`). Also takes a mobile-first map keyed by breakpoint, so a row can stack on a phone.
   * @default 'horizontal'
   */
  orientation?: Responsive<ToggleGroupOrientation>;
  /**
   * Stretches the group to the width of its container. A horizontal group shares that width equally between its items.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Disables every item. An item that is disabled itself stays disabled either way.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the arrow keys wrap from the last item to the first, and back.
   * @default true
   */
  loop?: boolean;
  /**
   * Whether the group is a roving-focus group of its own: one tab stop, arrow keys moving between its items. Leave it
   * on. Turn it off only when the items sit inside another roving-focus container that moves focus between them —
   * `Toolbar.ToggleGroup` does, so the toolbar stays one tab stop. With it off the group doesn't manage focus at all,
   * `loop` has no effect, and a `type="multiple"` group is announced as a plain `group` instead of a `toolbar`
   * (a toolbar inside a toolbar isn't a valid structure).
   * @default true
   */
  rovingFocus?: boolean;
  /**
   * Text direction, passed through to Radix ToggleGroup: `"rtl"` mirrors the group (the first item at the right, the
   * arrow keys the other way round). Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Names the group for assistive tech ("Text alignment"). Required unless `aria-labelledby` points at a visible label:
   * a group of toggles with no name is just a set of buttons.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the group, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the group. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the group's element; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** A group where at most one item is chosen. */
export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  /**
   * `"single"` (the default): at most one item is chosen.
   * @default 'single'
   */
  type?: "single";
  /** The controlled chosen item's `value`, or `""` for none. Pair it with `onValueChange`. */
  value?: string;
  /** The item chosen at first when uncontrolled. Left out, nothing is chosen. */
  defaultValue?: string;
  /** Called with the chosen item's `value` — or `""` when the choice is cleared (`deselectable`). */
  onValueChange?: (value: string) => void;
  /**
   * Whether clicking the chosen item clears it, so the group can have nothing chosen. Off, a single group keeps one item
   * chosen once it has one, as a segmented control or a radio group does. Only for `type="single"`; a group with
   * `type="multiple"` can always be cleared.
   * @default false
   */
  deselectable?: boolean;
}

/** A group where any number of items can be chosen. */
export interface ToggleGroupMultipleProps extends ToggleGroupBaseProps {
  /** `"multiple"`: any number of items can be chosen. */
  type: "multiple";
  /** The controlled chosen items' `value`s. Pair it with `onValueChange`. */
  value?: string[];
  /** The items chosen at first when uncontrolled. Left out, nothing is chosen. */
  defaultValue?: string[];
  /** Called with every chosen item's `value` whenever one is switched on or off. */
  onValueChange?: (value: string[]) => void;
  /** Not used with `type="multiple"`, which can always be cleared. */
  deselectable?: never;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

export interface ToggleGroupItemProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "value" | "children" | "className" | "style" | "id" | "type" | "disabled" | "onChange" | "role" | "aria-checked" | "aria-pressed"
  > {
  /** This item's value: what the group's `value` holds while it is chosen. Unique within the group. */
  value: string;
  /**
   * The label. Leave it out for an icon-only item, and name it with `aria-label`.
   */
  children?: ReactNode;
  /** An icon before the label — a component reference, not a string name. */
  icon?: PhosphorIcon;
  /**
   * Disables this item, taking it out of the arrow-key order. Left out, it follows the group.
   * @default false
   */
  disabled?: boolean;
  /**
   * Merge props onto the single child element instead of rendering a `<button>` (via Radix `Slot`) — for a tooltip
   * wrapper, say. `icon` has no effect in this mode.
   * @default false
   */
  asChild?: boolean;
  /** The item's accessible name — required for an icon-only item, and worth giving one whose label isn't enough. */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the item, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the item's element; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}
