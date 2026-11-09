import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { Responsive } from "@dbm-system/utils";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Fragment, useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { navigationMenuPlaygroundSnippet, navigationMenuSnippets } from "./NavigationMenu.snippets";
import type {
  NavigationMenuController,
  NavigationMenuCurrentMatch,
  NavigationMenuCurrentType,
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuOrientation,
  NavigationMenuPanelAlign,
  NavigationMenuPanelSize,
  NavigationMenuPresentation,
  NavigationMenuProps,
  NavigationMenuSize,
} from "./NavigationMenu.types";
import { Aligned, DemoItems, DemoMenu, DemoNavbarMenu, DemoNavigation, MenuStage, RichItems } from "./NavigationMenuStoryKit";

// The root's args in one Playground, in the one order the Docs table and the Controls panel use.
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
  currentType: NavigationMenuCurrentType;
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

type ArgName = keyof PlaygroundArgs;

/** Switches off the controls of the props a story fixes (or never reads), so every control that is left drives its canvas. */
const pinned = (...names: ArgName[]) => Object.fromEntries(names.map((name) => [name, { control: false as const }])) as Partial<Record<ArgName, { control: false }>>;

/** What the stacked form never reads: the floating panels' settings and timers. */
const stackedIgnores: ArgName[] = ["viewport", "panelAlign", "panelSize", "orientation", "indicator", "delayDuration", "skipDelayDuration"];

/** The args a menu in a story is given: the Playground's, less what a story supplies itself. */
function menuArgs(args: PlaygroundArgs) {
  const { children: _children, value: _value, onValueChange: _change, onOpenChangeComplete: _complete, controllerRef: _controller, id: _id, ...rest } = args;
  return rest;
}

const readOnly = (description: string) => ({ control: false as const, description });

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/NavigationMenu",
  parameters: { layout: "padded" },
  decorators: [
    // `defaultValue` is only read when the menu mounts, so changing its control remounts it.
    (Story, context) => (
      <Fragment key={String(context.args.defaultValue)}>
        <Story />
      </Fragment>
    ),
  ],
  // The keys are in the one order the Properties table uses (`propOrder` in the Docs page), which is the Controls panel's order.
  argTypes: {
    children: readOnly("The items: a NavigationMenu.List holding NavigationMenu.Items. The Playground draws a fixed set; see the stories below."),
    value: readOnly("The value of the item whose panel is open (\"\" for none). Controlled: pass it with onValueChange. See the Controlled story."),
    defaultValue: {
      control: { type: "select", labels: { "": "None", products: "Products", solutions: "Solutions" } },
      options: ["", "products", "solutions"],
      description: "The initial open item for uncontrolled usage, ignored once value is provided. None opens nothing. The menu remounts when this changes.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: readOnly("Called with the value of the item whose panel is now open, or \"\" when the last one closed."),
    onOpenChangeComplete: readOnly("Called once a panel has finished opening, or the last one has finished closing, with the item's value: onValueChange says a change started, this says it is done."),
    controllerRef: readOnly("Gives code outside the menu a way to open and close it: open(value) and close(), each saying whether it had anything to do, and the open value."),
    presentation: {
      control: "radio",
      options: ["mega", "stacked"],
      description:
        "How the menu is drawn: a row of triggers whose panels open under them (mega), or a vertical list of disclosure buttons (stacked), for a phone or a side panel. A width map such as { base: \"stacked\", md: \"mega\" } chooses by screen width.",
      table: { defaultValue: { summary: '"mega"' } },
    },
    exclusive: {
      control: "boolean",
      description: "Whether more than one item can be open at once in the stacked form. Off, opening one closes the others. Not read in the mega form.",
      if: { arg: "presentation", eq: "stacked" },
      table: { defaultValue: { summary: "true" } },
    },
    viewport: {
      control: "boolean",
      description: "One panel area shared by every item and resized between them, or (false) a panel under its own item.",
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: "true" } },
    },
    panelAlign: {
      control: "select",
      options: ["start", "center", "end", "auto"],
      description:
        "Where a panel sits: lined up with its start edge, centred, lined up with its end edge, or auto (start, unless there is more room toward the start side). Logical, so start is the right edge in right-to-left text.",
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: '"start"' } },
    },
    panelSize: {
      control: "select",
      options: ["auto", "sm", "md", "lg", "full"],
      description:
        "How wide a panel is: as wide as its content wants (auto), a fixed width, or (full) the width of the nearest positioned ancestor: a sticky Navbar is one, and otherwise the box to span needs position: relative.",
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: '"auto"' } },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The direction the triggers run: a bar with panels under them, or a column with panels beside them.",
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    indicator: {
      control: "boolean",
      description: "Draws a small arrow from the open item's trigger to its panel, sliding between triggers. Needs the shared panel area and the horizontal direction.",
      if: { arg: "viewport", truthy: true },
      table: { defaultValue: { summary: "false" } },
    },
    currentPath: {
      control: "text",
      description:
        "The path of the current page. A link whose href is this path is the current page, and so is the trigger of the panel that holds it. A link's own current wins. Choosing a link in these demos makes it the current page.",
    },
    currentMatch: {
      control: "radio",
      options: ["exact", "prefix"],
      description: "How currentPath is matched: the whole path, or the path and everything under it.",
      if: { arg: "currentPath", truthy: true },
      table: { defaultValue: { summary: '"exact"' } },
    },
    currentType: {
      control: "radio",
      options: ["page", "location"],
      description: "What a current link is announced as (its aria-current): page, for links to pages, or location, for links to places in one page, such as an outline's sections.",
      table: { defaultValue: { summary: '"page"' } },
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
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: "200" } },
    },
    skipDelayDuration: {
      control: { type: "number", min: 0, step: 50 },
      description: "How long, in milliseconds, after a panel closes that moving onto another trigger opens its panel at once.",
      if: { arg: "presentation", neq: "stacked" },
      table: { defaultValue: { summary: "300" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the primitive and every part around it. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: readOnly("Text the menu supplies itself (the landmark's name, the external-link cue, a split trigger's caret), merged over the English defaults."),
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
    currentPath: "/pricing",
    currentMatch: "exact",
    currentType: "page",
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
  render: (args) => (
    <MenuStage height="30rem">
      <DemoMenu {...menuArgs(args)} id={args.id} />
    </MenuStage>
  ),
  parameters: { docs: { source: playgroundSource } },
};

export const OwnPanels: Story = {
  name: "A panel under its own item",
  argTypes: pinned("viewport", "indicator"),
  render: (args) => (
    <MenuStage>
      <DemoMenu {...menuArgs(args)} viewport={false} />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.ownPanels } } },
};

