import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Stepper } from "./Stepper";
import type { StepperProps } from "./Stepper.types";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// rings, a media query — measured in Chromium.
const meta: Meta = {
  title: "Organisms/Navigation/Stepper/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (element: Element) => element.getBoundingClientRect();
const centreY = (element: Element) => box(element).top + box(element).height / 2;
const centreX = (element: Element) => box(element).left + box(element).width / 2;
const colour = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};
const cls = (root: ParentNode, part: string) => root.querySelector<HTMLElement>(`[class*="_${part}_"]`)!;
const all = (root: ParentNode, part: string) => [...root.querySelectorAll<HTMLElement>(`[class*="_${part}_"]`)];

const Demo = (props: Partial<StepperProps>) => (
  <Stepper defaultValue="shipping" aria-label="Checkout" {...props}>
    <Stepper.Step value="account" title="Account" description="Your details" />
    <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
    <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
    <Stepper.Step value="review" title="Review" />
  </Stepper>
);

export const TargetSizeAtEverySize: Story = {
  name: "A step that can be entered is at least 24 by 24 pixels at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {sizes.map((size) => (
        <Demo key={size} size={size} interactive="all" aria-label={`size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons.length).toBe(sizes.length * 3);
    for (const button of buttons) {
      await expect(box(button).width).toBeGreaterThanOrEqual(24);
      await expect(box(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const LineMeetsTheIndicators: Story = {
  name: "The line runs level with the middle of the indicators, with the text beside or under them, at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`end-${size}`}>
          <Demo size={size} aria-label={`end ${size}`} />
        </div>
      ))}
      {sizes.map((size) => (
        <div key={size} data-testid={`bottom-${size}`}>
          <Demo size={size} labelPlacement="bottom" aria-label={`bottom ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const placement of ["end", "bottom"]) {
      for (const size of sizes) {
        const root = canvas.getByTestId(`${placement}-${size}`);
        const indicator = cls(root, "indicator");
        for (const connector of all(root, "connector")) {
          await expect(Math.abs(centreY(connector) - centreY(indicator)), `${placement} ${size}`).toBeLessThanOrEqual(1);
        }
      }
    }
  },
};

export const VerticalLineUnderTheIndicator: Story = {
  name: "Vertically, the line runs down the middle of the indicator and reaches the next one",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`v-${size}`}>
          <Demo size={size} orientation="vertical" aria-label={`vertical ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const root = canvas.getByTestId(`v-${size}`);
      const indicators = all(root, "indicator");
      const connectors = all(root, "connector");
      await expect(connectors.length).toBe(3);
      for (const [index, connector] of connectors.entries()) {
        await expect(Math.abs(centreX(connector) - centreX(indicators[index]!)), `${size} column`).toBeLessThanOrEqual(1);
        const gap = box(indicators[index + 1]!).top - box(connector).bottom;
        await expect(gap, `${size} stops just short of the next indicator`).toBeLessThanOrEqual(8);
        await expect(box(connector).top, `${size} starts under its own indicator`).toBeGreaterThanOrEqual(box(indicators[index]!).bottom);
      }
    }
  },
};

export const RightToLeft: Story = {
  name: "Right to left, the steps run from the right and the line fills towards the left",
  render: () => <Demo dir="rtl" />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    await expect(box(items[0]!).left).toBeGreaterThan(box(items[3]!).left);
    const indicator = cls(items[0]!, "indicator");
    const connector = cls(items[0]!, "connector");
    await expect(box(connector).right).toBeLessThanOrEqual(box(indicator).left + 0.5);
  },
};

export const NothingMovesWhenTheStepChanges: Story = {
  name: "Moving to the next step changes no step's width or position",
  render: () => <Demo interactive="all" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const measure = () => canvas.getAllByRole("listitem").map((item) => [box(item).left, box(item).width, box(item).top, box(item).height]);
    const before = measure();
    await userEvent.click(canvas.getByRole("button", { name: /^Payment/ }));
    await settle(400);
    await expect(canvas.getByText("Payment").closest("li")).toHaveAttribute("data-status", "current");
    const after = measure();
    for (const [index, rect] of before.entries()) {
      for (const [axis, value] of rect.entries()) {
        await expect(Math.abs(after[index]![axis]! - value), `step ${index} axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
  },
};

export const OneTabStopPerEnterableStep: Story = {
  name: "Tab visits each step that can be entered once, in order, and then leaves",
  render: () => (
    <div>
      <button>before</button>
      <Demo interactive="all" />
      <button>after</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "before" }).focus();
    for (const name of [/^Account/, /^Payment/, /^Review/, "after"]) {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name })).toHaveFocus();
    }
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("button", { name: /^Review/ })).toHaveFocus();
  },
};

