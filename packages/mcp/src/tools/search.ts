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

/** How well a candidate matches every word of the query, or 0 when any word is missing. A name match counts far more than a summary match. */
function score(candidate: Candidate, words: string[], phrase: string): number {
  const name = candidate.name.toLowerCase();
  const summary = candidate.summary.toLowerCase();
  let total = 0;
  for (const word of words) {
    if (name.includes(word)) total += 20;
    else if (summary.includes(word)) total += 3;
    else return 0;
  }
  if (name === phrase) total += 100;
  else if (name.startsWith(phrase)) total += 40;
  return total;
}

/** Registers the tool that searches across everything the server knows. */
export function registerSearchTool(server: McpServer, data: DbmData): void {
  server.registerTool(
    "dbm_search",
    {
      title: "Search DBM System",
      description: `Search components, helpers, hooks, functions, constants and design tokens by name and by what they do. Every word of the query must appear in a name or a summary. Best results come first.

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
      const results = candidates
        .filter((candidate) => !kinds || kinds.includes(candidate.kind))
        .map((candidate) => ({ candidate, score: score(candidate, words, phrase) }))
        .filter(({ score: value }) => value > 0)
        .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
        .map(({ candidate }) => candidate);
      return pagedResult(results, offset, limit, (items, page) => ({ ...page, results: items }));
    },
  );
}
