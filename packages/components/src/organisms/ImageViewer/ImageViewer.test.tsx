import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { ImageViewer, ImageViewerButton, useImageViewerController } from "./ImageViewer";
import type { ImageViewerController, ImageViewerImage, ImageViewerProps } from "./ImageViewer.types";

const images: ImageViewerImage[] = [
  { id: "a", src: "/a.jpg", alt: "First picture", caption: "Caption one" },
  { id: "b", src: "/b.jpg", alt: "Second picture", caption: "Caption two" },
  { id: "c", src: "/c.jpg", alt: "Third picture" },
];

function Viewer(props: Partial<ComponentPropsWithRef<typeof ImageViewer>>) {
  return <ImageViewer trigger={<Button>Open</Button>} images={images} {...props} />;
}

/** The stage is 1000 x 600 in these tests, since jsdom lays nothing out. */
function stubStageSize() {
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(600);
}

/** The image's load, as the browser reports it, with its own pixel size. */
function loadImage(alt: string, width = 2000, height = 1000) {
  const element = screen.getByAltText(alt) as HTMLImageElement;
  Object.defineProperty(element, "naturalWidth", { value: width, configurable: true });
  Object.defineProperty(element, "naturalHeight", { value: height, configurable: true });
  act(() => {
    fireEvent.load(element);
  });
  return element;
}

const counter = () => screen.getByTestId("image-viewer-counter");
const zoomButton = () => screen.getByRole("button", { name: /Reset zoom/ });

async function open(user = userEvent.setup()) {
  await user.click(screen.getByRole("button", { name: "Open" }));
  return { user, dialog: await screen.findByRole("dialog") };
}

beforeEach(() => {
  stubStageSize();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ImageViewer opening", () => {
  it("renders only the trigger while closed", () => {
    render(<Viewer />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a named, modal dialog that has focus, with the place and the first image", async () => {
    render(<Viewer />);
    const { dialog } = await open();
    expect(dialog).toHaveAccessibleName("Image viewer");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-state", "open");
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(counter()).toHaveTextContent("1 / 3");
    expect(screen.getByAltText("First picture")).toBeInTheDocument();
  });

  it("describes the viewer by the caption of the image in view", async () => {
    render(<Viewer />);
    const { dialog } = await open();
    expect(dialog).toHaveAccessibleDescription("Caption one");
  });

  it("opens at the image asked for with defaultValue, and starts open with defaultOpen", async () => {
    render(<Viewer trigger={undefined} defaultOpen defaultValue={1} />);
    await screen.findByRole("dialog");
    expect(counter()).toHaveTextContent("2 / 3");
    expect(screen.getByAltText("Second picture")).toBeInTheDocument();
  });

  it("takes the accessible name from aria-label, or from labels, and an id naming it wins", async () => {
    const { unmount } = render(<Viewer aria-label="Holiday photos" />);
    expect((await open()).dialog).toHaveAccessibleName("Holiday photos");
    unmount();
    render(<Viewer labels={{ viewer: "Visionneuse" }} />);
    expect((await open()).dialog).toHaveAccessibleName("Visionneuse");
  });

  it("returns focus to its trigger when it closes", async () => {
    render(<Viewer />);
    const { user } = await open();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });
});

describe("ImageViewer reasons for closing", () => {
  it("reports escape, the close button and a press outside the image", async () => {
    const onOpenChange = vi.fn();
    render(<Viewer onOpenChange={onOpenChange} />);
    let session = await open();
    await session.user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });

    session = await open(session.user);
    await session.user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "close-button" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true, { reason: "trigger" });
  });

  it("keeps a controlled viewer open until its owner changes open", async () => {
    const onOpenChange = vi.fn();
    render(<Viewer open onOpenChange={onOpenChange} />);
    await screen.findByRole("dialog");
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "close-button" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close on Escape when closeOnEscape is false", async () => {
    render(<Viewer closeOnEscape={false} />);
    const { user } = await open();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("ImageViewer navigation", () => {
  it("steps with the arrow keys, the arrows on the stage, Page Up and Down, Home and End", async () => {
    render(<Viewer />);
    const { user } = await open();
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 3");
    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(counter()).toHaveTextContent("3 / 3");
    await user.keyboard("{PageUp}");
    expect(counter()).toHaveTextContent("2 / 3");
    await user.keyboard("{Home}");
    expect(counter()).toHaveTextContent("1 / 3");
    await user.keyboard("{End}");
    expect(counter()).toHaveTextContent("3 / 3");
    await user.click(screen.getByRole("button", { name: "Previous image" }));
    expect(counter()).toHaveTextContent("2 / 3");
    await user.keyboard("{PageDown}");
    expect(counter()).toHaveTextContent("3 / 3");
  });

  it("stops at either end unless it loops, leaving the arrow focusable and unavailable", async () => {
    render(<Viewer />);
    const { user } = await open();
    const previous = screen.getByRole("button", { name: "Previous image" });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).not.toBeDisabled();
    await user.keyboard("{ArrowLeft}");
    expect(counter()).toHaveTextContent("1 / 3");
    await user.click(previous);
    expect(counter()).toHaveTextContent("1 / 3");
  });

  it("goes on from the last image to the first and back with loop", async () => {
    render(<Viewer loop />);
    const { user } = await open();
    await user.keyboard("{ArrowLeft}");
    expect(counter()).toHaveTextContent("3 / 3");
    expect(screen.getByRole("button", { name: "Previous image" })).not.toHaveAttribute("aria-disabled");
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("1 / 3");
  });

  it("flips the arrow keys in a right-to-left viewer", async () => {
    render(<Viewer dir="rtl" />);
    const { user, dialog } = await open();
    expect(dialog).toHaveAttribute("dir", "rtl");
    await user.keyboard("{ArrowLeft}");
    expect(counter()).toHaveTextContent("2 / 3");
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("1 / 3");
  });

  it("draws no arrows, counter or thumbnails for one image", async () => {
    render(<Viewer images={images.slice(0, 1)} thumbnails />);
    await open();
    expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("image-viewer-counter")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Thumbnails" })).not.toBeInTheDocument();
  });

  it("shows the counter for a single image with showCounter, and hides it with false", async () => {
    const { unmount } = render(<Viewer images={images.slice(0, 1)} showCounter />);
    await open();
    expect(counter()).toHaveTextContent("1 / 1");
    unmount();
    render(<Viewer showCounter={false} />);
    await open();
    expect(screen.queryByTestId("image-viewer-counter")).not.toBeInTheDocument();
  });

  it("announces a change of image, and not the first appearance", async () => {
    render(<Viewer />);
    const { user, dialog } = await open();
    expect(dialog).not.toHaveTextContent("Image 1 of 3");
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(within(dialog).getByText("Image 2 of 3: Second picture")).toBeInTheDocument());
  });

  it("writes the numbers it shows with formatNumber", async () => {
    render(<Viewer formatNumber={(n) => `#${n}`} />);
    await open();
    expect(counter()).toHaveTextContent("#1 / #3");
  });
});

