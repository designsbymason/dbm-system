import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData } from "../data";
import { pageShape, pagedResult, pagingInput, READ_ONLY } from "./shared";

const KINDS = ["component", "helper", "hook", "function", "constant", "token"] as const;

interface Candidate {
  kind: (typeof KINDS)[number];
  name: string;
  summary: string;
}

/**
 * How well a candidate matches the query: the points its words earn, and how many of the words it lacks. A name match counts far
 * more than a summary match, and an exact or leading name match more still.
 */
function score(candidate: Candidate, words: string[], phrase: string): { points: number; missing: number } {
  const name = candidate.name.toLowerCase();
  const summary = candidate.summary.toLowerCase();
  let points = 0;
  let missing = 0;
  for (const word of words) {
    if (name.includes(word)) points += 20;
    else if (summary.includes(word)) points += 3;
    else missing += 1;
  }
  if (points > 0 && name === phrase) points += 100;
  else if (points > 0 && name.startsWith(phrase)) points += 40;
  return { points, missing };
}

/** Registers the tool that searches across everything the server knows. */
export function registerSearchTool(server: McpServer, data: DbmData): void {
  server.registerTool(
    "dbm_search",
    {
      title: "Search DBM System",
      description: `Search components, helpers, hooks, functions, constants and design tokens by name and by what they do. Results that contain every word of the query come first, best match first. When nothing contains them all, the results that contain some of the words are returned, and "note" says so.

Use it when you know what you need but not the name. Then call dbm_get_component, dbm_get_utility or dbm_get_tokens with the name it returns.

Examples:
  - "date range" -> finds DateRangePicker
  - "toast" -> finds Toast, useToast, createToaster
  - "focus ring" -> finds the focus tokens`,
      inputSchema: z.strictObject({
        query: z.string().min(2).max(200).describe("Words to look for, such as 'date range' or 'toast'."),
        kinds: z.array(z.enum(KINDS)).optional().describe("Only these kinds of result. Leave out to search them all."),
        ...pagingInput,
      }),
      outputSchema: z.object({
        ...pageShape,
        note: z.string().optional().describe("Present when no result contained every word and the results hold only some of them."),
        results: z.array(z.object({ kind: z.enum(KINDS), name: z.string(), summary: z.string() })),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, kinds, limit, offset }) => {
      const index = data.index();
      const utilities = data.utilities();
      const candidates: Candidate[] = [
        ...index.components.map((row) => ({ kind: "component" as const, name: row.name, summary: row.summary })),
        ...index.helpers.map((row) => ({ kind: "helper" as const, name: row.name, summary: row.summary })),
        ...index.utilities.map((row) => ({ kind: row.kind === "hook" ? ("hook" as const) : ("function" as const), name: row.name, summary: row.summary })),
        ...utilities.constants.map((row) => ({ kind: "constant" as const, name: row.name, summary: typeof row.summary === "string" ? row.summary : "" })),
        ...data.tokens().tokens.map((token) => ({ kind: "token" as const, name: token.name, summary: token.purpose ?? `${token.layer} ${token.group} ${token.type} token` })),
      ];
      const phrase = query.trim().toLowerCase();
      const words = phrase.split(/\s+/).filter(Boolean);
      const scored = candidates
        .filter((candidate) => !kinds || kinds.includes(candidate.kind))
        .map((candidate) => ({ candidate, ...score(candidate, words, phrase) }))
        .filter(({ points }) => points > 0);
      const rank = (a: (typeof scored)[number], b: (typeof scored)[number]) => b.points - a.points || a.candidate.name.localeCompare(b.candidate.name);
      const exact = scored.filter(({ missing }) => missing === 0).sort(rank);
      const partial = exact.length === 0 && words.length > 1;
      const results = (partial ? scored.sort((a, b) => a.missing - b.missing || rank(a, b)) : exact).map(({ candidate }) => candidate);
      return pagedResult(results, offset, limit, (items, page) => ({
        ...page,
        ...(partial && results.length > 0 ? { note: "No result contains every word of the query, so these contain some of the words." } : {}),
        results: items,
      }));
    },
  );
}
