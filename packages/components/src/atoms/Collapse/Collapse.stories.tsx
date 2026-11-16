import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactElement } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "../Button";
import { Text } from "../Text";
import { Collapse } from "./Collapse";
import { collapsePlaygroundSnippet, collapseSnippets } from "./Collapse.snippets";
import type { CollapseOrientation, CollapseProps } from "./Collapse.types";

// Shared across every story below whose revealed content is plain text —
// gives the content region a visible boxed background (rather than just
// bare text on the canvas) so the expand/collapse animation reads clearly
// against its own surface, matching the panel styling `Horizontal`
// already uses for its own sidebar-style box.
//
// `marginBlockStart` only applies for `orientation="vertical"` — it's the
// gap between the trigger and the box when they're stacked, deliberately
// the same `space.3` token `rootRow`'s own `gap` uses for `Horizontal`, so
// both orientations get an equal, intentional gap (dropping it entirely
// made the box touch the trigger with no breathing room, which isn't what
// matching `Horizontal`'s spacing meant either). It must stay conditional
// rather than unconditional, though: every story below except the
// dedicated `Horizontal` one still exposes a live `orientation` control,
// and an unconditional top margin on this same box leaks into that case
// too — `rootRow` correctly lays the trigger and content side by side,
// but the box's own margin still pushes it down *within* that flex item,
// reproducing the exact "white space above the content" bug this was
// already fixed for once, just triggered by switching orientation via
// Controls instead of via a dedicated story (confirmed live: switching
// `Default`'s own `orientation` control to "horizontal" reproduced it
// before this was made conditional).
function getContentBoxStyle(orientation: CollapseOrientation): CSSProperties {
  return {
    marginBlockStart:
      orientation === "vertical" ? "var(--dbm-space-3)" : undefined,
    padding: "var(--dbm-space-4)",
    backgroundColor: "var(--dbm-bg-neutral-subtle)",
    borderRadius: "var(--dbm-radius-md)",
  };
}

// `trigger` takes a real element, not a string — Storybook's Controls
// panel can't natively drive an arbitrary ReactElement, so this maps a
// small curated set onto string keys via `argTypes.mapping`, matching
// Tag's own established pattern for its `leadingIcon`/`trailingIcon`
// props (`05-component-api-conventions.md` §5).
const triggerMapping: Record<string, ReactElement | undefined> = {
  "Button trigger": <Button variant="secondary">Toggle details</Button>,
  "None (externally driven)": undefined,
};
const triggerControl = {
  control: "select" as const,
  options: Object.keys(triggerMapping),
  mapping: triggerMapping,
};

const meta: Meta<typeof Collapse> = {
  title: "Components/Collapse",
  id: "atoms-overlay-collapse",
  component: Collapse,
  parameters: { layout: "padded" },
  // Ordered content prop first, then core behavioral props, then
  // advanced/escape-hatch props last — same sequencing principle the
  // future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The content to reveal/hide.",
    },
    // The controlled/uncontrolled pair — matches `Switch`'s own
    // established precedent for exactly this shape: `open` (controlled)
    // gets no live control since toggling it without also wiring
    // `onOpenChange` back would leave the trigger click doing nothing
    // visible; `defaultOpen` demonstrates the uncontrolled path instead.
    open: { control: false, description: "The controlled open state." },
    defaultOpen: {
      description:
        "The initial open state when uncontrolled — sets where it starts, not a live toggle. Click the trigger itself in the canvas to change it.",
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes.",
    },
    disabled: {
      control: "boolean",
      description:
        "Blocks the built-in trigger from toggling open. Has no effect without one.",
    },
    trigger: {
      ...triggerControl,
      description:
        "An optional trigger rendered above the content. Select \"None\" to drive open externally instead — see the dedicated story below for a live example.",
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Which dimension the content region expands/collapses along.",
    },
    // Toggling this in the Playground would leave `children` (a plain
    // text control) as a single valid element only some of the time (a
    // bare string isn't one) — the *point* of `asChild` only shows up
    // against a real target element, same reasoning `Affix`'s own
    // `asChild` control is disabled here in favor of a dedicated story.
    asChild: { control: false },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children:
      "Hidden content revealed on toggle, with an animated height transition.",
    defaultOpen: false,
    disabled: false,
    orientation: "vertical",
    onOpenChange: fn(),
    // Cast, same as Tag's own leadingIcon/trailingIcon default args — this
    // is the Controls-panel select's option key, not CollapseProps["trigger"]
    // itself, hence the cast.
    trigger: "Button trigger" as unknown as CollapseProps["trigger"],
  },
};

