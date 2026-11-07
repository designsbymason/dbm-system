import { act, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DataTableListPage, dataTableListPageCopy } from "./DataTableListPageStoryKit";

// Server rendering. The unit project runs in jsdom, where `window` and `document` exist, so the server render is done with both
// removed: what it proves is that nothing touches them while rendering. The hydration test then proves the first client render
// draws what the server drew (the request has not answered yet on either side), with the recoverable errors collected.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("the data-table list page on the server", () => {
  it("renders the page with its landmarks and the table's placeholder rows without a DOM", () => {
    const html = onTheServer(() => renderToString(<DataTableListPage />));
    expect(html).toContain(`<h1`);
    expect(html).toContain(dataTableListPageCopy.title);
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain("<table");
  });

  it("hydrates with no mismatch", async () => {
    const html = onTheServer(() => renderToString(<DataTableListPage latency={0} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <DataTableListPage latency={0} />
        </StrictMode>,
        { onRecoverableError: (error) => recoverable.push(error) },
      );
    });
    expect(recoverable).toEqual([]);
    // The request answers after hydration: the rows arrive.
    expect(await screen.findAllByRole("checkbox", { name: /^Select (?!all)/ })).not.toHaveLength(0);
    container.remove();
  });
});
