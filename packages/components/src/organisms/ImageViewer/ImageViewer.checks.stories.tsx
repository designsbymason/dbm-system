import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { ImageViewer, ImageViewerButton } from "./ImageViewer";
import type { ImageViewerProps } from "./ImageViewer.types";
import { brokenImages, getManyImages, sampleImages } from "./ImageViewerStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the fit, a wheel and a drag on the real stage, the
// touch gestures, the scroll lock, contrast from the computed styles, forced colours and reduced motion. Hidden from the
// sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Media/ImageViewer/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

function Harness(props: Partial<ImageViewerProps>) {
  const [reason, setReason] = useState("none");
  return (
    <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
      <p data-testid="reason">{reason}</p>
      <ImageViewer
        trigger={<Button>Open</Button>}
        images={sampleImages}
        onOpenChange={(open, details) => {
          if (!open) setReason(details.reason);
        }}
        {...props}
      />
    </div>
  );
}

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel, its scrim and the image box to finish first.
const settled = async (dialog: HTMLElement) => {
  await nextFrame();
  const running = [dialog, dialog.parentElement as HTMLElement, ...dialog.querySelectorAll<HTMLElement>("[data-drawn]")].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

const openViewer = async () => {
  await userEvent.click(await body.findByRole("button", { name: "Open" }));
  const dialog = await body.findByRole("dialog");
  await waitFor(() => expect(dialog.querySelector("[data-drawn]")).not.toBeNull(), { timeout: 5000 });
  await settled(dialog);
  return dialog;
};

// A viewer opened by a check closes, and is gone, before the check ends: the accessibility run that follows every
// story would otherwise see it still easing out with the page behind it hidden.
const closeWithEscape = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
};

const boxOf = (dialog: HTMLElement) => dialog.querySelector("[data-drawn]") as HTMLElement;
const stageOf = (dialog: HTMLElement) => boxOf(dialog).parentElement as HTMLElement;
const counterOf = (dialog: HTMLElement) => within(dialog).getByText(/^\S+ \/ \S+$/);

// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
function pagePoint(clientX: number, clientY: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + clientX * scale, y: (frame?.top ?? 0) + clientY * scale };
}

async function realMouse(type: "mouseMoved" | "mousePressed" | "mouseReleased" | "mouseWheel", clientX: number, clientY: number, extra: Record<string, unknown> = {}) {
  const { x, y } = pagePoint(clientX, clientY);
  await send("Input.dispatchMouseEvent", { type, x, y, ...extra });
}

async function realClickAt(clientX: number, clientY: number) {
  await realMouse("mouseMoved", clientX, clientY);
  await realMouse("mousePressed", clientX, clientY, { button: "left", clickCount: 1 });
  await realMouse("mouseReleased", clientX, clientY, { button: "left", clickCount: 1 });
}

async function realWheel(clientX: number, clientY: number, deltaY: number) {
  await realMouse("mouseWheel", clientX, clientY, { deltaX: 0, deltaY });
}

async function realDrag(from: { x: number; y: number }, to: { x: number; y: number }) {
  await realMouse("mouseMoved", from.x, from.y);
  await realMouse("mousePressed", from.x, from.y, { button: "left", clickCount: 1 });
  const steps = 6;
  for (let step = 1; step <= steps; step += 1) {
    await realMouse("mouseMoved", from.x + ((to.x - from.x) * step) / steps, from.y + ((to.y - from.y) * step) / steps, { button: "left", buttons: 1 });
    await nextFrame();
  }
  await realMouse("mouseReleased", to.x, to.y, { button: "left", clickCount: 1 });
}

// A finger, from the page: the pointer events a touch screen sends, dispatched on the image. (A touch sent through the
// protocol isn't reliable in every runner, so the gestures are driven by the same events a browser would raise.)
function touch(target: Element, type: "pointerdown" | "pointermove" | "pointerup", pointerId: number, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, pointerType: "touch", isPrimary: pointerId === 1, clientX: x, clientY: y }),
  );
}

async function swipe(target: Element, from: { x: number; y: number }, to: { x: number; y: number }) {
  touch(target, "pointerdown", 1, from.x, from.y);
  for (let step = 1; step <= 8; step += 1) {
    touch(target, "pointermove", 1, from.x + ((to.x - from.x) * step) / 8, from.y + ((to.y - from.y) * step) / 8);
    await sleep(8);
  }
  touch(target, "pointerup", 1, to.x, to.y);
}

const scaleOf = (box: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(box.style.transform)?.[1] ?? "1");
const translationOf = (box: HTMLElement) => {
  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(box.style.transform);
  return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
};

