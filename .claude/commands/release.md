---
description: Walk a change to a published package from its checks to the published, pulled release, say which step you are at and what is left (changes nothing until each outward step is approved)
argument-hint: (no argument)
---

Walk the release sequence for the published packages: $ARGUMENTS

Read `RELEASING.md` ("When a published package changes: the whole sequence", then "Make a release") first; it is the source, this command only applies it. Then find where the work stands from the repository and GitHub, never from memory, and report the step you are at.

1. **Where it stands.** Run `git status -sb`, `git fetch`, `git log --oneline origin/main..HEAD` and `HEAD..origin/main`, `ls .changeset`, `pnpm check-changeset`, `gh pr list --head changeset-release/main`, `gh run list --limit 5`, and `npm view @dbm-system/components version` against `packages/components/package.json`. From them say which of these is true: a published-package change is uncommitted; committed with no changeset; committed and unpushed; pushed and CI running or failed; CI passed and the version pull request is open; the pull request merged and the Release run is in progress or done; published but the local clone behind; or nothing pending.
2. **Do the next step that is yours to do**, and only that one:
   - **Uncommitted or unpushed change:** run the checks in the sequence's item 1 and report real results. Create the changeset if one is missing (`CLAUDE.md`, "A change to a published package carries a changeset"). Do not commit unless asked.
   - **Before a push:** show exactly what is being pushed (the commits, the files, whether published code is in it) and wait for an explicit yes. Never push on your own.
   - **After a push:** run `/after-push`. For a bundle-budget or visual-baseline failure, follow item 3 of the sequence and propose the fix without applying it.
   - **Version pull request open:** read it (the versions, the changelog text, the files), report it, and ask before merging. Merging it publishes to npm and cannot be undone; ask in words that say so, and merge only on a yes. Squash-merge, as the repository allows only that.
   - **Release run in progress or done:** watch it, then check all five packages with `npm view`, provenance, the git tags and the Pages run.
   - **Published, clone behind:** run `git pull --ff-only` (only when the working tree is clean) and confirm local and remote are at the same commit.
3. **List what else applies** from items 6 and 7 of the sequence: the review file, `pnpm sync-agents` and `pnpm check-manifest`, the Docs page and snippets, `guidelines/open-items.md` and an ADR, as the change needs. Always include `/figma-drift`: it is required for every release that changes a published package.

Reply with the step you are at, what you did, what is left in order, and the one decision that is the user's. Rules: never push, merge, publish, change a repository setting or delete a branch without an explicit yes in this conversation; never put a token or the Figma file's address anywhere; don't name or link another design system.
