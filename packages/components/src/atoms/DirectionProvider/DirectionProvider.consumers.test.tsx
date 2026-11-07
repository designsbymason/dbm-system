import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { DirectionProvider } from "./DirectionProvider";
import { Combobox } from "../../organisms/Combobox";
import { ContextMenu } from "../../organisms/ContextMenu";
import { DatePicker } from "../../organisms/DatePicker";
import { DateRangePicker } from "../../organisms/DateRangePicker";
import { Menu } from "../../organisms/Menu";
import { Select } from "../../molecules/Select";
import { CommandPalette } from "../../organisms/CommandPalette";
import { MultiSelect } from "../../organisms/MultiSelect";
import { Basic } from "../../organisms/Stepper/stepperTestKit";
import { Tree } from "../../organisms/Tree";
import { RangeSlider } from "../../molecules/RangeSlider";
import { ScrollArea } from "../../molecules/ScrollArea";
import { Slider } from "../../molecules/Slider";
import { ToggleGroup } from "../../molecules/ToggleGroup";

// Every component that takes a `dir` reads the nearest DirectionProvider when it is given none, and its own `dir` wins. Each case renders the
// component with a given `dir` (or none) and returns the element that carries the direction.
type Dir = "ltr" | "rtl" | undefined;
interface Case {
  name: string;
  /** Renders the component and returns the element that carries its `dir`. */
  draw: (dir: Dir) => ReactNode;
  find: () => Element | null;
  /** The `dir` attribute without a provider or a `dir` of its own. `null` for a part that leaves the attribute off, and so inherits the page's direction. */
  bare?: "ltr" | null;
}

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

const cases: Case[] = [
  { name: "Slider", draw: (dir) => <Slider aria-label="Volume" dir={dir} defaultValue={50} />, find: () => screen.getByRole("slider").closest("[dir]") },
  {
    name: "RangeSlider",
    draw: (dir) => <RangeSlider aria-label="Price" dir={dir} defaultValue={[20, 80]} />,
    find: () => screen.getAllByRole("slider")[0]?.closest("[dir]") ?? null,
  },
  {
    name: "ScrollArea",
    draw: (dir) => (
      <ScrollArea dir={dir} data-testid="target">
        Content
      </ScrollArea>
    ),
    find: () => screen.getByTestId("target"),
  },
  {
    name: "ToggleGroup",
    draw: (dir) => (
      <ToggleGroup aria-label="Alignment" dir={dir}>
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      </ToggleGroup>
    ),
    find: () => screen.getByRole("radiogroup"),
  },
  {
    name: "Stepper",
    draw: (dir) => <Basic dir={dir} data-testid="target" />,
    find: () => screen.getByTestId("target"),
  },
  { name: "Combobox", draw: (dir) => <Combobox aria-label="Letter" options={options} dir={dir} />, find: () => screen.getByRole("combobox").closest("[dir]") },
  {
    name: "MultiSelect",
    draw: (dir) => <MultiSelect aria-label="Letters" options={options} dir={dir} />,
    find: () => screen.getByRole("combobox").closest("[dir]"),
  },
  { name: "Tree", draw: (dir) => <Tree aria-label="Files" dir={dir} nodes={[{ id: "a", label: "a" }]} />, find: () => screen.getByRole("tree").closest("[dir]") },
  {
    name: "CommandPalette",
    draw: (dir) => <CommandPalette defaultOpen dir={dir} commands={[{ value: "x", label: "Do x" }]} />,
    find: () => screen.getByRole("dialog"),
  },
  {
    name: "Menu",
    draw: (dir) => (
      <Menu defaultOpen modal={false} dir={dir}>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Rename</Menu.Item>
        </Menu.Content>
      </Menu>
    ),
    find: () => screen.getByRole("menu"),
  },
  {
    name: "ContextMenu",
    draw: (dir) => (
      <ContextMenu defaultOpen modal={false} dir={dir}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    ),
    find: () => screen.getByRole("menu"),
  },
  {
    name: "Select",
    draw: (dir) => (
      <Select aria-label="Variant" dir={dir} defaultValue="a">
        <Select.Option value="a">Alpha</Select.Option>
      </Select>
    ),
    find: () => screen.getByRole("combobox"),
  },
  { name: "DatePicker", draw: (dir) => <DatePicker aria-label="Start" dir={dir} />, find: () => screen.getByRole("group"), bare: null },
  { name: "DateRangePicker", draw: (dir) => <DateRangePicker aria-label="Stay" dir={dir} />, find: () => screen.getByRole("group", { name: "Stay" }), bare: null },
];

describe("components that take a dir read the nearest DirectionProvider", () => {
  it.each(cases)("$name: follows the provider, else left to right, and its own dir wins", ({ draw, find, bare: bareDir = "ltr" }) => {
    const bare = render(draw(undefined));
    if (bareDir === null) expect(find()).not.toHaveAttribute("dir");
    else expect(find()).toHaveAttribute("dir", bareDir);
    bare.unmount();

    const provided = render(<DirectionProvider dir="rtl">{draw(undefined)}</DirectionProvider>);
    expect(find()).toHaveAttribute("dir", "rtl");
    provided.unmount();

    render(<DirectionProvider dir="rtl">{draw("ltr")}</DirectionProvider>);
    expect(find()).toHaveAttribute("dir", "ltr");
  });
});
