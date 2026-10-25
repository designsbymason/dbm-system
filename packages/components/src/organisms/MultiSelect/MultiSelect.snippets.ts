// The code shown under each story's "Show code" button on MultiSelect's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out
// every default (`closeOnSelect={false}`, `loading={false}`), fills handlers with no-ops and
// freezes controlled state. Each snippet is the smallest real usage of what its story shows,
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";

export const multiSelectSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
{/* countries: [{ value: "ca", label: "Canada" }, { value: "mx", label: "Mexico" }, …] */}
<MultiSelect aria-label="Countries" size="sm" options={countries} />`,

  controlled: `{/* You own the values: const [countries, setCountries] = useState(["ca", "us"]); */}
<MultiSelect
  aria-label="Countries"
  options={countryOptions}
  value={countries}
  onValueChange={setCountries}
/>`,

  groups: `{/* Options with the same group are listed together under its heading. */}
<MultiSelect
  aria-label="Plans"
  options={[
    { value: "free", label: "Free", group: "Personal" },
    { value: "plus", label: "Plus", group: "Personal" },
    { value: "team", label: "Team", group: "Work" },
  ]}
/>`,

  rich: `{/* A description under the label, a reason for an option that can't be chosen, an icon before the label. */}
{/* GlobeIcon comes from @dbm-system/icons */}
<MultiSelect
  aria-label="Plans"
  options={[
    { value: "team", label: "Team", description: "Shared projects and roles", icon: GlobeIcon },
    { value: "enterprise", label: "Enterprise", description: "Contact sales", disabled: "Available on request" },
  ]}
/>`,

  maxSelected: `{/* Once three are chosen the rest can't be, and each says why. */}
<MultiSelect aria-label="Labels" options={labels} maxSelected={3} defaultValue={["bug", "design"]} />`,

  selectAll: `{/* A first row chooses every option the list shows (the matches, while text is typed), and removes them again. */}
<MultiSelect aria-label="Teams" options={teams} selectAll />`,

  overflow: `{/* wrap (default): chips take as many lines as they need. */}
<MultiSelect aria-label="Assignees" options={people} defaultValue={["ada", "grace", "alan", "katherine"]} />
{/* collapse: one line while idle, with as many chips as fit and a "+N more" button. */}
<MultiSelect aria-label="Assignees" options={people} overflow="collapse" defaultValue={["ada", "grace", "alan", "katherine"]} />
{/* maxVisible: a fixed number of chips while idle. */}
<MultiSelect aria-label="Assignees" options={people} maxVisible={2} defaultValue={["ada", "grace", "alan", "katherine"]} />`,

  chipLook: `{/* tone: "brand" (default) | "neutral" | "info" | "success" | "warning" | "highlight" | "danger" */}
{/* variant: "subtle" (default) | "solid" | "outlined" */}
<MultiSelect aria-label="Labels" options={labels} tone="success" variant="outlined" defaultValue={["bug"]} />`,

  perOption: `{/* An option can carry its chip's tone and icon; renderValue draws the chip's content yourself (an avatar and a name). */}
{/* CheckCircleIcon comes from @dbm-system/icons */}
<MultiSelect
  aria-label="Status"
  options={[
    { value: "done", label: "Done", tone: "success", chipIcon: CheckCircleIcon },
    { value: "blocked", label: "Blocked", tone: "danger" },
  ]}
  renderValue={(option) => <span>{option?.label}</span>}
/>`,

  reorderable: `{/* Drag a chip, or focus its remove button and press Space, move it with the arrow keys, and press Space to drop it.
    Alt with an arrow key moves a chip one place. The values (and what a form submits) follow the new order. */}
<MultiSelect
  aria-label="Columns"
  options={columns}
  reorderable
  defaultValue={["name", "email", "role"]}
  onValueChange={(values, { source }) => source === "reorder" && saveOrder(values)}