export const FitsTheStageWhole: Story = {
  name: "The whole image is fitted inside the stage, keeping its shape",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const stage = stageOf(dialog).getBoundingClientRect();
    const rect = boxOf(dialog).getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(stage.left - 0.5);
    await expect(rect.right).toBeLessThanOrEqual(stage.right + 0.5);
    await expect(rect.top).toBeGreaterThanOrEqual(stage.top - 0.5);
    await expect(rect.bottom).toBeLessThanOrEqual(stage.bottom + 0.5);
    // 1600 x 1000
    await expect(Math.abs(rect.width / rect.height - 1.6)).toBeLessThan(0.01);
    // centred
    await expect(Math.abs(rect.left + rect.width / 2 - (stage.left + stage.width / 2))).toBeLessThan(1);
    await expect(Math.abs(rect.top + rect.height / 2 - (stage.top + stage.height / 2))).toBeLessThan(1);
    // the panel fills the viewport and the page behind is locked and hidden
    const panel = dialog.getBoundingClientRect();
    await expect(Math.round(panel.width)).toBe(window.innerWidth);
    await expect(Math.round(panel.height)).toBe(window.innerHeight);
    await expect(document.body).toHaveAttribute("data-scroll-locked");
    await closeWithEscape();
    await waitFor(() => expect(document.body).not.toHaveAttribute("data-scroll-locked"));
  },
};

export const KeepsItsShapeWhenTurned: Story = {
  name: "A turned image is refitted, so it never leaves the stage",
  render: () => <Harness defaultValue={1} />,
  play: async () => {
    const dialog = await openViewer();
    await userEvent.keyboard("r");
    await settled(dialog);
    const stage = stageOf(dialog).getBoundingClientRect();
    const rect = boxOf(dialog).getBoundingClientRect();
    // a portrait image turned on its side is wider than tall, and still inside
    await expect(rect.width).toBeGreaterThan(rect.height);
    await expect(rect.right).toBeLessThanOrEqual(stage.right + 0.5);
    await expect(rect.bottom).toBeLessThanOrEqual(stage.bottom + 0.5);
    await closeWithEscape();
  },
};

export const WheelZoomsAboutThePointer: Story = {
  name: "A real wheel zooms about the point under the pointer",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    const before = box.getBoundingClientRect();
    // a point a quarter of the way into the image from its top-left
    const point = { x: before.left + before.width * 0.25, y: before.top + before.height * 0.25 };
    await realWheel(point.x, point.y, -240);
    await waitFor(() => expect(scaleOf(box)).toBeGreaterThan(1.2));
    await settled(dialog);
    const after = box.getBoundingClientRect();
    // the part of the image under the pointer is still under it
    await expect(Math.abs((point.x - after.left) / after.width - 0.25)).toBeLessThan(0.01);
    await expect(Math.abs((point.y - after.top) / after.height - 0.25)).toBeLessThan(0.01);
    await expect(within(dialog).getByRole("button", { name: /Reset zoom/ })).not.toHaveTextContent("100%");
    // and it never goes past the limits
    await realWheel(point.x, point.y, -100000);
    await waitFor(() => expect(scaleOf(box)).toBe(4));
    await closeWithEscape();
  },
};

export const DragPansAndStaysInsideTheStage: Story = {
  name: "A real drag pans a zoomed image and never past its edges",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    await userEvent.keyboard("{+}{+}");
    await waitFor(() => expect(scaleOf(box)).toBeCloseTo(2.25, 5));
    await settled(dialog);
    const stage = stageOf(dialog).getBoundingClientRect();
    const rect = box.getBoundingClientRect();
    await realDrag({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, { x: rect.left + rect.width / 2 - 120, y: rect.top + rect.height / 2 - 60 });
    await waitFor(() => expect(translationOf(box).x).toBeLessThan(-60));
    await expect(translationOf(box).y).toBeLessThan(-20);
    // a drag far past the edge stops at the edge: the image still covers the stage on that side
    await realDrag({ x: stage.left + stage.width / 2, y: stage.top + stage.height / 2 }, { x: stage.left + 5, y: stage.top + 5 });
    await settled(dialog);
    const moved = box.getBoundingClientRect();
    await expect(moved.right).toBeGreaterThanOrEqual(stage.right - 1);
    await expect(moved.bottom).toBeGreaterThanOrEqual(stage.bottom - 1);
    await closeWithEscape();
  },
};

export const DoubleClickZoomsAndRestores: Story = {
  name: "A double click zooms in on the point and a second one fits the image again",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    const rect = box.getBoundingClientRect();
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    await realClickAt(centre.x, centre.y);
    await realClickAt(centre.x, centre.y);
    await waitFor(() => expect(scaleOf(box)).toBe(2));
    // the dialog stayed open: a tap on the image is not a press on the scrim
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    await settled(dialog);
    const zoomed = box.getBoundingClientRect();
    await realClickAt(zoomed.left + zoomed.width / 2, zoomed.top + zoomed.height / 2);
    await realClickAt(zoomed.left + zoomed.width / 2, zoomed.top + zoomed.height / 2);
    await waitFor(() => expect(scaleOf(box)).toBe(1));
    await closeWithEscape();
  },
};

export const APressOutsideTheImageCloses: Story = {
  name: "A real press on the stage beside the image closes the viewer, and not one on the image",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const stage = stageOf(dialog).getBoundingClientRect();
    const rect = boxOf(dialog).getBoundingClientRect();
    await realClickAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await sleep(500);
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    // the stage is wider than the landscape image fits at this height only when it is taller; press a corner of it
    await realClickAt(stage.left + 6, stage.top + 6);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(body.getByTestId("reason")).toHaveTextContent("outside");
  },
};

