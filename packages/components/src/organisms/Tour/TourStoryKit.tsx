import { usePersistentDismiss } from "@dbm-system/utils";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Text } from "../../atoms/Text";
import { Tour } from "./Tour";
import type { TourController, TourProps, TourStep } from "./Tour.types";

/**
 * A small page for a tour to explain, drawn inside a box that is a containing block for fixed descendants
 * (`transform`), so the tour's dimmed layer covers this box and not the whole Docs page that embeds it.
 */
const stageStyle: CSSProperties = {
  blockSize: "26rem",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--dbm-space-4)",
  inlineSize: "100%",
  overflow: "hidden",
  padding: "var(--dbm-space-4)",
  position: "relative",
  transform: "translateZ(0)",
};

const rowStyle: CSSProperties = { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)" };

/** The steps every demo uses: three on the page and a closing card with no element. */
export function demoSteps(find: (name: string) => HTMLElement | null): TourStep[] {
  return [
    {
      id: "search",
      target: () => find("search"),
      title: "Search",
      content: "Find a project, a person or a setting from anywhere.",
    },
    {
      id: "create",
      target: () => find("create"),
      title: "Start something new",
      content: "Create a project here. It takes a few seconds.",
      side: "bottom",
      align: "end",
    },
    {
      id: "status",
      target: () => find("status"),
      title: "Status",
      content: "Everything that needs a look is collected here.",
      side: "top",
    },
    {
      id: "done",
      title: "You're set",
      content: "Start the tour again from the Help menu whenever you like.",
    },
  ];
}

/** Looks an element of the demo page up by its `data-demo` name. */
export type Finder = (name: string) => HTMLElement | null;

export interface DemoProps extends Partial<Omit<TourProps, "steps" | "container">> {
  /** Steps in place of the standard four, written from a function that finds the demo page's elements. */
  steps?: (find: Finder) => TourStep[];
  /** Extra content under the page, inside the stage. */
  children?: ReactNode;
  /** Whether the stage starts with the tour open. */
  startOpen?: boolean;
}

/** A page, a Start button and a `Tour` drawn into the page's own stage. */
export function Demo({ steps, children, startOpen = false, open: openProp, onOpenChange, ...props }: DemoProps) {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [openState, setOpenState] = useState(startOpen);
  const open = openProp ?? openState;
  const resolved = useMemo(() => {
    const find: Finder = (name) => stage?.querySelector<HTMLElement>(`[data-demo="${name}"]`) ?? null;
    return steps ? steps(find) : demoSteps(find);
  }, [steps, stage]);
  return (
    <div>
      <div style={{ marginBlockEnd: "var(--dbm-space-3)" }}>
        <Button variant="secondary" size="sm" onClick={() => setOpenState(true)} data-testid="start-tour">
          Start the tour
        </Button>
      </div>
      <div ref={setStage} style={stageStyle} data-testid="stage">
        <div style={rowStyle}>
          <div data-demo="search" style={{ flex: "1 1 12rem" }}>
            <Input aria-label="Search" placeholder="Search" />
          </div>
          <Button data-demo="create">New project</Button>
        </div>
        <div data-demo="status" style={{ ...rowStyle, padding: "var(--dbm-space-3)" }}>
          <Text weight="semibold">Status</Text>
          <Badge tone="success">3 on track</Badge>
          <Badge tone="warning">1 at risk</Badge>
        </div>
        {children}
        <Tour
          {...props}
          steps={resolved}
          open={open}
          onOpenChange={(next, details) => {
            setOpenState(next);
            onOpenChange?.(next, details);
          }}
          container={stage}
        />
      </div>
    </div>
  );
}

/** The steps of a tour with no element to point at: cards in the middle of the screen. */
export const welcomeSteps = (): TourStep[] => [
  { id: "welcome", title: "Welcome", content: "A short tour of what is new." },
  { id: "goodbye", title: "That's all", content: "You can find this tour again under Help." },
];

/** A step the person can use: the search field takes typing while the tour is open. */
export const interactiveSteps = (find: Finder): TourStep[] => [
  {
    id: "search",
    target: () => find("search"),
    title: "Try the search",
    content: "Type a word. The page behind the dimmed area stays out of reach; this field does not.",
    interactive: true,
  },
  { id: "create", target: () => find("create"), title: "Then create", content: "Press Next when you are ready." },
];

/** The step buttons and the tour both read one value held by the page. */
export function ControlledDemo() {
  const [value, setValue] = useState("search");
  const [open, setOpen] = useState(false);
  return (
    <Demo
      open={open}
      onOpenChange={(next) => setOpen(next)}
      value={value}
      onValueChange={setValue}
    >
      <div style={rowStyle}>
        {["search", "create", "status", "done"].map((id) => (
          <Button
            key={id}
            size="xs"
            variant={value === id ? "primary" : "secondary"}
            onClick={() => {
              setValue(id);
              setOpen(true);
            }}
          >
            {id}
          </Button>
        ))}
      </div>
    </Demo>
  );
}

