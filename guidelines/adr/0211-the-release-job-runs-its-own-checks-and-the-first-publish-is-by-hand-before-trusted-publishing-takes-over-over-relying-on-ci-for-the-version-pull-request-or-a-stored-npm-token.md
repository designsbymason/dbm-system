# 0211 — The release job runs its own checks and the first publish is by hand before trusted publishing takes over, over relying on CI for the version pull request or a stored npm token

**Status:** Accepted · **Date:** 2026-11-14

## Context
[ADR-0176](./0176-releases-use-the-changesets-version-packages-pull-request-with-npm-provenance-over-a-manual-or-fully-automatic-publish.md) chose the Changesets "Version Packages" pull request with npm provenance and no stored token. Two things it left open: a pull request the action opens with the default token does not trigger CI, and npm trusted publishing is configured on a package that already exists, while none of the four packages is on npm yet.

## Decision
- **`.github/workflows/release.yml` runs on push to `main`.** Before the Changesets action it installs, builds and runs `check-publish`, `check-manifest` and the unit tests, so nothing is versioned or published unchecked. The browser tests are not repeated: CI has run them on the same commit.
- **Publishing is `changeset publish` through `pnpm release`,** with `NPM_CONFIG_PROVENANCE=true` and `id-token: write`, so pnpm rewrites the `workspace:` versions and npm authenticates by OIDC. The job checks that npm is 11.5.1 or newer, which trusted publishing needs.
- **The first release, `0.1.0`, is published once by hand** from the maintainer's machine with 2FA, because a trusted publisher can only be added to an existing package. After that the maintainer adds the trusted publisher (this repository, workflow `release.yml`) on each package, and every later release goes through the workflow.
- **No npm token is ever stored** as a repository secret, including temporarily.

## Alternatives considered
- **A personal access token or GitHub App so CI runs on the version pull request.** Needs a stored secret. Rejected; the release job's own checks cover it.
- **A temporary npm token for the first publish.** Breaks the no-stored-token rule even briefly. Rejected.

## Consequences
- The first release has no provenance attestation; releases from `0.1.1` on do.
- The version pull request shows no checks; the merge run does the checking before it publishes.
- The repository setting "Allow GitHub Actions to create and approve pull requests" and the npm scope, 2FA and trusted-publisher settings are the maintainer's.

## Related
[ADR-0176](./0176-releases-use-the-changesets-version-packages-pull-request-with-npm-provenance-over-a-manual-or-fully-automatic-publish.md), [ADR-0209](./0209-four-packages-are-published-and-versioned-together-and-the-manifest-generator-is-a-private-tool-over-publishing-it-as-a-fifth-package.md). `02-tech-stack-and-structure.md` §3.2 (Actions pins).
