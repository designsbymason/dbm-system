# Publishing the library as a Community file, and Code Connect

What we have decided, what is recommended and what is not yet verified about publishing the Figma library and about Figma's Code Connect. Each point says which it is. The decided ones are in [ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md) and [ADR-0241](../adr/0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md); the rest waits for the checks below.

## The Community file

| Point | Status |
|---|---|
| No one can edit the original. Only the owner and people given edit access in the file's sharing settings can; everyone else can view the listing and duplicate it | Known Figma behaviour; confirm in the publish dialog |
| Nothing in the repository grants access: the file key is gitignored, and a key alone gives no rights without edit access. Our commands write to a file only under the person's own sign-in | Decided |
| A duplicate is the user's own copy: editable by them, never updated from ours, with no link back | Known Figma behaviour |
| The listing is a published snapshot, separate from the working file. We keep a **private working file** and publish snapshots from it, so the working file is never addressable from a public repository ([01-plan.md](./01-plan.md) §3) | Recommended |
| Each publish is tied to an npm version: the cover's version stamp and the Changelog page name the matching `@dbm-system` version ([01-plan.md](./01-plan.md) §7) | Decided |
| **Library mode:** if Community libraries are available for our file, users could use the components, styles and variables in place, read-only, updating when we publish. It is the closest match to "use it but not edit it" | Recommended, unverified |
| The licence the listing carries, chosen in the publish dialog. The code is MIT; the file's should match the intent and be stated on the cover and in the README | Open, decide at Phase 8 |

## Code Connect

Code Connect links a Figma component to a code component with a prop mapping, so Dev Mode and the tools that read a design show `<Badge dot tone="danger" />`. It overlaps what [component-map.json](./component-map.json) does for an agent, and the map already holds the data it needs.

- **How it is used here (decided, ADR-0241):** mappings are generated from the map when they are sent, by a public `/figma-connect` command that looks node ids up at run time and sends them with the user's own sign-in. No `*.figma.tsx` file is committed, no token is stored, no dependency is added. A fork or a copy of the library file can run it on its own file.
- **Nothing secret travels.** A mapping holds the component name, the import path (`@dbm-system/components`) and the prop mapping, all public. What stays private is the access token and the working file's key.
- **What reaches people who install the packages:** nothing today, because the mappings live in the Figma file, not in the package. **Recommended:** ship the name-based map with `@dbm-system/components` and serve it from the MCP server, so an agent working from a copy of our library translates its designs correctly with no Figma plan needed. It changes a published package, so it needs its own ADR and a changeset; it is a row in [open-items.md](../open-items.md).
- **Layering (recommended):** the map shipped with the package works for everyone; Code Connect is an optional layer for those whose plan allows it.

## Not yet verified

1. Whether Code Connect works on the plan the file is on. It is often a higher-tier feature.
2. Whether a mapping carries over to a duplicate of the file (expected not, because it is tied to the original's components).
3. Whether a mapping follows a component used as a library in another file (expected yes, if the library keeps the original components).
4. Whether our file can be published as a Community library, and the current publishing rules for a file with variables.

### Test plan, with one account

Both questions that matter can be answered without a second account, using throwaway files. Each write to Figma is confirmed with the maintainer first, and the throwaway files' keys go in the gitignored `.local/figma.json`.

1. **Plan and mapping.** Add a mapping to Button in the original with `add_code_connect_map`. An error names the plan limit if there is one.
2. **Duplicate.** Duplicate the file after the mapping exists, and open Dev Mode on its Button. A missing snippet means mappings do not carry over.
3. **Library use.** In a copy, publish the components as a team library, add a mapping to its Button, enable the library in a new empty file, place a Button instance and open Dev Mode. A snippet means a library user gets the mapping.
4. **What a second account would add:** the view of the Community listing as a stranger sees it. A free account would do. Figma's documentation answers the rest before anything is published.

## Order of work

1. Draw Card, the last pilot component, then hold the pilot review gate.
2. Run the Button Code Connect test (above).
3. Write `/figma-connect`, if the test works.
4. Decide and write the ADR for shipping the map with the package.
5. The Phase 8 publication decisions: private working file with snapshots, library mode, the licence.

## Related

[01-plan.md](./01-plan.md) §3, §7 and §8, [03-agent-guide.md](./03-agent-guide.md), [06-maintenance.md](./06-maintenance.md), [ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md) and [ADR-0241](../adr/0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md).
