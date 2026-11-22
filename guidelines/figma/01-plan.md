# Figma library — plan (draft for approval)

**Status:** approved by the maintainer 2026-11-19; Phase 0 and Phase 1 (the variables) are done, Phase 2 (the styles and the Foundations page) is built and waiting for the maintainer's review, and Phase 3 (the cover, the Getting started page, the Icons page and the Spec frame master) is built and waits for the maintainer's review of the spec frame; the pilot (Phase 4) has started with Button: its 450-variant set and its spec frame are built on the Inputs page, and the icon colour is settled by [ADR-0238](../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md); Input, Badge and Card are next. Decided in [ADR-0233](../adr/0233-the-figma-library-is-written-from-the-built-tokens-by-a-one-way-script-over-the-tokens-studio-plugin-or-typing-the-variables-by-hand.md), [ADR-0234](../adr/0234-figma-is-a-design-tool-outside-the-build-test-and-hosting-pipelines-and-the-file-needs-professional-or-higher-over-applying-the-free-tooling-rule-to-it.md), [ADR-0235](../adr/0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md) and [ADR-0236](../adr/0236-the-figma-variables-are-four-collections-primitives-semantic-with-four-theme-modes-component-and-viewport-over-one-collection-or-a-collection-per-theme.md); the **(ADR)** marks below point to them.

## 1. Goals

1. A Figma library that **mirrors the code**: the same tokens, the same themes, the same components, so a designer and an engineer describe one system.
2. **Tokens flow one way**, from `packages/tokens` into Figma by a script, so the two cannot drift (`../01-vision-and-goals.md` §3).
3. **Figma used as Figma is meant to be used**: variables with modes, styles, components with properties and slots, auto layout, constraints, no raw values.
4. A file that is itself **premium, professional and clean**: the design system's own look, built from its own library.
5. **No change to any published package.** Everything new is outside `packages/*`, in this folder, in `.local/` and in one private script.

Out of scope: templates, hooks, functions and non-visual utilities, Code Connect and right-to-left (deferred to a later phase), any change to `packages/*`.

## 2. Decisions taken

| Area | Decision |
|---|---|
| Plan | Figma Professional or higher; the target file is checked through the MCP for four modes before anything is written **(ADR: Figma is a design tool outside the build, test and hosting pipelines, so the free-tooling rule does not apply)** |
| Token sync | A generated, one-way script reads `packages/tokens/build/tokens.json` and writes variables through the Figma MCP; it is re-runnable and idempotent **(ADR)** |
| Private data | `.local/figma.json` (file key, node IDs, anything personal); never committed |
| File layout | One file to start; split by tier only if it becomes slow past about 100 components **(ADR)** |
| Pages | A page per category, with sections ordered atom, molecule, organism and one frame per component **(ADR)** |
| Frame content | Lean spec frame; Storybook stays the single source of truth for props and usage |
| Coverage | Visual components only |
| Process | Pilot, then a review gate per category in tier order |
| Look | Editorial and quiet, with the cover chosen by the maintainer 2026-11-21: a halftone dot field fading from the top-right corner in the brand tones, over a large Lora title, with a meta row (400+ variables, 100+ components, Multi theme, Light/Dark mode) so no figure on it goes stale; it is built on the Cover page, every fill bound to a variable |

## 3. What is gitignored and private

| Item | Where it lives | Why |
|---|---|---|
| File key, file URL, node IDs, page IDs | `.local/figma.json` | The work-in-progress file must not be addressable from a public repository |
| A Figma personal access token, if one is ever used | Never in the repository, never a repository secret; the MCP's own sign-in is used instead | Credentials (`CLAUDE.md`, "Security practices") |
| Screenshots, exports and scratch payloads from the work | `.local/figma/` | They show unreleased work |
| The published library's address | `.local/figma.json` until the maintainer decides to publish it | Publication is a separate decision (§8) |

Checks before the first commit: `.local/` is in `.gitignore` and `.githooks/pre-commit` blocks it; the file key is added to the gitignored `.local/blocked-strings.txt` so the guard also catches it in text; `.env.example` is not needed because no environment variable is read. The shape of `figma.json` is documented here, with placeholders only:

```json
{ "fileKey": "<key>", "url": "<url>", "pages": { "<name>": "<node id>" } }
```

## 4. Structure of the Figma file

**Page names and order:** the pages are in four groups, set apart by empty divider pages named `---`: the cover, Getting started, Foundations and Icons; Components with a category page under it, each named with a leading arrow (`↳ Inputs`); and the Spec frame with the Changelog after it. A page name starts with an emoji (or `↳` for a category) and then the plain name, and a script finds a page by the plain name, ignoring that prefix.

