# 0117 — `FileUpload` reads a dropped folder only when asked, and refuses it otherwise, over reading every folder or adding it as a file

**Status:** Accepted · **Date:** 2026-10-24

## Context
A folder dragged onto a drop area arrives in `dataTransfer.files` as a pseudo-file with the folder's name and no contents.
Added as it is, it is a broken entry that fails when sent. Reading the folder's real files needs the File System Entries
API (`webkitGetAsEntry`, a directory reader and a read per batch), which is asynchronous, only valid while the drop's event
is being handled, and can return thousands of files from one drop. Whether a person meant to hand over a whole folder is
the app's call: a profile-picture field never wants one, an import field may want exactly that.

## Decision
- **A folder is refused unless `allowFolders` is set.** The drop's items are read synchronously, and each folder is
  reported as a refused file with the reason `"folder"` and its own name ("Photos is a folder; choose files instead"), so the
  person is told rather than left with nothing happening.
- **With `allowFolders`, the files under each folder are read recursively** and join the others, then go through the same
  rules (`accept`, sizes, `maxFiles`, duplicates, `validate`) as any file. One drop reads at most 5,000 files.
- **Only a drop can bring in a folder.** The browser's picker chooses files or a folder, never both, so the button is
  unchanged; a paste has no folders.
- **A browser that gives no entries** (or a test) falls back to the drop's plain files, as before.
- A file's path inside the folder is not kept: an entry is the `File` and its name.

## Alternatives considered
- **Always read folders.** Rejected: most fields want files, and a folder with thousands of files would be a surprise.
- **Add the folder as a file and let the sender fail.** Rejected: the failure arrives late and says nothing useful.
- **Make the picker choose folders with `webkitdirectory`.** Rejected: it stops the same button choosing single files.
- **Keep each file's relative path.** Deferred: it needs a field on the entry and a decision about how the list shows a path.

## Consequences
- An import field reads a whole tree with one prop; a files-only field refuses a folder in words.
- The read itself needs a real directory, which a script cannot make, so the walk is tested with stand-ins for the API's
  entries and the plain-file path of the same code is tested in a real browser.

## Related
[ADR-0115](./0115-fileupload-collects-files-and-shows-the-progress-it-is-given-and-never-uploads-them-over-owning-the-request.md),
[ADR-0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md)
(file drops are a separate native problem).
