import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";
import { textPlaygroundSnippet, textSnippets } from "./Text.snippets";

/**
 * `truncate`'s Storybook control is a plain text field, paired with a real
 * `""` starting arg (see `meta.args` below) rather than `undefined` —
 * mirrors `Heading.stories.tsx`'s own identical helper/comment: a `number`
 * control gates on an undefined value showing "Set number" exactly like a
 * `text` control shows "Set string," so neither control *type* alone avoids
 * it. `""` is a real, defined value that reads as empty, avoiding the gate
 * while still meaning "no truncation" once parsed. `Text`'s own `truncate`
 * prop stays a real `number` — this parses the control's raw string back to
 * one (or `undefined` for an empty/non-numeric string) before it's ever
 * passed to the component.
 */
function parseTruncateArg(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  id: "atoms-typography-text",
  component: Text,
  parameters: { layout: "padded" },
  // Ordered to match TextProps' own declaration order (children, size,
  // align, weight, color, fontFamily, wrap, truncate, as, then the
  // inherited native escape-hatch props last) — same sequencing principle
  // the Properties table uses (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    children: { control: "text", description: "The text content." },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description: "Font size, from the full font-size token scale.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Text alignment. Unset by default — inherits the surrounding layout's alignment.",
    },
    weight: {
      control: "select",
      options: ["regular", "medium", "semibold", "bold"],
      description: "Font weight.",
    },
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "disabled",
        "link",
        "danger",
        "warning",
        "success",
        "info",
      ],
      description: "Semantic text color.",
    },
    fontFamily: {
      control: "select",
      options: ["primary", "secondary"],
      description:
        "Font family. secondary switches to Lora for editorial/long-form reading content.",
    },
    wrap: {
      control: "select",
      options: ["wrap", "nowrap", "balance", "pretty"],
      description:
        "Line-wrapping behavior (CSS text-wrap). balance or pretty improve how a multi-line paragraph breaks. nowrap conflicts with a multi-line truncate and warns in development if combined with one.",
    },
    // A `text` control, paired with a real `""` starting arg — see this
    // file's own `parseTruncateArg` comment above for why.
    truncate: {
      control: "text",
      description:
        "Truncates text after this many lines, with an ellipsis (-webkit-line-clamp).",
    },
    // `control: false` — matches Heading's own identical `as` argType:
    // toggling `as` genuinely changes the rendered element (confirmed live),
    // but between p/span/div/label/legend at otherwise-identical styling the
    // visible result is indistinguishable without opening devtools, which
    // reads as "this control does nothing" in a Playground meant to be
    // judged by eye. `as` stays fully live, and its effect fully visible, on
    // the "Polymorphic: as=label" story, which pairs it with a real
    // associated input specifically so the change is actually observable.
    as: {
      control: false,
      description: "The HTML element to render as.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5). `align`/
  // `wrap` have no true default and get a sensible non-blank demo value
  // instead, same as Heading's own Playground. `as`'s control is disabled
  // entirely (see that argType's own comment), so its own arg value here is
  // moot.
  args: {
    children: "Design builds meaning",
    size: "base",
    align: "start",
    weight: "regular",
    color: "primary",
    fontFamily: "primary",
    wrap: "wrap",
    // Cast, not a real `number` — see this file's own `truncate` argType
    // comment for why the Storybook *control* needs a string `""` here even
    // though the real component prop is always a `number`.
    truncate: "" as unknown as number,
    as: undefined,
  },
  // The fallback renderer for any story below with no `render` of its own
  // (`Default`, `NarrowViewport`) — every story that *does* define its own
  // `render` applies this same `parseTruncateArg` coercion itself.
  render: (args) => <Text {...args} truncate={parseTruncateArg(args.truncate)} />,
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => textPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: textSnippets.allSizes } } },
  // `size` is the deliberate varying axis (one instance per size, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception);
  // `children` is hardcoded per instance to label which size it is. Every
  // other prop is genuinely shared across all instances and stays live.
  argTypes: {
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(
        ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const
      ).map((size) => (
        <Text
          key={size}
          {...args}
          size={size}
          truncate={parseTruncateArg(args.truncate)}
        >
          size=&quot;{size}&quot; — Design builds meaning
        </Text>
      ))}
    </>
  ),
};

export const AllWeights: Story = {
  name: "All weights",
  parameters: { docs: { source: { code: textSnippets.allWeights } } },
  argTypes: {
    weight: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(["regular", "medium", "semibold", "bold"] as const).map((weight) => (
        <Text
          key={weight}
          {...args}
          weight={weight}
          truncate={parseTruncateArg(args.truncate)}
        >
          weight=&quot;{weight}&quot; — Design builds meaning
        </Text>
      ))}
    </>
  ),
};

