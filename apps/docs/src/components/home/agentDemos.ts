// The components section 2 of the home page shows beside their manifest entries (03-landing-page-brief.md §3). Each is a small, real
// example: its `jsx` is what the live component beside it was written as, and `props` and `parts` name what that JSX uses, which are
// the entries of the manifest highlighted in both panes. Names are looked up in the built manifest, so renaming a prop or a part fails
// the build (agentExcerpts.ts) instead of leaving the page showing something that no longer exists.

export interface AgentDemo {
  /** The component's name in the manifest. */
  name: string;
  /** What the example is written as, shown under the live component. */
  jsx: string;
  /** The props the JSX uses. */
  props: string[];
  /** The parts the JSX uses (a compound component's `Dialog.Trigger`). */
  parts: string[];
}

export const agentDemos: AgentDemo[] = [
  {
    name: "Button",
    jsx: `<Button variant="destructive" size="lg" leadingIcon={TrashIcon}>
  Delete
</Button>`,
    props: ["variant", "size", "leadingIcon"],
    parts: [],
  },
  {
    name: "Input",
    jsx: `<Input
  type="email"
  size="lg"
  hasError
  defaultValue="ada@example"
  aria-label="Email"
/>`,
    props: ["type", "size", "hasError", "defaultValue", "aria-label"],
    parts: [],
  },
  {
    name: "Select",
    jsx: `<Select defaultValue="pro" size="lg" aria-label="Plan">
  <Select.Option value="free">Free</Select.Option>
  <Select.Option value="pro">Pro</Select.Option>
</Select>`,
    props: ["defaultValue", "size", "aria-label"],
    parts: ["Select.Option"],
  },
  {
    name: "Dialog",
    jsx: `<Dialog>
  <Dialog.Trigger asChild>
    <Button>Edit profile</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit profile</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <Dialog.Close asChild>
        <Button variant="secondary">Done</Button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,
    props: [],
    parts: ["Dialog.Trigger", "Dialog.Content", "Dialog.Header", "Dialog.Title", "Dialog.Footer", "Dialog.Close"],
  },
];
