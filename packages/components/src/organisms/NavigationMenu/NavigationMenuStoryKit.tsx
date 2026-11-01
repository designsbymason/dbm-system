import { BookOpenIcon, ChartBarIcon, CodeIcon, LightningIcon, PlugsIcon, ShieldCheckIcon, UsersIcon } from "@dbm-system/icons";
import type { ReactElement } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuProps } from "./NavigationMenu.types";

/** A demo has nowhere to go: a link in it keeps the page where it is. */
const stay = (event: MouseEvent) => event.preventDefault();

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

/** The items the stories share: two panels of grouped links, a current link and an external one. */
export function DemoItems({ currentPage = "pricing" }: { currentPage?: "products" | "pricing" | "none" }) {
  return (
    <NavigationMenu.List>
      <NavigationMenu.Item value="products">
        <NavigationMenu.Trigger current={currentPage === "products" ? true : undefined}>Products</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="Platform" columns={2}>
            <NavigationMenu.Link onClick={stay} href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team">
              Analytics
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/automation" icon={LightningIcon} description="Workflows that run themselves">
              Automation
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/security" icon={ShieldCheckIcon} description="Single sign-on, roles and audit logs">
              Security
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/integrations" icon={PlugsIcon} description="Connect the tools you already use" badge="New">
              Integrations
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="solutions">
        <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="By team">
            <NavigationMenu.Link onClick={stay} href="/engineering" icon={CodeIcon}>
              Engineering
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/support" icon={UsersIcon}>
              Support
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link onClick={stay} href="/pricing" current={currentPage === "pricing" ? true : undefined}>
          Pricing
        </NavigationMenu.Link>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link onClick={stay} href="https://example.com/docs" icon={BookOpenIcon}>
          Docs
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

export function DemoMenu(props: NavigationMenuProps & { currentPage?: "products" | "pricing" | "none" }) {
  const { currentPage, ...rest } = props;
  return (
    <NavigationMenu aria-label="Primary" {...rest}>
      <DemoItems currentPage={currentPage} />
    </NavigationMenu>
  );
}

/** The same items inside a `Navbar`: drawn as a mega menu in the bar and stacked in the bar's phone menu. */
export function DemoNavbarMenu({ collapseBelow = "md" }: { collapseBelow?: "sm" | "md" | "lg" | "never" }) {
  return (
    <Navbar aria-label="Site" collapseBelow={collapseBelow}>
      <Navbar.Brand>dbM</Navbar.Brand>
      <Navbar.Links aria-label="Primary">
        <NavigationMenu>
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
        <NavigationMenu.Trigger href={splitProducts ? "#products" : undefined} onClick={splitProducts ? undefined : undefined} badge="New">
          Products
        </NavigationMenu.Trigger>
        <NavigationMenu.Content layout="columns">
          <NavigationMenu.Group label="Platform" href="/platform">
            <NavigationMenu.Link onClick={stay} href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team in one place, kept up to date" descriptionLines={2}>
              Analytics
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/automation" icon={LightningIcon} description="Workflows that run themselves">
              Automation
            </NavigationMenu.Link>
          </NavigationMenu.Group>
          <NavigationMenu.Group label="Trust">
            <NavigationMenu.Link onClick={stay} href="/security" icon={ShieldCheckIcon} description="Single sign-on, roles and audit logs">
              Security
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/integrations" icon={PlugsIcon} description="Connect the tools you already use" badge="New">
              Integrations
            </NavigationMenu.Link>
          </NavigationMenu.Group>
          <NavigationMenu.Feature title="Launch week" href="/launch" onSelect={undefined}>
            Everything we shipped this quarter, in one place.
          </NavigationMenu.Feature>
          <NavigationMenu.Footer>
            <NavigationMenu.Link onClick={stay} href="/all">
              View all products
            </NavigationMenu.Link>
            <span>Need help choosing?</span>
          </NavigationMenu.Footer>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="solutions">
        <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="By team">
            <NavigationMenu.Link onClick={stay} href="/engineering" icon={CodeIcon}>
              Engineering
            </NavigationMenu.Link>
            <NavigationMenu.Link onClick={stay} href="/support" icon={UsersIcon}>
              Support
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link onClick={stay} href="/pricing">
          Pricing
        </NavigationMenu.Link>
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
              <NavigationMenu.Link key={index} onClick={stay} href={`#page-${index + 1}`}>
                Page {index + 1}
              </NavigationMenu.Link>
            ))}
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

/** A menu that is nothing but a stage for one of the layouts below. */
export function Aligned({ children }: { children: ReactElement }) {
  return <div style={{ display: "flex", justifyContent: "flex-end", inlineSize: "100%" }}>{children}</div>;
}
