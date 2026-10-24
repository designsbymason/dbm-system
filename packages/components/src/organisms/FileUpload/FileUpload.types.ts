import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode } from "react";
import type { ButtonProps } from "../../atoms/Button";

/** The size of the field, on the shared scale. It sets the dropzone's padding and the size of the text, icons and buttons in it. */
export type FileUploadSize = "xs" | "sm" | "md" | "lg" | "xl";

/** The look of the drop area: a dashed edge, a solid one, a quiet fill, or nothing until files are dragged over it. */
export type FileUploadVariant = "dashed" | "outlined" | "filled" | "ghost";

/** How the field asks for files: a dashed drop area with a button in it, or only a button. */
export type FileUploadLayout = "dropzone" | "button";

/** Where a file is in being sent. `FileUpload` sends nothing itself: the caller writes this. */
export type FileUploadStatus = "idle" | "uploading" | "done" | "error";

/** Where a batch of files came from. */
export type FileUploadSource = "drop" | "picker" | "paste";

/** Why a file was refused. */
export type FileUploadRejectionReason = "file-type" | "too-large" | "too-small" | "too-many" | "duplicate" | "folder" | "invalid";

/** One chosen file and, once the caller starts sending it, where that has got to. */
export interface FileUploadEntry {
  /** A stable identity for the entry, used as its key and to tell which one a remove or retry means. */
  id: string;
  /** The file. */
  file: File;
  /**
   * Where the file is in being sent. Written by the caller; the field only shows it.
   * @default "idle"
   */
  status?: FileUploadStatus;
  /**
   * How far along an `"uploading"` file is, from 0 to 100. Leave it out for a file whose progress can't be
   * measured, and the bar is indeterminate.
   */
  progress?: number;
  /** Why an `"error"` file failed, shown in place of the generic "Upload failed". */
  error?: string;
}

/** A file the field refused, with every reason, and the message a custom `validate` gave. */
export interface FileUploadRejection {
  /** The refused file. */
  file: File;
  /** Every reason, in the order they were found. */
  reasons: FileUploadRejectionReason[];
  /** What `validate` returned, when `"invalid"` is one of the reasons. */
  message?: string;
}

/** What a custom `validate` may return: a message to refuse the file with, or nothing to accept it. */
export type FileUploadValidateResult = string | null | undefined | void;

