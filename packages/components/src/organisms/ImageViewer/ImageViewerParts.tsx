import { cx } from "@dbm-system/utils";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { forwardRef, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import { Image } from "../../atoms/Image";
import styles from "./ImageViewer.module.css";
import type { ImageViewerImage, ImageViewerLabels } from "./ImageViewer.types";

interface ViewerButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label" | "disabled"> {
  /** The accessible name. When the button shows text of its own, the name must hold that text. */
  label: string;
  icon?: PhosphorIcon;
  /** Text shown in place of the icon, such as the zoom. */
  children?: ReactNode;
  /** Dims the button and ignores a press, but leaves it focusable so a press that turns it off keeps the person's place. */
  unavailable?: boolean;
  /** Mirrors the icon in a right-to-left stage (arrows). */
  mirrored?: boolean;
}

/**
 * A button of the viewer's stage. The stage is dark whatever the theme, so these are drawn in colours that do not
 * change with it, which `IconButton`'s theme-driven tones cannot promise. Unavailable is `aria-disabled`, not
 * `disabled`, so a press that turns a button off (the last zoom step) does not drop focus.
 */
export const ViewerButton = forwardRef<HTMLButtonElement, ViewerButtonProps>(
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
ViewerButton.displayName = "ImageViewer.Button";

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
