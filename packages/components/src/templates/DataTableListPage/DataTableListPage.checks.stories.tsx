import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DataTableListPage } from "./DataTableListPageStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout at a width, direction, forced colours, print, a real
// pointer, where focus lands). They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Templates/Data pages/Data Table List Page/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The page's pieces, once the first page of rows has arrived. */
async function loaded(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findAllByRole("checkbox", { name: /^Select (?!all)/ });
  const main = canvas.getByRole("main");
  const table = canvas.getByRole("table");
  // The scroll frame the table is drawn in: its nearest ancestor that clips sideways.
  let frame = table.parentElement as HTMLElement;
  while (frame !== main && getComputedStyle(frame).overflowX === "visible") frame = frame.parentElement as HTMLElement;
  return { canvas, main, table, frame, heading: canvas.getByRole("heading", { level: 1 }) };
}

/** Waits for everything still easing (a menu or a dialog entering) to finish, then a frame, before an element is measured. */
async function settled() {
  await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
}

/** A real mouse click through the Chrome DevTools Protocol, mapping the test iframe's scale. */
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

export const DesktopLayout: Story = {
  name: "On a desktop, the sidebar is a column beside a main area that holds the whole table, and the page does not scroll sideways — layout test",
  // A page of 25 rows, so the main area has more than a window of content to scroll.
  render: () => <DataTableListPage latency={0} initialPageSize={25} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, main, table, frame } = await loaded(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Main" });
    await expect(nav.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().left + 1);
    // The table fits the room it has: nothing scrolls sideways, in the table's frame or the page.
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth + 1);
    await expect(table.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().right);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The toolbar is one row: the search, both filters and the count share a line.
    const search = canvas.getByRole("searchbox", { name: "Search people" });
    const status = within(canvas.getByRole("toolbar", { name: "Filters" })).getByRole("button", { name: /^Status/ });
    await expect(Math.abs(search.getBoundingClientRect().top - status.getBoundingClientRect().top)).toBeLessThan(40);
    // Only the main area scrolls, and the page does not.
    await expect(main.scrollHeight).toBeGreaterThan(main.clientHeight);
    await expect(window.scrollY).toBe(0);
  },
};

export const TabletLayout: Story = {
  name: "On a tablet, the table is as wide as the main area or scrolls inside its own frame, never the page — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const { main } = await loaded(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth + 1);
  },
};

