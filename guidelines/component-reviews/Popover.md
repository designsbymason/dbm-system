# Popover — Storybook/component review findings

**Overlay & Disclosure:** Popover — built 2026-09-16, item 8 in the itemized molecule-tier build
order (`04-component-inventory.md`), "wraps Radix Popover; prioritized since it's the pattern later
organisms (Menu, Combobox, DatePicker) will reuse." Adds `@radix-ui/react-popover` (^1.1.23) as a
new dependency. **Finalized 2026-09-17** by the user (see "Finalized 2026-09-17" further down); only the
user declares a component's review pass done. This file records what was built, checked and found.

**The first true Radix-mirroring compound component in this system.** `Select` (the only prior
compound-flavored molecule) is actually a single component with declarative `<Select.Option>`
children, not a `Root`/`Trigger`/`Content` split — Popover is the first to expose real Radix-shaped
sub-parts (`Popover.Trigger`, `Popover.Content`, `Popover.Close`), matching Radix's own primitive
directly, since later organisms reuse this exact positioning/dismissal mechanism for their own
dropdowns. Each sub-part's own props get a `### Popover.{Part} properties` subsection on the Docs
page via a hidden, docs-only stories file per `guidelines/adr/0013` — `PopoverTrigger.stories.tsx`,
`PopoverContent.stories.tsx`, `PopoverClose.stories.tsx`.

## Design decisions made during the build

- **`Popover.Trigger` renders an unstyled native `<button>` by default**, not a styled one — callers
  are expected to reach for `asChild` with `Button`/`IconButton` for real visual chrome, matching how
  `Tooltip`'s own trigger has no built-in styling either. A minimal CSS reset (`.trigger` in
  `Popover.module.css`: transparent background, no border, `cursor: pointer`, inherited font) keeps
  the un-styled fallback from looking like a raw browser button, without pretending to be real chrome.
- **The floating panel reuses `Select`'s own established "elevated surface" chrome** — `bg.surface`
  background, `border.default`, `radius.md`, a fixed light/dark shadow pair via the
  `[data-theme$="-dark"]` attribute-selector pattern, explicit `font-family` (since the content
  renders in a `Portal` outside this component's own tree, matching `Select`'s/`Tooltip`'s own
  documented reasoning for the same thing) — the same visual family as every other portaled,
  token-driven panel in this system, not a new one-off treatment.
- **New component token, `popover.max-width` (24rem)** — deliberately wider than `tooltip.max-width`
  (20rem, `component/tooltip.json`), since Popover's own content is richer and more interactive (a
  form, several lines) than Tooltip's short hint text; a narrower cap would force realistic content
  to wrap awkwardly. `z-index.popover` (an existing primitive token, 1500) used directly rather than
  the `z-index.dropdown` token `Select`'s own dropdown reuses — Popover already had its own dedicated
  slot in the z-index scale, unlike Select at the time it was built.
- **`showCloseButton` is opt-in, off by default** — reuses the `CloseButton` atom (a real, deliberate
  consumer of `guidelines/adr/0008`'s own "reserved for standalone modal-style surfaces with no local
  tone to track" carve-out — Popover has no varying tone of its own, so it qualifies) rather than
  forcing a dismiss affordance on every popover regardless of whether outside-click/Escape alone
  already covers it well enough.
- **`modal` mirrors `Dialog`'s own future modal behavior** (focus trap, background interaction fully
  blocked via `pointer-events: none` + `aria-hidden` on the rest of the page) rather than inventing
  separate terminology — live-verified: `Tab` cycles focus back to the close button rather than
  escaping to the page, a background element's own click handler never fires (confirmed both by
  `aria-hidden` making it unreachable via `getByRole` without `hidden: true`, and by `userEvent.click`
  itself refusing with a `pointer-events: none` error), and `Escape` still closes it either way. This
  does **not** extend to blocking the popover's *own* outside-click dismissal, though — see the
  dedicated finding below (2026-09-16).
- **A dev-mode "no accessible name" console warning on `Popover.Content`** — `role="dialog"` needs
  one, matching every other component in this system with the same guardrail (`Slider`, `Switch`,
  `SearchInput`, …). Found the real gap live: `@storybook/addon-a11y`'s own automated sweep failed
  4 stories across this component's own files for exactly this ("aria-dialog-name") before the
  warning (and the missing `aria-label`s across several stories) were added — the checklist item
  "automated accessibility test passes with zero violations" caught a real, concrete miss, not a
  hypothetical one.

## `Popover.Anchor` is not exposed — a confirmed upstream Radix bug, not a design choice

Radix's own `Popover.Anchor` sub-part (for anchoring the content's position to an element other than
the trigger) was built, typed, and documented first, then **removed before shipping** after live
verification found it doesn't work correctly in the installed version combination
(`@radix-ui/react-popover@1.1.23` + `@radix-ui/react-popper@1.3.7`):

- Reproduced with **raw `@radix-ui/react-popover` primitives** — zero of this component's own code
  involved, both with and without `asChild` on the anchor element — confirming this isn't an
  `asChild`/Slot issue on either side.
- Root cause, traced through Radix's own source: `PopoverTrigger` checks `context.hasCustomAnchor`
  *during render* to decide whether to wrap itself in its own implicit anchor; `PopoverAnchor` only
  flips that flag to `true` via a `useEffect` that fires *after* the first commit. On the very first
  render, before that effect fires, `Trigger` still wraps itself in a competing anchor regardless of
  a real `Popover.Anchor` being present. Once the corrective re-render happens and that implicit
  wrapper unmounts, nothing re-registers the real anchor with Popper's positioning context —
  `PopperAnchor`'s own ref callback only calls `onAnchorChange` on *attach*, never on *detach* — so
  positioning silently keeps referencing the removed node, computing a 0×0 rect and collapsing the
  content to the viewport's own top-left corner.
- Confirmed via `getComputedStyle`/`getBoundingClientRect()` inspection, not just visually: the real
  anchor element itself measured correctly and had Popper's own `data-radix-popper-side`/
  `data-radix-popper-align` attributes properly injected (proving Slot/asChild forwarding worked) —
  yet the content wrapper's own `--radix-popper-anchor-width`/`--radix-popper-anchor-height` custom
  properties were stuck at `0px`, and neither a manual `resize` event nor waiting longer changed it.

**Decision: omit `Popover.Anchor` from the shipped API entirely** rather than document a broken
feature with a warning label — `PopoverAnchorProps` and the sub-part itself were removed from
`Popover.types.ts`/`Popover.tsx`/the barrel export before this build was considered done. Documented
prominently in `Popover.tsx`'s own top-level JSDoc (not just here) so a future session doesn't
re-discover this from scratch. **Revisit once a newer Radix release fixes it** — re-add `Anchor`,
its own hidden sub-part stories file, and its own Properties subsection at that point, following the
exact pattern the other three sub-parts already establish. Recorded as its own decision record,
[ADR-0017](../adr/0017-popover-omits-anchor-sub-part-pending-upstream-fix.md) — added 2026-09-17, during
a guidelines audit, once this qualified as a genuine fork-in-the-road decision that had only ever
been narrated inline rather than given its own immutable entry.

