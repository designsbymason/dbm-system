import { fold, queryWords } from "../../internal/optionList/optionList.match";
import type { ListOption } from "../../internal/optionList/optionList.types";

/**
 * The `keywords` that made a command match, for the words of the search the label does not hold: a row found through a
 * word it never shows ("preferences" for "Open settings") says which, so the match is not a mystery. A keyword in
 * `ignore` (a parent command's label, which is already the row's heading) is never offered.
 */
export function keywordHints(command: Pick<ListOption, "label" | "textValue" | "keywords">, query: string, ignore?: string): string[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const label = fold(command.textValue ?? command.label);
  const found: string[] = [];
  for (const word of words) {
    if (label.includes(word)) continue;
    const keyword = (command.keywords ?? []).find((candidate) => candidate !== ignore && fold(candidate).includes(word));
    if (keyword !== undefined && !found.includes(keyword)) found.push(keyword);
  }
  return found;
}
