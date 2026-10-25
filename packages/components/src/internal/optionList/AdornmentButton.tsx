import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import type { ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import styles from "./AdornmentButton.module.css";
import type { OptionListSize } from "./optionList.types";

const adornmentClass: Record<OptionListSize, string | undefined> = {
  xs: styles.adornmentXs,
  sm: styles.adornmentSm,
  md: styles.adornmentMd,
  lg: styles.adornmentLg,
  xl: styles.adornmentXl,
};

/** The trailing edge of a field with a list: the loading mark and the buttons share one row. */
export function Adornments({ children }: { children: ReactNode }) {
  return <span className={styles.adornments}>{children}</span>;
}

interface AdornmentButtonProps {
  icon: PhosphorIcon;
  size: OptionListSize;
  /** The button's accessible name. */
  label: string;
  onClick: () => void;
}

/**
 * A neutral in-field icon button (the caret, the clear button): out of the tab order, since the arrow keys and
 * Escape do what they do, but a real hit area. It takes no focus from the field when pressed.
 */
export function AdornmentButton({ icon, size, label, onClick }: AdornmentButtonProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      className={cx(styles.adornment, adornmentClass[size])}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon icon={icon} size={size} tone="default" />
    </button>
  );
}
