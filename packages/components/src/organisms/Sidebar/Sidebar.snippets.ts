// The code shown under each story's "Show code" button on Sidebar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open phone panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { SidebarCollapseBelow, SidebarCurrentVariant, SidebarSide, SidebarSize, SidebarVariant } from "./Sidebar.types";

const iconsNote = `{/* The icons (HouseIcon, TrayIcon, FolderSimpleIcon, ChartBarIcon, UsersIcon, GearIcon, BookOpenIcon) come from @dbm-system/icons */}`;

const indent = (code: string, spaces: number) =>
  code
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

/** What the demo sidebar draws, so a snippet shows what its story shows: the header, two sections of items and groups, and the footer. */
interface DemoOptions {
  /** The item that is the current page. */
  current?: "home" | "sales" | "emea";
  /** Whether the footer holds the collapse button, or there is no footer at all. */
  footer?: "toggle" | "account" | "none";
}

const demoBody = ({ current = "home", footer = "toggle" }: DemoOptions = {}) => {
  const home = current === "home" ? " current" : "";
  const sales = current === "sales" ? " current" : "";
  const emea = current === "emea" ? " current" : "";
  const holdsSales = current === "sales" || current === "emea" ? " current" : "";
  const holdsRegional = current === "emea" ? " current" : "";
  const parts = [
    `<Sidebar.Header>
  <Avatar name="dbM" shape="square" size="sm" colorful />
  dbM Cloud
</Sidebar.Header>`,
    `<Sidebar.Content>
  <Sidebar.Nav>
    <Sidebar.Section label="Workspace">
      <Sidebar.Item href="/" icon={HouseIcon}${home}>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
        Inbox
      </Sidebar.Item>
      <Sidebar.Group label="Projects" icon={FolderSimpleIcon}>
        <Sidebar.Item href="/projects/active">Active</Sidebar.Item>
        <Sidebar.Item href="/projects/archived">Archived</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}${holdsSales}>
        <Sidebar.Item href="/reports/sales"${sales}>
          Sales
        </Sidebar.Item>
        <Sidebar.Group label="Regional"${holdsRegional}>
          <Sidebar.Item href="/reports/emea"${emea}>
            EMEA
          </Sidebar.Item>
          <Sidebar.Item href="/reports/apac">APAC</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Group>
      <Sidebar.Item href="/team" icon={UsersIcon}>
        Team
      </Sidebar.Item>
    </Sidebar.Section>
    <Sidebar.Section label="Admin">
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
      <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon}>
        Documentation
      </Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
</Sidebar.Content>`,
  ];
  if (footer === "toggle") {
    parts.push(`<Sidebar.Footer>
  <Avatar name="John Doe" size="sm" />
  John Doe
  <Sidebar.Toggle />
</Sidebar.Footer>`);
  } else if (footer === "account") {
    parts.push(`<Sidebar.Footer>
  <Avatar name="John Doe" size="sm" />
  John Doe
</Sidebar.Footer>`);
  }
  return parts.map((part) => indent(part, 2)).join("\n");
};

/** The demo sidebar with the given attributes: what the Playground and the gallery stories draw. */
const sidebar = (attributes: string, options?: DemoOptions) =>
  `${iconsNote}
<Sidebar${attributes ? ` ${attributes}` : ""}>
${demoBody(options)}
</Sidebar>`;

