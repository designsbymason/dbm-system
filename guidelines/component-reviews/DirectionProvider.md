# DirectionProvider

**Tier:** Atom · **Category:** Utility · **Finalized:** ❌ (built 2026-11-06, review pending)

Built as part of the AppShell work ([ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md), implementing [ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md) in part).

## Built
- `DirectionProvider` (context only, no element) and `useDirection(own?)`; types and JSDoc; 8 unit tests (default, provided, own wins, nesting, fallback).
- `Sidebar`, `Navbar` and `AppShell` read it. Batch 1 of the wiring (2026-11-06) added `Slider`, `RangeSlider`, `ScrollArea`, `ToggleGroup`, `Stepper`, `Combobox`, `MultiSelect`, `Tree` and `CommandPalette`: each swaps its `dir = "ltr"` default for `useDirection(dir)`. One table-driven test (`DirectionProvider.consumers.test.tsx`) checks that each follows a provider, is left to right without one, and that its own `dir` wins; breaking the wiring in all nine made all nine cases fail. Later batches add to the same table.
- Stories (Playground, whole app, own `dir` wins), snippets (checked by `storySnippets.test.ts`), Docs page, description, inventory row.

## Not done / not verified
- No `06` §9 review pass yet; not declared Finalized.
- The Docs page and stories were not looked at in a browser by a person.
- The remaining direction-aware components (`Tabs`, `Accordion`, `RadioGroup`, `Slider`, `Dialog`, `Menu`, `Calendar`, `Combobox`, `Tree`, `Toast`, …) are unchanged.
