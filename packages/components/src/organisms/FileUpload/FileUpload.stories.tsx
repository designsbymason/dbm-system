import { PaperclipIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, waitFor, within } from "storybook/test";
import { Text } from "../../atoms/Text";
import { FormField } from "../../molecules/FormField";
import { Form } from "../Form";
import { FileUpload } from "./FileUpload";
import { fileUploadPlaygroundSnippet, fileUploadSnippets } from "./FileUpload.snippets";
import type { FileUploadLayout, FileUploadSize, FileUploadVariant } from "./FileUpload.types";
import { SimulatedFileUpload, demoEntries, demoFile, demoImage } from "./FileUploadStoryKit";

// `FileUpload`'s own root props get hand-written argTypes here (this meta has no `component`, so docgen doesn't supply
// them); each part gets its own Properties table through a hidden docs-only stories file (ADR-0013).
interface PlaygroundArgs {
  size: FileUploadSize;
  layout: FileUploadLayout;
  variant: FileUploadVariant;
  multiple: boolean;
  allowDuplicates: boolean;
  allowFolders: boolean;
  showPreviews: boolean;
  showSummary: boolean;
  accept: string;
  maxSizeMb: number;
  maxFiles: number;
  required: boolean;
  hasError: boolean;
  disabled: boolean;
  readOnly: boolean;
  guardPage: boolean;
}

// Props the Properties table documents that have no live control, so the meta's argTypes can describe them.
interface DocumentedProps {
  children?: unknown;
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: unknown;
  maxSize?: unknown;
  minSize?: unknown;
  validate?: unknown;
  onFilesAdded?: unknown;
  onFilesRejected?: unknown;
  onRemove?: unknown;
  onRetry?: unknown;
  onCancel?: unknown;
  acceptLabels?: unknown;
  triggerIcon?: unknown;
  hint?: unknown;
  name?: unknown;
  form?: unknown;
  formatNumber?: unknown;
  formatSize?: unknown;
  labels?: unknown;
  "aria-label"?: unknown;
  "aria-labelledby"?: unknown;
  "aria-describedby"?: unknown;
  id?: unknown;
  className?: unknown;
  style?: unknown;
  "data-testid"?: unknown;
}

const allSizes: FileUploadSize[] = ["xs", "sm", "md", "lg", "xl"];
const allVariants: FileUploadVariant[] = ["dashed", "outlined", "filled", "ghost"];
const frame: CSSProperties = { maxInlineSize: "36rem", marginInline: "auto" };
const stack: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" };
const labelled: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };

// Every fixed-render story below ignores the Playground's own `args`, so each one suppresses every control it doesn't
// consume (a story-level `argTypes` entry merges over the meta-level one per key).
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  size: { control: false },
  layout: { control: false },
  variant: { control: false },
  multiple: { control: false },
  allowDuplicates: { control: false },
  allowFolders: { control: false },
  showPreviews: { control: false },
  showSummary: { control: false },
  accept: { control: false },
  maxSizeMb: { control: false },
  maxFiles: { control: false },
  required: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  guardPage: { control: false },
};

