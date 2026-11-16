import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Portal } from "./Portal";
import { portalPlaygroundSnippet, portalSnippets } from "./Portal.snippets";

// Purely structural/behavioral — no visual variants or breakpoint behavior of
// its own, so the story demonstrates *where in the DOM* content ends up
// rather than viewport-width coverage.
const meta: Meta<typeof Portal> = {
  title: "Components/Portal",
  id: "atoms-utility-portal",
  component: Portal,
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The content to render into container (or in place, if disablePortal is set). Must be a single valid element when asChild is set.",
    },
    container: {
      control: false,
      description:
        "Element to portal children into. Ignored when disablePortal is true. Not meaningfully settable via a live control — see the dedicated Custom container target story.",
    },
    disablePortal: {
      control: "boolean",
      description:
        "Renders children in place, with no portal and no wrapper element, instead of moving them to container.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Portals the child itself instead of wrapping it in an extra <div>. Has no effect when disablePortal is true.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
    disablePortal: false,
    asChild: false,
  },
};

export default meta;

type Story = StoryObj<typeof Portal>;

const boxStyle = {
  border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
  minHeight: "var(--dbm-space-16)",
  padding: "var(--dbm-space-4)",
};

const badgeStyle = {
  background: "var(--dbm-bg-brand-subtle)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-brand)",
  display: "inline-block",
  padding: "var(--dbm-space-1) var(--dbm-space-2)",
};

