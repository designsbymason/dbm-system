import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Carousel } from "./Carousel";
import { Demo, DemoSlide, allSizes } from "./CarouselStoryKit";

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

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which never start a
// drag. The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
const toPage = (x: number, y: number) => {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
};
const mouse = (type: "mouseMoved" | "mousePressed" | "mouseReleased", x: number, y: number) =>
  send("Input.dispatchMouseEvent", { type, ...toPage(x, y), button: type === "mouseMoved" ? "none" : "left", clickCount: 1, buttons: type === "mouseReleased" ? 0 : 1 });
const parkPointer = () => send("Input.dispatchMouseEvent", { type: "mouseMoved", ...toPage(2, 2) });

export const MouseDragMovesTheSlides: Story = {
  name: "A mouse drag scrolls the slides, snaps to the nearest and reports it; a click that ends a drag is swallowed",
  render: () => (
    <div>
      <Carousel aria-label="Drag">
        {[0, 1, 2, 3].map((index) => (
          <Carousel.Slide key={index}>
            <a href="#drag" data-testid={`link-${index}`} onClick={(event) => event.preventDefault()} style={{ display: "block" }}>
              <DemoSlide.Panel index={index} />
            </a>
          </Carousel.Slide>
        ))}
      </Carousel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const scroller = track(canvasElement);
    const rect = box(scroller);
    const y = rect.top + rect.height / 2;
    // From the right to well past the left: more than half a slide, so the snap takes the next one.
    const from = rect.left + rect.width * 0.8;
    await mouse("mouseMoved", from, y);
    await mouse("mousePressed", from, y);
    for (let step = 1; step <= 10; step += 1) {
      await mouse("mouseMoved", from - (rect.width * 0.6 * step) / 10, y);
      await settle(16);
    }
    await expect(scroller).toHaveAttribute("data-dragging");
    await mouse("mouseReleased", from - rect.width * 0.6, y);
    await stopped(scroller);
    await waitFor(() => expect(inertOf(slideOf(canvasElement, 2))).toBe(false));
    await expect(scroller).not.toHaveAttribute("data-dragging");
    await expect(Math.abs(box(slideOf(canvasElement, 2)).left - box(scroller).left)).toBeLessThan(1.5);
    await parkPointer();
  },
};

export const MouseClickStillPressesButtons: Story = {
  name: "A press that does not move still clicks a button inside a slide",
  render: () => {
    const Presser = () => {
      const [pressed, setPressed] = useState(0);
      return (
        <div>
          <Carousel aria-label="Press" controls="hidden" indicators={false}>
            <Carousel.Slide>
              <button type="button" onClick={() => setPressed((count) => count + 1)}>
                Press me
              </button>
            </Carousel.Slide>
            <Carousel.Slide>Two</Carousel.Slide>
          </Carousel>
          <output data-testid="pressed">{pressed}</output>
        </div>
      );
    };
    return <Presser />;
  },
  play: async ({ canvasElement }) => {
    await parkPointer();
    const rect = box(within(canvasElement).getByRole("button", { name: "Press me" }));
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    await mouse("mouseMoved", x, y);
    await mouse("mousePressed", x, y);
    await mouse("mouseReleased", x, y);
    await waitFor(() => expect(within(canvasElement).getByTestId("pressed")).toHaveTextContent("1"));
    await parkPointer();
  },
};

export const SeamlessLoop: Story = {
  name: "A looping carousel goes from the last slide to the first through a copy, and rests on the real first slide",
  render: () => <Demo loop aria-label="Loop" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Previous slide" }));
    await stopped(scroller);
    await waitFor(() => expect(inertOf(slideOf(canvasElement, 5))).toBe(false));
    await expect(Math.abs(box(slideOf(canvasElement, 5)).left - box(scroller).left)).toBeLessThan(1.5);
    // Forward over the seam: the copy of the first slide is the shorter way, and the track ends on the real one.
    const before = scroller.scrollLeft;
    await userEvent.click(nextButton(canvasElement));
    await stopped(scroller);
    await waitFor(() => expect(inertOf(slideOf(canvasElement, 1))).toBe(false));
    await expect(Math.abs(box(slideOf(canvasElement, 1)).left - box(scroller).left)).toBeLessThan(1.5);
    // The real first slide sits after the copies in the track, so the track did not rewind to the start.
    await expect(scroller.scrollLeft).toBeGreaterThan(0);
    await expect(scroller.scrollLeft).toBeLessThan(before);
  },
};

