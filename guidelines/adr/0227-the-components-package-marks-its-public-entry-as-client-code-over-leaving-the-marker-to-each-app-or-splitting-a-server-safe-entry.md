# 0227 — The components package marks its public entry as client code, over leaving the marker to each app or splitting a server-safe entry

**Status:** Accepted · **Date:** 2026-11-17

## Context
In the Next.js App Router a module runs on the server unless it, or a module that imports it, starts with `"use client"`. `@dbm-system/components` has no marker, so an app has to import it from a file that has one (the Frameworks page says so), and an import from a server file fails at build time with a message about a hook that the app never wrote.

Measured on the built package (`dist/`, 120 ES entries), not assumed:

- **Under React's server build** (`node --conditions=react-server`, which has no `useState`, `useEffect`, `useRef` or `createContext`), 118 of the 120 entries fail to load; only `Box` and `FocusTrap` load. 84 fail on `useEffect`, 30 on `createContext`, 2 on `useRef` and 2 on `useSyncExternalStore`.
- **About 17 entries have no client API of their own** (`Box`, `Stack`, `Center`, `Container`, `Bleed`, `Spacer`, `Divider`, `Icon`, `Skeleton`, `Spinner`, `Code`, `Blockquote`, `SkipLink`, `CloseButton`, `FieldLabel`, `FieldError`, `FieldHelperText`). Every one but `Box` still imports `@dbm-system/utils`, which is one module whose first line imports seven hooks, so none of them loads on the server either. `Text` and `Heading` keep a `useRef` for a development warning. 71 entries import Radix, which marks its own modules.
- **36 components are compounds** (`Object.assign(Root, { Part })`).
- **The directive does not survive today's build.** With `treeshake: true` Rollup drops it from an entry with the warning "Module level directives cause errors when bundled"; esbuild alone keeps it only on the entry file itself, and drops it silently from a module that is not an entry (every component's own file is not one: the entries are the folder `index.ts` files). A marker written in the source would not reach `dist`.
- **Size is unaffected.** With the directive on every `dist/*.js` file, an app's bundle of `Button` was byte-identical to the unmarked one (71,751 bytes gzipped with React bundled, esbuild), and 2,794 bytes through the package entry with React external.
- **Phase 0 in a real Next.js 16.4.6 App Router app** (React 19.3.1, the packed packages, `next build` with Turbopack and with webpack, a server page importing straight from `@dbm-system/components`):
  - *Unmarked (today):* every case fails at build, including `Stack` and `Text` (`createContext`, `useRef` or `useEffect` is not a function).
  - *Marked:* `Button` and `Stack` build and prerender from a server file; a client wrapper file (today's guidance) still builds. Four things fail, as client modules always do: a part read from a compound (`Card.Header`, "Element type is invalid"), a function passed as a prop (a `FormField` render function), an event handler (`onClick`) and a hook (`useTheme`, "on the client"). The results are the same in both bundlers.
  - *Which files:* marking only `dist/index.js` gives the same results as marking all 153 files. The exports map exposes only that file, so the per-component entries are internal.
  - *Consumer warnings:* Vite 8 prints a `MODULE_LEVEL_DIRECTIVE` notice for each module that carries the directive. An app importing the package already gets 65, from Radix; marking all 153 files raised that to 218, and marking only `dist/index.js` to 66.

## Decision
- **Only the public entries start with `"use client";`: `dist/index.js` and `dist/index.cjs`.** Everything else in `dist/` is imported from them, so it is in the client graph. A step in `scripts/dist-files.mjs` (after `tsup`, before the manifest) prepends the directive and shifts the file's source map by the one line (a leading `;` in its `mappings`). No source file carries it, since the build would drop it.
- **The package has one entry, as ADR-0219 left it.** There is no server-safe entry and no per-component subpath.
- **A check keeps it:** `dist/index.js` and `dist/index.cjs` begin with the directive and its source map still points at the right lines (in `check-publish`, no new dependency), and `check-fresh-app` gains a Next.js App Router step that imports a component from a server file (needs `next` in the temporary app only; the maintainer approves that first).
- **The Frameworks page, the FAQ and the README say what holds:** a component can be imported from any file, server or client, and rendered there; what a server file cannot do is read a part from a component (`Card.Header`), pass a function or an event handler as a prop (a `FormField` render function, `onClick`) or call a hook, and a file that does needs `"use client"` of its own (confirmed in Next.js 16 with Turbopack and webpack).
- `@dbm-system/utils` and `@dbm-system/icons` are not marked; the components package imports them from inside its own client graph.

## Alternatives considered
- **Leave the marker to the app, and document it better.** Costs nothing in the build. Rejected because the package's readers are mostly AI agents and an import from a server file is the first thing they write; the failure names a hook the agent never used.
- **Mark only the client entries and ship a server-safe entry** (`@dbm-system/components/server` with the 17). The 17 are the cheapest layout pieces, and a Server Component can already render them as client components (the markup is the same); what they would gain is dotted parts and function props, which none of them uses. It also needs `utils` split so `cx` loads without hooks, a second entry for the manifest, `AGENTS.md`, the guides and `check-publish` to name, and two places to look for every agent. ADR-0219 rejected per-component paths for the same cost. Revisit if a server-only use of a pure component or function (`filterTree`, `formatRelativeTime`) is asked for.
- **Per-component subpath exports.** Rejected in ADR-0219 and for the same reason here.
- **Mark the source and keep `treeshake`.** Does not work: the build drops the directive (measured above).
- **A `banner` on every output file.** One line in `tsup.config.ts` and the source maps stay right, but it marks 153 files: the same results in Next.js, and 153 more notices in a Vite 8 build. Marking the public entry is enough.

## Consequences
- An app in the App Router imports and renders any component from a server file with no wrapper; a part, a function prop or a hook still needs a client file, and the page says so. Vite and plain React see no change.
- Tree shaking is unchanged (the directive is a prologue, not a statement a bundler must keep); the per-component budgets and the `check-component-bundle-size` guard are unaffected (measured above). The tarball grows by 28 bytes.
- A server file imports client references, so a component's props must be serialisable there; a component whose use needs a render function stays a client-file job. This is the same limit the wrapper guidance has, moved to where it belongs.
- Vite 8 prints one more `MODULE_LEVEL_DIRECTIVE` notice (66, of which Radix already causes 65); esbuild, webpack and Next.js print none.
- The change ships in a patch release with a changeset.

## Related
`packages/components/tsup.config.ts`, `packages/components/src/guides/Frameworks.mdx`, `Faq.mdx`, `scripts/check-publish.mjs`, `scripts/check-fresh-app.mjs`. `06-engineering-standards.md` §6 and §9 (SSR safety), ADR-0219 (one module per component), ADR-0175 and ADR-0207 (what a consumer installs and imports).
