import { ImageBrokenIcon } from "@dbm-system/icons";
import { useCallback, useImperativeHandle, useRef, useState } from "react";
import type { Ref, SyntheticEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Image } from "../../atoms/Image";
import { Spinner } from "../../atoms/Spinner";
import type { Size } from "./imageViewerMath";
import styles from "./ImageViewer.module.css";
import type { ImageViewerImage, ImageViewerLabels } from "./ImageViewer.types";
import { useImageZoom } from "./useImageZoom";
import type { ImageZoomApi, ZoomGestureHandlers } from "./useImageZoom";

export type ImageStatus = "loading" | "ready" | "failed";

export interface ImageViewerStageProps extends ZoomGestureHandlers {
  image: ImageViewerImage;
  rotation: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  doubleClickZoom: boolean;
  directionSign: 1 | -1;
  canDismiss: boolean;
  labels: ImageViewerLabels;
  apiRef: Ref<ImageZoomApi>;
  onZoomChange: (zoom: number) => void;
  onStatusChange: (status: ImageStatus) => void;
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
  minZoom,
  maxZoom,
  zoomStep,
  doubleClickZoom,
  directionSign,
  canDismiss,
  labels,
  apiRef,
  onZoomChange,
  onStatusChange,
  onSwipeNavigate,
  onSwipeDismiss,
  onBackgroundPress,
}: ImageViewerStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [natural, setNatural] = useState<Size | null>(() => sizeOf(image));
  const [status, setStatus] = useState<ImageStatus>("loading");

  const changeStatus = useCallback(
    (next: ImageStatus) => {
      setStatus(next);
      onStatusChange(next);
    },
    [onStatusChange],
  );

  const { fitted, api } = useImageZoom({
    stageRef,
    boxRef,
    natural,
    rotation,
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
  });
  useImperativeHandle(apiRef, () => api, [api]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) setNatural({ width: naturalWidth, height: naturalHeight });
    changeStatus("ready");
  };

  const drawn = natural !== null && fitted.width > 0;
  // A press on the stage outside the image closes the viewer, so the stage has to be the element that gets it.
  return (
    <div ref={stageRef} className={styles.stage} data-status={status} data-zoomable={status === "ready" ? "" : undefined}>
      {status !== "failed" && (
        <div
          ref={boxRef}
          className={styles.box}
          style={drawn ? { inlineSize: `${fitted.width}px`, blockSize: `${fitted.height}px` } : undefined}
          data-drawn={drawn ? "" : undefined}
        >
          <Image
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
        <div className={styles.stageMessage} data-viewer-ui="" role="img" aria-label={image.alt ? `${image.alt}. ${labels.failed}` : labels.failed}>
          <Icon icon={ImageBrokenIcon} size="3xl" tone="white" />
          <span className={styles.failedText}>{labels.failed}</span>
        </div>
      )}
    </div>
  );
}
