import type { ReactNode } from "react";
import { renderInline } from "./PropertiesTable";

/** The first column holds names: each name in a comma-separated list is its own code pill. A name never breaks: the column is as wide as its longest name, and a list of names stacks. */
function firstColumn(cell: string, cellIndex: number, plain: boolean): ReactNode {
  if (cellIndex !== 0 || plain || cell.includes("`")) return renderInline(cell);
  return (
    <span className="dbm-proptable-options">
      {cell.split(", ").map((name) => (
        <code key={name}>{name}</code>
      ))}
    </span>
  );
}

/**
 * A plain reference table in the Properties table's look (same header, stripes and code pills), for a docs page whose
 * columns are not a component's props: pass the column labels and the rows. A string cell draws its `` `code` ``
 * spans as code, and the first column is drawn as code. Not part of the published package.
 */
export function ReferenceTable({
  columns,
  rows,
  plainFirstColumn = false,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
  /** Draw the first column as plain text, for category labels (`Layout`) rather than names to type. */
  plainFirstColumn?: boolean;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="dbm-proptable dbm-reftable">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  {typeof cell === "string" ? firstColumn(cell, cellIndex, plainFirstColumn) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
