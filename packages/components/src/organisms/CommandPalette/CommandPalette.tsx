import { mergeDefined } from "@dbm-system/utils";
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Dialog } from "../Dialog";
import { CommandPaletteControllerContext, INERT_CONTROLLER } from "./CommandPaletteContext";
import { CommandPalettePanel } from "./CommandPalettePanel";
import type {
  CommandItem,
  CommandPaletteController,
  CommandPaletteLabels,
  CommandPaletteOpenChangeReason,
  CommandPaletteProps,
} from "./CommandPalette.types";
import { isApplePlatform, matchesHotkey, parseHotkey } from "./commandPalette.hotkey";

const NO_COMMANDS: CommandItem[] = [];

const buildDefaultLabels = (formatNumber: (value: number) => string): CommandPaletteLabels => ({
  title: "Command palette",
  search: "Search commands",
  searchIn: (label) => `Search ${label}`,
  placeholder: "Type a command or search…",
  runWith: (text) => `Run with “${text}”`,
  argumentEmpty: "Type a value, then press Enter",
  argumentInvalid: "That value can’t be used",
  suggested: "Suggested",
  showMore: (count) => `Show ${formatNumber(count)} more`,
  noResults: "No results",
  loading: "Loading…",
  error: "Something went wrong. Try again.",
  failed: "That didn’t work. Try again.",
  back: "Back",
  recent: "Recent",
  results: (count) => `${formatNumber(count)} ${count === 1 ? "result" : "results"} available`,
  hintNavigate: "Navigate",
  hintSelect: "Select",
  hintClose: "Close",
});

/**
 * A ⌘K-style launcher: a window with a search field and a list of commands. Press the `hotkey` (`mod+k`: ⌘K on an
 * Apple platform, Ctrl+K elsewhere) from anywhere, type a few letters, and choose a command with the arrow keys and
 * Enter, a mouse or a finger. It is drawn as a `Dialog` (modal, focus held inside, the page behind dimmed), with the
 * list inline under the search field. Focus stays in the field, and the highlighted command is pointed at with
 * `aria-activedescendant`.
 *
 * The commands are a `commands` array, so the list can be ranked, counted, announced and drawn a window at a time when
 * it is long. A command takes an `icon`, a `description`, `keywords` the search matches but never shows, a `group`, a
 * reason for being `disabled`, a `shortcut` hint (display only: bind the key yourself) and an `onSelect`, which may
 * return a promise (the palette waits and shows a spinner). A command with `items` opens them as a list of its own,
 * under a Back button. `recent` lists some commands first while the search is empty, and `filter={false}` leaves the
 * search to you, for commands fetched as the person types.
 *
 * Code can drive it: `open`/`onOpenChange` as for `Dialog`, and `controllerRef` (or `useCommandPaletteController()`
 * inside it) gives `open()`, `close()` and `toggle()`. Nothing is remembered between openings except what you control.
 *
 * `ref` and the native `<div>` props go to the dialog panel.
 *
 * @example
 * ```tsx
 * <CommandPalette
 *   trigger={<Button variant="secondary">Search…</Button>}
 *   commands={[
 *     { value: "new-file", label: "New file", group: "File", icon: FilePlusIcon, shortcut: ["Ctrl", "N"], onSelect: newFile },
 *     { value: "settings", label: "Open settings", group: "App", keywords: ["preferences"], onSelect: openSettings },
 *     { value: "theme", label: "Change theme", group: "App", items: [
 *       { value: "light", label: "Light", onSelect: () => setTheme("light") },
 *       { value: "dark", label: "Dark", onSelect: () => setTheme("dark") },
 *     ] },
 *   ]}
 * />
 * ```
 */
