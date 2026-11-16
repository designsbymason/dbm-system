import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Text } from "../Text";
import { BackToTop } from "./BackToTop";
import { backToTopPlaygroundSnippet, backToTopSnippets } from "./BackToTop.snippets";
import type { BackToTopProps } from "./BackToTop.types";

const meta: Meta<typeof BackToTop> = {
  title: "Components/BackToTop",
  id: "atoms-navigation-backtotop",
  component: BackToTop,
  // BackToTop only makes sense against real scroll space — every story
  // here needs its own tall/scrollable canvas, so fullscreen (rather than
  // the usual "padded") applies to the whole file, not just individual
  // demos (same reasoning Affix's own stories file gives for the same
  // parameter).
  parameters: { layout: "fullscreen" },
  // Ordered to match BackToTopProps' own declaration order (size, variant,
  // threshold, label, then the shared escape-hatch props last) — same
  // sequencing principle the future Properties table will use
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The underlying IconButton's size.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The underlying IconButton's visual style.",
    },
    threshold: {
      control: { type: "number", min: 0 },
      description:
        "Vertical scroll distance (px) past which the button becomes visible and focusable.",
    },
    // A React ref has no meaningful Controls-panel representation — see
    // the dedicated `WithinScrollContainer` story for a live demo instead
    // (same reasoning Affix's own `scrollContainerRef` control gives).
    scrollContainerRef: {
      control: false,
      description:
        'The scrollable container to watch and scroll, if not the page/viewport itself. Demo via the "Within a scroll container" story below.',
    },
    label: {
      control: "text",
      description: "Accessible label.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four.
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this button, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // number"/"Set string" placeholder instead of a live, interactive control
  // (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    size: "md",
    variant: "primary",
    threshold: 400,
    label: "Back to top",
  },
};

export default meta;

type Story = StoryObj<typeof BackToTop>;

/**
 * A confined, scrollable demo box rather than real page/`window` scroll —
 * deliberate, not just a style choice. `Playground` and `Visible` both get
 * embedded live in the Docs page (`BackToTop.mdx`), where every story's
 * Canvas shares one real underlying document; a demo that relies on
 * `window.scrollY`/`window.scrollTo` there would stretch the entire Docs
 * page to the demo's own content height and, when clicked, scroll the
 * *whole Docs page* back to its own top — not a contained effect at all
 * (found via direct user report). Using `scrollContainerRef` here (the
 * same technique `WithinScrollContainer` below already uses for a
 * different reason) makes both stories self-contained regardless of
 * whether they're viewed standalone or embedded — the box stays a fixed,
 * short height, and clicking only resets the box's own scroll.
 */
function BoundedScrollDemo(args: BackToTopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ padding: "var(--dbm-space-6)" }}>
      <div
        ref={containerRef}
        role="region"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-focusable/scrollable per WCAG 2.1.1 (axe's own scrollable-region-focusable rule requires exactly this pattern); jsx-a11y's rule doesn't special-case role="region" for it.
        tabIndex={0}
        aria-label="Scrollable demo area"
        style={{
          height: "20rem",
          overflow: "auto",
          border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-md)",
          padding: "0 var(--dbm-space-4)",
        }}
      >
        {Array.from({ length: 40 }, (_, i) => (
          <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
            Scroll down to reveal the back-to-top button. Line {i + 1}.
          </Text>
        ))}
      </div>
      <BackToTop {...args} scrollContainerRef={containerRef} />
    </div>
  );
}

/**
 * Drive every prop live via the Controls panel below; scroll the boxed
 * demo area down past `threshold` to reveal the button.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => backToTopPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => <BoundedScrollDemo {...args} />,
};

export const Visible: Story = {
  name: "Visible state (no scrolling needed)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => backToTopPlaygroundSnippet(context.args),
      },
    },
  },
  // A negative threshold means the demo box's own `scrollTop > threshold`
  // is already true before any scrolling — the only way to show this
  // component's own "on" state as a static reference without requiring a
  // real scroll gesture in the rendered Canvas.
  args: { threshold: -1 },
  render: (args) => <BoundedScrollDemo {...args} />,
};

export const ScrollInteraction: Story = {
  name: "Interaction: appears on scroll, scrolls back to top on click",
  // Deliberately real `window` scroll, not `BoundedScrollDemo`'s confined
  // box above — this story is only ever reached via the sidebar/
  // Interactions tab, never embedded in the Docs page, so it's the right
  // place to verify the actual default (page-level) behavior end to end.
  args: { threshold: 400 },
  render: (args) => (
    <div>
      <div style={{ padding: "var(--dbm-space-6)" }}>
        {Array.from({ length: 40 }, (_, i) => (
          <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
            Scroll down to reveal the back-to-top button. Line {i + 1}.
          </Text>
        ))}
      </div>
      <BackToTop {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { hidden: true });

    await expect(button).toHaveAttribute("aria-hidden", "true");
    await expect(button).toHaveAttribute("tabIndex", "-1");

    // Scrolling the real page — this runs in the Chromium-backed
    // `test:storybook` runner, not jsdom, so this is a genuine scroll
    // event, not a stubbed one (same reasoning Affix's own play functions
    // give for the same call).
    window.scrollTo({ top: 800 });

    await waitFor(() => {
      expect(button).not.toHaveAttribute("aria-hidden");
    });
    await expect(button).not.toHaveAttribute("tabIndex", "-1");

    await userEvent.click(button);

    await waitFor(() => {
      expect(window.scrollY).toBe(0);
    });
    await waitFor(() => {
      expect(button).toHaveAttribute("aria-hidden", "true");
    });
  },
};

export const WithinScrollContainer: Story = {
  name: "Within a scroll container (scrollContainerRef)",
  parameters: { docs: { source: { code: backToTopSnippets.withinScrollContainer } } },
  // `scrollContainerRef` is the one thing this story exists to demonstrate
  // — exploring size/variant/threshold/label combinations is `Playground`'s
  // job, not this one's (same reasoning Affix's own equivalent story
  // gives for disabling its own non-`scrollContainerRef` controls here).
  argTypes: {
    size: { control: false },
    variant: { control: false },
    threshold: { control: false },
    label: { control: false },
  },
  args: { threshold: 200 },
  render: function WithinScrollContainerStory(args) {
    const containerRef = useRef<HTMLDivElement>(null);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <Text style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
          A dashboard-panel-style scrollable container, not the page itself —
          scroll inside the box below. The button still floats in the
          viewport&apos;s own fixed corner (its position is never relative to
          the container it watches), but clicking it scrolls the panel, not
          the page.
        </Text>
        <div
          ref={containerRef}
          data-testid="scroll-panel"
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-focusable/scrollable per WCAG 2.1.1 (axe's own scrollable-region-focusable rule requires exactly this pattern); jsx-a11y's rule doesn't special-case role="region" for it.
          tabIndex={0}
          aria-label="Scrollable demo panel"
          style={{
            height: "20rem",
            overflow: "auto",
            border:
              "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            borderRadius: "var(--dbm-radius-md)",
          }}
        >
          {Array.from({ length: 20 }, (_, i) => (
            <Text
              key={i}
              style={{
                padding: "0 var(--dbm-space-4)",
                marginBlockEnd: "var(--dbm-space-4)",
              }}
            >
              Scroll the panel, not the page. Line {i + 1}.
            </Text>
          ))}
        </div>
        <BackToTop {...args} scrollContainerRef={containerRef} />
      </div>
    );
  },
};
