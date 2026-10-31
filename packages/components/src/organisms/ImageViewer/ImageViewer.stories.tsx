import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Image } from "../../atoms/Image";
import { Stack } from "../../atoms/Stack";
import { Text } from "../../atoms/Text";
import { ImageViewer, ImageViewerButton, useImageViewerController } from "./ImageViewer";
import { imageViewerPlaygroundSnippet, imageViewerSnippets } from "./ImageViewer.snippets";
import type { ImageViewerController, ImageViewerProps } from "./ImageViewer.types";
import { ViewerStage, brokenImages, manyImages, plainImages, sampleImages } from "./ImageViewerStoryKit";

type PlaygroundArgs = ImageViewerProps;

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => imageViewerPlaygroundSnippet(context.args),
};

// Every control of the real props, for a story whose fixed render uses none of them.
const noControls = {
  loop: { control: false },
  minZoom: { control: false },
  maxZoom: { control: false },
  zoomStep: { control: false },
  doubleClickZoom: { control: false },
  rotatable: { control: false },
  flippable: { control: false },
  fullscreenButton: { control: false },
  tapToToggleControls: { control: false },
  closeOnHistoryBack: { control: false },
  autoPlay: { control: false },
  thumbnails: { control: false },
  showCounter: { control: false },
  showCaptions: { control: false },
  controls: { control: false },
  swipeToDismiss: { control: false },
  closeOnOutsideClick: { control: false },
  closeOnEscape: { control: false },
  scrimOpacity: { control: false },
  scrimBlur: { control: false },
  dir: { control: false },
} as const;

