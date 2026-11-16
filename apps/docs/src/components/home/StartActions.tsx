import { Button } from "@dbm-system/components";
import { installation } from "../../data/site";

/**
 * Where the steps lead: the full installation page, and the table of components above. Built in React rather than in the page
 * because `asChild` needs the link element itself; children passed from Astro arrive wrapped in Astro's own slot element.
 */
export function StartActions() {
  return (
    <>
      <Button size="lg" asChild>
        <a href={installation.href}>Getting started</a>
      </Button>
      <Button size="lg" variant="secondary" asChild>
        <a href="#components">All components</a>
      </Button>
    </>
  );
}
