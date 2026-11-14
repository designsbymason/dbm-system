import schema from "../schema/manifest.schema.json";

interface SchemaNode {
  type?: string;
  const?: unknown;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, SchemaNode>;
  additionalProperties?: boolean;
  items?: SchemaNode;
  $ref?: string;
  $defs?: Record<string, SchemaNode>;
}

const root = schema as SchemaNode;

/** The schema the manifest is checked against, as the JSON it is published as. */
export const manifestSchema: unknown = schema;

function check(value: unknown, node: SchemaNode, path: string, problems: string[]): void {
  const resolved = node.$ref ? (root.$defs?.[node.$ref.replace("#/$defs/", "")] ?? node) : node;
  if (resolved.const !== undefined) {
    if (value !== resolved.const) problems.push(`${path}: expected ${JSON.stringify(resolved.const)}`);
    return;
  }
  if (resolved.enum) {
    if (!resolved.enum.includes(value)) problems.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(resolved.enum)}`);
    return;
  }
  if (resolved.type === "array") {
    if (!Array.isArray(value)) return void problems.push(`${path}: expected an array`);
    value.forEach((item: unknown, index) => check(item, resolved.items ?? {}, `${path}[${index}]`, problems));
  } else if (resolved.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return void problems.push(`${path}: expected an object`);
    const record = value as Record<string, unknown>;
    for (const key of resolved.required ?? []) if (!(key in record)) problems.push(`${path}.${key}: missing`);
    for (const [key, child] of Object.entries(record)) {
      const childSchema = resolved.properties?.[key];
      if (!childSchema) {
        if (resolved.additionalProperties === false) problems.push(`${path}.${key}: not in the schema`);
      } else {
        check(child, childSchema, `${path}.${key}`, problems);
      }
    }
  } else if (resolved.type === "string" || resolved.type === "boolean") {
    if (typeof value !== resolved.type) problems.push(`${path}: expected a ${resolved.type}`);
  }
}

/**
 * Checks a manifest against `manifest.schema.json` and returns what is wrong with it, one line each (an empty list means it conforms).
 * It understands only the part of JSON Schema the manifest schema uses: type, const, enum, required, properties, no extra keys, items
 * and local references.
 */
export function validateManifest(manifest: unknown): string[] {
  const problems: string[] = [];
  check(manifest, root, "manifest", problems);
  return problems;
}
