import { CaretDownIcon, PlusIcon, PushPinIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useSortable } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode, Ref, RefAttributes } from "react";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Tabs } from "../../molecules/Tabs";
import { Menu } from "../Menu";
import styles from "./EditorTabs.module.css";
import type {
  EditorTab,
  EditorTabsCloseVia,
  EditorTabsLabels,
  EditorTabsPanelProps,
  EditorTabsProps,
} from "./EditorTabs.types";
import { EditorTabsMenu } from "./EditorTabsMenu";
import { clampToGroup, isClosable, neighbourId, pinnedCount, tabName } from "./editorTabsModel";
import { useEditorTabsController } from "./useEditorTabsController";
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
    pickedUp: (name, position, total) =>
      `${name}, picked up. Position ${where(position, total)}. Arrow keys move it, Space drops it, Escape cancels.`,
    moved: (name, position, total) => `${name}, position ${where(position, total)}`,
    dropped: (name, position, total) => `${name}, dropped at position ${where(position, total)}`,
    cancelled: (name, position, total) => `Move cancelled. ${name} is back at position ${where(position, total)}`,
  };
}

/** What a close leaves behind for the commit that removes the tab: where focus and the selection go. */
interface PendingClose {
  closedId: string;
  neighbourId: string | null;
  wasSelected: boolean;
  hadFocus: boolean;
}

