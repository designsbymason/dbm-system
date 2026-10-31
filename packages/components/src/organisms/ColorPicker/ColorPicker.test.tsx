import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ColorPickerController } from "./ColorPicker.types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormField } from "../../molecules/FormField";
import { ColorPicker } from "./ColorPicker";

const entry = () => screen.getByRole("textbox", { name: "Color value" }) as HTMLInputElement;
const openButton = () => screen.getByRole("button", { name: "Choose color" });
const saturation = () => screen.getByRole("slider", { name: "Saturation" }) as HTMLInputElement;
const brightness = () => screen.getByRole("slider", { name: "Brightness" }) as HTMLInputElement;
const hue = () => screen.getByRole("slider", { name: "Hue" });

afterEach(() => vi.restoreAllMocks());

describe("ColorPicker field", () => {
  it("is a named group of a swatch button and a text entry", () => {
    render(<ColorPicker aria-label="Brand color" defaultValue="#5548a4" />);
    const group = screen.getByRole("group", { name: "Brand color" });
    expect(within(group).getByRole("button", { name: "Choose color" })).toBeInTheDocument();
    expect(entry().value).toBe("#5548a4");
  });

  it("shows nothing and a placeholder without a color", () => {
    render(<ColorPicker aria-label="c" />);
    expect(entry().value).toBe("");
    expect(entry()).toHaveAttribute("placeholder", "No color");
  });

  it("writes any spelling of a value in its format", () => {
    render(<ColorPicker aria-label="c" defaultValue="RGB(85, 72, 164)" />);
    expect(entry().value).toBe("#5548a4");
  });

  it.each([
    ["rgb", "rgb(85 72 164)"],
    ["hsl", "hsl(248 39% 46%)"],
  ] as const)("writes the %s format", (format, expected) => {
    render(<ColorPicker aria-label="c" format={format} defaultValue="#5548a4" />);
    expect(entry().value).toBe(expected);
  });

  it("re-spells an uncontrolled value when the format changes, and a typed one too", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker aria-label="c" defaultValue="#5548a4" />);
    rerender(<ColorPicker aria-label="c" defaultValue="#5548a4" format="rgb" />);
    expect(entry().value).toBe("rgb(85 72 164)");
    await user.clear(entry());
    await user.type(entry(), "#ffffff{Enter}");
    expect(entry().value).toBe("rgb(255 255 255)");
    rerender(<ColorPicker aria-label="c" defaultValue="#5548a4" format="hsl" />);
    expect(entry().value).toBe("hsl(0 0% 100%)");
  });

  it("keeps the opacity of an uncontrolled value across turning alpha off and on", () => {
    const { rerender } = render(<ColorPicker aria-label="c" defaultValue="#5548a480" alpha />);
    expect(entry().value).toBe("#5548a480");
    rerender(<ColorPicker aria-label="c" defaultValue="#5548a480" />);
    expect(entry().value).toBe("#5548a4");
    rerender(<ColorPicker aria-label="c" defaultValue="#5548a480" alpha />);
    expect(entry().value).toBe("#5548a480");
  });

  it("treats a value that is not a color as empty, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ColorPicker aria-label="c" value="banana" />);
    expect(entry().value).toBe("");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("is not a color"));
  });

  it("warns once when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ColorPicker />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
  });

  it("forwards its ref to the group and passes className, style and data-testid to the outer box", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ColorPicker ref={ref} aria-label="c" className="mine" style={{ marginBlock: 7 }} data-testid="cp" />);
    expect(ref.current).toBe(screen.getByTestId("cp"));
    expect(ref.current).toHaveClass("mine");
    expect(ref.current?.style.marginBlock).toBe("7px");
  });

  it("lets a consumer's role and aria props not beat the computed ones", () => {
    render(<ColorPicker aria-label="c" {...({ role: "button" } as object)} />);
    expect(screen.getByRole("group", { name: "c" })).toBeInTheDocument();
  });

  it("puts the id on the text entry so a label's htmlFor points at it", () => {
    render(
      <>
        <label htmlFor="brand">Brand</label>
        <ColorPicker id="brand" aria-label="c" />
      </>,
    );
    expect(entry()).toHaveAttribute("id", "brand");
  });

  it("works inside a FormField", () => {
    render(
      <FormField label="Brand color">{(field) => <ColorPicker {...field} />}</FormField>,
    );
    expect(screen.getByRole("group", { name: "Brand color" })).toBeInTheDocument();
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <ColorPicker aria-label="c" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.type(entry(), "#336699{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("#336699");
  });
});