export const sidebarSnippets = {
  variants: `{/* variant: "outlined" (default) | "filled" | "ghost" | "floating". outlined draws a line along the edge the sidebar does not sit against;
    filled is the same surface with no line; ghost has nothing of its own, so the items sit on the page; floating is an inset card, set in from the
    page's edges with rounded corners, a line all round and a soft shadow. */}
${sidebar('variant="filled"')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" sets the height of an item, its icon and its text. The collapsed rail is one item wide. */}
${sidebar('size="lg"')}`,

  currentVariants: `{/* currentVariant: "subtle" (default) | "bar" | "solid". aria-current="page" is set whichever it is; rounded makes each item a pill.
    A group that holds the current page starts open and says so with current. */}
${sidebar('currentVariant="solid" rounded', { current: "sales" })}`,

  rail: `{/* The Sidebar.Toggle in the footer collapses it to a rail of icons and back. defaultCollapsed starts it as a rail; to hold the state
    yourself, pass collapsed and onCollapsedChange instead. */}
${sidebar("defaultCollapsed")}`,

  sections: `{/* A Sidebar.Section is a heading over a list, drawn in capitals, and Sidebar.Separator a plain line between parts of one. In the rail the
    headings are hidden and a line sets the sections apart. */}
${sidebar("")}

{/* One list and a separator, with no headings. */}
<Sidebar>
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Plain navigation">
      <Sidebar.Item href="/" icon={HouseIcon} current>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/team" icon={UsersIcon}>
        Team
      </Sidebar.Item>
      <Sidebar.Separator />
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  groups: `{/* A Sidebar.Group opens its items beneath it, animated, and nests up to three deep. current starts a group open and marks its button while it is shut.
    In the rail a top-level group is an icon button that opens a floating menu, and a nested group a submenu. */}
${sidebar("", { current: "emea", footer: "none" })}`,

  items: `{/* An item with an href is a link; without one it is a button (an action). badge is a count, or a Badge you pass, drawn as written (its tone, variant,
    size, className and style win over the built-in badge). An http(s) address is external (a new tab, a trailing icon, a hidden cue). disabled keeps it
    focusable, as Link does. asChild puts the look on your router's link: put its component where the <a> is (here a plain anchor); the item's icon and text are then the child's own. */}
<Sidebar.Nav>
  <Sidebar.Item href="/" icon={HouseIcon} current>
    A link, the current page
  </Sidebar.Item>
  <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
    A link with a count
  </Sidebar.Item>
  <Sidebar.Item href="/alerts" icon={BellIcon} badge={<Badge tone="danger" variant="solid">3</Badge>}>
    A link with a Badge
  </Sidebar.Item>
  <Sidebar.Item icon={PlusIcon}>A button (an action)</Sidebar.Item>
  <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon}>
    An external link
  </Sidebar.Item>
  <Sidebar.Item href="/billing" icon={ReceiptIcon} disabled>
    A disabled link
  </Sidebar.Item>
  <Sidebar.Item asChild>
    <a href="/team">
      <Icon icon={UsersIcon} size="md" />
      A router's link (asChild)
    </a>
  </Sidebar.Item>
</Sidebar.Nav>`,

  actions: `{/* action is a control at the end of a row, beside the link and not inside it: an IconButton, or a Menu's trigger. It shows while the row
    is hovered or has focus (always on a touch screen and in the phone panel), and its buttons default to ghost, neutral and xs. Items, groups and
    sections take one; the rail draws none. */}
<Sidebar.Nav>
  <Sidebar.Section label="Projects" action={<IconButton icon={PlusIcon} aria-label="New project" />}>
    <Sidebar.Item
      href="/website"
      icon={FolderSimpleIcon}
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
    <Sidebar.Item href="/mobile" icon={FolderSimpleIcon} badge="3" action={<IconButton icon={PlusIcon} aria-label="Add a task to Mobile app" />}>
      Mobile app
    </Sidebar.Item>
    <Sidebar.Group label="Reports" icon={ChartBarIcon} defaultOpen action={<IconButton icon={PlusIcon} aria-label="New report" />}>
      <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
    </Sidebar.Group>
  </Sidebar.Section>
</Sidebar.Nav>`,

  longLabels: `{/* A label longer than the room is cut with an ellipsis, and a tooltip shows all of it on hover and focus. A label that fits gets none. */}
<Sidebar width="13rem">
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Long labels">
      <Sidebar.Item href="/planning" icon={FolderSimpleIcon} badge="12">
        Quarterly planning and budget review
      </Sidebar.Item>
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
      <Sidebar.Group label="Customer success and account management" icon={UsersIcon}>
        <Sidebar.Item href="/onboarding">Onboarding checklists for new enterprise accounts</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  currentPath: `{/* currentPath is the page the reader is on, from your router (here a made-up usePathname()), so each item marks itself from its href with no
    current written on it, and a group that holds one is current too. An item's own current always wins; match="prefix" also matches the pages below
    it. Query strings, hashes and trailing slashes are ignored. */}
<Sidebar currentPath={usePathname()}>
  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Item href="/" icon={HouseIcon}>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/projects" icon={FolderSimpleIcon} match="prefix">
        Projects (and below)
      </Sidebar.Item>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}>
        <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
        <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  peek: `{/* peek lets a sidebar collapsed to a rail open as an overlay while the pointer is over it or focus is inside it, so the labels can be read
    without expanding it for good. The rail keeps its width in the page and the open sidebar is drawn over the content; it closes when the pointer and
    focus leave, and stays open while a menu opened from it is. A mouse only: a touch screen has no hover, and focus works everywhere. */}
