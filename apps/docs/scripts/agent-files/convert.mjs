/**
 * Turns one Storybook Docs page, written as MDX, into a Markdown copy for agents (ADR-0228, guidelines/docs-site/02-structure.md §6).
 *
 * The page is parsed to a syntax tree and every JSX element in it is replaced by plain Markdown: a Storybook block by its own text
 * form (below), a plain HTML wrapper by its content. An element with no text form throws, so a new block cannot ship without one
 * and nothing disappears silently. Imports and exports are read only for what a block needs (the stories a `Canvas` shows).
 */
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { evaluate, expressionOf } from "./evaluate.mjs";

const TONE_LABEL = { info: "Note", success: "Do", danger: "Don't" };
const SEMANTIC_THEMES = [
  ["purple", "light", "Purple light"],
  ["purple", "dark", "Purple dark"],
  ["emerald", "light", "Emerald light"],
  ["emerald", "dark", "Emerald dark"],
];

// --- small tree builders -------------------------------------------------------------------------------------------------------

const text = (value) => ({ type: "text", value });
const code = (value) => ({ type: "inlineCode", value });
const paragraph = (...children) => ({ type: "paragraph", children });
const link = (url, ...children) => ({ type: "link", url, children });
const strong = (...children) => ({ type: "strong", children });
const listOf = (items) => ({ type: "list", ordered: false, spread: false, children: items.map((children) => ({ type: "listItem", spread: false, children })) });
const cell = (children) => ({ type: "tableCell", children });
const row = (cells) => ({ type: "tableRow", children: cells.map(cell) });
/** A table of phrasing-node cells: `head` and every row hold arrays of phrasing nodes. */
const table = (head, rows) => ({ type: "table", align: head.map(() => null), children: [row(head), ...rows.map(row)] });