export const FocusedStepScrollsFullyIntoView: Story = {
  name: "In a strip too narrow for the steps, each focused step ends up fully inside it, ring included",
  render: () => (
    <div style={{ inlineSize: "22rem" }}>
      <Demo interactive="all" data-testid="strip" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByTestId("strip");
    const scroller = nav.firstElementChild as HTMLElement;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    // A step can be focused, so the strip is not a tab stop of its own.
    await expect(scroller).not.toHaveAttribute("tabindex");
    const buttons = within(nav).getAllByRole("button");
    for (const button of buttons) {
      button.focus();
      await waitFor(() => {
        const strip = box(scroller);
        const step = box(button);
        expect(step.left).toBeGreaterThanOrEqual(strip.left - 0.5);
        expect(step.right).toBeLessThanOrEqual(strip.right + 0.5);
      });
    }
    // The ring is drawn inside the step, so the scrolling strip cannot clip it.
    buttons[0]!.focus();
    const style = getComputedStyle(buttons[0]!);
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
  },
};

export const ScrollingStripWithNoStepToFocus: Story = {
  name: "A strip that scrolls and has no step to focus is itself reachable by keyboard",
  render: () => (
    <div style={{ inlineSize: "22rem" }}>
      <Demo data-testid="strip" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scroller = within(canvasElement).getByTestId("strip").firstElementChild as HTMLElement;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await waitFor(() => expect(scroller).toHaveAttribute("tabindex", "0"));
  },
};

export const CompactOnAPhone: Story = {
  name: "Compact auto shows the summary on a phone and the steps on a wide screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      <Demo compact="auto" aria-label="auto" />
      <Demo compact="never" aria-label="never" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const auto = within(canvasElement).getByRole("navigation", { name: "auto" });
    const never = within(canvasElement).getByRole("navigation", { name: "never" });
    await expect(getComputedStyle(cls(auto, "list")).display).toBe("none");
    await expect(getComputedStyle(cls(auto, "summary")).display).not.toBe("none");
    await expect(cls(auto, "summary").textContent).toContain("Step 2 of 4 — Shipping");
    await expect(getComputedStyle(cls(never, "list")).display).not.toBe("none");
    await expect(never.querySelector("[class*='_summary_']")).toBeNull();
  },
};

export const CompactAlways: Story = {
  name: "Compact always shows the summary on a wide screen, and the segments say the progress",
  render: () => <Demo compact="always" tone="info" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(640);
    await expect(getComputedStyle(cls(canvasElement, "list")).display).toBe("none");
    const segments = all(canvasElement, "segment");
    await expect(segments.length).toBe(4);
    const done = segments.map((segment) => getComputedStyle(segment).backgroundColor);
    await expect(done[0]).toBe(done[1]);
    await expect(done[2]).not.toBe(done[1]);
  },
};

export const ForcedColours: Story = {
  name: "Forced colours: the current step has a Highlight border, an unreached one GrayText, and the line is told by colour",
  render: () => <Demo defaultValue="payment" />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const items = within(canvasElement).getAllByRole("listitem");
      const ring = (item: HTMLElement) => getComputedStyle(cls(item, "indicator")).borderTopColor;
      await expect(ring(items[2]!)).toBe(colour("Highlight"));
      await expect(ring(items[0]!)).toBe(colour("Highlight"));
      await expect(ring(items[3]!)).toBe(colour("GrayText"));
      await expect(parseFloat(getComputedStyle(cls(items[2]!, "indicator")).borderTopWidth)).toBeGreaterThanOrEqual(4);
      await expect(getComputedStyle(cls(items[0]!, "connector"), "::after").backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(cls(items[2]!, "connector")).backgroundColor).toBe(colour("GrayText"));
    } finally {
      await emulate("none");
    }
  },
};

export const ReducedMotion: Story = {
  name: "With reduced motion the indicator and line do not animate between states",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "reduce" | "no-preference") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    const indicator = cls(canvasElement, "indicator");
    // The test run may start with reduced motion already on, so both sides are set explicitly.
    await emulate("no-preference");
    try {
      await settle(200);
      await expect(getComputedStyle(indicator).transitionDuration).not.toBe("0s");
      await emulate("reduce");
      await settle(200);
      await expect(getComputedStyle(indicator).transitionDuration).toBe("0s");
      await expect(getComputedStyle(cls(canvasElement, "connector"), "::after").transitionDuration).toBe("0s");
    } finally {
      await emulate("no-preference");
    }
  },
};

export const FilledLineIsScaledIn: Story = {
  name: "A finished step's line is the tone's colour scaled in over the grey track; the rest are not",
  render: () => <Demo defaultValue="payment" />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    const scale = (item: HTMLElement) => getComputedStyle(cls(item, "connector"), "::after").scale;
    await expect(scale(items[0]!)).toBe("1");
    await expect(scale(items[1]!)).toBe("1");
    await expect(scale(items[2]!)).toBe("0 1");
  },
};

