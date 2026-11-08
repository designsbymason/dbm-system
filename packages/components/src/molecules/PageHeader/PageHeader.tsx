import { cx } from "@dbm-system/utils";
import { Children, createContext, forwardRef, Fragment, isValidElement, useContext } from "react";
import type { ReactNode } from "react";
import { Heading } from "../../atoms/Heading";
import type { HeadingSize } from "../../atoms/Heading/Heading.types";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import styles from "./PageHeader.module.css";
import type {
  PageHeaderActionsProps,
  PageHeaderBreadcrumbsProps,
  PageHeaderDescriptionProps,
  PageHeaderMetaProps,
  PageHeaderProps,
  PageHeaderSize,
  PageHeaderTitleProps,
} from "./PageHeader.types";

const sizeClass: Record<PageHeaderSize, string | undefined> = {
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
};

// The atoms the parts draw take their own text step, which a stylesheet can't reach, so the root passes its `size` down through a small context. The
// default is what a part used outside a root would get.
const PageHeaderSizeContext = createContext<PageHeaderSize>("md");

const titleSize: Record<PageHeaderSize, HeadingSize> = { sm: "xl", md: "2xl", lg: "3xl" };
const descriptionSize: Record<PageHeaderSize, TextSize> = { sm: "sm", md: "base", lg: "md" };

/**
 * The head of a page: an optional trail of breadcrumbs, the title as the page's heading, a description, a row of facts and the page's actions. A compound
 * component, meaning it is made of named parts you compose: `PageHeader.Breadcrumbs`, `PageHeader.Title`, `PageHeader.Description`, `PageHeader.Meta` and
 * `PageHeader.Actions`, any of them optional. The first four stack in one column; `PageHeader.Actions` sits beside it, and under it where there is no
 * room (a phone), so put the parts directly in the header.
 *
 * `size` sets the title's and the description's text steps and the space around them (`md` is a page's usual head), and `bordered` draws a line under it. It is a
 * `<div>` (or a `<header>` with `as`) and adds no landmark and no tab stop. A page has one `h1`: `PageHeader.Title` is `level` 1 unless you say
 * otherwise, and takes a `ref` and a `tabIndex`, so an app can move focus to it.
 *
 * It is not navigation (`Navbar`, `Tabs`) and not a card's header (`Card.Header`).
 *
 * @example
 * ```tsx
 * <PageHeader>
 *   <PageHeader.Breadcrumbs>
 *     <Breadcrumb>…</Breadcrumb>
 *   </PageHeader.Breadcrumbs>
 *   <PageHeader.Title>Projects</PageHeader.Title>
 *   <PageHeader.Description>Everything your team is working on.</PageHeader.Description>
 *   <PageHeader.Meta>
 *     <Badge>Draft</Badge>
 *     <Text size="sm" color="secondary">Updated 3 days ago</Text>
 *   </PageHeader.Meta>
 *   <PageHeader.Actions>
 *     <Button>New project</Button>
 *   </PageHeader.Actions>
 * </PageHeader>
 * ```
 */
const PageHeaderRoot = forwardRef<HTMLElement, PageHeaderProps>(
  ({ children, size = "md", bordered = false, as: Element = "div", className, ...props }, ref) => {
    // The actions go beside the text column, and everything else in it, in the order written. Fragments are looked through.
    const text: ReactNode[] = [];
    const actions: ReactNode[] = [];
    const sort = (nodes: ReactNode) => {
      Children.forEach(nodes, (child) => {
        // An empty node (`{cond && <PageHeader.Title />}` when it is false, `null`) draws nothing, so it must not make a text column of its own.
        if (child === null || child === undefined || typeof child === "boolean") return;
        if (isValidElement<{ children?: ReactNode }>(child) && child.type === PageHeaderActions) actions.push(child);
        else if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) sort(child.props.children);
        else text.push(child);
      });
    };
    sort(children);
    return (
      <PageHeaderSizeContext.Provider value={size}>
        <Element {...(props as object)} ref={ref as never} className={cx(styles.root, sizeClass[size], bordered && styles.bordered, className)}>
          {text.length > 0 && <div className={styles.text}>{text}</div>}
          {actions}
        </Element>
      </PageHeaderSizeContext.Provider>
    );
  },
);
PageHeaderRoot.displayName = "PageHeader";

/** The trail above the title: a `Breadcrumb`. */
const PageHeaderBreadcrumbs = forwardRef<HTMLDivElement, PageHeaderBreadcrumbsProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.breadcrumbs, className)} />
));
PageHeaderBreadcrumbs.displayName = "PageHeader.Breadcrumbs";

/**
 * The page's title, a `Heading`: `level` 1 unless you say otherwise, at the step the header's `size` gives it. It takes a `ref` and any native heading
 * attribute, such as `tabIndex={-1}` so an app can move focus to it when the page changes.
 */
const PageHeaderTitle = forwardRef<HTMLHeadingElement, PageHeaderTitleProps>(({ level = 1, ...props }, ref) => {
  const size = useContext(PageHeaderSizeContext);
  return <Heading {...props} ref={ref} level={level} size={titleSize[size]} />;
});
PageHeaderTitle.displayName = "PageHeader.Title";

/** A line under the title that says what the page is, in the secondary text colour. */
const PageHeaderDescription = forwardRef<HTMLParagraphElement, PageHeaderDescriptionProps>((props, ref) => {
  const size = useContext(PageHeaderSizeContext);
  return <Text {...props} ref={ref} color="secondary" size={descriptionSize[size]} />;
});
PageHeaderDescription.displayName = "PageHeader.Description";

/** A row of facts about the page, under the description: a status badge, who changed it and when. It wraps where it does not fit. */
const PageHeaderMeta = forwardRef<HTMLDivElement, PageHeaderMetaProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.meta, className)} />
));
PageHeaderMeta.displayName = "PageHeader.Meta";

/** The page's own actions, beside the text and under it where there is no room. It has to be a direct child of the header. */
const PageHeaderActions = forwardRef<HTMLDivElement, PageHeaderActionsProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.actions, className)} />
));
PageHeaderActions.displayName = "PageHeader.Actions";

type PageHeaderComponent = typeof PageHeaderRoot & {
  Breadcrumbs: typeof PageHeaderBreadcrumbs;
  Title: typeof PageHeaderTitle;
  Description: typeof PageHeaderDescription;
  Meta: typeof PageHeaderMeta;
  Actions: typeof PageHeaderActions;
};

export const PageHeader: PageHeaderComponent = Object.assign(PageHeaderRoot, {
  Breadcrumbs: PageHeaderBreadcrumbs,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Meta: PageHeaderMeta,
  Actions: PageHeaderActions,
});
