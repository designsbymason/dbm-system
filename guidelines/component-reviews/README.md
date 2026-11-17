# Component Review Findings

One file per component, holding the detailed findings from its `06-engineering-standards.md` §9 review pass — what was checked, what was found, what was fixed, and (once declared) its Finalized status and date.

This folder exists to keep `07-storybook-and-documentation-standards.md` §6 from growing without bound as more components go through review — that section stays a compact, scannable status table; the actual per-component narrative lives here instead. See `CLAUDE.md`'s note on numbered docs staying current-state reference, applied to this specific unbounded-growth case.

## Conventions

- **One file per component**, named to match the component exactly (`Affix.md`, `IconButton.md`) — no subfolders, no category grouping, so a lookup is always a direct filename match.
- **Living documents, not immutable like `guidelines/adr/`.** A component's own file is already scoped tightly to just that component, so it naturally stays bounded — new findings (an authorized post-Finalization fix, a later re-opened section) get appended to the same file, not written as a new dated file.
- **Index, don't duplicate.** `07-storybook-and-documentation-standards.md` §6 is the status table (Docs page? Finalized? which category?) — this folder is where the "why"/"what was found" detail lives. Don't restate a component's full history in §6 when a one-line status + link says the same thing.
- **Cross-cutting findings belong in `05`/`06`, not repeated per-component.** If a review surfaces a bug class or convention that applies beyond one component (e.g. the JSX-attribute-ordering bug), the *standing rule* goes in `05-component-api-conventions.md`/`06-engineering-standards.md`; a component's own file just notes "confirmed instance of [rule], see `05-component-api-conventions.md` §3" rather than re-explaining the mechanism.
- **An open finding that needs a decision or a fix is also one line in [`../open-items.md`](../open-items.md)**, linking back here for the detail, and the line is deleted when the finding closes. A component's own gaps (a browser not tried, a feature not built) stay here only.
- **A genuine architecture/API decision found during a review** (not just a bug fix) still belongs in `guidelines/adr/`, per the usual bar — a component's own review file isn't a substitute for that.

## Index

Not duplicated here — see `07-storybook-and-documentation-standards.md` §6's own status table for the current, authoritative list of which components have a review file and their Finalized status. Restating it here would just be a second copy to keep in sync.