${sidebar("defaultCollapsed peek")}`,

  descriptions: `{/* description is a second line under the item's text, in quieter type: what the page is for. It describes the item (aria-describedby)
    and does not name it, it is cut with an ellipsis like the text, and the rail does not show it. */}
<Sidebar.Nav>
  <Sidebar.Item href="/" icon={HouseIcon} description="Everything at a glance" current>
    Overview
  </Sidebar.Item>
  <Sidebar.Item href="/inbox" icon={TrayIcon} description="Requests waiting on you" badge="12">
    Inbox
  </Sidebar.Item>
  <Sidebar.Item href="/billing" icon={ReceiptIcon} description="Invoices, plans and payment methods for the whole account">
    Billing
  </Sidebar.Item>
  <Sidebar.Item href="/team" icon={UsersIcon}>
    Team (no description)
  </Sidebar.Item>
</Sidebar.Nav>`,

  account: `{/* Sidebar.Account is a switcher: an avatar, a name and a quieter line, opening a Menu of the items inside it. It goes in a Header or Footer.
    In the rail it is the avatar alone, with the name as its tooltip and name, and the menu opens beside the rail. menuSide defaults to above the
    button (right for a footer); give "bottom" for one in the header. Give avatar your own (a logo) or leave it for one made from name and src. */}
<Sidebar>
  <Sidebar.Header>
    <Sidebar.Account name="dbM" description="Workspace · Pro plan" menuSide="bottom" avatar={<Avatar name="dbM" shape="square" colorful size="xs" />}>
      <Menu.Label>Workspaces</Menu.Label>
      <Menu.Item>dbM</Menu.Item>
      <Menu.Item>dbM System</Menu.Item>
      <Menu.Separator />
      <Menu.Item icon={PlusIcon}>New workspace</Menu.Item>
    </Sidebar.Account>
  </Sidebar.Header>
  <Sidebar.Footer>
    <Sidebar.Account name="John Doe" description="john@acme.com">
      <Menu.Item icon={UsersIcon}>Profile</Menu.Item>
      <Menu.Item icon={GearIcon}>Settings</Menu.Item>
      <Menu.Separator />
      <Menu.Item>Sign out</Menu.Item>
    </Sidebar.Account>
    <Sidebar.Toggle />
  </Sidebar.Footer>
</Sidebar>`,

  exclusive: `{/* exclusive keeps one group open at a time among the groups that share a parent: opening one closes the others beside it. A group's state is
    kept for the whole sidebar under its label (give value to tell two groups with the same label apart), so the page and the phone panel share it. */}
