import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absolutize, convertPage, inline } from "./convert.mjs";
import { evaluate } from "./evaluate.mjs";
import { unified } from "unified";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

const entry = { id: "guides-example--docs", title: "Guides/Example", importPath: "./src/guides/Example.mdx" };
const ctx = {
  origin: "https://dbm-system.com/",
  storybookBase: "https://dbm-system.com/storybook/",
  copies: new Set(["guides-theming--docs", "foundations-overview--docs"]),
  catalog: { Button: { tier: "atom", category: "Inputs" } },
  tokens: { primitives: { color: { purple: { 600: "#5548a4", 50: "#f9f9ff" } }, space: { px: "1px", 1: "0.25rem" }, shadow: { light: { sm: "0 1px 2px" } } } },
  semanticValue: () => "color.gray.100",
  foundationCards: () => [{ name: "Color", description: "Scales", href: "/?path=/docs/foundations-color--docs" }],
  iconNames: () => ["XIcon", "CheckIcon"],
  componentRows: () => [{ name: "Button", tier: "Atom", category: "Inputs", description: "An action.", url: "https://dbm-system.com/docs/atoms-inputs-button.md" }],
  canvas: async ({ story }) => ({ name: story, url: `https://dbm-system.com/storybook/?path=/story/x--${story}`, snippet: story === "Shown" ? "<Button />" : undefined }),
};
const convert = (source, tables) => convertPage(source, { entry, ctx, tables });
const FOOTER = "Storybook page: <https://dbm-system.com/storybook/?path=/docs/guides-example--docs>\n";

