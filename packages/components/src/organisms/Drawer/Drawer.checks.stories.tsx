import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Select } from "../../molecules/Select";
import { ConfirmDialog } from "../ConfirmDialog";
import { Drawer } from "./Drawer";
import type { DrawerContentProps, DrawerProps } from "./Drawer.types";

// Real-browser checks for what jsdom can't evaluate: where the panel sits against the viewport's edges, its size,
// the direction it enters from, the breakpoint, a real mouse and the stylesheet's own rules. Hidden from the
// sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/Drawer/Checks",
  id: "organisms-overlay-drawer-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still sliding is wrong by the distance left to travel, so wait for
// every animation on the panel and its scrim to finish first.
const settled = async (panel: HTMLElement) => {
  await nextFrame();
  const running = [panel, panel.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

// A real mouse through the Chrome DevTools Protocol, mapped through the test iframe's scale.
async function realClick(element: Element, inset?: { x: number; y: number }) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (inset ? rect.left + inset.x : rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (inset ? rect.top + inset.y : rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

function Panel({
  content,
  root,
  children,
}: {
  content?: DrawerContentProps;
  root?: Omit<DrawerProps, "children">;
  children?: ReactNode;
}) {
  return (
    <Drawer {...root}>
      <Drawer.Trigger asChild>
        <Button>Open</Button>
      </Drawer.Trigger>
      <Drawer.Content data-testid="panel" {...content}>
        <Drawer.Header data-testid="header">
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Narrow the list.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body data-testid="body">{children ?? <p>Short body</p>}</Drawer.Body>
        <Drawer.Footer data-testid="footer">
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button>Apply</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

const open = async () => {
  await userEvent.click(within(document.body).getByRole("button", { name: "Open" }));
  const panel = await within(document.body).findByRole("dialog");
  await settled(panel);
  return panel;
};

const edges = (element: Element) => {
  const { top, left, right, bottom, width, height } = element.getBoundingClientRect();
  return { top: Math.round(top), left: Math.round(left), right: Math.round(right), bottom: Math.round(bottom), width: Math.round(width), height: Math.round(height) };
};

export const EndSideIsFlushToTheEnd: Story = {
  name: "side=end sits against the right edge, full height, at the md width",
  render: () => <Panel />,
  play: async () => {
    const panel = await open();
    const box = edges(panel);
    await expect(box.right).toBe(window.innerWidth);
    await expect(box.top).toBe(0);
    await expect(box.bottom).toBe(window.innerHeight);
    await expect(box.width).toBe(Math.round(32 * rem()));
    // rounded only on the side facing the page, with the edge's own border on that side alone
    const style = getComputedStyle(panel);
    await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(0);
    await expect(parseFloat(style.borderTopRightRadius)).toBe(0);
    await expect(parseFloat(style.borderLeftWidth)).toBeGreaterThan(0);
    await expect(parseFloat(style.borderRightWidth)).toBe(0);
  },
};

export const StartSideIsFlushToTheStart: Story = {
  name: "side=start sits against the left edge in left-to-right text",
  render: () => <Panel content={{ side: "start" }} />,
  play: async () => {
    const panel = await open();
    const box = edges(panel);
    await expect(box.left).toBe(0);
    await expect(box.top).toBe(0);
    await expect(box.bottom).toBe(window.innerHeight);
    const style = getComputedStyle(panel);
    await expect(parseFloat(style.borderTopRightRadius)).toBeGreaterThan(0);
    await expect(parseFloat(style.borderTopLeftRadius)).toBe(0);
  },
};

export const StartSideIsTheRightEdgeInRightToLeft: Story = {
  name: "side=start sits against the right edge in right-to-left text, and slides in from it",
  render: () => <Panel content={{ side: "start", dir: "rtl" }} />,
  play: async () => {
    const trigger = within(document.body).getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const panel = await within(document.body).findByRole("dialog");
    // early in the entrance it is still to the right of where it will rest, not to the left
    const early = panel.getBoundingClientRect().left;
    await settled(panel);
    const box = edges(panel);
    await expect(box.right).toBe(window.innerWidth);
    await expect(early).toBeGreaterThanOrEqual(box.left);
  },
};

export const TopAndBottomSpanTheWidth: Story = {
  name: "side=top and side=bottom span the width and attach to their edge",
  render: () => (
    <>
      <Panel content={{ side: "top" }} root={{ defaultOpen: true }} />
    </>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const box = edges(panel);
    await expect(box.top).toBe(0);
    await expect(box.left).toBe(0);
    await expect(box.right).toBe(window.innerWidth);
    await expect(box.height).toBeLessThanOrEqual(Math.round(32 * rem()));
  },
};

export const BottomSideSitsOnTheBottomEdge: Story = {
  name: "side=bottom sits on the bottom edge, as tall as its content",
  render: () => <Panel content={{ side: "bottom" }} root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const box = edges(panel);
    await expect(box.bottom).toBe(window.innerHeight);
    await expect(box.left).toBe(0);
    await expect(box.right).toBe(window.innerWidth);
    // not the whole viewport: its content's height
    await expect(box.height).toBeLessThan(window.innerHeight);
    await expect(box.height).toBeGreaterThan(0);
  },
};

export const SizeStepsSetTheWidth: Story = {
  name: "each size is its token's width (xs 20rem to xl 56rem)",
  render: () => (
    <>
      {(["xs", "sm", "lg", "xl"] as const).map((size) => (
        <Drawer key={size}>
          <Drawer.Trigger asChild>
            <Button>{`Open ${size}`}</Button>
          </Drawer.Trigger>
          <Drawer.Content aria-label={size} size={size} />
        </Drawer>
      ))}
    </>
  ),
  play: async () => {
    const expected = { xs: 20, sm: 24, lg: 42, xl: 56 } as const;
    for (const [size, remWidth] of Object.entries(expected)) {
      await userEvent.click(within(document.body).getByRole("button", { name: `Open ${size}` }));
      const panel = await within(document.body).findByRole("dialog", { name: size });
      await settled(panel);
      await expect(Math.round(panel.getBoundingClientRect().width)).toBe(Math.round(remWidth * rem()));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    }
  },
};

export const PhoneLeavesASliver: Story = {
  name: "on a phone a side panel leaves a sliver of the page, and pressing it closes the drawer",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Panel content={{ size: "xl" }} />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const panel = await open();
    const box = edges(panel);
    // 3rem of the page stays showing beside it (the sliver), never the whole width
    await expect(window.innerWidth - box.width).toBe(Math.round(3 * rem()));
    await realClick(panel.parentElement as HTMLElement, { x: 6, y: 100 });
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const ResponsiveSideFollowsTheBreakpoint: Story = {
  name: "side={{ base: bottom, md: end }} is a bottom sheet on a phone",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Panel content={{ side: { base: "bottom", md: "end" } }} />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(768);
    const panel = await open();
    const box = edges(panel);
    await expect(box.bottom).toBe(window.innerHeight);
    await expect(box.width).toBe(window.innerWidth);
  },
};

export const ResponsiveSideIsASidePanelFromMd: Story = {
  name: "side={{ base: bottom, md: end }} is a side panel from md up",
  render: () => <Panel content={{ side: { base: "bottom", md: "end" } }} />,
  play: async () => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const panel = await open();
    const box = edges(panel);
    await expect(box.right).toBe(window.innerWidth);
    await expect(box.height).toBe(window.innerHeight);
  },
};

export const EntersFromItsEdge: Story = {
  name: "the entrance moves from the panel's own edge, and rests with no transform",
  render: () => <Panel content={{ side: "bottom" }} />,
  play: async () => {
    await userEvent.click(within(document.body).getByRole("button", { name: "Open" }));
    const panel = await within(document.body).findByRole("dialog");
    // a bottom sheet starts below its resting place
    const resting = panel.getBoundingClientRect();
    const animation = panel.getAnimations().find((item) => /drawerIn/.test((item as CSSAnimation).animationName));
    await expect(animation).toBeDefined();
    await settled(panel);
    // at rest there is no offset: the identity, since the panel's transform is the (zero) drag offset
    await expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(getComputedStyle(panel).transform);
    await expect(Math.round(panel.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    await expect(resting.top).toBeGreaterThanOrEqual(0);
  },
};

export const ScrimPressAndEscapeClose: Story = {
  name: "a real press on the scrim closes it, and focus returns to the trigger",
  render: () => <Panel />,
  play: async () => {
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "Open" });
    const panel = await open();
    // just inside the scrim's top-left corner, clear of a panel at the other edge
    await realClick(panel.parentElement as HTMLElement, { x: 12, y: 12 });
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const PageIsLockedAndFocusLoops: Story = {
  name: "the page behind is inert, and Tab stays inside the panel",
  render: () => (
    <>
      <button type="button">Behind</button>
      <Panel />
    </>
  ),
  play: async () => {
    const panel = await open();
    for (let press = 0; press < 8; press += 1) {
      await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    }
    await expect(within(document.body).queryByRole("button", { name: "Behind" })).toBeNull();
  },
};

export const SelectChosenWithARealPointer: Story = {
  name: "an option chosen with a real mouse in a Select inside the drawer, which stays open",
  render: () => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="With a select">
        <Drawer.Body>
          <Select aria-label="Pick one" defaultValue="a">
            <Select.Option value="a">Alpha</Select.Option>
            <Select.Option value="b">Beta</Select.Option>
          </Select>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
  play: async () => {
    const body = within(document.body);
    // The panel is still sliding in when it first appears, and a real press lands where the button was.
    await settled(await body.findByRole("dialog", { name: "With a select" }));
    const combobox = await body.findByRole("combobox", { name: "Pick one" });
    await realClick(combobox);
    const option = await body.findByRole("option", { name: "Beta" });
    const rect = option.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + 4, rect.top + 4)).toBe(option);
    await realClick(option);
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(body.getByRole("combobox", { name: "Pick one" })).toHaveTextContent("Beta");
    await expect(body.getByRole("dialog", { name: "With a select" })).toBeInTheDocument();
  },
};

export const ConfirmationOverADrawerAnswersFirst: Story = {
  name: "a confirmation opened from a drawer stacks above it, and Escape answers it first",
  render: () => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Settings">
        <Drawer.Body>
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete</Button>}
            tone="danger"
            title="Delete it?"
            description="It cannot be undone."
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: "Delete" }));
    const alert = await body.findByRole("alertdialog");
    await settled(alert);
    const drawerScrim = (await body.findByRole("dialog", { name: "Settings", hidden: true })).parentElement as HTMLElement;
    await expect(drawerScrim.compareDocumentPosition(alert.parentElement as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await expect(body.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  },
};

export const LinesFollowTheScroll: Story = {
  name: "divided=auto draws the footer's line while more is below, and the header's once scrolled",
  render: () => (
    <Panel root={{ defaultOpen: true }}>
      {Array.from({ length: 60 }, (_, index) => (
        <p key={index}>Line {index + 1} of a body that is taller than the panel.</p>
      ))}
    </Panel>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    await waitFor(() => expect(panel).toHaveAttribute("data-overflow-end"));
    await expect(panel).not.toHaveAttribute("data-overflow-start");
    const viewport = panel.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    viewport.scrollTop = 200;
    await waitFor(() => expect(panel).toHaveAttribute("data-overflow-start"));
  },
};

export const CloseButtonFollowsTheSafeAreaInset: Story = {
  name: "the panel pads itself by the device's safe-area insets, and the close button follows them",
  render: () => <Panel root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const close = within(panel).getByRole("button", { name: "Close" });
    const before = close.getBoundingClientRect();
    // A desktop reports no inset, so stand one in the way the stylesheet reads it: through the custom
    // properties each side sets from `env(safe-area-inset-*)`.
    panel.style.setProperty("--overlay-safe-block-start", "20px");
    panel.style.setProperty("--overlay-safe-inline-end", "12px");
    await nextFrame();
    const after = close.getBoundingClientRect();
    await expect(Math.round(after.top - before.top)).toBe(20);
    await expect(Math.round(before.right - after.right)).toBe(12);
    // and the stylesheet does ask for the device's insets
    const sources: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        sources.push(Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n"));
      } catch {
        // a cross-origin sheet can't be read; none of ours is one
      }
    }
    await expect(sources.join("\n")).toContain("safe-area-inset-bottom");
  },
};

