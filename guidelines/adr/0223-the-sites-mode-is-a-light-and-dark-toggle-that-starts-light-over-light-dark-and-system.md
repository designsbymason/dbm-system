# 0223 — The site's mode is a light and dark toggle that starts light, over light, dark and system

**Status:** Accepted · **Date:** 2026-11-16 · Supersedes the mode part of [ADR-0173](./0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)

## Context
The site offered light, dark and system mode, defaulting to the system's setting, and shared the choice with Storybook through one key on the origin ([ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)). The maintainer wants the first visit to be light and the control to be a simple toggle.

## Decision
- **A first visit is light.** The header's mode control is a toggle between light and dark, remembered, and shared with Storybook as before.
- A stored "system" from before this change is read as light or dark once, then replaced by the toggle's choice.

## Alternatives considered
- **Light, dark and system, defaulting to system.** Follows the reader's setting, but the first impression changes with it.
- **Light default with three choices.** Keeps system for those who want it, at the cost of a menu instead of a toggle.

## Consequences
- The mode menu becomes an icon button that toggles.
- Storybook's Mode toolbar keeps light and dark, which already match.

## Related
`guidelines/docs-site/02-structure.md` §1 and §4.
