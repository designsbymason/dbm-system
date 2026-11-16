import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Avatar } from "../../atoms/Avatar";
import { Link } from "../../atoms/Link";
import { Skeleton } from "../../atoms/Skeleton";
import { Stack } from "../../atoms/Stack";
import { Text } from "../../atoms/Text";
import { HoverCard } from "./HoverCard";
import { hoverCardPlaygroundSnippet, hoverCardSnippets } from "./HoverCard.snippets";
import { HoverCardProvider } from "./HoverCardProvider";
import type { HoverCardAlign, HoverCardContentProps, HoverCardSide, HoverCardSize } from "./HoverCard.types";

// Combines HoverCard's own root-level args (defaultOpen/openDelay/closeDelay/
// onOpenChange) with HoverCard.Content's own args (side/align/etc.) in one
// Playground — `meta.component` can only resolve docgen argTypes for one
// component, so Content's args are declared manually below and threaded
// through this custom `render`. HoverCard.Trigger and HoverCard.Content each
// still get their own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013).
interface PlaygroundArgs {
  defaultOpen: boolean;
  openDelay: number;
  closeDelay: number;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  size: HoverCardSize;
  side: HoverCardSide;
  align: HoverCardAlign;
  sideOffset: number;
  alignOffset: number;
  avoidCollisions: boolean;
  collisionPadding: number;
  hideWhenDetached: boolean;
  hideArrow: boolean;
  onEscapeKeyDown: HoverCardContentProps["onEscapeKeyDown"];
  onPointerDownOutside: HoverCardContentProps["onPointerDownOutside"];
  onFocusOutside: HoverCardContentProps["onFocusOutside"];
  onInteractOutside: HoverCardContentProps["onInteractOutside"];
}

// Every trigger here is a real link (that is the component's contract), so a click
// would leave the story for a page that doesn't exist. These demos are about the
// card, not the destination: swallow the navigation.
const preventNavigation = (event: MouseEvent) => event.preventDefault();

const centered = { display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-16)" } as const;

function ProfilePreview() {
  return (
    <Stack direction="row" gap={3} align="center">
      <Avatar name="Jane Doe" size="md" />
      <Stack gap={1}>
        <Text weight="semibold">Jane Doe</Text>
        <Text size="sm" color="secondary">
          Design systems engineer
        </Text>
      </Stack>
    </Stack>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/HoverCard",
  id: "molecules-overlay-hovercard",
  parameters: { layout: "padded" },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "The initial open state when uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    openDelay: {
      control: "number",
      description:
        "Milliseconds the pointer or keyboard focus must stay on the trigger before the card opens.",
      table: { defaultValue: { summary: "300" } },
    },
    closeDelay: {
      control: "number",
      description:
        "Milliseconds the card stays open after the pointer or focus leaves the trigger and the card.",
      table: { defaultValue: { summary: "300" } },
    },
    disabled: {
      control: "boolean",
      description: "Turns the card off: it never opens, and one that is open closes. The trigger stays a working link.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called whenever the open state changes.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The padding step around the content, on the standard scale (8, 12, 16, 20, 24px).",
      table: { defaultValue: { summary: '"md"' } },
    },
    side: {
      // A `select` of the single-value form — `Responsive<HoverCardSide>` has no
      // single control shape; the responsive-map form gets its own story below.
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the content renders on — a single value (shown here) or a mobile-first responsive map keyed by breakpoint (e.g. { base: 'bottom', lg: 'right' }).",
      table: { defaultValue: { summary: '"top"' } },
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
        "Hides the content entirely when its trigger is fully scrolled out of view, instead of leaving it floating in a now-meaningless position.",
      table: { defaultValue: { summary: "false" } },
    },
    hideArrow: {
      control: "boolean",
      description: "Hides the small pointer arrow connecting the content to its trigger.",
      table: { defaultValue: { summary: "false" } },
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
      description: "Called when focus moves outside the content.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the content. Can be prevented.",
    },
  },
  args: {
    defaultOpen: false,
    openDelay: 300,
    closeDelay: 300,
    disabled: false,
    size: "md",
    side: "top",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    avoidCollisions: true,
    collisionPadding: 8,
    hideWhenDetached: false,
    hideArrow: false,
    onOpenChange: fn(),
    onEscapeKeyDown: fn(),
    onPointerDownOutside: fn(),
    onFocusOutside: fn(),
    onInteractOutside: fn(),
  },
  render: (args) => (
    <div style={centered}>
      <HoverCard
        defaultOpen={args.defaultOpen}
        openDelay={args.openDelay}
        closeDelay={args.closeDelay}
        disabled={args.disabled}
        onOpenChange={args.onOpenChange}
      >
        <HoverCard.Trigger asChild>
          <Link href="#jane" onClick={preventNavigation}>@jane</Link>
        </HoverCard.Trigger>
        <HoverCard.Content
          size={args.size}
          side={args.side}
          align={args.align}
          sideOffset={args.sideOffset}
          alignOffset={args.alignOffset}
          avoidCollisions={args.avoidCollisions}
          collisionPadding={args.collisionPadding}
          hideWhenDetached={args.hideWhenDetached}
          hideArrow={args.hideArrow}
          onEscapeKeyDown={args.onEscapeKeyDown}
          onPointerDownOutside={args.onPointerDownOutside}
          onFocusOutside={args.onFocusOutside}
          onInteractOutside={args.onInteractOutside}
        >
          <ProfilePreview />
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Hover the link (or tab to it) and drive every prop live via the Controls panel. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => hoverCardPlaygroundSnippet(context.args),
      },
    },
  },
};

