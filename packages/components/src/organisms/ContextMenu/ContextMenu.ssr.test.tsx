import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuContentProps, ContextMenuController, ContextMenuProps, ContextMenuTriggerProps } from "./ContextMenu.types";

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

function Tree({
  root,
  content,
  trigger,
}: {
  root?: Omit<ContextMenuProps, "children">;
  content?: ContextMenuContentProps;
  trigger?: ContextMenuTriggerProps;
}) {
  return (
    <ContextMenu {...root}>
      <ContextMenu.Trigger {...trigger}>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content {...content}>
        <ContextMenu.Group>
          <ContextMenu.Label>Edit</ContextMenu.Label>
          <ContextMenu.Item shortcut="⌘C">Copy</ContextMenu.Item>
          <ContextMenu.Item description="Plan and invoices" trailing="New">
            Billing
          </ContextMenu.Item>
          <ContextMenu.Item disabled disabledReason="Admins only">
            Delete
          </ContextMenu.Item>
          <ContextMenu.Item onSelect={() => new Promise<void>(() => undefined)}>Export</ContextMenu.Item>
        </ContextMenu.Group>
        <ContextMenu.Separator />
        <ContextMenu.CheckboxItem defaultChecked>Show grid</ContextMenu.CheckboxItem>
        <ContextMenu.RadioGroup defaultValue="a" aria-label="Sort by">
          <ContextMenu.RadioItem value="a">Name</ContextMenu.RadioItem>
        </ContextMenu.RadioGroup>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Inside</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["closed", {}],
  ["open by default", { root: { defaultOpen: true } }],
  ["controlled open", { root: { open: true } }],
  ["extra small", { root: { defaultOpen: true }, content: { size: "xs" } }],
  ["right to left", { root: { defaultOpen: true, dir: "rtl" } }],
  ["non-modal", { root: { defaultOpen: true, modal: false } }],
  ["a sheet", { root: { defaultOpen: true, presentation: "sheet" } }],
  // resolved after hydration from the viewport, so the first render must be the same on the server and the client
  ["a responsive presentation", { root: { defaultOpen: true, presentation: { base: "sheet", md: "menu" } } }],
  ["a custom back label", { root: { defaultOpen: true, presentation: "sheet", labels: { back: "Zurück" } } }],
  ["a controller", { root: { controllerRef: createRef<ContextMenuController>() } }],
  ["keys that open it", { trigger: { openOnKeys: ["Alt+ArrowDown"], tabIndex: 0 } }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContextMenu on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    // the area is server-rendered; the panel is portaled after mount, so it is not
    expect(html).toContain("Right-click me");
    expect(html).not.toContain('role="menu"');
  });
});

describe("ContextMenu hydrating", () => {
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
      const opensByDefault = Boolean(props.root?.defaultOpen || props.root?.open);
      if (opensByDefault) {
        expect(await screen.findByRole("menu", { hidden: true })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      }
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      // Radix says (in development) that a menu opened before any press has no position to open at.
      const unexpected = warn.mock.calls.filter(([message]) => !String(message).includes("its position is indeterminate"));
      expect(unexpected).toEqual([]);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
    error.mockRestore();
    warn.mockRestore();
  });
});
