/**
 * Docs-page-only "Related pages" list: one stacked link per page, with a line of description under it, for a guide
 * page where a card with a live preview (`RelatedCard`) has nothing to preview. Not part of the published package.
 */
export function RelatedLinks({
  items,
  columns = false,
}: {
  items: { name: string; description: string; href: string }[];
  /** Lay the links out in as many columns as fit, for a long list. */
  columns?: boolean;
}) {
  return (
    <ul className={columns ? "dbm-related-links dbm-related-links--columns sb-unstyled" : "dbm-related-links sb-unstyled"}>
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href}>{item.name}</a>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  );
}