## A real, but environment-specific, test-runner flake — not a component defect

Two of this component's own `play`-function Storybook interaction stories (`Click to open, Escape to
close`; `Click outside to dismiss (non-modal)`) were removed after being found to intermittently fail
specifically inside `@storybook/addon-vitest`'s own browser-mode (Playwright) story sweep — reduced
to a fully minimal repro (a bare `<Popover>` plus one plain, unstyled sibling `<button>`, no design-
system components involved at all): `userEvent.click` on the trigger reliably flips
`data-state`/`aria-expanded` to `"open"`, but `Popover.Content` sometimes never actually mounts into
the DOM afterward, and the failure wasn't tied to story order or file position (reproduced running
that one story in isolation via `-t`).

The same click-open/outside-click-dismiss/Escape-close interactions are **all reliably covered
elsewhere** and were **live-verified manually, extensively, in a real interactive browser** during
this build (Playground open/close, Escape, outside click both modal-blocked and non-modal-dismissed,
`Tab` focus trapping in modal mode, typing into real form content, all four `side` positions, both
brand themes × both color modes, 375px mobile width) — and by a full, reliable jsdom + Testing
Library suite in `Popover.test.tsx` (23 tests, including the exact interaction these two removed
`play` functions were meant to automate). Both stories stay as plain, manually-clickable visual demos
rather than carrying a test that fails for reasons unrelated to the component's own correctness.

## Self-review against `06-engineering-standards.md` §9 (informal, build-time pass)

- **Baseline correctness**: TypeScript strict, no `any`; full JSDoc on the component and every prop
  across all four exported pieces (`Popover`, `Popover.Trigger`, `Popover.Content`, `Popover.Close`);
  `forwardRef` on every sub-part with a real DOM node; `className`/`style`/`id`/`data-testid` accepted
  on `Trigger`/`Content`/`Close` (`Popover` itself has none of these — it renders no DOM node of its
  own, matching Radix's own `Root`, documented explicitly on the Docs page's Properties section);
  `{...props}` spread before this component's own computed attributes (`aria-label`/`aria-labelledby`
  on `Content`) per the standing JSX-ordering rule; zero hardcoded values (every color/spacing/shadow/
  radius/motion value traces to a token, including the new `popover.max-width`); SSR-safe (no
  unguarded `window`/`document` access — `container` defaults via Radix's own `Portal`, not read
  directly here).
- **Compound-component sub-part completeness**: applied to `Trigger`/`Content`/`Close` — each has its
  own `forwardRef`, full JSDoc, and `className`/`style`/`data-testid` support (`Content` additionally
  gets `id`/`aria-label`/`aria-labelledby`, the props genuinely specific to a `role="dialog"` element
  the other two don't need).
- **Atom reuse**: `CloseButton` reused for `showCloseButton`, per `guidelines/adr/0008`'s own explicit
  qualifying criterion, not re-implemented locally.
- **Accessibility**: `role="dialog"` and `aria-haspopup`/`aria-expanded`/`aria-controls` come from
  Radix directly; the dev-mode accessible-name warning (this build's own real finding, see above);
  keyboard (`Tab`/`Escape`) and modal focus-trapping verified live, not assumed; jest-axe passes with
  zero violations across default/close-button/modal states (`Popover.test.tsx`).
- **Theming**: verified live across Purple/Emerald × Light/Dark.
- **Responsiveness**: verified live at 375px mobile width (Playground, no overflow or clipping).
- **Feature completeness**: covers what a comparable production popover typically offers — controlled/
  uncontrolled open state, modal/non-modal, all four sides × three alignments with automatic collision
  avoidance, an optional arrow, an optional close button, a portal container override — short of
  `Popover.Anchor` specifically, omitted for the confirmed upstream reason above, not a scope gap.

**Full package self-verification**: `pnpm run lint` (eslint + `tsc` + `.storybook` `tsc`), full Vitest
`unit` (1350/1350) and `storybook` (471/471, re-run 3× to confirm no residual flakiness after removing
the two problematic `play` functions) projects, `pnpm run build`, `check-component-bundle-size`
(Popover: 1.42KB JS / 0.92KB CSS, well within budget), and `check-foundations-token-coverage` (80/80,
unaffected — `popover.max-width` is a component-layer token, not a semantic color) all clean.

## Post-build fix: the arrow had no border, reading as nearly invisible (2026-09-16)

User-reported, with a screenshot: the arrow connecting the content to its trigger was a plain white
fill with no edge of its own, blending into the page and making it hard to tell the popover was even
"pointing" anywhere. Fixed by giving `.arrow` the same `border.default` stroke and `border-width.1`
width `.content`'s own box border already uses, so the two read as one continuous edge rather than a
bordered box with a borderless notch cut into it.

Two things found live while implementing this, not obvious from the CSS alone:

1. **`fill`/`stroke`/`stroke-width` are inheritable SVG presentation properties, but `vector-effect`
   is explicitly not** (per the SVG spec) — setting all four on `.arrow` (the class Radix applies to
   its own outer `<svg>`, not the inner `<polygon>` that actually paints) let the first three reach
   the polygon by inheritance, but `getComputedStyle` on the polygon kept reporting
   `vector-effect: none` regardless. Needed its own explicit `.arrow polygon { vector-effect:
   non-scaling-stroke; }` rule.
2. **`non-scaling-stroke` isn't cosmetic here, it's load-bearing**: Radix's own arrow `<svg>` renders
   with `preserveAspectRatio="none"`, non-uniformly scaling its `30x10` viewBox down to a rendered
   `10x5` (a 0.33x/0.5x split per axis) — without `vector-effect`, the exact same `stroke-width`
   would render visibly thinner on the wider axis than the narrower one instead of a uniform line.

Verified live in both brand themes × both color modes (the seam between trigger and content is now
visibly notched, not a blank gap) and via a temporary 30x-scaled clone of the real arrow `<svg>` to
confirm the stroke geometry itself was correct before checking it at true (10x5px) size, where a
correct-but-tiny stroke is inherently harder to eyeball than a wrong one.

Re-verified: `pnpm run lint`, full Vitest `unit` (1350/1350) and `storybook` (471/471) projects,
`pnpm run build`, and `check-component-bundle-size` (Popover: 1.42KB JS / 0.96KB CSS, still within
budget) all clean.

## Follow-up fix: the arrow's border covered all three sides, including the base (2026-09-16)

User-reported, with a screenshot: the previous fix (a plain `stroke` on Radix's own single
`<polygon>`) borders a closed shape's every side — including the base, the edge meant to blend
seamlessly into `.content`'s own edge. That base-side stroke read as an unwanted extra line right at
the seam between trigger and content, not the clean "content border continuing into a point" look the
first fix was going for.

A single stroked polygon can't express "border two sides, not the third" — stroking a closed shape
strokes the whole outline as one continuous path with no way to selectively omit a segment via CSS
alone. Fixed by replacing Radix's own default single-`<polygon>` arrow content with `asChild` and
custom markup instead — confirmed live that `@radix-ui/react-arrow`'s own source explicitly supports
this (`props.asChild ? children : <polygon .../>` in its render), not something assumed:

```tsx
<PopoverPrimitive.Arrow asChild>
  <svg>
    <polygon points="0,0 30,0 15,10" className={styles.arrowFill} />
    <path d="M0,0 L15,10 L30,0" className={styles.arrowStroke} />
  </svg>
