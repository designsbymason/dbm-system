import { useEffect, useRef, useState } from "react";
import { countries, manyOptions, plans } from "../Combobox/ComboboxStoryKit";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectOption, MultiSelectProps } from "./MultiSelect.types";

// The same countries, plans and long list the `Combobox` stories choose from, so the two Docs pages differ only in
// what the field does with them. A `ComboboxOption` is a `MultiSelectOption`.
export { countries, manyOptions, plans };

/** People with a caption, for the stories that show a description beside each name. */
export const people: MultiSelectOption[] = [
  { value: "ada", label: "Ada Lovelace", description: "Analytical engines", keywords: ["mathematician"] },
  { value: "grace", label: "Grace Hopper", description: "Compilers", keywords: ["admiral"] },
  { value: "alan", label: "Alan Turing", description: "Computability" },
  { value: "katherine", label: "Katherine Johnson", description: "Orbital mechanics" },
  { value: "margaret", label: "Margaret Hamilton", description: "Flight software" },
  { value: "dorothy", label: "Dorothy Vaughan", description: "Computing and programming" },
  { value: "linus", label: "Linus Torvalds", description: "Kernels", disabled: "On leave" },
];

/**
 * A field that fetches as the person types, for the async story: a stand-in server answers after a short delay, a
 * reply to an older search is thrown away, and a choice doesn't start a search.
 */
export function SearchingMultiSelect(props: Partial<MultiSelectProps>) {
  const [results, setResults] = useState<MultiSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const search = (text: string, reason: string) => {
    if (reason !== "input") return;
    window.clearTimeout(timer.current);
    const request = latest.current + 1;
    latest.current = request;
    if (text.trim() === "") {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      if (request !== latest.current) return;
      setResults(countries.filter((country) => country.label.toLowerCase().includes(text.trim().toLowerCase())));
      setLoading(false);
    }, 600);
  };

  return (
    <MultiSelect
      aria-label="Search countries"
      placeholder="Search countries"
      {...props}
      options={results}
      filter={false}
      loading={loading}
      onInputValueChange={search}
    />
  );
}
