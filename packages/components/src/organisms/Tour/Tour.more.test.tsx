import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TourController, TourStep } from "./Tour.types";
import { Harness, threeSteps } from "./tourTestKit";

afterEach(() => {
  vi.restoreAllMocks();
});

const card = () => screen.findByRole("dialog");
const name = (title: string) => waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName(title));

describe("Tour — progress", () => {
  it("draws a bar of segments, those reached marked, and still names the step for a screen reader", async () => {
    render(<Harness progress="bar" defaultValue="two" />);
    const dialog = await card();
    const segments = dialog.querySelectorAll('[class*="segment"]');
    expect(segments).toHaveLength(3);
    expect([...segments].map((segment) => segment.hasAttribute("data-reached"))).toEqual([true, true, false]);
    expect(dialog).toHaveTextContent("Step 2 of 3");
  });

  it("draws both the bar and the text", async () => {
    render(<Harness progress="both" />);
    const dialog = await card();
    expect(dialog.querySelectorAll('[class*="segment"]')).toHaveLength(3);
    expect(dialog).toHaveTextContent("Step 1 of 3");
  });
});

describe("Tour — dismissals", () => {
  it("offers remind me later and don't show again in a menu, reporting each reason", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(<Harness dismissals={["later", "never"]} onOpenChange={onOpenChange} />);
    await card();
    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remind me later" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "later", stepId: "one" });
    unmount();
    render(<Harness dismissals={["later", "never"]} onOpenChange={onOpenChange} />);
    await card();
    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(await screen.findByRole("menuitem", { name: "Don't show again" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "never", stepId: "one" });
  });

  it("puts the button right after Skip, in the progress row, and draws none without dismissals", async () => {
    const { unmount } = render(<Harness dismissals={["never"]} />);
    const dialog = await card();
    const skip = within(dialog).getByRole("button", { name: "Skip tour" });
    const more = within(dialog).getByRole("button", { name: "More options" });
    expect(more.closest('[class*="topRow"]')).toContainElement(skip);
    expect(skip.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();
    render(<Harness />);
    expect(within(await card()).queryByRole("button", { name: "More options" })).toBeNull();
  });

  it("offers only the dismissals asked for", async () => {
    const user = userEvent.setup();
    render(<Harness dismissals={["never"]} />);
    await card();
    await user.click(screen.getByRole("button", { name: "More options" }));
    expect(await screen.findByRole("menuitem", { name: "Don't show again" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Remind me later" })).toBeNull();
  });

  it("closes only the menu on Escape, then the tour on the next", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness dismissals={["later"]} onOpenChange={onOpenChange} />);
    await card();
    await user.click(screen.getByRole("button", { name: "More options" }));
    await screen.findByRole("menuitem", { name: "Remind me later" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape", stepId: "one" });
  });

  it("does not move the step when an arrow key is pressed inside the menu", async () => {
    const user = userEvent.setup();
    render(<Harness dismissals={["later", "never"]} />);
    await card();
    await user.click(screen.getByRole("button", { name: "More options" }));
    await screen.findByRole("menuitem", { name: "Remind me later" });
    await user.keyboard("{ArrowRight}{ArrowLeft}{ArrowDown}");
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAccessibleName("First");
  });

  it("can show it on the first step only", async () => {
    const user = userEvent.setup();
    render(<Harness dismissals={["later", "never"]} dismissalsOn="first" />);
    await card();
    expect(screen.getByRole("button", { name: "More options" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await name("Second");
    expect(screen.queryByRole("button", { name: "More options" })).toBeNull();
  });

  it("does not offer it on the last step", async () => {
    render(<Harness dismissals={["later", "never"]} defaultValue="three" />);
    await card();
    expect(screen.queryByRole("button", { name: "More options" })).toBeNull();
  });
});

describe("Tour — richer cards", () => {
  it("draws a step's media and footer", async () => {
    const steps: TourStep[] = [{ id: "a", title: "A", media: <img alt="Preview" src="data:," />, footer: <p>A footnote</p> }];
    render(<Harness steps={steps} />);
    const dialog = await card();
    expect(within(dialog).getByRole("img", { name: "Preview" })).toBeInTheDocument();
    expect(within(dialog).getByText("A footnote")).toBeInTheDocument();
  });

  it("replaces the buttons with a step's own, handing them the controller", async () => {
    const user = userEvent.setup();
    const steps: TourStep[] = [
      { id: "a", title: "A", actions: (controller: TourController) => <button type="button" onClick={() => controller.next()}>Go on</button> },
      { id: "b", title: "B", actions: <span>Custom</span> },
    ];
    render(<Harness steps={steps} />);
    const dialog = await card();
    expect(within(dialog).queryByRole("button", { name: "Next" })).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Go on" }));
    await name("B");
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});

describe("Tour — advanceOn", () => {
  it("moves on when the element is used, and treats the step as interactive", async () => {
    const user = userEvent.setup();
    const steps: TourStep[] = [
      { id: "a", target: "#target-one", title: "Press it", advanceOn: "click" },
      { id: "b", title: "Done" },
    ];
    render(<Harness steps={steps} />);
    const dialog = await card();
    await waitFor(() => expect(dialog).toHaveAttribute("data-interactive"));
    await user.click(document.getElementById("target-one") as HTMLElement);
    await name("Done");
  });

  it("warns about a step that can advance but has nothing to advance it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Harness steps={[{ id: "no-target-advance", title: "A", advanceOn: "click" }]} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"no-target-advance"'));
  });
});

describe("Tour — onEnter", () => {
  it("runs before the step's element is looked for, and the card waits for a promise", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const onEnter = vi.fn(() => gate);
    render(<Harness steps={[{ id: "late", target: "#target-one", title: "Late", onEnter }]} />);
    await waitFor(() => expect(onEnter).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => release());
    expect(await card()).toHaveAccessibleName("Late");
  });

  it("shows the step anyway, with a warning, when it throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onEnter = () => {
      throw new Error("boom-enter");
    };
    render(<Harness steps={[{ id: "throws", title: "T", onEnter }]} />);
    expect(await card()).toHaveAccessibleName("T");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("boom-enter"));
  });

  it("runs again each time the step is shown", async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    const steps: TourStep[] = [
      { id: "a", title: "A", onEnter },
      { id: "b", title: "B" },
    ];
    render(<Harness steps={steps} />);
    await card();
    await waitFor(() => expect(onEnter).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await name("B");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await name("A");
    await waitFor(() => expect(onEnter).toHaveBeenCalledTimes(2));
  });
});

describe("Tour — a missing element", () => {
  const missing: TourStep[] = [
    { id: "one", title: "One" },
    { id: "gone", target: "#nope", title: "Gone" },
    { id: "three", title: "Three" },
  ];

  it("skips a step whose element never appears, going forward and back", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Harness steps={missing} missingTarget="skip" targetTimeout={30} />);
    await card();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await name("Three");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await name("One");
  });

  it("lets a step choose for itself, and keeps a missing last step centred", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const steps: TourStep[] = [{ id: "only", target: "#nope", title: "Only", missingTarget: "skip" }];
    render(<Harness steps={steps} targetTimeout={30} />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "centered"));
  });
});

