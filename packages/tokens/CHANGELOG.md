# @dbm-system/tokens

## 0.2.1

No changes in this release.

## 0.2.0

No changes in this release.

## 0.1.2

No changes in this release.

## 0.1.1

### Patch Changes

- de93e6b: No functional changes. This is the first release published through the automated release workflow, so it carries an npm provenance attestation that links each package to the commit and workflow run that built it (0.1.0 was published by hand and has none).

## 0.1.0

### Minor Changes

- cc3cd65: First release of the DBM System.

  - `@dbm-system/components`: 123 accessible React components (atoms, molecules, organisms and the AppShell and PageShell templates), each with full TypeScript types, a stylesheet and a machine-readable manifest (`@dbm-system/components/manifest/index.json`), and an `AGENTS.md` at the package root for AI coding agents.
  - `@dbm-system/tokens`: the design tokens as CSS (four self-contained themes, purple and emerald in light and dark), typed constants, and a token index (`@dbm-system/tokens/tokens.json`).
  - `@dbm-system/icons`: the Phosphor icon set, typed.
  - `@dbm-system/utils`: the helpers the components are built on; an app does not install it.

  The API is before 1.0: a breaking change bumps the minor version and says how to migrate in its changeset.
