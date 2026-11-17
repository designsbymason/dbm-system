# Radio — Storybook/component review findings

**Inputs:** Radio — initial build + full `06-engineering-standards.md` §9 review pass complete
(2026-09-14), built from scratch as the first item in the itemized molecule-tier build order
(`04-component-inventory.md`), split out of the former combined `RadioGroup / Radio` inventory row
per [ADR-0012](../adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md).

**Architecture decision (asked, not guessed) — Radix has no standalone single-radio primitive.**
Unlike `Checkbox`/`Switch`, which each wrap their own standalone Radix Root, Radix only ships
`@radix-ui/react-radio-group` (Root + Item + Indicator), and `Item` requires a `Root` ancestor to
function at all (confirmed by reading the installed package's own compiled source, not assumed).
Presented three options to the user before writing any code: (A) a self-wrapping dual-mode atom —
`Radio` always renders Radix's real `Item`/`Indicator`, silently wrapping its own private
single-item `Root` when no ambient group context is present, exposing a boolean
`checked`/`onCheckedChange` API standalone and participating in a real shared group's own
`value`/`onValueChange` when composed inside one; (B) a native-`<input>`-based atom with no Radix
dependency at all, `RadioGroup` implementing its own separate Radix-wrapping internals; (C) accept
a narrower atom bar for this one pair, documented as an exception. **Chose (A)** — most faithful to
[ADR-0012](../adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)'s own
"renders/functions correctly standalone" bar. Full record, including the rejected alternatives'
reasoning and what this constrains for `RadioGroup`'s own build:
[ADR-0014](../adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md).

**Cross-tier coordination signal.** A small `RadioGroupContext` (plain boolean, default `false`)
lives in `Radio`'s own folder (`RadioGroupContext.ts`) and is not exported from the package barrel
— internal coordination only. `RadioGroup` (molecule, not yet built) will provide `true` around
every `Radio` it renders. Mirrors the cross-tier context pattern already established between `List`
(owns `ListMarkerContext`) and `ListItem` (reads it) per the same ADR — here the ownership
direction is inverted only because `Radio` was built first; the ADR's own reasoning ("no lint rule
enforces tier-import direction") applies the same either way. Tests exercise the grouped code path
via a self-contained harness (Radix's own `RadioGroupPrimitive.Root` + this context set to `true`)
since `RadioGroup` doesn't exist yet — noted in the test file for revisiting once it does.

**Real Radix API shape verified from source, not memory** — read the installed package's own
`.d.mts` directly before writing prop-forwarding code: `Root` owns `name`/`form`/`required`/
`value`/`defaultValue`/`onValueChange`; `Item` owns `value` (required) + its own `disabled`, and
explicitly excludes `name`. This resolved exactly which props belong on the self-wrapped `Root`
(`name`, `form`, `required`) vs. the `Item` (`value`, `disabled`) — got wrong on the first pass
otherwise (see the two test fixes below, both caught by actually running the tests rather than
assumed correct).

**Radio-specific semantic distinction from `Checkbox`, documented explicitly:** clicking an
already-checked `Radio` never unchecks it — real radio-button semantics (the only way to change a
selection is choosing a different option), unlike `Checkbox`'s toggle behavior. Covered by its own
test and interaction story (`ClickInteraction`), and called out in the component's own JSDoc,
`RadioProps.checked`'s doc, and the Docs page's Usage guidelines.

**Two test-writing mistakes caught by actually running the tests, not assumed correct:**
1. `aria-required` when `required` is set lands on the wrapping `role="radiogroup"` div (the
   standalone self-wrapped `Root`), not on the `role="radio"` button — confirmed by reading Radix's
   own compiled source (`RadioGroup`'s own `Primitive2.div` render call sets
   `"aria-required": required` directly). Test fixed to query `getByRole("radiogroup")`.
2. A single simulated `ArrowDown` press didn't reliably reproduce Radix's real
   auto-select-on-arrow-focus behavior in jsdom (a genuine browser-only event-ordering dependency
   in Radix's own implementation, traced to `document.addEventListener` firing after React's
   synthetic bubble handling completes for the same event) — the test was rewritten to assert what
   the roving-tabindex mechanism guarantees regardless of that timing quirk: focus moves via arrow
   keys, and Space (WAI-ARIA-guaranteed) selects the focused item. Not a Radio bug — Radix's own
   internal behavior, worth flagging here in case a future `RadioGroup` test hits the same jsdom
   quirk.

**Dev-mode warnings, mirroring `Checkbox`'s own "fail loud" precedent (`06-engineering-standards.md`
§3):** (1) no accessible name (no `children`/`aria-label`/`aria-labelledby`); (2) standalone-only
props (`checked`/`defaultChecked`/`onCheckedChange`/`name`/`required`/`form`) passed while grouped
— these have no effect there, the ambient group owns all of them; (3) no `value` passed while
grouped — every `Radio` in a group needs a distinct one to be told apart from its siblings.

**Visual design:** circular (`radius.full`), sized from the same `icon-size.*` scale `Checkbox`
uses so the two read as a matched pair at any shared size — unlike `Checkbox`'s checkmark icon,
checked state renders a plain CSS-drawn dot (40% of the box, `icon.on-brand`) rather than an
`Icon`-rendered glyph, since a filled dot has no icon-swap use case the way Checkbox's
check/indeterminate glyphs do. Full brand fill on checked (not just a ring), matching Checkbox's
own filled treatment for family consistency. Focus-ring `border-radius` already inherits `full`
from the circular root, so no separate override was needed (unlike Button's square case,
`05-component-api-conventions.md` §6).

**Self-verification, whole package, all real runs (not "looking right"):**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1534/1534 passed (37 for `Radio` itself, standalone + grouped-harness)
- Vitest `storybook` (browser-mode play-function/a11y) project: 392/392 passed
- `tsup` build: clean, all four output targets
- `pnpm audit`: no known vulnerabilities (new `@radix-ui/react-radio-group` dependency included)
- `check-component-bundle-size`: Radio 1.07KB JS / 0.61KB CSS gzipped, within budget, in line with
  peer atoms (`Link`, `ProgressBar`)
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all 10 sections, TOC, Playground live,
  Properties table), `All sizes`/`States`/`Without a label`/`Inside a RadioGroup (preview)` variant
  galleries, zero Accessibility-panel violations (checked directly on the grouped-mode story), all
  4 themes (Purple/Emerald × Light/Dark) — checked-state fill and dot color read correctly in every
  combination, mutual exclusivity confirmed live by clicking between grouped options
