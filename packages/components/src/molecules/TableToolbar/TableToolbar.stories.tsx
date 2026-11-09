import { DownloadSimpleIcon, FunnelSimpleIcon, TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Checkbox } from "../../atoms/Checkbox";
import { Radio } from "../../atoms/Radio";
import { Spacer } from "../../atoms/Spacer";
import { CheckboxGroup } from "../CheckboxGroup";
import { RadioGroup } from "../RadioGroup";
import { SearchInput } from "../SearchInput";
import { send } from "../CodeBlock/browserProtocol";
import { Toolbar } from "../Toolbar";
import { TableToolbar } from "./TableToolbar";
import { tableToolbarPlaygroundSnippet, tableToolbarSnippets } from "./TableToolbar.snippets";
import type { TableToolbarProps } from "./TableToolbar.types";
import { FiltersDemo, OrdersDemo, SelectionBelowDemo, SplitBarDemo } from "./TableToolbarStoryKit";

const noControls = { control: false } as const;
const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "stretch" } as const;

const meta: Meta<TableToolbarProps> = {
  title: "Molecules/Data Display/TableToolbar",
  component: TableToolbar,
  parameters: { layout: "padded" },
  // Core visual props first, then the name, then advanced/escape-hatch props last — the same sequencing as every other
  // component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The size every part that draws text or controls itself (Filter outside a toolbar, ActiveFilters, Summary, Selection) uses unless it sets its own. Say the same size on the SearchInput and the Toolbars you put in a row, which are your own components and don't read this.",
      table: { defaultValue: { summary: "md" } },
    },
    children: {
      ...noControls,
      description:
        "The bar's rows, in reading order: a TableToolbar.Row of the search field and toolbars, a TableToolbar.Row holding ActiveFilters and Summary, then TableToolbar.Selection.",
    },
    "aria-label": {
      control: "text",
      description:
        "Names the bar for assistive tech (\"Orders table tools\"). Required unless aria-labelledby points at a visible label: a role=\"group\" with no name is just a set of controls.",
    },
    "aria-labelledby": { ...noControls, description: "The id of an already-visible element that names the bar, in place of aria-label." },
    "aria-describedby": { ...noControls, description: "The id of a helper text or description for the bar." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the bar's element." },
  },
  args: { size: "md", "aria-label": "Orders table tools" },
  render: (args) => <OrdersDemo {...args} />,
};

export default meta;

type Story = StoryObj<TableToolbarProps>;

