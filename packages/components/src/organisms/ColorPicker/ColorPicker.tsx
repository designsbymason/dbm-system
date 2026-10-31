import { XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { formatColor, hsvaToRgb, normalizeColor, parseColor } from "../../internal/color/colorValue";
import { useViewportRoom } from "../../internal/useViewportRoom";
import styles from "./ColorPicker.module.css";
import type { ColorPickerLabels, ColorPickerProps, ColorPickerSize } from "./ColorPicker.types";
import { ColorPickerPanel } from "./ColorPickerPanel";
import type { SwatchChoice } from "./ColorPickerPanel";
import { useColorPickerValue } from "./useColorPickerValue";

const defaultLabels: ColorPickerLabels = {
  value: "Color value",
  openPicker: "Choose color",
  pickerName: "Choose a color",
  clear: "Clear color",
  saturation: "Saturation",
  brightness: "Brightness",
  hue: "Hue",
  alpha: "Opacity",
  swatches: "Swatches",
  eyeDropper: "Pick a color from the screen",
  none: "No color",
  invalid: "Enter a color, such as #5548a4",
  hueText: (degrees) => `${degrees} degrees`,
  percentText: (percent) => `${percent}%`,
  chosen: (color) => `Color chosen: ${color}`,
  cleared: "Color cleared",
  channelName: (channel) => ({ r: "Red", g: "Green", b: "Blue", h: "Hue", s: "Saturation", l: "Lightness", c: "Chroma", a: "Opacity", hex: "Hex code" })[channel],
  channelLetter: (channel) => (channel === "hex" ? "Hex" : channel.toUpperCase()),
  copy: "Copy color",
  copied: "Color copied",
  copyFailed: "Could not copy the color",
  formatSwitch: "Color format",
  formatName: (format) => (format === "hex" ? "Hex" : format.toUpperCase()),
};

const sizeClass: Record<ColorPickerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const buttonClass: Record<ColorPickerSize, string | undefined> = {
  xs: styles.buttonXs,
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
  xl: styles.buttonXl,
};

const iconSizeFor: Record<ColorPickerSize, "xs" | "sm" | "md" | "lg" | "xl"> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };

/** Gap between the field and the floating panel, and from the panel to the screen's edge. */
const SIDE_OFFSET = 4;
const EDGE_GAP = 8;
/** The least room (px) a full-width panel needs on its preferred side before it moves to the other. */
const MIN_ROOM = 360;

/**
 * A field for choosing a color: a swatch button that opens a panel, and a text entry that shows the color as text and takes
 * a typed or pasted one. The panel holds an area for saturation and brightness, a hue slider, an opacity slider (`alpha`),
 * a list of `swatches` and an eyedropper where the browser has one. The value is a string in `format`
 * (`"#5548a4"`), `""` for no color. Dragging reports every step through `onValueChange` and the settled color through
 * `onValueCommit`; typed text is read in any CSS spelling and committed with Enter or by leaving the field.
 *
 * `onFocus`/`onBlur` fire for the field as a whole, `name` and `required` give a surrounding form real checks, `inline`
 * draws the panel in place, and `presentation` makes it span the screen on a phone.
 *
 * @example
 * ```tsx
 * <ColorPicker aria-label="Brand color" defaultValue="#5548a4" swatches={["#5548a4", "#2e8a7d"]} onValueCommit={save} />
 * ```
 */
