import { CalendarBlankIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { padSegment, segmentWidth, segmentsForFormat } from "../../internal/date/dateEntry";
import { formatMonth, parseDate, parseMonth } from "../../internal/date/dateValue";
import { useViewportRoom } from "../../internal/useViewportRoom";
import { noClockOnTheServer, readClock, subscribeToNothing } from "../../molecules/Calendar/calendarHelpers";
import { buildLabels } from "../../molecules/Calendar/calendarLabels";
import { DatePicker } from "../DatePicker";
import type { DatePickerLabels } from "../DatePicker";
import datePickerStyles from "../DatePicker/DatePicker.module.css";
import styles from "./DateRangePicker.module.css";
import type { DateRangePickerLabels, DateRangePickerProps, DateRangeValue } from "./DateRangePicker.types";
import { DateRangePickerPanel } from "./DateRangePickerPanel";
import type { RangePresetChoice } from "./DateRangePickerPanel";
import { laterOf, rangeProblem, wholeNumber } from "./dateRangeValue";
import type { RangeRules } from "./dateRangeValue";

const defaultLabels = (formatNumber: (value: number) => string): DateRangePickerLabels => ({
  start: "Start date",
  end: "End date",
  day: "Day",
  month: "Month",
  year: "Year",
  empty: "Empty",
  openPicker: "Choose dates",
  pickerName: "Choose a date range",
  clear: "Clear dates",
  incomplete: "Enter a complete date",
  invalid: "This date doesn't exist",
  unavailable: "This date isn't available",
  beforeMin: (earliest) => `Choose ${earliest} or later`,
  afterMax: (latest) => `Choose ${latest} or earlier`,
  tooShort: (days) => `Choose a range of at least ${formatNumber(days)} days`,
  tooLong: (days) => `Choose a range of at most ${formatNumber(days)} days`,
  spansUnavailable: "This range includes unavailable dates",
  presets: "Quick choices",
  chosen: (start, end) => `Dates chosen: ${start} to ${end}`,
});

const SIDE_OFFSET = 4;
// The gap kept between a full-width panel and the edges of the screen, in pixels (also the layer's collision padding).
const EDGE_GAP = SIDE_OFFSET * 2;
// A full-width panel opens on the side that has at least this much room (pixels) before the other side is tried: about
// a calendar's height. A behaviour threshold, not a design value.
const MIN_ROOM = 360;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const textOf = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * A start date and an end date: two `DatePicker` fields side by side, joined by a dash, whose values are one `[start, end]`
 * pair, and one `Calendar` in a floating panel that chooses the whole range (the first date is the start, the second the
 * end). Each end has everything a `DatePicker` field has (segments you type into, `format`, `separator`, `min`, `max`,
 * `isDateDisabled`, `unavailableReason`, a hidden validated form input), and the end can't be before the start: an end
 * earlier than the start is reported as typed and flagged invalid on that end, not refused.
 *
 * `minRangeDays`, `maxRangeDays` and `rangeSpansUnavailable` limit the length of a range: the calendar disables the end
 * dates that would break them and a typed end that does is flagged with a message that says why. `presets` adds quick
 * choices ("Last 7 days"), `numberOfMonths` takes a breakpoint map (one month on a phone, two beyond), and `side`,
 * `align` and `presentation` place the panel against the pair. The panel opens from the button after the end or with
 * `Alt`+`ArrowDown` in a segment; opened from the end it chooses the end and leaves the start where it is.
 *
 * A form submits it as two values under `name[]`, and `required` stops a submit while either end is empty. `ref`
 * forwards to the group that holds the pair; `id` goes on the start's first segment.
 *
 * @example
 * ```tsx
 * <DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />
 * <DateRangePicker aria-label="Report period" value={range} onValueChange={setRange} min="today" maxRangeDays={30} />
 * ```
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      value: valueProp,
      defaultValue = ["", ""],
      onValueChange,
      commitOn,
      granularity: granularityProp = "day",
      format = "mdy",
      separator = "/",
      min,
      max,
      isDateDisabled,
      unavailableReason,
      minRangeDays: minRangeDaysProp,
      maxRangeDays: maxRangeDaysProp,
      rangeSpansUnavailable = true,
      presets,
      numberOfMonths = { base: 1, sm: 2 },
      weekStartsOn,
      rounded = false,
      today: todayProp,
      calendarProps,
      side = "bottom",
      align = "start",
      presentation = "anchored",
      container,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
      clearable,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onClear,
      onFocus,
      onBlur,
      name,
      form,
      autoFocus = false,
      dir,
      labels: labelOverrides,
      formatNumber = String,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
      style,
      "data-testid": dataTestId,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels(formatNumber), labelOverrides);
    const granularity: "day" | "month" = granularityProp === "month" ? "month" : "day";
    const byMonth = granularity === "month";
    // Whether a text is a whole date (or, by month, a whole month) as the pair takes it.
    const isWhole = (text: string): boolean => (byMonth ? /^\d{4}-\d{2}$/.test(text) && parseMonth(text) !== null : parseDate(text) !== null);
    const [uncontrolled, setUncontrolled] = useState<DateRangeValue>(defaultValue);
    const isControlled = valueProp !== undefined;
    const pair = isControlled ? valueProp : uncontrolled;
    // Picks made in the calendar that `commitOn` is holding back, shown in the fields and the calendar meanwhile.
    const [held, setHeld] = useState<DateRangeValue | null>(null);
    const committedStart = textOf(pair?.[0]);
    const committedEnd = textOf(pair?.[1]);
    // A range set from outside while picks are held wins over them, as a `DatePicker`'s value does over a held edit.
    const [seenPair, setSeenPair] = useState(`${committedStart}|${committedEnd}`);
    if (seenPair !== `${committedStart}|${committedEnd}`) {
      setSeenPair(`${committedStart}|${committedEnd}`);
      if (held) setHeld(null);
    }
    const start = held ? held[0] : committedStart;
    const end = held ? held[1] : committedEnd;
    const startDate = isWhole(start) ? start : undefined;
    const endWhole = isWhole(end);

    // Today: the prop, else the browser's date once the page has loaded (nothing on a server or during hydration).
    const clock = useSyncExternalStore(subscribeToNothing, readClock, noClockOnTheServer);
    const today = parseDate(todayProp) ? (todayProp as string) : clock;
    // A bound is a date, or the word "today"; by month, a "YYYY-MM-DD" is read as its month.
    const compact = (date: string): string => (byMonth ? date.slice(0, 7) : date);
    const resolveBound = (bound: string | undefined): string | undefined => {
      if (bound === "today") return today === undefined ? undefined : compact(today);
      if (bound === undefined) return undefined;
      if (byMonth) return parseMonth(bound.slice(0, 7)) && (bound.length === 7 || parseDate(bound)) ? bound.slice(0, 7) : undefined;
      return parseDate(bound) ? bound : undefined;
    };
    const minDate = resolveBound(min);
    const maxDate = resolveBound(max);

    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly && showPicker;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    // What the next date chosen in the panel is: a new range ("range", the default), the end of the range that has a start
    // ("end", from the end or once a start was chosen), or the start of a whole range, which keeps its end ("start"). Only
    // meaningful while open, so it is dropped when the panel closes (adjusted while rendering, not in an effect).
    const [mode, setMode] = useState<"range" | "end" | "start">("range");
    if (!open && mode !== "range") setMode("range");

    const fullWidth = useResolvedResponsiveValue(presentation, "anchored") === "full-width";
    const months = wholeNumber(useResolvedResponsiveValue(numberOfMonths, 1), 1, 1);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        "DateRangePicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the pair.",
      );
      // Once per mount: the point is catching the omission, not repeating it on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (fullWidth && align !== "start") {
        console.warn('DateRangePicker: `align` has no effect while `presentation` is "full-width"; the panel spans the screen.');
      }
      if (byMonth && (minRangeDaysProp !== undefined || maxRangeDaysProp !== undefined || rangeSpansUnavailable === false)) {
        console.warn('DateRangePicker: `minRangeDays`, `maxRangeDays` and `rangeSpansUnavailable` have no effect with `granularity="month"`.');
      }
      if (maxRangeDaysProp !== undefined && wholeNumber(maxRangeDaysProp, 1, 0) === 0) {
        console.warn(`DateRangePicker: \`maxRangeDays\` must be a whole number of at least 1, but got ${String(maxRangeDaysProp)}; it is ignored.`);
      }
    }, [fullWidth, align, maxRangeDaysProp, byMonth, minRangeDaysProp, rangeSpansUnavailable]);

    const change = (next: DateRangeValue) => {
      setHeld(null);
      if (!isControlled) setUncontrolled(next);
      onValueChange?.([next[0], next[1]]);
    };

    // Closing the calendar, however it is closed, is the end of choosing in it: what `commitOn` held is reported.
    const latest = useRef({ held, change });
    useEffect(() => {
      latest.current = { held, change };
    });
    useEffect(() => {
      if (!open && latest.current.held) latest.current.change(latest.current.held);
    }, [open]);

    const minRangeDays = wholeNumber(minRangeDaysProp, 1, 1);
    const maxRangeDays = wholeNumber(maxRangeDaysProp, 1, 0);
    const isBlocked = (date: string): boolean => isDateDisabled?.(date) === true || Boolean(unavailableReason?.(date));
    const rules: RangeRules = byMonth
      ? {
          minRangeDays: 1,
          maxRangeDays: 0,
          rangeSpansUnavailable: true,
          isBlocked,
        }
      : { minRangeDays, maxRangeDays, rangeSpansUnavailable, isBlocked };

    // The end carries the range's limits as its own reason, so the field, its form message and `aria-invalid` all follow.
    const endReason = (date: string): string | false => {
      const own = unavailableReason?.(date);
      if (typeof own === "string" && own) return own;
      if (!startDate || byMonth) return false;
      switch (rangeProblem(startDate, date, rules)) {
        case "tooShort":
          return labels.tooShort(minRangeDays);
        case "tooLong":
          return labels.tooLong(maxRangeDays);
        case "spansUnavailable":
          return labels.spansUnavailable;
        default:
          return false;
      }
    };
    // The end can never be before the start, so the start narrows the end's earliest. The start is not limited by the end:
    // that would flag it whenever the end is mid-typing and briefly earlier.
    const endMin = startDate ? laterOf(minDate, startDate) : min;

    // A date as the pair writes it ("10/01/2026"), for what is announced.
    const segments = segmentsForFormat(format, granularity);
    const writeDate = (text: string): string => {
      const civil = byMonth ? parseMonth(text) : parseDate(text);
      if (!civil) return text;
      return segments.map((segment) => padSegment(civil[segment as keyof typeof civil] as number, segmentWidth(segment), formatNumber)).join(separator);
    };

    const { message: announcement, announce } = useAnnouncement();
    const announceRange = (range: DateRangeValue) => announce(labels.chosen(writeDate(range[0]), writeDate(range[1])));

    // The pair is one field to the outside: focus moving between the ends, or into the calendar, is not arriving or leaving.
    const rootElement = useRef<HTMLDivElement | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const endElement = useRef<HTMLDivElement | null>(null);
    const pickerButton = useRef<HTMLButtonElement | null>(null);
    const inside = useRef(false);
    const withinPair = (node: EventTarget | null) => node instanceof Node && (rootElement.current?.contains(node) === true || panel.current?.contains(node) === true);
    const arrive = (event: FocusEvent<HTMLElement>) => {
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event as FocusEvent<HTMLDivElement>);
    };
    const leave = (event: FocusEvent<HTMLElement>) => {
      if (withinPair(event.relatedTarget)) return;
      inside.current = false;
      onBlur?.(event as FocusEvent<HTMLDivElement>);
    };

    // Where focus was when the calendar was opened, so closing gives it back there; and whether it was closed by a press
    // somewhere else, in which case focus is wherever the person put it.
    const openedFrom = useRef<HTMLElement | "button" | null>(null);
    const interactedOutside = useRef(false);

    const onGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      const target = event.target;
      if (!(event.altKey && event.key === "ArrowDown" && target instanceof HTMLInputElement && target.getAttribute("role") === "spinbutton")) return;
      if (!showPicker || disabled || readOnly) return;
      event.preventDefault();
      openedFrom.current = target;
      const fromEnd = endElement.current?.contains(target) === true;
      setMode(fromEnd && startDate !== undefined ? "end" : !fromEnd && startDate !== undefined && endWhole ? "start" : "range");
      setOpen(true);
    };

    // A range chosen in the calendar: the first date makes `[start, ""]` and keeps the calendar open for the end; the second
    // completes it. `commitOn` holds the report until the range is whole or the calendar closes.
    const choose = (picked: [start: string, end: string]) => {
      let next = picked;
      // Opened to change the start: the date chosen keeps the end, unless that would put it after the end or break a limit,
      // in which case it starts a new range.
      if (mode === "start" && picked[1] === "" && picked[0] <= end && rangeProblem(picked[0], end, rules) === null) next = [picked[0], end];
      setMode(next[1] === "" ? "end" : "range");
      if (commitOn === undefined || commitOn === "change") change(next);
      else setHeld(next);
      if (next[1] !== "") {
        announceRange(next);
        setOpen(false);
      }
    };

    const choosePreset = (range: DateRangeValue) => {
      change(range);
      announceRange(range);
      setOpen(false);
    };

    // Whether either end shows anything at all, a half-typed segment included, read from the segments themselves. An end
    // keeps what is typed in it to itself, so this is read after each render and after each key or insertion in the pair.
    const [typedAny, setTypedAny] = useState(false);
    const readTyped = () => [...(rootElement.current?.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]') ?? [])].some((input) => input.value !== "");
    const syncTyped = () => {
      const any = readTyped();
      if (any !== typedAny) setTypedAny(any);
    };
    useIsomorphicLayoutEffect(syncTyped);

    // Clearing starts the ends afresh (a new `key`), which also drops what is half typed in them.
    const [epoch, setEpoch] = useState(0);
    const focusStartAfterClear = useRef(false);
    useEffect(() => {
      if (!focusStartAfterClear.current) return;
      focusStartAfterClear.current = false;
      rootElement.current?.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.focus();
    }, [epoch]);
    const clear = () => {
      change(["", ""]);
      focusStartAfterClear.current = true;
      setEpoch((count) => count + 1);
      onClear?.();
    };

    const hasContent = start !== "" || end !== "" || typedAny;
    const showClear = (clearable ?? onClear !== undefined) && hasContent && !disabled && !readOnly;

    // The calendar shows the range, or — when it was opened to choose the end, or after the start is chosen — the start alone.
    const panelValue: DateRangeValue = mode === "end" && startDate ? [start, ""] : [start, end];

    // By month the panel is a grid of months, which has no range model of its own: a choice follows the calendar's own rule.
    const chooseMonth = (year: number, monthNumber: number) => {
      const key = formatMonth(year, monthNumber);
      choose(panelValue[0] !== "" && panelValue[1] === "" && key >= panelValue[0] ? [panelValue[0], key] : [key, ""]);
    };

    const presetList: RangePresetChoice[] = (presets ?? []).map((preset) => {
      const resolved = typeof preset.value === "function" ? (today === undefined ? undefined : preset.value(today)) : preset.value;
      const [from, to] = resolved ?? ["", ""];
      const real = resolved !== undefined && isWhole(from) && isWhole(to) && from <= to;
      const allowed =
        real &&
        !(minDate !== undefined && from < minDate) &&
        !(maxDate !== undefined && to > maxDate) &&
        !isBlocked(from) &&
        !isBlocked(to) &&
        rangeProblem(from, to, rules) === null;
      return {
        label: preset.label,
        range: real ? [from, to] : undefined,
        allowed,
      };
    });

    const calendarLabels = buildLabels(formatNumber, calendarProps?.labels);
    const pickLabels: Partial<DatePickerLabels> = {
      day: labels.day,
      month: labels.month,
      year: labels.year,
      empty: labels.empty,
      incomplete: labels.incomplete,
      invalid: labels.invalid,
      unavailable: labels.unavailable,
      beforeMin: labels.beforeMin,
      afterMax: labels.afterMax,
    };
    const common = {
      commitOn,
      granularity,
      format,
      separator,
      size,
      hasError,
      disabled,
      readOnly,
      showPicker: false,
      clearable: false,
      today: todayProp,
      dir,
      // The ends say the month by name from the calendar's own labels.
      calendarProps: calendarProps?.labels ? { labels: calendarProps.labels } : undefined,
      labels: pickLabels,
      formatNumber,
      isDateDisabled,
      onFocus: arrive,
      onBlur: leave,
      name: name ? `${name}[]` : undefined,
      form,
    };

    // Where the panel opens. Full width (a phone, usually) spans the visible screen, and goes on whichever side has room
    // once an on-screen keyboard is counted, which the floating layer doesn't know about.
    const panelId = useId();
    const room = useViewportRoom(rootElement, fullWidth && open);
    const preferredTop = side === "top";
    const roomOnPreferred = room ? (preferredTop ? room.above : room.below) : 0;
    const roomOnOther = room ? (preferredTop ? room.below : room.above) : 0;
    const panelSide: "top" | "bottom" =
      fullWidth && room && roomOnPreferred < MIN_ROOM && roomOnOther > roomOnPreferred ? (preferredTop ? "bottom" : "top") : preferredTop ? "top" : "bottom";
    const panelStyle =
      fullWidth && room
        ? ({
            "--date-picker-width": `${room.width - 2 * EDGE_GAP}px`,
          } as React.CSSProperties)
        : undefined;

    const group = (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- listens for a key pressed in one of the segments inside it (Alt+ArrowDown opens the calendar); the segments are the interactive elements and each is a tab stop.
      <div
        {...props}
        ref={mergeRefs(ref, rootElement)}
        role="group"
        dir={dir}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
        style={style}
        onKeyDown={onGroupKeyDown}
        onKeyUp={(event) => {
          props.onKeyUp?.(event);
          syncTyped();
        }}
        onInput={(event) => {
          props.onInput?.(event);
          syncTyped();
        }}
        className={cx(styles.root, className)}
      >
        <DatePicker
          {...common}
          key={`start-${epoch}`}
          // A range needs both ends, so an end that has a partner is required whether or not the pair is.
          required={required || endWhole}
          id={id}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- passing on the component's own opt-in prop, not a native attribute
          autoFocus={autoFocus}
          aria-label={labels.start}
          value={start}
          min={min}
          max={max}
          unavailableReason={unavailableReason}
          onValueChange={(next) => change([next, end])}
        />
        <span aria-hidden="true" className={styles.separator}>
          –
        </span>
        <DatePicker
          {...common}
          key={`end-${epoch}`}
          required={required || startDate !== undefined}
          ref={endElement}
          aria-label={labels.end}
          value={end}
          min={endMin}
          max={max}
          unavailableReason={endReason}
          onValueChange={(next) => change([start, next])}
        />
        {showClear && <IconButton icon={XIcon} variant="ghost" size={size} aria-label={labels.clear} onClick={clear} onFocus={arrive} onBlur={leave} />}
        {showPicker && (
          <IconButton
            ref={pickerButton}
            icon={CalendarBlankIcon}
            variant="ghost"
            size={size}
            aria-label={labels.openPicker}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            disabled={disabled || readOnly}
            onFocus={arrive}
            onBlur={leave}
            onClick={() => {
              openedFrom.current = "button";
              setMode("range");
              setOpen(!open);
            }}
          />
        )}
        {/* A range chosen in the calendar is said here: focus goes back to a button whose name doesn't change. The region is in
            the page before its text does, so it is announced as a change. */}
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      </div>
    );

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>{group}</PopoverPrimitive.Anchor>
        {showPicker && (
          <PopoverPrimitive.Portal container={container}>
            <PopoverPrimitive.Content
              ref={panel}
              id={panelId}
              side={panelSide}
              align={fullWidth ? "start" : align}
              sideOffset={SIDE_OFFSET}
              collisionPadding={EDGE_GAP}
              dir={dir}
              aria-label={labels.pickerName}
              className={cx(datePickerStyles.panel, fullWidth && datePickerStyles.fullWidth)}
              style={panelStyle}
              onFocus={arrive}
              onBlur={leave}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                // Every opening starts clean: a press elsewhere that closed an earlier one says nothing about this one.
                interactedOutside.current = false;
                // Focus goes to the day Tab would land on: the chosen start, else today. Not to the panel itself.
                (event.currentTarget as HTMLElement).querySelector<HTMLElement>("button[data-date][tabindex='0']")?.focus();
              }}
              onCloseAutoFocus={(event) => {
                // Radix has no trigger to hand focus back to, so it is done here: to where the panel was opened from (the
                // segment, for the keyboard shortcut; else the button), unless the person closed it by pressing somewhere
                // else, which is where their focus now is.
                event.preventDefault();
                const from = openedFrom.current;
                openedFrom.current = null;
                if (interactedOutside.current) return;
                if (from && from !== "button" && from.isConnected) from.focus();
                else pickerButton.current?.focus();
              }}
              onInteractOutside={(event) => {
                // The button toggles the panel itself: a press on it is not an outside press.
                if (event.target instanceof Node && pickerButton.current?.contains(event.target)) {
                  event.preventDefault();
                  return;
                }
                interactedOutside.current = true;
              }}
            >
              <DateRangePickerPanel
                byMonth={byMonth}
                onChooseMonth={chooseMonth}
                today={today}
                value={panelValue}
                minDate={minDate}
                maxDate={maxDate}
                todayProp={todayProp}
                dir={dir}
                formatNumber={formatNumber}
                numberOfMonths={months}
                minRangeDays={minRangeDays}
                maxRangeDays={maxRangeDays > 0 ? maxRangeDays : undefined}
                rangeSpansUnavailable={rangeSpansUnavailable}
                calendarProps={calendarProps}
                calendarLabels={calendarLabels}
                weekStartsOn={weekStartsOn}
                rounded={rounded}
                isBlocked={isBlocked}
                unavailableReason={unavailableReason}
                presets={presetList}
                presetsLabel={labels.presets}
                onChoose={choose}
                onPreset={choosePreset}
              />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </PopoverPrimitive.Root>
    );
  },
);
DateRangePicker.displayName = "DateRangePicker";
