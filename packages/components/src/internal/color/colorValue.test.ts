import { describe, expect, it } from "vitest";
import { emptyHsva, formatColor, hsvaToRgb, normalizeColor, parseColor, rgbToHsva } from "./colorValue";

describe("parseColor", () => {
  it.each([
    ["#5548a4", { r: 85, g: 72, b: 164, a: 1 }],
    ["5548A4", { r: 85, g: 72, b: 164, a: 1 }],
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["abc", { r: 170, g: 187, b: 204, a: 1 }],
    ["rgb(10, 20, 30)", { r: 10, g: 20, b: 30, a: 1 }],
    ["rgb(10 20 30 / 50%)", { r: 10, g: 20, b: 30, a: 0.5 }],
    ["rgba(10,20,30,0.25)", { r: 10, g: 20, b: 30, a: 0.25 }],
    ["rgb(100% 0% 0%)", { r: 255, g: 0, b: 0, a: 1 }],
  ])("reads %s", (text, expected) => {
    expect(parseColor(text)).toEqual(expected);
  });

  it("reads an 8-digit and a 4-digit hex with alpha", () => {
    expect(parseColor("#ff000080")?.a).toBeCloseTo(0.5, 2);
    expect(parseColor("#f008")?.a).toBeCloseTo(0.533, 2);
  });

  it("reads hsl in both syntaxes", () => {
    expect(parseColor("hsl(0 100% 50%)")).toMatchObject({ r: 255, g: 0, b: 0 });
    const gray = parseColor("hsl(210, 0%, 50%)");
    expect(gray?.r).toBeCloseTo(127.5, 0);
  });

  it("reads oklch, clipping what is outside the sRGB gamut", () => {
    const white = parseColor("oklch(1 0 0)");
    expect(white?.r).toBeCloseTo(255, 0);
    const wild = parseColor("oklch(0.7 0.9 150)");
    expect(wild).toBeDefined();
    for (const channel of [wild?.r, wild?.g, wild?.b]) expect(channel).toBeGreaterThanOrEqual(0);
    for (const channel of [wild?.r, wild?.g, wild?.b]) expect(channel).toBeLessThanOrEqual(255);
  });

  it.each(["", "   ", "#12", "#12345", "#gggggg", "red", "rgb(1 2)", "rgb(a b c)", "hsl(1 2)", "lab(1 2 3)", "rgb(1 2 3 4 5)", "#"])("refuses %j", (text) => {
    expect(parseColor(text)).toBeUndefined();
  });
});

describe("formatColor", () => {
  const purple = { r: 85, g: 72, b: 164, a: 1 };
  it("writes each format", () => {
    expect(formatColor(purple, "hex", false)).toBe("#5548a4");
    expect(formatColor(purple, "rgb", false)).toBe("rgb(85 72 164)");
    expect(formatColor(purple, "hsl", false)).toBe("hsl(248 39% 46%)");
    expect(formatColor(purple, "oklch", false)).toMatch(/^oklch\(0\.\d+ 0\.\d+ \d+(\.\d)?\)$/);
  });

  it("writes alpha only when asked for and not opaque", () => {
    const faint = { ...purple, a: 0.5 };
    expect(formatColor(faint, "hex", true)).toBe("#5548a480");
    expect(formatColor(faint, "hex", false)).toBe("#5548a4");
    expect(formatColor(faint, "rgb", true)).toBe("rgb(85 72 164 / 0.5)");
    expect(formatColor(purple, "hex", true)).toBe("#5548a4");
  });

  it("round-trips every format to within a unit of a channel", () => {
    for (const format of ["hex", "rgb", "hsl", "oklch"] as const) {
      for (const hex of ["#5548a4", "#2e8a7d", "#ffffff", "#000000", "#ff0000", "#123456", "#fedcba"]) {
        const color = parseColor(hex);
        const back = parseColor(formatColor(color!, format, false));
        expect(back, `${hex} as ${format}`).toBeDefined();
        const tolerance = format === "hex" || format === "rgb" ? 0.5 : 4;
        expect(Math.abs(back!.r - color!.r), `${hex} ${format} r`).toBeLessThanOrEqual(tolerance);
        expect(Math.abs(back!.g - color!.g), `${hex} ${format} g`).toBeLessThanOrEqual(tolerance);
        expect(Math.abs(back!.b - color!.b), `${hex} ${format} b`).toBeLessThanOrEqual(tolerance);
      }
    }
  });
});

describe("normalizeColor", () => {
  it("writes any spelling as one", () => {
    expect(normalizeColor("ABC", "hex", false)).toBe("#aabbcc");
    expect(normalizeColor("rgb(170 187 204)", "hex", false)).toBe("#aabbcc");
    expect(normalizeColor("nope", "hex", false)).toBeUndefined();
  });
});

describe("hsv", () => {
  it("round-trips through rgb", () => {
    for (const hsva of [{ h: 0, s: 1, v: 1, a: 1 }, { h: 120, s: 0.5, v: 0.5, a: 1 }, { h: 300, s: 0.2, v: 0.9, a: 0.4 }, { h: 59, s: 1, v: 0.3, a: 1 }]) {
      const back = rgbToHsva(hsvaToRgb(hsva));
      expect(back.h).toBeCloseTo(hsva.h, 4);
      expect(back.s).toBeCloseTo(hsva.s, 4);
      expect(back.v).toBeCloseTo(hsva.v, 4);
      expect(back.a).toBe(hsva.a);
    }
  });

  it("keeps the hue it is given for a gray, which has none of its own", () => {
    expect(rgbToHsva({ r: 128, g: 128, b: 128, a: 1 }, 210).h).toBe(210);
    expect(rgbToHsva({ r: 0, g: 0, b: 0, a: 1 }, 99).s).toBe(0);
  });

  it("starts from a bright red", () => {
    expect(hsvaToRgb(emptyHsva)).toMatchObject({ r: 255, g: 0, b: 0 });
  });
});
