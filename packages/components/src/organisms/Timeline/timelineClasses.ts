import styles from "./Timeline.module.css";
import type { TimelineTone } from "./Timeline.types";

/** The class that sets a tone's colours, on the root (the default) and on an item that sets its own. */
export const toneClass: Record<TimelineTone, string | undefined> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  highlight: styles.toneHighlight,
  neutral: styles.toneNeutral,
};
