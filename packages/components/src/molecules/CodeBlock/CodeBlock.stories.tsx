import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "../../atoms/Text";
import { CodeBlock } from "./CodeBlock";
import { codeBlockPlaygroundSnippet, codeBlockSnippets } from "./CodeBlock.snippets";
import { DemoBlock, noControls, samples, stack } from "./CodeBlockStoryKit";
import type { PlaygroundArgs } from "./CodeBlockStoryKit";
import type { Highlighter } from "./tokenizeTypes";

/** A highlighter for one block: log lines coloured by their level. `undefined` for any other language. */
const logHighlighter: Highlighter = (code, language) =>
  language === "log"
    ? code.split("\n").map((line) => (line ? [{ type: /\bERROR\b/.test(line) ? "deleted" : /\bWARN\b/.test(line) ? "keyword" : undefined, text: line }] : []))
    : undefined;

const meta: Meta<PlaygroundArgs> = {
  title: "Components/CodeBlock",
  id: "molecules-typography-codeblock",
  component: CodeBlock,
  parameters: { layout: "padded" },
  // Content first, then core visual props, then behavioral/state props, then advanced/escape-hatch props last —
  // the same sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    code: {
      control: "text",
      description: "The source text to show. Drawn as text, never as HTML, and exactly what the copy button copies. One trailing newline is dropped.",
    },
    language: {
      control: "select",
      options: ["ts", "tsx", "js", "jsx", "json", "css", "html", "bash", "diff", "python", "yaml", "sql", "markdown", "go", "rust", "java", "c", "cpp", "csharp", "kotlin", "swift", "ruby", "php", "toml", "text"],
      description:
        "The language to highlight it as. ts, tsx, js, jsx, json, css, html, bash and diff are built in, with aliases such as typescript, sh and svg. python, yaml, sql, markdown, go, rust, java, c, cpp, csharp, kotlin, swift, ruby, php and toml (and py, yml, md, golang, rs, cs, kt, rb…) are turned on with registerCodeLanguage, and so is a grammar of your own; any other value, or none, draws plain text. The header names it as its owners write it (TypeScript, C#, Shell) when it is known, and otherwise as written, in capitals.",
    },
    highlighter: {
      ...noControls,
      description:
        "Highlights this block itself, ahead of any registered or built-in language: given the code and the language, it returns lines of { type?, text } tokens (never HTML), or undefined to leave the block to the others. What it returns must join back to the code exactly or the block is drawn plain, and so it is if it throws. The size limit that protects the built-in languages does not apply. Give it a stable function.",
    },
    title: {
      control: "text",
      description: "A heading for the block, usually a file name. Shown in the header and used as the block's accessible name.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "How large the code is, on the shared scale: the code's font size, the space around it, and the size of the header buttons. md, the default, is the size the block has always had; xs and sm share the smallest font size and differ in the space around the code.",
      table: { defaultValue: { summary: "md" } },
    },
    showHeader: {
      control: "boolean",
      description:
        "Shows the header: the title and language on one side, the buttons on the other. false is the minimal look: no strip, and the block is named by aria-label or, failing that, the title (which is then not drawn). The copy button and the wrap toggle stay, in the top corner of the code, always visible; turn them off with copyable={false} and no wrapToggle for nothing but the code.",
      table: { defaultValue: { summary: "true" } },
    },
    showLanguage: {
      control: "boolean",
      description: "Shows the language label in the header. false leaves the title and the buttons, and a block with nothing else to show has no header at all.",
      table: { defaultValue: { summary: "true" } },
    },
    showLineNumbers: {
      control: "boolean",
      description: "Numbers the lines, in a gutter that is not selected or copied.",
      table: { defaultValue: { summary: "false" } },
    },
    startLine: {
      control: { type: "number", min: -99, max: 999 },
      description: "The number shown on the first line, for an excerpt from further down a file. highlightLines counts from it too.",
      table: { defaultValue: { summary: "1" } },
    },
    highlight: {
      control: "text",
      description: "Storybook only — not a CodeBlock prop. The lines to highlight as you would type them: single lines and ranges, like 2, 4-6. CodeBlock's own prop is highlightLines, an array such as [2, \"4-6\"].",
      table: { disable: true },
    },
    highlightLines: {
      ...noControls,
      description: "Lines to draw attention to, by the numbers shown: single lines and ranges, [2, \"4-6\"]. Drawn with a band and an edge accent, both in addition to colour. Numbers outside the code are ignored.",
    },
    wrap: {
      control: "boolean",
      description:
        "Wraps long lines instead of scrolling sideways. A wrapped line continues under its own text, not under its line number. Controlled with onWrapChange (or on its own, to fix it); use defaultWrap to start wrapped and let wrapToggle change it.",
      table: { defaultValue: { summary: "false" } },
    },
    defaultWrap: {
      ...noControls,
      description: "Whether wrapping starts on, when it is not controlled with wrap.",
      table: { defaultValue: { summary: "false" } },
    },
    onWrapChange: {
      ...noControls,
      description: "Called when the wrap button is pressed, with the new state.",
    },
    wrapToggle: {
      control: "boolean",
      description:
        "Shows a button in the header that turns line wrapping on and off. It is a toggle: its pressed state says which. Without a header (showHeader={false}) it sits in the corner of the code beside the copy button.",
      table: { defaultValue: { summary: "false" } },
    },
    maxHeight: {
      control: "text",
      description: "The tallest the code may grow before it scrolls, as a CSS length (24rem). Empty means no limit. A collapsible block uses it once expanded.",
    },
    collapsible: {
      control: "boolean",
      description: "Shows only the first collapsedLines lines, with a button to reveal the rest. No effect on a block that is no longer than that. Everything stays in the page, and the copy button copies all of it.",
      table: { defaultValue: { summary: "false" } },
    },
    collapsedLines: {
      control: { type: "number", min: 1, max: 40 },
      description: "How many lines a collapsed block shows. A line that wraps still counts as one, however many rows it takes.",
      table: { defaultValue: { summary: "10" } },
    },
    expanded: {
      ...noControls,
      description: "Whether a collapsible block is expanded (controlled). Use with onExpandedChange.",
    },
    defaultExpanded: {
      control: "boolean",
      description: "Whether a collapsible block starts expanded (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onExpandedChange: {
      ...noControls,
      description: "Called when the expand or collapse button is pressed, with the new state.",
    },
    copyable: {
      control: "boolean",
      description: "Shows a button that copies the code to the clipboard, and announces the result to screen readers.",
      table: { defaultValue: { summary: "true" } },
    },
    stripPrompt: {
      control: "boolean",
      description:
        "For shell code, takes a leading \"$ \" prompt off each line that has one when the code is copied, so a command shown as \"$ pnpm add x\" pastes as \"pnpm add x\". The prompt is still drawn. Lines without a prompt are copied as they are. false copies the code exactly as written.",
      table: { defaultValue: { summary: "true" } },
    },
    copiedDuration: {
      control: { type: "number", min: 0, max: 10000, step: 500 },
      description: "How long, in milliseconds, the copy button shows its check mark (or its warning, if copying failed) before going back.",
      table: { defaultValue: { summary: "2000" } },
    },
    onCopied: {
      ...noControls,
      description: "Called after the copy button has copied the code, with the code. Not called if the copy failed. (The native onCopy is a different thing: it fires when the reader copies a selection.)",
    },
    labels: {
      ...noControls,
      description:
        "The words the block writes itself; translate them here. Give only the ones you change: wrap (\"Wrap lines\"), copy (\"Copy code\"), copied, copyFailed, expand (a function of the number of hidden lines), collapse (\"Show less\"), highlighted (a function of how many lines a highlight covers, said in front of it for screen readers) and region (\"Code\").",
    },
    "aria-label": {
      control: "text",
      description: "Names the block for assistive tech, in place of title. Also names the scrollable region while the code overflows.",
    },
    "aria-labelledby": {
      ...noControls,
      description: "The id of an already-visible element that names the block, in place of aria-label or title.",
    },
    "aria-describedby": { ...noControls, description: "The id of a description of the block." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the block." },
  },
  // Every controllable prop gets an explicit value here, matching its real default; the source and language
  // start on a small TSX example, which has no default of its own.
  args: {
    code: samples.tsx,
    language: "tsx",
    title: "",
    showLineNumbers: false,
    startLine: 1,
    highlight: "",
    wrap: false,
    maxHeight: "",
    collapsible: false,
    collapsedLines: 10,
    defaultExpanded: false,
    copyable: true,
    stripPrompt: true,
    copiedDuration: 2000,
    "aria-label": "Example code",
    size: "md",
    showHeader: true,
    showLanguage: true,
    wrapToggle: false,
  },
  render: (args) => <DemoBlock {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => codeBlockPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const Languages: Story = {
  parameters: { docs: { source: { code: codeBlockSnippets.languages } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["ts", "tsx", "json", "css", "html", "bash", "diff"] as const).map((language) => (
        <DemoBlock key={language} {...args} code={samples[language]} language={language} title="" aria-label={`${language} example`} />
      ))}
    </div>
  ),
};

