import { Button, Link } from "@dbm-system/components";
import { allComponents, quickStart, storybookHref } from "../../data/site";

/**
 * The hero's calls to action. Built in React rather than in the page because `asChild` needs the link
 * element itself; children passed from Astro arrive wrapped in Astro's own slot element.
 */
export function HeroActions() {
  return (
    <>
      <Button size="lg" asChild>
        <a href={quickStart.href}>Get started</a>
      </Button>
      <Button size="lg" variant="secondary" asChild>
        <a href={allComponents.href}>Browse components</a>
      </Button>
      <Link href={storybookHref}>Open Storybook</Link>
    </>
  );
}
