# 0239 — A change to a published package must add a changeset in the same push, checked by a script in CI and a pre-push hook, over trusting the habit or a per-commit hook

**Status:** Accepted · **Date:** 2026-11-22

## Context
The Version Packages pull request releases only what changesets describe (ADR-0176), so a change to a published package pushed without one never reaches npm, and nothing noticed: the Button `secondary` height fix was committed without a changeset and was caught only because the maintainer asked. A rule in `CLAUDE.md` and in `RELEASING.md` depends on someone remembering it.

## Decision
`scripts/check-changeset.mjs` (`pnpm check-changeset`) reads a range of commits and fails when any of them changes a file a consumer receives and the range adds no file to `.changeset/`. A file a consumer receives is one under `src/` of `components`, `tokens`, `utils`, `icons` or `mcp`, except tests, stories, Docs pages, snippets, story kits and the Storybook-only `foundations/` and `guides/`. An empty changeset (`pnpm changeset --empty`) is the way to say a change needs no release. The commits Changesets makes ("chore: version packages") are skipped.

It runs in two places: a `changeset` job in `ci.yml` on every push and pull request (the range is the push's previous commit to its head, or the pull request's base to its head), and `.githooks/pre-push` before a push to `main`, with the remote's tip as the base.

The unit of the check is the range being pushed, not a single commit, so a changeset may come in a later commit of the same push (as the Button fix's did).

## Alternatives considered
- **Rely on the written rule.** Rejected: it already failed once.
- **A pre-commit check.** Rejected: it would block checkpoint commits and the changeset-as-its-own-commit flow, and it cannot see the rest of the push.
- **A changeset bot or a required GitHub check on pull requests.** Rejected: pushes to `main` are direct, and the bot is a third-party service (`CLAUDE.md`, free and open-source tooling only).
- **Check that the changeset names the right packages and bump.** Rejected: not decidable by a script; the Version Packages pull request is where a person reads them (`RELEASING.md` step 3).

## Consequences
- A push that changes a published package and adds no changeset fails the hook and then CI. The fix is a changeset, or an empty one.
- **Limits** (listed in `RELEASING.md`): the check looks for a changeset's presence, not its packages, bump or wording; it decides what a consumer receives from a list of path patterns, so a file it misjudges needs the empty changeset or a pattern change in the script; a change to a shipped `README.md`, `AGENTS.md` or a package's `package.json` is not seen; a changeset pushed after the change, in a later push, does not satisfy the earlier one; `git push --no-verify` skips the hook (CI still runs); a force-push whose previous commit CI cannot find fails rather than skips; a changeset deleted by the release commit is not needed again, but one deleted by hand in the range does not count.
