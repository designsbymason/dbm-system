import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { TrashIcon } from "@dbm-system/icons";
import { usePersistentDismiss } from "@dbm-system/utils";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Dialog } from "../Dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmDialogPlaygroundSnippet, confirmDialogSnippets } from "./ConfirmDialog.snippets";
import type { ConfirmDialogProps, ConfirmDialogTone } from "./ConfirmDialog.types";
import { ConfirmStage } from "./ConfirmDialogStoryKit";

// The Playground adds two Playground-only controls (the confirm and cancel words), which are fields of the real
// `labels` prop and so are not props themselves.
interface PlaygroundArgs extends ConfirmDialogProps {
  confirmLabel: string;
  cancelLabel: string;
}

const deleteTrigger = <Button variant="destructive">Delete project</Button>;
const deleteWords = {
  title: "Delete project?",
  description: "This removes the project and all of its files for good. It cannot be undone.",
};

// Every control of the real props, for a story whose fixed render uses none of them.
const noControls = {
  title: { control: false },
  titleSize: { control: false },
  description: { control: false },
  tone: { control: false },
  size: { control: false },
  requireText: { control: false },
  requireTextMatch: { control: false },
  confirmDelay: { control: false },
  initialFocus: { control: false },
  busy: { control: false },
  closeOnEscape: { control: false },
  nudge: { control: false },
  scrimOpacity: { control: false },
  scrimBlur: { control: false },
  onConfirm: { control: false },
  onOpenChange: { control: false },
  confirmLabel: { control: false },
  cancelLabel: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Components/ConfirmDialog",
  id: "organisms-overlay-confirmdialog",
  component: ConfirmDialog,
  parameters: { layout: "padded" },
  argTypes: {
    title: {
      control: "text",
      description: "The question, short enough to read at a glance: \"Delete project?\". Names the dialog.",
    },
    titleSize: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description: "The size of the title's text, from Heading's scale. It changes only how large the title is drawn, not its heading level.",
      table: { defaultValue: { summary: '"xl"' } },
    },
    description: {
      control: "text",
      description:
        "What will happen and what can't be undone. Read out after the title when the dialog opens, so a confirmation needs one.",
    },
    children: {
      control: false,
      description:
        "Content between the description and the buttons: a list of what is affected, or your own error message after a failed request.",
    },
    trigger: {
      control: false,
      description:
        "The element that opens the dialog, a single element such as a Button. Leave it out to open the dialog from your own state with open.",
    },
    tone: {
      control: "select",
      options: ["neutral", "info", "warning", "danger"],
      description: "What the confirmation is about: the icon, and for danger a destructive confirm button.",
      table: { defaultValue: { summary: '"neutral"' } },
    },
    icon: {
      control: false,
      description: "The icon drawn beside the title: a Phosphor icon component to replace the tone's own, or false for none.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "The panel's maximum width. A confirmation is short, so the default is small.",
      table: { defaultValue: { summary: '"sm"' } },
    },
    labels: {
      control: false,
      description:
        "The words the dialog writes itself: confirm, cancel and requireText (a function of the text to type). Pass the ones to replace.",
      table: { defaultValue: { summary: "" } },
    },
    onConfirm: {
      control: false,
      description:
        "Runs when the person confirms. Return a promise and the dialog stays open and busy until it settles: it closes when it resolves, and stays open when it rejects.",
    },
    onCancel: {
      control: false,
      description: "Runs when the person cancels: the cancel button, or Escape. Not called for a confirm.",
    },
    onConfirmError: {
      control: false,
      description:
        "Receives the error when onConfirm's promise rejects. The dialog stays open either way; with no handler the rejection is left unhandled so it is not lost silently.",
    },
    requireTextMatch: {
      control: "select",
      options: ["exact", "ignore-case"],
      description:
        "How what is typed is judged against requireText: exact, ignore-case, or a function of the typed text and the required text. Ignored without requireText.",
      // Shown only once there is a text to judge, so the control is never one that does nothing.
      if: { arg: "requireText", truthy: true },
      table: { defaultValue: { summary: '"exact"' } },
    },
    dontAskAgain: {
      control: false,
      description:
        "Adds a \"Don't ask me again\" checkbox. When it is ticked and the person confirms, the choice is remembered, and from then on opening the dialog calls onConfirm at once and shows nothing. Takes { key, storage, expiresAfter }. Not for something destructive.",
    },
    confirmDelay: {
      control: "number",
      description:
        "Milliseconds to hold the confirm button back after the dialog opens, with a line saying how long is left. 0 or omitted holds nothing back.",
    },
    formatNumber: {
      control: false,
      description: "Writes the seconds shown while confirmDelay runs with your own function. labels' functions are handed the plain number.",
      table: { defaultValue: { summary: "String" } },
    },
    confirmProps: {
      control: false,
      description:
        "Props for the confirm button, for what tone doesn't cover: another variant, an icon. children, onClick and disabled are the dialog's own.",
    },
    cancelProps: {
      control: false,
      description: "Props for the cancel button, on the same terms as confirmProps.",
    },
    busy: {
      control: "boolean",
      description:
        "Marks the dialog as working on something of your own: Escape, cancel and confirm do nothing until it is false. Combined with a promise's pending state.",
      table: { defaultValue: { summary: "false" } },
    },
    requireText: {
      control: "text",
      description:
        "Text the person has to type before the confirm button enables, for something that can't be recovered. Matched exactly and case-sensitively, ignoring spaces at either end. Empty asks for nothing.",
    },
    open: {
      control: false,
      description: "The controlled open state. Omit (along with defaultOpen) to let the dialog manage its own open state.",
    },
    defaultOpen: {
      control: false,
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state, and { reason }: trigger, escape, action or cancel. With a promise from onConfirm it is called with false and action once the promise has resolved.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once it has finished opening and with false once it has finished closing and is out of the page. onOpenChange says a change started; this says it is over.",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the dialog, as a cancel. A press on the scrim never does.",
      table: { defaultValue: { summary: "true" } },
    },
    nudge: {
      control: "boolean",
      description:
        "A short pulse when something tries to dismiss the dialog and can't: a press on the scrim, or Escape while it can't close. Press the scrim to see it.",
      table: { defaultValue: { summary: "true" } },
    },
    initialFocus: {
      control: "select",
      options: ["cancel", "confirm"],
      description:
        "Where focus starts: cancel (the safe choice, and the default), confirm for a low-stakes question, or a ref to an element of your own. With requireText the field is where it starts by default, and confirm falls back to it.",
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
    container: {
      control: false,
      description: "Renders the dialog into a different DOM node than document.body, for a specific stacking-context requirement.",
    },
    onOpenAutoFocus: {
      control: false,
      description: "Called when focus moves into the dialog on open. Call event.preventDefault() inside to choose the element to focus yourself.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to the trigger on close. Call event.preventDefault() inside to send focus elsewhere.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Call event.preventDefault() inside to keep the dialog open.",
    },
    "aria-describedby": {
      control: false,
      description: "Points to the id of an existing element that describes the dialog. The description is wired in automatically.",
    },
    id: { control: false, description: "Standard DOM id, applied to the dialog panel." },
    className: { control: false, description: "Additional CSS classes for customization, on the dialog panel itself." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; no visual or behavioral effect.",
    },
  },
  args: {
    title: deleteWords.title,
    titleSize: "xl",
    description: deleteWords.description,
    tone: "danger",
    size: "sm",
    requireText: "",
    requireTextMatch: "exact",
    confirmDelay: 0,
    busy: false,
    closeOnEscape: true,
    nudge: true,
    scrimOpacity: 60,
    scrimBlur: false,
    onOpenChange: fn(),
    onConfirm: fn(),
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => confirmDialogPlaygroundSnippet(context.args),
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
  // Playground-only: fields of the real `labels` prop, so they are kept off the meta (and the Properties table).
  args: { confirmLabel: "Delete", cancelLabel: "Keep it" },
  argTypes: {
    confirmLabel: { control: "text", description: "The confirm button's words (labels.confirm)." },
    cancelLabel: { control: "text", description: "The cancel button's words (labels.cancel)." },
    initialFocus: {
      control: "select",
      options: ["default", "cancel", "confirm"],
      mapping: { default: undefined, cancel: "cancel", confirm: "confirm" },
      description:
        "Where focus starts: default (cancel, or the field when requireText is set), cancel or confirm.",
    },
  },
  render: ({ confirmLabel, cancelLabel, ...args }) => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          {...args}
          container={container}
          trigger={deleteTrigger}
          labels={{ confirm: confirmLabel || undefined, cancel: cancelLabel || undefined }}
        />
      )}
    </ConfirmStage>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: confirmDialogSnippets.tones } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          {(["neutral", "info", "warning", "danger"] as ConfirmDialogTone[]).map((tone) => (
            <ConfirmDialog
              key={tone}
              container={container}
              trigger={<Button variant="secondary">{tone}</Button>}
              tone={tone}
              title="Discard changes?"
              description="These edits will be lost."
              labels={{ confirm: "Discard", cancel: "Keep editing" }}
            />
          ))}
        </div>
      )}
    </ConfirmStage>
  ),
};

