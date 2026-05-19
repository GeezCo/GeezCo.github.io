// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || "https://YOUR_PROJECT.vercel.app",
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});