/>`,

  selectAllRemote: `{/* The page answers: fetch every id that matches the search, and return options (or just their values). */}
<MultiSelect
  aria-label="Search countries"
  options={results}
  filter={false}
  selectAll
  onSelectAll={async ({ text }) => (await fetchEveryMatch(text)).map((country) => country.id)}
/>`,

  groupSelectAll: `{/* A row under each group's heading chooses (and removes) the enabled options of that group. */}
<MultiSelect
  aria-label="Ingredients"
  options={[
    { value: "apple", label: "Apple", group: "Fruit" },
    { value: "apricot", label: "Apricot", group: "Fruit" },
    { value: "carrot", label: "Carrot", group: "Vegetables" },
  ]}
  selectGroups
/>`,

  customValues: `{/* Enter (with no option highlighted), a comma, a paste or leaving the field makes a chip of what was typed.
    Text that is exactly an option's label chooses that option; a value validate refuses is shown with its message. */}
<MultiSelect
  aria-label="Recipients"
  options={contacts}
  allowCustomValue
  validate={(text) => (text.includes("@") ? undefined : "Not an email address")}
/>`,

  pasteList: `{/* Paste "Canada, Uruguay" (or one per line): each piece that is exactly an option's label is chosen,
    and the ones that are not are counted ("2 added, 1 not added"). */}
<MultiSelect aria-label="Countries" options={countries} pasteList />`,

  summary: `{/* A count in place of the chips, for a toolbar or a narrow filter bar. Options are removed in the list. */}
<MultiSelect aria-label="Countries" options={countries} overflow="summary" defaultValue={["ca", "us", "uy"]} />`,

  footer: `{/* A count, Clear and Done under the list. Takes a map, so it can be on for a phone only. */}
<MultiSelect aria-label="Countries" options={countries} footer={{ base: true, sm: false }} />`,

  locked: `{/* A chosen option that is disabled can't be removed: its chip has no remove button, and the clear button leaves it. */}
<MultiSelect
  aria-label="Members"
  options={[
    { value: "owner", label: "Owner", disabled: "Every project has one" },
    { value: "ada", label: "Ada Lovelace" },
  ]}
  defaultValue={["owner", "ada"]}
/>`,

  selected: `{/* selected: the option behind each value, in order, including ones the list no longer holds. */}
<MultiSelect
  aria-label="Search countries"
  options={results}
  filter={false}
  onValueChange={(values, { selected }) => saveChosen(values, selected)}
/>`,

  async: `{/* You fetch: filter={false} shows options as given. Search on "input"; a choice clears the text, it isn't a query. */}
{/* const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); */}
<MultiSelect
  aria-label="Search countries"
  options={results}
  filter={false}
  loading={loading}
  onInputValueChange={(text, reason) => reason === "input" && search(text)}
/>`,

  create: `{/* You own the options: const [options, setOptions] = useState(labels); */}
{/* Return the new option to have it chosen. A promise works too: the row waits for it. */}
<MultiSelect
  aria-label="Labels"
  options={options}
  onCreate={(text) => {
    const option = { value: text.toLowerCase(), label: text };
    setOptions((current) => [...current, option]);
    return option;
  }}
/>`,

  fullWidth: `{/* Across the visible screen below the sm breakpoint, above or below the field, whichever has room. */}
<MultiSelect
  aria-label="Countries"
  options={countries}
  presentation={{ base: "full-width", sm: "anchored" }}
/>`,

  closeOnSelect: `{/* The list closes after each choice. */}
<MultiSelect aria-label="Countries" options={countries} closeOnSelect />`,

  states: `{/* loading: shows a spinner and a "Loading…" row; error: a note under the options. */}
<MultiSelect aria-label="Countries" options={countries} loading />
<MultiSelect aria-label="Countries" options={countries} error />
<MultiSelect aria-label="Countries" options={countries} emptyContent="No country by that name" />`,

  longList: `{/* Only the rows in view are drawn, so thousands of options cost the same as dozens. */}
