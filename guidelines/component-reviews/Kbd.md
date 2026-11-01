# Kbd

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-07

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `Kbd.stories.tsx` previously had only `Default` and `A keyboard
   chord`; now has a full interactive `Playground` with every prop wired through `args`/
   `argTypes`. **A real, confirmed bug found and fixed along the way:** the newly-added
   `aria-label` control initially rendered as an inert "Set string" placeholder — the same
   "arg left undefined → inert control" failure mode documented in
   `07-storybook-and-documentation-standards.md` §5 — since `aria-label` has no true component
   default. Fixed by giving the Playground story its own explicit `args: { "aria-label": "Escape"
   }`; re-verified live afterward, both the control and the rendered `aria-label` attribute.

   **Follow-up (same day, user-reported): the same bug also affected `Default` and `A keyboard
   chord`.** The initial fix only covered `Playground`; `aria-label` still showed "Set string" on
   the other two stories since neither gave it an explicit `args` value either. Fixed per-story,
   not uniformly, since the two needed different treatments:
   - `Default` (implicit, args-driven render): given `args: { "aria-label": "" }` — a live,
     editable but blank control, matching the `06-engineering-standards.md` §9 convention for a
     prop with no natural demo value ("kept non-nullish so its own control stays interactive"),
     and accurately reflecting that a readable word like `"Esc"` doesn't need one. Verified
     directly against this project's own `jest-axe` tooling that an empty `aria-label` produces
     zero violations and falls back to the text content as the accessible name (per the WAI-ARIA
     accname spec, an empty `aria-label` is treated as absent) — the Storybook Accessibility addon
     panel itself couldn't be used to confirm this live, since it requires `test:storybook:watch`
     running alongside the dev server (`guidelines/adr/0003`), not available in this session.
   - `Chord` (custom `render` hardcoding two different literal values — `⌘` has
     `aria-label="Command"`, `K` has none): `aria-label`'s control disabled (`control: false`)
     alongside `children`'s already-disabled one, rather than given a fake `args` value that
     wouldn't actually drive the canvas either way — the same "no single value a control could
     represent" treatment already established for static multi-instance galleries
     (`07-storybook-and-documentation-standards.md` §5). Confirmed live: both props now render
     "–" instead of an inert placeholder.

2. **`children` prop had no JSDoc at all** — fixed, now documented in `Kbd.types.ts`.

3. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `Kbd.types.ts` with
   their own JSDoc (previously only worked structurally via the native
   `ComponentPropsWithoutRef<"kbd">` extension, invisible to the Properties table per the confirmed
   Button/Code/Blockquote/Highlight docgen gap).

4. **`aria-label` redeclared — a genuine, Kbd-specific accessibility gap, not just a
   documentation-visibility fix.** `Kbd` commonly renders symbol-only content (`⌘`, `⇧`, `⌥`, `⌃`),
   which Unicode glyphs alone aren't reliably announced by screen readers — there was previously no
   documented pattern for labeling them. `aria-label` is now an explicit, JSDoc'd prop
   (`Kbd.types.ts`), the component's own JSDoc explains when to use it, the `Chord` story's `⌘` key
   now demonstrates it (`aria-label="Command"`), and the Docs page's Accessibility section covers it
   as its own callout rather than a generic "no ARIA needed" note.

5. **`argTypes` added** to the stories file for every prop, with real descriptions and appropriate
   controls.

6. **Unit tests extended**: added coverage for `style`/`id`/`data-testid` passthrough and a new
   `aria-label` test (`getByLabelText("Command")` resolving to the `⌘` key). 9/9 passing (up
   from 6).

7. **Feature-completeness:** compared against comparable production `Kbd` components — all are
   equally minimal (no `size`/`variant` prop), so no gap to close. Confirmed, rather than assumed,
   that `Kbd`'s fixed (non-inheriting) font size is the correct, deliberate choice distinct from
   `Code`'s inherited one — a keycap should read as a constant-size visual regardless of context,
   the same way a physical key doesn't resize with the sentence around it. This distinction wasn't
   previously documented anywhere; added to the component's own JSDoc and the Docs page's Best
   practices section so it reads as an intentional design decision, not an unexplained
   inconsistency with `Code`.

8. **`border-width.2` added to the Design Tokens table, found during the final re-verification pass
   (2026-09-07, same day).** `Kbd`'s bottom-edge box-shadow — arguably its single most distinctive
   visual feature, the "raised keycap" effect called out in the Docs page's own Intro paragraph —
   uses `border-width.2` for its offset, but the token wasn't listed. Compared against precedent
   across other finalized components (Badge, Avatar, CloseButton, IconButton, Switch, Tag, Checkbox,
   Indicators, Input, Textarea, Spinner) confirmed the standing convention: `border-width.2` gets
   its own row whenever it plays a distinguishing role (a focus ring, a separating ring, a stroke
   width) rather than being an incidental default border — `border-width.1`'s own plain 1px border
   usage stays unlisted, matching `Code`'s own precedent (the most directly comparable sibling,
   which also omits it for the same reason). Fixed by splitting the existing `border.neutral` row's
   usage text (color vs. offset are two different tokens) and adding the missing row; re-verified
   live, renders correctly with no console errors.

