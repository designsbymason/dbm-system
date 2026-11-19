import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/** Where a package was found: in the project the server was started from, or among the copies this server depends on. */
export type Origin = "project" | "bundled";

/** One installed package the server reads files from. */
export interface LocatedPackage {
  /** The package's name, such as `@dbm-system/components`. */
  name: string;
  /** The version in its `package.json`. */
  version: string;
  /** The folder holding its `package.json`. */
  root: string;
  /** Whether the project or this server's own dependencies supplied it. */
  origin: Origin;
  /** Resolves a file the package's `exports` names, such as `@dbm-system/components/manifest/index.json`, to an absolute path. */
  resolveExport: (subpath: string) => string;
}

/** A reason the server cannot read what it needs, written to say what to do about it. */
export class SourceError extends Error {}

function tryResolve(require: NodeJS.Require, specifier: string): string | undefined {
  try {
    return require.resolve(specifier);
  } catch {
    return undefined;
  }
}

/**
 * Finds an installed package, looking from `startDir` first so the server describes the version the project has, then from
 * this server's own dependencies.
 */
export function locatePackage(name: string, startDir: string): LocatedPackage {
  const candidates: Array<[NodeJS.Require, Origin]> = [
    [createRequire(join(startDir, "dbm-system-mcp.js")), "project"],
    [createRequire(import.meta.url), "bundled"],
  ];
  for (const [require, origin] of candidates) {
    const manifestPath = tryResolve(require, `${name}/package.json`);
    if (!manifestPath) continue;
    const { version } = JSON.parse(readFileSync(manifestPath, "utf8")) as { version: string };
    return {
      name,
      version,
      root: dirname(manifestPath),
      origin,
      resolveExport(subpath) {
        const resolved = tryResolve(require, `${name}/${subpath}`);
        if (!resolved) {
          throw new SourceError(`${name}@${version} has no ${subpath}. Update ${name} to a version that ships it.`);
        }
        return resolved;
      },
    };
  }
  throw new SourceError(`${name} is not installed in ${startDir}. Install it there with \`npm install ${name}\`.`);
}
