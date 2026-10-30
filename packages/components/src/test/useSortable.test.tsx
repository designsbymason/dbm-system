import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSortable } from "@dbm-system/utils";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
};

function List({
  initial = ["a", "b", "c", "d"],
  enabled = true,
  rtl = false,
  tapToMove = false,
  events,
}: {
  initial?: string[];
  enabled?: boolean;
  rtl?: boolean;
  tapToMove?: boolean;
  events?: { onLift?: (i: number, via: string) => void; onDrop?: (i: number) => void; onCancel?: (i: number) => void; onMove?: (from: number, to: number, via: string) => void };
}) {
  const [items, setItems] = useState(initial);
  const sortable = useSortable<HTMLDivElement>({
    enabled,
    count: items.length,
    rtl,
    tapToMove,
    onMove: (from, to, details) => {
      events?.onMove?.(from, to, details.via);
      setItems((current) => move(current, from, to));
    },
    onLift: events?.onLift,
    onDrop: events?.onDrop,
    onCancel: events?.onCancel,
  });
  const { containerRef, drag, itemProps, handleKeyDown, handleKeyUp, release, cancel } = sortable;
  return (
    <div role="group" ref={containerRef} aria-label="items" data-drag={drag ? "yes" : undefined}>
      {items.map((item, index) => (
        <button
          type="button"
          key={item}
          data-testid={item}
          {...itemProps(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onKeyUp={(event) => handleKeyUp(event)}
        >
          {item}
        </button>
      ))}
      <output data-testid="order">{items.join("")}</output>
      <button type="button" data-testid="release" onClick={() => release("keyboard")}>release keyboard</button>
      <button type="button" data-testid="cancel" onClick={() => cancel()}>cancel</button>
    </div>
  );
}

const order = () => screen.getByTestId("order").textContent;

describe("useSortable", () => {
  describe("keyboard", () => {
    it("picks an item up with Space, moves it with the arrows, and drops it with Space", async () => {
      const user = userEvent.setup();
      const onLift = vi.fn();
      const onDrop = vi.fn();
      render(<List events={{ onLift, onDrop }} />);
      screen.getByTestId("b").focus();
      await user.keyboard(" ");
      expect(onLift).toHaveBeenCalledWith(1, "keyboard");
      expect(screen.getByTestId("b")).toHaveAttribute("data-lifted", "true");
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(order()).toBe("acdb");
      expect(screen.getByTestId("b")).toHaveFocus();
      await user.keyboard(" ");
      expect(onDrop).toHaveBeenCalledWith(3);
      expect(screen.getByTestId("b")).not.toHaveAttribute("data-lifted");
      // dropped: the arrows do nothing now
      await user.keyboard("{ArrowLeft}");
      expect(order()).toBe("acdb");
    });

    it("moves to the ends with Home and End, and drops with Enter", async () => {
      const user = userEvent.setup();
      render(<List />);
      screen.getByTestId("c").focus();
      await user.keyboard(" {Home}");
      expect(order()).toBe("cabd");
      await user.keyboard("{End}");
      expect(order()).toBe("abdc");
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("c")).not.toHaveAttribute("data-lifted");
    });

    it("puts the item back with Escape", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<List events={{ onCancel }} />);
      screen.getByTestId("a").focus();
      await user.keyboard(" {ArrowRight}{ArrowRight}");
      expect(order()).toBe("bcad");
      await user.keyboard("{Escape}");
      expect(order()).toBe("abcd");
      expect(onCancel).toHaveBeenCalledWith(0);
    });

    it("stops at the ends instead of wrapping", async () => {
      const user = userEvent.setup();
      render(<List />);
      screen.getByTestId("a").focus();
      await user.keyboard(" {ArrowLeft}{ArrowLeft}");
      expect(order()).toBe("abcd");
    });

    it("moves one place with Alt and an arrow, without picking up", async () => {
      const user = userEvent.setup();
      const onLift = vi.fn();
      render(<List events={{ onLift }} />);
      screen.getByTestId("b").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(order()).toBe("acbd");
      expect(onLift).not.toHaveBeenCalled();
      await user.keyboard("{Alt>}{ArrowLeft}{ArrowLeft}{/Alt}");
      expect(order()).toBe("bacd");
    });

    it("flips the horizontal arrow keys in a right-to-left list, and not the vertical ones", async () => {
      const user = userEvent.setup();
      render(<List rtl />);
      screen.getByTestId("b").focus();
      await user.keyboard(" {ArrowLeft}");
      expect(order()).toBe("acbd");
      await user.keyboard("{ArrowDown}");
      expect(order()).toBe("acdb");
    });

    it("leaves other keys alone", async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();
      render(<List events={{ onMove }} />);
      screen.getByTestId("b").focus();
      await user.keyboard("{ArrowRight}x{Enter}");
      expect(onMove).not.toHaveBeenCalled();
    });

    it("does nothing when disabled", async () => {
      const user = userEvent.setup();
      render(<List enabled={false} />);
      screen.getByTestId("b").focus();
      await user.keyboard(" {ArrowRight}");
      expect(order()).toBe("abcd");
      expect(screen.getByTestId("b")).not.toHaveAttribute("data-lifted");
    });

    it("tells the owner how the move was asked for", async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();
      render(<List events={{ onMove }} />);
      screen.getByTestId("a").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(onMove).toHaveBeenCalledWith(0, 1, "keyboard");
    });
  });

  describe("tapping", () => {
    const lay = () => {
      for (const [index, id] of ["a", "b", "c", "d"].entries()) {
        screen.getByTestId(id).getBoundingClientRect = () => ({ left: index * 100, right: index * 100 + 100, top: 0, bottom: 40, width: 100, height: 40, x: index * 100, y: 0, toJSON: () => ({}) }) as DOMRect;
      }
    };
    const pointer = (type: string, x: number) =>
      act(() => {
        fireEvent(window, new MouseEvent(type, { clientX: x, clientY: 20, bubbles: true }));
      });
    const tap = (id: string, x: number) => {
      fireEvent.pointerDown(screen.getByTestId(id), { clientX: x, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "touch", button: 0 });
      pointer("pointerup", x);
    };

    it("picks an item up with a tap and puts it in the place of the next item tapped", () => {
      const onLift = vi.fn();
      const onMove = vi.fn();
      const onDrop = vi.fn();
      render(<List tapToMove events={{ onLift, onMove, onDrop }} />);
      lay();
      tap("b", 150);
      expect(onLift).toHaveBeenCalledWith(1, "pointer");
      expect(screen.getByTestId("b")).toHaveAttribute("data-lifted", "true");
      tap("d", 350);
      expect(onMove).toHaveBeenCalledWith(1, 3, "pointer");
      expect(order()).toBe("acdb");
      // the move says where it ended up, so there is no drop to report as well
      expect(onDrop).not.toHaveBeenCalled();
      expect(document.querySelector("[data-lifted]")).toBeNull();
    });

    it("drops the item where it is when it is tapped again", () => {
      const onMove = vi.fn();
      const onDrop = vi.fn();
      render(<List tapToMove events={{ onMove, onDrop }} />);
      lay();
      tap("c", 250);
      tap("c", 250);
      expect(onMove).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledWith(2);
      expect(document.querySelector("[data-lifted]")).toBeNull();
    });

    it("does nothing for a tap unless asked, and not for a press on a control inside an item", () => {
      const onLift = vi.fn();
      const { rerender } = render(<List events={{ onLift }} />);
      lay();
      tap("a", 50);
      expect(onLift).not.toHaveBeenCalled();
      rerender(<List tapToMove events={{ onLift }} />);
      lay();
      const inner = document.createElement("button");
      screen.getByTestId("a").appendChild(inner);
      fireEvent.pointerDown(inner, { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
      pointer("pointerup", 50);
      expect(onLift).not.toHaveBeenCalled();
    });

    it("is not a tap when the press moved, which is a drag", () => {
      const onLift = vi.fn();
      render(<List tapToMove events={{ onLift }} />);
      lay();
      fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "touch", button: 0 });
      pointer("pointermove", 260);
      pointer("pointerup", 260);
      expect(onLift).not.toHaveBeenCalled();
      expect(order()).toBe("bcad");
    });

    it("keeps a tapped item picked up when focus moves, but drops a keyboard one", async () => {
      const user = userEvent.setup();
      render(<List tapToMove />);
      lay();
      tap("b", 150);
      await user.click(screen.getByTestId("release"));
      expect(screen.getByTestId("b")).toHaveAttribute("data-lifted", "true");
      await user.click(screen.getByTestId("cancel"));
      expect(document.querySelector("[data-lifted]")).toBeNull();
      screen.getByTestId("c").focus();
      await user.keyboard(" ");
      await user.click(screen.getByTestId("release"));
      expect(document.querySelector("[data-lifted]")).toBeNull();
    });

    it("cancels a tap pick-up with Escape from any item, and ignores other keys on another item", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<List tapToMove events={{ onCancel }} />);
      lay();
      tap("b", 150);
      screen.getByTestId("d").focus();
      await user.keyboard("{ArrowRight}");
      expect(order()).toBe("abcd");
      await user.keyboard("{Escape}");
      expect(onCancel).toHaveBeenCalledWith(1);
      expect(document.querySelector("[data-lifted]")).toBeNull();
    });
  });

  describe("pointer", () => {
    // jsdom lays nothing out, so each item gets a rectangle in a row of 100px cells.
    const lay = () => {
      for (const [index, id] of ["a", "b", "c", "d"].entries()) {
        const element = screen.getByTestId(id);
        element.getBoundingClientRect = () => ({ left: index * 100, right: index * 100 + 100, top: 0, bottom: 40, width: 100, height: 40, x: index * 100, y: 0, toJSON: () => ({}) }) as DOMRect;
      }
    };
    const pointer = (type: string, x: number, y = 20) =>
      act(() => {
        fireEvent(window, new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
      });
    const press = (id: string, x: number) =>
      fireEvent.pointerDown(screen.getByTestId(id), { clientX: x, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });

    it("drags an item past a neighbour and asks for the move on release", () => {
      const onMove = vi.fn();
      render(<List events={{ onMove }} />);
      lay();
      press("a", 50);
      pointer("pointermove", 52);
      expect(screen.getByLabelText("items")).not.toHaveAttribute("data-drag");
      pointer("pointermove", 260);
      expect(screen.getByLabelText("items")).toHaveAttribute("data-drag", "yes");
      expect(screen.getByTestId("a")).toHaveAttribute("data-dragging", "true");
      expect(screen.getByTestId("c")).toHaveAttribute("data-drop", "after");
      pointer("pointerup", 260);
      expect(onMove).toHaveBeenCalledWith(0, 2, "pointer");
      expect(order()).toBe("bcad");
      expect(screen.getByLabelText("items")).not.toHaveAttribute("data-drag");
    });

    it("lands before or after the nearest item by which half the pointer is in", () => {
      render(<List />);
      lay();
      press("d", 350);
      pointer("pointermove", 110);
      expect(screen.getByTestId("b")).toHaveAttribute("data-drop", "before");
      pointer("pointermove", 190);
      expect(screen.getByTestId("b")).toHaveAttribute("data-drop", "after");
      pointer("pointerup", 110);
      expect(order()).toBe("adbc");
    });

    it("asks for nothing when released where it started, and a plain click is not a drag", () => {
      const onMove = vi.fn();
      render(<List events={{ onMove }} />);
      lay();
      press("b", 150);
      pointer("pointermove", 152);
      pointer("pointerup", 152);
      press("b", 150);
      pointer("pointermove", 250);
      pointer("pointermove", 150);
      pointer("pointerup", 150);
      expect(onMove).not.toHaveBeenCalled();
    });

    it("drops nothing when the press is cancelled", () => {
      const onMove = vi.fn();
      render(<List events={{ onMove }} />);
      lay();
      press("a", 50);
      pointer("pointermove", 350);
      pointer("pointercancel", 350);
      expect(onMove).not.toHaveBeenCalled();
      expect(screen.getByLabelText("items")).not.toHaveAttribute("data-drag");
    });

    it("keeps the click that ends a drag from reaching what is under it", () => {
      render(<List />);
      lay();
      const clicked = vi.fn();
      screen.getByTestId("c").addEventListener("click", clicked);
      press("a", 50);
      pointer("pointermove", 260);
      pointer("pointerup", 260);
      fireEvent.click(screen.getByTestId("c"));
      expect(clicked).not.toHaveBeenCalled();
    });

    it("flips the side of a drop in a right-to-left list", () => {
      render(<List rtl />);
      lay();
      press("d", 350);
      pointer("pointermove", 110);
      expect(screen.getByTestId("b")).toHaveAttribute("data-drop", "after");
    });

    it("ignores a press when disabled, and a secondary button", () => {
      const onMove = vi.fn();
      const { rerender } = render(<List enabled={false} events={{ onMove }} />);
      lay();
      press("a", 50);
      pointer("pointermove", 260);
      pointer("pointerup", 260);
      expect(onMove).not.toHaveBeenCalled();
      rerender(<List events={{ onMove }} />);
      lay();
      fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 2 });
      pointer("pointermove", 260);
      pointer("pointerup", 260);
      expect(onMove).not.toHaveBeenCalled();
    });

    it("removes its window listeners when it unmounts mid-drag", () => {
      const remove = vi.spyOn(window, "removeEventListener");
      const { unmount } = render(<List />);
      lay();
      press("a", 50);
      unmount();
      expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
      remove.mockRestore();
    });
  });
});

