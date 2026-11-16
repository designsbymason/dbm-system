// Every docs page as Markdown, at its own address with `.md` (ADR-0213): its source, which is plain Markdown, under
// its title and description, for an agent to read.
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection("docs")).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection<"docs">>>[number] };
  const body = `# ${entry.data.title}\n\n${entry.data.description}\n\n${(entry.body ?? "").trim()}\n`;
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
};
