import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { StarIcon } from "@dbm-system/icons";
import { usePersistentDismiss } from "@dbm-system/utils";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Alert } from "./Alert";
import { alertPlaygroundSnippet, alertSnippets } from "./Alert.snippets";
import type {
  AlertActionsPlacement,
  AlertAlign,
  AlertProps,
  AlertRole,
  AlertSize,
  AlertTone,
  AlertVariant,
} from "./Alert.types";

// `Alert.Title`, `Alert.Description` and `Alert.Actions` each get their own Properties table via a hidden docs-only
// stories file (guidelines/adr/0013), where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  tone: AlertTone;
  variant: AlertVariant;
  size: AlertSize;
  // "Default" is the tone's own icon, "None" is `false`, "Star" is a custom one.
  icon: AlertProps["icon"];
  banner: boolean;
  actionsPlacement: AlertActionsPlacement;
  align: AlertAlign;
  sticky: boolean;
  stickyOffset: AlertProps["stickyOffset"];
  dismissible: boolean;
  open: boolean;
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: AlertRole | "Default";
  dir: "ltr" | "rtl";
  labels: AlertProps["labels"];
  scrollContainerRef: AlertProps["scrollContainerRef"];
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  children: AlertProps["children"];
}

const demoContainerStyle = { maxWidth: "40rem" } as const;

/**
 * A stand-in for the page, for a banner: it spans the whole width of the canvas and has a border, so the banner's square,
 * borderless sides meet the edges of something instead of floating, cropped, in the middle of a narrow box.
 */