/** The text a `FileUpload` writes itself: names, prompts, hints, messages and announcements. */
export interface FileUploadLabels {
  /** The words beside the button in the drop area. Receives whether the field takes several files. @default (multiple) => multiple ? "Drag and drop files here, or" : "Drag and drop a file here, or" */
  prompt: (multiple: boolean) => string;
  /** Replaces the prompt while files are dragged over the drop area. @default "Drop to add" */
  dropToAdd: string;
  /** The button's text. Receives whether the field takes several files. @default (multiple) => multiple ? "Choose files" : "Choose a file" */
  choose: (multiple: boolean) => string;
  /** The accessible name of the list of chosen files. @default "Selected files" */
  listLabel: string;
  /** The accessible name of an entry's remove button. @default (name) => `Remove ${name}` */
  remove: (name: string) => string;
  /** The accessible name of the button that stops an uploading file, shown when `onCancel` is set. @default (name) => `Cancel uploading ${name}` */
  cancel: (name: string) => string;
  /** The accessible name of an entry's retry button. @default (name) => `Retry ${name}` */
  retry: (name: string) => string;
  /** The name of an entry's progress bar. @default (name) => `Uploading ${name}` */
  uploading: (name: string) => string;
  /** The status line of an uploading file. Receives the percentage as a plain number, or `undefined` when it can't be measured. @default (percent) => percent === undefined ? "Uploading…" : `Uploading… ${percent}%` */
  uploadingStatus: (percent: number | undefined) => string;
  /** The status line of a file that was sent. @default "Uploaded" */
  uploaded: string;
  /** The status line of a file that failed and gave no reason. @default "Upload failed" */
  failed: string;
  /** The hint's part naming the accepted types. Receives the `accept` list. @default (types) => `Accepted: ${types}` */
  acceptedTypes: (types: string) => string;
  /** The hint's part naming the size limit. Receives the limit already formatted. @default (size) => `Up to ${size} each` */
  maxSizeHint: (size: string) => string;
  /** The hint's part naming the file limit. Receives the limit as a plain number. @default (max) => `Up to ${max} files` */
  maxFilesHint: (max: number) => string;
  /** The refusal for a file of a type that isn't accepted. @default (name, types) => `${name} is not an accepted file type (${types})` */
  fileType: (name: string, types: string) => string;
  /** The refusal for a file over `maxSize`. Receives the limit already formatted. @default (name, max) => `${name} is larger than ${max}` */
  tooLarge: (name: string, max: string) => string;
  /** The refusal for a file under `minSize`. Receives the limit already formatted. @default (name, min) => `${name} is smaller than ${min}` */
  tooSmall: (name: string, min: string) => string;
  /** The refusal for a file past `maxFiles`, or past one in a single-file field. Receives the limit as a plain number. @default (name, max) => `${name} was not added: no more than ${max} files` */
  tooMany: (name: string, max: number) => string;
  /** The refusal for a dropped folder, when folders are not allowed. @default (name) => `${name} is a folder; choose files instead` */
  folder: (name: string) => string;
  /**
   * The summary line above the list once a file has started: how many are sent of how many, and how many failed. Plain
   * numbers; write them with `formatNumber` if you pass your own.
   * @default (uploaded, total, failed) => `${uploaded} of ${total} uploaded` + (failed ? `, ${failed} failed` : "")
   */
  summary: (uploaded: number, total: number, failed: number) => string;
  /** The refusal for a file that is already in the list, or twice in one batch. @default (name) => `${name} is already added` */
  duplicate: (name: string) => string;
  /** The refusal for a file `validate` turned down. Receives the message it gave. @default (name, message) => `${name}: ${message}` */
  invalid: (name: string, message: string) => string;
  /** The reason given for a file whose `validate` rule threw or rejected instead of answering. @default "it could not be checked" */
  couldNotCheck: string;
  /** Announced when files are added. Receives how many, as a plain number, and the first name. @default (count, first) => count === 1 ? `${first} added` : `${count} files added` */
  added: (count: number, first: string) => string;
  /** Announced when a file is removed. @default (name) => `${name} removed` */
  removed: (name: string) => string;
  /** Announced when a file finishes uploading. @default (name) => `${name} uploaded` */
  uploadedAnnouncement: (name: string) => string;
  /** Announced when a file fails. Receives the reason, if there is one. @default (name, reason) => reason ? `${name} failed: ${reason}` : `${name} failed` */
  failedAnnouncement: (name: string, reason: string | undefined) => string;
  /** The message a form shows when `required` is set and no file was chosen. @default "Choose at least one file" */
  required: string;
}

