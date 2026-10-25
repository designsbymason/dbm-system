import { createContext } from "react";
import type { CommandPaletteController } from "./CommandPalette.types";

/** The controller of the nearest `CommandPalette`, `null` outside one. */
export const CommandPaletteControllerContext = createContext<CommandPaletteController | null>(null);

/** What a controller does outside any palette: nothing, and says so by returning `false`. */
export const INERT_CONTROLLER: CommandPaletteController = {
  open: () => false,
  close: () => false,
  toggle: () => false,
  isOpen: false,
};
