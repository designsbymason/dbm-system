import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { createToaster, Toast, useToast } from "./Toast";
import type { ToastOptions, ToastProviderProps } from "./Toast.types";

// Real-browser checks for what jsdom can't evaluate: where the region sits, a swipe with a real pointer, a toast above a
// modal dialog under a real mouse, focus coming back, forced colours and the sizes of targets. Hidden from the sidebar
// and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/Toast/Checks",
  id: "organisms-feedback-toast-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (it slides in and scales
// up from 0.96), so wait for every animation on the toast to finish first.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
const toastItems = () => Array.from(document.querySelectorAll<HTMLElement>("li[data-state]:not([data-clear-all])"));
const firstToast = async () => {
  await waitFor(() => expect(toastItems().length).toBeGreaterThan(0));
  const item = toastItems()[0] as HTMLElement;
  await settled(item);
  return item;
};

// Raises a toast from a button, so a check starts the way a person does.
function Raise({ options, label = "Raise" }: { options: ToastOptions; label?: string }) {
  const { toast } = useToast();
  return <Button onClick={() => toast(options)}>{label}</Button>;
}

function App({ provider, options, children }: { provider?: Omit<ToastProviderProps, "children">; options?: ToastOptions; children?: React.ReactNode }) {
  return (
    <Toast.Provider {...provider}>
      <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
        <Raise options={options ?? { tone: "success", title: "Saved", description: "Your changes are live." }} />
        {children}
      </div>
    </Toast.Provider>
  );
}

// A real mouse and keyboard, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
function pagePoint(x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
}
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const { x, y } = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}
async function realMoveTo(element: Element) {
  const rect = element.getBoundingClientRect();
  const { x, y } = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}
async function realDrag(element: Element, dx: number) {
  const rect = element.getBoundingClientRect();
  const start = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x, y: start.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x + (dx * step) / 6, y: start.y, buttons: 1 });
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: start.x + dx, y: start.y, button: "left", clickCount: 1 });
}
const pressKey = async (key: string, code: string, windowsVirtualKeyCode: number, text?: string) => {
  // `text` makes it a key that types (Enter activates a button on the character event, not the raw key).
  await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode, text });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
};

