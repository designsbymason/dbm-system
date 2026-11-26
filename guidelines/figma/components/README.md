# Figma components: decisions per component

One living file per component drawn in the Figma library, like [`../../component-reviews/`](../../component-reviews/README.md) is for the code. It holds what is not obvious from the Figma file or the code: the decisions taken while drawing the component and why, where Figma differs from the code, what is not drawn, and the review findings. It is a **current-state reference, not a changelog**: when a decision changes, edit it here and say so in the commit message. A real fork in the road also gets an ADR in [`../../adr/`](../../adr/README.md).

The map from each Figma property to the code is not here. It is [`../component-map.json`](../component-map.json), a machine-readable file that `pnpm check-figma-map` checks against the built manifest, so an agent reads one place for it ([ADR-0240](../../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md)).

## Status

Generated from the map by `pnpm check-figma-map --write`; CI fails when it is stale. A component is **drawn** when its set and spec frame are in the file, **reviewed** after a `/review-figma-component` pass with the findings applied, and **approved** only when the maintainer says so.

<!-- figma-status:start -->
| Component | Tier | Category | Variants | State | Reviewed | Approved |
|---|---|---|---|---|---|---|
| [Avatar](./Avatar.md) | atom | Data Display | 48 | approved | 2026-11-26 | 2026-11-26 |
| [Badge](./Badge.md) | atom | Data Display | 105 | approved | 2026-11-22 | 2026-11-23 |
| [Button](./Button.md) | atom | Inputs | 200 | approved | 2026-11-22 | 2026-11-23 |
| [Checkbox](./Checkbox.md) | atom | Inputs | 54 | approved | 2026-11-23 | 2026-11-23 |
| [CloseButton](./CloseButton.md) | atom | Inputs | 24 | approved | 2026-11-23 | 2026-11-23 |
| [Divider](./Divider.md) | atom | Layout | 48 | approved | 2026-11-26 | 2026-11-26 |
| [FieldError](./FieldError.md) | atom | Inputs | 2 | approved | 2026-11-25 | 2026-11-25 |
| [FieldHelperText](./FieldHelperText.md) | atom | Inputs | 2 | approved | 2026-11-25 | 2026-11-25 |
| [FieldLabel](./FieldLabel.md) | atom | Inputs | 6 | approved | 2026-11-25 | 2026-11-25 |
| [Icon](./Icon.md) | atom | Media | 2958 | approved | 2026-11-26 | 2026-11-26 |
| [IconButton](./IconButton.md) | atom | Inputs | 210 | approved | 2026-11-23 | 2026-11-23 |
| [Image](./Image.md) | atom | Media | 12 | approved | 2026-11-26 | 2026-11-26 |
| [Indicators](./Indicators.md) | atom | Media | 54 | approved | 2026-11-26 | 2026-11-26 |
| [Input](./Input.md) | atom | Inputs | 36 | approved | 2026-11-22 | 2026-11-23 |
| [Link](./Link.md) | atom | Typography | 16 | approved | 2026-11-26 | 2026-11-26 |
| [ProgressBar](./ProgressBar.md) | atom | Feedback | 12 | approved | 2026-11-26 | 2026-11-26 |
| [ProgressCircle](./ProgressCircle.md) | atom | Feedback | 12 | approved | 2026-11-26 | 2026-11-26 |
| [Radio](./Radio.md) | atom | Inputs | 36 | approved | 2026-11-23 | 2026-11-23 |
| [Skeleton](./Skeleton.md) | atom | Data Display | 3 | approved | 2026-11-26 | 2026-11-26 |
| [Spinner](./Spinner.md) | atom | Feedback | 64 | approved | 2026-11-23 | 2026-11-23 |
| [Switch](./Switch.md) | atom | Inputs | 42 | approved | 2026-11-23 | 2026-11-23 |
| [Tag](./Tag.md) | atom | Data Display | 315 | approved | 2026-11-25 | 2026-11-25 |
| [Textarea](./Textarea.md) | atom | Inputs | 36 | approved | 2026-11-23 | 2026-11-23 |
| [Tooltip](./Tooltip.md) | atom | Overlay | 12 | approved | 2026-11-26 | 2026-11-26 |
| [Card](./Card.md) | molecule | Data Display | 72 | approved | 2026-11-22 | 2026-11-23 |
<!-- figma-status:end -->

## What a component's file holds

Copy this outline for a new component, and keep each part short:

- **What is drawn:** the set's properties and the size of the matrix, in a sentence or two (the table is in the map).
- **Decisions:** each choice that is not the plain reading of the rules, with the reason.
- **Differences from the code:** the same as `deviations` in the map, with the reason for each.
- **Not drawn:** states, props and variants left out, and why.
- **Review:** the date of each review and what it changed, newest first, and any finding still open.
