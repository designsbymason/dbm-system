---
"@dbm-system/components": patch
---

`TableToolbar.Filters`, in its bottom sheet: keyboard focus no longer falls out of the sheet. Pressing a section's "Clear" now moves focus to that section's first control, and "Clear all" moves it to "Done", instead of dropping it to the dialog or to the page behind; and the sheet now opens with focus on the first filter control, not on a section's "Clear" (which Enter would press).