function WaitForARequestExample({ container, fails }: { container: HTMLElement | null; fails: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <ConfirmDialog
      container={container}
      trigger={deleteTrigger}
      tone="danger"
      title={deleteWords.title}
      description={deleteWords.description}
      labels={{ confirm: "Delete" }}
      // A request that takes a moment. The dialog stays open and busy until it settles.
      onConfirm={() =>
        new Promise<void>((resolve, reject) => {
          setMessage(null);
          setTimeout(() => (fails ? reject(new Error("The server didn't answer.")) : resolve()), 1800);
        })
      }
      onConfirmError={(error) => setMessage(error instanceof Error ? error.message : String(error))}
    >
      {message && <Text color="danger">{message} Try again, or keep the project.</Text>}
    </ConfirmDialog>
  );
}

export const WaitForARequest: Story = {
  name: "Waits for a request",
  parameters: { docs: { source: { code: confirmDialogSnippets.waitForARequest } } },
  argTypes: { ...noControls },
  render: () => <ConfirmStage>{(container) => <WaitForARequestExample container={container} fails={false} />}</ConfirmStage>,
};

export const WhenTheRequestFails: Story = {
  name: "When the request fails",
  parameters: { docs: { source: { code: confirmDialogSnippets.failure } } },
  argTypes: { ...noControls },
  render: () => <ConfirmStage>{(container) => <WaitForARequestExample container={container} fails />}</ConfirmStage>,
};

