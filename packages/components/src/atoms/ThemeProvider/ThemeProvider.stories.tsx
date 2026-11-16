import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../Button";
import { ThemeProvider } from "./ThemeProvider";
import type { Brand, ColorMode } from "./ThemeProvider.types";
import { useTheme } from "./useTheme";

// ThemeProvider is a non-visual, document-wide utility (no layout/breakpoint
// behavior of its own), so viewport-width variation isn't a meaningful axis
// for its stories the way it is for layout/typography/atom components later
// in this phase — its own definition of done is brand x mode coverage.
const Demo = () => (
  <div
    style={{
      background: "var(--dbm-bg-brand-subtle)",
      border: "var(--dbm-border-width-1) solid var(--dbm-border-brand)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-brand)",
      padding: "var(--dbm-space-4)",
    }}
  >
    <p style={{ margin: 0 }}>
      This surface, its border, and this text all trace to semantic tokens that flip with the
      active theme.
    </p>
  </div>
);

const meta: Meta<typeof ThemeProvider> = {
  title: "Components/ThemeProvider",
  id: "atoms-utility-themeprovider",
  component: ThemeProvider,
  parameters: { layout: "padded" },
  // Ordered to match ThemeProviderProps' own declaration order (brand, mode,
  // children), then the inherited native escape-hatch props last — same
  // sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    brand: {
      control: "select",
      options: ["purple", "emerald"],
      description: "Which brand palette to apply.",
    },
    mode: {
      control: "select",
      options: ["light", "dark", "system"],
      description:
        "Which color mode to apply. 'system' follows prefers-color-scheme and updates live if the OS preference changes while mounted.",
    },
    children: {
      // The demo surface below is what makes the theme's effect actually
      // visible — not representable as a plain control, same reasoning as
      // every other structural `children` exclusion in this codebase.
      control: false,
      description: "The subtree to render inside the theme wrapper.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the wrapper element. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, applied to the wrapper element.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the wrapper element's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors), applied to the wrapper element. Has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string" placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    brand: "purple",
    mode: "system",
    children: <Demo />,
  },
};

export default meta;

type Story = StoryObj<typeof ThemeProvider>;

/** Drive every prop live. */
export const Playground: Story = {};

// `brand`/`mode` are each the whole point of their own named demo below — a
// static reference showing one exact, deliberately-chosen combination — so
// no single control value could represent either without contradicting the
// story's own point (same reasoning as Skeleton's `DefaultSizes`).
const disableAllAxes = {
  brand: { control: false },
  mode: { control: false },
} as const;

export const PurpleLight: Story = {
  args: { brand: "purple", mode: "light" },
  argTypes: disableAllAxes,
};

export const PurpleDark: Story = {
  args: { brand: "purple", mode: "dark" },
  argTypes: disableAllAxes,
};

export const EmeraldLight: Story = {
  args: { brand: "emerald", mode: "light" },
  argTypes: disableAllAxes,
};

export const EmeraldDark: Story = {
  args: { brand: "emerald", mode: "dark" },
  argTypes: disableAllAxes,
};

export const SystemMode: Story = {
  name: "System mode (follows OS preference)",
  args: { brand: "purple", mode: "system" },
  argTypes: disableAllAxes,
};

const ResolvedThemeReadout = () => {
  const { brand, mode, resolvedMode } = useTheme();
  return (
    <div
      style={{
        background: "var(--dbm-bg-brand-subtle)",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-brand)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-brand)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <p style={{ margin: 0 }}>
        <code>useTheme()</code> reports brand=&quot;{brand}&quot;, mode=&quot;{mode}&quot;,
        resolvedMode=&quot;{resolvedMode}&quot;. Click the buttons above and watch this surface
        ease into its new colors instead of hard-cutting.
      </p>
    </div>
  );
};

const LiveToggleDemo = () => {
  const [brand, setBrand] = useState<Brand>("purple");
  const [mode, setMode] = useState<ColorMode>("light");

  return (
    <ThemeProvider brand={brand} mode={mode}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <Button
            variant="primary"
            onClick={() => setBrand((current) => (current === "purple" ? "emerald" : "purple"))}
          >
            Toggle brand (currently {brand})
          </Button>
          <Button
            variant="primary"
            onClick={() => setMode((current) => (current === "light" ? "dark" : "light"))}
          >
            Toggle mode (currently {mode})
          </Button>
        </div>
        <ResolvedThemeReadout />
      </div>
    </ThemeProvider>
  );
};

export const LiveThemeToggle: Story = {
  name: "Live brand/mode toggle (useTheme + transition demo)",
  // Fully bespoke — brand/mode are managed by this demo's own internal
  // state (toggled via its own buttons), not read from `args` at all, same
  // as every other "ignores args entirely" fixed-render story in this
  // codebase (07-storybook-and-documentation-standards.md §5's own
  // convention). `disableAllAxes` only covers brand/mode (the two live
  // controls at the meta level) — children/id/className/style/data-testid
  // are already `control: false` there.
  argTypes: disableAllAxes,
  render: () => <LiveToggleDemo />,
};
