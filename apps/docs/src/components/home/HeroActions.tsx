import { Button, Link } from "@dbm-system/components";
import { footerColumns, hrefOf } from "../../data/site";

// "All components" from the site map: Storybook until the component pages exist (M2).
const allComponents = footerColumns.flatMap((column) => column.links).find((link) => link.label === "All components");

/**
 * The hero's calls to action. Built in React rather than in the page because `asChild` needs the link
 * element itself; children passed from Astro arrive wrapped in Astro's own slot element.
 */
export function HeroActions() {
  return (
    <>
      <Button size="lg" asChild>
        <a href="/docs/quick-start">Get started</a>
      </Button>
      <Button size="lg" variant="secondary" asChild>
        <a href={(allComponents && hrefOf(allComponents)) ?? "/storybook/"}>Browse components</a>
      </Button>
      <Link href="/storybook/">Open Storybook</Link>
    </>
  );
}
