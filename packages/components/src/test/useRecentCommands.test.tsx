import { useRecentCommands } from "@dbm-system/utils";
import type { UseRecentCommandsOptions } from "@dbm-system/utils";
import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook lives in the utils package, which has no test runner of its own — its behaviour is tested here, through
// a component that uses it the way a real one does.
// A fresh key per test, so the hook's in-memory fallback (which lives as long as the page) can't carry over.
let KEY = "palette";
let counter = 0;

function Probe({ id = "a", name = KEY, ...options }: UseRecentCommandsOptions & { id?: string; name?: string }) {
  const { ready, recent, add, remove, clear } = useRecentCommands(name, options);
  return (
    <div>
      <span data-testid={`${id}-state`}>{!ready ? "not ready" : recent.join(",") || "empty"}</span>
      {["x", "y", "z", "w"].map((value) => (
        <button key={value} onClick={() => add(value)}>
          add {value} {id}
        </button>
      ))}
      <button onClick={() => remove("y")}>remove y {id}</button>
      <button onClick={clear}>clear {id}</button>
    </div>
  );
}

const state = (id = "a") => screen.getByTestId(`${id}-state`).textContent;
const press = (name: string) => act(() => void screen.getByRole("button", { name }).click());

beforeEach(() => {
  KEY = `palette-${counter++}`;
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useRecentCommands", () => {
  it("is ready straight away in the browser, with nothing remembered", () => {
    render(<Probe />);
    expect(state()).toBe("empty");
  });

  it("puts the newest first, moves a repeat up, and remembers it in localStorage under a namespaced key", () => {
    render(<Probe />);
    press("add x a");
    press("add y a");
    press("add z a");
    expect(state()).toBe("z,y,x");
    press("add x a");
    expect(state()).toBe("x,z,y");
    expect(JSON.parse(window.localStorage.getItem(`dbm-recent:${KEY}`) as string)).toEqual(["x", "z", "y"]);
  });

  it("keeps at most max, dropping the oldest, and trims a longer stored list to a smaller max", () => {
    const { unmount } = render(<Probe max={2} />);
    press("add x a");
    press("add y a");
    press("add z a");
    expect(state()).toBe("z,y");
    unmount();
    window.localStorage.setItem(`dbm-recent:${KEY}`, JSON.stringify(["a", "b", "c", "d"]));
    render(<Probe max={3} />);
    expect(state()).toBe("a,b,c");
  });

  it("starts with what an earlier visit left", () => {
    window.localStorage.setItem(`dbm-recent:${KEY}`, JSON.stringify(["x", "y"]));
    render(<Probe />);
    expect(state()).toBe("x,y");
  });

  it("removes one value and clears them all", () => {
    render(<Probe />);
    press("add x a");
    press("add y a");
    press("remove y a");
    expect(state()).toBe("x");
    press("clear a");
    expect(state()).toBe("empty");
    expect(window.localStorage.getItem(`dbm-recent:${KEY}`)).toBeNull();
  });

  it("uses sessionStorage when asked, and leaves localStorage alone", () => {
    render(<Probe storage="session" />);
    press("add x a");
    expect(window.sessionStorage.getItem(`dbm-recent:${KEY}`)).toBe('["x"]');
    expect(window.localStorage.getItem(`dbm-recent:${KEY}`)).toBeNull();
  });

  it("keeps two components on the same key in step, and different keys apart", () => {
    render(
      <>
        <Probe id="a" />
        <Probe id="b" />
        <Probe id="c" name={`${KEY}-other`} />
      </>,
    );
    press("add x a");
    expect(state("a")).toBe("x");
    expect(state("b")).toBe("x");
    expect(state("c")).toBe("empty");
  });

  it("follows another tab changing the list", () => {
    render(<Probe />);
    act(() => {
      window.localStorage.setItem(`dbm-recent:${KEY}`, JSON.stringify(["x"]));
      window.dispatchEvent(new StorageEvent("storage", { key: `dbm-recent:${KEY}` }));
    });
    expect(state()).toBe("x");
  });

  it("reads nothing from storage that holds something else, and keeps only strings from a mixed list", () => {
    window.localStorage.setItem(`dbm-recent:${KEY}`, "not json");
    const { unmount } = render(<Probe />);
    expect(state()).toBe("empty");
    unmount();
    window.localStorage.setItem(`dbm-recent:${KEY}`, JSON.stringify({ a: 1 }));
    const second = render(<Probe />);
    expect(state()).toBe("empty");
    second.unmount();
    window.localStorage.setItem(`dbm-recent:${KEY}`, JSON.stringify(["x", 3, null, "y"]));
    render(<Probe />);
    expect(state()).toBe("x,y");
  });

  it("falls back to memory when storage refuses a write, so the list lasts for the page", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    render(<Probe />);
    press("add x a");
    press("add y a");
    expect(state()).toBe("y,x");
  });

  it("works when reading the storage object itself throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    render(<Probe />);
    press("add x a");
    expect(state()).toBe("x");
  });

  it("has callbacks that never change identity", () => {
    const seen: Array<ReturnType<typeof useRecentCommands>> = [];
    function Capture() {
      seen.push(useRecentCommands(KEY));
      return null;
    }
    const { rerender } = render(<Capture />);
    rerender(<Capture />);
    expect(seen[0]?.add).toBe(seen[seen.length - 1]?.add);
    expect(seen[0]?.remove).toBe(seen[seen.length - 1]?.remove);
    expect(seen[0]?.clear).toBe(seen[seen.length - 1]?.clear);
  });

  it("works under StrictMode", () => {
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    press("add x a");
    expect(state()).toBe("x");
  });

  it("renders as not ready on the server, without touching window", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    try {
      expect(renderToString(<Probe />)).toContain("not ready");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