export const PinchZooms: Story = {
  name: "Two fingers pinch the image in and out",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    const image = box.querySelector("img") as HTMLElement;
    const rect = box.getBoundingClientRect();
    const cy = rect.top + rect.height / 2;
    const cx = rect.left + rect.width / 2;
    touch(image, "pointerdown", 1, cx - 40, cy);
    touch(image, "pointerdown", 2, cx + 40, cy);
    for (let step = 1; step <= 6; step += 1) {
      touch(image, "pointermove", 1, cx - 40 - step * 20, cy);
      touch(image, "pointermove", 2, cx + 40 + step * 20, cy);
      await sleep(8);
    }
    await expect(scaleOf(box)).toBeGreaterThan(2);
    for (let step = 1; step <= 12; step += 1) {
      touch(image, "pointermove", 1, cx - 160 + step * 12, cy);
      touch(image, "pointermove", 2, cx + 160 - step * 12, cy);
      await sleep(8);
    }
    touch(image, "pointerup", 1, cx, cy);
    touch(image, "pointerup", 2, cx, cy);
    // pinched back in past the fitted size, it settles on the fitted size
    await waitFor(() => expect(scaleOf(box)).toBe(1));
    await closeWithEscape();
  },
};

export const SwipeMovesAndDismisses: Story = {
  name: "A swipe sideways changes the image, and one downwards closes the viewer",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const image = boxOf(dialog).querySelector("img") as HTMLElement;
    const rect = boxOf(dialog).getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    await swipe(image, { x: rect.left + rect.width * 0.8, y }, { x: rect.left + rect.width * 0.1, y });
    await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("2 / 6"));
    await waitFor(() => expect(dialog.querySelector("[data-drawn]")).not.toBeNull());
    const second = boxOf(dialog).querySelector("img") as HTMLElement;
    const next = boxOf(dialog).getBoundingClientRect();
    await swipe(second, { x: next.left + next.width * 0.1, y: next.top + next.height / 2 }, { x: next.left + next.width * 0.9, y: next.top + next.height / 2 });
    await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("1 / 6"));
    await waitFor(() => expect(dialog.querySelector("[data-drawn]")).not.toBeNull());
    const first = boxOf(dialog).querySelector("img") as HTMLElement;
    const again = boxOf(dialog).getBoundingClientRect();
    await swipe(first, { x: again.left + again.width / 2, y: again.top + 20 }, { x: again.left + again.width / 2, y: again.top + 400 });
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(body.getByTestId("reason")).toHaveTextContent("swipe");
  },
};

export const EveryControlIsReachableAndBigEnough: Story = {
  name: "Every control is at least 24px, on top at its own point, and keeps the viewer's tab order",
  render: () => <Harness thumbnails />,
  play: async () => {
    const dialog = await openViewer();
    const controls = within(dialog).getAllByRole("button");
    await expect(controls.length).toBeGreaterThan(8);
    for (const control of controls) {
      const rect = control.getBoundingClientRect();
      await expect(rect.width, control.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      await expect(control.contains(top), control.getAttribute("aria-label") ?? "").toBe(true);
    }
    // the strip is one tab stop, on the current image
    const strip = within(dialog).getByRole("group", { name: "Thumbnails" });
    await expect(strip.querySelectorAll("button[tabindex='0']").length).toBe(1);
    // tabbing goes round the viewer's own controls and never to the page behind it
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await closeWithEscape();
    await expect(document.activeElement).toBe(body.getByRole("button", { name: "Open" }));
  },
};

// The fill of a button is mixed from `bg.overlay` at 80%. Over the whitest possible photo it is a dark grey, so the white
// glyph has to clear 4.5:1 against that, in the computed styles and not the source.
function parseColour(value: string): { r: number; g: number; b: number; a: number } {
  const srgb = /color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/.exec(value);
  if (srgb) return { r: Number(srgb[1]) * 255, g: Number(srgb[2]) * 255, b: Number(srgb[3]) * 255, a: srgb[4] === undefined ? 1 : Number(srgb[4]) };
  const rgb = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)/.exec(value);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  throw new Error(`Unreadable colour: ${value}`);
}
const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

export const ControlsReadOverAnyPhoto: Story = {
  name: "A control, a button of the toolbar's actions, the counter and the caption read at 4.5:1 or better over a white photo",
  render: () => <Harness actions={<ImageViewerButton label="Copy name">Copy name</ImageViewerButton>} />,
  play: async () => {
    const dialog = await openViewer();
    const subjects = [within(dialog).getByRole("button", { name: "Close" }), within(dialog).getByRole("button", { name: "Copy name" }), counterOf(dialog), dialog.querySelector("[class*='caption']") as HTMLElement];
    for (const subject of subjects) {
      const style = getComputedStyle(subject);
      const fill = parseColour(style.backgroundColor);
      const text = parseColour(style.color);
      // composited over white: the worst case for a dark fill
      const over = { r: fill.r * fill.a + 255 * (1 - fill.a), g: fill.g * fill.a + 255 * (1 - fill.a), b: fill.b * fill.a + 255 * (1 - fill.a) };
      await expect(contrast(luminance(text), luminance(over)), subject.className).toBeGreaterThanOrEqual(4.5);
    }
    await closeWithEscape();
  },
};

