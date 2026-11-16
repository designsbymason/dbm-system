// The root pages as Markdown, at their own address with `.md` (ADR-0213).
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection("pages")).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection<"pages">>>[number] };
  const body = `# ${entry.data.title}\n\n${entry.data.description}\n\n${(entry.body ?? "").trim()}\n`;
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
};
