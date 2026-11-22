# Contributing

Thank you for your interest in DBM System. It is a solo-maintained project. The repository is public and the published packages are MIT licensed, so you are welcome to use, fork and modify the code under the terms of that license.

## Issues

Issues are open. Use the templates for a bug, a feature request or a documentation problem. A good report names the component, says what you expected and what happened, and links to the Storybook story where it shows. There is no response or fix timeline.

Report a security vulnerability privately instead; see [SECURITY.md](./SECURITY.md).

## Pull requests

Pull requests are limited to collaborators, by invitation, for now. If you would like to change something, open an issue first so it can be discussed; forking under the MIT license is always open to you. Opening pull requests to everyone may come later, with a contribution policy.

## Conduct

Everyone taking part follows the [code of conduct](./CODE_OF_CONDUCT.md).

## Working on the code

This applies to collaborators, and to anyone working in a fork.

1. Use Node 24 or newer and pnpm 11 (the exact versions are in `.nvmrc` and the `packageManager` field), then run `pnpm install`.
2. Turn on the pre-commit guard and the pre-push changeset check once per clone with `git config core.hooksPath .githooks`.
3. Read `CLAUDE.md` and the numbered documents in `guidelines/` before a structural change: the decisions already made are recorded there.
4. Before you finish, run the checks CI runs: `pnpm lint`, `pnpm build` and `pnpm test`, plus `pnpm --filter @dbm-system/components test:storybook` for the real-browser stories.
5. Write commit messages in Conventional Commits form (`feat(button): add a loading state`).
6. A change that affects what a consumer of a published package sees includes a changeset (`pnpm changeset`, or `pnpm changeset --empty` when nothing needs releasing); `pnpm check-changeset`, the pre-push hook and CI fail a push without one. How a release is made is in [`RELEASING.md`](./RELEASING.md).

## License

By contributing you agree that your contribution is licensed under the [MIT license](./LICENSE) that covers the project.
