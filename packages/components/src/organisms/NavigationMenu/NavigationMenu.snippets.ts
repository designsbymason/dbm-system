// The code shown under each story's "Show code" button on NavigationMenu's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only helpers, which can't
// be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type {
  NavigationMenuCurrentVariant,
  NavigationMenuCurrentMatch,
  NavigationMenuDirection,
  NavigationMenuOrientation,
  NavigationMenuPanelAlign,
  NavigationMenuPanelSize,
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

  split: `{/* A trigger with an href is a link beside a caret button that opens the panel; the link opens it on hover too */}
<NavigationMenu aria-label="Primary">
  <NavigationMenu.List>
    <NavigationMenu.Item value="products">
      <NavigationMenu.Trigger href="/products">Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>`,

  richPanel: `{/* ChartBarIcon, LightningIcon, ShieldCheckIcon and PlugsIcon come from @dbm-system/icons */}
<NavigationMenu aria-label="Primary">
  <NavigationMenu.List>
    <NavigationMenu.Item value="products">
      <NavigationMenu.Trigger badge="New">Products</NavigationMenu.Trigger>
      <NavigationMenu.Content layout="columns">
        <NavigationMenu.Group label="Platform" href="/platform">
          <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team" descriptionLines={2}>
            Analytics
          </NavigationMenu.Link>
          <NavigationMenu.Link href="/automation" icon={LightningIcon} description="Workflows that run themselves">
            Automation
          </NavigationMenu.Link>
        </NavigationMenu.Group>
        <NavigationMenu.Group label="Trust">
          <NavigationMenu.Link href="/security" icon={ShieldCheckIcon}>Security</NavigationMenu.Link>
          <NavigationMenu.Link href="/integrations" icon={PlugsIcon} badge="New">Integrations</NavigationMenu.Link>
        </NavigationMenu.Group>
        <NavigationMenu.Feature title="Launch week" href="/launch">
          Everything we shipped this quarter.
        </NavigationMenu.Feature>
        <NavigationMenu.Footer>
          <NavigationMenu.Link href="/products">View all products</NavigationMenu.Link>
        </NavigationMenu.Footer>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>`,

  panelAlign: `{/* panelAlign: "start" (default) | "center" | "end" | "auto" — auto is end when there is more room toward the start side.
    Panels are kept on the screen either way, their links wrapping to the room there is. */}
${menu('panelAlign="auto"')}`,

  panelSizes: `{/* panelSize: "auto" (default) | "sm" | "md" | "lg" | "full" — full spans the nearest positioned ancestor (a sticky Navbar, or a box with position: relative) */}
${menu('panelSize="md"')}`,

  vertical: `{/* orientation="vertical": a column of triggers with their panels beside them; ArrowUp and ArrowDown move between them */}
${menu('orientation="vertical"')}`,

  indicator: `{/* indicator: a small arrow from the open trigger to its panel, sliding between triggers */}
${menu("indicator")}`,

  currentPath: `{/* currentPath: the page's path. A link with that href is the current page, and so is the trigger of the panel that holds it.
    A link's own current wins. currentMatch="prefix" also matches everything under a link's path. */}
${menu('currentPath="/analytics"', `${panel}\n${pricing()}`)}`,

  stackedSeveralOpen: `{/* exclusive={false}: several items can be open at once in the stacked form. An item that holds the current page starts open. */}
${menu('presentation="stacked" exclusive={false} currentPath="/analytics"', `${panel}\n${pricing()}`)}`,

  controller: `{/* const controller = useRef<NavigationMenuController>(null);
    controller.current?.open("products")  // true when it was not already open
    controller.current?.close()           // true when one was open */}
<NavigationMenu aria-label="Primary" controllerRef={controller} onOpenChangeComplete={(open, value) => {}}>
  <NavigationMenu.List>
    <NavigationMenu.Item value="products">
      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>`,

  rightToLeft: `{/* dir is passed to the primitive and every part around it, not read from the page */}
${menu('dir="rtl"')}`,
};

/** The Playground's snippet: only the props that differ from their defaults, around a small real example. */
export function navigationMenuPlaygroundSnippet(args: {
  defaultValue?: string;
  presentation?: NavigationMenuPresentation;
  viewport?: boolean;
  panelAlign?: NavigationMenuPanelAlign;
  panelSize?: NavigationMenuPanelSize;
  orientation?: NavigationMenuOrientation;
  indicator?: boolean;
  exclusive?: boolean;
  currentPath?: string;
  currentMatch?: NavigationMenuCurrentMatch;
  currentType?: "page" | "location";
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
  if (typeof args.defaultValue === "string" && args.defaultValue !== "") attributes.push(`defaultValue=${quote(args.defaultValue)}`);
  if (args.presentation !== undefined && args.presentation !== "mega") attributes.push(`presentation=${quote(args.presentation)}`);
  if (args.viewport === false) attributes.push("viewport={false}");
  if (args.panelAlign !== undefined && args.panelAlign !== "start") attributes.push(`panelAlign=${quote(args.panelAlign)}`);
  if (args.panelSize !== undefined && args.panelSize !== "auto") attributes.push(`panelSize=${quote(args.panelSize)}`);
  if (args.orientation !== undefined && args.orientation !== "horizontal") attributes.push(`orientation=${quote(args.orientation)}`);
  if (args.indicator === true) attributes.push("indicator");
  if (args.exclusive === false) attributes.push("exclusive={false}");
  if (typeof args.currentPath === "string" && args.currentPath !== "") attributes.push(`currentPath=${quote(args.currentPath)}`);
  if (args.currentMatch !== undefined && args.currentMatch !== "exact") attributes.push(`currentMatch=${quote(args.currentMatch)}`);
  if (args.currentType !== undefined && args.currentType !== "page") attributes.push(`currentType=${quote(args.currentType)}`);
  if (args.size !== undefined && args.size !== "md") attributes.push(`size=${quote(args.size)}`);
  if (args.currentVariant !== undefined && args.currentVariant !== "underline") attributes.push(`currentVariant=${quote(args.currentVariant)}`);
  if (args.rounded === true) attributes.push("rounded");
  if (typeof args.delayDuration === "number" && args.delayDuration !== 200) attributes.push(`delayDuration={${args.delayDuration}}`);
  if (typeof args.skipDelayDuration === "number" && args.skipDelayDuration !== 300) attributes.push(`skipDelayDuration={${args.skipDelayDuration}}`);
  if (args.dir !== undefined && args.dir !== "ltr") attributes.push(`dir=${quote(args.dir)}`);
  const [first, ...rest] = attributes;
  const opening = rest.length === 0 ? `<NavigationMenu ${first}>` : `<NavigationMenu ${first}\n  ${rest.join("\n  ")}\n>`;
  // With a path the menu finds the current page itself; without one the link says so.
  const hasPath = typeof args.currentPath === "string" && args.currentPath !== "";
  return `{/* ChartBarIcon and LightningIcon come from @dbm-system/icons */}
${opening}
  <NavigationMenu.List>
${panel}
${pricing(hasPath ? "" : " current")}
  </NavigationMenu.List>
</NavigationMenu>`;
}