export const ProfileCard: Story = {
  name: "Open, with a profile preview",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => hoverCardPlaygroundSnippet(context.args),
      },
    },
  },
  args: { defaultOpen: true },
};

export const AllSides: Story = {
  name: "All sides",
  parameters: { docs: { source: { code: hoverCardSnippets.allSides } } },
  argTypes: {
    // `side` is hardcoded per instance by the loop below — a control would be a no-op.
    side: { control: false },
    // Every instance is held open (`open`), so these have nothing to act on.
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    disabled: { control: false },
  },
  render: (args) => (
    // `repeat(auto-fit, minmax(...))` so two columns never sit closer than an
    // open card is wide: a narrow screen collapses to one column instead of a
    // repositioned card landing on its neighbour's trigger.
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
        <HoverCard key={side} open>
          <HoverCard.Trigger asChild>
            <Link href={`#${side}`} onClick={preventNavigation}>{side}</Link>
          </HoverCard.Trigger>
          <HoverCard.Content
            side={side}
            size={args.size}
            align={args.align}
            sideOffset={args.sideOffset}
            alignOffset={args.alignOffset}
            avoidCollisions={args.avoidCollisions}
            collisionPadding={args.collisionPadding}
            hideWhenDetached={args.hideWhenDetached}
            hideArrow={args.hideArrow}
          >
            <Text size="sm">side=&quot;{side}&quot;</Text>
          </HoverCard.Content>
        </HoverCard>
      ))}
    </div>
  ),
};

