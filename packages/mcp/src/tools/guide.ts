import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { DbmData } from "../data";
import { READ_ONLY } from "./shared";

/** Registers the tool that returns the consumer guide. */
export function registerGuideTool(server: McpServer, data: DbmData): void {
  server.registerTool(
    "dbm_get_agent_guide",
    {
      title: "Get the DBM System guide for agents",
      description: `Get the guide that ships with the components package for AI coding agents: how to install and set up the package, the conventions every component follows (sizes, field states, spacing, tokens), and where to look things up. Read it once at the start of a task that builds with DBM System. It returns Markdown.`,
      inputSchema: z.strictObject({}),
      annotations: READ_ONLY,
    },
    async () => ({ content: [{ type: "text", text: data.agentsGuide() }] }),
  );
}
