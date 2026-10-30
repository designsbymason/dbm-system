import { forwardRef, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { mergeRefs } from "@dbm-system/utils";
import { Tooltip } from "../../atoms/Tooltip";
import { Tabs } from "../../molecules/Tabs";
import type { TabsTriggerProps } from "../../molecules/Tabs/Tabs.types";

interface EditorTabsTriggerProps extends TabsTriggerProps {
  /** What the tooltip shows when the tab has detail of its own (`tooltip` or `title`). */
  detail: ReactNode;
  /** What it shows, if the name is cut short and there is no detail: the whole name. */
  fullName: string;
}

/**
 * One tab's button, with a `Tooltip` that opens in two cases only: the tab has detail to show (`tooltip` or `title`), or its name is cut
 * short with an ellipsis and the tooltip shows the whole of it. A short name with nothing to add never gets one.
 */
export const EditorTabsTrigger = forwardRef<HTMLButtonElement, EditorTabsTriggerProps & ComponentPropsWithoutRef<"button">>(
  ({ detail, fullName, disabled, ...props }, ref) => {
    const own = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const hasDetail = detail !== undefined && detail !== null && detail !== false && detail !== "";

    const onOpenChange = (next: boolean) => {
      if (!next) return setOpen(false);
      if (hasDetail) return setOpen(true);
      const label = own.current?.querySelector<HTMLElement>("[data-editor-tab-label]");
      setOpen(label !== null && label !== undefined && label.scrollWidth > label.clientWidth);
    };

    const trigger = <Tabs.Trigger {...props} ref={mergeRefs(ref, own)} disabled={disabled} />;
    if (disabled) return trigger;
    return (
      <Tooltip content={hasDetail ? detail : fullName} open={open} onOpenChange={onOpenChange} side="bottom" disableHoverableContent>
        {trigger}
      </Tooltip>
    );
  },
);
EditorTabsTrigger.displayName = "EditorTabsTrigger";
