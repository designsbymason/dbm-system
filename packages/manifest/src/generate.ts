import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { withCustomConfig } from "react-docgen-typescript";
import type { ComponentDoc, PropItem } from "react-docgen-typescript";
import ts from "typescript";
import { describeProp, parseExamples, splitDescription, unquote } from "./jsdoc";
import { readStoryTitle } from "./storyTitle";
import type { Manifest, ManifestComponent, ManifestConstant, ManifestParameter, ManifestPart, ManifestProp, ManifestUtility } from "./types";

/** One finding about the source: an error means the manifest entry is incomplete, a warning means it is thinner than it should be. */
export interface ManifestDiagnostic {
  level: "error" | "warning";
  /** The component or part the finding is about (`Menu.Item`). */
  subject: string;
  message: string;
}

/** What `generateManifest` returns: the manifest, and everything it noticed on the way. */
export interface GenerateResult {
  manifest: Manifest;
  diagnostics: ManifestDiagnostic[];
}

/** What `generateManifest` reads. */
export interface GenerateOptions {
  /** The root of the components package (the folder with its `package.json`, `tsconfig.json` and `src/index.ts`). */
  packageRoot: string;
}

const byName = <T extends { name: string }>(items: T[]): T[] => [...items].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const isExternal = (fileName: string): boolean => fileName.includes("/node_modules/") || /\/typescript\/lib\//.test(fileName);

/** A part found on a compound component: its key (`Item`) and the variable it was assigned from (`MenuItem`). */
interface FoundPart {
  key: string;
  symbol: ts.Symbol;
}

/**
 * Builds the manifest for the components package at `packageRoot`. Props come from react-docgen-typescript (ADR-0174); the
 * public surface, summaries, examples, compound parts and inherited bases come from the TypeScript checker and the stories.
 * Nothing here depends on the clock or on the order files are read in, so two runs give identical output.
 */
