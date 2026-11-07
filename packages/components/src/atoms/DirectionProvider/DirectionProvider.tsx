import { DirectionContext, useProvidedDirection } from "../../internal/useProvidedDirection";
import { warnOnce } from "../../internal/warnOnce";
import type { Direction, DirectionProviderProps } from "./DirectionProvider.types";

/**
 * Sets the reading direction for everything inside it, so a right-to-left app wraps its root once instead of passing `dir` to every component
 * that behaves differently in right to left. A component that takes a `dir` prop uses the nearest provider's direction when it is given none,
 * and its own `dir` still wins. So do the overlays that open in a portal without a `dir` prop (`Dialog`, `Popover`, `Tooltip` and the rest).
 * Nothing detects the page's direction by itself: the provider says it.
 *
 * It renders no element and changes no style, so it takes no `ref`, `className`, `style`, `id` or `data-testid`: there is nothing to put them
 * on (05 §3). The direction of the layout (what a logical CSS property such as `margin-inline-start` follows) comes from the `dir` attribute of
 * the nearest element, so set `dir` on the page too (`<html dir="rtl">`), or use a component that sets both, such as `AppShell`. It does not set
 * `lang` either: keep the two together.
 *
 * A `dir` other than `"ltr"` or `"rtl"` (a value from untyped configuration: `"RTL"`, `"auto"`, `""`) is refused with a development warning and
 * read as `"ltr"`.
 *
 * @example
 * ```tsx
 * <DirectionProvider dir="rtl">
 *   <Sidebar>…</Sidebar>
 * </DirectionProvider>
 * ```
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  let value: Direction = dir;
  if (dir !== "ltr" && dir !== "rtl") {
    warnOnce(`DirectionProvider: \`dir\` must be "ltr" or "rtl", got ${JSON.stringify(dir)}. Using "ltr".`);
    value = "ltr";
  }
  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>;
}

/**
 * The direction a component should use: its own `dir` when it has one, else the nearest `DirectionProvider`'s, else left to right. For the
 * components that take a `dir` prop and for an app's own parts that must follow it.
 *
 * @example
 * ```tsx
 * const dir = useDirection(props.dir);
 * ```
 */
export function useDirection(own?: Direction): Direction {
  const provided = useProvidedDirection();
  return own ?? provided ?? "ltr";
}
