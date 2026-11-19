import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/server";
import type { DbmData } from "./data";

/** This package's own version, which the fixed release group keeps equal to the packages it reads. */
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

/**
 * Builds a new server on every call, as the SDK requires: the transport calls this once per connection. Tools are registered here
 * once they exist; `data` is the module-scope reader they share.
 */
export function createServer(_data: DbmData): McpServer {
  return new McpServer({ name: "dbm-system-mcp", version });
}