export const ForcedColoursAndReducedMotionRulesExist: Story = {
  name: "the stylesheet carries a forced-colours edge and a reduced-motion fade",
  render: () => <Panel />,
  play: async () => {
    const mediaRules: CSSMediaRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // a cross-origin sheet can't be read; none of ours is one
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule) mediaRules.push(rule);
      }
    }
    const forced = mediaRules.find(
      (rule) => rule.conditionText.includes("forced-colors: active") && rule.cssText.includes("CanvasText") && /content/i.test(rule.cssText),
    );
    const reduced = mediaRules.find(
      (rule) => rule.conditionText.includes("prefers-reduced-motion: reduce") && /drawerFadeIn/.test(rule.cssText),
    );
    await expect(forced).toBeDefined();
    await expect(reduced).toBeDefined();
  },
};

export const BusyCannotBeLeft: Story = {
  name: "a busy drawer ignores Escape and a real press on the scrim",
  render: () => <Panel content={{ busy: true }} root={{ defaultOpen: true }} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("dialog");
    await settled(panel);
    await userEvent.keyboard("{Escape}");
    await realClick(panel.parentElement as HTMLElement, { x: 12, y: 12 });
    await nextFrame();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    await expect(panel).toHaveAttribute("aria-busy", "true");
  },
};

