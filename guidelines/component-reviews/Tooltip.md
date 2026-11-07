# Tooltip — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-05. Findings included two real
baseline-correctness gaps (no native prop passthrough at all, one hardcoded value) and three
approved judgment-call feature additions, the largest being a real architectural gap in how the
component shares (or rather, doesn't share) hover-delay timing across multiple instances.

**Fixed:**
- **`TooltipProps` accepted zero native passthrough.** Unlike every other atom in this system
  (`05-component-api-conventions.md` §3), the interface didn't extend any base props type at all —
  no `className`/`style`/`id`/`data-testid` support on the rendered tooltip content (a real single
  DOM node, portaled — `Tooltip` itself takes no `ref`, but this is exactly the element these
  props should target). Now extends `Omit<ComponentPropsWithoutRef<"div">, "children" | "content">`
  (both omitted keys collide with this component's own differently-typed `children`/`content` —
  `content` in particular is a genuine, easy-to-miss native `<div>`-adjacent attribute confirmed
  only by `tsc` itself flagging the incompatible-override error, not anticipated in advance),
  spread onto `Tooltip.Content`. `id`/`className`/`style`/`data-testid`/`aria-label` explicitly
  redeclared with their own JSDoc for Properties-table visibility, matching established convention.
- **Hardcoded `max-width: 20rem`** in `Tooltip.module.css` — confirmed via a package-wide grep, the
  only non-token dimension value in any component's CSS. No existing scale value matched 20rem, so
  added a new component-layer token (`packages/tokens/src/component/tooltip.json`,
  `tooltip.max-width`) rather than inline the literal, matching `Indicators`'/`Avatar`'s own
  precedent for exactly this situation (`03-token-system-spec.md`).
- **`skipDelayDuration` was silently non-functional.** *(Judgment call, approved.)* Each `Tooltip`
  wrapped its own isolated Radix `Provider`, so Radix's "don't re-delay when quickly moving between
  adjacent tooltips" behavior could never trigger across separate `Tooltip` instances (a toolbar of
  icon buttons, each with its own tooltip, being the concrete motivating case) — confirmed by
  reading Radix's own compiled source (`skipDelayDuration` lives only on `TooltipProviderProps`,
  never on the per-instance `Tooltip`/`Root` props). Fixed by adding a new co-located
  `TooltipProvider` component (`TooltipProvider.tsx`/`.types.ts`, plus a small
  `TooltipProviderContext.ts` sentinel context) that a consumer can optionally wrap once near their
  app root — `Tooltip` reads that context via `useContext` and skips rendering its own nested
  `Provider` only when an ambient one is already present, falling back to its existing "zero setup"
  auto-wrap otherwise. Purely additive: a standalone `Tooltip` behaves identically to before.
  `delayDuration`/`disableHoverableContent` were changed from hard destructuring defaults to
  `undefined`-unless-set, so an unset value correctly inherits whichever `Provider` (ambient or our
  own auto-wrapped one) is actually in scope, matching Radix's own `?? providerContext.X` fallback
  logic exactly rather than always shadowing it with a JS-level default.
  **Verification note:** the actual cross-tooltip skip-delay behavior depends on Radix's real
  continuous-pointer grace-area tracking, which neither a jsdom unit test nor manual Browser-pane
  event dispatch could reliably reproduce (both looked like the feature was broken; investigated
  rather than accepted at face value) — confirmed genuinely working via a `play` function using
  real `userEvent.hover`/`unhover` sequences in the actual Playwright-driven browser test runner
  (`storybook` Vitest project), which passed cleanly.
- **No `disableHoverableContent` support.** *(Judgment call, approved.)* A real Radix `Root`-level
  prop (confirmed dual Provider/Root, not Provider-only) that closes the tooltip immediately on
  pointer-leave instead of letting the pointer travel into the content — added, with the same
  standalone-vs-ambient-`Provider` inheritance as `delayDuration` above.
