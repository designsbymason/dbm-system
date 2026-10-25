import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { MagnifyingGlassIcon } from "@dbm-system/icons";
import { useRecentCommands } from "@dbm-system/utils";
import { useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Kbd } from "../../atoms/Kbd";
import { Stack } from "../../atoms/Stack";
import { Text } from "../../atoms/Text";
import { CommandPalette } from "./CommandPalette";
import { commandPalettePlaygroundSnippet, commandPaletteSnippets } from "./CommandPalette.snippets";
import type { CommandItem, CommandPaletteController, CommandPaletteProps } from "./CommandPalette.types";
import { PaletteStage, askingCommands, groupedCommands, manyCommands, sampleCommands, sampleModes, slowCommands } from "./CommandPaletteStoryKit";

// The Playground adds a Playground-only control (the placeholder), which is a field of the real `labels` prop and so
// not a prop itself.
interface PlaygroundArgs extends CommandPaletteProps {
  placeholder: string;
}

const searchTrigger = (
  <Button variant="secondary" leadingIcon={MagnifyingGlassIcon}>
    Search…
  </Button>
);

// Every control of the real props, for a story whose fixed render uses none of them.
const noControls = {
  hotkey: { control: false },
  size: { control: false },
  placement: { control: false },
  showHints: { control: false },
  showCloseButton: { control: false },
  scrimBlur: { control: false },
  loading: { control: false },
  error: { control: false },
  dir: { control: false },
  highlightTone: { control: false },
  defaultQuery: { control: false },
  searchNested: { control: false },
  maxPerGroup: { control: false },
  placeholder: { control: false },
  onOpenChange: { control: false },
  onSelect: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/CommandPalette",
  component: CommandPalette,
  parameters: { layout: "padded" },
  argTypes: {
    commands: {
      control: false,
      description:
        "The commands, in the order to list them. Each has a value, a label, and optionally a description, icon, keywords, group, shortcut, a reason for being disabled, an onSelect, closeOnSelect and items (a list of its own). Commands with the same group are listed together.",
      table: { defaultValue: { summary: "[]" } },
    },
    open: {
      control: false,
      description: "The controlled open state. Omit (along with defaultOpen) to let the palette manage its own open state.",
    },
    defaultOpen: {
      control: false,
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state and { reason }: trigger, hotkey, controller, select, escape, outside, close-button or close.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once the palette has finished opening and with false once it has finished closing and is out of the page.",
    },
    trigger: {
      control: false,
      description: "An element that opens the palette when pressed, usually a Button. Leave it out to open it with the hotkey, open or the controller.",
    },
    hotkey: {
      control: "text",
      description:
        "The key combination that opens the palette when it is closed and closes it when it is open, from anywhere on the page. mod is ⌘ on an Apple platform and Ctrl elsewhere; the others are ctrl, alt, shift and meta, joined by +. false turns it off. The press is kept from the browser.",
      table: { defaultValue: { summary: '"mod+k"' } },
    },
    query: {
      control: false,
      description: "The controlled text in the search field.",
    },
    defaultQuery: {
      control: "text",
      description: "The text the search starts with, each time the palette opens. Ignored once query is provided.",
      table: { defaultValue: { summary: '""' } },
    },
    onQueryChange: {
      control: false,
      description: "Called with the new text as the person types, and with an empty string when opening a list clears it.",
    },
    filter: {
      control: false,
      description:
        "How commands are matched to the search. By default every word must be found in a command's label or keywords and the best matches come first within each group. A function keeps or drops each command and leaves the order; false leaves the list as given, for a search the caller does itself.",
    },
    searchNested: {
      control: "boolean",
      description:
        "Whether a search at the top level also finds the commands inside lists, listing each under its parent command's label. Try searching \"dark\". Has no effect inside a list or with filter={false}.",
      table: { defaultValue: { summary: "true" } },
    },
    modes: {
      control: false,
      description:
        "Sets of commands reached by typing a prefix at the start of the search, such as > for actions or @ for people. Each is { prefix, label, commands, placeholder, emptyContent }. Only at the top level. The footer hints each prefix.",
    },
    maxPerGroup: {
      control: "number",
      description:
        "The most commands of each group to list while the search is empty, with a row after them that shows the rest. Searching lists every match; the recent and suggested groups are never cut. 0 caps nothing.",
      table: { defaultValue: { summary: "0" } },
    },
    suggested: {
      control: false,
      description: "The values of commands to list after recent, under a heading of their own, while the search is empty. A command shows once, in the first group that names it.",
    },
    onHighlightChange: {
      control: false,
      description:
        "Called with the highlighted command whenever it changes, and with null when none is highlighted or the palette closes. For a preview that follows the highlight: put things back when it reports null.",
    },
    recent: {
      control: false,
      description:
        "The values of commands to list first, under a heading of their own, while the search is empty. A command shows once. The palette remembers nothing.",
    },
    loading: {
      control: "boolean",
      description: "Shows that the commands are on their way: a spinner in the search row, and a note in place of \"No results\" while there are none.",
      table: { defaultValue: { summary: "false" } },
    },
    error: {
      control: "boolean",
      description: "Shows an error note under the list (labels.error) and announces it.",
      table: { defaultValue: { summary: "false" } },
    },
    emptyContent: {
      control: false,
      description: "What the list says when nothing matches, in place of labels.noResults.",
    },
    onSelect: {
      control: false,
      description: "Called when a command is chosen, after its own onSelect, with the command and the text in the search. A command that opens a list does not call it.",
    },
    onDisabledSelect: {
      control: false,
      description:
        "Called when a disabled command is pressed (clicked or tapped; the arrow keys skip such rows), with the command and its reason if disabled was a string. The palette stays open: this is where to say why.",
    },
    onSelectError: {
      control: false,
      description:
        "Called when a command's onSelect returned a promise that rejected. The palette stays open and announces labels.failed. With no handler the rejection is left unhandled so it is not lost silently.",
    },
    renderItem: {
      control: false,
      description: "Draws a command's row yourself, in place of the icon, label and description. Receives the command and { highlighted }.",
    },
    highlightTone: {
      control: "select",
      options: ["warning", "highlight", "success", "info", "danger"],
      description: "Adds colour to the bold match in each label. Without it the match is bold only.",
    },
    showHints: {
      control: "boolean",
      description: "Shows the footer's key hints (arrows, Enter, Escape). They are not drawn on a touch screen either way.",
      table: { defaultValue: { summary: "true" } },
    },
    footer: {
      control: false,
      description: "Content for the end of the footer: a link to help, a count.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The panel's maximum width, on Dialog's steps (20, 24, 32, 42 and 56rem). On a viewport narrower than the step the panel fills the width less a gutter.",
      table: { defaultValue: { summary: '"lg"' } },
    },
    placement: {
      control: "select",
      options: ["top", "center"],
      description: "Where the panel sits. A palette sits at the top by default so it doesn't jump as the results change.",
      table: { defaultValue: { summary: '"top"' } },
    },
    fullScreen: {
      control: false,
      description:
        "Fills the whole viewport. A mobile-first map switches it at a breakpoint, e.g. { base: true, sm: false }. Off by default.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows Dialog's close button in the panel's corner. Off by default; turn it on with fullScreen, where there is no scrim to press.",
      table: { defaultValue: { summary: "false" } },
    },
    scrimBlur: {
      control: "boolean",
      description: "Blurs the page behind the scrim as well as dimming it.",
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      description: "Renders the palette into a different DOM node than document.body, to keep an embedded demo inside its own box.",
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction of the palette. It is passed on, not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: {
      control: false,
      description:
        "The words the palette writes itself: title, search, searchIn (a function of a list's label), placeholder, runWith, argumentEmpty, argumentInvalid, suggested, showMore, noResults, loading, error, failed, back, recent, results (a function of the count) and the three footer hints. Pass the ones to replace.",
      table: { defaultValue: { summary: "" } },
    },
    formatNumber: {
      control: false,
      description: "Writes the count the palette announces with your own function. labels' functions are handed the plain number.",
      table: { defaultValue: { summary: "String" } },
    },
    controllerRef: {
      control: false,
      description: "An object that receives the palette's controller: open(), close(), toggle() and isOpen. useCommandPaletteController() returns the same one inside the palette.",
    },
    "aria-label": {
      control: false,
      description: "Accessible name for the dialog, in place of labels.title.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of an element to use as the dialog's accessible name instead of labels.title.",
    },
    id: { control: false, description: "Standard DOM id, applied to the dialog panel." },
    className: { control: false, description: "Additional CSS classes for customization, on the dialog panel." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; no visual or behavioral effect.",
    },
  },
  args: {
    hotkey: "mod+k",
    defaultQuery: "",
    searchNested: true,
    maxPerGroup: 0,
    loading: false,
    error: false,
    showHints: true,
    size: "lg",
    placement: "top",
    showCloseButton: false,
    scrimBlur: false,
    dir: "ltr",
    onOpenChange: fn(),
    onSelect: fn(),
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => commandPalettePlaygroundSnippet(context.args),
};

/**
 * Drive every prop live via the Controls panel below. Press the trigger, or Ctrl+K (⌘K on a Mac) from anywhere on this
 * page, to open it.
 */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
  // Playground-only: a field of the real `labels` prop, so it is kept off the meta (and the Properties table).
  args: { placeholder: "Type a command or search…" },
  argTypes: {
    placeholder: { control: "text", description: "The search field's placeholder (labels.placeholder)." },
    highlightTone: {
      control: "select",
      options: ["none", "warning", "highlight", "success", "info", "danger"],
      mapping: { none: undefined, warning: "warning", highlight: "highlight", success: "success", info: "info", danger: "danger" },
      description: "Adds colour to the bold match in each label: none (bold only), or a tone from Highlight's scale.",
    },
  },
  render: ({ placeholder, ...args }) => (
    <PaletteStage minBlockSize="34rem">
      {(container) => (
        <CommandPalette
          {...args}
          container={container}
          trigger={searchTrigger}
          commands={sampleCommands}
          recent={["settings"]}
          labels={{ placeholder: placeholder || undefined }}
        />
      )}
    </PaletteStage>
  ),
};

/** Opens from a trigger, lists commands under headings with icons, descriptions and shortcut hints. */
export const Groups: Story = {
  name: "Groups and details",
  parameters: { docs: { source: { code: commandPaletteSnippets.details } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => <CommandPalette container={container} hotkey={false} trigger={searchTrigger} commands={sampleCommands} />}
    </PaletteStage>
  ),
};

/** A command with `items` opens them as a list of its own under a Back button. */
export const Lists: Story = {
  name: "Lists of commands",
  parameters: { docs: { source: { code: commandPaletteSnippets.lists } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          trigger={searchTrigger}
          commands={sampleCommands.filter((command) => ["theme", "settings", "new-file"].includes(command.value))}
        />
      )}
    </PaletteStage>
  ),
};