export const BusyStepKeepsItsSize: Story = {
  name: "A busy step shows a spinner without changing the indicator's size or the step's place",
  render: function BusyStory() {
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        {sizes.map((size) => (
          <Stepper key={size} size={size} defaultValue="b" aria-label={`busy ${size}`}>
            <Stepper.Step value="a" title="One" />
            <Stepper.Step value="b" title="Two" busy data-testid={`busy-${size}`} />
            <Stepper.Step value="c" title="Three" data-testid={`idle-${size}`} />
          </Stepper>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const busy = canvas.getByTestId(`busy-${size}`);
      const idle = canvas.getByTestId(`idle-${size}`);
      const indicator = cls(busy, "indicator");
      await expect(box(indicator).width, size).toBe(box(cls(idle, "indicator")).width);
      const spinner = indicator.firstElementChild as HTMLElement;
      await expect(spinner, size).not.toBeNull();
      await expect(box(spinner).width, `${size} spinner is drawn`).toBeGreaterThan(0);
      await expect(box(spinner).width, `${size} fits the indicator`).toBeLessThanOrEqual(box(indicator).width);
      await expect(centreX(spinner) - centreX(indicator), `${size} centred`).toBeLessThanOrEqual(1);
    }
  },
};

export const SquareIndicators: Story = {
  name: "With rounded off an indicator is a square with rounded corners, and by default a circle, at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      <div data-testid="squares" style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        {sizes.map((size) => (
          <Demo key={size} size={size} rounded={false} aria-label={`square ${size}`} />
        ))}
      </div>
      <div data-testid="circles">
        <Demo aria-label="circles" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const indicator of all(canvasElement.querySelector<HTMLElement>("[data-testid='squares']")!, "indicator")) {
      const radius = parseFloat(getComputedStyle(indicator).borderTopLeftRadius);
      await expect(radius).toBeGreaterThan(0);
      await expect(radius).toBeLessThan(box(indicator).width / 2);
    }
    for (const indicator of all(canvasElement.querySelector<HTMLElement>("[data-testid='circles']")!, "indicator")) {
      await expect(parseFloat(getComputedStyle(indicator).borderTopLeftRadius)).toBeGreaterThanOrEqual(box(indicator).width / 2);
    }
  },
};

export const DashedLines: Story = {
  name: "A dashed line stays level with the indicators, horizontally and down the column, and a skipped step's line is dashed",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <div data-testid="h">
        <Demo connector="dashed" aria-label="dashed h" />
      </div>
      <div data-testid="v">
        <Demo connector="dashed" orientation="vertical" aria-label="dashed v" />
      </div>
      <div data-testid="s">
        <Stepper defaultValue="c" aria-label="skipped">
          <Stepper.Step value="a" title="One" />
          <Stepper.Step value="b" title="Two" status="skipped" />
          <Stepper.Step value="c" title="Three" />
        </Stepper>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const h = canvas.getByTestId("h");
    for (const connector of all(h, "connector")) {
      await expect(getComputedStyle(connector).borderTopStyle).toBe("dashed");
      await expect(Math.abs(centreY(connector) - centreY(cls(h, "indicator")))).toBeLessThanOrEqual(1);
    }
    const v = canvas.getByTestId("v");
    const indicators = all(v, "indicator");
    for (const [index, connector] of all(v, "connector").entries()) {
      await expect(getComputedStyle(connector).borderInlineStartStyle).toBe("dashed");
      await expect(Math.abs(centreX(connector) - centreX(indicators[index]!))).toBeLessThanOrEqual(1);
    }
    const s = canvas.getByTestId("s");
    const lines = all(s, "connector");
    await expect(getComputedStyle(lines[0]!).borderTopStyle).toBe("none");
    await expect(getComputedStyle(lines[1]!).borderTopStyle).toBe("dashed");
  },
};

export const LongTitlesWrap: Story = {
  name: "A long title wraps at the label width instead of stretching its step, beside and under the indicator",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["end", "bottom"] as const).map((placement) => (
        <Stepper key={placement} labelPlacement={placement} defaultValue="a" aria-label={placement}>
          <Stepper.Step
            value="a"
            title="Verify the billing address on the account holder's most recent statement"
            description="A description that is also quite a lot longer than any step should ever need to hold"
            data-testid={`long-${placement}`}
          />
          <Stepper.Step value="b" title="Done" />
        </Stepper>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cap = parseFloat(getComputedStyle(document.documentElement).fontSize) * 14;
    for (const placement of ["end", "bottom"]) {
      const content = cls(canvas.getByTestId(`long-${placement}`), "content");
      await expect(box(content).width, placement).toBeLessThanOrEqual(cap + 1);
      await expect(box(content).height, `${placement} wrapped`).toBeGreaterThan(48);
    }
  },
};

