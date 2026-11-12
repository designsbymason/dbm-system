import { send } from "../../molecules/CodeBlock/browserProtocol";

// Real input for the templates' hidden real-browser checks, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which skip what a real
// press, key or wheel does (`:hover`, `:focus-visible`, a hover-intent timer, where focus lands). The test page scales its iframe, so a point is mapped to the page it
// is drawn on. Shared by the templates' checks at the second consumer (`05-component-api-conventions.md` §1).

/** Resolves on the next animation frame. */
export const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A real wheel turn over the middle of the page, mapping the test iframe's scale. */
export async function wheel(deltaY: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (window.innerWidth / 2) * scale;
  const y = (frame?.top ?? 0) + (window.innerHeight / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY });
}

/** A real mouse click through the Chrome DevTools Protocol, mapping the test iframe's scale. */
export async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

/** A real key press through the Chrome DevTools Protocol. */
export async function pressEscape() {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
}

/** The keys a check presses: the `key` and `code` the browser reports, its virtual key code, and the text it types (`Enter` and `Space` carry the text a page's own handlers read). */
const keys = {
  Tab: { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
  Enter: { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" },
  Space: { key: " ", code: "Space", windowsVirtualKeyCode: 32, text: " " },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 },
};

/** A real key press through the Chrome DevTools Protocol. */
export async function pressKey(name: keyof typeof keys) {
  const { text, ...key } = keys[name] as (typeof keys)[keyof typeof keys] & { text?: string };
  await send("Input.dispatchKeyEvent", { type: "keyDown", ...key, ...(text ? { text } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...key });
}

/** Waits for a smooth scroll to finish: the page has not moved for a few frames. */
export async function settled() {
  let last = -1;
  let still = 0;
  while (still < 4) {
    await nextFrame();
    if (window.scrollY === last) still += 1;
    else {
      still = 0;
      last = window.scrollY;
    }
  }
}

