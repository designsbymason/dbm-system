import { create } from "storybook/theming/create";
import { primitives, purpleLight, purpleDark, emeraldLight, emeraldDark } from "@dbm-system/tokens";

type ThemeVars = ReturnType<typeof create>;

/**
 * Storybook's manager UI (sidebar/toolbar chrome) and the Docs addon's own
 * typography both run outside the preview iframe, so neither has access to
 * our CSS custom properties — each generated theme below mirrors a brand's
 * resolved semantic token values (light/dark) as literal hex/font strings
 * instead. `.storybook/manager.ts` and `.storybook/DbmDocsContainer.tsx`
 * both listen for the Brand AND Mode toolbar globals on the addons channel
 * and switch between these live via `getStorybookTheme`, so the manager
 * chrome and the Docs wrapper now track the same two toggles that theme
 * previewed components (see the `withTheme` decorator in preview.tsx) —
 * this reverses an earlier decision (see git history) that manager/docs
 * chrome would stay fixed to purple regardless of the Brand toggle.
 *
 * Rather than hand-transcribing hex per brand/mode (drift-prone — this
 * file used to do exactly that for purple only, and its dark variant had
 * silently gone stale on `appBorderRadius`/`inputBorderRadius`, off by 2px
 * from the `radius.md`/`radius.sm` tokens its own comments named), every
 * value below is read directly from `@dbm-system/tokens`'s built
 * semantic exports (`purpleLight`/`purpleDark`/`emeraldLight`/
 * `emeraldDark` — already-resolved `{ bg, text, border, icon }` hex maps,
 * confirmed via `node -e "require('./dist/index.cjs')"`) and the
 * `primitives.radius` scale. Adding a third brand later means adding one
 * import and one `BRANDS` entry below — nothing else in this file, or in
 * `manager.ts`/`DbmDocsContainer.tsx`, needs to change.
 *
 * One correctness note found while building this: `text["on-brand"]` is
 * white in light mode for both brands, but **`#2C2A34` (gray.900, dark
 * text) in dark mode for both brands** (2026-08-21 — previously this was
 * split per brand, white for purple and a different dark gray for
 * emerald, an accumulated inconsistency rather than a designed one; both
 * `bg.brand`'s own dark value and `text.on-brand`'s dark value were
 * unified the same day, see guidelines/03-token-system-spec.md).
 * `textInverseColor` below reads `t.text["on-brand"]` per brand/mode
 * rather than assuming white, which the old purple-only file did —
 * assuming white would make dark mode's selected sidebar item illegible
 * (light text on a now-light brand-tinted background) in both brands.
 */

type Brand = "purple" | "emerald";
type Mode = "light" | "dark";

/** Recursively widens every literal string leaf (e.g. `"#5548A4"`) to
 * `string`. Found while adding `.storybook`'s own TypeScript project
 * (`.storybook/tsconfig.json`) — `purpleLight`/`purpleDark`/`emeraldLight`/
 * `emeraldDark` are each inferred with their own exact hex literals, so
 * without this, `typeof purpleLight` only structurally matches purple's
 * light theme; every other theme object fails to type-check against it
 * (real, previously-uncaught type errors, not a style nit — this whole
 * project was never type-checked before that tsconfig existed). */
type Widen<T> = T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> };
export type SemanticTokens = Widen<typeof purpleLight>;

const SEMANTIC_TOKENS: Record<Brand, Record<Mode, SemanticTokens>> = {
  purple: { light: purpleLight, dark: purpleDark },
  emerald: { light: emeraldLight, dark: emeraldDark },
};

// radius.md / radius.sm, read live rather than hand-typed (see file header).
const RADIUS_MD = Number.parseInt(primitives.radius.md, 10);
const RADIUS_SM = Number.parseInt(primitives.radius.sm, 10);

