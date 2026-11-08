// The code shown under each story's "Show code" button on PageHeader's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo scaffolding instead of the header
// itself. Each snippet here is the smallest real usage of what its story shows, using only exports of the package; `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const pageHeaderSnippets = {
  full: `<PageHeader>
  <PageHeader.Breadcrumbs>
    <Breadcrumb>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Projects</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb>
  </PageHeader.Breadcrumbs>
  <PageHeader.Title>Projects</PageHeader.Title>
  <PageHeader.Description>Everything your team is working on, in one place.</PageHeader.Description>
  <PageHeader.Meta>
    <Badge tone="info">Draft</Badge>
    <Text size="sm" color="secondary">Updated 3 days ago</Text>
  </PageHeader.Meta>
  <PageHeader.Actions>
    <Button variant="secondary">Share</Button>
    <Button>New project</Button>
  </PageHeader.Actions>
</PageHeader>`,

  titleOnly: `{/* Every part but the title is optional */}
<PageHeader>
  <PageHeader.Title>Settings</PageHeader.Title>
</PageHeader>`,

  sizes: `{/* size sets the title's and the description's text steps and the gaps: sm, md (the default) and lg */}
<PageHeader size="sm">
  <PageHeader.Title>Small</PageHeader.Title>
  <PageHeader.Description>A panel's page.</PageHeader.Description>
</PageHeader>
<PageHeader>
  <PageHeader.Title>Medium</PageHeader.Title>
  <PageHeader.Description>A page's usual head.</PageHeader.Description>
</PageHeader>
<PageHeader size="lg">
  <PageHeader.Title>Large</PageHeader.Title>
  <PageHeader.Description>A landing page.</PageHeader.Description>
</PageHeader>`,

  bordered: `{/* bordered draws a line under the header, with room above it */}
<PageHeader bordered>
  <PageHeader.Title>Billing</PageHeader.Title>
  <PageHeader.Description>Invoices and payment methods.</PageHeader.Description>
  <PageHeader.Actions>
    <Button>Add payment method</Button>
  </PageHeader.Actions>
</PageHeader>`,

  section: `{/* A header inside a section takes the level that fits the page's outline, a smaller size, and header as its element (inside main it is no banner) */}
<PageHeader as="header" size="sm">
  <PageHeader.Title level={2}>Members</PageHeader.Title>
  <PageHeader.Actions>
    <Button size="sm">Invite</Button>
  </PageHeader.Actions>
</PageHeader>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PageHeaderPlaygroundSnippetArgs {
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  as?: "div" | "header";
  breadcrumbs?: boolean;
  description?: boolean;
  meta?: boolean;
  actions?: boolean;
}

/** The Playground's snippet, built from the live controls: only the props that differ from their defaults, and only the parts that are on. */
export function pageHeaderPlaygroundSnippet(args: PageHeaderPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size !== undefined && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.bordered) attributes.push("bordered");
  if (args.as === "header") attributes.push('as="header"');
  const open = attributes.length > 0 ? `<PageHeader ${attributes.join(" ")}>` : "<PageHeader>";
  const parts: string[] = [];
  if (args.breadcrumbs !== false) {
    parts.push(`  <PageHeader.Breadcrumbs>
    <Breadcrumb>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Projects</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb>
  </PageHeader.Breadcrumbs>`);
  }
  parts.push("  <PageHeader.Title>Projects</PageHeader.Title>");
  if (args.description !== false) parts.push("  <PageHeader.Description>Everything your team is working on, in one place.</PageHeader.Description>");
  if (args.meta !== false) {
    parts.push(`  <PageHeader.Meta>
    <Badge tone="info">Draft</Badge>
    <Text size="sm" color="secondary">Updated 3 days ago</Text>
  </PageHeader.Meta>`);
  }
  if (args.actions !== false) {
    parts.push(`  <PageHeader.Actions>
    <Button variant="secondary">Share</Button>
    <Button>New project</Button>
  </PageHeader.Actions>`);
  }
  return `${open}\n${parts.join("\n")}\n</PageHeader>`;
}
