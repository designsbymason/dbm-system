import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CursorIcon,
  DotsThreeIcon,
  ImageIcon,
  LinkIcon,
  PencilSimpleIcon,
  TableIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  TrashIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Tooltip } from "../../atoms/Tooltip";
import { Popover } from "../Popover";
import { send } from "../CodeBlock/browserProtocol";
import { Select } from "../Select";
import { Toolbar } from "./Toolbar";
import { toolbarPlaygroundSnippet, toolbarSnippets } from "./Toolbar.snippets";
import type { ToolbarProps } from "./Toolbar.types";

const noControls = { control: false } as const;
const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" } as const;

// A small bar to put under test: bold, italic, a rule, then a labelled button.
const DemoItems = () => (
  <>
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
    <Toolbar.Separator />
    <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
  </>
);

const meta: Meta<ToolbarProps> = {
  title: "Molecules/Inputs/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same
  // sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    surface: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "How the bar itself is drawn: ghost (no surface of its own), outlined (a bordered bar) or filled (a tinted bar). The names Card and EmptyState use for their variant; surface here because variant is the look of the items.",
      table: { defaultValue: { summary: "ghost" } },
    },
    variant: {
      control: "select",
      options: ["ghost", "tertiary", "secondary", "primary", "destructive"],
      description: "The visual style every Toolbar.Button and Toolbar.IconButton uses unless it sets its own variant.",
      table: { defaultValue: { summary: "ghost" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the bar's padding and gaps and the default size of every item.",
      table: { defaultValue: { summary: "md" } },
    },
    rounded: {
      control: "boolean",
      description: "Fully rounded items, and a pill-shaped bar when surface draws one. Also the default for each item's own rounded.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every item in the toolbar. A disabled item can't be focused, so arrow keys skip it.",
      table: { defaultValue: { summary: "false" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Lays the items out in a row or a column; the arrow keys that move between items follow it. Also takes a mobile-first map keyed by breakpoint ({ base: \"vertical\", md: \"horizontal\" }).",
      table: { defaultValue: { summary: "horizontal" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The reading direction, which decides which arrow key goes forwards in a row. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    loop: {
      control: "boolean",
      description: "Whether the arrow keys wrap from the last item to the first, and back.",
      table: { defaultValue: { summary: "true" } },
    },
    fullWidth: {
      control: "boolean",
      description:
        "Stretches the bar to the width of its container. A bar is as wide as its items otherwise, so a Toolbar.Spacer has nothing to take up until the bar is given more room than its items need.",
      table: { defaultValue: { summary: "false" } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Where the items sit along the bar's own direction when the bar has room to spare. It follows the reading direction, so start is the right edge in a right-to-left page. No effect while a Toolbar.Spacer takes the free space, or on a bar only as wide as its items.",
      table: { defaultValue: { summary: "start" } },
    },
    overflow: {
      control: "select",
      options: ["visible", "wrap", "scroll", "menu"],
      description:
        "What a bar does when its items are more than fit. scroll (the default) keeps one line (or column) and scrolls it, with an edge fade and a button at whichever end has more; wrap wraps a horizontal bar's items onto more lines; visible lets them overflow the container; menu keeps one line and moves the items that don't fit, from the end, into a \"more\" menu. A scrolling column needs a height of its own, and menu is for a horizontal bar.",
      table: { defaultValue: { summary: "scroll" } },
    },
    labels: {
      ...noControls,
      description:
        "The text the toolbar supplies itself, with English defaults: the name of the \"more\" button of overflow=\"menu\" ({ overflow: \"More actions\" }).",
    },
    sticky: {
      ...noControls,
      description:
        "Keeps the bar at the top of the page (or of scrollContainerRef) as the reader scrolls, with a surface behind it and a shadow while it is stuck. Built on Affix. Not a live control: on this page it would pin to the Docs page itself.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      ...noControls,
      description: "How far from the top a sticky bar sticks, from the spacing token scale. Has no effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: {
      ...noControls,
      description: "The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without sticky.",
    },
    children: {
      ...noControls,
      description:
        "The toolbar's contents: Toolbar.Button, Toolbar.IconButton, Toolbar.Item, Toolbar.Group, Toolbar.Separator and Toolbar.Spacer.",
    },
    "aria-label": {
      control: "text",
      description:
        "Names the toolbar for assistive tech (\"Text formatting\") — announced when focus enters it. Required unless aria-labelledby points at a visible label.",
    },
    "aria-labelledby": { ...noControls, description: "The id of an already-visible element that names the toolbar, in place of aria-label." },
    "aria-describedby": { ...noControls, description: "The id of a helper text or description for the toolbar." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the toolbar's element." },
  },
  // Every controllable prop gets an explicit value here, matching its real default.
  args: {
    surface: "ghost",
    variant: "ghost",
    size: "md",
    rounded: false,
    disabled: false,
    orientation: "horizontal",
    dir: "ltr",
    loop: true,
    fullWidth: false,
    align: "start",
    overflow: "scroll",
    "aria-label": "Text formatting",
  },
  render: (args) => (
    <Toolbar {...args}>
      <DemoItems />
    </Toolbar>
  ),
};

export default meta;

type Story = StoryObj<ToolbarProps>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => toolbarPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // A ghost bar has no edge of its own, so the Playground starts drawn to be visible.
  args: { surface: "outlined" },
  parameters: playgroundSource,
};

export const Surfaces: Story = {
  name: "Bar surfaces",
  parameters: { docs: { source: { code: toolbarSnippets.surfaces } } },
  argTypes: { surface: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((surface) => (
        <Toolbar key={surface} {...args} surface={surface} aria-label={`${surface} bar`}>
          <DemoItems />
        </Toolbar>
      ))}
    </div>
  ),
};

export const ItemVariants: Story = {
  name: "Item variants",
  parameters: { docs: { source: { code: toolbarSnippets.variants } } },
  args: { surface: "outlined" },
  argTypes: { variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["ghost", "tertiary", "secondary", "primary", "destructive"] as const).map((variant) => (
        <Toolbar key={variant} {...args} variant={variant} aria-label={`${variant} items`}>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
          <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
        </Toolbar>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: toolbarSnippets.sizes } } },
  args: { surface: "outlined" },
  argTypes: { size: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Toolbar key={size} {...args} size={size} aria-label={`Size ${size}`}>
          <DemoItems />
        </Toolbar>
      ))}
    </div>
  ),
};

export const Rounded: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.rounded } } },
  args: { rounded: true, surface: "outlined" },
  argTypes: { rounded: noControls },
  render: (args) => (
    <Toolbar {...args}>
      <DemoItems />
    </Toolbar>
  ),
};

