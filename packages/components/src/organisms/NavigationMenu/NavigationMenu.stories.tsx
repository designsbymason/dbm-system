import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { Responsive } from "@dbm-system/utils";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import { navigationMenuPlaygroundSnippet, navigationMenuSnippets } from "./NavigationMenu.snippets";
import type {
  NavigationMenuController,
  NavigationMenuCurrentMatch,
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuOrientation,
  NavigationMenuPanelAlign,
  NavigationMenuPanelSize,
  NavigationMenuPresentation,
  NavigationMenuProps,
  NavigationMenuSize,
} from "./NavigationMenu.types";
import { Aligned, DemoItems, DemoMenu, DemoNavbarMenu, MenuStage, RichItems } from "./NavigationMenuStoryKit";
import { NavigationMenu } from "./NavigationMenu";

interface PlaygroundArgs {
  children?: NavigationMenuProps["children"];
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  onOpenChangeComplete?: (open: boolean, value: string) => void;
  controllerRef?: NavigationMenuProps["controllerRef"];
  presentation: Responsive<NavigationMenuPresentation>;
  exclusive: boolean;
  viewport: boolean;
  panelAlign: NavigationMenuPanelAlign;
  panelSize: NavigationMenuPanelSize;
  orientation: NavigationMenuOrientation;
  indicator: boolean;
  currentPath: string;
  currentMatch: NavigationMenuCurrentMatch;
  size: NavigationMenuSize;
  currentVariant: NavigationMenuCurrentVariant;
  rounded: boolean;
  delayDuration: number;
  skipDelayDuration: number;
  dir: NavigationMenuDirection;
  labels?: NavigationMenuProps["labels"];
  "aria-label": string;
  "aria-labelledby"?: string;
  id: string;
  className?: string;
  style?: NavigationMenuProps["style"];
  "data-testid"?: string;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => navigationMenuPlaygroundSnippet(context.args),
};

const editableArgs = [
  "presentation",
  "exclusive",
  "viewport",
  "panelAlign",
  "panelSize",
  "orientation",
  "indicator",
  "currentPath",
  "currentMatch",
  "size",
  "currentVariant",
  "rounded",
  "delayDuration",
  "skipDelayDuration",
  "dir",
  "aria-label",
  "id",
] as const;

const noControls = Object.fromEntries(editableArgs.map((name) => [name, { control: false }])) as Record<
  (typeof editableArgs)[number],
  { control: false }
>;