export const ZoomLabelKeepsItsWidth: Story = {
  name: "The zoom button keeps its width from 100% to 400%, so the toolbar does not move",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const widths: number[] = [];
    const zoom = () => within(dialog).getByRole("button", { name: /Reset zoom/ });
    widths.push(zoom().getBoundingClientRect().width);
    const zoomIn = within(dialog).getByRole("button", { name: "Zoom in" });
    const left: number[] = [zoomIn.getBoundingClientRect().left];
    for (let step = 0; step < 5; step += 1) {
      await userEvent.keyboard("{+}");
      await nextFrame();
      widths.push(zoom().getBoundingClientRect().width);
      left.push(zoomIn.getBoundingClientRect().left);
    }
    await expect(new Set(widths.map((width) => Math.round(width))).size).toBe(1);
    await expect(new Set(left.map((value) => Math.round(value))).size).toBe(1);
    await closeWithEscape();
  },
};

export const RightToLeftMirrorsTheArrows: Story = {
  name: "Right to left puts the previous arrow on the right, mirrors its glyph, and flips the arrow keys",
  render: () => <Harness dir="rtl" />,
  play: async () => {
    const dialog = await openViewer();
    const previous = within(dialog).getByRole("button", { name: "Previous image" });
    const next = within(dialog).getByRole("button", { name: "Next image" });
    await expect(previous.getBoundingClientRect().left).toBeGreaterThan(next.getBoundingClientRect().left);
    await expect(getComputedStyle(previous.querySelector("svg") as SVGElement).scale).toBe("-1 1");
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("2 / 6"));
    await closeWithEscape();
  },
};

const emulate = (feature: string, value: string) => send("Emulation.setEmulatedMedia", { features: [{ name: feature, value }] });

export const ForcedColoursOutlinesTheChips: Story = {
  name: "In forced colours a control is outlined and the current thumbnail is marked with the system highlight",
  render: () => <Harness thumbnails />,
  play: async () => {
    const dialog = await openViewer();
    await emulate("forced-colors", "active");
    try {
      await sleep(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const close = within(dialog).getByRole("button", { name: "Close" });
      await expect(Number.parseFloat(getComputedStyle(close).borderTopWidth)).toBeGreaterThan(0);
      const current = within(dialog).getAllByRole("button").find((button) => button.getAttribute("aria-current") === "true") as HTMLElement;
      const probe = document.createElement("div");
      probe.style.color = "Highlight";
      document.body.append(probe);
      const highlight = getComputedStyle(probe).color;
      probe.remove();
      await expect(getComputedStyle(current).borderTopColor).toBe(highlight);
    } finally {
      await emulate("forced-colors", "none");
    }
    await closeWithEscape();
  },
};

export const ReducedMotionIsInstant: Story = {
  name: "Under reduced motion the zoom and the buttons do not ease",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    await userEvent.keyboard("{+}");
    const box = boxOf(dialog);
    await expect(box).toHaveAttribute("data-animate");
    await emulate("prefers-reduced-motion", "reduce");
    try {
      await sleep(300);
      await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
      await expect(getComputedStyle(box).transitionDuration).toBe("0s");
      await expect(getComputedStyle(within(dialog).getByRole("button", { name: "Close" })).transitionDuration).toBe("0s");
    } finally {
      await emulate("prefers-reduced-motion", "no-preference");
    }
    await closeWithEscape();
  },
};

export const AnImageThatFailsShowsAMessage: Story = {
  name: "An image that fails to load shows its message inside the stage, and the others still open",
  render: () => <Harness images={brokenImages} />,
  play: async () => {
    await userEvent.click(await body.findByRole("button", { name: "Open" }));
    const dialog = await body.findByRole("dialog");
    const message = await within(dialog).findByText("This image could not be loaded.");
    const stage = (message.parentElement as HTMLElement).parentElement as HTMLElement;
    const stageRect = stage.getBoundingClientRect();
    const rect = message.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(stageRect.left);
    await expect(rect.right).toBeLessThanOrEqual(stageRect.right);
    await expect(within(dialog).getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(dialog.querySelector("[data-drawn]")).not.toBeNull(), { timeout: 5000 });
    await closeWithEscape();
  },
};

export const KeepsFocusWhenAControlTurnsOff: Story = {
  name: "Zooming in to the limit with the keyboard leaves focus on the button that was pressed",
  render: () => <Harness maxZoom={1.5} />,
  play: async () => {
    const dialog = await openViewer();
    const zoomIn = within(dialog).getByRole("button", { name: "Zoom in" });
    zoomIn.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(zoomIn).toHaveAttribute("aria-disabled", "true"));
    await expect(document.activeElement).toBe(zoomIn);
    await closeWithEscape();
  },
};