export const Groups: Story = {
  name: "Groups and separators",
  parameters: { docs: { source: { code: toolbarSnippets.groups } } },
  args: { surface: "outlined", "aria-label": "Editor" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Group aria-label="Text style">
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="History">
        <Toolbar.IconButton icon={ArrowCounterClockwiseIcon} aria-label="Undo" />
        <Toolbar.IconButton icon={ArrowClockwiseIcon} aria-label="Redo" />
      </Toolbar.Group>
    </Toolbar>
  ),
};

export const WithSpacer: Story = {
  name: "With a spacer",
  parameters: { docs: { source: { code: toolbarSnippets.spacer } } },
  args: { surface: "outlined", variant: "secondary", fullWidth: true, "aria-label": "Document" },
  argTypes: { variant: noControls, fullWidth: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
      <Toolbar.Spacer />
      <Toolbar.Button variant="primary">Publish</Toolbar.Button>
    </Toolbar>
  ),
};

export const Align: Story = {
  name: "Aligning the items",
  parameters: { docs: { source: { code: toolbarSnippets.align } } },
  args: { surface: "outlined", fullWidth: true },
  argTypes: { align: noControls, fullWidth: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ ...column, alignItems: "stretch" }}>
      {(["center", "end"] as const).map((align) => (
        <Toolbar key={align} {...args} align={align} aria-label={`align ${align}`}>
          <DemoItems />
        </Toolbar>
      ))}
    </div>
  ),
};

export const Toggles: Story = {
  name: "Toggle buttons",
  parameters: { docs: { source: { code: toolbarSnippets.toggles } } },
  args: { surface: "outlined", "aria-label": "Text style" },
  argTypes: { "aria-label": noControls },
  render: function Render(args) {
    const [bold, setBold] = useState(true);
    return (
      <Toolbar {...args}>
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" pressed={bold} onPressedChange={setBold} />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" defaultPressed={false} />
      </Toolbar>
    );
  },
};

export const Vertical: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.vertical } } },
  args: { orientation: "vertical", surface: "outlined", "aria-label": "Tools" },
  argTypes: { orientation: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
      <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
      <Toolbar.Separator />
      <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
    </Toolbar>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "A column on a phone, a row from md up",
  parameters: { docs: { source: { code: toolbarSnippets.responsive } } },
  args: { surface: "outlined", variant: "secondary", orientation: { base: "vertical", md: "horizontal" }, "aria-label": "Actions" },
  argTypes: { orientation: noControls, variant: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
    </Toolbar>
  ),
};

export const Wrapping: Story = {
  name: "Wrapping onto more lines",
  parameters: { docs: { source: { code: toolbarSnippets.wrap } } },
  args: { overflow: "wrap", surface: "outlined", variant: "secondary", "aria-label": "Actions" },
  argTypes: { overflow: noControls, variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ maxWidth: "16rem" }}>
      <Toolbar {...args}>
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Button>Share</Toolbar.Button>
        <Toolbar.Button>Export</Toolbar.Button>
        <Toolbar.Button>Archive</Toolbar.Button>
      </Toolbar>
    </div>
  ),
};

export const OverflowMenu: Story = {
  name: "Overflowing into a menu",
  parameters: { docs: { source: { code: toolbarSnippets.overflowMenu } } },
  args: { overflow: "menu", surface: "outlined", variant: "secondary", "aria-label": "Document actions" },
  argTypes: { overflow: noControls, variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minWidth: "10rem", resize: "horizontal", overflow: "hidden", padding: "var(--dbm-space-1)" }}>
      <Toolbar {...args}>
        <Toolbar.Button pinned>Save</Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" pressed />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
        <Toolbar.ToggleGroup type="single" aria-label="Alignment" defaultValue="left">
          <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Left" />
          <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Centre" />
          <Toolbar.ToggleItem value="right" icon={TextAlignRightIcon} aria-label="Right" />
        </Toolbar.ToggleGroup>
        <Toolbar.Separator />
        <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
        <Toolbar.Button leadingIcon={ImageIcon}>Image</Toolbar.Button>
        <Toolbar.Button leadingIcon={TrashIcon} variant="destructive">
          Delete
        </Toolbar.Button>
      </Toolbar>
    </div>
  ),
};

