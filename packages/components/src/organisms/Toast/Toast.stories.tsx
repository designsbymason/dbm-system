import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { HeartIcon, StarIcon } from "@dbm-system/icons";
import { fn } from "storybook/test";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { createToaster, Toast, useToast } from "./Toast";
import { toastPlaygroundSnippet, toastSnippets } from "./Toast.snippets";
import type {
  ToastActionVariant,
  ToastOptions,
  ToastPlacement,
  ToastRole,
  ToastSize,
  ToastStack,
  ToastTone,
  ToastVariant,
} from "./Toast.types";
import { ButtonRow, RaiseButton, sampleOptions, ToastStage } from "./ToastStoryKit";

// Combines the provider's own args (placement/limit/duration/…) with the options of one `toast()` call (tone/title/
// …) in one Playground: `meta.component` can only resolve docgen argTypes for one component, so the others are
// declared by hand below and threaded through `render`. The provider and the single toast each get their own
// Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
//
// The order here is the order of the Controls panel: what the toast says, how it looks, what it does, and then the
// provider's settings, and last the callbacks.
interface PlaygroundArgs {
  title: string;
  description: string;
  tone: ToastTone;
  variant: ToastVariant;
  size: ToastSize;
  /** The Playground's choice, mapped to the tone's own icon (`undefined`), none (`false`) or a custom one. */
  icon: ToastOptions["icon"];
  loading: boolean;
  showAction: boolean;
  actionVariant: ToastActionVariant;
  dismissible: boolean;
  role: ToastRole | undefined;
  /** Text; empty leaves it out. The same id raised again replaces the toast instead of adding another. */
  toastId: string;
  /** Milliseconds, or `null` for until it is dismissed (the Playground maps its "Until dismissed" choice to it). */
  duration: number | null;
  placement: ToastPlacement;
  stack: ToastStack;
  limit: number;
  clearAll: boolean;
  mergeDuplicates: boolean;
  /** The keys that move focus into the toasts (the Playground maps its choices to the arrays). */
  hotkey: string[];
  swipeThreshold: number;
  dir: "ltr" | "rtl";
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  /** The list the toasts are in: native pass-throughs, shown for the Properties list and not editable here. */
  id: string | undefined;
  className: string | undefined;
  style: CSSProperties | undefined;
  "data-testid": string | undefined;
}

const optionsFromArgs = (args: PlaygroundArgs): ToastOptions => ({
  id: args.toastId || undefined,
  title: args.title || undefined,
  description: args.description || undefined,
  tone: args.tone,
  icon: args.icon,
  loading: args.loading,
  dismissible: args.dismissible,
  role: args.role,
  action: args.showAction ? { label: "Undo", altText: "Undo from the Edit menu", variant: args.actionVariant } : undefined,
  onOpenChange: args.onOpenChange,
  onOpenChangeComplete: args.onOpenChangeComplete,
});

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => toastPlaygroundSnippet(context.args),
};

