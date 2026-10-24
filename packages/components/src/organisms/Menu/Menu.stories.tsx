import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@dbm-system/icons";
import { fn } from "storybook/test";
import { useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { ConfirmDialog } from "../ConfirmDialog";
import { Dialog } from "../Dialog";
import { Menu } from "./Menu";
import { menuPlaygroundSnippet, menuSnippets } from "./Menu.snippets";
import type { MenuAlign, MenuSide, MenuSize } from "./Menu.types";
import { countries, MenuStage, type MenuStageArgs } from "./MenuStoryKit";

// Combines Menu's own root-level args (defaultOpen/modal/dir/onOpenChange) with Menu.Content's (size/side/align/…) in
// one Playground: `meta.component` can only resolve docgen argTypes for one component, so Content's are declared by
// hand below and threaded through `MenuStage`. Each sub-part still gets its own Properties table from a hidden,
// docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  defaultOpen: boolean;
  modal: boolean;
  dir: "ltr" | "rtl";
  presentation: "menu" | "sheet";
  onOpenChange: (open: boolean) => void;
  size: MenuSize;
  side: MenuSide;
  align: MenuAlign;
  sideOffset: number;
  alignOffset: number;
  avoidCollisions: boolean;
  collisionPadding: number;
  loop: boolean;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => menuPlaygroundSnippet(context.args),
};

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/Menu",
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The row height and type size of every item, label and submenu in the menu.",
      table: { defaultValue: { summary: '"md"' } },
    },
    side: {
      // A `select` of the single-value form: `Responsive<MenuSide>` (a value, or a breakpoint-keyed map) has no
      // single control shape, so the responsive form gets its own story below.
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the panel opens on, a single value (shown here) or a mobile-first map keyed by breakpoint, e.g. { base: 'bottom', lg: 'right' }.",
      table: { defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side. A menu belongs under the start edge of its button.",
      table: { defaultValue: { summary: '"start"' } },
    },
    sideOffset: {
      control: "number",
      description: "Pixel gap between the trigger and the panel along side.",
      table: { defaultValue: { summary: "4" } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along align's own axis.",
      table: { defaultValue: { summary: "0" } },
    },
    avoidCollisions: {
      control: "boolean",
      description: "Repositions the panel to stay within the viewport instead of overflowing it.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionPadding: {
      control: "number",
      description: "Minimum distance kept from the viewport edge while repositioning.",
      table: { defaultValue: { summary: "8" } },
    },
    loop: {
      control: "boolean",
      description: "Whether arrow-key movement wraps from the last item to the first and back.",
      table: { defaultValue: { summary: "false" } },
    },
    modal: {
      control: "boolean",
      description:
        "Makes the rest of the page inert and locks its scroll while the menu is open, and has a press outside only close it. Turn off for a menu that leaves the page usable behind it.",
      table: { defaultValue: { summary: "true" } },
    },
    presentation: {
      control: "inline-radio",
      options: ["menu", "sheet"],
      description:
        "How the menu is drawn: floating, or a sheet across the bottom of the screen with taller rows and a scrim, the shape a touch screen expects. Also takes a mobile-first map keyed by breakpoint.",
      table: { defaultValue: { summary: '"menu"' } },
    },
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction, passed to the menu and its submenus: it decides which side a submenu opens on and which arrow key opens and closes it.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state when uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes.",
    },
  },
  // The Controls panel lists props in the order of these keys (they are merged ahead of `argTypes`), so this is the
  // order a reader sees: content and visual props first, then behaviour.
  args: {
    size: "md",
    side: "bottom",
    align: "start",
    sideOffset: 4,
    alignOffset: 0,
    avoidCollisions: true,
    collisionPadding: 8,
    loop: false,
    modal: true,
    dir: "ltr",
    presentation: "menu",
    defaultOpen: false,
    onOpenChange: fn(),
  },
  render: (args) => (
    <MenuStage args={args}>
      <Menu.Item icon={PencilSimpleIcon} shortcut="⌘E">
        Edit
      </Menu.Item>
      <Menu.Item icon={CopyIcon} shortcut="⌘D">
        Duplicate
      </Menu.Item>
      <Menu.Separator />
      <Menu.Item icon={TrashIcon} tone="danger">
        Delete
      </Menu.Item>
    </MenuStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const IconsAndShortcuts: Story = {
  name: "Icons, shortcut hints and a danger item",
  parameters: { docs: { source: { code: menuSnippets.iconsAndShortcuts } } },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: menuSnippets.sizes } } },
  // Every step is drawn side by side, so there is no one `size` a control could stand for, and five menus held open
  // at once is not a state.
  argTypes: { size: { control: false }, defaultOpen: { control: false } },
  render: (args: MenuStageArgs) => (
    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <MenuStage key={size} args={{ ...args, size }} label={size}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
          <Menu.Item>Archive</Menu.Item>
        </MenuStage>
      ))}
    </div>
  ),
};