const openButton = <Button>View photos</Button>;

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Media/ImageViewer",
  component: ImageViewer,
  parameters: { layout: "padded" },
  argTypes: {
    images: {
      control: false,
      description:
        "The images, in order. Each is { src, alt, id, srcSet, sizes, thumbnail, caption, width, height }; alt is required (\"\" for a purely decorative image). With one image the viewer draws no arrows, counter or thumbnails.",
    },
    trigger: {
      control: false,
      description: "An element that opens the viewer when pressed (a thumbnail, a button), rendered in place and wired up for you. Without one, open it with open, defaultOpen or controllerRef.",
    },
    open: { control: false, description: "The controlled open state. Omit (along with defaultOpen) to let the viewer manage its own." },
    defaultOpen: {
      control: false,
      description: "The initial open state for uncontrolled use — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state and { reason }: trigger, escape, outside, close-button, swipe or controller.",
    },
    onOpenChangeComplete: {
      control: false,
      description: "Called with true once the viewer has finished opening and with false once it has finished closing and is out of the page.",
    },
    value: { control: false, description: "The index of the image in view (controlled). A press asks through onValueChange; the image changes when this does." },
    defaultValue: {
      control: false,
      description: "The index of the first image in view, for uncontrolled use — ignored once value is provided.",
      table: { defaultValue: { summary: "0" } },
    },
    onValueChange: { control: false, description: "Called with the index the person asked for: an arrow, a key, a swipe, a thumbnail, or code." },
    actions: {
      control: false,
      description: "Content placed in the toolbar beside the viewer's own buttons: a download link, a share button. Use ImageViewerButton for a button readable on the dark stage in every theme, and useImageViewerController() inside it to know which image is in view.",
    },
    initialFocus: { control: false, description: "An element to focus when the viewer opens, instead of the viewer itself (which keeps the keys working at once)." },
    container: { control: false, description: "Renders the viewer into a different DOM node than document.body, to keep an embedded demo inside its own box." },
    labels: { control: false, description: "The text the component supplies itself, each part replaceable. A part left undefined keeps its English default." },
    formatNumber: {
      control: false,
      description: "Writes the numbers the viewer shows (the place, the zoom) in your own digits. Callbacks keep plain numbers.",
      table: { defaultValue: { summary: "String" } },
    },
    controllerRef: { control: false, description: "Hands code outside the viewer its controls: open, close, next, previous, goTo, zoomIn, zoomOut, resetZoom, rotate and toggleFullscreen. The object never changes." },
    onOpenAutoFocus: { control: false, description: "Called when focus moves into the viewer on open. Call event.preventDefault() to choose the element to focus yourself." },
    onCloseAutoFocus: { control: false, description: "Called when focus returns to what opened the viewer on close. Call event.preventDefault() to place it yourself." },
    onEscapeKeyDown: { control: false, description: "Called when Escape is pressed. Call event.preventDefault() to keep the viewer open; see also closeOnEscape." },
    onInteractOutside: { control: false, description: "Called when something outside the viewer is pressed, such as a layer portaled out of actions. The viewer never closes for it." },
    id: { control: false, description: "Standard DOM id, applied to the viewer's panel." },
    className: { control: false, description: "Additional CSS classes, applied to the viewer's panel." },
    style: { control: false, description: "Inline styles, merged onto the viewer's panel." },
    "data-testid": { control: false, description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute on the panel." },
    "aria-label": { control: false, description: "Overrides the accessible name, which is labels.viewer by default." },
    "aria-labelledby": { control: false, description: "The id of an element that names the viewer, in place of aria-label." },
    loop: {
      control: "boolean",
      description: "Whether the arrows and keys go on from the last image to the first and back.",
      table: { defaultValue: { summary: "false" } },
    },
    minZoom: {
      control: "number",
      description: "The smallest zoom, relative to the fitted image. 1 is the floor: below it the image would only shrink inside the screen.",
      table: { defaultValue: { summary: "1" } },
    },
    maxZoom: {
      control: "number",
      description: "The largest zoom, relative to the fitted image.",
      table: { defaultValue: { summary: "4" } },
    },
    zoomStep: {
      control: "number",
      description: "How much a zoom button, + or - changes the zoom, as a factor.",
      table: { defaultValue: { summary: "1.5" } },
    },
    doubleClickZoom: {
      control: "boolean",
      description: "Whether a double click or double tap zooms in on the point and back out. The wheel and a pinch zoom whatever this is.",
      table: { defaultValue: { summary: "true" } },
    },
    rotatable: {
      control: "boolean",
      description: "Shows a rotate button in the toolbar. The image turns a quarter turn at a time; r does the same from the keyboard.",
      table: { defaultValue: { summary: "true" } },
    },
    flippable: {
      control: "boolean",
      description: "Shows a button that mirrors the image left to right, and turns on h and v (top to bottom) from the keyboard.",
      table: { defaultValue: { summary: "false" } },
    },
    tapToToggleControls: {
      control: "boolean",
      description: "Makes a single tap or click on the image hide and show the controls, counter, caption and thumbnails. A key other than Escape shows them again.",
      table: { defaultValue: { summary: "false" } },
    },
    closeOnHistoryBack: {
      control: "boolean",
      description: "Makes the browser's Back button close the viewer instead of leaving the page, by adding a history entry while it is open. Reported as reason: history. No effect with inline.",
      table: { defaultValue: { summary: "false" } },
    },
    autoPlay: {
      control: "boolean",
      description: "Steps through the images by itself: true for the default interval of 4 seconds, or { interval } in milliseconds. A pause button is always drawn while it is on. It starts paused under reduced motion, waits for each image to load and holds while one is zoomed.",
      table: { defaultValue: { summary: "false" } },
    },
    inline: {
      control: false,
      description: "Draws the viewer in the page, in the box you give it, instead of over it: no scrim, close button or focus trap, and Escape and a swipe down do nothing. trigger, open, defaultOpen, onOpenChange, container, the scrim props and closeOnHistoryBack are ignored.",
      table: { defaultValue: { summary: "false" } },
    },
    getOrigin: {
      control: false,
      description: "Called with the index in view as the viewer opens. Return the element to ease the first image in from, usually the thumbnail pressed; the image grows from its rectangle to its own. Not used under reduced motion or with inline.",
    },
    onImageLoad: { control: false, description: "Called when an image has loaded, with the image and its index." },
    onImageError: { control: false, description: "Called when an image could not be loaded, with the image and its index. The viewer shows its message and a button to try again." },
    onZoomChange: { control: false, description: "Called when the zoom of the image in view changes, relative to the fitted image (1 is all of it in view), with the index." },
    onRotationChange: { control: false, description: "Called when the image in view is turned, with its turn in degrees (0, 90, 180 or 270) and the index." },
    fullscreenButton: {
      control: "boolean",
      description: "Shows a full screen button in the toolbar, where the browser supports it. f does the same from the keyboard.",
      table: { defaultValue: { summary: "true" } },
    },
    thumbnails: {
      control: "boolean",
      description: "Shows a strip of thumbnails under the image, one tab stop with the current image marked.",
      table: { defaultValue: { summary: "false" } },
    },
    showCounter: {
      control: { type: "select", labels: { auto: "auto", true: "true", false: "false" } },
      options: ["auto", true, false],
      description: "Shows the place (3 / 12) in the toolbar. \"auto\" shows it with more than one image.",
      table: { defaultValue: { summary: '"auto"' } },
    },
    showCaptions: {
      control: "boolean",
      description: "Shows each image's caption under it.",
      table: { defaultValue: { summary: "true" } },
    },
    controls: {
      control: "select",
      options: ["auto", "hidden"],
      description: "\"auto\" draws the zoom, rotate and full screen buttons and the arrows. \"hidden\" draws only the close button; the keys and gestures still work.",
      table: { defaultValue: { summary: '"auto"' } },
    },
    swipeToDismiss: {
      control: "boolean",
      description: "Whether a downward swipe on a touch screen closes the viewer while the whole image is in view.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnOutsideClick: {
      control: "boolean",
      description: "Whether a press outside the image and its controls closes the viewer.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the viewer. In full screen the first Escape leaves full screen.",
      table: { defaultValue: { summary: "true" } },
    },
    scrimOpacity: {
      control: "select",
      options: [40, 60, 80, 90, 100],
      description: "How opaque the scrim behind the viewer is, from the opacity token scale.",
      table: { defaultValue: { summary: "90" } },
    },
    scrimBlur: {
      control: "boolean",
      description: "Blurs the page behind the scrim as well as dimming it.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction. It mirrors the arrows and the arrow keys, and is passed in, not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  args: {
    loop: false,
    minZoom: 1,
    maxZoom: 4,
    zoomStep: 1.5,
    doubleClickZoom: true,
    rotatable: true,
    flippable: false,
    fullscreenButton: true,
    tapToToggleControls: false,
    closeOnHistoryBack: false,
    autoPlay: false,
    thumbnails: false,
    showCounter: "auto",
    showCaptions: true,
    controls: "auto",
    swipeToDismiss: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    scrimOpacity: 90,
    scrimBlur: false,
    dir: "ltr",
  },
  parameters: { docs: { source: playgroundSource } },
  render: (args) => (
    <ViewerStage>
      {(container) => <ImageViewer {...args} container={container} trigger={openButton} images={sampleImages} />}
    </ViewerStage>
  ),
};

/** Several images with the arrows, the counter and a caption under each. Open it, then try the keys, the wheel and a double click. */
export const Default: Story = {
  name: "Gallery",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.basic } } },
  render: () => (
    <ViewerStage>{(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} />}</ViewerStage>
  ),
};