export const CurrentStepIsBroughtIntoView: Story = {
  name: "In a strip too narrow for the steps, a current step off the edge is scrolled fully into view, and again when it changes",
  render: function StripStory() {
    const [value, setValue] = useState("e");
    return (
      <div style={{ inlineSize: "22rem" }}>
        <Stepper value={value} onValueChange={setValue} aria-label="strip" data-testid="strip">
          {["a", "b", "c", "d", "e", "f", "g"].map((id) => (
            <Stepper.Step key={id} value={id} title={`Step ${id}`} description="Some detail" />
          ))}
        </Stepper>
        <button onClick={() => setValue("a")}>first</button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = canvas.getByTestId("strip").firstElementChild as HTMLElement;
    const current = () => canvas.getByTestId("strip").querySelector<HTMLElement>("[data-status='current']")!;
    const inside = () => {
      const strip = box(scroller);
      const step = box(current());
      return step.left >= strip.left - 0.5 && step.right <= strip.right + 0.5;
    };
    await waitFor(() => expect(inside()).toBe(true));
    await expect(scroller.scrollLeft).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("button", { name: "first" }));
    await waitFor(() => expect(inside()).toBe(true));
    await waitFor(() => expect(scroller.scrollLeft).toBeLessThanOrEqual(1));
  },
};

export const ResponsiveOrientationOnAPhone: Story = {
  name: "A responsive orientation is vertical at a phone's width and horizontal on a wide screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Demo orientation={{ base: "vertical", md: "horizontal" }} data-testid="r" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const nav = within(canvasElement).getByTestId("r");
    await expect(nav).toHaveAttribute("data-orientation", "vertical");
    const items = within(nav).getAllByRole("listitem");
    await expect(box(items[1]!).top).toBeGreaterThan(box(items[0]!).top);
    await expect(Math.abs(box(items[1]!).left - box(items[0]!).left)).toBeLessThanOrEqual(1);
  },
};

export const ResponsiveOrientationWide: Story = {
  name: "On a wide screen the same stepper runs in a row",
  render: () => <Demo orientation={{ base: "vertical", md: "horizontal" }} data-testid="r" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const nav = within(canvasElement).getByTestId("r");
    await waitFor(() => expect(nav).toHaveAttribute("data-orientation", "horizontal"));
    const items = within(nav).getAllByRole("listitem");
    await expect(Math.abs(box(items[1]!).top - box(items[0]!).top)).toBeLessThanOrEqual(1);
  },
};

export const FocusFollowsTheWidth: Story = {
  name: "Crossing the compact breakpoint with focus in the steps moves focus to the summary, and back, instead of losing it",
  render: () => <Demo compact="auto" interactive="completed" defaultValue="payment" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The story runs in a frame whose width is the page's width, so the width the page sees is changed on the frame.
    const frame = window.frameElement as HTMLElement | null;
    await expect(frame, "the story runs in a frame").not.toBeNull();
    const original = frame!.style.width;
    const list = canvasElement.querySelector<HTMLElement>("[class*='_list_']")!;
    const step = canvas.getAllByRole("button").find((button) => list.contains(button))!;
    step.focus();
    await expect(step).toHaveFocus();
    try {
      frame!.style.width = "400px";
      await waitFor(() => expect(window.innerWidth).toBeLessThan(640));
      await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Previous step" })));
      frame!.style.width = original || "";
      await waitFor(() => expect(window.innerWidth).toBeGreaterThanOrEqual(640));
      await waitFor(() => expect(list.contains(document.activeElement)).toBe(true));
    } finally {
      frame!.style.width = original;
    }
  },
};

