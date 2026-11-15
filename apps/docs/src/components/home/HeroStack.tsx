import { Avatar, Badge, Button, Checkbox, Input, ProgressBar, Switch, Tag } from "@dbm-system/components";
import type { CSSProperties } from "react";
import styles from "./HeroStack.module.css";

const swatches = ["bg-brand", "bg-brand-hover", "bg-brand-subtle", "border-brand", "text-primary", "bg-neutral-subtle"];
const spaces = [1, 2, 3, 4, 6, 8];
const radii = ["sm", "md", "lg", "xl"];
const invoices = [
  { name: "Northwind Ltd", initials: "NL", amount: "4,200.00", status: "Paid", tone: "success" as const },
  { name: "Ada Studio", initials: "AS", amount: "1,180.00", status: "Due", tone: "warning" as const },
  { name: "Kestrel & Co", initials: "KC", amount: "960.00", status: "Overdue", tone: "danger" as const },
];

const tokenLabel = (name: string) => name.replace("-", ".");

/**
 * The home page's hero: the system as an exploded stack of real DBM components, tokens at the bottom,
 * components above, an application on top (ADR-0217). It is a picture, so it is hidden from assistive
 * technology and inert; the live, usable components are further down the page.
 */
export function HeroStack() {
  return (
    <div className={styles.scene} aria-hidden="true" inert>
      <div className={styles.stage}>
        <section className={styles.plate} style={{ "--layer": 0 } as CSSProperties}>
          <p className={styles.plateLabel}>Tokens</p>
          <div className={styles.swatches}>
            {swatches.map((name) => (
              <div key={name} className={styles.swatch}>
                <span className={styles.chip} style={{ background: `var(--dbm-${name})` }} />
                <span className="token-name">{tokenLabel(name)}</span>
              </div>
            ))}
          </div>
          <div className={styles.scale}>
            {spaces.map((step) => (
              <span key={step} className={styles.bar} style={{ inlineSize: `var(--dbm-space-${step})` }} title={`space.${step}`} />
            ))}
            <span className="token-name">space.1 to space.8</span>
          </div>
          <div className={styles.radii}>
            {radii.map((step) => (
              <span key={step} className={styles.corner} style={{ borderStartStartRadius: `var(--dbm-radius-${step})` }} />
            ))}
            <span className="token-name">radius.sm to radius.xl</span>
          </div>
        </section>

        <section className={styles.plate} style={{ "--layer": 1 } as CSSProperties}>
          <p className={styles.plateLabel}>Components</p>
          <div className={styles.actions}>
            <Button size="sm">Save changes</Button>
            {/* The gap itself, measured: this spacer is space.3 wide and draws its own dimension mark. */}
            <span className={styles.gap}>
              <span className={`token-name ${styles.gapNote}`}>space.3</span>
            </span>
            <Button size="sm" variant="secondary">
              Cancel
            </Button>
          </div>
          <Input size="sm" placeholder="Search invoices" aria-label="Search invoices" />
          <div className={styles.controls}>
            <Switch size="sm" defaultChecked>
              Email alerts
            </Switch>
            <Checkbox size="sm" defaultChecked>
              Remember me
            </Checkbox>
          </div>
          <div className={styles.controls}>
            <Tag size="sm" tone="brand">
              Design
            </Tag>
            <Tag size="sm">Finance</Tag>
            <Badge tone="brand">New</Badge>
          </div>
        </section>

        <section className={`${styles.plate} ${styles.app}`} style={{ "--layer": 2 } as CSSProperties}>
          <p className={styles.plateLabel}>Application</p>
          <div className={styles.appHead}>
            <span className={styles.appTitle}>Invoices</span>
            <Button size="xs" variant="secondary">
              Export
            </Button>
          </div>
          <ul className={styles.rows}>
            {invoices.map((row) => (
              <li key={row.name} className={styles.row}>
                <Avatar size="xs" initials={row.initials} name={row.name} />
                <span className={styles.rowName}>{row.name}</span>
                <span className={styles.amount}>{row.amount}</span>
                <Badge tone={row.tone} variant="subtle">
                  {row.status}
                </Badge>
              </li>
            ))}
          </ul>
          <ProgressBar size="sm" value={72} label="Collected this month" showValueLabel />
          <span className={`dimension ${styles.radiusNote}`}>
            <span className="token-name">radius.xl</span>
          </span>
        </section>
      </div>
    </div>
  );
}
