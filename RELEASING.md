# Releasing

How a release of the four public packages (`@dbm-system/components`, `tokens`, `utils`, `icons`, always one version together) is made. The decisions behind it are in [ADR-0176](guidelines/adr/0176-releases-use-the-changesets-version-packages-pull-request-with-npm-provenance-over-a-manual-or-fully-automatic-publish.md), [ADR-0209](guidelines/adr/0209-four-packages-are-published-and-versioned-together-and-the-manifest-generator-is-a-private-tool-over-publishing-it-as-a-fifth-package.md) and [ADR-0211](guidelines/adr/0211-the-release-job-runs-its-own-checks-and-the-first-publish-is-by-hand-before-trusted-publishing-takes-over-over-relying-on-ci-for-the-version-pull-request-or-a-stored-npm-token.md). No npm token is stored anywhere: publishing uses npm trusted publishing (OIDC) and each release carries a provenance attestation.

## Make a release

1. **Add a changeset** with every change that should reach a consumer: `pnpm changeset`, pick the packages and the bump (`minor` for a breaking change before 1.0, `patch` otherwise), and write the changelog entry for a reader. Commit it with the change. The changelog is formatted by `.changeset/changelog.mjs`, which is Changesets' own except that it writes no "Updated dependencies" lines (the four packages move together, so they would only repeat); what a release changed is what the changesets say.
2. **Merge to `main`.** The Release workflow (`.github/workflows/release.yml`) runs the build, `check-publish`, `check-manifest` and the unit tests, then opens or updates a pull request titled "chore: version packages" that holds the version bumps and changelogs.
3. **Review that pull request**: the versions and the changelog text are what consumers will read. Merging it is the release checkpoint.
4. **Squash-merge it** (the repository allows squash merges only). The workflow runs again, publishes the four packages with provenance, and pushes a git tag for each (`@dbm-system/<name>@<version>`).
5. **Check it**: `npm view @dbm-system/components version` should print the new version, and `npm view @dbm-system/components@<version> dist.attestations` should show a provenance attestation. A new version can take a few minutes to appear on npm.

## The MCP server package (not yet released)

`@dbm-system/mcp` ([ADR-0229](guidelines/adr/0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md), [ADR-0230](guidelines/adr/0230-the-mcp-server-is-a-fifth-public-package-in-the-fixed-version-group-over-folding-it-into-the-components-package-or-leaving-it-outside-the-group.md)) is built and checked by CI but is still `"private": true`, so the release workflow neither versions nor publishes it, and `check-publish` does not compare its version with its siblings'. Its first version is published by hand (a new public package, below). To make it public, in one change: set its version to the current group version, remove `"private": true`, add it to the fixed group in `.changeset/config.json`, and change the four packages named in this file to five. Publish it by hand, then add its trusted publisher on npm; the next release goes through the workflow.

## One-time settings (already made)

- **GitHub:** Settings → Actions → "Allow GitHub Actions to create and approve pull requests" is on.
- **npm:** the `dbm-system` organization owns the scope, and each of the four packages has a trusted publisher: repository `designsbymason/dbm-system`, workflow `release.yml`, no environment, with **Allow npm publish** ticked and **Allow npm dist-tag** unticked. With "Allow npm publish" unticked npm accepts only `npm stage publish`, which Changesets does not run, and the publish step fails.
- **A new public package** needs the same trusted publisher added on npm, and its first version published by hand, because a trusted publisher can only be added to a package that exists.

## When it fails

- **The publish step ends with `TypeError: Cannot read properties of undefined (reading 'includes')`:** npm refused the publish and Changesets 2.31.1 hid the reason. Check each package's trusted publisher (the settings above).
- **The Test step fails with `window is not defined` after the tests pass:** a known slow-runner flake; rerun the failed job.
- **`changesets/action` says it is for another Changesets CLI version:** action v2 goes with Changesets CLI 3 (action v1 with CLI 2), and the repository is on CLI 3, so keep the two in step.
