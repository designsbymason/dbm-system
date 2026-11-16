import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { FieldLabel } from "../../atoms/FieldLabel";
import { IconButton } from "../../atoms/IconButton";
import { Input } from "../../atoms/Input";
import { Text } from "../../atoms/Text";
import { GearIcon } from "@dbm-system/icons";
import { Popover } from "./Popover";
import { popoverPlaygroundSnippet, popoverSnippets } from "./Popover.snippets";
import type { PopoverAlign, PopoverContentProps, PopoverSide } from "./Popover.types";

// Combines Popover's own root-level args (open/defaultOpen/onOpenChange/
// modal) with Popover.Content's own args (side/align/etc.) in one
// Playground — Content carries most of the props a consumer actually
// wants to drive live, but `meta.component` can only resolve docgen
// argTypes for one component (Popover itself), so Content's own args are
// declared manually below and threaded through this custom `render`
// instead. Popover.Trigger/Anchor/Content/Close each still get their own
// Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), which is where their argTypes are auto-resolved
// from real docgen.
interface PlaygroundArgs {
  defaultOpen: boolean;
  modal: boolean;
  onOpenChange: (open: boolean) => void;
  side: PopoverSide;
  align: PopoverAlign;
  sideOffset: number;
  alignOffset: number;
  avoidCollisions: boolean;
  collisionPadding: number;
  hideWhenDetached: boolean;
  hideArrow: boolean;
  showCloseButton: boolean;
  onOpenAutoFocus: PopoverContentProps["onOpenAutoFocus"];
  onCloseAutoFocus: PopoverContentProps["onCloseAutoFocus"];
  onEscapeKeyDown: PopoverContentProps["onEscapeKeyDown"];
  onPointerDownOutside: PopoverContentProps["onPointerDownOutside"];
  onFocusOutside: PopoverContentProps["onFocusOutside"];
  onInteractOutside: PopoverContentProps["onInteractOutside"];
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Popover",
  id: "molecules-overlay-popover",
  parameters: { layout: "padded" },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "The initial open state when uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    modal: {
      control: "boolean",
      description:
        "Traps focus inside the content and blocks interaction with the rest of the page while open. Doesn't block dismissal — outside click/Escape still close it either way, unlike Dialog's own modal (Popover has no Overlay/scrim to swallow that click).",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called whenever the open state changes.",
    },
    side: {
      // A `select` of the single-value form — `Responsive<PopoverSide>` (a
      // value, or a breakpoint-keyed map) has no single control shape
      // Storybook can represent, so the Playground demonstrates the common
      // single-value case; the responsive-map form gets its own dedicated
      // static-reference story below instead (same reasoning as `Divider`'s
      // own `orientation`).
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the content renders on — a single value (shown here) or a mobile-first responsive map keyed by breakpoint (e.g. { base: 'bottom', lg: 'right' }) to switch axes deliberately at a chosen breakpoint.",
      table: { defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side.",
      table: { defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: "number",
      description: "Pixel gap between the trigger and the content along side.",
      table: { defaultValue: { summary: "8" } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along align's own axis.",
      table: { defaultValue: { summary: "0" } },
    },
    avoidCollisions: {
      control: "boolean",
      description: "Repositions the content to stay within the viewport.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionPadding: {
      control: "number",
      description: "Minimum distance kept from the viewport edge while repositioning.",
      table: { defaultValue: { summary: "8" } },
    },
    hideWhenDetached: {
      control: "boolean",
      description:
        "Hides the content entirely when its trigger is fully scrolled out of view, instead of leaving it floating in a now-meaningless position — relevant for a trigger inside a scrollable list/table/panel.",
      table: { defaultValue: { summary: "false" } },
    },
    hideArrow: {
      control: "boolean",
      description: "Hides the small pointer arrow connecting the content to its trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows a CloseButton in the content's own top-end corner.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenAutoFocus: {
      control: false,
      description: "Called when focus moves into the content on open. Can be prevented.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to the trigger on close. Can be prevented.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Can be prevented.",
    },
    onPointerDownOutside: {
      control: false,
      description: "Called on a pointer-down outside the content. Can be prevented.",
    },
    onFocusOutside: {
      control: false,
      description: "Called when focus moves outside the content. Can be prevented.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the content. Can be prevented.",
    },
  },
  args: {
    defaultOpen: false,
    modal: false,
    side: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    avoidCollisions: true,
    collisionPadding: 8,
    hideWhenDetached: false,
    hideArrow: false,
    showCloseButton: false,
    onOpenChange: fn(),
    onOpenAutoFocus: fn(),
    onCloseAutoFocus: fn(),
    onEscapeKeyDown: fn(),
    onPointerDownOutside: fn(),
    onFocusOutside: fn(),
    onInteractOutside: fn(),
  },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-16)" }}>
      <Popover defaultOpen={args.defaultOpen} modal={args.modal} onOpenChange={args.onOpenChange}>
        <Popover.Trigger asChild>
          <Button>Open popover</Button>
        </Popover.Trigger>
        <Popover.Content
          side={args.side}
          align={args.align}
          sideOffset={args.sideOffset}
          alignOffset={args.alignOffset}
          avoidCollisions={args.avoidCollisions}
          collisionPadding={args.collisionPadding}
          hideWhenDetached={args.hideWhenDetached}
          hideArrow={args.hideArrow}
          showCloseButton={args.showCloseButton}
          onOpenAutoFocus={args.onOpenAutoFocus}
          onCloseAutoFocus={args.onCloseAutoFocus}
          onEscapeKeyDown={args.onEscapeKeyDown}
          onPointerDownOutside={args.onPointerDownOutside}
          onFocusOutside={args.onFocusOutside}
          onInteractOutside={args.onInteractOutside}
          aria-label="Example popover"
        >
          <Text size="sm">This is the popover&apos;s own content.</Text>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => popoverPlaygroundSnippet(context.args),
      },
    },
  },
};

