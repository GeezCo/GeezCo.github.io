import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "../site.config";

export async function GET(context) {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id.replace(/\.md$/, "")}`,
    })),
    customData: `<language>${site.lang}</language>`,
  });
}