import { CaretLeftIcon, CaretRightIcon, CheckIcon, MinusIcon, WarningIcon } from "@dbm-system/icons";
import { cx, mergeDefined, useAnnouncement, useWindowedList } from "@dbm-system/utils";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Highlight } from "../../atoms/Highlight";
import { Icon } from "../../atoms/Icon";
import { Skeleton } from "../../atoms/Skeleton";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Tree.module.css";
import { readLengthToken } from "./Tree.length";
import type {
  TreeContextMenuRequest,
  TreeController,
  TreeLabels,
  TreeNode,
  TreeProps,
  TreeRowState,
  TreeSelectionMode,
  TreeSize,
} from "./Tree.types";
import { ancestorsOf, canExpand, checkStates, indexTree, toggleChecked, visibleRows } from "./treeModel";
import type { TreeRow } from "./treeModel";
import { useTreeList } from "./useTreeList";

const sizeClass: Record<TreeSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeFor: Record<TreeSize, "xs" | "sm" | "md" | "lg"> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "lg" };

/** Visible rows from which `windowed="auto"` draws only the ones in view. */
const WINDOW_THRESHOLD = 200;
const OVERSCAN = 8;
// Used until the row's token has been read, and where nothing is laid out (a server render): not a design value.
const FALLBACK_ROW_PX = 36;
// How long a typed letter keeps counting towards the word being typed.
const TYPEAHEAD_MS = 600;
// How long after the key that asks for a menu a `contextmenu` event from the same press is taken as that press.
const MENU_KEY_ECHO_MS = 500;

// The shape of the placeholder rows `loading` draws: a few levels and a few widths, repeated, so it reads as a small tree.
const PLACEHOLDER_LEVELS = [1, 2, 2, 1] as const;
const PLACEHOLDER_WIDTHS = ["55%", "40%", "65%", "50%"] as const;
const MAX_PLACEHOLDERS = 20;
const DEFAULT_PLACEHOLDERS = 3;

const normalizeLoadingCount = (count: number): number =>
  Number.isFinite(count) ? Math.min(Math.max(Math.trunc(count), 0), MAX_PLACEHOLDERS) : DEFAULT_PLACEHOLDERS;

const noSubscription = () => () => undefined;
const noSnapshot = (): undefined => undefined;

const defaultLabels = (formatNumber: (value: number) => string): TreeLabels => ({
  empty: "No items",
  childrenLoaded: (count) => `${formatNumber(count)} ${count === 1 ? "item" : "items"} loaded`,
  loading: "Loading",
  rename: (label) => `Rename ${label}`,
  nameRequired: "Enter a name",
  emptyFolder: "Empty",
  loadFailed: "Couldn't load. Press Enter to try again.",
});

/**
 * An expandable hierarchy of rows: a file tree, a category picker, a permissions list. The rows are the `nodes` you give,
 * each with an `id`, a `label` and optionally `children`; a row with children opens and closes. Optionally rows can be selected
 * (`selectionMode`), given a check box (`checkable`; a row above others shows "indeterminate" when only some beneath it are
 * checked), fetched when opened (`hasChildren` and `loadingIds`), and drawn a window at a time when there are thousands
 * (`windowed`).
 *
 * It follows the WAI-ARIA tree pattern: one tab stop, then arrow keys. Up and Down move between the visible rows, Right opens a
 * row or steps into it, Left closes a row or steps out to its parent (swapped in `dir="rtl"`), Home and End jump, Enter
 * activates, Space selects or checks, `*` opens the row's siblings and typing a word jumps to the row that starts with it.
 *
 * It does not sort, filter, fetch or reorder: `nodes` is drawn in the order you give it, and everything the person changes
 * (the open rows, the selection, the checks) is a list of ids you may hold yourself. An org chart, with its boxes and
 * connectors, is a different component; a navigation of links is `Sidebar`.
 *
 * @example
 * ```tsx
 * <Tree
 *   aria-label="Project files"
 *   nodes={[
 *     { id: "src", label: "src", icon: FolderIcon, children: [{ id: "app", label: "App.tsx", icon: FileIcon }] },
 *     { id: "readme", label: "README.md", icon: FileIcon },
 *   ]}
 *   selectionMode="single"
 *   onValueChange={([id]) => open(id)}
 * />
 * ```
 */
