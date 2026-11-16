// What the home page's "Accessible and responsive" demo reports about the control that has focus: its name, role, text contrast, the
// contrast of its focus ring, and its target size. All of it is measured in the reader's own browser, from the control's computed
// styles and the document's accessible-name sources, not typed in (so it shows a shortfall as readily as a pass).

export interface ControlReport {
  name: string;
  role: string;
  /** Text colour against what is behind it, or `undefined` when the control has no text of its own to measure. */
  textContrast?: number;
  /** The focus ring against what is behind the control, or `undefined` when no ring was found. */
  ringContrast?: number;
  width: number;
  height: number;
}

type Rgba = [number, number, number, number];

let canvas: CanvasRenderingContext2D | null = null;

/** Any CSS colour (including the `oklch()` the tokens are written in) as sRGB, by letting the browser paint it. */
function toRgba(color: string): Rgba {
  if (!canvas) canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!canvas) return [0, 0, 0, 0];
  canvas.canvas.width = 1;
  canvas.canvas.height = 1;
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = "#000";
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  const data = canvas.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
}

const over = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  const mix = (a: number, b: number) => (a * top[3] + b * bottom[3] * (1 - top[3])) / alpha;
  return [mix(top[0], bottom[0]), mix(top[1], bottom[1]), mix(top[2], bottom[2]), alpha];
};

/** What is painted behind an element: its own background and each ancestor's, composited, over the page's canvas. */
function backgroundOf(element: Element): Rgba {
  const layers: Rgba[] = [];
  const view = element.ownerDocument.defaultView ?? window;
  for (let node: Element | null = element; node; node = node.parentElement) {
    const layer = toRgba(view.getComputedStyle(node).backgroundColor);
    if (layer[3] > 0) layers.push(layer);
    if (layer[3] === 1) break;
  }
  return layers.reduceRight((below, layer) => over(layer, below), [255, 255, 255, 1] as Rgba);
}

const channel = (value: number) => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (color: Rgba) => 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);

/** The WCAG contrast ratio of a foreground over a background. */
function ratio(foreground: Rgba, background: Rgba): number {
  const front = over(foreground, background);
  const a = luminance(front);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const IMPLICIT_ROLES: Record<string, string> = { button: "button", a: "link", select: "combobox", textarea: "textbox" };

function roleOf(element: Element): string {
  const explicit = element.getAttribute("role");
  if (explicit) return explicit;
  // `localName`, not `instanceof`: the element is usually in another window's document (the frame), where the page's own classes do not match.
  if (element.localName === "input") {
    const type = (element as HTMLInputElement).type;
    return type === "checkbox" ? "checkbox" : type === "radio" ? "radio" : "textbox";
  }
  return IMPLICIT_ROLES[element.localName] ?? element.localName;
}

/** The accessible name, from the sources in the order the specification reads them. */
function nameOf(element: Element): string {
  const doc = element.ownerDocument;
  const by = element.getAttribute("aria-labelledby");
  if (by) {
    const text = by
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }
  const label = element.getAttribute("aria-label");
  if (label) return label;
  const labels = (element as HTMLInputElement).labels;
  if (labels && labels.length > 0) return Array.from(labels, (item) => item.textContent?.trim() ?? "").join(" ");
  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text;
  return element.getAttribute("alt") ?? element.getAttribute("title") ?? "";
}

/** The ring colour: the outline's, or the first colour of a shadow that draws a ring on the control's own edge. */
function ringColour(style: CSSStyleDeclaration): string | undefined {
  if (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0) return style.outlineColor;
  const shadow = style.boxShadow;
  if (shadow && shadow !== "none") return /(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i.exec(shadow)?.[1];
  return undefined;
}

/**
 * The box a person sees as the control. A text field draws its border and its focus ring on a wrapper around the `<input>` (the input
 * itself is a bare line of text inside it), so when the wrapper carries the ring it is the control's box for the ring and the target.
 */
function visibleBox(element: Element): Element {
  const parent = element.parentElement;
  const own = ringColour(element.ownerDocument.defaultView?.getComputedStyle(element) ?? getComputedStyle(element));
  if (!own && parent && ringColour(parent.ownerDocument.defaultView?.getComputedStyle(parent) ?? getComputedStyle(parent))) return parent;
  return element;
}

/** Reports on a focused control, once its focus styles have been applied. */
export function report(element: Element): ControlReport {
  // The element's own window computes its styles (the frame's), as `getComputedStyle` on the page's window would not know its document.
  const view = element.ownerDocument.defaultView ?? window;
  const style = view.getComputedStyle(element);
  const outer = visibleBox(element);
  const box = outer.getBoundingClientRect();
  const hasText = (element.textContent ?? "").trim() !== "" || element.localName === "input";
  const ring = ringColour(view.getComputedStyle(outer));
  return {
    name: nameOf(element),
    role: roleOf(element),
    textContrast: hasText ? ratio(toRgba(style.color), backgroundOf(element)) : undefined,
    ringContrast: ring ? ratio(toRgba(ring), outer.parentElement ? backgroundOf(outer.parentElement) : backgroundOf(outer)) : undefined,
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
}
