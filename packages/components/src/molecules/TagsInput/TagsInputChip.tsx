import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Tag } from "../../atoms/Tag";
import type { TagSize, TagTone, TagVariant } from "../../atoms/Tag";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./TagsInput.module.css";

interface TagsInputChipProps {
  tag: string;
  reason: string | undefined;
  tone: TagTone;
  variant: TagVariant;
  size: TagSize;
  removable: boolean;
  removeLabel: string;
  onRemove: () => void;
  /** An icon before the text. */
  icon?: PhosphorIcon;
  /** Drawn instead of `tag` as the chip's content (an avatar and a name); `tag` is still the tooltip and the text that is cut. */
  content?: ReactNode;
  /** Extra props for the list item, which a component that moves chips uses to find them and to hear a press. */
  itemProps?: HTMLAttributes<HTMLLIElement>;
}

/**
 * One chip. Its text ends in an ellipsis when the box is narrower than it, and then, and only then, a tooltip
 * shows the whole tag on hover or when the chip (its remove button) has focus; a chip that fits has none.
 */
export function TagsInputChip({
  tag,
  reason,
  tone,
  variant,
  size,
  removable,
  removeLabel,
  onRemove,
  icon,
  content,
  itemProps,
}: TagsInputChipProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const isCut = () => {
    const label = labelRef.current;
    return Boolean(label && label.scrollWidth > label.clientWidth);
  };
  return (
    <Tooltip content={tag} open={open} onOpenChange={(next) => setOpen(next && isCut())}>
      {/* The list item is the trigger, not the `Tag`: a trigger passes its own click handler to what it wraps,
          and a `Tag` with one is a clickable tag, whose remove control is then only a decorative glyph. Focus
          on the remove button bubbles to the item, so the tooltip opens for the keyboard as well. */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari with VoiceOver drops list semantics otherwise */}
      <li {...itemProps} role="listitem" className={styles.chip}>
        <Tag
          className={styles.chipTag}
          tone={reason ? "danger" : tone}
          variant={variant}
          size={size}
          leadingIcon={icon}
          removable={removable}
          removeTabStop={false}
          removeLabel={removeLabel}
          onRemove={onRemove}
        >
          <span ref={labelRef} className={styles.chipLabel}>
            {content ?? tag}
          </span>
          {reason ? <VisuallyHidden>{`, ${reason}`}</VisuallyHidden> : null}
        </Tag>
      </li>
    </Tooltip>
  );
}
