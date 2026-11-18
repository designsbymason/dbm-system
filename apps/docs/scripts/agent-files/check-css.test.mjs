import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { foldedTimelines } from "../check-css.mjs";

describe("foldedTimelines", () => {
  it("finds a timeline folded into the animation shorthand", () => {
    assert.equal(foldedTimelines(".a{animation:linear both paper-tilt scroll(root);opacity:0}").length, 1);
    assert.equal(foldedTimelines(".a{animation:linear both theme-step --themes}").length, 1);
    assert.equal(foldedTimelines(".a{animation:linear both x view(block)}").length, 1);
  });
  it("leaves the longhands, and custom properties inside var(), alone", () => {
    assert.deepEqual(foldedTimelines(".a{animation:linear both paper-tilt;animation-timeline:scroll(root);animation-range:contain 0% contain 25%}"), []);
    assert.deepEqual(foldedTimelines(".a{animation:spin var(--dbm-motion-duration-base) var(--dbm-motion-easing-standard)}"), []);
    assert.deepEqual(foldedTimelines(".a{animation:spin var(--dbm-motion-duration-base) linear infinite}"), []);
  });
});
