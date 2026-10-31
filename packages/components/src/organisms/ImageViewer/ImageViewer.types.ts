import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, KeyboardEvent, ReactElement, ReactNode, Ref, RefObject } from "react";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";

/** One image in the viewer. */
export interface ImageViewerImage {
  /**
   * A stable identity for the image, used as the React key. Falls back to `src`, so give one when the same file
   * appears twice in the list.
   */
  id?: string;
  /** The image's address. */
  src: string;
  /**
   * What the image shows, read out when it comes into view. Required: pass `""` only for an image that is purely
   * decoration, which then announces nothing.
   */
  alt: string;
  /** Responsive candidates, matching the native `srcset` attribute. */
  srcSet?: string;
  /** Paired with `srcSet`: the width the image is drawn at, matching the native `sizes` attribute. */
  sizes?: string;
  /**
   * A smaller picture of the same image for the thumbnail strip. Falls back to `src`, which loads the full image for
   * every thumbnail, so give a small one when the list is long.
   */
  thumbnail?: string;
  /** Text shown under the image, for example a title or a credit. */
  caption?: ReactNode;
  /**
   * The image's own width in pixels, if known. With `height` it lets the image be fitted to the screen before it has
   * loaded; once it loads, its real size is used.
   */
  width?: number;
  /** The image's own height in pixels, if known. See `width`. */
  height?: number;
}

/**
 * What opened or closed the viewer, given as the second argument of `onOpenChange`.
 * - `"trigger"`: a click on the `trigger` element.
 * - `"escape"`: the Escape key.
 * - `"outside"`: a press on the scrim, outside the image and its controls.
 * - `"close-button"`: the close button in the toolbar.
 * - `"swipe"`: a downward swipe on a touch screen.
 * - `"history"`: the browser's Back button, with `closeOnHistoryBack`.
 * - `"controller"`: code, through `controllerRef` or `useImageViewerController()`.
 */
export type ImageViewerOpenChangeReason = "trigger" | "escape" | "outside" | "close-button" | "swipe" | "history" | "controller";

/** Settings for a slideshow, the object form of `autoPlay`. */
export interface ImageViewerAutoPlay {
  /**
   * How long each image stays, in milliseconds, once it has loaded.
   * @default 4000
   */
  interval?: number;
}

/** The second argument of `onOpenChange`. */
export interface ImageViewerOpenChangeDetails {
  /** What caused the change — see {@link ImageViewerOpenChangeReason}. */
  reason: ImageViewerOpenChangeReason;
}

/** Whether the toolbar's zoom, rotate and full screen buttons and the arrows beside the image are drawn. */
export type ImageViewerControls = "auto" | "hidden";

/**
 * The controls `controllerRef` and {@link useImageViewerController} hand to code outside the viewer, such as a button
 * of your own. Each asks for a change the way the viewer's own control does — through `onOpenChange` and
 * `onValueChange` when they are controlled, by moving itself when they are not — and says whether it had anything to
 * do. The object is the same for the viewer's life, and its methods read the latest state.
 */
export interface ImageViewerController {
  /** Whether the viewer is open. */
  readonly isOpen: boolean;
  /** The index of the image in view. */
  readonly value: number;
  /** How many images there are. */
  readonly count: number;
  /** The zoom of the image in view relative to the fitted image (1 is all of it in view), or 1 while closed. */
  readonly zoom: number;
  /** Whether the slideshow is running. */
  readonly isPlaying: boolean;
  /** Opens the viewer, at `index` when given. Returns `false` when it is already open at that image. */
  open: (index?: number) => boolean;
  /** Closes the viewer. */
  close: () => boolean;
  /** Asks for the next image (the first again from the last, with `loop`). */
  next: () => boolean;
  /** Asks for the previous image (the last again from the first, with `loop`). */
  previous: () => boolean;
  /** Asks for the image at this index, unless it is the current one or out of range. */
  goTo: (index: number) => boolean;
  /** Zooms in by one step. `false` at the largest zoom, or when no image is open. */
  zoomIn: () => boolean;
  /** Zooms out by one step. `false` at the smallest zoom, or when no image is open. */
  zoomOut: () => boolean;
  /** Fits the whole image back in view. `false` when it already is. */
  resetZoom: () => boolean;
  /** Zooms to one image pixel per screen pixel, or back to the fitted size when already there. `false` for an image no larger than the stage. */
  actualSize: () => boolean;
  /** Turns the image by `degrees` (a multiple of 90, clockwise when positive; 90 by default). */
  rotate: (degrees?: number) => boolean;
  /** Mirrors the image left to right (`"horizontal"`, the default) or top to bottom (`"vertical"`). */
  flip: (axis?: "horizontal" | "vertical") => boolean;
  /** Starts the slideshow. `false` when it is already running, there is nothing to step to, or no image is open. */
  play: () => boolean;
  /** Stops the slideshow. */
  pause: () => boolean;
  /** Enters or leaves full screen. `false` where the browser has no full screen. */
  toggleFullscreen: () => boolean;
}

