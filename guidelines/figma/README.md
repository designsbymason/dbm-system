# Figma library — internal reference

The plan, decisions and status for the DBM System Figma component library (Phase 11, `../01-vision-and-goals.md` §13). These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** the plan in [01-plan.md](./01-plan.md) is approved. Phases 0 to 3 are built: the groundwork, the 416 variables, the styles and the Foundations page, and the cover, Getting started page, Icons page and Spec frame master. The pilot (Phase 4) is done: Button, Input, Badge and Card are drawn and reviewed, each with a component set, a spec frame, a description and a Storybook link, and the pilot review gate was held 2026-11-22. The file was published to the team library once as a working publish (not a tracked version) so Code Connect could be tried; each drawn component is mapped there by path and name ([ADR-0243](../adr/0243-code-connect-mappings-are-entered-in-figmas-own-screen-as-a-path-and-a-name-and-the-prop-mapping-stays-in-the-map-over-generating-and-sending-them-from-the-map.md)). Phase 5 (atoms) is under way, and [components/README.md](./components/README.md) holds the current list. Drawing and reviewing found gaps in the code, now fixed with changesets that are not yet released: Radio's 24 px hit area, CloseButton's `tone` (`neutral`, `brand` and `white`), and the label contrast of a hovered Tag, which took three new semantic text tokens ([ADR-0245](../adr/0245-a-tags-hover-label-takes-three-semantic-hover-text-tokens-over-darkening-the-status-text-tokens-or-changing-the-hover-treatment.md)).

**Private data never goes in this folder.** The Figma file's key, URL and node IDs live in `.local/figma.json`, which is gitignored (`01-plan.md` §3). Refer to "the Figma file", never its address.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the decisions taken, the structure of the Figma file, the build rules, the phases with their review gates, risks and open questions |
| [02-component-rules.md](./02-component-rules.md) | The standing rules for which components are drawn, which props become Figma properties, what is drawn (the coverage rule) and the spec frame |
| [03-agent-guide.md](./03-agent-guide.md) | How an agent designs with the library and how another builds from the design, so they do not drift apart |
| [04-naming-and-structure.md](./04-naming-and-structure.md) | How pages, sets, properties, layers, variables and styles are named |
| [05-deviations.md](./05-deviations.md) | The patterns where a Figma property or value is not the code's, and why |
| [06-maintenance.md](./06-maintenance.md) | What keeps the library and the code in step, and what to do when a component's props change |
| [component-map.json](./component-map.json) | The machine-readable map from each drawn component's Figma properties to the code, checked by `pnpm check-figma-map` ([ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md)) |
| [07-community-and-code-connect.md](./07-community-and-code-connect.md) | What is decided, recommended and verified about publishing the library as a Community file and about Code Connect (what the Code Connect test showed on our plan), and what is not yet known |
| [components/](./components/README.md) | One file per drawn component: its decisions, differences from the code, what is not drawn and its reviews, with the generated status table |

## Using the commands on your own file

The repository is MIT licensed, so the Figma commands in `.claude/commands/` (`/plan-figma-component`, `/build-figma-component`, `/review-figma-component`, `/figma-sync`, `/figma-drift`, `/figma-status`, `/figma-publish`) work on any Figma file you own, not only the maintainer's. The maintainer's file is not in the repository and nothing here can reach it; each clone points the commands at its own file:

1. Create a Figma file on a Professional plan or higher (ADR-0234) and connect the Figma MCP server to your Claude Code session; its own sign-in is the only credential, and no token is ever stored in the repository.
2. Create `.local/figma.json` (gitignored; the shape is in `01-plan.md` §3) with your file's key and URL, and add the key to `.local/blocked-strings.txt` so the pre-commit guard catches it.
3. Run `/figma-status`, then `/figma-sync` to write the tokens and styles into your file. Each command shows the file's name and asks you to confirm it before the first write.

Which components are drawn is read from the file itself (a spec frame instance named `Spec: <Name>` on a category page), so nothing in the repository records it and nothing needs updating as you build.
