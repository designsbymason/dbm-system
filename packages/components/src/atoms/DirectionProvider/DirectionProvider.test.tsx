import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { StrictMode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DirectionProvider, useDirection } from "./DirectionProvider";
import type { Direction } from "./DirectionProvider.types";

function Probe({ own }: { own?: Direction }) {
  return <p data-testid="probe">{useDirection(own)}</p>;
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
});
