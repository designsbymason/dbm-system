import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Button } from "../../atoms/Button";
import { PageHeader } from "./PageHeader";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do — where the text and the actions sit, when they wrap, a long title, right to left
// and forced colours.
const meta: Meta = {
  title: "Molecules/Layout/PageHeader/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const px = (value: string) => Number.parseFloat(value);

/** A header in a box of a set width, the way a narrow column or a phone gives it. */
function Box({ width, dir, children }: { width: string; dir?: "rtl"; children: ReactNode }) {
  return (
    <div dir={dir} data-testid="box" style={{ inlineSize: width, maxInlineSize: "100%" }}>
      {children}
    </div>
  );
}

const header = (props: Partial<React.ComponentProps<typeof PageHeader>> = {}, title = "Projects") => (
  <PageHeader data-testid="header" {...props}>
    <PageHeader.Title>{title}</PageHeader.Title>
    <PageHeader.Description>Everything your team is working on, in one place.</PageHeader.Description>
    <PageHeader.Actions data-testid="actions">
      <Button>New project</Button>
    </PageHeader.Actions>
  </PageHeader>
);

const parts = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const root = canvas.getByTestId("header");
  return { canvas, root, text: root.firstElementChild as HTMLElement, actions: canvas.getByTestId("actions") };
};

export const ActionsBesideTheTextWhenThereIsRoom: Story = {
  name: "In a wide box the actions sit beside the text, level with its top, at the end edge — layout test",
  render: () => <Box width="60rem">{header()}</Box>,
  play: async ({ canvasElement }) => {
    const { root, text, actions } = parts(canvasElement);
    const [rootBox, textBox, actionsBox] = [root, text, actions].map((element) => element.getBoundingClientRect()) as [DOMRect, DOMRect, DOMRect];
    await expect(actionsBox.left).toBeGreaterThanOrEqual(textBox.right - 1);
    await expect(Math.abs(actionsBox.top - textBox.top)).toBeLessThan(2);
    await expect(Math.abs(actionsBox.right - rootBox.right)).toBeLessThan(2);
  },
};

export const ActionsUnderTheTextWhenThereIsNoRoom: Story = {
  name: "In a narrow box the actions wrap under the text, at the start edge and no wider than they need — layout test",
  render: () => <Box width="20rem">{header()}</Box>,
  play: async ({ canvasElement }) => {
    const { root, text, actions } = parts(canvasElement);
    const rootBox = root.getBoundingClientRect();
    await expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(text.getBoundingClientRect().bottom - 1);
    await expect(Math.abs(actions.getBoundingClientRect().left - rootBox.left)).toBeLessThan(2);
    await expect(actions.getBoundingClientRect().width).toBeLessThan(rootBox.width);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

export const ALongTitleStaysInTheBox: Story = {
  name: "A title that cannot break does not widen the header — layout test",
  render: () => <Box width="20rem">{header({}, "Supercalifragilisticexpialidocious-and-then-some-more-unbroken-title-text")}</Box>,
  play: async ({ canvasElement }) => {
    const { root, canvas } = parts(canvasElement);
    const box = canvas.getByTestId("box");
    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(box.getBoundingClientRect().width + 1);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
  },
};

export const RightToLeftOrder: Story = {
  name: "In right-to-left text the text is at the right and the actions at the left — direction test",
  render: () => <Box width="60rem" dir="rtl">{header()}</Box>,
  play: async ({ canvasElement }) => {
    const { root, text, actions } = parts(canvasElement);
    const rootBox = root.getBoundingClientRect();
    await expect(text.getBoundingClientRect().right).toBeGreaterThan(actions.getBoundingClientRect().right);
    await expect(Math.abs(actions.getBoundingClientRect().left - rootBox.left)).toBeLessThan(2);
  },
};

export const BorderedLine: Story = {
  name: "A bordered header draws a one-pixel line in the border colour with room above it, and none otherwise — layout test",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      <PageHeader bordered data-testid="header">
        <PageHeader.Title>Bordered</PageHeader.Title>
      </PageHeader>
      <PageHeader data-testid="plain">
        <PageHeader.Title>Plain</PageHeader.Title>
      </PageHeader>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bordered = getComputedStyle(canvas.getByTestId("header"));
    await expect(bordered.borderBlockEndStyle).toBe("solid");
    await expect(px(bordered.borderBlockEndWidth)).toBe(1);
    await expect(px(bordered.paddingBlockEnd)).toBeGreaterThan(8);
    await expect(getComputedStyle(canvas.getByTestId("plain")).borderBlockEndStyle).toBe("none");
  },
};

export const BorderInForcedColours: Story = {
  name: "In forced colours the line is still drawn — forced colours test",
  render: () => (
    <PageHeader bordered data-testid="header">
      <PageHeader.Title>Bordered</PageHeader.Title>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("header");
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(getComputedStyle(root).borderBlockEndStyle).toBe("solid");
      await expect(px(getComputedStyle(root).borderBlockEndWidth)).toBe(1);
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

export const TheTrailAndTheFactsGetRoomOfTheirOwn: Story = {
  name: "The trail and the facts sit twice as far from the title and the description as those two sit from each other, and a large header opens its lines up — layout test",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {(["md", "lg"] as const).map((size) => (
        <PageHeader key={size} size={size} data-testid={`header-${size}`}>
          <PageHeader.Breadcrumbs data-testid={`crumbs-${size}`}>Home</PageHeader.Breadcrumbs>
          <PageHeader.Title>Projects</PageHeader.Title>
          <PageHeader.Description>Words</PageHeader.Description>
          <PageHeader.Meta data-testid={`meta-${size}`}>Draft</PageHeader.Meta>
        </PageHeader>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `space.1` and `space.2` in pixels, read the way the page draws them (the tokens are lengths in rem)
    const measure = (token: string) => {
      const probe = document.createElement("div");
      probe.style.inlineSize = `var(--dbm-${token})`;
      document.body.append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    const step = measure("space-1");
    const room = measure("space-2");
    for (const size of ["md", "lg"] as const) {
      const text = canvas.getByTestId(`header-${size}`).firstElementChild as HTMLElement;
      const gap = px(getComputedStyle(text).rowGap);
      const crumbs = getComputedStyle(canvas.getByTestId(`crumbs-${size}`));
      const meta = getComputedStyle(canvas.getByTestId(`meta-${size}`));
      // the trail and the facts each add `space.2` on top of the column's gap
      await expect(px(crumbs.marginBlockEnd)).toBeCloseTo(room, 0);
      await expect(px(meta.marginBlockStart)).toBeCloseTo(room, 0);
      await expect(gap).toBeCloseTo(size === "lg" ? step * 2 : step, 0);
    }
  },
};
