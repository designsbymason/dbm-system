# DBM System — Token Spec

Companion to `packages/tokens/src/` (the actual generated token files in W3C Design Tokens Community Group format — ready to feed into Style Dictionary and, later, the Tokens Studio Figma plugin for design-file sync).

## Architecture: 3 layers

1. **Primitive** (`primitive/*.json`) — raw values, no meaning. Color scales, spacing steps, radii, shadows, etc.
2. **Semantic** (`semantic/*.json`) — contextual meaning, references primitives via `{color.purple.600}`-style aliases. **One file per theme** (brand × mode). This is where multi-brand and light/dark actually live — the token *names* (`bg.brand`, `text.primary`) stay identical across every theme file; only what they resolve to changes.
3. **Component** (`component/*.json`) — component-scoped tokens for values a specific component needs that don't belong in the shared primitive/semantic scales. See "Component-layer tokens" below.

Status/neutral tokens (red, amber, green, blue, gray) are **shared across both brand themes** — success is always green, danger is always red, regardless of which brand is active. Only the "brand" slots (bg.brand, text.brand, border.focus, icon.brand) swap per theme. This is a deliberate consistency principle, not an oversight — status meaning shouldn't be reinterpreted by theme.

## What's in each primitive file

| File | Contents |
|---|---|
| `color.json` | 11-step (50–950) scales for `purple`, `emerald`, `gray`, `red`, `amber`, `yellow`, `green`, `blue`, plus `neutral.white`/`neutral.black` |
| `typography.json` | Font families (Nunito primary, Lora secondary, mono system stack for Code/Kbd, which loads no extra font), weights, fluid font-size scale, line-heights, letter-spacing |
| `spacing.json` | 4px-base numeric scale, `0` through `32` (=128px) |
| `radius.json` | Steps in line with `spacing.json` rather than following its own curve: `none`(0) → `xs`(2) → `sm`(4) → `md`(8) → `lg`(12) → `xl`(16) → `2xl`(24) → `3xl`(32) → `full`(9999, pills/circles, deliberately outside the linear ladder) |
| `shadow.json` | Layered elevation shadows, **separate light/dark values** — dark-mode shadows are higher-opacity black, not a naive inversion, and should pair with a subtle border on raised surfaces |
| `breakpoint.json` | `sm`(640) → `3xl`(1920, for enterprise dashboard monitors) |
| `motion.json` | Duration scale (`instant` at 0ms through 600ms), a scale (`96` and `98`: the size a small floating surface or a large panel starts from as it enters; `102`: how far a panel swells at the peak of an attention pulse), + 5 easing curves — `standard`/`decelerate`/`accelerate`, an "emphasized" expo-out curve for premium micro-interactions, and `linear` (a cubicBezier token equal to the CSS `linear` keyword, so a constant-rate curve goes through the same build pipeline as the others instead of being hardcoded) |
| `other.json` | Icon sizes (paired with Phosphor, 12–48px), border widths, opacity scale (`0`/`5`/`10`/`20`/`40`/`50`/`60`/`80`/`90`/`100`), z-index layering scale |

**Stacking.** The z-index scale fixes the order between kinds of layer: overlay (1300, a scrim), modal (1400, a dialog panel), popover (1500), toast (1600), tooltip (1700). A floating panel opened from inside a dialog (a popover, a select list) therefore sits above it: portaled panels are on the `popover` step, not `dropdown`, which is for in-flow layers such as a scrolling strip's edge fades ([ADR-0054](adr/0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md)). Two layers of the same kind (a dialog opened from a dialog, or an alert dialog opened from a dialog) stack by the order they were portaled to `document.body`, and their scrims stack too, so the page behind goes darker with each (`scrimOpacity` lightens one). There is no layer manager; none is needed while each kind has its own step. A toast sits above a modal dialog's scrim and stays clickable whether it was raised before the dialog opened or after.

### Fonts

`Nunito` (primary) and `Lora` (secondary) are named in `typography.json`, but the token package ships no font files. Storybook loads both families at all four weights through `.storybook/preview-head.html`, which is Storybook-preview-only and not shipped in `@dbm-system/components` (`07-storybook-and-documentation-standards.md` §8 covers that category of asset). A component that uses `fontFamily.secondary` without the real font loaded renders the browser's own fallback (`Georgia, serif`), which ships only regular and bold, so `weight` appears to do nothing there. **Open:** whether and how a consumer of the published package loads these two fonts (a documented `<link>`/`@font-face` snippet, a docs-site default, or an accepted fallback-stack-only stance); tracked with the CSS-loading question in `01-vision-and-goals.md` §12.

## Color scale generation

Scales are generated in OKLCH by `packages/tokens/scripts/generate-color-scales.mjs` using `culori` (MIT-licensed, a devDependency scoped to `packages/tokens`, never shipped to consumers). An 11-step OKLCH lightness curve shared across the scales gives perceptually even steps, unlike HSL lightness, which is not perceptually uniform (an HSL-generated `text.success` once failed AA for that reason). Chroma tapers toward both ends of each scale and is gamut-clamped with `culori.clampChroma`, so every generated value is a valid, displayable sRGB hex.