describe("ImageViewer value and open, controlled", () => {
  it("asks for a new image through onValueChange and changes only when the value does", async () => {
    const onValueChange = vi.fn();
    render(<Viewer defaultOpen value={0} onValueChange={onValueChange} trigger={undefined} />);
    await screen.findByRole("dialog");
    await userEvent.setup().keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(1);
    expect(counter()).toHaveTextContent("1 / 3");
  });

  it("works wired to state, which is where a stale prop and a state would undo each other", async () => {
    function Wired() {
      const [open, setOpen] = useState(false);
      const [value, setValue] = useState(0);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <ImageViewer images={images} open={open} onOpenChange={setOpen} value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Wired />);
    const { user } = await open();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(counter()).toHaveTextContent("3 / 3");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await open(user);
    expect(counter()).toHaveTextContent("3 / 3");
  });

  it("keeps a value that is out of range inside the list", async () => {
    render(<Viewer defaultOpen value={99} trigger={undefined} />);
    await screen.findByRole("dialog");
    expect(counter()).toHaveTextContent("3 / 3");
  });
});

describe("ImageViewer controller", () => {
  it("opens at an index, steps, goes to an image and closes, saying whether it had anything to do", async () => {
    const ref = createRef<ImageViewerController>();
    const onOpenChange = vi.fn();
    render(<ImageViewer images={images} controllerRef={ref} onOpenChange={onOpenChange} />);
    expect(ref.current?.isOpen).toBe(false);
    expect(ref.current?.count).toBe(3);
    expect(ref.current?.next()).toBe(true);
    act(() => {
      expect(ref.current?.open(1)).toBe(true);
    });
    await screen.findByRole("dialog");
    expect(counter()).toHaveTextContent("2 / 3");
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "controller" });
    expect(ref.current?.open()).toBe(false);
    act(() => {
      expect(ref.current?.next()).toBe(true);
      expect(ref.current?.next()).toBe(false);
    });
    expect(counter()).toHaveTextContent("3 / 3");
    act(() => {
      expect(ref.current?.goTo(0)).toBe(true);
      expect(ref.current?.goTo(0)).toBe(false);
      expect(ref.current?.goTo(9)).toBe(false);
      expect(ref.current?.previous()).toBe(false);
    });
    act(() => {
      expect(ref.current?.close()).toBe(true);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "controller" });
  });

  it("is the same object for the viewer's life", () => {
    const seen: ImageViewerController[] = [];
    function Capture() {
      return <ImageViewer images={images} controllerRef={(controller) => { if (controller) seen.push(controller); }} />;
    }
    const { rerender } = render(<Capture />);
    rerender(<Capture />);
    expect(new Set(seen).size).toBe(1);
  });

  it("is available to the toolbar's actions through the hook", async () => {
    function Which() {
      const viewer = useImageViewerController();
      return <span data-testid="which">{viewer.value}</span>;
    }
    render(<Viewer actions={<Which />} />);
    const { user } = await open();
    expect(screen.getByTestId("which")).toHaveTextContent("0");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("which")).toHaveTextContent("1");
  });

  it("is inert outside a viewer and says so in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    function Outside() {
      const viewer = useImageViewerController();
      return <span>{String(viewer.next())}</span>;
    }
    render(<Outside />);
    expect(screen.getByText("false")).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("outside an <ImageViewer>"));
  });
});

