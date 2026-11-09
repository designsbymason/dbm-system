# Marketing Page — review findings

**Tier:** Template (a story-only example page, [ADR-0179](../adr/0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md) and [ADR-0184](../adr/0184-a-story-only-template-page-is-a-folder-of-stories-and-a-story-kit-in-templates-with-demo-controls-and-no-playground-over-a-shipped-component-or-a-separate-pages-tree.md)) · **Category:** Data pages · **Finalized:** not yet (the maintainer's to declare)

Planned 2026-11-08 with `/plan-template`, approved by the maintainer with the recommendation on every decision. It is the "Marketing or public page" row of `04-component-inventory.md`, built as a recipe: a page on `PageShell` that an app copies. It follows the [Documentation Page](DocumentationPage.md).

## Decisions
- **Kind and place:** a story-only example page in `src/templates/MarketingPage/`, titled `Templates/Data pages/Marketing Page`, tagged `example-page`, not exported.
- **Composition only:** `PageShell` with a `Navbar` whose links hold a `NavigationMenu` (a `Navbar.Links` already tells an embedded `NavigationMenu` how to look), `PageShell.Content` sections in three widths (a hero contained, features contained, a call-to-action band with `bleed`, a full-width strip with `width="full"`), `Grid` and `Card` for the features, a footer of columns of `Link`s in a `Grid` inside `PageShell.Footer`, and `BackToTop`. No part is drawn by hand beside a component that does it.
- **Demo:** a static product page (hero, three features, a proof strip, a call to action, a footer of four columns), with demo controls, not a Playground. No router; the copy is in one place.
- **Responsive:** the viewport. The header's panels are the `NavigationMenu`'s on a desktop and the `Navbar`'s menu panel on a phone; the features reflow from three columns to one; the footer's columns wrap. The page never scrolls sideways.
- **States matrix:** the page only (a marketing page is static). Selection and a destructive confirm do not apply.
- **Behaviour:** the `NavigationMenu`'s panels open by hover, click and keys, and `Escape` closes one and returns focus to its trigger; the skip link goes past the header to `main`; the phone menu opens and closes with the keyboard.
- **Landmarks:** one `banner`, the header's named `navigation`, one `main` with named `section`s where they matter, one `contentinfo` holding named `navigation`s for its columns; one `h1`.
- **Checks planned, each broken once to see it fail:** the landmark tree; the layout at phone, tablet and desktop widths with no page overflow; a `NavigationMenu` panel by a real click and real keys; the phone menu by real presses; the edge-to-edge bands (a `bleed` band's content lines up with the page); a hydration and `StrictMode` test; print; forced colours; the snippets typechecked as real code (from its `MarketingPage.snippetScope.txt`).
- **Registrations:** a `07` §6 row, this file, the `04` row (built as a page, with the "Marketing or public page" row marked as built as this recipe), and the `example-page` tag.