/** `thumbnails` adds a strip under the image: one tab stop, with the current image marked. */
export const WithThumbnails: Story = {
  name: "With thumbnails",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.thumbnails } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} thumbnails />}
    </ViewerStage>
  ),
};

/** A caption is any content, shown under its image. It is also the viewer's description, read out when it opens. */
export const WithCaptions: Story = {
  name: "With captions",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.captions } } },
  render: () => (
    <ViewerStage>
      {(container) => (
        <ImageViewer
          container={container}
          trigger={openButton}
          images={sampleImages.slice(0, 3).map((image) => ({ ...image, caption: <span>{image.caption} <em>(tap to zoom)</em></span> }))}
        />
      )}
    </ViewerStage>
  ),
};

/** With one image there are no arrows, counter or thumbnails; zoom, pan and rotate remain. */
export const SingleImage: Story = {
  name: "A single image",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.singleImage } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={<Button>View photo</Button>} images={plainImages.slice(0, 1)} />}
    </ViewerStage>
  ),
};

/** The open state and the image in view are both held outside, so other parts of the page can read and set them. */
export const Controlled: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.controlled } } },
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    return (
      <ViewerStage>
        {(container) => (
          <Stack gap={3} align="center">
            <Text>
              {open ? "Open" : "Closed"}, image {index + 1} of {sampleImages.length}
            </Text>
            <Button onClick={() => setOpen(true)}>View photos</Button>
            <ImageViewer
              container={container}
              open={open}
              onOpenChange={setOpen}
              value={index}
              onValueChange={setIndex}
              images={sampleImages}
            />
          </Stack>
        )}
      </ViewerStage>
    );
  },
};

