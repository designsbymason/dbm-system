// The code shown under each story's "Show code" button on CommandPalette's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open dialog inside its Docs frame, the `container` it is given, the sample
// commands), which can't be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";

export const commandPaletteSnippets = {
  basic: `{/* Press Ctrl+K (⌘K on a Mac) from anywhere, or the trigger. Commands with the same group are listed under one
    heading; the search matches the label and the keywords, and the best match comes first. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  commands={[
    { value: "new-file", label: "New file", group: "File", icon: FilePlusIcon, shortcut: ["Ctrl", "N"], onSelect: newFile },
    { value: "open-file", label: "Open file", group: "File", description: "From your computer", onSelect: openFile },
    { value: "settings", label: "Open settings", group: "App", icon: GearIcon, keywords: ["preferences"], onSelect: openSettings },
    { value: "publish", label: "Publish", group: "App", disabled: "Connect to the internet first" },
  ]}
/>`,

  details: `{/* A command takes an icon, a description, keywords the search matches but never shows, a group, a
    shortcut hint (display only: bind the key yourself) and a reason for being disabled. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  commands={[
    {
      value: "copy-link",
      label: "Copy link",
      description: "To this page",
      icon: CopyIcon,
      keywords: ["share", "url"],
      shortcut: ["Ctrl", "L"],
      onSelect: copyLink,
    },
    { value: "publish", label: "Publish", disabled: "Connect to the internet first" },
  ]}
/>`,

  lists: `{/* items: choosing a command opens them as a list of its own, under a Back button. Backspace on an empty search
    goes back, and Escape closes the palette from either level. One level is supported. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  commands={[
    {
      value: "theme",
      label: "Change theme",
      icon: PaletteIcon,
      items: [
        { value: "light", label: "Light", onSelect: () => setTheme("light") },
        { value: "dark", label: "Dark", onSelect: () => setTheme("dark") },
      ],
    },
    { value: "settings", label: "Open settings", onSelect: openSettings },
  ]}
/>`,

  recent: `{/* recent: the values of commands to list first, under a heading of their own, while the search is empty.
    The palette remembers nothing: keep the list wherever suits the app. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  recent={["settings", "new-file"]}
  commands={commands}
/>`,

  waiting: `{/* onSelect returns a promise: the row shows a spinner, the palette can't be dismissed, and it closes when the
    promise resolves. A rejection keeps it open and goes to onSelectError. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  onSelectError={(error, item) => toast.error(\`\${item.label} failed\`)}
  commands={[
    { value: "sync", label: "Sync now", icon: ArrowsClockwiseIcon, onSelect: () => api.sync() },
    { value: "export", label: "Export data", onSelect: () => api.export() },
  ]}
/>`,

  searchByTheCaller: `{/* filter={false} leaves the list as given: fetch the commands as the person types and pass loading while
    they are on their way. const [query, setQuery] = useState(""); const { data, isFetching } = useSearch(query); */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  filter={false}
  query={query}
  onQueryChange={setQuery}
  loading={isFetching}
  commands={data}
/>`,

  loadingAndError: `{/* loading shows a spinner in the search row and "Loading…" while there are no commands; error adds a note under
    the list and announces it. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  loading={isFetching}
  error={failed}
  commands={commands}
/>`,

  longList: `{/* A long list is drawn a window at a time, so a thousand commands cost no more than twenty. */}
<CommandPalette trigger={<Button variant="secondary">Search…</Button>} commands={allCommands} />`,

  fromCode: `{/* const palette = useRef<CommandPaletteController>(null);
    controllerRef gives open(), close() and toggle(), each saying whether it had anything to do. Opened from your own
    state, onOpenChange reports why it opened or closed: "trigger", "hotkey", "controller", "select", "escape"… */}
<CommandPalette
  controllerRef={palette}
  hotkey={false}
  commands={commands}
  onOpenChange={(open, { reason }) => track(open, reason)}
/>
<Button onClick={() => palette.current?.toggle()}>Commands</Button>`,

  hotkey: `{/* hotkey: "mod+k" (the default; mod is ⌘ on an Apple platform, Ctrl elsewhere), any other combination of
    ctrl, alt, shift, meta and a key, or false for none. The press is kept from the browser. */}
<CommandPalette hotkey="mod+shift+p" commands={commands} />`,

  rightToLeft: `{/* dir is passed on, not read from the page. */}
<CommandPalette dir="rtl" trigger={<Button variant="secondary">بحث…</Button>} commands={commands} />`,

  fullScreen: `{/* fullScreen takes a mobile-first map: the whole screen on a phone, a panel from sm up. Turn the close button
    on with it, since there is no scrim to press. */}
<CommandPalette
  fullScreen={{ base: true, sm: false }}
  showCloseButton
  trigger={<Button variant="secondary">Search…</Button>}
  commands={commands}
/>`,

  footer: `{/* showHints draws the key hints (arrows, Enter, Escape) and footer adds content at the end. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  footer={<Link href="/help">Help</Link>}
  commands={commands}
/>`,

  renderItem: `{/* renderItem draws a row yourself, in place of the icon, label and description. The highlight and the
    shortcut still come from the palette. */}
<CommandPalette
  trigger={<Button variant="secondary">Search…</Button>}
  commands={people}
  renderItem={(person) => (
    <Stack direction="row" gap={2} align="center">
      <Avatar name={person.label} size="xs" />
      <Text as="span">{person.label}</Text>
    </Stack>
  )}
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CommandPalettePlaygroundSnippetArgs {
  hotkey?: string | false;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  placement?: "center" | "top";
  showHints?: boolean;
  showCloseButton?: boolean;
  scrimBlur?: boolean;
  loading?: boolean;
  error?: boolean;
  dir?: "ltr" | "rtl";
  highlightTone?: "warning" | "highlight" | "success" | "info" | "danger" | "none";
  defaultQuery?: string;
  placeholder?: string;
}

/** The Playground's snippet: only the props that differ from their defaults, around a small real palette. */
export function commandPalettePlaygroundSnippet(args: CommandPalettePlaygroundSnippetArgs): string {
  const attributes: string[] = ['trigger={<Button variant="secondary">Search…</Button>}'];
  if (args.hotkey === false) attributes.push("hotkey={false}");
  else if (args.hotkey && args.hotkey !== "mod+k") attributes.push(`hotkey=${quote(args.hotkey)}`);
  if (args.size && args.size !== "lg") attributes.push(`size="${args.size}"`);
  if (args.placement && args.placement !== "top") attributes.push(`placement="${args.placement}"`);
  if (args.showHints === false) attributes.push("showHints={false}");
  if (args.showCloseButton) attributes.push("showCloseButton");
  if (args.scrimBlur) attributes.push("scrimBlur");
  if (args.loading) attributes.push("loading");
  if (args.error) attributes.push("error");
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args.highlightTone && args.highlightTone !== "none") attributes.push(`highlightTone="${args.highlightTone}"`);
  if (args.defaultQuery) attributes.push(`defaultQuery=${quote(args.defaultQuery)}`);
  if (args.placeholder) attributes.push(`labels={{ placeholder: ${JSON.stringify(args.placeholder)} }}`);
  attributes.push(`commands={[
    { value: "new-file", label: "New file", group: "File", shortcut: ["Ctrl", "N"], onSelect: newFile },
    { value: "settings", label: "Open settings", group: "App", keywords: ["preferences"], onSelect: openSettings },
  ]}`);
  return `<CommandPalette\n${attributes.map((attribute) => `  ${attribute}`).join("\n")}\n/>`;
}