export const MoreLanguages: Story = {
  name: "More languages",
  parameters: { docs: { source: { code: codeBlockSnippets.moreLanguages } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["python", "yaml", "sql", "markdown", "go", "rust", "java"] as const).map((language) => (
        <DemoBlock key={language} {...args} code={samples[language]} language={language} title="" aria-label={`${language} example`} />
      ))}
    </div>
  ),
};

export const FurtherLanguages: Story = {
  name: "Further languages",
  parameters: { docs: { source: { code: codeBlockSnippets.furtherLanguages } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["c", "cpp", "csharp", "kotlin", "swift", "ruby", "php", "toml"] as const).map((language) => (
        <DemoBlock key={language} {...args} code={samples[language]} language={language} title="" aria-label={`${language} example`} />
      ))}
    </div>
  ),
};

export const DiffLineNumbers: Story = {
  name: "A diff with line numbers",
  parameters: { docs: { source: { code: codeBlockSnippets.diffNumbers } } },
  args: {},
  argTypes: { code: noControls, language: noControls, showLineNumbers: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      <DemoBlock {...args} code={samples.diffWithHunks} language="diff" showLineNumbers title="greet.diff" aria-label="A numbered diff" />
      <DemoBlock {...args} code={"- const size = 'md';\n+ const size = 'lg';"} language="diff" showLineNumbers title="No hunk header" aria-label="A diff with no line numbers" />
    </div>
  ),
};

