import { Button, Dialog, Input, Select, Tabs, ToggleGroup } from "@dbm-system/components";
import { TrashIcon } from "@dbm-system/icons";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Excerpt } from "./agentExcerpts";
import styles from "./AgentDemo.module.css";

/** The live components, written as the `jsx` of each demo in agentDemos.ts says (that text is shown under each one). */
const live: Record<string, () => ReactNode> = {
  Button: () => (
    <Button variant="destructive" size="lg" leadingIcon={TrashIcon}>
      Delete
    </Button>
  ),
  Input: () => <Input type="email" size="lg" hasError defaultValue="ada@example" aria-label="Email" />,
  Select: () => (
    <Select defaultValue="pro" size="lg" aria-label="Plan">
      <Select.Option value="free">Free</Select.Option>
      <Select.Option value="pro">Pro</Select.Option>
    </Select>
  ),
  Dialog: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Edit profile</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Edit profile</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="secondary">Done</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The example's code, with every name the manifest entry on the other side highlights marked here too. */
function Code({ excerpt, active, setActive }: { excerpt: Excerpt; active: string | null; setActive: (name: string | null) => void }) {
  const names = [...excerpt.used].sort((a, b) => b.length - a.length).map(escape);
  // A name is a whole word: not part of a longer name, a path or a hyphenated word.
  const pieces = excerpt.jsx.split(new RegExp(`(?<![\\w.-])(${names.join("|")})(?![\\w-])`));
  return (
    <pre className={styles.code}>
      <code>
        {pieces.map((piece, index) =>
          index % 2 === 1 ? (
            <mark
              key={index}
              className={[styles.mark, active === piece && styles.active].filter(Boolean).join(" ")}
              onMouseEnter={() => setActive(piece)}
              onMouseLeave={() => setActive(null)}
            >
              {piece}
            </mark>
          ) : (
            piece
          ),
        )}
      </code>
    </pre>
  );
}

/** What the trimmed entry holds, in words: "3 of 19 props", "6 of 8 parts, without their own props". */
function trimmed(excerpt: Excerpt): string {
  const parts: string[] = [];
  if (excerpt.propsUsed > 0) parts.push(`${excerpt.propsUsed} of ${excerpt.propsTotal} props`);
  if (excerpt.partsUsed > 0) {
    parts.push(
      excerpt.partsTotal === 1 ? "its 1 part, without its own props" : `${excerpt.partsUsed} of ${excerpt.partsTotal} parts, without their own props`,
    );
  }
  return parts.join(" and ");
}

function Pane({ excerpt }: { excerpt: Excerpt }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={styles.panes}>
      <div className={styles.draws} role="group" aria-label="What it draws">
        <h3 className={styles.caption}>What it draws</h3>
        <div className={styles.stage}>{live[excerpt.name]?.()}</div>
        <Code excerpt={excerpt} active={active} setActive={setActive} />
      </div>
      <div className={styles.reads} role="group" aria-label="What the agent reads">
        <h3 className={styles.caption}>What the agent reads</h3>
        <pre className={styles.json}>
          <code>
            {excerpt.segments.map((segment, index) =>
              segment.key ? (
                <span
                  key={index}
                  className={[styles.entry, active === segment.key && styles.active].filter(Boolean).join(" ")}
                  onMouseEnter={() => setActive(segment.key ?? null)}
                  onMouseLeave={() => setActive(null)}
                >
                  {segment.text}
                </span>
              ) : (
                segment.text
              ),
            )}
          </code>
        </pre>
        <p className={styles.note}>
          The real file, <code>{excerpt.file}</code>, trimmed to what this example uses: {trimmed(excerpt)}.
        </p>
      </div>
    </div>
  );
}

/**
 * Section 2 of the home page: a component the reader picks, drawn live beside the manifest entry an agent reads for it, with what the
 * example uses highlighted in both. Below the medium step the two are one pane at a time, with a switch. The entries arrive as props,
 * read from the built manifest, so the first one is in the page's HTML before any script runs.
 */
export function AgentDemo({ excerpts }: { excerpts: Excerpt[] }) {
  const [pick, setPick] = useState(excerpts[0]?.name ?? "");
  const [view, setView] = useState("draws");
  return (
    <div className={styles.demo} data-view={view}>
      <Tabs value={pick} onValueChange={setPick} variant="underline" size="sm">
        <Tabs.List aria-label="Component">
          {excerpts.map((excerpt) => (
            <Tabs.Trigger key={excerpt.name} value={excerpt.name}>
              {excerpt.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className={styles.switch}>
          <ToggleGroup aria-label="Pane" value={view} onValueChange={(value) => value && setView(value)} size="sm">
            <ToggleGroup.Item value="draws">Draws</ToggleGroup.Item>
            <ToggleGroup.Item value="reads">Reads</ToggleGroup.Item>
          </ToggleGroup>
        </div>
        {excerpts.map((excerpt) => (
          <Tabs.Content key={excerpt.name} value={excerpt.name}>
            <Pane excerpt={excerpt} />
          </Tabs.Content>
        ))}
      </Tabs>
    </div>
  );
}
