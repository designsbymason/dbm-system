# @dbm-system/components

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
