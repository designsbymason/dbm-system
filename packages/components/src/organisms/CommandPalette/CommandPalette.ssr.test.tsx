import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { CommandPalette } from "./CommandPalette";
import type { CommandItem, CommandPaletteProps } from "./CommandPalette.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  vi.stubGlobal("navigator", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const commands: CommandItem[] = [
  { value: "new", label: "New file", group: "File", shortcut: "⌘N" },
  { value: "settings", label: "Open settings", group: "App", keywords: ["preferences"] },
  { value: "theme", label: "Theme", items: [{ value: "dark", label: "Dark" }] },
];

function Tree(props: Partial<CommandPaletteProps>) {
  return <CommandPalette trigger={<Button>Search</Button>} commands={commands} {...props} />;
}

const variants: Array<[string, Partial<CommandPaletteProps>]> = [
  ["closed", {}],
  ["open by default", { defaultOpen: true }],
  ["controlled open", { open: true }],
  ["with recent commands", { defaultOpen: true, recent: ["settings"] }],
  ["with a starting search", { defaultOpen: true, defaultQuery: "set" }],
  ["a controlled search", { defaultOpen: true, query: "file" }],
  ["loading with an error", { defaultOpen: true, loading: true, error: true }],
  ["no commands", { defaultOpen: true, commands: [] }],
  ["searched by the caller", { defaultOpen: true, filter: false }],
  ["a custom hotkey, none of the hints", { defaultOpen: true, hotkey: "alt+p", showHints: false }],
  ["full screen on a phone, right to left", { defaultOpen: true, fullScreen: { base: true, sm: false }, dir: "rtl", showCloseButton: true }],
  ["small, centred, blurred, with a footer", { defaultOpen: true, size: "sm", placement: "center", scrimBlur: true, footer: <a href="/help">Help</a> }],
  ["drawn by the caller", { defaultOpen: true, renderItem: (item) => <span>{item.label}</span>, highlightTone: "highlight" }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CommandPalette on the server", () => {
  it.each(variants)("renders %s without touching window, document or navigator", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    // the trigger is server-rendered; the panel is portaled after mount, so it is not
    expect(html).toContain("Search");
    expect(html).not.toContain('role="dialog"');
  });
});

describe("CommandPalette hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch, and opens", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    let root!: ReturnType<typeof hydrateRoot>;
    // React 19 reports a hydration mismatch through this callback (and recovers by redrawing), not console.error.
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <Tree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      const opensByDefault = Boolean(props.defaultOpen || props.open);
      if (opensByDefault) {
        expect(await screen.findByRole("dialog", { hidden: true })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      }
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
    error.mockRestore();
    warn.mockRestore();
  });
});