- Confirmed sidebar placement: **Atoms → Inputs → Radio**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Post-review fix (user-reported, 2026-09-14): phantom "RadioProps" sidebar story.** `Radio.stories.tsx`
had ended with `export type { RadioProps };` — a leftover, never actually consumed by `Radio.mdx`
(which only needs plain string arrays for `propOrder`). Storybook's static CSF indexer scans a
`.stories.tsx` file's AST for named exports and treats each one (besides `default`) as a story
candidate, including a type-only export, which its static parse sees *before* Vite/esbuild strips
it away at build time — producing a phantom sidebar entry (`RadioProps` → id `radio-props`) that
pointed at nothing once the module was actually imported at runtime, hence "Couldn't find story
matching id ... after importing a CSF file." Fixed by removing the unused export (and its now-dead
`import type { RadioProps } from "./Radio.types"`) — confirmed live in Storybook (sidebar search for
"RadioProps" returns no matches) and via a full re-run: `tsc`, `eslint --max-warnings 0`, both
Vitest projects (`unit`: 1534/1534, `Radio` itself 37/37) all clean. A pure defect fix — no
behavioral/API change to `Radio` itself, so this doesn't touch Finalization readiness. **General
takeaway, worth checking on future components:** never add a `.stories.tsx` export "just in case" a
`.mdx` might want to import it later — an unused export in a story file isn't just dead code here,
it's a real, user-visible broken sidebar entry.

**Interaction-story pacing fix (user-reported, 2026-09-14): "Interaction: focusable and toggles via
Space" ran too fast to watch.** Added the same `pause` helper already used in `Collapse`'s/`Tooltip`'s/
`FocusTrap`'s own interaction stories — 600ms after focus lands, 800ms after the Space-triggered
check completes — purely for human legibility replaying the story in the Interactions panel; the
assertions themselves need none of it. Confirmed live (rewatched the replay, step timing now
visible) and via a full re-run: `tsc`, `eslint`, both Vitest projects (`unit`: 1534/1534, `storybook`
browser-mode: 392/392) all clean.