/** Drive every prop live via the Controls panel below. The whole bar works: search, filters, chips, count and bulk actions. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic" as const,
        transform: (_code: string, context: StoryContext) => tableToolbarPlaygroundSnippet(context.args),
      },
    },
  },
};

export const SearchAndActions: Story = {
  name: "Search, filters and actions",
  parameters: { docs: { source: { code: tableToolbarSnippets.searchAndActions } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <TableToolbar {...args} aria-label="Orders table tools">
      <TableToolbar.Row>
        <TableToolbar.Search>
          <SearchInput aria-label="Search orders" size={args.size} />
        </TableToolbar.Search>
        <Toolbar aria-label="Filters" variant="secondary" size={args.size}>
          <Toolbar.Item>
            <TableToolbar.Filter label="Status" icon={FunnelSimpleIcon}>
              <CheckboxGroup aria-label="Status">
                <Checkbox value="open">Open</Checkbox>
                <Checkbox value="shipped">Shipped</Checkbox>
              </CheckboxGroup>
            </TableToolbar.Filter>
          </Toolbar.Item>
        </Toolbar>
        <Spacer />
        <Toolbar aria-label="Actions" variant="secondary" size={args.size}>
          <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export</Toolbar.Button>
        </Toolbar>
      </TableToolbar.Row>
    </TableToolbar>
  ),
};

export const Filters: Story = {
  parameters: { docs: { source: { code: tableToolbarSnippets.filters } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <div style={{ minHeight: "18rem" }}>
      <TableToolbar {...args} aria-label="Orders table tools">
        <TableToolbar.Row>
          <Toolbar aria-label="Filters" variant="secondary" size={args.size}>
            <Toolbar.Item>
              <TableToolbar.Filter label="Status" count={2} onClear={() => {}}>
                <CheckboxGroup aria-label="Status" defaultValue={["open", "shipped"]}>
                  <Checkbox value="open">Open</Checkbox>
                  <Checkbox value="shipped">Shipped</Checkbox>
                  <Checkbox value="delayed">Delayed</Checkbox>
                </CheckboxGroup>
              </TableToolbar.Filter>
            </Toolbar.Item>
            <Toolbar.Item>
              <TableToolbar.Filter label="Owner">
                <RadioGroup aria-label="Owner" defaultValue="jane">
                  <Radio value="jane">Jane</Radio>
                  <Radio value="marcus">Marcus</Radio>
                  <Radio value="priya">Priya</Radio>
                </RadioGroup>
              </TableToolbar.Filter>
            </Toolbar.Item>
            <Toolbar.Item>
              <TableToolbar.Filter label="Tags" count={1284}>
                <CheckboxGroup aria-label="Tags">
                  <Checkbox value="rush">Rush</Checkbox>
                </CheckboxGroup>
              </TableToolbar.Filter>
            </Toolbar.Item>
          </Toolbar>
        </TableToolbar.Row>
      </TableToolbar>
    </div>
  ),
};

export const ActiveFilters: Story = {
  name: "Active filters",
  parameters: { docs: { source: { code: tableToolbarSnippets.activeFilters } } },
  argTypes: { "aria-label": noControls },
  render: function Render(args) {
    const [applied, setApplied] = useState([
      { id: "status:open", group: "Status", label: "Open" },
      { id: "status:delayed", group: "Status", label: "Delayed" },
      { id: "owner:jane", group: "Owner", label: "Jane" },
    ]);
    return (
      <TableToolbar {...args} aria-label="Orders table tools">
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters
            items={applied}
            onRemove={(id) => setApplied((current) => current.filter((item) => item.id !== id))}
            onClearAll={() => setApplied([])}
          />
        </TableToolbar.Row>
      </TableToolbar>
    );
  },
};

export const ResultCount: Story = {
  name: "Result count",
  parameters: { docs: { source: { code: tableToolbarSnippets.resultCount } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <TableToolbar {...args} aria-label="Orders table tools">
      <TableToolbar.Row>
        <TableToolbar.Summary count={128} />
      </TableToolbar.Row>
      <TableToolbar.Row>
        <TableToolbar.Summary count={12} total={128} />
      </TableToolbar.Row>
      <TableToolbar.Row>
        <TableToolbar.Summary count={0} total={128} />
      </TableToolbar.Row>
      <TableToolbar.Row>
        <TableToolbar.Summary loading />
      </TableToolbar.Row>
    </TableToolbar>
  ),
};

export const BulkSelection: Story = {
  name: "Bulk selection",
  parameters: { docs: { source: { code: tableToolbarSnippets.bulkSelection } } },
  argTypes: { "aria-label": noControls },
  render: function Render(args) {
    const [count, setCount] = useState(3);
    return (
      <TableToolbar {...args} aria-label="Orders table tools">
        <TableToolbar.Row>
          <Toolbar aria-label="Pick rows" variant="secondary" size={args.size}>
            <Toolbar.Button onClick={() => setCount((value) => Math.min(value + 1, 12))}>Select a row</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Row>
        <TableToolbar.Selection count={count} totalCount={12} onClear={() => setCount(0)} onSelectAll={() => setCount(12)}>
          <Toolbar aria-label="Bulk actions" variant="secondary" size={args.size}>
            <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export selected</Toolbar.Button>
            <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Selection>
      </TableToolbar>
    );
  },
};

export const WithATable: Story = {
  name: "Above a Table",
  parameters: { docs: { source: { code: tableToolbarSnippets.withATable } } },
  argTypes: { "aria-label": noControls },
  render: (args) => <OrdersDemo {...args} />,
};

export const SplitAboveAndBelow: Story = {
  name: "Split above and below a Table",
  parameters: { docs: { source: { code: tableToolbarSnippets.split } } },
  argTypes: { "aria-label": noControls },
  render: (args) => <SplitBarDemo {...args} />,
};

export const SelectionInAnotherPlace: Story = {
  name: "Selection in another place",
  parameters: { docs: { source: { code: tableToolbarSnippets.selectionElsewhere } } },
  argTypes: { "aria-label": noControls },
  render: (args) => <SelectionBelowDemo {...args} />,
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: tableToolbarSnippets.sizes } } },
  argTypes: { size: noControls, "aria-label": noControls },
  render: () => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TableToolbar key={size} size={size} aria-label={`Size ${size}`}>
          <TableToolbar.Row>
            <TableToolbar.Search>
              <SearchInput aria-label={`Search (${size})`} size={size} />
            </TableToolbar.Search>
            <Toolbar aria-label={`Filters (${size})`} variant="secondary" size={size}>
              <Toolbar.Item>
                <TableToolbar.Filter label="Status" count={2}>
                  <CheckboxGroup aria-label="Status">
                    <Checkbox value="open">Open</Checkbox>
                  </CheckboxGroup>
                </TableToolbar.Filter>
              </Toolbar.Item>
            </Toolbar>
            <Spacer />
            <TableToolbar.Summary count={12} total={128} />
          </TableToolbar.Row>
        </TableToolbar>
      ))}
    </div>
  ),
};

/** A bar narrower than `collapseBelow` draws its filters as one "Filters" button that opens them in a bottom sheet; wider, they are inline. */
export const FiltersAsASheet: Story = {
  name: "Filters as a sheet",
  parameters: { docs: { source: { code: tableToolbarSnippets.filtersSheet } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <div style={{ inlineSize: "24rem" }}>
      <FiltersDemo size={args.size} />
    </div>
  ),
};

/** With a `value` a filter's button shows the choice, and `labelPlacement="before"` draws the filter's name as plain text before it. */
export const FilterWithAValue: Story = {
  name: "A filter that shows its choice",
  parameters: { docs: { source: { code: tableToolbarSnippets.filterValue } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <div style={{ inlineSize: "60rem" }}>
      <FiltersDemo size={args.size} labelPlacement="before" />
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: tableToolbarSnippets.rtl } } },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <div dir="rtl">
      <TableToolbar {...args} aria-label="Orders table tools">
        <TableToolbar.Row>
          <TableToolbar.Search>
            <SearchInput aria-label="Search orders" size={args.size} />
          </TableToolbar.Search>
          <Toolbar aria-label="Filters" variant="secondary" size={args.size} dir="rtl">
            <Toolbar.Item>
              <TableToolbar.Filter label="Status" count={2}>
                <CheckboxGroup aria-label="Status">
                  <Checkbox value="open">Open</Checkbox>
                </CheckboxGroup>
              </TableToolbar.Filter>
            </Toolbar.Item>
          </Toolbar>
        </TableToolbar.Row>
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters items={[{ id: "status:open", group: "Status", label: "Open" }]} onRemove={() => {}} />
          <TableToolbar.Summary count={12} total={128} />
        </TableToolbar.Row>
      </TableToolbar>
    </div>
  ),
};

