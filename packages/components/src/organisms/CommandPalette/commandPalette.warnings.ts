import type { CommandItem, CommandPaletteMode } from "./CommandPalette.types";

const duplicatesIn = (commands: CommandItem[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const command of commands) {
    if (seen.has(command.value)) repeated.add(command.value);
    seen.add(command.value);
  }
  return [...repeated];
};

/**
 * What is wrong with the commands, as messages for a development warning: a value used twice within one list (the
 * top level, a command's `items` or a mode's commands), where only one of them can be listed and rows share a key.
 */
export function valueWarnings(commands: CommandItem[], modes: CommandPaletteMode[] | undefined): string[] {
  const out: string[] = [];
  const check = (list: CommandItem[], where: string) => {
    for (const value of duplicatesIn(list)) {
      out.push(`CommandPalette: more than one command has the value "${value}"${where}. A value must be unique within a list: only one of them is listed, and the rows would share a key.`);
    }
    for (const command of list) if (command.items) check(command.items, ` in the \`items\` of "${command.label}"`);
  };
  check(commands, "");
  for (const mode of modes ?? []) check(mode.commands, ` in the commands of the "${mode.prefix}" mode`);
  return out;
}

/**
 * What is wrong with the modes, as messages for a development warning: a prefix that is empty, holds a space, repeats
 * another's, or starts with an earlier one's (which would always win, so it could never be reached).
 */
export function modeWarnings(modes: CommandPaletteMode[] | undefined): string[] {
  const out: string[] = [];
  const earlier: string[] = [];
  for (const mode of modes ?? []) {
    const { prefix } = mode;
    if (prefix === "" || /\s/.test(prefix)) {
      out.push(`CommandPalette: the mode "${mode.label}" has the prefix "${prefix}", which is empty or holds a space, so it can never be reached.`);
      continue;
    }
    if (earlier.includes(prefix)) out.push(`CommandPalette: the prefix "${prefix}" is used by more than one mode, so only the first can be reached.`);
    else {
      const shadow = earlier.find((other) => prefix.startsWith(other));
      if (shadow) out.push(`CommandPalette: the prefix "${prefix}" of "${mode.label}" starts with the earlier prefix "${shadow}", which always wins, so it can never be reached. List the longer prefix first.`);
    }
    earlier.push(prefix);
  }
  return out;
}
