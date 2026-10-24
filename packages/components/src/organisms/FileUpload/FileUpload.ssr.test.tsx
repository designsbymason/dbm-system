import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileUpload } from "./FileUpload";
import type { FileUploadEntry, FileUploadProps } from "./FileUpload.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const entries: FileUploadEntry[] = [
  { id: "a", file: new File(["x"], "report.pdf", { type: "application/pdf" }), status: "done" },
  { id: "b", file: new File(["x"], "photo.png", { type: "image/png" }), status: "uploading", progress: 40 },
  { id: "c", file: new File(["x"], "notes.txt"), status: "error", error: "Too slow" },
];

const variants: Array<[string, FileUploadProps]> = [
  ["a bare field", {}],
  ["a field with a hint", { accept: ".pdf", maxSize: 1048576, maxFiles: 3 }],
  ["a field with files in every state", { value: entries }],
  ["the button layout", { layout: "button" }],
  ["a single-file field", { multiple: false }],
  ["a sized field with an error", { size: "lg", hasError: true }],
  ["a disabled field", { disabled: true, value: entries }],
  ["a read-only field", { readOnly: true, value: entries }],
  ["a field with retry and cancel", { value: entries, onRetry: () => undefined, onCancel: () => undefined }],
  ["every look of the drop area", { variant: "ghost" }],
  ["a filled drop area", { variant: "filled" }],
  ["previews of images", { showPreviews: true, value: [{ id: "i", file: new File(["x"], "photo.png", { type: "image/png" }), status: "done" }, ...entries] }],
  ["folders allowed, no summary", { allowFolders: true, showSummary: false, value: entries }],
  ["duplicates allowed and named types", { allowDuplicates: true, accept: ".pdf,image/*", acceptLabels: { ".pdf": "PDF documents" } }],
  ["the page guard", { guardPage: true }],
  ["a custom button icon", { triggerIcon: null }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FileUpload on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<FileUpload aria-label="Attachments" {...props} />));
    expect(html).toContain('role="group"');
    expect(html).toContain('type="file"');
    if (props.value && !props.readOnly) expect(html).toContain("report.pdf");
  });
});

describe("FileUpload hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<FileUpload aria-label="Attachments" {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    let root!: ReturnType<typeof hydrateRoot>;
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <FileUpload aria-label="Attachments" {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      expect(screen.getByRole("group", { name: "Attachments" })).toBeInTheDocument();
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
    error.mockRestore();
    warn.mockRestore();
  });
});
