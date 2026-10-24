// The code shown under each story's "Show code" button on ContextMenu's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (a styled stage, a state hook that logs). Each snippet here is the smallest real usage of what its story
// shows, and `storySnippets.test.ts` checks that it uses only exports of the package.
// See `07-storybook-and-documentation-standards.md` §4.2.

import type { ContextMenuSize } from "./ContextMenu.types";

const area = `  <ContextMenu.Trigger tabIndex={0} aria-label="Project card">
    Right-click here
  </ContextMenu.Trigger>`;

const contextMenu = (rootAttributes: string, contentAttributes: string, body: string, trigger = area) =>
  `<ContextMenu${rootAttributes ? ` ${rootAttributes}` : ""}>
${trigger}
  <ContextMenu.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${body}
  </ContextMenu.Content>
</ContextMenu>`;

const basicBody = `    <ContextMenu.Item>Rename</ContextMenu.Item>
    <ContextMenu.Item>Duplicate</ContextMenu.Item>
    <ContextMenu.Item>Archive</ContextMenu.Item>`;

export const contextMenuSnippets = {
  iconsAndShortcuts: `{/* PencilSimpleIcon, CopyIcon and TrashIcon come from @dbm-system/icons.
    A shortcut hint is only displayed: bind the keys yourself. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Item icon={PencilSimpleIcon} shortcut="F2">Rename</ContextMenu.Item>
    <ContextMenu.Item icon={CopyIcon} shortcut="⌘D">Duplicate</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item icon={TrashIcon} tone="danger">Delete</ContextMenu.Item>`,
)}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the row height and type size of every item. */}
${contextMenu("", 'size="lg"', basicBody)}`,

  checkboxItems: `{/* Uncontrolled with defaultChecked, or controlled with checked and onCheckedChange. A checkbox
    item leaves the menu open when it is chosen; closeOnSelect closes it. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.CheckboxItem defaultChecked>Show grid</ContextMenu.CheckboxItem>
    <ContextMenu.CheckboxItem>Show rulers</ContextMenu.CheckboxItem>
    <ContextMenu.CheckboxItem checked="indeterminate">Some guides</ContextMenu.CheckboxItem>`,
)}`,

  radioGroup: `{/* Uncontrolled with defaultValue, or controlled with value and onValueChange. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.RadioGroup defaultValue="name" aria-label="Sort by">
      <ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
      <ContextMenu.RadioItem value="modified">Date modified</ContextMenu.RadioItem>
      <ContextMenu.RadioItem value="size">Size</ContextMenu.RadioItem>
    </ContextMenu.RadioGroup>`,
)}`,

  groupsAndLabels: `{/* A label inside a group names it for assistive technology. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Group>
      <ContextMenu.Label>Open</ContextMenu.Label>
      <ContextMenu.Item>Open</ContextMenu.Item>
      <ContextMenu.Item>Open in a new tab</ContextMenu.Item>
    </ContextMenu.Group>
    <ContextMenu.Separator />
    <ContextMenu.Group>
      <ContextMenu.Label>Organize</ContextMenu.Label>
      <ContextMenu.Item>Move</ContextMenu.Item>
      <ContextMenu.Item>Rename</ContextMenu.Item>
    </ContextMenu.Group>`,
)}`,

  submenu: `{/* ArrowRight opens a submenu (ArrowLeft in right-to-left text) and ArrowLeft closes it. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Item>Rename</ContextMenu.Item>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Copy link</ContextMenu.Item>
        <ContextMenu.Item>Email</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>`,
)}`,

  descriptions: `{/* description is a second line, read as the item's description; trailing is content at its end. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Item description="Plan and invoices" trailing={<Badge tone="info">New</Badge>}>
      Billing
    </ContextMenu.Item>
    <ContextMenu.Item description="People who can open this">Members</ContextMenu.Item>`,
)}`,

  asyncAction: `{/* Return a promise from onSelect: the item shows a spinner, the menu waits, and it closes when the
    promise settles. exportRows is your own function. */}
