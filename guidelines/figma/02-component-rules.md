# Figma library — standing rules for components and properties

The rules every component in the Figma library follows. They are standing rules: a change to one is a new ADR in `../adr/`, not an edit here. Each component's own list of properties is agreed when its build is planned and recorded in its spec frame ([01-plan.md](./01-plan.md) §4), not in this file.

**Decided in:** [ADR-0235](../adr/0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md) (the file and its spec frames) and [ADR-0237](../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md) (the full matrix).

## 1. Which components are drawn

A component is drawn when it has something to see: **91 of the 120 components** in `packages/components/src/componentCatalog.json` (29 atoms, 35 molecules, 27 organisms), built in tier order, atoms then molecules then organisms, one review gate per category.

Not drawn, and listed on the Components page's table of what is not drawn, with the reason:

- **Templates:** `AppShell` and `PageShell`.
- **Non-visual utilities:** `ClientOnly`, `DirectionProvider`, `FocusTrap`, `Portal`, `ThemeProvider`, `VisuallyHidden`.
- **Layout primitives:** `Box`, `Stack`, `Grid`, `GridItem`, `Center`, `Container`, `Bleed`, `Affix`, `AspectRatio`, `Spacer`. Figma expresses these as auto layout, so the Layout page explains them as patterns.
- **Behaviour only:** `Collapse`, `SkipLink` (a link that shows only while it has keyboard focus) and `BackToTop` (a rounded `IconButton` with an up arrow, fixed to a corner and shown once the page is scrolled; its recipe is in the table, [ADR-0247](../adr/0247-backtotop-is-not-drawn-and-is-a-rounded-iconbutton-with-an-up-arrow-over-drawing-it-as-a-component.md)).
- **Provided as styles:** `Backdrop`, as the paint styles `Backdrop/20`, `40`, `60` and `80` and the effect style `Backdrop/blur` ([ADR-0246](../adr/0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md)).
- **Composed from drawn parts or a plain frame:** `CheckboxGroup` and `RadioGroup` (auto layouts of `Checkbox` and `Radio` instances), `TimeRangePicker` (two `TimePicker` instances and a dash), `ScrollArea` (a scrolling frame) and `Splitter` (panes divided by a line), each with its recipe in the table ([ADR-0250](../adr/0250-five-molecules-are-not-drawn-and-are-recipes-built-from-drawn-parts-or-a-plain-frame-over-drawing-them-as-components.md)).
- **Provided as text styles:** `Text` and `Heading`, which are a text layer with a Body, Label, Heading or Display text style and a `text/*` colour variable ([ADR-0248](../adr/0248-text-is-not-drawn-and-is-a-text-layer-with-a-text-style-and-a-colour-variable-over-drawing-it-as-a-component.md), amended).
- **Hooks and functions:** nothing to draw.

An overlay (`Dialog`, `Drawer`, `Popover`, `Tooltip`, `Toast`, `Tour`) is drawn as a static open state, because Figma cannot hold a live overlay.

## 2. Which props become Figma properties

The component manifest (`@dbm-system/components/manifest.json`) lists every prop; each one is sorted by what it does.

| Kind of prop | In Figma |
|---|---|
| An enumerated visual prop (`size`, `variant`, `tone`, `orientation`, `align`, `side`, `shape`, `overlap`) | A **variant property** with the prop's name and the code's values |
| An interaction state, which the code gets from CSS (hover, focus, pressed) or from props (`disabled`, `isLoading`, `hasError`, `readOnly`) | One **`state` variant property**, with only the states the component has |
| A boolean that changes how it looks without changing the shape of the frame (`required`, `fullWidth`, `dot`, `clearable`) | A **boolean property** |
| A boolean that changes the shape or geometry (`rounded`) | A **variant property** with `false` and `true`, because a boolean property can only show or hide a layer ([ADR-0237](../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md), amended) |
| An icon (`leadingIcon`, `trailingIcon`) | A **boolean** to show it; the icon is swapped **in place** on the nested instance, with its **`tone`** set as a variant property on each variant (no instance-swap property, which has one default for the whole set) ([ADR-0238](../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)) |
| Text that appears on screen (a label, title, description, placeholder, the text of `children`) | A **text property** |
| An open content area (a Card body, Dialog content, Table cells, Tabs panels) | A **slot** |
| A number that changes the look (`value` on Progress, Slider or Rating; a Badge count) | **Not a property**: two or three representative values are drawn as variants or examples |
| Native passthrough, `className`, `style`, `id`, `data-*`, `aria-*`, `as`, `asChild`, event handlers, refs | **Not modelled** |
| A controlled value or behaviour (`value`, `open`, `defaultOpen`, `onChange`, `loop`, `announce`, `inputMode`, `enterKeyHint`, `labels`, formatters) | **Not modelled**, except where the value is itself a state worth drawing |

