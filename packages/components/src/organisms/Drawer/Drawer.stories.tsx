import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";
import { ConfirmDialog } from "../ConfirmDialog";
import { Drawer } from "./Drawer";
import { drawerPlaygroundSnippet, drawerSnippets } from "./Drawer.snippets";
import type { DrawerContentProps, DrawerProps, DrawerSide, DrawerSize } from "./Drawer.types";
import { DrawerStage, DrawerViewModeContext, FiltersDrawer } from "./DrawerStoryKit";

// Combines Drawer's own root-level args (modal/onOpenChange) with Drawer.Content's (side/size/divided/…) in one
// Playground: `meta.component` can only resolve docgen argTypes for one component, so Content's are declared by
// hand below and threaded through `render`. Each sub-part still gets its own Properties table from a hidden,
// docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  modal: boolean;
  onOpenChange: (open: boolean) => void;
  side: DrawerSide;
  size: DrawerSize;
  swipeToDismiss: boolean;
  showHandle: boolean;
  /** The control's option; the story maps it to `false`, `true` or `"auto"` (see `dividedFromArg`). */
  divided: "off" | "on" | "auto";
  busy: boolean;
  keepMounted: boolean;
  scrimOpacity: BackdropOpacity;
  scrimBlur: boolean;
  showCloseButton: boolean;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
}

const dividedFromArg = { off: false, on: true, auto: "auto" } as const;

const contentFromArgs = (args: PlaygroundArgs): DrawerContentProps => ({
  side: args.side,
  size: args.size,
  swipeToDismiss: args.swipeToDismiss,
  showHandle: args.showHandle,
  divided: dividedFromArg[args.divided],
  busy: args.busy,
  keepMounted: args.keepMounted,
  scrimOpacity: args.scrimOpacity,
  scrimBlur: args.scrimBlur,
  showCloseButton: args.showCloseButton,
  closeOnOutsideClick: args.closeOnOutsideClick,
  closeOnEscape: args.closeOnEscape,
});

const rootFromArgs = (args: PlaygroundArgs): Omit<DrawerProps, "children"> => ({
  modal: args.modal,
  onOpenChange: args.onOpenChange,
});

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => drawerPlaygroundSnippet(context.args),
};

