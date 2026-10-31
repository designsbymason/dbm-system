import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel } from "./Carousel";
import { DemoSlide } from "./CarouselStoryKit";

// Docs-only (guidelines/adr/0013) — `Carousel.Indicators`'s own props get their own Properties table on Carousel.mdx.
// Rendered inside a real `Carousel`, whose context it reads.
const meta: Meta<typeof Carousel.Indicators> = {
  title: "Organisms/Media/Carousel/Indicators",
  component: Carousel.Indicators,
  tags: ["!dev"],
  argTypes: {
    variant: {
      control: "select",
      options: ["dots", "outlined", "bars"],
      description: "The look of the indicators, in place of the carousel's indicators prop.",
    },
    placement: {
      control: "select",
      options: ["below", "overlay"],
      description: "Where they are drawn, in place of the carousel's indicatorsPlacement.",
    },
    showLabel: {
      control: "boolean",
      description: "Shows a text progress label (3/8) beside the indicators.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": { control: "text", description: "The accessible name of the group, in place of the carousel's indicators label." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Extra class name on the part's element." },
    style: { control: false, description: "Inline styles on the part's element." },
    "data-testid": { control: false, description: "Test hook, passed through to the part's element." },
  },
  render: (args) => (
    <Carousel aria-label="Indicators" indicators={false}>
      <Carousel.Indicators {...args} />
      {[0, 1, 2].map((index) => (
        <DemoSlide key={index} index={index} />
      ))}
    </Carousel>
  ),
};

export default meta;

type Story = StoryObj<typeof Carousel.Indicators>;

export const Indicators: Story = {};
