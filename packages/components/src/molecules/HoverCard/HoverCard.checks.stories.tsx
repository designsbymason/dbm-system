import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";
import { Link } from "../../atoms/Link";
import { Text } from "../../atoms/Text";
import { send } from "../CodeBlock/browserProtocol";
import { HoverCard } from "./HoverCard";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a
// second stories file out of the sidebar and the Docs page): what jsdom can't evaluate —
// text direction, forced colours, real layout — measured in Chromium. See
// `07-storybook-and-documentation-standards.md` §4.2 for why these live apart from the
// visible stories.
const meta: Meta = {
  title: "Components/HoverCard/Checks",
  id: "molecules-overlay-hovercard-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const settle = () => new Promise((resolve) => setTimeout(resolve, 250));

// A real app has its direction set before anything mounts. These checks flip it after
// the card is already open, and Radix only re-places the card when something resizes,
// so tell it the layout changed (as the browser would have, had it been set first).
const setDirection = async (direction: "rtl" | "ltr" | "") => {
  document.documentElement.dir = direction;
  window.dispatchEvent(new Event("resize"));
  await settle();
};

export const RightToLeft: Story = {
  name: "Right to left: align follows the page's direction, the text is right to left",
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-24)" }}>
      <HoverCard open>
        <HoverCard.Trigger asChild>
          <Link href="#a" data-testid="trigger-start">
            رابط
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content align="start" data-testid="card-start">
          <Text>معاينة طويلة بما يكفي لتكون أعرض من الرابط الذي يفتحها</Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
  play: async () => {
    // A real right-to-left app sets the direction on the document, and the card is
    // portaled to `body`, so that is where it inherits it from.
    const previous = document.documentElement.dir;
    try {
      await setDirection("rtl");
      const trigger = await screen.findByTestId("trigger-start");
      const card = await screen.findByTestId("card-start");
      await expect(getComputedStyle(card).direction).toBe("rtl");
      const t = trigger.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      // The card is wider than its link, so its start edge (the right, in this direction) lines up
      // with the link's and the card hangs off to the left.
      await expect(c.width).toBeGreaterThan(t.width + 20);
      await expect(Math.abs(c.right - t.right)).toBeLessThan(2);
      await expect(c.left).toBeLessThan(t.left);
    } finally {
      document.documentElement.dir = previous;
      window.dispatchEvent(new Event("resize"));
    }
  },
};

export const RightToLeftEnd: Story = {
  name: "Right to left: align end lines up with the link's end edge",
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-24)" }}>
      <HoverCard open>
        <HoverCard.Trigger asChild>
          <Link href="#a" data-testid="trigger-end">
            رابط
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content align="end" data-testid="card-end">
          <Text>معاينة طويلة بما يكفي لتكون أعرض من الرابط الذي يفتحها</Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
  play: async () => {
    const previous = document.documentElement.dir;
    try {
      await setDirection("rtl");
      const t = (await screen.findByTestId("trigger-end")).getBoundingClientRect();
      const c = (await screen.findByTestId("card-end")).getBoundingClientRect();
      await expect(Math.abs(c.left - t.left)).toBeLessThan(2);
      await expect(c.right).toBeGreaterThan(t.right);
    } finally {
      document.documentElement.dir = previous;
      window.dispatchEvent(new Event("resize"));
    }
  },
};

export const ForcedColors: Story = {
  name: "Forced colours: the card keeps a visible edge and the arrow still matches it",
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-24)" }}>
      <HoverCard open>
        <HoverCard.Trigger asChild>
          <Link href="#a" data-testid="trigger-forced">
            @jane
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content data-testid="card-forced">
          <Text>Jane Doe</Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
  play: async () => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle();
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const card = await screen.findByTestId("card-forced");
      const style = getComputedStyle(card);
      const arrow = card.querySelector("svg")!;
      const polygon = getComputedStyle(arrow.querySelector("polygon")!);
      const path = getComputedStyle(arrow.querySelector("path")!);
      // The card is still bounded: a border that isn't transparent, drawn.
      await expect(style.borderTopStyle).toBe("solid");
      await expect(style.borderTopWidth).not.toBe("0px");
      // The arrow is the card's own surface and edge, so it still reads as part of it.
      await expect(polygon.fill).toBe(style.backgroundColor);
      await expect(path.stroke).toBe(style.borderTopColor);
    } finally {
      await emulate("none");
    }
  },
};

