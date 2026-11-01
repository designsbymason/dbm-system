# Tour — review findings

**Status:** Built 2026-11-01 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized**: only the maintainer declares that. The items under "Not verified" are open.

## What was built

A guided tour of a page already on screen. `steps` is data (`id`, `target`, `title`, `content`, per-step `side`, `align`, `padding`, `interactive`, `labels`); each step dims the page except one element and puts a card beside it with "Step n of N", Skip, Back and Next or Finish. The step showing is `value` (an id), controlled or not; the tour opens from `open`/`defaultOpen` or `controllerRef` and tells `onOpenChange` why it ended. A step with no element, or whose element never appears, is a centred card. `presentation` is `anchored` or `docked` (a breakpoint map works), `progress` is `text` or `none`, and it takes `scrimOpacity`, `closeOnOutsidePress`, `targetTimeout`, `onTargetMissing`, `container`, `dir`, `labels` and `formatNumber`.

## Decisions
- Prop-driven over a `steps` array, an id as the value, no trigger, "seen once" a recipe on `usePersistentDismiss`: [ADR-0165](../adr/0165-tour-is-a-prop-driven-overlay-over-a-steps-array-with-a-step-id-as-its-value-and-no-trigger-over-a-compound-of-step-parts-or-a-built-in-start-button.md).
- A ring with a shadow dim, a shield with a `clip-path` hole for an `interactive` step, a non-modal dialog holding focus, the ring read every frame: [ADR-0166](../adr/0166-tour-dims-the-page-with-a-moving-ring-and-blocks-it-with-a-shield-and-keeps-focus-in-a-non-modal-card-over-a-modal-dialog-an-svg-mask-or-four-panels.md).
- Radix Popper directly (pinned 1.3.7, the copy Popover already uses) and a docked presentation: [ADR-0167](../adr/0167-tour-positions-its-card-with-radix-popper-over-popover-and-docks-it-across-the-bottom-on-a-phone-over-a-popover-collision-shift.md). This differs from the plan's Radix Popover: Popover's content forces its own `role="dialog"` and a looping focus scope, which an `interactive` step cannot turn off.
- **`progress` is `text` or `none`; there are no dots.** `Indicators` is always a row of buttons, and a tour's progress is not something to press.
- No new token. The padding is a step on the spacing scale read as `--dbm-space-*`; the card is `Popover`'s surface; the dim is `bg.overlay` at `opacity.60`. No new colour pairing, so no new contrast check.
- Bundle: 7.2KB of JS and 2.3KB of CSS, inside the default 10KB budget.
- `internal/useReducedMotion.ts` (a store with a server snapshot) is new shared code.

## What was found while building it
- **A card drawn afresh for each step loses the focus that was on it.** The next step's element is looked up in a frame, so the card is removed and drawn again, and the control that was pressed is gone with it. The pressed control is remembered by name (`data-tour-action`) and found again in the new card; the first version cleared the note against the old, detached card, and the card then ended up focused instead. A second remount came from reading a stale box for the new step as the middle of the screen, drawing a centred card first; a box now names the element it was measured for, and the card waits for its own.
- **A page that is not visible runs no animation frames,** so a tour opened in a hidden tab (or a preview pane that is not shown) sits empty until the tab is shown. The tour is a visible-page feature, and the browser tests run on a shown page.
- **A tour drawn into a flex box adds its own gap.** The layer is a child of its container, so a flex column with a `gap` grows by one gap while the tour is open and the items under `margin-top: auto` move up. The story kit's "behind" button is absolutely placed for that reason, and the first check failed on it.
- **Fixed positioning inside a container is measured from the container's corner,** not the viewport's: the ring and the card are in the same containing block, and positions are read from a hidden probe that covers it. The first check measures the ring against its element inside a transformed container.
- **Popper reads the ring, not the element,** so the card's offset includes the padding and it follows the ring as it eases (`updatePositionStrategy="always"`).
- **Hit-testing follows `clip-path`,** which is what lets a press through the hole of an `interactive` step; the check presses the field for real and types into it, and presses the page outside the hole and sees the count stay at 0. A shield removed would fail it.
- **The first story's first check was flaky until the web font had loaded** (the field's height changed after it was measured): every check waits for `document.fonts.ready` and for the ring to be still for a few frames.
- Radix's own focus scope pauses an outer scope when another is mounted, so the trap is `FocusTrap`'s, put on the card itself, and the initial focus is the card (so the dialog and its name are read), not its first button.

## Verified
- 39 unit checks (structure, steps, controlled and uncontrolled, the controller, every target form, a missing and an invalid target, focus and announcements including `StrictMode`, labels, docked and interactive, axe) and a server render and hydration check; the Docs page's token table matches the stylesheet (checked by a test).
- 26 real-browser checks, run four times in a row: the ring against its element inside a transformed container; the card clear of the ring and above the shield; real presses on the dimmed page, through an `interactive` hole and on Next; Tab and Shift+Tab loops; focus after a keyboard step and Back; Escape and the focus it returns; a centred card; a docked card; a real wheel on the page and a scrolling ancestor; right-to-left side and arrow keys; forced colours and reduced motion (each cleared with `features: []`); the 24px target size; axe on every story.
- The Docs page was opened in a running Storybook: nine canvases, no error, the headings of the template, the Properties and step tables. The docked card was looked at in dark mode.

## Not verified
- **A screen reader.** The card's name, description, the announcement of a step and the loop were checked by attributes and by axe, not by listening.
- **All four themes.** The Purple theme in light and dark was looked at; Emerald was not.
- **A real phone.** The docked card is checked at the stage's width, with no on-screen keyboard and no safe-area inset (the card's bottom edge does not read `env(safe-area-inset-bottom)`).
- **A step whose element sits in a modal `Dialog`** is documented as unsupported and not exercised.
- **A step whose element moves on its own** (an animation) is followed frame by frame, and was not stress-tested; a very long page with many steps was not either.
- **Keyboard use of an `interactive` step** is Tab from the card's last button into the element, and nothing back; Shift+Tab leaves the card for the page.
- The Docs page shows an `h2` (the card's title) while a demo is open, which a table of contents built live would list for as long as it is open.
