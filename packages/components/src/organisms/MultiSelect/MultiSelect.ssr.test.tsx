import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobeIcon } from "@dbm-system/icons";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectProps } from "./MultiSelect.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const options = [
  { value: "a", label: "Alpha", group: "Letters" },
  { value: "b", label: "Beta", group: "Letters" },
  { value: "1", label: "One", description: "The first" },
];

const variants: Array<[string, Partial<MultiSelectProps>]> = [
  ["closed", {}],
  ["open by default", { defaultOpen: true }],
  ["controlled open", { open: true, defaultValue: ["b"] }],
  ["with chips", { defaultValue: ["a", "b"], clearable: true }],
  ["named and required", { name: "pick", required: true }],
  ["named with values", { name: "pick", defaultValue: ["a", "1"] }],
  ["loading and in error", { defaultOpen: true, loading: true, error: true }],
  ["right to left", { defaultOpen: true, dir: "rtl", defaultValue: ["a"] }],
  ["full width", { defaultOpen: true, presentation: "full-width" }],
  ["a responsive presentation", { defaultOpen: true, presentation: { base: "full-width", sm: "anchored" } }],
  ["a Create row", { defaultOpen: true, defaultInputValue: "zz", onCreate: (text) => ({ value: text, label: text }) }],
  ["select all and a limit", { defaultOpen: true, selectAll: true, maxSelected: 2, defaultValue: ["a", "b"] }],
  ["collapsed chips", { maxVisible: 1, defaultValue: ["a", "b", "1"] }],
  ["chips measured to fit", { overflow: "collapse", defaultValue: ["a", "b", "1"] }],
  ["chips with a tone, an icon and content of their own", { defaultValue: ["a", "b"], options: [{ value: "a", label: "Alpha", tone: "success" }, { value: "b", label: "Beta", chipIcon: GlobeIcon }], renderValue: (option) => <b>{option?.label}</b> }],
  ["reorderable chips", { reorderable: true, defaultValue: ["a", "b", "1"] }],
  ["select all from the page", { defaultOpen: true, selectAll: true, onSelectAll: () => ["a"] }],
  ["select all in each group", { defaultOpen: true, selectGroups: true, defaultValue: ["a"] }],
  ["typed values as chips", { allowCustomValue: true, defaultValue: ["free text"], defaultInputValue: "more" }],
  ["coloured matches", { defaultOpen: true, defaultInputValue: "al", highlightTone: "success" }],
  ["a long list, open", { defaultOpen: true, options: Array.from({ length: 300 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}`, group: index < 150 ? "A" : "B" })) }],
  ["nothing to choose from", { defaultOpen: true, options: [] }],
  ["disabled with chips", { disabled: true, name: "pick", defaultValue: ["a"] }],
];

describe("MultiSelect on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<MultiSelect aria-label="Pick" options={options} {...props} />));
    expect(html).toContain('role="combobox"');
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const markup = <MultiSelect aria-label="Pick" options={options} {...props} />;
    const html = onTheServer(() => renderToString(markup));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      hydrateRoot(container, markup, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(screen.getByRole("combobox", { name: "Pick" })).toBeInTheDocument();
    container.remove();
  });
});
