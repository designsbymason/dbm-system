import { CalendarBlankIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Fragment, forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ChangeEvent, CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  emptyDateDraft,
  endOfDateSegment,
  hasDateContent,
  isImpossibleDate,
  padSegment,
  segmentRange,
  segmentWidth,
  segmentsForFormat,
  stepDateSegment,
} from "../../internal/date/dateEntry";
import type { DateSegment } from "../../internal/date/dateEntry";
import { parseDate, parseMonth } from "../../internal/date/dateValue";
import { useViewportRoom } from "../../internal/useViewportRoom";
import { noClockOnTheServer, readClock, subscribeToNothing } from "../../molecules/Calendar/calendarHelpers";
import { buildLabels } from "../../molecules/Calendar/calendarLabels";
import styles from "./DatePicker.module.css";
import type { DatePickerLabels, DatePickerProps, DatePickerSize } from "./DatePicker.types";
import { DatePickerPanel } from "./DatePickerPanel";
import type { PresetChoice } from "./DatePickerPanel";
import { reasonOf } from "./datePickerReason";
import { useDatePickerValue } from "./useDatePickerValue";

const defaultLabels: DatePickerLabels = {
  day: "Day",
  month: "Month",
  year: "Year",
  empty: "Empty",
  openPicker: "Choose date",
  pickerName: "Choose a date",
  clear: "Clear date",
  incomplete: "Enter a complete date",
  invalid: "This date doesn't exist",
  unavailable: "This date isn't available",
  beforeMin: (earliest) => `Choose ${earliest} or later`,
  afterMax: (latest) => `Choose ${latest} or earlier`,
  presets: "Quick choices",
  chosen: (date) => `Date chosen: ${date}`,
};

const sizeClass: Record<DatePickerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const buttonClass: Record<DatePickerSize, string | undefined> = {
  xs: styles.buttonXs,
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
  xl: styles.buttonXl,
};

// `Input`'s own mapping: the icon is the same step as the field's size; the button's margin keeps it inside its row.
const iconSizeFor: Record<DatePickerSize, "xs" | "sm" | "md" | "lg" | "xl"> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };

const SIDE_OFFSET = 4;
// The gap kept between a full-width panel and the edges of the screen, in pixels (also the layer's collision padding).
const EDGE_GAP = SIDE_OFFSET * 2;
// A full-width panel opens on the side that has at least this much room (pixels) before the other side is tried: about
// a calendar's height. A behaviour threshold, not a design value.
const MIN_ROOM = 360;