export const CentredSlide: Story = {
  name: "A centred slide sits in the middle of the track, with its neighbours showing, at the first and last slide too",
  render: () => <Demo align="center" slidesPerView={2.5} aria-label="Centred" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    const middle = (element: Element) => box(element).left + box(element).width / 2;
    const centreOfTrack = box(scroller).left + box(scroller).width / 2;
    await waitFor(() => expect(Math.abs(middle(slideOf(canvasElement, 1)) - centreOfTrack)).toBeLessThan(1.5));
    await expect(box(slideOf(canvasElement, 2)).left).toBeLessThan(box(scroller).right);
    await userEvent.click(nextButton(canvasElement));
    await stopped(scroller);
    await waitFor(() => expect(Math.abs(middle(slideOf(canvasElement, 2)) - centreOfTrack)).toBeLessThan(1.5));
    scroller.focus();
    await userEvent.keyboard("{End}");
    await stopped(scroller);
    await waitFor(() => expect(Math.abs(middle(slideOf(canvasElement, 5)) - centreOfTrack)).toBeLessThan(1.5));
  },
};

export const FractionalView: Story = {
  name: "One and a half in view: a slide and a half of the next fill the track, with the gap between",
  render: () => <Demo slidesPerView={1.5} aria-label="Fraction" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    const [first, second] = [1, 2].map((n) => box(slideOf(canvasElement, n)));
    await expect(Math.abs(first!.width - second!.width)).toBeLessThan(1);
    await expect(Math.abs(first!.width * 1.5 + (second!.left - first!.right) - box(scroller).width)).toBeLessThan(1.5);
    await expect(second!.right).toBeGreaterThan(box(scroller).right);
  },
};

export const PeekingSlideIsPressable: Story = {
  name: "A button in the peeking slide can be pressed, and the carousel brings that slide into view",
  render: () => {
    const Peeker = () => (
      <Carousel aria-label="Peek press" slidesPerView={2} peek>
        {[1, 2, 3, 4].map((n) => (
          <Carousel.Slide key={n}>
            <button type="button">Button {n}</button>
          </Carousel.Slide>
        ))}
      </Carousel>
    );
    return <Peeker />;
  },
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    const peeking = within(canvasElement).getByRole("button", { name: "Button 3" });
    await expect(inertOf(slideOf(canvasElement, 3))).toBe(false);
    await expect(box(peeking).left).toBeLessThan(box(scroller).right);
    peeking.focus();
    await waitFor(() => expect(peeking).toHaveFocus());
    await stopped(scroller);
    await waitFor(() => expect(inertOf(slideOf(canvasElement, 4))).toBe(false));
  },
};

export const RefusedSwipeSnapsBack: Story = {
  name: "A swipe a controlled owner does not take puts the track back on the slide it holds",
  render: () => <Demo value={0} onValueChange={() => {}} aria-label="Refused" />,
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    scroller.scrollTo({ left: scroller.scrollLeft + box(slideOf(canvasElement, 3)).left - box(scroller).left, behavior: "instant" });
    await settle(300);
    await stopped(scroller);
    await expect(Math.abs(box(slideOf(canvasElement, 1)).left - box(scroller).left)).toBeLessThan(1.5);
    await expect(inertOf(slideOf(canvasElement, 1))).toBe(false);
  },
};

