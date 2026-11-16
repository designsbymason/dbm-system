import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Popover } from "../../molecules/Popover";
import { Select } from "../../molecules/Select";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "./Dialog";
import { LongText } from "./DialogStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the scroll lock, a press on a portaled child, the
// breakpoint, computed style from the cascade and the stylesheet's own rules. Hidden from the sidebar and the
// Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/Dialog/Checks",
  id: "organisms-overlay-dialog-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (the panel scales
// from 0.98), so wait for every animation on the panel and its scrim to finish first.
const settled = async (dialog: HTMLElement) => {
  await nextFrame();
  const running = [dialog, dialog.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const openFrom = async (name: string) => {
  const trigger = within(document.body).getByRole("button", { name });
  await userEvent.click(trigger);
  return within(document.body).findByRole("dialog");
};

function Form({ children, dir }: { children?: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
      <Dialog>
        <Dialog.Trigger asChild>
          <Button>Open</Button>
        </Dialog.Trigger>
        <Dialog.Content dir={dir} data-testid="panel">
          <Dialog.Header data-testid="header">
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>Changes are saved to your account.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body data-testid="body">{children ?? <p>Short body</p>}</Dialog.Body>
          <Dialog.Footer data-testid="footer">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button>Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export const ScrimAndLayout: Story = {
  name: "Scrim fills the viewport and the panel is centred at md",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const scrim = dialog.parentElement as HTMLElement;
    const scrimRect = scrim.getBoundingClientRect();
    await expect(Math.round(scrimRect.width)).toBe(window.innerWidth);
    await expect(Math.round(scrimRect.height)).toBe(window.innerHeight);
    const rect = dialog.getBoundingClientRect();
    // size md is 32rem (the dialog.max-width.md token)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(Math.round(rect.width)).toBe(Math.round(32 * rem));
    await expect(Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2)).toBeLessThan(1);
    await expect(Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2)).toBeLessThan(1);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBeGreaterThan(0);
    await userEvent.keyboard("{Escape}");
  },
};

export const LockedPage: Story = {
  name: "The page behind is locked and inert while open",
  render: () => (
    <>
      <div style={{ blockSize: "300vh" }}>
        <button type="button">Behind</button>
      </div>
      <Form />
    </>
  ),
  play: async () => {
    const dialog = await openFrom("Open");
    await expect(document.body).toHaveAttribute("data-scroll-locked");
    await expect(getComputedStyle(document.body).overflow).toBe("hidden");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // the page behind is hidden from assistive technology
    await expect(within(document.body).queryByRole("button", { name: "Behind" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.body).not.toHaveAttribute("data-scroll-locked"));
    await expect(within(document.body).getByRole("button", { name: "Behind" })).toBeInTheDocument();
  },
};

export const PressesInPortaledChildren: Story = {
  name: "A press inside a popover opened from the dialog does not close it",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a popover">
        <Dialog.Body>
          <Popover>
            <Popover.Trigger asChild>
              <Button>Pop</Button>
            </Popover.Trigger>
            <Popover.Content aria-label="Popover">
              <Button>Inside popover</Button>
            </Popover.Content>
          </Popover>
          <Select aria-label="Pick one" defaultValue="a">
            <Select.Option value="a">Alpha</Select.Option>
            <Select.Option value="b">Beta</Select.Option>
          </Select>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: "Pop" }));
    const inside = await body.findByRole("button", { name: "Inside popover" });
    // a popover opened from the dialog is clickable (one layer stack, not two)
    await expect(getComputedStyle(inside).pointerEvents).not.toBe("none");
    await userEvent.click(inside);
    await expect(body.getByRole("dialog", { name: "With a popover" })).toBeInTheDocument();
    // Escape closes the popover first, then the dialog
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("button", { name: "Inside popover" })).toBeNull());
    await expect(body.getByRole("dialog", { name: "With a popover" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const ExitFades: Story = {
  name: "The scrim and the panel fade out before they leave the document",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    const scrim = dialog.parentElement as HTMLElement;
    await userEvent.keyboard("{Escape}");
    await expect(scrim).toHaveAttribute("data-state", "closed");
    await expect(scrim.isConnected).toBe(true);
    await waitFor(() => expect(scrim.isConnected).toBe(false), { timeout: 1500 });
  },
};

export const LongContentScrollsInside: Story = {
  name: "Long content scrolls inside the panel, header and footer stay in view",
  render: () => (
    <Form>
      <LongText />
    </Form>
  ),
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const viewport = dialog.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") as HTMLElement;
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const panel = dialog.getBoundingClientRect();
    // the panel stays inside the viewport, less a gutter on each side
    await expect(panel.height).toBeLessThanOrEqual(window.innerHeight - 2 * 16 + 1);
    // header at the top, footer at the bottom, both fully inside the panel
    const header = within(dialog).getByTestId("header").getBoundingClientRect();
    const footer = within(dialog).getByTestId("footer").getBoundingClientRect();
    await expect(header.top).toBeGreaterThanOrEqual(panel.top);
    await expect(footer.bottom).toBeLessThanOrEqual(panel.bottom + 1);
    // a body that scrolls is a focusable region, so a keyboard user can scroll it
    await expect(viewport).toHaveAttribute("tabindex", "0");
    viewport.scrollTop = 200;
    await nextFrame();
    await expect(within(dialog).getByTestId("header").getBoundingClientRect().top).toBe(header.top);
    await userEvent.keyboard("{Escape}");
  },
};

export const FullScreenOnAPhone: Story = {
  name: "Fills a phone screen and has no rounded corners",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Phone" fullScreen={{ base: true, md: false }}>
        <Dialog.Body>Body</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(768);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rect = dialog.getBoundingClientRect();
    await expect(Math.round(rect.width)).toBe(window.innerWidth);
    await expect(Math.round(rect.height)).toBe(window.innerHeight);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBe(0);
  },
};

