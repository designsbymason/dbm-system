# FileUpload — review findings

Thirteenth organism, built 2026-10-24 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Finalized 2026-10-24**, at the maintainer's declaration after a final review whose eight findings were all fixed (below).

## Decisions
- **The field never makes a request.** It holds a list of entries (`{ id, file, status, progress, error }`), shows them, and asks for removal and retry; the caller sends the files and writes `status` and `progress` back into `value`. Constraints (`accept`, `maxSize`, `minSize`, `maxFiles`, `validate`) are checked by the field for every source, and a refused file never enters the list: [ADR-0115](../adr/0115-fileupload-collects-files-and-shows-the-progress-it-is-given-and-never-uploads-them-over-owning-the-request.md).
- **A real, visually hidden `<input type="file">` is the form's control, and its `files` are rebuilt from the list after every change** (with `DataTransfer`), so a form submits what is shown and `required` is a real constraint: [ADR-0116](../adr/0116-fileupload-submits-through-a-real-file-input-whose-files-are-set-from-the-list-over-hidden-inputs-or-a-value-the-form-cannot-see.md).
- Compound: `FileUpload` (a `role="group"` `<div>`), `Dropzone`, `Trigger`, `Rejections`, `List` and `Item`, with a zero-prop default that draws a drop area, the refusals and the list, and `layout="button"` for a button alone.
- Shipped as `FileUpload`; "Dropzone" is a search term and a part (`FileUpload.Dropzone`).
- **`id` goes to the file input, not the button** (see below). `ref`, `className`, `style` and `data-testid` go to the outer group; the `aria-*` props name and describe it.
- **No new token.** The drop area's dashed edge is `border.neutral-strong` (4.70:1 in light, 6.08:1 in dark against the surface), so the 3:1 floor for a boundary that says where to drop is met by an existing token.
- **No dependency.** Native drag events and the file input are the whole mechanism. 8.39KB of JS and 3.05KB of CSS gzipped, inside the default budgets.
- Not built, additive later: a combined size or count budget, a file's path inside a dropped folder, chunked or resumable sending, and reordering the list.

## What was found while building it
- **A `<label for>` that points at a button replaces the button's own text as its name.** The first version put `id` on the "Choose files" button, so a `FormField`'s label named it "Résumé" and the visible text was no longer in the name (WCAG 2.5.3). `id` is now on the file input: a label click opens the picker, a form's focus-the-first-invalid-control lands on the input and is handed to the button. A test asserts the button keeps its own name inside a `FormField`.
- **Two changes in one turn each started from the last render, not from the list the last one left.** Two quick removals on an uncontrolled field removed one file. Caught by the first real-browser form check; the handlers now start from the list the last change left (an uncontrolled field updates it at once; a controlled one is read again at each render), with a unit test.
- **`Text`'s `truncate` is a line clamp, not an ellipsis.** A long name with hyphens wrapped and was clamped to one line vertically, so the name was cut at the first break. The name is one line with `text-overflow: ellipsis` (`wrap="nowrap"`), and a phone-width check asserts the cut and that nothing overflows.
- **In forced colours an error's double edge outranked a drag's solid one** by source order, so a drag over a field in error read as no drag. The drag rule now follows the error rule.
- **Testing Library's `fireEvent.drop` copies a `DataTransfer`'s own properties and a real one has none**, so a drop built that way carried no files. The interaction story and the real-browser checks dispatch a real `DragEvent` with a real `DataTransfer`; the unit tests pass a plain object, which the library does copy.
- **`FieldError` is `role="alert"`**, so a refusal is read out when it appears, and the field does not also announce it (that would be read twice). Added, removed, finished and failed files are announced through a status region that is in the page before it has anything to say.
- **The once-per-message `DataTransfer` warning is given once per process**, so the unit test that expects it is the first in the file to name the field, and says so.

## Added after the first review
- **`onCancel`** turns an uploading entry's remove button into cancel ("Cancel uploading report.pdf"), asking the owner to stop the request and leaving the list alone; the same button in the same place, so focus stays on it when the upload ends. Without it, an uploading file keeps its remove button.
- **Duplicates are refused by default** (`allowDuplicates` to allow): the same name, size, type and modified time, against the list and within one drop, with a message naming the file. A single-file field always lets the same file replace itself. The default is the opposite of the first version, which let a file in twice.
- **Accepted types are named for people** in the hint and the refusal message: `.pdf` is "PDF", `image/*` is "images", `image/png` is "PNG", and a vendor type stays as written; `acceptLabels` maps a piece of `accept` to its own words and wins. Repeats are dropped ("PNG, PNG" is "PNG").
- **`triggerIcon`** on the field sets the icon on the button wherever the field draws one (`null` for none); a `FileUpload.Trigger` you draw can set its own `leadingIcon` (also `null`), which wins. The button's text stays `labels.choose`.
- **A development warning when no `FileUpload.Trigger` is drawn** (not for a read-only field), since a keyboard or screen-reader user then has no way to add a file. The two docs-only part stories that draw a list without a drop area now include a trigger.

