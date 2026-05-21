// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import vercel from '@astrojs/vercel';

// Vercel 环境下优先使用 VERCEL_PROJECT_PRODUCTION_URL（正确的 Production URL）
const siteUrl = process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://wincy-blog.vercel.app";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'hybrid',
  adapter: vercel(),
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});