const PageFrame = ({ children, ...props }: { children: ReactNode; "data-testid"?: string }) => (
  <div style={{ width: "100%", border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)" }} {...props}>
    {children}
  </div>
);

/**
 * A box whose width can be dragged, for watching a component respond to the room it has. `resize` only works on a box whose
 * `overflow` isn't `visible`, and such a box clips anything drawn outside it — including a focus ring, which reaches 6px beyond a
 * control (a 4px offset and a 2px line). So the box has padding to hold a ring at its edge.
 */
const ResizeBox = ({ children, maxWidth, ...props }: { children: ReactNode; maxWidth: string; "data-testid"?: string }) => (
  <div style={{ maxWidth, resize: "horizontal", overflow: "auto", padding: "var(--dbm-space-2)" }} {...props}>
    {children}
  </div>
);

/**
 * That the focus ring of `control` (which must have keyboard focus) is not cut off: it fits inside every ancestor that clips its
 * overflow. Measured from the ring's real width and offset, not assumed.
 */
const expectRingUnclipped = async (control: HTMLElement) => {
  const style = getComputedStyle(control);
  await expect(style.outlineStyle, "the control shows a focus ring").toBe("solid");
  const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
  const box = control.getBoundingClientRect();
  for (let element = control.parentElement; element && element !== document.documentElement; element = element.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(element);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const rect = element.getBoundingClientRect();
    const left = rect.left + element.clientLeft;
    const top = rect.top + element.clientTop;
    await expect(box.left - reach, `${element.tagName} clips the ring on the left`).toBeGreaterThanOrEqual(left - 0.5);
    await expect(box.top - reach, `${element.tagName} clips the ring on the top`).toBeGreaterThanOrEqual(top - 0.5);
    await expect(box.right + reach, `${element.tagName} clips the ring on the right`).toBeLessThanOrEqual(left + element.clientWidth + 0.5);
    await expect(box.bottom + reach, `${element.tagName} clips the ring at the bottom`).toBeLessThanOrEqual(top + element.clientHeight + 0.5);
  }
};

/** A small, real alert the gallery stories vary. */
const DemoAlert = (props: Partial<AlertProps>) => (
  <Alert {...props}>
    <Alert.Title>Payment failed</Alert.Title>
    <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
  </Alert>
);

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" } as const;

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const noControls = {
  tone: { control: false },
  variant: { control: false },
  size: { control: false },
  icon: { control: false },
  banner: { control: false },
  actionsPlacement: { control: false },
  align: { control: false },
  sticky: { control: false },
  stickyOffset: { control: false },
  dismissible: { control: false },
  open: { control: false },
  defaultOpen: { control: false },
  role: { control: false },
  dir: { control: false },
  "aria-label": { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Feedback/Alert",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The message: Alert.Title, Alert.Description and Alert.Actions in any order, any of them optional — or plain text, for the shortest alert.",
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger", "neutral"],
      description:
        "What the message is about: info (neutral news), success (something worked), warning (needs attention), danger (something went wrong) or neutral (a plain notice). Sets the colours, the default icon and how it is announced.",
      table: { defaultValue: { summary: '"info"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description:
        "How it is drawn: subtle (a soft tint of the tone with a faint border), outlined (the page's surface with a border in the tone's colour) or solid (the tone's full colour).",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size.",
      table: { defaultValue: { summary: '"md"' } },
    },
    icon: {
      control: false,
      description:
        "The icon before the message — a component reference from @dbm-system/icons, not a string name. Each tone has its own; pass another to replace it, or false for none. Decorative.",
    },
    banner: {
      control: "boolean",
      description:
        "Draws it edge to edge, with square corners and no side borders — for a message that spans a whole page or section.",
      table: { defaultValue: { summary: "false" } },
    },
    actionsPlacement: {
      control: "select",
      options: ["below", "inline"],
      description:
        "Where Alert.Actions sits: below the message (the default), or beside it at the end of the row. Inline actions drop below on their own when the alert's own width can't fit both, so an alert in a narrow column stacks by itself.",
      table: { defaultValue: { summary: '"below"' } },
    },
    align: {
      control: "select",
      options: ["start", "center"],
      description:
        "Where the content sits along the row: at the start (the default), or centred — the icon, the message and inline actions as one group, for an announcement banner. The dismiss button stays at the end of the row.",
      table: { defaultValue: { summary: '"start"' } },
    },
    sticky: {
      control: "boolean",
      description:
        "Keeps it at the top of the page (or of scrollContainerRef) as the reader scrolls, lifted with a shadow while stuck. Built on Affix.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "How far from the top a sticky alert sticks, from the spacing token scale — for a page whose own header is also sticky. Has no effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: {
      control: false,
      description:
        "The scrollable container a sticky alert sticks within, if it isn't the page itself. Has no effect without sticky. The same prop Affix and BackToTop take.",
    },
    dismissible: {
      control: "boolean",
      description:
        "Adds a button that dismisses it: onOpenChange(false) is called and, unless open is controlled, it hides. Combine with usePersistentDismiss to remember the dismissal across visits.",
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      control: "boolean",
      description: "Whether it is showing, when controlled. Pair with onOpenChange.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether it starts out showing, when uncontrolled.",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with false when it is dismissed. It never calls with true — nothing inside it can reopen it.",
    },
    role: {
      control: "select",
      options: ["alert", "status", "none"],
      description:
        'How it is announced: "alert" interrupts, "status" waits for a pause, "none" is plain text that isn\'t announced. Left out, it follows the tone: alert for danger and warning, status for the rest.',
    },
    labels: {
      control: false,
      description: 'The text the component supplies itself, each part replaceable: dismiss (the dismiss button\'s accessible name, "Dismiss").',
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute: mirrors the layout, so the icon and the dismiss button swap sides. Left out, the nearest DirectionProvider's; with none, inherited from the page.",
    },
    "aria-label": { control: "text", description: "The alert's accessible name, when it needs one of its own." },
    "aria-labelledby": { control: false, description: "The id of an element that names the alert." },
    "aria-describedby": { control: false, description: "The id of an element that describes it." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    tone: "info",
    variant: "subtle",
    size: "md",
    icon: undefined,
    banner: false,
    actionsPlacement: "below",
    align: "start",
    sticky: false,
    stickyOffset: 0,
    dismissible: false,
    defaultOpen: true,
    role: "Default",
    dir: "ltr",
    "aria-label": "",
  },
  render: (args) => <PlaygroundAlert {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/**
 * The Playground's alert, controlled so that dismissing it can be undone — otherwise the demo would be gone for good the
 * first time the dismiss button was used.
 */
function PlaygroundAlert(args: PlaygroundArgs) {
  const [open, setOpen] = useState(true);
  // A banner spans the page, so it is shown across the whole canvas in a page frame; anything else in a readable column.
  const Wrapper = args.banner ? PageFrame : "div";
  return (
    <div style={args.banner ? undefined : demoContainerStyle}>
      <Wrapper>
        <Alert
          tone={args.tone}
          variant={args.variant}
          size={args.size}
          icon={args.icon}
          banner={args.banner}
          actionsPlacement={args.actionsPlacement}
          align={args.align}
          sticky={args.sticky}
          stickyOffset={args.stickyOffset}
          dismissible={args.dismissible}
          open={open}
          onOpenChange={setOpen}
          role={args.role === "Default" ? undefined : args.role}
          dir={args.dir}
          aria-label={args["aria-label"] || undefined}
        >
          <Alert.Title>Payment failed</Alert.Title>
          <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
          <Alert.Actions>
            <Alert.Action>Update card</Alert.Action>
            <Alert.Action variant="tertiary">Remind me later</Alert.Action>
          </Alert.Actions>
        </Alert>
      </Wrapper>
      {!open && (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Show it again
        </Button>
      )}
    </div>
  );
}

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The Playground's own controls add a way to leave `icon` and `role` out ("Default") and a custom icon to try — not
  // values the props take, so they stay out of the meta-level argTypes the Properties table reads.
  argTypes: {
    // The Playground holds its own open state (so a dismissed alert can be shown again), so these two would do nothing.
    open: { control: false },
    defaultOpen: { control: false },
    icon: {
      control: "select",
      options: ["Default", "None", "Star"],
      mapping: { Default: undefined, None: false, Star: StarIcon },
    },
    role: {
      control: "select",
      options: ["Default", "alert", "status", "none"],
      mapping: { Default: undefined, alert: "alert", status: "status", none: "none" },
    },
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => alertPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.tones } } },
  render: () => (
    <div data-testid="tones" style={{ ...demoContainerStyle, ...stack }}>
      {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
        <Alert key={tone} tone={tone}>
          <Alert.Title>{tone.charAt(0).toUpperCase() + tone.slice(1)}</Alert.Title>
          <Alert.Description>A message with the {tone} tone.</Alert.Description>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes. Danger and warning interrupt; the rest wait.
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    await expect(canvas.getAllByRole("status")).toHaveLength(3);
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.variants } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack, gap: "var(--dbm-space-8)" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <div key={variant} style={stack}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
            <Alert key={tone} tone={tone} variant={variant} role="none">
              <Alert.Description>A {tone} message, {variant}.</Alert.Description>
            </Alert>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Alert key={size} size={size} dismissible role="none">
          <Alert.Title>size=&quot;{size}&quot;</Alert.Title>
          <Alert.Description>Your card was declined.</Alert.Description>
        </Alert>
      ))}
    </div>
  ),
};

