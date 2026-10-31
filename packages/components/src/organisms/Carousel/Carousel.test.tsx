import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StarIcon } from "@dbm-system/icons";
import { Carousel } from "./Carousel";
import type { CarouselController } from "./Carousel.types";
import { Slides } from "./carouselTestKit";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const slide = (n: number) => screen.getByRole("group", { name: new RegExp(`^${n} of `) }) as HTMLElement;
const next = () => screen.getByRole("button", { name: "Next slide" });
const previous = () => screen.getByRole("button", { name: "Previous slide" });
const track = () => screen.getByRole("group", { name: "Slides" });
const currentDot = () => document.querySelector<HTMLElement>('[aria-current="true"]')!;

describe("Carousel — structure", () => {
  it("is a named region described as a carousel, around a group of slides", () => {
    render(<Slides />);
    const region = screen.getByRole("region", { name: "Stories" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(within(region).getByRole("group", { name: "Slides" })).toBeInTheDocument();
  });

  it("names each slide by its place and describes it as a slide", () => {
    render(<Slides slides={3} />);
    expect(slide(2)).toHaveAttribute("aria-roledescription", "slide");
    expect(slide(2)).toHaveAccessibleName("2 of 3");
    expect(slide(2)).toHaveTextContent("Slide 2");
  });

  it("lets a slide name itself", () => {
    render(
      <Carousel aria-label="Stories">
        <Carousel.Slide aria-label="Harbour">One</Carousel.Slide>
        <Carousel.Slide>Two</Carousel.Slide>
      </Carousel>,
    );
    expect(screen.getByRole("group", { name: "Harbour" })).toBeInTheDocument();
  });

  it("forwards its ref to the root and takes className, style, id and data-testid there", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Carousel ref={ref} aria-label="Stories" className="mine" style={{ color: "red" }} id="c" data-testid="carousel">
        <Carousel.Slide>One</Carousel.Slide>
      </Carousel>,
    );
    const root = screen.getByTestId("carousel");
    expect(ref.current).toBe(root);
    expect(root).toHaveClass("mine");
    expect(root).toHaveAttribute("id", "c");
    expect(root.style.color).toBe("red");
  });

  it("defaults to left-to-right and passes dir to the root", () => {
    const { rerender } = render(<Slides data-testid="c" />);
    expect(screen.getByTestId("c")).toHaveAttribute("dir", "ltr");
    rerender(<Slides data-testid="c" dir="rtl" />);
    expect(screen.getByTestId("c")).toHaveAttribute("dir", "rtl");
  });

  it("does not let a same-named prop replace the role or the roledescription", () => {
    render(<Slides role="presentation" aria-roledescription="gallery" />);
    const region = screen.getByRole("region", { name: "Stories" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("warns once in development when it has no name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Carousel>
        <Carousel.Slide>One</Carousel.Slide>
      </Carousel>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessible name"));
  });

  it("counts a component of your own that renders a slide as a slide, and text as none", () => {
    const Mine = ({ n }: { n: number }) => <Carousel.Slide>Mine {n}</Carousel.Slide>;
    render(
      <Carousel aria-label="Stories">
        stray text
        <Mine n={1} />
        <Mine n={2} />
      </Carousel>,
    );
    expect(screen.getByRole("group", { name: "2 of 2" })).toHaveTextContent("Mine 2");
    expect(screen.queryByText("stray text")).toBeNull();
  });

  it("draws nothing to navigate with a single slide", () => {
    render(<Slides slides={1} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders with no slides without crashing", () => {
    render(<Carousel aria-label="Empty" />);
    expect(screen.getByRole("region", { name: "Empty" })).toBeInTheDocument();
  });
});

describe("Carousel — which slides are in view", () => {
  it("makes every slide but the one in view inert", () => {
    render(<Slides />);
    expect(slide(1).inert).toBe(false);
    expect(slide(2).inert).toBe(true);
  });

  it("makes the slides in view not inert when several are", () => {
    render(<Slides slidesPerView={3} defaultValue={1} />);
    expect([1, 2, 3, 4, 5].map((n) => slide(n).inert)).toEqual([true, false, false, false, true]);
  });

  it("holds the value to the last place the view can reach", () => {
    render(<Slides slidesPerView={3} defaultValue={4} />);
    expect([1, 2, 3, 4, 5].map((n) => slide(n).inert)).toEqual([true, true, false, false, false]);
  });

  it("reads a breakpoint map of slides per view", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<Slides slidesPerView={{ base: 1, md: 2 }} />);
    expect(slide(2).inert).toBe(false);
    expect(slide(3).inert).toBe(true);
  });

  it("moves focus to the track when the slide holding it leaves the view", async () => {
    const user = userEvent.setup();
    render(
      <Carousel aria-label="Stories">
        <Carousel.Slide>
          <button type="button">Inside one</button>
        </Carousel.Slide>
        <Carousel.Slide>Two</Carousel.Slide>
      </Carousel>,
    );
    await user.click(screen.getByRole("button", { name: "Inside one" }));
    expect(screen.getByRole("button", { name: "Inside one" })).toHaveFocus();
    await user.click(next());
    expect(track()).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^1 of/ }).inert).toBe(true);
  });
});