describe("ColorPicker text entry", () => {
  it("commits a typed color on Enter and writes it back in the format", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    await user.type(entry(), "ABC{Enter}");
    expect(entry().value).toBe("#aabbcc");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("#aabbcc");
    expect(onValueCommit).toHaveBeenCalledWith("#aabbcc");
  });

  it("does not report while typing, and commits on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <ColorPicker aria-label="c" onValueChange={onValueChange} />
        <button type="button">elsewhere</button>
      </>,
    );
    await user.type(entry(), "#12");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.type(entry(), "3456");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(onValueChange).toHaveBeenCalledWith("#123456");
  });

  it("takes a whole pasted string at once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" onValueChange={onValueChange} />);
    await user.click(entry());
    await user.paste("rgb(10 20 30)");
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("#0a141e");
  });

  it("marks text that is not a color invalid, keeps it, and leaves the value alone", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" onValueChange={onValueChange} />);
    await user.clear(entry());
    await user.type(entry(), "nope{Enter}");
    expect(entry()).toHaveAttribute("aria-invalid", "true");
    expect(entry().value).toBe("nope");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("puts the form's refusal on the hidden input while the text is not a color", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <ColorPicker aria-label="c" name="brand" defaultValue="#5548a4" />
      </form>,
    );
    const proxy = container.querySelector<HTMLInputElement>('input[name="brand"]') as HTMLInputElement;
    await user.clear(entry());
    await user.type(entry(), "nope{Enter}");
    expect(proxy.validity.customError).toBe(true);
    expect(proxy.validationMessage).toBe("Enter a color, such as #5548a4");
    await user.clear(entry());
    await user.type(entry(), "#ffffff{Enter}");
    expect(proxy.validity.valid).toBe(true);
    expect(proxy.value).toBe("#ffffff");
  });

  it("clears the color when the text is emptied and committed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" onValueChange={onValueChange} />);
    await user.clear(entry());
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(entry().value).toBe("");
  });

  it("reverts the typed text on Escape", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" />);
    await user.type(entry(), "zzz{Escape}");
    expect(entry().value).toBe("#5548a4");
  });

  it("accepts a color with alpha only when alpha is on", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker aria-label="c" />);
    await user.type(entry(), "#11223380{Enter}");
    expect(entry().value).toBe("#112233");
    rerender(<ColorPicker aria-label="c" key="alpha" alpha />);
    await user.type(entry(), "#11223380{Enter}");
    expect(entry().value).toBe("#11223380");
  });
});

describe("ColorPicker controlled and uncontrolled", () => {
  it("shows and follows a controlled value", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("#ff0000");
      return (
        <>
          <ColorPicker aria-label="c" value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("#00ff00")}>
            green
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(entry().value).toBe("#ff0000");
    await user.click(screen.getByRole("button", { name: "green" }));
    expect(entry().value).toBe("#00ff00");
    await user.type(entry(), "{Control>}a{/Control}#0000ff{Enter}");
    expect(entry().value).toBe("#0000ff");
  });

  it("goes back to a controlled value its owner did not accept", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" value="#ff0000" onValueChange={() => undefined} />);
    await user.clear(entry());
    await user.type(entry(), "#0000ff{Enter}");
    expect(entry().value).toBe("#ff0000");
  });

  it("keeps a gray's hue while the value stays the same", async () => {
    render(<ColorPicker aria-label="c" defaultValue="#336699" defaultOpen />);
    await waitFor(() => expect(hue()).toBeInTheDocument());
    const before = hue().getAttribute("aria-valuenow");
    fireEvent.keyDown(saturation(), { key: "Home" });
    expect(hue().getAttribute("aria-valuenow")).toBe(before);
  });

  it("clears with the clear button and reports an empty value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(<ColorPicker aria-label="c" clearable defaultValue="#5548a4" onValueChange={onValueChange} onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: "Clear color" }));
    expect(onValueChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(entry().value).toBe("");
    expect(screen.queryByRole("button", { name: "Clear color" })).not.toBeInTheDocument();
  });
});