export const ResponsiveSide: Story = {
  name: "Responsive side (bottom on mobile, right from lg up)",
  parameters: { docs: { source: { code: hoverCardSnippets.responsiveSide } } },
  argTypes: {
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    size: { control: false },
    disabled: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    hideWhenDetached: { control: false },
    hideArrow: { control: false },
  },
  render: () => (
    <div style={centered}>
      <HoverCard defaultOpen>
        <HoverCard.Trigger asChild>
          <Link href="#resize" onClick={preventNavigation}>Resize the viewport</Link>
        </HoverCard.Trigger>
        <HoverCard.Content side={{ base: "bottom", lg: "right" }}>
          <Text size="sm">
            side=&quot;bottom&quot; below <code>lg</code>, side=&quot;right&quot; from <code>lg</code> up.
          </Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

export const HideWhenDetached: Story = {
  name: "Hides when its trigger scrolls out of view",
  parameters: { docs: { source: { code: hoverCardSnippets.hideWhenDetached } } },
  argTypes: {
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    size: { control: false },
    disabled: { control: false },
    side: { control: false },
    align: { control: false },
    sideOffset: { control: false },
    alignOffset: { control: false },
    avoidCollisions: { control: false },
    collisionPadding: { control: false },
    hideWhenDetached: { control: false },
    hideArrow: { control: false },
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      <Text size="sm">Scroll the box below — the card hides once its trigger scrolls out of view.</Text>
      <div
        style={{
          height: "var(--dbm-space-32)",
          width: "16rem",
          overflow: "auto",
          border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-md)",
        }}
      >
        <div style={{ height: "16rem" }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <HoverCard defaultOpen>
            <HoverCard.Trigger asChild>
              <Link href="#detached" onClick={preventNavigation}>Trigger</Link>
            </HoverCard.Trigger>
            <HoverCard.Content hideWhenDetached>
              <Text size="sm">Scroll me out of view.</Text>
            </HoverCard.Content>
          </HoverCard>
        </div>
        <div style={{ height: "16rem" }} />
      </div>
    </div>
  ),
};

export const Delays: Story = {
  name: "Custom open and close delays",
  parameters: { docs: { source: { code: hoverCardSnippets.delays } } },
  argTypes: {
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    size: { control: false },
    disabled: { control: false },
  },
  render: (args) => (
    <div style={centered}>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <Link href="#quick" onClick={preventNavigation}>Hover for a quicker card</Link>
        </HoverCard.Trigger>
        <HoverCard.Content side={args.side} align={args.align} hideArrow={args.hideArrow}>
          <Text size="sm">Opens after 100ms, closes 100ms after leaving.</Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled open state",
  parameters: { docs: { source: { code: hoverCardSnippets.controlled } } },
  argTypes: {
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    size: { control: false },
    disabled: { control: false },
  },
  render: function ControlledStory(args) {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ ...centered, flexDirection: "column", alignItems: "center", gap: "var(--dbm-space-2)" }}>
        <HoverCard open={open} onOpenChange={setOpen} openDelay={args.openDelay} closeDelay={args.closeDelay}>
          <HoverCard.Trigger asChild>
            <Link href="#controlled" onClick={preventNavigation}>@jane</Link>
          </HoverCard.Trigger>
          <HoverCard.Content side={args.side} align={args.align} hideArrow={args.hideArrow}>
            <Text size="sm">{open ? "Open" : "Closed"}</Text>
          </HoverCard.Content>
        </HoverCard>
        <Text size="sm" color="secondary">
          State: {open ? "open" : "closed"}
        </Text>
      </div>
    );
  },
};

export const PlainTrigger: Story = {
  name: "The built-in trigger (a plain link)",
  parameters: { docs: { source: { code: hoverCardSnippets.plainTrigger } } },
  argTypes: {
    defaultOpen: { control: false },
    openDelay: { control: false },
    closeDelay: { control: false },
    onOpenChange: { control: false },
    size: { control: false },
    disabled: { control: false },
  },
  render: (args) => (
    <div style={centered}>
      <Text>
        Posted by{" "}
        <HoverCard>
          <HoverCard.Trigger href="#jane" onClick={preventNavigation}>
            @jane
          </HoverCard.Trigger>
          <HoverCard.Content side={args.side} align={args.align} hideArrow={args.hideArrow}>
            <Text size="sm">Jane Doe</Text>
          </HoverCard.Content>
        </HoverCard>{" "}
        yesterday.
      </Text>
    </div>
  ),
};

const noControls = {
  defaultOpen: { control: false },
  openDelay: { control: false },
  closeDelay: { control: false },
  onOpenChange: { control: false },
  side: { control: false },
  align: { control: false },
  sideOffset: { control: false },
  alignOffset: { control: false },
  avoidCollisions: { control: false },
  collisionPadding: { control: false },
  hideWhenDetached: { control: false },
  hideArrow: { control: false },
  size: { control: false },
  disabled: { control: false },
} as const;

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: hoverCardSnippets.sizes } } },
  argTypes: { ...noControls, size: { control: false } },
  render: () => (
    // One row per size, each row tall enough for the largest card (about 68px), so the
    // cards, all held open and drawn to the right of their links, never overlap.
    <div style={{ display: "flex", flexDirection: "column", paddingInline: "var(--dbm-space-8)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ alignItems: "center", display: "flex", minBlockSize: "var(--dbm-space-20)" }}>
          <HoverCard open>
            <HoverCard.Trigger asChild>
              <Link href={`#${size}`} onClick={preventNavigation}>
                {size}
              </Link>
            </HoverCard.Trigger>
            <HoverCard.Content side="right" size={size}>
              <Text size="sm">size=&quot;{size}&quot;</Text>
            </HoverCard.Content>
          </HoverCard>
        </div>
      ))}
    </div>
  ),
};

