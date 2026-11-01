import { ArrowSquareOutIcon, CaretDownIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as Primitive from "@radix-ui/react-navigation-menu";
import { Slot } from "@radix-ui/react-slot";
import { Children, cloneElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { MouseEvent, ReactElement } from "react";
import { Badge } from "../../atoms/Badge";
import type { BadgeProps } from "../../atoms/Badge";
import { Icon } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { useNavigationEmbed } from "../../internal/navigationEmbed";
import styles from "./NavigationMenu.module.css";
import {
  NavigationMenuContentContext,
  NavigationMenuContext,
  NavigationMenuItemContext,
  defaultLabels,
  useNavigationMenuContext,
} from "./NavigationMenuContext";
import type { NavigationMenuContextValue } from "./NavigationMenuContext";
import type {
  NavigationMenuContentProps,
  NavigationMenuCurrentVariant,
  NavigationMenuGroupProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuProps,
  NavigationMenuSize,
  NavigationMenuTriggerProps,
} from "./NavigationMenu.types";

const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

const sizeClass: Record<NavigationMenuSize, string> = {
  xs: styles.sizeXs!,
  sm: styles.sizeSm!,
  md: styles.sizeMd!,
  lg: styles.sizeLg!,
  xl: styles.sizeXl!,
};

const currentVariantClass: Record<NavigationMenuCurrentVariant, string> = {
  subtle: styles.currentSubtle!,
  underline: styles.currentUnderline!,
  solid: styles.currentSolid!,
};

/**
 * Tells a panel how much room there is: the width from the element it hangs from to the screen's edge on the side it grows toward
 * (or, centred, twice the distance to the nearer edge), kept in a custom property the stylesheet caps the panel's width with. A panel
 * is positioned from its menu or item and not from the screen, so without it a panel wider than the room runs off the screen
 * instead of wrapping its links. Written onto the element directly, from an effect, so a server render has none.
 */
function useRoom(ref: RefObject<HTMLElement | null>, enabled: boolean, align: "start" | "center", watch: string) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const rtl = getComputedStyle(element).direction === "rtl";
      let room = rtl ? rect.right : width - rect.left;
      if (align === "center") {
        const middle = (rect.left + rect.right) / 2;
        room = 2 * Math.min(middle, width - middle);
      }
      element.style.setProperty("--navigation-menu-room", `${Math.max(0, Math.floor(room))}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      element.style.removeProperty("--navigation-menu-room");
    };
  }, [ref, enabled, align, watch]);
}

/**
 * The site-header navigation with panels: a row of triggers each opening a panel of grouped links under it (a mega menu), or a
 * link that goes straight to a page. It follows the disclosure-navigation pattern (a `<nav>` of a list, buttons with
 * `aria-expanded`), not `role="menu"`: use `Menu` for a list of actions and `Navbar.Group` for a short dropdown of links.
 *
 * Opens on hover (after a short rest), on a press, or with Enter, Space or the Down arrow; `Escape` closes it and returns focus to
 * its trigger. Left and Right move between the triggers and top-level links; `Tab` goes into the open panel.
 *
 * Drawn on its own it is a bar of triggers. Put it inside `Navbar.Links` and it follows the bar's look, and in the bar's phone menu
 * it becomes the stacked form (`presentation="stacked"`), a vertical list of disclosure buttons, so one set of items serves both.
 *
 * @example
 * <NavigationMenu aria-label="Primary">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Group label="Platform" columns={2}>
 *           <NavigationMenu.Link href="/analytics" description="Dashboards for every team">Analytics</NavigationMenu.Link>
 *           <NavigationMenu.Link href="/automation" description="Workflows that run themselves">Automation</NavigationMenu.Link>
 *         </NavigationMenu.Group>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/pricing" current>Pricing</NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 */
const NavigationMenuRoot = forwardRef<HTMLElement, NavigationMenuProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue = "",
      onValueChange,
      presentation = "mega",
      viewport = true,
      panelAlign = "start",
      size = "md",
      currentVariant: ownCurrentVariant = "underline",
      rounded: ownRounded = false,
      delayDuration = 200,
      skipDelayDuration = 300,
      dir: ownDir = "ltr",
      labels,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const embed = useNavigationEmbed();
    const embedded = embed !== null;
    const resolvedPresentation = useResolvedResponsiveValue(presentation, "mega");
    const stacked = (embed?.inPanel ?? false) || resolvedPresentation === "stacked";
    const currentVariant = embed?.currentVariant ?? ownCurrentVariant;
    const rounded = embed?.rounded ?? ownRounded;
    const dir = embed?.dir ?? ownDir;
    const mergedLabels = useMemo(() => mergeDefined(defaultLabels, labels), [labels]);
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? mergedLabels.navigation) : ariaLabel;

    const controlled = valueProp !== undefined;
    const [inner, setInner] = useState(defaultValue);
    const value = controlled ? valueProp : inner;
    const rootRef = useRef<HTMLElement | null>(null);
    useRoom(rootRef, !stacked && viewport, panelAlign, value);
    const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
    const setValue = useCallback(
      (next: string) => {
        if (next === value) return;
        if (!controlled) setInner(next);
        onValueChange?.(next);
      },
      [controlled, value, onValueChange],
    );

    const context = useMemo<NavigationMenuContextValue>(
      () => ({
        stacked,
        embedded,
        viewport,
        panelAlign,
        size,
        currentVariant,
        rounded,
        dir,
        labels: mergedLabels,
        value,
        setValue,
        closePanel: embed?.closePanel ?? null,
      }),
      [stacked, embedded, viewport, panelAlign, size, currentVariant, rounded, dir, mergedLabels, value, setValue, embed?.closePanel],
    );

    // Inside a bar's links the bar sets the text size; anywhere else (and in the bar's phone menu) the menu's own `size` does.
    const rootClass = cx(
      styles.root,
      (!embedded || stacked) && sizeClass[size],
      embedded && !stacked && styles.embedded,
      stacked && styles.stackedRoot,
      className,
    );

    if (stacked) {
      const stackedProps = { ...props, className: rootClass, ref: mergedRef as never };
      return (
        <NavigationMenuContext.Provider value={context}>
          {embedded ? (
            // `role="listitem"` is redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`.
            // eslint-disable-next-line jsx-a11y/no-redundant-roles
            <li {...stackedProps} role="listitem">
              {children}
            </li>
          ) : (
            <nav {...stackedProps} dir={dir} aria-label={name} aria-labelledby={ariaLabelledBy}>
              {children}
            </nav>
          )}
        </NavigationMenuContext.Provider>
      );
    }

    const panelArea = viewport && (
      <div className={styles.viewportFrame} data-align={panelAlign}>
        <Primitive.Viewport className={styles.viewport} />
      </div>
    );

    return (
      <NavigationMenuContext.Provider value={context}>
        {embedded ? (
          <Primitive.Root asChild value={value} onValueChange={setValue} dir={dir} delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
            <li {...props} ref={mergedRef as never} role="listitem" className={rootClass}>
              {children}
              {panelArea}
            </li>
          </Primitive.Root>
        ) : (
          <Primitive.Root
            {...props}
            ref={mergedRef}
            aria-label={name}
            aria-labelledby={ariaLabelledBy}
            value={value}
            onValueChange={setValue}
            dir={dir}
            delayDuration={delayDuration}
            skipDelayDuration={skipDelayDuration}
            className={rootClass}
          >
            {children}
            {panelArea}
          </Primitive.Root>
        )}
      </NavigationMenuContext.Provider>
    );
  },
);
NavigationMenuRoot.displayName = "NavigationMenu";

