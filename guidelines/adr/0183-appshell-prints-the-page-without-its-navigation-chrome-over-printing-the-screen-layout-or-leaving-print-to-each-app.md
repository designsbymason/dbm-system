# 0183 — AppShell prints the page without its navigation chrome, over printing the screen layout or leaving print to each app

**Status:** Accepted · **Date:** 2026-11-06

## Context
The shell is a pinned layout: a frame as tall as the window, a main area that scrolls inside its box, and a header, banner, footer, sidebar and aside that stay in view. Measured in a real browser with the print media type emulated, nothing about it changed for print: the main area kept `overflow: auto` inside a box shorter than its content (so a printout shows only what fits the box), the sidebar and the aside took columns of the paper, and the sticky parts sat where they stick on a screen.

## Decision
- **A print stylesheet in the shell's own CSS** (`@media print`): the frame is one column and as tall as its content; the main area is laid out in full (`overflow: visible`, height from its content); the sidebar, the aside, the skip link, the busy bar, the resize handle and the aside toggle are not printed; the banner, the header and the footer stay, once each and in order, as ordinary rows (no sticky or fixed placement, no shadow).
- **`!important` is used in that block, and only there**, because print must win over every screen rule whatever its specificity (the measured, sticky and per-mode ones), and an app that wants a part printed overrides it the same way.
- **Left to the app:** the page's own content (page breaks, a table's repeating header, hiding its own controls).

## Alternatives considered
- **Print the screen layout:** cuts off the main area's content and spends a third of the paper on navigation.
- **Print the aside too:** an inspector or contents pane is secondary to the page, and paper is narrow; an app that wants it removes the rule.
- **A `printable` prop per part:** more API for a default that is right for nearly every page.
- **Leave print to each app:** every app would have to find and override the pinned layout, and most would not.

## Consequences
- A printed AppShell page reads as a document. Two real-browser checks (print media emulated, cleared afterwards) guard it, and breaking each rule makes its check fail.
- A shell given a later part (a toolbar, a bottom bar) must say what it does in print.
- The print block is the one place the stylesheet uses `!important`.

## Related
[ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0181](./0181-appshell-owns-the-sidebars-collapsed-state-and-width-to-add-an-automatic-rail-a-remembered-layout-and-a-resize-handle-over-leaving-them-to-the-sidebar-and-the-app.md), `component-reviews/AppShell.md`.
