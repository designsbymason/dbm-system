import { CaretLeftIcon, CaretRightIcon } from "@dbm-system/icons";
import { cx, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  addDays,
  daysBetween,
  formatDate,
  formatMonth,
  monthGrid,
  moveDate,
  parseDate,
  parseMonth,
  weekdayOf,
} from "../../internal/date/dateValue";
import type { CivilDate, Weekday } from "../../internal/date/dateValue";
import { Select } from "../Select";
import styles from "./Calendar.module.css";
import {
  FIRST_MONTH,
  LAST_MONTH,
  MAX_MONTHS,
  SCAN_DAYS,
  SWIPE_DISTANCE,
  SWIPE_DOMINANCE,
  dateOrNone,
  dayElement,
  keyMoves,
  monthOfIndex,
  noClockOnTheServer,
  noSay,
  readClock,
  subscribeToNothing,
  utcMonth,
  weekNumberOf,
  wholeNumber,
} from "./calendarHelpers";
import { buildLabels } from "./calendarLabels";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarPicker } from "./CalendarPicker";
import type { CalendarMarker, CalendarMarkerTone, CalendarProps, CalendarSize } from "./Calendar.types";
import { useDirection } from "../../atoms/DirectionProvider";

const sizeClass: Record<CalendarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const markerToneClass: Record<CalendarMarkerTone, string | undefined> = {
  neutral: styles.dotNeutral,
  brand: styles.dotBrand,
  info: styles.dotInfo,
  success: styles.dotSuccess,
  warning: styles.dotWarning,
  danger: styles.dotDanger,
  highlight: styles.dotHighlight,
};

// The same icon step `Button` and `Pagination` use at each size.
const iconSize: Record<CalendarSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