export const Tree = forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      nodes,
      size = "md",
      selectionMode = "none",
      value: valueProp,
      defaultValue,
      onValueChange,
      checkable = false,
      checkedIds: checkedProp,
      defaultCheckedIds,
      onCheckedChange,
      expandedIds: expandedProp,
      defaultExpandedIds,
      defaultExpandAll = false,
      onExpandedChange,
      loading = false,
      loadingCount = DEFAULT_PLACEHOLDERS,
      loadingIds,
      errorIds,
      onRetry,
      onItemActivate,
      onItemContextMenu,
      renamable = false,
      onRename,
      validateRename,
      renderLabel,
      highlightQuery,
      windowed = "auto",
      maxHeight,
      empty,
      dir = "ltr",
      formatNumber = String,
      labels: labelsProp,
      controllerRef,
      className,
      style,
      id,
      "data-testid": dataTestId,
      onKeyDown,
      onContextMenu,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels(formatNumber), labelsProp);
    const index = useMemo(() => indexTree(nodes), [nodes]);
    const rtl = dir === "rtl";

    const named = Boolean(props["aria-label"] || props["aria-labelledby"]);
    const hasRows = nodes.length > 0;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && hasRows && !named) {
        console.warn("Tree: no accessible name. Pass `aria-label` or `aria-labelledby` so a screen reader can say what the tree holds.");
      }
    }, [hasRows, named]);

    const [expanded, requestExpanded, readExpanded] = useTreeList(
      "expandedIds",
      expandedProp,
      () => defaultExpandedIds ?? (defaultExpandAll ? index.expandable : []),
      onExpandedChange,
    );
    const [selected, requestSelected] = useTreeList("value", valueProp, defaultValue ?? [], onValueChange);
    const [checkedLeaves, requestChecked] = useTreeList("checkedIds", checkedProp, defaultCheckedIds ?? [], onCheckedChange);

    const expandedSet = useMemo(() => new Set(expanded), [expanded]);
    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const checkedSet = useMemo(() => new Set(checkedLeaves), [checkedLeaves]);
    const loadingSet = useMemo(() => new Set(loadingIds), [loadingIds]);
    const errorSet = useMemo(() => new Set(errorIds), [errorIds]);
    const rows = useMemo(() => visibleRows(nodes, expandedSet, loadingSet), [nodes, expandedSet, loadingSet]);
    // Every row's check state, worked out once for the whole tree rather than by walking the leaves under each drawn row.
    const checkMap = useMemo(() => (checkable ? checkStates(nodes, checkedSet) : undefined), [checkable, nodes, checkedSet]);
    const rowIndexById = useMemo(() => new Map(rows.map((row, position) => [row.node.id, position])), [rows]);

    // --- windowing -------------------------------------------------------------------------------------------------------
    const windowedOn = rows.length > 0 && (windowed === true || (windowed === "auto" && maxHeight !== undefined && rows.length > WINDOW_THRESHOLD));
    // The row's height in pixels, read from its token once the page is in the browser. A server (and a hydrating render)
    // gets `undefined`, so the first render is the same on both and the real height arrives right after.
    const rowPx = useSyncExternalStore(
      noSubscription,
      useCallback(() => readLengthToken(`--dbm-tree-row-height-${size}`), [size]),
      noSnapshot,
    );
    const getItemSize = useCallback(() => rowPx ?? FALLBACK_ROW_PX, [rowPx]);
    const windowedList = useWindowedList({ count: rows.length, getItemSize, enabled: windowedOn, overscan: OVERSCAN });
    const start = windowedOn ? windowedList.start : 0;
    const end = windowedOn ? windowedList.end : rows.length;

    // --- the row that holds the tab stop -----------------------------------------------------------------------------------
    const [focusId, setFocusId] = useState<string | undefined>(undefined);
    const activeId = useMemo(() => {
      if (focusId !== undefined) {
        if (rowIndexById.has(focusId)) return focusId;
        // Its ancestor is closed over it: the nearest row that is still there takes the stop.
        const above = ancestorsOf(focusId, index.parentOf).find((ancestor) => rowIndexById.has(ancestor));
        if (above !== undefined) return above;
      }
      const chosen = rows.find((row) => selectedSet.has(row.node.id));
      return (chosen ?? rows[0])?.node.id;
    }, [focusId, rowIndexById, index.parentOf, rows, selectedSet]);
    const activeIndex = activeId === undefined ? -1 : (rowIndexById.get(activeId) ?? -1);
    const activeDrawn = activeIndex >= start && activeIndex < end;

    const elements = useRef(new Map<string, HTMLElement>());
    const pendingFocus = useRef<string | undefined>(undefined);
    const pendingScroll = useRef<string | undefined>(undefined);
    const warnedScroll = useRef(false);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const setFrame = useCallback(
      (element: HTMLDivElement | null) => {
        frameRef.current = element;
        windowedList.containerRef(element);
      },
      // `containerRef` is stable for the hook's life
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const registerRow = useCallback((rowId: string, element: HTMLElement | null) => {
      if (element) elements.current.set(rowId, element);
      else elements.current.delete(rowId);
    }, []);

    const focusRow = (target: string) => {
      setFocusId(target);
      const element = elements.current.get(target);
      if (element) element.focus();
      else {
        // It is outside the window: scroll it into one, and the effect below focuses it once it is drawn.
        pendingFocus.current = target;
        const position = rowIndexById.get(target);
        if (position !== undefined) windowedList.scrollToIndex(position);
      }
    };

    useEffect(() => {
      const wantsFocus = pendingFocus.current;
      if (wantsFocus !== undefined) {
        const element = elements.current.get(wantsFocus);
        if (element) {
          pendingFocus.current = undefined;
          element.focus();
        }
      }
      const wantsScroll = pendingScroll.current;
      if (wantsScroll !== undefined) {
        const position = rowIndexById.get(wantsScroll);
        if (position === undefined) {
          // Not drawn: either it is still under a closed row (a controlled tree that has not opened it yet) or gone.
          if (!index.byId.has(wantsScroll)) pendingScroll.current = undefined;
          else if (process.env.NODE_ENV !== "production" && expandedProp !== undefined && !warnedScroll.current) {
            warnedScroll.current = true;
            console.warn(
              `Tree: scrollToNode("${wantsScroll}") asked for the rows above it to be opened, but \`expandedIds\` is controlled and has not opened them. Apply the ids \`onExpandedChange\` is called with, and the row is scrolled into view when they appear.`,
            );
          }
        } else if (windowedOn) {
          windowedList.scrollToIndex(position);
          pendingScroll.current = undefined;
        } else {
          pendingScroll.current = undefined;
          elements.current.get(wantsScroll)?.scrollIntoView?.({ block: "nearest" });
        }
      }
    });

    // --- announcements -----------------------------------------------------------------------------------------------------
    const { message, announce } = useAnnouncement();
    const previousLoading = useRef(loadingSet);
    const latestLabels = useRef(labels);
    useEffect(() => {
      latestLabels.current = labels;
    });
    useEffect(() => {
      for (const loadedId of previousLoading.current) {
        if (loadingSet.has(loadedId)) continue;
        const count = index.byId.get(loadedId)?.children?.length ?? 0;
        if (count > 0) announce(latestLabels.current.childrenLoaded(count));
      }
      previousLoading.current = loadingSet;
    }, [loadingSet, index, announce]);

    const previousErrors = useRef(errorSet);
    useEffect(() => {
      for (const failedId of errorSet) {
        if (previousErrors.current.has(failedId)) continue;
        const failed = index.byId.get(failedId);
        if (failed) announce(`${failed.label}. ${latestLabels.current.loadFailed}`);
      }
      previousErrors.current = errorSet;
    }, [errorSet, index, announce]);

    // --- changes a person asks for -----------------------------------------------------------------------------------------
    const setOpen = (target: string, open: boolean): boolean => {
      const node = index.byId.get(target);
      if (!node || !canExpand(node)) return false;
      const current = readExpanded();
      const isOpen = current.includes(target);
      if (isOpen === open) return false;
      requestExpanded(open ? [...current, target] : current.filter((entry) => entry !== target));
      return true;
    };

    // A row that failed to load is open and empty: asking to open it again is asking to try again.
    const openOrRetry = (target: string): boolean => {
      if (errorSet.has(target) && expandedSet.has(target)) {
        onRetry?.(target);
        return true;
      }
      return setOpen(target, true);
    };

    const anchor = useRef<string | undefined>(undefined);
    const selectRange = (from: string, to: string) => {
      const a = rowIndexById.get(from);
      const b = rowIndexById.get(to);
      if (a === undefined || b === undefined) return;
      const [low, high] = a < b ? [a, b] : [b, a];
      requestSelected(rows.slice(low, high + 1).filter((row) => !row.node.disabled).map((row) => row.node.id));
    };
    const select = (target: string, how: "replace" | "toggle") => {
      const node = index.byId.get(target);
      if (!node || node.disabled || selectionMode === "none") return;
      anchor.current = target;
      if (how === "toggle") {
        requestSelected(selectedSet.has(target) ? selected.filter((entry) => entry !== target) : selectionMode === "multiple" ? [...selected, target] : [target]);
      } else if (!(selected.length === 1 && selected[0] === target)) {
        requestSelected([target]);
      }
    };
    const toggleCheck = (node: TreeNode) => {
      if (node.disabled) return;
      requestChecked(toggleChecked(node, checkedLeaves));
    };
    const activate = (target: string) => {
      const node = index.byId.get(target);
      if (!node || node.disabled) return;
      if (errorSet.has(target) && expandedSet.has(target)) onRetry?.(target);
      else if (onItemActivate) onItemActivate(target);
      else setOpen(target, !expandedSet.has(target));
    };

    // --- renaming ---------------------------------------------------------------------------------------------------------
    const [editingId, setEditingId] = useState<string | undefined>(undefined);
    const canRename = (node: TreeNode | undefined): node is TreeNode =>
      node !== undefined && !node.disabled && (typeof renamable === "function" ? renamable(node) : renamable);
    const startRename = (target: string): boolean => {
      const node = index.byId.get(target);
      if (!canRename(node)) return false;
      setEditingId(target);
      return true;
    };
    const checkName = (target: string, text: string): string | undefined => {
      const trimmed = text.trim();
      if (trimmed === "") return labels.nameRequired;
      return validateRename?.(target, trimmed);
    };
    const endRename = (target: string, text: string | undefined, restoreFocus: boolean) => {
      setEditingId(undefined);
      const node = index.byId.get(target);
      if (text !== undefined && node && text.trim() !== node.label) onRename?.(target, text.trim());
      if (restoreFocus) focusRow(target);
    };
    // A row that is no longer a row at all (a closed ancestor) takes its field with it: the state is reset while rendering, which
    // React allows for state that follows what is shown. A row only out of the window keeps its field for when it is back.
    if (editingId !== undefined && !rowIndexById.has(editingId)) setEditingId(undefined);

    // --- the controller ----------------------------------------------------------------------------------------------------
    const controllerState = useRef({ index, requestExpanded, readExpanded });
    const renameState = useRef({ canRename, start: startRename });
    useEffect(() => {
      renameState.current = { canRename, start: startRename };
    });
    useEffect(() => {
      controllerState.current = { index, requestExpanded, readExpanded };
    });
    const controller = useMemo<TreeController>(
      () => ({
        expandAll: () => {
          const { index: current, requestExpanded: ask, readExpanded: read } = controllerState.current;
          const open = new Set(read());
          if (current.expandable.every((entry) => open.has(entry))) return false;
          ask([...new Set([...read(), ...current.expandable])]);
          return true;
        },
        rename: (target) => {
          const { index: current, requestExpanded: ask, readExpanded: read } = controllerState.current;
          const node = current.byId.get(target);
          if (!renameState.current.canRename(node)) return false;
          const open = new Set(read());
          const closed = ancestorsOf(target, current.parentOf).filter((ancestor) => !open.has(ancestor));
          if (closed.length > 0) ask([...read(), ...closed]);
          pendingScroll.current = target;
          setFocusId(target);
          renameState.current.start(target);
          return true;
        },
        collapseAll: () => {
          const { requestExpanded: ask, readExpanded: read } = controllerState.current;
          if (read().length === 0) return false;
          ask([]);
          return true;
        },
        expand: (target) => {
          const { index: current, requestExpanded: ask, readExpanded: read } = controllerState.current;
          const node = current.byId.get(target);
          if (!node || !canExpand(node) || read().includes(target)) return false;
          ask([...read(), target]);
          return true;
        },
        collapse: (target) => {
          const { requestExpanded: ask, readExpanded: read } = controllerState.current;
          if (!read().includes(target)) return false;
          ask(read().filter((entry) => entry !== target));
          return true;
        },
        scrollToNode: (target) => {
          const { index: current, requestExpanded: ask, readExpanded: read } = controllerState.current;
          if (!current.byId.has(target)) return false;
          const open = new Set(read());
          const closed = ancestorsOf(target, current.parentOf).filter((ancestor) => !open.has(ancestor));
          if (closed.length > 0) ask([...read(), ...closed]);
          pendingScroll.current = target;
          setFocusId(target);
          return true;
        },
      }),
      [],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // --- the keyboard ------------------------------------------------------------------------------------------------------
    const typed = useRef({ text: "", timer: 0 });
    useEffect(() => {
      const state = typed.current;
      return () => window.clearTimeout(state.timer);
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      // Keys typed into a row's rename field are the field's.
      if ((event.target as HTMLElement).closest("input, textarea")) return;
      const element = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-id]");
      if (!element || event.currentTarget !== element.closest('[role="tree"]')) return;
      const currentId = element.dataset.treeId as string;
      const position = rowIndexById.get(currentId);
      const row = position === undefined ? undefined : rows[position];
      if (position === undefined || !row) return;
      const move = (to: number, extend = false) => {
        const target = rows[Math.max(0, Math.min(rows.length - 1, to))];
        if (!target) return;
        event.preventDefault();
        if (extend && selectionMode === "multiple") {
          anchor.current ??= currentId;
          selectRange(anchor.current, target.node.id);
        }
        focusRow(target.node.id);
      };

      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";
      const modified = event.ctrlKey || event.metaKey || event.altKey;

      // The key that asks for a menu: handled before the modifier check, since Shift is part of it.
      if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
        if (onItemContextMenu && !row.node.disabled) {
          event.preventDefault();
          keyedMenuAt.current = event.timeStamp;
          askForMenu(element, row.node.id, "keyboard", event.nativeEvent);
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && selectionMode === "multiple") {
        event.preventDefault();
        requestSelected(rows.filter((entry) => !entry.node.disabled).map((entry) => entry.node.id));
        return;
      }
      if (modified) return;
      // Any key but a letter ends the word being typed.
      if (event.key.length !== 1) typed.current.text = "";

      switch (event.key) {
        case "ArrowDown":
          move(position + 1, event.shiftKey);
          return;
        case "ArrowUp":
          move(position - 1, event.shiftKey);
          return;
        case "Home":
          move(0);
          return;
        case "End":
          move(rows.length - 1);
          return;
        case forward:
          event.preventDefault();
          if (!canExpand(row.node)) return;
          if (!expandedSet.has(currentId)) {
            if (!row.node.disabled) setOpen(currentId, true);
          } else if (rows[position + 1]?.parentId === currentId) focusRow(rows[position + 1]!.node.id);
          else if (!row.node.disabled) openOrRetry(currentId);
          return;
        case backward:
          event.preventDefault();
          if (canExpand(row.node) && expandedSet.has(currentId) && !row.node.disabled) setOpen(currentId, false);
          else if (row.parentId !== undefined) focusRow(row.parentId);
          return;
        case "Enter":
          event.preventDefault();
          activate(currentId);
          return;
        case "F2":
          if (startRename(currentId)) event.preventDefault();
          return;
        case " ":
          event.preventDefault();
          if (checkable) toggleCheck(row.node);
          else select(currentId, selectionMode === "multiple" ? "toggle" : "replace");
          return;
        case "*": {
          event.preventDefault();
          const open = readExpanded();
          const siblings = rows.filter((entry) => entry.parentId === row.parentId && canExpand(entry.node) && !entry.node.disabled && !open.includes(entry.node.id));
          if (siblings.length > 0) requestExpanded([...open, ...siblings.map((entry) => entry.node.id)]);
          return;
        }
        default:
      }

      if (event.key.length === 1 && event.key !== " ") {
        // Typeahead: the letters typed within a moment of each other make a word, and the row that starts with it takes focus.
        window.clearTimeout(typed.current.timer);
        typed.current.text += event.key.toLowerCase();
        typed.current.timer = window.setTimeout(() => {
          typed.current.text = "";
        }, TYPEAHEAD_MS);
        const text = typed.current.text;
        const repeated = text.split("").every((character) => character === text[0]);
        const needle = repeated ? (text[0] as string) : text;
        const from = repeated && text.length > 1 ? position + (text.length - 1) : repeated ? position + 1 : position;
        for (let step = 0; step < rows.length; step += 1) {
          const candidate = rows[(from + step) % rows.length] as TreeRow;
          if (candidate.node.label.toLowerCase().startsWith(needle)) {
            event.preventDefault();
            focusRow(candidate.node.id);
            return;
          }
        }
      }
    };

    // --- a row's menu ----------------------------------------------------------------------------------------------------
    // A key can also make the browser fire a `contextmenu` of its own (Windows and Linux): the key has already asked.
    const keyedMenuAt = useRef(Number.NEGATIVE_INFINITY);
    const askForMenu = (element: HTMLElement, rowId: string, via: TreeContextMenuRequest["via"], event: Event, pointer?: { x: number; y: number }) => {
      if (!onItemContextMenu) return;
      let point = pointer;
      if (!point) {
        // From a key: under the start of the row's label, where a person's eyes are.
        const label = element.querySelector<HTMLElement>('[data-tree-part="label"]')?.getBoundingClientRect() ?? element.getBoundingClientRect();
        point = { x: rtl ? label.right : label.left, y: element.getBoundingClientRect().bottom };
      }
      onItemContextMenu({ id: rowId, element, via, point, event });
    };

    const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
      onContextMenu?.(event);
      if (event.defaultPrevented || !onItemContextMenu) return;
      const element = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-id]");
      const node = element ? index.byId.get(element.dataset.treeId as string) : undefined;
      if (!element || !node || node.disabled || event.timeStamp - keyedMenuAt.current < MENU_KEY_ECHO_MS) return;
      focusRow(node.id);
      askForMenu(element, node.id, "pointer", event.nativeEvent, { x: event.clientX, y: event.clientY });
    };

    // --- the pointer -------------------------------------------------------------------------------------------------------
    const handleClick = (event: MouseEvent<HTMLDivElement>, node: TreeNode) => {
      if ((event.target as HTMLElement).closest("input")) return;
      const part = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-part]")?.dataset.treePart;
      if (part === "chevron") {
        if (!node.disabled) setOpen(node.id, !expandedSet.has(node.id));
        return;
      }
      if (part === "retry") {
        if (!node.disabled) openOrRetry(node.id);
        return;
      }
      if (part === "check") {
        toggleCheck(node);
        return;
      }
      if (node.disabled) return;
      if (selectionMode === "none") {
        if (checkable) toggleCheck(node);
        return;
      }
      if (selectionMode === "multiple" && event.shiftKey) {
        selectRange(anchor.current ?? activeId ?? node.id, node.id);
      } else if (selectionMode === "multiple" && (event.ctrlKey || event.metaKey)) select(node.id, "toggle");
      else if (selectionMode === "single" && (event.ctrlKey || event.metaKey) && selectedSet.has(node.id)) select(node.id, "toggle");
      else select(node.id, "replace");
    };

    // --- drawing -----------------------------------------------------------------------------------------------------------
    const drawn = rows.slice(start, end);
    const treeStyle: CSSProperties | undefined = windowedOn ? { paddingBlockStart: windowedList.before, paddingBlockEnd: windowedList.after } : undefined;
    const frameStyle: CSSProperties = { ...style, ...(maxHeight === undefined ? null : { maxBlockSize: maxHeight }) };
    const multiselectable = selectionMode === "multiple";

    const body = drawn.map((row) => (
      <TreeRowView
        key={row.node.id}
        row={row}
        iconSize={iconSizeFor[size]}
        rtl={rtl}
        tabbable={row.node.id === activeId}
        expanded={expandedSet.has(row.node.id)}
        selected={selectedSet.has(row.node.id)}
        selectionMode={selectionMode}
        checkable={checkable}
        checked={checkMap?.get(row.node.id) ?? false}
        loading={loadingSet.has(row.node.id)}
        error={errorSet.has(row.node.id) && !loadingSet.has(row.node.id)}
        editing={editingId === row.node.id}
        checkName={checkName}
        endRename={endRename}
        labels={labels}
        highlightQuery={highlightQuery}
        renderLabel={renderLabel}
        register={registerRow}
        onFocusRow={setFocusId}
        onClickRow={handleClick}
        onDoubleClickRow={activate}
      />
    ));

    const placeholders = loading ? normalizeLoadingCount(loadingCount) : 0;
    // Placeholders follow the last row, so they are drawn with the last window of a long tree.
    const placeholderRows =
      placeholders > 0 && end >= rows.length
        ? Array.from({ length: placeholders }, (_, position) => (
            <div
              key={`loading-${position}`}
              aria-hidden="true"
              className={cx(styles.row, styles.skeletonRow)}
              style={{ "--tree-level": PLACEHOLDER_LEVELS[position % PLACEHOLDER_LEVELS.length] } as CSSProperties}
            >
              <span className={styles.chevron} />
              <Skeleton variant="circular" width="var(--tree-check)" height="var(--tree-check)" />
              <Skeleton variant="text" width={PLACEHOLDER_WIDTHS[position % PLACEHOLDER_WIDTHS.length]} />
            </div>
          ))
        : null;
    const showEmpty = rows.length === 0;

    return (
      <div ref={setFrame} className={cx(styles.frame, sizeClass[size], className)} style={frameStyle} dir={dir}>
        {showEmpty ? (
          <div
            ref={ref}
            {...props}
            id={id}
            data-testid={dataTestId}
            role="group"
            aria-busy={loading || undefined}
            className={cx(styles.root, loading ? undefined : styles.emptyRoot)}
          >
            {loading ? (
              <>
                {placeholderRows}
                <VisuallyHidden>{labels.loading}</VisuallyHidden>
              </>
            ) : empty === false ? null : (
              (empty ?? <span className={styles.empty}>{labels.empty}</span>)
            )}
          </div>
        ) : (
          <div
            ref={ref}
            {...props}
            id={id}
            data-testid={dataTestId}
            role="tree"
            aria-multiselectable={multiselectable || undefined}
            aria-busy={loading || undefined}
            tabIndex={activeDrawn ? -1 : 0}
            className={styles.root}
            style={treeStyle}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            onFocus={(event) => {
              props.onFocus?.(event);
              // The row that holds the stop is outside the window: bring it in and hand it the focus.
              if (event.target === event.currentTarget && activeId !== undefined) focusRow(activeId);
            }}
          >
            {body}
            {placeholderRows}
          </div>
        )}
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </div>
    );
  },
);

