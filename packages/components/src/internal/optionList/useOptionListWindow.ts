import { useWindowedList } from "@dbm-system/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListOption, OptionListSize } from "./optionList.types";
import type { Row } from "./optionList.rows";

// Past this many rows only the ones in view are drawn (06 §4). Below it, drawing them all is cheaper than the
// bookkeeping, and keeps real group elements in the list.
const WINDOW_THRESHOLD = 100;

/** A length token such as `2.25rem` in pixels, or `undefined` when it can't be read (a server render). */
function readLengthToken(name: string): number | undefined {
  if (typeof document === "undefined") return undefined;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return undefined;
  if (raw.endsWith("rem")) return value * Number.parseFloat(root.fontSize);
  return raw.endsWith("px") ? value : undefined;
}

/** The DOM id of the option at `index`, which the field's `aria-activedescendant` points at. */
export const optionDomId = (listId: string, index: number) => `${listId}-option-${index}`;

interface Options<O extends ListOption> {
  open: boolean;
  rows: Row<O>[];
  size: OptionListSize;
  /** The index in the flat option list of the highlighted option, or `-1`. */
  highlighted: number;
  listId: string;
}

/**
 * Draws a long list a window of rows at a time (rows are a fixed height from tokens), keeps the highlighted option
 * in view after a key moved it, and brings the highlighted option into view when the list opens on one far down.
 */
export function useOptionListWindow<O extends ListOption>({ open, rows, size, highlighted, listId }: Options<O>) {
  const rowIndexOfOption = useMemo(() => {
    const map: number[] = [];
    rows.forEach((row, rowIndex) => {
      if (row.kind === "option") map[row.index] = rowIndex;
    });
    return map;
  }, [rows]);

  // Windowing: rows are a fixed height, so a long list draws only the ones in view.
  const windowed = open && rows.length > WINDOW_THRESHOLD;
  const rowSizes = useMemo(() => {
    if (!windowed) return undefined;
    const plain = readLengthToken(`--dbm-combobox-option-height-${size}`);
    const described = readLengthToken(`--dbm-combobox-option-height-described-${size}`);
    return plain !== undefined && described !== undefined ? { plain, described } : undefined;
  }, [windowed, size]);
  const getItemSize = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      const described = row?.kind === "option" && Boolean(row.option.description);
      return (described ? rowSizes?.described : rowSizes?.plain) ?? 0;
    },
    [rows, rowSizes],
  );
  const windowedList = useWindowedList({
    count: rows.length,
    getItemSize,
    enabled: windowed && rowSizes !== undefined,
  });
  const { containerRef: windowRef, scrollToIndex, viewportSize } = windowedList;
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const setListRef = useCallback(
    (element: HTMLDivElement | null) => {
      setListElement(element);
      windowRef(element);
    },
    [windowRef],
  );

  // Keeps the highlighted option in view after a key moved it. A pointer hover doesn't scroll, so the list
  // doesn't jump under the pointer.
  const scrollOnHighlight = useRef(false);
  useEffect(() => {
    if (!scrollOnHighlight.current || highlighted === -1 || !listElement) return;
    scrollOnHighlight.current = false;
    if (!windowed) {
      listElement
        .querySelector<HTMLElement>(`[id="${optionDomId(listId, highlighted)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, listElement, windowed, listId]);

  // When the list opens on a chosen option far down a long list, bring it into view. The box is only as tall as it
  // will be once the floating layer has measured the room there is, so this runs again when its height settles.
  useEffect(() => {
    if (!open || !windowed || !listElement) return;
    const target = highlighted === -1 ? undefined : rowIndexOfOption[highlighted];
    if (target !== undefined) scrollToIndex(target);
    // Not on every highlight: moving it with a key scrolls from the key handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, windowed, listElement, viewportSize]);

  /** Call when a key moved the highlight to `index`, so the option is brought into view. */
  const reveal = (index: number) => {
    scrollOnHighlight.current = true;
    if (windowed) {
      const target = rowIndexOfOption[index];
      if (target !== undefined) scrollToIndex(target);
    }
  };

  const activeRendered =
    highlighted !== -1 &&
    (!windowed ||
      (() => {
        const rowIndex = rowIndexOfOption[highlighted];
        return rowIndex !== undefined && rowIndex >= windowedList.start && rowIndex < windowedList.end;
      })());

  const drawing = windowed && rowSizes !== undefined;
  return {
    listElement,
    setListRef,
    /** Whether only a window of the rows is drawn. */
    drawing,
    /** The rows to draw: the window, or all of them. */
    drawn: drawing ? rows.slice(windowedList.start, windowedList.end) : rows,
    /** The padding that stands in for the rows left out. */
    windowStyle: drawing ? { paddingBlockStart: windowedList.before, paddingBlockEnd: windowedList.after } : undefined,
    reveal,
    /** Whether the highlighted option's element is in the page (it may be outside the window). */
    activeRendered,
  };
}
