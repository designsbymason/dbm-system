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
