import { Button, IconButton } from "@dbm-system/components";
import { MoonIcon, SunIcon } from "@dbm-system/icons";
import { useEffect, useRef, useState } from "react";
import { applyMode, readMode, type SiteMode } from "./mode";

/**
 * The mode control (ADR-0223): one button that switches between light and dark, named for what it will do. It starts in
 * the stored mode (light on a first visit), and the choice is remembered and shared with Storybook. With `labelled` it
 * is a button with its words showing, for the menu panel on a phone, where there is no tooltip to read an icon from.
 */
export function ModeToggle({ labelled = false }: { labelled?: boolean }) {
  const [mode, setMode] = useState<SiteMode>("light");
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setMode(readMode()), []);

  const next: SiteMode = mode === "dark" ? "light" : "dark";
  const name = `Switch to ${next} mode`;
  const icon = next === "dark" ? MoonIcon : SunIcon;
  const toggle = () => {
    const box = trigger.current?.getBoundingClientRect();
    setMode(next);
    applyMode(next, box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined);
  };

  if (labelled) {
    return (
      <Button ref={trigger} variant="ghost" size="sm" leadingIcon={icon} onClick={toggle}>
        {name}
      </Button>
    );
  }
  return <IconButton ref={trigger} icon={icon} aria-label={name} tooltip={name} variant="ghost" size="sm" onClick={toggle} />;
}
