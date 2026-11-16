import { TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { Tooltip } from "./Tooltip";
import { tooltipPlaygroundSnippet, tooltipSnippets } from "./Tooltip.snippets";
import { TooltipProvider } from "./TooltipProvider";
import type { TooltipProps } from "./Tooltip.types";

// `children` (the trigger) takes a real element, not a string — Storybook's
// Controls panel can't natively drive an arbitrary ReactElement, so this
// maps a small curated set onto string keys via `argTypes.mapping`,
// matching Tag's own established pattern for its `leadingIcon`/
// `trailingIcon` props (`05-component-api-conventions.md` §5).
const triggerMapping: Record<string, ReactElement> = {
  "Button trigger": <Button variant="secondary">Hover or focus me</Button>,
  "Icon-only trigger": (
    <IconButton icon={TrashIcon} aria-label="Delete" variant="destructive" />
  ),
};
const triggerControl = {
  control: "select" as const,
  options: Object.keys(triggerMapping),
  mapping: triggerMapping,
};

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  id: "atoms-overlay-tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
  // Content prop first, then the trigger, then core visual/behavioral
  // props, then advanced/escape-hatch props last — same sequencing
  // principle the Docs page's own Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    content: {
      control: "text",
      description:
        "The tooltip's own content. Keep it short and non-interactive — Radix's own DismissableLayer doesn't trap focus or accept pointer input inside it.",
    },
    children: {
      ...triggerControl,
      description:
        "The trigger — a single element that accepts a ref (via Radix Slot composition). Must itself be focusable for the tooltip to be reachable without a pointer — Tooltip adds no tabIndex of its own.",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the tooltip renders on. Radix repositions it automatically to stay within the viewport if the requested side would overflow.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Alignment along the chosen side — e.g. side=\"top\" with align=\"start\" left-aligns the tooltip over the trigger instead of centering it.",
    },
    delayDuration: {
      control: { type: "number", min: 0, step: 100 },
      description:
        "Milliseconds the trigger must be hovered/focused before the tooltip opens. Standalone (no ambient TooltipProvider), defaults to 400ms; nested inside one, leaving this unset inherits its delayDuration instead.",
      // No literal destructuring default in code (an unset value must
      // stay `undefined` so it can inherit an ambient `TooltipProvider`'s
      // own delayDuration instead of always shadowing it) — docgen has
      // nothing to read a "Default" from as a result, so it's set
      // explicitly here instead, matching the effective standalone value
      // documented in the description above.
      table: { defaultValue: { summary: "400" } },
    },
    disableHoverableContent: {
      control: "boolean",
      description:
        "When true, moving the pointer from the trigger toward the tooltip content closes it immediately instead of leaving it open while the pointer travels there. Same standalone-vs-TooltipProvider inheritance as delayDuration.",
      // Same reasoning as `delayDuration` above.
      table: { defaultValue: { summary: "false" } },
    },
    hideArrow: {
      control: "boolean",
      description: "Hides the small pointer arrow connecting the tooltip to its trigger.",
    },
    // The controlled/uncontrolled pair — matches every other stateful
    // component's own established precedent (`Switch`, `Collapse`, …):
    // `open` gets no live control since toggling it without also wiring
    // `onOpenChange` back would leave hover/focus doing nothing visible;
    // `defaultOpen` demonstrates the uncontrolled path instead.
    open: {
      control: false,
      description:
        "The controlled open state. Omit (along with defaultOpen) to manage open state uncontrolled internally.",
    },
    defaultOpen: {
      control: "boolean",
      description:
        "The initial open state for uncontrolled usage — ignored once open is provided.",
      // Same reasoning as `delayDuration`/`disableHoverableContent`
      // above: no literal destructuring default in code (Radix's own
      // `useControllableState` applies its internal `?? false` fallback
      // instead), so docgen has nothing to read a "Default" from.
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes — a hover/focus that opens or closes it, an Escape press, or a controlled open update confirming the value took effect.",
    },
    "aria-label": {
      control: "text",
      description:
        "A plain-text accessible description used instead of the visible content for assistive technology. Doesn't change what's visually shown — a separate visually-hidden element carrying this string is what's actually announced instead of content.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the tooltip's content element (not the trigger) — also what the trigger's own aria-describedby points at while open.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for the tooltip's content element. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles for the tooltip's content element, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors), applied to the tooltip's content element. Has no visual or behavioral effect.",
    },
  },
  args: {
    content: "Save your changes",
    children: "Button trigger" as unknown as TooltipProps["children"],
    side: "top",
    align: "center",
    // Matches the component's own real standalone default (see
    // `delayDuration`'s JSDoc) — without an explicit value here, this
    // optional prop with no literal destructuring default renders as an
    // inert "Set number" placeholder button in the Controls panel instead
    // of a genuinely interactive number input (06-engineering-standards.md
    // §9: every control must be a real input or explicitly `control:
    // false`, never a placeholder in between).
    delayDuration: 400,
    disableHoverableContent: false,
    hideArrow: false,
    defaultOpen: false,
    // No true default (an optional string with none) — "" keeps the text
    // control genuinely interactive from the start (same "Set string"
    // placeholder issue as `delayDuration` above) rather than requiring a
    // click to initialize it, and is safe here specifically because
    // Radix's own `ariaLabel ? ... : ...` branching treats an empty
    // string exactly like "not set" (both falsy) — confirmed by reading
    // its source, not assumed.
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tooltipPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <div style={{ padding: "var(--dbm-space-12)" }}>
      <Tooltip {...args} />
    </div>
  ),
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tooltipPlaygroundSnippet(context.args, "save"),
      },
    },
  },
  argTypes: { children: { control: false } },
  render: (args) => (
    <div style={{ padding: "var(--dbm-space-12)" }}>
      <Tooltip {...args}>
        <Button>Save</Button>
      </Tooltip>
    </div>
  ),
};

