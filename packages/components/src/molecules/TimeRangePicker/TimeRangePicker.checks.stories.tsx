import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { TimeRangePicker } from "./TimeRangePicker";

// Hidden, real-browser checks (`!dev`, ADR-0013): what jsdom can't measure — the shared popover's layout.
const meta: Meta = {
  title: "Components/TimeRangePicker/Checks",
  id: "molecules-inputs-timerangepicker-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

export const SharedPickerSitsSideBySide: Story = {
  name: "The shared popover puts the start's wheels beside the end's, inside the viewport",
  render: () => <TimeRangePicker aria-label="Opening hours" sharedPicker defaultValue={["09:00", "17:30"]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Choose time" }));
    const dialog = await screen.findByRole("dialog", { name: "Choose a time" });
    const start = within(dialog).getByRole("group", { name: "Start time" }).getBoundingClientRect();
    const end = within(dialog).getByRole("group", { name: "End time" }).getBoundingClientRect();
    await expect(Math.abs(start.top - end.top)).toBeLessThan(1);
    await expect(end.left).toBeGreaterThan(start.right - 1);
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const SharedPickerPicksFromBothEnds: Story = {
  name: "Wheels in the shared popover change their own end, live, and focus starts at the start's hours",
  render: () => <TimeRangePicker aria-label="Opening hours" sharedPicker hourCycle="24" defaultValue={["09:00", "17:30"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose time" }));
    const dialog = await screen.findByRole("dialog", { name: "Choose a time" });
    const startHours = within(within(dialog).getByRole("group", { name: "Start time" })).getByRole("listbox", { name: "Hour" });
    await waitFor(() => expect(startHours).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(canvas.getAllByRole("group", { name: "Start time" })[0]!).getByRole("spinbutton", { name: "Hour" })).toHaveValue("10"));
    const endHours = within(within(dialog).getByRole("group", { name: "End time" })).getByRole("listbox", { name: "Hour" });
    endHours.focus();
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(within(canvas.getAllByRole("group", { name: "End time" })[0]!).getByRole("spinbutton", { name: "Hour" })).toHaveValue("16"));
  },
};
