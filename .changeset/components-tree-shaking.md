---
"@dbm-system/components": patch
---

An app now ships only the components it imports. The package was one bundled ES module that a bundler had to keep whole, so importing `Button` alone carried the entire library (about 328 KB gzipped); it is now built as one module per component with shared chunks, and `Button` alone is about 3 KB. Imports, types and `styles.css` are unchanged. CommonJS (`require`) still gets one file.
