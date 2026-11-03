# Docs website — gitignore and private notes

This repository is public and its history is permanent, so anything sensitive must never reach it. This file says what is **gitignored**, what belongs in the **private notes** folder instead of in `guidelines/`, and what to check before a commit.

## 1. What is gitignored

Already in `.gitignore` before the docs website:

| Pattern | Why |
|---|---|
| `node_modules/`, `.pnpm-store/` | Dependencies |
| `dist/`, `build/`, `.turbo/`, `coverage/`, `storybook-static/`, `*.tsbuildinfo` | Build output |
| `playwright-report/`, `blob-report/`, `test-results/` | Test run output (the committed `*-snapshots/` baselines are not ignored) |
| `.env`, `.env.*` (except `.env.example`) | Local environment values |
| `.DS_Store`, `.idea/`, `.vscode/*` (except the shared settings) | Editor and OS files |
| `*.log` | Logs |
| `*.pem`, `*.key`, `.npmrc` | Credentials and local config |

Added for the docs website:

| Pattern | Why |
|---|---|
| `apps/docs/dist/` | The built site |
| `apps/docs/.astro/` | Astro's generated types and cache |
| `apps/docs/public/pagefind/` | The search index, rebuilt on every deploy |
| `apps/docs/public/manifest.json`, `apps/docs/public/llms.txt`, `apps/docs/public/llms-full.txt` | Generated at build from the manifest and the content, so a committed copy would go stale |
| `.local/` | The private notes folder (below) |

`apps/docs/public/` also holds committed files (favicons, the logo, the web app manifest). Only the generated ones are ignored, by name.

## 2. What is committed and public

The plan and structure in this folder, the ADRs, the community files, the issue templates, `.env.example` (placeholder values only), and the site's own source. Public means any reader of the repository, forever.

## 3. The private notes folder: `.local/`

A gitignored folder at the repository root. It is for anything personal, private or sensitive that the project work produces. It is a convenience for one maintainer, not a vault.

**Passwords, tokens, recovery codes and API keys do not go in it.** A gitignored file is still plain text on disk, and it can be swept into a backup, a synced folder or a screenshot. Keep secrets in a password manager and write here only *where* a secret lives ("registrar login: password manager, vault Personal").

Suggested layout, by file. A file holds only what its name says:

| File | Holds |
|---|---|
| `.local/docs-site/where-things-live.md` | Which registrar, which DNS provider and which accounts own the domain, Pages and the npm organisation, each with a pointer to the password manager entry |
| `.local/docs-site/dates-and-costs.md` | The domain's renewal date, price and auto-renew state, and any paid service added later |
| `.local/docs-site/verification-values.md` | The Pages domain-verification value and any registrar or search-console token, until it has been used |
| `.local/docs-site/contacts.md` | The email addresses for support, security reports and the registrar, and any personal details tied to the domain registration |
| `.local/docs-site/service-ids.md` | Values for the names listed in `.env.example`, if a build ever needs one |
| `.local/docs-site/drafts/` | Launch and announcement copy, positioning notes, and a more candid roadmap than the public one |
| `.local/docs-site/feedback-and-people.md` | Who has seen the system, what they said, and any names (personal information about other people) |
| `.local/docs-site/legal.md` | Trademark and name questions, and anything for a lawyer |
| `.local/docs-site/recovery.md` | Where the two-factor recovery codes are kept (the location only), and who else has access |
| `.local/docs-site/scratch.md` | Half-formed ideas, rejected options and reminders |

The folder and a starter file exist locally; nothing in them is committed.

## 4. Before every commit

1. `git status` shows no `.local/` path and no `.env` file.
2. No new file contains a token, a key, a login, an account number, a private email address or a name that is not already public.
3. A generated file (the manifest copy, the `llms` files, the search index, the build output) is not staged.
4. If a task would put something sensitive into `guidelines/`, stop and ask; the answer is usually the private notes.
