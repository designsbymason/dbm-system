import {
  ArrowsClockwiseIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FilePlusIcon,
  FolderOpenIcon,
  GearIcon,
  LifebuoyIcon,
  MoonIcon,
  PaletteIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from "@dbm-system/icons";
import type { CommandItem } from "./CommandPalette.types";

// The stage the stories draw an open palette inside: the same box `Dialog`'s stories use (every `<Canvas>` on a Docs
// page shares one document, so a modal's fixed scrim would otherwise cover the whole page).
export { DialogStage as PaletteStage } from "../Dialog/DialogStoryKit";

/** A small, realistic set of commands: two groups, icons, shortcuts, a description, a keyword, a disabled one, a list. */
export const sampleCommands: CommandItem[] = [
  { value: "new-file", label: "New file", group: "File", icon: FilePlusIcon, shortcut: ["Ctrl", "N"] },
  { value: "open-file", label: "Open file", group: "File", icon: FolderOpenIcon, description: "From your computer", shortcut: ["Ctrl", "O"] },
  { value: "export", label: "Export data", group: "File", icon: DownloadSimpleIcon, keywords: ["download", "csv"] },
  { value: "settings", label: "Open settings", group: "App", icon: GearIcon, keywords: ["preferences", "options"] },
  {
    value: "theme",
    label: "Change theme",
    group: "App",
    icon: PaletteIcon,
    items: [
      { value: "light", label: "Light", icon: SunIcon },
      { value: "dark", label: "Dark", icon: MoonIcon },
    ],
  },
  { value: "copy-link", label: "Copy link", group: "App", icon: CopyIcon, description: "To this page" },
  { value: "publish", label: "Publish", group: "App", disabled: "Connect to the internet first" },
  { value: "account", label: "Account", group: "Account", icon: UserIcon },
  { value: "help", label: "Help and support", group: "Account", icon: LifebuoyIcon },
  { value: "sign-out", label: "Sign out", group: "Account", icon: SignOutIcon },
];

/** Commands for a story about work that takes time. */
export const slowCommands = (succeed: boolean): CommandItem[] => [
  {
    value: "sync",
    label: "Sync now",
    icon: ArrowsClockwiseIcon,
    description: succeed ? "Takes a moment, then closes" : "Takes a moment, then fails",
    onSelect: () =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => (succeed ? resolve() : reject(new Error("The server did not answer"))), 1200);
      }),
  },
  { value: "other", label: "Another command", icon: GearIcon },
];

/** A list long enough to need windowing. */
export const manyCommands = (count: number): CommandItem[] =>
  Array.from({ length: count }, (_, index) => ({
    value: `command-${index}`,
    label: `Command ${index + 1}`,
    group: `Section ${Math.floor(index / 50) + 1}`,
    description: index % 7 === 0 ? "With a description" : undefined,
  }));
