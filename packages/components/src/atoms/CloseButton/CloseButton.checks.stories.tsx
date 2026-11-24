import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { CloseButton } from "./CloseButton";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`, as ADR-0013
// keeps a sub-part's documentation out of the sidebar): each tone's computed icon colour and its hover fill under a real pointer.
const meta: Meta = {
  title: "Components/CloseButton/Checks",
  id: "atoms-inputs-closebutton-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

// A real pointer, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which never set `:hover`.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
async function pointAt(element: Element | null) {
  const rect = element?.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect ? rect.left + rect.width / 2 : -10) * scale;
  const y = (frame?.top ?? 0) + (rect ? rect.top + rect.height / 2 : -10) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

/** Resolves a token to the colour the browser computes for it, on a probe element (so a theme's own values are compared, not hard-coded). */
function resolve(property: "color" | "backgroundColor", token: string) {
  const probe = document.createElement("div");
  probe.style[property] = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
}

export const ToneColours: Story = {
  name: "Each tone's icon colour at rest and its hover fill under a real pointer",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)" }}>
      <CloseButton aria-label="Neutral" />
      <CloseButton aria-label="Brand" tone="brand" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = [
      { name: "Neutral", icon: "--dbm-icon-default", hover: "--dbm-bg-neutral-subtle" },
      { name: "Brand", icon: "--dbm-icon-brand", hover: "--dbm-bg-brand-subtle-hover" },
    ];
    for (const { name, icon, hover } of cases) {
      const button = canvas.getByRole("button", { name });
      // resolved once, before any waitFor: waitFor re-runs its callback on every DOM mutation, and the probe's own append and remove
      // would be one, so resolving inside the callback re-triggers it without end
      const hoverFill = resolve("backgroundColor", hover);
      expect(getComputedStyle(button).color).toBe(resolve("color", icon));
      expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      await pointAt(button);
      // the fill eases in over the fast motion duration, so it is read once it has settled
      await waitFor(() => expect(getComputedStyle(button).backgroundColor).toBe(hoverFill), { timeout: 2000 });
      await pointAt(null);
      await waitFor(() => expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)"), { timeout: 2000 });
    }
  },
};

/** Resolves any CSS colour expression the way the browser computes it, on a probe element. */
function resolveExpression(value: string) {
  const probe = document.createElement("div");
  probe.style.backgroundColor = value;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}

/** Reads any CSS colour as sRGB channels (and alpha), by painting one pixel of it on a canvas. */
function channels(color: string): [number, number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!, a!];
}

/** A translucent colour drawn over an opaque one, as an opaque colour string. */
function over(top: string, bottom: string): string {
  const [r, g, b, a] = channels(top);
  const [br, bg, bb] = channels(bottom);
  const mix = (front: number, back: number) => Math.round((front * a + back * (255 - a)) / 255);
  return `rgb(${mix(r, br)}, ${mix(g, bg)}, ${mix(b, bb)})`;
}

function contrast(foreground: string, background: string): number {
  const luminance = ([r, g, b]: number[]) => {
    const channel = (value: number) => {
      const scaled = value / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
  };
  const a = luminance(channels(foreground));
  const b = luminance(channels(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const tab = async () => {
  for (const type of ["keyDown", "keyUp"]) {
    await send("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  }
};

export const WhiteTone: Story = {
  name: "tone white: the icon, the translucent hover fill, the dark grounding layer and the white focus ring",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)", background: "var(--dbm-bg-overlay)", padding: "var(--dbm-space-6)" }}>
      <CloseButton aria-label="White" tone="white" />
      <CloseButton aria-label="White grounded" tone="white" hasBackground />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByRole("button", { name: "White" });
    const grounded = canvas.getByRole("button", { name: "White grounded" });
    const hoverFill = resolveExpression("color-mix(in srgb, var(--dbm-icon-white) calc(var(--dbm-opacity-20) * 100%), transparent)");
    expect(getComputedStyle(plain).color).toBe(resolve("color", "--dbm-icon-white"));
    expect(getComputedStyle(plain).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // the grounding layer is the dark overlay, not the light scrim a white icon would vanish on
    expect(getComputedStyle(grounded, "::before").backgroundColor).toBe(resolve("backgroundColor", "--dbm-bg-overlay"));
    expect(getComputedStyle(grounded, "::before").backgroundColor).not.toBe(resolve("backgroundColor", "--dbm-bg-scrim"));
    // the icon holds 4.5:1 on the surface it is for, and on its own hover fill over that surface
    const surface = resolve("backgroundColor", "--dbm-bg-overlay");
    const icon = getComputedStyle(plain).color;
    expect(contrast(icon, surface)).toBeGreaterThanOrEqual(4.5);
    await pointAt(plain);
    await waitFor(() => expect(getComputedStyle(plain).backgroundColor).toBe(hoverFill), { timeout: 2000 });
    expect(contrast(icon, over(getComputedStyle(plain).backgroundColor, surface))).toBeGreaterThanOrEqual(4.5);
    await pointAt(null);
    await waitFor(() => expect(getComputedStyle(plain).backgroundColor).toBe("rgba(0, 0, 0, 0)"), { timeout: 2000 });
    // a real Tab key sets :focus-visible, which synthetic events do not
    (document.activeElement as HTMLElement | null)?.blur();
    await tab();
    await waitFor(() => expect(plain).toHaveFocus(), { timeout: 2000 });
    expect(getComputedStyle(plain).outlineColor).toBe(resolve("color", "--dbm-border-white"));
  },
};
