import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { FieldGroup } from "../../molecules/FieldGroup";
import { FormField } from "../../molecules/FormField";
import { PasswordInput } from "../../molecules/PasswordInput";
import { Toast, useToast } from "../Toast";
import { ToastStage } from "../Toast/ToastStoryKit";
import { Form, useFormController, useFormState } from "./Form";
import { formPlaygroundSnippet, formSnippets } from "./Form.snippets";
import { EmailAndUsername, Stage, Submitted, useSubmitted } from "./FormStoryKit";
import type { FormController, FormErrors, FormProps, FormValues } from "./Form.types";

const meta: Meta<typeof Form> = {
  title: "Components/Form",
  id: "organisms-inputs-form",
  component: Form,
  parameters: { layout: "padded" },
  // Keys follow the component's own `FormProps` declaration order (07 §4 item 3).
  argTypes: {
    children: { control: false, description: "The form's content: fields, groups, a Form.Summary, Form.Actions." },
    onSubmit: {
      control: false,
      description:
        "Called when the form is submitted and valid, with the values (by field name), the FormData and the event. May return a promise: the form is busy until it settles.",
    },
    onSubmitError: { control: false, description: "Called when an onSubmit promise rejects." },
    onInvalidSubmit: { control: false, description: "Called when a submit is refused because of errors, with every error found." },
    validate: {
      control: false,
      description: "A rule for the whole form, run after each field's own: receives every value and returns messages by field name.",
    },
    errors: {
      control: false,
      description:
        "Errors set from outside (a server's answer), by field name. Shown beside the form's own and over them for the same field.",
    },
    onErrorsChange: {
      control: false,
      description: "Called with the errors to use instead when an edit makes one of the outside errors out of date, or on reset.",
    },
    error: {
      control: false,
      description:
        "A message about the form as a whole, for a Form.Error to show. Without it, Form.Error shows labels.submitFailed after an onSubmit promise rejects.",
    },
    validateOn: {
      control: "select",
      options: ["submit", "blur", "change"],
      description: "When a field is checked as it is edited, before a submit has been refused. After one, every field is checked as it is edited.",
      table: { defaultValue: { summary: '"submit"' } },
    },
    focusTarget: {
      control: "select",
      options: ["field", "summary", false],
      description: "Where focus goes when a submit is refused: the first invalid control, the summary, or nowhere (false).",
      table: { defaultValue: { summary: '"field"' } },
    },
    disabled: {
      description: "Disables the whole form: every FormField inside and the submit button, and a submit does nothing.",
      table: { defaultValue: { summary: "false" } },
    },
    // No value of its own by default, so its live control is on the Playground alone, with a "default" choice that
    // isn't a real value.
    size: {
      control: false,
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size handed to every FormField inside as its default (its label and the control it hands its size to).",
    },
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16],
      description: "The space between the form's children, as a step on the spacing scale — a single value or a breakpoint map.",
      table: { defaultValue: { summary: "4" } },
    },
    noValidate: {
      description:
        "Holds back the browser's own validation bubbles so the form can show errors in the page. The browser's rules still apply: the form reads them.",
      table: { defaultValue: { summary: "true" } },
    },
    requiredLegend: {
      control: "boolean",
      description:
        "Explains the asterisk on a required field's label, as a line above the fields: true writes the asterisk and labels.requiredLegend; content of your own is shown as it is. Shown only while a FormField in the form is required.",
      table: { defaultValue: { summary: "false" } },
    },
    labels: {
      control: false,
      description:
        "Text the form writes itself: the summary's heading and the count it announces, a message for each way the browser can call a value wrong (valueMissing, typeMismatch, tooShort…), submitFailed and validationFailed.",
    },
    formatNumber: {
      control: false,
      description: "Writes the counts in labels; digits for a script that doesn't use ASCII ones.",
      table: { defaultValue: { summary: "String" } },
    },
    controllerRef: {
      control: false,
      description:
        "Hands the form's controls (submit, reset, focusField, validate, setErrors, clearErrors) to code outside it. Inside the form, useFormController() returns the same object.",
    },
    action: { control: false, description: "Where the form is sent when it is submitted without an onSubmit — a URL, or a function that receives the FormData." },
    method: { control: false, description: "How the form is sent without an onSubmit." },
    encType: { control: false, description: "How a native post is encoded; multipart/form-data when the form has a file input." },
    target: { control: false, description: "Where the response to a native submit is shown: _self, _blank, or a frame's name." },
    autoComplete: { control: false, description: "Lets the browser fill the form's fields in (on, off, or an autofill token)." },
    name: { control: false, description: "The form's name in document.forms." },
    onChange: {
      control: false,
      description: "Called when a control inside the form changes, in addition to the form's own handling of it.",
    },
    onBlur: {
      control: false,
      description: "Called when focus leaves a control inside the form, in addition to the form's own handling of it.",
    },
    onReset: {
      control: false,
      description: "Called when the form is reset, in addition to clearing its errors. A control driven by state isn't reset by the browser: clear it here.",
    },
    "aria-label": { control: "text", description: "The form's accessible name; a form is only a landmark once it has one." },
    "aria-labelledby": { control: false, description: "Points at an element that names the form." },
    "aria-describedby": { control: false, description: "Points at an element that describes the form." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for the form." },
    style: { control: false, description: "Inline styles for the form." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
    // Storybook only: not a prop. It puts a Form.Summary in the demo.
    summary: {
      control: "boolean",
      description: "Storybook only — not a Form prop: draws a Form.Summary above the fields.",
      table: { disable: true },
    },
  } as Meta<typeof Form>["argTypes"],
  // Every controllable prop gets an explicit value, matching its real default (07 §5).
  args: {
    "aria-label": "Create account",
    validateOn: "submit",
    focusTarget: "field",
    disabled: false,
    gap: 4,
    noValidate: true,
    requiredLegend: false,
  },
};

