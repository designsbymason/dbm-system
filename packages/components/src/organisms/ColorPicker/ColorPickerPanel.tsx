import { CheckIcon, CopyIcon, EyedropperIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useId, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import { IconButton } from "../../atoms/IconButton";
import { Input } from "../../atoms/Input";
import { Tooltip } from "../../atoms/Tooltip";
import { ToggleGroup } from "../../molecules/ToggleGroup";
import { channelSpecs, formatColor, fromChannels, hsvaToRgb, parseColor, rgbToHsva, toChannels } from "../../internal/color/colorValue";
import type { ChannelSpace, Hsva, Rgba } from "../../internal/color/colorValue";
import { subscribeToNothing } from "../../molecules/Calendar/calendarHelpers";
import { ColorArea } from "./ColorArea";
import styles from "./ColorPicker.module.css";
import type { ColorPickerChannel, ColorPickerFormat, ColorPickerLabels } from "./ColorPicker.types";
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
  recent: SwatchChoice[];
  noneSwatch: boolean;
  copyButton: boolean;
  copied: boolean;
  /** The space the channel fields edit (`"hex"` is one field for the whole code); `undefined` draws none. */
  channelSpace: ChannelSpace | "hex" | undefined;
  labels: ColorPickerLabels;
  formatNumber: (value: number) => string;
  /** The chosen format while the switch is shown; `undefined` draws no switch. */
  format: ColorPickerFormat | undefined;
  onFormatChange: (format: ColorPickerFormat) => void;
  dir: "ltr" | "rtl";
  disabled: boolean;
  readOnly: boolean;
  onChange: (next: Hsva, kind: ChangeKind) => void;
  onPickSwatch: (swatch: SwatchChoice) => void;
  onPickNone: () => void;
  onCopy: () => void;
  onPickFromScreen: (hex: string) => void;
}

interface EyeDropperLike {
  open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
}

const FORMATS: ColorPickerFormat[] = ["hex", "rgb", "hsl", "oklch"];

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
 * Arrow keys move between swatches by where they are drawn, so a wrapped row works: left and right to the neighbour in the reading
 * direction, up and down to the nearest swatch in the row above or below.
 */
function moveSwatchFocus(event: KeyboardEvent<HTMLElement>, buttons: HTMLButtonElement[], dir: "ltr" | "rtl") {
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
}

interface RecentRowProps {
  colors: SwatchChoice[];
  isChosen: (swatch: SwatchChoice) => boolean;
  labels: ColorPickerLabels;
  dir: "ltr" | "rtl";
  disabled: boolean;
  onPick: (swatch: SwatchChoice) => void;
}