**Pages, in order:** Cover; Getting started (a Section of four frames: what the file is and where things are, how to use the modes with the same card shown in four themes and three viewports, how things are named in Figma and in code, and links to Storybook, the website, npm, GitHub and the agent file); Foundations (one page: an Overview frame, then a named Figma Section for each of Color, Typography, Spacing and Radius, Elevation, Motion and Breakpoints, stacked in that order, with that topic's frames side by side inside it and no frame taller than about 3,300 px: Color is six frames, Typography two, the rest one each); Icons (its own page); Spec frame (the master every component's spec frame is an instance of, with a filled example in light and dark); one page per category (Inputs, Data Display, Feedback, Layout, Media, Navigation, Overlay, Typography, Utility); Components (an overview of how components are structured, an index of every component drawn in Figma and a table of those that are not, each with its Storybook link; it replaces the separate Scope notes page, and is generated from the component catalog by `09-components-page.js`, so a component added or removed in code appears there or the script fails; the one hand-kept list is `DRAWN` in the script, to which a component's name is added when its set and spec frame are built, with its spec frame's node id in the gitignored `.local/figma/spec-ids.json`); Changelog (§7).

**The Spec frame master** is a component set on its own page, with a `tier` variant (atom, molecule, organism), three text properties (Name, Description, Storybook label) and six slots. Top to bottom the frame is the header, Variants, Properties and Tokens used (the last two as tables), then Anatomy, Built from and Accessibility side by side. The Properties slot lists the properties the component has in Figma (name, values, default, the code prop each maps to), then names the code props that are not modelled and links to the component's Props table in Storybook, which stays the full reference. An instance sets the properties and puts its content into the slots; a dark twin is the same instance with its Semantic mode set to a dark theme.

**A category page** holds one section per tier in the order atoms, molecules, organisms, and in each section one frame per component, sorted by build order. Each frame is the same **spec frame** built from a master component: a header (name, tier tag, one-line description, link to its Storybook page), the component set laid out as a variant matrix, an anatomy callout, the tokens it uses and its accessibility notes (§6). Props, usage and code stay in Storybook.

**Theme previews:** each spec frame appears in a light and a dark pair; brand switching is the page's explicit mode setting on the Semantic collection, so one page shows purple and, flipped, emerald.

**Layer and component names** follow the code: `Button`, `Button/Group`, `Card/Header`, properties named as the prop (`variant`, `size`, `tone`, `state`). A part of a compound component is its own nested component named `Parent/Part`.

## 5. Variables, styles and tokens

**Collections and modes**

| Collection | Modes | Holds |
|---|---|---|
| Primitives | one (`Value`) | 164 variables: colour scales, spacing, radius, border widths, opacity, icon sizes, breakpoint widths, font families and weights; the unitless line-height and letter-spacing ratios and the z-index scale are held with no scope, as reference values |
| Semantic | purple-light, purple-dark, emerald-light, emerald-dark | 117 `bg`, `text`, `border` and `icon` variables, each aliasing a primitive, with the same names as the theme files |
| Component | one (`Value`) | 121 of the 35 component token files' 135 tokens, as pixel numbers; 14 are not representable (see below) |
| Viewport | mobile (375), tablet (768), desktop (1280) | The 11 font-size steps, the fluid ones evaluated at each width from their `clamp()`; the widths are the sizes a design is drawn at, not tokens |

**Opacity is held as a percentage.** Figma reads an opacity variable as a percentage, so `opacity/40` is the number 40, not 0.4 (a bound opacity of 0.4 draws at 0.4%, found in the Button pilot); the sync script writes it that way.

**Rules:** a variable is named by its token group, then the rest of the token's name, with a colour as `color/<hue>/<step>` and a component size step as its own segment (`color/purple/600`, `bg/brand-hover`, `space/4`, `avatar/size/lg`); its web code syntax is the CSS custom property (`var(--dbm-bg-brand-hover)`); a semantic variable aliases a primitive and never holds a raw value; scopes are set so a colour variable cannot be applied to a spacing field; every variable carries the token's `$description`. The script writes only what the tokens contain: adding a token in the repo and re-running it adds the variable.

