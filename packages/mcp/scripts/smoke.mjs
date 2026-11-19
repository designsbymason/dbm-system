/**
 * Self-check: starts the built server over stdio the way an agent's tooling would, from a folder where the packages are not installed
 * (so it reads the copies it depends on), calls each tool, and exits non-zero on any failure.
 * Run with: pnpm build && node scripts/smoke.mjs
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const emptyProject = mkdtempSync(join(tmpdir(), "dbm-mcp-smoke-"));

const client = new Client({ name: "smoke-test", version: "1.0.0" });
try {
  // The child gets only a safe default environment, so no NODE_PATH leaks the workspace's packages in.
  await client.connect(new StdioClientTransport({ command: "node", args: [entry], cwd: emptyProject, env: getDefaultEnvironment() }));

  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    ["dbm_get_agent_guide", "dbm_get_component", "dbm_get_tokens", "dbm_get_utility", "dbm_list_components", "dbm_list_utilities", "dbm_search"],
  );
  for (const tool of tools) assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} must be read-only`);

  const list = await client.callTool({ name: "dbm_list_components", arguments: { limit: 5 } });
  assert.ok(!list.isError, `list failed: ${JSON.stringify(list.content)}`);
  assert.equal(list.structuredContent.source.origin, "bundled", "with nothing installed in the project, the bundled copy is used");
  assert.ok(list.structuredContent.count > 0);

  const button = await client.callTool({ name: "dbm_get_component", arguments: { name: "Button" } });
  assert.ok(!button.isError, `get_component failed: ${JSON.stringify(button.content)}`);
  assert.equal(button.structuredContent.component.name, "Button");

  const tokens = await client.callTool({ name: "dbm_get_tokens", arguments: { used_by: "Button", theme: "purple-light", limit: 3 } });
  assert.ok(!tokens.isError && tokens.structuredContent.count > 0, "Button uses tokens");

  const search = await client.callTool({ name: "dbm_search", arguments: { query: "date range" } });
  assert.equal(search.structuredContent.results[0].name, "DateRangePicker");

  const guide = await client.callTool({ name: "dbm_get_agent_guide", arguments: {} });
  assert.ok(guide.content[0].text.length > 1000);

  const invalid = await client.callTool({ name: "dbm_get_component", arguments: { name: "" } });
  assert.equal(invalid.isError, true, "an empty name must be rejected");
  const missing = await client.callTool({ name: "dbm_get_component", arguments: { name: "Buton" } });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /Did you mean 'Button'/);

  console.error("Smoke test passed");
} finally {
  await client.close();
  rmSync(emptyProject, { recursive: true, force: true });
}
