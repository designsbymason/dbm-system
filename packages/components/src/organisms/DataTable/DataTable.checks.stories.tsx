import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { ContextMenu } from "../ContextMenu";
import { DataTable } from "./DataTable";
import { DensityDemo, EmployeeDetail, SavedViewsDemo, employeeColumns, employees, makeEmployees, RowMenu, ServerDemo, TeamDemo, type Employee } from "./DataTableStoryKit";

// Real-browser checks for what jsdom can't evaluate: the height of a row against its token, a window of rows over a long
// table, the ellipsis, the size of a target, the real Tab order and a pointer on a menu inside the scrolling frame. Hidden
// from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Data Display/DataTable/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A length token such as `2.75rem` in pixels. */
function tokenPx(name: string): number {
  const root = getComputedStyle(document.documentElement);
  return Number.parseFloat(root.getPropertyValue(name)) * Number.parseFloat(root.fontSize);
}

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

/** The point the test iframe's own scale puts an element's centre at, for a real pointer driven through the protocol. */
function pointOf(element: Element, offsetX = 0) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return {
    x: (frame?.left ?? 0) + (rect.left + rect.width / 2 + offsetX) * scale,
    y: (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale,
    scale,
  };
}

/** Presses on an element, moves `distance` pixels sideways in steps, and lets go: a real drag. */
async function realDrag(element: Element, distance: number) {
  const { x, y, scale } = pointOf(element);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  const steps = 6;
  for (let step = 1; step <= steps; step += 1) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + (distance * scale * step) / steps, y, buttons: 1 });
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x + distance * scale, y, button: "left", clickCount: 1 });
}

const bodyRows = (table: HTMLElement) => [...table.querySelectorAll<HTMLElement>("tbody > tr:not([aria-hidden]):not([hidden])")];
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export const RowHeightsMatchTheirTokensRowHeights: Story = {
  name: "Every row is exactly its token's height, at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sizes.map((size) => (
        <DataTable<Employee>
          key={size}
          aria-label={`Size ${size}`}
          columns={employeeColumns}
          data={employees.slice(0, 3)}
          size={size}
          selectionMode="multiple"
          rowActions={(row) => <RowMenu row={row} size={size} />}
        />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of sizes) {
      const table = body.getByRole("table", { name: `Size ${size}` });
      const expected = tokenPx(`--dbm-data-table-row-height-${size}`);
      for (const row of bodyRows(table)) {
        await expect(Math.abs(row.getBoundingClientRect().height - expected)).toBeLessThan(1);
      }
    }
  },
};

export const LongTableDrawsAWindow: Story = {
  name: "A long table draws a window and keeps the scrollbar true",
  render: () => (
    <DataTable<Employee> aria-label="Long" columns={employeeColumns} data={makeEmployees(5000)} maxHeight="20rem" stickyHeader striped />
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Long" });
    const frame = table.parentElement as HTMLElement;
    await waitFor(() => expect(bodyRows(table).length).toBeGreaterThan(5));
    await expect(bodyRows(table).length).toBeLessThan(80);
    const rowPx = tokenPx("--dbm-data-table-row-height-md");
    // 5000 rows' worth of height in all (plus the header), though few are drawn
    await waitFor(() => expect(Math.abs(frame.scrollHeight - (5000 * rowPx + table.querySelector("thead")!.getBoundingClientRect().height))).toBeLessThan(rowPx * 2));
    frame.scrollTop = frame.scrollHeight;
    await waitFor(() => expect(within(table).getByRole("rowheader", { name: /5000$/ })).toBeInTheDocument());
    await expect(bodyRows(table).length).toBeLessThan(80);
    // after a long scroll the alternating stripes are still in step with the rows' positions
    const rows = bodyRows(table);
    const fill = (row: HTMLElement) => getComputedStyle(row).backgroundColor;
    for (let index = 1; index < rows.length; index += 1) {
      const a = Number((rows[index - 1] as HTMLElement).getAttribute("aria-rowindex"));
      const b = Number((rows[index] as HTMLElement).getAttribute("aria-rowindex"));
      await expect(b - a).toBe(1);
      await expect(fill(rows[index] as HTMLElement) === fill(rows[index - 1] as HTMLElement)).toBe(false);
    }
    // the stripe follows the row's position in the data, not the window's
    const evens = rows.filter((row) => Number(row.getAttribute("aria-rowindex")) % 2 === 0).map(fill);
    await expect(new Set(evens).size).toBe(1);
  },
};

export const LongCellsAreCutWithAnEllipsis: Story = {
  name: "A cell with a width is cut with an ellipsis instead of widening",
  render: () => (
    <DataTable<Employee>
      aria-label="Cut"
      columns={employeeColumns.map((column) => (column.id === "name" ? { ...column, width: "8rem" } : column))}
      data={[{ ...(employees[0] as Employee), name: "A very long name that cannot possibly fit in eight rem of width" }]}
    />
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Cut" });
    const cell = table.querySelector<HTMLElement>("tbody th") as HTMLElement;
    await expect(getComputedStyle(cell).textOverflow).toBe("ellipsis");
    await expect(cell.scrollWidth).toBeGreaterThan(cell.clientWidth);
    await expect(cell.getBoundingClientRect().width).toBeLessThanOrEqual(tokenPx("--dbm-space-32") + 1);
    await expect(cell.getBoundingClientRect().height).toBeCloseTo(tokenPx("--dbm-data-table-row-height-md"), 0);
  },
};

