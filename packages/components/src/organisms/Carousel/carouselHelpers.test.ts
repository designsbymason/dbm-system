import { describe, expect, it } from "vitest";
import { clampIndex, computeStops, indexFromGeometry, lastStart, neighbourStop, nearestStop, resolveLabels, scrollDelta, wholeNumber } from "./carouselHelpers";

const rect = (left: number, top = 0, width = 100, height = 100) => ({ left, top, right: left + width, bottom: top + height }) as DOMRect;

describe("computeStops", () => {
  it("is every slide when one is in view and one moves at a time", () => {
    expect(computeStops(4, 1, 1)).toEqual([0, 1, 2, 3]);
  });
  it("ends on the last place the view can reach, so the final slides are never skipped", () => {
    expect(computeStops(8, 3, 3)).toEqual([0, 3, 5]);
    expect(computeStops(6, 3, 3)).toEqual([0, 3]);
  });
  it("has a single position when everything fits", () => {
    expect(computeStops(2, 3, 1)).toEqual([0]);
    expect(computeStops(0, 1, 1)).toEqual([0]);
  });
});

describe("index helpers", () => {
  it("finds the last start", () => {
    expect(lastStart(8, 3)).toBe(5);
    expect(lastStart(2, 3)).toBe(0);
  });
  it("finds the nearest stop, the earlier one on a tie", () => {
    expect(nearestStop([0, 3, 5], 4)).toBe(1);
    expect(nearestStop([0, 2], 1)).toBe(0);
  });
  it("clamps and rounds an index, reading a non-number as the start", () => {
    expect(clampIndex(9, 4)).toBe(4);
    expect(clampIndex(-3, 4)).toBe(0);
    expect(clampIndex(1.6, 4)).toBe(2);
    expect(clampIndex(Number.NaN, 4)).toBe(0);
  });
  it("reads a count as a whole number from a floor", () => {
    expect(wholeNumber(2.9, 1, 1)).toBe(2);
    expect(wholeNumber(0, 1, 1)).toBe(1);
    expect(wholeNumber(Number.POSITIVE_INFINITY, 5, 1)).toBe(5);
    expect(wholeNumber("3", 5, 1)).toBe(5);
  });
});

describe("neighbourStop", () => {
  const stops = [0, 2, 4];
  it("moves along the stops", () => {
    expect(neighbourStop(stops, 0, 1, false)).toBe(2);
    expect(neighbourStop(stops, 2, -1, false)).toBe(2);
  });
  it("has nowhere to go at an end without wrap, and wraps with it", () => {
    expect(neighbourStop(stops, 2, 1, false)).toBeUndefined();
    expect(neighbourStop(stops, 0, -1, false)).toBeUndefined();
    expect(neighbourStop(stops, 2, 1, true)).toBe(0);
    expect(neighbourStop(stops, 0, -1, true)).toBe(4);
  });
  it("has nowhere to go from a single position", () => {
    expect(neighbourStop([0], 0, 1, true)).toBeUndefined();
  });
});

describe("scrollDelta", () => {
  it("is the gap between start edges along the axis", () => {
    expect(scrollDelta(rect(10), rect(310), "inline", false)).toBe(300);
    expect(scrollDelta(rect(0, 20), rect(0, 220), "block", false)).toBe(200);
  });
  it("measures from the right edges in right-to-left", () => {
    expect(scrollDelta(rect(0), rect(-300), "inline", true)).toBe(-300);
  });
});

describe("indexFromGeometry", () => {
  it("is the slide nearest the track's start edge", () => {
    expect(indexFromGeometry({ starts: [-210, -10, 190, 390], trackStart: 0, atEnd: false, max: 3 })).toBe(1);
  });
  it("is the last position at the end of the track, whatever sits nearest the edge", () => {
    expect(indexFromGeometry({ starts: [-410, -210, -10, 190], trackStart: 0, atEnd: true, max: 2 })).toBe(2);
  });
  it("never goes past the last position", () => {
    expect(indexFromGeometry({ starts: [-600, -400, 0], trackStart: 0, atEnd: false, max: 1 })).toBe(1);
  });
});

describe("resolveLabels", () => {
  it("writes the defaults through formatNumber", () => {
    const labels = resolveLabels((n) => `<${n}>`);
    expect(labels.slide(2, 5)).toBe("<2> of <5>");
    expect(labels.announcement(2, 2, 5)).toBe("Slide <2> of <5>");
    expect(labels.announcement(2, 3, 5)).toBe("Slides <2> to <3> of <5>");
    expect(labels.indicator(4, 5)).toBe("Go to slide <4>");
  });
  it("keeps a default whose override is undefined", () => {
    const labels = resolveLabels(String, { next: undefined, previous: "Back" });
    expect(labels.next).toBe("Next slide");
    expect(labels.previous).toBe("Back");
  });
});
