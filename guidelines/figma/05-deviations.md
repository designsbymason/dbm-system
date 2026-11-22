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
| Motion | Not drawn | Animations and transitions | A static frame has no motion |
| An overlay | A static frame of its open state | A live layer | Figma cannot hold a live overlay |