const noControls = {
  modal: { control: false },
  onOpenChange: { control: false },
  side: { control: false },
  size: { control: false },
  swipeToDismiss: { control: false },
  showHandle: { control: false },
  divided: { control: false },
  busy: { control: false },
  keepMounted: { control: false },
  scrimOpacity: { control: false },
  scrimBlur: { control: false },
  showCloseButton: { control: false },
  closeOnOutsideClick: { control: false },
  closeOnEscape: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Drawer",
  id: "organisms-overlay-drawer",
  parameters: { layout: "padded" },
  // Tells the demo box whether it is on a Docs page (a compact frame) or a story of its own (the whole canvas).
  decorators: [
    (Story, context) => (
      <DrawerViewModeContext.Provider value={context.viewMode === "docs" ? "docs" : "story"}>
        <Story />
      </DrawerViewModeContext.Provider>
    ),
  ],
  argTypes: {
    modal: {
      control: "boolean",
      description:
        "Whether the drawer is modal. A modal drawer dims the page with a scrim, locks its scroll and traps focus; set false for a docked panel that leaves the page usable.",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state, and { reason }: trigger, escape, outside, close-button, close or swipe.",
    },
    side: {
      control: "select",
      options: ["end", "start", "top", "bottom"],
      description:
        "The edge the panel is attached to. start and end are logical: the left and right edges in left-to-right text, swapped in right-to-left. A mobile-first map such as { base: \"bottom\", md: \"end\" } switches it at a breakpoint.",
      table: { defaultValue: { summary: '"end"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The panel's extent along its axis: its width for start and end, the most height it takes for top and bottom.",
      table: { defaultValue: { summary: '"md"' } },
    },
    swipeToDismiss: {
      control: "boolean",
      description:
        "Lets a touch or a pen drag the panel toward its edge to dismiss it, by its handle or header; a mouse can drag the handle only. A short drag settles back; a long or quick one closes it with the reason swipe. Off while busy.",
      table: { defaultValue: { summary: "true" } },
    },
    showHandle: {
      control: "boolean",
      // The handle is drawn only on a top or bottom drawer; a condition takes one value, so it is offered for bottom
      // (the sheet people drag), and a top drawer takes the prop all the same.
      if: { arg: "side", eq: "bottom" },
      description:
        "Draws a small grab handle on the inner edge of a top or bottom drawer. Decorative, and not drawn for a start or end drawer, so this control is offered while side is bottom.",
      table: { defaultValue: { summary: "true" } },
    },
    divided: {
      control: "select",
      options: ["off", "on", "auto"],
      description:
        "Draws a line between the header and the body and between the body and the footer. \"auto\" draws each only while content is scrolled out of view on that side; \"on\" always, \"off\" never.",
      table: { defaultValue: { summary: '"auto"' } },
    },
    busy: {
      control: "boolean",
      description:
        "Marks the drawer as working on something: it can't be dismissed by Escape, the scrim, the close button or a Drawer.Close until it is false again.",
      table: { defaultValue: { summary: "false" } },
    },
    keepMounted: {
      control: "boolean",
      description: "Keeps what is inside mounted while closed, so a half-filled form is there when it reopens.",
      table: { defaultValue: { summary: "false" } },
    },
    scrimOpacity: {
      control: "select",
      options: [20, 40, 60, 80, 90],
      if: { arg: "modal" },
      description: "How opaque the scrim behind a modal drawer is, from the opacity scale. Ignored while modal is off.",
      table: { defaultValue: { summary: "60" } },
    },
    scrimBlur: {
      control: "boolean",
      if: { arg: "modal" },
      description: "Blurs the page behind the scrim as well as dimming it. Ignored while modal is off.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows a CloseButton in the panel's top-end corner.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnOutsideClick: {
      control: "boolean",
      description: "Whether a press on the scrim closes the drawer.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the drawer.",
      table: { defaultValue: { summary: "true" } },
    },
  },
  args: {
    modal: true,
    side: "end",
    size: "md",
    swipeToDismiss: true,
    showHandle: true,
    divided: "auto",
    busy: false,
    keepMounted: false,
    scrimOpacity: 60,
    scrimBlur: false,
    showCloseButton: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    onOpenChange: fn(),
  },
  render: (args) => (
    <DrawerStage>
      {(container) => <FiltersDrawer container={container} drawer={rootFromArgs(args)} content={contentFromArgs(args)} />}
    </DrawerStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Sides: Story = {
  name: "Sides",
  parameters: { docs: { source: { code: drawerSnippets.sides } } },
  argTypes: { ...noControls, side: { control: false } },
  render: (args) => (
    <DrawerStage>
      {(container) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          {(["start", "end", "top", "bottom"] as const).map((side) => (
            <FiltersDrawer
              key={side}
              container={container}
              drawer={rootFromArgs(args)}
              content={{ ...contentFromArgs(args), side }}
              triggerLabel={side}
            />
          ))}
        </div>
      )}
    </DrawerStage>
  ),
};

export const ResponsiveSide: Story = {
  name: "A side that changes with the screen",
  parameters: { docs: { source: { code: drawerSnippets.responsive } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>
      {(container) => (
        <FiltersDrawer container={container} content={{ side: { base: "bottom", md: "end" } }} triggerLabel="Open" />
      )}
    </DrawerStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: drawerSnippets.sizes } } },
  argTypes: { ...noControls },
  render: (args) => (
    <DrawerStage>
      {(container) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <FiltersDrawer
              key={size}
              container={container}
              drawer={rootFromArgs(args)}
              content={{ ...contentFromArgs(args), size }}
              triggerLabel={size}
            />
          ))}
        </div>
      )}
    </DrawerStage>
  ),
};

export const CustomSize: Story = {
  name: "A size the scale doesn't have",
  parameters: { docs: { source: { code: drawerSnippets.customSize } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>
      {(container) => <FiltersDrawer container={container} content={{ size: "min(90vw, 40rem)" }} triggerLabel="40rem" />}
    </DrawerStage>
  ),
};

function SwipeExample({ container }: { container: HTMLElement | null }) {
  const [reason, setReason] = useState("nothing yet");
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <FiltersDrawer
        container={container}
        drawer={{ onOpenChange: (_open, details) => setReason(details.reason) }}
        content={{ side: "bottom" }}
        triggerLabel="Open the sheet"
      />
      <Text size="sm">Last change reported: {reason}. Drag the handle on a touch screen.</Text>
    </div>
  );
}

export const Swipeable: Story = {
  name: "A sheet you can swipe away",
  parameters: { docs: { source: { code: drawerSnippets.swipe } } },
  argTypes: { ...noControls },
  render: () => <DrawerStage>{(container) => <SwipeExample container={container} />}</DrawerStage>,
};

