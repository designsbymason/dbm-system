import { FileCodeIcon, FileIcon, FileTextIcon, FolderIcon, ImageIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";
import { ContextMenu } from "../ContextMenu";
import type { ContextMenuController } from "../ContextMenu";
import { Tree } from "./Tree";
import type { TreeController, TreeNode, TreeProps, TreeSize } from "./Tree.types";

// What the stories file and the real-browser checks file share. A module that is not a stories file, so the runner loads
// each stories file on its own and this is drawn by both (`07-storybook-and-documentation-standards.md` §4.2).

export const allSizes: readonly TreeSize[] = ["xs", "sm", "md", "lg", "xl"];

/** A small project: folders three deep, a disabled file, a description and trailing content. */
export const projectFiles: TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: FolderIcon,
    children: [
      {
        id: "components",
        label: "components",
        icon: FolderIcon,
        children: [
          { id: "button", label: "Button.tsx", icon: FileCodeIcon, trailing: "3 KB" },
          { id: "card", label: "Card.tsx", icon: FileCodeIcon, trailing: "5 KB" },
          { id: "legacy", label: "Legacy.tsx", icon: FileCodeIcon, disabled: true, description: "Read only" },
        ],
      },
      { id: "app", label: "App.tsx", icon: FileCodeIcon },
      { id: "index", label: "index.ts", icon: FileCodeIcon },
    ],
  },
  {
    id: "docs",
    label: "docs",
    icon: FolderIcon,
    children: [
      { id: "guide", label: "Getting started.md", icon: FileTextIcon },
      { id: "logo", label: "logo.png", icon: ImageIcon },
    ],
  },
  { id: "readme", label: "README.md", icon: FileTextIcon },
  { id: "license", label: "LICENSE", icon: FileIcon },
];

/** A tree with `count` top-level folders of ten files each, for the long-tree stories. */
export function manyNodes(folders: number, perFolder = 10): TreeNode[] {
  return Array.from({ length: folders }, (_, folder) => ({
    id: `folder-${folder}`,
    label: `Folder ${folder + 1}`,
    icon: FolderIcon,
    children: Array.from({ length: perFolder }, (_, file) => ({ id: `file-${folder}-${file}`, label: `File ${folder + 1}.${file + 1}.ts`, icon: FileCodeIcon })),
  }));
}

export type DemoProps = Partial<TreeProps>;

/** A small, real tree the gallery stories and the checks vary. */
export const Demo = (props: DemoProps) => <Tree aria-label="Project files" nodes={projectFiles} {...props} />;

/** The tree with a menu for a row, as a caller would wire it: the trigger is a div round the tree, a key is turned into a point. */
export const RowMenuDemo = (props: DemoProps) => {
  const menu = useRef<ContextMenuController>(null);
  const [target, setTarget] = useState<string>("");
  return (
    <ContextMenu controllerRef={menu}>
      <ContextMenu.Trigger asChild>
        <div>
          <Demo
            defaultExpandedIds={["src"]}
            onItemContextMenu={({ id, via, point }) => {
              setTarget(id);
              if (via === "keyboard") menu.current?.openAt(point);
            }}
            {...props}
          />
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Label>{target === "app" ? "App.tsx" : target === "index" ? "index.ts" : target}</ContextMenu.Label>
        <ContextMenu.Item>Copy path</ContextMenu.Item>
        <ContextMenu.Item tone="danger">Delete</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  );
};

/** A tree whose rows can be renamed, applying each rename to its own copy of the nodes and refusing a name another file has. */
export const RenameDemo = (props: DemoProps) => {
  const [nodes, setNodes] = useState<TreeNode[]>(projectFiles);
  const [renamed, setRenamed] = useState("");
  const controller = useRef<TreeController>(null);
  const rename = (list: TreeNode[], id: string, label: string): TreeNode[] =>
    list.map((node) => (node.id === id ? { ...node, label } : node.children ? { ...node, children: rename(node.children, id, label) } : node));
  const labels = new Set<string>();
  const collect = (list: TreeNode[]) => list.forEach((node) => (labels.add(node.label), node.children && collect(node.children)));
  collect(nodes);
  return (
    <div>
      <button type="button" onClick={() => controller.current?.rename("card")}>
        Rename Card.tsx
      </button>
      <p data-testid="renamed">{renamed}</p>
      <Demo
        nodes={nodes}
        controllerRef={controller}
        defaultExpandedIds={["src", "components"]}
        renamable
        onRename={(id, label) => {
          setNodes((current) => rename(current, id, label));
          setRenamed(`Renamed to ${label}`);
        }}
        validateRename={(_id, label) => (labels.has(label) ? "A file with that name already exists" : undefined)}
        {...props}
      />
    </div>
  );
};
