import * as icons from "@dbm-system/icons";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as library from "./index";
import { avatarPlaygroundSnippet } from "./atoms/Avatar/Avatar.snippets";
import { buttonPlaygroundSnippet } from "./atoms/Button/Button.snippets";
import { checkboxPlaygroundSnippet } from "./atoms/Checkbox/Checkbox.snippets";
import { closeButtonPlaygroundSnippet } from "./atoms/CloseButton/CloseButton.snippets";
import { fieldErrorPlaygroundSnippet } from "./atoms/FieldError/FieldError.snippets";
import { fieldHelperTextPlaygroundSnippet } from "./atoms/FieldHelperText/FieldHelperText.snippets";
import { fieldLabelPlaygroundSnippet } from "./atoms/FieldLabel/FieldLabel.snippets";
import { iconButtonPlaygroundSnippet } from "./atoms/IconButton/IconButton.snippets";
import { inputPlaygroundSnippet } from "./atoms/Input/Input.snippets";
import { radioPlaygroundSnippet } from "./atoms/Radio/Radio.snippets";
import { switchPlaygroundSnippet } from "./atoms/Switch/Switch.snippets";
import { textareaPlaygroundSnippet } from "./atoms/Textarea/Textarea.snippets";
import { blockquotePlaygroundSnippet } from "./atoms/Blockquote/Blockquote.snippets";
import { codePlaygroundSnippet } from "./atoms/Code/Code.snippets";
import { headingPlaygroundSnippet } from "./atoms/Heading/Heading.snippets";
import { highlightPlaygroundSnippet } from "./atoms/Highlight/Highlight.snippets";
import { kbdPlaygroundSnippet } from "./atoms/Kbd/Kbd.snippets";
import { linkPlaygroundSnippet } from "./atoms/Link/Link.snippets";
import { listItemPlaygroundSnippet } from "./atoms/ListItem/ListItem.snippets";
import { textPlaygroundSnippet } from "./atoms/Text/Text.snippets";
import { escapeJsxText, quote, truncateValue } from "./snippetHelpers";
import { backdropPlaygroundSnippet } from "./atoms/Backdrop/Backdrop.snippets";
import { backToTopPlaygroundSnippet } from "./atoms/BackToTop/BackToTop.snippets";
import { clientOnlyPlaygroundSnippet } from "./atoms/ClientOnly/ClientOnly.snippets";
import { collapsePlaygroundSnippet } from "./atoms/Collapse/Collapse.snippets";
import { focusTrapPlaygroundSnippet } from "./atoms/FocusTrap/FocusTrap.snippets";
import { iconPlaygroundSnippet } from "./atoms/Icon/Icon.snippets";
import { imagePlaygroundSnippet } from "./atoms/Image/Image.snippets";
import { indicatorsPlaygroundSnippet } from "./atoms/Indicators/Indicators.snippets";
import { portalPlaygroundSnippet } from "./atoms/Portal/Portal.snippets";
import { tooltipPlaygroundSnippet } from "./atoms/Tooltip/Tooltip.snippets";
import { visuallyHiddenPlaygroundSnippet } from "./atoms/VisuallyHidden/VisuallyHidden.snippets";
import { aspectRatioPlaygroundSnippet } from "./atoms/AspectRatio/AspectRatio.snippets";
import { bleedPlaygroundSnippet } from "./atoms/Bleed/Bleed.snippets";
import { boxPlaygroundSnippet } from "./atoms/Box/Box.snippets";
import { centerPlaygroundSnippet } from "./atoms/Center/Center.snippets";
import { containerPlaygroundSnippet } from "./atoms/Container/Container.snippets";
import { dividerPlaygroundSnippet } from "./atoms/Divider/Divider.snippets";
import { gridItemPlaygroundSnippet } from "./atoms/GridItem/GridItem.snippets";
import { stackPlaygroundSnippet } from "./atoms/Stack/Stack.snippets";
import { badgePlaygroundSnippet } from "./atoms/Badge/Badge.snippets";
import { progressBarPlaygroundSnippet } from "./atoms/ProgressBar/ProgressBar.snippets";
import { progressCirclePlaygroundSnippet } from "./atoms/ProgressCircle/ProgressCircle.snippets";
import { skeletonPlaygroundSnippet } from "./atoms/Skeleton/Skeleton.snippets";
import { spinnerPlaygroundSnippet } from "./atoms/Spinner/Spinner.snippets";
import { tagPlaygroundSnippet } from "./atoms/Tag/Tag.snippets";
import { accordionPlaygroundSnippet } from "./molecules/Accordion/Accordion.snippets";
import { avatarGroupPlaygroundSnippet } from "./molecules/AvatarGroup/AvatarGroup.snippets";
import { buttonGroupPlaygroundSnippet } from "./molecules/ButtonGroup/ButtonGroup.snippets";
import { cardPlaygroundSnippet } from "./molecules/Card/Card.snippets";
import { checkboxGroupPlaygroundSnippet } from "./molecules/CheckboxGroup/CheckboxGroup.snippets";
import { codeBlockPlaygroundSnippet, codeBlockSnippets, highlightLinesFromText, highlightLinesLiteral } from "./molecules/CodeBlock/CodeBlock.snippets";
import { emptyStatePlaygroundSnippet } from "./molecules/EmptyState/EmptyState.snippets";
import { formFieldPlaygroundSnippet } from "./molecules/FormField/FormField.snippets";
import { gridPlaygroundSnippet } from "./molecules/Grid/Grid.snippets";
import { listPlaygroundSnippet } from "./molecules/List/List.snippets";
import { numberInputPlaygroundSnippet } from "./molecules/NumberInput/NumberInput.snippets";
import { paginationPlaygroundSnippet } from "./molecules/Pagination/Pagination.snippets";
import { passwordInputPlaygroundSnippet } from "./molecules/PasswordInput/PasswordInput.snippets";
import { popoverPlaygroundSnippet } from "./molecules/Popover/Popover.snippets";
import { alertDialogPlaygroundSnippet } from "./organisms/AlertDialog/AlertDialog.snippets";
import { dataTablePlaygroundSnippet } from "./organisms/DataTable/DataTable.snippets";
import { dialogPlaygroundSnippet } from "./organisms/Dialog/Dialog.snippets";
import { drawerPlaygroundSnippet } from "./organisms/Drawer/Drawer.snippets";
import { navbarPlaygroundSnippet } from "./organisms/Navbar/Navbar.snippets";
import { sidebarPlaygroundSnippet } from "./organisms/Sidebar/Sidebar.snippets";
import { commandPalettePlaygroundSnippet } from "./organisms/CommandPalette/CommandPalette.snippets";
import { imageViewerPlaygroundSnippet } from "./organisms/ImageViewer/ImageViewer.snippets";
import { contextMenuPlaygroundSnippet } from "./organisms/ContextMenu/ContextMenu.snippets";
import { fileUploadPlaygroundSnippet } from "./organisms/FileUpload/FileUpload.snippets";
import { formPlaygroundSnippet } from "./organisms/Form/Form.snippets";
import { toastPlaygroundSnippet } from "./organisms/Toast/Toast.snippets";
import { radioGroupPlaygroundSnippet } from "./molecules/RadioGroup/RadioGroup.snippets";
import { rangeSliderPlaygroundSnippet } from "./molecules/RangeSlider/RangeSlider.snippets";
import { scrollAreaPlaygroundSnippet } from "./molecules/ScrollArea/ScrollArea.snippets";
import { searchInputPlaygroundSnippet } from "./molecules/SearchInput/SearchInput.snippets";
import { selectPlaygroundSnippet } from "./molecules/Select/Select.snippets";
import { sliderPlaygroundSnippet } from "./molecules/Slider/Slider.snippets";
import { statPlaygroundSnippet } from "./molecules/Stat/Stat.snippets";
import { tablePlaygroundSnippet } from "./molecules/Table/Table.snippets";
import { tabsPlaygroundSnippet } from "./molecules/Tabs/Tabs.snippets";
import { toggleGroupPlaygroundSnippet } from "./molecules/ToggleGroup/ToggleGroup.snippets";

// Guards the code shown under "Show code" on Docs pages
// (`07-storybook-and-documentation-standards.md` §4.2). A story's own source is
// the story object plus demo-only helpers, which nobody can paste anywhere, so a
// component's stories point `parameters.docs.source.code` at hand-written
// snippets in a `*.snippets.ts` file next to them. Every such file is picked up
// here automatically: a snippet must be valid TSX, use only components the
// package really exports (and only sub-parts that really exist), and carry no
// demo scaffolding or internal references. Prop names and values aren't checked
// here — the snippets are typechecked against the real components when they're
// written or changed.

const banned: Array<[RegExp, string]> = [
  [/\bDemo\w*/, "a demo-only helper component"],
  [/\bWideTable\b/, "a demo-only helper component"],
  [/\bnoControls\b|\bargTypes\b|\brender:/, "story-object scaffolding"],
  [/\bgridStyle\b|\bdemoContainerStyle\b|\ballTones\b|\ballVariants\b|\ballSizes\b|\bwideRows\b/, "a stories-file constant"],
  // A loop over a stories-file constant (`allTones.map(…)`) is caught by the constants
  // above; a `.map(` over the reader's own state is real usage and is allowed.
  // A story cancelling its own link's navigation (`onClick={(event) => event.preventDefault()}`) is demo wiring;
  // `event.preventDefault()` inside a real handler (handing a link to a router) is genuine usage.
  [/onClick=\{\(event\) => event\.preventDefault\(\)\}|data-testid|onActivate/, "test or demo wiring"],
  [/guidelines\/|\.md\b|\bADR-\d/, "a reference to an internal document"],
];

function problemsIn(code: string): string[] {
  const problems: string[] = [];
  if (!code.trim()) return ["is empty"];

  for (const [pattern, what] of banned) {
    const match = code.match(pattern);
    if (match) problems.push(`contains ${what} ("${match[0]}")`);
  }

  // A snippet is one or more JSX elements (and comments), so wrap it in a
  // fragment to parse it as an expression.
  const wrapped = `const snippet = (<>\n${code}\n</>);`;
  const transpiled = ts.transpileModule(wrapped, {
    fileName: "snippet.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  for (const diagnostic of transpiled.diagnostics ?? []) {
    problems.push(`is not valid TSX: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
  }

  // The components package, plus the icons package — a snippet's comment says where an
  // icon comes from (`{/* HeartIcon comes from @dbm-system/icons */}`).
  const exported = { ...icons, ...library } as unknown as Record<string, Record<string, unknown> | undefined>;
  const source = ts.createSourceFile("snippet.tsx", wrapped, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const [root, ...path] = tag.split(".");
      // Lower-case tags are plain HTML elements; everything else must be real.
      if (root && /^[A-Z]/.test(root)) {
        let target: unknown = exported[root];
        if (target === undefined) problems.push(`uses <${tag}>, which the package doesn't export`);
        else {
          for (const member of path) {
            target = (target as Record<string, unknown> | undefined)?.[member];
            if (target === undefined) problems.push(`uses <${tag}>, which doesn't exist`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return problems;
}

// Vite replaces `import.meta.glob` at build time; this repo's tsconfig doesn't load
// Vite's own client types, so declare the one overload used here.
declare global {
  interface ImportMeta {
    glob<T = unknown>(pattern: string, options: { eager: true }): Record<string, T>;
  }
}

// Every `*.snippets.ts` file's exported records of named snippets.
const snippetModules = import.meta.glob<Record<string, unknown>>("./**/*.snippets.ts", { eager: true });

const namedSnippets: Array<[string, string]> = [];
for (const [file, module] of Object.entries(snippetModules)) {
  for (const [exportName, value] of Object.entries(module)) {
    if (typeof value !== "object" || value === null) continue;
    for (const [key, code] of Object.entries(value)) {
      if (typeof code === "string") namedSnippets.push([`${file} › ${exportName}.${key}`, code]);
    }
  }
}

describe("story snippets", () => {
  it("finds the snippet files", () => {
    expect(Object.keys(snippetModules).length).toBeGreaterThanOrEqual(64);
    expect(namedSnippets.length).toBeGreaterThan(280);
  });

  it.each(namedSnippets)("%s is a real, pasteable snippet", (_name, code) => {
    expect(problemsIn(code)).toEqual([]);
  });

  describe("the checker itself", () => {
    it("rejects a demo helper, a loop over a demo constant, and an internal reference", () => {
      expect(problemsIn("<DemoCard />").length).toBeGreaterThan(0);
      expect(problemsIn("{allTones.map((tone) => <Card key={tone}>x</Card>)}").length).toBeGreaterThan(0);
      expect(problemsIn("{/* see guidelines/04-component-inventory.md */}\n<Card>x</Card>").length).toBeGreaterThan(0);
    });

    it("rejects a story's own click-cancelling wiring but allows preventDefault in a real handler", () => {
      expect(problemsIn('<a href="#x" onClick={(event) => event.preventDefault()}>x</a>').length).toBeGreaterThan(0);
      expect(problemsIn('<Pagination pageCount={5} onValueChange={(page, event) => { event.preventDefault(); navigate(page); }} />')).toEqual([]);
    });

    it("rejects a component or sub-part that doesn't exist", () => {
      expect(problemsIn("<NotAComponent />")).toEqual(["uses <NotAComponent>, which the package doesn't export"]);
      expect(problemsIn("<Card><Card.Sidebar /></Card>")).toEqual(["uses <Card.Sidebar>, which doesn't exist"]);
    });

    it("rejects invalid TSX", () => {
      expect(problemsIn("<Card>").length).toBeGreaterThan(0);
    });

    it("allows a .map over the reader's own state", () => {
      expect(problemsIn("{filters.map((filter) => <Tag key={filter}>{filter}</Tag>)}")).toEqual([]);
    });

    it("accepts a comment followed by real markup", () => {
      expect(problemsIn('{/* a note */}\n<Card variant="elevated"><Card.Body>x</Card.Body></Card>')).toEqual([]);
    });
  });
});

describe("Playground snippets, built from the live controls", () => {
  const cardArgs = [
    {},
    { variant: "elevated", tone: "success", size: "lg", divided: true },
    { media: true, orientation: "horizontal", mediaPosition: "end" },
    { media: true, mediaPosition: "start" },
    { interactive: true, disabled: true, media: true, variant: "filled" },
    { disabled: true }, // `disabled` means nothing without `interactive`, so it isn't written
  ] as const;

  it.each(cardArgs)("Card %j is a real snippet", (args) => {
    expect(problemsIn(cardPlaygroundSnippet(args))).toEqual([]);
  });

  it("Card writes only what differs from the defaults", () => {
    expect(cardPlaygroundSnippet({ variant: "outlined", tone: "neutral", size: "md", orientation: "vertical" })).toMatch(
      /^<Card>\n/,
    );
    expect(cardPlaygroundSnippet({ variant: "elevated", divided: true })).toMatch(/^<Card variant="elevated" divided>\n/);
    expect(cardPlaygroundSnippet({ disabled: true })).toMatch(/^<Card>\n/);
  });

  it("Card shows an interactive card as the link it has to be", () => {
    const snippet = cardPlaygroundSnippet({ interactive: true, media: true });
    expect(snippet).toMatch(/^<Card asChild interactive>\n {2}<a href=/);
    expect(snippet).toContain("<Card.Media>");
  });

  it("Card puts the media first, and only writes mediaPosition for `end`", () => {
    expect(cardPlaygroundSnippet({ media: true, mediaPosition: "start" })).not.toContain("mediaPosition");
    expect(cardPlaygroundSnippet({ media: true, mediaPosition: "end" })).toContain('mediaPosition="end"');
    expect(cardPlaygroundSnippet({ media: false })).not.toContain("Card.Media");
  });

  const paginationArgs = [
    {},
    { pageCount: 5, value: 3 },
    { pageCount: 200, value: 100, siblingCount: 2, boundaryCount: 0, showFirstLast: true },
    { size: "xl", compact: "always", align: "end", disabled: true },
    { variant: "outlined", showJump: true, announce: false, compact: "container" },
    { rounded: true, showJump: true },
    { showLabel: true, showFirstLast: true, size: "sm" },
  ] as const;

  it.each(paginationArgs)("Pagination %j is a real snippet", (args) => {
    expect(problemsIn(paginationPlaygroundSnippet(args))).toEqual([]);
  });

  it("Pagination writes the controlled page, and only what differs from the defaults", () => {
    expect(paginationPlaygroundSnippet({ pageCount: 20, value: 5 })).toBe(
      "{/* const [page, setPage] = useState(5); */}\n<Pagination pageCount={20} value={page} onValueChange={setPage} />",
    );
    const snippet = paginationPlaygroundSnippet({ siblingCount: 1, boundaryCount: 1, size: "md", compact: "auto", align: "center", showFirstLast: false, disabled: false });
    expect(snippet).not.toMatch(/siblingCount|boundaryCount|size=|compact=|align=|showFirstLast|disabled/);
    expect(paginationPlaygroundSnippet({ siblingCount: 0, boundaryCount: 0 })).toContain("siblingCount={0} boundaryCount={0}");
  });

  it("Pagination writes variant, showJump, and announce only when they differ from the defaults", () => {
    const snippet = paginationPlaygroundSnippet({ variant: "ghost", showJump: false, announce: true });
    expect(snippet).not.toMatch(/variant|showJump|announce/);
    expect(paginationPlaygroundSnippet({ variant: "filled" })).toContain('variant="filled"');
    expect(paginationPlaygroundSnippet({ showJump: true })).toContain(" showJump");
    expect(paginationPlaygroundSnippet({ announce: false })).toContain("announce={false}");
    expect(paginationPlaygroundSnippet({ compact: "container" })).toContain('compact="container"');
    expect(paginationPlaygroundSnippet({ rounded: true })).toContain(" rounded");
    expect(paginationPlaygroundSnippet({ rounded: false })).not.toContain("rounded");
    expect(paginationPlaygroundSnippet({ showLabel: true })).toContain(" showLabel");
    expect(paginationPlaygroundSnippet({ showLabel: false })).not.toContain("showLabel");
  });

  const emptyStateArgs = [
    {},
    { variant: "dashed", tone: "danger", size: "lg", align: "start" },
    { variant: "filled", actions: false },
    { size: "xs", tone: "success", actions: true },
    { announce: true, variant: "dashed" },
    { stackOnMobile: true },
  ] as const;

  it.each(emptyStateArgs)("EmptyState %j is a real snippet", (args) => {
    expect(problemsIn(emptyStatePlaygroundSnippet(args))).toEqual([]);
  });

  it("EmptyState writes only what differs from the defaults", () => {
    expect(emptyStatePlaygroundSnippet({ variant: "ghost", tone: "neutral", size: "md", align: "center" })).toMatch(
      /\n<EmptyState>\n/,
    );
    expect(emptyStatePlaygroundSnippet({ variant: "dashed", align: "start" })).toContain(
      '<EmptyState variant="dashed" align="start">',
    );
  });

  it("EmptyState writes announce only when it is on", () => {
    expect(emptyStatePlaygroundSnippet({ announce: true })).toContain("<EmptyState announce>");
    expect(emptyStatePlaygroundSnippet({ announce: false })).not.toContain("announce");
    expect(emptyStatePlaygroundSnippet({ variant: "dashed", announce: true })).toContain(
      '<EmptyState variant="dashed" announce>',
    );
  });

  it("EmptyState writes stackOnMobile on the actions row, and only with the actions shown", () => {
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true })).toContain("<EmptyState.Actions stackOnMobile>");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: false })).toContain("<EmptyState.Actions>");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true, actions: false })).not.toContain("stackOnMobile");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true })).not.toMatch(/<EmptyState[^.]*stackOnMobile/);
  });

  it("EmptyState leaves out the actions row when the demo-actions control is off", () => {
    expect(emptyStatePlaygroundSnippet({ actions: false })).not.toContain("EmptyState.Actions");
    expect(emptyStatePlaygroundSnippet({ actions: true })).toContain("EmptyState.Actions");
    expect(emptyStatePlaygroundSnippet({})).toContain("EmptyState.Actions");
  });

  const tableArgs = [
    {},
    { variant: "ghost", tone: "brand", size: "sm", striped: true, hoverable: true },
    { stickyHeader: true, maxHeight: "12rem" },
    { stickyFirstColumn: true, stickyLastColumn: true },
  ] as const;

  it.each(tableArgs)("Table %j is a real snippet", (args) => {
    expect(problemsIn(tablePlaygroundSnippet(args))).toEqual([]);
  });

  it("Table writes only what differs from the defaults", () => {
    expect(tablePlaygroundSnippet({ variant: "bordered", tone: "neutral", size: "md", maxHeight: "" })).toMatch(
      /^<Table aria-label="Recent invoices">\n/,
    );
    expect(tablePlaygroundSnippet({ striped: true, maxHeight: "16rem" })).toMatch(
      /^<Table striped maxHeight="16rem" aria-label="Recent invoices">\n/,
    );
  });
});

