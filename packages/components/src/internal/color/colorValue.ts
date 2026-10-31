// Color maths for `ColorPicker`: parsing, conversion between sRGB, HSV, HSL and OKLCH, and writing a color back as text.
// Hand-rolled and dependency-free (ADR-0153). Every function is pure, so it runs the same on a server and a client.

/** A color in sRGB: channels 0-255 (not necessarily whole), alpha 0-1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A color as the picker holds it: hue 0-360, saturation and value 0-1, alpha 0-1. Hue survives a gray, which RGB can't. */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** The text a color is written as. */
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const roundTo = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};
const wrapHue = (hue: number) => ((hue % 360) + 360) % 360;

/** The color a picker shows before anything is chosen: red, fully saturated and bright, opaque. */
export const emptyHsva: Hsva = { h: 0, s: 1, v: 1, a: 1 };

export function rgbToHsva({ r, g, b, a }: Rgba, previousHue = 0): Hsva {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = previousHue;
  if (delta > 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h = wrapHue(h * 60);
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max, a };
}

export function hsvaToRgb({ h, s, v, a }: Hsva): Rgba {
  const hue = wrapHue(h) / 60;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const base = v - chroma;
  const [red, green, blue] =
    hue < 1 ? [chroma, x, 0] : hue < 2 ? [x, chroma, 0] : hue < 3 ? [0, chroma, x] : hue < 4 ? [0, x, chroma] : hue < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return { r: (red + base) * 255, g: (green + base) * 255, b: (blue + base) * 255, a };
}

function rgbToHsl({ r, g, b }: Rgba): { h: number; s: number; l: number } {
  const { h, s, v } = rgbToHsva({ r, g, b, a: 1 });
  const l = v * (1 - s / 2);
  return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
}

function hslToRgb(h: number, s: number, l: number, a: number): Rgba {
  const v = l + s * Math.min(l, 1 - l);
  return hsvaToRgb({ h, s: v === 0 ? 0 : 2 * (1 - l / v), v, a });
}

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const fromLinear = (channel: number) => (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);

function rgbToOklch({ r, g, b }: Rgba): { l: number; c: number; h: number } {
  const red = toLinear(r / 255);
  const green = toLinear(g / 255);
  const blue = toLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  return { l: lightness, c: chroma, h: chroma < 1e-4 ? 0 : wrapHue((Math.atan2(bAxis, a) * 180) / Math.PI) };
}

function oklchToLinear(lightness: number, chroma: number, hue: number): [number, number, number] {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

const inGamut = (channels: [number, number, number]) => channels.every((channel) => channel >= -1e-6 && channel <= 1 + 1e-6);

/** An OKLCH color in sRGB. One outside the sRGB gamut loses chroma until it fits (the hue and lightness are kept). */
function oklchToRgb(lightness: number, chroma: number, hue: number, alpha: number): Rgba {
  const l = clamp(lightness, 0, 1);
  let channels = oklchToLinear(l, chroma, hue);
  if (!inGamut(channels)) {
    let low = 0;
    let high = chroma;
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2;
      if (inGamut(oklchToLinear(l, middle, hue))) low = middle;
      else high = middle;
    }
    channels = oklchToLinear(l, low, hue);
  }
  const [r, g, b] = channels.map((channel) => clamp(fromLinear(clamp(channel, 0, 1)) * 255, 0, 255)) as [number, number, number];
  return { r, g, b, a: alpha };
}

const hexPair = (channel: number) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0");

/** A number or percentage of `basis`: "50%" of 255 is 127.5; "0.5" stays 0.5 when `basis` is 1. */
function readAmount(text: string, basis: number): number | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  if (trimmed.toLowerCase() === "none") return 0;
  const percent = trimmed.endsWith("%");
  const number = Number(percent ? trimmed.slice(0, -1) : trimmed);
  if (!Number.isFinite(number)) return undefined;
  return percent ? (number / 100) * basis : number;
}

function readHue(text: string): number | undefined {
  const lower = text.trim().toLowerCase();
  if (lower === "none") return 0;
  const units: Array<[string, number]> = [["deg", 1], ["grad", 0.9], ["rad", 180 / Math.PI], ["turn", 360]];
  for (const [unit, factor] of units) {
    if (lower.endsWith(unit)) {
      const number = Number(lower.slice(0, -unit.length));
      return Number.isFinite(number) ? wrapHue(number * factor) : undefined;
    }
  }
  const number = Number(lower);
  return Number.isFinite(number) ? wrapHue(number) : undefined;
}