export default meta;

type Story = StoryObj<typeof Form>;

/** The demo form: two fields and a submit, with what was submitted written under it. */
function Demo({
  summary = false,
  fields,
  actions,
  ...props
}: FormProps & { summary?: boolean; fields?: ReactNode; actions?: ReactNode }) {
  const { values, setValues } = useSubmitted();
  return (
    <Stage>
      <Form onSubmit={(submitted) => setValues(submitted)} {...props}>
        {summary && <Form.Summary />}
        {fields ?? EmailAndUsername}
        {actions ?? (
          <Form.Actions>
            <Form.Submit>Create account</Form.Submit>
          </Form.Actions>
        )}
      </Form>
      <Submitted values={values} />
    </Stage>
  );
}

/** The Playground's "default" choice isn't a real size; turn it back into "leave the prop out". */
const fromPlayground = (args: Record<string, unknown>) => {
  const { size, ...rest } = args as { size?: string };
  return { ...rest, size: size === "default" || size === undefined ? undefined : size } as FormProps & { summary?: boolean };
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  args: { size: "default", summary: false } as unknown as Story["args"],
  argTypes: { size: { control: "select", options: ["default", "xs", "sm", "md", "lg", "xl"] } },
  render: (args) => <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} />,
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) =>
          formPlaygroundSnippet(context.args as Parameters<typeof formPlaygroundSnippet>[0]),
      },
    },
  },
};

export const Basic: Story = {
  name: "Submitting",
  parameters: { docs: { source: { code: formSnippets.basic } } },
  argTypes: { validateOn: { control: false }, focusTarget: { control: false }, size: { control: false } },
  render: (args) => <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} />,
};