/** `recent` lists some commands first, under a heading of their own, while the search is empty. */
export const Recent: Story = {
  name: "Recent commands",
  parameters: { docs: { source: { code: commandPaletteSnippets.recent } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          trigger={searchTrigger}
          commands={sampleCommands}
          recent={["settings", "new-file"]}
        />
      )}
    </PaletteStage>
  ),
};

function DisabledExample({ container }: { container: HTMLElement | null }) {
  const [message, setMessage] = useState("Press “Publish”, which can't run.");
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        trigger={searchTrigger}
        commands={sampleCommands.filter((command) => command.group !== "Account")}
        onDisabledSelect={(item, details) => setMessage(`“${item.label}” can't run: ${details.reason ?? "no reason given"}.`)}
      />
      <Text size="sm" color="secondary">
        {message}
      </Text>
    </Stack>
  );
}

/** Pressing a disabled command calls `onDisabledSelect`, so an app can say why. */
export const DisabledCommands: Story = {
  name: "Explaining a disabled command",
  parameters: { docs: { source: { code: commandPaletteSnippets.disabled } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <DisabledExample container={container} />}</PaletteStage>,
};

function RememberedExample({ container }: { container: HTMLElement | null }) {
  const { recent, add, clear } = useRecentCommands("story-palette", { storage: "session", max: 3 });
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        trigger={searchTrigger}
        commands={sampleCommands.filter((command) => command.items === undefined)}
        recent={recent}
        onSelect={(item) => add(item.value)}
      />
      <Button variant="tertiary" size="sm" onClick={clear}>
        Forget recent commands
      </Button>
      <Text size="sm" color="secondary">
        Run a command, then open the palette again: the last three come first.
      </Text>
    </Stack>
  );
}

