// Every figure on the home page is read here, at build, from the packages themselves (03-landing-page-brief.md §2).
import components from "@dbm-system/components/package.json";
import manifest from "@dbm-system/components/manifest.json";
import { existsSync, readFileSync } from "node:fs";
import icons from "@dbm-system/icons/package.json";
import tokensPackage from "@dbm-system/tokens/package.json";
import tokens from "@dbm-system/tokens/tokens.json";
import { componentCount } from "./componentRows";

const deps = Object.keys(components.dependencies ?? {});
const thirdParty = [
  deps.some((name) => name.startsWith("@radix-ui/")) && "Radix UI Primitives",
  Object.keys(icons.dependencies ?? {}).some((name) => name.startsWith("@phosphor-icons/")) && "Phosphor Icons",
].filter(Boolean) as string[];

const themes = tokens.themes as string[];
const brands = [...new Set(themes.map((theme) => theme.split("-")[0]))];
const modes = [...new Set(themes.map((theme) => theme.split("-")[1]))];
const title = (word: string) => word[0].toUpperCase() + word.slice(1);

/**
 * What the "Start in three steps" snippets import: the components' stylesheet and the first theme's bundled file, named from the packages
 * themselves. The files are looked for in the built packages, so a rename or a missing build fails here and not on a reader's machine.
 */
const theme = themes[0] as string;
const packages = "../../../../../packages";
/** Throws unless the file is in the built packages, so a page that names it cannot name something that is not there. */
function inPackages(file: string, namedBy: string) {
  if (!existsSync(new URL(`${packages}/${file}`, import.meta.url))) {
    throw new Error(`facts: ${file} is not in the built packages, but ${namedBy} names it (is the build missing?)`);
  }
}
inPackages(`components/dist/index.css`, "the home page's steps");
inPackages(`tokens/build/css/${theme}.bundled.css`, "the home page's steps");

// "What your agent reads" names each file with the package it is in, which an agent needs to find it.
inPackages(`components/dist/manifest/index.json`, "the agents section");
inPackages(`components/dist/manifest/components`, "the agents section");
inPackages(`components/AGENTS.md`, "the agents section");
inPackages(`tokens/build/tokens.json`, "the agents section");
// The MCP server is run with npx, so the command is built from its package name, and its program has to be built.
inPackages(`mcp/dist/index.js`, "the agents section");
const mcpPackage = JSON.parse(readFileSync(new URL(`${packages}/mcp/package.json`, import.meta.url), "utf8")) as { name: string };

export const facts = {
  version: components.version,
  /** The components, the application shells included: the manifest's `components`, as the table lists them. */
  componentCount,
  utilityCount: manifest.utilities.length,
  react: (components.peerDependencies as Record<string, string>).react,
  thirdParty,
  brands: brands.map(title),
  modes,
  themes,
  /** The first theme, and the import lines for the stylesheet and that theme's file. */
  install: {
    theme,
    stylesheet: `${components.name}/styles.css`,
    themeFile: `${tokensPackage.name}/css/${theme}.bundled.css`,
  },
  /** The files an agent reads, each named with its package. */
  agentFiles: {
    manifestIndex: `${components.name}/manifest/index.json`,
    manifestComponent: `${components.name}/manifest/components/<Name>.json`,
    agents: `${components.name}/AGENTS.md`,
    tokens: `${tokensPackage.name}/tokens.json`,
  },
  /** The MCP server: the command that starts it, named from its package. */
  mcp: {
    name: mcpPackage.name,
    command: `npx -y ${mcpPackage.name}`,
  },
};

type Token = { name: string; values: Record<string, string> };
/** A token's value in each theme, from the token index. */
export function tokenValues(cssName: string): Record<string, string> {
  const token = (tokens.tokens as Token[]).find((t) => t.name === cssName);
  if (!token) throw new Error(`No token ${cssName} in tokens.json`);
  return token.values;
}
