/**
 * Starts the MCP server from an app that has `@dbm-system/mcp` installed (its `bin`, the way `npx` or an agent's tooling runs it), with the app as
 * the working folder, and requires it to describe the packages installed in that app, not the copies it depends on.
 * Run by `pnpm check-fresh-app` with the app's folder as the one argument; exits non-zero on any failure.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const app = process.argv[2];
assert.ok(app, "usage: node check-installed.mjs <app folder>");
const installedVersion = (name) => JSON.parse(readFileSync(join(app, "node_modules", "@dbm-system", name, "package.json"), "utf8")).version;

const client = new Client({ name: "installed-check", version: "1.0.0" });
try {
  await client.connect(new StdioClientTransport({ command: join(app, "node_modules", ".bin", "dbm-system-mcp"), cwd: app, env: getDefaultEnvironment() }));

  const list = await client.callTool({ name: "dbm_list_components", arguments: { limit: 3 } });
  assert.ok(!list.isError, `list failed: ${JSON.stringify(list.content)}`);
  assert.equal(list.structuredContent.source.origin, "project", "it must read the app's installed components");
  assert.equal(list.structuredContent.source.version, installedVersion("components"));

  const tokens = await client.callTool({ name: "dbm_get_tokens", arguments: { used_by: "Button", limit: 1 } });
  assert.ok(!tokens.isError, `tokens failed: ${JSON.stringify(tokens.content)}`);
  assert.equal(tokens.structuredContent.origin, "project");
  assert.equal(tokens.structuredContent.version, installedVersion("tokens"));

  const button = await client.callTool({ name: "dbm_get_component", arguments: { name: "Button" } });
  assert.equal(button.structuredContent.component.name, "Button");
} finally {
  await client.close();
}
