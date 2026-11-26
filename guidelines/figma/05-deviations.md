# Where Figma differs from the code, and why

Figma cannot express everything the code does, and a design file has its own structure. These are the patterns where a Figma property or value is not the code's, so an agent that reads the file knows to use the map. Each component's own list is `deviations` in [component-map.json](./component-map.json) and in its file in [components/](./components/README.md).

| Pattern | Figma | Code | Why |
|---|---|---|---|
| A boolean that changes the shape | A variant property, `false` and `true` (Button `rounded`) | A boolean prop | A boolean property in Figma can only show or hide a layer |
| A presentation that ignores another axis | A value of the same axis (Badge `variant=dot`) | A separate prop (`dot`) beside `variant` | One axis leaves no invalid combination |
| A look that depends on a value being present | A variant (Input `filled`) | No prop; the text colour follows the value | Figma has no placeholder state of its own |
| CSS states | A `state` variant (`hover`, `focus`) with no prop | `:hover`, `:focus-visible` | A designer needs to see them |
| A state that is a prop | A `state` value (`error`, `disabled`, `loading`) | `hasError`, `disabled`, `isLoading` | One axis for everything a field can be in |
| An icon | A boolean, with the nested icon swapped in place and its `tone` set | A node passed to a prop | A swap property has one default for the whole set ([ADR-0238](../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)) |
| Text | A text property | `children`, or an attribute (`placeholder`) | |
| A derived value | A number drawn unbound (Button `secondary` padding) | A `calc()` of tokens | Figma variables cannot do arithmetic |
| A fluid size | A fixed width or height in the set (Input 280 px) | `width: 100%`, a height from line height | A variant needs a size; an instance can be resized |
| Placement and layout props | Examples in the spec frame | `position`, `overlap`, `align`, `side` | They place a component, they do not shape it |
| Behaviour and passthrough | Not drawn | `max`, `hideZero`, `onChange`, `aria-*`, `className` | They have no look |
| A value the code has that is not drawn | Listed in the map's `undrawn` and in the spec frame, with a recipe; an instance that uses one is named `Name (prop=value)` | Any value of the prop | The full matrix was too large to keep in step ([ADR-0242](../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)) |
| A state across structure variants | Drawn once, at the default structure (Card's `layout`) | The same CSS state on every layout | Structure does not change what a state does |
| A shadow that changes with the theme | The light elevation style (Card elevated); the dark one is applied by hand | A shadow token per theme | An effect style cannot switch with a variable mode |
| Motion | Not drawn | Animations and transitions | A static frame has no motion |
| An overlay | A static frame of its open state | A live layer | Figma cannot hold a live overlay |
| A size the code inherits | A `size` axis of type-scale steps that maps to no prop (Code, Highlight; Link's `size` is optional) | No size, or `size` unset: the text takes the size of what is around it | An inline piece has to match its text, and Figma has no inheritance |
| A boolean the code names the other way round | A boolean that shows the layer, named for what it shows (Tooltip `showArrow`, the code's `hideArrow`; Blockquote `showAttribution`) | A prop that hides or sets the part | A Figma boolean shows a layer; the map says which value is the code's |
| A component with no variant property | A plain component, with no set (Kbd) | A fixed look | There is nothing to combine into a set |
| A combination of parts | Instances composed in the spec frame (Kbd chords), with a recipe | A prop that draws several parts for the platform (`keys`) | A text property has one default, so a chord cannot be one variant |
| An open content area that can be hidden | A slot with a boolean that shows it (ListItem `trailing`), the slot sized to hug and without a fill | A node passed to a prop | A slot is an open area, and its own default size is 100 by 100 |
| A text decoration or an italic | A text style that carries it (`Components/Link`, `Components/Blockquote`) | A CSS declaration | Text linked to a text property takes one format in every variant, and no variable holds an italic |
| A system font stack | A stand-in font with the family unbound (Roboto Mono for the mono stack, [ADR-0249](../adr/0249-the-figma-library-stands-in-roboto-mono-for-the-monospace-font-stack-and-leaves-the-family-unbound-over-binding-the-font-family-variable-or-installing-a-system-font.md)) | `ui-monospace, Menlo, Consolas...` | Figma has no font for the stack |
| A component that is a container, a native Figma feature or a style | Not drawn, with a recipe on the Components page (BackToTop, Text, Heading, Backdrop, CheckboxGroup, RadioGroup, TimeRangePicker, ScrollArea, Splitter) | A component | It repeats what its parts or a Figma feature already draw ([ADR-0246](../adr/0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md) to [ADR-0250](../adr/0250-five-molecules-are-not-drawn-and-are-recipes-built-from-drawn-parts-or-a-plain-frame-over-drawing-them-as-components.md)) |