export const WithActions: Story = {
  name: "With actions",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.actions } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning">
        <Alert.Title>Payment failed</Alert.Title>
        <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
        <Alert.Actions>
          <Alert.Action>Update card</Alert.Action>
          <Alert.Action variant="tertiary">Remind me later</Alert.Action>
        </Alert.Actions>
      </Alert>
    </div>
  ),
};

export const ActionsEverywhere: Story = {
  name: "Actions on every tone and variant",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.actionVariants } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack, gap: "var(--dbm-space-8)" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <div key={variant} style={stack}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
            <Alert key={tone} tone={tone} variant={variant} size="sm" role="none">
              <Alert.Description>A {tone} message.</Alert.Description>
              <Alert.Actions>
                <Alert.Action>Primary</Alert.Action>
                <Alert.Action variant="secondary">Secondary</Alert.Action>
                <Alert.Action variant="tertiary">Tertiary</Alert.Action>
              </Alert.Actions>
            </Alert>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const InlineActions: Story = {
  name: "Actions beside the message",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.inlineActions } } },
  render: () => (
    <div style={{ ...stack, gap: "var(--dbm-space-6)" }}>
      <PageFrame>
        <Alert banner actionsPlacement="inline" tone="warning" role="none">
          <Alert.Title>Payment failed</Alert.Title>
          <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
          <Alert.Actions>
            <Alert.Action>Update card</Alert.Action>
            <Alert.Action variant="tertiary">Remind me later</Alert.Action>
          </Alert.Actions>
        </Alert>
      </PageFrame>
      <ResizeBox maxWidth="48rem">
        <Alert actionsPlacement="inline" role="none">
          <Alert.Description>Drag the corner of this box: the actions drop below when there is no room beside.</Alert.Description>
          <Alert.Actions>
            <Alert.Action>Got it</Alert.Action>
          </Alert.Actions>
        </Alert>
      </ResizeBox>
    </div>
  ),
};

export const Centered: Story = {
  name: "Centred content",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.centered } } },
  render: () => (
    <div style={{ ...stack, gap: "var(--dbm-space-6)" }}>
      {(["subtle", "solid"] as const).map((variant) => (
        <PageFrame key={variant}>
          <Alert banner align="center" actionsPlacement="inline" dismissible variant={variant} tone="info" role="none" data-testid={`centered-${variant}`}>
            <Alert.Description>Summer sale: 20% off everything until Sunday.</Alert.Description>
            <Alert.Actions>
              <Alert.Action>Shop now</Alert.Action>
            </Alert.Actions>
          </Alert>
        </PageFrame>
      ))}
    </div>
  ),
};

export const Appearing: Story = {
  name: "Appearing after the page loads",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.appearing } } },
  render: () => <AppearingDemo />,
};

function AppearingDemo() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Button size="sm" variant="secondary" onClick={() => setCount((value) => value + 1)}>
        {count === 0 ? "Show a message" : "Show it again"}
      </Button>
      {count > 0 && (
        // Keyed, so each press mounts a new alert, the way an error appearing after a submit does.
        <Alert key={count} tone="danger" dismissible data-testid="appearing">
          <Alert.Title>Payment failed</Alert.Title>
          <Alert.Description>It fades and slides in, then stays put.</Alert.Description>
        </Alert>
      )}
    </div>
  );
}

export const TitleOnly: Story = {
  name: "Title only",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.titleOnly } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="success">
        <Alert.Title>Your changes were saved</Alert.Title>
      </Alert>
    </div>
  ),
};

export const PlainText: Story = {
  name: "Plain text",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.plainText } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert>Your session will expire in five minutes.</Alert>
    </div>
  ),
};

export const Icons: Story = {
  name: "Icons",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.icons } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert icon={false} role="none">
        <Alert.Description>No icon on this one.</Alert.Description>
      </Alert>
      <Alert icon={StarIcon} tone="neutral" role="none">
        <Alert.Description>Your own icon replaces the tone&apos;s.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const Banner: Story = {
  name: "Banner",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.banner } } },
  render: () => (
    <PageFrame data-testid="banner-frame">
      <Alert banner tone="warning" role="none">
        <Alert.Title>Scheduled maintenance</Alert.Title>
        <Alert.Description>The dashboard will be read-only on Sunday from 02:00 to 04:00 UTC.</Alert.Description>
      </Alert>
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    // Measures only. A banner has square corners and no side borders, so it meets its container's edges.
    const alert = within(canvasElement).getByText("Scheduled maintenance").closest("div[class*='root']") as HTMLElement;
    const style = getComputedStyle(alert);
    await expect(style.borderTopLeftRadius).toBe("0px");
    await expect(style.borderInlineStartWidth).toBe("0px");
    await expect(style.borderInlineEndWidth).toBe("0px");
    await expect(style.borderBlockStartWidth).not.toBe("0px");
  },
};

