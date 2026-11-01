import { DotsThreeIcon } from "@dbm-system/icons";
import { menuSharedParts } from "../../internal/menu/menuParts";
import { MORE_MENU, type MenubarItemInfo } from "./MenubarContext";
import { MenubarContent } from "./MenubarContent";
import { MenubarMenu } from "./MenubarMenu";
import { MenubarTrigger } from "./MenubarTrigger";

/** The menu that holds the menus and actions that did not fit: each menu is a submenu, each action an item. */
export function MenubarMoreMenu({
  hidden,
  label,
}: {
  hidden: MenubarItemInfo[];
  label: string;
}) {
  return (
    <MenubarMenu value={MORE_MENU}>
      <MenubarTrigger
        icon={DotsThreeIcon}
        data-menubar-more=""
        aria-label={label}
        title={label}
      />
      <MenubarContent>
        {hidden.map((item, index) =>
          item.kind === "menu" ? (
            <menuSharedParts.Sub key={item.value ?? index}>
              <menuSharedParts.SubTrigger
                icon={item.icon}
                disabled={item.disabled}
              >
                {item.label}
              </menuSharedParts.SubTrigger>
              <menuSharedParts.SubContent size={item.contentSize}>
                {item.content}
              </menuSharedParts.SubContent>
            </menuSharedParts.Sub>
          ) : (
            <menuSharedParts.Item
              key={index}
              icon={item.icon}
              disabled={item.disabled}
              onSelect={(event) => item.onSelect?.(event)}
            >
              {item.label}
            </menuSharedParts.Item>
          ),
        )}
      </MenubarContent>
    </MenubarMenu>
  );
}
