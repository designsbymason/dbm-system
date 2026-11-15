import { Badge, Button, Card, FormField, Input, ProgressBar, Switch, Tag } from "@dbm-system/components";

/**
 * One small composition, drawn four times in the theming section, once per theme. The markup is identical
 * in every copy; only the theme around it changes.
 */
export function ThemeComposition({ id }: { id: string }) {
  return (
    <Card variant="elevated" size="md">
      <Card.Header>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--dbm-space-3)" }}>
          <span style={{ fontFamily: "var(--dbm-font-family-secondary)", fontSize: "var(--dbm-font-size-lg)" }}>Notifications</span>
          <Badge tone="brand">Beta</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
          <FormField label="Work email" name={`email-${id}`}>
            {(field) => <Input {...field} defaultValue="ada@northwind.example" />}
          </FormField>
          <Switch defaultChecked>Weekly summary</Switch>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-2)" }}>
            <Tag tone="brand">Invoices</Tag>
            <Tag>Reports</Tag>
            <Tag tone="success">Payments</Tag>
          </div>
          <ProgressBar value={80} label="Profile complete" showValueLabel size="sm" />
        </div>
      </Card.Body>
      <Card.Footer align="end">
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save changes</Button>
      </Card.Footer>
    </Card>
  );
}
