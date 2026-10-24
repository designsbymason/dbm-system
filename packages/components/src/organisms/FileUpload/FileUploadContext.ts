import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";
import type { ButtonProps } from "../../atoms/Button";
import type {
  FileUploadEntry,
  FileUploadLabels,
  FileUploadRejection,
  FileUploadSize,
  FileUploadSource,
  FileUploadVariant,
} from "./FileUpload.types";

/** What the root hands to its parts. */
export interface FileUploadContextValue {
  entries: FileUploadEntry[];
  rejections: FileUploadRejection[];
  size: FileUploadSize;
  variant: FileUploadVariant;
  allowFolders: boolean;
  showPreviews: boolean;
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  hasError: boolean;
  labels: FileUploadLabels;
  formatNumber: (value: number) => string;
  formatSize: (bytes: number) => string;
  /** The hint under the button, already worked out; `null` when there is none. */
  hint: ReactNode;
  /** The `id` the hint is drawn with, for the button's `aria-describedby`. */
  hintId: string;
  /** The `id` the refusal messages are drawn with. */
  rejectionsId: string;
  /** The ids the button is described by: the hint, the refusals and the field's own. */
  describedBy: string | undefined;
  /** The limits the refusal messages quote. */
  limits: { accept?: string; acceptLabels?: Record<string, string>; maxSize?: number; minSize?: number; maxFiles?: number };
  /** The icon the field draws on its button: `undefined` means the default, `null` none. */
  triggerIcon: ButtonProps["leadingIcon"] | null | undefined;
  canRetry: boolean;
  canCancel: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: () => void;
  /** Adds files from a source; `refused` are files the caller already turned away (folders), shown with the rest. */
  addFiles: (files: File[], source: FileUploadSource, refused?: FileUploadRejection[]) => void;
  remove: (entry: FileUploadEntry) => void;
  retry: (entry: FileUploadEntry) => void;
  cancel: (entry: FileUploadEntry) => void;
}

export const FileUploadContext = createContext<FileUploadContextValue | null>(null);

/** Reads the root's settings; a part drawn outside a `FileUpload` cannot work, so it says so. */
export function useFileUpload(part: string): FileUploadContextValue {
  const context = useContext(FileUploadContext);
  if (!context) throw new Error(`${part} must be rendered inside a <FileUpload>.`);
  return context;
}