/**
 * A month of days to choose a date, or a range of dates, from: a heading with previous and next month
 * buttons above a grid of seven columns, one for each day of the week, and six rows that always hold the
 * same 42 days, so the grid keeps one height whichever month it shows.
 *
 * A date is the string `"YYYY-MM-DD"` — never a `Date`, which carries a time and a timezone a calendar day
 * doesn't have — so `value` / `onValueChange` (or an uncontrolled `defaultValue`) hold plain text that
 * submits and compares as it is. With `mode="range"` the value is a `[start, end]` pair: the first choice is
 * the start, the second the end, and a third starts again; `minRangeDays`, `maxRangeDays` and
 * `rangeSpansUnavailable` limit what the end may be. `month` / `onMonthChange` (or `defaultMonth`) hold
 * the first month on show as `"YYYY-MM"`, and `numberOfMonths` shows several side by side. `min`, `max` and
 * `isDateDisabled` rule dates out, `weekStartsOn` sets the first column (explicitly, never from the browser's
 * locale), and `showOutsideDays` fills the first and last weeks with the neighbouring months' days, dimmed.
 *
 * `captionLayout="dropdown"` swaps the month heading for a month field and a year field, for a far-off date.
 * `showTodayButton`, `clearable` and `footer` add a footer; `getMarker` draws a dot (or your own content) under
 * the days it names, for events, bookings and prices; `showLegend` explains the looks; `rounded` rounds the days.
 *
 * The grid follows the WAI-ARIA date-grid pattern: it is one tab stop, and the arrow keys move by a day or a
 * week, Home and End to the ends of the week, Page Up and Page Down by a month (a year with Shift), and
 * Enter or Space choose. The month changes when a key or a choice lands in another one, and the new month is
 * announced. Unavailable dates stay focusable (`aria-disabled`), so the arrow keys never skip over them.
 *
 * Text the component supplies itself — month and weekday names, accessible names — is a `labels` object,
 * and `formatNumber` writes days and years in a locale's own numerals. `dir="rtl"` mirrors it. `ref`
 * forwards to the outermost `<div>`.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState("2026-10-05");
 *
 * <Calendar value={date} onValueChange={setDate} />
 *
 * // A range of dates, two months side by side, at least two days, with a Clear button
 * <Calendar mode="range" value={range} onValueChange={setRange} numberOfMonths={2} minRangeDays={2} clearable />
 * ```
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>((calendarProps, ref) => {
  const {
    mode: _mode,
    value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    month,
    defaultMonth,
    onMonthChange,
    min: rawMin,
    max: rawMax,
    isDateDisabled,
    weekStartsOn: rawWeekStartsOn = 0,
    showOutsideDays = true,
    numberOfMonths: rawNumberOfMonths = 1,
    captionLayout = "label",
    yearRange,
    showTodayButton = false,
    clearable = false,
    footer,
    getMarker,
    minRangeDays: rawMinRangeDays,
    maxRangeDays: rawMaxRangeDays,
    rangeSpansUnavailable = true,
    maxSelected: rawMaxSelected,
    name,
    showWeekNumbers = false,
    fixedWeeks = true,
    animated = true,
    today: todayProp,
    size = "md",
    rounded = false,
    showLegend = false,
    disabled = false,
    readOnly = false,
    autoFocus = false,
    announce = true,
    dir: dirProp,
    labels: labelOverrides,
    formatNumber = String,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = calendarProps;
  const dir = useDirection(dirProp);
  const isRange = calendarProps.mode === "range";
  const isMultiple = calendarProps.mode === "multiple";
  const isWeek = calendarProps.mode === "week";

  // What an uncontrolled calendar holds: one date, a start and an end, or any number of dates, by mode.
  const [uncontrolledSelection, setUncontrolledSelection] = useState<readonly string[]>(() =>
    calendarProps.mode === "range"
      ? (calendarProps.defaultValue ?? ["", ""])
      : calendarProps.mode === "multiple"
        ? (calendarProps.defaultValue ?? [])
        : [calendarProps.defaultValue ?? ""],
  );
  // `null` until the person moves to another month: the month on show then follows the chosen date and the clock.
  const [uncontrolledMonth, setUncontrolledMonth] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [focusInside, setFocusInside] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  // The date a drag across days started on, with the pointer still down.
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  // `captionLayout="views"`: which grid is on show, the year it is looking at, and the cell that has focus in it.
  const [pickerOpen, setPickerOpen] = useState(false);
  const pendingHeadingFocus = useRef(false);
  const headingRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const idBase = useId();
  const pendingFocus = useRef(false);
  // The clock: nothing on the server and during hydration, the browser's today afterwards.
  const clock = useSyncExternalStore(subscribeToNothing, readClock, noClockOnTheServer);

  const weekStartsOn: Weekday = (Number.isInteger(rawWeekStartsOn) && rawWeekStartsOn >= 0 && rawWeekStartsOn <= 6
    ? rawWeekStartsOn
    : 0) as Weekday;
  const count = Math.min(wholeNumber(rawNumberOfMonths, 1, 1), MAX_MONTHS);
  const labels = buildLabels(formatNumber, labelOverrides);
  const min = dateOrNone(rawMin);
  const max = dateOrNone(rawMax);
  const today = parseDate(todayProp) ? (todayProp as string) : clock;
  const minRangeDays = isRange ? wholeNumber(rawMinRangeDays, 1, 1) : 1;
  const maxRangeDays = isRange && rawMaxRangeDays !== undefined ? wholeNumber(rawMaxRangeDays, 1, 0) : 0;

  // What is chosen, whichever mode.
  const rawSelection: readonly string[] =
    value === undefined
      ? uncontrolledSelection
      : calendarProps.mode === "range"
        ? (calendarProps.value ?? ["", ""])
        : calendarProps.mode === "multiple"
          ? (calendarProps.value ?? [])
          : [calendarProps.value ?? ""];
  // Every real date chosen, in date order and without repeats: the one date, the two ends of a range, or all of them.
  const chosenDates = [...new Set(rawSelection.map(dateOrNone).filter((date) => date !== ""))].sort();
  const chosenSet = new Set(chosenDates);
  // The first date chosen (the start of a range) and, for a range, its end.
  /** The first day of the week a date is in, by `weekStartsOn`. */
  const weekStartOf = (date: string): string => formatDate(moveDate(parseDate(date) as CivilDate, "week-start", weekStartsOn));
  const start = isRange ? dateOrNone(rawSelection[0]) : isWeek && chosenDates[0] ? weekStartOf(chosenDates[0]) : (chosenDates[0] ?? "");
  const end = isRange ? dateOrNone(rawSelection[1]) : "";
  // A chosen week is drawn as the strip of a range, from its first day to its last.
  const weekEnd = isWeek && start !== "" ? formatDate(addDays(parseDate(start) as CivilDate, 6)) : "";
  const maxSelected = isMultiple && rawMaxSelected !== undefined ? wholeNumber(rawMaxSelected, 1, 0) : 0;

  // The months on show: the first one, and as many after it as `numberOfMonths` says (never past December 9999).
  const firstKey = ((): string => {
    if (parseMonth(month)) return month as string;
    if (uncontrolledMonth) return uncontrolledMonth;
    if (parseMonth(defaultMonth)) return defaultMonth as string;
    return (start || today || utcMonth()).slice(0, 7);
  })();
  const parsedFirst = parseMonth(firstKey) ?? { year: 1970, month: 1 };
  const firstIndex = Math.min(parsedFirst.year * 12 + (parsedFirst.month - 1), LAST_MONTH - (count - 1));
  const lastIndex = firstIndex + count - 1;
  const monthKeys = useMemo(() => Array.from({ length: count }, (_, offset) => monthOfIndex(firstIndex + offset)), [count, firstIndex]);
  const visibleKey = monthKeys[0] as string;
  const shown = { year: Math.floor(firstIndex / 12), month: (firstIndex % 12) + 1 };

  // The months and years grids are only for one month on show; with more, the layout is the plain heading.
  const viewsLayout = captionLayout === "views" && count === 1;
  const pickerShown = viewsLayout && pickerOpen;

  // A change of month starts a slide in its direction. The two animations alternate (`n` odd or even) so a second
  // change restarts it without remounting the grids, which would drop keyboard focus from the buttons.
  const [motion, setMotion] = useState({ index: firstIndex, n: 0, forward: true });
  if (motion.index !== firstIndex) setMotion({ index: firstIndex, n: motion.n + 1, forward: firstIndex > motion.index });

  const panels = useMemo(
    () =>
      monthKeys.map((key) => {
        const parsed = parseMonth(key) as { year: number; month: number };
        const weeks = monthGrid(parsed.year, parsed.month, weekStartsOn);
        // Without fixed weeks, a row with no day of the month in it is left out.
        const rows = fixedWeeks ? weeks : weeks.filter((week) => week.some((civil) => civil.month === parsed.month));
        return { key, ...parsed, weeks: rows };
      }),
    [monthKeys, weekStartsOn, fixedWeeks],
  );
  // The neighbouring months' days would appear twice with more than one month on show, so they are left out.
  const outsideDays = showOutsideDays && count === 1;

  const baseUnavailable = useCallback(
    (date: string): boolean =>
      disabled || (min !== "" && date < min) || (max !== "" && date > max) || Boolean(isDateDisabled?.(date)),
    [disabled, min, max, isDateDisabled],
  );

  // While the end of a range is being chosen, the dates it may not be: too short, too long, or past an unavailable
  // date it may not run over.
  const picking = isRange && start !== "" && end === "";
  const ruleBounds = useMemo(() => {
    if (!picking) return null;
    const startDate = parseDate(start) as CivilDate;
    const lowest = formatDate(addDays(startDate, minRangeDays - 1));
    let highest = maxRangeDays > 0 ? formatDate(addDays(startDate, maxRangeDays - 1)) : "";
    if (!rangeSpansUnavailable) {
      const reach = maxRangeDays > 0 ? Math.min(maxRangeDays - 1, SCAN_DAYS) : SCAN_DAYS;
      let blocked = "";
      for (let offset = 1; offset <= reach; offset += 1) {
        const date = formatDate(addDays(startDate, offset));
        if (baseUnavailable(date)) {
          blocked = date;
          break;
        }
      }
      if (blocked !== "") {
        const before = formatDate(addDays(parseDate(blocked) as CivilDate, -1));
        if (highest === "" || before < highest) highest = before;
      } else if (highest === "" && reach === SCAN_DAYS) {
        highest = formatDate(addDays(startDate, SCAN_DAYS));
      }
    }
    return { lowest, highest };
  }, [picking, start, minRangeDays, maxRangeDays, rangeSpansUnavailable, baseUnavailable]);

  const unavailable = (date: string): boolean => {
    if (baseUnavailable(date)) return true;
    // Once as many dates are chosen as are allowed, the others can't be added (the chosen ones can be taken away).
    if (maxSelected > 0 && chosenSet.size >= maxSelected && !chosenSet.has(date)) return true;
    // A date before the start restarts the range, so only the dates from the start on are held to the rules.
    return ruleBounds !== null && date >= start && (date < ruleBounds.lowest || (ruleBounds.highest !== "" && date > ruleBounds.highest));
  };
  const rangeRules = isRange && (minRangeDays > 1 || maxRangeDays > 0 || !rangeSpansUnavailable);

  // The date Tab lands on: the one that last had focus, else the chosen date, else today, else the 1st of the first
  // month — whichever of them is on show.
  const onShow = (date: string | null | undefined): date is string =>
    Boolean(date) && monthKeys.includes((date as string).slice(0, 7));
  const tabbable = onShow(focusedDate) ? focusedDate : onShow(start) ? start : onShow(today) ? today : `${visibleKey}-01`;

  /** Shows the month at `index` (months from year 0) as the first on show. */
  const showFirst = (index: number): void => {
    const next = monthOfIndex(Math.min(Math.max(index, FIRST_MONTH), LAST_MONTH));
    if (next === visibleKey) return;
    if (month === undefined) setUncontrolledMonth(next);
    onMonthChange?.(next);
  };
  const goToMonth = (year: number, monthNumber: number): void => showFirst(year * 12 + (monthNumber - 1));
  const stepMonth = (by: number): void => showFirst(firstIndex + by);

  /** Brings a date into view: the first month on show if it is before them, else the first month that puts it last. */
  const bringIntoView = (date: CivilDate): void => {
    const index = date.year * 12 + (date.month - 1);
    if (monthKeys.includes(formatMonth(date.year, date.month))) return;
    showFirst(index < firstIndex ? index : index - (count - 1));
  };

  const commit = (next: readonly string[]): void => {
    if (value === undefined) setUncontrolledSelection(next);
    if (calendarProps.mode === "range") calendarProps.onValueChange?.([next[0] ?? "", next[1] ?? ""]);
    else if (calendarProps.mode === "multiple") calendarProps.onValueChange?.([...next].sort());
    else calendarProps.onValueChange?.(next[0] ?? "");
  };

  // Announce a month change or a choice. One status region, so the latest is what is said.
  const { message: announcement, announce: say } = useAnnouncement();
  const nameOf = (date: string): string => {
    const civil = parseDate(date);
    return civil ? labels.day({ year: civil.year, month: civil.month, day: civil.day, weekday: weekdayOf(civil) }) : date;
  };

  const choose = (date: string): void => {
    if (readOnly || unavailable(date)) return;
    const parsed = parseDate(date);
    if (parsed) bringIntoView(parsed);
    if (calendarProps.mode === "range") {
      // A first choice, or a new range after a finished one, starts; a choice before the start moves the start.
      if (start === "" || end !== "" || date < start) {
        commit([date, ""]);
        if (announce) say(labels.rangeStartChosen(nameOf(date)));
      } else {
        commit([start, date]);
        if (announce) say(labels.rangeChosen(nameOf(start), nameOf(date)));
      }
    } else if (calendarProps.mode === "week") {
      // Any day of a week chooses the week, by the date it starts on.
      const weekStart = weekStartOf(date);
      if (weekStart !== start) {
        commit([weekStart]);
        if (announce) say(labels.weekChosen(nameOf(weekStart), nameOf(formatDate(addDays(parseDate(weekStart) as CivilDate, 6)))));
      }
    } else if (calendarProps.mode === "multiple") {
      // Choosing a date adds it; choosing it again takes it away.
      const next = chosenSet.has(date) ? chosenDates.filter((chosen) => chosen !== date) : [...chosenDates, date];
      commit(next);
      if (announce) say(labels.datesChosen(next.length));
    } else if (date !== start) {
      commit([date]);
    }
  };

  const chooseToday = (): void => {
    const parsed = parseDate(today);
    if (!today || !parsed || disabled) return;
    bringIntoView(parsed);
    setFocusedDate(today);
    // In `multiple` mode choosing a chosen date would take it away, which is not what a Today button is for.
    if (isMultiple && chosenSet.has(today)) return;
    choose(today);
  };

  const clearChoice = (): void => {
    if (readOnly || disabled || chosenDates.length === 0) return;
    commit([]);
  };

  /** Whether a range from one date to another could be chosen by dragging, by the same rules as choosing its end. */
  const rangeAllowed = (from: string, to: string): boolean => {
    const [low, high] = from <= to ? [from, to] : [to, from];
    if (baseUnavailable(low) || baseUnavailable(high)) return false;
    const length = daysBetween(parseDate(low) as CivilDate, parseDate(high) as CivilDate) + 1;
    if (length < minRangeDays || (maxRangeDays > 0 && length > maxRangeDays)) return false;
    if (!rangeSpansUnavailable) {
      for (let offset = 1; offset < Math.min(length, SCAN_DAYS + 1); offset += 1) {
        if (baseUnavailable(formatDate(addDays(parseDate(low) as CivilDate, offset)))) return false;
      }
    }
    return true;
  };

  /** A drag across days has ended on another day: choose the range between them, if it is one that can be chosen. */
  const finishDrag = (from: string, to: string): void => {
    if (readOnly || from === to || !rangeAllowed(from, to)) return;
    const [low, high] = from <= to ? [from, to] : [to, from];
    const parsed = parseDate(high);
    if (parsed) bringIntoView(parsed);
    setFocusedDate(to);
    commit([low, high]);
    if (announce) say(labels.rangeChosen(nameOf(low), nameOf(high)));
  };
  const finishDragRef = useRef(finishDrag);
  useLayoutEffect(() => {
    finishDragRef.current = finishDrag;
  });

  // A drag ends wherever the pointer is let go, which may be outside the calendar.
  useEffect(() => {
    if (dragFrom === null) return;
    const finish = (event: globalThis.PointerEvent) => {
      const to = dayElement(event.target)?.dataset.date;
      setDragFrom(null);
      setHovered(null);
      if (event.type === "pointerup" && to) finishDragRef.current(dragFrom, to);
    };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragFrom]);

  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    if (event.pointerType === "touch") {
      swipeFrom.current = { x: event.clientX, y: event.clientY };
      return;
    }
    const date = dayElement(event.target)?.dataset.date;
    // A drag is for a mouse: a pen and a finger choose with two taps, as the keyboard does with two keys.
    if (!isRange || event.pointerType !== "mouse" || event.button !== 0 || readOnly || !date || baseUnavailable(date)) return;
    setDragFrom(date);
  };

  /** A finger lifted after a clear sideways swipe turns the month: left for the next in left-to-right text. */
  const onPointerUp = (event: PointerEvent<HTMLElement>): void => {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (event.pointerType !== "touch" || !from || disabled) return;
    const across = event.clientX - from.x;
    const down = event.clientY - from.y;
    if (Math.abs(across) < SWIPE_DISTANCE || Math.abs(across) < Math.abs(down) * SWIPE_DOMINANCE) return;
    stepMonth((across < 0) === (dir !== "rtl") ? 1 : -1);
  };

  // `captionLayout="views"`: the picker has chosen a month, or been closed without a choice.
  const choosePickerMonth = (year: number, monthNumber: number): void => {
    goToMonth(year, monthNumber);
    setPickerOpen(false);
    pendingFocus.current = true;
  };
  const closePicker = (): void => {
    setPickerOpen(false);
    pendingHeadingFocus.current = true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const button = dayElement(event.target);
    if (!button || event.ctrlKey || event.metaKey || event.altKey) return;
    const current = parseDate(button.dataset.date);
    if (!current) return;
    let move = keyMoves[event.key];
    if (!move) return;
    if (event.shiftKey && (move === "month-back" || move === "month-forward")) {
      move = move === "month-back" ? "year-back" : "year-forward";
    } else if (event.shiftKey) {
      return;
    }
    // Under right-to-left, the left arrow goes forward.
    if (dir === "rtl" && (move === "day-back" || move === "day-forward")) {
      move = move === "day-back" ? "day-forward" : "day-back";
    }
    event.preventDefault();
    let target = formatDate(moveDate(current, move, weekStartsOn));
    if (min !== "" && target < min) target = min;
    if (max !== "" && target > max) target = max;
    if (target === button.dataset.date) return;
    const parsed = parseDate(target);
    if (!parsed) return;
    pendingFocus.current = true;
    setFocusedDate(target);
    bringIntoView(parsed);
  };

  // Moves focus to the date a key chose, once the month holding it has been drawn.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${tabbable}"]`)?.focus();
  });

  // Moves focus back to the heading button when Escape closes the months or years grid.
  useEffect(() => {
    if (pendingHeadingFocus.current) {
      pendingHeadingFocus.current = false;
      headingRef.current?.focus();
    }
  });

  useEffect(() => {
    if (!autoFocus) return;
    rootRef.current?.querySelector<HTMLButtonElement>('button[data-date][tabindex="0"]')?.focus();
  }, [autoFocus]);

  // Announce the months on show when they change — not the first time they are shown.
  const previousMonths = useRef<string | undefined>(undefined);
  const monthYearLabel = labels.monthYear;
  const monthRangeLabel = labels.monthRange;
  const monthsId = monthKeys.join(",");
  useEffect(() => {
    // The first months shown are remembered and not announced.
    previousMonths.current ??= monthsId;
    if (previousMonths.current === monthsId) return;
    previousMonths.current = monthsId;
    const keys = monthsId.split(",").map((key) => parseMonth(key));
    const first = keys[0];
    const last = keys[keys.length - 1];
    if (!announce || !first || !last) return;
    const firstText = monthYearLabel(first.year, first.month);
    say(keys.length > 1 ? monthRangeLabel(firstText, monthYearLabel(last.year, last.month)) : firstText);
  }, [announce, say, monthYearLabel, monthRangeLabel, monthsId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const warn = (message: string) => console.warn(`Calendar: ${message}`);
    const dates: Array<[string, unknown]> = [
      ...[calendarProps.value, calendarProps.defaultValue].flatMap((chosen, which): Array<[string, unknown]> => {
        const label = which === 0 ? "value" : "defaultValue";
        return typeof chosen === "string" || chosen === undefined ? [[label, chosen]] : chosen.map((date, index) => [`${label}[${index}]`, date]);
      }),
      ["min", rawMin],
      ["max", rawMax],
      ["today", todayProp],
    ];
    for (const [name, date] of dates) {
      if (date !== undefined && date !== "" && !parseDate(date)) {
        warn(`\`${name}\` must be a real date written "YYYY-MM-DD", but got ${JSON.stringify(date)} — it is ignored.`);
      }
    }
    for (const [name, text] of [
      ["month", month],
      ["defaultMonth", defaultMonth],
    ] as const) {
      if (text !== undefined && !parseMonth(text)) {
        warn(`\`${name}\` must be a month written "YYYY-MM", but got ${JSON.stringify(text)} — it is ignored.`);
      }
    }
    if (rawMin && rawMax && parseDate(rawMin) && parseDate(rawMax) && rawMin > rawMax) {
      warn("`min` is after `max`, so no date can be chosen.");
    }
    if (!(Number.isInteger(rawWeekStartsOn) && rawWeekStartsOn >= 0 && rawWeekStartsOn <= 6)) {
      warn(`\`weekStartsOn\` must be a whole number from 0 (Sunday) to 6 (Saturday), but got ${String(rawWeekStartsOn)} — Sunday is used.`);
    }
    if (calendarProps.value !== undefined && calendarProps.defaultValue !== undefined) {
      warn("both `value` and `defaultValue` were given. `value` makes the component controlled, so `defaultValue` is ignored — remove one.");
    }
    if (month !== undefined && defaultMonth !== undefined) {
      warn("both `month` and `defaultMonth` were given. `month` makes the month controlled, so `defaultMonth` is ignored — remove one.");
    }
    if (rawNumberOfMonths !== count) {
      warn(`\`numberOfMonths\` must be a whole number from 1 to ${MAX_MONTHS}, but got ${String(rawNumberOfMonths)} — ${count} is used.`);
    }
    if (count > 1 && captionLayout === "views") {
      warn("`captionLayout=\"views\"` needs one month on show; with more it is the plain heading.");
    }
    if (count > 1 && captionLayout === "dropdown") {
      warn("with more than one month on show, `captionLayout=\"dropdown\"` gives the fields to the first month only.");
    }
    if (isMultiple && rawMaxSelected !== undefined && maxSelected === 0) {
      warn(`\`maxSelected\` must be a whole number of at least 1, but got ${String(rawMaxSelected)} — it is ignored.`);
    }
    if (isMultiple && calendarProps.value && new Set(calendarProps.value).size !== calendarProps.value.length) {
      warn("`value` holds the same date more than once — each date is counted once.");
    }
    if (isRange && rawMaxRangeDays !== undefined && maxRangeDays === 0) {
      warn(`\`maxRangeDays\` must be a whole number of at least 1, but got ${String(rawMaxRangeDays)} — it is ignored.`);
    }
    if (isRange && maxRangeDays > 0 && maxRangeDays < minRangeDays) {
      warn("`maxRangeDays` is less than `minRangeDays`, so no range can be chosen.");
    }
    for (const [name, list, length] of [
      ["months", labelOverrides?.months, 12],
      ["monthsShort", labelOverrides?.monthsShort, 12],
      ["weekdays", labelOverrides?.weekdays, 7],
      ["weekdaysShort", labelOverrides?.weekdaysShort, 7],
    ] as const) {
      if (list !== undefined && list.length !== length) {
        warn(`\`labels.${name}\` needs ${length} entries, but got ${list.length} — the English names are used.`);
      }
    }
  }, [
    calendarProps,
    rawMin,
    rawMax,
    todayProp,
    month,
    defaultMonth,
    rawWeekStartsOn,
    labelOverrides,
    rawNumberOfMonths,
    count,
    captionLayout,
    isRange,
    isMultiple,
    rawMaxSelected,
    maxSelected,
    rawMaxRangeDays,
    maxRangeDays,
    minRangeDays,
  ]);

  // The range on show: what is chosen, and — while the end is still to be chosen — as far as the pointer or the
  // focus has gone, so the person sees what a click would pick.
  // While a drag is under way, the range on show is the one from where it started to where the pointer is.
  const dragging = dragFrom !== null;
  const keyboardPreview = picking && !dragging ? (hovered ?? (focusInside ? focusedDate : null)) : null;
  let shownStart = start;
  let shownEnd = isWeek ? weekEnd : end;
  let bandFrom = start;
  let bandTo = isWeek ? weekEnd : end !== "" ? end : keyboardPreview !== null && keyboardPreview > start ? keyboardPreview : "";
  // The week under the pointer, to be drawn lightly before it is chosen.
  const previewWeekStart = isWeek && hovered !== null && parseDate(hovered) ? weekStartOf(hovered) : "";
  const previewWeekEnd = previewWeekStart !== "" ? formatDate(addDays(parseDate(previewWeekStart) as CivilDate, 6)) : "";
  if (dragFrom !== null) {
    const to = hovered ?? dragFrom;
    [bandFrom, bandTo] = dragFrom <= to ? [dragFrom, to] : [to, dragFrom];
    shownStart = bandFrom;
    shownEnd = bandTo === bandFrom ? "" : bandTo;
    if (bandTo === bandFrom) bandTo = "";
  }

  const previousUnavailable =
    disabled || firstIndex <= FIRST_MONTH || (min !== "" && visibleKey <= min.slice(0, 7));
  const nextUnavailable =
    disabled || lastIndex >= LAST_MONTH || (max !== "" && (monthKeys[count - 1] as string) >= max.slice(0, 7));
  const flipped = dir === "rtl";

  // What the key explains: the looks that are on screen, so with nothing chosen there is no "Selected" entry and a
  // calendar with no rules has no "Unavailable" one. Today waits for the clock, which the server doesn't have.
  const legendItems = [
    ...(today ? [{ key: "today", text: labels.legendToday, swatch: styles.swatchToday }] : []),
    ...(start !== "" ? [{ key: "selected", text: labels.legendSelected, swatch: styles.swatchSelected }] : []),
    ...(isRange && start !== "" ? [{ key: "range", text: labels.legendRange, swatch: styles.swatchRange }] : []),
    ...(disabled || min !== "" || max !== "" || isDateDisabled || rangeRules
      ? [{ key: "unavailable", text: labels.legendUnavailable, swatch: styles.swatchUnavailable }]
      : []),
  ];

  // The year field's choices: the range asked for, narrowed by `min` and `max`, and always including the year on show.
  const yearsOffered = useMemo(() => {
    if (captionLayout !== "dropdown") return [];
    const anchor = parseMonth((today ?? utcMonth()).slice(0, 7))?.year ?? 2026;
    let from = min !== "" ? (parseDate(min) as CivilDate).year : (yearRange?.[0] ?? anchor - 100);
    let to = max !== "" ? (parseDate(max) as CivilDate).year : (yearRange?.[1] ?? anchor + 20);
    from = Math.min(Math.max(Math.trunc(from), 1), shown.year);
    to = Math.max(Math.min(Math.trunc(to), 9999), shown.year);
    return Array.from({ length: to - from + 1 }, (_, offset) => from + offset);
  }, [captionLayout, today, min, max, yearRange, shown.year]);

  // Each marker is asked for once per render. If any of them brings its own content, every number in the calendar
  // sits at the top of its day to leave room for it, so the numbers stay in line along a row.
  const markers = new Map<string, CalendarMarker>();
  if (getMarker) {
    for (const panel of panels) {
      for (const week of panel.weeks) {
        for (const civil of week) {
          const date = formatDate(civil);
          if (markers.has(date)) continue;
          const marker = getMarker(date);
          if (marker) markers.set(date, marker);
        }
      }
    }
  }
  const hasContentMarkers = [...markers.values()].some((marker) => marker.content !== undefined);

  const prevButton = (
    <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={previousUnavailable} className={styles.monthButton}>
      <button type="button" aria-label={labels.previousMonth} onClick={() => stepMonth(-1)}>
        <Icon icon={flipped ? CaretRightIcon : CaretLeftIcon} size={iconSize[size]} tone="brand" />
      </button>
    </Button>
  );
  const nextButton = (
    <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={nextUnavailable} className={styles.monthButton}>
      <button type="button" aria-label={labels.nextMonth} onClick={() => stepMonth(1)}>
        <Icon icon={flipped ? CaretLeftIcon : CaretRightIcon} size={iconSize[size]} tone="brand" />
      </button>
    </Button>
  );

  const monthOutOfRange = (monthNumber: number): boolean => {
    const key = formatMonth(shown.year, monthNumber);
    return (min !== "" && key < min.slice(0, 7)) || (max !== "" && key > max.slice(0, 7));
  };

  const rootStyle = {
    "--calendar-months": count,
    "--calendar-columns": showWeekNumbers ? 8 : 7,
    ...style,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={mergedRef}
      role="group"
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.calendar)}
      aria-labelledby={ariaLabelledBy}
      id={id}
      dir={dir}
      data-testid={dataTestId}
      style={rootStyle}
      className={cx(
        styles.root,
        sizeClass[size],
        rounded && styles.rounded,
        hasContentMarkers && styles.contentMarkers,
        disabled && styles.disabled,
        className,
      )}
    >
      <div
        className={styles.months}
        data-motion={animated && motion.n > 0 ? (motion.n % 2 === 1 ? "a" : "b") : undefined}
        data-forward={motion.forward ? "" : undefined}
      >
        {pickerShown ? (
          <CalendarPicker
            shown={shown}
            today={today}
            min={min}
            max={max}
            size={size}
            rounded={rounded}
            disabled={disabled}
            dir={dir}
            labels={labels}
            formatNumber={formatNumber}
            say={announce ? say : noSay}
            onChoose={choosePickerMonth}
            onClose={closePicker}
          />
        ) : panels.map((panel, panelIndex) => {
          const captionId = `${idBase}-${panelIndex}`;
          const heading = labels.monthYear(panel.year, panel.month);
          const isFirst = panelIndex === 0;
          const isLast = panelIndex === panels.length - 1;
          const dropdown = captionLayout === "dropdown" && isFirst;
          return (
            // Keyed by position, not by month: the buttons and fields in the header must survive a change of month, or
            // keyboard focus on one of them would be dropped when it is used.
            <div key={panelIndex} className={styles.month}>
              <div className={cx(styles.header, dropdown && styles.headerDropdown)}>
                {isFirst && prevButton}
                {dropdown ? (
                  <>
                    <VisuallyHidden id={captionId}>{heading}</VisuallyHidden>
                    <div className={styles.dropdowns}>
                      <Select
                        size={size}
                        dir={dir}
                        aria-label={labels.monthSelect}
                        value={String(panel.month)}
                        onValueChange={(next) => goToMonth(panel.year, Number(next))}
                        className={styles.monthField}
                      >
                        {labels.months.map((name, index) => (
                          <Select.Option
                            key={name}
                            value={String(index + 1)}
                            textValue={name}
                            disabled={monthOutOfRange(index + 1)}
                          >
                            {/* Both forms of the name, and CSS picks: the list shows the full one, the closed button the
                                short one, so a long month never pushes the arrow out of the button. The full name is
                                still in the button for assistive technology, and the short one never is. */}
                            <span className={styles.monthFull}>{name}</span>
                            <span className={styles.monthShort} aria-hidden="true">
                              {labels.monthsShort[index]}
                            </span>
                          </Select.Option>
                        ))}
                      </Select>
                      <Select
                        size={size}
                        dir={dir}
                        aria-label={labels.yearSelect}
                        value={String(panel.year)}
                        onValueChange={(next) => goToMonth(Number(next), panel.month)}
                        className={styles.yearField}
                      >
                        {yearsOffered.map((year) => (
                          <Select.Option key={year} value={String(year)}>
                            {formatNumber(year)}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </>
                ) : viewsLayout && isFirst ? (
                  <>
                    <VisuallyHidden id={captionId}>{heading}</VisuallyHidden>
                    <button
                      ref={headingRef}
                      type="button"
                      className={styles.captionButton}
                      aria-label={labels.openMonths(heading)}
                      onClick={() => setPickerOpen(true)}
                    >
                      {heading}
                    </button>
                  </>
                ) : (
                  <div id={captionId} className={styles.caption}>
                    {heading}
                  </div>
                )}
                {isLast && nextButton}
              </div>
              <table
                className={styles.grid}
                role="grid"
                aria-labelledby={captionId}
                aria-readonly={readOnly || undefined}
                aria-multiselectable={isRange || isMultiple || isWeek || undefined}
                aria-disabled={disabled || undefined}
                onKeyDown={onKeyDown}
                onPointerLeave={() => setHovered(null)}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onFocus={(event: FocusEvent<HTMLElement>) => setFocusInside(dayElement(event.target) !== null)}
                onBlur={(event: FocusEvent<HTMLElement>) => {
                  if (!dayElement(event.relatedTarget)) setFocusInside(false);
                }}
              >
                <thead>
                  <tr>
                    {showWeekNumbers && (
                      <th scope="col" className={styles.weekday}>
                        <span aria-hidden="true">{labels.weekNumberShort}</span>
                        <VisuallyHidden>{labels.weekNumberColumn}</VisuallyHidden>
                      </th>
                    )}
                    {Array.from({ length: 7 }, (_, column) => {
                      const weekday = (weekStartsOn + column) % 7;
                      return (
                        <th key={weekday} scope="col" className={styles.weekday}>
                          <span aria-hidden="true">{labels.weekdaysShort[weekday]}</span>
                          <VisuallyHidden>{labels.weekdays[weekday]}</VisuallyHidden>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {panel.weeks.map((week) => (
                    <tr key={formatDate(week[0] as CivilDate)}>
                      {showWeekNumbers &&
                        (outsideDays || week.some((civil) => civil.month === panel.month) ? (
                          <th scope="row" className={styles.weekNumber} aria-label={labels.weekNumber(weekNumberOf(week))}>
                            {formatNumber(weekNumberOf(week))}
                          </th>
                        ) : (
                          // A row with no day in it (a month's last row, when the neighbouring days are left out) has no number.
                          <td role="gridcell" className={styles.weekNumber} />
                        ))}
                      {week.map((civil, column) => {
                        const date = formatDate(civil);
                        const outside = date.slice(0, 7) !== panel.key;
                        if (outside && !outsideDays) return <td key={date} role="gridcell" className={styles.cell} />;

                        const isStart = date === shownStart;
                        const isEnd = (isRange || isWeek) && date === shownEnd;
                        const isSelected = isMultiple ? chosenSet.has(date) : isStart || isEnd;
                        const isToday = date === today;
                        const isUnavailable = unavailable(date);
                        const inBand = bandTo !== "" && bandFrom !== "" && date > bandFrom && date < bandTo;
                        const bandStart = bandTo !== "" && bandFrom !== "" && date === bandFrom;
                        const bandStop = bandTo !== "" && bandFrom !== "" && date === bandTo;
                        const marker = markers.get(date);
                        // A marker that draws its own content puts text beside the day's number ("20" and "$80"), and what a person sees is
                        // what a speech-control user says, so the name has to hold those words together and in order (WCAG 2.5.3): it opens
                        // with the number and the marker's label. A dot says nothing on screen, so its label follows the date as before.
                        const markerShowsText = Boolean(marker?.content && marker.label);
                        const name = [
                          markerShowsText ? `${formatNumber(civil.day)} ${marker?.label}` : "",
                          labels.day({ year: civil.year, month: civil.month, day: civil.day, weekday: weekdayOf(civil) }),
                          isToday ? labels.today : "",
                          isRange && isStart ? labels.rangeStart : "",
                          isRange && isEnd ? labels.rangeEnd : "",
                          markerShowsText ? "" : (marker?.label ?? ""),
                        ]
                          .filter(Boolean)
                          .join(", ");
                        return (
                          <td
                            key={date}
                            role="gridcell"
                            aria-selected={isSelected || inBand ? true : false}
                            aria-disabled={isUnavailable || undefined}
                            className={cx(
                              styles.cell,
                              inBand && styles.band,
                              bandStart && styles.bandStart,
                              bandStop && styles.bandEnd,
                              previewWeekStart !== "" && date >= previewWeekStart && date <= previewWeekEnd && styles.weekPreview,
                              column === 0 && styles.rowFirst,
                              column === 6 && styles.rowLast,
                            )}
                          >
                            <button
                              type="button"
                              data-date={date}
                              tabIndex={date === tabbable ? 0 : -1}
                              aria-label={name}
                              aria-current={isToday ? "date" : undefined}
                              className={cx(
                                styles.day,
                                outside && styles.outside,
                                isToday && styles.today,
                                isSelected && styles.selected,
                                bandStop && !isEnd && styles.previewEnd,
                                isUnavailable && styles.unavailable,
                              )}
                              onClick={() => choose(date)}
                              onFocus={() => setFocusedDate(date)}
                              onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
                                if ((picking || dragging || isWeek) && event.pointerType === "mouse") setHovered(date);
                              }}
                            >
                              {formatNumber(civil.day)}
                              {marker && (
                                <span className={styles.marker} aria-hidden="true">
                                  {marker.content ?? <span className={cx(styles.dot, markerToneClass[marker.tone ?? "brand"])} />}
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {showLegend && <CalendarLegend label={labels.legend} items={legendItems} />}
      {(showTodayButton || clearable || footer) && (
        <div className={styles.footer}>
          {(showTodayButton || clearable) && (
            <div className={styles.footerActions}>
              {showTodayButton && (
                // Slotted onto a plain button: `aria-disabled`, not natively disabled, so it keeps keyboard focus.
                <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={disabled || !today}>
                  <button type="button" onClick={chooseToday}>
                    {labels.todayButton}
                  </button>
                </Button>
              )}
              {clearable && (
                <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={disabled || readOnly || start === ""}>
                  <button type="button" onClick={clearChoice}>
                    {labels.clearButton}
                  </button>
                </Button>
              )}
            </div>
          )}
          {footer}
        </div>
      )}
      {name !== undefined && name !== "" && !disabled && (
        <>
          {isMultiple
            ? chosenDates.map((date) => <input key={date} type="hidden" name={`${name}[]`} value={date} />)
            : isRange
              ? [start, end].map((date, index) => <input key={index} type="hidden" name={`${name}[]`} value={date} />)
              : <input type="hidden" name={name} value={start} />}
        </>
      )}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </div>
  );
});

Calendar.displayName = "Calendar";