export const ActionsInheritWhiteText: Story = {
  name: "Text and a link in the toolbar's actions are white, and a link keeps that instead of the browser's colour",
  render: () => <Harness actions={<><span data-testid="plain">Plain</span><a href="#top" data-testid="link">Link</a></>} />,
  play: async () => {
    const dialog = await openViewer();
    const white = getComputedStyle(within(dialog).getByRole("button", { name: "Close" })).color;
    await expect(getComputedStyle(within(dialog).getByTestId("plain")).color).toBe(white);
    await expect(getComputedStyle(within(dialog).getByTestId("link")).color).toBe(white);
    await closeWithEscape();
  },
};

const reasonOf = () => body.getByTestId("reason");

export const BackClosesTheViewer: Story = {
  name: "With closeOnHistoryBack, Back closes the viewer and no entry is left behind",
  render: () => <Harness closeOnHistoryBack />,
  play: async () => {
    const before = window.history.length;
    await openViewer();
    await expect(window.history.length).toBe(before + 1);
    window.history.back();
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(reasonOf()).toHaveTextContent("history");
    // opened again and closed by Escape, the viewer takes its own entry off and does not close twice
    await openViewer();
    const reopened = window.history.length;
    await closeWithEscape();
    await waitFor(() => expect(reasonOf()).toHaveTextContent("escape"));
    await sleep(300);
    await expect(window.history.state?.dbmImageViewer).toBeUndefined();
    await expect(reopened).toBeGreaterThanOrEqual(before + 1);
  },
};

export const ActualSizeIsOnePixelPerPixel: Story = {
  name: "1:1 draws the image at its own size in CSS pixels, and again fits it",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    await expect(box.getBoundingClientRect().width).toBeLessThan(1600);
    await userEvent.click(within(dialog).getByRole("button", { name: "Actual size, 1:1" }));
    await waitFor(() => expect(scaleOf(box)).toBeGreaterThan(1));
    await settled(dialog);
    await expect(Math.abs(box.getBoundingClientRect().width - 1600)).toBeLessThan(1);
    await expect(within(dialog).getByRole("button", { name: /Reset zoom/ })).toHaveTextContent("100%");
    await userEvent.keyboard("1");
    await waitFor(() => expect(scaleOf(box)).toBe(1));
    await closeWithEscape();
  },
};

export const TapHidesTheControlsAndAKeyShowsThem: Story = {
  name: "A single tap on the image hides the controls out of the page, a key shows them, and a double tap still zooms",
  render: () => <Harness tapToToggleControls />,
  play: async () => {
    const dialog = await openViewer();
    const rect = boxOf(dialog).getBoundingClientRect();
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    await realClickAt(centre.x, centre.y);
    await waitFor(() => expect(dialog).toHaveAttribute("data-chrome", "hidden"), { timeout: 2000 });
    const close = within(dialog).getByRole("button", { name: "Close", hidden: true });
    await waitFor(() => expect(getComputedStyle(close).visibility).toBe("hidden"));
    await expect(within(dialog).queryByRole("button", { name: "Close" })).toBeNull();
    await userEvent.keyboard("x");
    await waitFor(() => expect(dialog).not.toHaveAttribute("data-chrome"));
    await expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    // two quick clicks zoom and do not hide anything
    await realClickAt(centre.x, centre.y);
    await realClickAt(centre.x, centre.y);
    await waitFor(() => expect(scaleOf(boxOf(dialog))).toBe(2));
    await sleep(500);
    await expect(dialog).not.toHaveAttribute("data-chrome");
    await closeWithEscape();
  },
};

export const DragPastAnEdgeGivesThenSettles: Story = {
  name: "A drag past an edge is followed a little way, and the image settles back inside when let go",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    await userEvent.keyboard("{+}{+}");
    await waitFor(() => expect(scaleOf(box)).toBeCloseTo(2.25, 5));
    await settled(dialog);
    const stage = stageOf(dialog).getBoundingClientRect();
    const rect = box.getBoundingClientRect();
    const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const limitX = (rect.width - stage.width) / 2;
    await realMouse("mouseMoved", start.x, start.y);
    await realMouse("mousePressed", start.x, start.y, { button: "left", clickCount: 1 });
    for (let step = 1; step <= 8; step += 1) {
      await realMouse("mouseMoved", start.x + step * (limitX / 2 + 40), start.y, { button: "left", buttons: 1 });
      await nextFrame();
    }
    const held = translationOf(box).x;
    // past the edge, by some, and by less than the finger went
    await expect(held).toBeGreaterThan(limitX + 1);
    await expect(held).toBeLessThanOrEqual(limitX + 65);
    await realMouse("mouseReleased", start.x + 8 * (limitX / 2 + 40), start.y, { button: "left", clickCount: 1 });
    await waitFor(() => expect(Math.abs(translationOf(box).x - limitX)).toBeLessThan(1));
    await closeWithEscape();
  },
};

