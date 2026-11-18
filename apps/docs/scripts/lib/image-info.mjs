/** What the brand-asset check needs to know about an image file, read from its header with no dependency. */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The width and height of a PNG, or `undefined` when the buffer is not one. */
export function pngSize(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.toString("ascii", 12, 16) !== "IHDR") return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** The sizes of the images in an ICO file (a width of 0 means 256), or `undefined` when the buffer is not one. */
export function icoSizes(buffer) {
  if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) return undefined;
  const count = buffer.readUInt16LE(4);
  if (buffer.length < 6 + count * 16) return undefined;
  return Array.from({ length: count }, (_, index) => {
    const entry = 6 + index * 16;
    return { width: buffer[entry] || 256, height: buffer[entry + 1] || 256 };
  });
}

/** An ICO file holding the given PNG images (Windows, macOS and every current browser read PNG-in-ICO). */
export function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}
