# 0184 — A story-only template page is a folder of stories and a story kit in `templates/`, with demo controls and no Playground, over a shipped component or a separate pages tree

**Status:** Accepted · **Date:** 2026-11-07

## Context
[ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md) decided that a page-level template is a story-only example page that an app copies, and said it gets a Docs page with its source and no manifest entry. It left open where such a page's files live, what a page has instead of a Playground and a props table (it has no props), and whether it gets a review file and a status row. The data-table list page is the first page, so its answers set the rule for the rest.

## Decision
- **Location.** A page is a folder in `packages/components/src/templates/{Name}/`, beside the shells, with the file set of `05` §1 that applies to something that is not a component: `{Name}.stories.tsx`, `{Name}.checks.stories.tsx`, `{Name}.snippets.ts`, `{Name}.mdx`, `{Name}.test.tsx`, `{Name}.ssr.test.tsx` and a story kit `{Name}StoryKit.tsx` holding the page itself. It has **no `index.ts`**, no `*.types.ts` and no export from `src/index.ts`, so nothing of it is in the package or the manifest. A stylesheet is added only if the page needs one of its own (then `{Name}.module.css` and a docs-token test); a page that draws with the components it is made of and token-valued inline styles has none.
- **The page lives in the story kit.** The kit holds the page's words (English and Persian), its demo data, the hook that holds its state and the page itself, so the stories, the checks, the tests and the Docs page all draw the same thing. What an app copies is the kit, read through the Docs page's code examples.
- **No Playground, demo controls instead.** A page has no props to drive. Its first story (`Default`) takes a few Storybook-only controls that change what a simulated server answers (how much data, how long a request takes, whether it fails), and the Docs page's "Interactive Playground" section embeds it with `<PlaygroundControls>`. Its "Properties" section describes the state the page holds and the props of the components it hands that state to, in `ReferenceTable`s, instead of a props table. Every other section of the `07` §4 template is kept, with the same headings.
- **Review and status.** A page gets a `component-reviews/{Name}.md` and a row in the `07` §6 status table (tier Template, its group as the category), and the maintainer declares it Finalized like any other.
- **Checks.** The template checks of `06` §9 apply to a page as they do to a shell, plus the checks of whatever the page composes that a real browser alone can show (a menu and a dialog chosen with a real mouse inside the shell, where focus lands after a removal).

## Alternatives considered
- **A `src/template-pages/` tree beside `templates/`.** Keeps shipped and unshipped code apart by folder, but splits the Templates group's code across two places for no behavioural reason: the absent `index.ts` already says it does not ship, and `check-component-bundle-size` and the manifest only see what the package exports.
- **A shipped component with data props.** Already rejected by ADR-0179.
- **A Playground that drives the page's own configuration (density, columns, toolbar parts).** Would invent props for something that is meant to be edited as source, and would make the page look like API.
- **No review file or status row for a page.** The row is what keeps `pnpm check-guidelines` and the inventory honest about what is built, and a page is where the cross-component findings surface (the list page found a defect in `Table`'s scroll frame).

## Consequences
- Every later page is built the same way, and the Getting started Templates list, read from Storybook's index, picks it up with a line in `componentDescriptions.ts`.
- A page's Docs page has a "Properties" section that is not a props table; the `07` §5 checklist items about the Playground, argTypes and the Properties table's order apply to the demo controls only.
- A page is not counted in the component summary in `04`, and not in the bundle-size budgets.

## Related
`04-component-inventory.md` (Templates and their build order), `05-component-api-conventions.md` §1, `06-engineering-standards.md` §9, `07-storybook-and-documentation-standards.md` §3–§6 and §11, ADR-0179.