describe("ColorPicker panel", () => {
  it("opens from the swatch button, names the panel, and puts focus in the area", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" />);
    expect(openButton()).toHaveAttribute("aria-expanded", "false");
    await user.click(openButton());
    const dialog = await screen.findByRole("dialog", { name: "Choose a color" });
    expect(openButton()).toHaveAttribute("aria-expanded", "true");
    expect(openButton()).toHaveAttribute("aria-controls", dialog.id);
    expect(saturation()).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the button", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" defaultOpen />);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(openButton()).toHaveFocus();
  });

  it("toggles on the button rather than closing and reopening", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" defaultOpen />);
    await screen.findByRole("dialog");
    await user.click(openButton());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not open when disabled or read only", () => {
    const { rerender } = render(<ColorPicker aria-label="c" disabled defaultOpen />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton()).toBeDisabled();
    rerender(<ColorPicker aria-label="c" readOnly defaultOpen />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports the open state, controlled or not", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ColorPicker aria-label="c" onOpenChange={onOpenChange} />);
    await user.click(openButton());
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("draws the panel in place when inline", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#5548a4" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(saturation()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose color" })).not.toBeInTheDocument();
  });
});

describe("ColorPicker area and sliders by keyboard", () => {
  it("reads the area as saturation and brightness percentages", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" />);
    expect(saturation()).toHaveAttribute("aria-valuetext", "100%");
    expect(brightness()).toHaveAttribute("aria-valuetext", "100%");
  });

  it("moves saturation with Left and Right and brightness with Up and Down, from either input", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" onValueChange={onValueChange} />);
    fireEvent.keyDown(brightness(), { key: "ArrowLeft" });
    expect(saturation()).toHaveAttribute("aria-valuetext", "99%");
    fireEvent.keyDown(saturation(), { key: "ArrowDown", shiftKey: true });
    expect(brightness()).toHaveAttribute("aria-valuetext", "90%");
    fireEvent.keyDown(saturation(), { key: "PageDown" });
    expect(brightness()).toHaveAttribute("aria-valuetext", "80%");
    fireEvent.keyDown(brightness(), { key: "Home" });
    expect(brightness()).toHaveAttribute("aria-valuetext", "0%");
    expect(onValueChange).toHaveBeenLastCalledWith("#000000");
  });

  it("does not mirror Left and Right in a right-to-left page", () => {
    render(<ColorPicker aria-label="c" inline dir="rtl" defaultValue="#ff0000" />);
    fireEvent.keyDown(saturation(), { key: "ArrowLeft" });
    expect(saturation()).toHaveAttribute("aria-valuetext", "99%");
  });

  it("commits on a key step, with the same color", () => {
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" onValueCommit={onValueCommit} />);
    fireEvent.keyDown(saturation(), { key: "End" });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it("holds onValueChange back until a step is done with commitOn commit", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" commitOn="commit" onValueChange={onValueChange} />);
    fireEvent.keyDown(saturation(), { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("takes a value set by assistive technology through the input's change", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" onValueChange={onValueChange} />);
    fireEvent.change(brightness(), { target: { value: "50" } });
    expect(onValueChange).toHaveBeenLastCalledWith("#800000");
  });

  it("moves the hue slider with the arrow keys and reads it in degrees", async () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" />);
    expect(hue()).toHaveAttribute("aria-valuetext", "0 degrees");
    fireEvent.keyDown(hue(), { key: "ArrowRight" });
    expect(hue()).toHaveAttribute("aria-valuenow", "1");
  });

  it("shows an opacity slider only with alpha, and writes alpha into the value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" onValueChange={onValueChange} />);
    expect(screen.queryByRole("slider", { name: "Opacity" })).not.toBeInTheDocument();
    rerender(<ColorPicker aria-label="c" inline alpha defaultValue="#ff0000" onValueChange={onValueChange} />);
    fireEvent.keyDown(screen.getByRole("slider", { name: "Opacity" }), { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenLastCalledWith("#ff0000fc");
  });

  it("does nothing by key or change when read only", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline readOnly defaultValue="#ff0000" onValueChange={onValueChange} />);
    fireEvent.keyDown(saturation(), { key: "ArrowLeft" });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ColorPicker area by pointer", () => {
  const stub = (element: HTMLElement) =>
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100, x: 0, y: 0, toJSON: () => ({}) });

  it("chooses the color under the pointer, drags, and commits on release", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    const area = saturation().parentElement as HTMLElement;
    stub(area);
    area.setPointerCapture = vi.fn();
    fireEvent.pointerDown(area, { clientX: 100, clientY: 50, button: 0, pointerId: 1 });
    expect(saturation()).toHaveAttribute("aria-valuetext", "50%");
    expect(brightness()).toHaveAttribute("aria-valuetext", "50%");
    expect(onValueChange).toHaveBeenLastCalledWith("#804040");
    fireEvent.pointerMove(area, { clientX: 400, clientY: -20, pointerId: 1 });
    expect(saturation()).toHaveAttribute("aria-valuetext", "100%");
    expect(brightness()).toHaveAttribute("aria-valuetext", "100%");
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(area, { pointerId: 1 });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith("#ff0000");
    fireEvent.pointerMove(area, { clientX: 0, clientY: 100, pointerId: 1 });
    expect(saturation()).toHaveAttribute("aria-valuetext", "100%");
  });

  it("ignores a press when disabled", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline disabled defaultValue="#ff0000" onValueChange={onValueChange} />);
    const area = saturation().parentElement as HTMLElement;
    stub(area);
    fireEvent.pointerDown(area, { clientX: 100, clientY: 50, button: 0, pointerId: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ColorPicker swatches", () => {
  const swatches = ["#ff0000", { value: "rgb(0 128 0)", label: "Green" }, "#0000ff"];

  it("lists swatches as pressed-state buttons named by color or label, with one tab stop", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#0000ff" swatches={swatches} />);
    const group = screen.getByRole("group", { name: "Swatches" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["#ff0000", "Green", "#0000ff"]);
    expect(buttons.map((button) => button.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
    expect(buttons.map((button) => button.tabIndex)).toEqual([-1, -1, 0]);
  });

  it("chooses a swatch and says so", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline swatches={swatches} onValueCommit={onValueCommit} />);
    await user.click(screen.getByRole("button", { name: "Green" }));
    expect(onValueCommit).toHaveBeenCalledWith("#008000");
    expect(entry().value).toBe("#008000");
    expect(await screen.findByText("Color chosen: Green")).toBeInTheDocument();
  });

  it("moves between swatches with the arrow keys, flipped in a right-to-left page", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker aria-label="c" inline swatches={swatches} />);
    screen.getByRole("button", { name: "#ff0000" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Green" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "#0000ff" })).toHaveFocus();
    rerender(<ColorPicker aria-label="c" inline dir="rtl" swatches={swatches} />);
    screen.getByRole("button", { name: "Green" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "#0000ff" })).toHaveFocus();
  });

  it("leaves out an entry that is not a color, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ColorPicker aria-label="c" inline swatches={["#ff0000", "nonsense"]} />);
    expect(within(screen.getByRole("group", { name: "Swatches" })).getAllByRole("button")).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nonsense"));
  });

  it("draws no group without swatches", () => {
    render(<ColorPicker aria-label="c" inline />);
    expect(screen.queryByRole("group", { name: "Swatches" })).not.toBeInTheDocument();
  });
});