export const GutterOnANarrowScreen: Story = {
  name: "A panel on a phone keeps a gutter on each side",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Narrow" size="xl">
        <Dialog.Body>Body</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rect = dialog.getBoundingClientRect();
    await expect(Math.round(rect.left)).toBe(16);
    await expect(Math.round(window.innerWidth - rect.right)).toBe(16);
  },
};

export const CloseButtonTarget: Story = {
  name: "The close button is at least 24 by 24 and sits in the end corner",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const close = within(dialog).getByRole("button", { name: "Close" });
    const rect = close.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThanOrEqual(24);
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    const panel = dialog.getBoundingClientRect();
    await expect(panel.right - rect.right).toBeLessThan(24);
    await expect(rect.top - panel.top).toBeLessThan(24);
    await userEvent.keyboard("{Escape}");
  },
};

export const RightToLeft: Story = {
  name: "Right to left puts the close button and the actions at the other side",
  render: () => <Form dir="rtl" />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const panel = dialog.getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: "Close" }).getBoundingClientRect();
    await expect(close.left - panel.left).toBeLessThan(24);
    const footer = within(dialog).getByTestId("footer");
    const buttons = within(footer).getAllByRole("button");
    const first = buttons[0]?.getBoundingClientRect();
    const last = buttons[buttons.length - 1]?.getBoundingClientRect();
    // in rtl the actions end at the left, so the first one in the DOM sits to the right of the last
    await expect((first as DOMRect).left).toBeGreaterThan((last as DOMRect).left);
    await userEvent.keyboard("{Escape}");
  },
};