/** `useRecentCommands` remembers what was run (here for this tab only) and hands it back as `recent`. */
export const Remembered: Story = {
  name: "Remembering recent commands",
  parameters: { docs: { source: { code: commandPaletteSnippets.remembered } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <RememberedExample container={container} />}</PaletteStage>,
};

function WaitingExample({ container }: { container: HTMLElement | null }) {
  const [message, setMessage] = useState("Choose “Sync now” to see it work.");
  const [succeed, setSucceed] = useState(true);
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        trigger={searchTrigger}
        commands={slowCommands(succeed)}
        onSelect={(item) => setMessage(`Ran “${item.label}”.`)}
        onSelectError={(error) => setMessage(`Failed: ${(error as Error).message}. The palette stayed open.`)}
      />
      <Button variant="tertiary" size="sm" onClick={() => setSucceed((current) => !current)}>
        {succeed ? "Make it fail" : "Make it succeed"}
      </Button>
      <Text size="sm" color="secondary">
        {message}
      </Text>
    </Stack>
  );
}

/** A command that returns a promise keeps the palette open and busy until it settles. */
export const Waiting: Story = {
  name: "Commands that take time",
  parameters: { docs: { source: { code: commandPaletteSnippets.waiting } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <WaitingExample container={container} />}</PaletteStage>,
};

const fruit = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Lemon", "Mango", "Orange", "Peach", "Pear"];

function SearchByTheCallerExample({ container }: { container: HTMLElement | null }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<CommandItem[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const search = (text: string) => {
    setQuery(text);
    window.clearTimeout(timer.current);
    if (text.trim() === "") {
      setLoading(false);
      setFound([]);
      return;
    }
    setLoading(true);
    // A server that takes a moment to answer.
    timer.current = window.setTimeout(() => {
      setFound(fruit.filter((name) => name.toLowerCase().includes(text.trim().toLowerCase())).map((name) => ({ value: name, label: name })));
      setLoading(false);
    }, 600);
  };
  return (
    <CommandPalette
      container={container}
      hotkey={false}
      trigger={searchTrigger}
      filter={false}
      query={query}
      onQueryChange={search}
      loading={loading}
      commands={found}
      labels={{ placeholder: "Search fruit…", noResults: query.trim() === "" ? "Type to search" : "No results" }}
    />
  );
}

/** `filter={false}` leaves the list to the caller: here a pretend server answers after a moment. */
export const SearchByTheCaller: Story = {
  name: "Search done by the caller",
  parameters: { docs: { source: { code: commandPaletteSnippets.searchByTheCaller } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <SearchByTheCallerExample container={container} />}</PaletteStage>,
};

/** `loading` and `error` show what is happening to the list. */
export const LoadingAndError: Story = {
  name: "Loading and error",
  parameters: { docs: { source: { code: commandPaletteSnippets.loadingAndError } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <Stack direction="row" gap={3}>
          <CommandPalette container={container} hotkey={false} trigger={<Button variant="secondary">Loading</Button>} commands={[]} loading />
          <CommandPalette
            container={container}
            hotkey={false}
            trigger={<Button variant="secondary">Error</Button>}
            commands={sampleCommands.slice(0, 3)}
            error
          />
        </Stack>
      )}
    </PaletteStage>
  ),
};

const thousand = manyCommands(1000);

/** A thousand commands: only the rows in view are drawn. */
export const LongList: Story = {
  name: "A long list",
  parameters: { docs: { source: { code: commandPaletteSnippets.longList } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => <CommandPalette container={container} hotkey={false} trigger={searchTrigger} commands={thousand} />}
    </PaletteStage>
  ),
};

function FromCodeExample({ container }: { container: HTMLElement | null }) {
  const palette = useRef<CommandPaletteController>(null);
  const [reason, setReason] = useState("nothing yet");
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        controllerRef={palette}
        commands={sampleCommands}
        onOpenChange={(open, details) => setReason(`${open ? "opened" : "closed"} by ${details.reason}`)}
      />
      <Button variant="secondary" onClick={() => palette.current?.toggle()}>
        Commands
      </Button>
      <Text size="sm" color="secondary">
        Last change: {reason}
      </Text>
    </Stack>
  );
}

/** Opened and closed from code, through the controller. */
export const FromCode: Story = {
  name: "Opened from code",
  parameters: { docs: { source: { code: commandPaletteSnippets.fromCode } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <FromCodeExample container={container} />}</PaletteStage>,
};

/** Footer content and the key hints. */
export const Footer: Story = {
  name: "Footer",
  parameters: { docs: { source: { code: commandPaletteSnippets.footer } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          trigger={searchTrigger}
          commands={sampleCommands}
          footer={
            <Text as="span" size="xs" color="secondary">
              Press <Kbd>?</Kbd> for help
            </Text>
          }
        />
      )}
    </PaletteStage>
  ),
};

/** Read right to left. */
export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: commandPaletteSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          dir="rtl"
          trigger={<Button variant="secondary">بحث…</Button>}
          commands={sampleCommands}
          labels={{
            title: "لوحة الأوامر",
            search: "ابحث في الأوامر",
            placeholder: "اكتب أمرًا أو ابحث…",
            noResults: "لا توجد نتائج",
            back: "رجوع",
            hintNavigate: "تنقل",
            hintSelect: "اختيار",
            hintClose: "إغلاق",
          }}
        />
      )}
    </PaletteStage>
  ),
};

