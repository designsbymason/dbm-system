import type { FileUploadRejection, FileUploadRejectionReason, FileUploadValidateResult } from "./FileUpload.types";

const warned = new Set<string>();
/** A development warning, given once per message and never in production. */
export function warnOnce(message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

const SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

/**
 * Writes a size in bytes as `B`, `KB`, `MB` or `GB` in steps of 1024, with at most one decimal. The digits go through
 * `formatNumber`, so the text never depends on the browser's locale.
 */
export function formatFileSize(bytes: number, formatNumber: (value: number) => string = String): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${formatNumber(0)} ${SIZE_UNITS[0]}`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded)} ${SIZE_UNITS[unit]}`;
}

// Names for the families and the types whose subtype alone reads badly.
const FAMILY_NAMES: Record<string, string> = {
  "image/*": "images",
  "video/*": "videos",
  "audio/*": "audio",
  "text/*": "text files",
  "text/plain": "plain text",
};

/** One `accept` piece as a person reads it: `.pdf` as "PDF", `image/*` as "images", `image/png` as "PNG". */
function nameOfAccept(piece: string, names: Record<string, string> | undefined): string {
  const key = piece.toLowerCase();
  const given = names && Object.entries(names).find(([token]) => token.trim().toLowerCase() === key);
  if (given) return given[1];
  if (key.startsWith(".")) return key.length > 1 ? key.slice(1).toUpperCase() : piece;
  if (FAMILY_NAMES[key]) return FAMILY_NAMES[key];
  const subtype = key.split("/")[1];
  // A plain subtype (pdf, png, csv, json) reads well in capitals; a vendor type or a wildcard stays as written.
  return subtype && /^[a-z0-9]+$/.test(subtype) ? subtype.toUpperCase() : piece;
}

/**
 * The `accept` list as people read it: each piece named (`.pdf` is "PDF", `image/*` is "images"), repeats dropped, joined
 * with commas. `names` maps a piece of the list to the words to use for it, and wins over the automatic name.
 */
export function describeAccept(accept: string, names?: Record<string, string>): string {
  const seen = new Set<string>();
  const described: string[] = [];
  for (const piece of accept.split(",").map((part) => part.trim()).filter(Boolean)) {
    const name = nameOfAccept(piece, names);
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    described.push(name);
  }
  return described.join(", ");
}

/** Whether two files are the same file as far as a browser can tell: the same name, size, type and modified time. */
export const isSameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.type === b.type && a.lastModified === b.lastModified;

/**
 * Refuses a file that is already held, or that appears twice in the same batch, as a `"duplicate"`. With `allow` every
 * file passes.
 */
export function dropDuplicates(
  files: File[],
  held: File[],
  allow: boolean,
): { passed: File[]; rejected: FileUploadRejection[] } {
  if (allow) return { passed: files, rejected: [] };
  const passed: File[] = [];
  const rejected: FileUploadRejection[] = [];
  for (const file of files) {
    if (held.some((other) => isSameFile(other, file)) || passed.some((other) => isSameFile(other, file))) {
      rejected.push({ file, reasons: ["duplicate"] });
    } else passed.push(file);
  }
  return { passed, rejected };
}

/**
 * Whether a file matches an `accept` list in the native syntax: `.ext` (case-insensitive), `type/*` and an exact
 * type. An empty or missing list accepts everything. A file with no type is matched by its extension only.
 */
