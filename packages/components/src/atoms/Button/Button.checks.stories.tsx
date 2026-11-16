import { TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { IconButton } from "../IconButton";
import { Button } from "./Button";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`, as
// ADR-0013 keeps a sub-part's documentation out of the sidebar): here, the real contrast of the neutral tone's
// pairings in the theme the story runs in. `guidelines/03-token-system-spec.md` has the method; the pairings were also
// computed from the tokens for all four themes (Purple and Emerald, light and dark) when the tone was added.
const meta: Meta = {
  title: "Components/Button/Checks",
  id: "atoms-inputs-button-checks",
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

const variants = ["primary", "secondary", "tertiary", "ghost"] as const;
const tokenColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

// What a button with no fill of its own sits on: the stories put them on the surface token.
const surface = () => tokenColor("--dbm-bg-surface");

function Neutral() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      {variants.map((variant) => (
        <Button key={variant} tone="neutral" variant={variant}>
          {variant}
        </Button>
      ))}
      {variants.map((variant) => (
        <IconButton key={variant} tone="neutral" variant={variant} icon={TrashIcon} aria-label={`${variant} icon`} />
      ))}
    </div>
  );
}

const background = (element: HTMLElement) => {
  const own = getComputedStyle(element).backgroundColor;
  return own === "rgba(0, 0, 0, 0)" ? tokenColor("--dbm-bg-surface") : own;
};

export const NeutralLabelsAndIconsAtRest: Story = {
  name: "The neutral tone's labels meet 4.5:1 and its icons and outlines 3:1, at rest",
  render: () => <Neutral />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      const button = canvas.getByRole("button", { name: variant });
      expect(contrast(getComputedStyle(button).color, background(button))).toBeGreaterThanOrEqual(4.5);
      const iconButton = canvas.getByRole("button", { name: `${variant} icon` });
      expect(contrast(getComputedStyle(iconButton).color, background(iconButton))).toBeGreaterThanOrEqual(3);
    }
    // the filled primary is a boundary of its own against the page, and the secondary's outline is the boundary of an outlined one
    for (const name of ["primary", "primary icon"]) {
      const button = canvas.getByRole("button", { name });
      expect(contrast(getComputedStyle(button).backgroundColor, surface())).toBeGreaterThanOrEqual(3);
    }
    for (const name of ["secondary", "secondary icon"]) {
      const button = canvas.getByRole("button", { name });
      expect(contrast(getComputedStyle(button).borderTopColor, surface())).toBeGreaterThanOrEqual(3);
    }
  },
};

export const NeutralLabelsAndIconsOnHover: Story = {
  name: "The neutral tone's labels and icons keep their contrast under the pointer",
  render: () => <Neutral />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      for (const [name, minimum] of [[variant, 4.5], [`${variant} icon`, 3]] as const) {
        const button = canvas.getByRole("button", { name });
        const resting = background(button);
        await pointAt(button);
        // the fill moves to the hover token over a short transition
        await waitFor(() => expect(background(button)).not.toBe(resting));
        await new Promise((resolve) => setTimeout(resolve, 250));
        expect(contrast(getComputedStyle(button).color, background(button))).toBeGreaterThanOrEqual(minimum);
        await pointAt(null);
      }
    }
  },
};

export const HoverFills: Story = {
  name: "Secondary and tertiary hover on the subtle fill, ghost on the hover fill, in both tones",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
          {(["secondary", "tertiary", "ghost"] as const).map((variant) => (
            <Button key={variant} tone={tone} variant={variant}>
              {tone} {variant}
            </Button>
          ))}
          {(["secondary", "tertiary", "ghost"] as const).map((variant) => (
            <IconButton key={variant} tone={tone} variant={variant} icon={TrashIcon} aria-label={`${tone} ${variant} icon`} />
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const tone of ["brand", "neutral"] as const) {
      for (const variant of ["secondary", "tertiary", "ghost"] as const) {
        const expected = toRgb(tokenColor(`--dbm-bg-${tone}-subtle${variant === "ghost" ? "-hover" : ""}`));
        for (const name of [`${tone} ${variant}`, `${tone} ${variant} icon`]) {
          const button = canvas.getByRole("button", { name });
          await pointAt(button);
          await new Promise((resolve) => setTimeout(resolve, 250));
          expect(toRgb(getComputedStyle(button).backgroundColor), name).toEqual(expected);
          await pointAt(null);
        }
      }
    }
  },
};

export const NeutralPressedIconButton: Story = {
  name: "A pressed neutral icon button keeps its contrast",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      {variants.map((variant) => (
        <IconButton key={variant} tone="neutral" variant={variant} icon={TrashIcon} aria-label={`${variant} pressed`} defaultPressed />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      const button = canvas.getByRole("button", { name: `${variant} pressed` });
      expect(contrast(getComputedStyle(button).color, background(button))).toBeGreaterThanOrEqual(3);
    }
  },
};