**Styles** (written by the same script, `06-styles.js`): 21 text styles, 10 effect styles and 3 grid styles.
- **Text styles** are named `Role/size` and bind their size to the Viewport variable and their family and weight to the Primitives variables, so a frame's Viewport mode resizes the type. Line height and letter spacing are the token ratios as percentages. The roles are a design decision, not a token: `Display` (Lora Medium, 3xl to 6xl, tight line height), `Heading` (Nunito Bold, sm to 2xl), `Body` (Nunito Regular, xs to lg), `Label` (Nunito SemiBold, xs to md) and `Overline` (Nunito SemiBold, upper case, wide letter spacing, xs and sm, for table headings and captions). There is no monospace style, because Figma has no `ui-monospace`.
- **Effect styles** are `Elevation/light/xs` to `xl` and `Elevation/dark/xs` to `xl`, the shadow tokens as drop shadows. Their colours are the tokens' literal rgba values, because a shadow colour is not a variable.
- **Grid styles** are a convention, not a token: `Grid/mobile` (4 columns, 16 px gutter and margin), `Grid/tablet` (8, 24 and 32) and `Grid/desktop` (12, 24 and 48).

Motion (durations and easing) is documented on the Motion section of the Foundations page, not made a variable ([ADR-0236](../adr/0236-the-figma-variables-are-four-collections-primitives-semantic-with-four-theme-modes-component-and-viewport-over-one-collection-or-a-collection-per-theme.md)).

**The sync script** is `scripts/figma-sync.mjs` (private, not published, no dependencies). It reads `packages/tokens/build/tokens.json` and writes one JavaScript body per collection into `.local/figma/payloads/`, each the code of one Figma MCP `use_figma` call, plus `90-verify.js`. A payload creates or updates by name, so a rerun changes only what differs. The MCP is called by the agent, not by the script, so a token change reaches Figma by running the script and sending its payloads in order (Primitives, Viewport, Component, Semantic).

**Order:** Figma lists a collection's variables in the order they were created and has no call to move one, so the script decides the order and the payloads create in it. Scales climb (50 to 950, xs to 3xl, space 0, px, 1, 2…), colours run neutral, gray, purple, emerald, red, amber, yellow, green, blue, and a semantic group (`bg`, `text`, `border`, `icon`) lists its general tokens first, then each tone (brand, neutral, info, success, warning, danger, highlight) with its base, hover, subtle, strong and `on-` variants, then the specialised ones (code, syntax). A collection that is already in Figma in another order is rebuilt in place by `95-reorder.js`, which copies each variable with its scopes, syntax, description and values, re-points the aliases at the copies, deletes the old ones and renames the copies; this is safe only before anything is bound to a variable, because the variables get new IDs.

**Verification:** `90-verify.js` is read-only and returns, per collection, the counts, the modes, and every variable whose type, value in any mode (an alias is followed to its primitive), web code syntax or scope differs from the tokens; it also checks that the collection's order is the intended one, and it was clean for all 413 variables. Figma stores a number as a 32-bit float, so a number is compared to a millionth.

**Not in Figma as variables:** the 14 component tokens in `em`, `ch` or `%` (the `heading` trim offsets, the `link` icon sizing, the date and time picker segment widths, the table-of-contents and tags-input widths, and the command-palette tag width), which depend on the font or the parent and have no pixel value; shadows (Phase 2, effect styles); motion; the mono family is held as `ui-monospace`, which Figma has no font for.

## 6. Build rules for every component

Which components are drawn, which props become Figma properties and how big a matrix is are standing rules in [02-component-rules.md](./02-component-rules.md); the full matrix is [ADR-0237](../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md).

