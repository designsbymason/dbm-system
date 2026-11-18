import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileFor, serveFolder } from "./static-server.mjs";

let parent;
let site;
let server;

before(async () => {
  parent = mkdtempSync(join(tmpdir(), "static-server-"));
  site = join(parent, "site");
  mkdirSync(join(site, "docs"), { recursive: true });
  mkdirSync(join(parent, "site-old"));
  writeFileSync(join(site, "index.html"), "home");
  writeFileSync(join(site, "404.html"), "not found page");
  writeFileSync(join(site, "docs", "index.html"), "docs index");
  writeFileSync(join(site, "terms.html"), "terms");
  writeFileSync(join(parent, "secret.txt"), "outside");
  writeFileSync(join(parent, "site-old", "secret.txt"), "sibling with the same prefix");
  symlinkSync(join(parent, "secret.txt"), join(site, "linked.txt"));
  server = await serveFolder(site, { notFound: "404.html" });
});
after(() => {
  server.close();
  rmSync(parent, { recursive: true, force: true });
});

const get = async (path) => {
  const response = await fetch(`${server.origin}${path}`);
  return { status: response.status, body: await response.text() };
};

describe("fileFor", () => {
  it("names the file a path means: the file, a folder's index and a page without its extension", () => {
    assert.equal(fileFor(site, "/"), join(site, "index.html"));
    assert.equal(fileFor(site, "/docs"), join(site, "docs", "index.html"));
    assert.equal(fileFor(site, "/terms"), join(site, "terms.html"));
    assert.equal(fileFor(site, "/missing"), undefined);
  });
  it("refuses a path that leads out of the folder, however it is written", () => {
    for (const path of ["/../secret.txt", "/%2e%2e/secret.txt", "/..%2fsecret.txt", "/..%2f..%2f..%2f..%2fetc/hosts", "/docs/../../secret.txt", "/../site-old/secret.txt", "/%2e%2e%2fsite-old/secret.txt", "/a\0b", "/%"]) {
      assert.equal(fileFor(site, path), undefined, path);
    }
  });
  it("refuses a symbolic link that points out of the folder", () => assert.equal(fileFor(site, "/linked.txt"), undefined));
});

describe("serveFolder", () => {
  it("serves the folder's files, and its own 404 page with the 404 status", async () => {
    assert.deepEqual(await get("/docs"), { status: 200, body: "docs index" });
    assert.deepEqual(await get("/nothing"), { status: 404, body: "not found page" });
  });
  it("does not answer a request for a file outside the folder", async () => {
    for (const path of ["/..%2fsecret.txt", "/..%2f..%2f..%2f..%2f..%2f..%2f..%2f..%2f..%2f..%2fetc/hosts", "/..%2fsite-old/secret.txt", "/linked.txt"]) {
      const { status, body } = await get(path);
      assert.equal(status, 404, path);
      assert.ok(!/outside|sibling|localhost/.test(body), path);
    }
  });
  it("listens on the loopback address", () => assert.match(server.origin, /^http:\/\/127\.0\.0\.1:\d+$/));
});
