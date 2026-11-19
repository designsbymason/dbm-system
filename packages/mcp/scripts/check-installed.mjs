/**
 * Starts the MCP server from an app that has `@dbm-system/mcp` installed (its `bin`, the way `npx` or an agent's tooling runs it), with the app as
 * the working folder, and requires it to describe the packages installed in that app, not the copies it depends on.
 * Run by `pnpm check-fresh-app` with the app's folder as the one argument; exits non-zero on any failure.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const app = process.argv[2];
assert.ok(app, "usage: node check-installed.mjs <app folder>");
const installedVersion = (name) => JSON.parse(readFileSync(join(app, "node_modules", "@dbm-system", name, "package.json"), "utf8")).version;

const bin = join(app, "node_modules", ".bin", "dbm-system-mcp");
const client = new Client({ name: "installed-check", version: "1.0.0" });
try {
  await client.connect(new StdioClientTransport({ command: bin, cwd: app, env: getDefaultEnvironment() }));

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
  assert.equal(list.structuredContent.note, undefined, "no fallback note when the app's packages answer");
} finally {
  await client.close();
}

// Started in a folder that is not the app (a desktop client's, say), it is told where the app is, by the setting and by the argument.
const elsewhere = mkdtempSync(join(tmpdir(), "dbm-mcp-elsewhere-"));
try {
  for (const [label, options] of [
    ["DBM_SYSTEM_PROJECT_DIR", { env: { ...getDefaultEnvironment(), DBM_SYSTEM_PROJECT_DIR: app } }],
    ["--project", { args: ["--project", app], env: getDefaultEnvironment() }],
  ]) {
    const told = new Client({ name: "installed-check", version: "1.0.0" });
    try {
      await told.connect(new StdioClientTransport({ command: bin, cwd: elsewhere, ...options }));
      const result = (await told.callTool({ name: "dbm_list_components", arguments: { limit: 1 } })).structuredContent;
      assert.equal(result.source.origin, "project", `${label} must point it at the app`);
      assert.equal(result.source.version, installedVersion("components"));
    } finally {
      await told.close();
    }
  }
} finally {
  rmSync(elsewhere, { recursive: true, force: true });
}
