# ToggleGroup

**Tier:** molecule · **Category:** Inputs & Forms · **Status:** built 2026-09-26; **Finalized 2026-09-26**, declared by the user after the final review pass recorded below, with one known item left as it is (see "Finalized" at the end).

## What was built

A compound component (`ToggleGroup` + `ToggleGroup.Item`), item 19 in the itemized molecule build order (`04-component-inventory.md`): a segmented control over Radix `ToggleGroup`. One new dependency, `@radix-ui/react-toggle-group` (the Radix interaction layer already approved in `02-tech-stack-and-structure.md`). No new token and no component token.

Group props: `type` (`single` default, or `multiple`), `value` / `defaultValue` / `onValueChange` (a string for single, an array for multiple), `deselectable` (single only), `variant` (`subtle`, `outlined` default, `solid`), `size` (`xs`–`xl`, default `md`), `rounded`, `attached` (default `true`), `orientation` (or a breakpoint map through `useResolvedResponsiveValue`), `fullWidth`, `disabled`, `loop`, `dir`, `aria-label` / `-labelledby` / `-describedby`, `id`, `className`, `style`, `data-testid`. Item props: `value`, `children`, `icon`, `disabled`, `asChild`, `aria-label` / `-labelledby`, `id`, `className`, `style`, `data-testid`.

## Decisions taken while building

Both were chosen by the user before the build.

- **The items have their own segmented-control look**, not `Button`s in a context ([ADR-0025](../adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md) covers the ButtonGroup case only): variants are named as `Tabs` and `Tag` name theirs (`subtle`, `outlined`, `solid`), sizes match `Button`'s heights through the `icon-button.size.*` tokens, and the layout (fused or spaced, row or column, breakpoint map) matches `ButtonGroup`. No Finalized atom was touched.
- **A single group keeps one item chosen once it has one; `deselectable` opts back in** (default `false`). Radix's single group lets the chosen item be clicked off, so the component always controls the value internally and ignores the empty string unless `deselectable`.
- **Roles are Radix's, and are not overridable:** single is `role="radiogroup"` of `radio` items (`aria-checked`), multiple is `role="toolbar"` of toggle buttons (`aria-pressed`). `role` and `data-orientation` are applied after the consumer's rest props (the props-ordering bug class from earlier reviews).
- **`dir` is a prop, passed to Radix and defaulted to `ltr`,** not read from the page.
- **Attached looks:** inner corners squared with logical properties, bordered variants overlap by `border-width.1` so neighbours share one line, the chosen item sits above its neighbours (`z-index.base`) so its brand border isn't hidden, and the focus ring is drawn inside the item (`outline-offset` of minus `border-width.2`), in `icon.on-brand` on a chosen solid item, so a neighbour never hides it and it reads on the fill (the remedy `05` §6 names, and the one the ButtonGroup review left open).
- **A spaced row wraps; an attached one never does.** Nothing moves or resizes when the choice changes in any variant.

## Verification (2026-09-26)

- **Unit** (`ToggleGroup.test.tsx`, 52): roles and names, the no-name warnings (group once, each unnamed icon-only item), ref and attributes, `role` and `data-orientation` not overridable, single (default, click, one stays chosen, `deselectable`, controlled, parent state), multiple, keyboard (one tab stop, arrows, loop, Home/End, Space/Enter, disabled skipped, vertical, right-to-left), disabled, layout classes and the breakpoint map, items (icon, icon-only, attributes, ref, `Tooltip` with `asChild`), `StrictMode`, and jest-axe across every look, orientation, right-to-left, multiple and icon-only.
- **Real browser** (`storybook` project, 8 hidden `!dev` stories): corner radii in a row, a column, right-to-left, a pill, a spaced group and a group of one; per-variant fill and border colours resolved from tokens, shared one-line borders, the chosen item's `z-index`, and that choosing moves nothing; the focus ring inside an attached item (and in the on-brand colour on a chosen solid one), outside a spaced one; 24 × 24px targets at every size, both orientations, labelled and icon-only; equal shares with `fullWidth`, a column's uniform width, one height for a mixed row, the spaced gap, wrapping when spaced and not when attached; a breakpoint map stacking on a phone-width viewport; the keyboard order in left-to-right and right-to-left. **Broken on purpose, each seen to fail:** no overlap, ring offset outside, no chosen `z-index` (the last one was not caught until a `z-index` assertion was added).
- **Playground snippet** guarded in `src/storySnippets.test.ts` (real-snippet check, defaults omitted, starting choice per type, `deselectable` only for single, invalid values ignored, item count clamped); every static snippet is picked up by the same file's automatic check and typechecked against the real components with real icons.
- **Whole pipeline:** `pnpm lint`, `pnpm build`, all 3,065 unit tests, all 760 real-browser tests, the Playwright visual suite (8/8), the static Storybook build and its size check, the component size check, token coverage, and `pnpm audit`.
- **Live:** the Docs page renders with no errors, 22 Properties rows with the right defaults and value options, and the `ToggleGroup.Item` table.