export const Validation: Story = {
  name: "Rules for a field and for the form",
  parameters: { docs: { source: { code: formSnippets.validation } } },
  argTypes: { "aria-label": { control: false }, validate: { control: false }, validateOn: { control: false } },
  render: (args) => (
    <Demo
      {...fromPlayground(args as unknown as Record<string, unknown>)}
      aria-label="Create account with a password"
      validate={(values) => (values.password !== values.confirm ? { confirm: "The passwords don't match" } : undefined)}
      fields={
        <>
          <FormField
            label="Username"
            name="username"
            validate={(value) => (String(value ?? "").length < 3 ? "Use 3 or more characters" : undefined)}
          >
            {(field) => <Input {...field} />}
          </FormField>
          <FormField label="Password" name="password" required>
            {(field) => <PasswordInput {...field} />}
          </FormField>
          <FormField label="Confirm password" name="confirm" required>
            {(field) => <PasswordInput {...field} />}
          </FormField>
        </>
      }
    />
  ),
};

export const Summary: Story = {
  name: "An error summary",
  parameters: { docs: { source: { code: formSnippets.summary } } },
  argTypes: { focusTarget: { control: false } },
  render: (args) => <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} summary focusTarget="summary" />,
};

export const ValidateOn: Story = {
  name: "When a field is checked",
  parameters: { docs: { source: { code: formSnippets.validateOn } } },
  argTypes: { "aria-label": { control: false }, validateOn: { control: false } },
  render: (args) => (
    <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} aria-label="Create account" validateOn="blur" />
  ),
};

export const Async: Story = {
  name: "A submit that takes time",
  parameters: { docs: { source: { code: formSnippets.async } } },
  argTypes: { onSubmit: { control: false } },
  render: function Render(args) {
    const { values, setValues } = useSubmitted();
    return (
      <Stage>
        <Form
          {...fromPlayground(args as unknown as Record<string, unknown>)}
          onSubmit={async (submitted) => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setValues(submitted);
          }}
        >
          <FormField label="Email" name="email" required>
            {(field) => <Input {...field} type="email" placeholder="you@example.com" />}
          </FormField>
          <Form.Actions>
            <Form.Submit loadingText="Creating…">Create account</Form.Submit>
          </Form.Actions>
        </Form>
        <Submitted values={values} />
      </Stage>
    );
  },
};

export const ServerErrors: Story = {
  name: "Errors from the server",
  parameters: { docs: { source: { code: formSnippets.serverErrors } } },
  argTypes: { errors: { control: false }, onErrorsChange: { control: false } },
  render: function Render(args) {
    const [errors, setErrors] = useState<FormErrors>({});
    const { values, setValues } = useSubmitted();
    return (
      <Stage>
        <Form
          {...fromPlayground(args as unknown as Record<string, unknown>)}
          errors={errors}
          onErrorsChange={setErrors}
          onSubmit={async (submitted: FormValues) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            if (submitted.email === "taken@example.com") {
              setErrors({ email: "That email address is already registered" });
              return;
            }
            setValues(submitted);
          }}
        >
          <FormField label="Email" name="email" required helperText="Try taken@example.com">
            {(field) => <Input {...field} type="email" />}
          </FormField>
          <Form.Actions>
            <Form.Submit loadingText="Checking…">Create account</Form.Submit>
          </Form.Actions>
        </Form>
        <Submitted values={values} />
      </Stage>
    );
  },
};

export const AsyncRule: Story = {
  name: "A rule that asks the server",
  parameters: { docs: { source: { code: formSnippets.asyncRule } } },
  argTypes: { "aria-label": { control: false }, validate: { control: false }, validateOn: { control: false } },
  render: function Render(args) {
    const { values, setValues } = useSubmitted();
    return (
      <Stage>
        <Form
          {...fromPlayground(args as unknown as Record<string, unknown>)}
          aria-label="Create account"
          validateOn="blur"
          onSubmit={(submitted) => setValues(submitted)}
        >
          <FormField
            label="Username"
            name="username"
            helperText="Try ada or grace — both are taken"
            validate={async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 700));
              return ["ada", "grace"].includes(String(value).toLowerCase()) ? "That username is taken" : undefined;
            }}
          >
            {(field) => <Input {...field} />}
          </FormField>
          <Form.Actions>
            <Form.Submit>Create account</Form.Submit>
          </Form.Actions>
        </Form>
        <Submitted values={values} />
      </Stage>
    );
  },
};

