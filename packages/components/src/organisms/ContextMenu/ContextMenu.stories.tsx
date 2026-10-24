import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { CopyIcon, DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { fn } from "storybook/test";
import { useRef, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { ConfirmDialog } from "../ConfirmDialog";
import { Dialog } from "../Dialog";
import { Menu } from "../Menu";
import { countries } from "../Menu/MenuStoryKit";
import { ContextMenu } from "./ContextMenu";
import { contextMenuPlaygroundSnippet, contextMenuSnippets } from "./ContextMenu.snippets";
import type { ContextMenuController, ContextMenuSize } from "./ContextMenu.types";
import { Area, ContextMenuStage, contentPropsOf, rootPropsOf, type ContextMenuStageArgs } from "./ContextMenuStoryKit";

// Combines ContextMenu's own root-level args (modal/dir/onOpenChange) with ContextMenu.Content's (size/alignOffset/…)
// in one Playground: `meta.component` can only resolve docgen argTypes for one component, so Content's are declared by
// hand below and threaded through `ContextMenuStage`. Each sub-part still gets its own Properties table from a
// hidden, docs-only stories file (guidelines/adr/0013). `defaultOpen` is left out: a menu that opens before any press
// has no position, so it is for tests.
interface PlaygroundArgs {
  modal: boolean;
  dir: "ltr" | "rtl";
  presentation: "menu" | "sheet";
  onOpenChange: (open: boolean) => void;
  size: ContextMenuSize;
  alignOffset: number;
  avoidCollisions: boolean;
  collisionPadding: number;
  loop: boolean;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => contextMenuPlaygroundSnippet(context.args),
};

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Overlay/ContextMenu",
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The row height and type size of every item, label and submenu in the menu.",
      table: { defaultValue: { summary: '"md"' } },
    },
    alignOffset: {
      control: "number",
      description:
        "Pixel offset of the panel from the point that was pressed, along the pointer's own line. A context menu is placed at the pointer, so it takes no side, align or sideOffset.",
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
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes.",
    },
  },
  // The Controls panel lists props in the order of these keys (they are merged ahead of `argTypes`), so this is the
  // order a reader sees: content and visual props first, then behaviour.
  args: {
    size: "md",
    alignOffset: 0,
    avoidCollisions: true,
    collisionPadding: 8,
    loop: false,
    modal: true,
    dir: "ltr",
    presentation: "menu",
    onOpenChange: fn(),
  },
  render: (args) => (
    <ContextMenuStage args={args}>
      <ContextMenu.Item icon={PencilSimpleIcon} shortcut="F2">
        Rename
      </ContextMenu.Item>
      <ContextMenu.Item icon={CopyIcon} shortcut="⌘D">
        Duplicate
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item icon={TrashIcon} tone="danger">
        Delete
      </ContextMenu.Item>
    </ContextMenuStage>
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
  parameters: { docs: { source: { code: contextMenuSnippets.iconsAndShortcuts } } },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: contextMenuSnippets.sizes } } },
  // Every step is drawn side by side, so there is no one `size` a control could stand for.
  argTypes: { size: { control: false } },
  render: (args: ContextMenuStageArgs) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ContextMenuStage key={size} args={{ ...args, size }} label={`Size ${size}`}>
          <ContextMenu.Item>Rename</ContextMenu.Item>
          <ContextMenu.Item>Duplicate</ContextMenu.Item>
          <ContextMenu.Item>Archive</ContextMenu.Item>
        </ContextMenuStage>
      ))}
    </div>
  ),
};

export const CheckboxItems: Story = {
  name: "Checkbox items",
  parameters: { docs: { source: { code: contextMenuSnippets.checkboxItems } } },
  render: (args) => (
    <ContextMenuStage args={args} label="View options">
      <ContextMenu.CheckboxItem defaultChecked>Show grid</ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem>Show rulers</ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem checked="indeterminate">Some guides</ContextMenu.CheckboxItem>
    </ContextMenuStage>
  ),
};

export const RadioGroup: Story = {
  name: "Radio group",
  parameters: { docs: { source: { code: contextMenuSnippets.radioGroup } } },
  render: (args) => (
    <ContextMenuStage args={args} label="Sort order">
      <ContextMenu.RadioGroup defaultValue="name" aria-label="Sort by">
        <ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="modified">Date modified</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="size">Size</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
    </ContextMenuStage>
  ),
};

