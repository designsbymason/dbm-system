import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { FileUpload } from "./FileUpload";
import type { FileUploadSize, FileUploadVariant } from "./FileUpload.types";
import { demoEntries, demoFile, demoImage } from "./FileUploadStoryKit";

// Real-browser checks for what jsdom can't evaluate: a real `DataTransfer` and `FormData`, the constraint a form
// enforces, the computed look of the drop area while dragging and in forced colours, target sizes, a phone's width and
// right-to-left. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/FileUpload/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const frame = (children: React.ReactNode) => <div style={{ maxInlineSize: "32rem" }}>{children}</div>;

/** A real `DataTransfer` carrying real files. */
function transferOf(...files: File[]): DataTransfer {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return transfer;
}

const real = (name: string, content = "hello", type = "text/plain") => new File([content], name, { type });
const areaOf = (root: HTMLElement) => within(root).getByRole("button", { name: /^Choose/ }).parentElement as HTMLElement;

function dispatchDrag(target: Element, type: "dragenter" | "dragover" | "dragleave" | "drop", transfer: DataTransfer) {
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
  target.dispatchEvent(event);
  return event;
}

/** A CSS colour as red, green and blue in 0–255, by painting it, so any colour syntax reads the same way. */
function rgbOf(colour: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.fillStyle = "#000";
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r ?? 0, g ?? 0, b ?? 0];
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(rgbOf(a)), luminance(rgbOf(b))].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
};

export const FormCarriesTheFiles: Story = {
  name: "A form submits the files that are shown, and refuses when none is chosen",
  render: () =>
    frame(
      <form aria-label="Upload" data-testid="form">
        <FileUpload aria-label="Documents" name="docs" required />
      </form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    const docs = () => new FormData(form).getAll("docs");
    await expect(form.checkValidity(), "invalid while empty").toBe(false);
    await expect(form.querySelector<HTMLInputElement>('input[type="file"]')!.validationMessage).toBe("Choose at least one file");

    // A drop: two real files reach the form, as files.
    dispatchDrag(areaOf(canvasElement), "drop", transferOf(real("a.txt"), real("b.txt")));
    await waitFor(() => expect(docs()).toHaveLength(2));
    await expect(docs().every((entry) => entry instanceof File)).toBe(true);
    await expect(form.checkValidity(), "valid with files").toBe(true);

    // The picker's path: the input is given files and fires a change.
    const input = form.querySelector<HTMLInputElement>('input[type="file"]')!;
    const picked = transferOf(real("c.txt"));
    input.files = picked.files;
    fireEvent.change(input);
    await waitFor(() => expect(docs().map((entry) => (entry as File).name)).toEqual(["a.txt", "b.txt", "c.txt"]));

    // Removing a file takes it out of the form as well.
    canvas.getByRole("button", { name: "Remove a.txt" }).click();
    await waitFor(() => expect(docs().map((entry) => (entry as File).name)).toEqual(["b.txt", "c.txt"]));
    canvas.getByRole("button", { name: "Remove b.txt" }).click();
    canvas.getByRole("button", { name: "Remove c.txt" }).click();
    await waitFor(() => {
      const control = form.querySelector<HTMLInputElement>('input[type="file"]')!;
      expect(
        form.checkValidity(),
        `invalid again once emptied: files=${control.files?.length} items=${canvas.queryAllByRole("listitem").length} missing=${control.validity.valueMissing} custom=${control.validity.customError} required=${control.required} disabled=${control.disabled}`,
      ).toBe(false);
    });
  },
};

export const InvalidFormFocusesTheButton: Story = {
  name: "A refused submit lands focus on the button, never on the hidden input",
  render: () =>
    frame(
      <form aria-label="Upload" data-testid="form">
        <FileUpload aria-label="Documents" name="docs" required />
        <button type="submit">Send</button>
      </form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    form.requestSubmit();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Choose files" })).toHaveFocus());
  },
};

export const DragLook: Story = {
  name: "Dragging changes the drop area's look, and its resting edge clears 3:1",
  render: () => frame(<FileUpload aria-label="Documents" />),
  play: async ({ canvasElement }) => {
    const area = areaOf(canvasElement);
    const rest = getComputedStyle(area);
    await expect(rest.borderTopStyle).toBe("dashed");
    const surface = getComputedStyle(document.body).getPropertyValue("--dbm-bg-surface") || "white";
    // The edge is what tells a person where to drop: it must clear the 3:1 non-text floor on the surface.
    await expect(contrast(rest.borderTopColor, surface.trim() || "white")).toBeGreaterThanOrEqual(3);
    const restBackground = rest.backgroundColor;
    const restBorder = rest.borderTopColor;

    dispatchDrag(area, "dragenter", transferOf(real("a.txt")));
    await waitFor(() => expect(area).toHaveAttribute("data-drag-active", "true"));
    await new Promise((resolve) => setTimeout(resolve, 300)); // the colours ease
    const dragging = getComputedStyle(area);
    await expect(dragging.backgroundColor).not.toBe(restBackground);
    await expect(dragging.borderTopColor).not.toBe(restBorder);
    await expect(within(area).getByText("Drop to add")).toBeInTheDocument();

    dispatchDrag(area, "dragleave", transferOf(real("a.txt")));
    await waitFor(() => expect(area).not.toHaveAttribute("data-drag-active"));
  },
};

