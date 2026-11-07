import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Splitter } from "./Splitter";
import styles from "./Splitter.module.css";
import { DirectionProvider } from "../../atoms/DirectionProvider";

const two = (props: Partial<React.ComponentProps<typeof Splitter>> = {}, pane: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) => (
  <Splitter aria-label="Workspace" {...props}>
    <Splitter.Pane data-testid="a" {...pane}>
      A
    </Splitter.Pane>
    <Splitter.Pane data-testid="b">B</Splitter.Pane>
  </Splitter>
);

const handles = () => screen.getAllByRole("separator");
const first = () => handles()[0] as HTMLElement;
const sizeOf = (testId: string) => Number.parseFloat((screen.getByTestId(testId) as HTMLElement).style.getPropertyValue("--splitter-pane-size"));

/** jsdom lays nothing out: give the container a width, so lengths and drags have something to be a percentage of. */
function withContainerWidth(width: number) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(width);
}

/** Replaces ResizeObserver with one the test can fire: every observer created (the container's, each pane's) is notified. */
function stubResizeObserver(): () => void {
  const callbacks: Array<() => void> = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  return () => callbacks.forEach((callback) => callback());
}

describe("Splitter", () => {
  afterEach(() => vi.restoreAllMocks());

  describe("structure", () => {
    it("puts a handle between each pair of panes", () => {
      render(
        <Splitter>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      expect(handles()).toHaveLength(2);
    });

    it("has no handle for one pane", () => {
      render(
        <Splitter>
          <Splitter.Pane>A</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.queryAllByRole("separator")).toHaveLength(0);
    });

    it("makes each handle a focusable separator that reports the pane before it", () => {
      render(two({ defaultLayout: [30, 70] }, { minSize: 10, maxSize: 60 }));
      const handle = first();
      expect(handle).toHaveAttribute("tabindex", "0");
      expect(handle).toHaveAttribute("aria-orientation", "vertical");
      expect(handle).toHaveAttribute("aria-valuenow", "30");
      expect(handle).toHaveAttribute("aria-valuemin", "10");
      expect(handle).toHaveAttribute("aria-valuemax", "60");
      expect(handle).toHaveAttribute("aria-valuetext", "30%");
    });

    it("points each handle at the panes it resizes", () => {
      render(two());
      const ids = (first().getAttribute("aria-controls") ?? "").split(" ");
      expect(ids).toHaveLength(2);
      expect(document.getElementById(ids[0] as string)).toBe(screen.getByTestId("a"));
      expect(document.getElementById(ids[1] as string)).toBe(screen.getByTestId("b"));
    });

    it("uses a pane's own id", () => {
      render(
        <Splitter>
          <Splitter.Pane id="nav">A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(first().getAttribute("aria-controls")?.split(" ")[0]).toBe("nav");
      expect(document.getElementById("nav")).toHaveTextContent("A");
    });

    it("orients the handles across the layout", () => {
      const { rerender } = render(two({ orientation: "vertical" }));
      expect(first()).toHaveAttribute("aria-orientation", "horizontal");
      rerender(two({ orientation: "horizontal" }));
      expect(first()).toHaveAttribute("aria-orientation", "vertical");
    });

    it("takes a breakpoint map for the orientation (the base applies where no media query matches)", () => {
      render(two({ orientation: { base: "vertical", md: "horizontal" } }));
      expect(first()).toHaveAttribute("aria-orientation", "horizontal");
    });
  });

  describe("layout", () => {
    it("starts from defaultLayout", () => {
      render(two({ defaultLayout: [25, 75] }));
      expect([sizeOf("a"), sizeOf("b")]).toEqual([25, 75]);
    });

    it("starts from each pane's defaultSize, the others sharing the rest", () => {
      render(
        <Splitter>
          <Splitter.Pane data-testid="a" defaultSize={20}>A</Splitter.Pane>
          <Splitter.Pane data-testid="b">B</Splitter.Pane>
          <Splitter.Pane data-testid="c">C</Splitter.Pane>
        </Splitter>,
      );
      expect([sizeOf("a"), sizeOf("b"), sizeOf("c")]).toEqual([20, 40, 40]);
    });

    it("splits equally when nothing is said", () => {
      render(two());
      expect([sizeOf("a"), sizeOf("b")]).toEqual([50, 50]);
    });

    it("brings a default that breaks a limit inside it", () => {
      render(two({ defaultLayout: [5, 95] }, { minSize: 20 }));
      expect(sizeOf("a")).toBeGreaterThanOrEqual(20);
    });

    it("starts over when a pane is added", () => {
      const { rerender } = render(two({ defaultLayout: [30, 70] }));
      rerender(
        <Splitter aria-label="Workspace">
          <Splitter.Pane data-testid="a">A</Splitter.Pane>
          <Splitter.Pane data-testid="b">B</Splitter.Pane>
          <Splitter.Pane data-testid="c">C</Splitter.Pane>
        </Splitter>,
      );
      expect(handles()).toHaveLength(2);
      expect(sizeOf("a") + sizeOf("b") + sizeOf("c")).toBeCloseTo(100, 4);
    });

    it("holds a layout you pass, and asks to change it rather than changing it", async () => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      render(two({ layout: [40, 60], onLayoutChange }));
      first().focus();
      await user.keyboard("{ArrowRight}");
      expect(onLayoutChange).toHaveBeenCalledWith([45, 55]);
      expect([sizeOf("a"), sizeOf("b")]).toEqual([40, 60]);
    });

    it("follows a controlled layout as it changes", () => {
      const { rerender } = render(two({ layout: [40, 60] }));
      rerender(two({ layout: [70, 30] }));
      expect(sizeOf("a")).toBe(70);
    });
  });

  describe("keyboard", () => {
    const setup = (props: Partial<React.ComponentProps<typeof Splitter>> = {}, pane: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) => {
      const onLayoutChange = vi.fn();
      const onLayoutCommit = vi.fn();
      const user = userEvent.setup();
      render(two({ defaultLayout: [50, 50], onLayoutChange, onLayoutCommit, ...props }, pane));
      first().focus();
      return { user, onLayoutChange, onLayoutCommit };
    };

    it("moves a vertical bar with the left and right arrows, by keyboardStep", async () => {
      const { user, onLayoutChange } = setup();
      await user.keyboard("{ArrowRight}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([55, 45]);
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([45, 55]);
      expect(first()).toHaveAttribute("aria-valuenow", "45");
    });

    it("moves a horizontal bar with the up and down arrows", async () => {
      const { user, onLayoutChange } = setup({ orientation: "vertical" });
      await user.keyboard("{ArrowDown}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([55, 45]);
      await user.keyboard("{ArrowUp}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([50, 50]);
    });

    it("ignores the arrows across the bar", async () => {
      const { user, onLayoutChange } = setup({ orientation: "vertical" });
      await user.keyboard("{ArrowLeft}{ArrowRight}");
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("follows the text direction: in rtl the first pane is on the right", async () => {
      const { user, onLayoutChange } = setup({ dir: "rtl" });
      await user.keyboard("{ArrowLeft}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([55, 45]);
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([45, 55]);
    });

    it("moves twice as far with Page Down and Page Up, and by a step you choose", async () => {
      const { user, onLayoutChange } = setup({ keyboardStep: 2 });
      await user.keyboard("{PageDown}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([54, 46]);
      await user.keyboard("{PageUp}{PageUp}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([46, 54]);
    });

    it("goes to either end with Home and End, as far as the limits allow", async () => {
      const { user, onLayoutChange } = setup({}, { minSize: 20, maxSize: 70 });
      await user.keyboard("{Home}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([20, 80]);
      await user.keyboard("{End}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([70, 30]);
    });

    it("stops at a limit and does not report a move that did nothing", async () => {
      const { user, onLayoutChange } = setup({ defaultLayout: [20, 80] }, { minSize: 20 });
      await user.keyboard("{ArrowLeft}");
      expect(onLayoutChange).not.toHaveBeenCalled();
      expect(first()).toHaveAttribute("aria-valuenow", "20");
    });

    it("reports the finished layout with onLayoutCommit, once per key press", async () => {
      const { user, onLayoutCommit } = setup();
      await user.keyboard("{ArrowRight}");
      expect(onLayoutCommit).toHaveBeenCalledTimes(1);
      expect(onLayoutCommit).toHaveBeenCalledWith([55, 45]);
    });

    it("does nothing for other keys, and lets them through", async () => {
      const { user, onLayoutChange } = setup();
      await user.keyboard("a{Tab}");
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("ignores a double click while disabled", () => {
      const onLayoutChange = vi.fn();
      render(two({ disabled: true, onLayoutChange, defaultLayout: [30, 70] }, { collapsible: true, minSize: 20 }));
      fireEvent.doubleClick(first());
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("does nothing while disabled, and says so", async () => {
      const { user, onLayoutChange } = setup({ disabled: true });
      await user.keyboard("{ArrowRight}{Home}");
      expect(onLayoutChange).not.toHaveBeenCalled();
      expect(first()).toHaveAttribute("aria-disabled", "true");
      expect(first()).toHaveAttribute("tabindex", "0");
    });

    it("resizes only the two panes beside the handle", async () => {
      const onLayoutChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Splitter defaultLayout={[25, 25, 50]} onLayoutChange={onLayoutChange}>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      handles()[1]?.focus();
      await user.keyboard("{ArrowRight}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([25, 30, 45]);
    });
  });

  describe("dragging", () => {
    const drag = (handle: HTMLElement, from: number, to: number) => {
      fireEvent.pointerDown(handle, { clientX: from, clientY: from, button: 0, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: to, clientY: to }));
      });
    };

    it("moves the boundary by the distance dragged, as a share of the space the panes have", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [50, 50], onLayoutChange }));
      drag(first(), 500, 600);
      expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
      expect(first()).toHaveAttribute("aria-valuenow", "60");
    });

    it("reports the finished layout when the pointer is released, and stops following it", () => {
      withContainerWidth(1000);
      const onLayoutCommit = vi.fn();
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [50, 50], onLayoutChange, onLayoutCommit }));
      drag(first(), 500, 600);
      expect(onLayoutCommit).not.toHaveBeenCalled();
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup"));
      });
      expect(onLayoutCommit).toHaveBeenCalledTimes(1);
      expect(onLayoutCommit).toHaveBeenCalledWith([60, 40]);
      onLayoutChange.mockClear();
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 900, clientY: 900 }));
      });
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("marks the handle and the container while dragging", () => {
      withContainerWidth(1000);
      const { container } = render(two());
      drag(first(), 500, 520);
      expect(first()).toHaveAttribute("data-state", "dragging");
      expect(container.firstElementChild).toHaveAttribute("data-dragging");
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup"));
      });
      expect(first()).toHaveAttribute("data-state", "idle");
      expect(container.firstElementChild).not.toHaveAttribute("data-dragging");
    });

    it("goes the other way in rtl", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [50, 50], onLayoutChange, dir: "rtl" }));
      drag(first(), 500, 600);
      expect(onLayoutChange).toHaveBeenLastCalledWith([40, 60]);
    });

    it("goes the other way under a DirectionProvider", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      render(<DirectionProvider dir="rtl">{two({ defaultLayout: [50, 50], onLayoutChange })}</DirectionProvider>);
      drag(first(), 500, 600);
      expect(onLayoutChange).toHaveBeenLastCalledWith([40, 60]);
    });

    it("uses the vertical distance for a stacked splitter", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [50, 50], onLayoutChange, orientation: "vertical" }));
      fireEvent.pointerDown(first(), { clientX: 0, clientY: 200, button: 0, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 900, clientY: 300 }));
      });
      expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
    });

    it("stops at the limits", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [50, 50] }, { minSize: 20, maxSize: 70 }));
      drag(first(), 500, 5000);
      expect(first()).toHaveAttribute("aria-valuenow", "70");
    });

    it("ignores a drag while disabled, and a button that isn't the main one", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      const { rerender } = render(two({ onLayoutChange, disabled: true }));
      drag(first(), 500, 600);
      expect(onLayoutChange).not.toHaveBeenCalled();
      rerender(two({ onLayoutChange }));
      fireEvent.pointerDown(first(), { clientX: 500, button: 2, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 600 }));
      });
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("lets go of the window when it unmounts mid-drag", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      const { unmount } = render(two({ onLayoutChange }));
      drag(first(), 500, 510);
      onLayoutChange.mockClear();
      unmount();
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 900 }));
      expect(onLayoutChange).not.toHaveBeenCalled();
    });
  });

  describe("lengths", () => {
    it("reads a px limit against the space the panes share", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [50, 50] }, { minSize: "300px" }));
      expect(first()).toHaveAttribute("aria-valuemin", "30");
    });

    it("reads a % limit as a plain number", () => {
      render(two({}, { minSize: "35%" }));
      expect(first()).toHaveAttribute("aria-valuemin", "35");
    });

    it("reads a px limit again when the container is resized", () => {
      const notify = stubResizeObserver();
      const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
      render(two({ defaultLayout: [50, 50] }, { minSize: "300px" }));
      expect(first()).toHaveAttribute("aria-valuemin", "30");
      width.mockReturnValue(500);
      act(() => notify());
      expect(first()).toHaveAttribute("aria-valuemin", "60");
      vi.unstubAllGlobals();
    });

    it("pulls a layout back inside a px limit once the container is measured", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [10, 90] }, { minSize: "300px" }));
      expect(sizeOf("a")).toBeGreaterThanOrEqual(30 - 1e-6);
    });
  });

  describe("keys with a modifier belong to the browser", () => {
    it.each([
      ["Alt", { altKey: true }],
      ["Ctrl", { ctrlKey: true }],
      ["Meta", { metaKey: true }],
    ])("leaves %s with an arrow key (Alt+Left is Back) alone", (_name, modifier) => {
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [50, 50], onLayoutChange }));
      first().focus();
      const notPrevented = fireEvent.keyDown(first(), { key: "ArrowLeft", ...modifier });
      expect(notPrevented).toBe(true);
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("leaves a modified Home, End, Enter and Page key alone too", () => {
      const onLayoutChange = vi.fn();
      render(two({ defaultLayout: [30, 70], onLayoutChange }, { collapsible: true, minSize: 20 }));
      for (const key of ["Home", "End", "Enter", "PageUp", "PageDown"]) {
        expect(fireEvent.keyDown(first(), { key, ctrlKey: true })).toBe(true);
      }
      expect(onLayoutChange).not.toHaveBeenCalled();
    });
  });

  describe("focus when the pane that holds it goes away", () => {
    const withButton = (collapsed: boolean) => (
      <Splitter defaultLayout={[30, 70]}>
        <Splitter.Pane data-testid="a" collapsible minSize={20} collapsed={collapsed}>
          <button type="button">Inside</button>
        </Splitter.Pane>
        <Splitter.Pane>B</Splitter.Pane>
      </Splitter>
    );

    it("moves focus to the handle beside it when the pane collapses to nothing", () => {
      const { rerender } = render(withButton(false));
      screen.getByRole("button", { name: "Inside" }).focus();
      rerender(withButton(true));
      expect(document.activeElement).toBe(first());
    });

    it("leaves focus alone when the pane that collapses doesn't hold it", () => {
      const { rerender } = render(
        <>
          <button type="button">Outside</button>
          {withButton(false)}
        </>,
      );
      screen.getByRole("button", { name: "Outside" }).focus();
      rerender(
        <>
          <button type="button">Outside</button>
          {withButton(true)}
        </>,
      );
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Outside" }));
    });

    it("leaves focus in a pane that collapses to a strip, since it is still there", () => {
      const strip = (collapsed: boolean) => (
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane collapsible minSize={20} collapsedSize={5} collapsed={collapsed}>
            <button type="button">Rail</button>
          </Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>
      );
      const { rerender } = render(strip(false));
      screen.getByRole("button", { name: "Rail" }).focus();
      rerender(strip(true));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rail" }));
    });

    it("uses the handle before the pane when it is the last", () => {
      const last = (collapsed: boolean) => (
        <Splitter defaultLayout={[70, 30]}>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane collapsible minSize={20} collapsed={collapsed}>
            <button type="button">Inside</button>
          </Splitter.Pane>
        </Splitter>
      );
      const { rerender } = render(last(false));
      screen.getByRole("button", { name: "Inside" }).focus();
      rerender(last(true));
      expect(document.activeElement).toBe(first());
    });
  });

  describe("reset to the starting proportions", () => {
    it("sets the two panes back with a double click, after the keyboard moved them", async () => {
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70] }));
      first().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(sizeOf("a")).toBe(40);
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBe(30);
      expect(sizeOf("b")).toBe(70);
    });

    it("sets them back after a drag too", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [30, 70] }));
      fireEvent.pointerDown(first(), { clientX: 300, button: 0, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 500 }));
      });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup"));
      });
      expect(sizeOf("a")).toBeCloseTo(50, 3);
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBeCloseTo(30, 3);
    });

    it("does the same with Enter, so the keyboard has the pointer's shortcut", async () => {
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70] }));
      first().focus();
      await user.keyboard("{ArrowRight}{Enter}");
      expect(sizeOf("a")).toBe(30);
    });

    it("goes back to the panes' own defaultSize when the splitter was given no layout", async () => {
      const user = userEvent.setup();
      render(
        <Splitter>
          <Splitter.Pane data-testid="a" defaultSize={25}>A</Splitter.Pane>
          <Splitter.Pane data-testid="b">B</Splitter.Pane>
        </Splitter>,
      );
      first().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBe(25);
    });

    it("resets only the two panes beside the handle", async () => {
      const user = userEvent.setup();
      render(
        <Splitter defaultLayout={[20, 30, 50]}>
          <Splitter.Pane data-testid="a">A</Splitter.Pane>
          <Splitter.Pane data-testid="b">B</Splitter.Pane>
          <Splitter.Pane data-testid="c">C</Splitter.Pane>
        </Splitter>,
      );
      handles()[0]?.focus();
      await user.keyboard("{ArrowRight}");
      handles()[1]?.focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect([sizeOf("a"), sizeOf("b"), sizeOf("c")]).toEqual([25, 35, 40]);
      fireEvent.doubleClick(handles()[1] as HTMLElement);
      // The second handle's panes go back to 30:50 of what they share (75); the first pane is left as it was.
      expect(sizeOf("a")).toBe(25);
      expect(sizeOf("b")).toBeCloseTo(75 * (30 / 80), 4);
      expect(sizeOf("c")).toBeCloseTo(75 * (50 / 80), 4);
    });

    it("says nothing when they are already there", async () => {
      const onLayoutChange = vi.fn();
      const onLayoutCommit = vi.fn();
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70], onLayoutChange, onLayoutCommit }));
      fireEvent.doubleClick(first());
      first().focus();
      await user.keyboard("{Enter}");
      expect(onLayoutChange).not.toHaveBeenCalled();
      expect(onLayoutCommit).not.toHaveBeenCalled();
    });

    it("reports the reset, as a change and as a finished one", async () => {
      const onLayoutChange = vi.fn();
      const onLayoutCommit = vi.fn();
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70], onLayoutChange, onLayoutCommit }));
      first().focus();
      await user.keyboard("{ArrowRight}");
      onLayoutChange.mockClear();
      onLayoutCommit.mockClear();
      fireEvent.doubleClick(first());
      expect(onLayoutChange).toHaveBeenCalledWith([30, 70]);
      expect(onLayoutCommit).toHaveBeenCalledWith([30, 70]);
    });

    it("still collapses a collapsible pane instead, when a neighbour can", () => {
      render(two({ defaultLayout: [30, 70] }, { collapsible: true, minSize: 20 }));
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBe(0);
    });

    it("goes back to how the panes were laid out when one last arrived", async () => {
      const user = userEvent.setup();
      const withPanes = (keys: string[]) => (
        <Splitter>
          {keys.map((key) => (
            <Splitter.Pane key={key} data-testid={key} defaultSize={key === "c" ? 40 : undefined}>
              {key}
            </Splitter.Pane>
          ))}
        </Splitter>
      );
      const { rerender } = render(withPanes(["a", "b"]));
      rerender(withPanes(["a", "b", "c"]));
      const arrived = sizeOf("c");
      handles()[1]?.focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(sizeOf("c")).toBeGreaterThan(arrived);
      fireEvent.doubleClick(handles()[1] as HTMLElement);
      expect(sizeOf("c")).toBeCloseTo(arrived, 4);
    });

    it("does nothing on a plain divider beside a locked pane", () => {
      const onLayoutChange = vi.fn();
      render(
        <Splitter defaultLayout={[30, 70]} onLayoutChange={onLayoutChange}>
          <Splitter.Pane resizable={false}>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      fireEvent.doubleClick(first());
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("stays inside the limits when it goes back", async () => {
      withContainerWidth(1000);
      const user = userEvent.setup();
      render(two({ defaultLayout: [10, 90] }, { minSize: "300px" }));
      first().focus();
      await user.keyboard("{ArrowRight}");
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBeGreaterThanOrEqual(30 - 1e-6);
    });
  });

  describe("rem limits", () => {
    const observerThatWeCanCall = () => {
      const notify = stubResizeObserver();
      return () => notify();
    };

    afterEach(() => {
      document.documentElement.style.fontSize = "";
      vi.unstubAllGlobals();
    });

    it("reads a rem limit against the root font size", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [50, 50] }, { minSize: "10rem", maxSize: "40rem" }));
      // 10rem = 160px of 1000px, 40rem = 640px.
      expect(first()).toHaveAttribute("aria-valuemin", "16");
      expect(first()).toHaveAttribute("aria-valuemax", "64");
    });

    it("reads it again at the next measurement, so a changed root font size is picked up", () => {
      const resized = observerThatWeCanCall();
      withContainerWidth(1000);
      render(two({ defaultLayout: [50, 50] }, { minSize: "10rem" }));
      expect(first()).toHaveAttribute("aria-valuemin", "16");
      document.documentElement.style.fontSize = "20px";
      act(() => resized());
      expect(first()).toHaveAttribute("aria-valuemin", "20");
    });

    it("holds a layout inside a rem limit", () => {
      withContainerWidth(1000);
      render(two({ defaultLayout: [5, 95] }, { minSize: "10rem" }));
      expect(sizeOf("a")).toBeGreaterThanOrEqual(16 - 1e-6);
    });

    it("is not a limit before the container has been measured", () => {
      render(two({ defaultLayout: [5, 95] }, { minSize: "10rem" }));
      expect(first()).toHaveAttribute("aria-valuemin", "0");
    });
  });

  describe("panes coming and going", () => {
    const three = (keys: string[], extra: Record<string, Partial<React.ComponentProps<typeof Splitter.Pane>>> = {}) => (
      <Splitter defaultLayout={keys.length === 3 ? [20, 30, 50] : undefined}>
        {keys.map((key) => (
          <Splitter.Pane key={key} data-testid={key} {...extra[key]}>
            {key}
          </Splitter.Pane>
        ))}
      </Splitter>
    );

    it("keeps the panes that are still there at their proportions when one is removed", () => {
      const { rerender } = render(three(["a", "b", "c"]));
      rerender(three(["a", "c"]));
      expect(handles()).toHaveLength(1);
      expect(sizeOf("a") / sizeOf("c")).toBeCloseTo(20 / 50, 4);
      expect(sizeOf("a") + sizeOf("c")).toBeCloseTo(100, 4);
    });

    it("gives a new pane room without starting every pane over", () => {
      const { rerender } = render(three(["a", "b", "c"]));
      rerender(three(["a", "b", "c", "d"], { d: { defaultSize: 20 } }));
      expect(sizeOf("d")).toBeCloseTo(20 / 1.2, 3);
      expect(sizeOf("a") / sizeOf("b")).toBeCloseTo(20 / 30, 3);
      expect(sizeOf("a") + sizeOf("b") + sizeOf("c") + sizeOf("d")).toBeCloseTo(100, 4);
    });

    it("follows a pane by its id when the keys change", () => {
      const withIds = (ids: string[]) => (
        <Splitter defaultLayout={[25, 75]}>
          {ids.map((paneId, index) => (
            <Splitter.Pane key={`k${index}`} id={paneId} data-testid={paneId}>
              {paneId}
            </Splitter.Pane>
          ))}
        </Splitter>
      );
      const { rerender } = render(withIds(["nav", "main"]));
      rerender(withIds(["main", "nav"]));
      expect(sizeOf("main")).toBe(75);
      expect(sizeOf("nav")).toBe(25);
    });

    it("opens a collapsed pane at the size it had, even after another pane came or went", async () => {
      const user = userEvent.setup();
      const collapsible = { a: { collapsible: true, minSize: 10 } };
      const { rerender } = render(three(["a", "b", "c"], collapsible));
      handles()[0]?.focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      const before = sizeOf("a");
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBe(0);
      rerender(three(["a", "b"], collapsible));
      first().focus();
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBeCloseTo(before, 3);
    });

    it("does not report a pane that has only just arrived as collapsing", () => {
      const onCollapsedChange = vi.fn();
      const { rerender } = render(three(["a", "b"]));
      rerender(three(["a", "b", "c"], { c: { collapsible: true, minSize: 0, onCollapsedChange, defaultSize: 0 } }));
      // It arrives collapsed (size 0, allowed to collapse), and that is how it starts, not a change.
      expect(sizeOf("c")).toBe(0);
      expect(onCollapsedChange).not.toHaveBeenCalled();
    });

    it("warns about nothing and renders for no panes at all", () => {
      const { container } = render(<Splitter />);
      expect(container.firstElementChild?.children).toHaveLength(0);
    });
  });

  describe("locked panes", () => {
    const locked = (extra: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) => (
      <Splitter defaultLayout={[20, 40, 40]}>
        <Splitter.Pane data-testid="header" resizable={false} {...extra}>
          Header
        </Splitter.Pane>
        <Splitter.Pane data-testid="main" label="Main">Main</Splitter.Pane>
        <Splitter.Pane data-testid="aside">Aside</Splitter.Pane>
      </Splitter>
    );

    it("draws the handle beside a locked pane as a plain divider that is not a tab stop", () => {
      render(locked());
      const dividers = screen.getAllByRole("separator");
      expect(dividers).toHaveLength(2);
      const [staticOne, live] = dividers as [HTMLElement, HTMLElement];
      expect(staticOne).not.toHaveAttribute("tabindex");
      expect(staticOne).not.toHaveAttribute("aria-valuenow");
      expect(staticOne.className).toContain(styles.handleStatic);
      expect(live).toHaveAttribute("tabindex", "0");
      expect(live).toHaveAttribute("aria-valuenow", "40");
    });

    it("leaves the other handles working, and moves only their panes", async () => {
      const onLayoutChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Splitter defaultLayout={[20, 40, 40]} onLayoutChange={onLayoutChange}>
          <Splitter.Pane resizable={false}>Header</Splitter.Pane>
          <Splitter.Pane>Main</Splitter.Pane>
          <Splitter.Pane>Aside</Splitter.Pane>
        </Splitter>,
      );
      screen.getAllByRole("separator")[1]?.focus();
      await user.keyboard("{ArrowRight}");
      expect(onLayoutChange).toHaveBeenLastCalledWith([20, 45, 35]);
    });

    it("numbers only the handles that can be used", () => {
      render(
        <Splitter>
          <Splitter.Pane resizable={false}>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.getByRole("separator", { name: "Resize panels" })).toBeInTheDocument();
      expect(screen.queryByRole("separator", { name: /of/ })).toBeNull();
    });

    it("locks a handle on both sides of the pane", () => {
      render(
        <Splitter>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane resizable={false}>B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.getAllByRole("separator").every((handle) => !handle.hasAttribute("tabindex"))).toBe(true);
    });

    it("does not follow a drag on a plain divider", () => {
      withContainerWidth(1000);
      const onLayoutChange = vi.fn();
      render(
        <Splitter onLayoutChange={onLayoutChange}>
          <Splitter.Pane resizable={false}>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      fireEvent.pointerDown(first(), { clientX: 500, button: 0, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 600 }));
      });
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("can still be collapsed from outside", () => {
      const { rerender } = render(locked({ collapsible: true, minSize: 10, collapsed: false }));
      rerender(locked({ collapsible: true, minSize: 10, collapsed: true }));
      expect(sizeOf("header")).toBe(0);
    });

    it("is axe-clean with a plain divider", async () => {
      const { container } = render(locked());
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("fixed panes", () => {
    const fixedLayout = (changes: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) => (
      <Splitter defaultLayout={[20, 80]}>
        <Splitter.Pane data-testid="side" fixed {...changes}>
          Side
        </Splitter.Pane>
        <Splitter.Pane data-testid="main">Main</Splitter.Pane>
      </Splitter>
    );

    const setup = () => {
      const notify = stubResizeObserver();
      const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
      return { resize: (to: number) => { width.mockReturnValue(to); act(() => notify()); } };
    };

    afterEach(() => vi.unstubAllGlobals());

    it("keeps its length when the container shrinks, and the others share the rest", () => {
      const { resize } = setup();
      render(fixedLayout());
      expect(sizeOf("side")).toBeCloseTo(20, 3);
      resize(500);
      expect(sizeOf("side")).toBeCloseTo(40, 3);
      expect(sizeOf("main")).toBeCloseTo(60, 3);
    });

    it("keeps its length when the container grows", () => {
      const { resize } = setup();
      render(fixedLayout());
      resize(2000);
      expect(sizeOf("side")).toBeCloseTo(10, 3);
      expect(sizeOf("main")).toBeCloseTo(90, 3);
    });

    it("keeps the size a person gave it, not the size it started at", async () => {
      const { resize } = setup();
      const user = userEvent.setup();
      render(fixedLayout());
      first().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(sizeOf("side")).toBeCloseTo(30, 3);
      resize(500);
      expect(sizeOf("side")).toBeCloseTo(60, 3);
    });

    it("scales as an ordinary pane does when it isn't fixed", () => {
      const { resize } = setup();
      render(fixedLayout({ fixed: false }));
      resize(500);
      expect(sizeOf("side")).toBeCloseTo(20, 3);
    });

    it("tells the layout watcher about the new layout", () => {
      const { resize } = setup();
      const onLayoutChange = vi.fn();
      render(
        <Splitter defaultLayout={[20, 80]} onLayoutChange={onLayoutChange}>
          <Splitter.Pane fixed>Side</Splitter.Pane>
          <Splitter.Pane>Main</Splitter.Pane>
        </Splitter>,
      );
      onLayoutChange.mockClear();
      resize(500);
      expect(onLayoutChange).toHaveBeenLastCalledWith([expect.closeTo(40, 3), expect.closeTo(60, 3)]);
    });
  });

  describe("collapsing", () => {
    const side = (props: Partial<React.ComponentProps<typeof Splitter>> = {}, pane: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) =>
      two({ defaultLayout: [30, 70], ...props }, { collapsible: true, minSize: 20, ...pane });

    it("collapses with Home, reads as collapsed, and hides a pane that collapses to nothing", async () => {
      const user = userEvent.setup();
      render(side());
      first().focus();
      await user.keyboard("{Home}");
      expect(sizeOf("a")).toBe(0);
      expect(first()).toHaveAttribute("aria-valuetext", "Collapsed");
      expect(screen.getByTestId("a")).toHaveAttribute("data-collapsed");
      expect(screen.getByTestId("a").className).toContain(styles.hidden);
    });

    it("toggles with Enter, and opens at the size it had", async () => {
      const user = userEvent.setup();
      render(side());
      first().focus();
      await user.keyboard("{ArrowRight}");
      expect(sizeOf("a")).toBe(35);
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBe(0);
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBe(35);
      expect(screen.getByTestId("a")).not.toHaveAttribute("data-collapsed");
    });

    it("toggles with a double click", () => {
      render(side());
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBe(0);
      fireEvent.doubleClick(first());
      expect(sizeOf("a")).toBe(30);
    });

    it("toggles the pane after the handle when the one before it can't collapse", async () => {
      const user = userEvent.setup();
      render(
        <Splitter defaultLayout={[70, 30]}>
          <Splitter.Pane data-testid="a">A</Splitter.Pane>
          <Splitter.Pane data-testid="b" collapsible minSize={20}>B</Splitter.Pane>
        </Splitter>,
      );
      first().focus();
      await user.keyboard("{Enter}");
      expect(sizeOf("b")).toBe(0);
    });

    it("does nothing on Enter when neither neighbour collapses", async () => {
      const onLayoutChange = vi.fn();
      const user = userEvent.setup();
      render(two({ onLayoutChange }));
      first().focus();
      await user.keyboard("{Enter}");
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("snaps shut when dragged far enough, and keeps a strip when told to", () => {
      withContainerWidth(1000);
      render(side({}, { collapsedSize: "48px" }));
      fireEvent.pointerDown(first(), { clientX: 300, button: 0, pointerType: "mouse", pointerId: 1 });
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 0 }));
      });
      expect(sizeOf("a")).toBeCloseTo(4.8, 1);
      expect(screen.getByTestId("a")).toHaveAttribute("data-collapsed");
      // A strip stays visible: only a pane collapsed to nothing is hidden.
      expect(screen.getByTestId("a").className).not.toContain(styles.hidden);
    });

    it("starts collapsed with defaultCollapsed", () => {
      render(side({ defaultLayout: undefined }, { defaultCollapsed: true }));
      expect(sizeOf("a")).toBe(0);
      expect(screen.getByTestId("a")).toHaveAttribute("data-collapsed");
    });

    it("tells the pane when it collapses and opens", async () => {
      const onCollapsedChange = vi.fn();
      const user = userEvent.setup();
      render(side({}, { onCollapsedChange }));
      first().focus();
      await user.keyboard("{Enter}");
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      await user.keyboard("{Enter}");
      expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
      expect(onCollapsedChange).toHaveBeenCalledTimes(2);
    });

    it("follows a collapsed prop, and gives it back its size", () => {
      const { rerender } = render(side({}, { collapsed: false }));
      rerender(side({}, { collapsed: true }));
      expect(sizeOf("a")).toBe(0);
      rerender(side({}, { collapsed: false }));
      expect(sizeOf("a")).toBe(30);
    });

    it("keeps a controlled pane where the prop says, whatever the keyboard asks", async () => {
      const user = userEvent.setup();
      render(side({}, { collapsed: true }));
      first().focus();
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBe(0);
    });

    it("lets a pane's children be a function of its state, to show something else once it has collapsed", async () => {
      const user = userEvent.setup();
      render(
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane data-testid="a" collapsible minSize={20}>
            {({ collapsed, size }) => (collapsed ? <span>rail</span> : <span>full {Math.round(size)}</span>)}
          </Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.getByTestId("a")).toHaveTextContent("full 30");
      first().focus();
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("a")).toHaveTextContent("rail");
    });

    describe("a pane the parent controls", () => {
      const controlled = (collapsed: boolean, onCollapsedChange?: (collapsed: boolean) => void) => (
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane data-testid="a" collapsible minSize={20} collapsed={collapsed} onCollapsedChange={onCollapsedChange}>
            A
          </Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>
      );

      it("is asked to collapse by a handle, and follows when the prop does", async () => {
        const user = userEvent.setup();
        const onCollapsedChange = vi.fn();
        const { rerender } = render(controlled(false, onCollapsedChange));
        first().focus();
        await user.keyboard("{Enter}");
        expect(onCollapsedChange).toHaveBeenCalledTimes(1);
        expect(onCollapsedChange).toHaveBeenCalledWith(true);
        // Nothing moved: it is the parent's to say.
        expect(sizeOf("a")).toBe(30);
        rerender(controlled(true, onCollapsedChange));
        expect(sizeOf("a")).toBe(0);
        // Following the prop is not a request, so it isn't reported again.
        expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      });

      it("settles when the parent holds the state, instead of fighting it", async () => {
        const user = userEvent.setup();
        const onCollapsedChange = vi.fn();
        const Harness = () => {
          const [collapsed, setCollapsed] = useState(false);
          return controlled(collapsed, (next) => {
            onCollapsedChange(next);
            setCollapsed(next);
          });
        };
        render(<Harness />);
        first().focus();
        await user.keyboard("{Enter}");
        expect(sizeOf("a")).toBe(0);
        await user.keyboard("{Enter}");
        expect(sizeOf("a")).toBe(30);
        await user.keyboard("{Enter}");
        expect(sizeOf("a")).toBe(0);
        expect(onCollapsedChange.mock.calls).toEqual([[true], [false], [true]]);
      });

      it("keeps being asked when the parent says no", async () => {
        const user = userEvent.setup();
        const onCollapsedChange = vi.fn();
        render(controlled(false, onCollapsedChange));
        first().focus();
        await user.keyboard("{Enter}{Enter}");
        expect(onCollapsedChange).toHaveBeenCalledTimes(2);
        expect(sizeOf("a")).toBe(30);
      });

      it("is asked again by a second Home, when the parent said no to the first", async () => {
        const user = userEvent.setup();
        const onCollapsedChange = vi.fn();
        render(controlled(false, onCollapsedChange));
        first().focus();
        await user.keyboard("{Home}{Home}");
        expect(onCollapsedChange).toHaveBeenCalledTimes(2);
        expect(sizeOf("a")).toBe(30);
      });

      it("is asked once, not on every pointer move, as a drag crosses the point where it would snap shut", () => {
        withContainerWidth(1000);
        const onCollapsedChange = vi.fn();
        render(controlled(false, onCollapsedChange));
        fireEvent.pointerDown(first(), { clientX: 300, button: 0, pointerType: "mouse", pointerId: 1 });
        for (const x of [200, 100, 50, 10, 0]) {
          act(() => {
            window.dispatchEvent(new MouseEvent("pointermove", { clientX: x }));
          });
        }
        expect(onCollapsedChange).toHaveBeenCalledTimes(1);
        expect(onCollapsedChange).toHaveBeenCalledWith(true);
        expect(sizeOf("a")).toBeGreaterThanOrEqual(20 - 1e-6);
      });

      it("starts shut, without animating shut, when it is controlled as collapsed", () => {
        const onLayoutChange = vi.fn();
        render(
          <Splitter onLayoutChange={onLayoutChange}>
            <Splitter.Pane data-testid="a" collapsible minSize={20} collapsed>
              A
            </Splitter.Pane>
            <Splitter.Pane>B</Splitter.Pane>
          </Splitter>,
        );
        expect(sizeOf("a")).toBe(0);
        expect(onLayoutChange).not.toHaveBeenCalled();
      });
    });

    it("never collapses a pane that isn't collapsible", async () => {
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70] }, { minSize: 20 }));
      first().focus();
      await user.keyboard("{Home}");
      expect(sizeOf("a")).toBe(20);
    });
  });

  describe("toggle, from a pane's own content", () => {
    const withButton = (
      props: Partial<React.ComponentProps<typeof Splitter>> = {},
      pane: Partial<React.ComponentProps<typeof Splitter.Pane>> = {},
    ) => (
      <Splitter aria-label="Workspace" defaultLayout={[30, 70]} {...props}>
        <Splitter.Pane data-testid="a" collapsible minSize={20} collapsedSize={5} {...pane}>
          {({ collapsed, toggle }) => (
            <button type="button" onClick={toggle}>
              {collapsed ? "Open" : "Close"}
            </button>
          )}
        </Splitter.Pane>
        <Splitter.Pane data-testid="b">B</Splitter.Pane>
      </Splitter>
    );

    it("collapses the pane and opens it again at the size it had", async () => {
      const user = userEvent.setup();
      render(withButton());
      first().focus();
      await user.keyboard("{ArrowRight}");
      expect(sizeOf("a")).toBe(35);
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(sizeOf("a")).toBe(5);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(sizeOf("a")).toBe(35);
    });

    it("reports a finished change, and the pane collapsing, as a handle's Enter would", async () => {
      const user = userEvent.setup();
      const onLayoutCommit = vi.fn();
      const onCollapsedChange = vi.fn();
      render(withButton({ onLayoutCommit }, { onCollapsedChange }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onLayoutCommit).toHaveBeenCalledTimes(1);
      expect(onLayoutCommit).toHaveBeenCalledWith([5, 95]);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });

    it("only asks a pane that is controlled, and the pane follows the prop", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      const { rerender } = render(withButton({}, { collapsed: false, onCollapsedChange }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      expect(sizeOf("a")).toBe(30);
      rerender(withButton({}, { collapsed: true, onCollapsedChange }));
      expect(sizeOf("a")).toBe(5);
      expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    });

    it("settles when the parent holds the state", async () => {
      const user = userEvent.setup();
      const Harness = () => {
        const [collapsed, setCollapsed] = useState(false);
        return withButton({}, { collapsed, onCollapsedChange: setCollapsed });
      };
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(sizeOf("a")).toBe(5);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(sizeOf("a")).toBe(30);
    });

    it("does nothing in a disabled splitter", async () => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      render(withButton({ disabled: true, onLayoutChange }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onLayoutChange).not.toHaveBeenCalled();
      expect(sizeOf("a")).toBe(30);
    });

    it("does nothing for a pane that can't collapse", async () => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      render(withButton({ onLayoutChange }, { collapsible: false }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it("works for a locked pane, which only a handle is barred from moving", async () => {
      const user = userEvent.setup();
      render(withButton({}, { resizable: false }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(sizeOf("a")).toBe(5);
    });

    it("is a harmless no-op for a pane outside a splitter", async () => {
      const user = userEvent.setup();
      vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Splitter.Pane>
          {({ toggle }) => (
            <button type="button" onClick={toggle}>
              Lone
            </button>
          )}
        </Splitter.Pane>,
      );
      await user.click(screen.getByRole("button", { name: "Lone" }));
      expect(screen.getByRole("button", { name: "Lone" })).toBeInTheDocument();
    });
  });

  describe("labels", () => {
    it("names one handle plainly and several by position", () => {
      const { rerender } = render(two());
      expect(first()).toHaveAccessibleName("Resize panels");
      rerender(
        <Splitter>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      expect(handles()[1]).toHaveAccessibleName("Resize panels 2 of 2");
    });

    it("names a handle after the pane before it, when the pane has a label", () => {
      render(
        <Splitter>
          <Splitter.Pane label="Sidebar">A</Splitter.Pane>
          <Splitter.Pane label="Content">B</Splitter.Pane>
          <Splitter.Pane>C</Splitter.Pane>
        </Splitter>,
      );
      expect(handles()[0]).toHaveAccessibleName("Resize Sidebar");
      expect(handles()[1]).toHaveAccessibleName("Resize Content");
    });

    it("does not put the label on the pane itself", () => {
      render(
        <Splitter>
          <Splitter.Pane label="Sidebar" data-testid="a">A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.getByTestId("a")).not.toHaveAttribute("label");
      expect(screen.getByTestId("a")).not.toHaveAttribute("aria-label");
    });

    it("hands your own handle label the position, the count and the pane's label", () => {
      const handle = vi.fn(() => "x");
      render(
        <Splitter labels={{ handle }}>
          <Splitter.Pane label="Sidebar">A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(handle).toHaveBeenCalledWith(1, 1, "Sidebar");
    });

    it("takes your own labels, keeping the defaults for what you leave out or leave undefined", () => {
      render(two({ labels: { handle: (n, t) => `Redimensionar ${n}/${t}`, collapsed: undefined } }));
      expect(first()).toHaveAccessibleName("Redimensionar 1/1");
      expect(first()).toHaveAttribute("aria-valuetext", "50%");
    });

    it("keeps the default word for collapsed when a label is passed as undefined", async () => {
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70], labels: { collapsed: undefined } }, { collapsible: true, minSize: 20 }));
      first().focus();
      await user.keyboard("{Home}");
      expect(first()).toHaveAttribute("aria-valuetext", "Collapsed");
    });

    it("uses your word for collapsed", async () => {
      const user = userEvent.setup();
      render(two({ defaultLayout: [30, 70], labels: { collapsed: "Cerrado" } }, { collapsible: true, minSize: 20 }));
      first().focus();
      await user.keyboard("{Home}");
      expect(first()).toHaveAttribute("aria-valuetext", "Cerrado");
    });

    it("writes the percentage in your own digits", () => {
      render(two({ formatNumber: (value) => `#${value}` }));
      expect(first()).toHaveAttribute("aria-valuetext", "#50%");
    });
  });

  describe("props and warnings", () => {
    it("forwards its ref, and className, style, id and data-testid, to the container", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Splitter ref={ref} className="mine" style={{ marginBlockStart: "4px" }} id="split" data-testid="root">
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      const root = screen.getByTestId("root");
      expect(ref.current).toBe(root);
      expect(root).toHaveClass("mine");
      expect(root.style.marginBlockStart).toBe("4px");
      expect(root.id).toBe("split");
    });

    it("forwards a pane's ref and props, and keeps its computed size", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Splitter defaultLayout={[40, 60]}>
          <Splitter.Pane ref={ref} className="mine" style={{ ["--splitter-pane-size" as string]: 99, color: "red" }} aria-label="Sidebar" data-testid="a">
            A
          </Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(ref.current).toBe(screen.getByTestId("a"));
      expect(screen.getByTestId("a")).toHaveClass("mine");
      expect(screen.getByTestId("a")).toHaveAttribute("aria-label", "Sidebar");
      expect(screen.getByTestId("a").style.color).toBe("red");
    });

    it("keeps its computed direction and orientation against a same-named prop", () => {
      render(
        <Splitter dir="rtl" data-testid="root" {...({ "data-orientation": "vertical" } as object)}>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(screen.getByTestId("root")).toHaveAttribute("dir", "rtl");
      expect(screen.getByTestId("root")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("warns once about a child that isn't a pane, and leaves it out", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Splitter data-testid="root">
          <Splitter.Pane>A</Splitter.Pane>
          <div>stray</div>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/only `Splitter.Pane` elements/);
      expect(screen.queryByText("stray")).toBeNull();
      expect(handles()).toHaveLength(1);
    });

    it("warns once about a pane outside a splitter, and still renders it", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<Splitter.Pane data-testid="lone">Lone</Splitter.Pane>);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/Splitter.Pane: rendered outside/);
      expect(screen.getByTestId("lone")).toHaveTextContent("Lone");
    });

    it("warns once, and falls back to the pane defaults, for a layout of the wrong length", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(two({ layout: [100] }));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/`layout` has 1 sizes for 2 panes/);
      expect([sizeOf("a"), sizeOf("b")]).toEqual([50, 50]);
    });

    it("works in StrictMode", async () => {
      const onCollapsedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <StrictMode>
          {two({ defaultLayout: [30, 70] }, { collapsible: true, minSize: 20, onCollapsedChange })}
        </StrictMode>,
      );
      first().focus();
      await user.keyboard("{Enter}");
      expect(sizeOf("a")).toBe(0);
      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    });

    it("renders on the server with every pane and handle in place", () => {
      const html = renderToString(two({ defaultLayout: [30, 70] }, { id: "nav" }));
      expect(html).toContain('role="separator"');
      expect(html).toContain('id="nav"');
      expect(html).toContain("--splitter-pane-size:30");
    });

    it("has no accessibility violations", async () => {
      const Harness = () => {
        const [open, setOpen] = useState(true);
        return (
          <Splitter defaultLayout={[30, 70]}>
            <Splitter.Pane collapsible collapsed={!open} onCollapsedChange={(c) => setOpen(!c)} minSize={20}>
              <button type="button">Inside</button>
            </Splitter.Pane>
            <Splitter.Pane>B</Splitter.Pane>
          </Splitter>
        );
      };
      const { container, rerender } = render(<Harness />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(two({ variant: "grip", disabled: true, orientation: "vertical" }));
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
