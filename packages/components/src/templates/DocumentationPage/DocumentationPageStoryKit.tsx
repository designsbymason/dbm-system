import { MagnifyingGlassIcon } from "@dbm-system/icons";
import type { RefObject } from "react";
import { Alert } from "../../molecules/Alert";
import { CodeBlock } from "../../molecules/CodeBlock";
import { PageHeader } from "../../molecules/PageHeader";
import { Table } from "../../molecules/Table";
import { TableOfContents } from "../../molecules/TableOfContents";
import { BackToTop } from "../../atoms/BackToTop";
import { Container } from "../../atoms/Container";
import { Heading } from "../../atoms/Heading";
import { Link } from "../../atoms/Link";
import { Text } from "../../atoms/Text";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar, useSidebar } from "../../organisms/Sidebar";
import { IconButton } from "../../atoms/IconButton";
import { preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { PageShell } from "../PageShell";
import { PageFrame } from "../_shared/PageFrame";
import { skipToMain } from "../_shared/skipToMain";
import styles from "./DocumentationPage.module.css";

// The page's words, in one place. A documentation page is static, so there is no router and no state: the demo's only controls are how long the page
// is and whether it has a contents list.
interface DocumentationSection {
  id: string;
  title: string;
  text: string;
  /** Sections inside it: headings one level down, which the outline draws as entries inside the section's. */
  subsections?: Array<{ id: string; title: string; text: string }>;
}

export const documentationCopy = {
  brand: "dbM Docs",
  mainNavigation: "Main",
  docs: "Docs",
  components: "Components",
  foundations: "Foundations",
  siteLinks: ["Docs", "Components", "Foundations"],
  sidebarName: "Documentation",
  siteSection: "Site",
  search: "Search",
  // The sidebar belongs to the header link that is current: with "Components" current it holds only the components.
  sidebarItems: ["Badge", "Button", "ButtonGroup", "Card", "Checkbox", "Dialog"],
  title: "Button",
  intro: "A control that starts an action: submit a form, open a dialog, move to the next step.",
  contentsTitle: "On this page",
  contentsName: "Contents",
  contentsRowName: "Page sections",
  sections: [
    { id: "overview", title: "Overview", text: "A button says what will happen when it is pressed. Give it a short verb as its label, and use one primary button for the main action on a page." },
    { id: "usage", title: "Usage", text: "Import the component and give it a label. A button that only has an icon needs an accessible name, since there is no text to read." },
    { id: "variants", title: "Variants", text: "Four variants cover most pages: a filled one for the main action, an outlined one for a second choice, a quiet one for toolbars and a link-like one for inline actions.", subsections: [
      { id: "solid", title: "Solid", text: "The filled button is for the one action a view is about." },
      { id: "outlined", title: "Outlined", text: "The outlined button is for a second choice that should not compete with it." },
    ] },
    { id: "properties", title: "Properties", text: "Every prop has a default, so the smallest button is a label. These are the ones used most." },
    { id: "accessibility", title: "Accessibility", text: "A button is a native button: it is reached by Tab, pressed with Enter or Space, and announced with its name and its state." },
    { id: "related", title: "Related components", text: "A link that looks like a button is still a link: use a button for an action and a link for going somewhere." },
  ] as DocumentationSection[],
  note: "Use one primary button per view. More than one makes it unclear which action matters most.",
  code: 'import { Button } from "@dbm-system/components";\n\n<Button onClick={save}>Save changes</Button>',
  tableName: "Button properties",
  tableColumns: ["Prop", "Default", "What it does"],
  tableRows: [
    ["variant", '"solid"', "The look: solid, outlined, ghost or link."],
    ["size", '"md"', "The height and text size."],
    ["disabled", "false", "Turns the button off and out of the tab order."],
  ],
  previous: "Badge",
  next: "ButtonGroup",
  previousLabel: "Previous",
  nextLabel: "Next",
  pagesNavigation: "Pages",
  footer: "© dbM Docs",
  footerNavigation: "Footer",
  footerLinks: ["Help", "Privacy", "Terms"],
};

export interface DocumentationPageProps {
  /** Draws the page in a box of its own, for a Docs page, where a page as tall as the window would fill it. */
  framed?: boolean;
  /** How many of the demo's six sections the page has. */
  sections?: number;
  /** Whether the end column holds a table of contents. */
  contents?: boolean;
}

/** How far from the top of the page a heading lands after a jump, in pixels: the sticky header's height (59px) and a gap. One value for the sections' `scroll-margin` and the outline's `scrollOffset`, so the browser's jump and the outline's click land alike. */
const headerClearance = 80;

/** The items of the current header link's section, as links. */
function SectionItems() {
  return (
    <>
      {documentationCopy.sidebarItems.map((item) => (
        <Sidebar.Item key={item} href="#" current={item === documentationCopy.title || undefined} onClick={preventNavigation}>
          {item}
        </Sidebar.Item>
      ))}
    </>
  );
}

/**
 * The sidebar's content. On the page it is the current header link's section (the components). In the phone panel (`useSidebar().inPanel`) it is the
 * header's links too, since the header hides them there: each is an item, and the current one is an expandable group holding its section, so one
 * drawer holds the whole site.
 */
function SidebarLinks() {
  const { inPanel } = useSidebar();
  const copy = documentationCopy;
  if (!inPanel) {
    return (
      <Sidebar.Section label={copy.components}>
        <SectionItems />
      </Sidebar.Section>
    );
  }
  return (
    <Sidebar.Section label={copy.siteSection}>
      {copy.siteLinks.map((link) =>
        link === copy.components ? (
          <Sidebar.Group key={link} label={link} current>
            <SectionItems />
          </Sidebar.Group>
        ) : (
          <Sidebar.Item key={link} href="#" onClick={preventNavigation}>
            {link}
          </Sidebar.Item>
        ),
      )}
    </Sidebar.Section>
  );
}

/**
 * A documentation page: the site's navigation in a `Sidebar` at the start, the page in the middle (the page's head, sections with a code
 * block, a table and a note, and links to the previous and next page) and a table of contents at the end. All of it is existing components in a
 * `PageShell`; nothing here is drawn by hand. A `Sidebar.Provider` wraps the shell so the header's menu button can open the sidebar's panel on a
 * phone (`AppShell` does that for you).
 */
export function DocumentationPage({ framed = false, sections = 6, contents = true }: DocumentationPageProps) {
  const copy = documentationCopy;
  const shown = copy.sections.slice(0, Math.max(1, Math.min(sections, copy.sections.length)));
  // The outline's entries, flat: each section and the sections inside it one level down.
  const contentsItems = shown.flatMap((section) => [
    { id: section.id, label: section.title, level: 1 as const },
    ...(section.subsections ?? []).map((sub) => ({ id: sub.id, label: sub.title, level: 2 as const })),
  ]);
  const page = (frameRef: RefObject<HTMLDivElement | null> | undefined) => (
    <Sidebar.Provider collapseBelow="lg">
      <PageShell>
        {/* In an app a router handles the link; here the click moves focus to the main area itself and keeps the preview's address unchanged. */}
        <PageShell.SkipLink onClick={skipToMain} />
        {/* The header spans the window, so its brand lines up with the navigation column below it and its actions with the outline's edge. Its links are
            hidden below `lg` and offered in the sidebar's panel instead (`hideBelow`, with `collapseBelow="never"` so the bar draws no menu button of its
            own), so a phone has one menu button and one drawer. */}
        <Navbar sticky collapseBelow="never" scrollContainerRef={frameRef}>
          <Navbar.Row columns="balanced">
            {/* The menu button is first so it is at the start of the bar, and the brand in the middle, on a phone, with the search at the end. */}
            <Sidebar.MenuButton variant="tertiary" tone="brand" size="sm" />
            <Navbar.Brand href="#" onClick={preventNavigation} column="center" className={styles.headerStart}>
              {copy.brand}
            </Navbar.Brand>
            {/* The ends are as wide as each other above `lg`, so the links are exactly in the middle of the window. */}
            <Navbar.Links aria-label={copy.mainNavigation} align="center" hideBelow="lg">
              {copy.siteLinks.map((link) => (
                <Navbar.Link key={link} href="#" current={link === copy.components || undefined} onClick={preventNavigation}>
                  {link}
                </Navbar.Link>
              ))}
            </Navbar.Links>
            <Navbar.Actions column="end" className={styles.headerEnd}>
              <IconButton icon={MagnifyingGlassIcon} aria-label={copy.search} variant="tertiary" tone="brand" size="sm" />
            </Navbar.Actions>
          </Navbar.Row>
        </Navbar>
        {/* The page's width is the columns', so the body spans the window and the page is kept to a reading width inside `Main`. */}
        <PageShell.Body width="full" paddingInline={0} paddingBlock={0}>
          <Sidebar
            className={styles.sidebar}
            sticky
            // The sidebar sticks under the header at the height the shell measured for it.
            stickyOffset="var(--page-shell-header-height, 0px)"
            // A Docs page frames the page in a box narrower than a window, so its columns are narrower there.
            width={framed ? "12rem" : "16rem"}
            // The phone panel is wider than the column, with room for the site's links and the sections under them.
            panelWidth="20rem"
          >
            <Sidebar.Content>
              <Sidebar.Nav aria-label={copy.sidebarName}>
                <SidebarLinks />
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
          <PageShell.Main>
            {contents && (
              // The outline as a row of pills at the top of the page, sticking under the header, where the column has no room (below `lg`; the column takes
              // over from there). A pill with sections inside it opens them in a panel. Its own name, so the two outlines are told apart.
              <TableOfContents
                layout="row"
                sticky
                stickyOffset="var(--page-shell-header-height, 0px)"
                className={styles.outlineRow}
                style={{ paddingInline: framed ? "var(--dbm-space-4)" : "var(--dbm-space-6)" }}
                items={contentsItems}
                scrollContainerRef={frameRef}
                aria-label={copy.contentsRowName}
              />
            )}
            <Container size="md" paddingInline={framed ? 4 : 6} style={{ paddingBlock: "var(--dbm-space-8)", display: "grid", gap: "var(--dbm-space-8)" }}>
              <PageHeader>
                <PageHeader.Title>{copy.title}</PageHeader.Title>
                <PageHeader.Description>{copy.intro}</PageHeader.Description>
              </PageHeader>
              {shown.map((section) => (
                <section key={section.id} aria-labelledby={`${section.id}-heading`} id={section.id} style={{ display: "grid", gap: "var(--dbm-space-4)", scrollMarginBlockStart: headerClearance }}>
                  <Heading level={2} size="lg" id={`${section.id}-heading`}>
                    {section.title}
                  </Heading>
                  <Text>{section.text}</Text>
                  {section.subsections?.map((sub) => (
                    <div key={sub.id} style={{ display: "grid", gap: "var(--dbm-space-2)", scrollMarginBlockStart: headerClearance }}>
                      <Heading level={3} size="md" id={sub.id} style={{ scrollMarginBlockStart: headerClearance }}>
                        {sub.title}
                      </Heading>
                      <Text>{sub.text}</Text>
                    </div>
                  ))}
                  {section.id === "overview" && (
                    <Alert tone="info">
                      <Alert.Description>{copy.note}</Alert.Description>
                    </Alert>
                  )}
                  {section.id === "usage" && <CodeBlock language="tsx" code={copy.code} />}
                  {section.id === "properties" && (
                    <Table aria-label={copy.tableName}>
                      <Table.Header>
                        <Table.Row>
                          {copy.tableColumns.map((column) => (
                            <Table.HeaderCell key={column}>{column}</Table.HeaderCell>
                          ))}
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {copy.tableRows.map(([prop, fallback, what]) => (
                          <Table.Row key={prop}>
                            <Table.HeaderCell scope="row">{prop}</Table.HeaderCell>
                            <Table.Cell>{fallback}</Table.Cell>
                            <Table.Cell>{what}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )}
                </section>
              ))}
              <nav aria-label={copy.pagesNavigation} style={{ display: "flex", justifyContent: "space-between", gap: "var(--dbm-space-4)", flexWrap: "wrap" }}>
                <Link href="#" onClick={preventNavigation}>
                  {copy.previousLabel}: {copy.previous}
                </Link>
                <Link href="#" onClick={preventNavigation}>
                  {copy.nextLabel}: {copy.next}
                </Link>
              </nav>
            </Container>
          </PageShell.Main>
          {contents && (
            // A complementary landmark beside the page: the outline of its sections, which follows the scroll. Below `lg` it drops under the page, the step
            // at which the sidebar leaves for its panel: the body stacks as a whole, so the two share a step.
            <PageShell.Aside aria-label={copy.contentsTitle} className={styles.outline} sticky width={framed ? "11rem" : "14rem"} style={{ paddingBlock: "var(--dbm-space-8)", paddingInlineEnd: "var(--dbm-space-4)" }}>
              <TableOfContents
                items={contentsItems}
                scrollOffset={headerClearance}
                scrollContainerRef={frameRef}
                aria-label={copy.contentsName}
              />
            </PageShell.Aside>
          )}
        </PageShell.Body>
        <PageShell.Footer>
          <PageShell.Content paddingBlock={4} style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", justifyContent: "space-between" }}>
            <Text size="sm" color="secondary">
              {copy.footer}
            </Text>
            <nav aria-label={copy.footerNavigation} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
              {copy.footerLinks.map((label) => (
                <Link key={label} href="#" size="sm" onClick={preventNavigation}>
                  {label}
                </Link>
              ))}
            </nav>
          </PageShell.Content>
        </PageShell.Footer>
        {/* Fixed to the window's corner once the page has scrolled; in a Docs page's frame it follows the frame's own scrolling. */}
        <BackToTop scrollContainerRef={frameRef} />
      </PageShell>
    </Sidebar.Provider>
  );
  return <PageFrame framed={framed}>{page}</PageFrame>;
}