export const Sides: Story = {
  name: "All sides",
  parameters: { docs: { source: { code: tooltipSnippets.sides } } },
  argTypes: { children: { control: false }, side: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        gap: "var(--dbm-space-8)",
        padding: "var(--dbm-space-12)",
      }}
    >
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip {...args} key={side} content={`Side: ${side}`} side={side}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const IconTrigger: Story = {
  name: "Icon-only trigger",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tooltipPlaygroundSnippet(context.args, "icon"),
      },
    },
  },
  argTypes: { children: { control: false } },
  args: { content: "Delete item" },
  render: (args) => (
    <div style={{ padding: "var(--dbm-space-12)" }}>
      <Tooltip {...args}>
        <IconButton icon={TrashIcon} aria-label="Delete" variant="destructive" />
      </Tooltip>
    </div>
  ),
};

export const MultipleWithSharedProvider: Story = {
  name: "Multiple tooltips (shared TooltipProvider)",
  parameters: { docs: { source: { code: tooltipSnippets.multipleWithSharedProvider } } },
  argTypes: {
    children: { control: false },
    content: { control: false },
    side: { control: false },
    align: { control: false },
    delayDuration: { control: false },
    disableHoverableContent: { control: false },
    hideArrow: { control: false },
    defaultOpen: { control: false },
    "aria-label": { control: false },
  },
  render: function MultipleWithSharedProviderStory() {
    return (
      <TooltipProvider>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)", padding: "var(--dbm-space-12)" }}>
          <Tooltip content="Bold">
            <Button variant="secondary">B</Button>
          </Tooltip>
          <Tooltip content="Italic">
            <Button variant="secondary">I</Button>
          </Tooltip>
          <Tooltip content="Underline">
            <Button variant="secondary">U</Button>
          </Tooltip>
        </div>
        <Text color="tertiary" style={{ paddingBlockStart: "var(--dbm-space-3)" }}>
          Hover one, then quickly move to another — opening the second (and
          third) skips the initial delay instead of re-incurring it, since
          all three share one `TooltipProvider`.
        </Text>
      </TooltipProvider>
    );
  },
};