describe("useSortable — autoScroll", () => {
  function Strip({ autoScroll }: { autoScroll: boolean }) {
    const { containerRef, itemProps } = useSortable<HTMLDivElement>({ count: 3, autoScroll, onMove: () => {} });
    return (
      <div role="group" aria-label="strip" ref={containerRef}>
        {["a", "b", "c"].map((item, index) => (
          <button type="button" key={item} data-testid={item} {...itemProps(index)}>
            {item}
          </button>
        ))}
      </div>
    );
  }

  const box = (left: number, right: number): DOMRect =>
    ({ left, right, top: 0, bottom: 40, width: right - left, height: 40, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;

  function setup(autoScroll: boolean) {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    render(<Strip autoScroll={autoScroll} />);
    const strip = screen.getByRole("group");
    const scrollBy = vi.fn();
    Object.defineProperty(strip, "scrollBy", { configurable: true, value: scrollBy });
    strip.getBoundingClientRect = () => box(0, 300);
    for (const [index, id] of ["a", "b", "c"].entries()) {
      screen.getByTestId(id).getBoundingClientRect = () => box(index * 100, index * 100 + 100);
    }
    return { frames, scrollBy };
  }

  it("scrolls the container toward the edge the pointer is near while dragging", () => {
    const { frames, scrollBy } = setup(true);
    fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
    act(() => { fireEvent(window, new MouseEvent("pointermove", { clientX: 295, clientY: 20, bubbles: true })); });
    act(() => frames.shift()?.(0));
    expect(scrollBy).toHaveBeenCalled();
    expect(scrollBy.mock.calls[0]?.[0].left).toBeGreaterThan(0);
    act(() => { fireEvent(window, new MouseEvent("pointerup", { clientX: 295, clientY: 20, bubbles: true })); });
    vi.unstubAllGlobals();
  });

  it("scrolls the other way near the start edge", () => {
    const { frames, scrollBy } = setup(true);
    fireEvent.pointerDown(screen.getByTestId("c"), { clientX: 250, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
    act(() => { fireEvent(window, new MouseEvent("pointermove", { clientX: 5, clientY: 20, bubbles: true })); });
    act(() => frames.shift()?.(0));
    expect(scrollBy.mock.calls[0]?.[0].left).toBeLessThan(0);
    act(() => { fireEvent(window, new MouseEvent("pointerup", { clientX: 5, clientY: 20, bubbles: true })); });
    vi.unstubAllGlobals();
  });

  it("does nothing in the middle of the container, or when autoScroll is off", () => {
    const middle = setup(true);
    fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
    act(() => { fireEvent(window, new MouseEvent("pointermove", { clientX: 150, clientY: 20, bubbles: true })); });
    act(() => middle.frames.shift()?.(0));
    expect(middle.scrollBy).not.toHaveBeenCalled();
    act(() => { fireEvent(window, new MouseEvent("pointerup", { clientX: 150, clientY: 20, bubbles: true })); });
    vi.unstubAllGlobals();
  });

  it("does not request frames when autoScroll is off", () => {
    const off = setup(false);
    fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
    act(() => { fireEvent(window, new MouseEvent("pointermove", { clientX: 295, clientY: 20, bubbles: true })); });
    expect(off.frames).toHaveLength(0);
    act(() => { fireEvent(window, new MouseEvent("pointerup", { clientX: 295, clientY: 20, bubbles: true })); });
    vi.unstubAllGlobals();
  });
});

describe("useSortable — vertical", () => {
  function Column() {
    const { containerRef, itemProps, drag } = useSortable<HTMLDivElement>({ count: 3, orientation: "vertical", onMove: () => {} });
    return (
      <div role="group" aria-label="column" ref={containerRef} data-position={drag?.position ?? ""} data-over={drag?.over ?? ""}>
        {["a", "b", "c"].map((item, index) => (
          <button type="button" key={item} data-testid={item} {...itemProps(index)}>
            {item}
          </button>
        ))}
      </div>
    );
  }
  const rect = (top: number): DOMRect => ({ left: 0, right: 100, top, bottom: top + 40, width: 100, height: 40, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  const move = (y: number) =>
    act(() => {
      fireEvent(window, new MouseEvent("pointermove", { clientX: 50, clientY: y, bubbles: true }));
    });

  it("drops before or after an item by the pointer's height, not its width", () => {
    render(<Column />);
    for (const [index, id] of ["a", "b", "c"].entries()) screen.getByTestId(id).getBoundingClientRect = () => rect(index * 40);
    fireEvent.pointerDown(screen.getByTestId("a"), { clientX: 50, clientY: 20, pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 });
    move(110);
    expect(screen.getByRole("group")).toHaveAttribute("data-over", "2");
    expect(screen.getByRole("group")).toHaveAttribute("data-position", "after");
    move(82);
    expect(screen.getByRole("group")).toHaveAttribute("data-position", "before");
    act(() => {
      fireEvent(window, new MouseEvent("pointerup", { clientX: 50, clientY: 82, bubbles: true }));
    });
  });
});