// ---- Hidden real-browser checks (07-storybook-and-documentation-standards.md §5): what jsdom can't evaluate. ----
// `tags: ["!dev"]` is written out on each story and not shared through a spread: Storybook's indexer reads `tags` only from
// a literal property (found on Toolbar, 2026-10-03).
const hidden = { argTypes: { size: noControls, "aria-label": noControls } } satisfies Partial<Story>;

const settle = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const LayoutInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Layout — interaction test",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ width: "60rem" }} data-testid="wide">
        <OrdersDemo withTable={false} />
      </div>
      <div style={{ width: "20rem" }} data-testid="narrow">
        <OrdersDemo withTable={false} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const measure = (scope: string) => {
      const box = canvas.getByTestId(scope);
      const rect = (name: string | RegExp, role = "searchbox") => within(box).getByRole(role as "searchbox", { name }).getBoundingClientRect();
      return {
        search: rect("Search orders"),
        filters: within(box).getByRole("toolbar", { name: "Filters" }).getBoundingClientRect(),
        actions: within(box).getByRole("toolbar", { name: "Actions" }).getBoundingClientRect(),
        box: box.getBoundingClientRect(),
      };
    };
    // Wide: one line. The search grows into spare room up to a measure (24rem), not across the page, and the Spacer pushes
    // the actions to the far end.
    const wide = measure("wide");
    await expect(Math.abs(wide.search.top - wide.filters.top)).toBeLessThan(40);
    await expect(wide.filters.top).toBeLessThan(wide.search.bottom);
    await expect(wide.search.width).toBeLessThanOrEqual(24 * 16 + 2);
    await expect(wide.search.width).toBeGreaterThan(14 * 16 - 2);
    await expect(wide.box.right - wide.actions.right).toBeLessThan(8);
    // Narrow: the row wraps rather than overflowing: nothing is wider than the box, and the filters are on a later line.
    const narrow = measure("narrow");
    await expect(narrow.search.right).toBeLessThanOrEqual(narrow.box.right + 1);
    await expect(narrow.filters.right).toBeLessThanOrEqual(narrow.box.right + 1);
    await expect(narrow.actions.right).toBeLessThanOrEqual(narrow.box.right + 1);
    await expect(narrow.filters.top).toBeGreaterThanOrEqual(narrow.search.bottom - 1);
  },
};

