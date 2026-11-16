import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { AlertDialog } from "./AlertDialog";

// Real-browser checks for what jsdom can't evaluate: layout, a real mouse, the breakpoint, computed colour from the
// cascade. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/AlertDialog/Checks",
  id: "organisms-overlay-alertdialog-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel and its scrim to finish first.
const settled = async (alert: HTMLElement) => {
  await nextFrame();
  const running = [alert, alert.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
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

function Delete({
  tone = "danger",
  busy = false,
  dir,
  defaultOpen = true,
}: {
  tone?: "neutral" | "info" | "warning" | "danger";
  busy?: boolean;
  dir?: "ltr" | "rtl";
  defaultOpen?: boolean;
}) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialog.Trigger asChild>
        <Button>Open</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content tone={tone} busy={busy} dir={dir} data-testid="panel">
        <AlertDialog.Header data-testid="header">
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer data-testid="footer">
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

export const ScrimPressIsIgnored: Story = {
  name: "A real press on the scrim does not close it",
  render: () => <Delete />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    await pressScrim(alert.parentElement as HTMLElement);
    await nextFrame();
    await expect(within(document.body).getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const ScrimPressPulsesThePanel: Story = {
  name: "A real press on the scrim pulses the panel, and a reduced-motion rule exists",
  render: () => <Delete />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    await expect(alert.getAnimations().length).toBe(0);
    await pressScrim(alert.parentElement as HTMLElement);
    await waitFor(() =>
      expect(alert.getAnimations().some((animation) => (animation as CSSAnimation).animationName.startsWith("_alertNudge") || /alertNudge/.test((animation as CSSAnimation).animationName))).toBe(true),
    );
    // jsdom can't evaluate the media query and a story can't switch it on, so prove the rule from the stylesheet
    const rules: CSSMediaRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) if (rule instanceof CSSMediaRule) rules.push(rule);
      } catch {
        // a cross-origin sheet can't be read; none of ours is one
      }
    }
    const reduced = rules.find(
      (rule) => rule.conditionText.includes("prefers-reduced-motion: reduce") && /alertFlash/.test(rule.cssText),
    );
    await expect(reduced).toBeDefined();
    // under forced colours a border's colour is replaced by a system one, so the flash is an outline there
    const forced = rules.find(
      (rule) =>
        rule.conditionText.includes("forced-colors: active") &&
        rule.conditionText.includes("prefers-reduced-motion: reduce") &&
        /alertOutline/.test(rule.cssText),
    );
    await expect(forced).toBeDefined();
  },
};