</PopoverPrimitive.Arrow>
```

Two elements doing two separate jobs: the `<polygon>` (no stroke) paints the filled shape; the
`<path>` — deliberately *open*, no closing `Z` segment back to the start — draws a stroke along only
the two exposed sides it explicitly lists, since an open path simply has no third segment to stroke in
the first place, not a closed one with a hidden/clipped side. `viewBox`/`preserveAspectRatio`/`width`/
`height`/`ref` all still land correctly on the custom `<svg>` via Radix's own `asChild`/Slot merging —
confirmed live via the actual rendered `outerHTML`, not assumed from reading the source alone.

Live-verified geometrically correct across all four `side` values, not just the default `bottom` —
Radix rotates the whole arrow `<svg>` per placement (`top`/`right`/`left` each get their own
`transform`), and since the custom path is defined in the same local coordinate space the original
polygon used, it rotates as one consistent shape rather than needing separate per-side path
definitions. Confirmed via a temporarily-scaled, counter-rotated clone of the real `left`-side arrow,
not just the default bottom case.

Re-verified: `pnpm run lint`, full Vitest `unit` (1350/1350) and `storybook` (471/471) projects,
`pnpm run build`, and `check-component-bundle-size` (Popover: 1.49KB JS / 0.96KB CSS, still well
within budget) all clean.

## Follow-up fix: the close button overlapped the content's own text (2026-09-16)

User-reported, with a screenshot (`side="top"`, `showCloseButton`): the close icon in the content's
own top-end corner visibly overlapped the tail end of a line of text sitting right underneath it.
Root cause: `.closeButton` is `position: absolute`, positioned outside `.content`'s own normal
document flow — nothing in that flow (including the text) had any reason to stop short of it, so a
line long enough to reach that corner simply ran underneath the icon instead of wrapping before it.

Fixed with a conditional class, `.contentWithCloseButton`, applied to `.content` only when
`showCloseButton` is set, adding extra `padding-inline-end` (`space-10`, 40px) — a measured floor,
not an arbitrary round number: the close button's own real footprint from the content's inline-end
edge is `space-2` (8px, its own inset) plus `icon-button-size-xs` (30px, its own width) = 38px;
`space-10` clears that with a couple of pixels to spare. The other three padding sides are untouched.

Live-verified against the exact reported scenario (`side="top"`, `showCloseButton`) and the default
(`side="bottom"`) case — both now show a clean gap between the text and the icon. Added a regression
test asserting the class is present only when `showCloseButton` is set, not just a visual check.

Re-verified: `pnpm run lint`, full Vitest `unit` (1351/1351, up from 1350 with the new test) and
`storybook` (471/471) projects, `pnpm run build`, and `check-component-bundle-size` (Popover: 1.51KB
JS / 0.97KB CSS, still well within budget) all clean.

## Follow-up fix: Storybook Controls-panel audit found several stories with dead or wrongly-disabled controls (2026-09-16)

User-requested: review every `Popover.stories.tsx` story's Controls panel against the
`06-engineering-standards.md` §9 checklist ("control genuinely interactive wherever it makes sense,
`control: false` reserved for props that genuinely can't/shouldn't be live-edited" + "every story's
panel actually drives its own canvas, checked live"). Found real issues in both directions across
seven of the eleven stories:

1. **`WithArrowHidden`, `WithCloseButton`, `Modal` unnecessarily disabled their own defining prop's
   control** (`hideArrow`, `showCloseButton`, `modal`+`showCloseButton`) even though each uses the
   shared, fully-`args`-wired default render — the control would have worked fine left live. Direct
   precedent found in `Slider.stories.tsx` (`WithValue`/`ErrorState`/`Disabled` all leave their own
   defining boolean prop's control live, no `argTypes` override). Fixed by removing the overrides —
   these stories now just start from a preset value, same as Slider's own pattern.
2. **`AllSides` had the inverse problem in two directions at once.** `align`'s control was disabled
   even though it's a real, shared value applied uniformly to all four instances (only `side` is
   actually varied per-instance and structurally can't take a single control value — that one stays
   disabled, correctly, per the checklist's own "suppress only the varying-axis prop" guidance).
   Meanwhile `sideOffset`/`alignOffset`/`avoidCollisions`/`collisionPadding`/`showCloseButton` were
   left with *no* override at all — live, interactive-looking controls — despite the custom `render`
   never reading them, making every one of them a silent no-op. Fixed by wiring all five through into
   each of the four instances, re-enabling `align`, and explicitly disabling `defaultOpen`/`modal`/
   `onOpenChange` (these three are structurally incompatible with this story's own hardcoded `open`,
   itself a deliberate workaround for the multi-instance uncontrolled-open race documented above —
   wiring them through would reintroduce that exact bug).
3. **`WithForm` also had it backwards**: `side`/`align`/`showCloseButton` were disabled despite its
   own `render` genuinely reading all three from `args`, while `defaultOpen`/`modal`/`sideOffset`/
   `alignOffset`/`avoidCollisions`/`collisionPadding`/`hideArrow`/`onOpenChange` were left live with
   no wiring at all. Fixed by fully wiring the story to every arg (matching `Playground`'s own shape),
   removing the three unwarranted disables.
4. **`DisabledTrigger` and `OutsideClickInteraction` were the most serious finding** — both used a
   custom `render` taking no `args` parameter whatsoever, so *every* control shown for these two
   stories (11 apiece) was a pure no-op with nothing in the UI signaling it — exactly the "worse than
   the inert-placeholder case" failure mode the checklist calls out by name. Rather than disable the
   whole panel (the checklist's own explicitly-rejected fix for a comparable case, reverted the same
   day it was tried previously — see line 127 of `06-engineering-standards.md`), both were fully
   rewired to `args`, matching `Playground`'s shape. This also made `DisabledTrigger` more informative
   than before: setting `defaultOpen` to `true` now visibly opens the content despite the trigger
   itself being unclickable, correctly demonstrating that `disabled` blocks *interaction* only, not a
   forced-closed state. `OutsideClickInteraction` additionally disables `modal`'s own control (fixed
   `false`) since a modal popover blocking outside pointer interaction would defeat the story's own
   point.
5. **`Playground` and `ClickInteraction`** were already fully correct (shared default render, no
   overrides) — no changes.

Every changed story's Controls panel was live-verified in a running Storybook instance by actually
toggling values via the URL's `args` query param and confirming the canvas changed accordingly, not
by re-reading the code and assuming it — including confirming `defaultOpen` behaves identically on
`DisabledTrigger` as it already does on `Playground` (a pre-existing, expected Storybook/React
limitation: toggling `defaultOpen` on an already-mounted story doesn't reopen it, since it's read only
at mount — a fresh navigation with the arg pre-set does).

Re-verified: `pnpm run lint` (eslint + `tsc` + `.storybook` `tsc`), full Vitest `unit` (1351/1351,
unaffected — no unit test touches the stories file) and `storybook` (471/471) projects, `pnpm run
build`, and `check-component-bundle-size` (Popover: 1.51KB JS / 0.97KB CSS, unchanged — stories aren't
part of the shipped bundle) all clean.

## Follow-up: `modal` prop dedicated live audit — one real story bug found, docs wording corrected (2026-09-16)

User-requested: verify `modal` specifically, end to end, live rather than by re-reading the code. Four
distinct behaviors checked in a real browser (not just the existing jsdom unit test):

1. **Focus trap** — confirmed: 5× `Tab` inside a `defaultOpen modal` popover with only a close button
   never moved focus off it (there's nothing else focusable inside the demo content to cycle to, and
   it never escaped to the trigger or the page).
2. **`Escape` still closes it, focus returns to the trigger** — confirmed via `document.activeElement`
   after pressing `Escape`.
3. **Background `aria-hidden` + `pointer-events: none`** — confirmed on the trigger's own container,
   and separately on a temporary injected sibling `<button>` with its own `onclick`: a real mouse click
   on it (not `userEvent`, an actual dispatched click) never fired that handler at all — genuine proof
   background interaction is blocked, not just an assumption from the CSS.
4. **Outside-click dismissal is identical whether `modal` is set or not** — this is the one place the
   component's own docs overclaimed. Clicking blank page space, or the same blocked background button
   from #3, still closed the popover in both modal and non-modal alike. Root cause: Radix's `Popover`
   (unlike `Dialog`) exposes no `Overlay`/scrim sub-part, so there's nothing to swallow the dismissal
   click itself — `disableOutsidePointerEvents` only blocks *hit-testing on background elements*, not
   the `DismissableLayer`'s own document-level outside-pointerdown detection. `modal`'s real,
   verified effect is limited to items 1-3 above, not "can only be dismissed via Escape/close button."

**Fixed the wording** in `Popover.mdx`'s Accessibility section and this file's own "design decisions"
bullet above (both previously said modal "blocks outside pointer interaction entirely" without
qualifying that dismissal-by-outside-click is unaffected) — no runtime/behavioral change, since the
actual implementation was already correct and faithful to Radix's own upstream `modal` semantics
throughout; only the documentation was overclaiming.

**Found and fixed a real bug in `OutsideClickInteraction`'s own layout while re-checking it against
this corrected understanding**: wiring `modal` through this story (removing the unwarranted
`argTypes: { modal: { control: false } }` from the prior controls-audit pass, since modal turns out
not to defeat this story's own point after all) prompted re-testing the story's "Outside element"
button with a real click — and `document.elementFromPoint` at that button's own center returned the
popover's own content text, not the button. The button was genuinely unclickable by mouse: `Content`
is portaled and contributes zero height to the flex column's layout, so "Outside element" sat directly
below the trigger in normal flow, and the floating content (positioned via `sideOffset` on top of that
same spot) visually and hit-test-wise covered it whenever the popover was open — for every opening
method (`defaultOpen` or a real click), not just the `defaultOpen` case used to first notice it. Fixed
by widening the flex column's `gap` from `space-4` to `space-16`, clearing the default `sideOffset`
(8px) plus the content's own rendered height. Live-verified: `elementFromPoint` now correctly resolves
to the button itself, and an actual click on it dismisses the popover end to end, both for `modal:
false` (the story's own stated case) and `modal: true` (now that its control is live, confirming
outside-click dismissal behaves identically either way, per the finding above).

Re-verified: `pnpm run lint`, full Vitest `unit` (1351/1351) and `storybook` (471/471) projects,
`pnpm run build`, and `check-component-bundle-size` (Popover: 1.51KB JS / 0.97KB CSS, unchanged) all
clean.

**User follow-up: asked for the corrected `modal` explanation to be propagated to the actual
documentation surfaces**, not just this file and the Accessibility narrative in `Popover.mdx`. The
same "blocks outside pointer interaction entirely" overclaim existed in two further places that
directly feed the Docs page's own Properties table and sidebar, neither of which the first pass had
touched: `PopoverProps.modal`'s own JSDoc in `Popover.types.ts` (the actual source of truth a
consumer's IDE tooltip shows, and what docgen would extract), and the `modal` `argTypes.description`
in `Popover.stories.tsx`'s `meta` (what the Properties table and Controls panel actually render, per
this file's own established manual-argTypes pattern for the combined root+Content Playground). Also
found the same overclaim baked into the `Modal` story's own `name` (`"Modal (traps focus, blocks
outside pointer dismissal)"`) — used verbatim as both the sidebar label and the `Popover.mdx` Variants
section heading via `<Canvas of={PopoverStories.Modal} />`. All three corrected to the same accurate
characterization: focus trap + background `aria-hidden`/`pointer-events: none`, dismissal unaffected
by `modal` either way. Live-verified in the running Docs page (not just re-reading the source) that
the corrected Properties-table row text and the renamed "Modal (traps focus, blocks background
interaction)" heading both actually render as edited.