export const FocusLoopsInTheBrowser: Story = {
  name: "Tab and Shift+Tab loop inside the dialog, and focus returns to the trigger",
  render: () => <Form />,
  play: async () => {
    const trigger = within(document.body).getByRole("button", { name: "Open" });
    const dialog = await openFrom("Open");
    for (let press = 0; press < 8; press += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let press = 0; press < 8; press += 1) {
      await userEvent.tab({ shift: true });
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ForcedColoursAndReducedMotionRulesExist: Story = {
  name: "The stylesheet carries a forced-colours border and a reduced-motion fade",
  render: () => <Form />,
  play: async () => {
    // jsdom can't evaluate either media query, and a story can't switch them on, so prove the rules exist from
    // the stylesheet itself.
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
    const forced = mediaRules.find((rule) => rule.conditionText.includes("forced-colors: active") && rule.cssText.includes("CanvasText") && /content/i.test(rule.cssText));
    const reduced = mediaRules.find((rule) => rule.conditionText.includes("prefers-reduced-motion: reduce") && /dialogFadeIn/.test(rule.cssText));
    await expect(forced).toBeDefined();
    await expect(reduced).toBeDefined();
  },
};

// The spacing of a body with no header above it, with a visually hidden title or an `aria-label` standing in for
// one. The hidden title is a sibling that comes first, so layout rules keyed to a body's position among its
// siblings miss it: the text sat 8px from the top and ran under the close button.
async function measureBodyText(dialog: HTMLElement) {
  const body = within(dialog).getByTestId("body");
  const textNode = Array.from(body.querySelectorAll("p")).at(0) as HTMLElement;
  const range = document.createRange();
  range.selectNodeContents(textNode);
  const lines = Array.from(range.getClientRects());
  const close = within(dialog).getByRole("button", { name: "Close" }).getBoundingClientRect();
  const panel = dialog.getBoundingClientRect();
  const top = Math.min(...lines.map((line) => line.top));
  const bottom = Math.max(...lines.map((line) => line.bottom));
  const overlapsClose = lines.some(
    (line) => line.left < close.right && line.right > close.left && line.top < close.bottom && line.bottom > close.top,
  );
  return { top: top - panel.top, bottom: panel.bottom - bottom, overlapsClose, lines: lines.length };
}

export const TitlelessBodyClearsTheCloseButton: Story = {
  name: "A body with no header keeps its spacing and stays clear of the close button",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="No title" size="xs">
        <Dialog.Body data-testid="body">
          <p style={{ margin: 0 }}>
            Your changes were saved to your account and will show on every device you are signed in on.
          </p>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const { top, bottom, overlapsClose, lines } = await measureBodyText(dialog);
    await expect(lines).toBeGreaterThan(1);
    await expect(overlapsClose).toBe(false);
    // the padding token is space-6, 24px, on the top and the bottom
    await expect(Math.round(top)).toBeGreaterThanOrEqual(24);
    await expect(Math.round(bottom)).toBeGreaterThanOrEqual(24);
  },
};

export const HiddenTitleBodyClearsTheCloseButton: Story = {
  name: "With a visually hidden title first, the body is spaced the same",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content size="xs">
        <VisuallyHidden asChild>
          <Dialog.Title>Image preview</Dialog.Title>
        </VisuallyHidden>
        <Dialog.Body data-testid="body">
          <p style={{ margin: 0 }}>
            The dialog is named for screen readers, and the design shows no heading above this text.
          </p>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button>Done</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "Image preview" });
    await settled(dialog);
    const { top, overlapsClose } = await measureBodyText(dialog);
    await expect(overlapsClose).toBe(false);
    await expect(Math.round(top)).toBeGreaterThanOrEqual(24);
  },
};

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, and a Select
// chooses on the pointer's up event, which a synthetic click left unanswered. The test page scales its iframe, so
// a point inside the story is mapped to the page it is drawn on.
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

// The scrim's centre is where a centred panel sits, so a press "on the scrim" has to be somewhere else: just inside
// its top-left corner, which is clear of the panel at every size.
const pressScrim = (scrim: Element) => realClick(scrim, { x: 12, y: 12 });