/**
 * Drive `disablePortal`/`asChild` live against a target box scoped to this
 * Canvas, rather than the real `document.body` — a Storybook Docs page
 * embeds every story's Canvas into one shared document (see the Variants
 * section below for why `Default`/`AsChild` live on their own pages instead
 * of here), so a demo targeting the true `document.body` wouldn't be
 * observable without scrolling away from this section entirely. Toggling
 * `disablePortal` here still exercises the real prop and its real behavior
 * — only the portal's *target* is a local stand-in for `document.body`, via
 * the same `container` prop the dedicated "Custom container target" story
 * demonstrates directly.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => portalPlaygroundSnippet(context.args),
      },
    },
  },
  render: function PlaygroundStory({ disablePortal, asChild }) {
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    return (
      <div style={boxStyle}>
        <p style={{ marginTop: 0 }}>
          With the portal active (default), the badge renders inside the target box on the right —
          not here — since <code>Portal</code> moves it elsewhere in the DOM. Toggle{" "}
          <code>disablePortal</code> to see it render right here instead.
        </p>
        <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {target && (
              <Portal
                disablePortal={disablePortal}
                asChild={asChild}
                container={disablePortal ? undefined : target}
              >
                <span style={badgeStyle}>Portaled content</span>
              </Portal>
            )}
          </div>
          <div
            ref={setTarget}
            style={{
              border: "var(--dbm-border-width-1) dashed var(--dbm-border-neutral)",
              borderRadius: "var(--dbm-radius-md)",
              minHeight: "var(--dbm-space-12)",
              padding: "var(--dbm-space-3)",
              flex: 1,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "var(--dbm-font-size-sm)",
                color: "var(--dbm-text-tertiary)",
              }}
            >
              Portal target
            </p>
          </div>
        </div>
      </div>
    );
  },
};

export const Default: Story = {
  // Fixed render — doesn't read `args` at all, so `disablePortal`/`asChild`
  // would otherwise show as live-looking toggles that silently do nothing
  // (confirmed live, user-reported). Dashed out here rather than left
  // misleadingly interactive.
  argTypes: { disablePortal: { control: false }, asChild: { control: false } },
  render: () => (
    <div style={boxStyle}>
      <p style={{ margin: 0 }}>
        This box is the local render tree. Open devtools and inspect the badge in the
        bottom-right corner — it&apos;s rendered at the end of <code>&lt;body&gt;</code>, not
        nested inside this box, even though it&apos;s declared here in JSX.
      </p>
      <Portal>
        <div
          style={{
            background: "var(--dbm-bg-brand)",
            borderRadius: "var(--dbm-radius-md)",
            bottom: "var(--dbm-space-4)",
            color: "var(--dbm-text-on-brand)",
            padding: "var(--dbm-space-3)",
            position: "fixed",
            right: "var(--dbm-space-4)",
          }}
        >
          Portaled content
        </div>
      </Portal>
    </div>
  ),
};

export const CustomContainer: Story = {
  name: "Custom container target",
  parameters: { docs: { source: { code: portalSnippets.customContainer } } },
  // A real, confirmed bug (found during this component's own review pass):
  // the original version of this story read `document.getElementById` for
  // a sibling <div> directly during render — but that sibling hasn't
  // committed to the real DOM yet at the moment render runs (React
  // computes the whole tree before committing any of it), so the lookup
  // always returned null and nothing ever triggered a re-render afterward.
  // The target box silently stayed empty forever, reproduced on both the
  // standalone story and the Docs page. Fixed with a ref callback instead
  // of an effect-based re-check — the canonical, lint-clean way to capture
  // a DOM node into state the moment it mounts (this repo's own
  // `react-hooks/set-state-in-effect` rule flags calling `setState`
  // directly inside a `useEffect`; a ref callback isn't an effect at all,
  // so it isn't subject to that rule, and fires earlier/more reliably —
  // during commit, not a separate post-commit pass).
  // Fixed render — doesn't read `args`; see Default's own comment above.
  argTypes: { disablePortal: { control: false }, asChild: { control: false } },
  render: function CustomContainerStory() {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    return (
      <div style={boxStyle}>
        <p style={{ marginTop: 0 }}>
          The badge below is portaled into the target box beneath it via the{" "}
          <code>container</code> prop, instead of <code>document.body</code>.
        </p>
        <div
          ref={setContainer}
          style={{
            border: "var(--dbm-border-width-1) solid var(--dbm-border-neutral)",
            borderRadius: "var(--dbm-radius-md)",
            minHeight: "var(--dbm-space-12)",
            padding: "var(--dbm-space-3)",
          }}
        />
        {container && (
          <Portal container={container}>
            <span style={badgeStyle}>Portaled into custom container</span>
          </Portal>
        )}
      </div>
    );
  },
};

export const DisabledPortal: Story = {
  name: "disablePortal (renders in place)",
  parameters: { docs: { source: { code: portalSnippets.disabledPortal } } },
  // Fixed render — doesn't read `args`; see Default's own comment above.
  argTypes: { disablePortal: { control: false }, asChild: { control: false } },
  render: () => (
    <div style={boxStyle}>
      <p style={{ marginTop: 0 }}>
        With <code>disablePortal</code>, the badge below renders exactly where it&apos;s declared
        in JSX — no portal, no wrapper element.
      </p>
      <Portal disablePortal>
        <div style={badgeStyle}>Not portaled — rendered in place</div>
      </Portal>
    </div>
  ),
};

export const AsChild: Story = {
  name: "asChild (no wrapper div)",
  // Fixed render — doesn't read `args`; see Default's own comment above.
  argTypes: { disablePortal: { control: false }, asChild: { control: false } },
  render: () => (
    <div style={boxStyle}>
      <p style={{ margin: 0 }}>
        With <code>asChild</code>, the badge below is portaled as itself — inspect devtools and
        you&apos;ll find a single <code>&lt;span&gt;</code> at the end of <code>&lt;body&gt;</code>
        , not a <code>&lt;span&gt;</code> nested inside an extra portal <code>&lt;div&gt;</code>.
      </p>
      {/* Positioned at the top-right, not bottom-right like Default's own
          fixed badge — both stories' Canvases can be mounted simultaneously
          on the Docs page (found during this component's own review pass:
          sharing the same fixed corner meant only the later-mounted one
          was ever visible, silently hiding the other entirely). */}
      <Portal asChild>
        <span
          style={{
            background: "var(--dbm-bg-brand)",
            borderRadius: "var(--dbm-radius-md)",
            color: "var(--dbm-text-on-brand)",
            padding: "var(--dbm-space-3)",
            position: "fixed",
            right: "var(--dbm-space-4)",
            top: "var(--dbm-space-4)",
          }}
        >
          Portaled as itself (asChild)
        </span>
      </Portal>
    </div>
  ),
};