export const Scrolling: Story = {
  name: "Scrolling in one line",
  parameters: { docs: { source: { code: toolbarSnippets.scroll } } },
  args: { surface: "outlined", variant: "secondary", "aria-label": "Actions" },
  argTypes: { variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ maxWidth: "18rem" }}>
      <Toolbar {...args}>
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Button>Share</Toolbar.Button>
        <Toolbar.Button>Export</Toolbar.Button>
        <Toolbar.Button>Archive</Toolbar.Button>
        <Toolbar.Button>Duplicate</Toolbar.Button>
        <Toolbar.Button>Delete</Toolbar.Button>
      </Toolbar>
    </div>
  ),
};

export const ScrollingColumn: Story = {
  name: "Scrolling in a column",
  parameters: { docs: { source: { code: toolbarSnippets.scrollColumn } } },
  args: { orientation: "vertical", surface: "outlined", "aria-label": "Tools" },
  argTypes: { orientation: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ height: "10rem" }}>
      <Toolbar {...args}>
        <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
        <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
        <Toolbar.IconButton icon={TextBIcon} aria-label="Text" />
        <Toolbar.IconButton icon={LinkIcon} aria-label="Link" />
        <Toolbar.IconButton icon={ImageIcon} aria-label="Image" />
        <Toolbar.IconButton icon={TableIcon} aria-label="Table" />
        <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
      </Toolbar>
    </div>
  ),
};

export const Sticky: Story = {
  name: "Sticky",
  parameters: { docs: { source: { code: toolbarSnippets.sticky } } },
  args: { sticky: true, surface: "outlined", "aria-label": "Text formatting" },
  argTypes: { sticky: noControls, "aria-label": noControls },
  // Stuck to the top of a box that scrolls (`scrollContainerRef`), not of the Docs page.
  render: function Render(args) {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
      <div ref={scrollRef} style={{ height: "14rem", overflow: "auto", border: "var(--dbm-border-width-1) solid var(--dbm-border-default)" }}>
        <Toolbar {...args} scrollContainerRef={scrollRef}>
          <DemoItems />
        </Toolbar>
        <div style={{ padding: "var(--dbm-space-4)", display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
          {["One", "Two", "Three", "Four", "Five", "Six"].map((label) => (
            <Text key={label}>Scroll this box: the toolbar stays at the top. Paragraph {label}.</Text>
          ))}
        </div>
      </div>
    );
  },
};

export const AttachedGroup: Story = {
  name: "Attached groups",
  parameters: { docs: { source: { code: toolbarSnippets.attached } } },
  args: { surface: "outlined", variant: "secondary", "aria-label": "Editor" },
  argTypes: { variant: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Group aria-label="Text style" attached>
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
        <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="History">
        <Toolbar.IconButton icon={ArrowCounterClockwiseIcon} aria-label="Undo" />
        <Toolbar.IconButton icon={ArrowClockwiseIcon} aria-label="Redo" />
      </Toolbar.Group>
    </Toolbar>
  ),
};

export const ToggleGroups: Story = {
  name: "Single and multiple choice",
  parameters: { docs: { source: { code: toolbarSnippets.toggleGroups } } },
  args: { surface: "outlined", "aria-label": "Text formatting" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.ToggleGroup aria-label="Text style" type="multiple">
        <Toolbar.ToggleItem value="bold" icon={TextBIcon} aria-label="Bold" />
        <Toolbar.ToggleItem value="italic" icon={TextItalicIcon} aria-label="Italic" />
      </Toolbar.ToggleGroup>
      <Toolbar.Separator />
      <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left">
        <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Align left" />
        <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Align centre" />
        <Toolbar.ToggleItem value="right" icon={TextAlignRightIcon} aria-label="Align right" />
      </Toolbar.ToggleGroup>
    </Toolbar>
  ),
};

export const WithTooltips: Story = {
  name: "Icon buttons with tooltips",
  parameters: { docs: { source: { code: toolbarSnippets.tooltips } } },
  args: { surface: "outlined", "aria-label": "Text formatting" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <div style={{ paddingBlockStart: "var(--dbm-space-10)" }}>
      <Toolbar {...args}>
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip />
        <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" tooltip="Underline (Ctrl+U)" />
      </Toolbar>
    </div>
  ),
};

export const WithSelectAndPopover: Story = {
  name: "A select and a popover",
  parameters: { docs: { source: { code: toolbarSnippets.selectAndPopover } } },
  args: { surface: "outlined", "aria-label": "Editor" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Item>
        <Select aria-label="Font size" placeholder="Size" size="sm" defaultValue="14">
          <Select.Option value="12">12 pt</Select.Option>
          <Select.Option value="14">14 pt</Select.Option>
          <Select.Option value="18">18 pt</Select.Option>
        </Select>
      </Toolbar.Item>
      <Toolbar.Separator />
      <Popover>
        <Toolbar.Item>
          <Popover.Trigger asChild>
            <Button variant="ghost" leadingIcon={DotsThreeIcon}>
              More
            </Button>
          </Popover.Trigger>
        </Toolbar.Item>
        <Popover.Content aria-label="More options">Extra options live here.</Popover.Content>
      </Popover>
    </Toolbar>
  ),
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.disabled } } },
  args: { disabled: true, surface: "outlined", variant: "secondary", "aria-label": "Document" },
  argTypes: { disabled: noControls, variant: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Copy</Toolbar.Button>
      <Toolbar.Button>Paste</Toolbar.Button>
    </Toolbar>
  ),
};