## Added after the second review
- **`variant`** (`dashed` by default, `outlined`, `filled`, `ghost`), the shared vocabulary `EmptyState` uses. The two looks that keep the strong edge are the ones that clear 3:1 as a boundary; `filled` leans on a light edge and a quiet fill and `ghost` has neither, so the prompt and the button carry the area. A drag draws the brand edge and an error the danger edge in all four, and every look is the same box (a real-browser check measures it). In forced colours the ghost's transparent edge is set to `Canvas`, since a transparent border is drawn as a solid line there (the check fails without it).
- **`allowFolders`**: a dropped folder is refused with a message by default and read recursively when asked; files then go through the same rules. One drop reads at most 5,000 files, only a drop can bring in a folder, and a file's path is not kept: [ADR-0117](../adr/0117-fileupload-reads-a-dropped-folder-only-when-asked-and-refuses-it-otherwise-over-reading-every-folder-or-adding-it-as-a-file.md). Without this, a dropped folder arrived as a broken empty entry.
- **`showPreviews`** draws a small picture of an image in place of the icon (an object URL made after the first commit and revoked when the row goes; none is made on the server, or where the browser can't, or when the picture fails to draw). Off by default, since each preview is decoded from the original file.
- **`FileUpload.Summary` and `showSummary`** (on by default): "2 of 4 uploaded, 1 failed" above the list once any file has started; plain text, not a live region.
- **The Delete (or Backspace) key** on one of a row's buttons cancels an upload that can be cancelled and otherwise removes the file; the row hears it from the buttons inside it and takes no key of its own.

## The final review's findings (all fixed)
- **A Storybook-only control leaked into the Properties table** with no description (`maxSizeMb`, a Playground control that writes `maxSize` in bytes). It is hidden from the table at the meta level; its control and description stay on the Playground story.
- **The image preview used a raw `<img>`** and its own failure state. It is now the `Image` atom (`alt=""`, `radius="sm"`, its own fallback icon on a quiet fill), found by the atom-reuse audit; the unit and browser checks measure the tile `Image` draws.
- **A hardcoded `40ch` cap on the hint** is gone; the hint wraps inside the area.
- **`FileUpload.Trigger` ignored a `size` it was given** after the spread, though the Docs say it takes `Button`'s props; its own `size` now wins over the field's.
- **English joiners were outside `labels`:** `labels.uploaded` is now a function of the size and `labels.joinHint` joins the parts of the hint; the units stay with `formatSize`, which says so.
- **The phone breakpoint's literal `639px`** carries the note that it is `breakpoint.sm` less a pixel.
- **Two Playground controls showed nothing at rest** (`showSummary`, `showPreviews`): the Playground now starts with two finished files, one an image.
- **Test gaps filled:** server render and hydration for the look, previews, folders, summary, duplicates, the page guard and a null button icon; the hover fill read from the stylesheet (a script's pointer events never match `:hover`; the check fails when the rule's colour is changed); a real clipboard paste; and a field nested inside another's row.

## Documentation
- The Docs page's Code examples section opens with "Uploading the files": the two ways to get the files where they are going (let a form submit them, or send them yourself and write `status`, `progress` and `error` back), with a measured-progress recipe (`XMLHttpRequest`), an unmeasured one (`fetch`, with a presigned-address note) and the form route. It sits under Code examples as a sub-heading, since the page template's top-level sections are fixed.

## Verified
- Unit tests (jsdom): structure and naming, the drop, picker and paste paths, drag state across children, every rule and the reasons a file is refused, an asynchronous `validate`, a rule that throws, controlled and uncontrolled, removal and where focus goes (including not taking it back from where the person has moved on), announcements as changes only and under `StrictMode`, disabled and read-only, the form input's attributes and its validity, a `FormField`, `{...props}` order, a `labels` override with `undefined`, and axe with zero violations on every state. `FileUpload.files.test.ts` covers the pure helpers; `FileUpload.ssr.test.tsx` a server render and a hydration with no mismatch for nine variants.
- Real browser (`FileUpload.checks.stories.tsx`): a real `DataTransfer` reaching a real `FormData` through a drop and through the picker, `required` refusing an empty form and handing focus to the button, the drag look and the resting edge's 3:1 contrast, forced colours (dashed to solid on a drag, double on an error), every button at least 24 × 24 at every size, a phone width with a long name and an error, right-to-left, and `guardPage`. Every story also passes axe in the browser.
- Looked at in Storybook: the Docs page renders with no console error; every state of a file at the default size in all four themes (the drag state in emerald dark); a refused file and a long name at a phone's width, with no horizontal overflow.
- Lint, both typechecks, the production build, the full unit run, the full Storybook run and the bundle-size check pass; `pnpm check-guidelines` is clean.

## Not yet verified
- Only the "Every state of a file" story was looked at in each theme, not every story on the Docs page.
- The keyboard model was exercised through unit tests and one real-browser focus check, not by hand with a screen reader.
- The Show code panels were typechecked against the real components (with a planted bad prop to prove the check bites) but not opened one by one on the live Docs page.
- A real drop of files or a folder from the operating system was not exercised: the browser checks dispatch a `DragEvent` with a real `DataTransfer`, which is what a drop delivers to the page, and a folder is walked with stand-ins for the entries API, since a script can't make a real directory.
