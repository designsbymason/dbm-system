/**
 * The two index files of the agent files (ADR-0228): `llms.txt`, a short curated index in the llmstxt.org form (an H1, a one-sentence
 * summary, then sections of `[name](url): note` lines), and `llms-full.txt`, every page's copy in one file, in the sidebar's order.
 */

const SITE_ORIGIN = "https://dbm-system.com/";
/** The sidebar's groups in their order (`storySort` in packages/components/.storybook/preview.tsx), the one Storybook writes into `index.json`. */
export const GROUP_ORDER = ["Getting started", "Guides", "Foundations", "Components", "Templates"];

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

/** Whether a line starts a paragraph of prose (not a heading, list, table, quote, code fence or one of the copy's own lines). */
const isProse = (line) => /^[A-Za-z`*[]/.test(line) && !/^(Tier|Live example|Storybook page|Markdown copy): /.test(line);

/**
 * The first sentence of a copy's first paragraph (after its heading and tier line), for a page that has no description of its own. A
 * first sentence that is short takes the next one with it, from the same paragraph or, when it stands alone, the paragraph after it; when
 * a lone short paragraph ("Welcome to the documentation.") and the next sentence are too long together, the next sentence stands alone.
 */
export function firstSentence(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex(isProse);
  if (start === -1) return "";
  const paragraphAt = (from) => {
    const paragraph = [];
    for (const line of lines.slice(from)) {
      if (line.trim() === "") break;
      paragraph.push(line.trim());
    }
    return paragraph;
  };
  const sentencesOf = (paragraph) => {
    const joined = paragraph.join(" ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
    return (joined.match(/.+?[.!?](?=\s|$)/g) ?? [joined]).map((part) => part.trim());
  };
  const first = paragraphAt(start);
  const sentences = sentencesOf(first);
  const isLeadIn = sentences[0].length < 70;
  let crossed = false;
  if (isLeadIn && sentences.length === 1) {
    const next = lines.findIndex((line, index) => index >= start + first.length && line.trim() !== "");
    if (next !== -1 && isProse(lines[next])) {
      sentences.push(...sentencesOf(paragraphAt(next)));
      crossed = true;
    }
  }
  const together = `${sentences[0]} ${sentences[1]}`;
  // A short sentence that has more of its own paragraph after it is a subject, not a greeting: it stays, and the pair is cut to fit.
  // Only a lone short paragraph ahead of the real first one ("Welcome to the docs.") gives way when the pair is too long.
  const sentence = isLeadIn && sentences[1] ? (crossed && together.length > 240 ? sentences[1] : together) : sentences[0];
  return sentence.length > 240 ? `${sentence.slice(0, 237).trimEnd()}…` : sentence;
}

/**
 * @param {{ pages: { id: string, title: string }[], copies: Map<string, string>, descriptions: Record<string, string>, summary: string }} input
 *   `copies` maps a page id to its Markdown; `descriptions` are the one-line descriptions of the components and templates.
 */
export function buildLlmsTxt({ pages, copies, descriptions, summary }) {
  checkOrder(pages);
  const mcpPage = pages.find((page) => page.title === "Getting started/MCP server");
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
    ...(mcpPage ? [`- [MCP server](${SITE_ORIGIN}docs/${mcpPage.id.replace(/--docs$/, "")}.md): a read-only server your agent can ask about components, props and tokens instead of reading the files`] : []),
  ];
  for (const group of GROUP_ORDER) {
    const lines = pages
      .filter((page) => page.title.split("/")[0] === group)
      .map((page) => {
        const name = page.title.split("/").slice(1).join("/");
        const note = descriptions[name] ?? firstSentence(copies.get(page.id));
        return `- [${name}](${SITE_ORIGIN}docs/${page.id.replace(/--docs$/, "")}.md)${note ? `: ${note}` : ""}`;
      });
    if (lines.length === 0) continue;
    out.push("", `## ${group}`, "", ...lines);
  }
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

/** Every page's copy in one file, in the sidebar's order, each ending with the address of its own copy so a reader can tell where one begins. */
export function buildLlmsFull({ pages, copies, summary }) {
  checkOrder(pages);
  const parts = pages.map((page) => `${copies.get(page.id).trimEnd()}\nMarkdown copy: ${SITE_ORIGIN}docs/${page.id.replace(/--docs$/, "")}.md`);
  return `# DBM System: the documentation\n\n> ${summary}\n\nEvery Docs page of the Storybook documentation as Markdown, in the sidebar's order, each page separated from the next by a rule. The index is llms.txt.\n\n---\n\n${parts.join("\n\n---\n\n")}\n`;
}
