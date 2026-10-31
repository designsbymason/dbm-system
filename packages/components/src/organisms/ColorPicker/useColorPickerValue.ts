import { useState } from "react";
import { emptyHsva, formatColor, hsvaToRgb, normalizeColor, parseColor, rgbToHsva } from "../../internal/color/colorValue";
import type { ColorFormat, Hsva } from "../../internal/color/colorValue";
import type { ColorPickerCommitOn } from "./ColorPicker.types";

/** `"change"` is a step of a drag or a key; `"commit"` is the moment the person is done with it. */
export type ChangeKind = "change" | "commit";

interface Model {
  /** The `value` (controlled) or the held value (uncontrolled) this model was last reconciled with. */
  source: string;
  /** The text `hsva` writes to. Differs from `source` while a controlled value is waiting for its owner. */
  text: string;
  hsva: Hsva;
}

interface Options {
  value: string | undefined;
  defaultValue: string | undefined;
  format: ColorFormat;
  alpha: boolean;
  commitOn: ColorPickerCommitOn;
  onValueChange: ((value: string) => void) | undefined;
  onValueCommit: ((value: string) => void) | undefined;
}

const hsvaFromText = (text: string, previous: Hsva): Hsva => {
  const color = parseColor(text);
  return color ? rgbToHsva(color, previous.h) : emptyHsva;
};

/**
 * The color a `ColorPicker` holds, as text in its format and as hue, saturation, brightness and alpha. The picker keeps the
 * HSV numbers itself so that a gray keeps its hue and a drag doesn't wobble from rounding to 8 bits; the text is what is
 * reported, submitted and compared. A value from outside that is not what the HSV numbers already write to replaces them.
 */
export function useColorPickerValue({ value, defaultValue, format, alpha, commitOn, onValueChange, onValueCommit }: Options) {
  const normalize = (text: string | undefined): string => (text ? (normalizeColor(text, format, alpha) ?? "") : "");
  const controlled = value !== undefined;
  // The uncontrolled value is held as it was last written and spelled in the current `format` and `alpha` each render, so a
  // format changed from outside re-spells it.
  const [held, setHeld] = useState(() => defaultValue ?? "");
  const external = normalize(controlled ? value : held);

  const [stored, setModel] = useState<Model>(() => ({ source: external, text: external, hsva: hsvaFromText(external, emptyHsva) }));
  let model = stored;
  // A controlled picker that reports every change follows its owner at once: a value the owner did not accept is shown as
  // refused. One that reports only when done (`commitOn="commit"`) keeps its drag until the owner's value changes.
  const followsOwner = controlled && commitOn === "change";
  if (stored.source !== external || (followsOwner && stored.text !== external)) {
    // The value changed from outside. If it is what the numbers we hold already write to (as it is after a format change, and when an
    // owner echoes a change back), keep the exact numbers and only take the text; a lossy spelling (HSL rounds to whole degrees) must not
    // replace them. If it is another color, take it.
    const writesExternal = external !== "" && formatColor(hsvaToRgb(stored.hsva), format, alpha) === external;
    model = stored.text === external || writesExternal ? { ...stored, source: external, text: external } : { source: external, text: external, hsva: hsvaFromText(external, stored.hsva) };
    setModel(model);
  }

  const report = (text: string, kind: ChangeKind, changed: boolean) => {
    // A drag released on the color its last step reported is not a second change.
    if (commitOn === "change" ? changed : kind === "commit") onValueChange?.(text);
    if (kind === "commit") onValueCommit?.(text);
  };

  /** Moves to `next`: a step of a drag or a key, or the end of one. */
  const setHsva = (next: Hsva, kind: ChangeKind) => {
    const settled = { ...next, a: alpha ? next.a : 1 };
    const text = formatColor(hsvaToRgb(settled), format, alpha);
    const changed = text !== model.text;
    setModel({ source: model.source, text, hsva: settled });
    if (!controlled) setHeld(text);
    report(text, kind, changed);
  };

  /** Chooses the color written in `input`, in any form; `false` (and nothing changed) if it isn't a color. */
  const setText = (input: string): boolean => {
    const color = parseColor(input);
    if (!color) return false;
    setHsva(rgbToHsva(alpha ? color : { ...color, a: 1 }, model.hsva.h), "commit");
    return true;
  };

  const clear = () => {
    const changed = model.text !== "";
    setModel({ source: model.source, text: "", hsva: emptyHsva });
    if (!controlled) setHeld("");
    report("", "commit", changed);
  };

  return { text: model.text, hsva: model.hsva, setHsva, setText, clear };
}