Tree.displayName = "Tree";

interface TreeRowViewProps {
  row: TreeRow;
  iconSize: "xs" | "sm" | "md" | "lg";
  rtl: boolean;
  tabbable: boolean;
  expanded: boolean;
  selected: boolean;
  selectionMode: TreeSelectionMode;
  checkable: boolean;
  checked: boolean | "indeterminate";
  loading: boolean;
  error: boolean;
  editing: boolean;
  checkName: (id: string, text: string) => string | undefined;
  endRename: (id: string, text: string | undefined, restoreFocus: boolean) => void;
  labels: TreeLabels;
  highlightQuery: string | undefined;
  renderLabel: TreeProps["renderLabel"];
  register: (id: string, element: HTMLElement | null) => void;
  onFocusRow: (id: string) => void;
  onClickRow: (event: MouseEvent<HTMLDivElement>, node: TreeNode) => void;
  onDoubleClickRow: (id: string) => void;
}

function TreeRowView({
  row,
  iconSize,
  rtl,
  tabbable,
  expanded,
  selected,
  selectionMode,
  checkable,
  checked,
  loading,
  error,
  editing,
  checkName,
  endRename,
  labels,
  highlightQuery,
  renderLabel,
  register,
  onFocusRow,
  onClickRow,
  onDoubleClickRow,
}: TreeRowViewProps) {
  const { node, level, posinset, setsize } = row;
  const hasChildren = canExpand(node);
  const state: TreeRowState = { level, expanded: hasChildren && expanded, selected, checked, disabled: Boolean(node.disabled), hasChildren };
  const setElement = useCallback(
    (element: HTMLDivElement | null) => register(node.id, element),
    [register, node.id],
  );
  const query = highlightQuery?.trim();
  const placeholder = row.placeholder !== undefined;

  // The row that stands in for what an empty, open row did not have: a disabled, unselectable line saying so.
  if (placeholder) {
    return (
      <div
        ref={setElement}
        role="treeitem"
        data-tree-id={node.id}
        tabIndex={tabbable ? 0 : -1}
        aria-level={level}
        aria-setsize={setsize}
        aria-posinset={posinset}
        aria-selected={selectionMode === "none" ? undefined : false}
        aria-disabled="true"
        className={cx(styles.row, styles.placeholder)}
        style={{ "--tree-level": level } as CSSProperties}
        onFocus={() => onFocusRow(node.id)}
      >
        <span className={styles.chevron} aria-hidden="true" />
        <span className={styles.label}>{labels.emptyFolder}</span>
      </div>
    );
  }

  return (
    // The tree owns the keyboard (one handler for every row, since the arrow keys move between them), so a row has none of its own.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      ref={setElement}
      role="treeitem"
      data-tree-id={node.id}
      tabIndex={tabbable ? 0 : -1}
      aria-level={level}
      aria-setsize={setsize}
      aria-posinset={posinset}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selectionMode === "none" ? undefined : selected}
      aria-checked={checkable ? checked === "indeterminate" ? "mixed" : checked : undefined}
      aria-disabled={node.disabled || undefined}
      aria-busy={loading || undefined}
      data-selected={selected || undefined}
      className={cx(styles.row, selected && styles.selected, node.disabled && styles.disabled, error && styles.errored, selectionMode !== "none" || checkable ? styles.pickable : undefined)}
      style={{ "--tree-level": level } as CSSProperties}
      onFocus={() => onFocusRow(node.id)}
      onClick={(event) => onClickRow(event, node)}
      onDoubleClick={() => {
        if (!editing) onDoubleClickRow(node.id);
      }}
    >
      <span className={styles.chevron} data-tree-part={error ? "retry" : hasChildren ? "chevron" : undefined} aria-hidden="true">
        {loading ? (
          <Spinner size="xs" />
        ) : error ? (
          <Icon icon={WarningIcon} size="xs" tone="danger" />
        ) : hasChildren ? (
          <Icon icon={rtl ? CaretLeftIcon : CaretRightIcon} size="xs" className={cx(styles.arrow, expanded && styles.arrowOpen)} />
        ) : null}
      </span>
      {checkable ? (
        <span className={styles.check} data-tree-part="check" data-state={checked === "indeterminate" ? "indeterminate" : checked ? "checked" : "unchecked"} aria-hidden="true">
          {checked === true ? <Icon icon={CheckIcon} size="xs" tone="on-brand" /> : checked === "indeterminate" ? <Icon icon={MinusIcon} size="xs" tone="on-brand" /> : null}
        </span>
      ) : null}
      {node.icon ? <Icon icon={node.icon} size={iconSize} tone="default" className={styles.nodeIcon} /> : null}
      {editing ? (
        <TreeRenameField
          initial={node.label}
          name={labels.rename(node.label)}
          check={(text) => checkName(node.id, text)}
          onCommit={(text, restoreFocus) => endRename(node.id, text, restoreFocus)}
          onCancel={(restoreFocus) => endRename(node.id, undefined, restoreFocus)}
        />
      ) : (
        <span className={styles.label} data-tree-part="label">
          {renderLabel ? renderLabel(node, state) : query ? <Highlight query={query}>{node.label}</Highlight> : node.label}
        </span>
      )}
      {error ? <span className={styles.failure}>{labels.loadFailed}</span> : node.description ? <span className={styles.description}>{node.description}</span> : null}
      {node.trailing ? <span className={styles.trailing}>{node.trailing}</span> : null}
    </div>
  );
}