export const AQuickReleaseCarriesOnThenStops: Story = {
  name: "A pan let go quickly coasts a little further, inside the edges, and stops by itself",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    const box = boxOf(dialog);
    await userEvent.keyboard("{+}{+}{+}");
    await waitFor(() => expect(scaleOf(box)).toBeGreaterThan(3));
    await settled(dialog);
    // from the middle of the stage: a zoomed image is far larger than the screen, so a point of it can be off it
    const area = stageOf(dialog).getBoundingClientRect();
    const start = { x: area.left + area.width * 0.7, y: area.top + area.height / 2 };
    await realMouse("mouseMoved", start.x, start.y);
    await realMouse("mousePressed", start.x, start.y, { button: "left", clickCount: 1 });
    for (let step = 1; step <= 5; step += 1) {
      await realMouse("mouseMoved", start.x - step * 28, start.y, { button: "left", buttons: 1 });
      await nextFrame();
    }
    await realMouse("mouseReleased", start.x - 140, start.y, { button: "left", clickCount: 1 });
    const atRelease = translationOf(box).x;
    await sleep(900);
    const later = translationOf(box).x;
    await expect(later).toBeLessThan(atRelease - 2);
    const stage = stageOf(dialog).getBoundingClientRect();
    await expect(box.getBoundingClientRect().right).toBeGreaterThanOrEqual(stage.right - 1);
    // stopped
    await sleep(300);
    await expect(Math.abs(translationOf(box).x - later)).toBeLessThan(0.5);
    await closeWithEscape();
  },
};

export const OriginEasesTheImageIn: Story = {
  name: "The first image starts at the rectangle of getOrigin's element and eases to its own place",
  render: () => (
    <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
      <div id="origin-thumb" style={{ inlineSize: "120px", blockSize: "80px", background: "gray", marginBlock: "2rem" }} />
      <Harness getOrigin={() => document.getElementById("origin-thumb")} />
    </div>
  ),
  play: async () => {
    const seen: string[] = [];
    const observer = new MutationObserver(() => {
      const box = document.querySelector<HTMLElement>("[data-drawn]");
      if (box && box.style.transform && seen[seen.length - 1] !== box.style.transform) seen.push(box.style.transform);
    });
    observer.observe(document.body, { subtree: true, attributes: true, childList: true, attributeFilter: ["style", "data-drawn"] });
    try {
      const dialog = await openViewer();
      const box = boxOf(dialog);
      await expect(seen.some((transform) => scaleOf({ style: { transform } } as unknown as HTMLElement) < 0.5)).toBe(true);
      await settled(dialog);
      await expect(scaleOf(box)).toBe(1);
      await expect(translationOf(box)).toEqual({ x: 0, y: 0 });
    } finally {
      observer.disconnect();
    }
    await closeWithEscape();
  },
};

export const SlideshowStepsPausesAndHolds: Story = {
  name: "A slideshow steps by itself, pauses on its button, and holds while the image is zoomed",
  render: () => <Harness autoPlay={{ interval: 700 }} />,
  play: async () => {
    const dialog = await openViewer();
    await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("2 / 6"), { timeout: 4000 });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause slideshow" }));
    const at = counterOf(dialog).textContent;
    await sleep(1800);
    await expect(counterOf(dialog).textContent).toBe(at);
    await userEvent.click(within(dialog).getByRole("button", { name: "Start slideshow" }));
    await userEvent.keyboard("{+}");
    await waitFor(() => expect(scaleOf(boxOf(dialog))).toBeGreaterThan(1));
    const held = counterOf(dialog).textContent;
    await sleep(2000);
    await expect(counterOf(dialog).textContent).toBe(held);
    await closeWithEscape();
  },
};

export const InlineSitsInThePage: Story = {
  name: "An inline viewer is in the page's flow, takes keys when focused, shows its focus ring, and ignores Escape",
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <button type="button">Before</button>
      <div data-testid="frame" style={{ blockSize: "24rem", marginBlock: "1rem" }}>
        <ImageViewer inline aria-label="Photos" images={sampleImages} thumbnails />
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async () => {
    const group = await body.findByRole("group", { name: "Photos" });
    const frame = body.getByTestId("frame").getBoundingClientRect();
    const rect = group.getBoundingClientRect();
    await expect(Math.abs(rect.height - frame.height)).toBeLessThan(1);
    await expect(Math.abs(rect.width - frame.width)).toBeLessThan(1);
    await expect(body.queryByRole("dialog")).toBeNull();
    await userEvent.tab();
    await userEvent.tab();
    await expect(document.activeElement).toBe(group);
    await expect(getComputedStyle(group).outlineStyle).toBe("solid");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(within(group).getByText(/^\S+ \/ \S+$/)).toHaveTextContent("2 / 6"));
    await userEvent.keyboard("{Escape}");
    await expect(group).toBeInTheDocument();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(document.activeElement).not.toBe(group);
  },
};

