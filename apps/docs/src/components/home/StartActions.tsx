import { Button } from "@dbm-system/components";
import { quickStart, theming } from "../../data/site";

/**
 * Where the steps lead: the Quick start page, and the Guides (its first page, Theming). Built in React rather than in the page
 * because `asChild` needs the link element itself; children passed from Astro arrive wrapped in Astro's own slot element.
 */
export function StartActions() {
  return (
    <>
      <Button size="lg" asChild>
        <a href={quickStart.href}>Quick start</a>
      </Button>
      <Button size="lg" variant="secondary" asChild>
        <a href={theming.href}>Guides</a>
      </Button>
    </>
  );
}
