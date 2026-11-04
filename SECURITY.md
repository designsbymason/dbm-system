# Security policy

## Reporting a vulnerability

Please report a vulnerability **privately**, not in a public issue or pull request.

Use GitHub's private reporting: open the repository's **Security** tab and choose **Report a vulnerability**, or go straight to <https://github.com/designsbymason/dbm-system/security/advisories/new>. Only the maintainer can see the report.

Include what is affected (a component, a package, the Storybook or the docs site), the steps to reproduce it, and what an attacker could do with it.

This is a solo-maintained project, so there is no response-time guarantee. A report is acknowledged as soon as the maintainer sees it, and a confirmed vulnerability is fixed and disclosed through a GitHub security advisory.

## Supported versions

Nothing is published to npm yet. Once it is, only the latest release receives fixes until 1.0.

## Scope

In scope: the `@dbm-system/*` packages, the Storybook and the docs website. Out of scope: vulnerabilities in a dependency that have no effect on this project (report those upstream), and issues that need a compromised machine or browser.

Known, accepted advisories in dev-time dependencies are listed in `guidelines/02-tech-stack-and-structure.md` §3.1.