export const KeyboardInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Keyboard — interaction test",
  render: () => (
    <>
      <button>before</button>
      <OrdersDemo withTable={false} />
      <button>after</button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Search field, then each toolbar once, then the chips, in reading order; the toolbars move with the arrow keys and the
    // search field keeps its own.
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("searchbox", { name: "Search orders" })).toHaveFocus();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search orders" }), "ab{ArrowLeft}X");
    await expect(canvas.getByRole("searchbox", { name: "Search orders" })).toHaveValue("aXb");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /^Status/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: /^Owner/ })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Export" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Remove filter: Status: Open" })).toHaveFocus();
    // A filter opens with Enter, and Escape gives focus back to its button.
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await userEvent.keyboard("{ArrowLeft}");
    const status = canvas.getByRole("button", { name: /^Status/ });
    await expect(status).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(await within(document.body).findByRole("dialog", { name: "Status filter" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(status).toHaveFocus());
  },
};

export const FocusRecoveryInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Focus recovery — interaction test",
  render: () => <OrdersDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Removing the last chip with the keyboard leaves the keyboard user somewhere sensible, not at the top of the page.
    const remove = () => canvas.queryByRole("button", { name: /^Remove filter/ });
    remove()!.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(remove()).toBeNull());
    await expect(document.activeElement).not.toBe(document.body);
    await expect(canvasElement.contains(document.activeElement)).toBe(true);
    // Selecting a row shows the bulk row; clearing it from the keyboard must not drop focus to the page either.
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select order #1042" }));
    const clear = await canvas.findByRole("button", { name: "Clear selection" });
    clear.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvasElement.querySelector('[aria-label="Selected rows"]')).toHaveAttribute("hidden"));
    await expect(document.activeElement).not.toBe(document.body);
    await expect(canvasElement.contains(document.activeElement)).toBe(true);
  },
};

export const RightToLeftInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Right to left — interaction test",
  render: () => (
    <div dir="rtl" style={{ width: "50rem" }}>
      <TableToolbar aria-label="Orders table tools" data-testid="bar">
        <TableToolbar.Row>
          <TableToolbar.Search data-testid="search">
            <SearchInput aria-label="Search orders" />
          </TableToolbar.Search>
        </TableToolbar.Row>
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters items={[{ id: "a", group: "Status", label: "Open" }]} onRemove={() => {}} data-testid="chips" />
          <TableToolbar.Summary count={12} total={128} data-testid="summary" />
        </TableToolbar.Row>
      </TableToolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar").getBoundingClientRect();
    const search = canvas.getByTestId("search").getBoundingClientRect();
    const chips = canvas.getByTestId("chips").getBoundingClientRect();
    const summary = canvas.getByTestId("summary").getBoundingClientRect();
    // Right to left: the search field starts at the right edge, the chips start there too, and the count is pushed to the left.
    await expect(bar.right - search.right).toBeLessThan(4);
    await expect(bar.right - chips.right).toBeLessThan(4);
    await expect(summary.left - bar.left).toBeLessThan(4);
    await expect(summary.right).toBeLessThan(chips.left + chips.width);
  },
};

