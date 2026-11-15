# Link

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-07

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component. `Link` came into
this review already well-built (full JSDoc, 14 passing tests, deliberate WCAG 1.4.1 reasoning
already documented for the `underline` default) — the gaps found were narrower than a typical
first pass. Findings, in the order fixed (Playground-missing first, Docs-page-missing last, per
the standing reporting convention):

1. **Playground story added.** `Link.stories.tsx` previously had six stories, all using a bare
   `render: () => (...)` that ignored `args` entirely — no prop was ever live/interactive. Added a
   full interactive `Playground` plus `argTypes` for every prop, and gave each of the six existing
   stories (now seven, with `Disabled` added — finding 4 below) `control: false` on every prop they
   don't actually drive, matching the established "no single value a control could represent"
   treatment for fixed-render galleries.

2. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `Link.types.ts` with
   their own JSDoc (previously only worked structurally via the native `ComponentPropsWithoutRef<"a">`
   extension, invisible to the Properties table per the confirmed Button/Code/Blockquote/Highlight/Kbd
   docgen gap). Also newly redeclared: `target`, `rel`, `download` (native anchor attributes central
   to Link's own auto-external logic, not just generic passthrough — per the "commonly-relevant
   native props" audit established via Input) and `aria-label`/`aria-labelledby` (component-relevant
   for an interactive atom, per `05-component-api-conventions.md` §3).

3. **`AsChild` story (and its matching unit test) composed onto a `<button>`, which has no `href`
   semantics at all — a real, misleading example fixed, not just a docgen gap.** `asChild`'s actual
   real-world use is composing onto a router's own Link component (which itself renders an `<a>`),
   so the demo target should be something `href` means something on. Fixed both to compose onto a
   real `<a>` instead (mirroring `Button`'s own established `asChild`-story precedent of using a
   real anchor) — this required a scoped, justified `eslint-disable-next-line
   jsx-a11y/anchor-is-valid` on the child anchor (it intentionally has no literal `href` in source;
   Radix `Slot` merges `Link`'s own `href` onto it at render time — verified directly, not assumed,
   via a dedicated test asserting the merged `href` value). Confirmed live: `href` merges correctly
   from the outer `Link` onto the plain child anchor.

4. **Feature-completeness — real gap, discussed and closed at explicit direction (not silently
   added): some comparable production `Link` components have a `disabled` prop; DBM's `Link` had
   none.** Flagged as a named, concrete comparable-library gap per the guardrail in
   `06-engineering-standards.md` §9;
   the user chose to close it. Implemented as `aria-disabled` plus a click-handler guard — `<a>` has
   no native `disabled` attribute at all (unlike `Button`, which can rely on a real `<button>` in
   its own default, non-`asChild` case), so this is unconditional regardless of `asChild`, closer to
   `Tag`'s own "no native-element branch to special-case" precedent than `Button`'s
   `asChild`-conditional one. The link stays focusable and its `href` stays present, matching
   WAI-ARIA APG guidance for `aria-disabled` (verified live in a real browser via `dispatchEvent`
   returning `false`, confirming `preventDefault()` fires — not just asserted in a unit test).
   Visual treatment (`cursor: not-allowed`, `opacity.40`) deliberately mirrors `Button`'s own
   `.disabled` class exactly, including *not* using `pointer-events: none` — that would suppress the
   `not-allowed` cursor it depends on, confirmed by reading `Button.module.css`'s own precedent
   rather than reinventing the treatment.
   - This also required restructuring the component's JSX prop order — `{...props}` moved to spread
     *first*, with `href`/`target`/`rel`/`aria-disabled`/`onClick`/`className` applied after, so a
     caller-supplied `aria-disabled`/`onClick` can't silently win over the computed ones (the same
     ordering rule already fixed on Button/Skeleton/ProgressBar/etc., `05-component-api-conventions.md`
     §3) — previously safe only by accident, since every computed prop happened to already be
     destructured out before `disabled` added two genuinely new computed attributes.
   - A `Disabled` story added (`"Disabled (aria-disabled, click blocked)"`).

