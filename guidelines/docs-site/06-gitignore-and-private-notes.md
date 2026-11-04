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
| `.claude/settings.local.json` | One person's Claude Code permission settings. The shared `.claude/commands/` and `launch.json` stay tracked. It was ignored only by a personal global gitignore, so it is listed here for every clone |

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

## 4. The pre-commit guard

`.githooks/pre-commit` is a plain shell script (no dependency) that refuses a commit when it finds any of these:

| Check | Blocks |
|---|---|
| Paths | A staged file under `.local/`, an `.env` file (not `.env.example`), a `.pem`, `.key`, `.p12`, `.keystore`, `.npmrc`, `id_rsa` file, or `.claude/settings.local.json` |
| Credential-shaped text | An added line that looks like a GitHub, npm, AWS, Slack, OpenAI-style or Google key, a private key header, an npm auth-token setting or a long bearer token |
| Your blocked strings | An added line containing any string from `.local/blocked-strings.txt`, a private, gitignored list of things that must never be committed (a personal email address, a hostname). The list is never committed, so the strings are not in the repository |
| Author email | A commit whose author email is not a GitHub no-reply address, so a personal or machine address never lands in history |

**Turn it on once per clone:** `git config core.hooksPath .githooks`. A new clone does not have it until you run that.

**Limits:** `git commit --no-verify` skips it, and CI does not run it. GitHub secret scanning and push protection (both on) are the backstop for recognised tokens. A string that is not on your list and does not look like a credential gets through, so the checklist below still matters.

## 5. Before every commit

1. `git status` shows no `.local/` path and no `.env` file.
2. No new file contains a token, a key, a login, an account number, a private email address or a name that is not already public.
3. A generated file (the manifest copy, the `llms` files, the search index, the build output) is not staged.
4. If a task would put something sensitive into `guidelines/`, stop and ask; the answer is usually the private notes.
