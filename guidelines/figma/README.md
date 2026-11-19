# Figma library — internal reference

The plan, decisions and status for the DBM System Figma component library (Phase 11, `../01-vision-and-goals.md` §13). These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** the plan in [01-plan.md](./01-plan.md) is approved and Phase 0 (groundwork) is in progress; nothing has been written to Figma and no package has changed. Phase 0's connection check is done: the file is empty (one Cover page, no variables or styles), the account is on a Professional plan, and Nunito and Lora are available in Figma. The four-mode limit is confirmed when Phase 1 creates the Semantic collection.

**Private data never goes in this folder.** The Figma file's key, URL and node IDs live in `.local/figma.json`, which is gitignored (`01-plan.md` §3). Refer to "the Figma file", never its address.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the decisions taken, the structure of the Figma file, the build rules, the phases with their review gates, risks and open questions |
