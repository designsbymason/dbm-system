# Publishing the library as a Community file, and Code Connect

What we have decided, what is recommended and what is not yet verified about publishing the Figma library and about Figma's Code Connect. Each point says which it is. The decided ones are in [ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md) and [ADR-0243](../adr/0243-code-connect-mappings-are-entered-in-figmas-own-screen-as-a-path-and-a-name-and-the-prop-mapping-stays-in-the-map-over-generating-and-sending-them-from-the-map.md) and [ADR-0244](../adr/0244-the-figma-map-ships-in-the-components-package-and-the-mcp-server-serves-it-over-leaving-it-in-the-repository-or-adding-it-to-the-manifest.md) (ADR-0241 is superseded); what is verified is below.

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

- **How it is used here (decided, ADR-0243):** mappings are entered by hand in Figma's Code Connect screen, one per drawn component, as the path of its source file and its name; nothing is sent through MCP, no `*.figma.tsx` file is committed and no token is stored. The prop mapping stays in the map.
- **Nothing secret travels.** A mapping holds the component name, the import path (`@dbm-system/components`) and the prop mapping, all public. What stays private is the access token and the working file's key.
- **What reaches people who install the packages:** nothing today, because the mappings live in the Figma file, not in the package. **Recommended:** ship the name-based map with `@dbm-system/components` and serve it from the MCP server, so an agent working from a copy of our library translates its designs correctly with no Figma plan needed. It changes a published package, so it needs its own ADR and a changeset; it is a row in [open-items.md](../open-items.md).
- **Layering (recommended):** the map shipped with the package works for everyone; Code Connect is an optional layer for those whose plan allows it.

## Verified: what the plan allows

**Professional plans support Code Connect, limited to one active library and one active framework** (Figma's documentation and pricing page, checked 2026-11-22). A mapping is made in Figma's Code Connect UI in Dev Mode or with the Code Connect CLI, needs a Full or Dev seat, and the active library and framework are set by a team admin.

**Creating one with the MCP tool is refused on this plan** (2026-11-22). `add_code_connect_map` on Button answered that code connections can only be made in libraries on an Organization or Enterprise plan, and nothing was written. A Figma staff reply in the community forum says the same of MCP on Professional; it is not in the official documentation. So a command that sends mappings through MCP (`/figma-connect` as ADR-0241 describes it) does not work on this plan, and the route here is the UI or the CLI.

**Code Connect needs the components published to a team library first, not to Community** (what the Code Connect panel in Dev Mode says, 2026-11-22; [Figma: Publish a library](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library)). A team publish is visible to the team only; the Community publish stays a Phase 8 decision. The file was published to the team library on 2026-11-22 (a working publish, not a tracked version; the Spec frame master is named `.Spec frame`, which keeps it out of a publish), and the same MCP call was refused again. So the MCP refusal is the plan, not the missing library, and the route on this plan is the Code Connect UI in Dev Mode.

**The Code Connect UI works on this plan and the MCP server reads what it saves** (tested on Button, 2026-11-22). In Dev Mode, the file name's dropdown, Library, Connect components to code: a component takes a file path (here `packages/components/src/atoms/Button/Button.tsx`, no GitHub connection) and an optional name and framework. The path is then returned by `get_code_connect_map` for each of Button's 200 variants. What the UI saves is a path and a name, plus free-text instructions for MCP: no mapping of Figma properties to code props and no code snippet in Inspect. So it tells an agent which file a component is, and the prop mapping stays in `component-map.json`. The name is a separate field (found later on the same screen); once entered, the read returns it (Button on all 200 variants, Input on all 36) and an agent gets `import Button from "packages/components/src/atoms/Button/Button.tsx"`: the right name and file, but written as a default import, where the code has a named export, so an agent has to resolve it from the file. The screen's MCP preview did not generate for Button (200 variants) or Input (36), so it is not the size, and the instructions for MCP could not be saved on either; they are not needed, since the description and the Storybook link already reach an agent. Selecting the whole set in Dev Mode warns that the selection is too large for code and that agents will make several calls (the set holds 200 variants); a single variant or an instance does not.

## Verified: library use

**A mapping reaches a file that uses the library** (2026-11-22). In a new empty file with the DBM System team library enabled, a placed Button shows its mapping in Dev Mode. So a Code Connect mapping made in the working file follows the components to anyone who uses the library, within the team. Whether it reaches a Community copy or a stranger's duplicate is not tested: a duplicate is a separate file with its own components, and the Community listing is a Phase 8 decision.

## Not yet verified

1. Whether a mapping carries over to a duplicate of the file (expected not, because it is tied to the original's components).
2. Whether the mapping is visible to people outside the team who use the library, and on the Community listing; checked at Phase 8 against Figma's documentation, with the publishing rules for a file with variables.

### Test plan, with one account (run 2026-11-22)

1. **Plan and mapping.** Refused through the MCP tool; saved in the Code Connect UI (above).
2. **Duplicate.** Not run: a duplicate is not how the library is used.
3. **Library use.** Passed (above).

## Order of work

1. Done: Card is drawn and the pilot review gate is held (2026-11-22).
2. Done: the file is published to the team library, the MCP route is refused, the Code Connect UI saves mappings that MCP reads, and a file that uses the library shows them (above). All four drawn components (Button, Input, Badge, Card) are mapped by path and name (2026-11-22); a new component is mapped the same way when it is drawn.
3. Done: ADR-0243 supersedes ADR-0241 (no `/figma-connect`; mappings are entered by hand), and ADR-0244 decides that the map ships in the components package and the MCP server serves it.
4. Build what ADR-0244 decides: copy the map into the package at build, export it, add the MCP tool, with docs, tests and a changeset.
5. Phase 5, the atoms.
6. The Phase 8 publication decisions: private working file with snapshots, library mode, the licence.

## Related

[01-plan.md](./01-plan.md) §3, §7 and §8, [03-agent-guide.md](./03-agent-guide.md), [06-maintenance.md](./06-maintenance.md), [ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md) and [ADR-0241](../adr/0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md).
