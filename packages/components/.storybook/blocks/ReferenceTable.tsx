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
  minWidth,
  label,
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
  /**
   * A width (a CSS length) the table keeps on a narrow screen, so a table of sentences scrolls sideways inside its frame instead of squeezing every
   * column to a few words. Left out, the table shrinks to fit, as it always did. With it, give the table a `label` too.
   */
  minWidth?: string;
  /** The name of the frame that scrolls (needed with `minWidth`): the frame is a tab stop, so the keyboard can scroll it, and a named region. */
  label?: string;
}) {
  const scrolls = minWidth !== undefined && label !== undefined;
  return (
    // A scrolling region is reached by the keyboard (WCAG 2.1.1), so the frame is a tab stop.
    <div style={{ overflowX: "auto" }} {...(scrolls ? { role: "region", "aria-label": label, tabIndex: 0 } : undefined)}>
      <table
        className={["dbm-proptable", "dbm-reftable", plainFirstColumn && "dbm-reftable-prose", firstColumnWidth && "dbm-reftable-fixed"].filter(Boolean).join(" ")}
        style={
          firstColumnWidth || minWidth
            ? ({ ...(firstColumnWidth ? { "--dbm-reftable-first-width": firstColumnWidth } : undefined), ...(minWidth ? { minInlineSize: minWidth } : undefined) } as CSSProperties)
            : undefined
        }
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
