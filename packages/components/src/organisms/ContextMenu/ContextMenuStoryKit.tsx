import type { ReactNode } from "react";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuContentProps, ContextMenuProps } from "./ContextMenu.types";

/**
 * The props the Playground drives, split between the root and the panel. `meta.component` can resolve docgen
 * argTypes for one component only, so the panel's are declared by hand in the stories file and threaded through here;
 * each sub-part still gets its own Properties table from a hidden stories file (guidelines/adr/0013).
 */
export interface ContextMenuStageArgs {
  modal?: boolean;
  dir?: ContextMenuProps["dir"];
  presentation?: ContextMenuProps["presentation"];
  onOpenChange?: ContextMenuProps["onOpenChange"];
  size?: ContextMenuContentProps["size"];
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  loop?: boolean;
}

/** The root's props from a story's args, so a story that draws its own area and items still follows every control. */
export const rootPropsOf = (args: ContextMenuStageArgs) => ({
  modal: args.modal,
  dir: args.dir,
  presentation: args.presentation,
  onOpenChange: args.onOpenChange,
});

/** The panel's props from a story's args. */
export const contentPropsOf = (args: ContextMenuStageArgs) => ({
  size: args.size,
  alignOffset: args.alignOffset,
  avoidCollisions: args.avoidCollisions,
  collisionPadding: args.collisionPadding,
  loop: args.loop,
});

/** The area a story's menu opens from: a labelled, focusable box, so the keyboard path can be tried too. */
export function Area({ label = "Right-click here, or press Shift+F10 when focused" }: { label?: string }) {
  return (
    <ContextMenu.Trigger
      tabIndex={0}
      aria-label={label}
      style={{
        alignItems: "center",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-secondary)",
        display: "flex",
        fontFamily: "var(--dbm-font-family-primary)",
        justifyContent: "center",
        minBlockSize: "var(--dbm-space-24)",
        padding: "var(--dbm-space-4)",
        textAlign: "center",
      }}
    >
      {label}
    </ContextMenu.Trigger>
  );
}

/** An area and a panel driven by the Playground's args, around whatever items a story passes. */
export function ContextMenuStage({
  args,
  label,
  children,
}: {
  args: ContextMenuStageArgs;
  label?: string;
  children: ReactNode;
}) {
  return (
    <ContextMenu {...rootPropsOf(args)}>
      <Area label={label} />
      <ContextMenu.Content {...contentPropsOf(args)}>{children}</ContextMenu.Content>
    </ContextMenu>
  );
}
