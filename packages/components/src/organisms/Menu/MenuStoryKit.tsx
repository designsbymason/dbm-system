import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Menu } from "./Menu";
import type { MenuContentProps, MenuProps } from "./Menu.types";

/**
 * The props the Playground drives, split between the root and the panel. `meta.component` can resolve docgen
 * argTypes for one component only, so the panel's are declared by hand in the stories file and threaded through here;
 * each sub-part still gets its own Properties table from a hidden stories file (guidelines/adr/0013).
 */
export interface MenuStageArgs {
  defaultOpen?: boolean;
  modal?: boolean;
  dir?: MenuProps["dir"];
  presentation?: MenuProps["presentation"];
  onOpenChange?: MenuProps["onOpenChange"];
  size?: MenuContentProps["size"];
  side?: MenuContentProps["side"];
  align?: MenuContentProps["align"];
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  loop?: boolean;
}

/** A trigger and a panel driven by the Playground's args, around whatever items a story passes. */
export function MenuStage({
  args,
  label = "Actions",
  trigger,
  children,
}: {
  args: MenuStageArgs;
  label?: string;
  /** A trigger of the story's own (an icon-only button), in place of the labelled `Button`. */
  trigger?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingBlock: "var(--dbm-space-8)" }}>
      <Menu defaultOpen={args.defaultOpen} modal={args.modal} dir={args.dir} presentation={args.presentation} onOpenChange={args.onOpenChange}>
        <Menu.Trigger asChild>{trigger ?? <Button variant="secondary">{label}</Button>}</Menu.Trigger>
        <Menu.Content
          size={args.size}
          side={args.side}
          align={args.align}
          sideOffset={args.sideOffset}
          alignOffset={args.alignOffset}
          avoidCollisions={args.avoidCollisions}
          collisionPadding={args.collisionPadding}
          loop={args.loop}
        >
          {children}
        </Menu.Content>
      </Menu>
    </div>
  );
}

export const countries = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Kenya",
  "Mexico",
  "Netherlands",
  "Norway",
  "Peru",
  "Poland",
  "Portugal",
  "Spain",
  "Sweden",
  "Switzerland",
  "Uruguay",
];
