# AppShell — review findings

First template, built 2026-11-04 under [ADR-0179](../adr/0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md) with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized**: that is the maintainer's to declare.

## Decisions
- Compound `AppShell` with `AppShell.Header`, `.Sidebar`, `.Main` and `.Footer`; layout and wiring only. The `Sidebar` and `Navbar` go in the slots with every prop they already have, so nothing is duplicated or hidden.
- A two-column CSS grid placed by named areas, so the markup order does not change the layout. The sidebar's column is `auto`, and the sidebar is `display: none` below its own `collapseBelow` step, so its column vanishes on a phone with no media query in the shell. `sidebarSide="end"` swaps the columns.
- `scroll="content"` (default) fits the frame to `100dvh` and scrolls only `<main>`; `scroll="page"` lets the page scroll and leaves sticking to `Navbar`'s and `Sidebar`'s own `sticky`.
- The shell renders the `Sidebar.Provider`, so its state props (`collapsed`, `menuOpen`, `collapseBelow`, `labels` and the handlers) are the shell's, and a `Sidebar.MenuButton` in the header reaches the sidebar's panel.
- `<main id="main" tabindex="-1">`, matching `Navbar.SkipLink`'s default `#main`. No ring is drawn on it, since it is not a control.
- No new token: `bg.surface`, `text.primary` and `font-family.primary`.

## What was found while building it
- **The preview wraps every story in padding, `fullscreen` or not.** The global decorator in `preview.tsx` pads every story by `space-6` with a 100vh minimum, so a page-level template could never fill the window (a real-browser check measured the document 48px taller than the window and the main area 48px narrower than a phone). Fixed with an opt-in `parameters.fullBleed`, which every existing story ignores.
- **Markup order is tab order.** With the sidebar first in the markup, the first tab stop was the sidebar's first link, not the skip link. Documented and demonstrated: `AppShell.Header` goes first, and the layout is unchanged because the slots are placed by area.
- **`bg.canvas` is not the page colour.** Its description reserves it for the demo container, and `text.tertiary` fails on it; `bg.surface` is "page, card, sheet and drawer background", so that is what the frame uses.
- **A skip link with a real `href="#main"` closes the test browser** when a check presses Enter on it (the page's address changes under the runner). The demo's link moves focus itself and cancels the navigation, as the `Navbar` demos do.
- **A docs-only frame is needed.** On a Docs page a shell as tall as the window would fill the page, so the demo draws it in a 36rem box when `viewMode` is `docs`. The Docs page's contents list was checked: the demo page's own headings do not enter it.
- **ADR-0179 said the shell would take its own `labels`.** It draws no text, so it has none; the `labels` it accepts are the sidebar's. The ADR's detail is amended in place.

## Checks run
- Unit and axe (jsdom): landmarks once each, the skip link and the focus target, a custom main id, a main-only shell, the data attributes, the menu button opening the panel through the shell's provider, the controlled collapsed handler, refs and passthrough, axe on the default and on the page-scroll, end-edge and right-to-left variants; a server render with `window` and `document` removed.
- Real browser (Chromium, hidden checks): desktop, tablet and phone layouts at pinned viewports (which assert the window width first), the sidebar at the end edge, right to left, the skip link by real keys, the page-scroll mode, and forced colours (system `Canvas`, same scroll behaviour). Breaking the stylesheet (main no longer scrolling) failed the desktop and forced-colours checks.
- Real input in the browser pane: Tab then Enter on the skip link focuses `<main>` with no ring and no page scroll; a real click on the phone menu button opens the panel.
- The whole package's lint, type checks (components and Storybook), unit tests, build, Storybook tests and the Storybook bundle size budget. The one Storybook failure, `FieldFocusRing` > `Textarea`, is the known local flake and passes alone.

## Not verified
- **The native fragment jump.** The skip link was exercised through the demo's handler; a real `href="#main"` navigation moving focus to `<main>` was not run in a browser.
- **A real phone.** The phone width was emulated in Chromium. The address bar's collapsing on iOS and Android, which is what `dvh` is for, was not tried on a device or in Safari or Firefox.
- **Dark mode and the Emerald brand** were not looked at; the shell adds one pairing, `text.primary` on `bg.surface`, which the token spec already measures.
- **`scroll="page"` with sticky parts** is checked for its layout (the frame grows and the page scrolls) but not for a sticky `Navbar` and `Sidebar` together staying in place through a long scroll.
- **Right to left was measured, not read**: the check asserts which edge each part is on; nobody has looked at it.
- **A wide table's push on the frame** is not caught by removing `minmax(0, 1fr)`, because `min-inline-size: 0` on the slots covers the same case; the two guards are redundant by design.