export const GroupsAndLabels: Story = {
  name: "Groups and labels",
  parameters: { docs: { source: { code: contextMenuSnippets.groupsAndLabels } } },
  render: (args) => (
    <ContextMenuStage args={args} label="A file">
      <ContextMenu.Group>
        <ContextMenu.Label>Open</ContextMenu.Label>
        <ContextMenu.Item>Open</ContextMenu.Item>
        <ContextMenu.Item>Open in a new tab</ContextMenu.Item>
      </ContextMenu.Group>
      <ContextMenu.Separator />
      <ContextMenu.Group>
        <ContextMenu.Label>Organize</ContextMenu.Label>
        <ContextMenu.Item>Move</ContextMenu.Item>
        <ContextMenu.Item>Rename</ContextMenu.Item>
      </ContextMenu.Group>
    </ContextMenuStage>
  ),
};

export const Submenu: Story = {
  name: "Submenus",
  parameters: { docs: { source: { code: contextMenuSnippets.submenu } } },
  render: (args) => (
    <ContextMenuStage args={args} label="A file">
      <ContextMenu.Item>Rename</ContextMenu.Item>
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item>Copy link</ContextMenu.Item>
          <ContextMenu.Item>Email</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenuStage>
  ),
};

export const DescriptionsAndTrailing: Story = {
  name: "Descriptions and trailing content",
  parameters: { docs: { source: { code: contextMenuSnippets.descriptions } } },
  render: (args) => (
    <ContextMenuStage args={args} label="An account">
      <ContextMenu.Item description="Plan and invoices" trailing={<Badge tone="info">New</Badge>}>
        Billing
      </ContextMenu.Item>
      <ContextMenu.Item description="People who can open this">Members</ContextMenu.Item>
    </ContextMenuStage>
  ),
};

export const AsyncAction: Story = {
  name: "An action that takes time",
  parameters: { docs: { source: { code: contextMenuSnippets.asyncAction } } },
  render: (args) => (
    <ContextMenuStage args={args} label="A table">
      <ContextMenu.Item onSelect={() => new Promise<void>((resolve) => setTimeout(resolve, 1500))}>
        Export as CSV
      </ContextMenu.Item>
    </ContextMenuStage>
  ),
};

export const DisabledReason: Story = {
  name: "A disabled item that says why",
  parameters: { docs: { source: { code: contextMenuSnippets.disabledReason } } },
  render: (args) => (
    <ContextMenuStage args={args} label="A file">
      <ContextMenu.Item>Rename</ContextMenu.Item>
      <ContextMenu.Item disabled disabledReason="Only an owner can delete this">
        Delete
      </ContextMenu.Item>
    </ContextMenuStage>
  ),
};

export const LongMenu: Story = {
  name: "A long menu scrolls",
  parameters: { docs: { source: { code: contextMenuSnippets.longMenu } } },
  render: (args) => (
    <ContextMenuStage args={args} label="Countries">
      {countries.map((country) => (
        <ContextMenu.Item key={country}>{country}</ContextMenu.Item>
      ))}
    </ContextMenuStage>
  ),
};

const files = ["quarterly-report.pdf", "team-photo.png", "budget.xlsx"];

function FileRows({ args }: { args: ContextMenuStageArgs }) {
  return (
    <div style={{ maxInlineSize: "28rem" }} role="list" aria-label="Files">
      {files.map((file) => (
        <ContextMenu key={file} {...rootPropsOf(args)}>
          <ContextMenu.Trigger asChild tabIndex={0}>
            <div
              role="listitem"
              style={{
                alignItems: "center",
                borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
                color: "var(--dbm-text-primary)",
                display: "flex",
                fontFamily: "var(--dbm-font-family-primary)",
                justifyContent: "space-between",
                padding: "var(--dbm-space-2) var(--dbm-space-3)",
              }}
            >
              {file}
              {/* The same actions are on the row's own button: a context menu is a shortcut, never the only way. */}
              <Menu>
                <Menu.Trigger asChild>
                  <IconButton icon={DotsThreeIcon} aria-label={`Actions for ${file}`} variant="ghost" size="sm" />
                </Menu.Trigger>
                <Menu.Content align="end">
                  <Menu.Item icon={PencilSimpleIcon}>Rename</Menu.Item>
                  <Menu.Item icon={TrashIcon} tone="danger">
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content {...contentPropsOf(args)}>
            <ContextMenu.Item icon={PencilSimpleIcon}>Rename</ContextMenu.Item>
            <ContextMenu.Item icon={TrashIcon} tone="danger">
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      ))}
    </div>
  );
}

