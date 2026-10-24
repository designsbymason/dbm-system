import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import type { DataTableProps } from "./DataTable.types";
import { employeeColumns, employees, makeEmployees, type Employee } from "./DataTableStoryKit";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const variants: Array<[string, Partial<DataTableProps<Employee>>]> = [
  ["plain", {}],
  ["sorted", { defaultSort: [{ columnId: "salary", direction: "descending" }] }],
  ["selecting", { selectionMode: "multiple", defaultSelection: ["e2"] }],
  ["with row actions", { rowActions: () => <button type="button">More</button> }],
  ["with a row context menu", { selectionMode: "multiple", rowContextMenu: () => null, rowContextMenuKeys: ["Alt+ArrowDown"] }],
  ["loading", { loading: true }],
  ["empty", { data: [] }],
  ["paged", { defaultPageSize: 5, defaultPage: 2 }],
  ["striped and toned", { striped: true, tone: "brand", size: "sm" }],
  ["a long table, windowed", { data: makeEmployees(500), maxHeight: "20rem" }],
  ["a long table, windowed and selecting", { data: makeEmployees(500), maxHeight: "20rem", selectionMode: "multiple", striped: true }],
  ["a hidden column", { hiddenColumns: ["salary"] }],
  ["an open row", { renderExpandedRow: (row) => <p>Detail of {row.name}</p>, defaultExpanded: ["e2"], striped: true, selectionMode: "multiple" }],
  ["an open row on a paged table", { renderExpandedRow: (row) => <p>Detail of {row.name}</p>, defaultExpanded: ["e7"], defaultPageSize: 5, defaultPage: 2 }],
  ["resizable with widths", { resizable: true, columnWidths: { role: 150 }, selectionMode: "multiple", selectionColumnWidth: "4rem", actionsColumnWidth: "6rem", rowActions: () => <button type="button">More</button> }],
  ["several pinned columns", { stickyFirstColumn: 2, stickyLastColumn: 2, selectionMode: "multiple", rowActions: () => <button type="button">More</button>, stickyHeader: true, maxHeight: "12rem" }],
  ["a sort by several columns", { defaultSort: [{ columnId: "department", direction: "ascending" }, { columnId: "salary", direction: "descending" }] }],
  ["all rows of a server table chosen", { sortMode: "manual", totalCount: 137, selectionMode: "multiple", allSelected: true }],
  ["with the column menu", { children: <DataTable.ColumnMenu />, defaultHiddenColumns: ["started"] }],
  ["every new feature together", { children: [<DataTable.ColumnMenu key="menu" />, <DataTable.Pagination key="pagination" />], renderExpandedRow: (row) => <p>Detail of {row.name}</p>, defaultExpanded: ["e1"], resizable: true, stickyFirstColumn: 1, selectionMode: "multiple", defaultPageSize: 5 }],
];

const markup = (props: Partial<DataTableProps<Employee>>) => (
  <DataTable<Employee> aria-label="Team" columns={employeeColumns} data={employees} {...props} />
);

describe("DataTable on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(markup(props)));
    expect(html).toContain("<table");
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const html = onTheServer(() => renderToString(markup(props)));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      hydrateRoot(container, markup(props), { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(screen.getByRole("table", { name: "Team" })).toBeInTheDocument();
    container.remove();
  });
});