export interface FileUploadProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    | "children"
    | "defaultValue"
    | "onChange"
    | "role"
    | "id"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
  > {
  /**
   * The parts to draw, in order. Leave it out for the default: a drop area, the messages for refused files and the
   * list (`layout="button"` draws a button instead of the drop area). Compose your own from `FileUpload.Dropzone`,
   * `.Trigger`, `.Rejections` and `.List`.
   */
  children?: ReactNode;
  /**
   * The chosen files, when you own them. A new array on every change; never mutated. Passing it makes the field
   * controlled: a gesture asks for a change through `onValueChange` and the list stays as it is until this changes.
   * Pair with `onValueChange`. Write each entry's `status` and `progress` here as the files are sent.
   */
  value?: FileUploadEntry[];
  /**
   * The initial files when uncontrolled.
   * @default []
   */
  defaultValue?: FileUploadEntry[];
  /** Called with the list the person wants: after files are added or removed. */
  onValueChange?: (value: FileUploadEntry[]) => void;
  /**
   * Which file types are accepted, in the native `accept` syntax: extensions (`.pdf`), whole families (`image/*`) and
   * exact types (`application/pdf`), separated by commas. It is applied to files from every source, including drops
   * and pastes, which the browser's own filter does not see.
   */
  accept?: string;
  /**
   * Whether the field takes several files. With `false` a new file replaces the one already chosen.
   * @default true
   */
  multiple?: boolean;
  /** The most files the field holds. Only for `multiple`. A file past it is refused with a reason. */
  maxFiles?: number;
  /** The largest file, in bytes. A larger file is refused with a reason. */
  maxSize?: number;
  /** The smallest file, in bytes. A smaller file is refused with a reason. */
  minSize?: number;
  /**
   * A rule of your own, run on every file that passed the others: return a message to refuse it, or nothing to accept
   * it. It may return a promise (a check that reads the file). A rule that throws or rejects refuses the file and
   * warns in development.
   */
  validate?: (file: File) => FileUploadValidateResult | PromiseLike<FileUploadValidateResult>;
  /** Called with the files that were added (not the ones refused), and where they came from. */
  onFilesAdded?: (files: File[], source: FileUploadSource) => void;
  /** Called with the files that were refused and why. */
  onFilesRejected?: (rejections: FileUploadRejection[]) => void;
  /** Called when the person removes an entry, after `onValueChange` has been asked for the shorter list. */
  onRemove?: (entry: FileUploadEntry) => void;
  /** Called when the person presses retry on a failed entry. Retry buttons are shown only when this is set. */
  onRetry?: (entry: FileUploadEntry) => void;
  /**
   * Called when the person presses cancel on an uploading entry: stop the request. Setting it turns the button of an
   * uploading entry from "remove" into "cancel"; what happens to the entry after is yours (remove it, or set it back to
   * `"idle"` or to `"error"`). Left out, an uploading entry keeps its remove button.
   */
  onCancel?: (entry: FileUploadEntry) => void;
  /**
   * Whether the same file may be added twice (the same name, size, type and modified time). Refused by default, with a
   * message. A single-file field always lets the same file replace itself.
   * @default false
   */
  allowDuplicates?: boolean;
  /**
   * Names for pieces of `accept`, used in the hint and in the message for a refused type: a map from the piece, as
   * written in `accept`, to the words to use. Pieces without one are named automatically (`.pdf` is "PDF", `image/*` is
   * "images").
   */
  acceptLabels?: Record<string, string>;
  /**
   * The icon on the picker button, as a Phosphor icon component, wherever the field draws one for you; `null` for none.
   * A `FileUpload.Trigger` you draw yourself can set its own `leadingIcon`.
   * @default FileArrowUpIcon
   */
  triggerIcon?: ButtonProps["leadingIcon"] | null;
  /**
   * The text under the button naming what is accepted. Left out, it is written from `accept`, `maxSize` and
   * `maxFiles`; pass `null` for none.
   */
  hint?: ReactNode;
  /**
   * Stops the browser from opening a file that is dropped anywhere on the page outside the drop area (it would
   * navigate away from the page). Attaches a listener to the window while the field is mounted, so it is off unless
   * you want it, and one field on the page is enough.
   * @default false
   */
  guardPage?: boolean;
  /**
   * The look of the drop area: `dashed` (a dashed edge), `outlined` (a solid edge), `filled` (a quiet fill and a light
   * edge) or `ghost` (no fill and no edge until files are dragged over it). The error and drag edges show in every one.
   * @default "dashed"
   */
  variant?: FileUploadVariant;
  /**
   * Whether a dropped folder is read: the files under it join the others and go through the same rules. Folders are
   * refused, with a message, unless this is set. Only a drop can bring in a folder (the picker chooses files or a folder,
   * never both).
   * @default false
   */
  allowFolders?: boolean;
  /**
   * Shows a small preview of each image in place of the file icon. The preview is read from the file in the browser and
   * never sent anywhere.
   * @default false
   */
  showPreviews?: boolean;
  /**
   * Shows a line above the list once a file has started, such as "2 of 4 uploaded, 1 failed". Left out of a field you
   * compose yourself unless you draw `FileUpload.Summary`.
   * @default true
   */
  showSummary?: boolean;
  /**
   * How the field asks for files.
   * @default "dropzone"
   */
  layout?: FileUploadLayout;
  /**
   * The size of the field, on the shared size scale.
   * @default "md"
   */
  size?: FileUploadSize;
  /**
   * Marks the field required: a form refuses to submit while no file is chosen.
   * @default false
   */
  required?: boolean;
  /**
   * Draws the drop area in the error colour. Set by `FormField` from its `error`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Turns the field off: no choosing, dropping or removing, and nothing is submitted.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the chosen files only: no button or drop area, and no removing. For a form someone may look at but not
   * change.
   * @default false
   */
  readOnly?: boolean;
  /** The name the files are submitted under. */
  name?: string;
  /** The `id` of a `<form>` the field belongs to, when it is not inside one. */
  form?: string;
  /**
   * Turns a number into the text shown for it, in the sizes and the default labels. Never defaults to the browser's
   * locale.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Writes a size in bytes as text. The default gives `B`, `KB`, `MB` or `GB` in steps of 1024, with at most one
   * decimal, through `formatNumber`.
   */
  formatSize?: (bytes: number) => string;
  /** The text the field writes itself, with English defaults. Pass only what you change. */
  labels?: Partial<FileUploadLabels>;
  /**
   * The field's accessible name. Set by `FormField` as `aria-labelledby`; one of the two is needed.
   */
  "aria-label"?: string;
  /** Points at the element that names the field. */
  "aria-labelledby"?: string;
  /** Points at the helper or error text for the field. */
  "aria-describedby"?: string;
  /**
   * The `id` of the file input, so a `FieldLabel`'s `htmlFor` reaches it (clicking the label opens the picker) and a
   * form's "focus the first invalid control" lands there and moves on to the button. It is not put on the button,
   * whose name must stay its own text.
   */
  id?: string;
  /** Extra class names for the outer box. */
  className?: string;
  /** Inline styles for the outer box. */
  style?: CSSProperties;
  /** A test id for the outer box. */
  "data-testid"?: string;
}

