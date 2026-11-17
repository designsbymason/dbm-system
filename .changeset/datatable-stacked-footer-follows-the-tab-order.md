---
"@dbm-system/components": patch
---

`DataTable.Pagination` with `layout="centered"`: below `collapseBelow` the page size and the range now sit at the two ends of the first row and the page controls take the row under them, so Tab moves down the footer instead of from the lower row back up to the upper one (WCAG 2.4.3). The wide and one-row layouts are unchanged.
