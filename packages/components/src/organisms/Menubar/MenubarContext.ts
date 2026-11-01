import { createContext } from "react";
import type { MenubarSize } from "./Menubar.types";

/** What the bar shares with its menus: the open menu, how to change it, and the size and direction they follow. */
export interface MenubarContextValue {
  value: string;
  setValue: (value: string) => void;
  size: MenubarSize;
  dir: "ltr" | "rtl";
  /** Reports that a menu has finished opening or closing. */
  reportComplete: (value: string, open: boolean) => void;
}

export const MenubarContext = createContext<MenubarContextValue | null>(null);

/** The `value` of the `Menubar.Menu` a trigger or a panel belongs to. */
export const MenubarMenuValueContext = createContext<string>("");
