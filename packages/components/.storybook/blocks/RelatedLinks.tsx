/**
 * Docs-page-only "Related pages" list: one stacked link per page, with a line of description under it, for a guide
 * page where a card with a live preview (`RelatedCard`) has nothing to preview. Not part of the published package.
 */
export function RelatedLinks({ items }: { items: { name: string; description: string; href: string }[] }) {
  return (
    <ul className="dbm-related-links sb-unstyled">
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href}>{item.name}</a>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  );
}
