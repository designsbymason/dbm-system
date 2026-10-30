import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ChartBarIcon, GearIcon, HouseIcon, XIcon } from "@dbm-system/icons";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { Input } from "../../atoms/Input";
import { Text } from "../../atoms/Text";
import { Tabs } from "./Tabs";
import { tabsPlaygroundSnippet, tabsSnippets } from "./Tabs.snippets";
import type { TabsActivationMode, TabsAlign, TabsOrientation, TabsProps, TabsSize, TabsVariant } from "./Tabs.types";

// `Tabs.List`, `Tabs.Trigger` and `Tabs.Content` each get their own Properties
// table via a hidden docs-only stories file (guidelines/adr/0013), where their
// argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  defaultValue: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
  size: TabsSize;
  rounded: boolean;
  orientation: TabsOrientation;
  activationMode: TabsActivationMode;
  fullWidth: boolean;
  // Tabs.List's own prop, not the root's — set only on the Playground story
  // itself (not meta), so it stays out of the root Properties table (its
  // real documentation lives in Tabs.List's own, per ADR-0013) while still
  // being a live control in the one demo that already renders a real
  // Tabs.List underneath.
  align: TabsAlign;
  // Also Tabs.List's own prop, not the root's — same reasoning and scoping as `align` above.
  showScrollButtons: boolean;
  dir: "ltr" | "rtl";
  value: string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const demoContainerStyle = { maxWidth: "40rem", marginInline: "auto" } as const;

type DemoTabsProps = Omit<TabsProps, "children"> & {
  listLabel?: string;
  align?: TabsAlign;
  showScrollButtons?: boolean;
};

