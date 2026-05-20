// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

// Vercel 环境下优先使用 SITE_URL，否则使用 VERCEL_URL
const siteUrl = process.env.SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://wincy-blog.vercel.app";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});