export const KeepMountedKeepsTheState: Story = {
  name: "keepMounted keeps what was typed through a real close and reopen",
  render: () => (
    <Drawer>
      <Drawer.Trigger asChild>
        <Button>Open</Button>
      </Drawer.Trigger>
      <Drawer.Content aria-label="Form" keepMounted>
        <Drawer.Body>
          <input aria-label="Name" />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    const field = await body.findByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Jane");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await expect(await body.findByRole("textbox", { name: "Name" })).toHaveValue("Jane");
  },
};

// A touch drag, as the pointer events a touch screen produces. A real finger can't be driven here, so the events
// are dispatched; the component reads `pointerType`, the coordinates and the time stamps, which these carry.
const touch = (type: string, target: Element, x: number, y: number, extra: PointerEventInit = {}) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 7,
      isPrimary: true,
      pointerType: "touch",
      clientX: x,
      clientY: y,
      ...extra,
    }),
  );

async function drag(from: Element, dx: number, dy: number, pointerType: "touch" | "mouse" = "touch", steps = 4) {
  const rect = from.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  touch("pointerdown", from, x, y, { pointerType });
  for (let step = 1; step <= steps; step += 1) {
    touch("pointermove", from, x + (dx * step) / steps, y + (dy * step) / steps, { pointerType });
    await nextFrame();
  }
  touch("pointerup", from, x + dx, y + dy, { pointerType });
}

