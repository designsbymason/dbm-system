# Figma library — internal reference

The plan, decisions and status for the DBM System Figma component library (Phase 11, `../01-vision-and-goals.md` §13). These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** the plan in [01-plan.md](./01-plan.md) is approved. Phases 0 to 3 are built: the groundwork, the 413 variables, the styles and the Foundations page, and the cover, Getting started page, Icons page and Spec frame master. Phase 3 awaits the maintainer's review; the pilot components (Phase 4) are next. No package has changed.

**Private data never goes in this folder.** The Figma file's key, URL and node IDs live in `.local/figma.json`, which is gitignored (`01-plan.md` §3). Refer to "the Figma file", never its address.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the decisions taken, the structure of the Figma file, the build rules, the phases with their review gates, risks and open questions |
| [02-component-rules.md](./02-component-rules.md) | The standing rules for which components are drawn, which props become Figma properties, the full matrix and the spec frame |

## Using the commands on your own file

The repository is MIT licensed, so the Figma commands in `.claude/commands/` (`/plan-figma-component`, `/build-figma-component`, `/review-figma-component`, `/figma-sync`, `/figma-drift`, `/figma-status`, `/figma-publish`) work on any Figma file you own, not only the maintainer's. The maintainer's file is not in the repository and nothing here can reach it; each clone points the commands at its own file:

1. Create a Figma file on a Professional plan or higher (ADR-0234) and connect the Figma MCP server to your Claude Code session; its own sign-in is the only credential, and no token is ever stored in the repository.
2. Create `.local/figma.json` (gitignored; the shape is in `01-plan.md` §3) with your file's key and URL, and add the key to `.local/blocked-strings.txt` so the pre-commit guard catches it.
3. Run `/figma-status`, then `/figma-sync` to write the tokens and styles into your file. Each command shows the file's name and asks you to confirm it before the first write.

Which components are drawn is read from the file itself (a spec frame instance named `Spec: <Name>` on a category page), so nothing in the repository records it and nothing needs updating as you build.
