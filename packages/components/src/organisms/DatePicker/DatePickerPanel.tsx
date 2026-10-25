import { cx } from "@dbm-system/utils";
import { useState } from "react";
import type { MouseEvent } from "react";
import { Button } from "../../atoms/Button";
import { formatDate, formatMonth, parseDate, parseMonth } from "../../internal/date/dateValue";
import { Calendar } from "../../molecules/Calendar";
import type { CalendarDayInfo, CalendarLabels, CalendarSize } from "../../molecules/Calendar";
import calendarStyles from "../../molecules/Calendar/Calendar.module.css";
import { CalendarPicker } from "../../molecules/Calendar/CalendarPicker";
import { utcMonth } from "../../molecules/Calendar/calendarHelpers";
import styles from "./DatePicker.module.css";
import type { DatePickerCalendarProps } from "./DatePicker.types";
import { reasonOf } from "./datePickerReason";

// The calendar's own size classes, for the grid of months drawn in the calendar's place when only a month is chosen.
const calendarSizeClass: Record<CalendarSize, string | undefined> = {
  xs: calendarStyles.sizeXs,
  sm: calendarStyles.sizeSm,
  md: calendarStyles.sizeMd,
  lg: calendarStyles.sizeLg,
  xl: calendarStyles.sizeXl,
};

/** One quick choice, with its date worked out and whether the field would allow it. */
export interface PresetChoice {
  label: string;
  date: string | undefined;
  allowed: boolean;
}

export interface DatePickerPanelProps {
  /** Choosing a month, not a day: the calendar's grid of months is drawn instead of its days. */
  byMonth: boolean;
  /** The date the field holds as `"YYYY-MM-DD"` (`"YYYY-MM"` by month), or `""`. */
  draftValue: string;
  /** Today as `"YYYY-MM-DD"`, once it is known. */
  today: string | undefined;
  /** The `today` prop as given, for the calendar's own marking of today. */
  todayProp: string | undefined;
  minDate: string | undefined;
  maxDate: string | undefined;
  dir: "ltr" | "rtl" | undefined;
  formatNumber: (value: number) => string;
  calendarProps: DatePickerCalendarProps | undefined;
  /** The calendar's labels in force, with the month names (and the base of a day's name). */
  calendarLabels: CalendarLabels;
  weekStartsOn: DatePickerPanelWeekStart;
  showTodayButton: boolean | undefined;
  /** Draws the days and the month buttons round. */
  rounded: boolean;
  /** Whether a date is ruled out, by `isDateDisabled` or a reason. */
  isBlocked: (date: string) => boolean;
  unavailableReason: ((date: string) => string | null | undefined | false) | undefined;
  presets: readonly PresetChoice[];
  /** The name of the group of preset buttons. */
  presetsLabel: string;
  /** A date has been chosen (in the calendar, the grid of months or a preset). */
  onPick: (date: string) => void;
  /** The panel should be closed without a choice. */
  onClose: () => void;
}

type DatePickerPanelWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;

/**
 * What is inside the floating panel: the calendar (or, by month, its grid of months), a line saying why the day under
 * the pointer or focus can't be chosen, and the quick choices. It mounts with the panel, so what it remembers (the
 * reason on show) begins afresh each time the panel opens.
 */
export function DatePickerPanel({
  byMonth,
  draftValue,
  today,
  todayProp,
  minDate,
  maxDate,
  dir,
  formatNumber,
  calendarProps,
  calendarLabels,
  weekStartsOn,
  showTodayButton,
  rounded,
  isBlocked,
  unavailableReason,
  presets,
  presetsLabel,
  onPick,
  onClose,
}: DatePickerPanelProps) {
  const calendarSize: CalendarSize = calendarProps?.size ?? "md";

  // Why the day under the pointer or focus is unavailable, drawn under the calendar (the day's own name carries it too).
  // Anything else under the pointer or focus (an arrow, a preset) shows no reason.
  const [hint, setHint] = useState("");
  const hintFrom = (target: EventTarget) => {
    if (!unavailableReason || !(target instanceof Element)) return;
    const control = target.closest<HTMLElement>("button");
    if (!control) return;
    const date = control.dataset.date;
    setHint(date === undefined ? "" : reasonOf(unavailableReason, date));
  };

  // A press on the day that is already chosen is not a change, so the calendar says nothing about it; it is still a
  // choice, and ends the choosing as any other does.
  const chooseAgain = (event: MouseEvent<HTMLElement>) => {
    if (byMonth || !(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>("button[data-date]");
    if (!control || control.dataset.date !== draftValue) return;
    if (control.closest("td")?.getAttribute("aria-disabled") === "true") return;
    onPick(draftValue);
  };

  const dayName = (info: CalendarDayInfo): string => {
    const base = (calendarProps?.labels?.day ?? calendarLabels.day)(info);
    const reason = unavailableReason ? reasonOf(unavailableReason, formatDate({ year: info.year, month: info.month, day: info.day })) : "";
    return reason ? `${base}, ${reason}` : base;
  };

  const shown = parseDate(draftValue) ?? parseMonth(draftValue.slice(0, 7)) ?? parseMonth((today ?? "").slice(0, 7)) ?? parseMonth(utcMonth());

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- listens for what already happens inside it (a press, focus or the pointer reaching a day), to show a reason and to treat a press on the chosen day as a choice; every control inside is a real button, whose Enter and Space already arrive here as a click.
    <div
      className={styles.panelBody}
      onClick={chooseAgain}
      onFocusCapture={(event) => hintFrom(event.target)}
      onMouseOverCapture={(event) => hintFrom(event.target)}
    >
      {byMonth ? (
        <div className={cx(calendarStyles.root, calendarSizeClass[calendarSize], rounded && calendarStyles.rounded)}>
          <CalendarPicker
            shown={shown ?? { year: 1, month: 1 }}
            today={today}
            min={minDate ? `${minDate}-01` : ""}
            max={maxDate ? `${maxDate}-01` : ""}
            size={calendarSize}
            rounded={rounded}
            disabled={false}
            dir={dir ?? "ltr"}
            labels={calendarLabels}
            formatNumber={formatNumber}
            say={() => undefined}
            onChoose={(year, month) => onPick(formatMonth(year, month))}
            onClose={onClose}
          />
        </div>
      ) : (
        <Calendar
          {...calendarProps}
          size={calendarSize}
          value={draftValue}
          onValueChange={onPick}
          min={minDate}
          max={maxDate}
          isDateDisabled={isBlocked}
          weekStartsOn={weekStartsOn}
          showTodayButton={showTodayButton}
          rounded={rounded}
          today={todayProp}
          dir={dir}
          formatNumber={formatNumber}
          labels={{ ...calendarProps?.labels, day: dayName }}
        />
      )}
      {unavailableReason && !byMonth && (
        <div aria-hidden="true" className={styles.hint}>
          {hint}
        </div>
      )}
      {presets.length > 0 && (
        <div role="group" aria-label={presetsLabel} className={styles.presets}>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="tertiary"
              size="xs"
              disabled={!preset.allowed}
              onClick={() => preset.date !== undefined && onPick(preset.date)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
