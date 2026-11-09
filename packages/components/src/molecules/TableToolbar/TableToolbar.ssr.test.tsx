import { act } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TableToolbar } from "./TableToolbar";

// `TableToolbar.Filters` draws a `Drawer` beside its inline toolbar. On the server `window` and `document` are removed, which proves nothing touches them
// while rendering; the hydration test then proves the first client render draws what the server drew, with recoverable errors collected (ADR-0199).
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const bar = (
  <TableToolbar aria-label="Orders tools">
    <TableToolbar.Row>
      <TableToolbar.Filters onClearAll={() => undefined}>
        <TableToolbar.Filter label="Status" count={2}>
          panel
        </TableToolbar.Filter>
        <TableToolbar.Filter label="Owner" value="All" labelPlacement="before">
          panel
        </TableToolbar.Filter>
      </TableToolbar.Filters>
    </TableToolbar.Row>
  </TableToolbar>
);

describe("TableToolbar.Filters on the server", () => {
  it("renders the inline toolbar and the sheet's button without a DOM, and no sheet", () => {
    const html = onTheServer(() => renderToString(bar));
    expect(html).toContain("Status");
    expect(html).toContain('aria-label="Filters, 2 active"');
    expect(html).not.toContain('role="dialog"');
  });

  it("hydrates with no mismatch under StrictMode", async () => {
    const html = onTheServer(() => renderToString(bar));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, <StrictMode>{bar}</StrictMode>, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    container.remove();
  });
});
