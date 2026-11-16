import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Text } from "../../atoms/Text";
import { Dialog } from "../Dialog";
import { AlertDialog } from "./AlertDialog";
import { alertDialogPlaygroundSnippet, alertDialogSnippets } from "./AlertDialog.snippets";
import type { AlertDialogContentProps, AlertDialogProps, AlertDialogTone } from "./AlertDialog.types";
import { AlertStage, DeleteAlert } from "./AlertDialogStoryKit";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";

// Combines the root's own args with `AlertDialog.Content`'s in one Playground: `meta.component` can only resolve
// docgen argTypes for one component, so Content's are declared by hand and threaded through `render`. Each sub-part
// still gets its own Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  onOpenChange: (open: boolean) => void;
  tone: AlertDialogTone;
  size: "xs" | "sm" | "md" | "lg";
  busy: boolean;
  closeOnEscape: boolean;
  nudge: boolean;
  scrimOpacity: BackdropOpacity;
  scrimBlur: boolean;
}

const contentFromArgs = (args: PlaygroundArgs): AlertDialogContentProps => ({
  tone: args.tone,
  size: args.size,
  busy: args.busy,
  closeOnEscape: args.closeOnEscape,
  nudge: args.nudge,
  scrimOpacity: args.scrimOpacity,
  scrimBlur: args.scrimBlur,
});

const rootFromArgs = (args: PlaygroundArgs): Omit<AlertDialogProps, "children"> => ({
  onOpenChange: args.onOpenChange,
});