/** Plain text with `` `code` `` spans (the form the blocks' string props use) as phrasing nodes. */
export function inline(value) {
  const out = [];
  for (const part of String(value).split(/(`[^`]+`)/g)) {
    if (!part) continue;
    out.push(part.startsWith("`") && part.endsWith("`") && part.length > 1 ? code(part.slice(1, -1)) : text(part));
  }
  return out.length > 0 ? out : [text("")];
}

/** The text of a tree, for an element whose content becomes one inline-code span (`Kbd`). */
function plainText(node) {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

const dash = () => [text("—")];

// --- links ---------------------------------------------------------------------------------------------------------------------

/**
 * An address in a page's links, made absolute. A Docs page that has a Markdown copy points at its copy, any other Storybook address at
 * Storybook, and an address of no known form throws (so a link cannot silently go to nothing).
 */
export function absolutize(url, ctx) {
  if (/^(https?:|mailto:)/.test(url) || url.startsWith("#")) return url;
  const docs = /^\/?(?:\?path=\/docs\/|docs\/)([^&#?]+)(.*)$/.exec(url) ?? /^\/docs\/([^&#?]+)(.*)$/.exec(url);
  if (docs) {
    const id = docs[1];
    const rest = docs[2].replace(/^&/, "");
    if (ctx.copies.has(id)) return `${ctx.origin}docs/${id.replace(/--docs$/, "")}.md${rest.startsWith("#") ? rest : ""}`;
    return `${ctx.storybookBase}?path=/docs/${id}${rest}`;
  }
  const story = /^\/?(?:\?path=\/story\/|story\/)(.+)$/.exec(url);
  if (story) return `${ctx.storybookBase}?path=/story/${story[1]}`;
  throw new Error(`a link to "${url}" is of no form the copies understand`);
}

// --- attributes ----------------------------------------------------------------------------------------------------------------

function attributesOf(node, scope) {
  const out = {};
  for (const attribute of node.attributes) {
    if (attribute.type !== "mdxJsxAttribute") throw new Error(`<${node.name}> has a spread attribute`);
    if (attribute.value === null || attribute.value === undefined) out[attribute.name] = true;
    else if (typeof attribute.value === "string") out[attribute.name] = attribute.value;
    else if (attribute.name === "of") out[attribute.name] = attribute.value; // a story reference, read by `Canvas`
    else {
      try {
        out[attribute.name] = evaluate(expressionOf(attribute.value), scope);
      } catch (error) {
        throw new Error(`<${node.name} ${attribute.name}>: ${error.message}`);
      }
    }
  }
  return out;
}

/** `Stories.Name` from the expression of an `of={...}` attribute. */
function storyReference(attributeValue) {
  const expression = expressionOf(attributeValue);
  if (expression.type === "MemberExpression" && expression.object.type === "Identifier" && !expression.computed) {
    return { moduleName: expression.object.name, story: expression.property.name };
  }
  if (expression.type === "Identifier") return { moduleName: expression.name, story: undefined };
  throw new Error("an `of` that is not a stories module or one of its stories");
}

/** A failure that already says which page and element it came from. */
class PageError extends Error {}

// --- the converter -------------------------------------------------------------------------------------------------------------

/**
 * @param {string} source The page's MDX.
 * @param {{ entry: { id: string, title: string, importPath: string }, ctx: any, tables?: { rows: string[][] }[] }} options
 *   `ctx` carries what the blocks read (see context.mjs); `tables` is the page's rendered Properties tables, in page order.
 * @returns {string} The Markdown copy.
 */
export async function convertPage(source, { entry, ctx, tables = [] }) {
  const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source);
  const imports = new Map();
  for (const node of tree.children) {
    if (node.type !== "mdxjsEsm") continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type === "ImportDeclaration") for (const specifier of statement.specifiers) imports.set(specifier.local.name, statement.source.value);
    }
  }
  // What an attribute may read by name: the token values the page imports, and the constants it exports (read when first used).
  const scope = imports.get("primitives") === "@dbm-system/tokens" ? { primitives: ctx.tokens.primitives } : {};
  for (const node of tree.children) {
    if (node.type !== "mdxjsEsm") continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type !== "ExportNamedDeclaration" || statement.declaration?.type !== "VariableDeclaration") continue;
      for (const declaration of statement.declaration.declarations) {
        if (declaration.id.type === "Identifier" && declaration.init) Object.defineProperty(scope, declaration.id.name, { enumerable: true, get: () => evaluate(declaration.init, scope) });
      }
    }
  }
  const pageUrl = `${ctx.storybookBase}?path=/docs/${entry.id}`;
  const queue = [...tables];
  const env = { entry, ctx, imports, scope, pageUrl, takeTable: () => queue.shift() };

  const children = await convertChildren(tree.children, env);
  if (queue.length > 0) throw new Error(`${entry.id}: ${queue.length} rendered Properties table(s) had no block in the MDX`);
  children.push(paragraph(text("Storybook page: "), link(pageUrl, text(pageUrl))));

  const processor = unified().use(remarkGfm, { tablePipeAlign: false }).use(remarkStringify, { bullet: "-", fences: true, rule: "-", emphasis: "*", listItemIndent: "one" });
  const root = { type: "root", children };
  rewriteLinks(root, ctx);
  return `${processor.stringify(root).replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function rewriteLinks(node, ctx) {
  if ((node.type === "link" || node.type === "definition") && node.url) node.url = absolutize(node.url, ctx);
  for (const child of node.children ?? []) rewriteLinks(child, ctx);
}

async function convertChildren(nodes, env) {
  const out = [];
  for (const node of nodes) out.push(...(await convertNode(node, env)));
  return groupRuns(out);
}

/** Neighbouring marked items (cards, token rows, swatches) become one list or table. */
function groupRuns(nodes) {
  const out = [];
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const group = node.data?.group;
    if (!group) {
      out.push(node);
      continue;
    }
    const run = [node];
    while (nodes[index + 1]?.data?.group === group) run.push(nodes[++index]);
    if (group === "tokens") out.push(table([[text("Token")], [text("CSS variable")], [text("Usage")]], run.map((item) => item.data.cells)));
    else out.push(listOf(run.map((item) => item.children)));
  }
  return out;
}

async function convertNode(node, env) {
  switch (node.type) {
    case "mdxjsEsm":
      return [];
    case "mdxFlowExpression":
    case "mdxTextExpression": {
      if (/^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value)) return [];
      const expression = node.data?.estree?.body?.[0]?.expression;
      if (expression?.type === "Literal" && typeof expression.value === "string") return [text(expression.value)];
      throw new PageError(`${env.entry.id}: an expression in the page text ({${node.value.slice(0, 40)}}) has no text form`);
    }
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement":
      try {
        return await convertElement(node, env);
      } catch (error) {
        if (error instanceof PageError) throw error; // already named by the element it came from
        throw new PageError(`${env.entry.id}: <${node.name ?? ""}>: ${error.message}`);
      }
    case "html":
      throw new PageError(`${env.entry.id}: raw HTML has no text form`);
    default: {
      if (!node.children) return [node];
      return [{ ...node, children: await convertChildren(node.children, env) }];
    }
  }
}

// --- the elements --------------------------------------------------------------------------------------------------------------

async function convertElement(node, env) {
  const { ctx, entry } = env;
  const name = node.name;
  if (name === null) return await convertChildren(node.children, env);

  switch (name) {
    // Nothing for a reader of text: the metadata, the theme sync, the hidden heading and the interactive controls.
    case "Meta":
    case "ThemeSync":
    case "VisuallyHidden":
    case "PlaygroundControls":
      return [];

    // Plain wrappers and the few HTML elements the pages use.
    case "div":
      return await convertChildren(node.children, env);
    case "p":
      return [paragraph(...asPhrasing(await convertChildren(node.children, env)))];
    case "kbd":
    case "Kbd":
    case "code":
      return [code(plainText({ children: node.children }))];

    case "ComponentHeader": {
      const props = attributesOf(node, env.scope);
      const placement = ctx.catalog[props.title];
      const facts = [`Tier: ${props.tier}`, ...(placement ? [`Category: ${placement.category}`] : [])].join(" · ");
      return [{ type: "heading", depth: 1, children: [text(props.title)] }, paragraph(text(facts))];
    }

    case "Callout": {
      const props = attributesOf(node, env.scope);
      const label = TONE_LABEL[props.tone];
      if (!label) throw new Error(`a Callout of tone "${props.tone}"`);
      // "Do" and "Don't" are their own titles; a note's title is a short heading of its own.
      const heading = props.title.toLowerCase() === label.toLowerCase() ? [text(`${label}:`)] : [text(`${label}: `), strong(text(props.title))];
      return [{ type: "blockquote", children: [paragraph(...heading), ...(await convertChildren(node.children, env))] }];
    }

    case "RelatedCard": {
      const props = attributesOf(node, env.scope);
      // The children are a small picture of the component; a card is its name, its link and its sentence.
      return [{ type: "listItem", data: { group: "cards" }, children: [paragraph(link(props.href, text(props.name)), text(`: ${props.description}`))] }];
    }
    case "RelatedLinks": {
      const { items } = attributesOf(node, env.scope);
      return [listOf(items.map((item) => [paragraph(link(item.href, text(item.name)), text(`: ${item.description}`))]))];
    }
    case "FoundationsCards":
      return [listOf(ctx.foundationCards().map((card) => [paragraph(link(card.href, text(card.name)), text(`: ${card.description}`))]))];

    case "TokenRow": {
      const { token, usage } = attributesOf(node, env.scope);
      const variable = /^[a-z0-9.-]+$/.test(token) ? `var(--dbm-${token.replaceAll(".", "-")})` : null;
      return [{ type: "paragraph", children: [], data: { group: "tokens", cells: [[code(token)], variable ? [code(variable)] : dash(), inline(usage)] } }];
    }

    case "ReferenceTable": {
      const { columns, rows, plainFirstColumn = false } = attributesOf(node, env.scope);
      return [table(columns.map((column) => [text(column)]), rows.map((cells) => cells.map((value, index) => referenceCell(value, index, plainFirstColumn))))];
    }
    case "FieldsTable": {
      const { rows } = attributesOf(node, env.scope);
      const rendered = env.takeTable();
      if (rendered && rendered.rows.length !== rows.length) throw new Error(`the page shows ${rendered.rows.length} rows and the MDX has ${rows.length}`);
      return [
        table(
          ["Name", "Value options", "Description", "Default"].map((heading) => [text(heading)]),
          rows.map((field) => [
            [code(field.name), ...(field.required ? [text(" (required)")] : [])],
            field.options?.length ? field.options.flatMap((option, index) => [...(index > 0 ? [text(", ")] : []), code(option)]) : dash(),
            inline(field.description),
            field.defaultValue ? [code(field.defaultValue)] : dash(),
          ]),
        ),
      ];
    }
    case "FileTable": {
      const { rows } = attributesOf(node, env.scope);
      return [table([[text("File")], [text("What it is")]], rows.map((file) => [[code(file.name)], inline(String(file.description))]))];
    }
    case "TokenReferenceTable": {
      const { rows } = attributesOf(node, env.scope);
      return [table([[text("Token")], [text("Value")], [text("Usage")]], rows.map((entry) => [[code(entry.name)], inline(entry.value), entry.usage ? inline(entry.usage) : dash()]))];
    }

    case "PropertiesTable": {
      const rendered = env.takeTable();
      if (!rendered) throw new Error("the page's rendered Properties table is missing");
      return [table(rendered.head.map((heading) => [text(heading)]), rendered.rows.map((cells) => cells.map(inline)))];
    }

    case "Canvas":
    case "PlaygroundCanvas": {
      const reference = storyReference(node.attributes.find((attribute) => attribute.name === "of").value);
      const story = await ctx.canvas({ entry, imports: env.imports, ...reference });
      const out = [paragraph(text("Live example: "), link(story.url, text(story.name)))];
      if (story.snippet && name === "Canvas") out.push({ type: "code", lang: "tsx", value: story.snippet.trimEnd() });
      return out;
    }
    case "ComponentIndex": {
      const { section } = attributesOf(node, env.scope);
      return [table(["Name", "Tier", "Category", "Description"].map((heading) => [text(heading)]), ctx.componentRows(section).map((item) => [[link(item.url, text(item.name))], [text(item.tier)], [text(item.category)], inline(item.description)]))];
    }
    case "IconGallery":
      return [paragraph(text("The icons the components import most, each imported by name from "), code("@dbm-system/icons"), text(`: ${ctx.iconNames().join(", ")}.`))];

    // The demos and diagrams that exist only on the page: a pointer to the page.
    case "ConfirmThenToastDemo":
    case "RowMenuDemo":
    case "ValidatedFormDemo":
    case "EditInDialogDemo":
    case "SearchListDemo":
    case "LoadingDemo":
    case "PageShellAnatomy":
      return [paragraph(text("Live example: "), link(env.pageUrl, text(name.replace(/([a-z])([A-Z])/g, "$1 $2"))))];

    // The Foundations visuals, each as a table of the token values it draws.
    case "ColorScaleGrid": {
      const { family, anchor } = attributesOf(node, env.scope);
      const scale = ctx.tokens.primitives.color[family];
      if (!scale) throw new Error(`no colour family ${family}`);
      return [table([[text("Token")], [text("Value")]], Object.entries(scale).map(([step, value]) => [[code(`color.${family}.${step}`), ...(step === anchor ? [text(" (the brand anchor)")] : [])], [code(value)]]))];
    }
    case "ColorSwatch": {
      const props = attributesOf(node, env.scope);
      return [{ type: "listItem", data: { group: "swatches" }, children: [paragraph(text(`${props.label}: `), code(props.color))] }];
    }
    case "SemanticSwatchGrid": {
      const { tokens } = attributesOf(node, env.scope);
      return [
        table(
          [[text("Token")], ...SEMANTIC_THEMES.map(([, , label]) => [text(label)]), [text("Usage")]],
          tokens.map((item) => [[code(item.token)], ...SEMANTIC_THEMES.map(([brand, mode]) => [code(ctx.semanticValue(item.token, brand, mode))]), inline(item.usage)]),
        ),
      ];
    }
    case "SpacingScale":
      return [scaleTable("space", ctx.tokens.primitives.space, (step) => step !== "px")];
    case "RadiusScale":
      return [scaleTable("radius", ctx.tokens.primitives.radius)];
    case "IconSizeScale":
      return [scaleTable("icon-size", ctx.tokens.primitives["icon-size"])];
    case "TypeSpecimen":
      return [scaleTable("font-size", ctx.tokens.primitives["font-size"])];
    case "ShadowScale": {
      const { mode } = attributesOf(node, env.scope);
      const shadows = ctx.tokens.primitives.shadow[mode];
      if (!shadows) throw new Error(`no ${mode} shadows`);
      return [scaleTable("shadow", shadows, () => true, ` (${mode})`)];
    }
    case "MotionScale": {
      const { dimension, tokens } = attributesOf(node, env.scope);
      const values = ctx.tokens.primitives.motion[dimension];
      if (!values) throw new Error(`no motion dimension ${dimension}`);
      return [table([[text("Token")], [text("Value")], [text("Usage")]], tokens.map((item) => [[code(`motion.${dimension}.${item.name}`)], [code(String(values[item.name]))], inline(item.usage)]))];
    }

    default:
      throw new Error("no text form for this element; add one in scripts/agent-files/convert.mjs");
  }
}

/** A Foundations scale as a Token / Value table. */
function scaleTable(prefix, values, keep = () => true, note = "") {
  return table([[text("Token")], [text("Value")]], Object.entries(values).filter(([step]) => keep(step)).map(([step, value]) => [[code(`${prefix}.${step}`), ...(note ? [text(note)] : [])], [code(String(value))]]));
}

/** A cell of a `ReferenceTable`: the first column's comma-separated names are code, as the block draws them. */
function referenceCell(value, index, plainFirstColumn) {
  const cellText = String(value);
  if (index !== 0 || plainFirstColumn || cellText.includes("`")) return inline(cellText);
  return cellText.split(", ").flatMap((piece, position) => [...(position > 0 ? [text(", ")] : []), code(piece)]);
}

/** The phrasing content of a block's children: a paragraph's own children are taken up. */
function asPhrasing(nodes) {
  return nodes.flatMap((node) => (node.type === "paragraph" ? node.children : [node]));
}