- **`purple-600` (`#5548A4`) and `emerald-600` (`#2E8A7D`) stay exact** — the two brand-mandated anchors (`01-vision-and-goals.md`'s decisions log). Every other step in those scales is the shared canonical L curve shifted by a constant offset so it passes exactly through the anchor's own OKLCH `L` at 600, which preserves the curve's spacing while hitting the required color.
- **`purple-900` (`#1A133A`) and `purple-950` (`#110C27`) are manual overrides, not generated.** Each carries its own `$description` in `color.json` saying so. **If the generation script is re-run without `--only`, it silently overwrites both back to the generated values**; carry the override forward by hand, or fold it into the script's curve/anchor logic first. `purple.950` has no semantic-token consumer; `purple.900` is consumed by `border.brand-subtle` (dark, purple theme), 1.12:1 against `bg.brand-subtle` (`gray.950`, ADR-0011), inside the same deliberate sub-3:1 decorative-accent exception as that token's other pairings (its own `$description` in `purple-dark.json` has the detail).
- **`yellow-600` (`#949415`) is a third anchor, with its own chroma curve** ([ADR-0042](adr/0042-yellow-is-an-anchored-scale-with-its-own-light-end-chroma-and-the-highlight-semantic-family.md)). Lightness follows the same anchored curve as purple and emerald, but each light step takes a fixed share of the largest chroma sRGB can show at that lightness and hue (`50` 0.30, `100` 0.52, `200` 0.68, `300` 0.76, `400` 0.80, `500` 0.83, `700` and darker 0.85) instead of the shared taper, which was tuned for blue and purple and left yellow's `50` to `300` a dull olive-grey. `yellow-600` is only 3.23:1 against white, so some semantic roles sit on other steps. Generate it with `node packages/tokens/scripts/generate-color-scales.mjs --only=yellow`, which writes that one scale and leaves every other value in `color.json` alone.
- **`gray`, `red`, `amber`, `green` and `blue` regenerate fully.** They have no anchor requirement, so every step (including 600) comes from the canonical curve, with each scale's previous 600 value used only to pick a matching hue so the scale keeps its color identity.
- Re-run the script whenever a scale needs re-deriving; a third brand theme reuses the same anchored-scale logic with a new brand hex.

## Fluid typography

Built with the standard "Utopia" clamp() formula: two type scales (ratio 1.2 at 320px viewport, 1.25 at 1440px viewport) interpolated with `clamp(min, preferred, max)`. One deliberate deviation from a textbook fluid scale: **sizes at/below the base step (`xs`, `sm`, `base`) are fixed, not fluid** — scaling small UI text down further on large screens adds nothing and risks going under comfortable reading size. Fluid scaling kicks in from `md` upward, where it actually creates a meaningfully improved heading hierarchy across screen sizes.

Note: `font-size-xs` would compute to ~11px, below the common 12px practical floor for body-adjacent text. It is floored at `0.75rem` (12px exactly).

## Contrast verification

Methodology, then the current state of every semantic token — not a replay of how each one got here. History that still matters (a real decision with alternatives, not just a value tweak) lives in `guidelines/adr/`; the full rationale/history for any individual token's current value lives in that token's own `$description` field in `packages/tokens/src/semantic/*.json` (co-located with the value it explains, and the actual source of truth) — this section is the scannable index into that, not a duplicate of it.

### Methodology

- **AA is the enforced floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only.** See `guidelines/adr/0002`.
- **Text floor is 4.5:1** (WCAG 1.4.3, normal text). **Non-text/graphical floor is 3:1** (WCAG 1.4.11 — icons, borders that identify a component/state boundary, standalone status indicators). A purely decorative accent (e.g. `border.brand-subtle`) isn't bound by 1.4.11 and can sit well under 3:1 deliberately.
- **Disabled-state UI is exempt** from 1.4.3/1.4.11 (WCAG 2.1 explicitly excludes inactive controls) — don't flag a disabled-state pairing as a failure without checking this first.
- **`bg.surface` is the representative background** every token is checked against by default, unless it's specifically meant to sit on something else (e.g. a `-subtle` token pairs with its own family's text/icon token, not `bg.surface` directly).
- **A token with no fixed pairing possible** (`bg.overlay`, `bg.scrim` — both composite over arbitrary, unpredictable content by design) is marked *Exempt* rather than given a fabricated ratio.
- **When adding a new token:** measure the real pairing directly (don't assume an existing token's prior verification covers a new use it was never checked against — this exact mistake happened twice, `bg.skeleton` and `bg.track`, both reusing `bg.neutral-subtle` for a purpose it was never verified for).

### `bg.*`

Dark mode's representative background, `bg.surface`, and several dependent tokens sit darker than a plain step; see [ADR-0011](adr/0011-darker-dark-mode-representative-background.md).

