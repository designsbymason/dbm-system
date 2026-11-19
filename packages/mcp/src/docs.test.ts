import { readFileSync } from "node:fs";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openData } from "./data";
import { createServer } from "./server";

/** Where the tools are named for readers: the package README, the Storybook page, and `AGENTS.md`, which ships in the components package. */
const repo = new URL("../../..", import.meta.url);
const documents = {
  "packages/mcp/README.md": readFileSync(new URL("packages/mcp/README.md", repo), "utf8"),
  "packages/components/src/guides/McpServer.mdx": readFileSync(new URL("packages/components/src/guides/McpServer.mdx", repo), "utf8"),
  "packages/components/AGENTS.md": readFileSync(new URL("packages/components/AGENTS.md", repo), "utf8"),
};
const listsEveryTool = ["packages/mcp/README.md", "packages/components/src/guides/McpServer.mdx"] as const;
const toolNames = (text: string) => new Set(text.match(/\bdbm_[a-z_]+\b/g) ?? []);

const data = openData(new URL("..", import.meta.url).pathname);
const handler = createMcpHandler(() => createServer(data));
const client = new Client({ name: "docs-test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
let registered: string[] = [];

beforeAll(async () => {
  await client.connect(new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  registered = (await client.listTools()).tools.map((tool) => tool.name).sort();
});
afterAll(async () => {
  await client.close();
});

describe("the documentation names the tools the server registers", () => {
  it.each(listsEveryTool)("%s names every tool, and only tools the server has", (file) => {
    const named = [...toolNames(documents[file])].sort();
    expect(named).toEqual(registered);
  });

  it("names no tool the server lacks anywhere else it mentions one", () => {
    for (const [file, text] of Object.entries(documents)) {
      for (const name of toolNames(text)) expect(registered, `${file} names ${name}`).toContain(name);
    }
  });

  it("gives the same command to start it everywhere it shows one", () => {
    const { name } = JSON.parse(readFileSync(new URL("packages/mcp/package.json", repo), "utf8")) as { name: string };
    const command = `claude mcp add dbm-system -- npx -y ${name}`;
    for (const file of [...listsEveryTool, "packages/components/AGENTS.md"] as const) {
      expect(documents[file], `${file} shows the add command`).toContain(command);
    }
    for (const [file, text] of Object.entries(documents)) {
      for (const line of text.split("\n").filter((entry) => entry.includes("claude mcp add") && !entry.includes("--scope"))) {
        if (line.trim().startsWith("claude mcp add") || line.includes("`claude mcp add dbm-system")) expect(line, file).toContain(command);
      }
    }
  });
});
