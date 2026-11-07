# AlertDialog — review findings

Second organism, built 2026-10-10 on the `06-engineering-standards.md` §9 checklist, with a second pass (three gaps) and a final review pass. **Finalized 2026-10-11**, with the items under "Open at Finalization" accepted as open: they need a device or a server render, and none changes the component.

## Decisions
- A sibling of `Dialog`, with no `role` on `Dialog`: [ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md).
- Drawn with `Dialog`'s sections and stylesheet, extraction deferred to the third consumer: [ADR-0056](../adr/0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md).
- Same structure as `Dialog` (Radix overlay, `Backdrop` for the scrim, the open state held for its fade): [ADR-0052](../adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md). `@radix-ui/react-alert-dialog` is pinned to `1.1.23`, the version that depends on the `react-dialog` we pin, so one copy of each layer package resolves; `1.1.24` would pull `react-dialog@1.2.0`.

## What was found while building it
- **`Button` computes `aria-disabled` itself, after the props it is given**, and for a native button only as the native `disabled` attribute, which would take the button out of the tab order. A busy alert's Cancel and Action are marked `aria-disabled` on the element instead (a small hook), so they dim and stay focusable. Setting it through props was silently lost.
- **Radix scopes.** `AlertDialog` is its own Radix scope, so Title and Description can't be Dialog's; only the plain sections are shared.
- **An alert opened from a dialog hides that dialog from assistive technology**, as it should: a test looks the outer dialog up with `hidden: true` while the alert is open. The outer dialog's accessible name there is its Title, not its `aria-label`.
- **No warning for a missing Cancel.** The plan had one; an acknowledge-only alert legitimately has one button, so focus falls back to the Action instead.