export const OnRows: Story = {
  name: "On a list of rows, with a button for the same actions",
  parameters: { docs: { source: { code: contextMenuSnippets.rows } } },
  render: (args) => <FileRows args={args} />,
};

export const FromAButtonAndAKey: Story = {
  name: "Opened from a button, and from a key",
  parameters: { docs: { source: { code: contextMenuSnippets.fromCode } } },
  render: function Render(args) {
    const menu = useRef<ContextMenuController>(null);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "start" }}>
        <ContextMenu controllerRef={menu} {...rootPropsOf(args)}>
          <ContextMenu.Trigger
            tabIndex={0}
            aria-label="Project card. Right-click, or press Alt+ArrowDown."
            openOnKeys={["Alt+ArrowDown"]}
            style={{
              border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
              borderRadius: "var(--dbm-radius-md)",
              color: "var(--dbm-text-secondary)",
              display: "block",
              fontFamily: "var(--dbm-font-family-primary)",
              padding: "var(--dbm-space-6)",
            }}
          >
            Right-click, or focus here and press Alt+ArrowDown
          </ContextMenu.Trigger>
          <ContextMenu.Content {...contentPropsOf(args)}>
            <ContextMenu.Item>Rename</ContextMenu.Item>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
        <Button variant="secondary" onClick={(event) => menu.current?.openFrom(event.currentTarget)}>
          Actions
        </Button>
      </div>
    );
  },
};

export const OpensADialog: Story = {
  name: "An item that opens a confirmation",
  parameters: { docs: { source: { code: contextMenuSnippets.opensADialog } } },
  render: function Render(args) {
    const [confirming, setConfirming] = useState(false);
    return (
      <>
        <ContextMenu {...rootPropsOf(args)}>
          <Area label="quarterly-report.pdf — right-click, then Delete" />
          <ContextMenu.Content {...contentPropsOf(args)}>
            <ContextMenu.Item>Rename</ContextMenu.Item>
            <ContextMenu.Item tone="danger" onSelect={() => setConfirming(true)}>
              Delete…
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Delete quarterly-report.pdf?"
          description="This can't be undone."
          labels={{ confirm: "Delete" }}
          onConfirm={() => setConfirming(false)}
        />
      </>
    );
  },
};

export const InsideDialog: Story = {
  name: "Opened from inside a Dialog",
  parameters: { docs: { source: { code: contextMenuSnippets.insideDialog } } },
  // The whole story is one fixed example, so the Controls panel has nothing of its own to drive.
  argTypes: {
    size: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    loop: { control: false },
    modal: { control: false },
    dir: { control: false },
  },
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <IconButton icon={DotsThreeIcon} aria-label="Open the files dialog" variant="secondary" />
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Files</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <ContextMenu>
            <Area />
            <ContextMenu.Content>
              <ContextMenu.Item>Rename</ContextMenu.Item>
              <ContextMenu.Item>Duplicate</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: contextMenuSnippets.rightToLeft } } },
  args: { dir: "rtl" },
  render: (args) => (
    <div dir="rtl">
      <ContextMenuStage args={args} label="انقر بزر الفأرة الأيمن هنا">
        <ContextMenu.Item>إعادة تسمية</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>مشاركة</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>نسخ الرابط</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenuStage>
    </div>
  ),
};

export const Sheet: Story = {
  name: "As a sheet",
  parameters: { docs: { source: { code: contextMenuSnippets.sheet } } },
  // The story is the sheet, so the control that chooses between the two has nothing to do here.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <ContextMenuStage args={{ ...args, presentation: "sheet" }} label="Press and hold, or right-click">
      <ContextMenu.Item>Rename</ContextMenu.Item>
      <ContextMenu.Item>Duplicate</ContextMenu.Item>
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item>Copy link</ContextMenu.Item>
          <ContextMenu.Item>Email</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
      <ContextMenu.Separator />
      <ContextMenu.Item tone="danger">Delete</ContextMenu.Item>
    </ContextMenuStage>
  ),
};

export const ResponsivePresentation: Story = {
  name: "A sheet on a phone, a menu from md up",
  parameters: { docs: { source: { code: contextMenuSnippets.responsivePresentation } } },
  // `presentation` is the responsive map below, which no single control can express.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <ContextMenuStage args={{ ...args, presentation: { base: "sheet", md: "menu" } }} label="Resize the viewport, then right-click">
      <ContextMenu.Item>Rename</ContextMenu.Item>
      <ContextMenu.Item>Duplicate</ContextMenu.Item>
      <ContextMenu.Item>Archive</ContextMenu.Item>
    </ContextMenuStage>
  ),
};
