import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { Menubar } from "./Menubar";

function Basic({
  root,
  content,
  children,
}: {
  root?: Omit<React.ComponentProps<typeof Menubar>, "children">;
  content?: Omit<React.ComponentProps<typeof Menubar.Content>, "children">;
  children?: React.ReactNode;
}) {
  return (
    <Menubar aria-label="Application menu" {...root}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content {...content}>
          {children ?? (
            <>
              <Menubar.Item>New</Menubar.Item>
              <Menubar.Item>Open</Menubar.Item>
              <Menubar.Item>Save</Menubar.Item>
            </>
          )}
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
          <Menubar.Item>Redo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="view">
        <Menubar.Trigger disabled>View</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Zoom</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  );
}

const noRegion = { rules: { region: { enabled: false } } };
const file = () => screen.getByRole("menuitem", { name: "File" });
const edit = () => screen.getByRole("menuitem", { name: "Edit" });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Menubar", () => {
  describe("the bar", () => {
    it("is a menubar of triggers, each a menuitem that has a menu and is closed", () => {
      render(<Basic />);
      expect(
        screen.getByRole("menubar", { name: "Application menu" }),
      ).toBeInTheDocument();
      expect(file()).toHaveAttribute("aria-haspopup", "menu");
      expect(file()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("forwards its ref to the bar and passes className, style, id and data-testid", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Basic
          root={{
            ref,
            className: "x",
            style: { color: "red" },
            id: "bar",
            "data-testid": "bar",
          }}
        />,
      );
      expect(ref.current).toBe(screen.getByTestId("bar"));
      expect(ref.current).toHaveClass("x");
      expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(ref.current).toHaveAttribute("id", "bar");
    });

    it("keeps its own role when a role is passed", () => {
      render(<Basic root={{ role: "toolbar" } as never} />);
      expect(screen.getByRole("menubar")).toBeInTheDocument();
    });

    it("is one tab stop", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Basic />
          <button>after</button>
        </>,
      );
      await user.tab();
      await user.tab();
      expect(file()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(file()).toHaveFocus();
    });
  });

  describe("opening and closing", () => {
    it("opens a menu on a press and marks the trigger expanded", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(file());
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(file()).toHaveAttribute("aria-expanded", "true");
      expect(file()).toHaveAttribute("data-state", "open");
      expect(
        screen.getAllByRole("menuitem", { name: /New|Open|Save/ }),
      ).toHaveLength(3);
    });

    it("opens on Enter, Space and ArrowDown onto the first item", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      file().focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: "New" })).toHaveFocus(),
      );
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
      expect(file()).toHaveFocus();
      await user.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: "New" })).toHaveFocus(),
      );
    });

    it("opens on ArrowUp onto the last item", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      file().focus();
      await user.keyboard("{ArrowUp}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: "Save" })).toHaveFocus(),
      );
    });

    it("closes on Escape and gives focus back to the trigger", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(file());
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
      expect(file()).toHaveFocus();
    });

    it("closes when an item is chosen, and reports the choice", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Basic>
          <Menubar.Item onSelect={onSelect}>New</Menubar.Item>
        </Basic>,
      );
      await user.click(file());
      await user.click(await screen.findByRole("menuitem", { name: "New" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
    });

    it("does not open a disabled trigger", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(screen.getByRole("menuitem", { name: "View" }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("moving between menus", () => {
    it("moves focus between triggers with ArrowRight and ArrowLeft, wrapping and skipping a disabled one", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      file().focus();
      await user.keyboard("{ArrowRight}");
      expect(edit()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(file()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(edit()).toHaveFocus();
    });

    it("does not wrap when loop is off", async () => {
      const user = userEvent.setup();
      render(<Basic root={{ loop: false }} />);
      edit().focus();
      await user.keyboard("{ArrowRight}");
      expect(edit()).toHaveFocus();
    });

    it("mirrors the arrows in a right-to-left bar", async () => {
      const user = userEvent.setup();
      render(<Basic root={{ dir: "rtl" }} />);
      file().focus();
      await user.keyboard("{ArrowLeft}");
      expect(edit()).toHaveFocus();
    });

    it("moves to the next menu with the arrow keys while one is open", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(file());
      await screen.findByRole("menu");
      await user.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(edit()).toHaveAttribute("aria-expanded", "true"),
      );
      expect(file()).toHaveAttribute("aria-expanded", "false");
      expect(screen.getAllByRole("menu")).toHaveLength(1);
    });

    it("switches to another menu when the pointer moves onto its trigger", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(file());
      await screen.findByRole("menu");
      await user.hover(edit());
      await waitFor(() =>
        expect(edit()).toHaveAttribute("aria-expanded", "true"),
      );
    });
  });

  describe("value", () => {
    it("opens the menu named by defaultValue", async () => {
      render(<Basic root={{ defaultValue: "edit" }} />);
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(edit()).toHaveAttribute("aria-expanded", "true");
    });

    it("reports the name of the menu that opened and an empty value when it closes", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Basic root={{ onValueChange }} />);
      await user.click(edit());
      expect(onValueChange).toHaveBeenLastCalledWith("edit");
      await user.keyboard("{Escape}");
      expect(onValueChange).toHaveBeenLastCalledWith("");
    });

    it("is driven from outside when controlled, and does not open on its own", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [value, setValue] = useState("");
        return (
          <>
            <button onClick={() => setValue("file")}>open file</button>
            <Basic root={{ value, onValueChange: () => undefined }} />
            <output>{value}</output>
          </>
        );
      }
      render(<Controlled />);
      await user.click(file());
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "open file" }));
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("reports when a menu has finished opening and closing", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn();
      render(<Basic root={{ onOpenChangeComplete }} />);
      await user.click(file());
      await waitFor(() =>
        expect(onOpenChangeComplete).toHaveBeenCalledWith("file", true),
      );
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(onOpenChangeComplete).toHaveBeenCalledWith("file", false),
      );
    });
  });

  describe("items", () => {
    it("draws the shared item parts: checkbox, radio, label, group, separator and a submenu", async () => {
      const user = userEvent.setup();
      render(
        <Menubar aria-label="Application menu">
          <Menubar.Menu value="view">
            <Menubar.Trigger>View</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Label>Panels</Menubar.Label>
              <Menubar.CheckboxItem defaultChecked>
                Sidebar
              </Menubar.CheckboxItem>
              <Menubar.Separator />
              <Menubar.RadioGroup defaultValue="list">
                <Menubar.RadioItem value="list">List</Menubar.RadioItem>
                <Menubar.RadioItem value="grid">Grid</Menubar.RadioItem>
              </Menubar.RadioGroup>
              <Menubar.Sub>
                <Menubar.SubTrigger>Zoom</Menubar.SubTrigger>
                <Menubar.SubContent>
                  <Menubar.Item>In</Menubar.Item>
                </Menubar.SubContent>
              </Menubar.Sub>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>,
      );
      await user.click(screen.getByRole("menuitem", { name: "View" }));
      expect(
        await screen.findByRole("menuitemcheckbox", { name: "Sidebar" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "List" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "Grid" }),
      ).toHaveAttribute("aria-checked", "false");
      await user.click(screen.getByRole("menuitemradio", { name: "Grid" }));
    });

    it("waits for a promise from onSelect before it closes", async () => {
      const user = userEvent.setup();
      let resolve: () => void = () => undefined;
      const pending = new Promise<void>((done) => {
        resolve = done;
      });
      render(
        <Basic>
          <Menubar.Item onSelect={() => pending}>Save</Menubar.Item>
        </Basic>,
      );
      await user.click(file());
      await user.click(await screen.findByRole("menuitem", { name: "Save" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await act(async () => resolve());
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
    });

    it("takes the bar's size for its menus unless the content sets its own", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Basic root={{ size: "xl" }} />);
      await user.click(file());
      const className = (await screen.findByRole("menu")).className;
      rerender(<Basic root={{ size: "xl" }} content={{ size: "xs" }} />);
      expect((await screen.findByRole("menu")).className).not.toBe(className);
    });
  });

  describe("attributes Radix computes", () => {
    it("keeps the bar's role, a trigger's role and popup state and a panel's role when the same props are passed", async () => {
      const user = userEvent.setup();
      render(
        <Menubar aria-label="x" role="presentation">
          <Menubar.Menu value="a">
            <Menubar.Trigger
              role="button"
              aria-haspopup="dialog"
              aria-expanded={true}
            >
              A
            </Menubar.Trigger>
            <Menubar.Content role="listbox" aria-orientation="horizontal">
              <Menubar.Item>One</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>,
      );
      expect(screen.getByRole("menubar")).toBeInTheDocument();
      const trigger = screen.getByRole("menuitem", { name: "A" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.click(trigger);
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("composition", () => {
    it("opens from inside a Dialog and leaves the dialog open when an item is chosen", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Title>Editor</Dialog.Title>
            <Basic />
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(file());
      await user.click(await screen.findByRole("menuitem", { name: "New" }));
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("survives StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Basic />
        </StrictMode>,
      );
      await user.click(file());
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    });

    it("warns when a menu is drawn outside a bar", () => {
      const warn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      expect(() =>
        render(
          <Menubar.Menu value="x">
            <span>nothing</span>
          </Menubar.Menu>,
        ),
      ).toThrow();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("Menubar.Menu"),
      );
    });
  });

  describe("accessibility", () => {
    it("has no violations closed", async () => {
      const { container } = render(<Basic />);
      expect(await axe(container, noRegion)).toHaveNoViolations();
    });

    it("has no violations with a menu open", async () => {
      const user = userEvent.setup();
      const { container } = render(<Basic />);
      await user.click(file());
      const menu = await screen.findByRole("menu");
      expect(await axe(container, noRegion)).toHaveNoViolations();
      expect(await axe(menu, noRegion)).toHaveNoViolations();
      expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    });
  });
});
