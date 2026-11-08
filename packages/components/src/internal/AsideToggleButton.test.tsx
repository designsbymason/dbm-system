import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { AsideToggleButton } from "./AsideToggleButton";

describe("AsideToggleButton", () => {
  function setup(props: Partial<React.ComponentProps<typeof AsideToggleButton>> = {}) {
    const toggleRef = { current: null as HTMLElement | null };
    const onAsideOpen = vi.fn();
    const utils = render(<AsideToggleButton asideOpen={false} onAsideOpen={onAsideOpen} toggleRef={toggleRef} {...props} />);
    return { toggleRef, onAsideOpen, ...utils };
  }

  it("is a named button that says it opens a dialog, and whether it is open", async () => {
    const { rerender, container, toggleRef, onAsideOpen } = setup();
    const button = screen.getByRole("button", { name: "Show details" });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
    rerender(<AsideToggleButton asideOpen onAsideOpen={onAsideOpen} toggleRef={toggleRef} />);
    expect(screen.getByRole("button", { name: "Show details" })).toHaveAttribute("aria-expanded", "true");
  });

  it("asks for the drawer and records itself as the button that opened it, unless a handler cancels the press", async () => {
    const user = userEvent.setup();
    const { toggleRef, onAsideOpen } = setup();
    await user.click(screen.getByRole("button"));
    expect(onAsideOpen).toHaveBeenCalledTimes(1);
    expect(toggleRef.current).toBe(screen.getByRole("button"));
    const cancelled = vi.fn();
    const second = setup({ onClick: (event) => event.preventDefault(), onAsideOpen: cancelled });
    await user.click(screen.getAllByRole("button")[1] as HTMLElement);
    expect(cancelled).not.toHaveBeenCalled();
    second.unmount();
  });

  it("takes its words from labels and keeps the default for a value passed as undefined, and a name of its own wins", () => {
    const { rerender, onAsideOpen, toggleRef } = setup({ labels: { open: "Ouvrir" } });
    expect(screen.getByRole("button", { name: "Ouvrir" })).toBeInTheDocument();
    rerender(<AsideToggleButton asideOpen={false} onAsideOpen={onAsideOpen} toggleRef={toggleRef} labels={{ open: undefined }} />);
    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    rerender(<AsideToggleButton asideOpen={false} onAsideOpen={onAsideOpen} toggleRef={toggleRef} aria-label="Filters" />);
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  });

  it("forwards a ref to the button", () => {
    const ref = createRef<HTMLButtonElement>();
    setup({ ref });
    expect(ref.current).toBe(screen.getByRole("button"));
  });
});
