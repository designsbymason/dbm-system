import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLlmsFull, buildLlmsTxt, checkOrder, firstSentence } from "./index-files.mjs";

const pages = [
  { id: "getting-started-introduction--docs", title: "Getting started/Introduction" },
  { id: "getting-started-mcp-server--docs", title: "Getting started/MCP server" },
  { id: "resources-faq--docs", title: "Getting started/FAQ" },
  { id: "atoms-inputs-button--docs", title: "Components/Button" },
];
const copies = new Map([
  ["getting-started-introduction--docs", "# Introduction\n\nWelcome. DBM is a library for people and for agents, and this page says where to begin.\n\nStorybook page: <x>\n"],
  ["getting-started-mcp-server--docs", "# MCP server\n\n`@dbm-system/mcp` is a server.\n\nStorybook page: <x>\n"],
  ["resources-faq--docs", "# FAQ\n\nShort answers to the first questions, as people ask them.\n\nStorybook page: <x>\n"],
  ["atoms-inputs-button--docs", "# Button\n\nTier: Atom · Category: Inputs\n\nThe primary action.\n\nStorybook page: <x>\n"],
]);
const input = { pages, copies, descriptions: { Button: "An action." }, summary: "A library." };

describe("buildLlmsTxt", () => {
  const out = buildLlmsTxt(input);
  it("opens with an H1 and a one-sentence summary, as llmstxt.org asks", () => {
    assert.match(out, /^# DBM System\n\n> A library\.\n\n/);
  });
  it("has a section per sidebar group, each line a link to the copy with a note", () => {
    assert.match(out, /## Getting started\n\n- \[Introduction\]\(https:\/\/dbm-system\.com\/docs\/getting-started-introduction\.md\): Welcome\. DBM is a library for people and for agents, and this page says where to begin\./);
    assert.match(out, /- \[Button\]\(https:\/\/dbm-system\.com\/docs\/atoms-inputs-button\.md\): An action\./);
  });
  it("lists the MCP server page under Start here, when there is one", () => {
    assert.match(out, /## Start here\n\n[\s\S]*- \[MCP server\]\(https:\/\/dbm-system\.com\/docs\/getting-started-mcp-server\.md\): a read-only server your agent can ask[\s\S]*## Getting started/);
    const without = buildLlmsTxt({ ...input, pages: pages.filter((page) => !page.title.endsWith("MCP server")) });
    assert.doesNotMatch(without.split("## Getting started")[0], /MCP server/);
  });
  it("lists the FAQ with the Getting started pages, under the id the page has always had, and has no Optional section", () => {
    assert.match(out, /- \[FAQ\]\(https:\/\/dbm-system\.com\/docs\/resources-faq\.md\): Short answers/);
    assert.ok(out.indexOf("[FAQ]") < out.indexOf("## Components"));
    assert.doesNotMatch(out, /## Optional/);
  });
});

describe("buildLlmsFull", () => {
  it("holds every copy, in order, each followed by the address of its own copy", () => {
    const out = buildLlmsFull(input);
    assert.ok(out.indexOf("# Introduction") < out.indexOf("# FAQ") && out.indexOf("# FAQ") < out.indexOf("# Button"));
    assert.equal(out.match(/^Markdown copy: /gm).length, 4);
    assert.match(out, /Markdown copy: https:\/\/dbm-system\.com\/docs\/atoms-inputs-button\.md/);
  });
});

describe("checkOrder", () => {
  it("fails when the pages are not in the sidebar's group order, or in a group it does not have", () => {
    assert.throws(() => checkOrder([...pages].reverse()), /no longer in the sidebar's order/);
    assert.throws(() => checkOrder([{ id: "x--docs", title: "Elsewhere/X" }]), /not one of the sidebar's/);
  });
});

describe("firstSentence", () => {
  it("skips the heading and the tier line, and takes the next sentence when the first is only a lead-in", () => {
    assert.equal(firstSentence("# Button\n\nTier: Atom · Category: Inputs\n\nThe primary action.\n"), "The primary action.");
    assert.equal(firstSentence("# A\n\nWelcome. This is the longer second sentence of the page.\n"), "Welcome. This is the longer second sentence of the page.");
  });
  it("reads on into the next paragraph when a lead-in stands alone, and drops the lead-in when the two are too long", () => {
    assert.equal(firstSentence("# A\n\nWelcome to the docs.\n\nThis library has typed components.\n"), "Welcome to the docs. This library has typed components.");
    const long = `${"A long second sentence about the library that goes on and on ".repeat(4).trim()}.`;
    assert.equal(firstSentence(`# A\n\nWelcome to the docs.\n\n${long}\n`), long.length > 240 ? `${long.slice(0, 237).trimEnd()}…` : long);
  });
  it("keeps a short first sentence that has more of its paragraph after it, and cuts the pair to fit", () => {
    const second = `${"It does a great many things for the people who use it ".repeat(5).trim()}.`;
    const out = firstSentence(`# A\n\n\`@x/y\` is a server for a library. ${second}\n`);
    assert.ok(out.startsWith("`@x/y` is a server for a library. It does"));
    assert.ok(out.endsWith("…"));
  });
  it("does not read on into a heading, a list or a code block", () => {
    assert.equal(firstSentence("# A\n\nWelcome to the docs.\n\n## Next\n\nMore.\n"), "Welcome to the docs.");
    assert.equal(firstSentence("# A\n\nWelcome to the docs.\n\n- one\n- two\n"), "Welcome to the docs.");
  });
});