export const PhoneLayout: Story = {
  name: "On a phone, the table scrolls inside its own frame, the header's button and the toolbar stay on screen, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the pinned viewport did not apply.
    await expect(window.innerWidth).toBeLessThan(768);
    const { canvas, main, frame } = await loaded(canvasElement);
    await expect(Math.round(main.getBoundingClientRect().width)).toBe(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth + 1);
    // Five columns and a checkbox do not fit a phone: the table scrolls inside its own frame.
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    // The page's main action and the search are reachable without scrolling sideways.
    const add = canvas.getByRole("button", { name: "Add person" });
    await expect(add.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(add.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    const search = canvas.getByRole("searchbox", { name: "Search people" });
    await expect(search.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    // With rows chosen, the bulk actions fit as well.
    // The toolbar stacks on a phone, so the first row is below the fold: bring it into view before a real press.
    const firstRow = canvas.getAllByRole("checkbox", { name: /^Select (?!all)/ })[0] as HTMLElement;
    firstRow.scrollIntoView({ block: "center" });
    await nextFrame();
    await realClick(firstRow);
    const remove = await canvas.findByRole("button", { name: "Remove" });
    await expect(remove.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const ToolbarIsThreeColumnsAndNothingShifts: Story = {
  name: "The toolbar is the count, the search and the filters in three columns, a filter button keeps its size and place, and no blank line sits between the toolbar and the table — layout test",
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, table } = await loaded(canvasElement);
    const tools = canvas.getByRole("toolbar", { name: "Filters" });
    const summary = canvas.getByText(/^\d+ results?$/);
    const search = canvas.getByRole("searchbox", { name: "Search people" });
    const status = within(tools).getByRole("button", { name: /^Status/ });
    const department = within(tools).getByRole("button", { name: /^Department/ });

    // Three columns on one line, in order: the count, the search (which takes what is left), the filters.
    const mid = (element: Element) => element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;
    await expect(Math.abs(mid(summary) - mid(search))).toBeLessThan(8);
    await expect(Math.abs(mid(search) - mid(status))).toBeLessThan(8);
    await expect(summary.getBoundingClientRect().right).toBeLessThanOrEqual(search.getBoundingClientRect().left);
    await expect(search.getBoundingClientRect().right).toBeLessThanOrEqual(status.getBoundingClientRect().left);
    await expect(status.getBoundingClientRect().right).toBeLessThanOrEqual(department.getBoundingClientRect().left);

    // The filter's name is outside the button, which shows only the choice, with a chevron and no leading icon, the chevron at the end.
    await expect(status).toHaveTextContent(/^All$/);
    await expect(status.textContent).not.toContain("Status");
    const icons = status.querySelectorAll("svg");
    await expect(icons).toHaveLength(1);
    await expect(icons[0]!.getBoundingClientRect().left).toBeGreaterThan(status.getBoundingClientRect().left + status.getBoundingClientRect().width / 2);

    // Choosing options changes neither a button's size nor its place, nor the table's.
    const before = { status: status.getBoundingClientRect(), department: department.getBoundingClientRect(), tableTop: table.getBoundingClientRect().top, tableWidth: table.getBoundingClientRect().width, search: search.getBoundingClientRect() };
    const same = async () => {
      await nextFrame();
      await expect(Math.abs(status.getBoundingClientRect().width - before.status.width)).toBeLessThan(1);
      await expect(Math.abs(status.getBoundingClientRect().left - before.status.left)).toBeLessThan(1);
      await expect(Math.abs(department.getBoundingClientRect().left - before.department.left)).toBeLessThan(1);
      await expect(Math.abs(search.getBoundingClientRect().width - before.search.width)).toBeLessThan(1);
      await expect(Math.abs(table.getBoundingClientRect().width - before.tableWidth)).toBeLessThan(1);
    };
    await realClick(status);
    await realClick(await within(document.body).findByRole("checkbox", { name: "Invited" }));
    await waitFor(() => expect(within(tools).getByRole("button", { name: "Status: Invited" })).toBeVisible());
    await realClick(await within(document.body).findByRole("checkbox", { name: "Suspended" }));
    await waitFor(() => expect(within(tools).getByRole("button", { name: "Status: 2 selected" })).toBeVisible());
    await same();
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await waitFor(() => expect(within(document.body).queryByRole("checkbox", { name: "Invited" })).toBeNull());
    await waitFor(() => expect(canvas.getByRole("list", { name: "Applied filters" })).toBeVisible());
    await waitFor(() => expect(canvas.getByRole("table").querySelectorAll("tbody tr").length).toBeGreaterThan(0));
    await same();
    // No blank line is kept between the toolbar and the table: with nothing chosen and no filter in force, the table starts right after the
    // toolbar's first line.
    await realClick(canvas.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(canvas.queryByRole("list", { name: "Applied filters" })).toBeNull());
    await nextFrame();
    const toolbarBox = canvas.getByRole("group", { name: "People table tools" }).getBoundingClientRect();
    await expect(canvas.getByRole("table").getBoundingClientRect().top - toolbarBox.bottom).toBeLessThan(24);
  },
};

export const FooterHasRowsPerPageCentredPagesAndRangeAtTheEnd: Story = {
  name: "The footer has a small rows-per-page button at the start, the page controls centred and the range right-aligned — layout test",
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, frame } = await loaded(canvasElement);
    const pages = canvas.getByRole("navigation", { name: "Pagination" });
    const size = canvas.getByRole("combobox", { name: "Rows per page" });
    const range = canvas.getByText(/^1–10 of 137$/);
    const tableBox = frame.getBoundingClientRect();
    const sizeBox = size.getBoundingClientRect();
    // The button is a small fixed width at the start, not the room that is left.
    await expect(Math.abs(sizeBox.left - tableBox.left)).toBeLessThan(4);
    await expect(sizeBox.width).toBeLessThan(120);
    // The range is right-aligned at the end of the table, on the same line.
    const rangeBox = range.getBoundingClientRect();
    await expect(Math.abs(rangeBox.right - tableBox.right)).toBeLessThan(4);
    await expect(Math.abs(sizeBox.top + sizeBox.height / 2 - (rangeBox.top + rangeBox.height / 2))).toBeLessThan(8);
    // The page controls are centred under the table, between the two.
    const centred = () => {
      const box = canvas.getByRole("navigation", { name: "Pagination" }).getBoundingClientRect();
      return Math.abs(box.left + box.width / 2 - (tableBox.left + tableBox.width / 2));
    };
    await expect(centred()).toBeLessThan(2);
    await expect(sizeBox.right).toBeLessThanOrEqual(pages.getBoundingClientRect().left);
    await expect(pages.getBoundingClientRect().right).toBeLessThanOrEqual(rangeBox.left);
    // A different page size changes the range and neither the button's width nor where the controls are.
    await realClick(size);
    await realClick(await within(document.body).findByRole("option", { name: "25" }));
    await canvas.findByText(/^1–25 of 137$/);
    await nextFrame();
    await expect(Math.abs(canvas.getByRole("combobox", { name: "Rows per page" }).getBoundingClientRect().width - sizeBox.width)).toBeLessThan(1);
    await expect(centred()).toBeLessThan(2);
  },
};

export const PhoneToolbarIsASearchAndAFiltersButtonWithASheet: Story = {
  tags: ["!dev"],
  name: "On a phone the toolbar is the search and a Filters button that opens both filters in a bottom sheet — layout and interaction test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const { canvas } = await loaded(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search people" });
    const button = canvas.getByRole("button", { name: "Filters" });
    // The two inline filters are not drawn; the search and the button share one line, the count is under them.
    await expect(canvas.getByRole("toolbar", { name: "Filters", hidden: true }).checkVisibility()).toBe(false);
    await expect(button).toBeVisible();
    await expect(Math.abs(search.getBoundingClientRect().top + search.getBoundingClientRect().height / 2 - (button.getBoundingClientRect().top + button.getBoundingClientRect().height / 2))).toBeLessThan(8);
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(canvas.getByText(/^\d+ results?$/).getBoundingClientRect().top).toBeGreaterThanOrEqual(button.getBoundingClientRect().bottom - 1);

    // The sheet comes up from the bottom edge and holds both filters.
    await realClick(button);
    const sheet = await within(document.body).findByRole("dialog", { name: "Filters" });
    await waitFor(() => expect(sheet).toBeVisible());
    await settled();
    const box = sheet.getBoundingClientRect();
    await expect(Math.abs(box.bottom - window.innerHeight)).toBeLessThan(2);
    await expect(box.width).toBeGreaterThanOrEqual(window.innerWidth - 2);
    await expect(within(sheet).getByRole("group", { name: "Status" })).toBeVisible();
    await expect(within(sheet).getByRole("group", { name: "Department" })).toBeVisible();

    // Choosing in the sheet filters the list behind it and the button says how many are in force.
    await realClick(within(sheet).getByRole("checkbox", { name: "Invited" }));
    await realClick(within(sheet).getByRole("checkbox", { name: "Design" }));
    await realClick(within(sheet).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "Filters" })).toBeNull());
    await waitFor(() => expect(canvas.getByRole("button", { name: "Filters, 2 active" })).toBeVisible());
    // Closing the sheet hands focus back to the button that opened it.
    await waitFor(() => expect(canvas.getByRole("button", { name: "Filters, 2 active" })).toHaveFocus());
    await waitFor(() => expect(canvas.getByRole("list", { name: "Applied filters" })).toBeVisible());
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);

    // The footer puts the page controls first, and the rows per page and the range at the two ends under them.
    const pages = canvas.getByRole("navigation", { name: "Pagination" });
    const size = canvas.getByRole("combobox", { name: "Rows per page" });
    const range = canvas.getByText(/^\d+–\d+ of \d+$/);
    await expect(pages.getBoundingClientRect().bottom).toBeLessThanOrEqual(size.getBoundingClientRect().top + 1);
    await expect(Math.abs(size.getBoundingClientRect().top - range.getBoundingClientRect().top)).toBeLessThan(20);
    await expect(size.getBoundingClientRect().right).toBeLessThan(range.getBoundingClientRect().left);
  },
};

