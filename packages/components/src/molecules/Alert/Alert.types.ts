import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { SpaceValue } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";
import type { ButtonProps } from "../../atoms/Button";

/**
 * What the message is about, on the standard tone scale (`05-component-api-conventions.md` §2). `"info"` (the
 * default) is neutral news, `"success"` something that worked, `"warning"` something that needs attention, and
 * `"danger"` something that went wrong. `"neutral"` is a plain notice with no meaning attached. The status colours
 * are fixed; they don't change with the brand.
 */
export type AlertTone = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * How the alert is drawn.
 *
 * - `"subtle"` (the default) — a soft tint of the tone's colour with a faint border.
 * - `"outlined"` — the page's own surface with a border in the tone's colour.
 * - `"solid"` — the tone's full colour, with light or dark text to suit.
 */
export type AlertVariant = "subtle" | "outlined" | "solid";

/**
 * Padding and type size, on the standard 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale.
 */
export type AlertSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Where `Alert.Actions` sits.
 *
 * - `"below"` (the default) — under the message, on its own row.
 * - `"inline"` — beside the message, at the end of the row, for a banner or any alert where a single line reads better.
 *   It goes below the message on its own when there isn't room for both, however wide the page: the room is the alert's
 *   own width, so an alert in a narrow column stacks by itself.
 */
export type AlertActionsPlacement = "below" | "inline";

/**
 * Where the content sits along the row.
 *
 * - `"start"` (the default) — at the start, the way a message reads in a column.
 * - `"center"` — centred: the message, its actions, and the icon — which sits inline at the start of the first line (the
 *   title, or the description when there is no title), so it centres with those words. For an announcement banner. The
 *   dismiss button stays at the end of the row, and the content stays centred whether or not there is one. (If the first
 *   thing in the alert is plain text, or a title drawn onto your own element, the icon can't sit in that line and stays
 *   before the whole message.)
 */
export type AlertAlign = "start" | "center";

/**
 * How the alert is announced to assistive technology.
 *
 * - `"alert"` — a live region that interrupts: announced at once, even mid-sentence. For something that needs
 *   attention now.
 * - `"status"` — a live region that waits for a pause. For news that can wait a moment.
 * - `"none"` — no role: read like any other text, in page order, and not announced when it appears.
 *
 * Left out, it follows the tone: `"alert"` for `"danger"` and `"warning"`, `"status"` for the rest. A message that is
 * already on the page when it loads is better as `"none"`, since it isn't news.
 */
export type AlertRole = "alert" | "status" | "none";

/**
 * The text `Alert` supplies itself, translatable through the `labels` prop (`ADR-0021`). Nothing here needs a number,
 * so there is no `formatNumber`.
 */
export interface AlertLabels {
  /** The accessible name of the dismiss button. @default 'Dismiss' */
  dismiss: string;
}

