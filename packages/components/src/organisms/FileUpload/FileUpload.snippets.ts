// The code shown under each story's "Show code" button on FileUpload's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers (a simulated uploader, sample files), which can't be pasted anywhere. Each snippet is the smallest real usage
// of what its story shows, and `storySnippets.test.ts` checks that stays true. State and handlers are named in a
// comment, since a snippet is JSX only. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { FileUploadLayout, FileUploadSize, FileUploadVariant } from "./FileUpload.types";

const stateNote = "{/* You own the files: const [files, setFiles] = useState<FileUploadEntry[]>([]); */}";

export const fileUploadSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<FileUpload aria-label="Attachments" size="lg" accept=".pdf" />`,

  layouts: `{/* layout: "dropzone" (default) draws a dashed drop area; "button" draws only a button. */}
<FileUpload aria-label="Photos" layout="button" accept="image/*" />`,

  variants: `{/* variant: "dashed" (default) | "outlined" | "filled" | "ghost". A drag draws a brand edge in every one. */}
<FileUpload aria-label="Documents" variant="filled" accept=".pdf" />`,

  previews: `{/* Shows a small picture of each image in place of the file icon. It is read from the file in the browser
    and is never sent anywhere. entries: the files to show, as FileUploadEntry[] */}
<FileUpload aria-label="Photos" showPreviews defaultValue={entries} />`,

  folders: `{/* A dropped folder is refused with a message unless allowFolders is set; then the files under it are read and go
    through the same rules (accept, sizes, maxFiles, duplicates, validate) as any file. Only a drop can bring in a folder. */}
<FileUpload aria-label="Import" allowFolders accept=".csv,.json" value={files} onValueChange={setFiles} />`,

  states: `{/* entries: the files to show, as FileUploadEntry[]. Write each entry's status and progress yourself as the file is sent:
    status: "idle" | "uploading" | "done" | "error", progress: 0–100 (leave it out if you can't measure it).
    A failed entry shows its \`error\` text, and a retry button when you pass \`onRetry\`. An uploading entry's
    button is "cancel" when you pass \`onCancel\` (stop the request there), and "remove" otherwise. */}
<FileUpload
  aria-label="Attachments"
  defaultValue={entries}
  onRetry={(entry) => retry(entry)}
  onCancel={(entry) => abort(entry)}
/>`,

  constraints: `{/* accept, maxSize (bytes), minSize, maxFiles and your own validate rule are applied to every file,
    including dropped and pasted ones. A refused file is explained under the field and never enters the list, and so is a
    file that is already in it (unless you pass allowDuplicates). */}
<FileUpload
  aria-label="Attachments"
  accept="image/*,.pdf"
  acceptLabels={{ ".pdf": "PDF documents" }}
  maxSize={5 * 1024 * 1024}
  maxFiles={3}
  validate={(file) => (file.name.includes(" ") ? "Remove the spaces from the name" : undefined)}
  value={files}
  onValueChange={setFiles}
/>`,

  singleFile: `{/* With multiple={false} a new file replaces the one already chosen. */}
<FileUpload aria-label="Résumé" multiple={false} accept=".pdf" value={files} onValueChange={setFiles} />`,

  formField: `{/* Inside a form, the field submits real files under its name, and required is a real constraint. */}
<Form aria-label="Supporting documents" onSubmit={handleSubmit}>
  <FormField label="Supporting documents" name="documents" required helperText="PDF files only">
    {(fieldProps) => <FileUpload {...fieldProps} accept=".pdf" />}
  </FormField>
  <Form.Submit>Send</Form.Submit>
</Form>`,

  buttonIcon: `{/* The icon on the picker button, wherever the field draws one for you; null for none.
    PaperclipIcon comes from @dbm-system/icons */}
<FileUpload aria-label="Attachments" triggerIcon={PaperclipIcon} />`,

  disabled: `<FileUpload aria-label="Attachments" disabled />`,

  readOnly: `{/* Shows the files and nothing to change them with. entries: the files to show, as FileUploadEntry[] */}
<FileUpload aria-label="Attachments" readOnly defaultValue={entries} />`,

  uploading: `{/* FileUpload sends nothing. Start every entry whose status is "idle" (in an effect, say) and write its
    progress back into the list: status "uploading" with progress 0–100, then "done", or "error" with an \`error\`
    message. A failed entry gets a retry button when you pass onRetry, and an uploading one a cancel button when you
    pass onCancel (stop the request there and decide what the entry becomes). */}
<FileUpload
  aria-label="Attachments"
  maxFiles={5}
  value={files}
  onValueChange={setFiles}
  onRetry={(entry) => send(entry)}
  onCancel={(entry) => abort(entry)}
/>`,

  customTrigger: `{/* Compose the drop area to change the button itself: its text, variant or icon. */}
<FileUpload aria-label="Attachments">
  <FileUpload.Dropzone>
    <FileUpload.Trigger variant="primary" leadingIcon={PaperclipIcon}>Attach files</FileUpload.Trigger>
  </FileUpload.Dropzone>
  <FileUpload.Rejections />
  <FileUpload.List />
</FileUpload>`,

  customList: `{/* Draw each entry yourself, usually a FileUpload.Item with something added. entries: the files to show */}
<FileUpload aria-label="Attachments" defaultValue={entries}>
  <FileUpload.Dropzone />
  <FileUpload.Rejections />
  <FileUpload.List>
    {(entry) => <FileUpload.Item key={entry.id} entry={entry} />}
  </FileUpload.List>
</FileUpload>`,
};

interface PlaygroundArgs {
  size?: FileUploadSize;
  layout?: FileUploadLayout;
  variant?: FileUploadVariant;
  multiple?: boolean;
  allowDuplicates?: boolean;
  allowFolders?: boolean;
  showPreviews?: boolean;
  showSummary?: boolean;
  accept?: string;
  maxSizeMb?: number;
  maxFiles?: number;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  guardPage?: boolean;
}

/** The Playground's snippet, built from the live controls: only what differs from the defaults. */
export function fileUploadPlaygroundSnippet(args: PlaygroundArgs): string {
  const attributes = ['aria-label="Attachments"'];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.layout && args.layout !== "dropzone") attributes.push(`layout="${args.layout}"`);
  if (args.variant && args.variant !== "dashed") attributes.push(`variant="${args.variant}"`);
  if (args.multiple === false) attributes.push("multiple={false}");
  if (args.allowDuplicates) attributes.push("allowDuplicates");
  if (args.allowFolders) attributes.push("allowFolders");
  if (args.showPreviews) attributes.push("showPreviews");
  if (args.showSummary === false) attributes.push("showSummary={false}");
  if (args.accept?.trim()) attributes.push(`accept=${quote(args.accept.trim())}`);
  if (typeof args.maxSizeMb === "number" && args.maxSizeMb > 0) attributes.push(`maxSize={${args.maxSizeMb} * 1024 * 1024}`);
  if (args.multiple !== false && typeof args.maxFiles === "number" && args.maxFiles > 0) attributes.push(`maxFiles={${args.maxFiles}}`);
  if (args.required) attributes.push("required");
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.guardPage) attributes.push("guardPage");
  attributes.push("value={files}", "onValueChange={setFiles}");
  return `${stateNote}\n<FileUpload\n${attributes.map((attribute) => `  ${attribute}`).join("\n")}\n/>`;
}
