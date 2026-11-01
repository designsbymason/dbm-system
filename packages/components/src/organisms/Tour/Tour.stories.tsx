import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { tourPlaygroundSnippet, tourSnippets } from "./Tour.snippets";
import type { TourPresentation, TourProgress, TourProps } from "./Tour.types";
import { ControlledDemo, ControllerDemo, Demo, interactiveSteps, SeenOnceDemo, welcomeSteps } from "./TourStoryKit";
import type { DemoProps } from "./TourStoryKit";

interface PlaygroundArgs extends DemoProps {
  presentation: TourPresentation;
  progress: TourProgress;
  scrimOpacity: number;
  closeOnOutsidePress: boolean;
  targetTimeout: number;
  dir: "ltr" | "rtl";
  "aria-label": string;
  container?: TourProps["container"];
}

// A tour is drawn into a stage box on the Docs page (a containing block for fixed descendants), and every story starts
// closed: an open one would take focus and dim its stage the moment the page loaded.
const noControls = {
  presentation: { control: false },
  progress: { control: false },
  scrimOpacity: { control: false },
  closeOnOutsidePress: { control: false },
  targetTimeout: { control: false },
  dir: { control: false },
  "aria-label": { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Overlay/Tour",
  parameters: { layout: "padded" },
  argTypes: {
    steps: {
      control: false,
      description:
        "The steps, in order: an id, an optional target (a selector, an element, a ref or a function), a title and text, and per step a side, align, padding, interactive and its own button text.",
    },
    open: {
      control: false,
      description: "Whether the tour is open. Omit it (with defaultOpen) and the tour keeps its own state, opened with the controller.",
    },
    defaultOpen: { control: false, description: "Whether it starts open, when uncontrolled.", table: { defaultValue: { summary: "false" } } },
    onOpenChange: {
      control: false,
      description: "Called when the tour opens or closes, with the reason (finish, skip, escape, outside or controller) and the step.",
    },
    value: { control: false, description: "The id of the step showing. Makes the step controlled." },
    defaultValue: { control: false, description: "The step to start on, when uncontrolled.", table: { defaultValue: { summary: "The first step" } } },
    onValueChange: { control: false, description: "Called with a step's id when the person (or the controller) moves to it." },
    presentation: {
      control: "select",
      options: ["anchored", "docked"],
      description:
        "How the card is placed: beside the highlighted element, or docked across the bottom of the screen (for a phone). A mobile-first map by breakpoint works too.",
      table: { defaultValue: { summary: '"anchored"' } },
    },
    progress: {
      control: "select",
      options: ["text", "none"],
      description: 'What the card shows for progress: "Step 2 of 5", or nothing.',
      table: { defaultValue: { summary: '"text"' } },
    },
    scrimOpacity: {
      control: { type: "number", min: 0, max: 1, step: 0.1 },
      description: "How dark the dimmed page is, 0 to 1.",
      table: { defaultValue: { summary: "0.6" } },
    },
    closeOnOutsidePress: {
      control: "boolean",
      description: "Whether pressing the dimmed page closes the tour. Off by default, so a stray press does not end it.",
      table: { defaultValue: { summary: "false" } },
    },
    targetTimeout: {
      control: { type: "number", min: 0, step: 100 },
      description: "How long, in milliseconds, to wait for a step's element to appear before showing the card in the middle of the screen.",
      table: { defaultValue: { summary: "1000" } },
    },
    onTargetMissing: { control: false, description: "Called, once per step, when a step's element is not found within targetTimeout." },
    container: {
      control: false,
      description: "The element the tour is drawn into, in place of document.body. A box that is a containing block for fixed descendants holds it inside a demo.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: 'The text direction of the card and of "start" and "end". Set, not read from the page.',
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: { control: false, description: "The text the tour writes itself: next, back, skip, finish, stepOf, announcement and dialog." },
    formatNumber: { control: false, description: "Writes the numbers the tour shows.", table: { defaultValue: { summary: "String" } } },
    controllerRef: { control: false, description: "A controller for code outside the tour: open, close, next, back and go to a step." },
    className: { control: false, description: "Additional CSS classes, on the card." },
    style: { control: false, description: "Inline styles, on the card." },
    id: { control: false, description: "Standard DOM id, on the card." },
    "data-testid": { control: false, description: "Test identifier, on the card." },
    "aria-label": { control: "text", description: "Names the card. By default it is named by the step's title." },
    "aria-labelledby": { control: false, description: "Points at an element that names the card, in place of the step's title." },
    "aria-describedby": { control: false, description: "Points at an element that describes the card, in place of the step's text." },
  },
};
export default meta;

type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  args: {
    presentation: "anchored",
    progress: "text",
    scrimOpacity: 0.6,
    closeOnOutsidePress: false,
    targetTimeout: 1000,
    dir: "ltr",
    "aria-label": "",
  },
  parameters: {
    docs: {
      source: { type: "dynamic", transform: (_code: string, context: { args: PlaygroundArgs }) => tourPlaygroundSnippet(context.args) },
    },
  },
  render: ({ "aria-label": ariaLabel, ...args }) => <Demo {...args} aria-label={ariaLabel || undefined} />,
};

export const Docked: Story = {
  args: { presentation: "docked" },
  argTypes: { ...noControls, presentation: { control: false } },
  parameters: { docs: { source: { code: tourSnippets.docked } } },
  render: (args) => <Demo presentation={args.presentation} />,
};

export const InteractiveStep: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.interactive } } },
  render: () => <Demo steps={interactiveSteps} />,
};

export const WithoutElements: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.welcome } } },
  render: () => <Demo steps={welcomeSteps} />,
};

export const Controlled: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.controlled } } },
  render: () => <ControlledDemo />,
};

export const WithController: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.controller } } },
  render: () => <ControllerDemo />,
};

export const SeenOnce: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.seenOnce } } },
  render: () => <SeenOnceDemo />,
};

export const Translated: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.translated } } },
  render: () => (
    <Demo
      labels={{ next: "Weiter", back: "Zurück", skip: "Tour überspringen", finish: "Fertig", stepOf: (n, total) => `Schritt ${n} von ${total}` }}
    />
  ),
};

export const RightToLeft: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tourSnippets.rightToLeft } } },
  render: () => <Demo dir="rtl" />,
};

// The interaction test runs hidden: a shown story must not end in a different state from the one it starts in.
export const BasicInteraction: Story = {
  name: "Basic — interaction test",
  tags: ["!dev"],
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Start the tour" }));
    const dialog = await within(canvasElement).findByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Search");
    await userEvent.click(within(dialog).getByRole("button", { name: "Next" }));
    await waitFor(() => expect(canvas.getByRole("dialog")).toHaveAccessibleName("Start something new"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
  },
};
