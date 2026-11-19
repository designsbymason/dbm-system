// The manager's own text is Latin, and its bundler inlines each font file into its CSS, so only the Latin subset is
// imported here (the full files would add about half a megabyte); the preview loads every subset by `unicode-range`.
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import { addons } from "storybook/manager-api";
import { DOCS_RENDERED, SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";
import { primitives } from "@dbm-system/tokens";
import { getSemanticTokens, getStorybookTheme } from "./theme";

// Manager UI chrome (sidebar/toolbar/addon panels) runs outside the preview
// iframe, so it can't read the Brand/Mode toolbar globals via a decorator
// the way previewed components do (see `withTheme` in preview.tsx) — it has
// to listen on the addons channel instead. `SET_GLOBALS` fires once on
// preview init with the full globals object; `UPDATE_GLOBALS` fires on
// every toolbar interaction but only carries the *changed* keys (confirmed
// via `storybook/internal/core-events`) — so `lastBrand`/`lastMode` track
// the running values across events rather than assuming a payload carries
// both. Verified live (no reload needed) with a throwaway high-contrast
// theme before wiring up the real palettes — `addons.setConfig()` is safely
// re-callable after boot; it emits `SET_CONFIG` on the channel, which the
// manager's own store already listens for and re-derives `state.theme`
// from (confirmed by reading `manager-api`'s compiled source, not just its
// `.d.ts`).
//
// **Fifth bug, found 2026-08-09 from a user report** (this file's own
// account of the fourth bug below turned out to be wrong — it assumed the
// stale echo always self-corrects, but that's not true in this direction):
// on a component's Docs page (an attached story, e.g. Button), toggling
// Dark → Light updated the Docs page content correctly but left the
// sidebar/toolbar/panel stuck in dark mode — Light → Dark worked fine.
// Captured every raw channel event during a real dark→light toggle to
// confirm rather than guess: two correct `UPDATE_GLOBALS` events landed
// first (`{mode: "light"}`, then a full-snapshot one also saying
// `"light"`), but a **stale `SET_GLOBALS` echo carrying `{mode: "dark"}`
// arrived last** — with no further correcting event after it, contrary to
// the fourth bug's note below. `applyTheme` trusted `SET_GLOBALS` and
// `UPDATE_GLOBALS` equally, so this stale echo silently won and the
// manager stayed on the dark theme. (The Docs page content itself doesn't
// have this problem: a component page with an attached story reads mode
// synchronously from the story's own context — see
// `readModeFromAttachedStory` in `DbmDocsContainer.tsx` — never from
// accumulated channel events, so it's structurally immune to this race.)
// Root cause: `SET_GLOBALS` isn't the one-time init-only event its own
// name and Storybook's docs imply — on a Docs page with an attached
// `<Canvas>`, it re-fires on every toggle as part of the Canvas
// re-preparing its story (same mechanism documented as the first bug in
// `useThemeGlobals.ts`), and that re-fire can lag behind and arrive after
// the real, live `UPDATE_GLOBALS` for the same change. Fixed by only
// trusting `SET_GLOBALS` for the very first sync (`hasReceivedInitialSync`
// below) — after that, only `UPDATE_GLOBALS` (confirmed live and timely in
// every capture) is allowed to change `lastBrand`/`lastMode`. Applies to
// both Brand and Mode — same channel, same events.
// The reader's mode on dbm-system.com, which shares this origin (ADR-0214): "light", "dark" or "system" under one key.
// The manager starts in it (the preview's `initialGlobals` reads the same key), and a change made in the Mode toolbar
// is written back, so the site follows on the way back.
const MODE_KEY = "dbm-mode";
function storedMode(): "light" | "dark" | undefined {
  try {
    const value = window.localStorage.getItem(MODE_KEY);
    if (value === "light" || value === "dark") return value;
    if (value === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    // Storage blocked: Storybook's own default applies.
  }
  return undefined;
}
function rememberMode(mode: string): void {
  // Only a real change is written, so a stored "system" survives Storybook echoing the mode it already resolved to.
  if ((mode !== "light" && mode !== "dark") || storedMode() === mode) return;
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not remembered; Storybook still changes mode.
  }
}

let lastBrand: string | undefined;
let lastMode: string | undefined = storedMode();
let hasReceivedInitialSync = false;

// The addon panel (Controls/Actions/Interactions/..., `#storybook-panel-root`
// — confirmed via DOM inspection, a stable Storybook-assigned id regardless
// of dock position) has no dedicated Storybook theme variable of its own:
// its background is driven by `appContentBg`, the same variable the Docs
// content wrapper uses (`DbmDocsContainer` passes the same theme object
// there). Scoped `<style>` injection targeting the panel's own id, kept in
// sync with the same brand/mode tracking `applyTheme` already does below,
// is the only way to color just the panel without touching `appContentBg`
// (and, with it, every component's Docs page background) directly.
// **Revised 2026-09-06, at explicit direction:** now uses `bg.surface`,
// matching `appContentBg`/`appPreviewBg` — the panel is meant to read as
// part of the same "page" as the Docs content and the area behind the
// canvas, not a separately-tinted region (this reverses an earlier
// `bg.neutral-subtle` choice made specifically to look distinct from that
// page background).
let panelStyleEl: HTMLStyleElement | undefined;
function applyPanelBg(brand: string | undefined, mode: string | undefined): void {
  const hex = getSemanticTokens(brand, mode).bg.surface;
  if (!panelStyleEl) {
    panelStyleEl = document.createElement("style");
    panelStyleEl.id = "dbm-panel-bg-override";
    document.head.appendChild(panelStyleEl);
  }
  panelStyleEl.textContent = `#storybook-panel-root { background: ${hex} !important; }`;
}

// The Settings gear renders as Storybook's bare/ghost icon-button style
// (transparent, no border, 4px radius) while "Create a new story" right
// next to it — same 32x32 footprint — renders as Storybook's filled
// style, driven by the `buttonBg`/`buttonBorder` theme vars `theme.ts`
// already sets from `bg.neutral-subtle`/`border.default`. Storybook doesn't
// expose a per-button style override, so this reproduces that filled
// look on the gear by hand: `bg.neutral-subtle` fill plus an inset box-shadow in
// `border.default` (confirmed via computed styles that Storybook renders
// `buttonBorder` as an inset shadow, not an actual border edge, on this
// button). `10px` radius is likewise copied from the neighbor's computed
// style rather than `radius.md` (8px) directly — Storybook pads button
// radius above `appBorderRadius` internally, and matching the sibling's
// rendered value exactly was simpler than reverse-engineering its offset.
//
// Below the mobile breakpoint, Storybook swaps the sidebar for a
// bottom-sheet drawer with a *different* React tree for this same row:
// `button[aria-label="Settings"]` is replaced by
// `a[aria-label="About Storybook"]` (still a gear glyph, just a link to
// `/settings/about` instead of a dropdown toggle) sitting next to a
// `button[aria-label="Close menu"]` — confirmed via DOM inspection at the
// mobile viewport, there is no `button[aria-label="Settings"]` in that
// tree at all, not merely a hidden one. Styling it identically here so
// the mobile version reads as the same control.
let gearButtonStyleEl: HTMLStyleElement | undefined;
function applyGearButtonStyle(brand: string | undefined, mode: string | undefined): void {
  const tokens = getSemanticTokens(brand, mode);
  if (!gearButtonStyleEl) {
    gearButtonStyleEl = document.createElement("style");
    gearButtonStyleEl.id = "dbm-gear-button-style";
    document.head.appendChild(gearButtonStyleEl);
  }
  gearButtonStyleEl.textContent = `
    button[aria-label="Settings"],
    a[aria-label="About Storybook"] {
      background: ${tokens.bg["neutral-subtle"]};
      border-radius: 10px;
      box-shadow: ${tokens.border.default} 0px 0px 0px 1px inset;
    }
  `;
}

// Fixes a real functional gap, not just a style mismatch: on the mobile
// bottom-sheet drawer, `a[aria-label="About Storybook"]` (the mobile
// equivalent of the desktop Settings gear — see `applyGearButtonStyle`
// above) is a genuine navigation link straight to `?path=/settings/about`,
// not a popover trigger. Confirmed via DOM inspection at the mobile
// viewport: `button[aria-label="Settings"]` (the desktop dropdown-menu
// trigger) has zero instances anywhere in the tree there, not merely a
// hidden one, and resizing back to desktop width without a full reload
// still leaves the mobile-only `<a>` in place — this is Storybook's own
// mobile layout substituting a different, simpler control, not a CSS
// visibility toggle we can just reverse. So on mobile, tapping the
// relocated gear jumped straight to the About page instead of showing a
// menu like desktop does.
//
// Desktop's real dropdown has 9 items, several of which (the Show
// sidebar/toolbar/addons-panel toggles, previous/next component/story
// navigation) only work through Storybook's internal React `api`, which
// isn't reachable from this file — `manager.ts` runs as a plain script
// outside Storybook's component tree, only `storybook/manager-api`'s
// `addons` singleton is available here. Rather than fight that boundary,
// this reproduces just the 3 plain-navigation items as a small custom
// popover (confirmed at explicit user direction to keep this scoped): About
// your Storybook, Keyboard shortcuts, and Documentation — the same three
// hrefs the desktop menu itself uses (`./?path=/settings/about`,
// `./?path=/settings/shortcuts`, and the external
// `https://storybook.js.org/docs/?renderer=react&ref=ui`, read directly off
// the live desktop menu's DOM rather than guessed). Desktop's
// `button[aria-label="Settings"]` is untouched — this menu is only ever
// wired up to the mobile-only `<a>`.
let mobileMenuStyleEl: HTMLStyleElement | undefined;
function applyMobileMenuStyle(brand: string | undefined, mode: string | undefined): void {
  const tokens = getSemanticTokens(brand, mode);
  const shadow = primitives.shadow[mode === "dark" ? "dark" : "light"].lg;
  if (!mobileMenuStyleEl) {
    mobileMenuStyleEl = document.createElement("style");
    mobileMenuStyleEl.id = "dbm-mobile-settings-menu-style";
    document.head.appendChild(mobileMenuStyleEl);
  }
  mobileMenuStyleEl.textContent = `
    #dbm-mobile-settings-menu {
      background: ${tokens.bg.surface};
      border: 1px solid ${tokens.border.default};
      box-shadow: ${shadow};
    }
    #dbm-mobile-settings-menu a {
      color: ${tokens.text.primary};
    }
    #dbm-mobile-settings-menu a:hover,
    #dbm-mobile-settings-menu a:focus-visible {
      background: ${tokens.bg["neutral-subtle"]};
    }
    #dbm-mobile-settings-menu .dbm-mobile-settings-menu-external {
      color: ${tokens.text.secondary};
    }
  `;
}

// Structural (non-color) styling only — colors come from
// `applyMobileMenuStyle` above so they stay theme-reactive. Anchored with
// the same `.sidebar-header`-relative `calc(100% + 16px)` technique the
// mobile gear itself already uses (see the brand-chrome style block
// below), offset by its 36px height plus an 8px gap so the menu opens
// directly under it.
const mobileMenuLayoutStyleEl = document.createElement("style");
mobileMenuLayoutStyleEl.id = "dbm-mobile-settings-menu-layout";
mobileMenuLayoutStyleEl.textContent = `
  #dbm-mobile-settings-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: calc(100% + 16px + 36px + 8px);
    right: 0;
    z-index: 20;
    min-width: 210px;
    padding: 4px;
    border-radius: 12px;
    font-family: "Nunito", system-ui, sans-serif;
  }
  #dbm-mobile-settings-menu.dbm-open {
    display: flex;
  }
  #dbm-mobile-settings-menu a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.3;
    text-decoration: none;
  }
`;
document.head.appendChild(mobileMenuLayoutStyleEl);

/** Finds (or lazily builds) the popover inside the *currently rendered*
 * `.sidebar-header` — not cached across calls, since React can remount the
 * drawer's header between opens/closes, which would otherwise leave this
 * pointing at a detached node the same way the rest of this file avoids
 * caching direct references to Storybook-owned elements. */
function getOrCreateMobileMenu(): HTMLDivElement | undefined {
  const header = document.querySelector(".sidebar-header");
  if (!header) return undefined;
  const existing = header.querySelector<HTMLDivElement>("#dbm-mobile-settings-menu");
  if (existing) return existing;

  const menu = document.createElement("div");
  menu.id = "dbm-mobile-settings-menu";
  menu.setAttribute("role", "menu");
  menu.innerHTML = `
    <a role="menuitem" href="./?path=/settings/about">About your Storybook</a>
    <a role="menuitem" href="./?path=/settings/shortcuts">Keyboard shortcuts</a>
    <a role="menuitem" href="https://storybook.js.org/docs/?renderer=react&ref=ui" target="_blank" rel="noopener noreferrer">Documentation <span class="dbm-mobile-settings-menu-external" aria-hidden="true">↗</span></a>
  `;
  header.appendChild(menu);
  return menu;
}

function closeMobileMenu(): void {
  const menu = document.querySelector("#dbm-mobile-settings-menu");
  menu?.classList.remove("dbm-open");
  document.querySelector('a[aria-label="About Storybook"]')?.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu(trigger: Element): void {
  const menu = getOrCreateMobileMenu();
  if (!menu) return;
  const willOpen = !menu.classList.contains("dbm-open");
  menu.classList.toggle("dbm-open", willOpen);
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", String(willOpen));
}

// Delegated (not bound to a specific node, for the same remount-safety
// reason as `getOrCreateMobileMenu`): intercepts taps on the mobile-only
// gear link and opens the popover instead of letting the real navigation
// happen, closes on an outside tap or Escape, same as a standard menu.
//
// **Capture phase, not bubble** — a first attempt on the bubble phase
// still navigated straight to the About page every time. Storybook's own
// click handling for this link lives inside React's delegated listener on
// its root container (a descendant of `document`, ancestor of the link),
// and calls its own `preventDefault`/`stopPropagation` as part of doing
// its client-side route change — which happens *before* a bubble-phase
// listener on `document` ever sees the event (capture runs
// `window → document → … → root` first; by the time bubbling would reach
// `document`, React's own handler already ran and stopped it). Listening
// on `document` in the capture phase runs before React's root-level
// handler gets the event at all, so `stopPropagation` here is what
// actually keeps React's own routing from firing afterward — `preventDefault`
// alone was not enough.
document.addEventListener(
  "click",
  (event) => {
    const target = event.target as Element | null;
    const trigger = target?.closest('a[aria-label="About Storybook"]');
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      toggleMobileMenu(trigger);
      return;
    }
    const menu = document.querySelector("#dbm-mobile-settings-menu.dbm-open");
    if (menu && !menu.contains(target)) {
      closeMobileMenu();
    }
  },
  { capture: true },
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

// Storybook renders `brandImage` inside a flex anchor that fills the full
// sidebar-header width but left-aligns its content by default — centers
// it instead. Targets the anchor by its `title` attribute (set from
// `brandTitle`, a real HTML attribute) rather than an emotion-hashed
// class, since those are regenerated per build and not a stable selector.
// That alone still left the logo off-center (confirmed via computed
// styles): Storybook's own class on the anchor's *wrapping* div sets
// `margin-right: 20px`, with no matching left margin, so the wrapper's
// box itself was never symmetric within the header to begin with —
// `justify-content: center` was correctly centering the image inside a
// lopsided box. `div:has(> a[title="DBM System"])` targets that
// wrapper without an emotion-hashed class (`:has()` is the only way to
// select an ancestor by its child in CSS).
//
// Also relocates the Settings gear from the brand row down onto the
// search row, next to "Create a new story" (requested 2026-08-11, after
// the logo made the brand row visually heavy on its own). Storybook's
// theme/manager API has no option for this — it's a fixed part of the
// sidebar chrome — so this is a CSS-only reposition, not a DOM move: the
// gear button stays exactly where React put it in the tree (moving a
// React-owned node with raw DOM calls would fight React's own
// reconciliation on the next re-render), it's just painted elsewhere.
// `[role="search"]` (Storybook's own landmark role on the search row) and
// `button[aria-label="Settings"]` are both real, stable attributes, not
// emotion-hashed classes. The `calc(100% + 16px)` top offset matches the
// `gap: 16px` Storybook already applies between the two rows via their
// shared flex-column parent (confirmed via computed styles), so this
// stays correct even if the brand row's own height changes; the 38px
// reserved on the search row is the gear's 32px plus a 6px gap — matching
// the row's own native gap between the search input and "Create a new
// story" (confirmed via computed styles), so the gear reads as evenly
// spaced from its neighbor instead of sitting closer or further than the
// input-to-"+" gap.
//
// Mobile drawer (requested 2026-08-11): the same relocation, applied to
// `a[aria-label="About Storybook"]` (see `applyGearButtonStyle` above for
// why that's the mobile equivalent of the Settings button) instead of
// `button[aria-label="Settings"]`. Its own "Create a new story" is 36px
// here (not 32px), so the reserved space is 42px (36 + the same 6px
// native gap, confirmed via computed styles at the mobile viewport) —
// `body:has(...)` distinguishes the two cases without an arbitrary
// max-width breakpoint guess, since Storybook renders one selector or the
// other, never both, and `body` is a stable selector root either way.
//
// The drawer's own "Close menu" button is enlarged (36px -> 44px box,
// 14px -> 18px icon, matching proportions) and pinned flush to the
// drawer's own top-right corner — relative to `.sidebar-header` (already
// `position: relative` above), since that header row is the top of the
// drawer's own content, not the persistent page toolbar above it.
//
// The logo's vertical breathing room is Storybook's own default
// `padding: 2px 3px` on this same `a[title="DBM System"]` anchor
// (confirmed via computed styles) — widened to 20px top/bottom for a
// roomier brand row now that the logo is a wide wordmark rather than the
// old square mark. Left/right stay at Storybook's default 3px; only the
// vertical value was asked for.
const brandChromeStyleEl = document.createElement("style");
brandChromeStyleEl.id = "dbm-brand-chrome-overrides";
brandChromeStyleEl.textContent = `
  a[title="DBM System"] { justify-content: center; padding-top: 20px; padding-bottom: 20px; }
  .sidebar-header div:has(> a[title="DBM System"]) { margin-right: 0; }
  .sidebar-header { position: relative; }

  body:has(button[aria-label="Settings"]) [role="search"] { padding-right: 38px; }
  button[aria-label="Settings"] {
    position: absolute;
    top: calc(100% + 16px);
    right: 0;
  }

  body:has(a[aria-label="About Storybook"]) [role="search"] { padding-right: 42px; }
  a[aria-label="About Storybook"] {
    position: absolute;
    top: calc(100% + 16px);
    right: 0;
  }

  button[aria-label="Close menu"] {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 44px;
    height: 44px;
  }
  button[aria-label="Close menu"] svg {
    width: 18px;
    height: 18px;
  }
`;
document.head.appendChild(brandChromeStyleEl);

addons.setConfig({
  theme: getStorybookTheme(lastBrand, lastMode),
  // Every top-level group but Getting started starts collapsed, so the sidebar opens short. A page in a collapsed group (a link
  // from the site, a bookmark) still opens its own group, which Storybook does for the selected page. The ids are the group names
  // as Storybook writes them (lower case, hyphens).
  sidebar: { collapsedRoots: ["guides", "foundations", "components", "templates"] },
});
applyPanelBg(lastBrand, lastMode);
applyGearButtonStyle(lastBrand, lastMode);
applyMobileMenuStyle(lastBrand, lastMode);

addons.ready().then((channel) => {
  const applyTheme = (globals?: Record<string, unknown>) => {
    if (!globals) return;
    let changed = false;
    if (typeof globals.brand === "string" && globals.brand !== lastBrand) {
      lastBrand = globals.brand;
      changed = true;
    }
    if (typeof globals.mode === "string" && globals.mode !== lastMode) {
      lastMode = globals.mode;
      changed = true;
    }
    if (!changed) return;
    addons.setConfig({ theme: getStorybookTheme(lastBrand, lastMode) });
    applyPanelBg(lastBrand, lastMode);
    applyGearButtonStyle(lastBrand, lastMode);
    applyMobileMenuStyle(lastBrand, lastMode);
  };
  // Only the first `SET_GLOBALS` is trusted (the real init-time sync) — see
  // the fifth bug above for why every later one is a potentially-stale
  // re-fire that must not be allowed to clobber a value `UPDATE_GLOBALS`
  // already applied.
  channel.on(SET_GLOBALS, (payload) => {
    if (hasReceivedInitialSync) return;
    hasReceivedInitialSync = true;
    applyTheme(payload?.globals);
  });
  channel.on(UPDATE_GLOBALS, (payload) => {
    hasReceivedInitialSync = true;
    applyTheme(payload?.globals);
    if (typeof payload?.globals?.mode === "string") rememberMode(payload.globals.mode);
  });
});

// Opening the bare URL (`/`) makes Storybook redirect to the first entry as `?path=/story/<id>`, whatever the entry's
// type. For a docs entry (Foundations → Overview) that leaves the manager in "story" view mode over a docs page, so
// the Controls/Actions/Interactions panel is shown on a page with nothing to control, and it goes away only after
// navigating elsewhere (which uses `/docs/<id>`). Once a docs entry has rendered under a story URL, move to its own.
addons.register("dbm/docs-entry-view-mode", (api) => {
  api.on(DOCS_RENDERED, () => {
    const { viewMode, storyId } = api.getUrlState();
    if (viewMode !== "story" || !storyId) return;
    if (api.getData(storyId)?.type !== "docs") return;
    api.selectStory(storyId);
  });
});
