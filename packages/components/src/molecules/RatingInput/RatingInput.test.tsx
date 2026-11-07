import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RatingInput } from "./RatingInput";
import { DirectionProvider } from "../../atoms/DirectionProvider";

const radios = () => screen.getAllByRole("radio") as HTMLInputElement[];
const checked = () => radios().find((radio) => radio.checked)?.value;
const previews = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-fill]")).map((item) =>
    item.dataset.preview === undefined ? undefined : Number(item.dataset.preview),
  );
const fills = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-fill]")).map((item) => Number(item.dataset.fill));

describe("RatingInput", () => {
  it("is a radio group with one named radio for each value", () => {
    render(<RatingInput aria-label="Rating" />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeInTheDocument();
    expect(radios().map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "1 out of 5",
      "2 out of 5",
      "3 out of 5",
      "4 out of 5",
      "5 out of 5",
    ]);
    expect(checked()).toBeUndefined();
  });

  it("draws four icon layers for each value (outline, the preview's fill and outline, the chosen fill), hidden from assistive technology", () => {
    const { container } = render(<RatingInput aria-label="Rating" max={3} />);
    expect(container.querySelectorAll("svg")).toHaveLength(12);
    expect(container.querySelectorAll("[aria-hidden='true'] svg")).toHaveLength(12);
  });

  it("takes a custom number of icons, falling back to five for an invalid one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<RatingInput aria-label="Rating" max={3} />);
    expect(radios()).toHaveLength(3);
    rerender(<RatingInput aria-label="Rating" max={0} />);
    expect(radios()).toHaveLength(5);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`max` must be a whole number"));
    warn.mockRestore();
  });

  describe("choosing", () => {
    it("chooses with a press and reports the value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" onValueChange={onValueChange} />);
      await user.click(radios()[2] as HTMLElement);
      expect(checked()).toBe("3");
      expect(onValueChange).toHaveBeenCalledWith(3);
      expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
    });

    it("starts at defaultValue", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={4} />);
      expect(checked()).toBe("4");
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
    });

    it("moves and chooses with the arrow keys, from a single tab stop", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <>
          <button type="button">before</button>
          <RatingInput aria-label="Rating" defaultValue={2} onValueChange={onValueChange} />
          <button type="button">after</button>
        </>,
      );
      await user.click(screen.getByRole("button", { name: "before" }));
      await user.tab();
      expect(radios()[1]).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(checked()).toBe("3");
      expect(onValueChange).toHaveBeenLastCalledWith(3);
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(checked()).toBe("1");
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("follows a controlled value, frozen without a handler that updates it", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" value={2} onValueChange={() => undefined} />);
      await user.click(radios()[4] as HTMLElement);
      expect(checked()).toBe("2");
    });

    it("works controlled with state", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [rating, setRating] = useState(0);
        return (
          <>
            <RatingInput aria-label="Rating" value={rating} onValueChange={setRating} />
            <button type="button" onClick={() => setRating(5)}>
              five
            </button>
          </>
        );
      }
      render(<Controlled />);
      await user.click(radios()[1] as HTMLElement);
      expect(checked()).toBe("2");
      await user.click(screen.getByRole("button", { name: "five" }));
      expect(checked()).toBe("5");
    });

    it("clamps a value to the range, and reads one that is not a number as no rating", () => {
      const { container, rerender } = render(<RatingInput aria-label="Rating" value={9} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 1, 1, 1]);
      rerender(<RatingInput aria-label="Rating" value={-2} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      rerender(<RatingInput aria-label="Rating" value={Number.NaN} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      rerender(<RatingInput aria-label="Rating" value={null as unknown as number} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it("shows a value between whole steps as the nearest step", () => {
      const { container } = render(<RatingInput aria-label="Rating" value={3.6} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
    });

    it("warns in development about value with defaultValue", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<RatingInput aria-label="Rating" value={2} defaultValue={3} onValueChange={() => undefined} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("either `value` or `defaultValue`"));
      warn.mockRestore();
    });
  });

  describe("half steps", () => {
    it("has two radios for each icon, named by the half", () => {
      render(<RatingInput aria-label="Rating" precision={0.5} max={3} />);
      expect(radios().map((radio) => radio.value)).toEqual(["0.5", "1", "1.5", "2", "2.5", "3"]);
      expect(radios()[0]).toHaveAttribute("aria-label", "0.5 out of 3");
    });

    it("chooses a half, fills half an icon, and steps by halves with the arrow keys", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" precision={0.5} onValueChange={onValueChange} />);
      await user.click(radios()[6] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(3.5);
      expect(fills(container)).toEqual([1, 1, 1, 0.5, 0]);
      await user.keyboard("{ArrowRight}");
      expect(checked()).toBe("4");
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(checked()).toBe("3");
    });

    it("snaps a value to the nearest half", () => {
      const { container } = render(<RatingInput aria-label="Rating" precision={0.5} value={2.3} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 0.5, 0, 0]);
    });

    it("warns about an invalid precision and uses whole steps", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<RatingInput aria-label="Rating" precision={0.25 as 1} />);
      expect(radios()).toHaveLength(5);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`precision` must be 1 or 0.5"));
      warn.mockRestore();
    });
  });

  describe("clearable", () => {
    it("takes the rating back when the chosen value is pressed again", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" clearable defaultValue={3} onValueChange={onValueChange} />);
      await user.click(radios()[2] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(0);
      expect(checked()).toBeUndefined();
      // The pointer is still over the icon, which previews it until the pointer leaves.
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it.each(["Backspace", "Delete", "Escape"])("takes the rating back with %s", async (key) => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" clearable defaultValue={3} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard(`{${key}}`);
      expect(onValueChange).toHaveBeenCalledWith(0);
      expect(checked()).toBeUndefined();
    });

    it("does not clear unless it is clearable", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" defaultValue={3} />);
      await user.click(radios()[2] as HTMLElement);
      expect(checked()).toBe("3");
      await user.keyboard("{Backspace}");
      expect(checked()).toBe("3");
    });

    it("lets a key handler stop the clearing", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" clearable defaultValue={3} onKeyDown={(event) => event.preventDefault()} />);
      await user.tab();
      await user.keyboard("{Escape}");
      expect(checked()).toBe("3");
    });
  });

  describe("hover preview", () => {
    it("previews the stars under a mouse pointer without choosing, keeping the chosen ones solid, and puts it back on leaving", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={1} />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "mouse" });
      // The chosen star stays solid; the pointer's stars are drawn in the preview look.
      expect(fills(container)).toEqual([1, 0, 0, 0, 0]);
      expect(previews(container)).toEqual([1, 1, 1, 1, 0]);
      expect(checked()).toBe("1");
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(fills(container)).toEqual([1, 0, 0, 0, 0]);
      expect(previews(container)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    });

    it("empties the chosen stars above a pointer that is below the rating, and previews nothing new", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={4} />);
      fireEvent.pointerEnter(radios()[1] as HTMLElement, { pointerType: "mouse" });
      expect(fills(container)).toEqual([1, 1, 0, 0, 0]);
      expect(previews(container)).toEqual([1, 1, 0, 0, 0]);
    });

    it("previews half an icon at a half step", () => {
      const { container } = render(<RatingInput aria-label="Rating" precision={0.5} />);
      fireEvent.pointerEnter(radios().find((radio) => radio.value === "2.5") as HTMLElement, { pointerType: "mouse" });
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      expect(previews(container)).toEqual([1, 1, 0.5, 0, 0]);
    });

    it("draws the preview as a pale fill under a tone-coloured outline, hidden from assistive technology", () => {
      const { container } = render(<RatingInput aria-label="Rating" />);
      const preview = container.querySelector("[class*='preview']:not([data-fill])") as HTMLElement;
      expect(preview.querySelectorAll("svg")).toHaveLength(2);
      expect(preview.closest("[aria-hidden='true']")).not.toBeNull();
      expect(preview.querySelector("[class*='previewFill']")).not.toBeNull();
      expect(preview.querySelector("[class*='previewStroke']")).not.toBeNull();
    });

    it("ignores touch and pen pointers", () => {
      const { container } = render(<RatingInput aria-label="Rating" />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "touch" });
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      expect(previews(container)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    });

    it("does not preview when disabled", () => {
      const { container } = render(<RatingInput aria-label="Rating" disabled />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "mouse" });
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      expect(previews(container)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    });

    it("calls the consumer's pointer-leave handler too", () => {
      const onPointerLeave = vi.fn();
      render(<RatingInput aria-label="Rating" onPointerLeave={onPointerLeave} />);
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
    });
  });

  it("stops previewing the pointer's icon once the keyboard is used", async () => {
    const user = userEvent.setup();
    const { container } = render(<RatingInput aria-label="Rating" defaultValue={2} />);
    await user.tab();
    fireEvent.pointerEnter(radios()[4] as HTMLElement, { pointerType: "mouse" });
    expect(previews(container)).toEqual([1, 1, 1, 1, 1]);
    await user.keyboard("{ArrowRight}");
    expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
    expect(previews(container)).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  describe("read-only", () => {
    it("is one image with a text alternative, not a group of choices", () => {
      render(<RatingInput aria-label="Average rating" readOnly value={4.3} />);
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.getByRole("img", { name: "Average rating, Rated 4.3 out of 5" })).toBeInTheDocument();
    });

    it("draws a value exactly, filling part of an icon", () => {
      const { container } = render(<RatingInput aria-label="Rating" readOnly value={3.3} />);
      const [first, , , fourth, fifth] = fills(container);
      expect(first).toBe(1);
      expect(fourth).toBeCloseTo(0.3);
      expect(fifth).toBe(0);
    });

    it("says when there is no rating", () => {
      render(<RatingInput readOnly value={0} />);
      expect(screen.getByRole("img", { name: "Not rated" })).toBeInTheDocument();
    });

    it("submits its value under the name with a hidden input", () => {
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" readOnly value={3.5} name="stars" />
        </form>,
      );
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("stars")).toBe("3.5");
    });

    it("includes the labelled-by element in its name", () => {
      render(
        <>
          <span id="what">Average rating</span>
          <RatingInput readOnly value={2} aria-labelledby="what" id="r" />
        </>,
      );
      expect(screen.getByRole("img")).toHaveAccessibleName("Average rating Rated 2 out of 5");
    });
  });

  describe("states", () => {
    it("sets aria-invalid for hasError", () => {
      render(<RatingInput aria-label="Rating" hasError />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
    });

    it("disables every radio", () => {
      render(<RatingInput aria-label="Rating" disabled />);
      expect(radios().every((radio) => radio.disabled)).toBe(true);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
    });

    it("makes the rating required for forms", () => {
      render(<RatingInput aria-label="Rating" required />);
      expect(radios().every((radio) => radio.required)).toBe(true);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    });
  });

  describe("forms", () => {
    it("submits the value under its name, as a number", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" name="stars" precision={0.5} />
        </form>,
      );
      await user.click(radios()[5] as HTMLElement);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("stars")).toBe("3");
    });

    it("belongs to no form, and submits nothing, without a name, yet still moves as one group", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" />
        </form>,
      );
      expect(radios()[0]?.form).toBeNull();
      await user.click(radios()[1] as HTMLElement);
      expect([...new FormData(container.querySelector("form") as HTMLFormElement).keys()]).toEqual([]);
      expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
    });

    it("treats an empty name as no name, so the radios still move as one group", () => {
      render(<RatingInput aria-label="Rating" name="" defaultValue={2} />);
      expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
      expect(radios()[0]?.name).not.toBe("");
    });

    it("stops a submit while a required rating has no value", async () => {
      const user = userEvent.setup();
      render(
        <form>
          <RatingInput aria-label="Rating" name="stars" required />
        </form>,
      );
      expect(radios()[0]?.checkValidity()).toBe(false);
      await user.click(radios()[0] as HTMLElement);
      expect(radios()[0]?.checkValidity()).toBe(true);
    });
  });

  describe("review summary", () => {
    const valueText = (container: HTMLElement) => container.querySelector("[class*='value']:not([class*='valueName'])") as HTMLElement | null;
    const countText = (container: HTMLElement) => container.querySelector("[class*='count']") as HTMLElement | null;

    it("writes the value before the icons with one decimal, hidden from assistive technology", () => {
      const { container } = render(<RatingInput aria-label="Rating" showValue defaultValue={3} />);
      const value = valueText(container) as HTMLElement;
      expect(value).toHaveTextContent("3.0");
      expect(value).toHaveAttribute("aria-hidden", "true");
      expect(value.nextElementSibling).toBe(screen.getByRole("radiogroup"));
    });

    it("writes a read-only value exactly, and a rating that has none as a dash", () => {
      const { container, rerender } = render(<RatingInput aria-label="Rating" readOnly showValue value={4.2} />);
      expect(valueText(container)).toHaveTextContent("4.2");
      rerender(<RatingInput aria-label="Rating" readOnly showValue value={4.25} />);
      expect(valueText(container)).toHaveTextContent("4.3");
      rerender(<RatingInput aria-label="Rating" readOnly showValue value={0} />);
      expect(valueText(container)).toHaveTextContent("–");
    });

    it("writes a dash for an unrated rating that can be changed, until the pointer previews a value", () => {
      const { container } = render(<RatingInput aria-label="Rating" showValue />);
      expect(valueText(container)).toHaveTextContent("–");
      fireEvent.pointerEnter(radios()[2] as HTMLElement, { pointerType: "mouse" });
      expect(valueText(container)).toHaveTextContent("3.0");
    });

    it("leaves what no rating reads as to formatValue, which is given 0", () => {
      const formatValue = vi.fn((value: number) => value.toFixed(1));
      const { container } = render(<RatingInput aria-label="Rating" showValue formatValue={formatValue} />);
      expect(valueText(container)).toHaveTextContent("0.0");
      expect(formatValue).toHaveBeenCalledWith(0);
    });

    it("follows the value under the pointer on a rating that can be changed", () => {
      const { container } = render(<RatingInput aria-label="Rating" showValue defaultValue={2} />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "mouse" });
      expect(valueText(container)).toHaveTextContent("4.0");
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(valueText(container)).toHaveTextContent("2.0");
    });

    it("writes the number through formatValue, with plain numbers", () => {
      const formatValue = vi.fn((value: number) => `${value.toFixed(2)} stars`);
      const { container } = render(<RatingInput aria-label="Rating" readOnly showValue value={4.2} formatValue={formatValue} />);
      expect(valueText(container)).toHaveTextContent("4.20 stars");
      expect(formatValue).toHaveBeenCalledWith(4.2);
    });

    it("keeps the space for the widest value, so a changing value never moves the icons", () => {
      const { container, rerender } = render(<RatingInput aria-label="Rating" showValue />);
      expect(valueText(container)).toHaveStyle({ minInlineSize: "3ch" });
      rerender(<RatingInput aria-label="Rating" showValue max={10} />);
      expect(valueText(container)).toHaveStyle({ minInlineSize: "4ch" });
    });

    it("draws no value unless asked", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={3} />);
      expect(valueText(container)).toBeNull();
    });

    it("writes the count after the icons as (124), hidden from assistive technology", () => {
      const { container } = render(<RatingInput aria-label="Rating" readOnly value={4.2} count={124} />);
      const count = countText(container) as HTMLElement;
      expect(count).toHaveTextContent("(124)");
      expect(count).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("img").parentElement?.nextElementSibling).toBe(count);
    });

    it("adds the count, in words, to the rating's text alternative", () => {
      const { rerender } = render(<RatingInput aria-label="Average rating" readOnly value={4.2} count={124} />);
      expect(screen.getByRole("img", { name: "Average rating, Rated 4.2 out of 5, 124 reviews" })).toBeInTheDocument();
      rerender(<RatingInput aria-label="Average rating" readOnly value={4} count={1} />);
      expect(screen.getByRole("img", { name: "Average rating, Rated 4 out of 5, 1 review" })).toBeInTheDocument();
      rerender(<RatingInput readOnly value={0} count={0} />);
      expect(screen.getByRole("img", { name: "Not rated, 0 reviews" })).toBeInTheDocument();
    });

    it("writes the count through labels and formatNumber, keeping a default when a label is undefined", () => {
      const { container, rerender } = render(
        <RatingInput aria-label="Note" readOnly value={4} count={1240} formatNumber={(n) => `#${n}`} />,
      );
      expect(countText(container)).toHaveTextContent("(#1240)");
      rerender(
        <RatingInput
          aria-label="Note"
          readOnly
          value={4}
          count={124}
          labels={{ count: (n) => `${n} avis`, countText: (n) => `${n} avis au total` }}
        />,
      );
      expect(countText(container)).toHaveTextContent("124 avis");
      expect(screen.getByRole("img")).toHaveAccessibleName("Note, Rated 4 out of 5, 124 avis au total");
      rerender(<RatingInput aria-label="Note" readOnly value={4} count={124} labels={{ count: undefined }} />);
      expect(countText(container)).toHaveTextContent("(124)");
    });

    it("ignores a count that is not a number", () => {
      const { container } = render(<RatingInput aria-label="Rating" readOnly value={4} count={Number.NaN} />);
      expect(countText(container)).toBeNull();
      expect(screen.getByRole("img")).toHaveAccessibleName("Rating, Rated 4 out of 5");
    });

    it("puts a suffix on the same row after the count, as a real control that keeps its own name and tab stop", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <button type="button">before</button>
          <RatingInput aria-label="Rating" readOnly value={4.2} count={124} suffix={<a href="#reviews">Read reviews</a>} />
          <button type="button">after</button>
        </>,
      );
      const link = screen.getByRole("link", { name: "Read reviews" });
      expect(countText(container)?.nextElementSibling).toBe(link.parentElement);
      expect(link.closest("[aria-hidden='true']")).toBeNull();
      await user.click(screen.getByRole("button", { name: "before" }));
      await user.tab();
      expect(link).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("ignores count and suffix, with a development warning, on a rating that can be changed", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container } = render(<RatingInput aria-label="Rating" count={5} suffix={<a href="#r">Read</a>} />);
      expect(countText(container)).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`count` and `suffix` are for a read-only summary"));
      warn.mockRestore();
    });

    it("has no axe violations as a whole summary, or beside an interactive rating", async () => {
      const { container } = render(
        <>
          <RatingInput aria-label="Average rating" readOnly value={4.2} showValue count={124} suffix={<a href="#reviews">Read reviews</a>} />
          <RatingInput aria-label="Your rating" showValue defaultValue={3} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("value names", () => {
    const names = ["Poor", "Fair", "Good", "Great", "Excellent"];

    it("adds each name to its radio's accessible name", () => {
      render(<RatingInput aria-label="Rating" valueNames={names} precision={0.5} />);
      expect(radios().find((radio) => radio.value === "3")).toHaveAttribute("aria-label", "3 out of 5, Good");
      expect(radios().find((radio) => radio.value === "2.5")).toHaveAttribute("aria-label", "2.5 out of 5");
    });

    it("writes the name of the chosen value beside the icons, and of the one under the pointer", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName defaultValue={3} />);
      const active = () => Array.from(container.querySelectorAll("[data-active='true']")).map((slot) => slot.textContent);
      expect(active()).toEqual(["Good"]);
      fireEvent.pointerEnter(radios()[4] as HTMLElement, { pointerType: "mouse" });
      expect(active()).toEqual(["Excellent"]);
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(active()).toEqual(["Good"]);
    });

    it("keeps every name in the page so the space for the longest is kept, and hides them from assistive technology", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName />);
      const wrapper = container.querySelector("[class*='valueName']") as HTMLElement;
      expect(wrapper).toHaveAttribute("aria-hidden", "true");
      expect(wrapper.children).toHaveLength(5);
      expect(container.querySelector("[data-active='true']")).toBeNull();
    });

    it("shows the name of the whole value below a half step", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName precision={0.5} defaultValue={3.5} />);
      expect(container.querySelector("[data-active='true']")).toHaveTextContent("Good");
    });

    it("shows nothing at a half step below the first value, and warns when there are no names", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName precision={0.5} defaultValue={0.5} />);
      expect(container.querySelector("[data-active='true']")).toBeNull();
      render(<RatingInput aria-label="Other" showValueName />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`showValueName` has no text"));
      warn.mockRestore();
    });
  });

  describe("labels and numbers", () => {
    it("translates the text it writes, keeping the default when a label is undefined", () => {
      const { rerender } = render(
        <RatingInput aria-label="Note" labels={{ itemLabel: (value, max) => `${value} sur ${max}` }} />,
      );
      expect(radios()[0]).toHaveAttribute("aria-label", "1 sur 5");
      rerender(<RatingInput aria-label="Note" readOnly value={0} labels={{ notRated: "Sans note" }} />);
      expect(screen.getByRole("img", { name: "Note, Sans note" })).toBeInTheDocument();
      rerender(<RatingInput aria-label="Note" readOnly value={2} labels={{ valueText: undefined }} />);
      expect(screen.getByRole("img", { name: "Note, Rated 2 out of 5" })).toBeInTheDocument();
    });

    it("writes numbers through formatNumber in the default labels, and keeps plain numbers for the callback", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" formatNumber={(value) => `#${value}`} onValueChange={onValueChange} />);
      expect(radios()[1]).toHaveAttribute("aria-label", "#2 out of #5");
      await user.click(radios()[1] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(2);
    });
  });

  describe("final review probes", () => {
    it("names a read-only rating from aria-labelledby plus its own text, with no id passed in", () => {
      render(
        <>
          <span id="what">Average rating</span>
          <RatingInput readOnly value={2} aria-labelledby="what" />
        </>,
      );
      expect(screen.getByRole("img")).toHaveAccessibleName("Average rating Rated 2 out of 5");
    });

    it("calls the consumer's key and pointer-leave handlers on a read-only rating too", () => {
      const onKeyDown = vi.fn();
      const onPointerLeave = vi.fn();
      render(<RatingInput aria-label="Average" readOnly value={2} onKeyDown={onKeyDown} onPointerLeave={onPointerLeave} />);
      fireEvent.keyDown(screen.getByRole("img"), { key: "a" });
      fireEvent.pointerLeave(screen.getByRole("img"));
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
    });

    it("draws whatever formatValue returns, even when it is not a string", () => {
      const { container } = render(
        <RatingInput aria-label="Rating" readOnly showValue value={4} formatValue={((value: number) => value * 2) as unknown as (value: number) => string} />,
      );
      const value = container.querySelector("[class*='value']:not([class*='valueName'])") as HTMLElement;
      expect(value).toHaveTextContent("8");
      // The width reserved for the widest value (10, two characters) is measured on the text, not on a number.
      expect(value).toHaveStyle({ minInlineSize: "2ch" });
    });

    it("warns in development when a rating a person can change has no accessible name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<RatingInput />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs an accessible name"));
      warn.mockClear();
      render(<RatingInput aria-label="Rating" />);
      render(<RatingInput aria-labelledby="x" />);
      render(<RatingInput readOnly value={3} />);
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("needs an accessible name"));
      warn.mockRestore();
    });
  });

  describe("props and refs", () => {
    it("puts the ref, id, data-testid and aria props on the group, and className and style on the outer box", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <RatingInput ref={ref} id="x" data-testid="t" aria-label="Rating" aria-describedby="help" className="mine" style={{ margin: "7px" }} />,
      );
      const group = screen.getByRole("radiogroup");
      expect(ref.current).toBe(group);
      expect(group).toHaveAttribute("id", "x");
      expect(group).toHaveAttribute("data-testid", "t");
      expect(group).toHaveAttribute("aria-describedby", "help");
      expect(container.firstElementChild).toHaveClass("mine");
      expect(container.firstElementChild).toHaveStyle({ margin: "7px" });
    });

    it("keeps the role and attributes it computes when a consumer passes the same ones", () => {
      const stray = { role: "button", "aria-invalid": "true" } as const;
      render(<RatingInput aria-label="Rating" {...stray} />);
      expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-invalid");
    });

    it("draws the filled icons in the brand tone by default, and in another when asked", () => {
    const { container, rerender } = render(<RatingInput aria-label="Rating" defaultValue={2} />);
    const filledColor = () => getComputedStyle(container.querySelector("[class*='filled'] svg") as Element).color;
    expect(filledColor()).toBe("var(--dbm-icon-brand)");
    rerender(<RatingInput aria-label="Rating" defaultValue={2} tone="highlight" />);
    expect(filledColor()).toBe("var(--dbm-icon-highlight)");
    rerender(<RatingInput aria-label="Rating" defaultValue={2} tone="warning" />);
    expect(filledColor()).toBe("var(--dbm-icon-warning)");
  });

  it("draws any Phosphor icon", () => {
      const Dot = (props: { className?: string }) => <svg data-testid="dot" className={props.className} />;
      render(<RatingInput aria-label="Rating" max={2} icon={Dot as never} />);
      expect(screen.getAllByTestId("dot")).toHaveLength(8);
    });
  });

  describe("roundTo", () => {
    it("draws a read-only average to the nearest whole icon, keeping the exact value for the number and the name", () => {
      const { container, rerender } = render(<RatingInput aria-label="Average" readOnly showValue value={3.2} roundTo={1} />);
      expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
      expect(container.querySelector("[class*='value']:not([class*='valueName'])")).toHaveTextContent("3.2");
      expect(screen.getByRole("img")).toHaveAccessibleName("Average, Rated 3.2 out of 5");
      rerender(<RatingInput aria-label="Average" readOnly showValue value={3.6} roundTo={1} />);
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
    });

    it("draws it to the nearest half, and submits the exact value", () => {
      const { container } = render(
        <form>
          <RatingInput aria-label="Average" readOnly value={3.3} roundTo={0.5} name="avg" />
        </form>,
      );
      expect(fills(container)).toEqual([1, 1, 1, 0.5, 0]);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("avg")).toBe("3.3");
    });

    it("draws exactly when it is left out", () => {
      const { container } = render(<RatingInput aria-label="Average" readOnly value={3.3} />);
      expect(fills(container)[3]).toBeCloseTo(0.3);
    });

    it("shows the name of the whole value below the rounded drawing", () => {
      const { container } = render(
        <RatingInput aria-label="Average" readOnly value={3.3} roundTo={0.5} valueNames={["a", "b", "c", "d", "e"]} showValueName />,
      );
      expect(container.querySelector("[data-active='true']")).toHaveTextContent("c");
    });

    it("is ignored, with a development warning, on a rating that can be changed, and for a value that is not a step", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container, rerender } = render(<RatingInput aria-label="Rating" defaultValue={3} roundTo={0.5} />);
      expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`roundTo` is for a read-only rating"));
      rerender(<RatingInput aria-label="Rating" readOnly value={3.3} roundTo={0.25 as 1} />);
      expect(fills(container)[3]).toBeCloseTo(0.3);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`roundTo` must be 1 or 0.5"));
      warn.mockRestore();
    });
  });

  describe("dir", () => {
    it("is left to right by default and draws right to left when asked, on the outermost box", () => {
      const { container, rerender } = render(<RatingInput aria-label="Rating" />);
      expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
      rerender(<RatingInput aria-label="Rating" dir="rtl" />);
      expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
    });

    it("follows a DirectionProvider, and its own dir wins", () => {
      const { container, rerender } = render(<DirectionProvider dir="rtl"><RatingInput aria-label="Rating" /></DirectionProvider>);
      expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
      rerender(<DirectionProvider dir="rtl"><RatingInput aria-label="Rating" dir="ltr" /></DirectionProvider>);
      expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
    });

    it("does not read the page's direction", () => {
      const { container } = render(
        <div dir="rtl">
          <RatingInput aria-label="Rating" />
        </div>,
      );
      expect(container.querySelector("[dir='ltr']")).not.toBeNull();
    });

    it("turns Left and Right round, so the arrow keys follow the picture, and loops like a radio group", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" dir="rtl" defaultValue={3} onValueChange={onValueChange} />);
      await user.tab();
      expect(radios()[2]).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(checked()).toBe("4");
      expect(radios()[3]).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(checked()).toBe("2");
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(checked()).toBe("5");
      expect(onValueChange).toHaveBeenLastCalledWith(5);
    });

    it("leaves left to right to the browser: Right chooses the next value", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" defaultValue={3} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(checked()).toBe("4");
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(checked()).toBe("2");
    });

    it("leaves a modified arrow key alone in right to left", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" dir="rtl" defaultValue={3} />);
      await user.tab();
      await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
      expect(checked()).not.toBe("4");
    });

    it("keeps the same choices, in the same order, so the value means the same", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" dir="rtl" precision={0.5} onValueChange={onValueChange} />);
      expect(radios().map((radio) => radio.value)).toEqual(["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"]);
      await user.click(radios()[5] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(3);
    });
  });

  it("renders on the server, with every icon", () => {
    const html = renderToString(<RatingInput aria-label="Rating" max={4} defaultValue={2} />);
    expect(html.match(/type="radio"/g)).toHaveLength(4);
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <RatingInput aria-label="Rating" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.click(radios()[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={3} />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with half steps, names, an error and required", async () => {
      const { container } = render(
        <RatingInput aria-label="Rating" precision={0.5} valueNames={["a", "b", "c", "d", "e"]} showValueName hasError required defaultValue={2.5} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations read-only or disabled", async () => {
      const { container } = render(
        <>
          <RatingInput aria-label="Average" readOnly value={4.2} />
          <RatingInput aria-label="Locked" disabled defaultValue={2} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
