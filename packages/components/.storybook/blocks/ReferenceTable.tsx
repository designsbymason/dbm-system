import type { CSSProperties, ReactNode } from "react";
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
  firstColumnWidth,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
  /** Draw the first column as plain text, for category labels (`Layout`) rather than names to type. */
  plainFirstColumn?: boolean;
  /**
   * A width for the first column (a CSS length), instead of "as wide as its longest name". Give the same one to every table on a
   * page, so their first columns line up as the reader scrolls down it; a longer name or list wraps within it.
   */
  firstColumnWidth?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        className={["dbm-proptable", "dbm-reftable", plainFirstColumn && "dbm-reftable-prose", firstColumnWidth && "dbm-reftable-fixed"].filter(Boolean).join(" ")}
        style={firstColumnWidth ? ({ "--dbm-reftable-first-width": firstColumnWidth } as CSSProperties) : undefined}
      >
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
