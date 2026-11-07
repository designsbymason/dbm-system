import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createToaster, Toast, useToast } from "./Toast";
import styles from "./Toast.module.css";
import type { ToastApi, ToastProviderProps } from "./Toast.types";
import { DirectionProvider } from "../../atoms/DirectionProvider";

// Where the hook's functions are handed out, so a test can call them outside a click.
const captured: { api: ToastApi } = { api: undefined as unknown as ToastApi };
const api = new Proxy({} as ToastApi, { get: (_target, key) => captured.api[key as keyof ToastApi] });
function Capture() {
  const value = useToast();
  useEffect(() => {
    captured.api = value;
  });
  return null;
}

function Provider(props: Partial<ToastProviderProps> & { children?: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <Toast.Provider {...rest}>
      <Capture />
      {children}
    </Toast.Provider>
  );
}

// jsdom runs no animations, so a toast that is closing waits for an `animationend` that never comes: say it ended.
const animationEnd = (element: Element | null) => {
  if (element) fireEvent(element, new Event("webkitAnimationEnd", { bubbles: true }));
};
const toasts = () => screen.queryAllByRole("listitem");
const region = () => screen.getByRole("region", { name: /notifications/i });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Toast.Provider", () => {
  it("is a landmark named for its hotkey, with no toasts to begin with", () => {
    render(<Provider />);
    expect(region()).toHaveAccessibleName("Notifications (F8)");
    expect(toasts()).toHaveLength(0);
  });

  it("takes its name and the text it supplies from `labels`, an undefined one keeping its default", () => {
    render(<Provider labels={{ viewport: "Meldungen ({hotkey})", dismiss: undefined }} />);
    act(() => {
      api.toast({ title: "Gespeichert" });
    });
    expect(screen.getByRole("region", { name: "Meldungen (F8)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("names the hotkey it is given", () => {
    render(<Provider hotkey={["altKey", "KeyT"]} />);
    expect(region()).toHaveAccessibleName("Notifications (alt+T)");
  });

  it("is drawn into the body, or into `container`", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<Provider container={container} />);
    expect(container).toContainElement(region());
    container.remove();
  });

  it("forwards its ref to the list the toasts are in, with className, style, id and data-testid there", () => {
    const ref = createRef<HTMLOListElement>();
    render(<Toast.Provider ref={ref} className="mine" style={{ color: "red" }} id="toasts" data-testid="viewport" />);
    expect(ref.current).toBe(screen.getByTestId("viewport"));
    expect(ref.current?.tagName).toBe("OL");
    expect(ref.current).toHaveClass("mine");
    expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref.current).toHaveAttribute("id", "toasts");
  });

  it("lets a same-named prop not replace the direction or placement in effect", () => {
    render(<Provider placement="top" dir="rtl" data-testid="viewport" {...({ "data-placement": "bottom" } as object)} />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "top");
    expect(screen.getByTestId("viewport")).toHaveAttribute("dir", "rtl");
  });

  it("takes its direction from a DirectionProvider", () => {
    render(<DirectionProvider dir="rtl"><Provider data-testid="viewport" /></DirectionProvider>);
    expect(screen.getByTestId("viewport")).toHaveAttribute("dir", "rtl");
  });

  it("is placed at the top end by default, and takes a responsive map", () => {
    const { unmount } = render(<Provider data-testid="viewport" />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "top-end");
    unmount();
    render(<Provider data-testid="viewport" placement={{ base: "top", md: "bottom-start" }} />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "top");
  });
});

