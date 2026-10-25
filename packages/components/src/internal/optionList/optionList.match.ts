import type { ListOption } from "./optionList.types";

/** Lower-cases and drops accents, writing each character on its own so positions map back to the original text. */
export function foldCharacters(text: string): { folded: string; origin: number[] } {
  let folded = "";
  const origin: number[] = [];
  let position = 0;
  for (const character of text) {
    const piece = character.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (let offset = 0; offset < piece.length; offset += 1) origin.push(position);
    folded += piece;
    position += character.length;
  }
  origin.push(position);
  return { folded, origin };
}

export const fold = (text: string): string => foldCharacters(text).folded;

/** The words of the typed text, folded: a label matches when it holds every one of them, in any order. */
export const queryWords = (text: string): string[] => fold(text.trim()).split(/\s+/).filter(Boolean);

export function defaultFilter(option: ListOption, text: string): boolean {
  const words = queryWords(text);
  if (words.length === 0) return true;
  const haystack = fold([option.textValue ?? option.label, ...(option.keywords ?? [])].join(" "));
  return words.every((word) => haystack.includes(word));
}

/**
 * Every stretch of `label` that a word of the typed text matches, ignoring case and accents, as `[from, to]` pairs in
 * order. Stretches that touch or overlap are joined, so "new york" marks "New York" as one.
 */
export function findMatches(label: string, text: string): Array<[number, number]> {
  const words = queryWords(text);
  if (words.length === 0) return [];
  const { folded, origin } = foldCharacters(label);
  const found: Array<[number, number]> = [];
  for (const word of words) {
    for (let at = folded.indexOf(word); at !== -1; at = folded.indexOf(word, at + word.length)) {
      const from = origin[at];
      const to = origin[at + word.length];
      if (from !== undefined && to !== undefined) found.push([from, to]);
    }
  }
  found.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of found) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}