/** The whole screen, with a close button of its own. Here "the screen" is the box the demo sits in. */
export const FullScreen: Story = {
  name: "Full screen",
  parameters: { docs: { source: { code: commandPaletteSnippets.fullScreen } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          fullScreen
          showCloseButton
          trigger={searchTrigger}
          commands={sampleCommands}
        />
      )}
    </PaletteStage>
  ),
};

function PreviewExample({ container }: { container: HTMLElement | null }) {
  const [theme, setTheme] = useState("light");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const shown = previewing ?? theme;
  const commands: CommandItem[] = [
    { value: "light", label: "Light", onSelect: () => setTheme("light") },
    { value: "dark", label: "Dark", onSelect: () => setTheme("dark") },
    { value: "sepia", label: "Sepia", onSelect: () => setTheme("sepia") },
  ];
  const fill = { light: "var(--dbm-bg-surface)", dark: "var(--dbm-gray-900)", sepia: "var(--dbm-yellow-100)" } as const;
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        trigger={searchTrigger}
        commands={commands}
        onHighlightChange={(item) => setPreviewing(item?.value ?? null)}
      />
      <div
        style={{
          background: fill[shown as keyof typeof fill],
          border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-md)",
          padding: "var(--dbm-space-3) var(--dbm-space-6)",
        }}
      >
        <Text size="sm" color="secondary">
          {previewing && previewing !== theme ? `Previewing ${previewing}` : `Theme: ${theme}`}
        </Text>
      </div>
    </Stack>
  );
}