describe("toast()", () => {
  it("shows a titled and described toast and returns its id", () => {
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Saved", description: "Your changes are live." });
    });
    expect(id).not.toBe("");
    const item = within(region()).getByRole("listitem");
    expect(item).toHaveTextContent("Saved");
    expect(item).toHaveTextContent("Your changes are live.");
  });

  it("takes a plain string as the title", () => {
    render(<Provider />);
    act(() => {
      api.toast("Copied");
    });
    expect(within(region()).getByText("Copied")).toBeInTheDocument();
  });

  it("draws each tone with its own look, and the variant and size it is given", () => {
    render(<Provider variant="outlined" size="lg" />);
    act(() => {
      api.toast({ title: "Oops", tone: "danger" });
    });
    const item = toasts()[0] as HTMLElement;
    expect(item).toHaveClass(styles.toneDanger as string);
    expect(item).toHaveClass(styles.variantOutlined as string);
    expect(item).toHaveClass(styles.sizeLg as string);
  });

  it("updates the toast with the same id instead of adding another", () => {
    render(<Provider />);
    act(() => {
      api.toast({ id: "one", title: "First" });
      api.toast({ id: "one", title: "Second" });
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toHaveTextContent("Second");
    expect(toasts()[0]).not.toHaveTextContent("First");
  });

  it("changes a toast with update(), keeping the rest of it", () => {
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Uploading", description: "3 files" });
    });
    act(() => api.update(id, { title: "Uploaded" }));
    expect(toasts()[0]).toHaveTextContent("Uploaded");
    expect(toasts()[0]).toHaveTextContent("3 files");
  });

  it("ignores update() and dismiss() for an id that is not there", () => {
    render(<Provider />);
    expect(() => {
      act(() => {
        api.update("nope", { title: "x" });
        api.dismiss("nope");
      });
    }).not.toThrow();
  });

  it("shows at most `limit` at once and brings the rest in as room is made", async () => {
    render(<Provider limit={2} />);
    act(() => {
      api.toast({ id: "a", title: "A" });
      api.toast({ id: "b", title: "B" });
      api.toast({ id: "c", title: "C" });
    });
    const shown = () => toasts().map((item) => item.textContent ?? "").filter((text) => !text.includes("Clear all"));
    expect(shown()).toEqual([expect.stringContaining("A"), expect.stringContaining("B")]);
    act(() => api.dismiss("a"));
    animationEnd(screen.queryByText("A")?.closest("li") ?? null);
    await waitFor(() => expect(screen.queryByText("C")).toBeInTheDocument());
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("closes every toast and drops the ones waiting with dismissAll()", async () => {
    render(<Provider limit={1} />);
    act(() => {
      api.toast({ id: "a", title: "A" });
      api.toast({ id: "b", title: "B" });
    });
    act(() => api.dismissAll());
    animationEnd(screen.queryByText("A")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });
});

describe("a toast's announcement", () => {
  it("interrupts for danger and warning and waits for the rest", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Failed", tone: "danger" });
      api.toast({ title: "Heads up", tone: "warning" });
      api.toast({ title: "Saved", tone: "success" });
    });
    // The text goes into the live regions a frame after they are in the page, which is what makes it a change.
    // three toasts, and the "Clear all" bar that appears with the second
    await waitFor(() => expect(document.querySelectorAll("[aria-live]")).toHaveLength(4));
    await waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).not.toBe(""));
    const live = Array.from(document.querySelectorAll("[aria-live]"));
    expect(live.filter((node) => node.getAttribute("aria-live") === "assertive").map((node) => node.textContent)).toEqual([
      expect.stringContaining("Failed"),
      expect.stringContaining("Heads up"),
    ]);
    expect(
      live.filter((node) => node.getAttribute("aria-live") === "polite").map((node) => node.textContent),
    ).toEqual([expect.stringContaining("Saved"), expect.stringContaining("Clear all")]);
  });

  it("takes the role it is given over the tone's", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Quiet", tone: "danger", role: "status" });
    });
    await waitFor(() => expect(document.querySelector("[aria-live]")).toHaveAttribute("aria-live", "polite"));
  });

  it("reads the notification label before the text, and the action's alternative in place of the button", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu" } });
    });
    await waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).not.toBe(""));
    const announced = document.querySelector("[aria-live]")?.textContent ?? "";
    expect(announced).toContain("Notification");
    expect(announced).toContain("Deleted");
    expect(announced).toContain("Undo from the Edit menu");
  });
});

