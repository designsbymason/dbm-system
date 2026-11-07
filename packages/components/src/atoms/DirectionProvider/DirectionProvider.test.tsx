import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { StrictMode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useProvidedDirection } from "../../internal/useProvidedDirection";
import { DirectionProvider, useDirection } from "./DirectionProvider";
import type { Direction } from "./DirectionProvider.types";

function Probe({ own }: { own?: Direction }) {
  return <p data-testid="probe">{useDirection(own)}</p>;
}

function Provided() {
  const dir = useProvidedDirection();
  return <p data-testid="provided">{dir ?? "none"}</p>;
}

describe("DirectionProvider", () => {
  it("is left to right where there is no provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("ltr");
  });

  it("gives everything inside it its direction", () => {
    render(
      <DirectionProvider dir="rtl">
        <div>
          <Probe />
        </div>
      </DirectionProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("rtl");
  });

  it("lets a component's own dir win over the provider's", () => {
    render(
      <DirectionProvider dir="rtl">
        <Probe own="ltr" />
      </DirectionProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("ltr");
  });

  it("lets the nearest provider win, and the outer one come back outside it", () => {
    render(
      <DirectionProvider dir="rtl">
        <DirectionProvider dir="ltr">
          <Probe />
        </DirectionProvider>
        <p data-testid="outside">
          <Probe />
        </p>
      </DirectionProvider>,
    );
    expect(screen.getAllByTestId("probe")[0]).toHaveTextContent("ltr");
    expect(screen.getAllByTestId("probe")[1]).toHaveTextContent("rtl");
  });

  it("changes when the provider's direction changes", () => {
    const { rerender } = render(
      <DirectionProvider dir="ltr">
        <Probe />
      </DirectionProvider>,
    );
    rerender(
      <DirectionProvider dir="rtl">
        <Probe />
      </DirectionProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("rtl");
  });

  it("renders no element of its own, on the server too", () => {
    const html = renderToStaticMarkup(
      <DirectionProvider dir="rtl">
        <Probe />
      </DirectionProvider>,
    );
    expect(html).toBe("<p data-testid=\"probe\">rtl</p>");
  });

  it("holds under StrictMode", () => {
    render(
      <StrictMode>
        <DirectionProvider dir="rtl">
          <Probe />
        </DirectionProvider>
      </StrictMode>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("rtl");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DirectionProvider dir="rtl">
        <Probe />
      </DirectionProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("useProvidedDirection", () => {
    it("is undefined outside a provider, so a part can leave its dir attribute off", () => {
      render(<Provided />);
      expect(screen.getByTestId("provided")).toHaveTextContent("none");
    });

    it("is the nearest provider's direction, and the outer one again outside the inner", () => {
      render(
        <DirectionProvider dir="rtl">
          <DirectionProvider dir="ltr">
            <Provided />
          </DirectionProvider>
          <Provided />
        </DirectionProvider>,
      );
      const [inner, outer] = screen.getAllByTestId("provided");
      expect(inner).toHaveTextContent("ltr");
      expect(outer).toHaveTextContent("rtl");
    });
  });

  describe("an invalid dir", () => {
    it("is refused with a development warning and read as left to right", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      // A value from untyped configuration: the type says no, the runtime still has to cope.
      const bad = "RTL-from-config" as unknown as Direction;
      render(
        <DirectionProvider dir={bad}>
          <Probe />
          <Provided />
        </DirectionProvider>,
      );
      expect(screen.getByTestId("probe")).toHaveTextContent("ltr");
      expect(screen.getByTestId("provided")).toHaveTextContent("ltr");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('"RTL-from-config"');
      warn.mockRestore();
    });

    it("warns once for the same value, not on every render", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const bad = "sideways-once" as unknown as Direction;
      const { rerender } = render(<DirectionProvider dir={bad}>x</DirectionProvider>);
      rerender(<DirectionProvider dir={bad}>y</DirectionProvider>);
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });
});
