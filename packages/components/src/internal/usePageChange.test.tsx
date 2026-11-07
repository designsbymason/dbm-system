import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { describe, expect, it } from "vitest";
import { usePageChange } from "./usePageChange";

// `AppShell` and `TopNavShell` are tested through their own wiring; these test the hook alone, the part both share.
function Probe({ pageKey, pageTitle, resetScroll = false }: { pageKey?: string | number; pageTitle?: string; resetScroll?: boolean }) {
  const mainRef = useRef<HTMLElement | null>(null);
  const message = usePageChange({ pageKey, pageTitle, mainRef, resetScroll });
  return (
    <>
      <main ref={mainRef} tabIndex={-1} data-testid="main" />
      <div role="status">{message}</div>
    </>
  );
}

describe("usePageChange", () => {
  it("does nothing on the first render, or without a key", () => {
    render(<Probe pageKey="/a" pageTitle="A" />);
    expect(screen.getByTestId("main")).not.toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("moves focus and announces the title when the key changes, whatever type it is", async () => {
    const { rerender } = render(<Probe pageKey={1} pageTitle="One" />);
    rerender(<Probe pageKey={2} pageTitle="Two" />);
    expect(screen.getByTestId("main")).toHaveFocus();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Two"));
  });

  it("sends a main area that scrolls on its own back to its top, only when asked", () => {
    const { rerender } = render(<Probe pageKey="/a" resetScroll />);
    screen.getByTestId("main").scrollTop = 300;
    rerender(<Probe pageKey="/b" resetScroll />);
    expect(screen.getByTestId("main").scrollTop).toBe(0);
    screen.getByTestId("main").scrollTop = 300;
    rerender(<Probe pageKey="/c" />);
    expect(screen.getByTestId("main").scrollTop).toBe(300);
  });

  it("is quiet under StrictMode on mount, and acts on the first real change", () => {
    const { rerender } = render(
      <StrictMode>
        <Probe pageKey="/a" pageTitle="A" />
      </StrictMode>,
    );
    expect(screen.getByTestId("main")).not.toHaveFocus();
    act(() => {
      rerender(
        <StrictMode>
          <Probe pageKey="/b" pageTitle="B" />
        </StrictMode>,
      );
    });
    expect(screen.getByTestId("main")).toHaveFocus();
  });
});
