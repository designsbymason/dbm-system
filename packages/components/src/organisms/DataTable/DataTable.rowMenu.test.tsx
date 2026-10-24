import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "../ContextMenu";
import { DataTable } from "./DataTable";
import type { DataTableColumn, DataTableProps, DataTableRowMenuContext } from "./DataTable.types";

afterEach(() => vi.restoreAllMocks());

interface Person {
  id: string;
  name: string;
  locked?: boolean;
}

const people: Person[] = [
  { id: "p1", name: "Cy" },
  { id: "p2", name: "Ada" },
  { id: "p3", name: "Bo" },
  { id: "p4", name: "Di", locked: true },
];

const columns: DataTableColumn<Person>[] = [{ id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true }];

const seen: Array<DataTableRowMenuContext<Person>> = [];

function Table(props: Partial<DataTableProps<Person>>) {
  return (
    <DataTable<Person>
      columns={columns}
      data={people}
      aria-label="People"
      selectionMode="multiple"
      getRowLabel={(row) => row.name}
      isRowSelectable={(row) => !row.locked}
      rowContextMenu={(context) => {
        seen.push(context);
        return (
          <>
            <ContextMenu.Item>{context.count > 1 ? `Edit ${context.count}` : `Edit ${context.row.name}`}</ContextMenu.Item>
            <ContextMenu.Item>{context.rows.map((row) => row.name).join(", ")}</ContextMenu.Item>
          </>
        );
      }}
      {...props}
    />
  );
}

const row = (name: string) => screen.getByRole("row", { name: new RegExp(name), hidden: true });
const rightClick = (name: string) => fireEvent.contextMenu(row(name), { clientX: 20, clientY: 20 });
const checkbox = (name: string) => within(row(name)).getByRole("checkbox", { hidden: true });

describe("DataTable's rowContextMenu", () => {
  it("draws no menu and keeps the browser's own without the prop", () => {
    render(<Table rowContextMenu={undefined} />);
    expect(fireEvent.contextMenu(row("Ada"))).toBe(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the row's menu on a right-click, named for the row, and marks the row open", async () => {
    render(<Table />);
    rightClick("Ada");
    const menu = await screen.findByRole("menu", { name: "Actions for Ada" });
    expect(within(menu).getByRole("menuitem", { name: "Edit Ada" })).toBeInTheDocument();
    expect(row("Ada")).toHaveAttribute("data-state", "open");
    expect(row("Cy")).toHaveAttribute("data-state", "closed");
  });

  it("asks for the items only for the row whose menu is open", async () => {
    seen.length = 0;
    render(<Table />);
    rightClick("Bo");
    await screen.findByRole("menu");
    expect(new Set(seen.map((context) => context.id))).toEqual(new Set(["p3"]));
  });

  it("chooses an unchosen row alone first, replacing the selection, and the menu is about it", async () => {
    const onSelectionChange = vi.fn();
    render(<Table defaultSelection={["p1"]} onSelectionChange={onSelectionChange} />);
    rightClick("Ada");
    const menu = await screen.findByRole("menu");
    expect(onSelectionChange).toHaveBeenCalledWith(["p2"]);
    expect(checkbox("Ada")).toBeChecked();
    expect(checkbox("Cy")).not.toBeChecked();
    expect(within(menu).getByRole("menuitem", { name: "Edit Ada" })).toBeInTheDocument();
  });

  it("keeps the selection when the row pressed is part of it, and the menu acts on all of it in table order", async () => {
    const onSelectionChange = vi.fn();
    render(<Table defaultSelection={["p3", "p1"]} onSelectionChange={onSelectionChange} />);
    rightClick("Bo");
    const menu = await screen.findByRole("menu");
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(within(menu).getByRole("menuitem", { name: "Edit 2" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Cy, Bo" })).toBeInTheDocument();
    const last = seen.at(-1);
    expect(last?.count).toBe(2);
    expect(last?.allSelected).toBe(false);
  });

  it("leaves the selection alone in a table that doesn't select, and for a row that can't be chosen", async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(<Table selectionMode="none" onSelectionChange={onSelectionChange} />);
    rightClick("Ada");
    await screen.findByRole("menu");
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    rerender(<Table selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    rightClick("Di");
    const menu = await screen.findByRole("menu");
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(within(menu).getByRole("menuitem", { name: "Edit Di" })).toBeInTheDocument();
  });

  it("says when every row is chosen across pages, with the rows the table holds", async () => {
    render(<Table selectionMode="multiple" defaultAllSelected />);
    rightClick("Ada");
    await screen.findByRole("menu");
    const last = seen.at(-1);
    expect(last?.allSelected).toBe(true);
    expect(last?.rows.map((person) => person.name)).toEqual(["Cy", "Ada", "Bo"]);
  });

  it("uses a sorted table's row, not its position in the data", async () => {
    const user = userEvent.setup();
    render(<Table columns={[{ ...(columns[0] as DataTableColumn<Person>), sortable: true }]} />);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    rightClick("Ada");
    await screen.findByRole("menu");
    expect(seen.at(-1)?.row.name).toBe("Ada");
    expect(seen.at(-1)?.index).toBe(1);
  });

  it("names the menu from the labels, so it can be translated", async () => {
    render(<Table labels={{ rowMenu: (label) => `Aktionen für ${label}` }} />);
    rightClick("Ada");
    expect(await screen.findByRole("menu", { name: "Aktionen für Ada" })).toBeInTheDocument();
  });

  it("opens from a key the table was given, under the checkbox that has focus", async () => {
    const user = userEvent.setup();
    render(<Table rowContextMenuKeys={["Alt+ArrowDown"]} />);
    checkbox("Cy").focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(await screen.findByRole("menu", { name: "Actions for Cy" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(checkbox("Cy")).toHaveFocus());
  });

  it("keeps the items through the menu's exit and drops them after", async () => {
    const user = userEvent.setup();
    render(<Table />);
    rightClick("Ada");
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    seen.length = 0;
    // another change to the table, with no menu open, does not ask again
    await act(async () => {
      await user.click(checkbox("Cy"));
    });
    expect(seen).toEqual([]);
  });

  it("works with rows that press, and a press on a row still presses", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<Table onRowClick={onRowClick} />);
    await user.click(within(row("Ada")).getByRole("rowheader"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    rightClick("Ada");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("works in a controlled table", async () => {
    function Controlled() {
      const [selection, setSelection] = useState<string[]>([]);
      return <Table selection={selection} onSelectionChange={setSelection} />;
    }
    render(<Controlled />);
    rightClick("Bo");
    await screen.findByRole("menu");
    expect(checkbox("Bo")).toBeChecked();
  });

  it("has no axe violations with a menu open", async () => {
    render(<Table />);
    rightClick("Ada");
    await screen.findByRole("menu");
    expect((await axe(document.body, { rules: { region: { enabled: false } } })).violations).toHaveLength(0);
  });
});
