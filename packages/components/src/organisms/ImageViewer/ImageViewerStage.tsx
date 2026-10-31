import { ImageBrokenIcon } from "@dbm-system/icons";
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { Ref, SyntheticEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Image } from "../../atoms/Image";
import { Spinner } from "../../atoms/Spinner";
import type { Size } from "./imageViewerMath";
import styles from "./ImageViewer.module.css";
import type { ImageViewerImage, ImageViewerLabels } from "./ImageViewer.types";
import { ViewerButton } from "./ImageViewerParts";
import { useImageZoom } from "./useImageZoom";
import type { ImageZoomApi, ZoomGestureHandlers } from "./useImageZoom";

export type ImageStatus = "loading" | "ready" | "failed";

export interface ImageViewerStageProps extends ZoomGestureHandlers {
  image: ImageViewerImage;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  doubleClickZoom: boolean;
  directionSign: 1 | -1;
  canDismiss: boolean;
  /** Which way the person came from, so the image eases in from that side; `null` for none. */
  enter: "next" | "previous" | null;
  /** The place on the page to ease the image in from, asked for once the image is drawn; `null` for none. */
  getOriginRect: () => DOMRect | null;
  labels: ImageViewerLabels;
  apiRef: Ref<ImageZoomApi>;
  onZoomChange: (zoom: number) => void;
  onStatusChange: (status: ImageStatus) => void;
  /** Told the ratio the fitted image is drawn at (1 for an image no larger than the stage), when it changes. */
  onFitChange: (fit: number) => void;
  onLoaded: () => void;
  onFailed: () => void;
}

function sizeOf(image: ImageViewerImage): Size | null {
  return image.width && image.height && image.width > 0 && image.height > 0 ? { width: image.width, height: image.height } : null;
}

/**
 * The area the image is drawn in: the image at its fitted size inside a box that carries the zoom, pan and turn, and
 * the gestures that drive them. Rendered with a `key` per image, so changing the image starts a new stage with the
 * whole image in view and nothing carried over.
 */
export function ImageViewerStage({
  image,
  rotation,
  flipX,
  flipY,
  minZoom,
  maxZoom,
  zoomStep,
  doubleClickZoom,
  directionSign,
  canDismiss,
  enter,
  getOriginRect,
  labels,
  apiRef,
  onZoomChange,
  onStatusChange,
  onFitChange,
  onLoaded,
  onFailed,
  onSwipeNavigate,
  onSwipeDismiss,
  onBackgroundPress,
  onImageTap,
}: ImageViewerStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [natural, setNatural] = useState<Size | null>(() => sizeOf(image));
  const [status, setStatus] = useState<ImageStatus>("loading");
  // A new attempt draws the image afresh, which asks the browser for it again.
  const [attempt, setAttempt] = useState(0);

  const changeStatus = useCallback(
    (next: ImageStatus) => {
      setStatus(next);
      onStatusChange(next);
      if (next === "ready") onLoaded();
      else if (next === "failed") onFailed();
    },
    [onStatusChange, onLoaded, onFailed],
  );

  const { fitted, fit, api } = useImageZoom({
    stageRef,
    boxRef,
    natural,
    rotation,
    flipX,
    flipY,
    minZoom,
    maxZoom,
    zoomStep,
    doubleClickZoom,
    enabled: status === "ready",
    directionSign,
    canDismiss,
    onZoomChange,
    onSwipeNavigate,
    onSwipeDismiss,
    onBackgroundPress,
    onImageTap,
  });
  useImperativeHandle(apiRef, () => api, [api]);

  useEffect(() => {
    onFitChange(fit);
  }, [fit, onFitChange]);

  const drawn = natural !== null && fitted.width > 0;

  // The first time the image is drawn it may ease in from where the person pressed, if the owner says where.
  const entered = useRef(false);
  useLayoutEffect(() => {
    if (!drawn || entered.current) return;
    entered.current = true;
    const origin = getOriginRect();
    if (origin) api.enterFrom(origin);
  }, [drawn, getOriginRect, api]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) setNatural({ width: naturalWidth, height: naturalHeight });
    changeStatus("ready");
  };

  const retry = () => {
    setStatus("loading");
    onStatusChange("loading");
    setAttempt((count) => count + 1);
  };

  // While the full image loads, its thumbnail stands in for it, blurred, where there is one.
  const placeholder = status === "loading" && image.thumbnail && image.thumbnail !== image.src ? image.thumbnail : null;

  // A press on the stage outside the image closes the viewer, so the stage has to be the element that gets it.
  return (
    <div ref={stageRef} className={styles.stage} data-status={status} data-zoomable={status === "ready" ? "" : undefined}>
      {placeholder && <img className={styles.placeholder} src={placeholder} alt="" aria-hidden="true" draggable={false} />}
      {status !== "failed" && (
        <div
          ref={boxRef}
          className={styles.box}
          style={drawn ? { inlineSize: `${fitted.width}px`, blockSize: `${fitted.height}px` } : undefined}
          data-drawn={drawn ? "" : undefined}
          data-enter={enter ?? undefined}
        >
          <Image
            key={attempt}
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.sizes}
            alt={image.alt}
            width="100%"
            height="100%"
            objectFit="contain"
            loading="eager"
            decoding="async"
            draggable={false}
            className={styles.image}
            onLoad={handleLoad}
            onError={() => changeStatus("failed")}
          />
        </div>
      )}
      {status === "loading" && (
        <div className={styles.stageMessage} data-viewer-ui="">
          <Spinner size="lg" label={labels.loading} />
        </div>
      )}
      {status === "failed" && (
        <div className={styles.stageMessage} data-viewer-ui="">
          <div role="img" aria-label={image.alt ? `${image.alt}. ${labels.failed}` : labels.failed} className={styles.failed}>
            <Icon icon={ImageBrokenIcon} size="3xl" tone="white" />
            <span className={styles.failedText}>{labels.failed}</span>
          </div>
          <ViewerButton label={labels.retry} onClick={retry}>
            {labels.retry}
          </ViewerButton>
        </div>
      )}
    </div>
  );
}