function buildStorybookTheme(brand: Brand, mode: Mode): ThemeVars {
  const t = SEMANTIC_TOKENS[brand][mode];
  return create({
    base: mode,

    brandTitle: "DBM System",
    // The logo goes back to the docs website, in the same tab (ADR-0214).
    brandUrl: "https://dbm-system.com/",
    brandTarget: "_self",
    // The "dbM system" wordmark, one file per mode, generated from `text.brand` (scripts/generate-logo.mjs, ADR-0221) and
    // served from `.storybook/public/` via `staticDirs` in main.ts. The manager rebuilds this theme when the Mode toolbar
    // changes, so the logo follows it. Relative, so it resolves under `/storybook/` on dbm-system.com as well as at the
    // root locally (an absolute `/logo-light.svg` pointed at the site's root there and failed).
    brandImage: mode === "dark" ? "./logo-dark.svg" : "./logo-light.svg",

    colorPrimary: t.bg.brand,
    // `text.brand`, not `bg.brand` (2026-08-09) — Storybook applies this as
    // literal text color in at least two places: the toolbar's active
    // Brand/Mode labels, and the Docs page's right-side TOC active-item
    // text. At the time this was written, `bg.brand` (purple.500 dark) was
    // calibrated as a *background* fill paired with `text.on-brand`, not as
    // foreground text on `bg.neutral-subtle`/`bg.surface` — it measured
    // 3.13:1 / 2.24:1 there, both failing the 4.5:1 AA text floor, so
    // `text.brand` (the vetted literal-text token, purple.300 dark) was
    // used instead: 7.45:1 / 5.32:1 against the same two backgrounds.
    // `bg.brand`'s own dark value later moved to purple.300 (2026-08-21,
    // see guidelines/03-token-system-spec.md) and would now pass as text
    // too (same 7.45:1/5.32:1, since both tokens converged on the same
    // primitive step) — but this file still uses `text.brand`, its own
    // independently-tracked token, rather than switching to `bg.brand`
    // now that the two happen to coincide; no functional change intended
    // here, this note only corrects the stale numbers the original
    // decision was based on. Light mode is unaffected: `text.brand` and
    // `bg.brand` are byte-identical there (both purple.600), so this was
    // always a dark-mode-only distinction.
    // (Originally used `text.link`, which shared these exact values —
    // switched to `text.brand` 2026-08-20 when `text.link` was de-branded
    // to a shared blue across every theme; these active Brand/Mode labels
    // need to actually match the selected brand, which is what `text.brand`
    // still does and `text.link` no longer would.)
    colorSecondary: t.text.brand,

    // Dark mode only, at explicit direction (2026-09-06): the sidebar
    // (logo + nav tree) should read as brand-tinted rather than plain
    // neutral gray once dark mode itself got darker overall in the same
    // day's retuning pass (see `guidelines/adr/0011`) — `bg.brand-subtle`
    // is `gray.950` in dark mode, distinctly darker/more-branded than
    // `bg.neutral-subtle`'s `gray.800`. Light mode is unaffected, still
    // `bg.neutral-subtle`, since only dark mode was asked for.
    appBg: mode === "dark" ? t.bg["brand-subtle"] : t.bg["neutral-subtle"],
    appContentBg: t.bg.surface,
    appPreviewBg: t.bg.surface,
    appBorderColor: t.border.default,
    appBorderRadius: RADIUS_MD,

    fontBase: '"Nunito", system-ui, sans-serif',
    fontCode:
      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

    textColor: t.text.primary,
    textInverseColor: t.text["on-brand"],
    textMutedColor: t.text.secondary,

    barTextColor: t.text.secondary,
    // Standardized on `bg.brand-hover` for both modes — the light theme
    // previously reused `bg.brand` here (identical to the selected-state
    // color, so hovering an unselected item looked the same as selecting
    // it), while dark already used `bg.brand-hover` correctly. This gives
    // light mode a real, distinct hover state instead of leaving that
    // inconsistency in place.
    barHoverColor: t.bg["brand-hover"],
    barSelectedColor: t.bg.brand,
    // Same dark-mode-only `bg.brand-subtle` swap as `appBg` above, so the
    // toolbar (Brand/Mode buttons, viewport, zoom) reads as one continuous
    // brand-tinted chrome with the sidebar instead of two different grays.
    barBg: mode === "dark" ? t.bg["brand-subtle"] : t.bg["neutral-subtle"],

    buttonBg: t.bg["neutral-subtle"],
    buttonBorder: t.border.default,

    booleanBg: t.bg["neutral-subtle"],
    booleanSelectedBg: t.bg.surface,

    inputBg: t.bg.surface,
    inputBorder: t.border.default,
    inputTextColor: t.text.primary,
    inputBorderRadius: RADIUS_SM,
  });
}

/** Add a new brand by importing its `<brand>Light`/`<brand>Dark` semantic
 * exports above, adding a `SEMANTIC_TOKENS` entry, and adding it here. */
export const BRANDS: Brand[] = ["purple", "emerald"];
const MODES: Mode[] = ["light", "dark"];
// Explicit defaults rather than `BRANDS[0]`/`MODES[0]` — under
// `noUncheckedIndexedAccess` (see `tsconfig.base.json`), an array index
// access is typed `T | undefined` regardless of the array's actual fixed
// length, so `BRANDS[0]` doesn't satisfy a `Brand`-typed fallback.
const DEFAULT_BRAND: Brand = "purple";
const DEFAULT_MODE: Mode = "light";

const registry = Object.fromEntries(
  BRANDS.map((brand) => [
    brand,
    Object.fromEntries(MODES.map((mode) => [mode, buildStorybookTheme(brand, mode)])),
  ]),
) as Record<Brand, Record<Mode, ThemeVars>>;

/** Falls back to the first configured brand/mode if given an unrecognized
 * or missing value — callers pass raw toolbar-global strings, which are
 * `unknown` as far as the type system is concerned. */
export function getStorybookTheme(brand?: string, mode?: string): ThemeVars {
  const resolvedBrand = BRANDS.includes(brand as Brand) ? (brand as Brand) : DEFAULT_BRAND;
  const resolvedMode = MODES.includes(mode as Mode) ? (mode as Mode) : DEFAULT_MODE;
  return registry[resolvedBrand][resolvedMode];
}

/** Raw resolved semantic tokens (`{ bg, text, border, icon }` hex maps),
 * same brand/mode resolution as `getStorybookTheme` — for manager-side
 * chrome that Storybook's theme API has no dedicated variable for (e.g.
 * the addon panel background, which shares `appContentBg` with the Docs
 * content wrapper, too coarse to target just the panel). `manager.ts`
 * uses this to hand-inject a scoped style override for `#storybook-panel-root`
 * instead of widening `appContentBg` and affecting the Docs wrapper too. */
export function getSemanticTokens(brand?: string, mode?: string): SemanticTokens {
  const resolvedBrand = BRANDS.includes(brand as Brand) ? (brand as Brand) : DEFAULT_BRAND;
  const resolvedMode = MODES.includes(mode as Mode) ? (mode as Mode) : DEFAULT_MODE;
  return SEMANTIC_TOKENS[resolvedBrand][resolvedMode];
}
