import { EyedropperIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { IconButton } from "../../atoms/IconButton";
import { formatColor, hsvaToRgb } from "../../internal/color/colorValue";
import type { Hsva, Rgba } from "../../internal/color/colorValue";
import { ColorArea } from "./ColorArea";
import styles from "./ColorPicker.module.css";
import type { ColorPickerLabels } from "./ColorPicker.types";
import type { ChangeKind } from "./useColorPickerValue";

/** A swatch that has been read: its color, how it is named and the CSS the chip is painted with. */
export interface SwatchChoice {
  label: string;
  color: Rgba;
  css: string;
}

interface ColorPickerPanelProps {
  hsva: Hsva;
  hasValue: boolean;
  alpha: boolean;
  swatches: SwatchChoice[];
  eyeDropper: boolean;
  labels: ColorPickerLabels;
  formatNumber: (value: number) => string;
  dir: "ltr" | "rtl";
  disabled: boolean;
  readOnly: boolean;
  onChange: (next: Hsva, kind: ChangeKind) => void;
  onPickSwatch: (swatch: SwatchChoice) => void;
  onPickFromScreen: (hex: string) => void;
}

interface EyeDropperLike {
  open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
}

const hasEyeDropper = () => typeof window !== "undefined" && "EyeDropper" in window;

/** The sliders' position, as the thumb colors and track gradients read it, written as custom properties on the panel. */
function colorVariables(hsva: Hsva): React.CSSProperties {
  const rgb = hsvaToRgb({ ...hsva, a: 1 });
  return {
    "--color-picker-hue": String(Math.round(hsva.h * 100) / 100),
    "--color-picker-opaque": formatColor(rgb, "rgb", false),
    "--color-picker-rgb": `${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)}`,
    "--color-picker-alpha": String(hsva.a),
  } as React.CSSProperties;
}

/**
 * What is inside the panel: the saturation and brightness area, a hue slider, an opacity slider when `alpha` is on, the list of
 * swatches and the eyedropper. The sliders are the Radix primitive drawn with this component's own track and thumb; their
 * gradients and thumb colors are colors the person chose, so they are written from the color rather than from tokens.
 */
export const ColorPickerPanel = forwardRef<HTMLInputElement, ColorPickerPanelProps>(
  ({ hsva, hasValue, alpha, swatches, eyeDropper, labels, formatNumber, dir, disabled, readOnly, onChange, onPickSwatch, onPickFromScreen }, areaRef) => {
    const inert = disabled || readOnly;
    const [canDropper, setCanDropper] = useState(false);
    useEffect(() => {
      // Only known in the browser, after hydration, so a server render and the first client render agree.
      setCanDropper(eyeDropper && hasEyeDropper());
    }, [eyeDropper]);

    const pickFromScreen = async () => {
      const Dropper = (window as unknown as { EyeDropper: new () => EyeDropperLike }).EyeDropper;
      try {
        const { sRGBHex } = await new Dropper().open();
        onPickFromScreen(sRGBHex);
      } catch (error) {
        // Pressing Escape while picking rejects with an AbortError; that is the person cancelling, not a failure.
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      }
    };

    const [activeSwatch, setActiveSwatch] = useState(0);
    const swatchRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = (swatch: SwatchChoice) => {
      if (!hasValue) return false;
      const own = hsvaToRgb(hsva);
      return (
        Math.round(own.r) === Math.round(swatch.color.r) &&
        Math.round(own.g) === Math.round(swatch.color.g) &&
        Math.round(own.b) === Math.round(swatch.color.b) &&
        (!alpha || Math.abs(own.a - swatch.color.a) < 0.005)
      );
    };
    const selectedIndex = swatches.findIndex(selected);
    const stop = selectedIndex >= 0 ? selectedIndex : Math.min(activeSwatch, Math.max(swatches.length - 1, 0));

    // Arrow keys move between swatches by where they are drawn, so a wrapped row works: left and right to the neighbour in
    // the reading direction, up and down to the nearest swatch in the row above or below.
    const onSwatchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const buttons = swatchRefs.current.filter((button): button is HTMLButtonElement => button !== null);
      const from = buttons.findIndex((button) => button === document.activeElement);
      if (from < 0) return;
      const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      let target: HTMLButtonElement | undefined;
      if (event.key === forward) target = buttons[Math.min(from + 1, buttons.length - 1)];
      else if (event.key === back) target = buttons[Math.max(from - 1, 0)];
      else if (event.key === "Home") target = buttons[0];
      else if (event.key === "End") target = buttons[buttons.length - 1];
      else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const here = (buttons[from] as HTMLButtonElement).getBoundingClientRect();
        const down = event.key === "ArrowDown";
        let best: { button: HTMLButtonElement; score: number } | undefined;
        for (const button of buttons) {
          const box = button.getBoundingClientRect();
          if (down ? box.top <= here.top + 1 : box.top >= here.top - 1) continue;
          const score = Math.abs(box.top - here.top) * 1000 + Math.abs(box.left - here.left);
          if (!best || score < best.score) best = { button, score };
        }
        target = best?.button;
      } else return;
      event.preventDefault();
      target?.focus();
    };

    const thumbLabel = (name: string, text: string) => ({ "aria-label": name, "aria-valuetext": text });

    return (
      <div className={styles.panelBody} style={colorVariables(hsva)}>
        <ColorArea
          ref={areaRef}
          hsva={hsva}
          labels={labels}
          formatNumber={formatNumber}
          disabled={disabled}
          readOnly={readOnly}
          onChange={onChange}
        />
        <SliderPrimitive.Root
          className={cx(styles.slider, dir === "rtl" && styles.sliderRtl)}
          min={0}
          max={360}
          step={1}
          dir={dir}
          disabled={disabled || readOnly}
          value={[Math.round(hsva.h)]}
          onValueChange={([hue]) => onChange({ ...hsva, h: hue ?? hsva.h }, "change")}
          onValueCommit={([hue]) => onChange({ ...hsva, h: hue ?? hsva.h }, "commit")}
        >
          <SliderPrimitive.Track className={cx(styles.track, styles.hueTrack)} />
          <SliderPrimitive.Thumb className={cx(styles.sliderThumb, styles.hueThumb)} {...thumbLabel(labels.hue, labels.hueText(formatNumber(Math.round(hsva.h))))} />
        </SliderPrimitive.Root>
        {alpha && (
          <SliderPrimitive.Root
            className={cx(styles.slider, dir === "rtl" && styles.sliderRtl)}
            min={0}
            max={100}
            step={1}
            dir={dir}
            disabled={disabled || readOnly}
            value={[Math.round(hsva.a * 100)]}
            onValueChange={([opacity]) => onChange({ ...hsva, a: (opacity ?? 0) / 100 }, "change")}
            onValueCommit={([opacity]) => onChange({ ...hsva, a: (opacity ?? 0) / 100 }, "commit")}
          >
            <SliderPrimitive.Track className={cx(styles.track, styles.alphaTrack)} />
            <SliderPrimitive.Thumb className={cx(styles.sliderThumb, styles.alphaThumb)} {...thumbLabel(labels.alpha, labels.percentText(formatNumber(Math.round(hsva.a * 100))))} />
          </SliderPrimitive.Root>
        )}
        {(swatches.length > 0 || canDropper) && (
          <div className={styles.extras}>
            {swatches.length > 0 && (
              // The arrow keys are handled on the group, for the buttons inside it, which are the focusable parts.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a roving-focus group of native buttons: the keys belong to the group, the controls are the buttons.
              <div role="group" aria-label={labels.swatches} className={styles.swatches} onKeyDown={onSwatchKeyDown}>
                {swatches.map((swatch, index) => (
                  <button
                    key={`${swatch.css}-${index}`}
                    ref={(element) => {
                      swatchRefs.current[index] = element;
                    }}
                    type="button"
                    className={styles.swatch}
                    style={{ "--color-picker-swatch": swatch.css } as React.CSSProperties}
                    aria-label={swatch.label}
                    aria-pressed={selected(swatch)}
                    title={swatch.label}
                    tabIndex={index === stop ? 0 : -1}
                    disabled={inert}
                    onFocus={() => setActiveSwatch(index)}
                    onClick={() => onPickSwatch(swatch)}
                  />
                ))}
              </div>
            )}
            {canDropper && (
              <IconButton
                icon={EyedropperIcon}
                aria-label={labels.eyeDropper}
                variant="ghost"
                tone="neutral"
                size="sm"
                disabled={inert}
                onClick={() => void pickFromScreen()}
              />
            )}
          </div>
        )}
      </div>
    );
  },
);
ColorPickerPanel.displayName = "ColorPickerPanel";
