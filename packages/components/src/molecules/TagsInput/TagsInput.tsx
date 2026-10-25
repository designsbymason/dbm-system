import { XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { FieldError } from "../../atoms/FieldError";
import { Icon } from "../../atoms/Icon";
import type { InputSize } from "../../atoms/Input";
import { Tag } from "../../atoms/Tag";
import type { TagSize } from "../../atoms/Tag";
import { TooltipProvider } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./TagsInput.module.css";
import { TagsInputChip } from "./TagsInputChip";
import { fitCount } from "./fitCount";
import type { TagsInputAddSource, TagsInputLabels, TagsInputProps } from "./TagsInput.types";

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One step below the field, as `TableToolbar`'s chips are, so a row of them sits inside the box.
const tagSizeFor: Record<InputSize, TagSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
const iconSizeFor: Record<InputSize, "xs" | "sm" | "md" | "lg" | "xl"> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };

const warned = new Set<string>();
function warnOnce(message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

const escapeForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The consumer's `validate`, untrusted: a throw or a non-string accepts the tag, with a development warning. */
function runValidate(validate: TagsInputProps["validate"], tag: string): string | undefined {
  if (!validate) return undefined;
  try {
    const result = validate(tag);
    return typeof result === "string" && result !== "" ? result : undefined;
  } catch (thrown) {
    warnOnce(`TagsInput: \`validate\` threw (${String(thrown)}); the tag was accepted. Return a message instead of throwing.`);
    return undefined;
  }
}

type PendingFocus = { kind: "entry" } | { kind: "chip"; index: number } | null;

/**
 * A field that holds a list of short values as removable chips. Type a value and press Enter, or type a
 * separator, or paste a list: each piece becomes a chip. Backspace on an empty entry removes the last one. The
 * value is a `string[]`; `name` submits each tag as its own value.
 *
 * The chips are `Tag`s with real, named remove buttons, in a list; the entry is a single real `<input>` at the
 * end of them, in the same bordered box, so a row of chips wraps and the typing area follows. The field is one
 * tab stop: the left arrow key moves from the entry into the chips, the arrow keys move among them, and Delete
 * removes one. Adding, removing and refusing are announced. `ref`, `id`, `data-testid` and the `aria-*` props go
 * to the entry `<input>`; `className` and `style` go to the outer box.
 *
 * @example
 * ```tsx
 * <TagsInput aria-label="Recipients" placeholder="Add an email" onValueChange={setEmails} />
 * <TagsInput aria-label="Labels" defaultValue={["urgent", "design"]} maxTags={5} showCount />
 * <TagsInput aria-label="Emails" invalidBehavior="flag" validate={(tag) => (tag.includes("@") ? undefined : "Not an email address")} />
 * <FormField label="Tags">{(fieldProps) => <TagsInput {...fieldProps} name="tags" />}</FormField>
 * ```
 */
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      inputValue,
      defaultInputValue = "",
      onInputValueChange,
      placeholder,
      size = "md",
      tone = "brand",
      variant = "subtle",
      separators = [","],
      addOnBlur = true,
      invalidBehavior = "refuse",
      allowDuplicates = false,
      maxTags,
      maxTagLength,
      showCount = false,
      overflow = "wrap",
      maxVisible,
      onTagAdd,
      onTagRemove,
      transform,
      validate,
      clearable = false,
      required = false,
      hasError = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      autoComplete,
      inputMode,
      enterKeyHint = "done",
      spellCheck,
      autoCapitalize,
      formatNumber = String,
      labels: labelOverrides,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      id,
      className,
      style,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const defaultLabels: TagsInputLabels = {
      remove: (tag) => `Remove ${tag}`,
      clear: "Clear all",
      added: (tag) => `${tag} added`,
      removed: (tag) => `${tag} removed`,
      duplicate: (tag) => `${tag} is already added`,
      tooLong: (tag, max) => `${tag} is longer than ${formatNumber(max)} characters`,
      maxReached: (max) => `No more than ${formatNumber(max)} tags`,
      pasted: (added, refused) => `${formatNumber(added)} added, ${formatNumber(refused)} not added`,
      required: "Add at least one tag",
      flagged: (tag, reason) => `${tag} added, not valid: ${reason}`,
      invalid: "Remove or correct the tags that are not valid",
      more: (hidden) => `+${formatNumber(hidden)} more`,
      less: "Show less",
      chipsHint: "Use the left arrow key to move to the tags",
    };
    const labels = mergeDefined(defaultLabels, labelOverrides);

    const isValueControlled = value !== undefined;
    const [uncontrolledTags, setUncontrolledTags] = useState<string[]>(defaultValue ?? []);
    // A value that isn't an array of strings (untyped data on its way) reads as empty rather than throwing.
    const rawTags = isValueControlled ? value : uncontrolledTags;
    const tags = useMemo(
      () => (Array.isArray(rawTags) ? rawTags.filter((tag): tag is string => typeof tag === "string") : []),
      [rawTags],
    );

    // Which tags are flagged, worked out from `validate` so a tag that came in through `value` is flagged too.
    const reasons = useMemo(
      () => tags.map((tag) => (invalidBehavior === "flag" ? runValidate(validate, tag) : undefined)),
      [tags, validate, invalidBehavior],
    );
    const flaggedCount = reasons.filter(Boolean).length;

    const isInputControlled = inputValue !== undefined;
    const [uncontrolledText, setUncontrolledText] = useState(defaultInputValue);
    const text = isInputControlled ? inputValue : uncontrolledText;

    const [message, setMessage] = useState<string | undefined>(undefined);
    const { message: announcement, announce } = useAnnouncement();

    // `maxVisible`: collapsed only while neither the entry nor a chip has focus, and not opened with "+N more".
    const [engaged, setEngaged] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // `overflow="collapse"`: how many chips fit on the one line, measured from an unseen copy of them.
    const [fitting, setFitting] = useState<number | null>(null);
    const collapseMode = overflow === "collapse";

    const reactId = useId();
    const errorId = `${reactId}-error`;
    const hintId = `${reactId}-hint`;

    const boxRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const entryRef = useRef<HTMLInputElement>(null);
    const validityRef = useRef<HTMLInputElement>(null);
    const measurerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<() => void>(() => undefined);
    const composing = useRef(false);
    // Where focus goes once a chip is gone: never to a place the person left.
    const pendingFocus = useRef<PendingFocus>(null);
    // Set by a key press on a chip's remove button, so its click moves focus along the row, not to the entry.
    const keyboardRemoval = useRef(false);

    const canEdit = !disabled && !readOnly;

    const setTags = (next: string[]) => {
      if (!isValueControlled) setUncontrolledTags(next);
      onValueChange?.(next);
    };

    const setText = (next: string) => {
      if (!isInputControlled) setUncontrolledText(next);
      onInputValueChange?.(next);
    };

    // The consumer's functions are untrusted: a throw falls back to the plain behaviour with a warning.
    const normalize = (raw: string): string => {
      if (!transform) return raw.trim();
      try {
        const result = transform(raw);
        return typeof result === "string" ? result : raw.trim();
      } catch (thrown) {
        warnOnce(`TagsInput: \`transform\` threw (${String(thrown)}); the text was trimmed instead.`);
        return raw.trim();
      }
    };

    /** Adds each piece in turn against the list as it grows, and says what happened. */
    const addPieces = (pieces: string[], source: TagsInputAddSource): { added: string[]; refused: string[] } => {
      const next = [...tags];
      const added: string[] = [];
      const flagged: Array<{ tag: string; reason: string }> = [];
      const refused: string[] = [];
      for (const piece of pieces) {
        const tag = normalize(piece);
        if (tag === "") continue;
        if (maxTags !== undefined && next.length >= maxTags) {
          refused.push(labels.maxReached(maxTags));
          break;
        }
        if (maxTagLength !== undefined && tag.length > maxTagLength) {
          refused.push(labels.tooLong(tag, maxTagLength));
          continue;
        }
        if (!allowDuplicates && next.includes(tag)) {
          refused.push(labels.duplicate(tag));
          continue;
        }
        const reason = runValidate(validate, tag);
        if (reason && invalidBehavior === "refuse") {
          refused.push(reason);
          continue;
        }
        if (reason) flagged.push({ tag, reason });
        next.push(tag);
        added.push(tag);
      }
      if (added.length > 0) {
        setTags(next);
        for (const tag of added) onTagAdd?.(tag, { source });
      }
      if (pieces.length > 1 && (added.length > 0 || refused.length > 0)) {
        announce(labels.pasted(added.length, refused.length));
      } else if (added.length === 1) {
        const hit = flagged[0];
        announce(hit ? labels.flagged(hit.tag, hit.reason) : labels.added(added[0] as string));
      } else if (refused.length > 0) announce(refused[0] as string);
      setMessage(refused[0]);
      return { added, refused };
    };

    const removeAt = (index: number, source: "backspace" | "button" | "keyboard") => {
      const tag = tags[index];
      if (tag === undefined) return;
      setTags(tags.filter((_, position) => position !== index));
      onTagRemove?.(tag, { index, source });
      announce(labels.removed(tag));
      setMessage(undefined);
    };

    const chipButtons = () =>
      Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("li[role=listitem] button") ?? []);

    const focusIsInBox = () => Boolean(boxRef.current && boxRef.current.contains(document.activeElement));

    const removeFromChip = (index: number) => {
      // A key press keeps the person's place along the row; a pointer press hands the typing back to the entry.
      const viaKeyboard = keyboardRemoval.current;
      keyboardRemoval.current = false;
      if (focusIsInBox()) pendingFocus.current = viaKeyboard ? { kind: "chip", index } : { kind: "entry" };
      removeAt(index, viaKeyboard ? "keyboard" : "button");
    };

    useLayoutEffect(() => {
      const target = pendingFocus.current;
      if (!target) return;
      pendingFocus.current = null;
      if (target.kind === "chip") {
        const buttons = chipButtons();
        const next = buttons[Math.min(target.index, buttons.length - 1)];
        if (next) {
          next.focus();
          return;
        }
      }
      entryRef.current?.focus();
    }, [tags.length]);

    // An empty string would match everywhere and turn every character into a tag: it is no separator.
    const usableSeparators = (Array.isArray(separators) ? separators : []).filter(
      (separator): separator is string => typeof separator === "string" && separator !== "",
    );
    const separatorSource = usableSeparators.map(escapeForPattern).join("|");
    const separatorPattern = usableSeparators.length > 0 ? new RegExp(separatorSource) : null;
    const pastePattern = new RegExp([...usableSeparators.map(escapeForPattern), "\\r?\\n", "\\t"].join("|"));

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      if (message) setMessage(undefined);
      if (!separatorPattern || composing.current || !separatorPattern.test(next)) {
        setText(next);
        return;
      }
      // A separator was typed (or arrived inside a paste the browser handled): everything before the last one is
      // complete, whatever follows it is still being typed.
      const pieces = next.split(new RegExp(separatorSource, "g"));
      const rest = pieces.pop() ?? "";
      const { refused } = addPieces(pieces, "separator");
      // A single typed piece that was refused stays in the entry, with its message, so it can be fixed.
      setText(pieces.length === 1 && refused.length > 0 ? (pieces[0] as string) : rest);
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text");
      if (!pastePattern.test(pasted)) return;
      event.preventDefault();
      // The pasted text goes in where the caret (or the selection) is, then everything is split.
      const field = event.currentTarget;
      const start = Math.min(field.selectionStart ?? text.length, text.length);
      const end = Math.min(field.selectionEnd ?? start, text.length);
      const pieces = (text.slice(0, start) + pasted + text.slice(end)).split(new RegExp(pastePattern.source, "g"));
      addPieces(pieces, "paste");
      setText("");
    };

    const isRtl = () => (boxRef.current ? getComputedStyle(boxRef.current).direction === "rtl" : false);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      // An Enter or a separator that picks an input-method candidate isn't a tag.
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === "Enter") {
        if (text.trim() === "") return;
        event.preventDefault();
        const { refused } = addPieces([text], "enter");
        if (refused.length === 0) setText("");
        return;
      }
      if (event.key === "Backspace" && text === "" && tags.length > 0) {
        event.preventDefault();
        removeAt(tags.length - 1, "backspace");
        return;
      }
      // Toward the chips (the left arrow in a left-to-right page), from the very start of the entry.
      const toward = isRtl() ? "ArrowRight" : "ArrowLeft";
      const field = event.currentTarget;
      const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (plain && event.key === toward && field.selectionStart === 0 && field.selectionEnd === 0) {
        const buttons = chipButtons();
        const last = buttons[buttons.length - 1];
        if (last) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (event.key === "Escape" && text !== "") {
        // Only while there is text to clear: the key belongs to this field, not to whatever it sits in.
        event.preventDefault();
        event.stopPropagation();
        setText("");
        setMessage(undefined);
      }
    };

    // Arrow keys move among the chips, Home and End go to the ends, Delete or Backspace remove the one that has
    // focus; past the last chip the entry takes focus again. The chips are not tab stops.
    const handleChipKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
      const target = event.target as HTMLElement;
      const buttons = chipButtons();
      const index = buttons.indexOf(target as HTMLButtonElement);
      if (index === -1) return;
      const rtl = isRtl();
      const previousKey = rtl ? "ArrowRight" : "ArrowLeft";
      const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
      if (event.key === previousKey) {
        event.preventDefault();
        buttons[Math.max(0, index - 1)]?.focus();
      } else if (event.key === nextKey) {
        event.preventDefault();
        if (index < buttons.length - 1) buttons[index + 1]?.focus();
        else entryRef.current?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        buttons[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (!canEdit) return;
        pendingFocus.current = { kind: "chip", index };
        removeAt(index, "keyboard");
      } else if (event.key === "Enter" || event.key === " ") {
        // The button's own activation removes it; this keeps the person's place along the row afterwards.
        keyboardRemoval.current = true;
      } else if (event.key === "Escape") {
        // The key belongs to this field, not to whatever it sits in.
        event.preventDefault();
        event.stopPropagation();
        entryRef.current?.focus();
      }
    };

    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      setEngaged(target === entryRef.current || Boolean(target.closest("li[role=listitem]")));
    };

    // The field is one thing to its owner: leaving the whole box (not moving between a chip's button and the
    // entry) makes a tag of what was typed. A press elsewhere gives no relatedTarget, so look again once it settles.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      const box = event.currentTarget;
      const next = event.relatedTarget as Node | null;
      if (next && box.contains(next)) return;
      const leave = () => {
        if (box.contains(document.activeElement)) return;
        setEngaged(false);
        if (!addOnBlur || disabled || readOnly) return;
        if (entryRef.current && entryRef.current.value.trim() !== "") {
          const { refused } = addPieces([entryRef.current.value], "blur");
          if (refused.length === 0) setText("");
        }
      };
      if (next) leave();
      else queueMicrotask(leave);
    };

    // A press anywhere in the box that isn't on a control puts the caret in the entry, as in a plain field.
    const handleBoxMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target === entryRef.current || target.closest("button, a, input, [role=button]")) return;
      event.preventDefault();
      entryRef.current?.focus();
    };

    // Collapse mode: how many chips fit on one line beside the button. Read from an unseen copy of every chip
    // (their natural widths, which the visible, cut ones can't give) and the "+N more" button at its widest.
    const measure = () => {
      const box = boxRef.current;
      const measurer = measurerRef.current;
      if (!collapseMode || !box || !measurer) return;
      const items = Array.from(measurer.children) as HTMLElement[];
      const more = items.pop();
      const widths = items.map((item) => item.getBoundingClientRect().width);
      const style = getComputedStyle(box);
      const gap = parseFloat(style.columnGap) || 0;
      const inner = box.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      // What else shares the line: the counter and the clear-all button; the entry gives up its room while idle.
      const rest = Array.from(box.children).filter(
        (child) => child instanceof HTMLElement && (child.dataset.reserve === "true"),
      ) as HTMLElement[];
      const reserved = rest.reduce((sum, child) => sum + child.getBoundingClientRect().width + gap, 0);
      const count = fitCount(widths, more ? more.getBoundingClientRect().width : 0, inner - reserved, gap);
      setFitting((current) => (current === count ? current : count));
    };
    useLayoutEffect(() => {
      measureRef.current = measure;
      measure();
    });
    useEffect(() => {
      if (!collapseMode || typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(() => measureRef.current());
      if (boxRef.current) observer.observe(boxRef.current);
      if (measurerRef.current) observer.observe(measurerRef.current);
      return () => observer.disconnect();
    }, [collapseMode]);

    // Flagged tags make the field refuse a form's submit; so does no tag at all when it is required.
    const needsValidity = required || flaggedCount > 0;
    useEffect(() => {
      const control = validityRef.current;
      if (!control) return;
      if (flaggedCount > 0) control.setCustomValidity(labels.invalid);
      else if (required && tags.length === 0) control.setCustomValidity(labels.required);
      else control.setCustomValidity("");
    });

    if (process.env.NODE_ENV !== "production") {
      if (isValueControlled && defaultValue !== undefined) {
        warnOnce("TagsInput: both `value` and `defaultValue` were passed; `defaultValue` is ignored once the field is controlled. Pass one.");
      }
      if (isInputControlled && defaultInputValue !== "") {
        warnOnce("TagsInput: both `inputValue` and `defaultInputValue` were passed; `defaultInputValue` is ignored once the typed text is controlled. Pass one.");
      }
      if (showCount && maxTags === undefined) {
        warnOnce("TagsInput: `showCount` has nothing to show without `maxTags`, which gives the count its maximum. Pass `maxTags`, or remove `showCount`.");
      }
      if (usableSeparators.length !== separators.length) {
        warnOnce("TagsInput: an empty string was passed in `separators`, which would match everywhere; it was ignored. Pass the characters that end a tag.");
      }
    }

    if (process.env.NODE_ENV !== "production" && !ariaLabel && !ariaLabelledBy) {
      warnOnce(
        "TagsInput: no accessible name. Pass `aria-label` or `aria-labelledby`, or put it in a `FormField`, so the group and the entry have a name.",
      );
    }

    const invalid = hasError || Boolean(message) || flaggedCount > 0;
    // The most chips the row shows while idle: a fixed number, or as many as fit (never more than a fixed cap).
    const cap = maxVisible !== undefined && maxVisible >= 0 ? maxVisible : tags.length;
    const idleCount = Math.min(tags.length, cap, collapseMode ? (fitting ?? tags.length) : tags.length);
    const overflowing = idleCount < tags.length;
    const collapsed = overflowing && !expanded && !engaged;
    // In collapse mode the row is one line whenever the field is idle, even when everything fits.
    const idleLine = collapseMode && !expanded && !engaged;
    const visibleCount = collapsed ? idleCount : tags.length;
    const hiddenCount = tags.length - visibleCount;
    const describedBy =
      [ariaDescribedBy, message ? errorId : undefined, tags.length > 0 && canEdit ? hintId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;
    const groupDescribedBy = [ariaDescribedBy, message ? errorId : undefined].filter(Boolean).join(" ") || undefined;
    const showCounter = showCount && maxTags !== undefined;

    return (
      <div {...props} className={cx(styles.root, sizeClass[size], className)} style={style}>
        {/* The mousedown only hands focus to the entry, which is itself fully keyboard-operable. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a hit-area extension of the entry, as `Input`'s box is */}
        <div
          ref={boxRef}
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={groupDescribedBy}
          aria-disabled={disabled || undefined}
          className={cx(
            styles.box,
            invalid && styles.invalid,
            disabled && styles.disabled,
            (collapsed || idleLine) && styles.collapsed,
            idleLine && styles.oneLine,
            tags.length === 0 && styles.noTags,
          )}
          onMouseDown={handleBoxMouseDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {/* The explicit roles are deliberate: Safari with VoiceOver stops treating a list as one under
              `list-style: none` (05-component-api-conventions.md §6), which the lint rule calls redundant.
              The key handler only moves focus among the chips' own buttons, which are real controls. */}
          <TooltipProvider>
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles, jsx-a11y/no-noninteractive-element-interactions */}
            <ul ref={listRef} role="list" className={styles.list} onKeyDown={handleChipKeyDown}>
            {/* A chip drawn but never seen, so the row is as tall as a chip with none in it and adding the first
                does not move what is below. Hidden from everything: no tab stop, no accessible name, no width. */}
            <li aria-hidden="true" className={styles.sizer}>
              <Tag removable removeTabStop={false} size={tagSizeFor[size]}>
                {" "}
              </Tag>
            </li>
            {tags.slice(0, visibleCount).map((tag, index) => {
              const reason = reasons[index];
              return (
                <TagsInputChip
                  key={`${index}-${tag}`}
                  tag={tag}
                  reason={reason}
                  tone={tone}
                  variant={variant}
                  size={tagSizeFor[size]}
                  removable={canEdit}
                  removeLabel={labels.remove(tag)}
                  onRemove={() => removeFromChip(index)}
                />
              );
            })}
            </ul>
          </TooltipProvider>
          {collapsed && (
            <Tag
              className={styles.more}
              tone={tone}
              variant={variant}
              size={tagSizeFor[size]}
              aria-expanded={false}
              onClick={() => setExpanded(true)}
            >
              <span className={styles.chipLabel}>{labels.more(hiddenCount)}</span>
            </Tag>
          )}
          {!collapsed && expanded && overflowing && (
            <Tag
              className={styles.more}
              tone={tone}
              variant={variant}
              size={tagSizeFor[size]}
              aria-expanded={true}
              onClick={() => setExpanded(false)}
            >
              <span className={styles.chipLabel}>{labels.less}</span>
            </Tag>
          )}
          <div className={styles.entryItem}>
            <input
              ref={mergeRefs(ref, entryRef)}
              type="text"
              id={id}
              data-testid={dataTestId}
              className={styles.entry}
              value={text}
              placeholder={tags.length === 0 ? placeholder : undefined}
              disabled={disabled}
              readOnly={readOnly}
              maxLength={maxTagLength}
              autoComplete={autoComplete}
              inputMode={inputMode}
              enterKeyHint={enterKeyHint}
              spellCheck={spellCheck}
              autoCapitalize={autoCapitalize}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
            />
          </div>
          {showCounter && (
            <span className={styles.count} data-reserve="true">
              {formatNumber(tags.length)}/{formatNumber(maxTags)}
            </span>
          )}
          {clearable && canEdit && tags.length > 0 && (
            <button
              type="button"
              className={styles.clear}
              data-reserve="true"
              aria-label={labels.clear}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                // The button unmounts with the last tag; a person who was in the field keeps their place.
                if (focusIsInBox()) pendingFocus.current = { kind: "entry" };
                tags.forEach((tag, index) => onTagRemove?.(tag, { index, source: "clear" }));
                setTags([]);
                announce(labels.clear);
                setMessage(undefined);
              }}
            >
              <Icon icon={XIcon} size={iconSizeFor[size]} tone="default" />
            </button>
          )}
          {collapseMode && (
            <div aria-hidden="true" className={styles.measurerFrame}>
              <div ref={measurerRef} className={styles.measurer}>
                {tags.map((tag, index) => (
                  <Tag key={`${index}-${tag}`} tone={tone} variant={variant} size={tagSizeFor[size]} removable={canEdit}>
                    {tag}
                  </Tag>
                ))}
                <Tag tone={tone} variant={variant} size={tagSizeFor[size]}>
                  {labels.more(Math.max(tags.length, 1))}
                </Tag>
              </div>
            </div>
          )}
        </div>
        {message && (
          <FieldError id={errorId} className={styles.message}>
            {message}
          </FieldError>
        )}
        {tags.length > 0 && canEdit && <VisuallyHidden id={hintId}>{labels.chipsHint}</VisuallyHidden>}
        {name &&
          tags.map((tag, index) => (
            <input key={`${index}-${tag}`} type="hidden" name={name} form={form} value={tag} disabled={disabled} />
          ))}
        {/* A visually hidden, real control, so a surrounding form can refuse an empty required field or one
            that still holds flagged tags. */}
        {needsValidity && (
          <input
            ref={validityRef}
            className={styles.validity}
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            required
            form={form}
            value={tags.length > 0 ? "1" : ""}
            // Not read-only: a read-only control is barred from constraint validation, which is its whole job.
            onChange={() => undefined}
            onFocus={() => entryRef.current?.focus()}
          />
        )}
        {/* In the page before it has anything to say, so changes are announced. */}
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      </div>
    );
  },
);

TagsInput.displayName = "TagsInput";