export const Sticky: Story = {
  name: "Sticky",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.sticky } } },
  render: () => <StickyDemo />,
};

function StickyDemo() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scroller}
      data-testid="scroller"
      style={{
        maxWidth: "40rem",
        height: "18rem",
        overflow: "auto",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
      }}
    >
      <Alert banner sticky dismissible scrollContainerRef={scroller} tone="warning" role="none" data-testid="sticky-alert">
        <Alert.Title>Scheduled maintenance</Alert.Title>
        <Alert.Description>The dashboard will be read-only on Sunday.</Alert.Description>
      </Alert>
      <div style={{ padding: "var(--dbm-space-4)", ...stack }}>
        <Text>Scroll this box: the alert stays at the top and lifts with a shadow while it is stuck.</Text>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index} color="secondary">
            Paragraph {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        ))}
      </div>
    </div>
  );
}

export const Dismissible: Story = {
  name: "Dismissible",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.dismissible } } },
  render: () => <DismissibleDemo />,
};

function DismissibleDemo() {
  const [key, setKey] = useState(0);
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert key={key} dismissible>
        <Alert.Title>Tip</Alert.Title>
        <Alert.Description>You can press ? at any time to see the keyboard shortcuts.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={() => setKey((count) => count + 1)}>
        Show it again
      </Button>
    </div>
  );
}

export const Controlled: Story = {
  name: "Controlled",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.controlled } } },
  render: () => <ControlledDemo />,
};

function ControlledDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert dismissible open={open} onOpenChange={setOpen}>
        <Alert.Title>Tip</Alert.Title>
        <Alert.Description>You own whether this is showing.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide it" : "Show it"}
      </Button>
    </div>
  );
}

export const Persistent: Story = {
  name: "Remembering a dismissal",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.persistent } } },
  render: () => <PersistentDemo />,
};

function PersistentDemo() {
  // A session-length key, so a reader who dismisses it here isn't left without the demo on the next visit for good.
  const { ready, dismissed, dismiss, reset } = usePersistentDismiss("docs-demo-alert", { storage: "session" });
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert banner dismissible open={ready && !dismissed} onOpenChange={(open) => !open && dismiss()}>
        <Alert.Title>Summer sale</Alert.Title>
        <Alert.Description>Everything is 20% off until Sunday. Dismiss this and reload the page: it stays away.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={reset} disabled={!dismissed}>
        Forget that it was dismissed
      </Button>
    </div>
  );
}

export const HeadingTitle: Story = {
  name: "A heading as the title",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.heading } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning">
        <Alert.Title asChild>
          <h2>Your trial ends soon</h2>
        </Alert.Title>
        <Alert.Description>Add a payment method to keep your projects.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const Roles: Story = {
  name: "How it is announced",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.role } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning" role="none">
        <Alert.Title>Already on the page</Alert.Title>
        <Alert.Description>A message that is there when the page loads isn&apos;t news, so it needn&apos;t be announced.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  name: "Long content wraps",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.longContent } } },
  render: () => (
    <ResizeBox maxWidth="22rem" data-testid="long">
      <Alert dismissible role="none">
        <Alert.Title>A title that is long enough to run onto a second line in a narrow place</Alert.Title>
        <Alert.Description>
          A message with a very long unbroken address: https://example.com/a/very/long/path/that/has/no/break/points
        </Alert.Description>
      </Alert>
    </ResizeBox>
  ),
};

export const Translated: Story = {
  name: "Translated text",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.translated } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert dismissible labels={{ dismiss: "Fermer" }}>
        <Alert.Title>Conseil</Alert.Title>
        <Alert.Description>Appuyez sur ? pour voir les raccourcis clavier.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.rightToLeft } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoAlert dismissible dir="rtl" role="none" data-testid="rtl-alert" />
    </div>
  ),
};

// --- Real-browser tests: what jsdom can't evaluate. Hidden from the sidebar and the Docs page (`!dev`); each
// renders what it needs itself. ---

export const DismissInteraction: Story = {
  name: "Dismissing — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <button>Before</button>
      <Alert dismissible data-testid="dismissable">
        <Alert.Title>Tip</Alert.Title>
      </Alert>
      <button>After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab(); // Before
    await userEvent.tab(); // the dismiss button
    const dismiss = canvas.getByRole("button", { name: "Dismiss" });
    await expect(dismiss).toHaveFocus();
    await expect(getComputedStyle(dismiss).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Enter}");
    // The exit animation runs (the element is still there, closing), then it is gone from the page.
    await waitFor(() => expect(canvas.queryByTestId("dismissable")).not.toBeInTheDocument());
    // And focus went somewhere sensible instead of dropping to the top of the document.
    await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
  },
};