export const WithArrowHidden: Story = {
  name: "With the arrow hidden",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => popoverPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hideArrow: true },
};

export const WithCloseButton: Story = {
  name: "With an explicit close button",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => popoverPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showCloseButton: true },
};

export const Modal: Story = {
  name: "Modal (traps focus, blocks background interaction)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => popoverPlaygroundSnippet(context.args),
      },
    },
  },
  args: { modal: true, showCloseButton: true },
};

export const AllSides: Story = {
  name: "All sides",
  parameters: { docs: { source: { code: popoverSnippets.allSides } } },
  argTypes: {
    // `side` is hardcoded per-instance by the loop below (that's the whole
    // point of this gallery) — `args.side` is never read, so a control for
    // it would be a silent no-op.
    side: { control: false },
    // `open` is hardcoded `true` on every instance (see the comment in the
    // render below) instead of driven by `args.defaultOpen`/`args.modal`,
    // specifically to sidestep the multi-instance uncontrolled-open race —
    // wiring these through would reintroduce the very bug this story works
    // around, so their controls stay disabled here (though both are freely
    // interactive on `Playground`, where only one instance exists).
    defaultOpen: { control: false },
    modal: { control: false },
    onOpenChange: { control: false },
  },
  render: (args) => (
    // `repeat(auto-fit, minmax(...))`, not a fixed 2-column grid — found
    // live at 375px mobile width: a fixed 2-column grid leaves each column
    // narrower than an open popover's own rendered width, and Radix's
    // collision avoidance only keeps content within the true viewport
    // edges, not clear of a *sibling grid cell's* own trigger — so a
    // repositioned popover overlapped the adjacent column's button instead
    // of just avoiding the screen edge. Auto-fit collapses to a single
    // column once two 180px-minimum columns plus the gap no longer fit,
    // which removes the adjacency entirely rather than tuning gap/padding
    // to paper over it at one specific width.
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "var(--dbm-space-16)",
        placeItems: "center",
        paddingBlock: "var(--dbm-space-16)",
      }}
    >
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        // `open` (always `true`), not `defaultOpen` — found live: mounting
        // several *uncontrolled* popovers pre-opened at once races each
        // instance's own mount-time auto-focus against its siblings' (each
        // one's focus effectively looks like an "outside interaction" to
        // the others, since none has settled focus yet when the others'
        // own effects run), and every one ends up dismissed. A real app
        // never renders multiple popovers defaulting open simultaneously
        // (they open one at a time from user interaction, which already
        // has its own dedicated test — see "Interaction" stories below);
        // this is a side-by-side comparison gallery specifically, so a
        // permanently-open, uncontrolled-dismissal-proof `open` fits its
        // actual intent better anyway.
        <Popover key={side} open>
          <Popover.Trigger asChild>
            <Button variant="secondary">{side}</Button>
          </Popover.Trigger>
          <Popover.Content
            side={side}
            align={args.align}
            sideOffset={args.sideOffset}
            alignOffset={args.alignOffset}
            avoidCollisions={args.avoidCollisions}
            collisionPadding={args.collisionPadding}
            hideWhenDetached={args.hideWhenDetached}
            hideArrow={args.hideArrow}
            showCloseButton={args.showCloseButton}
            aria-label={`Popover on the ${side}`}
          >
            <Text size="sm">side=&quot;{side}&quot;</Text>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
};