export interface AlertProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "id" | "role"> {
  /**
   * The message: `Alert.Title`, `Alert.Description` and `Alert.Actions` in any order, any of them optional — or
   * plain text, for the shortest alert. `Alert.Actions` has to be a direct child: the alert sets it apart from the
   * message so that it can sit beside it (`actionsPlacement="inline"`), and one wrapped in another element is
   * treated as part of the message.
   */
  children: ReactNode;
  /**
   * What the message is about — see {@link AlertTone}.
   * @default 'info'
   */
  tone?: AlertTone;
  /**
   * How it is drawn — see {@link AlertVariant}.
   * @default 'subtle'
   */
  variant?: AlertVariant;
  /**
   * Padding and type size.
   * @default 'md'
   */
  size?: AlertSize;
  /**
   * The icon before the message — a component reference from `@dbm-system/icons`, not a string name. Each tone
   * has its own (an info mark, a check, a warning triangle, a stop sign); pass another to replace it, or `false` for
   * none. Decorative: the tone is not conveyed by the icon alone, so put what matters in the text.
   */
  icon?: PhosphorIcon | false;
  /**
   * Where `Alert.Actions` sits — see {@link AlertActionsPlacement}.
   * @default 'below'
   */
  actionsPlacement?: AlertActionsPlacement;
  /**
   * Where the content sits along the row — see {@link AlertAlign}.
   * @default 'start'
   */
  align?: AlertAlign;
  /**
   * Draws it as a banner: edge to edge, with square corners and no side borders, for a message that spans the whole
   * page or a whole section rather than sitting inside its content.
   * @default false
   */
  banner?: boolean;
  /**
   * Keeps it at the top of the page (or of `scrollContainerRef`) as the reader scrolls, and lifts it with a shadow while
   * it is stuck. Built on `Affix`. A sticky message takes up room on a small screen, and more at a high zoom; keep it
   * short, and dismissible.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top a sticky alert sticks, from the spacing token scale — for a page whose own header is also
   * sticky. Has no effect without `sticky`.
   * @default 0
   */
  stickyOffset?: SpaceValue;
  /**
   * The scrollable container a sticky alert sticks within, if it isn't the page itself. Has no effect without
   * `sticky`. The same prop `Affix` and `BackToTop` take.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * Adds a button that dismisses it. Dismissing calls `onOpenChange(false)` and, unless `open` is controlled, hides
   * it. Combine with `usePersistentDismiss` to remember the dismissal across visits.
   * @default false
   */
  dismissible?: boolean;
  /**
   * Whether it is showing, when controlled. Pair with `onOpenChange`. Leaving it `false` (or setting it back to
   * `true`) shows or hides it, with a short exit animation.
   */
  open?: boolean;
  /**
   * Whether it starts out showing, when uncontrolled.
   * @default true
   */
  defaultOpen?: boolean;
  /** Called with `false` when it is dismissed. It never calls with `true` — nothing inside it can reopen it. */
  onOpenChange?: (open: boolean) => void;
  /**
   * How it is announced — see {@link AlertRole}. Follows the tone when left out.
   */
  role?: AlertRole;
  /** The text the component supplies itself, each part replaceable. See {@link AlertLabels}. */
  labels?: Partial<AlertLabels>;
  /**
   * Text direction, a native attribute: `"rtl"` mirrors the layout — the icon and the dismiss button swap sides, and centred
   * content, inline actions and the dismiss button all follow. Left out, it follows the nearest `DirectionProvider`; with none, it is inherited from the page.
   */
  dir?: "ltr" | "rtl" | "auto";
  /** The alert's accessible name, when it needs one of its own. */
  "aria-label"?: string;
  /** The id of an element that names the alert. */
  "aria-labelledby"?: string;
  /** The id of an element that describes it. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface AlertTitleProps extends Omit<ComponentPropsWithoutRef<"p">, "className" | "style" | "id"> {
  /** The headline of the message — a few words. */
  children?: ReactNode;
  /**
   * Renders the title onto your own single child element instead of a `<p>` — a real heading, say, where the message
   * belongs in the page's outline.
   * @default false
   */
  asChild?: boolean;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

export interface AlertDescriptionProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "id"> {
  /** The message itself — text, or anything a message can hold, such as a link. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

/**
 * How prominent an action is, using the names `Button` uses for the same three treatments. How each one looks depends on
 * the alert it sits in — its tone and its variant — so that it always reads against it.
 *
 * - `"primary"` (the default) — the one to choose: a filled button (on a solid alert, an inverted one).
 * - `"secondary"` — an outlined button.
 * - `"tertiary"` — text only.
 */
export type AlertActionVariant = "primary" | "secondary" | "tertiary";

export interface AlertActionProps extends Omit<ButtonProps, "variant" | "size"> {
  /** The action's label (or, with `asChild`, the element it is drawn onto). */
  children?: ButtonProps["children"];
  /**
   * How prominent it is — see {@link AlertActionVariant}.
   * @default 'primary'
   */
  variant?: AlertActionVariant;
}

export interface AlertActionsProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "id"> {
  /**
   * What the reader can do about it — usually one or two `Alert.Action`s, which take their colours from the alert. Anything
   * else works too (a `Link`, your own control), but a control that isn't an `Alert.Action` keeps its own colours, so check
   * that it reads against the alert. They wrap onto more lines when there is no room.
   */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}