export const WithMedia: Story = {
  name: "With an image across the top",
  parameters: { docs: { source: { code: hoverCardSnippets.withMedia } } },
  argTypes: noControls,
  render: () => (
    <div style={{ ...centered, paddingBlockStart: "calc(var(--dbm-space-32) + var(--dbm-space-8))" }}>
      <HoverCard open>
        <HoverCard.Trigger asChild>
          <Link href="#jane" onClick={preventNavigation}>
            @jane
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <HoverCard.Media data-testid="media">
            {/* A drawn banner so the story has no file to load; a real card uses <img>. */}
            <svg viewBox="0 0 320 112" role="img" aria-label="Banner">
              <rect width="320" height="112" fill="var(--dbm-bg-brand-subtle)" />
              <circle cx="262" cy="30" r="46" fill="var(--dbm-bg-brand)" opacity="0.35" />
              <circle cx="60" cy="100" r="64" fill="var(--dbm-bg-brand)" opacity="0.2" />
            </svg>
          </HoverCard.Media>
          <ProfilePreview />
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { docs: { source: { code: hoverCardSnippets.disabled } } },
  argTypes: { ...noControls, disabled: { control: false } },
  render: () => (
    <div style={{ ...centered, flexDirection: "column", alignItems: "center", gap: "var(--dbm-space-4)" }}>
      <HoverCard disabled>
        <HoverCard.Trigger asChild>
          <Link href="#jane" onClick={preventNavigation}>
            @jane (no card)
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <ProfilePreview />
        </HoverCard.Content>
      </HoverCard>
      <Text size="sm" color="secondary">
        The link still works; the card never opens.
      </Text>
    </div>
  ),
};

export const LoadingContent: Story = {
  name: "Loading its content when it opens",
  parameters: { docs: { source: { code: hoverCardSnippets.loadingContent } } },
  argTypes: noControls,
  render: function LoadingContentStory() {
    const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
    const timer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(timer.current), []);
    // The card asks for its data the first time it opens and keeps it, so a second hover shows it at once.
    const handleOpenChange = (open: boolean) => {
      if (!open || status !== "idle") return;
      setStatus("loading");
      timer.current = window.setTimeout(() => setStatus("ready"), 1200);
    };
    return (
      <div style={centered}>
        <HoverCard onOpenChange={handleOpenChange}>
          <HoverCard.Trigger asChild>
            <Link href="#jane" onClick={preventNavigation}>
              @jane
            </Link>
          </HoverCard.Trigger>
          <HoverCard.Content>
            {/* The content reserves the loaded content's size (its width and its three rems of height), so the card doesn't change size when the data arrives. */}
            <div style={{ minInlineSize: "14rem", minBlockSize: "3rem" }} aria-busy={status === "loading"}>
              {status === "ready" ? (
                <ProfilePreview />
              ) : (
                <Stack direction="row" gap={3} align="center">
                  <Skeleton variant="circular" width="var(--dbm-avatar-size-md)" height="var(--dbm-avatar-size-md)" />
                  <Stack gap={2}>
                    <Skeleton width="7rem" />
                    <Skeleton width="10rem" />
                  </Stack>
                </Stack>
              )}
            </div>
          </HoverCard.Content>
        </HoverCard>
      </div>
    );
  },
};

export const SharedTiming: Story = {
  name: "Shared timing across a row of links (HoverCardProvider)",
  parameters: { docs: { source: { code: hoverCardSnippets.sharedTiming } } },
  argTypes: noControls,
  render: () => (
    <HoverCardProvider openDelay={500}>
      <div style={{ ...centered, flexDirection: "column", alignItems: "center", gap: "var(--dbm-space-4)" }}>
        <Text size="sm" color="secondary">
          Rest on the first name, then move along the row: each next card opens at once.
        </Text>
        <Stack direction="row" gap={6}>
          {["Jane Doe", "Sam Lee", "Ana Ruiz", "Tom Ito"].map((name) => (
            <HoverCard key={name}>
              <HoverCard.Trigger asChild>
                <Link href={`#${name}`} onClick={preventNavigation}>
                  {name}
                </Link>
              </HoverCard.Trigger>
              <HoverCard.Content>
                <Stack direction="row" gap={3} align="center">
                  <Avatar name={name} size="md" />
                  <Text weight="semibold">{name}</Text>
                </Stack>
              </HoverCard.Content>
            </HoverCard>
          ))}
        </Stack>
      </div>
    </HoverCardProvider>
  ),
};

// The stories below are hidden from the sidebar and the Docs page (`!dev`): they
// change the page's state (a hover, a Tab), so shown they would animate and settle
// somewhere unexpected — but they still run as tests.

const instantArgs = { openDelay: 0, closeDelay: 0 } as const;