export const StickyInteraction: Story = {
  name: "Sticking — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <StickyDemo />,
  play: async ({ canvasElement }) => {
    const scroller = within(canvasElement).getByTestId("scroller");
    const alert = within(scroller).getByTestId("sticky-alert");
    const wrapper = alert.parentElement!.parentElement!;
    const top = () => Math.round(alert.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
    // At rest it sits at the top, and isn't stuck — flush against the top, with no hairline of page above it (the 1px marker
    // `Affix` puts before it must not take up room).
    await expect(wrapper.hasAttribute("data-stuck")).toBe(false);
    const scrollerBox = scroller.getBoundingClientRect();
    await expect(Math.abs(alert.getBoundingClientRect().top - (scrollerBox.top + parseFloat(getComputedStyle(scroller).borderTopWidth)))).toBeLessThan(0.5);
    scroller.scrollTop = 300;
    // Scrolled: it is still at the top of the scroller, and is stuck (lifted with a shadow).
    await waitFor(() => expect(wrapper.hasAttribute("data-stuck")).toBe(true));
    await expect(Math.abs(top() - parseFloat(getComputedStyle(scroller).borderTopWidth))).toBeLessThanOrEqual(2);
    await expect(getComputedStyle(alert).boxShadow).not.toBe("none");
    scroller.scrollTop = 0;
    await waitFor(() => expect(wrapper.hasAttribute("data-stuck")).toBe(false));
  },
};

const ColourMatrix = () => (
  <div style={{ ...demoContainerStyle, ...stack }}>
    {(["info", "success", "warning", "danger", "neutral"] as const).flatMap((tone) =>
      (["subtle", "outlined", "solid"] as const).map((variant) => (
        <Alert key={`${tone}-${variant}`} tone={tone} variant={variant} role="none" data-testid={`${tone}-${variant}`}>
          <Alert.Description>x</Alert.Description>
        </Alert>
      )),
    )}
  </div>
);

/** Every tone × variant draws with the tokens it should, in whichever theme the story is in. */
const checkColours = async (canvasElement: HTMLElement) => {
  const resolve = (token: string) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    canvasElement.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  };
  const canvas = within(canvasElement);
  for (const tone of ["info", "success", "warning", "danger", "neutral"] as const) {
    const subtle = getComputedStyle(canvas.getByTestId(`${tone}-subtle`));
    const outlined = getComputedStyle(canvas.getByTestId(`${tone}-outlined`));
    const solid = getComputedStyle(canvas.getByTestId(`${tone}-solid`));
    // Each variant draws with its own tone's tokens.
    await expect(subtle.backgroundColor, `${tone} subtle fill`).toBe(resolve(`--dbm-bg-${tone}-subtle`));
    await expect(outlined.backgroundColor, `${tone} outlined fill`).toBe(resolve("--dbm-bg-surface"));
    await expect(outlined.borderTopColor, `${tone} outlined border`).toBe(resolve(tone === "neutral" ? "--dbm-border-neutral-strong" : `--dbm-border-${tone}`));
    await expect(solid.backgroundColor, `${tone} solid fill`).toBe(resolve(`--dbm-bg-${tone}`));
    await expect(solid.color, `${tone} solid text`).toBe(resolve(`--dbm-text-on-${tone}`));
  }
};

export const ColourInteraction: Story = {
  name: "Colours — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <ColourMatrix />,
  play: async ({ canvasElement }) => checkColours(canvasElement),
};

export const ColourDarkInteraction: Story = {
  name: "Colours, dark — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { mode: "dark" },
  render: () => <ColourMatrix />,
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dataset.theme).toMatch(/-dark$/);
    await checkColours(canvasElement);
  },
};

export const ColourEmeraldInteraction: Story = {
  name: "Colours, Emerald — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { brand: "emerald" },
  render: () => <ColourMatrix />,
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dataset.theme).toMatch(/^emerald-/);
    await checkColours(canvasElement);
  },
};

export const WrapInteraction: Story = {
  name: "Long content — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="narrow" style={{ width: "16rem" }}>
      <Alert dismissible role="none" data-testid="narrow-alert">
        <Alert.Title>A title that is long enough to run onto a second line in a narrow place</Alert.Title>
        <Alert.Description>https://example.com/a/very/long/path/that/has/no/break/points/at/all/anywhere</Alert.Description>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("narrow");
    const alert = within(box).getByTestId("narrow-alert");
    // Nothing pushes it wider than its container, and the dismiss button stays inside it.
    await expect(alert.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const dismiss = within(alert).getByRole("button", { name: "Dismiss" });
    await expect(dismiss.getBoundingClientRect().right).toBeLessThanOrEqual(alert.getBoundingClientRect().right);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <DemoAlert dismissible dir="rtl" role="none" data-testid="rtl" />
      <DemoAlert dismissible role="none" data-testid="ltr" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sides = (id: string) => {
      const alert = canvas.getByTestId(id);
      const box = alert.getBoundingClientRect();
      const icon = alert.querySelector("svg")!.getBoundingClientRect();
      const dismiss = within(alert).getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
      return { iconOnStart: icon.left - box.left < box.right - icon.right, dismissOnEnd: box.right - dismiss.right < dismiss.left - box.left };
    };
    // In left-to-right text the icon is at the left and the dismiss button at the right; right-to-left swaps them.
    await expect(sides("ltr")).toEqual({ iconOnStart: true, dismissOnEnd: true });
    await expect(sides("rtl")).toEqual({ iconOnStart: false, dismissOnEnd: false });
  },
};

