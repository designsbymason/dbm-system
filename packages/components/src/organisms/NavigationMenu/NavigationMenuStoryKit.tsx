import { BookOpenIcon, ChartBarIcon, CodeIcon, LightningIcon, PlugsIcon, ShieldCheckIcon, UsersIcon } from "@dbm-system/icons";
import type { ReactNode } from "react";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuProps } from "./NavigationMenu.types";

/** A box with a transform, so a panel drawn under the menu stays inside the demo (every Canvas on a Docs page shares one document). */
export function MenuStage({ children, height = "26rem" }: { children: ReactNode; height?: string }) {
  return (
    <div
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
        <NavigationMenu.Trigger current={currentPage === "products"}>Products</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="Platform" columns={2}>
            <NavigationMenu.Link href="#analytics" icon={ChartBarIcon} description="Dashboards and reports for every team">
              Analytics
            </NavigationMenu.Link>
            <NavigationMenu.Link href="#automation" icon={LightningIcon} description="Workflows that run themselves">
              Automation
            </NavigationMenu.Link>
            <NavigationMenu.Link href="#security" icon={ShieldCheckIcon} description="Single sign-on, roles and audit logs">
              Security
            </NavigationMenu.Link>
            <NavigationMenu.Link href="#integrations" icon={PlugsIcon} description="Connect the tools you already use" badge="New">
              Integrations
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="solutions">
        <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Group label="By team">
            <NavigationMenu.Link href="#engineering" icon={CodeIcon}>
              Engineering
            </NavigationMenu.Link>
            <NavigationMenu.Link href="#support" icon={UsersIcon}>
              Support
            </NavigationMenu.Link>
          </NavigationMenu.Group>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="#pricing" current={currentPage === "pricing"}>
          Pricing
        </NavigationMenu.Link>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="https://example.com/docs" icon={BookOpenIcon}>
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
      <Navbar.Brand>Acme</Navbar.Brand>
      <Navbar.Links aria-label="Primary">
        <NavigationMenu>
          <DemoItems />
        </NavigationMenu>
      </Navbar.Links>
    </Navbar>
  );
}
