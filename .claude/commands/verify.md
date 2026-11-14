---
description: Run exactly the steps CI runs, one after another, on the working tree and report per step (read-only; never commits or pushes)
argument-hint: (optional: "quick" for lint, types, guidelines and unit tests only; a step name to run just that step)
---

Run the local equivalent of the CI pipeline on the current working tree. Option, if any: $ARGUMENTS

This is a verify step: change no files, commit nothing and push nothing. Run the steps **one after another, never together**: the real-browser Storybook suite shares the machine with everything else, and the flakes in my memory notes come from overlap. The source of truth is `.github/workflows/ci.yml`: read it first, and if it has a step this list lacks, run that step too and say the list is stale.

From the repo root, in this order (each stops the run on a failure you can't explain; a failure is reported with its output, never summarised away):

1. `pnpm audit` (the accepted advisories are in `guidelines/02-tech-stack-and-structure.md` §3.1; anything else is a finding)
2. `pnpm check-radix-single-copy` (the lockfile holds one version of each shared Radix package; `02` §3.2 step 4)
3. `pnpm lint` (ESLint, then both type checks)
4. `pnpm build`
5. `pnpm check-publish` (packs each public package, then publint and @arethetypeswrong/cli; needs the build)
6. `pnpm --filter @dbm-system/components check-component-bundle-size`
7. `pnpm --filter @dbm-system/components check-foundations-token-coverage`
8. `pnpm --filter @dbm-system/components check-guidelines` (report the warning count)
9. `pnpm --filter @dbm-system/components build-storybook`, then `pnpm --filter @dbm-system/components check-storybook-bundle-size` (report the size against its budget)
10. `pnpm test` (unit)
11. `pnpm --filter @dbm-system/components test:storybook` (real browser: stories, `play` functions, axe)
12. `pnpm --filter @dbm-system/components test:visual` (run it from `packages/components`, as CI does; the root has no such script; the Playwright visual-regression suite; it needs the Storybook dev server, so start it with `preview_start` if it is not running, and report a snapshot difference with the story it is on, never update snapshots)

With `quick`, run only 3, 8 and 10. With a step name, run just that step.

For a failure: say whether it is a known flake (my memory notes and the "Post-Finalization" entries in `guidelines/component-reviews/`) and rerun that one test or folder alone to see; a failure on code the working tree changed, or one that repeats alone, is not a flake until shown. Reproduce before proposing a fix, and propose it without applying it.

Reply with a table of step, result and anything that needs me (warning counts, sizes against budgets, flakes rerun and how they ended), and say what was not run and why. Then wait for my instruction.
