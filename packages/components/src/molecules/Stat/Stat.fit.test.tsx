import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Stat } from "./Stat";

// jsdom lays nothing out, so the widths the fit reads are stubbed: a value is `data-natural` wide at full size (plus a fixed `data-fixed`
// that does not scale, like a trend beside the number) and the stat's content box is `data-width` wide. The real browser checks measure the
// same thing for real (`Stat.checks.stories.tsx`).
const property = "--stat-value-fit";

let resizeCallbacks: Array<() => void> = [];

function scaleOf(element: HTMLElement): number {
  const raw = element.style.getPropertyValue(property);
  return raw === "" ? 1 : Number(raw);
}

beforeEach(() => {
  resizeCallbacks = [];
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      const natural = Number(this.dataset.natural ?? 0);
      return natural * scaleOf(this) + Number(this.dataset.fixed ?? 0);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.dataset.width ?? 0);
    },
  });
  // The refit waits for the next frame in the browser; here it runs at once.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  // Back to jsdom's own (own properties on the prototype are the stubs).
  delete (HTMLElement.prototype as unknown as Record<string, unknown>)
    .scrollWidth;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>)
    .clientWidth;
  vi.unstubAllGlobals();
});

function renderFit(props: {
  fitValue?: boolean;
  width: number;
  natural: number;
  fixed?: number;
}) {
  return render(
    <Stat data-testid="stat" data-width={props.width} fitValue={props.fitValue}>
      <Stat.Label>Balance due</Stat.Label>
      <Stat.Value
        data-testid="value"
        data-natural={props.natural}
        data-fixed={props.fixed}
      >
        $9,851.50
      </Stat.Value>
    </Stat>,
  );
}

describe("Stat fitValue", () => {
  it("leaves the value at the full size of its `size` when it is off, even when it does not fit", () => {
    renderFit({ width: 100, natural: 400 });
    const value = screen.getByTestId("value");
    expect(value.style.fontSize).toBe("");
    expect(value.style.getPropertyValue(property)).toBe("");
  });

  it("sets the value's font size from the full size and the fit, and changes nothing while the value fits", () => {
    renderFit({ fitValue: true, width: 200, natural: 150 });
    const value = screen.getByTestId("value");
    expect(value.style.fontSize).toBe(
      "calc(var(--dbm-font-size-4xl) * var(--stat-value-fit, 1))",
    );
    expect(value.style.getPropertyValue(property)).toBe("");
  });

  it("shrinks a value that is too wide by just the amount it is too wide", () => {
    renderFit({ fitValue: true, width: 200, natural: 400 });
    expect(scaleOf(screen.getByTestId("value"))).toBeCloseTo(0.5, 5);
  });

  it("settles on a size that fits when part of the value (a trend) keeps its own size", () => {
    renderFit({ fitValue: true, width: 250, natural: 300, fixed: 100 });
    const value = screen.getByTestId("value");
    const drawn = 300 * scaleOf(value) + 100;
    expect(drawn).toBeLessThanOrEqual(250.5);
    expect(drawn).toBeGreaterThan(230);
  });

  it("grows back to the full size when the stat gets wider, and shrinks again when it gets narrower", () => {
    renderFit({ fitValue: true, width: 200, natural: 400 });
    const stat = screen.getByTestId("stat");
    const value = screen.getByTestId("value");
    expect(scaleOf(value)).toBeCloseTo(0.5, 5);
    stat.dataset.width = "500";
    act(() => resizeCallbacks.forEach((callback) => callback()));
    expect(value.style.getPropertyValue(property)).toBe("");
    stat.dataset.width = "100";
    act(() => resizeCallbacks.forEach((callback) => callback()));
    expect(scaleOf(value)).toBeCloseTo(0.25, 5);
  });

  it("refits when its text changes", () => {
    const { rerender } = renderFit({
      fitValue: true,
      width: 200,
      natural: 400,
    });
    expect(scaleOf(screen.getByTestId("value"))).toBeCloseTo(0.5, 5);
    rerender(
      <Stat data-testid="stat" data-width={200} fitValue>
        <Stat.Value data-testid="value" data-natural={100}>
          $1.00
        </Stat.Value>
      </Stat>,
    );
    expect(screen.getByTestId("value").style.getPropertyValue(property)).toBe(
      "",
    );
  });

  it("clears the scale when the prop is turned off", () => {
    const { rerender } = renderFit({
      fitValue: true,
      width: 200,
      natural: 400,
    });
    expect(scaleOf(screen.getByTestId("value"))).toBeCloseTo(0.5, 5);
    rerender(
      <Stat data-testid="stat" data-width={200}>
        <Stat.Value data-testid="value" data-natural={400}>
          $9,851.50
        </Stat.Value>
      </Stat>,
    );
    expect(screen.getByTestId("value").style.getPropertyValue(property)).toBe(
      "",
    );
    expect(screen.getByTestId("value").style.fontSize).toBe("");
  });

  it("does nothing for a stat with no room at all (a hidden one), rather than shrinking to nothing", () => {
    renderFit({ fitValue: true, width: 0, natural: 400 });
    expect(screen.getByTestId("value").style.getPropertyValue(property)).toBe(
      "",
    );
  });

  it("lets a consumer's own font size win over the fit", () => {
    render(
      <Stat data-width={200} fitValue>
        <Stat.Value
          data-testid="value"
          data-natural={400}
          style={{ fontSize: "12px" }}
        >
          $9,851.50
        </Stat.Value>
      </Stat>,
    );
    expect(screen.getByTestId("value").style.fontSize).toBe("12px");
  });
});