/** `onHighlightChange` follows the highlight, so a choice can be tried before it is made. */
export const Preview: Story = {
  name: "Preview as you move",
  parameters: { docs: { source: { code: commandPaletteSnippets.preview } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <PreviewExample container={container} />}</PaletteStage>,
};

function AskingExample({ container }: { container: HTMLElement | null }) {
  const [message, setMessage] = useState("Choose “Rename file” and give it a name.");
  return (
    <Stack gap={3} align="center">
      <CommandPalette
        container={container}
        hotkey={false}
        trigger={searchTrigger}
        commands={askingCommands}
        onSelect={(item, details) => setMessage(details.argument === undefined ? `Ran “${item.label}”.` : `Ran “${item.label}” with “${details.argument}”.`)}
      />
      <Text size="sm" color="secondary">
        {message}
      </Text>
    </Stack>
  );
}

/** A command with an `argument` asks for a value in the search field before it runs. */
export const Asking: Story = {
  name: "Commands that ask for a value",
  parameters: { docs: { source: { code: commandPaletteSnippets.asking } } },
  argTypes: { ...noControls },
  render: () => <PaletteStage>{(container) => <AskingExample container={container} />}</PaletteStage>,
};

/** `modes` are sets of commands reached by a prefix: try `>` and `@`. */
export const Modes: Story = {
  name: "Modes reached by a prefix",
  parameters: { docs: { source: { code: commandPaletteSnippets.modes } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette container={container} hotkey={false} trigger={searchTrigger} commands={sampleCommands} modes={sampleModes} />
      )}
    </PaletteStage>
  ),
};