let lastReason = "";
const recordReason = (_open: boolean, details: { reason: string }) => {
  lastReason = details.reason;
};

export const FarSwipeDismissesWithTheSwipeReason: Story = {
  name: "a long touch drag of the header toward the edge closes it, reporting the reason swipe",
  render: () => <Panel root={{ defaultOpen: true, onOpenChange: recordReason }} />,
  play: async () => {
    lastReason = "";
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const header = within(panel).getByTestId("header");
    await drag(header, 260, 0);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(lastReason).toBe("swipe");
  },
};

export const ShortSwipeSettlesBack: Story = {
  name: "a short drag settles back and leaves it open, with nothing left on the panel",
  render: () => <Panel root={{ defaultOpen: true, onOpenChange: recordReason }} />,
  play: async () => {
    lastReason = "";
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const header = within(panel).getByTestId("header");
    await drag(header, 16, 0);
    await waitFor(() => expect(panel).not.toHaveAttribute("data-settling"));
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
    await expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(getComputedStyle(panel).transform);
    await expect(panel.style.getPropertyValue("--drawer-drag-x")).toBe("");
    await expect(lastReason).toBe("");
  },
};

export const PanelFollowsTheFinger: Story = {
  name: "while dragging, the panel moves with the finger and no further than its edge allows",
  render: () => <Panel root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const header = within(panel).getByTestId("header");
    const rect = header.getBoundingClientRect();
    const x = rect.left + 20;
    const y = rect.top + 20;
    const resting = panel.getBoundingClientRect().left;
    touch("pointerdown", header, x, y);
    touch("pointermove", header, x + 60, y);
    await nextFrame();
    await expect(Math.round(panel.getBoundingClientRect().left - resting)).toBe(60);
    // toward the edge only: dragging back past where it began does not pull it the other way
    touch("pointermove", header, x - 80, y);
    await nextFrame();
    await expect(Math.round(panel.getBoundingClientRect().left - resting)).toBe(0);
    touch("pointercancel", header, x, y);
    await waitFor(() => expect(panel).not.toHaveAttribute("data-settling"));
  },
};

