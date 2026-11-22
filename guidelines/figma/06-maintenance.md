# Keeping the Figma library and the code in step

Nothing in Figma updates itself when the code changes ([01-plan.md](./01-plan.md) §8). What keeps the two honest is a set of checks that run on a schedule, and one place that records the mapping.

| What | How | When |
|---|---|---|
| The map against the code | `pnpm check-figma-map`: every mapped prop and value exists in the built manifest, defaults agree, every prop is mapped or named as not modelled, the status table is current. Runs in CI on every push | Every push |
| The file against the code | `/figma-drift`: tokens and styles against `90-verify.js`, each drawn component's properties against the map and the manifest, every link in the file | Every release that changes a published package, and when a drawn component's code changes (`RELEASING.md`, item 7 of the sequence) |
| The tokens into Figma | `/figma-sync`, which regenerates the payloads and sends them in order, then verifies | When a token changes |
| Where the library stands | `/figma-status` | Start of a Figma session |
| A component, step by step | `/plan-figma-component`, `/build-figma-component`, `/review-figma-component` | Each new component |
| The first publish | `/figma-publish` | Once, when the first complete version is ready |

## When a code component's props change

1. Run `/figma-drift <Name>`. It names what no longer matches the map or the file.
2. Update the set in Figma, then the entry in [component-map.json](./component-map.json), its file in [components/](./components/README.md) and its spec frame, in the same sitting.
3. Run `pnpm check-figma-map --write`, which rewrites the status table, and `pnpm check-guidelines`.
4. A component that was approved and changes is back to reviewed: set `status.state` and `approved` in the map.

## A component's state

`drawn` (set and spec frame are in the file), `reviewed` (a `/review-figma-component` pass with its findings applied) and `approved`, which only the maintainer declares. Nobody else sets `approved`.
