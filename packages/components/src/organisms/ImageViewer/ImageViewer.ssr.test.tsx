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
  ["inline", { inline: true, trigger: undefined, "aria-label": "Gallery" }],
  ["inline with thumbnails and a slideshow", { inline: true, trigger: undefined, thumbnails: true, autoPlay: true, "aria-label": "Gallery" }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImageViewer on the server", () => {
  it.each(variants)("renders %s without touching window, document or navigator", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    if (props.inline) {
      // an inline viewer is in the page, so the server draws all of it
      expect(html).toContain('role="group"');
      return;
    }
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
    if (props.inline) expect(screen.getByRole("group", { name: "Gallery" })).toBeInTheDocument();
    act(() => root?.unmount());
    host.remove();
  });
});

describe("ImageViewer hydration for a person who prefers reduced motion", () => {
  it("hydrates an inline slideshow without a mismatch, then settles on paused", async () => {
    const html = onTheServer(() => renderToString(<Tree inline trigger={undefined} autoPlay aria-label="Gallery" />));
    expect(html).toContain("Pause slideshow");
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as typeof window.matchMedia;
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <Tree inline trigger={undefined} autoPlay aria-label="Gallery" />, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(errors).toEqual([]);
      expect(await screen.findByRole("button", { name: "Start slideshow" })).toBeInTheDocument();
    } finally {
      window.matchMedia = matchMedia;
      act(() => root?.unmount());
      host.remove();
    }
  });
});
