import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useArgs } from "storybook/preview-api";
import {
  expect,
  fn,
  userEvent,
  waitForElementToBeRemoved,
  within,
} from "storybook/test";
import { Button } from "../Button";
import { Spinner } from "../Spinner";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Backdrop } from "./Backdrop";
import { backdropPlaygroundSnippet, backdropSnippets } from "./Backdrop.snippets";

// A colorful mock "page content" block — purely a Storybook demo aid, not
// shipped code. `opacity`/`blur` have no visible effect dimming/blurring a
// flat, empty canvas; every story that opens a real Backdrop renders this
// behind it so those two props are actually demonstrable, not just applied
// invisibly (confirmed live: without this, toggling `blur` produced zero
// perceptible change against a blank background even though the CSS
// `backdrop-filter` was genuinely being applied).
function DemoBackground() {
  const tones = ["brand", "success", "danger", "warning", "info", "neutral"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--dbm-space-3)",
      }}
    >
      {tones.map((tone) => (
        <div
          key={tone}
          style={{
            height: "4rem",
            borderRadius: "var(--dbm-radius-md)",
            backgroundColor: `var(--dbm-bg-${tone})`,
          }}
        />
      ))}
    </div>
  );
}

const meta: Meta<typeof Backdrop> = {
  title: "Components/Backdrop",
  id: "atoms-overlay-backdrop",
  component: Backdrop,
  parameters: { layout: "padded" },
  // Content prop first, then core visual props, then the behavioral prop,
  // then advanced/escape-hatch props last — same sequencing principle the
  // Docs page's Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description:
        "Optional content rendered on top of the dimming fill, centered on both axes — e.g. a Spinner/ProgressCircle for a full-page loading overlay. Also how a dialog panel is centered on the scrim.",
    },
    open: {
      control: "boolean",
      description:
        "Whether the scrim is visible. Toggle this control live to see the fade-in/fade-out animation play.",
    },
    opacity: {
      control: "select",
      options: [0, 5, 10, 20, 40, 60, 80, 90, 100],
      description: "How opaque the dimming fill is, from the opacity token scale.",
    },
    blur: {
      control: "boolean",
      description:
        "Applies a backdrop-filter: blur(...) in addition to the dimming fill, for a frosted-glass effect.",
    },
    // Function prop — not meaningfully editable via a Controls-panel widget.
    // Wired to `fn()` in `args` below so clicking the scrim in the
    // Playground produces a visible Actions-panel entry.
    onClick: {
      control: false,
      description:
        "Fires on click — the primary way a consumer wires up click-to-dismiss. A plain native passthrough.",
    },
    // `control: false` — deliberately never live-editable, not just left
    // unset. Confirmed live: `position: fixed` resolves against the
    // Storybook preview iframe's own viewport either way, so toggling this
    // produces zero visible difference in any Canvas, in the Playground or
    // otherwise — there's no story context where a reader could observe
    // what this prop actually does. Its real purpose (skip portaling when
    // a parent like `Dialog` already provides its own) is
    // invisible by design when used correctly; still fully documented in
    // the Properties table below, just not wired to a widget that could
    // only ever look broken.
    inPortal: {
      control: false,
      description:
        "Renders into a portal (document.body by default) instead of in place.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // `open` defaults to `false` here, deliberately diverging from the real
  // component default (`true`) — every Canvas on a Docs page shares one
  // real underlying document (guidelines/07-storybook-and-documentation-
  // standards.md §4.1), so a `true` default would portal a real,
  // full-viewport dimming scrim over the *entire Docs page* the instant it
  // loads, with no reader action (confirmed live: this genuinely happened
  // before this default was added). Toggling the live `open` control back
  // on is still a fully interactive, reader-initiated preview — only the
  // unprompted-on-load case is the problem this default avoids.
  args: {
    children: "",
    open: false,
    opacity: 60,
    blur: false,
    onClick: fn(),
    inPortal: true,
  },
};

