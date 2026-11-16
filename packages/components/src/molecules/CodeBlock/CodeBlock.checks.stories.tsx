import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "./browserProtocol";
import { CodeBlock } from "./CodeBlock";
import { samples, stack } from "./CodeBlockStoryKit";
import type { PlaygroundArgs } from "./CodeBlockStoryKit";
import { registerCodeLanguage } from "./registry";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev` on the
// whole group): layout and measurement, the cascade, selection, real focus and contrast, print and forced-colours
// emulation, the accessibility tree. They live in their own file, in their own group, the way ADR-0013 keeps a
// sub-part's documentation out of the sidebar, so the file that documents the component stays about the component.
const meta: Meta<PlaygroundArgs> = {
  title: "Components/CodeBlock/Checks",
  id: "molecules-typography-codeblock-checks",
  component: CodeBlock,
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

// ---------------------------------------------------------------------------------------------------------
// The stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests. Everything
// they check is what only a real browser computes: layout, the cascade, selection, real focus and contrast.

const rect = (element: Element) => element.getBoundingClientRect();
const px = (value: string) => Number.parseFloat(value);
const linesOf = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>("span[data-line]")];
const resolveLength = (token: string) => {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
};
const resolveColor = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
/** Relative luminance and contrast ratio from computed `rgb(...)` strings (WCAG 2.x). */
const channels = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const luminance = (colour: string) => {
  const [r = 0, g = 0, b = 0] = channels(colour).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

// Every language with a grammar, so every colour it uses is measured.
const contrastLanguages = ["tsx", "ts", "json", "css", "html", "bash", "diff", "python", "yaml", "sql", "markdown", "go", "rust", "java", "c", "cpp", "csharp", "kotlin", "swift", "ruby", "php", "toml", "ini"] as const;

export const TokenContrastInteraction: Story = {
  name: "Interaction: every syntax colour is AA on the block and on a highlighted line (this theme)",
  render: () => (
    <div style={stack}>
      {contrastLanguages.map((language) => (
        <div key={language} data-testid={language}>
          <CodeBlock code={samples[language]} language={language} aria-label={language} highlightLines={[2, "4-5"]} showLineNumbers />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const seen = new Set<string>();
    for (const language of contrastLanguages) {
      const block = within(canvasElement).getByTestId(language);
      const root = block.firstElementChild as HTMLElement;
      const background = getComputedStyle(root).backgroundColor;
      const band = resolveColor("--dbm-bg-code-highlight");
      for (const line of linesOf(block)) {
        const isHighlighted = line.dataset.highlighted === "true";
        for (const token of line.querySelectorAll<HTMLElement>(":scope > span")) {
          const colour = getComputedStyle(token).color;
          seen.add(colour);
          await expect(contrast(colour, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        }
        // The line's own uncoloured text and its number are checked as well.
        await expect(contrast(getComputedStyle(line).color, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        await expect(contrast(getComputedStyle(line, "::before").color, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        if (isHighlighted) await expect(getComputedStyle(line).backgroundColor).toBe(band);
      }
    }
    // Ten kinds of token, and every kind actually drew somewhere in the samples above.
    await expect(seen.size).toBeGreaterThanOrEqual(8);
  },
};

// The same check pinned to each of the other three themes, since a colour that passes on purple light says
// nothing about emerald dark.
const themedContrast = (brand: "purple" | "emerald", mode: "light" | "dark"): Story => ({
  ...TokenContrastInteraction,
  name: `Interaction: syntax colours are AA in ${brand} ${mode}`,
  globals: { brand, mode },
  play: async (context) => {
    await expect(document.documentElement.dataset.mode ?? mode).toBe(mode);
    await TokenContrastInteraction.play?.(context);
  },
});
export const TokenContrastPurpleDark: Story = themedContrast("purple", "dark");
export const TokenContrastEmeraldLight: Story = themedContrast("emerald", "light");
export const TokenContrastEmeraldDark: Story = themedContrast("emerald", "dark");

export const LineNumbersInteraction: Story = {
  name: "Interaction: a wrapped line continues under its own text, and the numbers are not selected",
  render: () => (
    <div style={{ maxWidth: "24rem" }} data-testid="narrow">
      <CodeBlock code={`short\n${samples.longLine}\nend`} language="text" showLineNumbers wrap aria-label="Wrapped" startLine={9} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const lines = linesOf(block);
    const [short, long, last] = lines as [HTMLElement, HTMLElement, HTMLElement];
    // The long line wraps onto several rows. Each row's first character is at the same x — under the text, past the
    // number — and that x is where the line's first row starts: two spacing steps and the gutter in from the line.
    const range = document.createRange();
    range.selectNodeContents(long);
    const rowStarts = new Map<number, number>();
    for (const box of range.getClientRects()) {
      if (box.width === 0) continue;
      const row = Math.round(box.top);
      rowStarts.set(row, Math.min(rowStarts.get(row) ?? Number.POSITIVE_INFINITY, box.left));
    }
    await expect(rowStarts.size).toBeGreaterThan(2);
    const firstX = [...rowStarts.values()][0] as number;
    for (const start of rowStarts.values()) await expect(Math.abs(start - firstX)).toBeLessThan(0.5);
    const gutter = px(getComputedStyle(long, "::before").width);
    await expect(Math.abs(firstX - (rect(long).left + 2 * resolveLength("--dbm-space-4") + gutter))).toBeLessThan(1);
    const boxes = [{ left: firstX }];
    // Every line's text starts at the same x, wrapped or not.
    const shortRange = document.createRange();
    shortRange.selectNodeContents(short);
    await expect(Math.abs(shortRange.getBoundingClientRect().left - boxes[0]!.left)).toBeLessThan(1);
    // The numbers are drawn by CSS and not selectable, so selecting the code gives only the code.
    await expect(getComputedStyle(short, "::before").userSelect).toBe("none");
    await expect(getComputedStyle(short, "::before").content).toContain('"9"');
    await expect(getComputedStyle(last, "::before").content).toContain('"11"');
    const selection = window.getSelection() as Selection;
    selection.selectAllChildren(block.querySelector("code") as Node);
    const copied = selection.toString().split("\n").filter(Boolean);
    await expect(copied).toEqual(["short", samples.longLine, "end"]);
    selection.removeAllRanges();
  },
};

export const HighlightInteraction: Story = {
  name: "Interaction: a highlighted line is a full-width band with an edge accent, and nothing shifts",
  render: () => (
    <div style={{ maxWidth: "20rem" }} data-testid="narrow">
      <CodeBlock code={samples.longLine.replace(/ --/g, "\n--")} language="bash" aria-label="Highlight" highlightLines={[2]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const [first, second] = linesOf(block) as [HTMLElement, HTMLElement];
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    // Scrolls sideways, and the band runs the full width of the scrolled content, not just the visible part.
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    await expect(Math.abs(rect(second).width - frame.scrollWidth)).toBeLessThan(1);
    await expect(getComputedStyle(second).backgroundColor).toBe(resolveColor("--dbm-bg-code-highlight"));
    await expect(getComputedStyle(second).backgroundColor).not.toBe(getComputedStyle(block.firstElementChild as Element).backgroundColor);
    await expect(getComputedStyle(first).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // The accent is in addition to colour: a 4px edge in the focus colour, transparent on the other lines.
    const accent = resolveLength("--dbm-border-width-4");
    await expect(px(getComputedStyle(second).borderInlineStartWidth)).toBe(accent);
    await expect(getComputedStyle(second).borderInlineStartColor).toBe(resolveColor("--dbm-border-focus"));
    await expect(getComputedStyle(first).borderInlineStartColor).toBe("rgba(0, 0, 0, 0)");
    // Highlighting changes no line's own text position.
    // Where the code starts: its first node, not the hidden cue a highlighted line begins with.
    const rangeOf = (line: HTMLElement) => {
      const start = [...line.childNodes].find((node) => !(node instanceof HTMLElement && node.className.includes("cue"))) as Node;
      const range = document.createRange();
      range.selectNodeContents(start);
      return range.getBoundingClientRect().left;
    };
    await expect(Math.abs(rangeOf(first) - rangeOf(second))).toBeLessThan(0.5);
  },
};

export const CollapseInteraction: Story = {
  name: "Interaction: a collapsed block is N lines tall, fades out, and its rest is clipped, not removed",
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" collapsible collapsedLines={5} aria-label="Collapsing" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("block");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(block);
    const lineHeight = px(getComputedStyle(lines[0]!).lineHeight);
    const padding = resolveLength("--dbm-space-4");
    // Exactly five lines, plus the top padding: the bottom edge falls right after line five, so no part of a
    // sixth shows.
    await expect(Math.abs(rect(frame).height - (5 * lineHeight + padding))).toBeLessThan(1.5);
    await expect(rect(lines[5]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 0.5);
    // The rest is in the page but clipped, and the frame can't be scrolled to it by keyboard: it is not a tab stop.
    await expect(lines).toHaveLength(20);
    await expect(rect(lines[19]!).top).toBeGreaterThanOrEqual(rect(frame).bottom);
    await expect(frame).not.toHaveAttribute("tabindex");
    // A fade sits over the bottom of the code and does not take pointer events.
    const fade = block.querySelector<HTMLElement>("[aria-hidden='true']:empty")!;
    await expect(getComputedStyle(fade).pointerEvents).toBe("none");
    await expect(Math.abs(rect(fade).bottom - rect(frame).bottom)).toBeLessThan(1);
    // Expanding shows everything.
    await userEvent.click(within(block).getByRole("button", { name: "Show 15 more lines" }));
    await expect(rect(frame).height).toBeGreaterThan(15 * lineHeight);
    await expect(block.querySelector("[aria-hidden='true']:empty")).toBeNull();
    await expect(Math.abs(rect(lines[19]!).bottom - (rect(frame).bottom - padding))).toBeLessThan(1.5);
  },
};

export const CollapseWrapInteraction: Story = {
  name: "Interaction: a wrapped, collapsed block shows N whole lines, however many rows they wrap to",
  render: () => (
    <div style={{ maxWidth: "22rem" }} data-testid="narrow">
      <CodeBlock code={Array.from({ length: 6 }, (_, index) => `${index + 1}: ${samples.longLine}`).join("\n")} language="text" wrap collapsible collapsedLines={2} aria-label="Wrapped and collapsed" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(block);
    const lineHeight = px(getComputedStyle(lines[0]!).lineHeight);
    // Each line wraps onto several rows, so two lines are far more than two rows tall.
    await expect(rect(lines[0]!).height).toBeGreaterThan(2 * lineHeight);
    // Two whole lines are shown: the second ends inside the frame, and the third starts at or below its edge.
    await expect(rect(lines[1]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    await expect(within(block).getByRole("button", { name: "Show 4 more lines" })).toBeInTheDocument();
    // Expanding shows them all, and collapsing again goes back to two.
    await userEvent.click(within(block).getByRole("button", { name: "Show 4 more lines" }));
    await expect(rect(lines[5]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await userEvent.click(within(block).getByRole("button", { name: "Show less" }));
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    // A different width wraps the lines differently, and the cut follows: still two whole lines, and shorter.
    // Re-measuring must not make the browser report a "ResizeObserver loop" error, which an app's error tracking
    // would log for every block that resizes.
    const errors: string[] = [];
    const onError = (event: ErrorEvent) => {
      errors.push(event.message);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    const before = rect(frame).height;
    block.style.maxWidth = "60rem";
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.removeEventListener("error", onError);
    await expect(errors.filter((message) => message.includes("ResizeObserver"))).toEqual([]);
    await expect(rect(frame).height).toBeLessThan(before);
    await expect(rect(lines[1]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
  },
};

// --- Things only the browser's own accessibility tree and forced-colours emulation can show, both through the
// Chrome DevTools Protocol the test browser already speaks.

type AccessibilityNodes = { nodes: Array<{ role?: { value: string }; name?: { value: string }; ignored?: boolean }> };

/** The text nodes a screen reader can reach on this page, from the browser's accessibility tree. */
async function readableText(): Promise<string[]> {
  await send("Accessibility.enable");
  await send("Page.enable");
  const { frameTree } = (await send("Page.getFrameTree")) as { frameTree: { frame: { id: string; url: string }; childFrames?: Array<{ frame: { id: string; url: string } }> } };
  const frames = [frameTree.frame, ...(frameTree.childFrames ?? []).map((child) => child.frame)];
  const frame = frames.find((candidate) => candidate.url === window.location.href) ?? frames[frames.length - 1]!;
  const tree = (await send("Accessibility.getFullAXTree", { frameId: frame.id })) as AccessibilityNodes;
  return tree.nodes.filter((node) => !node.ignored && node.role?.value === "StaticText" && node.name?.value).map((node) => node.name!.value);
}

export const ReadableTextInteraction: Story = {
  name: "Interaction: a screen reader reads the code and a highlight's cue, not the line numbers, and the cue is not selected",
  render: () => (
    <div data-testid="block">
      <CodeBlock code={"alpha\nbeta\ngamma\ndelta"} language="text" showLineNumbers highlightLines={[2, 3]} aria-label="Reading" copyable={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const heard = await readableText();
    // The code, and one cue for the two-line highlight, in front of its first line.
    for (const word of ["alpha", "beta", "gamma", "delta"]) await expect(heard).toContain(word);
    await expect(heard.filter((text) => text === "2 highlighted lines:")).toHaveLength(1);
    // The numbers are drawn, but decoration: none of them is in what a screen reader reaches.
    await expect(heard.filter((text) => /^\d+$/.test(text))).toEqual([]);
    await expect(getComputedStyle(linesOf(canvasElement)[0]!, "::before").content).toContain('"1"');
    // Selecting the code gives the code alone: neither the cue nor a number.
    const selection = window.getSelection() as Selection;
    selection.selectAllChildren(canvasElement.querySelector("code") as Node);
    await expect(selection.toString().split("\n").filter(Boolean)).toEqual(["alpha", "beta", "gamma", "delta"]);
    selection.removeAllRanges();
  },
};

export const ForcedColorsInteraction: Story = {
  name: "Interaction: in forced colours only a highlighted line has an edge accent, and the fade is gone",
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" highlightLines={[2]} collapsible collapsedLines={4} aria-label="Forced colours" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("figure") as HTMLElement;
    const lines = linesOf(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const canvas = getComputedStyle(root).backgroundColor;
      // A plain line's accent is the page's own colour, so it is invisible; without this every line shows a bar.
      for (const line of lines.filter((candidate) => candidate.dataset.highlighted !== "true")) {
        await expect(getComputedStyle(line).borderInlineStartColor).toBe(canvas);
      }
      // The highlighted line's is a system colour that shows, still 4px wide: the only cue left.
      const accent = getComputedStyle(lines[1]!);
      await expect(accent.borderInlineStartColor).not.toBe(canvas);
      await expect(px(accent.borderInlineStartWidth)).toBe(resolveLength("--dbm-border-width-4"));
      // The fade is a colour gradient with no meaning here.
      await expect(root.querySelector("[aria-hidden='true']:empty")).not.toBeNull();
      await expect(getComputedStyle(root.querySelector("[aria-hidden='true']:empty") as Element).display).toBe("none");
    } finally {
      await emulate("none");
    }
    // Back to normal colours, the accent is the token again.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(getComputedStyle(lines[1]!).borderInlineStartColor).toBe(resolveColor("--dbm-border-focus"));
  },
};

export const ScrollFocusInteraction: Story = {
  name: "Interaction: a long line makes the code a named tab stop; a short one does not",
  render: () => (
    <div style={stack}>
      <div data-testid="long" style={{ maxWidth: "20rem" }}>
        <CodeBlock code={samples.longLine} language="bash" title="request.sh" />
      </div>
      <div data-testid="short">
        <CodeBlock code="pnpm install" language="bash" title="install.sh" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const long = canvas.getByTestId("long");
    const region = within(long).getByRole("region", { name: "request.sh" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(region).overflowX).toBe("auto");
    // Real keyboard: the copy button is first, then the scrolling code.
    await userEvent.tab();
    await expect(within(long).getByRole("button", { name: "Copy code" })).toHaveFocus();
    await userEvent.tab();
    await expect(region).toHaveFocus();
    // Its focus ring is drawn inside the block (a negative offset), so the block's clipped edge cannot cut it.
    await expect(px(getComputedStyle(region).outlineOffset)).toBeLessThan(0);
    await expect(px(getComputedStyle(region).outlineWidth)).toBe(resolveLength("--dbm-border-width-2"));
    // The short block's code isn't reachable: nothing to scroll.
    await expect(within(canvas.getByTestId("short")).queryByRole("region")).toBeNull();
    // Scrolling it moves the text (the frame is the scroll container, not the page).
    region.scrollLeft = 40;
    await expect(region.scrollLeft).toBeGreaterThan(0);
  },
};

export const DirectionInteraction: Story = {
  name: "Interaction: code stays left to right in a right-to-left page, and the header mirrors",
  render: () => (
    <div dir="rtl" data-testid="rtl">
      <CodeBlock code={samples.ts} language="ts" title="مثال.ts" showLineNumbers aria-label="rtl" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("rtl");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    await expect(getComputedStyle(frame).direction).toBe("ltr");
    const first = linesOf(block)[0] as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(first);
    // The code's first character is at the left of the block, the number before it.
    await expect(range.getBoundingClientRect().left - rect(frame).left).toBeLessThan(rect(frame).width / 2);
    // The header: the title at the right, the copy button at the left.
    const title = within(block).getByText("مثال.ts");
    const button = within(block).getByRole("button", { name: "Copy code" });
    await expect(rect(button).left).toBeLessThan(rect(title).left);
    // The header's start padding is on the right, and its end padding on the left: mirrored, not fixed to a side.
    const root = block.firstElementChild as HTMLElement;
    const border = resolveLength("--dbm-border-width-1");
    await expect(Math.abs(rect(root).right - rect(title).right - (border + resolveLength("--dbm-space-4")))).toBeLessThan(1);
    await expect(Math.abs(rect(button).left - rect(root).left - (border + resolveLength("--dbm-space-2")))).toBeLessThan(4);
  },
};

export const HeaderInteraction: Story = {
  name: "Interaction: a long title is cut short with an ellipsis and never pushes the copy button out",
  render: () => (
    <div style={{ maxWidth: "16rem" }} data-testid="narrow">
      <CodeBlock code="a" language="ts" title="a-very-long-file-name-that-does-not-fit-in-the-header.component.stories.tsx" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const root = block.firstElementChild as HTMLElement;
    const title = block.querySelector("figcaption span span") as HTMLElement;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");
    const button = within(block).getByRole("button", { name: "Copy code" });
    await expect(rect(button).right).toBeLessThanOrEqual(rect(root).right);
    await expect(rect(button).left).toBeGreaterThanOrEqual(rect(title).right - 1);
  },
};

export const TargetSizeInteraction: Story = {
  name: "Interaction: the copy and expand buttons are at least 24 by 24px",
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" collapsible aria-label="Targets" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("block");
    for (const button of within(block).getAllByRole("button")) {
      await expect(rect(button).width).toBeGreaterThanOrEqual(24);
      await expect(rect(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const PhoneInteraction: Story = {
  name: "Interaction: on a phone the block stays inside the page and scrolls its own code",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="block">
      <CodeBlock code={samples.longLine} language="bash" title="request.sh" showLineNumbers />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport global didn't apply, rather than passing for the wrong reason.
    await expect(window.innerWidth).toBeLessThan(640);
    const block = within(canvasElement).getByTestId("block");
    const root = block.firstElementChild as HTMLElement;
    await expect(rect(root).right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const region = within(block).getByRole("region", { name: "request.sh" });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
  },
};

export const LateRegistrationInteraction: Story = {
  name: "Interaction: a language registered after the block is drawn colours it in the real browser, and undoing it draws plain again",
  render: () => (
    <div data-testid="late">
      <CodeBlock code="alpha beta" language="late-demo" aria-label="Registered later" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("late");
    const coloured = () => block.querySelectorAll<HTMLElement>("span[data-line] > span");
    // Nobody has taught this language yet: the line holds its text directly.
    await expect(coloured()).toHaveLength(0);
    const unregister = registerCodeLanguage({ name: "late-demo", tokenize: (code) => code.split("\n").map((text) => [{ type: "keyword" as const, text }]) });
    try {
      await waitFor(() => expect(coloured()).toHaveLength(1));
      await expect(getComputedStyle(coloured()[0]!).color).toBe(resolveColor("--dbm-text-syntax-keyword"));
      await expect(block.querySelector("code")!.textContent).toBe("alpha beta");
    } finally {
      unregister();
    }
    await waitFor(() => expect(coloured()).toHaveLength(0));
    await expect(block.querySelector("code")!.textContent).toBe("alpha beta");
  },
};

export const SizeInteraction: Story = {
  name: "Interaction: each size sets the code's font size and the space around it, and keeps its buttons 24 by 24px",
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-testid={`size-${size}`}>
          <CodeBlock code={samples.ts} language="ts" size={size} wrapToggle aria-label={size} />
        </div>
      ))}
      <div style={{ maxWidth: "24rem" }} data-testid="wrapped-xl">
        <CodeBlock code={`short\n${samples.longLine}`} language="text" size="xl" showLineNumbers wrap aria-label="Wrapped, xl" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fontToken = { xs: "xs", sm: "xs", md: "sm", lg: "base", xl: "md" } as const;
    const spaceToken = { xs: "2", sm: "3", md: "4", lg: "5", xl: "6" } as const;
    let previousHeight = 0;
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const block = within(canvasElement).getByTestId(`size-${size}`);
      const root = block.firstElementChild as HTMLElement;
      const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
      // The code's font size and its padding, from the tokens: md is what the block has always been.
      await expect(Math.abs(px(getComputedStyle(frame).fontSize) - resolveLength(`--dbm-font-size-${fontToken[size]}`))).toBeLessThan(0.1);
      const pre = block.querySelector("pre") as HTMLElement;
      await expect(px(getComputedStyle(pre).paddingTop)).toBeCloseTo(resolveLength(`--dbm-space-${spaceToken[size]}`), 0);
      await expect(px(getComputedStyle(pre).paddingBottom)).toBeCloseTo(resolveLength(`--dbm-space-${spaceToken[size]}`), 0);
      const line = linesOf(block)[0] as HTMLElement;
      await expect(px(getComputedStyle(line).paddingRight)).toBeCloseTo(resolveLength(`--dbm-space-${size === "xs" || size === "sm" ? "3" : spaceToken[size]}`), 0);
      // The same code takes more room at each step.
      await expect(rect(root).height).toBeGreaterThan(previousHeight);
      previousHeight = rect(root).height;
      // Every button is a real target, at every size.
      for (const button of within(block).getAllByRole("button")) {
        await expect(rect(button).width).toBeGreaterThanOrEqual(24);
        await expect(rect(button).height).toBeGreaterThanOrEqual(24);
      }
    }
    await expect(px(getComputedStyle(within(canvasElement).getByTestId("size-md").querySelector("pre")!.parentElement as HTMLElement).fontSize)).toBeCloseTo(resolveLength("--dbm-font-size-sm"), 1);
    // A wrapped, numbered line still continues under its own text when the space around the code is larger: the
    // continuation starts where the text does, past the number, two of the (xl) spaces in from the line.
    const wrapped = within(canvasElement).getByTestId("wrapped-xl");
    const long = linesOf(wrapped)[1] as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(long);
    const rowStarts = new Map<number, number>();
    for (const box of range.getClientRects()) {
      if (box.width === 0) continue;
      const row = Math.round(box.top);
      rowStarts.set(row, Math.min(rowStarts.get(row) ?? Number.POSITIVE_INFINITY, box.left));
    }
    await expect(rowStarts.size).toBeGreaterThan(2);
    const firstX = [...rowStarts.values()][0] as number;
    for (const start of rowStarts.values()) await expect(Math.abs(start - firstX)).toBeLessThan(0.5);
    const gutter = px(getComputedStyle(long, "::before").width);
    await expect(Math.abs(firstX - (rect(long).left + 2 * resolveLength("--dbm-space-6") + gutter))).toBeLessThan(1);
  },
};

export const WrapToggleInteraction: Story = {
  name: "Interaction: the wrap button wraps the code, and a collapsed block still shows whole lines either way",
  render: () => (
    <div style={{ maxWidth: "22rem" }} data-testid="narrow">
      <CodeBlock
        code={Array.from({ length: 6 }, (_, index) => `${index + 1}: ${samples.longLine}`).join("\n")}
        language="text"
        wrapToggle
        collapsible
        collapsedLines={2}
        aria-label="Wrap toggle"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(block);
    const lineHeight = px(getComputedStyle(lines[0]!).lineHeight);
    const toggle = within(block).getByRole("button", { name: "Wrap lines" });
    const wholeLines = async () => {
      await expect(rect(lines[1]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
      await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    };
    // Not wrapped: each line is one row, and the frame holds two of them.
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(rect(lines[0]!).height).toBeLessThan(1.5 * lineHeight);
    await wholeLines();
    const unwrappedFrame = rect(frame).height;
    // Wrapped: each line takes many rows, the frame grows to hold two whole ones, and the button's count is unchanged.
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(rect(lines[0]!).height).toBeGreaterThan(2 * lineHeight));
    await waitFor(() => expect(rect(frame).height).toBeGreaterThan(unwrappedFrame));
    await wholeLines();
    await expect(within(block).getByRole("button", { name: "Show 4 more lines" })).toBeInTheDocument();
    // And back: the cut follows.
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(rect(frame).height).toBeCloseTo(unwrappedFrame, 0));
    await wholeLines();
    // Expanded, wrapping still switches, with everything showing.
    await userEvent.click(within(block).getByRole("button", { name: "Show 4 more lines" }));
    await userEvent.click(toggle);
    await waitFor(() => expect(rect(lines[5]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1));
  },
};

export const HeaderlessInteraction: Story = {
  name: "Interaction: with no header the buttons sit in the corner of the code, never over it, and it still collapses to whole lines",
  render: () => (
    <div style={stack}>
      <div data-testid="plain">
        <CodeBlock code={samples.ts} language="ts" title="total.ts" showHeader={false} wrapToggle aria-label="No header" />
      </div>
      <div dir="rtl" data-testid="rtl">
        <CodeBlock code={samples.ts} language="ts" showHeader={false} aria-label="No header, rtl" />
      </div>
      <div data-testid="collapsed">
        <CodeBlock code={Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" showHeader={false} collapsible collapsedLines={3} aria-label="No header, collapsed" />
      </div>
      <div data-testid="bare">
        <CodeBlock code={samples.ts} language="ts" showHeader={false} copyable={false} aria-label="Nothing but the code" />
      </div>
      <div data-testid="one-line">
        <CodeBlock code={samples.ts} language="ts" showHeader={false} collapsible collapsedLines={1} aria-label="No header, one line" />
      </div>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-testid={`sized-${size}`}>
          <CodeBlock code={samples.ts} language="ts" size={size} showHeader={false} wrapToggle aria-label={`No header, ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const border = resolveLength("--dbm-border-width-1");
    const inset = resolveLength("--dbm-space-1");
    const cornerOf = (block: HTMLElement) => within(block).getAllByRole("button")[0]!.parentElement as HTMLElement;
    // No strip: no caption, no title, no language label.
    const plain = within(canvasElement).getByTestId("plain");
    await expect(plain.querySelector("figcaption")).toBeNull();
    await expect(within(plain).queryByText("total.ts")).toBeNull();
    await expect(within(plain).queryByText("ts")).toBeNull();
    // The buttons are in the top corner at the end of the block, inside it, and the first line starts below them.
    const root = plain.firstElementChild as HTMLElement;
    const corner = cornerOf(plain);
    await expect(Math.abs(rect(corner).right - (rect(root).right - border - inset))).toBeLessThan(1);
    await expect(Math.abs(rect(corner).top - (rect(root).top + border + inset))).toBeLessThan(1);
    const first = linesOf(plain)[0] as HTMLElement;
    const firstText = document.createRange();
    firstText.selectNodeContents(first);
    await expect(firstText.getBoundingClientRect().top).toBeGreaterThanOrEqual(rect(corner).bottom - 1);
    for (const button of within(plain).getAllByRole("button")) {
      await expect(rect(button).width).toBeGreaterThanOrEqual(24);
      await expect(rect(button).height).toBeGreaterThanOrEqual(24);
    }
    // A block collapsed to one line is short enough for the fade to reach the buttons: the buttons are a layer above it
    // (the fade is drawn later, so without a layer of their own it would paint over them).
    const oneLine = within(canvasElement).getByTestId("one-line");
    const fade = oneLine.querySelector<HTMLElement>("[aria-hidden='true']:not(svg)") as HTMLElement;
    await expect(rect(cornerOf(oneLine)).bottom).toBeGreaterThan(rect(fade).top);
    await expect(getComputedStyle(cornerOf(oneLine)).zIndex).toBe("1");
    await expect(getComputedStyle(fade).zIndex).toBe("auto");
    // The buttons never cover the first line at any size, whatever height their step gives them.
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const sized = within(canvasElement).getByTestId(`sized-${size}`);
      const text = document.createRange();
      text.selectNodeContents(linesOf(sized)[0] as HTMLElement);
      await expect(text.getBoundingClientRect().top).toBeGreaterThanOrEqual(rect(cornerOf(sized)).bottom - 1);
    }
    // A right-to-left page: the buttons are at the left, the code still left to right.
    const rtl = within(canvasElement).getByTestId("rtl");
    const rtlRoot = rtl.firstElementChild as HTMLElement;
    await expect(Math.abs(rect(cornerOf(rtl)).left - (rect(rtlRoot).left + border + inset))).toBeLessThan(1);
    await expect(getComputedStyle(rtl.querySelector("pre")!.parentElement as HTMLElement).direction).toBe("ltr");
    // Collapsed: exactly three whole lines below the buttons' room, and the fourth starts at the frame's edge.
    const collapsed = within(canvasElement).getByTestId("collapsed");
    const frame = collapsed.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(collapsed);
    await expect(rect(lines[2]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await expect(rect(lines[3]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    await expect(rect(lines[2]!).bottom).toBeGreaterThan(rect(frame).bottom - px(getComputedStyle(lines[0]!).lineHeight));
    // With no buttons either, no room is kept for them: the code starts where it does in a block with a header of nothing.
    const bare = within(canvasElement).getByTestId("bare");
    await expect(bare.querySelector("button")).toBeNull();
    await expect(px(getComputedStyle(bare.querySelector("pre") as HTMLElement).paddingTop)).toBeCloseTo(resolveLength("--dbm-space-4"), 0);
    await expect(px(getComputedStyle(plain.querySelector("pre") as HTMLElement).paddingTop)).toBeGreaterThan(resolveLength("--dbm-space-4"));
  },
};

export const HeaderlessPhoneInteraction: Story = {
  name: "Interaction: on a phone a block with no header keeps its buttons inside it",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="block">
      <CodeBlock code={samples.longLine} language="bash" showHeader={false} wrapToggle showLineNumbers aria-label="Phone" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(640);
    const block = within(canvasElement).getByTestId("block");
    const root = block.firstElementChild as HTMLElement;
    for (const button of within(block).getAllByRole("button")) {
      await expect(rect(button).right).toBeLessThanOrEqual(rect(root).right);
      await expect(rect(button).left).toBeGreaterThanOrEqual(rect(root).left);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const DocsPageInteraction: Story = {
  name: "Interaction: on a Docs page (inside .sbdocs-content) the code is not restyled as inline code",
  // The Docs page's stylesheet styles every `code` inside `.sbdocs-content` as an inline pill, and its `!important`
  // declarations beat a plain reset: a standalone story has no such ancestor, so only this wrapper can see it.
  render: () => (
    <div className="sbdocs-content" data-testid="docs">
      <CodeBlock code={"function f() {\n  return 1;\n}"} language="ts" size="lg" showLineNumbers aria-label="On a Docs page" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("docs");
    const code = block.querySelector("code") as HTMLElement;
    const frame = code.closest("pre")!.parentElement as HTMLElement;
    const style = getComputedStyle(code);
    // No pill: no border, no background of its own, no padding of its own.
    await expect(style.borderTopWidth).toBe("0px");
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(style.paddingLeft).toBe("0px");
    await expect(style.borderRadius).toBe("0px");
    // Indentation is kept, the size is the block's own, and plain text is the block's own colour and weight.
    await expect(style.whiteSpace).toBe("pre");
    await expect(style.fontSize).toBe(getComputedStyle(frame).fontSize);
    await expect(style.color).toBe(getComputedStyle(frame).color);
    await expect(style.fontWeight).toBe(getComputedStyle(frame).fontWeight);
    // The second line's `return` starts further in than the first line's `function`, by its two spaces of indentation.
    const keywords = [...block.querySelectorAll<HTMLElement>("code span[data-line] > span")].filter((token) => ["function", "return"].includes(token.textContent ?? ""));
    await expect(keywords.map((token) => token.textContent)).toEqual(["function", "return"]);
    await expect(rect(keywords[1]!).left).toBeGreaterThan(rect(keywords[0]!).left + 4);
  },
};

export const DiffNumbersInteraction: Story = {
  name: "Interaction: a diff's old and new columns are aligned, decoration only, and a wrapped line continues under its text",
  render: () => (
    <div style={stack}>
      <div data-testid="diff">
        <CodeBlock code={samples.diffWithHunks} language="diff" showLineNumbers aria-label="Diff" copyable={false} />
      </div>
      <div style={{ maxWidth: "24rem" }} data-testid="wrapped">
        <CodeBlock code={`@@ -9,3 +9,4 @@\n short\n-old\n+new\n+${samples.longLine}`} language="diff" showLineNumbers wrap aria-label="Wrapped diff" copyable={false} />
      </div>
      <div data-testid="handwritten">
        <CodeBlock code={"- const size = 'md';\n+ const size = 'lg';"} language="diff" showLineNumbers aria-label="Hand-written diff" copyable={false} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const diff = within(canvasElement).getByTestId("diff");
    const rows = linesOf(diff);
    // Each row's gutter holds its numbers, an old column and a new one, or blank columns where it has none.
    const gutterText = (row: HTMLElement) => getComputedStyle(row, "::before").content;
    await expect(gutterText(rows[3]!)).toContain('"      "');
    await expect(gutterText(rows[4]!)).toContain('" 8   8"');
    await expect(gutterText(rows[5]!)).toContain('" 9    "');
    await expect(gutterText(rows[6]!)).toContain('"     9"');
    await expect(gutterText(rows[8]!)).toContain('"10  11"');
    // The two columns are one string padded with spaces, which only line up if the spaces are kept.
    await expect(getComputedStyle(rows[4]!, "::before").whiteSpace).toBe("pre");
    // The gutter is six characters wide on every row, numbered or not, so the code stays aligned.
    const frame = diff.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;width:6ch;font:inherit";
    frame.appendChild(probe);
    const sixChars = rect(probe).width;
    probe.remove();
    for (const row of rows) await expect(Math.abs(px(getComputedStyle(row, "::before").width) - sixChars)).toBeLessThan(0.5);
    const starts = rows.map((row) => {
      const range = document.createRange();
      range.selectNodeContents(row);
      return range.getBoundingClientRect().left;
    });
    for (const start of starts) await expect(Math.abs(start - (starts[0] as number))).toBeLessThan(0.5);
    // A reader hears the code, not the numbers, and selecting it gives the code alone.
    const heard = await readableText();
    await expect(heard.filter((text) => /^[\d\s]+$/.test(text))).toEqual([]);
    await expect(getComputedStyle(rows[0]!, "::before").userSelect).toBe("none");
    const selection = window.getSelection() as Selection;
    selection.selectAllChildren(diff.querySelector("code") as Node);
    await expect(selection.toString().split("\n")).toEqual(samples.diffWithHunks.split("\n"));
    selection.removeAllRanges();
    // A wrapped row continues under its own text, past both columns.
    const wrapped = within(canvasElement).getByTestId("wrapped");
    const wrappedRows = linesOf(wrapped);
    const long = wrappedRows[4] as HTMLElement;
    // Only the long row takes more than one row: a short one with a two-digit number in the new column alone must not
    // fold its gutter onto a second line (a padded gutter that wrapped doubled that row's height).
    const rowHeight = px(getComputedStyle(wrappedRows[0]!).lineHeight);
    for (const row of wrappedRows.slice(0, 4)) await expect(rect(row).height).toBeLessThan(1.5 * rowHeight);
    await expect(rect(long).height).toBeGreaterThan(2 * rowHeight);
    const range = document.createRange();
    range.selectNodeContents(long);
    const rowStarts = new Map<number, number>();
    for (const box of range.getClientRects()) {
      if (box.width === 0) continue;
      const row = Math.round(box.top);
      rowStarts.set(row, Math.min(rowStarts.get(row) ?? Number.POSITIVE_INFINITY, box.left));
    }
    await expect(rowStarts.size).toBeGreaterThan(2);
    const firstX = [...rowStarts.values()][0] as number;
    for (const start of rowStarts.values()) await expect(Math.abs(start - firstX)).toBeLessThan(0.5);
    const gutter = px(getComputedStyle(long, "::before").width);
    await expect(Math.abs(firstX - (rect(long).left + 2 * resolveLength("--dbm-space-4") + gutter))).toBeLessThan(1);
    // A diff with no hunk header has no gutter at all.
    for (const row of linesOf(within(canvasElement).getByTestId("handwritten"))) await expect(["none", "normal"]).toContain(getComputedStyle(row, "::before").content);
  },
};

export const LanguageLabelInteraction: Story = {
  name: "Interaction: a known language is named as its owners write it, an unknown one is set in capitals as written",
  render: () => (
    <div style={stack}>
      {(["ts", "tsx", "csharp", "cpp", "cobol"] as const).map((language) => (
        <div key={language} data-testid={language}>
          <CodeBlock code="a" language={language} aria-label={language} copyable={false} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const labelOf = (testId: string) => canvasElement.querySelector(`[data-testid="${testId}"] figcaption span span`) as HTMLElement;
    // Named: the name as it is written, in its own case (a capitalised style would turn "TypeScript" into "TYPESCRIPT").
    for (const [testId, name] of [["ts", "TypeScript"], ["tsx", "TSX"], ["csharp", "C#"], ["cpp", "C++"]] as const) {
      await expect(labelOf(testId).textContent).toBe(name);
      await expect(getComputedStyle(labelOf(testId)).textTransform).toBe("none");
    }
    // Not known: what was written, set in capitals as a code, which is how every language label used to look.
    await expect(labelOf("cobol").textContent).toBe("cobol");
    await expect(getComputedStyle(labelOf("cobol")).textTransform).toBe("uppercase");
  },
};

export const PrintInteraction: Story = {
  name: "Interaction: printed, a block is whole and legible in any theme: nothing clipped, no buttons, black on white with emphasis",
  render: () => (
    <div style={stack}>
      <div data-testid="collapsed">
        <CodeBlock code={Array.from({ length: 12 }, (_, index) => `const line${index + 1} = ${index + 1}; // note`).join("\n")} language="ts" showLineNumbers highlightLines={[2]} collapsible collapsedLines={4} wrapToggle title="a.ts" aria-label="Collapsed" />
      </div>
      <div data-testid="tall">
        <CodeBlock code={Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" maxHeight="4rem" aria-label="Tall" />
      </div>
      <div style={{ maxWidth: "20rem" }} data-testid="long">
        <CodeBlock code={samples.longLine} language="bash" showLineNumbers aria-label="Long line" />
      </div>
      <div data-testid="floating">
        <CodeBlock code="export const a = 1;" language="ts" showHeader={false} wrapToggle aria-label="No header" />
      </div>
      <div data-testid="buttons-only">
        <CodeBlock code="export const a = 1;" language="ts" showLanguage={false} aria-label="Buttons only" />
      </div>
      <div data-testid="diff">
        <CodeBlock code={"@@ -9,2 +9,3 @@\n a\n-b\n+c\n+d"} language="diff" showLineNumbers aria-label="Diff" copyable={false} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const emulate = (media: "print" | "") => send("Emulation.setEmulatedMedia", { media });
    const colour = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    const block = (testId: string) => within(canvasElement).getByTestId(testId);
    // Drawn at all: an element inside a hidden parent keeps its own `display`, but has no box.
    const visible = (element: Element) => element.getClientRects().length > 0;
    // A dark theme on screen: its syntax colours are pale, which is what would print as faint text on white paper.
    const theme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = "purple-dark";
    await emulate("print");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("print").matches).toBe(true);
      const black = colour("CanvasText");
      const white = colour("Canvas");
      // Black on white, in every token, whatever the screen theme; keywords and added lines heavier.
      const collapsed = block("collapsed");
      const root = collapsed.firstElementChild as HTMLElement;
      await expect(getComputedStyle(root).backgroundColor).toBe(white);
      await expect(getComputedStyle(root).color).toBe(black);
      for (const token of collapsed.querySelectorAll<HTMLElement>("code span[data-line] > span")) await expect(getComputedStyle(token).color).toBe(black);
      const keyword = [...collapsed.querySelectorAll<HTMLElement>("code span[data-line] > span")].find((token) => token.textContent === "const") as HTMLElement;
      await expect(Number(getComputedStyle(keyword).fontWeight)).toBeGreaterThanOrEqual(600);
      const comment = [...collapsed.querySelectorAll<HTMLElement>("code span[data-line] > span")].find((token) => token.textContent?.startsWith("// note")) as HTMLElement;
      await expect(getComputedStyle(comment).fontStyle).toBe("italic");
      // In a diff the added line is heavier and the removed one is not, so they differ without colour.
      const added = diffLine(block("diff"), 4).firstElementChild as HTMLElement;
      const removed = diffLine(block("diff"), 3).firstElementChild as HTMLElement;
      // And nothing wraps that should not: every row of the printed diff, a padded two-digit gutter included, is one row.
      const diffRows = linesOf(block("diff"));
      for (const row of diffRows) await expect(rect(row).height).toBeLessThan(1.5 * px(getComputedStyle(row).lineHeight));
      await expect(Number(getComputedStyle(added).fontWeight)).toBeGreaterThanOrEqual(600);
      await expect(Number(getComputedStyle(removed).fontWeight)).toBeLessThan(600);
      // Not clipped: a collapsed block prints all twelve lines, its buttons and fade are gone, and a highlight is a solid edge.
      const frame = collapsed.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
      const lines = linesOf(collapsed);
      await expect(getComputedStyle(frame).maxHeight).toBe("none");
      // Not a scroll frame on paper, either way.
      await expect(getComputedStyle(frame).overflowY).toBe("visible");
      await expect(getComputedStyle(frame).overflowX).toBe("visible");
      await expect(rect(lines[11]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
      await expect(frame.scrollHeight).toBeLessThanOrEqual(frame.clientHeight + 1);
      for (const button of collapsed.querySelectorAll("button")) await expect(visible(button)).toBe(false);
      await expect(visible(collapsed.querySelector("[aria-hidden='true']:empty") as Element)).toBe(false);
      const highlighted = getComputedStyle(lines[1]!);
      await expect(highlighted.borderInlineStartColor).toBe(black);
      await expect(highlighted.borderInlineStartStyle).toBe("solid");
      await expect(px(highlighted.borderInlineStartWidth)).toBe(resolveLength("--dbm-border-width-4"));
      await expect(highlighted.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      await expect(getComputedStyle(lines[0]!, "::before").color).toBe(colour("GrayText"));
      // A `maxHeight` block prints in full too.
      const tall = block("tall");
      const tallFrame = tall.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
      await expect(rect(tallFrame).height).toBeGreaterThan(resolveLength("--dbm-space-8") * 2);
      await expect(tallFrame.scrollHeight).toBeLessThanOrEqual(tallFrame.clientHeight + 1);
      await expect(getComputedStyle(tallFrame).overflowY).toBe("visible");
      // A long line wraps within the page instead of running off the edge of its scroll frame, under its own text.
      const long = block("long");
      const longFrame = long.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
      await expect(longFrame.scrollWidth).toBeLessThanOrEqual(longFrame.clientWidth + 1);
      await expect(rect(linesOf(long)[0]!).height).toBeGreaterThan(2 * px(getComputedStyle(linesOf(long)[0]!).lineHeight));
      // No room is kept for corner buttons that are not printed; a header that would hold only buttons is not drawn.
      const floating = block("floating");
      await expect(px(getComputedStyle(floating.querySelector("pre") as HTMLElement).paddingTop)).toBeCloseTo(resolveLength("--dbm-space-4"), 0);
      for (const button of floating.querySelectorAll("button")) await expect(visible(button)).toBe(false);
      await expect(visible(block("buttons-only").querySelector("figcaption") as Element)).toBe(false);
    } finally {
      await emulate("");
      if (theme) document.documentElement.dataset.theme = theme;
    }
    // Back on screen: the buttons and the token colours return.
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(window.matchMedia("print").matches).toBe(false);
    await expect(visible(block("collapsed").querySelector("button") as Element)).toBe(true);
    await expect(getComputedStyle(block("collapsed").querySelector("code span[data-line] > span") as Element).color).not.toBe("rgb(0, 0, 0)");
  },
};

/** One row of a block, by its position. */
function diffLine(block: HTMLElement, number: number): HTMLElement {
  return block.querySelector<HTMLElement>(`span[data-line="${number}"]`) as HTMLElement;
}


