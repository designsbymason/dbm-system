import type { Decorator, Preview } from "@storybook/react-vite";
import { DbmDocsContainer } from "./DbmDocsContainer";

// The two typefaces, self-hosted (ADR-0215): bundled into Storybook, no third-party request.
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@dbm-system/tokens/css/primitives.css";
import "@dbm-system/tokens/css/component-tokens.css";
import "@dbm-system/tokens/css/purple-light.css";
import "@dbm-system/tokens/css/purple-dark.css";
import "@dbm-system/tokens/css/emerald-light.css";
import "@dbm-system/tokens/css/emerald-dark.css";
import "../src/styles/global.css";
import "./docs.css";

// Token CSS is scoped under `:root[data-theme="..."]` (see packages/tokens),
// and `:root` only ever matches the document element — never a wrapper <div> —
// so the theme attribute has to go on document.documentElement, the same place
// ThemeProvider sets it in a real app. This also makes portaled content (which
// mounts on document.body, outside any story wrapper) inherit the theme correctly.
/** The site's mode key ("light", "dark" or "system"), resolved to light or dark; `undefined` when nothing is stored. */
function storedMode(): "light" | "dark" | undefined {
  try {
    const value = window.localStorage.getItem("dbm-mode");
    if (value === "light" || value === "dark") return value;
    if (value === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    // Storage blocked: Storybook's own default applies.
  }
  return undefined;
}

const withTheme: Decorator = (Story, context) => {
  const { brand, mode } = context.globals;
  document.documentElement.dataset.theme = `${brand}-${mode}`;
  // A page-level template (`parameters.fullBleed`) fills the window with no padding and no minimum height of its own, since it is the page.
  // Opt-in: `layout: "fullscreen"` alone keeps the padding that the stories already using it rely on. On a Docs page the padding stays, as the
  // template is drawn in a frame there.
  const fullBleed = context.parameters.fullBleed === true && context.viewMode !== "docs";
  return (
    <div
      style={{
        background: "var(--dbm-bg-surface)",
        color: "var(--dbm-text-primary)",
        fontFamily: "var(--dbm-font-family-primary)",
        // Full viewport height only in the standalone story view — a
        // handful of stories genuinely rely on it (Affix's scroll demo,
        // BackToTop, Center). Embedded inline in a Docs page's Canvas
        // block (`viewMode === "docs"`), the same 100vh instead forced
        // every preview into a huge box with mostly empty space below the
        // actual content — this lets Docs previews hug their content
        // while standalone story views keep the full-height background.
        minHeight: context.viewMode === "docs" || fullBleed ? undefined : "100vh",
        padding: fullBleed ? 0 : "var(--dbm-space-6)",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    a11y: { test: "error" },
    docs: {
      // Live-reactive to the Mode toolbar global (see DbmDocsContainer.tsx)
      // instead of a static `theme` — this overrides Docs.tsx's own theme
      // prop entirely, so no `theme` key is set here.
      container: DbmDocsContainer,
      // Restricted to `h2` only (default is `h2, h3`) so the TOC reflects
      // just the template's fixed section list (Overview, Import,
      // Playground, ...) — identical across every component's Docs page —
      // rather than also indexing each component's own `h3` variant
      // subheadings, which differ per component and would make the TOC
      // read as a list of variants instead of a consistent page nav.
      toc: { headingSelector: "h2" },
    },
    options: {
      // Storybook's story-index generator statically extracts this
      // parameter server-side, so it must be written inline here — a
      // reference to a function defined elsewhere in this module fails
      // with "Unexpected 'storySort'" at startup.
      //
      // Top-level group order: Getting started, Guides and Foundations
      // (token reference), then Components, Templates and Resources —
      // an explicit order, since alphabetical would scatter them. Within
      // Foundations, an explicit reading order (Overview first, then
      // roughly increasing specialization) — alphabetical would scatter
      // Overview into the middle of the list. Within Components, the Index
      // first, then every component alphabetically by name (no tier or
      // category groups; they are in src/componentCatalog.json; the
      // application shells are components, so they are among them); within
      // Templates, the Index first, then the example pages alphabetically; within a
      // component, the hand-authored Docs page (see
      // guidelines/07-storybook-and-documentation-standards.md §4) always
      // sorts first, then the Playground story, then everything else in
      // file order.
      // Un-annotatable, not just unannotated — this function's own *source
      // text* is statically extracted and `eval`'d server-side (see the
      // comment above) as plain JS, before any TypeScript transpilation.
      // Confirmed two ways this can't be typed, not just assumed:
      // 1. Real inline type annotations (`(a: {...}, b: {...}) =>`) broke
      //    `build-storybook` outright (`SyntaxError: Unexpected token ':'`
      //    in `getStorySortParameter`).
      // 2. JSDoc (`@param`/`@type`) doesn't error the build, but also
      //    doesn't satisfy `tsc` — JSDoc-as-types is a `checkJs`-only
      //    TypeScript feature, not something a real `.tsx` file gets for
      //    an untyped arrow function, tried and confirmed against this
      //    project's own TypeScript (5.9.3), not a stray npx-fetched one.
      // The `@ts-expect-error` below is this function's only option, and
      // was already implicitly-`any` (silently, since `.storybook` had no
      // typechecking at all) before `.storybook/tsconfig.json` existed —
      // not a regression this introduces, just the first time it's visible.
      // @ts-expect-error — `a`/`b` can't be typed; see comment above
      storySort: (a, b) => {
        // `title.split("/")[0]` is `string | undefined` under
        // `noUncheckedIndexedAccess` — a non-empty `title` always has at
        // least one segment, so the `?? title` fallback is unreachable in
        // practice, just satisfying the type. `title` itself can't be
        // annotated for the same reason `a`/`b` above can't be.
        // @ts-expect-error — `title` can't be typed; see comment above
        const topLevelGroup = (title) => title.split("/")[0] ?? title;
        // Getting started (the introduction, installation, quick start, frameworks and AI agents) first, then the written guides, the
        // token reference, then Components (the Index first, then every component alphabetically by name, a component's parts under
        // it; the application shells are components, so they fall in the same order), then Templates (the Index first, then the example
        // pages alphabetically), then the resources (changelog, roadmap, FAQ).
        const groupPriority = ["Getting started", "Guides", "Foundations", "Components", "Templates", "Resources"];
        const gettingStartedOrder = [
          "Getting started/Introduction",
          "Getting started/Installation",
          "Getting started/Quick start",
          "Getting started/Frameworks",
          "Getting started/AI agents",
        ];
        const resourcesOrder = ["Resources/Changelog", "Resources/Roadmap", "Resources/FAQ"];
        const guidesOrder = [
          "Guides/Theming",
          "Guides/Accessibility",
          "Guides/Responsive and right-to-left",
          "Guides/Hooks and utilities",
          "Guides/Composition patterns",
          "Guides/Icons",
        ];
        const foundationsOrder = [
          "Foundations/Overview",
          "Foundations/Color",
          "Foundations/Typography",
          "Foundations/Spacing",
          "Foundations/Radius",
          "Foundations/Shadows",
          "Foundations/Motion",
          "Foundations/IconSizes",
          "Foundations/Miscellaneous",
          "Foundations/Breakpoints",
        ];

        const aGroup = topLevelGroup(a.title);
        const bGroup = topLevelGroup(b.title);
        if (aGroup !== bGroup) {
          const aRank = groupPriority.indexOf(aGroup);
          const bRank = groupPriority.indexOf(bGroup);
          if (aRank !== bRank) {
            return (
              (aRank === -1 ? groupPriority.length : aRank) -
              (bRank === -1 ? groupPriority.length : bRank)
            );
          }
          return aGroup.localeCompare(bGroup, undefined, { numeric: true });
        }
        if (aGroup === "Getting started") {
          return gettingStartedOrder.indexOf(a.title) - gettingStartedOrder.indexOf(b.title);
        }
        if (aGroup === "Resources") {
          return resourcesOrder.indexOf(a.title) - resourcesOrder.indexOf(b.title);
        }
        if (aGroup === "Guides") {
          return guidesOrder.indexOf(a.title) - guidesOrder.indexOf(b.title);
        }
        if (aGroup === "Foundations") {
          return foundationsOrder.indexOf(a.title) - foundationsOrder.indexOf(b.title);
        }
        if (aGroup === "Components" || aGroup === "Templates") {
          // The Index page (and its hidden checks) leads the group; every component or template after it falls to the alphabetical order
          // below.
          // @ts-expect-error — `title` can't be typed; see comment above
          const inIndex = (title) => title === `${aGroup}/Index` || title.startsWith(`${aGroup}/Index/`);
          const aIndex = inIndex(a.title);
          const bIndex = inIndex(b.title);
          if (aIndex !== bIndex) return aIndex ? -1 : 1;
        }
        if (a.title !== b.title) {
          return a.title.localeCompare(b.title, undefined, { numeric: true });
        }
        if (a.type === "docs" || b.type === "docs") {
          return a.type === "docs" ? -1 : 1;
        }
        if (a.name === "Playground" || b.name === "Playground") {
          return a.name === "Playground" ? -1 : 1;
        }
        return 0;
      },
    },
  },
  // The mode the reader chose on dbm-system.com, which shares this origin (ADR-0214), so crossing from the site keeps
  // light or dark. A `mode` in the URL's `globals` still wins; with nothing stored it is light, as before.
  initialGlobals: { mode: storedMode() ?? "light" },
  globalTypes: {
    brand: {
      description: "Brand theme",
      defaultValue: "purple",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: [
          { value: "purple", title: "Purple" },
          { value: "emerald", title: "Emerald" },
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Color mode",
      defaultValue: "light",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
