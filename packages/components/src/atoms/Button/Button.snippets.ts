// The code shown under each story's "Show code" button on Button's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`disabled={false}`, `fullWidth={false}`,
// `type="button"`), empty placeholders (`aria-label=""`, `loadingText=""`), a no-op
// `onClick={() => {}}`, the story's demo wrapper — and prints the icons in "Leading
// and trailing icons" as `{{ $$typeof: Symbol(react.forward_ref), ... }}`, which
// can't be pasted. Each snippet here is the smallest real usage of what its story
// shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import {
  ArrowRightIcon,
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  WalletIcon,
} from "@dbm-system/icons";
import type { ButtonSize, ButtonTone, ButtonVariant } from "./Button.types";

export const buttonSnippets = {
  allVariants: `{/* variant: "primary" (default) | "secondary" | "tertiary" | "ghost" | "destructive" */}
<Button variant="secondary">secondary</Button>`,

  tones: `{/* tone: "brand" (default) | "neutral". Neutral is a grey look for a control that shouldn't draw the eye to the brand colour;
    every variant follows it except destructive, which stays danger-coloured. */}
<Button tone="neutral">primary</Button>
<Button tone="neutral" variant="secondary">secondary</Button>
<Button tone="neutral" variant="tertiary">tertiary</Button>
<Button tone="neutral" variant="ghost">ghost</Button>`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Button size="lg">Size lg</Button>`,

  rounded: `{/* rounded gives the button fully rounded ends — a pill. It works with every variant and size. */}
<Button rounded>Get started</Button>
<Button rounded variant="secondary">Learn more</Button>
<Button rounded variant="destructive" leadingIcon={TrashIcon}>Delete</Button>`,

  withIcons: `{/* leadingIcon and trailingIcon take an icon component. WalletIcon, DownloadIcon, ArrowRightIcon and
    TrashIcon come from @dbm-system/icons. */}
<Button leadingIcon={WalletIcon}>Pay</Button>
<Button trailingIcon={WalletIcon}>Pay</Button>
<Button leadingIcon={DownloadIcon} trailingIcon={ArrowRightIcon}>Export</Button>
<Button variant="destructive" leadingIcon={TrashIcon}>Delete</Button>`,

  asChild: `{/* asChild renders the button's styling onto your own element — here a link — so it keeps its own
    semantics and href */}
<Button asChild>
  <a href="/next">Continue as a link</a>
</Button>`,

  asChildDisabled: `{/* On an asChild button, disabled sets aria-disabled and blocks the click — an <a> has no native
    disabled attribute — and the link keeps its href */}
<Button asChild disabled>
  <a href="/next">Continue as a link</a>
</Button>`,

  asChildWithIcons: `{/* With asChild, the icons are drawn inside your element, around its own content.
    BookOpenIcon and ArrowRightIcon come from @dbm-system/icons. */}
<Button asChild leadingIcon={BookOpenIcon} trailingIcon={ArrowRightIcon}>
  <a href="/docs">Read the docs</a>
</Button>`,
} as const;

// The Playground's icon controls hand the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [WalletIcon, "WalletIcon"],
  [TrashIcon, "TrashIcon"],
  [HeartIcon, "HeartIcon"],
  [StarIcon, "StarIcon"],
  [PlusIcon, "PlusIcon"],
  [CheckIcon, "CheckIcon"],
  [DownloadIcon, "DownloadIcon"],
  [ArrowRightIcon, "ArrowRightIcon"],
];
const iconKeys = "Wallet|Trash|Heart|Star|Plus|Check|Download|ArrowRight".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface ButtonPlaygroundSnippetArgs {
  children?: unknown;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  rounded?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  leadingIcon?: unknown;
  trailingIcon?: unknown;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. The icon controls give the builder the icon component,
 * which it writes back as its name. Also serves the stories that just change a few
 * args (loading, loading text, disabled, full width).
 */
export function buttonPlaygroundSnippet(args: ButtonPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "primary") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.type && args.type !== "button") attributes.push(`type="${args.type}"`);
  const leading = iconName(args.leadingIcon);
  const trailing = iconName(args.trailingIcon);
  if (leading) attributes.push(`leadingIcon={${leading}}`);
  if (trailing) attributes.push(`trailingIcon={${trailing}}`);
  if (args.isLoading) attributes.push("isLoading");
  if (args.loadingText) attributes.push(`loadingText="${args.loadingText}"`);
  if (args.fullWidth) attributes.push("fullWidth");
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  return `<Button${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>${String(args.children ?? "Button")}</Button>`;
}
