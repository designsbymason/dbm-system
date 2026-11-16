// Writes Storybook's logo as two files, a light one and a dark one, from the "dbM system" wordmark in
// .storybook/brand/dbm-system-wordmark.svg (its fill is `currentColor`) coloured with the token `text.brand` of the
// Purple theme in each mode, so the logo is never a hand-typed hex (ADR-0221, docs-site/02-structure.md §4). The manager
// switches between the files with the Mode toolbar (.storybook/theme.ts).
//
// The two files are committed. `--check` regenerates them in memory and fails when a committed file differs, so a token
// change that moves `text.brand` cannot leave a stale logo behind (CI runs it as `check-logo`).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const storybookDir = join(here, "..", ".storybook");
const sourcePath = join(storybookDir, "brand", "dbm-system-wordmark.svg");
const TOKEN = "--dbm-text-brand";

/** The two files to write: where, in which theme's colour. */
export const LOGOS = [
  { file: join(storybookDir, "public", "logo-light.svg"), theme: "purple-light" },
  { file: join(storybookDir, "public", "logo-dark.svg"), theme: "purple-dark" },
];

function tokenValue(theme) {
  const index = JSON.parse(readFileSync(createRequire(import.meta.url).resolve("@dbm-system/tokens/tokens.json"), "utf8"));
  const value = index.tokens.find((token) => token.name === TOKEN)?.values[theme];
  if (!/^#[0-9a-f]{6}$/i.test(value ?? "")) throw new Error(`generate-logo: ${TOKEN} for ${theme} is ${JSON.stringify(value)}, not a hex colour (run \`pnpm build\` for the tokens?)`);
  return value;
}

export function buildLogo(theme) {
  const source = readFileSync(sourcePath, "utf8");
  if (!source.includes("currentColor")) throw new Error(`generate-logo: ${sourcePath} has no currentColor fill to replace`);
  return source.replaceAll("currentColor", tokenValue(theme));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  let stale = false;
  for (const { file, theme } of LOGOS) {
    const expected = buildLogo(theme);
    const name = file.slice(file.indexOf(".storybook"));
    if (check) {
      if (!existsSync(file) || readFileSync(file, "utf8") !== expected) {
        console.error(`check-logo: ${name} is out of date with ${TOKEN} (${theme}); run \`pnpm --filter @dbm-system/components generate-logo\``);
        stale = true;
      }
    } else {
      writeFileSync(file, expected);
      process.stdout.write(`generate-logo: wrote ${name} (${tokenValue(theme)})\n`);
    }
  }
  if (check) {
    if (stale) process.exit(1);
    process.stdout.write("check-logo: both logo files match the tokens\n");
  }
}
