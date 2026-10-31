import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CornersInIcon,
  CornersOutIcon,
  FlipHorizontalIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Children, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import { useIsClient } from "../../internal/overlay/useKeepMounted";
import { useReturnFocus } from "../../internal/overlay/useReturnFocus";
import styles from "./ImageViewer.module.css";
import type {
  ImageViewerController,
  ImageViewerLabels,
  ImageViewerOpenChangeReason,
  ImageViewerProps,
} from "./ImageViewer.types";
import { neighbour, turn } from "./imageViewerMath";
import { ViewerButton, ImageViewerThumbnails } from "./ImageViewerParts";

export { ViewerButton as ImageViewerButton } from "./ImageViewerParts";
import { ImageViewerStage } from "./ImageViewerStage";
import type { ImageStatus } from "./ImageViewerStage";
import type { ImageZoomApi } from "./useImageZoom";

/** How far an arrow key moves a zoomed image, in pixels. */
const PAN_STEP = 80;
/** How long a slideshow image stays, in milliseconds, when no interval is given. */
const DEFAULT_INTERVAL = 4000;
/** How often a slideshow that is held (the image is zoomed, the page is hidden) looks again, in milliseconds. */
const HOLD_RECHECK = 500;

function buildDefaultLabels(formatNumber: (value: number) => string): ImageViewerLabels {
  return {
    viewer: "Image viewer",
    close: "Close",
    previous: "Previous image",
    next: "Next image",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: (zoom) => `Reset zoom, ${zoom}`,
    actualSize: "Actual size, 1:1",
    rotate: "Rotate clockwise",
    rotateCounterclockwise: "Rotate counterclockwise",
    flipHorizontal: "Flip horizontally",
    play: "Start slideshow",
    pause: "Pause slideshow",
    retry: "Try again",
    enterFullscreen: "Enter full screen",
    exitFullscreen: "Exit full screen",
    thumbnails: "Thumbnails",
    thumbnail: (position, total) => `Show image ${formatNumber(position)} of ${formatNumber(total)}`,
    position: (position, total) => `${formatNumber(position)} / ${formatNumber(total)}`,
    announcement: (position, total, alt) => `Image ${formatNumber(position)} of ${formatNumber(total)}${alt ? `: ${alt}` : ""}`,
    loading: "Loading image",
    failed: "This image could not be loaded.",
  };
}

const inertController: ImageViewerController = {
  isOpen: false,
  value: 0,
  count: 0,
  zoom: 1,
  isPlaying: false,
  open: () => false,
  close: () => false,
  next: () => false,
  previous: () => false,
  goTo: () => false,
  zoomIn: () => false,
  zoomOut: () => false,
  resetZoom: () => false,
  actualSize: () => false,
  rotate: () => false,
  flip: () => false,
  play: () => false,
  pause: () => false,
  toggleFullscreen: () => false,
};

/** The controller's methods with the state as of the last render, so a part in `actions` re-renders when it changes. */
const ControllerContext = createContext<ImageViewerController | null>(null);

/**
 * The controls of the nearest `ImageViewer`, for a part rendered inside it (its `actions`): the same object
 * `controllerRef` hands out. Outside a viewer it returns an object that does nothing and warns in development.
 *
 * @example
 * ```tsx
 * function DownloadLink({ files }: { files: string[] }) {
 *   const viewer = useImageViewerController();
 *   return <a href={files[viewer.value]} download>Download</a>;
 * }
 * ```
 */
export function useImageViewerController(): ImageViewerController {
  const controller = useContext(ControllerContext);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !controller) {
      console.warn("useImageViewerController: called outside an <ImageViewer>, so it controls nothing. Call it from a component rendered in the viewer's `actions`.");
    }
  }, [controller]);
  return controller ?? inertController;
}

// Buttons whose colours follow the theme, which on a stage that is dark in every theme are dark on dark in a light theme.
const themedButtons = new Set(["Button", "IconButton", "CloseButton"]);

