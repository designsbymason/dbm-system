# @dbm-system/components

## 0.2.3

### Patch Changes

- 4a69568: `Button`: the `secondary` variant is now the same height as the other variants at every size. Its 1px outline used to add 2px to its height, so a `secondary` button beside a `primary` one was taller; its block padding now gives the outline back. Nothing else changes: the other variants, `IconButton` and the components sized to a `Button` keep their heights.

## 0.2.2

No changes in this release.

## 0.2.1

### Patch Changes

- 8d63cc3: `Checkbox` and `Radio`: the edge of an unchecked box or circle is now `border.neutral-strong` (4.70:1 on the surface in the light themes, 6.08:1 in the dark ones; it was 2.32:1 in the light themes, under the 3:1 WCAG 1.4.11 asks of a control's boundary), and it darkens to `border.strong` on hover. The checked, error and disabled looks are unchanged.
- 34b2207: `DataTable.Pagination` with `layout="centered"`: below `collapseBelow` the page size and the range now sit at the two ends of the first row and the page controls take the row under them, so Tab moves down the footer instead of from the lower row back up to the upper one (WCAG 2.4.3). The wide and one-row layouts are unchanged.
- dfe3784: `Indicators`: its description now says how it meets WCAG 2.5.8 (target size): the steps are smaller than 24 by 24 px, so the criterion is met through an equivalent control, which `Carousel` draws unless its controls are hidden (previous and next buttons of at least that size). Used on its own, provide that control yourself, or use `variant="bars"` from `sm` up. Nothing in how it looks or behaves changed.
- ee347f4: The package's entries, `dist/index.js` and `dist/index.cjs`, start with `"use client"`, so in the Next.js App Router a server file can import and render a component without a wrapper file. A server file still cannot read a part of a compound (`Card.Header`), pass a function or an event handler as a prop, or call a hook; a file that does needs `"use client"` of its own. Importing from a file that has the marker keeps working.
- a417fce: `Table` and `DataTable`: a pinned header and pinned columns no longer paint over a sticky bar (a `Navbar`, for example) that the page scrolls the table beneath. The table's container is now its own stacking context, so its layers stay inside it.
- 71376d4: `TableToolbar.Filters`, in its bottom sheet: keyboard focus no longer falls out of the sheet. Pressing a section's "Clear" now moves focus to that section's first control, and "Clear all" moves it to "Done", instead of dropping it to the dialog or to the page behind; and the sheet now opens with focus on the first filter control, not on a section's "Clear" (which Enter would press).
- 40fefef: `Tabs` and `Toolbar`: the scroll buttons at the end of a scrolling list no longer paint over, or take clicks through, a sticky bar (a `Navbar`, for example) that the page scrolls the component beneath. Each component's frame is now its own stacking context, so the buttons' layer stays inside it.

## 0.2.0

### Minor Changes

- ac3a2ca: The manifest lists the helpers apart from the components. A helper is a component that supports another and has no page of its own (`HoverCardProvider`, `ImageViewerButton`, `TooltipProvider`): it moves out of `components` into a new `helpers` list (each entry also names the component it supports in `helperOf`), its file moves from `manifest/components/` to `manifest/helpers/`, and `manifest/index.json` has a `helpers` list beside `components`. The `components` list is now the 120 components that have a page of their own, the two application shells included. `AGENTS.md` lists them under Helpers.

## 0.1.2

### Patch Changes

- cf088dc: `Button` and `IconButton` with `asChild` now draw their own pieces inside the element you give them. `Button` draws `leadingIcon`, `trailingIcon` and the loading spinner around the link's own text; `IconButton` draws `icon`, the spinner and the `label` caption inside an empty element (`<IconButton asChild icon={GithubLogoIcon} aria-label="GitHub"><a href="…" aria-label="GitHub" /></IconButton>`; the same name on the link keeps lint rules that check a link for content happy). Before, these props were dropped with a development warning. An `IconButton` element that already has content of its own is used as it is, so code that put the icon in the link by hand still shows one icon.
- 09a3e78: More parts now draw their own pieces inside the element you give them with `asChild`, as `Button` and `IconButton` do, instead of dropping them.
  
  - **Router links.** `Link` draws an external link's icon and its visually hidden "(opens in a new tab)" cue inside your router's link, so a link that leaves the site keeps the warning for screen reader users. `Breadcrumb.Link` draws its `icon`; `Navbar.Link` its `icon`, `badge` and external mark; `Sidebar.Item` its `icon`, `description`, `badge` and external mark (and in the rail its tooltip is now the link's own text); `NavigationMenu.Link` its `icon`, `description`, `badge` and external mark: `<Navbar.Link asChild icon={HouseIcon}><RouterLink to="/">Home</RouterLink></Navbar.Link>`. With `asChild`, whether a link is external is worked out from your element's own `href`, and it gets `target="_blank"` and `rel="noopener noreferrer"` unless your element sets its own.
  - **Triggers and items.** `Tabs.Trigger` and `ToggleGroup.Item` draw their `icon` before your element's own text (an empty `ToggleGroup.Item` element with an `icon` is icon-only, and carries the item's `aria-label`). The `Menu`, `ContextMenu` and `Menubar` items draw their `icon`, `shortcut`, `description` and `trailing` content, and announce a `disabledReason`, from inside your link; an item with none of these uses your element as it is.
  
  The development warnings that said these props have no effect with `asChild` are removed. If you put an icon inside the element by hand because the prop was dropped, leave the prop out and nothing changes; pass the prop and remove the hand-drawn icon to get the built-in size and colour. `Menubar.Action`, `Accordion.Trigger` and `Select`'s trigger are unchanged: with `asChild` your element still replaces their content.
- c2710b8: An app now ships only the components it imports. The package was one bundled ES module that a bundler had to keep whole, so importing `Button` alone carried the entire library (about 328 KB gzipped); it is now built as one module per component with shared chunks, and `Button` alone is about 3 KB. Imports, types and `styles.css` are unchanged. CommonJS (`require`) still gets one file.
- @dbm-system/icons@0.1.2
  - @dbm-system/tokens@0.1.2
  - @dbm-system/utils@0.1.2

## 0.1.1

### Patch Changes

- de93e6b: No functional changes. This is the first release published through the automated release workflow, so it carries an npm provenance attestation that links each package to the commit and workflow run that built it (0.1.0 was published by hand and has none).
- Updated dependencies [de93e6b]
  - @dbm-system/tokens@0.1.1
  - @dbm-system/utils@0.1.1
  - @dbm-system/icons@0.1.1

## 0.1.0

### Minor Changes

- cc3cd65: First release of the DBM System.

  - `@dbm-system/components`: 123 accessible React components (atoms, molecules, organisms and the AppShell and PageShell templates), each with full TypeScript types, a stylesheet and a machine-readable manifest (`@dbm-system/components/manifest/index.json`), and an `AGENTS.md` at the package root for AI coding agents.
  - `@dbm-system/tokens`: the design tokens as CSS (four self-contained themes, purple and emerald in light and dark), typed constants, and a token index (`@dbm-system/tokens/tokens.json`).
  - `@dbm-system/icons`: the Phosphor icon set, typed.
  - `@dbm-system/utils`: the helpers the components are built on; an app does not install it.

  The API is before 1.0: a breaking change bumps the minor version and says how to migrate in its changeset.

### Patch Changes

- Updated dependencies [cc3cd65]
  - @dbm-system/tokens@0.1.0
  - @dbm-system/utils@0.1.0
  - @dbm-system/icons@0.1.0
