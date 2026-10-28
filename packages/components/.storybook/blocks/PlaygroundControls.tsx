import { ArrowCounterClockwiseIcon } from "@dbm-system/icons";
import { DocsContext, useOf } from "@storybook/addon-docs/blocks";
import type { Of } from "@storybook/addon-docs/blocks";
import { useContext, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../src/atoms/Button";
import { FieldLabel } from "../../src/atoms/FieldLabel";
import { Icon } from "../../src/atoms/Icon";
import { Input } from "../../src/atoms/Input";
import { Switch } from "../../src/atoms/Switch";
import { Select } from "../../src/molecules/Select";
import { sortEntriesByOrder } from "./sortEntriesByOrder";
import { usePlaygroundArgs } from "./usePlaygroundArgs";

interface ArgTypeLike {
  control?:
    | {
        type?: string;
        disable?: boolean;
        /**
         * Overrides an option's own *displayed* text without changing the
         * real value `onChange` sends — Storybook's own select-control
         * convention (`argType.control.labels`), keyed by `String(option)`.
         * Missing entries fall back to the option's own stringified value,
         * unaffected. Added for `Accordion`'s own `defaultValue` (`""`
         * meaning "nothing open by default") — before this, an option
         * whose own stringified value was falsy/empty rendered as a
         * genuinely blank, invisible-text row in the dropdown (confirmed
         * live in the DOM: a real `role="option"` with empty
         * `textContent`, easy to miss as a UI bug rather than see as
         * "unlabeled" until inspected directly) rather than a labeled one.
         */
        labels?: Record<string, string>;
        /**
         * The label this control shows, in place of its key: opt-in, so two Playground-only keys can both read as the prop
         * they stand for (Timeline's `horizontalTimePlacement` reads `timePlacement`). Not Storybook's own `name`, which
         * some stories already set for the native Controls panel's sake.
         */
        label?: string;
      }
    | false;
  options?: unknown[];
  mapping?: Record<string, unknown>;
  /**
   * Storybook's own conditional-control convention (a subset): show this control only while another arg meets a
   * condition — `truthy` (the default), `exists`, `eq` or `neq`. The native Controls panel already honours it; this
   * block reads it too, so a control that has no effect in the current state (RatingInput's `count`, which only a
   * read-only rating draws) isn't offered as if it did.
   */
  if?: { arg: string; truthy?: boolean; exists?: boolean; eq?: unknown; neq?: unknown };
  table?: { disable?: boolean };
  /**
   * Opt-in, not a Storybook concept — computes what this control should
   * *display* when its own arg is `undefined`, from the story's current
   * full `args` (e.g. Heading's `size` control showing the size that
   * `level` actually resolves to internally, rather than a blank "Choose
   * option…", without that computed value ever becoming a real, sticky arg
   * on its own). Purely additive: a control with no `resolveDisplayValue`
   * behaves exactly as before. The underlying arg stays genuinely
   * `undefined` until the user actually interacts with the control —
   * `onChange` always writes the real explicit value, never this one.
   */
  resolveDisplayValue?: (args: Record<string, unknown>) => unknown;
  /**
   * Shown (via the native HTML `placeholder` attribute) when a `text`- or
   * `number`-type control's own value is genuinely empty/unset — cosmetic
   * guidance only, never a real value: it disappears the moment the reader
   * types anything, is never sent through `onChange`, and never becomes a
   * real arg on its own. For a prop like `GridItem`'s `colStart`/`rowStart`
   * that has no *safe* real default to show instead (unlike `colSpan`/
   * `rowSpan`, whose own CSS-initial value of `1` is safe to default to —
   * see that story file's own comment on why `colStart`/`rowStart` can't do
   * the same), this is what keeps the field from just looking broken/empty
   * (user-reported, 2026-09-07) without actually setting anything that
   * could collide once spread across more than one grid item.
   */
  placeholder?: string;
}

/**
 * One prop's row: `FieldLabel` on the left, the matching interactive
 * widget on the right — dispatched by `argType.control.type`, using this
 * design system's own form atoms instead of Storybook's own Controls
 * widgets. Unrecognized control types fall back to a plain text `Input`
 * rather than being silently dropped, since every remaining row here has
 * already been confirmed interactive (see the `PlaygroundControls`
 * filter below) — better a best-effort text box than a missing control.
 */
function ControlField({
  name,
  argType,
  value,
  resolvedDisplayValue,
  onChange,
}: {
  name: string;
  argType: ArgTypeLike;
  value: unknown;
  /**
   * Pre-computed by `PlaygroundControls` (it has the full `args` object;
   * this component only ever sees this one prop's own value) by calling
   * `argType.resolveDisplayValue` — `undefined` when that field isn't set,
   * which is every existing prop today. See `ArgTypeLike`'s own doc.
   */
  resolvedDisplayValue?: unknown;
  onChange: (value: unknown) => void;
}) {
  // `argType.control &&` already truthy-narrows away the `false` member of
  // `{ type?: string; disable?: boolean } | false` (the only falsy one),
  // so a further `!== false` check is redundant — and, now that
  // `.storybook` is type-checked, TS flags it as a comparison that can
  // never be false (TS2367), not just a style nit.
  const controlType = argType.control ? argType.control.type : undefined;
  const fieldId = `playground-control-${name}`;
  const labelId = `${fieldId}-label`;
  // What the widget below should *show* — the real arg when it's set, the
  // computed fallback otherwise. `onChange` always writes the real value
  // the user actually picked, never this one, so a prop with no
  // `resolveDisplayValue` (every prop except an opt-in one like Heading's
  // `size`) behaves exactly as before: `effectiveValue === value` always.
  const effectiveValue = value !== undefined ? value : resolvedDisplayValue;

  // `onChange` round-trips through Storybook's event channel
  // (`usePlaygroundArgs.ts` — `UPDATE_STORY_ARGS` out, `STORY_ARGS_UPDATED`
  // back in), which isn't instant. Driving every widget's displayed value
  // directly off `effectiveValue` meant every keystroke/toggle visibly
  // lagged behind what was just typed/clicked until that round-trip
  // resolved — confirmed live (user-reported, 2026-09-07): GridItem's
  // `order` and `colSpan` fields both kept showing their *previous* value
  // for roughly a second after typing, even though the canvas itself
  // already updated correctly in the meantime. `draft` is the optimistic
  // local echo each widget actually displays — it updates synchronously on
  // every interaction, and re-syncs to the real external value whenever
  // *that* changes for a reason other than this widget's own edit (the
  // round-trip finally landing, "Reset to defaults", another control's
  // `resolveDisplayValue` cascading, switching stories). Synced *during
  // render* (the React-docs-recommended "adjust state when a prop changes"
  // pattern — comparing against a same-render "previous value" and calling
  // setState conditionally, not from inside a `useEffect`), since this
  // repo's lint config (`react-hooks/set-state-in-effect`) forbids the
  // effect-based version of this same pattern as a real anti-pattern (it
  // costs an extra commit/paint the during-render version doesn't).
  const [draft, setDraft] = useState(effectiveValue);
  const [prevEffectiveValue, setPrevEffectiveValue] = useState(effectiveValue);
  if (effectiveValue !== prevEffectiveValue) {
    setPrevEffectiveValue(effectiveValue);
    setDraft(effectiveValue);
  }

  // The `number` widget's own local raw string, not the parsed number —
  // tracked separately from `draft` (which mirrors the outgoing, already-
  // parsed value) so a mid-edit state that isn't a valid number yet (an
  // empty field, a bare "-" while typing a negative `order`) can still be
  // typed without being clobbered on every keystroke. Declared
  // unconditionally (a control's own `controlType` never changes across
  // this component's lifetime, but React's rules of hooks still forbid
  // calling `useState` from inside the `if`/`else` below) — simply unused
  // whenever `controlType !== "number"`. Same during-render sync pattern as
  // `draft` above, keyed off `draft` itself rather than `effectiveValue`.
  const [rawText, setRawText] = useState(() =>
    typeof draft === "number" ? String(draft) : "",
  );
  const [prevDraftForRawText, setPrevDraftForRawText] = useState(draft);
  if (draft !== prevDraftForRawText) {
    setPrevDraftForRawText(draft);
    setRawText(typeof draft === "number" ? String(draft) : "");
  }

  let widget: ReactNode;
  if (controlType === "boolean") {
    widget = (
      // `Switch` runs its own dev-mode "no accessible name" check against
      // only its own `children`/`aria-label`/`aria-labelledby` props — it
      // has no way to detect the external `<FieldLabel htmlFor={fieldId}>`
      // below, even though that's already a real, spec-valid native label
      // association (`<label for>` targeting a `<button>`, a labelable
      // element). `aria-labelledby` here doesn't change what's announced —
      // the label text is identical either way — it just makes the
      // association explicit so Switch's own heuristic can see it too.
      <Switch
        id={fieldId}
        aria-labelledby={labelId}
        checked={Boolean(draft)}
        onCheckedChange={(checked) => {
          setDraft(checked === true);
          onChange(checked === true);
        }}
      />
    );
  } else if (controlType === "select" || controlType === "radio") {
    // Options aren't always strings — e.g. Affix's `offset` (a numeric
    // space scale) or Heading's `level` (1–6) — but `Select` only deals in
    // string values internally. Real, previously-shipped bug: comparing
    // `typeof value === "string"` to decide what to display meant any
    // non-string arg (a plain number, most commonly the default `0`, which
    // is also falsy) always read as unset, rendering the placeholder
    // instead of the real value; found via direct user report that
    // Affix's `offset` control looked broken on its Docs page. Fixed by
    // stringifying for comparison/display, then mapping the selected
    // string back to the original option (preserving its real type —
    // including `undefined`, which some option lists include as a valid
    // choice, e.g. Avatar's `loading`/`status`) before calling `onChange`.
    const options = Array.isArray(argType.options) ? argType.options : [];
    const labels = argType.control ? argType.control.labels : undefined;
    // The label an option should *display* as — falls back to the option's
    // own stringified value when `labels` has no entry for it, so every
    // existing select/radio control (none of which set `labels` before
    // `Accordion`'s own `defaultValue`) behaves exactly as before. Also
    // used as the option's own underlying `Select.Option` `value` below,
    // not just its visible text — routes around a real, separate bug this
    // fix incidentally closes: DBM's own `Select` reserves `""` as its
    // internal "nothing selected" sentinel (see `Select.tsx`'s own
    // `onClear` comment), so an option whose real value stringifies to `""`
    // (or any other falsy-looking string) needs a non-empty stand-in value
    // to be reliably selectable at all, not just correctly labeled.
    const labelFor = (option: unknown) => labels?.[String(option)] ?? String(option);
    // A `mapping`-backed control (a component-reference prop like Icon's
    // own `icon`, matching Button's leadingIcon/trailingIcon — see
    // 05-component-api-conventions.md §5) needs its display value
    // reverse-looked-up from the mapping instead of naively stringified.
    // `context.getStoryContext(story).args` (this component's own `value`)
    // turns out to already hold the *mapped*, resolved value (e.g. the real
    // icon component) rather than the raw option key the comment in
    // usePlaygroundArgs.ts originally assumed — confirmed empirically
    // (found via Icon's own review, 2026-09-03): naively `String()`-ing a
    // resolved component reference produces something that matches no
    // option, so the Select silently showed its unselected placeholder even
    // though the canvas was rendering the correct icon the whole time.
    // `onChange` below is unaffected — it already sends the raw option key
    // string (`options[index]`, which for a mapped select just resolves to
    // the same key), and Storybook's own UPDATE_STORY_ARGS pipeline is what
    // correctly re-resolves that key through `mapping` on the way back in.
    const displayValue = argType.mapping
      ? Object.entries(argType.mapping).find(([, mapped]) => mapped === draft)?.[0]
      : draft === undefined
        ? undefined
        : labelFor(draft);
    widget = (
      <Select
        id={fieldId}
        value={displayValue}
        onValueChange={(selected) => {
          const index = options.findIndex((option) => labelFor(option) === selected);
          const resolved = index === -1 ? selected : options[index];
          setDraft(resolved);
          onChange(resolved);
        }}
        placeholder="Choose option…"
      >
        {options.map((option) => (
          <Select.Option key={String(option)} value={labelFor(option)}>
            {labelFor(option)}
          </Select.Option>
        ))}
      </Select>
    );
  } else if (controlType === "number") {
    widget = (
      <Input
        id={fieldId}
        type="number"
        value={rawText}
        placeholder={argType.placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setRawText(next);
          if (next === "") {
            setDraft(undefined);
            onChange(undefined);
            return;
          }
          const parsed = Number(next);
          if (Number.isNaN(parsed)) return;
          setDraft(parsed);
          onChange(parsed);
        }}
      />
    );
  } else {
    // "text" and any other/unrecognized control type.
    widget = (
      <Input
        id={fieldId}
        value={typeof draft === "string" ? draft : ""}
        placeholder={argType.placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
      />
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "var(--dbm-space-3)",
        minWidth: 0,
      }}
    >
      <FieldLabel
        id={labelId}
        htmlFor={fieldId}
        size="md"
        style={{
          flex: "0 0 var(--dbm-space-32)",
          fontWeight: "var(--dbm-font-weight-medium)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "var(--dbm-space-32)",
        }}
      >
        {(argType.control ? argType.control.label : undefined) ?? name}
      </FieldLabel>
      <div style={{ display: "flex", flex: "1 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        {widget}
      </div>
    </div>
  );
}

/**
 * The Playground section's compact controls panel — a custom-rendered
 * replacement for Storybook's own `<Controls of={X}>` block (see
 * guidelines/07-storybook-and-documentation-standards.md §4 and this
 * component's introduction in the commit that added it for the full
 * rationale: Storybook's ArgsTable renders every row as two separately-
 * boxed table cells, which no CSS override can turn into "one border
 * around the whole panel" once `border-collapse` no longer applies).
 * Same `of`/`exclude` API as `<Controls>` for a drop-in swap at the MDX
 * call site.
 *
 * Layout is inline styles with `var(--dbm-*)` tokens, matching every other
 * docs-only block in this folder (`RelatedCard`, `ColorSwatch`,
 * `TypeSpecimen`) rather than a CSS Module — those are for the published
 * component library; this is Storybook-only tooling. The one exception is
 * the row grid itself (`.dbm-playground-controls-grid`, in `docs.css`):
 * stacking to a single column below `breakpoint.sm` needs a real media
 * query, which inline styles can't express. Deliberately no divider lines
 * between rows, only the outer card gets a border — spacing alone
 * separates rows, so there's no ambiguity about a border being "around" a
 * field.
 *
 * `order` mirrors `PropertiesTable`'s prop of the same name (same
 * `sortEntriesByOrder` helper) — pass the same array to both so a
 * component's docs page defines one sensible prop reading order and reuses
 * it for the full Properties table and this compact panel alike.
 *
 * The "Reset to defaults" control sits outside/below the bordered card,
 * left-aligned (moved 2026-09-06, at explicit direction, from a top-right
 * icon-only `IconButton` inside the card) — mirroring how the Canvas
 * block's own native "Show code"/"Copy code" controls sit below *its* box
 * rather than inside it. The visible label means a `Tooltip` restating
 * the same text is no longer needed.
 *
 * Styled to match those same native "Show code"/"Copy code" buttons
 * (revised 2026-09-06, at explicit direction, same session, in two passes
 * — the first pass covered color/size/spacing; a follow-up, same day,
 * caught two more real mismatches: border-radius (8px vs. the reference's
 * 4px) and hover behavior (the reference's icon+text switch to brand color
 * on hover; this button's didn't change color at all)) — read the
 * reference's real computed style directly rather than guessing:
 * `color: gray.700` (byte-identical to `text.secondary`), `font-size: 12px`
 * (`font-size.xs`), `font-weight: 700` (`font-weight.bold`),
 * `border-radius: 4px` (`radius.sm`), `height: 28px`, `padding: 0 10px`,
 * `gap: 6px`, no background/border at rest, `color: purple.600`
 * (`text.brand`) on hover — confirmed byte-identical afterward via
 * `getComputedStyle` on both buttons side by side, not just eyeballed.
 *
 * `Button`'s own `tertiary` variant (transparent background, native
 * focus-visible ring — both kept) is the base rather than a from-scratch
 * element, styled via the dedicated `.dbm-playground-reset-button` class
 * in `docs.css` — **not inline `style`, which was this component's own
 * first-pass approach and is exactly why the hover color never worked**:
 * an inline `style` attribute's specificity beats any external rule
 * regardless of pseudo-class, so a `:hover` rule in a stylesheet can never
 * override a color set via `style` on the same element, only ever a class.
 * The real CSS class's own rest-state declarations need `!important` to
 * reliably beat `Button.module.css`'s own same-specificity classes
 * (`.root`/`.sizeXs`/`.variantTertiary`, each a single class selector, same
 * weight as this one) regardless of which stylesheet happens to load
 * later in the bundle — the identical reasoning already documented for
 * `.sbdocs-content code` earlier in this file. The `:hover` rule itself
 * doesn't need `!important`: a class+pseudo-class selector is inherently
 * *more* specific than a plain class, so it wins on its own.
 *
 * The icon is composed into `children` instead of passed as `leadingIcon`
 * — `Button` always colors a `leadingIcon` via a variant-locked `tone`
 * (`iconToneForVariant`, `Button.tsx`) rather than inheriting the label's
 * own color, so it would stay brand-purple regardless of any override on
 * the button itself, confirmed by reading `Button.tsx` directly. Deliberately
 * given no `tone` prop at all (unlike the first pass, which used
 * `tone="default"`) — `Icon`'s own doc comment states it inherits
 * `currentColor` when `tone` is omitted, which is exactly what makes the
 * icon track the button's own color automatically, hover included, with
 * no separate icon-specific override needed.
 *
 * `border-radius`/`height`/`padding`/`gap` are literal pixel values, not
 * `--dbm-space-*`/`--dbm-radius-*` steps — none of 4px/28px/10px/6px lands
 * on those scales, and the whole point here is matching an external
 * reference (Storybook's own manager-chrome buttons, which don't derive
 * from this system's tokens at all), not picking the nearest token and
 * accepting a visible mismatch. Same accepted-literal category as the
 * story-wrapper-sizing/media-query exceptions already documented in
 * `07-storybook-and-documentation-standards.md` §8.
 *
 * Renders nothing at all — no card, no "Reset to defaults" — when a
 * component has zero genuinely live-editable props after `exclude`/
 * `control: false` filtering (added 2026-09-06, at explicit direction, via
 * Spacer): a card with no rows inside plus a reset button with nothing to
 * reset is dead UI, not an empty-but-valid state worth showing.
 */
export function PlaygroundControls({
  of,
  exclude = [],
  order,
}: {
  of: Of;
  exclude?: string[];
  order?: string[];
}) {
  const context = useContext(DocsContext);
  const resolved = useOf(of, ["story"]);
  const story = resolved.type === "story" ? resolved.story : undefined;
  const [args, updateArgs, resetArgs] = usePlaygroundArgs(context, story);
  // What was just set, before the round trip through Storybook's channel returns it in `args`. Only the conditional
  // controls read it (below), so that turning `readOnly` on offers `count` at once rather than a few seconds later.
  const [justSet, setJustSet] = useState<Record<string, unknown>>({});

  if (!story) return null;

  const argTypes = story.argTypes as Record<string, ArgTypeLike>;
  const filtered = Object.entries(argTypes).filter(([name, argType]) => {
    if (exclude.includes(name)) return false;
    // Same redundant-comparison fix as `ControlField` above — `!argType.control`
    // alone already excludes the `false` member.
    if (!argType.control) return false;
    if (argType.control.disable) return false;
    return true;
  });
  const rows = sortEntriesByOrder(filtered, order);

  // A component with no genuinely live-editable props (every argType
  // either `exclude`d or `control: false` — e.g. Spacer, which takes no
  // props of its own) previously still rendered an empty, contentless
  // bordered card plus a "Reset to defaults" button with nothing to
  // reset — found via direct user report on Spacer's own Docs page.
  // Render nothing at all in that case, rather than dead UI.
  if (rows.length === 0) return null;

  const isShown = (argType: ArgTypeLike) => {
    const condition = argType.if;
    if (!condition) return true;
    const current = condition.arg in justSet ? justSet[condition.arg] : args[condition.arg];
    if ("eq" in condition) return current === condition.eq;
    if ("neq" in condition) return current !== condition.neq;
    if ("exists" in condition) return (current !== undefined) === condition.exists;
    return Boolean(current) === (condition.truthy ?? true);
  };

  return (
    <>
      <div
        style={{
          background: "var(--dbm-bg-surface)",
          border: "var(--dbm-border-width-1) solid var(--dbm-border-neutral-subtle)",
          borderRadius: "var(--dbm-radius-md)",
          padding: "var(--dbm-space-4)",
          width: "100%",
        }}
      >
        <div className="dbm-playground-controls-grid">
          {rows.filter(([, argType]) => isShown(argType)).map(([name, argType]) => (
            <ControlField
              key={name}
              name={name}
              argType={argType}
              value={args[name]}
              resolvedDisplayValue={argType.resolveDisplayValue?.(args)}
              onChange={(value) => {
                setJustSet((previous) => ({ ...previous, [name]: value }));
                updateArgs({ [name]: value });
              }}
            />
          ))}
        </div>
      </div>
      {/* `marginBlockStart: 6px` — measured live (getBoundingClientRect),
          not guessed: the real gap between the Canvas box's own bottom edge
          and its native "Show code" row's top edge, on the exact same Docs
          page, is 6px (Storybook's own layout gets there via a `-40px`
          margin-top on its toolbar row plus the preview's own padding, an
          internal mechanism this block doesn't replicate — matching the
          resulting visual gap is what matters, not the mechanism). */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBlockStart: "6px" }}>
        <Button
          size="xs"
          variant="tertiary"
          onClick={() => {
            setJustSet({});
            resetArgs();
          }}
          className="dbm-playground-reset-button"
        >
          <Icon icon={ArrowCounterClockwiseIcon} size="xs" />
          Reset to defaults
        </Button>
      </div>
    </>
  );
}