const meta: Meta<PlaygroundArgs & DocumentedProps> = {
  title: "Organisms/Inputs/FileUpload",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The parts to draw, in order. Left out: a drop area (or a button for layout=\"button\"), the messages for refused files, and the list.",
    },
    value: {
      control: false,
      description:
        "The chosen files, when you own them: an array of entries, each with an id, the file, a status and a progress. Pair with onValueChange, and write status and progress here as the files are sent.",
    },
    defaultValue: {
      control: false,
      description: "The initial files when uncontrolled.",
      table: { defaultValue: { summary: "[]" } },
    },
    onValueChange: {
      control: false,
      description: "Called with the list the person wants, after files are added or removed. A controlled list stays as it is until value changes.",
    },
    accept: {
      control: "text",
      description:
        "Which file types are accepted, in the native accept syntax: extensions (.pdf), families (image/*) and exact types, separated by commas. Applied to dropped and pasted files too.",
    },
    multiple: {
      control: "boolean",
      description: "Whether the field takes several files. With false, a new file replaces the one already chosen.",
      table: { defaultValue: { summary: "true" } },
    },
    acceptLabels: {
      control: false,
      description:
        "Names for pieces of accept, used in the hint and in the message for a refused type: a map from the piece, as written in accept, to the words to use. Pieces without one are named automatically (.pdf is PDF, image/* is images).",
    },
    allowDuplicates: {
      control: "boolean",
      description:
        "Whether the same file may be added twice (the same name, size, type and modified time). Refused by default, with a message. A single-file field always lets the same file replace itself.",
      table: { defaultValue: { summary: "false" } },
    },
    maxFiles: {
      control: "number",
      description: "The most files the field holds (multiple only). A file past it is refused with a reason. 0 or empty means no limit.",
    },
    maxSize: {
      control: false,
      description: "The largest file, in bytes. A larger file is refused with a reason. (The Playground sets it in megabytes.)",
    },
    minSize: {
      control: false,
      description: "The smallest file, in bytes. A smaller file is refused with a reason.",
    },
    validate: {
      control: false,
      description:
        "A rule of your own, run on every file that passed the others: return a message to refuse it, or nothing to accept it. May return a promise.",
    },
    onFilesAdded: {
      control: false,
      description: "Called with the files that were added (not the ones refused) and where they came from: drop, picker or paste.",
    },
    onFilesRejected: {
      control: false,
      description: "Called with the files that were refused, each with every reason.",
    },
    onRemove: {
      control: false,
      description: "Called when the person removes an entry, after onValueChange has been asked for the shorter list.",
    },
    onRetry: {
      control: false,
      description: "Called when the person presses retry on a failed entry. Retry buttons are shown only when this is set.",
    },
    onCancel: {
      control: false,
      description:
        "Called when the person presses cancel on an uploading entry: stop the request. Setting it turns the button of an uploading entry from remove into cancel; what happens to the entry after is yours. Left out, an uploading entry keeps its remove button.",
    },
    triggerIcon: {
      control: false,
      description:
        "The icon on the picker button wherever the field draws one for you, as a Phosphor icon component; null for none. A FileUpload.Trigger you draw yourself can set its own leadingIcon.",
      table: { defaultValue: { summary: "FileArrowUpIcon" } },
    },
    hint: {
      control: false,
      description:
        "The text under the button naming what is accepted. Left out, it is written from accept, maxSize and maxFiles; pass null for none.",
    },
    guardPage: {
      control: "boolean",
      description:
        "Stops the browser opening a file that is dropped anywhere on the page outside the drop area. Attaches a window listener while mounted, so it is off unless you want it.",
      table: { defaultValue: { summary: "false" } },
    },
    variant: {
      control: "select",
      options: ["dashed", "outlined", "filled", "ghost"],
      description:
        "The look of the drop area: dashed (a dashed edge), outlined (a solid edge), filled (a quiet fill and a light edge) or ghost (no fill and no edge until files are dragged over it). The error and drag edges show in every one.",
      table: { defaultValue: { summary: "dashed" } },
    },
    allowFolders: {
      control: "boolean",
      description:
        "Whether a dropped folder is read: the files under it join the others and go through the same rules. Folders are refused, with a message, unless this is set. Only a drop can bring in a folder.",
      table: { defaultValue: { summary: "false" } },
    },
    showPreviews: {
      control: "boolean",
      description:
        "Shows a small preview of each image in place of the file icon. The preview is read from the file in the browser and never sent anywhere.",
      table: { defaultValue: { summary: "false" } },
    },
    showSummary: {
      control: "boolean",
      description: "Shows a line above the list once a file has started, such as 2 of 4 uploaded, 1 failed.",
      table: { defaultValue: { summary: "true" } },
    },
    layout: {
      control: "select",
      options: ["dropzone", "button"],
      description: "How the field asks for files: a dashed drop area with a button in it, or only a button.",
      table: { defaultValue: { summary: "dropzone" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the field on the shared scale: the drop area's padding and the size of the text, icons and buttons in it.",
      table: { defaultValue: { summary: "md" } },
    },
    required: {
      control: "boolean",
      description: "Marks the field required: a form refuses to submit while no file is chosen.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description: "Draws the drop area in the error colour. FormField sets it from its error.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Turns the field off: no choosing, dropping or removing, and nothing is submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Shows the chosen files only: no button or drop area and no removing.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: false,
      description: "The name the files are submitted under, by the form the field is in.",
    },
    form: {
      control: false,
      description: "The id of a <form> the field belongs to, when it is not inside one.",
    },
    formatNumber: {
      control: false,
      description: "Turns a number into the text shown for it, in sizes and the default labels. Never defaults to the browser's locale.",
      table: { defaultValue: { summary: "String" } },
    },
    formatSize: {
      control: false,
      description: "Writes a size in bytes as text. The default gives B, KB, MB or GB in steps of 1024, with at most one decimal.",
    },
    labels: {
      control: false,
      description: "The text the field writes itself (prompts, names, messages, announcements), with English defaults. Pass only what you change.",
    },
    "aria-label": {
      control: false,
      description: "The field's accessible name. One of this and aria-labelledby is needed; FormField sets aria-labelledby.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of the element that names the field.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of the helper or error text for the field.",
    },
    id: {
      control: false,
      description: "The id of the file input, so a FieldLabel's htmlFor reaches it (clicking the label opens the picker).",
    },
    className: { control: false, description: "Additional CSS classes for the outer box." },
    style: { control: false, description: "Inline styles, merged onto the outer box." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    layout: "dropzone",
    variant: "dashed",
    multiple: true,
    allowDuplicates: false,
    allowFolders: false,
    showPreviews: false,
    showSummary: true,
    accept: "",
    maxSizeMb: 0,
    maxFiles: 0,
    required: false,
    hasError: false,
    disabled: false,
    readOnly: false,
    guardPage: false,
  },
  render: (args) => (
    <div style={frame}>
      <SimulatedFileUpload
        aria-label="Attachments"
        size={args.size}
        layout={args.layout}
        variant={args.variant}
        multiple={args.multiple}
        allowDuplicates={args.allowDuplicates}
        allowFolders={args.allowFolders}
        showPreviews={args.showPreviews}
        showSummary={args.showSummary}
        accept={args.accept || undefined}
        maxSize={args.maxSizeMb > 0 ? args.maxSizeMb * 1024 * 1024 : undefined}
        maxFiles={args.maxFiles > 0 ? args.maxFiles : undefined}
        required={args.required}
        hasError={args.hasError}
        disabled={args.disabled}
        readOnly={args.readOnly}
        guardPage={args.guardPage}
      />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs & DocumentedProps>;

/** Drive every prop live via the Controls panel below. Choose or drop files: a pretend uploader sends them (a name containing "fail" fails). */
export const Playground: Story = {
  argTypes: {
    maxSizeMb: {
      control: "number",
      description: "A Playground-only control: the largest file in megabytes, written as maxSize in bytes. 0 means no limit.",
    },
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs & DocumentedProps>) => fileUploadPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.sizes } } },
  render: () => (
    <div style={{ ...frame, ...stack }}>
      {allSizes.map((size) => (
        <div key={size} style={labelled}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <FileUpload
            aria-label={`Attachments, ${size}`}
            size={size}
            accept=".pdf"
            defaultValue={[{ id: "a", file: demoFile("contract.pdf", 240_000, "application/pdf"), status: "idle" }]}
          />
        </div>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  name: "All looks",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.variants } } },
  render: () => (
    <div style={{ ...frame, ...stack }}>
      {allVariants.map((variant) => (
        <div key={variant} style={labelled}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <FileUpload aria-label={`Documents, ${variant}`} variant={variant} accept=".pdf" size="sm" />
        </div>
      ))}
    </div>
  ),
};

export const Previews: Story = {
  name: "Image previews",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.previews } } },
  render: () => (
    <div style={frame}>
      <FileUpload
        aria-label="Photos"
        showPreviews
        defaultValue={[
          { id: "sunset", file: demoImage("sunset.svg", "#f59e0b", "#db2777"), status: "done" },
          { id: "lagoon", file: demoImage("lagoon.svg", "#06b6d4", "#4f46e5", 1_800_000), status: "uploading", progress: 45 },
          { id: "notes", file: demoFile("notes.txt", 820, "text/plain"), status: "idle" },
        ]}
      />
    </div>
  ),
};