/** The WCAG contrast ratio of two opaque `rgb(...)` colours, from their computed values. */
function contrast(a: string, b: string): number {
  const luminance = (colour: string) => {
    const [r = 0, g = 0, bl = 0] = (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const linear = (channel: number) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(bl);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function ActionMatrix() {
  return (
    <div style={{ ...demoContainerStyle, ...stack, gap: "var(--dbm-space-3)" }}>
      {(["subtle", "outlined", "solid"] as const).flatMap((variant) =>
        (["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
          <Alert key={`${tone}-${variant}`} tone={tone} variant={variant} size="sm" role="none" data-testid={`${tone}-${variant}`}>
            <Alert.Actions>
              <Alert.Action data-action="primary">Primary</Alert.Action>
              <Alert.Action variant="secondary" data-action="secondary">
                Secondary
              </Alert.Action>
              <Alert.Action variant="tertiary" data-action="tertiary">
                Tertiary
              </Alert.Action>
            </Alert.Actions>
          </Alert>
        )),
      )}
    </div>
  );
}

/**
 * Every action on every tone and variant, with the contrast measured from the colours the browser actually drew — text at
 * 4.5:1, and the edge of a filled or outlined button against the alert at 3:1 (WCAG 1.4.3 and 1.4.11).
 */
const checkActionContrast = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const resolve = (token: string) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    canvasElement.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  };
  for (const variant of ["subtle", "outlined", "solid"] as const) {
    for (const tone of ["info", "success", "warning", "danger", "neutral"] as const) {
      const alert = canvas.getByTestId(`${tone}-${variant}`);
      const alertBackground = getComputedStyle(alert).backgroundColor;
      const where = `${tone}/${variant}`;
      const primary = getComputedStyle(within(alert).getByText("Primary"));
      const secondary = getComputedStyle(within(alert).getByText("Secondary"));
      const tertiary = getComputedStyle(within(alert).getByText("Tertiary"));
      // Filled: the label on its fill, and the fill's edge against the alert.
      await expect(contrast(primary.color, primary.backgroundColor), `${where} primary label`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(primary.backgroundColor, alertBackground), `${where} primary edge`).toBeGreaterThanOrEqual(3);
      // Outlined and plain: the label on the alert, and the outline against it.
      await expect(contrast(secondary.color, alertBackground), `${where} secondary label`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(secondary.borderTopColor, alertBackground), `${where} secondary border`).toBeGreaterThanOrEqual(3);
      await expect(contrast(tertiary.color, alertBackground), `${where} tertiary label`).toBeGreaterThanOrEqual(4.5);
      if (variant !== "solid") {
        // On a subtle or outlined alert the secondary and tertiary labels are the tone's own colour (neutral: secondary text).
        const label = resolve(tone === "neutral" ? "--dbm-text-secondary" : `--dbm-text-${tone}`);
        await expect(secondary.color, `${where} secondary label colour`).toBe(label);
        await expect(tertiary.color, `${where} tertiary label colour`).toBe(label);
        // The hover fills, worked out from the tokens (a synthetic pointer can't trigger :hover): the page surface on a subtle
        // alert, the tone's subtle tint on an outlined one — the label must still read on it.
        const hoverFill = resolve(variant === "subtle" ? "--dbm-bg-surface" : `--dbm-bg-${tone}-subtle`);
        await expect(contrast(label, hoverFill), `${where} label on its hover fill`).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
};

export const ActionContrastInteraction: Story = {
  name: "Action contrast — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <ActionMatrix />,
  play: async ({ canvasElement }) => checkActionContrast(canvasElement),
};

export const ActionContrastDarkInteraction: Story = {
  name: "Action contrast, dark — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { mode: "dark" },
  render: () => <ActionMatrix />,
  play: async ({ canvasElement }) => {
    // The story really is in dark mode (fails loudly if the global didn't apply).
    await expect(document.documentElement.dataset.theme).toMatch(/-dark$/);
    await checkActionContrast(canvasElement);
  },
};

export const ActionContrastEmeraldInteraction: Story = {
  name: "Action contrast, Emerald — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { brand: "emerald" },
  render: () => <ActionMatrix />,
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dataset.theme).toMatch(/^emerald-/);
    await checkActionContrast(canvasElement);
  },
};

export const ActionSizeInteraction: Story = {
  name: "Action size — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={stack}>
      {(["xs", "md", "xl"] as const).map((size) => (
        <Alert key={size} size={size} role="none" data-testid={`size-${size}`}>
          <Alert.Actions>
            <Alert.Action>Go</Alert.Action>
          </Alert.Actions>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // An action is exactly as tall as a `Button` of the alert's own size: the size follows the alert.
    const canvas = within(canvasElement);
    const heights = ["xs", "md", "xl"].map((size) => within(canvas.getByTestId(`size-${size}`)).getByRole("button").getBoundingClientRect().height);
    await expect(heights[0]!).toBeLessThan(heights[1]!);
    await expect(heights[1]!).toBeLessThan(heights[2]!);
  },
};

export const InlineInteraction: Story = {
  name: "Actions beside the message — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={stack}>
      {["60rem", "16rem"].map((width) => (
        <div key={width} data-testid={`box-${width}`} style={{ width }}>
          <Alert actionsPlacement="inline" role="none">
            <Alert.Title>Payment failed</Alert.Title>
            <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
            <Alert.Actions>
              <Alert.Action>Update card</Alert.Action>
            </Alert.Actions>
          </Alert>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parts = (width: string) => {
      const box = canvas.getByTestId(`box-${width}`);
      const text = within(box).getByText("Payment failed").closest("div[class*='text']")!.getBoundingClientRect();
      const actions = within(box).getByRole("button", { name: "Update card" }).closest("div[class*='actions']")!.getBoundingClientRect();
      return { text, actions };
    };
    // Wide: the actions are beside the message, at the end of the row — to the right of it, level with it.
    const wide = parts("60rem");
    await expect(wide.actions.left).toBeGreaterThanOrEqual(wide.text.right - 1);
    await expect(wide.actions.top).toBeLessThan(wide.text.bottom);
    // Narrow (the alert's own width, whatever the page's): they drop below the message.
    const narrow = parts("16rem");
    await expect(narrow.actions.top).toBeGreaterThanOrEqual(narrow.text.bottom - 1);
  },
};

export const CenterInteraction: Story = {
  name: "Centred content — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ ...stack, gap: "var(--dbm-space-4)" }}>
      {[false, true].map((dismissible) => (
        <div key={String(dismissible)} data-testid={`frame-${dismissible}`} style={{ width: "100%" }}>
          <Alert banner align="center" actionsPlacement="inline" dismissible={dismissible} role="none" data-testid={`centered-${dismissible}`}>
            <Alert.Description>Summer sale: 20% off everything until Sunday.</Alert.Description>
            <Alert.Actions>
              <Alert.Action>Shop now</Alert.Action>
            </Alert.Actions>
          </Alert>
        </div>
      ))}
      <div data-testid="stacked-frame" style={{ width: "100%" }}>
        <Alert banner align="center" role="none" data-testid="stacked">
          <Alert.Title>Payment failed</Alert.Title>
          <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
          <Alert.Actions>
            <Alert.Action>Update card</Alert.Action>
          </Alert.Actions>
        </Alert>
      </div>
      <div data-testid="narrow" style={{ width: "18rem" }}>
        <Alert banner align="center" dismissible role="none">
          <Alert.Description>A long announcement that has to wrap onto several lines in a narrow place.</Alert.Description>
        </Alert>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const dismissible of [false, true]) {
      const frame = canvas.getByTestId(`frame-${dismissible}`).getBoundingClientRect();
      const alert = canvas.getByTestId(`centered-${dismissible}`);
      const icon = alert.querySelector("svg")!.getBoundingClientRect();
      const actions = within(alert).getByRole("button", { name: "Shop now" }).getBoundingClientRect();
      // The group — from the icon to the end of the actions — is centred in the frame, with or without a dismiss button.
      const groupCentre = (icon.left + actions.right) / 2;
      await expect(Math.abs(groupCentre - (frame.left + frame.right) / 2)).toBeLessThanOrEqual(2);
      await expect(getComputedStyle(within(alert).getByText("Summer sale: 20% off everything until Sunday.").closest("div[class*='text']")!).textAlign).toBe("center");
      if (dismissible) {
        // The dismiss button sits at the end of the row.
        const dismiss = within(alert).getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
        await expect(frame.right - dismiss.right).toBeLessThan(frame.width / 10);
        await expect(dismiss.left).toBeGreaterThan(actions.right);
      }
    }
    // With a title, a description and actions below (the default placement), the icon is at the start of the first line —
    // right beside the title's words — and that line, the description and the actions are each centred in the alert. Measured
    // on the words themselves: an element's box stretches across its row wherever its text is.
    const stacked = canvas.getByTestId("stacked");
    const stackedFrame = canvas.getByTestId("stacked-frame").getBoundingClientRect();
    const frameCentre = (stackedFrame.left + stackedFrame.right) / 2;
    const wordsOf = (text: string) => {
      // The text node itself: the element around it also holds the icon, which would widen the range.
      const node = Array.from(within(stacked).getByText(text).childNodes).find((child) => child.nodeType === Node.TEXT_NODE)!;
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const stackedIcon = stacked.querySelector("svg")!.getBoundingClientRect();
    const title = wordsOf("Payment failed");
    const description = wordsOf("Your card was declined. Update it to keep your plan.");
    const stackedActions = within(stacked).getByRole("button", { name: "Update card" }).getBoundingClientRect();
    // The icon is right against the title, not stranded beside the widest line.
    await expect(title.left - stackedIcon.right).toBeLessThanOrEqual(12);
    await expect(title.left).toBeGreaterThanOrEqual(stackedIcon.right);
    // The first line — icon and title — is centred, and so are the description and the actions.
    await expect(Math.abs((stackedIcon.left + title.right) / 2 - frameCentre)).toBeLessThanOrEqual(2);
    await expect(Math.abs((description.left + description.right) / 2 - frameCentre)).toBeLessThanOrEqual(2);
    await expect(Math.abs((stackedActions.left + stackedActions.right) / 2 - frameCentre)).toBeLessThanOrEqual(2);
    // In a narrow alert the text wraps, and must stop short of the dismiss button rather than run under it.
    const narrow = canvas.getByTestId("narrow");
    const text = within(narrow).getByText("A long announcement that has to wrap onto several lines in a narrow place.").getBoundingClientRect();
    const dismiss = within(narrow).getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
    await expect(text.right).toBeLessThanOrEqual(dismiss.left);
  },
};

export const EnterInteraction: Story = {
  name: "Appearing — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <AppearingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show a message" }));
    const alert = await canvas.findByTestId("appearing");
    const wrapper = alert.parentElement!.parentElement!;
    // It animates in, and the flag is cleared when the animation ends, so nothing keeps clipping it.
    await expect(wrapper).toHaveAttribute("data-enter");
    await waitFor(() => expect(wrapper).not.toHaveAttribute("data-enter"), { timeout: 3000 });
    await expect(getComputedStyle(alert.parentElement!).overflow).toBe("visible");
    await expect(getComputedStyle(wrapper).opacity).toBe("1");
    // A second one, mounted the same way, animates too.
    await userEvent.click(canvas.getByRole("button", { name: "Show it again" }));
    await waitFor(() => expect(canvas.getByTestId("appearing").parentElement!.parentElement!).toHaveAttribute("data-enter"));
  },
};

export const ActionsSpacingInteraction: Story = {
  name: "Space above the actions — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Alert key={size} size={size} role="none" data-testid={`spacing-${size}`}>
          <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
          <Alert.Actions>
            <Alert.Action>Update card</Alert.Action>
          </Alert.Actions>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gaps = ["xs", "sm", "md", "lg", "xl"].map((size) => {
      const alert = canvas.getByTestId(`spacing-${size}`);
      const description = within(alert).getByText("Your card was declined. Update it to keep your plan.").getBoundingClientRect();
      const actions = within(alert).getByRole("button").closest("div[class*='actions']")!.getBoundingClientRect();
      return Math.round(actions.top - description.bottom);
    });
    // The space between the message and its actions is `space-2` … `space-5` (8, 12, 16, 16, 20px), growing with the alert's size.
    await expect(gaps).toEqual([8, 12, 16, 16, 20]);
  },
};

