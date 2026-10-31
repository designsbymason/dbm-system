import { cx } from "@dbm-system/utils";
import { forwardRef, useRef } from "react";
import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";
import type { Hsva } from "../../internal/color/colorValue";
import styles from "./ColorPicker.module.css";
import type { ColorPickerLabels } from "./ColorPicker.types";
import type { ChangeKind } from "./useColorPickerValue";

interface ColorAreaProps {
  hsva: Hsva;
  labels: ColorPickerLabels;
  formatNumber: (value: number) => string;
  disabled: boolean;
  readOnly: boolean;
  onChange: (next: Hsva, kind: ChangeKind) => void;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const percent = (value: number) => Math.round(value * 100);

/**
 * The saturation and brightness area: a surface the pointer drags a thumb across, and two visually hidden native range
 * inputs under it that carry the keyboard and screen reader semantics (a 2D position has no ARIA role of its own).
 * Each input moves its own axis with the vertical or horizontal arrows alike, so either one can be used for both.
 * The area never mirrors in a right-to-left page: Left and Right always mean less and more saturation.
 */
export const ColorArea = forwardRef<HTMLInputElement, ColorAreaProps>(({ hsva, labels, formatNumber, disabled, readOnly, onChange }, saturationRef) => {
  const surface = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const latest = useRef(hsva);
  latest.current = hsva;
  const inert = disabled || readOnly;

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = surface.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    const next = { ...latest.current, s: clamp((event.clientX - box.left) / box.width), v: 1 - clamp((event.clientY - box.top) / box.height) };
    latest.current = next;
    onChange(next, "change");
  };

  const finish = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(latest.current, "commit");
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (inert || event.button !== 0) return;
    // Taking the press ourselves keeps the browser from selecting text or moving focus to the page; focus goes to the first input.
    event.preventDefault();
    (saturationRef as { current: HTMLInputElement | null } | null)?.current?.focus({ preventScroll: true });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic or already-ended pointer can't be captured; the drag then ends with the press instead.
    }
    dragging.current = true;
    move(event);
  };

  const step = (event: KeyboardEvent<HTMLInputElement>, axis: "s" | "v") => {
    const amount = (event.shiftKey ? 10 : 1) / 100;
    const current = latest.current;
    let next: Hsva | undefined;
    switch (event.key) {
      case "ArrowLeft":
        next = { ...current, s: clamp(current.s - amount) };
        break;
      case "ArrowRight":
        next = { ...current, s: clamp(current.s + amount) };
        break;
      case "ArrowUp":
        next = { ...current, v: clamp(current.v + amount) };
        break;
      case "ArrowDown":
        next = { ...current, v: clamp(current.v - amount) };
        break;
      case "PageUp":
        next = { ...current, v: clamp(current.v + 0.1) };
        break;
      case "PageDown":
        next = { ...current, v: clamp(current.v - 0.1) };
        break;
      case "Home":
        next = { ...current, [axis]: 0 };
        break;
      case "End":
        next = { ...current, [axis]: 1 };
        break;
      default:
        return;
    }
    event.preventDefault();
    if (inert) return;
    latest.current = next;
    onChange(next, "commit");
  };

  // A change that is not a key (assistive technology setting the value) arrives here.
  const set = (axis: "s" | "v") => (event: ChangeEvent<HTMLInputElement>) => {
    if (inert) return;
    const next = { ...latest.current, [axis]: clamp(Number(event.target.value) / 100) };
    latest.current = next;
    onChange(next, "commit");
  };

  const x = `${hsva.s * 100}%`;
  const y = `${(1 - hsva.v) * 100}%`;

  return (
    <div
      ref={surface}
      className={cx(styles.area, inert && styles.areaInert)}
      style={{ "--color-picker-x": x, "--color-picker-y": y } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={(event) => {
        if (dragging.current) move(event);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
    >
      <input
        ref={saturationRef}
        type="range"
        min={0}
        max={100}
        step={1}
        className={styles.areaInput}
        data-color-area-input=""
        aria-label={labels.saturation}
        aria-valuetext={labels.percentText(formatNumber(percent(hsva.s)))}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        value={percent(hsva.s)}
        onChange={set("s")}
        onKeyDown={(event) => step(event, "s")}
      />
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        className={styles.areaInput}
        aria-label={labels.brightness}
        aria-valuetext={labels.percentText(formatNumber(percent(hsva.v)))}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        value={percent(hsva.v)}
        onChange={set("v")}
        onKeyDown={(event) => step(event, "v")}
      />
      <span className={styles.areaThumb} aria-hidden="true" />
    </div>
  );
});
ColorArea.displayName = "ColorArea";
