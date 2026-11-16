import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Table } from "../Table";
import { Card } from "./Card";
import { cardPlaygroundSnippet, cardSnippets } from "./Card.snippets";
import type {
  CardFooterAlign,
  CardMediaPosition,
  CardOrientation,
  CardProps,
  CardSize,
  CardTone,
  CardVariant,
} from "./Card.types";

// `Card`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Accordion`'s and
// `Table`'s own approach. `Card.Media`/`Header`/`Body`/`Footer` each get their
// own Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: CardVariant;
  tone: CardTone;
  size: CardSize;
  media: boolean;
  orientation: CardOrientation;
  mediaPosition: CardMediaPosition;
  divided: boolean;
  interactive: boolean;
  disabled: boolean;
  asChild: boolean;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allTones: CardTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];
const allVariants: CardVariant[] = ["outlined", "elevated", "filled", "ghost"];
const allSizes: CardSize[] = ["xs", "sm", "md", "lg", "xl"];

// A story-layout wrapper — a plain CSS grid, not the `Grid` molecule, so these
// demos don't depend on `Grid`'s own API.
const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;

// The standard demo content: a header with a title and a status badge, a body,
// and a footer of two actions.
const DemoSections = ({ title = "Team plan", body = "Up to 10 members and unlimited projects.", footer = true }: {
  title?: string;
  body?: ReactNode;
  footer?: boolean;
}) => (
  <>
    <Card.Header>
      <Heading level={3} size="md">
        {title}
      </Heading>
      <Badge tone="success" size="sm">
        Active
      </Badge>
    </Card.Header>
    <Card.Body>
      <Text size="sm" color="secondary">
        {body}
      </Text>
    </Card.Body>
    {footer && (
      <Card.Footer>
        <Button variant="tertiary" size="sm">
          Cancel
        </Button>
        <Button size="sm">Manage</Button>
      </Card.Footer>
    )}
  </>
);

const DemoCard = ({ children, ...props }: Partial<CardProps>) => (
  <Card {...props}>{children ?? <DemoSections />}</Card>
);

// A gradient of design tokens standing in for a real image. One element that
// works in every orientation: stacked, its `aspect-ratio` gives it a 16:9 shape
// (the `100%` height has nothing to resolve against, so it's ignored); beside the
// content, the media has a definite height, so it fills it.
const DemoMedia = () => (
  <Card.Media>
    <div
      style={{
        aspectRatio: "16 / 9",
        background: "linear-gradient(135deg, var(--dbm-bg-brand), var(--dbm-bg-info))",
        height: "100%",
        width: "100%",
      }}
    />
  </Card.Media>
);