export const TargetSizeInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Target size — interaction test",
  render: () => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TableToolbar key={size} size={size} aria-label={`Size ${size}`} data-testid={size}>
          <TableToolbar.Row>
            <TableToolbar.ActiveFilters
              items={[
                { id: "a", group: "Status", label: "Open" },
                { id: "b", group: "Owner", label: "Jane" },
              ]}
              onRemove={() => {}}
              onClearAll={() => {}}
            />
          </TableToolbar.Row>
          <TableToolbar.Selection count={2} totalCount={9} onClear={() => {}} onSelectAll={() => {}} />
          <TableToolbar.Row>
            <Toolbar aria-label="Filters" variant="secondary" size={size}>
              <Toolbar.Item>
                <TableToolbar.Filter label="Status" count={1}>
                  x
                </TableToolbar.Filter>
              </Toolbar.Item>
              <Toolbar.Item>
                <TableToolbar.Filter label="Owner">x</TableToolbar.Filter>
              </Toolbar.Item>
            </Toolbar>
          </TableToolbar.Row>
        </TableToolbar>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // WCAG 2.5.8 (Target Size, Minimum): a control's hit area is at least 24 × 24 CSS pixels. A chip's remove button draws a
    // 12 to 20px glyph but `Tag` grows its hit area with an invisible pseudo-element, which `getBoundingClientRect` does not
    // see — so those are checked by pressing the points 11px either side of the centre (inside a 24px box) and expecting the
    // button itself.
    const targets = Array.from(canvasElement.querySelectorAll<HTMLElement>("button, a[href], input, [role='checkbox']")).filter(
      (element) => element.getClientRects().length > 0 && !element.closest("[hidden]"),
    );
    const isRemove = (element: HTMLElement) => (element.getAttribute("aria-label") ?? "").startsWith("Remove filter");
    const failures: string[] = [];
    for (const element of targets) {
      const r = element.getBoundingClientRect();
      const name = element.getAttribute("aria-label") ?? element.textContent ?? element.tagName;
      if (r.width >= 24 && r.height >= 24) continue;
      if (!isRemove(element)) {
        failures.push(`${name} ${Math.round(r.width)}x${Math.round(r.height)}`);
        continue;
      }
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const missed = ([[-11, 0], [11, 0], [0, -11], [0, 11]] as const).filter(([dx, dy]) => document.elementFromPoint(cx + dx, cy + dy) !== element);
      if (missed.length) failures.push(`${name} hit area under 24px (${missed.length} of 4 probe points miss it)`);
    }
    // "Clear all" is as tall as the chips beside it (and at least 24px).
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const bar = canvasElement.querySelector(`[data-testid="${size}"]`)!;
      const chip = bar.querySelector<HTMLElement>("li > *")!.getBoundingClientRect().height;
      const clear = Array.from(bar.querySelectorAll<HTMLElement>("button")).find((b) => b.textContent === "Clear all")!;
      await expect(clear.getBoundingClientRect().height).toBeCloseTo(Math.max(chip, 24), 1);
    }
    // A filter button showing a count is the same height as one without (the badge must not grow it).
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const bar = canvasElement.querySelector(`[data-testid="${size}"]`)!;
      const withCount = bar.querySelector<HTMLElement>('button[aria-label="Status, 1 active"]')!;
      const without = bar.querySelector<HTMLElement>('button[aria-label="Owner"]')!;
      await expect(withCount.getBoundingClientRect().height).toBeCloseTo(without.getBoundingClientRect().height, 1);
    }
    await expect(failures.join("; ")).toBe("");
  },
};

export const PhoneInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "On a phone — interaction test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="box">
      <OrdersDemo withTable={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("box").getBoundingClientRect();
    // Nothing runs off the screen: the row wrapped, and a wide toolbar scrolls inside itself.
    for (const name of ["Search orders"]) await expect(canvas.getByRole("searchbox", { name }).getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 1);
    for (const name of ["Filters", "Actions"]) await expect(canvas.getByRole("toolbar", { name }).getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
  },
};

