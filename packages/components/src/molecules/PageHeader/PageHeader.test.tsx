import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb } from "../Breadcrumb";
import { PageHeader } from "./PageHeader";
import styles from "./PageHeader.module.css";

// jsdom lays nothing out, so these tests are about structure, the text steps and what each part passes through. The row, its wrapping and the line under
// it are in the real-browser checks.
function Full(props: React.ComponentProps<typeof PageHeader>) {
  return (
    <PageHeader data-testid="header" {...props}>
      <PageHeader.Breadcrumbs data-testid="crumbs">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Breadcrumb.Page>Projects</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb>
      </PageHeader.Breadcrumbs>
      <PageHeader.Title>Projects</PageHeader.Title>
      <PageHeader.Description>Everything your team is working on.</PageHeader.Description>
      <PageHeader.Meta data-testid="meta">
        <span>Draft</span>
      </PageHeader.Meta>
      <PageHeader.Actions data-testid="actions">
        <button type="button">New project</button>
      </PageHeader.Actions>
    </PageHeader>
  );
}

describe("PageHeader", () => {
  it("draws its title as the page's h1, with the description under it", () => {
    render(<Full />);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Everything your team is working on.")).toBeInTheDocument();
  });

  it("puts the breadcrumbs, title, description and meta in one column and the actions beside it", () => {
    render(<Full />);
    const header = screen.getByTestId("header");
    const text = header.firstElementChild as HTMLElement;
    expect(text).toHaveClass(styles.text!);
    expect(text).toContainElement(screen.getByTestId("crumbs"));
    expect(text).toContainElement(screen.getByRole("heading"));
    expect(text).toContainElement(screen.getByTestId("meta"));
    expect(text).not.toContainElement(screen.getByTestId("actions"));
    expect(screen.getByTestId("actions").parentElement).toBe(header);
  });

  it("keeps the parts in the order they are written, looking through a fragment", () => {
    render(
      <PageHeader data-testid="header">
        <>
          <PageHeader.Title>Title</PageHeader.Title>
          <PageHeader.Actions data-testid="actions">Act</PageHeader.Actions>
        </>
        <PageHeader.Description>Words</PageHeader.Description>
      </PageHeader>,
    );
    const header = screen.getByTestId("header");
    expect(screen.getByTestId("actions").parentElement).toBe(header);
    const text = header.firstElementChild as HTMLElement;
    expect(Array.from(text.children).map((child) => child.textContent)).toEqual(["Title", "Words"]);
  });

  it("draws no text column for a header of actions alone", () => {
    render(
      <PageHeader data-testid="header">
        <PageHeader.Actions data-testid="actions">Act</PageHeader.Actions>
      </PageHeader>,
    );
    expect(screen.getByTestId("header").children).toHaveLength(1);
  });

  describe("empty children", () => {
    it("draws no text column for children that draw nothing, beside the actions", () => {
      const show = false as boolean;
      render(
        <PageHeader data-testid="header">
          {show && <PageHeader.Title>Hidden</PageHeader.Title>}
          {null}
          {undefined}
          {false}
          <PageHeader.Actions data-testid="actions">Act</PageHeader.Actions>
        </PageHeader>,
      );
      const header = screen.getByTestId("header");
      expect(header.children).toHaveLength(1);
      expect(header.firstElementChild).toBe(screen.getByTestId("actions"));
    });

    it("keeps the text column for a part that is shown, whatever else is empty", () => {
      const show = true as boolean;
      render(
        <PageHeader data-testid="header">
          {show && <PageHeader.Title>Shown</PageHeader.Title>}
          {null}
          <PageHeader.Actions>Act</PageHeader.Actions>
        </PageHeader>,
      );
      const header = screen.getByTestId("header");
      expect(header.children).toHaveLength(2);
      expect(header.firstElementChild).toHaveClass(styles.text!);
      expect(within(header.firstElementChild as HTMLElement).getByRole("heading", { name: "Shown" })).toBeInTheDocument();
    });
  });

  describe("size and the line", () => {
    it("gives the title and the description the step of its size", () => {
      const { rerender } = render(<Full size="sm" />);
      expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-xl)" });
      expect(screen.getByText("Everything your team is working on.")).toHaveStyle({ fontSize: "var(--dbm-font-size-sm)" });
      rerender(<Full size="md" />);
      expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-2xl)" });
      expect(screen.getByText("Everything your team is working on.")).toHaveStyle({ fontSize: "var(--dbm-font-size-base)" });
      rerender(<Full size="lg" />);
      expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-3xl)" });
      expect(screen.getByText("Everything your team is working on.")).toHaveStyle({ fontSize: "var(--dbm-font-size-md)" });
    });

    it("is medium by default and draws the line only when asked", () => {
      const { rerender } = render(<Full />);
      expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-2xl)" });
      expect(screen.getByTestId("header")).not.toHaveClass(styles.bordered!);
      rerender(<Full bordered />);
      expect(screen.getByTestId("header")).toHaveClass(styles.bordered!);
    });

    it("gives a part used outside a header the medium step", () => {
      render(<PageHeader.Title>Alone</PageHeader.Title>);
      expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-2xl)" });
    });

    it("does not leak a nested header's size into the outer one", () => {
      render(
        <PageHeader size="lg">
          <PageHeader.Title>Outer</PageHeader.Title>
          <PageHeader size="sm">
            <PageHeader.Title level={2}>Inner</PageHeader.Title>
          </PageHeader>
          <PageHeader.Description>After</PageHeader.Description>
        </PageHeader>,
      );
      expect(screen.getByRole("heading", { name: "Outer" })).toHaveStyle({ fontSize: "var(--dbm-font-size-3xl)" });
      expect(screen.getByRole("heading", { name: "Inner" })).toHaveStyle({ fontSize: "var(--dbm-font-size-xl)" });
      expect(screen.getByText("After")).toHaveStyle({ fontSize: "var(--dbm-font-size-md)" });
    });
  });

  describe("the element and the title", () => {
    it("is a div, or a header with as", () => {
      const { rerender } = render(<Full />);
      expect(screen.getByTestId("header").tagName).toBe("DIV");
      rerender(<Full as="header" />);
      expect(screen.getByTestId("header").tagName).toBe("HEADER");
    });

    it("takes the title's level, a ref and a tabIndex, so focus can be moved to it", () => {
      const ref = createRef<HTMLHeadingElement>();
      render(
        <PageHeader>
          <PageHeader.Title ref={ref} level={2} tabIndex={-1}>
            Inner page
          </PageHeader.Title>
        </PageHeader>,
      );
      expect(ref.current?.tagName).toBe("H2");
      expect(ref.current).toHaveAttribute("tabindex", "-1");
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe("refs and passthrough", () => {
    it("forwards a ref to every part's element", () => {
      const refs = {
        root: createRef<HTMLElement>(),
        crumbs: createRef<HTMLDivElement>(),
        title: createRef<HTMLHeadingElement>(),
        description: createRef<HTMLParagraphElement>(),
        meta: createRef<HTMLDivElement>(),
        actions: createRef<HTMLDivElement>(),
      };
      render(
        <PageHeader ref={refs.root}>
          <PageHeader.Breadcrumbs ref={refs.crumbs}>Trail</PageHeader.Breadcrumbs>
          <PageHeader.Title ref={refs.title}>Title</PageHeader.Title>
          <PageHeader.Description ref={refs.description}>Words</PageHeader.Description>
          <PageHeader.Meta ref={refs.meta}>Facts</PageHeader.Meta>
          <PageHeader.Actions ref={refs.actions}>Act</PageHeader.Actions>
        </PageHeader>,
      );
      expect(refs.root.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.crumbs.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.title.current?.tagName).toBe("H1");
      expect(refs.description.current?.tagName).toBe("P");
      expect(refs.meta.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.actions.current).toBeInstanceOf(HTMLDivElement);
    });

    it("accepts className, style, id and data-testid on every part, and merges className with its own", () => {
      render(
        <PageHeader className="c" style={{ color: "red" }} id="root" data-testid="root">
          <PageHeader.Breadcrumbs className="c" data-testid="crumbs" />
          <PageHeader.Title className="c" data-testid="title" id="title-id" />
          <PageHeader.Description className="c" data-testid="description" />
          <PageHeader.Meta className="c" data-testid="meta" />
          <PageHeader.Actions className="c" data-testid="actions" />
        </PageHeader>,
      );
      for (const id of ["root", "crumbs", "title", "description", "meta", "actions"]) expect(screen.getByTestId(id)).toHaveClass("c");
      expect(screen.getByTestId("root")).toHaveClass(styles.root!);
      expect(screen.getByTestId("crumbs")).toHaveClass(styles.breadcrumbs!);
      expect(screen.getByTestId("meta")).toHaveClass(styles.meta!);
      expect(screen.getByTestId("actions")).toHaveClass(styles.actions!);
      expect(screen.getByTestId("root")).toHaveAttribute("id", "root");
      expect(screen.getByTestId("title")).toHaveAttribute("id", "title-id");
      expect(screen.getByTestId("root")).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });

    it("passes a native attribute straight through", () => {
      render(
        <PageHeader aria-label="Page head" data-testid="header">
          <PageHeader.Title>Title</PageHeader.Title>
        </PageHeader>,
      );
      expect(screen.getByTestId("header")).toHaveAttribute("aria-label", "Page head");
    });
  });

  it("renders an empty header without throwing or warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { container } = render(<PageHeader />);
    expect(container.firstElementChild?.children).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  describe("accessibility", () => {
    it("has no violations with every part", async () => {
      const { container } = render(<Full />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as a header of a section, at a level below the page's", async () => {
      const { container } = render(
        <main>
          <h1>Page</h1>
          <PageHeader as="header" size="sm">
            <PageHeader.Title level={2}>Section</PageHeader.Title>
            <PageHeader.Actions>
              <button type="button">Edit</button>
            </PageHeader.Actions>
          </PageHeader>
        </main>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