const sidesGrid = (sideOffset: number, hideArrow = false) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "var(--dbm-space-32)",
      placeItems: "center",
      padding: "var(--dbm-space-32)",
    }}
  >
    {(["top", "right", "bottom", "left"] as const).map((side) => (
      <HoverCard key={side} open>
        <HoverCard.Trigger asChild>
          <Link href={`#${side}`} data-testid={`trigger-${side}`}>
            {side}
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content side={side} sideOffset={sideOffset} hideArrow={hideArrow} data-testid={`card-${side}`}>
          <Text size="sm">{side}</Text>
        </HoverCard.Content>
      </HoverCard>
    ))}
  </div>
);

// The point in the middle of the gap between the trigger and the card, on the side the card is on.
const gapPoint = (side: string, trigger: DOMRect, card: DOMRect) => {
  switch (side) {
    case "top":
      return { x: (card.left + card.right) / 2, y: (card.bottom + trigger.top) / 2 };
    case "bottom":
      return { x: (card.left + card.right) / 2, y: (trigger.bottom + card.top) / 2 };
    case "left":
      return { x: (card.right + trigger.left) / 2, y: (card.top + card.bottom) / 2 };
    default:
      return { x: (trigger.right + card.left) / 2, y: (card.top + card.bottom) / 2 };
  }
};

export const BridgeAcrossTheGap: Story = {
  name: "The gap between the link and the card belongs to the card, on every side",
  render: () => sidesGrid(24),
  play: async () => {
    await settle();
    for (const side of ["top", "right", "bottom", "left"]) {
      const trigger = (await screen.findByTestId(`trigger-${side}`)).getBoundingClientRect();
      const card = await screen.findByTestId(`card-${side}`);
      const rect = card.getBoundingClientRect();
      // The gap really is 24px plus the arrow's 5, so the point below is inside it and not on an edge.
      const gap = side === "top" ? trigger.top - rect.bottom : side === "bottom" ? rect.top - trigger.bottom : side === "left" ? trigger.left - rect.right : rect.left - trigger.right;
      await expect(Math.round(gap)).toBe(29);
      const { x, y } = gapPoint(side, trigger, rect);
      const hit = document.elementFromPoint(x, y);
      // Whatever sits under the pointer in the gap is the card (or its arrow), so the pointer never leaves it.
      await expect(hit && card.contains(hit)).toBe(true);
    }
  },
};

export const BridgeWithoutAnArrow: Story = {
  name: "Without an arrow the gap is just the offset, and is still bridged",
  render: () => sidesGrid(24, true),
  play: async () => {
    await settle();
    for (const side of ["top", "right", "bottom", "left"]) {
      const trigger = (await screen.findByTestId(`trigger-${side}`)).getBoundingClientRect();
      const card = await screen.findByTestId(`card-${side}`);
      const rect = card.getBoundingClientRect();
      const gap = side === "top" ? trigger.top - rect.bottom : side === "bottom" ? rect.top - trigger.bottom : side === "left" ? trigger.left - rect.right : rect.left - trigger.right;
      await expect(Math.round(gap)).toBe(24);
      const { x, y } = gapPoint(side, trigger, rect);
      await expect(card.contains(document.elementFromPoint(x, y))).toBe(true);
      // Right up to the link's edge, not just the middle of the gap.
      const near = gapPoint(side, trigger, rect);
      const offsetNearTrigger = side === "top" ? { x: near.x, y: trigger.top - 1 } : side === "bottom" ? { x: near.x, y: trigger.bottom + 1 } : side === "left" ? { x: trigger.left - 1, y: near.y } : { x: trigger.right + 1, y: near.y };
      await expect(card.contains(document.elementFromPoint(offsetNearTrigger.x, offsetNearTrigger.y))).toBe(true);
    }
  },
};

