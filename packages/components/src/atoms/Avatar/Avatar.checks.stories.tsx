import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Avatar } from "./Avatar";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`, as ADR-0013
// keeps a sub-part's documentation out of the sidebar): the initials colour of a hovered colorful avatar and its contrast on the
// hover fill.
const meta: Meta = {
  title: "Components/Avatar/Checks",
  id: "atoms-data-display-avatar-checks",
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

// `colorful` picks a family from a hash of the name, so these names are the ones that land on each family (a change to the hash
// fails this check at the first assertion, which is the point). Brand and success hold 4.5:1 with their own text colour, so
// they are checked too, with no dedicated hover token.
const PEOPLE = [
  { name: "Ada Lovelace", tone: "danger", hoverToken: "--dbm-text-danger-hover" },
  { name: "Katherine Johnson", tone: "warning", hoverToken: "--dbm-text-warning-hover" },
  { name: "Grace Hopper", tone: "info", hoverToken: "--dbm-text-info-hover" },
  { name: "Alan Turing", tone: "success", hoverToken: "--dbm-text-success" },
  { name: "John Smith", tone: "brand", hoverToken: "--dbm-text-brand" },
] as const;

export const HoverInitialsContrast: Story = {
  name: "hover: the initials of an interactive colorful avatar hold 4.5:1 on their hover fill",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", padding: "var(--dbm-space-6)" }}>
      {PEOPLE.map((person) => (
        <Avatar key={person.name} as="button" colorful name={person.name} onClick={() => {}} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const person of PEOPLE) {
      const avatar = canvas.getByRole("button", { name: new RegExp(person.name) });
      const content = avatar.firstElementChild as HTMLElement;
      const resting = getComputedStyle(content).color;
      // resolved before the wait: `resolve` adds and removes an element, which would re-trigger `waitFor`'s own DOM observer
      const hoverFill = resolve("backgroundColor", `--dbm-bg-${person.tone}-subtle-hover`);
      const hoverLabel = resolve("color", person.hoverToken);
      await pointAt(avatar);
      await waitFor(() => expect(getComputedStyle(content).backgroundColor).toBe(hoverFill), { timeout: 2000 });
      // the hover colour is the dedicated token (or the family's own text colour where that already clears 4.5:1), and it holds 4.5:1
      expect(getComputedStyle(content).color).toBe(hoverLabel);
      expect(contrast(getComputedStyle(content).color, getComputedStyle(content).backgroundColor)).toBeGreaterThanOrEqual(4.5);
      await pointAt(null);
      await waitFor(() => expect(getComputedStyle(content).color).toBe(resting), { timeout: 2000 });
    }
  },
};
