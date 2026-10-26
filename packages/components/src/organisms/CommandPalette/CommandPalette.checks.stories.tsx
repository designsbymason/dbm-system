import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { ConfirmDialog } from "../ConfirmDialog";
import { Dialog } from "../Dialog";
import { CommandPalette } from "./CommandPalette";
import type { CommandItem } from "./CommandPalette.types";
import { askingCommands, groupedCommands, manyCommands, sampleCommands, sampleModes } from "./CommandPaletteStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the real keyboard and pointer, the focus ring, forced
// colours, the window of a long list, and the hand-off of focus to another overlay. Hidden from the sidebar and the
// Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Navigation/CommandPalette/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const body = () => within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel and its scrim to finish first.
const settled = async (dialog: HTMLElement) => {
  await nextFrame();
  const running = [dialog, dialog.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const openFrom = async (name: string) => {
  await userEvent.click(body().getByRole("button", { name }));
  const dialog = await body().findByRole("dialog", { name: "Command palette" });
  await settled(dialog);
  return dialog;
};
// Leaves nothing open for the accessibility run that follows each story: a panel still easing out keeps the page
// behind it hidden from assistive technology, with its focusable content in it.
const closeWithEscape = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
};
const search = () => body().getByRole("combobox", { name: /^Search/ }) as HTMLInputElement;

// A real key and a real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
const CTRL = 2;
const pressCtrlK = async () => {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "k", code: "KeyK", windowsVirtualKeyCode: 75, modifiers: CTRL });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", windowsVirtualKeyCode: 75, modifiers: CTRL });
};
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

// `ctrl+k` rather than the default, so the check is the same on a Mac and elsewhere.
function Page({ commands = sampleCommands, ...props }: Partial<React.ComponentProps<typeof CommandPalette>>) {
  return (
    <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
      <Button>Outside</Button> <Input aria-label="Some field" />
      <CommandPalette hotkey="ctrl+k" trigger={<Button>Open</Button>} commands={commands} {...props} />
    </div>
  );
}

export const HotkeyWithARealKey: Story = {
  name: "Ctrl+K opens and closes it from the page, and from inside a text field",
  render: () => <Page />,
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Outside" }));
    await pressCtrlK();
    const dialog = await body().findByRole("dialog", { name: "Command palette" });
    await settled(dialog);
    await waitFor(() => expect(search()).toHaveFocus());
    // The same key closes it from the search field, which is a text field the page would otherwise keep it from.
    await pressCtrlK();
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    // And opens it from inside another text field.
    await userEvent.click(body().getByRole("textbox", { name: "Some field" }));
    await pressCtrlK();
    await body().findByRole("dialog", { name: "Command palette" });
    await closeWithEscape();
  },
};

export const PlacementAndSize: Story = {
  name: "Sits at the top at its size, and stays put as the results change",
  render: () => <Page commands={manyCommands(1000)} />,
  play: async () => {
    const dialog = await openFrom("Open");
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const before = dialog.getBoundingClientRect();
    // lg is 42rem (the dialog.max-width.lg token), and the panel is at the top, a fixed way down (space.16 from sm up).
    await expect(Math.round(before.width)).toBe(Math.round(42 * rem));
    await expect(Math.round(before.top)).toBe(Math.round(4 * rem));
    await expect(Math.abs(before.left + before.width / 2 - window.innerWidth / 2)).toBeLessThan(1);
    // it fits the viewport, with the list scrolling inside
    await expect(before.bottom).toBeLessThanOrEqual(window.innerHeight);
    // Narrowing the list does not move the top of the panel.
    await userEvent.type(search(), "Command 99");
    await nextFrame();
    const after = dialog.getBoundingClientRect();
    await expect(Math.round(after.top)).toBe(Math.round(before.top));
    await closeWithEscape();
  },
};

