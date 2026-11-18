/**
 * Module hooks that let Node load the components package's own TypeScript sources (`componentRows.ts`, the `*.snippets.ts`
 * files) as they are: Node strips the types itself, and these hooks add the two things its ESM loader does not do, so no
 * source file changes and no bundler is needed:
 *
 * - a relative import with no extension (`./snippetHelpers`) resolves to the `.ts`, `.tsx` or `index.ts` file beside it;
 * - a `.json` import with no `with { type: "json" }` attribute loads as JSON (Vite, which builds these files for Storybook, does not ask for it);
 * - a `.tsx` file (two snippet files import a component for one value) is compiled with TypeScript, and a `.css` import is an empty module.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, next) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const target = new URL(specifier, context.parentURL);
    const path = fileURLToPath(target);
    if (!/\.(m?[jt]sx?|json|css)$/.test(path) || !existsSync(path) || !statSync(path).isFile()) {
      for (const extension of EXTENSIONS) {
        const candidate = path + extension;
        if (existsSync(candidate)) return next(new URL(candidate, "file:").href, context);
      }
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("file:") && url.endsWith(".json")) {
    return { format: "json", source: readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
  }
  if (url.startsWith("file:") && url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
  if (url.startsWith("file:") && url.endsWith(".tsx")) {
    const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return next(url, context);
}