const readOnly = (description: string) => ({ control: false as const, description });

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/NavigationMenu",
  parameters: { layout: "padded" },
  argTypes: {
    children: readOnly("The items: a NavigationMenu.List holding NavigationMenu.Items. The Playground draws a fixed set; see the stories below."),
    value: readOnly("The value of the item whose panel is open (\"\" for none). Controlled: pass it with onValueChange. See the Controlled story."),
    defaultValue: {
      control: "select",
      options: ["", "products", "solutions"],
      description: "The initial open item for uncontrolled usage, ignored once value is provided. The menu remounts when this changes.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: readOnly("Called with the value of the item whose panel is now open, or \"\" when the last one closed."),
    onOpenChangeComplete: readOnly("Called once a panel has finished opening, or the last one has finished closing, with the item's value: onValueChange says a change started, this says it is done."),
    controllerRef: readOnly("Gives code outside the menu a way to open and close it: open(value) and close(), each saying whether it had anything to do, and the open value."),
    exclusive: {
      control: "boolean",
      description: "Whether more than one item can be open at once in the stacked form. Off, opening one closes the others. Not read in the mega form.",
      table: { defaultValue: { summary: "true" } },
    },
    panelSize: {
      control: "select",
      options: ["auto", "sm", "md", "lg", "full"],
      description: "How wide a panel is: as wide as its content wants (auto), a fixed width, or (full) the width of the nearest positioned ancestor: a sticky Navbar is one, and otherwise the box to span needs position: relative.",
      table: { defaultValue: { summary: '"auto"' } },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The direction the triggers run: a bar with panels under them, or a column with panels beside them.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    indicator: {
      control: "boolean",
      description: "Draws a small arrow from the open item's trigger to its panel, sliding between triggers. Needs the shared panel area and the horizontal direction.",
      table: { defaultValue: { summary: "false" } },
    },
    currentPath: {
      control: "text",
      description: "The path of the current page. A link whose href is this path is the current page, and so is the trigger of the panel that holds it. A link's own current wins.",
    },
    currentMatch: {
      control: "radio",
      options: ["exact", "prefix"],
      description: "How currentPath is matched: the whole path, or the path and everything under it.",
      table: { defaultValue: { summary: '"exact"' } },
    },
    presentation: {
      control: "radio",
      options: ["mega", "stacked"],
      description:
        "How the menu is drawn: a row of triggers whose panels open under them (mega), or a vertical list of disclosure buttons (stacked), for a phone or a side panel. A width map such as { base: \"stacked\", md: \"mega\" } chooses by screen width.",
      table: { defaultValue: { summary: '"mega"' } },
    },
    viewport: {
      control: "boolean",
      description: "One panel area shared by every item and resized between them, or (false) a panel under its own item.",
      table: { defaultValue: { summary: "true" } },
    },
    panelAlign: {
      control: "radio",
      options: ["start", "center", "end", "auto"],
      description: "Where a panel sits: lined up with its start edge, centred, lined up with its end edge, or auto (start, unless there is more room toward the start side). Logical, so start is the right edge in right-to-left text.",
      table: { defaultValue: { summary: '"start"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The text size, icon size and padding of the triggers and links. Inside a Navbar the bar's link size applies.",
      table: { defaultValue: { summary: '"md"' } },
    },
    currentVariant: {
      control: "select",
      options: ["underline", "subtle", "solid"],
      description: "How the current page's link is marked: a brand line under it, a tinted pill, or a brand fill. aria-current is set whichever it is.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    rounded: {
      control: "boolean",
      description: "Fully rounded triggers and links (pills).",
      table: { defaultValue: { summary: "false" } },
    },
    delayDuration: {
      control: { type: "number", min: 0, step: 50 },
      description: "How long the pointer rests on a trigger, in milliseconds, before its panel opens.",
      table: { defaultValue: { summary: "200" } },
    },
    skipDelayDuration: {
      control: { type: "number", min: 0, step: 50 },
      description: "How long, in milliseconds, after a panel closes that moving onto another trigger opens its panel at once.",
      table: { defaultValue: { summary: "300" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the primitive and every part around it rather than read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: readOnly("Text the menu supplies itself (the landmark's name, the external-link cue), merged over the English defaults."),
    "aria-label": {
      control: "text",
      description: "The name of the <nav> landmark. Without it, labels.navigation.",
    },
    "aria-labelledby": readOnly("The id of an element that names the <nav> landmark; replaces the default name."),
    id: { control: false, description: "The id of the root element." },
    className: readOnly("Extra class names for the root element."),
    style: readOnly("Inline styles for the root element."),
    "data-testid": readOnly("A test id for the root element."),
  },
  args: {
    defaultValue: "",
    presentation: "mega",
    exclusive: true,
    viewport: true,
    panelAlign: "start",
    panelSize: "auto",
    orientation: "horizontal",
    indicator: false,
    currentPath: "",
    currentMatch: "exact",
    size: "md",
    currentVariant: "underline",
    rounded: false,
    delayDuration: 200,
    skipDelayDuration: 300,
    dir: "ltr",
    "aria-label": "Primary",
    id: "navigation-menu-playground",
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  render: ({ children: _children, ...args }) => (
    <MenuStage>
      <DemoMenu key={args.defaultValue} {...args} />
    </MenuStage>
  ),
  parameters: { docs: { source: playgroundSource } },
};

export const OwnPanels: Story = {
  name: "A panel under its own item",
  argTypes: { ...noControls, viewport: { control: false } },
  render: (args) => (
    <MenuStage>
      <DemoMenu {...args} viewport={false} />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.ownPanels } } },
};

export const Stacked: Story = {
  name: "Stacked",
  argTypes: { ...noControls },
  render: (args) => (
    <div style={{ inlineSize: "18rem" }}>
      <DemoMenu {...args} presentation="stacked" defaultValue="products" />
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.stacked } } },
};

export const CurrentVariants: Story = {
  name: "How the current page is marked",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["underline", "subtle", "solid"] as const).map((variant) => (
        <DemoMenu key={variant} currentVariant={variant} currentPage="pricing" aria-label={`Primary, ${variant}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.currentVariants } } },
};

export const Sizes: Story = {
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DemoMenu key={size} size={size} aria-label={`Primary ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.sizes } } },
};

export const Rounded: Story = {
  argTypes: { ...noControls },
  render: () => <DemoMenu rounded currentVariant="subtle" />,
  parameters: { docs: { source: { code: navigationMenuSnippets.rounded } } },
};

export const RightToLeft: Story = {
  name: "In right-to-left text",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <DemoMenu dir="rtl" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.rightToLeft } } },
};

