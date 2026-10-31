import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { ImageViewer } from "./ImageViewer";
import type { ImageViewerImage, ImageViewerProps } from "./ImageViewer.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  vi.stubGlobal("navigator", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const images: ImageViewerImage[] = [
  { src: "/a.jpg", alt: "First", caption: "One", width: 800, height: 600 },
  { src: "/b.jpg", alt: "Second", thumbnail: "/b-small.jpg" },
];

function Tree(props: Partial<ImageViewerProps>) {
  return <ImageViewer trigger={<Button>View</Button>} images={images} {...props} />;
}

const variants: Array<[string, Partial<ImageViewerProps>]> = [
  ["closed", {}],
  ["open by default", { defaultOpen: true }],
  ["controlled open", { open: true, value: 1 }],
  ["with thumbnails, looping", { defaultOpen: true, thumbnails: true, loop: true }],
  ["controls hidden, no captions", { defaultOpen: true, controls: "hidden", showCaptions: false }],
  ["right to left, translated", { defaultOpen: true, dir: "rtl", labels: { close: "Fermer" } }],
  ["no images", { defaultOpen: true, images: [] }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImageViewer on the server", () => {
  it.each(variants)("renders %s without touching window, document or navigator", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    // the trigger is server-rendered; the panel is portaled after mount, so it is not
    expect(html).toContain("View");
    expect(html).not.toContain('role="dialog"');
  });
});

describe("ImageViewer hydration", () => {
  it.each(variants)("hydrates %s with no mismatch", async (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, <Tree {...props} />, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    if (props.defaultOpen || props.open) expect(await screen.findByRole("dialog")).toBeInTheDocument();
    act(() => root?.unmount());
    host.remove();
  });
});