export const PlacementBottomEnd: Story = {
  name: "Bottom end sits against the corner, one gutter in, at the toast width",
  render: () => <App provider={{ placement: "bottom-end" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    const gutter = 4 * (rem() / 4); // space-4 is 1rem
    await expect(Math.round(rect.right)).toBe(window.innerWidth - Math.round(gutter));
    await expect(Math.round(rect.bottom)).toBe(window.innerHeight - Math.round(gutter));
    await expect(Math.round(rect.width)).toBe(Math.round(24 * rem()));
    // above the page, on the toast step of the scale
    await expect(getComputedStyle(item.closest("ol") as HTMLElement).zIndex).toBe("1600");
  },
};

export const PlacementTopStartRightToLeft: Story = {
  name: "Top start in right to left is the top-right corner",
  render: () => <App provider={{ placement: "top-start", dir: "rtl" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    const gutter = rem();
    await expect(Math.round(rect.top)).toBe(Math.round(gutter));
    await expect(Math.round(rect.right)).toBe(window.innerWidth - Math.round(gutter));
  },
};

export const NewestOnTopAndClearAllLast: Story = {
  name: "The newest toast is at the top and Clear all at the bottom, at both edges",
  render: () => <App provider={{ placement: "bottom", mergeDuplicates: false }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    await settled(toastItems()[1] as HTMLElement);
    const [older, newer] = toastItems() as [HTMLElement, HTMLElement];
    await expect(newer.getBoundingClientRect().top).toBeLessThan(older.getBoundingClientRect().top);
    // Clear all is below the oldest, at the very bottom, and the list is against the bottom edge
    const clear = within(document.body).getByRole("button", { name: "Clear all" }).closest("li") as HTMLElement;
    await settled(clear);
    await expect(clear.getBoundingClientRect().top).toBeGreaterThanOrEqual(older.getBoundingClientRect().bottom);
    await expect(Math.round(clear.getBoundingClientRect().bottom)).toBe(window.innerHeight - Math.round(rem()));
    // centred
    const centre = (element: HTMLElement) => element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
    await expect(Math.abs(centre(newer) - window.innerWidth / 2)).toBeLessThan(1);
  },
};

export const OnAPhoneItSpansTheScreen: Story = {
  name: "On a phone a toast spans the screen less its gutter",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <App provider={{ placement: "top-end" }} />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport didn't apply, rather than passing for the wrong reason at desktop width.
    await expect(window.innerWidth).toBeLessThan(640);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    await expect(Math.round(rect.width)).toBe(window.innerWidth - 2 * Math.round(rem()));
    await expect(Math.round(rect.left)).toBe(Math.round(rem()));
  },
};

export const ContainedInItsStage: Story = {
  name: "Given a container, the region and its toasts stay inside it",
  render: function Contained() {
    const [box, setBox] = useState<HTMLElement | null>(null);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <div
          ref={setBox}
          data-testid="stage"
          style={{ position: "relative", transform: "translateZ(0)", inlineSize: "40rem", blockSize: "20rem", overflow: "hidden" }}
        >
          <Toast.Provider container={box}>
            <Raise options={{ title: "Saved" }} />
          </Toast.Provider>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const stage = within(canvasElement).getByTestId("stage").getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(stage.left);
    await expect(rect.right).toBeLessThanOrEqual(stage.right);
    await expect(rect.bottom).toBeLessThanOrEqual(stage.bottom);
  },
};

export const SwipeClosesTowardTheEdge: Story = {
  name: "A swipe toward the edge closes it, and one away does not",
  render: () => <App provider={{ duration: null }} options={{ title: "Saved" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    let item = await firstToast();
    // away from the edge (left, for a toast against the right edge): nothing happens, and it stays
    await realDrag(item, -140);
    await expect(item).toHaveAttribute("data-state", "open");
    await expect(item).not.toHaveAttribute("data-swipe", "end");
    // toward it, but not far enough: it follows the pointer, springs back and stays
    await realDrag(item, 20);
    await waitFor(() => expect(item).toHaveAttribute("data-swipe", "cancel"));
    await expect(item).toHaveAttribute("data-state", "open");
    // toward it: closed
    await realDrag(item, 140);
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
    // and again, to be sure what was measured is the toast, not a leftover
    await userEvent.click(raise);
    item = await firstToast();
    await expect(item).toHaveAttribute("data-state", "open");
  },
};

export const SwipeInRightToLeft: Story = {
  name: "In right to left the edge is the other side",
  render: () => <App provider={{ duration: null, dir: "rtl", placement: "bottom-start" }} options={{ title: "Saved" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await expect(item).toHaveAttribute("data-swipe-direction", "right");
    await realDrag(item, 140);
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
  },
};

export const HoverHoldsTheTimer: Story = {
  name: "A real pointer over the toasts holds the time, and leaving carries on",
  render: () => <App provider={{ duration: 700 }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await realMoveTo(item);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await expect(document.body.contains(item)).toBe(true);
    await expect(item).toHaveAttribute("data-state", "open");
    // away from the toasts, onto the page's own button
    await realMoveTo(within(canvasElement).getByRole("button", { name: "Raise" }));
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
  },
};

export const KeyboardAndFocusReturn: Story = {
  name: "F8 moves into the toasts, an action closes one, and focus goes back to where it was",
  render: () => <App provider={{ duration: null }} options={{ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu" } }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await firstToast();
    raise.focus();
    await pressKey("F8", "F8", 119);
    const region = document.querySelector<HTMLElement>("ol[data-placement]") as HTMLElement;
    await waitFor(() => expect(document.activeElement).toBe(region));
    // The first Tab from the list lands on the toast, the next on its action: a real tab stop, in a real order.
    await pressKey("Tab", "Tab", 9);
    const action = within(document.body).getByRole("button", { name: "Undo" });
    for (let presses = 0; presses < 3 && document.activeElement !== action; presses += 1) await pressKey("Tab", "Tab", 9);
    await expect(document.activeElement).toBe(action);
    await pressKey("Enter", "Enter", 13, "\r");
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await waitFor(() => expect(document.activeElement).toBe(raise));
  },
};

export const FocusIsNotStolenAfterALateFinish: Story = {
  name: "Focus that has moved on stays where it is when the toasts go",
  render: () => (
    <App provider={{ duration: null }} options={{ title: "Saved" }}>
      <button type="button">Elsewhere</button>
    </App>
  ),
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await firstToast();
    raise.focus();
    await pressKey("F8", "F8", 119);
    const dismiss = within(document.body).getByRole("button", { name: "Dismiss" });
    dismiss.focus();
    // the person moves on to somewhere else on the page before the toast is closed from code
    const elsewhere = within(canvasElement).getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    await userEvent.click(dismiss);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await expect(document.activeElement).not.toBe(raise);
  },
};

function DialogApp({ onUndo }: { onUndo: () => void }) {
  const { toast } = useToast();
  return (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Settings">
        <Dialog.Body>
          <Button
            onClick={() =>
              toast({
                title: "Archived",
                duration: null,
                action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo },
              })
            }
          >
            Archive
          </Button>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  );
}

export const AboveAModalDialog: Story = {
  name: "Raised while a modal dialog is open, a toast is on top and answers a real click",
  render: () => {
    const onUndo = fn();
    return (
      <Toast.Provider>
        <DialogApp onUndo={onUndo} />
      </Toast.Provider>
    );
  },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    const item = await firstToast();
    // hidden: true, because the modal dialog hides the rest of the page from assistive technology, the toasts' region
    // included; the announcement is made separately, and the action is also available elsewhere (altText)
    const action = within(item).getByRole("button", { name: "Undo", hidden: true });
    const rect = action.getBoundingClientRect();
    // the toast's own button is the top element at its own point: not under the dialog's scrim (z-index 1300)
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(action);
    await expect(getComputedStyle(action).pointerEvents).not.toBe("none");
    await realClick(action);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    // the dialog is still open: a press in the toast is not "outside" it
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
  },
};

function RaiseEverySize() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() => {
        for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
          toast({
            id: size,
            size,
            title: `Size ${size}`,
            duration: null,
            action: { label: "Open", altText: "Open it from the list" },
          });
        }
      }}
    >
      Raise
    </Button>
  );
}

