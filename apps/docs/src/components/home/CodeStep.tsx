import { CodeBlock } from "@dbm-system/components";

/** One snippet of the home page's steps, with a copy button. A React island because the copy button needs one. */
export function CodeStep({ code, language, label }: { code: string; language: string; label: string }) {
  return <CodeBlock code={code} language={language} copyable aria-label={label} />;
}