<MultiSelect aria-label="Items" options={items} />`,

  error: `<MultiSelect aria-label="Countries" options={countries} hasError />`,

  disabled: `<MultiSelect aria-label="Countries" options={countries} defaultValue={["ca", "us"]} disabled />
<MultiSelect aria-label="Countries" options={countries} defaultValue={["ca", "us"]} readOnly />`,

  controller: `{/* const controllerRef = useRef<MultiSelectController>(null); */}
<MultiSelect aria-label="Countries" options={countries} controllerRef={controllerRef} />
<Button onClick={() => controllerRef.current?.open()}>Open</Button>
<Button onClick={() => controllerRef.current?.clear()}>Clear</Button>`,

  inFormField: `<FormField label="Countries" helperText="Where the order ships" required>
  {(fieldProps) => <MultiSelect {...fieldProps} name="countries" options={countries} minSelected={2} />}
</FormField>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface MultiSelectPlaygroundSnippetArgs {
  size?: string;
  placeholder?: string;
  tone?: string;
  variant?: string;
  overflow?: string;
  closeOnSelect?: boolean;
  autoHighlight?: boolean;
  selectAll?: boolean;
  selectGroups?: boolean;
  allowCustomValue?: boolean;
  pasteList?: boolean;
  reorderable?: boolean;
  footer?: boolean | Record<string, boolean>;
  clearable?: boolean;
  openOnFocus?: boolean;
  loading?: boolean;
  error?: boolean;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  presentation?: string;
  highlightTone?: string;
  side?: string;
  align?: string;
  maxSelected?: number;
  minSelected?: number;
  maxVisible?: number;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults. The field needs a name and options, so those are always written.
 */
export function multiSelectPlaygroundSnippet(args: MultiSelectPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label=${quote(args["aria-label"] || "Countries")}`, "options={countries}"];
  if (args.placeholder) attributes.push(`placeholder=${quote(args.placeholder)}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.variant && args.variant !== "subtle") attributes.push(`variant="${args.variant}"`);
  if (args.overflow && args.overflow !== "wrap") attributes.push(`overflow="${args.overflow}"`);
  if (typeof args.maxVisible === "number") attributes.push(`maxVisible={${args.maxVisible}}`);
  if (typeof args.maxSelected === "number") attributes.push(`maxSelected={${args.maxSelected}}`);
  if (typeof args.minSelected === "number") attributes.push(`minSelected={${args.minSelected}}`);
  if (args.closeOnSelect) attributes.push("closeOnSelect");
  if (args.selectAll) attributes.push("selectAll");
  if (args.selectGroups) attributes.push("selectGroups");
  if (args.allowCustomValue) attributes.push("allowCustomValue");
  if (args.pasteList) attributes.push("pasteList");
  if (args.footer === true) attributes.push("footer");
  if (args.reorderable) attributes.push("reorderable");
  if (args.autoHighlight === false && !args.allowCustomValue) attributes.push("autoHighlight={false}");
  if (args.autoHighlight === true && args.allowCustomValue) attributes.push("autoHighlight");
  if (args.clearable === false) attributes.push("clearable={false}");
  if (args.openOnFocus) attributes.push("openOnFocus");
  if (args.loading) attributes.push("loading");
  if (args.error) attributes.push("error");
  if (args.highlightTone && args.highlightTone !== "none") attributes.push(`highlightTone="${args.highlightTone}"`);
  if (args.presentation && args.presentation !== "anchored") attributes.push(`presentation="${args.presentation}"`);
  if (args.side && args.side !== "bottom") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.required) attributes.push("required");
  if (args.hasError) attributes.push("hasError");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name=${quote(args.name)}`);
  return `{/* countries: [{ value: "ca", label: "Canada" }, { value: "mx", label: "Mexico" }, …] */}\n<MultiSelect ${attributes.join(" ")} />`;
}
