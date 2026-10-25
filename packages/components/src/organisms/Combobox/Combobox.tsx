import { CaretDownIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Input } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { AdornmentButton, Adornments } from "../../internal/optionList/AdornmentButton";
import { defaultFilter, fold } from "../../internal/optionList/optionList.match";
import {
  buildRows,
  CREATE_VALUE,
  firstEnabled,
  isDisabled,
  lastEnabled,
  stepEnabled,
} from "../../internal/optionList/optionList.rows";
import { OptionListPanel } from "../../internal/optionList/OptionListPanel";
import { useOptionListLayout } from "../../internal/optionList/useOptionListLayout";
import { optionDomId, useOptionListWindow } from "../../internal/optionList/useOptionListWindow";
import styles from "./Combobox.module.css";
import type {
  ComboboxInputChangeReason,
  ComboboxLabels,
  ComboboxOption,
  ComboboxProps,
} from "./Combobox.types";

// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;

const buildDefaultLabels = (formatNumber: (value: number) => string): ComboboxLabels => ({
  clear: "Clear",
  toggle: "Toggle options",
  noResults: "No results",
  loading: "Loading…",
  error: "Something went wrong. Try again.",
  results: (count) => `${formatNumber(count)} ${count === 1 ? "result" : "results"} available`,
  pickAnOption: "Choose one of the options",
  create: (text) => `Create “${text}”`,
  typeToSearch: "Type to search",
});

const ignoreChange = () => undefined;

// The default for `options`: one array, so an omitted prop doesn't make the memos below recompute on every render.
const NO_OPTIONS: ComboboxOption[] = [];