1. **Built from composition:** a molecule is made of atom instances, an organism of molecule and atom instances, never redrawn.
2. **Properties** (the rules are in [02-component-rules.md](./02-component-rules.md) §2): visual props (`variant`, `size`, `tone`) and states (default, hover, focus, pressed, disabled, loading, error) are variant properties, drawn as the full matrix of valid combinations; show and hide are booleans; content is text or instance-swap properties. Event handlers, refs, ARIA and controlled-state props are not modelled.
3. **Variable-bound everything:** fills, strokes, radius, padding, gap, type and effects are bound to variables or styles; there is no raw value on any layer.
4. **Auto layout everywhere**, with hug, fill and fixed set on purpose, minimum and maximum widths where the code has them, and constraints so a frame resizes correctly.
5. **Slots** for open content areas (Card body, Dialog content, Table cells, Tabs panels); the rest are nested components.
6. **Responsive:** the Viewport modes drive type and spacing; components that change shape (Navbar, Sidebar, Dialog into a sheet, Table) get a `platform` variant property.
7. **Accessibility annotations** on each spec frame: focus order, contrast of the text and edge pairings against the surface in each mode, and the target size.
8. **Dev Mode:** each finished component is marked ready for dev, with a description and a link to its Storybook page.
9. **Icons** (built, `07-icons-*.js`): the 58 Phosphor icons the component source uses (from `packages/icons`), on their own Icons page, as an instance-swappable component set with a `weight` property of bold (the library's default), regular and fill and a `tone` property of 16 values ([ADR-0238](../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)), and a size bound to the `icon-size` variables; no other icons are drawn, and the page says how to add one. Its header frame credits Phosphor Icons (MIT licence) and links to the Phosphor website, https://phosphoricons.com, where the full set can be browsed.

## 7. Phases and review gates

Each phase ends with a local checkpoint in the repository (guideline files only), a screenshot review with the maintainer and, from Phase 3 on, a variable-binding audit. No phase starts until the one before is approved; nothing is pushed without showing it first.

| Phase | Work | Done when |
|---|---|---|
| 0. Groundwork | `.local/figma.json` and its guard strings; this folder; the ADRs above written; a connection check of the file (plan, modes, fonts Nunito and Lora available) | The maintainer approves the plan; the connection check reports four modes |
| 1. Variables | The sync script, the four collections, all four themes, with counts checked against the token files | Counts match; a spot check of 20 variables in each mode |
| 2. Styles and foundations | Text, effect and grid styles; the Foundations page (an Overview frame, then a Section per topic with its frames side by side). Built 2026-11-21: every fill, stroke and size is a variable or a style, each theme or viewport is shown by setting that mode on the cell, and the page is checked for unbound values | Every foundations section matches the Storybook foundations, reviewed by the maintainer |
| 3. Look and the spec frame | Three cover concepts; the chosen one built; the spec-frame master; Getting started page; Icons set | The maintainer picks a direction and approves the spec frame |
| 4. Pilot | Button, Input, Badge and Card, end to end under §6 | The rules hold on all four; changes to §6 are made before more is built |
| 5. Atoms | Each category in turn, in the order of `../04-component-inventory.md` | Per category: a review and a clean audit |
| 6. Molecules | The same, built from the atom instances | The same |
| 7. Organisms | The same, built from molecule and atom instances | The same |
| 8. Finish | The Changelog started at the first complete published version (the Components page already holds what is not drawn); the library published to the team; ready for dev set; the publication decision (§8) | Every audit clean; the Changelog states the `@dbm-system` version the publish matches |

**Versioning rhythm:** the Changelog page is not tracked until the first complete version of the library is built and published (decided by the maintainer 2026-11-22); it says so until then. From that version a Figma library publish is tied to an npm release, and the version label in the cover's top line is updated at each publish; the Changelog page records the package version, the date and what changed in the file.

## 8. Risks, gaps and open questions

- **Layout primitives** (Box, Stack, Grid, GridItem, Center, Container, Bleed, Affix, AspectRatio, Spacer) are CSS concepts that Figma expresses as auto layout itself, not as components. Proposal: document them on the Layout page as auto-layout patterns, and build components only for Divider and the visual ones; the maintainer decides.
- **Components whose behaviour is the point** (Collapse, Backdrop, FocusTrap, SkipLink, BackToTop) are built only if they have a visual state worth drawing; the rest go on the Scope notes page.
- **Overlays** (Dialog, Drawer, Popover, Toast, Tour) are drawn as static frames in each open state.
- **Mode limits:** the four-mode Semantic collection uses the plan's whole allowance; a third brand needs a higher plan or a second collection.
- **Fonts:** Nunito and Lora must be available in the file; the connection check confirms this before Phase 1.
- **Drift:** components are drawn by hand, so a code change to a component is not reflected until the file is updated; the Changelog and a per-release check in `RELEASING.md` are the mitigation, to be decided.
- **Publication:** whether the finished file is private, a view-only link or a Community file is decided at Phase 8.
- **Keeping a spec frame from going stale (proposed, not yet decided).** Only what a person must judge is written by hand: the description, the anatomy and the accessibility notes. The rest can be generated or checked: the "not modelled" names are the manifest's props minus the ones the frame maps; the tokens-used list can be read from the variables and styles the component actually binds; the "built from" text is read from its instances; and a per-release check compares each frame with the manifest and flags a property that no longer exists in code or a prop added since. The "Built from" block, a slot listing the components nested in this one, is in the master; it can be written from the frame's instances, and the Tokens used table is read from the variables and styles the component binds. Other candidates: a version stamp on each frame, set at each publish, and fixed accessibility lines (pattern, keyboard, target size, contrast per mode) so none is skipped.
- **Nothing in Figma updates itself when the code changes.** The components are drawn by hand, so a change to a component in code reaches Figma only when someone updates its frame. The tokens are one-way from the repository but not automatic either: they reach Figma when `scripts/figma-sync.mjs` is run and its payloads are sent. What keeps the file honest is the per-release check, and, once tracking starts at the first published version, the Changelog page and the version stamp, which show what is out of step. Code Connect, deferred, would link a component to its code but would not redraw it.
- **Code Connect and RTL** are deferred, not dropped.