export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      size = "md",
      hasError = false,
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      format: formatProp,
      defaultFormat = "hex",
      onFormatChange,
      showFormatSwitch = false,
      showChannelInputs = false,
      noneSwatch = false,
      copyButton = false,
      controllerRef,
      alpha = false,
      swatches: swatchProp,
      eyeDropper = false,
      commitOn = "change",
      clearable = false,
      onClear,
      name,
      form,
      required = false,
      disabled = false,
      readOnly = false,
      inline = false,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      side = "bottom",
      align = "start",
      presentation = "anchored",
      container,
      autoFocus = false,
      dir,
      labels: labelOverrides,
      formatNumber = String,
      onFocus,
      onBlur,
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
    const direction = dir === "rtl" ? "rtl" : "ltr";
    const [heldFormat, setHeldFormat] = useState(defaultFormat);
    const format = formatProp ?? heldFormat;
    const { text, hsva, setHsva, setText, clear } = useColorPickerValue({
      value,
      defaultValue,
      format,
      alpha,
      commitOn,
      onValueChange,
      onValueCommit,
    });
    const hasValue = text !== "";

    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly && !inline;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    const fullWidth = useResolvedResponsiveValue(presentation, "anchored") === "full-width";

    const swatches: SwatchChoice[] = [];
    const rejected: string[] = [];
    for (const entry of swatchProp ?? []) {
      const source = typeof entry === "string" ? entry : entry.value;
      const color = parseColor(source);
      if (!color) {
        rejected.push(source);
        continue;
      }
      const written = formatColor(color, format, alpha);
      swatches.push({
        label: typeof entry === "string" ? written : (entry.label ?? written),
        color,
        css: formatColor(color, "rgb", true),
      });
    }

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (value !== undefined && value !== "" && normalizeColor(value, format, alpha) === undefined) {
        console.warn(`ColorPicker: \`value\` ${JSON.stringify(value)} is not a color (use "#rrggbb", rgb(), hsl() or oklch()); treating it as empty.`);
      }
      if (rejected.length > 0) {
        console.warn(`ColorPicker: \`swatches\` has entries that are not colors, left out: ${rejected.map((item) => JSON.stringify(item)).join(", ")}.`);
      }
      if (!ariaLabel && !ariaLabelledBy) {
        console.warn("ColorPicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the group.");
      }
      if (!["hex", "rgb", "hsl", "oklch"].includes(format)) {
        console.warn(`ColorPicker: \`format\` must be "hex", "rgb", "hsl" or "oklch"; got ${JSON.stringify(format)}.`);
      }
    });

    // The text entry holds what is being typed until it is committed (Enter, or leaving it); `null` means "show the color".
    const [entry, setEntry] = useState<string | null>(null);
    const [invalidEntry, setInvalidEntry] = useState(false);
    const { message: announcement, announce } = useAnnouncement();
    const entryRef = useRef<HTMLInputElement | null>(null);
    const proxy = useRef<HTMLInputElement | null>(null);
    const areaRef = useRef<HTMLInputElement | null>(null);
    const group = useRef<HTMLDivElement | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const trigger = useRef<HTMLButtonElement | null>(null);
    const interactedOutside = useRef(false);
    const inside = useRef(false);
    const inert = disabled || readOnly;
    const invalid = hasError || invalidEntry;

    useEffect(() => {
      if (autoFocus) entryRef.current?.focus();
    }, [autoFocus]);

    // The hidden input a form checks is told when the typed text is not a color, so its submit is refused with a message.
    useEffect(() => {
      proxy.current?.setCustomValidity(invalidEntry ? labels.invalid : "");
    }, [invalidEntry, labels.invalid]);

    // From outside, through `controllerRef`: one object for the picker's life, whose methods read the latest state.
    const latest = useRef({ open, inline, disabled, readOnly, setOpen });
    latest.current = { open, inline, disabled, readOnly, setOpen };
    useImperativeHandle(
      controllerRef,
      () => ({
        open: () => {
          const now = latest.current;
          if (now.open || now.inline || now.disabled || now.readOnly) return false;
          now.setOpen(true);
          return true;
        },
        close: () => {
          if (!latest.current.open) return false;
          latest.current.setOpen(false);
          return true;
        },
        focus: () => {
          if (latest.current.disabled || !entryRef.current) return false;
          entryRef.current.focus();
          return true;
        },
        isOpen: () => latest.current.open,
      }),
      [],
    );

    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // A browser that refuses (an insecure page, no permission) is told to the person, who can still copy the text by hand.
        announce(labels.copyFailed);
        return;
      }
      setCopied(true);
      announce(labels.copied);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
    };

    const settle = () => {
      setEntry(null);
      setInvalidEntry(false);
    };

    const commitEntry = (): boolean => {
      if (entry === null) return true;
      const typed = entry.trim();
      if (typed === "") {
        settle();
        if (hasValue) {
          clear();
          announce(labels.cleared);
        }
        return true;
      }
      if (setText(typed)) {
        settle();
        announce(labels.chosen(normalizeColor(typed, format, alpha) ?? typed));
        return true;
      }
      setInvalidEntry(true);
      return false;
    };

    const onEntryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        // An unreadable color keeps the form from submitting; a readable one is committed first.
        if (!commitEntry()) event.preventDefault();
      } else if (event.key === "ArrowDown" && event.altKey && !inline && !inert) {
        // The shortcut a combobox and a date field have: Alt+ArrowDown opens what the field chooses from.
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape" && entry !== null) {
        settle();
        event.stopPropagation();
      }
    };

    // The format switch: the text is re-spelled (an uncontrolled value is held as written and re-spelled by the hook) and
    // the color is reported in the new format, the one moment the value's spelling changes without its color doing so.
    const changeFormat = (next: typeof format) => {
      if (next === format) return;
      if (formatProp === undefined) setHeldFormat(next);
      onFormatChange?.(next);
      if (hasValue) {
        const written = formatColor(hsvaToRgb(hsva), next, alpha);
        onValueChange?.(written);
        onValueCommit?.(written);
      }
    };

    const change = (next: typeof hsva, kind: "change" | "commit") => {
      settle();
      setHsva(next, kind);
    };

    const clearColor = () => {
      settle();
      clear();
      onClear?.();
      announce(labels.cleared);
      entryRef.current?.focus();
    };

    const pick = (swatch: SwatchChoice) => {
      settle();
      setText(swatch.css);
      announce(labels.chosen(swatch.label));
    };

    const pickNone = () => {
      settle();
      clear();
      announce(labels.cleared);
    };

    const pickFromScreen = (hex: string) => {
      settle();
      if (setText(hex)) announce(labels.chosen(normalizeColor(hex, format, alpha) ?? hex));
    };

    // The field as a whole, for `onFocus`/`onBlur`: the group and the portaled panel are one thing.
    const within = (node: EventTarget | null) =>
      node instanceof Node && (group.current?.contains(node) === true || panel.current?.contains(node) === true);
    const onGroupFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event);
    };
    const onGroupBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (within(event.relatedTarget)) return;
      inside.current = false;
      onBlur?.(event);
    };

    // The entry is as wide as its text; while the panel is open it keeps the longest text it has shown, so a drag doesn't move its edge.
    const shown = entry ?? text;
    const [widest, setWidest] = useState("");
    if (open ? shown.length > widest.length : widest !== "") setWidest(open ? shown : "");
    const sizerText = (open && widest.length > shown.length ? widest : shown) || labels.none;

    const panelId = useId();
    const room = useViewportRoom(group, fullWidth && open);
    const preferredTop = side === "top";
    const roomOnPreferred = room ? (preferredTop ? room.above : room.below) : 0;
    const roomOnOther = room ? (preferredTop ? room.below : room.above) : 0;
    const panelSide: "top" | "bottom" =
      fullWidth && room && roomOnPreferred < MIN_ROOM && roomOnOther > roomOnPreferred ? (preferredTop ? "bottom" : "top") : preferredTop ? "top" : "bottom";
    const panelStyle: CSSProperties | undefined =
      fullWidth && room ? ({ "--color-picker-width": `${room.width - 2 * EDGE_GAP}px` } as CSSProperties) : undefined;

    const current = hsvaToRgb(hsva);
    const chipStyle = hasValue ? ({ "--color-picker-chip": formatColor(current, "rgb", true) } as CSSProperties) : undefined;
    const chip = <span className={cx(styles.chip, !hasValue && styles.chipEmpty)} style={chipStyle} aria-hidden="true" />;

    const body: ReactNode = (
      <>
        {inline ? (
          <span className={styles.chipBox}>{chip}</span>
        ) : (
          <button
            ref={trigger}
            type="button"
            className={cx(styles.chipButton, buttonClass[size])}
            aria-label={labels.openPicker}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            disabled={inert}
            onClick={() => setOpen(!open)}
          >
            {chip}
          </button>
        )}
        <span className={styles.entryBox} data-text={sizerText}>
          <input
            ref={entryRef}
            id={id}
            type="text"
            className={styles.entry}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={labels.value}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            aria-describedby={ariaDescribedBy}
            placeholder={labels.none}
            disabled={disabled}
            readOnly={readOnly}
            value={shown}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setEntry(event.target.value);
              setInvalidEntry(false);
            }}
            onKeyDown={onEntryKeyDown}
            onBlur={() => {
              commitEntry();
            }}
          />
        </span>
        {clearable && hasValue && !inert && (
          <button type="button" className={cx(styles.iconButton, buttonClass[size])} aria-label={labels.clear} onClick={clearColor}>
            <Icon icon={XIcon} size={iconSizeFor[size]} tone="default" />
          </button>
        )}
        {/* A color chosen from a swatch, the screen or typed text is said here: focus stays on a control whose name doesn't change. */}
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        {/* The value a form submits and validates, hidden from sight and from assistive tech (which has the entry). Arriving on it,
            which a browser does to show its message, sends focus to the entry. */}
        <input
          ref={proxy}
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.proxy}
          name={name}
          form={form}
          value={text}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          onChange={() => {}}
          onFocus={() => entryRef.current?.focus()}
        />
      </>
    );

    const panelContent = (
      <ColorPickerPanel
        ref={areaRef}
        hsva={hsva}
        hasValue={hasValue}
        alpha={alpha}
        swatches={swatches}
        eyeDropper={eyeDropper}
        noneSwatch={noneSwatch}
        copyButton={copyButton}
        copied={copied}
        channelSpace={showChannelInputs ? (format === "hex" ? "hex" : format === "hsl" ? "hsl" : format === "oklch" ? "oklch" : "rgb") : undefined}
        labels={labels}
        formatNumber={formatNumber}
        format={showFormatSwitch ? format : undefined}
        onFormatChange={changeFormat}
        dir={direction}
        disabled={disabled}
        readOnly={readOnly}
        onChange={change}
        onPickSwatch={pick}
        onPickNone={pickNone}
        onCopy={() => void copy()}
        onPickFromScreen={pickFromScreen}
      />
    );

    const groupProps = {
      ...props,
      role: "group" as const,
      dir,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-disabled": disabled || undefined,
      "data-testid": dataTestId,
      onFocus: onGroupFocus,
      onBlur: onGroupBlur,
    };
    const fieldClass = cx(styles.root, sizeClass[size], invalid && styles.error, disabled && styles.disabled);

    if (inline) {
      return (
        <div {...groupProps} ref={mergeRefs(ref, group)} style={style} className={cx(styles.inline, className)}>
          <div className={fieldClass}>{body}</div>
          <div className={styles.inlinePanel}>{panelContent}</div>
        </div>
      );
    }

    const field = (
      <div {...groupProps} ref={mergeRefs(ref, group)} style={style} className={cx(fieldClass, className)}>
        {body}
      </div>
    );

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>{field}</PopoverPrimitive.Anchor>
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
            onFocus={onGroupFocus}
            onBlur={onGroupBlur}
            className={cx(styles.panel, fullWidth && styles.fullWidth)}
            style={panelStyle}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              interactedOutside.current = false;
              areaRef.current?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              // Radix has no trigger of its own to hand focus back to, so it is done here, unless the panel was closed by a
              // press somewhere else, which is where the person's focus now is.
              event.preventDefault();
              if (!interactedOutside.current) trigger.current?.focus();
            }}
            onInteractOutside={(event) => {
              // The button toggles the panel itself: a press on it is not an outside press.
              if (event.target instanceof Node && trigger.current?.contains(event.target)) {
                event.preventDefault();
                return;
              }
              interactedOutside.current = true;
            }}
          >
            {panelContent}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  },
);
ColorPicker.displayName = "ColorPicker";