/** A grid of thumbnails of your own opens the viewer at the one pressed, with `controllerRef`, and `getOrigin` eases the image in from that thumbnail. */
export const OpenedFromAGrid: Story = {
  name: "Opened from a grid",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.origin } } },
  render: function GridStory() {
    const viewer = useRef<ImageViewerController>(null);
    // The image eases in from the thumbnail that was pressed.
    const cells = useRef<Array<HTMLElement | null>>([]);
    return (
      <ViewerStage>
        {(container) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 6rem)", gap: "var(--dbm-space-3)" }}>
              {sampleImages.map((image, index) => (
                <button
                  key={image.id}
                  ref={(element) => {
                    cells.current[index] = element;
                  }}
                  type="button"
                  aria-label={`Open ${image.alt}`}
                  onClick={() => viewer.current?.open(index)}
                  style={{ padding: 0, border: 0, background: "none", cursor: "pointer", borderRadius: "var(--dbm-radius-md)", overflow: "hidden" }}
                >
                  <Image src={image.thumbnail ?? image.src} alt="" width="100%" aspectRatio={1} objectFit="cover" />
                </button>
              ))}
            </div>
            <ImageViewer container={container} controllerRef={viewer} images={sampleImages} thumbnails getOrigin={(index) => cells.current[index]} />
          </>
        )}
      </ViewerStage>
    );
  },
};

/** `loop` carries the arrows and keys on from the last image to the first, and back. */
export const Looping: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.loop } } },
  render: () => (
    <ViewerStage>{(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} loop />}</ViewerStage>
  ),
};

/** `controls="hidden"` leaves only the close button. The keys and gestures still work, so this suits a kiosk or an embed. */
export const ControlsHidden: Story = {
  name: "Controls hidden",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.controlsHidden } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} controls="hidden" rotatable={false} />}
    </ViewerStage>
  ),
};

function CopyAddress() {
  const viewer = useImageViewerController();
  return (
    <ImageViewerButton label="Copy name" onClick={() => void navigator.clipboard?.writeText(`image-${viewer.value + 1}`)}>
      Copy name
    </ImageViewerButton>
  );
}

/** `actions` puts content of your own in the toolbar. `ImageViewerButton` is readable on the dark stage in every theme, and `useImageViewerController()` inside it says which image is in view. */
export const WithActions: Story = {
  name: "With toolbar actions",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.actions } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} actions={<CopyAddress />} />}
    </ViewerStage>
  ),
};

