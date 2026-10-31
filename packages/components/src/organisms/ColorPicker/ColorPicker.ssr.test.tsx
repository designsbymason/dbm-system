import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorPicker } from "./ColorPicker";
import type { ColorPickerProps } from "./ColorPicker.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the server render is
// done with both removed: what it proves is that nothing touches them while rendering. The eyedropper is looked for after the
// first commit, so the first client render matches the server's.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const variants: Array<[string, Partial<ColorPickerProps>]> = [
  ["empty", {}],
  ["with a value", { defaultValue: "#5548a4", clearable: true }],
  ["open by default", { defaultOpen: true, defaultValue: "#5548a4" }],
  ["controlled open", { open: true, value: "#5548a4", onValueChange: () => undefined }],
  ["named and required", { name: "brand", required: true }],
  ["other formats", { format: "oklch", defaultValue: "#5548a4" }],
  ["with alpha and swatches", { alpha: true, defaultValue: "#5548a480", swatches: ["#ff0000", { value: "hsl(120 100% 25%)", label: "Green" }], defaultOpen: true }],
  ["with an eyedropper", { eyeDropper: true, defaultOpen: true }],
  ["with channel fields, a none swatch and a copy button", { defaultOpen: true, showChannelInputs: true, alpha: true, noneSwatch: true, copyButton: true, swatches: ["#ff0000"] }],
  ["with a format switch", { defaultOpen: true, showFormatSwitch: true, format: "oklch", defaultValue: "#5548a4" }],
  ["a color name", { defaultValue: "rebeccapurple" }],
  ["inline with everything", { inline: true, showChannelInputs: true, showFormatSwitch: true, alpha: true, noneSwatch: true, copyButton: true, eyeDropper: true, swatches: ["#ff0000"] }],
  ["with recent colors", { defaultOpen: true, showRecent: true, recentColors: ["#ff0000", "#00aa00"] }],
  ["with persisted recent colors", { defaultOpen: true, showRecent: true, persistKey: "ssr" }],
  ["inline", { inline: true, defaultValue: "#5548a4", alpha: true, swatches: ["#ff0000"] }],
  ["right to left", { dir: "rtl", defaultOpen: true, alpha: true }],
  ["translated digits", { formatNumber: (n) => String.fromCodePoint(0x660 + n), defaultOpen: true }],
  ["full width", { defaultOpen: true, presentation: "full-width" }],
  ["a responsive presentation", { defaultOpen: true, presentation: { base: "full-width", sm: "anchored" } }],
];

// `onTheServer` puts back every global, the setup file's no-op ResizeObserver included, and the sliders in the open panel measure
// their thumbs with one.
class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("ColorPicker on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<ColorPicker aria-label="Brand" {...props} />));
    expect(html).toContain('role="group"');
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const markup = <ColorPicker aria-label="Brand" {...props} />;
    const html = onTheServer(() => renderToString(markup));
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      hydrateRoot(container, markup, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(screen.getByRole("group", { name: "Brand" })).toBeInTheDocument();
    container.remove();
  });
});
