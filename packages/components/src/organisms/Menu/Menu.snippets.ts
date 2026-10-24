// The code shown under each story's "Show code" button on Menu's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (a stage that opens the menu for a screenshot, a state hook that logs). Each snippet here is the smallest
// real usage of what its story shows, and `storySnippets.test.ts` checks that it uses only exports of the package.
// See `07-storybook-and-documentation-standards.md` §4.2.

import type { MenuAlign, MenuSide, MenuSize } from "./Menu.types";

const menu = (rootAttributes: string, contentAttributes: string, body: string) =>
  `<Menu${rootAttributes ? ` ${rootAttributes}` : ""}>
  <Menu.Trigger asChild>
    <Button variant="secondary">Actions</Button>
  </Menu.Trigger>
  <Menu.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${body}
  </Menu.Content>
</Menu>`;

const basicBody = `    <Menu.Item>Edit</Menu.Item>
    <Menu.Item>Duplicate</Menu.Item>
    <Menu.Item>Archive</Menu.Item>`;

export const menuSnippets = {
  iconsAndShortcuts: `{/* PencilSimpleIcon, CopyIcon and TrashIcon come from @dbm-system/icons.
    A shortcut hint is only displayed: bind the keys yourself. */}
${menu(
  "",
  "",
  `    <Menu.Item icon={PencilSimpleIcon} shortcut="⌘E">Edit</Menu.Item>
    <Menu.Item icon={CopyIcon} shortcut="⌘D">Duplicate</Menu.Item>
    <Menu.Separator />
    <Menu.Item icon={TrashIcon} tone="danger">Delete</Menu.Item>`,
)}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the row height and type size of every item. */}
${menu("", 'size="lg"', basicBody)}`,

  checkboxItems: `{/* Uncontrolled with defaultChecked, or controlled with checked and onCheckedChange. A checkbox
    item leaves the menu open when it is chosen; closeOnSelect closes it. */}
${menu(
  "",
  "",
  `    <Menu.CheckboxItem defaultChecked>Show grid</Menu.CheckboxItem>
    <Menu.CheckboxItem>Show rulers</Menu.CheckboxItem>
    <Menu.CheckboxItem checked="indeterminate">Some guides</Menu.CheckboxItem>`,
)}`,

  radioGroup: `{/* Uncontrolled with defaultValue, or controlled with value and onValueChange. */}
${menu(
  "",
  "",
  `    <Menu.RadioGroup defaultValue="name" aria-label="Sort by">
      <Menu.RadioItem value="name">Name</Menu.RadioItem>
      <Menu.RadioItem value="modified">Date modified</Menu.RadioItem>
      <Menu.RadioItem value="size">Size</Menu.RadioItem>
    </Menu.RadioGroup>`,
)}`,

  groupsAndLabels: `{/* A Menu.Label inside a Menu.Group names the group for assistive technology. */}
${menu(
  "",
  "",
  `    <Menu.Group>
      <Menu.Label>Account</Menu.Label>
      <Menu.Item>Profile</Menu.Item>
      <Menu.Item>Billing</Menu.Item>
    </Menu.Group>
    <Menu.Separator />
    <Menu.Group>
      <Menu.Label>Workspace</Menu.Label>
      <Menu.Item>Members</Menu.Item>
      <Menu.Item>Settings</Menu.Item>
    </Menu.Group>`,
)}`,

  submenu: `{/* ArrowRight opens a submenu and ArrowLeft closes it (swapped in right-to-left text). */}
${menu(
  "",
  "",
  `    <Menu.Item>Rename</Menu.Item>
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
    </Menu.Sub>`,
)}`,

  linkItems: `{/* asChild makes the anchor the menu item: it gets the role, the keyboard handling and the styles.
    The item draws none of its own content in this mode, so an icon goes inside the link. */}
${menu(
  "",
  "",
  `    <Menu.Item asChild>
      <a href="/docs">Documentation</a>
    </Menu.Item>
    <Menu.Item asChild>
      <a href="/changelog">Changelog</a>
    </Menu.Item>`,
)}`,

  descriptions: `{/* description is a second line, read as the item's description rather than its name; trailing
    is content at the end (a count, a Badge), before a shortcut hint. */}
${menu(
  "",
  "",
  `    <Menu.Item description="Plan and invoices" trailing={<Badge tone="info">New</Badge>}>
      Billing
    </Menu.Item>
    <Menu.Item description="People with access" trailing="12">
      Members
    </Menu.Item>
    <Menu.Item description="Keys and webhooks" shortcut="⌘.">
      Developer
    </Menu.Item>`,
)}`,

  asyncAction: `{/* Return a promise from onSelect: the item shows a spinner and ignores presses while it is pending, the
    menu stays open, and it closes when the promise resolves. onSelectError gets a rejection (the menu stays
    open); closeOnSelect={false} keeps it open after a success too. */}
${menu(
  "",
  "",
  `    <Menu.Item
      icon={DownloadSimpleIcon}
      onSelect={() => exportRows()}
      onSelectError={(error) => showError(error)}
    >
      Export as CSV
    </Menu.Item>`,
)}`,

  closeOnSelect: `{/* closeOnSelect={false} keeps the menu open after an action; the item's onSelect still runs. */}
${menu(
  "",
  "",
  `    <Menu.Item closeOnSelect={false} onSelect={refresh}>
      Refresh
    </Menu.Item>
    <Menu.Item>Close</Menu.Item>`,
)}`,

  disabledReason: `{/* A disabled item with a reason stays focusable and aria-disabled, so a keyboard user reaches it,
    sees the reason in a tooltip and hears it as the item's description. It still can't be chosen. Without a
    reason a disabled item is dimmed and skipped. */}
${menu(
  "",
  "",
  `    <Menu.Item>Edit</Menu.Item>
    <Menu.Item disabled disabledReason="You need the admin role to delete">
      Delete
    </Menu.Item>
    <Menu.Item disabled>Archive</Menu.Item>`,
)}`,

  opensADialog: `{/* The dialog is a sibling of the menu, opened from state. When it closes, focus goes back to the
    menu's trigger on its own. */}
<Menu>
  <Menu.Trigger asChild>
    <Button variant="secondary">Actions</Button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item>Edit</Menu.Item>
    <Menu.Item tone="danger" onSelect={() => setConfirming(true)}>Delete</Menu.Item>
  </Menu.Content>
</Menu>
<ConfirmDialog
  open={confirming}
  onOpenChange={setConfirming}
  title="Delete this row?"
  description="This can't be undone."
  labels={{ confirm: "Delete" }}
  onConfirm={deleteRow}
/>`,

  disabledItems: `{/* A disabled item is dimmed, skipped by the arrow keys and typeahead, and can't be chosen. */}
${menu(
  "",
  "",
  `    <Menu.Item>Edit</Menu.Item>
    <Menu.Item disabled>Duplicate</Menu.Item>
    <Menu.Item>Archive</Menu.Item>`,
)}`,

  rowActions: `{/* DotsThreeIcon comes from @dbm-system/icons. The menu is named after its trigger, so an
    icon-only trigger needs an aria-label. */}
<Menu>
  <Menu.Trigger asChild>
    <IconButton icon={DotsThreeIcon} aria-label="Row actions" variant="ghost" />
  </Menu.Trigger>
  <Menu.Content align="end">
    <Menu.Item>Edit</Menu.Item>
    <Menu.Item>Duplicate</Menu.Item>
    <Menu.Separator />
    <Menu.Item tone="danger">Delete</Menu.Item>
  </Menu.Content>
</Menu>`,

  responsiveSide: `{/* side takes a mobile-first map, like Stack and Grid: below the lg breakpoint the menu opens
    below the trigger, from lg up it opens to its right. */}
${menu("", 'side={{ base: "bottom", lg: "right" }}', basicBody)}`,

  longMenu: `{/* A menu taller than the room there is scrolls inside its own panel. */}
${menu(
  "",
  "",
  `    {countries.map((country) => (
      <Menu.Item key={country}>{country}</Menu.Item>
    ))}`,
)}`,

  insideDialog: `{/* The panel is portaled above a Dialog it was opened from, and choosing an item leaves the
    dialog open. */}
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
</Dialog>`,

  sheet: `{/* A sheet is the menu drawn across the bottom of the screen, with taller rows and the page dimmed behind it: the shape
    a touch screen expects. It is the same menu, with the same keys and parts. A submenu covers it under a Back row. */}
${menu('presentation="sheet"', "", basicBody)}`,

  responsivePresentation: `{/* presentation takes a mobile-first map, like side: a sheet on a phone and the floating menu from md up. labels
    sets the Back row's text in a submenu's sheet. */}
${menu('presentation={{ base: "sheet", md: "menu" }}', "", basicBody)}`,

  rightToLeft: `{/* dir is passed to the menu and its submenus: they open on the start side and the keys swap. */}
${menu("dir=\"rtl\"", "", basicBody)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface MenuPlaygroundSnippetArgs {
  defaultOpen?: boolean;
  modal?: boolean;
  dir?: "ltr" | "rtl";
  presentation?: "menu" | "sheet";
  size?: MenuSize;
  side?: MenuSide;
  align?: MenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  loop?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real menu.
 */
export function menuPlaygroundSnippet(args: MenuPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  if (args.defaultOpen) rootAttributes.push("defaultOpen");
  // `modal` defaults to true, so it only needs writing when it's off.
  if (args.modal === false) rootAttributes.push("modal={false}");
  if (args.dir && args.dir !== "ltr") rootAttributes.push(`dir="${args.dir}"`);
  if (args.presentation && args.presentation !== "menu") rootAttributes.push(`presentation="${args.presentation}"`);

  const contentAttributes: string[] = [];
  if (args.size && args.size !== "md") contentAttributes.push(`size="${args.size}"`);
  if (args.side && args.side !== "bottom") contentAttributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") contentAttributes.push(`align="${args.align}"`);
  if (args.sideOffset !== undefined && args.sideOffset !== 4) contentAttributes.push(`sideOffset={${args.sideOffset}}`);
  if (args.alignOffset !== undefined && args.alignOffset !== 0) contentAttributes.push(`alignOffset={${args.alignOffset}}`);
  if (args.avoidCollisions === false) contentAttributes.push("avoidCollisions={false}");
  if (args.collisionPadding !== undefined && args.collisionPadding !== 8) {
    contentAttributes.push(`collisionPadding={${args.collisionPadding}}`);
  }
  if (args.loop) contentAttributes.push("loop");

  return menu(
    rootAttributes.join(" "),
    contentAttributes.join(" "),
    `    <Menu.Item shortcut="⌘E">Edit</Menu.Item>
    <Menu.Item shortcut="⌘D">Duplicate</Menu.Item>
    <Menu.Separator />
    <Menu.Item tone="danger">Delete</Menu.Item>`,
  );
}