export const WholeFormError: Story = {
  name: "A message about the whole form",
  parameters: { docs: { source: { code: formSnippets.formError } } },
  argTypes: { "aria-label": { control: false }, error: { control: false } },
  render: function Render(args) {
    const { values, setValues } = useSubmitted();
    return (
      <Stage>
        <Form
          {...fromPlayground(args as unknown as Record<string, unknown>)}
          aria-label="Create account"
          onSubmit={async (submitted) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            if (submitted.email === "offline@example.com") throw new Error("offline");
            setValues(submitted);
          }}
        >
          <Form.Error />
          <FormField label="Email" name="email" required helperText="Try offline@example.com">
            {(field) => <Input {...field} type="email" />}
          </FormField>
          <Form.Actions>
            <Form.Submit loadingText="Creating…">Create account</Form.Submit>
          </Form.Actions>
        </Form>
        <Submitted values={values} />
      </Stage>
    );
  },
};

function Counter() {
  const { errors, pending } = useFormState();
  const count = Object.keys(errors).length;
  return (
    <p style={{ margin: 0, fontFamily: "var(--dbm-font-family-primary)", color: "var(--dbm-text-secondary)" }}>
      {pending ? "Saving…" : count === 0 ? "No problems found." : `${count} problem${count === 1 ? "" : "s"} found.`}
    </p>
  );
}

function FocusEmailButton() {
  const controller = useFormController();
  return (
    <Button type="button" variant="ghost" onClick={() => controller.focusField("email")}>
      Jump to email
    </Button>
  );
}

export const Controller: Story = {
  name: "Controlling it from outside",
  parameters: { docs: { source: { code: formSnippets.controller } } },
  argTypes: { "aria-label": { control: false }, controllerRef: { control: false } },
  render: function Render(args) {
    const controllerRef = useRef<FormController>(null);
    const { values, setValues } = useSubmitted();
    return (
      <Stage>
        <div style={{ display: "flex", gap: "var(--dbm-space-3)", marginBlockEnd: "var(--dbm-space-4)", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => controllerRef.current?.submit()}>
            Save from outside
          </Button>
          <Button variant="ghost" onClick={() => void controllerRef.current?.validate()}>
            Check only
          </Button>
          <Button variant="ghost" onClick={() => controllerRef.current?.reset()}>
            Reset
          </Button>
        </div>
        <Form
          {...fromPlayground(args as unknown as Record<string, unknown>)}
          aria-label="Create account"
          controllerRef={controllerRef}
          onSubmit={(submitted) => setValues(submitted)}
        >
          {EmailAndUsername}
          <Counter />
          <Form.Actions>
            <FocusEmailButton />
            <Form.Submit>Create account</Form.Submit>
          </Form.Actions>
        </Form>
        <Submitted values={values} />
      </Stage>
    );
  },
};

export const Labels: Story = {
  name: "In another language",
  parameters: { docs: { source: { code: formSnippets.labels } } },
  argTypes: { "aria-label": { control: false }, labels: { control: false } },
  render: (args) => (
    <Demo
      {...fromPlayground(args as unknown as Record<string, unknown>)}
      aria-label="Créer un compte"
      summary
      labels={{
        valueMissing: "Remplissez ce champ.",
        typeMismatch: (type) => (type === "email" ? "Saisissez une adresse e-mail." : "Le format est incorrect."),
        tooShort: (minimum) => `Utilisez au moins ${minimum} caractères.`,
        errorCount: (count) => `${count} erreurs.`,
        summaryTitle: (count) => `${count} problème${count === 1 ? "" : "s"} dans ce formulaire`,
      }}
    />
  ),
};

export const RequiredLegend: Story = {
  name: "Explaining the asterisk",
  parameters: { docs: { source: { code: formSnippets.requiredLegend } } },
  argTypes: { requiredLegend: { control: false } },
  render: (args) => <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} requiredLegend />,
};

