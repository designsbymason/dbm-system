import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "./Avatar";
import type { AvatarStatus } from "./Avatar.types";

const statusLabels: Record<AvatarStatus, string> = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  away: "Away",
};

describe("Avatar", () => {
  it("renders an image when src is given", () => {
    render(<Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />);
    const img = screen.getByRole("img", { name: "Jane Doe" });
    expect(img).toHaveAttribute("src", "/user.jpg");
  });

  it("renders initials when there is no src", () => {
    render(<Avatar initials="JD" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("falls back to initials when the image fails to load", () => {
    render(<Avatar src="/broken.jpg" alt="Jane Doe" initials="JD" />);
    const img = screen.getByRole("img", { name: "Jane Doe" });
    fireEvent.error(img);
    expect(screen.queryByRole("img", { name: "Jane Doe" })?.tagName).not.toBe(
      "IMG",
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("announces the accessible name on the root when showing the initials fallback", () => {
    render(<Avatar initials="JD" alt="Jane Doe" />);
    const avatar = screen.getByLabelText("Jane Doe");
    expect(avatar).toHaveAttribute("role", "img");
  });

  it("does not set role=img on the root when there's no alt to pair it with", () => {
    render(<Avatar initials="JD" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).not.toHaveAttribute("role");
  });

  it("lets an explicit non-empty aria-label override the computed name", () => {
    render(<Avatar initials="JD" alt="Jane Doe" aria-label="Custom label" />);
    expect(screen.getByRole("img", { name: "Custom label" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Jane Doe" })).not.toBeInTheDocument();
  });

  it("treats an empty aria-label as no override, falling back to the computed name", () => {
    render(<Avatar initials="JD" alt="Jane Doe" aria-label="" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveAttribute("aria-label", "Jane Doe");
  });

  it("re-attempts loading when src changes after a previous image failed", () => {
    const { rerender } = render(
      <Avatar src="/broken.jpg" alt="Jane Doe" initials="JD" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Jane Doe" }));
    expect(screen.getByText("JD")).toBeInTheDocument();

    rerender(<Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />);
    const img = screen.getByRole("img", { name: "Jane Doe" });
    expect(img).toHaveAttribute("src", "/user.jpg");
  });

  it("falls back to a generic person icon when there's no src or initials", () => {
    render(<Avatar alt="Jane Doe" data-testid="avatar" />);
    expect(
      screen.getByTestId("avatar").querySelector("svg"),
    ).toBeInTheDocument();
  });

  it("renders as a circle by default and as a square when shape=square", () => {
    // shapeSquare lives on the inner clipping element (root's first child),
    // not root itself — root stays unclipped so the status dot can sit at
    // its bounding-box corner without being cut off by the circular clip.
    const { rerender } = render(<Avatar initials="JD" data-testid="avatar" />);
    expect(
      screen.getByTestId("avatar").firstElementChild?.className,
    ).not.toMatch(/shapeSquare/);

    rerender(<Avatar initials="JD" shape="square" data-testid="avatar" />);
    expect(screen.getByTestId("avatar").firstElementChild?.className).toMatch(
      /shapeSquare/,
    );
  });

  it("applies size as token-driven CSS custom properties", () => {
    render(<Avatar initials="JD" size="xl" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveStyle({
      "--avatar-dimension-base": "var(--dbm-avatar-size-xl)",
      "--avatar-font-size-base": "var(--dbm-font-size-xl)",
      "--avatar-status-size-base": "var(--dbm-avatar-status-size-xl)",
    });
  });

  it("sets a responsive size as per-breakpoint CSS variables", () => {
    render(
      <Avatar
        initials="JD"
        size={{ base: "xs", md: "lg" }}
        data-testid="avatar"
      />,
    );
    const el = screen.getByTestId("avatar");
    expect(el.style.getPropertyValue("--avatar-dimension-base")).toBe(
      "var(--dbm-avatar-size-xs)",
    );
    expect(el.style.getPropertyValue("--avatar-dimension-md")).toBe(
      "var(--dbm-avatar-size-lg)",
    );
  });

  it("sizes the generic icon fallback off the base breakpoint when size is responsive", () => {
    render(<Avatar size={{ base: "xs", xl: "xl" }} data-testid="avatar" />);
    // fallbackIconSizeFor["xs"] -> "md" (see Avatar.tsx) — confirms the
    // `base` step, not the `xl` step, drove the choice. Icon renders its
    // size as a CSS-module class, not an attribute (see Icon.tsx).
    const svg = screen.getByTestId("avatar").querySelector("svg");
    expect(svg?.getAttribute("class")).toMatch(/sizeMd/);
    expect(svg?.getAttribute("class")).not.toMatch(/sizeXl/);
  });

  it("renders a status dot with an accessible label", () => {
    render(<Avatar initials="JD" status="online" />);
    expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();
  });

  // Regression guard for a real shipped bug: the status dot's size used to
  // be a single fixed value (--dbm-space-3, 12px) regardless of `size` —
  // at `xs`/`sm` it completely covered the initials. Every size × every
  // status combination now resolves its own size-specific status-dot
  // token; `AllSizes`/`AllStatuses`' own single-axis coverage wouldn't
  // have caught the original bug, which only showed up where both axes
  // combined.
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const statuses = ["online", "offline", "busy", "away"] as const;
  for (const size of sizes) {
    for (const status of statuses) {
      it(`resolves a size-specific status-dot token at size=${size}, status=${status}`, () => {
        render(
          <Avatar
            initials="JD"
            size={size}
            status={status}
            data-testid="avatar"
          />,
        );
        expect(screen.getByTestId("avatar")).toHaveStyle({
          "--avatar-status-size-base": `var(--dbm-avatar-status-size-${size})`,
        });
        expect(
          screen.getByRole("img", { name: statusLabels[status] }),
        ).toBeInTheDocument();
      });
    }
  }

  it("renders no status dot when status is not set", () => {
    render(<Avatar initials="JD" data-testid="avatar" />);
    expect(
      screen.getByTestId("avatar").querySelectorAll('[role="img"]'),
    ).toHaveLength(0);
  });

  it("combines alt and status into one accessible-name announcement instead of two", () => {
    render(<Avatar initials="JD" alt="Jane Doe" status="online" data-testid="avatar" />);
    const avatar = screen.getByTestId("avatar");
    // Exactly one role="img" for the whole compound widget (itself), named
    // with both pieces — the status dot inside it isn't a second stop.
    expect(avatar).toHaveAttribute("role", "img");
    expect(avatar.querySelectorAll('[role="img"]')).toHaveLength(0);
    expect(screen.getByRole("img", { name: "Jane Doe, Online" })).toBe(
      avatar,
    );
  });

  it("combines alt and status on the <img> itself in image mode", () => {
    render(<Avatar src="/user.jpg" alt="Jane Doe" status="busy" />);
    expect(
      screen.getByRole("img", { name: "Jane Doe, Busy" }),
    ).toHaveAttribute("src", "/user.jpg");
  });

  it("keeps the status dot as its own announcement when there's no alt to merge it into", () => {
    render(<Avatar initials="JD" status="online" data-testid="avatar" />);
    // Root itself has no computed name here (no alt), so the dot can't be
    // folded into it — it must keep announcing itself, same as before
    // status/alt merging existed.
    expect(screen.getByTestId("avatar")).not.toHaveAttribute("role");
    expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();
  });

  // Ordered before the two "warns once" tests below on purpose: their
  // `rerender()` calls leave a pending update that (empirically, in this
  // React/RTL/jsdom combination) can flush past the point where their own
  // `mockRestore()` runs, landing on whichever spy is active next — this
  // test's fresh `not.toHaveBeenCalled()` assertion is exactly the kind of
  // check that stray call would break. Running it first sidesteps the
  // ordering hazard rather than chasing the scheduling quirk itself.
  it("does not warn when initials, alt, or a valid src+alt pair is provided", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    render(<Avatar initials="JD" />);
    render(<Avatar alt="Jane Doe" />);
    render(<Avatar src="/user.jpg" alt="Jane Doe" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when src is given without alt", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const { rerender } = render(<Avatar src="/user.jpg" />);
    rerender(<Avatar src="/user.jpg" initials="JD" />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("`src` was provided without `alt`"));
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when there's no src, initials, name, or alt at all", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const { rerender } = render(<Avatar />);
    rerender(<Avatar status="online" />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no `src`, `initials`, `name`, or `alt`"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("auto-derives initials from name when initials isn't explicitly set", () => {
    render(<Avatar name="Jane Doe" data-testid="avatar" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("takes just the first letter for a single-word name", () => {
    render(<Avatar name="Cher" data-testid="avatar" />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("prefers explicit initials over ones derived from name", () => {
    render(<Avatar name="Jane Doe" initials="XY" />);
    expect(screen.getByText("XY")).toBeInTheDocument();
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });

  it("falls back to name as the accessible name when alt isn't set", () => {
    render(<Avatar name="Jane Doe" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveAttribute(
      "aria-label",
      "Jane Doe",
    );
  });

  it("derives a deterministic color class from identity when colorful is set", () => {
    const { container: a } = render(
      <Avatar name="Jane Doe" colorful initials="JD" />,
    );
    const { container: b } = render(
      <Avatar name="Jane Doe" colorful initials="JD" />,
    );
    // Same identity, same avatar every time.
    expect(a.firstElementChild?.firstElementChild?.className).toBe(
      b.firstElementChild?.firstElementChild?.className,
    );
  });

  it("does not apply a colorful color class when colorful is not set", () => {
    const { container } = render(<Avatar name="Jane Doe" initials="JD" />);
    expect(container.firstElementChild?.firstElementChild?.className).not.toMatch(
      /_color[A-Z]/,
    );
  });

  it("still derives a colorful color class when name is an explicit empty string, falling through to alt", () => {
    // Regression test: identity used to be `name ?? alt ?? initials` — an
    // explicit `name=""` (not omitted) is non-nullish, so `??` stopped
    // there instead of falling through to `alt`, silently disabling
    // `colorful`. Real-world trigger: Storybook's own `args.name` default
    // is `""` (kept non-nullish so the `name` control stays interactive),
    // which several Avatar stories spread onto every rendered instance.
    const { container } = render(
      <Avatar name="" alt="Jane Doe" initials="JD" colorful />,
    );
    expect(container.firstElementChild?.firstElementChild?.className).toMatch(
      /_color[A-Z]/,
    );
  });

  it("fires onError when the image fails to load, alongside the internal fallback", () => {
    const onError = vi.fn();
    render(
      <Avatar src="/broken.jpg" alt="Jane Doe" initials="JD" onError={onError} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Jane Doe" }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("passes loading through to the underlying img", () => {
    render(<Avatar src="/user.jpg" alt="Jane Doe" loading="lazy" />);
    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
      "loading",
      "lazy",
    );
  });

  it("forwards ref to the underlying span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} initials="JD" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("renders as a different element via `as`, keeping its own generated content", () => {
    const onClick = vi.fn();
    render(
      <Avatar
        as="button"
        initials="JD"
        alt="Jane Doe"
        onClick={onClick}
        data-testid="avatar"
      />,
    );
    const avatar = screen.getByTestId("avatar");
    expect(avatar.tagName).toBe("BUTTON");
    // Own content (initials) still renders — unlike Radix Slot-style
    // asChild, `as` doesn't hand rendering over to consumer-supplied
    // children.
    expect(screen.getByText("JD")).toBeInTheDocument();
    fireEvent.click(avatar);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not override a custom `as` element's native role with role=img", () => {
    // Regression guard: `role="img"` on a real <button> is an
    // "aria-allowed-role" violation (confirmed via a live axe run) — a
    // native interactive element's own role must win. `aria-label` should
    // still apply, since it's valid on any element.
    render(
      <Avatar as="button" initials="JD" alt="Jane Doe" data-testid="avatar" />,
    );
    const avatar = screen.getByTestId("avatar");
    expect(avatar).not.toHaveAttribute("role");
    // the initials it shows are in its name (WCAG 2.5.3), after the person's
    expect(avatar).toHaveAttribute("aria-label", "Jane Doe, JD");
  });

  describe("an interactive avatar's name holds the initials it shows", () => {
    it("adds the initials after the name, and before a status", () => {
      render(<Avatar as="button" name="Jane Doe" status="online" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("aria-label", "Jane Doe, JD, Online");
    });

    it("leaves a name you pass as written", () => {
      render(<Avatar as="button" name="Jane Doe" aria-label="Open profile" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("aria-label", "Open profile");
    });

    it("adds nothing when an image is shown, since the button shows no text", () => {
      render(<Avatar as="button" name="Jane Doe" src="/jane.png" data-testid="avatar" />);
      // the image's own alt names the button, with no initials added
      expect(screen.getByRole("img", { name: "Jane Doe" })).toBeInTheDocument();
      expect(screen.getByTestId("avatar")).not.toHaveAttribute("aria-label");
    });

    it("adds nothing for a plain avatar, which is an image and not a control", () => {
      render(<Avatar name="Jane Doe" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("aria-label", "Jane Doe");
    });

    it("adds nothing when the initials are all the name there is: they are read as they are", () => {
      render(<Avatar as="button" initials="JD" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).not.toHaveAttribute("aria-label");
      expect(screen.getByRole("button", { name: "JD" })).toBeInTheDocument();
    });
  });

  it("has no accessibility violations when rendered as a button", async () => {
    const { container } = render(
      <Avatar
        as="button"
        initials="JD"
        alt="Jane Doe"
        status="online"
        onClick={() => {}}
      />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("does not fire onClick on the default, non-interactive span, even when provided (found in review — the underlying span was wiring it unconditionally, clickable by mouse with no keyboard equivalent and role='img', a real WCAG 2.1.1 gap)", () => {
    const onClick = vi.fn();
    render(<Avatar initials="JD" onClick={onClick} data-testid="avatar" />);
    const avatar = screen.getByTestId("avatar");
    fireEvent.click(avatar);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("warns once in development when onClick is provided without an interactive `as`", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onClick = vi.fn();
    const { rerender } = render(<Avatar initials="JD" onClick={onClick} />);
    rerender(<Avatar initials="AB" onClick={onClick} />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`onClick` has no effect"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn about onClick when as='button' makes it interactive", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Avatar as="button" initials="JD" onClick={() => {}} />);

    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("`onClick` has no effect"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("applies native disabled and blocks clicks when as='button'", () => {
    const onClick = vi.fn();
    render(
      <Avatar
        as="button"
        initials="JD"
        disabled
        onClick={onClick}
        data-testid="avatar"
      />,
    );
    const avatar = screen.getByTestId("avatar");
    expect(avatar).toBeDisabled();
    expect(avatar).toHaveAttribute("aria-disabled", "true");
    // A disabled native button doesn't dispatch click events at all —
    // confirms the browser itself blocks it, not just the handler.
    fireEvent.click(avatar);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("uses aria-disabled plus a blocked handler when as isn't a native button", () => {
    const onClick = vi.fn();
    render(
      <Avatar
        as="a"
        href="/profile"
        initials="JD"
        disabled
        onClick={onClick}
        data-testid="avatar"
      />,
    );
    const avatar = screen.getByTestId("avatar");
    expect(avatar).not.toHaveAttribute("disabled");
    expect(avatar).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(avatar);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ignores disabled on the default, non-interactive span", () => {
    render(<Avatar initials="JD" disabled data-testid="avatar" />);
    const avatar = screen.getByTestId("avatar");
    expect(avatar).not.toHaveAttribute("disabled");
    expect(avatar).not.toHaveAttribute("aria-disabled");
  });

  it("fires onClick normally when not disabled", () => {
    const onClick = vi.fn();
    render(
      <Avatar as="button" initials="JD" onClick={onClick} data-testid="avatar" />,
    );
    fireEvent.click(screen.getByTestId("avatar"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards className and native props", () => {
    render(<Avatar initials="JD" className="custom" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveClass("custom");
  });

  describe("what the avatar computes can't be replaced by a prop (06 §9)", () => {
    it("keeps role=img and the name over a same-named role", () => {
      render(<Avatar alt="Jane Doe" role="presentation" data-testid="avatar" />);
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toHaveAttribute("role", "img");
      expect(avatar).toHaveAttribute("aria-label", "Jane Doe");
    });

    it("keeps a disabled link avatar disabled over aria-disabled={false}", () => {
      render(<Avatar as="a" href="#top" alt="Jane Doe" disabled aria-disabled={false} data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps a disabled button avatar natively disabled", () => {
      render(<Avatar as="button" alt="Jane Doe" disabled data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toBeDisabled();
    });

    it("lets a plain avatar with no name take a role from the caller", () => {
      render(<Avatar initials="JD" role="status" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("role", "status");
    });

    it("lets an avatar that is not disabled take an aria-disabled from the caller", () => {
      render(<Avatar initials="JD" aria-disabled="true" data-testid="avatar" />);
      expect(screen.getByTestId("avatar")).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("has no accessibility violations, with an image, initials, or the icon fallback", async () => {
    const { container, rerender } = render(
      <Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Avatar initials="JD" alt="Jane Doe" status="busy" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Avatar alt="Jane Doe" shape="square" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
