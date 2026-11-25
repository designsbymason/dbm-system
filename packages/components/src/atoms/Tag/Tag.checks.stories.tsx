import { TagIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Tag } from "./Tag";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`, as ADR-0013
// keeps a sub-part's documentation out of the sidebar): the label colour of a hovered tag and its contrast on the hover fill, and what a
// label longer than its container does.
const meta: Meta = {
  title: "Components/Tag/Checks",
  id: "atoms-data-display-tag-checks",
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

/** Reads any CSS colour as sRGB channels, by painting one pixel of it on a canvas. */
function channels(color: string): number[] {
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

const TONES = ["info", "warning", "danger"] as const;
const VARIANTS = ["subtle", "outlined"] as const;

export const HoverLabelContrast: Story = {
  name: "hover: the subtle and outlined info, warning and danger labels hold 4.5:1 on their hover fill",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", padding: "var(--dbm-space-6)" }}>
      {VARIANTS.flatMap((variant) =>
        TONES.map((tone) => (
          <Tag key={`${variant}-${tone}`} variant={variant} tone={tone} onClick={() => {}}>
            {`${variant} ${tone}`}
          </Tag>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const tag = canvas.getByRole("button", { name: `${variant} ${tone}` });
        const resting = getComputedStyle(tag).color;
        // resolved before the wait: `resolve` adds and removes an element, which would re-trigger `waitFor`'s own DOM observer
        const hoverFill = resolve("backgroundColor", `--dbm-bg-${tone}-subtle-hover`);
        const hoverLabel = resolve("color", `--dbm-text-${tone}-hover`);
        await pointAt(tag);
        await waitFor(() => expect(getComputedStyle(tag).backgroundColor).toBe(hoverFill), { timeout: 2000 });
        // the hover colour is the dedicated token, and it holds 4.5:1 on the hover fill
        expect(getComputedStyle(tag).color).toBe(hoverLabel);
        expect(contrast(getComputedStyle(tag).color, getComputedStyle(tag).backgroundColor)).toBeGreaterThanOrEqual(4.5);
        await pointAt(null);
        await waitFor(() => expect(getComputedStyle(tag).color).toBe(resting), { timeout: 2000 });
      }
    }
  },
};

/** Resolves a length token to the pixels the browser computes for it, on a probe element. */
function lengthOf(token: string) {
  const probe = document.createElement("div");
  probe.style.inlineSize = `var(${token})`;
  document.body.append(probe);
  const value = probe.getBoundingClientRect().width;
  probe.remove();
  return value;
}

export const LongLabel: Story = {
  name: "a label longer than its container is shortened with an ellipsis, and the tag never outgrows the container",
  render: () => (
    <div data-testid="box" style={{ inlineSize: "12rem", display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      <Tag data-testid="long" leadingIcon={TagIcon} removable onRemove={() => {}}>
        A deliberately long label that a real filter might show, well past the room it has
      </Tag>
      <Tag data-testid="short" leadingIcon={TagIcon}>
        Design
      </Tag>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("box").getBoundingClientRect();
    const long = canvas.getByTestId("long");
    const label = long.querySelector("span") as HTMLElement;
    // the tag stops at its container, and the text inside is what gives way
    expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(box.width + 0.5);
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    // the icon and the remove button keep their size, and the remove button stays inside the tag
    const icon = long.querySelector("svg") as SVGElement;
    const remove = canvas.getByRole("button", { name: /^Remove A deliberately long label/ });
    expect(icon.getBoundingClientRect().width).toBeCloseTo(lengthOf("--dbm-icon-size-sm"), 0);
    expect(remove.getBoundingClientRect().width).toBeCloseTo(lengthOf("--dbm-icon-size-sm"), 0);
    expect(remove.getBoundingClientRect().right).toBeLessThanOrEqual(long.getBoundingClientRect().right + 0.5);
    // a short label still hugs its text and is not shortened
    const short = canvas.getByTestId("short");
    expect(short.getBoundingClientRect().width).toBeLessThan(box.width / 2);
    const shortLabel = short.querySelector("span") as HTMLElement;
    expect(shortLabel.scrollWidth).toBeLessThanOrEqual(shortLabel.clientWidth);
  },
};