describe("a toast's time", () => {
  it("closes by itself after the provider's duration, reporting a timeout", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "timeout" });
  });

  it("takes its own duration over the provider's", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={10000} />);
    act(() => {
      api.toast({ title: "Quick", duration: 500, onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(501);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("stays until it is dismissed with a duration of null", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={100} />);
    act(() => {
      api.toast({ title: "Sticky", duration: null, onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toasts()).toHaveLength(1);
  });

  it("is held while the pointer is over the toasts and carries on with what was left", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.pointerMove(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.pointerLeave(region());
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("is held while focus is inside the toasts", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      screen.getByRole("button", { name: "Dismiss" }).focus();
      vi.advanceTimersByTime(5000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("closing", () => {
  it("is done by the dismiss button, with the reason and the exit", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onOpenChangeComplete = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange, onOpenChangeComplete });
    });
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "dismiss" });
    animationEnd(screen.queryByText("Saved")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false);
  });

  it("is done by dismiss() with the reason 'programmatic'", async () => {
    const onOpenChange = vi.fn();
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Saved", onOpenChange });
    });
    act(() => api.dismiss(id));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "programmatic" });
  });

  it("is done by Escape from inside the toast", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
  });

  it("has no dismiss button when `dismissible` is false", () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", dismissible: false });
    });
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});

describe("an action", () => {
  it("runs its handler, closes the toast and says it was the action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu", onClick }, onOpenChange });
    });
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });

  it("is a button of the toast's own size, with the variant it is given", () => {
    render(<Provider size="lg" />);
    act(() => {
      api.toast({ title: "Saved", action: { label: "View", altText: "Open it from the list", variant: "tertiary" } });
    });
    expect(screen.getByRole("button", { name: "View" })).toHaveClass(styles.actionTertiary as string);
  });

  it("complains, in development, of an alternative that is missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", action: { label: "Undo", altText: "" } });
    });
    expect(error).toHaveBeenCalled();
  });

  it("falls back to primary for a variant that is not one of ours, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Toast.Provider>
        <Toast>
          <Toast.Action altText="Do it elsewhere" variant={"loud" as never}>
            Go
          </Toast.Action>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass(styles.actionPrimary as string);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toast.Action"));
  });
});

