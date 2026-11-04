# 0176 — Releases use the Changesets "Version Packages" pull request with npm provenance, over a manual or fully automatic publish

**Status:** Accepted · **Date:** 2026-11-04

## Context
Pull requests are enabled for collaborators only ([ADR-0172](./0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)), which makes the standard Changesets release flow available. Changesets is configured but no workflow runs it. `CLAUDE.md` already requires npm provenance through trusted publishing (OIDC, no stored token).

## Decision
The Changesets action opens a "Version Packages" pull request after changes land on `main`; merging it versions the packages and publishes them with npm provenance, using OIDC trusted publishing and no long-lived token. The maintainer's merge is the release checkpoint. The workflow's Actions must declare a supported Node runtime (`02-tech-stack-and-structure.md` §3.2).

## Alternatives considered
- **A manual publish workflow.** No review checkpoint on the changelog and versions. Rejected.
- **Fully automatic publish on push.** Nothing stands between a push and npm. Rejected.

## Consequences
- Every release has a reviewable changelog and version diff in a pull request.
- The release workflow is a Phase 8 task, with the 2FA and trusted-publisher setup on the npm account.

## Related
`01-vision-and-goals.md` §13 (Phase 8). `CLAUDE.md` (Publish security).
