# 0243 — Code Connect mappings are entered in Figma's own screen as a path and a name, and the prop mapping stays in the map, over generating and sending them from the map

**Status:** Accepted · **Date:** 2026-11-22 · Supersedes [0241](./0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md)

## Context
[ADR-0241](./0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md) decided that Code Connect mappings would be generated from `guidelines/figma/component-map.json` and sent through Figma's MCP tools by a `/figma-connect` command, under the signed-in person's own account, so that no `*.figma.tsx` file, token or Figma address entered the public repository. It was decided before Code Connect was tried on the file's plan. The test on 2026-11-22 (`guidelines/figma/07-community-and-code-connect.md`) found:

- The file is on the Professional plan, which allows Code Connect with one active library and one active framework.
- Creating a mapping through the MCP tool is refused on that plan, before and after the components were published to the team library.
- The Code Connect screen in Dev Mode (the file name's dropdown, Library, Connect components to code) works once the components are published to a team library. It takes a file path and a component name, with the framework set for the team, and the MCP server reads what it saves. It takes no mapping from Figma properties to code props and shows no snippet in Inspect.
- A file that uses the library shows the mappings in Dev Mode.

## Decision
- **Mappings are made by hand in that screen, one per drawn component, with the path of its source file and its name** (`packages/components/src/atoms/Button/Button.tsx` and `Button`). The path is in the public repository and the name is the component's. GitHub is not connected to Figma, so Figma gets no access to the repository.
- **Nothing is sent through MCP and no `/figma-connect` command is written.** No `*.figma.tsx` file is committed, no token is created or stored, and no dependency is added. Nothing in the repository holds the file's key, address or node ids.
- **The prop mapping stays in `component-map.json`,** the source it already was ([ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md)), because Code Connect's screen cannot hold it. An agent that needs to turn a Figma `variant`, `size` or boolean into a code prop reads the map, shipped with the package ([ADR-0244](./0244-the-figma-map-ships-in-the-components-package-and-the-mcp-server-serves-it-over-leaving-it-in-the-repository-or-adding-it-to-the-manifest.md)).
- **A component is mapped when it is drawn,** as one step of its build, and the set is published to the team library for the mapping to show.
- Whether the screen's optional instructions for the MCP server can be saved is not decided: its preview did not generate for Button or Input, so none are set.

## Alternatives considered
- **Generating and sending mappings from the map (ADR-0241).** Rejected: the MCP route is refused on this plan, and the screen has nowhere to put what the map would generate.
- **The Code Connect command-line tool with `*.figma.tsx` files and a token.** Rejected as before: the files name the Figma file and nodes, and a token cannot be kept in the repository or its secrets.
- **Not using Code Connect.** Rejected for now: it costs one path and one name per component, and gives an agent reading a design the file it is looking at, the description and the Storybook link.

## Consequences
- Each new component adds a manual step in Figma, and a rename or move of a source file leaves its mapping stale until it is edited; nothing checks it yet.
- A mapping points into our repository, so it means little to someone who only installed the package: the shipped map is what serves them.
- It works for the team that holds the library. Whether it reaches a Community listing or a duplicate is not tested and is a Phase 8 question.

## Related
[ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md), [ADR-0241](./0241-code-connect-mappings-are-generated-from-the-map-and-sent-with-the-users-own-sign-in-over-committing-figma-files-in-the-repository-or-publishing-from-ci-with-a-token.md), [ADR-0244](./0244-the-figma-map-ships-in-the-components-package-and-the-mcp-server-serves-it-over-leaving-it-in-the-repository-or-adding-it-to-the-manifest.md), `guidelines/figma/07-community-and-code-connect.md`, `guidelines/figma/01-plan.md` §3 and §8.
