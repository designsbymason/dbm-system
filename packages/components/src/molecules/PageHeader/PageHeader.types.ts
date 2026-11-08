import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { HeadingLevel } from "../../atoms/Heading/Heading.types";

/**
 * The header's size, a subset of the shared scale (`05-component-api-conventions.md` §2): the title's and the description's text steps and the gaps
 * between the parts. `md` is a page's usual head; `sm` suits a panel or a dialog's page, `lg` a landing page.
 */
export type PageHeaderSize = "sm" | "md" | "lg";

/** Props every part of the header accepts on top of its own native element's. */
interface PageHeaderPartBase {
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

// Every prop is declared here, in the order the Docs read, and not inherited: the Controls panel lists a type's inherited props before its own.
export interface PageHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageHeaderPartBase {
  /**
   * The parts, in reading order: `PageHeader.Breadcrumbs`, `PageHeader.Title`, `PageHeader.Description` and `PageHeader.Meta` in one column, and
   * `PageHeader.Actions` beside it (under it where there is no room). Put them directly in the header: `PageHeader.Actions` has to be a direct child.
   */
  children?: ReactNode;
  /**
   * The title's and the description's text steps and the gaps between the parts.
   * @default 'md'
   */
  size?: PageHeaderSize;
  /**
   * Draws a line under the header and room above it.
   * @default false
   */
  bordered?: boolean;
  /**
   * The element the header is. `header` inside the page's `main` is not a banner landmark, so either is safe there; outside `main` use `div`, since a
   * `header` there would be a second banner.
   * @default 'div'
   */
  as?: "div" | "header";
}

/** The properties of `PageHeader.Breadcrumbs`: the trail above the title. */
export interface PageHeaderBreadcrumbsProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageHeaderPartBase {
  /** The trail: a `Breadcrumb`. */
  children?: ReactNode;
}

/** The properties of `PageHeader.Title`: the page's heading. */
export interface PageHeaderTitleProps extends Omit<ComponentPropsWithoutRef<"h1">, "children" | "color">, PageHeaderPartBase {
  /** The title. */
  children?: ReactNode;
  /**
   * The heading level, `h1` to `h6`. A page has one `h1`; a header inside a panel or a section takes the level that fits its place in the outline.
   * @default 1
   */
  level?: HeadingLevel;
}

/** The properties of `PageHeader.Description`: a line under the title that says what the page is. */
export interface PageHeaderDescriptionProps extends Omit<ComponentPropsWithoutRef<"p">, "children" | "color">, PageHeaderPartBase {
  /** The description. */
  children?: ReactNode;
}

/** The properties of `PageHeader.Meta`: a row of facts about the page, under the description. */
export interface PageHeaderMetaProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageHeaderPartBase {
  /** Badges, tags or plain text: a status, who changed it and when. */
  children?: ReactNode;
}

/** The properties of `PageHeader.Actions`: the page's own actions. */
export interface PageHeaderActionsProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageHeaderPartBase {
  /** The actions: buttons. */
  children?: ReactNode;
}
