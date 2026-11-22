# Naming and structure in the Figma file

How things are named, so an agent can find them without a search. The structure is decided in [01-plan.md](./01-plan.md) §4 to §6; this page is the lookup.

| Thing | Name | Example |
|---|---|---|
| Page | An emoji and the plain name; a category page starts with `↳ `; a divider page is `---` | `🧩 Components`, `↳ Data Display` |
| A component's Section | The component's name, filled with `bg/canvas` | `Badge` |
| A component set | The component's name exactly as in code | `Input` |
| A spec frame | `Spec: ` and the component's name, an instance of the Spec frame master | `Spec: Input` |
| The grid's headings | A frame named `Matrix labels` beside the set | |
| A variant | `property=value` pairs in the axis order, comma separated | `size=md, state=error, filled=true` |
| A variant property | The code prop's name, or the name of what it shows when no single prop says so | `variant`, `filled`, `ring` |
| An instance that uses a value the file does not draw | The component's name and the pairs in brackets | `Button (size=xs)`, `Card (tone=danger, size=lg)` |
| A boolean property | The prop, shown or hidden | `prefix`, `clearable` |
| A text property | What the text is | `label`, `placeholder`, `value` |
| Layers in a component | A short role name, `Label`, `Ring`, `Prefix`, `Clear` | |
| An icon set | `Icon/` and the Phosphor name; properties `weight` and `tone` | `Icon/MagnifyingGlass` |
| A variable | A path whose slashes become hyphens in the CSS custom property | `bg/brand-hover` is `--dbm-bg-brand-hover` |
| A text style | A role and a size; a style for one component or family sits under `Components/` | `Body/md`, `Components/Field/md` |
| An effect or grid style | `Elevation/light/md`, `Grid/desktop` | |

- **Axis order** is `variant`, `tone`, `size`, `state`, then any others, and the default of each axis comes first, so the default variant is the set's top-left cell.
- **Collections:** `Primitives` (one mode), `Semantic` (four theme modes: purple-light, purple-dark, emerald-light, emerald-dark), `Component` (one mode) and `Viewport` (mobile, tablet, desktop).
- **A page is found by its plain name,** not its emoji, in every script and command, so a page can be renamed or re-iconed without breaking anything.
