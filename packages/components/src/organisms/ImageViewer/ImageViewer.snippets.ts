// The code shown under each story's "Show code" button on ImageViewer's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open viewer inside its Docs frame, the `container` it is given, the sample images),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

const images = `  images={[
    { src: "/photos/harbour.jpg", alt: "Boats in the harbour at dawn" },
    { src: "/photos/market.jpg", alt: "A fruit stall at the market" },
    { src: "/photos/hills.jpg", alt: "Green hills under a low cloud" },
  ]}`;

const captioned = `  images={[
    { src: "/photos/harbour.jpg", alt: "Boats in the harbour at dawn", caption: "Harbour, 6:10 am" },
    { src: "/photos/market.jpg", alt: "A fruit stall at the market", caption: "Saturday market" },
    { src: "/photos/hills.jpg", alt: "Green hills under a low cloud", caption: "The ridge walk" },
  ]}`;

const viewer = (attributes: string, list = images) =>
  `<ImageViewer
  trigger={<Button>View photos</Button>}${attributes ? `\n${attributes}` : ""}
${list}
/>`;

export const imageViewerSnippets = {
  basic: viewer(""),

  thumbnails: `{/* A strip of thumbnails under the image. Give each image a small \`thumbnail\` when the list is long. */}
${viewer("  thumbnails", `  images={[
    { src: "/photos/harbour.jpg", thumbnail: "/photos/harbour-small.jpg", alt: "Boats in the harbour at dawn" },
    { src: "/photos/market.jpg", thumbnail: "/photos/market-small.jpg", alt: "A fruit stall at the market" },
    { src: "/photos/hills.jpg", thumbnail: "/photos/hills-small.jpg", alt: "Green hills under a low cloud" },
  ]}`)}`,

  captions: `{/* A caption is any content, shown under its image and used as the viewer's description. */}
${viewer("", captioned)}`,

  singleImage: `{/* With one image there are no arrows, counter or thumbnails; zoom, pan and rotate remain. */}
<ImageViewer
  trigger={<Button>View photo</Button>}
  images={[{ src: "/photos/harbour.jpg", alt: "Boats in the harbour at dawn" }]}
/>`,

  controlled: `{/* const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0); */}
<ImageViewer
  open={open}
  onOpenChange={setOpen}
  value={index}
  onValueChange={setIndex}
${images}
/>`,

  controller: `{/* const viewer = useRef<ImageViewerController>(null);
    A thumbnail of your own opens the viewer at its image: viewer.current?.open(2) */}
<ImageViewer controllerRef={viewer}
${images}
/>`,

  loop: `{/* loop: the arrows and keys go on from the last image to the first, and back. */}
${viewer("  loop")}`,

  zoomLimits: `{/* maxZoom is relative to the fitted image; zoomStep is the factor a button or +/- applies. */}
${viewer("  maxZoom={8}\n  zoomStep={2}\n  doubleClickZoom={false}")}`,

  controlsHidden: `{/* controls="hidden" leaves only the close button; the keys and gestures still work. */}
${viewer('  controls="hidden"\n  rotatable={false}')}`,

  actions: `{/* Content of your own in the toolbar. ImageViewerButton is drawn for the dark stage in every theme (give it an
    icon for a round button, or text); useImageViewerController() inside it says which image is in view. */}
<ImageViewer
  trigger={<Button>View photos</Button>}
  actions={<ImageViewerButton label="Copy link" onClick={copyLink}>Copy link</ImageViewerButton>}
${images}
/>`,

  rightToLeft: `{/* dir mirrors the arrows and the arrow keys; it is passed in, not read from the page. */}
${viewer('  dir="rtl"')}`,

  labels: `{/* Every word the viewer supplies is a label. A label that takes numbers is a function of plain numbers. */}
${viewer(`  labels={{
    close: "Fermer",
    previous: "Image précédente",
    next: "Image suivante",
    position: (n, total) => \`\${n} sur \${total}\`,
  }}`)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ImageViewerPlaygroundSnippetArgs {
  loop?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  doubleClickZoom?: boolean;
  rotatable?: boolean;
  fullscreenButton?: boolean;
  thumbnails?: boolean;
  showCounter?: boolean | "auto";
  showCaptions?: boolean;
  controls?: "auto" | "hidden";
  swipeToDismiss?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  scrimOpacity?: number;
  scrimBlur?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around a
 * small real viewer.
 */
export function imageViewerPlaygroundSnippet(args: ImageViewerPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.loop) attributes.push("loop");
  if (args.minZoom !== undefined && args.minZoom !== 1) attributes.push(`minZoom={${args.minZoom}}`);
  if (args.maxZoom !== undefined && args.maxZoom !== 4) attributes.push(`maxZoom={${args.maxZoom}}`);
  if (args.zoomStep !== undefined && args.zoomStep !== 1.5) attributes.push(`zoomStep={${args.zoomStep}}`);
  if (args.doubleClickZoom === false) attributes.push("doubleClickZoom={false}");
  if (args.rotatable === false) attributes.push("rotatable={false}");
  if (args.fullscreenButton === false) attributes.push("fullscreenButton={false}");
  if (args.thumbnails) attributes.push("thumbnails");
  if (args.showCounter === true) attributes.push("showCounter");
  if (args.showCounter === false) attributes.push("showCounter={false}");
  if (args.showCaptions === false) attributes.push("showCaptions={false}");
  if (args.controls && args.controls !== "auto") attributes.push(`controls="${args.controls}"`);
  if (args.swipeToDismiss === false) attributes.push("swipeToDismiss={false}");
  if (args.closeOnOutsideClick === false) attributes.push("closeOnOutsideClick={false}");
  if (args.closeOnEscape === false) attributes.push("closeOnEscape={false}");
  if (args.scrimOpacity !== undefined && args.scrimOpacity !== 90) attributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  if (args.scrimBlur) attributes.push("scrimBlur");
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  return viewer(attributes.map((attribute) => `  ${attribute}`).join("\n"), captioned);
}
