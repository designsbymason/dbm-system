/**
 * The two index files of the agent files (ADR-0228): `llms.txt`, a short curated index in the llmstxt.org form (an H1, a one-sentence
 * summary, then sections of `[name](url): note` lines), and `llms-full.txt`, every page's copy in one file, in the sidebar's order.
 */

const SITE_ORIGIN = "https://dbm-system.com/";
/** The sidebar's groups in their order (`storySort` in packages/components/.storybook/preview.tsx), the one Storybook writes into `index.json`. */
export const GROUP_ORDER = ["Getting started", "Guides", "Foundations", "Components", "Templates", "Resources"];
/** The sections of `llms.txt` that a reader can leave out when short of room (the llmstxt.org "Optional" section). */
const OPTIONAL_GROUPS = new Set(["Resources"]);

/** Fails unless the pages are in the sidebar's group order, so `llms.txt` and `llms-full.txt` read the way the sidebar does. */
export function checkOrder(pages) {
  let rank = -1;
  for (const page of pages) {
    const group = page.title.split("/")[0];
    const next = GROUP_ORDER.indexOf(group);
    if (next === -1) throw new Error(`${page.id} is in the group "${group}", which is not one of the sidebar's`);
    if (next < rank) throw new Error(`${page.id} (${group}) comes after a page of a later group; index.json is no longer in the sidebar's order`);
    rank = next;
  }
}

/** The first sentence of a copy's first paragraph (after its heading and tier line), for a page that has no description of its own. */
export function firstSentence(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => /^[A-Za-z`*[]/.test(line) && !line.startsWith("Tier: ") && !line.startsWith("Live example: "));
  if (start === -1) return "";
  const paragraph = [];
  for (const line of lines.slice(start)) {
    if (line.trim() === "") break;
    paragraph.push(line.trim());
  }
  const joined = paragraph.join(" ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
  // A first sentence that is only a lead-in ("Welcome to the documentation.") takes the second one with it.
  const sentences = (joined.match(/.+?[.!?](?=\s|$)/g) ?? [joined]).map((part) => part.trim());
  const sentence = sentences[0].length < 70 && sentences[1] ? `${sentences[0]} ${sentences[1]}` : sentences[0];
  return sentence.length > 240 ? `${sentence.slice(0, 237).trimEnd()}…` : sentence;
}

/**
 * @param {{ pages: { id: string, title: string }[], copies: Map<string, string>, descriptions: Record<string, string>, summary: string }} input
 *   `copies` maps a page id to its Markdown; `descriptions` are the one-line descriptions of the components and templates.
 */
export function buildLlmsTxt({ pages, copies, descriptions, summary }) {
  checkOrder(pages);
  const out = [
    "# DBM System",
    "",
    `> ${summary}`,
    "",
    "Start with AGENTS.md, which says how to set up and the rules that hold across every component, then manifest.json, which lists every component, prop, part, hook and function as JSON. The documentation is in Storybook; each page below is a Markdown copy of one of its Docs pages, and llms-full.txt is all of them in one file.",
    "",
    "## Start here",
    "",
    `- [AGENTS.md](${SITE_ORIGIN}AGENTS.md): how to set up, and the rules that hold across every component`,
    `- [manifest.json](${SITE_ORIGIN}manifest.json): every component, prop, part, hook and function, as JSON`,
    `- [llms-full.txt](${SITE_ORIGIN}llms-full.txt): every page below, in one file`,
  ];
  const optional = [];
  for (const group of GROUP_ORDER) {
    const lines = pages
      .filter((page) => page.title.split("/")[0] === group)
      .map((page) => {
        const name = page.title.split("/").slice(1).join("/");
        const note = descriptions[name] ?? firstSentence(copies.get(page.id));
        return `- [${name}](${SITE_ORIGIN}docs/${page.id.replace(/--docs$/, "")}.md)${note ? `: ${note}` : ""}`;
      });
    if (lines.length === 0) continue;
    (OPTIONAL_GROUPS.has(group) ? optional : out).push("", `## ${group}`, "", ...lines);
  }
  if (optional.length > 0) out.push("", "## Optional", ...optional.map((line) => (line.startsWith("## ") ? `\n${line}`.replace("## ", "### ") : line)));
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

/** Every page's copy in one file, in the sidebar's order, each ending with the address of its own copy so a reader can tell where one begins. */
export function buildLlmsFull({ pages, copies, summary }) {
  checkOrder(pages);
  const parts = pages.map((page) => `${copies.get(page.id).trimEnd()}\nMarkdown copy: ${SITE_ORIGIN}docs/${page.id.replace(/--docs$/, "")}.md`);
  return `# DBM System: the documentation\n\n> ${summary}\n\nEvery Docs page of the Storybook documentation as Markdown, in the sidebar's order, each page separated from the next by a rule. The index is llms.txt.\n\n---\n\n${parts.join("\n\n---\n\n")}\n`;
}
