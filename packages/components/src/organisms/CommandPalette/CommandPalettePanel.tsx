import { ArrowLeftIcon, CaretRightIcon, MagnifyingGlassIcon } from "@dbm-system/icons";
import { cx, useAnnouncement } from "@dbm-system/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Kbd } from "../../atoms/Kbd";
import { Spinner } from "../../atoms/Spinner";
import { Tag } from "../../atoms/Tag";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { OptionListBody } from "../../internal/optionList/OptionListBody";
import listStyles from "../../internal/optionList/OptionList.module.css";
import { buildRows, firstEnabled, isActionValue, isDisabled, lastEnabled, stepEnabled } from "../../internal/optionList/optionList.rows";
import { optionDomId, useOptionListWindow } from "../../internal/optionList/useOptionListWindow";
import styles from "./CommandPalette.module.css";
import type { CommandItem, CommandPaletteLabels, CommandPaletteProps } from "./CommandPalette.types";
import { ARGUMENT_VALUE, buildEntries, buildVisible, modeFor, problemWith } from "./commandPalette.entries";
import { keywordHints } from "./commandPalette.hints";
import { isApplePlatform } from "./commandPalette.hotkey";
import { shortcutKeys } from "./commandPalette.shortcut";
import { modeWarnings, valueWarnings } from "./commandPalette.warnings";
import { useCommandRunner } from "./useCommandRunner";
import { useHighlightReport } from "./useHighlightReport";
import { useResultAnnouncements } from "./useResultAnnouncements";
import { useWarnOnce } from "./useWarnOnce";

// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;

const NO_COMMANDS: CommandItem[] = [];

interface CommandPalettePanelProps
  extends Pick<
    CommandPaletteProps,
    | "query"
    | "defaultQuery"
    | "onQueryChange"
    | "filter"
    | "searchNested"
    | "modes"
    | "maxPerGroup"
    | "suggested"
    | "recent"
    | "loading"
    | "error"
    | "emptyContent"
    | "onSelect"
    | "onSelectError"
    | "onDisabledSelect"
    | "onHighlightChange"
    | "renderItem"
    | "highlightTone"
    | "showHints"
    | "footer"
    | "dir"
  > {
  commands: CommandItem[];
  labels: CommandPaletteLabels;
  /** Closes the palette because a command was chosen. */
  onFinish: () => void;
  /** Tells the palette whether a command that returned a promise is still working. */
  onBusyChange: (busy: boolean) => void;
}

/**
 * What is inside the dialog: the search row, the list and the footer. It mounts when the palette opens and unmounts
 * when it closes, so the search, the list on show and the highlight start afresh every time with no reset to remember.
 */
