import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import styles from "./DataTable.module.css";
import { useDataTable } from "./DataTable.context";
import type { DataTableColumn, DataTableProps, DataTableSort } from "./DataTable.types";
import { TableToolbar } from "../../molecules/TableToolbar";
import { DirectionProvider } from "../../atoms/DirectionProvider";

afterEach(() => vi.restoreAllMocks());

// The footer's range wraps each number in a bidirectional isolate; a reader (and a test) sees through them.
/** The detail row's class, read from the stylesheet module so the test doesn't hold a hashed name. */
const styles_detailRow = () => (styles as Record<string, string>).detailRow as string;

const rangeText = (text: string) => (content: string) => content.replace(/[\u2068\u2069]/g, "") === text;

/** The range text that is drawn, not the copy the compact pager holds behind an inline `display: none` (`compactBelow`): a text query sees both. */
const visibleText = (matcher: Parameters<typeof screen.queryAllByText>[0]) =>
  screen.queryAllByText(matcher).find((element) => !element.closest('[style*="display: none"]')) ?? null;

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: "p1", name: "Cy", age: 30 },
  { id: "p2", name: "Ada", age: 41 },
  { id: "p3", name: "Bo", age: 25 },
  { id: "p4", name: "Di", age: 36 },
];

const columns: DataTableColumn<Person>[] = [
  { id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true },
  { id: "age", header: "Age", accessor: (row) => row.age, sortable: true, numeric: true },
];

function renderTable(props: Partial<DataTableProps<Person>> = {}) {
  return render(<DataTable<Person> columns={columns} data={people} aria-label="People" {...props} />);
}

/** The body rows' first cell text, in order. */
function names(): string[] {
  const body = screen.getAllByRole("rowgroup")[1] as HTMLElement;
  return within(body)
    .getAllByRole("row")
    .map((row) => within(row).getAllByRole("rowheader")[0]?.textContent ?? "");
}