export function matchesAccept(file: Pick<File, "name" | "type">, accept: string | undefined): boolean {
  const pieces = (accept ?? "")
    .split(",")
    .map((piece) => piece.trim().toLowerCase())
    .filter(Boolean);
  if (pieces.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return pieces.some((piece) => {
    if (piece.startsWith(".")) return name.endsWith(piece);
    if (piece.endsWith("/*")) return type.startsWith(piece.slice(0, -1));
    return type === piece;
  });
}

export interface FileRules {
  accept?: string;
  maxSize?: number;
  minSize?: number;
}

/** Splits files into those that pass the type and size rules and those refused, with every reason a file failed. */
export function checkFiles(files: File[], rules: FileRules): { passed: File[]; rejected: FileUploadRejection[] } {
  const passed: File[] = [];
  const rejected: FileUploadRejection[] = [];
  for (const file of files) {
    const reasons: FileUploadRejectionReason[] = [];
    if (!matchesAccept(file, rules.accept)) reasons.push("file-type");
    if (rules.maxSize !== undefined && file.size > rules.maxSize) reasons.push("too-large");
    if (rules.minSize !== undefined && file.size < rules.minSize) reasons.push("too-small");
    if (reasons.length > 0) rejected.push({ file, reasons });
    else passed.push(file);
  }
  return { passed, rejected };
}

/**
 * Keeps as many files as the field has room for and refuses the rest as `"too-many"`. A single-file field replaces what
 * it holds, so its room is one; a field with `maxFiles` has what is left after the entries it already holds.
 */
export function limitCount(
  files: File[],
  held: number,
  multiple: boolean,
  maxFiles: number | undefined,
): { accepted: File[]; rejected: FileUploadRejection[] } {
  const room = multiple ? (maxFiles === undefined ? files.length : Math.max(0, maxFiles - held)) : 1;
  return {
    accepted: files.slice(0, room),
    rejected: files.slice(room).map((file) => ({ file, reasons: ["too-many" as const] })),
  };
}

type Validate = (file: File) => FileUploadValidateResult | PromiseLike<FileUploadValidateResult>;

export const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";

/** What a rule's answer means: a non-empty string refuses the file, anything else accepts it. */
const messageOf = (result: unknown): string | undefined => (typeof result === "string" && result !== "" ? result : undefined);

/**
 * Runs the consumer's rule on each file. Their function is untrusted: a throw or a rejection refuses the file
 * (reported through `onFault`) rather than taking the field down. The result is a value when every rule answered at
 * once and a promise when any of them did not, so a field without a rule, or with a plain one, adds files in the
 * same turn.
 */
export function runValidate(
  files: File[],
  validate: Validate | undefined,
  onFault: (error: unknown) => void,
): { passed: File[]; rejected: FileUploadRejection[] } | PromiseLike<{ passed: File[]; rejected: FileUploadRejection[] }> {
  if (!validate) return { passed: files, rejected: [] };

  const answers = files.map((file): { message?: string } | PromiseLike<{ message?: string }> => {
    try {
      const result = validate(file);
      if (isThenable(result)) {
        return Promise.resolve(result).then(
          (resolved) => ({ message: messageOf(resolved) }),
          (error: unknown) => {
            onFault(error);
            return { message: "" };
          },
        );
      }
      return { message: messageOf(result) };
    } catch (error) {
      onFault(error);
      return { message: "" };
    }
  });

  const collect = (resolved: { message?: string }[]) => {
    const passed: File[] = [];
    const rejected: FileUploadRejection[] = [];
    resolved.forEach((answer, index) => {
      const file = files[index];
      if (!file) return;
      if (answer.message === undefined) passed.push(file);
      else rejected.push({ file, reasons: ["invalid"], message: answer.message || undefined });
    });
    return { passed, rejected };
  };

  return answers.some(isThenable)
    ? Promise.all(answers).then(collect)
    : collect(answers as { message?: string }[]);
}

// The pieces of the File System Entries API a dropped folder is read with. Browsers expose them on a drop's items as
// `webkitGetAsEntry`; the types below are the few members used, since TypeScript's DOM library has them under other names.
interface DirectoryReaderLike {
  readEntries: (success: (entries: EntryLike[]) => void, failure: (error: unknown) => void) => void;
}
interface EntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (file: File) => void, failure: (error: unknown) => void) => void;
  createReader?: () => DirectoryReaderLike;
}
type ItemWithEntry = DataTransferItem & { webkitGetAsEntry?: () => EntryLike | null };

/** The most files read from one dropped folder, so a drop of a whole disk's worth of files can't hang the page. */
export const MAX_FOLDER_FILES = 5000;

/** Every file under a dropped folder, in order, read a batch at a time as the API gives them. */
export async function readFolder(directory: EntryLike, found: File[] = []): Promise<File[]> {
  const reader = directory.createReader?.();
  if (!reader) return found;
  for (;;) {
    const batch = await new Promise<EntryLike[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (batch.length === 0) return found;
    for (const entry of batch) {
      if (found.length >= MAX_FOLDER_FILES) return found;
      if (entry.isDirectory) await readFolder(entry, found);
      else if (entry.isFile && entry.file) {
        const read = entry.file;
        found.push(await new Promise<File>((resolve, reject) => read.call(entry, resolve, reject)));
      }
    }
  }
}

export interface DroppedItems {
  /** Files that can be used as they are. */
  files: File[];
  /** Folders that were dropped and will not be read, as empty files carrying their names. */
  folders: File[];
  /** One pending read per folder that will be read. Empty unless folders are allowed. */
  reads: Promise<File[]>[];
}

/**
 * What a drop holds, read synchronously (a drop's items are only valid during the event): plain files, folders to refuse,
 * and, when `readFolders`, a read for each folder. A browser or test that gives no entries falls back to the drop's files.
 */
export function readDroppedItems(transfer: DataTransfer, readFolders: boolean): DroppedItems {
  const dropped: DroppedItems = { files: [], folders: [], reads: [] };
  const items = Array.from(transfer.items ?? []) as ItemWithEntry[];
  if (items.length === 0 || !items.some((item) => typeof item.webkitGetAsEntry === "function")) {
    dropped.files = Array.from(transfer.files ?? []);
    return dropped;
  }
  for (const item of items) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.() ?? null;
    if (entry?.isDirectory) {
      if (readFolders) dropped.reads.push(readFolder(entry));
      else dropped.folders.push(new File([], entry.name));
      continue;
    }
    const file = item.getAsFile();
    if (file) dropped.files.push(file);
  }
  return dropped;
}

/** A summary of where the files are: how many are sent of how many, and how many failed. `null` until one has started. */
export function summarize(
  entries: ReadonlyArray<{ status?: string }>,
): { uploaded: number; total: number; failed: number } | null {
  if (!entries.some((entry) => (entry.status ?? "idle") !== "idle")) return null;
  return {
    uploaded: entries.filter((entry) => entry.status === "done").length,
    total: entries.length,
    failed: entries.filter((entry) => entry.status === "error").length,
  };
}