/** The row of items. A list, with `role="list"` stated so Safari keeps its list semantics. */
const NavigationMenuList = forwardRef<HTMLUListElement, NavigationMenuListProps>(({ className, ...props }, ref) => {
  const { stacked } = useNavigationMenuContext("NavigationMenu.List");
  // eslint-disable-next-line jsx-a11y/no-redundant-roles
  if (stacked) return <ul {...props} ref={ref} role="list" className={cx(styles.list, styles.stackedList, className)} />;
  return <Primitive.List {...props} ref={ref} role="list" className={cx(styles.list, className)} />;
});
NavigationMenuList.displayName = "NavigationMenu.List";

/** One entry of the list: a trigger with its panel, or a link. */
const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(({ value: valueProp, className, ...props }, ref) => {
  const { stacked, viewport, panelAlign, value: openValue } = useNavigationMenuContext("NavigationMenu.Item");
  const itemRef = useRef<HTMLLIElement | null>(null);
  const itemMergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
  const generated = useId();
  const value = valueProp ?? generated;
  const contentId = useId();
  const item = useMemo(() => ({ value, contentId }), [value, contentId]);
  useRoom(itemRef, !stacked && !viewport, panelAlign, openValue);
  // Without a shared panel area each panel hangs from its own item, which is then what the panel is positioned against.
  const itemClass = cx(styles.item, !stacked && !viewport && styles.itemAnchor, className);
  return (
    <NavigationMenuItemContext.Provider value={item}>
      {stacked ? (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <li {...props} ref={itemMergedRef} role="listitem" className={cx(itemClass, styles.stackedItem)} />
      ) : (
        <Primitive.Item {...props} ref={itemMergedRef} value={value} role="listitem" className={itemClass} />
      )}
    </NavigationMenuItemContext.Provider>
  );
});
NavigationMenuItem.displayName = "NavigationMenu.Item";

