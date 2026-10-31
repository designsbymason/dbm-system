import { cx } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
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

/** More thumbnails than this are drawn a window at a time, so a long set does not mount hundreds of buttons. */
const WINDOW_FROM = 80;
const OVERSCAN = 6;
/** Used until the first thumbnail has been measured: its width and the gap, and the strip's own width. */
const FALLBACK_PITCH = 72;
const FALLBACK_WIDTH = 640;

function visibleRange(scroll: number, width: number, pitch: number, total: number): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scroll / pitch) - OVERSCAN);
  const end = Math.min(total, Math.ceil((scroll + width) / pitch) + OVERSCAN);
  return { start, end };
}

/**
 * The strip of thumbnails: one tab stop, on the image in view, with every thumbnail a button. The arrow keys already
 * move through the images from anywhere in the viewer, so the strip does not repeat them. A long strip draws only the
 * thumbnails in view and a few either side, with empty space for the rest so the scrolling box keeps its length.
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
  const total = images.length;
  const windowed = total > WINDOW_FROM;
  const container = useRef<HTMLDivElement | null>(null);
  const current = useRef<HTMLButtonElement | null>(null);
  const [metrics, setMetrics] = useState({ pitch: FALLBACK_PITCH, gap: 0 });
  const [range, setRange] = useState(() => visibleRange(Math.max(0, value * FALLBACK_PITCH - FALLBACK_WIDTH / 2), FALLBACK_WIDTH, FALLBACK_PITCH, total));

  const refresh = useCallback(() => {
    const element = container.current;
    if (!element || !windowed) return;
    const first = element.querySelector("button");
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const pitch = first && first.offsetWidth > 0 ? first.offsetWidth + gap : metrics.pitch;
    setMetrics((previous) => (previous.pitch === pitch && previous.gap === gap ? previous : { pitch, gap }));
    // The scroll position is negative in a right-to-left strip, so its size is what counts.
    setRange(visibleRange(Math.abs(element.scrollLeft), element.clientWidth || FALLBACK_WIDTH, pitch, total));
  }, [windowed, total, metrics.pitch]);

  useLayoutEffect(() => {
    const element = container.current;
    if (!element || !windowed) return undefined;
    refresh();
    element.addEventListener("scroll", refresh, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", refresh);
      observer?.disconnect();
    };
  }, [windowed, refresh]);

  useEffect(() => {
    const element = container.current;
    if (!windowed) {
      // The strip scrolls to keep the image in view in sight, in either reading direction. Only the strip: `scrollIntoView` would
      // scroll the page too, which a viewer drawn in a page must not do when it appears.
      const thumbnail = current.current;
      if (element && thumbnail) {
        const strip = element.getBoundingClientRect();
        const own = thumbnail.getBoundingClientRect();
        element.scrollBy?.({ left: own.left + own.width / 2 - (strip.left + strip.width / 2) });
      }
      return;
    }
    if (!element) return;
    const sign = getComputedStyle(element).direction === "rtl" ? -1 : 1;
    const target = Math.max(0, value * metrics.pitch - (element.clientWidth - metrics.pitch) / 2);
    element.scrollTo?.({ left: sign * target });
    // `scrollTo` is not there in every test environment; the range is then taken from where it would have gone.
    setRange(visibleRange(target, element.clientWidth || FALLBACK_WIDTH, metrics.pitch, total));
  }, [value, windowed, total, metrics.pitch]);

  // The thumbnails to draw: the window, and the current one wherever it is, since it holds the strip's tab stop.
  const drawn: number[] = [];
  if (windowed) {
    for (let index = range.start; index < range.end; index += 1) drawn.push(index);
    if (value < range.start) drawn.unshift(value);
    else if (value >= range.end) drawn.push(value);
  } else {
    for (let index = 0; index < total; index += 1) drawn.push(index);
  }
  // Empty space stands for the ones left out, so the strip keeps its length: each thumbnail is `pitch` wide with its gap, and
  // the flex gap already counts on both sides of a space.
  const spaceFor = (skipped: number) => Math.max(0, skipped * metrics.pitch - metrics.gap);
  const children: ReactNode[] = [];
  let previous = -1;
  for (const index of drawn) {
    const image = images[index];
    if (!image) continue;
    if (windowed && index > previous + 1) {
      children.push(<div key={`space-${previous}`} aria-hidden="true" className={styles.thumbnailSpacer} style={{ inlineSize: `${spaceFor(index - previous - 1)}px` }} />);
    }
    const selected = index === value;
    children.push(
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
      </button>,
    );
    previous = index;
  }
  if (windowed && previous < total - 1) {
    children.push(<div key="space-end" aria-hidden="true" className={styles.thumbnailSpacer} style={{ inlineSize: `${spaceFor(total - 1 - previous)}px` }} />);
  }

  return (
    <div ref={container} role="group" aria-label={labels.thumbnails} className={styles.thumbnails}>
      {children}
    </div>
  );
}
