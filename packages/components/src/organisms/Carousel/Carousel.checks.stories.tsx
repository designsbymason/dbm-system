import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Demo, allSizes } from "./CarouselStoryKit";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real scroll-snap layout, text direction, focus rings,
// emulated media — measured in Chromium.
const meta: Meta = {
  title: "Organisms/Media/Carousel/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (element: Element) => element.getBoundingClientRect();
const track = (root: ParentNode) => within(root as HTMLElement).getByRole("group", { name: "Slides" });
const slideOf = (root: ParentNode, n: number) => within(root as HTMLElement).getByRole("group", { name: new RegExp(`^${n} of `) });
const inertOf = (element: HTMLElement) => (element as HTMLElement & { inert: boolean }).inert;
const nextButton = (root: ParentNode) => within(root as HTMLElement).getByRole("button", { name: "Next slide" });

/** Waits for the track to stop moving: its scroll position the same on consecutive frames. */
const stopped = async (element: HTMLElement) => {
  let last = Number.NaN;
  await waitFor(
    async () => {
      const now = element.scrollLeft + element.scrollTop;
      const same = now === last;
      last = now;
      await settle(60);
      if (!same) throw new Error("still scrolling");
    },
    { timeout: 4000 },
  );
};

export const TargetSizeAtEverySize: Story = {
  name: "The previous, next and pause buttons are at least 24 by 24 pixels at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} controls="overlay" autoPlay indicators={false} aria-label={`size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons.length).toBe(allSizes.length * 3);
    for (const button of buttons) {
      const rect = box(button);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const ScrollsToTheSlide: Story = {
  name: "Next brings the next slide's start edge to the track's start edge, and previous brings it back",
  render: () => <Demo aria-label="Scroll" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    await userEvent.click(nextButton(canvasElement));
    await stopped(scroller);
    await expect(Math.abs(box(slideOf(canvasElement, 2)).left - box(scroller).left)).toBeLessThan(1.5);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Previous slide" }));
    await stopped(scroller);
    await expect(Math.abs(box(slideOf(canvasElement, 1)).left - box(scroller).left)).toBeLessThan(1.5);
  },
};

const Reporting = () => {
  const [value, setValue] = useState(0);
  return (
    <div>
      <Demo aria-label="Swipe" onValueChange={setValue} />
      <output data-testid="reported">{value}</output>
    </div>
  );
};

export const ReportsASwipe: Story = {
  name: "A scroll the browser did itself is reported once it settles, and the slide it lands on leaves inert",
  render: () => <Reporting />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    scroller.scrollTo({ left: scroller.scrollLeft + box(slideOf(canvasElement, 3)).left - box(scroller).left, behavior: "instant" });
    await waitFor(() => expect(within(canvasElement).getByTestId("reported")).toHaveTextContent("2"));
    await expect(inertOf(slideOf(canvasElement, 3))).toBe(false);
    await expect(inertOf(slideOf(canvasElement, 1))).toBe(true);
  },
};

export const SeveralAndPeek: Story = {
  name: "Two in view and a peek: the slides are equal, two fill the track less the peek, and the third shows its edge",
  render: () => <Demo slidesPerView={2} peek aria-label="Peek" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    const [first, second, third] = [1, 2, 3].map((n) => box(slideOf(canvasElement, n)));
    await expect(Math.abs(first!.width - second!.width)).toBeLessThan(1);
    const edge = box(scroller).right - third!.left;
    await expect(edge).toBeGreaterThan(8);
    await expect(edge).toBeLessThan(third!.width);
  },
};

export const RightToLeftOrder: Story = {
  name: "In right-to-left the first slide is at the right, and the arrow key towards the left goes forward",
  render: () => <Demo dir="rtl" aria-label="rtl" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    await expect(box(slideOf(canvasElement, 1)).left).toBeGreaterThan(box(slideOf(canvasElement, 2)).left);
    scroller.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await stopped(scroller);
    await expect(Math.abs(box(slideOf(canvasElement, 2)).right - box(scroller).right)).toBeLessThan(1.5);
  },
};

export const VerticalScrolls: Story = {
  name: "A vertical carousel scrolls by its block axis and lands on the slide's top edge",
  render: () => (
    <div style={{ blockSize: "20rem" }}>
      <Demo orientation="vertical" aria-label="Vertical" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    await userEvent.click(nextButton(canvasElement));
    await stopped(scroller);
    await expect(scroller.scrollTop).toBeGreaterThan(0);
    await expect(scroller.scrollLeft).toBe(0);
    await expect(Math.abs(box(slideOf(canvasElement, 2)).top - box(scroller).top)).toBeLessThan(1.5);
  },
};

export const FocusRingOnTheTrack: Story = {
  name: "Keyboard focus draws a 2px ring inside the track's own edge",
  render: () => <Demo aria-label="Focus" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    scroller.focus();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(scroller).toHaveFocus();
    const style = getComputedStyle(scroller);
    await expect(style.outlineStyle).toBe("solid");
    await expect(parseFloat(style.outlineWidth)).toBe(2);
    await expect(parseFloat(style.outlineOffset)).toBe(-2);
  },
};

export const AnInertSlideCannotBePressed: Story = {
  name: "A slide out of view is not reachable by the keyboard",
  render: () => <Demo aria-label="Inert" slides={2} />,
  play: async ({ canvasElement }) => {
    await expect(inertOf(slideOf(canvasElement, 2))).toBe(true);
    await expect(slideOf(canvasElement, 2).matches(":not(:focus-within)")).toBe(true);
  },
};

export const ReducedMotionStartsAutoPlayPaused: Story = {
  name: "Reduced motion: automatic rotation starts paused, and the track jumps instead of easing",
  render: () => <Demo autoPlay={{ interval: 1500 }} aria-label="Reduced motion" />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "reduce" | "no-preference") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    await emulate("reduce");
    try {
      await waitFor(() => expect(within(canvasElement).getByRole("button", { name: "Start automatic slide show" })).toBeInTheDocument());
      await settle(2200);
      await expect(inertOf(slideOf(canvasElement, 1))).toBe(false);
      const scroller = track(canvasElement);
      await userEvent.click(nextButton(canvasElement));
      await settle(60);
      await expect(Math.abs(box(slideOf(canvasElement, 2)).left - box(scroller).left)).toBeLessThan(1.5);
    } finally {
      await emulate("no-preference");
    }
  },
};