export const SelectChosenWithARealPointer: Story = {
  name: "An option chosen with a real mouse in a Select inside the dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a select">
        <Dialog.Body>
          <Select aria-label="Pick one" defaultValue="a">
            <Select.Option value="a">Alpha</Select.Option>
            <Select.Option value="b">Beta</Select.Option>
          </Select>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    const combobox = await body.findByRole("combobox", { name: "Pick one" });
    await expect(combobox).toHaveTextContent("Alpha");
    await realClick(combobox);
    const option = await body.findByRole("option", { name: "Beta" });
    // the list is above the dialog and takes the pointer
    await expect(document.elementFromPoint(option.getBoundingClientRect().left + 4, option.getBoundingClientRect().top + 4)).toBe(option);
    await realClick(option);
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(body.getByRole("combobox", { name: "Pick one" })).toHaveTextContent("Beta");
    // choosing did not close the dialog
    await expect(body.getByRole("dialog", { name: "With a select" })).toBeInTheDocument();
    // and a real press on the scrim afterwards still does
    await pressScrim(body.getByRole("dialog").parentElement as HTMLElement);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const ClosingScrimLetsPressesThrough: Story = {
  name: "A scrim that is fading out lets a press through to the page, and focus returns to what opened the dialog",
  render: () => {
    function Page() {
      const [open, setOpen] = useState(false);
      const [presses, setPresses] = useState(0);
      return (
        <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
          <Button onClick={() => setOpen(true)}>Open from state</Button>
          <Button variant="secondary" onClick={() => setPresses((count) => count + 1)}>
            Behind the scrim
          </Button>
          <p data-testid="presses">{presses}</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Content aria-label="From state">
              <Dialog.Body>Body</Dialog.Body>
            </Dialog.Content>
          </Dialog>
        </div>
      );
    }
    return <Page />;
  },
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open from state" }));
    const dialog = await body.findByRole("dialog");
    await settled(dialog);
    // An Escape starts the exit. Radix lifts its pointer lock when the panel leaves, and the scrim, which fades for
    // longer, is still drawn for a few frames after that: a press then is the page's, so whatever is at the button's
    // point must be the button, not the fading scrim. Sampled every frame, since the window is short.
    const behind = body.getByRole("button", { name: "Behind the scrim", hidden: true });
    const at = behind.getBoundingClientRect();
    const samples: string[] = [];
    await userEvent.keyboard("{Escape}");
    const deadline = performance.now() + 1500;
    while (performance.now() < deadline) {
      await nextFrame();
      const scrimStillDrawn = document.querySelector('[data-state="closed"]') !== null;
      const lockLifted = document.body.style.pointerEvents !== "none";
      if (scrimStillDrawn && lockLifted) {
        const top = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
        samples.push(top?.closest("button") === behind ? "page" : `scrim:${top?.tagName}`);
      }
      if (!scrimStillDrawn && lockLifted) break;
    }
    await expect(samples.length).toBeGreaterThan(0);
    await expect(samples.filter((sample) => sample !== "page")).toEqual([]);
    // focus is back on the button that opened it, which has no Dialog.Trigger to return to
    await waitFor(() => expect(body.getByRole("button", { name: "Open from state" })).toHaveFocus());
    // and the press on the page behind lands
    await realClick(behind);
    await waitFor(() => expect(body.getByTestId("presses")).toHaveTextContent("1"));
  },
};

function LongForm({ children, ...content }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Content aria-label="Long" {...content}>
      <Dialog.Header data-testid="header">
        <Dialog.Title>Terms</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body data-testid="body">{children}</Dialog.Body>
      <Dialog.Footer data-testid="footer">
        <Button>Accept</Button>
      </Dialog.Footer>
    </Dialog.Content>
  );
}

const borderOf = (element: HTMLElement, side: "Top" | "Bottom") => {
  const style = getComputedStyle(element);
  return { width: style[`border${side}Width`], color: style[`border${side}Color`] };
};

export const DividedAutoFollowsTheScroll: Story = {
  name: "divided=auto draws each line only while content is out of view, and nothing moves",
  render: () => (
    <Dialog defaultOpen>
      <LongForm divided="auto">
        <LongText />
      </LongForm>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const header = within(dialog).getByTestId("header");
    const footer = within(dialog).getByTestId("footer");
    const viewport = dialog.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") as HTMLElement;
    const clear = "rgba(0, 0, 0, 0)";
    // at the top: nothing above to run under the header, more below the footer
    await waitFor(() => expect(borderOf(footer, "Top").color).not.toBe(clear));
    await expect(borderOf(header, "Bottom").color).toBe(clear);
    const headerBefore = header.getBoundingClientRect();
    const footerBefore = footer.getBoundingClientRect();
    viewport.scrollTop = 120;
    await waitFor(() => expect(borderOf(header, "Bottom").color).not.toBe(clear));
    // a line appearing moves nothing: the line was reserved, transparent
    await expect(header.getBoundingClientRect().height).toBe(headerBefore.height);
    await expect(footer.getBoundingClientRect().top).toBe(footerBefore.top);
    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() => expect(borderOf(footer, "Top").color).toBe(clear));
    await expect(borderOf(header, "Bottom").width).toBe("1px");
  },
};

