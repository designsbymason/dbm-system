// The code shown under each story's "Show code" button on IconButton's Docs page.
//
// Hand-written rather than generated from the rendered story: `icon` is a required
// prop, and the generated code prints it as `{{ $$typeof: Symbol(react.forward_ref),
// render: () => {} }}` on every one of the ten panels, which can't be pasted. It
// also spells out every default (`asChild={false}`, `rounded={false}`,
// `type="button"`), a no-op `onClick={() => {}}`, and the story's demo wrapper. Each
// snippet here is the smallest real usage of what its story shows — only exports of
// the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { HeartIcon, TrashIcon } from "@dbm-system/icons";
import { quote } from "../../snippetHelpers";

export const iconButtonSnippets = {
  allVariants: `{/* variant: "primary" (default) | "secondary" | "tertiary" | "ghost" | "destructive".
    An icon button has no visible text, so aria-label names it. TrashIcon comes from @dbm-system/icons. */}
<IconButton icon={TrashIcon} aria-label="Delete" variant="secondary" />`,

  tones: `{/* tone: "brand" (default) | "neutral". Neutral is a grey look for a control that shouldn't draw the eye to the brand colour;
    every variant follows it except destructive, which stays danger-coloured. TrashIcon comes from @dbm-system/icons. */}
<IconButton icon={TrashIcon} aria-label="Delete" tone="neutral" />
<IconButton icon={TrashIcon} aria-label="Delete" tone="neutral" variant="secondary" />
<IconButton icon={TrashIcon} aria-label="Delete" tone="neutral" variant="tertiary" />
<IconButton icon={TrashIcon} aria-label="Delete" tone="neutral" variant="ghost" />`,

  labelled: `{/* label puts a short caption under the icon, so the icon and the caption are one control (hover, pressed, focus and a click
    cover both). aria-label stays required and should contain the caption. tone: "brand" (default) | "neutral". TrashIcon comes from
    @dbm-system/icons. */}
<IconButton icon={TrashIcon} aria-label="Delete" label="Delete" variant="tertiary" />
<IconButton icon={TrashIcon} aria-label="Delete" label="Delete" variant="tertiary" tone="neutral" />`,

  labelFrom: `{/* hideLabelBelow leaves the caption out below a width, a breakpoint step, so a bar can drop its captions on a phone: below
    "md" this is the plain icon-only square. A tooltip then serves the icon-only state. HeartIcon comes from @dbm-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorites" label="Favorites" hideLabelBelow="md" variant="tertiary" tooltip />`,

  labelledToggle: `{/* A captioned toggle: the caption goes bold when pressed (without changing the box's width) and takes the colour of the new
    fill. handlePressedChange is yours. HeartIcon comes from @dbm-system/icons. */}
<IconButton
  icon={HeartIcon}
  aria-label="Favorite"
  label="Favorite"
  variant="ghost"
  defaultPressed={false}
  onPressedChange={handlePressedChange}
/>`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl". HeartIcon comes from @dbm-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorite" size="lg" />`,

  tooltip: `{/* tooltip: true shows the aria-label; any other content is shown instead. tooltipSide: "top" (default) |
    "right" | "bottom" | "left". HeartIcon and TrashIcon come from @dbm-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorite" variant="secondary" tooltip />
<IconButton
  icon={TrashIcon}
  aria-label="Delete"
  variant="secondary"
  tooltip="Delete this item"
  tooltipSide="bottom"
/>`,

  loading: `{/* isLoading swaps the icon for a spinner and blocks interaction. HeartIcon comes from
    @dbm-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorite" isLoading />`,

  toggle: `{/* Setting defaultPressed (or pressed) makes it a toggle button, with aria-pressed. onPressedChange
    receives the new state — handlePressedChange is yours. HeartIcon comes from @dbm-system/icons. */}
<IconButton
  icon={HeartIcon}
  aria-label="Favorite"
  variant="ghost"
  defaultPressed={false}
  onPressedChange={handlePressedChange}
/>`,

  asChild: `{/* asChild renders the icon button onto your own element — here a link — and draws the icon inside it.
    Leave the link empty (if it has content of its own, that content is used instead), and give it the same
    aria-label, which lint rules that check a link for content read. HeartIcon comes from @dbm-system/icons. */}
<IconButton asChild icon={HeartIcon} aria-label="Favorite">
  <a href="/favorite" aria-label="Favorite" />
</IconButton>`,

  asChildDisabled: `{/* On an asChild icon button, disabled sets aria-disabled and blocks the click — an <a> has no native
    disabled attribute. HeartIcon comes from @dbm-system/icons. */}
<IconButton asChild disabled icon={HeartIcon} aria-label="Favorite">
  <a href="/favorite" aria-label="Favorite" />
</IconButton>`,
} as const;

// The Playground's icon control hands the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [HeartIcon, "HeartIcon"],
  [TrashIcon, "TrashIcon"],
];
const iconKeys = "Heart|Trash".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface IconButtonPlaygroundSnippetArgs {
  icon?: unknown;
  variant?: string;
  tone?: string;
  size?: string;
  label?: string;
  hideLabelBelow?: unknown;
  isLoading?: boolean;
  loadingLabel?: string;
  rounded?: boolean;
  /** The Playground's choice ("Off" | "Label" | "Custom text"), or the value it maps to (`true` or a string). */
  tooltip?: unknown;
  tooltipSide?: string;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Playground-only: whether the button is a toggle. Not a real prop. */
  interactionMode?: "Non-toggle" | "Toggle";
  defaultPressed?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. `icon` is required, so it's always written (the icon
 * control's component, back as its name), and so is the `aria-label` an icon button
 * needs. Toggle isn't a prop — it's what setting `defaultPressed` means — so the
 * Playground's "Toggle" mode is written as `defaultPressed` plus an `onPressedChange`.
 */
export function iconButtonPlaygroundSnippet(args: IconButtonPlaygroundSnippetArgs): string {
  const attributes: string[] = [`icon={${iconName(args.icon) ?? "HeartIcon"}}`, `aria-label="${args["aria-label"] || "Favorite"}"`];
  if (args.variant && args.variant !== "primary") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.label) attributes.push(`label="${args.label}"`);
  if (args.label && typeof args.hideLabelBelow === "string" && args.hideLabelBelow !== "none") attributes.push(`hideLabelBelow="${args.hideLabelBelow}"`);
  if (args.rounded) attributes.push("rounded");
  // The Playground's select hands the transform its option key; accept the mapped value too.
  if (args.tooltip === true || args.tooltip === "Label") attributes.push("tooltip");
  else if (args.tooltip === "Custom text") attributes.push('tooltip="Add to favorites"');
  else if (typeof args.tooltip === "string" && args.tooltip !== "Off" && args.tooltip !== "") attributes.push(`tooltip=${quote(args.tooltip)}`);
  if (args.tooltip && args.tooltip !== "Off" && args.tooltipSide && args.tooltipSide !== "top") attributes.push(`tooltipSide="${args.tooltipSide}"`);
  if (args.type && args.type !== "button") attributes.push(`type="${args.type}"`);
  if (args.isLoading) {
    attributes.push("isLoading");
    if (args.loadingLabel) attributes.push(`loadingLabel="${args.loadingLabel}"`);
  }
  if (args.interactionMode === "Toggle") {
    attributes.push(`defaultPressed={${Boolean(args.defaultPressed)}}`, "onPressedChange={handlePressedChange}");
  }
  if (args.disabled) attributes.push("disabled");
  return `<IconButton ${attributes.join(" ")} />`;
}
