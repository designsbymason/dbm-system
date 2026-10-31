import { useState } from "react";
import type { ReactNode } from "react";
import type { ImageViewerImage } from "./ImageViewer.types";

/**
 * A box that keeps an open viewer inside it, for Storybook only. Every `<Canvas>` on a Docs page shares one document,
 * so a viewer's `position: fixed` scrim would otherwise cover the whole page. A `transform` makes the box the
 * containing block of its fixed descendants, and the viewer is portaled into it through `container`.
 */
export function ViewerStage({
  children,
  minBlockSize = "30rem",
}: {
  children: (container: HTMLElement | null) => ReactNode;
  minBlockSize?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setContainer}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        minBlockSize,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
        background: "var(--dbm-bg-canvas)",
      }}
    >
      {children(container)}
    </div>
  );
}

interface Sample {
  label: string;
  width: number;
  height: number;
  hue: number;
}

const samples: Sample[] = [
  { label: "Harbour", width: 1600, height: 1000, hue: 205 },
  { label: "Market", width: 1000, height: 1400, hue: 25 },
  { label: "Hills", width: 1800, height: 900, hue: 130 },
  { label: "Studio", width: 1200, height: 1200, hue: 285 },
  { label: "Station", width: 1500, height: 1000, hue: 350 },
  { label: "Lake", width: 1600, height: 1100, hue: 175 },
];

/**
 * A picture drawn as an SVG data address, so the stories need no files and no network: a gradient, a grid that makes
 * zooming and panning visible, and the label and size in large type.
 */
function pictureOf({ label, width, height, hue }: Sample, scale = 1): string {
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const step = Math.round(100 * scale);
  const lines: string[] = [];
  for (let x = step; x < w; x += step) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  for (let y = step; y < h; y += step) lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 65% 30%)"/>` +
    `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<g stroke="white" stroke-opacity="0.25" stroke-width="${Math.max(1, Math.round(2 * scale))}">${lines.join("")}</g>` +
    `<text x="50%" y="48%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(h / 7)}" font-weight="700" fill="white">${label}</text>` +
    `<text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(h / 20)}" fill="white" fill-opacity="0.85">${width} × ${height}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The sample images: a landscape, a portrait, a panorama, a square and two more, with captions. */
export const sampleImages: ImageViewerImage[] = samples.map((sample) => ({
  id: sample.label.toLowerCase(),
  src: pictureOf(sample),
  thumbnail: pictureOf(sample, 0.1),
  alt: `${sample.label}: a ${sample.width} by ${sample.height} test picture`,
  caption: `${sample.label} — ${sample.width} × ${sample.height}`,
  width: sample.width,
  height: sample.height,
}));

/** A list that cannot load, to show the failed state. */
export const brokenImages: ImageViewerImage[] = [
  { src: "data:image/png;base64,not-an-image", alt: "A picture that cannot be loaded", caption: "This one fails to load" },
  ...sampleImages.slice(0, 2),
];

/** The same images with no size hints and no captions, as a list of plain addresses would give. */
export const plainImages: ImageViewerImage[] = sampleImages.map(({ id, src, alt, thumbnail }) => ({ id, src, alt, thumbnail }));

/** Five hundred small pictures, for a strip too long to draw whole. */
export const manyImages: ImageViewerImage[] = Array.from({ length: 500 }, (_, index) => {
  const sample: Sample = { label: `No. ${index + 1}`, width: 1200, height: 800, hue: (index * 37) % 360 };
  return { id: `many-${index}`, src: pictureOf(sample, 0.5), thumbnail: pictureOf(sample, 0.06), alt: `Picture ${index + 1} of 500`, width: 600, height: 400 };
});