export const LiveTextInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Live text — interaction test",
  render: () => (
    <div style={column}>
      {[1, 9, 10, 100].map((count) => (
        <TableToolbar key={count} aria-label={`Selected ${count}`} data-testid={`bar-${count}`}>
          <TableToolbar.Selection count={count} totalCount={1000} onSelectAll={() => {}} />
          <Toolbar aria-label={`Filters ${count}`} variant="secondary">
            <Toolbar.Item>
              <TableToolbar.Filter label="Status" count={count}>
                x
              </TableToolbar.Filter>
            </Toolbar.Item>
            <Toolbar.Item>
              <TableToolbar.Filter label="Owner">x</TableToolbar.Filter>
            </Toolbar.Item>
          </Toolbar>
        </TableToolbar>
      ))}
      <TableToolbar aria-label="Counts">
        <TableToolbar.Summary count={128} data-testid="loaded" />
        <TableToolbar.Summary loading data-testid="loading" />
      </TableToolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Text that changes as the user interacts never resizes or moves what is beside it: across one, two and three digits the
    // control after the count, and the button after the filter's badge, stay where they were.
    const counts = [1, 9, 10, 100];
    const positions = counts.map((count) => {
      const bar = canvasElement.querySelector<HTMLElement>(`[data-testid="bar-${count}"]`)!;
      const selectAll = Array.from(bar.querySelectorAll("button")).find((b) => b.textContent?.startsWith("Select all"))!;
      const owner = bar.querySelector<HTMLElement>('button[aria-label="Owner"]')!;
      return { selectAll: selectAll.getBoundingClientRect().left, owner: owner.getBoundingClientRect().left };
    });
    for (const p of positions) {
      await expect(p.selectAll).toBeCloseTo(positions[0]!.selectAll, 1);
    }
    // The badge reserves two digits, so 1, 9, 10 and 99 are the same width (a count past `max` is wider by design).
    for (const p of positions.slice(0, 3)) {
      await expect(p.owner).toBeCloseTo(positions[0]!.owner, 1);
    }
    // The loading placeholder holds the height of the count it stands in for.
    const loaded = canvasElement.querySelector<HTMLElement>('[data-testid="loaded"]')!;
    const loading = canvasElement.querySelector<HTMLElement>('[data-testid="loading"]')!;
    await expect(loading.getBoundingClientRect().height).toBeCloseTo(loaded.getBoundingClientRect().height, 1);
  },
};

export const ForcedColoursInteraction: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Forced colours — interaction test",
  render: () => (
    <TableToolbar aria-label="Orders table tools">
      <TableToolbar.Selection count={3} data-testid="selection" />
      <TableToolbar.Summary loading data-testid="loading" />
    </TableToolbar>
  ),
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByTestId("selection");
    const placeholder = within(canvasElement).getByTestId("loading").firstElementChild as HTMLElement;
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(300);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // The row's tint is a background, which forced colours replaces; its border is kept, so it is still a bounded box.
      const style = getComputedStyle(row);
      await expect(style.borderTopStyle).toBe("solid");
      await expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      await expect(style.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
      await expect(style.borderTopColor).not.toBe(style.backgroundColor);
      // The loading placeholder is a background too; its outline keeps it visible.
      await expect(parseFloat(getComputedStyle(placeholder).borderTopWidth)).toBeGreaterThan(0);
    } finally {
      await emulate("none");
    }
  },
};

// ---- `TableToolbar.Filters`: the sheet, by real input in a real browser (ADR-0199). ----

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

/** A real key press through the Chrome DevTools Protocol. */
async function realKey(key: "Tab" | "Enter" | "Escape") {
  const codes = { Tab: 9, Enter: 13, Escape: 27 } as const;
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: codes[key], ...(key === "Enter" ? { text: "\r" } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: codes[key] });
}

const isDrawn = (element: Element) => element.getClientRects().length > 0;

