import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Stat } from "./Stat";
import type { StatSize } from "./Stat.types";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do — real text widths. They run in the `storybook` (Chromium) project.
const meta: Meta = {
  title: "Molecules/Data Display/Stat/Checks",
  tags: ["!dev"],
};

export default meta;

type Story = StoryObj;

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const px = (value: string) => Number.parseFloat(value);

/** The stat's content box: the room inside its border and padding, which is what the value has to fit in. */
function contentRight(stat: HTMLElement): number {
  const box = stat.getBoundingClientRect();
  const style = getComputedStyle(stat);
  return (
    box.right - px(style.borderInlineEndWidth) - px(style.paddingInlineEnd)
  );
}

/** The right edge of what the value draws, trend included: the value's own box and anything inside it, whichever reaches further. */
function drawnRight(value: HTMLElement): number {
  return Math.max(
    value.getBoundingClientRect().right,
    ...Array.from(value.querySelectorAll("*")).map(
      (child) => child.getBoundingClientRect().right,
    ),
  );
}

const fontSize = (element: HTMLElement) =>
  px(getComputedStyle(element).fontSize);

function Box({
  width,
  id,
  children,
}: {
  width: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={id} style={{ inlineSize: width }}>
      {children}
    </div>
  );
}

const widths = ["7rem", "9rem", "13rem", "18rem"];

export const FitsEveryWidth: Story = {
  name: "A fitValue stat keeps a long value inside its border at every width, and shrinks only when it has to — layout test",
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        justifyItems: "start",
      }}
    >
      {widths.map((width) => (
        <Box key={`on-${width}`} width={width} id={`on-${width}`}>
          <Stat variant="outlined" fitValue>
            <Stat.Label>Balance due</Stat.Label>
            <Stat.Value>$9,851.50</Stat.Value>
          </Stat>
        </Box>
      ))}
      <Box width="40rem" id="roomy">
        <Stat variant="outlined" fitValue>
          <Stat.Label>Balance due</Stat.Label>
          <Stat.Value>$9,851.50</Stat.Value>
        </Stat>
      </Box>
      <Box width="40rem" id="reference">
        <Stat variant="outlined">
          <Stat.Label>Balance due</Stat.Label>
          <Stat.Value>$9,851.50</Stat.Value>
        </Stat>
      </Box>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const valueOf = (id: string) =>
      within(canvas.getByTestId(id)).getByText("$9,851.50");
    const statOf = (id: string) =>
      canvas.getByTestId(id).firstElementChild as HTMLElement;
    const full = fontSize(valueOf("reference"));
    await step("a roomy stat keeps the full size", async () => {
      await expect(fontSize(valueOf("roomy"))).toBeCloseTo(full, 1);
    });
    let previous = full;
    for (const width of [...widths].reverse()) {
      await step(
        `at ${width} the value fits, and is no bigger than in a wider one`,
        async () => {
          await waitFor(() =>
            expect(drawnRight(valueOf(`on-${width}`))).toBeLessThanOrEqual(
              contentRight(statOf(`on-${width}`)) + 0.5,
            ),
          );
          const size = fontSize(valueOf(`on-${width}`));
          await expect(size).toBeLessThanOrEqual(previous + 0.01);
          previous = size;
        },
      );
    }
    await step("the narrowest one really did shrink", async () => {
      await expect(fontSize(valueOf("on-7rem"))).toBeLessThan(full * 0.8);
    });
  },
};

export const OffOverflows: Story = {
  name: "Without fitValue a long value keeps its size and overflows a narrow stat — layout test",
  render: () => (
    <Box width="9rem" id="off">
      <Stat variant="outlined">
        <Stat.Label>Balance due</Stat.Label>
        <Stat.Value>$9,851.50</Stat.Value>
      </Stat>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const value = within(canvasElement).getByText("$9,851.50");
    const stat = within(canvasElement).getByTestId("off")
      .firstElementChild as HTMLElement;
    await expect(drawnRight(value)).toBeGreaterThan(contentRight(stat));
    await expect(value.style.fontSize).toBe("");
  },
};

export const SizesAndTrend: Story = {
  name: "Every size, with a trend beside the value, fits — layout test",
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        justifyItems: "start",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as StatSize[]).map((size) => (
        <Box key={size} width="14rem" id={`size-${size}`}>
          <Stat variant="outlined" size={size} fitValue>
            <Stat.Label>Balance due</Stat.Label>
            <Stat.Value>
              $19,851.50
              <Stat.Trend value={4.2} />
            </Stat.Value>
          </Stat>
        </Box>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const stat = within(canvasElement).getByTestId(`size-${size}`)
        .firstElementChild as HTMLElement;
      const value = within(stat).getByText("$19,851.50", { exact: false });
      await waitFor(() =>
        expect(drawnRight(value.closest("p") ?? value)).toBeLessThanOrEqual(
          contentRight(stat) + 0.5,
        ),
      );
    }
  },
};

export const GrowsBackInteraction: Story = {
  name: "The value grows back when the stat gets wider, and shrinks again when it gets narrower — layout test",
  render: () => (
    <div data-testid="box" style={{ inlineSize: "9rem" }}>
      <Stat variant="outlined" fitValue>
        <Stat.Label>Balance due</Stat.Label>
        <Stat.Value>$9,851.50</Stat.Value>
      </Stat>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("box");
    const stat = box.firstElementChild as HTMLElement;
    const value = within(box).getByText("$9,851.50");
    const narrow = fontSize(value);
    await expect(drawnRight(value)).toBeLessThanOrEqual(
      contentRight(stat) + 0.5,
    );
    box.style.inlineSize = "40rem";
    await waitFor(() => expect(fontSize(value)).toBeGreaterThan(narrow + 4));
    await nextFrame();
    await expect(drawnRight(value)).toBeLessThanOrEqual(
      contentRight(stat) + 0.5,
    );
    box.style.inlineSize = "9rem";
    await waitFor(() => expect(fontSize(value)).toBeCloseTo(narrow, 0));
    await expect(drawnRight(value)).toBeLessThanOrEqual(
      contentRight(stat) + 0.5,
    );
  },
};
