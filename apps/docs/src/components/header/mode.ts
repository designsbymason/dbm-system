// The reader's mode: one key on the origin, shared with Storybook (ADR-0214).
export type SiteMode = "light" | "dark" | "system";

export const MODE_KEY = "dbm-mode";

export function readMode(): SiteMode {
  try {
    const value = localStorage.getItem(MODE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // Storage can be blocked; the system preference still applies.
  }
  return "system";
}

function themeFor(mode: SiteMode): string {
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  return dark ? "purple-dark" : "purple-light";
}

/** Applies a mode, with a short reveal from `origin` when the browser and the reader allow motion. */
export function applyMode(mode: SiteMode, origin?: { x: number; y: number }) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not remembered, but still applied.
  }
  const root = document.documentElement;
  const theme = themeFor(mode);
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
