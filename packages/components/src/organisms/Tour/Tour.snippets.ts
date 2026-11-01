// The code shown under each story's "Show code" button on Tour's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TourMissingTarget, TourPresentation, TourProgress } from "./Tour.types";

const steps = `  steps={[
    { id: "search", target: "#search", title: "Search", content: "Find anything from here." },
    { id: "create", target: "#create", title: "Start something new", side: "bottom", align: "end" },
    { id: "done", title: "You're set", content: "Start the tour again from Help." },
  ]}`;

const tour = (attributes: string[] = [], body = steps) =>
  `{/* const [open, setOpen] = useState(false); */}\n<Tour\n  open={open}\n  onOpenChange={setOpen}\n${attributes.map((attribute) => `  ${attribute}\n`).join("")}${body}\n/>`;

export const tourSnippets = {
  progress: `{/* progress: "text" (default) — "Step 2 of 5"
    | "bar" — a segment per step (the text is still read by a screen reader)
    | "both" | "none" */}
${tour(['progress="both"'])}`,

  dismissals: `{/* dismissals: extra ways out beside Skip, reported as the reasons "later" and "never" */}
${tour(['dismissals={["later", "never"]}'])}`,

  richer: `{/* media: a picture above the progress. footer: content above the buttons.
    actions: your own buttons in place of Skip, Back and Next, handed the controller. */}
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      id: "search",
      target: "#search",
      title: "Search",
      media: <img src={preview} alt="" />,
      footer: <Text size="xs">Tip: press / to jump here.</Text>,
    },
    {
      id: "create",
      target: "#create",
      title: "Start something new",
      actions: (controller) => (
        <>
          <Button variant="tertiary" onClick={() => controller.close()}>Not now</Button>
          <Button onClick={() => controller.next()}>Show me</Button>
        </>
      ),
    },
  ]}
/>`,

  advance: `{/* advanceOn: "click" | "input" | "change" | "focus" | "submit" — the tour moves on when the element is used */}
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    { id: "create", target: "#create", title: "Press New project", advanceOn: "click" },
    { id: "done", title: "Well done" },
  ]}
/>`,

  onEnter: `{/* onEnter runs before the step's element is looked for; the tour waits for a returned promise */}
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      id: "menu",
      target: "#account-menu",
      title: "The account menu",
      onEnter: async () => {
        setMenuOpen(true);
        await menuMounted();
      },
    },
  ]}
/>`,

  missing: `{/* missingTarget: "center" (default) shows the card in the middle of the screen; "skip" moves on.
    Set it for the whole tour, or on one step. */}
${tour(['missingTarget="skip"'])}`,


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
  missingTarget?: TourMissingTarget;
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
  if (args.missingTarget && args.missingTarget !== "center") attributes.push(`missingTarget="${args.missingTarget}"`);
  if (typeof args.scrimOpacity === "number" && args.scrimOpacity !== 0.6) attributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  if (args.closeOnOutsidePress) attributes.push("closeOnOutsidePress");
  if (typeof args.targetTimeout === "number" && args.targetTimeout !== 1000) attributes.push(`targetTimeout={${args.targetTimeout}}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return tour(attributes);
}
