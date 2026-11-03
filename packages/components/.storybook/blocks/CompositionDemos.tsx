import { DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { useState } from "react";
import { Button } from "../../src/atoms/Button";
import { IconButton } from "../../src/atoms/IconButton";
import { ConfirmDialog } from "../../src/organisms/ConfirmDialog";
import { Menu } from "../../src/organisms/Menu";
import { Toast, useToast } from "../../src/organisms/Toast";

/** Stands in for a request, so the demos show a busy state. */
const pretendRequest = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

function DeleteProject() {
  const { toast } = useToast();
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete project</Button>}
      tone="danger"
      title="Delete project?"
      description="This removes the project and all of its files for good. It cannot be undone."
      labels={{ confirm: "Delete", cancel: "Keep it" }}
      onConfirm={async () => {
        await pretendRequest();
        toast({ tone: "success", title: "Project deleted" });
      }}
    />
  );
}

/**
 * Pattern: confirm before a destructive action, then report the result. `onConfirm` returns a promise, so the dialog
 * stays open and busy until it settles; the toast says what happened once it has closed.
 */
export function ConfirmThenToastDemo() {
  return (
    <Toast.Provider>
      <DeleteProject />
    </Toast.Provider>
  );
}

const ROWS = ["Quarterly report", "Roadmap", "Onboarding checklist"];

function RowList() {
  const { toast } = useToast();
  const [rows, setRows] = useState(ROWS);
  const [pending, setPending] = useState<string | null>(null);

  return (
    <>
      <ul className="dbm-composition-rows sb-unstyled">
        {rows.map((name) => (
          <li key={name}>
            <span>{name}</span>
            <Menu>
              <Menu.Trigger asChild>
                <IconButton icon={DotsThreeIcon} aria-label={`Actions for ${name}`} variant="ghost" />
              </Menu.Trigger>
              <Menu.Content>
                <Menu.Item icon={PencilSimpleIcon} onSelect={() => {
                    toast({ tone: "info", title: `Renaming ${name}` });
                  }}>
                  Rename
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item icon={TrashIcon} tone="danger" onSelect={() => setPending(name)}>
                  Delete
                </Menu.Item>
              </Menu.Content>
            </Menu>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        tone="danger"
        title={`Delete ${pending ?? "this item"}?`}
        description="It will be removed from the list."
        labels={{ confirm: "Delete", cancel: "Keep it" }}
        onConfirm={() => {
          setRows((current) => current.filter((row) => row !== pending));
          toast({ tone: "success", title: `${pending ?? "Item"} deleted` });
        }}
      />
    </>
  );
}

/**
 * Pattern: a list with a menu on every row. A menu item that needs a confirmation opens a controlled `ConfirmDialog`
 * from `onSelect`, so there is one dialog for the whole list instead of one per row.
 */
export function RowMenuDemo() {
  return (
    <Toast.Provider>
      <RowList />
    </Toast.Provider>
  );
}
