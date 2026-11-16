import { CheckCircleIcon, UserIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "../Card";
import { Heading } from "../../atoms/Heading";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { DescriptionList } from "./DescriptionList";
import { descriptionListPlaygroundSnippet, descriptionListSnippets } from "./DescriptionList.snippets";
import type { DescriptionListSize } from "./DescriptionList.types";

// DescriptionList.Term has no icon slot of its own (`children: ReactNode`
// accepts anything) — a consumer composes one inline. `inline-flex`, not
// Link's own plain-inline-SVG-plus-`vertical-align` technique: found live,
// user-reported — Chromium allows a line-break immediately after an atomic
// inline-level box (an SVG) even with *zero* literal whitespace next to it
// (confirmed directly: the icon and "Customer" had no whitespace text node
// between them in the rendered DOM and it still wrapped, the icon landing
// alone on its own line, once the term column narrowed enough). Link's own
// icon never hits this because it trails the text rather than sitting
// between the text and a hard column-width cap the way a term's does.
// `inline-flex` sidesteps it entirely: flex children never wrap between
// each other the way inline text-flow content can, so the icon and word
// stay one atomic unit regardless of how narrow the term column gets —
// verified live (dt height back to a single line, full icon+text width
// accommodated) before adopting this over the vertical-align approach.
const termIconWrapperStyle = {
  alignItems: "center",
  display: "inline-flex",
  gap: "var(--dbm-space-1)",
} as const;

// A term's icon has no built-in coupling to the list's own `size` (there's
// no icon slot for DescriptionList to own that sizing decision) — found
// live, checking every size step per 06-engineering-standards.md §9's own
// "look at it with realistic content at every size" item: a hardcoded
// icon size left over at the smallest/largest steps, most visibly a "sm"
// icon reading as undersized next to "xl" text. Scaling the demo's own
// icon with the control makes the example itself read as deliberately
// sized at every step, without implying the component does this scaling
// on the consumer's behalf — it's still the consumer's own icon, sized by
// hand to fit, same as this mapping does.
const iconSizeForListSize: Record<DescriptionListSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

// Matches Table's/Card's own established "constrain the demo width"
// convention — an unbounded description list stretched across the full
// padded canvas doesn't read like a realistic details panel.
const demoContainerStyle = {
  maxWidth: "28rem",
  marginInline: "auto",
} as const;

const meta: Meta<typeof DescriptionList> = {
  title: "Components/DescriptionList",
  id: "molecules-data-display-descriptionlist",
  component: DescriptionList,
  parameters: { layout: "padded" },
  // Ordered to match DescriptionListProps' own declaration order (children,
  // variant, size, orientation, columns, alignedDetails, aria-*,
  // id/className/style/data-testid) — same sequencing principle as every
  // other component's stories file (07-storybook-and-documentation-
  // standards.md §4 item 3), and the same relative order Card's/Table's own
  // root props use for this exact tail (aria-* before id/className/style/
  // data-testid).
  argTypes: {
    children: {
      control: false,
      description: "One or more DescriptionList.Item elements.",
    },
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description: "The list's own visual treatment.",
      table: { defaultValue: { summary: "bordered" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and typography for every item, term, and details.",
      table: { defaultValue: { summary: "md" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "How every item's term and details relate to one another.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    columns: {
      control: "number",
      description: "Lays items out in a grid of this many columns.",
      table: { defaultValue: { summary: "1" } },
    },
    alignedDetails: {
      description: "Sizes every term to the width of the widest one, so every details value starts at the same position.",
      table: { defaultValue: { summary: "true" } },
    },
    // Never visibly rendered (only exposed to the accessibility tree), so
    // there's nothing in the canvas for a live control to demonstrate —
    // the same reasoning Table's/Card's own identical aria-label argType
    // already uses.
    "aria-label": { control: false, description: "An accessible name for the list." },
    "aria-labelledby": { control: false, description: "The id of an element that names this list." },
    "aria-describedby": { control: false, description: "The id of an element that describes this list." },
    id: { control: false, description: "Standard DOM id, applied to the <dl>." },
    className: { control: false, description: "Additional CSS classes for the <dl>." },
    style: { control: false, description: "Inline styles for the <dl>." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    variant: "bordered",
    size: "md",
    orientation: "horizontal",
    columns: 1,
    alignedDetails: true,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <DescriptionList {...args}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Email</DescriptionList.Term>
          <DescriptionList.Details>jane.cooper@example.com</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof DescriptionList>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => descriptionListPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "Bordered vs. ghost",
  parameters: { docs: { source: { code: descriptionListSnippets.variants } } },
  argTypes: { variant: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} variant="bordered">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} variant="ghost">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const Orientation: Story = {
  name: "Horizontal vs. vertical orientation",
  parameters: { docs: { source: { code: descriptionListSnippets.orientation } } },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} orientation="horizontal">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} orientation="vertical">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const AlignedTerms: Story = {
  name: "Aligned vs. per-item term widths",
  parameters: { docs: { source: { code: descriptionListSnippets.alignedDetails } } },
  argTypes: { alignedDetails: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} alignedDetails>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} alignedDetails={false}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const IconPrefixedTerm: Story = {
  name: "A term with a leading icon",
  parameters: { docs: { source: { code: descriptionListSnippets.iconPrefixedTerm } } },
  render: (args) => {
    const iconSize = iconSizeForListSize[(args.size as DescriptionListSize | undefined) ?? "md"];
    return (
      <div style={demoContainerStyle}>
        <DescriptionList {...args}>
          <DescriptionList.Item>
            <DescriptionList.Term>
              <span style={termIconWrapperStyle}>
                <Icon icon={UserIcon} size={iconSize} />
                Customer
              </span>
            </DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Email</DescriptionList.Term>
            <DescriptionList.Details>jane.cooper@example.com</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>
              <span style={termIconWrapperStyle}>
                <Icon icon={CheckCircleIcon} size={iconSize} tone="success" />
                Status
              </span>
            </DescriptionList.Term>
            <DescriptionList.Details>Paid</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
    );
  },
};

export const Sizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: descriptionListSnippets.sizes } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DescriptionList {...args} key={size} size={size}>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      ))}
    </div>
  ),
};

