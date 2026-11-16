import { ToggleGroup } from "@dbm-system/components";
import { useCallback, useEffect, useRef, useState } from "react";
import { report } from "./measure";
import type { ControlReport } from "./measure";
import styles from "./A11yDemo.module.css";

type Dir = "ltr" | "rtl";

export interface Width {
  label: string;
  px: number;
  /** Which layout the width lands in, from the breakpoint scale: "the base layout", "md and up". */
  step: string;
}

/** The frame's height, in the frame's own pixels. A phone-width screen is taller than this and scrolls inside it, as a screen does. */
const FRAME_HEIGHT = 640;

/** How long the focus ring takes to settle (the fast motion duration, 120 ms, and a little over). */
const RING_SETTLE = 200;

const ratioText = (value: number | undefined, missing: string) => (value === undefined ? missing : `${value.toFixed(1)}:1`);

/**
 * "Accessible and responsive": a composition in an iframe, so that it has a viewport of its own (DBM's components follow the viewport, so
 * a width can only be shown in one). Tab walks focus through it and a panel reports what the focused control is, measured in this browser;
 * the width and direction controls resize and flip it. The frame is scaled down when it is wider than its box.
 */
export function A11yDemo({ widths }: { widths: Width[] }) {
  const [width, setWidth] = useState(String(widths[0]?.px ?? 375));
  const [dir, setDir] = useState<Dir>("ltr");
  const [focused, setFocused] = useState<ControlReport | null>(null);
  const [room, setRoom] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const dirRef = useRef<Dir>("ltr");
  dirRef.current = dir;

  const send = useCallback((next: Dir) => {
    frame.current?.contentWindow?.postMessage({ type: "dbm-direction", dir: next }, window.location.origin);
  }, []);

  // The room the frame has, to scale it into.
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observe = () => setRoom(node.clientWidth);
    observe();
    const observer = new ResizeObserver(observe);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The composition says when it is ready and is told which way to read; focus inside it is reported here.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type === "dbm-ready") send(dirRef.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // The document being watched, so a frame that loaded before this hydrated, and one that loads after, are each watched once.
  const watched = useRef<Document | null>(null);
  const watch = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc || watched.current === doc) return;
    watched.current = doc;
    doc.addEventListener("focusin", (event) => {
      const target = event.target as Element | null;
      if (!target || target === doc.body || target === doc.documentElement) return;
      // The ring fades in over the fast motion duration, so it is measured once it has settled, and only if the control still has focus.
      window.setTimeout(() => {
        if (doc.activeElement === target) setFocused(report(target));
      }, RING_SETTLE);
    });
  }, []);

  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === "complete") watch();
  }, [watch]);

  const px = Number(width);
  const scale = room > 0 ? Math.min(1, room / px) : 1;
  const current = widths.find((item) => item.px === px);

  return (
    <div className={styles.demo}>
      <div className={styles.controls}>
        <ToggleGroup aria-label="Width" value={width} onValueChange={(value) => value && setWidth(value)} size="sm">
          {widths.map((item) => (
            <ToggleGroup.Item key={item.px} value={String(item.px)}>
              {item.label} {item.px}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Direction"
          value={dir}
          onValueChange={(value) => {
            if (value === "ltr" || value === "rtl") {
              setDir(value);
              send(value);
            }
          }}
          size="sm"
        >
          <ToggleGroup.Item value="ltr">Left to right</ToggleGroup.Item>
          <ToggleGroup.Item value="rtl">Right to left</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div className={styles.layout}>
        <div className={styles.stage} ref={stage}>
          <div className={styles.scaled} style={{ inlineSize: px * scale, blockSize: FRAME_HEIGHT * scale }}>
            <iframe
              ref={frame}
              className={styles.frame}
              src="/composition/"
              title="A team settings screen built from DBM System components. Press Tab to move through its controls."
              style={{ inlineSize: px, blockSize: FRAME_HEIGHT, transform: `scale(${scale})` }}
              onLoad={watch}
            />
          </div>
          <p className={styles.caption}>
            {px} px wide{current ? `, ${current.step}` : ""}
            {scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ""}
          </p>
        </div>
        <aside className={styles.panel} aria-label="The focused control">
          <h3 className={styles.heading}>The focused control</h3>
          {focused ? (
            <dl className={styles.facts}>
              <div>
                <dt>Name</dt>
                <dd>{focused.name || "None"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{focused.role}</dd>
              </div>
              <div>
                <dt>Text contrast</dt>
                <dd>{ratioText(focused.textContrast, "No text of its own")}</dd>
              </div>
              <div>
                <dt>Focus ring</dt>
                <dd>{ratioText(focused.ringContrast, "None found")}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>
                  {focused.width} × {focused.height} px
                </dd>
              </div>
            </dl>
          ) : (
            <p className={styles.hint}>Click into the screen and press Tab. Each control you reach is described here.</p>
          )}
          <p className={styles.note}>Measured in your browser from the control&apos;s own styles, not written in.</p>
        </aside>
      </div>
    </div>
  );
}
