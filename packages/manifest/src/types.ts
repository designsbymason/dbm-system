/**
 * The shape of `manifest.json` (schema version 1, ADR-0205). `schema/manifest.schema.json` describes the same shape for
 * anything that reads the file without this package; change the two together.
 */

/** A component's tier, from the first segment of its story title. */
export type ManifestTier = "atom" | "molecule" | "organism" | "template";

/** One example of a component in use. */
export interface ManifestExample {
  /** A short name for the example, when the JSDoc gives one. */
  title?: string;
  /** TSX source. */
  code: string;
}

/** One prop a component declares or overrides. */
export interface ManifestProp {
  /** The prop's name. */
  name: string;
  /** The type as written (`ButtonVariant`). */
  type: string;
  /** Whether the prop must be passed. */
  required: boolean;
  /** The `@default` from the JSDoc, as written. */
  default?: string;
  /** What the prop does. */
  description: string;
  /** The allowed values when the type is a union of literals. */
  values?: string[];
  /** Present when the prop is deprecated: what to use instead. */
  deprecated?: string;
}

/** One part of a compound component (`Menu.Item`). */
export interface ManifestPart {
  /** The public name (`Menu.Item`). */
  name: string;
  /** The first paragraph of the part's JSDoc. */
  summary: string;
  /** The native or library prop types it inherits, by name. */
  extends: string[];
  /** The props it declares or overrides, sorted by name. */
  props: ManifestProp[];
}

/** One public component. */
export interface ManifestComponent {
  /** The component's name, as imported (`Button`). */
  name: string;
  /** From the story title's first segment. */
  tier: ManifestTier;
  /** From the story title's second segment (`Inputs`). */
  category: string;
  /** The first paragraph of the component's JSDoc. */
  summary: string;
  /** The rest of the JSDoc, when there is more than the summary. */
  description?: string;
  /** What to import from `@dbm-system/components`. */
  importName: string;
  /** The component file, relative to the package root. */
  source: string;
  /** Whether it merges its props onto a single child element. */
  asChild: boolean;
  /** Whether it renders as another element through an `as` prop. */
  as: boolean;
  /** The native or library prop types it inherits, by name; not listed in `props`. */
  extends: string[];
  /** The props it declares or overrides, sorted by name. */
  props: ManifestProp[];
  /** The parts of a compound component, sorted by name. */
  parts: ManifestPart[];
  /** Examples from the JSDoc. */
  examples: ManifestExample[];
}

/** One parameter of a hook or function. */
export interface ManifestParameter {
  /** The parameter's name. */
  name: string;
  /** The type as written. */
  type: string;
  /** Whether the parameter must be passed. */
  required: boolean;
  /** The `@param` text from the JSDoc. */
  description: string;
}

/** One exported hook or function (`useToast`, `formatRelativeTime`). */
export interface ManifestUtility {
  /** The name, as imported. */
  name: string;
  /** `hook` for a `use…` function, otherwise `function`. */
  kind: "hook" | "function";
  /** The first paragraph of the JSDoc. */
  summary: string;
  /** The rest of the JSDoc, when there is more than the summary. */
  description?: string;
  /** The call signature as TypeScript writes it. */
  signature: string;
  /** The first overload's parameters, in order. */
  params: ManifestParameter[];
  /** The type it returns. */
  returns: string;
  /** The file it is written in, relative to the package root; left out when it comes from another package. */
  source?: string;
  /** Examples from the JSDoc. */
  examples: ManifestExample[];
}

/** One exported value that is neither a component nor a function (`pythonLanguage`). */
export interface ManifestConstant {
  /** The name, as imported. */
  name: string;
  /** The type as written, shortened when it is long. */
  type: string;
  /** The first paragraph of the JSDoc. */
  summary: string;
  /** The file it is written in, relative to the package root; left out when it comes from another package. */
  source?: string;
}

/** The whole manifest for one release of `@dbm-system/components`. */
export interface Manifest {
  /** Raised only by a change that removes or renames a field, or changes what one means. */
  schemaVersion: 1;
  /** The package this describes. */
  package: "@dbm-system/components";
  /** The version of `@dbm-system/components` this describes. */
  version: string;
  /** Every public component, sorted by name. */
  components: ManifestComponent[];
  /** Every exported hook and function, sorted by name. */
  utilities: ManifestUtility[];
  /** Every other exported value, sorted by name. */
  constants: ManifestConstant[];
}