/** Buttons outside the tour drive it through `controllerRef`. */
export function ControllerDemo() {
  const controller = useRef<TourController | null>(null);
  return (
    <Demo controllerRef={(value) => {
        controller.current = value;
      }}>
      <div style={rowStyle}>
        <Button size="xs" variant="secondary" onClick={() => controller.current?.open("status")}>
          Open at Status
        </Button>
        <Button size="xs" variant="secondary" onClick={() => controller.current?.next()}>
          Next
        </Button>
        <Button size="xs" variant="secondary" onClick={() => controller.current?.back()}>
          Back
        </Button>
        <Button size="xs" variant="secondary" onClick={() => controller.current?.close()}>
          Close
        </Button>
      </div>
    </Demo>
  );
}

/**
 * The tour opens once for each person: finishing or skipping it is remembered in the browser. A shown story must not open
 * by itself, so the page "visits" on a press instead of on load.
 */
export function SeenOnceDemo() {
  const { ready, dismissed, dismiss, reset } = usePersistentDismiss("tour-docs-demo", { storage: "session" });
  const [visiting, setVisiting] = useState(false);
  return (
    <Demo
      open={visiting && ready && !dismissed}
      onOpenChange={(next, details) => {
        if (!next && (details.reason === "finish" || details.reason === "skip")) dismiss();
        if (!next) setVisiting(false);
      }}
    >
      <div style={rowStyle}>
        <Button size="xs" variant="secondary" onClick={() => setVisiting(true)}>
          Visit the page
        </Button>
        <Button size="xs" variant="secondary" onClick={reset}>
          Forget that it was seen
        </Button>
        <Text size="xs" color="secondary">
          {dismissed ? "Seen: a visit shows nothing." : "Not seen yet: a visit opens the tour."}
        </Text>
      </div>
    </Demo>
  );
}

/** Cards with a picture, a footer and a step's own buttons. */
export const richSteps = (find: Finder): TourStep[] => [
  {
    id: "search",
    target: () => find("search"),
    title: "Search",
    content: "Find a project, a person or a setting from anywhere.",
    media: (
      <div
        aria-hidden="true"
        style={{ background: "var(--dbm-bg-brand-subtle)", blockSize: "var(--dbm-space-16)", display: "grid", placeItems: "center" }}
      >
        <Text weight="semibold">A picture goes here</Text>
      </div>
    ),
    footer: <Text size="xs" color="secondary">Tip: press / to jump to the search field.</Text>,
  },
  {
    id: "create",
    target: () => find("create"),
    title: "Start something new",
    content: "Your own buttons replace the standard ones.",
    actions: (controller) => (
      <>
        <Button size="sm" variant="tertiary" onClick={() => controller.close()}>
          Not now
        </Button>
        <span style={{ flex: 1 }} />
        <Button size="sm" variant="secondary" onClick={() => controller.back()}>
          Previous
        </Button>
        <Button size="sm" onClick={() => controller.next()}>
          Show me
        </Button>
      </>
    ),
  },
  { id: "done", title: "That's all" },
];

/** A step that moves on when its button is pressed. */
export const advancingSteps = (find: Finder): TourStep[] => [
  {
    id: "create",
    target: () => find("create"),
    title: "Press New project",
    content: "The tour moves on when you use the button.",
    advanceOn: "click",
  },
  { id: "done", title: "Well done", content: "That was the whole step." },
];

/** A step that opens a menu before pointing at it. */
export function OnEnterDemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Demo
      steps={(find) => [
        {
          id: "menu",
          target: () => find("menu"),
          title: "The account menu",
          content: "It was closed until this step opened it.",
          side: "bottom",
          align: "start",
          onEnter: async () => {
            setMenuOpen(true);
            await new Promise((resolve) => setTimeout(resolve, 150));
          },
        },
        { id: "done", title: "Closed again", content: "The next step does not need it." },
      ]}
    >
      <div style={rowStyle}>
        <Button size="xs" variant="secondary" onClick={() => setMenuOpen((open) => !open)}>
          Account
        </Button>
        {menuOpen && (
          <div data-demo="menu" style={{ border: "var(--dbm-border-width-1) solid var(--dbm-border-default)", borderRadius: "var(--dbm-radius-md)", padding: "var(--dbm-space-2)" }}>
            <Text size="sm">Profile · Settings · Sign out</Text>
          </div>
        )}
      </div>
    </Demo>
  );
}

/** A step whose element is not on the page, skipped. */
export const missingSteps = (find: Finder): TourStep[] => [
  { id: "search", target: () => find("search"), title: "Search" },
  { id: "gone", target: () => find("not-on-this-page"), title: "A step for another page", content: "Never shown: its element is missing." },
  { id: "create", target: () => find("create"), title: "New project", content: "The tour went straight here from Search." },
];
