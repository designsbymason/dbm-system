# RadioGroup — Storybook/component review findings

**Inputs & Forms:** RadioGroup — initial build + full `06-engineering-standards.md` §9 review pass
complete (2026-09-14), the second item in the itemized molecule-tier build order
(`04-component-inventory.md`), immediately after `Radio` (its own prerequisite atom, Finalized the
same session).

**Architecture: exactly the design [ADR-0014](../adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md)
anticipated.** `RadioGroup` wraps Radix's real `RadioGroupPrimitive.Root` and provides
`RadioGroupContext` (imported cross-tier from `../../atoms/Radio/RadioGroupContext`, the same
inverted-ownership pattern ADR-0012 already blessed for `List`/`ListItem`) as `true` around its
`children` — every `Radio` composed inside then participates in this real, shared group instead of
self-wrapping its own private one. No new coordination code needed on `Radio`'s side; the context
signal was built for exactly this during `Radio`'s own review.

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable. `RadioGroup` composes plain
  `Radio` atoms as ordinary `children` (mirroring `List`/`ListItem`'s shape), not a dot-notation
  compound pattern (`RadioGroup.Item`) — there's no sub-part of `RadioGroup`'s own to check.
- **Atom-reuse audit** — `RadioGroup` renders no radio-option markup of its own at all; every
  option is a real, consumer-supplied `Radio`. Nothing to reimplement.
- **Consumed-atom defect handling** — none found. All 27 tests passed on the first run; `Radio`'s
  grouped-mode behavior worked exactly as designed with no follow-up fix needed on either side.
- **Radix-primitive prop audit** — every `RadioGroup.Root` prop from Radix's own real API (read
  from source during `Radio`'s own build: `name`, `form`, `required`, `disabled`, `orientation`,
  `dir`, `loop`, `value`, `defaultValue`, `onValueChange`) is redeclared on `RadioGroupProps` with
  full JSDoc, using `dir?: "ltr" | "rtl"` matching `Select`'s own established naming precedent
  rather than inventing a new `rtl: boolean` (caught and corrected during the build itself, not
  after).
- **Cross-part ARIA/id wiring** — not applicable in the sense `FormField` will need later
  (composing a label/control/helper-text triplet with auto-wired ids); `RadioGroup` composes
  multiple same-type `Radio` options, not distinct labeled parts. The group's own accessible name
  is left to the consumer (`aria-label`, or `aria-labelledby` pointing at a nearby `FieldLabel`),
  matching Radix's own unopinionated Root (no auto-rendered legend).
- **Composed tab order** — real roving-tabindex verified: `Tab` reaches only the checked (or
  first) option, arrow keys move focus *and* selection between the rest, `loop` (default `true`)
  wraps from last back to first — all covered by dedicated tests and a live interaction story,
  not just reasoned about.

**Layout: `RadioGroup` owns the gap between options**, not left to the consumer to hand-supply
(matching `List`'s own "container owns shared layout" role) — `space.2` vertical (the default
`orientation`), `space.2`/`space.4` row-gap/column-gap horizontal (wrapping via `flex-wrap` for
narrow viewports, so a long horizontal option set degrades to multiple rows rather than
overflowing).

**`hasError` is purely semantic (`aria-invalid` on the group), no visual treatment** — unlike
`Input`/`Textarea`/`Checkbox`/`Radio`, a bare `RadioGroup` has no bordered box of its own for a red
outline to live on; the visual error communication is expected to come from a paired `FieldError`
(future `FormField` territory), not a new box-drawing convention invented here without precedent.

**Named, concrete gap — flagged, then authorized and built (user-directed, 2026-09-14):** a
`size`-cascade feature (`<RadioGroup size="sm">` setting every child `Radio`'s size at once,
instead of repeating `size` on each one) was flagged rather than built during the initial pass,
since it meant editing the already-Finalized `Radio.tsx`. User confirmed, live in the Playground,
that per-`Radio` sizing was the only option without it, then authorized the change. Implemented via
a new, separate `RadioGroupSizeContext` (`RadioSize | undefined`, default `undefined`) — kept apart
from the existing `RadioGroupContext` boolean signal rather than changing that one's shape, so its
already-tested contract stays untouched. `RadioGroup` provides its own `size` prop through this
context; `Radio` resolves `size ?? inheritedSize ?? "md"`, so an explicit `size` on either side still
wins in the expected order and the fallback (`"md"`) is unchanged for every case that existed
before this feature. Added a dedicated `size` argType/control, a new `SizeCascade` variant story
(group-level size plus a per-item override, both visibly distinct), and `RadioGroup.mdx` updated
(`propOrder`, intro paragraph, Best practices, Code examples) to match. Full three-question
finalization test applied to `Radio` (`06-engineering-standards.md` §9) — see
[Radio.md](Radio.md)'s own entry; **`Radio` stays Finalized**, purely additive.

