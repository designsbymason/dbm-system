import { createContext, useContext } from "react";
import type { Direction, DirectionProviderProps } from "./DirectionProvider.types";

const DirectionContext = createContext<Direction | undefined>(undefined);

/**
 * Sets the reading direction for everything inside it, so a right-to-left app wraps its root once instead of passing `dir` to every component
 * that behaves differently in right to left. A component that takes a `dir` prop uses the nearest provider's direction when it is given none,
 * and its own `dir` still wins. Nothing detects the page's direction by itself: the provider says it.
 *
 * It renders no element and changes no style. The direction of the layout (what a logical CSS property such as `margin-inline-start` follows)
 * comes from the `dir` attribute of the nearest element, so set `dir` on the page too (`<html dir="rtl">`), or use a component that sets both, such
 * as `AppShell`.
 *
 * @example
 * ```tsx
 * <DirectionProvider dir="rtl">
 *   <Sidebar>…</Sidebar>
 * </DirectionProvider>
 * ```
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
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
  const provided = useContext(DirectionContext);
  return own ?? provided ?? "ltr";
}

/**
 * The nearest provider's direction, or `undefined` when there is none. For internal parts that leave the `dir` attribute off (and so inherit the
 * page's direction) unless an app has said otherwise. Not exported from the package: components use `useDirection`.
 *
 * @internal
 */
export function useProvidedDirection(): Direction | undefined {
  return useContext(DirectionContext);
}
