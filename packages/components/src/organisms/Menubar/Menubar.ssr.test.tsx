import { FileIcon } from "@dbm-system/icons";
import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Menubar } from "./Menubar";
import { createRef } from "react";
import type {
  MenubarContentProps,
  MenubarController,
  MenubarProps,
} from "./Menubar.types";

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
}: {
  root?: Omit<MenubarProps, "children">;
  content?: MenubarContentProps;
}) {
  return (
    <Menubar aria-label="Application menu" {...root}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content {...content}>
          <Menubar.Group>
            <Menubar.Label>Document</Menubar.Label>
            <Menubar.Item shortcut="⌘N">New</Menubar.Item>
            <Menubar.Item description="Plan and invoices" trailing="New">
              Billing
            </Menubar.Item>
            <Menubar.Item disabled disabledReason="Admins only">
              Delete
            </Menubar.Item>
            <Menubar.Item onSelect={() => new Promise<void>(() => undefined)}>
              Export
            </Menubar.Item>
          </Menubar.Group>
          <Menubar.Separator />
          <Menubar.CheckboxItem defaultChecked>Show grid</Menubar.CheckboxItem>
          <Menubar.RadioGroup defaultValue="a" aria-label="Sort by">
            <Menubar.RadioItem value="a">Name</Menubar.RadioItem>
          </Menubar.RadioGroup>
          <Menubar.Sub>
            <Menubar.SubTrigger>More</Menubar.SubTrigger>
            <Menubar.SubContent>
              <Menubar.Item>Inside</Menubar.Item>
            </Menubar.SubContent>
          </Menubar.Sub>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Action icon={FileIcon} trailing="3">
        Run
      </Menubar.Action>
      <Menubar.Menu value="reason">
        <Menubar.Trigger disabled disabledReason="Not yet">
          Reason
        </Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item shortcut="mod+s">Save</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger disabled>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["closed", {}],
  ["open by default", { root: { defaultValue: "file" } }],
  ["controlled open", { root: { value: "file" } }],
  [
    "extra small, filled",
    { root: { defaultValue: "file", size: "xs", surface: "filled" } },
  ],
  ["outlined", { root: { surface: "outlined" } }],
  ["right to left", { root: { defaultValue: "file", dir: "rtl" } }],
  ["not looping", { root: { loop: false } }],
  ["neutral tone", { root: { tone: "neutral" } }],
  ["hotkeys", { root: { hotkeys: { file: "alt+f", edit: false } } }],
  ["a controller", { root: { controllerRef: createRef<MenubarController>() } }],
  ["an overflow menu", { root: { overflow: "menu", defaultValue: "file" } }],
  ["a sticky bar", { root: { sticky: true, stickyOffset: 4 } }],
  [
    "a custom More label",
    { root: { overflow: "menu", labels: { more: "Mehr" } } },
  ],
  [
    "a responsive side",
    {
      root: { defaultValue: "file" },
      content: { side: { base: "bottom", md: "right" } },
    },
  ],
];

// `Affix` (a sticky bar) watches a marker with an IntersectionObserver, which jsdom does not have. The server render
// clears every stubbed global when it ends, so the stub is made after it, before the client hydrates.
const stubObservers = () =>
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Menubar on the server", () => {
  it.each(variants)(
    "renders %s without touching window or document",
    (_name, props) => {
      const html = onTheServer(() => renderToString(<Tree {...props} />));
      expect(typeof html).toBe("string");
      // the bar is server-rendered; the panel is portaled after mount, so it is not
      expect(html).toContain("File");
      expect(html).toContain('role="menubar"');
      expect(html).not.toContain('role="menu"');
    },
  );
});

describe("Menubar hydrating", () => {
  it.each(variants)(
    "hydrates %s without a mismatch, and opens",
    async (_name, props) => {
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const warn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const html = onTheServer(() => renderToString(<Tree {...props} />));
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      stubObservers();
      let root!: ReturnType<typeof hydrateRoot>;
      // React 19 reports a hydration mismatch through this callback (and recovers by redrawing), not console.error.
      const recoverable: string[] = [];
      await act(async () => {
        root = hydrateRoot(container, <Tree {...props} />, {
          onRecoverableError: (caught) =>
            recoverable.push(String((caught as Error).message).slice(0, 400)),
        });
      });
      try {
        const opensByDefault = Boolean(
          props.root?.defaultValue || props.root?.value,
        );
        if (opensByDefault) {
          expect(
            await screen.findByRole("menu", { hidden: true }),
          ).toBeInTheDocument();
        } else {
          expect(screen.queryByRole("menu")).not.toBeInTheDocument();
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
    },
  );
});
