import { Fragment } from "react";
import type { ReactNode } from "react";
import { ContextMenu } from "../ContextMenu";
import type { EditorTab, EditorTabsLabels, EditorTabsMenuContext } from "./EditorTabs.types";
import { closableAfter, closableOthers, closableAll, isClosable } from "./editorTabsModel";

interface PresetMenuOptions<TTab extends EditorTab> {
  context: EditorTabsMenuContext<TTab>;
  tabs: TTab[];
  labels: EditorTabsLabels;
  canClose: boolean;
  canCloseMany: boolean;
  canReorder: boolean;
  /** How many tabs at the start are pinned: a move stays inside the tab's own group. */
  pinned: number;
  /** The owner's own items, after the strip's. */
  custom: ReactNode;
}

/**
 * The items of the strip's own tab menu: the close family and the moves, each only when the owner has given the callback that
 * makes it possible, and disabled where there is nothing for it to do. The owner's own items follow after a separator.
 */
export function editorTabsPresetMenu<TTab extends EditorTab>({
  context,
  tabs,
  labels,
  canClose,
  canCloseMany,
  canReorder,
  pinned,
  custom,
}: PresetMenuOptions<TTab>): ReactNode {
  const { tab, index, count } = context;
  const groups: ReactNode[] = [];

  const closes: ReactNode[] = [];
  if (canClose && isClosable(tab)) {
    closes.push(
      <ContextMenu.Item key="close" shortcut="Delete" onSelect={() => void context.close()}>
        {labels.menuClose}
      </ContextMenu.Item>,
    );
  }
  if (canCloseMany) {
    closes.push(
      <ContextMenu.Item key="others" disabled={closableOthers(tabs, tab.id).length === 0} onSelect={() => void context.closeOthers()}>
        {labels.menuCloseOthers}
      </ContextMenu.Item>,
      <ContextMenu.Item key="after" disabled={closableAfter(tabs, tab.id).length === 0} onSelect={() => void context.closeAfter()}>
        {labels.menuCloseAfter}
      </ContextMenu.Item>,
      <ContextMenu.Item key="all" disabled={closableAll(tabs).length === 0} onSelect={() => void context.closeMany(closableAll(tabs).map((t) => t.id))}>
        {labels.menuCloseAll}
      </ContextMenu.Item>,
    );
  }
  if (closes.length > 0) groups.push(<Fragment key="closes">{closes}</Fragment>);

  if (canReorder && count > 1) {
    const first = tab.pinned ? 0 : pinned;
    const last = tab.pinned ? pinned - 1 : count - 1;
    groups.push(
      <Fragment key="moves">
        <ContextMenu.Item disabled={index <= first} onSelect={() => void context.move(first)}>
          {labels.menuMoveToStart}
        </ContextMenu.Item>
        <ContextMenu.Item disabled={index <= first} onSelect={() => void context.move(index - 1)}>
          {labels.menuMoveEarlier}
        </ContextMenu.Item>
        <ContextMenu.Item disabled={index >= last} onSelect={() => void context.move(index + 1)}>
          {labels.menuMoveLater}
        </ContextMenu.Item>
        <ContextMenu.Item disabled={index >= last} onSelect={() => void context.move(last)}>
          {labels.menuMoveToEnd}
        </ContextMenu.Item>
      </Fragment>,
    );
  }
  if (custom) groups.push(<Fragment key="custom">{custom}</Fragment>);

  return groups.map((group, position) => (
    <Fragment key={position}>
      {position > 0 && <ContextMenu.Separator />}
      {group}
    </Fragment>
  ));
}
