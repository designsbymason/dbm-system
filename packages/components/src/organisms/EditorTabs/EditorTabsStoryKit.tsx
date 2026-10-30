import { useState } from "react";
import { FileCodeIcon, FileCssIcon, FileTextIcon } from "@dbm-system/icons";
import { ContextMenu } from "../ContextMenu";
import { EditorTabs } from "./EditorTabs";
import type { EditorTab, EditorTabsProps } from "./EditorTabs.types";

// What the stories file and the real-browser checks file share. A module that is not a stories file, so the runner loads
// each stories file on its own and this is drawn by both (`07-storybook-and-documentation-standards.md` §4.2).

export const demoTabs: EditorTab[] = [
  { id: "index", label: "index.ts", icon: FileCodeIcon },
  { id: "app", label: "App.tsx", icon: FileCodeIcon, dirty: true },
  { id: "styles", label: "styles.css", icon: FileCssIcon },
  { id: "notes", label: "notes.txt", icon: FileTextIcon },
  { id: "readme", label: "readme.txt", icon: FileTextIcon },
];

export const manyTabs: EditorTab[] = Array.from({ length: 24 }, (_, index) => ({
  id: `file-${index + 1}`,
  label: `module-${index + 1}.ts`,
  icon: FileCodeIcon,
}));

/** Tabs with something to say about how they are doing. */
export const statusTabs: EditorTab[] = [
  { id: "build", label: "build.log", icon: FileTextIcon, status: "busy", statusText: "saving" },
  { id: "app", label: "App.tsx", icon: FileCodeIcon, status: "error", statusText: "save failed" },
  { id: "styles", label: "styles.css", icon: FileCssIcon, status: "warning", statusText: "changed elsewhere" },
  { id: "index", label: "index.ts", icon: FileCodeIcon },
];

/** Tabs with detail to show in a tooltip: the full path. */
export const pathTabs: EditorTab[] = [
  { id: "a", label: "index.ts", icon: FileCodeIcon, tooltip: "src/organisms/EditorTabs/index.ts" },
  { id: "b", label: "App.tsx", icon: FileCodeIcon, tooltip: "src/App.tsx" },
  { id: "c", label: "styles.css", icon: FileCssIcon, tooltip: "src/styles/styles.css" },
];

export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
};

export type DemoProps = Omit<EditorTabsProps<EditorTab>, "tabs" | "value" | "defaultValue"> & {
  initialTabs?: EditorTab[];
  initialValue?: string;
  /** Draws the strip's own tab menu, with its close-several items. */
  presetMenu?: boolean;
  /** Draws a context menu of the story's own items on each tab. */
  withMenu?: boolean;
  /** Draws the add button. */
  addable?: boolean;
};

/** A strip whose owner applies what it asks for, the way an app would: close, add and reorder all change the array. */
export function Demo({ initialTabs = demoTabs, initialValue = "index", presetMenu = false, withMenu = false, addable = true, ...props }: DemoProps) {
  const [tabs, setTabs] = useState(initialTabs);
  const [value, setValue] = useState<string | null>(initialValue);
  const [count, setCount] = useState(1);
  return (
    <EditorTabs
      aria-label="Open files"
      {...props}
      tabs={tabs}
      value={value}
      onValueChange={setValue}
      onClose={(tab) => setTabs((all) => all.filter((candidate) => candidate.id !== tab.id))}
      onCloseMany={(closing) => setTabs((all) => all.filter((tab) => !closing.some((closed) => closed.id === tab.id)))}
      onReorder={(from, to) => setTabs((all) => moveItem(all, from, to))}
      tabMenu={presetMenu}
      onAdd={
        addable
          ? () => {
              const id = `untitled-${count}`;
              setCount((n) => n + 1);
              setTabs((all) => [...all, { id, label: `untitled-${count}.ts`, icon: FileCodeIcon }]);
              setValue(id);
            }
          : undefined
      }
      tabContextMenu={
        withMenu
          ? ({ tab, index, count: total, close, move }) => (
              <>
                <ContextMenu.Item onSelect={() => void close()}>Close</ContextMenu.Item>
                <ContextMenu.Item disabled={index === 0} onSelect={() => void move(index - 1)}>
                  Move left
                </ContextMenu.Item>
                <ContextMenu.Item disabled={index === total - 1} onSelect={() => void move(index + 1)}>
                  Move right
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item onSelect={() => setTabs((all) => all.map((t) => (t.id === tab.id ? { ...t, dirty: !t.dirty } : t)))}>
                  {tab.dirty ? "Mark as saved" : "Mark as unsaved"}
                </ContextMenu.Item>
              </>
            )
          : undefined
      }
    />
  );
}