export const Wrapped: Story = {
  name: "Wrapped in a tooltip, or a link",
  parameters: { docs: { source: { code: toolbarSnippets.wrapped } } },
  args: { surface: "outlined", "aria-label": "Document" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Tooltip content="Make it bold">
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
      </Tooltip>
      <Toolbar.Item>
        <Button variant="ghost" asChild>
          <a href="/docs" onClick={(event) => event.preventDefault()}>
            Docs
          </a>
        </Button>
      </Toolbar.Item>
    </Toolbar>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: toolbarSnippets.rtl } } },
  args: { dir: "rtl", surface: "outlined" },
  argTypes: { dir: noControls },
  render: (args) => (
    <div dir="rtl">
      <Toolbar {...args}>
        <DemoItems />
      </Toolbar>
    </div>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: toolbarSnippets.labelled } } },
  args: { surface: "outlined" },
  argTypes: { "aria-label": noControls },
  render: ({ "aria-label": _label, ...args }) => (
    <div style={column}>
      <span id="toolbar-demo-label">Formatting</span>
      <Toolbar {...args} aria-labelledby="toolbar-demo-label">
        <DemoItems />
      </Toolbar>
    </div>
  ),
};

// ---- Hidden real-browser checks (07-storybook-and-documentation-standards.md §5): what jsdom can't evaluate. ----

// The shared argTypes for the hidden checks below. `tags: ["!dev"]` is written out on each story and not shared through
// this object: Storybook's indexer reads `tags` only from a literal property, so a spread (`...hidden`) is invisible to it
// and the story stayed in the sidebar (found 2026-10-03).
const hidden = { argTypes: { surface: noControls } } satisfies Partial<Story>;

const Items = ({ count = 3 }: { count?: number }) => (
  <>
    {["Bold", "Italic", "Underline"].slice(0, count).map((label, index) => (
      <Toolbar.IconButton key={label} icon={[TextBIcon, TextItalicIcon, TextUnderlineIcon][index]!} aria-label={label} />
    ))}
  </>
);

export const KeyboardInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Keyboard — interaction test",
  args: { surface: "outlined" },
  render: (args) => (
    <>
      <button>before</button>
      <Toolbar {...args}>
        <Items />
      </Toolbar>
      <button>after</button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    const bold = canvas.getByRole("button", { name: "Bold" });
    await expect(bold).toHaveFocus();
    // The focus ring is drawn on real keyboard focus (jsdom can't evaluate `:focus-visible`).
    await expect(bold.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(bold).outlineStyle).not.toBe("none");
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Italic" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "after" })).toHaveFocus();
  },
};

export const RightToLeftInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Right to left — interaction test",
  args: { dir: "rtl", surface: "outlined" },
  render: (args) => (
    <div dir="rtl">
      <Toolbar {...args}>
        <Items />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [bold, italic] = [canvas.getByRole("button", { name: "Bold" }), canvas.getByRole("button", { name: "Italic" })];
    // First item sits at the right in a right-to-left page, and the arrow that points left goes forwards.
    await expect(bold.getBoundingClientRect().left).toBeGreaterThan(italic.getBoundingClientRect().left);
    await userEvent.tab();
    await expect(bold).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(italic).toHaveFocus();
  },
};

export const LayoutInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Layout — interaction test",
  args: { surface: "outlined", variant: "secondary", fullWidth: true },
  render: (args) => (
    <div style={{ width: "30rem" }}>
      <Toolbar {...args} data-testid="bar">
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Separator data-testid="rule" />
        <Toolbar.Button>Share</Toolbar.Button>
        <Toolbar.Spacer />
        <Toolbar.Button variant="primary">Publish</Toolbar.Button>
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar").getBoundingClientRect();
    const publish = canvas.getByRole("button", { name: "Publish" }).getBoundingClientRect();
    const share = canvas.getByRole("button", { name: "Share" }).getBoundingClientRect();
    // The spacer pushes Publish to the far end of the bar (its padding and border aside), away from Share.
    await expect(bar.right - publish.right).toBeLessThan(20);
    await expect(publish.left - share.right).toBeGreaterThan(40);
    // The rule is a visible vertical line between the two buttons, not collapsed to nothing.
    const rule = canvas.getByTestId("rule").getBoundingClientRect();
    await expect(rule.width).toBeGreaterThan(0);
    await expect(rule.width).toBeLessThan(4);
    await expect(rule.height).toBeGreaterThan(16);
  },
};

export const AlignInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Align — interaction test",
  args: { surface: "outlined", fullWidth: true },
  render: (args) => (
    <div style={{ width: "30rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {(["start", "center", "end"] as const).map((align) => (
        <Toolbar key={align} {...args} align={align} aria-label={align} data-testid={align}>
          <Items count={2} />
        </Toolbar>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gap = (align: string) => {
      const bar = canvas.getByTestId(align).getBoundingClientRect();
      const buttons = within(canvas.getByTestId(align)).getAllByRole("button").map((b) => b.getBoundingClientRect());
      return { before: buttons[0]!.left - bar.left, after: bar.right - buttons[buttons.length - 1]!.right };
    };
    const [start, center, end] = [gap("start"), gap("center"), gap("end")];
    await expect(start.before).toBeLessThan(start.after);
    await expect(Math.abs(center.before - center.after)).toBeLessThan(2);
    await expect(end.after).toBeLessThan(end.before);
  },
};

export const FocusRingInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Focus ring over a neighbour — interaction test",
  // Pinned to `visible`: this checks the ring drawn *outside* the item, over its neighbour. A scrolling bar draws it inside
  // instead (checked by "Scrolling").
  args: { surface: "outlined", overflow: "visible" },
  render: (args) => (
    <Toolbar {...args}>
      <Items />
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const bold = canvas.getByRole("button", { name: "Bold" });
    const italic = canvas.getByRole("button", { name: "Italic" });
    await expect(bold).toHaveFocus();
    // The ring reaches further than the gap to the next item (the offset plus the line), so it overlaps it, and flex
    // items paint in source order: the focused one has to be positioned to be drawn above its later neighbour.
    const style = getComputedStyle(bold);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    await expect(italic.getBoundingClientRect().left - bold.getBoundingClientRect().right).toBeLessThan(reach);
    await expect(style.position).toBe("relative");
    await expect(getComputedStyle(italic).position).toBe("static");
  },
};