/** The name of the first direct child of `actions` that is a themed button, if any (read from its `displayName`, so no import). */
function themedButtonIn(actions: ReactNode): string | null {
  for (const child of Children.toArray(actions)) {
    if (!isValidElement(child) || typeof child.type === "string") continue;
    const name = (child.type as { displayName?: string }).displayName;
    if (name && themedButtons.has(name)) return name;
  }
  return null;
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.(reducedMotionQuery).matches === true;

/**
 * Whether the person prefers reduced motion, as a store so the server render and the first client render agree (the
 * server's answer is no, and a hydrating client is then updated to its own).
 */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = typeof window !== "undefined" ? window.matchMedia?.(reducedMotionQuery) : undefined;
      query?.addEventListener?.("change", notify);
      return () => query?.removeEventListener?.("change", notify);
    },
    prefersReducedMotion,
    () => false,
  );
}

/**
 * A full-screen viewer for one image or a set of them, often called a lightbox. It opens over the page on a dark
 * stage, fits the whole image in view, and lets the person zoom in (the wheel, a pinch, a double tap, the buttons or
 * `+`/`-`, and actual size with `1`), move around a zoomed image by dragging or with the arrow keys, turn and flip it, step
 * through the set (the arrows, the arrow keys, a swipe, or a strip of thumbnails) and go full screen. Every gesture has a
 * button or a key, so nothing needs a touch screen or a mouse.
 *
 * Built on Radix Dialog, so it is **modal**: the page behind can't be scrolled or reached, focus is held inside, and
 * it returns to whatever opened the viewer. It is driven by data: pass `images`, and open it with a `trigger`, with
 * `open`/`defaultOpen`, or from code with `controllerRef`. `value` is the index of the image in view, controlled with
 * `value`/`onValueChange` or left to the viewer with `defaultValue`. Optionally it can close on the browser's Back button
 * (`closeOnHistoryBack`), ease the first image in from the thumbnail that was pressed (`getOrigin`), hide its controls on
 * a tap (`tapToToggleControls`), and step through the images by itself with a pause button (`autoPlay`). With `inline`
 * it is drawn in the page, in the box you give it, with no scrim, close button or focus trap.
 *
 * It draws one image at a time, with its neighbours loading in the background and the thumbnail of the one loading
 * standing in for it. For a row of slides shown in the page, use `Carousel`; for any other content in a window, use
 * `Dialog`. It does not fetch, upload or download anything: put a button in `actions` (an `ImageViewerButton`).
 *
 * @example
 * ```tsx
 * <ImageViewer
 *   trigger={<Button>View photos</Button>}
 *   thumbnails
 *   images={[
 *     { src: "/photos/harbour.jpg", alt: "Boats in the harbour at dawn", caption: "Harbour, 6:10 am" },
 *     { src: "/photos/market.jpg", alt: "A fruit stall at the market" },
 *   ]}
 * />
 * ```
 */
