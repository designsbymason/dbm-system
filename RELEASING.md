# Releasing

How a release of the five public packages (`@dbm-system/components`, `tokens`, `utils`, `icons` and `mcp`, always one version together) is made. The decisions behind it are in [ADR-0176](guidelines/adr/0176-releases-use-the-changesets-version-packages-pull-request-with-npm-provenance-over-a-manual-or-fully-automatic-publish.md), [ADR-0209](guidelines/adr/0209-four-packages-are-published-and-versioned-together-and-the-manifest-generator-is-a-private-tool-over-publishing-it-as-a-fifth-package.md) and [ADR-0211](guidelines/adr/0211-the-release-job-runs-its-own-checks-and-the-first-publish-is-by-hand-before-trusted-publishing-takes-over-over-relying-on-ci-for-the-version-pull-request-or-a-stored-npm-token.md). No npm token is stored anywhere: publishing uses npm trusted publishing (OIDC) and each release carries a provenance attestation.

## Make a release

1. **Add a changeset** with every change that should reach a consumer: `pnpm changeset`, pick the packages and the bump (`minor` for a breaking change before 1.0, `patch` otherwise), and write the changelog entry for a reader. Commit it with the change. `pnpm check-changeset` fails when a range of commits changes what a consumer receives (the source of a published package, not its tests, stories or docs pages) and adds no changeset; CI runs it on every push and pull request, and `.githooks/pre-push` runs it before a push to `main`. A change that needs no release says so with `pnpm changeset --empty`. The changelog is formatted by `.changeset/changelog.mjs`, which is Changesets' own except that it writes no "Updated dependencies" lines (the four packages move together, so they would only repeat); what a release changed is what the changesets say.
2. **Merge to `main`.** The Release workflow (`.github/workflows/release.yml`) runs the build, `check-publish`, `check-manifest` and the unit tests, then opens or updates a pull request titled "chore: version packages" that holds the version bumps and changelogs.
3. **Review that pull request**: the versions and the changelog text are what consumers will read. Merging it is the release checkpoint.
4. **Squash-merge it** (the repository allows squash merges only). The workflow runs again, publishes the five packages with provenance, and pushes a git tag for each (`@dbm-system/<name>@<version>`).
5. **Check it**: `npm view @dbm-system/components version` should print the new version, and `npm view @dbm-system/components@<version> dist.attestations` should show a provenance attestation. A new version can take a few minutes to appear on npm.

### What the changeset check does not catch

`pnpm check-changeset` (ADR-0239) looks for a changeset's presence in the pushed range, nothing more:

- It does not read the changeset: the packages, the bump and the wording are checked by a person in the Version Packages pull request (step 3).
- What a consumer receives is a list of path patterns in `scripts/check-changeset.mjs` (the `src/` of the five packages, minus tests, stories, Docs pages, snippets and the Storybook-only pages). A file it misjudges needs an empty changeset or a change to the patterns.
- It does not see a change to a package's `README.md`, `AGENTS.md` or `package.json`.
- A changeset pushed later does not satisfy an earlier push: the change and its changeset go in the same push.
- `git push --no-verify` skips the hook; CI still runs the check. A force-push whose previous commit CI cannot find fails the job instead of skipping.

## One-time settings (already made)

- **GitHub:** Settings → Actions → "Allow GitHub Actions to create and approve pull requests" is on.
- **npm:** the `dbm-system` organization owns the scope, and each of the five packages has a trusted publisher: repository `designsbymason/dbm-system`, workflow `release.yml`, no environment, with **Allow npm publish** ticked and **Allow npm dist-tag** unticked. With "Allow npm publish" unticked npm accepts only `npm stage publish`, which Changesets does not run, and the publish step fails.
- **A new public package** needs the same trusted publisher added on npm, and its first version published by hand, because a trusted publisher can only be added to a package that exists. Do it in this order: make the package public locally at the group's version (drop `private`, add it to the fixed group in `.changeset/config.json`) and run `pnpm build && pnpm check-publish`; publish it by hand from that commit (`pnpm publish --access public --no-git-checks` in its folder, approved with a passkey); add its trusted publisher on npm; check `npm view <name> version`; and only then push the commit. With it public on `main` and not yet on npm, the publish step of this workflow tries it with the OIDC login, which has no trusted publisher yet, and fails. The first version has no provenance. `@dbm-system/mcp` went out this way at `0.2.1`.

## When it fails

- **The publish step ends with `TypeError: Cannot read properties of undefined (reading 'includes')`:** npm refused the publish and Changesets 2.31.1 hid the reason. Check each package's trusted publisher (the settings above).
- **The Test step fails with `window is not defined` after the tests pass:** a known slow-runner flake; rerun the failed job.
- **`changesets/action` says it is for another Changesets CLI version:** action v2 goes with Changesets CLI 3 (action v1 with CLI 2), and the repository is on CLI 3, so keep the two in step.
