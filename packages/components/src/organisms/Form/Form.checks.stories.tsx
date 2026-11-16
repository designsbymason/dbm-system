import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../../atoms/Input";
import { FormField } from "../../molecules/FormField";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { EditableText } from "../../molecules/EditableText";
import { Select } from "../../molecules/Select";
import { TimePicker } from "../../molecules/TimePicker";
import { useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Form } from "./Form";
import type { FormController } from "./Form.types";

// Real-browser checks for what jsdom can't evaluate: where focus really lands (a disabled control drops it, a hidden
// validity control must never take it), a live region read from the accessibility tree, the summary's focus ring,
// the buttons' width on a phone and right-to-left. Hidden from the sidebar and the Docs page, and still run as
// tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Components/Form/Checks",
  id: "organisms-inputs-form-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

// A real key through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events.
const pressKey = async (key: string, code: string, windowsVirtualKeyCode: number, text?: string) => {
  await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode, text });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
};
const pressEnter = () => pressKey("Enter", "Enter", 13, "\r");

const frame = (children: React.ReactNode) => <div style={{ maxInlineSize: "28rem" }}>{children}</div>;

export const EnterRefusedFocusesFirstInvalid: Story = {
  name: "Enter in a field refuses an invalid form and focuses the first invalid control",
  render: () =>
    frame(
      <Form aria-label="Sign up" onSubmit={() => undefined}>
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <FormField label="Username" name="username" required>
          {(field) => <Input {...field} />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const username = canvas.getByRole("textbox", { name: "Username" });
    username.focus();
    await userEvent.keyboard("ada");
    await pressEnter();
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus());
    // announced from a region that was in the page before: the accessibility tree has it as a status
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("1 error."));
  },
};

export const HiddenValidityControlNeverTakesFocus: Story = {
  name: "A required TimePicker refuses the form and focus lands on a segment, not the hidden control",
  render: () =>
    frame(
      <Form aria-label="Booking" onSubmit={() => undefined}>
        <FormField label="Start time" name="start" required>
          {(field) => <TimePicker {...field} />}
        </FormField>
        <Form.Submit>Book</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Book" }));
    await waitFor(() => {
      const active = document.activeElement as HTMLElement;
      expect(canvasElement.contains(active)).toBe(true);
      expect(active).not.toBe(document.body);
      // visually hidden validity inputs are 1px; a person's focus can't be on one
      const rect = active.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(8);
      expect(rect.height).toBeGreaterThan(8);
    });
    await expect(canvas.getByRole("status")).toBeInTheDocument();
  },
};

export const RequiredSelectIsFocusedTrigger: Story = {
  name: "A required Select refuses the form and focus lands on its trigger",
  render: () =>
    frame(
      <Form aria-label="Preferences" onSubmit={() => undefined}>
        <FormField label="Plan" name="plan" required>
          {(field) => (
            <Select {...field} placeholder="Choose a plan">
              <Select.Option value="free">Free</Select.Option>
              <Select.Option value="pro">Pro</Select.Option>
            </Select>
          )}
        </FormField>
        <Form.Submit>Save</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByRole("combobox", { name: /Plan/ })).toHaveFocus());
  },
};

export const BusyFormGivesFocusBack: Story = {
  name: "A busy form disables its fields and gives focus back to the one that was typed in",
  render: () =>
    frame(
      <Form
        aria-label="Sign up"
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 400))}
      >
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email" });
    email.focus();
    await userEvent.keyboard("ada@example.com");
    await pressEnter();
    await waitFor(() => expect(email).toBeDisabled());
    await waitFor(() => expect(email).toBeEnabled(), { timeout: 3000 });
    // the browser moved focus off the control when it was disabled; the form puts it back
    await waitFor(() => expect(email).toHaveFocus());
  },
};

export const SummaryRingAndLinks: Story = {
  name: "The summary takes focus with a ring, and its links focus the controls",
  render: () =>
    frame(
      <Form aria-label="Sign up" focusTarget="summary" onSubmit={() => undefined}>
        <Form.Summary />
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email" });
    email.focus();
    await pressEnter();
    const summary = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>("[tabindex='-1']");
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    await waitFor(() => expect(summary).toHaveFocus());
    // keyboard-driven, so :focus-visible draws the ring
    await expect(getComputedStyle(summary).outlineWidth).toBe("2px");
    await userEvent.click(within(summary).getByRole("link", { name: /Email/ }));
    await waitFor(() => expect(email).toHaveFocus());
  },
};

export const OnAPhoneActionsTakeARowEach: Story = {
  name: "On a phone the buttons take a row each at the full width",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Form aria-label="Sign up">
      <Form.Actions data-testid="actions">
        <Button type="reset" variant="ghost">
          Reset
        </Button>
        <Form.Submit>Create account</Form.Submit>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport didn't apply, rather than passing at desktop width.
    await expect(window.innerWidth).toBeLessThan(640);
    const actions = within(canvasElement).getByTestId("actions");
    const buttons = Array.from(actions.querySelectorAll("button"));
    const width = Math.round(actions.getBoundingClientRect().width);
    for (const button of buttons) await expect(Math.round(button.getBoundingClientRect().width)).toBe(width);
    await expect(buttons[0]?.getBoundingClientRect().bottom).toBeLessThanOrEqual(buttons[1]?.getBoundingClientRect().top as number);
  },
};

export const RightToLeft: Story = {
  name: "In right-to-left the summary's list is indented from the start side",
  render: () => (
    <div dir="rtl" style={{ maxInlineSize: "28rem" }}>
      <Form aria-label="Sign up" errors={{ email: "Enter an email address" }}>
        <Form.Summary />
        <FormField label="Email" name="email">
          {(field) => <Input {...field} />}
        </FormField>
      </Form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ul") as HTMLElement;
    const style = getComputedStyle(list);
    await expect(parseFloat(style.paddingRight)).toBeGreaterThan(0);
    await expect(parseFloat(style.paddingLeft)).toBe(0);
  },
};

