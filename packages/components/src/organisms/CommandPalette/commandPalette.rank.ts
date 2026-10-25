import { fold, queryWords } from "../../internal/optionList/optionList.match";
import type { ListOption } from "../../internal/optionList/optionList.types";

/** The parts of a command the ranking reads. */
type Rankable = Pick<ListOption, "label" | "textValue" | "keywords" | "group">;

const isWordCharacter = (character: string | undefined): boolean => character !== undefined && /[\p{L}\p{N}]/u.test(character);

/**
 * How well a command matches the words of the search, or `0` when it does not match at all. Every word must be found
 * in the label (or `textValue`) or in the `keywords`; the score is the sum over the words of the best place each is
 * found: at the start of the label (4), at the start of a word inside it (3), anywhere in it (2), or only in the
 * keywords (1).
 */
export function scoreCommand(command: Rankable, words: string[]): number {
  if (words.length === 0) return 1;
  const label = fold(command.textValue ?? command.label);
  const keywords = fold((command.keywords ?? []).join(" "));
  let total = 0;
  for (const word of words) {
    const at = label.indexOf(word);
    let best = 0;
    if (at === 0) best = 4;
    else if (at > 0) {
      // The first place a word is found may be inside another word; look for the first one that starts a word.
      let start = label.indexOf(word);
      while (start !== -1 && isWordCharacter(label[start - 1])) start = label.indexOf(word, start + 1);
      best = start !== -1 ? 3 : 2;
    } else if (keywords.includes(word)) best = 1;
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/**
 * The commands that match `query`, best first within each group. Groups keep the order they first appear in `commands`
 * (so a heading never moves while someone types), and commands with equal scores keep the order they were given. With
 * no words in `query` every command is returned as given.
 */
export function rankCommands<T extends Rankable>(commands: T[], query: string): T[] {
  const words = queryWords(query);
  if (words.length === 0) return commands;
  const groups = new Map<string | undefined, Array<{ command: T; score: number; index: number }>>();
  commands.forEach((command, index) => {
    const members = groups.get(command.group) ?? [];
    groups.set(command.group, members);
    const score = scoreCommand(command, words);
    if (score > 0) members.push({ command, score, index });
  });
  const ranked: T[] = [];
  for (const members of groups.values()) {
    members.sort((a, b) => b.score - a.score || a.index - b.index);
    for (const member of members) ranked.push(member.command);
  }
  return ranked;
}
