import { describe, expect, it } from "vitest";
import { RESIST_MAX, actualScale, clamp, clampView, fitSize, neighbour, panLimits, rubberBand, stepScale, turn, wheelFactor, zoomAt } from "./imageViewerMath";

const stage = { width: 1000, height: 600 };

describe("fitSize", () => {
  it("fits the whole image in the stage, keeping its shape", () => {
    expect(fitSize({ width: 2000, height: 1000 }, stage, 0)).toEqual({ width: 1000, height: 500 });
    expect(fitSize({ width: 1000, height: 2000 }, stage, 0)).toEqual({ width: 300, height: 600 });
  });

  it("never draws an image larger than its own pixels", () => {
    expect(fitSize({ width: 200, height: 100 }, stage, 0)).toEqual({ width: 200, height: 100 });
  });

  it("fits the turned image when it is on its side", () => {
    // 2000 x 1000 turned a quarter is 1000 x 2000, so the height of the stage limits it
    const fitted = fitSize({ width: 2000, height: 1000 }, stage, 90);
    expect(fitted.width).toBeCloseTo(600, 5);
    expect(fitted.height).toBeCloseTo(300, 5);
    expect(fitSize({ width: 2000, height: 1000 }, stage, 180)).toEqual({ width: 1000, height: 500 });
    expect(fitSize({ width: 2000, height: 1000 }, stage, 270)).toEqual(fitted);
  });

  it("gives nothing for a size that is not known", () => {
    expect(fitSize({ width: 0, height: 100 }, stage, 0)).toEqual({ width: 0, height: 0 });
    expect(fitSize({ width: 100, height: 100 }, { width: 0, height: 0 }, 0)).toEqual({ width: 0, height: 0 });
  });
});

describe("panLimits and clampView", () => {
  const fitted = { width: 1000, height: 500 };

  it("allows no movement while the image is inside the stage", () => {
    expect(panLimits(fitted, stage, 1, 0)).toEqual({ x: 0, y: 0 });
  });

  it("allows the overhang on each side once it is larger than the stage", () => {
    expect(panLimits(fitted, stage, 2, 0)).toEqual({ x: 500, y: 200 });
  });

  it("swaps the axes for an image on its side", () => {
    expect(panLimits(fitted, stage, 2, 90)).toEqual({ x: 0, y: 700 });
  });

  it("keeps a view inside its zoom bounds and the stage", () => {
    expect(clampView({ scale: 10, x: 9999, y: -9999 }, fitted, stage, 0, 1, 4)).toEqual({ scale: 4, x: 1500, y: -700 });
    expect(clampView({ scale: 0.2, x: 50, y: 50 }, fitted, stage, 0, 1, 4)).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("zoomAt", () => {
  it("keeps the point under the pointer where it was", () => {
    const view = { scale: 1, x: 0, y: 0 };
    const next = zoomAt(view, 2, 100, 40);
    // the image point at (100, 40) before is at (100 - x) / scale after
    expect((100 - next.x) / next.scale).toBeCloseTo(100, 8);
    expect((40 - next.y) / next.scale).toBeCloseTo(40, 8);
  });

  it("zooms about the centre when the point is the centre", () => {
    expect(zoomAt({ scale: 1, x: 0, y: 0 }, 3, 0, 0)).toEqual({ scale: 3, x: 0, y: 0 });
  });
});

describe("stepScale", () => {
  it("steps by a factor and stays within bounds", () => {
    expect(stepScale(1, 1, 1.5, 1, 4)).toBe(1.5);
    expect(stepScale(3, 1, 1.5, 1, 4)).toBe(4);
    expect(stepScale(4, -1, 2, 1, 4)).toBe(2);
  });

  it("lands exactly on 1 when it comes within a hair of it", () => {
    expect(stepScale(1.499, -1, 1.5, 1, 4)).toBe(1);
    expect(stepScale(1.2, -1, 1.5, 1, 4)).toBe(1);
  });
});

describe("wheelFactor", () => {
  it("zooms in on a negative delta and out on a positive one", () => {
    expect(wheelFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelFactor(100, 0, false)).toBeLessThan(1);
  });

  it("is finer for a trackpad pinch, and reads lines and pages as pixels", () => {
    expect(Math.abs(Math.log(wheelFactor(-10, 0, true)))).toBeGreaterThan(Math.abs(Math.log(wheelFactor(-10, 0, false))));
    expect(wheelFactor(-1, 1, false)).toBeCloseTo(wheelFactor(-16, 0, false), 10);
    expect(wheelFactor(-1, 2, false)).toBeCloseTo(wheelFactor(-400, 0, false), 10);
  });
});

describe("turn and neighbour", () => {
  it("keeps a rotation within one turn, either way", () => {
    expect(turn(270, 90)).toBe(0);
    expect(turn(0, -90)).toBe(270);
    expect(turn(90, 180)).toBe(270);
  });

  it("finds the next and previous index, wrapping only when asked", () => {
    expect(neighbour(2, 1, 3, false)).toBeNull();
    expect(neighbour(0, -1, 3, false)).toBeNull();
    expect(neighbour(2, 1, 3, true)).toBe(0);
    expect(neighbour(0, -1, 3, true)).toBe(2);
    expect(neighbour(1, 1, 3, false)).toBe(2);
    expect(neighbour(0, 1, 1, true)).toBeNull();
    expect(neighbour(0, 1, 0, true)).toBeNull();
  });

  it("clamps", () => {
    expect(clamp(5, 1, 4)).toBe(4);
    expect(clamp(-5, 1, 4)).toBe(1);
  });
});

describe("rubberBand and actualScale", () => {
  it("leaves a position inside its limit alone", () => {
    expect(rubberBand(30, 100)).toBe(30);
    expect(rubberBand(-100, 100)).toBe(-100);
  });

  it("follows past the edge a shorter way each time, never past RESIST_MAX, in either direction", () => {
    const small = rubberBand(110, 100) - 100;
    const large = rubberBand(300, 100) - 100;
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(10);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThan(RESIST_MAX);
    expect(rubberBand(1e9, 100) - 100).toBeLessThanOrEqual(RESIST_MAX);
    expect(rubberBand(-300, 100)).toBe(-rubberBand(300, 100));
  });

  it("gives the scale at which an image pixel is a screen pixel", () => {
    expect(actualScale(0.5)).toBe(2);
    expect(actualScale(1)).toBe(1);
    expect(actualScale(0)).toBe(1);
  });
});
