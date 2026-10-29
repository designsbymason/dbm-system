/** A length token such as `2.25rem` in pixels, or `undefined` when it can't be read (a server render). */
export function readLengthToken(name: string): number | undefined {
  if (typeof document === "undefined") return undefined;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return undefined;
  if (raw.endsWith("rem")) return value * Number.parseFloat(root.fontSize);
  return raw.endsWith("px") ? value : undefined;
}