export const ImageViewer = forwardRef<HTMLDivElement, ImageViewerProps>(
  (
    {
      images,
      trigger,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onOpenChangeComplete,
      value: valueProp,
      defaultValue = 0,
      onValueChange,
      loop = false,
      minZoom = 1,
      maxZoom = 4,
      zoomStep = 1.5,
      doubleClickZoom = true,
      rotatable = true,
      flippable = false,
      fullscreenButton = true,
      thumbnails = false,
      showCounter = "auto",
      showCaptions = true,
      controls = "auto",
      tapToToggleControls = false,
      closeOnHistoryBack = false,
      autoPlay = false,
      inline = false,
      getOrigin,
      onImageLoad,
      onImageError,
      onZoomChange,
      onRotationChange,
      swipeToDismiss = true,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      actions,
      scrimOpacity = 90,
      scrimBlur = false,
      initialFocus,
      dir = "ltr",
      container,
      labels: labelOverrides,
      formatNumber = String,
      controllerRef,
      className,
      style,
      onKeyDown,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onInteractOutside,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    }: ImageViewerProps,
    ref,
  ) => {
    const labels = useMemo(() => mergeDefined(buildDefaultLabels(formatNumber), labelOverrides), [formatNumber, labelOverrides]);
    const count = images.length;

    // --- Open state. The reason a change was asked for is noted just before Radix reports the change. An inline viewer
    // is always open.
    const controlledOpen = !inline && openProp !== undefined ? openProp : undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const open = inline || (controlledOpen ?? innerOpen);
    const reasonRef = useRef<ImageViewerOpenChangeReason | null>(null);

    // --- The image in view. A press asks through `onValueChange`; the image changes when the value does.
    const isValueControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = useState(defaultValue);
    const rawValue = isValueControlled ? valueProp : innerValue;
    const index = count === 0 ? 0 : Math.min(count - 1, Math.max(0, Math.trunc(Number.isFinite(rawValue) ? rawValue : 0)));
    const image = images[index];
    const imageKey = image ? `${index}:${image.id ?? image.src}` : "none";

    // What the stage reports, and the person's choices about the image in view, are kept with the image they were made
    // for, so a new image starts fresh.
    const [zoomState, setZoomState] = useState({ key: imageKey, zoom: 1 });
    const zoom = zoomState.key === imageKey ? zoomState.zoom : 1;
    const [fitState, setFitState] = useState({ key: imageKey, fit: 1 });
    const fit = fitState.key === imageKey ? fitState.fit : 1;
    const [statusState, setStatusState] = useState<{ key: string; status: ImageStatus }>({ key: imageKey, status: "loading" });
    const status: ImageStatus = statusState.key === imageKey ? statusState.status : "loading";
    const [rotationState, setRotationState] = useState({ key: imageKey, degrees: 0 });
    const rotation = rotationState.key === imageKey ? rotationState.degrees : 0;
    const [flipState, setFlipState] = useState({ key: imageKey, x: false, y: false });
    const flipX = flipState.key === imageKey && flipState.x;
    const flipY = flipState.key === imageKey && flipState.y;

    const autoPlayOn = autoPlay !== false && autoPlay !== undefined;
    const interval = typeof autoPlay === "object" && autoPlay.interval !== undefined ? Math.max(500, autoPlay.interval) : DEFAULT_INTERVAL;
    // The slideshow runs from the start when asked for, except for a person who prefers reduced motion; once they use its
    // button, what they chose stands until the viewer is opened again.
    const reducedMotion = useReducedMotion();
    const [chosenPlaying, setChosenPlaying] = useState<boolean | null>(null);
    const playing = chosenPlaying ?? (autoPlayOn && !reducedMotion);
    const [chromeHidden, setChromeHidden] = useState(false);
    const [direction, setDirection] = useState<"next" | "previous" | null>(null);

    // Opening starts everything afresh: the slideshow as asked for, the controls showing, no direction to come from.
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
      setWasOpen(open);
      setChosenPlaying(null);
      setChromeHidden(false);
      setDirection(null);
    }

    // Everything the controller and the keys read is the latest render's.
    const latest = useRef({
      open, controlledOpen, onOpenChange, index, count, isValueControlled, onValueChange, loop, imageKey, zoom, rotation, status, playing,
      image, getOrigin, inline, onImageLoad, onImageError, onZoomChange, onRotationChange,
    });
    useEffect(() => {
      latest.current = {
        open, controlledOpen, onOpenChange, index, count, isValueControlled, onValueChange, loop, imageKey, zoom, rotation, status, playing,
        image, getOrigin, inline, onImageLoad, onImageError, onZoomChange, onRotationChange,
      };
    });

    const changeOpen = useCallback((next: boolean, reason: ImageViewerOpenChangeReason) => {
      const current = latest.current;
      if (current.inline || next === current.open) return false;
      if (current.controlledOpen === undefined) {
        // Held here too, so a second call before the next render sees the change the first made.
        current.open = next;
        setInnerOpen(next);
      }
      current.onOpenChange?.(next, { reason });
      return true;
    }, []);
    const changeValue = useCallback((next: number, toward?: "next" | "previous") => {
      const current = latest.current;
      if (next === current.index || next < 0 || next >= current.count) return false;
      setDirection(toward ?? (next > current.index ? "next" : "previous"));
      if (!current.isValueControlled) {
        current.index = next;
        setInnerValue(next);
      }
      current.onValueChange?.(next);
      return true;
    }, []);
    const step = useCallback(
      (offset: number) => {
        const target = neighbour(latest.current.index, offset, latest.current.count, latest.current.loop);
        return target === null ? false : changeValue(target, offset > 0 ? "next" : "previous");
      },
      [changeValue],
    );

    const handleRadixOpenChange = useCallback(
      (next: boolean) => {
        const reason = reasonRef.current ?? (next ? "trigger" : "close-button");
        reasonRef.current = null;
        changeOpen(next, reason);
      },
      [changeOpen],
    );
    const closeFor = useCallback(
      (reason: ImageViewerOpenChangeReason) => {
        reasonRef.current = null;
        changeOpen(false, reason);
      },
      [changeOpen],
    );

    const handleZoomChange = useCallback(
      (next: number) => {
        setZoomState({ key: imageKey, zoom: next });
        latest.current.onZoomChange?.(next, latest.current.index);
      },
      [imageKey],
    );
    const handleStatusChange = useCallback((next: ImageStatus) => setStatusState({ key: imageKey, status: next }), [imageKey]);
    const handleFitChange = useCallback((next: number) => setFitState({ key: imageKey, fit: next }), [imageKey]);
    const handleLoaded = useCallback(() => {
      const current = latest.current;
      if (current.image) current.onImageLoad?.(current.image, current.index);
    }, []);
    const handleFailed = useCallback(() => {
      const current = latest.current;
      if (current.image) current.onImageError?.(current.image, current.index);
    }, []);

    const stageApi = useRef<ImageZoomApi | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const ready = status === "ready";

    const rotateBy = useCallback((degrees: number) => {
      const current = latest.current;
      if (current.status !== "ready") return false;
      const quarter = Math.round(degrees / 90) * 90;
      if (quarter === 0) return false;
      const next = turn(current.rotation, quarter);
      setRotationState({ key: current.imageKey, degrees: next });
      current.onRotationChange?.(next, current.index);
      return true;
    }, []);
    const flipBy = useCallback((axis: "horizontal" | "vertical") => {
      const current = latest.current;
      if (current.status !== "ready") return false;
      setFlipState((previous) => {
        const base = previous.key === current.imageKey ? previous : { key: current.imageKey, x: false, y: false };
        return axis === "horizontal" ? { ...base, x: !base.x } : { ...base, y: !base.y };
      });
      return true;
    }, []);

    // --- The slideshow. It waits for each image to load, holds while an image is zoomed or the page is hidden, and
    // stops at the last image unless the viewer loops.
    const startPlaying = useCallback(() => {
      const current = latest.current;
      if (!current.open || current.playing || current.count < 2) return false;
      current.playing = true;
      setChosenPlaying(true);
      return true;
    }, []);
    const stopPlaying = useCallback(() => {
      const current = latest.current;
      if (!current.playing) return false;
      current.playing = false;
      setChosenPlaying(false);
      return true;
    }, []);
    useEffect(() => {
      if (!playing || !open || count < 2 || status !== "ready") return undefined;
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        if (document.hidden || latest.current.zoom > 1.001) {
          timer = setTimeout(tick, HOLD_RECHECK);
          return;
        }
        if (!step(1)) stopPlaying();
      };
      timer = setTimeout(tick, interval);
      return () => clearTimeout(timer);
    }, [playing, open, count, status, index, interval, step, stopPlaying]);

    // --- Full screen, where the browser has it. The panel is only drawn in the browser until it is inline, so the first
    // render waits for the client.
    const client = useIsClient();
    const fullscreenAvailable = client && document.fullscreenEnabled === true;
    const [fullscreen, setFullscreen] = useState(false);
    useEffect(() => {
      if (!open) return undefined;
      const sync = () => setFullscreen(document.fullscreenElement !== null && document.fullscreenElement === panelRef.current);
      const panel = panelRef.current;
      document.addEventListener("fullscreenchange", sync);
      return () => {
        document.removeEventListener("fullscreenchange", sync);
        // A viewer that closes in full screen leaves it, or the page would be stuck there.
        if (document.fullscreenElement && document.fullscreenElement === panel) {
          void document.exitFullscreen().catch((error: unknown) => {
            if (process.env.NODE_ENV !== "production") console.warn("ImageViewer: could not leave full screen.", error);
          });
        }
      };
    }, [open]);
    const toggleFullscreen = useCallback(() => {
      if (typeof document === "undefined" || !document.fullscreenEnabled) return false;
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch((error: unknown) => {
          if (process.env.NODE_ENV !== "production") console.warn("ImageViewer: could not leave full screen.", error);
        });
        return true;
      }
      const panel = panelRef.current;
      if (!panel) return false;
      void panel.requestFullscreen().catch((error: unknown) => {
        // The browser refuses outside a press or a key; the viewer carries on as it was.
        if (process.env.NODE_ENV !== "production") console.warn("ImageViewer: full screen was refused.", error);
      });
      return true;
    }, []);

    // --- The browser's Back button. An entry is added while the viewer is open; a press on Back takes it off and closes the
    // viewer, and a viewer closed any other way takes its own entry off again.
    const historyEntry = useRef(false);
    const ignoredPops = useRef(0);
    // Counts the presses of Back, so an owner that kept a controlled viewer open gets a new entry for the next one.
    const [backs, setBacks] = useState(0);
    useEffect(() => {
      if (!open || inline || !closeOnHistoryBack) return undefined;
      if (!historyEntry.current) {
        window.history.pushState({ dbmImageViewer: true }, "");
        historyEntry.current = true;
      }
      const onPop = () => {
        if (ignoredPops.current > 0) {
          ignoredPops.current -= 1;
          return;
        }
        if (historyEntry.current) {
          historyEntry.current = false;
          changeOpen(false, "history");
          setBacks((count) => count + 1);
        }
      };
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }, [open, inline, closeOnHistoryBack, changeOpen, backs]);
    useEffect(() => {
      if (open || !historyEntry.current) return;
      historyEntry.current = false;
      ignoredPops.current += 1;
      window.history.back();
    }, [open]);
    // A viewer taken out of the page while it is open (its owner stopped drawing it) takes its entry off too, when the entry is
    // still the current one. After a navigation it is not, and going back would undo the navigation, so it is left. The check
    // waits a tick, so the remount `StrictMode` simulates in development is not taken for an unmount.
    const mounted = useRef(false);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
        setTimeout(() => {
          if (mounted.current || !historyEntry.current) return;
          historyEntry.current = false;
          if ((window.history.state as { dbmImageViewer?: boolean } | null)?.dbmImageViewer === true) window.history.back();
        }, 0);
      };
    }, []);

    // --- Where the first image eases in from, asked for once the image is drawn.
    const originUsed = useRef(false);
    useEffect(() => {
      if (!open) originUsed.current = false;
    }, [open]);
    const getOriginRect = useCallback(() => {
      const current = latest.current;
      if (originUsed.current || current.inline || !current.getOrigin || prefersReducedMotion()) return null;
      originUsed.current = true;
      const element = current.getOrigin(current.index);
      return element ? element.getBoundingClientRect() : null;
    }, []);

    // --- The controller.
    const controller = useMemo<ImageViewerController>(
      () => ({
        get isOpen() {
          return latest.current.open;
        },
        get value() {
          return latest.current.index;
        },
        get count() {
          return latest.current.count;
        },
        get zoom() {
          return latest.current.open ? (stageApi.current?.zoom() ?? 1) : 1;
        },
        get isPlaying() {
          return latest.current.playing;
        },
        open: (at) => {
          const target = at === undefined ? undefined : Math.trunc(at);
          const moved = target !== undefined ? changeValue(target) : false;
          return changeOpen(true, "controller") || moved;
        },
        close: () => changeOpen(false, "controller"),
        next: () => step(1),
        previous: () => step(-1),
        goTo: (at) => changeValue(Math.trunc(at)),
        zoomIn: () => stageApi.current?.zoomIn() ?? false,
        zoomOut: () => stageApi.current?.zoomOut() ?? false,
        resetZoom: () => stageApi.current?.reset() ?? false,
        actualSize: () => stageApi.current?.actualSize() ?? false,
        rotate: (degrees = 90) => rotateBy(degrees),
        flip: (axis = "horizontal") => flipBy(axis),
        play: startPlaying,
        pause: stopPlaying,
        toggleFullscreen,
      }),
      [changeOpen, changeValue, step, rotateBy, flipBy, startPlaying, stopPlaying, toggleFullscreen],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // The hook hands a part inside the viewer the same methods with a snapshot of the state, which changes as it does.
    const snapshot = useMemo<ImageViewerController>(
      () => ({ ...controller, isOpen: open, value: index, count, zoom, isPlaying: playing }),
      [controller, open, index, count, zoom, playing],
    );

    // --- Neighbours load in the background, so a step to them shows at once. Keyed by what they load, not by the array, so a
    // list written inline and made again on every render does not ask for them again.
    const preloadKey = [1, -1]
      .map((offset) => {
        const target = count < 2 ? null : neighbour(index, offset, count, loop);
        const next = target === null ? undefined : images[target];
        return next ? `${next.src}\n${next.srcSet ?? ""}` : "";
      })
      .join("\n\n");
    useEffect(() => {
      if (!open || !preloadKey.replace(/\s/g, "")) return undefined;
      const loaded: HTMLImageElement[] = [];
      for (const entry of preloadKey.split("\n\n")) {
        const [src, srcSet] = entry.split("\n");
        if (!src) continue;
        const element = new window.Image();
        if (srcSet) element.srcset = srcSet;
        element.src = src;
        loaded.push(element);
      }
      return () => {
        // Dropping the references lets the browser release what it decoded.
        loaded.length = 0;
      };
    }, [open, preloadKey]);

    // --- The announcement of a new image. Opening is not a change: the dialog announces itself. A running slideshow is
    // silent, so it does not read over the person.
    const { message, announce } = useAnnouncement();
    const lastIndex = useRef<number | null>(null);
    useEffect(() => {
      if (!open) {
        lastIndex.current = null;
        return;
      }
      if (!playing && lastIndex.current !== null && lastIndex.current !== index && image) {
        announce(labels.announcement(index + 1, count, image.alt));
      }
      lastIndex.current = index;
    }, [open, playing, index, image, count, labels, announce]);

    // --- Development warnings, each once however often a list written inline is made again.
    const warned = useRef(new Set<string>());
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      const warnOnce = (message: string) => {
        if (warned.current.has(message)) return;
        warned.current.add(message);
        console.warn(message);
      };
      if (count === 0) warnOnce("ImageViewer: `images` is empty, so there is nothing to show.");
      else if (images.some((entry) => typeof entry.alt !== "string")) {
        warnOnce("ImageViewer: every image needs an `alt` (pass \"\" for a purely decorative one).");
      }
    }, [count, images]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && inline && (trigger || openProp !== undefined || defaultOpen || closeOnHistoryBack)) {
        console.warn("ImageViewer: `trigger`, `open`, `defaultOpen` and `closeOnHistoryBack` do nothing with `inline`, which is always open.");
      }
    }, [inline, trigger, openProp, defaultOpen, closeOnHistoryBack]);

    const themedButton = themedButtonIn(actions);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && themedButton) {
        console.warn(
          `ImageViewer: \`actions\` holds a ${themedButton}, whose colours follow the theme, so in a light theme it is dark on the dark stage. Use ImageViewerButton, or style it for a dark background.`,
        );
      }
    }, [themedButton]);

    const returnFocus = useReturnFocus();
    const captionId = useId();
    const caption = showCaptions && image?.caption ? image.caption : null;
    const canNavigate = count > 1;
    const showControls = controls === "auto";
    const directionSign: 1 | -1 = dir === "rtl" ? -1 : 1;
    const counterShown = showCounter === true || (showCounter === "auto" && canNavigate);
    // The zoom is shown as the share of the image's own pixels that are drawn, so 100% is one image pixel per screen pixel.
    const actual = fit > 0 ? 1 / fit : 1;
    const largestZoom = Math.max(maxZoom, actual);
    const percent = Math.round(zoom * fit * 100);
    const zoomText = `${formatNumber(percent)}%`;
    const atActual = Math.abs(zoom - actual) < 0.005;
    const atStart = neighbour(index, -1, count, loop) === null;
    const atEnd = neighbour(index, 1, count, loop) === null;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      // A key pressed in something portaled out of the viewer (a menu in `actions`) reaches this handler through React, not
      // through the page, and is not the viewer's.
      if (!event.currentTarget.contains(event.target as Node)) return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return;
      // Any key but Escape brings back controls a tap has hidden.
      if (chromeHidden && event.key !== "Escape") setChromeHidden(false);
      const api = stageApi.current;
      const zoomed = latest.current.zoom > 1.001;
      let handled = true;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowLeft": {
          const forward = event.key === "ArrowRight";
          if (zoomed) api?.panBy(forward ? -PAN_STEP : PAN_STEP, 0);
          else step((forward ? 1 : -1) * directionSign);
          break;
        }
        case "ArrowUp":
        case "ArrowDown":
          if (zoomed) api?.panBy(0, event.key === "ArrowUp" ? PAN_STEP : -PAN_STEP);
          else handled = false;
          break;
        case "PageDown":
          step(1);
          break;
        case "PageUp":
          step(-1);
          break;
        case "Home":
          changeValue(0);
          break;
        case "End":
          changeValue(count - 1);
          break;
        case "+":
        case "=":
          api?.zoomIn();
          break;
        case "-":
        case "_":
          api?.zoomOut();
          break;
        case "0":
          api?.reset();
          break;
        case "1":
          api?.actualSize();
          break;
        case "r":
          if (rotatable) rotateBy(90);
          else handled = false;
          break;
        case "R":
          if (rotatable) rotateBy(-90);
          else handled = false;
          break;
        case "h":
        case "H":
          if (flippable) flipBy("horizontal");
          else handled = false;
          break;
        case "v":
        case "V":
          if (flippable) flipBy("vertical");
          else handled = false;
          break;
        case "f":
        case "F":
          if (fullscreenButton && fullscreenAvailable) toggleFullscreen();
          else handled = false;
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
    };

    const hiddenTitle = ariaLabel ?? labels.viewer;
    // The caption describes the viewer, in addition to anything the consumer points at.
    const describedBy = [props["aria-describedby"], caption ? captionId : undefined].filter(Boolean).join(" ") || undefined;

    // What is inside the viewer, whether it is a dialog or drawn in the page.
    const inner = (
      <>
        <div className={styles.toolbar}>
          <div className={styles.toolbarStart}>
            {counterShown && count > 0 && (
              <span className={styles.counter}>
                {labels.position(index + 1, count)}
              </span>
            )}
          </div>
          <div className={styles.toolbarEnd}>
            {autoPlayOn && canNavigate && (
              <ViewerButton
                label={playing ? labels.pause : labels.play}
                icon={playing ? PauseIcon : PlayIcon}
                onClick={() => (playing ? stopPlaying() : startPlaying())}
              />
            )}
            {showControls && (
              <>
                <ViewerButton
                  label={labels.zoomOut}
                  icon={MagnifyingGlassMinusIcon}
                  aria-keyshortcuts="-"
                  unavailable={!ready || zoom <= minZoom}
                  onClick={() => stageApi.current?.zoomOut()}
                />
                <ViewerButton
                  label={labels.resetZoom(zoomText)}
                  aria-keyshortcuts="0"
                  unavailable={!ready || zoom === 1}
                  className={styles.zoomValue}
                  onClick={() => stageApi.current?.reset()}
                >
                  {zoomText}
                </ViewerButton>
                <ViewerButton
                  label={labels.zoomIn}
                  icon={MagnifyingGlassPlusIcon}
                  aria-keyshortcuts="+"
                  unavailable={!ready || zoom >= largestZoom}
                  onClick={() => stageApi.current?.zoomIn()}
                />
                <ViewerButton
                  label={labels.actualSize}
                  aria-keyshortcuts="1"
                  aria-pressed={atActual}
                  unavailable={!ready || actual <= 1.005}
                  onClick={() => stageApi.current?.actualSize()}
                >
                  1:1
                </ViewerButton>
                {rotatable && (
                  <>
                    <ViewerButton label={labels.rotateCounterclockwise} icon={ArrowCounterClockwiseIcon} aria-keyshortcuts="Shift+R" unavailable={!ready} onClick={() => rotateBy(-90)} />
                    <ViewerButton label={labels.rotate} icon={ArrowClockwiseIcon} aria-keyshortcuts="R" unavailable={!ready} onClick={() => rotateBy(90)} />
                  </>
                )}
                {flippable && <ViewerButton label={labels.flipHorizontal} icon={FlipHorizontalIcon} aria-keyshortcuts="H" unavailable={!ready} onClick={() => flipBy("horizontal")} />}
                {fullscreenButton && fullscreenAvailable && (
                  <ViewerButton
                    label={fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
                    icon={fullscreen ? CornersInIcon : CornersOutIcon}
                    aria-keyshortcuts="F"
                    aria-pressed={fullscreen}
                    onClick={toggleFullscreen}
                  />
                )}
              </>
            )}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
            {!inline && <ViewerButton label={labels.close} icon={XIcon} onClick={() => closeFor("close-button")} />}
          </div>
        </div>
        <div className={styles.stageArea}>
          {image && (
            <ImageViewerStage
              key={imageKey}
              image={image}
              rotation={rotation}
              flipX={flipX}
              flipY={flipY}
              minZoom={minZoom}
              maxZoom={maxZoom}
              zoomStep={zoomStep}
              doubleClickZoom={doubleClickZoom}
              directionSign={directionSign}
              canDismiss={swipeToDismiss && !inline}
              inline={inline}
              enter={direction}
              getOriginRect={getOriginRect}
              labels={labels}
              apiRef={stageApi}
              onZoomChange={handleZoomChange}
              onStatusChange={handleStatusChange}
              onFitChange={handleFitChange}
              onLoaded={handleLoaded}
              onFailed={handleFailed}
              onSwipeNavigate={(toward) => step(toward)}
              onSwipeDismiss={() => closeFor("swipe")}
              onBackgroundPress={() => {
                if (closeOnOutsideClick && !inline) closeFor("outside");
              }}
              onImageTap={tapToToggleControls ? () => setChromeHidden((hidden) => !hidden) : undefined}
            />
          )}
          {showControls && canNavigate && (
            <>
              <ViewerButton
                label={labels.previous}
                icon={CaretLeftIcon}
                mirrored
                unavailable={atStart}
                className={cx(styles.arrow, styles.arrowStart)}
                onClick={() => step(-1)}
              />
              <ViewerButton
                label={labels.next}
                icon={CaretRightIcon}
                mirrored
                unavailable={atEnd}
                className={cx(styles.arrow, styles.arrowEnd)}
                onClick={() => step(1)}
              />
            </>
          )}
        </div>
        {(caption || (thumbnails && canNavigate)) && (
          <div className={styles.footer}>
            {caption && (
              <div id={captionId} className={styles.caption}>
                {caption}
              </div>
            )}
            {thumbnails && canNavigate && <ImageViewerThumbnails images={images} value={index} labels={labels} onSelect={changeValue} />}
          </div>
        )}
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </>
    );

    if (inline) {
      return (
        <ControllerContext.Provider value={snapshot}>
          {/* A focusable group that takes the viewer's keys: a widget with its own key model, which the lint rule that treats every group as static content does not know. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            ref={mergeRefs(ref, panelRef)}
            {...props}
            aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : labels.viewer)}
            {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
            aria-describedby={describedBy}
            // Computed from the viewer's own state, so after `{...props}`: a same-named consumer prop must not replace them.
            role="group"
            data-status={status}
            data-chrome={chromeHidden ? "hidden" : undefined}
            dir={dir}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={cx(styles.panel, styles.inline, className)}
            style={style}
            onKeyDown={handleKeyDown}
          >
            {inner}
          </div>
        </ControllerContext.Provider>
      );
    }

    const panel = (
      <DialogPrimitive.Content
        ref={mergeRefs(ref, panelRef)}
        {...props}
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        // Computed from the viewer's own state, so after `{...props}`: a same-named consumer prop must not replace them.
        role="dialog"
        aria-modal={true}
        data-state={open ? "open" : "closed"}
        data-status={status}
        data-chrome={chromeHidden ? "hidden" : undefined}
        dir={dir}
        tabIndex={-1}
        className={cx(styles.panel, className)}
        style={style}
        onKeyDown={handleKeyDown}
        onOpenAutoFocus={(event) => {
          returnFocus.remember();
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          // The viewer takes focus itself, so its keys work at once; a chosen element takes it instead.
          event.preventDefault();
          (initialFocus?.current ?? panelRef.current)?.focus();
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          returnFocus.restore(event);
        }}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!closeOnEscape) event.preventDefault();
          else if (!event.defaultPrevented) reasonRef.current = "escape";
        }}
        // A press outside the image and its controls is handled by the stage, which covers the viewer; this only
        // stops Radix treating a press on a layer portaled out of it (a menu in `actions`) as a dismissal.
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          event.preventDefault();
        }}
      >
        <OverlayLifecycle open={open} panelRef={panelRef} onOpenChangeComplete={onOpenChangeComplete} />
        <DialogPrimitive.Title asChild>
          <VisuallyHidden>{hiddenTitle}</VisuallyHidden>
        </DialogPrimitive.Title>
        {inner}
      </DialogPrimitive.Content>
    );

    return (
      <ControllerContext.Provider value={snapshot}>
        <DialogPrimitive.Root open={open} onOpenChange={handleRadixOpenChange} modal>
          {trigger && (
            <DialogPrimitive.Trigger
              asChild
              onClick={(event) => {
                if (!event.defaultPrevented) reasonRef.current = "trigger";
              }}
            >
              {trigger}
            </DialogPrimitive.Trigger>
          )}
          <DialogPrimitive.Portal container={container}>
            <DialogPrimitive.Overlay asChild>
              <Backdrop inPortal={false} open={open} opacity={scrimOpacity} blur={scrimBlur}>
                {panel}
              </Backdrop>
            </DialogPrimitive.Overlay>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </ControllerContext.Provider>
    );
  },
);

ImageViewer.displayName = "ImageViewer";
