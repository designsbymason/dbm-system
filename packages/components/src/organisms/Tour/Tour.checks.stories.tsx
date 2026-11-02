import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Dialog } from "../Dialog";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Tour } from "./Tour";
import type { TourStep } from "./Tour.types";
import { Demo, interactiveSteps } from "./TourStoryKit";

// Real-browser checks for what jsdom can't evaluate: where the spotlight and the card are drawn, what a real press reaches,
// scrolling, the keyboard loop, forced colours and reduced motion. Hidden from the sidebar and the Docs page, and still run as
// tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Overlay/Tour/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const layerOf = () => document.querySelector<HTMLElement>('[class*="_layer_"]');
const ringOf = () => document.querySelector<HTMLElement>('[class*="_ring_"]');
const shieldOf = () => document.querySelector<HTMLElement>('[class*="_shield_"]');
const demoElement = (name: string) => document.querySelector<HTMLElement>(`[data-demo="${name}"]`) as HTMLElement;

// Everything is measured once the spotlight has finished moving and has been still for a few frames: its box is read from the
// page every frame, so it is the last thing to settle after a layout change.
const settled = async () => {
  await nextFrame();
  const key = () => {
    const ring = ringOf();
    const box = ring?.getBoundingClientRect();
    return box ? `${box.left},${box.top},${box.width},${box.height}` : "";
  };
  let last = key();
  let still = 0;
  for (let frame = 0; frame < 120 && still < 4; frame += 1) {
    await nextFrame();
    const now = key();
    still = now === last ? still + 1 : 0;
    last = now;
  }
};

const startTour = async () => {
  await document.fonts.ready;
  await userEvent.click(await body.findByTestId("start-tour"));
  const dialog = await body.findByRole("dialog");
  await waitFor(() => expect(dialog).toHaveAttribute("data-placement"));
  await settled();
  return dialog;
};

// A tour opened by a check closes, and is gone, before the check ends: the accessibility run that follows every story would
// otherwise see it still fading out with the page behind it covered.
const closeWithEscape = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(layerOf()).toBeNull());
};

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

const centreOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const emulate = (feature: string, value: string) => send("Emulation.setEmulatedMedia", { features: [{ name: feature, value }] });
// Puts the browser's own preferences back. The test browser is shared by every file in a run, so an override left behind, even one
// that restates the default, is another check's to meet; clearing is not the same as setting the value back.
const clearEmulation = () => send("Emulation.setEmulatedMedia", { features: [] });

const close = (a: number, b: number, tolerance = 1) => Math.abs(a - b) <= tolerance;

/** A button behind the dimmed page, counting what reaches it. */
function Behind({ onPress }: { onPress: () => void }) {
  return (
    <div style={{ position: "absolute", insetBlockEnd: "var(--dbm-space-4)", insetInlineStart: "var(--dbm-space-4)" }}>
      <Button size="xs" data-testid="behind" onClick={onPress}>
        Behind
      </Button>
    </div>
  );
}

function Counting({ interactive = false }: { interactive?: boolean }) {
  const [count, setCount] = useState(0);
  return (
    <>
      <p data-testid="count">{count}</p>
      <Demo steps={interactive ? interactiveSteps : undefined}>
        <Behind onPress={() => setCount((value) => value + 1)} />
      </Demo>
    </>
  );
}

export const SpotlightIsTheElementPlusItsPadding: Story = {
  name: "The spotlight is the element's box plus the padding, inside a transformed container",
  render: () => <Demo />,
  play: async () => {
    await startTour();
    const ring = ringOf() as HTMLElement;
    const element = demoElement("search").getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(ring).paddingLeft);
    await expect(padding).toBeGreaterThan(0);
    const box = ring.getBoundingClientRect();
    await expect(Math.abs(box.left - (element.left - padding))).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.top - (element.top - padding))).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.width - (element.width + 2 * padding))).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.height - (element.height + 2 * padding))).toBeLessThanOrEqual(1);
    await closeWithEscape();
  },
};