5. **Hardcoded, non-token CSS values found and fixed: `.icon`'s `margin-inline-start: 0.25em` /
   `vertical-align: -0.125em`.** Neither traced to a token, a real "zero hardcoded values" gap
   (`CLAUDE.md`). Deliberately **not** converted to an absolute `space.*` token like `Button`/`Tag`'s
   own icon spacing (`gap: var(--dbm-space-*)`) — `Link` inherits its font size from surrounding
   context rather than owning a size scale, so the icon's offset needs to scale proportionally with
   whatever text size it sits in, which an absolute px token can't do. Resolved via the established
   Component-layer token pattern instead (`component/link.json` — `link.icon-offset-inline`,
   `link.icon-vertical-align`, both em-relative `dimension` tokens) — the sixth instance of this
   pattern (Avatar/Badge/IconButton/Indicators/Heading precede it) and the first to use it for a
   relative rather than absolute value, proven safe by Heading's own `trim.*` tokens already going
   through the same pipeline. See `03-token-system-spec.md`'s own "Component-layer tokens" section
   for the full entry.

6. **Unit tests extended**: added coverage for `style`/`id`/`data-testid`/`download`/`aria-label`
   passthrough, an explicit `target`/`rel` override test, and a full `disabled` describe block (no
   `aria-disabled` by default, `aria-disabled` present without losing tab order, click blocked with
   and without `asChild`, still fires normally when not disabled, zero axe violations when
   disabled). 25/25 passing (up from 14).