describe("Playground snippet for DataTable", () => {
  const dataTableArgs = [
    {},
    { variant: "ghost", tone: "brand", size: "sm", striped: true, hoverable: false },
    { stickyHeader: true, maxHeight: "16rem", selectionMode: "multiple" },
    { sortMode: "manual", loading: true, "aria-label": 'Team "A" & B' },
  ] as const;

  it.each(dataTableArgs)("DataTable %j is a real snippet", (args) => {
    expect(problemsIn(dataTablePlaygroundSnippet(args))).toEqual([]);
  });

  it("DataTable writes only what differs from the defaults", () => {
    expect(dataTablePlaygroundSnippet({ variant: "bordered", tone: "brand", size: "md", selectionMode: "none" })).not.toMatch(
      /variant=|tone=|size=|selectionMode=/,
    );
    expect(dataTablePlaygroundSnippet({ tone: "neutral" })).toContain('tone="neutral"');
    expect(dataTablePlaygroundSnippet({ selectionMode: "single", striped: true })).toMatch(/\n {2}striped\n {2}selectionMode="single"\n/);
  });
});

describe("Playground snippets for Accordion, Popover, Grid and List", () => {
  const accordionArgs = [
    {},
    { type: "single", collapsible: false, defaultValue: "returns", variant: "ghost", size: "lg" },
    { type: "multiple", defaultValue: "shipping", disabled: true, orientation: "horizontal", headingLevel: 4 },
    { type: "multiple", defaultValue: "" },
  ] as const;

  it.each(accordionArgs)("Accordion %j is a real snippet", (args) => {
    expect(problemsIn(accordionPlaygroundSnippet(args))).toEqual([]);
  });

  it("Accordion writes only what differs from the defaults", () => {
    expect(
      accordionPlaygroundSnippet({ type: "single", variant: "bordered", size: "md", collapsible: true, headingLevel: 3 }),
    ).toMatch(/^<Accordion>\n/);
    expect(accordionPlaygroundSnippet({ type: "single", defaultValue: "shipping", size: "sm" })).toMatch(
      /^<Accordion defaultValue="shipping" size="sm">\n/,
    );
    // Under `type="multiple"` the single control value becomes a one-element array.
    expect(accordionPlaygroundSnippet({ type: "multiple", defaultValue: "shipping" })).toMatch(
      /^<Accordion type="multiple" defaultValue=\{\["shipping"\]\}>\n/,
    );
  });

  const popoverArgs = [
    {},
    { defaultOpen: true, modal: true, side: "top", align: "start", sideOffset: 12, alignOffset: 4 },
    { avoidCollisions: false, collisionPadding: 16, hideWhenDetached: true, hideArrow: true, showCloseButton: true },
  ] as const;

  it.each(popoverArgs)("Popover %j is a real snippet", (args) => {
    expect(problemsIn(popoverPlaygroundSnippet(args))).toEqual([]);
  });

  it("Popover writes only what differs from the defaults", () => {
    const plain = popoverPlaygroundSnippet({ side: "bottom", align: "center", sideOffset: 8, alignOffset: 0, avoidCollisions: true, collisionPadding: 8 });
    expect(plain).toMatch(/^<Popover>\n/);
    expect(plain).toContain('<Popover.Content aria-label="Example popover">');
    expect(popoverPlaygroundSnippet({ hideArrow: true })).toContain('<Popover.Content hideArrow aria-label="Example popover">');
    expect(popoverPlaygroundSnippet({ modal: true, defaultOpen: true })).toMatch(/^<Popover defaultOpen modal>\n/);
  });

  const gridArgs = [
    {},
    { columns: 3, gap: 4, autoFlow: "row", autoRows: "", justifyItems: "start", alignItems: "center", alignContent: "start" },
    { columns: 12, minChildWidth: "8rem", autoRows: "5rem", autoColumns: "1fr", justifyContent: "between", autoFlow: "row dense" },
  ] as const;

  it.each(gridArgs)("Grid %j is a real snippet", (args) => {
    expect(problemsIn(gridPlaygroundSnippet(args))).toEqual([]);
  });

  it("Grid writes only what differs from the defaults, and always the 6rem row height the Playground shows", () => {
    expect(gridPlaygroundSnippet({ columns: 12, gap: 0, autoFlow: "row" })).toMatch(/^<Grid autoRows="6rem">\n/);
    expect(gridPlaygroundSnippet({ columns: 3, gap: 4 })).toMatch(/^<Grid columns=\{3\} gap=\{4\} autoRows="6rem">\n/);
  });

  const listArgs = [
    {},
    { as: "ol", marker: "decimal", spacing: 2, start: "" },
    { as: "ol", start: "5", reversed: true, type: "A", spacing: 6 },
    { as: "ul", marker: "none" },
    // `start`, `reversed`, and `type` only mean something on an <ol>.
    { as: "ul", marker: "disc", start: "5", reversed: true, type: "A" },
  ] as const;

  it.each(listArgs)("List %j is a real snippet", (args) => {
    expect(problemsIn(listPlaygroundSnippet(args))).toEqual([]);
  });

  it("List writes only what differs from the defaults, and the ol-only props only on an ol", () => {
    expect(listPlaygroundSnippet({ as: "ul", marker: "disc", spacing: 2 })).toMatch(/^<List>\n/);
    expect(listPlaygroundSnippet({ as: "ol", marker: "decimal" })).toMatch(/^<List as="ol">\n/);
    expect(listPlaygroundSnippet({ as: "ol", start: "5", reversed: true, type: "A" })).toMatch(
      /^<List as="ol" start=\{5\} reversed type="A">\n/,
    );
    expect(listPlaygroundSnippet({ as: "ul", start: "5", reversed: true, type: "A" })).toMatch(/^<List>\n/);
  });
});