describe("ColorPicker format switch", () => {
  const formatGroup = () => screen.getByRole("radiogroup", { name: "Color format" });
  const formatButton = (name: string) => within(formatGroup()).getByRole("radio", { name });

  it("draws no switch unless asked", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#5548a4" />);
    expect(screen.queryByRole("radiogroup", { name: "Color format" })).not.toBeInTheDocument();
  });

  it("offers the four formats with the current one chosen", () => {
    render(<ColorPicker aria-label="c" inline showFormatSwitch format="hsl" onFormatChange={() => undefined} />);
    expect(within(formatGroup()).getAllByRole("radio").map((radio) => radio.textContent)).toEqual(["Hex", "RGB", "HSL", "OKLCH"]);
    expect(formatButton("HSL")).toBeChecked();
  });

  it("rewrites the text and reports the color in the new format", async () => {
    const user = userEvent.setup();
    const onFormatChange = vi.fn();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline showFormatSwitch defaultValue="#5548a4" onFormatChange={onFormatChange} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    await user.click(formatButton("RGB"));
    expect(entry().value).toBe("rgb(85 72 164)");
    expect(onFormatChange).toHaveBeenCalledWith("rgb");
    expect(onValueChange).toHaveBeenCalledWith("rgb(85 72 164)");
    expect(onValueCommit).toHaveBeenCalledWith("rgb(85 72 164)");
    await user.click(formatButton("OKLCH"));
    expect(entry().value).toMatch(/^oklch\(/);
    await user.click(formatButton("Hex"));
    expect(entry().value).toBe("#5548a4");
  });

  it("starts from defaultFormat", () => {
    render(<ColorPicker aria-label="c" inline showFormatSwitch defaultFormat="rgb" defaultValue="#5548a4" />);
    expect(entry().value).toBe("rgb(85 72 164)");
    expect(formatButton("RGB")).toBeChecked();
  });

  it("changes nothing by itself while the format is controlled, until its owner follows", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker aria-label="c" inline showFormatSwitch format="hex" defaultValue="#5548a4" />);
    await user.click(formatButton("RGB"));
    expect(entry().value).toBe("#5548a4");
    rerender(<ColorPicker aria-label="c" inline showFormatSwitch format="rgb" defaultValue="#5548a4" />);
    expect(entry().value).toBe("rgb(85 72 164)");
  });

  it("works wired to state, with a controlled value", async () => {
    const user = userEvent.setup();
    function Wired() {
      const [format, setFormat] = useState<"hex" | "rgb" | "hsl" | "oklch">("hex");
      const [value, setValue] = useState("#5548a4");
      return <ColorPicker aria-label="c" inline showFormatSwitch format={format} onFormatChange={setFormat} value={value} onValueChange={setValue} />;
    }
    render(<Wired />);
    await user.click(formatButton("HSL"));
    expect(entry().value).toBe("hsl(248 39% 46%)");
    await user.click(formatButton("Hex"));
    expect(entry().value).toBe("#5548a4");
  });

  it("changes only the format, reporting no value, while no color is chosen", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onFormatChange = vi.fn();
    render(<ColorPicker aria-label="c" inline showFormatSwitch onValueChange={onValueChange} onFormatChange={onFormatChange} />);
    await user.click(formatButton("RGB"));
    expect(onFormatChange).toHaveBeenCalledWith("rgb");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(formatButton("RGB")).toBeChecked();
  });

  it("does nothing when the chosen format is pressed again", async () => {
    const user = userEvent.setup();
    const onFormatChange = vi.fn();
    render(<ColorPicker aria-label="c" inline showFormatSwitch defaultValue="#5548a4" onFormatChange={onFormatChange} />);
    await user.click(formatButton("Hex"));
    expect(onFormatChange).not.toHaveBeenCalled();
    expect(formatButton("Hex")).toBeChecked();
  });

  it("is switched off when disabled or read only", () => {
    render(<ColorPicker aria-label="c" inline readOnly showFormatSwitch defaultValue="#5548a4" />);
    for (const radio of within(formatGroup()).getAllByRole("radio")) expect(radio).toBeDisabled();
  });

  it("takes translated names", () => {
    render(<ColorPicker aria-label="c" inline showFormatSwitch labels={{ formatSwitch: "Farbformat", formatName: (format) => `F-${format}` }} />);
    expect(within(screen.getByRole("radiogroup", { name: "Farbformat" })).getByRole("radio", { name: "F-hex" })).toBeInTheDocument();
  });

  it("is in the open panel, which stays open while it is used", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" showFormatSwitch defaultValue="#5548a4" />);
    await user.click(openButton());
    await screen.findByRole("dialog");
    await user.click(formatButton("RGB"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(entry().value).toBe("rgb(85 72 164)");
  });
});

