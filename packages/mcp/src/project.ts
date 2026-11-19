import { statSync } from "node:fs";
import { resolve } from "node:path";

/** The environment variable and the argument that name the project's folder explicitly. */
export const PROJECT_ENV = "DBM_SYSTEM_PROJECT_DIR";
export const PROJECT_ARG = "--project";

/** The folders to look in for the installed packages, in order, and anything wrong with the setting that named one. */
export interface ProjectFolders {
  folders: string[];
  /** Messages about a setting that did not name a folder, for the note a fallback carries. */
  warnings: string[];
}

function argumentValue(argv: readonly string[]): string | undefined {
  const index = argv.findIndex((entry) => entry === PROJECT_ARG || entry.startsWith(`${PROJECT_ARG}=`));
  if (index === -1) return undefined;
  const entry = argv[index] as string;
  return entry.includes("=") ? entry.slice(PROJECT_ARG.length + 1) : (argv[index + 1] ?? "");
}

function isFolder(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Works out where to look for the project's installed packages (ADR-0232): the explicit setting (the `--project` argument, then
 * `DBM_SYSTEM_PROJECT_DIR`), the folder the server was started in, then `CLAUDE_PROJECT_DIR`. The working folder comes before
 * `CLAUDE_PROJECT_DIR` so a monorepo whose packages are installed in a nested folder still works.
 */
export function projectFolders(argv: readonly string[], env: NodeJS.ProcessEnv, cwd: string): ProjectFolders {
  const warnings: string[] = [];
  const candidates: string[] = [];
  const fromArgument = argumentValue(argv);
  const [source, value] = fromArgument !== undefined ? [PROJECT_ARG, fromArgument] : [PROJECT_ENV, env[PROJECT_ENV]];
  if (value === "") {
    warnings.push(`${source} is empty.`);
  } else if (value !== undefined) {
    const folder = resolve(cwd, value);
    if (isFolder(folder)) candidates.push(folder);
    else warnings.push(`${source} is "${value}", which is not a folder.`);
  }
  candidates.push(cwd);
  const claude = env.CLAUDE_PROJECT_DIR;
  if (claude) candidates.push(resolve(cwd, claude));
  return { folders: [...new Set(candidates)], warnings };
}