Self-verification, both components, all real runs: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` project (1569/1569 whole package; `Radio` 41/41, `RadioGroup`
30/30) and `storybook` browser-mode project (400/400), `tsup` build, `check-component-bundle-size`
(`Radio` 1.09KB JS / 0.59KB CSS, `RadioGroup` 0.67KB JS / 0.15KB CSS, both still within budget).
Live-verified: the `SizeCascade` story (three visibly distinct sizes, zero Accessibility-panel
violations, both Light and Dark) and the Playground's own live `size` control actually resizing the
canvas in real time.

**Post-review fix (user-reported, 2026-09-14): `size`/`dir` controls showed literal "undefined."**
Both argTypes used a plain `options: [undefined, ...]` array with `args` left `undefined` —
Storybook's `select` control renders that as the literal text "undefined" instead of a meaningful
value. **First attempt (wrong, corrected the same turn):** read this as "these props have no
concrete default," and mapped a `Default` label to `undefined` (the `Checkbox.stories.tsx`
icon/indeterminateIcon pattern) — user clarified that wasn't the intent: they wanted the control to
start at the component's actual real default value, not an abstract "no override" concept, i.e.
`size` should show `"md"` and `dir` should show `"ltr"` (both real, concrete `RadioSize`/`"ltr"|"rtl"`
values, not synthetic labels). **Corrected to match `Select.stories.tsx`'s own existing `dir`
control exactly** (`options: ["ltr", "rtl"]`, `args.dir: "ltr"`, no `undefined` anywhere) and applied
the identical pattern to `size` (`options: ["xs","sm","md","lg","xl"]`, `args.size: "md"`) — plain,
real values, no mapping/cast needed. Confirmed live: both the raw Controls panel and the Docs page's
`PlaygroundControls` show "md"/"ltr" directly. A pure Storybook-presentation fix — doesn't touch
`RadioGroup`'s actual rendered output or ARIA, so no accessibility re-check needed. Full re-run:
`tsc` (package + `.storybook`), `eslint`, Vitest `unit` (31/31 for `RadioGroup`'s own two test
files) and `storybook` browser-mode (400/400) — all clean.

**Final review pass (2026-09-14, at explicit user request before Finalization).** Re-read every file
fresh end to end (`RadioGroup.tsx`, `RadioGroup.types.ts`, `RadioGroup.module.css`,
`RadioGroup.stories.tsx`, `RadioGroup.test.tsx`, `RadioGroup.mdx`, `index.ts`) rather than assuming
the prior incremental fixes already covered everything — same discipline as `Radio`'s own final
pass. Found and fixed four real gaps:
1. `orientation`'s JSDoc still said "(see `rtl` for that)" — stale, left over from before that prop
   was renamed to `dir` during the initial build (per `Select`'s own precedent). Fixed to reference
   `dir` correctly.
2. `dir`'s JSDoc said it "defaults to the ambient document direction" — inaccurate. Verified against
   Radix's own installed source (`@radix-ui/react-direction`): `useDirection` only reads a React
   context (`DirectionProvider`), never the actual browser `document`/`<html dir>` attribute, falling
   back to a hardcoded `"ltr"` if no such context exists. Reworded both the JSDoc and — since the
   rendered Docs-page Properties table turned out to source its text from `RadioGroup.stories.tsx`'s
   own separately-authored `argTypes.description` strings, not the JSDoc directly — the story file's
   own `orientation`/`dir` descriptions too, so the same correction is what a reader actually sees,
   not just what ships in the type declarations.
3. No unit test asserted the `.error` CSS class (the left-border accent) is actually applied when
   `hasError` is true — only `aria-invalid` was checked. Added a dedicated test, matching
   `Indicators.test.tsx`'s own established precedent for this class of state-class assertion.
4. No unit test asserted `dir` actually renders as a real DOM attribute. Added one.

Also live-verified two combinations that had never been checked together before: `hasError` +
`orientation="horizontal"` (the border accent and the row layout coexist cleanly, zero violations),
and `hasError` + `orientation="horizontal"` + `dir="rtl"` together (confirmed the border accent
correctly moves to the physical *right* edge in RTL, since it's built with the logical
`border-inline-start` property rather than a hardcoded `left` — proving the RTL implementation is
genuinely correct, not just untested; option order also correctly mirrors). Zero Accessibility-panel
violations in both cases.

Full re-verification, whole package: `tsc` (package + `.storybook`), `eslint --max-warnings 0`,
Vitest `unit` (1571/1571 whole package; `RadioGroup` 33/33) and `storybook` browser-mode (400/400)
projects, `tsup` build, `check-component-bundle-size` (`RadioGroup` still within budget) — all
clean. No other gaps found.

**Self-verification, whole package, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1561/1561 passed (27 for `RadioGroup` itself)
- Vitest `storybook` (browser-mode play-function/a11y) project: 399/399 passed
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: RadioGroup 0.64KB JS / 0.11KB CSS gzipped, within budget, in line
  with peer lightweight molecules (`Grid`)
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all 10 sections, Playground live,
  Properties table), `Vertical vs. horizontal`/`States`/`Controlled, with a live selection summary`
  variant galleries, all three interaction stories (click-to-select, arrow-key navigation +
  Space-to-select, disabled-blocks-every-option) replayed and confirmed `PASS`, zero
  Accessibility-panel violations across every story checked, all 4 themes (Purple/Emerald ×
  Light/Dark) — checked-state fill/border/dot colors and layout both orientations read correctly in
  every combination, mutual exclusivity and the controlled live-summary both confirmed by clicking
- Confirmed sidebar placement: **Molecules → Inputs → RadioGroup**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Post-review fix (user-reported, 2026-09-14): `States` story had a visual duplicate and a missing
real state.** Two real gaps in the same story, found by direct question rather than by this review's
own pass: (1) the "Error state" row rendered pixel-identical to "Default" — `hasError` only sets
`aria-invalid` on `RadioGroup` (no CSS hook applies any visual treatment, by the same deliberate
"no bordered box to color" reasoning documented above), so showing it alone in a *visual* states
gallery demonstrated nothing. Fixed by pairing that row with a real `FieldError` underneath — which
is also the actual documented, correct real-world usage (this component's own Usage guidelines
already say to pair `hasError` with `FieldError`), not just a workaround to make the row look
different. (2) No row showed the group with nothing selected at all — every row set
`defaultValue="email"`. Added a "No selection" row. Confirmed live (5 visually distinct rows now,
zero Accessibility-panel violations) and via a full re-run: `tsc`, `eslint`, both Vitest projects
(`unit`: 1561/1561, `storybook`: 399/399) all clean.

**Design decision (user-directed, 2026-09-14): `hasError` gained a real visual treatment — a
colored left-border accent.** Follow-up to the `States`-story fix above: live-testing the Playground
surfaced that toggling `hasError` alone (no paired `FieldError` in that story) produced zero visible
feedback, reading as broken rather than "semantic-only by design." Presented three options
(a full visual treatment built into the real component; semantic-only with a `FieldError` paired
into the Playground too; documentation-only) — user chose the real component treatment, then asked
specifically whether it would be a Storybook-only skin or shipped in the actual package (confirmed:
the latter — Storybook only ever renders the real, shipped component). Presented five concrete
options grounded in general accessible-forms/enterprise-UI practice for flagging a *group* of
controls (no bounded box to color, unlike `Input`): a left-border accent, a full bounding border
(with a real layout-shift trade-off), a background wash, an outline (avoids that trade-off), and
cascading `hasError` to each child `Radio`'s own already-existing error ring (blocked by the same
Finalized-`Radio`-authorization issue as the `size`-cascade gap noted above). **User chose the
left-border accent** — real, direct precedent already in this codebase (`Blockquote`'s own
`border-width.4` + `space.4` inline-start pairing), mirrored here with `border.danger` in place of
`border.brand`. No new tokens needed; `border.danger` against `bg.surface` was already
AA-contrast-verified for this exact pairing. `RadioGroup.types.ts`'s `hasError` JSDoc,
`RadioGroup.mdx`'s Accessibility callout, and its Design tokens used section all updated to match.
Confirmed live: toggling `hasError` in the Playground now shows the accent immediately (no paired
`FieldError` needed to see *some* feedback, though one is still recommended for the full message);
the `States` story's error row now shows the accent *and* the `FieldError` together; zero
Accessibility-panel violations; `border.danger` renders correctly (and stays brand-agnostic red, by
design) across all 4 themes. Full re-run: `tsc` (package + `.storybook`), `eslint`, both Vitest
projects (`unit`: 1561/1561, `storybook`: 399/399), `tsup` build, `check-component-bundle-size`
(RadioGroup 0.65KB JS / 0.15KB CSS gzipped, still within budget) — all clean.

**Finalized 2026-09-14, at explicit user direction**, following the final review pass above. Per
`06-engineering-standards.md` §9's own rule, no further changes to `RadioGroup` (code, stories,
docs, or tokens it alone drives) without asking first, even for something that would otherwise be
an obvious, in-scope fix. With `Radio` and `RadioGroup` both Finalized, all three review-first
molecules (`Grid`, `List`, `Select`) plus these two are done; `CheckboxGroup` (item 1 in the
itemized build order, `04-component-inventory.md`) is next, followed by `FormField`.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: identical to `CheckboxGroup`'s — spelled-out defaults (`loop`, `hasError={false}`, `name=""`), a no-op handler, the demo wrapper, and a frozen "Controlled" example. Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `RadioGroup.snippets.ts`; the Playground builds its snippet from the live controls (`loop` written only when off, `dir` only when `rtl`). All snippets and Playground combinations were typechecked against the real types (the controlled ones with the real `useState` lines, so the state handlers' types were checked too). **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`; with none, nothing changes (the page's direction, or a Radix `DirectionProvider`, still applies as before). The `dir` JSDoc, the Controls description and the Docs text say so; a test covers it. Finalized status is unchanged.
