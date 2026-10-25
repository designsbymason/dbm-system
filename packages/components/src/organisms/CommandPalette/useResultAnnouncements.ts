import { useEffect, useRef } from "react";
import type { CommandPaletteLabels, CommandPaletteMode } from "./CommandPalette.types";

interface Options {
  /** A command is being asked for a value: there are no results to count. */
  asking: boolean;
  hasQuery: boolean;
  searchText: string;
  pageValue: string | null;
  mode: CommandPaletteMode | undefined;
  resultCount: number;
  loading: boolean;
  error: boolean;
  labels: CommandPaletteLabels;
  announce: (text: string) => void;
}

/**
 * Says how many commands match when that changes, and says an error when it appears. A list that merely opens is a
 * first appearance and is not read.
 */
export function useResultAnnouncements({ asking, hasQuery, searchText, pageValue, mode, resultCount, loading, error, labels, announce }: Options) {
  const lastAnnounced = useRef("");
  useEffect(() => {
    if (asking || (!hasQuery && pageValue === null && !mode)) {
      lastAnnounced.current = "";
      return;
    }
    const key = `${searchText}|${pageValue}|${mode?.prefix}|${resultCount}|${loading}`;
    if (key === lastAnnounced.current) return;
    lastAnnounced.current = key;
    if (!loading) announce(resultCount === 0 ? labels.noResults : labels.results(resultCount));
  }, [asking, hasQuery, searchText, pageValue, mode, resultCount, loading, labels, announce]);

  const lastError = useRef(false);
  useEffect(() => {
    if (error && !lastError.current) announce(labels.error);
    lastError.current = error;
  }, [error, labels.error, announce]);
}
