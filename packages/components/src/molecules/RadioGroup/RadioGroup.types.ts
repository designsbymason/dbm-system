import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { RadioSize } from "../../atoms/Radio";

export type RadioGroupOrientation = "horizontal" | "vertical";

export interface RadioGroupProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "defaultValue" | "onChange" | "children"
  > {
  /** The `Radio` elements this group manages — each needs its own `value`. */
  children: ReactNode;
  /**
   * Sets the size every `Radio` in this group inherits, unless a `Radio`
   * sets its own `size` explicitly (which always wins). Leaving this unset
   * means each `Radio` falls back to its own default (`'md'`)
   * individually, exactly as if there were no group `size` at all.
   */
  size?: RadioSize;
  /**
   * The controlled selected value. Pass `null` to represent "nothing
   * selected" in a controlled group — omitting `value` entirely (leaving it
   * `undefined`) is what makes the group uncontrolled instead, deferring to
   * `defaultValue`.
   */
  value?: string | null;
  /** The initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the newly selected value whenever the selection changes. */
  onValueChange?: (value: string) => void;
  /**
   * Marks the group as invalid: sets `aria-invalid` on the group itself,
   * and shows a colored left-border accent (unlike `Input`/`Checkbox`/
   * `Radio`, a bare group of options has no bounded box of its own for a
   * full border to live on). Still pair with a nearby `FieldError` so the
   * reason is visible, not just the visual/semantic flag — color/border
   * alone is never the sole error signal.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables every `Radio` in the group at once — each still accepts its
   * own additional `disabled` on top of this. Forwarded straight through to
   * Radix's own `RadioGroup.Root`, which every grouped `Radio` already
   * reads from real Radix context — no extra wiring needed on this
   * component's part.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the group as required for real HTML5 form validation, and sets
   * `aria-required` — on the group itself, not each individual `Radio` (see
   * `Radio`'s own `required`, which is standalone-only for exactly this
   * reason). Inside a `<form>`, Radix automatically renders a hidden native
   * `<input type="radio">` per option that actually participates in
   * submission.
   * @default false
   */
  required?: boolean;
  /**
   * Form field name shared by every `Radio` in the group, via Radix's own
   * hidden native inputs — only meaningful inside a `<form>`.
   */
  name?: string;
  /**
   * Associates the group with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /**
   * Layout direction, and which arrow-key pair moves roving focus between
   * options: `Up`/`Down` when `"vertical"`, `Left`/`Right` when
   * `"horizontal"`. Purely visual+keyboard — unrelated to text direction
   * (see `dir` for that).
   * @default 'vertical'
   */
  orientation?: RadioGroupOrientation;
  /**
   * Text direction, passed through to Radix RadioGroup — flips which
   * physical arrow key (`Left`/`Right`) moves focus forward versus back in
   * `"horizontal"` orientation. Left out, it follows the nearest `DirectionProvider`, then a Radix `DirectionProvider` if the app has one, else left-to-right; it is not read from the page.
   */
  dir?: "ltr" | "rtl";
  /**
   * Whether roving focus wraps from the last option back to the first (and
   * vice versa) on arrow-key navigation.
   * @default true
   */
  loop?: boolean;
  /**
   * Accessible name for the group — every `role="radiogroup"` needs one.
   * Required unless `aria-labelledby` points at a visible heading/label
   * instead (a dev-mode warning fires if neither is set).
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element (e.g. a
   * `FieldLabel`) to use as the group's accessible name instead of
   * `aria-label`.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * group, or a test/router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
