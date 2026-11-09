import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Fragment, useRef, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { SpaceValue } from "@dbm-system/utils";
import { Navbar } from "./Navbar";
import { navbarPlaygroundSnippet, navbarSnippets } from "./Navbar.snippets";
import type { NavbarCollapseBelow, NavbarCurrentVariant, NavbarLinkSize, NavbarProps, NavbarSize, NavbarVariant } from "./Navbar.types";
import { DemoColumnsBars, DemoNavbar, DemoRowsNavbar, DemoSectionsNavbar, GalleryBar, NavbarStage, RouterDemoNavbar, NavbarViewModeContext, ScrollStage, StickyDemo } from "./NavbarStoryKit";

// Navbar's root-level args in one Playground, every prop listed in the one order the Docs table uses: the ones a person can
// edit have a control, and the rest (children, callbacks, refs, objects, the standard attributes) show as "–". Each sub-part
// gets its own Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  children?: ReactNode;
  variant: NavbarVariant;
  currentVariant: NavbarCurrentVariant;
  rounded: boolean;
  size: NavbarSize;
  linkSize?: NavbarLinkSize;
  contained: boolean;
  collapseBelow: NavbarCollapseBelow;
  menuSide: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate: boolean;
  menuOpen?: boolean;
  defaultMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onMenuOpenChangeComplete: (open: boolean) => void;
  menuContainer?: HTMLElement | null;
  sticky: boolean;
  hideOnScroll: boolean;
  stickyOffset: SpaceValue;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  dir: "ltr" | "rtl";
  labels?: NavbarProps["labels"];
  "aria-label": string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id: string;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => navbarPlaygroundSnippet(context.args),
};

/** The Playground's editable props, which every other story switches off (each shows one fixed arrangement). */
const editableArgs = [
  "variant",
  "currentVariant",
  "rounded",
  "size",
  "linkSize",
  "contained",
  "collapseBelow",
  "menuSide",
  "closeMenuOnNavigate",
  "defaultMenuOpen",
  "sticky",
  "hideOnScroll",
  "stickyOffset",
  "dir",
  "aria-label",
  "id",
] as const;

const noControls = Object.fromEntries(editableArgs.map((name) => [name, { control: false }])) as Record<
  (typeof editableArgs)[number],
  { control: false }
>;

// The stage is a box with a transform, so the menu panel and its scrim stay inside it (every Canvas on a Docs page shares
// one document); the bar sits at the top of it, as it does in a page.
function Top({ children }: { children: ReactNode }) {
  return <div style={{ inlineSize: "100%", alignSelf: "start" }}>{children}</div>;
}