export const CheckboxItems: Story = {
  name: "Checkbox items",
  parameters: { docs: { source: { code: menuSnippets.checkboxItems } } },
  render: (args) => (
    <MenuStage args={args} label="View">
      <Menu.CheckboxItem defaultChecked>Show grid</Menu.CheckboxItem>
      <Menu.CheckboxItem>Show rulers</Menu.CheckboxItem>
      <Menu.CheckboxItem checked="indeterminate">Some guides</Menu.CheckboxItem>
    </MenuStage>
  ),
};

export const RadioGroup: Story = {
  name: "Radio group",
  parameters: { docs: { source: { code: menuSnippets.radioGroup } } },
  render: (args) => (
    <MenuStage args={args} label="Sort">
      <Menu.RadioGroup defaultValue="name" aria-label="Sort by">
        <Menu.RadioItem value="name">Name</Menu.RadioItem>
        <Menu.RadioItem value="modified">Date modified</Menu.RadioItem>
        <Menu.RadioItem value="size">Size</Menu.RadioItem>
      </Menu.RadioGroup>
    </MenuStage>
  ),
};

export const GroupsAndLabels: Story = {
  name: "Groups and labels",
  parameters: { docs: { source: { code: menuSnippets.groupsAndLabels } } },
  render: (args) => (
    <MenuStage args={args} label="Workspace">
      <Menu.Group>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item>Profile</Menu.Item>
        <Menu.Item>Billing</Menu.Item>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Group>
        <Menu.Label>Workspace</Menu.Label>
        <Menu.Item>Members</Menu.Item>
        <Menu.Item>Settings</Menu.Item>
      </Menu.Group>
    </MenuStage>
  ),
};

export const Submenu: Story = {
  name: "Submenus",
  parameters: { docs: { source: { code: menuSnippets.submenu } } },
  render: (args) => (
    <MenuStage args={args} label="File">
      <Menu.Item>Rename</Menu.Item>
      <Menu.Sub>
        <Menu.SubTrigger>Share</Menu.SubTrigger>
        <Menu.SubContent>
          <Menu.Item>Copy link</Menu.Item>
          <Menu.Item>Email</Menu.Item>
          <Menu.Sub>
            <Menu.SubTrigger>Social</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Post</Menu.Item>
              <Menu.Item>Message</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.SubContent>
      </Menu.Sub>
    </MenuStage>
  ),
};

export const LinkItems: Story = {
  name: "Link items",
  parameters: { docs: { source: { code: menuSnippets.linkItems } } },
  render: (args) => (
    <MenuStage args={args} label="Help">
      <Menu.Item asChild>
        <a href="#documentation">Documentation</a>
      </Menu.Item>
      <Menu.Item asChild>
        <a href="#changelog">Changelog</a>
      </Menu.Item>
    </MenuStage>
  ),
};

export const DisabledItems: Story = {
  name: "Disabled items",
  parameters: { docs: { source: { code: menuSnippets.disabledItems } } },
  render: (args) => (
    <MenuStage args={args}>
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item disabled>Duplicate</Menu.Item>
      <Menu.Item>Archive</Menu.Item>
    </MenuStage>
  ),
};

export const RowActions: Story = {
  name: "An icon-only trigger for row actions",
  parameters: { docs: { source: { code: menuSnippets.rowActions } } },
  // A menu at the end of a row aligns to the end of its trigger.
  args: { align: "end" },
  render: (args) => (
    <MenuStage
      args={args}
      trigger={<IconButton icon={DotsThreeIcon} aria-label="Row actions" variant="ghost" />}
    >
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item>Duplicate</Menu.Item>
      <Menu.Separator />
      <Menu.Item tone="danger">Delete</Menu.Item>
    </MenuStage>
  ),
};

export const ResponsiveSide: Story = {
  name: "Responsive side (below on mobile, beside from lg up)",
  parameters: { docs: { source: { code: menuSnippets.responsiveSide } } },
  // `side` is the responsive map below, which no single control can express.
  argTypes: { side: { control: false } },
  render: (args) => (
    <MenuStage args={{ ...args, side: { base: "bottom", lg: "right" } }} label="Resize the viewport">
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item>Duplicate</Menu.Item>
      <Menu.Item>Archive</Menu.Item>
    </MenuStage>
  ),
};

export const LongMenu: Story = {
  name: "A long menu scrolls",
  parameters: { docs: { source: { code: menuSnippets.longMenu } } },
  render: (args) => (
    <MenuStage args={args} label="Country">
      {countries.map((country) => (
        <Menu.Item key={country}>{country}</Menu.Item>
      ))}
    </MenuStage>
  ),
};

export const DescriptionsAndTrailing: Story = {
  name: "Descriptions and trailing content",
  parameters: { docs: { source: { code: menuSnippets.descriptions } } },
  render: (args) => (
    <MenuStage args={args} label="Account">
      <Menu.Item description="Plan and invoices" trailing={<Badge tone="info">New</Badge>}>
        Billing
      </Menu.Item>
      <Menu.Item description="People with access" trailing="12">
        Members
      </Menu.Item>
      <Menu.Item description="Keys and webhooks" shortcut="⌘.">
        Developer
      </Menu.Item>
    </MenuStage>
  ),
};