export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      commands = NO_COMMANDS,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onOpenChangeComplete,
      trigger,
      hotkey = "mod+k",
      query,
      defaultQuery,
      onQueryChange,
      filter,
      searchNested,
      modes,
      maxPerGroup,
      suggested,
      onHighlightChange,
      recent,
      loading,
      error,
      emptyContent,
      onSelect,
      onSelectError,
      onDisabledSelect,
      renderItem,
      highlightTone,
      showHints,
      footer,
      size = "lg",
      placement = "top",
      fullScreen = false,
      showCloseButton = false,
      scrimBlur = false,
      container,
      dir = "ltr",
      labels: labelOverrides,
      formatNumber = String,
      controllerRef,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...contentProps
    },
    ref,
  ) => {
    const labels = useMemo(() => mergeDefined(buildDefaultLabels(formatNumber), labelOverrides), [formatNumber, labelOverrides]);

    // The open state. A palette that waits for a command (its promise is out) can't be closed.
    const isControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const open = isControlled ? openProp : innerOpen;
    const [busy, setBusyState] = useState(false);
    const busyRef = useRef(false);
    const setBusy = useCallback((next: boolean) => {
      busyRef.current = next;
      setBusyState(next);
    }, []);

    // Everything the hotkey and the controller read is the latest render's, so neither has to be rebuilt.
    const latest = useRef({ open, isControlled, onOpenChange });
    useEffect(() => {
      latest.current = { open, isControlled, onOpenChange };
    });
    const changeOpen = useCallback(
      (next: boolean, reason: CommandPaletteOpenChangeReason) => {
        const current = latest.current;
        if (next === current.open || (!next && busyRef.current)) return false;
        if (!current.isControlled) setInnerOpen(next);
        current.onOpenChange?.(next, { reason });
        return true;
      },
      [],
    );

    const controller = useMemo<CommandPaletteController>(
      () => ({
        open: () => changeOpen(true, "controller"),
        close: () => changeOpen(false, "controller"),
        toggle: () => changeOpen(!latest.current.open, "controller"),
        get isOpen() {
          return latest.current.open;
        },
      }),
      [changeOpen],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // The hotkey. It is read when pressed, so the platform is never guessed while rendering.
    const parsed = useMemo(() => (hotkey === false || hotkey === "" ? undefined : parseHotkey(hotkey)), [hotkey]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && hotkey !== false && hotkey !== "" && !parsed) {
        console.warn(`CommandPalette: \`hotkey\` "${hotkey}" is not a key combination, so it opens nothing. Write modifiers and a key joined by "+", e.g. "mod+k".`);
      }
    }, [hotkey, parsed]);
    useEffect(() => {
      if (!parsed) return undefined;
      const listener = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.repeat || event.isComposing) return;
        if (!matchesHotkey(event, parsed, isApplePlatform())) return;
        event.preventDefault();
        changeOpen(!latest.current.open, "hotkey");
      };
      document.addEventListener("keydown", listener);
      return () => document.removeEventListener("keydown", listener);
    }, [parsed, changeOpen]);

    // Nothing could ever open it: a development-only warning, from an effect since it reads the props only.
    const unopenable = !trigger && openProp === undefined && !defaultOpen && !parsed && controllerRef === undefined;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && unopenable) {
        console.warn("CommandPalette: nothing can open it. Keep the default `hotkey`, or pass a `trigger`, `open` or `controllerRef`.");
      }
    }, [unopenable]);

    return (
      <CommandPaletteControllerContext.Provider value={controller}>
        <Dialog
          open={open}
          onOpenChange={(next, details) => {
            changeOpen(next, details.reason);
          }}
          onOpenChangeComplete={onOpenChangeComplete}
        >
          {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
          <Dialog.Content
            {...contentProps}
            ref={ref}
            dir={dir}
            size={size}
            placement={placement}
            fullScreen={fullScreen}
            showCloseButton={showCloseButton}
            scrimBlur={scrimBlur}
            container={container}
            busy={busy}
            divided={false}
            aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : labels.title)}
            aria-labelledby={ariaLabelledBy}
          >
            <CommandPalettePanel
              commands={commands}
              labels={labels}
              query={query}
              defaultQuery={defaultQuery}
              onQueryChange={onQueryChange}
              filter={filter}
              searchNested={searchNested}
              modes={modes}
              maxPerGroup={maxPerGroup}
              suggested={suggested}
              onHighlightChange={onHighlightChange}
              dir={dir}
              recent={recent}
              loading={loading}
              error={error}
              emptyContent={emptyContent}
              onSelect={onSelect}
              onSelectError={onSelectError}
              onDisabledSelect={onDisabledSelect}
              renderItem={renderItem}
              highlightTone={highlightTone}
              showHints={showHints}
              footer={footer}
              onFinish={() => {
                changeOpen(false, "select");
              }}
              onBusyChange={setBusy}
            />
          </Dialog.Content>
        </Dialog>
      </CommandPaletteControllerContext.Provider>
    );
  },
);

CommandPalette.displayName = "CommandPalette";

/**
 * The controls of the nearest `CommandPalette`, for a part rendered inside it (the same object `controllerRef` hands
 * out): open, close and toggle it. Outside a `CommandPalette` it controls nothing and warns in development.
 *
 * @example
 * ```tsx
 * function CloseHint() {
 *   const palette = useCommandPaletteController();
 *   return <Button onClick={() => palette.close()}>Done</Button>;
 * }
 * ```
 */
export function useCommandPaletteController(): CommandPaletteController {
  const controller = useContext(CommandPaletteControllerContext);
  const outside = controller === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outside) {
      console.warn("useCommandPaletteController: called outside a <CommandPalette>, so it controls nothing. Call it from a component rendered inside the palette (its `footer` or `renderItem`).");
    }
  }, [outside]);
  return controller ?? INERT_CONTROLLER;
}
