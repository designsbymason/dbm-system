import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { TabsContentProps, TabsSize, TabsVariant } from "../../molecules/Tabs/Tabs.types";

/** One tab in the strip: what it is called, and how it is marked. Add your own fields; they come back in every callback. */
export interface EditorTab {
  /** A unique, stable identifier. It is what `value`, `onClose` and the controller refer to, and the key of the tab. */
  id: string;
  /** What the tab shows: usually a file or record name. A plain string or number also names the tab for assistive technology. */
  label: ReactNode;
  /** An icon shown before the label. A Phosphor icon reference. Decorative: the label names the tab. A pinned tab with none shows a pin. */
  icon?: PhosphorIcon;
  /** The tab's full name, shown by the browser as a tooltip, for a label cut short. */
  title?: string;
  /** The tab holds unsaved changes. A dot replaces the close button until the tab is hovered, and "unsaved changes" is added to its name. */
  dirty?: boolean;
  /** The tab is pinned: it has no close button unless `closable` is set, and it can't be dragged or moved with the keyboard. Pinned tabs go first in `tabs`. */
  pinned?: boolean;
  /**
   * Whether the tab can be closed. A tab is closable when `onClose` is given, unless it is pinned.
   * @default true (false when pinned)
   */
  closable?: boolean;
  /** The tab can't be selected, focused or closed. */
  disabled?: boolean;
  /** The tab's accessible name, replacing its label when the label isn't text. */
  "aria-label"?: string;
}

/** What asked for a close: the close button, the Delete key, a middle-click, or code through the controller or a menu. */
export type EditorTabsCloseVia = "button" | "keyboard" | "middle-click" | "controller";

/** What asked for a reorder: a drag, the keyboard, or code through the controller or a menu. */
export type EditorTabsReorderVia = "pointer" | "keyboard" | "controller";

/** What closing a tab selects. `"neighbor"`: the next tab, or the one before it when it was last. `"none"`: nothing; the caller chooses. */
export type EditorTabsCloseSelects = "neighbor" | "none";

/** How the tabs that don't fit are reached: `"scroll"` scrolls the strip, `"menu"` also adds a menu listing every tab. */
export type EditorTabsOverflow = "scroll" | "menu";

/**
 * The text `EditorTabs` supplies itself, translatable through the `labels` prop. A label that needs numbers is a
 * function of the plain numbers, which the default writes with `formatNumber`.
 */
export interface EditorTabsLabels {
  /** The tab list's accessible name when `aria-label` isn't given. @default "Open tabs" */
  tabList: string;
  /** The close button's name, for the tab called `name`. @default "Close {name}" */
  closeTab: (name: string) => string;
  /** The add button's name. @default "New tab" */
  addTab: string;
  /** The name of the button that opens the menu of every tab (`overflow="menu"`). @default "All tabs" */
  allTabs: string;
  /** Added to the name of a tab that holds unsaved changes. @default "unsaved changes" */
  dirty: string;
  /** Added to the name of a pinned tab. @default "pinned" */
  pinned: string;
  /** The name of the menu opened on a tab (`tabContextMenu`). @default "Actions for {name}" */
  tabMenu: (name: string) => string;
  /** Announced after a tab has been closed. @default "{name} closed" */
  closed: (name: string) => string;
  /** Announced when a tab is picked up to be moved. @default "{name}, picked up. Position 2 of 5. Arrow keys move it, Space drops it, Escape cancels." */
  pickedUp: (name: string, position: number, total: number) => string;
  /** Announced when a picked-up tab moves. @default "{name}, position 2 of 5" */
  moved: (name: string, position: number, total: number) => string;
  /** Announced when a picked-up tab is dropped. @default "{name}, dropped at position 2 of 5" */
  dropped: (name: string, position: number, total: number) => string;
  /** Announced when moving a tab is cancelled. @default "Move cancelled. {name} is back at position 2 of 5" */
  cancelled: (name: string, position: number, total: number) => string;
}

/** What a tab's context menu is told, and can do. */
export interface EditorTabsMenuContext<TTab extends EditorTab = EditorTab> {
  /** The tab the menu was opened on. */
  tab: TTab;
  /** Its position in `tabs`. */
  index: number;
  /** How many tabs there are. */
  count: number;
  /** Asks for the tab to be closed, as the close button would. Returns `false` when it can't be. */
  close: () => boolean;
  /** Asks for the tab to move to position `to`, within its own group (pinned tabs, or the rest). Returns `false` when it can't. */
  move: (to: number) => boolean;
  /** Selects the tab. */
  select: () => boolean;
}

