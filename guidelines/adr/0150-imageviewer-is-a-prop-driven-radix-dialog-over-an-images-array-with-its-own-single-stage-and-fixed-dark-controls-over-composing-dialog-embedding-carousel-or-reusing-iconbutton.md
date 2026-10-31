# 0150 — `ImageViewer` is a prop-driven Radix Dialog over an `images` array, with its own single stage and fixed dark controls, over composing `Dialog`, embedding `Carousel` or reusing `IconButton`

**Status:** Accepted · **Date:** 2026-10-31 · **Amended 2026-10-31** — the buttons are exported as `ImageViewerButton`; the decision itself is unchanged

## Context
`ImageViewer` (also called a lightbox) opens one image of a set full-screen: fitted, zoomable, turnable, with navigation and a caption. Four forks decide its shape: what it is built on, how its content is given, how it moves between images, and how its controls are coloured on a stage that is dark in every theme.

## Decision
- **It is built on Radix Dialog directly**, as a sibling of `Dialog` and `Drawer` ([ADR-0053](./0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md)): the scrim is `Backdrop` inside `Dialog.Overlay asChild`, and the panel is the `Backdrop`'s child ([ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)), so the scroll lock, the inert page, focus return and the one copy of Radix's layer stack are the ones the other overlays already have. It reuses `OverlayLifecycle` and `useReturnFocus` from `internal/overlay`. The panel fills the viewport and has none of `Dialog`'s sections, size caps or corners.
- **It is prop-driven over data**, not compound: `images` (each `{ src, alt, id, srcSet, sizes, thumbnail, caption, width, height }`, `alt` required), `open`/`defaultOpen`/`onOpenChange` with a reason, `value`/`defaultValue`/`onValueChange` ("ask, don't change", `05` §3), an optional `trigger` element, and a `controllerRef` with `useImageViewerController()` for a part in `actions`. The viewer must know what an image and a position are to preload, count and announce, which is the reason `CommandPalette` and `DataTable` take data.
- **It draws one image at a time** on its own stage, preloads the neighbours with `new Image()`, and reuses only `Carousel`'s `value` shape and controller method names. `Carousel` is not embedded.
- **Its buttons are its own**, a native button with an `Icon` in `icon.white` over a fill mixed from `bg.overlay` at 80%, not `IconButton`, `CloseButton` or `Indicators`. Unavailable is `aria-disabled`, so a press that turns a button off keeps focus. *(Amended 2026-10-31: this originally kept the button internal. It is exported as `ImageViewerButton` for the `actions` slot, because a `Button` or `IconButton` placed there takes theme colours and fails contrast on the dark stage.)* Text and glyphs on the stage use `icon.white` (the only fixed-white token); the stage's text has no `text.white` counterpart.
- **Rotate, full screen and a thumbnail strip are in** from the first version: rotate and full screen are buttons with keys (`r`, `f`), and the strip is one tab stop on the current image.
- **Three component tokens** (`image-viewer.control-size`, `thumbnail-size`, `caption-max-width`); every colour is an existing semantic token.

## Alternatives considered
- **Compose `Dialog` with `fullScreen`.** Rejected: its panel is a card with a header, body and footer, its own surface colour and corner radius, and a close button in its theme's colours. Overriding all of that is more code than the shell it saves, and `Dialog`'s panel classes are a contract with `AlertDialog`.
- **A compound `ImageViewer.Image`, `.Trigger`, `.Caption`.** Rejected: the viewer has to count, order and preload the images, which parts mounted as children cannot tell it without registering themselves; `Trigger` is one prop.
- **Embed `Carousel` for the images.** Rejected: its track is a native scroll-snap container, so a horizontal drag is the browser's scroll and cannot also be a pan of a zoomed image without switching its overflow and `touch-action` as the zoom changes; and its bundle (a dozen hooks for loop, lazy slides, auto-play and edge effects) would be most of the viewer's budget for none of its use.
- **`IconButton` and `CloseButton`.** Rejected: their tones follow the theme, so on a stage that is dark in every theme a light theme's button is a dark glyph on a dark scrim, and the contrast of a brand-filled close button over a photo was never measured. The viewer's own buttons are measured instead (white over a fill that is 12:1 against the whitest photo).
- **`Indicators` for the position.** Rejected for the same colour reason; the counter and the thumbnail strip say where the person is.
- **A new `text.white` token.** Not done: it is a change to all four themes for one component. `icon.white` is used for the stage's text, and this ADR is where that is on record; a `text.white` is the follow-up if a second component needs fixed-white text.

## Consequences
- The viewer owns a small set of buttons that look like no other control in the system; they change only with this component.
- The images are not all mounted, so a very long list costs nothing, and a thumbnail strip should be given small images.
- A library-wide `DirectionProvider` is still undecided (`01` §12): `dir` is a prop, passed to the panel.
- `ImageViewer` has a JS budget of its own if it passes the default; see `06` §4.

## Related
`05-component-api-conventions.md` §3 (controller, "ask, don't change", `labels`); `04-component-inventory.md` (ImageViewer); [ADR-0147](./0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md); [ADR-0008](./0008-closebutton-reserved-for-modal-surfaces.md); `component-reviews/ImageViewer.md`.
