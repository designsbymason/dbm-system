import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { canEnter, defaultLabelsFor, derivedStatus, revealInline, titleText } from "./stepperHelpers";
import { StepperStep } from "./StepperStep";

describe("canEnter", () => {
  it("allows nothing without interactive, and never the current step", () => {
    expect(canEnter("none", "complete", 0, 2, 2)).toBe(false);
    expect(canEnter("all", "current", 2, 2, 2)).toBe(false);
    expect(canEnter("completed", "current", 2, 2, 2)).toBe(false);
  });

  it("allows every other step with interactive=all", () => {
    expect(canEnter("all", "upcoming", 5, 1, 1)).toBe(true);
  });

  it("allows, with interactive=completed, every step up to the furthest reached and any marked complete", () => {
    expect(canEnter("completed", "error", 0, 2, 3)).toBe(true);
    expect(canEnter("completed", "upcoming", 3, 1, 3)).toBe(true);
    expect(canEnter("completed", "upcoming", 4, 1, 3)).toBe(false);
    expect(canEnter("completed", "complete", 4, 1, 3)).toBe(true);
    expect(canEnter("completed", "started", 4, 1, 3)).toBe(true);
  });
});

describe("titleText", () => {
  it("prefers textValue, then a string or number title, and is empty for anything else", () => {
    expect(titleText({ title: "Shipping" })).toBe("Shipping");
    expect(titleText({ title: 3 })).toBe("3");
    expect(titleText({ title: "Shipping", textValue: "Ship" })).toBe("Ship");
    expect(titleText({ title: createElement("em") })).toBe("");
    expect(titleText({ title: createElement("em"), textValue: "Ship" })).toBe("Ship");
  });
});

describe("derivedStatus", () => {
  const step = (status?: "error") => createElement(StepperStep, { value: "a", title: "A", status });
  it("is finished before the current step, current at it and not started after", () => {
    expect(derivedStatus(step(), 0, 1)).toBe("complete");
    expect(derivedStatus(step(), 1, 1)).toBe("current");
    expect(derivedStatus(step(), 2, 1)).toBe("upcoming");
    expect(derivedStatus(step(), 0, -1)).toBe("upcoming");
  });

  it("takes the step's own status over it", () => {
    expect(derivedStatus(step("error"), 0, 1)).toBe("error");
  });
});

describe("derivedStatus with interactive=completed", () => {
  const step = (status?: "complete") => createElement(StepperStep, { value: "a", title: "A", status });
  it("keeps the steps passed on the way finished, and the furthest one reached, if not completed, started", () => {
    // Went as far as step 3 (index 3), came back to step 1.
    const statuses = [0, 1, 2, 3, 4].map((index) => derivedStatus(step(), index, 1, 3, "completed"));
    expect(statuses).toEqual(["complete", "current", "complete", "started", "upcoming"]);
  });

  it("shows nothing as started when the current step is the furthest, or without interactive=completed", () => {
    expect(derivedStatus(step(), 2, 2, 2, "completed")).toBe("current");
    expect([2, 3].map((index) => derivedStatus(step(), index, 1, 3, "all"))).toEqual(["upcoming", "upcoming"]);
    expect([2, 3].map((index) => derivedStatus(step(), index, 1, 3, "none"))).toEqual(["upcoming", "upcoming"]);
  });

  it("takes a step's own status over started", () => {
    expect(derivedStatus(step("complete"), 3, 1, 3, "completed")).toBe("complete");
  });
});

describe("defaultLabelsFor", () => {
  it("writes English, with the numbers through the formatter", () => {
    const labels = defaultLabelsFor((n) => `<${n}>`);
    expect(labels.stepOf(2, 4)).toBe("Step <2> of <4>");
    expect(labels.place(2, 4)).toBe("<2>/<4>");
    expect(labels.summary(2, 4, "Shipping")).toBe("Step <2> of <4> — Shipping");
    expect(labels.summary(2, 4, "")).toBe("Step <2> of <4>");
    expect(labels.announcement(2, 4, "Shipping")).toBe("Step <2> of <4>: Shipping");
    expect(labels.statusText(2, 4, ["current", "in progress"])).toBe(" (Step <2> of <4>, current, in progress)");
  });

  it("builds the place-quoting labels on a given stepOf", () => {
    const labels = defaultLabelsFor(String, (n, total) => `${n}/${total}!`);
    expect(labels.summary(1, 2, "A")).toBe("1/2! — A");
  });
});

describe("revealInline", () => {
  const rect = (left: number, right: number, size = 20): DOMRect =>
    ({ left, right, width: size, height: size, top: 0, bottom: size, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;
  const make = (scroller: DOMRect, element: DOMRect) => {
    const scrollerNode = document.createElement("div");
    const elementNode = document.createElement("div");
    scrollerNode.getBoundingClientRect = () => scroller;
    elementNode.getBoundingClientRect = () => element;
    const scrollBy = vi.fn();
    scrollerNode.scrollBy = scrollBy as unknown as typeof scrollerNode.scrollBy;
    return { scrollerNode, elementNode, scrollBy };
  };

  it("scrolls left by how far the element sticks out of the start, and right by how far out of the end", () => {
    const left = make(rect(100, 300), rect(80, 120));
    revealInline(left.scrollerNode, left.elementNode);
    expect(left.scrollBy).toHaveBeenCalledWith({ left: -20 });
    const right = make(rect(100, 300), rect(280, 330));
    revealInline(right.scrollerNode, right.elementNode);
    expect(right.scrollBy).toHaveBeenCalledWith({ left: 30 });
  });

  it("does nothing when the element is inside, or has no box", () => {
    const inside = make(rect(100, 300), rect(150, 200));
    revealInline(inside.scrollerNode, inside.elementNode);
    expect(inside.scrollBy).not.toHaveBeenCalled();
    const hidden = make(rect(100, 300), rect(0, 0, 0));
    revealInline(hidden.scrollerNode, hidden.elementNode);
    expect(hidden.scrollBy).not.toHaveBeenCalled();
  });
});