export const DividedAutoDrawsNothingWhenItFits: Story = {
  name: "divided=auto draws no line when the content fits",
  render: () => (
    <Dialog defaultOpen>
      <LongForm divided="auto">
        <p>Short.</p>
      </LongForm>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const clear = "rgba(0, 0, 0, 0)";
    await expect(borderOf(within(dialog).getByTestId("header"), "Bottom").color).toBe(clear);
    await expect(borderOf(within(dialog).getByTestId("footer"), "Top").color).toBe(clear);
  },
};

export const KeepMountedKeepsTheState: Story = {
  name: "keepMounted keeps what was typed through a real close and reopen",
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open</Button>
      </Dialog.Trigger>
      <Dialog.Content aria-label="Form" keepMounted>
        <Dialog.Body data-testid="body">
          <input aria-label="Name" />
          <div style={{ blockSize: "200vh" }} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    const field = await body.findByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Jane");
    const viewport = document.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") as HTMLElement;
    viewport.scrollTop = 150;
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    // closed: the page is not locked or hidden
    await waitFor(() => expect(document.body).not.toHaveAttribute("data-scroll-locked"));
    await expect(body.getByRole("button", { name: "Open" })).not.toHaveAttribute("aria-hidden");
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await expect(await body.findByRole("textbox", { name: "Name" })).toHaveValue("Jane");
    await userEvent.keyboard("{Escape}");
  },
};

export const BusyCannotBeLeft: Story = {
  name: "A busy dialog ignores Escape and a real press on the scrim",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Saving" busy>
        <Dialog.Body>Saving…</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("dialog");
    await settled(dialog);
    await userEvent.keyboard("{Escape}");
    await pressScrim(dialog.parentElement as HTMLElement);
    await realClick(body.getByRole("button", { name: "Cancel" }));
    await nextFrame();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    const close = body.getByRole("button", { name: "Close" });
    await expect(close).toHaveAttribute("aria-disabled", "true");
    // still focusable, and a real press on it does nothing
    close.focus();
    await expect(close).toHaveFocus();
    await realClick(close);
    await nextFrame();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
  },
};

export const TopPlacement: Story = {
  name: "placement=top sits a set distance from the top, and a phone's gutter on a phone",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Top" placement="top" size="xs">
        <Dialog.Body>Top placed</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(Math.round(dialog.getBoundingClientRect().top)).toBe(Math.round(4 * rem));
  },
};

export const TopPlacementOnAPhone: Story = {
  name: "placement=top keeps to the gutter on a phone",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Top" placement="top" size="xs">
        <Dialog.Body>Top placed</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    await expect(Math.round(dialog.getBoundingClientRect().top)).toBe(16);
  },
};

export const ScrimOpacityAndBlur: Story = {
  name: "scrimOpacity and scrimBlur change the scrim",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Scrim" scrimOpacity={90} scrimBlur />
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const scrim = getComputedStyle(dialog.parentElement as HTMLElement);
    // the scrim is bg.overlay (black) at the requested alpha
    const alpha = Number(/\/ ([0-9.]+)\)|, ([0-9.]+)\)$/.exec(scrim.backgroundColor)?.slice(1).find(Boolean));
    await expect(alpha).toBeCloseTo(0.9, 1);
    await expect(scrim.backdropFilter).toContain("blur");
  },
};