export const Folders: Story = {
  name: "Dropping folders",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.folders } } },
  render: () => (
    <div style={frame}>
      <SimulatedFileUpload aria-label="Import" allowFolders accept=".csv,.json" />
    </div>
  ),
};

export const Layouts: Story = {
  name: "Dropzone and button layouts",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.layouts } } },
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          layout=&quot;dropzone&quot;
        </Text>
        <FileUpload aria-label="Documents" accept=".pdf" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          layout=&quot;button&quot;
        </Text>
        <FileUpload aria-label="Photos" layout="button" accept="image/*" />
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "Every state of a file",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.states } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments" defaultValue={demoEntries()} onRetry={() => undefined} onCancel={() => undefined} />
    </div>
  ),
};

export const Uploading: Story = {
  name: "Sending files (simulated)",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.uploading } } },
  render: () => (
    <div style={frame}>
      <SimulatedFileUpload aria-label="Attachments" maxFiles={5} />
    </div>
  ),
};

export const Constraints: Story = {
  name: "Types, sizes and counts",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.constraints } } },
  render: () => (
    <div style={frame}>
      <SimulatedFileUpload
        aria-label="Attachments"
        accept="image/*,.pdf"
        acceptLabels={{ ".pdf": "PDF documents" }}
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
        validate={(file) => (file.name.includes(" ") ? "Remove the spaces from the name" : undefined)}
      />
    </div>
  ),
};

