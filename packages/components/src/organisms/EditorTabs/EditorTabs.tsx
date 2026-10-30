import { CaretDownIcon, PlusIcon, PushPinIcon, WarningCircleIcon, WarningIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue, useSortable } from "@dbm-system/utils";
import { Children, forwardRef, Fragment, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode, Ref, RefAttributes } from "react";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Tabs } from "../../molecules/Tabs";
import { tabIconSize } from "../../molecules/Tabs/tabIconSizes";
import type { TabsOrientation } from "../../molecules/Tabs/Tabs.types";
import { Menu } from "../Menu";
import styles from "./EditorTabs.module.css";
import type {
  EditorTab,
  EditorTabsCloseVia,
  EditorTabsLabels,
  EditorTabsMenuContext,
  EditorTabsPanelProps,
  EditorTabsProps,
} from "./EditorTabs.types";
import { EditorTabsMenu } from "./EditorTabsMenu";
import { editorTabsPresetMenu } from "./EditorTabsPresetMenu";
import { EditorTabsTrigger } from "./EditorTabsTrigger";
import {
  chooseAfterClose,
  clampToGroup,
  closableAfter,
  closableOthers,
  isClosable,
  pinnedCount,
  recordRecent,
  tabName,
} from "./editorTabsModel";
import { useEditorTabsController } from "./useEditorTabsController";
import { useEditorTabsFlip } from "./useEditorTabsFlip";
import { useEditorTabsHotkeys } from "./useEditorTabsHotkeys";
import { useEditorTabsWarnings } from "./useEditorTabsWarnings";

function defaultLabels(formatNumber: (value: number) => string): EditorTabsLabels {
  const where = (position: number, total: number) => `${formatNumber(position)} of ${formatNumber(total)}`;
  return {
    tabList: "Open tabs",
    closeTab: (name) => `Close ${name}`,
    addTab: "New tab",
    allTabs: "All tabs",
    dirty: "unsaved changes",
    pinned: "pinned",
    tabMenu: (name) => `Actions for ${name}`,
    closed: (name) => `${name} closed`,
    closedMany: (count) => `${formatNumber(count)} tabs closed`,
    statusBusy: "busy",
    statusError: "error",
    statusWarning: "warning",
    menuClose: "Close",
    menuCloseOthers: "Close others",
    menuCloseAfter: "Close tabs after this one",
    menuCloseAll: "Close all",
    menuMoveToStart: "Move to the start",
    menuMoveEarlier: "Move earlier",
    menuMoveLater: "Move later",
    menuMoveToEnd: "Move to the end",
    pickedUp: (name, position, total) =>
      `${name}, picked up. Position ${where(position, total)}. Arrow keys move it, Space drops it, Escape cancels.`,
    moved: (name, position, total) => `${name}, position ${where(position, total)}`,
    dropped: (name, position, total) => `${name}, dropped at position ${where(position, total)}`,
    cancelled: (name, position, total) => `Move cancelled. ${name} is back at position ${where(position, total)}`,
  };
}

/** What a close leaves behind for the commit that removes the tab: where focus and the selection go. */
interface PendingClose {
  closedIds: string[];
  /** The ids in order when the close was asked, to find the neighbour of a tab that is gone. */
  order: string[];
  selectedId: string | null;
  hadFocus: boolean;
}

/** The `value` of every `EditorTabs.Panel` among the children, looking inside fragments (a panel wrapped in another component is not found). */
function collectPanelValues(children: ReactNode, into: Set<string>): void {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) collectPanelValues((child.props as { children?: ReactNode }).children, into);
    else if (child.type === EditorTabsPanel) into.add((child.props as EditorTabsPanelProps).value);
  });
}

