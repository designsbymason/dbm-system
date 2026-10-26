import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
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
    await expect(getComputedStyle(cls(never, "summary")).display).toBe("none");
  },
};

export const CompactAlways: Story = {
  name: "Compact always shows the summary on a wide screen, and the segments say the progress",
  render: () => <Demo compact="always" tone="success" />,
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
      await expect(getComputedStyle(cls(items[0]!, "connector")).backgroundColor).toBe(colour("Highlight"));
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
      await expect(getComputedStyle(cls(canvasElement, "connector")).transitionDuration).toBe("0s");
    } finally {
      await emulate("no-preference");
    }
  },
};
