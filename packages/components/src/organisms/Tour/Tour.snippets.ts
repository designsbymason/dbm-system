// The code shown under each story's "Show code" button on Tour's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TourPresentation, TourProgress } from "./Tour.types";

const steps = `  steps={[
    { id: "search", target: "#search", title: "Search", content: "Find anything from here." },
    { id: "create", target: "#create", title: "Start something new", side: "bottom", align: "end" },
    { id: "done", title: "You're set", content: "Start the tour again from Help." },
  ]}`;

const tour = (attributes: string[] = [], body = steps) =>
  `{/* const [open, setOpen] = useState(false); */}\n<Tour\n  open={open}\n  onOpenChange={setOpen}\n${attributes.map((attribute) => `  ${attribute}\n`).join("")}${body}\n/>`;

export const tourSnippets = {
  basic: tour(),

  docked: `{/* presentation: "anchored" (default) — beside the element
    | "docked" — pinned across the bottom, with the element scrolled into the room above.
    A breakpoint map works too: */}
${tour(['presentation={{ base: "docked", md: "anchored" }}'])}`,

  interactive: `{/* interactive: the person can use the highlighted element while the tour is open */}
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      id: "search",
      target: "#search",
      title: "Try the search",
      content: "Type a word. The rest of the page stays out of reach.",
      interactive: true,
    },
    { id: "create", target: "#create", title: "Then create" },
  ]}
/>`,

  welcome: `{/* A step with no target is a card in the middle of the screen */}
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    { id: "welcome", title: "Welcome", content: "A short tour of what is new." },
    { id: "goodbye", title: "That's all", content: "You can find this tour again under Help." },
  ]}
/>`,

  controlled: `{/* const [value, setValue] = useState("search"); */}
${tour(["value={value}", "onValueChange={setValue}"])}`,

  controller: `{/* const controller = useRef<TourController | null>(null); */}
{/* controller.current?.open("status") · .next() · .back() · .goTo("done") · .close() */}
${tour(["controllerRef={controller}"])}`,

  seenOnce: `{/* usePersistentDismiss remembers, in the browser, that the tour was finished or skipped */}
{/* const { ready, dismissed, dismiss } = usePersistentDismiss("product-tour"); */}
<Tour
  open={ready && !dismissed}
  onOpenChange={(open, { reason }) => {
    if (!open && (reason === "finish" || reason === "skip")) dismiss();
  }}
${steps}
/>`,

  rightToLeft: `{/* dir sets the card's direction and what side="start" and "end" mean */}
${tour(['dir="rtl"'])}`,

  translated: `{/* labels: next, back, skip, finish, stepOf, announcement. formatNumber writes the digits. */}
${tour([
  "labels={{ next: \"Weiter\", back: \"Zurück\", skip: \"Tour überspringen\", finish: \"Fertig\", stepOf: (n, total) => `Schritt ${n} von ${total}` }}",
])}`,
};

export interface TourPlaygroundSnippetArgs {
  presentation?: TourPresentation;
  progress?: TourProgress;
  scrimOpacity?: number;
  closeOnOutsidePress?: boolean;
  targetTimeout?: number;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
}

/** Only what differs from the defaults, around a small real tour. */
export function tourPlaygroundSnippet(args: TourPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.presentation && args.presentation !== "anchored") attributes.push(`presentation="${args.presentation}"`);
  if (args.progress && args.progress !== "text") attributes.push(`progress="${args.progress}"`);
  if (typeof args.scrimOpacity === "number" && args.scrimOpacity !== 0.6) attributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  if (args.closeOnOutsidePress) attributes.push("closeOnOutsidePress");
  if (typeof args.targetTimeout === "number" && args.targetTimeout !== 1000) attributes.push(`targetTimeout={${args.targetTimeout}}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return tour(attributes);
}