const ScrollItems = () => (
  <>
    {["Edit", "Share", "Export", "Archive", "Duplicate", "Delete"].map((label) => (
      <Toolbar.Button key={label}>{label}</Toolbar.Button>
    ))}
  </>
);

export const ScrollInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Scrolling — interaction test",
  args: { overflow: "scroll", surface: "outlined", variant: "secondary" },
  render: (args) => (
    <div style={{ width: "16rem" }}>
      <Toolbar {...args} aria-label="Actions" data-testid="bar">
        <ScrollItems />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const frame = bar.parentElement!;
    // Wider than the frame: the end has more, the start doesn't, and the end button and fade show.
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "true"));
    await expect(frame).toHaveAttribute("data-overflow-start", "false");
    const [startButton, endButton] = [...frame.querySelectorAll<HTMLButtonElement>(":scope > button")];
    // (the fade and button ease in, so read them once the transition has finished)
    await waitFor(() => expect(getComputedStyle(endButton!).opacity).toBe("1"));
    await waitFor(() => expect(getComputedStyle(frame, "::after").opacity).toBe("1"));
    await expect(getComputedStyle(startButton!).opacity).toBe("0");
    await expect(getComputedStyle(frame, "::before").opacity).toBe("0");
    // The buttons are at least 24 × 24 and a press never takes focus.
    const box = endButton!.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(box.height).toBeGreaterThanOrEqual(24);
    await userEvent.click(endButton!);
    await waitFor(() => expect(bar.scrollLeft).toBeGreaterThan(0));
    await expect(document.activeElement).not.toBe(endButton);
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-start", "true"));
    // The keyboard reaches the last item and the bar scrolls it into view.
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    const last = canvas.getByRole("button", { name: "Delete" });
    await expect(last).toHaveFocus();
    await waitFor(() => expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(bar.getBoundingClientRect().right + 1));
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "false"));
    // Its ring is drawn inside the item, so the scrolling box can't cut it off.
    await expect(parseFloat(getComputedStyle(last).outlineOffset)).toBeLessThan(0);
  },
};

export const ScrollRightToLeftInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Scrolling, right to left — interaction test",
  args: { overflow: "scroll", surface: "outlined", variant: "secondary", dir: "rtl" },
  render: (args) => (
    <div dir="rtl" style={{ width: "16rem" }}>
      <Toolbar {...args} aria-label="Actions" data-testid="bar">
        <ScrollItems />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const frame = bar.parentElement!;
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "true"));
    await expect(frame).toHaveAttribute("data-overflow-start", "false");
    // The end of a right-to-left bar is its left edge: the end button and fade are there.
    const endButton = frame.querySelectorAll<HTMLButtonElement>(":scope > button")[1]!;
    await expect(endButton.getBoundingClientRect().left - frame.getBoundingClientRect().left).toBeLessThan(4);
    await userEvent.click(endButton);
    await waitFor(() => expect(bar.scrollLeft).toBeLessThan(0));
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-start", "true"));
  },
};

export const ScrollColumnInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Scrolling column — interaction test",
  args: { overflow: "scroll", orientation: "vertical", surface: "outlined" },
  render: (args) => (
    <div style={{ height: "8rem" }}>
      <Toolbar {...args} aria-label="Tools" data-testid="bar">
        <Items />
        <Toolbar.IconButton icon={LinkIcon} aria-label="Link" />
        <Toolbar.IconButton icon={ImageIcon} aria-label="Image" />
        <Toolbar.IconButton icon={TableIcon} aria-label="Table" />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const frame = bar.parentElement!;
    await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "true"));
    await expect(bar.scrollHeight).toBeGreaterThan(bar.clientHeight);
    await expect(getComputedStyle(bar).overflowY).toBe("auto");
    await userEvent.click(frame.querySelectorAll<HTMLButtonElement>(":scope > button")[1]!);
    await waitFor(() => expect(bar.scrollTop).toBeGreaterThan(0));
  },
};

export const StickyInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Sticky — interaction test",
  // Pinned to `visible`: the stuck state is on the bar itself here; a scrolling bar carries it on its frame (checked by
  // "Forced colours").
  args: { sticky: true, surface: "ghost", overflow: "visible" },
  render: function Render(args) {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
      <div ref={scrollRef} data-testid="scroller" style={{ height: "10rem", overflow: "auto" }}>
        <Toolbar {...args} aria-label="Formatting" scrollContainerRef={scrollRef} data-testid="bar">
          <Items />
        </Toolbar>
        <div style={{ height: "40rem" }} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const scroller = canvas.getByTestId("scroller");
    await expect(bar).not.toHaveAttribute("data-stuck");
    // A ghost bar still gets a surface when sticky, so what scrolls beneath doesn't show through.
    await expect(getComputedStyle(bar).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    scroller.scrollTop = 300;
    await waitFor(() => expect(bar).toHaveAttribute("data-stuck"));
    await expect(getComputedStyle(bar).boxShadow).not.toBe("none");
    await expect(Math.abs(bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top)).toBeLessThan(2);
    scroller.scrollTop = 0;
    await waitFor(() => expect(bar).not.toHaveAttribute("data-stuck"));
  },
};

