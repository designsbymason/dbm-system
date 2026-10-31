import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel } from "./Carousel";
import { DemoSlide } from "./CarouselStoryKit";

// Docs-only (guidelines/adr/0013) — `Carousel.Previous`'s own props get their own Properties table on Carousel.mdx.
// Rendered inside a real `Carousel`, whose context it reads.
const meta: Meta<typeof Carousel.Previous> = {
  title: "Organisms/Media/Carousel/Previous",
  component: Carousel.Previous,
  tags: ["!dev"],
  argTypes: {
    icon: { control: false, description: "An icon in place of the arrow." },
    "aria-label": { control: "text", description: "The accessible name, in place of the carousel's previous label." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Extra class name on the part's element." },
    style: { control: false, description: "Inline styles on the part's element." },
    "data-testid": { control: false, description: "Test hook, passed through to the part's element." },
  },
  render: (args) => (
    <Carousel aria-label="Previous" defaultValue={1} controls="overlay">
      <Carousel.Previous {...args} />
      {[0, 1, 2].map((index) => (
        <DemoSlide key={index} index={index} />
      ))}
    </Carousel>
  ),
};

export default meta;

type Story = StoryObj<typeof Carousel.Previous>;

export const Previous: Story = {};