export interface FileUploadDropzoneProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /** What the drop area holds. Left out: an icon, the prompt, the button and the hint. */
  children?: ReactNode;
  /** Extra class names for the drop area. */
  className?: string;
  /** Inline styles for the drop area. */
  style?: CSSProperties;
  /** A test id for the drop area. */
  "data-testid"?: string;
}

export interface FileUploadTriggerProps extends Omit<ButtonProps, "onClick" | "type" | "disabled" | "leadingIcon"> {
  /** The button's text. Left out: "Choose files" (or "Choose a file" in a single-file field). */
  children?: ReactNode;
  /**
   * An icon before the text, as a Phosphor icon component; `null` for none. Left out: the field's `triggerIcon`, which
   * is a file with an up arrow (`FileArrowUpIcon`).
   * @default FileArrowUpIcon
   */
  leadingIcon?: ButtonProps["leadingIcon"] | null;
  /** Called when the button is pressed, before the picker opens; `preventDefault()` keeps it closed. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export interface FileUploadRejectionsProps extends ComponentPropsWithoutRef<"ul"> {
  /** Extra class names for the list of messages. */
  className?: string;
  /** Inline styles for the list of messages. */
  style?: CSSProperties;
  /** A test id for the list of messages. */
  "data-testid"?: string;
}

export interface FileUploadListProps extends Omit<ComponentPropsWithoutRef<"ul">, "children"> {
  /**
   * What to draw for each entry. Left out: a `FileUpload.Item`. Give a function to draw your own, usually a
   * `FileUpload.Item` with something added.
   */
  children?: (entry: FileUploadEntry) => ReactNode;
  /** Extra class names for the list. */
  className?: string;
  /** Inline styles for the list. */
  style?: CSSProperties;
  /** A test id for the list. */
  "data-testid"?: string;
}

export interface FileUploadItemProps extends Omit<ComponentPropsWithoutRef<"li">, "children"> {
  /** The entry this row shows. */
  entry: FileUploadEntry;
  /** Extra class names for the row. */
  className?: string;
  /** Inline styles for the row. */
  style?: CSSProperties;
  /** A test id for the row. */
  "data-testid"?: string;
}

export interface FileUploadSummaryProps extends ComponentPropsWithoutRef<"p"> {
  /** Extra class names for the summary line. */
  className?: string;
  /** Inline styles for the summary line. */
  style?: CSSProperties;
  /** A test id for the summary line. */
  "data-testid"?: string;
}
