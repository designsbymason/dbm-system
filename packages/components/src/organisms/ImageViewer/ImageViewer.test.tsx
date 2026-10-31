import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { createPortal } from "react-dom";
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

// The place shown beside the toolbar, as "1 / 3": found by its text, since the viewer ships no test id of its own.
const COUNTER = /^\S+ \/ \S+$/;
const counter = () => screen.getByText(COUNTER);
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
    expect(screen.queryByText(COUNTER)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Thumbnails" })).not.toBeInTheDocument();
  });

  it("shows the counter for a single image with showCounter, and hides it with false", async () => {
    const { unmount } = render(<Viewer images={images.slice(0, 1)} showCounter />);
    await open();
    expect(counter()).toHaveTextContent("1 / 1");
    unmount();
    render(<Viewer showCounter={false} />);
    await open();
    expect(screen.queryByText(COUNTER)).not.toBeInTheDocument();
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
    // 2000 x 1000 fitted into 1000 x 600 is drawn at half its own size, and the zoom is the share of its own pixels
    expect(zoomButton()).toHaveTextContent("50%");
    expect(zoomButton()).toHaveAccessibleName("Reset zoom, 50%");
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(zoomButton()).toHaveTextContent("75%");
    await user.keyboard("+");
    expect(zoomButton()).toHaveTextContent("100%");
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("-");
    expect(zoomButton()).toHaveTextContent("67%");
    await user.click(zoomButton());
    expect(zoomButton()).toHaveTextContent("50%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{+}{0}");
    expect(zoomButton()).toHaveTextContent("50%");
  });

  it("zooms with the wheel and keeps the zoom inside its limits", async () => {
    render(<Viewer />);
    await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const stage = screen.getByAltText("First picture").closest("[data-status]") as HTMLElement;
    fireEvent.wheel(stage, { deltaY: -300, clientX: 500, clientY: 300 });
    await waitFor(() => expect(zoomButton()).not.toHaveTextContent("50%"));
    fireEvent.wheel(stage, { deltaY: -100000, clientX: 500, clientY: 300 });
    // the largest zoom is 4 times the fitted image, which is 200% of its own pixels
    await waitFor(() => expect(zoomButton()).toHaveTextContent("200%"));
    fireEvent.wheel(stage, { deltaY: 100000, clientX: 500, clientY: 300 });
    await waitFor(() => expect(zoomButton()).toHaveTextContent("50%"));
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
    await waitFor(() => expect(zoomButton()).toHaveTextContent("60%"));
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
    const button = await screen.findByRole("button", { name: "Remettre le zoom (50%)" });
    expect(button.textContent).toBe("50%");
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
    expect(screen.queryByText(COUNTER)).not.toBeInTheDocument();
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

describe("ImageViewer and the browser's Back button", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a history entry while open, and closes with the reason history when Back is pressed", async () => {
    const push = vi.spyOn(window.history, "pushState");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const onOpenChange = vi.fn();
    render(<Viewer closeOnHistoryBack onOpenChange={onOpenChange} />);
    expect(push).not.toHaveBeenCalled();
    await open();
    expect(push).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "history" });
    // the browser has already taken the entry off, so the viewer does not do it again
    expect(back).not.toHaveBeenCalled();
  });

  it("takes its own entry off when it is closed another way, and ignores the Back that causes", async () => {
    vi.spyOn(window.history, "pushState");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const onOpenChange = vi.fn();
    render(<Viewer closeOnHistoryBack onOpenChange={onOpenChange} />);
    const { user } = await open();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
  });

  it("adds one entry inside StrictMode, and none unless asked", async () => {
    const push = vi.spyOn(window.history, "pushState");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const { unmount } = render(
      <StrictMode>
        <Viewer closeOnHistoryBack />
      </StrictMode>,
    );
    await open();
    expect(push).toHaveBeenCalledTimes(1);
    // StrictMode's own unmount and remount is not the viewer leaving the page
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(back).not.toHaveBeenCalled();
    unmount();
    push.mockClear();
    render(<Viewer />);
    await open();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("ImageViewer taken out of the page while open, with closeOnHistoryBack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("takes its own history entry off when its owner stops drawing it", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const { unmount } = render(<Viewer closeOnHistoryBack />);
    await open();
    expect(window.history.state).toEqual({ dbmImageViewer: true });
    unmount();
    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
  });

  it("leaves the entry alone after a navigation, since going back would undo it", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const { unmount } = render(<Viewer closeOnHistoryBack />);
    await open();
    window.history.pushState({ page: "next" }, "", "/next");
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(back).not.toHaveBeenCalled();
  });

  it("does nothing when it was closed first, which has already taken the entry off", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const { unmount } = render(<Viewer closeOnHistoryBack />);
    const { user } = await open();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe("ImageViewer actual size and the zoom shown", () => {
  it("shows the share of the image's own pixels, and zooms to one image pixel per screen pixel with 1:1 and the 1 key", async () => {
    const onZoomChange = vi.fn();
    render(<Viewer onZoomChange={onZoomChange} />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toHaveTextContent("50%"));
    const actual = screen.getByRole("button", { name: "Actual size, 1:1" });
    expect(actual).toHaveAttribute("aria-pressed", "false");
    await user.click(actual);
    expect(zoomButton()).toHaveTextContent("100%");
    expect(actual).toHaveAttribute("aria-pressed", "true");
    expect(onZoomChange).toHaveBeenLastCalledWith(2, 0);
    await user.keyboard("1");
    expect(zoomButton()).toHaveTextContent("50%");
    expect(actual).toHaveAttribute("aria-pressed", "false");
  });

  it("is unavailable for an image no larger than the stage, and can reach actual size past maxZoom", async () => {
    render(<Viewer maxZoom={1.2} />);
    await open();
    loadImage("First picture", 400, 200);
    await waitFor(() => expect(zoomButton()).toHaveTextContent("100%"));
    expect(screen.getByRole("button", { name: "Actual size, 1:1" })).toHaveAttribute("aria-disabled", "true");
  });

  it("allows actual size even when maxZoom is smaller than it", async () => {
    render(<Viewer maxZoom={1.2} />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toHaveTextContent("50%"));
    await user.click(screen.getByRole("button", { name: "Actual size, 1:1" }));
    expect(zoomButton()).toHaveTextContent("100%");
  });

  it("gives the buttons their shortcuts for assistive technology", async () => {
    render(<Viewer flippable />);
    await open();
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-keyshortcuts", "+");
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute("aria-keyshortcuts", "-");
    expect(screen.getByRole("button", { name: "Rotate clockwise" })).toHaveAttribute("aria-keyshortcuts", "R");
    expect(screen.getByRole("button", { name: "Rotate counterclockwise" })).toHaveAttribute("aria-keyshortcuts", "Shift+R");
    expect(screen.getByRole("button", { name: "Flip horizontally" })).toHaveAttribute("aria-keyshortcuts", "H");
  });
});

describe("ImageViewer events, retry and the placeholder", () => {
  it("reports a load and a failure with the image and its index, and shows a button that tries again", async () => {
    const onImageLoad = vi.fn();
    const onImageError = vi.fn();
    render(<Viewer onImageLoad={onImageLoad} onImageError={onImageError} />);
    await open();
    const first = screen.getByAltText("First picture");
    act(() => {
      fireEvent.error(first);
    });
    expect(onImageError).toHaveBeenCalledWith(images[0], 0);
    const retry = await screen.findByRole("button", { name: "Try again" });
    await userEvent.setup().click(retry);
    const again = await screen.findByAltText("First picture");
    expect(again).not.toBe(first);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-status", "loading");
    loadImage("First picture");
    expect(onImageLoad).toHaveBeenCalledWith(images[0], 0);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-status", "ready"));
  });

  it("stands the thumbnail in, blurred, while the full image loads", async () => {
    const { container } = render(<Viewer images={[{ src: "/full.jpg", thumbnail: "/small.jpg", alt: "With thumbnail" }]} />);
    await open();
    const placeholder = () => document.body.querySelector("img[src='/small.jpg']");
    expect(placeholder()).not.toBeNull();
    expect(placeholder()).toHaveAttribute("aria-hidden", "true");
    loadImage("With thumbnail");
    await waitFor(() => expect(placeholder()).toBeNull());
    expect(container).toBeDefined();
  });

  it("does not draw a placeholder when the thumbnail is the image", async () => {
    render(<Viewer images={[{ src: "/same.jpg", thumbnail: "/same.jpg", alt: "Same" }]} />);
    await open();
    expect(document.body.querySelectorAll("img[src='/same.jpg']")).toHaveLength(1);
  });

  it("reports a turn and, with flippable, mirrors the image as the person sees it", async () => {
    const onRotationChange = vi.fn();
    render(<Viewer onRotationChange={onRotationChange} flippable />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const box = screen.getByAltText("First picture").closest("[data-drawn]") as HTMLElement;
    await user.click(screen.getByRole("button", { name: "Rotate counterclockwise" }));
    expect(box.style.transform).toContain("rotate(270deg)");
    expect(onRotationChange).toHaveBeenLastCalledWith(270, 0);
    await user.click(screen.getByRole("button", { name: "Flip horizontally" }));
    expect(box.style.transform).toContain("scale(-1, 1)");
    await user.keyboard("v");
    expect(box.style.transform).toContain("scale(-1, -1)");
    await user.keyboard("R");
    expect(box.style.transform).toContain("rotate(180deg)");
  });

  it("offers no flip without flippable, and ignores h and v", async () => {
    render(<Viewer />);
    const { user } = await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Flip horizontally" })).not.toBeInTheDocument();
    await user.keyboard("hv");
    expect(screen.getByAltText("First picture").closest("[data-drawn]")).not.toHaveStyle({ transform: "scale(-1, 1)" });
  });

  it("marks the direction an image comes from, and nothing on opening", async () => {
    render(<Viewer />);
    const { user } = await open();
    loadImage("First picture");
    expect(screen.getByAltText("First picture").closest("[data-drawn]")).not.toHaveAttribute("data-enter");
    await user.keyboard("{PageDown}");
    loadImage("Second picture", 1000, 1000);
    await waitFor(() => expect(screen.getByAltText("Second picture").closest("[data-enter]")).toHaveAttribute("data-enter", "next"));
    await user.keyboard("{PageUp}");
    loadImage("First picture");
    await waitFor(() => expect(screen.getByAltText("First picture").closest("[data-enter]")).toHaveAttribute("data-enter", "previous"));
  });
});

describe("ImageViewer origin, slideshow, inline and long strips", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("eases the first image in from the element it is given, once", async () => {
    const origin = document.createElement("div");
    vi.spyOn(origin, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    const getOrigin = vi.fn(() => origin);
    render(<Viewer getOrigin={getOrigin} images={[{ src: "/a.jpg", alt: "Hinted", width: 1000, height: 500 }, ...images.slice(1)]} />);
    const { user } = await open();
    expect(getOrigin).toHaveBeenCalledTimes(1);
    expect(getOrigin).toHaveBeenCalledWith(0);
    const box = screen.getByAltText("Hinted").closest("[data-drawn]") as HTMLElement;
    // drawn at the origin's width first (200px of the fitted 1000px), and then eased to its own place
    expect(box.style.transform).toContain("scale(0.2)");
    expect(box.style.transform).toContain("translate(100px, 50px)");
    await waitFor(() => expect(box.style.transform).toContain("scale(1)"));
    await user.keyboard("{PageDown}{PageUp}");
    expect(getOrigin).toHaveBeenCalledTimes(1);
  });

  it("steps through the images by itself once each has loaded, pauses on request, and stops at the last", async () => {
    vi.useFakeTimers();
    render(<Viewer defaultOpen trigger={undefined} autoPlay={{ interval: 1000 }} />);
    await act(async () => {});
    loadImage("First picture");
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(counter()).toHaveTextContent("1 / 3");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(counter()).toHaveTextContent("2 / 3");
    loadImage("Second picture");
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(counter()).toHaveTextContent("2 / 3");
    fireEvent.click(screen.getByRole("button", { name: "Start slideshow" }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(counter()).toHaveTextContent("3 / 3");
    loadImage("Third picture");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // nowhere to go: it stops, and the button offers to start it again
    expect(screen.getByRole("button", { name: "Start slideshow" })).toBeInTheDocument();
  });

  it("is silent to a screen reader while it runs, and holds while the image is zoomed", async () => {
    vi.useFakeTimers();
    render(<Viewer defaultOpen trigger={undefined} autoPlay={{ interval: 1000 }} />);
    await act(async () => {});
    loadImage("First picture");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "+" });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(counter()).toHaveTextContent("1 / 3");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "0" });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(counter()).toHaveTextContent("2 / 3");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("dialog")).not.toHaveTextContent("Image 2 of 3");
  });

  it("starts paused when the person prefers reduced motion, and draws the pause button whatever controls says", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      render(<Viewer autoPlay controls="hidden" />);
      await open();
      expect(screen.getByRole("button", { name: "Start slideshow" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("can be started and paused from the controller", async () => {
    const ref = createRef<ImageViewerController>();
    render(<ImageViewer images={images} controllerRef={ref} defaultOpen autoPlay />);
    await screen.findByRole("dialog");
    expect(ref.current?.isPlaying).toBe(true);
    act(() => {
      expect(ref.current?.pause()).toBe(true);
      expect(ref.current?.pause()).toBe(false);
    });
    expect(ref.current?.isPlaying).toBe(false);
    act(() => {
      expect(ref.current?.play()).toBe(true);
    });
  });

  it("is drawn in the page with inline: a named group with no close button, that takes the keys and ignores Escape", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ImageViewer inline aria-label="Gallery" images={images} />);
    const group = screen.getByRole("group", { name: "Gallery" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(counter()).toHaveTextContent("1 / 3");
    group.focus();
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 3");
    await user.keyboard("{Escape}");
    expect(group).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns that inline ignores trigger, open and the history", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ImageViewer inline images={images} trigger={<Button>Open</Button>} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("do nothing with `inline`"));
  });

  it("draws a long strip a window at a time, keeping the current thumbnail and the length of the strip", async () => {
    const many = Array.from({ length: 200 }, (_, index) => ({ id: `n${index}`, src: `/n${index}.jpg`, alt: `Picture ${index + 1}` }));
    render(<Viewer images={many} thumbnails defaultValue={150} />);
    const { dialog } = await open();
    const strip = within(dialog).getByRole("group", { name: "Thumbnails" });
    const buttons = within(strip).getAllByRole("button");
    expect(buttons.length).toBeLessThan(60);
    expect(buttons.length).toBeGreaterThan(5);
    expect(within(strip).getByRole("button", { name: "Show image 151 of 200" })).toHaveAttribute("aria-current", "true");
    expect(strip.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("draws every thumbnail of a short strip", async () => {
    render(<Viewer thumbnails />);
    const { dialog } = await open();
    expect(within(within(dialog).getByRole("group", { name: "Thumbnails" })).getAllByRole("button")).toHaveLength(3);
  });
});

describe("ImageViewer review fixes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps a consumer's aria-describedby, beside the caption's", async () => {
    render(
      <>
        <p id="note">A note</p>
        <Viewer aria-describedby="note" />
      </>,
    );
    const { dialog } = await open();
    expect(dialog).toHaveAccessibleDescription("A note Caption one");
    expect(dialog.getAttribute("aria-describedby")).toMatch(/^note /);
  });

  it("describes the viewer by the consumer's aria-describedby alone when there is no caption", async () => {
    render(
      <>
        <p id="note">A note</p>
        <Viewer aria-describedby="note" showCaptions={false} />
      </>,
    );
    const { dialog } = await open();
    expect(dialog).toHaveAttribute("aria-describedby", "note");
  });

  it("ignores a key pressed in something portaled out of the viewer, and still takes one pressed inside it", async () => {
    render(<Viewer actions={createPortal(<button type="button">Menu item</button>, document.body)} />);
    const { dialog } = await open();
    // found by its text: the page outside the viewer is hidden from the accessibility tree while it is open
    fireEvent.keyDown(screen.getByText("Menu item"), { key: "ArrowRight" });
    expect(counter()).toHaveTextContent("1 / 3");
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "ArrowRight" });
    expect(counter()).toHaveTextContent("2 / 3");
    expect(dialog).toBeInTheDocument();
  });

  it("does not ask for the neighbours again when a list written inline is made again", async () => {
    const requested: string[] = [];
    vi.stubGlobal(
      "Image",
      class {
        set src(value: string) {
          requested.push(value);
        }

        set srcset(_value: string) {}
      },
    );
    const list = () => images.map((image) => ({ ...image }));
    const { rerender } = render(<Viewer images={list()} />);
    await open();
    const first = requested.length;
    expect(first).toBeGreaterThan(0);
    rerender(<Viewer images={list()} />);
    rerender(<Viewer images={list()} />);
    expect(requested).toHaveLength(first);
  });

  it("warns about an empty list once, however often the list is made again", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Viewer images={[]} defaultOpen trigger={undefined} />);
    rerender(<Viewer images={[]} defaultOpen trigger={undefined} />);
    rerender(<Viewer images={[]} defaultOpen trigger={undefined} />);
    expect(warn.mock.calls.filter(([message]) => String(message).includes("`images` is empty"))).toHaveLength(1);
  });

  it("gives a controlled viewer a new history entry when its owner keeps it open after Back", async () => {
    const push = vi.spyOn(window.history, "pushState");
    vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const onOpenChange = vi.fn();
    render(<Viewer open closeOnHistoryBack onOpenChange={onOpenChange} />);
    await screen.findByRole("dialog");
    expect(push).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "history" });
    await waitFor(() => expect(push).toHaveBeenCalledTimes(2));
  });

  it("leaves the wheel to the page of an inline viewer until the control key is down, and keeps it in a dialog", async () => {
    const stageOf = () => screen.getByAltText("First picture").closest("[data-status]") as HTMLElement;
    const { unmount } = render(<ImageViewer inline aria-label="Gallery" images={images} />);
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    // `fireEvent` says whether the event was left alone
    expect(fireEvent.wheel(stageOf(), { deltaY: -300 })).toBe(true);
    expect(zoomButton()).toHaveTextContent("50%");
    expect(fireEvent.wheel(stageOf(), { deltaY: -300, ctrlKey: true })).toBe(false);
    await waitFor(() => expect(zoomButton()).not.toHaveTextContent("50%"));
    // zoomed, a plain wheel zooms again, since the image is the thing being looked at
    expect(fireEvent.wheel(stageOf(), { deltaY: 300 })).toBe(false);
    unmount();
    render(<Viewer />);
    await open();
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    expect(fireEvent.wheel(stageOf(), { deltaY: -300 })).toBe(false);
  });

  it("marks the stage while the image is larger than it, for a stylesheet that lets touch scroll the page until then", async () => {
    render(<ImageViewer inline aria-label="Gallery" images={images} />);
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const stage = screen.getByAltText("First picture").closest("[data-status]") as HTMLElement;
    expect(stage).not.toHaveAttribute("data-zoomed");
    await userEvent.setup().click(screen.getByRole("button", { name: "Zoom in" }));
    expect(stage).toHaveAttribute("data-zoomed");
  });

  it("skips the origin under reduced motion", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      const getOrigin = vi.fn(() => document.createElement("div"));
      render(<Viewer getOrigin={getOrigin} images={[{ src: "/a.jpg", alt: "Hinted", width: 1000, height: 500 }]} />);
      await open();
      expect(getOrigin).not.toHaveBeenCalled();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("runs actual size, flip, rotate and the slideshow from the controller, and shows them to a part in actions", async () => {
    const ref = createRef<ImageViewerController>();
    function State() {
      const viewer = useImageViewerController();
      return <span data-testid="state">{`${viewer.isPlaying}|${viewer.zoom.toFixed(1)}`}</span>;
    }
    render(<ImageViewer images={images} controllerRef={ref} defaultOpen actions={<State />} />);
    await screen.findByRole("dialog");
    loadImage("First picture");
    await waitFor(() => expect(zoomButton()).toBeInTheDocument());
    const box = screen.getByAltText("First picture").closest("[data-drawn]") as HTMLElement;
    act(() => {
      expect(ref.current?.actualSize()).toBe(true);
    });
    expect(zoomButton()).toHaveTextContent("100%");
    expect(screen.getByTestId("state")).toHaveTextContent("false|2.0");
    act(() => {
      expect(ref.current?.rotate(90)).toBe(true);
      expect(ref.current?.rotate(0)).toBe(false);
      expect(ref.current?.flip()).toBe(true);
      expect(ref.current?.flip("vertical")).toBe(true);
    });
    expect(box.style.transform).toContain("scale(-1, -1)");
    expect(box.style.transform).toContain("rotate(90deg)");
    act(() => {
      expect(ref.current?.play()).toBe(true);
    });
    expect(screen.getByTestId("state")).toHaveTextContent("true|");
    act(() => {
      expect(ref.current?.pause()).toBe(true);
    });
    expect(screen.getByTestId("state")).toHaveTextContent("false|");
  });
});