/**
 * The text `ImageViewer` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs
 * numbers is a function of the plain numbers, written with `formatNumber`.
 */
export interface ImageViewerLabels {
  /** The accessible name of the viewer. @default 'Image viewer' */
  viewer: string;
  /** The accessible name of the close button. @default 'Close' */
  close: string;
  /** The accessible name of the previous button. @default 'Previous image' */
  previous: string;
  /** The accessible name of the next button. @default 'Next image' */
  next: string;
  /** The accessible name of the zoom in button. @default 'Zoom in' */
  zoomIn: string;
  /** The accessible name of the zoom out button. @default 'Zoom out' */
  zoomOut: string;
  /**
   * The accessible name of the button that shows the zoom and fits the image back in view, given the zoom as the text
   * it shows. It must contain that text. The zoom is the share of the image's own pixels drawn (100% is one image pixel
   * per screen pixel). @default (zoom) => `Reset zoom, ${zoom}`
   */
  resetZoom: (zoom: string) => string;
  /** The accessible name of the actual size button, which shows "1:1" and must contain it. @default 'Actual size, 1:1' */
  actualSize: string;
  /** The accessible name of the rotate button. @default 'Rotate clockwise' */
  rotate: string;
  /** The accessible name of the button that turns the image the other way. @default 'Rotate counterclockwise' */
  rotateCounterclockwise: string;
  /** The accessible name of the button that mirrors the image left to right. @default 'Flip horizontally' */
  flipHorizontal: string;
  /** The accessible name of the button that starts the slideshow. @default 'Start slideshow' */
  play: string;
  /** The accessible name of the button that stops the slideshow. @default 'Pause slideshow' */
  pause: string;
  /** The accessible name of the button that asks for a failed image again; it shows the same text. @default 'Try again' */
  retry: string;
  /** The accessible name of the button that enters full screen. @default 'Enter full screen' */
  enterFullscreen: string;
  /** The accessible name of the button that leaves full screen. @default 'Exit full screen' */
  exitFullscreen: string;
  /** The accessible name of the strip of thumbnails. @default 'Thumbnails' */
  thumbnails: string;
  /** The accessible name of one thumbnail, given its place and the number of images. @default (n, total) => `Show image ${n} of ${total}` (through `formatNumber`) */
  thumbnail: (position: number, total: number) => string;
  /** The place shown beside the toolbar, given the place of the image and the number of images. @default (n, total) => `${n} / ${total}` (through `formatNumber`) */
  position: (position: number, total: number) => string;
  /**
   * The message announced when the image in view changes, given its place, the number of images and its `alt`.
   * @default 'Image 3 of 8: the alt text' (through `formatNumber`)
   */
  announcement: (position: number, total: number, alt: string) => string;
  /** What is shown while an image loads. @default 'Loading image' */
  loading: string;
  /** What is shown in place of an image that could not be loaded. @default 'This image could not be loaded.' */
  failed: string;
}

