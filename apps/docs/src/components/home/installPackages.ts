// The packages the install command names, from the packages' own names (only the name is read, so only the name is bundled into the page's script).
import { name as components } from "@dbm-system/components/package.json";
import { name as icons } from "@dbm-system/icons/package.json";
import { name as tokens } from "@dbm-system/tokens/package.json";

/** The three packages a reader installs, space-separated for a package manager. */
export const installPackages = [components, tokens, icons].join(" ");