export const AsyncAction: Story = {
  name: "An action that takes time",
  parameters: { docs: { source: { code: menuSnippets.asyncAction } } },
  render: (args) => (
    <MenuStage args={args} label="Export">
      <Menu.Item
        icon={DownloadSimpleIcon}
        onSelect={() => new Promise((resolve) => setTimeout(resolve, 1500))}
      >
        Export as CSV
      </Menu.Item>
      <Menu.Item icon={CopyIcon}>Copy link</Menu.Item>
    </MenuStage>
  ),
};

export const StayOpen: Story = {
  name: "An action that keeps the menu open",
  parameters: { docs: { source: { code: menuSnippets.closeOnSelect } } },
  render: (args) => (
    <MenuStage args={args} label="Data">
      <Menu.Item closeOnSelect={false} onSelect={fn()}>
        Refresh
      </Menu.Item>
      <Menu.Item>Close</Menu.Item>
    </MenuStage>
  ),
};

export const DisabledReason: Story = {
  name: "A disabled item that says why",
  parameters: { docs: { source: { code: menuSnippets.disabledReason } } },
  render: (args) => (
    <MenuStage args={args}>
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item disabled disabledReason="You need the admin role to delete">
        Delete
      </Menu.Item>
      <Menu.Item disabled>Archive</Menu.Item>
    </MenuStage>
  ),
};

function DeleteRow({ args }: { args: MenuStageArgs }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-8)" }}>
        <Menu modal={args.modal} dir={args.dir}>
          <Menu.Trigger asChild>
            <Button variant="secondary">Actions</Button>
          </Menu.Trigger>
          <Menu.Content size={args.size}>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item tone="danger" onSelect={() => setConfirming(true)}>
              Delete
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this row?"
        description="This can't be undone."
        labels={{ confirm: "Delete" }}
      />
    </>
  );
}

export const OpensADialog: Story = {
  name: "An item that opens a confirmation",
  parameters: { docs: { source: { code: menuSnippets.opensADialog } } },
  // The menu is a fixed trigger and two items; only the settings the story passes through are live.
  argTypes: {
    defaultOpen: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    loop: { control: false },
  },
  render: (args) => <DeleteRow args={args} />,
};

export const InsideDialog: Story = {
  name: "Opened from inside a Dialog",
  parameters: { docs: { source: { code: menuSnippets.insideDialog } } },
  // The menu inside the dialog is fixed content; the controls drive nothing here.
  argTypes: {
    defaultOpen: { control: false },
    modal: { control: false },
    dir: { control: false },
    size: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    loop: { control: false },
  },
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open settings</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Settings</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Menu>
            <Menu.Trigger asChild>
              <Button variant="secondary">Theme</Button>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Light</Menu.Item>
              <Menu.Item>Dark</Menu.Item>
            </Menu.Content>
          </Menu>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: menuSnippets.rightToLeft } } },
  args: { dir: "rtl" },
  render: (args) => (
    <div dir={args.dir}>
      <MenuStage args={args}>
        <Menu.Item>Edit</Menu.Item>
        <Menu.Sub>
          <Menu.SubTrigger>Share</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item>Copy link</Menu.Item>
            <Menu.Item>Email</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
        <Menu.Item>Archive</Menu.Item>
      </MenuStage>
    </div>
  ),
};

export const Sheet: Story = {
  name: "As a sheet",
  parameters: { docs: { source: { code: menuSnippets.sheet } } },
  // The story is the sheet, so the control that chooses between the two has nothing to do here.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <MenuStage args={{ ...args, presentation: "sheet" }}>
      <Menu.Item>Rename</Menu.Item>
      <Menu.Item>Duplicate</Menu.Item>
      <Menu.Sub>
        <Menu.SubTrigger>Share</Menu.SubTrigger>
        <Menu.SubContent>
          <Menu.Item>Copy link</Menu.Item>
          <Menu.Item>Email</Menu.Item>
        </Menu.SubContent>
      </Menu.Sub>
      <Menu.Separator />
      <Menu.Item tone="danger">Delete</Menu.Item>
    </MenuStage>
  ),
};

export const ResponsivePresentation: Story = {
  name: "A sheet on a phone, a menu from md up",
  parameters: { docs: { source: { code: menuSnippets.responsivePresentation } } },
  // `presentation` is the responsive map below, which no single control can express.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <MenuStage args={{ ...args, presentation: { base: "sheet", md: "menu" } }} label="Resize the viewport">
      <Menu.Item>Rename</Menu.Item>
      <Menu.Item>Duplicate</Menu.Item>
      <Menu.Item>Archive</Menu.Item>
    </MenuStage>
  ),
};
