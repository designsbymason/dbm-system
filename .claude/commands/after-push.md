---
description: After a push, work out whether CI needs watching, watch it if so, and report per job with failures checked against the known flakes
argument-hint: (optional run id; defaults to the latest CI run on main)
---

Report on CI for the latest push to `main`. Run id, if given: $ARGUMENTS

Pushes go straight to `main` (pull requests exist for collaborators only, ADR-0172, and are not part of this flow), so use `gh` against the push's run, not any PR tooling. Change nothing and push nothing.

1. Find the run: `gh run list --workflow=CI --limit 2 --json databaseId,headSha,status,conclusion,createdAt`. Take the latest (or the id given) and the run before it.
2. Work out what the push contained: `git diff --stat <previous run's headSha>..<this run's headSha>`.
   - **Docs only** (`guidelines/`, READMEs, ADRs, review files, community files, nothing else): don't wait. Report that CI is running, give the run id, and stop.
   - **Anything else** (components, tests, stories, CSS, tokens, scripts, workflows, `.github/pages/`, `CLAUDE.md`, `.claude/`): watch the run to completion.
3. Report each job: `ci` and `browser-tests (ubuntu-26.04)`. Also report the `Pages` and `CodeQL` runs for the same push (`gh run list --limit 4`); a failed `Pages` run means the live site was not updated. Also report the "Check guidelines" step's warning count, and the number of open Dependabot alerts.
4. For a failure, pull the failing test names and messages with `gh run view <id> --log-failed`, and say which are known: check the memory notes and the "Post-Finalization" entries in `guidelines/component-reviews/` for that test. A failure on code the push changed, or one that repeats on a rerun, is not a flake until you've shown it.
5. If a failure is real, reproduce it locally before proposing a fix, and propose the fix without applying it.

Keep the report short: the run id, what the push contained, per-job result, and anything that needs me.