export const LongContent: Story = {
  name: "Long content scrolls, with lines only while it does",
  parameters: { docs: { source: { code: drawerSnippets.longContent } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>
      {(container) => (
        <FiltersDrawer container={container}>
          {Array.from({ length: 24 }, (_, index) => (
            <Text key={index} size="sm">
              Result {index + 1}: a line of content that makes the body taller than the panel.
            </Text>
          ))}
        </FiltersDrawer>
      )}
    </DrawerStage>
  ),
};

export const NonModal: Story = {
  name: "Docked, without a scrim",
  parameters: { docs: { source: { code: drawerSnippets.nonModal } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>
      {(container) => (
        <FiltersDrawer container={container} drawer={{ modal: false }} triggerLabel="Inspector" />
      )}
    </DrawerStage>
  ),
};

function ControlledExample({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <Button onClick={() => setOpen(true)}>Open from state</Button>
      <Text size="sm">The drawer is {open ? "open" : "closed"}.</Text>
      <FiltersDrawer container={container} drawer={{ open, onOpenChange: setOpen }} triggerLabel="Trigger" />
    </div>
  );
}

export const Controlled: Story = {
  name: "Controlled",
  parameters: { docs: { source: { code: drawerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: () => <DrawerStage>{(container) => <ControlledExample container={container} />}</DrawerStage>,
};

function BusyExample({ container }: { container: HTMLElement | null }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button>Open and save</Button>
      </Drawer.Trigger>
      <Drawer.Content container={container} busy={busy}>
        <Drawer.Header>
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Saving keeps the panel open for two seconds.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Footer>
          <Button
            isLoading={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                setOpen(false);
              }, 2000);
            }}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export const WhileItIsBusy: Story = {
  name: "While it is busy",
  parameters: { docs: { source: { code: drawerSnippets.busy } } },
  argTypes: { ...noControls },
  render: () => <DrawerStage>{(container) => <BusyExample container={container} />}</DrawerStage>,
};

export const KeepsItsForm: Story = {
  name: "Keeps what was typed",
  parameters: { docs: { source: { code: drawerSnippets.keepMounted } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>{(container) => <FiltersDrawer container={container} content={{ keepMounted: true }} />}</DrawerStage>
  ),
};

function ReasonExample({ container }: { container: HTMLElement | null }) {
  const [reason, setReason] = useState("nothing yet");
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
      <FiltersDrawer container={container} drawer={{ onOpenChange: (_open, details) => setReason(details.reason) }} />
      <Text size="sm">Last change reported: {reason}</Text>
    </div>
  );
}

export const KnowingWhyItClosed: Story = {
  name: "Knowing why it closed",
  parameters: { docs: { source: { code: drawerSnippets.closeReason } } },
  argTypes: { ...noControls },
  render: () => <DrawerStage>{(container) => <ReasonExample container={container} />}</DrawerStage>,
};

export const WithAConfirmation: Story = {
  name: "Opened over by a confirmation",
  parameters: { docs: { source: { code: drawerSnippets.confirmation } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage minBlockSize="34rem">
      {(container) => (
        <Drawer>
          <Drawer.Trigger asChild>
            <Button>Settings</Button>
          </Drawer.Trigger>
          <Drawer.Content container={container}>
            <Drawer.Header>
              <Drawer.Title>Settings</Drawer.Title>
              <Drawer.Description>Open the confirmation, then press Escape: it answers first.</Drawer.Description>
            </Drawer.Header>
            <Drawer.Footer>
              <ConfirmDialog
                container={container}
                trigger={<Button variant="destructive">Delete account</Button>}
                tone="danger"
                scrimOpacity={40}
                title="Delete account?"
                description="It cannot be undone."
                labels={{ confirm: "Delete", cancel: "Keep it" }}
              />
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      )}
    </DrawerStage>
  ),
};

export const RightToLeft: Story = {
  name: "In right-to-left text",
  parameters: { docs: { source: { code: drawerSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <DrawerStage>
      {(container) => (
        <FiltersDrawer container={container} content={{ side: "start", dir: "rtl" }} triggerLabel="القائمة" />
      )}
    </DrawerStage>
  ),
};

// A hidden twin of the Playground: opening and closing changes the page's state, so a shown story must not do it
// on its own.
export const OpenAndEscapeInteraction: Story = {
  name: "Open, then Escape — interaction test",
  tags: ["!dev"],
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const stage = within(canvasElement);
    const trigger = await stage.findByRole("button", { name: "Filters" });
    await userEvent.click(trigger);
    const drawer = await within(canvasElement).findByRole("dialog", { name: "Filters" });
    await expect(drawer).toHaveAccessibleDescription("Narrow the list of results.");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(canvasElement).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