// Controls with no live editing, listed so the panel names every prop the bar takes.
const readOnly = (description: string) => ({ control: false as const, description });

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/Navbar",
  parameters: { layout: "padded" },
  decorators: [
    // `defaultMenuOpen` is only read when the bar mounts, so changing its control remounts the bar.
    (Story, context) => (
      <Fragment key={String(context.args.defaultMenuOpen)}>
        <NavbarViewModeContext.Provider value={context.viewMode === "docs" ? "docs" : "story"}>
          <Story />
        </NavbarViewModeContext.Provider>
      </Fragment>
    ),
  ],
  argTypes: {
    children: readOnly(
      "The bar's parts, in reading order: directly (Navbar.Brand, Navbar.Links, Navbar.Search, Navbar.Actions), or in Navbar.Rows. The Playground draws a fixed one-row bar; see the stories below for rows and search.",
    ),
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost", "frosted"],
      description: "How the bar itself is drawn: a surface with a line under it, the same surface with no line, nothing of its own, or a translucent blurred surface. The fill is the row's, so a different colour is a style on the Navbar.Row (or on the bar with ghost), not a prop.",
      table: { defaultValue: { summary: '"outlined"' } },
    },
    currentVariant: {
      control: "select",
      options: ["underline", "subtle", "solid"],
      description:
        "How the current page's link is marked: a brand line under it, a tinted pill, or a brand fill. aria-current is set whichever it is, and the look is the same in the phone panel.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounded links: each link and group button is a pill, with the current link's tint or fill following the shape. The links round, not the bar.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description:
        "The bar's height, and the default for its rows: as tall as an IconButton of the same step plus room above and below.",
      table: { defaultValue: { summary: '"md"' } },
    },
    linkSize: {
      control: "select",
      options: ["auto", "xs", "sm", "md", "lg", "xl"],
      mapping: { auto: undefined },
      description:
        "The text size, icon size and padding of the links, on Menu's five steps, apart from the bar's height. auto follows size (xs and sm read xs and sm, md reads sm, lg reads md), so nothing changes; a quiet set reads one step below it when one is set. A group's dropdown takes the same step for its items.",
    },
    contained: {
      control: "boolean",
      description: "Keeps the content to the page's reading width with Container, centred.",
      table: { defaultValue: { summary: "false" } },
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the links leave the bar for a menu button. It follows the window's width, not the demo's frame: resize the window to see it.",
      table: { defaultValue: { summary: '"md"' } },
    },
    menuSide: {
      control: "select",
      options: ["start", "end", "top", "bottom"],
      description: "Which edge the menu panel slides in from. start and end swap in right-to-left.",
      table: { defaultValue: { summary: '"start"' } },
    },
    closeMenuOnNavigate: {
      control: "boolean",
      description: "Closes the menu panel when a link in it is chosen.",
      table: { defaultValue: { summary: "true" } },
    },
    menuOpen: readOnly("The controlled open state of the menu panel. The Playground lets the bar manage it (see defaultMenuOpen)."),
    defaultMenuOpen: {
      control: "boolean",
      description: "Starts with the menu panel open. Only read when the bar mounts, so changing it redraws the bar.",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: readOnly("Called with the new open state of the menu panel, and { reason }."),
    onMenuOpenChangeComplete: readOnly("Called with true once the menu panel has finished opening and with false once it has finished closing."),
    menuContainer: readOnly(
      "The element the bar's overlays are drawn into instead of document.body. The Playground gives it its own frame.",
    ),
    sticky: {
      control: "boolean",
      description:
        "Keeps the bar at the top of the page as it scrolls, with a shadow while stuck. The Playground's frame doesn't scroll, so see the Sticky story.",
      table: { defaultValue: { summary: "false" } },
    },
    hideOnScroll: {
      control: "boolean",
      if: { arg: "sticky" },
      description:
        "Hides a sticky bar while the reader scrolls down and brings it back on a scroll up. Needs sticky. While the bar is slid out its header carries data-away. The Playground's frame doesn't scroll, so see the Hides on scroll story.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      if: { arg: "sticky" },
      description: "How far from the top a sticky bar sticks, from the spacing scale. No effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: readOnly(
      "The scrollable container a sticky bar sticks within, if it isn't the page. The Sticky stories give it a box of their own.",
    ),
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the bar and the menu panel. Not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: readOnly("The text the bar supplies itself: menu, navigation, close, skipLink, externalLink and search."),
    "aria-label": {
      control: "text",
      description: "Names the banner landmark, for a page with more than one header. Empty leaves it unnamed.",
    },
    "aria-labelledby": readOnly("The id of a visible element that names the banner landmark, in place of aria-label."),
    "aria-describedby": readOnly("The id of a description for the bar."),
    id: { control: "text", description: "Standard DOM id. Empty leaves it out." },
    className: readOnly("Additional CSS classes, on the <header> element."),
    style: readOnly("Inline styles, merged onto the component's own internal styles."),
    "data-testid": readOnly(
      "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    ),
  },
  // Storybook lists a Controls panel's props in the order of `args` first and the rest after, so every prop has an entry here, in the
  // order the Docs table uses; the ones with no live control (`undefined`) still sit where the table puts them.
  args: {
    children: undefined,
    variant: "outlined",
    currentVariant: "underline",
    rounded: false,
    size: "md",
    // "auto" is the select's option for "follow size"; its `mapping` turns it into `undefined` before the story renders
    linkSize: "auto" as unknown as NavbarLinkSize,
    contained: false,
    collapseBelow: "md",
    menuSide: "start",
    closeMenuOnNavigate: true,
    menuOpen: undefined,
    defaultMenuOpen: false,
    onMenuOpenChange: fn(),
    onMenuOpenChangeComplete: fn(),
    menuContainer: undefined,
    sticky: false,
    hideOnScroll: false,
    stickyOffset: 0,
    scrollContainerRef: undefined,
    dir: "ltr",
    labels: undefined,
    "aria-label": "",
    "aria-labelledby": undefined,
    "aria-describedby": undefined,
    id: "",
    className: undefined,
    style: undefined,
    "data-testid": undefined,
  },
  // (an empty text control means "not set": it must not reach the bar as `aria-label=""` or `id=""`)
  // The bar sits at the top of one box with text under it that scrolls, so `sticky`, `stickyOffset` and `hideOnScroll` can be tried by scrolling it:
  // the box is the bar's `scrollContainerRef` unless the control gives another.
  render: ({ "aria-label": ariaLabel, id, ...args }) => (
    <ScrollStage>
      {(menuContainer, scrollRef) => (
        <DemoNavbar
          {...args}
          aria-label={ariaLabel || undefined}
          id={id || undefined}
          menuContainer={menuContainer}
          scrollContainerRef={args.scrollContainerRef ?? scrollRef}
        />
      )}
    </ScrollStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Variants: Story = {
  name: "Variants",
  parameters: { docs: { source: { code: navbarSnippets.variants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["outlined", "filled", "ghost", "frosted"] as const).map((variant) => (
            <GalleryBar key={variant} name={`${variant} bar`}>
              {variant === "frosted" ? (
                // A frosted bar blurs what is behind it, so it sits over a few shapes in the brand's colours to show it.
                <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--dbm-radius-md)", background: "var(--dbm-bg-brand-subtle)" }}>
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: "var(--dbm-space-8)", paddingInline: "var(--dbm-space-8)" }}>
                    {["var(--dbm-bg-brand)", "var(--dbm-bg-danger)", "var(--dbm-bg-brand)", "var(--dbm-bg-danger)", "var(--dbm-bg-brand)"].map((color, index) => (
                      <span key={index} style={{ flex: "none", inlineSize: "var(--dbm-space-12)", blockSize: "var(--dbm-space-12)", borderRadius: "var(--dbm-radius-full)", background: color }} />
                    ))}
                  </div>
                  <div style={{ position: "relative" }}>
                    <DemoNavbar variant={variant} linksLabel={`${variant} navigation`} menuContainer={menuContainer} collapseBelow={args.collapseBelow} />
                  </div>
                </div>
              ) : (
                <DemoNavbar
                  variant={variant}
                  linksLabel={`${variant} navigation`}
                  menuContainer={menuContainer}
                  collapseBelow={args.collapseBelow}
                />
              )}
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const LinkSizes: Story = {
  name: "Link size",
  parameters: { docs: { source: { code: navbarSnippets.linkSizes } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="40rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((linkSize) => (
            <GalleryBar key={linkSize} name={`${linkSize} links`}>
              <DemoNavbar linkSize={linkSize} linksLabel={`${linkSize} links`} menuContainer={menuContainer} collapseBelow={args.collapseBelow} extras />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const CurrentVariants: Story = {
  name: "Marking the current page",
  parameters: { docs: { source: { code: navbarSnippets.currentVariants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["underline", "subtle", "solid"] as const).map((currentVariant) => (
            <GalleryBar key={currentVariant} name={`${currentVariant} current link`}>
              <DemoNavbar
                currentVariant={currentVariant}
                linksLabel={`${currentVariant} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const Rounded: Story = {
  name: "Rounded links",
  parameters: { docs: { source: { code: navbarSnippets.rounded } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["subtle", "solid"] as const).map((currentVariant) => (
            <GalleryBar key={currentVariant} name={`rounded ${currentVariant} bar`}>
              <DemoNavbar
                rounded
                currentVariant={currentVariant}
                withGroup
                linksLabel={`rounded ${currentVariant} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: navbarSnippets.sizes } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar
                size={size}
                linksLabel={`${size} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const WithActions: Story = {
  name: "Search and an account menu",
  parameters: { docs: { source: { code: navbarSnippets.actions } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="rich" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const WithGroup: Story = {
  name: "Links that open more links",
  parameters: { docs: { source: { code: navbarSnippets.group } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar withGroup actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const GroupInThePanel: Story = {
  name: "A group in the menu panel",
  parameters: { docs: { source: { code: navbarSnippets.group } } },
  argTypes: { ...noControls },
  render: () => (
    // Collapsed below the widest step, so the menu button shows on any window narrower than 1920px.
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar withGroup collapseBelow="3xl" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "Links that open more links": choosing a link in the group marks the group as holding the current page. */
export const GroupCurrentInteraction: Story = {
  ...WithGroup,
  name: "Links that open more links — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const address = window.location.href;
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    const item = await within(document.body).findByRole("menuitem", { name: "Guides" });
    await userEvent.click(item);
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
    expect(window.location.href).toBe(address);
    // the group now holds the current page, and the plain link is no longer it
    expect(canvas.getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    expect(await within(document.body).findByRole("menuitem", { name: "Guides" })).toHaveAttribute("aria-current", "page");
    await userEvent.keyboard("{Escape}");
    // end with the menu gone: an accessibility check run mid-exit sees the page still hidden behind it
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
  },
};

export const Rows: Story = {
  name: "A header of several rows",
  parameters: { docs: { source: { code: navbarSnippets.rows } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Top>
          <DemoRowsNavbar navigable menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const Columns: Story = {
  name: "A row in columns",
  parameters: { docs: { source: { code: navbarSnippets.columns } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">{(menuContainer) => <DemoColumnsBars menuContainer={menuContainer} />}</NavbarStage>
  ),
};

export const RowsInThePanel: Story = {
  name: "Several sets of links in the menu panel",
  parameters: { docs: { source: { code: navbarSnippets.rowsPanel } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so the links and the search field are in the panel and the sheet on any window narrower than 1920px.
    <NavbarStage minBlockSize="32rem">
      {(menuContainer) => (
        <Top>
          <DemoRowsNavbar collapseBelow="3xl" searchCollapseBelow="3xl" iconTone="brand" navigable menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const SearchOnAPhone: Story = {
  name: "Search as a sheet",
  parameters: { docs: { source: { code: navbarSnippets.search } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <Top>
          <DemoRowsNavbar
            searchCollapseBelow="3xl"
            iconTone="brand"
            labels={false}
            courtesyRow={false}
            primaryRow={false}
            linksInLogoRow
            rowSize="md"
            columns="auto 1fr auto"
            searchWithActions
            navigable
            menuContainer={menuContainer}
          />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const RowsScrollAway: Story = {
  name: "A strip that scrolls away",
  parameters: { docs: { source: { code: navbarSnippets.rowsSticky } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoRowsNavbar sticky labels={false} navigable scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const SectionsRow: Story = {
  name: "A second row of links that scrolls away",
  parameters: { docs: { source: { code: navbarSnippets.rowsSections } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoSectionsNavbar sticky scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const Contained: Story = {
  name: "Contained",
  parameters: { docs: { source: { code: navbarSnippets.contained } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar contained variant="filled" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const CollapsedMenu: Story = {
  name: "The menu panel",
  parameters: { docs: { source: { code: navbarSnippets.menu } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so this bar shows its menu button on any window narrower than 1920px, which is how the
    // collapse can be shown on a Docs page; an app picks the step that suits its links.
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar collapseBelow="3xl" menuSide="start" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const CollapseStep: Story = {
  name: "Where it collapses",
  parameters: { docs: { source: { code: navbarSnippets.collapse } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          <GalleryBar name="collapses below lg">
            <DemoNavbar collapseBelow="lg" linksLabel="Collapses below lg" menuContainer={menuContainer} />
          </GalleryBar>
          <GalleryBar name="never collapses">
            <DemoNavbar collapseBelow="never" linksLabel="Never collapses" menuContainer={menuContainer} />
          </GalleryBar>
        </div>
      )}
    </NavbarStage>
  ),
};

export const Sticky: Story = {
  name: "Sticky",
  parameters: { docs: { source: { code: navbarSnippets.sticky } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>{(ref) => <DemoNavbar sticky variant="frosted" scrollContainerRef={ref} />}</StickyDemo>
    );
  },
};

export const ResponsiveActions: Story = {
  name: "Actions that move into the menu panel",
  parameters: { docs: { source: { code: navbarSnippets.responsiveActions } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so the button leaves the bar and shows in the panel on any window narrower than 1920px.
    <NavbarStage minBlockSize="28rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="responsive" collapseBelow="3xl" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const HiddenLinks: Story = {
  name: "Links offered somewhere else",
  parameters: { docs: { source: { code: navbarSnippets.hiddenLinks } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so the links leave the bar on any window narrower than 1920px; `collapseBelow="never"` keeps the bar from drawing a menu button of its own.
    <Top>
      <Navbar collapseBelow="never" aria-label="Example">
        <Navbar.Brand href="#">dbM</Navbar.Brand>
        <Navbar.Links aria-label="Main" hideBelow="3xl">
          <Navbar.Link href="#products" current>
            Products
          </Navbar.Link>
          <Navbar.Link href="#pricing">Pricing</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar.Action>
            <Button size="sm">Sign in</Button>
          </Navbar.Action>
        </Navbar.Actions>
      </Navbar>
    </Top>
  ),
};

export const SkipLink: Story = {
  name: "A skip link",
  parameters: { docs: { source: { code: navbarSnippets.skipLink } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <Top>
          <p style={{ margin: "var(--dbm-space-3)", fontSize: "var(--dbm-font-size-sm)" }}>
            Click here, then press Tab: the skip link is the first thing reached, and appears over the top corner.
          </p>
          <DemoNavbar skipLink menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const LinkExtras: Story = {
  name: "Icons, counts and external links",
  parameters: { docs: { source: { code: navbarSnippets.linkExtras } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar
            extras
            pricingBadge={<Badge tone="success" variant="subtle">New</Badge>}
            actions="none"
            collapseBelow="never"
            menuContainer={menuContainer}
          />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const LinksAlign: Story = {
  name: "Where the links sit",
  parameters: { docs: { source: { code: navbarSnippets.linksAlign } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["start", "center", "end"] as const).map((align) => (
            <GalleryBar key={align} name={`${align} links`}>
              <DemoNavbar
                linksAlign={align}
                linksLabel={`${align} navigation`}
                collapseBelow="never"
                menuContainer={menuContainer}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const GhostOverAHero: Story = {
  name: "Transparent until it sticks",
  parameters: { docs: { source: { code: navbarSnippets.ghostSticky } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef} hero tinted>
        {(ref) => <DemoNavbar sticky variant="ghost" scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const HidesOnScroll: Story = {
  name: "Hides on scroll",
  parameters: { docs: { source: { code: navbarSnippets.hideOnScroll } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoNavbar sticky hideOnScroll scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const CurrentPage: Story = {
  name: "Current page and a disabled link",
  parameters: { docs: { source: { code: navbarSnippets.current } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="none" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "Current page and a disabled link": a link chosen takes the current mark and the page stays where it is. */
export const CurrentPageInteraction: Story = {
  ...CurrentPage,
  name: "Current page and a disabled link — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const address = window.location.href;
    expect(canvas.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(canvas.getByRole("link", { name: "Pricing" }));
    expect(canvas.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    // a demo link goes nowhere: the address is what it was, and a disabled link can't take the mark
    expect(window.location.href).toBe(address);
    await userEvent.click(canvas.getByRole("link", { name: "Beta" }));
    expect(canvas.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "Beta" })).not.toHaveAttribute("aria-current");
    await userEvent.click(canvas.getByRole("link", { name: "dbM" }));
    expect(window.location.href).toBe(address);
  },
};

export const RouterLinks: Story = {
  name: "With a router's links",
  parameters: { docs: { source: { code: navbarSnippets.routerLinks } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <Top>
          {/* A plain anchor stands in for the router's link, which takes the look the same way. */}
          <RouterDemoNavbar menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const ControlledMenu: Story = {
  name: "Controlled from your own state",
  parameters: { docs: { source: { code: navbarSnippets.controlledMenu } } },
  argTypes: { ...noControls },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("nothing yet");
    return (
      <NavbarStage minBlockSize="26rem">
        {(menuContainer) => (
          <Top>
            <DemoNavbar
              collapseBelow="3xl"
              menuOpen={open}
              onMenuOpenChange={(next, details) => {
                setOpen(next);
                setReason(details.reason);
              }}
              menuContainer={menuContainer}
            />
            <p style={{ margin: "var(--dbm-space-3)", fontSize: "var(--dbm-font-size-sm)" }}>
              Menu {open ? "open" : "closed"}; last change reported: {reason}.
            </p>
          </Top>
        )}
      </NavbarStage>
    );
  },
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: navbarSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar
            dir="rtl"
            collapseBelow="3xl"
            labels={{ menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}
            menuContainer={menuContainer}
          />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const OnAPhone: Story = {
  name: "On a phone",
  // Opened on its own, this story is shown at a phone's width (and it is in the test run); on the Docs page it sits in the
  // wide page like every other story, so narrow the window there.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  argTypes: { ...noControls },
  parameters: { docs: { source: { code: navbarSnippets.onAPhone } } },
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "On a phone": presses the button, chooses a link, and checks the bar and the panel behave as on a phone. */
export const OnAPhoneInteraction: Story = {
  ...OnAPhone,
  name: "On a phone — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const stage = within(canvasElement);
    const nav = stage.getByRole("navigation", { hidden: true });
    expect(getComputedStyle(nav).display).toBe("none");
    const button = stage.getByRole("button", { name: "Menu" });
    expect(getComputedStyle(button).display).not.toBe("none");
    await userEvent.click(button);
    const panel = await within(canvasElement).findByRole("dialog", { name: "Menu" });
    const link = within(panel).getByRole("link", { name: "Pricing" });
    // Stand in for a router: handle the navigation without a page load (a hash change would reload the test page).
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(link);
    // the panel's exit takes a moment, longer when the run is busy
    await waitFor(() => expect(stage.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(button).toHaveFocus(), { timeout: 3000 });
  },
};
