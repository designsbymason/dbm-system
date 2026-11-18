import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unpinned } from "./check-action-pins.mjs";

const sha = "3d3c42e5aac5ba805825da76410c181273ba90b1";

describe("unpinned", () => {
  it("accepts a full commit with its version in a comment, a local action and a digest-pinned image", () => {
    assert.deepEqual(unpinned(`      - uses: actions/checkout@${sha} # v7.0.1\n        uses: ./.github/actions/x\n        uses: docker://alpine@sha256:${"a".repeat(64)}\n`), []);
  });
  it("flags a tag, a branch, a short commit and an image with no digest", () => {
    assert.equal(unpinned("uses: actions/checkout@v7\n").length, 1);
    assert.equal(unpinned("uses: owner/repo@main\n").length, 1);
    assert.equal(unpinned("uses: owner/repo@3d3c42e\n").length, 1);
    assert.equal(unpinned("uses: docker://alpine:3\n").length, 1);
  });
  it("flags a pinned action with no version in a comment", () => {
    assert.match(unpinned(`uses: actions/checkout@${sha}\n`)[0], /no version in a comment/);
  });
  it("names the line", () => assert.match(unpinned("a: 1\nuses: x/y@v1\n")[0], /^2: /));
});