/**
 * The button that opens an item's panel. `aria-expanded` is stated here after the props, so the open state is always true to what
 * is drawn; `current` marks the item that holds the page the reader is on.
 */
const NavigationMenuTrigger = forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  ({ icon, current = false, disabled = false, className, children, onClick, ...props }, ref) => {
    const { stacked, value: openValue, setValue, currentVariant, rounded } = useNavigationMenuContext("NavigationMenu.Trigger");
    const item = useContext(NavigationMenuItemContext);
    if (item === null) throw new Error("NavigationMenu.Trigger must be used inside NavigationMenu.Item.");
    const open = openValue === item.value;
    const classes = cx(
      styles.link,
      styles.trigger,
      rounded && styles.rounded,
      current && styles.current,
      current && currentVariantClass[currentVariant],
      className,
    );
    const label = (
      <>
        {icon && <Icon icon={icon} size="sm" />}
        {children}
        <Icon icon={CaretDownIcon} size="xs" className={styles.caret} />
      </>
    );

    if (stacked) {
      return (
        <button
          {...props}
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={item.contentId}
          className={classes}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);
            setValue(open ? "" : item.value);
          }}
        >
          {label}
        </button>
      );
    }

    return (
      <Primitive.Trigger
        {...props}
        ref={ref}
        disabled={disabled}
        aria-expanded={open}
        onClick={onClick}
        className={classes}
      >
        {label}
      </Primitive.Trigger>
    );
  },
);
NavigationMenuTrigger.displayName = "NavigationMenu.Trigger";

/** An item's panel: drawn in the menu's shared panel area (or under its own item) while open, inline beneath its trigger when stacked. */
const NavigationMenuContent = forwardRef<HTMLDivElement, NavigationMenuContentProps>(({ className, children, forceMount, ...props }, ref) => {
  const { stacked, viewport, panelAlign, value } = useNavigationMenuContext("NavigationMenu.Content");
  const item = useContext(NavigationMenuItemContext);
  if (item === null) throw new Error("NavigationMenu.Content must be used inside NavigationMenu.Item.");

  if (stacked) {
    const {
      onEscapeKeyDown: _escape,
      onPointerDownOutside: _pointer,
      onFocusOutside: _focus,
      onInteractOutside: _interact,
      ...divProps
    } = props;
    return (
      <div {...divProps} ref={ref} id={item.contentId} hidden={value !== item.value} className={cx(styles.stackedContent, className)}>
        <NavigationMenuContentContext.Provider value>{children}</NavigationMenuContentContext.Provider>
      </div>
    );
  }

  return (
    <Primitive.Content
      {...props}
      ref={ref}
      forceMount={forceMount}
      data-align={panelAlign}
      className={cx(styles.content, !viewport && styles.contentOwn, className)}
    >
      <NavigationMenuContentContext.Provider value>{children}</NavigationMenuContentContext.Provider>
    </Primitive.Content>
  );
});
NavigationMenuContent.displayName = "NavigationMenu.Content";

/**
 * A link. As a top-level item it is drawn like a trigger; in a panel it is a row with an icon, a description and a badge. Choosing
 * it closes the panel (and, in a `Navbar`'s phone menu, the menu), unless `onSelect` calls `event.preventDefault()`.
 */
