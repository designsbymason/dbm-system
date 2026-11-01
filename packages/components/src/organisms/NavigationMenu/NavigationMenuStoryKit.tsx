import { BookOpenIcon, ChartBarIcon, CodeIcon, LightningIcon, PlugsIcon, ShieldCheckIcon, UsersIcon } from "@dbm-system/icons";
import { useState } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuProps } from "./NavigationMenu.types";

/** A box with a transform, so a panel drawn under the menu stays inside the demo (every Canvas on a Docs page shares one document). */
export function MenuStage({ children, height = "26rem" }: { children: ReactNode; height?: string }) {
  return (
    <div
      // a link in a demo goes nowhere, a split trigger's included
      onClickCapture={(event) => {
        if ((event.target as Element).closest('a[href^="#"], a[href^="/"]')) event.preventDefault();
      }}
      style={{
        inlineSize: "100%",
        blockSize: height,
        transform: "translateZ(0)",
        overflow: "hidden",
        padding: "var(--dbm-space-4)",
        boxSizing: "border-box",
        background: "var(--dbm-bg-surface)",
      }}
    >
      {children}
    </div>
  );
}

/** The page a demo starts on, in the words the stories use. */
export type DemoPage = "products" | "pricing" | "none";

const demoPaths: Record<DemoPage, string> = { products: "/analytics", pricing: "/pricing", none: "" };

/**
 * What a demo does with a click on one of its links: it goes nowhere, and the link becomes the current page, so a person trying the
 * menu sees the current-page look move. `initial` is where it starts; a new one (a changed control) puts it back there.
 */
export function useDemoPath(initial: string) {
  const [path, setPath] = useState(initial);
  const [start, setStart] = useState(initial);
  if (initial !== start) {
    setStart(initial);
    setPath(initial);
  }
  const choose = (event: MouseEvent) => {
    const anchor = (event.target as Element).closest("a[href]");
    const href = anchor?.getAttribute("href") ?? "";
    if (!href.startsWith("/") && !href.startsWith("#")) return;
    event.preventDefault();
    if (href.startsWith("/")) setPath(href);
  };
  return [path === "" ? undefined : path, choose] as const;
}

export type DemoMenuProps = NavigationMenuProps & {
  /** Where the demo starts (default: Pricing). A `currentPath` that is not empty says it instead. */
  currentPage?: DemoPage;
};

/** A menu whose links, once chosen, are the current page. Draws its own items from `children`. */
export function DemoNavigation({ currentPage = "pricing", currentPath, children, ...props }: DemoMenuProps) {
  const [path, choose] = useDemoPath(currentPath !== undefined && currentPath !== "" ? currentPath : demoPaths[currentPage]);
  return (
    <div onClickCapture={choose}>
      <NavigationMenu aria-label="Primary" {...props} currentPath={path}>
        {children}
      </NavigationMenu>
    </div>
  );
}

/** The items the stories share: two panels of grouped links, and a link or two beside them. */
export function DemoItems() {
  return (
    <NavigationMenu.List>
      <NavigationMenu.Item value="products">
        <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="Platform" columns={2}>
            <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team">
              Analytics
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/automation" icon={LightningIcon} description="Workflows that run themselves">
              Automation
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/security" icon={ShieldCheckIcon} description="Single sign-on, roles and audit logs">
              Security
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/integrations" icon={PlugsIcon} description="Connect the tools you already use" badge="New">
              Integrations
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="solutions">
        <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="By team">
            <NavigationMenu.Link href="/engineering" icon={CodeIcon}>
              Engineering
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/support" icon={UsersIcon}>
              Support
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="/docs" icon={BookOpenIcon} external>
          Docs
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

export function DemoMenu(props: DemoMenuProps) {
  return (
    <DemoNavigation {...props}>
      <DemoItems />
    </DemoNavigation>
  );
}

/** The same items inside a `Navbar`: drawn as a mega menu in the bar and stacked in the bar's phone menu. */
export function DemoNavbarMenu({
  collapseBelow = "md",
  currentVariant,
  rounded,
  dir,
  currentPage = "pricing",
  currentPath,
  presentation: _presentation,
  size: _size,
  "aria-label": ariaLabel = "Primary",
  ...props
}: DemoMenuProps & { collapseBelow?: "sm" | "md" | "lg" | "never" }) {
  const [path, choose] = useDemoPath(currentPath !== undefined && currentPath !== "" ? currentPath : demoPaths[currentPage]);
  return (
    <Navbar aria-label="Site" collapseBelow={collapseBelow} currentVariant={currentVariant} rounded={rounded} dir={dir} onClickCapture={choose}>
      <Navbar.Brand>dbM</Navbar.Brand>
      <Navbar.Links aria-label={ariaLabel}>
        <NavigationMenu {...props} currentPath={path}>
          <DemoItems />
        </NavigationMenu>
      </Navbar.Links>
    </Navbar>
  );
}

/** A panel of several groups beside a featured block, with a footer: what a larger site's menu holds. */
export function RichItems({ splitProducts = false }: { splitProducts?: boolean }) {
  return (
    <NavigationMenu.List>
      <NavigationMenu.Item value="products">
        <NavigationMenu.Trigger href={splitProducts ? "/products" : undefined} badge="New">
          Products
        </NavigationMenu.Trigger>
        <NavigationMenu.Content layout="columns">
          <NavigationMenu.Group label="Platform" href="/platform">
            <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team in one place, kept up to date" descriptionLines={2}>
              Analytics
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/automation" icon={LightningIcon} description="Workflows that run themselves">
              Automation
            </NavigationMenu.Link>
          </NavigationMenu.Group>
          <NavigationMenu.Group label="Trust">
            <NavigationMenu.Link href="/security" icon={ShieldCheckIcon} description="Single sign-on, roles and audit logs">
              Security
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/integrations" icon={PlugsIcon} description="Connect the tools you already use" badge="New">
              Integrations
            </NavigationMenu.Link>
          </NavigationMenu.Group>
          <NavigationMenu.Feature title="Launch week" href="/launch">
            Everything we shipped this quarter, in one place.
          </NavigationMenu.Feature>
          <NavigationMenu.Footer>
            <NavigationMenu.Link href="/all">View all products</NavigationMenu.Link>
            <span>Need help choosing?</span>
          </NavigationMenu.Footer>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="solutions">
        <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="By team">
            <NavigationMenu.Link href="/engineering" icon={CodeIcon}>
              Engineering
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/support" icon={UsersIcon}>
              Support
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

/** A panel with more links than any window holds. */
export function TallItems() {
  return (
    <NavigationMenu.List>
      <NavigationMenu.Item value="all">
        <NavigationMenu.Trigger>Everything</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="Pages">
            {Array.from({ length: 40 }, (_, index) => (
              <NavigationMenu.Link key={index} href={`/page-${index + 1}`}>
                Page {index + 1}
              </NavigationMenu.Link>
            ))}
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

/** Puts a menu at the end of the line, for a panel that has more room toward the start. */
export function Aligned({ children }: { children: ReactElement }) {
  return <div style={{ display: "flex", justifyContent: "flex-end", inlineSize: "100%" }}>{children}</div>;
}