export const LongListIsWindowed: Story = {
  name: "A thousand commands draw only the rows in view, and the highlight stays in view",
  render: () => <Page commands={manyCommands(1000)} />,
  play: async () => {
    const dialog = await openFrom("Open");
    const list = body().getByRole("listbox");
    await expect(body().getAllByRole("option").length).toBeLessThan(80);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight * 5);
    // Up from the first wraps to the last: it has to be drawn and fully inside the box.
    await userEvent.keyboard("{ArrowUp}");
    const last = await waitFor(() => {
      const element = document.getElementById(search().getAttribute("aria-activedescendant") ?? "");
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    await expect(last).toHaveTextContent("Command 1000");
    await waitFor(() => {
      const row = last.getBoundingClientRect();
      const box = list.getBoundingClientRect();
      expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
    await userEvent.keyboard("{PageUp}{PageUp}");
    await waitFor(() => expect(document.getElementById(search().getAttribute("aria-activedescendant") ?? "")).not.toBeNull());
    await expect(dialog).toBeInTheDocument();
    await closeWithEscape();
  },
};

export const SearchRowFocusRing: Story = {
  name: "The search row draws its focus ring inside its own edge",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    await waitFor(() => expect(search()).toHaveFocus());
    const header = search().parentElement as HTMLElement;
    const style = getComputedStyle(header);
    await expect(style.outlineStyle).toBe("solid");
    await expect(parseFloat(style.outlineWidth)).toBe(2);
    await expect(parseFloat(style.outlineOffset)).toBe(-2);
    await expect(getComputedStyle(search()).outlineStyle).toBe("none");
    await closeWithEscape();
  },
};

export const TargetsAreBigEnough: Story = {
  name: "Every target is at least 24 by 24 pixels",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    for (const row of body().getAllByRole("option")) {
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
    await userEvent.click(body().getByRole("option", { name: /Change theme/ }));
    const back = body().getByRole("button", { name: "Back" });
    await expect(back.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    await expect(back.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await closeWithEscape();
  },
};

export const ChosenWithARealMouse: Story = {
  name: "A command chosen with a real mouse runs, and an open Dialog behind it stays open",
  render: () => {
    function Host() {
      const [ran, setRan] = useState("");
      const commands: CommandItem[] = [{ value: "go", label: "Go somewhere", onSelect: () => setRan("went") }];
      return (
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Host dialog">
            <Dialog.Body>
              <p data-testid="ran">{ran}</p>
              <CommandPalette hotkey="ctrl+k" trigger={<Button>Open</Button>} commands={commands} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
      );
    }
    return <Host />;
  },
  play: async () => {
    const dialog = await openFrom("Open");
    const row = body().getByRole("option", { name: /Go somewhere/ });
    // the row is the top element at its own point
    const rect = row.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await expect(row.contains(top)).toBe(true);
    await realClick(row);
    await waitFor(() => expect(body().getByTestId("ran")).toHaveTextContent("went"));
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Command palette" })).toBeNull());
    await expect(body().getByRole("dialog", { name: "Host dialog" })).toBeInTheDocument();
    await expect(dialog).not.toBeInTheDocument();
  },
};

export const HandsFocusToAnotherOverlay: Story = {
  name: "A command that opens a confirmation leaves focus in it, not back on the opener",
  render: () => {
    function Host() {
      const [confirming, setConfirming] = useState(false);
      return (
        <div style={{ padding: "var(--dbm-space-4)" }}>
          <CommandPalette
            hotkey="ctrl+k"
            trigger={<Button>Open</Button>}
            commands={[{ value: "delete", label: "Delete project", onSelect: () => setConfirming(true) }]}
          />
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            tone="danger"
            title="Delete project?"
            description="It cannot be undone."
            labels={{ confirm: "Delete", cancel: "Keep it" }}
          />
        </div>
      );
    }
    return <Host />;
  },
  play: async () => {
    await openFrom("Open");
    // Every element that takes focus from here on: the opener must not be one of them, even for a moment.
    const focused: Element[] = [];
    const record = (event: FocusEvent) => focused.push(event.target as Element);
    document.addEventListener("focusin", record);
    await userEvent.keyboard("{Enter}");
    const alert = await body().findByRole("alertdialog");
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Command palette" })).toBeNull());
    await nextFrame();
    await waitFor(() => expect(alert.contains(document.activeElement)).toBe(true));
    document.removeEventListener("focusin", record);
    await expect(focused.some((element) => element.textContent === "Open")).toBe(false);
    await userEvent.click(body().getByRole("button", { name: "Keep it" }));
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
  },
};

export const TextInsertedAllAtOnce: Story = {
  name: "Text inserted in one event, as a phone keyboard does, narrows the list",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    await send("Input.insertText", { text: "sett" });
    await waitFor(() => expect(body().getAllByRole("option")).toHaveLength(1));
    await expect(body().getByRole("option")).toHaveTextContent("Open settings");
    await closeWithEscape();
  },
};

export const ForcedColours: Story = {
  name: "In forced colours the sections keep their lines and the highlighted row an outline",
  render: () => <Page />,
  play: async () => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await openFrom("Open");
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.appendChild(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      const header = search().parentElement as HTMLElement;
      await expect(getComputedStyle(header).borderBottomColor).toBe(canvasText);
      const footer = body().getByText("Navigate").closest("div")?.parentElement as HTMLElement;
      await expect(getComputedStyle(footer).borderTopColor).toBe(canvasText);
      const highlighted = body().getAllByRole("option")[0] as HTMLElement;
      await expect(getComputedStyle(highlighted).outlineStyle).toBe("solid");
      await expect(parseFloat(getComputedStyle(highlighted).outlineWidth)).toBeGreaterThan(0);
    } finally {
      await emulate("none");
    }
    await closeWithEscape();
  },
};

export const RightToLeftLayout: Story = {
  name: "Right to left mirrors the hints and the marker of a list",
  render: () => <Page dir="rtl" />,
  play: async () => {
    const dialog = await openFrom("Open");
    await expect(getComputedStyle(dialog).direction).toBe("rtl");
    const hint = body().getByText("Navigate").getBoundingClientRect();
    const panel = dialog.getBoundingClientRect();
    // The first hint starts at the right-hand edge.
    await expect(panel.right - hint.right).toBeLessThan(hint.left - panel.left);
    const marker = body().getByRole("option", { name: /Change theme/ }).querySelector('[class*="chevron"]') as SVGElement;
    await expect(getComputedStyle(marker).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await closeWithEscape();
  },
};

export const OnAPhone: Story = {
  name: "On a phone the full-screen map fills the screen, with a close button",
  // Opened on its own, this story is shown at a phone's width (and it is in the test run).
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Page fullScreen={{ base: true, sm: false }} showCloseButton />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await openFrom("Open");
    const rect = dialog.getBoundingClientRect();
    await expect(Math.round(rect.width)).toBe(window.innerWidth);
    await expect(Math.round(rect.height)).toBe(window.innerHeight);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBe(0);
    await userEvent.click(body().getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

// A touch, dispatched from the page: Chrome's touch input through the DevTools Protocol is not reliable in the test
// browser, and what matters here is that a tap (touch pointer events, then the compatibility mouse events and a click)
// chooses a row without taking focus from the search field.
const tap = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const point = { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
  element.dispatchEvent(new PointerEvent("pointerdown", { ...point, pointerType: "touch", isPrimary: true }));
  const mouseDown = new MouseEvent("mousedown", point);
  element.dispatchEvent(mouseDown);
  element.dispatchEvent(new PointerEvent("pointerup", { ...point, pointerType: "touch", isPrimary: true }));
  element.dispatchEvent(new MouseEvent("mouseup", point));
  element.dispatchEvent(new MouseEvent("click", point));
  return { focusKept: mouseDown.defaultPrevented };
};

export const TapsOnAPhone: Story = {
  name: "On a phone a tap opens a list, goes back and runs a command, and keeps focus in the search field",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Page fullScreen={{ base: true, sm: false }} showCloseButton />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    await openFrom("Open");
    const first = tap(body().getByRole("option", { name: /Change theme/ }));
    await expect(first.focusKept).toBe(true);
    await body().findByRole("button", { name: "Back" });
    await expect(search()).toHaveFocus();
    tap(body().getByRole("button", { name: "Back" }));
    await waitFor(() => expect(body().queryByRole("button", { name: "Back" })).toBeNull());
    // A row that runs closes the palette, which gives the page back.
    tap(body().getByRole("option", { name: /New file/ }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

export const NestedSearchInTheBrowser: Story = {
  name: "A search finds a command inside a list, under its parent's heading, and a key press runs it",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    await userEvent.type(search(), "dark");
    const row = await body().findByRole("option", { name: /Dark/ });
    const group = row.closest('[role="group"]') as HTMLElement;
    await expect(group).toHaveAttribute("aria-labelledby");
    await expect(document.getElementById(group.getAttribute("aria-labelledby") ?? "")).toHaveTextContent("Change theme");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

const pressArrowRight = async () => {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
};
const pressEnterKey = async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
};

export const ArgumentWithRealKeys: Story = {
  name: "The forward arrow asks for a value, and Enter runs it with the text",
  render: () => {
    function Host() {
      const [ran, setRan] = useState("");
      return (
        <div style={{ padding: "var(--dbm-space-4)" }}>
          <p data-testid="ran">{ran}</p>
          <CommandPalette
            hotkey="ctrl+k"
            trigger={<Button>Open</Button>}
            commands={askingCommands}
            onSelect={(item, details) => setRan(`${item.value}:${details.argument ?? ""}`)}
          />
        </div>
      );
    }
    return <Host />;
  },
  play: async () => {
    await openFrom("Open");
    await userEvent.type(search(), "rename");
    await pressArrowRight();
    await body().findByRole("button", { name: "Back" });
    await waitFor(() => expect(search()).toHaveValue("untitled"));
    await expect(search()).toHaveAttribute("placeholder", "New file name…");
    await userEvent.clear(search());
    await userEvent.type(search(), "report");
    await waitFor(() => expect(body().getByRole("option")).toHaveTextContent("Run with “report”"));
    await pressEnterKey();
    await waitFor(() => expect(body().getByTestId("ran")).toHaveTextContent("rename:report"));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

export const ModesWithTypedPrefix: Story = {
  name: "A typed prefix switches to a mode's commands and deleting it switches back",
  render: () => <Page modes={sampleModes} />,
  play: async () => {
    await openFrom("Open");
    // The footer says which prefixes there are.
    await expect(body().getByText("Actions")).toBeVisible();
    await userEvent.type(search(), "@gr");
    await waitFor(() => expect(body().getAllByRole("option")).toHaveLength(1));
    await expect(body().getByRole("option")).toHaveTextContent("Grace Hopper");
    await expect(search()).toHaveAttribute("placeholder", "Find a person…");
    await userEvent.clear(search());
    await waitFor(() => expect(body().getByRole("option", { name: /New file/ })).toBeInTheDocument());
    await closeWithEscape();
  },
};

export const CappedGroupsAndTheEnterKey: Story = {
  name: "A capped group's row is as tall as any, is reached with the keys, and the highlighted row shows Enter",
  render: () => <Page commands={groupedCommands} maxPerGroup={2} />,
  play: async () => {
    await openFrom("Open");
    const rows = body().getAllByRole("option");
    const more = body().getAllByRole("option", { name: /Show 4 more/ });
    await expect(more).toHaveLength(3);
    await expect(Math.round(more[0]!.getBoundingClientRect().height)).toBe(Math.round(rows[0]!.getBoundingClientRect().height));
    // Enter is drawn on the highlighted row, and nowhere else (every other row only keeps its room).
    const hints = [...document.querySelectorAll('[class*="enterHint"]')].filter((hint) => getComputedStyle(hint).visibility !== "hidden");
    await expect(hints).toHaveLength(1);
    await expect(hints[0]!.getBoundingClientRect().width).toBeGreaterThan(0);
    await expect(rows[0]!.contains(hints[0] as Element)).toBe(true);
    // Down twice reaches the first "Show more", Enter shows the rest of that group and highlights the first new row.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await waitFor(() => expect(body().getAllByRole("option", { name: /Show 4 more/ })).toHaveLength(2));
    await expect(document.getElementById(search().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("File command 3");
    await closeWithEscape();
  },
};

export const ModifierKeysForThePlatform: Story = {
  name: "A shortcut written with mod is drawn as the platform's key",
  render: () => <Page commands={[{ value: "n", label: "New", shortcut: ["mod", "N"] }]} />,
  play: async () => {
    await openFrom("Open");
    const first = body().getByRole("option", { name: /New/ }).querySelector("kbd") as HTMLElement;
    await expect(["⌘", "Ctrl"]).toContain(first.textContent);
    if (first.textContent === "⌘") await expect(first).toHaveAttribute("aria-label", "Command");
    await closeWithEscape();
  },
};

async function realMove(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

export const KeysWinOverAPointerAtRest: Story = {
  name: "A pointer resting on the list does not take the highlight back from the arrow keys",
  render: () => <Page commands={manyCommands(1000)} />,
  play: async () => {
    await openFrom("Open");
    const rows = body().getAllByRole("option");
    // The pointer comes to rest on the seventh row, which it highlights; the keys then carry the highlight twenty rows
    // further, scrolling the list so other rows arrive under the resting pointer.
    await realMove(rows[6] as Element);
    const active = () => document.getElementById(search().getAttribute("aria-activedescendant") ?? "");
    await waitFor(() => expect(active()).toHaveTextContent("Command 7"));
    await userEvent.keyboard("{ArrowDown}".repeat(20));
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(active()).toHaveTextContent("Command 27");
    // And it stays there while the pointer stays still.
    await userEvent.keyboard("{ArrowDown}");
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(active()).toHaveTextContent("Command 28");
    await closeWithEscape();
  },
};

export const LabelsKeepTheirWidth: Story = {
  name: "A row's label is the same width whether or not the highlight is on it",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    const labelWidth = (row: HTMLElement) => (row.querySelector('[class*="optionText"]') as HTMLElement).getBoundingClientRect().width;
    const rows = () => body().getAllByRole("option").filter((row) => !row.hasAttribute("aria-disabled"));
    const before = rows().map(labelWidth);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    const after = rows().map(labelWidth);
    await expect(after).toHaveLength(before.length);
    after.forEach((width, index) => expect(Math.abs(width - (before[index] as number))).toBeLessThan(0.5));
    await closeWithEscape();
  },
};

export const KeywordHintContrast: Story = {
  name: "The keyword a row was found through is readable on the highlighted row",
  render: () => <Page />,
  play: async () => {
    await openFrom("Open");
    await userEvent.type(search(), "prefer");
    const row = (await body().findByRole("option", { name: /Open settings/ })) as HTMLElement;
    const hint = row.querySelector('[class*="matchHint"]') as HTMLElement;
    await expect(row).toHaveAttribute("data-highlighted");
    const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (color: string) => {
      const [r, g, b] = channels(color).map((value) => {
        const unit = value / 255;
        return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
      }) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [lighter, darker] = [luminance(getComputedStyle(hint).color), luminance(getComputedStyle(row).backgroundColor)].sort((a, b) => b - a) as [number, number];
    await expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(4.5);
    await closeWithEscape();
  },
};

export const TabOrderInTheBrowser: Story = {
  name: "Tab goes from the search field to the close button and back, and never into a row",
  render: () => <Page showCloseButton />,
  play: async () => {
    await openFrom("Open");
    await waitFor(() => expect(search()).toHaveFocus());
    await userEvent.tab();
    await expect(body().getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.tab();
    await expect(search()).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(body().getByRole("button", { name: "Close" })).toHaveFocus();
    await expect(body().getAllByRole("option").includes(document.activeElement as HTMLElement)).toBe(false);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

export const KeyHintsLeaveDevicesWithoutAMouse: Story = {
  name: "Key hints and a row's shortcut keys are drawn with a fine pointer, and the stylesheet drops them without one",
  render: () => <Page commands={[{ value: "n", label: "New", shortcut: ["Ctrl", "N"] }]} />,
  play: async () => {
    await openFrom("Open");
    // The test browser has a mouse, so everything is drawn.
    await expect(matchMedia("(any-pointer: fine)").matches).toBe(true);
    const shortcut = body().getByRole("option", { name: /New/ }).querySelector('[class*="shortcutKey"]') as HTMLElement;
    await expect(getComputedStyle(shortcut).display).not.toBe("none");
    await expect(getComputedStyle(document.querySelector('[class*="hints"]') as HTMLElement).display).not.toBe("none");
    // The rule for a device without one is in the loaded stylesheet and names all three.
    const readable = (sheet: CSSStyleSheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        // A stylesheet from another origin can't be read, and isn't one of ours.
        return [];
      }
    };
    const rule = [...document.styleSheets]
      .flatMap(readable)
      .find((candidate) => candidate instanceof CSSMediaRule && candidate.conditionText.includes("any-pointer: coarse") && candidate.conditionText.includes("not (any-pointer: fine)")) as CSSMediaRule | undefined;
    await expect(rule).toBeDefined();
    const text = rule?.cssText ?? "";
    for (const name of ["hints", "enterHint", "shortcutKey"]) await expect(text).toContain(name);
    await expect(text).toContain("display: none");
    await closeWithEscape();
  },
};
