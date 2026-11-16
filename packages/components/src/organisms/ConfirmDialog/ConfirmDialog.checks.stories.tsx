import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ConfirmDialogProps } from "./ConfirmDialog.types";

// Real-browser checks for what jsdom can't evaluate: a real mouse and key, focus after a button turns busy, layout,
// the breakpoint. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/ConfirmDialog/Checks",
  id: "organisms-overlay-confirmdialog-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel and its scrim to finish first.
const settled = async (panel: HTMLElement) => {
  await nextFrame();
  const running = [panel, panel.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

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

// The scrim's centre is where a centred panel sits, so a press "on the scrim" has to be somewhere else: just inside
// its top-left corner, which is clear of the panel at every size.
const pressScrim = (scrim: Element) => realClick(scrim, { x: 12, y: 12 });

// An answer the test settles by hand, so the pending state can be looked at for as long as it needs.
let settle: { resolve: () => void; reject: (error: unknown) => void } | undefined;
const pendingAnswer = () =>
  new Promise<void>((resolve, reject) => {
    settle = { resolve, reject };
  });

function Confirm(props: Partial<ConfirmDialogProps>) {
  return (
    <ConfirmDialog
      trigger={<Button>Open</Button>}
      tone="danger"
      title="Delete project?"
      description="It cannot be undone."
      labels={{ confirm: "Delete", cancel: "Keep it" }}
      data-testid="panel"
      {...props}
    />
  );
}

export const ScrimPressIsIgnored: Story = {
  name: "A real press on the scrim does not close it, and pulses the panel",
  render: () => <Confirm defaultOpen />,
  play: async () => {
    const panel = await within(document.body).findByRole("alertdialog");
    await settled(panel);
    await expect(panel.getAnimations().length).toBe(0);
    await pressScrim(panel.parentElement as HTMLElement);
    await waitFor(() =>
      expect(panel.getAnimations().some((animation) => /alertNudge/.test((animation as CSSAnimation).animationName))).toBe(true),
    );
    await expect(within(document.body).getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const FocusStartsOnCancelAndLoops: Story = {
  name: "Focus starts on Cancel, loops with Tab, and returns to the trigger after a confirm",
  render: () => <Confirm />,
  play: async () => {
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const panel = await body.findByRole("alertdialog");
    await waitFor(() => expect(body.getByRole("button", { name: "Keep it" })).toHaveFocus());
    for (let press = 0; press < 6; press += 1) {
      await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    }
    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const PendingAnswerCannotBeLeftAndKeepsFocus: Story = {
  name: "While an answer is pending: Escape and real presses do nothing, focus stays on the button, and it closes on resolve",
  render: () => <Confirm onConfirm={pendingAnswer} />,
  play: async () => {
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    // Tab from Cancel to the confirm, and press it with the keyboard so focus is on it as it turns busy.
    await userEvent.tab();
    const confirm = body.getByRole("button", { name: "Delete" });
    await expect(confirm).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(panel).toHaveAttribute("aria-busy", "true"));
    // A native `disabled` would have dropped focus here; the button is aria-disabled and stays focused.
    await expect(confirm).toHaveFocus();
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}");
    await pressScrim(panel.parentElement as HTMLElement);
    await realClick(body.getByRole("button", { name: "Keep it" }));
    await realClick(confirm);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
    settle?.resolve();
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const RejectedAnswerStaysOpenAndCanBeRetried: Story = {
  name: "A rejected answer keeps the dialog open, stops it being busy, and can be answered again",
  render: () => {
    let attempts = 0;
    return (
      <Confirm
        defaultOpen
        onConfirm={() => {
          attempts += 1;
          return attempts === 1 ? pendingAnswer() : undefined;
        }}
        onConfirmError={() => undefined}
      />
    );
  },
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(panel).toHaveAttribute("aria-busy", "true"));
    settle?.reject(new Error("no"));
    await waitFor(() => expect(panel).not.toHaveAttribute("aria-busy"));
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};

export const RejectionWithNoHandlerIsNotSwallowed: Story = {
  name: "A rejection with no onConfirmError reaches the page as an unhandled rejection",
  render: () => <Confirm defaultOpen onConfirm={pendingAnswer} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const failure = new Error("not swallowed");
    let reported: unknown;
    // Registered in the capture phase so it runs first, and stops the event there so it is not also reported to
    // the test runner as a failure of its own.
    const onUnhandled = (event: PromiseRejectionEvent) => {
      reported = event.reason;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("unhandledrejection", onUnhandled, true);
    try {
      await userEvent.click(body.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(panel).toHaveAttribute("aria-busy", "true"));
      settle?.reject(failure);
      await waitFor(() => expect(reported).toBe(failure));
    } finally {
      window.removeEventListener("unhandledrejection", onUnhandled, true);
    }
    // and the dialog is still there, answerable
    await waitFor(() => expect(panel).not.toHaveAttribute("aria-busy"));
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const TypeToConfirmWithInsertedText: Story = {
  name: "Type-to-confirm: focus on the field, a whole string inserted at once enables it, Enter confirms",
  render: () => <Confirm defaultOpen requireText="Atlas project" />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const field = body.getByRole("textbox", { name: /Atlas project/ });
    await waitFor(() => expect(field).toHaveFocus());
    const confirm = body.getByRole("button", { name: "Delete" });
    await expect(confirm).toBeDisabled();
    // the text a phone keyboard, an autofill or a paste delivers: one `input` event, no key events
    await send("Input.insertText", { text: "Atlas project" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};

export const FooterStacksOnAPhone: Story = {
  name: "On a phone the buttons stack full width with the confirm on top",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Confirm defaultOpen />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const panel = await within(document.body).findByRole("alertdialog");
    await settled(panel);
    const confirm = within(panel).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(panel).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(confirm.top).toBeLessThan(cancel.top);
    await expect(Math.round(cancel.width)).toBe(Math.round(confirm.width));
  },
};

export const FooterIsARowFromSm: Story = {
  name: "From sm the buttons sit in a row, Cancel before the confirm",
  render: () => <Confirm defaultOpen />,
  play: async () => {
    const panel = await within(document.body).findByRole("alertdialog");
    await settled(panel);
    const confirm = within(panel).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(panel).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(Math.abs(confirm.top - cancel.top)).toBeLessThan(2);
    await expect(cancel.right).toBeLessThanOrEqual(confirm.left);
  },
};

export const MirroredInRightToLeft: Story = {
  name: "Right to left puts the icon at the start (the right) and the buttons mirrored",
  render: () => <Confirm defaultOpen dir="rtl" />,
  play: async () => {
    const panel = await within(document.body).findByRole("alertdialog");
    await settled(panel);
    const icon = panel.querySelector("[aria-hidden='true']") as HTMLElement;
    const title = within(panel).getByRole("heading").getBoundingClientRect();
    await expect(icon.getBoundingClientRect().left).toBeGreaterThan(title.left);
    const confirm = within(panel).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(panel).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(cancel.left).toBeGreaterThan(confirm.left);
  },
};

export const OverADialogStacksScrims: Story = {
  name: "Opened over a dialog: the confirmation's scrim is on top, and a real press on it reaches neither",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content data-testid="outer">
        <Dialog.Header>
          <Dialog.Title>Project settings</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Confirm />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    const outer = await body.findByRole("dialog", { name: "Project settings" });
    await settled(outer);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const outerScrim = outer.parentElement as HTMLElement;
    const panelScrim = panel.parentElement as HTMLElement;
    await expect(outerScrim).not.toBe(panelScrim);
    // painted later, so above it
    await expect(outerScrim.compareDocumentPosition(panelScrim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await pressScrim(panelScrim);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
    await expect(body.getByRole("dialog", { name: "Project settings", hidden: true })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(body.getByRole("dialog", { name: "Project settings" })).toBeInTheDocument());
  },
};

export const InitialFocusOnConfirm: Story = {
  name: "initialFocus=\"confirm\" lands on the confirm button; with a delay it falls back to Cancel, never to the page",
  render: () => (
    <>
      <Confirm trigger={<Button>Open plain</Button>} initialFocus="confirm" />
      <Confirm trigger={<Button>Open delayed</Button>} initialFocus="confirm" confirmDelay={60000} />
    </>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open plain" }));
    await body.findByRole("alertdialog");
    await waitFor(() => expect(body.getByRole("button", { name: "Delete" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await userEvent.click(body.getByRole("button", { name: "Open delayed" }));
    await body.findByRole("alertdialog");
    await waitFor(() => expect(body.getByRole("button", { name: "Keep it" })).toHaveFocus());
  },
};

export const WorkingIsAnnouncedInTheLiveRegion: Story = {
  name: "While an answer runs, the status region (in the page beforehand) says so, and the button keeps its label",
  render: () => <Confirm defaultOpen onConfirm={pendingAnswer} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const status = within(panel).getByRole("status");
    await expect(status.textContent).toBe("");
    const confirm = body.getByRole("button", { name: "Delete" });
    const before = confirm.getBoundingClientRect();
    await userEvent.click(confirm);
    await waitFor(() => expect(status.textContent).toBe("Working…"));
    // a spinner joins the label: the button grows by it, but the label itself did not change
    await expect(confirm.textContent).toBe("Delete");
    await expect(confirm.getBoundingClientRect().height).toBe(before.height);
    settle?.resolve();
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};

export const DelayLineDoesNotMoveThePanel: Story = {
  name: "When the delay ends only the words change: the panel and the buttons do not move or resize",
  render: () => <Confirm defaultOpen confirmDelay={900} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const confirm = body.getByRole("button", { name: "Delete" });
    await expect(confirm).toBeDisabled();
    const rect = (element: Element) => {
      const { top, left, width, height } = element.getBoundingClientRect();
      return [top, left, width, height].map(Math.round);
    };
    const before = { panel: rect(panel), confirm: rect(confirm), cancel: rect(body.getByRole("button", { name: "Keep it" })) };
    await waitFor(() => expect(confirm).toBeEnabled(), { timeout: 3000 });
    await expect(body.getByText("You can confirm now.")).toBeInTheDocument();
    await nextFrame();
    await expect(rect(panel)).toEqual(before.panel);
    await expect(rect(confirm)).toEqual(before.confirm);
    await expect(rect(body.getByRole("button", { name: "Keep it" }))).toEqual(before.cancel);
  },
};

let remembered = 0;
export const DontAskAgainIsRemembered: Story = {
  name: "Ticked and confirmed once, the next press answers with no dialog at all",
  render: () => {
    window.sessionStorage.removeItem("dbm-dismissed:check-remembered");
    remembered = 0;
    return (
      <Confirm
        dontAskAgain={{ key: "check-remembered", storage: "session" }}
        onConfirm={() => {
          remembered += 1;
        }}
      />
    );
  },
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await body.findByRole("alertdialog");
    await userEvent.click(body.getByRole("checkbox", { name: "Don’t ask me again" }));
    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await expect(remembered).toBe(1);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(remembered).toBe(2));
    await nextFrame();
    await expect(body.queryByRole("alertdialog")).toBeNull();
    window.sessionStorage.removeItem("dbm-dismissed:check-remembered");
  },
};

export const TabOrderAcrossTheWholeDialog: Story = {
  name: "Tab order across the dialog: field, checkbox, cancel, then confirm once it can be pressed, and back again",
  render: () => <Confirm defaultOpen requireText="Atlas" dontAskAgain={{ key: "check-tab-order", storage: "session" }} />,
  play: async () => {
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    const field = body.getByRole("textbox");
    const checkbox = body.getByRole("checkbox", { name: "Don’t ask me again" });
    const cancel = body.getByRole("button", { name: "Keep it" });
    const confirm = body.getByRole("button", { name: "Delete" });
    await waitFor(() => expect(field).toHaveFocus());
    // the confirm is disabled until the text matches, so the loop is field, checkbox, cancel
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await send("Input.insertText", { text: "Atlas" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab();
    await expect(confirm).toHaveFocus();
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(confirm).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(checkbox).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(field).toHaveFocus();
  },
};

export const DelayLineIsOneLineOnAPhone: Story = {
  name: "On a phone at the smallest size the delay line, at its longest, is one line, and the checkbox's label is a 24 by 24 target",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Confirm defaultOpen size="xs" confirmDelay={12000} dontAskAgain={{ key: "check-phone", storage: "session" }} />
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const body = within(document.body);
    const panel = await body.findByRole("alertdialog");
    await settled(panel);
    // the longest words it will say: two digits of seconds
    const line = body.getByText("You can confirm in 12 seconds.");
    const lineHeight = parseFloat(getComputedStyle(line).lineHeight);
    await expect(line.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1);
    // The box itself is the atom's 20px glyph; pressing its label does the same thing, and that label is the
    // equivalent control that has to clear 24 by 24 (WCAG 2.5.8). It sits beside the box, so a press anywhere on
    // the row toggles it.
    const checkbox = body.getByRole("checkbox", { name: "Don’t ask me again" });
    const label = document.querySelector(`label[for="${checkbox.id}"]`) as HTMLElement;
    const target = label.getBoundingClientRect();
    await expect(target.width).toBeGreaterThanOrEqual(24);
    await expect(target.height).toBeGreaterThanOrEqual(24);
    // pressing the middle of the label really does toggle the box
    await expect(checkbox).toHaveAttribute("aria-checked", "false");
    await realClick(label);
    await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "true"));
    // and the panel still fits the screen
    const rect = panel.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  },
};
