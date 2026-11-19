import { readFileSync } from "node:fs";
import { join } from "node:path";
import { locatePackage, SourceError, type LocatedPackage } from "./sources";

/** One component or helper row of `manifest/index.json`. */
export interface IndexRow {
  name: string;
  summary: string;
  /** The component's file, relative to the `manifest` folder. */
  file: string;
  tier?: string;
  category?: string;
  /** For a helper, the component it supports. */
  helperOf?: string;
}

/** One hook or function row of `manifest/index.json`. */
export interface UtilityRow {
  name: string;
  kind: string;
  summary: string;
}

/** `manifest/index.json`. */
export interface ManifestIndex {
  schemaVersion: number;
  package: string;
  version: string;
  components: IndexRow[];
  helpers: IndexRow[];
  utilities: UtilityRow[];
}

/** `manifest/utilities.json`: every hook, function and constant, in full. */
export interface UtilitiesFile {
  schemaVersion: number;
  utilities: Array<{ name: string; kind?: string; summary?: string } & Record<string, unknown>>;
  constants: Array<{ name: string } & Record<string, unknown>>;
}

/** One token of `tokens.json`. */
export interface TokenEntry {
  name: string;
  layer: string;
  group: string;
  type: string;
  values?: Record<string, string>;
  value?: string;
  aliases?: Record<string, string>;
  usedBy?: string[];
  purpose?: string;
}

/** `tokens.json`. */
export interface TokenIndex {
  version: string;
  themes: string[];
  tokens: TokenEntry[];
}

/** The manifest schema version this server reads. A different version is refused rather than read wrongly. */
export const SUPPORTED_SCHEMA_VERSION = 1;

/** Which packages the data came from, for a tool to say what version it is describing. */
export interface SourceInfo {
  components: Pick<LocatedPackage, "name" | "version" | "origin">;
  tokens: Pick<LocatedPackage, "name" | "version" | "origin">;
}

/** Everything the server reads, each file loaded on first use and kept for the life of the process. */
export interface DbmData {
  info(): SourceInfo;
  index(): ManifestIndex;
  /** One component's or helper's manifest entry, found by name without regard to case, or `undefined` when there is none. */
  component(name: string): { row: IndexRow; entry: unknown } | undefined;
  utilities(): UtilitiesFile;
  tokens(): TokenIndex;
  /** The consumer guide that ships with the components package. */
  agentsGuide(): string;
  /** Up to `limit` names from `candidates` that are close to `name`, for "did you mean" messages. */
  suggest(name: string, candidates: readonly string[], limit?: number): string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** The number of single-character edits between two strings, compared without regard to case. */
function editDistance(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  let previous = Array.from({ length: y.length + 1 }, (_, index) => index);
  for (let i = 1; i <= x.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= y.length; j += 1) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      row[j] = Math.min((previous[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost);
    }
    previous = row;
  }
  return previous[y.length] ?? 0;
}

/** Opens the installed packages, looking in `startDir` first, and returns the readers. Nothing is read until a reader is called. */
export function openData(startDir: string): DbmData {
  const cache = new Map<string, unknown>();
  const once = <T>(key: string, load: () => T): T => {
    if (!cache.has(key)) cache.set(key, load());
    return cache.get(key) as T;
  };
  const components = () => once("components-package", () => locatePackage("@dbm-system/components", startDir));
  const tokens = () => once("tokens-package", () => locatePackage("@dbm-system/tokens", startDir));

  const index = () =>
    once("index", () => {
      const pkg = components();
      const found = readJson<ManifestIndex>(pkg.resolveExport("manifest/index.json"));
      if (found.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
        throw new SourceError(
          `${pkg.name}@${pkg.version} has manifest schema version ${found.schemaVersion}, and this server reads version ${SUPPORTED_SCHEMA_VERSION}. Update @dbm-system/mcp.`,
        );
      }
      return found;
    });

  return {
    info: () => ({
      components: { name: components().name, version: components().version, origin: components().origin },
      tokens: { name: tokens().name, version: tokens().version, origin: tokens().origin },
    }),
    index,
    component(name) {
      const wanted = name.toLowerCase();
      const { components: rows, helpers } = index();
      // The file to open comes from the index row, never from the caller's text, so a name cannot reach another path.
      const row = [...rows, ...helpers].find((candidate) => candidate.name.toLowerCase() === wanted);
      if (!row) return undefined;
      const manifestFolder = join(components().resolveExport("manifest/index.json"), "..");
      return { row, entry: readJson<unknown>(join(manifestFolder, row.file)) };
    },
    utilities: () =>
      once("utilities", () => {
        const found = readJson<UtilitiesFile>(components().resolveExport("manifest/utilities.json"));
        if (found.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
          throw new SourceError(`The installed utilities file has schema version ${found.schemaVersion}, and this server reads version ${SUPPORTED_SCHEMA_VERSION}. Update @dbm-system/mcp.`);
        }
        return found;
      }),
    tokens: () => once("tokens", () => readJson<TokenIndex>(tokens().resolveExport("tokens.json"))),
    agentsGuide: () => once("agents", () => readFileSync(join(components().root, "AGENTS.md"), "utf8")),
    suggest(name, candidates, limit = 3) {
      const wanted = name.toLowerCase();
      return candidates
        .map((candidate) => ({
          candidate,
          score: candidate.toLowerCase().includes(wanted) || wanted.includes(candidate.toLowerCase()) ? 0 : editDistance(name, candidate),
        }))
        .filter(({ score }) => score <= Math.max(2, Math.floor(name.length / 3)))
        .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
        .slice(0, limit)
        .map(({ candidate }) => candidate);
    },
  };
}