**The `on-*` tokens** (`on-danger`, `on-warning`, `on-success`, `on-info`, `on-neutral`, `on-highlight`), in `bg.*` and `border.*`, are the inverted fill and outline of a control drawn on a solid `bg.<tone>` surface (`Alert.Action`'s primary and secondary on a solid alert). Each has the same value as its `text.on-*` token and is its own token so a component never uses a text token as a fill or a border.

**Brand-agnostic** (identical in Purple and Emerald):

| Token | Light | Dark | Verified against | Status |
|---|---|---|---|---|
| `canvas` | `gray.100` | `gray.700` | `text.primary` 12.41:1 / 6.59:1; `text.secondary` 6.05:1 / 5.10:1; `text.tertiary` **fails, 4.13:1** / **fails, 2.96:1** | AA for `text.primary`/`text.secondary` in both modes. **Never place `text.tertiary` literal text on `bg.canvas`, light or dark** |
| `overlay` | `neutral.black` | `neutral.black` | — | Exempt (no text sits on it; opacity applied separately via `opacity.*`) |
| `scrim` | `neutral.white` | `gray.900` | — | Exempt (no fixed pairing possible — composites over arbitrary external content, same as `bg.overlay`). Dark tracks `bg.surface`'s own value by design (ADR-0011) |
| `surface` | `neutral.white` | `gray.900` | `text.primary` — / 13.53:1; `text.secondary` — / 10.47:1; `text.tertiary` — / 8.21:1 | AA (dark verified explicitly; light is the base case, comfortably higher-margin). Sits at `gray.900` in dark ([ADR-0011](adr/0011-darker-dark-mode-representative-background.md)); the token's own `$description` lists the side effects |
| `danger` | `red.600` | `red.300` | vs `bg.surface`: 5.10:1 / 7.94:1 | AA |
| `danger-hover` | `red.700` | `red.200` | `text.on-danger`: — / 10.68:1 | AA |
| `danger-subtle` | `red.50` | `red.950` | `text.danger`: 7.05:1 / 10.32:1 | AA (light also clears AAA) |
| `danger-subtle-hover` | `red.100` | `red.900` | `text.danger`: 6.43:1 / 8.22:1 | AA |
| `on-danger` | `neutral.white` | `red.900` | label (`text.danger`): 5.10:1 / 8.22:1; vs `bg.danger`: 5.10:1 / 8.22:1 | AA |
| `warning` | `amber.600` | `amber.300` | vs `bg.surface`: 4.78:1 / 8.12:1 | AA |
| `warning-hover` | `amber.700` | `amber.200` | `text.on-warning`: 6.96:1 / 10.54:1 | AA |
| `warning-subtle` | `amber.50` | `amber.950` | `text.warning`: 9.74:1 / 10.44:1 | AAA |
| `warning-subtle-hover` | `amber.100` | `amber.900` | `text.warning`: 8.90:1 / 8.19:1 | AAA |
| `on-warning` | `neutral.white` | `amber.900` | label (`text.warning`): 4.78:1 / 8.19:1; vs `bg.warning`: 4.78:1 / 8.19:1 | AA |
| `success` | `green.700` | `green.300` | vs `bg.surface`: 6.50:1 / 8.42:1 | AA (approaching AAA) |
| `success-hover` | `green.800` | `green.200` | `text.on-success`: 9.56:1 / 10.32:1 | AAA |
| `success-subtle` | `green.50` | `green.950` | `text.success`: 9.15:1 / 10.68:1 | AAA |
| `success-subtle-hover` | `green.100` | `green.900` | `text.success`: 8.42:1 / 8.19:1 | AAA |
| `on-success` | `neutral.white` | `green.900` | label (`text.success`): 6.50:1 / 8.19:1; vs `bg.success`: 6.50:1 / 8.19:1 | AA |
| `info` | `blue.600` | `blue.300` | vs `bg.surface`: 4.71:1 / 8.20:1 | AA |
| `info-hover` | `blue.700` | `blue.200` | `text.on-info`: 6.93:1 / 10.46:1 | AA |
| `info-subtle` | `blue.50` | `blue.950` | `text.info`: **4.5068:1 (tightest margin in the system)** / 10.51:1 | AA light (razor-thin, flagged — revisit if the primitive scale is ever regenerated), AAA dark |
| `info-subtle-hover` | `blue.100` | `blue.900` | `text.info`: 6.10:1 / 8.20:1 | AA |
| `on-info` | `neutral.white` | `blue.900` | label (`text.info`): 4.71:1 / 8.20:1; vs `bg.info`: 4.71:1 / 8.20:1 | AA |
| `highlight` | `yellow.700` | `yellow.300` | vs `bg.surface`: 4.67:1 / 8.97:1; `text.on-highlight`: 4.67:1 / 6.42:1 | AA. The general highlight and accent colour (not a status tone), shared across both brands. Light is `yellow.700`, not the scale's `yellow.600` anchor, because white on 600 is only 3.23:1 |
| `highlight-hover` | `yellow.800` | `yellow.200` | `text.on-highlight`: 6.89:1 / 7.63:1 | AA |
| `highlight-subtle` | `yellow.50` | `yellow.950` | `text.highlight`: 6.64:1 / 9.08:1; `icon.highlight`: 3.11:1 (light) | AA. Light sits at about 1.04:1 and dark at about 1.01:1 against `bg.surface`, deliberate decorative tints like the other subtle fills |
| `highlight-subtle-hover` | `yellow.100` | `yellow.900` | `text.highlight`: 6.13:1 / 6.42:1; `icon.highlight`: **2.87:1** (light) | AA. An icon on this fill takes `text.highlight`'s step in light |
| `on-highlight` | `neutral.white` | `yellow.900` | label (`text.highlight`): 6.89:1 / 8.97:1; vs `bg.highlight`: 4.67:1 / 6.42:1 | AA. The inverted fill of a control drawn on a solid `bg.highlight` surface |
| `neutral` | `gray.600` | `gray.300` | dot vs `bg.surface`: 4.70:1 / 8.21:1; `text.on-neutral`: 4.70:1 / 8.21:1 | AA (dual-purpose: dot fill and solid-fill text host; also `Indicators`' inactive-dot *hover* fill, see `guidelines/component-reviews/Indicators.md`) |
| `neutral-hover` | `gray.700` | `gray.200` | `text.on-neutral`: 6.88:1 / 10.47:1 | AA |
| `neutral-subtle` | `gray.50` | `gray.800` | `text.secondary`: 6.59:1 / 7.47:1; `text.primary`: 13.53:1 / 9.66:1; `text.tertiary`: **4.51:1 (razor-thin — revisit if the primitive scale is ever regenerated)** / 5.86:1; `icon.default` (shares `text.tertiary`'s own primitive step): same figures; `text.link` (light): 4.52:1 | AA. `gray.800` in dark (ADR-0011). `Image`'s fallback state pairs it with `icon.default`, which has the same value as `text.tertiary` in every theme, so the two share these figures |
| `neutral-subtle-hover` | `gray.100` | `gray.700` | `text.secondary`: 6.05:1 / 5.10:1; `text.primary`: 12.41:1 / 6.59:1 (`Table`'s hovered row) | AA. `gray.700` in dark, tracking `bg.neutral-subtle` (ADR-0011) |
| `on-neutral` | `neutral.white` | `gray.900` | label (`text.secondary`): 6.88:1 / 10.47:1; vs `bg.neutral`: 4.70:1 / 8.21:1 | AA |
| `track` | `gray.200` | `gray.700` | vs `bg.surface`: **1.35:1 / 2.05:1** | **Deliberate exception** — fails 3:1, accepted for any track whose own low contrast doesn't block understanding the control (its thumb, fill or handle already carries the boundary and state), scoped by that, not by whether the control is interactive ([ADR-0016](adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md)). Used by the tracks of `ProgressBar`, `ProgressCircle`, `Switch`, `Slider`, `RangeSlider` (which draws with `Slider`'s stylesheet) and `ScrollArea`'s scrollbar. See "Notable exceptions" below |
| `track-strong` | `gray.300` | `gray.600` | vs `bg.surface`: **1.72:1 / ~3.00:1** | **Light does not clear the 3:1 non-text floor; dark sits right at it (razor-thin — revisit if the primitive scale or `bg.surface` is regenerated).** Consumers: `Indicators`' inactive-dot fill and `Switch`'s unchecked *hover* state. `Indicators` originally chose a compliant value for a real, clickable dot, and this value reopens that question for it; see `guidelines/component-reviews/Indicators.md` |
| `code` | `blue.50` | `gray.800` | `text.secondary`: 6.57:1 / 7.47:1 | AA. Shared by the `Code` atom (paired with `text.primary`/`bg.neutral-subtle`) and Storybook's docs. `gray.800` in dark (ADR-0011); `border.code` deliberately does not match it, a visible border by design |
| `code-block` | `blue.50` | `gray.900` | every `text.syntax-*` and `text.secondary`, both modes: 5.3:1 or more light, 7.4:1 or more dark | AA. `CodeBlock`'s own background. Light is the same value as `code`, so a block and an inline `Code` match; dark is a step *darker* than `code` (equal to `surface`), so that the highlighted-line band below can be the lighter of the two, as an emphasised line reads ([ADR-0026](adr/0026-codeblock-highlights-with-a-small-built-in-tokenizer-over-a-highlighting-dependency-or-bring-your-own.md)) |
| `code-highlight` | `blue.100` | `gray.800` | every `text.syntax-*` and `text.secondary`: 5.3:1 or more light, 5.3:1 or more dark | AA. The band behind a highlighted `CodeBlock` line. A lighter dark band cannot work: every syntax colour falls to 3.6–4.1:1 on `gray.700`, which is why the block is darker and the band lighter than it |

**Brand-specific** (Purple / Emerald differ):

| Token | Purple light | Purple dark | Emerald light | Emerald dark | Verified against | Status |
|---|---|---|---|---|---|---|
| `skeleton` | `purple.200` | `gray.950` (shared, no dark brand tint) | `emerald.200` | `gray.950` (shared) | vs `bg.surface`: ~1.35:1 both brands light; 1.11:1 dark | Deliberate sub-3:1 — decorative/`aria-hidden` placeholder, exempt like disabled controls, not a text/1.4.11 case. Dark is `gray.950` (ADR-0011): distinctness from `bg.surface` is 1.11:1, a knowingly accepted trade-off |
| `brand` | `purple.600` | `purple.300` | `emerald.700` | `emerald.300` | vs `bg.surface` (dark, dot use): 7.45:1 / 8.51:1 | AA |
| `brand-hover` | `purple.700` | `purple.200` | `emerald.800` | `emerald.200` | `text.on-brand` (dark): 10.38:1 / 10.55:1 | AA |
| `brand-subtle` | `purple.50` | `gray.950` (shared, drops brand tint) | `emerald.50` | `gray.950` (shared) | `text.link` (light): 4.50:1 (purple) / 4.52:1 (emerald); `text.brand`/`icon.brand` (dark): 8.29:1 (purple) / 7.22:1 (emerald text) / 9.47:1 (emerald icon); `text.brand` (light): 7.03:1 (purple) / 5.83:1 (emerald); `text.secondary`: 6.56:1 (purple light) / 6.59:1 (emerald light) / 11.65:1 (dark); `text.tertiary`: **4.48:1 (purple light, fails)** / 4.51:1 (emerald light, razor-thin) / 9.14:1 (dark) | AA, except `text.tertiary` in Purple light: **never place `text.tertiary` literal text on `bg.brand-subtle`**. Dark is `gray.950` (ADR-0011): its own pairings are strong, it sits at only ~1.1:1 against `bg.surface`, and it shares its value with `bg.skeleton` and `border.neutral-subtle`, an accepted trade-off |
| `brand-subtle-hover` | `purple.100` | `gray.800` (shared, unchanged) | `emerald.100` | `gray.800` (shared, unchanged) | `text.brand` (dark, unchanged): 5.32:1 (purple) / 4.63:1 (emerald); `text.primary` (`DataTable`'s chosen-row fill): 12.38:1 (purple light) / 12.46:1 (emerald light) / 9.66:1 (dark), and the fill itself is quiet against `bg.surface` (1.14:1 light, 1.40:1 dark), so a chosen row is also marked by a `border.brand` edge and its checkbox | AA. **Deliberately held at `gray.800`** — ADR-0011's rejected alternative moved this to `gray.700`, which would have dropped `text.brand` to 3.63:1 (purple) / 3.16:1 (emerald), a real AA text-contrast failure. |

### `text.*`

**The `syntax-*` tokens** are `CodeBlock`'s syntax colours, shared across both brands (code colours are not brand-tinted, like `link`). Each is checked against the lower of `bg.code-block` and `bg.code-highlight`.

| Token | Light | Dark | Verified against | Status |
|---|---|---|---|---|
| `primary` | `gray.900` | `gray.50` | vs `bg.surface` (dark): 13.53:1; vs `bg.canvas` (dark): 6.59:1; vs `bg.neutral-subtle` (dark): 9.66:1 | AAA — highest-contrast text tier, never a close call |
| `secondary` | `gray.700` | `gray.200` | vs `bg.surface` (dark): 10.47:1; vs `bg.canvas` (dark): 5.10:1 | AA/AAA |
| `tertiary` | `gray.600` | `gray.300` | vs `bg.surface` (dark): 8.21:1; vs `bg.neutral-subtle`: **4.51:1 (razor-thin, light)** / 5.86:1 (dark); vs `bg.canvas`: **fails, 4.13:1** (light) / **fails, 2.96:1** (dark) | AA against its actual intended surfaces (`bg.surface`, `bg.neutral-subtle`), though the light-mode `bg.neutral-subtle` figure only barely clears the floor; revisit if the primitive scale is ever regenerated. **Never place on `bg.canvas`, light or dark** — enforced by convention, not a lighter token, since no primitive step closes the gap without colliding with `text.secondary` |
| `disabled` | `gray.400` | `gray.600` | — | Exempt (disabled-state text) |
| `on-brand` | `neutral.white` | `gray.900` (shared both brands) | vs `bg.brand`/`bg.brand-hover` (dark): 7.45–10.55:1 across both brands | AA |
| `on-danger` | `neutral.white` | `red.900` | vs `bg.danger` (dark): 8.22:1 | AA |
| `on-warning` | `neutral.white` | `amber.900` | vs `bg.warning` (dark): 8.19:1 | AAA |
| `on-success` | `neutral.white` | `green.900` | vs `bg.success` (dark): 8.19:1 | AAA |
| `on-info` | `neutral.white` | `blue.900` | vs `bg.info` (dark): 8.20:1 | AAA |
| `on-neutral` | `neutral.white` | `gray.900` | vs `bg.neutral` (dark): 8.21:1 | AA/AAA |
| `on-highlight` | `neutral.white` | `yellow.900` | vs `bg.highlight`: 4.67:1 / 6.42:1 | AA |
| `link` | `blue.600` (shared both brands) | `blue.300` (shared both brands) | vs `bg.surface`: 4.71:1 / 8.20:1 | AA. Identical across all 4 themes, not brand-coloured. **Never place `text.link` on `bg.canvas`, light or dark** — it measures 4.15:1 (light) / 4.00:1 (dark) there, under the 4.5:1 text floor. `bg.canvas` is reserved for special containers; the ordinary page background is `bg.surface`, which `text.link` is verified against (above), and it is also verified on `bg.neutral-subtle` and `bg.brand-subtle` in light mode (see those rows). Where a link has to sit on the canvas, use a neutral-toned link (`text.secondary`, 6.05:1 / 5.10:1 there). Enforced by convention, not a different token, like `text.tertiary` above. An underline doesn't help (it satisfies WCAG 1.4.1, not the 1.4.3 floor), and moving light mode to `blue.700` (6.09:1 on the canvas) was considered and not done |
| `brand` | `purple.600` / `emerald.700` | `purple.300` / `emerald.400` | vs `bg.surface`: 7.37:1 (purple) / 6.08:1 (emerald) light; 7.45:1 (purple) / 6.49:1 (emerald) dark | AA/AAA |
| `danger` | `red.600` | `red.300` | vs `bg.surface`: 5.10:1 / 7.94:1 | AA |
| `warning` | `amber.600` | `amber.300` | vs `bg.surface`: 4.78:1 / 8.12:1 | AA |
| `success` | `green.700` | `green.300` | vs `bg.surface`: 6.50:1 / 8.42:1 | AA, approaching AAA |
| `info` | `blue.600` | `blue.300` | vs `bg.surface`: 4.71:1 / 8.20:1; vs `bg.info-subtle`: **4.5068:1 light (tightest margin in the system)** | AA |
| `highlight` | `yellow.800` | `yellow.300` | vs `bg.surface`: 6.89:1 / 8.97:1; vs `bg.highlight-subtle`: 6.64:1 / 9.08:1; vs `bg.highlight-subtle-hover`: 6.13:1 / 6.42:1; vs `bg.canvas`: 6.06:1 (light) | AA. Light is `yellow.800`, not `yellow.700`: 700 is 4.67:1 on the surface, 4.50:1 on `bg.highlight-subtle` and only 4.16:1 on its hover |
| `syntax-keyword` | `purple.700` | `purple.300` | the lower of `bg.code-block` and `bg.code-highlight`: 9.4:1 / 5.3:1 | AA |
| `syntax-string` | `green.800` | `green.300` | the lower of `bg.code-block` and `bg.code-highlight`: 8.4:1 / 6.0:1 | AA |
| `syntax-number` | `amber.700` | `amber.300` | the lower of `bg.code-block` and `bg.code-highlight`: 6.1:1 / 5.8:1 | AA |
| `syntax-function` | `blue.700` | `blue.300` | the lower of `bg.code-block` and `bg.code-highlight`: 6.1:1 / 5.9:1 | AA |
| `syntax-type` | `emerald.700` | `emerald.300` | the lower of `bg.code-block` and `bg.code-highlight`: 5.3:1 / 6.1:1 | AA |
| `syntax-property` | `blue.800` | `blue.200` | the lower of `bg.code-block` and `bg.code-highlight`: 8.9:1 / 7.5:1 | AA |
| `syntax-tag` | `red.700` | `red.300` | the lower of `bg.code-block` and `bg.code-highlight`: 6.5:1 / 5.7:1 | AA |
| `syntax-comment` | `gray.700` | `gray.300` | the lower of `bg.code-block` and `bg.code-highlight`: 6.1:1 / 5.9:1 | AA |
| `syntax-inserted` | `green.800` | `green.300` | the lower of `bg.code-block` and `bg.code-highlight`: 8.4:1 / 6.0:1 | AA |
| `syntax-deleted` | `red.700` | `red.300` | the lower of `bg.code-block` and `bg.code-highlight`: 6.5:1 / 5.7:1 | AA |

`text.danger`/`text.on-danger`'s full AA-vs-AAA numbers (the policy this whole methodology is built around) are in `guidelines/adr/0002`, not restated here.

### `border.*`

| Token | Light | Dark | Verified against | Status |
|---|---|---|---|---|
| `default` | `gray.200` | `gray.800` | vs `bg.surface` (dark): 1.40:1; vs `bg.canvas`: 1.46:1; vs `bg.neutral-subtle`: **1.00:1, byte-identical** | Decorative, not state-identifying — 1.4.11 doesn't bind it. Real component-hosting surfaces (`Input`/`Textarea`/`Select`/`Kbd`/`Divider` all use this token) still don't clear the 3:1 non-text floor, an accepted gap. In dark it is `gray.800` (ADR-0011), 1.40:1 against `bg.surface`, and byte-identical to `bg.neutral-subtle` — accepted, since a border and a fill are not typically drawn against each other |
| `neutral-subtle` | `gray.100` | `gray.950` | vs `bg.surface` (dark): 1.11:1 | Decorative — Storybook-chrome only, no shipped component consumes it directly. Dark is `gray.950` (ADR-0011), 1.11:1 against `bg.surface`; Storybook's `docs.css` draws its h2/table borders with `border.default` instead (1.40:1) |
| `neutral` | `gray.400` | `gray.600` | vs `bg.surface`: **fails, 2.32:1** light / **3.00:1** dark | **Not state-identifying** — this is the default resting/hover-emphasis border (Checkbox, Select, Input, Textarea, Button `secondary`, IconButton, Indicators), not one that needs to clear 3:1 regardless. Dark figure improved from 2.32:1 to 3.00:1 (ADR-0011) — now incidentally right at the 3:1 line, though compliance was never required here. |
| `neutral-strong` | `gray.600` | `gray.400` | vs `bg.surface`: 4.70:1 / 6.08:1 | AA (non-text floor) — the neutral member of the state-identifying family (`border.danger`/`warning`/`success`/`info`/`brand`/`neutral-strong`) |
| `on-neutral` | `neutral.white` | `gray.900` | vs `bg.neutral`: 4.70:1 / 8.21:1 | AA (non-text floor) |
| `strong` | `gray.700` | `gray.200` | vs `bg.surface`: 6.88:1 / 10.47:1 | AA — Tag's outlined/selected-solid-neutral rings |
| `focus` | `purple.500` / `emerald.600` | `purple.400` / `emerald.400` | vs `bg.surface`: 4.16:1 (emerald light, tightest); 6.49:1 (emerald dark) | AA (non-text floor) |
| `brand` | `purple.600` / `emerald.700` | `purple.300` / `emerald.300` | vs `bg.surface`: 7.37:1 (purple) / 6.08:1 (emerald) light; 7.45:1 (purple) / 8.51:1 (emerald) dark | AA — Button `secondary`'s first real consumer |
| `brand-subtle` | `purple.100` / `emerald.100` | `purple.900` / `emerald.900` | ~1.09–1.32:1 both brands, both modes | **Deliberate exception** — purely decorative accent, not state-identifying, 1.4.11 doesn't apply |
| `danger` | `red.600` | `red.300` | vs `bg.surface`: 5.10:1 / 7.94:1 | AA (non-text floor) |
| `danger-subtle` | `red.100` | `red.900` | ~1.10–1.26:1 | Deliberate exception — decorative accent, brand-agnostic |
| `on-danger` | `neutral.white` | `red.900` | vs `bg.danger`: 5.10:1 / 8.22:1 | AA (non-text floor) |
| `warning` | `amber.600` | `amber.300` | vs `bg.surface`: 4.78:1 / 8.12:1 | AA |
| `warning-subtle` | `amber.100` | `amber.900` | ~1.09–1.27:1 | Deliberate exception — decorative accent |
| `on-warning` | `neutral.white` | `amber.900` | vs `bg.warning`: 4.78:1 / 8.19:1 | AA (non-text floor) |
| `success` | `green.700` | `green.300` | vs `bg.surface`: 6.50:1 / 8.42:1 | AA, approaching AAA |
| `success-subtle` | `green.100` | `green.900` | ~1.09–1.30:1 | Deliberate exception — decorative accent |
| `on-success` | `neutral.white` | `green.900` | vs `bg.success`: 6.50:1 / 8.19:1 | AA (non-text floor) |
| `info` | `blue.600` | `blue.300` | vs `bg.surface`: 4.71:1 / 8.20:1 | AA |
| `info-subtle` | `blue.100` | `blue.900` | ~1.09–1.28:1 | Deliberate exception — decorative accent |
| `on-info` | `neutral.white` | `blue.900` | vs `bg.info`: 4.71:1 / 8.20:1 | AA (non-text floor) |
| `highlight` | `yellow.600` | `yellow.300` | vs `bg.surface`: 3.23:1 / 8.97:1; vs `bg.canvas`: **2.84:1** (light) | AA (non-text floor) in light with little to spare, the scale's anchor; don't draw a state-identifying boundary on `bg.canvas` with it in light mode |
| `highlight-subtle` | `yellow.100` | `yellow.900` | ~1.12:1 / 1.40:1 vs `bg.surface`; 1.08:1 vs light `bg.highlight-subtle` | Deliberate exception — decorative accent, around `bg.highlight-subtle` |
| `on-highlight` | `neutral.white` | `yellow.900` | vs `bg.highlight`: 4.67:1 / 6.42:1 | AA (non-text floor). The outline of a control drawn on a solid `bg.highlight` surface, its own token so a component never uses a text token as a border |
| `code` | `blue.100` | `gray.700` (deliberately not matching `bg.code`'s `gray.800`) | ~1.09:1 light / 1.46:1 dark | Deliberate exception — decorative, not state-identifying. Adopted by the `Code` atom alongside `bg.code`; `gray.700` is a deliberate visible border, not the flat look the two tokens would share if matched. Under the 3:1 WCAG 1.4.11 floor either way, no compliance concern |

See [ADR-0011](adr/0011-darker-dark-mode-representative-background.md) for the decision behind the dark-mode figures above.

### `icon.*`

| Token | Light | Dark | Verified against | Status |
|---|---|---|---|---|
| `default` | `gray.700` | `gray.200` | vs `bg.surface`: 6.88:1 / 10.47:1; vs `bg.neutral-subtle`: 6.59:1 / 7.47:1; vs `bg.neutral-subtle-hover` and `bg.canvas`: 6.05:1 / 5.10:1 | AA (non-text floor, and the text one too). The same step as `text.secondary`, so a default icon and secondary text read at one strength; moved from `gray.600` / `gray.300` on 2026-10-18 at explicit direction, which also ended the step it shared with `text.tertiary` and its razor-thin 4.51:1 on `bg.neutral-subtle`. Also `Image`'s fallback icon (its default state, via `currentColor`). `bg.neutral-subtle` is darker in dark mode (ADR-0011) |
| `secondary` | `gray.500` | `gray.500` | vs `bg.surface`: 3.25:1 / 4.34:1; vs `bg.neutral-subtle`: 3.12:1 / 3.10:1; vs `bg.neutral-subtle-hover`: **2.86:1 (light) / 2.12:1 (dark), fails** | AA (non-text floor) on the surface and `bg.neutral-subtle`. Used for a purely decorative in-field icon (ADR-0103); never for a control, or under the `-hover` tints |
| `brand` | `purple.600` / `emerald.600` | `purple.300` / `emerald.300` | vs `bg.surface`: 7.37:1 (purple)/light; 7.45:1 (purple)/8.51:1 (emerald) dark; also checked vs `bg.canvas` dark: 3.63:1 (purple)/4.15:1 (emerald) | AA (non-text floor) |
| `on-brand` | `neutral.white` | `gray.900` | vs `bg.brand`: 7.37:1 / 6.08:1 light; 7.45:1 / 8.51:1 dark | AA |
| `disabled` | `gray.300` | `gray.700` | — | Exempt (disabled-state icon) |
| `danger` | `red.600` | `red.300` | vs `bg.surface`: 5.10:1 / 7.94:1 | AA |
| `on-danger` | `neutral.white` | `red.900` | vs `bg.danger`: 5.10:1 / 8.22:1 | AA |
| `warning` | `amber.600` | `amber.300` | vs `bg.surface`: 4.78:1 / 8.12:1 | AA |
| `on-warning` | `neutral.white` | `amber.900` | vs `bg.warning`: 4.78:1 / 8.19:1 | AA |
| `success` | `green.700` | `green.300` | vs `bg.surface`: 6.50:1 / 8.42:1 | AA, approaching AAA |
| `on-success` | `neutral.white` | `green.900` | vs `bg.success`: 6.50:1 / 8.19:1 | AAA |
| `info` | `blue.600` | `blue.300` | vs `bg.surface`: 4.71:1 / 8.20:1 | AA |
| `on-info` | `neutral.white` | `blue.900` | vs `bg.info`: 4.71:1 / 8.20:1 | AA |
| `highlight` | `yellow.600` | `yellow.300` | vs `bg.surface`: 3.23:1 / 8.97:1; vs `bg.neutral-subtle`: 3.09:1; vs `bg.highlight-subtle`: 3.11:1 (light); vs `bg.canvas`: **2.84:1** (light) / 4.37:1 (dark); vs `bg.highlight-subtle-hover`: **2.87:1** (light) | AA (non-text floor) in light, **with little to spare** — it is the scale's own anchor (`yellow.600`). Not for an icon on `bg.canvas` or on `bg.highlight-subtle-hover`, where `text.highlight`'s step (`yellow.800`) serves instead |
| `on-highlight` | `neutral.white` | `yellow.900` | vs `bg.highlight`: 4.67:1 / 6.42:1 | AA |
| `on-neutral` | `neutral.white` | `gray.900` | vs `bg.neutral`: 4.70:1 / 8.21:1 | AA |
| `white` | `neutral.white` | `neutral.white` (deliberately doesn't flip — see own `$description`) | vs `bg.overlay` at its default `opacity.60`: 21:1 (max possible) | Exempt — see `bg.overlay`'s own exemption below; this token exists specifically for content sitting on it |

### Notable exceptions (deliberate, non-obvious passes)

- **`icon.highlight` and `border.highlight` in light mode** (`yellow.600`, the scale's anchor) — 3.23:1 against `bg.surface`, which clears the 3:1 non-text floor with little to spare, and under it on `bg.canvas` (2.84:1) and on `bg.highlight-subtle-hover` (2.87:1; 3.11:1 on `bg.highlight-subtle`). They are not used there: `bg.canvas` is a special container (as for `text.tertiary` and `text.link`), and an icon on the hover fill takes `text.highlight`'s step. Light `bg.highlight` is one step darker (`yellow.700`) so that white text on it passes AA (4.67:1; 600 gives 3.23:1).

- **`bg.track`** — 1.35:1 light / 2.05:1 dark, fails the 3:1 non-text floor (consumers are in its row above, [ADR-0016](adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md)). Accepted deliberately, scoped by whether the track itself must convey the control's boundary or state (here the thumb or fill already does), not by whether the control is interactive; comparable production libraries' progress and slider tracks are similarly faint. `bg.track-strong` (1.72:1 / ~3.00:1) is no longer a reliably compliant alternative either (see its row), so `gray.500`/`gray.400` (3.25:1 / 6.08:1, `track-strong`'s former value) is the last-known-compliant pairing if a future component's track genuinely is the boundary-carrying element.
- **Disabled-state pairings** (any `*.disabled` token, or a component's own disabled styling) — exempt from 1.4.3/1.4.11 under WCAG 2.1, not a failure to flag.
- **`bg.overlay`, `bg.scrim`, `icon.white`** — no fixed pairing is possible or expected; all three composite over (or sit on top of a fill compositing over) arbitrary, unpredictable content by design. `icon.white` is also a deliberate naming exception — named for its value rather than its role like every other token here, since it's white in all 4 themes/brands and isn't expected to change (see its own `$description`).
- **`border.neutral`, `border.default`, `border.neutral-subtle`, `border.code`, and every `*-subtle` border** (`brand-subtle`, `danger-subtle`, `warning-subtle`, `success-subtle`, `info-subtle`) — decorative accents, not state-identifying boundaries, so WCAG 1.4.11 doesn't bind them even though several sit well under 3:1.

## Multi-theme structure going forward

Adding a third brand theme later = one more pair of semantic JSON files (`{brand}-light.json`, `{brand}-dark.json`) referencing a new primitive color scale, following the exact same token names as the existing two. No changes needed to component code, since components should only ever reference semantic tokens, never primitives directly.

## Component-layer tokens

One file per component in `packages/tokens/src/component/`, for a value a specific component needs that has no home on any shared primitive scale. **The JSON files are the source of truth for every value** — each token's `$description` records its derivation, so this table names the tokens and what they are for, and does not copy the numbers.

| File | Tokens | What they size or limit | Review |
|---|---|---|---|
| `alert.json` | `alert.inline-text-min-width` | The narrowest an alert's message may get before inline actions drop below it. The row wraps (flex-wrap), so this basis decides *when*, against the alert's own width, which is why it is a size and not a media query | [Alert](component-reviews/Alert.md) |
| `avatar.json` | `avatar.size.*`, `avatar.status-size.*` | The avatar's diameter and its status dot at each size step (the original design asked for sizes that mostly matched no spacing step) | [Avatar](component-reviews/Avatar.md) |
| `badge.json` | `badge.size.*`, `badge.padding-inline.*` | A count badge's circle/pill diameter, computed from the widest glyph at each step's font size so one character is a true circle, and the inline padding that math depends on | [Badge](component-reviews/Badge.md) |
| `combobox.json` | `combobox.list-max-height`, `combobox.option-height.*`, `combobox.option-height-described.*` | The most height the floating list takes before it scrolls, and the fixed height of an option row at each size step (a one-line row, and one with a description), which a long list needs known without measuring; `MultiSelect` draws the same list with them | [Combobox](component-reviews/Combobox.md), [MultiSelect](component-reviews/MultiSelect.md) |
| `data-table.json` | `data-table.row-height.*` | The fixed height of a data row at each size step, which a long table needs known without measuring it so it can draw only the rows in view | [DataTable](component-reviews/DataTable.md) |
| `command-palette.json` | `command-palette.list-max-height`, `command-palette.match-hint-max-width`, `command-palette.page-tag-max-width` | The most height `CommandPalette`'s result list takes before it scrolls, the widest the keyword a row was found through may grow, and the share of the search row the tag naming an open list may take; the window is also limited to the room left on the screen, and a window's list is taller than a dropdown's (`combobox.list-max-height`) | [CommandPalette](component-reviews/CommandPalette.md) |
| `dialog.json` | `dialog.max-width.*` | The width cap of a dialog's panel at each size step, the content measure of a centred window | [Dialog](component-reviews/Dialog.md) |
| `drawer.json` | `drawer.size.*` | The extent of an edge-attached panel at each size step: the width of a `start` or `end` drawer and the height cap of a `top` or `bottom` one | [Drawer](component-reviews/Drawer.md) |
| `editor-tabs.json` | `editor-tabs.tab-min-width`, `editor-tabs.tab-max-width` | The narrowest a tab gets, so a short name keeps room for its icon and close button, and the widest before its name is cut with an ellipsis | [EditorTabs](component-reviews/EditorTabs.md) |
| `empty-state.json` | `empty-state.content-max-width`, `empty-state.media-max-width.*` | The description's line-length cap, and the widest an illustration may grow at each size | [EmptyState](component-reviews/EmptyState.md) |
| `field-group.json` | `field-group.field-min-width` | The width each field asks for before a horizontal `FieldGroup` wraps the next onto its own line, measured against the group's own box | [FieldGroup](component-reviews/FieldGroup.md) |
| `heading.json` | `heading.trim.*` | The negative-margin fallback for `trim` in browsers without native `text-box-trim`. Derived from each font's own metrics, so there is one pair per font family (Nunito and Lora differ) | [Heading](component-reviews/Heading.md) |
| `hover-card.json` | `hover-card.max-width` | The width cap on the floating card | [HoverCard](component-reviews/HoverCard.md) |
| `icon-button.json` | `icon-button.size.*` | The box size, matched to `Button`'s rendered height at each step so an `IconButton` sits flush beside a `Button`. `CloseButton` reads its box size from here too | [IconButton](component-reviews/IconButton.md) |
| `indicators.json` | `indicators.size.*` | The dot diameter. The active dot's pill width is derived in CSS from it (`calc(var(--dot-size) * 3)`), not a second token family | [Indicators](component-reviews/Indicators.md) |
| `link.json` | `link.icon-scale`, `link.icon-offset-inline`, `link.icon-vertical-align` | The size, gap and optical alignment of the trailing external-link icon. **em-relative**, because `Link` inherits its font size unless `size` sets one, so the icon follows the text, one to one | [Link](component-reviews/Link.md) |
| `menu.json` | `menu.min-width`, `menu.max-width` | The least and the most width a menu's floating panel takes: wide enough that short labels still have room for an icon and a shortcut hint, narrow enough that a long label wraps rather than running off a small screen; `ContextMenu` and `Menubar` draw the same panel | [Menu](component-reviews/Menu.md) |
| `navbar.json` | `navbar.search-min-width`, `navbar.search-max-width` | The width `Navbar.Search` wants in the bar before its neighbours crowd it (its flex-basis, which it gives up when the row is crowded), and the widest it grows with room to spare | [Navbar](component-reviews/Navbar.md) |
| `sidebar.json` | `sidebar.width` | The width of the expanded navigation column, and the default for `Sidebar`'s `width` prop. The collapsed rail is not a token: it is derived in CSS from the item height and the sidebar's padding | [Sidebar](component-reviews/Sidebar.md) |
| `stepper.json` | `stepper.indicator-size.*`, `stepper.label-max-width` | The step indicator's diameter at each size step (24, 28, 32, 40 and 48px: the spacing scale has no 28, and 24 is the target-size floor for a step that can be entered), and the width a step's text may reach before it wraps | [Stepper](component-reviews/Stepper.md) |
| `popover.json` | `popover.max-width` | The width cap on the floating panel, wider than a tooltip's because a popover hosts richer content | [Popover](component-reviews/Popover.md) |
| `scroll-area.json` | `scroll-area.thickness.*` | The scrollbar thickness at each size | [ScrollArea](component-reviews/ScrollArea.md) |
| `table-of-contents.json` | `table-of-contents.number-min-width` | The least width an entry's number takes, in digit widths of the outline's own font, so labels line up | [TableOfContents](component-reviews/TableOfContents.md) |
| `table-toolbar.json` | `table-toolbar.search-min-width`, `table-toolbar.search-max-width`, `table-toolbar.filter-count-size-xs` | The width `TableToolbar.Search` asks for before wrapping, the widest it grows, and the xs filter-count badge diameter | [TableToolbar](component-reviews/TableToolbar.md) |
| `tags-input.json` | `tags-input.entry-min-width` | The narrowest the typing area gets, in the field's own digit widths, before it drops beneath the chips | [TagsInput](component-reviews/TagsInput.md), [MultiSelect](component-reviews/MultiSelect.md) |
| `date-picker.json` | `date-picker.segment-width`, `date-picker.year-width` | Font-relative (`ch`) widths of a two-digit segment (day, month) and of the four-digit year segment, each with a quarter of a digit to spare, so a segment never changes size as it fills; `DateRangePicker`'s two ends use them too | [DatePicker](component-reviews/DatePicker.md), [DateRangePicker](component-reviews/DateRangePicker.md) |
| `time-picker.json` | `time-picker.segment-width`, `time-picker.period-character-width`, `time-picker.wheel-*` | Font-relative (`ch`) widths for a segment and the AM/PM label, and the picker wheel's visible rows and per-distance scale and opacity. **The neighbour opacity is a measured contrast figure, not a taste:** `text.primary` at that opacity over `bg.surface` clears 4.5:1 in all themes. The outer opacity is deliberately below the floor, for the half-cut-off outermost row only | [TimePicker](component-reviews/TimePicker.md) |
| `timeline.json` | `timeline.marker-size.*`, `timeline.time-width`, `timeline.item-min-width` | The diameter of an icon or node marker at each size step (24, 28, 32, 40 and 48px: the spacing scale has no 28, and 24 is the same floor `Stepper`'s indicator uses), from which the plain dot is derived in CSS, the width of the side time column, and the narrowest an event's column gets in a horizontal timeline before the row scrolls | [Timeline](component-reviews/Timeline.md) |
| `tree.json` | `tree.row-height.*` | The fixed height of a tree row at each size step (1.5, 2, 2.25, 2.75 and 3.25rem), which a long tree needs known without measuring it so it can draw only the rows in view; each is taller than the check box or node icon of its step and never below 1.5rem (WCAG 2.5.8) | [Tree](component-reviews/Tree.md) |
| `toast.json` | `toast.width`, `toast.stack.peek`, `toast.stack.scale-step` | The width of a toast in a corner, how far each older toast shows beyond the one in front of it in a fanned stack, and how much smaller each is drawn per step of depth | [Toast](component-reviews/Toast.md) |
| `tooltip.json` | `tooltip.max-width` | The width cap on the tooltip bubble | [Tooltip](component-reviews/Tooltip.md) |

Rules for the layer:

- **File convention:** `component/{component-name}.json`, self-namespaced under that component's own top-level key (`avatar.json` → `{ "avatar": { ... } }`) — the same unwrapped convention as `typography.json`/`other.json`, so no entry in `dbm/namespace-primitives`'s `NAMESPACE_BY_FILENAME` map is needed.
- **Theme-independent by default.** Component tokens aren't split per brand or mode: they are built once into `component-tokens.css`/`component-tokens.ts` and loaded globally (`:root`, no `data-theme` scoping) alongside `primitives.css`. A component token *can* alias a primitive if it ever needs to (the build includes the primitive source for reference resolution), but plain literal values are just as valid.
- **When to reach for this layer, in order of preference:**
  1. Use an existing semantic token if one already fits.
  2. If a component needs a numeric value on an existing primitive scale (spacing, icon-size, etc.) that just isn't the value in use, prefer that scale over inventing something new.
  3. Add a component-layer token only when the component's design genuinely calls for a value with **no home on any existing primitive scale**. Reach for this layer instead of hardcoding the literal in component CSS, which the "tokens are the single source of truth" rule in `CLAUDE.md` forbids at every layer.
- **Precedent — Avatar's size scale:** the requested sizes were 36/40/44/48/52px, and only 40 and 48 matched existing tokens (`space-10`, `space-12`). Rather than distort the shared spacing scale or snap to the nearest existing values (changing the requested design), `avatar.size.{xs,sm,md,lg,xl}` holds the literal dimensions, scoped to Avatar. Every later component token follows the same reasoning: a real, measured value with no home on any existing scale, not a shortcut around one that fits.
- **The layer stays reactive.** Extend it to another component only when that component's own review turns up a genuine scale gap, not preemptively.
- **Build wiring:** `style-dictionary.config.js`'s `buildComponents()` runs a dedicated Style Dictionary instance (source: primitives plus `component/*.json`, filtered to component-namespaced tokens by `token.filePath` rather than a hardcoded namespace list), so a new `component/*.json` file needs no config change.

## Build pipeline decisions

Style Dictionary 5's actual behavior diverged from a few of the phase brief's assumptions. Documented here so these don't get "fixed" as bugs in a later session — each was audited post-Phase-3 and confirmed to be the correct, standards-conforming response to a real SD5 constraint, not a shortcut.

- **Built-in transforms cover fontFamily/cubicBezier.** SD5 ships `fontFamily/css` and `cubicBezier/css` out of the box — no custom transform code needed, contrary to the original assumption. Used directly in `style-dictionary.config.js`'s `CSS_TRANSFORMS`.
- **Primitive files aren't self-namespaced.** `radius.json` and `breakpoint.json` both use bare `sm`/`md`/`lg`/`xl` at the top level, which collide on a naive merge. A custom parser (`dbm/namespace-primitives`) wraps each file's content under the namespace its DTCG aliases already expect (`color.json` → `color`, `spacing.json` → `space`, etc.); `typography.json` and `other.json` need no wrapping since their internal groups are already distinct.
- **The built-in size/rem transform can't handle `clamp()`.** Confirmed empirically — it throws `Invalid Number` on fluid typography values. `CSS_TRANSFORMS` deliberately excludes any dimension-unit transform; all dimension `$value`s (spacing, radius, fluid font sizes) are pre-authored as final, correctly-unitted CSS strings (`"0.25rem"`, `"4px"`, `"clamp(1.2rem, 1.186rem + 0.071vw, 1.25rem)"`) at the source, so they pass through the pipeline verbatim instead of being computed by a transform.
- **`shadow.json`'s `_note` key is stripped during parsing.** DTCG parsing expects every leaf to resolve to a `$value`; the human-readable `_note` annotation isn't a token, so the custom parser deletes it, scoped narrowly to that one file/key.
- **Each theme is built as a separate Style Dictionary instance**, not as one config with multiple platforms. The four semantic theme files (`purple-light`, `purple-dark`, `emerald-light`, `emerald-dark`) all use identical top-level token paths (`bg.canvas`, etc.) — loading more than one into a single dictionary at once collides. `style-dictionary.config.js` builds 5 instances total: one primitives-only pass plus one per theme, each sourcing the shared primitives plus exactly one semantic file.
- **Motion easing gets two parallel TS exports.** `motion.easing.*` stays a CSS `cubic-bezier()` string — the form the built-in `cubicBezier/css` transform produces, and what the Foundations Motion page's own interactive demo (`MotionScale.tsx`) already builds a `transition` shorthand string from. `motion.easingArray.*` additionally exports the same value as the raw `[x1,y1,x2,y2]` array — the form the `motion` library's own `easing` prop wants, and the one no export previously covered. Implemented generically in `dbm/typescript-const`'s `buildNestedObject` (reads `token.original.$value` for any `$type: "cubicBezier"` token, not hardcoded to `motion` specifically) rather than as a one-off — additive, so the string export and its consumer are unaffected. No component imports the `motion` package yet, so the array form is unexercised until that integration happens.
- **A token's `$description` is baked verbatim into the built CSS as a `/** ... *​/` comment, so an unescaped `*/` anywhere in that prose silently corrupts the build.** CSS ends a comment at any `*/`, so a stray one (for example from writing "bg.\*/text.\*" without a space) closes the comment early, and the unmatched `*/` later in the same declaration list upsets the parser's error recovery, which then discards the next declaration whole. The built CSS stays syntactically valid, so `tsc`, `eslint`, `vitest` and `tsup` all pass; it shows only as a missing custom property in the browser (`Skeleton` rendered with no background in every theme until this was traced, see `component-reviews/Skeleton.md`). **When writing or editing a `$description`, never let two adjacent terms produce `*/`:** add a space, reorder the phrase, or use "and" instead of "/".

## Files delivered
```
packages/tokens/src/
├── primitive/
│   ├── color.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── shadow.json
│   ├── breakpoint.json
│   ├── motion.json
│   └── other.json
├── semantic/
│   ├── purple-light.json
│   ├── purple-dark.json
│   ├── emerald-light.json
│   └── emerald-dark.json
└── component/            # one file per component that needs one — see the table above
```

## Open questions

- **Fonts:** how a consumer loads `Nunito` and `Lora` is undecided (see Fonts above).
- **Component tokens:** none pending; the layer grows only as a component's review finds a gap (see its rules above).
- **`Checkbox`'s box outline:** it is drawn with `border.neutral`, which is 2.3:1 on `bg.surface` in the two light themes, under the 3:1 a control's own edge needs (the note above treats `border.neutral` as a decorative accent, which an edge that identifies a control is not). `Tree`'s check box uses `border.neutral-strong` (4.5:1 or more on the surface, in all four themes). Whether `Checkbox` follows is undecided; it is Finalized, so it needs your go-ahead.
