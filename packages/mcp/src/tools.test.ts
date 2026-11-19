import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openData } from "./data";
import { createServer } from "./server";
import { CHARACTER_LIMIT } from "./tools/shared";

const data = openData(new URL("..", import.meta.url).pathname);
const handler = createMcpHandler(() => createServer(data));
const client = new Client({ name: "tools-test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });

beforeAll(async () => {
  await client.connect(new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
});
afterAll(async () => {
  await client.close();
});

// A tool's structured content is checked field by field below, so each test reads it loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = Record<string, any>;

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
  return { result, text, data: result.structuredContent as Body | undefined };
}

/** Reads every page of a list tool, following `next_offset`, and returns the rows under `key`. */
async function allRows(name: string, key: string, args: Record<string, unknown> = {}): Promise<Body[]> {
  const rows: Body[] = [];
  let offset: number | undefined = 0;
  while (offset !== undefined) {
    const { data: page } = await call(name, { ...args, offset });
    rows.push(...(page?.[key] ?? []));
    offset = page?.next_offset;
  }
  return rows;
}

describe("the tools", () => {
  it("lists exactly the planned tools, each read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(["dbm_get_agent_guide", "dbm_get_component", "dbm_get_tokens", "dbm_get_utility", "dbm_list_components", "dbm_list_utilities", "dbm_search"]);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
      expect(tool.annotations?.destructiveHint, tool.name).toBe(false);
      expect(tool.description, tool.name).toBeTruthy();
    }
  });

  describe("dbm_list_components", () => {
    it("pages and says where the next page starts", async () => {
      const first = await call("dbm_list_components", { limit: 10 });
      expect(first.data?.count).toBe(10);
      expect(first.data?.has_more).toBe(true);
      expect(first.data?.next_offset).toBe(10);
      const second = await call("dbm_list_components", { limit: 10, offset: 10 });
      expect(second.data?.components[0].name).not.toBe(first.data?.components[0].name);
      expect(first.data?.source.package).toBe("@dbm-system/components");
    });

    it("filters by tier and category, and leaves helpers out of a filtered list", async () => {
      const atoms = await allRows("dbm_list_components", "components", { tier: "atom", limit: 200 });
      expect(atoms.length).toBeGreaterThan(0);
      expect(atoms.every((row) => row.tier === "atom")).toBe(true);
      const inputs = await call("dbm_list_components", { category: "inputs", limit: 200 });
      expect(inputs.data?.components.some((row: { name: string }) => row.name === "Button")).toBe(true);
      const all = await allRows("dbm_list_components", "components", { limit: 200 });
      expect(all.length).toBe(data.index().components.length + data.index().helpers.length);
      expect(all.some((row) => row.kind === "helper" && row.helper_of)).toBe(true);
      expect(inputs.data?.components.some((row: { kind: string }) => row.kind === "helper")).toBe(false);
    });

    it("returns an empty page past the end instead of failing", async () => {
      const page = await call("dbm_list_components", { offset: 5000 });
      expect(page.result.isError).toBeFalsy();
      expect(page.data).toMatchObject({ count: 0, has_more: false });
    });
  });

  describe("dbm_get_component", () => {
    it("returns the manifest entry unchanged", async () => {
      const { data: body } = await call("dbm_get_component", { name: "button" });
      const entry = data.component("Button")?.entry as Record<string, unknown>;
      expect(body?.component).toEqual(entry);
      expect(body?.omitted).toBeUndefined();
    });

    it("keeps every result under the character limit and says what it left out", async () => {
      const big = data.index().components.map((row) => row.name).filter((name) => JSON.stringify(data.component(name)?.entry).length > CHARACTER_LIMIT);
      expect(big.length).toBeGreaterThan(0);
      for (const name of big) {
        const { text, data: body } = await call("dbm_get_component", { name });
        expect(text.length, name).toBeLessThanOrEqual(CHARACTER_LIMIT);
        expect(body?.omitted?.length, name).toBeGreaterThan(0);
        expect(body?.component.props, name).toBeDefined();
      }
    });

    it("returns one part, by its full name or its short one", async () => {
      const full = await call("dbm_get_component", { name: "Navbar", part: "Navbar.Link" });
      const short = await call("dbm_get_component", { name: "Navbar", part: "link" });
      expect(full.data?.part.name).toBe("Navbar.Link");
      expect(short.data?.part).toEqual(full.data?.part);
    });

    it("answers an unknown component or part with a way forward", async () => {
      const missing = await call("dbm_get_component", { name: "Buton" });
      expect(missing.result.isError).toBe(true);
      expect(missing.text).toContain("Did you mean 'Button'");
      const badPart = await call("dbm_get_component", { name: "Navbar", part: "Lnk" });
      expect(badPart.result.isError).toBe(true);
      expect(badPart.text).toContain("Navbar.Link");
      const noParts = await call("dbm_get_component", { name: "Button", part: "x" });
      expect(noParts.text).toContain("has no parts");
    });

    it("rejects a name that is not a name", async () => {
      expect((await call("dbm_get_component", { name: "" })).result.isError).toBe(true);
      expect((await call("dbm_get_component", { name: "Button", extra: 1 })).result.isError).toBe(true);
    });
  });

  describe("utilities", () => {
    it("lists hooks and functions, and filters by kind", async () => {
      const hooks = await call("dbm_list_utilities", { kind: "hook" });
      expect(hooks.data?.utilities.length).toBeGreaterThan(0);
      expect(hooks.data?.utilities.every((row: { kind: string }) => row.kind === "hook")).toBe(true);
    });

    it("gets one in full, and suggests a near name", async () => {
      const found = await call("dbm_get_utility", { name: "usetoast" });
      expect(found.data?.utility.name).toBe("useToast");
      const missing = await call("dbm_get_utility", { name: "useToas" });
      expect(missing.result.isError).toBe(true);
      expect(missing.text).toContain("useToast");
    });
  });

  describe("dbm_get_tokens", () => {
    it("filters and reduces to one theme's value", async () => {
      const all = await call("dbm_get_tokens", { name_contains: "bg-brand", layer: "semantic" });
      expect(all.data?.tokens[0].values).toBeDefined();
      const one = await call("dbm_get_tokens", { name_contains: "--dbm-bg-brand", layer: "semantic", theme: "purple-dark", limit: 5 });
      expect(one.data?.tokens[0].value).toMatch(/^#/);
      expect(one.data?.tokens[0].values).toBeUndefined();
    });

    it("finds the tokens a component uses", async () => {
      const used = await call("dbm_get_tokens", { used_by: "button", limit: 200 });
      expect(used.data?.total).toBeGreaterThan(0);
      expect(used.data?.tokens.every((token: { usedBy: string[] }) => token.usedBy.includes("Button"))).toBe(true);
    });

    it("keeps a page of tokens under the character limit and points at the rest", async () => {
      const page = await call("dbm_get_tokens", { limit: 200 });
      expect(page.text.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
      expect(page.data?.has_more).toBe(true);
      expect(page.data?.next_offset).toBe(page.data?.count);
    });

    it("names the themes when one is wrong", async () => {
      const bad = await call("dbm_get_tokens", { theme: "blue" });
      expect(bad.result.isError).toBe(true);
      expect(bad.text).toContain("purple-light");
    });
  });

  describe("dbm_search", () => {
    it("finds a component by what it does, best match first", async () => {
      const { data: body } = await call("dbm_search", { query: "date range" });
      expect(body?.results[0].name).toBe("DateRangePicker");
    });

    it("finds a hook, a function and a token, and narrows by kind", async () => {
      const toast = await call("dbm_search", { query: "toast", kinds: ["hook", "function"] });
      expect(toast.data?.results.map((row: { name: string }) => row.name)).toEqual(expect.arrayContaining(["useToast", "createToaster"]));
      const tokens = await call("dbm_search", { query: "focus ring", kinds: ["token"] });
      expect(tokens.data?.results.every((row: { kind: string }) => row.kind === "token")).toBe(true);
    });

    it("returns nothing, not an error, when nothing matches", async () => {
      const none = await call("dbm_search", { query: "zzzxqj" });
      expect(none.result.isError).toBeFalsy();
      expect(none.data?.total).toBe(0);
    });
  });

  it("dbm_get_agent_guide returns the shipped guide", async () => {
    const guide = await call("dbm_get_agent_guide");
    expect(guide.text).toBe(data.agentsGuide());
  });
});