export const UpcomingStepsAreTheSoftTone: Story = {
  name: "A step not yet reached has the tone's subtle border, and its subtle fill when filled and none when outlined, in every tone",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {(["brand", "info", "highlight", "neutral"] as const).flatMap((tone) =>
        (["filled", "outlined"] as const).map((variant) => (
          <div key={`${tone}-${variant}`} data-testid={`${tone}-${variant}`}>
            <Demo tone={tone} variant={variant} aria-label={`${tone} ${variant}`} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(--dbm-${name})`;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    for (const tone of ["brand", "info", "highlight", "neutral"]) {
      for (const variant of ["filled", "outlined"]) {
        const items = within(canvas.getByTestId(`${tone}-${variant}`)).getAllByRole("listitem");
        const upcoming = getComputedStyle(cls(items[3]!, "indicator"));
        await expect(upcoming.borderTopColor, `${tone} ${variant} border`).toBe(token(`border-${tone}-subtle`));
        await expect(upcoming.backgroundColor, `${tone} ${variant} fill`).toBe(
          variant === "filled" ? token(`bg-${tone}-subtle`) : "rgba(0, 0, 0, 0)",
        );
      }
    }
  },
};

export const CompactRowDoesNotShift: Story = {
  name: "Compact, from the first step to the last and back: Back and Next are always there side by side, and the row's size, the text and the buttons never move",
  render: () => <Demo compact="always" interactive="all" defaultValue="account" data-testid="c" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByTestId("c");
    const back = () => canvas.getByRole("button", { name: "Previous step" });
    const next = () => canvas.getByRole("button", { name: "Next step" });
    const textLeft = () => {
      const range = document.createRange();
      range.selectNodeContents(cls(nav, "summaryText"));
      return range.getBoundingClientRect().left;
    };
    const measure = () => [box(nav).height, box(nav).width, box(cls(nav, "segments")).top, textLeft(), box(back()).left, box(next()).left];
    const first = measure();
    // Side by side: Back ends where Next begins, bar the gap.
    await expect(box(next()).left - box(back()).right).toBeLessThanOrEqual(8);
    await expect(box(next()).left - box(back()).right).toBeGreaterThanOrEqual(0);
    await expect(back()).toBeDisabled();
    await expect(next()).toBeEnabled();
    for (const _ of [0, 1, 2]) {
      await userEvent.click(next());
      const now = measure();
      for (const [axis, value] of first.entries()) {
        await expect(Math.abs(now[axis]! - value), `forward axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
    await expect(next()).toBeDisabled();
    await expect(back()).toBeEnabled();
    await expect(nav.contains(document.activeElement) && document.activeElement !== document.body).toBe(true);
    await expect(document.activeElement).toBe(back());
    for (const _ of [0, 1, 2]) {
      await userEvent.click(back());
      const now = measure();
      for (const [axis, value] of first.entries()) {
        await expect(Math.abs(now[axis]! - value), `back axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
    await expect(back()).toBeDisabled();
    await expect(document.activeElement).toBe(next());
  },
};

export const CompactVerticalColumn: Story = {
  name: "Compact and vertical: one column of Up, the bars, Down and the place as numbers, both arrows always there, and nothing moving from the first step to the last and back",
  render: () => <Demo compact="always" orientation="vertical" interactive="all" defaultValue="account" data-testid="cv" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByTestId("cv");
    const segments = all(nav, "segment");
    const text = cls(nav, "summaryText");
    const back = () => canvas.getByRole("button", { name: "Previous step" });
    const next = () => canvas.getByRole("button", { name: "Next step" });
    const measure = () => [box(nav).height, box(nav).width, box(cls(nav, "segments")).top, box(text).top, box(text).left, box(back()).top, box(next()).top];
    const first = measure();
    // The bars: a column, in order, each taller than wide, the same x.
    await expect(segments).toHaveLength(4);
    for (const [index, segment] of segments.entries()) {
      if (index > 0) await expect(box(segment).top).toBeGreaterThan(box(segments[index - 1]!).top);
      await expect(Math.abs(box(segment).left - box(segments[0]!).left)).toBeLessThanOrEqual(0.5);
      await expect(box(segment).width).toBeLessThan(box(segment).height);
    }
    // Up above the bars, Down below them, the place below Down, all on one axis; the place is just numbers.
    await expect(box(back()).bottom).toBeLessThanOrEqual(box(segments[0]!).top + 0.5);
    await expect(box(next()).top).toBeGreaterThanOrEqual(box(segments[3]!).bottom - 0.5);
    await expect(box(text).top).toBeGreaterThanOrEqual(box(next()).bottom - 0.5);
    await expect(Math.abs(centreX(back()) - centreX(segments[0]!))).toBeLessThanOrEqual(1);
    await expect(Math.abs(centreX(next()) - centreX(segments[0]!))).toBeLessThanOrEqual(1);
    await expect(text.querySelector("[aria-hidden='true']")!.textContent).toBe("1/4");
    await expect(back()).toBeDisabled();
    for (const _ of [0, 1, 2]) {
      await userEvent.click(next());
      const now = measure();
      for (const [axis, value] of first.entries()) {
        await expect(Math.abs(now[axis]! - value), `forward axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
    await expect(text.querySelector("[aria-hidden='true']")!.textContent).toBe("4/4");
    await expect(next()).toBeDisabled();
    await expect(document.activeElement).toBe(back());
    for (const _ of [0, 1, 2]) {
      await userEvent.click(back());
      const now = measure();
      for (const [axis, value] of first.entries()) {
        await expect(Math.abs(now[axis]! - value), `back axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
    await expect(back()).toBeDisabled();
    await expect(document.activeElement).toBe(next());
    const done = segments.map((segment) => getComputedStyle(segment).backgroundColor);
    await expect(done[1]).not.toBe(done[0]);
  },
};

export const SummaryButtonsAreBigEnough: Story = {
  name: "The compact summary's Back and Next are at least 24 by 24 pixels, horizontally and vertically",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Demo compact="always" interactive="all" aria-label="horizontal summary" />
      <Demo compact="always" interactive="all" orientation="vertical" aria-label="vertical summary" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = [...within(canvasElement).getAllByRole("button", { name: /(Previous|Next) step/ })];
    await expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      await expect(box(button).width).toBeGreaterThanOrEqual(24);
      await expect(box(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const CompactRightToLeft: Story = {
  name: "Compact, right to left: the text starts at the right, Back is to the right of Next, and their arrows point the reading way",
  render: () => <Demo compact="always" interactive="all" defaultValue="shipping" dir="rtl" data-testid="rtl" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByTestId("rtl");
    const back = canvas.getByRole("button", { name: "Previous step" });
    const next = canvas.getByRole("button", { name: "Next step" });
    await expect(box(back).left).toBeGreaterThan(box(next).left);
    const range = document.createRange();
    range.selectNodeContents(cls(nav, "summaryText"));
    await expect(box(cls(nav, "summaryRow")).right - range.getBoundingClientRect().right).toBeLessThanOrEqual(2);
    // The arrows flip so Back points right and Next left, as the reading direction runs.
    await expect(getComputedStyle(back).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await expect(getComputedStyle(next).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await userEvent.click(next);
    await expect(cls(nav, "summaryText").textContent).toContain("Step 3 of 4");
  },
};

export const LongTitleKeepsTheSummaryOneLine: Story = {
  name: "Compact, a long title is cut with an ellipsis, so the row's height is the same on every step",
  render: function LongTitleStory() {
    return (
      <div style={{ inlineSize: "18rem" }}>
        <Stepper compact="always" interactive="all" defaultValue="a" aria-label="long" data-testid="long">
          <Stepper.Step value="a" title="Short" />
          <Stepper.Step value="b" title="Verify the billing address on the account holder's most recent statement" />
          <Stepper.Step value="c" title="Done" />
        </Stepper>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByTestId("long");
    const first = box(nav).height;
    await userEvent.click(canvas.getByRole("button", { name: "Next step" }));
    const text = cls(nav, "summaryText");
    await expect(text.scrollWidth, "the text is longer than its box").toBeGreaterThan(text.clientWidth);
    await expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
    await expect(Math.abs(box(nav).height - first)).toBeLessThanOrEqual(0.5);
    // Cut visually only: the whole title is still in the text, and the buttons stay on the row.
    await expect(text.textContent).toContain("most recent statement");
    // The whole text is in a tooltip, shown because it was cut short.
    await userEvent.hover(text);
    await expect((await within(document.body).findByRole("tooltip")).textContent).toContain("most recent statement");
    await userEvent.unhover(text);
    await waitFor(() => expect(within(document.body).queryByRole("tooltip")).toBeNull());
    await expect(box(canvas.getByRole("button", { name: "Next step" })).right).toBeLessThanOrEqual(box(nav).right + 0.5);
    await userEvent.click(canvas.getByRole("button", { name: "Next step" }));
    await expect(Math.abs(box(nav).height - first)).toBeLessThanOrEqual(0.5);
  },
};

export const DisabledStepIsAnUnavailableButton: Story = {
  name: "A disabled step is a disabled button in the page: not a tab stop, and not pressed by a click",
  render: () => (
    <Stepper interactive="all" defaultValue="a" aria-label="disabled" data-testid="dis">
      <Stepper.Step value="a" title="One" />
      <Stepper.Step value="b" title="Two" disabled />
      <Stepper.Step value="c" title="Three" />
    </Stepper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const two = canvas.getByRole("button", { name: /^Two/ });
    await expect(two).toBeDisabled();
    await expect(getComputedStyle(two).cursor).toBe("not-allowed");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /^Three/ })).toHaveFocus();
    await expect(canvas.getByText("One").closest("li")).toHaveAttribute("aria-current", "step");
  },
};

export const CompactVerticalFillsTheContainer: Story = {
  name: "Compact and vertical in a container of set height: the stepper fills it, the bars share the room between Up and Down, and Down and the place sit at the bottom",
  render: () => (
    <div data-testid="frame" style={{ blockSize: "24rem" }}>
      <Demo compact="always" orientation="vertical" interactive="all" defaultValue="shipping" data-testid="full" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    const nav = canvas.getByTestId("full");
    await expect(Math.abs(box(nav).height - box(frame).height)).toBeLessThanOrEqual(1);
    const segments = all(nav, "segment");
    const heights = segments.map((segment) => box(segment).height);
    await expect(Math.min(...heights)).toBeGreaterThan(40);
    await expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    const text = cls(nav, "summaryText");
    await expect(box(frame).bottom - box(text).bottom).toBeLessThanOrEqual(2);
    await expect(box(canvas.getByRole("button", { name: "Next step" })).top).toBeGreaterThanOrEqual(box(segments[3]!).bottom - 0.5);
    await expect(box(canvas.getByRole("button", { name: "Previous step" })).bottom).toBeLessThanOrEqual(box(segments[0]!).top + 0.5);
  },
};

export const CompactVerticalInAnAutoHeightContainer: Story = {
  name: "Compact and vertical with no set height keeps its own natural height",
  render: () => (
    <div data-testid="frame">
      <Demo compact="always" orientation="vertical" interactive="all" defaultValue="shipping" data-testid="natural" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(box(canvas.getByTestId("natural")).height).toBeLessThan(200);
    await expect(Math.max(...all(canvasElement, "segment").map((segment) => box(segment).height))).toBeLessThanOrEqual(20);
  },
};

export const CompactCentredLayout: Story = {
  name: "Compact with the text centred: the text is in the middle of the row, Back at the start edge and Next at the end, mirrored right to left",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <div data-testid="ltr">
        <Demo compact="always" interactive="all" labelAlignment="center" defaultValue="shipping" aria-label="centred ltr" />
      </div>
      <div data-testid="rtl">
        <Demo compact="always" interactive="all" labelAlignment="center" defaultValue="shipping" dir="rtl" aria-label="centred rtl" />
      </div>
      <div data-testid="plain">
        <Demo compact="always" labelAlignment="center" defaultValue="shipping" aria-label="centred read only" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textBox = (root: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(cls(root, "summaryText"));
      return range.getBoundingClientRect();
    };
    for (const dir of ["ltr", "rtl"]) {
      const root = canvas.getByTestId(dir);
      const row = box(cls(root, "summaryRow"));
      const back = box(within(root).getByRole("button", { name: "Previous step" }));
      const next = box(within(root).getByRole("button", { name: "Next step" }));
      const text = textBox(root);
      // The text is centred on the row, within a pixel or two, and Back and Next are at the two ends.
      await expect(Math.abs(text.left + text.width / 2 - (row.left + row.width / 2)), `${dir} centred`).toBeLessThanOrEqual(2);
      if (dir === "ltr") {
        await expect(back.left - row.left).toBeLessThanOrEqual(1);
        await expect(row.right - next.right).toBeLessThanOrEqual(1);
      } else {
        await expect(row.right - back.right).toBeLessThanOrEqual(1);
        await expect(next.left - row.left).toBeLessThanOrEqual(1);
      }
    }
    // With no buttons the text is centred across the whole row.
    const plain = canvas.getByTestId("plain");
    const row = box(cls(plain, "summaryRow"));
    const text = textBox(plain);
    await expect(Math.abs(text.left + text.width / 2 - (row.left + row.width / 2))).toBeLessThanOrEqual(2);
  },
};

export const WithoutLabelsDrawsIndicatorsOnly: Story = {
  name: "Without labels no text is seen, the steps still meet the 24 pixel target and keep the line level, and the titles are tooltips",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`nl-${size}`}>
          <Demo showLabels={false} size={size} interactive="all" aria-label={`no labels ${size}`} />
        </div>
      ))}
      <div data-testid="nl-v">
        <Demo showLabels={false} orientation="vertical" aria-label="no labels vertical" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const root = canvas.getByTestId(`nl-${size}`);
      for (const content of all(root, "content")) {
        await expect(box(content.parentElement!).width, `${size} hidden text`).toBeLessThanOrEqual(1);
      }
      for (const button of within(root).getAllByRole("button")) {
        await expect(box(button).width, `${size} width`).toBeGreaterThanOrEqual(24);
        await expect(box(button).height, `${size} height`).toBeGreaterThanOrEqual(24);
        await expect(button.getAttribute("title"), "a native tooltip is not used").toBeNull();
      }
      const indicator = cls(root, "indicator");
      for (const connector of all(root, "connector")) {
        await expect(Math.abs(centreY(connector) - centreY(indicator)), `${size} line level`).toBeLessThanOrEqual(1);
      }
    }
    // The DBM tooltip shows the title for the focused step.
    await userEvent.tab();
    const tip = await within(document.body).findByRole("tooltip");
    await expect(tip.textContent).toMatch(/Account|Payment|Review/);
    // An overlay a check opens is closed again, and gone, before it ends.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("tooltip")).toBeNull());
    const vertical = canvas.getByTestId("nl-v");
    const indicators = all(vertical, "indicator");
    for (const [index, connector] of all(vertical, "connector").entries()) {
      await expect(Math.abs(centreX(connector) - centreX(indicators[index]!))).toBeLessThanOrEqual(1);
    }
  },
};

export const StartedStepIsDashed: Story = {
  name: "A started step has a dashed ring in the tone's colour, filled and outlined; no other step is dashed; colourful makes finished steps success and leaves the started step in the tone",
  render: function StartedStory() {
    const Flow = ({ testId, ...props }: Partial<StepperProps> & { testId: string }) => {
      const [value, setValue] = useState("c");
      return (
        <div data-testid={testId}>
          <Stepper value={value} onValueChange={setValue} interactive="completed" aria-label={testId} {...props}>
            {["a", "b", "c", "d"].map((id) => (
              <Stepper.Step key={id} value={id} title={`Step ${id}`} />
            ))}
          </Stepper>
          <button onClick={() => setValue("a")}>back-{testId}</button>
        </div>
      );
    };
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        <Flow testId="filled" />
        <Flow testId="outlined" variant="outlined" />
        <Flow testId="colourful" colorful />
        <Flow testId="colourfulOutlined" colorful variant="outlined" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(--dbm-${name})`;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    for (const id of ["filled", "outlined", "colourful", "colourfulOutlined"]) {
      await userEvent.click(canvas.getByRole("button", { name: `back-${id}` }));
    }
    const indicators = (id: string) => all(canvas.getByTestId(id), "indicator").map((indicator) => getComputedStyle(indicator));
    for (const id of ["filled", "outlined", "colourful", "colourfulOutlined"]) {
      const styles = indicators(id);
      // Steps a, b, c, d: current a, finished b, started c, not started d.
      await expect(styles.map((style) => style.borderTopStyle), id).toEqual(["solid", "solid", "dashed", "solid"]);
    }
    await expect(indicators("filled")[2]!.borderTopColor).toBe(token("border-brand"));
    await expect(indicators("outlined")[2]!.borderTopColor).toBe(token("border-brand"));
    await expect(indicators("outlined")[2]!.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // Colourful: success for a finished step; the current and the started step keep the tone.
    await expect(indicators("colourful")[1]!.backgroundColor).toBe(token("bg-success"));
    await expect(indicators("colourful")[2]!.borderTopColor).toBe(token("border-brand"));
    await expect(indicators("colourful")[2]!.backgroundColor).toBe(token("bg-brand-subtle"));
    await expect(indicators("colourful")[0]!.borderTopColor).toBe(token("border-brand"));
    await expect(indicators("colourfulOutlined")[1]!.borderTopColor).toBe(token("border-success"));
    await expect(indicators("colourfulOutlined")[2]!.borderTopColor).toBe(token("border-brand"));
    await expect(indicators("colourfulOutlined")[2]!.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // The line after a finished step is success when colourful, the tone when not.
    const line = (id: string) => getComputedStyle(cls(canvas.getByTestId(id).querySelectorAll("li")[1] as HTMLElement, "connector"), "::after").backgroundColor;
    await expect(line("colourful")).toBe(token("bg-success"));
    await expect(line("filled")).toBe(token("bg-brand"));
  },
};

export const CompactNoLabelsButtonsAtTheEnds: Story = {
  name: "Compact without labels: Back and Next are at the two ends of the bars, in one row, mirrored right to left, and nothing moves from the first step to the last",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <div data-testid="ltr">
        <Demo compact="always" interactive="all" showLabels={false} defaultValue="account" aria-label="ltr" />
      </div>
      <div data-testid="rtl">
        <Demo compact="always" interactive="all" showLabels={false} defaultValue="shipping" dir="rtl" aria-label="rtl" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const dir of ["ltr", "rtl"]) {
      const root = canvas.getByTestId(dir);
      const back = box(within(root).getByRole("button", { name: "Previous step" }));
      const next = box(within(root).getByRole("button", { name: "Next step" }));
      const bars = box(cls(root, "segments"));
      const start = dir === "ltr" ? back : next;
      const end = dir === "ltr" ? next : back;
      await expect(start.right, `${dir} first end`).toBeLessThanOrEqual(bars.left + 0.5);
      await expect(end.left, `${dir} last end`).toBeGreaterThanOrEqual(bars.right - 0.5);
      // One row: the buttons and the bars share a centre line.
      await expect(Math.abs(back.top + back.height / 2 - (bars.top + bars.height / 2))).toBeLessThanOrEqual(1);
      await expect(Math.abs(next.top + next.height / 2 - (bars.top + bars.height / 2))).toBeLessThanOrEqual(1);
    }
    // Nothing moves as a person goes from the first step to the last: both buttons are always there.
    const ltr = canvas.getByTestId("ltr");
    const measure = () => [box(ltr).height, box(cls(ltr, "segments")).left, box(cls(ltr, "segments")).right];
    const first = measure();
    for (const _ of [0, 1, 2]) {
      await userEvent.click(within(ltr).getByRole("button", { name: "Next step" }));
      for (const [axis, value] of first.entries()) {
        await expect(Math.abs(measure()[axis]! - value), `axis ${axis}`).toBeLessThanOrEqual(0.5);
      }
    }
    await expect(within(ltr).getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(ltr.contains(document.activeElement) && document.activeElement !== document.body).toBe(true);
  },
};
