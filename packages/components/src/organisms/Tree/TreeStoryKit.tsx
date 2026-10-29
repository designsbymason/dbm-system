import { FileCodeIcon, FileIcon, FileTextIcon, FolderIcon, ImageIcon } from "@dbm-system/icons";
import { Tree } from "./Tree";
import type { TreeNode, TreeProps, TreeSize } from "./Tree.types";

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