const allControlsOff = {
  onOpenChange: { control: false },
  tone: { control: false },
  size: { control: false },
  busy: { control: false },
  closeOnEscape: { control: false },
  nudge: { control: false },
  scrimOpacity: { control: false },
  scrimBlur: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Components/AlertDialog",
  id: "organisms-overlay-alertdialog",
  parameters: { layout: "padded" },
  argTypes: {
    onOpenChange: {
      control: false,
      description: "Called with the new open state, and { reason }: trigger, escape, action or cancel.",
    },
    tone: {
      control: "select",
      options: ["neutral", "info", "warning", "danger"],
      description: "What the alert is about: the icon, and for danger a destructive Action.",
      table: { defaultValue: { summary: '"neutral"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "The panel's maximum width. An alert is short, so the default is small.",
      table: { defaultValue: { summary: '"sm"' } },
    },
    busy: {
      control: "boolean",
      description: "Marks the alert as working on something: Escape, Cancel and Action do nothing until it is false.",
      table: { defaultValue: { summary: "false" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the alert, as a cancel. A press on the scrim never does.",
      table: { defaultValue: { summary: "true" } },
    },
    nudge: {
      control: "boolean",
      description:
        "A short pulse when something tries to dismiss the alert and can't: a press on the scrim, or Escape while it can't close. Press the scrim to see it.",
      table: { defaultValue: { summary: "true" } },
    },
    scrimOpacity: {
      control: "select",
      options: [20, 40, 60, 80, 90],
      description: "How opaque the scrim is, from the opacity scale.",
      table: { defaultValue: { summary: "60" } },
    },
    scrimBlur: {
      control: "boolean",
      description: "Blurs the page behind the scrim as well as dimming it.",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: {
    tone: "danger",
    size: "sm",
    busy: false,
    closeOnEscape: true,
    nudge: true,
    scrimOpacity: 60,
    scrimBlur: false,
    onOpenChange: fn(),
  },
  render: (args) => (
    <AlertStage>
      {(container) => (
        <DeleteAlert container={container} dialog={rootFromArgs(args)} content={contentFromArgs(args)} />
      )}
    </AlertStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => alertDialogPlaygroundSnippet(context.args),
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: alertDialogSnippets.tones } } },
  argTypes: { tone: { control: false } },
  render: (args) => (
    <AlertStage>
      {(container) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          {(["neutral", "info", "warning", "danger"] as const).map((tone) => (
            <DeleteAlert
              key={tone}
              container={container}
              dialog={rootFromArgs(args)}
              content={{ ...contentFromArgs(args), tone }}
              triggerLabel={tone}
            />
          ))}
        </div>
      )}
    </AlertStage>
  ),
};

export const AcknowledgeOnly: Story = {
  name: "Acknowledge only, one choice",
  parameters: { docs: { source: { code: alertDialogSnippets.acknowledge } } },
  argTypes: { tone: { control: false } },
  render: (args) => (
    <AlertStage>
      {(container) => (
        <AlertDialog {...rootFromArgs(args)}>
          <AlertDialog.Trigger asChild>
            <Button>Show error</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content container={container} {...contentFromArgs(args)} tone="danger">
            <AlertDialog.Header>
              <AlertDialog.Title>Couldn&apos;t save</AlertDialog.Title>
              <AlertDialog.Description>The connection dropped. Your changes are still here.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Action>OK</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      )}
    </AlertStage>
  ),
};

export const WithABody: Story = {
  name: "With content between the header and footer",
  parameters: { docs: { source: { code: alertDialogSnippets.withBody } } },
  render: (args) => (
    <AlertStage>
      {(container) => (
        <AlertDialog {...rootFromArgs(args)}>
          <AlertDialog.Trigger asChild>
            <Button variant="destructive">Delete 3 files</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content container={container} {...contentFromArgs(args)}>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete 3 files?</AlertDialog.Title>
              <AlertDialog.Description>These files will be removed.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <Text>report.pdf, summary.docx and notes.txt</Text>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep them</AlertDialog.Cancel>
              <AlertDialog.Action>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      )}
    </AlertStage>
  ),
};

function ThreeChoicesExample({ container }: { container: HTMLElement | null }) {
  const [answer, setAnswer] = useState("nothing yet");
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <AlertDialog
        onOpenChange={(open, details) => {
          if (!open) setAnswer(details.value ?? details.reason);
        }}
      >
        <AlertDialog.Trigger asChild>
          <Button>Close editor</Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content container={container} tone="warning">
          <AlertDialog.Header>
            <AlertDialog.Title>Save changes?</AlertDialog.Title>
            <AlertDialog.Description>Your edits will be lost if you don&apos;t save them.</AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
            <AlertDialog.Action value="discard" variant="tertiary">
              Don&apos;t save
            </AlertDialog.Action>
            <AlertDialog.Action value="save" variant="primary">
              Save
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
      <Text size="sm">Answered: {answer}</Text>
    </div>
  );
}

export const ThreeChoices: Story = {
  name: "Three choices",
  parameters: { docs: { source: { code: alertDialogSnippets.threeChoices } } },
  argTypes: allControlsOff,
  render: () => <AlertStage>{(container) => <ThreeChoicesExample container={container} />}</AlertStage>,
};

function TypeToConfirmExample({ container }: { container: HTMLElement | null }) {
  const [typed, setTyped] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <AlertDialog onOpenChange={(open) => open && setTyped("")}>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content container={container} tone="danger" initialFocus={nameRef}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete &quot;Atlas&quot;?</AlertDialog.Title>
          <AlertDialog.Description>
            This removes the project and everything in it for good. Type its name to confirm.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <Input
            ref={nameRef}
            aria-label="Project name"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action disabled={typed !== "Atlas"}>Delete project</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

export const TypeToConfirm: Story = {
  name: "Type the name to confirm",
  parameters: { docs: { source: { code: alertDialogSnippets.typeToConfirm } } },
  argTypes: allControlsOff,
  render: () => <AlertStage>{(container) => <TypeToConfirmExample container={container} />}</AlertStage>,
};

export const PressTheScrim: Story = {
  name: "Press the scrim: it pulses",
  parameters: { docs: { source: { code: alertDialogSnippets.nudge } } },
  argTypes: { closeOnEscape: { control: false }, nudge: { control: false } },
  render: (args) => (
    <AlertStage>
      {(container) => (
        <DeleteAlert
          container={container}
          dialog={rootFromArgs(args)}
          content={{ ...contentFromArgs(args), closeOnEscape: false, nudge: true }}
          triggerLabel="Open, then press the scrim or Escape"
        />
      )}
    </AlertStage>
  ),
};

function BusyExample({ container }: { container: HTMLElement | null }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <DeleteAlert
      container={container}
      dialog={{ open, onOpenChange: setOpen }}
      content={{ busy }}
      busyAction={busy}
      onAction={() => {
        // The close is stopped by the Action's own handler below, so the alert waits for the request.
        setBusy(true);
        setTimeout(() => {
          setBusy(false);
          setOpen(false);
        }, 2000);
      }}
    />
  );
}

export const WhileItIsBusy: Story = {
  name: "While it is busy",
  parameters: { docs: { source: { code: alertDialogSnippets.busy } } },
  argTypes: allControlsOff,
  render: () => <AlertStage>{(container) => <BusyExample container={container} />}</AlertStage>,
};

function ReasonExample({ container }: { container: HTMLElement | null }) {
  const [reason, setReason] = useState("nothing yet");
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <DeleteAlert
        container={container}
        dialog={{ onOpenChange: (_open, details) => setReason(details.reason) }}
        content={{ tone: "warning" }}
        triggerLabel="Open alert"
      />
      <Text size="sm">Last change reported: {reason}</Text>
    </div>
  );
}

export const KnowingWhatAnsweredIt: Story = {
  name: "Knowing what answered it",
  parameters: { docs: { source: { code: alertDialogSnippets.reason } } },
  argTypes: allControlsOff,
  render: () => <AlertStage>{(container) => <ReasonExample container={container} />}</AlertStage>,
};

export const OverADialog: Story = {
  name: "Opened from inside a dialog",
  parameters: { docs: { source: { code: alertDialogSnippets.overADialog } } },
  argTypes: { ...allControlsOff },
  render: () => (
    <AlertStage minBlockSize="34rem">
      {(container) => (
        <Dialog>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content container={container}>
            <Dialog.Header>
              <Dialog.Title>Project settings</Dialog.Title>
              <Dialog.Description>Open the alert, then press Escape: it answers first.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <DeleteAlert container={container} content={{ scrimOpacity: 40 }} />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </AlertStage>
  ),
};

// A hidden twin of the Playground: answering changes the page's state, so a shown story must not do it on its own.
export const AnswerInteraction: Story = {
  name: "Open, then Keep it — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const stage = within(canvasElement);
    const trigger = await stage.findByRole("button", { name: "Delete project" });
    await userEvent.click(trigger);
    const alert = await within(canvasElement).findByRole("alertdialog", { name: "Delete project?" });
    await waitFor(() => expect(within(alert).getByRole("button", { name: "Keep it" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(canvasElement).queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
