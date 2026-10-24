import { cx, mergeDefined, useAnnouncement } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./FileUpload.module.css";
import {
  checkFiles,
  describeAccept,
  dropDuplicates,
  formatFileSize,
  isSameFile,
  isThenable,
  limitCount,
  runValidate,
  warnOnce,
} from "./FileUpload.files";
import type {
  FileUploadEntry,
  FileUploadLabels,
  FileUploadProps,
  FileUploadRejection,
  FileUploadSource,
  FileUploadStatus,
} from "./FileUpload.types";
import { FileUploadContext } from "./FileUploadContext";
import type { FileUploadContextValue } from "./FileUploadContext";
import {
  FileUploadDropzone,
  FileUploadHint,
  FileUploadItem,
  FileUploadList,
  FileUploadRejections,
  FileUploadSummary,
  FileUploadTrigger,
} from "./FileUploadParts";

const canWriteFiles = () => typeof DataTransfer !== "undefined";

/**
 * A field for choosing files: drag them onto the drop area, press its button, or paste, and the files appear in a
 * list with their name, size and, as you report it, their progress. It sends nothing itself. You send the files and
 * write each entry's `status` and `progress` back into `value`; the field shows them, and asks for removal and retry
 * through callbacks.
 *
 * A compound component: with no children it draws `FileUpload.Dropzone` (or `FileUpload.Trigger` for
 * `layout="button"`), `FileUpload.Rejections` and `FileUpload.List`. Files are checked against `accept`, `maxSize`,
 * `minSize`, `maxFiles` and your `validate` rule whether they were chosen, dropped or pasted; a refused file never
 * enters the list and is explained beside the field. The field submits with its form through a real file input
 * (`name`, `required`), and sits in a `FormField` like any control.
 *
 * `ref` goes to the outer group. `id` goes to the file input, not the button: a label pointing at a button replaces the
 * button's own text as its name, which would break "label in name", while a label pointing at the input opens the
 * picker when it is clicked, and a form's focus-the-first-invalid-control lands there and is passed to the button. The
 * `aria-*` props name and describe the group; `className`, `style` and `data-testid` go to the outer box.
 *
 * @example
 * ```tsx
 * <FileUpload aria-label="Attachments" accept="image/*,.pdf" maxSize={5 * 1024 * 1024} onValueChange={setFiles} value={files} />
 * <FormField label="Résumé" required>{(fieldProps) => <FileUpload {...fieldProps} name="resume" multiple={false} accept=".pdf" />}</FormField>
 * <FileUpload aria-label="Photos" layout="button" accept="image/*" />
 * ```
 */