- **Neutral has an icon.** `neutral` first drew none, so the tone decided whether an icon showed. Every tone now has one (a note for neutral, as `Alert`'s), and `icon={false}` is the one way to remove it; there is no separate visibility prop, which would have overlapped `icon`.

## Checks run
- 27 unit tests: role, name and description with no Radix warning, no corner close button, focus on Cancel and the Action fallback and `initialFocus`, a press on the scrim ignored, Escape as a cancel and `closeOnEscape`, the reason, `preventDefault` on the Action, controlled use, `busy`, tone icons, refs and the standard props on every part, role and state that a consumer prop can't replace, nested under a `Dialog`, `StrictMode`, jest-axe in each tone and busy.
- 8 real-browser checks: a real mouse press on the scrim ignored, focus on Cancel and the Tab loop and return to the trigger, buttons stacked on a phone with the action on top and in a row from `sm`, right-to-left, each tone's icon at least 3:1 against its disc in all four themes, a busy alert ignoring Escape and real presses with its buttons focusable, and an alert over a dialog (two scrims, the alert's on top, the dialog legible under both, a real press on the alert's scrim reaching neither). The phone-stack check fails with the stacking rule removed.
- `pnpm lint`, the build, `check-guidelines`, and the Docs-token test, which reads both stylesheets.

## Open at Finalization
- Touch and iOS behaviour (shared with `Dialog`).
- The Docs page has not been looked at on a real phone; its phone layout is asserted, not seen on a device.

## Second pass: the first three gaps
- **A third choice.** `AlertDialog.Action` and `AlertDialog.Cancel` take a `value`, reported as `details.value` by `onOpenChange` next to the reason (left out when a choice has none). A second `Action` already closed the alert in Radix; what was missing was telling the two apart, since both report `"action"`. The value isn't put on the button as an attribute.
- **A type-to-confirm example.** No new API: an `Input` in `Body`, `initialFocus` on it, and the Action `disabled` until the name matches. A story, a snippet, a Docs section and a browser check show it.
- **The scrim nudge.** A press on the scrim, or Escape while `closeOnEscape` is off or the alert is `busy`, pulses the panel (a `nudge` prop, on by default). Radix gives no hook for a press outside an alert, so it is read on the scrim itself, and the pulse is two identical animations under two names so switching the class restarts it on a second press. Under reduced motion the border flashes the focus colour. The swell is a new primitive, `motion.scale.102`.
- **Found while checking it: a real press "on the scrim" at its centre lands on the panel.** The browser checks pressed the scrim's centre, which is where a centred panel sits, so "a press on the scrim does nothing" had been passing without pressing the scrim. The helper now presses just inside the scrim's corner. This applies to `Dialog`'s checks too (a tests-only change; the checks passed there with the corrected press, so the behaviour was right). The nudge check fails without the scrim handler.

## Final review pass
Four findings from the review, fixed:
1. **A nudged alert replayed the pulse in place of its entrance when reopened.** The pulse counter lives in the content component, which stays mounted while the alert is closed, so the class was still on the panel at the next open. It is reset once the alert has closed. A unit test and a browser check (the reopened panel's animation is the entrance, not the pulse) fail without the reset.
2. **The Escape nudge is proven with a real key** in the browser, not only in jsdom.
3. **jest-axe also runs** the acknowledge-only alert, the alert after a nudge, and the type-to-confirm alert with a disabled Action.
4. **The reduced-motion flash in forced colours.** Forced colours replaces a border's colour, so the flash is a `Highlight` outline there; a stylesheet-rule check covers it.

## Server render and hydration
`AlertDialog.ssr.test.tsx` server-renders each variant with `window` and `document` removed and hydrates it, asserting no recoverable error and no warning, for every tone and option. All pass. No `keepMounted` here, which is where `Dialog`'s one mismatch was.

## Fix after Finalization: a busy alert no longer runs the caller's `onClick`
Found in `ConfirmDialog`'s final review, and made with the maintainer's go-ahead on 2026-10-11. `AlertDialog.Action` and `AlertDialog.Cancel` called the caller's `onClick` before looking at `busy`, so a press that is documented to do nothing still ran the handler (a `ConfirmDialog` with `busy` called `onConfirm`). They now return before it. **Stays Finalized**: by the three-question test it changes the output of nothing that was compliant, and it corrects behaviour that contradicted the component's own documentation of `busy`. A unit test fails without it.

## `Dialog`'s footer and `divided` changes: no change here (2026-10-11)
`Dialog`'s stylesheet, which this component draws with (ADR-0056), changed in two places: the footer's actions now stack full width below `sm`, and `divided` defaults to `"auto"`. Applied the three-question test to this component as a consumer of that shared surface: **stays Finalized, nothing to re-verify.** Its footer rule (`.root .footer`) is more specific and still decides its own stacking, with the action on top and a row from `sm`, which its real-browser checks assert and which pass. It uses `Dialog`'s body and footer but has no `divided` option, so the new default doesn't reach it. See [Dialog.md](Dialog.md).

## Refactor after Finalization: the sections are drawn from `internal/overlay` (2026-10-11)
It now draws its header, title, description, body and footer from the shared sections module and no longer imports `Dialog`'s parts; it still takes its panel (size, centring, entrance) from `Dialog`'s stylesheet. A refactor with no change to what is drawn or done ([ADR-0060](../adr/0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md)), done because `Drawer` became the third consumer ADR-0056 named. By the three-question test it changes the output of nothing that existed: **stays Finalized**. The regression net is the component's own unit, server-render, Docs-token and real-browser checks, run unchanged apart from the class and custom-property names they read; all pass. Its bundle is 5.4KB (7.0KB before).

## Addition after Finalization: `onOpenChangeComplete` (2026-10-11)
A root prop reporting when the alert has finished opening and closing ([ADR-0062](../adr/0062-overlays-report-when-they-have-finished-opening-and-closing-through-onopenchangecomplete.md)): purely additive, so by the three-question test it **stays Finalized**, with the scoped mini-pass its new surface needs (JSDoc, the Docs Properties row, the root sub-part story, unit tests for open, close and `StrictMode`). Nothing that existed changes.

## Post-Finalization follow-up (2026-10-11, at explicit direction) — focus returns to what opened it
A AlertDialog opened from state (`open`, with no `AlertDialog.Trigger`) closed with focus on the page's `body`, because Radix returns focus only to its own trigger. It now remembers the element that had focus as it opened and returns it there on close, unless the caller prevented `onCloseAutoFocus` or the element is gone ([ADR-0067](../adr/0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md)). A defect fix under the finalization test (it violated the return-focus guidance, and changes nothing for a dialog with a trigger); re-verified: accessibility and functional verification. Tests: two unit tests (returns it; a prevented `onCloseAutoFocus` is left alone).

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `AlertDialog` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `AlertDialog` fails when the wrapper is removed (checked for `Popover`).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