/** A small, real set of tabs the gallery stories vary. */
const DemoTabs = ({ listLabel = "Project", align, showScrollButtons, ...props }: DemoTabsProps) => (
  <Tabs {...(props.value === undefined ? { defaultValue: "overview" } : {})} {...props}>
    <Tabs.List aria-label={listLabel} align={align} showScrollButtons={showScrollButtons}>
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
      <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="overview">
      <Text size="sm">A summary of the project.</Text>
    </Tabs.Content>
    <Tabs.Content value="activity">
      <Text size="sm">Recent changes to the project.</Text>
    </Tabs.Content>
    <Tabs.Content value="settings">
      <Text size="sm">Who can see and change the project.</Text>
    </Tabs.Content>
  </Tabs>
);

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const noControls = {
  defaultValue: { control: false },
  variant: { control: false },
  size: { control: false },
  rounded: { control: false },
  orientation: { control: false },
  activationMode: { control: false },
  fullWidth: { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Navigation/Tabs",
  parameters: { layout: "padded" },
  argTypes: {
    defaultValue: {
      control: "select",
      options: ["overview", "activity", "settings"],
      description:
        "The selected tab's value when uncontrolled. Pass one — with neither this nor value, no tab is selected and no panel shows.",
    },
    value: {
      control: false,
      description: "The controlled selected tab's value. Pair it with onValueChange.",
    },
    onValueChange: {
      control: false,
      description: "Called with the newly selected tab's value whenever the selection changes.",
    },
    variant: {
      control: "select",
      options: ["underline", "subtle", "outlined", "solid"],
      description:
        "How the selected tab is marked: an underline bar, a soft brand tint, a tint with a border on every tab, or a solid brand fill.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Trigger height, padding and type size, and the panel's own spacing.",
      table: { defaultValue: { summary: '"md"' } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounds the ends of every tab, in the subtle, outlined and solid variants. It has no effect on underline, whose tabs have no shape to round.",
      table: { defaultValue: { summary: "false" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "The direction the tabs run, and which arrow-key pair moves between them. Also accepts a breakpoint map, which this control can't express — see the responsive story.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    activationMode: {
      control: "select",
      options: ["automatic", "manual"],
      description:
        "Whether focusing a tab selects it (automatic), or only Enter or Space does (manual).",
      table: { defaultValue: { summary: '"automatic"' } },
    },
    fullWidth: {
      control: "boolean",
      description: "Stretches the triggers to fill the width of a horizontal list.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction, passed through to Radix Tabs — flips which physical arrow key moves focus forward versus back in a horizontal list.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at these tabs.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
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
    defaultValue: "overview",
    variant: "underline",
    size: "md",
    rounded: false,
    orientation: "horizontal",
    activationMode: "automatic",
    fullWidth: false,
    dir: "ltr",
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      {/* Keyed by the starting tab, so choosing another in the controls starts the
          (uncontrolled) tabs over there instead of being ignored. */}
      <DemoTabs
        key={args.defaultValue}
        defaultValue={args.defaultValue}
        variant={args.variant}
        size={args.size}
        rounded={args.rounded}
        orientation={args.orientation}
        activationMode={args.activationMode}
        fullWidth={args.fullWidth}
        align={args.align}
        showScrollButtons={args.showScrollButtons}
        dir={args.dir}
      />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // Tabs.List's own align, not the root's (see PlaygroundArgs above) — scoped to
  // this story alone so it never leaks into the fixed-render gallery stories below,
  // which don't consume it and would otherwise pick up an unintended live control.
  argTypes: {
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Tabs.List's own align: where the tabs sit within the list when they don't fill it — the leading edge, the middle, or the trailing edge.",
    },
    showScrollButtons: {
      control: "boolean",
      description:
        "Tabs.List's own showScrollButtons: whether the scroll buttons appear at whichever edge currently has more tabs beyond it, while the list is scrollable. The edge fade is unaffected either way.",
    },
  },
  args: {
    align: "start",
    showScrollButtons: true,
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tabsPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.variants } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)" }}>
      {(["underline", "subtle", "outlined", "solid"] as const).map((variant) => (
        <div key={variant}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            variant=&quot;{variant}&quot;
          </Text>
          <DemoTabs variant={variant} listLabel={`Project (${variant})`} />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            size=&quot;{size}&quot;
          </Text>
          <DemoTabs size={size} listLabel={`Project (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Rounded: Story = {
  name: "Rounded",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.rounded } } },
  render: () => (
    <div
      data-testid="rounded"
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
    >
      {(["underline", "subtle", "outlined", "solid"] as const).map((variant) => (
        <div key={variant}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            variant=&quot;{variant}&quot; rounded
          </Text>
          <DemoTabs variant={variant} rounded listLabel={`Project (${variant}, rounded)`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes.
    const lists = within(canvasElement).getAllByRole("tablist");
    const radiusOf = (tab: HTMLElement) => parseFloat(getComputedStyle(tab).borderTopLeftRadius);
    for (const [index, list] of lists.entries()) {
      for (const tab of within(list).getAllByRole("tab")) {
        const half = tab.getBoundingClientRect().height / 2;
        if (index === 0) {
          // `rounded` does nothing to the underline variant.
          await expect(radiusOf(tab)).toBe(0);
        } else {
          // Every other variant's ends are fully round: the radius reaches at least half the height.
          await expect(radiusOf(tab)).toBeGreaterThanOrEqual(half);
        }
      }
    }
  },
};

export const Align: Story = {
  name: "Align",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.align } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["start", "center", "end"] as const).map((align) => (
        <div key={align}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            align=&quot;{align}&quot;
          </Text>
          <Tabs defaultValue="overview">
            <Tabs.List aria-label={`Project (${align})`} align={align}>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview">
              <Text size="sm">A summary of the project.</Text>
            </Tabs.Content>
          </Tabs>
        </div>
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  name: "Vertical orientation",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.vertical } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs orientation="vertical" />
    </div>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "Vertical on a wide screen, horizontal on a phone",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.responsiveOrientation } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs orientation={{ base: "horizontal", md: "vertical" }} variant="subtle" />
    </div>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.icons } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="overview" icon={HouseIcon}>
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="activity" icon={ChartBarIcon}>
            Activity
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" icon={GearIcon} aria-label="Settings" />
        </Tabs.List>
        <Tabs.Content value="overview">
          <Text size="sm">A summary of the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <Text size="sm">Recent changes to the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Text size="sm">Who can see and change the project.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const WithBadge: Story = {
  name: "With a count",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.badge } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="inbox">
        <Tabs.List aria-label="Mail">
          <Tabs.Trigger value="inbox">
            Inbox <Badge size="sm">12</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="sent">Sent</Tabs.Trigger>
          <Tabs.Trigger value="drafts">
            Drafts{" "}
            <Badge size="sm" tone="neutral">
              3
            </Badge>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="inbox">
          <Text size="sm">Twelve messages are waiting.</Text>
        </Tabs.Content>
        <Tabs.Content value="sent">
          <Text size="sm">Everything you have sent.</Text>
        </Tabs.Content>
        <Tabs.Content value="drafts">
          <Text size="sm">Three unfinished messages.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const DisabledTab: Story = {
  name: "One tab disabled",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.disabledTab } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          <Tabs.Trigger value="settings" disabled>
            Settings
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Text size="sm">A summary of the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <Text size="sm">Recent changes to the project.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const FullWidth: Story = {
  name: "Full width",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.fullWidth } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs fullWidth />
    </div>
  ),
};

export const ManualActivation: Story = {
  name: "Manual activation",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.manualActivation } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs activationMode="manual" />
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled selection",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.controlled } } },
  render: function ControlledStory() {
    const [value, setValue] = useState("overview");
    return (
      <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
        <Text size="sm">Selected tab: {value}</Text>
        <DemoTabs value={value} onValueChange={setValue} />
      </div>
    );
  },
};

const workspaceTabs = ["Overview", "Activity", "Members", "Billing", "Integrations", "Reports", "Audit log", "Security"];

export const Scrolling: Story = {
  name: "Too many tabs for the width",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.scrolling } } },
  render: () => (
    <div style={demoContainerStyle}>
      {/* A box narrower than the list — drag its corner to change how much shows. The selected tab
          is the last one, and the list has already scrolled to show it. */}
      <div data-testid="scroll-box" style={{ inlineSize: "22rem", maxInlineSize: "100%", overflow: "hidden", resize: "horizontal" }}>
        <Tabs defaultValue="security">
          <Tabs.List aria-label="Workspace">
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="security">
            <Text size="sm">Two-factor and session settings.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes.
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const selected = canvas.getByRole("tab", { name: "Security" });
    await waitFor(() => {
      const listRect = list.getBoundingClientRect();
      const tabRect = selected.getBoundingClientRect();
      expect(tabRect.left).toBeGreaterThanOrEqual(listRect.left - 1);
      expect(tabRect.right).toBeLessThanOrEqual(listRect.right + 1);
    });
    // Scrolled to the last tab: more lies before it, nothing lies after.
    await waitFor(() => expect(canvas.getByRole("button", { name: "Scroll tabs to the start" })).toBeVisible());
    await expect(canvas.queryByRole("button", { name: "Scroll tabs to the end" })).toBeNull();
  },
};

export const VerticalScrolling: Story = {
  name: "Too many tabs for the height",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.verticalScrolling } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="security" orientation="vertical">
        {/* Nothing bounds a vertical list's height on its own the way the page's own width bounds a
            horizontal one — Tabs.List needs a height of its own to respond to. A percentage alone
            doesn't do it (nothing above stretches to give it something definite to resolve against),
            so this box is a flex container: that stretches Tabs.List to its own height, which the drag
            handle then changes. The selected tab is the last one, and the list has already scrolled
            to show it. */}
        <div
          data-testid="vertical-scroll-box"
          style={{ display: "flex", blockSize: "10rem", maxBlockSize: "40vh", overflow: "hidden", resize: "vertical" }}
        >
          <Tabs.List aria-label="Workspace" style={{ blockSize: "100%" }}>
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        <Tabs.Content value="security">
          <Text size="sm">Two-factor and session settings.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes.
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    const selected = canvas.getByRole("tab", { name: "Security" });
    await waitFor(() => {
      const listRect = list.getBoundingClientRect();
      const tabRect = selected.getBoundingClientRect();
      expect(tabRect.top).toBeGreaterThanOrEqual(listRect.top - 1);
      expect(tabRect.bottom).toBeLessThanOrEqual(listRect.bottom + 1);
    });
    // Scrolled to the last tab: more lies before it, nothing lies after.
    await waitFor(() => expect(canvas.getByRole("button", { name: "Scroll tabs to the start" })).toBeVisible());
    await expect(canvas.queryByRole("button", { name: "Scroll tabs to the end" })).toBeNull();
  },
};

export const KeepMounted: Story = {
  name: "Keeping a panel mounted",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.keepMounted } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="details">
        <Tabs.List aria-label="Profile">
          <Tabs.Trigger value="details">Details</Tabs.Trigger>
          <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="details" forceMount>
          <Input aria-label="Display name" defaultValue="Ada" />
        </Tabs.Content>
        <Tabs.Content value="notes">
          <Text size="sm">Notes are not kept mounted.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const WithAction: Story = {
  name: "A tab with a control beside it",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.withAction } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project">
          <Tabs.Item
            action={
              <IconButton icon={XIcon} aria-label="Close Overview" size="xs" variant="ghost" tone="neutral" tabIndex={-1} />
            }
          >
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Text size="sm">A summary of the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <Text size="sm">Recent changes.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const AsLink: Story = {
  name: "Tabs as links (asChild)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.asChildLink } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="overview" asChild>
            <a href="#overview">Overview</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="activity" asChild>
            <a href="#activity">Activity</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Text size="sm">A summary of the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <Text size="sm">Recent changes to the project.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: tabsSnippets.rightToLeft } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs dir="rtl" />
    </div>
  ),
};

export const OnAPhone: Story = {
  name: "On a phone",
  argTypes: noControls,
  // Opened on its own, this story is shown at a phone's width (and it is in the
  // test run); on the Docs page it sits in the wide page like every other story.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { source: { code: tabsSnippets.onAPhone } } },
  render: () => (
    <div data-testid="phone" style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DemoTabs orientation={{ base: "horizontal", md: "vertical" }} variant="subtle" listLabel="Project" />
      <Tabs defaultValue="security">
        <Tabs.List aria-label="Workspace">
          {workspaceTabs.map((label) => (
            <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="security">
          <Text size="sm">Two-factor and session settings.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const canvas = within(canvasElement);
    const [responsive, workspace] = canvas.getAllByRole("tablist");
    // Below md the breakpoint map resolves to its base: a horizontal strip, not a column.
    await expect(responsive).toHaveAttribute("aria-orientation", "horizontal");
    await expect(getComputedStyle(responsive!).flexDirection).toBe("row");
    // The long list scrolls inside itself; the page does not scroll sideways.
    await expect(workspace!.scrollWidth).toBeGreaterThan(workspace!.clientWidth);
    await expect(getComputedStyle(workspace!).overflowX).toBe("auto");
    // No scrollbar: an overlay one is drawn over the selected tab's underline.
    await expect(getComputedStyle(workspace!).scrollbarWidth).toBe("none");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    // The selected (last) tab has been scrolled into view.
    const selected = canvas.getByRole("tab", { name: "Security" });
    await waitFor(() => {
      const listRect = workspace!.getBoundingClientRect();
      const tabRect = selected.getBoundingClientRect();
      expect(tabRect.right).toBeLessThanOrEqual(listRect.right + 1);
    });
  },
};

// --- Hidden interaction tests -------------------------------------------------
// Each one carries assertions that change state or need real layout, so they live
// in twins that are hidden from the sidebar and the Docs page (`!dev`) but still
// run as tests — a visible story must not end somewhere different from where it
// started (07-storybook-and-documentation-standards.md §5).

export const KeyboardInteraction: Story = {
  ...DisabledTab,
  name: "Keyboard — arrows, Home, End, wrap, disabled skipped",
  tags: ["!dev"],
  render: () => (
    <div style={demoContainerStyle}>
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          <Tabs.Trigger value="billing" disabled>
            Billing
          </Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Text size="sm">A summary of the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <Text size="sm">Recent changes to the project.</Text>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Text size="sm">Who can see and change the project.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const activity = canvas.getByRole("tab", { name: "Activity" });
    const settings = canvas.getByRole("tab", { name: "Settings" });

    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(activity).toHaveFocus();
    await expect(activity).toHaveAttribute("aria-selected", "true");
    // The panel fades in, so wait for it rather than reading it mid-transition.
    await waitFor(() => expect(canvas.getByText("Recent changes to the project.")).toBeVisible());
    // The disabled tab in between is skipped.
    await userEvent.keyboard("{ArrowRight}");
    await expect(settings).toHaveFocus();
    // Past the last tab wraps to the first.
    await userEvent.keyboard("{ArrowRight}");
    await expect(overview).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(settings).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(overview).toHaveFocus();
    // The panel is the next stop after the list.
    await userEvent.tab();
    await expect(canvas.getByRole("tabpanel")).toHaveFocus();
  },
};

export const ManualActivationInteraction: Story = {
  ...ManualActivation,
  name: "Manual activation — focus moves, Enter selects",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(activity).toHaveFocus();
    // Focus moved, the selection did not.
    await expect(activity).toHaveAttribute("aria-selected", "false");
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(canvas.getByText("Recent changes to the project.")).toBeVisible());
  },
};

export const RightToLeftInteraction: Story = {
  ...RightToLeft,
  name: "Right-to-left — order and arrow keys",
  tags: ["!dev"],
  render: () => (
    <div style={demoContainerStyle}>
      <div data-testid="ltr">
        <DemoTabs listLabel="Project (ltr)" />
      </div>
      <div data-testid="rtl">
        <DemoTabs dir="rtl" listLabel="Project (rtl)" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const ltr = within(within(canvasElement).getByTestId("ltr"));
    const rtl = within(within(canvasElement).getByTestId("rtl"));
    // The first tab starts at the leading edge: left in LTR, right in RTL.
    await expect(ltr.getByRole("tab", { name: "Overview" }).getBoundingClientRect().left).toBeLessThan(
      ltr.getByRole("tab", { name: "Activity" }).getBoundingClientRect().left,
    );
    await expect(rtl.getByRole("tab", { name: "Overview" }).getBoundingClientRect().left).toBeGreaterThan(
      rtl.getByRole("tab", { name: "Activity" }).getBoundingClientRect().left,
    );
    // In RTL, Left is forward.
    rtl.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(rtl.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(rtl.getByRole("tab", { name: "Overview" })).toHaveFocus();
  },
};

export const ScrollingInteraction: Story = {
  ...Scrolling,
  name: "Scrolling — the selected tab is kept in view",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    const isInView = (tab: HTMLElement) => {
      const listRect = list.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      return tabRect.left >= listRect.left - 1 && tabRect.right <= listRect.right + 1;
    };
    // Go back to the first tab: the list scrolls back to it.
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    const overview = canvas.getByRole("tab", { name: "Overview" });
    await waitFor(() => expect(isInView(overview)).toBe(true));
    // Keyboard End lands on the last tab, and the list follows.
    overview.focus();
    await userEvent.keyboard("{End}");
    const last = canvas.getByRole("tab", { name: "Security" });
    await expect(last).toHaveFocus();
    await waitFor(() => expect(isInView(last)).toBe(true));
    // Nothing made the page itself scroll sideways.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

export const VerticalScrollingInteraction: Story = {
  ...VerticalScrolling,
  name: "Vertical scrolling — buttons, click-to-scroll, and the selected tab kept in view",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    const isInView = (tab: HTMLElement) => {
      const listRect = list.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      return tabRect.top >= listRect.top - 1 && tabRect.bottom <= listRect.bottom + 1;
    };

    // Starts on the last tab: a "start" button, no "end" button (the story's own `play` on
    // `VerticalScrolling` already confirms this render's own geometry).
    const startButton = await waitFor(() => canvas.getByRole("button", { name: "Scroll tabs to the start" }));
    const startingScroll = list.scrollTop;
    await userEvent.click(startButton);
    // Clicking "start" scrolls up (toward the top) — `scrollTop` decreases.
    await waitFor(() => expect(list.scrollTop).toBeLessThan(startingScroll));
    // Having scrolled away from the end, an "end" button now joins it.
    await waitFor(() => expect(canvas.getByRole("button", { name: "Scroll tabs to the end" })).toBeVisible());

    // Go back to the first tab: the list scrolls back up to it.
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    const overview = canvas.getByRole("tab", { name: "Overview" });
    await waitFor(() => expect(isInView(overview)).toBe(true));
    // Keyboard End lands on the last tab, and the list follows back down.
    overview.focus();
    await userEvent.keyboard("{End}");
    const last = canvas.getByRole("tab", { name: "Security" });
    await expect(last).toHaveFocus();
    await waitFor(() => expect(isInView(last)).toBe(true));
  },
};

export const KeepMountedInteraction: Story = {
  ...KeepMounted,
  name: "Keep mounted — hidden while unselected, state survives",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Display name" });
    await userEvent.clear(field);
    await userEvent.type(field, "Grace");
    await userEvent.click(canvas.getByRole("tab", { name: "Notes" }));
    // Still in the page, but neither shown nor in the accessibility tree.
    const hiddenField = canvasElement.querySelector<HTMLInputElement>("input");
    await expect(hiddenField).not.toBeNull();
    await expect(getComputedStyle(hiddenField!.closest("[role=tabpanel]")!).display).toBe("none");
    await expect(canvas.queryByRole("textbox", { name: "Display name" })).toBeNull();
    await userEvent.click(canvas.getByRole("tab", { name: "Details" }));
    await expect(canvas.getByRole("textbox", { name: "Display name" })).toHaveValue("Grace");
  },
};

export const FocusRingInteraction: Story = {
  ...Variants,
  name: "Focus ring — inside the trigger, bg.brand-hover on solid and outlined",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lists = canvas.getAllByRole("tablist");
    // A probe resolves a token to the colour the browser computes for it.
    const probe = document.createElement("span");
    canvasElement.appendChild(probe);
    const colourOf = (token: string) => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };

    const focusSelected = async (list: HTMLElement) => {
      const selected = within(list).getByRole("tab", { selected: true });
      await userEvent.tab();
      // Tab from the previous list's tab stop lands on the next list's selected tab
      // (through its panel), so walk there with the keyboard rather than `.focus()`
      // — `:focus-visible` only matches focus that arrived by keyboard.
      let guard = 0;
      while (document.activeElement !== selected && guard++ < 6) await userEvent.tab();
      return selected;
    };

    for (const [index, list] of lists.entries()) {
      const selected = await focusSelected(list);
      const style = getComputedStyle(selected);
      await expect(style.outlineStyle).toBe("solid");
      await expect(parseFloat(style.outlineWidth)).toBe(2);
      // Drawn inside the trigger — a scrolling list would clip a ring outside it.
      await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
      // `underline` and `subtle` use the standard ring; `outlined` and `solid` (its selected tab)
      // draw it in `bg.brand-hover`. The lists run underline, subtle, outlined, solid.
      const expected = index >= 2 ? colourOf("--dbm-bg-brand-hover") : colourOf("--dbm-border-focus");
      await expect(style.outlineColor).toBe(expected);
    }
    probe.remove();
  },
};

export const HoverInteraction: Story = {
  ...Variants,
  name: "Hover — the fills are bg.brand-subtle, read from the styles",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    // A story can't make the browser report `:hover` (its pointer events are synthetic), so this
    // reads the hover rule each variant's stylesheet actually carries and checks what fill it sets.
    const rules = [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules];
        } catch {
          return [];
        }
      })
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
    const hoverFill = (tab: HTMLElement, selected: boolean) => {
      const variantClass = [...tab.classList].find((name) => /_(underline|subtle|outlined|solid)_/.test(name));
      const rule = rules.find(
        (candidate) =>
          candidate.selectorText.includes(`.${variantClass}`) &&
          candidate.selectorText.endsWith(":hover") &&
          candidate.selectorText.includes('[data-state="active"]') === selected,
      );
      return rule?.style.backgroundColor;
    };

    const lists = within(canvasElement).getAllByRole("tablist");
    const [underline, subtle, outlined, solid] = lists.map((list) => ({
      unselected: within(list).getByRole("tab", { name: "Activity" }),
      selected: within(list).getByRole("tab", { selected: true }),
    }));
    // An unselected tab fills with bg.brand-subtle on hover, in every variant.
    for (const { unselected } of [underline!, subtle!, outlined!, solid!]) {
      await expect(hoverFill(unselected, false)).toBe("var(--dbm-bg-brand-subtle)");
    }
    // A selected tab in the tinted variants steps to the next tint; a solid one to its hover fill.
    await expect(hoverFill(subtle!.selected, true)).toBe("var(--dbm-bg-brand-subtle-hover)");
    await expect(hoverFill(outlined!.selected, true)).toBe("var(--dbm-bg-brand-subtle-hover)");
    await expect(hoverFill(solid!.selected, true)).toBe("var(--dbm-bg-brand-hover)");
    // ...and the neutral fill is gone.
    await expect(rules.some((rule) => rule.style.backgroundColor === "var(--dbm-bg-neutral-subtle)" && rule.selectorText.includes(":hover") && /_(underline|subtle|outlined|solid)_/.test(rule.selectorText))).toBe(false);
  },
};

export const OutlinedInteraction: Story = {
  ...ManualActivation,
  name: "Outlined — borders, and the ring on a selected and an unselected tab",
  tags: ["!dev"],
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTabs variant="outlined" activationMode="manual" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const probe = document.createElement("span");
    canvasElement.appendChild(probe);
    const colour = (token: string) => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };
    const selected = canvas.getByRole("tab", { name: "Overview" });
    const unselected = canvas.getByRole("tab", { name: "Activity" });

    // Every tab has the border, so nothing moves when the selection does: the selected one in the
    // brand colour, the others in the faint tint.
    await expect(getComputedStyle(selected).borderTopColor).toBe(colour("--dbm-border-brand"));
    await expect(getComputedStyle(unselected).borderTopColor).toBe(colour("--dbm-border-brand-subtle"));
    await expect(getComputedStyle(unselected).borderTopWidth).toBe(getComputedStyle(selected).borderTopWidth);
    await expect(unselected.getBoundingClientRect().height).toBe(selected.getBoundingClientRect().height);

    // The ring is bg.brand-hover on both, drawn inside the border with a gap (a real keyboard focus).
    const border = parseFloat(getComputedStyle(selected).borderTopWidth);
    for (const tab of [selected, unselected]) {
      if (tab === selected) await userEvent.tab();
      else await userEvent.keyboard("{ArrowRight}");
      await expect(tab).toHaveFocus();
      const style = getComputedStyle(tab);
      await expect(style.outlineColor).toBe(colour("--dbm-bg-brand-hover"));
      await expect(parseFloat(style.outlineWidth)).toBe(2);
      // Inside the tab, past the border and one border width beyond it: -(2 + 2 * border).
      await expect(parseFloat(style.outlineOffset)).toBe(-(2 + 2 * border));
    }
  },
};

export const RoundedInteraction: Story = {
  ...Rounded,
  name: "Rounded — the focus ring is round too, and only where the tab is",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const lists = within(canvasElement).getAllByRole("tablist");
    for (const [index, list] of lists.entries()) {
      const selected = within(list).getByRole("tab", { selected: true });
      let guard = 0;
      await userEvent.tab();
      while (document.activeElement !== selected && guard++ < 8) await userEvent.tab();
      await expect(selected).toHaveFocus();
      const radius = parseFloat(getComputedStyle(selected).borderTopLeftRadius);
      const half = selected.getBoundingClientRect().height / 2;
      // A fully round tab has a fully round ring (`radius-full`); the underline tab keeps the small one.
      if (index === 0) await expect(radius).toBeLessThan(half);
      else await expect(radius).toBeGreaterThanOrEqual(half);
    }
  },
};

export const PanelFocusRingInteraction: Story = {
  ...Variants,
  name: "Panel focus ring — clear of the tab list, at every size and orientation",
  tags: ["!dev"],
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-10)" }}>
      <DemoTabs size="xs" variant="subtle" listLabel="Horizontal, xs" data-testid="horizontal-xs" />
      <DemoTabs size="xl" variant="solid" listLabel="Horizontal, xl" data-testid="horizontal-xl" />
      <DemoTabs size="xs" variant="underline" orientation="vertical" listLabel="Vertical, xs" data-testid="vertical-xs" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The panel takes keyboard focus and draws the standard ring OUTSIDE its box. The list sits right
    // above (or beside) it, and its tabs paint on top of anything that reaches into them, so the
    // space between the two has to be at least as wide as the ring — or the ring is cut off by the tabs.
    for (const [id, vertical] of [
      ["horizontal-xs", false],
      ["horizontal-xl", false],
      ["vertical-xs", true],
    ] as const) {
      const root = canvas.getByTestId(id);
      const panel = within(root).getByRole("tabpanel");
      let guard = 0;
      await userEvent.tab();
      while (document.activeElement !== panel && guard++ < 12) await userEvent.tab();
      await expect(panel).toHaveFocus();
      const style = getComputedStyle(panel);
      await expect(style.outlineStyle).toBe("solid");
      const ring = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
      const list = within(root).getByRole("tablist").getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const gap = vertical ? box.left - list.right : box.top - list.bottom;
      await expect(gap).toBeGreaterThanOrEqual(ring);
    }
  },
};

export const OverflowInteraction: Story = {
  ...FullWidth,
  name: "Overflow — buttons appear at the right edge, click to scroll, mirror in right-to-left",
  tags: ["!dev"],
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="short" style={{ inlineSize: "22rem" }}>
        <DemoTabs listLabel="Project (short)" />
      </div>
      <div data-testid="long-ltr" style={{ inlineSize: "22rem" }}>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="Workspace (ltr)">
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="overview">
            <Text size="sm">A summary of the project.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
      <div data-testid="long-rtl" style={{ inlineSize: "22rem" }}>
        <Tabs defaultValue="overview" dir="rtl">
          <Tabs.List aria-label="Workspace (rtl)">
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="overview">
            <Text size="sm">A summary of the project.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A list that fits gets no scroll buttons at all.
    const short = within(canvas.getByTestId("short"));
    await expect(short.queryByRole("button", { name: /Scroll tabs/ })).toBeNull();

    // A list that overflows, starting on its first tab: a button at the end, none at the start.
    const ltr = within(canvas.getByTestId("long-ltr"));
    await waitFor(() => expect(ltr.getByRole("button", { name: "Scroll tabs to the end" })).toBeVisible());
    await expect(ltr.queryByRole("button", { name: "Scroll tabs to the start" })).toBeNull();
    const ltrList = ltr.getByRole("tablist");
    const startingScroll = ltrList.scrollLeft;

    // Clicking it scrolls toward the end — and, having scrolled at all, the first tab is now
    // off-screen too, so a "start" button joins it (the exact release behaviour, not just presence,
    // is its own test — `OverflowFocusHoldInteraction`).
    await userEvent.click(ltr.getByRole("button", { name: "Scroll tabs to the end" }));
    await waitFor(() => expect(ltrList.scrollLeft).toBeGreaterThan(startingScroll));
    await waitFor(() => expect(ltr.getByRole("button", { name: "Scroll tabs to the start" })).toBeVisible());

    // Clicking "start" scrolls back the other way.
    const scrolledAway = ltrList.scrollLeft;
    await userEvent.click(ltr.getByRole("button", { name: "Scroll tabs to the start" }));
    await waitFor(() => expect(ltrList.scrollLeft).toBeLessThan(scrolledAway));

    // Right-to-left: the same "scroll to the start" button now sits at the physical right of its own
    // list, not the left — position mirrors even though the accessible name doesn't need to.
    const rtl = within(canvas.getByTestId("long-rtl"));
    await waitFor(() => expect(rtl.getByRole("button", { name: "Scroll tabs to the end" })).toBeVisible());
    const rtlList = rtl.getByRole("tablist");
    const rtlEndButton = rtl.getByRole("button", { name: "Scroll tabs to the end" });
    const listRect = rtlList.getBoundingClientRect();
    const buttonRect = rtlEndButton.getBoundingClientRect();
    // "End" is the trailing edge — physically the LEFT edge under right-to-left text.
    await expect(buttonRect.left).toBeLessThanOrEqual(listRect.left + listRect.width / 2);
    // Its icon is mirrored under right-to-left (the same `:dir(rtl)` technique Pagination's own arrows use).
    const icon = rtlEndButton.querySelector("svg");
    await expect(icon).not.toBeNull();
    await expect(getComputedStyle(icon!).transform).not.toBe("none");
    // The fade's own gradient also flips: it must still point FROM the pinned edge INTO the content,
    // which is the opposite physical direction once the edge itself has mirrored.
    const rtlWrapper = rtlList.parentElement!;
    const endFade = getComputedStyle(rtlWrapper, "::after");
    await expect(endFade.backgroundImage).toContain("to right");
  },
};

/** Resolves once `element` has stopped scrolling: its `scrollLeft` unchanged for three checks in a row. */
const scrollSettled = async (element: HTMLElement) => {
  let last = Number.NaN;
  let steady = 0;
  for (let check = 0; check < 100 && steady < 3; check += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    steady = element.scrollLeft === last ? steady + 1 : 0;
    last = element.scrollLeft;
  }
};

export const OverflowFocusHoldInteraction: Story = {
  ...FullWidth,
  name: "Overflow — a scroll button holds focus instead of vanishing under it",
  tags: ["!dev"],
  render: () => (
    <div style={{ inlineSize: "22rem" }}>
      <Tabs defaultValue="security">
        <Tabs.List aria-label="Workspace">
          {workspaceTabs.map((label) => (
            <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="security">
          <Text size="sm">Two-factor and session settings.</Text>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Starts on the last tab: a "start" button, no "end" button.
    const startButton = await waitFor(() => canvas.getByRole("button", { name: "Scroll tabs to the start" }));
    startButton.focus();
    await expect(startButton).toHaveFocus();

    // Click it until there is nothing left to scroll to. Each click starts a smooth scroll, so the list is let
    // come to rest before the next one; a fixed pause between clicks ran out on a slow machine.
    const list = canvas.getByRole("tablist");
    let guard = 0;
    while (startButton.getAttribute("aria-disabled") !== "true" && guard++ < 20) {
      await userEvent.click(startButton);
      await scrollSettled(list);
    }
    await waitFor(() => expect(startButton).toHaveAttribute("aria-disabled", "true"));
    // Still in the page, still focused, now inert — not silently dropped from under the keyboard.
    await expect(canvas.getByRole("button", { name: "Scroll tabs to the start" })).toBe(startButton);
    await expect(startButton).toHaveFocus();
    await expect(startButton).toHaveAttribute("aria-disabled", "true");

    // Moving focus away releases it: it leaves the page once nothing needs it kept there. Away from
    // the tablist entirely (its own panel), not into it — a Tab into a scrollable list can itself move
    // `scrollLeft` (the browser's own native scroll-into-view for a newly focused element), which would
    // confound this specific assertion about the button's own release.
    await userEvent.click(canvas.getByRole("tabpanel"));
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Scroll tabs to the start" })).toBeNull());
  },
};

export const ShowScrollButtonsFalseInteraction: Story = {
  ...FullWidth,
  name: "showScrollButtons — hides the buttons, keeps the fade, keyboard and touch scrolling still work",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="horizontal" style={{ inlineSize: "22rem" }}>
        <Tabs defaultValue="security">
          <Tabs.List aria-label="Workspace" showScrollButtons={false}>
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="security">
            <Text size="sm">Two-factor and session settings.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
      <div data-testid="vertical">
        <Tabs defaultValue="security" orientation="vertical">
          <div style={{ display: "flex", blockSize: "10rem", overflow: "hidden" }}>
            <Tabs.List aria-label="Workspace" showScrollButtons={false} style={{ blockSize: "100%" }}>
              {workspaceTabs.map((label) => (
                <Tabs.Trigger key={label} value={label === "Security" ? "security" : label.toLowerCase()}>
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
          <Tabs.Content value="security">
            <Text size="sm">Two-factor and session settings.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const testId of ["horizontal", "vertical"] as const) {
      const scoped = within(canvas.getByTestId(testId));
      const list = scoped.getByRole("tablist");

      // Genuinely overflowing (the same real-layout check every other overflow story makes) —
      // otherwise "no buttons" would be true for the trivial reason nothing needs one.
      await waitFor(() => {
        if (testId === "horizontal") expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
        else expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      });

      // No buttons, in either direction, no matter how the list is scrolled.
      expect(scoped.queryByRole("button", { name: /Scroll tabs/ })).toBeNull();
      list.scrollBy(testId === "horizontal" ? { left: 9999 } : { top: 9999 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(scoped.queryByRole("button", { name: /Scroll tabs/ })).toBeNull();

      // The fade is untouched: `data-overflow-start`/`data-overflow-end` still flip with the real
      // scroll position, exactly as they do when the buttons are shown.
      const wrapper = list.parentElement!;
      await waitFor(() => expect(wrapper).toHaveAttribute("data-overflow-start", "true"));
      list.scrollBy(testId === "horizontal" ? { left: -9999 } : { top: -9999 });
      await waitFor(() => expect(wrapper).toHaveAttribute("data-overflow-start", "false"));

      // Keyboard scrolling still works with no button in the page to click: End moves the roving
      // tab focus to the last tab, and the (still real, still overflow-y/x: auto) list follows it
      // into view without ever needing a button.
      const first = scoped.getByRole("tab", { name: "Overview" });
      first.focus();
      await userEvent.keyboard("{End}");
      const last = scoped.getByRole("tab", { name: "Security" });
      await expect(last).toHaveFocus();
      await waitFor(() => {
        const listRect = list.getBoundingClientRect();
        const tabRect = last.getBoundingClientRect();
        if (testId === "horizontal") expect(tabRect.right).toBeLessThanOrEqual(listRect.right + 1);
        else expect(tabRect.bottom).toBeLessThanOrEqual(listRect.bottom + 1);
      });
    }
  },
};

export const AlignInteraction: Story = {
  ...Align,
  name: "Align — centered and end-aligned when they fit, safe when they don't",
  tags: ["!dev"],
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="center" style={{ inlineSize: "26rem" }}>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="Center" align="center">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">A</Tabs.Content>
        </Tabs>
      </div>
      <div data-testid="end" style={{ inlineSize: "26rem" }}>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="End" align="end">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">A</Tabs.Content>
        </Tabs>
      </div>
      {/* Deliberately narrower than the tabs themselves need — proves `align="center"` does not make
          the first tab unreachable once the row also has to scroll. */}
      <div data-testid="center-overflow" style={{ inlineSize: "16rem" }}>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="Center, overflowing" align="center">
            {workspaceTabs.map((label) => (
              <Tabs.Trigger key={label} value={label.toLowerCase()}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="overview">A</Tabs.Content>
        </Tabs>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A list that fits: centered and end-aligned read as such against their own container.
    const center = within(canvas.getByTestId("center"));
    const centerList = center.getByRole("tablist");
    const centerFirst = center.getByRole("tab", { name: "Overview" });
    const centerLast = center.getByRole("tab", { name: "Activity" });
    const centerListRect = centerList.getBoundingClientRect();
    const centerLeadingGap = centerFirst.getBoundingClientRect().left - centerListRect.left;
    const centerTrailingGap = centerListRect.right - centerLast.getBoundingClientRect().right;
    await expect(Math.abs(centerLeadingGap - centerTrailingGap)).toBeLessThan(2);
    await expect(centerLeadingGap).toBeGreaterThan(2);

    const end = within(canvas.getByTestId("end"));
    const endList = end.getByRole("tablist");
    const endLast = end.getByRole("tab", { name: "Activity" });
    await expect(endList.getBoundingClientRect().right - endLast.getBoundingClientRect().right).toBeLessThan(2);

    // A centered row that also overflows: the first tab is fully visible without scrolling at all —
    // the very thing "safe centering" exists to guarantee. Plain `center` would instead start the row
    // scrolled to keep it visually centered, pushing the first tab out of view (found live, before the
    // fix: `scrollLeft` started well above 0, with the first tab already cut off on page load) — "safe"
    // falls back to start-alignment once the content can't all fit, so there is nothing to scroll back
    // to reach it, confirmed by the reported `overflowStart` itself, not only the tab's own position.
    const overflowing = within(canvas.getByTestId("center-overflow"));
    const overflowList = overflowing.getByRole("tablist");
    await expect(overflowList.scrollWidth).toBeGreaterThan(overflowList.clientWidth);
    await expect(overflowing.queryByRole("button", { name: "Scroll tabs to the start" })).toBeNull();
    await expect(overflowList.scrollLeft).toBe(0);
    const overview = overflowing.getByRole("tab", { name: "Overview" });
    const listRect = overflowList.getBoundingClientRect();
    const overviewRect = overview.getBoundingClientRect();
    await expect(overviewRect.left).toBeGreaterThanOrEqual(listRect.left - 1);
    await expect(overviewRect.right).toBeLessThanOrEqual(listRect.right + 1);
  },
};
