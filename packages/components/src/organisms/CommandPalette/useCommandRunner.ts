import { useEffect, useRef, useState } from "react";
import type { CommandItem, CommandPaletteLabels, CommandPaletteProps, CommandPaletteSelectDetails } from "./CommandPalette.types";
import { ARGUMENT_VALUE } from "./commandPalette.entries";

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as { then?: unknown } | null | undefined)?.then === "function";

interface Options extends Pick<CommandPaletteProps, "onSelect" | "onSelectError"> {
  labels: Pick<CommandPaletteLabels, "failed">;
  /** The text in the search field, handed to what runs. */
  query: string;
  announce: (text: string) => void;
  /** Closes the palette because a command was chosen. */
  onFinish: () => void;
  /** Tells the palette whether a command that returned a promise is still working. */
  onBusyChange: (busy: boolean) => void;
}

/**
 * Runs a command. One that returns a promise keeps the palette open and busy until it settles: it closes when the
 * promise resolves (unless the command stays open), and a rejection is announced and handed to `onSelectError`, or, with
 * none, left unhandled so it is not lost silently. `pending` is the value of the row showing a spinner.
 */
export function useCommandRunner({ labels, query, announce, onSelect, onSelectError, onFinish, onBusyChange }: Options) {
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

  return { pending, pendingRef, run };
}