const NavigationMenuLink = forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  (
    {
      current = false,
      disabled = false,
      asChild = false,
      icon,
      description,
      badge,
      external,
      href,
      target,
      rel,
      onSelect,
      className,
      onClick,
      onClickCapture,
      children,
      ...props
    },
    ref,
  ) => {
    const { stacked, currentVariant, rounded, labels, setValue, closePanel } = useNavigationMenuContext("NavigationMenu.Link");
    const inPanel = useContext(NavigationMenuContentContext);
    const isExternal = !asChild && (external ?? EXTERNAL_HREF_PATTERN.test(href ?? ""));

    // Capture-phase, so it runs before a slotted child's own `onClick` (a router's navigation), as `Link`'s does.
    const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClickCapture?.(event);
    };

    const classes = cx(
      inPanel ? styles.panelLink : cx(styles.link, rounded && styles.rounded, current && styles.current, current && currentVariantClass[currentVariant]),
      disabled && styles.disabled,
      className,
    );

    const content = asChild ? (
      children
    ) : (
      <>
        {icon && <Icon icon={icon} size={inPanel ? "md" : "sm"} className={styles.linkIcon} />}
        <span className={styles.linkBody}>
          <span className={styles.linkText}>
            {children}
            {isExternal && (
              <>
                <Icon icon={ArrowSquareOutIcon} size="xs" className={styles.external} />
                <VisuallyHidden> {labels.externalLink}</VisuallyHidden>
              </>
            )}
          </span>
          {description !== undefined && description !== null && <span className={styles.description}>{description}</span>}
        </span>
        {badge !== undefined &&
          badge !== null &&
          (isValidElement(badge) && badge.type === Badge ? (
            cloneElement(badge as ReactElement<BadgeProps>, { size: (badge as ReactElement<BadgeProps>).props.size ?? "xs" })
          ) : (
            <Badge tone="brand" variant="solid" size="xs">
              {badge}
            </Badge>
          ))}
      </>
    );

    const linkProps = {
      ...props,
      ...(asChild ? {} : { href, target: target ?? (isExternal ? "_blank" : undefined), rel: rel ?? (isExternal ? "noopener noreferrer" : undefined) }),
      "aria-current": current ? ("page" as const) : undefined,
      "aria-disabled": disabled || undefined,
      onClickCapture: handleClickCapture,
      className: classes,
    };

    if (stacked) {
      const Component = asChild ? Slot : "a";
      return (
        <Component
          {...linkProps}
          ref={ref}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            const selection = new Event("navigationMenu.linkSelect", { cancelable: true });
            onSelect?.(selection);
            if (selection.defaultPrevented) return;
            setValue("");
            closePanel?.();
          }}
        >
          {content}
        </Component>
      );
    }

    // The primitive's link goes round a child element, so the caller's own `onClick` is merged by the slot and not composed by the
    // primitive: a composed handler that calls `preventDefault()` (a router's link does, to navigate without a page load) would stop
    // the panel closing, and that is the link that most needs it to.
    const Element = asChild ? Slot : "a";
    return (
      <Primitive.Link asChild active={current} onSelect={onSelect}>
        <Element {...linkProps} ref={ref} onClick={onClick}>
          {content}
        </Element>
      </Primitive.Link>
    );
  },
);
NavigationMenuLink.displayName = "NavigationMenu.Link";

/** A labelled run of links inside a panel, in one to three columns. The label names the list of links beneath it. */
const NavigationMenuGroup = forwardRef<HTMLDivElement, NavigationMenuGroupProps>(({ label, columns = 1, className, children, ...props }, ref) => {
  const labelId = useId();
  const hasLabel = label !== undefined && label !== null && label !== false;
  return (
    <div {...props} ref={ref} className={cx(styles.group, className)}>
      {hasLabel && (
        <p id={labelId} className={styles.groupLabel}>
          {label}
        </p>
      )}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul role="list" aria-labelledby={hasLabel ? labelId : undefined} className={styles.groupList} data-columns={columns}>
        {Children.toArray(children).map((child) => (
          // eslint-disable-next-line jsx-a11y/no-redundant-roles
          <li key={isValidElement(child) && child.key !== null ? child.key : String(child)} role="listitem" className={styles.groupItem}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
});
NavigationMenuGroup.displayName = "NavigationMenu.Group";

type NavigationMenuComponent = typeof NavigationMenuRoot & {
  List: typeof NavigationMenuList;
  Item: typeof NavigationMenuItem;
  Trigger: typeof NavigationMenuTrigger;
  Content: typeof NavigationMenuContent;
  Link: typeof NavigationMenuLink;
  Group: typeof NavigationMenuGroup;
};

export const NavigationMenu: NavigationMenuComponent = Object.assign(NavigationMenuRoot, {
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Group: NavigationMenuGroup,
});
