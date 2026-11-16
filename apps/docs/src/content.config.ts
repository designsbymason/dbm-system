// The site's prose (ADR-0171: MDX for prose): `docs` are the pages under /docs, `pages` the Resources and AI agents
// pages at the root (ADR-0213). Plain Markdown in MDX files, so each page's Markdown copy is its own source.
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const page = z.object({
  title: z.string(),
  /** One sentence: the page's meta description and the line under its title. */
  description: z.string(),
});

export const collections = {
  docs: defineCollection({ loader: glob({ pattern: "*.mdx", base: "./src/content/docs" }), schema: page }),
  pages: defineCollection({ loader: glob({ pattern: "*.mdx", base: "./src/content/pages" }), schema: page }),
};