export const HoldingNextKeepsStepping: Story = {
  name: "Holding the next button with a real mouse keeps stepping, and letting go does not step once more",
  render: () => {
    const Held = () => {
      const [value, setValue] = useState(0);
      return (
        <div>
          <Demo slides={8} controls="bar" aria-label="Hold" onValueChange={setValue} />
          <output data-testid="held">{value}</output>
        </div>
      );
    };
    return <Held />;
  },
  play: async ({ canvasElement }) => {
    await parkPointer();
    const button = nextButton(canvasElement);
    const rect = box(button);
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    await mouse("mouseMoved", x, y);
    await mouse("mousePressed", x, y);
    await settle(1500);
    const output = within(canvasElement).getByTestId("held");
    const whileHeld = Number(output.textContent);
    await expect(whileHeld).toBeGreaterThanOrEqual(2);
    await mouse("mouseReleased", x, y);
    await settle(1200);
    await expect(Number(output.textContent)).toBe(whileHeld);
    await parkPointer();
  },
};

export const FadeEffectDimsSlidesNearTheEdge: Story = {
  name: "The fade effect dims a slide that is mostly out of view and draws the one in view in full; reduced motion draws all in full",
  render: () => <Demo effect="fade" slidesPerView={1.5} aria-label="Effect" />,
  play: async ({ canvasElement }) => {
    const opacity = (n: number) => parseFloat(getComputedStyle(slideOf(canvasElement, n)).opacity);
    await settle(200);
    await expect(opacity(1)).toBeGreaterThan(0.95);
    await expect(opacity(3)).toBeLessThan(0.95);
    const emulate = (value: "reduce" | "no-preference") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    await emulate("reduce");
    try {
      await settle(300);
      await expect(opacity(3)).toBe(1);
    } finally {
      await emulate("no-preference");
    }
  },
};

export const AutoHeightFitsTheSlides: Story = {
  name: "A vertical carousel with autoHeight is as tall as its tallest window of slides, with no height from its container",
  render: () => (
    <Carousel aria-label="Auto height" orientation="vertical" autoHeight slidesPerView={2} gap={4}>
      {[2, 6, 3, 4].map((tall, index) => (
        <Carousel.Slide key={index}>
          <div style={{ blockSize: `calc(var(--dbm-space-${tall}) * 4)`, background: "var(--dbm-bg-brand-subtle)" }}>Slide {index + 1}</div>
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const scroller = track(canvasElement);
    await settle(200);
    const heights = [1, 2, 3, 4].map((n) => box(slideOf(canvasElement, n)).height);
    const gap = parseFloat(getComputedStyle(scroller).rowGap);
    const tallest = Math.max(heights[0]! + heights[1]!, heights[1]! + heights[2]!, heights[2]! + heights[3]!) + gap;
    await expect(Math.abs(box(scroller).height - tallest)).toBeLessThan(1.5);
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
  },
};

export const EdgeResistancePullsAndEasesBack: Story = {
  name: "Dragging past the first slide pulls the slides a little, and they ease back to rest when the mouse lets go",
  render: () => <Demo aria-label="Resistance" />,
  play: async ({ canvasElement }) => {
    await parkPointer();
    const scroller = track(canvasElement);
    const rect = box(scroller);
    const y = rect.top + rect.height / 2;
    const from = rect.left + rect.width * 0.3;
    const shift = () => parseFloat(getComputedStyle(slideOf(canvasElement, 1)).translate.split(" ")[0] ?? "0") || 0;
    await mouse("mouseMoved", from, y);
    await mouse("mousePressed", from, y);
    for (let step = 1; step <= 8; step += 1) {
      await mouse("mouseMoved", from + (rect.width * 0.4 * step) / 8, y);
      await settle(16);
    }
    await expect(shift()).toBeGreaterThan(5);
    await expect(scroller.scrollLeft).toBe(0);
    await mouse("mouseReleased", from + rect.width * 0.4, y);
    await waitFor(() => expect(shift()).toBe(0), { timeout: 2000 });
    await expect(inertOf(slideOf(canvasElement, 1))).toBe(false);
    await parkPointer();
  },
};