function readAlpha(text: string | undefined): number | undefined {
  if (text === undefined) return 1;
  const alpha = readAmount(text, 1);
  return alpha === undefined ? undefined : clamp(alpha, 0, 1);
}

function parseHex(text: string): Rgba | undefined {
  const digits = text.startsWith("#") ? text.slice(1) : text;
  if (!/^[0-9a-f]+$/i.test(digits) || ![3, 4, 6, 8].includes(digits.length)) return undefined;
  const full = digits.length <= 4 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const channel = (index: number) => Number.parseInt(full.slice(index * 2, index * 2 + 2), 16);
  return { r: channel(0), g: channel(1), b: channel(2), a: full.length === 8 ? channel(3) / 255 : 1 };
}

/**
 * Reads a color written as hex (`#abc`, `abc`, `#aabbcc`, `#aabbccdd`) or as a CSS `rgb()`, `rgba()`, `hsl()`, `hsla()` or
 * `oklch()` function, in the comma or the space and slash syntax. `undefined` for anything else, a color name included.
 */
export function parseColor(input: string): Rgba | undefined {
  const text = input.trim();
  if (text === "") return undefined;
  const call = /^([a-z]+)\(([^)]*)\)$/i.exec(text);
  if (!call) return parseHex(text);
  const name = (call[1] as string).toLowerCase();
  const parts = (call[2] as string)
    .split(/[\s,/]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length < 3 || parts.length > 4) return undefined;
  const alpha = readAlpha(parts[3]);
  if (alpha === undefined) return undefined;
  if (name === "rgb" || name === "rgba") {
    const channels = parts.slice(0, 3).map((part) => readAmount(part, 255));
    if (channels.some((channel) => channel === undefined)) return undefined;
    const [r, g, b] = channels.map((channel) => clamp(channel as number, 0, 255)) as [number, number, number];
    return { r, g, b, a: alpha };
  }
  if (name === "hsl" || name === "hsla") {
    const hue = readHue(parts[0] as string);
    const saturation = readAmount(parts[1] as string, 1);
    const lightness = readAmount(parts[2] as string, 1);
    if (hue === undefined || saturation === undefined || lightness === undefined) return undefined;
    // "hsl(210 50 40)" without percent signs is the legacy-free reading of 50% and 40%.
    const scale = (value: number, text: string) => (text.trim().endsWith("%") ? value : value / 100);
    return hslToRgb(hue, clamp(scale(saturation, parts[1] as string), 0, 1), clamp(scale(lightness, parts[2] as string), 0, 1), alpha);
  }
  if (name === "oklch") {
    const lightness = readAmount(parts[0] as string, 1);
    const chroma = readAmount(parts[1] as string, 0.4);
    const hue = readHue(parts[2] as string);
    if (lightness === undefined || chroma === undefined || hue === undefined) return undefined;
    return oklchToRgb(lightness, Math.max(0, chroma), hue, alpha);
  }
  return undefined;
}

/** A color as text in `format`. Alpha is written only when `alpha` is on and the color is not opaque. */
export function formatColor(color: Rgba, format: ColorFormat, alpha: boolean): string {
  const opacity = alpha ? clamp(color.a, 0, 1) : 1;
  const alphaText = opacity < 1 ? ` / ${roundTo(opacity, 2)}` : "";
  const r = Math.round(clamp(color.r, 0, 255));
  const g = Math.round(clamp(color.g, 0, 255));
  const b = Math.round(clamp(color.b, 0, 255));
  switch (format) {
    case "rgb":
      return `rgb(${r} ${g} ${b}${alphaText})`;
    case "hsl": {
      const { h, s, l } = rgbToHsl({ r, g, b, a: 1 });
      return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%${alphaText})`;
    }
    case "oklch": {
      const { l, c, h } = rgbToOklch({ r, g, b, a: 1 });
      return `oklch(${roundTo(l, 3)} ${roundTo(c, 3)} ${roundTo(h, 1)}${alphaText})`;
    }
    default:
      return `#${hexPair(r)}${hexPair(g)}${hexPair(b)}${opacity < 1 ? hexPair(opacity * 255) : ""}`;
  }
}

/** Reads `input` and writes it back in `format`: the one spelling a value is held and compared as. `undefined` if it isn't a color. */
export function normalizeColor(input: string, format: ColorFormat, alpha: boolean): string | undefined {
  const color = parseColor(input);
  return color ? formatColor(color, format, alpha) : undefined;
}