export function CommandPalettePanel({
  commands,
  labels,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  filter,
  searchNested = true,
  modes,
  maxPerGroup = 0,
  suggested,
  recent,
  loading = false,
  error = false,
  emptyContent,
  onSelect,
  onSelectError,
  onDisabledSelect,
  onHighlightChange,
  renderItem,
  highlightTone,
  showHints = true,
  footer,
  dir = "ltr",
  onFinish,
  onBusyChange,
}: CommandPalettePanelProps) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const { message, announce } = useAnnouncement();
  // The panel only ever renders in the browser (the dialog is portaled after mount), so this is read once.
  const [apple] = useState(isApplePlatform);

  // The text in the search field.
  const isQueryControlled = queryProp !== undefined;
  const [innerQuery, setInnerQuery] = useState(defaultQuery);
  const query = isQueryControlled ? queryProp : innerQuery;
  const [navigated, setNavigated] = useState<string | null>(null);
  const setQuery = (next: string) => {
    if (!isQueryControlled) setInnerQuery(next);
    if (next !== query) onQueryChange?.(next);
    setNavigated(null);
  };

  // What is on show: the top level (or a mode's commands), the commands of a list that was opened, or the entry for a
  // command that asks for a value.
  const [pageValue, setPageValue] = useState<string | null>(null);
  const page = useMemo(
    () => (pageValue === null ? undefined : commands.find((command) => command.value === pageValue && command.items)),
    [commands, pageValue],
  );
  const [argItem, setArgItem] = useState<CommandItem | null>(null);
  const mode = useMemo(() => modeFor(modes, query, page !== undefined || argItem !== null), [modes, query, page, argItem]);
  // The words searched for: the text, less a mode's prefix.
  const searchText = mode ? query.slice(mode.prefix.length) : query;
  const hasQuery = searchText.trim() !== "";
  const level = useMemo(
    () => (argItem ? NO_COMMANDS : page ? (page.items ?? NO_COMMANDS) : mode ? mode.commands : commands),
    [argItem, page, mode, commands],
  );
  const context = argItem ?? page ?? mode;

  // At the top level, a search also finds the commands inside the lists it could open.
  const searchingNested = searchNested && !page && !argItem && hasQuery && filter !== false;
  const entries = useMemo(() => buildEntries(level, searchingNested), [level, searchingNested]);

  // What is wrong with what was passed, said once in development.
  const warnOnce = useWarnOnce();
  useEffect(() => {
    for (const message of [...valueWarnings(commands, modes), ...modeWarnings(modes)]) warnOnce(message);
  }, [commands, modes, warnOnce]);
  useEffect(() => {
    if (page?.items?.some((item) => item.items !== undefined)) {
      warnOnce("CommandPalette: a command inside a list that was opened has its own `items`, which are ignored. One level of lists is supported.");
    }
  }, [page, warnOnce]);

  // The command asked a question: the one row says what Enter will do, or why it will not.
  const argumentText = argItem ? query.trim() : "";
  const argumentProblem = argItem ? problemWith(argItem, argumentText, labels, warnOnce) : undefined;

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const { visible, moreRows } = useMemo(
    () =>
      buildVisible({
        argument: argItem ? { item: argItem, text: argumentText, problem: argumentProblem } : undefined,
        entries,
        filter,
        searchText,
        hasQuery,
        topLevel: !page && !mode,
        recent,
        suggested,
        maxPerGroup,
        expanded,
        labels,
        warn: warnOnce,
      }),
    [argItem, argumentText, argumentProblem, entries, filter, searchText, hasQuery, page, mode, recent, suggested, maxPerGroup, expanded, labels, warnOnce],
  );
  const { rows, flat } = useMemo(() => buildRows(visible), [visible]);
  const hasIcons = useMemo(() => flat.some((item) => !isActionValue(item.value) && item.icon !== undefined), [flat]);
  const resultCount = useMemo(() => flat.filter((item) => !isActionValue(item.value)).length, [flat]);

  // The highlight: the option the person moved to, or the first one that can be run.
  const highlighted = useMemo(() => {
    if (navigated !== null) {
      const index = flat.findIndex((item) => item.value === navigated);
      if (index !== -1) return index;
    }
    return firstEnabled(flat);
  }, [flat, navigated]);
  const listWindow = useOptionListWindow({ open: true, rows, size: "md", highlighted, listId });
  const moveHighlight = (index: number) => {
    const item = flat[index];
    if (!item) return;
    listWindow.reveal(index);
    setNavigated(item.value);
  };
  useHighlightReport(highlighted === -1 ? null : (entries.get((flat[highlighted] as CommandItem).value)?.item ?? null), onHighlightChange);
  useResultAnnouncements({ asking: argItem !== null, hasQuery, searchText, pageValue, mode, resultCount, loading, error, labels, announce });

  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  const openPage = (item: CommandItem) => {
    setPageValue(item.value);
    setQuery("");
    focusInput();
  };
  const openArgument = (item: CommandItem) => {
    setArgItem(item);
    setQuery(item.argument?.initialValue ?? "");
    focusInput();
  };
  const goBack = () => {
    if (argItem) setArgItem(null);
    else setPageValue(null);
    setQuery("");
    focusInput();
  };

  const { pending, pendingRef, run } = useCommandRunner({ labels, query, announce, onSelect, onSelectError, onFinish, onBusyChange });
  const choose = (option: { value: string }) => {
    if (pendingRef.current) return;
    const more = moreRows.get(option.value);
    if (more) {
      setExpanded((current) => new Set([...current, more.group]));
      setNavigated(more.first);
      return;
    }
    if (option.value === ARGUMENT_VALUE) {
      if (argItem && argumentProblem === undefined) run(argItem, argumentText);
      return;
    }
    const entry = entries.get(option.value);
    if (!entry) return;
    if (isDisabled(entry.item)) {
      const reason = entry.item.disabled;
      onDisabledSelect?.(entry.item, typeof reason === "string" ? { reason } : {});
      return;
    }
    if (entry.item.items !== undefined && !page && !entry.parent) openPage(entry.item);
    else if (entry.item.argument !== undefined) openArgument(entry.item);
    else run(entry.item);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const key = event.key;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      const direction = key === "ArrowDown" ? 1 : -1;
      const next = highlighted === -1 ? (direction === 1 ? firstEnabled(flat) : lastEnabled(flat)) : stepEnabled(flat, highlighted, direction);
      if (next !== -1) moveHighlight(next);
      return;
    }
    if (key === "PageDown" || key === "PageUp") {
      event.preventDefault();
      const direction = key === "PageDown" ? 1 : -1;
      const from = highlighted === -1 ? (direction === 1 ? -1 : flat.length) : highlighted;
      let next = Math.min(flat.length - 1, Math.max(0, from + direction * PAGE_STEP));
      while (next >= 0 && next < flat.length && isDisabled(flat[next] as CommandItem)) next += direction;
      if (next >= 0 && next < flat.length) moveHighlight(next);
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      const option = highlighted === -1 ? undefined : flat[highlighted];
      if (option) choose(option);
      return;
    }
    if (key === "Backspace" && query === "" && (page || argItem)) {
      event.preventDefault();
      goBack();
      return;
    }
    // The key that points on, when the caret is already at the end of the text, opens the highlighted command's list or
    // asks for its value (Tab is left to move focus, so no one is held in the field).
    if (key === (dir === "rtl" ? "ArrowLeft" : "ArrowRight") && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const field = event.currentTarget;
      const atEnd = field.selectionStart === field.value.length && field.selectionEnd === field.value.length;
      const option = highlighted === -1 ? undefined : flat[highlighted];
      const item = option ? entries.get(option.value)?.item : undefined;
      if (atEnd && item && !argItem && (item.argument !== undefined || (item.items !== undefined && !page && !entries.get(option?.value ?? "")?.parent))) {
        event.preventDefault();
        choose(option as CommandItem);
      }
    }
  };

  const renderTrailing = (option: CommandItem, state: { highlighted: boolean }) => {
    // Every row that can run holds room for the Enter key, drawn only on the highlighted one, so the labels don't
    // change width as the highlight moves.
    const enterHint =
      showHints && !isDisabled(option) ? (
        <Kbd aria-hidden="true" className={cx(styles.enterHint, !state.highlighted && styles.enterHintIdle)}>
          ↵
        </Kbd>
      ) : null;
    if (option.value === ARGUMENT_VALUE) {
      return (
        <span className={styles.trailing}>{pending === ARGUMENT_VALUE ? <Spinner size="xs" tone="default" /> : enterHint}</span>
      );
    }
    const entry = entries.get(option.value);
    if (!entry) return null;
    const { item, parent } = entry;
    if (pending === item.value) return <Spinner size="xs" tone="default" className={styles.trailing} />;
    const keys = item.shortcut === undefined ? [] : shortcutKeys(item.shortcut, apple);
    const opensList = item.items !== undefined && !page && !parent;
    const hints = hasQuery ? keywordHints(item, searchText, parent?.label) : [];
    if (keys.length === 0 && !opensList && hints.length === 0 && !enterHint) return null;
    return (
      <span className={styles.trailing}>
        {hints.length > 0 ? <span className={styles.matchHint}>{`“${hints.join(", ")}”`}</span> : null}
        {keys.map((key, index) => (
          <Kbd key={`${key.text}-${index}`} aria-label={key.label} className={styles.shortcutKey}>
            {key.text}
          </Kbd>
        ))}
        {opensList ? <Icon icon={CaretRightIcon} size="sm" tone="secondary" className={styles.chevron} /> : null}
        {enterHint}
      </span>
    );
  };

  const emptyMessage = loading ? labels.loading : (page?.emptyContent ?? mode?.emptyContent ?? emptyContent ?? labels.noResults);
  const placeholder = argItem?.argument?.placeholder ?? page?.placeholder ?? mode?.placeholder ?? labels.placeholder;
  const backLabel = (argItem ?? page)?.label;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        {argItem || page ? (
          <IconButton icon={ArrowLeftIcon} aria-label={labels.back} variant="ghost" size="sm" className={styles.back} onClick={goBack} />
        ) : (
          <Icon icon={MagnifyingGlassIcon} size="md" tone="secondary" className={styles.searchIcon} />
        )}
        {backLabel ? (
          <Tag size="sm" tone="neutral" className={styles.pageTag}>
            {backLabel}
          </Tag>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={query}
          placeholder={placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          role="combobox"
          aria-label={context ? labels.searchIn(context.label) : labels.search}
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={listWindow.activeRendered ? optionDomId(listId, highlighted) : undefined}
        />
        {loading ? <Spinner size="sm" tone="default" /> : null}
      </div>
      {/* The list never takes focus from the field: a press on it is not the field losing it. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keeps focus in the search field; the rows are chosen through it (the ARIA combobox pattern). */}
      <div className={cx(styles.results, listStyles.sizeMd)} onMouseDown={(event) => event.preventDefault()}>
        <OptionListBody<CommandItem>
          listId={listId}
          size="md"
          rows={listWindow.drawn}
          windowed={listWindow.drawing}
          windowStyle={listWindow.windowStyle}
          optionCount={flat.length}
          highlighted={highlighted}
          isSelected={() => false}
          onChoose={choose}
          onHover={(item) => {
            if (navigated !== item.value) setNavigated(item.value);
          }}
          markText={argItem ? "" : searchText}
          highlightTone={highlightTone}
          hasIcons={hasIcons}
          renderOption={renderItem ? (item, state) => renderItem(entries.get(item.value)?.item ?? item, { highlighted: state.highlighted }) : undefined}
          renderTrailing={renderTrailing}
          emptyMessage={emptyMessage}
          loading={loading}
          ariaLabel={context ? context.label : labels.title}
          ariaLabelledBy={undefined}
          setListRef={listWindow.setListRef}
        />
      </div>
      {error ? <div className={listStyles.footer}>{labels.error}</div> : null}
      {showHints || footer ? (
        <div className={styles.footer}>
          {showHints ? (
            <div className={styles.hints} aria-hidden="true">
              <span className={styles.hint}>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                {labels.hintNavigate}
              </span>
              <span className={styles.hint}>
                <Kbd>↵</Kbd>
                {labels.hintSelect}
              </span>
              <span className={styles.hint}>
                <Kbd>Esc</Kbd>
                {labels.hintClose}
              </span>
              {modes && !context
                ? modes.map((candidate) => (
                    <span key={candidate.prefix} className={styles.hint}>
                      <Kbd>{candidate.prefix}</Kbd>
                      {candidate.label}
                    </span>
                  ))
                : null}
            </div>
          ) : null}
          {footer ? <div className={styles.footerExtra}>{footer}</div> : null}
        </div>
      ) : null}
      <VisuallyHidden role="status">{message}</VisuallyHidden>
    </div>
  );
}
