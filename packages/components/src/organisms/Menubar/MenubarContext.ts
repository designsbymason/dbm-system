import { createContext, type MutableRefObject } from "react";
import type { MenubarController, MenubarSize } from "./Menubar.types";

/** What a menu or an action tells the bar about itself, so the bar can open it from code and refuse to open what can't open. */
export interface MenubarEntry {
  kind: "menu" | "action";
  trigger: () => HTMLElement | null;
  /** Whether the trigger is disabled with a reason: it can be focused, and nothing opens. */
  blocked: () => boolean;
  /** Set by the bar before it opens the menu from code, and read once by the panel as it takes focus. */
  focusFirstRef?: MutableRefObject<boolean>;
}

/** What the bar shares with its menus: the open menu, how to change it, and the size and direction they follow. */
export interface MenubarContextValue {
  value: string;
  setValue: (value: string) => void;
  size: MenubarSize;
  dir: "ltr" | "rtl";
  /** Reports that a menu has finished opening or closing. */
  reportComplete: (value: string, open: boolean) => void;
  /** Tells the bar a menu or an action is there; returns what undoes it. */
  register: (value: string, entry: MenubarEntry) => () => void;
  /**
   * Whether the closing menu should leave focus where the bar put it (on an action it just handed focus to) instead of
   * returning it to its trigger, as Radix does. Reads and clears the note.
   */
  takeFocusHandoff: () => boolean;
}

export const MenubarContext = createContext<MenubarContextValue | null>(null);

/** What a `Menubar.Menu` shares with its trigger and panel. */
export interface MenubarMenuContextValue {
  value: string;
  /** Called by the trigger while it is disabled with a reason (and with `false` when it is not or is gone). */
  setBlocked: (blocked: boolean) => void;
  /** Whether the bar asked for focus on the first item, and forgets the ask. Read once by the panel as it opens. */
  takeFocusFirst: () => boolean;
}

export const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(
  null,
);

/** The controller of the nearest `Menubar`. `null` outside one. */
export const MenubarControllerContext = createContext<MenubarController | null>(
  null,
);

/** What a controller outside a bar does: nothing. */
export const INERT_CONTROLLER: MenubarController = {
  open: () => false,
  close: () => undefined,
  value: "",
};