export const ForcedColours: Story = {
  name: "Forced colours: a drag is a solid edge and an error a double one",
  render: () => frame(<FileUpload aria-label="Documents" hasError />),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const area = areaOf(canvasElement);
      await expect(getComputedStyle(area).borderTopStyle).toBe("double");
      dispatchDrag(area, "dragenter", transferOf(real("a.txt")));
      await waitFor(() => expect(getComputedStyle(area).borderTopStyle).toBe("solid"));
    } finally {
      await emulate("none");
    }
  },
};

const allSizes: FileUploadSize[] = ["xs", "sm", "md", "lg", "xl"];

export const TargetSizes: Story = {
  name: "Every button is at least 24 × 24 at every size",
  render: () =>
    frame(
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
        {allSizes.map((size) => (
          <FileUpload key={size} aria-label={`Size ${size}`} size={size} defaultValue={demoEntries()} onRetry={() => undefined} onCancel={() => undefined} />
        ))}
      </div>,
    ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons.length).toBeGreaterThan(20);
    for (const button of buttons) {
      const { width, height } = button.getBoundingClientRect();
      await expect(width, button.getAttribute("aria-label") ?? button.textContent ?? "").toBeGreaterThanOrEqual(24);
      await expect(height, button.getAttribute("aria-label") ?? button.textContent ?? "").toBeGreaterThanOrEqual(24);
    }
  },
};

export const OnAPhone: Story = {
  name: "On a phone, a long name is cut with an ellipsis and nothing overflows",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () =>
    frame(
      <div data-testid="phone">
        <FileUpload
          aria-label="Documents"
          defaultValue={[
            { id: "long", file: demoFile("a-very-long-file-name-that-would-not-fit-on-a-phone-screen-at-all-final-v7-reviewed.pdf", 120_000, "application/pdf"), status: "error", error: "The connection was lost while sending this file" },
          ]}
          onRetry={() => undefined}
        />
      </div>,
    ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(640);
    const phone = within(canvasElement).getByTestId("phone");
    const name = within(phone).getByText(/a-very-long-file-name/);
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(getComputedStyle(name).textOverflow).toBe("ellipsis");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The actions stay on screen beside the cut name.
    const remove = within(phone).getByRole("button", { name: /^Remove/ }).getBoundingClientRect();
    await expect(remove.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(remove.left).toBeGreaterThanOrEqual(0);
  },
};

export const RightToLeft: Story = {
  name: "Right-to-left: the icon leads on the right and the actions sit at the left",
  render: () =>
    frame(
      <div dir="rtl" data-testid="rtl">
        <FileUpload aria-label="Documents" defaultValue={[{ id: "a", file: demoFile("report.pdf", 1000, "application/pdf"), status: "idle" }]} />
      </div>,
    ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rtl");
    const name = within(root).getByText("report.pdf").getBoundingClientRect();
    const remove = within(root).getByRole("button", { name: "Remove report.pdf" }).getBoundingClientRect();
    await expect(remove.right).toBeLessThan(name.left + 1);
    const item = within(root).getByRole("listitem").getBoundingClientRect();
    await expect(remove.left - item.left).toBeLessThan(item.right - name.right);
  },
};

export const PageGuard: Story = {
  name: "guardPage keeps the browser from opening a file dropped outside the drop area",
  render: () => frame(<FileUpload aria-label="Documents" guardPage />),
  play: async () => {
    const outside = dispatchDrag(document.body, "drop", transferOf(real("a.txt")));
    await expect(outside.defaultPrevented).toBe(true);
    const text = new DataTransfer();
    text.setData("text/plain", "hello");
    await expect(dispatchDrag(document.body, "drop", text).defaultPrevented).toBe(false);
  },
};

const allVariants: FileUploadVariant[] = ["dashed", "outlined", "filled", "ghost"];

export const VariantLooks: Story = {
  name: "Each look draws its own edge and fill, and a drag draws over any of them",
  render: () =>
    frame(
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        {allVariants.map((variant) => (
          <FileUpload key={variant} aria-label={variant} variant={variant} size="xs" />
        ))}
      </div>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = (variant: FileUploadVariant) => areaOf(canvas.getByRole("group", { name: variant }));
    const look = (variant: FileUploadVariant) => getComputedStyle(area(variant));
    const clear = "rgba(0, 0, 0, 0)";
    await expect(look("dashed").borderTopStyle).toBe("dashed");
    await expect(look("outlined").borderTopStyle).toBe("solid");
    await expect(look("outlined").borderTopColor).toBe(look("dashed").borderTopColor);
    await expect(look("filled").borderTopStyle).toBe("solid");
    await expect(look("filled").borderTopColor).not.toBe(look("dashed").borderTopColor);
    await expect(look("filled").backgroundColor).not.toBe(look("dashed").backgroundColor);
    // The ghost has neither fill nor edge at rest.
    await expect(look("ghost").borderTopColor).toBe(clear);
    await expect(look("ghost").backgroundColor).toBe(clear);
    // Every look keeps the same box, so a variant never moves what is around it.
    const heights = allVariants.map((variant) => area(variant).getBoundingClientRect().height);
    await expect(new Set(heights).size).toBe(1);
    // A drag gives the ghost an edge.
    dispatchDrag(area("ghost"), "dragenter", transferOf(real("a.txt")));
    await waitFor(() => expect(area("ghost")).toHaveAttribute("data-drag-active", "true"));
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(look("ghost").borderTopColor).not.toBe(clear);
  },
};

export const GhostInForcedColours: Story = {
  name: "Forced colours: the ghost's edge is the page's colour, not a drawn line",
  render: () => frame(<FileUpload aria-label="Ghost" variant="ghost" size="xs" />),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const area = areaOf(within(canvasElement).getByRole("group", { name: "Ghost" }));
      await expect(getComputedStyle(area).borderTopColor).toBe(`rgb(${rgbOf("Canvas").join(", ")})`);
    } finally {
      await emulate("none");
    }
  },
};