/** `maxPerGroup` cuts each group while the search is empty, and `suggested` lists a few first. */
export const CappedGroups: Story = {
  name: "Capped and suggested groups",
  parameters: { docs: { source: { code: commandPaletteSnippets.capped } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage minBlockSize="40rem">
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          trigger={searchTrigger}
          commands={groupedCommands}
          maxPerGroup={2}
          recent={["Views-3"]}
          suggested={["Tools-1", "Files-4"]}
        />
      )}
    </PaletteStage>
  ),
};

/** Shortcuts written with `mod` are drawn for the platform: ⌘ on a Mac, Ctrl elsewhere. */
export const PlatformShortcuts: Story = {
  name: "Shortcuts written for the platform",
  parameters: { docs: { source: { code: commandPaletteSnippets.platformShortcuts } } },
  argTypes: { ...noControls },
  render: () => (
    <PaletteStage>
      {(container) => (
        <CommandPalette
          container={container}
          hotkey={false}
          trigger={searchTrigger}
          commands={[
            { value: "new", label: "New file", shortcut: ["mod", "N"] },
            { value: "palette", label: "Show all commands", shortcut: "mod+shift+P" },
            { value: "next", label: "Next tab", shortcut: ["ctrl", "Tab"] },
            { value: "find", label: "Find in file", shortcut: "mod+F" },
          ]}
        />
      )}
    </PaletteStage>
  ),
};

/** Searches, moves with the keys and runs a command — the interaction test of the Playground. */
export const SearchAndRunInteraction: Story = {
  name: "Search and run — interaction test",
  tags: ["!dev"],
  args: { onSelect: fn(), onOpenChange: fn(), hotkey: false },
  render: ({ placeholder: _placeholder, ...args }) => (
    <PaletteStage minBlockSize="34rem">
      {(container) => <CommandPalette {...args} container={container} trigger={searchTrigger} commands={sampleCommands} />}
    </PaletteStage>
  ),
  play: async ({ args, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "Search…" }));
    const search = await body.findByRole("combobox", { name: "Search commands" });
    await waitFor(() => expect(search).toHaveFocus());
    await userEvent.type(search, "sett");
    await expect(body.getAllByRole("option")).toHaveLength(1);
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "settings" }), { query: "sett" });
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(body.getByRole("button", { name: "Search…" })).toHaveFocus();
  },
};
