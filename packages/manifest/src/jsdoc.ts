import type { ManifestExample } from "./types";

/** Joins the lines of a JSDoc paragraph into one line of text. */
const oneLine = (text: string): string => text.replace(/\s*\n\s*/g, " ").trim();

/**
 * Splits a JSDoc description into its summary (the first paragraph) and the rest. Paragraphs are separated by a blank line; the
 * lines inside one are joined with a space.
 */
export function splitDescription(text: string): { summary: string; description?: string } {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const [first, ...rest] = paragraphs;
  const summary = oneLine(first ?? "");
  return rest.length > 0 ? { summary, description: rest.join("\n\n") } : { summary };
}

/** One line of a prop's description. */
export const describeProp = (text: string | undefined): string => oneLine(text ?? "");

/**
 * The code in an `@example` tag. A tag written with fenced blocks gives one example per block; a tag written as bare code gives one.
 */
export function parseExamples(tagText: string): ManifestExample[] {
  const fenced = [...tagText.matchAll(/```[A-Za-z]*\n([\s\S]*?)```/g)];
  const blocks = fenced.length > 0 ? fenced.map((match) => match[1] ?? "") : [tagText];
  return blocks.map((code) => code.replace(/\s+$/, "").replace(/^\n+/, "")).filter((code) => code.trim() !== "").map((code) => ({ code }));
}

/** `"primary"` or `'primary'` as `primary`; anything else as it is written. */
export function unquote(value: string): string {
  const match = /^(["'])(.*)\1$/.exec(value.trim());
  return match ? (match[2] ?? "") : value.trim();
}
