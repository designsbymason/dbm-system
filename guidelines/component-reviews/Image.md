# Image — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-03. The image/fallback state machine
itself (the `failed`/`prevSrc` pattern) was already sound and matches `Avatar`'s own established
precedent — but comparing directly against `Avatar` (the closest precedent for this exact
"wrapper + conditional image/fallback content" architecture) surfaced several real, concrete
behavioral gaps Image had that Avatar had already solved.

**Fixed:**
- **Confirmed high-severity bug: a consumer-provided `onError` silently replaced Image's own
  internal fallback-triggering handler.** `{...props}` (which includes any consumer `onError`,
  since it wasn't destructured out) was spread *after* the internal `onError={() => setFailed(true)}`
  on the `<img>`, so a consumer who also wanted their own error callback (logging, retry, telemetry)
  would completely break the fallback-on-error feature — the internal handler would never run.
  Fixed by destructuring `onError` and composing both, matching `Avatar`'s own already-correct
  `onError` handling exactly (JSDoc copied near-verbatim: "called after the fallback has already
  taken over, not to control the fallback itself").
- **Confirmed bug: `id`/`data-testid` (and any other prop) vanished entirely in the fallback
  state.** `{...props}` was only ever spread inside the `<img>` branch — the persistent wrapper
  `<span>` that `ref` already forwards to got only `className`/`style`, never the rest. A
  `data-testid` used to find the component in a test, or an `id` an external `aria-labelledby`
  points at, would silently disappear the moment `src` failed or was omitted. `Avatar`'s own
  identical architecture spreads `{...props}` once, on its outer wrapper, regardless of which
  internal state (image/initials/icon) is showing — Image now matches that. Native `<img>`-only
  attributes (`width`, `srcSet`, etc.) stay applied only within the `<img>` branch, since they have
  no meaning on the wrapper or during fallback.
- **Confirmed accessibility bug: the fallback unconditionally asserted `role="img"`, even for a
  deliberately decorative `alt=""`.** A native `<img alt="">` is automatically skipped by assistive
  tech; the fallback state didn't mirror that — it always exposed an empty-named `role="img"`
  regardless. Fixed: `alt === ""` now renders the fallback with `aria-hidden="true"` and no `role`,
  matching the loaded state's own behavior (and the same decorative/meaningful toggle pattern
  already established on `Icon`'s own `label` prop).
- **`aspectRatio` had no dev-mode validation**, unlike `AspectRatio`'s own established precedent
  for the identical prop shape (a plain ratio number) — an invalid value (`0`, negative, `NaN`)
  silently produced a broken CSS `aspect-ratio` with no warning. Added the same
  `console.warn`-in-development check, copied from `AspectRatio.tsx`.
- **`ImageRadius` was missing `3xl`** — the primitive radius scale's own 9th step. Since this prop's
  entire purpose is exposing that scale, the omission read as an incomplete enum with no stated
  rationale (system-wide audit: no other component currently consumes `radius-3xl` either, so this
  wasn't a copy-paste of an existing gap — just an overlooked step). Added the type, CSS class, and
  a `2026-09-03` gallery story.
- **`id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc** — the same
  established gap as every other reviewed component, with an extra note here on *where* each
  applies (the wrapper), given the bug above.
- **Commonly-relevant native `<img>` attributes** (`width`, `height`, `srcSet`, `sizes`,
  `decoding`) weren't explicitly redeclared with JSDoc — matching `Input`'s own established audit
  precedent for curating (not exhaustively enumerating) the relevant native attributes of a
  component's underlying element.
- **No Playground story existed** — added. Fixing it surfaced that `objectFit`/`radius`/`loading`
  had no default value anywhere in the story file's `args` (only `src`/`alt` did) despite having
  `argTypes` entries — every pre-existing story's own Controls panel was silently showing inert
  placeholders for all three, on every story, not just Playground. Fixed by giving the meta-level
  `args` real defaults for all three. `aspectRatio` (no true default) got a sensible non-blank
  demo value (`4/3`) for the same reason — confirmed live before the fix (an inert "Set number"
  button) and after (a real, editable number input).
- **No gallery stories existed for `radius` or `objectFit`** — `07-storybook-and-documentation-
  standards.md` §4 item 4 calls for a static reference of every meaningful value; added `AllRadii`
  (all 9 steps, including the newly-added `3xl`) and `AllObjectFit` (a wide placeholder image
  against a square box, so the five modes are actually visually distinguishable).
- **Proactively audited every story for the "Show code" dump bug found on `Icon`'s own review**
  (a story with an implicit/`{...args}`-driven render and a non-primitive resolved arg — a real
  `ReactNode`/component reference — breaks Storybook's own source-reconstruction panel).
  `BrokenWithFallback` was the one at-risk story (its `fallback` arg was a real `<Icon icon={...}>`
  element passed through `args`); converted to a literal, args-free render, matching the general
  fix already documented in `07-storybook-and-documentation-standards.md` §4.1. Playground itself
  never sets a live `fallback` value (left `undefined`, matching its own real optional-with-no-
  default state) specifically to avoid this — confirmed clean live.
- Docs page (`Image.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground live-control check, Properties table, both Do/Don't
  Callouts, the Accessibility Callout, all radius/objectFit gallery stories, the "Show code" panel
  on `BrokenWithFallback`), across both brands, both light/dark modes, and mobile viewport.

**Added after the initial pass (at explicit direction, 2026-09-04):** `fallback` had no built-in
default — omitting it (and having no `src`) rendered an empty, contentless placeholder box (still
correctly styled and correctly accessible, just visually blank). Added a real default: a generic
`Icon icon={ImageIcon} size="xl"` (inheriting `text.tertiary` via `currentColor`, the same color
the fallback box already used), shown whenever `fallback` is `undefined`/`null`; passing `fallback`
still overrides it entirely, via a plain `fallback ?? <default icon>`. Split the old
`BrokenWithFallback` story into `BrokenDefaultFallback` and `BrokenCustomFallback` (a visually
distinct icon, `UserIcon`, so the override reads clearly against the default) so both states have
their own gallery reference; simplified `Decorative`'s second instance to rely on the new default
instead of redundantly passing the same icon by hand. Docs page, JSDoc, and Design tokens section
updated to match (added `icon-size.xl`, noted `text.tertiary` also drives the default icon's color).
Tests: 19 → 22 (default fallback on missing `src`, default fallback on load failure, custom
`fallback` overriding the default). Re-verified: `tsc`, `eslint`, full Vitest suite (899 tests),
the Storybook/`addon-vitest` project (320 tests, all 50 files), a real build, and
`check-component-bundle-size` (1.22KB JS / 0.44KB CSS gzipped — within budget, up from 0.81KB/
0.25KB now that `Icon`/`ImageIcon` are real dependencies of `Image` itself, not just its stories).

**Added after the initial pass, part 2 (at explicit direction, 2026-09-04): `width`/`height` now
actually size the box.** Answering a follow-up question ("how do `aspectRatio` and `width`/`height`
work together?") surfaced that they didn't — `width`/`height` were only ever spread onto the inner
`<img>` as native HTML attributes, and `.image`'s own `width: 100%; height: 100%` CSS rule silently
overrode them for actual layout, confirmed live (`getBoundingClientRect()` identical before/after
setting `width="900" height="50"` on a rendered `<img>`). Fixed by also applying `width`/`height` to
the wrapper's own inline style (alongside `aspectRatio`, which already worked correctly there).
Resolution rules, confirmed by explicit direction then verified against real (non-jsdom) browser
layout:
- `aspectRatio` alone → unchanged, existing behavior (sized by surrounding layout).
- `width` or `height` alone, no `aspectRatio` → applied to the wrapper, other axis stays naturally
  sized — no warning.
- `width`+`height` (no `aspectRatio`) or `width`/`height` + `aspectRatio` (one dimension, ratio
  computes the other) → **no new JS logic needed at all** — CSS's own `aspect-ratio` resolution
  already ignores itself once both dimensions are definite, and already fills in a missing one when
  paired with a single dimension. Confirmed with a live, non-React DOM fixture built from the
  page's own real compiled CSS classes: `width=200,height=100,aspectRatio=1` (conflicting) still
  rendered 200×100; `width=200,aspectRatio=2` and `height=100,aspectRatio=2` both correctly computed
  the missing axis to render identically at 200×100.
- `width`+`height`+`aspectRatio`, genuinely conflicting (ratio mismatch beyond a `0.01` tolerance) →
  a dev-mode `console.warn` (matching the existing `aspectRatio`-validity warning's tone/pattern),
  since `width`/`height` winning silently would otherwise look like `aspectRatio` doing nothing.
  Redundant-but-consistent triples don't warn — only an actual mismatch does. Only checked when
  both `width`/`height` are plain numbers; a string dimension (`"100%"`) can't be compared
  numerically, so it's skipped rather than guessed at.
- `width`/`height` still also land on the `<img>` itself as native attributes (unchanged), on top of
  now sizing the wrapper.

Added a `SizingPrecedence` gallery story and updated the Docs page (Intro, Usage guidelines, Best
practices, Code examples, Properties order, Playground defaults/controls) throughout. `width`/
`height` argTypes flipped from `control: false` to real `"number"` controls in the Playground, with
consistent demo defaults (200/150/4:3) set as a *local* override on the `Playground` story only
(not the shared meta `args`), specifically so `AspectRatio169`/`Rounded` — which inherit meta args
and only override `aspectRatio`/`radius` locally — aren't affected. Tests: 22 → 31 (wrapper sizing
from width/height alone or together, native `<img>` attributes still present, width+aspectRatio,
height+aspectRatio, conflict warning fires, no warning when consistent, no warning with only one
dimension, no warning/no crash on string dimensions). Re-verified: `tsc`, `eslint`, full Vitest
suite (908 tests), the Storybook/`addon-vitest` project (321 tests, all 50 files — including a live
confirmation that the conflict warning fires in a real browser run, not just jsdom), a real build,
and `check-component-bundle-size` (1.48KB JS / 0.44KB CSS gzipped — within budget).

**Added after the initial pass, part 3 (at explicit direction, 2026-09-04): a real placeholder
photo, replacing the generated SVG-rectangle placeholders.** User-provided image saved to
`.storybook/public/placeholder-img.jpg` (1000×667, ~3:2 landscape) — Storybook-tooling-only, not
shipped in the published package, matching the same `staticDirs`-served pattern already
established for the sidebar logo (`.storybook/public/logo.svg`, wired in `.storybook/main.ts`).
Replaced both prior data-URI constants (`PHOTO_URL`, and `WIDE_PHOTO_URL` — a separate wider
rectangle kept specifically for the object-fit gallery) with one `PLACEHOLDER_IMAGE_URL` constant,
since the real photo's own natural landscape ratio already makes `cover`/`contain`/`fill`/`none`/
`scale-down` visually distinguishable in a square box without needing a second, more-exaggerated
asset. Used everywhere a real loadable image serves the story's purpose — `Default`, `AllRadii`,
`AllObjectFit`, `SizingPrecedence`, `Decorative`'s loaded half, and the meta-level default —
deliberately **not** used in `BrokenDefaultFallback`/`BrokenCustomFallback`, which keep their
existing intentionally-invalid URL, since their whole point is demonstrating the fallback. Scoped
to `Image` only, at explicit direction — not reused elsewhere (e.g. `Avatar`) in this pass. Verified
the asset survives a real `build-storybook` (present in `storybook-static/`) and stays within the
existing `check-storybook-bundle-size` budget (11.4MB / 20MB total budget; the per-chunk check
doesn't cover `public/` assets at all, only `assets/`-bundled JS/CSS).

**Fixed after the initial pass, part 4 (found via a direct Controls-panel audit, 2026-09-04):
`width`/`height` regressed into inert "Set number" placeholders on every story except
`Playground`.** Flipping `width`/`height` from `control: false` to a real `"number"` control (part
2 above) only gave them a value in `Playground`'s own local `args` — every other story inherited
the live control shape with no value anywhere (neither local nor meta-level `args`), the exact
"arg left `undefined` renders as an inert placeholder" failure mode this project already tracks as
a recurring bug class. Confirmed live, story by story, not just by reading the code: `Default`,
`AllRadii`, `AllObjectFit`, `SizingPrecedence`, `BrokenDefaultFallback`, `BrokenCustomFallback`, and
`Decorative` all showed "Set number" for both. `AspectRatio169`/`Rounded` had no `argTypes`
override at all (so `src`/`alt`/`objectFit`/`radius`/`loading` were already correctly live with
real values, inherited from meta) but hit the same `width`/`height` placeholder bug. Fixed by
adding `width`/`height` to the shared `disableAllAxes` object (covers the first seven) and a
separate, smaller `disableWidthHeight` override on `AspectRatio169`/`Rounded` specifically — a
plain `disableAllAxes` there would've also hidden `aspectRatio`/`radius`, the exact props those two
stories exist to demonstrate. Re-verified every affected story live afterward (not just the two
spot-checked during the original add) — all now show "–", `Playground` unaffected and still fully
live.

**Added after the initial pass, part 5 (at explicit direction, 2026-09-04): a `position` prop,
mapping to CSS `object-position`.** A natural companion to `objectFit` — most visible paired with
`objectFit="cover"` (which crop is shown) or `"none"`/`"scale-down"` (which side any leftover space
lands on); a true no-op only under `"fill"`, since nothing is left over to position within once the
image is stretched to exactly fill its box. Scoped as a curated 9-value enum (`center` default, the
four edges, the four corners) rather than accepting an arbitrary CSS value/percentage, matching this
system's existing convention for `radius`/`objectFit` (a constrained scale, not raw CSS passthrough).
Named `position` per explicit direction, with JSDoc calling out that it sets `object-position`, not
layout `position` (`static`/`absolute`/etc.) — a real naming collision risk worth flagging plainly
given how overloaded "position" is in CSS. Added an `AllPositions` gallery story (a small square box
with `objectFit="cover"`, so all 9 crops are visibly distinct against the real placeholder photo),
wired into the Playground, and updated the Docs page throughout (Intro, Usage guidelines, Best
practices — including a correction mid-writing: an early draft of the Best-practices bullet claimed
`position` was a no-op under every mode but `cover`, which is wrong for `contain`/`none`/
`scale-down`'s own letterbox-alignment effect — fixed before publishing). Tests: 34 → also covers
the default (`center`), a direct value (`top`), and all four corner-to-two-keyword mappings
(`top-left` → `left top`, etc.).

**Also fixed in this pass: `width`/`height` regressed into inert "Set number" placeholders on every
story except `Playground`** (found via a direct Controls-panel audit, requested separately) —
see the dedicated write-up above this section for the full detail; noted here only because the fix
landed in the same working session as `position`, immediately before it.

Also updated the shared placeholder `alt` text from "Placeholder graphic" to "Placeholder image"
across all four stories that used it (the meta default, `Default`, and both broken-src stories), at
explicit direction — purely cosmetic, no behavior change.

**Noted during the pass, fixed the same session (not part of Image's own scope):** `Bleed`'s and
`AspectRatio`'s own Storybook accessibility tests were found failing on a real `text.tertiary`-on-
`bg.canvas` contrast violation (4.13:1, below the 4.5:1 floor) while running this review's own full
`vitest --project=storybook` suite — confirmed pre-existing (reproduced on the base commit with
this review's changes stashed), unrelated to Image. Fixed directly (swapped the two story files'
own demo `text.tertiary` to `text.secondary`) rather than left as a separate flagged task, and the
underlying `03-token-system-spec.md`/token-source documentation gap it exposed (a stale pre-fix
contrast figure, and an unmeasured light-mode value) was corrected too — see that doc's own
`bg.canvas`/`text.tertiary` rows and the `bg.canvas` token's `$description` in all 4
`packages/tokens/src/semantic/*.json` files for the full detail.

Tests: 13 → 19 (added: `onError` composition, `id`/`data-testid` surviving the fallback swap, the
decorative-vs-meaningful fallback a11y split, the `aspectRatio` dev-warning, the `3xl` radius step).

**Final review pass (2026-09-04), before finalizing:** re-ran the full `06-engineering-standards.md`
§9 checklist end to end against the component's current, fully-accumulated state (default fallback,
`width`/`height`/`aspectRatio` sizing, the real placeholder photo, the `position` prop, and the
Controls-panel fix all layered in across the session). Found and fixed two real gaps:
- **`bg.neutral-subtle` + `text.tertiary` — Image's own fallback pairing — had the identical
  "unverified light-mode figure" documentation gap already found and fixed for `bg.canvas` earlier
  in this same review.** Computed precisely (WCAG relative-luminance formula, cross-checked against
  the already-passing live `addon-vitest` a11y scans covering every fallback-rendering story):
  **4.51:1 — clears the 4.5:1 AA floor, but by a razor-thin 0.01 margin.** Recorded in
  `03-token-system-spec.md`'s `bg.neutral-subtle`/`text.tertiary` rows and the `neutral-subtle`
  token's own `$description` in all 4 semantic theme files, matching the same precedent/phrasing
  already established for `bg.info-subtle`'s own "tightest margin" flag. Not a violation — a
  real, verified (if narrow) pass — but worth having on record given how close it sits to the floor.
- **`jest-axe` coverage had two real, shipped states it never actually scanned**: the default
  icon fallback (no custom `fallback`, no `src`) and the decorative (`alt=""`) case in both the
  loaded and fallback states. Added both.

No other gaps found — the full Storybook Controls panel, Properties table ordering, Variants
gallery, Usage guidelines, Best practices, Accessibility callout, Code examples, and Design tokens
section were all re-read fresh against the component's current prop set and found consistent and
current. Verified live in the browser across all 4 themes (both brands × both modes) and mobile
viewport on both the Docs page and the `AllPositions` gallery.

Tests: 19 → 36 across the full session (defaults/fallback, `onError` composition, `id`/`data-testid`
survival, decorative a11y, `aspectRatio` validation, `3xl` radius, `width`/`height` wrapper sizing
and native-attribute passthrough, the sizing-precedence warning/no-warning cases, `position`
defaults and corner-value mapping, and the two axe additions above).

Self-verified (final pass): `tsc --noEmit` (both the package and `.storybook`), `eslint
--max-warnings 0`, full Vitest suite (913 tests package-wide), the full Storybook/`addon-vitest`
project (322 tests, all 50 files — including a live confirmation that the `width`/`height`
conflict warning fires in a real browser run), a real `tsup` package build, `check-component-
bundle-size` (1.56KB JS / 0.44KB CSS gzipped — within budget), and `check-foundations-token-
coverage` (clean, confirming the token-description edits didn't add/rename any token needing a
Foundations/Color.mdx entry).

**Icon-token correctness fix (2026-09-04, caught in review by the user):** the fallback's icon color
was set via `text.tertiary` (`Image.module.css`'s `.fallback`) — a text token, even though nothing
textual renders there; only the icon glyph consumes it, via `currentColor`. Moved to `icon.default`,
the token category this project's own convention actually calls for on an icon. Same underlying
value in every theme (`gray.600` light / `gray.300` dark), so no visual or contrast change — the
`bg.neutral-subtle` figure moved from `text.tertiary`'s row to `icon.default`'s own row in
`03-token-system-spec.md` and all 4 semantic token files, correcting the earlier session's
mis-attribution rather than adding a new figure. Re-verified live in a running Storybook instance
(computed color unchanged, `_fallback_*` CSS rule now reads `color: var(--dbm-icon-default)`) and
via the full check suite: `tsc --noEmit`, `eslint --max-warnings 0`, 913 unit tests, 322
Storybook/`addon-vitest` tests (all passing, confirming no contrast regression), a real build, and
`check-component-bundle-size` (1.56KB JS / 0.43KB CSS — unchanged).

**Review pass complete, 2026-09-04.** All checklist items closed.

**Finalized 2026-09-04** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Image (code, stories, docs, or its tokens) without asking first.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the earlier atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: eight panels showed the story object itself, built from `radiusOptions`, `objectFitOptions`, `positionOptions` and a `PLACEHOLDER_IMAGE_URL` constant; the Playground, "Locked aspect ratio" and "Rounded" printed every default plus `aspectRatio={1.3333333333333333}` / `{1.7777777777777777}` and the story's own `/placeholder-img.png`. Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `Image.snippets.ts` — each keeping the one sized container an `Image` needs, since it fills its container's width — and the three args-driven stories build theirs from the live controls, writing the ratio as a fraction (the helper is shared with `AspectRatio`'s snippets). The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.