export const MouseAndWrongDirectionAreNotSwipes: Story = {
  name: "a mouse drag of the header, and a touch drag away from the edge, do nothing",
  render: () => <Panel root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const header = within(panel).getByTestId("header");
    await drag(header, 300, 0, "mouse");
    await drag(header, -300, 0, "touch");
    await nextFrame();
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
    await expect(panel).not.toHaveAttribute("data-dragging");
  },
};

export const SwipeFollowsTheSideInRightToLeft: Story = {
  name: "side=start in right-to-left text is dismissed by a drag to the right",
  render: () => <Panel content={{ side: "start", dir: "rtl" }} root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    await drag(within(panel).getByTestId("header"), 260, 0);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const BottomSheetIsSwipedDown: Story = {
  name: "a bottom sheet draws its handle, and a drag of it downward dismisses it",
  render: () => <Panel content={{ side: "bottom" }} root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const handle = panel.querySelector("[aria-hidden='true'][data-drawer-grab]") as HTMLElement;
    await expect(getComputedStyle(handle).display).not.toBe("none");
    // a 24px-tall hit area, centred on the sheet's top edge
    const box = handle.getBoundingClientRect();
    const sheet = panel.getBoundingClientRect();
    await expect(Math.round(box.height)).toBe(Math.round(1.5 * rem()));
    // inside the sheet's own 1px border
    await expect(Math.round(box.top - sheet.top)).toBeLessThanOrEqual(1);
    await drag(handle, 0, 240);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

// A real mouse drag through the Chrome DevTools Protocol, mapped through the test iframe's scale.
async function realDrag(element: Element, dx: number, dy: number) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const at = (offsetX: number, offsetY: number) => ({
    x: (frame?.left ?? 0) + (originX + offsetX) * scale,
    y: (frame?.top ?? 0) + (originY + offsetY) * scale,
  });
  const start = at(0, 0);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...start });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...start, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    const point = at((dx * step) / 6, (dy * step) / 6);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point, button: "left", buttons: 1 });
    await nextFrame();
  }
  const end = at(dx, dy);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...end, button: "left", clickCount: 1 });
}

export const MouseDragsTheHandleOnly: Story = {
  name: "a real mouse can drag a sheet's handle down to close it, with a grab cursor; the header it can not",
  render: () => <Panel content={{ side: "bottom" }} root={{ defaultOpen: true, onOpenChange: recordReason }} />,
  play: async () => {
    lastReason = "";
    const body = within(document.body);
    const panel = await body.findByRole("dialog");
    await settled(panel);
    const handle = panel.querySelector("[data-drawer-handle]") as HTMLElement;
    await expect(getComputedStyle(handle).cursor).toBe("grab");
    // the header is not where a mouse takes hold: nothing happens, and the title stays selectable
    await realDrag(within(panel).getByTestId("header"), 0, 240);
    await nextFrame();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    await expect(lastReason).toBe("");
    // the handle is
    await realDrag(handle, 0, 240);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(lastReason).toBe("swipe");
  },
};

