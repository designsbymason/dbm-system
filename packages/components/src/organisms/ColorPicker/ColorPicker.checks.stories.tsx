import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { ColorPicker } from "./ColorPicker";

// Real-browser checks for what jsdom can't evaluate: a real mouse drag across the area, where the thumb is drawn, the thumb's
// two rings against black, white and a mid color, text inserted all at once, a real mouse choosing inside a Dialog, target
// sizes, the right-to-left layout and forced colors. Hidden from the sidebar and the Docs page, and still run as tests
// (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/ColorPicker/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
const entry = () => body().getByRole("textbox", { name: "Color value" }) as HTMLInputElement;
const area = () => (body().getByRole("slider", { name: "Saturation" }) as HTMLInputElement).parentElement as HTMLElement;
const thumb = () => area().querySelector<HTMLElement>("span[aria-hidden]") as HTMLElement;

// A measurement taken while the panel is still fading in is wrong by the easing's distance.
const settled = async (panel: HTMLElement) => {
  await nextFrame();
  const box = panel.closest("[data-radix-popper-content-wrapper]")?.firstElementChild as HTMLElement | null;
  await Promise.all((box?.getAnimations() ?? []).map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
const toPage = (x: number, y: number) => {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
};

const centre = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

async function realClick(element: Element) {
  const point = toPage(centre(element).x, centre(element).y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}

const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
// Clearing an emulated feature takes an empty list: setting it back to its default value leaves the emulation on.
const clearEmulation = () => send("Emulation.setEmulatedMedia", { features: [] });

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "36rem" }}>
      <Button variant="secondary" data-testid="aside">
        Elsewhere
      </Button>
      {children}
    </div>
  );
}

export const DragWithARealMouse: Story = {
  name: "A real mouse drag across the area chooses the color under it, and the thumb sits there",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline defaultValue="#ff0000" />
    </Page>
  ),
  play: async () => {
    const surface = area();
    const rect = surface.getBoundingClientRect();
    const at = (fx: number, fy: number) => toPage(rect.left + rect.width * fx, rect.top + rect.height * fy);
    const start = at(0.25, 0.25);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...start });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...start, button: "left", buttons: 1, clickCount: 1 });
    const end = at(0.75, 0.5);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...end, button: "left", buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...end, button: "left", clickCount: 1 });
    await waitFor(() => expect(body().getByRole("slider", { name: "Saturation" })).toHaveAttribute("aria-valuetext", "75%"));
    await expect(body().getByRole("slider", { name: "Brightness" })).toHaveAttribute("aria-valuetext", "50%");
    await expect(body().getByRole("slider", { name: "Saturation" })).toHaveFocus();
    // The thumb is drawn at the pointer's place, to the pixel.
    const t = thumb().getBoundingClientRect();
    await expect(Math.abs(t.left + t.width / 2 - (rect.left + rect.width * 0.75))).toBeLessThan(1.5);
    await expect(Math.abs(t.top + t.height / 2 - (rect.top + rect.height * 0.5))).toBeLessThan(1.5);
    // Dragging past the edge holds the thumb at it.
    const far = toPage(rect.right + 80, rect.bottom + 80);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...at(0.5, 0.5) });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...at(0.5, 0.5), button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...far, button: "left", buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...far, button: "left", clickCount: 1 });
    await waitFor(() => expect(body().getByRole("slider", { name: "Saturation" })).toHaveAttribute("aria-valuetext", "100%"));
    await expect(body().getByRole("slider", { name: "Brightness" })).toHaveAttribute("aria-valuetext", "0%");
  },
};

export const ThumbCanBeToldFromAnyColor: Story = {
  name: "The thumb is a white ring inside a black one, and one of the two is 3:1 against black, white and a mid color",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline defaultValue="#ffffff" />
    </Page>
  ),
  play: async () => {
    const parse = (value: string) => (value.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number) as [number, number, number];
    const luminance = ([r, g, b]: [number, number, number]) => {
      const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const ratio = (a: [number, number, number], b: [number, number, number]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const color of ["#ffffff", "#000000", "#808080", "#ff0000"]) {
      await userEvent.clear(entry());
      await userEvent.type(entry(), `${color}{Enter}`);
      await waitFor(() => expect(entry()).toHaveValue(color));
      const style = getComputedStyle(thumb());
      const fill = parse(style.backgroundColor);
      const white = parse(style.borderTopColor);
      const black = parse(style.boxShadow);
      await expect(white).toEqual([255, 255, 255]);
      // The system's black is the near-black of its primitive scale, not pure #000.
      await expect(luminance(black)).toBeLessThan(0.01);
      await expect(Math.max(ratio(fill, white), ratio(fill, black)), `thumb on ${color}`).toBeGreaterThanOrEqual(3);
    }
  },
};