export const Columns: Story = {
  name: "Multi-column layout, with a spanning item",
  parameters: { docs: { source: { code: descriptionListSnippets.columns } } },
  argTypes: { columns: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem", marginInline: "auto" }}>
      <DescriptionList {...args} columns={{ base: 1, md: 3 }}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Total</DescriptionList.Term>
          <DescriptionList.Details numeric>$1,234.00</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item span={3}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>Leave the package with the front desk.</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const InACard: Story = {
  name: "Embedded in a Card (ghost variant)",
  parameters: { docs: { source: { code: descriptionListSnippets.inCard } } },
  argTypes: {
    variant: { control: false },
    size: { control: false },
    orientation: { control: false },
    columns: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Card>
        <Card.Header>
          <Heading level={3} size="lg">
            Order #1024
          </Heading>
        </Card.Header>
        <Card.Body>
          <DescriptionList variant="ghost">
            <DescriptionList.Item>
              <DescriptionList.Term>Customer</DescriptionList.Term>
              <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
            </DescriptionList.Item>
            <DescriptionList.Item>
              <DescriptionList.Term>Status</DescriptionList.Term>
              <DescriptionList.Details>Paid</DescriptionList.Details>
            </DescriptionList.Item>
          </DescriptionList>
        </Card.Body>
      </Card>
    </div>
  ),
};

// Real-browser-only checks — what jsdom can't evaluate (real grid layout, a
// container-width-driven flex-wrap). Hidden from the sidebar/Docs page
// (`!dev`); still runs as a test via @storybook/addon-vitest's Chromium
// project. See 06-engineering-standards.md §9's "What jsdom can't evaluate"
// checklist item.
export const ResponsiveLayoutChecks: Story = {
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="wide" style={{ inlineSize: "32rem" }}>
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      {/* alignedDetails={false}: this story is specifically about the flex-wrap
        degrade, which only applies once alignment's fixed 2-column grid is
        opted out of (alignedDetails's own default is true). */}
      <div data-testid="narrow" style={{ inlineSize: "8rem" }}>
        <DescriptionList alignedDetails={false}>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd, Allentown</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="three-col" style={{ inlineSize: "36rem" }}>
        <DescriptionList columns={3}>
          <DescriptionList.Item>
            <DescriptionList.Term>A</DescriptionList.Term>
            <DescriptionList.Details>1</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>B</DescriptionList.Term>
            <DescriptionList.Details>2</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>C</DescriptionList.Term>
            <DescriptionList.Details>3</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A wide item lays term and details on the same row (horizontal, the
    // default) — their boxes overlap vertically.
    const wideTerm = canvas.getByText("Customer");
    const wideDetails = canvas.getByText("Jane Cooper");
    const wideTermBox = wideTerm.getBoundingClientRect();
    const wideDetailsBox = wideDetails.getBoundingClientRect();
    await expect(wideTermBox.top).toBeLessThan(wideDetailsBox.bottom);
    await expect(wideDetailsBox.top).toBeLessThan(wideTermBox.bottom);

    // A narrow item can't fit both side by side — the details wraps onto
    // its own line below the term, with no responsive prop configured at
    // all (purely a consequence of the item's own container width).
    const narrowTerm = canvas.getByText("Shipping address");
    const narrowDetails = canvas.getByText("4140 Parker Rd, Allentown");
    const narrowTermBox = narrowTerm.getBoundingClientRect();
    const narrowDetailsBox = narrowDetails.getBoundingClientRect();
    await expect(narrowDetailsBox.top).toBeGreaterThanOrEqual(narrowTermBox.bottom);

    // columns={3} really renders three grid tracks.
    const threeColList = canvasElement.querySelector('[data-testid="three-col"] dl') as HTMLElement;
    const trackCount = getComputedStyle(threeColList).gridTemplateColumns.trim().split(/\s+/).length;
    await expect(trackCount).toBe(3);
  },
};

// alignedDetails's own real-browser checks — real term-width alignment (a
// layout computation jsdom can't evaluate) and confirming `display: contents`
// doesn't drop anything from the accessibility tree. Hidden (`!dev`).
export const AlignedTermsChecks: Story = {
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="aligned" style={{ inlineSize: "24rem" }}>
        <DescriptionList alignedDetails>
          <DescriptionList.Item>
            <DescriptionList.Term>ID</DescriptionList.Term>
            <DescriptionList.Details>1024</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="not-aligned" style={{ inlineSize: "24rem" }}>
        <DescriptionList alignedDetails={false}>
          <DescriptionList.Item>
            <DescriptionList.Term>ID</DescriptionList.Term>
            <DescriptionList.Details>1024</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      {/* A wide container with only short terms — the exact shape that
        exposed the "Maximize Tracks" bug: a plain percentage growth limit
        grows toward it using the container's free space even when no term
        needs it, unlike fit-content(). */}
      <div data-testid="wide-short-terms" style={{ inlineSize: "48rem" }}>
        <DescriptionList alignedDetails>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Email</DescriptionList.Term>
            <DescriptionList.Details>jane.cooper@example.com</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Status</DescriptionList.Term>
            <DescriptionList.Details>Paid</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      {/* A narrow container, matching the width a Docs-page embed actually
        renders at — found live, user-reported: even with zero literal
        whitespace between the icon and "Customer" (confirmed directly in
        the rendered DOM), Chromium still allowed a line-break right after
        the icon at this width — an atomic inline-level box (an SVG) gets an
        implicit break opportunity independent of whitespace. The icon
        landed alone on its own line, with the details value reading as if
        wedged between the icon and the label. `termIconWrapperStyle`'s own
        `inline-flex` (this story's `IconPrefixedTerm`) is what actually
        fixes it — flex children never wrap between each other the way
        inline text-flow content can. */}
      <div data-testid="narrow-icon-term" style={{ inlineSize: "13rem" }}>
        <DescriptionList alignedDetails>
          <DescriptionList.Item>
            <DescriptionList.Term>
              <span style={termIconWrapperStyle}>
                <Icon icon={UserIcon} size="sm" />
                Customer
              </span>
            </DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      {/* A comfortably wide container (nothing wraps) with an icon-prefixed
        term next to a plain-text details value, and a second, plain-text-only
        row right after it — found live, user-reported, from a screenshot: an
        icon-prefixed term's line is taller than a plain-text details value's,
        and align-items: baseline positioned each by its own text baseline
        rather than its box, leaving "Jane Cooper" visually off-center against
        "Customer" and the divider below "Email" a few pixels higher on the
        term side than the details side. */}
      <div data-testid="icon-row-alignment" style={{ inlineSize: "24rem" }}>
        <DescriptionList alignedDetails>
          <DescriptionList.Item>
            <DescriptionList.Term>
              <span style={termIconWrapperStyle}>
                <Icon icon={UserIcon} size="sm" />
                Customer
              </span>
            </DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Email</DescriptionList.Term>
            <DescriptionList.Details>jane.cooper@example.com</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const aligned = canvasElement.querySelector('[data-testid="aligned"]') as HTMLElement;
    const shortTerm = within(aligned).getByText("ID");
    const longTerm = within(aligned).getByText("Shipping address");
    const shortDetails = within(aligned).getByText("1024");
    const longDetails = within(aligned).getByText("4140 Parker Rd");

    // Both terms occupy the same-width shared grid column …
    await expect(shortTerm.getBoundingClientRect().width).toBeCloseTo(
      longTerm.getBoundingClientRect().width,
      0,
    );
    // … so both details values start at the same inline position.
    await expect(shortDetails.getBoundingClientRect().left).toBeCloseTo(
      longDetails.getBoundingClientRect().left,
      0,
    );

    // Regression guard: the term's own box must reach exactly where the
    // details' box begins — zero true gap between them (the visual space
    // between the *text* lives inside the term's own trailing padding, not
    // a grid column-gap; see `.alignedDetails`'s own CSS comment for why a
    // real gap breaks the divider into two segments). Found live twice: a
    // leftover flex-mode `max-inline-size: 40%` first shrank the term to a
    // fraction of its track (a ~90px gap), and even once that was fixed a
    // real `column-gap` still left a ~16px gap the divider border couldn't
    // cross — both are why this asserts an exact match, not just "small".
    await expect(shortDetails.getBoundingClientRect().left).toBeCloseTo(
      shortTerm.getBoundingClientRect().right,
      0,
    );

    // Regression guard: the term column must hug its widest term's own
    // content, not balloon toward the grid's own free space — a plain
    // percentage (`minmax(auto, 40%)`) is a definite growth *limit* CSS
    // Grid's "Maximize Tracks" step actively grows into using the
    // container's free space regardless of whether content needs it
    // (`fit-content(40%)` is the fix: it caps growth without reaching for
    // it). Found live, user-reported: three short terms ("Customer",
    // "Email", "Status") in a 768px-wide list still measured a term column
    // near 40% of the container (~300px) before this fix. 200px is a
    // generous ceiling for "Customer" (the widest of the three) plus its
    // own padding at this story's font size, and a small fraction of the
    // 768px container's own 40% (~307px) — this fails loudly if the column
    // ever again tracks the container's width instead of its content.
    const wideShortTerms = canvasElement.querySelector('[data-testid="wide-short-terms"]') as HTMLElement;
    const wideCustomerTerm = within(wideShortTerms).getByText("Customer");
    await expect(wideCustomerTerm.getBoundingClientRect().width).toBeLessThan(200);

    // Regression guard: an icon and the word right after it must stay on
    // the same line, even in a narrow term column — found live,
    // user-reported, twice: first with the icon and text on separate JSX
    // lines (a real inserted space gave the browser a break point there),
    // and again even after removing that space entirely, because an atomic
    // inline-level box (an SVG) gets an implicit break opportunity right
    // after it independent of whitespace. `termIconWrapperStyle`'s
    // `inline-flex` is what actually holds. Measures the icon's own box
    // against a Range over just the text node (not the whole term, which —
    // per this system's own "measure the content, not the box" rule —
    // would still report matching left edges even if the text wrapped
    // below, since a block-level box always spans the full column width
    // regardless of where its content actually sits).
    const narrowIconTerm = canvasElement.querySelector('[data-testid="narrow-icon-term"]') as HTMLElement;
    const iconRect = (narrowIconTerm.querySelector("dt svg") as SVGElement).getBoundingClientRect();
    const textNode = [...(narrowIconTerm.querySelector("dt span") as HTMLElement).childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    ) as Text;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const textRect = range.getBoundingClientRect();
    await expect(Math.abs(iconRect.top - textRect.top)).toBeLessThan(10);

    // Regression guard: a term's own box (icon-prefixed, so genuinely taller
    // than a plain-text line) and its details' box must occupy exactly the
    // same vertical span — found live, user-reported, from a screenshot:
    // align-items: baseline positioned "Jane Cooper" by its own text
    // baseline rather than its box, leaving it visibly off-center against
    // the taller icon-prefixed "Customer" term, and it broke the divider
    // below "Email" into two segments at different heights for the same
    // underlying reason (each side's border is drawn on its own box, and the
    // two boxes no longer shared a top edge). align-items: stretch (on the
    // shared grid) is what guarantees the two boxes always match, however
    // tall either side's own content is; asserting a `toBe`, not just
    // "close", since this one has no legitimate reason ever to differ.
    const iconRow = canvasElement.querySelector('[data-testid="icon-row-alignment"]') as HTMLElement;
    const iconRowDt = iconRow.querySelector("dt") as HTMLElement;
    const iconRowDd = iconRow.querySelector("dd") as HTMLElement;
    await expect(iconRowDt.getBoundingClientRect().top).toBe(iconRowDd.getBoundingClientRect().top);
    await expect(iconRowDt.getBoundingClientRect().bottom).toBe(iconRowDd.getBoundingClientRect().bottom);

    // And the icon/term-text/details-text centers must all land at the same
    // Y position — the box-level check above can't tell an off-center glyph
    // from a truly centered one, since both terms/details still stretch to
    // the same *box*; this measures the actual rendered content instead.
    const iconEl = iconRowDt.querySelector("svg") as SVGElement;
    const termText = [...(iconRowDt.querySelector("span") as HTMLElement).childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    ) as Text;
    const termTextRange = document.createRange();
    termTextRange.selectNodeContents(termText);
    const detailsRange = document.createRange();
    detailsRange.selectNodeContents(iconRowDd);
    const iconCenter = iconEl.getBoundingClientRect().top + iconEl.getBoundingClientRect().height / 2;
    const termTextCenter =
      termTextRange.getBoundingClientRect().top + termTextRange.getBoundingClientRect().height / 2;
    const detailsCenter =
      detailsRange.getBoundingClientRect().top + detailsRange.getBoundingClientRect().height / 2;
    await expect(Math.abs(iconCenter - termTextCenter)).toBeLessThan(2);
    await expect(Math.abs(termTextCenter - detailsCenter)).toBeLessThan(2);

    // The opt-out renders the original per-item behavior: the short term's
    // own box is genuinely narrower than the long one's (each hugs its own
    // content), so the two details values start at different positions.
    const notAligned = canvasElement.querySelector('[data-testid="not-aligned"]') as HTMLElement;
    const shortTermOptOut = within(notAligned).getByText("ID");
    const longTermOptOut = within(notAligned).getByText("Shipping address");
    await expect(shortTermOptOut.getBoundingClientRect().width).toBeLessThan(
      longTermOptOut.getBoundingClientRect().width,
    );

    // `display: contents` on Item must not drop the term/details from the
    // accessibility tree — both still resolve to a real accessible role.
    await expect(shortTerm.closest("dt")).not.toBeNull();
    await expect(shortDetails.closest("dd")).not.toBeNull();
  },
};

// Right-to-left checks — every directional value in this component's own
// CSS is a logical property (padding-inline, border-block-start, grid's own
// inline axis), so RTL is expected to "just work" via the browser's native
// bidi handling with no dir prop of this component's own (unlike a
// Radix-wrapping component, which needs an explicit dir passed to the
// primitive) — but per this system's own hard-won rule, that's exactly the
// kind of assumption that needs a real-browser measurement, not a read of
// the CSS: `RangeSlider`'s min/max labels came out backwards under this
// same "logical properties should just handle it" assumption. jsdom lays
// out no text and can't evaluate `dir` at all, so this only exists as a
// real-browser story. Hidden (`!dev`).
export const RightToLeftChecks: Story = {
  tags: ["!dev"],
  render: () => (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="rtl-horizontal" style={{ inlineSize: "24rem" }}>
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="rtl-icon" style={{ inlineSize: "24rem" }}>
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Term>
              <span style={termIconWrapperStyle}>
                <Icon icon={UserIcon} size="sm" />
                Customer
              </span>
            </DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="rtl-columns" style={{ inlineSize: "36rem" }}>
        <DescriptionList columns={3}>
          <DescriptionList.Item>
            <DescriptionList.Term>A</DescriptionList.Term>
            <DescriptionList.Details>1</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>B</DescriptionList.Term>
            <DescriptionList.Details>2</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>C</DescriptionList.Term>
            <DescriptionList.Details>3</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Horizontal orientation: the term sits on the *end* side (visually the
    // right, under RTL) and the details on the *start* side (visually the
    // left) — the mirror of the LTR case, confirming padding-inline/the
    // grid's own logical inline axis actually flipped, not just that
    // nothing crashed.
    const horizontal = canvasElement.querySelector('[data-testid="rtl-horizontal"]') as HTMLElement;
    const rtlTerm = within(horizontal).getByText("Customer");
    const rtlDetails = within(horizontal).getByText("Jane Cooper");
    await expect(rtlTerm.getBoundingClientRect().left).toBeGreaterThan(
      rtlDetails.getBoundingClientRect().left,
    );

    // The icon stays on the *start* side of its own term text (immediately
    // before "Customer" in reading order) — visually to the right of the
    // text under RTL, not stranded on the opposite side from a hardcoded
    // physical margin.
    const iconRow = canvasElement.querySelector('[data-testid="rtl-icon"]') as HTMLElement;
    const iconEl = iconRow.querySelector("dt svg") as SVGElement;
    const iconTerm = within(iconRow).getByText("Customer");
    await expect(iconEl.getBoundingClientRect().left).toBeGreaterThan(
      iconTerm.getBoundingClientRect().left,
    );

    // columns={3}: item "A" is the first in reading order, so under RTL it
    // renders as the *rightmost* of the three columns, not the leftmost.
    const columnsRow = canvasElement.querySelector('[data-testid="rtl-columns"]') as HTMLElement;
    const termA = within(columnsRow).getByText("A");
    const termC = within(columnsRow).getByText("C");
    await expect(termA.getBoundingClientRect().left).toBeGreaterThan(
      termC.getBoundingClientRect().left,
    );
  },
};