export const ForcedColoursInteraction: Story = {
  name: "In forced colours the table and toolbar keep their layout and stay readable — forced colours test",
  render: () => <DataTableListPage latency={0} initialStatuses={["invited"]} initialSelection={["p3"]} />,
  play: async ({ canvasElement }) => {
    const { canvas, main, table } = await loaded(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const before = main.getBoundingClientRect().width;
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(Math.abs(main.getBoundingClientRect().width - before)).toBeLessThan(2);
      // Text is never drawn in the colour of the fill behind it, in the header row, a body row, the status badge, or the chosen row's checkbox (the row's own fill is dropped, so the mark is what shows it).
      for (const element of [within(table).getAllByRole("columnheader")[1], within(table).getAllByRole("cell")[1], canvas.getAllByText("Invited")[0], canvas.getByRole("checkbox", { name: /^Select (?!all)/, checked: true })]) {
        const style = getComputedStyle(element as HTMLElement);
        await expect(style.color).not.toBe(style.backgroundColor);
      }
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

/** Emulates the print media type, runs `check`, and always puts the page back: the type is cleared with an empty list so it cannot leak. */
async function whilePrinting(check: () => Promise<void>) {
  await document.fonts.ready;
  await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
  try {
    await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
    await nextFrame();
    await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    await nextFrame();
    await check();
  } finally {
    await send("Emulation.setEmulatedMedia", { media: "", features: [] });
    await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    await nextFrame();
  }
}

export const PrintsTheTableWithoutTheNavigation: Story = {
  name: "Printed, the whole table is laid out from the top and the sidebar is left out — layout test",
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    const { canvas, main, table } = await loaded(canvasElement);
    const sidebarSlot = canvas.getByRole("navigation", { name: "Main" }).closest<HTMLElement>("[class*='sidebar']") as HTMLElement;
    await expect(getComputedStyle(sidebarSlot).display).not.toBe("none");
    await whilePrinting(async () => {
      await expect(getComputedStyle(sidebarSlot).display).toBe("none");
      // The main area is laid out in full: every row is inside its box, and the page starts at the top.
      await expect(getComputedStyle(main).overflowY).toBe("visible");
      await expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight + 1);
      await expect(within(table).getAllByRole("row")).toHaveLength(11);
      await expect(table.getBoundingClientRect().bottom).toBeLessThanOrEqual(main.getBoundingClientRect().bottom + 1);
      await expect(canvas.getByRole("heading", { level: 1 }).getBoundingClientRect().top).toBeLessThan(window.innerHeight / 2);
    });
  },
};

export const RemoveARowWithARealMouse: Story = {
  tags: ["!dev"],
  name: "A row's menu and the confirmation, chosen with a real mouse inside the shell, remove the row and leave focus on the heading — interaction test",
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    const { canvas, heading } = await loaded(canvasElement);
    const body = within(document.body);
    await realClick(canvas.getByRole("button", { name: "Actions for Ada Lovelace" }));
    const item = await body.findByRole("menuitem", { name: "Remove" });
    await settled();
    // The menu is the top element at its own point: not under the shell's header or the table's frame.
    const itemBox = item.getBoundingClientRect();
    await expect(document.elementFromPoint(itemBox.left + itemBox.width / 2, itemBox.top + itemBox.height / 2)?.closest("[role=menuitem]")).toBe(item);
    await realClick(item);
    const dialog = await body.findByRole("alertdialog", { name: "Remove Ada Lovelace?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await settled();
    // The dialog's buttons are above the page's scrim and header.
    const confirm = within(dialog).getByRole("button", { name: "Remove" });
    const box = confirm.getBoundingClientRect();
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(confirm);
    await realClick(confirm);
    await waitFor(() => expect(canvas.queryByRole("checkbox", { name: "Select Ada Lovelace" })).toBeNull());
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(heading).toHaveFocus());
  },
};

export const RemoveARowWithRealKeys: Story = {
  name: "A row's menu and the confirmation, driven with real keys only, remove the row and leave focus on the heading — interaction test",
  tags: ["!dev"],
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    const { canvas, heading } = await loaded(canvasElement);
    const body = within(document.body);
    const key = async (name: string, code: number, text?: string) => {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: name, code: name, windowsVirtualKeyCode: code, ...(text ? { text } : {}) });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code: name, windowsVirtualKeyCode: code });
    };
    canvas.getByRole("button", { name: "Actions for Ada Lovelace" }).focus();
    await key("Enter", 13, "\r");
    const menu = await body.findByRole("menu");
    await waitFor(() => expect(within(menu).getAllByRole("menuitem")[0]).toHaveFocus());
    // Down to the last item, "Remove", and choose it.
    await key("ArrowDown", 40);
    await key("ArrowDown", 40);
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Remove" })).toHaveFocus());
    await key("Enter", 13, "\r");
    const dialog = await body.findByRole("alertdialog", { name: "Remove Ada Lovelace?" });
    // Focus starts on the safe choice, Cancel; Tab reaches Remove, and Enter confirms.
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus());
    await key("Tab", 9);
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Remove" })).toHaveFocus());
    await key("Enter", 13, "\r");
    await waitFor(() => expect(canvas.queryByRole("checkbox", { name: "Select Ada Lovelace" })).toBeNull());
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(heading).toHaveFocus());
  },
};

export const FilterWithRealKeys: Story = {
  tags: ["!dev"],
  name: "A filter is opened, ticked and closed with the keyboard, and shows as a chip — interaction test",
  render: () => <DataTableListPage latency={0} />,
  play: async ({ canvasElement }) => {
    const { canvas } = await loaded(canvasElement);
    const body = within(document.body);
    const status = within(canvas.getByRole("toolbar", { name: "Filters" })).getByRole("button", { name: /^Status/ });
    status.focus();
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    const invited = await body.findByRole("checkbox", { name: "Invited" });
    await realClick(invited);
    await waitFor(() => expect(canvas.getByRole("list", { name: "Applied filters" })).toBeVisible());
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await waitFor(() => expect(body.queryByRole("checkbox", { name: "Invited" })).toBeNull());
    // Focus is back on the button that opened the filter.
    await waitFor(() => expect(status).toHaveFocus());
  },
};
