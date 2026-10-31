# 0158 — `ColorPicker` keeps its recent colors in the picker, in the browser through `useRecentCommands`, or in the app, over a fixed storage or recording every drag step

**Status:** Accepted · **Date:** 2026-10-31

## Context
People reuse the colors they chose a moment ago, and a picker that forgets them sends every app to build a recent row beside it. Where the list lives is not the picker's to decide: an app may want it in memory, in the browser across visits (and then in which storage), or on a server for a signed-in person. `utils` already has `useRecentCommands`, which remembers a list under `dbm-recent:<key>` in `localStorage` or `sessionStorage`, empty on the server and the first client render, in step across tabs, with a memory fallback when storage is blocked.

## Decision
- **`showRecent` (off by default) draws a captioned row of the last colors at the end of the panel**, newest first, `maxRecent` of them (5). The row is a group of the swatch buttons, one tab stop with the swatch row's arrow keys, drawn only while it has colors; pressing one chooses it.
- **A color joins when it is settled**: a drag released, a key step, a swatch, the eyedropper, committed text or a channel field, the moments `onValueCommit` is called, and not on every step of a drag. A cleared value, a format switch (the color is the same) and text that is not a color add nothing. A repeat moves to the front, and a list past `maxRecent` drops the oldest.
- **Three homes for the list**, one of which is chosen by what the app passes:
  - **The app's**, by `recentColors` and `onRecentColorsChange` (controlled: the picker reports the new list and shows what it is given), for a list kept on a server.
  - **The browser's**, by `persistKey` and `storage` (`"local"` by default, or `"session"`), through `useRecentCommands` under `dbm-recent:color-picker:<key>`, so every picker with the same key shares it, in other tabs too, and it is empty until the browser has been asked, so a server render and its hydration match.
  - **The picker's own**, otherwise: it lasts as long as the picker is mounted.
- **A color is stored as hex** (`#rrggbb`, or `#rrggbbaa` when not opaque), whatever `format` is, and drawn in the current `format`, so changing the format never leaves a mix. Only colors are stored, never a name or typed text; whether storing even that needs consent is the app's to decide.
- **`controllerRef` gains `clearRecent()`**, which empties the list in whichever home it lives in and reports `[]`, so an app can offer "clear my recent colors" (and honour a privacy request).

## Alternatives considered
- **Always keep it in `sessionStorage`.** Rejected: it ties every app to one storage and one lifetime. Recent colors are usually wanted again tomorrow, and a shared machine wants none; the app decides, and `"session"` is one value of `storage`.
- **Controlled only.** Rejected: every app would write the same few lines to remember five strings; `persistKey` is that convenience.
- **Storage only.** Rejected: an app with a server-side profile has nowhere to put it.
- **Recording every step of a drag.** Rejected: it would fill a row of five with the colors between two points.
- **A new storage helper.** Rejected: `useRecentCommands` already has the hydration, tab-sync and blocked-storage handling and is the system's one way to remember a short list.

## Consequences
- `ColorPicker` calls `useRecentCommands` every render (with an empty key when `persistKey` is not set, which it then ignores), so each picker subscribes to storage events; the list is read only when a key is given.
- JS grows to 13.99KB, inside the 15KB budget.
- A picker given `recentColors`, `onRecentColorsChange` or `persistKey` without `showRecent` warns in development.

## Related
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md), [ADR-0157](./0157-colorpicker-adds-channel-number-fields-css-color-names-a-none-swatch-a-copy-button-a-controller-and-an-alt-arrowdown-shortcut-as-opt-ins-over-leaving-them-to-the-app.md); `useRecentCommands` in `utils`; `component-reviews/ColorPicker.md`.