export const SingleFile: Story = {
  name: "One file only",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.singleFile } } },
  render: () => (
    <div style={frame}>
      <SimulatedFileUpload aria-label="Résumé" multiple={false} accept=".pdf" />
    </div>
  ),
};

export const InAForm: Story = {
  name: "In a form",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.formField } } },
  render: () => (
    <div style={frame}>
      <Form aria-label="Supporting documents" onSubmit={() => undefined}>
        <FormField label="Supporting documents" name="documents" required helperText="PDF files only">
          {(fieldProps) => <FileUpload {...fieldProps} accept=".pdf" />}
        </FormField>
        <Form.Submit>Send</Form.Submit>
      </Form>
    </div>
  ),
};

export const ButtonIcon: Story = {
  name: "The button's icon",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.buttonIcon } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments" triggerIcon={PaperclipIcon} />
    </div>
  ),
};

export const CustomTrigger: Story = {
  name: "A button of your own",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.customTrigger } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments">
        <FileUpload.Dropzone>
          <FileUpload.Trigger variant="primary" leadingIcon={PaperclipIcon}>
            Attach files
          </FileUpload.Trigger>
        </FileUpload.Dropzone>
        <FileUpload.Rejections />
        <FileUpload.List />
      </FileUpload>
    </div>
  ),
};

export const Disabled: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.disabled } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments" disabled />
    </div>
  ),
};

export const ReadOnly: Story = {
  name: "Read-only",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.readOnly } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments" readOnly defaultValue={demoEntries().slice(0, 2)} />
    </div>
  ),
};

export const CustomList: Story = {
  name: "Composed from its parts",
  argTypes: noControls,
  parameters: { docs: { source: { code: fileUploadSnippets.customList } } },
  render: () => (
    <div style={frame}>
      <FileUpload aria-label="Attachments" defaultValue={demoEntries().slice(2, 3)}>
        <FileUpload.Dropzone />
        <FileUpload.Rejections />
        <FileUpload.List>{(entry) => <FileUpload.Item key={entry.id} entry={entry} />}</FileUpload.List>
      </FileUpload>
    </div>
  ),
};

// The interaction twin of the Playground: drops files on the area and checks the list, the refusals and the removal. It
// is hidden from the sidebar and the Docs page (07 §5) so the visible story is not changed by it.
export const DropInteraction: Story = {
  ...Playground,
  name: "Drop, refuse and remove — interaction test",
  tags: ["!dev"],
  args: { accept: ".pdf" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByRole("button", { name: "Choose files" }).parentElement as HTMLElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(["x"], "plan.pdf", { type: "application/pdf" }));
    transfer.items.add(new File(["x"], "virus.exe", { type: "application/x-msdownload" }));
    // A real DragEvent: Testing Library copies a DataTransfer's own properties, and a real one has none.
    area.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await waitFor(() => expect(canvas.getByRole("list", { name: "Selected files" })).toHaveTextContent("plan.pdf"));
    await expect(canvas.getByRole("alert")).toHaveTextContent("virus.exe is not an accepted file type");
    const remove = canvas.getByRole("button", { name: "Remove plan.pdf" });
    remove.click();
    await waitFor(() => expect(canvas.queryByText("plan.pdf")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose files" })).toHaveFocus();
  },
};
