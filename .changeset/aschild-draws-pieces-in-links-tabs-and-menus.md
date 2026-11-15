---
"@dbm-system/components": patch
---

More parts now draw their own pieces inside the element you give them with `asChild`, as `Button` and `IconButton` do, instead of dropping them.

- **Router links.** `Link` draws an external link's icon and its visually hidden "(opens in a new tab)" cue inside your router's link, so a link that leaves the site keeps the warning for screen reader users. `Breadcrumb.Link` draws its `icon`; `Navbar.Link` its `icon`, `badge` and external mark; `Sidebar.Item` its `icon`, `description`, `badge` and external mark (and in the rail its tooltip is now the link's own text); `NavigationMenu.Link` its `icon`, `description`, `badge` and external mark: `<Navbar.Link asChild icon={HouseIcon}><RouterLink to="/">Home</RouterLink></Navbar.Link>`. With `asChild`, whether a link is external is worked out from your element's own `href`, and it gets `target="_blank"` and `rel="noopener noreferrer"` unless your element sets its own.
- **Triggers and items.** `Tabs.Trigger` and `ToggleGroup.Item` draw their `icon` before your element's own text (an empty `ToggleGroup.Item` element with an `icon` is icon-only, and carries the item's `aria-label`). The `Menu`, `ContextMenu` and `Menubar` items draw their `icon`, `shortcut`, `description` and `trailing` content, and announce a `disabledReason`, from inside your link; an item with none of these uses your element as it is.

The development warnings that said these props have no effect with `asChild` are removed. If you put an icon inside the element by hand because the prop was dropped, leave the prop out and nothing changes; pass the prop and remove the hand-drawn icon to get the built-in size and colour. `Menubar.Action`, `Accordion.Trigger` and `Select`'s trigger are unchanged: with `asChild` your element still replaces their content.