// Every fixed-render story below ignores the Playground's own `args`, so each
// one suppresses every root-prop control it doesn't consume (a story-level
// `argTypes` entry merges over the meta-level one per key) — otherwise the
// Controls panel would show live-looking toggles that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  media: { control: false },
  orientation: { control: false },
  mediaPosition: { control: false },
  divided: { control: false },
  interactive: { control: false },
  disabled: { control: false },
  asChild: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Card",
  id: "molecules-data-display-card",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["outlined", "elevated", "filled", "ghost"],
      description:
        "The card's surface treatment: outlined (a border on the surface colour), elevated (a soft shadow instead of a border), filled (a subtle neutral fill, no border), or ghost (no surface at all — just the layout, for a card inside a container that already provides its own boundary).",
      table: { defaultValue: { summary: "'outlined'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent. neutral (the default) is uncoloured; every other tone gives the card a border in that colour and a subtle tint behind Card.Header. brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. A ghost card has no border, so a tone only tints its header.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Section padding, and so the card's overall density.",
      table: { defaultValue: { summary: "'md'" } },
    },
    media: {
      control: "boolean",
      description:
        "Storybook only — not a Card prop. Shows a demo Card.Media (a token gradient standing in for an image), so orientation and mediaPosition have something to act on.",
      table: { disable: true },
    },
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal"],
      description:
        "How the sections are arranged: stacked top to bottom, or with Card.Media beside the content (about two fifths of the width). A single value, or a mobile-first responsive map keyed by breakpoint (see the Responsive orientation story). Horizontal needs a Card.Media to have any effect — turn on the media control above.",
      table: { defaultValue: { summary: "'vertical'" } },
    },
    mediaPosition: {
      control: "radio",
      options: ["start", "end"],
      description:
        "Pins Card.Media to the start or the end: the top or bottom of a vertical card, or the inline-start or inline-end side of a horizontal one (mirrored in right-to-left). Unset, the media stays where you placed it among the sections — on the start side of a horizontal card. Visual only: reading and tab order follow the DOM.",
      table: { defaultValue: { summary: "unset" } },
    },
    divided: {
      control: "boolean",
      description:
        "Draws a hairline between adjacent sections (header, body, footer). None against Card.Media, or under a tinted header of a card with a non-neutral tone.",
      table: { defaultValue: { summary: "false" } },
    },
    interactive: {
      control: "boolean",
      description:
        "Styles the card as clickable as a whole — a pointer cursor and hover, focus, and pressed states. Styling only: to make the card genuinely interactive, render it as a link or button with asChild. (In the Playground, turning this on renders the card as a real link.)",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Marks an interactive card as unavailable: dimmed, a not-allowed cursor, no hover or pressed states, and the click is blocked. Sets aria-disabled rather than a native disabled attribute, so a slotted link stays reachable by keyboard. Has no effect without interactive.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: false,
      description:
        "Renders the card's styling onto a single provided child element (via Radix Slot) instead of a <div> — the way to make the card itself a link or a button. The child holds the card's sections.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the card, for when it acts as a labelled region or link and has no visible heading to name it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this card (e.g. its own heading).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this card.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this card, or when a test or router needs a stable anchor.",
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
    variant: "outlined",
    tone: "neutral",
    size: "md",
    media: false,
    orientation: "vertical",
    mediaPosition: "start",
    divided: false,
    interactive: false,
    disabled: false,
  },
  render: (args) => {
    const horizontal = args.media && args.orientation === "horizontal";
    const cardProps = {
      variant: args.variant,
      tone: args.tone,
      size: args.size,
      orientation: args.orientation,
      mediaPosition: args.mediaPosition,
      divided: args.divided,
    };
    return (
      <div style={{ maxWidth: horizontal ? "40rem" : "24rem", marginInline: "auto" }}>
        {args.interactive ? (
          // `interactive` alone is styling only, so the Playground renders the
          // card as a real link when it's on — the supported way to use it.
          <Card asChild interactive disabled={args.disabled} {...cardProps}>
            <a href="#plan" onClick={(event) => event.preventDefault()}>
              {args.media && <DemoMedia />}
              <DemoSections />
            </a>
          </Card>
        ) : (
          <Card {...cardProps}>
            {args.media && <DemoMedia />}
            <DemoSections />
          </Card>
        )}
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Turning `interactive` on renders the card as a real link. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, around a small real card — instead of the story's own source,
  // which is helper components a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => cardPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.variants } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <DemoCard variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.tones } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allTones.map((tone) => (
        <div key={tone} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <DemoCard tone={tone} />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.sizes } } },
  render: () => (
    <div
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
    >
      {allSizes.map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <DemoCard size={size} />
        </div>
      ))}
    </div>
  ),
};

export const WithMedia: Story = {
  name: "With media",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.withMedia } } },
  render: () => (
    // `Card.Media` runs edge to edge (the card has no padding of its own) and is
    // clipped to the rounded corners. A gradient of design tokens stands in for a
    // real image.
    <div style={{ maxWidth: "24rem", marginInline: "auto" }}>
      <Card variant="elevated">
        <DemoMedia />
        <DemoSections title="Mountain retreat" body="Three nights in a quiet valley, with guided hikes and a sauna." />
      </Card>
    </div>
  ),
};

export const InteractiveLink: Story = {
  name: "Interactive — the whole card is a link",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.interactiveLink } } },
  render: () => (
    <div style={{ maxWidth: "24rem", marginInline: "auto" }}>
      <Card asChild interactive variant="elevated">
        <a href="#team-plan" onClick={(event) => event.preventDefault()}>
          <Card.Header>
            <Heading level={3} size="md">
              Team plan
            </Heading>
            <Badge tone="success" size="sm">
              Active
            </Badge>
          </Card.Header>
          <Card.Body>
            <Text size="sm" color="secondary">
              The whole card is one link — hover it, focus it with Tab, press it.
            </Text>
          </Card.Body>
        </a>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /Team plan/ });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    // The focus ring is an outline drawn on the card itself.
    await expect(getComputedStyle(link).outlineStyle).toBe("solid");
    await expect(parseFloat(getComputedStyle(link).outlineWidth)).toBeGreaterThan(0);
  },
};

