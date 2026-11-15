# Security policy

## Reporting a vulnerability

Please report a vulnerability **privately**, not in a public issue or pull request.

Use GitHub's private reporting: open the repository's **Security** tab and choose **Report a vulnerability**, or go straight to <https://github.com/designsbymason/dbm-system/security/advisories/new>. Only the maintainer can see the report.

Include what is affected (a component, a package, the Storybook or the docs site), the version, the steps to reproduce it, and what an attacker could do with it.

This is a solo-maintained project, so there is no response-time guarantee. A report is acknowledged as soon as the maintainer sees it. A confirmed vulnerability is fixed in a new release and disclosed through a GitHub security advisory, crediting the reporter unless they prefer not to be named. Please give a reasonable time to fix it before you disclose it publicly.

## Supported versions

The `@dbm-system/*` packages are published to npm, and the four public packages (`components`, `tokens`, `icons` and `utils`) share one version.

| Version | Supported |
|---|---|
| Latest `0.x` release | Yes |
| Anything older | No: upgrade to the latest release |

Only the latest release receives fixes until 1.0.

## Scope

In scope: the `@dbm-system/*` packages, the Storybook and the docs website. Out of scope: vulnerabilities in a dependency that have no effect on this project (report those upstream), and issues that need a compromised machine or browser.

Known, accepted advisories in dev-time dependencies are listed in [`guidelines/02-tech-stack-and-structure.md`](./guidelines/02-tech-stack-and-structure.md) §3.1.

## How releases are protected

Packages are published from CI with npm trusted publishing and a provenance attestation that links each version to the commit and workflow run that built it. No long-lived npm token is stored anywhere.