export const RealPreviews: Story = {
  name: "Previews draw the real picture at the size of the icon tile, only when asked for",
  render: () =>
    frame(
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <FileUpload aria-label="With" showPreviews layout="button" defaultValue={[{ id: "a", file: demoImage("sunset.svg", "#f59e0b", "#db2777"), status: "idle" }]} />
        <FileUpload aria-label="Without" layout="button" defaultValue={[{ id: "b", file: demoImage("lagoon.svg", "#06b6d4", "#4f46e5"), status: "idle" }]} />
      </div>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withPreviews = canvas.getByRole("group", { name: "With" });
    await waitFor(() => expect(withPreviews.querySelector("img")).not.toBeNull());
    const picture = withPreviews.querySelector("img") as HTMLImageElement;
    await waitFor(() => expect(picture.complete && picture.naturalWidth > 0).toBe(true));
    // The tile `Image` draws is square, at the size of the icon tile, and the picture fills it.
    const tile = picture.parentElement as HTMLElement;
    const box = tile.getBoundingClientRect();
    await expect(box.width).toBe(box.height);
    await expect(box.width).toBeGreaterThanOrEqual(32);
    await expect(picture.getBoundingClientRect().width).toBeGreaterThan(box.width - 4);
    await expect(canvas.getByRole("group", { name: "Without" }).querySelector("img")).toBeNull();
  },
};

export const HoverFill: Story = {
  name: "Hovering the drop area fills it with the brand tint (read from the stylesheet, since synthetic events never match :hover)",
  render: () => frame(<FileUpload aria-label="Hover" />),
  play: async () => {
    // Pointer events dispatched by a script never match `:hover`, so the rule itself is read from the page's stylesheets.
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        // A stylesheet from another origin can't be read; none of this component's are.
        return [];
      }
    }) as CSSStyleRule[];
    const hover = rules.find((rule) => /dropzone/.test(rule.selectorText ?? "") && /:hover/.test(rule.selectorText ?? "") && /not\(/.test(rule.selectorText ?? ""));
    await expect(hover, "the :hover rule for the drop area").toBeDefined();
    await expect(hover?.style.backgroundColor).toBe("var(--dbm-bg-brand-subtle)");
    // A disabled area is left out of it.
    await expect(hover?.selectorText).toMatch(/:not\(\.?_?disabled|:not\([^)]*disabled/);
  },
};

export const RealPaste: Story = {
  name: "A paste of real clipboard files, with the button focused, adds them",
  render: () => frame(<FileUpload aria-label="Paste" />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Choose files" });
    button.focus();
    const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transferOf(real("pasted.png", "x", "image/png")) });
    button.dispatchEvent(event);
    await waitFor(() => expect(canvas.getByRole("list", { name: "Selected files" })).toHaveTextContent("pasted.png"));
    await expect(event.defaultPrevented).toBe(true);
    // A paste with only text is left to the browser.
    const text = new DataTransfer();
    text.setData("text/plain", "hello");
    const plain = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: text });
    button.dispatchEvent(plain);
    await expect(plain.defaultPrevented).toBe(false);
  },
};
