import { DotsThreeIcon, MagnifyingGlassIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { useEffect, useState } from "react";
import { Button } from "../../src/atoms/Button";
import { IconButton } from "../../src/atoms/IconButton";
import { Input } from "../../src/atoms/Input";
import { Skeleton } from "../../src/atoms/Skeleton";
import { Stack } from "../../src/atoms/Stack";
import { VisuallyHidden } from "../../src/atoms/VisuallyHidden";
import { EmptyState } from "../../src/molecules/EmptyState";
import { FormField } from "../../src/molecules/FormField";
import { SearchInput } from "../../src/molecules/SearchInput";
import { ConfirmDialog } from "../../src/organisms/ConfirmDialog";
import { Dialog } from "../../src/organisms/Dialog";
import { Form } from "../../src/organisms/Form";
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

function AccountForm() {
  const { toast } = useToast();
  return (
    <Form
      aria-label="Create account"
      onSubmit={async () => {
        await pretendRequest();
        toast({ tone: "success", title: "Account created" });
      }}
    >
      <FormField
        label="Username"
        name="username"
        helperText="3 or more characters"
        validate={(value) => (String(value).length < 3 ? "Use 3 or more characters" : undefined)}
      >
        {(field) => <Input {...field} />}
      </FormField>
      <FormField label="Email" name="email" required>
        {(field) => <Input {...field} type="email" />}
      </FormField>
      <Form.Actions>
        <Form.Submit>Create account</Form.Submit>
      </Form.Actions>
    </Form>
  );
}

/**
 * Pattern: a validated form that reports success. The form checks each field, shows the errors in place, and calls
 * `onSubmit` only when every field is valid; while the returned promise runs the form is busy and cannot be submitted
 * twice.
 */
export function ValidatedFormDemo() {
  return (
    <Toast.Provider>
      <div className="dbm-composition-panel sb-unstyled">
        <AccountForm />
      </div>
    </Toast.Provider>
  );
}

function ProfileDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Edit profile</Button>
      </Dialog.Trigger>
      <Dialog.Content busy={saving} closeOnOutsideClick={false}>
        <Form
          aria-label="Edit profile"
          onSubmit={async () => {
            setSaving(true);
            await pretendRequest();
            setSaving(false);
            setOpen(false);
            toast({ tone: "success", title: "Profile saved" });
          }}
        >
          <Dialog.Header>
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>Changes are saved to your account.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <FormField label="Display name" name="displayName" required>
              {(field) => <Input {...field} defaultValue="Jane Doe" />}
            </FormField>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Form.Submit>Save changes</Form.Submit>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
}

/**
 * Pattern: edit in a dialog. The form lives inside the dialog, which is held open and cannot be dismissed while the
 * save is running; a stray outside click does not throw the edit away.
 */
export function EditInDialogDemo() {
  return (
    <Toast.Provider>
      <ProfileDialog />
    </Toast.Provider>
  );
}

const PEOPLE = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson", "Margaret Hamilton", "Tim Berners-Lee"];

/**
 * Pattern: search a list and say so when nothing matches. The result count is in a live region, and an empty result
 * is an `EmptyState` with a way back, not a blank space.
 */
export function SearchListDemo() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const results = PEOPLE.filter((name) => name.toLowerCase().includes(needle));
  return (
    <Stack gap={3} style={{ maxInlineSize: "28rem" }}>
      <SearchInput
        aria-label="Search people"
        placeholder="Search people"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
      />
      <VisuallyHidden role="status">{`${results.length} ${results.length === 1 ? "person" : "people"} found`}</VisuallyHidden>
      {results.length > 0 ? (
        <ul className="dbm-composition-rows sb-unstyled">
          {results.map((name) => (
            <li key={name}>
              <span>{name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState variant="dashed">
          <EmptyState.Icon icon={MagnifyingGlassIcon} />
          <EmptyState.Title>No one found</EmptyState.Title>
          <EmptyState.Description>Nothing matches &ldquo;{query}&rdquo;.</EmptyState.Description>
          <EmptyState.Actions>
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      )}
    </Stack>
  );
}

/**
 * Pattern: placeholders while content loads. Skeletons take the shape of what is coming, the region is marked busy,
 * and the real content replaces them in the same place.
 */
export function LoadingDemo() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, [loading]);
  return (
    <Stack gap={3} style={{ maxInlineSize: "28rem" }}>
      <div aria-busy={loading}>
        {loading ? (
          <ul className="dbm-composition-rows sb-unstyled" aria-label="Loading people">
            {[0, 1, 2].map((row) => (
              <li key={row}>
                <Skeleton variant="text" width={`${70 - row * 12}%`} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="dbm-composition-rows sb-unstyled">
            {PEOPLE.slice(0, 3).map((name) => (
              <li key={name}>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <Button variant="secondary" disabled={loading} onClick={() => setLoading(true)}>
          Reload
        </Button>
      </div>
    </Stack>
  );
}
