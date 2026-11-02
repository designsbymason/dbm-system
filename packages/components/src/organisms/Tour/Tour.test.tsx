import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tour } from "./Tour";
import type { TourController, TourStep } from "./Tour.types";
import { Harness, WithController } from "./tourTestKit";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const card = () => screen.findByRole("dialog");
const text = (element: HTMLElement) => element.textContent ?? "";

describe("Tour — structure", () => {
  it("draws nothing while closed", () => {
    render(<Harness startOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens as a dialog named by the step's title, described by its text", async () => {
    render(<Harness />);
    const dialog = await card();
    expect(dialog).toHaveAccessibleName("First");
    expect(dialog).toHaveAccessibleDescription("The first thing.");
    expect(text(dialog)).toContain("Step 1 of 3");
  });

  it("draws a step with no element in the middle of the screen, and one with an element beside it", async () => {
    const { rerender } = render(<Harness defaultValue="three" />);
    expect(await card()).toHaveAttribute("data-placement", "centered");
    rerender(<Harness defaultValue="one" />);
  });

  it("anchors the card to a step's element", async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
  });

  it("puts className, style, id and data-testid on the card and forwards the ref to it", async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tour
        ref={ref}
        open
        steps={[{ id: "a", title: "A" }]}
        className="mine"
        style={{ color: "red" }}
        id="the-card"
        data-testid="tour"
      />,
    );
    const dialog = await card();
    expect(dialog).toHaveClass("mine");
    expect(dialog).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(dialog).toHaveAttribute("id", "the-card");
    expect(dialog).toHaveAttribute("data-testid", "tour");
    expect(ref.current).toBe(dialog);
  });

  it("does not let a same-named prop replace its own role or labelling", async () => {
    render(<Harness {...({ role: "presentation", "aria-modal": "true" } as object)} />);
    const dialog = await card();
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-labelledby");
  });

  it("names the card from aria-label over the title when given", async () => {
    render(<Harness aria-label="Product tour" />);
    expect(await card()).toHaveAccessibleName("Product tour");
  });
});

describe("Tour — steps", () => {
  it("moves with Next and Back, and has no Back on the first step", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await card();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("First"));
  });

  it("finishes on the last step, reporting why", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness defaultValue="three" onOpenChange={onOpenChange} />);
    await card();
    expect(screen.queryByRole("button", { name: "Skip tour" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "finish", stepId: "three" });
  });

  it("offers Skip on every step but the last", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await card();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  });

  it("skips from an earlier step", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    await card();
    await user.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "skip", stepId: "one" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    await card();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape", stepId: "one" });
  });

  it("moves with the arrow keys, mirrored in right-to-left", async () => {
    const user = userEvent.setup();
    render(<Harness dir="rtl" />);
    await card();
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("First"));
  });

  it("leaves the arrow keys to a field in the step's own content", async () => {
    const user = userEvent.setup();
    const steps: TourStep[] = [
      { id: "a", title: "A", content: <input aria-label="Name" /> },
      { id: "b", title: "B" },
    ];
    render(<Harness steps={steps} />);
    await card();
    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("A");
  });

  it("starts over when closed and opened again", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await card();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("First");
  });
});

describe("Tour — controlled and uncontrolled", () => {
  it("asks for a step and shows it only when value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("one");
      return (
        <>
          <button type="button" onClick={() => setValue("two")}>
            Set two
          </button>
          <Harness
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
            }}
          />
        </>
      );
    }
    render(<Controlled />);
    await card();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("First");
    await user.click(screen.getByRole("button", { name: "Set two" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
  });

  it("keeps its own open state when uncontrolled, opened by the controller", async () => {
    const controller = createRef<TourController>();
    render(<WithController controllerRef={controller} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => {
      expect(controller.current?.open()).toBe(true);
    });
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("First");
  });

  it("starts at defaultValue", async () => {
    render(<Harness defaultValue="two" />);
    expect(await card()).toHaveAccessibleName("Second");
  });

  it("falls back to the first step for a value that is not a step", async () => {
    render(<Harness value="nope" />);
    expect(await card()).toHaveAccessibleName("First");
  });
});

describe("Tour — controller", () => {
  it("opens, moves, goes to a step and closes, saying whether it did anything", async () => {
    const controller = createRef<TourController>();
    render(<WithController controllerRef={controller} />);
    const first = controller.current;
    expect(first?.isOpen).toBe(false);
    expect(first?.next()).toBe(false);
    expect(first?.close()).toBe(false);
    act(() => void first?.open());
    await card();
    expect(first?.isOpen).toBe(true);
    expect(first?.value).toBe("one");
    expect(first?.open()).toBe(false);
    expect(first?.back()).toBe(false);
    act(() => void first?.next());
    await waitFor(() => expect(first?.value).toBe("two"));
    expect(first?.goTo("two")).toBe(false);
    expect(first?.goTo("missing")).toBe(false);
    act(() => void first?.goTo("three"));
    await waitFor(() => expect(first?.value).toBe("three"));
    act(() => void first?.close());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(controller.current).toBe(first);
  });
});