export interface ImageViewerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "defaultValue" | "onChange" | "onKeyDown" | "dir" | "title"> {
  /**
   * The images, in order. With one image the viewer draws no arrows, counter or thumbnails. An empty list draws
   * nothing and logs a development warning.
   */
  images: ImageViewerImage[];
  /** An element that opens the viewer when pressed (a thumbnail, a button), rendered in place and wired up for you. Without one, open it with `open`, `defaultOpen` or `controllerRef`. */
  trigger?: ReactElement;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the viewer manage its own. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled use — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes. The second argument says what caused it, so a viewer shown from
   * state can be closed by the same reasons it opens by.
   */
  onOpenChange?: (open: boolean, details: ImageViewerOpenChangeDetails) => void;
  /** Called with `true` once the viewer has finished opening and with `false` once it has finished closing and is out of the page. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** The index of the image in view (controlled). A press on a control asks through `onValueChange`; the image changes when this does. */
  value?: number;
  /**
   * The index of the first image in view, for uncontrolled use — ignored once `value` is provided.
   * @default 0
   */
  defaultValue?: number;
  /** Called with the index the person asked for: an arrow, a key, a swipe, a thumbnail, or code. */
  onValueChange?: (value: number) => void;
  /**
   * Whether the arrows and keys go on from the last image to the first and back.
   * @default false
   */
  loop?: boolean;
  /**
   * The smallest zoom, relative to the fitted image. Below 1 would shrink the image inside the screen, which
   * has no use, so 1 is the floor.
   * @default 1
   */
  minZoom?: number;
  /**
   * The largest zoom, relative to the fitted image.
   * @default 4
   */
  maxZoom?: number;
  /**
   * How much a zoom button, `+` or `-` changes the zoom, as a factor.
   * @default 1.5
   */
  zoomStep?: number;
  /**
   * Whether a double click or a double tap zooms in on the point and zooms back out. The wheel and a pinch zoom
   * whatever this is.
   * @default true
   */
  doubleClickZoom?: boolean;
  /**
   * Shows rotate buttons in the toolbar. The image turns a quarter turn at a time; `r` turns it clockwise and `Shift+R`
   * the other way.
   * @default true
   */
  rotatable?: boolean;
  /**
   * Shows a button that mirrors the image left to right, and turns on `h` and `v` (top to bottom) from the keyboard.
   * @default false
   */
  flippable?: boolean;
  /**
   * Shows a full screen button in the toolbar, where the browser supports it. `f` does the same from the keyboard.
   * @default true
   */
  fullscreenButton?: boolean;
  /**
   * Shows a strip of thumbnails under the image, one tab stop with the current image marked. Has no effect with one image.
   * @default false
   */
  thumbnails?: boolean;
  /**
   * Shows the place (`3 / 12`) in the toolbar. `"auto"` shows it with more than one image.
   * @default 'auto'
   */
  showCounter?: boolean | "auto";
  /**
   * Shows each image's `caption` under it.
   * @default true
   */
  showCaptions?: boolean;
  /**
   * `"auto"` draws the toolbar's zoom, rotate and full screen buttons and the arrows beside the image. `"hidden"` draws
   * only the close button (and the counter, caption and thumbnails if they are on); the keys and gestures still work.
   * @default 'auto'
   */
  controls?: ImageViewerControls;
  /**
   * Makes a single tap or click on the image hide and show the controls, the counter, the caption and the thumbnails,
   * for an uncluttered view. A single tap is known once the wait for a second one has passed. A key (other than Escape)
   * shows them again.
   * @default false
   */
  tapToToggleControls?: boolean;
  /**
   * Makes the browser's Back button close the viewer instead of leaving the page, by adding a history entry while it is
   * open (and taking it away again when the viewer closes another way). Reported as `reason: "history"`. Has no effect
   * with `inline`.
   * @default false
   */
  closeOnHistoryBack?: boolean;
  /**
   * Steps through the images by itself: `true` for the default interval, or `{ interval }`. A pause button is always
   * drawn while it is on, whatever `controls` says. It starts paused under `prefers-reduced-motion`, waits for each image
   * to load, holds while an image is zoomed or the page is hidden, stops at the last image (or goes round with `loop`),
   * and is silent to a screen reader while it runs.
   * @default false
   */
  autoPlay?: boolean | ImageViewerAutoPlay;
  /**
   * Draws the viewer in the page, in the box you give it, instead of over it: no scrim, no close button, no focus trap,
   * and Escape and a swipe down do nothing. `trigger`, `open`, `defaultOpen`, `onOpenChange`, `container`, the scrim
   * props and `closeOnHistoryBack` are ignored. Give it a height (it fills its parent's height) and an `aria-label`. A plain wheel and a touch scroll the page past it until the image is zoomed; the control key (a trackpad pinch) zooms.
   * @default false
   */
  inline?: boolean;
  /**
   * Called with a placed element to ease the first image in from, as the viewer opens: usually the thumbnail that was
   * pressed. It is given the index in view and may return `null`. The image grows from that element's rectangle to its
   * own. Not used under `prefers-reduced-motion` or with `inline`.
   */
  getOrigin?: (index: number) => HTMLElement | null | undefined;
  /** Called when an image has loaded, with the image and its index. */
  onImageLoad?: (image: ImageViewerImage, index: number) => void;
  /** Called when an image could not be loaded, with the image and its index. The viewer shows its message and a button to try again. */
  onImageError?: (image: ImageViewerImage, index: number) => void;
  /** Called when the zoom of the image in view changes, relative to the fitted image (1 is all of it in view). */
  onZoomChange?: (zoom: number, index: number) => void;
  /** Called when the image in view is turned, with its turn in degrees (0, 90, 180 or 270). */
  onRotationChange?: (degrees: number, index: number) => void;
  /**
   * Whether a downward swipe on a touch screen closes the viewer while the whole image is in view.
   * @default true
   */
  swipeToDismiss?: boolean;
  /**
   * Whether a press outside the image and its controls (on the scrim) closes the viewer.
   * @default true
   */
  closeOnOutsideClick?: boolean;
  /**
   * Whether Escape closes the viewer. In full screen the first Escape leaves full screen, which the browser handles.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Content placed in the toolbar beside the viewer's own buttons: a download link, a share button. Use
   * `ImageViewerButton` for a button that is readable on the dark stage in every theme (the viewer does not restyle
   * anything else you put here: text and a link inherit white, but a `Button` or `IconButton` takes theme colours and
   * logs a development warning), and `useImageViewerController()` inside it to know which image is in view.
   */
  actions?: ReactNode;
  /**
   * How opaque the scrim behind the viewer is, from the opacity token scale. The stage is dark whatever the theme, so
   * the image and the white controls on it read the same in light and dark mode.
   * @default 90
   */
  scrimOpacity?: BackdropOpacity;
  /**
   * Blurs the page behind the scrim as well as dimming it.
   * @default false
   */
  scrimBlur?: boolean;
  /**
   * Called when focus moves into the viewer on open. Call `event.preventDefault()` inside to choose the element
   * to focus yourself; otherwise the viewer itself takes focus, so its keys work at once.
   */
  onOpenAutoFocus?: (event: Event) => void;
  /** Called when focus returns to what opened the viewer on close. Call `event.preventDefault()` to place it yourself. */
  onCloseAutoFocus?: (event: Event) => void;
  /** Called when Escape is pressed. Call `event.preventDefault()` to keep the viewer open; see also `closeOnEscape`. */
  onEscapeKeyDown?: (event: globalThis.KeyboardEvent) => void;
  /** Called when something outside the viewer is pressed, such as a layer portaled out of `actions`. The viewer never closes for it. */
  onInteractOutside?: (event: Event) => void;
  /**
   * Called on a key pressed inside the viewer, before the viewer's own handling. Call `event.preventDefault()` to stop the
   * viewer acting on the key (an arrow, `+`, `r`, and so on).
   */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** An element to focus when the viewer opens, instead of the viewer itself (which keeps the keys working at once). */
  initialFocus?: RefObject<HTMLElement | null>;
  /** The reading direction. It mirrors the arrows and the arrow keys, and is passed to the viewer, not read from the page. @default 'ltr' */
  dir?: "ltr" | "rtl";
  /** Renders the viewer into a different DOM node than `document.body`, to keep an embedded demo inside its own box. */
  container?: HTMLElement | null;
  /** The text the component supplies itself, each part replaceable — see {@link ImageViewerLabels}. */
  labels?: Partial<ImageViewerLabels>;
  /**
   * Writes the numbers the viewer shows (the place, the zoom) in your own digits. Callbacks keep plain numbers.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /** Hands code outside the viewer its controls — see {@link ImageViewerController}. The object never changes. */
  controllerRef?: Ref<ImageViewerController>;
  /** Standard DOM id, applied to the viewer's panel. */
  id?: string;
  /** Additional CSS classes, applied to the viewer's panel. */
  className?: string;
  /** Inline styles, merged onto the viewer's panel. */
  style?: CSSProperties;
  /** Test identifier, applied to the viewer's panel. */
  "data-testid"?: string;
  /** Overrides the accessible name from `labels.viewer`. */
  "aria-label"?: string;
  /** The id of an element that names the viewer, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The ids of elements that describe the viewer, in addition to the caption of the image in view, which is always included. */
  "aria-describedby"?: string;
}

export interface ImageViewerButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label" | "disabled" | "type"> {
  /** The accessible name. When the button shows text of its own (`children`), the name must contain that text. */
  label: string;
  /** The Phosphor icon to draw, as a component reference. Makes a round, icon-only button; leave it out and pass `children` for a pill. */
  icon?: PhosphorIcon;
  /** Text shown in place of the icon. */
  children?: ReactNode;
  /**
   * Dims the button and ignores a press, but leaves it focusable (`aria-disabled`), so a press that turns it off keeps
   * the person's place.
   * @default false
   */
  unavailable?: boolean;
  /** Mirrors the icon in a right-to-left viewer, for an arrow that points toward the start or the end. @default false */
  mirrored?: boolean;
  /** Called when the button is pressed, unless it is `unavailable`. */
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing, rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}