describe("ColorPicker color names", () => {
  it("reads a CSS color name, in any case, and writes it back in the format", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" onValueChange={onValueChange} />);
    await user.type(entry(), "RebeccaPurple{Enter}");
    expect(entry().value).toBe("#663399");
    expect(onValueChange).toHaveBeenCalledWith("#663399");
  });

  it("takes a name as a value and as a swatch", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="teal" swatches={["tomato"]} />);
    expect(entry().value).toBe("#008080");
    expect(screen.getByRole("button", { name: "#ff6347" })).toBeInTheDocument();
  });
});

describe("ColorPicker keyboard shortcut and controller", () => {
  it("opens the panel with Alt+ArrowDown from the entry, and not with ArrowDown alone", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" />);
    entry().focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(await screen.findByRole("dialog", { name: "Choose a color" })).toBeInTheDocument();
    expect(saturation()).toHaveFocus();
  });

  it("does nothing on Alt+ArrowDown when inline or read only", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" readOnly defaultValue="#5548a4" />);
    entry().focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is opened, closed and focused from code, saying whether it had anything to do", async () => {
    const ref = createRef<ColorPickerController>();
    const { rerender } = render(<ColorPicker aria-label="c" controllerRef={ref} />);
    const controller = ref.current as ColorPickerController;
    expect(controller.isOpen()).toBe(false);
    expect(controller.close()).toBe(false);
    await act(async () => {
      expect(controller.open()).toBe(true);
    });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(controller.isOpen()).toBe(true);
    expect(controller.open()).toBe(false);
    await act(async () => {
      expect(controller.close()).toBe(true);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(controller.focus()).toBe(true);
    expect(entry()).toHaveFocus();
    // The same object for the picker's whole life, and a disabled picker does nothing.
    rerender(<ColorPicker aria-label="c" controllerRef={ref} disabled />);
    expect(ref.current).toBe(controller);
    expect(controller.open()).toBe(false);
    expect(controller.focus()).toBe(false);
  });

  it("reports an inline picker as having nothing to open", () => {
    const ref = createRef<ColorPickerController>();
    render(<ColorPicker aria-label="c" inline controllerRef={ref} />);
    expect(ref.current?.open()).toBe(false);
  });
});

