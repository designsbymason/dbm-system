---
"@dbm-system/components": patch
---

The package's entries, `dist/index.js` and `dist/index.cjs`, start with `"use client"`, so in the Next.js App Router a server file can import and render a component without a wrapper file. A server file still cannot read a part of a compound (`Card.Header`), pass a function or an event handler as a prop, or call a hook; a file that does needs `"use client"` of its own. Importing from a file that has the marker keeps working.