export default meta;

type Story = StoryObj<typeof Collapse>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => collapsePlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      {/*
       * `children` is rendered through the shared `getContentBoxStyle` box,
       * matching `Default`'s own treatment below — `Collapse` itself adds
       * no styling of its own around its content (an unopinionated
       * wrapper, the same design as `Backdrop`'s own `children`), so the
       * raw string would otherwise render as plain, unstyled text with no
       * visible boundary, which reads as a broken demo rather than the
       * deliberate "bring your own presentation" default it actually is.
       */}
      <Collapse {...args}>
        <Text style={getContentBoxStyle(args.orientation ?? "vertical")}>
          {args.children}
        </Text>
      </Collapse>
    </div>
  ),
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => collapsePlaygroundSnippet(context.args, true),
      },
    },
  },
  // `trigger` is fixed to this story's own Button — the demonstrated
  // pattern is "self-contained disclosure with a built-in trigger," so
  // swapping it to "None" would defeat the point. `children`/`disabled`/
  // `orientation`/`defaultOpen` stay genuinely live.
  argTypes: { trigger: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Collapse
        {...args}
        trigger={<Button variant="secondary">Toggle details</Button>}
      >
        <Text style={getContentBoxStyle(args.orientation ?? "vertical")}>
          {args.children}
        </Text>
      </Collapse>
    </div>
  ),
};

export const OpenByDefault: Story = {
  name: "Open by default",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => collapsePlaygroundSnippet(context.args, true),
      },
    },
  },
  argTypes: { trigger: { control: false }, defaultOpen: { control: false } },
  args: { defaultOpen: true },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Collapse
        {...args}
        trigger={<Button variant="secondary">Toggle details</Button>}
      >
        <Text style={getContentBoxStyle(args.orientation ?? "vertical")}>
          {args.children}
        </Text>
      </Collapse>
    </div>
  ),
};

export const WithoutTrigger: Story = {
  name: "Externally driven (no built-in trigger)",
  parameters: { docs: { source: { code: collapseSnippets.withoutTrigger } } },
  argTypes: { trigger: { control: false } },
  render: function WithoutTriggerStory(args) {
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Collapse {...args} open trigger={undefined}>
          <Text style={getContentBoxStyle(args.orientation ?? "vertical")}>
            Accordion uses Collapse this way — driving open from its own
            trigger UI instead of this component&apos;s internal one.
          </Text>
        </Collapse>
      </div>
    );
  },
};

export const Horizontal: Story = {
  name: "Horizontal orientation",
  parameters: { docs: { source: { code: collapseSnippets.horizontal } } },
  argTypes: {
    trigger: { control: false },
    orientation: { control: false },
  },
  args: { orientation: "horizontal" },
  render: (args) => (
    <Collapse
      {...args}
      trigger={<Button variant="secondary">Toggle sidebar</Button>}
    >
      <div
        style={{
          padding: "var(--dbm-space-4)",
          width: "12rem",
          backgroundColor: "var(--dbm-bg-neutral-subtle)",
          borderRadius: "var(--dbm-radius-md)",
        }}
      >
        <Text>A sidebar-style panel that grows/shrinks sideways.</Text>
      </div>
    </Collapse>
  ),
};