export const AttachedInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Attached group — interaction test",
  args: { surface: "outlined", variant: "secondary" },
  render: (args) => (
    <Toolbar {...args} aria-label="Editor">
      <Toolbar.Group aria-label="Text style" attached data-testid="group">
        <Items />
      </Toolbar.Group>
      <Toolbar.Button>Link</Toolbar.Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = within(canvas.getByTestId("group")).getAllByRole("button");
    // Fused: no gap between neighbours, square corners where they meet, rounded at the ends.
    const [first, second] = [group[0]!.getBoundingClientRect(), group[1]!.getBoundingClientRect()];
    await expect(Math.abs(second.left - first.right)).toBeLessThan(2);
    await expect(getComputedStyle(group[0]!).borderStartEndRadius).toBe("0px");
    await expect(getComputedStyle(group[1]!).borderStartStartRadius).toBe("0px");
    await expect(parseFloat(getComputedStyle(group[0]!).borderStartStartRadius)).toBeGreaterThan(0);
    // The bar is still one tab stop and the arrow keys run through the fused group into the button after it.
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Link" })).toHaveFocus();
  },
};

export const ToggleGroupInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Toggle group in a toolbar — interaction test",
  args: { surface: "outlined" },
  render: (args) => (
    <>
      <button>before</button>
      <Toolbar {...args} aria-label="Formatting">
        <Toolbar.Button>Link</Toolbar.Button>
        <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left">
          <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Align left" />
          <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Align centre" />
        </Toolbar.ToggleGroup>
      </Toolbar>
      <button>after</button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Link" })).toHaveFocus();
    // One tab stop in the whole bar: with focus inside it, exactly one item has a tab index of 0.
    const bar = within(canvas.getByRole("toolbar"));
    const items = [...bar.getAllByRole("button"), ...bar.getAllByRole("radio")];
    await expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1);
    // Tab leaves the bar from its first item: the toggle group adds no tab stop of its own.
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "after" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("button", { name: "Link" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "Align left" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "Align centre" })).toHaveFocus();
    await expect(canvas.getByRole("radio", { name: "Align centre" })).toHaveAttribute("aria-checked", "true");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "after" })).toHaveFocus();
  },
};

export const TooltipInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Tooltip — interaction test",
  args: { surface: "outlined" },
  render: (args) => (
    <div style={{ paddingBlockStart: "4rem" }}>
      <Toolbar {...args} aria-label="Formatting">
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip data-testid="with" />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" data-testid="without" />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A tooltip adds no box of its own: the two buttons are the same size.
    const [withTip, without] = [canvas.getByTestId("with"), canvas.getByTestId("without")];
    await expect(withTip.getBoundingClientRect().width).toBe(without.getBoundingClientRect().width);
    await expect(withTip.getBoundingClientRect().height).toBe(without.getBoundingClientRect().height);
    await userEvent.tab();
    const tooltip = await within(document.body).findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("Bold");
    // Above its button, not over a neighbour.
    await expect(tooltip.getBoundingClientRect().bottom).toBeLessThanOrEqual(withTip.getBoundingClientRect().top + 1);
  },
};

export const RevealInteraction: Story = {
  tags: ["!dev"],
  ...hidden,
  name: "Focus scrolls the item fully into view — interaction test",
  args: { overflow: "scroll", surface: "outlined", variant: "secondary" },
  render: (args) => (
    <div style={{ width: "16rem" }}>
      <Toolbar {...args} aria-label="Actions" data-testid="bar">
        {["Edit", "Share", "Export", "Archive", "Duplicate", "Delete", "Rename", "Move"].map((label) => (
          <Toolbar.Button key={label}>{label}</Toolbar.Button>
        ))}
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const fade = parseFloat(getComputedStyle(bar).scrollPaddingLeft);
    // A browser scrolls a focused element into view only when it is *completely* hidden, so an item cut off behind the
    // edge fade stayed cut off. Every item reached by an arrow key must end up inside the bar, clear of the fades.
    const settle = () => new Promise((resolve) => setTimeout(resolve, 450));
    const expectVisible = async (name: string, atStart: boolean, atEnd: boolean) => {
      await settle();
      const item = canvas.getByRole("button", { name }).getBoundingClientRect();
      const box = bar.getBoundingClientRect();
      // the room kept clear on a side is the fade's width, except where the bar has run out of room to scroll
      await expect(item.left - box.left).toBeGreaterThanOrEqual(atStart ? 0 : fade - 1);
      await expect(box.right - item.right).toBeGreaterThanOrEqual(atEnd ? 0 : fade - 1);
    };
    await userEvent.tab();
    await expectVisible("Edit", true, false);
    const forward = ["Share", "Export", "Archive", "Duplicate", "Delete", "Rename", "Move"];
    for (const name of forward) {
      await userEvent.keyboard("{ArrowRight}");
      await expectVisible(name, false, name === "Move");
    }
    for (const name of [...forward.slice(0, -1).reverse(), "Edit"]) {
      await userEvent.keyboard("{ArrowLeft}");
      await expectVisible(name, name === "Edit", false);
    }
  },
};