/** The colors most recently chosen, newest first: a captioned group of swatch buttons, one tab stop, with the swatch row's keys. */
function RecentRow({ colors, isChosen, labels, dir, disabled, onPick }: RecentRowProps) {
  const captionId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(0);
  const chosen = colors.findIndex(isChosen);
  const stop = chosen >= 0 ? chosen : Math.min(active, colors.length - 1);
  return (
    <div className={styles.recent}>
      <span id={captionId} className={styles.recentCaption}>
        {labels.recent}
      </span>
      {/* The keys are handled on the group, for the buttons inside it, which are the focusable parts. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a roving-focus group of native buttons: the keys belong to the group, the controls are the buttons. */}
      <div
        role="group"
        aria-labelledby={captionId}
        className={styles.swatches}
        onKeyDown={(event) => moveSwatchFocus(event, refs.current.filter((button): button is HTMLButtonElement => button !== null), dir)}
      >
        {colors.map((swatch, index) => (
          <Tooltip key={`${swatch.css}-${index}`} content={swatch.label}>
            <button
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              className={styles.swatch}
              style={{ "--color-picker-swatch": swatch.css } as React.CSSProperties}
              aria-label={swatch.label}
              aria-pressed={isChosen(swatch)}
              tabIndex={index === stop ? 0 : -1}
              disabled={disabled}
              onFocus={() => setActive(index)}
              onClick={() => onPick(swatch)}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

/**
 * A channel field's accessible name holds the letter drawn under it as a whole word ("R, Red"): a person who says the visible
 * text to a speech control, or reads it, finds the same word in the name. A name that already holds it ("Hex code" for "Hex") is used as is.
 */
const channelFieldName = (letter: string, name: string): string =>
  name.toLowerCase().split(/[^\p{L}\p{N}]+/u).includes(letter.toLowerCase()) ? name : `${letter}, ${name}`;

interface ChannelInputsProps {
  hsva: Hsva;
  space: ChannelSpace | "hex";
  alpha: boolean;
  labels: ColorPickerLabels;
  formatNumber: (value: number) => string;
  disabled: boolean;
  readOnly: boolean;
  onChange: (next: Hsva, kind: ChangeKind) => void;
}

/**
 * A number field for each channel of the format, and opacity. A field shows what is being typed until it loses focus, and applies
 * a number as soon as it is in range. The fields are detached from any surrounding `<form>` (a `form` id that matches nothing), so a
 * half-typed number never blocks a submit; the value a form sends is the picker's own.
 */
function ChannelInputs({ hsva, space, alpha, labels, disabled, readOnly, onChange }: ChannelInputsProps) {
  const [draft, setDraft] = useState<{ id: ColorPickerChannel; text: string } | null>(null);

  if (space === "hex") {
    // One field for the whole code, opacity inside it (`#rrggbbaa`) with `alpha`. It takes any hex spelling (three, four, six or eight
    // digits, with or without `#`) and applies it as soon as it is a whole one.
    const written = formatColor(hsvaToRgb(hsva), "hex", alpha);
    return (
      <div className={styles.channels}>
        <div className={styles.channel}>
          <Input
            type="text"
            size="xs"
            form=""
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label={channelFieldName(labels.channelLetter("hex"), labels.channelName("hex"))}
            disabled={disabled}
            readOnly={readOnly}
            value={draft?.id === "hex" ? draft.text : written}
            onChange={(event) => {
              const text = event.target.value;
              setDraft({ id: "hex", text });
              if (!/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text.trim())) return;
              const color = parseColor(text);
              if (color) onChange(rgbToHsva(alpha ? color : { ...color, a: 1 }, hsva.h), "commit");
            }}
            onBlur={() => setDraft(null)}
          />
          <span className={styles.channelLetter} aria-hidden="true">
            {labels.channelLetter("hex")}
          </span>
        </div>
      </div>
    );
  }

  const specs = channelSpecs[space];
  const values = toChannels(hsvaToRgb(hsva), space);

  const apply = (id: ColorPickerChannel, text: string) => {
    setDraft({ id, text });
    const number = Number(text);
    if (text.trim() === "" || !Number.isFinite(number)) return;
    if (id === "a") {
      onChange({ ...hsva, a: Math.min(100, Math.max(0, number)) / 100 }, "commit");
      return;
    }
    const index = specs.findIndex((spec) => spec.id === id);
    const channels = values.slice();
    channels[index] = number;
    const rgb = fromChannels(space, channels, hsva.a);
    const next = rgbToHsva(rgb, hsva.h);
    // A hue typed into HSL is the picker's hue as well, even where the color is a gray that has none of its own.
    if (space === "hsl" && id === "h") next.h = Math.min(360, Math.max(0, number));
    onChange(next, "commit");
  };

  const fields: Array<{ id: ColorPickerChannel; value: number; step: number }> = [
    ...specs.map((spec, index) => ({ id: spec.id as ColorPickerChannel, value: values[index] as number, step: spec.step })),
    ...(alpha ? [{ id: "a" as const, value: Math.round(hsva.a * 100), step: 1 }] : []),
  ];

  return (
    <div className={styles.channels}>
      {fields.map(({ id, value, step }) => (
        <div key={id} className={styles.channel}>
          <Input
            type="number"
            size="xs"
            step={step}
            form=""
            aria-label={channelFieldName(labels.channelLetter(id), labels.channelName(id))}
            disabled={disabled}
            readOnly={readOnly}
            value={draft?.id === id ? draft.text : String(value)}
            onChange={(event) => apply(id, event.target.value)}
            onBlur={() => setDraft(null)}
          />
          <span className={styles.channelLetter} aria-hidden="true">
            {labels.channelLetter(id)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * What is inside the panel: the saturation and brightness area, a hue slider, an opacity slider when `alpha` is on, the list of
 * swatches and the eyedropper. The sliders are the Radix primitive drawn with this component's own track and thumb; their
 * gradients and thumb colors are colors the person chose, so they are written from the color rather than from tokens.
 */
export const ColorPickerPanel = forwardRef<HTMLInputElement, ColorPickerPanelProps>(
  ({ hsva, hasValue, alpha, swatches, recent, eyeDropper, noneSwatch, copyButton, copied, channelSpace, labels, formatNumber, format, onFormatChange, dir, disabled, readOnly, onChange, onPickSwatch, onPickNone, onCopy, onPickFromScreen }, areaRef) => {
    const inert = disabled || readOnly;
    // Only known in the browser: the server snapshot says no, so a server render and the first client render agree.
    const supported = useSyncExternalStore(subscribeToNothing, hasEyeDropper, () => false);
    const canDropper = eyeDropper && supported;

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
    // The "no color" swatch, when drawn, is the first button; the swatches follow it.
    const offset = noneSwatch ? 1 : 0;
    const count = swatches.length + offset;
    const chosen = swatches.findIndex(selected);
    const found = !hasValue && noneSwatch ? 0 : chosen >= 0 ? chosen + offset : -1;
    const stop = found >= 0 ? found : Math.min(activeSwatch, Math.max(count - 1, 0));

    const onSwatchKeyDown = (event: KeyboardEvent<HTMLDivElement>) =>
      moveSwatchFocus(event, swatchRefs.current.filter((button): button is HTMLButtonElement => button !== null), dir);

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
        {format !== undefined && (
          <ToggleGroup
            type="single"
            size="xs"
            variant="subtle"
            fullWidth
            dir={dir}
            aria-label={labels.formatSwitch}
            disabled={inert}
            value={format}
            onValueChange={(next) => {
              // Pressing the chosen one would clear a single group's choice; a format is always chosen.
              if (next !== "") onFormatChange(next as ColorPickerFormat);
            }}
          >
            {FORMATS.map((name) => (
              <ToggleGroup.Item key={name} value={name}>
                {labels.formatName(name)}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        )}
        {channelSpace !== undefined && (
          <ChannelInputs
            hsva={hsva}
            space={channelSpace}
            alpha={alpha}
            labels={labels}
            formatNumber={formatNumber}
            disabled={disabled}
            readOnly={readOnly}
            onChange={onChange}
          />
        )}
        {(count > 0 || canDropper || copyButton) && (
          <div className={styles.extras}>
            {count > 0 && (
              // The arrow keys are handled on the group, for the buttons inside it, which are the focusable parts.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a roving-focus group of native buttons: the keys belong to the group, the controls are the buttons.
              <div role="group" aria-label={labels.swatches} className={styles.swatches} onKeyDown={onSwatchKeyDown}>
                {noneSwatch && (
                  <Tooltip content={labels.none}>
                    <button
                      ref={(element) => {
                        swatchRefs.current[0] = element;
                      }}
                      type="button"
                      className={cx(styles.swatch, styles.swatchNone)}
                      aria-label={labels.none}
                      aria-pressed={!hasValue}
                      tabIndex={stop === 0 ? 0 : -1}
                      disabled={inert}
                      onFocus={() => setActiveSwatch(0)}
                      onClick={onPickNone}
                    />
                  </Tooltip>
                )}
                {swatches.map((swatch, index) => (
                  <Tooltip key={`${swatch.css}-${index}`} content={swatch.label}>
                    <button
                      ref={(element) => {
                        swatchRefs.current[index + offset] = element;
                      }}
                      type="button"
                      className={styles.swatch}
                      style={{ "--color-picker-swatch": swatch.css } as React.CSSProperties}
                      aria-label={swatch.label}
                      aria-pressed={selected(swatch)}
                      tabIndex={index + offset === stop ? 0 : -1}
                      disabled={inert}
                      onFocus={() => setActiveSwatch(index + offset)}
                      onClick={() => onPickSwatch(swatch)}
                    />
                  </Tooltip>
                ))}
              </div>
            )}
            {(canDropper || copyButton) && (
              <div className={styles.tools}>
                {copyButton && (
                  <IconButton
                    icon={copied ? CheckIcon : CopyIcon}
                    aria-label={labels.copy}
                    variant="ghost"
                    tone="neutral"
                    size="sm"
                    disabled={disabled || !hasValue}
                    onClick={onCopy}
                  />
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
        )}
        {recent.length > 0 && <RecentRow colors={recent} isChosen={selected} labels={labels} dir={dir} disabled={inert} onPick={onPickSwatch} />}
      </div>
    );
  },
);
ColorPickerPanel.displayName = "ColorPickerPanel";