export const AsChild: Story = {
  name: "As child (no wrapper element)",
  parameters: { docs: { source: { code: collapseSnippets.asChild } } },
  // `asChild` had no dedicated demo before this addition — the concrete
  // use case that motivates it (a `<li>` in a real `<ul>` can't have a
  // `<div>` wrapped around it without an invalid-list-child warning), so
  // it needs proof against a genuine list, not just a generic `<div>`
  // standing in for one.
  argTypes: {
    trigger: { control: false },
    asChild: { control: false },
    children: { control: false },
  },
  args: { asChild: true, defaultOpen: true },
  render: function AsChildStory(args) {
    return (
      <ul
        style={{
          margin: 0,
          paddingInlineStart: "var(--dbm-space-5)",
          // `inside` (applied list-wide, so all 3 markers match) — the
          // collapsible `<li>` also carries Content's own `.content`
          // class for its core clip-during-animation behavior, and
          // `overflow: hidden` suppresses a `outside`-positioned marker on
          // the same element in every mainstream browser (confirmed live
          // via `elementFromPoint` — the marker's own hit area resolved to
          // the parent `<ul>`, not the `<li>`, only for this one). That
          // `overflow` can't be dropped without breaking the real
          // component's collapse animation, so `inside` sidesteps it by
          // rendering the marker as ordinary content instead, unaffected
          // by the host element's own overflow.
          listStylePosition: "inside",
        }}
      >
        <li>
          <Text as="span">Always-visible item</Text>
        </li>
        {/*
         * The background/spacing box lives on `Collapse`'s own `style`
         * prop, not a wrapping `<div>` — with `asChild`, that `style`
         * merges (via the same chained-Slot flattening `asChild` itself
         * relies on) directly onto the `<li>` below, so it gets the same
         * visible boxed treatment every other story's content region has
         * without reintroducing the extra wrapper element this story
         * exists to demonstrate `Collapse` doesn't need. `marginBlock`
         * (both sides, unlike the trigger-relative `marginBlockStart`
         * used elsewhere) gives it breathing room from the always-visible
         * `<li>`s above and below, rather than the trigger it doesn't have
         * one of here.
         */}
        <Collapse
          {...args}
          trigger={undefined}
          style={{
            marginBlock: "var(--dbm-space-3)",
            padding: "var(--dbm-space-4)",
            backgroundColor: "var(--dbm-bg-neutral-subtle)",
            borderRadius: "var(--dbm-radius-md)",
          }}
        >
          <li data-testid="collapsible-item">
            <Text as="span">
              A collapsible list item — the &lt;li&gt; itself is what Radix
              slots onto, no extra wrapper &lt;div&gt; between it and the
              &lt;ul&gt;.
            </Text>
          </li>
        </Collapse>
        <li>
          <Text as="span">Another always-visible item</Text>
        </li>
      </ul>
    );
  },
};

export const ToggleInteraction: Story = {
  name: "Interaction: trigger click reveals and hides content",
  argTypes: { trigger: { control: false } },
  render: (args) => (
    <Collapse
      {...args}
      trigger={<Button variant="secondary">Toggle details</Button>}
    >
      <Text style={getContentBoxStyle(args.orientation ?? "vertical")}>
        {args.children}
      </Text>
    </Collapse>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Toggle details" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses (the real animation is only `motion.duration.base`, 200ms).
    // Without them, both toggles happened back to back with no visible
    // gap, reading as a single flash rather than two distinct,
    // observable state changes.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvas.queryByText(
        "Hidden content revealed on toggle, with an animated height transition.",
      ),
    ).not.toBeInTheDocument();
    await pause(600);

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByText(
        "Hidden content revealed on toggle, with an animated height transition.",
      ),
    ).toBeVisible();
    await pause(1200);

    // Keyboard activation — a real <button> gets this natively, but this
    // proves the trigger really is one, not just visually styled as one.
    // Already focused from the click above (a real click focuses a real
    // <button>), so no separate focus step is needed before pressing Enter.
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
