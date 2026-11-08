import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AsideDrawer } from "./AsideDrawer";
import { minWidthQueries, toLength } from "./breakpoints";

// The shared drawer of an aside (`AppShell.Aside`, `PageShell.Aside`): its focus return and its closing when the window grows are tested in each shell's
// real-browser checks; these are the parts jsdom can prove, with a `matchMedia` of the test's own.
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    set(next: boolean) {
      matches = next;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

function Drawer({ open = true, onOpenChange = () => undefined, toggleRef = createRef<HTMLElement>() }: Partial<React.ComponentProps<typeof AsideDrawer>>) {
  return (
    <AsideDrawer open={open} onOpenChange={onOpenChange} collapseBelow="lg" size="20rem" dir="ltr" title="Details" closeLabel="Close" toggleRef={toggleRef}>
      <p>Aside content</p>
    </AsideDrawer>
  );
}

describe("AsideDrawer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("draws its children in a titled drawer with a close button named from closeLabel, while open", async () => {
    render(<Drawer />);
    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(dialog).toHaveTextContent("Aside content");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("draws nothing while closed", () => {
    render(<Drawer open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes an open drawer when the window grows to the step, and not while it is narrower", async () => {
    const media = mockMatchMedia(false);
    const onOpenChange = vi.fn();
    render(<Drawer onOpenChange={onOpenChange} />);
    await screen.findByRole("dialog");
    expect(onOpenChange).not.toHaveBeenCalled();
    media.set(true);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes at once when it is opened while the window is already at the step", async () => {
    mockMatchMedia(true);
    const onOpenChange = vi.fn();
    render(<Drawer onOpenChange={onOpenChange} />);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("asks the step's own media query", () => {
    const seen: string[] = [];
    vi.stubGlobal("matchMedia", (query: string) => {
      seen.push(query);
      return { matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined };
    });
    render(<Drawer />);
    expect(seen).toContain(minWidthQueries.lg);
  });
});

describe("the breakpoint helpers", () => {
  it("writes the widths of the steps as minimum-width queries, in rem", () => {
    expect(Object.keys(minWidthQueries)).toEqual(["sm", "md", "lg", "xl", "2xl", "3xl"]);
    expect(minWidthQueries.md).toBe("(min-width: 48rem)");
  });

  it("writes a width as a CSS length, a number as pixels", () => {
    expect(toLength(320)).toBe("320px");
    expect(toLength("24rem")).toBe("24rem");
  });
});
