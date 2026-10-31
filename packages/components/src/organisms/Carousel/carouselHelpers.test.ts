import { describe, expect, it } from "vitest";
import {
  canLoop,
  clampIndex,
  computeStops,
  edgeOf,
  indexFromGeometry,
  lastIndex,
  neighbourStop,
  nearestStop,
  offsetFrom,
  resolveLabels,
  scrollDelta,
  slidesOutside,
  slidesTouched,
  viewSize,
  wholeNumber,
  wrapStep,
} from "./carouselHelpers";

const rect = (left: number, top = 0, width = 100, height = 100) => ({ left, top, right: left + width, bottom: top + height }) as DOMRect;
const plain = (count: number, perView: number) => ({ count, perView, loop: false, center: false });

describe("view size", () => {
  it("allows a fraction and never goes below one", () => {
    expect(viewSize(1.5, 1)).toBe(1.5);
    expect(viewSize(0.3, 1)).toBe(1);
    expect(viewSize(Number.NaN, 2)).toBe(2);
    expect(viewSize("3", 2)).toBe(2);
  });
  it("counts the slides a fraction touches", () => {
    expect(slidesTouched(1.5)).toBe(2);
    expect(slidesTouched(3)).toBe(3);
  });
});

describe("lastIndex and computeStops", () => {
  it("is every slide when one is in view and one moves at a time", () => {
    expect(computeStops(plain(4, 1), 1)).toEqual([0, 1, 2, 3]);
  });
  it("ends on the last place the view can reach, so the final slides are never skipped", () => {
    expect(computeStops(plain(8, 3), 3)).toEqual([0, 3, 5]);
    expect(computeStops(plain(6, 3), 3)).toEqual([0, 3]);
  });
  it("counts the slide a fractional view cuts", () => {
    expect(lastIndex(plain(5, 1.5))).toBe(3);
  });
  it("has a single position when everything fits", () => {
    expect(computeStops(plain(2, 3), 1)).toEqual([0]);
    expect(computeStops(plain(0, 1), 1)).toEqual([0]);
  });
  it("lets any slide be the value when the view wraps or is centred, stepping from the start", () => {
    expect(lastIndex({ count: 5, perView: 2, loop: true, center: false })).toBe(4);
    expect(computeStops({ count: 5, perView: 2, loop: true, center: false }, 2)).toEqual([0, 2, 4]);
    expect(computeStops({ count: 4, perView: 1.5, loop: false, center: true }, 1)).toEqual([0, 1, 2, 3]);
  });
});

describe("canLoop", () => {
  it("needs more slides than are in view", () => {
    expect(canLoop(3, 1, true)).toBe(true);
    expect(canLoop(3, 3, true)).toBe(false);
    expect(canLoop(3, 1.5, true)).toBe(true);
    expect(canLoop(3, 2.5, true)).toBe(false);
    expect(canLoop(5, 1, false)).toBe(false);
  });
});

describe("index helpers", () => {
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

describe("neighbourStop and wrapStep", () => {
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
  it("steps round a wrapping carousel in both directions", () => {
    expect(wrapStep(4, 1, 1, 5)).toBe(0);
    expect(wrapStep(0, -1, 1, 5)).toBe(4);
    expect(wrapStep(3, 1, 3, 5)).toBe(1);
  });
});

describe("offsetFrom and slidesOutside", () => {
  it("goes the short way round a wrapping carousel", () => {
    expect(offsetFrom(0, 4, 5, true)).toBe(1);
    expect(offsetFrom(4, 0, 5, true)).toBe(-1);
    expect(offsetFrom(4, 0, 5, false)).toBe(4);
  });
  const view = (over = {}) => ({ count: 8, perView: 3, loop: false, center: false, value: 2, peek: false, ...over });
  it("is zero for the slides in view, and counts the ones outside", () => {
    expect([1, 2, 3, 4, 5, 6].map((index) => slidesOutside(index, view()))).toEqual([1, 0, 0, 0, 1, 2]);
  });
  it("counts the peeking slide as in view, and a fractional view's cut slide", () => {
    expect(slidesOutside(5, view({ peek: true }))).toBe(0);
    expect([2, 3, 4].map((index) => slidesOutside(index, view({ perView: 1.5 })))).toEqual([0, 0, 1]);
  });
  it("wraps: the first slides are near the end of a looping view", () => {
    expect([7, 0, 1, 2].map((index) => slidesOutside(index, view({ loop: true, value: 6 })))).toEqual([0, 0, 1, 2]);
  });
  it("measures from the middle when centred", () => {
    const centred = (index: number, perView: number) => slidesOutside(index, view({ center: true, perView, value: 4 }));
    expect([3, 4, 5].map((index) => centred(index, 1.5))).toEqual([0, 0, 0]);
    expect([2, 6].map((index) => centred(index, 1.5))).toEqual([1, 1]);
    expect([3, 5].map((index) => centred(index, 1))).toEqual([1, 1]);
  });
});

describe("edgeOf and scrollDelta", () => {
  it("is the gap between aligned edges along the axis", () => {
    expect(scrollDelta(rect(10), rect(310), "inline", false, "start")).toBe(300);
    expect(scrollDelta(rect(0, 20), rect(0, 220), "block", false, "start")).toBe(200);
  });
  it("measures from the right edges in right-to-left", () => {
    expect(scrollDelta(rect(0), rect(-300), "inline", true, "start")).toBe(-300);
  });
  it("aligns middles when centred", () => {
    expect(edgeOf(rect(0, 0, 200, 50), "inline", false, "center")).toBe(100);
    expect(scrollDelta(rect(0, 0, 400, 100), rect(500, 0, 100, 100), "inline", false, "center")).toBe(350);
    expect(edgeOf(rect(0, 10, 50, 100), "block", false, "center")).toBe(60);
  });
});

describe("indexFromGeometry", () => {
  it("is the slide nearest the track's aligned edge", () => {
    expect(indexFromGeometry({ edges: [-210, -10, 190, 390], trackEdge: 0, atEnd: false, max: 3 })).toBe(1);
  });
  it("is the last position at the end of the track, whatever sits nearest the edge", () => {
    expect(indexFromGeometry({ edges: [-410, -210, -10, 190], trackEdge: 0, atEnd: true, max: 2 })).toBe(2);
  });
  it("never goes past the last position", () => {
    expect(indexFromGeometry({ edges: [-600, -400, 0], trackEdge: 0, atEnd: false, max: 1 })).toBe(1);
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
