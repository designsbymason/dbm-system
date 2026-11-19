/**
 * Self-check: starts the built server over stdio the way an agent's tooling would, from a folder where the packages are not installed
 * (so it reads the copies it depends on), calls each tool, then starts it again the ways a client might start it in the wrong folder
 * (ADR-0232), and exits non-zero on any failure.
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

/** The folder of this package, which has the workspace's components and tokens linked in `node_modules`, so it stands for a project. */
const project = fileURLToPath(new URL("..", import.meta.url));

/** Starts the server the way a client might. The child gets only a safe default environment, so no NODE_PATH leaks the workspace's packages in. */
async function start({ cwd = emptyProject, env = {}, args = [] } = {}) {
  const started = new Client({ name: "smoke-test", version: "1.0.0" });
  await started.connect(new StdioClientTransport({ command: "node", args: [entry, ...args], cwd, env: { ...getDefaultEnvironment(), ...env } }));
  return started;
}
const listOnce = async (started) => (await started.callTool({ name: "dbm_list_components", arguments: { limit: 1 } })).structuredContent;

const client = await start();
try {

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

  assert.match(list.structuredContent.note, /DBM_SYSTEM_PROJECT_DIR/, "the bundled copy must say how to reach the project's");

  // Started in the wrong folder, the server can still be told where the project is, three ways, and then it says nothing about a fallback.
  for (const [label, options] of [
    ["DBM_SYSTEM_PROJECT_DIR", { env: { DBM_SYSTEM_PROJECT_DIR: project } }],
    ["--project", { args: ["--project", project] }],
    ["CLAUDE_PROJECT_DIR", { env: { CLAUDE_PROJECT_DIR: project } }],
  ]) {
    const told = await start(options);
    try {
      const result = await listOnce(told);
      assert.equal(result.source.origin, "project", `${label} must make it read the project's packages`);
      assert.equal(result.note, undefined, `${label}: no fallback note when the project answers`);
    } finally {
      await told.close();
    }
  }

  // A setting that names no folder is not a crash: it falls back, and the note names the setting.
  const wrong = await start({ env: { DBM_SYSTEM_PROJECT_DIR: join(emptyProject, "does-not-exist") } });
  try {
    const result = await listOnce(wrong);
    assert.equal(result.source.origin, "bundled");
    assert.match(result.note, /DBM_SYSTEM_PROJECT_DIR is ".*does-not-exist", which is not a folder/);
  } finally {
    await wrong.close();
  }

  console.error("Smoke test passed");
} finally {
  await client.close();
  rmSync(emptyProject, { recursive: true, force: true });
}
