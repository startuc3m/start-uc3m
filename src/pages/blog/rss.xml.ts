import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'Blog de Start UC3M',
    description: 'Crónicas de eventos, comunidad, recursos y prensa de la asociación de emprendedores de la UC3M.',
    site: context.site ?? 'https://www.startuc3m.es',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      pubDate: p.data.date,
      author: p.data.author,
      categories: [p.data.category],
      link: `/blog/${p.id}/`,
    })),
  });
};
