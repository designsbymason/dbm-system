import { Button } from "@dbm-system/components";
import { CheckIcon, CopyIcon } from "@dbm-system/icons";
import { useEffect, useRef, useState } from "react";

/**
 * Copies the page as Markdown (its `.md` copy, ADR-0213), to hand it to an AI chat or agent. The result is said in a
 * polite live region as well as on the button.
 */
export function CopyPage({ markdownHref }: { markdownHref: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const markdown = fetch(markdownHref).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.text();
    });
    try {
      // The write starts inside the click, with the text still on its way: a browser allows a clipboard write only
      // while the click's user activation lasts, which an awaited fetch can outlast (Safari is strict about it).
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": markdown.then((text) => new Blob([text], { type: "text/plain" })) })]);
      } else {
        await navigator.clipboard.writeText(await markdown);
      }
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  };

  return (
    <>
      <Button variant="secondary" size="sm" leadingIcon={state === "copied" ? CheckIcon : CopyIcon} onClick={copy}>
        {state === "copied" ? "Copied" : "Copy page"}
      </Button>
      <span className="visually-hidden" aria-live="polite">
        {state === "copied" ? "Page copied as Markdown" : state === "failed" ? "The page could not be copied" : ""}
      </span>
    </>
  );
}
