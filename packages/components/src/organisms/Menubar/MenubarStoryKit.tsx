import type { ReactNode } from "react";
import { Menubar } from "./Menubar";
import type { MenubarProps } from "./Menubar.types";

/** The props the Playground drives, all of them the bar's own. */
export type MenubarStageArgs = Pick<
  MenubarProps,
  "size" | "surface" | "tone" | "loop" | "dir" | "onValueChange"
>;

/** The bar's props from a story's args, so a story that draws its own menus still follows every control. */
export const barPropsOf = (args: MenubarStageArgs) => ({
  size: args.size,
  surface: args.surface,
  tone: args.tone,
  loop: args.loop,
  dir: args.dir,
  onValueChange: args.onValueChange,
});

/** A File and an Edit menu, the shape of most stories: icons, shortcut hints and a danger item. */
export function DemoMenus({ children }: { children?: ReactNode }) {
  return (
    <>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item shortcut="⌘N">New</Menubar.Item>
          <Menubar.Item shortcut="⌘O">Open</Menubar.Item>
          <Menubar.Item shortcut="⌘S">Save</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item tone="danger">Close window</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item shortcut="⌘Z">Undo</Menubar.Item>
          <Menubar.Item shortcut="⇧⌘Z">Redo</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item shortcut="⌘X">Cut</Menubar.Item>
          <Menubar.Item shortcut="⌘C">Copy</Menubar.Item>
          <Menubar.Item shortcut="⌘V">Paste</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      {children}
    </>
  );
}

/** A View menu with a label, checkbox items, a radio group and a submenu. */
export function ViewMenu() {
  return (
    <Menubar.Menu value="view">
      <Menubar.Trigger>View</Menubar.Trigger>
      <Menubar.Content>
        <Menubar.Label>Panels</Menubar.Label>
        <Menubar.CheckboxItem defaultChecked>Sidebar</Menubar.CheckboxItem>
        <Menubar.CheckboxItem>Status bar</Menubar.CheckboxItem>
        <Menubar.Separator />
        <Menubar.RadioGroup defaultValue="list" aria-label="Layout">
          <Menubar.RadioItem value="list">List</Menubar.RadioItem>
          <Menubar.RadioItem value="grid">Grid</Menubar.RadioItem>
        </Menubar.RadioGroup>
        <Menubar.Separator />
        <Menubar.Sub>
          <Menubar.SubTrigger>Zoom</Menubar.SubTrigger>
          <Menubar.SubContent>
            <Menubar.Item shortcut="⌘+">Zoom in</Menubar.Item>
            <Menubar.Item shortcut="⌘-">Zoom out</Menubar.Item>
            <Menubar.Item shortcut="⌘0">Actual size</Menubar.Item>
          </Menubar.SubContent>
        </Menubar.Sub>
      </Menubar.Content>
    </Menubar.Menu>
  );
}
