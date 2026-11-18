// The code shown under each story's "Show code" button on Image's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground, "Locked
// aspect ratio" and "Rounded" panels print every default (`loading="lazy" objectFit="cover"
// position="center" radius="none"`) and `aspectRatio={1.3333333333333333}` /
// `{1.7777777777777777}`, with the story's own `/placeholder-img.jpg`; eight panels show the
// story object itself, built from `radiusOptions`, `objectFitOptions`, `positionOptions` and
// a `PLACEHOLDER_IMAGE_URL` constant in the stories file. An `Image` fills its container's
// width, so each snippet keeps the one sized container that shows it. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { ratioLiteral } from "../AspectRatio/AspectRatio.snippets";
import type { ImageObjectFit, ImageObjectPosition, ImageRadius } from "./Image.types";
import { quote } from "../../snippetHelpers";

export const imageSnippets = {
  default: `{/* An Image fills the width of its container, so size the container. alt is required: describe the
    image, or pass alt="" when it's purely decorative. */}
<div style={{ width: "16rem" }}>
  <Image src="/hero.jpg" alt="Product photo" />
</div>`,

  allRadii: `{/* radius: "none" (default) | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full" */}
<div style={{ width: "4rem" }}>
  <Image src="/avatar.jpg" alt="Profile photo" aspectRatio={1} radius="lg" />
</div>`,

  allObjectFit: `{/* objectFit: "cover" (default) | "contain" | "fill" | "none" | "scale-down" — how the image fits a box
    of a different shape. Give the Image the box's full size to see it. */}
<div style={{ height: "4rem", width: "4rem" }}>
  <Image src="/logo.png" alt="Company logo" objectFit="contain" style={{ height: "100%", width: "100%" }} />
</div>`,

  allPositions: `{/* position: "center" (default) | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" |
    "bottom-left" | "bottom-right" — which part of the image stays in view when objectFit="cover" crops it */}
<div style={{ width: "4rem" }}>
  <Image src="/hero.jpg" alt="Product photo" aspectRatio={1} objectFit="cover" position="top" />
</div>`,

  sizingPrecedence: `{/* width and height together win over aspectRatio */}
<Image src="/hero.jpg" alt="Product photo" width={160} height={80} aspectRatio={1} />

{/* width with aspectRatio: the height is computed */}
<Image src="/hero.jpg" alt="Product photo" width={160} aspectRatio={2} />

{/* height with aspectRatio: the width is computed */}
<Image src="/hero.jpg" alt="Product photo" height={80} aspectRatio={2} />`,

  brokenDefaultFallback: `{/* If src fails to load, Image shows a neutral placeholder in the same box instead of a broken image */}
<div style={{ width: "12rem" }}>
  <Image src="/missing.jpg" alt="Product photo" aspectRatio={1} radius="md" />
</div>`,

  brokenCustomFallback: `{/* fallback replaces that placeholder with your own content. UserIcon comes from @dbm-system/icons. */}
<div style={{ width: "12rem" }}>
  <Image
    src="/missing.jpg"
    alt="Profile photo"
    aspectRatio={1}
    radius="md"
    fallback={<Icon icon={UserIcon} size="lg" />}
  />
</div>`,

  decorative: `{/* alt="" marks the image as decorative: it's hidden from assistive technology, and so is the placeholder
    shown when there's no src */}
<div style={{ width: "8rem" }}>
  <Image src="/pattern.png" alt="" />
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ImagePlaygroundSnippetArgs {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number;
  objectFit?: ImageObjectFit;
  position?: ImageObjectPosition;
  radius?: ImageRadius;
  loading?: "lazy" | "eager";
}

// The stories' own placeholder file; a reader's snippet gets a path that reads like an app's.
const storyPlaceholder = "/placeholder-img.jpg";

const dimension = (name: string, value: number | string | undefined): string | undefined => {
  if (value === undefined || value === "") return undefined;
  return typeof value === "number" ? `${name}={${value}}` : `${name}="${value}"`;
};

/**
 * The Playground's snippet, built from its current controls: `src` and `alt` always, everything
 * else only when it differs from its default (`cover`, `center`, `none`, `lazy`), inside the sized
 * container an `Image` needs. `containerWidth` is that container's width — the Playground,
 * "Locked aspect ratio" and "Rounded" stories each use a different one.
 */
export function imagePlaygroundSnippet(args: ImagePlaygroundSnippetArgs, containerWidth = "16rem"): string {
  const attributes = [
    `src=${quote(!args.src || args.src === storyPlaceholder ? "/hero.jpg" : args.src)}`,
    `alt=${quote(args.alt ?? "")}`,
  ];
  if (args.aspectRatio !== undefined) attributes.push(`aspectRatio={${ratioLiteral(args.aspectRatio)}}`);
  for (const attribute of [dimension("width", args.width), dimension("height", args.height)]) {
    if (attribute) attributes.push(attribute);
  }
  if (args.objectFit && args.objectFit !== "cover") attributes.push(`objectFit="${args.objectFit}"`);
  if (args.position && args.position !== "center") attributes.push(`position="${args.position}"`);
  if (args.radius && args.radius !== "none") attributes.push(`radius="${args.radius}"`);
  if (args.loading && args.loading !== "lazy") attributes.push(`loading="${args.loading}"`);
  return `<div style={{ width: "${containerWidth}" }}>\n  <Image ${attributes.join(" ")} />\n</div>`;
}
