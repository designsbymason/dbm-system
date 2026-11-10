import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { Toast } from "../../organisms/Toast";
import { DataTableListPage, PeopleListContent, usePeopleList } from "./DataTableListPageStoryKit";
import type { PeopleListOptions } from "./DataTableListPageStoryKit";

// The page's own behaviour: what state it holds, what each change does to the rest, and the states it has nothing to show in. The
// shell, the table and the toolbar have their own tests; what is checked here is the wiring between them. jsdom matches no media query
// and lays out nothing, so layout, direction and printing are in the real-browser checks.
function Page(options: PeopleListOptions) {
  const list = usePeopleList({ latency: 0, total: 37, ...options });
  return (
    <Toast.Provider>
      <PeopleListContent list={list} />
    </Toast.Provider>
  );
}

const loaded = async () => screen.findByRole("checkbox", { name: "Select Ada Lovelace" });
const rowsShown = () => screen.getAllByRole("row").length - 1;

describe("the data-table list page", () => {
  it("loads the first page and says how many people match", async () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: "People" })).toBeInTheDocument();
    await loaded();
    expect(rowsShown()).toBe(10);
    expect(screen.getByText("37 results")).toBeInTheDocument();
  });

  it("draws placeholder rows while the request is in flight", () => {
    render(<Page latency={3_600_000} />);
    expect(within(screen.getByRole("table", { name: "People" })).getAllByText("Loading").length).toBeGreaterThan(0);
    expect(screen.queryByRole("checkbox", { name: /^Select (?!all)/ })).not.toBeInTheDocument();
  });

  it("goes back to page 1, and drops the selection, when a filter changes", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click((await screen.findAllByRole("checkbox", { name: /^Select (?!all)/ }))[0] as HTMLElement);
    expect(screen.getByText(/1 selected/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "example" } });
    await waitFor(() => expect(screen.queryByText(/1 selected/)).not.toBeInTheDocument());
    expect(screen.getByRole("navigation", { name: "Pagination" }).querySelector('[aria-current="page"]')).toHaveTextContent("1");
  });

  it("shows the filters in force as chips, and takes them off one at a time or all at once", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Page initialStatuses={["invited"]} initialDepartments={["design"]} />);
    await screen.findAllByRole("checkbox", { name: /^Select (?!all)/ });
    const chips = screen.getByRole("list", { name: /applied filters/i });
    expect(within(chips).getAllByRole("listitem")).toHaveLength(2);
    await user.click(within(chips).getByRole("button", { name: /Remove filter.*Invited/ }));
    await waitFor(() => expect(within(screen.getByRole("list", { name: /applied filters/i })).getAllByRole("listitem")).toHaveLength(1));
    unmount();

    render(<Page initialStatuses={["invited"]} initialDepartments={["design"]} />);
    await screen.findAllByRole("checkbox", { name: /^Select (?!all)/ });
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(screen.queryByRole("list", { name: /applied filters/i })).not.toBeInTheDocument());
  });

  it("shows only the choice on a filter's button, named with the filter's name, and keeps the button the same", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    const button = screen.getByRole("button", { name: "Status: All" });
    expect(button).toHaveTextContent(/^All$/);
    expect(button.querySelectorAll("svg")).toHaveLength(1);
    await user.click(button);
    await user.click(await screen.findByRole("checkbox", { name: "Invited" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Status: Invited" })).toHaveTextContent(/^Invited$/));
    await user.click(screen.getByRole("checkbox", { name: "Suspended" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Status: 2 selected" })).toBeInTheDocument());
    await user.click(screen.getByRole("checkbox", { name: "All" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Status: All" })).toBeInTheDocument());
  });

  it("draws the status as a subtle badge and the row menu's button as a tertiary one", async () => {
    render(<Page />);
    await loaded();
    // The variant is a class of the atom's own stylesheet (a hashed name in a test).
    const badge = screen.getAllByText("Active")[0] as HTMLElement;
    expect(badge.className).toMatch(/subtle/i);
    expect(screen.getByRole("button", { name: "Actions for Ada Lovelace" }).className).toMatch(/variantTertiary/i);
  });

  it("offers both filters in a sheet from a Filters button, which says how many are in force", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    // The button is only drawn on a phone (a container query) and the stylesheet hides it from the accessibility tree elsewhere, so it is found by its text.
    await user.click(screen.getByText("Filters", { selector: "button" }));
    const sheet = await screen.findByRole("dialog", { name: "Filters" });
    expect(within(sheet).getByRole("group", { name: "Status" })).toBeInTheDocument();
    expect(within(sheet).getByRole("group", { name: "Department" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Clear all" })).toBeDisabled();
    await user.click(within(sheet).getByRole("checkbox", { name: "Invited" }));
    await user.click(within(sheet).getByRole("checkbox", { name: "Design" }));
    await waitFor(() => expect(within(sheet).getByRole("button", { name: "Clear all" })).toBeEnabled());
    await user.click(within(sheet).getByRole("button", { name: "Clear all" }));
    await user.click(within(sheet).getByRole("checkbox", { name: "Suspended" }));
    await user.click(within(sheet).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument());
    // The button says how many are in force with a badge, and is named by it (the stylesheet hides it from the accessibility tree here, so by its attribute).
    expect(document.querySelector('button[aria-label="Filters, 1 active"]')).not.toBeNull();
    expect(within(screen.getByRole("list", { name: /applied filters/i })).getAllByRole("listitem")).toHaveLength(1);
  });

  it("draws the table's centred footer: rows per page, the page controls and the range", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    expect(screen.getByText("1–10 of 37")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("11–20 of 37");
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    await user.click(await screen.findByRole("option", { name: "25" }));
    await screen.findAllByText("1–25 of 37");
    // The change of page size is announced by the table (the range text alone is not a live region).
    await waitFor(() => expect(screen.getAllByRole("status").some((region) => region.textContent === "Showing 25 of 37 rows")).toBe(true));
  });

  it("sorts by a column through the request, and starts again at page 1", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("button", { name: /Name/ }));
    await waitFor(() => expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending"));
    const names = screen.getAllByRole("rowheader").map((cell) => cell.textContent ?? "");
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  });

  it("asks before removing someone, then removes them, says so and puts focus on the heading", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("button", { name: "Actions for Ada Lovelace" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Remove Ada Lovelace?" });
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.queryByRole("checkbox", { name: "Select Ada Lovelace" })).not.toBeInTheDocument());
    expect(await screen.findByText("Ada Lovelace was removed")).toBeInTheDocument();
    expect(screen.getByText("36 results")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus());
  });

  it("changes nothing when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("button", { name: "Actions for Ada Lovelace" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("37 results")).toBeInTheDocument();
  });

  it("chooses every matching person across pages and removes them all after a confirmation that says how many", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await user.click(await screen.findByRole("button", { name: /Select all 37/ }));
    const bar = screen.getByRole("group", { name: /selected|Bulk/i });
    await user.click(within(bar).getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Remove 37 people?" });
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("No one here yet")).toBeInTheDocument();
  });

  it("says there is no one yet, with the first step, when nothing exists and no filter is in force", async () => {
    render(<Page total={0} />);
    expect(await screen.findByText("No one here yet")).toBeInTheDocument();
    // The header's button and the empty state's own offer of the first step.
    expect(screen.getAllByRole("button", { name: "Add person" })).toHaveLength(2);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("says nothing matches, and offers to clear the filters, when a filter is in force", async () => {
    const user = userEvent.setup();
    render(<Page initialQuery="zzzz" />);
    expect(await screen.findByText("No one matches")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search people" })).toHaveValue("zzzz");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await loaded();
    // The box shows what the list is showing: nothing is left in it.
    expect(screen.getByRole("searchbox", { name: "Search people" })).toHaveValue("");
  });

  it("replaces the table with a message and a retry when the request fails, and keeps the heading", async () => {
    const { rerender } = render(<Page fail />);
    expect(await screen.findByText("We couldn't load the list")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "People" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    rerender(<Page fail={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await loaded();
  });

  it("writes a removal in the singular for one person", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await loaded();
    await user.click(screen.getByRole("checkbox", { name: "Select Ada Lovelace" }));
    await user.click(within(screen.getByRole("group", { name: /selected|Bulk/i })).getByRole("button", { name: "Remove" }));
    expect(await screen.findByRole("alertdialog", { name: "Remove 1 person?" })).toBeInTheDocument();
  });

  it("holds up under StrictMode", async () => {
    render(
      <StrictMode>
        <Page />
      </StrictMode>,
    );
    await loaded();
    expect(rowsShown()).toBe(10);
  });

  describe("accessibility", () => {
    it("has no violations loaded", async () => {
      const { container } = render(<Page />);
      await loaded();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations with nothing to show", async () => {
      const { container } = render(<Page total={0} />);
      await screen.findByText("No one here yet");
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations after a failure", async () => {
      const { container } = render(<Page fail />);
      await screen.findByText("We couldn't load the list");
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe("the whole template", () => {
  it("has the page's landmarks once each and one level-one heading", async () => {
    render(<DataTableListPage latency={0} total={37} />);
    await loaded();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(screen.getByRole("main")).getByRole("table", { name: "People" })).toBeInTheDocument();
  });
});
