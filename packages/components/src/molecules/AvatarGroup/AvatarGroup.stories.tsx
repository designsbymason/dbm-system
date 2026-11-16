import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Avatar } from "../../atoms/Avatar";
import { Text } from "../../atoms/Text";
import { Tooltip } from "../../atoms/Tooltip";
import { AvatarGroup } from "./AvatarGroup";
import { avatarGroupPlaygroundSnippet, avatarGroupSnippets } from "./AvatarGroup.snippets";
import type { AvatarGroupProps } from "./AvatarGroup.types";

// The Playground's own args: every `AvatarGroup` prop a control can drive, plus the Storybook-only ones.
interface PlaygroundArgs extends AvatarGroupProps {
  /** Storybook only — how many avatars the demo group holds. */
  count: number;
  /** Storybook only — whether the "+N" tile is a button (`onOverflowClick`). */
  overflowButton: boolean;
}

const noControls = { control: false } as const;
const people = ["Jane Doe", "John Smith", "Alex Kim", "Maria Garcia", "Sam Lee", "Chris Park", "Dana Cruz", "Eli Novak"] as const;

/** The group under test: the args, as many avatars as `count` asks for, and the tile as a button on request. */
const DemoGroup = ({ count, overflowButton, total, onOverflowClick, ...args }: PlaygroundArgs) => (
  <AvatarGroup
    {...args}
    // Storybook's number control can't be empty, so 0 stands for "leave `total` out".
    total={total && total > 0 ? total : undefined}
    onOverflowClick={overflowButton ? () => {} : onOverflowClick}
  >
    {people.slice(0, count).map((name) => (
      <Avatar key={name} name={name} />
    ))}
  </AvatarGroup>
);

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" } as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Components/AvatarGroup",
  id: "molecules-data-display-avatargroup",
  component: AvatarGroup,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same
  // sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The size every avatar in the group uses unless it sets its own size. A single value, or a mobile-first map keyed by breakpoint.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
      description: "The shape every avatar in the group uses unless it sets its own shape. It also shapes the ring drawn between overlapping avatars.",
      table: { defaultValue: { summary: "circle" } },
    },
    colorful: {
      control: "boolean",
      description: "Gives every avatar a colour of its own, derived from its identity, unless it sets its own colorful. The \"+N\" tile is never coloured this way.",
      table: { defaultValue: { summary: "false" } },
    },
    stacked: {
      control: "boolean",
      description:
        "Overlaps the avatars, with a ring in the page surface colour between them (true), or keeps them apart, spaced by a gap and wrapping onto more lines when they don't fit (false).",
      table: { defaultValue: { summary: "true" } },
    },
    max: {
      control: { type: "number", min: 0, max: 8 },
      description:
        "The most avatars to draw. The rest collapse into one \"+N\" tile after them. Left out, every avatar is drawn — here the demo starts at 4 so the tile shows.",
    },
    total: {
      control: { type: "number", min: 0, max: 200 },
      description:
        "The real number of people, when the group holds only some of them (a list loaded a page at a time). The tile then reads total minus the avatars drawn. In this Playground 0 leaves it out.",
    },
    overflowButton: {
      control: "boolean",
      description: "Storybook only — not an AvatarGroup prop. Passes onOverflowClick, so the \"+N\" tile is a button named \"Show N more\".",
      table: { disable: true },
    },
    count: {
      control: { type: "number", min: 1, max: 8 },
      description: "Storybook only — not an AvatarGroup prop. How many avatars the demo group holds.",
      table: { disable: true },
    },
    onOverflowClick: {
      ...noControls,
      description:
        "Makes the \"+N\" tile a button that calls this when pressed — open a popover or a dialog listing the rest. Left out, the tile is not interactive. Its accessible name is labels.overflowButton.",
    },
    formatNumber: {
      ...noControls,
      description:
        "Turns the number in the \"+N\" tile into text — a unit, or a locale's own numerals. A count over 99 is shown as \"99+\", and the accessible name always has the real count.",
      table: { defaultValue: { summary: "(count) => String(count)" } },
    },
    labels: {
      ...noControls,
      description: "The words the group writes itself; translate them here. Give only the ones you change: overflow (\"3 more\") and overflowButton (\"Show 3 more\").",
    },
    children: {
      ...noControls,
      description:
        "The Avatars to show, one child each. Each is put in its own list item. A child may be wrapped — in a Tooltip, say — but set shape on the group rather than on a wrapped avatar.",
    },
    "aria-label": {
      control: "text",
      description: "Names the group for assistive tech (\"Project members\"), announced with the list. Required unless aria-labelledby points at a visible label.",
    },
    "aria-labelledby": {
      ...noControls,
      description: "The id of an already-visible element that names the group, in place of aria-label.",
    },
    "aria-describedby": { ...noControls, description: "The id of a description of the group." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the list." },
  },
  // Every controllable prop gets an explicit value here. `max` has no default (no limit), so the demo starts at 4
  // to show the tile; `total` has none either, and 0 stands for it in this Playground.
  args: {
    size: "md",
    shape: "circle",
    colorful: false,
    stacked: true,
    max: 4,
    total: 0,
    overflowButton: false,
    count: 6,
    "aria-label": "Project members",
  },
  render: (args) => <DemoGroup {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => avatarGroupPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const Overflow: Story = {
  name: "Overflow: a +N tile",
  parameters: { docs: { source: { code: avatarGroupSnippets.overflow } } },
  args: { count: 5, max: 3 },
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: (args) => <DemoGroup {...args} aria-label="Project members" />,
};

export const Total: Story = {
  name: "Overflow: the real total",
  parameters: { docs: { source: { code: avatarGroupSnippets.total } } },
  args: { count: 3, max: 3, total: 24 },
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: (args) => <DemoGroup {...args} aria-label="Reviewers" />,
};

// A story with state of its own: pressing the tile reveals the rest below. The snippet says so in a comment.
const RevealTheRest = ({ count, overflowButton: _overflowButton, total: _total, onOverflowClick: _onOverflowClick, ...args }: PlaygroundArgs) => {
  const [showAll, setShowAll] = useState(false);
  const rest = people.slice(args.max ?? 0, count);
  return (
    <div style={stack}>
      <AvatarGroup {...args} aria-label="Project members" onOverflowClick={() => setShowAll((open) => !open)}>
        {people.slice(0, count).map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
      {showAll && <Text size="sm">Also on the project: {rest.join(", ")}.</Text>}
    </div>
  );
};

export const OverflowButton: Story = {
  name: "Overflow: the tile as a button",
  parameters: { docs: { source: { code: avatarGroupSnippets.overflowButton } } },
  args: { count: 6, max: 3 },
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: (args) => <RevealTheRest {...args} />,
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: avatarGroupSnippets.sizes } } },
  args: { count: 4, max: 3 },
  argTypes: { size: noControls, count: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DemoGroup key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const ResponsiveSize: Story = {
  name: "Responsive size (sm on a phone, lg from md up)",
  parameters: { docs: { source: { code: avatarGroupSnippets.responsive } } },
  args: { count: 5, max: 4, size: { base: "sm", md: "lg" } },
  argTypes: { size: noControls, count: noControls, "aria-label": noControls },
  render: (args) => <DemoGroup {...args} aria-label="Project members" />,
};

export const Square: Story = {
  name: "Square shape",
  parameters: { docs: { source: { code: avatarGroupSnippets.square } } },
  args: { shape: "square", count: 3 },
  argTypes: { shape: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, overflowButton: _overflowButton, total: _total, ...args }) => (
    <AvatarGroup {...args} aria-label="Teams">
      <Avatar name="Design" />
      <Avatar name="Platform" />
      <Avatar name="Growth" />
    </AvatarGroup>
  ),
};

