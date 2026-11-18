import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildIco, icoSizes, pngSize } from "./image-info.mjs";

/** The smallest PNG header that `pngSize` reads: the signature and an IHDR chunk. */
function png(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

describe("pngSize", () => {
  it("reads the width and height of a PNG", () => assert.deepEqual(pngSize(png(1200, 630)), { width: 1200, height: 630 }));
  it("returns undefined for anything else", () => {
    assert.equal(pngSize(Buffer.from("<svg></svg>")), undefined);
    assert.equal(pngSize(Buffer.alloc(10)), undefined);
  });
});

describe("buildIco and icoSizes", () => {
  it("packs PNGs into an ICO whose directory lists their sizes", () => {
    const ico = buildIco([{ size: 16, png: png(16, 16) }, { size: 32, png: png(32, 32) }, { size: 48, png: png(48, 48) }]);
    assert.deepEqual(icoSizes(ico), [{ width: 16, height: 16 }, { width: 32, height: 32 }, { width: 48, height: 48 }]);
    assert.equal(ico.length, 6 + 3 * 16 + 3 * 33);
  });
  it("returns undefined for a file that is not an ICO", () => assert.equal(icoSizes(png(16, 16)), undefined));
});
