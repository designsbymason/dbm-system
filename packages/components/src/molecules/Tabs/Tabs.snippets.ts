// The code shown under each story's "Show code" button on Tabs' Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`DemoTabs`, `demoContainerStyle`),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TabsActivationMode, TabsAlign, TabsOrientation, TabsSize, TabsVariant } from "./Tabs.types";

const list = (attributes = "", triggers = defaultTriggers) =>
  `  <Tabs.List aria-label="Project"${attributes ? ` ${attributes}` : ""}>\n${triggers}\n  </Tabs.List>`;

const defaultTriggers = `    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>`;

const panels = `  <Tabs.Content value="overview">A summary of the project.</Tabs.Content>
  <Tabs.Content value="activity">Recent changes to the project.</Tabs.Content>
  <Tabs.Content value="settings">Who can see and change the project.</Tabs.Content>`;

const tabs = (attributes: string, listBlock = list(), panelBlock = panels) =>
  `<Tabs${attributes ? ` ${attributes}` : ""}>\n${listBlock}\n${panelBlock}\n</Tabs>`;

export const tabsSnippets = {
  variants: `{/* variant: "underline" (default) | "subtle" | "outlined" | "solid" — how the selected tab is marked */}
${tabs('defaultValue="overview" variant="subtle"')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — trigger height, padding and type size */}
${tabs('defaultValue="overview" size="sm"')}`,

  rounded: `{/* rounded fully rounds the ends of every tab in the subtle, outlined and solid variants.
    It does nothing to underline. */}
${tabs('defaultValue="overview" variant="outlined" rounded')}`,

  align: `{/* align: "start" (default) | "center" | "end" — where the tabs sit within the list */}
${tabs('defaultValue="overview"', list('align="center"'))}`,

  vertical: `{/* orientation="vertical" puts the list beside its panel; Up and Down move between tabs */}
${tabs('defaultValue="overview" orientation="vertical"')}`,

  responsiveOrientation: `{/* A breakpoint map: a vertical list beside the panel from the md breakpoint up,
    a horizontal strip above it below that. */}
${tabs('defaultValue="overview" orientation={{ base: "horizontal", md: "vertical" }}')}`,

  icons: `{/* Icons come from @dbm-system/icons. An icon-only tab needs an aria-label. */}
${tabs(
  'defaultValue="overview"',
  list(
    "",
    `    <Tabs.Trigger value="overview" icon={HouseIcon}>Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity" icon={ChartBarIcon}>Activity</Tabs.Trigger>
    <Tabs.Trigger value="settings" icon={GearIcon} aria-label="Settings" />`,
  ),
)}`,

  badge: `{/* Anything can sit in the label — here a Badge counting what is inside the tab. */}
${tabs(
  'defaultValue="inbox"',
  list(
    "",
    `    <Tabs.Trigger value="inbox">Inbox <Badge size="sm">12</Badge></Tabs.Trigger>
    <Tabs.Trigger value="sent">Sent</Tabs.Trigger>
    <Tabs.Trigger value="drafts">Drafts <Badge size="sm" tone="neutral">3</Badge></Tabs.Trigger>`,
  ),
  `  <Tabs.Content value="inbox">Twelve messages are waiting.</Tabs.Content>
  <Tabs.Content value="sent">Everything you have sent.</Tabs.Content>
  <Tabs.Content value="drafts">Three unfinished messages.</Tabs.Content>`,
)}`,

  disabledTab: `{/* disabled keeps just that tab from being selected; Tab and the arrow keys skip it */}
${tabs(
  'defaultValue="overview"',
  list(
    "",
    `    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="settings" disabled>Settings</Tabs.Trigger>`,
  ),
)}`,

  fullWidth: `{/* fullWidth stretches the triggers to fill a horizontal list */}
${tabs('defaultValue="overview" fullWidth')}`,

  manualActivation: `{/* activationMode="manual": the arrow keys only move focus; Enter or Space selects */}
${tabs('defaultValue="overview" activationMode="manual"')}`,

  controlled: `{/* You own the selection: const [value, setValue] = useState("overview"); */}
${tabs('value={value} onValueChange={setValue}')}`,

  scrolling: `{/* A horizontal list wider than its container scrolls sideways, keeps the selected tab in view,
    and shows a fade and a button wherever there are more tabs that way. */}
<Tabs defaultValue="security">
  <Tabs.List aria-label="Workspace">
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="members">Members</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
    <Tabs.Trigger value="integrations">Integrations</Tabs.Trigger>
    <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
    <Tabs.Trigger value="audit log">Audit log</Tabs.Trigger>
    <Tabs.Trigger value="security">Security</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="security">Two-factor and session settings.</Tabs.Content>
</Tabs>`,

  verticalScrolling: `{/* A vertical list taller than the height it's given scrolls inside itself, keeps the
    selected tab in view, and shows a fade and a button wherever there are more tabs that way.
    Nothing bounds the height on its own the way the page's own width bounds a horizontal list, so
    Tabs.List needs a height of its own to respond to. A percentage alone doesn't do it (nothing
    above stretches to give it something definite to resolve against) — wrap it in a flex box
    instead, which does; a vh unit caps it against the actual viewport height, the vertical
    equivalent of the horizontal example's maxInlineSize: "100%". */}
<Tabs defaultValue="security" orientation="vertical">
  <div style={{ display: "flex", blockSize: "10rem", maxBlockSize: "40vh", overflow: "hidden", resize: "vertical" }}>
    <Tabs.List aria-label="Workspace" style={{ blockSize: "100%" }}>
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
      <Tabs.Trigger value="members">Members</Tabs.Trigger>
      <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      <Tabs.Trigger value="integrations">Integrations</Tabs.Trigger>
      <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
      <Tabs.Trigger value="audit log">Audit log</Tabs.Trigger>
      <Tabs.Trigger value="security">Security</Tabs.Trigger>
    </Tabs.List>
  </div>
  <Tabs.Content value="security">Two-factor and session settings.</Tabs.Content>
</Tabs>`,

  keepMounted: `{/* forceMount keeps the panel in the page while its tab is not selected (hidden), so what
    you typed into it is still there when you come back. */}
<Tabs defaultValue="details">
  <Tabs.List aria-label="Profile">
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
    <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details" forceMount>
    <Input aria-label="Display name" defaultValue="Ada" />
  </Tabs.Content>
  <Tabs.Content value="notes">Notes are not kept mounted.</Tabs.Content>
</Tabs>`,

  withAction: `{/* Tabs.Item holds one Tabs.Trigger and an action drawn at its end, beside the tab button and not
    inside it. The action is hidden from assistive technology (a tablist may own only tabs) and kept out of
    the tab order with tabIndex={-1}, so give what it does a key or a menu as well. */}
<Tabs defaultValue="overview">
  <Tabs.List aria-label="Project">
    <Tabs.Item
      action={
        <button type="button" tabIndex={-1} aria-label="Close Overview" onClick={() => closeTab("overview")}>
          ×
        </button>
      }
    >
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    </Tabs.Item>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">A summary of the project.</Tabs.Content>
  <Tabs.Content value="activity">Recent changes.</Tabs.Content>
</Tabs>`,

  asChildLink: `{/* asChild renders the tab onto your own element, keeping its look and its role="tab".
    Here each tab is a real link; the panels stay in the page, so use this only when the
    tabs switch panels rather than navigate. */}
<Tabs defaultValue="overview">
  <Tabs.List aria-label="Project">
    <Tabs.Trigger value="overview" asChild><a href="#overview">Overview</a></Tabs.Trigger>
    <Tabs.Trigger value="activity" asChild><a href="#activity">Activity</a></Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">A summary of the project.</Tabs.Content>
  <Tabs.Content value="activity">Recent changes to the project.</Tabs.Content>
</Tabs>`,

  rightToLeft: `{/* dir="rtl" mirrors the row, and Left and Right swap meaning for the arrow keys. */}
${tabs('defaultValue="overview" dir="rtl"')}`,

  onAPhone: `{/* Below the sm breakpoint a long list scrolls sideways, and a breakpoint map on
    orientation can turn a vertical list horizontal. */}
${tabs('defaultValue="overview" orientation={{ base: "horizontal", md: "vertical" }}')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TabsPlaygroundSnippetArgs {
  defaultValue?: string;
  variant?: TabsVariant;
  size?: TabsSize;
  rounded?: boolean;
  orientation?: TabsOrientation;
  activationMode?: TabsActivationMode;
  fullWidth?: boolean;
  // Tabs.List's own prop, not the root's — written onto the <Tabs.List> tag below,
  // not the <Tabs> tag the other attributes here go on.
  align?: TabsAlign;
  // Also Tabs.List's own prop, not the root's — same reasoning as `align` above.
  showScrollButtons?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, on a small real set of tabs.
 */
export function tabsPlaygroundSnippet(args: TabsPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  attributes.push(`defaultValue="${args.defaultValue || "overview"}"`);
  if (args.variant && args.variant !== "underline") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.orientation && args.orientation !== "horizontal") attributes.push(`orientation="${args.orientation}"`);
  if (args.activationMode && args.activationMode !== "automatic") attributes.push(`activationMode="${args.activationMode}"`);
  if (args.fullWidth) attributes.push("fullWidth");
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  const listAttributes = [
    args.align && args.align !== "start" ? `align="${args.align}"` : "",
    args.showScrollButtons === false ? "showScrollButtons={false}" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return tabs(attributes.join(" "), list(listAttributes));
}