const FileUploadRoot = forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      children,
      value,
      defaultValue,
      onValueChange,
      accept,
      multiple = true,
      maxFiles,
      maxSize,
      minSize,
      validate,
      onFilesAdded,
      onFilesRejected,
      onRemove,
      onRetry,
      onCancel,
      allowDuplicates = false,
      acceptLabels,
      triggerIcon,
      hint: hintProp,
      guardPage = false,
      variant = "dashed",
      allowFolders = false,
      showPreviews = false,
      showSummary = true,
      layout = "dropzone",
      size = "md",
      required = false,
      hasError = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      formatNumber = String,
      formatSize: formatSizeProp,
      labels: labelOverrides,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      id,
      className,
      style,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const formatSize = formatSizeProp ?? ((bytes: number) => formatFileSize(bytes, formatNumber));

    const defaultLabels: FileUploadLabels = {
      prompt: (isMultiple) => (isMultiple ? "Drag and drop files here, or" : "Drag and drop a file here, or"),
      dropToAdd: "Drop to add",
      choose: (isMultiple) => (isMultiple ? "Choose files" : "Choose a file"),
      listLabel: "Selected files",
      remove: (fileName) => `Remove ${fileName}`,
      cancel: (fileName) => `Cancel uploading ${fileName}`,
      retry: (fileName) => `Retry ${fileName}`,
      uploading: (fileName) => `Uploading ${fileName}`,
      uploadingStatus: (percent) => (percent === undefined ? "Uploading…" : `Uploading… ${formatNumber(percent)}%`),
      uploaded: (size) => `Uploaded · ${size}`,
      failed: "Upload failed",
      joinHint: (parts) => parts.join(" · "),
      acceptedTypes: (types) => `Accepted: ${types}`,
      maxSizeHint: (limit) => `Up to ${limit} each`,
      maxFilesHint: (limit) => `Up to ${formatNumber(limit)} files`,
      fileType: (fileName, types) => `${fileName} is not an accepted file type (${types})`,
      tooLarge: (fileName, limit) => `${fileName} is larger than ${limit}`,
      tooSmall: (fileName, limit) => `${fileName} is smaller than ${limit}`,
      tooMany: (fileName, limit) => `${fileName} was not added: no more than ${formatNumber(limit)} files`,
      folder: (fileName) => `${fileName} is a folder; choose files instead`,
      summary: (uploaded, total, failed) =>
        `${formatNumber(uploaded)} of ${formatNumber(total)} uploaded${failed > 0 ? `, ${formatNumber(failed)} failed` : ""}`,
      duplicate: (fileName) => `${fileName} is already added`,
      invalid: (fileName, message) => `${fileName}: ${message}`,
      couldNotCheck: "it could not be checked",
      added: (count, first) => (count === 1 ? `${first} added` : `${formatNumber(count)} files added`),
      removed: (fileName) => `${fileName} removed`,
      uploadedAnnouncement: (fileName) => `${fileName} uploaded`,
      failedAnnouncement: (fileName, reason) => (reason ? `${fileName} failed: ${reason}` : `${fileName} failed`),
      required: "Choose at least one file",
    };
    const labels = mergeDefined(defaultLabels, labelOverrides);

    const isControlled = value !== undefined;
    const [uncontrolledEntries, setUncontrolledEntries] = useState<FileUploadEntry[]>(defaultValue ?? []);
    const rawEntries = isControlled ? value : uncontrolledEntries;
    // Untyped data on its way (a value that is not an array) reads as no files rather than throwing.
    const entries = useMemo(() => (Array.isArray(rawEntries) ? rawEntries : []), [rawEntries]);
    const entriesRef = useRef(entries);
    useLayoutEffect(() => {
      entriesRef.current = entries;
    });

    const [rejections, setRejections] = useState<FileUploadRejection[]>([]);
    const { message: announcement, announce } = useAnnouncement();

    const baseId = useId();
    const controlId = id ?? `${baseId}-control`;
    const hintId = `${baseId}-hint`;
    const rejectionsId = `${baseId}-rejections`;
    const nextEntryId = useRef(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const commit = (next: FileUploadEntry[]) => {
      if (!isControlled) {
        // Two changes in one turn (a drop and a press, two quick presses) each start from the list the last one
        // left, not from the last render. A controlled list is the owner's, and is read again at each render.
        entriesRef.current = next;
        setUncontrolledEntries(next);
      }
      onValueChange?.(next);
    };

    // The real input's files are always the list's files (ADR-0116), so a form submits what is shown.
    const writeInputFiles = (list: FileUploadEntry[]) => {
      const input = inputRef.current;
      if (!input) return;
      if (!canWriteFiles()) {
        if (name || required) {
          warnOnce(
            "FileUpload: this browser has no `DataTransfer` constructor, so the files cannot be handed to the form; a surrounding <form> will not receive them.",
          );
        }
        return;
      }
      // Writing the same files again would only churn the browser's selection.
      const current = input.files;
      if (
        current &&
        current.length === list.length &&
        list.every((entry, index) => {
          const existing = current.item(index);
          return existing !== null && isSameFile(existing, entry.file);
        })
      ) {
        return;
      }
      const transfer = new DataTransfer();
      for (const entry of list) transfer.items.add(entry.file);
      input.files = transfer.files;
    };
    useEffect(() => {
      writeInputFiles(entries);
    });

    useEffect(() => {
      inputRef.current?.setCustomValidity(required && entries.length === 0 ? labels.required : "");
    });

    const finishAdding = (
      passed: File[],
      refused: FileUploadRejection[],
      source: FileUploadSource,
    ) => {
      const held = entriesRef.current;
      const { accepted, rejected: overflow } = limitCount(passed, multiple ? held.length : 0, multiple, maxFiles);
      const allRefused = [...refused, ...overflow];
      let next = held;
      if (accepted.length > 0) {
        const added: FileUploadEntry[] = accepted.map((file) => {
          nextEntryId.current += 1;
          return { id: `${baseId}-file-${nextEntryId.current}`, file, status: "idle" };
        });
        next = multiple ? [...held, ...added] : added;
        commit(next);
        onFilesAdded?.(accepted, source);
        announce(labels.added(accepted.length, accepted[0]?.name ?? ""));
      }
      setRejections(allRefused);
      if (allRefused.length > 0) onFilesRejected?.(allRefused);
      writeInputFiles(next);
    };

    const addFiles = (incoming: File[], source: FileUploadSource, refused: FileUploadRejection[] = []) => {
      if (disabled || readOnly || (incoming.length === 0 && refused.length === 0)) return;
      const { passed, rejected } = checkFiles(incoming, { accept, maxSize, minSize });
      const onFault = (error: unknown) =>
        warnOnce(`FileUpload: \`validate\` threw or rejected (${String(error)}); the file was refused. Return a message instead of throwing.`);
      // A single-file field lets the same file replace itself, so it only looks for repeats within the batch.
      const held = multiple ? entriesRef.current.map((entry) => entry.file) : [];
      const unique = dropDuplicates(passed, held, allowDuplicates);
      const checked = runValidate(unique.passed, validate, onFault);
      const complete = (result: { passed: File[]; rejected: FileUploadRejection[] }) =>
        finishAdding(result.passed, [...refused, ...rejected, ...unique.rejected, ...result.rejected], source);
      if (isThenable(checked)) void Promise.resolve(checked).then(complete);
      else complete(checked);
    };

    const handlePicked = (event: ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.currentTarget.files ?? []);
      // Clear the browser's own selection so choosing the same file again still fires a change, then put the
      // list's files back: the input follows the list, never the other way round.
      event.currentTarget.value = "";
      writeInputFiles(entriesRef.current);
      addFiles(picked, "picker");
    };

    const pendingFocus = useRef<{ index: number; count: number } | null>(null);
    const remove = (entry: FileUploadEntry) => {
      if (disabled || readOnly) return;
      const held = entriesRef.current;
      const index = held.findIndex((candidate) => candidate.id === entry.id);
      pendingFocus.current = { index: Math.max(index, 0), count: held.length };
      setRejections([]);
      commit(held.filter((candidate) => candidate.id !== entry.id));
      onRemove?.(entry);
      announce(labels.removed(entry.file.name));
    };

    // After a removal, focus goes to the next entry's remove button, or the picker button when none is left, but only
    // if it is not somewhere else by now (the removed button took it with it).
    useEffect(() => {
      const pending = pendingFocus.current;
      if (!pending) return;
      pendingFocus.current = null;
      if (entries.length >= pending.count) return;
      const active = document.activeElement;
      if (active && active !== document.body && !rootRef.current?.contains(active)) return;
      const buttons = rootRef.current?.querySelectorAll<HTMLElement>("[data-fileupload-remove]");
      const target = buttons && buttons.length > 0 ? buttons[Math.min(pending.index, buttons.length - 1)] : triggerRef.current;
      target?.focus();
    }, [entries]);

    // Say when a file finishes or fails. The first list is the starting point, not news, and the memory is
    // dropped on unmount so a StrictMode remount starts again from the list it finds.
    const previousStatus = useRef<Map<string, FileUploadStatus> | null>(null);
    useEffect(() => {
      const before = previousStatus.current;
      previousStatus.current = new Map(entries.map((entry) => [entry.id, entry.status ?? "idle"]));
      if (!before) return;
      for (const entry of entries) {
        const was = before.get(entry.id);
        const now = entry.status ?? "idle";
        if (was === undefined || was === now) continue;
        if (now === "done") announce(labels.uploadedAnnouncement(entry.file.name));
        else if (now === "error") announce(labels.failedAnnouncement(entry.file.name, entry.error));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- announcing is news about the entries only
    }, [entries]);
    useEffect(
      () => () => {
        previousStatus.current = null;
      },
      [],
    );

    // A dropped file that no drop area took would be opened by the browser in place of the page. The area itself
    // cancels its own drops; this is for the rest of the page, and is attached only on request.
    useEffect(() => {
      if (!guardPage) return undefined;
      const cancelFileDrag = (event: DragEvent) => {
        if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) event.preventDefault();
      };
      window.addEventListener("dragover", cancelFileDrag);
      window.addEventListener("drop", cancelFileDrag);
      return () => {
        window.removeEventListener("dragover", cancelFileDrag);
        window.removeEventListener("drop", cancelFileDrag);
      };
    }, [guardPage]);

    const hint = useMemo(() => {
      if (hintProp !== undefined) return hintProp;
      const parts = [
        accept && describeAccept(accept, acceptLabels) ? labels.acceptedTypes(describeAccept(accept, acceptLabels)) : null,
        maxSize !== undefined ? labels.maxSizeHint(formatSize(maxSize)) : null,
        multiple && maxFiles !== undefined ? labels.maxFilesHint(maxFiles) : null,
      ].filter(Boolean);
      return parts.length > 0 ? labels.joinHint(parts as string[]) : null;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- the labels and formatter are rebuilt every render
    }, [hintProp, accept, acceptLabels, maxSize, maxFiles, multiple, labels.joinHint, labels.acceptedTypes, labels.maxSizeHint, labels.maxFilesHint]);

    const describedBy =
      [hint !== null && hint !== false && hint !== undefined ? hintId : null, rejections.length > 0 ? rejectionsId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    const context: FileUploadContextValue = {
      entries,
      rejections,
      size,
      variant,
      allowFolders,
      showPreviews,
      multiple,
      disabled,
      readOnly,
      hasError,
      labels,
      formatNumber,
      formatSize,
      hint,
      hintId,
      rejectionsId,
      describedBy,
      limits: { accept, acceptLabels, maxSize, minSize, maxFiles },
      triggerIcon,
      canRetry: onRetry !== undefined,
      canCancel: onCancel !== undefined,
      triggerRef,
      open: () => {
        if (!disabled && !readOnly) inputRef.current?.click();
      },
      addFiles,
      remove,
      retry: (entry) => {
        if (!disabled && !readOnly) onRetry?.(entry);
      },
      cancel: (entry) => {
        if (!disabled && !readOnly) onCancel?.(entry);
      },
    };

    // The button is the only way in for a keyboard or a screen reader (the drop area is for a pointer), so a field drawn
    // without one cannot be used by them. Checked after the parts have attached their refs.
    useEffect(() => {
      if (process.env.NODE_ENV === "production" || readOnly || triggerRef.current) return;
      warnOnce(
        "FileUpload: no `FileUpload.Trigger` was drawn, so there is no button to open the file picker; a keyboard or screen-reader user cannot add files. Put a `FileUpload.Trigger` in your `FileUpload.Dropzone` (or the field), or leave the field's children out to draw the default.",
      );
    });

    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy) {
        warnOnce(
          "FileUpload: neither `aria-label` nor `aria-labelledby` was given, so the group of controls has no accessible name. Pass one, or put the field in a `FormField`.",
        );
      }
      if (isControlled && defaultValue !== undefined) {
        warnOnce("FileUpload: both `value` and `defaultValue` were passed; `defaultValue` is ignored once the field is controlled. Pass one.");
      }
      if (!multiple && maxFiles !== undefined) {
        warnOnce("FileUpload: `maxFiles` has no effect when `multiple` is false; a single-file field holds one. Remove `maxFiles`, or allow `multiple`.");
      }
    }

    const defaultContent =
      layout === "button" ? (
        <>
          <div className={styles.buttonRow}>
            <FileUploadTrigger />
            <FileUploadHint />
          </div>
          <FileUploadRejections />
          {showSummary && <FileUploadSummary />}
          <FileUploadList />
        </>
      ) : (
        <>
          <FileUploadDropzone />
          <FileUploadRejections />
          {showSummary && <FileUploadSummary />}
          <FileUploadList />
        </>
      );

    return (
      <FileUploadContext.Provider value={context}>
        <div
          {...props}
          ref={setRootRef}
          // Computed last, so a same-named prop can never replace them (05 §3). A group takes no `aria-invalid`.
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled || undefined}
          data-testid={dataTestId}
          style={style}
          className={cx(styles.root, className)}
        >
          {children ?? defaultContent}
          {/* A real, visually hidden control: it carries the form's name, the constraint and the files (ADR-0116). */}
          <input
            ref={inputRef}
            className={styles.input}
            type="file"
            tabIndex={-1}
            aria-hidden="true"
            id={controlId}
            name={name}
            form={form}
            accept={accept}
            multiple={multiple}
            required={required}
            disabled={disabled}
            onChange={handlePicked}
            onFocus={() => triggerRef.current?.focus()}
          />
          {/* In the page before it has anything to say, so changes are announced. */}
          <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        </div>
      </FileUploadContext.Provider>
    );
  },
);
FileUploadRoot.displayName = "FileUpload";

export const FileUpload = Object.assign(FileUploadRoot, {
  Dropzone: FileUploadDropzone,
  Trigger: FileUploadTrigger,
  Rejections: FileUploadRejections,
  Summary: FileUploadSummary,
  List: FileUploadList,
  Item: FileUploadItem,
});