function EditorTabsInner<TTab extends EditorTab>(props: EditorTabsProps<TTab>, ref: Ref<HTMLDivElement>) {
  const {
    tabs,
    value,
    defaultValue,
    onValueChange,
    onClose,
    onCloseMany,
    onAdd,
    onReorder,
    closeSelects = "neighbor",
    tabMenu = false,
    tabContextMenu,
    menuPresentation,
    hotkeys,
    orientation: orientationProp = "horizontal",
    overflow = "scroll",
    variant = "underline",
    size = "md",
    rounded = false,
    dir = "ltr",
    labels: labelsProp,
    formatNumber = String,
    controllerRef,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    children,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = props;

  const labels = mergeDefined(defaultLabels(formatNumber), labelsProp);
  const orientation = useResolvedResponsiveValue<TabsOrientation>(orientationProp, "horizontal");
  const vertical = orientation === "vertical";
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const flipSkip = useRef<string | null>(null);
  const { message, announce } = useAnnouncement();

  const isControlled = value !== undefined;
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const current = isControlled ? value : inner;

  // A tab points at its panel only when one is drawn for it: the strip works without panels, and a tab that names a
  // panel that isn't there is an invalid reference.
  const panelValues = new Set<string>();
  collectPanelValues(children, panelValues);

  const pinned = pinnedCount(tabs);
  const movable = Boolean(onReorder) && tabs.length - pinned > 1;

  // What the handlers below read, so they are right however long ago a listener was attached.
  const latest = useRef({ tabs, current, closeSelects, onClose, onCloseMany, onAdd, onReorder, onValueChange, isControlled });
  useEffect(() => {
    latest.current = { tabs, current, closeSelects, onClose, onCloseMany, onAdd, onReorder, onValueChange, isControlled };
  });

  // The tabs that were selected, most recent last: what `closeSelects="previous"` goes back to.
  const recent = useRef<string[]>([]);
  useEffect(() => {
    if (current) recent.current = recordRecent(recent.current, current);
  }, [current]);

  const pendingClose = useRef<PendingClose | null>(null);

  const select = (id: string): boolean => {
    const tab = latest.current.tabs.find((candidate) => candidate.id === id);
    if (!tab || tab.disabled) return false;
    // A person who has chosen another tab has moved on from a close the owner has not applied: it no longer decides what is selected or focused.
    pendingClose.current = null;
    if (!latest.current.isControlled) setInner(id);
    latest.current.onValueChange?.(id);
    return true;
  };

  const focusTab = (id: string): boolean => {
    const element = listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`);
    if (!element || (element as HTMLButtonElement).disabled) return false;
    element.focus();
    return true;
  };

  // --- Closing ---

  const closedNames = useRef(new Map<string, string>());
  // The tabs the strip was asked to close and the owner has not yet removed: only these are announced as closed.
  const requestedClose = useRef(new Set<string>());
  const holdClose = (closedIds: string[]) => {
    const { tabs: all, current: selected } = latest.current;
    for (const closing of closedIds) requestedClose.current.add(closing);
    const root = rootRef.current;
    pendingClose.current = {
      closedIds,
      order: all.map((tab) => tab.id),
      selectedId: selected,
      hadFocus: Boolean(root && document.activeElement && root.contains(document.activeElement)),
    };
  };
  const requestClose = (id: string, via: EditorTabsCloseVia): boolean => {
    const { tabs: all, onClose: ask } = latest.current;
    const tab = all.find((candidate) => candidate.id === id);
    if (!ask || !tab || !isClosable(tab)) return false;
    closedNames.current.set(id, tabName(tab));
    holdClose([id]);
    ask(tab, via);
    return true;
  };
  const requestCloseMany = (ids: string[], via: EditorTabsCloseVia): boolean => {
    const { tabs: all, onCloseMany: ask } = latest.current;
    if (!ask) return false;
    const list = ids.map((id) => all.find((candidate) => candidate.id === id)).filter((tab): tab is TTab => tab !== undefined && isClosable(tab));
    if (list.length === 0) return false;
    holdClose(list.map((tab) => tab.id));
    ask(list, via);
    return true;
  };

  // Moves focus to a tab after a keyboard move, which re-orders the DOM nodes and can drop focus.
  const refocus = useRef<string | null>(null);

  // The commit that removes closed tabs: choose what is selected next, and hand focus on only if it was lost.
  useLayoutEffect(() => {
    const pending = pendingClose.current;
    if (pending && pending.closedIds.some((closed) => !tabs.some((tab) => tab.id === closed))) {
      pendingClose.current = null;
      const remaining = tabs.map((tab) => tab.id);
      const enabled = new Set(tabs.filter((tab) => !tab.disabled).map((tab) => tab.id));
      const mode = latest.current.closeSelects;
      const gone = pending.closedIds.filter((closed) => !remaining.includes(closed));
      const selectedGone = pending.selectedId !== null && gone.includes(pending.selectedId);
      let chosen: string | null = null;
      if (selectedGone && mode !== "none") {
        // An owner that has already moved the selection to a tab that is still there has chosen: keep it.
        chosen =
          current !== null && remaining.includes(current)
            ? current
            : chooseAfterClose({ order: pending.order, selectedId: pending.selectedId!, remaining, enabled, recent: recent.current, mode });
        if (chosen && chosen !== current) select(chosen);
      }
      const active = document.activeElement;
      if (pending.hadFocus && (!active || active === document.body)) {
        const target =
          chosen ?? chooseAfterClose({ order: pending.order, selectedId: gone[0]!, remaining, enabled, recent: [], mode: "neighbor" });
        if (!(target && focusTab(target))) addRef.current?.focus();
      }
    }
    // If the tabs are still there the caller refused, or hasn't closed them yet: the note is kept for the commit that does.
    const target = refocus.current;
    if (target) {
      refocus.current = null;
      if (document.activeElement !== listRef.current?.querySelector(`[data-tab-id="${CSS.escape(target)}"]`)) focusTab(target);
    }
    // `select` and `focusTab` read refs, so the effect depends on the tabs and the selection alone.
  }, [tabs, current]);

  const previousTabs = useRef(tabs);
  useEffect(() => {
    // Tabs the strip was asked to close, once they have left the list, are announced as closed, by the name they had. A list
    // swapped for another (a different project) is not a close, so nothing is announced for tabs nobody asked to close.
    const left = previousTabs.current.filter((tab) => !tabs.some((now) => now.id === tab.id));
    previousTabs.current = tabs;
    const asked = left.filter((tab) => requestedClose.current.has(tab.id));
    if (asked.length === 1 && asked[0]) announce(labels.closed(closedNames.current.get(asked[0].id) ?? tabName(asked[0])));
    else if (asked.length > 1) announce(labels.closedMany(asked.length));
    for (const tab of left) {
      requestedClose.current.delete(tab.id);
      closedNames.current.delete(tab.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs]);

  // --- Reordering ---

  const {
    containerRef: sortContainerRef,
    itemProps: sortItemProps,
    handleKeyDown: sortKeyDown,
    handleKeyUp: sortKeyUp,
    release: sortRelease,
    lifted: sortLifted,
    liftedVia: sortLiftedVia,
  } = useSortable<HTMLDivElement>({
    enabled: movable,
    count: tabs.length - pinned,
    autoScroll: true,
    orientation,
    rtl: dir === "rtl",
    onMove: (from, to, { via }) => {
      const tab = latest.current.tabs[from + pinned];
      if (!tab) return;
      latest.current.onReorder?.(from + pinned, to + pinned, via);
      if (via === "keyboard") refocus.current = tab.id;
      // A tab the pointer has already put where it goes does not slide there a second time.
      if (via === "pointer") flipSkip.current = tab.id;
      announce(labels.moved(tabName(tab), to + pinned + 1, latest.current.tabs.length));
    },
    onLift: (index) => {
      const tab = latest.current.tabs[index + pinned];
      if (tab) announce(labels.pickedUp(tabName(tab), index + pinned + 1, latest.current.tabs.length));
    },
    onDrop: (index) => {
      const tab = latest.current.tabs[index + pinned];
      if (tab) announce(labels.dropped(tabName(tab), index + pinned + 1, latest.current.tabs.length));
    },
    onCancel: (origin) => {
      const tab = latest.current.tabs[origin + pinned];
      if (tab) announce(labels.cancelled(tabName(tab), origin + pinned + 1, latest.current.tabs.length));
    },
  });

  const moveTab = (id: string, to: number): boolean => {
    const { tabs: all, onReorder: ask } = latest.current;
    const from = all.findIndex((candidate) => candidate.id === id);
    if (!ask || from < 0) return false;
    const target = clampToGroup(all, from, to);
    if (target === from) return false;
    ask(from, target, "controller");
    return true;
  };

  useEditorTabsFlip(listRef, tabs, vertical, () => {
    const id = flipSkip.current;
    flipSkip.current = null;
    return id;
  });

  // --- Shortcuts and the controller ---

  const runHotkey = (action: "next" | "previous" | "close" | "add"): boolean => {
    const { tabs: all, current: selected, onAdd: add } = latest.current;
    if (action === "add") {
      if (!add) return false;
      add();
      return true;
    }
    if (action === "close") return selected !== null && requestClose(selected, "hotkey");
    const enabled = all.filter((tab) => !tab.disabled);
    if (enabled.length === 0) return false;
    const at = enabled.findIndex((tab) => tab.id === selected);
    const step = action === "next" ? 1 : -1;
    const target = at < 0 ? (action === "next" ? enabled[0] : enabled[enabled.length - 1]) : enabled[(at + step + enabled.length) % enabled.length];
    if (!target) return false;
    const inside = Boolean(rootRef.current && document.activeElement && rootRef.current.contains(document.activeElement));
    select(target.id);
    if (inside) focusTab(target.id);
    return true;
  };
  useEditorTabsHotkeys(hotkeys, runHotkey);

  useEditorTabsController(controllerRef, {
    select,
    close: (tabId) => requestClose(tabId, "controller"),
    closeMany: (ids) => requestCloseMany(ids, "controller"),
    add: () => {
      if (!latest.current.onAdd) return false;
      latest.current.onAdd();
      return true;
    },
    move: moveTab,
    focus: focusTab,
  });

  useEditorTabsWarnings(tabs, { reorder: Boolean(onReorder), menu: tabMenu || Boolean(tabContextMenu) });

  // --- Drawing ---

  const renderTab = (tab: TTab, index: number): ReactNode => {
    const name = tabName(tab);
    const closable = Boolean(onClose) && isClosable(tab);
    const sortableIndex = index - pinned;
    const canSort = movable && sortableIndex >= 0 && !tab.disabled;
    const sortProps = canSort ? sortItemProps(sortableIndex) : undefined;

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
        onClick={() => requestClose(tab.id, "button")}
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
        key={tab.id}
        className={styles.item}
        data-editor-tab-item={tab.id}
        // The selected tab of the solid variant is a brand fill, so what is drawn on it changes colour.
        data-on-brand={variant === "solid" && current === tab.id ? "" : undefined}
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
          data-state={current === tab.id ? "active" : "inactive"}
          {...(panelValues.has(tab.id) ? {} : { "aria-controls": undefined })}
          {...sortProps}
          onPointerDown={(event) => {
            // A touch press is a scroll of the strip; moving a tab is by the keyboard or the tab menu there.
            if (event.pointerType === "touch") return;
            sortProps?.onPointerDown(event);
          }}
          onKeyDown={(event) => {
            if (canSort && sortKeyDown(event, sortableIndex)) return;
            if (event.key === "Delete" && closable && sortLifted === null) {
              event.preventDefault();
              requestClose(tab.id, "keyboard");
            }
          }}
          onKeyUp={(event) => {
            if (canSort) sortKeyUp(event);
          }}
          onBlur={() => {
            if (canSort && sortLiftedVia === "keyboard") sortRelease("keyboard");
          }}
          onMouseDown={(event) => {
            // The browser's autoscroll mode would start on a middle press.
            if (event.button === 1 && closable) event.preventDefault();
          }}
          onAuxClick={(event) => {
            if (event.button === 1 && closable) {
              event.preventDefault();
              requestClose(tab.id, "middle-click");
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

    if (!tabContextMenu && !tabMenu) return item;
    const context: EditorTabsMenuContext<TTab> = {
      tab,
      index,
      count: tabs.length,
      close: () => requestClose(tab.id, "menu"),
      closeMany: (ids) => requestCloseMany(ids, "menu"),
      closeOthers: () => requestCloseMany(closableOthers(tabs, tab.id).map((other) => other.id), "menu"),
      closeAfter: () => requestCloseMany(closableAfter(tabs, tab.id).map((other) => other.id), "menu"),
      move: (to) => moveTab(tab.id, to),
      select: () => select(tab.id),
    };
    return (
      <EditorTabsMenu
        key={tab.id}
        name={labels.tabMenu(name)}
        dir={dir}
        presentation={menuPresentation}
        renderItems={() =>
          tabMenu
            ? editorTabsPresetMenu({
                context,
                tabs,
                labels,
                canClose: Boolean(onClose),
                canCloseMany: Boolean(onCloseMany),
                canReorder: Boolean(onReorder),
                pinned,
                custom: tabContextMenu?.(context),
              })
            : tabContextMenu!(context)
        }
      >
        {item}
      </EditorTabsMenu>
    );
  };

  return (
    <Tabs
      {...rest}
      ref={mergeRefs(ref, rootRef)}
      value={current ?? ""}
      onValueChange={select}
      orientation={orientation}
      variant={variant}
      size={size}
      rounded={rounded}
      dir={dir}
      className={cx(styles.root, className)}
      style={style}
      id={id}
      data-testid={dataTestId}
    >
      <div className={styles.bar} data-orientation={orientation}>
        <Tabs.List
          ref={mergeRefs(listRef, sortContainerRef)}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.tabList)}
          aria-labelledby={ariaLabelledBy}
          className={styles.list}
        >
          {tabs.map((tab, index) => renderTab(tab, index))}
        </Tabs.List>
        {overflow === "menu" && tabs.length > 0 && (
          <Menu dir={dir}>
            <Menu.Trigger asChild>
              <IconButton icon={CaretDownIcon} aria-label={labels.allTabs} tooltip size={size} variant="ghost" tone="neutral" rounded={rounded} className={styles.barButton} />
            </Menu.Trigger>
            <Menu.Content align="end" size={size}>
              <Menu.RadioGroup aria-label={labels.allTabs} value={current ?? ""} onValueChange={(next) => select(next)}>
                {tabs.map((tab) => (
                  <Menu.RadioItem key={tab.id} value={tab.id} icon={tab.icon} disabled={tab.disabled}>
                    {tab.label}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Content>
          </Menu>
        )}
        {onAdd && (
          <IconButton
            ref={addRef}
            icon={PlusIcon}
            aria-label={labels.addTab}
            tooltip
            size={size}
            variant="ghost"
            tone="neutral"
            rounded={rounded}
            className={styles.barButton}
            onClick={() => onAdd()}
          />
        )}
      </div>
      {children}
      <VisuallyHidden role="status">{message}</VisuallyHidden>
    </Tabs>
  );
}

/**
 * A panel under the strip, shown while its tab is selected: `Tabs.Content`, with the same `value` as the tab's `id`.
 * Removed while its tab isn't selected unless `forceMount` keeps it, hidden, in the page so it holds its state.
 */
const EditorTabsPanel = forwardRef<HTMLDivElement, EditorTabsPanelProps>((props, ref) => <Tabs.Content {...props} ref={ref} />);
EditorTabsPanel.displayName = "EditorTabs.Panel";

type EditorTabsComponent = (<TTab extends EditorTab = EditorTab>(
  props: EditorTabsProps<TTab> & RefAttributes<HTMLDivElement>,
) => ReactElement | null) & {
  displayName?: string;
  Panel: typeof EditorTabsPanel;
};

/**
 * A strip of tabs given as data, for tabs the person opens, closes and arranges themselves: open files, open records,
 * saved views. Built on `Tabs`, so the tab list keeps its looks (`variant`, `size`, `rounded`), its one tab stop with
 * arrow-key movement, and its scrolling with a fade and buttons when the tabs outgrow the width.
 *
 * It owns no list. `tabs` is the order and the contents; `onClose`, `onAdd` and `onReorder` ask for a change and the
 * strip shows what it is given next. Closing is the close button, the Delete key on a focused tab, or a middle-click;
 * the selection moves to a neighbour when the selected tab goes (`closeSelects`). A tab is moved by dragging it (a
 * mouse or pen), or with the keyboard: Alt with an arrow key moves the focused tab one place, and Space picks it up
 * to move it further, Space or Enter drops it and Escape puts it back. `tabContextMenu` is a menu on a tab, which is
 * also how a touch screen moves one. `dirty` marks unsaved changes, `pinned` keeps a tab at the start.
 *
 * Panels (`EditorTabs.Panel`, with a `value` equal to the tab's `id`) are optional: leave them out to draw the
 * content yourself from the selection.
 *
 * `ref` forwards to the root `<div>`; `className`, `style`, `id` and `data-testid` land there too.
 *
 * @example
 * ```tsx
 * const [tabs, setTabs] = useState([{ id: "a", label: "index.ts" }, { id: "b", label: "app.ts", dirty: true }]);
 * const [open, setOpen] = useState("a");
 * <EditorTabs
 *   tabs={tabs}
 *   value={open}
 *   onValueChange={setOpen}
 *   onClose={(tab) => setTabs((all) => all.filter((t) => t.id !== tab.id))}
 *   onReorder={(from, to) => setTabs((all) => move(all, from, to))}
 *   onAdd={() => setTabs((all) => [...all, { id: crypto.randomUUID(), label: "untitled" }])}
 * />
 * ```
 */
export const EditorTabs = forwardRef(EditorTabsInner) as unknown as EditorTabsComponent;
EditorTabs.displayName = "EditorTabs";
EditorTabs.Panel = EditorTabsPanel;
