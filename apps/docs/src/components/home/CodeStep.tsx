import { CodeBlock } from "@dbm-system/components";

/**
 * One snippet of the home page's steps, with a copy button. A React island because the copy button needs one. `copyLabel` names that button
 * for what it copies, so a page of several snippets does not hold several buttons called "Copy code".
 */
export function CodeStep({ code, language, label, copyLabel }: { code: string; language: string; label: string; copyLabel: string }) {
  return <CodeBlock code={code} language={language} copyable aria-label={label} labels={{ copy: copyLabel }} />;
}