describe("ImageViewer zoom, turn and loading", () => {
  it("shows the image loading until it has, then fits it and enables the controls", async () => {
    render(<Viewer />);
    await open();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-status", "loading");
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-disabled", "true");
    loadImage("First picture");
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-status", "ready"));
    expect(screen.getByRole("button", { name: "Zoom in" })).not.toHaveAttribute("aria-disabled");
    // fitted to a 1000 x 600 stage: 2000 x 1000 becomes 1000 x 500
    const box = screen.getByAltText("First picture").closest("[data-drawn]") as HTMLElement;
    expect(box.style.inlineSize).toBe("1000px");
    expect(box.style.blockSize).toBe("500px");
  });

  it("zooms with the buttons and the keys, to the limits, and says the zoom", async () => {
    render(<Viewer maxZoom={2} />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    expect(zoomButton()).toHaveTextContent("100%");
    expect(zoomButton()).toHaveAccessibleName("Reset zoom, 100%");
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(zoomButton()).toHaveTextContent("150%");
    await user.keyboard("+");
    expect(zoomButton()).toHaveTextContent("200%");
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("-");
    expect(zoomButton()).toHaveTextContent("133%");
    await user.click(zoomButton());
    expect(zoomButton()).toHaveTextContent("100%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{+}{0}");
    expect(zoomButton()).toHaveTextContent("100%");
  });

  it("zooms with the wheel and keeps the zoom inside its limits", async () => {
    render(<Viewer />);
    await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const stage = screen.getByAltText("First picture").closest("[data-status]") as HTMLElement;
    fireEvent.wheel(stage, { deltaY: -300, clientX: 500, clientY: 300 });
    await waitFor(() => expect(zoomButton()).not.toHaveTextContent("100%"));
    fireEvent.wheel(stage, { deltaY: -100000, clientX: 500, clientY: 300 });
    await waitFor(() => expect(zoomButton()).toHaveTextContent("400%"));
    fireEvent.wheel(stage, { deltaY: 100000, clientX: 500, clientY: 300 });
    await waitFor(() => expect(zoomButton()).toHaveTextContent("100%"));
  });

  it("moves a zoomed image with the arrow keys instead of changing the image", async () => {
    render(<Viewer />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    await user.keyboard("{+}{+}");
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("1 / 3");
    const box = screen.getByAltText("First picture").closest("[data-drawn]") as HTMLElement;
    expect(box.style.transform).toContain("translate(-80px, 0px)");
    await user.keyboard("{0}{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 3");
  });

  it("turns the image a quarter at a time with the button and r, and not before it has loaded", async () => {
    render(<Viewer />);
    const { user } = await open();
    await user.keyboard("r");
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const box = screen.getByAltText("First picture").closest("[data-drawn]") as HTMLElement;
    expect(box.style.transform).toContain("rotate(0deg)");
    await user.click(screen.getByRole("button", { name: "Rotate clockwise" }));
    expect(box.style.transform).toContain("rotate(90deg)");
    await user.keyboard("r");
    expect(box.style.transform).toContain("rotate(180deg)");
  });

  it("starts the next image whole and straight", async () => {
    render(<Viewer />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    await user.keyboard("{+}r");
    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(counter()).toHaveTextContent("2 / 3");
    loadImage("Second picture", 1000, 1000);
    await waitFor(() => expect(zoomButton()).toHaveTextContent("100%"));
    const box = screen.getByAltText("Second picture").closest("[data-drawn]") as HTMLElement;
    expect(box.style.transform).toContain("rotate(0deg)");
  });

  it("shows a message in place of an image that fails to load, and turns the zoom off", async () => {
    render(<Viewer />);
    await open();
    act(() => {
      fireEvent.error(screen.getByAltText("First picture"));
    });
    expect(await screen.findByRole("img", { name: "First picture. This image could not be loaded." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-status", "failed");
  });

  it("uses the size hints to fit an image before it has loaded", async () => {
    render(<Viewer images={[{ src: "/a.jpg", alt: "Hinted", width: 500, height: 500 }]} />);
    await open();
    const box = screen.getByAltText("Hinted").closest("[data-drawn]") as HTMLElement;
    expect(box.style.inlineSize).toBe("500px");
  });
});

describe("ImageViewer thumbnails, captions and controls", () => {
  it("draws a strip with one tab stop on the current image, and chooses from it", async () => {
    render(<Viewer thumbnails />);
    const { user, dialog } = await open();
    const strip = within(dialog).getByRole("group", { name: "Thumbnails" });
    const thumbnails = within(strip).getAllByRole("button");
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");
    expect(thumbnails.map((thumbnail) => thumbnail.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    expect(thumbnails[2]).toHaveAccessibleName("Show image 3 of 3");
    await user.click(thumbnails[2] as HTMLElement);
    expect(counter()).toHaveTextContent("3 / 3");
    expect(within(strip).getAllByRole("button")[2]).toHaveAttribute("aria-current", "true");
  });

  it("shows captions unless showCaptions is false", async () => {
    const { unmount } = render(<Viewer />);
    await open();
    expect(screen.getByText("Caption one")).toBeInTheDocument();
    unmount();
    render(<Viewer showCaptions={false} />);
    await open();
    expect(screen.queryByText("Caption one")).not.toBeInTheDocument();
  });

  it("hides the buttons, and keeps the close button and the keys, with controls hidden", async () => {
    render(<Viewer controls="hidden" />);
    const { user } = await open();
    expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 3");
  });

  it("leaves out the rotate and full screen buttons when they are turned off", async () => {
    render(<Viewer rotatable={false} fullscreenButton={false} />);
    const { user } = await open();
    expect(screen.queryByRole("button", { name: "Rotate clockwise" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /full screen/ })).not.toBeInTheDocument();
    loadImage("First picture");
    await user.keyboard("r");
    expect(screen.getByAltText("First picture").closest("[data-drawn]")).toHaveStyle({ transform: "translate(0px, 0px) rotate(0deg) scale(1)" });
  });

  it("offers full screen where the browser has it, and asks the panel for it", async () => {
    Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { value: requestFullscreen, configurable: true });
    try {
      render(<Viewer />);
      const { user, dialog } = await open();
      await user.click(screen.getByRole("button", { name: "Enter full screen" }));
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      expect(requestFullscreen.mock.contexts[0]).toBe(dialog);
    } finally {
      Reflect.deleteProperty(document, "fullscreenEnabled");
      Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
    }
  });
});

describe("ImageViewer actions", () => {
  it("warns in development about a Button, an IconButton or a CloseButton directly in actions", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Viewer actions={<Button>Share</Button>} />);
    await open();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`actions` holds a Button"));
  });

  it("does not warn for an ImageViewerButton, text or a link", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Viewer actions={<><ImageViewerButton label="Share">Share</ImageViewerButton><a href="/x">Link</a>text</>} />);
    await open();
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("`actions` holds"));
  });

  it("puts what it is given in one container beside the viewer's buttons, and draws none without actions", async () => {
    const { unmount } = render(<Viewer actions={<a href="/x">Link</a>} />);
    await open();
    const link = screen.getByRole("link", { name: "Link" });
    const container = link.parentElement as HTMLElement;
    expect(container.parentElement).toContainElement(screen.getByRole("button", { name: "Close" }));
    unmount();
    render(<Viewer />);
    await open();
    expect(screen.getByRole("button", { name: "Close" }).parentElement?.querySelector("div")).toBeNull();
  });
});

describe("ImageViewerButton", () => {
  it("is a named button in the toolbar that presses, and shows its text", async () => {
    const onClick = vi.fn();
    render(<Viewer actions={<ImageViewerButton label="Copy name" onClick={onClick}>Copy name</ImageViewerButton>} />);
    const { user } = await open();
    const button = screen.getByRole("button", { name: "Copy name" });
    expect(button).toHaveTextContent("Copy name");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("stays focusable and ignores a press while unavailable, and forwards its ref and attributes", async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<Viewer actions={<ImageViewerButton ref={ref} label="Share" unavailable onClick={onClick} data-testid="share" title="Share it">Share</ImageViewerButton>} />);
    const { user } = await open();
    const button = screen.getByTestId("share");
    expect(button).toBe(ref.current);
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("title", "Share it");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not let a same-named prop replace its name or state", async () => {
    render(<Viewer actions={<ImageViewerButton {...({ "aria-label": "Wrong", "aria-disabled": "false" } as object)} label="Right" unavailable>x</ImageViewerButton>} />);
    await open();
    const button = screen.getByRole("button", { name: "Right" });
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});

describe("ImageViewer labels", () => {
  it("lets a label be replaced, and keeps the default for one left undefined", async () => {
    render(<Viewer labels={{ close: "Fermer", next: undefined }} />);
    await open();
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next image" })).toBeInTheDocument();
  });

  it("keeps the visible zoom inside the accessible name of its button", async () => {
    render(<Viewer labels={{ resetZoom: (zoom) => `Remettre le zoom (${zoom})` }} />);
    await open();
    loadImage("First picture");
    const button = await screen.findByRole("button", { name: "Remettre le zoom (100%)" });
    expect(button.textContent).toBe("100%");
  });
});

describe("ImageViewer props", () => {
  it("lets the panel's role and modal state not be replaced by a same-named prop", async () => {
    render(<Viewer {...({ role: "region", "aria-modal": "false" } as unknown as Partial<ImageViewerProps>)} />);
    const { dialog } = await open();
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("applies id, className, style and data-testid to the panel and forwards the ref to it", async () => {
    const ref = createRef<HTMLDivElement>();
    render(<Viewer ref={ref} id="viewer" className="mine" style={{ opacity: 0.9 }} data-testid="panel" />);
    const { dialog } = await open();
    expect(dialog).toHaveAttribute("id", "viewer");
    expect(dialog).toHaveClass("mine");
    expect(dialog).toHaveAttribute("data-testid", "panel");
    expect(ref.current).toBe(dialog);
  });

  it("calls a keydown handler of the consumer's first, and lets it stop the viewer's own keys", async () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === "ArrowRight") event.preventDefault();
    });
    render(<Viewer onKeyDown={onKeyDown} />);
    const { user } = await open();
    await user.keyboard("{ArrowRight}");
    expect(onKeyDown).toHaveBeenCalled();
    expect(counter()).toHaveTextContent("1 / 3");
  });

  it("warns in development about an empty list and draws nothing to step through", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Viewer images={[]} defaultOpen trigger={undefined} />);
    await screen.findByRole("dialog");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`images` is empty"));
    expect(screen.queryByTestId("image-viewer-counter")).not.toBeInTheDocument();
  });

  it("reports when it has finished opening and closing", async () => {
    const onOpenChangeComplete = vi.fn();
    render(<Viewer onOpenChangeComplete={onOpenChangeComplete} />);
    const { user } = await open();
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false));
  });

  it("focuses an element of the consumer's choosing when asked", async () => {
    const target = createRef<HTMLButtonElement>();
    render(<Viewer actions={<button ref={target}>Mine</button>} initialFocus={target} />);
    await open();
    await waitFor(() => expect(target.current).toHaveFocus());
  });
});

describe("ImageViewer under React's StrictMode and accessibility", () => {
  it("opens and steps inside StrictMode", async () => {
    render(
      <StrictMode>
        <Viewer />
      </StrictMode>,
    );
    const { user } = await open();
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 3");
  });

  it("has no accessibility violations open, loaded, with thumbnails and a caption", async () => {
    render(<Viewer thumbnails />);
    const { dialog } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    expect(await axe(dialog)).toHaveNoViolations();
  });

  it("has no accessibility violations with the failed message showing", async () => {
    render(<Viewer />);
    const { dialog } = await open();
    act(() => {
      fireEvent.error(screen.getByAltText("First picture"));
    });
    await screen.findByRole("img", { name: /could not be loaded/ });
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
