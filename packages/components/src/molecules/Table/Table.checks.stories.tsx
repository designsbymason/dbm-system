import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Navbar } from "../../organisms/Navbar";
import { Table } from "./Table";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do, which is real layout and hit-testing across a scrolled page.
const meta: Meta = {
  title: "Components/Table/Checks",
  id: "molecules-data-display-table-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const rows = Array.from({ length: 40 }, (_, index) => index + 1);

export const PinnedPartsStayUnderAStickyBar: Story = {
  name: "A pinned header and column stay under a sticky bar the page scrolls them beneath",
  render: () => (
    <div>
      <Navbar sticky aria-label="Site">
        <span>Site header</span>
      </Navbar>
      <div style={{ height: "20rem" }}>Content above the table</div>
      <Table stickyHeader stickyFirstColumn maxHeight="20rem" aria-label="People">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row}>
              <Table.Cell>Person {row}</Table.Cell>
              <Table.Cell>Role {row}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div style={{ height: "90rem" }}>Content below the table</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("banner");
    const table = canvas.getByRole("table", { name: "People" });
    const frame = table.parentElement as HTMLElement;
    // Scroll the page until the table's top edge is half way under the bar, so the pinned header cell and the bar overlap.
    const frameTop = frame.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, frameTop - bar.getBoundingClientRect().height / 2);
    const header = canvas.getByRole("columnheader", { name: "Name" });
    await waitFor(() => expect(header.getBoundingClientRect().top).toBeLessThan(bar.getBoundingClientRect().bottom));
    // The corner cell (header and first column pinned) is the table's topmost layer: if it is not above the bar, nothing of the table is.
    const cell = header.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    const x = cell.left + 8;
    const y = Math.max(cell.top, barBox.top) + 4;
    await expect(y).toBeLessThan(Math.min(cell.bottom, barBox.bottom));
    const hit = document.elementFromPoint(x, y);
    await expect(hit).not.toBeNull();
    await expect(bar.contains(hit)).toBe(true);
  },
};