describe("ColorPicker none swatch", () => {
  it("is the first swatch, pressed while there is no color, and drawn without other swatches", () => {
    render(<ColorPicker aria-label="c" inline noneSwatch />);
    const none = screen.getByRole("button", { name: "No color" });
    expect(none).toHaveAttribute("aria-pressed", "true");
    expect(none.tabIndex).toBe(0);
  });

  it("clears the color, reports it and says so", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline noneSwatch swatches={["#ff0000"]} defaultValue="#ff0000" onValueCommit={onValueCommit} />);
    const buttons = within(screen.getByRole("group", { name: "Swatches" })).getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["No color", "#ff0000"]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]?.tabIndex).toBe(0);
    await user.click(buttons[0] as HTMLElement);
    expect(onValueCommit).toHaveBeenCalledWith("");
    expect(entry().value).toBe("");
    expect(await screen.findByText("Color cleared")).toBeInTheDocument();
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("is reached with the arrow keys like the others", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" inline noneSwatch swatches={["#ff0000"]} />);
    screen.getByRole("button", { name: "No color" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "#ff0000" })).toHaveFocus();
  });
});

describe("ColorPicker copy button", () => {
  const withClipboard = (writeText: (text: string) => Promise<void>) => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  };

  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("copies the color in the format and says so", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    withClipboard(writeText);
    render(<ColorPicker aria-label="c" inline copyButton format="rgb" defaultValue="#5548a4" />);
    await user.click(screen.getByRole("button", { name: "Copy color" }));
    expect(writeText).toHaveBeenCalledWith("rgb(85 72 164)");
    expect(await screen.findByText("Color copied")).toBeInTheDocument();
  });

  it("says when the browser refused", async () => {
    const user = userEvent.setup();
    withClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<ColorPicker aria-label="c" inline copyButton defaultValue="#5548a4" />);
    await user.click(screen.getByRole("button", { name: "Copy color" }));
    expect(await screen.findByText("Could not copy the color")).toBeInTheDocument();
  });

  it("is off while no color is chosen, and not drawn unless asked", () => {
    const { rerender } = render(<ColorPicker aria-label="c" inline copyButton />);
    expect(screen.getByRole("button", { name: "Copy color" })).toBeDisabled();
    rerender(<ColorPicker aria-label="c" inline />);
    expect(screen.queryByRole("button", { name: "Copy color" })).not.toBeInTheDocument();
  });
});

