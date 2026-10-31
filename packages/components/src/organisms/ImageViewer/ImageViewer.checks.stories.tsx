import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { ImageViewer, ImageViewerButton } from "./ImageViewer";
import type { ImageViewerProps } from "./ImageViewer.types";
import { brokenImages, sampleImages } from "./ImageViewerStoryKit";

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
const counterOf = (dialog: HTMLElement) => within(dialog).getByTestId("image-viewer-counter");

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
