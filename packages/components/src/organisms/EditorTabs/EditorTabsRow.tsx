import { memo } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { PushPinIcon, WarningCircleIcon, WarningIcon, XIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import { Icon } from "../../atoms/Icon";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Tabs } from "../../molecules/Tabs";
import { tabIconSize } from "../../molecules/Tabs/tabIconSizes";
import type { TabsSize } from "../../molecules/Tabs/Tabs.types";
import type { MenuPresentation } from "../Menu/Menu.types";
import styles from "./EditorTabs.module.css";
import type { EditorTab, EditorTabsCloseVia, EditorTabsLabels } from "./EditorTabs.types";
import { EditorTabsMenu } from "./EditorTabsMenu";
import { EditorTabsTrigger } from "./EditorTabsTrigger";
import { tabName } from "./editorTabsModel";

/**
 * What a row calls on the strip: one object for the strip's life, each method reading the latest state, so a row's props never change
 * only because the strip rendered again, and a row that did not change is not drawn again.
 */
export interface EditorTabsRowActions {
  requestClose: (id: string, via: EditorTabsCloseVia) => boolean;
  /** The items of the tab menu for a tab, drawn only while the menu is open. */
  renderMenuItems: (id: string) => ReactNode;
  sortKeyDown: (event: KeyboardEvent<HTMLElement>, sortableIndex: number) => boolean;
  sortKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
  /** Drops a tab picked up with the keyboard, as when focus leaves it. */
  releaseKeyboardLift: () => void;
  /** Whether a tab is picked up (by the keyboard or a tap). */
  isLifted: () => boolean;
  pointerDown: (event: PointerEvent<HTMLElement>, sortableIndex: number) => void;
}

export interface EditorTabsRowProps<TTab extends EditorTab> {
  tab: TTab;
  /** The tab's place among the tabs that can be moved, or -1 when it can't be moved. */
  sortableIndex: number;
  size: TabsSize;
  selected: boolean;
  /** The selected tab of the solid variant, drawn on a brand fill. */
  onBrand: boolean;
  closable: boolean;
  /** Whether a panel is drawn for this tab, which its `aria-controls` points at. */
  linked: boolean;
  lifted: boolean;
  dragging: boolean;
  drop: "before" | "after" | undefined;
  hasMenu: boolean;
  menuPresentation: Responsive<MenuPresentation> | undefined;
  dir: "ltr" | "rtl";
  labels: EditorTabsLabels;
  actions: EditorTabsRowActions;
}

function sameTab(a: EditorTab, b: EditorTab): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a) as Array<keyof EditorTab>;
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => Object.is(a[key], b[key]));
}

function sameRow<TTab extends EditorTab>(previous: EditorTabsRowProps<TTab>, next: EditorTabsRowProps<TTab>): boolean {
  for (const key of Object.keys(next) as Array<keyof EditorTabsRowProps<TTab>>) {
    if (key === "tab" ? !sameTab(previous.tab, next.tab) : !Object.is(previous[key], next[key])) return false;
  }
  return true;
}

/**
 * One tab of the strip: the tab button with its tooltip, the close control beside it, and (with a menu) the menu that wraps it. It takes only
 * values and stable actions, and is drawn again only when one of them changed: a tab whose fields are equal to last time's is compared field
 * by field, so a list rebuilt on every render (an inline `.map()`) does not redraw every tab, and a long strip does not redraw all of them to
 * select one, move a drag marker or announce a close.
 */
