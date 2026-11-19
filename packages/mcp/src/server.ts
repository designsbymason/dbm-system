import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/server";
import type { DbmData } from "./data";
import { registerComponentTools } from "./tools/components";
import { registerGuideTool } from "./tools/guide";
import { registerSearchTool } from "./tools/search";
import { registerTokenTools } from "./tools/tokens";
import { registerUtilityTools } from "./tools/utilities";

/** This package's own version, which the fixed release group keeps equal to the packages it reads. */
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

/**
 * Builds a new server on every call, as the SDK requires: the transport calls this once per connection. `data` is the module-scope
 * reader every tool shares.
 */
export function createServer(data: DbmData): McpServer {
  const server = new McpServer({ name: "dbm-system-mcp", version });
  registerComponentTools(server, data);
  registerUtilityTools(server, data);
  registerTokenTools(server, data);
  registerSearchTool(server, data);
  registerGuideTool(server, data);
  return server;
}
