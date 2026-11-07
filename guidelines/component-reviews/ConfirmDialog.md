# ConfirmDialog — review findings

Third organism, built 2026-10-11 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Finalized 2026-10-11**, with the items under "Open at Finalization" accepted as open: none changes the component.

## Decisions
- Prop-driven over `AlertDialog`, with its own `trigger` and a `requireText` field: [ADR-0057](../adr/0057-confirmdialog-is-a-prop-driven-wrapper-over-alertdialog-with-its-own-trigger-and-a-typed-confirmation-field-over-a-compound-of-its-own.md).
- `onConfirm` may return a promise that holds it busy; a rejection keeps it open: [ADR-0058](../adr/0058-confirmdialogs-onconfirm-may-return-a-promise-that-holds-it-busy-and-a-rejection-keeps-it-open-over-a-caller-managed-busy-state.md).
- No stylesheet and no sub-parts, so no per-part stories and no Docs-token test; its Docs page names the tokens that give it its look and says it adds none (`SearchInput`'s shape).

## What was found while building it
- **`AlertDialog.Action` runs a consumer's `onClick` before it looks at `busy`.** A `busy` prop on `ConfirmDialog` still called `onConfirm`; the handler now refuses on `busy`, a pending answer and a mismatch itself. A unit test fails without it.
- **`isLoading` on the action loses keyboard focus.** `Button` turns it into a native `disabled`, which drops focus from a button just pressed. The pending state is a `Spinner` in the label instead, and the busy panel's `aria-disabled` keeps the button focusable. A real-browser check fails with `isLoading` put back.
- **`onError` and `onCancel` are native `<div>` event props.** The error callback is `onConfirmError` and both native names are omitted from the inherited type, or the interface would not extend it.
- **The type-to-confirm button is natively `disabled`, not `aria-disabled`.** The planned focusable-and-dimmed treatment needs a rule in a stylesheet this component does not have, and focus never sits on the button while it is disabled (it is on the field). The confirm is reachable by Tab the moment the text matches.
- **No warning of its own for a missing description.** Radix already warns in development; a second message would only duplicate it. The one warning added is for a dialog nothing can open (no `trigger`, no `open`, no `defaultOpen`).
- **The field is `readOnly`, not `disabled`, while an answer is pending,** so focus is not dropped from where the person is typing.
- **Two Playground-only controls (`confirmLabel`, `cancelLabel`)** are fields of `labels`. Kept on the Playground story's args, since on the meta they leaked into the Properties table with empty descriptions.

## Second pass: six additions (2026-10-11)
Built before its final review, against the gaps listed after the first build; decisions in [ADR-0059](../adr/0059-confirmdialog-announces-instead-of-drawing-progress-delays-the-confirm-over-hold-to-confirm-and-remembers-through-the-dismiss-store.md).
- **Pending and failure are announced** through a status region in the panel (`labels.working`, `labels.failed`), not drawn as text.
- **`initialFocus="confirm" | "cancel"`** beside a ref, with a fallback when the button can't take focus yet.
- **`confirmProps` / `cancelProps`**, without the props the dialog owns.
- **`dontAskAgain`**, over `usePersistentDismiss`'s store: a trigger press answers with no dialog, an `open` that asks for it is answered and reported closed, and nothing is remembered when the promise rejects.
- **`confirmDelay`** with a one-line countdown whose height doesn't change, announced once at the end; hold-to-confirm left for later.
- **`requireTextMatch`** (`"exact"`, `"ignore-case"`, a function), with accents normalised in every mode.
- **Bundle:** 10.60KB measured, over the 10KB default, so it was given its own 12KB entry (`06` §4); the overlay-sections extraction ([ADR-0060](../adr/0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md)) took it to 9.19KB and the entry was removed.
- **Found while building:** the `latest` ref that holds the current `answer` had to be updated after `answer` is declared (lint: used before defined); `matches` had to include the delay or Enter in the field would have confirmed early (a unit test now fails without it).
- **Known, not fixed:** the confirm button grows by its spinner when an answer starts (as `Button`'s own loading state does), moving Cancel by the spinner's width. Its label and height are held and checked; reserving the spinner's room needs a stylesheet this component doesn't have, so it is left for the review pass to weigh.

## Final review pass
Nine findings from the review, all fixed (the `AlertDialog` one with the maintainer's go-ahead):
1. **`onConfirm` ran twice when the choice was remembered in the middle of an opening.** `skip` was read live, so ticking the box and confirming in a controlled dialog whose owner closes a moment later turned the dialog still on screen into one "asked to be open while remembered", answering it again and unmounting it without its exit animation. `skip` is now judged once per opening, after the browser has been asked. Three tests fail without it (a slow-closing owner twice, and the dialog staying until it closes).
2. **`AlertDialog.Action` and `.Cancel` ran the caller's `onClick` while busy**, against their own documentation. Fixed in `AlertDialog` (see [AlertDialog.md](AlertDialog.md)); `ConfirmDialog`'s own guard stays as a net.
3. **The tab order across the whole dialog is asserted** in a real browser, forwards and back, with the confirm skipped while it is disabled.
4. **Server render and hydration cover the second pass:** the box, the delay, a larger title, focus on confirm, button props and ignore-case, plus a remembered confirmation hydrating default-open and controlled (the server draws what a first visit would, and the browser then finds it remembered).
5. **Unit and axe gaps closed:** `StrictMode` with a remembered default-open dialog, `storage: "session"` and the expiry written on dismiss, and axe for the box and for the delay before and after.
6. **Measured on a phone at the smallest size:** the delay line at its longest ("12 seconds") is one line, so the words changing can't resize anything. The atom's checkbox box is 20 by 20, below 24; its label beside it is the equivalent control and clears 24 by 24 and toggles it, which is what the check asserts. That is `Checkbox`'s own look, and is noted for its next review rather than changed here.
7. **The delay re-renders once a second,** not five times: whole seconds are held in state.
8. **No dead control:** `requireTextMatch` shows in the Playground only once there is a `requireText`.
9. **Records brought current** (this file, `AlertDialog`'s review, and an in-place amendment to ADR-0057).

## Checks run
- 78 unit tests (43 from the first build, then the second pass and the final review: announcing, `initialFocus`, `confirmProps`/`cancelProps`, `dontAskAgain` including a rejected answer, a remembered promise and a controlled `open`, `confirmDelay` including Enter and reopening, `requireTextMatch`, `titleSize`, remembering in the middle of an opening, storage and expiry, and axe for the new states): role, name and description with no warning, answer and cancel and Escape with the reason, the scrim ignored, a promise (pending, resolve, reject with and without a handler, retry, a second press, controlled, unmount, `StrictMode`), `busy`, focus (Cancel first, the field with `requireText`, `initialFocus`, return to the trigger), `requireText` (match, trim, case, Enter, read-only while pending, reset on reopen, none for an empty string), labels merged with `mergeDefined`, ref and standard props, a role that can't be replaced, tones and icons, controlled use, over a `Dialog`, jest-axe in each tone, pending and typed.
- 28 server-render and hydration tests (thirteen variants, each rendered with `window` and `document` removed and hydrated with `onRecoverableError` collected, and a remembered confirmation hydrated both default-open and controlled).
- 16 real-browser checks (six added after the first build: focus on the confirm and the fallback, the status region and the button's label while working, the panel and buttons unmoved when the delay ends, a remembered answer with no dialog, the tab order across the whole dialog, and the delay line on a phone at the smallest size): a real press on the scrim ignored and pulsing, focus loop and return, a pending answer ignoring a real Escape, scrim press and button presses with focus staying on the confirm and closing on resolve, a rejection staying open and retrying, a rejection with no handler reaching the page as an unhandled rejection, a whole string inserted at once enabling the field and Enter confirming, the phone stack, the row from `sm`, right-to-left, and a confirmation over a dialog.
- Snippets typechecked against the real components (with a planted bad prop), `pnpm lint`, the build, `check-guidelines`, the bundle-size budget (9.19KB gzip JS against the 10KB default), and the Docs page looked at in a running Storybook in light and dark.

## Open at Finalization
- JS size has about 0.8KB of headroom under the 10KB default.
- `Checkbox`'s 20px box on its own is under the 24px target size; only its label meets it (finding 6).
- Touch and iOS behaviour, shared with `Dialog` and `AlertDialog`.
- The new states (the delay line, the box, the spinner on the button) were looked at live in Purple light and dark only; the Emerald themes and a real phone were not, and the layout is asserted by real-browser checks rather than seen.
- An imperative `confirm()`, an `error` display prop and hold-to-confirm are deferred, not decided against (ADR-0057, ADR-0058, ADR-0059).

## Addition after Finalization: `onOpenChangeComplete` (2026-10-11)
A root prop reporting when the dialog (handed to the `AlertDialog` it is drawn with) has finished opening and closing ([ADR-0062](../adr/0062-overlays-report-when-they-have-finished-opening-and-closing-through-onopenchangecomplete.md)): purely additive, so by the three-question test it **stays Finalized**, with the scoped mini-pass its new surface needs (JSDoc, the Docs Properties row, the root sub-part story, unit tests for open, close and `StrictMode`). Nothing that existed changes.

## Post-Finalization follow-up (2026-10-11, at explicit direction) — focus returns to what opened it
A ConfirmDialog opened from state (`open`, with no `trigger`) closed with focus on the page's `body`, because Radix returns focus only to its own trigger. It now remembers the element that had focus as it opened and returns it there on close, unless the caller prevented `onCloseAutoFocus` or the element is gone ([ADR-0067](../adr/0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md)). A defect fix under the finalization test (it violated the return-focus guidance, and changes nothing for a dialog with a trigger); re-verified: accessibility and functional verification. Tests: two unit tests (returns it; a prevented `onCloseAutoFocus` is left alone).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