export const BridgeFollowsTheOffset: Story = {
  name: "The bridge is as long as the gap and no longer",
  render: () => sidesGrid(40),
  play: async () => {
    await settle();
    const trigger = (await screen.findByTestId("trigger-top")).getBoundingClientRect();
    const card = await screen.findByTestId("card-top");
    const rect = card.getBoundingClientRect();
    const x = (rect.left + rect.right) / 2;
    // Just inside the gap at both ends: the card's own.
    await expect(card.contains(document.elementFromPoint(x, rect.bottom + 2))).toBe(true);
    await expect(card.contains(document.elementFromPoint(x, trigger.top - 2))).toBe(true);
    // And past the trigger's far side, the other way: not the card's.
    await expect(card.contains(document.elementFromPoint(x, rect.top - 6))).toBe(false);
  },
};

export const SizesAndMedia: Story = {
  name: "Padding follows size, and Media bleeds out to the card's edges and rounded corners",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-32)", padding: "var(--dbm-space-32)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <HoverCard key={size} open>
          <HoverCard.Trigger asChild>
            <Link href={`#${size}`}>{size}</Link>
          </HoverCard.Trigger>
          <HoverCard.Content size={size} data-testid={`size-${size}`} side="right">
            <HoverCard.Media data-testid={`media-${size}`}>
              <svg viewBox="0 0 320 112" role="img" aria-label="Banner" data-testid={`svg-${size}`}>
                <rect width="320" height="112" fill="var(--dbm-bg-brand-subtle)" />
              </svg>
            </HoverCard.Media>
            <Text size="sm">{size}</Text>
          </HoverCard.Content>
        </HoverCard>
      ))}
    </div>
  ),
  play: async () => {
    await settle();
    const expected = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 } as const;
    for (const [size, padding] of Object.entries(expected)) {
      const card = await screen.findByTestId(`size-${size}`);
      const style = getComputedStyle(card);
      await expect(parseFloat(style.paddingTop)).toBe(padding);
      await expect(parseFloat(style.paddingLeft)).toBe(padding);
      // The media reaches the card's own padding edge on the top and both sides, so it spans the card.
      const media = (await screen.findByTestId(`media-${size}`)).getBoundingClientRect();
      const box = card.getBoundingClientRect();
      const border = parseFloat(style.borderTopWidth);
      await expect(Math.abs(media.left - (box.left + border))).toBeLessThan(1);
      await expect(Math.abs(media.right - (box.right - border))).toBeLessThan(1);
      await expect(Math.abs(media.top - (box.top + border))).toBeLessThan(1);
      // The artwork fills it: nothing is left of or above the picture.
      const svg = (await screen.findByTestId(`svg-${size}`)).getBoundingClientRect();
      await expect(Math.abs(svg.width - media.width)).toBeLessThan(1);
      // And the media's top corners are the card's radius less its border, so it sits inside the rounded corner.
      const radius = parseFloat(getComputedStyle(await screen.findByTestId(`media-${size}`)).borderTopLeftRadius);
      await expect(radius).toBe(parseFloat(style.borderTopLeftRadius) - border);
    }
  },
};

export const TapDoesNotOpenIt: Story = {
  name: "Focus that isn't keyboard focus (what a tap or click leaves) does not open the card",
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-24)" }}>
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCard.Trigger asChild>
          <Link href="#tap" data-testid="trigger-tap" onClick={(event) => event.preventDefault()}>
            @jane
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content data-testid="card-tap">
          <Text>Jane Doe</Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
  play: async () => {
    await screen.findByTestId("trigger-tap");
    // Focus the link the way a tap or a click does: not from the keyboard. (A real tap was tried and works
    // locally, but it needs screen coordinates, which depend on how the test page scales the story's frame
    // and so differ between machines; this asks the browser for the same kind of focus directly.)
    // The whole sequence retries, finding the link afresh each time: the story can be re-prepared while the
    // test waits, which leaves a trigger found earlier detached and focus back on the body.
    await waitFor(
      async () => {
        const trigger = screen.getByTestId("trigger-tap");
        trigger.focus({ focusVisible: false } as FocusOptions);
        await settle();
        expect(document.activeElement).toBe(trigger);
        // Fails loudly if the browser ignored the option and treated this as keyboard focus.
        expect(trigger.matches(":focus-visible")).toBe(false);
        expect(screen.queryByTestId("card-tap")).toBeNull();
      },
      { timeout: 5000 },
    );
  },
};
