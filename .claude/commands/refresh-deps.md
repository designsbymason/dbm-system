---
description: Run the manual dependency-refresh pass and propose what to update, ordered and with risks (changes nothing until the plan is approved)
argument-hint: (optional focus, e.g. "security only" or "storybook")
---

Run the dependency-refresh pass for this repo. Focus, if any: $ARGUMENTS

Dependabot version updates are off and nothing prompts a refresh, so this is a deliberate pass. This step is read-only: change no files and install nothing until I approve the plan.

1. Read `guidelines/02-tech-stack-and-structure.md` §3.1 (the vulnerability pattern and the accepted advisories) and §3.2 (the refresh pass, the scheduled-maintenance list).
2. Gather facts: `pnpm outdated -r`, `pnpm audit`, open Dependabot alerts (`gh api repos/designsbymason/dbm-system/dependabot/alerts` filtered to `state == "open"`), and the date of the last refresh from `git log` on `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
3. Check each item §3.2 names: the `runs.using` runtime of every Action pin in `.github/workflows/`; whether the installed Playwright supports the Ubuntu images `browser-tests` runs on; the exit condition of every accepted advisory in §3.1 (look for a release past the version stated); every floor-only override in `pnpm-workspace.yaml` that has no upper cap; and the Ubuntu 26.04 pin decision, if its date window has passed.
4. For any advisory with no patched release, first look for a way to take the package out of the tree (`pnpm why <package>`) before proposing to accept it.
5. Reply with a plan, in the order you would do it:
   - security fixes first, then patch, minor and major updates, grouped so a failure points at one cause;
   - for each: the package, from and to, what depends on it, the risk, and anything Storybook-chrome or Playwright-related that `guidelines/07-storybook-and-documentation-standards.md` §9 says to re-verify by hand;
   - anything you recommend skipping or deferring, and why.

After I approve, apply it in small commits and run the full pipeline after each with `/verify` (audit, lint, build, the bundle and token-coverage checks, `check-guidelines`, the Storybook build and its size check, `pnpm test`, `test:storybook` and `test:visual`, one after another). Never push without showing me exactly what is being pushed and getting an explicit go-ahead.