- **No arrow-visibility toggle.** *(Judgment call, approved.)* Comparable production tooltip
  components typically let consumers hide the pointer arrow; ours always rendered one. Added `hideArrow?: boolean`
  (default `false`, preserving the existing visual default rather than flipping it to match those
  libraries' own opt-in default, since this component isn't newly-introduced and changing the
  default would be a visible behavior change to every existing usage).
- **`aria-label` not exposed.** Radix's own `Tooltip.Content` supports a dedicated `aria-label` for
  when the visible `content` isn't a suitable accessible description (rich/non-text content).
  Redeclared with JSDoc — and corrected mid-implementation once its actual behavior was tested: the
  visible bubble doesn't lose `content` at all (still renders normally), and Radix doesn't literally
  remove `role="tooltip"` — it renders a *separate*, visually-hidden element carrying `role="tooltip"`
  and this string, which is what the trigger's `aria-describedby` actually resolves to. The original
  JSDoc draft got this backwards (assumed by reading `role: ariaLabel ? void 0 : "tooltip"` in
  isolation without also reading the `VisuallyHidden` companion element a few lines below); caught by
  a failing unit test asserting the wrong behavior, not assumed correct.
- **JSDoc was thin relative to every other reviewed component.** Every prop rewritten with
  elaboration on interaction behavior, defaults, and cross-references, matching the standard
  established on `Collapse`/`Backdrop`/`Indicators`.
- **No test coverage for hover-triggered open or Escape-key dismissal.** Only focus-triggered open
  was tested. Added both, plus coverage for the new `className`/`style`/`id`/`data-testid`/
  `aria-label`/`hideArrow`/`disableHoverableContent` props and `TooltipProvider`'s own basic
  behavior — net 6 → 15 unit tests after also removing the one jsdom-unreliable skip-delay test
  discussed above, replaced by the real-browser `play` function instead.
- **No play-function interaction test.** Added `ToggleInteraction` (hover opens, Escape closes) and
  `SharedProviderInteraction` (the skip-delay verification above) — the latter deliberately **not**
  referenced from `Tooltip.mdx`'s Variants gallery. Found live, the hard way: every `<Canvas>`
  embedded in one Docs page shares one real document
  (`07-storybook-and-documentation-standards.md` §4.1), so when this play function's own
  `document.body`-scoped tooltip query first lived on the *visual* `MultipleWithSharedProvider`
  story (which *is* embedded), it threw "found multiple elements with role tooltip" the moment
  another story's own tooltip was also open on the same shared Docs page. Split into two stories —
  `MultipleWithSharedProvider` stays visual-only (safe to embed), `SharedProviderInteraction` is a
  separate, sidebar-only story carrying the assertions, matching `ToggleInteraction`'s own precedent
  and Collapse's/Backdrop's established pattern for exactly this class of story.
- **Existing stories' Controls panels weren't fully wired.** `Sides`/`IconTrigger` used bare
  `render: () => (...)` with no `args` at all (the "render ignoring args" anti-pattern already
  fixed elsewhere in this codebase); `Default`'s own `argTypes` covered only `side`/`align`. All
  three converted to genuinely `args`-driven renders. Added a `Playground` story (`children`, the
  trigger, mapped via `argTypes.mapping` onto a curated set — matching `Collapse`'s own `trigger`
  precedent for a non-primitive required prop) and the `MultipleWithSharedProvider` demo story.
  **Self-inflicted gap caught during Docs-page verification, not before:** the Storybook
  `argTypes.description` strings written for the Controls-panel tooltips were short paraphrases,
  but the Docs page's own `PropertiesTable` pulls its Description column from that exact same
  `argTypes` field, not the richer TypeScript JSDoc — so the live Properties table initially showed
  the abbreviated versions (missing, for example, `delayDuration`'s entire standalone-vs-
  `TooltipProvider` inheritance explanation). Rewritten to carry the full JSDoc content.