export const OwnLanguage: Story = {
  name: "Your own language or highlighter",
  parameters: { docs: { source: { code: codeBlockSnippets.ownLanguage } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, highlighter: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      <DemoBlock {...args} code={samples.ini} language="ini" title="settings.ini" aria-label="A registered language" />
      <DemoBlock {...args} code={samples.log} language="log" highlighter={logHighlighter} title="server.log" aria-label="A block's own highlighter" />
    </div>
  ),
};

export const WithTitle: Story = {
  name: "With a title",
  parameters: { docs: { source: { code: codeBlockSnippets.title } } },
  args: { title: "SaveButton.tsx" },
  argTypes: { title: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const LineNumbers: Story = {
  name: "Line numbers",
  parameters: { docs: { source: { code: codeBlockSnippets.lineNumbers } } },
  args: { showLineNumbers: true },
  argTypes: { showLineNumbers: noControls },
};

export const HighlightedLines: Story = {
  name: "Highlighted lines",
  parameters: { docs: { source: { code: codeBlockSnippets.highlightLines } } },
  args: { showLineNumbers: true, highlight: "2, 4-6" },
  argTypes: { highlight: noControls, showLineNumbers: noControls },
};

export const Excerpt: Story = {
  name: "An excerpt, from line 42",
  parameters: { docs: { source: { code: codeBlockSnippets.startLine } } },
  args: { code: samples.ts, language: "ts", showLineNumbers: true, startLine: 42, highlight: "44" },
  argTypes: { code: noControls, language: noControls, highlight: noControls, showLineNumbers: noControls, startLine: noControls },
};

export const Wrapped: Story = {
  name: "Wrapped long lines",
  parameters: { docs: { source: { code: codeBlockSnippets.wrap } } },
  args: { code: samples.longLine, language: "bash", wrap: true, showLineNumbers: true },
  argTypes: { code: noControls, language: noControls, wrap: noControls, showLineNumbers: noControls },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <DemoBlock {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  parameters: { docs: { source: { code: codeBlockSnippets.size } } },
  args: {},
  argTypes: { code: noControls, language: noControls, size: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DemoBlock key={size} {...args} code={samples.ts} language="ts" size={size} title={`size="${size}"`} aria-label={`${size} size`} />
      ))}
    </div>
  ),
};

export const WrapToggle: Story = {
  name: "A wrap button",
  parameters: { docs: { source: { code: codeBlockSnippets.wrapToggle } } },
  args: { code: samples.longLine, language: "bash", wrapToggle: true, showLineNumbers: true, title: "request.sh" },
  argTypes: { code: noControls, language: noControls, wrapToggle: noControls, showLineNumbers: noControls, title: noControls, wrap: noControls },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <DemoBlock {...args} />
    </div>
  ),
};

