import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BellIcon, BookOpenIcon, ChartBarIcon, DotsThreeIcon, FolderSimpleIcon, GearIcon, HouseIcon, PlusIcon, ReceiptIcon, TrayIcon, UsersIcon } from "@dbm-system/icons";
import type { SpaceValue } from "@dbm-system/utils";
import { Avatar } from "../../atoms/Avatar";
import { Badge } from "../../atoms/Badge";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Menu } from "../Menu";
import { Sidebar } from "./Sidebar";
import { sidebarPlaygroundSnippet, sidebarSnippets } from "./Sidebar.snippets";
import type {
  SidebarCollapseBelow,
  SidebarCurrentVariant,
  SidebarProps,
  SidebarSide,
  SidebarSize,
  SidebarVariant,
} from "./Sidebar.types";
import {
  DemoSidebar,
  DemoTopBar,
  FilterableSidebar,
  SidebarFrame,
  SidebarStage,
  SidebarViewModeContext,
  useRememberedCollapsed,
} from "./SidebarStoryKit";

// Sidebar's root-level args in one Playground, every prop listed in the one order the Docs table uses: the ones a person can
// edit have a control, and the rest (children, callbacks, objects, the standard attributes) show as "–". Each sub-part
// gets its own Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  children?: ReactNode;
  variant: SidebarVariant;
  size: SidebarSize;
  currentVariant: SidebarCurrentVariant;
  currentPath?: string;
  rounded: boolean;
  width: string;
  panelWidth: string;
  side: SidebarSide;
  peek: boolean;
  collapsed?: boolean;
  defaultCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  collapseBelow: SidebarCollapseBelow;
  menuOpen?: boolean;
  defaultMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onMenuOpenChangeComplete: (open: boolean) => void;
  closeMenuOnNavigate: boolean;
  exclusive: boolean;
  menuContainer?: HTMLElement | null;
  sticky: boolean;
  stickyOffset: SpaceValue;
  dir: "ltr" | "rtl";
  labels?: SidebarProps["labels"];
  id: string;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => sidebarPlaygroundSnippet(context.args),
};

/** The Playground's editable props, which every other story switches off (each shows one fixed arrangement). */
const editableArgs = [
  "variant",
  "size",
  "currentVariant",
  "rounded",
  "width",
  "panelWidth",
  "side",
  "peek",
  "defaultCollapsed",
  "collapseBelow",
  "defaultMenuOpen",
  "closeMenuOnNavigate",
  "exclusive",
  "sticky",
  "stickyOffset",
  "dir",
  "id",
] as const;

const noControls = Object.fromEntries(editableArgs.map((name) => [name, { control: false }])) as Record<
  (typeof editableArgs)[number],
  { control: false }
>;

