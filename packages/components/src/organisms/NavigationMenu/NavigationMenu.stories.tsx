import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { Responsive } from "@dbm-system/utils";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { navigationMenuPlaygroundSnippet, navigationMenuSnippets } from "./NavigationMenu.snippets";
import type {
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuPanelAlign,
  NavigationMenuPresentation,
  NavigationMenuProps,
  NavigationMenuSize,
} from "./NavigationMenu.types";
import { DemoItems, DemoMenu, DemoNavbarMenu, MenuStage } from "./NavigationMenuStoryKit";
import { NavigationMenu } from "./NavigationMenu";

interface PlaygroundArgs {
  children?: NavigationMenuProps["children"];
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  presentation: Responsive<NavigationMenuPresentation>;
  viewport: boolean;
  panelAlign: NavigationMenuPanelAlign;
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
  "viewport",
  "panelAlign",
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
      options: ["start", "center"],
      description: "Where a panel sits: lined up with its start edge, or centred under the menu (under its own item with viewport false).",
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
    viewport: true,
    panelAlign: "start",
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
