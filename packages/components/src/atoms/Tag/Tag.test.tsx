import { TagIcon } from "@dbm-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders its label text", () => {
    render(<Tag>Design</Tag>);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("renders a leading icon when leadingIcon is provided", () => {
    const { container } = render(<Tag leadingIcon={TagIcon}>Design</Tag>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a trailing icon when trailingIcon is provided", () => {
    const { container } = render(<Tag trailingIcon={TagIcon}>Design</Tag>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders both a leading and trailing icon together", () => {
    const { container } = render(
      <Tag leadingIcon={TagIcon} trailingIcon={TagIcon}>
        Design
      </Tag>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("does not render a remove button by default", () => {
    render(<Tag>Design</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a remove button when removable, with a default accessible label", () => {
    render(<Tag removable>Design</Tag>);
    expect(
      screen.getByRole("button", { name: "Remove Design" }),
    ).toBeInTheDocument();
  });

  it("supports a custom removeLabel", () => {
    render(
      <Tag removable removeLabel="Remove Design filter">
        Design
      </Tag>,
    );
    expect(
      screen.getByRole("button", { name: "Remove Design filter" }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Design
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Remove Design" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not warn when removable and onRemove are used together, or neither is set", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    render(<Tag>Design</Tag>);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when removable is set without onRemove", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Tag removable>Design</Tag>);
    rerender(<Tag removable>Design (renamed)</Tag>);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`removable` is set without `onRemove`"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("forwards ref to the root span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref}>Design</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies className", () => {
    render(
      <Tag className="custom" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag")).toHaveClass("custom");
  });

  it("defaults to the brand tone and subtle variant", () => {
    render(<Tag data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleBrand/);
  });

  it("applies the matching class for each tone", () => {
    const { rerender } = render(<Tag tone="brand" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleBrand/);

    rerender(<Tag tone="neutral" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleNeutral/);

    rerender(<Tag tone="info" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleInfo/);

    rerender(<Tag tone="success" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleSuccess/);

    rerender(<Tag tone="warning" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleWarning/);

    rerender(<Tag tone="highlight" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleHighlight/);

    rerender(<Tag tone="danger" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleDanger/);
  });

  it("applies the matching class for the solid variant, per tone", () => {
    const { rerender } = render(
      <Tag tone="brand" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidBrand/);

    rerender(
      <Tag tone="neutral" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidNeutral/);

    rerender(
      <Tag tone="danger" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidDanger/);
  });

  it("draws the highlight tone in every variant and state with its own tokens", () => {
    const { rerender } = render(
      <Tag tone="highlight" variant="subtle" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/subtleHighlight/);
    rerender(
      <Tag tone="highlight" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidHighlight/);
    rerender(
      <Tag tone="highlight" variant="outlined" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/outlinedHighlight/);
    rerender(
      <Tag tone="highlight" variant="outlined" selected onSelectedChange={() => {}} data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/selected/);
    expect(screen.getByTestId("tag").className).toMatch(/outlinedHighlight/);
  });

  it("gives a solid highlight tag's remove glyph the on-highlight icon tone, and a subtle one the text colour", () => {
    const { container, rerender } = render(
      <Tag tone="highlight" variant="solid" removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    expect(container.querySelector("svg")?.getAttribute("class") ?? "").toMatch(/OnHighlight/);
    rerender(
      <Tag tone="highlight" variant="subtle" removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    const subtleIcon = container.querySelector("svg")?.getAttribute("class") ?? "";
    expect(subtleIcon).not.toMatch(/Highlight/);
    expect(subtleIcon).not.toMatch(/tone(Brand|Default|Secondary)/);
  });

  it("keeps the remove button a tab stop by default, and takes it out of the tab order with removeTabStop={false}", () => {
    const { rerender } = render(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    expect(screen.getByRole("button", { name: "Remove Design" })).not.toHaveAttribute("tabindex");
    rerender(
      <Tag removable removeTabStop={false} onRemove={() => {}}>
        Design
      </Tag>,
    );
    const button = screen.getByRole("button", { name: "Remove Design" });
    expect(button).toHaveAttribute("tabindex", "-1");
    button.focus();
    expect(button).toHaveFocus();
  });

  it("applies the matching class for the outlined variant, per tone", () => {
    const { rerender } = render(
      <Tag tone="brand" variant="outlined" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/outlinedBrand/);

    rerender(
      <Tag tone="neutral" variant="outlined" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/outlinedNeutral/);

    rerender(
      <Tag tone="danger" variant="outlined" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/outlinedDanger/);
  });

  it("defaults to size md", () => {
    render(<Tag data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeMd/);
  });

  it("applies the matching class for each size", () => {
    const { rerender } = render(<Tag size="xs" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeXs/);

    rerender(<Tag size="sm" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeSm/);

    rerender(<Tag size="lg" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeLg/);

    rerender(<Tag size="xl" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeXl/);
  });

  it("has no accessibility violations, plain, with an icon, or removable", async () => {
    const { container, rerender } = render(<Tag>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Tag leadingIcon={TagIcon}>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("clickable/selectable mode", () => {
    it("is not focusable or interactive by default", () => {
      render(<Tag data-testid="tag">Design</Tag>);
      const tag = screen.getByTestId("tag");
      expect(tag).not.toHaveAttribute("role");
      expect(tag).not.toHaveAttribute("tabindex");
      expect(tag).not.toHaveAttribute("aria-pressed");
    });

    it("becomes focusable and clickable when onClick is provided", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Tag onClick={onClick}>Design</Tag>);
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("tabindex", "0");
      expect(tag).not.toHaveAttribute("aria-pressed");

      await user.click(tag);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("supports controlled selected state via aria-pressed, without toggling on its own", async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <Tag selected onSelectedChange={onSelectedChange}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-pressed", "true");

      await user.click(tag);
      expect(onSelectedChange).toHaveBeenCalledWith(false);
      // Controlled: the DOM doesn't change until the parent re-renders
      // with a new `selected` value.
      expect(tag).toHaveAttribute("aria-pressed", "true");
    });

    it("supports uncontrolled defaultSelected state, toggling internally on click", async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <Tag defaultSelected={false} onSelectedChange={onSelectedChange}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-pressed", "false");

      await user.click(tag);
      expect(tag).toHaveAttribute("aria-pressed", "true");
      expect(onSelectedChange).toHaveBeenCalledWith(true);
    });

    it("toggles selected via Enter and Space on the keyboard", async () => {
      const user = userEvent.setup();
      render(<Tag defaultSelected={false}>Design</Tag>);
      const tag = screen.getByRole("button", { name: "Design" });

      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(tag).toHaveAttribute("aria-pressed", "true");
      await user.keyboard(" ");
      expect(tag).toHaveAttribute("aria-pressed", "false");
    });

    it("applies the selected visual class only once selected", () => {
      // Controlled `selected`, not `defaultSelected` — a `defaultSelected`
      // change on `rerender` wouldn't be expected to do anything (real
      // uncontrolled semantics, matching `defaultChecked`/`defaultValue`
      // elsewhere: the initial value is only read once, at mount).
      const { rerender } = render(
        <Tag selected={false} data-testid="tag">
          Design
        </Tag>,
      );
      expect(screen.getByTestId("tag").className).not.toMatch(/selected/);

      rerender(
        <Tag selected data-testid="tag">
          Design
        </Tag>,
      );
      expect(screen.getByTestId("tag").className).toMatch(/selected/);
    });

    it("applies both the outlined tone class and the selected class together when an outlined tag is selected", () => {
      render(
        <Tag variant="outlined" tone="danger" selected data-testid="tag">
          Design
        </Tag>,
      );
      const className = screen.getByTestId("tag").className;
      expect(className).toMatch(/outlinedDanger/);
      expect(className).toMatch(/selected/);
    });

    it("renders a real, independently focusable remove button when removable but not interactive", () => {
      render(
        <Tag removable onRemove={() => {}}>
          Design
        </Tag>,
      );
      const removeButton = screen.getByRole("button", { name: "Remove Design" });
      expect(removeButton.tagName).toBe("BUTTON");
    });

    it("renders remove as a decorative, non-focusable glyph when combined with onClick/selected, and handles it without triggering the tag's own click", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onSelectedChange = vi.fn();
      const { container } = render(
        <Tag
          removable
          onRemove={onRemove}
          defaultSelected={false}
          onSelectedChange={onSelectedChange}
        >
          Design
        </Tag>,
      );
      // No second focusable "Remove Design" control once the tag itself
      // is interactive — see Tag.tsx's own comment on this branch for why
      // (a real nested button would be an axe "nested-interactive"
      // violation).
      expect(
        screen.queryByRole("button", { name: "Remove Design" }),
      ).not.toBeInTheDocument();

      const removeIcon = container.querySelector('[class*="removeDecorative"]');
      expect(removeIcon).not.toBeNull();
      await user.click(removeIcon as Element);
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it("removes via Delete/Backspace on the tag itself when combined with onClick/selected", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onSelectedChange = vi.fn();
      render(
        <Tag
          removable
          onRemove={onRemove}
          defaultSelected={false}
          onSelectedChange={onSelectedChange}
        >
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-keyshortcuts", "Delete Backspace");

      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Delete}");
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it("ignores disabled when the tag isn't interactive", () => {
      render(
        <Tag disabled data-testid="tag">
          Design
        </Tag>,
      );
      const tag = screen.getByTestId("tag");
      expect(tag).not.toHaveAttribute("aria-disabled");
      expect(tag).not.toHaveAttribute("role");
    });

    it("warns once in development when disabled is set without interactivity", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<Tag disabled>Design</Tag>);
      rerender(<Tag disabled>Design (renamed)</Tag>);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("`disabled` has no effect"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when disabled is combined with onClick", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Tag disabled onClick={() => {}}>
          Design
        </Tag>,
      );
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("marks aria-disabled and blocks onClick when disabled and interactive", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Tag disabled onClick={onClick}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-disabled", "true");

      await user.click(tag);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("stays focusable and blocks Enter/Space toggling when disabled", async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <Tag disabled defaultSelected={false} onSelectedChange={onSelectedChange}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });

      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onSelectedChange).not.toHaveBeenCalled();
      expect(tag).toHaveAttribute("aria-pressed", "false");
    });

    it("blocks remove via click on the decorative glyph when disabled", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const { container } = render(
        <Tag disabled removable onRemove={onRemove} onClick={() => {}}>
          Design
        </Tag>,
      );
      const removeIcon = container.querySelector('[class*="removeDecorative"]');
      expect(removeIcon).not.toBeNull();
      await user.click(removeIcon as Element);
      expect(onRemove).not.toHaveBeenCalled();
    });

    it("blocks remove via Delete/Backspace when disabled", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(
        <Tag disabled removable onRemove={onRemove} onClick={() => {}}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Delete}");
      expect(onRemove).not.toHaveBeenCalled();
    });

    it("has no accessibility violations when disabled and interactive/removable", async () => {
      const { container } = render(
        <Tag disabled removable onRemove={() => {}} onClick={() => {}}>
          Design
        </Tag>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no accessibility violations when clickable, selectable, or both combined with removable", async () => {
      const { container, rerender } = render(<Tag onClick={() => {}}>Design</Tag>);
      expect((await axe(container)).violations).toHaveLength(0);

      rerender(
        <Tag defaultSelected onSelectedChange={() => {}}>
          Design
        </Tag>,
      );
      expect((await axe(container)).violations).toHaveLength(0);

      rerender(
        <Tag
          removable
          onRemove={() => {}}
          defaultSelected
          onSelectedChange={() => {}}
        >
          Design
        </Tag>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("what the tag computes can't be replaced by a prop (06 §9)", () => {
    it("keeps its own role, tab stop, pressed state and disabled state over the same-named props", () => {
      render(
        <>
          <Tag data-testid="clickable" onClick={() => {}} role="link" tabIndex={-1}>
            Design
          </Tag>
          <Tag data-testid="selected" selected onSelectedChange={() => {}} aria-pressed={false}>
            Design
          </Tag>
          <Tag data-testid="disabled" onClick={() => {}} disabled aria-disabled={false}>
            Design
          </Tag>
          <Tag data-testid="removable" onClick={() => {}} removable onRemove={() => {}} aria-keyshortcuts="x">
            Design
          </Tag>
        </>,
      );
      expect(screen.getByTestId("clickable")).toHaveAttribute("role", "button");
      expect(screen.getByTestId("clickable")).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("selected")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("disabled")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByTestId("removable")).toHaveAttribute("aria-keyshortcuts", "Delete Backspace");
    });

    it("lets a plain tag take a role and a tab index from the caller", () => {
      render(
        <Tag data-testid="tag" role="status" tabIndex={-1}>
          Design
        </Tag>,
      );
      expect(screen.getByTestId("tag")).toHaveAttribute("role", "status");
      expect(screen.getByTestId("tag")).toHaveAttribute("tabindex", "-1");
    });

    it("runs a caller's onKeyDown first, and Enter still activates", () => {
      const onKeyDown = vi.fn();
      const onClick = vi.fn();
      render(
        <Tag data-testid="tag" onClick={onClick} onKeyDown={onKeyDown}>
          Design
        </Tag>,
      );
      fireEvent.keyDown(screen.getByTestId("tag"), { key: "Enter" });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("lets a caller's onKeyDown claim a key with preventDefault", () => {
      const onClick = vi.fn();
      render(
        <Tag data-testid="tag" onClick={onClick} onKeyDown={(event) => event.preventDefault()}>
          Design
        </Tag>,
      );
      fireEvent.keyDown(screen.getByTestId("tag"), { key: "Enter" });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("passes a caller's onKeyDown to a tag that isn't interactive", () => {
      const onKeyDown = vi.fn();
      render(
        <Tag data-testid="tag" onKeyDown={onKeyDown}>
          Design
        </Tag>,
      );
      fireEvent.keyDown(screen.getByTestId("tag"), { key: "a" });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("the remove button's name", () => {
    it("joins the pieces of interpolated children", () => {
      const value = "Active";
      render(
        <Tag removable onRemove={() => {}}>
          Status: {value}
        </Tag>,
      );
      expect(screen.getByRole("button", { name: "Remove Status: Active" })).toBeInTheDocument();
    });

    it("reads the text inside an element, never [object Object]", () => {
      render(
        <Tag removable onRemove={() => {}}>
          <b>Beta</b>
        </Tag>,
      );
      expect(screen.getByRole("button", { name: "Remove Beta" })).toBeInTheDocument();
    });

    it("is just Remove when there is no text", () => {
      render(<Tag removable onRemove={() => {}} leadingIcon={TagIcon} />);
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("takes removeLabel when it has text, and the default when it is empty", () => {
      const { rerender } = render(
        <Tag removable onRemove={() => {}} removeLabel="Clear filter">
          Design
        </Tag>,
      );
      expect(screen.getByRole("button", { name: "Clear filter" })).toBeInTheDocument();
      rerender(
        <Tag removable onRemove={() => {}} removeLabel="">
          Design
        </Tag>,
      );
      expect(screen.getByRole("button", { name: "Remove Design" })).toBeInTheDocument();
    });
  });

  describe("the label box", () => {
    it("draws the label in a span of its own inside the tag", () => {
      render(<Tag data-testid="tag">Design</Tag>);
      const label = screen.getByText("Design");
      expect(label.tagName).toBe("SPAN");
      expect(label.parentElement).toBe(screen.getByTestId("tag"));
    });

    it("hands the label element to labelRef, and null for an icon-only tag", () => {
      const withLabel = createRef<HTMLSpanElement>();
      const iconOnly = createRef<HTMLSpanElement>();
      render(
        <>
          <Tag labelRef={withLabel}>Design</Tag>
          <Tag labelRef={iconOnly} leadingIcon={TagIcon} aria-label="Tagged" />
        </>,
      );
      expect(withLabel.current).toBe(screen.getByText("Design"));
      expect(iconOnly.current).toBeNull();
    });

    it("draws no label box, and so no extra gap, for an icon-only tag", () => {
      render(<Tag data-testid="tag" leadingIcon={TagIcon} aria-label="Tagged" />);
      expect(screen.getByTestId("tag").children).toHaveLength(1);
    });
  });
});