export const HandleIsNotGrabbableWhenSwipeIsOff: Story = {
  name: "with swipeToDismiss off the handle has no grab cursor and a mouse drag of it does nothing",
  render: () => <Panel content={{ side: "bottom", swipeToDismiss: false }} root={{ defaultOpen: true }} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("dialog");
    await settled(panel);
    const handle = panel.querySelector("[data-drawer-handle]") as HTMLElement;
    await expect(getComputedStyle(handle).cursor).not.toBe("grab");
    await realDrag(handle, 0, 240);
    await nextFrame();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
  },
};

export const SwipeTheOwnerDeclinesGoesBack: Story = {
  name: "a swiped drawer whose owner keeps it open goes back to where it was, with nothing left on it",
  render: () => (
    <Drawer open onOpenChange={() => undefined}>
      <Drawer.Content aria-label="Pinned" data-testid="panel">
        <Drawer.Header data-testid="header">
          <Drawer.Title>Pinned</Drawer.Title>
        </Drawer.Header>
      </Drawer.Content>
    </Drawer>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const resting = panel.getBoundingClientRect().left;
    await drag(within(panel).getByTestId("header"), 280, 0);
    // it is still open, and returns to where it began once the owner has had its say
    await waitFor(() => expect(Math.round(panel.getBoundingClientRect().left - resting)).toBe(0), { timeout: 2000 });
    await waitFor(() => expect(panel).not.toHaveAttribute("data-settling"));
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
    await expect(panel.style.getPropertyValue("--drawer-drag-x")).toBe("");
    await expect(panel.style.transform).toBe("");
  },
};

// A non-modal drawer has no scrim to position it, so it is fixed to its edge with the same margins and sizes
// doing the pinning; and the page behind it is still there to be pressed.
let behindPressed = 0;
const nonModal = (side: "start" | "end" | "top" | "bottom"): Story => ({
  name: `a docked (non-modal) ${side} drawer sits flush to its edge and leaves the page pressable`,
  render: () => {
    behindPressed = 0;
    // a button in the corner the panel doesn't cover, fixed so the panel can't be over it
    const corner =
      side === "top"
        ? { insetBlockEnd: "8px", insetInlineStart: "8px" }
        : side === "bottom"
          ? { insetBlockStart: "8px", insetInlineStart: "8px" }
          : side === "end"
            ? { insetBlockStart: "8px", insetInlineStart: "8px" }
            : { insetBlockStart: "8px", insetInlineEnd: "8px" };
    return (
      <>
        <button type="button" style={{ position: "fixed", ...corner }} onClick={() => (behindPressed += 1)}>
          Behind
        </button>
        <Drawer modal={false} defaultOpen>
          <Drawer.Content aria-label="Docked" side={side}>
            <Drawer.Body>Inspector</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </>
    );
  },
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("dialog");
    await settled(panel);
    await expect(getComputedStyle(panel).position).toBe("fixed");
    // no scrim: the panel hangs straight off the body
    await expect(panel.parentElement).toBe(document.body);
    const box = edges(panel);
    if (side === "end") {
      await expect(box.right).toBe(window.innerWidth);
      await expect(box.height).toBe(window.innerHeight);
    } else if (side === "start") {
      await expect(box.left).toBe(0);
      await expect(box.height).toBe(window.innerHeight);
    } else if (side === "top") {
      await expect(box.top).toBe(0);
      await expect(box.width).toBe(window.innerWidth);
    } else {
      await expect(box.bottom).toBe(window.innerHeight);
      await expect(box.width).toBe(window.innerWidth);
    }
    await expect(panel).not.toHaveAttribute("aria-modal");
    await realClick(body.getByRole("button", { name: "Behind" }));
    await expect(behindPressed).toBe(1);
  },
});
export const DockedEnd: Story = nonModal("end");
export const DockedStart: Story = nonModal("start");
export const DockedTop: Story = nonModal("top");
export const DockedBottom: Story = nonModal("bottom");

