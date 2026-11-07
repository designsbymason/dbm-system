import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "../Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { HoverCard } from "../../molecules/HoverCard";
import { Popover } from "../../molecules/Popover";
import { Select } from "../../molecules/Select";
import { Tooltip } from "../Tooltip";
import { AlertDialog } from "../../organisms/AlertDialog";
import { ContextMenu } from "../../organisms/ContextMenu";
import { ColorPicker } from "../../organisms/ColorPicker";
import { DatePicker } from "../../organisms/DatePicker";
import { Dialog } from "../../organisms/Dialog";
import { Drawer } from "../../organisms/Drawer";
import { Menu } from "../../organisms/Menu";
import { DirectionProvider } from "./DirectionProvider";

// Hidden real-browser checks (guidelines/adr/0013): content that opens in a portal sits outside the provider's DOM, so the direction has to reach
// it through the component, not the cascade. Every story here sets the direction ONLY with a DirectionProvider (never a `dir` on a component or
// on the page) and measures the computed `direction` of what opened.
const meta: Meta = {
  title: "Atoms/Utility/DirectionProvider/Checks",
  tags: ["!dev"],
  // Modal overlays held open hide the page behind them, which axe's `aria-hidden-focus` reports; the same markup is axe-checked in each component's own tests.
  parameters: { layout: "fullscreen", a11y: { test: "todo" } },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const direction = (element: Element) => getComputedStyle(element).direction;

function pagePoint(x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
}
const centreOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};
async function click(x: number, y: number, button: "left" | "right") {
  const point = pagePoint(x, y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button, clickCount: 1 });
}

const Rtl = ({ children }: { children: ReactNode }) => <DirectionProvider dir="rtl">{children}</DirectionProvider>;

export const MenuOpensRightToLeft: Story = {
  name: "A Menu given no dir opens right to left under a provider, and left to right without one",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)", padding: "var(--dbm-space-8)" }}>
      <Rtl>
        <Menu defaultOpen modal={false}>
          <Menu.Trigger asChild>
            <Button>Actions</Button>
          </Menu.Trigger>
          <Menu.Content data-testid="panel">
            <Menu.Item>Rename</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
          </Menu.Content>
        </Menu>
      </Rtl>
    </div>
  ),
  play: async () => {
    const menu = await body.findByRole("menu");
    await expect(direction(menu)).toBe("rtl");
    await expect(menu.closest("[dir]")).toHaveAttribute("dir", "rtl");
  },
};

export const MenuOpensLeftToRightWithoutAProvider: Story = {
  name: "Without a provider the same Menu stays left to right",
  render: () => (
    <div style={{ padding: "var(--dbm-space-8)" }}>
      <Menu defaultOpen modal={false}>
        <Menu.Trigger asChild>
          <Button>Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Rename</Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  ),
  play: async () => {
    const menu = await body.findByRole("menu");
    await expect(direction(menu)).toBe("ltr");
  },
};

export const SelectOpensRightToLeft: Story = {
  name: "A Select given no dir opens its list right to left under a provider",
  render: () => (
    <div style={{ padding: "var(--dbm-space-8)", minBlockSize: "24rem" }}>
      <Rtl>
        <Select aria-label="Variant" defaultOpen defaultValue="a">
          <Select.Option value="a">Alpha</Select.Option>
          <Select.Option value="b">Beta</Select.Option>
        </Select>
      </Rtl>
    </div>
  ),
  play: async () => {
    const list = await body.findByRole("listbox");
    await expect(direction(list)).toBe("rtl");
  },
};

export const ContextMenuOpensRightToLeft: Story = {
  name: "A ContextMenu given no dir opens right to left under a provider",
  render: () => (
    <div style={{ blockSize: "100vh" }}>
      <Rtl>
        <ContextMenu>
          <ContextMenu.Trigger tabIndex={0} aria-label="Area" style={{ blockSize: "100vh", display: "block", inlineSize: "100%" }}>
            Area
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Rename</ContextMenu.Item>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </Rtl>
    </div>
  ),
  play: async () => {
    await click(300, 200, "right");
    const menu = await body.findByRole("menu");
    await expect(direction(menu)).toBe("rtl");
  },
};

export const DialogBodyScrollsRightToLeft: Story = {
  name: "A Dialog body given no dir is right to left under a provider",
  render: () => (
    <Rtl>
      <Dialog defaultOpen>
        <Dialog.Content aria-describedby={undefined}>
          <Dialog.Header>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body data-testid="dialog-body">Body text</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    </Rtl>
  ),
  play: async () => {
    const text = await body.findByText("Body text");
    await expect(direction(text)).toBe("rtl");
    await expect(text.closest("[dir]")).toHaveAttribute("dir", "rtl");
  },
};

export const DrawerBodyScrollsRightToLeft: Story = {
  name: "A Drawer body given no dir is right to left under a provider",
  render: () => (
    <Rtl>
      <Drawer defaultOpen>
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Header>
            <Drawer.Title>Title</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>Body text</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Rtl>
  ),
  play: async () => {
    const text = await body.findByText("Body text");
    await expect(direction(text)).toBe("rtl");
    await expect(text.closest("[dir]")).toHaveAttribute("dir", "rtl");
  },
};