export const ALongStripIsWindowed: Story = {
  name: "A 500-image strip draws a few dozen buttons, keeps its full length, and follows a scroll",
  render: () => (
    <div style={{ inlineSize: "40rem", blockSize: "26rem", padding: "var(--dbm-space-4)" }}>
      <ImageViewer inline aria-label="Many" images={getManyImages()} thumbnails defaultValue={250} />
    </div>
  ),
  play: async () => {
    const group = await body.findByRole("group", { name: "Many" });
    const strip = await within(group).findByRole("group", { name: "Thumbnails" });
    await waitFor(() => expect(within(strip).getByRole("button", { name: "Show image 251 of 500" })).toHaveAttribute("aria-current", "true"));
    await settled(group);
    const before = within(strip).getAllByRole("button").length;
    await expect(before, `width ${strip.clientWidth}, scrolled ${strip.scrollLeft}, window ${window.innerWidth}`).toBeLessThan(60);
    const first = within(strip).getAllByRole("button")[0] as HTMLElement;
    const pitch = first.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(strip).columnGap);
    // the strip is as long as 500 thumbnails, give or take padding
    await expect(Math.abs(strip.scrollWidth - 500 * pitch)).toBeLessThan(pitch * 3);
    strip.scrollLeft = 40 * pitch;
    await waitFor(() => expect(within(strip).queryByRole("button", { name: "Show image 41 of 500" })).not.toBeNull());
    await expect(within(strip).getAllByRole("button").length).toBeLessThan(60);
    // the current image still has the tab stop wherever the strip has been scrolled to
    await expect(strip.querySelectorAll("button[tabindex='0']").length).toBe(1);
  },
};

export const NarrowScreenKeepsEveryControlInside: Story = {
  name: "At phone width every control is inside the viewer, none overlap, and nothing scrolls sideways",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Harness
      flippable
      thumbnails
      autoPlay
      actions={<ImageViewerButton label="Copy name">Copy name</ImageViewerButton>}
    />
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(400);
    const dialog = await openViewer();
    const panel = dialog.getBoundingClientRect();
    // a thumbnail scrolled out of its strip is clipped by the strip, which is what a scrolling strip is
    const strip = within(dialog).getByRole("group", { name: "Thumbnails" }).getBoundingClientRect();
    await expect(strip.left).toBeGreaterThanOrEqual(panel.left - 0.5);
    await expect(strip.right).toBeLessThanOrEqual(panel.right + 0.5);
    const buttons = within(dialog)
      .getAllByRole("button")
      .filter((button) => button.getBoundingClientRect().width > 0 && !button.closest("[aria-label='Thumbnails']"));
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      await expect(rect.left, button.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(panel.left - 0.5);
      await expect(rect.right, button.getAttribute("aria-label") ?? "").toBeLessThanOrEqual(panel.right + 0.5);
    }
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth + 1);
    // the toolbar's own buttons do not sit on top of one another
    const toolbar = Array.from(dialog.querySelectorAll<HTMLElement>("[class*='toolbar'] button"));
    for (const [index, one] of toolbar.entries()) {
      for (const other of toolbar.slice(index + 1)) {
        const a = one.getBoundingClientRect();
        const b = other.getBoundingClientRect();
        const overlap = a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        await expect(overlap, `${one.getAttribute("aria-label")} over ${other.getAttribute("aria-label")}`).toBe(false);
      }
    }
    await closeWithEscape();
  },
};

export const AStepEntersFromTheSideItCameFrom: Story = {
  name: "A step eases the new image in from the side it came from, and under reduced motion only fades",
  render: () => <Harness />,
  play: async () => {
    const dialog = await openViewer();
    await userEvent.keyboard("{PageDown}");
    await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("2 / 6"));
    await waitFor(() => expect(boxOf(dialog)).toHaveAttribute("data-enter", "next"));
    await expect(getComputedStyle(boxOf(dialog)).animationName).toContain("viewerEnterFromEnd");
    await emulate("prefers-reduced-motion", "reduce");
    try {
      await userEvent.keyboard("{PageUp}");
      await waitFor(() => expect(counterOf(dialog)).toHaveTextContent("1 / 6"));
      await waitFor(() => expect(boxOf(dialog)).toHaveAttribute("data-enter", "previous"));
      await expect(getComputedStyle(boxOf(dialog)).animationName).toContain("viewerImageIn");
    } finally {
      await emulate("prefers-reduced-motion", "no-preference");
    }
    await closeWithEscape();
  },
};

export const HidingTheControlsKeepsFocusInTheViewer: Story = {
  name: "A tap that hides the controls leaves focus in the viewer, even when a toolbar button had it, and a key brings them back",
  render: () => <Harness tapToToggleControls />,
  play: async () => {
    const dialog = await openViewer();
    const rotate = within(dialog).getByRole("button", { name: "Rotate clockwise" });
    rotate.focus();
    await expect(document.activeElement).toBe(rotate);
    const rect = boxOf(dialog).getBoundingClientRect();
    await realClickAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await waitFor(() => expect(dialog).toHaveAttribute("data-chrome", "hidden"), { timeout: 2000 });
    // a press on the image moves focus to the viewer (the nearest focusable ancestor), so the hidden button does not hold it; once
    // the toolbar is really hidden the browser would otherwise have dropped focus to the page, so wait for that, then look
    await waitFor(() => expect(getComputedStyle(rotate).visibility).toBe("hidden"));
    await sleep(100);
    await expect(document.activeElement).toBe(dialog);
    await userEvent.keyboard("x");
    await waitFor(() => expect(dialog).not.toHaveAttribute("data-chrome"));
    await closeWithEscape();
  },
};

