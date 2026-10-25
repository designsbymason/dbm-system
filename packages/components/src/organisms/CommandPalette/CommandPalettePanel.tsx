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
import type { CommandItem, CommandPaletteLabels, CommandPaletteMode, CommandPaletteProps, CommandPaletteSelectDetails } from "./CommandPalette.types";
import { capGroups } from "./commandPalette.groups";
import { keywordHints } from "./commandPalette.hints";
import { isApplePlatform } from "./commandPalette.hotkey";
import { rankCommands } from "./commandPalette.rank";
import { shortcutKeys } from "./commandPalette.shortcut";

// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;

// Joins a parent command's value and a child's into the key a nested search hit is listed under.
const NESTED_SEPARATOR = "\u0001";

const NO_COMMANDS: CommandItem[] = [];

// The value of the one row that runs a command with an `argument`.
const ARGUMENT_VALUE = "\u0000run";

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as { then?: unknown } | null | undefined)?.then === "function";

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
  const mode: CommandPaletteMode | undefined = useMemo(
    () => (page || argItem ? undefined : modes?.find((candidate) => candidate.prefix !== "" && query.startsWith(candidate.prefix))),
    [modes, query, page, argItem],
  );
  // The words searched for: the text, less a mode's prefix.
  const searchText = mode ? query.slice(mode.prefix.length) : query;
  const hasQuery = searchText.trim() !== "";
  const level = useMemo(
    () => (argItem ? NO_COMMANDS : page ? (page.items ?? NO_COMMANDS) : mode ? mode.commands : commands),
    [argItem, page, mode, commands],
  );
  const context = argItem ?? page ?? mode;

  // At the top level, a search also finds the commands inside the lists it could open. Each is listed under its
  // parent's label with a key of its own (a child's value may repeat a top-level one), and run directly.
  const searchingNested = searchNested && !page && !argItem && hasQuery && filter !== false;
  const entries = useMemo(() => {
    const map = new Map<string, { item: CommandItem; parent?: CommandItem; shown: CommandItem }>();
    for (const item of level) map.set(item.value, { item, shown: item });
    if (searchingNested) {
      for (const parent of level) {
        if (!parent.items || isDisabled(parent)) continue;
        for (const child of parent.items) {
          const value = `${parent.value}${NESTED_SEPARATOR}${child.value}`;
          const shown: CommandItem = { ...child, value, group: parent.label, items: undefined, keywords: [...(child.keywords ?? []), parent.label] };
          map.set(value, { item: child, parent, shown });
        }
      }
    }
    return map;
  }, [level, searchingNested]);

  const warned = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || warned.current || !page) return;
    if (page.items?.some((item) => item.items !== undefined)) {
      warned.current = true;
      console.warn("CommandPalette: a command inside a list that was opened has its own `items`, which are ignored. One level of lists is supported.");
    }
  }, [page]);

  // The command asked a question: the one row says what Enter will do, or why it will not.
  const argumentText = argItem ? query.trim() : "";
  const argumentProblem = argItem ? (argumentText === "" ? labels.argumentEmpty : argItem.argument?.validate?.(argumentText)) : undefined;

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const { visible, moreRows } = useMemo(() => {
    if (argItem) {
      const row: CommandItem = {
        value: ARGUMENT_VALUE,
        label: argumentProblem ?? labels.runWith(argumentText),
        icon: argItem.icon,
        disabled: argumentProblem !== undefined,
      };
      return { visible: [row], moreRows: new Map<string, { group: string; first: string }>() };
    }
    const all = [...entries.values()].map((entry) => entry.shown);
    let list: CommandItem[];
    if (filter === false) list = all;
    else if (typeof filter === "function") list = all.filter((shown) => filter((entries.get(shown.value) as { item: CommandItem }).item, searchText));
    else list = rankCommands(all, searchText);
    const exempt = new Set<string>();
    if (!hasQuery && !page && !mode) {
      // The groups of commands put first: recent ones, then suggested ones. A command shows once, in the first that names it.
      const taken = new Set<string>();
      const promote = (values: string[] | undefined, heading: string) => {
        const present = [...new Set(values ?? [])]
          .filter((value) => !taken.has(value))
          .map((value) => list.find((item) => item.value === value))
          .filter((item): item is CommandItem => item !== undefined);
        if (present.length === 0) return [];
        for (const item of present) taken.add(item.value);
        exempt.add(heading);
        return present.map((item) => ({ ...item, group: heading }));
      };
      const first = promote(recent, labels.recent);
      const second = promote(suggested, labels.suggested);
      if (taken.size > 0) list = [...first, ...second, ...list.filter((item) => !taken.has(item.value))];
    }
    if (!hasQuery && maxPerGroup > 0) {
      const capped = capGroups(list, maxPerGroup, expanded, exempt, (group, hidden) => ({
        value: "",
        label: labels.showMore(hidden),
        group,
      }));
      return { visible: capped.list, moreRows: capped.more };
    }
    return { visible: list, moreRows: new Map<string, { group: string; first: string }>() };
  }, [argItem, argumentProblem, argumentText, entries, filter, searchText, hasQuery, page, mode, recent, suggested, maxPerGroup, expanded, labels]);
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

  // Tells the app which command is highlighted, and that nothing is once the palette closes.
  const highlightedItem = highlighted === -1 ? null : (entries.get((flat[highlighted] as CommandItem).value)?.item ?? null);
  const latestHighlightReport = useRef(onHighlightChange);
  useEffect(() => {
    latestHighlightReport.current = onHighlightChange;
  });
  useEffect(() => {
    latestHighlightReport.current?.(highlightedItem);
  }, [highlightedItem]);
  useEffect(
    () => () => {
      latestHighlightReport.current?.(null);
    },
    [],
  );

  // Announcements: the number of matches changing. A list that merely opens is a first appearance and isn't read.
  const lastAnnounced = useRef("");
  useEffect(() => {
    if (argItem || (!hasQuery && pageValue === null && !mode)) {
      lastAnnounced.current = "";
      return;
    }
    const key = `${searchText}|${pageValue}|${mode?.prefix}|${resultCount}|${loading}`;
    if (key === lastAnnounced.current) return;
    lastAnnounced.current = key;
    if (!loading) announce(resultCount === 0 ? labels.noResults : labels.results(resultCount));
  }, [argItem, hasQuery, searchText, pageValue, mode, resultCount, loading, labels, announce]);
  const lastError = useRef(false);
  useEffect(() => {
    if (error && !lastError.current) announce(labels.error);
    lastError.current = error;
  }, [error, labels.error, announce]);

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

  // Running a command. One that returns a promise keeps the palette open and busy until it settles.
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const run = (item: CommandItem, argument?: string) => {
    const closes = item.closeOnSelect !== false;
    const details: CommandPaletteSelectDetails = argument === undefined ? { query } : { query, argument };
    const result = item.onSelect?.(item, details);
    onSelect?.(item, details);
    if (!isThenable(result)) {
      if (closes) onFinish();
      return;
    }
    pendingRef.current = true;
    setPending(argument === undefined ? item.value : ARGUMENT_VALUE);
    onBusyChange(true);
    void result.then(
      () => {
        pendingRef.current = false;
        onBusyChange(false);
        if (alive.current) setPending(null);
        if (closes) onFinish();
      },
      (failure: unknown) => {
        pendingRef.current = false;
        onBusyChange(false);
        if (alive.current) setPending(null);
        announce(labels.failed);
        // The palette stays open. With a handler the caller has the error; without one the rejection is left
        // unhandled, so it surfaces where the caller can see it instead of being lost.
        if (onSelectError) onSelectError(failure, item);
        else throw failure;
      },
    );
  };
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
    if (!entry || isDisabled(entry.item)) return;
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
    // What a row ends with is only a hint at pressing Enter on the highlighted one.
    const enterHint =
      state.highlighted && showHints && !isDisabled(option) ? (
        <Kbd aria-hidden="true" className={styles.enterHint}>
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
          <Kbd key={`${key.text}-${index}`} aria-label={key.label}>
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