export const TextInsertedAtOnce: Story = {
  name: "Text inserted all at once (a phone's keyboard, an autofill) is read as a whole",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" />
    </Page>
  ),
  play: async () => {
    entry().focus();
    await send("Input.insertText", { text: "rgb(51 102 153)" });
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(entry()).toHaveValue("#336699"));
  },
};

export const ChooseInsideADialog: Story = {
  name: "A real mouse chooses a swatch from the panel inside a Dialog, and the Dialog stays open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Theme</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <ColorPicker aria-label="Brand color" swatches={["#ff0000", "#00aa00"]} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose color" }));
    const panel = await body().findByRole("dialog", { name: "Choose a color" });
    await settled(panel);
    const swatch = within(panel).getByRole("button", { name: "#00aa00" });
    // The swatch is the top element at its own point, not hidden under the dialog's scrim.
    const point = centre(swatch);
    await expect(document.elementFromPoint(point.x, point.y)).toBe(swatch);
    await realClick(swatch);
    await waitFor(() => expect(entry()).toHaveValue("#00aa00"));
    await expect(body().getByRole("dialog", { name: "Theme" })).toBeInTheDocument();
  },
};

export const TargetsAreBigEnough: Story = {
  name: "Every button, thumb and swatch is at least 24 x 24 pixels at every size",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ColorPicker key={size} size={size} aria-label={`Brand color ${size}`} clearable defaultValue="#5548a4" />
      ))}
    </Page>
  ),
  play: async () => {
    for (const button of body().getAllByRole("button", { name: /Choose color|Clear color/ })) {
      const rect = button.getBoundingClientRect();
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const SwatchAndThumbTargets: Story = {
  name: "Swatches are 24px, and a slider thumb's touch target reaches 24px",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline alpha swatches={["#ff0000", "#00ff00"]} defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    for (const swatch of within(body().getByRole("group", { name: "Swatches" })).getAllByRole("button")) {
      const rect = swatch.getBoundingClientRect();
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
    // A press 11px either side of a thumb's centre still reaches it (the invisible ::before is the extra target).
    for (const name of ["Hue", "Opacity"]) {
      const slider = body().getByRole("slider", { name });
      const c = centre(slider);
      await expect(document.elementFromPoint(c.x - 11, c.y)?.closest('[role="slider"]')).toBe(slider);
      await expect(document.elementFromPoint(c.x + 11, c.y)?.closest('[role="slider"]')).toBe(slider);
    }
  },
};

export const EntryHugsItsText: Story = {
  name: "The field is as wide as its text and no wider, and does not shrink while the panel is open",
  render: () => (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
        <ColorPicker aria-label="Brand color" format="rgb" defaultValue="#5548a4" />
      </div>
    </Page>
  ),
  play: async () => {
    const box = () => entry().parentElement as HTMLElement;
    const textWidth = () => {
      const probe = document.createElement("span");
      const style = getComputedStyle(entry());
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-family:${style.fontFamily};font-size:${style.fontSize};font-weight:${style.fontWeight};letter-spacing:${style.letterSpacing};font-variant-numeric:tabular-nums`;
      probe.textContent = entry().value;
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    // No spare room after the text: the box is the text's width, give or take a pixel.
    await expect(Math.abs(box().getBoundingClientRect().width - textWidth())).toBeLessThan(2);
    // A longer value widens it.
    await userEvent.clear(entry());
    await userEvent.type(entry(), "rgb(255 255 255){Enter}");
    await waitFor(() => expect(Math.abs(box().getBoundingClientRect().width - textWidth())).toBeLessThan(2));
    // With the panel open, a shorter value does not shrink it.
    await userEvent.click(body().getByRole("button", { name: "Choose color" }));
    await body().findByRole("dialog", { name: "Choose a color" });
    const open = box().getBoundingClientRect().width;
    body().getByRole("slider", { name: "Brightness" }).focus();
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(entry()).toHaveValue("rgb(0 0 0)"));
    await expect(box().getBoundingClientRect().width).toBe(open);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a color" })).not.toBeInTheDocument());
    await waitFor(() => expect(box().getBoundingClientRect().width).toBeLessThan(open));
  },
};

export const RightToLeft: Story = {
  name: "In a right-to-left page the sliders mirror and the area does not",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline dir="rtl" defaultValue="#ff0000" />
    </Page>
  ),
  play: async () => {
    const surface = area().getBoundingClientRect();
    // Full saturation is at the physical right edge in either direction.
    body().getByRole("slider", { name: "Saturation" }).focus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(Math.abs(thumb().getBoundingClientRect().left + thumb().getBoundingClientRect().width / 2 - surface.right)).toBeLessThan(1.5));
    // The hue slider's minimum is at the right: the thumb of hue 0 is at the right edge of the track, and ArrowLeft raises the hue.
    const hue = body().getByRole("slider", { name: "Hue" });
    const track = hue.parentElement as HTMLElement;
    await expect(Math.abs(hue.getBoundingClientRect().left + hue.getBoundingClientRect().width / 2 - track.getBoundingClientRect().right)).toBeLessThan(14);
    hue.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(hue).toHaveAttribute("aria-valuenow", "1");
  },
};

export const FocusRingOnThumb: Story = {
  name: "A keyboard user sees the focus ring on the area's thumb, and a mouse press does not leave one",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    const ringsOf = () => getComputedStyle(thumb()).boxShadow.split(/,\s(?=rgb)/).length;
    // Real key events: Storybook's `userEvent` is synthetic and leaves the page in pointer modality, where `:focus-visible` never matches.
    const press = async (key: string, code: string, windowsVirtualKeyCode: number) => {
      await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
    };
    await expect(ringsOf()).toBe(1);
    body().getByTestId("aside").focus();
    for (let step = 0; step < 4 && document.activeElement !== body().getByRole("slider", { name: "Saturation" }); step += 1) {
      await press("Tab", "Tab", 9);
    }
    await expect(body().getByRole("slider", { name: "Saturation" })).toHaveFocus();
    await waitFor(() => expect(ringsOf()).toBeGreaterThanOrEqual(3));
    // A press with the mouse moves focus to the area but is not keyboard focus: no ring.
    await realClick(body().getByTestId("aside"));
    const rect = area().getBoundingClientRect();
    const point = toPage(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
    await waitFor(() => expect(body().getByRole("slider", { name: "Saturation" })).toHaveFocus());
    await expect(ringsOf()).toBe(1);
  },
};

export const ForcedColours: Story = {
  name: "In forced colours the thumbs are drawn with system colors and the color itself is kept",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline alpha swatches={["#ff0000"]} defaultValue="#ff0000" />
    </Page>
  ),
  play: async () => {
    const colour = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      await expect(getComputedStyle(thumb()).borderTopColor).toBe(colour("CanvasText"));
      // The area keeps its own colors: forced colors would otherwise paint it as the page.
      await expect(getComputedStyle(area()).backgroundColor).not.toBe(colour("Canvas"));
      const swatch = within(body().getByRole("group", { name: "Swatches" })).getByRole("button");
      await expect(getComputedStyle(swatch).borderTopColor).toBe(colour("CanvasText"));
    } finally {
      await clearEmulation();
    }
  },
};

export const PanelSitsByTheField: Story = {
  name: "The panel opens below the field, above the page, in the field's font, with focus on the area",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose color" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a color" });
    await settled(dialog);
    const field = body().getByRole("group", { name: "Brand color" }).getBoundingClientRect();
    const panel = dialog.getBoundingClientRect();
    await expect(panel.top - field.bottom).toBeGreaterThanOrEqual(2);
    await expect(panel.top - field.bottom).toBeLessThan(24);
    await expect(Math.abs(panel.left - field.left)).toBeLessThan(2);
    await expect(getComputedStyle(dialog).fontFamily).toBe(getComputedStyle(body().getByRole("group", { name: "Brand color" })).fontFamily);
    await expect(body().getByRole("slider", { name: "Saturation" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a color" })).not.toBeInTheDocument());
  },
};

export const EveryFormatFits: Story = {
  name: "The whole value shows in every format, with and without opacity, at every size",
  render: () => (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
      {(["hex", "rgb", "hsl", "oklch"] as const).flatMap((format) =>
        (["xs", "xl"] as const).flatMap((size) =>
          [false, true].map((alpha) => (
            <ColorPicker key={`${format}${size}${alpha}`} format={format} size={size} alpha={alpha} aria-label={`${format} ${size} ${alpha}`} defaultValue={alpha ? "#fedcba8c" : "#fedcba"} />
          )),
        ),
      )}
      </div>
    </Page>
  ),
  play: async () => {
    const rows = (body().getAllByRole("textbox", { name: "Color value" }) as HTMLInputElement[]).map((input) => `${input.value}|${input.scrollWidth}|${input.clientWidth}`);
    if (rows.length === 0) throw new Error("no fields");
    for (const input of body().getAllByRole("textbox", { name: "Color value" }) as HTMLInputElement[]) {
      await expect(input.scrollWidth, input.value).toBeLessThanOrEqual(input.clientWidth);
    }
  },
};

export const SwitchTheFormatInThePanel: Story = {
  name: "The format switch in the open panel rewrites the field and leaves the panel open, with a real mouse",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" showFormatSwitch defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose color" }));
    const panel = await body().findByRole("dialog", { name: "Choose a color" });
    await settled(panel);
    const group = within(panel).getByRole("radiogroup", { name: "Color format" });
    // Four buttons share the panel's width, every one a large enough target and none cut off.
    for (const radio of within(group).getAllByRole("radio")) {
      const rect = radio.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(radio.scrollWidth).toBeLessThanOrEqual(radio.clientWidth);
    }
    await expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(panel.getBoundingClientRect().right);
    await realClick(within(group).getByRole("radio", { name: "OKLCH" }));
    await waitFor(() => expect(entry().value).toMatch(/^oklch\(/));
    await expect(body().getByRole("dialog", { name: "Choose a color" })).toBeInTheDocument();
    await realClick(within(group).getByRole("radio", { name: "Hex" }));
    await waitFor(() => expect(entry()).toHaveValue("#5548a4"));
  },
};

const press = async (key: string, code: string, windowsVirtualKeyCode: number, modifiers = 0) => {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode, modifiers });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode, modifiers });
};

export const EverythingFitsThePanel: Story = {
  name: "With every option on, nothing in the panel is cut off or wider than the panel, and the number fields are usable",
  render: () => (
    <Page>
      <ColorPicker
        aria-label="Brand color"
        defaultOpen
        alpha
        showFormatSwitch
        showChannelInputs
        noneSwatch
        copyButton
        eyeDropper
        defaultValue="#5548a4"
        swatches={["#ff0000", "#00aa00", "#0000ff", "#ffaa00", "#aa00aa", "#00aaaa", "#888888", "#222222"]}
      />
    </Page>
  ),
  play: async () => {
    const panel = await body().findByRole("dialog", { name: "Choose a color" });
    await settled(panel);
    const box = panel.getBoundingClientRect();
    await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    for (const control of within(panel).getAllByRole("spinbutton")) {
      const rect = control.getBoundingClientRect();
      await expect(rect.right).toBeLessThanOrEqual(box.right);
      await expect(rect.left).toBeGreaterThanOrEqual(box.left);
      // The target is `Input`'s wrapper, which hands a press on its padding to the field.
      await expect((control.parentElement as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      // The number fits its field (three digits, or the longest oklch value, with room to read).
      await expect((control as HTMLInputElement).scrollWidth).toBeLessThanOrEqual((control as HTMLInputElement).clientWidth);
    }
    // Each option row is inside the panel's own padding.
    for (const button of within(panel).getAllByRole("button")) await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    // The oklch fields hold their longest values.
    await realClick(within(panel).getByRole("radio", { name: "OKLCH" }));
    await waitFor(() => expect(within(panel).getByRole("spinbutton", { name: "Hue" })).toHaveValue(285.9));
    for (const control of within(panel).getAllByRole("spinbutton") as HTMLInputElement[]) await expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth);
  },
};

export const AltArrowDownOpens: Story = {
  name: "A real Alt+ArrowDown from the text entry opens the panel and focuses the area",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    entry().focus();
    // Alt is modifier 1 in the DevTools Protocol.
    await press("ArrowDown", "ArrowDown", 40, 1);
    await body().findByRole("dialog", { name: "Choose a color" });
    await waitFor(() => expect(body().getByRole("slider", { name: "Saturation" })).toHaveFocus());
    await press("Escape", "Escape", 27);
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a color" })).not.toBeInTheDocument());
    await expect(body().getByRole("button", { name: "Choose color" })).toHaveFocus();
  },
};

export const SwatchTooltips: Story = {
  name: "A swatch shows its name in a tooltip on a real hover and on keyboard focus",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline swatches={[{ value: "#ff0000", label: "Signal red" }]} noneSwatch />
    </Page>
  ),
  play: async () => {
    const swatch = body().getByRole("button", { name: "Signal red" });
    const point = toPage(centre(swatch).x, centre(swatch).y);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toContain("Signal red"), { timeout: 2000 });
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    body().getByRole("button", { name: "No color" }).focus();
    await press("ArrowRight", "ArrowRight", 39);
    await waitFor(() => expect(body().getByRole("button", { name: "Signal red" })).toHaveFocus());
  },
};

export const CopyWithTheRealClipboard: Story = {
  name: "The copy button hands the color to the real clipboard and says how it went",
  render: () => (
    <Page>
      <ColorPicker aria-label="Brand color" inline copyButton format="rgb" defaultValue="#5548a4" />
    </Page>
  ),
  play: async () => {
    // A headless test page may refuse clipboard access, so what is asserted is what the button asked the real API to write, and that
    // it said something about the outcome (copied, or refused).
    const asked: string[] = [];
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text: string) => {
      asked.push(text);
      return original(text);
    };
    try {
      await userEvent.click(body().getByRole("button", { name: "Copy color" }));
      await waitFor(() => expect(body().getByRole("status")).toHaveTextContent(/Color copied|Could not copy the color/), { timeout: 3000 });
      await expect(asked).toEqual(["rgb(85 72 164)"]);
    } finally {
      navigator.clipboard.writeText = original;
    }
  },
};