export const MediaPosition: Story = {
  name: "Media position",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.mediaPosition } } },
  render: () => (
    // `mediaPosition` pins the media to the start or the end of the card: the top
    // or bottom of a vertical one, the inline-start or inline-end side of a
    // horizontal one. In every case the media is first in the DOM — only its
    // position changes.
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }} data-testid="media-position-grid">
      {(["vertical", "horizontal"] as const).flatMap((orientation) =>
        (["start", "end"] as const).map((mediaPosition) => (
          <div
            key={`${orientation}-${mediaPosition}`}
            style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}
          >
            <Text size="sm" weight="semibold">
              {orientation}, mediaPosition=&quot;{mediaPosition}&quot;
            </Text>
            <Card orientation={orientation} mediaPosition={mediaPosition} variant="elevated">
              <DemoMedia />
              <DemoSections title="Mountain retreat" body="Three nights in a quiet valley." />
            </Card>
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=media-position-grid] > div > div:last-child")];
    await expect(cards.length).toBe(4);
    const [verticalStart, verticalEnd, horizontalStart, horizontalEnd] = cards.map((card) => {
      const media = card.firstElementChild as HTMLElement;
      const others = Array.from(card.children).slice(1) as HTMLElement[];
      return { media: media.getBoundingClientRect(), header: others[0]!.getBoundingClientRect(), footer: others.at(-1)!.getBoundingClientRect() };
    });
    // Vertical: above the sections, or below them.
    await expect(verticalStart!.media.bottom).toBeLessThanOrEqual(verticalStart!.header.top + 1);
    await expect(verticalEnd!.media.top).toBeGreaterThanOrEqual(verticalEnd!.footer.bottom - 1);
    // Horizontal: beside them, on the start or the end side.
    await expect(horizontalStart!.media.right).toBeLessThanOrEqual(horizontalStart!.header.left + 1);
    await expect(horizontalEnd!.media.left).toBeGreaterThanOrEqual(horizontalEnd!.header.right - 1);
  },
};

export const Divided: Story = {
  name: "Divided sections",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.divided } } },
  render: () => (
    // A hairline between header, body, and footer. It never sits against
    // `Card.Media`, and a toned card skips the line under its tinted header.
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Text size="sm" weight="semibold">
          divided
        </Text>
        <DemoCard divided />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Text size="sm" weight="semibold">
          divided, tone=&quot;info&quot;
        </Text>
        <DemoCard divided tone="info" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Text size="sm" weight="semibold">
          divided, with media
        </Text>
        <Card divided>
          <DemoMedia />
          <DemoSections />
        </Card>
      </div>
    </div>
  ),
};

export const Horizontal: Story = {
  name: "Horizontal orientation",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.horizontal } } },
  render: () => (
    // `Card.Media` sits beside the content and fills its full height; the body
    // absorbs spare height, so the footer stays at the bottom. `mediaPosition`
    // picks the side.
    <div
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
      data-testid="horizontal-cards"
    >
      <Card orientation="horizontal" variant="elevated">
        <DemoMedia />
        <DemoSections title="Mountain retreat" body="Three nights in a quiet valley, with guided hikes and a sauna." />
      </Card>
      <Card orientation="horizontal" mediaPosition="end" variant="elevated">
        <DemoMedia />
        <DemoSections title="Media on the end" body="mediaPosition=&quot;end&quot; puts the media on the inline-end side." />
      </Card>
      <Card orientation="horizontal" size="sm" divided>
        <DemoMedia />
        <DemoSections
          title="Compact, divided"
          body="A smaller card with a hairline between each of its sections, beside the media."
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=horizontal-cards] > div")];
    await expect(cards.length).toBe(3);
    const mediaOnEnd = [false, true, false];
    for (const [index, card] of cards.entries()) {
      const media = card.firstElementChild as HTMLElement;
      const header = media.nextElementSibling as HTMLElement;
      const mediaRect = media.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      if (mediaOnEnd[index]) {
        // The media is on the inline-end side of the content...
        await expect(mediaRect.left).toBeGreaterThanOrEqual(headerRect.right - 1);
      } else {
        // ...or the inline-start side, and either way beside it, not above it.
        await expect(mediaRect.right).toBeLessThanOrEqual(headerRect.left + 1);
      }
      await expect(Math.abs(mediaRect.top - headerRect.top)).toBeLessThan(2);
      // ...and fills the card's full height (inside its 1px border).
      await expect(Math.abs(mediaRect.height - (cardRect.height - 2))).toBeLessThan(2);
    }
  },
};