describe("convertPage", () => {
  it("keeps prose, lists and code, and drops imports, exports, Meta, the hidden heading and comments", async () => {
    const out = await convert(
      'import { Meta } from "@storybook/addon-docs/blocks";\nexport const order = ["a"];\n\n<Meta title="Guides/Example" />\n\n{/* a note to the editor */}\n\n<VisuallyHidden asChild><h2>Intro</h2></VisuallyHidden>\n\n# Title\n\nSome *text* and `code`.\n\n- one\n- two\n\n```tsx\nconst a = 1;\n```\n',
    );
    assert.equal(out, `# Title\n\nSome *text* and \`code\`.\n\n- one\n- two\n\n\`\`\`tsx\nconst a = 1;\n\`\`\`\n\n${FOOTER}`);
  });

  it("writes a Callout as a blockquote that begins Note:, Do: or Don't:", async () => {
    const out = await convert('<Callout tone="info" title="In active development">\n\nIt is coming.\n\n</Callout>\n\n<Callout tone="danger" title="Don\'t">\n\n- No.\n\n</Callout>\n');
    assert.match(out, /> Note: \*\*In active development\*\*\n>\n> It is coming\./);
    assert.match(out, /> Don't:\n>\n> - No\./);
  });

  it("writes neighbouring RelatedCards as one list and drops their preview", async () => {
    const out = await convert('<div>\n<RelatedCard name="Color" description="Scales" href="?path=/docs/guides-theming--docs"><div style={{ color: "red" }} /></RelatedCard>\n<RelatedCard name="Space" description="Steps" href="?path=/docs/foundations-space--docs"><span /></RelatedCard>\n</div>\n');
    assert.match(out, /- \[Color\]\(https:\/\/dbm-system\.com\/docs\/guides-theming\.md\): Scales\n- \[Space\]\(https:\/\/dbm-system\.com\/storybook\/\?path=\/docs\/foundations-space--docs\): Steps/);
  });

  it("writes TokenRows as one table with the CSS variable", async () => {
    const out = await convert('<TokenRow token="bg.brand" usage="The fill" />\n<TokenRow token="badge.size.xs–badge.size.xl" usage="Sizes" />\n');
    assert.match(out, /\| Token \| CSS variable \| Usage \|/);
    assert.match(out, /\| `bg\.brand` \| `var\(--dbm-bg-brand\)` \| The fill \|/);
    assert.match(out, /\| `badge\.size\.xs–badge\.size\.xl` \| — \| Sizes \|/);
  });

  it("writes a ReferenceTable's first column as code unless told otherwise, and reads exported lists and spreads", async () => {
    const out = await convert('export const rows = [["a, b", "The `x` pair"], ...more];\nexport const more = [["c", "Last"]];\n\n<ReferenceTable columns={["Names", "What"]} rows={rows} />\n');
    assert.match(out, /\| `a`, `b` \| The `x` pair \|/);
    assert.match(out, /\| `c` \| Last \|/);
  });

  it("writes a Canvas as a link to its story and the story's snippet", async () => {
    const out = await convert('import * as S from "./S.stories";\n\n<Canvas of={S.Shown} />\n\n<Canvas of={S.Plain} />\n');
    assert.match(out, /Live example: \[Shown\]\(https:\/\/dbm-system\.com\/storybook\/\?path=\/story\/x--Shown\)\n\n```tsx\n<Button \/>\n```/);
    assert.match(out, /Live example: \[Plain\]\([^)]*\)\n\nStorybook page/);
  });

  it("takes each Properties table from the rendered page, in order, and fails when one is missing or left over", async () => {
    const table = { head: ["Name", "Description"], rows: [["`size`", "The `size`."]] };
    const out = await convert('import * as S from "./S.stories";\n\n<PropertiesTable of={S} order={[]} />\n', [table]);
    assert.match(out, /\| Name \| Description \|\n\| - \| - \|\n\| `size` \| The `size`\. \|/);
    await assert.rejects(() => convert('<PropertiesTable of={S} />\n', []), /missing/);
    await assert.rejects(() => convert("# Title\n", [table]), /had no block/);
  });

  it("writes the Foundations visuals as tables of the token values", async () => {
    const out = await convert('import { primitives } from "@dbm-system/tokens";\n\n<ColorScaleGrid family="purple" anchor="600" />\n\n<SpacingScale />\n\n<ColorSwatch color={primitives.color.purple[50]} label="tint" sublabel="x" />\n');
    assert.match(out, /`color\.purple\.600` \(the brand anchor\) \| `#5548a4`/);
    assert.match(out, /`space\.1` \| `0\.25rem`/);
    assert.doesNotMatch(out, /space\.px/);
    assert.match(out, /- tint: `#f9f9ff`/);
  });

  it("writes a folded block as its summary in bold and then its content, so nothing folded is lost", async () => {
    const out = await convert("<details>\n<summary>Earlier releases: 0.1.x (3)</summary>\n\n## 0.1.2\n\n- A fix.\n\n</details>\n");
    assert.match(out, /\*\*Earlier releases: 0\.1\.x \(3\)\*\*\n\n## 0\.1\.2\n\n- A fix\./);
  });

  it("fails on an element it has no text form for, naming the page and the element", async () => {
    await assert.rejects(() => convert("<div><Sparkle /></div>\n"), /guides-example--docs: <Sparkle>: no text form/);
  });

  it("fails on an expression in the text and on a prop it cannot read", async () => {
    await assert.rejects(() => convert("Today is {new Date()}.\n"), /expression in the page text/);
    await assert.rejects(() => convert("<FileTable label=\"x\" rows={[{ name: compute() }]} />\n"), /CallExpression/);
  });
});

describe("absolutize", () => {
  it("points a Docs page with a copy at its copy, and any other Storybook address at Storybook", () => {
    assert.equal(absolutize("/docs/guides-theming--docs", ctx), "https://dbm-system.com/docs/guides-theming.md");
    assert.equal(absolutize("?path=/docs/guides-theming--docs#colour", ctx), "https://dbm-system.com/docs/guides-theming.md#colour");
    assert.equal(absolutize("/?path=/docs/other--docs", ctx), "https://dbm-system.com/storybook/?path=/docs/other--docs");
    assert.equal(absolutize("/story/x--y", ctx), "https://dbm-system.com/storybook/?path=/story/x--y");
  });
  it("leaves absolute and fragment links alone and rejects the rest", () => {
    assert.equal(absolutize("https://example.com/a", ctx), "https://example.com/a");
    assert.equal(absolutize("#top", ctx), "#top");
    assert.throws(() => absolutize("./somewhere.html", ctx), /no form the copies understand/);
  });
});

describe("evaluate", () => {
  const expression = (source) => unified().use(remarkParse).use(remarkMdx).parse(`<X a={${source}} />`).children[0].attributes[0].value.data.estree.body[0].expression;
  it("reads literals, lists, objects, spreads and a member of the scope", () => {
    assert.deepEqual(evaluate(expression('[1, "a", -2, { b: [true] }]')), [1, "a", -2, { b: [true] }]);
    assert.deepEqual(evaluate(expression("[...list, 3]"), { list: [1, 2] }), [1, 2, 3]);
    assert.equal(evaluate(expression("p.q.r"), { p: { q: { r: 7 } } }), 7);
  });
  it("throws on anything else", () => {
    assert.throws(() => evaluate(expression("f(1)")), /CallExpression/);
    assert.throws(() => evaluate(expression("`a${b}`")), /expression/);
  });
});

describe("inline", () => {
  it("splits code spans out of plain text", () => {
    assert.deepEqual(inline("a `b` c").map((node) => node.type), ["text", "inlineCode", "text"]);
  });
});
