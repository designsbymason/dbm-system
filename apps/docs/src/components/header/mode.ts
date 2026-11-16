// The reader's mode: light or dark, one key on the origin, shared with Storybook (ADR-0214, ADR-0223).
export type SiteMode = "light" | "dark";

export const MODE_KEY = "dbm-mode";

/** The system's own setting, used only to settle a stored "system" from before the toggle (ADR-0223). */
function systemMode(): SiteMode {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * The mode to start in: the stored one, and light on a first visit. A stored "system" is read as light or dark once and
 * replaced by that choice, so it never comes back. The same rule is in `Base.astro`'s inline script, which runs before
 * the first paint.
 */
export function readMode(): SiteMode {
  try {
    const value = localStorage.getItem(MODE_KEY);
    if (value === "light" || value === "dark") return value;
    if (value === "system") {
      const settled = systemMode();
      localStorage.setItem(MODE_KEY, settled);
      return settled;
    }
  } catch {
    // Storage can be blocked; the first visit's light applies.
  }
  return "light";
}

/** Applies a mode, with a short reveal from `origin` when the browser and the reader allow motion. */
export function applyMode(mode: SiteMode, origin?: { x: number; y: number }) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not remembered, but still applied.
  }
  const root = document.documentElement;
  const theme = mode === "dark" ? "purple-dark" : "purple-light";
  const update = () => {
    root.dataset.theme = theme;
    root.dataset.mode = mode;
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (root.dataset.theme === theme || reduce || !("startViewTransition" in document)) {
    update();
    return;
  }
  if (origin) {
    root.style.setProperty("--reveal-x", `${origin.x}px`);
    root.style.setProperty("--reveal-y", `${origin.y}px`);
  }
  root.dataset.modeTransition = "";
  const transition = document.startViewTransition(update);
  transition.finished.finally(() => delete root.dataset.modeTransition);
}
