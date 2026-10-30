import type { IconSize } from "../../atoms/Icon";
import type { SpinnerSize } from "../../atoms/Spinner";
import type { TabsSize } from "./Tabs.types";

/**
 * The size of an icon drawn in a tab at each of its five sizes: one step of the icon scale per step of the tab (12, 16, 20, 24 and 32px),
 * so a larger tab always has a larger icon. `EditorTabs` draws its status marks with the same sizes. (A scroll button's caret keeps its own,
 * smaller mapping, and a close cross stays `xs`.)
 */
export const tabIconSize: Record<TabsSize, IconSize & SpinnerSize> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};
