# 0209 — Four packages are published and versioned together, and the manifest generator is a private tool, over publishing it as a fifth package

**Status:** Accepted · **Date:** 2026-11-14

## Context
[ADR-0202](./0202-the-five-public-packages-are-versioned-together-and-the-first-release-is-0-1-0-over-independent-versions-or-a-first-release-at-1-0-0.md) made `components`, `tokens`, `utils`, `icons` and `manifest` one fixed group, released together at `0.1.0`. Writing the guides for the packages showed that `@dbm-system/manifest` has no use outside this repository. The manifest it makes ships inside `@dbm-system/components` ([ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md)), and the generator expects this repository's layout: a `src/index.ts` barrel and stories titled `Tier/Category/Name`. A published package an app cannot sensibly use is surface to document, version and support.

## Decision
- **Four packages are published, as one fixed group:** `@dbm-system/components`, `@dbm-system/tokens`, `@dbm-system/icons` and `@dbm-system/utils` release together at one version, and the first release is `0.1.0`, produced by a `minor` changeset (ADR-0202's other decisions stand).
- **`@dbm-system/manifest` is private:** the build tool of this repository, run by the components build and by `pnpm sync-agents`. It is not published, so it is out of the fixed group and its version is not bumped.
- **`@dbm-system/utils` is published because the components depend on it,** and an app does not install it: the parts an app is meant to call are re-exported from `@dbm-system/components`, and the rest is internal and may change in any release.
- **An app installs three packages:** components, tokens and icons.

## Alternatives considered
- **Publish the manifest package as a fifth package.** It would need its own README, versioning and support for a tool whose assumptions are this repository's. Rejected.
- **Keep it public and document the layout it expects.** The documentation would be the only thing an outsider could use. Rejected.
- **Make `utils` private too.** The components package depends on it at run time, so it has to be installable. Rejected.

## Consequences
- The published `@dbm-system/components` `package.json` lists the private manifest package under `devDependencies`, which an installer never reads.
- `check-publish` and `check-fresh-app` pack four packages, and a published package must not depend on the manifest package.
- A later need to publish the generator is a new ADR.

## Related
`01-vision-and-goals.md` §13. [ADR-0202](./0202-the-five-public-packages-are-versioned-together-and-the-first-release-is-0-1-0-over-independent-versions-or-a-first-release-at-1-0-0.md), [ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md).
