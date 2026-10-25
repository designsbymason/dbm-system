import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ReactNode } from "react";

/** The size scale of a field with a list under it, the shared `xs … xl`. */
export type OptionListSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What the shared option list needs to know about a choice. `ComboboxOption` and `MultiSelectOption` are this shape
 * with their own documentation, so either can be handed to the helpers and the panel here.
 */
export interface ListOption {
  value: string;
  label: string;
  textValue?: string;
  description?: ReactNode;
  icon?: PhosphorIcon;
  disabled?: boolean | string;
  keywords?: string[];
  group?: string;
}
