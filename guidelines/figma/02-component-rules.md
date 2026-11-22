# Figma library — standing rules for components and properties

The rules every component in the Figma library follows. They are standing rules: a change to one is a new ADR in `../adr/`, not an edit here. Each component's own list of properties is agreed when its build is planned and recorded in its spec frame ([01-plan.md](./01-plan.md) §4), not in this file.

**Decided in:** [ADR-0235](../adr/0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md) (the file and its spec frames) and [ADR-0237](../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md) (the full matrix).

## 1. Which components are drawn

A component is drawn when it has something to see: **101 of the 120 components** in `packages/components/src/componentCatalog.json` (34 atoms, 40 molecules, 27 organisms), built in tier order, atoms then molecules then organisms, one review gate per category.

Not drawn, and listed on the Components page's table of what is not drawn, with the reason:

- **Templates:** `AppShell` and `PageShell`.
- **Non-visual utilities:** `ClientOnly`, `DirectionProvider`, `FocusTrap`, `Portal`, `ThemeProvider`, `VisuallyHidden`.
- **Layout primitives:** `Box`, `Stack`, `Grid`, `GridItem`, `Center`, `Container`, `Bleed`, `Affix`, `AspectRatio`, `Spacer`. Figma expresses these as auto layout, so the Layout page explains them as patterns.
- **Behaviour only:** `Collapse`.
- **Hooks and functions:** nothing to draw.

`Backdrop`, `SkipLink` and `BackToTop` are drawn only if they have a visual state worth drawing, decided when their category is reached ([01-plan.md](./01-plan.md) §8). An overlay (`Dialog`, `Drawer`, `Popover`, `Tooltip`, `Toast`, `Tour`) is drawn as a static open state, because Figma cannot hold a live overlay.

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

## 3. The matrix

A component set draws **the full matrix of valid combinations** in one set ([ADR-0237](../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md)): every value of every variant property with every other, and every state, at every size. Button is 450 variants: five variants with two tones (`destructive` ignores the tone, so nine combinations), five sizes, five states (default, hover, focus, disabled, loading) and `rounded` off or on.

- **A state that size and layout do not change is drawn once,** at the default size and layout, for every variant and tone (Card: hover, pressed, focus and disabled at `md` and `stacked`). Where size or layout does change a state, every size is drawn.
- **A combination that cannot occur is not drawn.** A state a component does not have is left out, and a property that matters only with another (a Badge's `position` only with an `anchor`) is not multiplied across the rest.
- **The axes run in the same order** in every set: `variant`, `tone`, `size`, `state`, then any others.
- **The pilot measures it.** The first sets built (Button, Input, Badge, Card) show whether a set this size is workable in Figma. If it is not, the rule changes through a new ADR before more are built.

## 4. Structure of a component

- **Composition:** a molecule is made of atom instances and an organism of molecule and atom instances, never redrawn. A part of a compound component is its own component named `Parent/Part`.
- **Auto layout, constraints and slots** as in [01-plan.md](./01-plan.md) §6, and every fill, stroke, spacing, radius and type value bound to a variable or a style. The one exception is a value the code derives with `calc()` (the `secondary` Button's block padding, and each `Input` size's block padding, one border width less than the token, so the heights match Button): it is drawn as that number, unbound.
- **Responsive:** the Viewport modes drive type and spacing; a component that changes shape at a breakpoint gets a `platform` variant property.

## 5. The spec frame

Every component has a spec frame, an instance of the Spec frame master, on its category page. It lists the component's properties (§2 rules 3 and 4), its anatomy, the tokens it uses, what it is built from and its accessibility notes. What can be read from the layers or the manifest is generated or checked, and a person writes only the description, the anatomy and the accessibility notes ([01-plan.md](./01-plan.md) §8).