**Not verified at build time** (done in the final review below): the group visually, dark mode and Emerald, hover, a 320px viewport, and contrast. Still not verified: a real screen reader.

## Final review, 2026-09-26

A full `06-engineering-standards.md` §9 pass, checked against the code and the running component (screenshots of every look in Purple light, Purple dark and Emerald dark, every size, hover and focus, right-to-left, and a 320px viewport; contrast measured from the resolved tokens in all four themes).

**Fixed in the pass (one)**

1. **An item's `role` and `aria-checked` / `aria-pressed` could be replaced by a same-named prop.** The group's own `role` was already guarded, but the item was not: `<ToggleGroup.Item role="tab">` turned a radio into a tab (found with a probe). The item now drops the three props before spreading and the type omits them. One unit test covers single and multiple groups; it fails without the fix (checked). The Docs page's own claim about the group's `role` is unchanged.

**Verified, nothing to change**

- Text contrast passes AA in all four themes: `text.secondary` on the surface 6.9–10.5:1, `text.brand` on `bg.brand-subtle` 5.8–8.3:1 (4.6:1 on its hover fill, Emerald dark), `text.on-brand` on `bg.brand` 6.1–8.5:1.
- **The focus ring on a chosen solid item, left open in the ButtonGroup review and in the build's own notes, is fine:** `icon.on-brand` on `bg.brand` is 6.1–8.5:1, and an unchosen item's `border.focus` ring is 4.2–6.5:1 on the surface and 4.0–7.2:1 on `bg.brand-subtle`. Because it is drawn inside the item, it never crosses a neighbour's fill.
- `border.neutral` on the surface is 2.3:1 in light mode (3.0:1 dark): the accepted decorative border (`03-token-system-spec.md`), the chosen item being marked by more than that border.
- No hardcoded value, no `any`, JSDoc on every prop, no `window`/`document` at render, `StrictMode` tested, one tab stop, targets at least 24 × 24px, screenshots clean in every look, size, theme and at 320px.

**Left for a decision** (one fixed since, one left as it is)

- **A single group is a `radiogroup`, but the arrow keys moved focus without choosing.** Fixed at explicit direction the same day: see "Fixed after the pass" below.
- **The `subtle` look marks the chosen item faintly.** Its fill is `bg.brand-subtle` (about 1.1:1 against the surface in dark mode) and its text changes from `text.secondary` to `text.brand`, both readable; the state is exposed as `aria-checked` either way. `Tabs`' subtle look is the same, and `outlined` and `solid` mark it with a border or fill.

**Gaps and limitations, recorded and accepted** (none blocks; each is named so nobody re-derives it)

- **Items follow the group's `variant` and `size`;** an item can't be a different look, and has no trailing icon, badge, count or second line.
- **No form participation.** Neither type renders a hidden input, so a group doesn't submit a value the way `RadioGroup` does; wire it through `onValueChange`. Values are strings.
- **A single group can start with nothing chosen** (no `defaultValue`); `deselectable={false}` only stops clearing it.
- **Duplicate item `value`s are not detected:** two items sharing one both show as chosen (probe). No dev warning.
- **Radix's `rovingFocus` switch is not exposed,** so the items can't be made individual tab stops.
- **No sliding indicator between items:** the choice changes colour only.
- **An attached row can't wrap** and overflows a narrow container as one box (stack it with an `orientation` map, or space it). `dir` is a prop, not read from the page.