interface TreeRenameFieldProps {
  initial: string;
  name: string;
  check: (text: string) => string | undefined;
  onCommit: (text: string, restoreFocus: boolean) => void;
  onCancel: (restoreFocus: boolean) => void;
}

/** The field a row's label turns into: Enter commits, Escape cancels, leaving commits unless the text is refused. */
function TreeRenameField({ initial, name, check, onCommit, onCancel }: TreeRenameFieldProps) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | undefined>(undefined);
  const field = useRef<HTMLInputElement | null>(null);
  const errorId = useId();
  // An Enter or Escape ends it; the blur that follows the field going away is not a second ending.
  const ended = useRef(false);

  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);

  return (
    <>
      <input
        ref={field}
        className={styles.rename}
        type="text"
        value={text}
        aria-label={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoComplete="off"
        spellCheck={false}
        data-tree-part="rename"
        onChange={(event) => {
          setText(event.target.value);
          setError(undefined);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const message = check(text);
            if (message) setError(message);
            else {
              ended.current = true;
              onCommit(text, true);
            }
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            ended.current = true;
            onCancel(true);
          }
        }}
        onBlur={() => {
          if (ended.current) return;
          ended.current = true;
          // Leaving keeps a good name and drops a refused one, rather than holding a person in a field they have left.
          if (check(text)) onCancel(false);
          else onCommit(text, false);
        }}
      />
      {error ? (
        <span id={errorId} role="alert" className={styles.failure}>
          {error}
        </span>
      ) : null}
    </>
  );
}