**Rules for a property:**

1. It is named as the prop is (`variant`, `size`, `tone`, `state`), and its values are the code's values.
2. Its default is the code's default (`variant=primary`, `size=md`).
3. A value the code has and the file does not draw is said in the spec frame (for example, an icon's `weight` has `thin`, `light` and `duotone` in code, and bold, regular and fill here).
4. A prop that is not modelled is named in the spec frame, with a link to the component's Props table in Storybook, which stays the full reference.
5. The component set's own configuration holds a **description** (a short plain-text summary taken from the manifest's summary, naming what is drawn and what is not) and a **documentation link** to its Storybook Docs page, `https://dbm-system.com/storybook/?path=/docs/<id>--docs`. The `<id>` is the `id` in the component's stories file (`atoms-inputs-button`), never built from the name by guessing; `scripts/figma-sync.mjs` reads it, and the Components page links use it. Dev Mode shows both. Figma allows one documentation link per set, so the Icon sets link to the Storybook Icon page (their description credits Phosphor) and the Spec frame master to the repository.
6. **Every link in the file is checked** with `/figma-drift`: an external one answers 200 (the npm page refuses scripted requests, so `npm view` stands in), a Storybook one names an id in the published `index.json`, and an internal one resolves to a node. A rebuilt frame or set gets a new id, so a page that links to it (Getting started, the Foundations "Go to" links, the Components index) is repointed in the same step.
7. **A text that carries a link** (a component's name on the Components page, a Storybook link in a spec frame) is filled with the `text/link` variable; set it when the link is added.

## 3. Coverage: what is drawn

A component set draws **a core of each property's values** and documents the rest ([ADR-0242](../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md), which supersedes ADR-0237). A set is never sparse: Figma switches to the closest drawn variant when a property changes on an instance.

**Default coverage,** which a component's plan may depart from with a recorded reason:

- **Look variants** (`variant`): all of them.
- **Tone:** `neutral` and `brand`; every status tone only where the tone means a status (Badge, Alert, Toast and similar).
- **Size:** `sm`, `md` and `lg`, with `md` the default; `xs` and `xl` are not drawn.
- **Structure** (Card's `layout`): all of them. A structure variant is drawn at the default state, and the states at the default structure, because structure does not change what a state does.
- **States:** every interaction state, **at every drawn size.**
- **Booleans, slots and text:** always.

**Rules:**

- **A budget of about 250 variants per set.** A set over it needs a recorded exception (Button is 200: `xl` is drawn, so every state at four sizes, with `rounded` off and on, and no `neutral` tone).
- **Exceptions are decided at plan time** and recorded in the map (`coverage`) and the component's file. They can widen coverage (Badge keeps all seven tones; Button keeps `xl`) or narrow it (Card draws size `md` only, and the tones `neutral` and `brand`).
- **Every undrawn value is documented.** The map lists it under the property's `undrawn` with a recipe, the spec frame has its own "In code, not drawn" section (a table: property, value not drawn, how to get it), and `pnpm check-figma-map` checks that drawn plus undrawn equals every value the code's type allows.
- **A combination that cannot occur is not drawn.** A state a component does not have is left out, and a property that matters only with another (a Badge's `position` only with an `anchor`) is not multiplied across the rest.
- **The axes run in the same order** in every set: `variant`, `tone`, `size`, `state`, then any others, with the default of each first.

**Getting an undrawn value:** override a drawn instance by the recipe, name the instance `Name (prop=value)` (for example `Button (size=xs)`) so a person or an agent reading the design sees what was meant, add the variant in your own copy, or ask for it to be drawn.

## 4. Structure of a component

- **Composition:** a molecule is made of atom instances and an organism of molecule and atom instances, never redrawn. A part of a compound component is its own component named `Parent/Part`.
- **Auto layout, constraints and slots** as in [01-plan.md](./01-plan.md) §6, and every fill, stroke, spacing, radius and type value bound to a variable or a style. The one exception is a value the code derives with `calc()` (the `secondary` Button's block padding, and each `Input` size's block padding, one border width less than the token, so the heights match Button): it is drawn as that number, unbound.
- **Responsive:** the Viewport modes drive type and spacing; a component that changes shape at a breakpoint gets a `platform` variant property.

## 5. The spec frame

Every component has a spec frame, an instance of the Spec frame master, on its category page. It lists the component's properties (§2 rules 3 and 4), its anatomy, the tokens it uses, what it is built from and its accessibility notes. What can be read from the layers or the manifest is generated or checked, and a person writes only the description, the anatomy and the accessibility notes ([01-plan.md](./01-plan.md) §8).