7. **Docs page added** (`Link.mdx`), full 10-section template, first in the sidebar group. Hit and
   fixed a real, previously-undocumented MDX landmine along the way: a backslash-escaped quote
   inside a `TokenRow`'s `usage` attribute (`underline=\"hover\"`) crashed the entire Storybook dev
   server's story index (`Unexpected character \` in attribute name`) — exactly the documented
   "MDX doesn't support backslash-escaped quotes inside JSX attributes" gotcha in
   `07-storybook-and-documentation-standards.md` §4.1, confirmed live via the actual crash, not just
   inferred from the doc. Fixed by switching to single quotes; the dev server needed a full restart
   (not just a reload) to fully recover its story index afterward, and a stale browser tab's own
   console-message buffer briefly looked like an ongoing failure even after the real fix — resolved
   by verifying in a fresh tab, not by trusting a stale one. Live-verified after recovery: TOC
   renders all 10 section headings, Properties table renders all 15 props in the declared order
   with non-empty descriptions and correct value-option pills (`external`/`underline`/`asChild`),
   both `RelatedCard`s (`Text`, `Button`) render live previews with correct links (`Button`'s own
   preview needed a real `href` on its child anchor, unlike `Link`'s own `asChild` story, since
   `Button` doesn't inject `href` the way `Link` does), zero console errors, both brand themes ×
   both modes confirmed (every token `Link` uses — `text.link`, `border.focus`, `font-family.primary`,
   `link.icon-*`, `opacity.40` — is brand-agnostic, so appearance is identical Purple vs. Emerald),
   mobile viewport spot-checked (the "Inline within body text" story wraps cleanly).

8. **Shared-infrastructure bug found and fixed post-review (2026-09-07, same day, user-reported):
   `RelatedCard`'s preview slot let its own live content independently navigate away from the Docs
   page.** `Link.mdx`'s "Text" card renders a real `<Link href="/docs">`; its "Button" card renders
   a real `<Button asChild><a href="/next">`. Both are genuinely clickable — clicking directly into
   either (not the card itself) navigated the whole Docs page to that route (nonexistent in
   Storybook's static build, so a blank/404 page), bypassing the card's own name/description link
   entirely. This is `.storybook/blocks/RelatedCard.tsx` itself, not `Link.mdx` — a shared block
   every component's Docs page uses, so the fix applies universally, not just here. `Link` is simply
   the first component whose own preview happens to contain a real, working destination (most
   previous previews — `Badge`, a non-removable `Tag`, `Code` — have no navigable/actionable default
   action for a plain click to trigger). Root cause: the preview slot's own div was deliberately left
   a plain, non-`<a>` container (already documented in the block's own comment, to avoid invalid
   nested-anchor HTML — a *different*, earlier-fixed bug) but was never actually made inert to
   clicks reaching whatever real interactive element it renders. Fixed with the `inert` HTML
   attribute on the preview slot — blocks both pointer clicks *and* keyboard Tab-then-Enter
   activation (a `pointer-events: none`-only fix would have missed the keyboard case, since native
   click-activation on a focused element doesn't route through pointer-events at all). Verified live
   with a real simulated mouse click (not a JS-invoked `.click()`, which — confirmed directly —
   bypasses `inert` entirely since it isn't a real hit-tested user event): clicking directly into
   either preview now does nothing, while clicking the card's own name/description still navigates
   correctly. Spot-checked on `Tag.mdx`'s own two interactive-preview cards (a `Badge`, a `Button`)
   to confirm the fix doesn't regress an existing Docs page — both correctly `inert`, full opacity,
   no visual side effect. `tsc`/`eslint` clean; not a shipped-package change (`.storybook/**` is
   dev-only tooling, `06-engineering-standards.md`'s dependency/bundle-size budget doesn't apply).

9. **Real correctness bug found during a dedicated final re-verification pass (2026-09-07, same
   day): `disabled` didn't actually block a click handler declared directly on the `asChild`
   child.** Only found by testing the scenario empirically, not by re-reading the code — the
   original bubble-phase `onClick` guard passed every existing test (none of which put an `onClick`
   directly on the slotted child itself, only on `Link`), so this was invisible to the test suite
   until specifically probed. Root cause: Radix `Slot` composes bubble-phase `onClick` handlers with
   the slotted child's own handler running *first*, then `Link`'s own guard — by the time `Link`'s
   guard ran and called `preventDefault()`, a child's own `onClick` (e.g. a router's navigation call)
   had already fired. Confirmed directly with a throwaway test asserting the child handler was
   *not* called — it failed, proving the bug, before any fix was written. Fixed by moving the guard
   from `onClick` to `onClickCapture` — capture-phase handlers run before *any* bubble-phase handler
   regardless of `Slot`'s own composition order, verified with two separate throwaway tests (one
   through `Slot`, one on a plain native element with both handlers as sibling props) before
   applying the fix for real. A permanent regression test was added
   (`"blocks a click handler declared directly on the asChild child, not just one passed to Link
   itself"`). The observable public behavior/API is unchanged — this is an internal mechanism fix,
   not a prop or default change. **Recorded as a standing rule** in
   `05-component-api-conventions.md` §3 (the `disabled` pattern bullets) — added during this
   session's own guidelines audit, 2026-09-07, so a future `asChild`-supporting component doesn't
   rediscover this the same way.

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0` (whole package), full `vitest`
unit suite (1014/1014 passing across the whole package, 26/26 for `Link` itself), `tsup` build,
`check-foundations-token-coverage` (no new semantic color tokens — `link.icon-*` are primitive
dimension tokens, outside that check's scope; still in sync), and `check-component-bundle-size`
(1.08KB JS / 0.59KB CSS gzipped — comfortably within budget) all run and passing. Live-verified in
Storybook: the `AsChild` story's `href`-merging behavior confirmed live (not just in the unit
test); the `Disabled` story's click-guard confirmed live via a real `dispatchEvent` call returning
`false`, re-confirmed again after the capture-phase fix (finding 9); the Playground's
`external`/`aria-label`/`children` controls confirmed to genuinely drive the canvas; both brand
themes × both modes and mobile viewport spot-checked; the mid-review MDX crash (finding 7) was
fully recovered from and re-verified clean in a fresh browser tab; the `RelatedCard` fix (finding
8) was verified with a real simulated mouse click, not a JS-invoked one, after confirming the two
behave differently with respect to `inert`.

## Finalized

**2026-09-07** — confirmed by the user after the full checklist was verified end to end, including
a dedicated final re-verification pass that found and fixed one more real bug (finding 9, the
`onClickCapture` fix for a click handler declared directly on an `asChild` child) before sign-off:
baseline correctness, feature-completeness (the `disabled`-prop gap named and closed at
explicit direction), accessibility (jest-axe zero violations, including the disabled state),
responsiveness (mobile viewport spot-checked), design quality, theming (both brand themes × both
modes, confirmed brand-agnostic as expected), Storybook documentation (Docs page, Properties table,
Design Tokens table all consistent — including recovery from a mid-review MDX crash), a
shared-infrastructure fix (`RelatedCard`'s preview slot made `inert`, benefiting every other
component's Docs page too), and functional verification (`tsc`, `eslint`, full 1014-test suite,
`tsup` build, bundle-size and foundations-token-coverage checks all clean). No further changes
without asking first, per `06-engineering-standards.md` §9's finalization rule.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the earlier atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: the Playground printed `aria-label="" disabled={false} external={false} underline="always"`, and the seven gallery panels showed the story object itself, each with a six-entry `argTypes` block — "asChild" also with a development note and an `eslint-disable` comment that belong in the story file, not in what a reader pastes. Every story now sets `parameters.docs.source.code` to a snippet from the new `Link.snippets.ts`, and the Playground builds its own from the live controls, writing `external` only where it changes what the `href` would auto-detect (`external` for a path, `external={false}` for a URL). The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Post-Finalization change (2026-10-20, at explicit direction) — `size`, and an icon that scales with the text

[ADR-0108](../adr/0108-link-takes-an-optional-size-that-replaces-the-inherited-font-size-and-its-external-icon-is-the-size-of-the-text-over-a-fixed-icon-or-a-size-that-always-applies.md). Two changes, classified by `06-engineering-standards.md` §9's test:
- **`size` is additive** (an optional prop with no default, so a link with none is exactly as before): it stays Finalized, with its own mini-pass: JSDoc and types, the Properties row, a story and its snippet, the Playground control (with "inherit" as the Playground's own choice), the Docs section and token rows, unit tests for every class and for `asChild`, and a hidden real-browser check that an unsized link takes its paragraph's size and a sized one the token's.
- **The external icon now scales with the text** (one to one with the text: `link.icon-scale`, 1em; it was first built one step of the type scale smaller, 0.833em, and made the size of the text at the maintainer's direction). That changes what an existing link renders, a preference change inside `Link`'s own files, so the sections it touches were re-verified: design quality (the icon beside 12px, 16px and 24px text, and its offset and nudge against the scaled glyph), theming (it follows `currentColor`, so there is nothing theme-specific), responsiveness (a size that changes with the viewport carries the icon with it) and the Docs. It also reaches the other components that draw a `Link` (`Breadcrumb.Link`, `TableOfContents`, `Form.Summary`): their external links, where they have any, get the same icon; their own tests pass unchanged.
- **Checks:** 9 more unit tests and a real-browser check that measures the icon's drawn width at the size of its link's own font size, inherited and set (the first version of the check read the icon's font size, not its box, and passed while the box stayed 20px: found when the prop was tried in the Playground); the whole library's suites pass (9,178 unit, 1,979 browser).
- **Not looked at:** a `Breadcrumb` with an external link in a running Storybook after the change.

## The external-link icon and cue drawn inside an `asChild` element, 2026-11-15 (additive; stays Finalized)

At explicit direction ([ADR-0218](../adr/0218-an-aschild-component-draws-its-own-icons-spinner-and-caption-inside-the-slotted-element-with-radix-slottable-over-dropping-them-or-asking-the-consumer-to-put-them-in-the-child.md), adopted here): with `asChild`, an external link's icon and its visually hidden "(opens in a new tab)" cue are drawn inside the slotted element, after its own content, with Radix `Slottable`. They were dropped before, so a router's link that left the site opened a new tab with no warning to a screen reader user: an accessibility gap, fixed first. A non-external `asChild` link is unchanged. The `asChild` JSDoc and the Docs say so; a new story, "asChild, external", checks the icon, the cue and the target inside the one anchor; two unit tests replace the one that asserted no icon.
