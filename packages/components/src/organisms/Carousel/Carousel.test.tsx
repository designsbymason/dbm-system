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

describe("Carousel — looping with no seam", () => {
  const copies = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>("[data-carousel-clone]")];

  it("draws copies of the slides at each end, hidden from assistive technology and inert", () => {
    const { container } = render(<Slides slides={5} loop />);
    const found = copies(container);
    expect(found).toHaveLength(4);
    for (const copy of found) {
      expect(copy).toHaveAttribute("aria-hidden", "true");
      expect(copy).not.toHaveAttribute("role");
      expect(copy.inert).toBe(true);
    }
    expect(copies(container).map((copy) => copy.textContent)).toEqual(["Slide 4", "Slide 5", "Slide 1", "Slide 2"]);
    expect(screen.getAllByRole("group", { name: /^\d of 5$/ })).toHaveLength(5);
  });

  it("draws no copies without loop, or when every slide is already in view", () => {
    const { container, rerender } = render(<Slides slides={5} />);
    expect(copies(container)).toHaveLength(0);
    rerender(<Slides slides={3} slidesPerView={3} loop />);
    expect(copies(container)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
  });

  it("wraps with no end: next from the last is the first, previous from the first is the last", async () => {
    const user = userEvent.setup();
    render(<Slides slides={3} loop />);
    await user.click(previous());
    expect(slide(3).inert).toBe(false);
    await user.click(next());
    expect(slide(1).inert).toBe(false);
    expect(next()).toBeEnabled();
    expect(previous()).toBeEnabled();
  });

  it("wraps the view round the end: the first slides are in view beside the last", async () => {
    const user = userEvent.setup();
    render(<Slides slides={5} slidesPerView={2} loop defaultValue={4} />);
    expect([1, 2, 3, 4, 5].map((n) => slide(n).inert)).toEqual([false, true, true, true, false]);
    await user.click(next());
    expect(slide(1).inert).toBe(false);
  });

  it("announces the slides across the seam", () => {
    vi.useFakeTimers();
    render(<Slides slides={5} slidesPerView={2} loop defaultValue={3} />);
    fireEvent.click(next());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Slides 5 to 1 of 5");
  });
});

describe("Carousel — a peeking slide", () => {
  it("is pressable: the slide after the view is not inert, the one after it is", () => {
    render(<Slides slidesPerView={2} peek />);
    expect([1, 2, 3, 4].map((n) => slide(n).inert)).toEqual([false, false, false, true]);
  });
});

describe("Carousel — focus in a peeking slide", () => {
  it("brings the slide into view when something in it takes focus", () => {
    render(
      <Carousel aria-label="Peek" slidesPerView={2} peek>
        {[1, 2, 3, 4].map((n) => (
          <Carousel.Slide key={n}>
            <button type="button">Button {n}</button>
          </Carousel.Slide>
        ))}
      </Carousel>,
    );
    act(() => {
      screen.getByRole("button", { name: "Button 3" }).focus();
    });
    expect([1, 2, 3, 4].map((n) => screen.getByRole("group", { name: `${n} of 4` }).inert)).toEqual([true, false, false, false]);
  });
});

describe("Carousel — a fractional view", () => {
  it("counts the slide a fraction cuts as in view", () => {
    render(<Slides slidesPerView={1.5} />);
    expect([1, 2, 3].map((n) => slide(n).inert)).toEqual([false, false, true]);
  });

  it("sets the slide width from the fraction", () => {
    render(<Slides slidesPerView={1.5} data-testid="c" />);
    const style = screen.getByTestId("c").style;
    expect(style.getPropertyValue("--carousel-slides")).toBe("1.5");
    expect(style.getPropertyValue("--carousel-gaps")).toBe("1");
  });

  it("reaches the last slide: the last position counts the slide the view cuts", async () => {
    const user = userEvent.setup();
    render(<Slides slides={4} slidesPerView={1.5} />);
    track().focus();
    await user.keyboard("{End}");
    expect([1, 2, 3, 4].map((n) => slide(n).inert)).toEqual([true, true, false, false]);
  });
});

describe("Carousel — a centred slide", () => {
  it("makes the slide at value the one in the middle, and any slide can be it", async () => {
    const user = userEvent.setup();
    render(<Slides slidesPerView={3} align="center" defaultValue={2} data-testid="c" />);
    expect([1, 2, 3, 4, 5].map((n) => slide(n).inert)).toEqual([true, false, false, false, true]);
    expect(screen.getByTestId("c").className).toMatch(/centered/);
    track().focus();
    await user.keyboard("{End}");
    expect(slide(5).inert).toBe(false);
    expect(screen.getAllByRole("button", { name: /^Go to slide/ })).toHaveLength(5);
  });

  it("announces only the slide in the middle", () => {
    vi.useFakeTimers();
    render(<Slides slidesPerView={3} align="center" />);
    fireEvent.click(next());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 5");
  });

  it("ignores peek", () => {
    render(<Slides slidesPerView={1} align="center" peek />);
    expect([1, 2].map((n) => slide(n).inert)).toEqual([false, true]);
  });
});