function OpenDialogAfterToast({ onUndo }: { onUndo: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          toast({ title: "Archived", duration: null, action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo } });
        }}
      >
        Archive
      </Button>
      <Button onClick={() => setOpen(true)}>Settings</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content aria-label="Settings">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

export const ShowingBeforeAModalDialogOpens: Story = {
  name: "A toast already showing when a modal dialog opens still answers a real click",
  render: () => {
    const onUndo = fn();
    return (
      <Toast.Provider>
        <OpenDialogAfterToast onUndo={onUndo} />
      </Toast.Provider>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Archive" }));
    const item = await firstToast();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Settings" }));
    await within(document.body).findByRole("dialog");
    const action = within(item).getByRole("button", { name: "Undo", hidden: true });
    await expect(getComputedStyle(action).pointerEvents).not.toBe("none");
    const rect = action.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(action);
  },
};

export const EscapeInADialogClosesTheToastFirst: Story = {
  name: "With focus in a modal dialog, Escape closes the newest toast, and the next one the dialog",
  render: () => (
    <Toast.Provider>
      <DialogApp onUndo={() => undefined} />
    </Toast.Provider>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    await firstToast();
    within(dialog).getByRole("button", { name: "Archive" }).focus();
    await pressKey("Escape", "Escape", 27);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await expect(within(document.body).queryByRole("dialog")).toBeInTheDocument();
    await pressKey("Escape", "Escape", 27);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const TargetsAreAtLeast24px: Story = {
  name: "The dismiss button and the action are at least 24 by 24 at every size",
  render: () => (
    <Toast.Provider limit={5} duration={null}>
      <RaiseEverySize />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    await waitFor(() => expect(toastItems()).toHaveLength(5));
    await settled(toastItems()[4] as HTMLElement);
    for (const item of toastItems()) {
      for (const name of ["Dismiss", "Open"]) {
        const target = within(item).getByRole("button", { name });
        const rect = target.getBoundingClientRect();
        await expect(rect.width).toBeGreaterThanOrEqual(24);
        await expect(rect.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ForcedColoursKeepAnEdge: Story = {
  name: "In forced colours a toast keeps an edge, in a system colour",
  render: () => <App provider={{ duration: null, variant: "solid" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await nextFrame();
      await nextFrame();
      const style = getComputedStyle(item);
      await expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      await expect(style.borderTopStyle).toBe("solid");
      // a system colour: not the transparent that would draw as nothing
      await expect(style.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "none" }] });
    }
  },
};

export const ReducedMotionIsAFade: Story = {
  name: "With reduced motion the entrance is a fade, not a slide",
  render: () => <App provider={{ duration: null }} />,
  play: async ({ canvasElement }) => {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    try {
      await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
      await waitFor(() => expect(toastItems().length).toBeGreaterThan(0));
      const item = toastItems()[0] as HTMLElement;
      await expect(getComputedStyle(item).animationName).toMatch(/toastFadeIn/);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    }
  },
};

// Raises a numbered toast each time, so no two are alike.
function RaiseNumbered({ extra }: { extra?: Partial<ToastOptions> }) {
  const { toast } = useToast();
  const [count, setCount] = useState(0);
  return (
    <Button
      onClick={() => {
        const next = count + 1;
        setCount(next);
        toast({ title: `Message ${next}`, description: "A line of detail.", ...extra });
      }}
    >
      Raise
    </Button>
  );
}

function NumberedApp({ provider, extra }: { provider?: Omit<ToastProviderProps, "children">; extra?: Partial<ToastOptions> }) {
  return (
    <Toast.Provider {...provider}>
      <div style={{ padding: "var(--dbm-space-4)" }}>
        <RaiseNumbered extra={extra} />
      </div>
    </Toast.Provider>
  );
}

export const NeighboursGlideIntoTheGap: Story = {
  name: "When a toast leaves, the ones below it glide up into its place instead of jumping",
  render: () => <NumberedApp provider={{ duration: null, clearAll: false, placement: "top" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    await settled(toastItems()[1] as HTMLElement);
    const [older, newer] = toastItems() as [HTMLElement, HTMLElement];
    const start = older.getBoundingClientRect().top;
    const room = newer.getBoundingClientRect().height + 12;
    // the newer one is the top one (the list is against the top edge): when it goes, the older one moves up into its room
    within(newer).getByRole("button", { name: "Dismiss" }).click();
    const seen: number[] = [];
    for (let frame = 0; frame < 40; frame += 1) {
      await nextFrame();
      seen.push(older.getBoundingClientRect().top);
    }
    const end = seen[seen.length - 1] as number;
    await expect(Math.round(start - end)).toBe(Math.round(room));
    // it was somewhere between at some frame: a jump would have gone from `start` straight to `end`
    await expect(seen.some((top) => top < start - 1 && top > end + 1)).toBe(true);
  },
};

export const HoveringOneHoldsAll: Story = {
  name: "A real pointer over one toast holds the time of all of them",
  render: () => <NumberedApp provider={{ duration: 800, clearAll: false }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    const [first, second] = toastItems() as [HTMLElement, HTMLElement];
    await settled(second);
    await realMoveTo(first);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await expect(first).toHaveAttribute("data-state", "open");
    await expect(second).toHaveAttribute("data-state", "open");
    await realMoveTo(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(0), { timeout: 4000 });
  },
};

export const RepeatedMessagesMerge: Story = {
  name: "The same message raised three times is one toast with a count",
  render: () => <App provider={{ duration: null }} options={{ title: "Link copied" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(within(document.body).getByText("×3")).toBeInTheDocument());
    await expect(toastItems()).toHaveLength(1);
    await expect(document.querySelector("[data-clear-all]")).toBeNull();
  },
};

export const ClearAllIsInTheKeyboardOrder: Story = {
  name: "Clear all is reached from the region with the keyboard, and closes everything",
  render: () => <NumberedApp provider={{ duration: null, limit: 2 }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    const clear = await within(document.body).findByRole("button", { name: "Clear all" });
    await settled(clear.closest("li") as HTMLElement);
    raise.focus();
    await pressKey("F8", "F8", 119);
    for (let presses = 0; presses < 8 && document.activeElement !== clear; presses += 1) await pressKey("Tab", "Tab", 9);
    await expect(document.activeElement).toBe(clear);
    await pressKey("Enter", "Enter", 13, "\r");
    await waitFor(() => expect(document.querySelectorAll("li[data-state]")).toHaveLength(0));
    await waitFor(() => expect(document.activeElement).toBe(raise));
  },
};

function PromiseActionApp({ outcome }: { outcome: "resolve" | "reject" }) {
  const { toast } = useToast();
  return (
    <Button
      onClick={() =>
        toast({
          title: "Deleted",
          duration: 600,
          action: {
            label: "Undo",
            altText: "Undo from the Edit menu",
            onClick: () =>
              new Promise<void>((resolve, reject) => {
                setTimeout(() => (outcome === "resolve" ? resolve() : reject(new Error("offline"))), 1500);
              }),
          },
        })
      }
    >
      Raise
    </Button>
  );
}

export const PromiseActionHoldsTheToast: Story = {
  name: "An action that takes a promise holds the toast past its time, then closes it",
  render: () => (
    <Toast.Provider>
      <PromiseActionApp outcome="resolve" />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const undo = within(item).getByRole("button", { name: "Undo" });
    await userEvent.click(undo);
    await expect(undo).toHaveAttribute("aria-busy", "true");
    // past the toast's own 600ms, and still here, with its button still focusable
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(document.body.contains(item)).toBe(true);
    await expect(item).toHaveAttribute("data-state", "open");
    await expect(undo).not.toBeDisabled();
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 4000 });
  },
};

export const PromiseActionRejectionIsNotDropped: Story = {
  name: "A rejection with no handler surfaces as an unhandled rejection, and the toast stays",
  render: () => (
    <Toast.Provider>
      <PromiseActionApp outcome="reject" />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    const seen: unknown[] = [];
    const listener = (event: PromiseRejectionEvent) => {
      seen.push(event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", listener);
    try {
      await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
      const item = await firstToast();
      const undo = within(item).getByRole("button", { name: "Undo" });
      await userEvent.click(undo);
      await waitFor(() => expect(seen).toHaveLength(1), { timeout: 4000 });
      await expect((seen[0] as Error).message).toBe("offline");
      await expect(item).toHaveAttribute("data-state", "open");
      await expect(undo).not.toHaveAttribute("aria-busy");
    } finally {
      window.removeEventListener("unhandledrejection", listener);
    }
  },
};

export const ToasterRaisesFromOutsideReact: Story = {
  name: "A toaster made with createToaster() raises toasts from plain code",
  render: function Outside() {
    const [toaster] = useState(() => {
      const made = createToaster();
      // before any provider exists: it waits
      made.toast({ title: "Raised before the app mounted" });
      return made;
    });
    return <Toast.Provider toaster={toaster} duration={null} />;
  },
  play: async () => {
    const item = await firstToast();
    await expect(item).toHaveTextContent("Raised before the app mounted");
  },
};

// A fan with three numbered toasts, each with an id of its own so one can be taken away from code.
function FanApp({ provider }: { provider?: Omit<ToastProviderProps, "children"> }) {
  return (
    <Toast.Provider stack="fan" duration={null} placement="bottom-end" {...provider}>
      <FanButtons />
    </Toast.Provider>
  );
}
function FanButtons() {
  const { toast, dismiss } = useToast();
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: "var(--dbm-space-4)", display: "flex", gap: "var(--dbm-space-3)" }}>
      <Button
        onClick={() => {
          const next = count + 1;
          setCount(next);
          toast({ id: `n${next}`, title: `Message ${next}`, description: "A line of detail." });
        }}
      >
        Raise
      </Button>
      <Button variant="secondary" onClick={() => dismiss("n2")}>
        Take away the second
      </Button>
    </div>
  );
}

const raiseThree = async (canvasElement: HTMLElement) => {
  const raise = within(canvasElement).getByRole("button", { name: "Raise" });
  // The real pointer stays where an earlier check left it, and a fan spreads out under it: put it on the page's button.
  await realMoveTo(raise);
  await userEvent.click(raise);
  await userEvent.click(raise);
  await userEvent.click(raise);
  await waitFor(() => expect(toastItems()).toHaveLength(3));
  await settled(toastItems()[2] as HTMLElement);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return raise;
};
const peek = () => 0.75 * rem();

export const FanCollapsed: Story = {
  name: "A collapsed fan shows the newest in full and the older ones peeking out behind it",
  render: () => <FanApp />,
  play: async ({ canvasElement }) => {
    await raiseThree(canvasElement);
    const [oldest, middle, front] = toastItems() as [HTMLElement, HTMLElement, HTMLElement];
    const list = document.querySelector("ol[data-placement]") as HTMLElement;
    await expect(list).toHaveAttribute("data-stack", "fan");
    await expect(list).not.toHaveAttribute("data-expanded");
    const f = front.getBoundingClientRect();
    // the front one is where a single toast would be: one gutter in from the corner
    await expect(Math.round(f.bottom)).toBe(window.innerHeight - Math.round(rem()));
    for (const [item, depth] of [[middle, 1], [oldest, 2]] as const) {
      const rect = item.getBoundingClientRect();
      // each step back is one peek higher at the same bottom edge's origin, and a little narrower
      await expect(Math.abs(rect.bottom - (f.bottom - depth * peek()))).toBeLessThan(1.5);
      await expect(Math.abs(rect.width - f.width * (1 - depth * 0.04))).toBeLessThan(1.5);
      await expect(getComputedStyle(item).zIndex).toBe(String(3 - depth));
    }
    // and the stack is about one toast tall, not three
    await expect(f.top - oldest.getBoundingClientRect().top).toBeLessThan(2 * peek() + 2);
  },
};

export const FanExpandsOnAPointerAndFoldsBack: Story = {
  name: "A real pointer over the fan spreads it into the list, and leaving folds it back",
  render: () => <FanApp />,
  play: async ({ canvasElement }) => {
    const raise = await raiseThree(canvasElement);
    const list = document.querySelector("ol[data-placement]") as HTMLElement;
    const [oldest, middle, front] = toastItems() as [HTMLElement, HTMLElement, HTMLElement];
    const collapsedTop = oldest.getBoundingClientRect().top;
    await realMoveTo(front);
    await waitFor(() => expect(list).toHaveAttribute("data-expanded"));
    // the toasts move to their places over a motion duration: wait for their transitions, not a guessed time
    await new Promise((resolve) => setTimeout(resolve, 50));
    for (const item of [oldest, middle, front]) await settled(item);
    const f = front.getBoundingClientRect();
    const m = middle.getBoundingClientRect();
    const o = oldest.getBoundingClientRect();
    // the list: each in full, one gap (space-3) between them, all the same width
    await expect(Math.abs(f.top - m.bottom - 12)).toBeLessThan(1.5);
    await expect(Math.abs(m.top - o.bottom - 12)).toBeLessThan(1.5);
    await expect(Math.abs(o.width - f.width)).toBeLessThan(1.5);
    await expect(o.top).toBeLessThan(collapsedTop);
    await realMoveTo(raise);
    await waitFor(() => expect(list).not.toHaveAttribute("data-expanded"), { timeout: 3000 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    for (const item of [oldest, middle, front]) await settled(item);
    await expect(Math.abs(oldest.getBoundingClientRect().top - collapsedTop)).toBeLessThan(1.5);
  },
};

export const FanExpandsOnFocusAndShowsClearAll: Story = {
  name: "Focus in the fan spreads it out and brings in Clear all; collapsed, there is none",
  render: () => <FanApp />,
  play: async ({ canvasElement }) => {
    const raise = await raiseThree(canvasElement);
    const list = document.querySelector("ol[data-placement]") as HTMLElement;
    await expect(within(document.body).queryByRole("button", { name: "Clear all" })).toBeNull();
    raise.focus();
    await pressKey("F8", "F8", 119);
    await waitFor(() => expect(list).toHaveAttribute("data-expanded"));
    await expect(await within(document.body).findByRole("button", { name: "Clear all" })).toBeInTheDocument();
    // every toast is reached by Tab, as in the list
    const seen = new Set<Element | null>();
    for (let presses = 0; presses < 8; presses += 1) {
      await pressKey("Tab", "Tab", 9);
      seen.add(document.activeElement?.closest("li") ?? null);
    }
    await expect(toastItems().every((item) => seen.has(item))).toBe(true);
  },
};

export const FanFromTheTop: Story = {
  name: "At the top the fan grows downward from the edge",
  render: () => <FanApp provider={{ placement: "top" }} />,
  play: async ({ canvasElement }) => {
    await raiseThree(canvasElement);
    const [oldest, middle, front] = toastItems() as [HTMLElement, HTMLElement, HTMLElement];
    const f = front.getBoundingClientRect();
    await expect(Math.round(f.top)).toBe(Math.round(rem()));
    await expect(Math.abs(middle.getBoundingClientRect().top - (f.top + peek()))).toBeLessThan(1.5);
    await expect(Math.abs(oldest.getBoundingClientRect().top - (f.top + 2 * peek()))).toBeLessThan(1.5);
  },
};

export const FanNeighboursDoNotJump: Story = {
  name: "Taking one away from the middle of a fan does not make the others jump",
  render: () => <FanApp />,
  play: async ({ canvasElement }) => {
    await raiseThree(canvasElement);
    const [oldest, , front] = toastItems() as [HTMLElement, HTMLElement, HTMLElement];
    const height = front.getBoundingClientRect().height;
    const take = within(canvasElement).getByRole("button", { name: "Take away the second" });
    const before = oldest.getBoundingClientRect().top;
    take.click();
    const seen: number[] = [];
    for (let frame = 0; frame < 60; frame += 1) {
      await nextFrame();
      seen.push(oldest.getBoundingClientRect().top);
    }
    // no single frame moves it by anything like a toast's height (it is a short, smooth move of one peek)
    let biggest = Math.abs((seen[0] as number) - before);
    for (let index = 1; index < seen.length; index += 1) {
      biggest = Math.max(biggest, Math.abs((seen[index] as number) - (seen[index - 1] as number)));
    }
    await expect(biggest).toBeLessThan(height / 2);
    // it ends one layer back, now that there are two toasts
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 400));
    const f = (toastItems()[1] as HTMLElement).getBoundingClientRect();
    await expect(Math.abs(oldest.getBoundingClientRect().top + oldest.getBoundingClientRect().height - (f.bottom - peek()))).toBeLessThan(1.5);
  },
};

export const ListStaysTheList: Story = {
  name: "Without stack the toasts are the list: nothing is pulled together",
  render: () => <FanApp provider={{ stack: "list" }} />,
  play: async ({ canvasElement }) => {
    await raiseThree(canvasElement);
    const [oldest, middle, front] = toastItems() as [HTMLElement, HTMLElement, HTMLElement];
    const list = document.querySelector("ol[data-placement]") as HTMLElement;
    await expect(list).toHaveAttribute("data-stack", "list");
    const f = front.getBoundingClientRect();
    const m = middle.getBoundingClientRect();
    // the newest is the top one: each older toast is one gap below it
    await expect(Math.abs(m.top - f.bottom - 12)).toBeLessThan(1.5);
    await expect(Math.abs(oldest.getBoundingClientRect().width - f.width)).toBeLessThan(1.5);
    await expect(getComputedStyle(front).translate).toBe("none");
  },
};

export const ClearAllIsAGhostButton: Story = {
  name: "Clear all is a ghost button with little padding, on the page's surface with no border or shadow",
  render: () => (
    <>
      <NumberedApp provider={{ duration: null }} />
      {/* a real ghost button, to compare against */}
      <Button variant="ghost" size="sm" data-testid="ghost-probe">
        Probe
      </Button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    const button = await within(document.body).findByRole("button", { name: "Clear all" });
    const probe = getComputedStyle(within(canvasElement).getByTestId("ghost-probe"));
    const bar = button.closest("li") as HTMLElement;
    await settled(bar);
    const bar_ = getComputedStyle(bar);
    await expect(parseFloat(bar_.borderTopWidth)).toBe(0);
    await expect(bar_.boxShadow).toBe("none");
    const style = getComputedStyle(button);
    // the ghost button's own colours, and the label is the small button's size
    await expect(style.backgroundColor).toBe(probe.backgroundColor);
    await expect(style.color).toBe(probe.color);
    await expect(style.fontSize).toBe(probe.fontSize);
    // little padding, and still at least 24 by 24
    await expect(parseFloat(style.paddingTop)).toBeLessThanOrEqual(0.25 * rem() + 0.5);
    await expect(parseFloat(style.paddingLeft)).toBeLessThanOrEqual(0.5 * rem() + 0.5);
    const rect = button.getBoundingClientRect();
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    await expect(rect.width).toBeGreaterThanOrEqual(24);
  },
};

export const BottomListGrowsUpAndSettlesDown: Story = {
  name: "At the bottom a new toast is added above the others, and when one leaves the ones above glide down",
  render: () => <NumberedApp provider={{ duration: null, placement: "bottom-end" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await realMoveTo(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(1));
    const [first] = toastItems() as [HTMLElement];
    await settled(first);
    const firstTop = first.getBoundingClientRect().top;
    // a second toast is added above the first; Clear all comes in below it, and the first glides up by its room
    await userEvent.click(raise);
    const seenFirst: number[] = [];
    for (let frame = 0; frame < 40; frame += 1) {
      await nextFrame();
      seenFirst.push(first.getBoundingClientRect().top);
    }
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    const second = toastItems()[1] as HTMLElement;
    await settled(second);
    await expect(second.getBoundingClientRect().bottom).toBeLessThanOrEqual(first.getBoundingClientRect().top);
    // Clear all is below both, at the very bottom, a gap under the first
    const clear = (await within(document.body).findByRole("button", { name: "Clear all" })).closest("li") as HTMLElement;
    await settled(clear);
    await expect(Math.abs(clear.getBoundingClientRect().top - first.getBoundingClientRect().bottom - 12)).toBeLessThan(1.5);
    await expect(Math.round(clear.getBoundingClientRect().bottom)).toBe(window.innerHeight - Math.round(rem()));
    // the first moved up by the bar's room, over several frames and not at once
    let biggest = 0;
    for (let index = 1; index < seenFirst.length; index += 1) {
      biggest = Math.max(biggest, Math.abs((seenFirst[index] as number) - (seenFirst[index - 1] as number)));
    }
    await expect(firstTop - (seenFirst[seenFirst.length - 1] as number)).toBeGreaterThan(20);
    await expect(biggest).toBeLessThan(0.6 * (firstTop - (seenFirst[seenFirst.length - 1] as number)));
    // the oldest leaves, from the bottom: the one above glides down into its room, with no jump
    const start = second.getBoundingClientRect().top;
    // its room, and the room of Clear all, which goes with the second-to-last toast
    const room = first.getBoundingClientRect().height + 12 + clear.getBoundingClientRect().height + 12;
    within(first).getByRole("button", { name: "Dismiss" }).click();
    const seen: number[] = [];
    for (let frame = 0; frame < 60; frame += 1) {
      await nextFrame();
      seen.push(second.getBoundingClientRect().top);
    }
    const end = seen[seen.length - 1] as number;
    await expect(Math.abs(Math.round(end - start) - Math.round(room))).toBeLessThanOrEqual(2);
    await expect(seen.some((top) => top > start + 1 && top < end - 1)).toBe(true);
  },
};

export const DefaultPlacementIsTheTopEndCorner: Story = {
  name: "With no placement the toasts sit in the top-end corner, one gutter in",
  render: () => <App />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    await expect(document.querySelector("ol[data-placement]")).toHaveAttribute("data-placement", "top-end");
    await expect(Math.round(rect.top)).toBe(Math.round(rem()));
    await expect(Math.round(rect.right)).toBe(window.innerWidth - Math.round(rem()));
  },
};

export const ActionDrawnOntoALink: Story = {
  name: "An action drawn onto a link is that link, and pressing it closes the toast",
  render: () => (
    <Toast.Provider duration={null}>
      <Toast data-testid="declared">
        <Toast.Title>Saved</Toast.Title>
        <Toast.Action asChild altText="Open it from the list">
          <a href="#files">View</a>
        </Toast.Action>
      </Toast>
    </Toast.Provider>
  ),
  play: async () => {
    const item = await within(document.body).findByTestId("declared");
    await settled(item);
    const link = within(item).getByRole("link", { name: "View" });
    await expect(link.tagName).toBe("A");
    const rect = link.getBoundingClientRect();
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    // A real press on a real link would navigate the test page. Cancelling it at the document runs after the toast's own
    // handlers (which read `defaultPrevented`), so the toast still closes as it would for a router's link.
    const stop = (event: Event) => event.preventDefault();
    document.addEventListener("click", stop);
    try {
      await realClick(link);
      await waitFor(() => expect(document.body.contains(item)).toBe(false));
    } finally {
      document.removeEventListener("click", stop);
    }
  },
};

export const FocusOnClearAllStaysInTheToasts: Story = {
  name: "When Clear all goes while it has focus, focus lands on the toast that is left",
  render: () => <FanApp provider={{ stack: "list" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await realMoveTo(raise);
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    const clear = await within(document.body).findByRole("button", { name: "Clear all" });
    await settled(clear.closest("li") as HTMLElement);
    clear.focus();
    // take the first away from code, as a request finishing would
    within(canvasElement).getByRole("button", { name: "Take away the second" }).click();
    await waitFor(() => expect(within(document.body).queryByRole("button", { name: "Clear all" })).toBeNull());
    await expect(document.activeElement).not.toBe(document.body);
    await expect(document.activeElement?.closest("li")).toBe(toastItems().find((item) => item.getAttribute("data-state") === "open"));
  },
};
