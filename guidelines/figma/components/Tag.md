# Tag in Figma

**What is drawn.** 315 variants on the Data Display page: three looks (`subtle`, `solid`, `outlined`), seven tones, three sizes (`sm`, `md`, `lg`) and five states (`default`, `hover`, `focus`, `selected`, `disabled`). Booleans `leadingIcon`, `trailingIcon` and `removable` show a nested icon, and a text property `label` holds the text.

## Decisions

- **Coverage: all seven tones, over the budget with a recorded exception.** A tag's tone is a feedback colour, as a badge's is, so every tone is drawn like [Badge](./Badge.md), with the sizes `sm`, `md` and `lg` and every state at every size and tone, which keeps the set from being sparse: 3 x 7 x 3 x 5 = 315, over the budget of about 250 ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)). `xs` and `xl` are listed as undrawn in the map with a recipe.
- **Five states.** `hover` and `focus` are CSS on a tag that is interactive, and `selected` and `disabled` come from props, so all five are one `state` property. Hover on a selected tag is not drawn, and the spec frame says so.
- **Text styles.** `Components/Tag/*` (xs, sm, base: medium weight, the tight line height) were added, because the existing medium and tight styles are named for the icon button's caption. The selected state reuses `Components/Control/*`, which is semibold at the same line height.
- **The edge counts in the size.** Subtle and outlined tags have a 1 px border, drawn as an inside stroke that is included in the auto layout, so the heights match the code: 33 px at `md` and `lg`, 32 px at `sm`, and 2 px less for solid.
- **Rings are layers.** The focus ring is one layer 2 px thick and 4 px outside the tag; a selected solid tag has two (`bg/surface`, then the tone's border), as the code's two box-shadow layers.
- **Icons set the tone on each variant.** The tone follows the fill: the tone icon on subtle and unselected outlined, the on-tone icon on solid and selected outlined. Sizes are `icon-size/xs`, `sm` and `md` for `sm`, `md` and `lg`.
- **The remove glyph's frame is 4 px narrower than its icon,** which draws the code's negative end margin.

- **Hover label tokens.** The `subtle` and `outlined` hover variants of `info`, `warning` and `danger` (18) bind their label to `text/info-hover`, `text/warning-hover` and `text/danger-hover`, the semantic tokens that [ADR-0245](../../adr/0245-a-tags-hover-label-takes-three-semantic-hover-text-tokens-over-darkening-the-status-text-tokens-or-changing-the-hover-treatment.md) added so the label keeps 4.5:1 on the hover fill in the light themes. The variables were created in the Semantic collection by hand, so they sit at its end.

## Differences from the code

See `deviations` in the map. Three are worth knowing: a long label is shortened with an ellipsis in code and the set has no maximum width, so none is drawn; the highlight tone's icon is the lighter `icon/highlight` in the light themes, where the code inherits the darker `text/highlight`; and hover and focus have no prop.

## Not drawn

`xs` and `xl`, hover on a selected tag, a disabled selected tag, the remove glyph's own hover and focus, and the mount and press motion.

## Review

2026-11-25: reviewed with no findings. Checked, for all 315 variants: the name and the order (the default `subtle, brand, md, default` is the top-left cell), the fill, edge and label colour of each combination against the stylesheet's token for that look, tone and state, the text style (`Components/Tag/*`, or `Components/Control/*` when selected), the tone and size of the three nested icons, the rings on exactly the focus variants (and the two halo rings on exactly the selected solid ones), the 40% opacity bound on the disabled ones, every spacing, radius, edge width and ring value bound (nothing unbound), the four property references in each variant, and the heights (33 px at `md` and `lg`, 32 px at `sm`, 2 px less for solid). Also checked: the spec frame (instance of the master, every slot filled, 43 matrix instances of this set, Tokens used read from the set's bindings, "11 of 21 props in code" against the manifest, both links), the set's description and documentation link, the Section fill and the Components row. Not checked: the widths and heights in a real browser, and a dark theme render. The neutral tone's on-fill icons first used `on-brand`, because the Icon sets lacked `on-neutral`; the tone was added to every Icon set and those 18 variants were switched to it on 2026-11-25 (54 icon instances). Approved by the maintainer 2026-11-25. Measured while building: the label's contrast on its fill is at least 4.51:1 for subtle, 4.67:1 for solid and 4.71:1 for outlined in all four themes. On hover the subtle and outlined `info`, `warning` and `danger` pairs were 4.15:1, 4.2:1 and 4.44:1 in the light themes; the code now uses the hover text tokens (ADR-0245), and the 18 variants were rebound to them on 2026-11-25, at 6.1:1 or more.
