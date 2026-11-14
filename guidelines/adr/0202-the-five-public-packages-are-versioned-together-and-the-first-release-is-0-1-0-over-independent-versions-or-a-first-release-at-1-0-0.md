# 0202 — The five public packages are versioned together and the first release is 0.1.0, over independent versions or a first release at 1.0.0

**Status:** Accepted · **Date:** 2026-11-13

## Context
Nothing is published and every package is at `0.0.0`. Changesets can version packages independently, together (`fixed`) or loosely together (`linked`), and `.changeset/config.json` had both lists empty. `@dbm-system/components` depends on `@dbm-system/tokens`, `@dbm-system/utils` and `@dbm-system/icons`, and the manifest describes the components, so a consumer or an agent reading the manifest needs to know which versions belong together.

## Decision
- **The five public packages are one fixed group** in `.changeset/config.json`: `components`, `tokens`, `utils`, `icons` and `manifest` always release at the same version. The two private packages (`eslint-config`, `tsconfig`) are not published and stay out of the group.
- **The first release is `0.1.0`**, produced by a `minor` changeset on the `0.0.0` packages. The public API is pre-1.0: a breaking change before `1.0.0` bumps the minor version, with the migration in its changeset (`06-engineering-standards.md` semver rule). `1.0.0` is a separate, deliberate decision once the API has been used for real.

## Alternatives considered
- **Independent versions.** Least churn per package, but a consumer must work out which `tokens` goes with which `components`, and a patch to one package needs a compatibility check against the rest. Rejected.
- **`linked` versions.** Versions rise together only when several packages change in one release, so they drift apart again. Rejected.
- **First release at `1.0.0`.** Promises a stable API before the manifest, the consumer CSS loading and a fresh-app install test have been used by anyone. Rejected.

## Consequences
- One version number to cite in a changelog, an issue or a manifest.
- A package with no change still gets a version bump when another in the group changes; its changelog entry is empty.
- Moving to independent versions later is a new ADR.

## Related
`01-vision-and-goals.md` §13 (Phase 8). `06-engineering-standards.md` (semver discipline). [ADR-0176](./0176-releases-use-the-changesets-version-packages-pull-request-with-npm-provenance-over-a-manual-or-fully-automatic-publish.md).