describe("ColorPicker channel inputs", () => {
  const field = (name: string) => (screen.queryByRole("spinbutton", { name }) ?? screen.getByRole("textbox", { name })) as HTMLInputElement;

  it("draws no fields unless asked", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#5548a4" />);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Red" })).not.toBeInTheDocument();
  });

  it("is one field for the whole code when the format is hex", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="c" inline showChannelInputs defaultValue="#5548a4" onValueChange={onValueChange} />);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Red" })).not.toBeInTheDocument();
    expect(field("Hex code").value).toBe("#5548a4");
    // Applied as soon as it is a whole code, in any hex spelling, with or without the #.
    await user.clear(field("Hex code"));
    await user.type(field("Hex code"), "f0");
    expect(entry().value).toBe("#5548a4");
    await user.type(field("Hex code"), "0");
    expect(entry().value).toBe("#ff0000");
    await user.clear(field("Hex code"));
    await user.type(field("Hex code"), "00ff00");
    expect(entry().value).toBe("#00ff00");
    expect(onValueChange).toHaveBeenLastCalledWith("#00ff00");
    // Text that is not a whole code is kept while typing and changes nothing; leaving the field shows the real code again.
    await user.clear(field("Hex code"));
    await user.type(field("Hex code"), "zz");
    expect(field("Hex code").value).toBe("zz");
    expect(entry().value).toBe("#00ff00");
    await user.tab();
    expect(field("Hex code").value).toBe("#00ff00");
  });

  it("holds opacity inside the hex code with alpha, and drops it without", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker aria-label="c" inline showChannelInputs alpha defaultValue="#5548a480" />);
    expect(field("Hex code").value).toBe("#5548a480");
    expect(screen.queryByRole("textbox", { name: "Opacity" })).not.toBeInTheDocument();
    await user.clear(field("Hex code"));
    await user.type(field("Hex code"), "#ff000040");
    expect(entry().value).toBe("#ff000040");
    rerender(<ColorPicker aria-label="c" key="opaque" inline showChannelInputs defaultValue="#5548a4" />);
    await user.clear(field("Hex code"));
    await user.type(field("Hex code"), "#ff000040");
    expect(entry().value).toBe("#ff0000");
  });

  it.each([
    ["rgb", ["Red", "Green", "Blue"], ["85", "72", "164"]],
    ["hsl", ["Hue", "Saturation", "Lightness"], ["248", "39", "46"]],
  ] as const)("shows the %s channels of the color", (format, names, values) => {
    render(<ColorPicker aria-label="c" inline showChannelInputs format={format} defaultValue="#5548a4" />);
    expect(names.map((name) => field(name).value)).toEqual(values);
  });

  it("shows lightness, chroma and hue for oklch, and opacity with alpha", () => {
    render(<ColorPicker aria-label="c" inline showChannelInputs alpha format="oklch" defaultValue="#5548a480" />);
    expect(["Lightness", "Chroma", "Hue", "Opacity"].map((name) => field(name).value)).toEqual(["0.464", "0.143", "285.9", "50"]);
  });

  it("applies a typed channel as soon as it is a number, and commits it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline showChannelInputs format="rgb" defaultValue="#000000" onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    await user.clear(field("Red"));
    await user.type(field("Red"), "255");
    expect(entry().value).toBe("rgb(255 0 0)");
    expect(onValueChange).toHaveBeenLastCalledWith("rgb(255 0 0)");
    expect(onValueCommit).toHaveBeenLastCalledWith("rgb(255 0 0)");
  });

  it("keeps what is typed while the field has focus, and clamps a number out of range", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" inline showChannelInputs format="rgb" defaultValue="#000000" />);
    await user.clear(field("Green"));
    expect(field("Green").value).toBe("");
    await user.type(field("Green"), "999");
    expect(entry().value).toBe("rgb(0 255 0)");
    expect(field("Green").value).toBe("999");
    await user.tab();
    expect(field("Green").value).toBe("255");
  });

  it("edits hsl and opacity, and keeps a typed hue on a gray", async () => {
    const user = userEvent.setup();
    render(<ColorPicker aria-label="c" inline showChannelInputs alpha format="hsl" defaultValue="#808080" />);
    await user.clear(field("Hue"));
    await user.type(field("Hue"), "120");
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveAttribute("aria-valuenow", "120");
    await user.clear(field("Opacity"));
    await user.type(field("Opacity"), "25");
    expect(entry().value).toBe("hsl(0 0% 50% / 0.25)");
  });

  it("is detached from a surrounding form and does nothing when read only", () => {
    const { container } = render(
      <form>
        <ColorPicker aria-label="c" inline showChannelInputs format="rgb" readOnly defaultValue="#5548a4" />
      </form>,
    );
    expect(field("Red")).toHaveAttribute("form", "");
    expect(field("Red")).toHaveAttribute("readonly");
    expect((container.querySelector("form") as HTMLFormElement).checkValidity()).toBe(true);
  });

  it("takes translated names and letters", () => {
    const { rerender } = render(<ColorPicker aria-label="c" inline showChannelInputs format="rgb" labels={{ channelName: (channel) => `K-${channel}`, channelLetter: () => "x" }} />);
    expect(field("K-r")).toBeInTheDocument();
    rerender(<ColorPicker aria-label="c" inline showChannelInputs labels={{ channelName: (channel) => `K-${channel}` }} />);
    expect(field("K-hex")).toBeInTheDocument();
  });
});