Re-verified: `pnpm run lint`, full Vitest `unit` (1351/1351) and `storybook` (471/471) projects,
`pnpm run build`, and `check-component-bundle-size` (Popover: 1.51KB JS / 0.97KB CSS, unchanged) all
clean.

## Final review pass — full `06-engineering-standards.md` §9 checklist, end to end (2026-09-16)

User-requested: a dedicated final review before finalizing, re-running the complete checklist rather
than relying on the incremental self-review notes above. Five real, concrete findings, fixed; several
other items investigated live and confirmed compliant (no change needed).

**Findings fixed:**

1. **`AllSides`'s fixed 2-column grid broke at mobile width (Responsiveness)** — live-verified at
   375px: Radix's own collision avoidance repositioned a popover to stay within the true viewport,
   but had no awareness of the *adjacent grid cell's own trigger* sitting right next to it, so a
   flipped popover visually overlapped a sibling column's button instead of just avoiding the screen
   edge. Fixed by switching `gridTemplateColumns: repeat(2, 1fr)` to
   `repeat(auto-fit, minmax(180px, 1fr))`, which collapses to a single column once two columns no
   longer fit — removing the adjacency itself rather than tuning gap/padding for one specific width.
   Re-verified clean at 375px and confirmed the desktop layout still reads well (now a single row of
   4 at the story canvas's own width, arguably cleaner than the original fixed 2×2).
2. **`PopoverRoot`'s own JSDoc never justified why it takes no `ref`/`className`/`style`/`id`/
   `data-testid` (Baseline correctness — standard prop patterns)** — the "no root DOM node" exception
   requires justifying itself in the component's *own* JSDoc per the standing rule, matching
   `Tooltip`'s established precedent (its own top-level JSDoc explicitly states this). Popover's own
   version only had this explained in `Popover.mdx`'s prose, not in `Popover.tsx` itself. Fixed by
   adding the same explicit justification directly to `PopoverRoot`'s own JSDoc block.
3. **Code examples section had no snippet demonstrating a genuine native prop (Storybook
   documentation)** — all three existing snippets used only this component's own custom props. Fixed
   by adding a fourth: `<Popover.Trigger disabled>Open</Popover.Trigger>`, pairing with the
   `disabled` example already named in the Trigger's own Properties-section disclaimer sentence.
4. **Radix-primitive prop audit gap: six of `Popover.Content`'s own underlying Radix props were never
   exposed (Baseline correctness — required, not a judgment-call feature addition)** — confirmed by
   reading `@radix-ui/react-popover`'s actual installed source (`PopoverContentImpl`): it accepts
   `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`,
   and `onInteractOutside`, none of which `PopoverContentProps` declared — meaning a consumer
   literally could not customize or prevent auto-focus/dismiss behavior at all (a common, real-world
   popover need — e.g. keeping a nested confirmation open through an Escape press, or ignoring a
   click on an unrelated portaled element like a toast). Fixed by adding all six to
   `PopoverContentProps` with full JSDoc, typed precisely via
   `ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["onX"]` extraction (Radix doesn't
   publicly export the underlying custom event types directly, so this indirection avoids depending
   on an unexported type). No implementation change was needed in `Popover.tsx` itself — since none
   of the six are destructured out, they already flow through the existing `{...props}` spread onto
   `PopoverPrimitive.Content` automatically. Documented in the hidden `PopoverContent.stories.tsx`
   properties table, `Popover.mdx`'s `contentPropOrder`, and threaded into the root Playground's own
   combined `meta` (mirroring `onOpenChange`'s existing pattern: `control: false`, wired with `fn()`
   for Actions-panel visibility). Live-verified in the Actions panel: opening and Escaping out of the
   Playground fires `onOpenChange` → `onOpenAutoFocus` → ... → `onEscapeKeyDown` → `onOpenChange` →
   `onCloseAutoFocus`, each correctly. Added two new regression tests confirming
   `onEscapeKeyDown`/`onPointerDownOutside` can each genuinely prevent the default dismissal via
   `event.preventDefault()`, not just that the prop is accepted.
5. **`Popover.Content`'s own Properties-section disclaimer sentence cited `aria-label` as a "not
   listed here" example while it's actually redeclared and shown in the table right above it
   (Storybook documentation)** — the exact `Avatar`/`Tag`-precedent mistake the checklist explicitly
   warns about, checked for specifically and found real here. Fixed by swapping the example to
   `onMouseEnter` (confirmed genuinely not redeclared).

**Investigated live, confirmed compliant — no change needed:**

- **`Popover.Trigger`'s own `disabled`** — deliberately left to the generic native-attribute
  disclaimer sentence rather than redeclared, which is itself compliant (the disclaimer names it as
  its own example, and it isn't also shown as a row in the table — no `Avatar`/`Tag`-style
  contradiction here).
- **Tab cycling within an open, non-modal popover never reaches the trigger** — live-verified via
  `WithForm` (two focusable elements: Close button, Input) that Tab cycles only between them, never
  escaping to the trigger. Traced to Radix's own installed source: `FocusScope`'s `loop` is hardcoded
  `true` unconditionally on `Popover.Content`, independent of `modal` (only `trapped` varies by
  `modal`) — `loop` governs "wrap within the scope once focus is inside it," a distinct concept from
  `modal`'s own "block background interaction" — this matches this component's own already-accurate
  documentation ("Tab moves focus into the content... Escape closes it and returns focus to the
  trigger," which never claims Tab itself can escape). Not a defect; the initial expectation that
  non-modal should let Tab escape via repeated presses was simply wrong.
- **An "Inconclusive" (not "Violation") axe-core finding on `aria-controls`, Playground, both brand ×
  mode combinations** — "unable to determine if aria-controls referenced ID exists on the page," a
  known axe-core limitation scanning across a `Portal` boundary. Verified directly via
  `document.getElementById` in the live DOM that the referenced id resolves correctly to the real
  `role="dialog"` element — a false positive, not a real gap.
- **Theming** — verified live across all four Purple/Emerald × Light/Dark combinations on the
  Playground (arrow border, close button, shadows all correct in each); 0 real accessibility
  violations in every combination.
- **Responsiveness elsewhere** — `WithForm` and `DisabledTrigger`-style single-instance stories
  confirmed clean at 375px (only `AllSides`'s multi-instance grid had the real gap above).
- **`act()`/"suspended inside an act scope" console errors on the Docs page** — confirmed via a
  side-by-side check against `Select`'s own, already-Finalized Docs page (identical warnings, same
  count) that this is generic Storybook Docs-page test-instrumentation noise affecting any
  Radix-Popper-based component's docs render, not something introduced by this component or this
  pass.

Re-verified: `pnpm run lint` (eslint + `tsc` + `.storybook` `tsc`), full Vitest `unit` (1353/1353, up
from 1351 — two new regression tests) and `storybook` (471/471) projects, `pnpm run build`, and
`check-component-bundle-size` (Popover: 1.51KB JS / 0.97KB CSS, unchanged — all fixes were
type-level, documentation, or Storybook-only) all clean. Docs page visually re-verified end to end in
a running Storybook instance after every fix (Properties tables, code examples, Variants headings).

## Follow-up fix: long content overflowed the viewport at mobile width (2026-09-17)

User asked, after the final review pass above, whether the content panel is genuinely responsive at
mobile width — prompted a deeper stress test than the review pass itself had run: every prior
responsiveness check used only the demo's own short canned text, which never approached
`popover.max-width` (24rem/384px) in the first place. Testing with long content at 375px found a
real gap: `avoidCollisions` (on by default) only *repositions* the panel (shift/flip) to stay as much
on-screen as possible — confirmed live, it shifted the panel as far as the 8px collision boundary
allowed — but repositioning alone can't fix a box that's simply wider than the viewport has room for;
only shrinking it can. `.content`'s `max-width` was a fixed token value with no viewport-relative
fallback, so long content rendered up to 17px past the right edge of a 375px viewport regardless of
where Radix positioned it.

Root cause traced directly in the installed `@radix-ui/react-popper` source: its `size` middleware
runs unconditionally (not gated behind `avoidCollisions`) on every reposition and writes the true
currently-available space to `--radix-popper-available-width`/`--radix-popper-available-height` as
live inline custom properties on the content element — this component's CSS just never consumed
them. Fixed with `max-width: min(var(--dbm-popover-max-width), var(--radix-popper-available-width))`
— the design's own token still wins whenever there's enough room (unchanged desktop behavior,
confirmed: content still caps at the normal 384px with plenty of viewport to spare), and Radix's own
live value takes over as the binding constraint only when the viewport genuinely can't fit the
token's full width.

Live-verified: 375px width, long stress-test content, `getBoundingClientRect()` confirming the panel
stays fully within the viewport (previously overflowed to `right: 392`–`404px` against a 375px
viewport depending on `showCloseButton`, now consistently settles within it, e.g. `right: 367px`)
across the default `side="bottom"` placement, `side="right"` (a much tighter available-width case,
correctly shrinking to ~91px), and combined with `showCloseButton`'s own extra padding — confirmed
`box-sizing: border-box` (this codebase's own global reset) means the padding is already accounted
for inside the capped width, not added on top of it. One transient false alarm during this
investigation: an initial test appeared to show a stuck, still-overflowing state, but repeated clean
reproductions (fresh navigation each time, multiple animation-frame-synced measurements) consistently
converged correctly — traced to residual DOM state from chaining multiple test mutations onto the
same already-mutated instance without a fresh remount, not a real product defect.

No jsdom unit test added for this — jsdom doesn't run real layout or evaluate Floating UI's own
positioning math, so it can't meaningfully exercise this fix; live browser verification is the only
way to actually prove it (same category as the earlier arrow-border/`vector-effect` CSS fixes this
component's own review already established that pattern for).

Re-verified: `pnpm run lint`, full Vitest `unit` (1353/1353, unaffected — CSS-only fix) and
`storybook` (471/471) projects, `pnpm run build`, and `check-component-bundle-size` (Popover: 1.51KB
JS / 1.00KB CSS, negligible increase, still well within budget) all clean.

## Feature addition: `side` accepts a responsive map, so `left`/`right` can fall back to `top`/`bottom` at a chosen breakpoint (2026-09-17)

User asked, after the `max-width` overflow fix above: should `side="left"`/`"right"` automatically
cross over to `top`/`bottom` when there's no horizontal room (particularly at mobile width)? Checked
the installed `@radix-ui/react-popper` source first, since this determines whether it's even possible
today: `avoidCollisions`'s `flip({ ...detectOverflowOptions })` call never sets floating-ui's own
`fallbackAxisSideDirection`, and `detectOverflowOptions` is built internally from `collisionPadding`/
`collisionBoundary` only — so Radix's own `flip` middleware, as wired, **only flips within the same
axis** (`left`↔`right`, `top`↔`bottom`), never across them, and there is no public prop on
`Popover.Content` that reaches the option that would change this. Confirmed this is a real,
architecture-level constraint of the underlying primitive, not something this component's own
wrapper was simply missing a passthrough for.

Recommended against building automatic cross-axis flipping: it's a genuine per-usage UX judgment call
(some usages specifically want to stay beside the trigger even when cramped, e.g. an inline
validation hint next to a field, rather than jumping to a different axis unprompted), it's not a
capability gap today's API is missing (a consumer can already pass a different `side` based on their
own breakpoint check), and building genuine runtime auto-detection would mean either bypassing
Radix's own positioning engine (a real architecture change, contrary to `02-tech-stack-and-structure.md`'s
"Radix as the behavior/accessibility foundation" stance) or a custom measure-and-override effect
prone to reposition oscillation.

**Proposed and built instead, at explicit user request: widen `side` to accept `Responsive<PopoverSide>`**
(a value, or a mobile-first map keyed by breakpoint, e.g. `{ base: "bottom", lg: "right" }`) — giving
the developer explicit, ergonomic per-breakpoint control without any runtime detection or fighting
Radix's own same-axis-only `flip`. This is not a new pattern invented for Popover: `Divider`'s own
already-Finalized `orientation` prop established the exact same `Responsive<T>` + `matchMedia`-based
resolution shape (`useResolvedOrientation`) for the identical underlying problem — a prop driving
something that can't be expressed as a pure CSS cascade (there, a static `aria-orientation` attribute;
here, a value Radix's own JS positioning engine consumes directly, not CSS).

**Extracted a reusable primitive** rather than duplicating Divider's local hook a second time, per
this project's own DRY rule (`06-engineering-standards.md` §1: shared logic belongs in
`packages/utils` once used in 2+ places — this is exactly that second use case):
`useResolvedResponsiveValue<T>(value, fallback)` now lives in
`packages/utils/src/hooks/useResolvedResponsiveValue.ts`, a direct generalization of
`useResolvedOrientation` (SSR-safe: resolves to `base`/`fallback` on first render, corrects via
`matchMedia` in a layout effect). `Divider`'s own `useResolvedOrientation.ts` is deliberately left
untouched rather than retroactively migrated onto the new shared hook — `Divider` is already
Finalized, and the standing rule is that a Finalized component's files aren't touched without asking
first, even for an obvious DRY win. `02-tech-stack-and-structure.md` updated to reflect that
`primitives` now holds a real shared hook (it previously documented "none has yet").

In `Popover.tsx`, `PopoverContent` resolves `side` via `useResolvedResponsiveValue(side, "bottom")`
before handing the single concrete value to `PopoverPrimitive.Content` — Radix's own positioning
needs one real string per render, not the responsive union type. Matched `Divider`'s own Storybook
convention exactly: the Playground's `side` control stays a plain `select` (a `Responsive<T>` map has
no single control shape Storybook can represent), with its description noting the responsive form
exists; a new dedicated story, `ResponsiveSide` ("Responsive side (bottom on mobile, right from lg
up)"), demonstrates the map form with every other control disabled, matching `Divider`'s own
`ResponsiveOrientation` story precedent. Added to `Popover.mdx`'s Variants section and as a fourth
Code-examples snippet. Two new unit tests mirror `Divider`'s own exact `matchMedia` test pattern:
resolving to `base` by default (jsdom's stubbed `matchMedia` never matches), and updating live when a
stubbed `matchMedia` change listener fires in both directions.

Live-verified in a running Storybook instance, `ResponsiveSide` story: at 375px, the popover renders
`data-side="bottom"`, below the trigger; resizing to 1280px (past `lg`, 1024px) switches it live to
`data-side="right"`, beside the trigger, with no remount; resizing back down below 1024px switches it
back to `bottom` — confirmed via both visual screenshots and direct DOM inspection at each width, not
assumed from the code. Also confirmed rendering correctly embedded in the Docs page itself.

Re-verified: `pnpm run lint` (components and primitives), `pnpm --filter primitives run build`,
`pnpm --filter components run typecheck`/`build`, full Vitest `unit` (1355/1355, up from 1353 — two
new regression tests) and `storybook` (472/472, up from 471 — the new story's own auto-generated
smoke test) projects, and `check-component-bundle-size` (Popover: 1.54KB JS / 1.00KB CSS, negligible
increase, still well within budget) all clean.

## Post-review fix: `id` missing from `Popover.Trigger`/`Popover.Close`'s own Properties tables (2026-09-17)

User asked why `id` didn't appear in `Popover.Trigger`'s and `Popover.Close`'s own Properties
tables, alongside `className`/`style`/`data-testid` (all three of which were already there) —
directly caught a genuine, real gap against `05-component-api-conventions.md` §3's own standing
rule: "Always accept `className`, `style`, `id`, and `data-testid`" — unconditional, not just
"when an `aria-labelledby` use case exists." The user's own separate observation, that the root
`Popover`'s table is *also* missing all four, is correctly **not** a gap — `Popover` itself renders
no DOM node (already documented in its own JSDoc and the Docs page's Properties section intro,
added during the final review pass above).

Root cause: `PopoverTriggerProps`/`PopoverCloseProps` both explicitly redeclare `className`/`style`/
`data-testid` for docgen visibility, per this project's own established reasoning (Storybook's
default docgen doesn't reliably surface inherited-only native props — the same finding `Input`/
`Button` established) — but both simply omitted `id` from that same explicit redeclaration. `id`
already worked correctly at runtime regardless (inherited generically via
`ComponentPropsWithoutRef<"button">`, passed straight through via each component's own untouched
`...props` spread) — this was purely a documentation-visibility gap, the exact same category as the
six `Popover.Content` Radix event props found during the final review pass, not a functional defect.

