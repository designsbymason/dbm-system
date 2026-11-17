---
"@dbm-system/components": patch
---

`Tabs` and `Toolbar`: the scroll buttons at the end of a scrolling list no longer paint over, or take clicks through, a sticky bar (a `Navbar`, for example) that the page scrolls the component beneath. Each component's frame is now its own stacking context, so the buttons' layer stays inside it.