**Design revision (user-requested, 2026-09-14): checked-state style changed from filled to
outline+dot.** Previously: full `bg.brand` fill, `icon.on-brand` (white) dot, `bg.brand-hover` fill on
hover. Now: `bg.surface` stays unchanged (not filled), `border.brand` ring (unchanged on hover too —
explicit rule added so the unchecked `:hover` rule, which ties on specificity, doesn't win and flash
the border back to neutral), `icon.brand` dot. Both new token pairings were already verified against
`bg.surface` in `03-token-system-spec.md`'s own contrast log (`border.brand`: 7.37:1 purple / 6.08:1
emerald light, 7.45:1 / 8.51:1 dark; `icon.brand`: same figures) — genuinely the same pairing Radio
already sits on, not a new one requiring fresh measurement. Deliberately **did not** add a hover
background tint (e.g. `bg.brand-subtle-hover`, the pattern `Button`'s own `secondary` variant uses for
an outline-style control) — out of scope for what was asked, and would have introduced an unverified
`icon.brand`-on-`bg.brand-subtle-hover` contrast pairing; flagging here in case a hover treatment is
wanted later. `Radio.mdx`'s Design tokens used and Accessibility sections updated to match. Confirmed
live across all 4 themes (Purple/Emerald × Light/Dark) and zero Accessibility-panel violations; full
re-run: `tsc`, `eslint`, both Vitest projects (`unit`: 1534/1534, `storybook`: 392/392) all clean.

**Design revision (user-requested, 2026-09-14): checked-state dot enlarged.** `.indicator`'s
`height`/`width` moved from 40% to 50% of the root's own box — a proportional size, not a new
component-layer token, so it scales correctly across every `size` step with no per-step values to
keep in sync. Confirmed live across the full `xs`–`xl` size scale (still a clearly visible ring at
every step, `xs` included) and zero Accessibility-panel violations. Full re-run: `eslint`, Vitest
`unit` project (`Radio`: 37/37) clean.

**Final review pass (2026-09-14, at explicit user request before Finalization).** Re-read every
file fresh end to end (`Radio.tsx`, `Radio.types.ts`, `Radio.module.css`, `Radio.stories.tsx`,
`Radio.mdx`, `Radio.test.tsx`, `RadioGroupContext.ts`, `index.ts`) rather than assuming the four
incremental post-build fixes above already covered everything — same discipline as `Checkbox`'s own
final pass, which found two more real gaps by re-checking. Found and fixed two real, if minor,
gaps:
1. A stale code comment in `Radio.stories.tsx`'s `AllSizes` story still said "the filled state is
   visible" — left over from before the checked-state style revision above. Fixed to "the checked
   state is visible."