/** `dir="rtl"` mirrors the arrows and the arrow keys. */
export const RightToLeft: Story = {
  name: "Right to left",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.rightToLeft } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} dir="rtl" thumbnails />}
    </ViewerStage>
  ),
};

/** An image that cannot be loaded shows a message in its place; the others still open. */
export const LoadFailure: Story = {
  name: "An image that fails to load",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.basic } } },
  render: () => (
    <ViewerStage>{(container) => <ImageViewer container={container} trigger={openButton} images={brokenImages} />}</ViewerStage>
  ),
};

/** `tapToToggleControls` hides the controls with a tap on the image, for an uncluttered view; any key but Escape brings them back. */
export const TapToHide: Story = {
  name: "Tap to hide the controls",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.tapToHide } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} tapToToggleControls />}
    </ViewerStage>
  ),
};

/** `flippable` adds a button that mirrors the image, with h and v on the keyboard; rotate has a button each way. */
export const Flippable: Story = {
  name: "Rotate and flip",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.flip } } },
  render: () => (
    <ViewerStage>{(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} flippable />}</ViewerStage>
  ),
};

/** `autoPlay` steps through the images by itself. Its pause button is always drawn, it holds while an image is zoomed, and it starts paused under reduced motion. */
export const Slideshow: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.slideshow } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} autoPlay={{ interval: 3000 }} loop />}
    </ViewerStage>
  ),
};

/** `closeOnHistoryBack` makes the Back button close the viewer instead of leaving the page. */
export const ClosesOnBack: Story = {
  name: "Closes on the Back button",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.history } } },
  render: () => (
    <ViewerStage>
      {(container) => <ImageViewer container={container} trigger={openButton} images={sampleImages} closeOnHistoryBack />}
    </ViewerStage>
  ),
};

/** `inline` draws the viewer in the page, in the box you give it: no scrim, no close button, no focus trap. Everything else works the same. */
export const Inline: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.inline } } },
  render: () => (
    <div style={{ blockSize: "28rem" }}>
      <ImageViewer inline aria-label="Photos" images={sampleImages} thumbnails />
    </div>
  ),
};

/** A long set draws only the thumbnails in view and a few either side, so 500 images cost no more than 20. */
export const ManyImages: Story = {
  name: "A long set",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.many } } },
  render: () => (
    <div style={{ blockSize: "28rem" }}>
      <ImageViewer inline aria-label="Five hundred photos" images={manyImages} thumbnails defaultValue={250} />
    </div>
  ),
};

/** Every word the viewer supplies is a label, and a label with numbers is a function of plain numbers. */
export const Translated: Story = {
  name: "Translated labels",
  argTypes: noControls,
  parameters: { docs: { source: { code: imageViewerSnippets.labels } } },
  render: () => (
    <ViewerStage>
      {(container) => (
        <ImageViewer
          container={container}
          trigger={<Button>Voir les photos</Button>}
          images={sampleImages}
          labels={{
            viewer: "Visionneuse d’images",
            close: "Fermer",
            previous: "Image précédente",
            next: "Image suivante",
            position: (n, total) => `${n} sur ${total}`,
          }}
        />
      )}
    </ViewerStage>
  ),
};

/** Opens the viewer, steps with the keyboard, zooms, and closes with Escape. A hidden test: nothing here is shown in the sidebar. */
export const KeyboardInteraction: Story = {
  ...Default,
  name: "Keyboard — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "View photos" }));
    const dialog = await canvas.findByRole("dialog", { name: "Image viewer" });
    await waitFor(() => expect(dialog).toHaveFocus());
    await expect(within(dialog).getByTestId("image-viewer-counter")).toHaveTextContent("1 / 6");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(within(dialog).getByTestId("image-viewer-counter")).toHaveTextContent("2 / 6"));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(within(dialog).getByTestId("image-viewer-counter")).toHaveTextContent("6 / 6"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
  },
};
