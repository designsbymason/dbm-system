// The code shown under each story's "Show code" button on NavigationMenu's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only helpers, which can't
// be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type {
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuPanelAlign,
  NavigationMenuPresentation,
  NavigationMenuSize,
} from "./NavigationMenu.types";

const panel = `    <NavigationMenu.Item value="products">
      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Group label="Platform" columns={2}>
          <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team">
            Analytics
          </NavigationMenu.Link>
          <NavigationMenu.Link href="/automation" icon={LightningIcon} description="Workflows that run themselves">
            Automation
          </NavigationMenu.Link>
        </NavigationMenu.Group>
      </NavigationMenu.Content>
    </NavigationMenu.Item>`;

const pricing = (attributes = "") =>
  `    <NavigationMenu.Item>
      <NavigationMenu.Link href="/pricing"${attributes}>Pricing</NavigationMenu.Link>
    </NavigationMenu.Item>`;

const menu = (attributes = "", items = `${panel}\n${pricing(" current")}`) =>
  `<NavigationMenu aria-label="Primary"${attributes ? ` ${attributes}` : ""}>
  <NavigationMenu.List>
${items}
  </NavigationMenu.List>
</NavigationMenu>`;

export const navigationMenuSnippets = {
  default: `{/* ChartBarIcon and LightningIcon come from @dbm-system/icons */}
${menu()}`,

  ownPanels: `{/* viewport={false}: each panel hangs from its own item instead of sharing one area that resizes between them.
    panelAlign: "start" (default) | "center" */}
${menu('viewport={false} panelAlign="center"')}`,

  stacked: `{/* presentation="stacked": a vertical list of disclosure buttons, for a phone or a side panel.
    A width map chooses by screen: presentation={{ base: "stacked", md: "mega" }} */}
${menu('presentation="stacked"')}`,

  currentVariants: `{/* currentVariant: "underline" (default) | "subtle" | "solid" — how the current page is marked.
    aria-current="page" is set whichever it is. */}
${menu('currentVariant="solid"')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
${menu('size="lg"')}`,

  rounded: `{/* rounded: every trigger and link is a pill */}
${menu("rounded")}`,

  controlled: `{/* const [open, setOpen] = useState("");  open is the open item's value, "" for none */}
<NavigationMenu aria-label="Primary" value={open} onValueChange={setOpen}>
  <NavigationMenu.List>
    <NavigationMenu.Item value="products">
      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Group label="Platform">
          <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
        </NavigationMenu.Group>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>`,

  inNavbar: `{/* In the bar it is a mega menu; in the bar's phone menu it is the stacked form, and a link chosen closes the menu */}
<Navbar>
  <Navbar.Brand>dbM</Navbar.Brand>
  <Navbar.Links aria-label="Primary">
    <NavigationMenu>
      <NavigationMenu.List>
${panel.replace(/^/gm, "    ")}
${pricing(" current").replace(/^/gm, "    ")}
      </NavigationMenu.List>
    </NavigationMenu>
  </Navbar.Links>
</Navbar>`,

  rightToLeft: `{/* dir is passed to the primitive and every part around it, not read from the page */}
${menu('dir="rtl"')}`,
};

/** The Playground's snippet: only the props that differ from their defaults, around a small real example. */
export function navigationMenuPlaygroundSnippet(args: {
  presentation?: NavigationMenuPresentation;
  viewport?: boolean;
  panelAlign?: NavigationMenuPanelAlign;
  size?: NavigationMenuSize;
  currentVariant?: NavigationMenuCurrentVariant;
  rounded?: boolean;
  delayDuration?: number;
  skipDelayDuration?: number;
  dir?: NavigationMenuDirection;
  "aria-label"?: string;
}): string {
  const attributes: string[] = [];
  const label = args["aria-label"];
  attributes.push(`aria-label=${label !== undefined && label !== "" ? quote(label) : '"Primary"'}`);
  if (args.presentation !== undefined && args.presentation !== "mega") attributes.push(`presentation=${quote(args.presentation)}`);
  if (args.viewport === false) attributes.push("viewport={false}");
  if (args.panelAlign !== undefined && args.panelAlign !== "start") attributes.push(`panelAlign=${quote(args.panelAlign)}`);
  if (args.size !== undefined && args.size !== "md") attributes.push(`size=${quote(args.size)}`);
  if (args.currentVariant !== undefined && args.currentVariant !== "underline") attributes.push(`currentVariant=${quote(args.currentVariant)}`);
  if (args.rounded === true) attributes.push("rounded");
  if (typeof args.delayDuration === "number" && args.delayDuration !== 200) attributes.push(`delayDuration={${args.delayDuration}}`);
  if (typeof args.skipDelayDuration === "number" && args.skipDelayDuration !== 300) attributes.push(`skipDelayDuration={${args.skipDelayDuration}}`);
  if (args.dir !== undefined && args.dir !== "ltr") attributes.push(`dir=${quote(args.dir)}`);
  const [first, ...rest] = attributes;
  const opening = rest.length === 0 ? `<NavigationMenu ${first}>` : `<NavigationMenu ${first}\n  ${rest.join("\n  ")}\n>`;
  return `{/* ChartBarIcon and LightningIcon come from @dbm-system/icons */}
${opening}
  <NavigationMenu.List>
${panel}
${pricing(" current")}
  </NavigationMenu.List>
</NavigationMenu>`;
}