<Sidebar exclusive>
  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Group label="Projects" icon={FolderSimpleIcon} defaultOpen>
        <Sidebar.Item href="/projects/active">Active</Sidebar.Item>
        <Sidebar.Item href="/projects/archived">Archived</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}>
        <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
        <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Settings" icon={GearIcon}>
        <Sidebar.Item href="/settings/profile">Profile</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  groupBadges: `{/* A group shows a badge while its items are out of sight: after its label while it is shut, and on its icon in the rail. Left out, it is the
    total of its items' numeric badges (Inbox: 3 + 9, Alerts: 80 + 40); badge="New" sets one, badge={null} shows none. The items show their own
    badges once the group is open. In the rail a number over 99 reads "99+". */}
<Sidebar.Nav>
  <Sidebar.Group label="Inbox" icon={TrayIcon}>
    <Sidebar.Item href="/inbox/mentions" badge={3}>Mentions</Sidebar.Item>
    <Sidebar.Item href="/inbox/assigned" badge={9}>Assigned</Sidebar.Item>
    <Sidebar.Item href="/inbox/drafts">Drafts</Sidebar.Item>
  </Sidebar.Group>
  <Sidebar.Group label="Alerts" icon={BellIcon}>
    <Sidebar.Item href="/alerts/errors" badge={80}>Errors</Sidebar.Item>
    <Sidebar.Item href="/alerts/warnings" badge={40}>Warnings</Sidebar.Item>
  </Sidebar.Group>
  <Sidebar.Group label="Reports" icon={ChartBarIcon} badge="New">
    <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
  </Sidebar.Group>
</Sidebar.Nav>`,

  loading: `{/* Sidebar.Skeleton stands in for the items while they load: rows the height of an item that pulse, announced once as "Loading" (the loading label).
    Swap it for the real items when they arrive. */}
<Sidebar.Nav>
  {isLoading ? (
    <Sidebar.Skeleton rows={6} />
  ) : (
    items.map((item) => (
      <Sidebar.Item key={item.href} href={item.href} icon={item.icon}>
        {item.label}
      </Sidebar.Item>
    ))
  )}
</Sidebar.Nav>`,

  rememberCollapsed: `{/* The sidebar keeps no preference of its own: hold collapsed yourself and put it where your app keeps such things. Here collapsed and
    setCollapsed come from a hook that saves to localStorage (the Docs page's recipe shows it); a cookie your server reads works too, and avoids the
    brief flash of the default on a server-rendered page, when you pass it as defaultCollapsed instead. */}
<Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Item href="/" icon={HouseIcon} current>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/inbox" icon={TrayIcon}>
        Inbox
      </Sidebar.Item>
    </Sidebar.Nav>
  </Sidebar.Content>
  <Sidebar.Footer>
    <Sidebar.Toggle />
  </Sidebar.Footer>
</Sidebar>`,

  filter: `{/* A filter box in the header narrows the navigation as you type. The sidebar needs nothing for it: filter your own data (the Docs page's recipe
    shows how), open the groups that still have a match (open={query ? true : undefined}, so an untouched group goes back to its own state when the box
    is cleared), and announce the count in a status region. In the rail the box has no room, so an item takes its place and expands the sidebar. */}
<Sidebar>
  <Sidebar.Header>
    {collapsed ? (
      <Sidebar.Item icon={MagnifyingGlassIcon} onClick={() => setCollapsed(false)}>
        Search
      </Sidebar.Item>
    ) : (
      <SearchInput
        size="sm"
        aria-label="Filter navigation"
        placeholder="Filter…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
      />
    )}
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Main">
      {links.map((link) => (
        <Sidebar.Item key={link.label} href={link.href} icon={link.icon}>
          {link.label}
        </Sidebar.Item>
      ))}
      {groups.map((group) => (
        <Sidebar.Group key={group.label} label={group.label} icon={group.icon} open={needle ? true : undefined}>
          {group.shown.map((item) => (
            <Sidebar.Item key={item.href} href={item.href}>
              {item.label}
            </Sidebar.Item>
          ))}
        </Sidebar.Group>
      ))}
    </Sidebar.Nav>
    <VisuallyHidden role="status">{needle ? \`\${count} \${count === 1 ? "match" : "matches"}\` : ""}</VisuallyHidden>
  </Sidebar.Content>
</Sidebar>`,

  collapsibleSections: `{/* collapsible makes a section's heading a button that folds its list away and brings it back; defaultOpen={false} starts one folded. The rail
    has no headings, so it always shows every list. The fold is kept for the whole sidebar, so the page and the phone panel agree. */}
<Sidebar.Nav>
  <Sidebar.Section label="Workspace" collapsible>
    <Sidebar.Item href="/" icon={HouseIcon} current>
      Home
    </Sidebar.Item>
    <Sidebar.Item href="/inbox" icon={TrayIcon}>
      Inbox
    </Sidebar.Item>
  </Sidebar.Section>
  <Sidebar.Section label="Admin" collapsible defaultOpen={false}>
    <Sidebar.Item href="/settings" icon={GearIcon}>
      Settings
    </Sidebar.Item>
    <Sidebar.Item href="/billing" icon={ReceiptIcon}>
      Billing
    </Sidebar.Item>
  </Sidebar.Section>
</Sidebar.Nav>`,

  side: `{/* side: "start" (default) | "end". The line moves to the inner edge and the phone panel slides in from that side. */}
${sidebar('side="end"')}

{/* dir="rtl": the sidebar sits at the right, indents and arrows mirror, and side="start" is the right edge. */}
${sidebar('dir="rtl" labels={{ collapse: "طي الشريط الجانبي", expand: "توسيع الشريط الجانبي", menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}')}`,

  panelWidth: `{/* width is the column on the page; panelWidth is the phone panel below collapseBelow. Left out, the panel is as wide as width.
    The panel is never wider than the window less a sliver of the page that stays showing. */}
{/* HouseIcon and ChartBarIcon come from @dbm-system/icons */}
<Sidebar width="14rem" panelWidth="22rem">
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Main">
      <Sidebar.Item href="/" icon={HouseIcon} current>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/reports" icon={ChartBarIcon}>
        Reports
      </Sidebar.Item>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  panel: `{/* Below collapseBelow ("md" = 768px) the sidebar leaves the page and a Sidebar.MenuButton opens it in a side panel. The same children are drawn
    in both, so give the items no id. The panel is never a rail. A button of your own can open it with useSidebar().setMenuOpen(true). This demo
    collapses below the widest step ("3xl") so the menu button shows on any window narrower than 1920px. */}
