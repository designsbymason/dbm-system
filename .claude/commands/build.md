---
description: Build the local site-preview (the packages, Storybook and the home page assembled in apps/docs/_artifact) and start its server if it is not running; "site-preview" rebuilds only the home page, "storybook" only Storybook
argument-hint: (optional: "site-preview" for the home page only, reusing the last Storybook build; "storybook" for Storybook alone)
---

Build the local preview. Option, if any: $ARGUMENTS

This writes only ignored build output (`packages/*/dist`, `apps/docs/dist`, `packages/components/storybook-static`, `apps/docs/_artifact`): change no tracked file, commit nothing and push nothing. Run the steps one after another, from the repo root. Take the option as exactly one of: none, `site-preview` or `storybook`; for anything else, say so and stop.

**No option: everything.**

1. `pnpm build` (the four packages; turbo-cached, so a few seconds when nothing changed). The home page imports the packages' built `dist/`, so skipping this can show stale components.
2. `pnpm --filter @dbm-system/docs assemble-local`. It builds Storybook and the home page, deletes and rebuilds `apps/docs/_artifact/` from them, writes `robots.txt`, `sitemap.xml` and the agent files, and runs `check-agent-files` and `check-css` (`apps/docs/README.md`). It takes about 40 seconds.
3. Make the preview reachable (below).

**`site-preview`: the home page only.** Use it after a change to `apps/docs/src`, the packages or the tokens; after a change to Storybook (a story, a docs page, a component's documentation) use no option, because this keeps the Storybook that was last built.

1. `pnpm build`, as above.
2. `pnpm --filter @dbm-system/docs assemble-local --skip-storybook`. The same assembly and checks, with the Storybook already in `packages/components/storybook-static` (it builds Storybook when there is none, and says so). About 10 seconds when Storybook is reused.
3. Make the preview reachable (below).

**`storybook`: Storybook alone**, which does not touch `_artifact/`, so the preview does not show it yet.

1. `pnpm --filter @dbm-system/components build-storybook`
2. `pnpm --filter @dbm-system/components check-storybook-bundle-size`; report the total and the largest chunk against their budgets (the total has had little headroom).
3. Say that the preview shows it after `/build site-preview` (which assembles this Storybook build) or `/build`.

**Making the preview reachable** (not for `storybook`): the `site-preview` server serves `apps/docs/_artifact` on port 4322 and reads files per request, so a running server needs no restart, only a reload. List the preview servers (`preview_list`). If any running server is on port 4322, whatever its name (an old one may still be named `site-artifact`), say it is running and a reload shows the new build. If none is, start it with `preview_start` and `{name: "site-preview"}`. Never stop or restart a server that is running.

A failure stops the run. Report the step, its output and what it means; do not summarise it away, retry with other flags or work around it.

Reply with a short table of step and result with the time it took; whether Storybook was reused or built; the Storybook size against its budget when it was built; and the preview's address (`http://localhost:4322/`, Storybook at `/storybook/`). Then wait for my instruction.