9. **Docs page added** (`Kbd.mdx`), full 10-section template, first in the sidebar group.
   Live-verified: TOC renders all 10 section headings, Properties table renders all 6 props in the
   declared order with non-empty descriptions, both story canvases render real content, both
   `RelatedCard`s (`Code`, `Text`) render live previews with correct links, zero console errors,
   both brand themes × both modes confirmed (every token `Kbd` uses — `bg.surface`,
   `border.default`, `border.neutral`, `text.secondary` — is brand-agnostic per
   `03-token-system-spec.md`, so appearance is identical Purple vs. Emerald, confirmed via
   `dataset.theme` rather than assumed).

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0` (whole package), full `vitest`
unit suite (1002/1002 passing across the whole package, 9/9 for `Kbd` itself), `tsup` build,
`check-foundations-token-coverage` (no new semantic color tokens — `border-width.2` is a primitive
dimension token, outside that check's scope; still in sync), and `check-component-bundle-size`
(0.19KB JS / 0.22KB CSS gzipped — comfortably within budget) all run and passing. Live-verified in
Storybook: the `aria-label` inert-control bug (finding 1) was reproduced live before fixing and
re-verified live after, across all three stories that carry it (`Playground`, `Default`, `Chord`)
— both the control itself and the resulting DOM attribute; the Playground's `children` control
confirmed to genuinely drive the canvas (typed "Enter", canvas updated live); the keycap's raised
bottom-edge shadow effect spot-checked in both light and dark mode and at mobile viewport width
(reads cleanly in all); the `Chord` story's two `Kbd`s render correctly with `aria-label` present
only on the symbol key, confirmed again across Emerald/Dark; Docs page verified end to end per the
checklist in `07-storybook-and-documentation-standards.md` §4.1 (including the `border-width.2`
fix from a dedicated final re-verification pass that re-read every file fresh), zero console errors
throughout.

## Finalized

**2026-09-07** — confirmed by the user after the full checklist was verified end to end, including
a dedicated final re-verification pass that found and fixed one more real gap (finding 8, the
missing `border-width.2` Design Tokens row) before sign-off: baseline correctness,
feature-completeness (confirmed against comparable production `Kbd` components, no gap to
close), the `aria-label` accessibility addition (including a user-reported follow-up fix to the
`Default`/`Chord` stories' own inert controls), responsiveness (mobile viewport spot-checked),
design quality (the keycap's raised bottom-edge shadow effect verified across light/dark and at
mobile width), theming (both brand themes × both modes, confirmed brand-agnostic as expected), and
functional verification (`tsc`, `eslint`, full 1002-test suite, `tsup` build, bundle-size and
foundations-token-coverage checks all clean). No further changes without asking first, per
`06-engineering-standards.md` §9's finalization rule.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the earlier atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: the Playground printed `aria-label="Escape"`, Default printed an empty `aria-label=""`, and "A keyboard chord" showed the story object itself with a seven-line development note about its controls inside it. Every story now sets `parameters.docs.source.code` to a snippet from the new `Kbd.snippets.ts`, and the Playground and Default build theirs from the live controls, writing an `aria-label` only when there is one. The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Post-Finalization addition (2026-11-01, at explicit direction): `keys`
`keys` (a string such as `"mod+shift+p"`, or an array) draws a combination for the platform: ⌘ ⇧ P on an Apple platform, Ctrl + Shift + P elsewhere, one keycap per key and no plus on an Apple platform. The key table is the one `CommandPalette` draws its shortcuts from, moved to `internal/hotkey/shortcutKeys.ts`; the platform is read through a store with a server snapshot, so the server render and the first client render agree ([ADR-0164](../adr/0164-menubar-gets-a-controller-opt-in-hotkeys-an-action-part-disabled-reasons-platform-drawn-shortcut-hints-a-sticky-option-an-overflow-menu-and-a-trigger-icon-over-leaving-each-to-the-app.md)). `children` became optional (it is not needed with `keys`, and is ignored, with a development warning, if both are given).
- **Purely additive** (the three-question test of `06` §9, step 1: no change to anything that existed), so `Kbd` stays Finalized; the new surface got its own pass: JSDoc, a story and a snippet, the Docs page, eight unit tests (both platforms, an array, the name, the override, both props, empty keys, axe) and its `space.1` gap token row.
- **Found:** a bare `<kbd>` can't carry an `aria-label` (axe: `aria-prohibited-attr`), so a combination is a `role="img"` group with its keycaps hidden from assistive technology, named "Command Shift P" or "Ctrl Shift P".
- Not verified: a screen reader's announcement of the group.

