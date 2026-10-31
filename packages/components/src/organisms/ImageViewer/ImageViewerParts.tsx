import { cx } from "@dbm-system/utils";
import { forwardRef, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Image } from "../../atoms/Image";
import styles from "./ImageViewer.module.css";
import type { ImageViewerButtonProps, ImageViewerImage, ImageViewerLabels } from "./ImageViewer.types";

/**
 * A button for the viewer's dark stage, for the toolbar's `actions` (a download link, a share button) and used by the
 * viewer's own controls. The stage is dark in every theme, so it is drawn in colours that do not change with the theme:
 * `icon.white` over a fill mixed from `bg.overlay`, with a white focus ring inside it, which `Button` and `IconButton`
 * cannot promise because their tones follow the theme. Give it an `icon` for a round, icon-only button, or text
 * `children` for a pill; either way `label` is its accessible name and must contain any text it shows.
 *
 * @example
 * ```tsx
 * <ImageViewer actions={<ImageViewerButton label="Copy link" icon={LinkIcon} onClick={copy} />} images={images} />
 * ```
 */
export const ViewerButton = forwardRef<HTMLButtonElement, ImageViewerButtonProps>(
  ({ label, icon, children, unavailable = false, mirrored = false, className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      {...props}
      aria-label={label}
      aria-disabled={unavailable || undefined}
      className={cx(styles.control, children !== undefined && styles.controlText, className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (unavailable) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {icon ? <Icon icon={icon} size="md" tone="white" className={cx(mirrored && styles.mirrored)} /> : children}
    </button>
  ),
);
ViewerButton.displayName = "ImageViewerButton";

/**
 * The strip of thumbnails: one tab stop, on the image in view, with every thumbnail a button. The arrow keys already
 * move through the images from anywhere in the viewer, so the strip does not repeat them.
 */
export function ImageViewerThumbnails({
  images,
  value,
  labels,
  onSelect,
}: {
  images: ImageViewerImage[];
  value: number;
  labels: ImageViewerLabels;
  onSelect: (index: number) => void;
}) {
  const current = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    // The strip scrolls to keep the image in view in sight, in either reading direction.
    current.current?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [value]);
  const total = images.length;
  return (
    <div role="group" aria-label={labels.thumbnails} className={styles.thumbnails}>
      {images.map((image, index) => {
        const selected = index === value;
        return (
          <button
            key={image.id ?? image.src}
            ref={selected ? current : undefined}
            type="button"
            className={styles.thumbnail}
            aria-label={labels.thumbnail(index + 1, total)}
            aria-current={selected ? "true" : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(index)}
          >
            <Image src={image.thumbnail ?? image.src} alt="" width="100%" height="100%" objectFit="cover" loading="lazy" draggable={false} />
          </button>
        );
      })}
    </div>
  );
}
