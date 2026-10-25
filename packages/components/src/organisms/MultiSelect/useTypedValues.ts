import { useMemo, useState } from "react";
import { fold } from "../../internal/optionList/optionList.match";
import { isDisabled } from "../../internal/optionList/optionList.rows";
import type { MultiSelectChangeSource, MultiSelectLabels, MultiSelectOption } from "./MultiSelect.types";

const escapeForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Options {
  values: string[];
  options: MultiSelectOption[];
  /** The options by their label, folded (the first one wins), so a typed word is looked up and not searched for. */
  optionsByLabel: Map<string, MultiSelectOption>;
  labels: MultiSelectLabels;
  allowCustomValue: boolean;
  maxSelected: number | undefined;
  maxTagLength: number | undefined;
  validate: ((text: string) => string | void | undefined) | undefined;
  separators: string[];
  commit: (next: string[], source: MultiSelectChangeSource, option?: MultiSelectOption, known?: MultiSelectOption[]) => void;
  announce: (text: string) => void;
  warn: (message: string) => void;
}

/**
 * Typed and pasted text made into chips: text that is exactly an option's label chooses that option, and (with
 * `allowCustomValue`) other text is a value of its own, unless it is already chosen, too long, refused by `validate`
 * or past the limit. A paste is summarised ("3 added, 2 not added"). The work is proportional to the text: each word is
 * folded once and looked up in a map, and the chosen values are a set.
 */
export function useTypedValues({
  values,
  optionsByLabel,
  labels,
  allowCustomValue,
  maxSelected,
  maxTagLength,
  validate,
  separators,
  commit,
  announce,
  warn,
}: Options) {
  const [message, setMessage] = useState<string | undefined>(undefined);

  // An empty string would match everywhere and turn every character into a value: it is no separator.
  const usableSeparators = useMemo(
    () => (Array.isArray(separators) ? separators : []).filter((separator): separator is string => typeof separator === "string" && separator !== ""),
    [separators],
  );
  const separatorSource = usableSeparators.map(escapeForPattern).join("|");
  const pastePattern = useMemo(
    () => new RegExp([...usableSeparators.map(escapeForPattern), "\\r?\\n", "\\t"].join("|")),
    [usableSeparators],
  );

  // The consumer's `validate` is untrusted: a throw accepts the text, with a development warning.
  const runValidate = (word: string): string | undefined => {
    if (!validate) return undefined;
    try {
      const reason = validate(word);
      return typeof reason === "string" && reason !== "" ? reason : undefined;
    } catch (thrown) {
      warn(`MultiSelect: \`validate\` threw (${String(thrown)}); the text was accepted. Return a message instead of throwing.`);
      return undefined;
    }
  };

  /**
   * Adds each piece in turn against what is chosen as it grows. `pasted` says the pieces came from a pasted list, which is
   * summarised instead of one message for the first piece refused. Without `allowCustomValue` a piece that names no
   * option is refused.
   */
  const addTyped = (pieces: string[], pasted = false): { added: number; refused: string[] } => {
    const next = [...values];
    const chosen = new Set(values);
    const refused: string[] = [];
    const addedLabels: string[] = [];
    const chosenOptions: MultiSelectOption[] = [];
    let custom = false;
    for (const piece of pieces) {
      const word = piece.trim();
      if (word === "") continue;
      const named = optionsByLabel.get(fold(word));
      if (named && isDisabled(named)) {
        refused.push(typeof named.disabled === "string" ? named.disabled : labels.noResults);
        continue;
      }
      const chosenValue = named ? named.value : word;
      if (chosen.has(chosenValue)) {
        refused.push(labels.duplicate(named ? named.label : word));
        continue;
      }
      if (maxSelected !== undefined && next.length >= maxSelected) {
        refused.push(labels.limitReached(maxSelected));
        break;
      }
      if (!named) {
        if (!allowCustomValue) {
          refused.push(labels.notFound(word));
          continue;
        }
        if (maxTagLength !== undefined && word.length > maxTagLength) {
          refused.push(labels.tooLong(word, maxTagLength));
          continue;
        }
        const reason = runValidate(word);
        if (reason) {
          refused.push(reason);
          continue;
        }
        custom = true;
      } else chosenOptions.push(named);
      next.push(chosenValue);
      chosen.add(chosenValue);
      addedLabels.push(named ? named.label : word);
    }
    const summary =
      pasted && pieces.filter((piece) => piece.trim() !== "").length > 1 && refused.length > 0
        ? labels.pasted(addedLabels.length, refused.length)
        : undefined;
    if (addedLabels.length > 0) {
      commit(next, custom ? "custom" : "select", addedLabels.length === 1 ? chosenOptions[0] : undefined, chosenOptions);
      announce(
        summary ??
          (addedLabels.length === 1 ? labels.added(addedLabels[0] as string, next.length) : labels.selectedCount(next.length)),
      );
    } else if (refused[0]) announce(summary ?? refused[0]);
    setMessage(summary ?? refused[0]);
    return { added: addedLabels.length, refused };
  };

  return { message, setMessage, addTyped, separatorSource, pastePattern };
}