**Whole pipeline after the pass:** `pnpm lint`, `pnpm build`, all 3,066 unit tests, all 761 real-browser tests, the visual suite (8/8), the component size check (`ToggleGroup` 1.79KB JS, 1.13KB CSS gzipped), `pnpm audit` unchanged. Not verified: a real screen reader.

## Fixed after the pass, 2026-09-26: a single group chooses as the arrow keys move

At explicit direction. Radix's toggle group moves focus with the arrow keys, `Home` and `End` and leaves the choice to `Space` or `Enter`; a single group announces itself as a `radiogroup`, where the arrows also choose. A single group now does: the root notes (in its capture-phase key handler) that a navigation key went down, and the item that then takes focus chooses itself through the group's context. Only a key does it, so tabbing into a group with nothing chosen, or clicking, chooses nothing extra; the flag can't be cleared on key-up because Radix moves focus in a later task, so it is cleared by the item that takes focus, or when focus leaves the group (a key that moved nowhere, at the end of a group with `loop` off). A modifier key (Alt, Ctrl, Meta) doesn't count. `type="multiple"` is untouched (its arrows only move focus). `dir="rtl"` and a vertical group follow, since they follow the keys Radix already maps. The consumer's own `onKeyDownCapture`, `onBlur` and item `onFocus` still run.

Unit tests (57, from 53): the arrows, `Home` and `End` choose and `onValueChange` reports each step; tabbing in with nothing chosen chooses nothing; a key that moved nowhere leaves nothing pending (fails without the blur reset, checked); a multiple group's arrows call nothing (fails without the `type` guard, checked); the flag guard (fails without it, checked); consumer handlers still run. The real-browser keyboard story asserts the choice in left-to-right and right-to-left. All 3,070 unit and 761 real-browser tests pass.

## Finalized, 2026-09-26

Declared by the user after the final review: its one defect was fixed, and the single group's arrow-key choice was added at explicit direction. **One item from the review was left as it is and is a known limitation of the Finalized component, not an open question:**

- **The `subtle` look marks the chosen item faintly.** Its fill is `bg.brand-subtle` and its text changes from `text.secondary` to `text.brand`, both readable; the state is also exposed as `aria-checked` / `aria-pressed`. `Tabs`' subtle look is the same. `outlined` and `solid` mark it with a border or a fill.

The gaps and limitations listed in the final review are accepted as they stand.

Later changes get a dated entry here, and go through `06-engineering-standards.md` §9's Finalized rules (ask first, then the three-question test).

## `rovingFocus` added, 2026-10-03 (additive; stays Finalized)

At explicit direction, for `Toolbar.ToggleGroup` ([ADR-0033](../adr/0033-toolbar-togglegroup-is-togglegroup-with-its-own-roving-focus-turned-off.md)).
A public `rovingFocus` prop (default `true`, Radix's own prop): off, the group manages no focus of its own, so a
container that owns roving focus (a toolbar) can put its items in its own order. With it off `loop` has no effect and a
`type="multiple"` group is a plain `group` rather than Radix's `toolbar` (a toolbar inside a toolbar is invalid); a single
group stays a `radiogroup`.

Three-question test: the default is today's behaviour, so nothing that existed changes and it stays Finalized, with a
scoped mini-pass: JSDoc, a Properties-table row (a non-live control: turning it off in the Playground would only remove
the keyboard movement), a Docs sentence, and three tests (one tab stop by default; with it off every item is a tab stop and
a multiple group is a `group`; a single group stays a `radiogroup` and still chooses).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`, else left to right, as before; the prop and its own value are unchanged. The `dir` JSDoc, the Controls description and the Docs line say so. Covered by `DirectionProvider.consumers.test.tsx`. Finalized status is unchanged: no behaviour changes without a provider, and the existing right-to-left checks were re-run.