export const InitialFocusByRef: Story = {
  name: "initialFocus puts focus on the chosen element",
  render: function Render() {
    const second = useRef<HTMLInputElement>(null);
    return (
      <Dialog defaultOpen>
        <Dialog.Content aria-label="Focus" initialFocus={second}>
          <Dialog.Body>
            <input aria-label="first" />
            <input aria-label="second" ref={second} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    );
  },
  play: async () => {
    await waitFor(() => expect(within(document.body).getByLabelText("second")).toHaveFocus());
  },
};

export const FullScreenCarriesSafeAreaInsets: Story = {
  name: "full screen reserves the device's safe-area insets, and none where there are none",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Full" fullScreen />
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    // a desktop browser reports no inset, so the panel adds no padding
    const style = getComputedStyle(dialog);
    await expect(style.paddingTop).toBe("0px");
    await expect(style.paddingBottom).toBe("0px");
    // and the stylesheet does ask for the device's insets in full screen
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

export const NonModalTopPlacement: Story = {
  name: "A non-modal dialog placed at the top sits the same distance from the top",
  render: () => (
    <Dialog defaultOpen modal={false}>
      <Dialog.Content aria-label="Docked" placement="top" size="xs">
        <Dialog.Body>Docked at the top</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(getComputedStyle(dialog).position).toBe("fixed");
    await expect(Math.round(dialog.getBoundingClientRect().top)).toBe(Math.round(4 * rem));
  },
};

export const KeepMountedNonModal: Story = {
  name: "keepMounted works on a non-modal dialog and leaves the page usable while closed",
  render: () => (
    <>
      <button type="button">Behind</button>
      <Dialog modal={false}>
        <Dialog.Trigger asChild>
          <Button>Open</Button>
        </Dialog.Trigger>
        <Dialog.Content aria-label="Docked form" keepMounted>
          <Dialog.Body>
            <input aria-label="Note" />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    </>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await userEvent.type(await body.findByRole("textbox", { name: "Note" }), "kept");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(body.getByRole("button", { name: "Behind" })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await expect(await body.findByRole("textbox", { name: "Note" })).toHaveValue("kept");
  },
};

export const CloseButtonFollowsTheSafeAreaInset: Story = {
  name: "The close button moves in by the device's safe-area inset",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Inset" fullScreen data-testid="panel" />
    </Dialog>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const close = within(dialog).getByRole("button", { name: "Close" });
    const before = close.getBoundingClientRect();
    // A desktop reports no inset, so stand one in the way the stylesheet reads it: through the custom
    // properties full screen sets from `env(safe-area-inset-*)`.
    dialog.style.setProperty("--overlay-safe-block-start", "20px");
    dialog.style.setProperty("--overlay-safe-inline-end", "12px");
    await nextFrame();
    const after = close.getBoundingClientRect();
    await expect(Math.round(after.top - before.top)).toBe(20);
    await expect(Math.round(before.right - after.right)).toBe(12);
  },
};

export const FooterStacksFullWidthOnAPhone: Story = {
  name: "On a phone the footer's actions stack, each as wide as the footer, in the order written",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Form />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await openFrom("Open");
    await settled(dialog);
    const footer = within(dialog).getByTestId("footer");
    const style = getComputedStyle(footer);
    const box = footer.getBoundingClientRect();
    const inner = box.width - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd);
    const cancel = within(footer).getByRole("button", { name: "Cancel" }).getBoundingClientRect();
    const save = within(footer).getByRole("button", { name: "Save" }).getBoundingClientRect();
    // one under the other, Cancel first as written, and both as wide as the footer's content box
    await expect(cancel.bottom).toBeLessThanOrEqual(save.top + 1);
    await expect(Math.round(cancel.width)).toBe(Math.round(inner));
    await expect(Math.round(save.width)).toBe(Math.round(inner));
    await expect(Math.round(save.left)).toBe(Math.round(cancel.left));
  },
};