function EditorTabsInner<TTab extends EditorTab>(props: EditorTabsProps<TTab>, ref: Ref<HTMLDivElement>) {
  const {
    tabs,
    value,
    defaultValue,
    onValueChange,
    onClose,
    onAdd,
    onReorder,
    closeSelects = "neighbor",
    tabContextMenu,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const { message, announce } = useAnnouncement();

  const isControlled = value !== undefined;
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const current = isControlled ? value : inner;

  // A tab points at its panel only when one is drawn for it: the strip works without panels, and a tab that names a
  // panel that isn't there is an invalid reference.
  const panelValues = new Set<string>();
  Children.forEach(children, (child) => {
    if (isValidElement<EditorTabsPanelProps>(child) && child.type === EditorTabsPanel) panelValues.add(child.props.value);
  });

  const pinned = pinnedCount(tabs);
  const movable = Boolean(onReorder) && tabs.length - pinned > 1;

  // What the handlers below read, so they are right however long ago a listener was attached.
  const latest = useRef({ tabs, current, closeSelects, onClose, onAdd, onReorder, onValueChange, isControlled });
  useEffect(() => {
    latest.current = { tabs, current, closeSelects, onClose, onAdd, onReorder, onValueChange, isControlled };
  });

  const select = (id: string): boolean => {
    const tab = latest.current.tabs.find((candidate) => candidate.id === id);
    if (!tab || tab.disabled) return false;
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

  const pendingClose = useRef<PendingClose | null>(null);
  const requestClose = (id: string, via: EditorTabsCloseVia): boolean => {
    const { tabs: all, current: selected, onClose: ask } = latest.current;
    const index = all.findIndex((candidate) => candidate.id === id);
    const tab = all[index];
    if (!ask || !tab || !isClosable(tab)) return false;
    const root = rootRef.current;
    pendingClose.current = {
      closedId: id,
      neighbourId: neighbourId(all, index),
      wasSelected: selected === id,
      hadFocus: Boolean(root && document.activeElement && root.contains(document.activeElement)),
    };
    ask(tab, via);
    return true;
  };

  // Moves focus to a tab after a keyboard move, which re-orders the DOM nodes and can drop focus.
  const refocus = useRef<string | null>(null);

  // The commit that removes a closed tab: choose its neighbour and hand focus on, only if focus is still lost.
  useLayoutEffect(() => {
    const pending = pendingClose.current;
    if (pending && !tabs.some((tab) => tab.id === pending.closedId)) {
      pendingClose.current = null;
      if (pending.wasSelected && latest.current.closeSelects === "neighbor" && pending.neighbourId) {
        select(pending.neighbourId);
      }
      const active = document.activeElement;
      if (pending.hadFocus && (!active || active === document.body)) {
        if (!(pending.neighbourId && focusTab(pending.neighbourId))) addRef.current?.focus();
      }
    }
    // If the tab is still there the caller refused, or hasn't closed it yet: the note is kept for the commit that does.
    const target = refocus.current;
    if (target) {
      refocus.current = null;
      if (document.activeElement !== listRef.current?.querySelector(`[data-tab-id="${CSS.escape(target)}"]`)) focusTab(target);
    }
    // `select` and `focusTab` read refs, so the effect depends on the tabs alone.
  }, [tabs]);

  const closedNames = useRef(new Map<string, string>());
  const previousTabs = useRef(tabs);
  useEffect(() => {
    // A tab that has left the list is announced as closed, by the name it had.
    const gone = previousTabs.current.filter((tab) => !tabs.some((now) => now.id === tab.id));
    previousTabs.current = tabs;
    if (gone.length === 1 && gone[0]) announce(labels.closed(closedNames.current.get(gone[0].id) ?? tabName(gone[0])));
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
    rtl: dir === "rtl",
    onMove: (from, to, { via }) => {
      const tab = latest.current.tabs[from + pinned];
      if (!tab) return;
      latest.current.onReorder?.(from + pinned, to + pinned, via);
      if (via === "keyboard") refocus.current = tab.id;
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

  useEditorTabsController(controllerRef, {
    select,
    close: (tabId) => requestClose(tabId, "controller"),
    add: () => {
      if (!latest.current.onAdd) return false;
      latest.current.onAdd();
      return true;
    },
    move: moveTab,
    focus: focusTab,
  });

  useEditorTabsWarnings(tabs);

  // --- Drawing ---

  const renderTab = (tab: TTab, index: number): ReactNode => {
    const name = tabName(tab);
    const closable = Boolean(onClose) && isClosable(tab);
    const sortableIndex = index - pinned;
    const canSort = movable && sortableIndex >= 0 && !tab.disabled;
    const sortProps = canSort ? sortItemProps(sortableIndex) : undefined;

    const status = [tab.pinned ? labels.pinned : null, tab.dirty ? labels.dirty : null].filter(Boolean).join(", ");
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
        onClick={() => {
          closedNames.current.set(tab.id, name);
          requestClose(tab.id, "button");
        }}
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
        // The selected tab of the solid variant is a brand fill, so what is drawn on it changes colour.
        data-on-brand={variant === "solid" && current === tab.id ? "" : undefined}
        action={action}
      >
        <Tabs.Trigger
          value={tab.id}
          icon={tab.icon ?? (tab.pinned ? PushPinIcon : undefined)}
          disabled={tab.disabled}
          title={tab.title}
          aria-label={triggerLabel}
          aria-keyshortcuts={closable ? "Delete" : undefined}
          {...(panelValues.has(tab.id) ? {} : { "aria-controls": undefined })}
          className={styles.tab}
          data-tab-id={tab.id}
          {...sortProps}
          onPointerDown={(event) => {
            // A touch press is a scroll of the strip; moving a tab is by the keyboard or a menu there (`tabContextMenu`).
            if (event.pointerType === "touch") return;
            sortProps?.onPointerDown(event);
          }}
          onKeyDown={(event) => {
            if (canSort && sortKeyDown(event, sortableIndex)) return;
            if (event.key === "Delete" && closable && sortLifted === null) {
              event.preventDefault();
              closedNames.current.set(tab.id, name);
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
              closedNames.current.set(tab.id, name);
              requestClose(tab.id, "middle-click");
            }
          }}
        >
          <span className={styles.label}>{tab.label}</span>
          {status && <VisuallyHidden>{` (${status})`}</VisuallyHidden>}
        </Tabs.Trigger>
      </Tabs.Item>
    );

    if (!tabContextMenu) return item;
    return (
      <EditorTabsMenu
        key={tab.id}
        name={labels.tabMenu(name)}
        renderItems={() =>
          tabContextMenu({
            tab,
            index,
            count: tabs.length,
            close: () => requestClose(tab.id, "controller"),
            move: (to) => moveTab(tab.id, to),
            select: () => select(tab.id),
          })
        }
      >
        {item}
      </EditorTabsMenu>
    );
  };

  const buttonSize = size;

  return (
    <Tabs
      {...rest}
      ref={mergeRefs(ref, rootRef)}
      value={current ?? ""}
      onValueChange={select}
      variant={variant}
      size={size}
      rounded={rounded}
      dir={dir}
      className={cx(styles.root, className)}
      style={style}
      id={id}
      data-testid={dataTestId}
    >
      <div className={styles.bar}>
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
              <IconButton
                icon={CaretDownIcon}
                aria-label={labels.allTabs}
                tooltip
                size={buttonSize}
                variant="ghost"
                tone="neutral"
                rounded={rounded}
              />
            </Menu.Trigger>
            <Menu.Content align="end" size={buttonSize}>
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
            size={buttonSize}
            variant="ghost"
            tone="neutral"
            rounded={rounded}
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