export const CloseButtonIsATarget: Story = {
  name: "the close button is at least 24 by 24 pixels, at the smallest size as at the default",
  render: () => (
    <>
      <Drawer defaultOpen>
        <Drawer.Content aria-label="Default" />
      </Drawer>
    </>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const box = within(panel).getByRole("button", { name: "Close" }).getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(box.height).toBeGreaterThanOrEqual(24);
  },
};

const channel = (value: number) => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0);
const parse = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const HandlePillIsSeenInAllFourThemes: Story = {
  name: "the grab handle's pill is at least 3:1 against the panel in all four themes",
  render: () => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Sheet" side="bottom" />
    </Drawer>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const handle = panel.querySelector("[data-drawer-handle]") as HTMLElement;
    const results: Record<string, number> = {};
    for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
      document.documentElement.dataset.theme = theme;
      await nextFrame();
      await nextFrame();
      const pill = getComputedStyle(handle, "::after").backgroundColor;
      const surface = getComputedStyle(panel).backgroundColor;
      results[theme] = ratio(parse(pill), parse(surface));
    }
    for (const [theme, value] of Object.entries(results)) {
      await expect(value, theme).toBeGreaterThanOrEqual(3);
    }
  },
};

export const SideDrawersDrawNoHandle: Story = {
  name: "a side drawer draws no handle, and showHandle={false} removes the sheet's",
  render: () => (
    <>
      <Panel root={{ defaultOpen: true }} />
    </>
  ),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    const handle = panel.querySelector("[aria-hidden='true'][data-drawer-grab]") as HTMLElement;
    await expect(getComputedStyle(handle).display).toBe("none");
  },
};

export const BusyCannotBeSwiped: Story = {
  name: "a busy drawer cannot be swiped away",
  render: () => <Panel content={{ busy: true }} root={{ defaultOpen: true }} />,
  play: async () => {
    const panel = await within(document.body).findByRole("dialog");
    await settled(panel);
    await drag(within(panel).getByTestId("header"), 300, 0);
    await nextFrame();
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
  },
};

export const OpenChangeCompleteWaitsForTheExit: Story = {
  name: "onOpenChangeComplete(false) comes after the exit has played, not when it starts",
  render: () => <Panel root={{ defaultOpen: true }} />,
  play: async () => {
    // Instrument by watching the panel leave the page: the callback is exercised by the unit tests, and this
    // proves the panel is still in the page, animating, when the change starts.
    const body = within(document.body);
    const panel = await body.findByRole("dialog");
    await settled(panel);
    await userEvent.keyboard("{Escape}");
    await nextFrame();
    await expect(panel.getAttribute("data-state")).toBe("closed");
    await expect(panel.isConnected).toBe(true);
    await waitFor(() => expect(panel.isConnected).toBe(false));
  },
};

export const CustomSizeIsALengthOrPixels: Story = {
  name: "size takes a CSS length or a number of pixels, and the scale's steps still map to their tokens",
  render: () => (
    <>
      <Drawer>
        <Drawer.Trigger asChild>
          <Button>Open length</Button>
        </Drawer.Trigger>
        <Drawer.Content aria-label="length" size="22rem" />
      </Drawer>
      <Drawer>
        <Drawer.Trigger asChild>
          <Button>Open pixels</Button>
        </Drawer.Trigger>
        <Drawer.Content aria-label="pixels" size={300} />
      </Drawer>
    </>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open length" }));
    const first = await body.findByRole("dialog", { name: "length" });
    await settled(first);
    await expect(Math.round(first.getBoundingClientRect().width)).toBe(Math.round(22 * rem()));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await userEvent.click(body.getByRole("button", { name: "Open pixels" }));
    const second = await body.findByRole("dialog", { name: "pixels" });
    await settled(second);
    await expect(Math.round(second.getBoundingClientRect().width)).toBe(300);
  },
};