export const CardClearsTheElementAndStaysInTheStage: Story = {
  name: "The card sits clear of the spotlight, inside the stage, and over the dimmed layers",
  render: () => <Demo />,
  play: async () => {
    const dialog = await startTour();
    const card = dialog.getBoundingClientRect();
    const ring = (ringOf() as HTMLElement).getBoundingClientRect();
    const stage = (await body.findByTestId("stage")).getBoundingClientRect();
    await expect(card.top).toBeGreaterThanOrEqual(ring.bottom);
    await expect(card.left).toBeGreaterThanOrEqual(stage.left);
    await expect(card.right).toBeLessThanOrEqual(stage.right + 1);
    const top = document.elementFromPoint(card.left + card.width / 2, card.top + card.height / 2);
    await expect(dialog.contains(top)).toBe(true);
    await expect(Number(getComputedStyle(dialog).zIndex)).toBeGreaterThan(Number(getComputedStyle(shieldOf() as HTMLElement).zIndex));
    await closeWithEscape();
  },
};

export const ARealPressOnTheDimmedPageDoesNotReachIt: Story = {
  name: "A real press on the dimmed page never reaches the page behind it",
  render: () => <Counting />,
  play: async () => {
    await startTour();
    const { x, y } = centreOf(await body.findByTestId("behind"));
    await expect(document.elementFromPoint(x, y)).toBe(shieldOf());
    await realClickAt(x, y);
    await sleep(100);
    await expect((await body.findByTestId("count")).textContent).toBe("0");
    await expect(body.queryByRole("dialog")).not.toBeNull();
    await closeWithEscape();
    await expect(document.elementFromPoint(x, y)?.textContent).toBe("Behind");
    await realClickAt(x, y);
    await waitFor(async () => expect((await body.findByTestId("count")).textContent).toBe("1"));
  },
};

export const AnInteractiveStepLetsAPressThrough: Story = {
  name: "A real press inside an interactive step's spotlight reaches the element, and outside it does not",
  render: () => <Counting interactive />,
  play: async () => {
    const dialog = await startTour();
    const field = body.getByRole("textbox", { name: "Search" });
    await expect(dialog).toHaveAttribute("data-interactive");
    const { x, y } = centreOf(field);
    await expect(document.elementFromPoint(x, y)).toBe(field);
    await realClickAt(x, y);
    await expect(document.activeElement).toBe(field);
    await userEvent.keyboard("hello");
    await expect((field as HTMLInputElement).value).toBe("hello");
    const behind = centreOf(await body.findByTestId("behind"));
    await realClickAt(behind.x, behind.y);
    await sleep(100);
    await expect((await body.findByTestId("count")).textContent).toBe("0");
    await closeWithEscape();
  },
};

