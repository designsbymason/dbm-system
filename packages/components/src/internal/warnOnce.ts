const warned = new Set<string>();

/**
 * Warns once per message, in development only: an invalid combination of props that a component then ignores (`05` §3, `06` §3).
 * It is held outside any component so a component rendered again does not repeat itself; nothing is kept in production, where the
 * call does nothing.
 */
export function warnOnce(message: string): void {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