export const RevealColumnInteraction: Story = {
  tags: ["!dev"],
  ...hidden,
  name: "Focus scrolls a column item into view — interaction test",
  args: { overflow: "scroll", orientation: "vertical", surface: "outlined" },
  render: (args) => (
    // 7rem: not a whole number of items tall, so an arrow key lands on one that is only partly in view.
    <div style={{ height: "7rem" }}>
      <Toolbar {...args} aria-label="Tools" data-testid="bar">
        {["One", "Two", "Three", "Four", "Five", "Six"].map((label) => (
          <Toolbar.Button key={label} variant="secondary">
            {label}
          </Toolbar.Button>
        ))}
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    await userEvent.tab();
    for (const name of ["Two", "Three", "Four", "Five", "Six"]) {
      await userEvent.keyboard("{ArrowDown}");
      await new Promise((resolve) => setTimeout(resolve, 450));
      const item = canvas.getByRole("button", { name }).getBoundingClientRect();
      const box = bar.getBoundingClientRect();
      await expect(item.top).toBeGreaterThanOrEqual(box.top - 1);
      await expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1);
    }
  },
};

export const RevealRightToLeftInteraction: Story = {
  tags: ["!dev"],
  ...hidden,
  name: "Focus scrolls an item into view, right to left — interaction test",
  args: { overflow: "scroll", surface: "outlined", variant: "secondary", dir: "rtl" },
  render: (args) => (
    <div dir="rtl" style={{ width: "16rem" }}>
      <Toolbar {...args} aria-label="Actions" data-testid="bar">
        {["Edit", "Share", "Export", "Archive", "Duplicate", "Delete"].map((label) => (
          <Toolbar.Button key={label}>{label}</Toolbar.Button>
        ))}
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    await userEvent.tab();
    // Arrow left goes forwards in a right-to-left bar; every item reached ends up inside the bar.
    for (const name of ["Share", "Export", "Archive", "Duplicate", "Delete"]) {
      await userEvent.keyboard("{ArrowLeft}");
      await new Promise((resolve) => setTimeout(resolve, 450));
      const item = canvas.getByRole("button", { name }).getBoundingClientRect();
      const box = bar.getBoundingClientRect();
      await expect(item.left).toBeGreaterThanOrEqual(box.left - 1);
      await expect(item.right).toBeLessThanOrEqual(box.right + 1);
    }
  },
};

export const ForcedColoursInteraction: Story = {
  tags: ["!dev"],
  ...hidden,
  name: "Forced colours — interaction test",
  args: { surface: "filled", sticky: true, overflow: "scroll" },
  render: function Render(args) {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
      <div ref={scrollRef} data-testid="scroller" style={{ height: "8rem", overflow: "auto", width: "18rem" }}>
        <Toolbar {...args} aria-label="Formatting" scrollContainerRef={scrollRef} data-testid="bar">
          <Items />
          <Toolbar.Separator />
          <ScrollItems />
        </Toolbar>
        <div style={{ height: "30rem" }} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = canvas.getByTestId("scroller");
    const frame = canvas.getByTestId("bar").parentElement!;
    const separator = canvas.getByRole("separator");
    // The stuck state arrives through an IntersectionObserver, which reports a *change*. Assigning the same
    // `scrollTop` again produces none, so a first reading taken before layout had settled would never be followed
    // by another. Each attempt therefore goes back to the top and down again, a real scroll every time, and waits a
    // moment for the report; the last attempt asserts, so a real failure still fails loudly.
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let attempt = 0; attempt < 4 && !frame.hasAttribute("data-stuck"); attempt += 1) {
      scroller.scrollTop = 0;
      await nextFrame();
      await nextFrame();
      scroller.scrollTop = 200;
      try {
        await waitFor(() => expect(frame).toHaveAttribute("data-stuck"), { timeout: 1200 });
      } catch {
        // not reported yet: the next attempt scrolls again, and the assertion below is what fails the test
      }
    }
    await expect(frame).toHaveAttribute("data-stuck");
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // The separator is a background, which forced colours replaces with the page's, so it would be invisible; it names a
      // system colour instead, which is kept, and so differs from the page.
      const page = getComputedStyle(frame.parentElement!).backgroundColor;
      await expect(getComputedStyle(separator).backgroundColor).not.toBe(page);
      // A filled bar and a stuck bar lose their fill and shadow: each is bounded by a drawn outline instead.
      await expect(getComputedStyle(frame).outlineStyle).toBe("solid");
      await expect(getComputedStyle(frame).outlineWidth).not.toBe("0px");
      // The edge fades are backgrounds too, so they are dropped.
      await expect(getComputedStyle(frame, "::after").display).toBe("none");
    } finally {
      await emulate("none");
    }
  },
};

export const ScrollButtonHoverInteraction: Story = {
  tags: ["!dev"],
  ...hidden,
  name: "Scroll button hover on a filled bar — interaction test",
  args: { surface: "filled", overflow: "scroll", variant: "secondary" },
  render: (args) => (
    <div style={{ width: "14rem" }}>
      <Toolbar {...args} aria-label="Actions" data-testid="bar">
        <ScrollItems />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("bar").parentElement!;
    // A synthetic pointer never matches `:hover`, so the pairing is read from the stylesheet itself: a filled bar is
    // `bg.neutral-subtle`, so a scroll button's hover fill there has to be a different colour or it shows nothing.
    const hoverRules: string[] = [];
    const collect = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes("scrollButton") && rule.selectorText.includes(":hover") && rule.selectorText.includes("filled")) {
          hoverRules.push(rule.style.getPropertyValue("background-color"));
        } else if ("cssRules" in rule) collect((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        collect(sheet.cssRules);
      } catch {
        // a cross-origin sheet can't be read, and isn't ours
      }
    }
    await expect(hoverRules.length).toBeGreaterThan(0);
    await expect(hoverRules.join(" ")).toContain("--dbm-bg-neutral-subtle-hover");
    const style = getComputedStyle(frame);
    await expect(style.getPropertyValue("--dbm-bg-neutral-subtle-hover").trim()).not.toBe(style.getPropertyValue("--dbm-bg-neutral-subtle").trim());
  },
};

