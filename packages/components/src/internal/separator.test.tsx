import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { SeparatorHandle, startSeparatorDrag } from "./separator";

describe("SeparatorHandle", () => {
  it("is a focusable separator with its orientation and the value attributes it is given", async () => {
    const { container } = render(
      <div>
        <SeparatorHandle orientation="vertical" aria-label="Resize" aria-valuenow={50} aria-valuemin={10} aria-valuemax={90} data-testid="handle" />
      </div>,
    );
    const handle = screen.getByRole("separator", { name: "Resize" });
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "50");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps the role and the orientation it computes over a same-named prop", () => {
    render(<SeparatorHandle orientation="horizontal" aria-label="x" {...({ role: "button", tabIndex: -1 } as object)} />);
    const handle = screen.getByRole("separator", { name: "x" });
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle).toHaveAttribute("tabindex", "0");
  });
});

describe("startSeparatorDrag", () => {
  function Handle({ onMove, onEnd, onStop }: { onMove: (event: PointerEvent) => void; onEnd: () => void; onStop?: (stop: () => void) => void }) {
    return (
      <SeparatorHandle
        orientation="vertical"
        aria-label="h"
        onPointerDown={(event) => {
          const stop = startSeparatorDrag(event, { onMove, onEnd });
          onStop?.(stop);
        }}
      />
    );
  }

  it("follows the pointer on the window, and ends once on release, whatever the capture says", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();
    render(<Handle onMove={onMove} onEnd={onEnd} />);
    const handle = screen.getByRole("separator");
    // jsdom cannot capture a pointer: the drag must carry on without it.
    handle.setPointerCapture = () => {
      throw new Error("not active");
    };
    fireEvent.pointerDown(handle, { pointerId: 1 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 40 });
    expect(onMove).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(onEnd).toHaveBeenCalledTimes(1);
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 80 });
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("ends on a cancel too, and stopping it yourself removes the listeners without calling onEnd", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();
    let stop: (() => void) | undefined;
    render(<Handle onMove={onMove} onEnd={onEnd} onStop={(fn) => (stop = fn)} />);
    const handle = screen.getByRole("separator");
    fireEvent.pointerDown(handle, { pointerId: 1 });
    fireEvent.pointerCancel(window, { pointerId: 1 });
    expect(onEnd).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(handle, { pointerId: 2 });
    stop?.();
    stop?.();
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 10 });
    fireEvent.pointerUp(window, { pointerId: 2 });
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