${contextMenu("", "", `    <ContextMenu.Item onSelect={() => exportRows()}>Export as CSV</ContextMenu.Item>`)}`,

  disabledReason: `{/* A disabled item with a reason stays focusable, so a keyboard user can reach it and hear why. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Item>Rename</ContextMenu.Item>
    <ContextMenu.Item disabled disabledReason="Only an owner can delete this">Delete</ContextMenu.Item>`,
)}`,

  longMenu: `{/* A panel taller than the room scrolls, with a fade at each end that has more behind it. */}
${contextMenu(
  "",
  "",
  `    <ContextMenu.Item>Argentina</ContextMenu.Item>
    <ContextMenu.Item>Australia</ContextMenu.Item>
    <ContextMenu.Item>Austria</ContextMenu.Item>
    {/* …and as many more as there are */}`,
)}`,

  rows: `{/* The row is the trigger (asChild) and is made focusable with tabIndex, so the context-menu key and Shift+F10 open its menu.
    Every action is also on the row's own button: a context menu is a shortcut, never the only way. */}
<ContextMenu>
  <ContextMenu.Trigger asChild tabIndex={0}>
    <li>
      quarterly-report.pdf
      <Menu>
        <Menu.Trigger asChild>
          <IconButton icon={DotsThreeIcon} aria-label="Actions for quarterly-report.pdf" variant="ghost" />
        </Menu.Trigger>
        <Menu.Content align="end">{/* the same items */}</Menu.Content>
      </Menu>
    </li>
  </ContextMenu.Trigger>
  <ContextMenu.Content>{/* the same items */}</ContextMenu.Content>
</ContextMenu>`,

  openingStyle: `{/* While the menu is open the area carries data-state="open", so the thing it was opened on can show it. */}
<ContextMenu.Trigger asChild tabIndex={0}>
  <li className="row">quarterly-report.pdf</li>
</ContextMenu.Trigger>
{/* .row[data-state="open"] { background: … } */}`,

  opensADialog: `{/* Keep the dialog beside the menu and open it from state. Focus goes back to the row. */}
{/* const [confirming, setConfirming] = useState(false); */}
<ContextMenu>
  <ContextMenu.Trigger asChild tabIndex={0}>
    <li>quarterly-report.pdf</li>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item tone="danger" onSelect={() => setConfirming(true)}>Delete…</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>
<ConfirmDialog
  open={confirming}
  onOpenChange={setConfirming}
  title="Delete quarterly-report.pdf?"
  description="This can't be undone."
  labels={{ confirm: "Delete" }}
  onConfirm={deleteFile}
/>`,

  insideDialog: `{/* The panel sits above the dialog's scrim, so it can be used from inside one. */}
<Dialog>
  <Dialog.Content>
    <Dialog.Body>
      <ContextMenu>
        <ContextMenu.Trigger tabIndex={0}>Right-click here</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </Dialog.Body>
  </Dialog.Content>
</Dialog>`,

  rightToLeft: `{/* dir is passed to the menu and its submenus: they open on the start side and the keys swap. */}
${contextMenu('dir="rtl"', "", basicBody)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ContextMenuPlaygroundSnippetArgs {
  modal?: boolean;
  dir?: "ltr" | "rtl";
  size?: ContextMenuSize;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  loop?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real menu.
 */
export function contextMenuPlaygroundSnippet(args: ContextMenuPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  // `modal` defaults to true, so it only needs writing when it's off.
  if (args.modal === false) rootAttributes.push("modal={false}");
  if (args.dir && args.dir !== "ltr") rootAttributes.push(`dir="${args.dir}"`);

  const contentAttributes: string[] = [];
  if (args.size && args.size !== "md") contentAttributes.push(`size="${args.size}"`);
  if (args.alignOffset !== undefined && args.alignOffset !== 0) contentAttributes.push(`alignOffset={${args.alignOffset}}`);
  if (args.avoidCollisions === false) contentAttributes.push("avoidCollisions={false}");
  if (args.collisionPadding !== undefined && args.collisionPadding !== 8) {
    contentAttributes.push(`collisionPadding={${args.collisionPadding}}`);
  }
  if (args.loop) contentAttributes.push("loop");

  return contextMenu(
    rootAttributes.join(" "),
    contentAttributes.join(" "),
    `    <ContextMenu.Item shortcut="F2">Rename</ContextMenu.Item>
    <ContextMenu.Item shortcut="⌘D">Duplicate</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item tone="danger">Delete</ContextMenu.Item>`,
  );
}
