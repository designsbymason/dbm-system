# Avatar in Figma

**What is drawn.** 48 variants on the Data Display page, all of the circle in the brand tone: a `content` of `icon`, `initials` or `image`, four sizes (`xs`, `sm`, `md`, `lg`) and four states (`default`, `hover`, `focus`, `disabled`). A `status` boolean shows an online dot on any of them, and a text property `initials` holds the letters. The nested icon is `Icon/User`.

## Decisions

- **Coverage: four sizes, over the default of three.** The whole scale spans 16 px (36, 40, 44, 48 and 52), so a size costs little, and `xs` is the size `AvatarGroup` and dense menus use. `xl` is the one undrawn size, with a recipe in the map ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **Only the brand tone is drawn.** The code's `colorful` picks one of five families from a hash of `name`, `alt` or `initials`, but a design picks a colour, so the four other families (`danger`, `warning`, `success`, `info`) are a recipe in the spec frame and `colorful` is named in the map's `notModelled`. Drawing only `brand` also takes the three hover-text variables out of the set: the recipe names them (`text/danger-hover`, `text/warning-hover`, `text/info-hover`) for the tones that need them.
- **`status` is a boolean for the online dot.** A boolean shows or hides a layer, and the dot's colour is the one thing a status changes, so the set draws the online dot (`bg/success`) in every variant, hidden until `status` is on, and the other three statuses are a recipe (bind the Status layer's fill to `bg/neutral`, `bg/danger` or `bg/warning`). It works on every content, state and size without multiplying the set. In the code the property is `status="online"`, which the map records as the boolean's `on` value.
- **The shape is not a property.** Only the circle is drawn, so a `shape` property would have one value. The square is a recipe in the spec frame (the content radius `radius/md`, the focus ring `radius/sm`), and `shape` is named in the map's `notModelled`.
- **`content` is one variant property, and its default is `icon`.** The code has no such prop: it is which of `src`, `initials` or `name` is set, and an avatar with none draws the generic person icon, so that is the default (the top-left cell). The image is a flat `bg/neutral-subtle` rectangle for a designer to replace with a picture, because no photograph ships with the library.
- **States.** `hover` and `focus` are CSS on an avatar that is interactive through `as` and `onClick`, and `disabled` is a prop that only does something on that avatar, so all four are one `state` property. Hover moves the fill to `bg/brand-subtle-hover` and does nothing visible on an image.
- **Text.** The initials use five new styles, `Components/Avatar/sm`, `base`, `md`, `lg` and `xl` (semibold, the browser's own line height, because the component sets none), added to `scripts/figma-sync.mjs`. The sizes follow the code (`xs` takes `sm`, `sm` takes `base`, and so on); `xl` is there for the recipe.
- **The edge counts in the size.** The 1 px border is an inside stroke included in the layout, so the content fills the box exactly: 36, 40, 44 and 48 px.
- **The ring is a layer.** The focus ring is one frame 2 px thick, 4 px outside the box (`border/focus`, radius full). Its size and offset are literal numbers, since a box plus 4 px is not a variable.

## Differences from the code

See `deviations` in the map. The ones worth knowing: `hover` and `focus` have no prop, `status` is a boolean for the online dot where the code takes four statuses, the icon is `icon/brand` where the code inherits `text/brand` (the same in the purple themes, lighter in the emerald ones, at least 3.99:1 on the fill), the status dot is drawn at the left-to-right corner where the code uses the inline end, and the focus ring's size is a literal.

## Not drawn

`xl`, the square shape, the four other tones, the offline, busy and away statuses, the responsive `size` object, and the fade of the hover fill. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-25: reviewed; three findings, all applied (the spec frame's contrast numbers were replaced by measured ones, the hover initials of the danger, warning and info families were fixed in the code, and the icon deviation was recorded). That review covered the first 128-variant set.

2026-11-26: the set was reduced to the brand tone with a `status` boolean (48 variants), and re-checked: the bindings on all 204 layers (only the focus ring's size, 12 variants, is a literal), the text style on all 16 texts, the size of every variant and the position of every hidden dot against its size, the five properties and their defaults against the map, the grid (12 rows by 4 states, the default in the top-left cell), the description and documentation link, and the spec frame in a screenshot (matrix, properties, recipes, tokens used read from the set's bindings, anatomy, accessibility). Code Connect is mapped by path and name (`packages/components/src/atoms/Avatar/Avatar.tsx`, `Avatar`) and reads back on the default and a hover variant. Not checked: a dark-theme render and whether swapping the nested icon keeps its tone. Approved by the maintainer 2026-11-26.
