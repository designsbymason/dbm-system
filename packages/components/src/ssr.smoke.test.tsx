import { PlusIcon } from "@dbm-system/icons";
import { generateManifest } from "@dbm-system/manifest";
import type { ManifestProp } from "@dbm-system/manifest";
import { act } from "@testing-library/react";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import type { ComponentType } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as library from "./index";

// A server-render and hydration smoke test for every component (AGENTS.md says components are built to render on the server). It renders
// each component's root once with the props it cannot do without, on the server (the unit project runs in jsdom, so `window` and
// `document` are removed for the render, as the components' own SSR tests do) and then hydrates the result, and fails on a throw or on
// any console error or warning React prints (an SSR warning, a hydration mismatch). A component with its own `<Name>.ssr.test.tsx` is
// covered there, with the parts and states that need setting up; the rest are covered here. Parts are rendered through their root.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { components } = generateManifest({ packageRoot }).manifest;

/**
 * The props a component needs to be used the way its documentation shows, where the generic ones below make it print a usage warning
 * (a missing accessible name, children that are not its parts) or where a required prop cannot be guessed from its type. A function, so
 * the elements are made when the test runs.
 */
const h = createElement as (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => ReturnType<typeof createElement>;
const PROPS: Record<string, () => Record<string, unknown>> = {
  Avatar: () => ({ name: "Ada Lovelace" }),
  Bleed: () => ({ inset: 4 }),
  Breadcrumb: () => ({
    children: [
      h(library.Breadcrumb.Item, { key: "a" }, h(library.Breadcrumb.Link, { href: "/" }, "Home")),
      h(library.Breadcrumb.Item, { key: "b" }, h(library.Breadcrumb.Page, null, "Now")),
    ],
  }),
  FormField: () => ({ label: "Email", children: (fieldProps: Record<string, unknown>) => h(library.Input, fieldProps) }),
  Indicators: () => ({ count: 3, activeIndex: 0 }),
  ProgressBar: () => ({ label: "Loading" }),
  ProgressCircle: () => ({ label: "Loading" }),
  Splitter: () => ({ children: [h(library.Splitter.Pane, { key: "a" }, "A"), h(library.Splitter.Pane, { key: "b" }, "B")] }),
  Table: () => ({ children: h(library.Table.Body, null, h(library.Table.Row, null, h(library.Table.Cell, null, "x"))) }),
  Tabs: () => ({
    defaultValue: "a",
    children: [h(library.Tabs.List, { key: "l", "aria-label": "x" }, h(library.Tabs.Trigger, { value: "a" }, "A")), h(library.Tabs.Content, { key: "c", value: "a" }, "x")],
  }),
  Tooltip: () => ({ content: "x", children: h("button", null, "x") }),
};

/** A component this test leaves out, with why (at least a sentence). Nothing needs it today. */
const LEFT_OUT: Record<string, string> = {};

const NOT_GUESSABLE = Symbol("not guessable");

/** A value for a required prop, from its type in the manifest: enough to render, not to look right. */
function sample(prop: ManifestProp): unknown {
  if (prop.values && prop.values.length > 0) {
    const first = prop.values[0] as string;
    return /^-?\d+(\.\d+)?$/.test(first) ? Number(first) : first;
  }
  const type = prop.type;
  if (type === "string" || /^ReactNode$|^ReactNode \| /.test(type)) return "x";
  if (type === "boolean") return true;
  if (type === "number") return 1;
  if (type === "Icon") return PlusIcon;
  if (/=>/.test(type)) return () => undefined;
  if (/\[\]$/.test(type)) return [];
  if (/^ReactElement/.test(type)) return createElement("span");
  return NOT_GUESSABLE;
}

function propsFor(name: string, all: ManifestProp[]): Record<string, unknown> | undefined {
  const required = all.filter((prop) => prop.required);
  // Children for a component that takes them; an accessible name, which many components warn about in development when it is missing.
  const props: Record<string, unknown> = { ...(all.some((prop) => prop.name === "children") ? { children: "x" } : {}), ...(all.some((prop) => prop.name === "aria-label") ? { "aria-label": "x" } : {}), ...PROPS[name]?.() };
  for (const prop of required) {
    if (prop.name in props) continue;
    const value = sample(prop);
    if (value === NOT_GUESSABLE) return undefined;
    props[prop.name] = value;
  }
  return props;
}

const errors: unknown[][] = [];
beforeEach(() => {
  errors.length = 0;
  vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(args));
  vi.spyOn(console, "warn").mockImplementation((...args) => void errors.push(args));
});
afterEach(() => vi.restoreAllMocks());

/** Runs `render` with `window` and `document` removed, and puts them back (the setup file's other stubs are left alone). */
function onTheServer<T>(render: () => T): T {
  const saved = ["window", "document"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  for (const [key] of saved) Object.defineProperty(globalThis, key, { value: undefined, configurable: true, writable: true });
  try {
    return render();
  } finally {
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  }
}

/** What was printed, as text, so a failure says what React or the component said. */
const said = () => errors.map((args) => args.map(String).join(" ").slice(0, 400)).join(" | ");

describe("every component renders on the server and hydrates", () => {
  const ownTests = (source: string) => existsSync(join(packageRoot, dirname(source), `${source.split("/").pop()?.replace(/\.tsx$/, "")}.ssr.test.tsx`));
  const covered = components.filter((component) => ownTests(component.source));
  const rest = components.filter((component) => !ownTests(component.source) && !(component.name in LEFT_OUT));

  it("leaves out only what it says it leaves out", () => {
    for (const reason of Object.values(LEFT_OUT)) expect(reason.length).toBeGreaterThan(20);
    expect(covered.length + rest.length + Object.keys(LEFT_OUT).length).toBe(components.length);
    expect(rest.length).toBeGreaterThan(70);
  });

  it.each(rest.map((component) => [component.name]))("%s", async (name) => {
    const component = components.find((entry) => entry.name === name)!;
    const Component = (library as unknown as Record<string, ComponentType<Record<string, unknown>> | undefined>)[name] as ComponentType<Record<string, unknown>>;
    expect(Component, `${name} is not exported from the package`).toBeDefined();
    const props = propsFor(name, component.props);
    expect(props, `${name} has a required prop whose type this test cannot guess: give it props in PROPS, or say why it is left out in LEFT_OUT`).toBeDefined();
    const element = createElement(Component, props);

    const html = onTheServer(() => renderToString(element));
    expect(typeof html).toBe("string");
    if (errors.length > 0) throw new Error(`${name} printed while rendering on the server: ${said()}`);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, element);
    });
    await act(async () => {
      root?.unmount();
    });
    container.remove();
    if (errors.length > 0) throw new Error(`${name} printed while hydrating: ${said()}`);
  });
});
