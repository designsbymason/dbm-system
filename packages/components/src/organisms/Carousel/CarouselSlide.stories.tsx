import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel } from "./Carousel";

// Docs-only (guidelines/adr/0013) — the parts' own props get their own Properties tables on Carousel.mdx.
// Each is rendered inside a real `Carousel`, whose context it reads.
const meta: Meta<typeof Carousel.Slide> = {
  title: "Organisms/Media/Carousel/Slide",
  component: Carousel.Slide,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "What the slide shows." },
    placeholder: { control: false, description: "What the slide draws in place of its content while it is far from the view and the carousel is lazy. Give the slide a size of its own, since a placeholder-only slide has none." },
    "aria-label": { control: "text", description: "The accessible name of the slide, in place of its place in the carousel (3 of 8)." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Extra class name on the slide." },
    style: { control: false, description: "Inline styles on the slide." },
    "data-testid": { control: false, description: "Test hook, passed through to the slide." },
  },
  render: (args) => (
    <Carousel aria-label="Slide">
      <Carousel.Slide {...args}>Slide</Carousel.Slide>
      <Carousel.Slide>Another</Carousel.Slide>
    </Carousel>
  ),
};

export default meta;

type Story = StoryObj<typeof Carousel.Slide>;

export const Slide: Story = {};