<Sidebar.Provider collapseBelow="3xl">
  <header>
    <Sidebar.MenuButton />
    <Button size="sm" variant="secondary" onClick={() => setMenuOpen(true)}>
      Open the panel
    </Button>
  </header>
${indent(sidebar(""), 2)}
</Sidebar.Provider>`,

  pageShell: `{/* A Sidebar.Provider holds the state for the page, so a Sidebar.Toggle or Sidebar.MenuButton outside the sidebar (here in the page header) acts on it.
    The sidebar has no toggle of its own here. */}
<Sidebar.Provider>
  <header>
    <Sidebar.MenuButton />
    <Sidebar.Toggle aria-label="Collapse or expand the sidebar" />
  </header>
  <div style={{ display: "flex" }}>
${indent(sidebar("", { footer: "account" }), 4)}
    <main id="main">Page content</main>
  </div>
</Sidebar.Provider>`,

  yourOwnParts: `{/* const { collapsed } = useSidebar(); reads the state from inside a Sidebar or a Sidebar.Provider, so the header can draw the brand's mark alone in the rail. */}
<Sidebar.Header>
  <Avatar name="dbM" shape="square" size="sm" />
  {!collapsed && "dbM Cloud"}
</Sidebar.Header>`,

  controlledPanel: `{/* const [collapsed, setCollapsed] = useState(false); and the reason the panel last changed: const [reason, setReason] = useState(""); */}
${sidebar("collapsed={collapsed} onCollapsedChange={setCollapsed} onMenuOpenChange={(open, details) => setReason(details.reason)}")}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SidebarPlaygroundSnippetArgs {
  variant?: SidebarVariant;
  size?: SidebarSize;
  currentVariant?: SidebarCurrentVariant;
  rounded?: boolean;
  width?: string;
  panelWidth?: string;
  side?: SidebarSide;
  peek?: boolean;
  defaultCollapsed?: boolean;
  collapseBelow?: SidebarCollapseBelow;
  defaultMenuOpen?: boolean;
  closeMenuOnNavigate?: boolean;
  exclusive?: boolean;
  sticky?: boolean;
  stickyOffset?: number;
  dir?: "ltr" | "rtl";
  id?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, in the order the
 * controls and the Properties table list them, around a small real sidebar. `stickyOffset` is written only while the sidebar is
 * `sticky`, since it does nothing otherwise.
 */
export function sidebarPlaygroundSnippet(args: SidebarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.currentVariant && args.currentVariant !== "subtle") attributes.push(`currentVariant="${args.currentVariant}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.width) attributes.push(`width=${quote(args.width)}`);
  if (args.panelWidth) attributes.push(`panelWidth=${quote(args.panelWidth)}`);
  if (args.side && args.side !== "start") attributes.push(`side="${args.side}"`);
  if (args.peek) attributes.push("peek");
  if (args.defaultCollapsed) attributes.push("defaultCollapsed");
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.defaultMenuOpen) attributes.push("defaultMenuOpen");
  if (args.closeMenuOnNavigate === false) attributes.push("closeMenuOnNavigate={false}");
  if (args.exclusive) attributes.push("exclusive");
  if (args.sticky) {
    attributes.push("sticky");
    if (args.stickyOffset) attributes.push(`stickyOffset={${args.stickyOffset}}`);
  }
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.id) attributes.push(`id=${quote(args.id)}`);
  return sidebar(attributes.join(" "));
}
