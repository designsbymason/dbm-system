import { HeartIcon, TrashIcon } from "@dbm-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ButtonGroup } from "../../molecules/ButtonGroup";
import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton.types";

describe("IconButton", () => {
  it("renders a button with the required accessible name", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete item" />);
    expect(
      screen.getByRole("button", { name: "Delete item" }),
    ).toBeInTheDocument();
  });

  it("renders the given icon", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" />);
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("applies variant and size tokens", () => {
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        variant="destructive"
        size="xl"
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-icon-on-danger)",
      height: "var(--dbm-icon-button-size-xl)",
      width: "var(--dbm-icon-button-size-xl)",
    });
  });

  // New review request (2026-08-24, not from the original numbered
  // findings list): match IconButton's box dimensions to Button's own
  // real rendered height at the equivalent size step, so the two
  // components read as visually consistent when placed side by side —
  // e.g. an IconButton next to a Button in a toolbar. `xs`/`sm`/`md` use
  // Button's fixed (non-fluid) font sizes, so the match holds at every
  // viewport; `lg`/`xl` use Button's fluid font sizes, so the match is
  // exact only at the 1440px reference viewport the values were measured
  // at (see `component/icon-button.json`'s own `$description` for the
  // real numbers and the accepted tradeoff).
  it.each([
    ["xs", "var(--dbm-icon-button-size-xs)"],
    ["sm", "var(--dbm-icon-button-size-sm)"],
    ["md", "var(--dbm-icon-button-size-md)"],
    ["lg", "var(--dbm-icon-button-size-lg)"],
    ["xl", "var(--dbm-icon-button-size-xl)"],
  ] as const)(
    "renders a square box (height === width) at the %s size, from the icon-button.size component token",
    (size, expectedToken) => {
      render(<IconButton icon={TrashIcon} aria-label="Delete" size={size} />);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        height: expectedToken,
        width: expectedToken,
      });
    },
  );

  it("keeps the same box size when rounded — only the corner radius changes", () => {
    const { rerender } = render(
      <IconButton icon={TrashIcon} aria-label="Delete" size="lg" />,
    );
    const button = screen.getByRole("button");
    const squareHeight = getComputedStyle(button).height;

    rerender(
      <IconButton icon={TrashIcon} aria-label="Delete" size="lg" rounded />,
    );
    expect(getComputedStyle(button).height).toBe(squareHeight);
    expect(getComputedStyle(button).width).toBe(squareHeight);
  });

  // Review finding #5 (2026-08-24): `secondary`/`tertiary`/`ghost` were
  // coloring themselves via `text.primary`/`text.secondary` — a category
  // violation this component's own code comment already warned against but
  // only actually fixed for `primary`/`destructive`. Superseded by finding
  // #12 the same day: all three now resolve to `icon.brand` (not
  // `icon.default`/`icon.secondary`), since finding #12 ported Button's
  // own brand-colored restyle of these exact variants — the assertion
  // still proves the real, current icon.* token each variant resolves to,
  // just an updated expected value.
  it.each([
    ["secondary", "var(--dbm-icon-brand)"],
    ["tertiary", "var(--dbm-icon-brand)"],
    ["ghost", "var(--dbm-icon-brand)"],
  ] as const)(
    "colors the %s variant via an icon.* token, never a text.* one",
    (variant, expectedColor) => {
      render(
        <IconButton icon={TrashIcon} aria-label="Delete" variant={variant} />,
      );
      expect(screen.getByRole("button")).toHaveStyle({ color: expectedColor });
    },
  );

  it("shows a spinner and disables the button when isLoading", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" isLoading />);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
    expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("stays disabled while isLoading even when disabled is explicitly false", () => {
    // Regression test: `disabled ?? isLoading` used to let an explicit
    // `disabled={false}` win over `isLoading` via `??`'s nullish-only
    // fallthrough, leaving a "loading" button fully clickable. Same bug
    // and fix as Button's own.
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        isLoading
        disabled={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("never lets a same-named consumer prop override the computed aria-busy (found in review — TypeScript's JSX checker allows aria-* props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        isLoading
        aria-busy={false}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the single child via Slot when asChild is set", () => {
    render(
      <IconButton asChild icon={TrashIcon} aria-label="Delete">
        <a href="/delete">×</a>
      </IconButton>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link.tagName).toBe("A");
  });

  it("draws the icon inside an empty slotted element", () => {
    render(
      <IconButton asChild icon={TrashIcon} aria-label="Delete">
        <a href="/delete" aria-label="Delete" />
      </IconButton>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link).toHaveAttribute("href", "/delete");
    expect(link.querySelectorAll("svg")).toHaveLength(1);
  });

  it("uses the slotted element's own content as it is, so an icon put in the link is not drawn twice", () => {
    render(
      <IconButton asChild icon={TrashIcon} aria-label="Delete">
        <a href="/delete">
          <svg data-testid="own-icon" />
        </a>
      </IconButton>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.getByTestId("own-icon")).toBeInTheDocument();
  });

  it("draws the spinner inside an empty slotted element while loading", () => {
    render(
      <IconButton asChild icon={TrashIcon} aria-label="Delete" isLoading>
        <a href="/delete" aria-label="Delete" />
      </IconButton>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link.querySelector("svg")).not.toBeInTheDocument();
    expect(link.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <IconButton icon={TrashIcon} aria-label="Delete" onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        disabled
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" but respects an explicit type override', () => {
    const { rerender } = render(
      <IconButton icon={TrashIcon} aria-label="Delete" />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");

    rerender(<IconButton icon={TrashIcon} aria-label="Delete" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("overrides aria-label with loadingLabel while isLoading, falling back to aria-label otherwise", () => {
    const { rerender } = render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        isLoading
        loadingLabel="Deleting…"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Deleting…" }),
    ).toBeInTheDocument();

    rerender(<IconButton icon={TrashIcon} aria-label="Delete" isLoading />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("falls back to aria-label while isLoading even when loadingLabel is explicitly an empty string", () => {
    // Regression test: `loadingLabel ?? ariaLabel` used to let an explicit
    // `loadingLabel=""` win over `ariaLabel` via `??`'s nullish-only
    // fallthrough, leaving the button with no accessible name at all while
    // loading. Same bug and fix as Button's own `loadingText ?? children`.
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        isLoading
        loadingLabel=""
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("applies rounded styling", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" rounded />);
    expect(screen.getByRole("button").className).toMatch(/rounded/);
  });

  it("uses a proportionally larger icon at the xl size (matches lg->xl button growth)", () => {
    const { rerender } = render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        size="lg"
        data-testid="btn"
      />,
    );
    const lgIconClass = screen.getByTestId("btn").querySelector("svg")
      ?.className.baseVal;

    rerender(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        size="xl"
        data-testid="btn"
      />,
    );
    const xlIconClass = screen.getByTestId("btn").querySelector("svg")
      ?.className.baseVal;

    expect(xlIconClass).not.toBe(lgIconClass);
  });

  describe("label (a caption under the icon)", () => {
    it("draws no caption and none of its classes without a label", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" />);
      const button = screen.getByRole("button");
      expect(button.className).not.toMatch(/hasLabel|labelAlways/);
      expect(button.querySelector("[data-label]")).toBeNull();
    });

    it("draws the caption inside the button, for the eye only, with the name still the aria-label", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite item" label="Favorite" />);
      const button = screen.getByRole("button", { name: "Favorite item" });
      const caption = button.querySelector("[data-label]")!;
      expect(caption).toHaveTextContent("Favorite");
      expect(caption).toHaveAttribute("aria-hidden", "true");
      expect(caption).toHaveAttribute("data-label", "Favorite");
      expect(button.className).toMatch(/hasLabel/);
      expect(button.className).toMatch(/labelAlways/);
    });

    it("shows the caption from a step up with hideLabelBelow, one class per step", () => {
      for (const step of ["sm", "md", "lg", "xl", "2xl", "3xl"] as const) {
        const { unmount } = render(<IconButton icon={HeartIcon} aria-label="Favorite" label="Favorite" hideLabelBelow={step} />);
        const className = screen.getByRole("button").className;
        expect(className).toMatch(new RegExp(`hideLabelBelow${step === "2xl" ? "2xl" : step[0]!.toUpperCase() + step.slice(1)}`));
        expect(className).not.toMatch(/labelAlways/);
        unmount();
      }
    });

    it("ignores an empty label", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" label="" />);
      expect(screen.getByRole("button").className).not.toMatch(/hasLabel/);
    });

    it("keeps the spinner in the icon's place and the caption while loading", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" label="Favorite" isLoading />);
      const button = screen.getByRole("button");
      expect(button.querySelector('[aria-hidden="true"]:not([data-label])')).not.toBeNull();
      expect(button.querySelector("[data-label]")).toHaveTextContent("Favorite");
    });

    it("marks a pressed captioned toggle, which draws its caption bold", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" label="Favorite" defaultPressed />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button").className).toMatch(/pressed/);
    });

    describe("what it warns about, in development", () => {
      it("draws the caption inside an empty asChild element, without warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
          <IconButton asChild icon={HeartIcon} aria-label="Favorite" label="Favorite">
            <a href="/favorites" aria-label="Favorite" />
          </IconButton>,
        );
        expect(screen.getByRole("link").querySelector("[data-label]")).toHaveTextContent("Favorite");
        expect(warn.mock.calls.some(([message]) => String(message).includes("`label` has no effect"))).toBe(false);
        warn.mockRestore();
      });

      it("does not draw a caption when the asChild element has content of its own, and warns", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
          <IconButton asChild icon={HeartIcon} aria-label="Favorite" label="Favorite">
            <a href="/favorites">Favorites</a>
          </IconButton>,
        );
        expect(screen.getByRole("link").querySelector("[data-label]")).toBeNull();
        expect(warn.mock.calls.some(([message]) => String(message).includes("`label` has no effect when the `asChild` element has content"))).toBe(true);
        warn.mockRestore();
      });

      it("ignores rounded while the caption shows, and warns", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(<IconButton icon={HeartIcon} aria-label="Rounded favorite" label="Favorite" rounded />);
        expect(screen.getByRole("button").className).not.toMatch(/rounded/);
        expect(warn.mock.calls.some(([message]) => String(message).includes("`rounded` has no effect while a `label`"))).toBe(true);
        warn.mockRestore();
      });

      it("ignores a group's rounded for a captioned button too", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
          <ButtonGroup aria-label="Actions" rounded>
            <IconButton icon={HeartIcon} aria-label="Group favorite" label="Favorite" />
          </ButtonGroup>,
        );
        expect(screen.getByRole("button").className).not.toMatch(/rounded/);
        warn.mockRestore();
      });

      it("warns about a tooltip that repeats an always-visible caption, but not one with hideLabelBelow", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { unmount } = render(<IconButton icon={HeartIcon} aria-label="Tooltip favorite" label="Favorite" tooltip />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("`tooltip` repeats the visible `label`"))).toBe(true);
        unmount();
        warn.mockClear();
        render(<IconButton icon={HeartIcon} aria-label="Hidden favorite" label="Favorite" hideLabelBelow="md" tooltip />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("`tooltip` repeats"))).toBe(false);
        warn.mockRestore();
      });

      it("warns when the caption isn't part of the accessible name, and not when it is", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { unmount } = render(<IconButton icon={HeartIcon} aria-label="Like" label="Favorite" />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("isn't part of the accessible name"))).toBe(true);
        unmount();
        warn.mockClear();
        render(<IconButton icon={HeartIcon} aria-label="Add to Favorite, now" label="Favorite" />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("isn't part of the accessible name"))).toBe(false);
        warn.mockRestore();
      });

      it("reads the caption as whole words, as speech control does: a part of a word is not in the name", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { unmount } = render(<IconButton icon={HeartIcon} aria-label="Add to favorites" label="Favorite" />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("isn't part of the accessible name"))).toBe(true);
        unmount();
        warn.mockClear();
        render(<IconButton icon={HeartIcon} aria-label="Save (to favourites)" label="Save to" />);
        expect(warn.mock.calls.some(([message]) => String(message).includes("isn't part of the accessible name"))).toBe(false);
        warn.mockRestore();
      });
    });
  });

  describe("tone", () => {
    it("is brand unless set: nothing about it changes", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" />);
      expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-brand)", color: "var(--dbm-icon-on-brand)" });
      expect(screen.getByRole("button")).not.toHaveAttribute("data-tone");
    });

    it("draws each variant in the neutral tokens with tone neutral, using icon colours, never text ones", () => {
      const { rerender } = render(<IconButton icon={HeartIcon} aria-label="Favorite" tone="neutral" />);
      expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-neutral)", color: "var(--dbm-icon-on-neutral)" });
      for (const variant of ["secondary", "tertiary"] as const) {
        rerender(<IconButton icon={HeartIcon} aria-label="Favorite" tone="neutral" variant={variant} />);
        expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)", color: "var(--dbm-icon-default)" });
      }
      rerender(<IconButton icon={HeartIcon} aria-label="Favorite" tone="neutral" variant="ghost" />);
      expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-neutral-subtle)", color: "var(--dbm-icon-default)" });
    });

    it("leaves destructive danger-coloured, whatever the tone", () => {
      render(<IconButton icon={TrashIcon} aria-label="Delete" tone="neutral" variant="destructive" />);
      expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-danger)", color: "var(--dbm-icon-on-danger)" });
    });

    it("draws a pressed toggle in the neutral tokens: primary goes quiet, the others solid", () => {
      const { rerender } = render(<IconButton icon={HeartIcon} aria-label="Favorite" tone="neutral" defaultPressed />);
      expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-neutral-subtle)", color: "var(--dbm-icon-default)" });
      for (const variant of ["secondary", "tertiary", "ghost"] as const) {
        rerender(<IconButton icon={HeartIcon} aria-label="Favorite" tone="neutral" variant={variant} defaultPressed />);
        expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: "var(--dbm-bg-neutral)", color: "var(--dbm-icon-on-neutral)" });
      }
    });
  });

  describe("toggle (pressed) state — review finding #11", () => {
    it("does not render aria-pressed at all for a plain, non-toggle button", () => {
      render(<IconButton icon={HeartIcon} aria-label="Favorite" />);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
    });

    it("uncontrolled: defaultPressed sets the initial state and toggles on click", () => {
      render(
        <IconButton icon={HeartIcon} aria-label="Favorite" defaultPressed={false} />,
      );
      const button = screen.getByRole("button", { name: "Favorite" });
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button.className).not.toMatch(/pressed/);

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button.className).toMatch(/pressed/);

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button.className).not.toMatch(/pressed/);
    });

    it("uncontrolled: defaults to unpressed when defaultPressed is omitted but onPressedChange is provided", () => {
      const onPressedChange = vi.fn();
      render(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          onPressedChange={onPressedChange}
        />,
      );
      const button = screen.getByRole("button", { name: "Favorite" });
      expect(button).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(button);
      expect(onPressedChange).toHaveBeenCalledTimes(1);
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("controlled: pressed reflects the prop and does not change itself on click — onPressedChange reports the intended next value", () => {
      const onPressedChange = vi.fn();
      const { rerender } = render(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          pressed={false}
          onPressedChange={onPressedChange}
        />,
      );
      const button = screen.getByRole("button", { name: "Favorite" });
      expect(button).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(button);
      // A controlled value doesn't change itself — the consumer owns it.
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(onPressedChange).toHaveBeenCalledTimes(1);
      expect(onPressedChange).toHaveBeenCalledWith(true);

      rerender(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          pressed
          onPressedChange={onPressedChange}
        />,
      );
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button.className).toMatch(/pressed/);
    });

    it("still fires onClick when toggling", () => {
      const onClick = vi.fn();
      render(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          defaultPressed={false}
          onClick={onClick}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Favorite" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not toggle or fire onPressedChange when disabled", () => {
      const onPressedChange = vi.fn();
      render(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          defaultPressed={false}
          disabled
          onPressedChange={onPressedChange}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Favorite" }));
      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it("does not set aria-pressed on the slotted element, even when asChild is combined with a toggle prop (aria-pressed is invalid on a non-button role like the <a> here)", () => {
      render(
        <IconButton asChild icon={HeartIcon} aria-label="Favorite" defaultPressed>
          <a href="/favorite">
            <HeartIcon />
          </a>
        </IconButton>,
      );
      expect(
        screen.getByRole("link", { name: "Favorite" }),
      ).not.toHaveAttribute("aria-pressed");
    });

    it("still applies the pressed visual class on the slotted element even though aria-pressed is withheld", () => {
      render(
        <IconButton asChild icon={HeartIcon} aria-label="Favorite" defaultPressed>
          <a href="/favorite">
            <HeartIcon />
          </a>
        </IconButton>,
      );
      expect(screen.getByRole("link", { name: "Favorite" }).className).toMatch(
        /pressed/,
      );
    });

    it("has no accessibility violations in the pressed state", async () => {
      const { container } = render(
        <IconButton icon={HeartIcon} aria-label="Favorite" defaultPressed />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations when asChild is combined with a toggle prop", async () => {
      const { container } = render(
        <IconButton asChild icon={HeartIcon} aria-label="Favorite" defaultPressed>
          <a href="/favorite">
            <HeartIcon />
          </a>
        </IconButton>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("switches the icon to Phosphor's fill weight while pressed, bold otherwise", () => {
      const { container: unpressed } = render(
        <IconButton icon={HeartIcon} aria-label="Favorite" defaultPressed={false} />,
      );
      const { container: pressedC } = render(
        <IconButton icon={HeartIcon} aria-label="Favorite" defaultPressed />,
      );
      expect(unpressed.querySelector("svg")?.innerHTML).not.toBe(
        pressedC.querySelector("svg")?.innerHTML,
      );
    });

    it("does not use the fill weight for a plain, non-toggle button", () => {
      const { container: plain } = render(
        <IconButton icon={HeartIcon} aria-label="Favorite" />,
      );
      const { container: explicitUnpressed } = render(
        <IconButton
          icon={HeartIcon}
          aria-label="Favorite"
          defaultPressed={false}
        />,
      );
      expect(plain.querySelector("svg")?.innerHTML).toBe(
        explicitUnpressed.querySelector("svg")?.innerHTML,
      );
    });

    // Pressed background/icon-color per tone family (2026-08-24, at
    // explicit direction) — deliberately its own token chain, not a reuse
    // of each variant's rest/hover tokens:
    // `primary`/`destructive` (solid at rest) invert to that tone's own
    // `-subtle` tint while pressed; `secondary`/`tertiary`/`ghost` (no
    // solid fill at rest) converge to the shared solid `bg.brand`/
    // `icon.on-brand` pairing instead, so all three read identically once
    // pressed.
    it.each([
      ["primary", "var(--dbm-bg-brand-subtle)", "var(--dbm-icon-brand)"],
      ["destructive", "var(--dbm-bg-danger-subtle)", "var(--dbm-icon-danger)"],
      ["secondary", "var(--dbm-bg-brand)", "var(--dbm-icon-on-brand)"],
      ["tertiary", "var(--dbm-bg-brand)", "var(--dbm-icon-on-brand)"],
      ["ghost", "var(--dbm-bg-brand)", "var(--dbm-icon-on-brand)"],
    ] as const)(
      "colors the %s variant's pressed state via its own token chain, not its rest/hover tokens",
      (variant, expectedBg, expectedColor) => {
        render(
          <IconButton
            icon={HeartIcon}
            aria-label="Favorite"
            variant={variant}
            defaultPressed
          />,
        );
        expect(screen.getByRole("button")).toHaveStyle({
          backgroundColor: expectedBg,
          color: expectedColor,
        });
      },
    );
  });

  describe("asChild disabled/isLoading", () => {
    it("blocks the slotted child's own click handler when disabled — the one a router's link carries (it runs before IconButton's own in the bubble phase)", () => {
      const childClick = vi.fn();
      const onClick = vi.fn();
      render(
        <IconButton icon={TrashIcon} aria-label="Delete" asChild disabled onClick={onClick}>
          <a href="/next" onClick={childClick}>×</a>
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("link", { name: "Delete" }));
      expect(childClick).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });

    it("blocks the slotted child's own click handler while loading, and does not follow the link", () => {
      const childClick = vi.fn();
      render(
        <IconButton icon={TrashIcon} aria-label="Delete" asChild isLoading>
          <a href="/next" onClick={childClick}>×</a>
        </IconButton>,
      );
      const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Delete" }));
      expect(childClick).not.toHaveBeenCalled();
      expect(notPrevented).toBe(false);
    });

    it("runs the slotted child's own handler, IconButton's onClick and a caller's onClickCapture when it is not disabled", () => {
      const calls: string[] = [];
      render(
        <IconButton icon={TrashIcon} aria-label="Delete" asChild onClick={() => calls.push("button")} onClickCapture={() => calls.push("capture")}>
          <a href="/next" onClick={() => calls.push("child")}>×</a>
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("link", { name: "Delete" }));
      expect(calls).toEqual(["capture", "child", "button"]);
    });

    it("does not run a caller's onClickCapture on a blocked click", () => {
      const onClickCapture = vi.fn();
      render(
        <IconButton icon={TrashIcon} aria-label="Delete" asChild disabled onClickCapture={onClickCapture}>
          <a href="/next">×</a>
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("link", { name: "Delete" }));
      expect(onClickCapture).not.toHaveBeenCalled();
    });

    it("applies aria-disabled and blocks the click handler on the slotted element", () => {
      const onClick = vi.fn();
      render(
        <IconButton
          asChild
          icon={TrashIcon}
          aria-label="Delete"
          disabled
          onClick={onClick}
        >
          <a href="/delete">×</a>
        </IconButton>,
      );
      const link = screen.getByRole("link", { name: "Delete" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not set aria-disabled when neither disabled nor isLoading is set", () => {
      render(
        <IconButton asChild icon={TrashIcon} aria-label="Delete">
          <a href="/delete">×</a>
        </IconButton>,
      );
      expect(screen.getByRole("link", { name: "Delete" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("never lets a same-named consumer prop override the computed aria-disabled (same ordering fix as aria-busy above)", () => {
      render(
        <IconButton
          asChild
          icon={TrashIcon}
          aria-label="Delete"
          disabled
          aria-disabled={false}
        >
          <a href="/delete">×</a>
        </IconButton>,
      );
      expect(
        screen.getByRole("link", { name: "Delete" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("dev-mode warnings", () => {
    it("warns once in development when there is no accessible name", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        // @ts-expect-error aria-label is required — testing the runtime
        // safety net for a consumer that bypasses the type (e.g. an agent
        // ignoring types, or a value that resolves to an empty string).
        <IconButton icon={TrashIcon} />,
      );
      rerender(
        // @ts-expect-error see above
        <IconButton icon={TrashIcon} size="lg" />,
      );

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("no accessible name"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when aria-label is provided", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<IconButton icon={TrashIcon} aria-label="Delete" />);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when aria-labelledby is provided instead of aria-label", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // aria-label is required by the type — aria-labelledby is a valid
      // alternative at runtime (same pair Button's own warning accepts),
      // so bypass the type via a cast rather than an inline
      // `@ts-expect-error` (which doesn't work as a JSX-children comment).
      const props = {
        icon: TrashIcon,
        "aria-labelledby": "delete-label",
      } as unknown as IconButtonProps;
      render(
        <>
          <span id="delete-label">Delete</span>
          <IconButton {...props} />
        </>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when asChild is set: the icon is drawn inside the element, or the element's own content is used", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        <IconButton asChild icon={TrashIcon} aria-label="Delete">
          <a href="/delete" aria-label="Delete" />
        </IconButton>,
      );
      rerender(
        <IconButton asChild icon={TrashIcon} aria-label="Delete" isLoading>
          <a href="/delete">Deleting</a>
        </IconButton>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when asChild is not set", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<IconButton icon={TrashIcon} aria-label="Delete" />);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("warns once in development when asChild is combined with a toggle prop (aria-pressed is withheld)", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        <IconButton asChild icon={HeartIcon} aria-label="Favorite" defaultPressed>
          <a href="/favorite">Favorite</a>
        </IconButton>,
      );
      rerender(
        <IconButton asChild icon={HeartIcon} aria-label="Favorite" defaultPressed={false}>
          <a href="/favorite">Favorite</a>
        </IconButton>,
      );

      const pressedWarnings = consoleWarnSpy.mock.calls.filter(([message]) =>
        typeof message === "string" && message.includes("aria-pressed"),
      );
      expect(pressedWarnings).toHaveLength(1);
      consoleWarnSpy.mockRestore();
    });

    it("does not warn about aria-pressed when a toggle prop is set without asChild", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <IconButton icon={HeartIcon} aria-label="Favorite" defaultPressed />,
      );

      const pressedWarnings = consoleWarnSpy.mock.calls.filter(([message]) =>
        typeof message === "string" && message.includes("aria-pressed"),
      );
      expect(pressedWarnings).toHaveLength(0);
      consoleWarnSpy.mockRestore();
    });

    it("does not warn about aria-pressed when asChild is set without a toggle prop", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <IconButton asChild icon={TrashIcon} aria-label="Delete">
          <a href="/delete">Delete</a>
        </IconButton>,
      );

      const pressedWarnings = consoleWarnSpy.mock.calls.filter(([message]) =>
        typeof message === "string" && message.includes("aria-pressed"),
      );
      expect(pressedWarnings).toHaveLength(0);
      consoleWarnSpy.mockRestore();
    });
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} icon={TrashIcon} aria-label="Delete" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards className and native button props", () => {
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        className="custom"
        data-testid="btn"
      />,
    );
    expect(screen.getByTestId("btn")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <IconButton icon={TrashIcon} aria-label="Delete item" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("tooltip", () => {
    it("shows no tooltip, and adds nothing to the DOM, unless asked", () => {
      render(<IconButton icon={TrashIcon} aria-label="Delete" />);
      expect(screen.getByRole("button", { name: "Delete" })).not.toHaveAttribute("data-state");
    });

    it("shows the aria-label on keyboard focus with tooltip, and the button keeps its name", async () => {
      const user = userEvent.setup();
      render(<IconButton icon={TrashIcon} aria-label="Delete" tooltip />);
      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Delete");
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("shows other content in place of the label, and a node too", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<IconButton icon={TrashIcon} aria-label="Delete" tooltip="Delete this item" />);
      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Delete this item");
      rerender(<IconButton icon={TrashIcon} aria-label="Delete" tooltip={<span>Delete <kbd>⌫</kbd></span>} />);
      expect((await screen.findByRole("tooltip")).querySelector("kbd")).not.toBeNull();
    });

    it.each([[false], [""], [null], [undefined]])("treats tooltip=%s as no tooltip", async (value) => {
      const user = userEvent.setup();
      render(<IconButton icon={TrashIcon} aria-label="Delete" tooltip={value} />);
      await user.tab();
      expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("keeps its ref, click handler and toggle state with a tooltip", async () => {
      const user = userEvent.setup();
      const ref = createRef<HTMLButtonElement>();
      const onClick = vi.fn();
      render(<IconButton ref={ref} icon={HeartIcon} aria-label="Favorite" tooltip defaultPressed={false} onClick={onClick} />);
      const button = screen.getByRole("button", { name: "Favorite" });
      expect(ref.current).toBe(button);
      await user.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("has no axe violations with the tooltip open", async () => {
      const user = userEvent.setup();
      const { container } = render(<IconButton icon={TrashIcon} aria-label="Delete" tooltip />);
      await user.tab();
      await screen.findByRole("tooltip");
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