export const HoverInteraction: Story = {
  name: "Hover to open, leave to close — interaction test",
  tags: ["!dev"],
  args: instantArgs,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("link", { name: "@jane" });
    await userEvent.hover(trigger);
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeVisible());
    await expect(trigger).toHaveAttribute("data-state", "open");
    await userEvent.unhover(trigger);
    await waitFor(() => expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument());
  },
};

export const KeyboardInteraction: Story = {
  name: "Tab to open, Escape to close — interaction test",
  tags: ["!dev"],
  args: instantArgs,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("link", { name: "@jane" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeVisible());
    // Escape closes it and focus stays on the link.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

export const OnAPhone: Story = {
  name: "On a phone — the card stays on screen — interaction test",
  tags: ["!dev"],
  args: { defaultOpen: true },
  // Opened on its own, this story is shown at a phone's width (and it is in the
  // test run).
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingBlock: "var(--dbm-space-16)" }}>
      <HoverCard defaultOpen>
        <HoverCard.Trigger asChild>
          <Link href="#edge" onClick={preventNavigation}>@jane</Link>
        </HoverCard.Trigger>
        <HoverCard.Content data-testid="phone-card">
          <Text>
            A long preview line that has to wrap rather than push the card past the edge of a phone screen,
            however wide its preferred width is.
          </Text>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
  play: async () => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(480);
    const card = await screen.findByTestId("phone-card");
    const rect = card.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    // And the width cap holds: never wider than the 20rem token.
    await expect(rect.width).toBeLessThanOrEqual(320);
  },
};

export const PlainTriggerLooksLikeALink: Story = {
  name: "The built-in trigger is marked as a link without colour — interaction test",
  tags: ["!dev"],
  render: () => (
    <p data-testid="sentence">
      Posted by{" "}
      <HoverCard>
        <HoverCard.Trigger href="#jane" onClick={preventNavigation}>
            @jane
          </HoverCard.Trigger>
        <HoverCard.Content>Jane Doe</HoverCard.Content>
      </HoverCard>{" "}
      yesterday.
    </p>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("link", { name: "@jane" });
    const style = getComputedStyle(trigger);
    // With the colour inherited from the sentence, the underline is the only cue (WCAG 1.4.1).
    await expect(style.color).toBe(getComputedStyle(within(canvasElement).getByTestId("sentence")).color);
    await expect(style.textDecorationLine).toContain("underline");
  },
};

export const ArrowIsDrawnFromTheSurfaceTokens: Story = {
  name: "The arrow matches the card's surface and border — interaction test",
  tags: ["!dev"],
  args: { defaultOpen: true },
  play: async () => {
    const card = await screen.findByText("Jane Doe");
    const arrow = card.closest("[data-radix-popper-content-wrapper]")?.querySelector("svg");
    await expect(arrow).toBeTruthy();
    const polygon = arrow!.querySelector("polygon")!;
    const path = arrow!.querySelector("path")!;
    const content = card.closest<HTMLElement>("[data-state]")!;
    // The fill is the surface and the stroke the border — the same colours as the card itself.
    await expect(getComputedStyle(polygon).fill).toBe(getComputedStyle(content).backgroundColor);
    await expect(getComputedStyle(path).stroke).toBe(getComputedStyle(content).borderTopColor);
    await expect(getComputedStyle(path).fill).toBe("none");
    // The stroke must stay one width however the 30x10 shape is scaled down.
    await expect(getComputedStyle(path).vectorEffect).toBe("non-scaling-stroke");
    await expect(getComputedStyle(path).strokeWidth).toBe(getComputedStyle(content).borderTopWidth);
  },
};

export const LoadingContentInteraction: Story = {
  name: "The loading card keeps its size when the data arrives — interaction test",
  tags: ["!dev"],
  render: LoadingContent.render,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("link", { name: "@jane" }));
    const busy = await waitFor(() => {
      const element = document.querySelector<HTMLElement>("[data-state='open'] [aria-busy='true']");
      if (!element) throw new Error("no loading card yet");
      return element;
    });
    // Layout size, not the drawn rectangle: a card that is still fading in is scaled.
    const before = busy.closest<HTMLElement>("[data-state]")!;
    const beforeSize = [before.offsetWidth, before.offsetHeight];
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeVisible(), { timeout: 3000 });
    const after = screen.getByText("Jane Doe").closest<HTMLElement>("[data-state]")!;
    await expect(after.offsetWidth).toBe(beforeSize[0]);
    await expect(after.offsetHeight).toBe(beforeSize[1]);
  },
};
