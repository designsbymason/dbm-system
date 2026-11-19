import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData } from "../data";
import { errorResult, jsonResult, pageShape, pagedResult, pagingInput, READ_ONLY, sourceShape } from "./shared";

/** Registers the tools that list and describe hooks, functions and constants. */
export function registerUtilityTools(server: McpServer, data: DbmData): void {
  const source = () => {
    const { components } = data.info();
    return { package: components.name, version: components.version, origin: components.origin };
  };

  server.registerTool(
    "dbm_list_utilities",
    {
      title: "List DBM System hooks and functions",
      description: `List the hooks and functions the components package exports besides its components (for example useToast, useTheme, createToaster, formatRelativeTime), one row each with a one-sentence summary. Use dbm_get_utility for the signature, parameters and examples of one.

Example: "Is there a hook for toasts?" -> kind="hook"`,
      inputSchema: z.strictObject({
        kind: z.enum(["hook", "function"]).optional().describe("Only hooks, or only functions."),
        ...pagingInput,
      }),
      outputSchema: z.object({
        source: sourceShape,
        ...pageShape,
        utilities: z.array(z.object({ name: z.string(), kind: z.string(), summary: z.string() })),
      }),
      annotations: READ_ONLY,
    },
    async ({ kind, limit, offset }) => {
      const rows = data.index().utilities.filter((row) => !kind || row.kind === kind);
      return pagedResult(rows, offset, limit, (utilities, page) => ({ source: source(), ...page, utilities }));
    },
  );

  server.registerTool(
    "dbm_get_utility",
    {
      title: "Get a DBM System hook, function or constant",
      description: `Get one hook, function or constant in full: its signature, parameters, return type and examples, exactly as the package's manifest records it.

Example: "How do I call useToast?" -> name="useToast"
Use dbm_list_utilities or dbm_search when you do not know the exact name.`,
      inputSchema: z.strictObject({
        name: z.string().min(1).max(100).describe("The hook, function or constant name, such as 'useToast'. Case does not matter."),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      const file = data.utilities();
      const wanted = name.toLowerCase();
      const found = [...file.utilities, ...file.constants].find((entry) => entry.name.toLowerCase() === wanted);
      if (!found) {
        const close = data.suggest(name, [...file.utilities, ...file.constants].map((entry) => entry.name));
        return errorResult(`No hook, function or constant named '${name}'.${close.length ? ` Did you mean ${close.map((n) => `'${n}'`).join(", ")}?` : ""} Use dbm_list_utilities or dbm_search to find the name.`);
      }
      return jsonResult({ source: source(), utility: found });
    },
  );
}