const noControls = {
  title: { control: false },
  description: { control: false },
  tone: { control: false },
  variant: { control: false },
  size: { control: false },
  icon: { control: false },
  loading: { control: false },
  showAction: { control: false },
  actionVariant: { control: false },
  dismissible: { control: false },
  role: { control: false },
  toastId: { control: false },
  duration: { control: false },
  placement: { control: false },
  stack: { control: false },
  limit: { control: false },
  clearAll: { control: false },
  mergeDuplicates: { control: false },
  hotkey: { control: false },
  swipeThreshold: { control: false },
  dir: { control: false },
  onOpenChange: { control: false },
  onOpenChangeComplete: { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Feedback/Toast",
  parameters: { layout: "padded" },
  argTypes: {
    title: {
      control: "text",
      description: "The headline, in a few words.",
    },
    description: {
      control: "text",
      description: "The message itself.",
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger", "neutral"],
      description: "What the message is about, on the standard tone scale. Each has its own icon and colours.",
      table: { defaultValue: { summary: '"info"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description: "How every toast is drawn.",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size of every toast.",
      table: { defaultValue: { summary: '"md"' } },
    },
    icon: {
      control: false,
      description:
        "The icon before the message, a component reference from @dbm-system/icons. Each tone has its own; pass another to replace it, or false for none.",
    },
    loading: {
      control: "boolean",
      description: "Shows a spinner in place of the icon and keeps the toast until it is updated or dismissed.",
      table: { defaultValue: { summary: "false" } },
    },
    showAction: {
      control: "boolean",
      description:
        "Adds an action button with an alternative for a person who won't reach it in time (altText, required).",
      table: { defaultValue: { summary: "false" } },
    },
    actionVariant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      if: { arg: "showAction" },
      description:
        "How prominent the action is, using Button's names. How each looks depends on the toast's tone and variant. Offered while showAction is on.",
      table: { defaultValue: { summary: '"primary"' } },
    },
    dismissible: {
      control: "boolean",
      description: "Adds a button that dismisses it.",
      table: { defaultValue: { summary: "true" } },
    },
    role: {
      control: "select",
      options: ["alert", "status"],
      description:
        "How it is announced. alert interrupts, status waits for a pause. Left out, it follows the tone: alert for danger and warning, status for the rest.",
    },
    toastId: {
      control: "text",
      description:
        "The toast's own identifier (the id option of toast()), not a DOM id. Raising a toast with the id of one that is still showing replaces it in place, drawn afresh, instead of adding another. Left empty, one is made up and identical plain messages merge.",
    },
    duration: {
      control: "select",
      options: [2000, 5000, 10000],
      description:
        "How long a toast stays, in milliseconds. Paused while the pointer is over the toasts or focus is inside them. null keeps it until it is dismissed.",
      table: { defaultValue: { summary: "5000" } },
    },
    placement: {
      control: "select",
      options: ["top-end", "top", "top-start", "bottom-end", "bottom", "bottom-start"],
      description:
        "The corner or edge the toasts stack against. start and end are logical: the left and right in left-to-right text, swapped in right-to-left. A mobile-first map switches it at a breakpoint.",
      table: { defaultValue: { summary: '"top-end"' } },
    },
    stack: {
      control: "select",
      options: ["list", "fan"],
      description:
        "How the toasts sit in the region. list shows each in full, one under another; fan shows the newest in full with the older ones peeking out behind it, spread out into the list while the pointer is over the toasts or focus is inside them. A mobile-first map switches it at a breakpoint. Raise a few to see it.",
      table: { defaultValue: { summary: '"list"' } },
    },
    limit: {
      control: { type: "number", min: 1, max: 6 },
      description: "The most toasts showing at once. The rest wait, and each starts its own time when it appears.",
      table: { defaultValue: { summary: "3" } },
    },
    clearAll: {
      control: "boolean",
      description:
        "Draws a button that closes every toast, and drops the ones waiting, once more than one is showing. Raise a few to see it.",
      table: { defaultValue: { summary: "true" } },
    },
    mergeDuplicates: {
      control: "boolean",
      description:
        "Raising the same plain message again while it is showing (no id) shows it once, with a count, and starts its time again. An action and callbacks must be the same functions to merge.",
      table: { defaultValue: { summary: "true" } },
    },
    hotkey: {
      control: false,
      description:
        "The keys that move focus into the toasts' region, held together, as KeyboardEvent property or code names. The region's accessible name says which.",
      table: { defaultValue: { summary: '["F8"]' } },
    },
    swipeThreshold: {
      control: { type: "number", min: 10, max: 300 },
      description:
        "How far, in pixels, a toast has to be dragged toward the edge before letting go closes it. A shorter drag springs back.",
      table: { defaultValue: { summary: "50" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, which sets which way a swipe closes a toast. Left out, the nearest DirectionProvider's, else left-to-right.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    onOpenChange: {
      control: false,
      description: "Called with false when it closes, and { reason }: timeout, dismiss, action, swipe, escape or programmatic.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once it has finished arriving and with false once it has finished leaving and is out of the page.",
    },
    id: {
      control: false,
      description: "Standard DOM id, on the list the toasts are in.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the list the toasts are in.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    title: "Saved",
    description: "Your changes are live.",
    tone: "success",
    variant: "subtle",
    size: "md",
    icon: undefined,
    loading: false,
    showAction: false,
    actionVariant: "primary",
    dismissible: true,
    role: undefined,
    toastId: "",
    duration: 5000,
    placement: "top-end",
    stack: "list",
    limit: 3,
    clearAll: true,
    mergeDuplicates: true,
    hotkey: ["F8"],
    swipeThreshold: 50,
    dir: "ltr",
    onOpenChange: fn(),
    onOpenChangeComplete: fn(),
    id: undefined,
    className: undefined,
    style: undefined,
    "data-testid": undefined,
  },
  render: (args) => (
    <ToastStage>
      {(container) => (
        <Toast.Provider
          container={container}
          placement={args.placement}
          stack={args.stack}
          limit={args.limit}
          duration={args.duration}
          size={args.size}
          variant={args.variant}
          clearAll={args.clearAll}
          mergeDuplicates={args.mergeDuplicates}
          hotkey={args.hotkey}
          swipeThreshold={args.swipeThreshold}
          dir={args.dir}
        >
          <RaiseButton label="Show toast" options={() => optionsFromArgs(args)} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below, and press the button to raise a toast. */
export const Playground: Story = {
  // The Playground's own controls add a way to leave `icon` and `role` out ("Default"), a custom icon to try, an
  // until-dismissed duration and a second hotkey: choices, not values the props take, so they stay out of the
  // meta-level argTypes the Properties table reads.
  argTypes: {
    icon: {
      control: "select",
      options: ["Default", "None", "Star", "Heart"],
      mapping: { Default: undefined, None: false, Star: StarIcon, Heart: HeartIcon },
      description:
        "The icon before the message, a component reference from @dbm-system/icons. Default is the tone's own; None is false; the others are custom ones to try.",
    },
    role: {
      control: "select",
      options: ["Default", "alert", "status"],
      mapping: { Default: undefined, alert: "alert", status: "status" },
      description:
        "How it is announced. alert interrupts, status waits for a pause. Default follows the tone: alert for danger and warning, status for the rest.",
    },
    duration: {
      control: "select",
      options: [2000, 5000, 10000, "Until dismissed"],
      mapping: { 2000: 2000, 5000: 5000, 10000: 10000, "Until dismissed": null },
      description:
        "How long a toast stays, in milliseconds. Paused while the pointer is over the toasts or focus is inside them. \"Until dismissed\" is null.",
    },
    hotkey: {
      control: "select",
      options: ["F8", "Alt + T"],
      mapping: { F8: ["F8"], "Alt + T": ["altKey", "KeyT"] },
      description:
        "The keys that move focus into the toasts' region, held together. The region's accessible name says which.",
    },
  },
  parameters: { docs: { source: playgroundSource } },
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: toastSnippets.tones } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} limit={5}>
          <ButtonRow>
            {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
              <RaiseButton key={tone} label={tone} options={sampleOptions[tone]} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Variants: Story = {
  name: "Variants",
  parameters: { docs: { source: { code: toastSnippets.variants } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} limit={5}>
          <ButtonRow>
            {(["subtle", "outlined", "solid"] as const).map((variant) => (
              <RaiseButton key={variant} label={variant} options={{ ...sampleOptions.success, variant }} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: toastSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} limit={5}>
          <ButtonRow>
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <RaiseButton key={size} label={size} options={{ ...sampleOptions.success, size }} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function ActionExample({ container }: { container: HTMLElement | null }) {
  const [archived, setArchived] = useState(false);
  return (
    <Toast.Provider container={container}>
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
        <ArchiveButton onArchive={() => setArchived(true)} onUndo={() => setArchived(false)} />
        <Text size="sm">Conversation is {archived ? "archived" : "in your inbox"}.</Text>
      </div>
    </Toast.Provider>
  );
}

function ArchiveButton({ onArchive, onUndo }: { onArchive: () => void; onUndo: () => void }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onArchive();
        toast({
          tone: "neutral",
          title: "Conversation archived",
          action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo },
        });
      }}
    >
      Archive
    </Button>
  );
}

export const WithAction: Story = {
  name: "With an action",
  parameters: { docs: { source: { code: toastSnippets.action } } },
  argTypes: { ...noControls },
  render: () => <ToastStage>{(container) => <ActionExample container={container} />}</ToastStage>,
};

function PlacementExample({ container }: { container: HTMLElement | null }) {
  const [placement, setPlacement] = useState<ToastPlacement>("top-end");
  return (
    <Toast.Provider container={container} placement={placement}>
      <ButtonRow>
        {(["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end"] as const).map((value) => (
          <PlacementButton key={value} value={value} onChoose={setPlacement} />
        ))}
      </ButtonRow>
    </Toast.Provider>
  );
}

function PlacementButton({ value, onChoose }: { value: ToastPlacement; onChoose: (value: ToastPlacement) => void }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onChoose(value);
        toast({ ...sampleOptions.info, title: value, description: undefined });
      }}
    >
      {value}
    </Button>
  );
}

export const Placements: Story = {
  name: "Placements",
  parameters: { docs: { source: { code: toastSnippets.placement } } },
  argTypes: { ...noControls },
  render: () => <ToastStage minBlockSize="24rem">{(container) => <PlacementExample container={container} />}</ToastStage>,
};

export const ResponsivePlacement: Story = {
  name: "A placement that changes with the screen",
  parameters: { docs: { source: { code: toastSnippets.responsive } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container} placement={{ base: "bottom", md: "top-end" }}>
          <RaiseButton label="Show toast" options={sampleOptions.success} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function PromiseButtons() {
  const { toast } = useToast();
  const run = (succeed: boolean) => {
    const work = new Promise<{ name: string }>((resolve, reject) => {
      setTimeout(() => (succeed ? resolve({ name: "report.pdf" }) : reject(new Error("offline"))), 1600);
    });
    // The rejection is the caller's to handle: the toast only reports it.
    toast
      .promise(work, {
        loading: "Saving…",
        success: (file) => ({ title: "Saved", description: file.name }),
        error: "Could not save",
      })
      .catch(() => undefined);
  };
  return (
    <ButtonRow>
      <Button variant="secondary" onClick={() => run(true)}>
        Save (succeeds)
      </Button>
      <Button variant="secondary" onClick={() => run(false)}>
        Save (fails)
      </Button>
    </ButtonRow>
  );
}

export const Promise_: Story = {
  name: "Following a promise",
  parameters: { docs: { source: { code: toastSnippets.promise } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <PromiseButtons />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Persistent: Story = {
  name: "Kept until it is dismissed",
  parameters: { docs: { source: { code: toastSnippets.persistent } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <RaiseButton
            label="Go offline"
            options={{ tone: "warning", title: "You are offline", description: "Changes are saved here and sync later.", duration: null }}
          />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function QueueButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        for (let index = 1; index <= 5; index += 1) toast({ tone: "info", title: `Message ${index}` });
      }}
    >
      Send five
    </Button>
  );
}

export const Queue: Story = {
  name: "A limit, with the rest waiting",
  parameters: { docs: { source: { code: toastSnippets.queue } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="22rem">
      {(container) => (
        <Toast.Provider container={container} limit={2} duration={3000}>
          <QueueButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function SyncButton() {
  const { toast, update } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toast({ id: "sync", tone: "info", title: "Syncing…", loading: true });
        setTimeout(() => {
          update("sync", { loading: false, tone: "success", title: "Up to date", duration: 3000 });
        }, 1600);
      }}
    >
      Sync
    </Button>
  );
}

export const Updating: Story = {
  name: "Updated in place",
  parameters: { docs: { source: { code: toastSnippets.update } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <SyncButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function FanStory({ container }: { container: HTMLElement | null }) {
  return (
    <Toast.Provider container={container} stack="fan" duration={null} limit={4}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
        <FanRaise />
      </div>
    </Toast.Provider>
  );
}

function FanRaise() {
  const { toast, dismissAll } = useToast();
  const [count, setCount] = useState(0);
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          const next = count + 1;
          setCount(next);
          toast({ tone: "info", title: `Message ${next}`, description: "A line of detail." });
        }}
      >
        Raise a toast
      </Button>
      <Button variant="tertiary" onClick={() => dismissAll()}>
        Clear
      </Button>
    </>
  );
}

export const Fan: Story = {
  name: "A fanned stack",
  parameters: { docs: { source: { code: toastSnippets.fan } } },
  argTypes: { ...noControls },
  render: () => <ToastStage minBlockSize="24rem">{(container) => <FanStory container={container} />}</ToastStage>,
};

function PromiseActionButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast({
          title: "Conversation deleted",
          action: {
            label: "Undo",
            altText: "Restore it from Trash",
            onClick: () => new Promise<void>((resolve) => setTimeout(resolve, 1600)),
          },
        })
      }
    >
      Delete
    </Button>
  );
}

export const PromiseAction: Story = {
  name: "An action that takes a promise",
  parameters: { docs: { source: { code: toastSnippets.promiseAction } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <PromiseActionButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function CopyButton() {
  const { toast } = useToast();
  return (
    <Button variant="secondary" onClick={() => toast({ tone: "neutral", title: "Link copied" })}>
      Copy link
    </Button>
  );
}

export const Merged: Story = {
  name: "The same message, once, with a count",
  parameters: { docs: { source: { code: toastSnippets.merged } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <CopyButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const ClearAll: Story = {
  name: "Clear all",
  parameters: { docs: { source: { code: toastSnippets.clearAll } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="24rem">
      {(container) => (
        <Toast.Provider container={container} limit={2} duration={null}>
          <QueueButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

// Made once, here, the way an app's module would; the button below raises through it and not through a hook.
const storyToaster = createToaster();

export const FromOutsideReact: Story = {
  name: "Raised from plain code",
  parameters: { docs: { source: { code: toastSnippets.outside } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container} toaster={storyToaster}>
          <Button
            variant="secondary"
            onClick={() => storyToaster.toast({ tone: "danger", title: "Could not reach the server", description: "Check your connection." })}
          >
            Fail a request
          </Button>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function DeclaredExample({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Toast.Provider container={container}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Save
      </Button>
      <Toast tone="success" open={open} onOpenChange={setOpen}>
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes are live.</Toast.Description>
        <Toast.Action altText="Open the file from your recent files">View</Toast.Action>
      </Toast>
    </Toast.Provider>
  );
}

export const Declared: Story = {
  name: "Declared as parts",
  parameters: { docs: { source: { code: toastSnippets.declared } } },
  argTypes: { ...noControls },
  render: () => <ToastStage>{(container) => <DeclaredExample container={container} />}</ToastStage>,
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: toastSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container} dir="rtl" placement="bottom-start">
          <RaiseButton label="حفظ" options={{ tone: "success", title: "تم الحفظ", description: "التغييرات منشورة الآن." }} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};
