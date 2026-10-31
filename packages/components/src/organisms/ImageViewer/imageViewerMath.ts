/** The pure geometry of the viewer's stage: no DOM, so it is tested on its own. */

export interface Size {
  width: number;
  height: number;
}

export interface View {
  /** The zoom relative to the fitted image: 1 is the whole image in view. */
  scale: number;
  /** How far the image is moved from the centre of the stage, in pixels. */
  x: number;
  y: number;
}

/** Whether a rotation in degrees turns the image on its side. */
export function isSideways(rotation: number): boolean {
  return Math.abs(Math.round(rotation / 90)) % 2 === 1;
}

/**
 * The size the image is laid out at when it fits the stage: all of it in view, never drawn larger than its own pixels
 * (a small image is not blurred to fill the stage; zoom does that). A rotation by a quarter turn fits the turned image.
 */
export function fitSize(natural: Size, stage: Size, rotation: number): Size {
  if (natural.width <= 0 || natural.height <= 0 || stage.width <= 0 || stage.height <= 0) return { width: 0, height: 0 };
  const turned = isSideways(rotation) ? { width: natural.height, height: natural.width } : natural;
  const ratio = Math.min(1, stage.width / turned.width, stage.height / turned.height);
  return { width: natural.width * ratio, height: natural.height * ratio };
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** How far the image may be moved from the centre in each axis at this scale: none while it is smaller than the stage. */
export function panLimits(fitted: Size, stage: Size, scale: number, rotation: number): { x: number; y: number } {
  const shown = isSideways(rotation) ? { width: fitted.height, height: fitted.width } : fitted;
  return {
    x: Math.max(0, (shown.width * scale - stage.width) / 2),
    y: Math.max(0, (shown.height * scale - stage.height) / 2),
  };
}

/** Keeps a view inside the stage: the zoom within its bounds and the image not moved further than its edges allow. */
export function clampView(view: View, fitted: Size, stage: Size, rotation: number, minimum: number, maximum: number): View {
  const scale = clamp(view.scale, minimum, maximum);
  const limit = panLimits(fitted, stage, scale, rotation);
  return { scale, x: clamp(view.x, -limit.x, limit.x), y: clamp(view.y, -limit.y, limit.y) };
}

/**
 * The view after zooming to `nextScale` while the point (`pointX`, `pointY`), measured from the centre of the stage,
 * stays under the same part of the image: what a wheel, a pinch and a double tap all do.
 */
export function zoomAt(view: View, nextScale: number, pointX: number, pointY: number): View {
  if (view.scale <= 0) return view;
  const ratio = nextScale / view.scale;
  return { scale: nextScale, x: pointX - (pointX - view.x) * ratio, y: pointY - (pointY - view.y) * ratio };
}

/** The next zoom for a button: a step up or down, landing exactly on 1 when it comes within a hair of it. */
export function stepScale(scale: number, direction: 1 | -1, step: number, minimum: number, maximum: number): number {
  const next = direction === 1 ? scale * step : scale / step;
  const snapped = Math.abs(next - 1) < 0.01 ? 1 : next;
  return clamp(snapped, minimum, maximum);
}

/** The factor a wheel turn zooms by: a trackpad pinch arrives as a wheel with the control key down, and is much finer. */
export function wheelFactor(deltaY: number, deltaMode: number, pinch: boolean): number {
  const lines = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  return Math.exp(-lines * (pinch ? 0.01 : 0.0022));
}

/** A rotation in whole quarter turns, kept to a single turn so the number never grows without end. */
export function turn(rotation: number, by: number): number {
  const next = (rotation + by) % 360;
  return next < 0 ? next + 360 : next;
}

/** The position of an index inside the list, wrapping when it loops and otherwise `null` past either end. */
export function neighbour(index: number, offset: number, count: number, loop: boolean): number | null {
  if (count <= 0) return null;
  const target = index + offset;
  if (target >= 0 && target < count) return target;
  if (!loop || count < 2) return null;
  return ((target % count) + count) % count;
}

/** The most a drag may pull an image past an edge, in pixels. */
export const RESIST_MAX = 64;

/**
 * A pan with some give: past an edge the image follows the finger a shorter and shorter way, up to `RESIST_MAX`, so a drag
 * against the edge is felt rather than stopped dead. Released, the view is clamped back inside.
 */
export function rubberBand(value: number, limit: number): number {
  const over = Math.abs(value) - limit;
  if (over <= 0) return value;
  return Math.sign(value) * (limit + RESIST_MAX * (1 - Math.exp(-over / (RESIST_MAX * 2))));
}

/** The scale at which one pixel of the image is one pixel on screen, given the ratio the fitted image is drawn at. */
export function actualScale(fitRatio: number): number {
  return fitRatio > 0 ? 1 / fitRatio : 1;
}