export default meta;

type Story = StoryObj<typeof Backdrop>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => backdropPlaygroundSnippet(context.args),
      },
    },
  },
  // Once `open` is toggled on, the live scrim (position: fixed, a high
  // z-index) sits directly on top of this same Controls panel — since a
  // Docs page's embedded Canvas and its controls share one document, the
  // switch a reader would use to turn it back off is now underneath the
  // scrim it controls. `useArgs` lets a click on the scrim itself flip
  // `open` back to false, matching the real click-to-dismiss pattern
  // instead of leaving the demo with no way out.
  render: function PlaygroundStory(args) {
    const [, updateArgs] = useArgs();
    return (
      <Stack gap={4}>
        {/* Placeholder — `open` defaults to false here (see the note on
            `args` above), so without this the canvas would otherwise show
            nothing at all until the "open" control is toggled on. */}
        <Text color="tertiary">
          Toggle &quot;open&quot; below to preview the backdrop.
        </Text>
        <DemoBackground />
        <Backdrop
          {...args}
          onClick={(event) => {
            args.onClick?.(event);
            updateArgs({ open: false });
          }}
        />
      </Stack>
    );
  },
};

export const ClickToDismiss: Story = {
  name: "Click to dismiss",
  parameters: { docs: { source: { code: backdropSnippets.clickToDismiss } } },
  // This story demonstrates the original conditional-mount pattern —
  // Backdrop's own `open` prop is never used at all (visibility is
  // whether the parent renders `<Backdrop>` at all, per usage pattern (1)
  // on `open`'s own JSDoc) — so its control is suppressed here rather than
  // left wired to a prop this render doesn't forward, same as suppressing
  // the one axis a control can't represent on an "all sizes"-style story
  // (`06-engineering-standards.md` §9). `children`/`opacity`/`blur` are
  // still genuinely live.
  argTypes: {
    open: { control: false },
  },
  render: function ClickToDismissStory(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Stack gap={4}>
        <Button onClick={() => setIsOpen(true)} style={{ alignSelf: "flex-start" }}>
          Show backdrop
        </Button>
        <DemoBackground />
        {isOpen && (
          <Backdrop
            opacity={args.opacity}
            blur={args.blur}
            onClick={() => setIsOpen(false)}
          >
            {args.children}
          </Backdrop>
        )}
      </Stack>
    );
  },
};

export const AnimatedDismiss: Story = {
  name: "Animated dismiss (open prop)",
  parameters: { docs: { source: { code: backdropSnippets.animatedDismiss } } },
  // `open` is bound to this story's own trigger button rather than the
  // Controls panel, so its control is suppressed here — same "suppress
  // only the one axis a control can't represent" reasoning as above.
  // `children`/`opacity`/`blur` stay genuinely live.
  argTypes: {
    open: { control: false },
  },
  render: function AnimatedDismissStory(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Stack gap={4}>
        <Button onClick={() => setIsOpen(true)} style={{ alignSelf: "flex-start" }}>
          Show backdrop
        </Button>
        <DemoBackground />
        <Backdrop
          opacity={args.opacity}
          blur={args.blur}
          open={isOpen}
          onClick={() => setIsOpen(false)}
        >
          {args.children}
        </Backdrop>
      </Stack>
    );
  },
};

export const Blurred: Story = {
  name: "With blur",
  parameters: { docs: { source: { code: backdropSnippets.blurred } } },
  // `blur` is this story's whole point, fixed on — suppressed like any
  // "the whole point" axis; `open` unused for the same reason as
  // `ClickToDismiss` above. `children`/`opacity` stay genuinely live.
  argTypes: {
    blur: { control: false },
    open: { control: false },
  },
  render: function BlurredStory(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Stack gap={4}>
        <Button onClick={() => setIsOpen(true)} style={{ alignSelf: "flex-start" }}>
          Show blurred backdrop
        </Button>
        <DemoBackground />
        {isOpen && (
          <Backdrop blur opacity={args.opacity} onClick={() => setIsOpen(false)}>
            {args.children}
          </Backdrop>
        )}
      </Stack>
    );
  },
};

