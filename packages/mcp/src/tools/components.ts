import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData } from "../data";
import { CHARACTER_LIMIT, errorResult, jsonResult, noteShape, pageShape, pagedResult, pagingInput, READ_ONLY, sourceNote, sourceShape } from "./shared";

function sourceOf(data: DbmData) {
  const { components } = data.info();
  return { package: components.name, version: components.version, origin: components.origin };
}

const SECTIONS = ["props", "parts", "examples"] as const;

/** Registers the tools that list and describe components. */
export function registerComponentTools(server: McpServer, data: DbmData): void {
  server.registerTool(
    "dbm_list_components",
    {
      title: "List DBM System components",
      description: `List the DBM System components, one row each: name, tier, category and a one-sentence summary. Read this first to see what exists before building anything, instead of guessing a name.

Tiers are atom, molecule, organism and template. Helpers (small components that support another and have no page of their own, such as TooltipProvider) are listed with kind "helper" and the component they support. Use dbm_get_component for one component's props, parts and examples, dbm_search to find one by what it does, and dbm_list_utilities for hooks and functions.

Examples:
  - "What form inputs are there?" -> category="Inputs"
  - "List the page-level building blocks" -> tier="template"`,
      inputSchema: z.strictObject({
        tier: z.enum(["atom", "molecule", "organism", "template"]).optional().describe("Only components in this tier."),
        category: z.string().optional().describe("Only components in this category, such as 'Inputs', 'Navigation' or 'Overlay' (matched without regard to case)."),
        include_helpers: z.boolean().default(true).describe("Whether to include helpers. Helpers have no tier or category, so any tier or category filter leaves them out."),
        ...pagingInput,
      }),
      outputSchema: z.object({
        source: sourceShape,
        note: noteShape,
        ...pageShape,
        components: z.array(z.object({ name: z.string(), kind: z.enum(["component", "helper"]), tier: z.string().optional(), category: z.string().optional(), helper_of: z.string().optional(), summary: z.string() })),
      }),
      annotations: READ_ONLY,
    },
    async ({ tier, category, include_helpers, limit, offset }) => {
      const index = data.index();
      const rows = [
        ...index.components
          .filter((row) => (!tier || row.tier === tier) && (!category || row.category?.toLowerCase() === category.toLowerCase()))
          .map((row) => ({ name: row.name, kind: "component" as const, tier: row.tier, category: row.category, summary: row.summary })),
        ...(include_helpers && !tier && !category ? index.helpers.map((row) => ({ name: row.name, kind: "helper" as const, helper_of: row.helperOf, summary: row.summary })) : []),
      ];
      return pagedResult(rows, offset, limit, (components, page) => ({ source: sourceOf(data), ...sourceNote(data), ...page, components }));
    },
  );

  server.registerTool(
    "dbm_get_component",
    {
      title: "Get a DBM System component",
      description: `Get one component's manifest entry: what it is for, its import name, whether its ref reaches an element, its props (type, default, whether required, description), its parts (the pieces of a compound component, such as Navbar.Link) and examples. The entry is exactly what the package's manifest says, so use it instead of guessing a prop.

A large component can exceed one result: then props come first, then parts, then examples, and what does not fit is named in "omitted" with the call that fetches it. Ask for a single part with "part", or for one section with "include".

Examples:
  - "What props does Button take?" -> name="Button"
  - "How do I use Navbar.Link?" -> name="Navbar", part="Link"
  - "Just the props of DataTable" -> name="DataTable", include=["props"]
Use dbm_list_components or dbm_search when you do not know the exact name.`,
      inputSchema: z.strictObject({
        name: z.string().min(1).max(100).describe("The component or helper name, such as 'Button' or 'TooltipProvider'. Case does not matter."),
        include: z.array(z.enum(SECTIONS)).default([...SECTIONS]).describe("Which sections to include besides the summary fields: props, parts and examples."),
        part: z.string().min(1).max(100).optional().describe("Return only this part, such as 'Navbar.Link' or just 'Link'. Overrides include."),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, include, part }) => {
      const found = data.component(name);
      if (!found) {
        const names = [...data.index().components, ...data.index().helpers].map((row) => row.name);
        const close = data.suggest(name, names);
        return errorResult(`No component named '${name}'.${close.length ? ` Did you mean ${close.map((n) => `'${n}'`).join(", ")}?` : ""} Use dbm_list_components or dbm_search to find the name.`);
      }
      const entry = found.entry as Record<string, unknown> & { name: string; parts?: Array<{ name: string; summary?: string }> };
      const source = sourceOf(data);

      if (part) {
        const wanted = part.toLowerCase();
        const parts = entry.parts ?? [];
        const match = parts.find((candidate) => candidate.name.toLowerCase() === wanted || candidate.name.toLowerCase().endsWith(`.${wanted}`));
        if (!match) {
          const close = data.suggest(part, parts.map((candidate) => candidate.name));
          return errorResult(
            parts.length === 0
              ? `${entry.name} has no parts. Call dbm_get_component with name='${entry.name}' for its props.`
              : `${entry.name} has no part '${part}'.${close.length ? ` Did you mean ${close.map((n) => `'${n}'`).join(", ")}?` : ""} Its parts are: ${parts.map((candidate) => candidate.name).join(", ")}.`,
          );
        }
        return jsonResult({ source, ...sourceNote(data), component: entry.name, part: match });
      }

      const core: Record<string, unknown> = Object.fromEntries(Object.entries(entry).filter(([key]) => !(SECTIONS as readonly string[]).includes(key)));
      const omitted: Array<{ section: string; characters: number; fetch: string }> = [];
      const fits = (candidate: Record<string, unknown>) => JSON.stringify({ source, component: candidate, omitted: [] }).length <= CHARACTER_LIMIT;
      let outlined = false;
      for (const section of SECTIONS.filter((s) => include.includes(s))) {
        const value = entry[section];
        if (value === undefined) continue;
        if (fits({ ...core, [section]: value })) {
          core[section] = value;
        } else if (section === "parts" && Array.isArray(entry.parts) && fits({ ...core, parts: entry.parts.map(({ name: partName, summary }) => ({ name: partName, summary })) })) {
          core.parts = entry.parts.map(({ name: partName, summary }) => ({ name: partName, summary }));
          outlined = true;
          omitted.push({ section: "parts (props of each part)", characters: JSON.stringify(value).length, fetch: `dbm_get_component with name='${entry.name}' and part set to one of the part names` });
        } else {
          omitted.push({ section, characters: JSON.stringify(value).length, fetch: `dbm_get_component with name='${entry.name}' and include=['${section}']` });
        }
      }
      return jsonResult({ source, component: core, ...(omitted.length ? { omitted } : {}), ...sourceNote(data, outlined ? "parts lists each part's name and summary only." : undefined) });
    },
  );
}