export const DismissTargetInteraction: Story = {
  name: "Dismiss button size — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Alert key={size} size={size} dismissible role="none" data-testid={`dismiss-${size}`}>
          <Alert.Description>Message</Alert.Description>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // WCAG 2.5.8 (Target Size, Minimum): the dismiss button is at least 24 × 24 CSS pixels at every size.
    const canvas = within(canvasElement);
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const box = within(canvas.getByTestId(`dismiss-${size}`)).getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
      await expect(box.width, `${size} width`).toBeGreaterThanOrEqual(24);
      await expect(box.height, `${size} height`).toBeGreaterThanOrEqual(24);
    }
  },
};

export const InlineOverflowInteraction: Story = {
  name: "Inline actions in a narrow alert — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={stack}>
      {(
        [
          ["md", "18rem", false],
          ["xl", "24rem", false],
          ["xl", "24rem", true],
        ] as const
      ).map(([size, width, center]) => (
        <div key={`${size}-${center}`} data-testid={`narrow-${size}-${center}`} style={{ width }}>
          <Alert size={size} actionsPlacement="inline" align={center ? "center" : "start"} dismissible role="none">
            <Alert.Title>Payment failed</Alert.Title>
            <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
            <Alert.Actions>
              <Alert.Action>Update card</Alert.Action>
              <Alert.Action variant="tertiary">Remind me later</Alert.Action>
            </Alert.Actions>
          </Alert>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // However narrow the alert, its actions wrap inside it rather than running out of the side.
    const canvas = within(canvasElement);
    for (const id of ["narrow-md-false", "narrow-xl-false", "narrow-xl-true"]) {
      const box = canvas.getByTestId(id);
      const alert = box.firstElementChild!.firstElementChild!.firstElementChild as HTMLElement;
      const edge = alert.getBoundingClientRect();
      await expect(alert.scrollWidth, `${id} alert overflows`).toBeLessThanOrEqual(alert.clientWidth);
      for (const button of within(alert).getAllByRole("button")) {
        const rect = button.getBoundingClientRect();
        await expect(rect.right, `${id} ${button.textContent} right`).toBeLessThanOrEqual(edge.right + 0.5);
        await expect(rect.left, `${id} ${button.textContent} left`).toBeGreaterThanOrEqual(edge.left - 0.5);
      }
    }
  },
};

export const FocusRingInteraction: Story = {
  name: "Focus rings in a resizable box — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // The wrapper the resizable stories use: its `overflow` must not cut the ring of a control inside the alert.
  render: () => (
    <ResizeBox maxWidth="48rem">
      <Alert dismissible actionsPlacement="inline" role="none">
        <Alert.Description>Drag the corner of this box.</Alert.Description>
        <Alert.Actions>
          <Alert.Action>Got it</Alert.Action>
          <Alert.Action variant="tertiary">Later</Alert.Action>
        </Alert.Actions>
      </Alert>
    </ResizeBox>
  ),
  play: async ({ canvasElement }) => {
    // Let the alert finish coming in first: its wrapper clips (by design) for the length of that animation.
    await waitFor(() => expect(canvasElement.querySelector("[data-enter]")).toBeNull(), { timeout: 3000 });
    for (const control of within(canvasElement).getAllByRole("button")) {
      await userEvent.tab();
      await expect(control).toHaveFocus();
      await expectRingUnclipped(control);
    }
  },
};
