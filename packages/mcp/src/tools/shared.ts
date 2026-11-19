import type { CallToolResult } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData } from "../data";

/** The most characters of text one result may carry. A page stays under it by holding fewer items, never by cutting text. */
export const CHARACTER_LIMIT = 25_000;

/** Every tool reads files that ship in the packages and changes nothing, so a client may run them without asking. */
export const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

/** The `limit` and `offset` arguments every list tool takes. */
export const pagingInput = {
  limit: z.number().int().min(1).max(200).default(50).describe("The most items to return in one page."),
  offset: z.number().int().min(0).default(0).describe("How many items to skip, to read the next page. Use `next_offset` from the previous page."),
};

/** The fields that say where a page sits in the whole list. */
export const pageShape = {
  total: z.number().describe("How many items match in all."),
  count: z.number().describe("How many are in this page."),
  offset: z.number().describe("How many were skipped."),
  has_more: z.boolean().describe("Whether more items follow this page."),
  next_offset: z.number().optional().describe("The `offset` that reads the next page. Present only when `has_more` is true."),
};

/** Where the answer came from: the package, its version, and whether the project or this server supplied it. */
export const sourceShape = z.object({
  package: z.string(),
  version: z.string(),
  origin: z.enum(["project", "bundled"]).describe("`project` is the copy installed where the server was started; `bundled` is the copy this server depends on."),
});

/** The `note` field a result carries when its answers come from the bundled copy and not the project's (ADR-0232). */
export const noteShape = z.string().optional().describe("Present when the answers come from the copy bundled with the server and not from your project, or, for a search, when no result contained every word. It says why and what to do.");

/** `{ note }` when the data came from the bundled copy, and nothing otherwise, for spreading into a result. */
export function sourceNote(data: DbmData, ...more: Array<string | undefined>): { note?: string } {
  const note = [...more, data.note()].filter((entry): entry is string => Boolean(entry)).join(" ");
  return note ? { note } : {};
}

/** A result carrying `data` as structured content and, as the protocol asks, the same data as JSON text. Compact, because an agent reads it. */
export function jsonResult(data: Record<string, unknown>): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data };
}

/** A result the model reads as an error, written to say what to try next. */
export function errorResult(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

/**
 * Reads one page of `all` and returns the result for it. The page is halved until its text fits `CHARACTER_LIMIT`, so
 * `next_offset` points at the first item left out and nothing is cut mid-item.
 */
export function pagedResult<T>(all: readonly T[], offset: number, limit: number, build: (items: T[], page: Record<string, unknown>) => Record<string, unknown>): CallToolResult {
  let items = all.slice(offset, offset + limit);
  const render = (): Record<string, unknown> => {
    const next = offset + items.length;
    const has_more = next < all.length;
    return build(items, { total: all.length, count: items.length, offset, has_more, ...(has_more ? { next_offset: next } : {}) });
  };
  let data = render();
  while (items.length > 1 && JSON.stringify(data).length > CHARACTER_LIMIT) {
    items = items.slice(0, Math.ceil(items.length / 2));
    data = render();
  }
  return jsonResult(data);
}