function ToastDemo({ args }: { args: Record<string, unknown> }) {
  const { toast } = useToast();
  return (
    <div
      style={{
        inlineSize: "100%",
        maxInlineSize: "24rem",
        padding: "var(--dbm-space-4)",
        // The stage is the page's canvas, where helper text (tertiary) isn't allowed; a form sits on a surface.
        background: "var(--dbm-bg-surface)",
        borderRadius: "var(--dbm-radius-lg)",
      }}
    >
      <Form
        {...fromPlayground(args)}
        aria-label="Create account"
        onSubmit={async (submitted) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (submitted.email === "offline@example.com") throw new Error("offline");
          toast({ tone: "success", title: "Account created", description: "You can sign in now." });
        }}
        onSubmitError={() =>
          toast({ tone: "danger", title: "We couldn't create the account", description: "Try again in a moment." })
        }
      >
        <FormField label="Email" name="email" required helperText="Try offline@example.com to see a failure">
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Actions>
          <Form.Submit loadingText="Creating…">Create account</Form.Submit>
        </Form.Actions>
      </Form>
    </div>
  );
}

export const WithAToast: Story = {
  name: "Saved with a toast",
  parameters: { docs: { source: { code: formSnippets.toast } } },
  argTypes: { "aria-label": { control: false }, onSubmit: { control: false }, onSubmitError: { control: false } },
  render: (args) => (
    <ToastStage minBlockSize="24rem">
      {(container) => (
        <Toast.Provider container={container}>
          <ToastDemo args={args as unknown as Record<string, unknown>} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Layout: Story = {
  name: "Groups, size and gap",
  parameters: { docs: { source: { code: formSnippets.layout } } },
  argTypes: { "aria-label": { control: false }, size: { control: false }, gap: { control: false } },
  render: (args) => (
    <Demo
      {...fromPlayground(args as unknown as Record<string, unknown>)}
      aria-label="Delivery"
      size="lg"
      gap={6}
      fields={
        <FieldGroup legend="Address" columns={{ base: 1, md: 3 }}>
          <FieldGroup.Item span={{ base: 1, md: 3 }}>
            <FormField label="Street" name="street" required>
              {(field) => <Input {...field} />}
            </FormField>
          </FieldGroup.Item>
          <FieldGroup.Item span={{ base: 1, md: 2 }}>
            <FormField label="City" name="city" required>
              {(field) => <Input {...field} />}
            </FormField>
          </FieldGroup.Item>
          <FieldGroup.Item>
            <FormField label="Postcode" name="postcode" required>
              {(field) => <Input {...field} />}
            </FormField>
          </FieldGroup.Item>
        </FieldGroup>
      }
      actions={
        <Form.Actions align="end">
          <Button type="reset" variant="ghost">
            Reset
          </Button>
          <Form.Submit>Save address</Form.Submit>
        </Form.Actions>
      }
    />
  ),
};

export const Disabled: Story = {
  // A disabled field's helper text is `text.disabled`, 2.32:1 on the page: the already-accepted exemption (WCAG's
  // contrast rule excludes inactive components), the same annotation `FormField`'s own States story carries.
  parameters: { a11y: { test: "todo" }, docs: { source: { code: formSnippets.disabled } } },
  argTypes: { disabled: { control: false } },
  render: (args) => <Demo {...fromPlayground(args as unknown as Record<string, unknown>)} disabled />,
};

// --- Hidden tests (kept out of the sidebar and the Docs page) --------------------------------------------

export const RefusedSubmitInteraction: Story = {
  name: "A refused submit — interaction test",
  tags: ["!dev"],
  render: () => <Demo summary />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus());
    await expect(canvas.getByText("There is 1 problem with this form")).toBeInTheDocument();

    await userEvent.type(canvas.getByRole("textbox", { name: "Email" }), "ada@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(canvas.getByText(/Submitted:/)).toHaveTextContent("ada@example.com"));
  },
};