export const Stacked: Story = {
  name: "Stacked",
  argTypes: pinned("presentation", "defaultValue", ...stackedIgnores),
  render: (args) => (
    <div style={{ inlineSize: "18rem" }}>
      <DemoMenu {...menuArgs(args)} presentation="stacked" defaultValue="products" />
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.stacked } } },
};

export const CurrentVariants: Story = {
  name: "How the current page is marked",
  argTypes: pinned("currentVariant", "aria-label", "presentation", ...stackedIgnores),
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["underline", "subtle", "solid"] as const).map((variant) => (
        <DemoMenu key={variant} {...menuArgs(args)} presentation="mega" currentVariant={variant} aria-label={`Primary, ${variant}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.currentVariants } } },
};

export const Sizes: Story = {
  argTypes: pinned("size", "aria-label", "presentation", ...stackedIgnores),
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DemoMenu key={size} {...menuArgs(args)} presentation="mega" size={size} aria-label={`Primary ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.sizes } } },
};

export const Rounded: Story = {
  argTypes: pinned("rounded", "currentVariant", "presentation", ...stackedIgnores),
  render: (args) => <DemoMenu {...menuArgs(args)} presentation="mega" rounded currentVariant="subtle" />,
  parameters: { docs: { source: { code: navigationMenuSnippets.rounded } } },
};

export const SplitTrigger: Story = {
  name: "A trigger that is also a link",
  argTypes: pinned("presentation", ...stackedIgnores.filter((name) => name === "orientation" || name === "indicator")),
  render: (args) => (
    <MenuStage>
      <DemoNavigation {...menuArgs(args)}>
        <RichItems splitProducts />
      </DemoNavigation>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.split } } },
};

export const RichPanels: Story = {
  name: "Rich panels",
  argTypes: pinned("presentation", "orientation", "indicator"),
  render: (args) => (
    <MenuStage height="30rem">
      <DemoNavigation {...menuArgs(args)}>
        <RichItems />
      </DemoNavigation>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.richPanel } } },
};

export const PanelAlignment: Story = {
  name: "Where a panel sits",
  argTypes: pinned("panelAlign", "presentation", "orientation", "indicator"),
  render: (args) => (
    <MenuStage height="30rem">
      <Aligned>
        <DemoNavigation {...menuArgs(args)} panelAlign="auto">
          <RichItems />
        </DemoNavigation>
      </Aligned>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.panelAlign } } },
};