2. `Radio.mdx`'s Design tokens used section was missing `space.1` (used for the focus-visible
   outline's `outline-offset` in `Radio.module.css`) — every other token the CSS actually references
   is listed, this one was simply missed. Added. (Noted for context, not fixed here: `Checkbox` —
   already Finalized — has the identical omission for its own equivalent `space.1` usage; a
   pre-existing, cross-component documentation gap, not something this pass introduced. Worth a
   future audit across already-shipped components, out of scope for Radio's own review.)

One hypothesis raised and disproven by live verification, not acted on: `checked` has
`control: false` in `Radio.stories.tsx`'s `argTypes` but isn't in `PlaygroundControls`' own
`exclude` list (unlike `Checkbox`'s equivalent list, which does include it) — reading the code alone
suggested this might render a stray "–" row in the Playground panel, the exact failure mode
`07-storybook-and-documentation-standards.md` §4 item 2 warns about. Checked live instead of trusting
the static read: no such row appears (`PlaygroundControls` only renders rows for props actually
present in the resolved `args` object, and `checked` isn't one of them) — `Checkbox`'s inclusion of
"checked" in its own exclude list is defensive/redundant, not required. No change made.

Also deliberately **not** added: a Playwright real-browser visual-regression test for the new
checked-state colors. `e2e/visual.spec.ts`'s own doc comment states it "isn't meant to cover every
story for every component from day one," and `Checkbox` (twice-reviewed, Finalized) has zero entries
there despite also using brand-colored borders/fills — that suite is opportunistic, added only when
a genuine jsdom-unverifiable defect is found (e.g. Button's `var()`-in-border-shorthand limitation),
not a standing requirement per component. Live Storybook verification across all 4 themes already
satisfies the Theming checklist item.

Full self-verification, whole package, real runs: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` project (1534/1534) and `storybook` browser-mode project
(392/392), `tsup` build (clean, all four targets), `check-component-bundle-size` (Radio still within
budget). Docs page re-verified live end to end, section by section (Playground, Properties table,
all 4 variant galleries, Usage guidelines, Best practices, Accessibility, Code examples, Design
tokens, Related components) — no other gaps found.

**Finalized 2026-09-14, at explicit user direction**, following the final review pass above. Per
`06-engineering-standards.md` §9's own rule, no further changes to `Radio` (code, stories, docs, or
tokens it alone drives) without asking first, even for something that would otherwise be an obvious,
in-scope fix. `RadioGroup` (the molecule that will actually compose `Radio` for real, instead of the
test/story harness used throughout this review) is next in the build order.

**Authorized post-finalization change (user-directed, 2026-09-14): size-cascade support.** While
building `RadioGroup`, its own review flagged a real gap rather than improvising: no way for a
`RadioGroup` to set `size` once for every `Radio` child, since building that meant editing this
already-Finalized file. User confirmed the gap live (toggling nothing changed a grouped `Radio`'s
size without repeating it on each one), then authorized the change. Added a new, separate
`RadioGroupSizeContext` (`RadioSize | undefined`) — kept apart from the existing `RadioGroupContext`
boolean rather than changing its shape, so that already-tested contract stays untouched — and
changed `size`'s resolution from a plain destructuring default (`size = "md"`) to a fallback chain
(`size ?? inheritedSize ?? "md"`), read via the new context.

**Three-question finalization test (`06-engineering-standards.md` §9):**
1. *Does it change the rendered/behavioral output of anything that already existed at finalization
   time?* No. `RadioGroupSizeContext`'s default value (no `Provider` ancestor) is `undefined`, so
   every previously-existing usage — standalone `Radio`, and the `Inside a RadioGroup (preview)`
   story's own harness (predates this context, provides no size) — resolves through the exact same
   chain to the exact same `"md"` default as before. No prop's default changed, no existing DOM
   output changed under any previously-exercised value.
2. Not reached — question 1 already resolved to "No."
3. Not reached.

**Result: stays Finalized** — purely additive, per the "No" branch. New surface (the inherited-size
behavior) still got its own scoped mini-pass rather than skipping straight to "no re-review needed":
JSDoc updated on both the component doc and `size`'s own prop doc, 4 new tests (standalone default
regression, inherits from context, own explicit value wins, falls back to `"md"` when grouped with
no inherited size either) — 37 → 41. Storybook coverage lives on `RadioGroup`'s own stories (the
natural real-world composition surface for a cross-component feature — see
[RadioGroup.md](RadioGroup.md)), not duplicated into `Radio`'s own, which already covers the
underlying resolution logic at the unit-test level. Full re-verification, whole package: `tsc`,
`eslint --max-warnings 0`, Vitest `unit` (1569/1569) and `storybook` browser-mode (400/400) projects,
`tsup` build, `check-component-bundle-size` (`Radio` 1.09KB JS / 0.59KB CSS, still within budget) —
all clean.

## Post-Finalization follow-up (2026-11-17, at explicit direction) — the circle's edge clears 3:1

The unchecked circle is identified by its edge alone, and `border.neutral` was 2.32:1 on `bg.surface` in the two light themes, under the 3:1 that WCAG 1.4.11 asks of a
control's boundary. The resting edge is now `border.neutral-strong` (4.70:1 on the surface in the light themes, 6.08:1 in the dark ones) and the hover edge `border.strong`
(6.88:1 and 10.47:1), read back from the rendered control in a real browser in all four themes. The checked and error edges are unchanged. The same change as `Checkbox`
([Checkbox.md](./Checkbox.md)); a defect fix (question 2 of the three-question test, `06-engineering-standards.md` §9) at explicit direction: the component stays Finalized.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the first seven atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: all five generated snippets spelled out defaults and empty placeholders with a no-op `onCheckedChange`, and **"Inside a RadioGroup (preview)" printed Radix internals** — `<React.ForwardRef onValueChange={() => {}}>` around `<React.Context value>` — because the story hand-wired a Radix `RadioGroupPrimitive.Root` and the package's internal `RadioGroupContext`, from before the `RadioGroup` molecule existed. Its own comment said it should be rewritten once `RadioGroup` was built. **That story is now rewritten to use the real `RadioGroup`** (labelled, with the same state), its `(preview)` suffix is dropped from the story name and the Docs heading, and the now-unused Radix and context imports are removed. Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `Radio.snippets.ts`, and the Playground builds its snippet from the live controls (always writing the `value` a radio means). The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.