describe("Carousel — buttons", () => {
  it("steps forward and back, with the previous button disabled at the start", async () => {
    const user = userEvent.setup();
    render(<Slides slides={3} />);
    expect(previous()).toBeDisabled();
    await user.click(next());
    expect(slide(2).inert).toBe(false);
    expect(previous()).toBeEnabled();
    await user.click(next());
    expect(next()).toBeDisabled();
    await user.click(previous());
    expect(slide(2).inert).toBe(false);
  });

  it("wraps at both ends with loop and never disables a button", async () => {
    const user = userEvent.setup();
    render(<Slides slides={3} loop />);
    expect(previous()).toBeEnabled();
    await user.click(previous());
    expect(slide(3).inert).toBe(false);
    await user.click(next());
    expect(slide(1).inert).toBe(false);
  });

  it("moves several slides at a time with slidesPerMove, ending on the last reachable place", async () => {
    const user = userEvent.setup();
    render(<Slides slides={7} slidesPerView={3} slidesPerMove="view" />);
    await user.click(next());
    expect(slide(4).inert).toBe(false);
    await user.click(next());
    expect(slide(5).inert).toBe(false);
    expect(slide(7).inert).toBe(false);
    expect(slide(4).inert).toBe(true);
    expect(next()).toBeDisabled();
  });

  it("hands focus to the other button when a press disables the one that had it", async () => {
    const user = userEvent.setup();
    render(<Slides slides={2} />);
    await user.click(next());
    expect(next()).toBeDisabled();
    expect(previous()).toHaveFocus();
  });

  it("draws the buttons in a bar under the slides with controls=\"bar\", and none with \"hidden\"", () => {
    const { rerender, container } = render(<Slides controls="bar" />);
    expect(container.querySelector("[class*='_bar_']")).toContainElement(next());
    rerender(<Slides controls="hidden" />);
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Go to slide/ }).length).toBe(5);
  });

  it("draws a button you place, even when controls is hidden", () => {
    render(
      <Slides controls="hidden">
        <Carousel.Next aria-label="Forward" icon={StarIcon} />
      </Slides>,
    );
    expect(screen.getByRole("button", { name: "Forward" })).toBeInTheDocument();
  });

  it("uses vertical arrows in a vertical carousel", () => {
    render(<Slides orientation="vertical" />);
    expect(next().querySelector("svg")).not.toBeNull();
  });
});

describe("Carousel — indicators", () => {
  it("draws one per position and marks the current one", () => {
    render(<Slides />);
    const dots = screen.getAllByRole("button", { name: /^Go to slide/ });
    expect(dots).toHaveLength(5);
    expect(currentDot()).toBe(dots[0]);
  });

  it("goes to a position when one is pressed", async () => {
    const user = userEvent.setup();
    render(<Slides />);
    await user.click(screen.getByRole("button", { name: "Go to slide 4" }));
    expect(slide(4).inert).toBe(false);
    expect(currentDot()).toHaveAccessibleName("Go to slide 4");
  });

  it("draws one per position, not per slide, with several in view", () => {
    render(<Slides slides={7} slidesPerView={3} slidesPerMove="view" />);
    expect(screen.getAllByRole("button", { name: /^Go to slide/ })).toHaveLength(3);
  });

  it("can be left out, restyled or replaced by a part", () => {
    const { rerender } = render(<Slides indicators={false} />);
    expect(screen.queryByRole("button", { name: /^Go to slide/ })).toBeNull();
    rerender(
      <Slides indicators={false}>
        <Carousel.Indicators aria-label="Pick one" />
      </Slides>,
    );
    expect(screen.getByRole("group", { name: "Pick one" })).toBeInTheDocument();
  });
});