export const TargetSizeInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Target size — interaction test",
  args: { surface: "outlined" },
  render: (args) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Toolbar key={size} {...args} size={size} aria-label={`Size ${size}`}>
          <Items />
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // WCAG 2.5.8: every item is at least 24 × 24 CSS pixels, at every size.
    for (const button of within(canvasElement).getAllByRole("button")) {
      const { width, height } = button.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(24);
      await expect(height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const VerticalInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Vertical — interaction test",
  args: { surface: "outlined", orientation: "vertical" },
  render: (args) => (
    <Toolbar {...args} aria-label="Tools">
      <Items />
      <Toolbar.Separator data-testid="rule" />
      <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Bold" }).getBoundingClientRect();
    const italic = canvas.getByRole("button", { name: "Italic" }).getBoundingClientRect();
    await expect(italic.top).toBeGreaterThan(bold.top);
    const rule = canvas.getByTestId("rule").getBoundingClientRect();
    await expect(rule.height).toBeLessThan(4);
    await expect(rule.width).toBeGreaterThan(16);
  },
};

export const PhoneInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "On a phone — interaction test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  args: { surface: "outlined", orientation: { base: "vertical", md: "horizontal" } },
  render: (args) => (
    <Toolbar {...args} aria-label="Actions">
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const bar = within(canvasElement).getByRole("toolbar");
    await waitFor(() => expect(bar).toHaveAttribute("aria-orientation", "vertical"));
    await expect(getComputedStyle(bar).flexDirection).toBe("column");
  },
};

export const PressedInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Pressed toggle and separator — interaction test",
  args: { surface: "filled" },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed />
      <Toolbar.Separator data-testid="rule" />
      <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A pressed toggle is announced, not only coloured.
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    await expect(getComputedStyle(canvas.getByTestId("rule")).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};

export const OverflowMenuInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Overflow menu — interaction test",
  args: { overflow: "menu", surface: "outlined", variant: "secondary" },
  render: function Render(args) {
    const [wide, setWide] = useState(false);
    const [presses, setPresses] = useState<string[]>([]);
    return (
      <>
        <button type="button" onClick={() => setWide((value) => !value)}>
          Toggle width
        </button>
        <p data-testid="presses">{presses.join(",")}</p>
        <div data-testid="frame" style={{ width: wide ? "40rem" : "17rem" }}>
          <Toolbar {...args} aria-label="Actions" data-testid="bar">
            <Toolbar.Button pinned onClick={() => setPresses((value) => [...value, "save"])}>
              Save
            </Toolbar.Button>
            <Toolbar.Separator />
            <Toolbar.Button onClick={() => setPresses((value) => [...value, "link"])}>Link</Toolbar.Button>
            <Toolbar.Button onClick={() => setPresses((value) => [...value, "image"])}>Image</Toolbar.Button>
            <Toolbar.Button onClick={() => setPresses((value) => [...value, "export"])}>Export</Toolbar.Button>
            <Toolbar.Button onClick={() => setPresses((value) => [...value, "archive"])}>Archive</Toolbar.Button>
          </Toolbar>
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar");
    const more = canvas.getByLabelText("More actions");
    // narrow: something is in the menu, nothing spills, the pinned item and the more button are on the bar
    await waitFor(() => expect(more).not.toHaveAttribute("data-overflowed"));
    await expect(getComputedStyle(more).display).not.toBe("none");
    const hiddenItems = [...bar.querySelectorAll("[data-overflowed]")].filter((node) => node !== more);
    await expect(hiddenItems.length).toBeGreaterThan(0);
    for (const node of hiddenItems) await expect(getComputedStyle(node).display).toBe("none");
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
    const box = bar.getBoundingClientRect();
    const trigger = more.getBoundingClientRect();
    await expect(trigger.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(getComputedStyle(canvas.getByText("Save").closest("button") as HTMLElement).display).not.toBe("none");
    // the keyboard goes to the more button after the last item that is shown, and then Home returns
    const visibleButtons = [...bar.querySelectorAll<HTMLElement>("button")].filter((node) => getComputedStyle(node).display !== "none");
    const lastShown = visibleButtons[visibleButtons.length - 2] as HTMLElement;
    lastShown.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(more).toHaveFocus();
    // choosing a hidden item in the menu runs that item's own handler
    await userEvent.keyboard("{Enter}");
    const menu = await within(document.body).findByRole("menu");
    const names = within(menu).getAllByRole("menuitem").map((item) => item.textContent);
    await expect(names).toContain("Archive");
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(canvas.getByTestId("presses")).toHaveTextContent("archive"));
    await waitFor(() => expect(more).toHaveFocus());
    // wide: everything is back on the bar and the more button goes
    await userEvent.click(canvas.getByRole("button", { name: "Toggle width" }));
    await waitFor(() => expect(more).toHaveAttribute("data-overflowed"));
    await expect(bar.querySelectorAll("[data-overflowed]").length).toBe(1);
    await expect(getComputedStyle(more).display).toBe("none");
    // with room to spare the bar is only as wide as its items, as it is in every other mode (fullWidth is what fills)
    const frame = canvas.getByTestId("frame").getBoundingClientRect();
    await expect(bar.getBoundingClientRect().width).toBeLessThan(frame.width - 40);
    // and shrinking the container takes items into the menu again
    await userEvent.click(canvas.getByRole("button", { name: "Toggle width" }));
    await waitFor(() => expect(more).not.toHaveAttribute("data-overflowed"));
  },
};
