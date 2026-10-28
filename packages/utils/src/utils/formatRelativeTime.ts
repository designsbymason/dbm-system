/** Options for {@link formatRelativeTime}. */
export interface RelativeTimeOptions {
  /**
   * The moment to measure from. Pass it when the same "now" must be used for many values or for a test; otherwise the
   * current time is read when the function is called.
   * @default The current time
   */
  now?: Date | number;
  /**
   * The language to write in (a BCP 47 tag such as `"fr"`). Never read from the browser, so a server render and the
   * browser write the same words.
   * @default 'en'
   */
  locale?: string | string[];
  /**
   * `"auto"` writes "yesterday" and "tomorrow" where a language has such words; `"always"` writes "1 day ago".
   * @default 'auto'
   */
  numeric?: "always" | "auto";
  /**
   * How much to abbreviate: `"long"` ("2 hours ago"), `"short"` ("2 hr. ago") or `"narrow"`.
   * @default 'long'
   */
  style?: "long" | "short" | "narrow";
}

// The bundler of the app that uses this replaces `process.env.NODE_ENV`; this package carries no Node typings of its own.
declare const process: { env: { NODE_ENV?: string } };

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** The largest unit that fits the distance, and the distance in it, cut towards zero. */
function pick(distance: number): [Intl.RelativeTimeFormatUnit, number] {
  const size = Math.abs(distance);
  if (size < MINUTE) return ["second", Math.trunc(distance / SECOND)];
  if (size < HOUR) return ["minute", Math.trunc(distance / MINUTE)];
  if (size < DAY) return ["hour", Math.trunc(distance / HOUR)];
  if (size < WEEK) return ["day", Math.trunc(distance / DAY)];
  if (size < MONTH) return ["week", Math.trunc(distance / WEEK)];
  if (size < YEAR) return ["month", Math.trunc(distance / MONTH)];
  return ["year", Math.trunc(distance / YEAR)];
}

/**
 * Writes how long ago (or how far ahead) a moment is, as words: "just now" as "now", "5 minutes ago", "yesterday",
 * "in 3 weeks". A small helper for the text a `Timeline` event's `time` shows, built on the browser's own
 * `Intl.RelativeTimeFormat` with the language you name (never the browser's own, so a server render and the browser
 * agree) and no dependency.
 *
 * It writes one value once: it does not tick. A value read on the server and again in the browser may differ by the time
 * between them, so render it where that does not matter or from an effect. Returns `""` (with a warning in development)
 * for a value that is not a valid date.
 *
 * @example
 * ```tsx
 * <Timeline.Item title="Shipped" time={formatRelativeTime(shippedAt)} dateTime={shippedAt} />
 * formatRelativeTime(Date.now() - 2 * 60 * 60 * 1000); // "2 hours ago"
 * formatRelativeTime(tomorrow, { locale: "fr" }); // "demain"
 * ```
 */
export function formatRelativeTime(value: Date | number | string, options: RelativeTimeOptions = {}): string {
  const { now = Date.now(), locale = "en", numeric = "auto", style = "long" } = options;
  const time = new Date(value).getTime();
  const from = new Date(now).getTime();
  if (Number.isNaN(time) || Number.isNaN(from)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`formatRelativeTime: "${String(value)}" is not a valid date, so it is written as an empty string.`);
    }
    return "";
  }
  const [unit, amount] = pick(time - from);
  // `Math.trunc` can give a negative zero, which would be written as "in 0 seconds"; say "now" instead.
  return new Intl.RelativeTimeFormat(locale, { numeric, style }).format(amount === 0 ? 0 : amount, unit);
}