/**
 * A date field: separate day, month and year segments you type into or step with the arrow keys, and a button
 * that opens a `Calendar` in a floating panel to pick with a pointer or a finger. The value is a `"YYYY-MM-DD"` string,
 * the same whichever order the segments are written in, so there is nothing to parse and it submits as it is. With
 * `granularity="month"` the field has no day, the panel is a grid of months, and the value is `"YYYY-MM"`.
 *
 * Typing follows a native date field: a digit that cannot start a two-digit number is the whole number and moves
 * on (a 4 in the day), one that can waits for the next, and the year takes four. `Backspace` clears a segment,
 * `ArrowUp`/`ArrowDown` step it (the day wraps within its month), `ArrowLeft`/`ArrowRight` move between segments,
 * `Home`/`End` go to its least and greatest, and `Alt`+`ArrowDown` opens the calendar. While a segment is empty,
 * or the three numbers are not a real date (the 31st of February), the value is `""`.
 *
 * A date outside `min`/`max`, or one `isDateDisabled` or `unavailableReason` rules out, is flagged (`aria-invalid`,
 * error styling) and still reported, not refused — refusing a half-typed date would make the field fight the person —
 * and the calendar disables what cannot be reached. `min` and `max` can be the word `"today"`. The order comes from
 * `format`, never the browser's locale, and every word the field writes is in `labels` (the month and weekday names
 * are the calendar's own, through `calendarProps`). `presets` adds quick choices under the calendar, `side` and
 * `align` place the panel against the field, and `presentation` makes it span the screen on a phone.
 *
 * A form can use it as a native control: `required` stops a submit while the field is empty, and a half-filled,
 * impossible or unavailable date stops it too, with a message that says which. `onFocus`/`onBlur` fire for the field
 * as a whole, and `commitOn` holds `onValueChange` back until the person is done.
 *
 * `ref` forwards to the group element that holds the segments. The `id` goes on the first segment, which is what
 * a label's `htmlFor` should point at.
 *
 * @example
 * ```tsx
 * <DatePicker aria-label="Start date" defaultValue="2026-10-03" />
 * <DatePicker value={date} onValueChange={setDate} format="dmy" separator="." min="today" />
 * <DatePicker aria-label="Card expires" granularity="month" min="today" />
 * <FormField label="Birthday">{(field) => <DatePicker {...field} format="ymd" />}</FormField>
 * ```
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value: valueProp,
      defaultValue = "",
      onValueChange,
      granularity: granularityProp = "day",
      commitOn = "change",
      format = "mdy",
      separator = "/",
      min,
      max,
      isDateDisabled,
      unavailableReason,
      presets,
      weekStartsOn,
      showTodayButton,
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
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels, labelOverrides);
    const granularity = granularityProp === "month" ? "month" : "day";
    const byMonth = granularity === "month";
    const segments = segmentsForFormat(format, granularity);
    // Today: the prop, else the browser's date once the page has loaded (nothing on a server or during hydration).
    const clock = useSyncExternalStore(subscribeToNothing, readClock, noClockOnTheServer);
    const today = parseDate(todayProp) ? (todayProp as string) : clock;
    const compact = (date: string): string => (byMonth ? date.slice(0, 7) : date);

    // A bound is a date, or the word "today"; by month, a "YYYY-MM-DD" is read as its month.
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

    const fullWidth = useResolvedResponsiveValue(presentation, "anchored") === "full-width";

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      for (const [prop, text, parsed] of [["min", min, minDate], ["max", max, maxDate]] as const) {
        if (text !== undefined && text !== "" && text !== "today" && !parsed) {
          console.warn(
            `DatePicker: \`${prop}\` must be "${byMonth ? "YYYY-MM" : "YYYY-MM-DD"}" or "today"; got ${JSON.stringify(text)}, ignoring it.`,
          );
        }
      }
      if (!["dmy", "mdy", "ymd"].includes(format)) {
        console.warn(`DatePicker: \`format\` must be "dmy", "mdy" or "ymd"; got ${JSON.stringify(format)}, using "mdy".`);
      }
      if (byMonth && showTodayButton) {
        console.warn('DatePicker: `showTodayButton` has no effect with `granularity="month"`; use a preset.');
      }
      if (fullWidth && align !== "start") {
        console.warn('DatePicker: `align` has no effect while `presentation` is "full-width"; the panel spans the screen.');
      }
      // Only the values that make a warning matter, not their identity on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [min, max, format, byMonth, showTodayButton, fullWidth, align]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        "DatePicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the group of segments.",
      );
      // Once per mount: the point is catching the omission, not repeating it on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { value, draft, draftValue, pending, setPending, commit, flush, typeText, toDraft } = useDatePickerValue({
      value: valueProp,
      defaultValue,
      onValueChange,
      granularity,
      commitOn,
      open,
      segments,
      separator,
    });

    const segmentRefs = useRef<Partial<Record<DateSegment, HTMLInputElement | null>>>({});
    const focusSegment = (segment: DateSegment | undefined) => {
      if (segment) segmentRefs.current[segment]?.focus();
    };

    useEffect(() => {
      if (autoFocus) segmentRefs.current[segments[0]!]?.focus();
      // On mount only, as a native `autoFocus` is.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // A date as the field writes it ("10/01/2026"), for a message that names a bound and for what is announced.
    const writeDate = (text: string): string => {
      const parts = toDraft(text);
      return segments.map((segment) => (parts[segment] === undefined ? "" : padSegment(parts[segment], segmentWidth(segment), formatNumber))).join(separator);
    };

    const isBlocked = (date: string): boolean =>
      isDateDisabled?.(date) === true || (unavailableReason ? Boolean(unavailableReason(date)) : false);

    const complete = draftValue !== "";
    const beforeMin = complete && minDate !== undefined && draftValue < minDate;
    const afterMax = complete && maxDate !== undefined && draftValue > maxDate;
    const blocked = complete && !beforeMin && !afterMax && isBlocked(draftValue);
    const outsideConstraints = beforeMin || afterMax || blocked;
    const impossible = isImpossibleDate(draft);
    const invalid = hasError || outsideConstraints || impossible;
    const hasContent = hasDateContent(draft);
    const showClear = (clearable ?? onClear !== undefined) && hasContent && !disabled && !readOnly;
    // What a form says when it is asked to submit: a date that is not there yet, not real, or not allowed, and why.
    const validationMessage = impossible
      ? labels.invalid
      : beforeMin
        ? labels.beforeMin(writeDate(minDate as string))
        : afterMax
          ? labels.afterMax(writeDate(maxDate as string))
          : blocked
            ? reasonOf(unavailableReason, draftValue) || labels.unavailable
            : !complete && hasContent
              ? labels.incomplete
              : "";
    const proxy = useRef<HTMLInputElement>(null);
    useEffect(() => {
      proxy.current?.setCustomValidity(validationMessage);
    }, [validationMessage]);

    // The calendar's own labels: the month names for what a screen reader hears of the month segment, and the base of a
    // day's name, which gets the reason a date is unavailable.
    const calendarLabels = buildLabels(formatNumber, calendarProps?.labels);

    // Where focus was when the calendar was opened from the keyboard, so closing gives it back there; and whether it was
    // closed by a press somewhere else, in which case focus is wherever the person put it.
    const openedFrom = useRef<DateSegment | "button" | null>(null);
    const interactedOutside = useRef(false);
    const { message: announcement, announce } = useAnnouncement();

    const fallbackYear = () => parseDate(today ?? readClock())?.year ?? 1;

    const onSegmentKeyDown = (event: KeyboardEvent<HTMLInputElement>, segment: DateSegment) => {
      const key = event.key;
      const editable = !disabled && !readOnly;
      if (event.altKey && key === "ArrowDown") {
        event.preventDefault();
        if (showPicker && editable) {
          openedFrom.current = segment;
          setOpen(true);
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const index = segments.indexOf(segment);
      switch (key) {
        case "ArrowLeft":
          event.preventDefault();
          focusSegment(segments[index - 1]);
          return;
        case "ArrowRight":
          event.preventDefault();
          focusSegment(segments[index + 1]);
          return;
        case "Enter":
          // A native field reports its value on Enter; here it also ends a held edit.
          flush();
          return;
        case "Tab":
        case "Escape":
          return;
      }
      if (!editable) {
        if (key.length === 1 || key === "Backspace" || key === "Delete" || key.startsWith("Arrow")) event.preventDefault();
        return;
      }
      switch (key) {
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault();
          setPending(null);
          commit(stepDateSegment(draft, segment, key === "ArrowUp" ? 1 : -1, fallbackYear()));
          return;
        case "Home":
        case "End":
          event.preventDefault();
          setPending(null);
          commit(endOfDateSegment(draft, segment, key === "Home" ? "start" : "end"));
          return;
        case "Backspace":
        case "Delete":
          event.preventDefault();
          setPending(null);
          commit({ ...draft, [segment]: undefined });
          return;
      }
      // A separator finishes the segment, whether or not a digit was typed in it, as in a native date field.
      if (key === separator || (key.length === 1 && /[\s/.,:-]/u.test(key))) {
        event.preventDefault();
        setPending(null);
        focusSegment(segments[index + 1]);
        return;
      }
      // A character the keyboard sent as itself. A mobile keyboard sends "Unidentified" and the text through
      // `onChange` instead, which is handled below; anything else typed is refused.
      if (key.length === 1 || key === "Process") {
        if (key === "Process") return;
        event.preventDefault();
        const next = typeText(segment, key);
        if (next !== segment) focusSegment(next);
      }
    };

    // What a keyboard that does not report keys (a phone's), an autofill or a paste inserts: the text it added.
    const onSegmentChange = (event: ChangeEvent<HTMLInputElement>, segment: DateSegment) => {
      if (disabled || readOnly) return;
      const inserted = (event.nativeEvent as InputEvent).data ?? "";
      if (!inserted) return;
      const next = typeText(segment, inserted);
      if (next !== segment) focusSegment(next);
    };

    // A press on the field's own padding or on a separator (not on a segment or a button) goes to the nearest segment,
    // as in a native date field, so the whole box is a target and the small segments are easy to hit.
    const onFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // The calendar is portaled, but React still bubbles its events here: only a press inside the field's own box counts.
      if (disabled || !event.currentTarget.contains(target) || target.closest("input, button")) return;
      event.preventDefault();
      let nearest: DateSegment = segments[0]!;
      for (const segment of segments) {
        const element = segmentRefs.current[segment];
        if (element && element.getBoundingClientRect().left <= event.clientX) nearest = segment;
      }
      focusSegment(nearest);
    };

    // The field as a whole, for `onFocus`/`onBlur`: the group and the portaled calendar are one thing, so focus moving
    // between their parts is neither arriving nor leaving.
    const group = useRef<HTMLDivElement | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const pickerButton = useRef<HTMLButtonElement | null>(null);
    const inside = useRef(false);
    const withinField = (node: EventTarget | null) =>
      node instanceof Node && (group.current?.contains(node) === true || panel.current?.contains(node) === true);

    const onGroupFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event);
    };

    const onGroupBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (withinField(event.relatedTarget)) return;
      inside.current = false;
      flush();
      onBlur?.(event);
    };

    const clear = () => {
      setPending(null);
      commit(emptyDateDraft, { now: true });
      onClear?.();
      focusSegment(segments[0]);
    };

    // A date chosen in the calendar, the months grid or a preset fills the segments at once, ends the choosing, and is
    // said aloud, since focus goes back to a button whose name doesn't change.
    const pick = (picked: string) => {
      setPending(null);
      commit(toDraft(picked), { now: true });
      setOpen(false);
      announce(labels.chosen(writeDate(picked)));
    };

    const segmentText = (segment: DateSegment): string => {
      if (pending?.segment === segment) return padSegment(pending.buffer.value, pending.buffer.count, formatNumber);
      const current = draft[segment];
      return current === undefined ? "" : padSegment(current, segmentWidth(segment), formatNumber);
    };

    const segmentSpec = (segment: DateSegment) => {
      const text = segmentText(segment);
      const { min: rangeMin, max: rangeMax } = segmentRange(draft, segment);
      const settled = pending?.segment === segment ? undefined : draft[segment];
      const spoken = segment === "month" && settled !== undefined ? calendarLabels.months[settled - 1] : undefined;
      return {
        label: labels[segment],
        min: rangeMin,
        max: rangeMax,
        now: draft[segment],
        valueText: text === "" ? labels.empty : (spoken ?? text),
        text,
      };
    };

    // Where the panel opens. Full width (a phone, usually) spans the visible screen, and goes on whichever side has room
    // once an on-screen keyboard is counted, which the floating layer doesn't know about.
    const panelId = useId();
    const room = useViewportRoom(group, fullWidth && open);
    const preferredTop = side === "top";
    const roomOnPreferred = room ? (preferredTop ? room.above : room.below) : 0;
    const roomOnOther = room ? (preferredTop ? room.below : room.above) : 0;
    const panelSide: "top" | "bottom" =
      fullWidth && room && roomOnPreferred < MIN_ROOM && roomOnOther > roomOnPreferred
        ? preferredTop
          ? "bottom"
          : "top"
        : preferredTop
          ? "top"
          : "bottom";
    const panelStyle: CSSProperties | undefined =
      fullWidth && room ? ({ "--date-picker-width": `${room.width - 2 * EDGE_GAP}px` } as CSSProperties) : undefined;

    const presetList: PresetChoice[] = (presets ?? []).map((preset) => {
      const date = typeof preset.value === "function" ? (today === undefined ? undefined : preset.value(today)) : preset.value;
      const resolved = date !== undefined ? resolveBound(date) : undefined;
      const allowed =
        resolved !== undefined &&
        !(minDate !== undefined && resolved < minDate) &&
        !(maxDate !== undefined && resolved > maxDate) &&
        !isBlocked(resolved);
      return { label: preset.label, date: resolved, allowed };
    });

    const field = (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a pointer convenience only, like clicking a <label>: a press on the box's padding is sent to the nearest segment, which is already fully keyboard-operable (each is a tab stop), so the group itself needs no role or key handling.
      <div
        {...props}
        ref={mergeRefs(ref, group)}
        role="group"
        dir={dir}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        data-testid={dataTestId}
        style={style}
        onMouseDown={(event) => {
          onFieldMouseDown(event);
          props.onMouseDown?.(event);
        }}
        onFocus={onGroupFocus}
        onBlur={onGroupBlur}
        className={cx(styles.root, sizeClass[size], invalid && styles.error, disabled && styles.disabled, className)}
      >
        <div className={styles.segments}>
          {segments.map((segment, index) => {
            const spec = segmentSpec(segment);
            return (
              <Fragment key={segment}>
                {index > 0 && (
                  <span aria-hidden="true" className={styles.separator}>
                    {separator}
                  </span>
                )}
                <input
                  ref={(element) => {
                    segmentRefs.current[segment] = element;
                  }}
                  // The id a label's `htmlFor` points at lives on the first segment.
                  id={index === 0 ? id : undefined}
                  type="text"
                  role="spinbutton"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={spec.label}
                  aria-valuemin={spec.min}
                  aria-valuemax={spec.max}
                  aria-valuenow={spec.now}
                  aria-valuetext={spec.valueText}
                  aria-invalid={invalid || undefined}
                  aria-required={required || undefined}
                  disabled={disabled}
                  readOnly={readOnly}
                  placeholder={segment === "year" ? "––––" : "––"}
                  value={spec.text}
                  className={cx(styles.segment, segment === "year" && styles.year)}
                  onKeyDown={(event) => onSegmentKeyDown(event, segment)}
                  onChange={(event) => onSegmentChange(event, segment)}
                  onFocus={(event) => event.currentTarget.select()}
                  // Only this segment's own unfinished digits: focus moving on to the next segment must not wipe the digit just carried into it.
                  onBlur={() => setPending((current) => (current?.segment === segment ? null : current))}
                />
              </Fragment>
            );
          })}
        </div>
        {showClear && (
          <button type="button" className={cx(styles.iconButton, buttonClass[size])} aria-label={labels.clear} onClick={clear}>
            <Icon icon={XIcon} size={iconSizeFor[size]} tone="default" />
          </button>
        )}
        {showPicker && (
          <button
            ref={pickerButton}
            type="button"
            className={cx(styles.iconButton, buttonClass[size])}
            aria-label={labels.openPicker}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            disabled={disabled || readOnly}
            onClick={() => {
              openedFrom.current = "button";
              setOpen(!open);
            }}
          >
            <Icon icon={CalendarBlankIcon} size={iconSizeFor[size]} tone="default" />
          </button>
        )}
        {/* A date chosen in the calendar is said here: focus goes back to a button whose name doesn't change. The region is in
            the page before its text does, so it is announced as a change. Without a calendar there is nothing to say, so no region. */}
        {showPicker && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
        {/* The value a form submits and validates. A hidden input is never validated, so this is a date input that is only
            hidden from sight (and from assistive tech, which has the segments): `required` and the custom message above
            give a surrounding form its native checks. Arriving on it, which a browser does to show its message, sends
            focus to the segment that needs attention. */}
        <input
          ref={proxy}
          type={byMonth ? "month" : "date"}
          tabIndex={-1}
          aria-hidden="true"
          className={styles.proxy}
          name={name}
          form={form}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          onChange={() => {}}
          onFocus={() => {
            const empty = segments.find((segment) => segmentText(segment) === "");
            focusSegment(empty ?? segments[0]);
          }}
        />
      </div>
    );

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>{field}</PopoverPrimitive.Anchor>
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
              className={cx(styles.panel, fullWidth && styles.fullWidth)}
              style={panelStyle}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                // Every opening starts clean: a press elsewhere that closed an earlier one says nothing about this one.
                interactedOutside.current = false;
                // Focus goes to the day (or month) Tab would land on: the chosen one, else today. Not to the panel itself.
                (event.currentTarget as HTMLElement)
                  .querySelector<HTMLElement>(byMonth ? "button[data-picker-cell][tabindex='0']" : "button[data-date][tabindex='0']")
                  ?.focus();
              }}
              onCloseAutoFocus={(event) => {
                // Radix has no trigger to hand focus back to, so it is done here: to where the panel was opened from (the
                // segment, for the keyboard shortcut; else the button), unless the person closed it by pressing somewhere
                // else, which is where their focus now is.
                event.preventDefault();
                const from = openedFrom.current;
                openedFrom.current = null;
                if (interactedOutside.current) return;
                (from && from !== "button" ? segmentRefs.current[from] : null)?.focus();
                if (!(from && from !== "button")) pickerButton.current?.focus();
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
              <DatePickerPanel
                byMonth={byMonth}
                draftValue={draftValue}
                today={today}
                todayProp={todayProp}
                minDate={minDate}
                maxDate={maxDate}
                dir={dir}
                formatNumber={formatNumber}
                calendarProps={calendarProps}
                calendarLabels={calendarLabels}
                weekStartsOn={weekStartsOn}
                showTodayButton={showTodayButton}
                isBlocked={isBlocked}
                unavailableReason={unavailableReason}
                presets={presetList}
                presetsLabel={labels.presets}
                onPick={pick}
                onClose={() => setOpen(false)}
              />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </PopoverPrimitive.Root>
    );
  },
);
DatePicker.displayName = "DatePicker";