export const TypeToConfirm: Story = {
  name: "Type the name to confirm",
  parameters: { docs: { source: { code: confirmDialogSnippets.typeToConfirm } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={deleteTrigger}
          tone="danger"
          title="Delete “Atlas”?"
          description="This removes the project and everything in it for good."
          requireText="Atlas"
          labels={{ confirm: "Delete project", cancel: "Keep it" }}
        />
      )}
    </ConfirmStage>
  ),
};

export const IgnoringCase: Story = {
  name: "Any capitalisation",
  parameters: { docs: { source: { code: confirmDialogSnippets.ignoreCase } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={deleteTrigger}
          tone="danger"
          title="Delete “Atlas”?"
          description="This removes the project and everything in it for good."
          requireText="Atlas"
          requireTextMatch="ignore-case"
          labels={{ confirm: "Delete project", cancel: "Keep it" }}
        />
      )}
    </ConfirmStage>
  ),
};

export const HeldBack: Story = {
  name: "Held back for a moment",
  parameters: { docs: { source: { code: confirmDialogSnippets.confirmDelay } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={deleteTrigger}
          tone="danger"
          title={deleteWords.title}
          description={deleteWords.description}
          confirmDelay={3000}
          labels={{ confirm: "Delete", cancel: "Keep it" }}
        />
      )}
    </ConfirmStage>
  ),
};

export const ConfirmFirst: Story = {
  name: "Focus starts on the confirm button",
  parameters: { docs: { source: { code: confirmDialogSnippets.confirmFirst } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={<Button>Archive</Button>}
          tone="info"
          title="Archive this conversation?"
          description="You can find it again under Archived."
          initialFocus="confirm"
          labels={{ confirm: "Archive" }}
        />
      )}
    </ConfirmStage>
  ),
};

