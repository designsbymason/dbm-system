import { useState } from "react";
import { Button } from "../../atoms/Button";
import { formatDate } from "../../internal/date/dateValue";
import { Calendar } from "../../molecules/Calendar";
import type { CalendarDayInfo, CalendarLabels, CalendarSize } from "../../molecules/Calendar";
import datePickerStyles from "../DatePicker/DatePicker.module.css";
import { reasonOf } from "../DatePicker/datePickerReason";
import type { DateRangePickerCalendarProps, DateRangeValue } from "./DateRangePicker.types";

/** One quick choice, with its range worked out and whether the pair would allow it. */
export interface RangePresetChoice {
  label: string;
  range: DateRangeValue | undefined;
  allowed: boolean;
}

export interface DateRangePickerPanelProps {
  /** The range the calendar shows: `[start, ""]` while the end is the next choice. */
  value: DateRangeValue;
  minDate: string | undefined;
  maxDate: string | undefined;
  todayProp: string | undefined;
  dir: "ltr" | "rtl" | undefined;
  formatNumber: (value: number) => string;
  numberOfMonths: number;
  minRangeDays: number;
  maxRangeDays: number | undefined;
  rangeSpansUnavailable: boolean;
  calendarProps: DateRangePickerCalendarProps | undefined;
  /** The calendar's labels in force, for the base of a day's name. */
  calendarLabels: CalendarLabels;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /** Whether a date is ruled out, by `isDateDisabled` or a reason. */
  isBlocked: (date: string) => boolean;
  unavailableReason: ((date: string) => string | null | undefined | false) | undefined;
  presets: readonly RangePresetChoice[];
  presetsLabel: string;
  /** A date has been chosen in the calendar: the range so far. */
  onChoose: (range: [start: string, end: string]) => void;
  /** A preset has been pressed. */
  onPreset: (range: DateRangeValue) => void;
}

/**
 * What is inside the floating panel: the range calendar, a line saying why the day under the pointer or focus can't be
 * chosen, and the quick choices. It mounts with the panel, so what it remembers (the reason on show) begins afresh each
 * time the panel opens.
 */
export function DateRangePickerPanel({
  value,
  minDate,
  maxDate,
  todayProp,
  dir,
  formatNumber,
  numberOfMonths,
  minRangeDays,
  maxRangeDays,
  rangeSpansUnavailable,
  calendarProps,
  calendarLabels,
  weekStartsOn,
  isBlocked,
  unavailableReason,
  presets,
  presetsLabel,
  onChoose,
  onPreset,
}: DateRangePickerPanelProps) {
  const calendarSize: CalendarSize = calendarProps?.size ?? "md";

  // Why the day under the pointer or focus is unavailable, drawn under the calendar (the day's own name carries it too).
  const [hint, setHint] = useState("");
  const hintFrom = (target: EventTarget) => {
    if (!unavailableReason || !(target instanceof Element)) return;
    const control = target.closest<HTMLElement>("button");
    if (!control) return;
    const date = control.dataset.date;
    setHint(date === undefined ? "" : reasonOf(unavailableReason, date));
  };

  const dayName = (info: CalendarDayInfo): string => {
    const base = (calendarProps?.labels?.day ?? calendarLabels.day)(info);
    const reason = unavailableReason ? reasonOf(unavailableReason, formatDate({ year: info.year, month: info.month, day: info.day })) : "";
    return reason ? `${base}, ${reason}` : base;
  };

  return (
    <div className={datePickerStyles.panelBody} onFocusCapture={(event) => hintFrom(event.target)} onMouseOverCapture={(event) => hintFrom(event.target)}>
      <Calendar
        {...calendarProps}
        mode="range"
        size={calendarSize}
        value={value}
        onValueChange={onChoose}
        min={minDate}
        max={maxDate}
        isDateDisabled={isBlocked}
        weekStartsOn={weekStartsOn}
        today={todayProp}
        dir={dir}
        formatNumber={formatNumber}
        numberOfMonths={numberOfMonths}
        minRangeDays={minRangeDays}
        maxRangeDays={maxRangeDays}
        rangeSpansUnavailable={rangeSpansUnavailable}
        labels={{ ...calendarProps?.labels, day: dayName }}
      />
      {unavailableReason && (
        <div aria-hidden="true" className={datePickerStyles.hint}>
          {hint}
        </div>
      )}
      {presets.length > 0 && (
        <div role="group" aria-label={presetsLabel} className={datePickerStyles.presets}>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="tertiary"
              size="xs"
              disabled={!preset.allowed}
              onClick={() => preset.range !== undefined && onPreset(preset.range)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