export const SplitTrigger: Story = {
  name: "A trigger that is also a link",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <NavigationMenu aria-label="Primary">
        <RichItems splitProducts />
      </NavigationMenu>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.split } } },
};

export const RichPanels: Story = {
  name: "Rich panels",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage height="30rem">
      <NavigationMenu aria-label="Primary">
        <RichItems />
      </NavigationMenu>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.richPanel } } },
};

export const PanelAlignment: Story = {
  name: "Where a panel sits",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage height="30rem">
      <Aligned>
        <NavigationMenu aria-label="Primary" panelAlign="auto">
          <RichItems />
        </NavigationMenu>
      </Aligned>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.panelAlign } } },
};

export const PanelSizes: Story = {
  name: "Panel widths",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage height="30rem">
      <DemoMenu panelSize="md" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.panelSizes } } },
};

export const Vertical: Story = {
  argTypes: { ...noControls },
  render: () => (
    <MenuStage height="30rem">
      <div style={{ inlineSize: "14rem" }}>
        <DemoMenu orientation="vertical" />
      </div>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.vertical } } },
};

export const WithIndicator: Story = {
  name: "With an indicator",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <DemoMenu indicator />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.indicator } } },
};

export const FromThePath: Story = {
  name: "The current page from a path",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <DemoMenu currentPath="/analytics" currentPage="none" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.currentPath } } },
};

export const StackedSeveralOpen: Story = {
  name: "Stacked, several open",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ inlineSize: "18rem" }}>
      <DemoMenu presentation="stacked" exclusive={false} currentPath="/analytics" currentPage="none" />
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.stackedSeveralOpen } } },
};

export const FromOutside: Story = {
  name: "Opened from outside",
  argTypes: { ...noControls },
  render: function FromOutsideMenu() {
    const controller = useRef<NavigationMenuController>(null);
    const [done, setDone] = useState("nothing yet");
    return (
      <MenuStage>
        <NavigationMenu aria-label="Primary" controllerRef={controller} onOpenChangeComplete={(open, value) => setDone(`${value} ${open ? "opened" : "closed"}`)}>
          <DemoItems />
        </NavigationMenu>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)", marginBlockStart: "var(--dbm-space-3)" }}>
          <button type="button" onClick={() => controller.current?.open("products")}>
            Open Products
          </button>
          <button type="button" onClick={() => controller.current?.close()}>
            Close
          </button>
        </div>
        <p>Finished: {done}</p>
      </MenuStage>
    );
  },
  parameters: { docs: { source: { code: navigationMenuSnippets.controller } } },
};

export const Controlled: Story = {
  argTypes: { ...noControls },
  render: function ControlledMenu() {
    const [open, setOpen] = useState("");
    return (
      <MenuStage>
        <NavigationMenu aria-label="Primary" value={open} onValueChange={setOpen}>
          <DemoItems />
        </NavigationMenu>
        <p style={{ marginBlockStart: "var(--dbm-space-3)" }}>Open item: {open === "" ? "none" : open}</p>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <button type="button" onClick={() => setOpen("solutions")}>
            Open Solutions
          </button>
          <button type="button" onClick={() => setOpen("")}>
            Close
          </button>
        </div>
      </MenuStage>
    );
  },
  parameters: { docs: { source: { code: navigationMenuSnippets.controlled } } },
};

export const InNavbar: Story = {
  name: "Inside a Navbar",
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <DemoNavbarMenu />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.inNavbar } } },
};

export const OpensByKeyboard: Story = {
  name: "Opens by keyboard — interaction test",
  tags: ["!dev"],
  argTypes: { ...noControls },
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Products" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    const link = await canvas.findByRole("link", { name: /Analytics/ });
    // the panel fades in, and an element at no opacity isn't visible
    await waitFor(() => expect(link).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