export const AFocusedThumbnailHasARingOutsideThePicture: Story = {
  name: "A focused thumbnail's ring is outside the picture, white, with a dark band between them",
  render: () => <Harness thumbnails />,
  play: async () => {
    const dialog = await openViewer();
    const strip = within(dialog).getByRole("group", { name: "Thumbnails" });
    const thumbnail = strip.querySelector<HTMLElement>("button[aria-current]") as HTMLElement;
    // a key first, so the browser treats the focus that follows as the keyboard's
    await userEvent.keyboard("{Shift}");
    thumbnail.focus({ focusVisible: true } as FocusOptions);
    await expect(thumbnail.matches(":focus-visible")).toBe(true);
    const style = getComputedStyle(thumbnail);
    await expect(Number.parseFloat(style.outlineOffset)).toBeGreaterThan(0);
    await expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    const ring = parseColour(style.outlineColor);
    await expect(ring).toMatchObject({ r: 255, g: 255, b: 255 });
    // the band between the picture and the ring is the stage's own dark, so the ring reads whatever the picture is
    const band = parseColour(/(rgba?\([^)]*\)|color\([^)]*\))/.exec(style.boxShadow)?.[1] ?? "");
    await expect(contrast(luminance(ring), luminance(band))).toBeGreaterThanOrEqual(4.5);
    // and there is room for it in the strip, which would clip it
    const room = strip.getBoundingClientRect();
    const own = thumbnail.getBoundingClientRect();
    await expect(own.top - room.top).toBeGreaterThanOrEqual(6);
    await expect(room.bottom - own.bottom).toBeGreaterThanOrEqual(6);
    await closeWithEscape();
  },
};

export const InlineLeavesScrollingToThePage: Story = {
  name: "An inline viewer lets the page scroll under a plain wheel and a touch until it is zoomed, and zooms with the control key",
  render: () => (
    <div style={{ blockSize: "250vh", padding: "var(--dbm-space-4)" }}>
      <div style={{ blockSize: "24rem" }}>
        <ImageViewer inline aria-label="Photos" images={sampleImages} />
      </div>
    </div>
  ),
  play: async () => {
    const group = await body.findByRole("group", { name: "Photos" });
    await waitFor(() => expect(group.querySelector("[data-drawn]")).not.toBeNull(), { timeout: 5000 });
    await settled(group);
    const box = boxOf(group);
    const stage = stageOf(group);
    await expect(getComputedStyle(stage).touchAction).toBe("pan-y");
    const area = stage.getBoundingClientRect();
    const at = { x: area.left + area.width / 2, y: area.top + area.height / 2 };
    const scrolled = window.scrollY;
    await realWheel(at.x, at.y, 300);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(scrolled));
    await expect(scaleOf(box)).toBe(1);
    window.scrollTo(0, 0);
    await sleep(100);
    const again = stage.getBoundingClientRect();
    // the control key is a trackpad pinch, and zooms the image and leaves the page where it is
    const top = window.scrollY;
    await realMouse("mouseWheel", again.left + again.width / 2, again.top + again.height / 2, { deltaX: 0, deltaY: -240, modifiers: 2 });
    await waitFor(() => expect(scaleOf(box)).toBeGreaterThan(1));
    await expect(window.scrollY).toBe(top);
    await expect(stage).toHaveAttribute("data-zoomed");
    await expect(getComputedStyle(stage).touchAction).toBe("none");
  },
};

export const AnInlineViewerDoesNotScrollThePage: Story = {
  name: "An inline viewer with a thumbnail strip, far down a page, does not scroll the page when it appears or the image changes",
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <div style={{ blockSize: "150vh" }}>A long page above the viewer</div>
      <div style={{ blockSize: "24rem" }}>
        <ImageViewer inline aria-label="Photos" images={sampleImages} thumbnails defaultValue={3} />
      </div>
      <div style={{ blockSize: "100vh" }} />
    </div>
  ),
  play: async () => {
    const group = await body.findByRole("group", { name: "Photos" });
    await waitFor(() => expect(group.querySelector("[data-drawn]")).not.toBeNull(), { timeout: 5000 });
    await sleep(500);
    await expect(window.scrollY).toBe(0);
    // the strip still follows the image: the current thumbnail is inside it
    const strip = within(group).getByRole("group", { name: "Thumbnails" }).getBoundingClientRect();
    const current = group.querySelector("button[aria-current]") as HTMLElement;
    const own = current.getBoundingClientRect();
    await expect(own.left).toBeGreaterThanOrEqual(strip.left - 1);
    await expect(own.right).toBeLessThanOrEqual(strip.right + 1);
    // stepping with the page scrolled elsewhere leaves the page where it is
    window.scrollTo(0, 120);
    await sleep(100);
    // focusing scrolls to the element by itself, which is the browser's and not what is being checked
    group.focus({ preventScroll: true });
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(within(group).getByText(/^\S+ \/ \S+$/)).toHaveTextContent("5 / 6"));
    await sleep(300);
    await expect(window.scrollY).toBe(120);
  },
};
