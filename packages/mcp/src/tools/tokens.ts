import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData, TokenEntry } from "../data";
import { errorResult, noteShape, pageShape, pagedResult, pagingInput, READ_ONLY, sourceNote } from "./shared";

/** One token as the tool returns it: the index's own fields, with the per-theme maps reduced to one value when a theme is asked for. */
function forTheme(token: TokenEntry, theme: string | undefined): Record<string, unknown> {
  if (!theme) return { ...token };
  const { values, aliases, ...rest } = token;
  return { ...rest, ...(values ? { value: values[theme] } : {}), ...(aliases && aliases[theme] ? { alias: aliases[theme] } : {}) };
}

/** Registers the tool that looks up design tokens. */
export function registerTokenTools(server: McpServer, data: DbmData): void {
  server.registerTool(
    "dbm_get_tokens",
    {
      title: "Look up DBM System design tokens",
      description: `Look up design tokens: each one's CSS custom property name, layer, group, type, resolved value, the token it aliases, what it is for (when the source says) and which components use it. Components take their colors, spacing and so on from semantic tokens (layer "semantic", such as --dbm-bg-brand), never from primitives or hard-coded values, so find the right semantic token here.

Semantic tokens have a value per theme (purple-light, purple-dark, emerald-light, emerald-dark); pass "theme" to get one value instead of all four. Filters combine.

Examples:
  - "What color is the brand background in dark mode?" -> name_contains="bg-brand", theme="purple-dark"
  - "Which tokens does Button use?" -> used_by="Button"
  - "List the border tokens" -> layer="semantic", group="border"`,
      inputSchema: z.strictObject({
        name_contains: z.string().min(1).max(100).optional().describe("Only tokens whose name contains this text, such as 'bg-brand' (without regard to case)."),
        layer: z.enum(["primitive", "semantic", "component"]).optional().describe("Only tokens in this layer."),
        group: z.string().optional().describe("Only tokens in this group, such as 'bg', 'border', 'text', 'space' or 'button'."),
        used_by: z.string().optional().describe("Only tokens that this component's own stylesheet uses, such as 'Button'."),
        theme: z.string().optional().describe("Return one value for this theme instead of every theme's, such as 'purple-light'."),
        ...pagingInput,
      }),
      outputSchema: z.object({
        version: z.string().describe("The version of the tokens package."),
        origin: z.enum(["project", "bundled"]),
        themes: z.array(z.string()),
        note: noteShape,
        ...pageShape,
        tokens: z.array(z.record(z.string(), z.unknown())),
      }),
      annotations: READ_ONLY,
    },
    async ({ name_contains, layer, group, used_by, theme, limit, offset }) => {
      const index = data.tokens();
      if (theme && !index.themes.includes(theme)) {
        return errorResult(`No theme named '${theme}'. The themes are ${index.themes.map((t) => `'${t}'`).join(", ")}.`);
      }
      const text = name_contains?.toLowerCase();
      const user = used_by?.toLowerCase();
      const matches = index.tokens.filter(
        (token) =>
          (!text || token.name.toLowerCase().includes(text)) &&
          (!layer || token.layer === layer) &&
          (!group || token.group === group) &&
          (!user || token.usedBy?.some((component) => component.toLowerCase() === user)),
      );
      const { tokens: info } = data.info();
      return pagedResult(matches, offset, limit, (tokens, page) => ({ version: info.version, origin: info.origin, themes: index.themes, ...sourceNote(data), ...page, tokens: tokens.map((token) => forTheme(token, theme)) }));
    },
  );
}