describe("loading and toast.promise()", () => {
  it("shows a spinner in place of the icon and stays until it is updated", () => {
    vi.useFakeTimers();
    render(<Provider duration={100} />);
    act(() => {
      api.toast({ title: "Saving…", loading: true });
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]?.querySelector(`.${styles.icon}`)?.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("replaces the loading toast with the success one, in the same place", async () => {
    render(<Provider />);
    let resolve: (value: number) => void = () => undefined;
    const pending = new Promise<number>((done) => {
      resolve = done;
    });
    act(() => {
      void api.toast.promise(pending, {
        loading: "Saving…",
        success: (count) => ({ title: `Saved ${count} files`, description: "All done." }),
        error: "Could not save",
      });
    });
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    await act(async () => {
      resolve(3);
      await pending;
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toHaveTextContent("Saved 3 files");
    expect(toasts()[0]).toHaveClass(styles.toneSuccess as string);
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("shows the error one on a rejection, and leaves the rejection to the caller", async () => {
    render(<Provider />);
    const failure = new Error("nope");
    const pending = Promise.reject(failure);
    let outcome: unknown;
    act(() => {
      outcome = api.toast.promise(pending, {
        loading: "Saving…",
        success: "Saved",
        error: (reason) => `Failed: ${(reason as Error).message}`,
      });
    });
    await expect(outcome).rejects.toBe(failure);
    await waitFor(() => expect(toasts()[0]).toHaveTextContent("Failed: nope"));
    expect(toasts()[0]).toHaveClass(styles.toneDanger as string);
  });
});

describe("Toast, declared as parts", () => {
  function Declared({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = useState(true);
    return (
      <Toast.Provider>
        <Toast
          tone="success"
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange?.(next);
          }}
        >
          <Toast.Title>Saved</Toast.Title>
          <Toast.Description>Your changes are live.</Toast.Description>
        </Toast>
        <button type="button" onClick={() => setOpen(true)}>
          Again
        </button>
      </Toast.Provider>
    );
  }

  it("draws its parts and takes the controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Declared onOpenChange={onOpenChange} />);
    expect(toasts()[0]).toHaveTextContent("Saved");
    expect(toasts()[0]).toHaveTextContent("Your changes are live.");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    animationEnd(screen.queryByText("Saved")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    await user.click(screen.getByRole("button", { name: "Again" }));
    expect(toasts()).toHaveLength(1);
  });

  it("starts closed with defaultOpen={false}", () => {
    render(
      <Toast.Provider>
        <Toast defaultOpen={false}>
          <Toast.Title>Hidden</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(toasts()).toHaveLength(0);
  });

  it("forwards its ref and takes className, style, id and data-testid on the list item", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <Toast.Provider>
        <Toast ref={ref} className="mine" style={{ color: "red" }} id="t" data-testid="toast">
          <Toast.Title>Saved</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    const item = screen.getByTestId("toast");
    expect(ref.current).toBe(item);
    expect(item.tagName).toBe("LI");
    expect(item).toHaveClass("mine");
    expect(item).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(item).toHaveAttribute("id", "t");
  });

  it("passes className, style, id and data-testid through on every part", () => {
    const extra = { className: "mine", style: { color: "red" }, id: "p" } as const;
    render(
      <Toast.Provider>
        <Toast>
          <Toast.Title {...extra} id="title" data-testid="title">
            Saved
          </Toast.Title>
          <Toast.Description {...extra} id="description" data-testid="description">
            Live
          </Toast.Description>
          <Toast.Action {...extra} id="action" data-testid="action" altText="Open it">
            View
          </Toast.Action>
        </Toast>
      </Toast.Provider>,
    );
    for (const name of ["title", "description", "action"]) {
      const element = screen.getByTestId(name);
      expect(element).toHaveClass("mine");
      expect(element).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(element).toHaveAttribute("id", name);
    }
    // the part's own class is kept beside the caller's
    expect(screen.getByTestId("title")).toHaveClass(styles.title as string);
    expect(screen.getByTestId("action")).toHaveClass(styles.action as string);
  });

  it("keeps a same-named prop from replacing the part's own class", () => {
    render(
      <Toast.Provider>
        <Toast tone="danger" {...({ "data-state": "closed" } as object)}>
          <Toast.Title data-testid="title">Saved</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByTestId("title")).toHaveClass(styles.title as string);
    expect(toasts()[0]).toHaveAttribute("data-state", "open");
  });

  it("takes the provider's variant and size unless it says its own", () => {
    render(
      <Toast.Provider variant="solid" size="sm">
        <Toast data-testid="a">
          <Toast.Title>A</Toast.Title>
        </Toast>
        <Toast data-testid="b" variant="outlined" size="xl">
          <Toast.Title>B</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByTestId("a")).toHaveClass(styles.variantSolid as string, styles.sizeSm as string);
    expect(screen.getByTestId("b")).toHaveClass(styles.variantOutlined as string, styles.sizeXl as string);
  });
});

describe("outside a provider", () => {
  it("does nothing from useToast(), with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    function Lonely() {
      const { toast } = useToast();
      return <button onClick={() => toast("Hi")}>Go</button>;
    }
    render(<Lonely />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toast.Provider"));
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });
});

describe("StrictMode", () => {
  it("still closes by itself, and only once", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Provider duration={1000} />
      </StrictMode>,
    );
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});

describe("accessibility", () => {
  it.each(["info", "success", "warning", "danger", "neutral"] as const)("has no axe violations for a %s toast", async (tone) => {
    const { container } = render(<Provider />);
    act(() => {
      api.toast({ title: "Heads up", description: "Something happened.", tone, action: { label: "View", altText: "Open the list" } });
    });
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it.each(["subtle", "outlined", "solid"] as const)("has no axe violations for a %s toast", async (variant) => {
    render(<Provider variant={variant} />);
    act(() => {
      api.toast({ title: "Saved" });
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("an action that returns a promise", () => {
  function deferred() {
    let resolve: () => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    const promise = new Promise<void>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    return { promise, resolve, reject };
  }

  it("holds the toast open with a spinner, presses once, and closes with the reason 'action' when it resolves", async () => {
    const user = userEvent.setup();
    const work = deferred();
    const onClick = vi.fn(() => work.promise);
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Deleted", onOpenChange, action: { label: "Undo", altText: "Undo from the Edit menu", onClick } });
    });
    const button = screen.getByRole("button", { name: "Undo" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button.querySelector("svg, span[aria-hidden]")).not.toBeNull();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });

  it("does not time out, be dismissed or be swiped away while it runs", async () => {
    vi.useFakeTimers();
    const work = deferred();
    const onOpenChange = vi.fn();
    render(<Provider duration={500} />);
    act(() => {
      api.toast({ title: "Deleted", onOpenChange, action: { label: "Undo", altText: "Undo", onClick: () => work.promise } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toasts().length).toBeGreaterThan(0);
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });

  it("stays open and available again on a rejection, and hands the error to onError", async () => {
    const user = userEvent.setup();
    const failure = new Error("offline");
    const onError = vi.fn();
    const onOpenChange = vi.fn();
    let attempt = 0;
    render(<Provider />);
    act(() => {
      api.toast({
        title: "Deleted",
        onOpenChange,
        action: {
          label: "Undo",
          altText: "Undo from the Edit menu",
          onError,
          onClick: () => (attempt++ === 0 ? Promise.reject(failure) : undefined),
        },
      });
    });
    const button = screen.getByRole("button", { name: "Undo" });
    await user.click(button);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(button);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });
});

describe("a message raised again while it is showing", () => {
  it("is shown once, with a count, and starts its time again", () => {
    vi.useFakeTimers();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", description: "Your changes are live." });
    });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    act(() => {
      api.toast({ title: "Saved", description: "Your changes are live." });
    });
    expect(toasts().filter((item) => item.textContent?.includes("Saved"))).toHaveLength(1);
    expect(screen.getByText("×2")).toBeInTheDocument();
    // 800ms of the first one's time has passed; a restart means it is still here 800ms later
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(toasts().some((item) => item.getAttribute("data-state") === "open")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(toasts().every((item) => item.getAttribute("data-state") === "closed")).toBe(true);
  });

  it("is not merged when it has an id, a different handler, or says something else", () => {
    render(<Provider limit={9} />);
    act(() => {
      api.toast({ id: "a", title: "Saved" });
      api.toast({ id: "b", title: "Saved" });
      api.toast({ title: "Saved", onOpenChange: () => undefined });
      api.toast({ title: "Saved", onOpenChange: () => undefined });
      api.toast({ title: "Saved", action: { label: "Undo", altText: "Undo", onClick: () => undefined } });
      api.toast({ title: "Saved", action: { label: "Undo", altText: "Undo", onClick: () => undefined } });
      api.toast({ title: "Saved", tone: "success" });
    });
    expect(toasts().filter((item) => item.textContent?.includes("Saved"))).toHaveLength(7);
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it("is merged when its action and callbacks are the very same functions", () => {
    const undo = vi.fn();
    const onOpenChange = vi.fn();
    render(<Provider limit={9} />);
    act(() => {
      api.toast({ title: "Archived", onOpenChange, action: { label: "Undo", altText: "Undo", onClick: undo } });
      api.toast({ title: "Archived", onOpenChange, action: { label: "Undo", altText: "Undo", onClick: undo } });
    });
    expect(toasts().filter((item) => item.textContent?.includes("Archived"))).toHaveLength(1);
    expect(screen.getByText("×2")).toBeInTheDocument();
  });

  it("can be turned off", () => {
    render(<Provider mergeDuplicates={false} limit={5} />);
    act(() => {
      api.toast({ title: "Saved" });
      api.toast({ title: "Saved" });
    });
    expect(toasts().filter((item) => item.textContent?.includes("Saved"))).toHaveLength(2);
  });

  it("writes its count with formatNumber", () => {
    render(<Provider formatNumber={(value) => `#${value}`} />);
    act(() => {
      api.toast({ title: "Copied" });
      api.toast({ title: "Copied" });
    });
    expect(screen.getByText("×#2")).toBeInTheDocument();
  });

  it("writes its count with `labels.repeated` when given one", () => {
    render(<Provider labels={{ repeated: (count) => `(${count} fois)` }} />);
    act(() => {
      api.toast({ title: "Copié" });
      api.toast({ title: "Copié" });
    });
    expect(screen.getByText("(2 fois)")).toBeInTheDocument();
  });

  it("is told apart from one that has left, which is raised afresh", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved" });
    });
    act(() => api.dismissAll());
    animationEnd(screen.queryByText("Saved")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    act(() => {
      api.toast({ title: "Saved" });
    });
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });
});

describe("a toast replaced under the same id", () => {
  it("starts its time again and takes the new content", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ id: "sync", title: "Syncing", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });
    act(() => {
      api.toast({ id: "sync", title: "Synced", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toasts()[0]).toHaveTextContent("Synced");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "timeout" });
  });

  it("is not drawn afresh by update()", () => {
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Uploading" });
    });
    const before = toasts()[0];
    act(() => api.update(id, { title: "Uploaded" }));
    expect(toasts()[0]).toBe(before);
  });

  it("is read again: a replaced toast announces its new text", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ id: "save", title: "Saving…", loading: true });
    });
    await waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).toContain("Saving"));
    act(() => {
      api.toast({ id: "save", title: "Saved", tone: "success" });
    });
    await waitFor(() => expect(Array.from(document.querySelectorAll("[aria-live]")).some((node) => node.textContent?.includes("Saved"))).toBe(true));
  });
});

describe("Clear all", () => {
  it("is drawn once more than one toast is showing, and closes them all and the ones waiting", async () => {
    const user = userEvent.setup();
    render(<Provider limit={2} />);
    act(() => {
      api.toast({ id: "a", title: "A" });
    });
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    act(() => {
      api.toast({ id: "b", title: "B" });
      api.toast({ id: "c", title: "C" });
    });
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  it("goes away again when only one is left, and can be turned off or renamed", async () => {
    const { unmount } = render(<Provider />);
    let first = "";
    act(() => {
      first = api.toast({ title: "A" });
      api.toast({ title: "B" });
    });
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
    act(() => api.dismiss(first));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument());
    unmount();

    const off = render(<Provider clearAll={false} />);
    act(() => {
      api.toast({ title: "A" });
      api.toast({ title: "B" });
    });
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    off.unmount();

    render(<Provider labels={{ clearAll: "Tout effacer" }} />);
    act(() => {
      api.toast({ title: "A" });
      api.toast({ title: "B" });
    });
    expect(screen.getByRole("button", { name: "Tout effacer" })).toBeInTheDocument();
  });
});

describe("createToaster()", () => {
  it("raises toasts from outside React, which wait for a provider and show when it mounts", () => {
    const toaster = createToaster();
    const id = toaster.toast({ title: "Raised early" });
    expect(id).not.toBe("");
    render(<Toast.Provider toaster={toaster} />);
    expect(toasts()[0]).toHaveTextContent("Raised early");
    act(() => {
      toaster.toast({ tone: "danger", title: "Later" });
    });
    expect(toasts().filter((item) => !item.textContent?.includes("Clear all"))).toHaveLength(2);
    act(() => toaster.dismiss(id));
    expect(
      toasts().filter((item) => item.getAttribute("data-state") === "open" && !item.textContent?.includes("Clear all")),
    ).toHaveLength(1);
  });

  it("is what useToast() hands out under its provider", () => {
    const toaster = createToaster();
    render(
      <Toast.Provider toaster={toaster}>
        <Capture />
      </Toast.Provider>,
    );
    expect(captured.api.toast).toBe(toaster.toast);
  });

  it("keeps two toasters apart", () => {
    const one = createToaster();
    const other = createToaster();
    one.toast({ title: "Only in one" });
    render(<Toast.Provider toaster={other} />);
    expect(toasts()).toHaveLength(0);
  });
});

describe("a fanned stack", () => {
  const list = () => document.querySelector("ol[data-placement]") as HTMLElement;
  const raise = (count: number) =>
    act(() => {
      for (let index = 1; index <= count; index += 1) api.toast({ title: `Message ${index}` });
    });

  it("is the list unless it is asked for, and takes a responsive map", () => {
    const { unmount } = render(<Provider />);
    expect(list()).toHaveAttribute("data-stack", "list");
    unmount();
    const fan = render(<Provider stack="fan" />);
    expect(list()).toHaveAttribute("data-stack", "fan");
    fan.unmount();
    render(<Provider stack={{ base: "fan", md: "list" }} />);
    expect(list()).toHaveAttribute("data-stack", "fan");
  });

  it("gives each open toast its depth behind the newest, at most two layers back, and a layer to sit on", async () => {
    render(<Provider stack="fan" limit={5} />);
    raise(4);
    // measured as the list changes, from what the browser has laid out
    await waitFor(() => expect(toasts()[3]?.style.getPropertyValue("--toast-depth")).toBe("0"));
    const depths = toasts()
      .filter((item) => !item.hasAttribute("data-clear-all"))
      .map((item) => item.style.getPropertyValue("--toast-depth"));
    expect(depths).toEqual(["2", "2", "1", "0"]);
    const layers = toasts().map((item) => item.style.getPropertyValue("--toast-layer"));
    expect(layers).toEqual(["1", "2", "3", "4"]);
  });

  it("is spread out while the pointer is over the toasts, and folds back after it leaves", () => {
    vi.useFakeTimers();
    render(<Provider stack="fan" limit={5} />);
    raise(3);
    expect(list()).not.toHaveAttribute("data-expanded");
    fireEvent.pointerOver(toasts()[0] as HTMLElement);
    expect(list()).toHaveAttribute("data-expanded");
    fireEvent.pointerOut(toasts()[0] as HTMLElement, { relatedTarget: document.body });
    expect(list()).toHaveAttribute("data-expanded");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(list()).not.toHaveAttribute("data-expanded");
  });

  it("stays spread out while the pointer only moves between its toasts", () => {
    vi.useFakeTimers();
    render(<Provider stack="fan" limit={5} />);
    raise(2);
    const [first, second] = toasts() as [HTMLElement, HTMLElement];
    fireEvent.pointerOver(first);
    fireEvent.pointerOut(first, { relatedTarget: second });
    fireEvent.pointerOver(second);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(list()).toHaveAttribute("data-expanded");
  });

  it("is spread out while focus is inside it", () => {
    vi.useFakeTimers();
    render(<Provider stack="fan" limit={5} />);
    raise(2);
    act(() => {
      screen.getAllByRole("button", { name: "Dismiss" })[0]?.focus();
    });
    expect(list()).toHaveAttribute("data-expanded");
    act(() => {
      (document.activeElement as HTMLElement).blur();
      vi.advanceTimersByTime(300);
    });
    expect(list()).not.toHaveAttribute("data-expanded");
  });

  it("draws Clear all only while it is spread out", () => {
    vi.useFakeTimers();
    render(<Provider stack="fan" limit={5} />);
    raise(2);
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    fireEvent.pointerOver(toasts()[0] as HTMLElement);
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("changes nothing in the list: no expansion, and Clear all is there at once", () => {
    render(<Provider limit={5} />);
    raise(2);
    fireEvent.pointerOver(toasts()[0] as HTMLElement);
    expect(list()).not.toHaveAttribute("data-expanded");
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("keeps every toast in the page's order and tab order", () => {
    render(<Provider stack="fan" limit={5} />);
    raise(3);
    const titles = toasts()
      .filter((item) => !item.hasAttribute("data-clear-all"))
      .map((item) => item.textContent);
    expect(titles).toEqual([expect.stringContaining("Message 1"), expect.stringContaining("Message 2"), expect.stringContaining("Message 3")]);
    for (const item of toasts()) expect(item).toHaveAttribute("tabindex", "0");
  });
});

describe("Toast.Action drawn onto your own element", () => {
  it("is the link you gave it, with the action's class, and closes the toast when pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Toast.Provider>
        <Toast onOpenChange={onOpenChange}>
          <Toast.Title>Saved</Toast.Title>
          <Toast.Action asChild altText="Open it from the list">
            <a href="#files">View</a>
          </Toast.Action>
        </Toast>
      </Toast.Provider>,
    );
    const link = screen.getByRole("link", { name: "View" });
    expect(link).toHaveAttribute("href", "#files");
    expect(link).toHaveClass(styles.action as string);
    await user.click(link);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });

  it("holds the toast open while a promise runs, saying so on the element and with no spinner beside it", async () => {
    const user = userEvent.setup();
    let resolve: () => void = () => undefined;
    const work = new Promise<void>((done) => {
      resolve = done;
    });
    const onOpenChange = vi.fn();
    render(
      <Toast.Provider>
        <Toast onOpenChange={onOpenChange}>
          <Toast.Title>Deleted</Toast.Title>
          <Toast.Action asChild altText="Restore it from Trash" onClick={() => work}>
            <a href="#trash">Undo</a>
          </Toast.Action>
        </Toast>
      </Toast.Provider>,
    );
    const link = screen.getByRole("link", { name: "Undo" });
    await user.click(link);
    expect(link).toHaveAttribute("aria-busy", "true");
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      resolve();
      await work;
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });
});

describe("Clear all while it has focus", () => {
  it("hands focus to the toast that is left when it goes, instead of dropping it to the page", async () => {
    render(<Provider />);
    let first = "";
    act(() => {
      first = api.toast({ title: "A" });
      api.toast({ title: "B" });
    });
    const clear = screen.getByRole("button", { name: "Clear all" });
    act(() => clear.focus());
    act(() => api.dismiss(first));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument());
    const left = toasts().find((item) => item.getAttribute("data-state") === "open" && !item.hasAttribute("data-clear-all"));
    expect(left).toBeDefined();
    expect(document.activeElement).toBe(left);
  });

  it("leaves focus alone when it was not on it", async () => {
    render(
      <Provider>
        <button type="button">Elsewhere</button>
      </Provider>,
    );
    let first = "";
    act(() => {
      first = api.toast({ title: "A" });
      api.toast({ title: "B" });
    });
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    act(() => elsewhere.focus());
    act(() => api.dismiss(first));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument());
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("swipeThreshold", () => {
  const drag = (item: HTMLElement, distance: number) => {
    fireEvent.pointerDown(item, { clientX: 100, clientY: 10, button: 0, pointerId: 1 });
    fireEvent.pointerMove(item, { clientX: 100 + distance, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(item, { clientX: 100 + distance, clientY: 10, pointerId: 1 });
  };

  it("closes the toast on a drag past it, and springs back on a shorter one", () => {
    const onOpenChange = vi.fn();
    render(<Provider swipeThreshold={80} />);
    act(() => {
      api.toast({ title: "Saved", duration: null, onOpenChange });
    });
    const item = toasts()[0] as HTMLElement;
    act(() => drag(item, 40));
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => drag(item, 120));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "swipe" });
  });
});