export function generateManifest({ packageRoot }: GenerateOptions): GenerateResult {
  const root = resolve(packageRoot);
  const diagnostics: ManifestDiagnostic[] = [];
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
  const tsconfigPath = join(root, "tsconfig.json");
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const entry = join(root, "src", "index.ts");
  const program = ts.createProgram({ rootNames: [entry], options });
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(entry);
  const moduleSymbol = entryFile && checker.getSymbolAtLocation(entryFile);
  if (!moduleSymbol) throw new Error(`Cannot read the exports of ${entry}`);

  const resolveAlias = (symbol: ts.Symbol): ts.Symbol => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol);
  const declarationOf = (symbol: ts.Symbol): ts.Declaration | undefined => symbol.valueDeclaration ?? symbol.declarations?.[0];
  const typeOf = (symbol: ts.Symbol): ts.Type | undefined => {
    const declaration = declarationOf(symbol);
    return declaration ? checker.getTypeOfSymbolAtLocation(symbol, declaration) : undefined;
  };

  // 1. The public components: capitalised value exports that can be called with props.
  const components: { name: string; symbol: ts.Symbol }[] = [];
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = resolveAlias(exported);
    if (!(symbol.flags & ts.SymbolFlags.Value)) continue;
    if (!/^[A-Z][A-Za-z0-9]*$/.test(exported.name) || /^[A-Z][A-Z0-9]+$/.test(exported.name)) continue;
    if ((typeOf(symbol)?.getCallSignatures().length ?? 0) === 0) continue;
    components.push({ name: exported.name, symbol });
  }

  // `typeof shared.Item` names a property of an object, not the component: follow it to the variable it was assigned from.
  const followToVariable = (symbol: ts.Symbol): ts.Symbol => {
    let current = symbol;
    for (let depth = 0; depth < 4; depth++) {
      const declaration = current.valueDeclaration;
      let next: ts.Symbol | undefined;
      if (declaration && ts.isShorthandPropertyAssignment(declaration)) next = checker.getShorthandAssignmentValueSymbol(declaration);
      else if (declaration && ts.isPropertyAssignment(declaration) && ts.isIdentifier(declaration.initializer)) next = checker.getSymbolAtLocation(declaration.initializer);
      if (!next) return current;
      current = resolveAlias(next);
    }
    return current;
  };

  // 2. The parts of a compound component: its capitalised static members, each found through the variable it was assigned from.
  const partsOf = (symbol: ts.Symbol): FoundPart[] => {
    const found: FoundPart[] = [];
    for (const member of typeOf(symbol)?.getProperties() ?? []) {
      if (!/^[A-Z]/.test(member.name)) continue;
      const declaration = member.valueDeclaration;
      let target: ts.Node | undefined;
      if (declaration && ts.isPropertySignature(declaration) && declaration.type && ts.isTypeQueryNode(declaration.type)) target = declaration.type.exprName;
      else if (declaration && ts.isPropertyAssignment(declaration) && ts.isIdentifier(declaration.initializer)) target = declaration.initializer;
      else if (declaration && ts.isShorthandPropertyAssignment(declaration)) target = declaration.name;
      const targetSymbol = target && checker.getSymbolAtLocation(target);
      if (targetSymbol) found.push({ key: member.name, symbol: followToVariable(resolveAlias(targetSymbol)) });
    }
    return found;
  };

  // 3. One react-docgen-typescript run over every file that declares a component or a part.
  const sourceOf = (symbol: ts.Symbol): string => declarationOf(symbol)?.getSourceFile().fileName ?? "";
  const files = new Set<string>();
  const compounds = components.map(({ name, symbol }) => ({ name, symbol, parts: partsOf(symbol) }));
  for (const compound of compounds) {
    files.add(sourceOf(compound.symbol));
    for (const part of compound.parts) files.add(sourceOf(part.symbol));
  }
  const parser = withCustomConfig(tsconfigPath, {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) => !prop.parent || !isExternal(prop.parent.fileName),
  });
  const docs = new Map<string, ComponentDoc>();
  for (const doc of parser.parse([...files].filter(Boolean).sort())) docs.set(`${doc.filePath}::${doc.displayName}`, doc);

  // A compound component is `Object.assign(Root, { ...parts })`, and its JSDoc is written on the root it is built from.
  const rootOf = (symbol: ts.Symbol): ts.Symbol | undefined => {
    const declaration = declarationOf(symbol);
    const call = declaration && ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
    const first = call && ts.isCallExpression(call) && call.expression.getText() === "Object.assign" ? call.arguments[0] : undefined;
    const target = first && ts.isIdentifier(first) ? checker.getSymbolAtLocation(first) : undefined;
    return target && resolveAlias(target);
  };
  const jsdocOf = (symbol: ts.Symbol) => {
    const read = (from: ts.Symbol) => ({
      text: ts.displayPartsToString(from.getDocumentationComment(checker)),
      examples: from
        .getJsDocTags(checker)
        .filter((tag) => tag.name === "example")
        .flatMap((tag) => parseExamples(ts.displayPartsToString(tag.text))),
    });
    const own = read(symbol);
    const root = rootOf(symbol);
    const fromRoot = root ? read(root) : undefined;
    return { ...splitDescription(own.text.trim() === "" && fromRoot ? fromRoot.text : own.text), examples: own.examples.length === 0 && fromRoot ? fromRoot.examples : own.examples };
  };

  const toProp = (prop: PropItem): ManifestProp => {
    const type = prop.type as { name: string; raw?: string; value?: { value: string }[] };
    const values = type.name === "enum" && Array.isArray(type.value) ? type.value.map((entry) => unquote(entry.value)).filter((value) => value !== "undefined") : undefined;
    const tags = (prop as PropItem & { tags?: Record<string, string> }).tags;
    return {
      name: prop.name,
      type: type.raw ?? type.name,
      required: prop.required,
      ...(prop.defaultValue ? { default: String(prop.defaultValue.value) } : {}),
      description: describeProp(prop.description),
      ...(values && values.length > 0 ? { values } : {}),
      ...(tags?.deprecated !== undefined ? { deprecated: describeProp(tags.deprecated) || "deprecated" } : {}),
    };
  };

  // The library types a props interface or alias inherits (`ComponentPropsWithoutRef<"button">`); the local ones it extends are in `props`.
  const basesOfNode = (node: ts.Node): string[] => {
    const bases: string[] = [];
    const visit = (child: ts.Node) => {
      if (ts.isTypeReferenceNode(child) || ts.isExpressionWithTypeArguments(child)) {
        const name = ts.isTypeReferenceNode(child) ? child.typeName : child.expression;
        const symbol = checker.getSymbolAtLocation(name);
        const resolved = symbol && resolveAlias(symbol);
        const file = resolved && declarationOf(resolved)?.getSourceFile().fileName;
        if (file && isExternal(file)) bases.push(child.getText().replace(/\s+/g, " ").replace(/<\s+/g, "<").replace(/\s+>/g, ">"));
        return;
      }
      ts.forEachChild(child, visit);
    };
    if (ts.isInterfaceDeclaration(node)) for (const clause of node.heritageClauses ?? []) visit(clause);
    else if (ts.isTypeAliasDeclaration(node)) visit(node.type);
    return [...new Set(bases)].sort();
  };

  // The props type a doc was mostly read from, found again in its file.
  const externalBases = (doc: ComponentDoc): string[] => {
    const counts = new Map<string, { fileName: string; count: number }>();
    for (const prop of Object.values(doc.props)) {
      if (!prop.parent) continue;
      const known = counts.get(prop.parent.name);
      counts.set(prop.parent.name, { fileName: prop.parent.fileName, count: (known?.count ?? 0) + 1 });
    }
    const main = [...counts.entries()].filter(([name]) => name.endsWith("Props")).sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1))[0];
    // react-docgen-typescript reports a parent's file relative to a folder above the repository, so find the file by its path's tail.
    const parentFile = main?.[1].fileName;
    const sourceFile = parentFile && program.getSourceFiles().find((file) => file.fileName === parentFile || file.fileName.endsWith(`/${parentFile}`));
    if (!main || !sourceFile) return [];
    let bases: string[] = [];
    ts.forEachChild(sourceFile, (statement) => {
      if ((ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) && statement.name.text === main[0]) bases = basesOfNode(statement);
    });
    return bases;
  };

  // A part that its file does not export is invisible to react-docgen-typescript, so its props are read from the checker the same way:
  // what the props type declares in this repository, with the JSDoc description and `@default`, and none of the library's own.
  const readPropsFromChecker = (symbol: ts.Symbol): { props: ManifestProp[]; extends: string[] } => {
    const signature = typeOf(symbol)?.getCallSignatures()[0];
    const parameter = signature?.getParameters()[0];
    const declaration = parameter && declarationOf(parameter);
    const propsType = parameter && declaration && checker.getTypeOfSymbolAtLocation(parameter, declaration);
    const props: ManifestProp[] = [];
    for (const member of propsType ? checker.getPropertiesOfType(propsType) : []) {
      const memberDeclaration = declarationOf(member);
      if (!memberDeclaration || isExternal(memberDeclaration.getSourceFile().fileName) || member.name === "ref") continue;
      const memberType = checker.getTypeOfSymbolAtLocation(member, memberDeclaration);
      const written = ts.isPropertySignature(memberDeclaration) && memberDeclaration.type ? memberDeclaration.type.getText().replace(/\s+/g, " ") : checker.typeToString(memberType);
      const tags = member.getJsDocTags(checker);
      const tag = (name: string) => tags.find((entry) => entry.name === name);
      const members = memberType.isUnion() ? memberType.types.filter((part) => !(part.flags & ts.TypeFlags.Undefined)) : [];
      const values = members.length > 0 && members.every((part) => part.isStringLiteral() || part.isNumberLiteral()) ? members.map((part) => String((part as ts.LiteralType).value)) : undefined;
      const defaultTag = tag("default");
      const deprecatedTag = tag("deprecated");
      props.push({
        name: member.name,
        type: written,
        required: !(member.flags & ts.SymbolFlags.Optional),
        ...(defaultTag ? { default: ts.displayPartsToString(defaultTag.text).trim() } : {}),
        description: describeProp(ts.displayPartsToString(member.getDocumentationComment(checker))),
        ...(values ? { values } : {}),
        ...(deprecatedTag ? { deprecated: describeProp(ts.displayPartsToString(deprecatedTag.text)) || "deprecated" } : {}),
      });
    }
    // The props type is the second type argument of `forwardRef<Element, Props>(...)` when the part is built that way.
    let bases: string[] = [];
    const initializer = declarationOf(symbol);
    const call = initializer && ts.isVariableDeclaration(initializer) ? initializer.initializer : undefined;
    const typeArgument = call && ts.isCallExpression(call) ? call.typeArguments?.[1] : undefined;
    if (typeArgument && ts.isTypeReferenceNode(typeArgument)) {
      const typeSymbol = checker.getSymbolAtLocation(typeArgument.typeName);
      const typeDeclaration = typeSymbol && declarationOf(resolveAlias(typeSymbol));
      if (typeDeclaration) bases = basesOfNode(typeDeclaration);
    }
    return { props, extends: bases };
  };

  // 4. The manifest.
  const manifest: Manifest = { schemaVersion: 1, package: "@dbm-system/components", version: pkg.version, components: [], utilities: [], constants: [] };
  for (const { name, symbol, parts } of compounds) {
    const file = sourceOf(symbol);
    const story = readStoryTitle(dirname(file), name);
    if (!story) diagnostics.push({ level: "error", subject: name, message: `no story title like "Atoms/Inputs/${name}" in ${relative(root, dirname(file))}` });
    const doc = docs.get(`${file}::${name}`);
    if (!doc) diagnostics.push({ level: "error", subject: name, message: `react-docgen-typescript found no component named ${name} in ${relative(root, file)}` });
    const { summary, description, examples } = jsdocOf(symbol);
    if (summary === "") diagnostics.push({ level: "warning", subject: name, message: "no description in the JSDoc" });
    if (examples.length === 0) diagnostics.push({ level: "warning", subject: name, message: "no @example in the JSDoc" });
    const props = byName((doc ? Object.values(doc.props) : []).filter((prop) => prop.name !== "ref").map(toProp));
    for (const prop of props) if (prop.description === "") diagnostics.push({ level: "error", subject: `${name}.${prop.name}`, message: "prop has no description" });

    const partEntries: ManifestPart[] = [];
    for (const part of parts) {
      const partName = `${name}.${part.key}`;
      const partFile = sourceOf(part.symbol);
      const partDoc = docs.get(`${partFile}::${part.symbol.name}`);
      const read = partDoc ? { props: Object.values(partDoc.props).filter((prop) => prop.name !== "ref").map(toProp), extends: externalBases(partDoc) } : readPropsFromChecker(part.symbol);
      const partSummary = jsdocOf(part.symbol).summary;
      if (partSummary === "") diagnostics.push({ level: "warning", subject: partName, message: "no description in the JSDoc" });
      const partProps = byName(read.props);
      for (const prop of partProps) if (prop.description === "") diagnostics.push({ level: "error", subject: `${partName}.${prop.name}`, message: "prop has no description" });
      partEntries.push({ name: partName, summary: partSummary, extends: read.extends, props: partProps });
    }

    manifest.components.push({
      name,
      tier: story?.tier ?? "atom",
      category: story?.category ?? "",
      summary,
      ...(description ? { description } : {}),
      importName: name,
      source: relative(root, file),
      asChild: props.some((prop) => prop.name === "asChild"),
      as: props.some((prop) => prop.name === "as"),
      extends: doc ? externalBases(doc) : [],
      props,
      parts: byName(partEntries),
      examples,
    } satisfies ManifestComponent);
  }
  manifest.components = byName(manifest.components);

  // 5. The hooks and functions: lowercase value exports that can be called.
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = resolveAlias(exported);
    if (!(symbol.flags & ts.SymbolFlags.Value) || !/^[a-z][A-Za-z0-9]*$/.test(exported.name)) continue;
    const signature = typeOf(symbol)?.getCallSignatures()[0];
    if (!signature) continue;
    const { summary, description, examples } = jsdocOf(symbol);
    if (summary === "") diagnostics.push({ level: "warning", subject: exported.name, message: "no description in the JSDoc" });
    const params: ManifestParameter[] = signature.getParameters().map((parameter) => {
      const declaration = declarationOf(parameter);
      const optional = !!declaration && ts.isParameter(declaration) && (declaration.questionToken !== undefined || declaration.initializer !== undefined);
      const written = declaration && ts.isParameter(declaration) && declaration.type ? declaration.type.getText().replace(/\s+/g, " ") : checker.typeToString(declaration ? checker.getTypeOfSymbolAtLocation(parameter, declaration) : checker.getAnyType());
      return { name: parameter.name, type: written, required: !optional, description: describeProp(ts.displayPartsToString(parameter.getDocumentationComment(checker))) };
    });
    const file = sourceOf(symbol);
    const local = file !== "" && !isExternal(file) && !relative(root, file).startsWith("..");
    manifest.utilities.push({
      name: exported.name,
      kind: exported.name.startsWith("use") ? "hook" : "function",
      summary,
      ...(description ? { description } : {}),
      signature: checker.signatureToString(signature, undefined, ts.TypeFormatFlags.NoTruncation),
      params,
      returns: checker.typeToString(signature.getReturnType(), undefined, ts.TypeFormatFlags.NoTruncation),
      ...(local ? { source: relative(root, file) } : {}),
      examples,
    } satisfies ManifestUtility);
  }
  manifest.utilities = byName(manifest.utilities);

  // 6. Every other exported value, and a check that nothing the package exports was left out of the manifest.
  const listed = new Set([...manifest.components.map((component) => component.name), ...manifest.utilities.map((utility) => utility.name)]);
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = resolveAlias(exported);
    if (!(symbol.flags & ts.SymbolFlags.Value) || listed.has(exported.name)) continue;
    const callable = (typeOf(symbol)?.getCallSignatures().length ?? 0) > 0;
    if (callable) {
      diagnostics.push({ level: "error", subject: exported.name, message: "an exported function that is neither a component (capitalised) nor a hook or function (lower case), so the manifest cannot place it" });
      continue;
    }
    const declaration = declarationOf(symbol);
    const file = sourceOf(symbol);
    const written = declaration && ts.isVariableDeclaration(declaration) && declaration.type ? declaration.type.getText().replace(/\s+/g, " ") : checker.typeToString(typeOf(symbol) ?? checker.getAnyType());
    const { summary } = jsdocOf(symbol);
    if (summary === "") diagnostics.push({ level: "warning", subject: exported.name, message: "no description in the JSDoc" });
    manifest.constants.push({
      name: exported.name,
      type: written,
      summary,
      ...(file !== "" && !isExternal(file) && !relative(root, file).startsWith("..") ? { source: relative(root, file) } : {}),
    } satisfies ManifestConstant);
  }
  manifest.constants = byName(manifest.constants);

  // A component folder whose exports reach the manifest nowhere has dropped out of it (a component no longer callable, say).
  const described = [...manifest.components.map((entry) => entry.source), ...manifest.utilities.flatMap((entry) => (entry.source ? [entry.source] : [])), ...manifest.constants.flatMap((entry) => (entry.source ? [entry.source] : []))];
  for (const tier of ["atoms", "molecules", "organisms", "templates"]) {
    const tierDirectory = join(root, "src", tier);
    if (!existsSync(tierDirectory)) continue;
    for (const folder of readdirSync(tierDirectory, { withFileTypes: true })) {
      if (!folder.isDirectory() || !existsSync(join(tierDirectory, folder.name, "index.ts"))) continue;
      const prefix = `src/${tier}/${folder.name}/`;
      if (!described.some((source) => source.startsWith(prefix))) diagnostics.push({ level: "error", subject: folder.name, message: `src/${tier}/${folder.name} has an index.ts but nothing from it reaches the manifest` });
    }
  }
  return { manifest, diagnostics };
}