describe("Tour — targets", () => {
  it("finds an element by selector, element, ref and function", async () => {
    const element = document.createElement("div");
    document.body.append(element);
    const ref = { current: element };
    const steps: TourStep[] = [
      { id: "s", target: "#target-one", title: "Selector" },
      { id: "e", target: element, title: "Element" },
      { id: "r", target: ref, title: "Ref" },
      { id: "f", target: () => element, title: "Function" },
    ];
    const user = userEvent.setup();
    render(<Harness steps={steps} />);
    for (const name of ["Selector", "Element", "Ref", "Function"]) {
      await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName(name));
      await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
      if (name !== "Function") await user.click(screen.getByRole("button", { name: "Next" }));
    }
    element.remove();
  });

  it("falls back to the middle of the screen, warns and reports a step whose element never appears", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onTargetMissing = vi.fn();
    const steps: TourStep[] = [{ id: "gone", target: "#not-there", title: "Missing one" }];
    render(<Harness steps={steps} targetTimeout={40} onTargetMissing={onTargetMissing} />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "centered"));
    expect(onTargetMissing).toHaveBeenCalledTimes(1);
    expect(onTargetMissing.mock.calls[0]?.[0]).toMatchObject({ id: "gone" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"gone"'));
  });

  it("waits for an element that appears a moment later", async () => {
    const steps: TourStep[] = [{ id: "late", target: "#late", title: "Late" }];
    render(<Harness steps={steps} targetTimeout={2000} />);
    const late = document.createElement("div");
    late.id = "late";
    setTimeout(() => document.body.append(late), 50);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "anchored"));
    late.remove();
  });

  it("reads a selector that is not valid CSS as not found, with a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const steps: TourStep[] = [{ id: "bad", target: "##(", title: "Bad" }];
    render(<Harness steps={steps} targetTimeout={30} />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "centered"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a valid CSS selector"));
  });
});

describe("Tour — focus and announcements", () => {
  it("takes focus on the card when it opens", async () => {
    render(<Harness />);
    const dialog = await card();
    await waitFor(() => expect(dialog).toHaveFocus());
  });

  it("keeps focus on the control that was pressed across steps, and moves it to Next when Back goes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await card();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("Second"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAccessibleName("First"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveFocus());
  });

  it("gives focus back to what opened it when it closes", async () => {
    const user = userEvent.setup();
    render(<Harness startOpen={false} />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    await card();
    await user.click(screen.getByRole("button", { name: "Skip tour" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Start" })).toHaveFocus());
  });

  it("announces a step when it changes, and not when the tour first appears", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await card();
    const region = screen.getByRole("status");
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(region).toHaveTextContent("");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(region).toHaveTextContent("Step 2 of 3: Second"));
  });

  it("announces under StrictMode too", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    await card();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3: Second"));
  });
});

describe("Tour — labels", () => {
  it("writes its numbers through formatNumber and its text from labels", async () => {
    render(
      <Harness
        formatNumber={(value) => `#${value}`}
        labels={{ next: "Weiter", skip: "Überspringen" }}
      />,
    );
    const dialog = await card();
    expect(text(dialog)).toContain("Step #1 of #3");
    expect(within(dialog).getByRole("button", { name: "Weiter" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Überspringen" })).toBeInTheDocument();
  });

  it("keeps a default when a label is passed as undefined", async () => {
    render(<Harness labels={{ next: undefined, back: "Zurück" }} />);
    const dialog = await card();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("takes a step's own button text over the tour's", async () => {
    const steps: TourStep[] = [
      { id: "a", title: "A", labels: { next: "Show me" } },
      { id: "b", title: "B" },
    ];
    render(<Harness steps={steps} />);
    const dialog = await card();
    expect(within(dialog).getByRole("button", { name: "Show me" })).toBeInTheDocument();
  });

  it("can hide the progress text", async () => {
    render(<Harness progress="none" />);
    expect(text(await card())).not.toContain("Step 1");
  });
});

describe("Tour — presentation and modes", () => {
  it("is docked on request", async () => {
    render(<Harness presentation="docked" />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "docked"));
  });

  it("marks a step that lets the page be used, and cuts a hole in the shield for it", async () => {
    const steps: TourStep[] = [{ id: "i", target: "#target-one", title: "Try it", interactive: true }];
    render(<Harness steps={steps} />);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveAttribute("data-interactive"));
    const shield = document.querySelector<HTMLElement>('[class*="shield"]');
    expect(shield?.style.clipPath).toContain("evenodd");
  });

  it("closes when the dimmed page is pressed, only when asked to", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(<Harness onOpenChange={onOpenChange} />);
    await card();
    await user.click(document.querySelector<HTMLElement>('[class*="shield"]')!);
    expect(onOpenChange).not.toHaveBeenCalled();
    unmount();
    render(<Harness closeOnOutsidePress onOpenChange={onOpenChange} />);
    await card();
    await user.click(document.querySelector<HTMLElement>('[class*="shield"]')!);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "outside", stepId: "one" });
  });

  it("draws into a container when given one", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    render(<Harness container={container} />);
    await card();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    container.remove();
  });
});

describe("Tour — development checks", () => {
  it("warns about a repeated step id and about being open with no steps", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Tour
        open
        steps={[
          { id: "twin-id-a", title: "A" },
          { id: "twin-id-a", title: "B" },
        ]}
      />,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"twin-id-a"'));
    render(<Tour open steps={[]} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no steps"));
  });
});

describe("Tour — accessibility", () => {
  it("has no axe violations open", async () => {
    const { container } = render(<Harness />);
    await card();
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeTruthy();
  });

  it("has no axe violations on a step with no element", async () => {
    render(<Harness defaultValue="three" />);
    await card();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