// Controls with no live editing, listed so the panel names every prop the sidebar takes.
const readOnly = (description: string) => ({ control: false as const, description });

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/Sidebar",
  parameters: { layout: "padded" },
  decorators: [
    // `defaultCollapsed` and `defaultMenuOpen` are only read when the sidebar mounts, so changing a control remounts it.
    (Story, context) => (
      <Fragment key={`${String(context.args.defaultCollapsed)}-${String(context.args.defaultMenuOpen)}`}>
        <SidebarViewModeContext.Provider value={context.viewMode === "docs" ? "docs" : "story"}>
          <Story />
        </SidebarViewModeContext.Provider>
      </Fragment>
    ),
  ],
  argTypes: {
    children: readOnly(
      "The sidebar's parts, in reading order: Sidebar.Header, Sidebar.Content holding one or more Sidebar.Navs, and Sidebar.Footer, any of them optional. The Playground draws a fixed one; see the stories below for other arrangements.",
    ),
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost", "floating"],
      description:
        "How the sidebar itself is drawn: a surface with a line along its inner edge, the same surface with no line, nothing of its own so the items sit on the page, or a floating card set in from the page's edges with rounded corners and a shadow.",
      table: { defaultValue: { summary: '"outlined"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description:
        "The height of an item and its icon and text size, on the same scale as Navbar's links. The collapsed rail is as wide as an item of this step plus the sidebar's padding.",
      table: { defaultValue: { summary: '"md"' } },
    },
    currentVariant: {
      control: "select",
      options: ["subtle", "bar", "solid"],
      description:
        "How the current item is marked: a tinted pill, a brand line along its start edge, or a brand fill. aria-current is set whichever it is, and the look is the same in the phone panel.",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    currentPath: readOnly(
      "The path of the page the reader is on (from your router), so each item marks itself from its href with no current written on it, and a group that holds one is current too. The Playground's items are marked by hand, so see the story below.",
    ),
    rounded: {
      control: "boolean",
      description:
        "Fully rounded items: each item and group button is a pill, with the current item's tint or fill following the shape. The items round, not the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    width: {
      control: "text",
      placeholder: "16rem",
      description:
        "The expanded width, a CSS length such as 18rem (a number in code is pixels). Empty leaves the sidebar.width token. The rail's width does not change with it.",
      table: { defaultValue: { summary: "the sidebar.width token" } },
    },
    panelWidth: {
      control: "text",
      description:
        "The width of the phone panel alone, below collapseBelow: a CSS length such as 20rem (a number in code is pixels). Empty leaves it the same as width. The panel is never wider than the window less a sliver of the page.",
      table: { defaultValue: { summary: "width" } },
    },
    side: {
      control: "radio",
      options: ["start", "end"],
      description:
        "Which edge of the page the sidebar sits against: it sets which edge its line is on and which side the phone panel slides in from. start is the right in right-to-left text.",
      table: { defaultValue: { summary: '"start"' } },
    },
    peek: {
      control: "boolean",
      description:
        "Lets a sidebar collapsed to a rail open as an overlay while the pointer is over it or focus is inside it, so the labels can be read without expanding it for good. The rail keeps its width in the page; the open sidebar is drawn over the content. A mouse only (focus works everywhere).",
      table: { defaultValue: { summary: "false" } },
    },
    collapsed: readOnly(
      "Whether the sidebar is a rail of icons (controlled). Pair with onCollapsedChange. The Playground lets the sidebar manage it (see defaultCollapsed).",
    ),
    defaultCollapsed: {
      control: "boolean",
      description: "Starts the sidebar as a rail. Only read when the sidebar mounts, so changing it redraws the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: readOnly("Called with the new value when the collapse button is pressed or setCollapsed is called."),
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the sidebar leaves the page for a menu button and a panel. It follows the window's width, not the demo's frame: resize the window to see it.",
      table: { defaultValue: { summary: '"md"' } },
    },
    menuOpen: readOnly(
      "Whether the phone panel is open (controlled). Pair with onMenuOpenChange. The Playground lets the sidebar manage it (see defaultMenuOpen).",
    ),
    defaultMenuOpen: {
      control: "boolean",
      description: "Starts with the phone panel open. Only read when the sidebar mounts, so changing it redraws the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: readOnly("Called when the phone panel opens or closes, with the new state and { reason }."),
    onMenuOpenChangeComplete: readOnly("Called with true once the phone panel has finished opening and with false once it has finished closing."),
    closeMenuOnNavigate: {
      control: "boolean",
      description: "Closes the phone panel when a link in it is chosen, including a router's link that prevents the browser's own navigation.",
      table: { defaultValue: { summary: "true" } },
    },
    exclusive: {
      control: "boolean",
      description: "Keeps one group open at a time among the groups that share a parent: opening one closes the others beside it.",
      table: { defaultValue: { summary: "false" } },
    },
    menuContainer: readOnly("The element the phone panel is drawn into instead of document.body. The Playground gives it its own frame."),
    sticky: {
      control: "boolean",
      description:
        "Keeps the sidebar in view while the page scrolls: it sticks to the top (below stickyOffset) and is as tall as the rest of the window. The Playground's frame doesn't scroll the page, so see the page-shell story.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      if: { arg: "sticky" },
      description: "How far from the top a sticky sidebar sticks, from the spacing scale: the height of a sticky Navbar above it. No effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the sidebar and the phone panel. Not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: readOnly("The text the sidebar supplies itself: navigation, collapse, expand, menu, close, externalLink and loading."),
    id: { control: "text", description: "Standard DOM id. Empty leaves it out. Avoid it: the sidebar's children are drawn twice while the phone panel is open." },
    className: readOnly("Additional CSS classes, on the sidebar's root."),
    style: readOnly("Inline styles, merged onto the component's own internal styles."),
    "data-testid": readOnly(
      "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    ),
  },
  // Storybook lists a Controls panel's props in the order of `args` first and the rest after, so every prop has an entry here, in the
  // order the Docs table uses; the ones with no live control (`undefined`) still sit where the table puts them.
  args: {
    children: undefined,
    variant: "outlined",
    size: "md",
    currentVariant: "subtle",
    currentPath: undefined,
    rounded: false,
    width: "",
    panelWidth: "",
    side: "start",
    peek: false,
    collapsed: undefined,
    defaultCollapsed: false,
    onCollapsedChange: fn(),
    collapseBelow: "md",
    menuOpen: undefined,
    defaultMenuOpen: false,
    onMenuOpenChange: fn(),
    onMenuOpenChangeComplete: fn(),
    closeMenuOnNavigate: true,
    exclusive: false,
    menuContainer: undefined,
    sticky: false,
    stickyOffset: 0,
    dir: "ltr",
    labels: undefined,
    id: "",
    className: undefined,
    style: undefined,
    "data-testid": undefined,
  },
  // (an empty text control means "not set": it must not reach the sidebar as `id=""` or `width=""`)
  render: ({ id, width, panelWidth, ...args }) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <SidebarFrame height="32rem">
          <DemoSidebar {...args} width={width || undefined} panelWidth={panelWidth || undefined} id={id || undefined} menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

// A row of frames, one per value, so the values can be compared side by side.
function Gallery({ children, columns = 3 }: { children: ReactNode; columns?: number }) {
  return (
    <div
      style={{
        inlineSize: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "var(--dbm-space-4)",
        alignItems: "stretch",
      }}
    >
      {children}
    </div>
  );
}

function Labelled({ name, children }: { name: string; children: ReactNode }) {
  return (
    <figure style={{ margin: 0, display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", gap: "var(--dbm-space-2)", minInlineSize: 0 }}>
      <figcaption style={{ fontSize: "var(--dbm-font-size-sm)", color: "var(--dbm-text-secondary)" }}>{name}</figcaption>
      {children}
    </figure>
  );
}

export const Variants: Story = {
  name: "Variants",
  parameters: { docs: { source: { code: sidebarSnippets.variants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Gallery columns={4}>
          {(["outlined", "filled", "ghost", "floating"] as const).map((variant) => (
            <Labelled key={variant} name={`${variant} sidebar`}>
              <SidebarFrame height="26rem" contentLabel="">
                <DemoSidebar
                  variant={variant}
                  size="sm"
                  width="12rem"
                  toggle={false}
                  navLabel={`${variant} navigation`}
                  menuContainer={menuContainer}
                  collapseBelow={args.collapseBelow}
                />
              </SidebarFrame>
            </Labelled>
          ))}
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: sidebarSnippets.sizes } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <Gallery columns={4}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <Labelled key={size} name={`${size} items`}>
              <SidebarFrame height="30rem" contentLabel="">
                <DemoSidebar
                  size={size}
                  width="12rem"
                  toggle={false}
                  navLabel={`${size} navigation`}
                  menuContainer={menuContainer}
                  collapseBelow={args.collapseBelow}
                />
              </SidebarFrame>
            </Labelled>
          ))}
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const CurrentVariants: Story = {
  name: "Marking the current page",
  parameters: { docs: { source: { code: sidebarSnippets.currentVariants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Gallery columns={4}>
          {(
            [
              ["subtle", false],
              ["bar", false],
              ["solid", false],
              ["subtle", true],
            ] as const
          ).map(([currentVariant, rounded]) => (
            <Labelled key={`${currentVariant}${rounded}`} name={rounded ? `rounded ${currentVariant}` : `${currentVariant} current item`}>
              <SidebarFrame height="26rem" contentLabel="">
                <DemoSidebar
                  currentVariant={currentVariant}
                  rounded={rounded}
                  size="sm"
                  width="12rem"
                  toggle={false}
                  initial="sales"
                  navLabel={`${rounded ? "rounded " : ""}${currentVariant} navigation`}
                  menuContainer={menuContainer}
                  collapseBelow={args.collapseBelow}
                />
              </SidebarFrame>
            </Labelled>
          ))}
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const Rail: Story = {
  name: "Collapsed to a rail",
  parameters: { docs: { source: { code: sidebarSnippets.rail } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <SidebarFrame height="32rem" contentLabel="Press the caret button in the footer to collapse the sidebar and expand it again.">
          <DemoSidebar defaultCollapsed menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const Sections: Story = {
  name: "Sections and separators",
  parameters: { docs: { source: { code: sidebarSnippets.sections } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <Gallery columns={2}>
          <Labelled name="Sections with headings">
            <SidebarFrame height="30rem" contentLabel="">
              <DemoSidebar width="14rem" menuContainer={menuContainer} collapseBelow={args.collapseBelow} navLabel="Sectioned navigation" />
            </SidebarFrame>
          </Labelled>
          <Labelled name="One list and a separator">
            <SidebarFrame height="30rem" contentLabel="">
              <DemoSidebar
                sections={false}
                width="14rem"
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
                navLabel="Plain navigation"
              />
            </SidebarFrame>
          </Labelled>
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const Groups: Story = {
  name: "Groups that open",
  parameters: { docs: { source: { code: sidebarSnippets.groups } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <SidebarFrame height="28rem" contentLabel="Open Projects and Reports. Choose an item and its group marks the current page.">
          <DemoSidebar initial="emea" toggle={false} footer={false} menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const Items: Story = {
  name: "Kinds of item",
  parameters: { docs: { source: { code: sidebarSnippets.items } } },
  argTypes: { ...noControls },
  render: () => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="24rem" contentLabel="">
          <Sidebar collapseBelow="never" menuContainer={menuContainer} width="16rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Kinds of item">
                <Sidebar.Item href="#home" icon={HouseIcon} current onClick={(event) => event.preventDefault()}>
                  A link, the current page
                </Sidebar.Item>
                <Sidebar.Item href="#inbox" icon={TrayIcon} badge="12" onClick={(event) => event.preventDefault()}>
                  A link with a count
                </Sidebar.Item>
                <Sidebar.Item
                  href="#alerts"
                  icon={BellIcon}
                  badge={
                    <Badge tone="danger" variant="solid">
                      3
                    </Badge>
                  }
                  onClick={(event) => event.preventDefault()}
                >
                  A link with a Badge
                </Sidebar.Item>
                <Sidebar.Item icon={PlusIcon}>A button (an action)</Sidebar.Item>
                <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon} onClick={(event) => event.preventDefault()}>
                  An external link
                </Sidebar.Item>
                <Sidebar.Item href="#billing" icon={ReceiptIcon} disabled>
                  A disabled link
                </Sidebar.Item>
                <Sidebar.Item asChild>
                  <a href="#routed" onClick={(event) => event.preventDefault()}>
                    <Icon icon={UsersIcon} size="md" />
                    A router&apos;s link (asChild)
                  </a>
                </Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const RowActions: Story = {
  name: "A control at the end of a row",
  parameters: { docs: { source: { code: sidebarSnippets.actions } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <SidebarFrame height="28rem" contentLabel="Hover or tab to a row to see its control. On a touch screen they are always shown.">
          <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="16rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Rows with a control">
                <Sidebar.Section label="Projects" action={<IconButton icon={PlusIcon} aria-label="New project" />}>
                  <Sidebar.Item
                    href="#website"
                    icon={FolderSimpleIcon}
                    onClick={(event) => event.preventDefault()}
                    action={
                      <Menu>
                        <Menu.Trigger asChild>
                          <IconButton icon={DotsThreeIcon} aria-label="More options for Website" />
                        </Menu.Trigger>
                        <Menu.Content>
                          <Menu.Item>Rename</Menu.Item>
                          <Menu.Item>Archive</Menu.Item>
                        </Menu.Content>
                      </Menu>
                    }
                  >
                    Website
                  </Sidebar.Item>
                  <Sidebar.Item
                    href="#mobile"
                    icon={FolderSimpleIcon}
                    badge="3"
                    onClick={(event) => event.preventDefault()}
                    action={<IconButton icon={PlusIcon} aria-label="Add a task to Mobile app" />}
                  >
                    Mobile app
                  </Sidebar.Item>
                  <Sidebar.Group
                    label="Reports"
                    icon={ChartBarIcon}
                    defaultOpen
                    action={<IconButton icon={PlusIcon} aria-label="New report" />}
                  >
                    <Sidebar.Item href="#sales" onClick={(event) => event.preventDefault()}>
                      Sales
                    </Sidebar.Item>
                  </Sidebar.Group>
                </Sidebar.Section>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const LongLabels: Story = {
  name: "Labels longer than the room",
  parameters: { docs: { source: { code: sidebarSnippets.longLabels } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <SidebarFrame height="18rem" contentLabel="Hover or tab to a cut-off label to read all of it. A label that fits gets no tooltip.">
          <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="13rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Long labels">
                <Sidebar.Item href="#a" icon={FolderSimpleIcon} badge="12" onClick={(event) => event.preventDefault()}>
                  Quarterly planning and budget review
                </Sidebar.Item>
                <Sidebar.Item href="#b" icon={GearIcon} onClick={(event) => event.preventDefault()}>
                  Settings
                </Sidebar.Item>
                <Sidebar.Group label="Customer success and account management" icon={UsersIcon}>
                  <Sidebar.Item href="#c" onClick={(event) => event.preventDefault()}>
                    Onboarding checklists for new enterprise accounts
                  </Sidebar.Item>
                </Sidebar.Group>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const CurrentFromPath: Story = {
  name: "Current page from the path",
  parameters: { docs: { source: { code: sidebarSnippets.currentPath } } },
  argTypes: { ...noControls },
  render: function CurrentFromPathDemo(args) {
    const [path, setPath] = useState("/reports/sales");
    const go = (href: string) => ({
      href,
      onClick: (event: { preventDefault: () => void }) => {
        event.preventDefault();
        setPath(href);
      },
    });
    return (
      <SidebarStage minBlockSize="26rem">
        {(menuContainer) => (
          <SidebarFrame height="22rem" contentLabel={`currentPath="${path}". No item or group has current written on it: choose one.`}>
            <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} currentPath={path} width="15rem">
              <Sidebar.Content>
                <Sidebar.Nav aria-label="Marked from the path">
                  <Sidebar.Item icon={HouseIcon} {...go("/")}>
                    Home
                  </Sidebar.Item>
                  <Sidebar.Item icon={FolderSimpleIcon} match="prefix" {...go("/projects")}>
                    Projects (and below)
                  </Sidebar.Item>
                  <Sidebar.Group label="Reports" icon={ChartBarIcon}>
                    <Sidebar.Item {...go("/reports/sales")}>Sales</Sidebar.Item>
                    <Sidebar.Item {...go("/reports/costs")}>Costs</Sidebar.Item>
                  </Sidebar.Group>
                </Sidebar.Nav>
              </Sidebar.Content>
            </Sidebar>
          </SidebarFrame>
        )}
      </SidebarStage>
    );
  },
};

export const Peek: Story = {
  name: "A rail that opens over the page",
  parameters: { docs: { source: { code: sidebarSnippets.peek } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <SidebarFrame height="32rem" contentLabel="Hover the rail, or tab into it: it opens over this page without moving it, and closes when you leave.">
          <DemoSidebar defaultCollapsed peek menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const Descriptions: Story = {
  name: "A second line under an item",
  parameters: { docs: { source: { code: sidebarSnippets.descriptions } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="24rem">
      {(menuContainer) => (
        <SidebarFrame height="20rem" contentLabel="">
          <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="18rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="With descriptions">
                <Sidebar.Item href="#overview" icon={HouseIcon} description="Everything at a glance" current onClick={(event) => event.preventDefault()}>
                  Overview
                </Sidebar.Item>
                <Sidebar.Item href="#inbox" icon={TrayIcon} description="Requests waiting on you" badge="12" onClick={(event) => event.preventDefault()}>
                  Inbox
                </Sidebar.Item>
                <Sidebar.Item href="#billing" icon={ReceiptIcon} description="Invoices, plans and payment methods for the whole account" onClick={(event) => event.preventDefault()}>
                  Billing
                </Sidebar.Item>
                <Sidebar.Item href="#team" icon={UsersIcon} onClick={(event) => event.preventDefault()}>
                  Team (no description)
                </Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const Accounts: Story = {
  name: "Account and workspace switchers",
  parameters: { docs: { source: { code: sidebarSnippets.account } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <SidebarFrame height="30rem" contentLabel="The workspace in the header and the account in the footer each open a menu. In the rail they are the avatar alone.">
          <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="16rem">
            <Sidebar.Header>
              <Sidebar.Account name="dbM" description="Workspace · Pro plan" menuSide="bottom" avatar={<Avatar name="dbM" shape="square" colorful size="xs" />}>
                <Menu.Label>Workspaces</Menu.Label>
                <Menu.Item>dbM</Menu.Item>
                <Menu.Item>dbM System</Menu.Item>
                <Menu.Separator />
                <Menu.Item icon={PlusIcon}>New workspace</Menu.Item>
              </Sidebar.Account>
            </Sidebar.Header>
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Main">
                <Sidebar.Item href="#home" icon={HouseIcon} current onClick={(event) => event.preventDefault()}>
                  Home
                </Sidebar.Item>
                <Sidebar.Item href="#inbox" icon={TrayIcon} onClick={(event) => event.preventDefault()}>
                  Inbox
                </Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
            <Sidebar.Footer>
              <Sidebar.Account name="John Doe" description="john@acme.com">
                <Menu.Item icon={UsersIcon}>Profile</Menu.Item>
                <Menu.Item icon={GearIcon}>Settings</Menu.Item>
                <Menu.Separator />
                <Menu.Item>Sign out</Menu.Item>
              </Sidebar.Account>
              <Sidebar.Toggle />
            </Sidebar.Footer>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const ExclusiveGroups: Story = {
  name: "One group open at a time",
  parameters: { docs: { source: { code: sidebarSnippets.exclusive } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="22rem" contentLabel="Open one group and the others close.">
          <Sidebar exclusive collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="15rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="One at a time">
                <Sidebar.Group label="Projects" icon={FolderSimpleIcon} defaultOpen>
                  <Sidebar.Item href="#active" onClick={(event) => event.preventDefault()}>
                    Active
                  </Sidebar.Item>
                  <Sidebar.Item href="#archived" onClick={(event) => event.preventDefault()}>
                    Archived
                  </Sidebar.Item>
                </Sidebar.Group>
                <Sidebar.Group label="Reports" icon={ChartBarIcon}>
                  <Sidebar.Item href="#sales" onClick={(event) => event.preventDefault()}>
                    Sales
                  </Sidebar.Item>
                  <Sidebar.Item href="#costs" onClick={(event) => event.preventDefault()}>
                    Costs
                  </Sidebar.Item>
                </Sidebar.Group>
                <Sidebar.Group label="Settings" icon={GearIcon}>
                  <Sidebar.Item href="#profile" onClick={(event) => event.preventDefault()}>
                    Profile
                  </Sidebar.Item>
                </Sidebar.Group>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const CollapsibleSections: Story = {
  name: "Sections that fold",
  parameters: { docs: { source: { code: sidebarSnippets.collapsibleSections } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="22rem" contentLabel="Press a heading to fold its list away. The rail always shows every list.">
          <Sidebar collapseBelow={args.collapseBelow} menuContainer={menuContainer} width="15rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Folding sections">
                <Sidebar.Section label="Workspace" collapsible>
                  <Sidebar.Item href="#home" icon={HouseIcon} current onClick={(event) => event.preventDefault()}>
                    Home
                  </Sidebar.Item>
                  <Sidebar.Item href="#inbox" icon={TrayIcon} onClick={(event) => event.preventDefault()}>
                    Inbox
                  </Sidebar.Item>
                </Sidebar.Section>
                <Sidebar.Section label="Admin" collapsible defaultOpen={false}>
                  <Sidebar.Item href="#settings" icon={GearIcon} onClick={(event) => event.preventDefault()}>
                    Settings
                  </Sidebar.Item>
                  <Sidebar.Item href="#billing" icon={ReceiptIcon} onClick={(event) => event.preventDefault()}>
                    Billing
                  </Sidebar.Item>
                </Sidebar.Section>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

const noNavigation = (event: { preventDefault: () => void }) => event.preventDefault();

// One sidebar's worth of groups with counts, drawn twice: expanded (a shut group shows its total) and as a rail (the count is on the icon).
function CountedGroups({ collapsed, menuContainer, collapseBelow }: { collapsed?: boolean; menuContainer: HTMLElement | null; collapseBelow?: SidebarCollapseBelow }) {
  return (
    <Sidebar defaultCollapsed={collapsed} menuContainer={menuContainer} collapseBelow={collapseBelow} width="15rem">
      <Sidebar.Content>
        <Sidebar.Nav aria-label={collapsed ? "Rail with counts" : "Groups with counts"}>
          <Sidebar.Group label="Inbox" icon={TrayIcon}>
            <Sidebar.Item href="#mentions" badge={3} onClick={noNavigation}>
              Mentions
            </Sidebar.Item>
            <Sidebar.Item href="#assigned" badge={9} onClick={noNavigation}>
              Assigned
            </Sidebar.Item>
            <Sidebar.Item href="#drafts" onClick={noNavigation}>
              Drafts
            </Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Group label="Alerts" icon={BellIcon}>
            <Sidebar.Item href="#errors" badge={80} onClick={noNavigation}>
              Errors
            </Sidebar.Item>
            <Sidebar.Item href="#warnings" badge={40} onClick={noNavigation}>
              Warnings
            </Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Group label="Reports" icon={ChartBarIcon} badge="New">
            <Sidebar.Item href="#sales" onClick={noNavigation}>
              Sales
            </Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Item href="#messages" icon={UsersIcon} badge={250} onClick={noNavigation}>
            Messages
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
    </Sidebar>
  );
}

export const GroupBadges: Story = {
  name: "Counts on a group",
  parameters: { docs: { source: { code: sidebarSnippets.groupBadges } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Gallery columns={2}>
          <Labelled name="Expanded: a shut group shows the total of its items">
            <SidebarFrame height="18rem" contentLabel="">
              <CountedGroups menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
            </SidebarFrame>
          </Labelled>
          <Labelled name="Rail: the count is on the icon, and over 99 reads 99+">
            <SidebarFrame height="18rem" contentLabel="">
              <CountedGroups collapsed menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
            </SidebarFrame>
          </Labelled>
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const Loading: Story = {
  name: "While the navigation loads",
  parameters: { docs: { source: { code: sidebarSnippets.loading } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Gallery columns={2}>
          {[false, true].map((rail) => (
            <Labelled key={String(rail)} name={rail ? "Rail" : "Expanded"}>
              <SidebarFrame height="18rem" contentLabel="">
                <Sidebar defaultCollapsed={rail} menuContainer={menuContainer} collapseBelow={args.collapseBelow} width="15rem">
                  <Sidebar.Content>
                    <Sidebar.Nav aria-label={rail ? "Loading rail" : "Loading navigation"}>
                      <Sidebar.Skeleton rows={6} />
                    </Sidebar.Nav>
                  </Sidebar.Content>
                </Sidebar>
              </SidebarFrame>
            </Labelled>
          ))}
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const RememberCollapsed: Story = {
  name: "Recipe: remember the collapsed state",
  parameters: { docs: { source: { code: sidebarSnippets.rememberCollapsed } } },
  argTypes: { ...noControls },
  render: function Render(args) {
    const [collapsed, setCollapsed] = useRememberedCollapsed("dbm-sidebar-story-collapsed");
    return (
      <SidebarStage minBlockSize="34rem">
        {(menuContainer) => (
          <SidebarFrame height="32rem" contentLabel="Collapse the sidebar and reload the page: it comes back the way you left it.">
            <DemoSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
          </SidebarFrame>
        )}
      </SidebarStage>
    );
  },
};

export const FilterRecipe: Story = {
  name: "Recipe: filter the navigation",
  parameters: { docs: { source: { code: sidebarSnippets.filter } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <SidebarFrame height="28rem" contentLabel="Type in the box: the navigation narrows, and the groups with a match open.">
          <FilterableSidebar menuContainer={menuContainer} collapseBelow={args.collapseBelow} width="16rem" />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
};

export const Sides: Story = {
  name: "On the end side, and right to left",
  parameters: { docs: { source: { code: sidebarSnippets.side } } },
  argTypes: { ...noControls },
  render: (args) => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Gallery columns={2}>
          <Labelled name='side="end"'>
            <SidebarFrame height="26rem" contentLabel="" reverse>
              <DemoSidebar
                side="end"
                size="sm"
                width="13rem"
                toggle={false}
                navLabel="End side navigation"
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </SidebarFrame>
          </Labelled>
          <Labelled name='dir="rtl"'>
            <SidebarFrame height="26rem" contentLabel="" dir="rtl">
              <DemoSidebar
                dir="rtl"
                size="sm"
                width="13rem"
                toggle={false}
                navLabel="Right to left navigation"
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </SidebarFrame>
          </Labelled>
        </Gallery>
      )}
    </SidebarStage>
  ),
};

export const Panel: Story = {
  name: "The phone panel",
  parameters: { docs: { source: { code: sidebarSnippets.panel } } },
  argTypes: { ...noControls },
  render: () => (
    // The panel is the same sidebar in a `Drawer`, opened by the menu button below the step; this demo opens it from a button of its own, since a Docs
    // page is wider than any step. Collapsed below the widest step, so the menu button shows on any window narrower than 1920px.
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <Sidebar.Provider collapseBelow="3xl">
          <div style={{ inlineSize: "100%", alignSelf: "stretch", display: "grid", gridTemplateRows: "auto 1fr" }}>
            <DemoTopBar />
            <DemoSidebar menuContainer={menuContainer} />
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
};

export const PanelWidth: Story = {
  name: "The phone panel at its own width",
  parameters: { docs: { source: { code: sidebarSnippets.panelWidth } } },
  argTypes: { ...noControls },
  render: () => (
    // The column on the page is 14rem and the phone panel 22rem: the panel is its own width (`panelWidth`), the column's is `width`.
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <Sidebar.Provider collapseBelow="3xl">
          <div style={{ inlineSize: "100%", alignSelf: "stretch", display: "grid", gridTemplateRows: "auto 1fr" }}>
            <DemoTopBar />
            <DemoSidebar width="14rem" panelWidth="22rem" menuContainer={menuContainer} />
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
};

export const PageShell: Story = {
  name: "In a page, with the controls outside",
  parameters: { docs: { source: { code: sidebarSnippets.pageShell } } },
  argTypes: { ...noControls },
  render: () => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <Sidebar.Provider>
          <div style={{ inlineSize: "100%", alignSelf: "stretch", display: "grid", gridTemplateRows: "auto 1fr", minBlockSize: 0 }}>
            <DemoTopBar>
              <Sidebar.Toggle aria-label="Collapse or expand the sidebar" />
            </DemoTopBar>
            <SidebarFrame height="20rem" contentLabel="The collapse button and the menu button live in the page's header, outside the sidebar.">
              <DemoSidebar toggle={false} menuContainer={menuContainer} />
            </SidebarFrame>
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
};

export const ControlledPanel: Story = {
  name: "Controlled collapse and panel",
  parameters: { docs: { source: { code: sidebarSnippets.controlledPanel } } },
  argTypes: { ...noControls },
  render: function Controlled() {
    const [collapsed, setCollapsed] = useState(false);
    const [reason, setReason] = useState("");
    return (
      <SidebarStage minBlockSize="34rem">
        {(menuContainer) => (
          <SidebarFrame height="32rem" contentLabel={`collapsed: ${String(collapsed)}${reason ? ` · the panel last changed because of "${reason}"` : ""}`}>
            <DemoSidebar
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              onMenuOpenChange={(_open, details) => setReason(details.reason)}
              menuContainer={menuContainer}
            />
          </SidebarFrame>
        )}
      </SidebarStage>
    );
  },
};

// --- Hidden tests (kept out of the sidebar and the Docs page) ------------------------------------------------------------
// A story that changes the sidebar's state (a press, a key) would animate and settle somewhere new every time the Docs page opens it,
// so each test is a hidden twin of the story it exercises (07 §5).

/** Hidden twin of "Groups that open": opening a group, choosing an item and the group marking the page. */
export const GroupsInteraction: Story = {
  ...Groups,
  name: "Groups that open — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const address = window.location.href;
    const projects = canvas.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(projects);
    expect(projects).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(await canvas.findByRole("link", { name: "Active" }));
    expect(window.location.href).toBe(address);
    expect(canvas.getByRole("link", { name: "Active" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "EMEA" })).not.toHaveAttribute("aria-current");
    await userEvent.click(projects);
    await waitFor(() => expect(canvas.queryByRole("link", { name: "Active" })).not.toBeInTheDocument());
  },
};

/** Hidden twin of "Collapsed to a rail": the toggle collapses and expands it, and a rail group opens a menu. */
export const RailInteraction: Story = {
  ...Rail,
  name: "Collapsed to a rail — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Projects" }));
    const menu = await within(document.body).findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Active" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
    expect(await canvas.findByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  },
};

/** Hidden twin of "The phone panel": the button opens it, choosing an item closes it and focus goes back to the button. */
export const PanelInteraction: Story = {
  ...Panel,
  name: "The phone panel — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open the panel" });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog", { name: "Menu" });
    await userEvent.click(within(dialog).getByRole("link", { name: /^Inbox/ }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/** Hidden twin of "Current page from the path": choosing an item moves the mark, and a group holding the page marks itself. */
export const CurrentFromPathInteraction: Story = {
  ...CurrentFromPath,
  name: "Current page from the path — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByRole("link", { name: "Sales" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "Costs" })).not.toHaveAttribute("aria-current");
    await userEvent.click(canvas.getByRole("link", { name: "Home" }));
    expect(canvas.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: /Projects/ })).not.toHaveAttribute("aria-current");
  },
};