export const MinimalHeader: Story = {
  name: "Minimal: less header",
  parameters: { docs: { source: { code: codeBlockSnippets.header } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, showHeader: noControls, showLanguage: noControls, copyable: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      <DemoBlock {...args} code={samples.ts} language="ts" title="total.ts" showLanguage={false} aria-label="No language label" />
      <DemoBlock {...args} code={samples.ts} language="ts" title="total.ts" showHeader={false} aria-label="No header" />
      <DemoBlock {...args} code="pnpm add @dbm-system/components" language="bash" showHeader={false} copyable={false} aria-label="Nothing but the code" />
    </div>
  ),
};

export const Scrolling: Story = {
  name: "Long lines that scroll",
  parameters: { docs: { source: { code: codeBlockSnippets.plain } } },
  args: { code: samples.longLine, language: "bash", wrap: false, title: "request.sh" },
  argTypes: { code: noControls, language: noControls, wrap: noControls },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <DemoBlock {...args} aria-label="" />
    </div>
  ),
};

export const Collapsible: Story = {
  parameters: { docs: { source: { code: codeBlockSnippets.collapsible } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 6 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, expanded: noControls },
};

// A story with state of its own: the parent owns `expanded`. The snippet says so in a comment.
const ControlledBlock = (args: PlaygroundArgs) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={stack}>
      <DemoBlock {...args} expanded={expanded} onExpandedChange={setExpanded} />
      <Text size="sm">The block is {expanded ? "expanded" : "collapsed"}.</Text>
    </div>
  );
};

export const Controlled: Story = {
  name: "Collapsible, controlled",
  parameters: { docs: { source: { code: codeBlockSnippets.controlled } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 4 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, expanded: noControls, defaultExpanded: noControls },
  render: ({ expanded: _expanded, ...args }) => <ControlledBlock {...args} />,
};

export const MaxHeight: Story = {
  name: "A tallest height",
  parameters: { docs: { source: { code: codeBlockSnippets.maxHeight } } },
  args: { code: samples.json, language: "json", maxHeight: "10rem", title: "package.json" },
  argTypes: { code: noControls, language: noControls, maxHeight: noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const CopyButton: Story = {
  name: "The copy button",
  parameters: { docs: { source: { code: codeBlockSnippets.copy } } },
  args: { code: "pnpm add @dbm-system/components", language: "bash" },
  argTypes: { code: noControls, language: noControls, copyable: noControls, onCopied: noControls },
  render: (args) => (
    <div style={stack}>
      <DemoBlock {...args} copyable aria-label="With a copy button" />
      <DemoBlock {...args} copyable={false} aria-label="Without a copy button" />
    </div>
  ),
};

export const ShellPrompt: Story = {
  name: "Shell commands: the prompt is not copied",
  parameters: { docs: { source: { code: codeBlockSnippets.prompt } } },
  args: { code: "$ pnpm add @dbm-system/components\n$ pnpm test", language: "bash" },
  argTypes: { code: noControls, language: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="Install and test" />,
};

export const PlainText: Story = {
  name: "Plain text",
  parameters: { docs: { source: { code: codeBlockSnippets.plain } } },
  args: { code: samples.log, language: "", title: "output.log" },
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const Translated: Story = {
  name: "Translated words",
  parameters: { docs: { source: { code: codeBlockSnippets.translated } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 3 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, labels: noControls },
  render: (args) => (
    <DemoBlock
      {...args}
      labels={{
        copy: "Copier le code",
        copied: "Copié",
        copyFailed: "Échec de la copie",
        expand: (count) => `Afficher ${count} lignes de plus`,
        collapse: "Réduire",
      }}
    />
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: codeBlockSnippets.rtl } } },
  args: { code: samples.ts, language: "ts", title: "مثال.ts", showLineNumbers: true },
  argTypes: { code: noControls, language: noControls, title: noControls, showLineNumbers: noControls, "aria-label": noControls },
  render: (args) => (
    <div dir="rtl">
      <DemoBlock {...args} aria-label="" />
    </div>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: codeBlockSnippets.labelled } } },
  args: { code: "pnpm add @dbm-system/components", language: "bash" },
  argTypes: { code: noControls, language: noControls, "aria-label": noControls, "aria-labelledby": noControls },
  render: ({ "aria-label": _label, ...args }) => (
    <div style={{ ...stack, gap: "var(--dbm-space-2)" }}>
      <Text id="install-label" size="sm" weight="semibold">
        Install
      </Text>
      <DemoBlock {...args} aria-labelledby="install-label" />
    </div>
  ),
};

