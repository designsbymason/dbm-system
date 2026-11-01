import { describe, expect, it, vi } from "vitest";
import { blockDisabledClick, EXTERNAL_HREF_PATTERN } from "./linkGuard";

describe("blockDisabledClick", () => {
  it("stops the event and its default when the link is disabled, and says so", () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    expect(blockDisabledClick(event as never, true)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("leaves the event alone when the link is not disabled", () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    expect(blockDisabledClick(event as never, false)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe("EXTERNAL_HREF_PATTERN", () => {
  it.each(["https://a.com", "http://a.com/x", "//cdn.a.com/x", "HTTPS://A.COM"])("matches %s", (href) => {
    expect(EXTERNAL_HREF_PATTERN.test(href)).toBe(true);
  });

  it.each(["/x", "x/y", "#top", "mailto:a@b.c", ""])("does not match %s", (href) => {
    expect(EXTERNAL_HREF_PATTERN.test(href)).toBe(false);
  });
});