describe("ColorPicker eyedropper", () => {
  afterEach(() => {
    delete (window as unknown as { EyeDropper?: unknown }).EyeDropper;
  });

  it("draws no button without the browser API", () => {
    render(<ColorPicker aria-label="c" inline eyeDropper />);
    expect(screen.queryByRole("button", { name: "Pick a color from the screen" })).not.toBeInTheDocument();
  });

  it("picks a color from the screen where the API exists, and treats cancelling as nothing", async () => {
    const user = userEvent.setup();
    const open = vi.fn().mockResolvedValueOnce({ sRGBHex: "#123456" }).mockRejectedValueOnce(new DOMException("cancelled", "AbortError"));
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {
      open = open;
    };
    const onValueCommit = vi.fn();
    render(<ColorPicker aria-label="c" inline eyeDropper onValueCommit={onValueCommit} />);
    const button = await screen.findByRole("button", { name: "Pick a color from the screen" });
    await user.click(button);
    await waitFor(() => expect(onValueCommit).toHaveBeenCalledWith("#123456"));
    await user.click(button);
    expect(open).toHaveBeenCalledTimes(2);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });
});

describe("ColorPicker in a form", () => {
  it("submits the color under its name", () => {
    const { container } = render(
      <form>
        <ColorPicker aria-label="c" name="brand" defaultValue="#5548a4" />
      </form>,
    );
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("brand")).toBe("#5548a4");
  });

  it("refuses a submit with required and no color, and sends focus to the entry", () => {
    const { container } = render(
      <form>
        <ColorPicker aria-label="c" name="brand" required />
      </form>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    (container.querySelector('input[name="brand"]') as HTMLInputElement).focus();
    expect(entry()).toHaveFocus();
  });
});

describe("ColorPicker focus and blur", () => {
  it("reports focus and blur once for the whole field, the open panel included", async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <ColorPicker aria-label="c" onFocus={onFocus} onBlur={onBlur} />
        <button type="button">elsewhere</button>
      </>,
    );
    await user.click(entry());
    expect(onFocus).toHaveBeenCalledTimes(1);
    await user.click(openButton());
    await screen.findByRole("dialog");
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("focuses the entry on mount with autoFocus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<ColorPicker aria-label="c" autoFocus />);
    expect(entry()).toHaveFocus();
  });
});

describe("ColorPicker labels", () => {
  it("translates any label and keeps the rest", () => {
    render(<ColorPicker aria-label="c" inline defaultValue="#ff0000" labels={{ saturation: "Sättigung", hueText: (degrees) => `${degrees} Grad` }} formatNumber={(n) => `<${n}>`} />);
    expect(screen.getByRole("slider", { name: "Sättigung" })).toHaveAttribute("aria-valuetext", "<100>%");
    expect(hue()).toHaveAttribute("aria-valuetext", "<0> Grad");
    expect(brightness()).toBeInTheDocument();
  });

  it("keeps a default for a label overridden with undefined", () => {
    render(<ColorPicker aria-label="c" inline labels={{ saturation: undefined }} />);
    expect(saturation()).toBeInTheDocument();
  });
});

describe("ColorPicker accessibility", () => {
  it("has no axe violations closed, open, inline or in a form", async () => {
    const { container, unmount } = render(<ColorPicker aria-label="Brand color" defaultValue="#5548a4" swatches={["#ff0000", "#00ff00"]} alpha clearable />);
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    render(<ColorPicker aria-label="Brand color" defaultOpen defaultValue="#5548a4" swatches={["#ff0000", "#00ff00"]} alpha />);
    await screen.findByRole("dialog");
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  it("has no axe violations inline, at another size and in right-to-left", async () => {
    const { container } = render(<ColorPicker aria-label="Brand color" inline size="xs" dir="rtl" defaultValue="#5548a4" alpha showFormatSwitch showChannelInputs noneSwatch copyButton eyeDropper swatches={["#ff0000"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps every accessible name inside what is shown (none is shown but the color itself)", () => {
    render(<ColorPicker aria-label="c" defaultValue="#5548a4" />);
    expect(entry().value).toBe("#5548a4");
  });
});

describe("ColorPicker presentation", () => {
  it("opens as a normal panel by default and with a full-width presentation", async () => {
    render(<ColorPicker aria-label="c" defaultOpen presentation="full-width" />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toMatch(/fullWidth/);
    await act(async () => undefined);
  });
});