export const SharedProviderInteraction: Story = {
  name: "Interaction: shared TooltipProvider skips the delay",
  // Deliberately not referenced from Tooltip.mdx's Variants gallery —
  // every Canvas embedded in a Docs page shares one real document
  // (`07-storybook-and-documentation-standards.md` §4.1), and this play
  // function's `document.body`-scoped tooltip query throws
  // ("found multiple elements with role tooltip") the instant more than
  // one story's own tooltip can be open on that shared page at once —
  // confirmed live, exactly this error, when it was still folded into
  // `MultipleWithSharedProvider` above (which stays embedded, visual-only,
  // no play function) instead of being its own separate, sidebar-only
  // story like this one.
  argTypes: {
    children: { control: false },
    content: { control: false },
    side: { control: false },
    align: { control: false },
    delayDuration: { control: false },
    disableHoverableContent: { control: false },
    hideArrow: { control: false },
    defaultOpen: { control: false },
    "aria-label": { control: false },
  },
  render: function SharedProviderInteractionStory() {
    return (
      <TooltipProvider>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)", padding: "var(--dbm-space-12)" }}>
          <Tooltip content="Bold">
            <Button variant="secondary">B</Button>
          </Tooltip>
          <Tooltip content="Italic">
            <Button variant="secondary">I</Button>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boldButton = canvas.getByRole("button", { name: "B" });
    const italicButton = canvas.getByRole("button", { name: "I" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — placed only where it can't interfere with the
    // actual assertion below: before the very first hover (nothing timed
    // yet), and while a tooltip is genuinely open (the skipDelayDuration
    // clock only starts once a tooltip *closes*, so holding one open
    // longer costs nothing). Never between the unhover/hover pair itself
    // — that transition has to stay fast, it's the exact thing being
    // tested.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await pause(500);

    // Content portals to `document.body` — queried globally, not via
    // `canvas`, for that reason (see `ToggleInteraction` below). Safe
    // here specifically because this story is never embedded in the
    // Docs page (see the note above), so it's the only tooltip that can
    // ever be open on the page while this runs.
    await userEvent.hover(boldButton);
    const firstTooltip = await within(document.body).findByRole("tooltip");
    await expect(firstTooltip).toHaveTextContent("Bold");
    await pause(800);

    await userEvent.unhover(boldButton);
    await userEvent.hover(italicButton);
    // Within the default `skipDelayDuration` (300ms) of closing the
    // first, opening the second should skip the default `delayDuration`
    // (400ms) entirely — asserted with a timeout well under that, so this
    // only passes if the skip genuinely happened, not because it would
    // have opened anyway once the normal delay ran out. This is the one
    // assertion in this whole review that couldn't be verified via a
    // jsdom unit test (Radix's real continuous-pointer grace-area
    // tracking isn't reproducible there) — see `Tooltip.test.tsx`.
    await waitFor(
      async () => {
        const tooltip = within(document.body).queryByRole("tooltip");
        await expect(tooltip).toHaveTextContent("Italic");
      },
      { timeout: 250 },
    );
    await pause(800);
  },
};

export const ToggleInteraction: Story = {
  name: "Interaction: hover opens, Escape closes",
  argTypes: { children: { control: false } },
  args: { delayDuration: 0 },
  render: (args) => (
    <div style={{ padding: "var(--dbm-space-12)" }}>
      <Tooltip {...args}>
        <Button>Save</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Save" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — this story sets `delayDuration={0}` so the
    // assertions themselves don't need either pause. Without them, hover
    // and Escape happened back to back with no visible gap, reading as a
    // single flash rather than two distinct, observable state changes —
    // the same fix already applied to Collapse's own equivalent story.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();
    await pause(500);

    // The tooltip content portals to `document.body`, not inside
    // `canvasElement` — queried globally rather than via `canvas` for
    // exactly that reason.
    await userEvent.hover(trigger);
    const tooltip = await within(document.body).findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("Save your changes");
    await pause(1200);

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(within(document.body).queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  },
};