/** What code outside the strip can do to it. Returned by `controllerRef`; its identity never changes and its methods read the latest state. */
export interface EditorTabsController {
  /** Selects a tab. Returns `false` when there is no such tab or it is disabled. */
  select: (id: string) => boolean;
  /** Asks for a tab to be closed, as the close button would. Returns `false` when it can't be (no `onClose`, not closable, no such tab). */
  close: (id: string) => boolean;
  /** Asks for a new tab, as the add button would. Returns `false` when there is no `onAdd`. */
  add: () => boolean;
  /** Asks for a tab to move to position `to`, within its own group (pinned tabs, or the rest). Returns `false` when it can't. */
  move: (id: string, to: number) => boolean;
  /** Moves keyboard focus to a tab. Returns `false` when there is no such tab or it is disabled. */
  focus: (id: string) => boolean;
}

export interface EditorTabsProps<TTab extends EditorTab = EditorTab>
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "defaultValue" | "dir"> {
  /**
   * The tabs, in order. Pinned tabs go first. The strip owns no list: it asks for changes through `onClose`,
   * `onAdd` and `onReorder`, and shows whatever array it is given next.
   */
  tabs: TTab[];
  /** The id of the selected tab, or `null` for none. Makes the selection controlled; pair it with `onValueChange`. */
  value?: string | null;
  /** The id of the tab selected at first, for an uncontrolled strip. */
  defaultValue?: string | null;
  /** Called with the id of the tab a person selected (and of the neighbour chosen after a close). */
  onValueChange?: (id: string) => void;
  /** Called when a tab is asked to close. Closing is off when this is left out. Remove the tab from `tabs` to close it. */
  onClose?: (tab: TTab, via: EditorTabsCloseVia) => void;
  /** Called when the add button is pressed. The button appears only when this is given. */
  onAdd?: () => void;
  /**
   * Called when a tab is asked to move: the position it has now (`from`) and the one it should have (`to`), in
   * `tabs`. Reordering is off when this is left out. Apply it by changing the array.
   */
  onReorder?: (from: number, to: number, via: EditorTabsReorderVia) => void;
  /**
   * What closing the selected tab selects once it is gone.
   * @default "neighbor"
   */
  closeSelects?: EditorTabsCloseSelects;
  /**
   * The items of the menu a right-click, a long press or the context-menu key opens on a tab, as `ContextMenu`
   * items. It is the way to close, move or otherwise act on a tab with a single pointer press, so a person who can't
   * drag can still move one.
   */
  tabContextMenu?: (context: EditorTabsMenuContext<TTab>) => ReactNode;
  /**
   * How the tabs that don't fit are reached.
   * @default "scroll"
   */
  overflow?: EditorTabsOverflow;
  /**
   * How the selected tab is marked (see `Tabs`).
   * @default "underline"
   */
  variant?: TabsVariant;
  /**
   * The size of the tabs and the buttons beside them.
   * @default "md"
   */
  size?: TabsSize;
  /**
   * Fully rounds the tabs of every variant but `underline`.
   * @default false
   */
  rounded?: boolean;
  /**
   * The reading direction, which flips the arrow keys and the side a dragged tab is dropped on.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /** The text the strip supplies itself, merged over the English defaults. */
  labels?: Partial<EditorTabsLabels>;
  /** Writes the numbers the strip announces. Defaults to `String`. */
  formatNumber?: (value: number) => string;
  /** Receives the controller, to select, close, add or move a tab from code outside the strip. */
  controllerRef?: Ref<EditorTabsController>;
  /** The tab list's accessible name, overriding `labels.tabList`. */
  "aria-label"?: string;
  /** The id of a visible element that names the tab list. */
  "aria-labelledby"?: string;
  /** Panels (`EditorTabs.Panel`), drawn under the strip. */
  children?: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Standard DOM id, on the root element. */
  id?: string;
  /** Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors). Has no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface EditorTabsPanelProps extends TabsContentProps {
  /**
   * Keeps the panel mounted, hidden, while its tab isn't selected, so it keeps its state (an editor's undo history, a
   * scroll position). Leave it out and the panel is removed when its tab is not selected.
   */
  forceMount?: true;
}
