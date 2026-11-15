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
  }, []);

  const choose = (value: string) => {
    setManager(value);
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
