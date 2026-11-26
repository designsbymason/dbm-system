# Avatar in Figma

**What is drawn.** 128 variants on the Data Display page, all of the circle: a `content` of `icon`, `initials` or `image`, five tones (`brand`, `danger`, `warning`, `success`, `info`), four sizes (`xs`, `sm`, `md`, `lg`) and four states (`default`, `hover`, `focus`, `disabled`), a `status` of `none`, `online`, `offline`, `busy` or `away`, and a text property `initials`. The nested icon is `Icon/User`.

## Decisions

- **Coverage: four sizes, over the default of three.** The whole scale spans 16 px (36, 40, 44, 48 and 52), so a size costs little, and `xs` is the size `AvatarGroup` and dense menus use. `xl` is the one undrawn size, with a recipe in the map ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **The shape is not a property.** Only the circle is drawn, so a `shape` property would have one value. The square is a recipe in the spec frame (the content radius `radius/md`, the focus ring `radius/sm`), and `shape` is named in the map's `notModelled`.
- **`content` is one variant property, and its default is `icon`.** The code has no such prop: it is which of `src`, `initials` or `name` is set, and an avatar with none draws the generic person icon, so that is the default (the top-left cell). The image is a flat `bg/neutral-subtle` rectangle for a designer to replace with a picture, because no photograph ships with the library.
- **`tone` stands for `colorful`.** The code picks one of five families from a hash of `name`, `alt` or `initials`, so the five are drawn for initials, which is where the family shows; `icon` and `image` are drawn in `brand` only, and the other four are a recipe in the spec frame.
- **States.** `hover` and `focus` are CSS on an avatar that is interactive through `as` and `onClick`, and `disabled` is a prop that only does something on that avatar, so all four are one `state` property. Hover moves the fill to the tone's `-subtle-hover` variable and does nothing visible on an image.
- **A status dot is drawn at the default state only,** four statuses at every drawn size. The dot does not change what a state does, so combining them would add 48 variants for nothing; a status with hover, focus or disabled is a recipe.
- **Text.** The initials use five new styles, `Components/Avatar/sm`, `base`, `md`, `lg` and `xl` (semibold, the browser's own line height, because the component sets none), added to `scripts/figma-sync.mjs`. The sizes follow the code (`xs` takes `sm`, `sm` takes `base`, and so on); `xl` is there for the recipe.
- **Hover initials.** The danger, warning and info hover variants (12) bind the initials to `text/danger-hover`, `text/warning-hover` and `text/info-hover`, as the code now does: `text/{tone}` on `bg/{tone}-subtle-hover` was 4.44:1, 4.2:1 and 4.15:1 in the light themes, and the hover tokens give at least 6.1:1 ([ADR-0245](../../adr/0245-a-tags-hover-label-takes-three-semantic-hover-text-tokens-over-darkening-the-status-text-tokens-or-changing-the-hover-treatment.md)). Brand and success keep their own text colour (at least 4.63:1 on hover).
- **The edge counts in the size.** The 1 px border is an inside stroke included in the layout, so the content fills the box exactly: 36, 40, 44 and 48 px.
- **The ring is a layer.** The focus ring is one frame 2 px thick, 4 px outside the box (`border/focus`, radius full). Its size and offset are literal numbers, since a box plus 4 px is not a variable.

## Differences from the code

See `deviations` in the map. The ones worth knowing: `hover` and `focus` have no prop, the icon is `icon/brand` where the code inherits `text/brand` (the same in the purple themes, lighter in the emerald ones, at least 3.99:1 on the fill), the status dot is drawn at the left-to-right corner where the code uses the inline end, and the focus ring's size is a literal.

## Not drawn

`xl`, the square shape, `icon` and `image` in the four other tones, a status dot with hover, focus or disabled, the responsive `size` object, and the fade of the hover fill.

## Review

2026-11-25: reviewed; three findings, all applied. Checked: bindings on all 428 layers (only the focus ring's size, 28 variants, is a literal), the text style on all 96 texts, the size of every variant (36, 40, 44 and 48 px, the content filling the box, each dot at its corner), the nested icon and the layers each `content`, `state` and `status` shows, the properties and defaults against the map, the spec frame (slots, matrix instances, Tokens used against the set's bindings, "11 of 18 props in code", links), the set's description and documentation link, and contrast measured from the variables in the four themes. Applied: (1) the spec frame's Accessibility numbers, which came from comments in the code, were replaced by the measured ones (initials at least 4.51:1, dots at least 4.7:1); (2) the hover initials of the danger, warning and info families, 4.44:1, 4.2:1 and 4.15:1 in the light themes, now use the existing hover tokens in the code and in the 12 hover variants (6.1:1 or more); (3) the icon deviation is recorded here, in the map and in the spec frame. Not checked: a dark-theme render, whether swapping the nested icon keeps its tone, and Code Connect (the file is not published to the team library). Not yet approved by the maintainer.