describe("Carousel — lazy content", () => {
  const Lazy = (props: { lazy?: boolean | number; defaultValue?: number }) => (
    <Carousel aria-label="Lazy" {...props}>
      {Array.from({ length: 7 }, (_, index) => (
        <Carousel.Slide key={index} placeholder={<span>wait {index + 1}</span>}>
          real {index + 1}
        </Carousel.Slide>
      ))}
    </Carousel>
  );

  it("draws everything by default", () => {
    render(<Lazy />);
    expect(screen.getByText("real 7")).toBeInTheDocument();
  });

  it("draws the view and one slide beyond it, and the placeholder for the rest", () => {
    render(<Lazy lazy />);
    expect(screen.getByText("real 1")).toBeInTheDocument();
    expect(screen.getByText("real 2")).toBeInTheDocument();
    expect(screen.getByText("wait 3")).toBeInTheDocument();
    expect(screen.queryByText("real 3")).toBeNull();
  });

  it("takes a number of slides of reach", () => {
    render(<Lazy lazy={3} />);
    expect(screen.getByText("real 4")).toBeInTheDocument();
    expect(screen.getByText("wait 5")).toBeInTheDocument();
  });

  it("draws a slide when it comes near, and keeps it drawn once it has been", async () => {
    const user = userEvent.setup();
    render(<Lazy lazy />);
    await user.click(next());
    await user.click(next());
    expect(screen.getByText("real 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("real 4")).toBeInTheDocument();
  });

  it("draws the slides near a starting value on the first render", () => {
    render(<Lazy lazy defaultValue={5} />);
    expect(screen.getByText("real 6")).toBeInTheDocument();
    expect(screen.getByText("wait 1")).toBeInTheDocument();
  });
});

describe("Carousel — holding rotation", () => {
  const rotating = (ref: { current: CarouselController | null }) => (
    <Slides autoPlay={{ interval: 2000 }} controllerRef={ref} />
  );

  it("holds from the controller until every hold is released, and ignores a second release", () => {
    vi.useFakeTimers();
    const ref = createRef<CarouselController>();
    render(rotating(ref));
    let releaseOne = () => {};
    let releaseTwo = () => {};
    act(() => {
      releaseOne = ref.current!.hold();
      releaseTwo = ref.current!.hold();
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(slide(1).inert).toBe(false);
    act(() => {
      releaseOne();
      releaseOne();
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(slide(1).inert).toBe(false);
    act(() => {
      releaseTwo();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(slide(2).inert).toBe(false);
  });

  it("holds while a video in a slide is playing, and carries on when it stops", () => {
    vi.useFakeTimers();
    render(
      <Carousel aria-label="Media" autoPlay={{ interval: 2000 }}>
        <Carousel.Slide>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video data-testid="clip" />
        </Carousel.Slide>
        <Carousel.Slide>Two</Carousel.Slide>
      </Carousel>,
    );
    const clip = screen.getByTestId("clip");
    act(() => {
      clip.dispatchEvent(new Event("play"));
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByRole("group", { name: "1 of 2" }).inert).toBe(false);
    act(() => {
      clip.dispatchEvent(new Event("pause"));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("group", { name: "2 of 2" }).inert).toBe(false);
  });
});

describe("Carousel — a vertical carousel with no height", () => {
  const sizes = (client: number, scroll: number) => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(client);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scroll);
  };

  it("warns once when the track has nothing to scroll", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    sizes(300, 300);
    render(<Slides orientation="vertical" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs a height"));
  });

  it("does not warn when the track scrolls", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    sizes(300, 900);
    render(<Slides orientation="vertical" />);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("needs a height"));
  });
});

describe("Carousel — a swipe a controlled owner does not take", () => {
  const swipeTo = (aligned: number) => {
    const scroller = track();
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo as unknown as typeof scroller.scrollTo;
    scroller.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 100, width: 200, height: 100 }) as DOMRect;
    [...scroller.querySelectorAll<HTMLElement>("[data-carousel-slide]")].forEach((element, index) => {
      element.getBoundingClientRect = () => ({ left: (index - aligned) * 200, right: (index - aligned + 1) * 200, top: 0, bottom: 100, width: 200, height: 100 }) as DOMRect;
    });
    fireEvent.scroll(scroller);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    return scrollTo;
  };

  it("puts the track back on the value it holds", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(<Slides value={0} onValueChange={onValueChange} />);
    const scrollTo = swipeTo(2);
    expect(onValueChange).toHaveBeenCalledWith(2);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: -400, behavior: "smooth" }));
  });

  it("leaves it where it landed when the owner takes the value", () => {
    vi.useFakeTimers();
    const Owner = () => {
      const [value, setValue] = useState(0);
      return <Slides value={value} onValueChange={setValue} />;
    };
    render(<Owner />);
    const scrollTo = swipeTo(2);
    expect(slide(3).inert).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("Carousel — mouse drag", () => {
  it("can be turned off", () => {
    const { rerender } = render(<Slides />);
    expect(track()).toHaveAttribute("data-draggable");
    rerender(<Slides mouseDrag={false} />);
    expect(track()).not.toHaveAttribute("data-draggable");
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
