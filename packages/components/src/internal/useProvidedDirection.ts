import { createContext, useContext } from "react";
import type { Direction } from "../atoms/DirectionProvider/DirectionProvider.types";

/** The direction a `DirectionProvider` carries, or `undefined` outside one. Held here so a component reads it without importing the provider. */
export const DirectionContext = createContext<Direction | undefined>(undefined);

/**
 * The nearest provider's direction, or `undefined` when there is none. For parts that leave the `dir` attribute off (and so inherit the page's
 * direction, or a Radix `DirectionProvider`'s) unless an app has said otherwise. Not part of the package's public surface: a component that
 * always needs a direction uses `useDirection`.
 */
export function useProvidedDirection(): Direction | undefined {
  return useContext(DirectionContext);
}
