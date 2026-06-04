import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    locked: z.boolean().default(false),
    password: z.string().optional(),
    heroImage: z.string().optional(),
    legacySlug: z.string().optional(),
  }),
});

const docs = defineCollection({
  loader: glob({
    base: "./src/content/docs",
    pattern: "**/*.md",
    generateId: ({ entry, base }) => {
      // 生成相对于 base 的路径作为 id（不含 .md 扩展名）
      return entry.replace(base + '/', '').replace(/\.md$/, '');
    }
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    order: z.number().default(999),
  }),
});

export const collections = { blog, docs };