Fixed: added `id?: string` with JSDoc (matching `Button`'s own established phrasing) to both
`PopoverTriggerProps` and `PopoverCloseProps`, added matching `argTypes` entries to the hidden
`PopoverTrigger.stories.tsx`/`PopoverClose.stories.tsx` files, and updated `Popover.mdx`'s
`triggerPropOrder`/`closePropOrder`. No implementation change needed in `Popover.tsx` — `id` was
never destructured out of either component's own props, so it already flowed through automatically.

While fixing this, also found (same "Compound-component sub-part completeness" category) that
neither `Popover.Trigger` nor `Popover.Close` had a test proving `id`/`className`/`style`/
`data-testid` actually reach the rendered element — only `Popover.Content` did — and `Popover.Close`
had no ref-forwarding test either, though its implementation already forwards one. Added all three
missing tests, mirroring `Popover.Content`'s own established pattern exactly.

Live-verified on the Docs page: `Popover.Trigger`'s own Properties table now shows `id` in the
correct position (right after `children`, before `className`).

Re-verified: `pnpm run lint`, full Vitest `unit` (1358/1358, up from 1355 — three new regression
tests) and `storybook` (472/472) projects, `pnpm run build`, and `check-component-bundle-size`
(Popover: 1.54KB JS / 1.00KB CSS, unchanged — a type-only/docs-only fix has zero runtime cost) all
clean.

## Second review round, user-requested before finalizing (2026-09-17)

Re-read every file fresh with skeptical eyes rather than re-confirming prior conclusions, with extra
scrutiny on what changed since the first full pass (the responsive `side` prop, the six Radix event
props, the `id` fix) — this is exactly where a second, genuinely-fresh pass earns its keep.

**Found and fixed: the Radix-primitive prop audit from the first pass was itself incomplete.**
Re-checked the *full* `PopperContentProps` inheritance chain (not just the `DismissableLayer`/
`FocusScope` props already covered) and found two more real gaps: `collisionBoundary` (lets a
popover stay within a specific scrollable container instead of the whole viewport — the natural,
expected sibling to `collisionPadding`/`avoidCollisions`, both already exposed) and
`hideWhenDetached` (hides the content instead of leaving it floating in a meaningless position once
its trigger scrolls fully out of view — a real, common visual-correctness need for a trigger living
inside a scrollable list/table/panel). Both added to `PopoverContentProps` with full JSDoc, typed via
the same `PopoverPrimitiveContentProps["x"]` extraction as the six event props, and requiring no
`Popover.tsx` implementation change for the same reason (neither is destructured out, so both already
flow through the existing `{...props}` spread). Deliberately did **not** expose Popper's remaining
three props (`sticky`, `arrowPadding`, `updatePositionStrategy`) — judged as narrower power-user/
performance tuning knobs rather than "commonly-relevant" capability gaps, matching the checklist's own
curation language ("commonly-relevant," not "every native/primitive attribute"); noted here explicitly
so this reads as a deliberate, reasoned line rather than something a future pass rediscovers as an
oversight.

**`hideWhenDetached` got a real demonstration, not just a type.** Built a new permanent story,
`HideWhenDetached` ("Hides when its trigger scrolls out of view"), rendering a popover inside a
genuine scrollable container. First live-verification attempt (jumping `scrollTop` directly via script
without dispatching a `scroll` event) produced a misleading "stuck hidden" result; re-tested with a
gradual scroll dispatching real `scroll` events at each step, which correctly toggled `visibility`/
`pointerEvents` at exactly the right point, round-tripping cleanly in both directions — the earlier
result was a test-methodology gap (Radix's `autoUpdate` needs a real scroll event to recompute), not a
component defect. `collisionBoundary` was not given its own dedicated demo story: an attempt to
verify it live via a temporary experimental story edit (a boundary `<div>` + `useState`-held ref)
tripped a real Storybook/Vite dev-server story-indexer bug — a `render` written as a named `function`
expression with hooks, edited in place, left the static CSF (Component Story Format) analyzer stuck
reporting "unable to index" even after the file was fixed back to valid, `tsc`-clean TypeScript,
requiring a full dev-server restart to clear. Given the experiment was actively harmful without
adding confidence beyond what was already established (identical pass-through mechanism already
proven correct for six other props and for `hideWhenDetached`, plus a direct read of Radix's own
installed source confirming `collisionBoundary` feeds `shift`/`flip`'s `detectOverflowOptions.boundary`
exactly as documented), the experiment was reverted rather than pursued further — confidence here
rests on type-check + source audit + the established pattern, not a dedicated live demo.

**Found and fixed a genuine regression introduced within this very round.** Adding `hideWhenDetached`
as a live (`control: "boolean"`) prop at the shared `meta.argTypes` level — rather than `control:
false` like the six event props — meant every story automatically inherited a *visible, toggleable*
control for it, whether or not that story's own render actually used it. Five of the file's stories
didn't: `AllSides`, `WithForm`, `DisabledTrigger`, and `OutsideClickInteraction` all have custom
renders that read the *other* shared Content args but never `hideWhenDetached`, and `ResponsiveSide`'s
render takes no args at all — exactly the "silent no-op" failure mode the original Storybook
Controls-panel audit (earlier in this file) exists to catch, this time self-inflicted rather than
inherited. Fixed by threading `hideWhenDetached={args.hideWhenDetached}` through the four stories
whose renders already wire through the equivalent props, and adding `hideWhenDetached: { control:
false }` to `ResponsiveSide`'s own already-comprehensive disable list (matching `HideWhenDetached`'s
own story, which already had this correct from the start since it hardcodes the prop directly rather
than reading `args`). Live-verified on `AllSides` (`hideWhenDetached: true` via a direct story-args
URL) that this renders cleanly with no console errors beyond the already-documented, pre-existing
`act()` test-instrumentation noise.

Re-verified: `pnpm run lint`, full Vitest `unit` (1358/1358, unchanged — no new jsdom-testable
behavior; jsdom doesn't run real layout, so it can't meaningfully exercise either new prop, same
reasoning as the earlier `max-width` CSS fix) and `storybook` (473/473, up from 472 — the new
`HideWhenDetached` story's own smoke test) projects, `pnpm run build`, and
`check-component-bundle-size` (Popover: 1.54KB JS / 1.00KB CSS, unchanged) all clean. Docs page
visually re-verified: the Properties table shows `collisionBoundary`/`hideWhenDetached` in the
correct position, and the new "Hides when its trigger scrolls out of view" section renders correctly
in the Variants gallery.

**Status: second review round complete, all findings (including one self-inflicted regression) fixed
and re-verified.**

**Finalized 2026-09-17.** Re-confirmed clean immediately before finalizing: `pnpm run lint`, full
Vitest `unit` (1358/1358) and `storybook` (473/473) projects, `pnpm run build`, and
`check-component-bundle-size` (1.54KB JS / 1.00KB CSS, within budget).

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code", and a Docs-page render error

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: the Playground's snippet was
literally `{}`; three stories ("With the arrow hidden", "With an explicit close button", "Modal") showed only `{ name, args: {…} }` — no
code at all; "All sides" showed `<PopoverRoot>` (the internal function name; only `Popover` is exported) with every default prop spelled
out; and **"Hides when its trigger scrolls out of view" failed to render on the Docs page**, showing `Error: Should not already be working`
in place of the canvas (and so no "Show code" button).

- **The render error:** two demo stories open a popover on mount (`defaultOpen`), and on one Docs page they race each other's mount-time
  auto-focus; Storybook's patched `focus()` then calls React's `act()` while React is mid-commit, which throws. Reproduced on fresh loads;
  fine standalone and in the 530-test browser run, so only the Docs page showed it. **Fixed** by passing `onOpenAutoFocus={(event) =>
  event.preventDefault()}` on the two open-on-mount demos ("Responsive side" and "Hides when its trigger scrolls out of view") — a static
  demo shouldn't take focus on page load anyway. No component code changed; `Popover.Content` already exposed that prop.
- **Snippets:** every story now uses a hand-written snippet from the new `Popover.snippets.ts`, and the Playground *and* the three
  args-only stories build theirs from the live controls, so they show real code (`<Popover.Content hideArrow …>`, `<Popover modal>`).

Typechecked against the real types. **Finalized status unchanged** — story-file and docs-only.

## Post-Finalization changes, 2026-10-03 (both authorized by the user, while building `HoverCard`)

Two changes to files of a Finalized component, each flagged and approved first; neither reopens its
status under `06` §9's three-question test.

- **The arrow moved into a shared internal component.** `HoverCard` needed the identical arrow, and
  a second copy was the point to share it. `Popover.Content` now renders `<PopoverPrimitive.Arrow
  asChild><OverlayArrow /></PopoverPrimitive.Arrow>`, and the `.arrowFill` / `.arrowStroke` rules
  (with their comments) moved to `src/internal/OverlayArrow/OverlayArrow.module.css`. Same markup,
  same tokens, same output: a live Docs page read the arrow's computed fill, stroke, stroke width,
  `vector-effect` and rendered size (10 × 5) as the same values as before, Popover's existing tests
  pass untouched, and the shared component has its own unit tests and a real-browser check of its
  computed styles (broken on purpose once to see it fail). **Question 1: no change to the output of
  anything existing, an internal refactor with no visible or API surface — stays Finalized.**
- **The Properties table's root section now comes from `PopoverRoot.stories.tsx`** (a hidden,
  docs-only stories file, `HoverCardRoot.stories.tsx`'s pattern and ADR-0013's). It had been built
  from the Playground's meta, which also carries `Popover.Content`'s props, so it listed `side`,
  `align`, `showCloseButton`… as the root's own and left out `open`. The rendered table now lists
  `children`, `open`, `defaultOpen`, `onOpenChange` and `modal`, each with its description and
  default. A factual error in the docs, so a defect fix: **stays Finalized.**
- **The arrow's edge now meets the border in forced colours (2026-10-03, a defect found while
  checking `HoverCard`).** In Windows high-contrast mode the surface's own border is recoloured to a
  system colour but an SVG's `fill` and `stroke` are not, so `Popover`'s arrow kept a pale stroke
  against a black border. The shared `OverlayArrow` now draws in `Canvas` / `CanvasText` under
  `@media (forced-colors: active)` (measured in a real browser for `HoverCard`, whose check covers
  the shared stylesheet). A defect against the "WCAG AA" requirement the original pass was meant to
  meet, so under the three-question test it **stays Finalized**. `Popover` itself has no
  forced-colours check of its own yet.

## Post-Finalization follow-up (2026-10-10, at explicit direction) — the entrance scale is a token
The enter keyframes held `scale(0.96)` as a literal, the same one `Popover`, `HoverCard` and `Tooltip` shared. It is now `motion.scale.96`, a primitive added with `Dialog`'s `motion.scale.98`. The value is the same, so nothing renders differently. **Finalized status unchanged** — a CSS value moved to its token, no new props, behaviour or output. Its Docs page lists the token in "Design tokens used".

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `Popover` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `Popover` fails when the wrapper is removed (checked for `Popover`).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
