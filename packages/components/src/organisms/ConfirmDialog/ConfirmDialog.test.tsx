import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrashIcon } from "@dbm-system/icons";
import { Button } from "../../atoms/Button";
import { Dialog } from "../Dialog";
import { DirectionProvider } from "../../atoms/DirectionProvider";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = Partial<ComponentProps<typeof ConfirmDialog>>;

function Basic(props: Props) {
  return (
    <ConfirmDialog
      trigger={<Button>Open</Button>}
      title="Delete project?"
      description="This removes it for good."
      labels={{ confirm: "Delete", cancel: "Keep it" }}
      {...props}
    />
  );
}

// A promise the test settles by hand, so "pending" can be looked at.
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConfirmDialog", () => {
  it("renders only the trigger while closed", () => {
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as a named, described, modal alertdialog with no warning", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete project?" });
    expect(dialog).toHaveAccessibleDescription("This removes it for good.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once in development when nothing can open it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ConfirmDialog title="Nothing opens me" />);
    expect(warn.mock.calls.filter(([message]) => String(message).includes("nothing can open it"))).toHaveLength(1);
  });

  it("does not warn when it is controlled closed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ConfirmDialog title="Controlled" open={false} />);
    expect(warn).not.toHaveBeenCalled();
  });

  describe("words", () => {
    it("uses English defaults for the buttons", async () => {
      render(<ConfirmDialog defaultOpen title="Sure?" description="Really." />);
      expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("keeps a default whose label is passed as undefined", async () => {
      render(<ConfirmDialog defaultOpen title="Sure?" description="Really." labels={{ confirm: undefined, cancel: "Back" }} />);
      expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    });
  });

  describe("answering", () => {
    it("closes on confirm, calling onConfirm once and reporting the reason", async () => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onOpenChange={onOpenChange} onCancel={onCancel} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "action" });
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("reports the trigger as the reason it opened", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
    });

    it("closes on cancel and calls onCancel, not onConfirm", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onCancel={onCancel} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "cancel" });
    });

    it("answers Escape as a cancel", async () => {
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onCancel={onCancel} onOpenChange={onOpenChange} defaultOpen />);
      await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
    });

    it("ignores Escape when closeOnEscape is off", async () => {
      const user = userEvent.setup();
      render(<Basic closeOnEscape={false} defaultOpen />);
      await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("does not close on a press on the scrim", async () => {
      const user = userEvent.setup();
      render(<Basic defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      await user.click(dialog.parentElement as HTMLElement);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("a promise from onConfirm", () => {
    it("stays open and busy until it resolves, then closes with the reason action", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={() => pending.promise} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-busy", "true");
      expect(onOpenChange).not.toHaveBeenCalled();
      // the button keeps its name and stays focusable, with a spinner drawn in it
      const confirm = screen.getByRole("button", { name: "Delete" });
      expect(confirm).toHaveAttribute("aria-disabled", "true");
      expect(confirm).not.toBeDisabled();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
    });

    it("ignores a second press, Escape and cancel while it is pending", async () => {
      const pending = deferred();
      const onConfirm = vi.fn(() => pending.promise);
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onCancel={onCancel} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await user.keyboard("{Escape}");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("stays open and stops being busy when it rejects, reporting the error", async () => {
      const failure = new Error("network down");
      const pending = deferred();
      const onConfirmError = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Basic onConfirm={() => pending.promise} onConfirmError={onConfirmError} onOpenChange={onOpenChange} defaultOpen />,
      );
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
      await act(async () => pending.reject(failure));
      await waitFor(() => expect(screen.getByRole("alertdialog")).not.toHaveAttribute("aria-busy"));
      expect(onConfirmError).toHaveBeenCalledWith(failure);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      // and it can be answered again
      expect(screen.getByRole("button", { name: "Delete" })).not.toHaveAttribute("aria-disabled");
    });

    it("can be confirmed again after a failure", async () => {
      const first = deferred();
      const onConfirm = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(undefined);
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onConfirmError={() => undefined} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await act(async () => first.reject(new Error("no")));
      await waitFor(() => expect(screen.getByRole("alertdialog")).not.toHaveAttribute("aria-busy"));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });

    it("leaves a controlled dialog open until the owner closes it, after reporting the reason", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic open onConfirm={() => pending.promise} onOpenChange={onOpenChange} />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await act(async () => pending.resolve());
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("sets no state and reports nothing once it has unmounted", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const user = userEvent.setup();
      const { unmount } = render(<Basic onConfirm={() => pending.promise} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      unmount();
      await act(async () => pending.resolve());
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it("works in StrictMode", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Basic onConfirm={() => pending.promise} defaultOpen />
        </StrictMode>,
      );
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });
  });

  describe("busy", () => {
    it("marks the dialog busy and blocks Escape, cancel and confirm", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic busy onConfirm={onConfirm} onCancel={onCancel} defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-busy", "true");
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("focus", () => {
    it("starts on cancel, and returns to the trigger on close", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      await waitFor(() => expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("lets initialFocus choose the element", async () => {
      const target = createRef<HTMLButtonElement>();
      render(
        <ConfirmDialog
          defaultOpen
          title="Sure?"
          description="Really."
          initialFocus={target}
          // a child the ref can point at
        >
          <button type="button" ref={target}>
            Chosen
          </button>
        </ConfirmDialog>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Chosen" })).toHaveFocus());
    });
  });

  describe("requireText", () => {
    it("adds a labelled field that takes focus, and keeps confirm disabled until it matches", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={onConfirm} defaultOpen />);
      const field = await screen.findByRole("textbox", { name: "Type “Atlas” to confirm" });
      await waitFor(() => expect(field).toHaveFocus());
      const confirm = screen.getByRole("button", { name: "Delete" });
      expect(confirm).toBeDisabled();
      await user.type(field, "atlas");
      expect(confirm).toBeDisabled();
      await user.clear(field);
      await user.type(field, "Atlas");
      expect(confirm).toBeEnabled();
      await user.click(confirm);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("ignores spaces at either end of what is typed", async () => {
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" defaultOpen />);
      await user.type(await screen.findByRole("textbox"), "  Atlas ");
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("confirms on Enter once it matches, and not before", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={onConfirm} defaultOpen />);
      const field = await screen.findByRole("textbox");
      await user.type(field, "Atl{Enter}");
      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      await user.type(field, "as{Enter}");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("holds the field read-only, not disabled, while an answer is pending", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={() => pending.promise} defaultOpen />);
      const field = await screen.findByRole("textbox");
      await user.type(field, "Atlas{Enter}");
      expect(field).toHaveAttribute("readonly");
      expect(field).not.toBeDisabled();
      expect(field).toHaveFocus();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("starts empty every time it opens", async () => {
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.type(await screen.findByRole("textbox"), "Atl");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox")).toHaveValue("");
    });

    it("draws no field for an empty string", async () => {
      render(<Basic requireText="" defaultOpen />);
      await screen.findByRole("alertdialog");
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("uses the label function from labels", async () => {
      render(<Basic requireText="Atlas" labels={{ requireText: (text) => `Écrivez ${text}` }} defaultOpen />);
      expect(await screen.findByRole("textbox", { name: "Écrivez Atlas" })).toBeInTheDocument();
    });

    it("starts focus on the field, not cancel, even though cancel is the safe choice", async () => {
      render(<Basic requireText="Atlas" defaultOpen />);
      const field = await screen.findByRole("textbox");
      await waitFor(() => expect(field).toHaveFocus());
      expect(screen.getByRole("button", { name: "Keep it" })).not.toHaveFocus();
    });
  });

  describe("content and the standard props", () => {
    it("draws children between the description and the buttons", async () => {
      render(
        <Basic defaultOpen>
          <p>Three files are affected.</p>
        </Basic>,
      );
      expect(await screen.findByText("Three files are affected.")).toBeInTheDocument();
    });

    it("forwards the ref and the standard props to the panel", async () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Basic ref={ref} id="confirm" className="mine" style={{ color: "red" }} data-testid="panel" defaultOpen />,
      );
      const dialog = await screen.findByRole("alertdialog");
      expect(ref.current).toBe(dialog);
      expect(dialog).toHaveAttribute("id", "confirm");
      expect(dialog).toHaveAttribute("data-testid", "panel");
      expect(dialog).toHaveClass("mine");
      expect(dialog).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });

    it("cannot have its role, modality or state replaced by a prop", async () => {
      const hostile = { role: "dialog", "aria-modal": "false", "data-state": "closed" } as unknown as Props;
      render(<Basic {...hostile} defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("data-state", "open");
    });

    it("shows each tone's icon, and none for icon={false}", async () => {
      const { rerender } = render(<Basic tone="danger" defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog.querySelector("svg")).not.toBeNull();
      rerender(<Basic tone="danger" icon={false} defaultOpen />);
      expect(screen.getByRole("alertdialog").querySelector("svg")).toBeNull();
    });

    it("makes the confirm destructive for the danger tone", async () => {
      const { rerender } = render(<Basic tone="danger" defaultOpen />);
      const danger = (await screen.findByRole("button", { name: "Delete" })).className;
      rerender(<Basic tone="neutral" defaultOpen />);
      const neutral = screen.getByRole("button", { name: "Delete" }).className;
      expect(danger).toContain("variantDestructive");
      expect(neutral).toContain("variantPrimary");
    });
  });

  describe("controlled", () => {
    it("follows the open prop and reports changes without changing itself", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Basic open={false} onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      rerender(<Basic open onOpenChange={onOpenChange} />);
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("over a dialog", () => {
    it("answers Escape on the confirmation first, leaving the dialog open", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Settings</Dialog.Title>
            </Dialog.Header>
            <Dialog.Footer>
              <ConfirmDialog
                trigger={<Button variant="destructive">Delete project</Button>}
                tone="danger"
                title="Delete project?"
                description="It cannot be undone."
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(await screen.findByRole("button", { name: "Delete project" }));
      await screen.findByRole("alertdialog", { name: "Delete project?" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    });
  });

  describe("titleSize", () => {
    it("draws the title at the size given, and keeps it a second-level heading", async () => {
      const { unmount } = render(<Basic defaultOpen />);
      const normal = (await screen.findByRole("heading", { name: "Delete project?" })).className;
      unmount();
      render(<Basic titleSize="3xl" defaultOpen />);
      const heading = await screen.findByRole("heading", { name: "Delete project?", level: 2 });
      expect(heading.className).not.toBe(normal);
      expect(heading.className).toContain("size3xl");
    });
  });

  describe("announcing", () => {
    it("has a status region in the page before anything is announced", async () => {
      render(<Basic defaultOpen />);
      const status = await screen.findByRole("status");
      expect(status).toBeEmptyDOMElement();
    });

    it("announces that it is working, in the words given", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic labels={{ confirm: "Delete", working: "Deleting the project…" }} onConfirm={() => pending.promise} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Deleting the project…"));
      await act(async () => pending.resolve());
    });

    it("announces a failure while the dialog stays open", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic onConfirm={() => pending.promise} onConfirmError={() => undefined} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await act(async () => pending.reject(new Error("no")));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("That didn’t work. You can try again."));
    });

    it("keeps the button's label while it works, so it does not change width", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic onConfirm={() => pending.promise} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(screen.getByRole("button", { name: "Delete" })).toHaveTextContent(/^Delete$/);
      await act(async () => pending.resolve());
    });
  });

  describe("initialFocus", () => {
    it('"confirm" focuses the confirm button', async () => {
      render(<Basic initialFocus="confirm" defaultOpen />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus());
    });

    it('"cancel" focuses cancel even with a field to type in', async () => {
      render(<Basic initialFocus="cancel" requireText="Atlas" defaultOpen />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus());
    });

    it('"confirm" falls back to the field when text is required', async () => {
      render(<Basic initialFocus="confirm" requireText="Atlas" defaultOpen />);
      await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
    });

    it('"confirm" falls back to cancel while a delay holds the button back', async () => {
      render(<Basic initialFocus="confirm" confirmDelay={5000} defaultOpen />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus());
    });
  });

  describe("confirmProps and cancelProps", () => {
    it("lets a variant replace the one the tone chose", async () => {
      render(<Basic tone="danger" confirmProps={{ variant: "primary" }} cancelProps={{ variant: "ghost" }} defaultOpen />);
      const confirm = await screen.findByRole("button", { name: "Delete" });
      expect(confirm.className).toContain("variantPrimary");
      expect(screen.getByRole("button", { name: "Keep it" }).className).toContain("variantGhost");
    });

    it("can add an icon and a test id to the confirm button", async () => {
      render(<Basic confirmProps={{ leadingIcon: TrashIcon, "data-testid": "confirm" }} defaultOpen />);
      const confirm = await screen.findByTestId("confirm");
      expect(confirm.querySelector("svg")).not.toBeNull();
    });

    it("cannot replace what the dialog owns: the click, the label or disabled", async () => {
      const onConfirm = vi.fn();
      const hostile = { onClick: vi.fn(), children: "Nope", disabled: true } as unknown as Props["confirmProps"];
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} confirmProps={hostile} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("dontAskAgain", () => {
    const key = (name: string) => `test-${name}`;
    afterEach(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    it("adds a labelled checkbox, unticked", async () => {
      render(<Basic dontAskAgain={{ key: key("box") }} defaultOpen />);
      const box = await screen.findByRole("checkbox", { name: "Don’t ask me again" });
      expect(box).not.toBeChecked();
    });

    it("asks again when the box was left unticked", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: key("unticked") }} onConfirm={onConfirm} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("answers at once, with no dialog, once it was ticked and confirmed", async () => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: key("ticked") }} onConfirm={onConfirm} onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onConfirm).toHaveBeenCalledTimes(1);
      onOpenChange.mockClear();
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onConfirm).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("remembers only after a promise resolves, not when it rejects", async () => {
      const first = deferred();
      const onConfirm = vi.fn().mockReturnValueOnce(first.promise);
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: key("rejects") }} onConfirm={onConfirm} onConfirmError={() => undefined} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await act(async () => first.reject(new Error("no")));
      await waitFor(() => expect(screen.getByRole("alertdialog")).not.toHaveAttribute("aria-busy"));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });

    it("runs a remembered promise once, and a second press while it runs is ignored", async () => {
      window.localStorage.setItem("dbm-dismissed:test-remembered", "0");
      const pending = deferred();
      const onConfirm = vi.fn(() => pending.promise);
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: key("remembered") }} onConfirm={onConfirm} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await act(async () => pending.resolve());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onConfirm).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("answers a remembered confirmation that was asked to be open, and reports it closed", async () => {
      window.localStorage.setItem("dbm-dismissed:test-controlled", "0");
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      render(<Basic open dontAskAgain={{ key: key("controlled") }} onConfirm={onConfirm} onOpenChange={onOpenChange} />);
      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("forgets after expiresAfter has passed", async () => {
      window.localStorage.setItem("dbm-dismissed:test-expired", String(Date.now() - 1000));
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: key("expired"), expiresAfter: 1000 }} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });

    it("draws no checkbox without the prop", async () => {
      render(<Basic defaultOpen />);
      await screen.findByRole("alertdialog");
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("remembering in the middle of an opening", () => {
    afterEach(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // An owner that closes the dialog a little later than the answer: a transition, a store, a route change.
    function SlowOwner({ onConfirm }: { onConfirm: () => void }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <ConfirmDialog
            open={open}
            onOpenChange={(next) => {
              if (next) setOpen(true);
              else setTimeout(() => setOpen(false), 50);
            }}
            title="Sure?"
            description="Really."
            labels={{ confirm: "Yes" }}
            dontAskAgain={{ key: "slow-owner" }}
            onConfirm={onConfirm}
          />
        </>
      );
    }

    it("answers once when the owner closes it a moment after the answer", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<SlowOwner onConfirm={onConfirm} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Yes" }));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 200)));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      // and it is remembered for the next opening
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
    });

    it("keeps the dialog on screen until it closes, not unmounting it the moment it is remembered", async () => {
      const user = userEvent.setup();
      render(<SlowOwner onConfirm={() => undefined} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Yes" }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("answers a remembered, default-open confirmation once under StrictMode", async () => {
      window.localStorage.setItem("dbm-dismissed:strict-open", "0");
      const onConfirm = vi.fn();
      render(
        <StrictMode>
          <ConfirmDialog
            defaultOpen
            title="Sure?"
            description="Really."
            dontAskAgain={{ key: "strict-open" }}
            onConfirm={onConfirm}
          />
        </StrictMode>,
      );
      await waitFor(() => expect(onConfirm).toHaveBeenCalled());
      await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("remembers in the browser session when asked to, and for as long as expiresAfter says", async () => {
      const user = userEvent.setup();
      render(<Basic dontAskAgain={{ key: "where", storage: "session", expiresAfter: 60_000 }} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(window.sessionStorage.getItem("dbm-dismissed:where")).not.toBeNull());
      expect(window.localStorage.getItem("dbm-dismissed:where")).toBeNull();
      const endsAt = Number(window.sessionStorage.getItem("dbm-dismissed:where"));
      expect(endsAt).toBeGreaterThan(Date.now() + 50_000);
      expect(endsAt).toBeLessThanOrEqual(Date.now() + 60_000);
    });
  });

  describe("confirmDelay", () => {
    it("holds the confirm button back with a line that says for how long, then releases it", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<Basic confirmDelay={700} onConfirm={onConfirm} defaultOpen />);
      const confirm = await screen.findByRole("button", { name: "Delete" });
      expect(confirm).toBeDisabled();
      expect(screen.getByText("You can confirm in 1 second.")).toBeInTheDocument();
      await waitFor(() => expect(confirm).toBeEnabled(), { timeout: 2500 });
      expect(screen.getByText("You can confirm now.")).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("You can confirm now."));
      await user.click(confirm);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("counts whole seconds up, and writes the number with formatNumber and the label with plain ones", async () => {
      const { unmount } = render(<Basic confirmDelay={2500} formatNumber={(value) => `#${value}`} defaultOpen />);
      expect(await screen.findByText("You can confirm in #3 seconds.")).toBeInTheDocument();
      unmount();
      const confirmIn = vi.fn((seconds: number) => `Wait ${seconds}`);
      render(<Basic confirmDelay={2500} labels={{ confirmIn }} defaultOpen />);
      expect(await screen.findByText("Wait 3")).toBeInTheDocument();
      expect(confirmIn).toHaveBeenCalledWith(3);
    });

    it("holds Enter in the field back too", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<Basic confirmDelay={5000} requireText="Atlas" onConfirm={onConfirm} defaultOpen />);
      const field = await screen.findByRole("textbox");
      await user.type(field, "Atlas{Enter}");
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("restarts every time it opens", async () => {
      const user = userEvent.setup();
      render(<Basic confirmDelay={600} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      const first = await screen.findByRole("button", { name: "Delete" });
      await waitFor(() => expect(first).toBeEnabled(), { timeout: 2500 });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("button", { name: "Delete" })).toBeDisabled();
    });

    it("draws no line without a delay", async () => {
      render(<Basic defaultOpen />);
      await screen.findByRole("alertdialog");
      expect(screen.queryByText(/You can confirm/)).not.toBeInTheDocument();
    });
  });

  describe("requireTextMatch", () => {
    it("ignores case on request, and not otherwise", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Basic requireText="Atlas" defaultOpen />);
      await user.type(await screen.findByRole("textbox"), "ATLAS");
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
      unmount();
      render(<Basic requireText="Atlas" requireTextMatch="ignore-case" defaultOpen />);
      await user.type(await screen.findByRole("textbox"), "ATLAS");
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("asks a function, with the trimmed typed text and the required text", async () => {
      const match = vi.fn((typed: string, required: string) => typed.startsWith(required.slice(0, 2)));
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" requireTextMatch={match} defaultOpen />);
      await user.type(await screen.findByRole("textbox"), " At");
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
      expect(match).toHaveBeenLastCalledWith("At", "Atlas");
    });

    it("treats a function that throws as not matching, with a warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const user = userEvent.setup();
      render(
        <Basic
          requireText="Atlas"
          requireTextMatch={() => {
            throw new Error("boom");
          }}
          defaultOpen
        />,
      );
      await user.type(await screen.findByRole("textbox"), "Atlas");
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
      expect(warn.mock.calls.some(([message]) => String(message).includes("requireTextMatch"))).toBe(true);
    });

    it("counts composed and decomposed accents as the same", async () => {
      const user = userEvent.setup();
      render(<Basic requireText={"Caf\u00e9"} defaultOpen />);
      await user.type(await screen.findByRole("textbox"), "Cafe\u0301");
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });
  });

  describe("accessibility", () => {
    it.each(["neutral", "info", "warning", "danger"] as const)("has no axe violations (%s)", async (tone) => {
      render(<Basic tone={tone} defaultOpen />);
      await screen.findByRole("alertdialog");
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations while an answer is pending", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic tone="danger" onConfirm={() => pending.promise} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect((await axe(document.body)).violations).toHaveLength(0);
      await act(async () => pending.resolve());
    });

    it("has no axe violations with a don't-ask-again checkbox", async () => {
      render(<Basic tone="warning" dontAskAgain={{ key: "axe-box" }} defaultOpen />);
      await screen.findByRole("checkbox");
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations while the delay holds the button back, and after", async () => {
      render(<Basic tone="danger" confirmDelay={500} defaultOpen />);
      await screen.findByText(/You can confirm in/);
      expect((await axe(document.body)).violations).toHaveLength(0);
      await screen.findByText("You can confirm now.", undefined, { timeout: 2500 });
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations with a type-to-confirm field and a body", async () => {
      render(
        <Basic tone="danger" requireText="Atlas" defaultOpen>
          <p>Everything in it goes too.</p>
        </Basic>,
      );
      await screen.findByRole("alertdialog");
      expect((await axe(document.body)).violations).toHaveLength(0);
    });
  });

  describe("onOpenChangeComplete", () => {
    it("is handed to the dialog it is drawn with", async () => {
      const complete = vi.fn();
      const user = userEvent.setup();
      render(<Basic onOpenChangeComplete={complete} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
      await user.click(await screen.findByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(false));
    });
  });

  describe("returning focus", () => {
    // A ConfirmDialog opened from state has no trigger of its own for Radix to return focus to, so it returns it to
    // whatever had focus when it opened.
    function FromState({ onCloseAutoFocus }: { onCloseAutoFocus?: (event: Event) => void }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open from state
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete?"
            description="Sure?"
            labels={{ cancel: "Keep it" }}
            onCloseAutoFocus={onCloseAutoFocus}
          />
        </>
      );
    }

    it("returns focus to the element that was focused when it opened", async () => {
      const user = userEvent.setup();
      render(<FromState />);
      await user.click(screen.getByRole("button", { name: "Open from state" }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("button", { name: "Open from state" })).toHaveFocus());
    });

    it("leaves focus where the caller put it when onCloseAutoFocus was prevented", async () => {
      const user = userEvent.setup();
      render(<FromState onCloseAutoFocus={(event) => event.preventDefault()} />);
      await user.click(screen.getByRole("button", { name: "Open from state" }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Open from state" })).not.toHaveFocus();
    });
  });
});

describe("ConfirmDialog direction", () => {
  it("reads a DirectionProvider's direction, and leaves the attribute off without one", () => {
    const bare = render(<Basic defaultOpen />);
    expect(screen.getByRole("alertdialog")).not.toHaveAttribute("dir");
    bare.unmount();
    render(
      <DirectionProvider dir="rtl">
        <Basic defaultOpen />
      </DirectionProvider>,
    );
    expect(screen.getByRole("alertdialog")).toHaveAttribute("dir", "rtl");
  });
});
