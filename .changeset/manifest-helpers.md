---
"@dbm-system/components": minor
---

The manifest lists the helpers apart from the components. A helper is a component that supports another and has no page of its own (`HoverCardProvider`, `ImageViewerButton`, `TooltipProvider`): it moves out of `components` into a new `helpers` list (each entry also names the component it supports in `helperOf`), its file moves from `manifest/components/` to `manifest/helpers/`, and `manifest/index.json` has a `helpers` list beside `components`. The `components` list is now the 120 components that have a page of their own, the two application shells included. `AGENTS.md` lists them under Helpers.
