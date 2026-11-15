import { IconButton, Menu } from "@dbm-system/components";
import { DesktopIcon, MoonIcon, SunIcon } from "@dbm-system/icons";
import { useEffect, useRef, useState } from "react";
import { applyMode, readMode, type SiteMode } from "./mode";

const icons = { light: SunIcon, dark: MoonIcon, system: DesktopIcon } as const;
const names: Record<SiteMode, string> = { light: "Light", dark: "Dark", system: "System" };

/** Light, dark or system: the one reader control the site has. */
export function ModeMenu() {
  const [mode, setMode] = useState<SiteMode>("system");
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMode(readMode());
    // In system mode, follow the operating system when it changes.
    const query = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => readMode() === "system" && applyMode("system");
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  const choose = (value: string) => {
    const next = value as SiteMode;
    const box = trigger.current?.getBoundingClientRect();
    setMode(next);
    applyMode(next, box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined);
  };

  return (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton ref={trigger} icon={icons[mode]} aria-label={`Colour mode: ${names[mode]}`} tooltip="Colour mode" variant="ghost" tone="neutral" size="sm" />
      </Menu.Trigger>
      <Menu.Content align="end" aria-label="Colour mode">
        <Menu.RadioGroup value={mode} onValueChange={choose} aria-label="Colour mode">
          {(Object.keys(names) as SiteMode[]).map((value) => (
            <Menu.RadioItem key={value} value={value} icon={icons[value]}>
              {names[value]}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu>
  );
}
