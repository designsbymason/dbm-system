---
"@dbm-system/components": patch
---

`Table` and `DataTable`: a pinned header and pinned columns no longer paint over a sticky bar (a `Navbar`, for example) that the page scrolls the table beneath. The table's container is now its own stacking context, so its layers stay inside it.