export const PanelSizes: Story = {
  name: "Panel widths",
  argTypes: pinned("panelSize", "presentation", "orientation", "indicator"),
  render: (args) => (
    <MenuStage height="30rem">
      <DemoMenu {...menuArgs(args)} panelSize="md" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.panelSizes } } },
};

export const Vertical: Story = {
  argTypes: pinned("orientation", "presentation", "indicator", "panelAlign"),
  render: (args) => (
    <MenuStage height="30rem">
      <div style={{ inlineSize: "14rem" }}>
        <DemoMenu {...menuArgs(args)} orientation="vertical" />
      </div>
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.vertical } } },
};

export const WithIndicator: Story = {
  name: "With an indicator",
  argTypes: pinned("indicator", "presentation", "orientation", "viewport"),
  render: (args) => (
    <MenuStage>
      <DemoMenu {...menuArgs(args)} indicator viewport />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.indicator } } },
};

export const FromThePath: Story = {
  name: "The current page from a path",
  argTypes: pinned("currentPath", "presentation", "orientation", "indicator"),
  render: (args) => (
    <MenuStage>
      <DemoMenu {...menuArgs(args)} currentPath="/analytics" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.currentPath } } },
};

export const StackedSeveralOpen: Story = {
  name: "Stacked, several open",
  argTypes: pinned("presentation", "exclusive", "currentPath", "defaultValue", ...stackedIgnores),
  render: (args) => (
    <div style={{ inlineSize: "18rem" }}>
      <DemoMenu {...menuArgs(args)} presentation="stacked" exclusive={false} currentPath="/analytics" />
    </div>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.stackedSeveralOpen } } },
};

export const FromOutside: Story = {
  name: "Opened from outside",
  argTypes: pinned("defaultValue", "presentation", "orientation", "indicator"),
  render: function FromOutsideMenu(args) {
    const controller = useRef<NavigationMenuController>(null);
    const [done, setDone] = useState("nothing yet");
    return (
      <MenuStage>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)", marginBlockEnd: "var(--dbm-space-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => controller.current?.open("products")}>
            Open Products
          </Button>
          <Button variant="secondary" size="sm" onClick={() => controller.current?.close()}>
            Close
          </Button>
        </div>
        <p style={{ marginBlock: "0 var(--dbm-space-3)" }}>Finished: {done}</p>
        <DemoNavigation {...menuArgs(args)} defaultValue="" controllerRef={controller} onOpenChangeComplete={(open, value) => setDone(`${value} ${open ? "opened" : "closed"}`)}>
          <DemoItems />
        </DemoNavigation>
      </MenuStage>
    );
  },
  parameters: { docs: { source: { code: navigationMenuSnippets.controller } } },
};

export const Controlled: Story = {
  argTypes: pinned("defaultValue", "presentation", "orientation", "indicator"),
  render: function ControlledMenu(args) {
    const [open, setOpen] = useState("");
    return (
      <MenuStage>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)", marginBlockEnd: "var(--dbm-space-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => setOpen("solutions")}>
            Open Solutions
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setOpen("")}>
            Close
          </Button>
        </div>
        <p style={{ marginBlock: "0 var(--dbm-space-3)" }}>Open item: {open === "" ? "none" : open}</p>
        <DemoNavigation {...menuArgs(args)} defaultValue={undefined} value={open} onValueChange={setOpen}>
          <DemoItems />
        </DemoNavigation>
      </MenuStage>
    );
  },
  parameters: { docs: { source: { code: navigationMenuSnippets.controlled } } },
};

export const InNavbar: Story = {
  name: "Inside a Navbar",
  // The bar sets the menu's text size and takes the look, rounding and direction; the menu is the bar's, so it has no presentation of its own.
  argTypes: pinned("presentation", "size", "orientation", "indicator", "exclusive", "defaultValue"),
  render: (args) => (
    <MenuStage>
      <DemoNavbarMenu {...menuArgs(args)} defaultValue="" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.inNavbar } } },
};

export const RightToLeft: Story = {
  name: "In right-to-left text",
  argTypes: pinned("dir", "presentation", "orientation", "indicator"),
  render: (args) => (
    <MenuStage>
      <DemoMenu {...menuArgs(args)} dir="rtl" />
    </MenuStage>
  ),
  parameters: { docs: { source: { code: navigationMenuSnippets.rightToLeft } } },
};

export const OpensByKeyboard: Story = {
  name: "Opens by keyboard — interaction test",
  tags: ["!dev"],
  argTypes: pinned(...(Object.keys(meta.argTypes ?? {}) as ArgName[])),
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
