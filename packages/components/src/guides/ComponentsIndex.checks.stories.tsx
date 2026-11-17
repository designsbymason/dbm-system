import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ComponentIndex } from "../../.storybook/blocks/ComponentIndex";
import type { RawEntry } from "../../.storybook/blocks/ComponentIndex";

// Hidden real-browser checks for the Index page's component and template tables (guidelines/adr/0013): what jsdom can't do
// (layout at a width). They draw the page's own block, which reads Storybook's index. Docs styles are scoped to `.sbdocs-content`,
// which a story is not inside, so the block is wrapped in one, as the Docs page does.
const meta: Meta = {
  title: "Components/Index/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

/** The index the page is drawn from: a few components, a shell that ships and an example page, tagged the way a story-only page is. */
const docs = (title: string, tags: string[] = []): [string, RawEntry] => {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [id, { id, title, type: "docs", tags }];
};
const index: Record<string, RawEntry> = Object.fromEntries([
  docs("Components/Box"),
  docs("Components/Button"),
  docs("Components/Card"),
  docs("Components/Tabs"),
  docs("Components/DataTable"),
  docs("Components/Sidebar"),
  // A shell is a component in the template tier (its tier and category are the catalog's); the example pages are Templates titles.
  docs("Components/AppShell"),
  docs("Templates/Landing page", ["example-page"]),
  docs("Templates/Data Table List Page", ["example-page"]),
]);

const render = () => (
  <div className="sbdocs sbdocs-content">
    <ComponentIndex index={index} />
  </div>
);

export const PhoneToolbarIsTheCountAndAGroupOfIconButtons: Story = {
  tags: ["!dev"],
  name: "On a phone the components toolbar is the count at the start and, right-aligned, icon buttons for Tier, Category and search, which open panels — layout and interaction test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render,
  play: async ({ canvasElement }) => {
    // Fails loudly if the pinned viewport did not apply.
    await expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const tools = within(await canvas.findByRole("group", { name: "Component list tools" }));
    const tier = await tools.findByRole("button", { name: /^Tier:/ });
    const category = tools.getByRole("button", { name: /^Category:/ });
    const search = tools.getByRole("button", { name: /^Search components/ });
    const count = tools.getByText(/components?$/);
    const table = canvas.getByRole("table", { name: "Components" }).closest(".dbm-getting-started__table") as HTMLElement;
    const tableBox = table.getBoundingClientRect();

    // The toolbar's own search box and filters are not drawn; the count and the three buttons share one line.
    await expect(canvas.queryByRole("searchbox")).toBeNull();
    await expect(tools.getByRole("toolbar", { name: "Filters", hidden: true }).checkVisibility()).toBe(false);
    const mid = (element: Element) => element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;
    for (const button of [tier, category, search]) await expect(Math.abs(mid(button) - mid(count))).toBeLessThan(8);
    // The count is at the start; the buttons are in order Tier, Category, search, with the last at the end edge.
    await expect(Math.abs(count.getBoundingClientRect().left - tableBox.left)).toBeLessThan(4);
    await expect(tier.getBoundingClientRect().right).toBeLessThanOrEqual(category.getBoundingClientRect().left);
    await expect(category.getBoundingClientRect().right).toBeLessThanOrEqual(search.getBoundingClientRect().left);
    await expect(Math.abs(search.getBoundingClientRect().right - tableBox.right)).toBeLessThan(4);
    await expect(count.getBoundingClientRect().right).toBeLessThanOrEqual(tier.getBoundingClientRect().left);

    // The search button opens the search box in a panel, with focus in it; typing narrows the list and the button shows it is in use.
    await userEvent.click(search);
    const box = await within(document.body).findByRole("searchbox", { name: "Search components" });
    await waitFor(() => expect(box).toHaveFocus());
    await userEvent.keyboard("sidebar");
    await waitFor(() => expect(tools.getByText("1 of 7 components")).toBeVisible());
    // (Escape in a search box clears it, so the panel is closed by pressing its button again.)
    await userEvent.click(search);
    await waitFor(() => expect(within(document.body).queryByRole("searchbox")).toBeNull());
    await expect(tools.getByRole("button", { name: "Search components: sidebar" })).toBeVisible();

    // A filter button opens its checkboxes in a panel, and shows the choice in its name.
    await userEvent.click(tier);
    // The panel says which filter it is, since the button has only an icon.
    const panel = await within(document.body).findByRole("dialog", { name: "Tier filter" });
    await waitFor(() => expect(within(panel).getByText("Tier")).toBeVisible());
    await userEvent.click(await within(document.body).findByRole("checkbox", { name: "Atoms" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tools.getByRole("button", { name: "Tier: Atoms" })).toBeVisible());
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhoneTemplateNamesWrapAndShowTheAsterisk: Story = {
  name: "On a phone a long template name is shown in full, and a shell's asterisk is visible — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const templates = await canvas.findByRole("table", { name: "Templates" });
    const page = await within(templates).findByRole("link", { name: /^Data Table List Page/ });
    // The name is whole: it is never cut off (it wraps onto lines if the column is narrow), so no text is clipped.
    await expect((page.closest("th") as HTMLElement).scrollWidth).toBeLessThanOrEqual((page.closest("th") as HTMLElement).clientWidth + 1);
    await expect(getComputedStyle(page).textOverflow).not.toBe("ellipsis");
    // A shell's asterisk is drawn and stays inside its cell.
    const link = within(templates).getByRole("link", { name: /^AppShell/ });
    const cell = link.closest("th") as HTMLElement;
    const star = link.querySelector('[aria-hidden="true"]') as HTMLElement;
    await expect(star.textContent).toBe("*");
    const cellBox = cell.getBoundingClientRect();
    await expect(star.getBoundingClientRect().right).toBeLessThanOrEqual(cellBox.right + 1);
    await expect(star.getBoundingClientRect().width).toBeGreaterThan(0);
  },
};

export const WideToolbarHasNoIconButtons: Story = {
  name: "On a desktop the toolbar has its search box and filters, and the icon buttons are not drawn — layout test",
  render,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const canvas = within(canvasElement);
    const tools = within(await canvas.findByRole("group", { name: "Component list tools" }));
    await expect(tools.getByRole("searchbox", { name: "Search components" })).toBeVisible();
    await expect(tools.getByRole("button", { name: /^Tier: All/ })).toBeVisible();
    await expect((canvasElement.querySelector(".dbm-getting-started__mobiletools") as HTMLElement).checkVisibility()).toBe(false);
  },
};

export const ShellsEndWithAnAsterisk: Story = {
  name: "A template-level component (a shell) ends with an asterisk, in the Templates table only, and a note under it says what it means",
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const templates = await canvas.findByRole("table", { name: "Templates" });
    const shell = await within(templates).findByRole("link", { name: /^AppShell/ });
    // The asterisk is after the name, hidden from assistive technology, which is told "(template-level component)".
    await expect(shell.textContent).toMatch(/^AppShell\*\s*\(template-level component\)$/);
    await expect(shell.querySelector('[aria-hidden="true"]')?.textContent).toBe("*");
    // The example pages are not marked, and the Components table has no asterisks (the shell is listed there, without one).
    await expect(within(templates).getByRole("link", { name: "Data Table List Page" }).textContent).toBe("Data Table List Page");
    await expect(within(templates).getByRole("link", { name: "Landing page" }).textContent).toBe("Landing page");
    await expect(within(canvas.getByRole("table", { name: "Components" })).queryByText("*")).toBeNull();
    await expect(within(canvas.getByRole("table", { name: "Components" })).getByRole("link", { name: "AppShell" })).toBeVisible();
    await expect(canvas.getByText(/^\* A template-level component\. Its page is listed under Components/)).toBeVisible();
  },
};