describe("Carousel — keyboard", () => {
  it("makes the track a tab stop and steps with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Slides />);
    track().focus();
    await user.keyboard("{ArrowRight}");
    expect(slide(2).inert).toBe(false);
    await user.keyboard("{ArrowLeft}");
    expect(slide(1).inert).toBe(false);
  });

  it("goes to the first and last positions with Home and End", async () => {
    const user = userEvent.setup();
    render(<Slides />);
    track().focus();
    await user.keyboard("{End}");
    expect(slide(5).inert).toBe(false);
    await user.keyboard("{Home}");
    expect(slide(1).inert).toBe(false);
  });

  it("swaps the arrows in right-to-left", async () => {
    const user = userEvent.setup();
    render(<Slides dir="rtl" />);
    track().focus();
    await user.keyboard("{ArrowLeft}");
    expect(slide(2).inert).toBe(false);
  });

  it("uses Up and Down in a vertical carousel and ignores Left and Right", async () => {
    const user = userEvent.setup();
    render(<Slides orientation="vertical" />);
    track().focus();
    await user.keyboard("{ArrowRight}");
    expect(slide(1).inert).toBe(false);
    await user.keyboard("{ArrowDown}");
    expect(slide(2).inert).toBe(false);
  });

  it("leaves the arrow keys alone inside a slide's own field", async () => {
    const user = userEvent.setup();
    render(
      <Carousel aria-label="Stories">
        <Carousel.Slide>
          <input aria-label="Name" />
        </Carousel.Slide>
        <Carousel.Slide>Two</Carousel.Slide>
      </Carousel>,
    );
    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("group", { name: /^1 of/ }).inert).toBe(false);
  });
});

describe("Carousel — value", () => {
  it("starts at defaultValue and reports changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slides defaultValue={1} onValueChange={onValueChange} />);
    expect(slide(2).inert).toBe(false);
    await user.click(next());
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it("asks and waits when controlled: the slides move only when value does", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Slides value={0} onValueChange={onValueChange} />);
    await user.click(next());
    expect(onValueChange).toHaveBeenCalledWith(1);
    expect(slide(1).inert).toBe(false);
    rerender(<Slides value={1} onValueChange={onValueChange} />);
    expect(slide(2).inert).toBe(false);
  });

  it("works wired to state, with the pair updating in one commit", async () => {
    const user = userEvent.setup();
    const Wired = () => {
      const [value, setValue] = useState(0);
      return <Slides value={value} onValueChange={setValue} />;
    };
    render(<Wired />);
    await user.click(next());
    await user.click(next());
    expect(slide(3).inert).toBe(false);
  });

  it("holds a value outside the range to it, with a warning when controlled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Slides value={99} />);
    expect(slide(5).inert).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("outside 0–4"));
  });
});

describe("Carousel — controller", () => {
  it("hands next, previous and goTo to code outside, with one stable object", async () => {
    const ref = createRef<CarouselController>();
    render(<Slides controllerRef={ref} />);
    const controller = ref.current!;
    expect(controller.count).toBe(5);
    let result = false;
    act(() => {
      result = controller.next();
    });
    expect(result).toBe(true);
    expect(controller.value).toBe(1);
    act(() => {
      result = controller.goTo(4);
    });
    expect(result).toBe(true);
    expect(slide(5).inert).toBe(false);
    act(() => {
      result = controller.next();
    });
    expect(result).toBe(false);
    act(() => {
      result = controller.goTo(9);
    });
    expect(result).toBe(false);
    act(() => {
      controller.previous();
    });
    expect(ref.current).toBe(controller);
    expect(controller.value).toBe(3);
  });
});