export const TabStaysInsideTheCard: Story = {
  name: "Tab and Shift+Tab loop inside the card and never reach the page behind",
  render: () => (
    <>
      <Button data-testid="before">Before</Button>
      <Demo />
      <Button data-testid="after">After</Button>
    </>
  ),
  play: async () => {
    const dialog = await startTour();
    const stops = () => within(dialog).getAllByRole("button");
    await expect(stops().map((button) => button.textContent)).toEqual(["Skip tour", "Next"]);
    for (let press = 0; press < 5; press += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let press = 0; press < 5; press += 1) {
      await userEvent.tab({ shift: true });
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await closeWithEscape();
  },
};

export const FocusFollowsThePressedControl: Story = {
  name: "Focus stays on Next across steps by keyboard, and moves to Next when Back goes",
  render: () => <Demo />,
  play: async () => {
    const dialog = await startTour();
    await expect(dialog).toHaveFocus();
    while (document.activeElement !== within(dialog).getByRole("button", { name: "Next" })) await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Start something new"));
    await waitFor(() => expect(body.getByRole("button", { name: "Next" })).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(body.getByRole("button", { name: "Back" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Search"));
    await waitFor(() => expect(body.getByRole("button", { name: "Next" })).toHaveFocus());
    await closeWithEscape();
  },
};

export const EscapeGivesFocusBack: Story = {
  name: "Escape closes the tour and gives focus back to the button that opened it",
  render: () => <Demo />,
  play: async () => {
    await startTour();
    await closeWithEscape();
    await waitFor(() => expect(body.getByTestId("start-tour")).toHaveFocus());
  },
};

export const ARealPressOnNextChangesTheStep: Story = {
  name: "A real mouse press on Next moves the spotlight, which eases to the next element",
  render: () => <Demo />,
  play: async () => {
    const dialog = await startTour();
    const before = (ringOf() as HTMLElement).getBoundingClientRect();
    const { x, y } = centreOf(within(dialog).getByRole("button", { name: "Next" }));
    await realClickAt(x, y);
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Start something new"));
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
    await settled();
    const element = demoElement("create").getBoundingClientRect();
    const ring = (ringOf() as HTMLElement).getBoundingClientRect();
    await expect(ring.left).not.toBe(before.left);
    await expect(ring.left).toBeLessThanOrEqual(element.left);
    await expect(ring.right).toBeGreaterThanOrEqual(element.right);
    // The card followed the spotlight to its new place and sits clear of it.
    await expect(body.getByRole("dialog").getBoundingClientRect().top).toBeGreaterThanOrEqual(ring.bottom);
    await closeWithEscape();
  },
};

export const ACardNearTheContainersEdgeStaysInsideIt: Story = {
  name: "A card for an element at the container's edge shifts to stay inside the container",
  render: () => (
    <Demo
      steps={(find) => [{ id: "create", target: () => find("create"), title: "Start something new", content: "Create a project here. It takes a few seconds." }]}
    />
  ),
  play: async () => {
    const dialog = await startTour();
    const stage = (await body.findByTestId("stage")).getBoundingClientRect();
    const card = dialog.getBoundingClientRect();
    await expect(card.right).toBeLessThanOrEqual(stage.right);
    await expect(card.left).toBeGreaterThanOrEqual(stage.left);
    await closeWithEscape();
  },
};

export const ACardWithNoElementIsInTheMiddle: Story = {
  name: "A step with no element is a card in the middle of the stage and dims all of it",
  render: () => <Demo defaultValue="done" />,
  play: async () => {
    const dialog = await startTour();
    await expect(dialog).toHaveAttribute("data-placement", "centered");
    const stage = (await body.findByTestId("stage")).getBoundingClientRect();
    const card = dialog.getBoundingClientRect();
    await expect(close(card.left + card.width / 2, stage.left + stage.width / 2, 2)).toBe(true);
    await expect(close(card.top + card.height / 2, stage.top + stage.height / 2, 2)).toBe(true);
    await closeWithEscape();
  },
};

export const DockedCardSpansTheBottomAndLeavesTheElementClear: Story = {
  name: "A docked card spans the bottom of the stage and the element is scrolled clear of it",
  render: () => <Demo presentation="docked" />,
  play: async () => {
    const dialog = await startTour();
    await expect(dialog).toHaveAttribute("data-placement", "docked");
    const stage = (await body.findByTestId("stage")).getBoundingClientRect();
    const card = dialog.getBoundingClientRect();
    await expect(card.bottom).toBeLessThanOrEqual(stage.bottom);
    await expect(card.width).toBeGreaterThan(stage.width * 0.8);
    await expect(card.top).toBeGreaterThanOrEqual(demoElement("search").getBoundingClientRect().bottom);
    await closeWithEscape();
  },
};

function ScrollingPage() {
  return (
    <div>
      <div data-testid="tall" style={{ blockSize: "180vh", paddingBlockStart: "70vh" }}>
        <Button data-demo="far">Far down</Button>
      </div>
      <Tour
        defaultOpen
        steps={[{ id: "far", target: () => document.querySelector<HTMLElement>('[data-demo="far"]'), title: "Far down" }]}
      />
    </div>
  );
}

export const TheSpotlightFollowsARealWheelScroll: Story = {
  name: "A real wheel over the dimmed page scrolls the page and the spotlight stays on its element",
  parameters: { layout: "fullscreen" },
  render: () => <ScrollingPage />,
  play: async () => {
    const dialog = await body.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveAttribute("data-placement", "anchored"));
    await settled();
    const element = demoElement("far");
    const before = window.scrollY;
    await realMouse("mouseWheel", 40, 40, { deltaX: 0, deltaY: 120 });
    await waitFor(() => expect(window.scrollY).not.toBe(before));
    await settled();
    const box = (ringOf() as HTMLElement).getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(ringOf() as HTMLElement).paddingLeft);
    await expect(close(box.top, element.getBoundingClientRect().top - padding)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

function InnerScroller() {
  const steps: TourStep[] = [
    { id: "deep", target: () => document.querySelector<HTMLElement>('[data-demo="deep"]'), title: "Deep in the list" },
  ];
  return (
    <div style={{ position: "relative", transform: "translateZ(0)", overflow: "hidden", blockSize: "20rem" }} data-testid="stage">
      <div data-testid="scroller" style={{ blockSize: "8rem", overflow: "auto" }}>
        <div style={{ blockSize: "30rem", paddingBlockStart: "20rem" }}>
          <Button data-demo="deep">Deep</Button>
        </div>
      </div>
      <Tour defaultOpen steps={steps} />
    </div>
  );
}

export const AnElementInAScrollingBoxIsBroughtIntoView: Story = {
  name: "An element inside a scrolling box is scrolled into that box, and the spotlight follows it",
  render: () => <InnerScroller />,
  play: async () => {
    const dialog = await body.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveAttribute("data-placement", "anchored"));
    await waitFor(async () => expect((await body.findByTestId("scroller")).scrollTop).toBeGreaterThan(0));
    await sleep(600);
    await settled();
    const scroller = (await body.findByTestId("scroller")).getBoundingClientRect();
    const element = demoElement("deep").getBoundingClientRect();
    await expect(element.top).toBeGreaterThanOrEqual(scroller.top - 1);
    await expect(element.bottom).toBeLessThanOrEqual(scroller.bottom + 1);
    const ring = (ringOf() as HTMLElement).getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(ringOf() as HTMLElement).paddingLeft);
    await expect(close(ring.top, element.top - padding)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const RightToLeftPlacesTheCardOnTheStartSide: Story = {
  name: "In right-to-left, side start is the right of the element and the arrow keys are mirrored",
  render: () => (
    <div dir="rtl">
      <Demo
        dir="rtl"
        steps={(find) => [
          { id: "create", target: () => find("create"), title: "Create", side: "start" },
          { id: "status", target: () => find("status"), title: "Status", side: "bottom" },
        ]}
      />
    </div>
  ),
  play: async () => {
    const dialog = await startTour();
    const element = demoElement("create").getBoundingClientRect();
    await expect(dialog.getBoundingClientRect().left).toBeGreaterThanOrEqual(element.right);
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Status"));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Create"));
    await closeWithEscape();
  },
};

export const InForcedColoursTheSpotlightIsOutlined: Story = {
  name: "In forced colours the dim is gone and the element is told by an outline in a system colour",
  render: () => <Demo />,
  play: async () => {
    await startTour();
    const ring = ringOf() as HTMLElement;
    await expect(getComputedStyle(ring).boxShadow).not.toBe("none");
    await emulate("forced-colors", "active");
    try {
      await sleep(300);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      await expect(getComputedStyle(ring).boxShadow).toBe("none");
      await expect(getComputedStyle(ring).outlineStyle).toBe("solid");
      await expect(parseFloat(getComputedStyle(ring).outlineWidth)).toBeGreaterThan(0);
    } finally {
      await clearEmulation();
    }
    await closeWithEscape();
  },
};

export const UnderReducedMotionTheSpotlightJumps: Story = {
  name: "The spotlight eases between steps, and under reduced motion it moves without easing",
  render: () => <Demo />,
  play: async () => {
    const dialog = await startTour();
    const ring = ringOf() as HTMLElement;
    // At rest it follows its element with no easing, so a scroll or an animation is not trailed.
    await expect(getComputedStyle(ring).transitionDuration).toBe("0s");
    within(dialog).getByRole("button", { name: "Next" }).click();
    await waitFor(() => expect(ring).toHaveAttribute("data-easing"));
    await expect(getComputedStyle(ring).transitionDuration).not.toBe("0s");
    await settled();
    await emulate("prefers-reduced-motion", "reduce");
    try {
      await sleep(300);
      await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
      within(body.getByRole("dialog")).getByRole("button", { name: "Back" }).click();
      await waitFor(() => expect(ring).toHaveAttribute("data-easing"));
      await expect(getComputedStyle(ring).transitionDuration).toBe("0s");
      await settled();
    } finally {
      await clearEmulation();
    }
    await closeWithEscape();
  },
};

export const EveryControlIsAtLeast24Pixels: Story = {
  name: "Every control on the card is at least 24 by 24 CSS pixels",
  render: () => <Demo />,
  play: async () => {
    const dialog = await startTour();
    for (const button of within(dialog).getAllByRole("button")) {
      const rect = button.getBoundingClientRect();
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
    await closeWithEscape();
  },
};

function Swapping() {
  const [presentation, setPresentation] = useState<"anchored" | "docked">("docked");
  // Toggled from the check with an event, since the page behind the tour cannot be pressed.
  useEffect(() => {
    const toggle = () => setPresentation((current) => (current === "docked" ? "anchored" : "docked"));
    window.addEventListener("tour-swap", toggle);
    return () => window.removeEventListener("tour-swap", toggle);
  }, []);
  return <Demo presentation={presentation} />;
}

export const FocusSurvivesAChangeOfForm: Story = {
  name: "Focus stays on Next when the card changes form (docked to anchored and back)",
  render: () => <Swapping />,
  play: async () => {
    const dialog = await startTour();
    while (document.activeElement !== within(dialog).getByRole("button", { name: "Next" })) await userEvent.tab();
    await expect(dialog).toHaveAttribute("data-placement", "docked");
    window.dispatchEvent(new Event("tour-swap"));
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
    await settled();
    await expect(body.getByRole("button", { name: "Next" })).toHaveFocus();
    window.dispatchEvent(new Event("tour-swap"));
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAttribute("data-placement", "docked"));
    await settled();
    await expect(body.getByRole("button", { name: "Next" })).toHaveFocus();
    await closeWithEscape();
  },
};

export const TabGoesRoundBetweenTheCardAndAnInteractiveElement: Story = {
  name: "On an interactive step Tab goes from the card into the element and back, in both directions",
  render: () => <Demo steps={interactiveSteps} />,
  play: async () => {
    const dialog = await startTour();
    const field = body.getByRole("textbox", { name: "Search" });
    const next = within(dialog).getByRole("button", { name: "Next" });
    next.focus();
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab({ shift: true });
    await expect(field).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(next).toHaveFocus();
    await closeWithEscape();
  },
};

export const UsingTheElementAdvancesTheStep: Story = {
  name: "A real press on an element with advanceOn moves the tour on",
  render: () => (
    <Demo
      steps={(find) => [
        { id: "create", target: () => find("create"), title: "Press the button", advanceOn: "click" },
        { id: "done", title: "Well done" },
      ]}
    />
  ),
  play: async () => {
    await startTour();
    const { x, y } = centreOf(demoElement("create"));
    await realClickAt(x, y);
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Well done"));
    await closeWithEscape();
  },
};

export const AStillPageIsNotMeasuredEveryFrame: Story = {
  name: "A tour on a still page slows its measuring down, and speeds up again when the page scrolls",
  render: () => <ScrollingPage />,
  parameters: { layout: "fullscreen" },
  play: async () => {
    await body.findByRole("dialog");
    await settled();
    await sleep(900);
    // Count the frames the tour (and the positioning engine it follows) asks for, by who is asking, over 700ms: a page that
    // measured every frame would ask about forty times.
    const original = window.requestAnimationFrame;
    let asked = 0;
    window.requestAnimationFrame = (callback) => {
      if (/useTourSpotlight|frameLoop/.test(new Error().stack ?? "")) asked += 1;
      return original(callback);
    };
    await sleep(700);
    window.requestAnimationFrame = original;
    await expect(asked).toBeLessThan(8);
    window.scrollBy(0, 40);
    await settled();
    const box = (ringOf() as HTMLElement).getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(ringOf() as HTMLElement).paddingLeft);
    await expect(close(box.top, demoElement("far").getBoundingClientRect().top - padding)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

function StickyHeaderPage() {
  return (
    <div>
      <div data-testid="header" style={{ background: "var(--dbm-bg-surface)", blockSize: "4rem", insetBlockStart: 0, position: "fixed", inlineSize: "100%", zIndex: 5 }}>
        Header
      </div>
      <div style={{ blockSize: "170vh", paddingBlockStart: "120vh" }}>
        <Button data-demo="low">Low down</Button>
      </div>
      <Tour
        defaultOpen
        scrollOffset={{ top: 64 }}
        steps={[{ id: "low", target: () => document.querySelector<HTMLElement>('[data-demo="low"]'), title: "Low down" }]}
      />
    </div>
  );
}

export const AStickyHeaderStaysClearOfTheElement: Story = {
  name: "scrollOffset keeps a scrolled-to element clear of a sticky header",
  parameters: { layout: "fullscreen" },
  render: () => <StickyHeaderPage />,
  play: async () => {
    await body.findByRole("dialog");
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    await sleep(700);
    await settled();
    const header = (await body.findByTestId("header")).getBoundingClientRect();
    await expect(demoElement("low").getBoundingClientRect().top).toBeGreaterThanOrEqual(header.bottom);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

function InsideADialog() {
  const [dialogOpen, setDialogOpen] = useState(true);
  const [tourOpen, setTourOpen] = useState(true);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Profile</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div data-demo="field">
            <Input aria-label="Name" placeholder="Name" />
          </div>
        </Dialog.Body>
        <Tour
          open={tourOpen}
          onOpenChange={setTourOpen}
          steps={[
            { id: "name", target: () => document.querySelector<HTMLElement>('[data-demo="field"]'), title: "Your name", content: "Say who you are." },
            { id: "end", title: "That's it" },
          ]}
        />
      </Dialog.Content>
    </Dialog>
  );
}

export const ATourRunsInsideAModalDialog: Story = {
  name: "A tour inside a modal dialog dims the dialog, can be pressed, and Escape closes only the tour",
  render: () => <InsideADialog />,
  play: async () => {
    await waitFor(() => expect(document.querySelector('[role="dialog"][data-placement="anchored"]')).not.toBeNull());
    await settled();
    const dialogs = body.getAllByRole("dialog");
    const tour = dialogs.find((candidate) => candidate.hasAttribute("data-placement")) as HTMLElement;
    const panel = dialogs.find((candidate) => !candidate.hasAttribute("data-placement")) as HTMLElement;
    // The dim is drawn over the dialog's own panel.
    const corner = panel.getBoundingClientRect();
    await expect(document.elementFromPoint(corner.left + 4, corner.top + 4)).toBe(shieldOf());
    // A real press on the tour's card is not a press outside the dialog.
    const { x, y } = centreOf(within(tour).getByRole("button", { name: "Next" }));
    await realClickAt(x, y);
    await waitFor(() => expect(body.getByRole("dialog", { name: "That's it" })).toBeInTheDocument());
    await expect(body.getAllByRole("dialog")).toHaveLength(2);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(layerOf()).toBeNull());
    // Only the tour closed.
    await expect(body.getByRole("dialog", { name: "Profile" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const TheDismissalsAreACentredFooterRow: Story = {
  name: "The dismissals are a footer under the buttons, on one centred row, each with a trailing caret; Skip is at the start of the main row",
  render: () => <Demo dismissals={["later", "never"]} />,
  play: async () => {
    const dialog = await startTour();
    const later = within(dialog).getByRole("button", { name: "Remind me later" });
    const never = within(dialog).getByRole("button", { name: "Don't show again" });
    const skip = within(dialog).getByRole("button", { name: "Skip tour" });
    const next = within(dialog).getByRole("button", { name: "Next" });
    const a = later.getBoundingClientRect();
    const b = never.getBoundingClientRect();
    // One row: the same line, side by side, both under the main row.
    await expect(Math.abs(a.top - b.top)).toBeLessThan(1);
    await expect(b.left).toBeGreaterThanOrEqual(a.right);
    await expect(a.top).toBeGreaterThanOrEqual(next.getBoundingClientRect().bottom);
    // Centred: the pair sits in the middle of the card.
    const card = dialog.getBoundingClientRect();
    await expect(Math.abs((a.left + b.right) / 2 - (card.left + card.width / 2))).toBeLessThan(2);
    // The footer runs the full width of the card, under a line.
    const footer = later.closest('[class*="_dismissals_"]') as HTMLElement;
    await expect(Math.abs(footer.getBoundingClientRect().width - card.width)).toBeLessThan(3);
    await expect(getComputedStyle(footer).borderBlockStartWidth).not.toBe("0px");
    // The caret follows the text.
    const caret = later.querySelector("svg") as SVGElement;
    await expect(caret.getBoundingClientRect().left).toBeGreaterThanOrEqual(a.left + a.width / 2);
    await expect(a.height).toBeGreaterThanOrEqual(24);
    // Skip is at the start of the main row, with Back and Next at the end.
    const s = skip.getBoundingClientRect();
    await expect(s.left - card.left).toBeLessThan(card.width / 4);
    await expect(s.right).toBeLessThanOrEqual(next.getBoundingClientRect().left);
    await expect(Math.abs(s.top - next.getBoundingClientRect().top)).toBeLessThan(8);
    await expect(within(dialog).queryByRole("button", { name: "Back" })).toBeNull();
    // It stays on the next step, where Back sits beside Next.
    await userEvent.click(next);
    await waitFor(() => expect(body.getByRole("dialog")).toHaveAccessibleName("Start something new"));
    await expect(body.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
    await expect(body.getByRole("button", { name: "Back" })).toBeInTheDocument();
    // The card is drawn afresh for the next step, so its buttons are looked up again.
    await userEvent.click(await body.findByRole("button", { name: "Remind me later" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(layerOf()).toBeNull());
  },
};

export const TheProgressBarIsToldApartInForcedColours: Story = {
  name: "In forced colours a reached progress segment differs from one not reached",
  render: () => <Demo progress="bar" dismissals={["later", "never"]} />,
  play: async () => {
    const dialog = await startTour();
    const segments = dialog.querySelectorAll<HTMLElement>('[class*="_segment_"]');
    await expect(segments).toHaveLength(4);
    await emulate("forced-colors", "active");
    try {
      await sleep(300);
      await expect(getComputedStyle(segments[0] as HTMLElement).backgroundColor).not.toBe(getComputedStyle(segments[3] as HTMLElement).backgroundColor);
    } finally {
      await clearEmulation();
    }
    for (const button of within(dialog).getAllByRole("button")) {
      const rect = button.getBoundingClientRect();
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
    await closeWithEscape();
  },
};

const sampleFrames = async (frames: number, read: () => number) => {
  const values: number[] = [];
  for (let frame = 0; frame < frames; frame += 1) {
    await nextFrame();
    values.push(read());
  }
  return values;
};

export const TheSpotlightFollowsContentInsertedAbove: Story = {
  name: "Content inserted above the element, with no scroll or resize, moves the spotlight within a third of a second",
  render: () => <Demo />,
  play: async () => {
    await startTour();
    const stage = await body.findByTestId("stage");
    await sleep(900);
    const spacer = document.createElement("div");
    spacer.style.blockSize = "3rem";
    spacer.style.flex = "none";
    stage.insertBefore(spacer, stage.firstChild);
    const started = performance.now();
    const padding = parseFloat(getComputedStyle(ringOf() as HTMLElement).paddingLeft);
    const aligned = () => Math.abs((ringOf() as HTMLElement).getBoundingClientRect().top - (demoElement("search").getBoundingClientRect().top - padding)) < 1.5;
    while (!aligned() && performance.now() - started < 1500) await nextFrame();
    await expect(performance.now() - started).toBeLessThan(400);
    spacer.remove();
    await closeWithEscape();
  },
};

export const TheSpotlightFollowsACssAnimation: Story = {
  name: "An element moved by a CSS animation keeps the spotlight on it while it moves",
  render: () => <Demo />,
  play: async () => {
    await startTour();
    await sleep(900);
    const style = document.createElement("style");
    style.textContent = "@keyframes tour-test-slide { from { translate: 0 0; } to { translate: 0 60px; } } .tour-test-slide { animation: tour-test-slide 800ms linear forwards; }";
    document.head.append(style);
    const element = demoElement("search");
    element.classList.add("tour-test-slide");
    await sleep(350);
    const padding = parseFloat(getComputedStyle(ringOf() as HTMLElement).paddingLeft);
    const off = Math.abs((ringOf() as HTMLElement).getBoundingClientRect().top - (element.getBoundingClientRect().top - padding));
    await expect(off).toBeLessThan(12);
    element.classList.remove("tour-test-slide");
    style.remove();
    await closeWithEscape();
  },
};

export const TheCardKeepsUpWithTheSpotlightBetweenSteps: Story = {
  name: "While the spotlight eases to the next step the card never strays far from it",
  render: () => <Demo steps={(find) => [
    { id: "search", target: () => find("search"), title: "Search", side: "bottom" },
    { id: "status", target: () => find("status"), title: "Status", side: "bottom" },
  ]} />,
  play: async () => {
    const dialog = await startTour();
    const gap = () => {
      const card = body.queryByRole("dialog")?.getBoundingClientRect();
      const ring = ringOf()?.getBoundingClientRect();
      return card && ring ? card.top - ring.bottom : Number.NaN;
    };
    const resting = gap();
    within(dialog).getByRole("button", { name: "Next" }).click();
    const samples = await sampleFrames(40, gap);
    const worst = Math.max(...samples.filter((value) => !Number.isNaN(value)).map((value) => Math.abs(value - resting)));
    await expect(worst).toBeLessThan(40);
    await settled();
    await expect(Math.abs(gap() - resting)).toBeLessThan(2);
    await closeWithEscape();
  },
};