export const FiltersInlineWhileTheBarIsWide: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Filters — inline above the step, no sheet button — layout test",
  render: () => (
    <div style={{ inlineSize: "60rem" }}>
      <FiltersDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "Filters" });
    await expect(isDrawn(toolbar)).toBe(true);
    await expect(within(toolbar).getAllByRole("button").map((button) => button.textContent)).toEqual(["Status", "Owner"]);
    // The sheet's button is in the page but not drawn, so it is out of the tab order and the accessibility tree.
    const sheetButton = canvasElement.querySelector<HTMLElement>('button[aria-haspopup="dialog"][aria-label="Filters"]')!;
    await expect(isDrawn(sheetButton)).toBe(false);
    await expect(canvas.queryByRole("button", { name: "Filters" })).toBeNull();
  },
};

export const FiltersSheetByRealClick: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Filters — below the step the sheet opens by a real click at the bottom edge, a choice follows into the button, Done closes it and focus returns — interaction test",
  render: () => (
    <div style={{ inlineSize: "24rem" }}>
      <FiltersDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Narrow: the inline filters are not drawn and the sheet's button is.
    await expect(canvas.queryByRole("toolbar", { name: "Filters" })).toBeNull();
    const button = canvas.getByRole("button", { name: "Filters" });
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await realClick(button);
    const sheet = await within(document.body).findByRole("dialog");
    // The sheet is the window's width and sits on the bottom edge.
    await waitFor(() => expect(Math.abs(sheet.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2));
    await expect(Math.round(sheet.getBoundingClientRect().width)).toBe(window.innerWidth);
    await expect(within(sheet).getByRole("heading", { level: 3, name: "Status" })).toBeVisible();
    await expect(within(sheet).getByRole("heading", { level: 3, name: "Owner" })).toBeVisible();
    // A real click on a checkbox in the sheet: the sheet stays open and the button behind it says one filter is applied.
    await realClick(within(sheet).getByRole("checkbox", { name: "Open" }));
    await waitFor(() => expect(canvasElement.querySelector('button[aria-label="Filters, 1 active"]')).not.toBeNull());
    await expect(within(sheet).getByRole("button", { name: "Clear all" })).toBeEnabled();
    await realClick(within(sheet).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(canvasElement.querySelector('button[aria-label="Filters, 1 active"]')).toHaveFocus());
  },
};

export const FiltersSheetByRealKeys: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Filters — the sheet opens with Enter on its button, takes focus, and Escape closes it with focus back on the button — interaction test",
  render: () => (
    <div style={{ inlineSize: "24rem" }}>
      <FiltersDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Filters" });
    button.focus();
    await realKey("Enter");
    const sheet = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
    await realKey("Escape");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
  },
};

export const FiltersSheetClosesWhenTheBarGrows: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Filters — an open sheet closes when the bar grows past the step, and the filters are inline — interaction test",
  render: () => (
    <div style={{ inlineSize: "24rem" }} data-testid="box">
      <FiltersDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await realClick(canvas.getByRole("button", { name: "Filters" }));
    await within(document.body).findByRole("dialog");
    canvas.getByTestId("box").style.inlineSize = "60rem";
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(canvas.getByRole("toolbar", { name: "Filters" })).toBeVisible());
    // Wait for the sheet's exit to finish, so the accessibility run that follows sees a settled page.
    await waitFor(() => expect(document.body.querySelector("[data-radix-focus-guard]")).toBeNull());
  },
};

export const FilterShowsItsChoiceBeforeItsName: Story = {
  ...hidden,
  tags: ["!dev"],
  name: "Filter — a value shows the choice, the name is drawn before the button and the button is named by both — layout test",
  render: () => (
    <div style={{ inlineSize: "60rem" }}>
      <FiltersDemo labelPlacement="before" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Status: All" });
    await expect(button).toHaveTextContent("All");
    const name = canvas.getByText("Status:");
    // The name is before the button, on the same line, and the button does not shift when the choice changes.
    await expect(name.getBoundingClientRect().right).toBeLessThanOrEqual(button.getBoundingClientRect().left + 1);
    await expect(Math.abs(name.getBoundingClientRect().top - button.getBoundingClientRect().top)).toBeLessThan(20);
    await userEvent.click(button);
    await userEvent.click(await within(document.body).findByRole("checkbox", { name: "Open" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Status: Open" })).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
  },
};