export const WaitingForARuleKeepsFocusInPlace: Story = {
  name: "A submit waiting on a rule keeps focus in the field, then lands on the one that is wrong",
  render: () =>
    frame(
      <Form aria-label="Sign up" onSubmit={() => undefined}>
        <FormField label="Username" name="username" validate={() => new Promise((resolve) => setTimeout(() => resolve("That username is taken"), 400))}>
          {(field) => <Input {...field} />}
        </FormField>
        <FormField label="Email" name="email">
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email" });
    email.focus();
    await userEvent.keyboard("a@b.co");
    await pressEnter();
    await waitFor(() => expect(canvas.getByRole("form", { name: "Sign up" })).toHaveAttribute("aria-busy", "true"));
    // nothing was disabled, so focus never left the field being typed in
    await expect(email).toBeEnabled();
    await expect(email).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Username" })).toHaveFocus(), { timeout: 3000 });
    await expect(canvas.getByRole("textbox", { name: "Username" })).toHaveAccessibleDescription("That username is taken");
  },
};

function OutsideButtons() {
  const controller = useRef<FormController>(null);
  return (
    <div style={{ maxInlineSize: "28rem" }}>
      <Button onClick={() => void controller.current?.validate()}>Check from outside</Button>
      <Form aria-label="Sign up" controllerRef={controller}>
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
      </Form>
    </div>
  );
}

export const ValidateFromOutsideFocusesTheField: Story = {
  name: "Checking from a button outside the form focuses the first invalid field",
  render: () => <OutsideButtons />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Check from outside" }));
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus());
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("Fill out this field.");
  },
};

export const LegendSitsAtTheEnd: Story = {
  name: "The required-fields legend is at the end of the row, in both directions",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", maxInlineSize: "28rem" }}>
      {(["ltr", "rtl"] as const).map((dir) => (
        <div key={dir} dir={dir} data-testid={dir}>
          <Form aria-label={`Sign up ${dir}`} requiredLegend>
            <FormField label="Email" name={`email-${dir}`} required>
              {(field) => <Input {...field} />}
            </FormField>
          </Form>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ["ltr", "rtl"] as const) {
      const host = within(canvasElement).getByTestId(dir);
      const legend = await waitFor(() => {
        const found = host.querySelector<HTMLElement>("form > p");
        expect(found).not.toBeNull();
        return found as HTMLElement;
      });
      const form = host.querySelector("form") as HTMLElement;
      const text = document.createRange();
      text.selectNodeContents(legend);
      const textBox = text.getBoundingClientRect();
      const formBox = form.getBoundingClientRect();
      // the text's own box touches the end edge of the form: right in ltr, left in rtl
      if (dir === "ltr") await expect(Math.round(textBox.right)).toBe(Math.round(formBox.right));
      else await expect(Math.round(textBox.left)).toBe(Math.round(formBox.left));
    }
  },
};

// An EditableText shows its value as text and opens a draft field; the draft is detached from the form and the
// committed value is submitted through a hidden input (06 §9, "an editable draft is not a control of the form").
const submittedBy = (output: HTMLElement) => output.textContent ?? "";

function EditableInAForm({ committed }: { committed: string }) {
  const [submitted, setSubmitted] = useState("nothing submitted");
  return (
    <div style={{ maxInlineSize: "28rem" }}>
      <Form aria-label="Project" onSubmit={(values) => setSubmitted(JSON.stringify(values))}>
        <FormField label="Project name" name="project" required>
          {(field) => <EditableText {...field} defaultValue={committed} />}
        </FormField>
        <FormField label="Owner" name="owner">
          {(field) => <Input {...field} defaultValue="Ada" />}
        </FormField>
        <Form.Submit>Save</Form.Submit>
      </Form>
      <output data-testid="submitted">{submitted}</output>
    </div>
  );
}

export const OpenEmptyDraftDoesNotBlockTheForm: Story = {
  name: "An open, emptied required draft doesn't block a submit of the committed value",
  render: () => <EditableInAForm committed="Apollo" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // open the draft and empty it, leaving it open
    await userEvent.click(canvas.getByRole("button", { name: /Apollo/ }));
    const draft = await waitFor(() => canvas.getByRole("textbox", { name: "Project name" }));
    await userEvent.clear(draft);
    await expect(draft).toHaveValue("");
    // a real submit through the form's own API, as a keyboard shortcut would
    const form = canvas.getByRole("form", { name: "Project" }) as HTMLFormElement;
    form.requestSubmit();
    await waitFor(() => expect(submittedBy(canvas.getByTestId("submitted"))).toContain("Apollo"));
    // the committed value went, not the draft, and nothing was marked invalid by the open field
    await expect(submittedBy(canvas.getByTestId("submitted"))).toContain('"project":"Apollo"');
    await expect(draft).not.toHaveAttribute("aria-invalid", "true");
  },
};

export const RequiredEditableTextWithNothingCommitted: Story = {
  name: "A required EditableText with nothing committed is refused by the form",
  render: () => <EditableInAForm committed="" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("form", { name: "Project" }) as HTMLFormElement;
    form.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 300));
    // refused: nothing was submitted, the field is shown as the one that is wrong, and focus is on it
    await expect(submittedBy(canvas.getByTestId("submitted"))).toBe("nothing submitted");
    await waitFor(() => expect(canvas.getByRole("button", { name: /Project name/ })).toHaveFocus());
    await expect(canvas.getByText("This field is required")).toBeInTheDocument();
  },
};