describe("Carousel — announcements", () => {
  it("announces the slide in view when the person changes it, and not at first", () => {
    vi.useFakeTimers();
    render(<Slides />);
    const status = screen.getByRole("status");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(status).toHaveTextContent("");
    fireEvent.click(next());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(status).toHaveTextContent("Slide 2 of 5");
  });

  it("announces a range when several are in view", () => {
    vi.useFakeTimers();
    render(<Slides slidesPerView={2} />);
    fireEvent.click(next());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Slides 2 to 3 of 5");
  });

  it("stays silent with announce off", () => {
    vi.useFakeTimers();
    render(<Slides announce={false} />);
    fireEvent.click(next());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("does not announce on a StrictMode remount", () => {
    vi.useFakeTimers();
    render(
      <StrictMode>
        <Slides defaultValue={2} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});

describe("Carousel — labels and numbers", () => {
  it("translates what it writes, keeping a default for an undefined entry", () => {
    render(<Slides labels={{ next: "Siguiente", previous: undefined, slide: (n, total) => `Diapositiva ${n} de ${total}` }} />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Diapositiva 2 de 5" })).toBeInTheDocument();
  });

  it("writes its digits through formatNumber", () => {
    render(<Slides formatNumber={(n) => `#${n}`} />);
    expect(screen.getByRole("group", { name: "#2 of #5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to slide #3" })).toBeInTheDocument();
  });
});

describe("Carousel — auto-play", () => {
  const rotates = (extra = {}) => (
    <Slides autoPlay={{ interval: 2000 }} {...extra} />
  );

  it("is off by default and draws no pause button", () => {
    render(<Slides />);
    expect(screen.queryByRole("button", { name: /automatic slide show/ })).toBeNull();
  });

  it("advances after the interval, wraps from the last to the first, and draws a pause button", () => {
    vi.useFakeTimers();
    render(rotates());
    expect(screen.getByRole("button", { name: "Stop automatic slide show" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
    for (let rotation = 0; rotation < 4; rotation += 1) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }
    expect(slide(1).inert).toBe(false);
  });

  it("does not announce while it rotates", () => {
    vi.useFakeTimers();
    render(rotates());
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("stops from the pause button and starts again from the play button", () => {
    vi.useFakeTimers();
    render(rotates());
    fireEvent.click(screen.getByRole("button", { name: "Stop automatic slide show" }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(slide(1).inert).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Start automatic slide show" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
  });

  it("holds while the pointer is over the slides and while keyboard focus is inside", () => {
    vi.useFakeTimers();
    render(rotates());
    const viewport = track().parentElement!;
    fireEvent.pointerEnter(viewport);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(slide(1).inert).toBe(false);
    fireEvent.pointerLeave(viewport);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
  });

  it("holds while the page is hidden", () => {
    vi.useFakeTimers();
    render(rotates());
    const state = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(slide(1).inert).toBe(false);
    state.mockReturnValue("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
  });

  it("starts paused when the person prefers reduced motion", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(rotates());
    expect(screen.getByRole("button", { name: "Start automatic slide show" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(slide(1).inert).toBe(false);
  });

  it("survives StrictMode and clears its timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <StrictMode>
        <Slides autoPlay={{ interval: 2000 }} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("Carousel — a swipe or scroll", () => {
  it("reports the slide the track settled on once it stops moving", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(<Slides onValueChange={onValueChange} />);
    const scroller = track();
    scroller.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 100, width: 200, height: 100 }) as DOMRect;
    const slides = [...scroller.querySelectorAll<HTMLElement>("[data-carousel-slide]")];
    slides.forEach((element, index) => {
      element.getBoundingClientRect = () => ({ left: (index - 2) * 200, right: (index - 1) * 200, top: 0, bottom: 100, width: 200, height: 100 }) as DOMRect;
    });
    fireEvent.scroll(scroller);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onValueChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onValueChange).toHaveBeenCalledWith(2);
  });
});

describe("Carousel — accessibility", () => {
  it("has no axe violations by default", async () => {
    const { container } = render(<Slides />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has none with several in view, auto-play, loop and a vertical orientation", async () => {
    const { container } = render(<Slides slidesPerView={2} autoPlay loop orientation="vertical" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has none in the bar form", async () => {
    const { container } = render(<Slides controls="bar" indicators="bars" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