export const Colorful: Story = {
  parameters: { docs: { source: { code: avatarGroupSnippets.colorful } } },
  args: { colorful: true, count: 4, max: 3 },
  argTypes: { colorful: noControls, count: noControls, "aria-label": noControls },
  render: (args) => <DemoGroup {...args} aria-label="Project members" />,
};

export const Spaced: Story = {
  name: "Spaced, not stacked",
  parameters: { docs: { source: { code: avatarGroupSnippets.spaced } } },
  args: { stacked: false, count: 5, max: 4 },
  argTypes: { stacked: noControls, count: noControls, max: noControls, "aria-label": noControls },
  render: (args) => <DemoGroup {...args} aria-label="Project members" />,
};

export const ImagesAndStatus: Story = {
  name: "Images and status",
  parameters: { docs: { source: { code: avatarGroupSnippets.images } } },
  args: {},
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: ({ count: _count, overflowButton: _overflowButton, total: _total, max: _max, ...args }) => (
    <AvatarGroup {...args} aria-label="Online now">
      <Avatar name="Jane Doe" src="https://i.pravatar.cc/128?img=5" status="online" />
      <Avatar name="John Smith" src="https://i.pravatar.cc/128?img=12" status="away" />
      <Avatar name="Alex Kim" status="busy" />
      <Avatar name="Maria Garcia" status="offline" />
    </AvatarGroup>
  ),
};

