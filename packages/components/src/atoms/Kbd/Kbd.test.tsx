import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders a native kbd element", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc").tagName).toBe("KBD");
  });

  it("applies the monospace font family token", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-mono)",
    });
  });

  it("forwards ref to the native kbd element", () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref}>Esc</Kbd>);
    expect(ref.current?.tagName).toBe("KBD");
  });

  it("applies className", () => {
    render(<Kbd className="custom">Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveClass("custom");
  });

  it("applies style", () => {
    render(<Kbd style={{ fontWeight: 700 }}>Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveStyle({ fontWeight: "700" });
  });

  it("applies id and data-testid", () => {
    render(
      <Kbd id="my-kbd" data-testid="kbd-1">
        Esc
      </Kbd>,
    );
    const el = screen.getByTestId("kbd-1");
    expect(el.id).toBe("my-kbd");
    expect(el.tagName).toBe("KBD");
  });

  it("applies aria-label for symbol-only content", () => {
    render(<Kbd aria-label="Command">⌘</Kbd>);
    expect(screen.getByLabelText("Command")).toHaveTextContent("⌘");
  });

  it("supports composing multiple Kbd for a chord", () => {
    render(
      <span>
        <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
      </span>,
    );
    expect(screen.getByText("⌘").tagName).toBe("KBD");
    expect(screen.getByText("K").tagName).toBe("KBD");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("keys", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("draws a combination written with mod for the platform, one keycap per key", () => {
      const { container } = render(<Kbd keys="mod+shift+p" />);
      expect(screen.getByLabelText("Ctrl Shift P")).toBeInTheDocument();
      expect(
        [...container.querySelectorAll("kbd kbd")].map(
          (key) => key.textContent,
        ),
      ).toEqual(["Ctrl", "Shift", "P"]);
      expect(container.textContent).toBe("Ctrl+Shift+P");
    });

    it("uses the command symbols, without plus signs, on an Apple platform, and names them", () => {
      vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel" });
      const { container } = render(<Kbd keys="mod+shift+p" />);
      expect(
        [...container.querySelectorAll("kbd kbd")].map(
          (key) => key.textContent,
        ),
      ).toEqual(["⌘", "⇧", "P"]);
      expect(container.textContent).toBe("⌘⇧P");
      expect(screen.getByLabelText("Command Shift P")).toBeInTheDocument();
    });

    it("takes an array of keys, and draws text it does not know as written", () => {
      const { container } = render(<Kbd keys={["mod", "K"]} />);
      expect(container.textContent).toBe("Ctrl+K");
      const other = render(<Kbd keys="F8" />);
      expect(other.container.textContent).toBe("F8");
    });

    it("keeps the keycaps out of the accessibility tree, and the name on the group", () => {
      const { container } = render(<Kbd keys="mod+k" />);
      expect(
        [...container.querySelectorAll("kbd kbd")].every(
          (key) => key.getAttribute("aria-hidden") === "true",
        ),
      ).toBe(true);
      expect(container.querySelector("kbd")).toHaveAttribute(
        "aria-label",
        "Ctrl K",
      );
    });

    it("lets aria-label replace the name, and passes ref, className and data-testid to the group", () => {
      const ref = createRef<HTMLElement>();
      render(
        <Kbd
          keys="mod+k"
          aria-label="Open search"
          className="custom"
          data-testid="chord"
          ref={ref}
        />,
      );
      const group = screen.getByTestId("chord");
      expect(group).toHaveAttribute("aria-label", "Open search");
      expect(group).toHaveClass("custom");
      expect(ref.current).toBe(group);
    });

    it("ignores children, and warns, when both are given", () => {
      const warn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const { container } = render(<Kbd keys="mod+j">Ignored</Kbd>);
      expect(container.textContent).toBe("Ctrl+J");
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("`keys` and `children`"),
      );
    });

    it("treats empty keys as not given", () => {
      render(<Kbd keys="">Esc</Kbd>);
      expect(screen.getByText("Esc").tagName).toBe("KBD");
    });

    it("has no accessibility violations", async () => {
      const { container } = render(<Kbd keys="mod+shift+p" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