/**
 * A text field with a list of options under it: type to narrow the list, then choose one with the keyboard, a
 * mouse or a finger. A single-select combobox — the value is one option's `value`, and the field shows its label.
 * "Autocomplete" is the same control. Focus stays in the field while the list is open; the highlighted option is
 * pointed at with `aria-activedescendant`.
 *
 * The options are an `options` array rather than child parts, so the list can be filtered, counted, announced,
 * fetched as the person types and drawn a window at a time when it is long. By default the value is always one of
 * the options: text that matches none is put back to the last choice when the field is left (`allowCustomValue`
 * lets the text itself be the value). The caller owns fetching: pass `filter={false}` and a new `options` array as
 * `onInputValueChange` reports typing.
 *
 * Options may carry `keywords` the default filter matches (never shown), a `description`, an `icon`, a `group` and a
 * reason for being `disabled`. `onCreate` offers a "Create …" row for text that names no option. `presentation`
 * spans the screen on a phone, and `highlightTone` adds colour to the bold match in each label.
 *
 * `ref` forwards to the native `<input>`. `className` and `style` go on the outermost box; `id`, `data-testid`,
 * `name` and the `aria-*` props go on the input. Inside a `Form`, a visually hidden input carries `name`, `required`
 * and the chosen value so the form can refuse an unchosen field.
 *
 * @example
 * ```tsx
 * <Combobox
 *   aria-label="Country"
 *   options={[
 *     { value: "ca", label: "Canada" },
 *     { value: "mx", label: "Mexico" },
 *   ]}
 *   onValueChange={(value) => setCountry(value)}
 * />
 *
 * // Options fetched as the person types
 * <Combobox
 *   aria-label="User"
 *   options={users}
 *   filter={false}
 *   loading={isFetching}
 *   onInputValueChange={(text, reason) => reason === "input" && search(text)}
 * />
 *
 * // Let a person add an item the list doesn't hold; return it so it is chosen
 * <Combobox aria-label="Label" options={labels} onCreate={(text) => addLabel(text)} />
 *
 * // Across the screen below the `sm` breakpoint
 * <Combobox aria-label="Country" options={countries} presentation={{ base: "full-width", sm: "anchored" }} />
 * ```
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options = NO_OPTIONS,
      value: valueProp,
      defaultValue = "",
      onValueChange,
      inputValue: inputValueProp,
      defaultInputValue,
      onInputValueChange,
      allowCustomValue = false,
      filter,
      autoHighlight,
      loading = false,
      error = false,
      emptyContent,
      highlightTone,
      onCreate,
      renderOption,
      clearable = false,
      onClear,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      openOnFocus = false,
      prefix,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      placeholder,
      name,
      form,
      autoComplete = "off",
      presentation = "anchored",
      side = "bottom",
      align = "start",
      container,
      dir = "ltr",
      labels: labelOverrides,
      formatNumber = String,
      id,
      className,
      style,
      onKeyDown,
      onFocus,
      onBlur,
      onClick,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `${reactId}-input`;
    const listId = `${reactId}-list`;
        const labels = useMemo(
      () => mergeDefined(buildDefaultLabels(formatNumber), labelOverrides),
      [formatNumber, labelOverrides],
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const { message: announcement, announce } = useAnnouncement();

    // Development-only warnings, each once for a mounted field.
    const warned = useRef(new Set<string>());
    const warnOnce = useCallback((message: string) => {
      if (process.env.NODE_ENV === "production" || warned.current.has(message)) return;
      warned.current.add(message);
      console.warn(message);
    }, []);
    useEffect(() => {
      if (ariaLabel || ariaLabelledBy || inputRef.current?.labels?.length) return;
      warnOnce(
        "Combobox: no accessible name. Pass `aria-label` or `aria-labelledby`, put it in a `FormField`, or point a `<label htmlFor>` at its `id`; without one a screen reader announces an unnamed combobox and an unnamed list.",
      );
    }, [ariaLabel, ariaLabelledBy, warnOnce]);
    useEffect(() => {
      const seen = new Set<string>();
      for (const option of options) {
        if (seen.has(option.value)) {
          warnOnce(
            `Combobox: more than one option has the value "${option.value}". A value must be unique: only the first can be chosen, and the rows share a key.`,
          );
        }
        seen.add(option.value);
      }
    }, [options, warnOnce]);

    // The chosen value.
    const isValueControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = useState(defaultValue);
    const value = isValueControlled ? valueProp : innerValue;
    // An option made by `onCreate` that the owner hasn't added to `options` yet still names the value.
    const [created, setCreated] = useState<ComboboxOption | undefined>();
    const [creating, setCreating] = useState(false);
    const selected = useMemo(
      () => options.find((option) => option.value === value) ?? (created?.value === value ? created : undefined),
      [options, value, created],
    );

    // The text in the field. `typed` is the text the person has entered since the last choice, `null` while the
    // field just shows the chosen option's label. Keeping it apart means a label that arrives late (a value whose
    // option isn't loaded yet) shows by itself, and a choice the owner refuses isn't left on screen.
    const [typed, setTyped] = useState<string | null>(defaultInputValue ?? null);
    const dirty = typed !== null;
    const restingText = selected?.label ?? (allowCustomValue ? value : "");
    const inputValue = inputValueProp ?? typed ?? restingText;

    // Open state.
    const isOpenControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const interactive = !disabled && !readOnly;
    const open = (isOpenControlled ? openProp : innerOpen) && interactive;
    const setOpen = useCallback(
      (next: boolean) => {
        if (next && !interactive) return;
        if (!isOpenControlled) setInnerOpen(next);
        if (next !== open) onOpenChange?.(next);
      },
      [interactive, isOpenControlled, open, onOpenChange],
    );

    const { fullWidth, panelSide, contentStyle } = useOptionListLayout({
      rootRef,
      presentation,
      open,
      side,
      align,
      warn: warnOnce,
      name: "Combobox",
    });

    // The options on show and the rows that draw them.
    const filterText = dirty ? inputValue : "";
    const visible = useMemo(() => {
      if (filter === false) return options;
      const matches = filter ?? defaultFilter;
      return options.filter((option) => matches(option, filterText));
    }, [options, filter, filterText]);
    // The "Create …" row: offered for text that names no option, once the person has typed something.
    const typedText = dirty ? inputValue.trim() : "";
    const canCreate = onCreate !== undefined;
    const foldedLabels = useMemo(
      () => (canCreate ? new Set(options.map((option) => fold(option.label))) : undefined),
      [options, canCreate],
    );
    const offersCreate = foldedLabels !== undefined && typedText !== "" && !foldedLabels.has(fold(typedText));
    const createLabel = offersCreate ? labels.create(typedText) : undefined;
    const { rows, flat } = useMemo(() => {
      const built = buildRows(visible);
      if (createLabel !== undefined) {
        const option: ComboboxOption = { value: CREATE_VALUE, label: createLabel, disabled: creating };
        built.rows.push({ kind: "option", key: "create", option, index: built.flat.length });
        built.flat.push(option);
      }
      return built;
    }, [visible, createLabel, creating]);
    const resultCount = flat.length - (createLabel === undefined ? 0 : 1);
    const hasIcons = useMemo(() => options.some((option) => option.icon !== undefined), [options]);
    // The highlight. `navigated` is the option the person moved to with a key or the pointer; until they do, the
    // highlight is the first match while typing (`autoHighlight`) and the chosen option otherwise.
    const [navigated, setNavigated] = useState<string | null>(null);
    const autoHighlightOn = autoHighlight ?? !allowCustomValue;
    const highlighted = useMemo(() => {
      if (!open) return -1;
      if (navigated !== null) {
        const index = flat.findIndex((option) => option.value === navigated);
        if (index !== -1) return index;
      }
      if (dirty) return autoHighlightOn ? firstEnabled(flat) : -1;
      const chosen = flat.findIndex((option) => option.value === value);
      return chosen !== -1 && !isDisabled(flat[chosen] as ComboboxOption) ? chosen : -1;
    }, [open, navigated, flat, dirty, autoHighlightOn, value]);

    const listWindow = useOptionListWindow({ open, rows, size, highlighted, listId });
    const moveHighlight = (index: number) => {
      const option = flat[index];
      if (!option) return;
      listWindow.reveal(index);
      setNavigated(option.value);
    };

    // Announcements: the number of matches changing while the person types. A list that merely opens, or whose
    // options are all there on arrival, is a first appearance and isn't read.
    const lastAnnounced = useRef<string>("");
    useEffect(() => {
      if (!open || !dirty) {
        lastAnnounced.current = "";
        return;
      }
      const key = `${filterText}|${resultCount}|${loading}`;
      if (key === lastAnnounced.current) return;
      lastAnnounced.current = key;
      if (!loading) announce(resultCount === 0 ? labels.noResults : labels.results(resultCount));
    }, [open, dirty, filterText, resultCount, loading, labels, announce]);
    const lastError = useRef(false);
    useEffect(() => {
      if (error && !lastError.current) announce(labels.error);
      lastError.current = error;
    }, [error, labels.error, announce]);

    // Changing things.
    const setText = (next: string, reason: ComboboxInputChangeReason) => {
      onInputValueChange?.(next, reason);
    };
    const updateValue = (next: string, option: ComboboxOption | undefined) => {
      if (!isValueControlled) setInnerValue(next);
      if (next !== value) onValueChange?.(next, option);
    };
    const choose = (option: ComboboxOption) => {
      if (isDisabled(option)) return;
      if (option.value === CREATE_VALUE) {
        runCreate();
        return;
      }
      updateValue(option.value, option);
      setTyped(null);
      setText(option.label, "select");
      setNavigated(null);
      setOpen(false);
    };
    // Asks the owner to make an option for the typed text. It may answer with the new option (chosen at once, even
    // before it is in `options`), with nothing (the owner is handling it), or with a promise of either.
    const finishCreate = (option: ComboboxOption | void) => {
      if (option) {
        setCreated(option);
        choose(option);
      } else setOpen(false);
    };
    const runCreate = () => {
      if (!onCreate || typedText === "" || creating) return;
      const result = onCreate(typedText);
      if (result && typeof (result as Promise<ComboboxOption | void>).then === "function") {
        setCreating(true);
        (result as Promise<ComboboxOption | void>).then(
          (option) => {
            setCreating(false);
            finishCreate(option);
          },
          () => {
            setCreating(false);
            announce(labels.error);
          },
        );
      } else finishCreate(result as ComboboxOption | void);
    };
    const exactMatch = (text: string) => {
      const wanted = fold(text.trim());
      return wanted === "" ? undefined : options.find((option) => !isDisabled(option) && fold(option.label) === wanted);
    };
    // Settles whatever is typed once the person is done with it (Enter, or leaving the field).
    const settle = () => {
      if (typed === null) return;
      const exact = exactMatch(typed);
      if (exact) {
        choose(exact);
        return;
      }
      if (allowCustomValue) {
        updateValue(typed, undefined);
        setTyped(null);
        return;
      }
      if (typed.trim() === "") {
        updateValue("", undefined);
        setTyped(null);
        setText("", "reset");
        return;
      }
      setTyped(null);
      setText(selected?.label ?? "", "reset");
    };
    const clear = () => {
      updateValue("", undefined);
      setTyped(null);
      setText("", "clear");
      setNavigated(null);
      onClear?.();
      inputRef.current?.focus();
    };

    // The accessible name for the list, taken from the field's own label when it isn't named with `aria-label`.
    const [fieldLabel, setFieldLabel] = useState<string | undefined>();
    const readFieldLabel = () => {
      const text = inputRef.current?.labels?.[0]?.textContent?.trim();
      setFieldLabel(text || undefined);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!interactive) return;
      setTyped(event.target.value);
      setText(event.target.value, "input");
      setNavigated(null);
      setOpen(true);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      readFieldLabel();
      if (openOnFocus) setOpen(true);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      const next = event.relatedTarget;
      if (next instanceof Node && rootRef.current?.contains(next)) return;
      settle();
      setNavigated(null);
      setOpen(false);
    };

    const handleClick = (event: MouseEvent<HTMLInputElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented && interactive && !open) setOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing || !interactive) return;
      const key = event.key;
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        const direction = key === "ArrowDown" ? 1 : -1;
        if (event.altKey) {
          setOpen(direction === 1);
          return;
        }
        if (!open) {
          setOpen(true);
          const resting = !dirty ? flat.findIndex((option) => option.value === value) : -1;
          const start = resting !== -1 ? resting : direction === 1 ? firstEnabled(flat) : lastEnabled(flat);
          if (start !== -1) moveHighlight(start);
          return;
        }
        const next = highlighted === -1 ? (direction === 1 ? firstEnabled(flat) : lastEnabled(flat)) : stepEnabled(flat, highlighted, direction);
        if (next !== -1) moveHighlight(next);
        return;
      }
      if ((key === "PageDown" || key === "PageUp") && open) {
        event.preventDefault();
        const direction = key === "PageDown" ? 1 : -1;
        const from = highlighted === -1 ? (direction === 1 ? -1 : flat.length) : highlighted;
        let next = Math.min(flat.length - 1, Math.max(0, from + direction * PAGE_STEP));
        while (next >= 0 && next < flat.length && isDisabled(flat[next] as ComboboxOption)) next += direction;
        if (next >= 0 && next < flat.length) moveHighlight(next);
        return;
      }
      if (key === "Enter" && open) {
        event.preventDefault();
        const option = highlighted === -1 ? undefined : flat[highlighted];
        if (option) choose(option);
        else {
          settle();
          setOpen(false);
        }
        return;
      }
    };

    // Radix's dismissable layer closes the list on Escape (and marks the key handled, which is why this isn't in the
    // key handler); this puts back the label of the last choice.
    const handleEscape = () => {
      if (dirty) {
        setTyped(null);
        setText(selected?.label ?? "", "reset");
      }
      setNavigated(null);
    };

    // The form control. The visible field holds text, so a form reads the chosen value (and refuses an unchosen
    // field) from a hidden input, as `TimePicker` does. With `allowCustomValue` the visible field is the control.
    const unchosenText = !allowCustomValue && dirty && inputValue.trim() !== "";
    useEffect(() => {
      hiddenRef.current?.setCustomValidity(unchosenText ? labels.pickAnOption : "");
    }, [unchosenText, labels.pickAnOption]);

    const showClear = clearable && interactive && (value !== "" || inputValue !== "");

    const hiddenControl = !allowCustomValue ? (
      <VisuallyHidden asChild>
        <input
          ref={hiddenRef}
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          name={name}
          form={form}
          value={value}
          required={required}
          disabled={disabled}
          // Not `readOnly`: a read-only input is barred from constraint validation, which is the point of this one.
          onChange={ignoreChange}
          // A form focuses an invalid control it can find; send that focus to the field a person can see.
          onFocus={() => inputRef.current?.focus()}
        />
      </VisuallyHidden>
    ) : null;

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>
          <div ref={rootRef} className={cx(styles.root, className)} style={style} dir={dir}>
            <Input
              {...rest}
              ref={mergeRefs(ref, inputRef)}
              id={inputId}
              size={size}
              prefix={prefix}
              hasError={hasError}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              autoComplete={autoComplete}
              name={allowCustomValue ? name : undefined}
              form={allowCustomValue ? form : undefined}
              value={inputValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              suffix={
                <Adornments>
                  {loading ? <Spinner size={size} tone="default" /> : null}
                  {showClear ? <AdornmentButton icon={XIcon} size={size} label={labels.clear} onClick={clear} /> : null}
                  {interactive ? (
                    <AdornmentButton
                      icon={CaretDownIcon}
                      size={size}
                      label={labels.toggle}
                      onClick={() => {
                        inputRef.current?.focus();
                        setOpen(!open);
                      }}
                    />
                  ) : null}
                </Adornments>
              }
              role="combobox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-haspopup="listbox"
              aria-expanded={open}
              // Points at the list for as long as it is in the page, which includes the moment it fades out after closing.
              aria-controls={listWindow.listElement ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={open && listWindow.activeRendered ? optionDomId(listId, highlighted) : undefined}
              required={allowCustomValue ? required : undefined}
              aria-required={required && !allowCustomValue ? true : undefined}
            />
            {hiddenControl}
            <VisuallyHidden role="status">{announcement}</VisuallyHidden>
          </div>
        </PopoverPrimitive.Anchor>
        <OptionListPanel
          listId={listId}
          size={size}
          rows={listWindow.drawn}
          windowed={listWindow.drawing}
          windowStyle={listWindow.windowStyle}
          optionCount={flat.length}
          highlighted={highlighted}
          isSelected={(option) => option.value === value}
          onChoose={choose}
          onHover={(option) => {
            if (navigated !== option.value) setNavigated(option.value);
          }}
          markText={dirty ? inputValue : ""}
          highlightTone={highlightTone}
          hasIcons={hasIcons}
          renderOption={renderOption}
          // Nothing to choose from and nothing typed is an invitation; text that matches nothing is "no results".
          emptyMessage={
            loading
              ? labels.loading
              : filterText.trim() === "" && options.length === 0
                ? labels.typeToSearch
                : (emptyContent ?? labels.noResults)
          }
          loading={loading}
          loadingMessage={labels.loading}
          errorMessage={error ? labels.error : undefined}
          ariaLabel={ariaLabel ?? fieldLabel}
          ariaLabelledBy={ariaLabelledBy}
          setListRef={listWindow.setListRef}
          fieldRef={rootRef}
          container={container}
          dir={dir}
          side={panelSide}
          align={align}
          fullWidth={fullWidth}
          contentStyle={contentStyle}
          onEscapeKeyDown={handleEscape}
        />
      </PopoverPrimitive.Root>
    );
  },
);

Combobox.displayName = "Combobox";
