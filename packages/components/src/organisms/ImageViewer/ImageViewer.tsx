import {
  ArrowClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CornersInIcon,
  CornersOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XIcon,
} from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Children, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
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

function buildDefaultLabels(formatNumber: (value: number) => string): ImageViewerLabels {
  return {
    viewer: "Image viewer",
    close: "Close",
    previous: "Previous image",
    next: "Next image",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: (zoom) => `Reset zoom, ${zoom}`,
    rotate: "Rotate clockwise",
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
  open: () => false,
  close: () => false,
  next: () => false,
  previous: () => false,
  goTo: () => false,
  zoomIn: () => false,
  zoomOut: () => false,
  resetZoom: () => false,
  rotate: () => false,
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

/**
 * A full-screen viewer for one image or a set of them, often called a lightbox. It opens over the page on a dark
 * stage, fits the whole image in view, and lets the person zoom in (the wheel, a pinch, a double tap, the buttons or
 * `+`/`-`), move around a zoomed image by dragging or with the arrow keys, turn it, step through the set (the arrows,
 * the arrow keys, a swipe, or a strip of thumbnails) and go full screen. Every gesture has a button or a key, so
 * nothing needs a touch screen or a mouse.
 *
 * Built on Radix Dialog, so it is **modal**: the page behind can't be scrolled or reached, focus is held inside, and
 * it returns to whatever opened the viewer. It is driven by data: pass `images`, and open it with a `trigger`, with
 * `open`/`defaultOpen`, or from code with `controllerRef`. `value` is the index of the image in view, controlled with
 * `value`/`onValueChange` or left to the viewer with `defaultValue`.
 *
 * It draws one image at a time, with its neighbours loading in the background. For a row of slides shown in the page,
 * use `Carousel`; for any other content in a window, use `Dialog`. It does not fetch, upload or download anything:
 * put a download link in `actions`.
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
      fullscreenButton = true,
      thumbnails = false,
      showCounter = "auto",
      showCaptions = true,
      controls = "auto",
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

    // --- Open state. The reason a change was asked for is noted just before Radix reports the change.
    const isOpenControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const open = isOpenControlled ? openProp : innerOpen;
    const reasonRef = useRef<ImageViewerOpenChangeReason | null>(null);

    // --- The image in view. A press asks through `onValueChange`; the image changes when the value does.
    const isValueControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = useState(defaultValue);
    const rawValue = isValueControlled ? valueProp : innerValue;
    const index = count === 0 ? 0 : Math.min(count - 1, Math.max(0, Math.trunc(Number.isFinite(rawValue) ? rawValue : 0)));
    const image = images[index];
    const imageKey = image ? `${index}:${image.id ?? image.src}` : "none";

    // Everything the controller and the keys read is the latest render's.
    const [zoomState, setZoomState] = useState({ key: imageKey, zoom: 1 });
    const zoom = zoomState.key === imageKey ? zoomState.zoom : 1;
    const [statusState, setStatusState] = useState<{ key: string; status: ImageStatus }>({ key: imageKey, status: "loading" });
    const status: ImageStatus = statusState.key === imageKey ? statusState.status : "loading";
    const [rotationState, setRotationState] = useState({ key: imageKey, degrees: 0 });
    const rotation = rotationState.key === imageKey ? rotationState.degrees : 0;

    const latest = useRef({ open, isOpenControlled, onOpenChange, index, count, isValueControlled, onValueChange, loop, imageKey, zoom, rotation, status });
    useEffect(() => {
      latest.current = { open, isOpenControlled, onOpenChange, index, count, isValueControlled, onValueChange, loop, imageKey, zoom, rotation, status };
    });

    const changeOpen = useCallback((next: boolean, reason: ImageViewerOpenChangeReason) => {
      const current = latest.current;
      if (next === current.open) return false;
      if (!current.isOpenControlled) {
        // Held here too, so a second call before the next render sees the change the first made.
        current.open = next;
        setInnerOpen(next);
      }
      current.onOpenChange?.(next, { reason });
      return true;
    }, []);
    const changeValue = useCallback((next: number) => {
      const current = latest.current;
      if (next === current.index || next < 0 || next >= current.count) return false;
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
        return target === null ? false : changeValue(target);
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

    // --- What the stage reports is kept with the image it was reported for, so a new image starts fresh.
    const handleZoomChange = useCallback((next: number) => setZoomState({ key: imageKey, zoom: next }), [imageKey]);
    const handleStatusChange = useCallback((next: ImageStatus) => setStatusState({ key: imageKey, status: next }), [imageKey]);

    const stageApi = useRef<ImageZoomApi | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const ready = status === "ready";

    const rotateBy = useCallback((degrees: number) => {
      const current = latest.current;
      if (current.status !== "ready") return false;
      const quarter = Math.round(degrees / 90) * 90;
      if (quarter === 0) return false;
      setRotationState({ key: current.imageKey, degrees: turn(current.rotation, quarter) });
      return true;
    }, []);

    // --- Full screen, where the browser has it.
    // The panel is only rendered in the browser (Radix portals after mount), so reading `document` here is safe.
    const fullscreenAvailable = typeof document !== "undefined" && document.fullscreenEnabled === true;
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
        rotate: (degrees = 90) => rotateBy(degrees),
        toggleFullscreen,
      }),
      [changeOpen, changeValue, step, rotateBy, toggleFullscreen],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // The hook hands a part inside the viewer the same methods with a snapshot of the state, which changes as it does.
    const snapshot = useMemo<ImageViewerController>(
      () => ({ ...controller, isOpen: open, value: index, count, zoom }),
      [controller, open, index, count, zoom],
    );

    // --- Neighbours load in the background, so a step to them shows at once.
    useEffect(() => {
      if (!open || count < 2) return undefined;
      const loaded: HTMLImageElement[] = [];
      for (const offset of [1, -1]) {
        const target = neighbour(index, offset, count, loop);
        const next = target === null ? undefined : images[target];
        if (!next) continue;
        const element = new window.Image();
        if (next.srcSet) element.srcset = next.srcSet;
        element.src = next.src;
        loaded.push(element);
      }
      return () => {
        // Dropping the references lets the browser release what it decoded.
        loaded.length = 0;
      };
    }, [open, index, count, loop, images]);

    // --- The announcement of a new image. Opening is not a change: the dialog announces itself.
    const { message, announce } = useAnnouncement();
    const lastIndex = useRef<number | null>(null);
    useEffect(() => {
      if (!open) {
        lastIndex.current = null;
        return;
      }
      if (lastIndex.current !== null && lastIndex.current !== index && image) {
        announce(labels.announcement(index + 1, count, image.alt));
      }
      lastIndex.current = index;
    }, [open, index, image, count, labels, announce]);

    // --- Development warnings.
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (count === 0) console.warn("ImageViewer: `images` is empty, so there is nothing to show.");
      else if (images.some((entry) => typeof entry.alt !== "string")) {
        console.warn("ImageViewer: every image needs an `alt` (pass \"\" for a purely decorative one).");
      }
    }, [count, images]);

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
    const percent = Math.round(zoom * 100);
    const zoomText = `${formatNumber(percent)}%`;
    const atStart = neighbour(index, -1, count, loop) === null;
    const atEnd = neighbour(index, 1, count, loop) === null;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return;
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
        case "r":
        case "R":
          if (rotatable) rotateBy(90);
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
    const describedBy = caption ? captionId : undefined;

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
        <div className={styles.toolbar}>
          <div className={styles.toolbarStart}>
            {counterShown && count > 0 && (
              <span className={styles.counter} data-testid="image-viewer-counter">
                {labels.position(index + 1, count)}
              </span>
            )}
          </div>
          <div className={styles.toolbarEnd}>
            {showControls && (
              <>
                <ViewerButton label={labels.zoomOut} icon={MagnifyingGlassMinusIcon} unavailable={!ready || zoom <= minZoom} onClick={() => stageApi.current?.zoomOut()} />
                <ViewerButton
                  label={labels.resetZoom(zoomText)}
                  unavailable={!ready || zoom === 1}
                  className={styles.zoomValue}
                  onClick={() => stageApi.current?.reset()}
                >
                  {zoomText}
                </ViewerButton>
                <ViewerButton label={labels.zoomIn} icon={MagnifyingGlassPlusIcon} unavailable={!ready || zoom >= maxZoom} onClick={() => stageApi.current?.zoomIn()} />
                {rotatable && <ViewerButton label={labels.rotate} icon={ArrowClockwiseIcon} unavailable={!ready} onClick={() => rotateBy(90)} />}
                {fullscreenButton && fullscreenAvailable && (
                  <ViewerButton
                    label={fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
                    icon={fullscreen ? CornersInIcon : CornersOutIcon}
                    aria-pressed={fullscreen}
                    onClick={toggleFullscreen}
                  />
                )}
              </>
            )}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
            <ViewerButton
              label={labels.close}
              icon={XIcon}
              onClick={() => closeFor("close-button")}
            />
          </div>
        </div>
        <div className={styles.stageArea}>
          {image && (
            <ImageViewerStage
              key={imageKey}
              image={image}
              rotation={rotation}
              minZoom={minZoom}
              maxZoom={maxZoom}
              zoomStep={zoomStep}
              doubleClickZoom={doubleClickZoom}
              directionSign={directionSign}
              canDismiss={swipeToDismiss}
              labels={labels}
              apiRef={stageApi}
              onZoomChange={handleZoomChange}
              onStatusChange={handleStatusChange}
              onSwipeNavigate={(direction) => step(direction)}
              onSwipeDismiss={() => closeFor("swipe")}
              onBackgroundPress={() => {
                if (closeOnOutsideClick) closeFor("outside");
              }}
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