- Docs page (`Tooltip.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground, the Properties table's full 15-prop list with complete
  descriptions confirmed via direct DOM inspection after the gap above was caught and fixed, all 4
  gallery stories, both Do/Don't Callouts, the Accessibility Callout, the Design tokens section with
  the new `tooltip.max-width` token, both RelatedCards), Purple × Light/Dark, mobile viewport,
  TOC confirmed showing all 10 sections in order, zero console errors on a genuinely fresh page load
  (a stale console-buffer artifact from an earlier, since-fixed run was initially mistaken for a
  live recurrence — confirmed via a brand-new browser tab before concluding the fix actually held).

**Live-verified beyond the automated suite:** hover-open and dark-mode rendering on the Playground;
`side`-based repositioning on the `All sides` story (a `right`-sided tooltip actually rendering to
the right of its own trigger, overlapping the next button as expected); the `bg.neutral`/
`text.on-neutral` pairing correctly staying a light solid-fill even in dark mode (the established
"dark-mode solid-fill" convention already verified for this exact pairing in
`03-token-system-spec.md`, not a new contrast concern); the real skip-delay behavior end-to-end via
the `SharedProviderInteraction` play function, run in the actual Playwright browser rather than
assumed from the implementation alone.

Tests: 6 → 15 (unit) + 7 story tests (up from 3, all now genuinely `args`-driven; 2 carry `play`
functions). Self-verified: `tsc --noEmit`, `eslint --max-warnings 0` (both clean, package-wide), the
full Vitest suite (22/22 for `Tooltip` specifically across both projects, 1310/1310 package-wide), a
real `tsup` build, `pnpm audit` (zero known vulnerabilities), and `check-component-bundle-size`
(0.51KB JS / 0.36KB CSS gzipped for the whole `Tooltip` folder, `TooltipProvider` included — well
under budget).

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own; awaiting that
confirmation before this entry (and `07-storybook-and-documentation-standards.md` §6's status table)
records a Finalized date.

## Related components

`Button`/`IconButton` (the most common `Tooltip` triggers), `Collapse` (the precedent this review's
Docs-page-embedding play-function split and `asChild`-adjacent native-passthrough gap followed),
`ThemeProvider` (the precedent for a co-located, app-root-level provider component,
`skipDelayDuration`'s own reason for existing).

**Follow-up (2026-09-05, same day), at user request — two Storybook Controls-panel polish items.**

- **`delayDuration` and `aria-label` showed as inert "Set number"/"Set string" placeholder buttons**
  in the Controls panel instead of a genuinely interactive input — both had a real `argTypes.control`
  configured, but neither had a value in `meta.args`, and Storybook renders an unset optional arg as
  a "click to initialize" placeholder regardless of its control config (`06-engineering-standards.md`
  §9's own "not an inert placeholder" requirement). Fixed by adding both to `args`:
  `delayDuration: 400` (matching the component's real standalone default) and `"aria-label": ""` (no
  true default, but confirmed safe against Radix's own `ariaLabel ? ... : ...` branching — an empty
  string is falsy, so it behaves identically to "not set," the same reasoning already used for
  Avatar's own `""`-default string props). Verified live: `delayDuration` now renders a real
  `<input type="number">` (value `400`); `aria-label` renders a real `<textarea>` (my first DOM check
  missed this since I only queried for `input`/`button`/`select`, not `textarea` — corrected before
  concluding it was still broken).
- **`ToggleInteraction`'s and `SharedProviderInteraction`'s open/close happened too fast to watch**,
  the same gap already fixed for `Collapse`'s own interaction story. Added `setTimeout`-based pauses
  to both, placed only where they can't affect the actual assertions: for `SharedProviderInteraction`
  specifically, a pause is safe before the very first hover and while a tooltip is genuinely open
  (the `skipDelayDuration` clock only starts once a tooltip *closes*), but deliberately **not**
  between the unhover/hover pair itself, since that transition staying fast is the exact behavior
  under test — confirmed the skip-delay assertion still passes after adding the pauses elsewhere
  (re-ran the real-browser suite three times, 7/7 each time).
  **Investigated, not just observed, an apparent failure while manually verifying this live:**
  reloading `ToggleInteraction` directly in the Browser pane consistently failed its final
  `not.toBeInTheDocument()` assertion, but the real automated Playwright suite passed reliably every
  time. Root-caused rather than assumed identical to Backdrop's own earlier instance of this: checked
  `document.hidden`/`visibilityState` directly on the affected tab and confirmed `hidden: true` —
  browsers throttle CSS animation timelines on a hidden page, so the tooltip's fade-out exit
  animation was still genuinely running, just far slower than the `waitFor`'s 1000ms timeout allowed
  for. Not a `Tooltip`/`Presence` defect; recorded here so a future live-check of either interaction
  story doesn't misread the same pane-visibility artifact as a real regression.

Neither follow-up changed `Tooltip.tsx`/`TooltipProvider.tsx`/`Tooltip.types.ts`/`.module.css`.
`tsc`, `eslint`, and the full Vitest suite (1310/1310, no count change) all clean.

**Follow-up (2026-09-05, same day), at user request — Properties table showed no Default for
`delayDuration`/`disableHoverableContent`.** Both correctly show `—` for the same underlying reason
noted above (no literal destructuring default in code, on purpose — an unset value has to stay
`undefined` so it can inherit an ambient `TooltipProvider`'s own value instead of always shadowing
it), but `—` reads as "no default" rather than "a real default that just isn't a literal in the
function signature." `PropertiesTable` (`.storybook/blocks/PropertiesTable.tsx`) reads its Default
column from `argType.table.defaultValue.summary`, a value independent of what docgen infers from
code — set explicitly in `Tooltip.stories.tsx` to `"400"`/`"false"`, matching the effective
standalone values already documented in each prop's own description. Verified live: both now show
their real default in the Properties table. Storybook-only; no component code changed. `tsc`,
`eslint`, and the full Vitest suite (1310/1310) all clean.

**Final pre-finalization pass, 2026-09-05.** Re-ran the full `06-engineering-standards.md` §9
checklist against the current state (all prior fixes/follow-ups above included), rather than
assuming they still hold:

- **Found and fixed one more instance of the same Default-column gap**: `defaultOpen` also has no
  literal destructuring default in `Tooltip.tsx` (Radix's own `useControllableState` applies its
  internal `?? false` fallback instead, the same reasoning already applied to `delayDuration`/
  `disableHoverableContent`), so it showed `—` in the Properties table despite its own JSDoc
  documenting `@default false` — missed in the earlier pass since its Controls-panel behavior was
  already correct (it has a real value in `meta.args`) and only the separate `table.defaultValue`
  override was absent. Fixed the same way, verified live.
- **Live-verified**: hover-triggered open, Purple/Emerald × Light/Dark (Playground), mobile viewport
  (375px, clean wrap, no overflow), the Docs page end to end in a genuinely fresh tab (all 10
  sections, zero console errors, all 16 Properties rows correct, both `RelatedCard`s aligned and
  linking correctly, `TokenRow` swatches resolving for the two color tokens).
- **Two live-testing artifacts worth recording, not component bugs**: keyboard-Tab focus in the
  Browser pane didn't visibly open the tooltip even after well over the delay — confirmed focus
  genuinely landed on the trigger (`document.activeElement`) but `data-state` stayed `"closed"`;
  re-ran the automated `"shows its content when the trigger receives focus"` unit test in isolation
  and it passed cleanly, matching the same class of synthetic-keyboard-event limitation already
  documented for `Collapse`'s own final review. Separately, a long-lived browser tab that had
  navigated many times within this session intermittently reported `document.body.scrollHeight` in
  the tens of thousands of pixels and correspondingly nonsensical `getBoundingClientRect` positions
  for otherwise-correct content (confirmed by re-checking the identical page in a fresh tab each
  time and getting legitimate ~10,000px heights and correctly-aligned elements) — a Storybook-client
  navigation-accumulation artifact, not a rendering defect; noted here so a future session doesn't
  misread a stale long-lived tab's own measurements as a real regression.
- **Accessibility addon panel**: not independently checkable in this session (stuck at "Preparing
  accessibility scan" — requires `test:storybook:watch` running alongside `storybook dev`, per
  `guidelines/adr/0003`, a standing environmental requirement, not a `Tooltip`-specific gap). Relied
  on the automated jest-axe test instead (zero violations, part of the suite below).
- **Full re-verification**: `tsc --noEmit`, `eslint --max-warnings 0`, the full Vitest suite (22/22
  for `Tooltip` specifically across both projects, 1310/1310 package-wide), a real `tsup` build,
  `pnpm audit` (zero known vulnerabilities), and `check-component-bundle-size` (0.51KB JS / 0.36KB
  CSS gzipped for the whole `Tooltip` folder, `TooltipProvider` included — well under budget). No
  other findings.

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own.

**Finalized 2026-09-05** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Tooltip (code, stories, docs, or its tokens) without asking first.

## Post-review fix: 7 props missing from 2 stories' inert-control overrides (2026-09-09)

Part of a cross-component sweep (originating from `Portal`'s own review, see
`guidelines/component-reviews/Portal.md`) for stories whose fixed `render` ignores `args` but whose
Controls panel still shows live-looking toggles doing nothing (`07-storybook-and-documentation-
standards.md` §5's own convention). `MultipleWithSharedProvider` and `SharedProviderInteraction`
each only dashed `children`/`content`, leaving `side`/`align`/`delayDuration`/
`disableHoverableContent`/`hideArrow`/`defaultOpen`/`aria-label` showing as live-looking controls
despite both stories' fully-bespoke, zero-arg renders ignoring every one of them. Fixed by adding
all 7 missing keys to both stories' `argTypes`. Pure Storybook-metadata fix, no runtime code
touched. Live-verified: all 15 controls now show `-` on `MultipleWithSharedProvider`. Full suite
re-run clean.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the earlier atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: four panels printed `aria-label="" defaultOpen={false} delayDuration={400} disableHoverableContent={false} hideArrow={false} side="top"` inside the story's padding wrapper, "Icon-only trigger" printed its icon as `{ $$typeof: Symbol(react.forward_ref), render: () => {} }`, and "Multiple tooltips" showed the story object with a nine-entry `argTypes` block. Every story now sets `parameters.docs.source.code` to a snippet from the new `Tooltip.snippets.ts`, and the Playground, "Default" and "Icon-only trigger" build theirs from the live controls, reading the trigger control's option key. The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Docs example corrected, 2026-09-26 (docs-only; stays Finalized)

At explicit direction. The `TooltipProvider` code example used icons that don't exist (`BoldIcon`, `ItalicIcon`; the package has `TextBIcon` and `TextItalicIcon`) and wrapped them in a `<Toolbar>`, which is not built yet (item 27), so it could not compile. It now uses the two real icons in a `ButtonGroup`, and the example typechecks against the real components. Found by typechecking `ButtonGroup`'s snippets and then scanning every snippet and Docs page for icon names the icons package doesn't export and for unbuilt components (none left).

## Post-Finalization follow-up (2026-10-10, at explicit direction) — the entrance scale is a token
The enter keyframes held `scale(0.96)` as a literal, the same one `Popover`, `HoverCard` and `Tooltip` shared. It is now `motion.scale.96`, a primitive added with `Dialog`'s `motion.scale.98`. The value is the same, so nothing renders differently. **Finalized status unchanged** — a CSS value moved to its token, no new props, behaviour or output. Its Docs page lists the token in "Design tokens used".

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `Tooltip` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `Tooltip` fails when the wrapper is removed (checked for `Popover`).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