export const ResponsiveSide: Story = {
  name: "Responsive side (bottom on mobile, right from lg up)",
  parameters: { docs: { source: { code: popoverSnippets.responsiveSide } } },
  argTypes: {
    defaultOpen: { control: false },
    modal: { control: false },
    onOpenChange: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    hideWhenDetached: { control: false },
    hideArrow: { control: false },
    showCloseButton: { control: false },
  },
  render: () => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-16)" }}>
      <Popover defaultOpen>
        <Popover.Trigger asChild>
          <Button>Resize the viewport</Button>
        </Popover.Trigger>
        <Popover.Content
          side={{ base: "bottom", lg: "right" }}
          aria-label="Responsive side example"
          // Open on mount for the demo, but don't take focus: several popovers
          // opening and focusing at once on a Docs page race each other, and
          // Storybook's own `focus()` instrumentation then throws mid-commit.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Text size="sm">
            side=&quot;bottom&quot; below <code>lg</code>, side=&quot;right&quot; from <code>lg</code>{" "}
            up.
          </Text>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const HideWhenDetached: Story = {
  name: "Hides when its trigger scrolls out of view",
  parameters: { docs: { source: { code: popoverSnippets.hideWhenDetached } } },
  argTypes: {
    defaultOpen: { control: false },
    modal: { control: false },
    onOpenChange: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    hideWhenDetached: { control: false },
    hideArrow: { control: false },
    showCloseButton: { control: false },
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-4)",
        alignItems: "center",
      }}
    >
      <Text size="sm">Scroll the box below — the trigger&apos;s own popover hides once it scrolls out of view.</Text>
      <div
        style={{
          height: "var(--dbm-space-32)",
          width: "16rem",
          overflow: "auto",
          border: `var(--dbm-border-width-1) solid var(--dbm-border-default)`,
          borderRadius: "var(--dbm-radius-md)",
        }}
      >
        <div style={{ height: "16rem" }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Popover defaultOpen>
            <Popover.Trigger asChild>
              <Button>Trigger</Button>
            </Popover.Trigger>
            <Popover.Content
              hideWhenDetached
              aria-label="Hides when detached example"
              // Open on mount for the demo, but don't take focus: several popovers
              // opening and focusing at once on a Docs page race each other, and
              // Storybook's own `focus()` instrumentation then throws mid-commit.
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <Text size="sm">Scroll me out of view.</Text>
            </Popover.Content>
          </Popover>
        </div>
        <div style={{ height: "16rem" }} />
      </div>
    </div>
  ),
};

export const WithForm: Story = {
  name: "With interactive form content",
  parameters: { docs: { source: { code: popoverSnippets.withForm } } },
  args: { showCloseButton: true },
  render: function WithFormStory(args) {
    const [name, setName] = useState("");
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-16)" }}>
        <Popover defaultOpen={args.defaultOpen} modal={args.modal} onOpenChange={args.onOpenChange}>
          <Popover.Trigger asChild>
            <IconButton icon={GearIcon} aria-label="Settings" />
          </Popover.Trigger>
          <Popover.Content
            side={args.side}
            align={args.align}
            sideOffset={args.sideOffset}
            alignOffset={args.alignOffset}
            avoidCollisions={args.avoidCollisions}
            collisionPadding={args.collisionPadding}
            hideWhenDetached={args.hideWhenDetached}
            hideArrow={args.hideArrow}
            showCloseButton={args.showCloseButton}
            aria-label="Settings"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", minWidth: "12rem" }}>
              <FieldLabel htmlFor="popover-demo-name">Display name</FieldLabel>
              <Input
                id="popover-demo-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          </Popover.Content>
        </Popover>
      </div>
    );
  },
};


