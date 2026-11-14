import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  SyntheticEvent,
} from "react";

export type ImageObjectFit =
  | "cover"
  | "contain"
  | "fill"
  | "none"
  | "scale-down";

export type ImageObjectPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type ImageRadius =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full";

export interface ImageProps
  extends Omit<ComponentPropsWithoutRef<"img">, "alt" | "onError"> {
  /** The image's address. When it is missing, or the image fails to load, `fallback` is shown in its place. */
  src?: string;
  /**
   * Required — pass `""` for a purely decorative image. `Image` always
   * needs this explicitly (no silent decorative default), since it's also
   * used as the fallback state's accessible label.
   */
  alt: string;
  /**
   * Rendered in place of the image when `src` is missing or fails to
   * load — e.g. a placeholder icon or initials. Defaults to a generic
   * image icon; pass this prop to override it with your own content.
   */
  fallback?: ReactNode;
  /**
   * Sizes the wrapper (as a real CSS `width`), not just the `<img>` — pass
   * alone (the other axis stays naturally sized), with `height` (an exact
   * box, ignoring `aspectRatio` if also given), or with `aspectRatio`
   * (computes `height`). Also stays on the `<img>` itself as a native
   * attribute, like any other passed-through native prop.
   */
  width?: number | string;
  /**
   * Sizes the wrapper (as a real CSS `height`) — see `width`'s own JSDoc
   * for how it combines with `width`/`aspectRatio`. Also stays on the
   * `<img>` itself as a native attribute.
   */
  height?: number | string;
  /**
   * Locks the wrapper to a ratio (e.g. `16 / 9`), like the CSS
   * `aspect-ratio` property — because that's exactly what this sets. Valid
   * alone (sized by the surrounding layout), or paired with just `width`
   * or just `height` to compute the other dimension. If `width` *and*
   * `height` are both also given, they win outright (standard CSS
   * behavior: `aspect-ratio` only ever fills in a missing dimension) — a
   * `width`/`height` pair that actually conflicts with this value logs a
   * dev-mode warning, so this doesn't silently do nothing.
   */
  aspectRatio?: number;
  /**
   * How the picture fills its box when its shape differs from the box's: the CSS `object-fit` values.
   * @default 'cover'
   */
  objectFit?: ImageObjectFit;
  /**
   * Where the image anchors within its box when it's cropped — only
   * visible with `objectFit="cover"` (or `"none"` when the image is larger
   * than its box). Sets the CSS `object-position` property — not layout
   * `position` (`static`/`absolute`/etc.), a different CSS property this
   * shares a name with.
   * @default 'center'
   */
  position?: ImageObjectPosition;
  /**
   * The corner radius, one step on the radius scale (`xs` to `3xl`), or `full` for a circle or pill.
   * @default 'none'
   */
  radius?: ImageRadius;
  /**
   * `lazy` waits until the image is near the viewport before fetching it; `eager` fetches it at once, which suits an image at the top of the page.
   * @default 'lazy'
   */
  loading?: "lazy" | "eager";
  /**
   * Fired when `src` fails to load, after the component has already
   * switched to its own fallback — use for logging/retry/telemetry, not to
   * control the fallback itself, which always happens regardless of
   * whether this is provided.
   */
  onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  /** A set of image candidates for responsive loading, matching the native `srcset` attribute. */
  srcSet?: string;
  /** Paired with `srcSet` — the viewport-width conditions each candidate applies at. */
  sizes?: string;
  /** Hints the browser's own image-decoding strategy. */
  decoding?: "sync" | "async" | "auto";
  /**
   * Standard DOM id. Applied to the outer wrapper (the same stable element
   * `ref` forwards to), not the `<img>` itself, so it survives the
   * fallback swap — needed when another element's `aria-labelledby`/
   * `aria-describedby` must point at this component, or a test/router
   * needs a stable anchor regardless of load state.
   */
  id?: string;
  /** Additional CSS classes for customization — applied to the outer wrapper. */
  className?: string;
  /** Inline styles, merged onto the wrapper's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Applied to the outer
   * wrapper, so it survives the fallback swap. Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
