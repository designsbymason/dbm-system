# 0172 — Pull requests are enabled for collaborators only and Issues are on, over keeping both off or opening contributions to everyone

**Status:** Accepted · **Date:** 2026-11-03

## Context
Pull requests were disabled on the repository ([ADR-0022](./0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md)): a sole maintainer, no outside contributors, and Dependabot version-update branches nobody merged. That left two gaps. The standard Changesets release action works by opening a "Version Packages" pull request (an open decision in `01-vision-and-goals.md` §13), and there was no public place to report a bug or a documentation mistake, which the docs website needs.

## Decision
- **Pull requests are enabled, and creation is limited to collaborators.** Nothing changes for the public; the collaborators list stays as it is. Workflows that run on pull requests from forks stay locked down, with no secrets available to them.
- **Issues are enabled**, with templates for a bug, a feature and a documentation problem. Discussions stay off.
- **Dependabot version updates stay off.** ADR-0022's decision, a manual refresh pass, is unchanged; only its context (no pull requests) changes.
- The repository carries `SECURITY.md` (private vulnerability reporting), `CONTRIBUTING.md` (pull requests are by invitation for now) and `CODE_OF_CONDUCT.md`.
- The Changesets "Version Packages" pull-request flow becomes available to Phase 8. Wiring it is still a Phase 8 task.

## Alternatives considered
- **Keep pull requests off.** Nothing to change, and releases would run through a manual workflow or locally. Rejected: it keeps the project without a review checkpoint on GitHub and makes the standard release flow unavailable.
- **Enable pull requests for everyone.** Rejected for now: it needs a contribution policy, review capacity and fork-workflow hardening that a sole-maintainer project does not have. It can be opened later by a new ADR.
- **Enable Discussions instead of Issues.** Rejected: no bug tracker, and the package metadata's `bugs` field needs one.

## Consequences
- The repository settings that implement this (pull-request creation limited to collaborators, Issues on, private vulnerability reporting) are changed on GitHub by the maintainer; they are not in the repository. Their state is tracked in `guidelines/docs-site/05-open-items.md`.
- `CLAUDE.md`'s note that pull requests are disabled, and `01` and `02`'s mentions of it, change to match.
- `gh pr` workflows exist once pull requests are on, but Dependabot still sends none.
- The `bugs` field in the package metadata can point at the Issues page.

## Related
[ADR-0022](./0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md) (its decision stands). `01-vision-and-goals.md` §10 and §13 (Phase 8). `CLAUDE.md` Security practices. `02-tech-stack-and-structure.md` §3.2.