describe("Tour — scrolling and the phone", () => {
  it("keeps a sticky header's height clear when it scrolls an element into view", async () => {
    const seen: string[] = [];
    vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(function (this: HTMLElement) {
      seen.push(`${this.style.scrollMarginBlockStart}|${this.style.scrollMarginBlockEnd}`);
    });
    render(<Harness scrollOffset={{ top: 64, bottom: 20 }} />);
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen[0]).toBe("64px|20px");
    expect(document.getElementById("target-one")?.style.scrollMarginBlockStart).toBe("");
  });

  it("lifts a docked card clear of an on-screen keyboard", async () => {
    const listeners = new Map<string, () => void>();
    const visual = {
      height: 400,
      offsetTop: 0,
      addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
      removeEventListener: () => {},
    };
    const originalViewport = window.visualViewport;
    const originalHeight = window.innerHeight;
    vi.stubGlobal("visualViewport", visual);
    vi.stubGlobal("innerHeight", 700);
    try {
      render(<Harness presentation="docked" />);
      await card();
      await waitFor(() =>
        expect(document.querySelector<HTMLElement>('[class*="layer"]')?.style.getPropertyValue("--tour-keyboard-inset")).toBe("300px"),
      );
    } finally {
      vi.stubGlobal("visualViewport", originalViewport);
      vi.stubGlobal("innerHeight", originalHeight);
    }
  });
});

describe("Tour — focus", () => {
  it("keeps focus on Next when the card changes form (docked to anchored)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness presentation="docked" />);
    await card();
    await user.tab();
    await user.tab();
    const next = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(next).toHaveFocus());
    rerender(<Harness presentation="anchored" />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveFocus());
  });

  it("keeps focus on the card when it is the card that had it", async () => {
    const { rerender } = render(<Harness presentation="docked" />);
    const first = await card();
    await waitFor(() => expect(first).toHaveFocus());
    rerender(<Harness presentation="anchored" />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  });

  it("moves Tab between the card and an interactive step's element, both ways", async () => {
    const user = userEvent.setup();
    const steps: TourStep[] = [{ id: "i", target: "#target-one", title: "Try it", interactive: true }];
    render(<Harness steps={steps} />);
    const dialog = await card();
    await waitFor(() => expect(dialog).toHaveAttribute("data-interactive"));
    const element = document.getElementById("target-one") as HTMLElement;
    within(dialog).getByRole("button", { name: "Finish" }).focus();
    await user.tab();
    expect(element).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "Finish" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(element).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(dialog).getByRole("button", { name: "Finish" })).toHaveFocus();
  });

  it("does not pass Escape on, so a tour inside a dialog does not close the dialog too", async () => {
    const onKeyDown = vi.fn();
    document.addEventListener("keydown", onKeyDown);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    await card();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape", stepId: "one" });
    expect(onKeyDown).not.toHaveBeenCalled();
    document.removeEventListener("keydown", onKeyDown);
  });
});

describe("Tour — controller and accessibility with the new parts", () => {
  it("still hands out one controller for its life", async () => {
    const ref = createRef<TourController>();
    const { rerender } = render(<Harness controllerRef={ref} steps={threeSteps} />);
    const first = ref.current;
    rerender(<Harness controllerRef={ref} steps={[...threeSteps]} />);
    expect(ref.current).toBe(first);
    fireEvent.keyDown(document, { key: "Shift" });
  });

  it("has no axe violations with a bar, dismissals, media and a footer", async () => {
    const steps: TourStep[] = [
      { id: "a", title: "A", content: "Text", media: <img alt="Preview" src="data:," />, footer: <p>Note</p> },
      { id: "b", title: "B" },
    ];
    render(<Harness steps={steps} progress="both" dismissals={["later", "never"]} />);
    await card();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