function EditorTabsRowInner<TTab extends EditorTab>({
  tab,
  sortableIndex,
  size,
  selected,
  onBrand,
  closable,
  linked,
  lifted,
  dragging,
  drop,
  hasMenu,
  menuPresentation,
  dir,
  labels,
  actions,
}: EditorTabsRowProps<TTab>) {
  const name = tabName(tab);
  const canSort = sortableIndex >= 0;

  const statusWord = tab.status ? (tab.statusText ?? { busy: labels.statusBusy, error: labels.statusError, warning: labels.statusWarning }[tab.status]) : null;
  const status = [tab.pinned ? labels.pinned : null, tab.dirty ? labels.dirty : null, statusWord].filter(Boolean).join(", ");
  const triggerLabel = tab["aria-label"] && status ? `${tab["aria-label"]} (${status})` : tab["aria-label"];

  const action = closable ? (
    <button
      type="button"
      tabIndex={-1}
      className={styles.close}
      data-dirty={tab.dirty ? "" : undefined}
      aria-label={labels.closeTab(name)}
      // Keeps focus where it is: a press on this is not a move of focus to a control that is out of the tab order.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => actions.requestClose(tab.id, "button")}
    >
      {tab.dirty && <span className={styles.dirtyDot} />}
      <Icon icon={XIcon} size="xs" className={styles.closeIcon} />
    </button>
  ) : tab.dirty ? (
    <span className={styles.dirtyStatic}>
      <span className={styles.dirtyDot} />
    </span>
  ) : undefined;

  const item = (
    <Tabs.Item
      className={styles.item}
      data-editor-tab-item={tab.id}
      // The selected tab of the solid variant is a brand fill, so what is drawn on it changes colour.
      data-on-brand={onBrand ? "" : undefined}
      action={action}
    >
      <EditorTabsTrigger
        value={tab.id}
        icon={tab.icon ?? (tab.pinned ? PushPinIcon : undefined)}
        disabled={tab.disabled}
        detail={tab.tooltip ?? tab.title}
        fullName={name}
        aria-label={triggerLabel}
        aria-keyshortcuts={closable ? "Delete" : undefined}
        className={styles.tab}
        data-tab-id={tab.id}
        // The tooltip around the button also sets a `data-state` (open or closed), which would replace the tab's own
        // (active or inactive) that the styles and the scroll-into-view read, so it is set here and wins.
        data-state={selected ? "active" : "inactive"}
        {...(linked ? {} : { "aria-controls": undefined })}
        {...(canSort ? { "data-sortable-index": sortableIndex } : {})}
        data-lifted={lifted ? true : undefined}
        data-dragging={dragging ? true : undefined}
        data-drop={drop}
        onPointerDown={(event) => {
          // A touch press is a scroll of the strip; moving a tab is by the keyboard or the tab menu there.
          if (event.pointerType === "touch" || !canSort) return;
          actions.pointerDown(event, sortableIndex);
        }}
        onKeyDown={(event) => {
          if (canSort && actions.sortKeyDown(event, sortableIndex)) return;
          if (event.key === "Delete" && closable && !actions.isLifted()) {
            event.preventDefault();
            actions.requestClose(tab.id, "keyboard");
          }
        }}
        onKeyUp={(event) => {
          if (canSort) actions.sortKeyUp(event);
        }}
        onBlur={() => {
          if (canSort) actions.releaseKeyboardLift();
        }}
        onMouseDown={(event) => {
          // The browser's autoscroll mode would start on a middle press.
          if (event.button === 1 && closable) event.preventDefault();
        }}
        onAuxClick={(event) => {
          if (event.button === 1 && closable) {
            event.preventDefault();
            actions.requestClose(tab.id, "middle-click");
          }
        }}
      >
        <span className={styles.content}>
          <span className={styles.label} data-editor-tab-label="">
            {tab.label}
          </span>
          {tab.status && (
            <span className={styles.status} data-status={tab.status} aria-hidden="true">
              {tab.status === "busy" ? (
                <Spinner size={tabIconSize[size]} />
              ) : (
                <Icon icon={tab.status === "error" ? WarningCircleIcon : WarningIcon} size={tabIconSize[size]} />
              )}
            </span>
          )}
        </span>
        {status && <VisuallyHidden>{` (${status})`}</VisuallyHidden>}
      </EditorTabsTrigger>
    </Tabs.Item>
  );

  if (!hasMenu) return item;
  return (
    <EditorTabsMenu name={labels.tabMenu(name)} dir={dir} presentation={menuPresentation} renderItems={() => actions.renderMenuItems(tab.id)}>
      {item}
    </EditorTabsMenu>
  );
}

export const EditorTabsRow = memo(EditorTabsRowInner, sameRow) as typeof EditorTabsRowInner;
