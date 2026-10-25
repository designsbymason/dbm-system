import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { fitCount } from "../../molecules/TagsInput/fitCount";

type PendingFocus = { kind: "entry" } | { kind: "chip"; index: number } | null;

interface Options {
  /** How many chips there are. */
  count: number;
  /** Whether a chip can be removed (the field is neither disabled nor read-only). */
  canEdit: boolean;
  /** Removes the chip at `index`. */
  onRemoveAt: (index: number, source: "button" | "keyboard") => void;
  entryRef: RefObject<HTMLInputElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  /** `overflow="collapse"`: the idle row is one line, with as many chips as fit. */
  collapseMode: boolean;
  maxVisible: number | undefined;
}

/**
 * The chip row of a `MultiSelect`: which chips are drawn while the field is idle (`maxVisible` and the measured
 * `overflow="collapse"` count), and the keys that move among the chips and remove them. The chips are not tab
 * stops: the arrow key toward them from the start of the entry reaches them, and past the last one the entry takes
 * focus again. The model is `TagsInput`'s ([ADR-0050]).
 */
export function useSelectedChips({ count, canEdit, onRemoveAt, entryRef, boxRef, collapseMode, maxVisible }: Options) {
  const listRef = useRef<HTMLUListElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<() => void>(() => undefined);
  // Where focus goes once a chip is gone: never to a place the person left.
  const pendingFocus = useRef<PendingFocus>(null);
  // Set by a key press on a chip's remove button, so its click moves focus along the row, not to the entry.
  const keyboardRemoval = useRef(false);

  // Collapsed only while neither the entry nor a chip has focus, and not opened with "+N more".
  const [engaged, setEngaged] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // `overflow="collapse"`: how many chips fit on the one line, measured from an unseen copy of them.
  const [fitting, setFitting] = useState<number | null>(null);

  const chipButtons = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("li[role=listitem] button") ?? []);
  const focusIsInBox = () => Boolean(boxRef.current && boxRef.current.contains(document.activeElement));
  const isRtl = () => (boxRef.current ? getComputedStyle(boxRef.current).direction === "rtl" : false);

  /** Moves focus to the last chip. `false` when there is none. */
  const focusLastChip = () => {
    const buttons = chipButtons();
    const last = buttons[buttons.length - 1];
    last?.focus();
    return Boolean(last);
  };

  /** After the next change in the number of chips, puts focus in the entry (if the person is in the field). */
  const keepFocusInEntry = () => {
    if (focusIsInBox()) pendingFocus.current = { kind: "entry" };
  };

  const removeFromChip = (index: number) => {
    // A key press keeps the person's place along the row; a pointer press hands the typing back to the entry.
    const viaKeyboard = keyboardRemoval.current;
    keyboardRemoval.current = false;
    if (focusIsInBox()) pendingFocus.current = viaKeyboard ? { kind: "chip", index } : { kind: "entry" };
    onRemoveAt(index, viaKeyboard ? "keyboard" : "button");
  };

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.kind === "chip") {
      const buttons = chipButtons();
      const next = buttons[Math.min(target.index, buttons.length - 1)];
      if (next) {
        next.focus();
        return;
      }
    }
    entryRef.current?.focus();
    // `chipButtons` and `entryRef` are stable reads of refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Arrow keys move among the chips, Home and End go to the ends, Delete or Backspace remove the one that has
  // focus; past the last chip the entry takes focus again.
  const handleChipKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    const buttons = chipButtons();
    const index = buttons.indexOf(target as HTMLButtonElement);
    if (index === -1) return;
    const rtl = isRtl();
    const previousKey = rtl ? "ArrowRight" : "ArrowLeft";
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
    if (event.key === previousKey) {
      event.preventDefault();
      buttons[Math.max(0, index - 1)]?.focus();
    } else if (event.key === nextKey) {
      event.preventDefault();
      if (index < buttons.length - 1) buttons[index + 1]?.focus();
      else entryRef.current?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      if (!canEdit) return;
      pendingFocus.current = { kind: "chip", index };
      onRemoveAt(index, "keyboard");
    } else if (event.key === "Enter" || event.key === " ") {
      // The button's own activation removes it; this keeps the person's place along the row afterwards.
      keyboardRemoval.current = true;
    } else if (event.key === "Escape") {
      // The key belongs to this field, not to whatever it sits in.
      event.preventDefault();
      event.stopPropagation();
      entryRef.current?.focus();
    }
  };

  // Collapse mode: how many chips fit on one line beside the button. Read from an unseen copy of every chip
  // (their natural widths, which the visible, cut ones can't give) and the "+N more" button at its widest.
  const measure = () => {
    const box = boxRef.current;
    const measurer = measurerRef.current;
    if (!collapseMode || !box || !measurer) return;
    const items = Array.from(measurer.children) as HTMLElement[];
    const more = items.pop();
    const widths = items.map((item) => item.getBoundingClientRect().width);
    const style = getComputedStyle(box);
    const gap = parseFloat(style.columnGap) || 0;
    const inner = box.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    // What else shares the line: the buttons at the end; the entry gives up its room while idle.
    const rest = Array.from(box.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.dataset.reserve === "true",
    );
    const reserved = rest.reduce((sum, child) => sum + child.getBoundingClientRect().width + gap, 0);
    const fits = fitCount(widths, more ? more.getBoundingClientRect().width : 0, inner - reserved, gap);
    setFitting((current) => (current === fits ? current : fits));
  };
  useLayoutEffect(() => {
    measureRef.current = measure;
    measure();
  });
  useEffect(() => {
    if (!collapseMode || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => measureRef.current());
    if (boxRef.current) observer.observe(boxRef.current);
    if (measurerRef.current) observer.observe(measurerRef.current);
    return () => observer.disconnect();
  }, [collapseMode, boxRef]);

  // The most chips the row shows while idle: a fixed number, or as many as fit (never more than a fixed cap).
  const cap = maxVisible !== undefined && maxVisible >= 0 ? maxVisible : count;
  const idleCount = Math.min(count, cap, collapseMode ? (fitting ?? count) : count);
  const overflowing = idleCount < count;
  const collapsed = overflowing && !expanded && !engaged;
  // In collapse mode the row is one line whenever the field is idle, even when everything fits.
  const idleLine = collapseMode && !expanded && !engaged;
  const visibleCount = collapsed ? idleCount : count;

  return {
    listRef,
    measurerRef,
    engaged,
    setEngaged,
    expanded,
    setExpanded,
    overflowing,
    collapsed,
    idleLine,
    visibleCount,
    hiddenCount: count - visibleCount,
    focusLastChip,
    keepFocusInEntry,
    removeFromChip,
    handleChipKeyDown,
    focusIsInBox,
  };
}