describe("DataTable", () => {
  describe("rendering", () => {
    it("draws a real table with the columns and rows", () => {
      renderTable();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Name", "Age"]);
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("draws a cell from its cell function, and from the accessor's value otherwise", () => {
      renderTable({
        columns: [
          { id: "name", header: "Name", accessor: (row) => row.name, cell: (row) => <strong>{row.name.toUpperCase()}</strong>, rowHeader: true },
          { id: "age", header: "Age", accessor: (row) => row.age },
        ],
      });
      expect(screen.getByText("CY").tagName).toBe("STRONG");
      expect(screen.getByText("41")).toBeInTheDocument();
    });

    it("names the table by its caption", () => {
      render(<DataTable<Person> columns={columns} data={people} caption="Team" />);
      expect(screen.getByRole("table", { name: "Team" })).toBeInTheDocument();
    });

    it("forwards the ref to the table, and id, test id and class to where they belong", () => {
      const ref = createRef<HTMLTableElement>();
      render(<DataTable<Person> columns={columns} data={people} aria-label="People" ref={ref} id="t" data-testid="dt" className="frame" style={{ margin: 1 }} />);
      expect(ref.current?.tagName).toBe("TABLE");
      expect(screen.getByTestId("dt").tagName).toBe("TABLE");
      expect(screen.getByTestId("dt")).toHaveAttribute("id", "t");
      expect(screen.getByTestId("dt").closest(".frame")).not.toBeNull();
    });

    it("shows the empty text, or the empty state it is given", () => {
      const { rerender } = renderTable({ data: [] });
      expect(screen.getByText("No results")).toBeInTheDocument();
      rerender(<DataTable<Person> columns={columns} data={[]} aria-label="People" emptyState={<p>Nobody here</p>} />);
      expect(screen.getByText("Nobody here")).toBeInTheDocument();
    });

    it("shows placeholder rows while loading, marking the body busy", () => {
      renderTable({ loading: true, loadingRows: 2 });
      const body = screen.getAllByRole("rowgroup")[1] as HTMLElement;
      expect(body).toHaveAttribute("aria-busy", "true");
      expect(within(body).getAllByRole("row")).toHaveLength(2);
    });

    it("leaves out a hidden column", () => {
      renderTable({ hiddenColumns: ["age"] });
      expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Name"]);
    });

    it("draws a row-actions column with a header only a screen reader reads", () => {
      renderTable({ rowActions: (row) => <button type="button">Edit {row.name}</button> });
      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit Cy" })).toBeInTheDocument();
    });

    it("replaces labels one at a time, keeping the default for one given as undefined", () => {
      renderTable({ data: [], labels: { empty: undefined, loading: "Fetching" } });
      expect(screen.getByText("No results")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("cycles ascending, descending, none from the header button and sets aria-sort", async () => {
      const user = userEvent.setup();
      renderTable();
      const name = screen.getByRole("button", { name: "Name" });
      await user.click(name);
      expect(names()).toEqual(["Ada", "Bo", "Cy", "Di"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
      await user.click(name);
      expect(names()).toEqual(["Di", "Cy", "Bo", "Ada"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
      await user.click(name);
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
    });

    it("sets only the sorted column's aria-sort", async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(screen.getByRole("button", { name: "Age" }));
      expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
      expect(screen.getByRole("columnheader", { name: "Age" })).toHaveAttribute("aria-sort", "ascending");
    });

    it("gives no button to a column that is not sortable", () => {
      renderTable({ columns: [{ id: "name", header: "Name", accessor: (row) => row.name }] });
      expect(screen.queryByRole("button", { name: "Name" })).toBeNull();
    });

    it("starts from defaultSort and reports what was asked", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ defaultSort: [{ columnId: "age", direction: "descending" }], onSortChange });
      expect(names()).toEqual(["Ada", "Di", "Cy", "Bo"]);
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledWith([{ columnId: "name", direction: "ascending" }]);
    });

    it("a controlled sort changes only when its prop does", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ sort: [], onSortChange });
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledOnce();
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("works wired to state", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [sort, setSort] = useState<DataTableSort>([]);
        return <DataTable<Person> columns={columns} data={people} aria-label="People" sort={sort} onSortChange={setSort} />;
      }
      render(<Wired />);
      await user.click(screen.getByRole("button", { name: "Age" }));
      expect(names()).toEqual(["Bo", "Cy", "Di", "Ada"]);
    });

    it("leaves the rows alone in manual mode and only reports", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ sortMode: "manual", onSortChange });
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledOnce();
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("announces the sort, and its removal, in a live region", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTable();
      await user.click(screen.getByRole("button", { name: "Name" }));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Sorted by Name, ascending");
      vi.useRealTimers();
    });

    it("warns for a sortable column with nothing to sort by", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ columns: [{ id: "x", header: "X", sortable: true }] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('column "x" is `sortable`'));
    });
  });

  describe("selection", () => {
    it("adds a checkbox column with a named header checkbox in multiple mode", () => {
      renderTable({ selectionMode: "multiple" });
      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox")).toHaveLength(5);
      expect(screen.getByRole("checkbox", { name: "Select Row 1" })).toBeInTheDocument();
    });

    it("names a row's checkbox from getRowLabel", () => {
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    });

    it("chooses rows, draws them selected and reports the ids", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", onSelectionChange, getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p2"]);
      const row = screen.getByRole("checkbox", { name: "Select Ada" }).closest("tr") as HTMLElement;
      expect(row).toHaveAttribute("data-selected");
      expect(row).not.toHaveAttribute("aria-selected");
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });

    it("shows the header checkbox mixed for some, checked for all, and chooses or clears the page", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      const all = screen.getByRole("checkbox", { name: "Select all rows" });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(all).toHaveAttribute("aria-checked", "mixed");
      await user.click(all);
      expect(all).toHaveAttribute("aria-checked", "true");
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      await user.click(all);
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
    });

    it("chooses a range with shift", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", onSelectionChange, getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("checkbox", { name: "Select Di" }));
      await user.keyboard("{/Shift}");
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p2", "p3", "p4"]);
    });

    it("single mode replaces the choice and has no header checkbox", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "single", getRowLabel: (row) => row.name });
      expect(screen.queryByRole("checkbox", { name: "Select all rows" })).toBeNull();
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("checkbox", { name: "Select Bo" }));
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
      expect(screen.getByRole("checkbox", { name: "Select Bo" })).toBeChecked();
    });

    it("disables the checkbox of a row that can't be chosen and leaves it out of select all", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({
        selectionMode: "multiple",
        onSelectionChange,
        isRowSelectable: (row) => row.id !== "p1",
        getRowLabel: (row) => row.name,
      });
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeDisabled();
      await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p2", "p3", "p4"]);
    });

    it("a controlled selection changes only when its prop does", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", selection: ["p3"], getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Bo" })).toBeChecked();
    });

    it("keeps the choice when the rows are sorted", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeChecked();
    });

    it("warns for two rows with the same id", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ data: [people[0] as Person, { ...(people[0] as Person), name: "Twin" }] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('two rows have the id "p1"'));
    });
  });

  describe("pages", () => {
    const many: Person[] = Array.from({ length: 25 }, (_, index) => ({ id: `r${index}`, name: `Person ${String(index + 1).padStart(2, "0")}`, age: index }));

    it("shows one page of rows, with the range, and turns the page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People">
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()).toHaveLength(10);
      expect(names()[0]).toBe("Person 01");
      expect(visibleText(rangeText("1–10 of 25"))).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(names()[0]).toBe("Person 11");
      expect(visibleText(rangeText("11–20 of 25"))).toBeInTheDocument();
    });

    it("sorts the whole set before taking the page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultSort={[{ columnId: "age", direction: "descending" }]}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()[0]).toBe("Person 25");
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(names()[0]).toBe("Person 15");
    });

    it("sets aria-rowcount and each row's aria-rowindex across the whole set", async () => {
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPage={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "26");
      const rows = screen.getAllByRole("row");
      expect(rows[0]).toHaveAttribute("aria-rowindex", "1");
      expect(rows[1]).toHaveAttribute("aria-rowindex", "12");
    });

    it("goes back to the first page and reports when the page size changes", async () => {
      const onPageSizeChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPage={2} onPageSizeChange={onPageSizeChange}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
      await user.click(await screen.findByRole("option", { name: "25" }));
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
      expect(names()).toHaveLength(25);
      expect(visibleText(rangeText("1–25 of 25"))).toBeInTheDocument();
    });

    it("holds a page that is past the end to the last page", () => {
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" page={9}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(visibleText(rangeText("21–25 of 25"))).toBeInTheDocument();
    });

    it("draws data as given in manual mode and takes the count from totalCount", async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many.slice(0, 10)} aria-label="People" sortMode="manual" totalCount={95} onPageChange={onPageChange}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()).toHaveLength(10);
      expect(visibleText(rangeText("1–10 of 95"))).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe("toolbar parts", () => {
    it("draws the toolbar above the table and the pagination below it", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People">
          <DataTable.Pagination compact="never" />
          <DataTable.Toolbar aria-label="Tools">
            <TableToolbar.Row>tools</TableToolbar.Row>
          </DataTable.Toolbar>
        </DataTable>,
      );
      const toolbar = screen.getByRole("group", { name: "Tools" });
      const table = screen.getByRole("table");
      const pagination = screen.getByRole("navigation");
      expect(toolbar.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(table.compareDocumentPosition(pagination) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("DataTable.Selection counts the chosen rows and clears them", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection>
              <button type="button">Delete</button>
            </DataTable.Selection>
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByText("1 selected")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Select all 4" }));
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
    });

    it("useDataTable reads and changes the table's state from inside it", async () => {
      const user = userEvent.setup();
      function HideAge() {
        const { hiddenColumns, setHiddenColumns } = useDataTable();
        return (
          <button type="button" onClick={() => setHiddenColumns([...hiddenColumns, "age"])}>
            Hide age
          </button>
        );
      }
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People">
          <HideAge />
        </DataTable>,
      );
      await user.click(screen.getByRole("button", { name: "Hide age" }));
      expect(screen.queryByRole("columnheader", { name: "Age" })).toBeNull();
    });

    it("useDataTable outside a table throws a clear error", () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      function Outside() {
        useDataTable();
        return null;
      }
      expect(() => render(<Outside />)).toThrow(/inside a DataTable/);
    });
  });

  describe("row press", () => {
    it("calls onRowClick for a press on the row and for Enter on a focused row, but not for a control inside it", async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      renderTable({ onRowClick, rowActions: () => <button type="button">More</button> });
      const row = screen.getAllByRole("row")[1] as HTMLElement;
      expect(row).toHaveAttribute("tabindex", "0");
      await user.click(within(row).getAllByRole("cell")[0] as HTMLElement);
      expect(onRowClick).toHaveBeenCalledTimes(1);
      await user.click(within(row).getByRole("button", { name: "More" }));
      expect(onRowClick).toHaveBeenCalledTimes(1);
      row.focus();
      await user.keyboard("{Enter}");
      expect(onRowClick).toHaveBeenCalledTimes(2);
      expect(onRowClick.mock.calls[0]?.[0]).toBe(people[0]);
    });

    it("does not make rows tab stops without onRowClick", () => {
      renderTable();
      expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("tabindex");
    });
  });

  describe("windowing", () => {
    const long: Person[] = Array.from({ length: 500 }, (_, index) => ({ id: `r${index}`, name: `P${index}`, age: index }));

    it("draws a window of rows, not all of them, when long and given a height", () => {
      renderTable({ data: long, maxHeight: "20rem" });
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeLessThan(80);
      expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "501");
    });

    it("draws every row when it is not tall enough to window, or when told not to", () => {
      const { unmount } = renderTable({ data: long.slice(0, 60), maxHeight: "20rem" });
      expect(screen.getAllByRole("row")).toHaveLength(61);
      unmount();
      renderTable({ data: long, maxHeight: "20rem", virtualize: false });
      expect(screen.getAllByRole("row")).toHaveLength(501);
    });

    it("does not window a table with a wrapping column", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({
        data: long,
        maxHeight: "20rem",
        virtualize: true,
        columns: [{ id: "name", header: "Name", accessor: (row) => row.name, wrap: true }],
      });
      expect(screen.getAllByRole("row")).toHaveLength(501);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`virtualize` needs rows of one height"));
    });

    it("keeps the first drawn row on an even index so stripes stay in step", () => {
      renderTable({ data: long, maxHeight: "20rem" });
      const first = screen.getAllByRole("row")[1] as HTMLElement;
      expect(Number(first.getAttribute("aria-rowindex")) % 2).toBe(0);
    });
  });

  describe("quality", () => {
    it("warns once when the table has no name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<DataTable<Person> columns={columns} data={people} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("give the table a name"));
    });

    it("lets a same-named prop not override the computed row selection mark", () => {
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name, selection: ["p1"] });
      const row = screen.getByRole("checkbox", { name: "Select Cy" }).closest("tr") as HTMLElement;
      expect(row).toHaveAttribute("data-selected");
    });

    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
            <DataTable.Pagination compact="never" />
          </DataTable>
        </StrictMode>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeChecked();
    });

    it("has no accessibility violations in its plain, selecting, sorted and empty states", async () => {
      const first = renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name, defaultSort: [{ columnId: "name", direction: "ascending" }] });
      expect(await axe(first.container)).toHaveNoViolations();
      first.unmount();
      const second = renderTable({ data: [] });
      expect(await axe(second.container)).toHaveNoViolations();
      second.unmount();
      const third = render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" rowActions={() => <button type="button">More</button>}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(await axe(third.container)).toHaveNoViolations();
    });
  });
  describe("what a review asked for", () => {
    it("wraps each number of the range in a bidirectional isolate", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(visibleText(rangeText("1–2 of 4"))?.textContent).toBe("\u20681\u2069–\u20682\u2069 of \u20684\u2069");
    });

    it("gives the page size select the footer's direction", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" dir="rtl" />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "rtl");
    });

    it("gives the page size select a DirectionProvider's direction", () => {
      render(
        <DirectionProvider dir="rtl">
          <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
            <DataTable.Pagination compact="never" />
          </DataTable>
        </DirectionProvider>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "rtl");
    });

    it("keeps the select left-to-right unless told otherwise", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "ltr");
    });

    it("writes the footer's own text from labels, which get plain numbers", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination
            compact="never"
            labels={{ summary: (first, last, total) => `${first} à ${last} sur ${total}`, pageSize: "Lignes par page" }}
          />
        </DataTable>,
      );
      expect(visibleText("1 à 2 sur 4")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Lignes par page" })).toBeInTheDocument();
    });

    it("writes the numbers of the default range through formatNumber", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" formatNumber={(value) => `#${value}`} />
        </DataTable>,
      );
      expect(visibleText(rangeText("#1–#2 of #4"))).toBeInTheDocument();
    });

    it("keeps a default footer label when it is given as undefined", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" labels={{ pageSize: undefined }} />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeInTheDocument();
    });

    it("does not let a same-named prop replace the page the pagination is computed from", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" {...({ pageCount: 99, value: 9 } as object)} />
        </DataTable>,
      );
      expect(screen.getByRole("button", { name: /^Page 1/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Page 99/ })).toBeNull();
    });

    it("does not let a same-named prop replace the selection count", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection {...({ count: 50 } as object)} />
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByText("1 selected")).toBeInTheDocument();
    });

    it("throws a clear error for a pagination outside a table", () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => render(<DataTable.Pagination />)).toThrow(/inside a DataTable/);
    });

    it("keeps a table nested in a cell to its own state, toolbar and selection", async () => {
      const user = userEvent.setup();
      const inner: DataTableColumn<Person>[] = [{ id: "n", header: "Inner name", accessor: (row) => row.name, rowHeader: true }];
      render(
        <DataTable<Person>
          aria-label="Outer"
          columns={[{ id: "name", header: "Name", accessor: (row) => row.name, cell: () => (
            <DataTable<Person> aria-label="Inner" columns={inner} data={people.slice(0, 2)} selectionMode="multiple" getRowLabel={(row) => row.name}>
              <DataTable.Toolbar aria-label="Inner tools">
                <DataTable.Selection />
              </DataTable.Toolbar>
            </DataTable>
          ) }]}
          data={people.slice(0, 1)}
          selectionMode="multiple"
          getRowLabel={(row) => row.name}
        >
          <DataTable.Toolbar aria-label="Outer tools">
            <DataTable.Selection />
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(within(screen.getByRole("table", { name: "Inner" })).getByRole("checkbox", { name: "Select Cy" }));
      expect(within(screen.getByRole("group", { name: "Inner tools" })).getByText("1 selected")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Outer tools" })).not.toHaveTextContent("1 selected");
    });

    it("presses a row with Space as well as Enter", async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      renderTable({ onRowClick });
      (screen.getAllByRole("row")[1] as HTMLElement).focus();
      await user.keyboard(" ");
      expect(onRowClick).toHaveBeenCalledTimes(1);
    });

    it("gives a cell cut by a width its whole text as a title, and a cell without a width none", () => {
      renderTable({
        columns: [
          { id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true, width: "4rem" },
          { id: "age", header: "Age", accessor: (row) => row.age },
        ],
      });
      expect(screen.getByRole("rowheader", { name: "Cy" })).toHaveAttribute("title", "Cy");
      expect(screen.getByRole("cell", { name: "30" })).not.toHaveAttribute("title");
    });

    it("passes the pinning and look props to the table", () => {
      const { container } = renderTable({ stickyFirstColumn: true, stickyLastColumn: true, tone: "success", striped: true, variant: "ghost" });
      const table = screen.getByRole("table");
      expect(table.querySelector("thead")?.className).toMatch(/firstColumnSticky/);
      expect(table.querySelector("thead")?.className).toMatch(/lastColumnSticky/);
      expect(table.querySelector("tbody")?.className).toMatch(/bodyStripedTinted/);
      expect(container.querySelector("[class*=containerGhost]")).not.toBeNull();
    });

    it("draws a brand header by default, and none with tone neutral", () => {
      const { unmount } = renderTable();
      expect(screen.getByRole("table").querySelector("thead")?.className).toMatch(/toneBrand/);
      unmount();
      renderTable({ tone: "neutral" });
      expect(screen.getByRole("table").querySelector("thead")?.className).not.toMatch(/tone[A-Z]/);
    });

    it("does not warn about a sortable column with no accessor when sorting is manual", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ sortMode: "manual", columns: [{ id: "x", header: "X", sortable: true }] });
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("is `sortable`"));
    });

    it("does not sort again when only getRowId or isRowSelectable is a new function", () => {
      // `compare` runs only while sorting, unlike `accessor`, which a cell also reads to draw itself.
      const accessor = vi.fn((a: Person, b: Person) => a.name.localeCompare(b.name));
      const cols: DataTableColumn<Person>[] = [{ id: "name", header: "Name", compare: accessor, accessor: (row) => row.name, sortable: true, rowHeader: true }];
      const sorted: DataTableSort = [{ columnId: "name", direction: "ascending" }];
      const { rerender } = render(<DataTable<Person> columns={cols} data={people} aria-label="People" defaultSort={sorted} getRowId={(row) => row.id} />);
      const calls = accessor.mock.calls.length;
      rerender(<DataTable<Person> columns={cols} data={people} aria-label="People" defaultSort={sorted} getRowId={(row) => row.id} isRowSelectable={() => true} />);
      expect(accessor.mock.calls.length).toBe(calls);
    });

    it("warns once for a duplicate row id, however often it is drawn again", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const twins = [people[0] as Person, { ...(people[0] as Person), name: "Twin" }];
      const { rerender } = render(<DataTable<Person> columns={columns} data={twins} aria-label="People" getRowId={(row) => row.id} />);
      rerender(<DataTable<Person> columns={columns} data={twins} aria-label="People" getRowId={(row) => row.id} />);
      expect(warn.mock.calls.filter(([message]) => String(message).includes("two rows have the id")).length).toBe(1);
    });

    it("orders text the same whatever the browser's locale", () => {
      const original = String.prototype.localeCompare;
      const spy = vi.spyOn(String.prototype, "localeCompare").mockImplementation(function (this: string, ...args: Parameters<typeof original>) {
        return original.apply(this, args) * -1;
      });
      renderTable({ defaultSort: [{ columnId: "name", direction: "ascending" }] });
      expect(names()).toEqual(["Ada", "Bo", "Cy", "Di"]);
      spy.mockRestore();
    });
  });
  describe("the column menu", () => {
    const wide: DataTableColumn<Person>[] = [
      { id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true },
      { id: "age", header: "Age", accessor: (row) => row.age },
      { id: "id", header: "Code", accessor: (row) => row.id },
    ];
    const open = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: "Columns" }));
      return screen.findByRole("menu");
    };

    it("lists every column as a checkbox item and hides one when it is turned off", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={wide} data={people} aria-label="People">
          <DataTable.ColumnMenu />
        </DataTable>,
      );
      const menu = await open(user);
      expect(within(menu).getAllByRole("menuitemcheckbox").map((item) => item.textContent)).toEqual(["Name", "Age", "Code"]);
      await user.click(within(menu).getByRole("menuitemcheckbox", { name: "Age" }));
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("columnheader", { name: "Age" })).toBeNull();
      expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    });

    it("starts from the hidden columns and reports each change", async () => {
      const onHiddenColumnsChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={wide} data={people} aria-label="People" defaultHiddenColumns={["id"]} onHiddenColumnsChange={onHiddenColumnsChange}>
          <DataTable.ColumnMenu />
        </DataTable>,
      );
      const menu = await open(user);
      expect(within(menu).getByRole("menuitemcheckbox", { name: "Code" })).toHaveAttribute("aria-checked", "false");
      await user.click(within(menu).getByRole("menuitemcheckbox", { name: "Code" }));
      expect(onHiddenColumnsChange).toHaveBeenLastCalledWith([]);
    });

    it("won't turn off the last column still drawn, and says why", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={wide} data={people} aria-label="People" defaultHiddenColumns={["age", "id"]}>
          <DataTable.ColumnMenu />
        </DataTable>,
      );
      const menu = await open(user);
      const last = within(menu).getByRole("menuitemcheckbox", { name: /Name/ });
      expect(last).toHaveAttribute("aria-disabled", "true");
      expect(last).toHaveTextContent("At least one column stays");
    });

    it("takes its words from labels, and gives the menu the footer-style direction", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={wide} data={people} aria-label="People">
          <DataTable.ColumnMenu labels={{ trigger: "Colonnes", lastColumn: undefined }} dir="rtl" />
        </DataTable>,
      );
      await user.click(screen.getByRole("button", { name: "Colonnes" }));
      expect(await screen.findByRole("menu", { name: "Colonnes" })).toHaveAttribute("dir", "rtl");
    });

    it("gives the menu a DirectionProvider's direction", async () => {
      const user = userEvent.setup();
      render(
        <DirectionProvider dir="rtl">
          <DataTable<Person> columns={wide} data={people} aria-label="People">
            <DataTable.ColumnMenu />
          </DataTable>
        </DirectionProvider>,
      );
      await user.click(screen.getByRole("button", { name: "Columns" }));
      expect(await screen.findByRole("menu")).toHaveAttribute("dir", "rtl");
    });
  });

  describe("sorting by several columns", () => {
    const headerOf = (name: string) => screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });

    it("adds a column with a shift press, keeping the first, and shows the order", async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(screen.getByRole("button", { name: "Name" }));
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("button", { name: "Age" }));
      await user.keyboard("{/Shift}");
      expect(headerOf("Name")).toHaveAttribute("aria-sort", "ascending");
      expect(headerOf("Age")).toHaveAttribute("aria-sort", "ascending");
      expect(screen.getByRole("button", { name: "Name, sort order 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Age, sort order 2" })).toBeInTheDocument();
    });

    it("orders by each column in turn", async () => {
      const user = userEvent.setup();
      const rows: Person[] = [
        { id: "a", name: "Same", age: 3 },
        { id: "b", name: "Same", age: 1 },
        { id: "c", name: "Alone", age: 2 },
      ];
      render(<DataTable<Person> columns={columns} data={rows} aria-label="People" />);
      await user.click(screen.getByRole("button", { name: "Name" }));
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("button", { name: "Age" }));
      await user.keyboard("{/Shift}");
      expect(screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell").at(-1)?.textContent)).toEqual(["2", "1", "3"]);
    });

    it("turns a column round, then takes it off, with the shift press, and the others stay", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ onSortChange });
      await user.click(screen.getByRole("button", { name: "Name" }));
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("button", { name: "Age" }));
      await user.click(screen.getByRole("button", { name: /^Age/ }));
      expect(onSortChange).toHaveBeenLastCalledWith([
        { columnId: "name", direction: "ascending" },
        { columnId: "age", direction: "descending" },
      ]);
      await user.click(screen.getByRole("button", { name: /^Age/ }));
      await user.keyboard("{/Shift}");
      expect(onSortChange).toHaveBeenLastCalledWith([{ columnId: "name", direction: "ascending" }]);
    });

    it("a plain press makes the column the only one", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ onSortChange, defaultSort: [{ columnId: "name", direction: "ascending" }, { columnId: "age", direction: "ascending" }] });
      await user.click(screen.getByRole("button", { name: /^Age/ }));
      expect(onSortChange).toHaveBeenLastCalledWith([{ columnId: "age", direction: "descending" }]);
    });

    it("lists every column in the announcement", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTable({ defaultSort: [{ columnId: "name", direction: "ascending" }] });
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("button", { name: /^Age/ }));
      await user.keyboard("{/Shift}");
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Sorted by Name, ascending, then Age, ascending");
      vi.useRealTimers();
    });

    it("ignores the shift with multiSort off", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ multiSort: false, onSortChange, defaultSort: [{ columnId: "name", direction: "ascending" }] });
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("button", { name: /^Age/ }));
      await user.keyboard("{/Shift}");
      expect(onSortChange).toHaveBeenLastCalledWith([{ columnId: "age", direction: "ascending" }]);
    });
  });

  describe("select all across pages", () => {
    const manual = (props: Partial<DataTableProps<Person>> = {}) =>
      render(
        <DataTable<Person>
          columns={columns}
          data={people}
          aria-label="People"
          sortMode="manual"
          totalCount={137}
          selectionMode="multiple"
          getRowLabel={(row) => row.name}
          {...props}
        >
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection />
          </DataTable.Toolbar>
        </DataTable>,
      );

    it("offers select all with the whole count, and chooses every row without listing ids", async () => {
      const onAllSelectedChange = vi.fn();
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      manual({ onAllSelectedChange, onSelectionChange });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("button", { name: "Select all 137" }));
      expect(onAllSelectedChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByText("137 selected")).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeChecked();
    });

    it("goes back to a list of ids, the page's rows but that one, when a row is unchecked", async () => {
      const onSelectionChange = vi.fn();
      const onAllSelectedChange = vi.fn();
      const user = userEvent.setup();
      manual({ defaultAllSelected: true, onSelectionChange, onAllSelectedChange });
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(onAllSelectedChange).toHaveBeenLastCalledWith(false);
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p3", "p4"]);
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).not.toBeChecked();
      expect(screen.getByText("3 selected")).toBeInTheDocument();
    });

    it("clears everything from the header checkbox and from Clear selection", async () => {
      const user = userEvent.setup();
      manual({ defaultAllSelected: true });
      await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("button", { name: "Select all 137" }));
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
    });

    it("is controlled by allSelected, and a row that can't be chosen stays unchecked", async () => {
      const user = userEvent.setup();
      manual({ allSelected: true, isRowSelectable: (row) => row.id !== "p1" });
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
    });

    it("keeps a client table listing ids, and a manual table without a total offers none", async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection />
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("button", { name: "Select all 4" }));
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      unmount();
      manual({ totalCount: undefined });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.queryByRole("button", { name: /^Select all \d/ })).toBeNull();
    });
  });

  describe("pinning columns", () => {
    it("pins the data columns asked for beside the checkbox and actions columns", () => {
      renderTable({ selectionMode: "multiple", stickyFirstColumn: 2, stickyLastColumn: true, rowActions: () => <button type="button">More</button> });
      const table = screen.getByRole("table");
      expect(table.querySelector("thead")).toHaveAttribute("data-pin-start", "3");
      expect(table.querySelector("tbody")).toHaveAttribute("data-pin-start", "3");
      expect(table.querySelector("thead")).toHaveAttribute("data-pin-end", "2");
    });

    it("pins one column the way it always did when that is all it is asked for", () => {
      renderTable({ stickyFirstColumn: true });
      const head = screen.getByRole("table").querySelector("thead") as HTMLElement;
      expect(head.className).toMatch(/firstColumnSticky/);
      expect(head).not.toHaveAttribute("data-pin-start");
    });
  });

  describe("column sizes", () => {
    const sized: DataTableColumn<Person>[] = [
      { id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true, width: "10rem", minWidth: 80, maxWidth: 400 },
      { id: "age", header: "Age", accessor: (row) => row.age },
    ];
    const widthOfCells = (width: number) =>
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        return { width: this.tagName === "TH" ? width : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
      });

    it("draws no handles unless resizable, and one separator a column when it is", () => {
      const { unmount } = render(<DataTable<Person> columns={sized} data={people} aria-label="People" />);
      expect(screen.queryAllByRole("separator")).toHaveLength(0);
      unmount();
      render(<DataTable<Person> columns={sized} data={people} aria-label="People" resizable />);
      expect(screen.getAllByRole("separator").map((handle) => handle.getAttribute("aria-label"))).toEqual(["Resize Name column", "Resize Age column"]);
    });

    it("lets one column opt out or in", () => {
      const columnsWith: DataTableColumn<Person>[] = [
        { id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true, resizable: false },
        { id: "age", header: "Age", accessor: (row) => row.age },
      ];
      render(<DataTable<Person> columns={columnsWith} data={people} aria-label="People" resizable />);
      expect(screen.getAllByRole("separator")).toHaveLength(1);
    });

    it("says its limits and its keys", () => {
      widthOfCells(200);
      render(<DataTable<Person> columns={sized} data={people} aria-label="People" resizable />);
      const handle = screen.getByRole("separator", { name: "Resize Name column" });
      expect(handle).toHaveAttribute("aria-orientation", "vertical");
      expect(handle).toHaveAttribute("aria-valuemin", "80");
      expect(handle).toHaveAttribute("aria-valuemax", "400");
      expect(handle).toHaveAccessibleDescription(/Arrow keys resize/);
      expect(handle).toHaveAttribute("tabindex", "0");
    });

    it("moves a column with the arrow keys, by larger steps with Shift, to its limits with Home and End, and resets it with Enter", async () => {
      widthOfCells(200);
      const onColumnWidthsChange = vi.fn();
      const user = userEvent.setup();
      render(<DataTable<Person> columns={sized} data={people} aria-label="People" resizable onColumnWidthsChange={onColumnWidthsChange} />);
      screen.getByRole("separator", { name: "Resize Name column" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 216 });
      await user.keyboard("{ArrowLeft}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 184 });
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 264 });
      await user.keyboard("{Home}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 80 });
      await user.keyboard("{End}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 400 });
      await user.keyboard("{Enter}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({});
    });

    it("applies the widths it is given as fixed sizes, and cuts the cells", () => {
      render(<DataTable<Person> columns={sized} data={people} aria-label="People" columnWidths={{ age: 150 }} />);
      const cell = screen.getByRole("columnheader", { name: "Age" });
      expect(cell).toHaveStyle({ inlineSize: "150px", minInlineSize: "150px", maxInlineSize: "150px" });
      expect(screen.getAllByRole("cell", { name: "30" })[0]).toHaveStyle({ maxInlineSize: "150px" });
      expect(cell.className).toMatch(/truncate/);
    });

    it("keeps a width a person gave, uncontrolled, and a controlled one changes only with its prop", async () => {
      widthOfCells(200);
      const user = userEvent.setup();
      const { unmount } = render(<DataTable<Person> columns={sized} data={people} aria-label="People" resizable />);
      screen.getByRole("separator", { name: "Resize Name column" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveStyle({ inlineSize: "216px" });
      unmount();
      render(<DataTable<Person> columns={sized} data={people} aria-label="People" resizable columnWidths={{}} />);
      screen.getByRole("separator", { name: "Resize Name column" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveStyle({ inlineSize: "216px" });
    });

    it("sizes the checkbox and actions columns", () => {
      render(
        <DataTable<Person>
          columns={sized}
          data={people}
          aria-label="People"
          selectionMode="multiple"
          selectionColumnWidth="5rem"
          actionsColumnWidth="7rem"
          rowActions={() => <button type="button">More</button>}
        />,
      );
      const header = screen.getAllByRole("columnheader");
      expect(header[0]).toHaveStyle({ inlineSize: "5rem", maxInlineSize: "5rem" });
      expect(header.at(-1)).toHaveStyle({ inlineSize: "7rem", maxInlineSize: "7rem" });
    });
  });
  describe("expandable rows", () => {
    const detail = (row: Person) => <p>Detail of {row.name}</p>;
    const renderExpandable = (props: Partial<DataTableProps<Person>> = {}) =>
      render(
        <DataTable<Person>
          columns={columns}
          data={people}
          aria-label="People"
          getRowLabel={(row) => row.name}
          renderExpandedRow={detail}
          {...props}
        />,
      );

    it("adds a column of expand buttons, named for their rows, with a heading only a screen reader reads", () => {
      renderExpandable();
      expect(screen.getByRole("columnheader", { name: "Details" })).toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Expand Cy" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).not.toHaveAttribute("aria-controls");
      expect(screen.queryByText("Detail of Cy")).toBeNull();
    });

    it("opens a row's detail in one cell as wide as the table, and closes it again", async () => {
      const user = userEvent.setup();
      renderExpandable({ selectionMode: "multiple" });
      await user.click(screen.getByRole("button", { name: "Expand Cy" }));
      const open = screen.getByRole("button", { name: "Collapse Cy" });
      expect(open).toHaveAttribute("aria-expanded", "true");
      const detailRow = screen.getByText("Detail of Cy").closest("tr") as HTMLElement;
      expect(open).toHaveAttribute("aria-controls", detailRow.id);
      // the checkbox column, the expand column, and two data columns
      expect(detailRow.querySelector("td")).toHaveAttribute("colspan", "4");
      await user.click(open);
      expect(screen.queryByText("Detail of Cy")).toBeNull();
      expect(screen.getByRole("button", { name: "Expand Cy" })).toHaveFocus();
    });

    it("puts the expand column after the checkboxes", () => {
      renderExpandable({ selectionMode: "multiple" });
      const [first, second] = screen.getAllByRole("columnheader");
      expect(within(first as HTMLElement).getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
      expect(second).toHaveAccessibleName("Details");
    });

    it("starts from defaultExpanded and reports each change", async () => {
      const onExpandedChange = vi.fn();
      const user = userEvent.setup();
      renderExpandable({ defaultExpanded: ["p2"], onExpandedChange });
      expect(screen.getByText("Detail of Ada")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Expand Bo" }));
      expect(onExpandedChange).toHaveBeenLastCalledWith(["p2", "p3"]);
      await user.click(screen.getByRole("button", { name: "Collapse Ada" }));
      expect(onExpandedChange).toHaveBeenLastCalledWith(["p3"]);
    });

    it("closes the open row when another opens, in single mode", async () => {
      const user = userEvent.setup();
      renderExpandable({ expandMode: "single", defaultExpanded: ["p2"] });
      await user.click(screen.getByRole("button", { name: "Expand Bo" }));
      expect(screen.queryByText("Detail of Ada")).toBeNull();
      expect(screen.getByText("Detail of Bo")).toBeInTheDocument();
    });

    it("a controlled table changes only when its prop does", async () => {
      const user = userEvent.setup();
      renderExpandable({ expanded: [] });
      await user.click(screen.getByRole("button", { name: "Expand Cy" }));
      expect(screen.queryByText("Detail of Cy")).toBeNull();
    });

    it("leaves the cell of a row with no detail empty", () => {
      renderExpandable({ isRowExpandable: (row) => row.id !== "p1" });
      expect(screen.queryByRole("button", { name: "Expand Cy" })).toBeNull();
      expect(screen.getByRole("button", { name: "Expand Ada" })).toBeInTheDocument();
    });

    it("keeps the open rows across pages and sorting", async () => {
      const user = userEvent.setup();
      const many: Person[] = Array.from({ length: 6 }, (_, index) => ({ id: `r${index}`, name: `P${index}`, age: index }));
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" getRowLabel={(row) => row.name} renderExpandedRow={detail} defaultPageSize={3}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      await user.click(screen.getByRole("button", { name: "Expand P0" }));
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(screen.queryByText("Detail of P0")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Previous page" }));
      expect(screen.getByText("Detail of P0")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(screen.getByText("Detail of P0")).toBeInTheDocument();
    });

    it("keeps the stripes in step with a hidden row between a row and its detail", async () => {
      const user = userEvent.setup();
      renderExpandable({ striped: true });
      await user.click(screen.getByRole("button", { name: "Expand Cy" }));
      const rows = [...(screen.getByRole("table").querySelector("tbody") as HTMLElement).children];
      expect(rows).toHaveLength(6);
      expect(rows[1]).toHaveAttribute("hidden");
      expect(rows[2]).toHaveClass(styles_detailRow());
      expect(rows[3]?.textContent).toContain("Ada");
    });

    it("sets no row count or row index, since detail rows make them unknowable", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" renderExpandedRow={detail} defaultPageSize={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByRole("table")).not.toHaveAttribute("aria-rowcount");
      expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("aria-rowindex");
    });

    it("is never windowed, and says so when asked to be", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const long: Person[] = Array.from({ length: 300 }, (_, index) => ({ id: `r${index}`, name: `P${index}`, age: index }));
      renderExpandable({ data: long, maxHeight: "20rem", virtualize: true });
      expect(screen.getAllByRole("row")).toHaveLength(301);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("rows can be expanded"));
    });

    it("counts the expand column among the columns pinned at the start", () => {
      renderExpandable({ selectionMode: "multiple", stickyFirstColumn: 1 });
      expect(screen.getByRole("table").querySelector("thead")).toHaveAttribute("data-pin-start", "3");
    });

    it("takes its words from labels", async () => {
      const user = userEvent.setup();
      renderExpandable({ labels: { expandRow: (name) => `Ouvrir ${name}`, collapseRow: undefined, expandColumn: "Détails" } });
      expect(screen.getByRole("columnheader", { name: "Détails" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Ouvrir Cy" }));
      expect(screen.getByRole("button", { name: "Collapse Cy" })).toBeInTheDocument();
    });

    it("has no accessibility violations with a row open", async () => {
      const { container } = renderExpandable({ defaultExpanded: ["p1"], selectionMode: "multiple" });
      expect(await axe(container)).toHaveNoViolations();
    });
  });
  describe("effects with cleanup", () => {
    const widthOfCells = (width: number) =>
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        return { width: this.tagName === "TH" ? width : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
      });

    it("works under StrictMode with expanding, resizing, pinning and the column menu together", async () => {
      widthOfCells(200);
      const onColumnWidthsChange = vi.fn();
      const user = userEvent.setup();
      render(
        <StrictMode>
          <DataTable<Person>
            columns={columns}
            data={people}
            aria-label="People"
            getRowLabel={(row) => row.name}
            resizable
            stickyFirstColumn={2}
            renderExpandedRow={(row) => <p>Detail of {row.name}</p>}
            onColumnWidthsChange={onColumnWidthsChange}
          >
            <DataTable.ColumnMenu />
          </DataTable>
        </StrictMode>,
      );
      expect(screen.getByRole("table").querySelector("thead")).toHaveAttribute("data-pin-start", "3");
      await user.click(screen.getByRole("button", { name: "Expand Cy" }));
      expect(screen.getByText("Detail of Cy")).toBeInTheDocument();
      screen.getByRole("separator", { name: "Resize Name column" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 216 });
      await user.click(screen.getByRole("button", { name: "Columns" }));
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("lets go of a drag when the table is removed in the middle of it", () => {
      widthOfCells(200);
      vi.stubGlobal("PointerEvent", MouseEvent);
      const onColumnWidthsChange = vi.fn();
      const { unmount } = render(<DataTable<Person> columns={columns} data={people} aria-label="People" resizable onColumnWidthsChange={onColumnWidthsChange} />);
      const handle = screen.getByRole("separator", { name: "Resize Name column" });
      fireEvent.pointerDown(handle, { button: 0, clientX: 100 });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 130 }));
      expect(onColumnWidthsChange).toHaveBeenCalledTimes(1);
      unmount();
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 160 }));
      expect(onColumnWidthsChange).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it("stops following the pointer when it is let go, or the gesture is cancelled", () => {
      widthOfCells(200);
      vi.stubGlobal("PointerEvent", MouseEvent);
      const onColumnWidthsChange = vi.fn();
      render(<DataTable<Person> columns={columns} data={people} aria-label="People" resizable onColumnWidthsChange={onColumnWidthsChange} />);
      const handle = screen.getByRole("separator", { name: "Resize Name column" });
      for (const end of ["pointerup", "pointercancel"]) {
        fireEvent.pointerDown(handle, { button: 0, clientX: 100 });
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 120 }));
        const calls = onColumnWidthsChange.mock.calls.length;
        window.dispatchEvent(new MouseEvent(end));
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: 160 }));
        expect(onColumnWidthsChange.mock.calls.length).toBe(calls);
      }
      vi.unstubAllGlobals();
    });
  });

  describe("the centred footer (ADR-0200)", () => {
    const many: Person[] = Array.from({ length: 37 }, (_, index) => ({ id: `r${index}`, name: `Person ${index + 1}`, age: index }));
    const centred = (footer: Record<string, unknown> = {}, table: Partial<DataTableProps<Person>> = {}) =>
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPageSize={10} {...table}>
          <DataTable.Pagination compact="never" layout="centered" data-testid="footer" {...footer} />
        </DataTable>,
      );

    it("draws the page size, the page controls and the range in that order, inside a box that holds the attributes", () => {
      centred({ className: "mine", style: { color: "red" }, id: "foot" });
      const box = screen.getByTestId("footer");
      expect(box).toHaveClass("mine", styles.paginationBox as string);
      expect(box).toHaveAttribute("id", "foot");
      expect(box.style.color).toBe("red");
      const order = [screen.getByRole("combobox", { name: "Rows per page" }), screen.getByRole("navigation", { name: "Pagination" }), visibleText(rangeText("1–10 of 37"))];
      for (let index = 1; index < order.length; index += 1) {
        expect(order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it("draws the split footer inside a box that holds the attributes (the container the compact form asks about)", () => {
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPageSize={10}>
          <DataTable.Pagination compact="never" data-testid="footer" className="mine" />
        </DataTable>,
      );
      const box = screen.getByTestId("footer");
      expect(box).toHaveClass(styles.paginationBox as string);
      expect(box).toHaveClass("mine");
      expect(box.firstElementChild).toHaveClass(styles.pagination as string);
    });

    it("leaves the page size's or the range's column empty rather than moving the controls", () => {
      centred({ showSummary: false, showPageSize: false });
      expect(screen.queryByRole("combobox", { name: "Rows per page" })).toBeNull();
      expect(visibleText(rangeText("1–10 of 37"))).toBeNull();
      expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
      // The page size, the controls, the compact pager held behind an inline `display: none`, and the range.
      expect(screen.getByTestId("footer").querySelector(`.${styles.paginationCentered}`)?.children).toHaveLength(4);
    });

    it("marks its collapse step", () => {
      centred({ collapseBelow: "lg" });
      expect(screen.getByTestId("footer").querySelector(`.${styles.paginationCentered}`)).toHaveClass(styles.collapseLg as string);
    });

    it("announces a change of page size through the table, in a status region", async () => {
      const user = userEvent.setup();
      centred();
      await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
      await user.click(await screen.findByRole("option", { name: "25" }));
      expect(await screen.findByText("Showing 25 of 37 rows")).toBeInTheDocument();
      expect(visibleText(rangeText("1–25 of 37"))).toBeInTheDocument();
    });

    it("takes the labels, and the formatted numbers, as the split footer does", () => {
      centred({ labels: { pageSize: "Per page", summary: (first: number, last: number, total: number) => `${first} to ${last} of ${total}` } });
      expect(screen.getByRole("combobox", { name: "Per page" })).toBeInTheDocument();
      expect(visibleText("1 to 10 of 37")).toBeInTheDocument();
    });

    it("warns once in development that collapseBelow does nothing with the split layout, and not for the centred one", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { unmount } = render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPageSize={10}>
          <DataTable.Pagination compact="never" collapseBelow="lg" />
        </DataTable>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`collapseBelow` has no effect with `layout=\"split\"`"));
      unmount();
      warn.mockClear();
      centred({ collapseBelow: "lg" });
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("`collapseBelow` has no effect"));
    });

    it("has no accessibility violations", async () => {
      const { container } = centred();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("the one-row footer below a width (ADR-0201)", () => {
    const many: Person[] = Array.from({ length: 37 }, (_, index) => ({ id: `r${index}`, name: `Person ${index + 1}`, age: index }));
    const footer = (props: Record<string, unknown> = {}, table: Partial<DataTableProps<Person>> = {}) =>
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPageSize={10} {...table}>
          <DataTable.Pagination data-testid="footer" {...props} />
        </DataTable>,
      );
    /** The compact pager's wrapper: held in the page behind an inline `display: none` that the stylesheet overrides below the step. */
    const compactWrapper = () => screen.getByTestId("footer").querySelector<HTMLElement>('[style*="display: none"]') as HTMLElement;

    it("holds a second, always-compact pager whose summary is the range, hidden until the stylesheet shows it", () => {
      footer();
      const wrapper = compactWrapper();
      expect(wrapper).toBeInTheDocument();
      // Hidden from the accessibility tree and the text a person sees, so a render without the stylesheet shows one pager.
      expect(screen.getAllByRole("navigation", { name: "Pagination" })).toHaveLength(1);
      expect(within(wrapper).getByText(rangeText("1–10 of 37"))).toBeInTheDocument();
    });

    it("turns the page from the compact pager and says the new range", async () => {
      const user = userEvent.setup();
      footer();
      await user.click(within(compactWrapper()).getByRole("button", { name: "Next page", hidden: true }));
      expect(within(compactWrapper()).getByText(rangeText("11–20 of 37"))).toBeInTheDocument();
      expect(visibleText(rangeText("11–20 of 37"))).toBeInTheDocument();
    });

    it("reads 'Page 1 of 4' in the compact pager when the range is turned off", () => {
      footer({ showSummary: false });
      expect(within(compactWrapper()).getByText("Page 1 of 4")).toBeInTheDocument();
      expect(visibleText(rangeText("1–10 of 37"))).toBeNull();
    });

    it("draws only one pager with compactBelow never, in either layout", () => {
      const { unmount } = footer({ compactBelow: "never" });
      expect(screen.getByTestId("footer").querySelector('[style*="display: none"]')).toBeNull();
      unmount();
      footer({ compactBelow: "never", layout: "centered" });
      expect(screen.getByTestId("footer").querySelector('[style*="display: none"]')).toBeNull();
    });

    it("marks its step on the footer in both layouts, 'sm' by default", () => {
      const { unmount } = footer();
      expect(screen.getByTestId("footer").querySelector(`.${styles.pagination}`)).toHaveClass(styles.compactSm as string);
      unmount();
      footer({ layout: "centered", compactBelow: "lg" });
      expect(screen.getByTestId("footer").querySelector(`.${styles.paginationCentered}`)).toHaveClass(styles.compactLg as string);
    });

    it("has no accessibility violations with both pagers in the page", async () => {
      const { container } = footer();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