export const DisabledTrigger: Story = {
  name: "Disabled trigger",
  parameters: { docs: { source: { code: popoverSnippets.disabledTrigger } } },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-16)" }}>
      <Popover defaultOpen={args.defaultOpen} modal={args.modal} onOpenChange={args.onOpenChange}>
        <Popover.Trigger asChild>
          <Button disabled>Open popover</Button>
        </Popover.Trigger>
        <Popover.Content
          side={args.side}
          align={args.align}
          sideOffset={args.sideOffset}
          alignOffset={args.alignOffset}
          avoidCollisions={args.avoidCollisions}
          collisionPadding={args.collisionPadding}
          hideWhenDetached={args.hideWhenDetached}
          hideArrow={args.hideArrow}
          showCloseButton={args.showCloseButton}
          aria-label="Example popover"
        >
          <Text size="sm">This is the popover&apos;s own content.</Text>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

// Deliberately no `play` function — found live: a click-driven open/close
// `play` function here proved flaky specifically within
// `@storybook/addon-vitest`'s own browser-mode story sweep (passed in
// isolation, failed once other Popover stories ran alongside it in the
// same continuous page session; `Popover.Content` sometimes never mounts
// even though the trigger's own `data-state` correctly flips to "open").
// The same click-open/Escape-close interaction is reliably covered by a
// plain jsdom + Testing Library unit test instead (Popover.test.tsx) and
// has been live-verified manually in a real browser — this story stays as
// a manually-clickable visual demo, not an automated one, rather than
// carrying a test that intermittently fails for environment reasons
// unrelated to the component's own correctness.
export const ClickInteraction: Story = {
  name: "Click to open, Escape to close",
};

// Deliberately no `play` function — found live, isolated down to a
// completely minimal repro (a Popover plus one plain sibling `<button>`,
// no styling, no design-system components involved): `@storybook/addon-
// vitest`'s own instrumented `userEvent.click` reliably opens the trigger
// itself (`data-state="open"`/`aria-expanded="true"` both flip correctly)
// but `Popover.Content` never actually mounts into the DOM afterward in
// that specific test-runner/Playwright pipeline — while the exact same
// interaction (open via click, click an outside sibling, confirm dismissal)
// works correctly both in real interactive browser use (live-verified) and
// in a plain jsdom + Testing Library unit test (see Popover.test.tsx's own
// "dismisses on an outside click" test). Scoped specifically to addon-
// vitest's own synthetic-event pipeline when a second sibling button is
// present alongside an open Popover — not a defect in this component.
export const OutsideClickInteraction: Story = {
  name: "Click outside to dismiss (non-modal)",
  render: (args) => (
    // `space-16` (not the `space-4` this used before threading `side`/
    // `sideOffset`/etc. through as live args) — found live: with only a 4px
    // gap, `side="bottom"`'s default-rendered content (portaled, so it
    // contributes zero height to this flex column's own layout) visually
    // overlapped "Outside element" entirely, putting the popover's own
    // content on top in z-order — `document.elementFromPoint` at the
    // button's own center hit the popover's text, not the button, meaning a
    // real click could never reach it despite `data-testid` making it look
    // reachable. `space-16` clears the default `sideOffset` (8) plus the
    // content's own rendered height with room to spare.
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-16)", alignItems: "center", paddingBlock: "var(--dbm-space-16)" }}>
      <Popover defaultOpen={args.defaultOpen} modal={args.modal} onOpenChange={args.onOpenChange}>
        <Popover.Trigger asChild>
          <Button>Open popover</Button>
        </Popover.Trigger>
        <Popover.Content
          side={args.side}
          align={args.align}
          sideOffset={args.sideOffset}
          alignOffset={args.alignOffset}
          avoidCollisions={args.avoidCollisions}
          collisionPadding={args.collisionPadding}
          hideWhenDetached={args.hideWhenDetached}
          hideArrow={args.hideArrow}
          showCloseButton={args.showCloseButton}
          aria-label="Example popover"
        >
          <Text size="sm">This is the popover&apos;s own content.</Text>
        </Popover.Content>
      </Popover>
      <Button variant="tertiary" data-testid="outside-target">
        Outside element
      </Button>
    </div>
  ),
};