export const Interactive: Story = {
  name: "Buttons, with tooltips",
  parameters: { docs: { source: { code: avatarGroupSnippets.interactive } } },
  args: { size: "lg" },
  argTypes: { size: noControls, count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: ({ count: _count, overflowButton: _overflowButton, total: _total, max: _max, ...args }) => (
    <AvatarGroup {...args} aria-label="Project members">
      {people.slice(0, 3).map((name) => (
        <Tooltip key={name} content={name}>
          <Avatar as="button" name={name} onClick={() => {}} />
        </Tooltip>
      ))}
    </AvatarGroup>
  ),
};

export const OwnPropsWin: Story = {
  name: "An avatar's own props win",
  parameters: { docs: { source: { code: avatarGroupSnippets.own } } },
  args: { size: "lg" },
  argTypes: { size: noControls, count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: ({ count: _count, overflowButton: _overflowButton, total: _total, max: _max, ...args }) => (
    <AvatarGroup {...args} aria-label="Project members">
      <Avatar name="Jane Doe" />
      <Avatar name="John Smith" />
      <Avatar name="Design" shape="square" size="sm" />
    </AvatarGroup>
  ),
};

export const Translated: Story = {
  name: "Translated words and digits",
  parameters: { docs: { source: { code: avatarGroupSnippets.translated } } },
  args: { count: 5, max: 2 },
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls },
  render: ({ count: _count, overflowButton: _overflowButton, total: _total, ...args }) => (
    <div dir="rtl">
      <AvatarGroup
        {...args}
        aria-label="أعضاء المشروع"
        labels={{ overflow: (count) => `${count} آخرين` }}
        formatNumber={(count) => new Intl.NumberFormat("ar-EG").format(count)}
      >
        {["جين", "جون", "أليكس", "ماريا", "سام"].map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: avatarGroupSnippets.rtl } } },
  args: { count: 4, max: 3 },
  argTypes: { count: noControls, max: noControls, "aria-label": noControls },
  render: (args) => (
    <div dir="rtl">
      <DemoGroup {...args} aria-label="Project members" />
    </div>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: avatarGroupSnippets.labelled } } },
  args: { count: 2 },
  argTypes: { count: noControls, max: noControls, total: noControls, overflowButton: noControls, "aria-label": noControls, "aria-labelledby": noControls },
  render: ({ count, overflowButton: _overflowButton, total: _total, max: _max, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
      <Text id="members-label" size="sm" weight="semibold">
        Members
      </Text>
      <AvatarGroup {...args} aria-labelledby="members-label">
        {people.slice(0, count).map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------------------------------------
// The stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests. Everything
// they check is layout — where one avatar sits against the previous, what is on top, the ring's shape — which
// only a real browser computes.

const rect = (element: Element) => element.getBoundingClientRect();
const px = (value: string) => Number.parseFloat(value);
/** A token as the length the browser resolves it to, in pixels (a rem token is 16 × its number). */
const resolveLength = (token: string) => {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
};
/** A token's colour as the browser resolves it. */
const resolveColor = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
const itemsOf = (group: HTMLElement) => within(group).getAllByRole("listitem");
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
/** How far each avatar tucks under the one before it: one spacing step, at every size. */
const overlapToken = "--dbm-space-2";

export const OverlapInteraction: Story = {
  ...Playground,
  name: "Interaction: each avatar tucks under the one before it, by one spacing step at every size",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      {sizes.map((size) => (
        <div key={size} data-testid={`ltr-${size}`}>
          <AvatarGroup aria-label={size} size={size}>
            {people.slice(0, 4).map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </AvatarGroup>
        </div>
      ))}
      <div data-testid="rtl" dir="rtl">
        <AvatarGroup aria-label="rtl" size="md">
          {people.slice(0, 4).map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const items = itemsOf(canvas.getByTestId(`ltr-${size}`));
      const dimension = resolveLength(`--dbm-avatar-size-${size}`);
      const overlap = resolveLength(overlapToken);
      for (const item of items) await expect(Math.abs(rect(item).width - dimension)).toBeLessThan(0.5);
      // Each item starts one avatar's width, less the overlap, after the previous one.
      for (const [index, item] of items.entries()) {
        if (index === 0) continue;
        await expect(Math.abs(rect(item).left - rect(items[index - 1] as Element).left - (dimension - overlap))).toBeLessThan(0.5);
      }
    }

    // Right to left: the first avatar is at the right, and each later one tucks under it towards the left.
    const items = itemsOf(canvas.getByTestId("rtl"));
    const dimension = resolveLength("--dbm-avatar-size-md");
    const overlap = resolveLength(overlapToken);
    await expect(rect(items[0] as Element).left).toBeGreaterThan(rect(items[3] as Element).left);
    for (const [index, item] of items.entries()) {
      if (index === 0) continue;
      await expect(Math.abs(rect(items[index - 1] as Element).right - rect(item).right - (dimension - overlap))).toBeLessThan(0.5);
    }
  },
};

export const LayersInteraction: Story = {
  ...Playground,
  name: "Interaction: the first avatar is on top, so a status dot is never covered",
  tags: ["!dev"],
  render: () => (
    <div data-testid="group">
      <AvatarGroup aria-label="Layers" size="lg">
        <Avatar name="Jane Doe" status="online" />
        <Avatar name="John Smith" status="busy" />
        <Avatar name="Alex Kim" status="away" />
        <Avatar name="Maria Garcia" />
      </AvatarGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = itemsOf(within(canvasElement).getByTestId("group"));
    const layers = items.map((item) => Number(getComputedStyle(item).zIndex));
    await expect(layers).toEqual([4, 3, 2, 1]);

    // Where two avatars overlap, the one on top is the earlier one: hit-testing the middle of the overlap finds it.
    for (const [index, item] of items.entries()) {
      if (index === 0) continue;
      const previous = items[index - 1] as HTMLElement;
      const x = (rect(item).left + rect(previous).right) / 2;
      const y = rect(item).top + rect(item).height / 2;
      const hit = document.elementFromPoint(x, y);
      await expect(previous.contains(hit)).toBe(true);
    }

    // The presence dot sits on an avatar's bottom corner, inside the next avatar's overlap. It must be what is hit
    // at its own centre, not the next avatar drawn over it.
    for (const item of items.slice(0, 3)) {
      const dot = item.querySelector("span[aria-hidden='true']:empty") as HTMLElement;
      await expect(dot).not.toBeNull();
      const dotRect = rect(dot);
      const hit = document.elementFromPoint(dotRect.left + dotRect.width / 2, dotRect.top + dotRect.height / 2);
      await expect(item.contains(hit)).toBe(true);
    }
  },
};

export const RingInteraction: Story = {
  ...Playground,
  name: "Interaction: the ring between avatars follows their shape and is a token colour",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      <div data-testid="circle">
        <AvatarGroup aria-label="Circle">{avatars3()}</AvatarGroup>
      </div>
      <div data-testid="square">
        <AvatarGroup aria-label="Square" shape="square">
          {avatars3()}
        </AvatarGroup>
      </div>
      <div data-testid="mixed">
        <AvatarGroup aria-label="Mixed" shape="square">
          <Avatar name="Jane Doe" />
          <Avatar name="John Smith" shape="circle" />
        </AvatarGroup>
      </div>
      <div data-testid="custom">
        <AvatarGroup aria-label="Custom" style={{ "--avatar-group-ring-color": "rgb(255, 0, 0)" } as React.CSSProperties}>
          {avatars3()}
        </AvatarGroup>
      </div>
      <div data-testid="spaced">
        <AvatarGroup aria-label="Spaced" stacked={false}>
          {avatars3()}
        </AvatarGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = resolveColor("--dbm-bg-surface");
    const ring = resolveLength("--dbm-border-width-2");
    const full = resolveLength("--dbm-radius-full");
    const medium = resolveLength("--dbm-radius-md");
    const shadowOf = (item: Element) => getComputedStyle(item).boxShadow;

    // A ring of the surface colour, two pixels wide and not blurred, around every avatar.
    for (const item of itemsOf(canvas.getByTestId("circle"))) {
      await expect(shadowOf(item)).toBe(`${surface} 0px 0px 0px ${ring}px`);
      await expect(px(getComputedStyle(item).borderTopLeftRadius)).toBeGreaterThanOrEqual(Math.min(full, rect(item).width / 2));
    }
    // A square group's ring has the square avatar's own corner; a mixed group's each avatar's own.
    for (const item of itemsOf(canvas.getByTestId("square"))) await expect(px(getComputedStyle(item).borderTopLeftRadius)).toBe(medium);
    const [first, second] = itemsOf(canvas.getByTestId("mixed")) as unknown as [Element, Element];
    await expect(px(getComputedStyle(first).borderTopLeftRadius)).toBe(medium);
    await expect(px(getComputedStyle(second).borderTopLeftRadius)).toBeGreaterThanOrEqual(Math.min(full, rect(second).width / 2));
    // The colour can be set for a group on another background.
    for (const item of itemsOf(canvas.getByTestId("custom"))) await expect(shadowOf(item)).toContain("rgb(255, 0, 0)");
    // Spaced avatars have neither a ring nor an overlap.
    for (const item of itemsOf(canvas.getByTestId("spaced"))) {
      await expect(shadowOf(item)).toBe("none");
      await expect(px(getComputedStyle(item).marginLeft)).toBe(0);
    }
  },
};

function avatars3() {
  return people.slice(0, 3).map((name) => <Avatar key={name} name={name} />);
}

export const SpacedInteraction: Story = {
  ...Playground,
  name: "Interaction: a spaced group has a token gap and wraps; a stacked one never does",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      <div data-testid="roomy">
        <AvatarGroup aria-label="Roomy" stacked={false}>
          {avatars3()}
        </AvatarGroup>
      </div>
      <div data-testid="tight" style={{ width: "10rem" }}>
        <AvatarGroup aria-label="Tight" stacked={false}>
          {people.slice(0, 6).map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </div>
      <div data-testid="tight-stacked" style={{ width: "5rem" }}>
        <AvatarGroup aria-label="Tight stacked">
          {people.slice(0, 6).map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gap = resolveLength("--dbm-space-2");

    const [one, two, three] = itemsOf(canvas.getByTestId("roomy")) as unknown as [Element, Element, Element];
    await expect(Math.abs(rect(two).left - rect(one).right - gap)).toBeLessThan(0.5);
    await expect(Math.abs(rect(three).left - rect(two).right - gap)).toBeLessThan(0.5);
    await expect(Math.abs(rect(one).top - rect(three).top)).toBeLessThan(0.5);

    // Too wide for its container, a spaced row wraps onto more lines and stays inside it.
    const tight = itemsOf(canvas.getByTestId("tight"));
    await expect(new Set(tight.map((item) => Math.round(rect(item).top))).size).toBeGreaterThan(1);
    for (const item of tight) await expect(rect(item).right).toBeLessThanOrEqual(rect(canvas.getByTestId("tight")).right + 0.5);

    // A stack never wraps — a stack broken over two lines is no longer one shape. Too wide for its container it
    // overflows as one box: the list is as wide as its avatars, never narrower with them spilling out.
    const stacked = itemsOf(canvas.getByTestId("tight-stacked"));
    await expect(new Set(stacked.map((item) => Math.round(rect(item).top))).size).toBe(1);
    const list = canvas.getByTestId("tight-stacked").firstElementChild as HTMLElement;
    await expect(Math.max(...stacked.map((item) => rect(item).right))).toBeLessThanOrEqual(rect(list).right + 0.5);
    await expect(rect(list).width).toBeGreaterThan(rect(canvas.getByTestId("tight-stacked")).width);
  },
};

export const FocusInteraction: Story = {
  ...Playground,
  name: "Interaction: a focused avatar is lifted above its neighbours",
  tags: ["!dev"],
  render: () => (
    <AvatarGroup aria-label="Focus" size="lg" max={3} onOverflowClick={() => {}}>
      {people.slice(0, 5).map((name) => (
        <Avatar key={name} as="button" name={name} />
      ))}
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    const items = canvas.getAllByRole("listitem");
    await expect(buttons).toHaveLength(4);
    const own = items.map((item) => getComputedStyle(item).zIndex);
    await expect(own).toEqual(["4", "3", "2", "1"]);
    // The ring is drawn outside the avatar, over the next one, so the focused item must be above every layer.
    // Real keyboard input, since `:focus-within` follows real focus.
    for (const [index, button] of buttons.entries()) {
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await expect(getComputedStyle(items[index] as Element).zIndex).toBe("5");
      for (const [other, item] of items.entries()) {
        if (other !== index) await expect(getComputedStyle(item).zIndex).toBe(own[other]);
      }
    }
  },
};

export const TargetSizeInteraction: Story = {
  ...Playground,
  name: "Interaction: every button avatar and the +N button is at least 24 by 24px, unobscured, at every size",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      {sizes.map((size) => (
        <div key={size} data-testid={`size-${size}`}>
          <AvatarGroup aria-label={size} size={size} max={2} onOverflowClick={() => {}}>
            <Avatar as="button" name="Jane Doe" />
            <Avatar as="button" name="John Smith" />
            <Avatar as="button" name="Alex Kim" />
            <Avatar as="button" name="Maria Garcia" />
          </AvatarGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // WCAG 2.5.8: a target is at least 24 x 24 CSS pixels, and the part another element covers doesn't count. The
    // second avatar is tucked under the first, so its width is measured by hit-testing along its middle line.
    for (const size of sizes) {
      const buttons = within(canvas.getByTestId(`size-${size}`)).getAllByRole("button");
      await expect(buttons).toHaveLength(3);
      for (const button of buttons) {
        await expect(rect(button).width).toBeGreaterThanOrEqual(24);
        await expect(rect(button).height).toBeGreaterThanOrEqual(24);
        const box = rect(button);
        let unobscured = 0;
        for (let x = box.left + 0.25; x < box.right; x += 0.5) {
          if (button.contains(document.elementFromPoint(x, box.top + box.height / 2))) unobscured += 0.5;
        }
        await expect(unobscured).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const TileTextInteraction: Story = {
  ...Playground,
  name: "Interaction: the +N text fits inside the tile, at the smallest size, up to 99+",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      {([2, 42, 99, 250] as const).map((hidden) => (
        <div key={hidden} data-testid={`hidden-${hidden}`}>
          <AvatarGroup aria-label={`${hidden} hidden`} size="xs" total={hidden + 1}>
            <Avatar name="Jane Doe" />
          </AvatarGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expected = { 2: "+2", 42: "+42", 99: "+99", 250: "99+" } as const;
    for (const [hidden, text] of Object.entries(expected)) {
      const tile = within(canvas.getByTestId(`hidden-${hidden}`)).getByRole("img", { name: `${hidden} more` });
      const label = within(tile).getByText(text);
      const range = document.createRange();
      range.selectNodeContents(label);
      // The text itself, not the box around it, is measured against the avatar it sits in.
      await expect(range.getBoundingClientRect().width).toBeLessThanOrEqual(rect(tile).width - 2);
      await expect(rect(label).left).toBeGreaterThanOrEqual(rect(tile).left);
      await expect(rect(label).right).toBeLessThanOrEqual(rect(tile).right + 0.5);
    }
  },
};

const responsiveRender = () => (
  <div data-testid="group">
    <AvatarGroup aria-label="Responsive" size={{ base: "sm", md: "xl" }} max={2}>
      {people.slice(0, 3).map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  </div>
);

export const ResponsivePhoneInteraction: Story = {
  ...Playground,
  name: "Interaction: on a phone the base size applies",
  tags: ["!dev"],
  // Only a real viewport can prove a breakpoint: pinned to a phone width, the base entry of the map applies.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: responsiveRender,
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport global didn't apply, rather than passing for the wrong reason.
    await expect(window.innerWidth).toBeLessThan(640);
    const [first, second] = itemsOf(within(canvasElement).getByTestId("group")) as unknown as [Element, Element];
    const dimension = resolveLength("--dbm-avatar-size-sm");
    await expect(Math.abs(rect(first).width - dimension)).toBeLessThan(0.5);
    await expect(Math.abs(rect(second).left - rect(first).left - (dimension - resolveLength(overlapToken)))).toBeLessThan(0.5);
  },
};

export const ResponsiveDesktopInteraction: Story = {
  ...Playground,
  name: "Interaction: from md up the larger size applies",
  tags: ["!dev"],
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: responsiveRender,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const [first, second] = itemsOf(within(canvasElement).getByTestId("group")) as unknown as [Element, Element];
    const dimension = resolveLength("--dbm-avatar-size-xl");
    await expect(Math.abs(rect(first).width - dimension)).toBeLessThan(0.5);
    await expect(Math.abs(rect(second).left - rect(first).left - (dimension - resolveLength(overlapToken)))).toBeLessThan(0.5);
  },
};