export const ResponsiveOrientation: Story = {
  name: "Responsive orientation",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.responsiveOrientation } } },
  render: () => (
    // `orientation` takes a mobile-first map keyed by breakpoint, exactly like
    // `Stack`'s `direction`: stacked below 768px, media beside the content from
    // there. Resize the window to watch it switch. The breakpoints are viewport
    // widths, not the card's own width.
    <div style={demoContainerStyle}>
      <Card orientation={{ base: "vertical", md: "horizontal" }} variant="elevated" data-testid="responsive-card">
        <DemoMedia />
        <DemoSections title="Stacks, then sits beside" body="Vertical below 768px; horizontal from there up." />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>("[data-testid=responsive-card]");
    await expect(card).not.toBeNull();
    const media = card!.firstElementChild as HTMLElement;
    const header = media.nextElementSibling as HTMLElement;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    // Whatever the test viewport is, the card matches the breakpoint it's in.
    await expect(getComputedStyle(card!).display).toBe(wide ? "grid" : "flex");
    const beside = media.getBoundingClientRect().right <= header.getBoundingClientRect().left + 1;
    await expect(beside).toBe(wide);
  },
};

const onActivate = fn((event: MouseEvent) => event.preventDefault());

export const Disabled: Story = {
  name: "Interactive — disabled",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.disabled } } },
  render: () => (
    // `disabled` dims the card, drops its hover and pressed feedback, and blocks
    // the click — but the link keeps its `href` and stays focusable.
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      {[false, true].map((disabled) => (
        <div key={String(disabled)} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            disabled={String(disabled)}
          </Text>
          <Card asChild interactive disabled={disabled} variant="elevated">
            <a href="#team-plan" onClick={onActivate}>
              <Card.Header>
                <Heading level={3} size="md">
                  {disabled ? "Team plan (unavailable)" : "Team plan"}
                </Heading>
              </Card.Header>
              <Card.Body>
                <Text size="sm" color="secondary">
                  {disabled ? "This plan isn't available in your region." : "Open the plan."}
                </Text>
              </Card.Body>
            </a>
          </Card>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const enabled = canvas.getByRole("link", { name: /^Team plan Open the plan/ });
    const disabled = canvas.getByRole("link", { name: /unavailable/ });
    onActivate.mockClear();
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await expect(enabled).not.toHaveAttribute("aria-disabled");
    await userEvent.click(enabled);
    await expect(onActivate).toHaveBeenCalledTimes(1);
    // A click on the disabled card never reaches the link's own handler.
    await userEvent.click(disabled);
    await expect(onActivate).toHaveBeenCalledTimes(1);
    // It stays reachable by keyboard.
    disabled.focus();
    await expect(disabled).toHaveFocus();
  },
};

export const FooterAlignment: Story = {
  name: "Footer alignment",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.footerAlignment } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      {(["start", "center", "end", "between"] as CardFooterAlign[]).map((align) => (
        <div key={align} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <Card>
            <Card.Body>
              <Text size="sm" color="secondary">
                Footer content is laid out along the row.
              </Text>
            </Card.Body>
            <Card.Footer align={align}>
              <Button variant="tertiary" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </Card.Footer>
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const EqualHeight: Story = {
  name: "Equal-height cards (footers line up)",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.equalHeight } } },
  render: () => (
    // Three cards of very different body lengths in one grid row: each stretches
    // to the row's height, and because `Card.Body` grows to fill the spare space,
    // every footer sits at the bottom.
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }} data-testid="equal-height-grid">
      <DemoCard>
        <DemoSections title="Starter" body="One project." />
      </DemoCard>
      <DemoCard>
        <DemoSections
          title="Team"
          body="Up to ten members, unlimited projects, shared workspaces, priority email support, and role-based permissions for every project."
        />
      </DemoCard>
      <DemoCard>
        <DemoSections title="Business" body="Everything in Team, plus single sign-on and audit logs." />
      </DemoCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const footers = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=equal-height-grid] > div > div:last-child")];
    await expect(footers.length).toBe(3);
    const bottoms = footers.map((footer) => Math.round(footer.getBoundingClientRect().bottom));
    // Every footer ends at the same y — the cards are equal height and the body
    // filled the spare room above each footer.
    await expect(new Set(bottoms).size).toBe(1);
  },
};

export const WithTable: Story = {
  name: "Composition — a ghost table inside a card",
  argTypes: noControls,
  parameters: { docs: { source: { code: cardSnippets.withTable } } },
  render: () => (
    // `Table`'s `ghost` variant exists for exactly this: a table inside a
    // container that already provides the boundary.
    <div style={demoContainerStyle}>
      <Card>
        <Card.Header>
          <Heading level={3} size="md">
            Recent invoices
          </Heading>
          <Button variant="secondary" size="sm">
            View all
          </Button>
        </Card.Header>
        <Table variant="ghost" aria-label="Recent invoices">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Invoice</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell numeric>Amount</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
              <Table.Cell>Paid</Table.Cell>
              <Table.Cell numeric>$250.00</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
              <Table.Cell>Pending</Table.Cell>
              <Table.Cell numeric>$150.00</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Card>
    </div>
  ),
};
