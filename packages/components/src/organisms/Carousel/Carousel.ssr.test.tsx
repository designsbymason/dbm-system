import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel } from "./Carousel";

// A server render must not touch `window` or `document`, and the first client render must match it: whatever the server
// could not have drawn (slides per view for the width, the reduced-motion start of auto-play) waits for the first commit.
const tree = (
  <Carousel aria-label="Stories" slidesPerView={{ base: 1, md: 3 }} autoPlay controllerRef={() => {}} defaultValue={1}>
    <Carousel.Slide>One</Carousel.Slide>
    <Carousel.Slide>Two</Carousel.Slide>
    <Carousel.Slide>Three</Carousel.Slide>
    <Carousel.Slide>Four</Carousel.Slide>
  </Carousel>
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

const wrapping = (
  <Carousel aria-label="Looping" loop align="center" slidesPerView={1.5} lazy>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
      <Carousel.Slide key={n} placeholder={<span>{`wait ${n}`}</span>}>
        Slide {n}
      </Carousel.Slide>
    ))}
  </Carousel>
);

describe("Carousel — server render and hydration", () => {
  it("renders the copies and the lazy placeholders on the server, and hydrates them with no recoverable error", async () => {
    const html = renderToString(wrapping);
    expect(html).toContain("data-carousel-clone");
    expect(html).toContain("wait 5");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, wrapping, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
  });

  it("renders to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(tree);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain("Four");
    expect(html).toContain("Stop automatic slide show");
  });

  it("hydrates the same markup with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('[role="region"]')).not.toBeNull();
  });
});