export const DatePickerCalendarIsMirrored: Story = {
  name: "A DatePicker given no dir opens a mirrored calendar under a provider",
  render: () => (
    <div style={{ padding: "var(--dbm-space-8)", minBlockSize: "30rem" }}>
      <Rtl>
        <DatePicker aria-label="Start" defaultValue="2026-10-14" />
      </Rtl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Start" });
    await expect(direction(group)).toBe("rtl");
    // The segments stay left to right whatever the direction (a date's numbers read in the order its format gives).
    const segment = group.querySelector<HTMLElement>('[role="spinbutton"]')!;
    await expect(segment).toBeTruthy();
    const opener = canvas.getAllByRole("button").find((button) => /calendar|choose|date/i.test(button.getAttribute("aria-label") ?? ""))!;
    await click(centreOf(opener).x, centreOf(opener).y, "left");
    const panel = await body.findByRole("dialog");
    await expect(direction(panel)).toBe("rtl");
    // The first day of the week is at the right: the first column header is to the right of the last.
    const heads = within(panel).getAllByRole("columnheader");
    await waitFor(() => expect(heads[0]!.getBoundingClientRect().left).toBeGreaterThan(heads[heads.length - 1]!.getBoundingClientRect().left));
    await nextFrame();
  },
};

export const ColorPickerPanelIsRightToLeft: Story = {
  name: "A ColorPicker given no dir opens a right-to-left panel under a provider",
  render: () => (
    <div style={{ padding: "var(--dbm-space-8)", minBlockSize: "34rem" }}>
      <Rtl>
        <ColorPicker aria-label="Brand color" defaultValue="#5548a4" />
      </Rtl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(direction(canvas.getByRole("group", { name: "Brand color" }))).toBe("rtl");
    const opener = canvas.getByRole("button", { name: "Choose color" });
    await click(centreOf(opener).x, centreOf(opener).y, "left");
    const hue = await body.findByRole("slider", { name: "Hue" });
    // The hue slider is inside the portalled panel; it reads right to left.
    await expect(direction(hue)).toBe("rtl");
    await expect(hue.closest("[dir]")).toHaveAttribute("dir", "rtl");
  },
};

export const DialogPanelIsRightToLeft: Story = {
  name: "A Dialog given no dir reads right to left in its header and footer under a provider, not only in its body",
  render: () => (
    <Rtl>
      <Dialog defaultOpen>
        <Dialog.Content aria-describedby={undefined}>
          <Dialog.Header>
            <Dialog.Title>Head</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>Body</Dialog.Body>
          <Dialog.Footer>
            <span>Foot</span>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </Rtl>
  ),
  play: async () => {
    await expect(direction(await body.findByText("Head"))).toBe("rtl");
    await expect(direction(await body.findByText("Body"))).toBe("rtl");
    await expect(direction(await body.findByText("Foot"))).toBe("rtl");
  },
};

export const DrawerPanelIsRightToLeft: Story = {
  name: "A Drawer given no dir reads right to left in its header and footer under a provider",
  render: () => (
    <Rtl>
      <Drawer defaultOpen>
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Header>
            <Drawer.Title>Head</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>Body</Drawer.Body>
          <Drawer.Footer>
            <span>Foot</span>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Rtl>
  ),
  play: async () => {
    await expect(direction(await body.findByText("Head"))).toBe("rtl");
    await expect(direction(await body.findByText("Foot"))).toBe("rtl");
  },
};

export const AlertDialogPanelIsRightToLeft: Story = {
  name: "An AlertDialog given no dir reads right to left under a provider",
  render: () => (
    <Rtl>
      <AlertDialog defaultOpen>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete?</AlertDialog.Title>
            <AlertDialog.Description>Gone for good.</AlertDialog.Description>
          </AlertDialog.Header>
        </AlertDialog.Content>
      </AlertDialog>
    </Rtl>
  ),
  play: async () => {
    await expect(direction(await body.findByText("Delete?"))).toBe("rtl");
    await expect(direction(await body.findByRole("alertdialog"))).toBe("rtl");
  },
};

export const PopoverIsRightToLeftAndAlignsToTheRightEdge: Story = {
  name: "A Popover given no dir reads right to left under a provider, and align start lines up with the trigger's right edge",
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-8)" }}>
      <Rtl>
        <Popover defaultOpen>
          <Popover.Trigger asChild>
            <Button>Details</Button>
          </Popover.Trigger>
          <Popover.Content align="start" aria-label="Details" style={{ inlineSize: "20rem" }}>
            <span data-testid="popover-text">Popover text</span>
          </Popover.Content>
        </Popover>
      </Rtl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const text = await body.findByTestId("popover-text");
    await expect(direction(text)).toBe("rtl");
    const panel = await body.findByRole("dialog");
    const trigger = within(canvasElement).getByRole("button", { name: "Details" });
    // Start is the right edge in right-to-left text: the panel's right edge sits on the trigger's right edge (it extends to the left).
    await waitFor(() => expect(Math.abs(panel.getBoundingClientRect().right - trigger.getBoundingClientRect().right)).toBeLessThan(2));
  },
};

export const HoverCardAndTooltipAreRightToLeft: Story = {
  name: "A HoverCard and a Tooltip given no dir read right to left under a provider",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-12)", padding: "var(--dbm-space-12)" }}>
      <Rtl>
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content>
            <span data-testid="card-text">Card content</span>
          </HoverCard.Content>
        </HoverCard>
        <Tooltip content={<span data-testid="tip-text">Save your changes</span>} defaultOpen>
          <Button>Save</Button>
        </Tooltip>
      </Rtl>
    </div>
  ),
  play: async () => {
    await expect(direction(await body.findByTestId("card-text"))).toBe("rtl");
    await expect(direction(await body.findByTestId("tip-text"))).toBe("rtl");
  },
};