export const FooterIsARowFromSm: Story = {
  name: "From sm the footer's actions are a row again, at the end, at their own width",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const footer = within(dialog).getByTestId("footer");
    const cancel = within(footer).getByRole("button", { name: "Cancel" }).getBoundingClientRect();
    const save = within(footer).getByRole("button", { name: "Save" }).getBoundingClientRect();
    await expect(Math.abs(cancel.top - save.top)).toBeLessThan(2);
    await expect(cancel.right).toBeLessThanOrEqual(save.left);
    // at the end of the row, and not stretched
    const box = footer.getBoundingClientRect();
    await expect(box.right - save.right).toBeLessThan(40);
    await expect(save.width).toBeLessThan(box.width / 2);
  },
};

export const StretchFooterStaysARowOnAPhone: Story = {
  name: "align=stretch keeps an equal-share row on a phone",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Stretch" data-testid="panel">
        <Dialog.Body>
          <p>Short body</p>
        </Dialog.Body>
        <Dialog.Footer align="stretch" data-testid="footer">
          <Button variant="secondary">Cancel</Button>
          <Button>Save</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const footer = within(dialog).getByTestId("footer");
    const cancel = within(footer).getByRole("button", { name: "Cancel" }).getBoundingClientRect();
    const save = within(footer).getByRole("button", { name: "Save" }).getBoundingClientRect();
    await expect(Math.abs(cancel.top - save.top)).toBeLessThan(2);
    // an equal share of the row each, give or take the buttons' own borders, and together they fill it
    await expect(Math.abs(cancel.width - save.width)).toBeLessThan(6);
    const box = footer.getBoundingClientRect();
    const style = getComputedStyle(footer);
    const inner = box.width - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd);
    await expect(Math.round(save.right - cancel.left)).toBe(Math.round(inner));
  },
};

export const DefaultDividedIsAutoAndDrawsNothingWhenItFits: Story = {
  name: "With no divided prop, a dialog whose content fits draws no line",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    // the line is reserved, so nothing moves when it appears, and it is transparent until content is out of view
    const transparent = "rgba(0, 0, 0, 0)";
    await expect(getComputedStyle(within(dialog).getByTestId("header")).borderBlockEndColor).toBe(transparent);
    await expect(getComputedStyle(within(dialog).getByTestId("footer")).borderBlockStartColor).toBe(transparent);
    await expect(dialog).not.toHaveAttribute("data-overflow-start");
    await expect(dialog).not.toHaveAttribute("data-overflow-end");
  },
};

// Many of these stories end by closing the dialog. The accessibility check that runs after a story reads the page
// while the exit is still playing, when the page behind is still hidden from assistive technology and the fading
// scrim no longer takes pointer events, so it can't tell a modal is open and reports the trigger behind it. Each
// play waits for the exit to finish first, so what is read is the settled page. (A story-level `afterEach` runs
// after that check, not before it.)
for (const story of [
  ScrimAndLayout,
  LockedPage,
  PressesInPortaledChildren,
  ExitFades,
  LongContentScrollsInside,
  FullScreenOnAPhone,
  GutterOnANarrowScreen,
  CloseButtonTarget,
  RightToLeft,
  FocusLoopsInTheBrowser,
  ForcedColoursAndReducedMotionRulesExist,
  TitlelessBodyClearsTheCloseButton,
  HiddenTitleBodyClearsTheCloseButton,
  SelectChosenWithARealPointer,
  ClosingScrimLetsPressesThrough,
  DividedAutoFollowsTheScroll,
  DividedAutoDrawsNothingWhenItFits,
  KeepMountedKeepsTheState,
  BusyCannotBeLeft,
  TopPlacement,
  TopPlacementOnAPhone,
  ScrimOpacityAndBlur,
  InitialFocusByRef,
  FullScreenCarriesSafeAreaInsets,
  NonModalTopPlacement,
  KeepMountedNonModal,
  CloseButtonFollowsTheSafeAreaInset,
  FooterStacksFullWidthOnAPhone,
  FooterIsARowFromSm,
  StretchFooterStaysARowOnAPhone,
  DefaultDividedIsAutoAndDrawsNothingWhenItFits,
]) {
  const play = story.play;
  story.play = async (context) => {
    await play?.(context);
    await waitFor(() => expect(document.querySelector('[role="dialog"][data-state="closed"]')).toBeNull());
  };
}
