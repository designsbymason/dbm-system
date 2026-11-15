// Every figure on the home page is read here, at build, from the packages themselves (03-landing-page-brief.md §2).
import components from "@dbm-system/components/package.json";
import manifest from "@dbm-system/components/manifest.json";
import icons from "@dbm-system/icons/package.json";
import tokens from "@dbm-system/tokens/tokens.json";

const deps = Object.keys(components.dependencies ?? {});
const thirdParty = [
  deps.some((name) => name.startsWith("@radix-ui/")) && "Radix UI Primitives",
  Object.keys(icons.dependencies ?? {}).some((name) => name.startsWith("@phosphor-icons/")) && "Phosphor Icons",
].filter(Boolean) as string[];

const themes = tokens.themes as string[];
const brands = [...new Set(themes.map((theme) => theme.split("-")[0]))];
const modes = [...new Set(themes.map((theme) => theme.split("-")[1]))];
const title = (word: string) => word[0].toUpperCase() + word.slice(1);

export const facts = {
  version: components.version,
  componentCount: manifest.components.length,
  utilityCount: manifest.utilities.length,
  react: (components.peerDependencies as Record<string, string>).react,
  thirdParty,
  brands: brands.map(title),
  modes,
  themes,
};

type Token = { name: string; values: Record<string, string> };
/** A token's value in each theme, from the token index. */
export function tokenValues(cssName: string): Record<string, string> {
  const token = (tokens.tokens as Token[]).find((t) => t.name === cssName);
  if (!token) throw new Error(`No token ${cssName} in tokens.json`);
  return token.values;
}