export const CustomButtons: Story = {
  name: "Your own confirm button",
  parameters: { docs: { source: { code: confirmDialogSnippets.customButtons } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={<Button variant="secondary">Delete draft</Button>}
          tone="warning"
          title="Delete this draft?"
          description="Drafts can't be recovered."
          confirmProps={{ variant: "destructive", leadingIcon: TrashIcon }}
          cancelProps={{ variant: "ghost" }}
          labels={{ confirm: "Delete draft" }}
        />
      )}
    </ConfirmStage>
  ),
};

function DontAskAgainExample({ container }: { container: HTMLElement | null }) {
  const [published, setPublished] = useState(0);
  const remembered = usePersistentDismiss("storybook-confirm-dialog-publish", { storage: "session" });
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <ConfirmDialog
        container={container}
        trigger={<Button>Publish</Button>}
        title="Publish this page?"
        description="It will be visible to everyone with the link."
        dontAskAgain={{ key: "storybook-confirm-dialog-publish", storage: "session" }}
        labels={{ confirm: "Publish" }}
        onConfirm={() => setPublished((count) => count + 1)}
      />
      <Text size="sm">Published {published} time(s). Asking again: {remembered.dismissed ? "no" : "yes"}.</Text>
      <Button variant="tertiary" size="sm" onClick={remembered.reset}>
        Ask again
      </Button>
    </div>
  );
}

export const DontAskAgain: Story = {
  name: "Don't ask me again",
  parameters: { docs: { source: { code: confirmDialogSnippets.dontAskAgain } } },
  argTypes: { ...noControls },
  render: () => <ConfirmStage>{(container) => <DontAskAgainExample container={container} />}</ConfirmStage>,
};

export const WithABody: Story = {
  name: "With content between the description and the buttons",
  parameters: { docs: { source: { code: confirmDialogSnippets.withABody } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage>
      {(container) => (
        <ConfirmDialog
          container={container}
          trigger={<Button variant="destructive">Delete 3 files</Button>}
          tone="danger"
          title="Delete 3 files?"
          description="These files will be removed."
          labels={{ confirm: "Delete", cancel: "Keep them" }}
        >
          <Text>report.pdf, summary.docx and notes.txt</Text>
        </ConfirmDialog>
      )}
    </ConfirmStage>
  ),
};

function ControlledExample({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("nothing yet");
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <Button onClick={() => setOpen(true)}>Leave page</Button>
      <ConfirmDialog
        container={container}
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next);
          if (!next) setAnswer(details.reason);
        }}
        tone="warning"
        title="Leave this page?"
        description="You have unsaved changes."
        labels={{ confirm: "Leave", cancel: "Stay" }}
      />
      <Text size="sm">Closed by: {answer}</Text>
    </div>
  );
}

export const Controlled: Story = {
  name: "Opened from your own state",
  parameters: { docs: { source: { code: confirmDialogSnippets.controlled } } },
  argTypes: { ...noControls },
  render: () => <ConfirmStage>{(container) => <ControlledExample container={container} />}</ConfirmStage>,
};

export const OverADialog: Story = {
  name: "Opened from inside a dialog",
  parameters: { docs: { source: { code: confirmDialogSnippets.overADialog } } },
  argTypes: { ...noControls },
  render: () => (
    <ConfirmStage minBlockSize="34rem">
      {(container) => (
        <Dialog>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content container={container}>
            <Dialog.Header>
              <Dialog.Title>Project settings</Dialog.Title>
              <Dialog.Description>Open the confirmation, then press Escape: it answers first.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <ConfirmDialog
                container={container}
                trigger={deleteTrigger}
                tone="danger"
                scrimOpacity={40}
                title={deleteWords.title}
                description="It cannot be undone."
                labels={{ confirm: "Delete", cancel: "Keep it" }}
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </ConfirmStage>
  ),
};

// A hidden twin of the Playground: answering changes the page's state, so a shown story must not do it on its own.
export const AnswerInteraction: Story = {
  name: "Open, then Keep it — interaction test",
  tags: ["!dev"],
  args: { confirmLabel: "Delete", cancelLabel: "Keep it" },
  argTypes: { confirmLabel: { control: false }, cancelLabel: { control: false } },
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const stage = within(canvasElement);
    const trigger = await stage.findByRole("button", { name: "Delete project" });
    await userEvent.click(trigger);
    const dialog = await within(canvasElement).findByRole("alertdialog", { name: "Delete project?" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep it" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(canvasElement).queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
