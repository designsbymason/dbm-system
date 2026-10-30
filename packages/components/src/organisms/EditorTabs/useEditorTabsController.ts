import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { Ref } from "react";
import type { EditorTabsController } from "./EditorTabs.types";

interface Handlers {
  select: (id: string) => boolean;
  close: (id: string) => boolean;
  closeMany: (ids: string[]) => boolean;
  add: () => boolean;
  move: (id: string, to: number) => boolean;
  focus: (id: string) => boolean;
}

/**
 * The controls `controllerRef` hands to code outside the strip: one object for the strip's life, whose methods call the
 * latest handlers (kept in a ref updated after each commit), so they never go stale and never change identity.
 */
export function useEditorTabsController(controllerRef: Ref<EditorTabsController> | undefined, handlers: Handlers): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  const controller = useMemo<EditorTabsController>(
    () => ({
      select: (id) => latest.current.select(id),
      close: (id) => latest.current.close(id),
      closeMany: (ids) => latest.current.closeMany(ids),
      add: () => latest.current.add(),
      move: (id, to) => latest.current.move(id, to),
      focus: (id) => latest.current.focus(id),
    }),
    [],
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);
}