export const ReopenedAlertEntersAgain: Story = {
  name: "After a pulse and a close, the reopened alert runs its entrance, not the pulse",
  render: () => <Delete defaultOpen={false} />,
  play: async () => {
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    let alert = await body.findByRole("alertdialog");
    await settled(alert);
    await pressScrim(alert.parentElement as HTMLElement);
    await waitFor(() =>
      expect(alert.getAnimations().some((animation) => /alertNudge/.test((animation as CSSAnimation).animationName))).toBe(true),
    );
    await userEvent.click(body.getByRole("button", { name: "Keep it" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    alert = await body.findByRole("alertdialog");
    const names = alert.getAnimations().map((animation) => (animation as CSSAnimation).animationName);
    await expect(names.some((name) => /alertNudge/.test(name))).toBe(false);
    await expect(names.some((name) => /dialogIn/.test(name))).toBe(true);
  },
};

export const EscapeThatCannotCloseNudges: Story = {
  name: "A real Escape on an alert that can't close pulses it and leaves it open",
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content closeOnEscape={false}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(alert.getAnimations().some((animation) => /alertNudge/.test((animation as CSSAnimation).animationName))).toBe(true),
    );
    await expect(within(document.body).getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const TypeToConfirmFlow: Story = {
  name: "Type-to-confirm: focus lands on the field and the action waits for the name",
  render: () => {
    function Flow() {
      const [typed, setTyped] = useState("");
      const field = useRef<HTMLInputElement>(null);
      return (
        <AlertDialog defaultOpen>
          <AlertDialog.Content tone="danger" initialFocus={field}>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete Atlas?</AlertDialog.Title>
              <AlertDialog.Description>Type its name to confirm.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <input ref={field} aria-label="Project name" value={typed} onChange={(event) => setTyped(event.target.value)} />
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
              <AlertDialog.Action disabled={typed !== "Atlas"}>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      );
    }
    return <Flow />;
  },
  play: async () => {
    const body = within(document.body);
    const field = await body.findByRole("textbox", { name: "Project name" });
    await waitFor(() => expect(field).toHaveFocus());
    const action = body.getByRole("button", { name: "Delete" });
    await expect(action).toBeDisabled();
    await userEvent.type(field, "Atl");
    await expect(action).toBeDisabled();
    await userEvent.type(field, "as");
    await waitFor(() => expect(action).toBeEnabled());
  },
};

export const FocusStartsOnCancelAndLoops: Story = {
  name: "Focus starts on Cancel, loops with Tab, and returns to the trigger",
  render: () => <Delete defaultOpen={false} />,
  play: async () => {
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const alert = await body.findByRole("alertdialog");
    await waitFor(() => expect(body.getByRole("button", { name: "Keep it" })).toHaveFocus());
    for (let press = 0; press < 6; press += 1) {
      await userEvent.tab();
      await expect(alert.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const FooterStacksOnAPhone: Story = {
  name: "On a phone the buttons stack full width with the action on top",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Delete />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const footer = within(alert).getByTestId("footer").getBoundingClientRect();
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(action.top).toBeLessThan(cancel.top);
    // each fills the footer's content width (its padding is the panel's, 24px a side)
    await expect(Math.round(action.width)).toBe(Math.round(footer.width - 48));
    await expect(Math.round(cancel.width)).toBe(Math.round(action.width));
  },
};

export const FooterIsARowFromSm: Story = {
  name: "From sm the buttons sit in a row, Cancel before Action",
  render: () => <Delete />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(Math.abs(action.top - cancel.top)).toBeLessThan(2);
    await expect(cancel.right).toBeLessThanOrEqual(action.left);
  },
};

export const IconAtTheStartInRightToLeft: Story = {
  name: "Right to left puts the icon at the start (the right) and the actions mirrored",
  render: () => <Delete dir="rtl" />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const medallion = alert.querySelector("[aria-hidden='true']") as HTMLElement;
    const title = within(alert).getByRole("heading").getBoundingClientRect();
    await expect(medallion.getBoundingClientRect().left).toBeGreaterThan(title.left);
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    // in rtl the first button in the DOM sits to the right
    await expect(cancel.left).toBeGreaterThan(action.left);
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

export const ToneIconContrast: Story = {
  name: "Each tone's icon clears 3:1 against its disc, in all four themes",
  render: () => (
    <>
      {(["neutral", "info", "warning", "danger"] as const).map((tone) => (
        <Delete key={tone} tone={tone} defaultOpen={false} />
      ))}
    </>
  ),
  play: async () => {
    // Open each in turn and read the icon colour against the disc the stylesheet draws behind it.
    const body = within(document.body);
    const results: Record<string, number> = {};
    for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
      document.documentElement.dataset.theme = theme;
      for (const [index, tone] of (["neutral", "info", "warning", "danger"] as const).entries()) {
        await userEvent.click(body.getAllByRole("button", { name: "Open" })[index] as HTMLElement);
        const alert = await body.findByRole("alertdialog");
        await settled(alert);
        const disc = alert.querySelector("[aria-hidden='true']") as HTMLElement;
        const glyph = disc.querySelector("svg") as SVGElement;
        results[`${theme}/${tone}`] = ratio(parse(getComputedStyle(disc).backgroundColor), parse(getComputedStyle(glyph).color));
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
      }
    }
    for (const [name, value] of Object.entries(results)) {
      await expect(value, name).toBeGreaterThanOrEqual(3);
    }
  },
};

export const BusyAlertCannotBeLeft: Story = {
  name: "A busy alert ignores Escape and real presses, and its buttons stay focusable",
  render: () => <Delete busy />,
  play: async () => {
    const body = within(document.body);
    const alert = await body.findByRole("alertdialog");
    await settled(alert);
    const cancel = body.getByRole("button", { name: "Keep it" });
    await expect(cancel).toHaveAttribute("aria-disabled", "true");
    cancel.focus();
    await expect(cancel).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await pressScrim(alert.parentElement as HTMLElement);
    await realClick(body.getByRole("button", { name: "Delete" }));
    await realClick(cancel);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const OverADialogStacksScrims: Story = {
  name: "Opened over a dialog: two scrims, the alert's on top, and the dialog stays legible",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content data-testid="outer">
        <Dialog.Header>
          <Dialog.Title>Project settings</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Delete defaultOpen={false} />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    const outer = await body.findByRole("dialog", { name: "Project settings" });
    await settled(outer);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    const alert = await body.findByRole("alertdialog");
    await settled(alert);
    const outerScrim = outer.parentElement as HTMLElement;
    const alertScrim = alert.parentElement as HTMLElement;
    await expect(outerScrim).not.toBe(alertScrim);
    await expect(Number(getComputedStyle(alertScrim).zIndex)).toBeGreaterThanOrEqual(
      Number(getComputedStyle(outerScrim).zIndex),
    );
    // painted later, so above it
    await expect(outerScrim.compareDocumentPosition(alertScrim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // the dialog behind sits under the alert's scrim (black at 60%): its text and surface, both dimmed alike,
    // keep a legible ratio. An inactive layer is exempt from contrast, so this is for legibility, not conformance.
    const style = getComputedStyle(outer);
    const dim = (colour: number[]) => colour.map((value) => value * 0.4);
    await expect(ratio(dim(parse(style.color)), dim(parse(style.backgroundColor)))).toBeGreaterThanOrEqual(3);
    // a real press on the alert's scrim reaches neither
    await pressScrim(alertScrim);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    // the dialog behind is exposed again once the alert has gone (its `aria-hidden` is removed with the panel)
    await waitFor(() => expect(body.getByRole("dialog", { name: "Project settings" })).toBeInTheDocument());
  },
};
