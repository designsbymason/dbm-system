import { CodeBlock, Tabs } from "@dbm-system/components";
import { useEffect, useState } from "react";

const packages = "@dbm-system/components @dbm-system/tokens @dbm-system/icons";
const managers = [
  { id: "pnpm", command: `pnpm add ${packages}` },
  { id: "npm", command: `npm install ${packages}` },
  { id: "yarn", command: `yarn add ${packages}` },
  { id: "bun", command: `bun add ${packages}` },
];
const KEY = "dbm-package-manager";
const CHANGED = "dbm-package-manager-change";

/** The install line, in the reader's package manager (remembered), with a copy button. */
export function InstallLine() {
  const [manager, setManager] = useState("pnpm");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && managers.some((m) => m.id === saved)) setManager(saved);
    } catch {
      // Not remembered; pnpm stays the default.
    }
    // Another install line on the page (the hero's and the steps') follows a choice made in this one.
    const follow = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (managers.some((m) => m.id === value)) setManager(value);
    };
    window.addEventListener(CHANGED, follow);
    return () => window.removeEventListener(CHANGED, follow);
  }, []);

  const choose = (value: string) => {
    setManager(value);
    window.dispatchEvent(new CustomEvent(CHANGED, { detail: value }));
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // Not remembered.
    }
  };

  return (
    <Tabs value={manager} onValueChange={choose} variant="underline" size="sm">
      <Tabs.List aria-label="Package manager">
        {managers.map((m) => (
          <Tabs.Trigger key={m.id} value={m.id}>
            {m.id}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {managers.map((m) => (
        <Tabs.Content key={m.id} value={m.id}>
          <CodeBlock code={m.command} language="bash" copyable aria-label={`Install with ${m.id}`} />
        </Tabs.Content>
      ))}
    </Tabs>
  );
}
