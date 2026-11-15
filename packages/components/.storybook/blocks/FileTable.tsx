import type { ReactNode } from "react";
import { DataTable } from "../../src/organisms/DataTable";
import type { DataTableColumn } from "../../src/organisms/DataTable";

/** One row of a {@link FileTable}: the thing named (drawn as code) and what it is. */
export interface FileRow {
  /** The file, path or name, drawn in code. */
  name: string;
  /** One line saying what it is or when to read it. */
  description: ReactNode;
}

const columns: DataTableColumn<FileRow>[] = [
  { id: "name", header: "File", accessor: (row) => row.name, cell: (row) => <code>{row.name}</code>, rowHeader: true, wrap: true, width: "54%" },
  { id: "description", header: "What it is", accessor: (row) => String(row.description), cell: (row) => row.description, wrap: true, width: "46%" },
];

/**
 * A short two-column table in the look of the Components and Templates tables on the Getting started page (the DataTable in its
 * `brand` tone, striped), for a list of files or names with a line each. Not part of the published package.
 */
export function FileTable({ rows, label }: { rows: FileRow[]; label: string }) {
  return (
    <div className="sb-unstyled dbm-getting-started__filetable">
      <DataTable aria-label={label} columns={columns} data={rows} getRowId={(row) => row.name} tone="brand" striped />
    </div>
  );
}
