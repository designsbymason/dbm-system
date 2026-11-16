import { HeartIcon, TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { IconButton } from "./IconButton";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`, as ADR-0013
// keeps a sub-part's documentation out of the sidebar): the caption's real contrast, the box it makes, and a real pointer over it.
const meta: Meta = {
  title: "Components/IconButton/Checks",
  id: "atoms-inputs-iconbutton-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

/** Reads any CSS colour (the tokens are OKLCH) as sRGB channels, by painting one pixel of it. */
function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(toRgb(foreground));
  const b = luminance(toRgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const px = (value: string) => Number.parseFloat(value);
const tokenColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);
const surface = () => tokenColor("--dbm-bg-surface");
const background = (element: HTMLElement) => {
  const own = getComputedStyle(element).backgroundColor;
  return own === "rgba(0, 0, 0, 0)" ? surface() : own;
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 250));

// A real pointer, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which never set `:hover`.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
async function pointAt(element: Element | null, press = false) {
  const rect = element?.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect ? rect.left + rect.width / 2 : -10) * scale;
  const y = (frame?.top ?? 0) + (rect ? rect.top + rect.height / 2 : -10) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  if (press) {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }
}

const variants = ["primary", "secondary", "tertiary", "ghost"] as const;

function Grid({ pressed = false }: { pressed?: boolean }) {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
          {variants.map((variant) => (
            <IconButton
              key={variant}
              icon={TrashIcon}
              tone={tone}
              variant={variant}
              aria-label={`${tone} ${variant} delete`}
              label={variant}
              defaultPressed={pressed ? true : undefined}
            />
          ))}
          {tone === "brand" && (
            <IconButton icon={TrashIcon} variant="destructive" aria-label="destructive delete" label="destructive" defaultPressed={pressed ? true : undefined} />
          )}
        </div>
      ))}
    </div>
  );
}

const captionOf = (button: HTMLElement) => button.querySelector<HTMLElement>("[data-label]")!;

export const CaptionContrastAtRest: Story = {
  name: "The caption meets 4.5:1 on its fill, for every tone and variant at rest",
  render: () => <Grid />,
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll<HTMLElement>("button")];
    expect(buttons).toHaveLength(9);
    for (const button of buttons) {
      expect(contrast(getComputedStyle(captionOf(button)).color, background(button))).toBeGreaterThanOrEqual(4.5);
    }
  },
};

export const CaptionContrastPressed: Story = {
  name: "The pressed caption meets 4.5:1 on its pressed fill, in bold",
  render: () => <Grid pressed />,
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll<HTMLElement>("button")];
    expect(buttons).toHaveLength(9);
    for (const button of buttons) {
      const caption = getComputedStyle(captionOf(button));
      expect(caption.fontWeight).toBe("700");
      expect(contrast(caption.color, background(button))).toBeGreaterThanOrEqual(4.5);
    }
  },
};

export const CaptionContrastUnderThePointer: Story = {
  name: "The caption keeps 4.5:1 with the pointer over it, and a pointer over the caption hovers the whole button",
  render: () => <Grid />,
  play: async ({ canvasElement }) => {
    for (const button of [...canvasElement.querySelectorAll<HTMLElement>("button")]) {
      const resting = background(button);
      // over the caption, not the icon: the caption is part of the button
      await pointAt(captionOf(button));
      await waitFor(() => expect(background(button)).not.toBe(resting));
      await settle();
      expect(contrast(getComputedStyle(captionOf(button)).color, background(button))).toBeGreaterThanOrEqual(4.5);
      await pointAt(null);
      await settle();
    }
  },
};

export const CaptionedBoxIsTallerAndNeverNarrower: Story = {
  name: "A captioned button is taller than the plain square and never narrower; from a width the square returns below it",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "start", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      <IconButton icon={HeartIcon} aria-label="Plain favorite" />
      <IconButton icon={HeartIcon} aria-label="Always favorite" label="Favorite" />
      <IconButton icon={HeartIcon} aria-label="Wide favorite" label="Favorite" hideLabelBelow="3xl" />
      <IconButton icon={HeartIcon} aria-label="Narrow Fav" label="Fav" size="xs" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(window.innerWidth).toBeLessThan(1920);
    const plain = canvas.getByRole("button", { name: "Plain favorite" }).getBoundingClientRect();
    const always = canvas.getByRole("button", { name: "Always favorite" });
    const alwaysBox = always.getBoundingClientRect();
    expect(getComputedStyle(captionOf(always)).display).not.toBe("none");
    expect(alwaysBox.height).toBeGreaterThan(plain.height + 8);
    expect(alwaysBox.width).toBeGreaterThanOrEqual(plain.width);
    // the caption is under the icon, inside the button
    const caption = captionOf(always).getBoundingClientRect();
    const icon = always.querySelector("svg")!.getBoundingClientRect();
    expect(caption.top).toBeGreaterThanOrEqual(icon.bottom - 1);
    expect(caption.bottom).toBeLessThanOrEqual(alwaysBox.bottom + 0.5);
    // below the step: no caption, and exactly the plain square
    const wide = canvas.getByRole("button", { name: "Wide favorite" });
    expect(getComputedStyle(captionOf(wide)).display).toBe("none");
    expect(Math.round(wide.getBoundingClientRect().width)).toBe(Math.round(plain.width));
    expect(Math.round(wide.getBoundingClientRect().height)).toBe(Math.round(plain.height));
    // a short caption on a small button doesn't make it narrower than the square of its step
    const small = canvas.getByRole("button", { name: "Narrow Fav" });
    expect(small.getBoundingClientRect().width).toBeGreaterThanOrEqual(px(getComputedStyle(document.documentElement).getPropertyValue("--dbm-icon-button-size-xs")) - 0.5);
  },
};

export const PressingDoesNotResizeTheBox: Story = {
  name: "Pressing a captioned toggle doesn't change the width of its box, and a click on the caption presses it",
  render: () => (
    <div style={{ background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)", display: "flex" }}>
      <IconButton icon={HeartIcon} aria-label="Favorite" label="Favorite" variant="ghost" defaultPressed={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Favorite" });
    const before = button.getBoundingClientRect();
    expect(button).toHaveAttribute("aria-pressed", "false");
    // a real click on the caption, not the icon
    await pointAt(captionOf(button), true);
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    await settle();
    const after = button.getBoundingClientRect();
    expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
    expect(Math.abs(after.height - before.height)).toBeLessThan(0.5);
    expect(getComputedStyle(captionOf(button)).fontWeight).toBe("700");
    await pointAt(null);
  },
};

export const FocusRingCoversTheWholeBox: Story = {
  name: "The focus ring is drawn around the whole captioned box",
  render: () => (
    <div style={{ background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-8)" }}>
      <IconButton icon={HeartIcon} aria-label="Favorite" label="Favorite" variant="tertiary" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Favorite" });
    // a real Tab key, through the Chrome DevTools Protocol: a synthetic one never sets `:focus-visible`
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await waitFor(() => expect(button).toHaveFocus());
    const style = getComputedStyle(button);
    expect(style.outlineStyle).toBe("solid");
    expect(px(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    // the outline is on the button, whose box contains the caption
    expect(button.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(captionOf(button).getBoundingClientRect().bottom - 0.5);
  },
};
