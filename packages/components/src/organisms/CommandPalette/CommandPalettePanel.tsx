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
import { buildRows, firstEnabled, isDisabled, lastEnabled, stepEnabled } from "../../internal/optionList/optionList.rows";
import { optionDomId, useOptionListWindow } from "../../internal/optionList/useOptionListWindow";
import styles from "./CommandPalette.module.css";
import type { CommandItem, CommandPaletteLabels, CommandPaletteProps } from "./CommandPalette.types";
import { keywordHints } from "./commandPalette.hints";
import { rankCommands } from "./commandPalette.rank";

// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;

// Joins a parent command's value and a child's into the key a nested search hit is listed under.
const NESTED_SEPARATOR = "\u0001";

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
    | "recent"
    | "loading"
    | "error"
    | "emptyContent"
    | "onSelect"
    | "onSelectError"
    | "renderItem"
    | "highlightTone"
    | "showHints"
    | "footer"
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
 * when it closes, so the search, the page and the highlight start afresh every time with no reset to remember.
 */
export function CommandPalettePanel({
  commands,
  labels,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  filter,
  searchNested = true,
  recent,
  loading = false,
  error = false,
  emptyContent,
  onSelect,
  onSelectError,
  renderItem,
  highlightTone,
  showHints = true,
  footer,
  onFinish,
  onBusyChange,
}: CommandPalettePanelProps) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const { message, announce } = useAnnouncement();

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

  // The list on show: the top level, or the commands of one that was opened.
  const [pageValue, setPageValue] = useState<string | null>(null);
  const page = useMemo(
    () => (pageValue === null ? undefined : commands.find((command) => command.value === pageValue && command.items)),
    [commands, pageValue],
  );
  const level = page?.items ?? commands;

  // At the top level, a search also finds the commands inside the lists it could open. Each is listed under its
  // parent's label with a key of its own (a child's value may repeat a top-level one), and run directly.
  const hasQuery = query.trim() !== "";
  const searchingNested = searchNested && !page && hasQuery && filter !== false;
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

  const visible = useMemo(() => {
    const all = [...entries.values()].map((entry) => entry.shown);
    let list: CommandItem[];
    if (filter === false) list = all;
    else if (typeof filter === "function") list = all.filter((shown) => filter((entries.get(shown.value) as { item: CommandItem }).item, query));
    else list = rankCommands(all, query);
    if (!hasQuery && !page && recent && recent.length > 0) {
      const wanted = [...new Set(recent)];
      const present = wanted.map((value) => list.find((item) => item.value === value)).filter((item): item is CommandItem => item !== undefined);
      if (present.length > 0) {
        const taken = new Set(present.map((item) => item.value));
        list = [...present.map((item) => ({ ...item, group: labels.recent })), ...list.filter((item) => !taken.has(item.value))];
      }
    }
    return list;
  }, [entries, filter, query, hasQuery, page, recent, labels.recent]);
  const { rows, flat } = useMemo(() => buildRows(visible), [visible]);
  const hasIcons = useMemo(() => flat.some((item) => item.icon !== undefined), [flat]);

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

  // Announcements: the number of matches changing. A list that merely opens is a first appearance and isn't read.
  const lastAnnounced = useRef("");
  useEffect(() => {
    if (!hasQuery && pageValue === null) {
      lastAnnounced.current = "";
      return;
    }
    const key = `${query}|${pageValue}|${flat.length}|${loading}`;
    if (key === lastAnnounced.current) return;
    lastAnnounced.current = key;
    if (!loading) announce(flat.length === 0 ? labels.noResults : labels.results(flat.length));
  }, [hasQuery, query, pageValue, flat.length, loading, labels, announce]);
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
  const goBack = () => {
    setPageValue(null);
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
  const run = (item: CommandItem) => {
    const closes = item.closeOnSelect !== false;
    const result = item.onSelect?.(item);
    onSelect?.(item, { query });
    if (!isThenable(result)) {
      if (closes) onFinish();
      return;
    }
    pendingRef.current = true;
    setPending(item.value);
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
    const entry = entries.get(option.value);
    if (!entry || isDisabled(entry.item) || pendingRef.current) return;
    if (entry.item.items !== undefined && !page && !entry.parent) openPage(entry.item);
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
    if (key === "Backspace" && query === "" && page) {
      event.preventDefault();
      goBack();
    }
  };

  const renderTrailing = (option: CommandItem) => {
    const entry = entries.get(option.value);
    if (!entry) return null;
    const { item, parent } = entry;
    if (pending === item.value) return <Spinner size="xs" tone="default" className={styles.trailing} />;
    const keys = item.shortcut === undefined ? [] : Array.isArray(item.shortcut) ? item.shortcut : [item.shortcut];
    const opensList = item.items !== undefined && !page && !parent;
    const hints = hasQuery ? keywordHints(item, query, parent?.label) : [];
    if (keys.length === 0 && !opensList && hints.length === 0) return null;
    return (
      <span className={styles.trailing}>
        {hints.length > 0 ? <span className={styles.matchHint}>{`“${hints.join(", ")}”`}</span> : null}
        {keys.map((key, index) => (
          <Kbd key={`${key}-${index}`}>{key}</Kbd>
        ))}
        {opensList ? <Icon icon={CaretRightIcon} size="sm" tone="secondary" className={styles.chevron} /> : null}
      </span>
    );
  };

  const emptyMessage = loading ? labels.loading : (page?.emptyContent ?? emptyContent ?? labels.noResults);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        {page ? (
          <IconButton icon={ArrowLeftIcon} aria-label={labels.back} variant="ghost" size="sm" className={styles.back} onClick={goBack} />
        ) : (
          <Icon icon={MagnifyingGlassIcon} size="md" tone="secondary" className={styles.searchIcon} />
        )}
        {page ? (
          <Tag size="sm" tone="neutral" className={styles.pageTag}>
            {page.label}
          </Tag>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={query}
          placeholder={page?.placeholder ?? labels.placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          role="combobox"
          aria-label={page ? labels.searchIn(page.label) : labels.search}
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
          markText={query}
          highlightTone={highlightTone}
          hasIcons={hasIcons}
          renderOption={renderItem ? (item, state) => renderItem(entries.get(item.value)?.item ?? item, { highlighted: state.highlighted }) : undefined}
          renderTrailing={renderTrailing}
          emptyMessage={emptyMessage}
          loading={loading}
          ariaLabel={page ? page.label : labels.title}
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
            </div>
          ) : null}
          {footer ? <div className={styles.footerExtra}>{footer}</div> : null}
        </div>
      ) : null}
      <VisuallyHidden role="status">{message}</VisuallyHidden>
    </div>
  );
}