describe("Playground snippets for the eight input molecules", () => {
  it.each([
    {},
    { "aria-label": "Interests", defaultValue: ["sports", "music"], size: "lg", orientation: "horizontal", hasError: true, disabled: true, name: "interests" },
    { defaultValue: [] },
  ])("CheckboxGroup %j is a real snippet", (args) => {
    expect(problemsIn(checkboxGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("CheckboxGroup writes only what differs, and always an accessible name", () => {
    expect(checkboxGroupPlaygroundSnippet({ size: "md", orientation: "vertical", defaultValue: [], name: "" })).toMatch(
      /^<CheckboxGroup aria-label="Interests">\n/,
    );
    expect(checkboxGroupPlaygroundSnippet({ defaultValue: ["sports"], orientation: "horizontal" })).toMatch(
      /^<CheckboxGroup aria-label="Interests" defaultValue=\{\["sports"\]\} orientation="horizontal">\n/,
    );
  });

  it.each([
    {},
    { defaultValue: "email", size: "sm", orientation: "horizontal", loop: false, dir: "rtl", hasError: true, required: true, disabled: true, name: "contact" },
    { loop: true, dir: "ltr" },
  ])("RadioGroup %j is a real snippet", (args) => {
    expect(problemsIn(radioGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("RadioGroup writes only what differs (loop defaults to true, dir to ltr)", () => {
    expect(radioGroupPlaygroundSnippet({ loop: true, dir: "ltr", orientation: "vertical", size: "md" })).toMatch(
      /^<RadioGroup aria-label="Contact method">\n/,
    );
    expect(radioGroupPlaygroundSnippet({ loop: false, dir: "rtl" })).toMatch(
      /^<RadioGroup aria-label="Contact method" loop=\{false\} dir="rtl">\n/,
    );
  });

  it.each([
    {},
    { label: "Full name", helperText: "As on your ID", error: "Required", required: true, disabled: true, size: "lg" },
    { helperText: 'Say "hello"' },
  ])("FormField %j is a real snippet, and always has a control in it", (args) => {
    const snippet = formFieldPlaygroundSnippet(args as never);
    expect(problemsIn(snippet)).toEqual([]);
    expect(snippet).toContain("<Input {...fieldProps}");
  });

  it.each([
    {},
    { "aria-label": "Guests", size: "xs", defaultValue: 5, min: 0, max: 10, step: 0.5, placeholder: "0", hasError: true, required: true, readOnly: true, disabled: true, name: "guests" },
    { min: undefined, max: undefined, defaultValue: 5 },
  ])("NumberInput %j is a real snippet", (args) => {
    expect(problemsIn(numberInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("NumberInput writes only what differs, including no bounds at all", () => {
    expect(numberInputPlaygroundSnippet({ size: "md", step: 1, "aria-label": "" })).toBe('<NumberInput aria-label="Quantity" />');
    expect(numberInputPlaygroundSnippet({ min: undefined, max: undefined, defaultValue: 5 })).toBe(
      '<NumberInput aria-label="Quantity" defaultValue={5} />',
    );
  });

  it.each([
    {},
    { "aria-label": "Password", size: "lg", placeholder: "Enter it", defaultValue: "hunter2", maxLength: 200, showCount: true, hasError: true, required: true, readOnly: true, disabled: true, name: "pw" },
  ])("PasswordInput %j is a real snippet", (args) => {
    expect(problemsIn(passwordInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("PasswordInput writes only what differs", () => {
    expect(passwordInputPlaygroundSnippet({ size: "md", defaultValue: "", hasError: false })).toBe('<PasswordInput aria-label="Password" />');
    expect(passwordInputPlaygroundSnippet({ hasError: true, defaultValue: "wrong" })).toBe(
      '<PasswordInput aria-label="Password" defaultValue="wrong" hasError />',
    );
  });

  it.each([
    {},
    { size: "sm", placeholder: "Search…", defaultValue: "cats", debounceMs: 0, maxLength: 200, isLoading: true, hasError: true, required: true, readOnly: true, disabled: true, name: "q" },
    { suffix: {} },
  ])("SearchInput %j is a real snippet", (args) => {
    expect(problemsIn(searchInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("SearchInput writes only what differs (debounceMs defaults to 300; 0 turns it off)", () => {
    expect(searchInputPlaygroundSnippet({ debounceMs: 300 })).toBe('<SearchInput aria-label="Search" />');
    expect(searchInputPlaygroundSnippet({ debounceMs: 0 })).toBe('<SearchInput aria-label="Search" debounceMs={0} />');
    expect(searchInputPlaygroundSnippet({ suffix: {} })).toContain("suffix={<Kbd");
  });

  it.each([
    {},
    { "aria-label": "Country", placeholder: "Choose", defaultValue: "primary", size: "xl", side: "top", align: "end", defaultOpen: true, dir: "rtl", hasError: true, required: true, disabled: true, name: "c", form: "f", autoComplete: "country" },
    { side: "bottom", align: "start", dir: "ltr" },
  ])("Select %j is a real snippet, with real options", (args) => {
    const snippet = selectPlaygroundSnippet(args as never);
    expect(problemsIn(snippet)).toEqual([]);
    expect(snippet).toContain("<Select.Option");
  });

  it("Select writes only what differs (side defaults to bottom, align to start)", () => {
    expect(selectPlaygroundSnippet({ side: "bottom", align: "start", size: "md" })).toMatch(/^<Select aria-label="Variant">\n/);
    expect(selectPlaygroundSnippet({ side: "right", align: "start" })).toMatch(/^<Select aria-label="Variant" side="right">\n/);
  });

  it.each([
    {},
    { size: "xs", defaultValue: 20, min: -10, max: 10, step: 5, orientation: "horizontal", inverted: true, showValue: true, showValueTooltip: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25, hasError: true, disabled: true, name: "v", "aria-valuetext": "Loud" },
    { orientation: "vertical", showMinMaxLabels: true },
  ])("Slider %j is a real snippet", (args) => {
    expect(problemsIn(sliderPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Slider writes only what differs, and tickInterval only when ticks are on and it differs from step", () => {
    expect(sliderPlaygroundSnippet({ size: "md", min: 0, max: 100, step: 1, "aria-label": "" })).toBe('<Slider aria-label="Volume" />');
    expect(sliderPlaygroundSnippet({ showTicks: true, tickInterval: 10 })).toBe(
      '<Slider aria-label="Volume" showTicks tickInterval={10} />',
    );
    expect(sliderPlaygroundSnippet({ showTicks: true, tickInterval: 1, step: 1 })).toBe('<Slider aria-label="Volume" showTicks />');
    expect(sliderPlaygroundSnippet({ showTicks: false, tickInterval: 10 })).toBe('<Slider aria-label="Volume" />');
  });

  it("Slider puts a vertical slider in a container with a height", () => {
    const snippet = sliderPlaygroundSnippet({ orientation: "vertical" });
    expect(snippet).toContain('orientation="vertical"');
    expect(snippet).toContain('<div style={{ height: "12rem" }}>');
  });
});

describe("RangeSlider's Playground snippet", () => {
  it.each([
    {},
    { lowerStart: 10, upperStart: 60, min: 0, max: 200, step: 5, minStepsBetweenThumbs: 2 },
    { size: "xl", hasError: true, disabled: true, name: "price", "aria-label": "Budget" },
    { showValue: true, showValueTooltip: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25, inverted: true },
    { orientation: "vertical", showMinMaxLabels: true },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(rangeSliderPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("writes only what differs, and defaultValue only when the start is not the whole track", () => {
    expect(rangeSliderPlaygroundSnippet({ size: "md", min: 0, max: 100, step: 1, lowerStart: 0, upperStart: 100, "aria-label": "" })).toBe(
      '<RangeSlider aria-label="Price" />',
    );
    expect(rangeSliderPlaygroundSnippet({ lowerStart: 20, upperStart: 80 })).toBe('<RangeSlider aria-label="Price" defaultValue={[20, 80]} />');
    // The whole track of a custom range is still the default.
    expect(rangeSliderPlaygroundSnippet({ min: 10, max: 50, lowerStart: 10, upperStart: 50 })).toBe(
      '<RangeSlider aria-label="Price" min={10} max={50} />',
    );
    expect(rangeSliderPlaygroundSnippet({ minStepsBetweenThumbs: 0 })).toBe('<RangeSlider aria-label="Price" />');
    expect(rangeSliderPlaygroundSnippet({ minStepsBetweenThumbs: 3 })).toBe('<RangeSlider aria-label="Price" minStepsBetweenThumbs={3} />');
  });

  it("writes tickInterval only when ticks are on and it differs from step", () => {
    expect(rangeSliderPlaygroundSnippet({ showTicks: true, tickInterval: 10 })).toBe('<RangeSlider aria-label="Price" showTicks tickInterval={10} />');
    expect(rangeSliderPlaygroundSnippet({ showTicks: true, tickInterval: 1, step: 1 })).toBe('<RangeSlider aria-label="Price" showTicks />');
    expect(rangeSliderPlaygroundSnippet({ showTicks: false, tickInterval: 10 })).toBe('<RangeSlider aria-label="Price" />');
  });

  it("puts a vertical slider in a container with a height", () => {
    const snippet = rangeSliderPlaygroundSnippet({ orientation: "vertical" });
    expect(snippet).toContain('orientation="vertical"');
    expect(snippet).toContain('<div style={{ height: "12rem" }}>');
  });
});

describe("AvatarGroup's Playground snippet", () => {
  it.each([
    {},
    { size: "sm", shape: "square", colorful: true, max: 3, total: 24, stacked: false, overflowButton: true, count: 8, "aria-label": "Reviewers" },
    { size: "md", shape: "circle", colorful: false, stacked: true },
    { count: 1 },
    { count: 8, max: 0 },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(avatarGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("writes only what differs: size, shape, colorful and stacked stay out at their defaults", () => {
    expect(avatarGroupPlaygroundSnippet({ size: "md", shape: "circle", colorful: false, stacked: true, total: 0, overflowButton: false, count: 2 })).toBe(
      '<AvatarGroup aria-label="Project members">\n  <Avatar name="Jane Doe" />\n  <Avatar name="John Smith" />\n</AvatarGroup>',
    );
    expect(avatarGroupPlaygroundSnippet({ size: "lg", count: 1 })).toContain('size="lg"');
    expect(avatarGroupPlaygroundSnippet({ shape: "square", count: 1 })).toContain('shape="square"');
    expect(avatarGroupPlaygroundSnippet({ colorful: true, count: 1 })).toContain("colorful");
    expect(avatarGroupPlaygroundSnippet({ stacked: false, count: 1 })).toContain("stacked={false}");
    expect(avatarGroupPlaygroundSnippet({ overflowButton: true, count: 1 })).toContain("onOverflowClick");
  });

  it("writes max, including 0, and total only when it is above 0", () => {
    expect(avatarGroupPlaygroundSnippet({ max: 4, count: 1 })).toContain("max={4}");
    expect(avatarGroupPlaygroundSnippet({ max: 0, count: 1 })).toContain("max={0}");
    expect(avatarGroupPlaygroundSnippet({ total: 12, count: 1 })).toContain("total={12}");
    expect(avatarGroupPlaygroundSnippet({ total: 0, count: 1 })).not.toContain("total");
  });

  it("ignores a size that is not a real value", () => {
    expect(avatarGroupPlaygroundSnippet({ size: "huge", count: 1 })).not.toContain("size");
  });

  it("keeps the number of avatars between one and eight", () => {
    expect(avatarGroupPlaygroundSnippet({ count: 0 }).match(/<Avatar /g)).toHaveLength(1);
    expect(avatarGroupPlaygroundSnippet({ count: 99 }).match(/<Avatar /g)).toHaveLength(8);
  });
});

describe("CodeBlock's Playground snippet", () => {
  it.each([
    {},
    { language: "tsx", title: "SaveButton.tsx", showLineNumbers: true, startLine: 42, highlight: "2, 4-6", wrap: true, maxHeight: "12rem", collapsible: true, collapsedLines: 6, copyable: false },
    { language: "bash", copiedDuration: 500 },
    { title: 'say "hi".ts' },
    { collapsible: true, collapsedLines: 10 },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(codeBlockPlaygroundSnippet(args))).toEqual([]);
  });

  it("writes only what differs from the defaults, and always the source", () => {
    expect(codeBlockPlaygroundSnippet({ language: "tsx", showLineNumbers: false, startLine: 1, wrap: false, collapsible: false, copyable: true, copiedDuration: 2000, highlight: "", title: "", maxHeight: "" })).toBe(
      "{/* source: the code to show, as a string */}\n<CodeBlock language=\"tsx\" code={source} />",
    );
    expect(codeBlockPlaygroundSnippet({})).toBe("{/* source: the code to show, as a string */}\n<CodeBlock code={source} />");
  });

  it("writes stripPrompt={false} only for shell code with a copy button", () => {
    expect(codeBlockPlaygroundSnippet({ language: "bash", stripPrompt: false })).toContain("stripPrompt={false}");
    expect(codeBlockPlaygroundSnippet({ language: "sh", stripPrompt: false })).toContain("stripPrompt={false}");
    expect(codeBlockPlaygroundSnippet({ language: "bash", stripPrompt: true })).not.toContain("stripPrompt");
    expect(codeBlockPlaygroundSnippet({ language: "ts", stripPrompt: false })).not.toContain("stripPrompt");
    expect(codeBlockPlaygroundSnippet({ language: "bash", stripPrompt: false, copyable: false })).not.toContain("stripPrompt");
    expect(problemsIn(codeBlockPlaygroundSnippet({ language: "bash", stripPrompt: false }))).toEqual([]);
  });

  it("writes startLine only with line numbers, collapsedLines only when collapsible, and copiedDuration only with a copy button", () => {
    expect(codeBlockPlaygroundSnippet({ startLine: 5 })).not.toContain("startLine");
    expect(codeBlockPlaygroundSnippet({ showLineNumbers: true, startLine: 5 })).toContain("startLine={5}");
    expect(codeBlockPlaygroundSnippet({ collapsedLines: 4 })).not.toContain("collapsedLines");
    expect(codeBlockPlaygroundSnippet({ collapsible: true, collapsedLines: 4 })).toContain("collapsedLines={4}");
    expect(codeBlockPlaygroundSnippet({ copyable: false, copiedDuration: 500 })).not.toContain("copiedDuration");
    expect(codeBlockPlaygroundSnippet({ copiedDuration: 500 })).toContain("copiedDuration={500}");
    expect(codeBlockPlaygroundSnippet({ copyable: false })).toContain("copyable={false}");
  });

  it("says how to turn on a language that ships outside the core, whatever name it is given by", () => {
    const names: Array<[string, string]> = [
      ["python", "pythonLanguage"], ["py", "pythonLanguage"], ["yml", "yamlLanguage"], ["postgres", "sqlLanguage"],
      ["md", "markdownLanguage"], ["golang", "goLanguage"], ["rs", "rustLanguage"], ["java", "javaLanguage"], [" Python ", "pythonLanguage"],
    ];
    for (const [language, exportName] of names) {
      const snippet = codeBlockPlaygroundSnippet({ language });
      expect(snippet).toContain(`registerCodeLanguage(${exportName})`);
      expect(problemsIn(snippet)).toEqual([]);
    }
    // A built-in language, an unknown one and a name that is a property of every object need nothing.
    for (const language of ["tsx", "bash", "cobol", "constructor", "__proto__", "", undefined]) {
      expect(codeBlockPlaygroundSnippet({ language })).not.toContain("registerCodeLanguage");
    }
  });

  it("explains every placeholder it passes as code, in a comment, in every CodeBlock snippet", () => {
    // `code={source}` stands for the reader's own string; a snippet has to say so, or it isn't pasteable.
    const explained = (snippet: string, name: string) => new RegExp(`\\{/\\*[^]*?\\b${name}:[^]*?\\*/\\}`).test(snippet);
    const snippets = [...Object.values(codeBlockSnippets), codeBlockPlaygroundSnippet({}), codeBlockPlaygroundSnippet({ language: "tsx", collapsible: true, highlight: "2" })];
    for (const snippet of snippets) {
      for (const [, name] of snippet.matchAll(/\bcode=\{([A-Za-z_]\w*)\}/g)) {
        expect(explained(snippet, name as string), `${name} is not explained in:\n${snippet}`).toBe(true);
      }
    }
    expect(explained("<CodeBlock code={source} />", "source")).toBe(false);
    expect(explained("{/* source: the code, as a string */}\n<CodeBlock code={source} />", "source")).toBe(true);
  });

  it("turns typed highlights into an array, ignoring what is not a line or a range", () => {
    expect(highlightLinesLiteral("2, 4-6, x, 9 - 10")).toBe('[2, "4-6", "9-10"]');
    expect(highlightLinesLiteral("nothing")).toBeUndefined();
    expect(highlightLinesLiteral("")).toBeUndefined();
    expect(highlightLinesFromText("2, 4-6")).toEqual([2, "4-6"]);
    expect(highlightLinesFromText(undefined)).toBeUndefined();
  });

  it("escapes a quote in the title and drops one from maxHeight", () => {
    expect(codeBlockPlaygroundSnippet({ title: 'a"b' })).toContain('title="a&quot;b"');
    expect(codeBlockPlaygroundSnippet({ maxHeight: '10"rem' })).toContain('maxHeight="10rem"');
  });
});

describe("ButtonGroup's Playground snippet", () => {
  it.each([
    {},
    { variant: "secondary", size: "sm", rounded: true, disabled: true, attached: false, orientation: "vertical", fullWidth: true, count: 5, "aria-label": "View" },
    { variant: "primary", size: "md", rounded: false },
    { count: 1 },
    { count: 6 },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(buttonGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("writes only what differs: variant, size and rounded stay out at their defaults", () => {
    expect(
      buttonGroupPlaygroundSnippet({ variant: "primary", size: "md", rounded: false, attached: true, disabled: false, fullWidth: false, orientation: "horizontal", count: 2 }),
    ).toBe('<ButtonGroup aria-label="Clipboard">\n  <Button>Copy</Button>\n  <Button>Paste</Button>\n</ButtonGroup>');
    expect(buttonGroupPlaygroundSnippet({ variant: "ghost", size: "lg", count: 1 })).toContain('variant="ghost" size="lg"');
    expect(buttonGroupPlaygroundSnippet({ rounded: true, count: 1 })).toContain("rounded");
    expect(buttonGroupPlaygroundSnippet({ attached: false, count: 1 })).toContain("attached={false}");
    expect(buttonGroupPlaygroundSnippet({ orientation: "vertical", count: 1 })).toContain('orientation="vertical"');
  });

  it("ignores a variant or size that is not a real value", () => {
    expect(buttonGroupPlaygroundSnippet({ variant: "bogus", size: "huge", count: 1 })).not.toContain("variant");
    expect(buttonGroupPlaygroundSnippet({ variant: "bogus", size: "huge", count: 1 })).not.toContain("size");
  });

  it("keeps the number of buttons between one and six", () => {
    expect(buttonGroupPlaygroundSnippet({ count: 0 }).match(/<Button>/g)).toHaveLength(1);
    expect(buttonGroupPlaygroundSnippet({ count: 99 }).match(/<Button>/g)).toHaveLength(6);
  });
});

describe("ScrollArea's Playground snippet", () => {
  it.each([
    {},
    { variant: "ghost", size: "lg", scrollbars: "both", showTrack: true, tone: "brand", scrollbarVisibility: "always", scrollHideDelay: 300, overscrollBehavior: "contain", maxHeight: "10rem", dir: "rtl", "aria-label": "Recent activity" },
    { scrollbars: "horizontal", maxHeight: "8rem" },
    { size: "xs" },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(scrollAreaPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("writes only what differs: variant, size, scrollbars, scrollbarVisibility, scrollHideDelay and dir stay out at their defaults", () => {
    expect(
      scrollAreaPlaygroundSnippet({
        variant: "bordered",
        size: "md",
        scrollbars: "vertical",
        scrollbarVisibility: "hover",
        scrollHideDelay: 600,
        dir: "ltr",
      }),
    ).toBe("<ScrollArea>\n  <p>First item</p>\n  <p>Second item</p>\n  <p>Third item</p>\n</ScrollArea>");
    expect(scrollAreaPlaygroundSnippet({ variant: "ghost" })).toContain('variant="ghost"');
    expect(scrollAreaPlaygroundSnippet({ size: "lg" })).toContain('size="lg"');
    expect(scrollAreaPlaygroundSnippet({ scrollbars: "horizontal" })).toContain('scrollbars="horizontal"');
    expect(scrollAreaPlaygroundSnippet({ scrollbarVisibility: "always" })).toContain('scrollbarVisibility="always"');
    expect(scrollAreaPlaygroundSnippet({ scrollHideDelay: 200 })).toContain("scrollHideDelay={200}");
    expect(scrollAreaPlaygroundSnippet({ dir: "rtl" })).toContain('dir="rtl"');
  });

  it("always shows maxHeight once set, since it has no built-in default", () => {
    expect(scrollAreaPlaygroundSnippet({ maxHeight: "12rem" })).toContain('maxHeight: "12rem"');
    expect(scrollAreaPlaygroundSnippet({})).not.toContain("maxHeight");
  });

  it("switches the demo content for a non-vertical scrollbars value", () => {
    expect(scrollAreaPlaygroundSnippet({ scrollbars: "both" })).toContain("whiteSpace");
    expect(scrollAreaPlaygroundSnippet({ scrollbars: "horizontal" })).toContain("whiteSpace");
    expect(scrollAreaPlaygroundSnippet({ scrollbars: "vertical" })).not.toContain("whiteSpace");
  });

  it("writes showTrack and tone only when set to a non-default value", () => {
    expect(scrollAreaPlaygroundSnippet({ showTrack: true })).toContain("showTrack");
    expect(scrollAreaPlaygroundSnippet({ showTrack: false })).not.toContain("showTrack");
    expect(scrollAreaPlaygroundSnippet({ tone: "brand" })).toContain('tone="brand"');
    expect(scrollAreaPlaygroundSnippet({ tone: "neutral" })).not.toContain("tone");
  });

  it("writes overscrollBehavior only when set to 'contain'", () => {
    expect(scrollAreaPlaygroundSnippet({ overscrollBehavior: "contain" })).toContain('overscrollBehavior="contain"');
    expect(scrollAreaPlaygroundSnippet({ overscrollBehavior: "auto" })).not.toContain("overscrollBehavior");
  });
});

describe("ToggleGroup's Playground snippet", () => {
  it.each([
    {},
    { type: "multiple", variant: "solid", size: "sm", rounded: true, disabled: true, attached: false, orientation: "vertical", fullWidth: true, loop: false, dir: "rtl", count: 5, chosen: "day", "aria-label": "Range" },
    { type: "single", deselectable: true, chosen: "week" },
    { count: 1 },
    { count: 6 },
  ])("%j is a real snippet", (args) => {
    expect(problemsIn(toggleGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("writes only what differs from the defaults", () => {
    expect(
      toggleGroupPlaygroundSnippet({ type: "single", variant: "outlined", size: "md", rounded: false, attached: true, orientation: "horizontal", fullWidth: false, disabled: false, loop: true, dir: "ltr", deselectable: false, chosen: "none", count: 2 }),
    ).toBe('<ToggleGroup aria-label="View">\n  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>\n  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>\n</ToggleGroup>');
    expect(toggleGroupPlaygroundSnippet({ variant: "solid", size: "lg", count: 1 })).toContain('variant="solid" size="lg"');
    expect(toggleGroupPlaygroundSnippet({ rounded: true, count: 1 })).toContain("rounded");
    expect(toggleGroupPlaygroundSnippet({ attached: false, count: 1 })).toContain("attached={false}");
    expect(toggleGroupPlaygroundSnippet({ orientation: "vertical", count: 1 })).toContain('orientation="vertical"');
    expect(toggleGroupPlaygroundSnippet({ loop: false, count: 1 })).toContain("loop={false}");
    expect(toggleGroupPlaygroundSnippet({ dir: "rtl", count: 1 })).toContain('dir="rtl"');
  });

  it("writes the starting choice in the shape the type takes", () => {
    expect(toggleGroupPlaygroundSnippet({ chosen: "week" })).toContain('defaultValue="week"');
    expect(toggleGroupPlaygroundSnippet({ type: "multiple", chosen: "week" })).toContain('type="multiple" defaultValue={["week"]}');
    expect(toggleGroupPlaygroundSnippet({ chosen: "none" })).not.toContain("defaultValue");
    // An item the demo doesn't show can't be the starting choice.
    expect(toggleGroupPlaygroundSnippet({ chosen: "year", count: 2 })).not.toContain("defaultValue");
  });

  it("writes deselectable only for a single group", () => {
    expect(toggleGroupPlaygroundSnippet({ deselectable: true })).toContain("deselectable");
    expect(toggleGroupPlaygroundSnippet({ type: "multiple", deselectable: true })).not.toContain("deselectable");
  });

  it("ignores a variant or size that is not a real value, and keeps the item count between one and six", () => {
    expect(toggleGroupPlaygroundSnippet({ variant: "bogus", size: "huge", count: 1 })).not.toMatch(/variant|size/);
    expect(toggleGroupPlaygroundSnippet({ count: 0 }).match(/ToggleGroup\.Item value/g)).toHaveLength(1);
    expect(toggleGroupPlaygroundSnippet({ count: 99 }).match(/ToggleGroup\.Item value/g)).toHaveLength(6);
  });
});

describe("Playground snippets for the seven feedback and data-display atoms", () => {
  it.each([
    {},
    { alt: "Jane Doe", initials: "JD" },
    { as: "button", alt: "Jane Doe", initials: "JD", status: "online", disabled: true, shape: "square", size: "xl", colorful: true, name: "Jane Doe", src: "https://i.pravatar.cc/128?img=5", "aria-label": "Open profile" },
  ])("Avatar %j is a real snippet", (args) => {
    expect(problemsIn(avatarPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Avatar writes only what's set, and gives a button its handler", () => {
    expect(avatarPlaygroundSnippet({ as: "span", src: "", alt: "", initials: "", name: "", colorful: false, size: "md", shape: "circle" })).toBe("<Avatar />");
    expect(avatarPlaygroundSnippet({ alt: "Jane Doe", initials: "JD", size: "md" })).toBe('<Avatar alt="Jane Doe" initials="JD" />');
    expect(avatarPlaygroundSnippet({ as: "button", initials: "JD" })).toBe('<Avatar as="button" initials="JD" onClick={handleClick} />');
  });

  it.each([
    {},
    { children: "New", tone: "success", size: "lg", variant: "subtle", max: 9, hideZero: true, position: "bottom-left", overlap: "circular", "aria-label": "New items" },
    { children: 42, tone: "danger" },
    { dot: true, tone: "warning" },
  ])("Badge %j is a real snippet", (args) => {
    expect(problemsIn(badgePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Badge writes only what differs, numbers as expressions, and a dot with a name", () => {
    expect(badgePlaygroundSnippet({ children: "Badge", tone: "danger", size: "md", variant: "solid", max: 99 })).toBe("<Badge>Badge</Badge>");
    expect(badgePlaygroundSnippet({ children: 4 })).toBe("<Badge>{4}</Badge>");
    expect(badgePlaygroundSnippet({ dot: true, "aria-label": "Online", tone: "success" })).toBe('<Badge dot tone="success" aria-label="Online" />');
    expect(badgePlaygroundSnippet({ dot: true })).toContain("aria-label=");
  });

  it.each([
    {},
    { variant: "circular", width: 48, height: 48 },
    { variant: "rectangular", width: "16rem", height: "var(--dbm-space-32)", animation: "wave" },
    { variant: "text", width: "", height: "", animation: "pulse" },
  ])("Skeleton %j is a real snippet", (args) => {
    expect(problemsIn(skeletonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Skeleton writes numbers as expressions and strings as strings", () => {
    expect(skeletonPlaygroundSnippet({ variant: "text", width: "", height: "", animation: "pulse" })).toBe("<Skeleton />");
    expect(skeletonPlaygroundSnippet({ variant: "circular", width: 48, height: 48 })).toBe('<Skeleton variant="circular" width={48} height={48} />');
    expect(skeletonPlaygroundSnippet({ width: "12rem" })).toBe('<Skeleton width="12rem" />');
  });

  it.each([
    {},
    { children: "Design", tone: "info", variant: "outlined", size: "sm", removable: true, removeLabel: "Delete it", disabled: true, "aria-label": "Design tag" },
    { leadingIcon: undefined, trailingIcon: undefined, removable: true, removeLabel: "Remove Design" },
  ])("Tag %j is a real snippet", (args) => {
    expect(problemsIn(tagPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Tag writes only what differs, and gives a removable tag its onRemove", () => {
    expect(tagPlaygroundSnippet({ children: "Design", tone: "brand", variant: "subtle", size: "md", removable: false })).toBe("<Tag>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", tone: "neutral" })).toBe('<Tag tone="neutral">Design</Tag>');
    expect(tagPlaygroundSnippet({ children: "Design", tone: "highlight" })).toBe('<Tag tone="highlight">Design</Tag>');
    expect(tagPlaygroundSnippet({ children: "Design", removable: true, removeLabel: "Remove Design" })).toBe(
      "<Tag removable onRemove={handleRemove}>Design</Tag>",
    );
    expect(tagPlaygroundSnippet({ children: "Design", removable: true, removeLabel: "Delete" })).toContain('removeLabel="Delete"');
  });

  it("Tag turns the icon control's component back into its name, and ignores anything else", async () => {
    const { TagIcon, StarIcon } = await import("@dbm-system/icons");
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: TagIcon })).toBe("<Tag leadingIcon={TagIcon}>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", trailingIcon: StarIcon })).toBe("<Tag trailingIcon={StarIcon}>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "None" })).toBe("<Tag>Design</Tag>");
  });

  it.each([
    {},
    { value: 3, max: 5, size: "lg", tone: "success", label: "Uploading files", "aria-valuetext": "3 of 5 files uploaded", showValueLabel: true },
    { value: 40, indeterminate: true, label: "Loading" },
  ])("ProgressBar %j is a real snippet", (args) => {
    expect(problemsIn(progressBarPlaygroundSnippet(args as never))).toEqual([]);
  });

  it.each([
    {},
    { value: 3, max: 5, size: "lg", tone: "success", label: "Uploading files", "aria-valuetext": "3 of 5 files uploaded", showValueLabel: true },
    { value: 65, indeterminate: true, label: "Loading" },
  ])("ProgressCircle %j is a real snippet", (args) => {
    expect(problemsIn(progressCirclePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("ProgressBar and ProgressCircle write indeterminate by leaving value out, and always a label", () => {
    expect(progressBarPlaygroundSnippet({ value: 40, indeterminate: true, label: "Loading" })).toBe('<ProgressBar label="Loading" />');
    expect(progressBarPlaygroundSnippet({ value: undefined, label: "Loading" })).toBe('<ProgressBar label="Loading" />');
    expect(progressBarPlaygroundSnippet({ value: 40, max: 100, size: "md", tone: "brand", label: "Uploading" })).toBe(
      '<ProgressBar label="Uploading" value={40} />',
    );
    expect(progressCirclePlaygroundSnippet({ value: 65, indeterminate: true, label: "" })).toBe('<ProgressCircle label="Progress" />');
    expect(progressCirclePlaygroundSnippet({ value: 65, showValueLabel: true, label: "Uploading" })).toBe(
      '<ProgressCircle label="Uploading" value={65} showValueLabel />',
    );
  });

  it.each([{}, { size: "lg", tone: "brand", label: "Loading" }, { tone: "secondary" }])("Spinner %j is a real snippet", (args) => {
    expect(problemsIn(spinnerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Spinner writes only what's set — no default tone, so a tone is always written", () => {
    expect(spinnerPlaygroundSnippet({ size: "md", label: "" })).toBe("<Spinner />");
    expect(spinnerPlaygroundSnippet({ size: "md", tone: "brand", label: "" })).toBe('<Spinner tone="brand" />');
    expect(spinnerPlaygroundSnippet({ tone: "brand", label: "Loading" })).toBe('<Spinner tone="brand" label="Loading" />');
  });
});

describe("Playground snippets for the eleven input and field atoms", () => {
  it.each([
    {},
    { children: "Pay", variant: "destructive", size: "lg", type: "submit", "aria-label": "Pay now", isLoading: true, loadingText: "Paying…", fullWidth: true, disabled: true },
    { children: "Export", variant: "secondary" },
    { children: "Get started", rounded: true, size: "xl" },
  ])("Button %j is a real snippet", (args) => {
    expect(problemsIn(buttonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Button writes only what differs, and turns an icon component back into its name", async () => {
    const { WalletIcon, ArrowRightIcon } = await import("@dbm-system/icons");
    expect(buttonPlaygroundSnippet({ children: "Button", variant: "primary", size: "md", type: "button", leadingIcon: "None" })).toBe("<Button>Button</Button>");
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: WalletIcon, trailingIcon: ArrowRightIcon })).toBe(
      "<Button leadingIcon={WalletIcon} trailingIcon={ArrowRightIcon}>Pay</Button>",
    );
    expect(buttonPlaygroundSnippet({ children: "Saving", isLoading: true })).toBe("<Button isLoading>Saving</Button>");
    expect(buttonPlaygroundSnippet({ children: "Go", rounded: true })).toBe("<Button rounded>Go</Button>");
    expect(buttonPlaygroundSnippet({ children: "Go", rounded: false })).toBe("<Button>Go</Button>");
  });

  it.each([
    {},
    { variant: "ghost", size: "xs", rounded: true, type: "submit", isLoading: true, loadingLabel: "Saving…", disabled: true, "aria-label": "Like" },
    { interactionMode: "Toggle", defaultPressed: true, variant: "ghost" },
  ])("IconButton %j is a real snippet", (args) => {
    expect(problemsIn(iconButtonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("IconButton always writes its icon and name, and toggle as defaultPressed plus a handler", async () => {
    const { TrashIcon } = await import("@dbm-system/icons");
    expect(iconButtonPlaygroundSnippet({})).toBe('<IconButton icon={HeartIcon} aria-label="Favorite" />');
    expect(iconButtonPlaygroundSnippet({ icon: TrashIcon, "aria-label": "Delete" })).toBe('<IconButton icon={TrashIcon} aria-label="Delete" />');
    expect(iconButtonPlaygroundSnippet({ interactionMode: "Non-toggle", defaultPressed: true })).not.toContain("defaultPressed");
    expect(iconButtonPlaygroundSnippet({ interactionMode: "Toggle", defaultPressed: false })).toContain("defaultPressed={false} onPressedChange={handlePressedChange}");
  });

  it.each([
    {},
    { children: "Accept", size: "lg", defaultChecked: true, hasError: true, required: true, name: "terms", value: "yes", "aria-label": "Accept terms", disabled: true },
    { children: "", "aria-label": "Select row", defaultChecked: "indeterminate" },
  ])("Checkbox %j is a real snippet", (args) => {
    expect(problemsIn(checkboxPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Checkbox writes only what differs, and a label-less one as self-closing", async () => {
    const { StarIcon, XIcon } = await import("@dbm-system/icons");
    expect(checkboxPlaygroundSnippet({ children: "Accept", size: "md", defaultChecked: false })).toBe("<Checkbox>Accept</Checkbox>");
    expect(checkboxPlaygroundSnippet({ children: "", "aria-label": "Select row" })).toBe('<Checkbox aria-label="Select row" />');
    expect(checkboxPlaygroundSnippet({ children: "x", icon: StarIcon, indeterminateIcon: XIcon })).toBe(
      "<Checkbox icon={StarIcon} indeterminateIcon={XIcon}>x</Checkbox>",
    );
  });

  it.each([{}, { size: "xl", rounded: true, hasBackground: true, type: "reset", disabled: true, "aria-label": "Dismiss" }])(
    "CloseButton %j is a real snippet",
    (args) => {
      expect(problemsIn(closeButtonPlaygroundSnippet(args as never))).toEqual([]);
    },
  );

  it("CloseButton always writes a name, and only what differs", () => {
    expect(closeButtonPlaygroundSnippet({ size: "md", rounded: false, hasBackground: false, type: "button", "aria-label": "" })).toBe(
      '<CloseButton aria-label="Close" />',
    );
    expect(closeButtonPlaygroundSnippet({ rounded: true })).toBe('<CloseButton aria-label="Close" rounded />');
  });

  it("FieldError writes the icon as true (nothing), false, or a named component", async () => {
    const { StarIcon } = await import("@dbm-system/icons");
    for (const args of [{}, { icon: true }, { icon: false }, { icon: StarIcon }, { disabled: true }, { icon: "Default" }]) {
      expect(problemsIn(fieldErrorPlaygroundSnippet(args))).toEqual([]);
    }
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: true })).toBe("<FieldError>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: false })).toBe("<FieldError icon={false}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: StarIcon, disabled: true })).toBe(
      "<FieldError icon={StarIcon} disabled>Bad</FieldError>",
    );
  });

  it("FieldHelperText writes disabled only when set", () => {
    expect(problemsIn(fieldHelperTextPlaygroundSnippet({}))).toEqual([]);
    expect(fieldHelperTextPlaygroundSnippet({ children: "Help", disabled: false })).toBe("<FieldHelperText>Help</FieldHelperText>");
    expect(fieldHelperTextPlaygroundSnippet({ children: "Help", disabled: true })).toBe("<FieldHelperText disabled>Help</FieldHelperText>");
  });

  it.each([{}, { children: "Name", htmlFor: "name", size: "lg", required: true, disabled: true }])("FieldLabel %j is a real snippet", (args) => {
    expect(problemsIn(fieldLabelPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("FieldLabel always writes htmlFor, and only what differs", () => {
    expect(fieldLabelPlaygroundSnippet({ children: "Email address", htmlFor: "email", size: "md", required: false })).toBe(
      '<FieldLabel htmlFor="email">Email address</FieldLabel>',
    );
    expect(fieldLabelPlaygroundSnippet({ htmlFor: "", required: true })).toContain('htmlFor="email" required');
  });

  it.each([
    {},
    { placeholder: "Email", size: "sm", type: "email", defaultValue: "x@y.z", hasError: true, required: true, readOnly: true, disabled: true, maxLength: 20, showCount: true, name: "email", "aria-label": "Email", suffix: "@example.com" },
  ])("Input %j is a real snippet", (args) => {
    expect(problemsIn(inputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Input always writes a name, and only what differs", () => {
    expect(inputPlaygroundSnippet({ type: "text", size: "md", "aria-label": "" })).toBe('<Input aria-label="Text" />');
    expect(inputPlaygroundSnippet({ placeholder: "Email", hasError: true, defaultValue: "not-an-email" })).toBe(
      '<Input aria-label="Text" placeholder="Email" defaultValue="not-an-email" hasError />',
    );
  });

  it.each([
    {},
    { children: "Email", size: "lg", defaultChecked: true, hasError: true, required: true, name: "c", value: "sms", "aria-label": "SMS", disabled: true },
    { children: "", "aria-label": "Select row", value: "row" },
  ])("Radio %j is a real snippet", (args) => {
    expect(problemsIn(radioPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Radio always writes a value, and a label-less one as self-closing", () => {
    expect(radioPlaygroundSnippet({ children: "Email", value: "" })).toBe('<Radio value="email">Email</Radio>');
    expect(radioPlaygroundSnippet({ children: "", value: "row", "aria-label": "Select row" })).toBe('<Radio value="row" aria-label="Select row" />');
  });

  it.each([
    {},
    { children: "Notify", size: "xs", defaultChecked: true, loading: true, hasError: true, required: true, name: "n", value: "on", "aria-label": "Notify", disabled: true },
    { children: "", "aria-label": "Airplane mode" },
  ])("Switch %j is a real snippet", (args) => {
    expect(problemsIn(switchPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Switch writes only what differs, and thumb icons by name", async () => {
    const { MoonIcon, SunIcon } = await import("@dbm-system/icons");
    expect(switchPlaygroundSnippet({ children: "Email", size: "md", defaultChecked: false, loading: false })).toBe("<Switch>Email</Switch>");
    expect(switchPlaygroundSnippet({ children: "Dark mode", checkedIcon: MoonIcon, uncheckedIcon: SunIcon })).toBe(
      "<Switch checkedIcon={MoonIcon} uncheckedIcon={SunIcon}>Dark mode</Switch>",
    );
    expect(switchPlaygroundSnippet({ children: "", "aria-label": "Airplane mode" })).toBe('<Switch aria-label="Airplane mode" />');
  });

  it.each([
    {},
    { placeholder: "Add a comment…", hasError: true, size: "lg", autoResize: true, resize: "none", rows: 5, minRows: 3, maxRows: 6, defaultValue: "Hi", disabled: true, required: true, readOnly: true, maxLength: 140, showCount: true, name: "c", "aria-label": "Bio" },
  ])("Textarea %j is a real snippet", (args) => {
    expect(problemsIn(textareaPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Textarea writes only what differs (rows defaults to 3, resize to vertical)", () => {
    expect(textareaPlaygroundSnippet({ size: "md", rows: 3, resize: "vertical", autoResize: false, "aria-label": "" })).toBe('<Textarea aria-label="Comment" />');
    expect(textareaPlaygroundSnippet({ autoResize: true, rows: 5, resize: "none" })).toBe('<Textarea aria-label="Comment" autoResize rows={5} resize="none" />');
  });
});

describe("Playground snippets for the ten layout atoms", () => {
  it.each([{}, { ratio: 1 }, { ratio: 21 / 9 }, { ratio: 4 / 3 }, { ratio: 1.85, children: "Poster" }])("AspectRatio %j is a real snippet", (args) => {
    expect(problemsIn(aspectRatioPlaygroundSnippet(args))).toEqual([]);
  });

  it("AspectRatio writes the ratio as a fraction, and nothing at the default", () => {
    expect(aspectRatioPlaygroundSnippet({ ratio: 16 / 9, children: "x" })).toBe("<AspectRatio>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 1, children: "x" })).toBe("<AspectRatio ratio={1}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 21 / 9, children: "x" })).toBe("<AspectRatio ratio={21 / 9}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 4 / 3, children: "x" })).toBe("<AspectRatio ratio={4 / 3}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 1.85, children: "x" })).toBe("<AspectRatio ratio={1.85}>x</AspectRatio>");
  });

  it.each([{}, { inset: 4, side: "block" }, { inset: 8, side: "all", children: "Banner" }])("Bleed %j is a real snippet", (args) => {
    expect(problemsIn(bleedPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Bleed sits in a parent whose padding matches its inset on the side it bleeds", () => {
    expect(bleedPlaygroundSnippet({ inset: 6, side: "inline", children: "x" })).toBe(
      '<div style={{ paddingInline: "var(--dbm-space-6)" }}>\n  <Bleed inset={6}>x</Bleed>\n</div>',
    );
    expect(bleedPlaygroundSnippet({ inset: 4, side: "block", children: "x" })).toContain('paddingBlock: "var(--dbm-space-4)"');
    expect(bleedPlaygroundSnippet({ inset: 4, side: "block", children: "x" })).toContain('<Bleed inset={4} side="block">');
    expect(bleedPlaygroundSnippet({ inset: 2, side: "all", children: "x" })).toContain('padding: "var(--dbm-space-2)"');
  });

  it.each([{}, { as: "section" }, { as: "button", children: "Save" }])("Box %j is a real snippet", (args) => {
    expect(problemsIn(boxPlaygroundSnippet(args))).toEqual([]);
  });

  it("Box writes the element only when it isn't a div, and escapes text that JSX would read as markup", () => {
    expect(boxPlaygroundSnippet({ as: "div", children: "x" })).toBe("<Box>x</Box>");
    expect(boxPlaygroundSnippet({ as: "section", children: "x" })).toBe('<Box as="section">x</Box>');
    // The AsSection story's own children contain `<section>` and backticks.
    expect(problemsIn(boxPlaygroundSnippet({ as: "section", children: "Rendered as a <section> element via the `as` prop." }))).toEqual([]);
    expect(boxPlaygroundSnippet({ children: "a {b}" })).toBe("<Box>a &#123;b&#125;</Box>");
  });

  it.each([{}, { as: "span", inline: true }, { as: "section", inline: false, children: "Loading" }])("Center %j is a real snippet", (args) => {
    expect(problemsIn(centerPlaygroundSnippet(args))).toEqual([]);
  });

  it("Center gives a block-level one the height it needs, and an inline one none", () => {
    expect(centerPlaygroundSnippet({ as: "div", inline: false, children: "x" })).toBe('<Center style={{ height: "12rem" }}>x</Center>');
    expect(centerPlaygroundSnippet({ as: "span", inline: true, children: "x" })).toBe('<Center as="span" inline>x</Center>');
  });

  it.each([{}, { size: "sm", as: "main", paddingInline: 8 }, { size: "full" }])("Container %j is a real snippet", (args) => {
    expect(problemsIn(containerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Container writes only what differs (div, xl, a padding of 4)", () => {
    expect(containerPlaygroundSnippet({ as: "div", size: "xl", paddingInline: 4 })).toBe(
      "<Container>\n  <p>Page content, centered and constrained by size.</p>\n</Container>",
    );
    expect(containerPlaygroundSnippet({ as: "main", size: "md", paddingInline: 6 })).toContain('<Container as="main" size="md" paddingInline={6}>');
  });

  it.each([
    {},
    { orientation: "vertical", variant: "double", thickness: "thick", emphasis: "start", tone: "danger", label: "OR", align: "end", "aria-label": "Separator" },
    { label: "Section", align: "center" },
  ])("Divider %j is a real snippet", (args) => {
    expect(problemsIn(dividerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Divider writes only what differs, `align` only beside a label, and a vertical one inside the flex row it needs", () => {
    expect(dividerPlaygroundSnippet({ orientation: "horizontal", variant: "solid", thickness: "thin", emphasis: "none", tone: "default", align: "end" })).toBe("<Divider />");
    expect(dividerPlaygroundSnippet({ label: "OR", align: "end" })).toBe('<Divider label="OR" align="end" />');
    const vertical = dividerPlaygroundSnippet({ orientation: "vertical", label: "OR" });
    expect(vertical).toContain('<Divider orientation="vertical" label="OR" />');
    expect(vertical).toContain('display: "flex"');
    expect(vertical).toContain('height: "6rem"');
  });

  it.each([
    {},
    { children: "Wide", colSpan: 3, rowSpan: 2, colStart: 2, rowStart: 2, order: 4 },
    { colStart: "", rowStart: "" },
    { colStart: "3", as: "li" },
  ])("GridItem %j is a real snippet", (args) => {
    expect(problemsIn(gridItemPlaygroundSnippet(args))).toEqual([]);
  });

  it("GridItem writes only what differs, reads the control's blank as unset, and puts a list item inside a list", () => {
    expect(gridItemPlaygroundSnippet({ children: "Grid cell", colSpan: 1, rowSpan: 1, colStart: "", rowStart: "", order: 1 })).toBe(
      "<Grid columns={4} gap={4}>\n  <GridItem>Grid cell</GridItem>\n</Grid>",
    );
    expect(gridItemPlaygroundSnippet({ children: "x", colSpan: 2, colStart: "3" })).toContain("<GridItem colSpan={2} colStart={3}>x</GridItem>");
    expect(gridItemPlaygroundSnippet({ children: "x", as: "li" })).toContain('<Grid as="ul"');
    expect(gridItemPlaygroundSnippet({ children: "x", as: "li" })).toContain('<GridItem as="li">x</GridItem>');
  });

  it.each([
    {},
    { direction: "row", gap: 4, align: "center", justify: "between", wrap: true },
    { as: "ul", direction: "column-reverse", gap: 8, align: "baseline", justify: "evenly" },
  ])("Stack %j is a real snippet", (args) => {
    expect(problemsIn(stackPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Stack writes only what differs (div, column, a gap of 0, stretch, start, no wrap)", () => {
    expect(stackPlaygroundSnippet({ as: "div", direction: "column", gap: 0, align: "stretch", justify: "start", wrap: false })).toBe(
      "<Stack>\n  <div>One</div>\n  <div>Two</div>\n  <div>Three</div>\n</Stack>",
    );
    expect(stackPlaygroundSnippet({ direction: "row", gap: 4, wrap: true })).toContain('<Stack direction="row" gap={4} wrap>');
  });
});

describe("Playground snippets for the eleven media, overlay and utility atoms", () => {
  it.each([
    {},
    { icon: "Heart", size: "3xl", weight: "duotone", tone: "danger", label: "Favorite", mirrored: true },
    { icon: "Nonsense", tone: "on-brand" },
  ])("Icon %j is a real snippet", (args) => {
    expect(problemsIn(iconPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Icon always writes its icon, and only what differs (md, bold, no tone, no label, not mirrored)", async () => {
    const { StarIcon } = await import("@dbm-system/icons");
    expect(iconPlaygroundSnippet({ icon: "Wallet", size: "md", weight: "bold", label: "", mirrored: false })).toBe("<Icon icon={WalletIcon} />");
    expect(iconPlaygroundSnippet({ icon: StarIcon, size: "lg", tone: "brand" })).toBe('<Icon icon={StarIcon} size="lg" tone="brand" />');
    expect(iconPlaygroundSnippet({ icon: "Nonsense" })).toBe("<Icon icon={WalletIcon} />");
    expect(iconPlaygroundSnippet({ icon: "ArrowRight", mirrored: true })).toBe("<Icon icon={ArrowRightIcon} mirrored />");
  });

  it("text with a quote or an ampersand becomes a `{…}` expression, so the snippet stays valid", () => {
    const tricky = iconPlaygroundSnippet({ label: 'The "best" & brightest' });
    expect(tricky).toBe('<Icon icon={WalletIcon} label={"The \\"best\\" & brightest"} />');
    expect(problemsIn(tricky)).toEqual([]);
    expect(problemsIn(imagePlaygroundSnippet({ alt: 'A "quoted" alt & more' }))).toEqual([]);
    expect(problemsIn(tooltipPlaygroundSnippet({ content: 'Say "hi" & bye' }))).toEqual([]);
  });

  it.each([
    {},
    { src: "/photo.jpg", alt: "Photo", aspectRatio: 4 / 3, width: 200, height: 150, objectFit: "contain", position: "top-left", radius: "full", loading: "eager" },
    { aspectRatio: 16 / 9, width: "50%" },
  ])("Image %j is a real snippet", (args) => {
    expect(problemsIn(imagePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Image writes src and alt always, the ratio as a fraction, and only what differs", () => {
    expect(imagePlaygroundSnippet({ src: "/placeholder-img.png", alt: "Placeholder image", objectFit: "cover", position: "center", radius: "none", loading: "lazy" })).toBe(
      '<div style={{ width: "16rem" }}>\n  <Image src="/hero.jpg" alt="Placeholder image" />\n</div>',
    );
    expect(imagePlaygroundSnippet({ src: "/a.png", alt: "A", aspectRatio: 4 / 3, width: 200, height: "10rem" }, "20rem")).toBe(
      '<div style={{ width: "20rem" }}>\n  <Image src="/a.png" alt="A" aspectRatio={4 / 3} width={200} height="10rem" />\n</div>',
    );
    expect(imagePlaygroundSnippet({ alt: "A", aspectRatio: 1, radius: "full" })).toContain('aspectRatio={1} radius="full"');
  });

  it.each([{}, { count: 10, size: "xl", orientation: "vertical", variant: "bars", showLabel: true, "aria-label": "Gallery navigation" }])(
    "Indicators %j is a real snippet",
    (args) => {
      expect(problemsIn(indicatorsPlaygroundSnippet(args as never))).toEqual([]);
    },
  );

  it("Indicators wires its position to the reader's state and writes only what differs", () => {
    expect(indicatorsPlaygroundSnippet({ count: 5, size: "md", orientation: "horizontal", variant: "dots", showLabel: false, "aria-label": "Slide navigation" })).toBe(
      "{/* const [index, setIndex] = useState(0); — Indicators is controlled, so your component holds the position */}\n<Indicators count={5} activeIndex={index} onIndexChange={setIndex} />",
    );
    expect(indicatorsPlaygroundSnippet({ count: 3, orientation: "vertical", showLabel: true })).toContain(
      'count={3} activeIndex={index} onIndexChange={setIndex} orientation="vertical" showLabel',
    );
  });

  it.each([{}, { size: "lg", variant: "secondary", threshold: -1, label: "Top" }])("BackToTop %j is a real snippet", (args) => {
    expect(problemsIn(backToTopPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("BackToTop is just the component until a prop differs", () => {
    expect(backToTopPlaygroundSnippet({ size: "md", variant: "primary", threshold: 400, label: "Back to top" })).toBe("<BackToTop />");
    expect(backToTopPlaygroundSnippet({ threshold: -1 })).toBe("<BackToTop threshold={-1} />");
  });

  it.each([{}, { open: true, opacity: 80, blur: true, inPortal: false }])("Backdrop %j is a real snippet", (args) => {
    expect(problemsIn(backdropPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Backdrop always shows the Backdrop, wired to the reader's state", () => {
    expect(backdropPlaygroundSnippet({ open: false, opacity: 60, blur: false, inPortal: true })).toBe(
      "{/* const [isOpen, setIsOpen] = useState(false); */}\n<Backdrop open={isOpen} onClick={() => setIsOpen(false)} />",
    );
    expect(backdropPlaygroundSnippet({ opacity: 80, blur: true, inPortal: false })).toContain("opacity={80} blur inPortal={false}");
  });

  it.each([
    {},
    { children: "Body", defaultOpen: true, disabled: true, orientation: "horizontal", trigger: "Button trigger" },
    { trigger: "None (externally driven)" },
  ])("Collapse %j is a real snippet", (args) => {
    expect(problemsIn(collapsePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Collapse turns the trigger control's option key back into a trigger (or none), and writes only what differs", () => {
    expect(collapsePlaygroundSnippet({ trigger: "Button trigger", defaultOpen: false, disabled: false, orientation: "vertical" })).toBe(
      '<Collapse trigger={<Button variant="secondary">Toggle details</Button>}>\n  <Text>Hidden content revealed on toggle.</Text>\n</Collapse>',
    );
    expect(collapsePlaygroundSnippet({ trigger: "None (externally driven)" })).not.toContain("trigger=");
    // The stories that always render a button say so, whatever the (stripped) control holds.
    expect(collapsePlaygroundSnippet({ trigger: undefined, defaultOpen: true }, true)).toContain('trigger={<Button variant="secondary">Toggle details</Button>} defaultOpen');
    expect(collapsePlaygroundSnippet({ trigger: "Button trigger", orientation: "horizontal" })).toContain('orientation="horizontal"');
  });

  it.each([
    {},
    { content: "Delete", children: "Icon-only trigger", side: "left", align: "end", delayDuration: 0, disableHoverableContent: true, hideArrow: true, defaultOpen: true, "aria-label": "Help" },
  ])("Tooltip %j is a real snippet", (args) => {
    expect(problemsIn(tooltipPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Tooltip writes only what differs, and knows its trigger from the control's option key", () => {
    expect(tooltipPlaygroundSnippet({ content: "Save your changes", children: "Button trigger", side: "top", align: "center", delayDuration: 400 })).toBe(
      '<Tooltip content="Save your changes">\n  <Button variant="secondary">Hover or focus me</Button>\n</Tooltip>',
    );
    const icon = tooltipPlaygroundSnippet({ content: "Delete item", children: "Icon-only trigger" });
    expect(icon).toContain("<IconButton icon={TrashIcon}");
    expect(icon).toContain("TrashIcon comes from @dbm-system/icons");
    expect(tooltipPlaygroundSnippet({ content: "Save", children: "Icon-only trigger" }, "save")).toContain("<Button>Save</Button>");
    expect(tooltipPlaygroundSnippet({ content: "x", delayDuration: 0, hideArrow: true })).toContain("delayDuration={0} hideArrow");
  });

  it.each([{}, { children: "Loading data", fallback: "Please wait" }, { fallback: "" }])("ClientOnly %j is a real snippet", (args) => {
    expect(problemsIn(clientOnlyPlaygroundSnippet(args))).toEqual([]);
  });

  it("ClientOnly writes a fallback only when there is one", () => {
    expect(clientOnlyPlaygroundSnippet({ children: "Body", fallback: "" })).toBe("<ClientOnly>\n  <Text>Body</Text>\n</ClientOnly>");
    expect(clientOnlyPlaygroundSnippet({ children: "Body", fallback: "Loading…" })).toBe(
      '<ClientOnly fallback={<Text color="secondary">Loading…</Text>}>\n  <Text>Body</Text>\n</ClientOnly>',
    );
  });

  it.each([{}, { trapped: true, loop: true, asChild: true }])("FocusTrap %j is a real snippet", (args) => {
    expect(problemsIn(focusTrapPlaygroundSnippet(args))).toEqual([]);
  });

  it("FocusTrap writes only the props that are on", () => {
    expect(focusTrapPlaygroundSnippet({ trapped: false, loop: false, asChild: false }).startsWith("<FocusTrap>\n")).toBe(true);
    expect(focusTrapPlaygroundSnippet({ trapped: true, loop: true })).toContain("<FocusTrap trapped loop>");
  });

  it.each([{}, { disablePortal: true }, { disablePortal: false, asChild: true }])("Portal %j is a real snippet", (args) => {
    expect(problemsIn(portalPlaygroundSnippet(args))).toEqual([]);
  });

  it("Portal writes only the props that are on, and says where it renders by default", () => {
    expect(portalPlaygroundSnippet({ disablePortal: true })).toBe("<Portal disablePortal>\n  <span>Portaled content</span>\n</Portal>");
    expect(portalPlaygroundSnippet({})).toContain("document.body");
  });

  it.each([{}, { children: "Skip to content", focusable: true }])("VisuallyHidden %j is a real snippet", (args) => {
    expect(problemsIn(visuallyHiddenPlaygroundSnippet(args))).toEqual([]);
  });

  it("VisuallyHidden writes the text, and `focusable` only when it's on", () => {
    expect(visuallyHiddenPlaygroundSnippet({ children: "Hidden", focusable: false })).toBe("<VisuallyHidden>Hidden</VisuallyHidden>");
    expect(visuallyHiddenPlaygroundSnippet({ children: "Hidden", focusable: true })).toBe("<VisuallyHidden focusable>Hidden</VisuallyHidden>");
  });
});

describe("Playground snippets for the eight typography atoms", () => {
  it("the shared helpers: entities in text, safe attribute quoting, and a truncate text field read as a number", () => {
    expect(escapeJsxText("a < b && {c}")).toBe("a &lt; b &amp;&amp; &#123;c&#125;");
    expect(quote("plain")).toBe('"plain"');
    expect(quote('say "hi"')).toBe('{"say \\"hi\\""}');
    expect(quote("a & b")).toBe('{"a & b"}');
    expect(truncateValue("")).toBeUndefined();
    expect(truncateValue(" ")).toBeUndefined();
    expect(truncateValue("2")).toBe(2);
    expect(truncateValue(3)).toBe(3);
    expect(truncateValue(0)).toBeUndefined();
    expect(truncateValue("nope")).toBeUndefined();
    expect(truncateValue(undefined)).toBeUndefined();
  });

  it.each([
    {},
    { children: "Quote", variant: "pull-quote", attribution: "Someone", cite: "https://example.com/x" },
    { children: "A < B & C", attribution: 'A "quoted" name' },
  ])("Blockquote %j is a real snippet", (args) => {
    expect(problemsIn(blockquotePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Blockquote writes only what differs, and swaps the stories' own source URL for a neutral one", () => {
    expect(blockquotePlaygroundSnippet({ children: "Quote", variant: "default", attribution: undefined, cite: undefined })).toBe("<Blockquote>\n  Quote\n</Blockquote>");
    expect(blockquotePlaygroundSnippet({ children: "Q", variant: "pull-quote", attribution: "Steve Jobs", cite: "https://en.wikiquote.org/wiki/Steve_Jobs" })).toBe(
      '<Blockquote variant="pull-quote" attribution="Steve Jobs" cite="https://example.com/quotes/design">\n  Q\n</Blockquote>',
    );
    expect(blockquotePlaygroundSnippet({ children: "Q", cite: "https://example.org/mine" })).toContain('cite="https://example.org/mine"');
  });

  it.each([{}, { children: "pnpm dev" }, { children: "a < b" }])("Code %j is a real snippet", (args) => {
    expect(problemsIn(codePlaygroundSnippet(args))).toEqual([]);
  });

  it("Code writes the text as an inline Code", () => {
    expect(codePlaygroundSnippet({ children: "pnpm install" })).toBe("<Code>pnpm install</Code>");
    expect(codePlaygroundSnippet({ children: "a < b" })).toBe("<Code>a &lt; b</Code>");
  });

  it.each([{}, { children: "Esc", "aria-label": "Escape" }, { children: "⌘", "aria-label": 'The "Command" key' }])("Kbd %j is a real snippet", (args) => {
    expect(problemsIn(kbdPlaygroundSnippet(args))).toEqual([]);
  });

  it("Kbd writes an aria-label only when there is one", () => {
    expect(kbdPlaygroundSnippet({ children: "Esc", "aria-label": "" })).toBe("<Kbd>Esc</Kbd>");
    expect(kbdPlaygroundSnippet({ children: "Esc", "aria-label": "Escape" })).toBe('<Kbd aria-label="Escape">Esc</Kbd>');
  });

  it.each([
    {},
    { children: "Find design", query: "design", tone: "danger", caseSensitive: true },
    { children: "Design and agents", query: ["design", "agent"], tone: "info" },
    { children: "x", query: "" },
  ])("Highlight %j is a real snippet", (args) => {
    expect(problemsIn(highlightPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Highlight writes only what differs, a single query as a string and several as an array", () => {
    expect(highlightPlaygroundSnippet({ children: "x", tone: "warning", caseSensitive: false })).toBe("<Highlight>x</Highlight>");
    expect(highlightPlaygroundSnippet({ children: "x", query: "design" })).toBe('<Highlight query="design">x</Highlight>');
    expect(highlightPlaygroundSnippet({ children: "x", query: ["design", "agent"], tone: "info", caseSensitive: true })).toBe(
      '<Highlight query={["design", "agent"]} tone="info" caseSensitive>x</Highlight>',
    );
    expect(highlightPlaygroundSnippet({ children: "x", query: [""] })).toBe("<Highlight>x</Highlight>");
  });

  it.each([
    {},
    { href: "/docs", children: "Docs", external: false, underline: "always", disabled: false, "aria-label": "" },
    { href: "https://example.com/?a=1&b=2", children: "Out", external: false, underline: "none", disabled: true, "aria-label": 'Go to "Out"' },
  ])("Link %j is a real snippet", (args) => {
    expect(problemsIn(linkPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Link writes only what differs, and `external` only where it changes the auto-detection from the href", () => {
    expect(linkPlaygroundSnippet({ href: "/docs", children: "Documentation", external: false, underline: "always", disabled: false, "aria-label": "" })).toBe(
      '<Link href="/docs">Documentation</Link>',
    );
    expect(linkPlaygroundSnippet({ href: "/download", children: "x", external: true })).toBe('<Link href="/download" external>x</Link>');
    expect(linkPlaygroundSnippet({ href: "https://example.com", children: "x", external: true })).toBe('<Link href="https://example.com">x</Link>');
    expect(linkPlaygroundSnippet({ href: "https://example.com", children: "x", external: false })).toBe('<Link href="https://example.com" external={false}>x</Link>');
    expect(linkPlaygroundSnippet({ href: "//cdn.example.com/a", children: "x", external: false })).toContain("external={false}");
    expect(linkPlaygroundSnippet({ href: "/docs", children: "x", underline: "hover", disabled: true })).toBe('<Link href="/docs" underline="hover" disabled>x</Link>');
    // size is written only when one is chosen: "inherit" is the Playground's word for leaving it out
    expect(linkPlaygroundSnippet({ href: "/docs", children: "x", size: "inherit" })).toBe('<Link href="/docs">x</Link>');
    expect(linkPlaygroundSnippet({ href: "/docs", children: "x", size: "lg" })).toBe('<Link href="/docs" size="lg">x</Link>');
  });

  it.each([{}, { children: "Inbox", interactive: true, selected: true, disabled: true, "aria-label": "Inbox" }])("ListItem %j is a real snippet", (args) => {
    expect(problemsIn(listItemPlaygroundSnippet(args))).toEqual([]);
  });

  it("ListItem sits in the List it needs, and an interactive one gets the handler it needs", () => {
    expect(listItemPlaygroundSnippet({ children: "One", interactive: false, selected: false, disabled: false, "aria-label": "" })).toBe(
      "<List>\n  <ListItem>One</ListItem>\n</List>",
    );
    const interactive = listItemPlaygroundSnippet({ children: "Home", interactive: true, selected: true });
    expect(interactive).toContain("<ListItem interactive selected onClick={handleClick}>Home</ListItem>");
    expect(interactive).toContain("handleClick is yours");
  });

  it.each([
    {},
    { children: "Title", level: 1 },
    { children: "Title", level: 3, size: "xl", align: "center", weight: "medium", color: "secondary", fontFamily: "primary", wrap: "balance", trim: "both", truncate: "2", as: "div" },
  ])("Heading %j is a real snippet", (args) => {
    expect(problemsIn(headingPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Heading writes only what differs, and `size` only where it isn't the level's own default", () => {
    expect(headingPlaygroundSnippet({ children: "Design builds meaning", level: 2, size: "4xl", align: "start", weight: "bold", color: "primary", fontFamily: "secondary", wrap: "wrap", truncate: "" })).toBe(
      "<Heading>Design builds meaning</Heading>",
    );
    expect(headingPlaygroundSnippet({ children: "x", level: 3, size: "3xl" })).toBe("<Heading level={3}>x</Heading>");
    expect(headingPlaygroundSnippet({ children: "x", level: 1, size: "5xl" })).toBe("<Heading level={1}>x</Heading>");
    expect(headingPlaygroundSnippet({ children: "x", level: 2, size: "xl" })).toBe('<Heading size="xl">x</Heading>');
    expect(headingPlaygroundSnippet({ children: "x", level: 3, size: "3xl", truncate: "2", trim: "start" })).toBe('<Heading level={3} trim="start" truncate={2}>x</Heading>');
    expect(headingPlaygroundSnippet({ children: "x", as: "div", level: 3, size: "lg" })).toBe('<Heading as="div" level={3} size="lg">x</Heading>');
  });

  it.each([
    {},
    { children: "Body", size: "lg", align: "end", weight: "semibold", color: "danger", fontFamily: "secondary", wrap: "pretty", truncate: 3, as: "label" },
  ])("Text %j is a real snippet", (args) => {
    expect(problemsIn(textPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Text writes only what differs (p, base, start, regular, primary, primary, wrap)", () => {
    expect(textPlaygroundSnippet({ children: "Design builds meaning", size: "base", align: "start", weight: "regular", color: "primary", fontFamily: "primary", wrap: "wrap", truncate: "" })).toBe(
      "<Text>Design builds meaning</Text>",
    );
    expect(textPlaygroundSnippet({ children: "x", size: "lg", as: "span", truncate: "2" })).toBe('<Text as="span" size="lg" truncate={2}>x</Text>');
    expect(textPlaygroundSnippet({ children: "x", as: "p" })).toBe("<Text>x</Text>");
  });
});

describe("icon controls: Storybook's snippet transform is handed the control's option key, not the mapped component", () => {
  // For a control with a `mapping` (`{ Star: StarIcon }`), `context.args` holds `"Star"`. A builder
  // that only recognised the component silently dropped the icon (found on FieldError's "Without
  // icon" story, whose snippet came out identical to the Playground's).
  it("Button", () => {
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: "Wallet", trailingIcon: "ArrowRight" })).toBe(
      "<Button leadingIcon={WalletIcon} trailingIcon={ArrowRightIcon}>Pay</Button>",
    );
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: "None", trailingIcon: "Nonsense" })).toBe("<Button>Pay</Button>");
  });

  it("IconButton — and an unknown key still gives the required icon a name", () => {
    expect(iconButtonPlaygroundSnippet({ icon: "Trash", "aria-label": "Delete" })).toBe('<IconButton icon={TrashIcon} aria-label="Delete" />');
    expect(iconButtonPlaygroundSnippet({ icon: "Heart" })).toContain("icon={HeartIcon}");
    expect(iconButtonPlaygroundSnippet({ icon: "Nonsense" })).toContain("icon={HeartIcon}");
  });

  it("Checkbox", () => {
    expect(checkboxPlaygroundSnippet({ children: "x", icon: "Star", indeterminateIcon: "X" })).toBe(
      "<Checkbox icon={StarIcon} indeterminateIcon={XIcon}>x</Checkbox>",
    );
    expect(checkboxPlaygroundSnippet({ children: "x", icon: "Default", indeterminateIcon: "Default" })).toBe("<Checkbox>x</Checkbox>");
  });

  it("Switch", () => {
    expect(switchPlaygroundSnippet({ children: "Dark", checkedIcon: "Moon", uncheckedIcon: "Sun" })).toBe(
      "<Switch checkedIcon={MoonIcon} uncheckedIcon={SunIcon}>Dark</Switch>",
    );
    expect(switchPlaygroundSnippet({ children: "x", checkedIcon: "None", uncheckedIcon: "None" })).toBe("<Switch>x</Switch>");
  });

  it("FieldError — Default is nothing, Hidden is icon={false}, a name is that icon", () => {
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Default" })).toBe("<FieldError>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Hidden" })).toBe("<FieldError icon={false}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Star" })).toBe("<FieldError icon={StarIcon}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Heart" })).toBe("<FieldError icon={HeartIcon}>Bad</FieldError>");
  });

  it("Tag", () => {
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "Tag", trailingIcon: "CheckCircle" })).toBe(
      "<Tag leadingIcon={TagIcon} trailingIcon={CheckCircleIcon}>Design</Tag>",
    );
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "None", trailingIcon: "None" })).toBe("<Tag>Design</Tag>");
  });
});

describe("Playground snippets for Tabs", () => {
  const tabsArgs = [
    {},
    { defaultValue: "activity", variant: "subtle", size: "sm" },
    { defaultValue: "settings", variant: "solid", size: "xl", orientation: "vertical", activationMode: "manual" },
    { fullWidth: true, dir: "rtl" },
    { variant: "outlined", rounded: true, size: "lg" },
    { align: "center" },
    { align: "end", fullWidth: true },
    { showScrollButtons: false },
    { align: "center", showScrollButtons: false },
  ] as const;

  it.each(tabsArgs)("Tabs %j is a real snippet", (args) => {
    expect(problemsIn(tabsPlaygroundSnippet(args))).toEqual([]);
  });

  it("Tabs writes only what differs from the defaults, and always the starting tab", () => {
    expect(
      tabsPlaygroundSnippet({
        defaultValue: "overview",
        variant: "underline",
        size: "md",
        orientation: "horizontal",
        activationMode: "automatic",
        fullWidth: false,
        dir: "ltr",
      }),
    ).toMatch(/^<Tabs defaultValue="overview">\n/);
    expect(tabsPlaygroundSnippet({ defaultValue: "activity", variant: "subtle", size: "sm" })).toMatch(
      /^<Tabs defaultValue="activity" variant="subtle" size="sm">\n/,
    );
    expect(tabsPlaygroundSnippet({ variant: "outlined", rounded: true })).toMatch(
      /^<Tabs defaultValue="overview" variant="outlined" rounded>\n/,
    );
    expect(tabsPlaygroundSnippet({ rounded: false })).toMatch(/^<Tabs defaultValue="overview">\n/);
    expect(tabsPlaygroundSnippet({ orientation: "vertical", activationMode: "manual", fullWidth: true, dir: "rtl" })).toMatch(
      /^<Tabs defaultValue="overview" orientation="vertical" activationMode="manual" fullWidth dir="rtl">\n/,
    );
  });

  it("Tabs writes align onto Tabs.List, not the root, and only when it isn't the default", () => {
    expect(tabsPlaygroundSnippet({ align: "start" })).toMatch(/<Tabs\.List aria-label="Project">\n/);
    expect(tabsPlaygroundSnippet({ align: "center" })).toMatch(/<Tabs\.List aria-label="Project" align="center">\n/);
    expect(tabsPlaygroundSnippet({ align: "end", variant: "subtle" })).toMatch(
      /^<Tabs defaultValue="overview" variant="subtle">\n {2}<Tabs\.List aria-label="Project" align="end">\n/,
    );
  });

  it("Tabs writes showScrollButtons onto Tabs.List, not the root, and only when it's false", () => {
    expect(tabsPlaygroundSnippet({ showScrollButtons: true })).toMatch(/<Tabs\.List aria-label="Project">\n/);
    expect(tabsPlaygroundSnippet({ showScrollButtons: false })).toMatch(
      /<Tabs\.List aria-label="Project" showScrollButtons={false}>\n/,
    );
    expect(tabsPlaygroundSnippet({ align: "center", showScrollButtons: false })).toMatch(
      /<Tabs\.List aria-label="Project" align="center" showScrollButtons={false}>\n/,
    );
  });
});

describe("Playground snippets for Stat", () => {
  const statArgs = [
    {},
    { variant: "outlined", tone: "brand", size: "md", orientation: "vertical" },
    { variant: "filled", size: "lg", orientation: "horizontal" },
    { tone: "danger", announce: true },
    { trend: false },
  ] as const;

  it.each(statArgs)("Stat %j is a real snippet", (args) => {
    expect(problemsIn(statPlaygroundSnippet(args))).toEqual([]);
  });

  it("Stat writes only what differs from the defaults", () => {
    expect(
      statPlaygroundSnippet({ variant: "ghost", tone: "neutral", size: "md", orientation: "vertical" }),
    ).toMatch(/^\{\/\* UsersIcon comes from @dbm-system\/icons \*\/\}\n<Stat>\n/);
    expect(statPlaygroundSnippet({ variant: "outlined", size: "sm" })).toMatch(
      /^\{\/\* UsersIcon comes from @dbm-system\/icons \*\/\}\n<Stat variant="outlined" size="sm">\n/,
    );
    expect(statPlaygroundSnippet({ orientation: "horizontal" })).toMatch(/<Stat orientation="horizontal">\n/);
    expect(statPlaygroundSnippet({ announce: true })).toMatch(/<Stat announce>\n/);
  });

  it("Stat shows Stat.Trend inside Stat.Value by default, and omits it when the demo-trend control is off", () => {
    expect(statPlaygroundSnippet({})).toContain("<Stat.Trend value={4.2} />");
    expect(statPlaygroundSnippet({ trend: false })).not.toContain("Stat.Trend");
  });
});

describe("Playground snippet for Dialog", () => {
  const dialogArgs = [
    {},
    { modal: false, size: "xl", divided: true },
    { fullScreen: true, showCloseButton: false },
    { closeOnOutsideClick: false, closeOnEscape: false, size: "xs" },
    { divided: "auto", placement: "top", busy: true, keepMounted: true, scrimOpacity: 80, scrimBlur: true },
    { divided: "on" },
    { divided: "off" },
  ] as const;

  it.each(dialogArgs)("Dialog %j is a real snippet", (args) => {
    expect(problemsIn(dialogPlaygroundSnippet(args))).toEqual([]);
  });

  it("Dialog writes only what differs from the defaults", () => {
    const plain = dialogPlaygroundSnippet({
      modal: true,
      size: "md",
      fullScreen: false,
      divided: "auto",
      showCloseButton: true,
      closeOnOutsideClick: true,
      closeOnEscape: true,
    });
    expect(plain).toMatch(/^<Dialog>\n/);
    expect(plain).toContain("<Dialog.Content>");
    expect(dialogPlaygroundSnippet({ modal: false })).toMatch(/^<Dialog modal=\{false\}>\n/);
    expect(dialogPlaygroundSnippet({ size: "lg", divided: true })).toContain('<Dialog.Content size="lg" divided>');
    expect(dialogPlaygroundSnippet({ closeOnEscape: false })).toContain("closeOnEscape={false}");
    // `divided` defaults to "auto": that is written as nothing, and the other two are written
    expect(dialogPlaygroundSnippet({ divided: "auto" })).toContain("<Dialog.Content>");
    expect(dialogPlaygroundSnippet({ divided: "on" })).toContain("<Dialog.Content divided>");
    expect(dialogPlaygroundSnippet({ divided: "off" })).toContain("<Dialog.Content divided={false}>");
    expect(dialogPlaygroundSnippet({ placement: "center" })).toContain("<Dialog.Content>");
    expect(dialogPlaygroundSnippet({ placement: "top", busy: true, keepMounted: true })).toContain(
      '<Dialog.Content placement="top" busy keepMounted>',
    );
    expect(dialogPlaygroundSnippet({ scrimOpacity: 60 })).toContain("<Dialog.Content>");
    expect(dialogPlaygroundSnippet({ scrimOpacity: 90, scrimBlur: true })).toContain(
      "<Dialog.Content scrimOpacity={90} scrimBlur>",
    );
  });
});

describe("Playground snippet for AlertDialog", () => {
  const alertArgs = [
    {},
    { tone: "danger", size: "xs", busy: true, closeOnEscape: false, scrimOpacity: 80, scrimBlur: true },
    { tone: "neutral", size: "sm", scrimOpacity: 60 },
  ] as const;

  it.each(alertArgs)("AlertDialog %j is a real snippet", (args) => {
    expect(problemsIn(alertDialogPlaygroundSnippet(args))).toEqual([]);
  });

  it("AlertDialog writes only what differs from the defaults", () => {
    expect(alertDialogPlaygroundSnippet({ tone: "neutral", size: "sm" })).toContain("<AlertDialog.Content>");
    expect(alertDialogPlaygroundSnippet({ tone: "danger" })).toContain('<AlertDialog.Content tone="danger">');
    expect(alertDialogPlaygroundSnippet({ closeOnEscape: false, busy: true })).toContain(
      "<AlertDialog.Content busy closeOnEscape={false}>",
    );
    expect(alertDialogPlaygroundSnippet({ scrimOpacity: 80, scrimBlur: true })).toContain(
      "<AlertDialog.Content scrimOpacity={80} scrimBlur>",
    );
  });
});

describe("Playground snippet for Navbar", () => {
  const navbarArgs = [
    {},
    { variant: "filled", size: "lg" },
    { currentVariant: "underline" },
    { sticky: true, hideOnScroll: true },
    { sticky: true, hideOnScroll: true, stickyOffset: 6, defaultMenuOpen: true, "aria-label": 'Site "header" & more', id: "top" },
    { hideOnScroll: true, stickyOffset: 6 },
    { rounded: true, currentVariant: "subtle" },
    { currentVariant: "solid", collapseBelow: "never", contained: true },
    { collapseBelow: "3xl", menuSide: "end", closeMenuOnNavigate: false },
    { sticky: true, dir: "rtl", variant: "ghost", size: "sm" },
  ] as const;

  it.each(navbarArgs)("Navbar %j is a real snippet", (args) => {
    expect(problemsIn(navbarPlaygroundSnippet(args))).toEqual([]);
  });

  it("Navbar writes only what differs from the defaults", () => {
    const plain = navbarPlaygroundSnippet({ variant: "outlined", size: "md", collapseBelow: "md", menuSide: "start", dir: "ltr" });
    expect(plain).toMatch(/^<Navbar>\n/);
    expect(navbarPlaygroundSnippet({ variant: "filled", size: "lg" })).toMatch(/^<Navbar variant="filled" size="lg">\n/);
    expect(navbarPlaygroundSnippet({ closeMenuOnNavigate: false, sticky: true })).toContain(
      "<Navbar closeMenuOnNavigate={false} sticky>",
    );
    expect(navbarPlaygroundSnippet({ dir: "rtl" })).toContain('<Navbar dir="rtl">');
    expect(navbarPlaygroundSnippet({ rounded: true })).toContain("<Navbar rounded>");
    expect(navbarPlaygroundSnippet({ sticky: true, hideOnScroll: true })).toContain("<Navbar sticky hideOnScroll>");
    // `hideOnScroll` and `stickyOffset` need `sticky`, so they are written only with it
    expect(navbarPlaygroundSnippet({ hideOnScroll: true, stickyOffset: 6 })).toMatch(/^<Navbar>\n/);
    expect(navbarPlaygroundSnippet({ sticky: true, stickyOffset: 6 })).toContain("<Navbar sticky stickyOffset={6}>");
    expect(navbarPlaygroundSnippet({ defaultMenuOpen: true, id: "top", "aria-label": "Site" })).toContain(
      '<Navbar defaultMenuOpen aria-label="Site" id="top">',
    );
    // text with a quote or an ampersand is written as an expression, and an empty control writes nothing
    expect(navbarPlaygroundSnippet({ "aria-label": 'A "b"' })).toContain('aria-label={"A \\"b\\""}');
    expect(navbarPlaygroundSnippet({ "aria-label": "", id: "" })).toMatch(/^<Navbar>\n/);
    expect(navbarPlaygroundSnippet({ rounded: false })).toMatch(/^<Navbar>\n/);
    expect(navbarPlaygroundSnippet({ currentVariant: "underline" })).toMatch(/^<Navbar>\n/);
    expect(navbarPlaygroundSnippet({ currentVariant: "solid" })).toContain('<Navbar currentVariant="solid">');
    expect(navbarPlaygroundSnippet({ currentVariant: "subtle" })).toContain('<Navbar currentVariant="subtle">');
  });
});

describe("Playground snippet for Sidebar", () => {
  const sidebarArgs = [
    {},
    { variant: "filled", size: "lg" },
    { currentVariant: "bar", rounded: true },
    { width: "18rem", side: "end", defaultCollapsed: true },
    { sticky: true, stickyOffset: 6, defaultMenuOpen: true, id: "side" },
    { stickyOffset: 6 },
    { collapseBelow: "3xl", closeMenuOnNavigate: false, dir: "rtl", variant: "ghost", size: "xs" },
    { width: 'min(20rem, "30vw")', id: 'A "b" & c' },
  ] as const;

  it.each(sidebarArgs)("Sidebar %j is a real snippet", (args) => {
    expect(problemsIn(sidebarPlaygroundSnippet(args))).toEqual([]);
  });

  it("Sidebar writes only what differs from the defaults", () => {
    const plain = sidebarPlaygroundSnippet({ variant: "outlined", size: "md", currentVariant: "subtle", side: "start", collapseBelow: "md", dir: "ltr" });
    expect(plain).toContain("\n<Sidebar>\n");
    expect(sidebarPlaygroundSnippet({ variant: "filled", size: "lg" })).toContain('<Sidebar variant="filled" size="lg">');
    expect(sidebarPlaygroundSnippet({ closeMenuOnNavigate: false, sticky: true })).toContain("<Sidebar closeMenuOnNavigate={false} sticky>");
    expect(sidebarPlaygroundSnippet({ dir: "rtl" })).toContain('<Sidebar dir="rtl">');
    expect(sidebarPlaygroundSnippet({ rounded: true, currentVariant: "solid" })).toContain('<Sidebar currentVariant="solid" rounded>');
    expect(sidebarPlaygroundSnippet({ width: "18rem", side: "end" })).toContain('<Sidebar width="18rem" side="end">');
    expect(sidebarPlaygroundSnippet({ defaultCollapsed: true, defaultMenuOpen: true })).toContain("<Sidebar defaultCollapsed defaultMenuOpen>");
    // `stickyOffset` needs `sticky`, so it is written only with it
    expect(sidebarPlaygroundSnippet({ stickyOffset: 6 })).toContain("\n<Sidebar>\n");
    expect(sidebarPlaygroundSnippet({ sticky: true, stickyOffset: 6 })).toContain("<Sidebar sticky stickyOffset={6}>");
    // text with a quote or an ampersand is written as an expression, and an empty control writes nothing
    expect(sidebarPlaygroundSnippet({ id: 'A "b"' })).toContain('id={"A \\"b\\""}');
    expect(sidebarPlaygroundSnippet({ width: "", id: "" })).toContain("\n<Sidebar>\n");
    expect(sidebarPlaygroundSnippet({ rounded: false })).toContain("\n<Sidebar>\n");
  });
});

describe("Playground snippet for Drawer", () => {
  const drawerArgs = [
    {},
    { modal: false, size: "xl", divided: true },
    { side: "start", showCloseButton: false },
    { side: "bottom", closeOnOutsideClick: false, closeOnEscape: false, size: "xs" },
    { side: "top", divided: "off", busy: true, keepMounted: true, scrimOpacity: 80, scrimBlur: true },
    { divided: "on" },
    { divided: "auto" },
  ] as const;

  it.each(drawerArgs)("Drawer %j is a real snippet", (args) => {
    expect(problemsIn(drawerPlaygroundSnippet(args))).toEqual([]);
  });

  it("Drawer writes only what differs from the defaults", () => {
    const plain = drawerPlaygroundSnippet({ modal: true, side: "end", size: "md", divided: "auto" });
    expect(plain).toMatch(/^<Drawer>\n/);
    expect(plain).toContain("<Drawer.Content>");
    expect(drawerPlaygroundSnippet({ modal: false })).toMatch(/^<Drawer modal=\{false\}>\n/);
    expect(drawerPlaygroundSnippet({ side: "start", size: "lg" })).toContain('<Drawer.Content side="start" size="lg">');
    expect(drawerPlaygroundSnippet({ divided: "on" })).toContain("<Drawer.Content divided>");
    expect(drawerPlaygroundSnippet({ divided: "off" })).toContain("<Drawer.Content divided={false}>");
    expect(drawerPlaygroundSnippet({ closeOnEscape: false })).toContain("closeOnEscape={false}");
  });
});

describe("Playground snippet for Toast", () => {
  const toastArgs = [
    {},
    { placement: "top", limit: 1, size: "xs", variant: "solid" },
    { duration: 2000, tone: "danger", title: "Failed", description: "Try again." },
    { duration: "Until dismissed", loading: true, title: "Saving…" },
    { duration: null, showAction: true, actionVariant: "tertiary", dismissible: false, dir: "rtl", placement: "bottom-start" },
    { title: 'He said "hi" & left', description: "a < b {c}" },
    { icon: "Star", title: "Starred" },
    { icon: false, role: "alert", toastId: "sync", title: "Syncing" },
    { clearAll: false, mergeDuplicates: false, hotkey: "Alt + T" },
    { hotkey: ["altKey", "KeyT"], role: "Default", icon: "Default" },
  ] as const;

  it.each(toastArgs)("Toast %j is a real snippet", (args) => {
    expect(problemsIn(toastPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Toast writes only what differs from the defaults", () => {
    const plain = toastPlaygroundSnippet({
      placement: "top-end",
      limit: 3,
      duration: 5000,
      size: "md",
      variant: "subtle",
      tone: "info",
      clearAll: true,
      mergeDuplicates: true,
      hotkey: ["F8"],
      dir: "ltr",
      icon: undefined,
      role: "Default",
    });
    expect(plain).toContain("<Toast.Provider>");
    expect(plain).toContain('toast({ title: "Saved" })');
    expect(toastPlaygroundSnippet({ placement: "top" })).toContain('<Toast.Provider placement="top">');
    expect(toastPlaygroundSnippet({ placement: "bottom-end" })).toContain('<Toast.Provider placement="bottom-end">');
    expect(toastPlaygroundSnippet({ limit: 1 })).toContain("<Toast.Provider limit={1}>");
    expect(toastPlaygroundSnippet({ stack: "fan" })).toContain('<Toast.Provider stack="fan">');
    expect(toastPlaygroundSnippet({ swipeThreshold: 120 })).toContain("<Toast.Provider swipeThreshold={120}>");
    expect(toastPlaygroundSnippet({ swipeThreshold: 50 })).toContain("<Toast.Provider>");
    expect(toastPlaygroundSnippet({ stack: "list" })).toContain("<Toast.Provider>");
    expect(toastPlaygroundSnippet({ tone: "danger", title: "Failed" })).toContain('toast({ title: "Failed", tone: "danger" })');
    expect(toastPlaygroundSnippet({ dismissible: false, title: "x" })).toContain("dismissible: false");
    expect(toastPlaygroundSnippet({ clearAll: false })).toContain("clearAll={false}");
    expect(toastPlaygroundSnippet({ mergeDuplicates: false })).toContain("mergeDuplicates={false}");
    expect(toastPlaygroundSnippet({ role: "status", title: "x" })).toContain('role: "status"');
  });

  it("Toast accepts the control's option keys and the values they map to", () => {
    expect(toastPlaygroundSnippet({ duration: "Until dismissed" })).toContain("duration={null}");
    expect(toastPlaygroundSnippet({ duration: "never" })).toContain("duration={null}");
    expect(toastPlaygroundSnippet({ duration: null })).toContain("duration={null}");
    expect(toastPlaygroundSnippet({ duration: 10000 })).toContain("duration={10000}");
    expect(toastPlaygroundSnippet({ hotkey: "Alt + T" })).toContain('hotkey={["altKey", "KeyT"]}');
    expect(toastPlaygroundSnippet({ hotkey: ["altKey", "KeyT"] })).toContain('hotkey={["altKey", "KeyT"]}');
    expect(toastPlaygroundSnippet({ hotkey: "F8" })).not.toContain("hotkey");
    expect(toastPlaygroundSnippet({ icon: "Star" })).toContain("icon: StarIcon");
    expect(toastPlaygroundSnippet({ icon: "Star" })).toContain("StarIcon comes from @dbm-system/icons");
    expect(toastPlaygroundSnippet({ icon: "None" })).toContain("icon: false");
    expect(toastPlaygroundSnippet({ icon: false })).toContain("icon: false");
    expect(toastPlaygroundSnippet({ icon: "Default" })).not.toContain("icon:");
  });

  it("Toast writes the action's variant and an id only when they differ", () => {
    expect(toastPlaygroundSnippet({ showAction: true })).not.toContain("variant:");
    expect(toastPlaygroundSnippet({ showAction: true, actionVariant: "secondary" })).toContain('variant: "secondary"');
    expect(toastPlaygroundSnippet({ toastId: "sync" })).toContain('id: "sync"');
  });

  it("Toast writes the reader's text safely", () => {
    const snippet = toastPlaygroundSnippet({ title: 'say "hi"' });
    expect(snippet).toContain('title: "say \\"hi\\""');
  });
});

describe("Playground snippet for Form", () => {
  const formArgs = [
    {},
    { validateOn: "blur", focusTarget: "summary", summary: true },
    { disabled: true, size: "lg", gap: 6, noValidate: false },
    { focusTarget: false, size: "default" },
  ] as const;

  it.each(formArgs)("Form %j is a real snippet", (args) => {
    expect(problemsIn(formPlaygroundSnippet(args))).toEqual([]);
  });

  it("writes only what differs from the defaults, and the choice that isn't a size isn't written", () => {
    expect(formPlaygroundSnippet({ validateOn: "submit", focusTarget: "field", gap: 4, size: "default" })).toMatch(
      /^<Form aria-label="Create account" onSubmit=/,
    );
    expect(formPlaygroundSnippet({ validateOn: "blur" })).toContain('validateOn="blur"');
    expect(formPlaygroundSnippet({ focusTarget: false })).toContain("focusTarget={false}");
    expect(formPlaygroundSnippet({ noValidate: false })).toContain("noValidate={false}");
    expect(formPlaygroundSnippet({ summary: true })).toContain("<Form.Summary />");
    expect(formPlaygroundSnippet({})).not.toContain("<Form.Summary />");
  });
});

describe("Playground snippet for ContextMenu", () => {
  const everything = {
    modal: false,
    dir: "rtl",
    size: "lg",
    alignOffset: 6,
    avoidCollisions: false,
    collisionPadding: 20,
    loop: true,
  } as const;

  it.each([{}, everything, { modal: true, dir: "ltr", size: "md", alignOffset: 0, avoidCollisions: true, collisionPadding: 8, loop: false }] as const)(
    "ContextMenu %j is a real snippet",
    (args) => {
      expect(problemsIn(contextMenuPlaygroundSnippet(args))).toEqual([]);
    },
  );

  it("writes only what differs from the defaults", () => {
    const code = contextMenuPlaygroundSnippet({ modal: true, dir: "ltr", size: "md", alignOffset: 0, avoidCollisions: true, collisionPadding: 8, loop: false });
    expect(code).toContain("<ContextMenu>");
    expect(code).toContain("<ContextMenu.Content>");
  });

  it("writes each setting that is changed", () => {
    const code = contextMenuPlaygroundSnippet(everything);
    expect(code).toContain('<ContextMenu modal={false} dir="rtl">');
    expect(code).toContain('<ContextMenu.Content size="lg" alignOffset={6} avoidCollisions={false} collisionPadding={20} loop>');
  });
});

describe("Playground snippet for FileUpload", () => {
  const everything = {
    size: "lg",
    layout: "button",
    variant: "ghost",
    multiple: true,
    allowDuplicates: true,
    allowFolders: true,
    showPreviews: true,
    showSummary: false,
    accept: 'image/*,".pdf"',
    maxSizeMb: 5,
    maxFiles: 3,
    required: true,
    hasError: true,
    disabled: true,
    readOnly: true,
    guardPage: true,
  } as const;

  it.each([{}, everything, { multiple: false, maxFiles: 4 }, { accept: "  " }, { maxSizeMb: 0, maxFiles: 0 }] as const)(
    "FileUpload %j is a real snippet",
    (args) => {
      expect(problemsIn(fileUploadPlaygroundSnippet(args))).toEqual([]);
    },
  );

  it("writes only what differs from the defaults", () => {
    const code = fileUploadPlaygroundSnippet({
      size: "md",
      layout: "dropzone",
      variant: "dashed",
      multiple: true,
      showSummary: true,
      allowDuplicates: false,
      accept: "",
      maxSizeMb: 0,
      maxFiles: 0,
    });
    expect(code).toContain('<FileUpload\n  aria-label="Attachments"\n  value={files}\n  onValueChange={setFiles}\n/>');
  });

  it("writes each setting that is changed, a size in bytes, and the limit on files only for several", () => {
    const code = fileUploadPlaygroundSnippet(everything);
    for (const part of ['size="lg"', 'layout="button"', 'variant="ghost"', "allowDuplicates", "allowFolders", "showPreviews", "showSummary={false}", "maxSize={5 * 1024 * 1024}", "maxFiles={3}", "required", "hasError", "disabled", "readOnly", "guardPage"]) {
      expect(code).toContain(part);
    }
    expect(code).toContain('accept={"image/*,\\".pdf\\""}');
    const single = fileUploadPlaygroundSnippet({ multiple: false, maxFiles: 4 });
    expect(single).toContain("multiple={false}");
    expect(single).not.toContain("maxFiles");
  });
});

describe("Playground snippet for CommandPalette", () => {
  const everything = {
    hotkey: "mod+shift+p",
    size: "xl",
    placement: "center",
    showHints: true,
    showCloseButton: true,
    scrimBlur: true,
    loading: true,
    error: true,
    dir: "rtl",
    highlightTone: "highlight",
    defaultQuery: 'say "hi"',
    placeholder: "Aller à…",
    searchNested: false,
    maxPerGroup: 4,
  } as const;

  it.each([{}, everything, { hotkey: false, highlightTone: "none", dir: "ltr", size: "lg", placement: "top", showHints: false }] as const)(
    "CommandPalette %j is a real snippet",
    (args) => {
      expect(problemsIn(commandPalettePlaygroundSnippet(args))).toEqual([]);
    },
  );

  it("writes only what differs from the defaults", () => {
    const code = commandPalettePlaygroundSnippet({ hotkey: "mod+k", size: "lg", placement: "top", showHints: false, showCloseButton: false, scrimBlur: false, loading: false, error: false, dir: "ltr", highlightTone: "none" });
    expect(code).toContain("<CommandPalette");
    for (const word of ["hotkey", "size", "placement", "showHints", "showCloseButton", "scrimBlur", "loading", "error", "dir", "highlightTone", "searchNested", "maxPerGroup"]) {
      expect(code).not.toContain(word);
    }
  });

  it("writes each setting that is changed, quoting the reader's text safely", () => {
    const code = commandPalettePlaygroundSnippet(everything);
    expect(code).toContain('hotkey="mod+shift+p"');
    expect(code).toContain('size="xl"');
    expect(code).toContain('placement="center"');
    expect(code).toContain("showHints");
    expect(code).toContain("showCloseButton");
    expect(code).toContain("scrimBlur");
    expect(code).toContain("loading");
    expect(code).toContain("error");
    expect(code).toContain('dir="rtl"');
    expect(code).toContain('highlightTone="highlight"');
    expect(code).toContain('defaultQuery={"say \\"hi\\""}');
    expect(code).toContain('labels={{ placeholder: "Aller à…" }}');
    expect(code).toContain("searchNested={false}");
    expect(code).toContain("maxPerGroup={4}");
    expect(commandPalettePlaygroundSnippet({ hotkey: false })).toContain("hotkey={false}");
    expect(commandPalettePlaygroundSnippet({ searchNested: true })).not.toContain("searchNested");
  });
});

describe("ImageViewer's Playground snippet", () => {
  const everything = {
    loop: true,
    minZoom: 1.2,
    maxZoom: 8,
    zoomStep: 2,
    doubleClickZoom: false,
    rotatable: false,
    flippable: true,
    fullscreenButton: false,
    tapToToggleControls: true,
    closeOnHistoryBack: true,
    autoPlay: { interval: 2500 },
    thumbnails: true,
    showCounter: true,
    showCaptions: false,
    controls: "hidden",
    swipeToDismiss: false,
    closeOnOutsideClick: false,
    closeOnEscape: false,
    scrimOpacity: 60,
    scrimBlur: true,
    dir: "rtl",
  } as const;

  it.each([{}, everything, { showCounter: false, controls: "auto", dir: "ltr" }, { showCounter: "auto" }] as const)(
    "ImageViewer %j is a real snippet",
    (args) => {
      expect(problemsIn(imageViewerPlaygroundSnippet(args))).toEqual([]);
    },
  );

  it("writes only what differs from the defaults", () => {
    const code = imageViewerPlaygroundSnippet({
      loop: false,
      minZoom: 1,
      maxZoom: 4,
      zoomStep: 1.5,
      doubleClickZoom: true,
      rotatable: true,
      flippable: false,
      fullscreenButton: true,
      tapToToggleControls: false,
      closeOnHistoryBack: false,
      autoPlay: false,
      thumbnails: false,
      showCounter: "auto",
      showCaptions: true,
      controls: "auto",
      swipeToDismiss: true,
      closeOnOutsideClick: true,
      closeOnEscape: true,
      scrimOpacity: 90,
      scrimBlur: false,
      dir: "ltr",
    });
    expect(code).toContain("<ImageViewer");
    for (const word of ["loop", "Zoom", "doubleClick", "rotatable", "flippable", "fullscreen", "tapToToggle", "closeOnHistory", "autoPlay", "thumbnails", "showCounter", "showCaptions", "controls", "swipe", "closeOn", "scrim", "dir"]) {
      expect(code).not.toContain(word);
    }
  });

  it("writes each setting that is changed", () => {
    const code = imageViewerPlaygroundSnippet(everything);
    for (const part of [
      "loop",
      "minZoom={1.2}",
      "maxZoom={8}",
      "zoomStep={2}",
      "doubleClickZoom={false}",
      "rotatable={false}",
      "flippable",
      "fullscreenButton={false}",
      "tapToToggleControls",
      "closeOnHistoryBack",
      "autoPlay={{ interval: 2500 }}",
      "thumbnails",
      "showCounter",
      "showCaptions={false}",
      'controls="hidden"',
      "swipeToDismiss={false}",
      "closeOnOutsideClick={false}",
      "closeOnEscape={false}",
      "scrimOpacity={60}",
      "scrimBlur",
      'dir="rtl"',
    ]) {
      expect(code).toContain(part);
    }
    expect(imageViewerPlaygroundSnippet({ showCounter: false })).toContain("showCounter={false}");
  });
});