export const WithContent: Story = {
  name: "With content (loading overlay)",
  parameters: { docs: { source: { code: backdropSnippets.withContent } } },
  // `children` is fixed to a real Spinner instance here — the whole point
  // of this story — so suppressed like `blur` above; `open` unused for the
  // same reason as `ClickToDismiss`. `opacity`/`blur` stay genuinely live.
  argTypes: {
    children: { control: false },
    open: { control: false },
  },
  render: function WithContentStory(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Stack gap={4}>
        <Button onClick={() => setIsOpen(true)} style={{ alignSelf: "flex-start" }}>
          Show loading overlay
        </Button>
        <DemoBackground />
        {isOpen && (
          <Backdrop opacity={args.opacity} blur={args.blur} onClick={() => setIsOpen(false)}>
            {/* `tone="white"` — without an explicit tone here, Spinner
                inherits the browser's default black `currentColor`, which
                is functionally invisible against the dark dimming scrim
                (confirmed live, in both light and dark mode). Unlike the
                `on-{tone}` family, `white` stays white in dark mode too,
                since Backdrop's own `bg.overlay` never lightens. */}
            <Spinner size="xl" tone="white" />
          </Backdrop>
        )}
      </Stack>
    );
  },
};

export const InPlace: Story = {
  name: "Rendered in place (no portal)",
  parameters: { docs: { source: { code: backdropSnippets.inPlace } } },
  // Overrides the meta-level `open` default (`false`) back to `true` so
  // this always-visible, contained demo actually shows something on load
  // — `open` stays a genuinely live control here (toggling it plays the
  // real exit animation, contained within this box); `inPortal` is fixed
  // to `false`, the whole point of this story, on top of its meta-level
  // `control: false` (never visibly demonstrable in any story, see above).
  args: { open: true },
  render: function InPlaceStory(args) {
    return (
      <div
        style={{
          position: "relative",
          height: "12rem",
          overflow: "hidden",
          borderRadius: "var(--dbm-radius-md)",
        }}
      >
        <div style={{ padding: "var(--dbm-space-4)" }}>
          <DemoBackground />
        </div>
        <Backdrop
          inPortal={false}
          open={args.open}
          opacity={args.opacity}
          blur={args.blur}
          style={{ position: "absolute" }}
        >
          {args.children}
        </Backdrop>
      </div>
    );
  },
};

export const ClickToDismissInteraction: Story = {
  name: "Interaction: fires onClick and dismisses",
  // `open` is bound to this story's own scripted state (it must start
  // `true` with no trigger button, so the `play` function below always has
  // something to click), so its control is suppressed — same reasoning as
  // `ClickToDismiss`/`AnimatedDismiss` above. `children`/`opacity`/`blur`
  // stay genuinely live, matching every other story in this file.
  argTypes: {
    open: { control: false },
  },
  render: function ClickToDismissInteractionStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <Stack gap={4}>
        <DemoBackground />
        <Backdrop
          inPortal={false}
          opacity={args.opacity}
          blur={args.blur}
          open={isOpen}
          onClick={() => setIsOpen(false)}
          data-testid="scrim"
        >
          {args.children}
        </Backdrop>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scrim = canvas.getByTestId("scrim");
    await expect(scrim).toBeInTheDocument();
    await userEvent.click(scrim);
    // The click flips `open` to false, but the scrim stays in the DOM
    // with `data-state="closed"` until its fade-out animation finishes
    // (Radix `Presence`) — wait for the real removal rather than
    // asserting it's gone immediately after the click.
    await waitForElementToBeRemoved(() => canvas.queryByTestId("scrim"), {
      timeout: 1000,
    });
  },
};