export const AllColors: Story = {
  name: "All colors",
  // Known finding (2026-08-16, adding @storybook/addon-vitest): the
  // color="disabled" row measures 2.32:1 against bg.surface, below the
  // 4.5:1 AA text floor — but this is the already-decided, WCAG-exempt
  // disabled-state pairing computed in 03-token-system-spec.md's Phase 17
  // (WCAG 2.1 excludes inactive/disabled UI components from 1.4.3), not a
  // new defect. axe has no way to know that on its own. Confirmed still the
  // case during this component's own 2026-09-07 review pass — not a new
  // finding. See guidelines/01-vision-and-goals.md §12.
  parameters: { a11y: { test: "todo" }, docs: { source: { code: textSnippets.allColors } } },
  argTypes: {
    color: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(
        [
          "primary",
          "secondary",
          "tertiary",
          "disabled",
          "link",
          "danger",
          "warning",
          "success",
          "info",
        ] as const
      ).map((color) => (
        <Text
          key={color}
          {...args}
          color={color}
          truncate={parseTruncateArg(args.truncate)}
        >
          color=&quot;{color}&quot; — Design builds meaning
        </Text>
      ))}
    </>
  ),
};

export const FontFamily: Story = {
  name: "Font family (primary vs secondary/editorial)",
  parameters: { docs: { source: { code: textSnippets.fontFamily } } },
  argTypes: {
    fontFamily: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      <Text {...args} fontFamily="primary" truncate={parseTruncateArg(args.truncate)}>
        fontFamily=&quot;primary&quot; (Nunito) — body/UI copy.
      </Text>
      <Text {...args} fontFamily="secondary" truncate={parseTruncateArg(args.truncate)}>
        fontFamily=&quot;secondary&quot; (Lora) — long-form editorial reading content.
      </Text>
    </>
  ),
};

export const Align: Story = {
  name: "Text alignment (start/center/end)",
  parameters: { docs: { source: { code: textSnippets.align } } },
  argTypes: {
    align: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(["start", "center", "end"] as const).map((align) => (
        <Text
          key={align}
          {...args}
          align={align}
          truncate={parseTruncateArg(args.truncate)}
        >
          align=&quot;{align}&quot;
        </Text>
      ))}
    </>
  ),
};

export const Wrap: Story = {
  name: "Line-wrapping (wrap vs balance vs pretty)",
  parameters: { docs: { source: { code: textSnippets.wrap } } },
  // `wrap` is the deliberate varying axis; `children` is hardcoded per
  // instance (text describing its own wrap value, calibrated to actually
  // wrap at the demo width) — matches Heading.stories.tsx's own identical
  // Wrap story exactly, including *not* using a separate caption line: an
  // earlier version of this story added one, hardcoding its size/color/
  // weight, which silently made those three controls only partially live
  // (they changed the demo line but not its own caption) — confirmed live
  // by setting color="danger" and watching only the demo line turn red.
  // Folding the description into each row's own children keeps every prop
  // genuinely shared and live, the same fix already applied to this file's
  // other multi-instance galleries.
  argTypes: {
    wrap: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      <div style={{ maxWidth: "20rem" }}>
        <Text {...args} wrap="wrap" truncate={parseTruncateArg(args.truncate)}>
          A longer piece of body copy that wraps with the browser&apos;s default line breaks
        </Text>
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <Text {...args} wrap="balance" truncate={parseTruncateArg(args.truncate)}>
          A longer piece of body copy that wraps with balanced line breaks
        </Text>
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <Text {...args} wrap="pretty" truncate={parseTruncateArg(args.truncate)}>
          A longer piece of body copy that wraps with prettier line breaks
        </Text>
      </div>
    </>
  ),
};

export const Truncate: Story = {
  name: "truncate (line-clamp)",
  parameters: { docs: { source: { code: textSnippets.truncate } } },
  argTypes: { truncate: { control: false } },
  args: {
    truncate: "2" as unknown as number,
    children:
      "This is a much longer piece of body copy than will fit on two lines, so it should be clamped with an ellipsis after the second line instead of overflowing or wrapping onto a third line and beyond.",
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Text {...args} truncate={parseTruncateArg(args.truncate)} />
    </div>
  ),
};

export const AsLabel: Story = {
  name: 'Polymorphic: as="label" (native props type-check, e.g. htmlFor)',
  parameters: { docs: { source: { code: textSnippets.asLabel } } },
  argTypes: { as: { control: false }, children: { control: false } },
  args: { weight: "medium", children: "Email address" },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-2)" }}>
      {/* Not `{...args}` — spreading the generically-inferred args object
          here conflicts with a concrete `as="label"`: Storybook infers
          `args`'s type as a union across every element `TextElement`
          allows, so its native event-handler props (e.g. `onCopy`) don't
          narrow to HTMLLabelElement the way a direct literal call does.
          Picking only the specific props this story cares about sidesteps
          that union entirely. */}
      <Text
        as="label"
        htmlFor="story-email-input"
        size={args.size}
        align={args.align}
        weight={args.weight}
        color={args.color}
        fontFamily={args.fontFamily}
        wrap={args.wrap}
        truncate={parseTruncateArg(args.truncate)}
        className={args.className}
        style={args.style}
        data-testid={args["data-testid"]}
      >
        {args.children}
      </Text>
      <input id="story-email-input" type="email" />
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (wraps, never overflows)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => textPlaygroundSnippet(context.args),
      },
    },
  },
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  args: {
    size: "lg",
    children:
      "This is a longer sentence meant to demonstrate that Text wraps naturally at narrow viewport widths rather than overflowing its container.",
  },
};
