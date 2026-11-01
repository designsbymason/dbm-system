// The code shown under each story's "Show code" button on Menubar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (a styled stage, a state hook that logs). Each snippet here is the smallest real usage of what its story
// shows, and `storySnippets.test.ts` checks that it uses only exports of the package.
// See `07-storybook-and-documentation-standards.md` §4.2.

import type { MenubarSize, MenubarSurface, MenubarTone } from "./Menubar.types";

const menubar = (barAttributes: string, body: string) =>
  `<Menubar aria-label="Application menu"${barAttributes ? ` ${barAttributes}` : ""}>
${body}
</Menubar>`;

const fileMenu = `  <Menubar.Menu value="file">
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>New</Menubar.Item>
      <Menubar.Item>Open</Menubar.Item>
      <Menubar.Item>Save</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>`;

const editMenu = `  <Menubar.Menu value="edit">
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>Undo</Menubar.Item>
      <Menubar.Item>Redo</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>`;

export const menubarSnippets = {
  iconsAndShortcuts: `{/* PencilSimpleIcon, CopyIcon and TrashIcon come from @dbm-system/icons.
    A shortcut hint is only displayed: bind the keys yourself. */}
${menubar(
  "",
  `  <Menubar.Menu value="file">
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item icon={PencilSimpleIcon} shortcut="F2">Rename</Menubar.Item>
      <Menubar.Item icon={CopyIcon} shortcut="⌘D">Duplicate</Menubar.Item>
      <Menubar.Separator />
      <Menubar.Item icon={TrashIcon} tone="danger">Delete</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>
${editMenu}`,
)}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the height of the triggers and the row size of
    every menu the bar opens. A Menubar.Content takes its own size to differ. */}
${menubar('size="lg"', `${fileMenu}\n${editMenu}`)}`,

  surfaces: `{/* surface: "ghost" (default, no surface) | "outlined" | "filled". */}
${menubar('surface="outlined"', `${fileMenu}\n${editMenu}`)}`,

  tones: `{/* tone: "brand" (default) | "neutral" — the colour of the triggers' hover and open fills and of the bar's own border and fill,
    all of them subtle. It reads best with a surface. */}
${menubar('tone="neutral" surface="outlined"', `${fileMenu}\n${editMenu}`)}`,

  checkboxAndRadio: `{/* A checkbox or radio item leaves the menu open when it is chosen; closeOnSelect closes it. */}
${menubar(
  "",
  `  <Menubar.Menu value="view">
    <Menubar.Trigger>View</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Label>Panels</Menubar.Label>
      <Menubar.CheckboxItem defaultChecked>Sidebar</Menubar.CheckboxItem>
      <Menubar.CheckboxItem>Status bar</Menubar.CheckboxItem>
      <Menubar.Separator />
      <Menubar.RadioGroup defaultValue="list" aria-label="Layout">
        <Menubar.RadioItem value="list">List</Menubar.RadioItem>
        <Menubar.RadioItem value="grid">Grid</Menubar.RadioItem>
      </Menubar.RadioGroup>
    </Menubar.Content>
  </Menubar.Menu>`,
)}`,

  submenus: `{/* A submenu opens on a pointer resting on its trigger or on the key that points toward it. */}
${menubar(
  "",
  `  <Menubar.Menu value="file">
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>New</Menubar.Item>
      <Menubar.Sub>
        <Menubar.SubTrigger>Share</Menubar.SubTrigger>
        <Menubar.SubContent>
          <Menubar.Item>Email</Menubar.Item>
          <Menubar.Item>Copy link</Menubar.Item>
        </Menubar.SubContent>
      </Menubar.Sub>
    </Menubar.Content>
  </Menubar.Menu>`,
)}`,

  disabled: `{/* A disabled trigger opens nothing and is skipped by the arrow keys. An item can be disabled
    with a reason that is shown and announced. */}
${menubar(
  "",
  `${fileMenu}
  <Menubar.Menu value="view">
    <Menubar.Trigger disabled>View</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>Zoom</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>`,
)}`,

  controlled: `{/* value is the menu that is open ("" for none): hold it in state with
    const [open, setOpen] = useState("");
    and set it from your own key handler (setOpen("file") on Alt+F) to open a menu from code.
    onValueChange reports every change, including the empty value when a menu closes. */}
${menubar("value={open} onValueChange={setOpen}", `${fileMenu}\n${editMenu}`)}`,

  overflowing: `{/* A bar wider than its container scrolls sideways, with a fade at each end that has more behind it,
    and keeps the trigger with focus in view. */}
<div style={{ inlineSize: 240 }}>
${menubar("", `${fileMenu}\n${editMenu}\n  {/* …more menus */}`)}
</div>`,

  rightToLeft: `{/* dir is passed to the bar and its menus: the arrow keys swap and submenus open on the start side. */}
${menubar('dir="rtl"', `${fileMenu}\n${editMenu}`)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface MenubarPlaygroundSnippetArgs {
  size?: MenubarSize;
  surface?: MenubarSurface;
  tone?: MenubarTone;
  loop?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real menu bar.
 */
export function menubarPlaygroundSnippet(
  args: MenubarPlaygroundSnippetArgs,
): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.surface && args.surface !== "ghost")
    attributes.push(`surface="${args.surface}"`);
  // `tone` defaults to brand, so it only needs writing when it is neutral.
  if (args.tone === "neutral") attributes.push('tone="neutral"');
  // `loop` defaults to true, so it only needs writing when it's off.
  if (args.loop === false) attributes.push("loop={false}");
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  return menubar(attributes.join(" "), `${fileMenu}\n${editMenu}`);
}
