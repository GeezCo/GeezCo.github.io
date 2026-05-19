const vercelUrl =
  typeof import.meta.env !== "undefined" && import.meta.env.VERCEL_URL
    ? `https://${import.meta.env.VERCEL_URL}`
    : undefined;

export const site = {
  title: "Wincy 的博客",
  description: "记录技术与生活",
  author: "Wincy",
  lang: "zh-CN",
  url:
    import.meta.env.SITE_URL ?? vercelUrl ?? "http://localhost:4321",
};