export const TargetsAreBigEnough: Story = {
  name: "Every control is at least 24 by 24 pixels, at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sizes.map((size) => (
        <DataTable<Employee>
          key={size}
          aria-label={`Targets ${size}`}
          columns={employeeColumns}
          data={employees.slice(0, 2)}
          size={size}
          selectionMode="multiple"
          rowActions={(row) => <RowMenu row={row} size={size} />}
        />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of sizes) {
      const table = body.getByRole("table", { name: `Targets ${size}` });
      const controls = table.querySelectorAll<HTMLElement>("button");
      await expect(controls.length).toBeGreaterThan(8);
      for (const control of controls) {
        const rect = control.getBoundingClientRect();
        if (Math.min(rect.width, rect.height) >= 24) continue;
        // drawn smaller than the minimum: its hit area is extended by a pseudo-element, which getBoundingClientRect can't see,
        // so press points 11px either side of the centre (inside a 24px square) and see that the control answers
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;
        for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
          await expect(document.elementFromPoint(centreX + dx, centreY + dy)).toBe(control);
        }
      }
    }
  },
};

export const KeyboardSortKeepsFocus: Story = {
  name: "Sorting from the keyboard leaves focus on the heading's button",
  render: () => <DataTable<Employee> aria-label="Keys" columns={employeeColumns} data={employees.slice(0, 6)} />,
  play: async () => {
    const table = body.getByRole("table", { name: "Keys" });
    const name = within(table).getByRole("button", { name: "Name" });
    name.focus();
    await userEvent.keyboard("{Enter}");
    await expect(name).toHaveFocus();
    await expect(within(table).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    await userEvent.keyboard(" ");
    await expect(name).toHaveFocus();
    await expect(within(table).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
    // the ring is drawn on the button, inside its box
    await expect(getComputedStyle(name).outlineStyle).toBe("solid");
    await expect(Number.parseFloat(getComputedStyle(name).outlineOffset)).toBeLessThan(0);
  },
};

export const TabOrderIsReadingOrder: Story = {
  name: "Tab goes through the toolbar, the header, the rows, then the footer",
  render: () => <TeamDemo size="sm" />,
  play: async () => {
    const search = body.getByRole("searchbox", { name: "Search the team" });
    search.focus();
    const seen: string[] = [];
    for (let step = 0; step < 40; step += 1) {
      await userEvent.tab();
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) break;
      seen.push(active.getAttribute("aria-label") ?? active.textContent ?? "");
      if (seen.at(-1) === "Next page") break;
    }
    const at = (needle: string | RegExp) => seen.findIndex((text) => (typeof needle === "string" ? text === needle : needle.test(text)));
    await expect(at("Select all rows")).toBeGreaterThanOrEqual(0);
    await expect(at("Name")).toBeGreaterThan(at("Select all rows"));
    await expect(at(/^Select /)).toBeGreaterThanOrEqual(0);
    const firstRow = seen.findIndex((text, index) => index > at("Name") && /^Select .* 1$/.test(text));
    await expect(firstRow).toBeGreaterThan(at("Name"));
    await expect(at("Rows per page")).toBeGreaterThan(firstRow);
    await expect(at("Next page")).toBeGreaterThan(at("Rows per page"));
  },
};

export const RowMenuWorksWithARealPointer: Story = {
  name: "A row's menu opens above the table and is chosen with a real pointer",
  render: () => (
    <div style={{ minHeight: "16rem" }}>
      <DataTable<Employee>
        aria-label="Menu"
        columns={employeeColumns}
        data={employees.slice(0, 4)}
        maxHeight="12rem"
        stickyHeader
        stickyLastColumn
        rowActions={(row) => <RowMenu row={row} />}
      />
    </div>
  ),
  play: async () => {
    const trigger = body.getAllByRole("button", { name: /^Actions for/ })[0] as HTMLElement;
    await realClick(trigger);
    const menu = await body.findByRole("menu");
    const edit = within(menu).getByRole("menuitem", { name: "Edit" });
    await nextFrame();
    const rect = edit.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("[role=menuitem]")).toBe(edit);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

export const SelectedRowIsDrawnAndSurvivesASort: Story = {
  name: "A chosen row has its fill, and keeps it when sorted",
  render: () => <DataTable<Employee> aria-label="Chosen" columns={employeeColumns} data={employees.slice(0, 6)} selectionMode="multiple" getRowLabel={(row) => row.name} />,
  play: async () => {
    const table = body.getByRole("table", { name: "Chosen" });
    const first = within(table).getAllByRole("checkbox")[1] as HTMLElement;
    const row = first.closest("tr") as HTMLElement;
    const plain = getComputedStyle(bodyRows(table)[2] as HTMLElement).backgroundColor;
    await userEvent.click(first);
    // the row eases to its fill, so wait for it
    await waitFor(() => expect(getComputedStyle(row).backgroundColor).not.toBe(plain));
    await expect(row).toHaveAttribute("data-selected");
    await userEvent.click(within(table).getByRole("button", { name: "Salary" }));
    const still = within(table).getAllByRole("checkbox", { checked: true });
    await expect(still).toHaveLength(1);
    await expect(still[0]?.closest("tr")).toHaveAttribute("data-selected");
  },
};

/** The opaque colour a CSS colour resolves to, as 0–255 channels. */
function channels(value: string): [number, number, number] {
  const probe = document.createElement("div");
  probe.style.color = value;
  document.body.append(probe);
  const [r = 0, g = 0, b = 0] = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) ?? [];
  probe.remove();
  return [r, g, b];
}
const luminance = ([r, g, b]: number[]) => {
  const part = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * part(r as number) + 0.7152 * part(g as number) + 0.0722 * part(b as number);
};
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const themes = ["purple-light", "purple-dark", "emerald-light", "emerald-dark"] as const;

export const RightToLeftReadsAndMirrors: Story = {
  name: "Right to left: the range reads in order, the columns mirror and the select follows the page",
  render: () => (
    <div dir="rtl">
      <DataTable<Employee> aria-label="Mirrored" columns={employeeColumns} data={employees} defaultPageSize={5} selectionMode="multiple">
        <DataTable.Pagination dir="rtl" compact="never" />
      </DataTable>
    </div>
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Mirrored" });
    const headers = [...table.querySelectorAll<HTMLElement>("thead th")];
    // the checkbox column is first in reading order, so it is the rightmost
    await expect(headers[0]?.getBoundingClientRect().left).toBeGreaterThan(headers[1]?.getBoundingClientRect().left as number);
    // a number's end is the left edge in right-to-left, and the figures sit there
    const money = [...table.querySelectorAll<HTMLElement>("tbody td")].find((cell) => cell.textContent?.startsWith("$")) as HTMLElement;
    const text = document.createRange();
    text.selectNodeContents(money);
    const cell = money.getBoundingClientRect();
    await expect(text.getBoundingClientRect().left - cell.left).toBeLessThan(cell.right - text.getBoundingClientRect().right);
    // "1–5 of 24": each number is isolated, so the first one is the rightmost of the range's numbers
    const range = [...document.querySelectorAll<HTMLElement>("span")].find((span) => span.textContent?.replace(/[⁨⁩]/g, "") === "1–5 of 24") as HTMLElement;
    const node = range.firstChild as Text;
    const at = (needle: string) => {
      const index = (node.textContent as string).lastIndexOf(needle);
      const part = document.createRange();
      part.setStart(node, index);
      part.setEnd(node, index + needle.length);
      return part.getBoundingClientRect();
    };
    await expect(at("1").left).toBeGreaterThan(at("24").left);
    await expect(body.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "rtl");
  },
};

export const ForcedColoursKeepTheMarks: Story = {
  name: "Forced colours: a chosen row keeps its marker, and the sort button and header text stay drawn",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <DataTable<Employee> aria-label="Forced" columns={employeeColumns} data={employees.slice(0, 4)} selectionMode="multiple" getRowLabel={(row) => row.name} />
      <DataTable<Employee>
        aria-label="Forced parts"
        columns={employeeColumns}
        data={employees.slice(0, 3)}
        resizable
        stickyFirstColumn={2}
        defaultExpanded={["e1"]}
        renderExpandedRow={(row) => <EmployeeDetail row={row} />}
        getRowLabel={(row) => row.name}
      />
    </div>
  ),
  play: async () => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      // Resolved once, outside `waitFor`: building a probe element inside its callback changes the document, which re-runs the callback.
      const canvas = channelsCss("Canvas");
      const highlight = channelsCss("Highlight");
      const table = body.getByRole("table", { name: "Forced" });
      const first = within(table).getByRole("checkbox", { name: "Select Ada Lovelace 1" });
      const cell = first.closest("td") as HTMLElement;
      const other = within(table).getByRole("checkbox", { name: "Select Bo Silva 2" }).closest("td") as HTMLElement;
      await expect(rgbOf(getComputedStyle(cell).borderInlineStartColor)).toBe(canvas);
      await userEvent.click(first);
      await waitFor(() => expect(rgbOf(getComputedStyle(cell).borderInlineStartColor)).toBe(highlight));
      await expect(rgbOf(getComputedStyle(other).borderInlineStartColor)).toBe(canvas);
      await expect(getComputedStyle(cell).borderInlineStartWidth).toBe(getComputedStyle(other).borderInlineStartWidth);
      // the sort button's text and arrow are still drawn in a colour of the mode's, not the page's
      const button = within(table).getByRole("button", { name: "Name" });
      await expect(getComputedStyle(button).color).not.toBe("rgba(0, 0, 0, 0)");
      const arrow = button.querySelector("svg") as SVGElement;
      await expect(getComputedStyle(arrow).opacity).not.toBe("0");
      // the newer parts keep what separates them: the open row joins its detail (its divider is the page's, not a drawn line), the
      // resize handle's line is drawn in the heading's own colour, and the last pinned column keeps its divider
      const parts = body.getByRole("table", { name: "Forced parts" });
      const openRow = within(parts).getByRole("button", { name: /^Collapse/ }).closest("tr") as HTMLElement;
      await expect(rgbOf(getComputedStyle(openRow.firstElementChild as Element).borderBlockEndColor)).toBe(canvas);
      const handle = within(parts).getAllByRole("separator")[0] as HTMLElement;
      const line = getComputedStyle(handle, "::after");
      await expect(line.borderInlineEndStyle).toBe("solid");
      await expect(Number.parseFloat(line.borderInlineEndWidth)).toBeGreaterThan(0);
      await expect(rgbOf(line.borderInlineEndColor)).toBe(rgbOf(getComputedStyle(handle.closest("th") as Element).color));
      // the expand column and two data columns are pinned, and the third of them draws the divider
      const pinned = parts.querySelector("tbody tr:not([hidden]):not([id])")?.children[2] as HTMLElement;
      await expect(getComputedStyle(pinned).borderInlineEndStyle).toBe("solid");
      await expect(getComputedStyle(pinned).borderInlineEndWidth).not.toBe("0px");
      await expect(getComputedStyle(pinned).position).toBe("sticky");
      button.focus();
      await userEvent.keyboard("{Tab}{Shift>}{Tab}{/Shift}");
      await expect(getComputedStyle(button).outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

/** What a colour resolves to, as its red, green and blue channels written the way the browser writes a computed colour. */
function channelsCss(value: string): string {
  const [r, g, b] = channels(value);
  return `${r},${g},${b}`;
}
/** A computed `rgb(…)` or `rgba(…)` as the same three channels, so a system colour's own alpha doesn't count. */
const rgbOf = (computed: string): string => (computed.match(/[\d.]+/g) ?? []).slice(0, 3).join(",");

export const OnAPhone: Story = {
  name: "On a phone: the table scrolls inside its frame, the page doesn't, and the footer wraps",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <TeamDemo size="sm" />,
  play: async () => {
    // fails loudly if the viewport didn't apply
    await expect(window.innerWidth).toBeLessThan(640);
    const table = body.getByRole("table", { name: "Team" });
    const frame = table.parentElement as HTMLElement;
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const footer = body.getByRole("navigation").parentElement as HTMLElement;
    for (const child of footer.querySelectorAll<HTMLElement>("*")) {
      await expect(child.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth + 1);
    }
    // the range and the controls stack instead of squeezing: the page controls sit under the range
    const range = footer.firstElementChild as HTMLElement;
    await expect(body.getByRole("navigation").getBoundingClientRect().top).toBeGreaterThanOrEqual(range.getBoundingClientRect().bottom - 1);
  },
};

export const ChosenRowIsMarkedWithoutMovingAnything: Story = {
  name: "A chosen row's marker takes no room, and its fill differs from a brand stripe",
  render: () => (
    <DataTable<Employee> aria-label="Marked" columns={employeeColumns} data={employees.slice(0, 6)} selectionMode="multiple" striped getRowLabel={(row) => row.name} />
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Marked" });
    const rows = [...table.querySelectorAll<HTMLElement>("tbody tr")];
    // the checkbox column and the first two columns after it: where the marker would push them if it took room
    const boxes = (row: HTMLElement) => [...row.children].slice(0, 3).map((child) => child.getBoundingClientRect().left);
    const widthOfSelectCell = () => (rows[0] as HTMLElement).firstElementChild?.getBoundingClientRect().width;
    const before = boxes(rows[0] as HTMLElement);
    const selectWidth = widthOfSelectCell();
    await userEvent.click(within(rows[0] as HTMLElement).getByRole("checkbox"));
    await waitFor(() => expect(getComputedStyle(rows[0] as HTMLElement).backgroundColor).not.toBe("rgba(0, 0, 0, 0)"));
    await expect(boxes(rows[0] as HTMLElement)).toEqual(before);
    await expect(widthOfSelectCell()).toBe(selectWidth);
    const marker = getComputedStyle((rows[0] as HTMLElement).firstElementChild as HTMLElement);
    await expect(marker.borderInlineStartWidth).not.toBe("0px");
    await expect(rgbOf(marker.borderInlineStartColor)).toBe(channelsCss("var(--dbm-border-brand)"));
    // striped rows are `bg.brand-subtle`; a chosen one is one step further, so the two are told apart
    await expect(getComputedStyle(rows[0] as HTMLElement).backgroundColor).not.toBe(getComputedStyle(rows[1] as HTMLElement).backgroundColor);
    const unchosen = (rows[2] as HTMLElement).firstElementChild as HTMLElement;
    await expect(getComputedStyle(unchosen).borderInlineStartColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const SortArrowsKeepTheirContrast: Story = {
  name: "A sort arrow that isn't sorted, and a resize handle's line, keep 3:1 against their header in all four themes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <DataTable<Employee> aria-label="Brand header" resizable columns={employeeColumns} data={employees.slice(0, 2)} />
      <DataTable<Employee> aria-label="Neutral header" resizable tone="neutral" columns={employeeColumns} data={employees.slice(0, 2)} />
    </div>
  ),
  play: async () => {
    const root = document.documentElement;
    const original = root.getAttribute("data-theme");
    try {
      for (const theme of themes) {
        root.setAttribute("data-theme", theme);
        await nextFrame();
        for (const [name, headerFill] of [["Brand header", "var(--dbm-bg-brand)"], ["Neutral header", "var(--dbm-bg-surface)"]] as const) {
          const arrow = within(body.getByRole("table", { name })).getAllByRole("button")[0]?.querySelector("svg") as SVGElement;
          const style = getComputedStyle(arrow);
          const fg = channels(style.color);
          const bg = channels(headerFill);
          const opacity = Number(style.opacity);
          const blended = fg.map((channel, index) => channel * opacity + (bg[index] as number) * (1 - opacity));
          await expect(contrast(blended, bg), `${theme}, ${name}`).toBeGreaterThanOrEqual(3);
          // the resize handle's line is a pseudo-element: its own opacity over the header's text colour
          const handle = within(body.getByRole("table", { name })).getAllByRole("separator")[0] as HTMLElement;
          const line = getComputedStyle(handle, "::after");
          const lineColour = channels(line.borderInlineEndColor);
          const lineOpacity = Number(line.opacity);
          const lineBlend = lineColour.map((channel, index) => channel * lineOpacity + (bg[index] as number) * (1 - lineOpacity));
          await expect(contrast(lineBlend, bg), `${theme}, ${name}, resize handle`).toBeGreaterThanOrEqual(3);
        }
      }
    } finally {
      if (original === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", original);
    }
  },
};

const wideColumns = employeeColumns.map((column) => ({ ...column, minWidth: "9rem" }));

export const SeveralPinnedColumnsStayPut: Story = {
  name: "Several pinned columns sit against each other and stay put while the table scrolls sideways, in both directions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "36rem" }}>
      <DataTable<Employee>
        aria-label="Pinned left to right"
        columns={wideColumns}
        data={employees.slice(0, 3)}
        selectionMode="multiple"
        stickyFirstColumn={2}
        stickyLastColumn
        rowActions={(row) => <RowMenu row={row} />}
      />
      <div dir="rtl">
        <DataTable<Employee>
          aria-label="Pinned right to left"
          columns={wideColumns}
          data={employees.slice(0, 3)}
          selectionMode="multiple"
          stickyFirstColumn={2}
          stickyLastColumn
          rowActions={(row) => <RowMenu row={row} />}
        />
      </div>
    </div>
  ),
  play: async () => {
    for (const [name, rtl] of [["Pinned left to right", false], ["Pinned right to left", true]] as const) {
      const table = body.getByRole("table", { name });
      const frame = table.parentElement as HTMLElement;
      await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
      // far along the scroll, in the direction the page reads
      frame.scrollLeft = rtl ? -(frame.scrollWidth - frame.clientWidth) / 2 : (frame.scrollWidth - frame.clientWidth) / 2;
      await nextFrame();
      await nextFrame();
      const bounds = frame.getBoundingClientRect();
      for (const row of [table.querySelector("thead tr"), table.querySelector("tbody tr")] as HTMLElement[]) {
        const cells = [...row.children].map((cell) => cell.getBoundingClientRect());
        const first = cells[0] as DOMRect;
        const second = cells[1] as DOMRect;
        const last = cells.at(-1) as DOMRect;
        // the first two sit at the start edge, one against the other
        if (rtl) {
          await expect(Math.abs(first.right - bounds.right)).toBeLessThan(3);
          await expect(Math.abs(second.right - first.left)).toBeLessThan(2);
          await expect(Math.abs(last.left - bounds.left)).toBeLessThan(3);
        } else {
          await expect(Math.abs(first.left - bounds.left)).toBeLessThan(3);
          await expect(Math.abs(second.left - first.right)).toBeLessThan(2);
          await expect(Math.abs(last.right - bounds.right)).toBeLessThan(3);
        }
      }
      // and a column between them has really scrolled
      const middle = (table.querySelector("tbody tr")?.children[4] as HTMLElement).getBoundingClientRect();
      await expect(middle.left < bounds.left || middle.right > bounds.right || middle.left > bounds.left).toBe(true);
    }
  },
};

export const ResizingWithARealPointerAndKeys: Story = {
  name: "A column is resized by a real drag in both directions, by keys, and stops at its limits",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <DataTable<Employee>
        aria-label="Resizable left to right"
        resizable
        columns={employeeColumns.map((column) => (column.id === "role" ? { ...column, width: "10rem", minWidth: "8rem", maxWidth: "16rem" } : column))}
        data={employees.slice(0, 3)}
      />
      <div dir="rtl">
        <DataTable<Employee>
          aria-label="Resizable right to left"
          resizable
          columns={employeeColumns.map((column) => (column.id === "role" ? { ...column, width: "10rem", minWidth: "8rem", maxWidth: "16rem" } : column))}
          data={employees.slice(0, 3)}
        />
      </div>
    </div>
  ),
  play: async () => {
    for (const [name, rtl] of [["Resizable left to right", false], ["Resizable right to left", true]] as const) {
      const table = body.getByRole("table", { name });
      const handle = within(table).getByRole("separator", { name: "Resize Role column" });
      const cell = handle.closest("th") as HTMLElement;
      const widthNow = () => cell.getBoundingClientRect().width;
      const start = widthNow();
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const [narrowest, widest, step] = [8 * rem, 16 * rem, tokenPx("--dbm-space-4")];
      // the handle is at least the minimum target wide, at the end edge of its heading
      await expect(handle.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
      const edge = rtl ? handle.getBoundingClientRect().left - cell.getBoundingClientRect().left : cell.getBoundingClientRect().right - handle.getBoundingClientRect().right;
      await expect(Math.abs(edge)).toBeLessThan(2);
      // dragging toward the end edge widens it, in either direction
      await realDrag(handle, rtl ? -30 : 30);
      await waitFor(() => expect(Math.abs(widthNow() - (start + 30))).toBeLessThan(2));
      // it stops at its widest and its narrowest
      await realDrag(handle, rtl ? -400 : 400);
      await waitFor(() => expect(Math.abs(widthNow() - widest)).toBeLessThan(2));
      await realDrag(handle, rtl ? 600 : -600);
      await waitFor(() => expect(Math.abs(widthNow() - narrowest)).toBeLessThan(2));
      // the keys follow the page's direction: the one that points toward the end edge widens, so it is Right in one and Left in the other
      handle.focus();
      await userEvent.keyboard(rtl ? "{ArrowLeft}" : "{ArrowRight}");
      await waitFor(() => expect(Math.abs(widthNow() - (narrowest + step))).toBeLessThan(2));
      // and the other narrows it, back to where it stopped
      await userEvent.keyboard(rtl ? "{ArrowRight}" : "{ArrowLeft}");
      await waitFor(() => expect(Math.abs(widthNow() - narrowest)).toBeLessThan(2));
      await userEvent.keyboard(rtl ? "{ArrowLeft}" : "{ArrowRight}");
      await waitFor(() => expect(Math.abs(widthNow() - (narrowest + step))).toBeLessThan(2));
      await expect(getComputedStyle(handle).outlineStyle).toBe("solid");
      // Enter puts it back
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(Math.abs(widthNow() - start)).toBeLessThan(2));
      await expect(handle).toHaveAttribute("aria-valuenow", String(Math.round(widthNow())));
    }
  },
};

export const ShiftPressSortsByTwoColumns: Story = {
  name: "A press with Shift held adds a column to the sort, and the order is drawn",
  render: () => <DataTable<Employee> aria-label="Two sorts" columns={employeeColumns} data={employees.slice(0, 12)} />,
  play: async () => {
    const table = body.getByRole("table", { name: "Two sorts" });
    // one user for both presses, so the Shift held by the second is the one the first set down
    const user = userEvent.setup();
    await user.click(within(table).getByRole("button", { name: "Department" }));
    await user.keyboard("{Shift>}");
    await user.click(within(table).getByRole("button", { name: /^Salary/ }));
    await user.keyboard("{/Shift}");
    await expect(within(table).getByRole("columnheader", { name: /^Department/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(within(table).getByRole("columnheader", { name: /^Salary/ })).toHaveAttribute("aria-sort", "ascending");
    // the first column of the sort decides, the second breaks its ties
    const rows = [...table.querySelectorAll("tbody tr")].map((row) => [...row.children].map((cell) => cell.textContent ?? ""));
    const department = (row: string[]) => row[2] as string;
    const salary = (row: string[]) => Number((row[3] as string).replace(/[$,]/g, ""));
    for (let index = 1; index < rows.length; index += 1) {
      const [before, after] = [rows[index - 1] as string[], rows[index] as string[]];
      await expect(department(before) <= department(after)).toBe(true);
      if (department(before) === department(after)) await expect(salary(before)).toBeLessThanOrEqual(salary(after));
    }
    // the digits beside the arrows are drawn
    const digits = [...table.querySelectorAll("thead button span[aria-hidden='true']")].map((span) => span.textContent).filter((text) => /^\d$/.test(text ?? ""));
    await expect(digits).toEqual(["1", "2"]);
  },
};

export const ColumnMenuToggleWithAPointer: Story = {
  name: "The column menu opens with a real pointer and hides a column",
  render: () => (
    <div style={{ minHeight: "18rem" }}>
      <DataTable<Employee> aria-label="Menu columns" columns={employeeColumns} data={employees.slice(0, 3)}>
        <DataTable.ColumnMenu />
      </DataTable>
    </div>
  ),
  play: async () => {
    await realClick(body.getByRole("button", { name: "Columns" }));
    const menu = await body.findByRole("menu");
    const item = within(menu).getByRole("menuitemcheckbox", { name: "Role" });
    await nextFrame();
    const rect = item.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("[role=menuitemcheckbox]")).toBe(item);
    await realClick(item);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(within(body.getByRole("table", { name: "Menu columns" })).queryByRole("columnheader", { name: "Role" })).toBeNull();
  },
};

export const SelectAllAcrossPages: Story = {
  name: "Select all chooses every row of every page, and unchecking one goes back to a list",
  render: () => <ServerDemo selectionMode="multiple" />,
  play: async () => {
    const table = await body.findByRole("table", { name: "Team, from a server" });
    await waitFor(() => expect(table.querySelector("tbody")).not.toHaveAttribute("aria-busy"), { timeout: 3000 });
    await userEvent.click(within(table).getAllByRole("checkbox")[1] as HTMLElement);
    await userEvent.click(await body.findByRole("button", { name: "Select all 137" }));
    await expect(body.getByText("137 selected")).toBeInTheDocument();
    // the next page, once it has arrived, is chosen too
    await userEvent.click(body.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(table.querySelector("tbody")).toHaveAttribute("aria-busy"));
    await waitFor(() => expect(table.querySelector("tbody")).not.toHaveAttribute("aria-busy"), { timeout: 3000 });
    await expect(within(table).getAllByRole("checkbox", { checked: true }).length).toBe(11);
    await userEvent.click(within(table).getAllByRole("checkbox")[3] as HTMLElement);
    await expect(body.getByText("9 selected")).toBeInTheDocument();
  },
};

export const ExpandedRowsKeepStripesAndLayout: Story = {
  name: "An open row's detail spans the table, the stripes stay in step, and the caret turns round in right-to-left",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <DataTable<Employee>
        aria-label="Expandable"
        columns={employeeColumns}
        data={employees.slice(0, 6)}
        striped
        selectionMode="multiple"
        renderExpandedRow={(row) => <EmployeeDetail row={row} />}
        getRowLabel={(row) => row.name}
      />
      <div dir="rtl">
        <DataTable<Employee>
          aria-label="Expandable right to left"
          columns={employeeColumns}
          data={employees.slice(0, 2)}
          renderExpandedRow={(row) => <EmployeeDetail row={row} />}
          getRowLabel={(row) => row.name}
        />
      </div>
    </div>
  ),
  play: async () => {
    // a pointer left over from an earlier check would tint the row under it
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    const table = body.getByRole("table", { name: "Expandable" });
    const buttons = within(table).getAllByRole("button", { name: /^Expand/ });
    // targets: the button is at least the minimum size, at the row's own size
    for (const button of buttons) await expect(Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(24);
    const fill = (row: Element) => getComputedStyle(row).backgroundColor;
    const dataRows = () => [...table.querySelectorAll<HTMLElement>("tbody > tr:not([hidden])")].filter((row) => !row.id);
    // the fills ease in on first paint, so read them once two reads a moment apart agree
    let before = dataRows().map(fill);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const now = dataRows().map(fill);
      if (JSON.stringify(now) === JSON.stringify(before)) break;
      before = now;
    }
    // a keyboard opens it and focus stays
    buttons[1]?.focus();
    await userEvent.keyboard("{Enter}");
    const open = within(table).getByRole("button", { name: /^Collapse/ });
    await expect(open).toHaveFocus();
    const detail = table.querySelector<HTMLElement>("tbody > tr[id]") as HTMLElement;
    const frame = table.getBoundingClientRect();
    await expect(Math.abs(detail.getBoundingClientRect().width - frame.width)).toBeLessThan(2);
    // the detail is taller than a row (it has its own height), and its fill is the same on and off the pointer
    await expect(detail.getBoundingClientRect().height).toBeGreaterThan(tokenPx("--dbm-data-table-row-height-md"));
    const quiet = fill(detail);
    await expect(quiet).not.toBe("rgba(0, 0, 0, 0)");
    // the stripes of the rows of data are what they were: an even row is still striped, an odd one still not
    await waitFor(() => expect(JSON.stringify(dataRows().map(fill))).toBe(JSON.stringify(before)), { timeout: 3000 });
    // and the row above the detail is joined to it: no divider between them
    const parent = open.closest("tr") as HTMLElement;
    await expect(getComputedStyle(parent.firstElementChild as Element).borderBlockEndColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(table.querySelector("tbody > tr[id]")).toBeNull());
    // in right to left the closed caret is turned round, and in left to right it is not
    const rtlButton = within(body.getByRole("table", { name: "Expandable right to left" })).getAllByRole("button", { name: /^Expand/ })[0] as HTMLElement;
    await expect(getComputedStyle(rtlButton.querySelector("svg") as Element).scale).toBe("-1 1");
    await expect(getComputedStyle((buttons[0] as HTMLElement).querySelector("svg") as Element).scale).toBe("none");
  },
};

export const DensityRecipeChangesRowHeight: Story = {
  name: "The density recipe: each choice is a size, and its rows are exactly that size's height",
  render: () => <DensityDemo />,
  play: async () => {
    const table = body.getByRole("table", { name: "Team" });
    for (const [label, token] of [["Compact", "sm"], ["Comfortable", "md"], ["Spacious", "lg"]] as const) {
      await userEvent.click(body.getByRole("radio", { name: label }));
      await waitFor(() => expect(Math.abs((bodyRows(table)[0] as HTMLElement).getBoundingClientRect().height - tokenPx(`--dbm-data-table-row-height-${token}`))).toBeLessThan(1));
    }
  },
};

export const SavedViewsRecipeRoundTrips: Story = {
  name: "The saved-views recipe: choosing a view hands its state back, saving one copies the current state",
  render: () => (
    <div style={{ minHeight: "26rem" }}>
      <SavedViewsDemo />
    </div>
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Team" });
    await userEvent.click(body.getByRole("combobox", { name: "View" }));
    await userEvent.click(await body.findByRole("option", { name: "Payroll" }));
    await waitFor(() => expect(within(table).queryByRole("columnheader", { name: /^Started/ })).toBeNull());
    await expect(within(table).getByRole("columnheader", { name: /^Salary/ })).toHaveAttribute("aria-sort", "descending");
    await expect(body.getByText((content) => content.replace(/[\u2068\u2069]/g, "") === "1–5 of 24")).toBeInTheDocument();
    // change the current state (sort by name), save it, and the new view is chosen and keeps it
    await userEvent.click(within(table).getByRole("button", { name: /^Name/ }));
    await userEvent.click(body.getByRole("button", { name: "Save current view" }));
    await waitFor(() => expect(body.getByRole("combobox", { name: "View" })).toHaveTextContent("View 3"));
    await userEvent.click(body.getByRole("combobox", { name: "View" }));
    await userEvent.click(await body.findByRole("option", { name: "Default" }));
    await waitFor(() => expect(within(table).getByRole("columnheader", { name: /^Started/ })).toBeInTheDocument());
    await userEvent.click(body.getByRole("combobox", { name: "View" }));
    await userEvent.click(await body.findByRole("option", { name: "View 3" }));
    await waitFor(() => expect(within(table).getByRole("columnheader", { name: /^Name/ })).toHaveAttribute("aria-sort", "ascending"));
    await expect(within(table).queryByRole("columnheader", { name: /^Started/ })).toBeNull();
  },
};

export const SelectAllKeepsKeyboardFocus: Story = {
  name: "Select all, pressed from the keyboard, leaves focus on Clear selection instead of dropping it",
  render: () => <ServerDemo selectionMode="multiple" />,
  play: async () => {
    const table = await body.findByRole("table", { name: "Team, from a server" });
    await waitFor(() => expect(table.querySelector("tbody")).not.toHaveAttribute("aria-busy"), { timeout: 3000 });
    const user = userEvent.setup();
    // choose a row with the keyboard, then Tab to the button that appears
    (within(table).getAllByRole("checkbox")[1] as HTMLElement).focus();
    await user.keyboard(" ");
    const button = await body.findByRole("button", { name: "Select all 137" });
    button.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(body.queryByRole("button", { name: "Select all 137" })).toBeNull());
    await expect(body.getByRole("button", { name: "Clear selection" })).toHaveFocus();
  },
};

async function realRightClick(element: Element) {
  const { x, y } = pointOf(element);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "right", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "right", clickCount: 1 });
}

export const RowContextMenuWithARealPointer: Story = {
  name: "A real right-click on a row chooses it, opens its menu above the table and outlines the row",
  render: () => (
    <div style={{ minHeight: "22rem" }}>
      <DataTable<Employee>
        columns={employeeColumns}
        data={employees.slice(0, 6)}
        aria-label="Team"
        selectionMode="multiple"
        defaultSelection={["e1"]}
        stickyHeader
        maxHeight="16rem"
        rowContextMenu={({ row, count }) => (
          <>
            <ContextMenu.Item>{count > 1 ? `Edit ${count} people` : `Edit ${row.name}`}</ContextMenu.Item>
            <ContextMenu.Item>Copy email</ContextMenu.Item>
          </>
        )}
      />
    </div>
  ),
  play: async () => {
    const rows = await body.findAllByRole("row");
    const target = rows[3] as HTMLElement;
    await realRightClick(target);
    const menu = await body.findByRole("menu");
    await new Promise((resolve) => setTimeout(resolve, 300));
    // chosen alone: the row that was chosen before is not, and this one is
    const boxes = Array.from(document.querySelectorAll<HTMLElement>('tbody [role="checkbox"]'));
    await expect(boxes.filter((box) => box.getAttribute("aria-checked") === "true")).toHaveLength(1);
    await expect(target.querySelector('[role="checkbox"]')).toHaveAttribute("aria-checked", "true");
    await expect(target).toHaveAttribute("data-state", "open");
    // the outline is drawn from the stylesheet, and the panel is the top element at its own item's point
    await expect(getComputedStyle(target).outlineStyle).toBe("solid");
    const item = within(menu).getAllByRole("menuitem")[0] as HTMLElement;
    const at = item.getBoundingClientRect();
    const top = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
    await expect(item.contains(top)).toBe(true);
    await realClick(item);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(target).toHaveAttribute("data-state", "closed");
  },
};
