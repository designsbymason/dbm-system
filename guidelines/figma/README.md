# Figma library — internal reference

The plan, decisions and status for the DBM System Figma component library (Phase 11, `../01-vision-and-goals.md` §13). These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** the plan in [01-plan.md](./01-plan.md) is approved. Phases 0 to 3 are built: the groundwork, the 413 variables, the styles and the Foundations page, and the cover, Getting started page, Icons page and Spec frame master. Phase 3 awaits the maintainer's review; the pilot components (Phase 4) are next. No package has changed.

**Private data never goes in this folder.** The Figma file's key, URL and node IDs live in `.local/figma.json`, which is gitignored (`01-plan.md` §3). Refer to "the Figma file", never its address.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the decisions taken, the structure of the Figma file, the build rules, the phases with their review gates, risks and open questions |
